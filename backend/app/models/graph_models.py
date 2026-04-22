from pydantic import BaseModel
from typing import Any


class NodePosition(BaseModel):
    x: float
    y: float


class NodeData(BaseModel):
    label: str
    nodeType: str
    destination: str | None = None
    source: str | None = None
    snatType: str | None = None
    partition: str | None = None
    ipProtocol: str | None = None
    description: str | None = None
    profiles: list[str] | None = None
    matchType: str | None = None
    conditions: list[str] | None = None
    actions: list[str] | None = None
    ruleContent: str | None = None
    eventHints: list[str] | None = None
    lbMode: str | None = None
    monitor: str | None = None
    address: str | None = None
    port: int | None = None
    healthStatus: str | None = None
    sessionStatus: str | None = None
    nodeHealth: str | None = None
    nodeSession: str | None = None
    memberCount: int | None = None
    policyRules: list[dict] | None = None
    poolMembers: list[dict] | None = None


class FlowNode(BaseModel):
    id: str
    type: str
    position: NodePosition
    data: NodeData


class FlowEdge(BaseModel):
    id: str
    source: str
    target: str
    label: str | None = None
    animated: bool = False
    style: dict[str, Any] | None = None


class ConnectRequest(BaseModel):
    host: str
    username: str = "admin"
    password: str
    partition: str = "Common"


class VsSummary(BaseModel):
    name: str
    fullPath: str
    partition: str
    destination: str
    ipProtocol: str | None = None
    description: str | None = None
    enabled: bool = True
    poolName: str | None = None
    poolMemberCount: int = 0
    poolAvailableCount: int = 0
    poolOfflineCount: int = 0


class ConnectResponse(BaseModel):
    host: str
    partition: str
    vsList: list[VsSummary]
    totalVs: int


class VisualizeRequest(BaseModel):
    host: str
    vsName: str
    username: str = "admin"
    password: str
    partition: str = "Common"


class ExportRequest(BaseModel):
    host: str
    username: str = "admin"
    password: str
    partition: str = "Common"


class SnapshotVisualizeRequest(BaseModel):
    vsName: str
    vsData: dict
    partition: str = "Common"


class VisualizationResponse(BaseModel):
    nodes: list[FlowNode]
    edges: list[FlowEdge]
    meta: dict[str, Any]
