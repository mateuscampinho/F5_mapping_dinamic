import logging
from app.services.f5_client import F5Client
from app.utils.helpers import normalize_name, short_name

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Dashboard summary (all VSs)
# ---------------------------------------------------------------------------

def collect_all_vs(client: F5Client, partition: str = "Common") -> list[dict]:
    resp = client.get_ltm(
        "virtual?$select=name,fullPath,partition,destination,pool,ipProtocol,enabled,description"
    )
    vs_list = resp.get("items", [])
    for vs in vs_list:
        pool_name = vs.get("pool")
        vs["_poolInfo"] = _get_pool_summary(client, pool_name, partition) if pool_name else {
            "name": None, "memberCount": 0, "availableCount": 0, "offlineCount": 0
        }
    return vs_list


def _get_pool_summary(client, pool_name, partition):
    norm = normalize_name(pool_name, partition)
    info = {"name": short_name(pool_name), "memberCount": 0, "availableCount": 0, "offlineCount": 0}
    try:
        members = client.get_ltm(f"pool/{norm}/members").get("items", [])
        info["memberCount"] = len(members)
        avail = sum(1 for m in members if _member_availability(m) == "available")
        info["availableCount"] = avail
        info["offlineCount"] = len(members) - avail
    except Exception as exc:
        logger.warning("Pool summary %s: %s", pool_name, exc)
    return info


# ---------------------------------------------------------------------------
# Full VS data for flowchart
# ---------------------------------------------------------------------------

def collect_vs_data(client: F5Client, vs_name: str, partition: str = "Common") -> dict:
    norm_vs = normalize_name(vs_name, partition)
    vs = client.get_ltm(f"virtual/{norm_vs}")

    profiles  = _get_profiles(client, norm_vs)
    policies  = _get_policies_with_rules(client, norm_vs, partition)
    irules    = _get_irule_contents(client, vs.get("rules") or [], partition)

    # Collect all node objects (for IP → name resolution)
    node_map = _get_node_map(client)

    # Determine all unique pool + node targets
    pool_paths   = set()
    direct_nodes = {}   # nodeKey → node dict

    default_pool_path = vs.get("pool")
    if default_pool_path:
        pool_paths.add(default_pool_path)

    for policy in policies:
        for rule in policy.get("_rules", []):
            target = rule.get("_targetPool")
            node_ip = rule.get("_targetNodeIp")
            if target:
                pool_paths.add(target)
            elif node_ip:
                # Resolve IP to node full path
                node_info = node_map.get(node_ip)
                if node_info:
                    direct_nodes[node_ip] = node_info
                else:
                    direct_nodes[node_ip] = {"name": node_ip, "fullPath": node_ip,
                                              "address": node_ip, "health": "unknown", "session": "unknown"}

    # Fetch pool data
    pools = {}
    for path in pool_paths:
        pool_data, members = _get_pool_with_members(client, path, partition, node_map)
        if pool_data:
            pools[path] = {"pool": pool_data, "members": members}

    return {
        "vs": vs,
        "profiles": profiles,
        "policies": policies,
        "irules": irules,
        "pools": pools,
        "direct_nodes": direct_nodes,
        "default_pool_path": default_pool_path,
    }


# ---------------------------------------------------------------------------
# Nodes (servers) lookup
# ---------------------------------------------------------------------------

