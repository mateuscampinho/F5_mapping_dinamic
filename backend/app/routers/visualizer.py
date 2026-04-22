import logging
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException
from app.models.graph_models import (
    ConnectRequest, ConnectResponse, VsSummary,
    VisualizeRequest, VisualizationResponse,
)
from app.services.f5_client import F5Client, F5AuthError, F5NotFoundError, F5ConnectionError, F5APIError
from app.services.f5_collector import collect_all_vs, collect_vs_data
from app.services.graph_builder import build_graph
from app.config import settings
from app.utils.helpers import short_name, partition_from_path

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["visualizer"])


def _make_client(host: str, username: str, password: str) -> F5Client:
    return F5Client(
        host=host,
        username=username,
        password=password,
        verify_ssl=settings.f5_verify_ssl,
        timeout=settings.f5_request_timeout,
    )


def _handle_f5_errors(exc: Exception, host: str, resource: str = ""):
    if isinstance(exc, F5AuthError):
        raise HTTPException(status_code=401, detail={
            "detail": "Autenticação falhou. Verifique as credenciais do BIG-IP.",
            "f5_error": str(exc), "resource": resource,
        })
    if isinstance(exc, F5NotFoundError):
        raise HTTPException(status_code=404, detail={
            "detail": f"Recurso não encontrado: {resource}",
            "f5_error": str(exc), "resource": resource,
        })
    if isinstance(exc, F5ConnectionError):
        raise HTTPException(status_code=503, detail={
            "detail": f"Não foi possível alcançar o BIG-IP em {host}. Verifique hostname/IP e conectividade.",
            "f5_error": str(exc), "resource": host,
        })
    if isinstance(exc, F5APIError):
        raise HTTPException(status_code=502, detail={
            "detail": "O BIG-IP retornou um erro inesperado.",
            "f5_error": exc.f5_error, "resource": exc.resource,
        })
    logger.exception("Unexpected error")
    raise HTTPException(status_code=500, detail={
        "detail": "Erro interno ao processar os dados.",
        "f5_error": str(exc),
    })


@router.post("/connect", response_model=ConnectResponse)
async def connect_and_list(request: ConnectRequest):
    """Login: validate credentials and return all Virtual Servers."""
    client = _make_client(request.host, request.username, request.password)
    try:
        all_vs = collect_all_vs(client, request.partition)
    except Exception as exc:
        _handle_f5_errors(exc, request.host)

    vs_list = []
    for vs in all_vs:
        dest_raw = vs.get("destination", "")
        destination = dest_raw.split("/")[-1] if dest_raw else ""
        pool_info = vs.get("_poolInfo", {})
        enabled_val = vs.get("enabled")
        vs_list.append(VsSummary(
            name=vs.get("name", ""),
            fullPath=vs.get("fullPath", vs.get("name", "")),
            partition=vs.get("partition", request.partition),
            destination=destination,
            ipProtocol=vs.get("ipProtocol"),
            description=vs.get("description"),
            enabled=enabled_val is not False,
            poolName=pool_info.get("name"),
            poolMemberCount=pool_info.get("memberCount", 0),
            poolAvailableCount=pool_info.get("availableCount", 0),
            poolOfflineCount=pool_info.get("offlineCount", 0),
        ))

    return ConnectResponse(
        host=request.host,
        partition=request.partition,
        vsList=vs_list,
        totalVs=len(vs_list),
    )


@router.post("/visualize", response_model=VisualizationResponse)
async def visualize_vs(request: VisualizeRequest):
    """Get full pipeline flowchart for a specific Virtual Server."""
    client = _make_client(request.host, request.username, request.password)
    try:
        raw_data = collect_vs_data(client, request.vsName, request.partition)
    except Exception as exc:
        _handle_f5_errors(exc, request.host, request.vsName)

    nodes, edges = build_graph(raw_data)
    vs = raw_data["vs"]

    return VisualizationResponse(
        nodes=nodes,
        edges=edges,
        meta={
            "vsName": vs.get("name", request.vsName),
            "partition": request.partition,
            "host": request.host,
            "fetchedAt": datetime.now(timezone.utc).isoformat(),
            "totalNodes": len(nodes),
            "totalEdges": len(edges),
        },
    )


@router.get("/health")
async def health_check():
    return {"status": "ok"}
