"""
Busca a bio de um político na Wikipédia em português.
Tenta variações do nome até encontrar um artigo válido.
Cache de 24 h para não repetir requisições.
"""
import unicodedata
from typing import Optional

import httpx

from ..core import SimpleCache

_cache = SimpleCache(ttl_seconds=86400)
_API = "https://pt.wikipedia.org/api/rest_v1/page/summary"
_MISS = "__miss__"


def _to_title(nome: str) -> str:
    """Title-case preservando artigos/preposições em minúsculo."""
    minusculos = {"de", "da", "do", "das", "dos", "e", "a", "o"}
    partes = nome.strip().title().split()
    return " ".join(
        p.lower() if p.lower() in minusculos and i > 0 else p
        for i, p in enumerate(partes)
    )


def _title_url(nome: str) -> str:
    return _to_title(nome).replace(" ", "_")


def _candidates(nome: str, nome_civil: str) -> list[str]:
    seen: set[str] = set()
    result = []
    for n in [nome_civil, nome]:
        if not n:
            continue
        tc = _to_title(n)
        if tc not in seen:
            seen.add(tc)
            result.append(tc)
    # primeira + última palavra do nome principal (apelido pode diferir do nome civil)
    base = _to_title(nome_civil or nome)
    partes = base.split()
    if len(partes) >= 2:
        abrev = f"{partes[0]} {partes[-1]}"
        if abrev not in seen:
            seen.add(abrev)
            result.append(abrev)
    return result


async def get_summary(wiki_title: str) -> Optional[dict]:
    """Retorna thumbnail + extract da Wikipédia para um título exato."""
    cache_key = f"wiki_summary:{wiki_title}"
    cached = _cache.get(cache_key)
    if cached is not None:
        return None if cached == _MISS else cached
    headers = {
        "Accept": "application/json",
        "User-Agent": "PoliticosBR/1.0 (dashboard educacional; contato: luizkdu2.0@gmail.com)",
    }
    try:
        async with httpx.AsyncClient(timeout=8.0, headers=headers) as client:
            r = await client.get(f"{_API}/{wiki_title.replace(' ', '_')}")
            if r.status_code != 200:
                _cache.set(cache_key, _MISS)
                return None
            data = r.json()
            if data.get("type") == "disambiguation":
                _cache.set(cache_key, _MISS)
                return None
            result = {
                "thumbnail": (data.get("thumbnail") or {}).get("source"),
                "extract": (data.get("extract") or "")[:200],
            }
            _cache.set(cache_key, result)
            return result
    except Exception:
        _cache.set(cache_key, _MISS)
        return None


async def get_pageviews(wiki_title: str, months: int = 6) -> Optional[int]:
    """Total de visualizações na Wikipédia nos últimos N meses."""
    cache_key = f"wiki_pv:{wiki_title}"
    cached = _cache.get(cache_key)
    if cached is not None:
        return None if cached == _MISS else cached
    from datetime import datetime, timedelta
    end = datetime.now()
    start = end - timedelta(days=30 * months)
    start_s = start.strftime("%Y%m01")
    end_s = end.strftime("%Y%m01")
    url = (
        f"https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article"
        f"/pt.wikipedia/all-access/all-agents/{wiki_title.replace(' ', '_')}"
        f"/monthly/{start_s}/{end_s}"
    )
    headers = {"User-Agent": "PoliticosBR/1.0 (contato: luizkdu2.0@gmail.com)"}
    try:
        async with httpx.AsyncClient(timeout=8.0, headers=headers) as client:
            r = await client.get(url)
            if r.status_code != 200:
                _cache.set(cache_key, _MISS)
                return None
            total = sum(item.get("views", 0) for item in r.json().get("items", []))
            _cache.set(cache_key, total)
            return total
    except Exception:
        _cache.set(cache_key, _MISS)
        return None


async def get_bio(nome: str, nome_civil: str = "") -> Optional[str]:
    cache_key = f"wiki:{nome}"
    cached = _cache.get(cache_key)
    if cached is not None:
        return None if cached == _MISS else cached

    headers = {
        "Accept": "application/json",
        "User-Agent": "PoliticosBR/1.0 (dashboard educacional; contato: luizkdu2.0@gmail.com)",
    }
    async with httpx.AsyncClient(timeout=8.0, headers=headers) as client:
        for candidate in _candidates(nome, nome_civil):
            try:
                r = await client.get(f"{_API}/{_title_url(candidate)}")
                if r.status_code != 200:
                    continue
                data = r.json()
                if data.get("type") == "disambiguation":
                    continue
                extract: str = (data.get("extract") or "").strip()
                if len(extract) < 60:
                    continue
                bio = extract[:700]
                _cache.set(cache_key, bio)
                return bio
            except Exception:
                continue

    _cache.set(cache_key, _MISS)
    return None