def _get_node_map(client: F5Client) -> dict:
    """Returns {ip_address: {name, fullPath, address, health, session}} for all LTM nodes."""
    node_map = {}
    try:
        items = client.get_ltm("node").get("items", [])

        # Fetch all node stats in a single call instead of one per node
        bulk_stats = {}
        try:
            stats_resp = client.get_ltm("node/stats")
            for url_key, url_val in stats_resp.get("entries", {}).items():
                ne = url_val.get("nestedStats", {}).get("entries", {})
                addr = ne.get("addr", {}).get("description", "")
                if not addr:
                    continue
                bulk_stats[addr] = {
                    "health": ne.get("status.availabilityState", {}).get("description", "unknown"),
                    "session": ne.get("sessionStatus", {}).get("description", "unknown"),
                    "enabledState": ne.get("status.enabledState", {}).get("description", "unknown"),
                }
        except Exception as exc:
            logger.warning("Node bulk stats: %s", exc)

        for n in items:
            addr = n.get("address", "")
            stats = bulk_stats.get(addr, {})
            node_map[addr] = {
                "name": short_name(n.get("fullPath", n.get("name", addr))),
                "fullPath": n.get("fullPath", n.get("name", addr)),
                "address": addr,
                "health": stats.get("health") or _availability_from_states(n.get("state", ""), n.get("session", "")),
                "session": stats.get("session", n.get("session", "unknown")),
                "enabledState": stats.get("enabledState", "unknown"),
            }
    except Exception as exc:
        logger.warning("Node map: %s", exc)
    return node_map


# ---------------------------------------------------------------------------
# Profiles
# ---------------------------------------------------------------------------

def _get_profiles(client, norm_vs):
    try:
        return client.get_ltm(f"virtual/{norm_vs}/profiles").get("items", [])
    except Exception as exc:
        logger.warning("Profiles %s: %s", norm_vs, exc)
        return []


# ---------------------------------------------------------------------------
# Policies + Rules
# ---------------------------------------------------------------------------

def _get_policies_with_rules(client, norm_vs, partition):
    try:
        refs = client.get_ltm(f"virtual/{norm_vs}/policies").get("items", [])
    except Exception as exc:
        logger.warning("Policies %s: %s", norm_vs, exc)
        return []

    policies = []
    for ref in refs:
        path = ref.get("fullPath") or ref.get("name", "")
        norm = normalize_name(path, partition)
        try:
            detail = client.get_ltm(f"policy/{norm}")
            # Normalize strategy: "/Common/first-match" → "first-match"
            strat = detail.get("strategy", "")
            if isinstance(strat, str):
                detail["_strategy"] = strat.split("/")[-1]
            detail["_rules"] = _get_policy_rules(client, norm)
            policies.append(detail)
        except Exception as exc:
            logger.warning("Policy %s: %s", norm, exc)
            ref["_rules"] = []
            policies.append(ref)
    return policies


def _get_policy_rules(client, norm_policy):
    try:
        rules = client.get_ltm(f"policy/{norm_policy}/rules").get("items", [])
    except Exception:
        return []

    enriched = []
    for rule in sorted(rules, key=lambda r: r.get("ordinal", 999)):
        try:
            detail = client.get_ltm(
                f"policy/{norm_policy}/rules/{rule['name']}",
                params={"expandSubcollections": "true"},
            )
        except Exception:
            detail = rule

        # Extract target pool or node
        target_pool, target_node_ip = _extract_rule_target(detail)
        detail["_targetPool"]   = target_pool
        detail["_targetNodeIp"] = target_node_ip
        enriched.append(detail)
    return enriched


def _extract_rule_target(rule: dict):
    """Returns (pool_path_or_None, node_ip_or_None)."""
    actions_raw = rule.get("actionsReference") or rule.get("actions") or []
    if isinstance(actions_raw, dict):
        actions = actions_raw.get("items", [])
    else:
        actions = actions_raw if isinstance(actions_raw, list) else []

    for a in actions:
        if not isinstance(a, dict):
            continue
        # Pool target
        pool = a.get("pool")
        if isinstance(pool, str) and pool:
            return pool, None
        fwd = a.get("forward")
        if isinstance(fwd, dict):
            p = fwd.get("pool")
            if isinstance(p, str):
                return p, None
        # Node target (IP address)
        node = a.get("node")
        if isinstance(node, str) and node:
            return None, node
    return None, None


# ---------------------------------------------------------------------------
# iRules
# ---------------------------------------------------------------------------

