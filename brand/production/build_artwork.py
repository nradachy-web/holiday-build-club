#!/usr/bin/env python3
"""Build PROMPT DEPT outlined artwork masters from the project's Barlow fonts.

No network access. FontTools is preferred, with a static TrueType fallback.
Output is original editable vector artwork. These construction studies are
not factory tech packs.
"""
from pathlib import Path
import argparse
import hashlib
import html
import json
import shutil
import struct
try:
    from fontTools.ttLib import TTFont
    from fontTools.pens.svgPathPen import SVGPathPen
    from fontTools.pens.boundsPen import BoundsPen
except ImportError:
    TTFont = None

HERE = Path(__file__).resolve().parent
PROJECT = HERE.parent.parent
INK = "#151613"
BONE = "#EEEAE0"
ACID = "#D5FF45"
W, H = 1200, 1400


def choose_font(explicit):
    if explicit:
        p = Path(explicit).expanduser().resolve()
        if not p.is_file():
            raise FileNotFoundError(p)
        return p
    preferred = PROJECT / "site" / "assets" / "font-2.ttf"
    if preferred.is_file():
        return preferred
    candidates = [p for p in (PROJECT / "site" / "assets").rglob("*")
                  if p.suffix.lower() in {".ttf", ".otf", ".woff", ".woff2"}
                  and "barlow" in p.name.lower()]
    if not candidates:
        raise RuntimeError("No project Barlow font found. Supply --font with the licensed local file.")
    def score(p):
        n = p.name.lower()
        return (100 if "condensed" in n else 0) + (40 if "black" in n or "900" in n else 30 if "extrabold" in n or "800" in n else 20 if "bold" in n or "700" in n else 0) + (5 if p.suffix == ".ttf" else 0)
    return sorted(candidates, key=lambda p: (-score(p), str(p)))[0]


