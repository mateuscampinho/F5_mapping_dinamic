from pydantic import BaseModel
from typing import Any


class VirtualServerRaw(BaseModel):
    name: str
    fullPath: str | None = None
    partition: str | None = None
    destination: str | None = None
    ipProtocol: str | None = None
    description: str | None = None
    pool: str | None = None
    rules: list[str] | None = None
    policies: list[Any] | None = None


class ProfileRef(BaseModel):
    name: str
    fullPath: str | None = None
    context: str | None = None


class PolicyRef(BaseModel):
    name: str
    fullPath: str | None = None


class PolicyCondition(BaseModel):
    name: str | None = None
    httpUri: dict | None = None
    httpHeader: dict | None = None
    httpMethod: dict | None = None
    sslExtension: dict | None = None


class PolicyAction(BaseModel):
    name: str | None = None
    forward: dict | None = None
    redirect: dict | None = None
    httpHeader: dict | None = None
    log: dict | None = None


class PolicyRule(BaseModel):
    name: str
    ordinal: int | None = None
    conditions: list[dict] | None = None
    actions: list[dict] | None = None


class IruleRef(BaseModel):
    name: str
    fullPath: str | None = None
    apiAnonymous: str | None = None


class PoolRaw(BaseModel):
    name: str
    fullPath: str | None = None
    partition: str | None = None
    loadBalancingMode: str | None = None
    monitor: str | None = None
    description: str | None = None


class PoolMember(BaseModel):
    name: str
    address: str | None = None
    fullPath: str | None = None
    session: str | None = None
    state: str | None = None
    healthStatus: str = "unknown"
    sessionStatus: str = "unknown"
