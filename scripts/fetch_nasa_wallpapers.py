#!/usr/bin/env python3
from __future__ import annotations

import json
import math
import re
from io import BytesIO
from pathlib import Path
from urllib.parse import quote

import requests
from PIL import Image


ROOT = Path(__file__).resolve().parent.parent
FULL_DIR = ROOT / "assets" / "images" / "wallpapers"
THUMB_DIR = FULL_DIR / "thumbs"
DATA_DIR = ROOT / "assets" / "data"

SEARCH_URL = "https://images-api.nasa.gov/search"
TIMEOUT = 30

SELECTED_WALLPAPERS = [
    {
        "slug": "moonrise-stack",
        "nasa_id": "Artemis II at the pad Moon 01292026_4",
        "focus": "Desktop",
        "group": "Moonrise",
        "featured": True,
        "summary": "A moonlit pad shot that frames SLS and Orion as a single monumental silhouette.",
    },
    {
        "slug": "sunset-anamorphic",
        "nasa_id": "Artemis II at the pad anamorphic 01282026",
        "focus": "Ultrawide",
        "group": "Launch Prep",
        "featured": False,
        "summary": "An anamorphic sunset composition built for wide monitors and cinematic crops.",
    },
    {
        "slug": "liftoff-plume",
        "nasa_id": "SLS_MAF_20260401_ArtemisIILaunch_06",
        "focus": "Phone",
        "group": "Launch Day",
        "featured": True,
        "summary": "A vertical launch frame with dense flame texture and a clean silhouette of ascent.",
    },
    {
        "slug": "looking-back-earth",
        "nasa_id": "art002e000191",
        "focus": "Desktop",
        "group": "In Flight",
        "featured": False,
        "summary": "A quiet deep-space view that turns Earth into a luminous waypoint behind the mission.",
    },
    {
        "slug": "earth-perspective",
        "nasa_id": "art002e000192",
        "focus": "Desktop",
        "group": "In Flight",
        "featured": False,
        "summary": "A clean orbital perspective image suited to minimalist lock screens and dark desktops.",
    },
    {
        "slug": "crew-recovery",
        "nasa_id": "JB5_0746",
        "focus": "Phone",
        "group": "Crew",
        "featured": False,
        "summary": "A vertical recovery scene that captures the human side of the mission after splashdown.",
    },
    {
        "slug": "splashdown-capsule",
        "nasa_id": "KSC-20260410-PH-JNV01_0001",
        "focus": "Phone",
        "group": "Return",
        "featured": False,
        "summary": "Orion under parachutes moments before Pacific splashdown on April 10, 2026.",
    },
    {
        "slug": "ascent-graphic",
        "nasa_id": "Artemis II Mission Trajectory Final",
        "focus": "Desktop",
        "group": "Mission Data",
        "featured": False,
        "summary": "NASA's ascent trajectory graphic for readers who want a mission map in wallpaper form.",
    },
    {
        "slug": "crew-poster",
        "nasa_id": "ArtemisIICrewPoster",
        "focus": "Phone",
        "group": "Poster",
        "featured": False,
        "summary": "Official mission crew poster art with a portrait-oriented editorial feel.",
    },
    {
        "slug": "mission-poster",
        "nasa_id": "ArtemisII_Poster_11x17_300ppi_CMYK",
        "focus": "Phone",
        "group": "Poster",
        "featured": False,
        "summary": "The original Artemis II poster rendered for tall mobile and tablet displays.",
    },
]


def normalize_credit(credit: str | None) -> str:
    value = (credit or "NASA").replace("\\", "/")
    value = re.sub(r"\s*/\s*", "/", value)
    value = re.sub(r"\s+", " ", value).strip()
    return value


def fetch_search_item(nasa_id: str) -> dict:
    response = requests.get(
        SEARCH_URL,
        params={"q": nasa_id, "media_type": "image"},
        timeout=TIMEOUT,
    )
    response.raise_for_status()
    items = response.json()["collection"]["items"]
    for item in items:
        data = item["data"][0]
        if data.get("nasa_id") == nasa_id:
            return item
    raise RuntimeError(f"Unable to locate NASA image metadata for {nasa_id}")


def choose_asset(item: dict) -> tuple[dict, dict]:
    data = item["data"][0]
    links = item.get("links", [])
    candidates = [link for link in links if link.get("render") == "image"]
    candidates.sort(
        key=lambda link: (link.get("width") or 0) * (link.get("height") or 0),
        reverse=True,
    )
    if not candidates:
        raise RuntimeError(f"No image links found for {data.get('nasa_id')}")
    return data, candidates[0]


def download_image(url: str) -> Image.Image:
    response = requests.get(url, timeout=TIMEOUT)
    response.raise_for_status()
    return Image.open(BytesIO(response.content)).convert("RGB")


def resized(image: Image.Image, max_width: int, max_height: int) -> Image.Image:
    copy = image.copy()
    copy.thumbnail((max_width, max_height), Image.Resampling.LANCZOS)
    return copy


def save_webp(image: Image.Image, destination: Path, quality: int) -> None:
    destination.parent.mkdir(parents=True, exist_ok=True)
    image.save(destination, format="WEBP", quality=quality, method=6)


def main() -> None:
    FULL_DIR.mkdir(parents=True, exist_ok=True)
    THUMB_DIR.mkdir(parents=True, exist_ok=True)
    DATA_DIR.mkdir(parents=True, exist_ok=True)

    manifest = []
    for selected in SELECTED_WALLPAPERS:
        item = fetch_search_item(selected["nasa_id"])
        data, best = choose_asset(item)
        full = download_image(best["href"])
        full_image = resized(full, 1800, 1800)
        thumb_image = resized(full, 960, 960)

        full_name = f"{selected['slug']}-full.webp"
        thumb_name = f"{selected['slug']}-thumb.webp"
        full_path = FULL_DIR / full_name
        thumb_path = THUMB_DIR / thumb_name
        save_webp(full_image, full_path, quality=84)
        save_webp(thumb_image, thumb_path, quality=80)

        width, height = full_image.size
        aspect_ratio = round(width / height, 3)
        device = "desktop" if width >= height else "phone"
        resolution_label = f"{width} x {height}"

        manifest.append(
            {
                "slug": selected["slug"],
                "nasa_id": selected["nasa_id"],
                "title": data.get("title", "").strip(),
                "summary": selected["summary"],
                "focus": selected["focus"],
                "group": selected["group"],
                "featured": selected["featured"],
                "date_created": data.get("date_created"),
                "photographer": normalize_credit(data.get("photographer")),
                "credit": normalize_credit(data.get("photographer")),
                "source_url": f"https://images.nasa.gov/details-{quote(selected['nasa_id'])}",
                "full_path": f"assets/images/wallpapers/{full_name}",
                "thumb_path": f"assets/images/wallpapers/thumbs/{thumb_name}",
                "width": width,
                "height": height,
                "aspect_ratio": aspect_ratio,
                "resolution_label": resolution_label,
                "device": device,
                "alt_text": data.get("description_508")
                or data.get("description")
                or data.get("title"),
            }
        )

    manifest_path = DATA_DIR / "wallpapers.json"
    manifest_path.write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    print(f"Wrote {len(manifest)} wallpaper entries to {manifest_path}")


if __name__ == "__main__":
    main()
