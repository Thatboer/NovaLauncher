"""Create original Nova branding for the unsigned Windows preview. No upstream icons redistributed."""
from pathlib import Path
from PIL import Image, ImageDraw
import sys

root = Path(sys.argv[1])
icons = root / "xmcl-electron-app" / "icons"
icons.mkdir(parents=True, exist_ok=True)
size = 512
image = Image.new("RGBA", (size, size), (0, 0, 0, 0))
draw = ImageDraw.Draw(image)
draw.rounded_rectangle((14, 14, 498, 498), radius=112, fill=(126, 72, 181, 255))
draw.rounded_rectangle((27, 27, 485, 485), radius=105, outline=(249, 214, 255, 255), width=9)
draw.polygon([(113, 374), (172, 133), (215, 133), (155, 374)], fill=(254, 226, 255, 255))
draw.polygon([(177, 134), (226, 134), (346, 329), (330, 374), (287, 374)], fill=(254, 226, 255, 255))
draw.polygon([(296, 374), (356, 133), (399, 133), (339, 374)], fill=(254, 226, 255, 255))
draw.ellipse((62, 258, 449, 321), outline=(244, 194, 255, 145), width=13)
for variant in ("dark", "light"):
    image.save(icons / (variant + ".ico"), sizes=[(16, 16), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)])
    image.resize((256, 256), Image.Resampling.LANCZOS).save(icons / (variant + "@256x256.png"))
    image.resize((32, 32), Image.Resampling.LANCZOS).save(icons / (variant + "@tray.png"))
print("Nova icon assets generated:", icons)
