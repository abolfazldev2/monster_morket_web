"""Steam OpenID linking and read-only public inventory access."""
import json
import re
import secrets
from urllib.error import HTTPError, URLError
from urllib.parse import parse_qs, urlencode, urlparse
from urllib.request import Request, urlopen

from django.conf import settings
from django.core.cache import cache
from django.db import IntegrityError
from django.shortcuts import redirect
from rest_framework import permissions, serializers, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import User

STEAM_OPENID = "https://steamcommunity.com/openid/login"
STEAM_ID_RE = re.compile(r"^https://steamcommunity\.com/openid/id/(\d{17})$")
TRADE_URL_RE = re.compile(r"^https://steamcommunity\.com/tradeoffer/new/\?.+")
GAME_APPS = {"cs2": ("730", "2"), "dota2": ("570", "2")}


def _post_form(url, values, timeout=8):
    request = Request(url, data=urlencode(values).encode(), headers={"Content-Type": "application/x-www-form-urlencoded"})
    with urlopen(request, timeout=timeout) as response:
        return response.read().decode()


class SteamConnectView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        callback = settings.STEAM_OPENID_RETURN_URL
        callback_parts = urlparse(callback)
        if callback_parts.hostname in {"localhost", "127.0.0.1", "::1"}:
            return Response(
                {"detail": "Steam OpenID cannot verify a localhost callback. Configure a publicly reachable HTTPS callback URL (for example, a temporary Cloudflare Tunnel URL)."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        if callback_parts.scheme != "https":
            return Response(
                {"detail": "Steam callback URL must use HTTPS and be publicly reachable."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        nonce = secrets.token_urlsafe(32)
        cache.set(f"steam-link:{nonce}", request.user.pk, timeout=600)
        realm = f"{urlparse(callback).scheme}://{urlparse(callback).netloc}/"
        return_to = f"{callback}?state={nonce}"
        params = {
            "openid.ns": "http://specs.openid.net/auth/2.0",
            "openid.mode": "checkid_setup",
            "openid.return_to": return_to,
            "openid.realm": realm,
            "openid.identity": "http://specs.openid.net/auth/2.0/identifier_select",
            "openid.claimed_id": "http://specs.openid.net/auth/2.0/identifier_select",
        }
        return Response({"url": f"{STEAM_OPENID}?{urlencode(params)}"})


class SteamCallbackView(APIView):
    authentication_classes = []
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        state = request.query_params.get("state", "")
        user_id = cache.get(f"steam-link:{state}") if state else None
        frontend = settings.FRONTEND_URL.rstrip("/") + "/account/settings"
        if not user_id:
            return redirect(f"{frontend}?steam=expired")
        cache.delete(f"steam-link:{state}")

        identity = request.query_params.get("openid.claimed_id", "")
        match = STEAM_ID_RE.fullmatch(identity)
        if request.query_params.get("openid.mode") != "id_res" or not match:
            return redirect(f"{frontend}?steam=failed")
        expected_return_to = f"{settings.STEAM_OPENID_RETURN_URL}?state={state}"
        if (
            request.query_params.get("openid.return_to") != expected_return_to
            or request.query_params.get("openid.identity") != identity
        ):
            return redirect(f"{frontend}?steam=failed")
        try:
            fields = {key: value for key, value in request.query_params.items() if key.startswith("openid.")}
            fields["openid.mode"] = "check_authentication"
            verification = _post_form(STEAM_OPENID, fields)
            if "is_valid:true" not in verification.replace("\r", "").lower():
                return redirect(f"{frontend}?steam=failed")
            user = User.objects.get(pk=user_id)
            steam_id = match.group(1)
            if User.objects.exclude(pk=user.pk).filter(steam_id64=steam_id).exists():
                return redirect(f"{frontend}?steam=already-linked")
            user.steam_id64 = steam_id
            user.save(update_fields=["steam_id64"])
            return redirect(f"{frontend}?steam=connected")
        except (HTTPError, URLError, TimeoutError, User.DoesNotExist, IntegrityError, ValueError):
            return redirect(f"{frontend}?steam=failed")


class SteamConnectionView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response({"steam_id64": request.user.steam_id64, "trade_url": request.user.steam_trade_url})

    def patch(self, request):
        value = request.data.get("trade_url", "").strip()
        parsed = urlparse(value)
        params = parse_qs(parsed.query)
        if value and (
            not TRADE_URL_RE.fullmatch(value)
            or parsed.hostname != "steamcommunity.com"
            or not params.get("partner")
            or not params.get("token")
        ):
            raise serializers.ValidationError({"trade_url": "Enter a Steam Trade URL from steamcommunity.com."})
        request.user.steam_trade_url = value
        request.user.save(update_fields=["steam_trade_url"])
        return Response({"steam_id64": request.user.steam_id64, "trade_url": request.user.steam_trade_url})

    def delete(self, request):
        request.user.steam_id64 = None
        request.user.steam_trade_url = ""
        request.user.save(update_fields=["steam_id64", "steam_trade_url"])
        return Response(status=status.HTTP_204_NO_CONTENT)


class SteamInventoryView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        steam_id = request.user.steam_id64
        game = request.query_params.get("game", "cs2").lower()
        if not steam_id:
            return Response({"detail": "Connect a Steam account first."}, status=status.HTTP_409_CONFLICT)
        if game not in GAME_APPS:
            return Response({"detail": "Supported inventory games are cs2 and dota2."}, status=status.HTTP_400_BAD_REQUEST)
        app_id, context_id = GAME_APPS[game]
        cache_key = f"steam-inventory:{steam_id}:{app_id}"
        data = cache.get(cache_key)
        if data is None:
            url = f"https://steamcommunity.com/inventory/{steam_id}/{app_id}/{context_id}?l=english&count=5000"
            try:
                req = Request(url, headers={"User-Agent": "MonsterMarket/1.0"})
                with urlopen(req, timeout=8) as response:
                    data = json.loads(response.read())
            except (HTTPError, URLError, TimeoutError, json.JSONDecodeError):
                return Response({"detail": "Steam inventory is unavailable. Check that it is public and try again."}, status=status.HTTP_502_BAD_GATEWAY)
            if data.get("success") != 1:
                return Response({"detail": "Steam inventory is private or unavailable."}, status=status.HTTP_424_FAILED_DEPENDENCY)
            cache.set(cache_key, data, timeout=120)
        descriptions = {f"{item.get('classid')}_{item.get('instanceid', '0')}": item for item in data.get("descriptions", [])}
        items = []
        for asset in data.get("assets", []):
            description = descriptions.get(f"{asset.get('classid')}_{asset.get('instanceid', '0')}", {})
            icon = description.get("icon_url")
            items.append({
                "asset_id": asset.get("assetid"),
                "name": description.get("market_hash_name") or description.get("name", "Steam item"),
                "icon_url": f"https://community.cloudflare.steamstatic.com/economy/image/{icon}/96fx96f" if icon else "",
                "amount": int(asset.get("amount", 1)),
                "tradable": bool(description.get("tradable")),
                "marketable": bool(description.get("marketable")),
                "type": description.get("type", ""),
            })
        return Response({"game": game, "steam_id64": steam_id, "total": len(items), "items": items})
