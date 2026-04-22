import re
from app.models.graph_models import FlowNode, FlowEdge, NodeData, NodePosition
from app.utils.helpers import short_name, partition_from_path

EARLY_EVENTS = ["CLIENT_ACCEPTED", "TCP_CLIENT_CONNECTED", "CLIENT_DATA"]
LATE_EVENTS  = ["HTTP_REQUEST", "HTTP_RESPONSE", "HTTP_REQUEST_SEND",
                "HTTP_RESPONSE_RELEASE", "LB_SELECTED", "LB_FAILED", "SERVER_DATA"]

X_CENTER = 500
X_POOL_STEP = 310
Y_VS        = 0
Y_EARLY     = 170
Y_DECISION  = 340
Y_LATE      = 500
Y_POOL      = 660
Y_MEMBER    = 850


def _id(prefix, name):
    return f"{prefix}_{re.sub(r'[^a-zA-Z0-9_]', '_', str(name))}"


def build_graph(raw_data: dict) -> tuple[list[FlowNode], list[FlowEdge]]:
    nodes: list[FlowNode] = []
    edges: list[FlowEdge] = []
    counter = [0]

    def eid():
        counter[0] += 1
        return f"e{counter[0]}"

    def edge(src, tgt, label=None, animated=False, style=None):
        edges.append(FlowEdge(id=eid(), source=src, target=tgt,
                               label=label, animated=animated, style=style))

    vs            = raw_data["vs"]
    profiles      = raw_data["profiles"]
    policies      = raw_data["policies"]
    irules        = raw_data["irules"]
    pools         = raw_data["pools"]          # poolPath → {pool, members}
    direct_nodes  = raw_data["direct_nodes"]   # nodeIp   → node_info
    default_pool_path = raw_data["default_pool_path"]

    # ── VS node ──────────────────────────────────────────────────────────────
    dest_raw = vs.get("destination", "")
    destination = dest_raw.split("/")[-1] if dest_raw else ""
    snat_obj = vs.get("sourceAddressTranslation", {})
    snat_type = snat_obj.get("type") if isinstance(snat_obj, dict) else None
    profile_names = [p.get("name", "") for p in profiles if p.get("name")]

    vs_id = _id("vs", vs.get("fullPath", vs.get("name", "vs")))
    nodes.append(FlowNode(
        id=vs_id, type="virtualServer",
        position=NodePosition(x=X_CENTER, y=Y_VS),
        data=NodeData(
            label=short_name(vs.get("fullPath", vs.get("name", ""))),
            nodeType="virtualServer",
            destination=destination,
            source=vs.get("source"),
            partition=partition_from_path(vs.get("fullPath", "")),
            ipProtocol=vs.get("ipProtocol"),
            description=vs.get("description"),
            profiles=profile_names or None,
            snatType=snat_type,
        ),
    ))

    # ── iRules classification ────────────────────────────────────────────────
    early_irules, late_irules = _classify_irules(irules)

    early_nodes = _build_irule_nodes(early_irules, Y_EARLY)
    nodes.extend(early_nodes)

    prev = [vs_id]
    if early_nodes:
        for n in early_nodes:
            hint = (n.data.eventHints or [""])[0]
            edge(vs_id, n.id, label=hint or None, animated=True,
                 style={"stroke": "#a855f7", "strokeWidth": 2})
        prev = [n.id for n in early_nodes]

    # ── LTM Policy decision nodes ────────────────────────────────────────────
    decision_ids = []
    # (dec_id, target_key, label, is_default, is_node_target)
    pending_rule_edges: list[tuple] = []

    for policy in policies:
        p_id = _id("dec", policy.get("fullPath", policy.get("name", "policy")))
        strategy = policy.get("_strategy") or policy.get("strategy", "first-match")
        if isinstance(strategy, str):
            strategy = strategy.split("/")[-1]

        nodes.append(FlowNode(
            id=p_id, type="decision",
            position=NodePosition(x=X_CENTER, y=Y_DECISION),
            data=NodeData(
                label=short_name(policy.get("fullPath", policy.get("name", ""))),
                nodeType="decision",
                matchType=str(strategy),
            ),
        ))
        decision_ids.append(p_id)

        for src in prev:
            edge(src, p_id, style={"stroke": "#475569", "strokeWidth": 2})

        for rule in policy.get("_rules", []):
            cond_label = _build_condition_label(rule)
            target_pool   = rule.get("_targetPool")
            target_node_ip = rule.get("_targetNodeIp")
            if target_pool:
                pending_rule_edges.append((p_id, target_pool, cond_label, False, False))
            elif target_node_ip:
                pending_rule_edges.append((p_id, target_node_ip, cond_label, False, True))

        # "no match" → default pool (only if last rule has conditions, i.e. no catch-all)
        rules = policy.get("_rules", [])
        last_rule_is_catchall = rules and not _rule_has_conditions(rules[-1])
        if default_pool_path and not last_rule_is_catchall:
            pending_rule_edges.append((p_id, default_pool_path, "no match", True, False))

    if decision_ids:
        prev = decision_ids

    # ── Late iRules ──────────────────────────────────────────────────────────
    late_nodes = _build_irule_nodes(late_irules, Y_LATE)
    nodes.extend(late_nodes)
    if late_nodes:
        for n in late_nodes:
            hint = (n.data.eventHints or [""])[0]
            for src in prev:
                edge(src, n.id, label=hint or None,
                     style={"stroke": "#a855f7", "strokeWidth": 2})
        prev = [n.id for n in late_nodes]

    # ── Pool nodes ───────────────────────────────────────────────────────────
    pool_path_list = list(pools.keys())
    total_pools = len(pool_path_list)
    pool_node_ids: dict[str, str] = {}

    for i, pool_path in enumerate(pool_path_list):
        px = X_CENTER + (i - (total_pools - 1) / 2) * X_POOL_STEP
        pool_data = pools[pool_path]["pool"]
        members   = pools[pool_path]["members"]
        p_id = _id("pool", pool_path)
        pool_node_ids[pool_path] = p_id

        nodes.append(FlowNode(
            id=p_id, type="pool",
            position=NodePosition(x=px, y=Y_POOL),
            data=NodeData(
                label=short_name(pool_data.get("fullPath", pool_data.get("name", ""))),
                nodeType="pool",
                lbMode=pool_data.get("loadBalancingMode"),
                monitor=pool_data.get("monitor"),
                memberCount=len(members),
            ),
        ))

        # Members
        total_m = len(members)
        for j, m in enumerate(members):
            m_name = m.get("name", "")
            addr   = m.get("address", "")
            port_str = m_name.split(":")[-1] if ":" in m_name else ""
            try:
                port = int(port_str)
            except ValueError:
                port = None

            health  = m.get("healthStatus", "unknown")
            offline = health == "offline"

            m_id = _id("member", f"{pool_path}_{m_name}")
            mx = px + (j - (total_m - 1) / 2) * 220
            nodes.append(FlowNode(
                id=m_id, type="poolMember",
                position=NodePosition(x=mx, y=Y_MEMBER),
                data=NodeData(
                    label=f"{addr}:{port}" if port else (addr or m_name),
                    nodeType="poolMember",
                    address=addr or None,
                    port=port,
                    healthStatus=health,
                    sessionStatus=m.get("sessionStatus", "unknown"),
                    nodeHealth=m.get("nodeHealth", "unknown"),
                    nodeSession=m.get("nodeSession", "unknown"),
                ),
            ))
            edge(p_id, m_id,
                 animated=not offline,
                 style={"stroke": "#ef4444", "strokeDasharray": "4,4"} if offline
                       else {"stroke": "#22c55e", "strokeWidth": 2})

    # ── Direct-node targets ───────────────────────────────────────────────────
    direct_node_ids: dict[str, str] = {}
    dn_list = list(direct_nodes.items())
    for k, (node_ip, node_info) in enumerate(dn_list):
        nx = X_CENTER + (k - (len(dn_list) - 1) / 2) * X_POOL_STEP
        dn_id = _id("dnode", node_ip)
        direct_node_ids[node_ip] = dn_id
        health = node_info.get("health", "unknown")
        nodes.append(FlowNode(
            id=dn_id, type="poolMember",
            position=NodePosition(x=nx, y=Y_POOL),
            data=NodeData(
                label=f"{node_info.get('name', node_ip)} ({node_ip})",
                nodeType="poolMember",
                address=node_ip,
                healthStatus=health,
                sessionStatus=node_info.get("session", "unknown"),
                nodeHealth=health,
                nodeSession=node_info.get("session", "unknown"),
            ),
        ))

    # ── Policy → Pool/Node edges ─────────────────────────────────────────────
    seen = set()
    for dec_id, target_key, label, is_default, is_node_target in pending_rule_edges:
        if is_node_target:
            tgt = direct_node_ids.get(target_key)
        else:
            tgt = pool_node_ids.get(target_key)
        if not tgt:
            continue
        sig = (dec_id, tgt, label)
        if sig in seen:
            continue
        seen.add(sig)
        edge(dec_id, tgt,
             label=label,
             style={"strokeDasharray": "5,5", "stroke": "#64748b"} if is_default
                   else {"stroke": "#f97316", "strokeWidth": 2})

    # ── No policies: direct pipeline → default pool ──────────────────────────
    if not decision_ids and default_pool_path and default_pool_path in pool_node_ids:
        for src in prev:
            edge(src, pool_node_ids[default_pool_path],
                 label="default pool",
                 style={"strokeDasharray": "4,4", "stroke": "#94a3b8"})

    return nodes, edges


