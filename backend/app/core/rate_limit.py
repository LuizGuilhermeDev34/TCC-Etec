import time
from typing import Dict, Tuple

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse


class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, limit: int = 60, window_seconds: int = 60) -> None:
        super().__init__(app)
        self._limit = limit
        self._window = window_seconds
        self._hits: Dict[str, Tuple[float, int]] = {}

    async def dispatch(self, request: Request, call_next):
        ip = request.client.host if request.client else "unknown"
        now = time.time()
        window_start, count = self._hits.get(ip, (now, 0))
        if now - window_start > self._window:
            window_start, count = now, 0
        count += 1
        self._hits[ip] = (window_start, count)

        if count > self._limit:
            return JSONResponse(
                {"detail": "Muitas requisições. Tente novamente em instantes."},
                status_code=429,
            )
        return await call_next(request)
