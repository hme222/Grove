"""Sign-up helpers: feature flags, email confirmation tokens, the email sender.

Everything here is off by default. With the flags unset the app behaves as it
did before: no confirmation email, no Apple or Google button, no new gate.

Environment switches (read at call time, so tests can change them):
  EMAIL_VERIFICATION_ENABLED   "1"/"true": send a confirmation link on sign-up.
  SSO_GOOGLE_ENABLED           "1"/"true": allow Google sign-in. Needs GOOGLE_CLIENT_ID.
  SSO_APPLE_ENABLED            "1"/"true": allow Apple sign-in. Needs APPLE_CLIENT_ID
                               (the Services ID) and APPLE_REDIRECT_URI.
  APP_BASE_URL                 Where the confirmation link points (default http://localhost:3000).
  EMAIL_SMTP_HOST / _PORT / _USER / _PASSWORD / EMAIL_FROM
                               The sender. With no host set the link is written to
                               the server log instead (outside production only).
  APP_ENV                      "production" turns the log fallback off.
Secrets are only ever read from the environment.
"""
import hashlib
import logging
import os
import secrets
import smtplib
from datetime import datetime, timedelta, timezone
from email.message import EmailMessage
from typing import Optional, Tuple

logger = logging.getLogger(__name__)

TOKEN_TTL_HOURS = 24
RESEND_AFTER_SECONDS = 60


def _on(name: str) -> bool:
    return os.environ.get(name, "").strip().lower() in ("1", "true", "yes", "on")


def email_verification_enabled() -> bool:
    return _on("EMAIL_VERIFICATION_ENABLED")


def sso_google_enabled() -> bool:
    return _on("SSO_GOOGLE_ENABLED") and bool(os.environ.get("GOOGLE_CLIENT_ID"))


def sso_apple_enabled() -> bool:
    return (
        _on("SSO_APPLE_ENABLED")
        and bool(os.environ.get("APPLE_CLIENT_ID"))
        and bool(os.environ.get("APPLE_REDIRECT_URI"))
    )


def public_config() -> dict:
    """What the sign-up screens may know. Client ids are public by design; no secret is here."""
    return {
        "email_verification": email_verification_enabled(),
        "sso": {
            "google": {"enabled": sso_google_enabled(), "client_id": os.environ.get("GOOGLE_CLIENT_ID", "") if sso_google_enabled() else ""},
            "apple": {
                "enabled": sso_apple_enabled(),
                "client_id": os.environ.get("APPLE_CLIENT_ID", "") if sso_apple_enabled() else "",
                "redirect_uri": os.environ.get("APPLE_REDIRECT_URI", "") if sso_apple_enabled() else "",
            },
        },
    }


# ---------------- tokens ----------------

def hash_token(raw: str) -> str:
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


def new_token() -> Tuple[str, str]:
    """(raw, hash). Only the hash is stored; the raw value goes in the link."""
    raw = secrets.token_urlsafe(32)
    return raw, hash_token(raw)


def expiry(now: Optional[datetime] = None) -> str:
    return ((now or datetime.now(timezone.utc)) + timedelta(hours=TOKEN_TTL_HOURS)).isoformat()


def is_expired(expires_at: Optional[str], now: Optional[datetime] = None) -> bool:
    if not expires_at:
        return True
    try:
        when = datetime.fromisoformat(expires_at)
    except ValueError:
        return True
    if when.tzinfo is None:
        when = when.replace(tzinfo=timezone.utc)
    return (now or datetime.now(timezone.utc)) >= when


def seconds_until_resend(sent_at: Optional[str], now: Optional[datetime] = None) -> int:
    """0 when another email may go out, otherwise how many seconds to wait."""
    if not sent_at:
        return 0
    try:
        when = datetime.fromisoformat(sent_at)
    except ValueError:
        return 0
    if when.tzinfo is None:
        when = when.replace(tzinfo=timezone.utc)
    wait = RESEND_AFTER_SECONDS - ((now or datetime.now(timezone.utc)) - when).total_seconds()
    return max(0, int(wait + 0.999))


def confirmation_link(raw_token: str) -> str:
    base = os.environ.get("APP_BASE_URL", "http://localhost:3000").rstrip("/")
    return f"{base}/confirm-email?token={raw_token}"


# ---------------- sender ----------------

def _message(to: str, link: str) -> EmailMessage:
    msg = EmailMessage()
    msg["Subject"] = "Confirm your email for FloraGrove"
    msg["From"] = os.environ.get("EMAIL_FROM", "FloraGrove <no-reply@localhost>")
    msg["To"] = to
    msg.set_content(
        "Tap the link to confirm your email and carry on with FloraGrove:\n\n"
        f"{link}\n\n"
        f"The link works for {TOKEN_TTL_HOURS} hours. If you did not make a FloraGrove account, "
        "you can ignore this message.\n"
    )
    return msg


def send_confirmation_email(to: str, link: str) -> str:
    """Send the link. Returns "sent" or "logged". Raises when a configured sender fails.

    With no SMTP host: outside production the link goes to the server log (so a
    developer can click it); in production nothing is logged, because a link in a
    log is a login, and this raises so the caller can say the email did not go.
    """
    host = os.environ.get("EMAIL_SMTP_HOST", "").strip()
    if not host:
        if os.environ.get("APP_ENV", "").strip().lower() == "production":
            raise RuntimeError("EMAIL_VERIFICATION_ENABLED is on but EMAIL_SMTP_HOST is not set")
        logger.warning("Email confirmation link for %s (no sender configured): %s", to, link)
        return "logged"
    port = int(os.environ.get("EMAIL_SMTP_PORT", "587"))
    user = os.environ.get("EMAIL_SMTP_USER")
    password = os.environ.get("EMAIL_SMTP_PASSWORD")
    with smtplib.SMTP(host, port, timeout=15) as smtp:
        smtp.ehlo()
        if port != 25:
            smtp.starttls()
            smtp.ehlo()
        if user and password:
            smtp.login(user, password)
        smtp.send_message(_message(to, link))
    return "sent"


# ---------------- names ----------------

def username_from_email(email: str, attempt: int = 0) -> str:
    """A username from the part before the @. The first attempt is the plain name; later
    attempts add four digits, for when the plain name is taken."""
    local = (email or "").split("@")[0].lower()
    base = "".join(ch for ch in local if ch.isalnum() or ch in "._-")[:20] or "grower"
    return base if attempt == 0 else f"{base}{secrets.randbelow(9000) + 1000}"


def display_name_from_email(email: str) -> str:
    """The leading letters of the address, capitalised ("maya.r88@x.com" -> "Maya").
    Empty when there are fewer than two letters to go on."""
    local = (email or "").split("@")[0]
    letters = ""
    for ch in local:
        if ch.isalpha():
            letters += ch
        elif letters:
            break
    return letters.capitalize() if len(letters) >= 2 else ""
