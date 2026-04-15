#!/usr/bin/env python3
from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont


ROOT = Path(__file__).resolve().parent.parent
BRAND_DIR = ROOT / "assets" / "brand"
FONT_DIR = ROOT / "assets" / "fonts"

TEXT_FONT = FONT_DIR / "Tektur-Medium.ttf"
BODY_FONT = FONT_DIR / "InstrumentSans-Regular.ttf"

BG = (7, 10, 20, 255)
PANEL = (15, 23, 43, 240)
STROKE = (86, 108, 143, 255)
ORANGE = (255, 137, 58, 255)
ICE = (220, 233, 255, 255)
ASH = (108, 126, 158, 255)


def font(path: Path, size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(str(path), size=size)


def draw_mark(base: Image.Image, with_panel: bool = False) -> None:
    draw = ImageDraw.Draw(base)
    width, height = base.size

    if with_panel:
        draw.rounded_rectangle(
            (32, 32, width - 32, height - 32),
            radius=width // 6,
            fill=PANEL,
            outline=(35, 52, 80, 255),
            width=3,
        )

    cx, cy = width / 2, height / 2
    scale = min(width, height)
    orbit_box = (
        cx - scale * 0.28,
        cy - scale * 0.20,
        cx + scale * 0.28,
        cy + scale * 0.20,
    )
    secondary_box = (
        cx - scale * 0.17,
        cy - scale * 0.34,
        cx + scale * 0.17,
        cy + scale * 0.34,
    )

    glow = Image.new("RGBA", base.size, (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow)
    glow_draw.ellipse(
        (cx - scale * 0.08, cy - scale * 0.08, cx + scale * 0.08, cy + scale * 0.08),
        fill=(255, 137, 58, 220),
    )
    glow_draw.arc(orbit_box, start=215, end=15, fill=(255, 137, 58, 180), width=max(4, int(scale * 0.028)))
    glow = glow.filter(ImageFilter.GaussianBlur(radius=scale * 0.015))
    base.alpha_composite(glow)

    draw.arc(orbit_box, start=210, end=20, fill=ORANGE, width=max(4, int(scale * 0.025)))
    draw.arc(secondary_box, start=122, end=325, fill=ICE, width=max(2, int(scale * 0.018)))

    moon_box = (
        cx - scale * 0.09,
        cy - scale * 0.09,
        cx + scale * 0.09,
        cy + scale * 0.09,
    )
    draw.ellipse(moon_box, fill=ICE)
    draw.ellipse(
        (
            moon_box[0] + scale * 0.05,
            moon_box[1] - scale * 0.008,
            moon_box[2] + scale * 0.06,
            moon_box[3] + scale * 0.008,
        ),
        fill=BG if not with_panel else PANEL,
    )

    capsule = [
        (cx - scale * 0.03, cy + scale * 0.13),
        (cx + scale * 0.04, cy + scale * 0.04),
        (cx + scale * 0.08, cy + scale * 0.08),
        (cx + scale * 0.01, cy + scale * 0.17),
    ]
    draw.polygon(capsule, fill=ASH, outline=ICE)
    draw.line(
        (cx - scale * 0.20, cy + scale * 0.24, cx + scale * 0.22, cy + scale * 0.24),
        fill=STROKE,
        width=max(2, int(scale * 0.012)),
    )
    draw.ellipse(
        (cx + scale * 0.23, cy - scale * 0.18, cx + scale * 0.27, cy - scale * 0.14),
        fill=ORANGE,
    )


def create_mark() -> None:
    image = Image.new("RGBA", (1024, 1024), (0, 0, 0, 0))
    draw_mark(image)
    image.save(BRAND_DIR / "logo-mark.png")


def create_wordmark() -> None:
    image = Image.new("RGBA", (1500, 480), (0, 0, 0, 0))
    mark = Image.new("RGBA", (420, 420), (0, 0, 0, 0))
    draw_mark(mark, with_panel=True)
    image.alpha_composite(mark, (24, 30))

    draw = ImageDraw.Draw(image)
    headline_font = font(TEXT_FONT, 116)
    meta_font = font(BODY_FONT, 34)
    draw.text((470, 92), "ORBITAL", font=headline_font, fill=ICE)
    draw.text((470, 208), "SIGNAL", font=headline_font, fill=ORANGE)
    draw.text((476, 336), "ARTEMIS II WALLPAPER ARCHIVE", font=meta_font, fill=(154, 173, 202, 255))
    draw.line((474, 316, 1148, 316), fill=STROKE, width=3)
    image.save(BRAND_DIR / "logo-wordmark.png")


def create_favicon() -> None:
    favicon = Image.new("RGBA", (256, 256), BG)
    draw_mark(favicon, with_panel=True)
    favicon.save(BRAND_DIR / "favicon.png")
    favicon.resize((180, 180), Image.Resampling.LANCZOS).save(BRAND_DIR / "apple-touch-icon.png")


def create_social_card() -> None:
    width, height = 1200, 630
    image = Image.new("RGBA", (width, height), BG)
    draw = ImageDraw.Draw(image)
    draw.rounded_rectangle((36, 36, width - 36, height - 36), radius=40, outline=(29, 47, 76, 255), width=4)
    draw.ellipse((-140, -180, 420, 380), fill=(18, 29, 55, 255))
    draw.ellipse((760, 260, 1310, 820), fill=(13, 19, 36, 255))
    draw.arc((120, 90, 530, 420), start=210, end=8, fill=ORANGE, width=14)
    draw.arc((160, 60, 460, 480), start=125, end=330, fill=ICE, width=10)
    draw.ellipse((260, 180, 380, 300), fill=ICE)
    draw.ellipse((320, 170, 420, 310), fill=BG)

    headline = font(TEXT_FONT, 78)
    subhead = font(BODY_FONT, 30)
    micro = font(BODY_FONT, 22)
    draw.text((580, 150), "ARTEMIS II", font=headline, fill=ICE)
    draw.text((580, 240), "WALLPAPER", font=headline, fill=ORANGE)
    draw.text((582, 352), "HD NASA lunar mission backgrounds for desktop and phone", font=subhead, fill=(172, 188, 213, 255))
    draw.text((582, 430), "Non-official editorial collection with source credit", font=micro, fill=(132, 151, 181, 255))
    draw.line((582, 405, 1042, 405), fill=STROKE, width=3)
    image.save(BRAND_DIR / "social-card.png")


def main() -> None:
    BRAND_DIR.mkdir(parents=True, exist_ok=True)
    create_mark()
    create_wordmark()
    create_favicon()
    create_social_card()
    print(f"Brand assets generated in {BRAND_DIR}")


if __name__ == "__main__":
    main()
