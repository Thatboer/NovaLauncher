"""Original NOVA-only cosmic app icon, matching the launcher brand, with no SMP text."""
from PIL import Image, ImageDraw, ImageFont, ImageFilter
from pathlib import Path
import random
import sys

dest = Path(sys.argv[1])
dest.mkdir(parents=True, exist_ok=True)
S = 512
im = Image.new('RGBA', (S, S), (0, 0, 0, 0))
d = ImageDraw.Draw(im)
d.ellipse((9, 9, 503, 503), fill=(13, 6, 26, 255), outline=(170, 38, 246, 255), width=8)
d.ellipse((18, 18, 494, 494), outline=(193, 94, 244, 100), width=3)
random.seed(504)
for i in range(85):
    x, y = random.randint(31, 480), random.randint(31, 478)
    if (x-256)**2 + (y-256)**2 < 226**2:
        radius = random.choice((1, 1, 1, 2))
        d.ellipse((x-radius, y-radius, x+radius, y+radius), fill=(234, 194, 255, random.randint(130, 245)))
def cross(cx, cy, r, color=(255, 214, 255, 255)):
    d.line((cx-r, cy, cx+r, cy), fill=color, width=3)
    d.line((cx, cy-r, cx, cy+r), fill=color, width=3)
cross(256, 89, 37)
cross(96, 145, 12)
cross(420, 350, 11)
d.polygon([(256, 12), (269, 26), (256, 40), (243, 26)], outline=(198, 100, 250, 255), width=3)
for a, b, c, e in ((92, 200, 155, 160), (370, 353, 432, 301)):
    d.line((a, b, c, e), fill=(180, 70, 255, 235), width=5)
    d.ellipse((c-3, e-3, c+3, e+3), fill=(255, 225, 255, 255))
font_candidates = [
    'C:/Windows/Fonts/ariblk.ttf',
    'C:/Windows/Fonts/arialbd.ttf',
    '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
]
font_file = next((f for f in font_candidates if Path(f).exists()), None)
if not font_file:
    raise SystemExit('A bold system TrueType font is required for NOVA branding')
size = 132
while True:
    font = ImageFont.truetype(font_file, size)
    bounds = d.textbbox((0, 0), 'NOVA', font=font, stroke_width=3)
    width = bounds[2] - bounds[0]
    if width <= 403 or size <= 50:
        break
    size -= 2
x = (512 - width) // 2 - bounds[0]
y = 212 - bounds[1]
d.text((x, y), 'NOVA', font=font, fill=(129, 47, 219, 255),
       stroke_width=3, stroke_fill=(241, 196, 255, 255))
# Small floating pixel island and violet portal, without any SMP wording.
d.polygon([(123, 379), (190, 354), (325, 354), (389, 380), (355, 409),
           (259, 470), (161, 411)], fill=(86, 65, 88, 255))
d.polygon([(123, 377), (190, 349), (326, 349), (389, 377), (347, 390),
           (257, 401), (151, 393)], fill=(78, 156, 62, 255))
for x_tree in (174, 335):
    d.rectangle((x_tree-5, 329, x_tree+5, 376), fill=(101, 57, 26, 255))
    d.rectangle((x_tree-29, 318, x_tree+29, 344), fill=(51, 148, 62, 255))
    d.rectangle((x_tree-17, 305, x_tree+18, 324), fill=(58, 157, 69, 255))
d.rectangle((228, 318, 286, 393), fill=(42, 33, 53, 255), outline=(185, 169, 199, 255), width=7)
d.rectangle((240, 332, 274, 381), fill=(130, 42, 205, 255))
d.ellipse((246, 347, 269, 373), fill=(180, 81, 252, 100))
for x_post in (210, 300):
    d.rectangle((x_post-5, 354, x_post+5, 389), fill=(174, 172, 193, 255))
    d.ellipse((x_post-7, 345, x_post+7, 362), fill=(250, 220, 255, 255))
im.resize((128, 128), Image.Resampling.LANCZOS).save(dest / '128x128.png')
im.resize((256, 256), Image.Resampling.LANCZOS).save(dest / '128x128@2x.png')
im.save(dest / 'icon.ico', sizes=[(16,16),(32,32),(48,48),(64,64),(128,128),(256,256)])
print('Generated NOVA-only icons:', dest)
