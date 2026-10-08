"""Build the original Prompt Dept. PD terminal monogram and outlined wordmarks."""
from pathlib import Path
import importlib.util
import math
import json
import html
ROOT=Path(__file__).resolve().parents[2]
spec=importlib.util.spec_from_file_location('lettering', ROOT/'brand/production/build_artwork.py')
module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
typeface=module.Lettering(ROOT/'site/assets/font-2.ttf')
OUT=ROOT/'site/assets/identity';OUT.mkdir(exist_ok=True)
INK='#151613';BONE='#eeeae0'
P=['1111100','1100110','1100110','1111100','1100000','1100000','1100000']
D=['1111100','1100110','1100011','1100011','1100011','1100110','1111100']
ROWS=[a+'00'+b for a,b in zip(P,D)]
ROWS+=['0000000000000000','0000000000001111']

def svg(body,w,h,title):
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" role="img" aria-label="{html.escape(title)}"><title>{html.escape(title)}</title>{body}</svg>\n'

def mark(color):
    cells={(x,y) for y,row in enumerate(ROWS) for x,c in enumerate(row) if c=='1'}
    edges={}
    for x,y in cells:
        for neighbor,start,end in [((x,y-1),(x,y),(x+1,y)),((x+1,y),(x+1,y),(x+1,y+1)),((x,y+1),(x+1,y+1),(x,y+1)),((x-1,y),(x,y+1),(x,y))]:
            if neighbor not in cells:edges[start]=end
    contours=[]
    while edges:
        start=next(iter(edges));current=start;path=[f'M{start[0]*10} {start[1]*10}']
        while True:
            current=edges.pop(current);path.append(f'L{current[0]*10} {current[1]*10}')
            if current==start:break
        contours.append(''.join(path)+'Z')
    return f'<path fill="{color}" d="{"".join(contours)}"/>'

def wordmark(color):
    return typeface.line('PROMPT',0,0,620,94,color,tracking=12)+typeface.line('DEPT.',0,113,620,84,color,tracking=12)

for name,col in [('ink',INK),('bone',BONE)]:
    (OUT/f'pd-mark-{name}.svg').write_text(svg(mark(col),160,90,'Prompt Dept. original PD cursor monogram'))
    (OUT/f'prompt-dept-wordmark-{name}.svg').write_text(svg(wordmark(col),390,200,'Prompt Dept.'))
    lock=f'<g transform="translate(0 5) scale(.74)">{mark(col)}</g>'+typeface.line('PROMPT DEPT.',138,16,435,51,col,tracking=6)
    (OUT/f'prompt-dept-lockup-{name}.svg').write_text(svg(lock,575,80,'Prompt Dept.'))
(OUT/'prompt-dept-wordmark.svg').write_text((OUT/'prompt-dept-wordmark-ink.svg').read_text())
(OUT/'prompt-dept-lockup.svg').write_text((OUT/'prompt-dept-lockup-ink.svg').read_text())
(OUT/'pd-mark.svg').write_text((OUT/'pd-mark-ink.svg').read_text())
# ASCII contours share the exact silhouette with the compact print mark.
points=[]
occupied={(x,y) for y,row in enumerate(ROWS) for x,c in enumerate(row) if c=='1'}
for x,y in occupied:
    for a in range(6):
        for b in range(6):
            for z,n in [(.75,1),(-.75,-1)]:points.append([x+a/6-8,4.5-y-b/6,z,0,0,n])
    for dx,dy in [(1,0),(-1,0),(0,1),(0,-1)]:
        if (x+dx,y+dy) in occupied:continue
        for a in range(6):
            for b in range(8):
                xx=x+(1 if dx==1 else 0) if dx else x+a/6
                yy=y+(1 if dy==1 else 0) if dy else y+a/6
                points.append([xx-8,4.5-yy,-.75+b*.1875,dx,-dy,0])
(ROOT/'brand/identity/geometry.json').write_text(json.dumps({'rows':ROWS,'depth':1.5,'glyphs':'.:+*#@','description':'Original stepped PD monogram with terminal underscore. Same geometry for ASCII and print.'},indent=2)+'\n')
# Render a static vector ASCII master using original geometric punctuation paths.
cols=108;rows=46;grid={};angle=.35;tilt=-.17
for x,y,z,nx,ny,nz in points:
    xx=x*math.cos(angle)+z*math.sin(angle);zz=-x*math.sin(angle)+z*math.cos(angle)
    yy=y*math.cos(tilt)-zz*math.sin(tilt);depth=y*math.sin(tilt)+zz*math.cos(tilt)
    gx=round(cols/2+xx*5.4);gy=round(rows/2-yy*2.8)
    if 0<=gx<cols and 0<=gy<rows and ((gx,gy) not in grid or grid[gx,gy][0]<depth):
        light=max(0,min(1,.45+(nz*math.cos(angle)-nx*math.sin(angle))*.34+ny*.2))
        grid[gx,gy]=(depth,':+*#'[min(3,int(light*4))])
glyphs={':':'M4 4h.1M4 10h.1','+':'M1 7h6M4 4v6','*':'M1 4l6 6M1 10l6-6M4 3v8','#':'M3 2L2 12M6 2L5 12M1 5h6M1 9h6'}
body=f'<g fill="none" stroke="{INK}" stroke-width="1.25" stroke-linecap="round">'+''.join(f'<path d="{glyphs[g]}" transform="translate({x*8} {y*14})"/>' for (x,y),(z,g) in grid.items())+'</g>'
(OUT/'prompt-dept-ascii.svg').write_text(svg(body,cols*8,rows*14,'Prompt Dept. dimensional ASCII PD monogram'))
(ROOT/'site/assets/prompt-dept/favicon.svg').write_text(svg(f'<rect width="192" height="192" rx="28" fill="{INK}"/><g transform="translate(16 51)">{mark(BONE)}</g>',192,192,'Prompt Dept.'))
(OUT/'prompt-dept-ascii.txt').write_text('\n'.join(''.join(grid.get((x,y),(0,' '))[1] for x in range(cols)).rstrip() for y in range(rows)).rstrip()+'\n')
(ROOT/'brand/identity/README.md').write_text('''# Prompt Dept. identity

Original stepped PD monogram with a terminal cursor underscore. The same silhouette drives the solid print mark and dimensional ASCII edition. Wordmarks are outlined Barlow Condensed from the existing licensed project font. ASCII glyph paths are original vector geometry, with no embedded font dependency.

Run `python3 brand/identity/build_identity.py` to rebuild the transparent SVG masters in `site/assets/identity/` and the favicon. Ink and bone variants are included. `site/ascii-logo.js` animates the extruded mark locally; reduced motion shows a still frame. It suspends when offscreen or the tab is hidden.

Use the solid monogram on small woven labels, cap embroidery and favicons. Use the ASCII edition at large print sizes or on screen, where individual characters remain readable. Supplier stitch and print proofs are still required; these files are design artwork, not a tested production specification.
''')
print('Built eight identity variants, standalone ASCII SVG/TXT, favicon and geometry source.')
