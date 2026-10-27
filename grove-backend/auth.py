import os
import secrets
import jwt
import bcrypt
from datetime import datetime, timezone, timedelta
from fastapi import HTTPException, Depends, Request
from typing import Optional

def _secret(name: str) -> str:
    """A signing secret from the environment. There is no built-in default: a default in a public repo would let
    anyone forge sign-in tokens. Without the variable, production refuses to start and any other environment
    gets a random secret for this process only (sessions end when the server restarts)."""
    value = os.environ.get(name, '').strip()
    if value:
        return value
    if os.environ.get('APP_ENV', '').strip().lower() == 'production':
        raise RuntimeError(f'{name} must be set when APP_ENV=production')
    return secrets.token_urlsafe(48)


JWT_SECRET = _secret('JWT_SECRET')
JWT_REFRESH_SECRET = _secret('JWT_REFRESH_SECRET')
JWT_ALGORITHM = 'HS256'
ACCESS_TOKEN_EXPIRE_MINUTES = 60
REFRESH_TOKEN_EXPIRE_DAYS = 30

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_access_token(user_id: str, email: str) -> str:
    payload = {
        'user_id': user_id,
        'email': email,
        'exp': datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
        'type': 'access'
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def create_refresh_token(user_id: str) -> str:
    payload = {
        'user_id': user_id,
        'exp': datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS),
        'type': 'refresh'
    }
    return jwt.encode(payload, JWT_REFRESH_SECRET, algorithm=JWT_ALGORITHM)

def decode_access_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get('type') != 'access':
            raise HTTPException(status_code=401, detail='Invalid token type')
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail='Token expired')
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail='Invalid token')

def decode_refresh_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, JWT_REFRESH_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get('type') != 'refresh':
            raise HTTPException(status_code=401, detail='Invalid token type')
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail='Refresh token expired')
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail='Invalid refresh token')

async def get_current_user(request: Request) -> dict:
    auth_header = request.headers.get('Authorization')
    auth_query = request.query_params.get('auth')
    token = None
    if auth_header and auth_header.startswith('Bearer '):
        token = auth_header[7:]
    elif auth_query:
        token = auth_query
    if not token:
        raise HTTPException(status_code=401, detail='Not authenticated')
    payload = decode_access_token(token)
    return payload

async def get_optional_user(request: Request) -> Optional[dict]:
    try:
        return await get_current_user(request)
    except HTTPException:
        return None
