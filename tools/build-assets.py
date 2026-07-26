"""Build the web-ready art for the site.

Two jobs:

1. The painted backgrounds and gradient shapes in assets/Backgrounds/ and
   assets/Gradient Shapes/ are 4000px masters totalling ~1 GB. Far past
   what GitHub Pages will serve. This renders the ~2 MB of WebP the site
   actually ships, into assets/art/.

2. The animal silhouettes in assets/textureanimals/SVG/ are numbered
   1-123. This copies the handful the site uses into assets/marks/ under
   readable names, so the markup says "giraffe.svg" and not "119.svg".

    python tools/build-assets.py

Requires Pillow. Deterministic — re-running on unchanged masters leaves
an empty git diff.
"""

import os
import glob
import shutil

from PIL import Image, ImageEnhance

Image.MAX_IMAGE_PIXELS = None

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ASSETS = os.path.join(ROOT, "assets")
ART_OUT = os.path.join(ASSETS, "art")
MARK_OUT = os.path.join(ASSETS, "marks")

# (source dir, output prefix, long edge px, quality, keep alpha)
#
# Backgrounds are always used as full-bleed grounds, so alpha is dropped
# and they are flattened onto white. The gradient shapes are cut-outs and
# keep theirs.
# Only the paintings the page actually ships. Add names here (and
# rerun) when a new page needs more of the collection.
GROUNDS = ["b24"]   # the footer night sky; hero + plates build below

ART = [
    ("Backgrounds", "bg", 1800, 64, False),
]

# The quietmotion pack: 60 large motion-blurred nature photographs.
# Nothing ships from it right now; add entries when a page needs one.
# number -> (name, output subdir, long edge, quality)
QUIET = {}

# The marks the site ships. The full pack stays in
# assets/textureanimals/SVG — add entries here when needed.
MARKS = {
    "47": "penguin",   # the footer colophon mark
}


def render(src, dst, long_edge, quality, keep_alpha):
    im = Image.open(src)
    if im.mode != "RGBA":
        im = im.convert("RGBA")

    if keep_alpha:
        bbox = im.getchannel("A").getbbox()
        if bbox:
            im = im.crop(bbox)

    w, h = im.size
    scale = long_edge / float(max(w, h))
    if scale < 1:
        im = im.resize((max(1, round(w * scale)), max(1, round(h * scale))), Image.LANCZOS)

    if not keep_alpha:
        flat = Image.new("RGB", im.size, (255, 255, 255))
        flat.paste(im, mask=im.split()[-1])
        im = flat

    os.makedirs(os.path.dirname(dst), exist_ok=True)
    im.save(dst, "WEBP", quality=quality, method=5)
    return im.size, os.path.getsize(dst)


def build_art():
    total = 0
    count = 0
    for sub, prefix, edge, q, alpha in ART:
        src_dir = os.path.join(ASSETS, sub)
        if not os.path.isdir(src_dir):
            print("skipping missing dir:", sub)
            continue
        for src in sorted(glob.glob(os.path.join(src_dir, "*.*"))):
            if os.path.splitext(src)[1].lower() not in (".png", ".jpg", ".jpeg"):
                continue
            name = os.path.splitext(os.path.basename(src))[0].replace(" ", "").lower()
            if prefix == "bg" and name not in GROUNDS:
                continue
            dst = os.path.join(ART_OUT, prefix, name + ".webp")
            size, written = render(src, dst, edge, q, alpha)
            total += written
            count += 1
            print("%-18s %4dx%-4d %6.0f KB" % (prefix + "/" + name, size[0], size[1], written / 1024.0))
    return count, total


def build_marks():
    src_dir = os.path.join(ASSETS, "textureanimals", "SVG")
    if not os.path.isdir(src_dir):
        print("skipping marks: no SVG dir")
        return 0, 0
    os.makedirs(MARK_OUT, exist_ok=True)
    total = 0
    count = 0
    for num, name in sorted(MARKS.items(), key=lambda kv: kv[1]):
        src = os.path.join(src_dir, num + ".svg")
        if not os.path.exists(src):
            print("  missing mark source:", num)
            continue
        dst = os.path.join(MARK_OUT, name + ".svg")
        shutil.copyfile(src, dst)
        written = os.path.getsize(dst)
        total += written
        count += 1
        print("%-18s %6.0f KB  (from %s.svg)" % ("marks/" + name, written / 1024.0, num))
    return count, total