# ── iRule helpers ────────────────────────────────────────────────────────────

def _classify_irules(irules):
    early, late = [], []
    for rule in irules:
        content = rule.get("content", "")
        found_early = [e for e in EARLY_EVENTS if e in content]
        found_late  = [e for e in LATE_EVENTS  if e in content]
        rule["_events"] = found_early + found_late
        (early if found_early and not found_late else late).append(rule)
    return early, late


def _build_irule_nodes(irules, y):
    nodes = []
    total = len(irules)
    for i, rule in enumerate(irules):
        content = rule.get("content", "")
        truncated = content[:500] + ("…" if len(content) > 500 else "")
        px = X_CENTER + (i - (total - 1) / 2) * X_POOL_STEP
        nodes.append(FlowNode(
            id=_id("irule", rule.get("fullPath", rule.get("name", i))),
            type="irule",
            position=NodePosition(x=px, y=y),
            data=NodeData(
                label=rule.get("name", f"irule_{i}"),
                nodeType="irule",
                ruleContent=truncated,
                eventHints=rule.get("_events") or [],
            ),
        ))
    return nodes


# ── Policy condition label ────────────────────────────────────────────────────

FIELD_MAP = {
    "httpUri": "URI", "httpHeader": "Header", "httpMethod": "Method",
    "httpHost": "Host", "httpCookie": "Cookie", "sslExtension": "SSL",
    "httpStatus": "Status", "tcp": "TCP",
}
OPS_MAP = {
    "startsWith": "começa com", "endsWith": "termina com",
    "contains": "contém", "equals": "=", "matches": "~",
}


