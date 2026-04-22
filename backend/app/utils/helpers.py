def normalize_name(name: str, default_partition: str = "Common") -> str:
    """Convert /Common/name or name to ~Common~name for iControl REST URLs."""
    if not name:
        return name
    name = name.strip()
    if name.startswith("~"):
        return name
    if name.startswith("/"):
        parts = name.lstrip("/").split("/", 1)
        if len(parts) == 2:
            return f"~{parts[0]}~{parts[1]}"
        return f"~{default_partition}~{parts[0]}"
    return f"~{default_partition}~{name}"


def short_name(full_path: str) -> str:
    """Extract last segment of /Common/name or ~Common~name."""
    if not full_path:
        return full_path
    name = full_path.replace("~", "/").strip("/")
    return name.split("/")[-1]


def partition_from_path(full_path: str, default: str = "Common") -> str:
    """Extract partition from /Common/name or ~Common~name."""
    if not full_path:
        return default
    clean = full_path.replace("~", "/").strip("/")
    parts = clean.split("/")
    return parts[0] if len(parts) >= 2 else default