def build_hero():
    """The hero ground: the b4 heat painting with its colour pushed
    hard — the site's one full-saturation moment. Kept as a build
    step so the boost is reproducible, not a one-off export."""
    src = os.path.join(ASSETS, "Backgrounds", "b4.png")
    if not os.path.exists(src):
        print("skipping hero ground: no b4.png")
        return 0, 0
    im = Image.open(src).convert("RGB")
    im = ImageEnhance.Color(im).enhance(2.4)
    im = ImageEnhance.Contrast(im).enhance(1.12)
    # Full-viewport and full-saturation, so it gets what nothing else
    # does: a 2400px cut at high quality. The grain is the point —
    # heavy compression smears it into banding.
    im.thumbnail((2400, 2400), Image.LANCZOS)
    dst = os.path.join(ART_OUT, "bg", "hero.webp")
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    im.save(dst, "WEBP", quality=88, method=5)
    written = os.path.getsize(dst)
    print("%-18s %4dx%-4d %6.0f KB" % ("bg/hero", im.size[0], im.size[1], written / 1024.0))
    return 1, written


def build_plates():
    """The three case-study plates. They render at up to ~1100px wide
    on the page, so like the hero they get a high-quality cut instead
    of the lean bg default — grain intact, no banding."""
    names = ["b20", "b8", "b3"]
    total = 0
    count = 0
    for name in names:
        src = None
        for ext in (".png", ".jpg", ".jpeg"):
            cand = os.path.join(ASSETS, "Backgrounds", name + ext)
            if os.path.exists(cand):
                src = cand
                break
        if src is None:
            print("  missing plate source:", name)
            continue
        im = Image.open(src).convert("RGB")
        # a mild lift toward the hero's punch — enough to keep the
        # plates bright, mild enough that the paintings stay painterly
        im = ImageEnhance.Color(im).enhance(1.35)
        im.thumbnail((2000, 2000), Image.LANCZOS)
        dst = os.path.join(ART_OUT, "plate", name + ".webp")
        os.makedirs(os.path.dirname(dst), exist_ok=True)
        im.save(dst, "WEBP", quality=85, method=5)
        written = os.path.getsize(dst)
        total += written
        count += 1
        print("%-18s %4dx%-4d %6.0f KB" % ("plate/" + name, im.size[0], im.size[1], written / 1024.0))
    return count, total


def build_quiet():
    src_dir = os.path.join(ASSETS, "quietmotion")
    if not os.path.isdir(src_dir):
        print("skipping quietmotion: no dir")
        return 0, 0
    total = 0
    count = 0
    for num, (name, sub, edge, q) in sorted(QUIET.items(), key=lambda kv: kv[1][0]):
        src = None
        for ext in (".jpeg", ".jpg"):
            cand = os.path.join(src_dir, num + ext)
            if os.path.exists(cand):
                src = cand
                break
        if src is None:
            print("  missing quietmotion source:", num)
            continue
        im = Image.open(src).convert("RGB")
        w, h = im.size
        scale = edge / float(max(w, h))
        if scale < 1:
            im = im.resize((round(w * scale), round(h * scale)), Image.LANCZOS)
        dst = os.path.join(ART_OUT, sub, name + ".webp")
        os.makedirs(os.path.dirname(dst), exist_ok=True)
        im.save(dst, "WEBP", quality=q, method=5)
        written = os.path.getsize(dst)
        total += written
        count += 1
        print("%-18s %4dx%-4d %6.0f KB" % (sub + "/" + name, im.size[0], im.size[1], written / 1024.0))
    return count, total


def main():
    ac, at = build_art()
    print()
    mc, mt = build_marks()
    print()
    qc, qt = build_quiet()
    print()
    build_hero()
    print()
    build_plates()
    print("\n%d images (%.2f MB) + %d marks (%.0f KB) + %d photos (%.2f MB)"
          % (ac, at / 1048576.0, mc, mt / 1024.0, qc, qt / 1048576.0))


if __name__ == "__main__":
    main()