class BasicTrueType:
    """Dependency-free outlining for this project's static TrueType font.

    FontTools remains the preferred backend. This fallback handles simple
    and XY-positioned composite glyf contours with quadratic Bezier paths.
    """
    def __init__(self, path):
        self.data = path.read_bytes()
        def unpack(fmt, offset):
            return struct.unpack_from(">"+fmt,self.data,offset)
        self.unpack = unpack
        self.tables = {}
        for i in range(unpack("H",4)[0]):
            tag,checksum,offset,length = unpack("4sIII",12+i*16)
            self.tables[tag.decode()] = (offset,length)
        if "glyf" not in self.tables:
            raise RuntimeError("FontTools is missing and this font is not a static glyf TrueType font.")
        head = self.tables["head"][0]
        self.upm = unpack("H",head+18)[0]
        locfmt = unpack("h",head+50)[0]
        self.count = unpack("H",self.tables["maxp"][0]+4)[0]
        hcount = unpack("H",self.tables["hhea"][0]+34)[0]
        hm = self.tables["hmtx"][0]
        self.widths = [unpack("H",hm+min(i,hcount-1)*4)[0] for i in range(self.count)]
        lo = self.tables["loca"][0]
        self.loca = [unpack("I" if locfmt else "H",lo+i*(4 if locfmt else 2))[0]*(1 if locfmt else 2) for i in range(self.count+1)]
        co = self.tables["cmap"][0]
        subtables = []
        for i in range(unpack("H",co+2)[0]):
            platform,encoding,off = unpack("HHI",co+4+8*i)
            form = unpack("H",co+off)[0]
            if form in (4,12):
                subtables.append((form,co+off))
        form,co = sorted(subtables,reverse=True)[0]
        self.cmap = {}
        if form == 12:
            for i in range(unpack("I",co+12)[0]):
                start,end,gid = unpack("III",co+16+12*i)
                for char in range(start,end+1):
                    self.cmap[char] = gid+char-start
        else:
            segs = unpack("H",co+6)[0]//2
            endbase=co+14
            startbase=endbase+2*segs+2
            deltab=startbase+2*segs
            rangeb=deltab+2*segs
            for i in range(segs):
                end=unpack("H",endbase+2*i)[0]
                start=unpack("H",startbase+2*i)[0]
                delta=unpack("h",deltab+2*i)[0]
                ro=unpack("H",rangeb+2*i)[0]
                for c in range(start,min(end,65534)+1):
                    if ro:
                        g=unpack("H",rangeb+2*i+ro+2*(c-start))[0]
                        gid=(g+delta)&65535 if g else 0
                    else:
                        gid=(c+delta)&65535
                    self.cmap[c]=gid

    def contours(self,gid,depth=0):
        if depth>12:
            raise ValueError("Composite glyph recursion exceeds safe limit")
        if self.loca[gid] == self.loca[gid+1]:
            return [],None
        off=self.tables["glyf"][0]+self.loca[gid]
        n,xmin,ymin,xmax,ymax=self.unpack("hhhhh",off)
        bounds=(xmin,ymin,xmax,ymax)
        pos=off+10
        contours=[]
        if n>=0:
            ends=list(self.unpack("H"*n,pos)) if n else []
            pos+=2*n
            ilen=self.unpack("H",pos)[0]
            pos+=2+ilen
            flags=[]
            total=ends[-1]+1 if ends else 0
            while len(flags)<total:
                flag=self.data[pos];pos+=1
                flags.append(flag)
                if flag&8:
                    repeat=self.data[pos];pos+=1
                    flags.extend([flag]*repeat)
            coords=[]
            for short,same in ((2,16),(4,32)):
                values=[];current=0
                for f in flags:
                    if f&short:
                        d=self.data[pos];pos+=1
                        current+=d if f&same else -d
                    elif not f&same:
                        current+=self.unpack("h",pos)[0];pos+=2
                    values.append(current)
                coords.append(values)
            last=0
            for end in ends:
                contours.append([(coords[0][i],coords[1][i],bool(flags[i]&1)) for i in range(last,end+1)])
                last=end+1
        else:
            more=True
            while more:
                flags,cgid=self.unpack("HH",pos);pos+=4
                words=bool(flags&1)
                if not flags&2:
                    raise ValueError("Point-matched composite requires FontTools")
                dx,dy=self.unpack("hh" if words else "bb",pos);pos+=4 if words else 2
                xx=yy=1.;xy=yx=0.
                if flags&8:
                    xx=yy=self.unpack("h",pos)[0]/16384.;pos+=2
                elif flags&64:
                    xx,yy=[v/16384. for v in self.unpack("hh",pos)];pos+=4
                elif flags&128:
                    xx,xy,yx,yy=[v/16384. for v in self.unpack("hhhh",pos)];pos+=8
                child,_=self.contours(cgid,depth+1)
                contours.extend([[(xx*x+xy*y+dx,yx*x+yy*y+dy,on) for x,y,on in c] for c in child])
                more=bool(flags&32)
        return contours,bounds

    def glyph(self,char):
        gid=self.cmap.get(ord(char))
        if gid is None:
            raise ValueError(f"Font lacks {char!r}")
        contours,bounds=self.contours(gid)
        parts=[]
        def num(n):
            return str(int(n)) if int(n)==n else f"{n:.3f}"
        def xy(p):
            return num(p[0])+" "+num(p[1])
        for contour in contours:
            first,last=contour[0],contour[-1]
            if first[2]:
                start=first;points=contour[1:]
            elif last[2]:
                start=last;points=contour[:-1]
            else:
                start=((first[0]+last[0])/2,(first[1]+last[1])/2,True);points=contour
            parts.append("M"+xy(start))
            i=0
            while i<len(points):
                p=points[i]
                if p[2]:
                    parts.append("L"+xy(p));i+=1
                else:
                    q=points[i+1] if i+1<len(points) else start
                    if q[2]:
                        parts.append("Q"+xy(p)+" "+xy(q));i+=2
                    else:
                        middle=((p[0]+q[0])/2,(p[1]+q[1])/2,True)
                        parts.append("Q"+xy(p)+" "+xy(middle));i+=1
            parts.append("Z")
        return "".join(parts),self.widths[gid],bounds


