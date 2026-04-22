import logging
import requests
import urllib3

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

logger = logging.getLogger(__name__)


class F5AuthError(Exception):
    pass


class F5NotFoundError(Exception):
    pass


class F5ConnectionError(Exception):
    pass


class F5APIError(Exception):
    def __init__(self, message: str, f5_error: str = "", resource: str = ""):
        super().__init__(message)
        self.f5_error = f5_error
        self.resource = resource


class F5Client:
    def __init__(
        self,
        host: str,
        username: str,
        password: str,
        verify_ssl: bool = False,
        timeout: int = 15,
    ):
        self.base_url = f"https://{host}"
        self.timeout = timeout
        self.session = requests.Session()
        self.session.verify = verify_ssl
        self.session.headers.update({"Content-Type": "application/json"})
        self._authenticate(username, password)

    def _authenticate(self, username: str, password: str):
        """Obtain a BIG-IP auth token (works with local and AD/LDAP users)."""
        url = f"{self.base_url}/mgmt/shared/authn/login"
        try:
            resp = self.session.post(url, json={
                "username": username,
                "password": password,
                "loginProviderName": "tmos",
            }, timeout=self.timeout)
        except requests.exceptions.ConnectionError as exc:
            raise F5ConnectionError(f"Cannot reach BIG-IP at {self.base_url}: {exc}") from exc
        except requests.exceptions.Timeout:
            raise F5ConnectionError(f"Timeout connecting to {self.base_url}")

        if resp.status_code == 401:
            raise F5AuthError("Authentication failed: invalid credentials")
        if not resp.ok:
            try:
                msg = resp.json().get("message", resp.text[:200])
            except Exception:
                msg = resp.text[:200]
            raise F5AuthError(f"Authentication failed: {msg}")

        token = resp.json().get("token", {}).get("token")
        if not token:
            raise F5AuthError("Authentication failed: no token returned")

        self.session.headers.update({"X-F5-Auth-Token": token})
        logger.debug("BIG-IP token acquired")

    def get(self, path: str, params: dict | None = None) -> dict:
        url = f"{self.base_url}{path}"
        logger.debug("GET %s", url)
        try:
            resp = self.session.get(url, params=params, timeout=self.timeout)
        except requests.exceptions.ConnectionError as exc:
            raise F5ConnectionError(f"Cannot reach BIG-IP at {self.base_url}: {exc}") from exc
        except requests.exceptions.Timeout as exc:
            raise F5ConnectionError(f"Timeout connecting to {self.base_url}") from exc
        return self._handle_response(resp, path)

    def get_ltm(self, resource: str, params: dict | None = None) -> dict:
        return self.get(f"/mgmt/tm/ltm/{resource}", params=params)

    def _handle_response(self, response: requests.Response, path: str) -> dict:
        if response.status_code == 401:
            raise F5AuthError("Authentication failed: invalid credentials")
        if response.status_code == 404:
            raise F5NotFoundError(f"Resource not found: {path}")
        if not response.ok:
            try:
                body = response.json()
                f5_msg = body.get("message", str(response.text[:200]))
            except Exception:
                f5_msg = response.text[:200]
            raise F5APIError(
                f"BIG-IP API error {response.status_code} on {path}",
                f5_error=f5_msg,
                resource=path,
            )
        try:
            return response.json()
        except Exception as exc:
            raise F5APIError(f"Invalid JSON response from {path}", resource=path) from exc
