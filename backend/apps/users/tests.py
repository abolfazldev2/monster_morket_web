import json
from io import BytesIO
from urllib.parse import parse_qs, urlparse
from unittest.mock import patch

from django.core.cache import cache
from django.test import TestCase, override_settings
from django.urls import reverse
from rest_framework.test import APIClient

from .models import User


class SteamAccountTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="steam-buyer", email="steam-buyer@example.com", password="safe-test-password"
        )
        self.client = APIClient()
        self.client.force_authenticate(self.user)
        cache.clear()

    @override_settings(
        DEBUG=True,
        STEAM_OPENID_RETURN_URL="https://store.example.test/api/users/steam/callback/",
    )
    def test_connect_starts_official_steam_openid_flow_and_binds_state_to_user(self):
        response = self.client.post(reverse("steam-connect"), {}, format="json")
        self.assertEqual(response.status_code, 200)
        parsed = urlparse(response.data["url"])
        self.assertEqual(parsed.netloc, "steamcommunity.com")
        params = parse_qs(parsed.query)
        self.assertEqual(params["openid.mode"], ["checkid_setup"])
        state = parse_qs(urlparse(params["openid.return_to"][0]).query)["state"][0]
        self.assertEqual(cache.get(f"steam-link:{state}"), self.user.pk)

    def test_localhost_callback_is_rejected_before_redirecting_to_steam(self):
        response = self.client.post(reverse("steam-connect"), {}, format="json")
        self.assertEqual(response.status_code, 503)
        self.assertIn("publicly reachable HTTPS", response.data["detail"])

    @override_settings(
        FRONTEND_URL="http://store.test",
        STEAM_OPENID_RETURN_URL="http://api.test/api/users/steam/callback/",
    )
    @patch("apps.users.steam._post_form", return_value="ns:http://specs.openid.net/auth/2.0\nis_valid:true\n")
    def test_valid_openid_callback_links_verified_steam_identity(self, post_form):
        steam_id = "76561198000000001"
        state = "single-use-state"
        cache.set(f"steam-link:{state}", self.user.pk, timeout=600)
        response = self.client.get(
            reverse("steam-callback"),
            {
                "state": state,
                "openid.mode": "id_res",
                "openid.claimed_id": f"https://steamcommunity.com/openid/id/{steam_id}",
                "openid.identity": f"https://steamcommunity.com/openid/id/{steam_id}",
                "openid.return_to": f"http://api.test/api/users/steam/callback/?state={state}",
                "openid.signed": "claimed_id,identity,return_to",
                "openid.sig": "test-signature",
            },
        )
        self.user.refresh_from_db()
        self.assertEqual(self.user.steam_id64, steam_id)
        self.assertEqual(response.status_code, 302)
        self.assertEqual(response["Location"], "http://store.test/account/settings?steam=connected")
        self.assertFalse(cache.get(f"steam-link:{state}"))
        post_form.assert_called_once()

    @override_settings(
        FRONTEND_URL="http://store.test",
        STEAM_OPENID_RETURN_URL="http://api.test/api/users/steam/callback/",
    )
    @patch("apps.users.steam._post_form", return_value="is_valid:false\n")
    def test_invalid_openid_assertion_does_not_link_account(self, _post_form):
        state = "invalid-state"
        cache.set(f"steam-link:{state}", self.user.pk, timeout=600)
        response = self.client.get(
            reverse("steam-callback"),
            {
                "state": state,
                "openid.mode": "id_res",
                "openid.claimed_id": "https://steamcommunity.com/openid/id/76561198000000001",
                "openid.identity": "https://steamcommunity.com/openid/id/76561198000000001",
                "openid.return_to": f"http://api.test/api/users/steam/callback/?state={state}",
                "openid.signed": "claimed_id,identity,return_to",
                "openid.sig": "invalid-signature",
            },
        )
        self.user.refresh_from_db()
        self.assertIsNone(self.user.steam_id64)
        self.assertEqual(response["Location"], "http://store.test/account/settings?steam=failed")

    def test_trade_url_must_be_a_steam_trade_offer_link(self):
        bad = self.client.patch(reverse("steam-connection"), {"trade_url": "https://example.com/"}, format="json")
        self.assertEqual(bad.status_code, 400)
        good_url = "https://steamcommunity.com/tradeoffer/new/?partner=123456&token=abc"
        good = self.client.patch(reverse("steam-connection"), {"trade_url": good_url}, format="json")
        self.assertEqual(good.status_code, 200)
        self.assertEqual(good.data["trade_url"], good_url)

    def test_inventory_requires_a_linked_steam_account(self):
        response = self.client.get(reverse("steam-inventory"), {"game": "cs2"})
        self.assertEqual(response.status_code, 409)

    @patch(
        "apps.users.steam.urlopen",
        return_value=BytesIO(json.dumps({
            "success": 1,
            "assets": [{"assetid": "asset-1", "classid": "class-1", "instanceid": "0", "amount": "1"}],
            "descriptions": [{
                "classid": "class-1", "instanceid": "0", "name": "AK-47 | Redline",
                "market_hash_name": "AK-47 | Redline", "icon_url": "icon-hash", "tradable": 1, "marketable": 1,
            }],
        }).encode()),
    )
    def test_public_inventory_assets_are_mapped_for_the_account_page(self, open_url):
        self.user.steam_id64 = "76561198000000001"
        self.user.save(update_fields=["steam_id64"])
        response = self.client.get(reverse("steam-inventory"), {"game": "cs2"})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["total"], 1)
        self.assertEqual(response.data["items"][0]["asset_id"], "asset-1")
        self.assertEqual(response.data["items"][0]["name"], "AK-47 | Redline")
        self.assertTrue(response.data["items"][0]["tradable"])
        open_url.assert_called_once()
