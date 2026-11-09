# Generate original, non-Modrinth Nova icons for the Windows test build.
from PIL import Image, ImageDraw
from pathlib import Path
import sys
dest = Path(sys.argv[1])
dest.mkdir(parents=True, exist_ok=True)
sz=512
im=Image.new("RGBA",(sz,sz),(0,0,0,0))
d=ImageDraw.Draw(im)
d.rounded_rectangle((16,16,496,496),radius=105,fill=(116,74,169,255))
d.rounded_rectangle((29,29,483,483),radius=96,outline=(242,197,255,235),width=8)
# A four-pointed nova mark, distinct from Modrinth branding.
d.polygon([(256,57),(297,210),(455,256),(297,300),(256,455),(213,300),(57,256),(213,210)],fill=(239,174,255,255))
d.polygon([(256,130),(277,226),(378,256),(277,287),(256,382),(235,287),(135,256),(235,226)],fill=(253,229,255,255))
im.resize((128,128),Image.Resampling.LANCZOS).save(dest/'128x128.png')
im.resize((256,256),Image.Resampling.LANCZOS).save(dest/'128x128@2x.png')
im.save(dest/'icon.ico',sizes=[(16,16),(32,32),(48,48),(64,64),(128,128),(256,256)])
print('Generated original Nova app icons at',dest)
