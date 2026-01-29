"""
Authentication utilities for verifying Google OAuth tokens.
"""

from typing import Optional

import httpx
from database import get_db
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

security = HTTPBearer(auto_error=False)


async def verify_google_token(token: str) -> dict:
    """Verify Google OAuth token and return user info."""
    async with httpx.AsyncClient() as client:
        response = await client.get(
            "https://www.googleapis.com/oauth2/v3/userinfo",
            headers={"Authorization": f"Bearer {token}"},
        )
        if response.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid Google token",
            )
        return response.json()


async def get_user_by_google_id(google_id: str) -> Optional[dict]:
    """Get user from database by Google ID."""
    async with get_db() as conn:
        row = await conn.fetchrow(
            "SELECT id, google_id, email, name, picture, created_at FROM users WHERE google_id = $1",
            google_id,
        )
        if row:
            return {
                "id": str(row["id"]),
                "google_id": row["google_id"],
                "email": row["email"],
                "name": row["name"],
                "picture": row["picture"],
                "created_at": row["created_at"].isoformat(),
            }
        return None


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
) -> Optional[dict]:
    """
    Get current user from Authorization header.
    Returns None if no auth provided (allows optional auth).
    """
    if not credentials:
        return None

    token = credentials.credentials
    try:
        google_info = await verify_google_token(token)
        google_id = google_info.get("sub")
        if not google_id:
            return None

        user = await get_user_by_google_id(google_id)
        return user
    except Exception:
        return None


async def require_auth(
    credentials: HTTPAuthorizationCredentials = Depends(HTTPBearer()),
) -> dict:
    """
    Require authenticated user. Raises 401 if not authenticated.
    """
    token = credentials.credentials
    try:
        google_info = await verify_google_token(token)
        google_id = google_info.get("sub")
        if not google_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token",
            )

        user = await get_user_by_google_id(google_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found. Please register first.",
            )
        return user
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Authentication failed: {str(e)}",
        )
