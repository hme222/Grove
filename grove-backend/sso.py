"""Apple and Google sign-in: check an ID token the provider issued.

The sign-up screen gets an ID token from the provider's own script and posts it
here. We check the signature against the provider's public keys, the issuer, the
audience (our client id from the environment) and the expiry. Nothing here holds
a secret; Google and Apple ID tokens are verified with public keys only.

Not exercised against the real providers yet: that needs the client ids.
"""
import os
from typing import Optional

import jwt
from jwt import PyJWKClient

PROVIDERS = {
    "google": {
        "jwks": "https://www.googleapis.com/oauth2/v3/certs",
        "issuers": ("https://accounts.google.com", "accounts.google.com"),
        "client_env": "GOOGLE_CLIENT_ID",
        "algorithms": ["RS256"],
    },
    "apple": {
        "jwks": "https://appleid.apple.com/auth/keys",
        "issuers": ("https://appleid.apple.com",),
        "client_env": "APPLE_CLIENT_ID",
        "algorithms": ["RS256"],
    },
}

_clients: dict = {}


class SSOError(Exception):
    pass


def _jwk_client(provider: str) -> PyJWKClient:
    if provider not in _clients:
        _clients[provider] = PyJWKClient(PROVIDERS[provider]["jwks"], cache_keys=True)
    return _clients[provider]


def verify_id_token(provider: str, token: str) -> dict:
    """Return {"sub", "email", "email_verified", "name"} or raise SSOError."""
    cfg = PROVIDERS.get(provider)
    audience = os.environ.get(cfg["client_env"], "") if cfg else ""
    if not cfg or not audience:
        raise SSOError("Sign-in with this provider is not set up.")
    try:
        key = _jwk_client(provider).get_signing_key_from_jwt(token).key
        claims = jwt.decode(token, key, algorithms=cfg["algorithms"], audience=audience, options={"require": ["exp", "iss", "sub"]})
    except Exception as exc:  # network, signature, expiry, audience: all the same to the caller
        raise SSOError("We couldn't check that sign-in.") from exc
    if claims.get("iss") not in cfg["issuers"]:
        raise SSOError("We couldn't check that sign-in.")
    verified = claims.get("email_verified")
    return {
        "sub": str(claims["sub"]),
        "email": (claims.get("email") or "").lower() or None,
        # Apple sends the flag as the string "true".
        "email_verified": verified is True or str(verified).lower() == "true",
        "name": claims.get("name"),
    }