def _build_condition_label(rule: dict) -> str:
    cond_raw = rule.get("conditionsReference") or rule.get("conditions") or []
    items = cond_raw.get("items", []) if isinstance(cond_raw, dict) else (
        cond_raw if isinstance(cond_raw, list) else []
    )

    parts = []
    for c in items[:3]:
        if not isinstance(c, dict):
            continue
        s = _condition_str(c)
        if s:
            parts.append(s)

    if parts:
        return " & ".join(parts)
    # No conditions = catch-all rule
    return "demais"


def _rule_has_conditions(rule: dict) -> bool:
    cond_raw = rule.get("conditionsReference") or rule.get("conditions") or []
    items = cond_raw.get("items", []) if isinstance(cond_raw, dict) else (
        cond_raw if isinstance(cond_raw, list) else []
    )
    return len(items) > 0


def _condition_str(c: dict) -> str:
    for field_key, field_label in FIELD_MAP.items():
        if not c.get(field_key):  # True or dict
            continue
        for op_key, op_label in OPS_MAP.items():
            if not c.get(op_key):
                continue
            values = c.get("values", [])
            val_str = ", ".join(f'"{v}"' for v in values[:2])
            # Extra label for named headers/cookies
            tm_name = c.get("tmName") or (c.get("index") if field_key in ("httpHeader", "httpCookie") else None)
            name_sfx = f"[{tm_name}]" if tm_name else ""
            return f"{field_label}{name_sfx} {op_label} {val_str}"
    return ""