class Lettering:
    def __init__(self, fontpath):
        self.path = fontpath
        self.raw = BasicTrueType(fontpath) if TTFont is None else None
        self.cache = {}
        if self.raw:
            self.upm = self.raw.upm
            return
        self.font = TTFont(str(fontpath))
        if "fvar" in self.font:
            from fontTools.varLib.instancer import instantiateVariableFont
            axes = {a.axisTag: min(a.maxValue, 800) for a in self.font["fvar"].axes if a.axisTag == "wght"}
            if axes:
                self.font = instantiateVariableFont(self.font, axes, inplace=False)
        self.cmap = self.font.getBestCmap()
        self.glyphs = self.font.getGlyphSet()
        self.metrics = self.font["hmtx"].metrics
        self.upm = self.font["head"].unitsPerEm
        self.cache = {}

    def glyph(self, char):
        if char not in self.cache:
            if self.raw:
                self.cache[char] = self.raw.glyph(char)
                return self.cache[char]
            name = self.cmap.get(ord(char))
            if name is None:
                raise ValueError(f"Font lacks character {char!r}")
            pen = SVGPathPen(self.glyphs)
            self.glyphs[name].draw(pen)
            bounds = BoundsPen(self.glyphs)
            self.glyphs[name].draw(bounds)
            self.cache[char] = (pen.getCommands(), self.metrics[name][0], bounds.bounds)
        return self.cache[char]

    def line(self, content, x, y, max_width, height, fill=BONE, align="left", tracking=0, label=None):
        raw_width = sum(self.glyph(c)[1] for c in content) + tracking * max(0, len(content)-1)
        bounds = [self.glyph(c)[2] for c in content if self.glyph(c)[2]]
        ytop = max(b[3] for b in bounds)
        ybottom = min(b[1] for b in bounds)
        scale = min(height / (ytop-ybottom), max_width / raw_width)
        width = raw_width * scale
        ox = x + ((max_width-width)/2 if align == "center" else max_width-width if align == "right" else 0)
        cursor = 0
        paths = []
        for char in content:
            data, advance, _ = self.glyph(char)
            if data:
                paths.append(f'<path d="{data}" transform="translate({cursor:.3f} 0)"/>')
            cursor += advance + tracking
        aria = html.escape(label or content, quote=True)
        return f'<g aria-label="{aria}" fill="{fill}" transform="translate({ox:.3f} {y+ytop*scale:.3f}) scale({scale:.6f} {-scale:.6f})">' + "".join(paths) + '</g>'


def meter(x, y, width=230, color=ACID):
    """Three original hollow bars, with a displaced diagonal fracture in bar 3."""
    scale = width / 230
    return f'''<g id="broken-meter" aria-label="Original broken three-bar meter" transform="translate({x} {y}) scale({scale})" fill="{color}">
<path d="M0 0H60V72H0ZM10 10V62H50V10Z" fill-rule="evenodd"/>
<path d="M80 0H140V72H80ZM90 10V62H130V10Z" fill-rule="evenodd"/>
<path d="M160 0H220V25L210 35V10H170V58L160 68Z"/>
<path d="M169 84V73L229 13V29L182 76H229V86H169Z"/>
<path d="M17 45H43V55H17Z"/>
</g>'''


def rule(x, y, width, color=ACID, thickness=5):
    return f'<path d="M{x} {y}H{x+width}" fill="none" stroke="{color}" stroke-width="{thickness}"/>'


