#!/usr/bin/env python3
"""WCAG contrast check for colour pairs defined in assets/css/brand.css.  Run: python3 tools/check-contrast.py"""
import re, sys, pathlib
css = (pathlib.Path(__file__).parent.parent / "assets/css/brand.css").read_text()
v = dict(re.findall(r"--([a-z0-9-]+):\s*(#[0-9A-Fa-f]{6})", css))
def lum(h):
    r,g,b=[int(h[i:i+2],16)/255 for i in (1,3,5)]
    f=lambda c: c/12.92 if c<=0.03928 else ((c+0.055)/1.055)**2.4
    return 0.2126*f(r)+0.7152*f(g)+0.0722*f(b)
def cr(a,b):
    la,lb=sorted([lum(a),lum(b)],reverse=True); return (la+0.05)/(lb+0.05)
pairs=[("text","bg",4.5),("text","surface",4.5),("text-muted","bg",4.5),("text-muted","surface",4.5),("text-muted","surface-2",4.5),
("brand-secondary","bg",4.5),("brand-secondary","surface",4.5),("brand-secondary","surface-2",4.5),("brand-primary","bg",4.5),("brand-primary","surface-2",4.5),
("brand-accent-ink","brand-accent-soft",4.5),("surface","brand-secondary",4.5),("surface","brand-purple-deep",4.5)]
for k in ("remove","stop","rewrite","disclose","verify","interp","doc"):
    pairs.append((f"c-{k}",f"c-{k}-bg",4.5)); pairs.append((f"c-{k}","surface",4.5))
pairs += [("c-verify","bg",4.5),("c-remove","bg",4.5)]
# gradient stops used behind hero and page-head text
extra=[]
for stop in ("#FFFFFF","#EAFEFD","#BCFBF9","#FFE8E9","#E4FDFC"):
    for name,fg in (("headline ink",v["brand-primary"]),("muted text",v["text-muted"]),("purple accent",v["brand-secondary"])):
        extra.append((fg,stop,f"{name} on hero/head gradient {stop}"))
extra += [("#D9D8EE",v["brand-primary"],"footer text"),("#FFFFFF",v["brand-primary"],"footer links"),("#1A1940","#EFE8FB","info callout text"),("#3A2600","#FFF3D6","interp note text"),(v["brand-primary"],"#FFFFFF","nav links on white"),(v["brand-secondary"],"#FFFFFF","nav current / hover on white")]
bad=0
for a,b,t in pairs:
    r=cr(v[a],v[b]); ok=r>=t; bad+=not ok
    print(f"{'PASS' if ok else 'FAIL'} {r:5.2f}  {a} on {b}")
for a,b,n in extra:
    r=cr(a,b); ok=r>=4.5; bad+=not ok
    print(f"{'PASS' if ok else 'FAIL'} {r:5.2f}  {n} ({a} on {b})")
print("\nAll pairs meet WCAG AA (4.5:1)" if not bad else f"\n{bad} pair(s) below 4.5:1")
sys.exit(1 if bad else 0)
