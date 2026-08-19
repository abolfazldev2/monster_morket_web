import re

from django.core.exceptions import ValidationError

STEAM_PROFILE_URL_RE = re.compile(
    r"^https?://steamcommunity\.com/(?:id/(?P<vanity>[\w-]+)|profiles/(?P<steamid>\d{17}))/?$"
)
STEAMID64_RE = re.compile(r"^\d{17}$")


def normalize_steam_identifier(value: str) -> str:
    """
    Accepts a full steamcommunity.com profile URL or a raw SteamID64 and
    returns a normalized value for storage. Does NOT resolve vanity URLs to
    SteamID64 (that would require the Steam Web API) — vanity URLs are
    stored as given and resolved manually during fulfillment.
    """
    value = value.strip()
    if STEAMID64_RE.match(value):
        return value
    match = STEAM_PROFILE_URL_RE.match(value)
    if match:
        return value.rstrip("/")
    raise ValidationError(
        "Enter a valid Steam profile URL (https://steamcommunity.com/id/... or /profiles/...) "
        "or a 17-digit SteamID64."
    )


def get_client_ip(request):
    forwarded = request.META.get("HTTP_X_FORWARDED_FOR")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR")