def svg(title, body, description):
    return f'''<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape" width="12in" height="14in" viewBox="0 0 {W} {H}" role="img" aria-labelledby="art-title art-desc">
<title id="art-title">{html.escape(title)}</title>
<desc id="art-desc">{html.escape(description)} Transparent artboard. All visible letters are outlined paths. Original broken three-bar meter. Construction study, not a factory tech pack.</desc>
<g id="artwork">{body}</g>
</svg>
'''


def build(fontpath):
    t = Lettering(fontpath)
    HERE.mkdir(parents=True, exist_ok=True)
    output = []
    def label(content, y, size=24, fill=BONE, x=85, width=1030):
        return t.line(content,x,y,width,size,fill,tracking=90)
    def save(slug, title, content, description):
        p = HERE / f"{slug}.svg"
        p.write_text(svg(title, content, description))
        output.append({"file":p.name,"phrase":title,"sha256":hashlib.sha256(p.read_bytes()).hexdigest()})
    body = label("PROMPT DEPT / CHANGE REQUEST",100) + meter(850,92,265)
    body += t.line("I ONLY",85,315,1030,195) + t.line("CAME HERE",85,535,1030,190)
    body += t.line("TO CHANGE",85,750,1030,185) + t.line("A BUTTON",85,965,1030,195,ACID)
    body += rule(85,1220,1030) + label("ONE SMALL CHANGE.",1260,25)
    save("01-change-a-button","I ONLY CAME HERE / TO CHANGE A BUTTON",body,"Four-line stacked front print with acid emphasis on A BUTTON.")

    body = meter(85,115,220) + label("APPROVAL RECORD",142,27,x=570,width=545)
    body += t.line("I APPROVED",85,320,1030,170) + t.line("THE PLAN.",85,525,1030,190)
    body += rule(85,780,1030,BONE,3)
    body += t.line("NOT",85,845,1030,215,ACID) + t.line("THIS.",85,1090,1030,200,ACID)
    body += label("PROMPT DEPT",1310,20,x=755,width=360)
    save("02-not-this","I APPROVED THE PLAN. / NOT THIS.",body,"Editorial approval typography with a hard divider and acid NOT THIS.")

    body = label("PROMPT DEPT / STATUS REPORT",110)
    body += t.line("IT WORKS",85,320,1030,225)
    body += t.line("IN THE",85,595,1030,155,ACID)
    body += t.line("SUMMARY.",85,800,1030,200)
    body += meter(85,1140,260) + rule(410,1185,705,BONE,3)
    body += label("REPORTED SUCCESS",1280,24)
    save("03-in-the-summary","IT WORKS / IN THE SUMMARY.",body,"Status-report arrangement with an open lower field and meter signature.")

    body = meter(488,100,224)
    body += t.line("I USED MY",85,305,1030,175,align="center")
    body += t.line("LAST TOKEN",85,510,1030,190,ACID,align="center")
    body += t.line("TO SAY",85,750,1030,165,align="center")
    body += t.line("THANK YOU",85,945,1030,180,align="center")
    body += rule(355,1210,490,BONE,3)
    body += t.line("PROMPT DEPT",355,1260,490,27,BONE,align="center",tracking=100)
    save("04-last-token","I USED MY LAST TOKEN / TO SAY THANK YOU",body,"Centered gratitude print, wide breathing room, acid LAST TOKEN.")

    body = label("PROMPT DEPT / AVAILABILITY",110)
    body += t.line("ASK ME",85,315,1030,250)
    body += rule(85,645,1030,BONE,3)
    body += t.line("AFTER",85,735,1030,225,ACID)
    body += t.line("RESET",85,1000,1030,225,ACID)
    body += meter(900,1290,210)
    save("05-after-reset","ASK ME / AFTER RESET",body,"Large left-aligned type with an acid second half and small trailing meter.")

    body = meter(85,110,230) + label("BALANCE STATEMENT",139,26,x=605,width=510)
    body += t.line("ALL MY",85,325,1030,205)
    body += t.line("MONEY",85,570,1030,225)
    body += t.line("IS IN",85,845,1030,140)
    body += t.line("TOKENS",85,1030,1030,220,ACID)
    body += rule(85,1310,1030) + label("PROMPT DEPT",1338,18)
    save("06-all-my-money","ALL MY MONEY / IS IN TOKENS",body,"Balance-statement typography with full-width acid TOKENS.")

    fontdir = HERE / "fonts"
    fontdir.mkdir(exist_ok=True)
    font_ttf = fontdir / "Barlow-Production.ttf"
    if t.raw:
        shutil.copyfile(fontpath,font_ttf)
    else:
        t.font.flavor = None
        t.font.save(font_ttf)
    license_candidates = [p for p in (PROJECT / "site" / "assets").rglob("*") if p.is_file() and ("ofl" in p.name.lower() or "license" in p.name.lower())]
    copied = []
    for p in license_candidates:
        if "barlow" in str(p).lower() or len(license_candidates)==1:
            dest = fontdir / p.name
            shutil.copyfile(p,dest)
            copied.append(str(dest.relative_to(HERE)))
    manifest = {"brand":"PROMPT DEPT","status":"Original construction studies, not factory tech packs", "artboard":{"width":"12 in","height":"14 in","viewBox":"0 0 1200 1400","background":"transparent"},"palette":{"ink":INK,"bone":BONE,"acid":ACID},"font_source":str(fontpath.relative_to(PROJECT)),"font_output":str(font_ttf.relative_to(HERE)),"font_license_files":copied,"artwork":output,"notes":["All visible text is converted to editable SVG paths.","No vendor logos or generated mockup tracing.","Ink is the intended garment or proof background. Bone and acid are the two artwork colors.","Print method, registration, trapping, sizes and substrate require supplier sampling."]}
    (HERE / "manifest.json").write_text(json.dumps(manifest,indent=2)+"\n")
    cards = "".join(f'<figure><div class="art"><img src="{a["file"]}" alt="{html.escape(a["phrase"],quote=True)}"></div><figcaption><b>{i:02d}</b> {html.escape(a["phrase"])}</figcaption><a href="{a["file"]}" download>Download editable SVG</a></figure>' for i,a in enumerate(output,1))
    (HERE / "index.html").write_text(f'''<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>PROMPT DEPT | Artwork masters</title><style>*{{box-sizing:border-box}}body{{margin:0;background:{BONE};color:{INK};font:15px/1.5 system-ui,sans-serif}}main{{max-width:1400px;margin:0 auto;padding:48px 28px}}h1{{font-size:clamp(34px,6vw,78px);line-height:.95;margin:16px 0}}.intro{{max-width:700px}}.grid{{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:28px;margin-top:40px}}figure{{margin:0}}.art{{background:{INK};padding:12px}}img{{width:100%;display:block}}figcaption{{margin:12px 0 6px}}b{{margin-right:10px}}a{{color:inherit}}.note{{margin-top:40px;border-top:1px solid;padding-top:18px}}@media(max-width:800px){{.grid{{grid-template-columns:repeat(2,minmax(0,1fr))}}}}@media(max-width:500px){{.grid{{grid-template-columns:1fr}}}}</style><main><p>PD / ORIGINAL ARTWORK / STUDIES 01-06</p><h1>PROMPT DEPT</h1><p class="intro">Six editable typographic masters. Transparent 12 x 14 inch artboards, outlined Barlow glyphs, bone and acid artwork. The ink background shown here is a preview surface.</p><div class="grid">{cards}</div><p class="note">Construction studies. Supplier proofing and physical samples are still required before production. These originals are independently constructed and do not claim to match generated lifestyle mockups.</p></main></html>''')
    print(json.dumps(manifest,indent=2))


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--font", help="Exact licensed project Barlow font path")
    args = parser.parse_args()
    build(choose_font(args.font))
