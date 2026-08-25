#!/usr/bin/env python3
"""Create the Hablemos Tech leads landing on Beacon (slug: hablemos-tech).

Requires BEACON_TOKEN from https://beacon.enteracloud.mx/admin/settings/tokens

Usage:
  export BEACON_TOKEN=bcn_...
  python3 scripts/setup-beacon-leads.py
"""
from __future__ import annotations

import json
import os
import sys

API = os.environ.get("BEACON_API_BASE", "https://beacon.enteracloud.mx/api/v1/tools")
SLUG = "hablemos-tech"


def curl_tool(token: str, tool: str, payload: dict) -> dict:
    import subprocess
    import tempfile
    from pathlib import Path

    with tempfile.NamedTemporaryFile("w", suffix=".json", delete=False) as handle:
        json.dump(payload, handle)
        path = handle.name
    try:
        result = subprocess.run(
            [
                "curl",
                "-sS",
                "-X",
                "POST",
                f"{API.rstrip('/')}/{tool}",
                "-H",
                f"Authorization: Bearer {token}",
                "-H",
                "Content-Type: application/json",
                "--data-binary",
                f"@{path}",
            ],
            capture_output=True,
            text=True,
            check=False,
        )
    finally:
        Path(path).unlink(missing_ok=True)
    if result.returncode != 0:
        raise SystemExit(result.stderr or "curl failed")
    try:
        return json.loads(result.stdout)
    except json.JSONDecodeError as exc:
        raise SystemExit(result.stdout[:2000]) from exc


def main() -> None:
    token = os.environ.get("BEACON_TOKEN", "").strip()
    if not token:
        print("Set BEACON_TOKEN (bcn_… from beacon.enteracloud.mx/admin/settings/tokens)")
        sys.exit(1)

    landing = {
        "slug": SLUG,
        "domain": f"{SLUG}.enteracloud.mx",
        "brand": "enteracloud",
        "vertical": "Hablemos Tech",
        "locale": "es-MX",
        "owner_email": "contacto@enteracloud.mx",
        "owner_name": "Hablemos Tech",
        "copy": {
            "style": {"theme": "dark", "template": "poster"},
            "hero": {
                "headline": "Hablemos Tech",
                "subheadline": "Leads del sitio hablemostech.com",
            },
            "form": {
                "fields": [
                    {"name": "name", "label": "Nombre", "type": "text", "required": True},
                    {"name": "email", "label": "Email", "type": "email", "required": True},
                    {"name": "company", "label": "Empresa", "type": "text", "required": True},
                    {"name": "puesto", "label": "Área / puesto", "type": "text", "required": True},
                    {"name": "phone", "label": "Teléfono", "type": "tel", "required": False},
                    {"name": "message", "label": "Nota", "type": "textarea", "required": False},
                    {"name": "consent", "label": "Consentimiento", "type": "checkbox", "required": True},
                ]
            },
        },
        "seo": {
            "title": "Hablemos Tech — leads",
            "description": "Registros del sitio Hablemos Tech",
        },
    }

    existing = curl_tool(token, "landing_get", {"slug": SLUG})
    found = bool(existing.get("result") or existing.get("slug") or existing.get("copy"))
    if existing.get("error") or str(existing.get("message", "")).lower() == "not found":
        found = False

    if found:
        result = curl_tool(
            token,
            "landing_update",
            {"slug": SLUG, "patch": {"copy": landing["copy"], "seo": landing["seo"]}},
        )
        action = "updated"
    else:
        result = curl_tool(token, "landing_create", landing)
        action = "created"

    print(action)
    print(json.dumps(result, indent=2, ensure_ascii=False)[:3000])

    form = curl_tool(
        token,
        "landing_set_form",
        {
            "slug": SLUG,
            "action": "set",
            "fields": landing["copy"]["form"]["fields"],
        },
    )
    print("form")
    print(json.dumps(form, indent=2, ensure_ascii=False)[:1500])

    publish = curl_tool(token, "landing_publish", {"slug": SLUG, "status": "live"})
    print("publish")
    print(json.dumps(publish, indent=2, ensure_ascii=False)[:1500])
    print(f"\nLeads URL: https://{SLUG}.enteracloud.mx/leads")


if __name__ == "__main__":
    main()
