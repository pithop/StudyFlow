"""Authentication helpers for Supabase JWT verification.

This module provides a dependency `get_current_user_id` to extract and verify
Supabase JWT tokens. For now, verification of signature is optional if JWKS
fetch fails; we still parse claims to get `sub`.

Future hardening steps:
- Cache JWKS with expiry
- Enforce audience and issuer checks
- Handle token revocation (Supabase does not provide revocation list; rely on exp)
"""
from typing import Optional
from fastapi import Header, HTTPException, Depends
import httpx
from jose import jwt
import os
import time

JWKS_URL = "https://" + os.getenv("SUPABASE_PROJECT_REF", "your-project-ref") + ".supabase.co/auth/v1/keys"
_cache_jwks: dict = {"keys": None, "fetched_at": 0}
CACHE_SECONDS = 60 * 60  # 1 hour

async def fetch_jwks() -> Optional[dict]:
    now = time.time()
    if _cache_jwks["keys"] and now - _cache_jwks["fetched_at"] < CACHE_SECONDS:
        return _cache_jwks["keys"]
    try:
        async with httpx.AsyncClient(timeout=5) as client:
            resp = await client.get(JWKS_URL)
            resp.raise_for_status()
            data = resp.json()
            _cache_jwks["keys"] = data
            _cache_jwks["fetched_at"] = now
            return data
    except Exception:
        return None

async def get_current_user_id(authorization: Optional[str] = Header(None)) -> Optional[str]:
    """Extract user id (sub) from Supabase JWT.

    Returns user_id or raises HTTPException if invalid. If no Authorization
    header provided, returns None (endpoints may accept explicit user_id in dev).
    """
    if not authorization:
        return None
    if not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Invalid auth header format")
    token = authorization.split(" ", 1)[1].strip()

    # Attempt to verify using JWKS (optional fallback: decode w/out verify)
    jwks = await fetch_jwks()
    algorithms = ["RS256"]
    options = {"verify_aud": False}
    try:
        if jwks:
            # jose supports passing key set via `jwt.get_unverified_header` and matching kid
            header = jwt.get_unverified_header(token)
            key_candidates = [k for k in jwks.get("keys", []) if k.get("kid") == header.get("kid")]
            if not key_candidates:
                raise HTTPException(status_code=401, detail="No matching JWKS key")
            key = key_candidates[0]
            payload = jwt.decode(token, key, algorithms=algorithms, options=options)
        else:
            # Fallback: unverified decoding (NOT secure; dev only)
            payload = jwt.get_unverified_claims(token)
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

    sub = payload.get("sub")
    if not sub:
        raise HTTPException(status_code=401, detail="Token missing sub")
    return sub

# Convenience dependency alias
CurrentUserId = Depends(get_current_user_id)