def _get_irule_contents(client, rule_refs, partition):
    irules = []
    for ref in rule_refs:
        name = ref if isinstance(ref, str) else ref.get("name", "")
        norm = normalize_name(name, partition)
        try:
            detail = client.get_ltm(f"rule/{norm}")
            irules.append({"name": short_name(name), "fullPath": name,
                           "content": detail.get("apiAnonymous", "")})
        except Exception:
            irules.append({"name": short_name(name), "fullPath": name,
                           "content": "[Content unavailable]"})
    return irules


# ---------------------------------------------------------------------------
# Pool + Members
# ---------------------------------------------------------------------------

def _get_pool_with_members(client, pool_name, partition, node_map):
    norm = normalize_name(pool_name, partition)
    try:
        pool = client.get_ltm(f"pool/{norm}")
    except Exception as exc:
        logger.warning("Pool %s: %s", pool_name, exc)
        return None, []

    raw_members = []
    try:
        raw_members = client.get_ltm(f"pool/{norm}/members").get("items", [])
    except Exception:
        pass

    # Build stats map keyed by fullPath
    stats_map = {}
    try:
        stats_resp = client.get_ltm(f"pool/{norm}/members/stats")
        stats_map = _parse_member_stats(stats_resp)
    except Exception:
        pass

    enriched = []
    for m in raw_members:
        fp = m.get("fullPath", m.get("name", ""))
        stats = stats_map.get(fp, {})

        # Member health: prefer stats, fallback to member object
        avail = stats.get("availabilityState") or _member_availability(m)
        session_desc = stats.get("sessionStatus") or m.get("session", "unknown")
        monitor_status = stats.get("monitorStatus", "unknown")

        # Node health from node_map
        addr = m.get("address", "")
        node_info = node_map.get(addr, {})

        m["healthStatus"]   = avail
        m["sessionStatus"]  = session_desc
        m["monitorStatus"]  = monitor_status
        m["nodeHealth"]     = node_info.get("health", "unknown")
        m["nodeSession"]    = node_info.get("session", "unknown")
        m["nodeEnabled"]    = node_info.get("enabledState", "unknown")
        enriched.append(m)

    return pool, enriched


def _parse_member_stats(stats_resp: dict) -> dict:
    """Returns {fullPath: {availabilityState, sessionStatus, monitorStatus}}."""
    result = {}
    for url_key, url_val in stats_resp.get("entries", {}).items():
        ne = url_val.get("nestedStats", {}).get("entries", {})

        avail   = ne.get("status.availabilityState", {}).get("description", "unknown")
        session = ne.get("sessionStatus", {}).get("description", "unknown")
        monitor = ne.get("monitorStatus", {}).get("description", "unknown")
        pool_n  = ne.get("poolName", {}).get("description", "")
        node_n  = ne.get("nodeName", {}).get("description", "")

        # Derive fullPath from URL key: .../members/~Common~BWA:0/stats → /Common/BWA:0
        import re
        m = re.search(r"/members/([^/]+)/stats", url_key)
        if m:
            raw = m.group(1).replace("~", "/")
            if not raw.startswith("/"):
                raw = "/" + raw
            result[raw] = {"availabilityState": avail, "sessionStatus": session, "monitorStatus": monitor}

    return result


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _member_availability(member: dict) -> str:
    """Derive health from member object state/session fields (no stats needed)."""
    state   = member.get("state", "")
    session = member.get("session", "")
    if state in ("up",):
        return "available"
    if state in ("down", "user-down"):
        return "offline"
    return "unknown"


def _availability_from_states(state: str, session: str) -> str:
    if state == "up":
        return "available"
    if state in ("down", "user-down"):
        return "offline"
    return "unknown"


def _first_nested_entries(stats_resp: dict) -> dict:
    """Extract the first nestedStats.entries block from a stats response."""
    for v in stats_resp.get("entries", {}).values():
        return v.get("nestedStats", {}).get("entries", {})
    return {}
