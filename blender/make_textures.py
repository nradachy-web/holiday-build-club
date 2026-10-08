"""Original four-color knit studies. No generated image is edited by this script."""
import json, math
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'blender' / 'textures'
OUT.mkdir(exist_ok=True)
FONT = '/System/Library/Fonts/Supplemental/Arial Bold.ttf'
MONO = '/System/Library/Fonts/Supplemental/Andale Mono.ttf'

def snow(draw, x, y, scale, color):
    for angle in range(0, 360, 45):
        a=math.radians(angle)
        dx,dy=math.cos(a),math.sin(a)
        draw.line((x,y,x+dx*scale,y+dy*scale),fill=color,width=2)
        for turn in (-1,1):
            b=a+turn*math.pi/3
            px,py=x+dx*scale*.58,y+dy*scale*.58
            draw.line((px,py,px-math.cos(b)*scale*.35,py-math.sin(b)*scale*.35),fill=color,width=2)

def txt(draw, text, y, color, maxsize=31):
    size=maxsize
    while True:
        font=ImageFont.truetype(FONT,size)
        box=draw.textbbox((0,0),text,font=font)
        if box[2]<440 or size<8: break
        size-=1
    draw.text((256,y),text,anchor='mt',font=font,fill=color)

for i,item in enumerate(json.loads((ROOT/'designs/collection.json').read_text())):
    c=item['colors']; im=Image.new('RGB',(512,512),c[0]); draw=ImageDraw.Draw(im)
    if i==9:
        draw.rectangle((256,0,512,512),fill=c[1]);c=[c[0],c[2],c[3],c[1]]
    if i==7:
        for y in range(-60,620,120):
            for x in range(-60,620,120):
                draw.polygon([(x,y-55),(x+55,y),(x,y+55),(x-55,y)],fill=c[1 if ((x+y)//120)%2 else 2])
        draw.rectangle((28,175,484,390),fill=c[0])
    for y in (35,113,423,490):
        draw.rectangle((0,y,512,y+5),fill=c[1])
        draw.rectangle((0,y+9,512,y+12),fill=c[3])
        for x in range(10,512,24):
            draw.polygon([(x,y+14),(x+6,y+20),(x,y+26),(x-6,y+20)],fill=c[1])
    for y in (80,468):
        for x in range(28,512,58): snow(draw,x,y,17,c[1])
    words=item['phrase'].split(' / ')
    if len(words)==2:
        txt(draw,words[0],191,c[1],32); txt(draw,words[1],336,c[1],35)
    else:
        txt(draw,words[0],180,c[1],27)
        txt(draw,words[1],325,c[1],30);txt(draw,words[2],368,c[1],28)
    # An original terminal tree motif, intentionally limited to a yarn grid.
    draw.rounded_rectangle((205,238,307,303),radius=2,outline=c[1],width=4)
    draw.line((205,251,307,251),fill=c[1],width=3)
    for x in (214,222,230): draw.rectangle((x,243,x+3,246),fill=c[3])
    for n in range(4):
        y=259+n*8; w=7+n*7
        draw.polygon(((256,y),(256-w,y+8),(256+w,y+8)),fill=c[1])
    draw.rectangle((252,291,260,298),fill=c[3])
    # Pixel-sized geometry makes the texture useful as a knit study.
    im.save(OUT/(item['id']+'.png'))
print('CREATED_10_ORIGINAL_KNIT_TEXTURES')

