# Redraws each expression picture as pure-vector SVG: colour-quantised horizontal runs, one path per colour.
import sys, json
from PIL import Image
src_dir, out_dir, width, colors = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4])
report = {}
for name in ['angry', 'pout', 'fluster', 'happy', 'sleepy']:
    im = Image.open(f'{src_dir}/{name}.png').convert('RGBA')
    h = round(im.height * width / im.width)
    im = im.resize((width, h), Image.LANCZOS)
    alpha = im.getchannel('A')
    q = im.convert('RGB').quantize(colors=colors, method=Image.Quantize.FASTOCTREE, dither=Image.Dither.NONE)
    pal = q.getpalette()
    qp, ap = q.load(), alpha.load()
    rects = []            # [x0, y0, w, h, c]
    open_runs = {}        # (x0, w, c) -> index of the rect still growing downward
    for y in range(h):
        row = {}
        x = 0
        while x < width:
            if ap[x, y] < 110:
                x += 1
                continue
            c = qp[x, y]
            x0 = x
            while x < width and ap[x, y] >= 110 and qp[x, y] == c:
                x += 1
            key = (x0, x - x0, c)
            if key in open_runs:
                i = open_runs[key]
                rects[i][3] += 1
            else:
                i = len(rects)
                rects.append([x0, y, x - x0, 1, c])
            row[key] = i
        open_runs = row
    paths = {}
    for x0, y0, w, hh, c in rects:
        paths.setdefault(c, []).append(f'M{x0} {y0}h{w}v{hh}h-{w}z')
    body = ''.join(
        f'<path fill="#{pal[c*3]:02x}{pal[c*3+1]:02x}{pal[c*3+2]:02x}" d="{"".join(d)}"/>'
        for c, d in sorted(paths.items(), key=lambda kv: -len(kv[1]))
    )
    svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {h + 3}" width="{width}" height="{h + 3}" shape-rendering="crispEdges">'
           '<style>.bob { animation: bob 3.4s ease-in-out infinite; } '
           '@keyframes bob { 0%, 100% { transform: translateY(1.5px); } 50% { transform: translateY(0px); } }</style>'
           f'<g class="bob">{body}</g></svg>')
    open(f'{out_dir}/{name}.svg', 'w').write(svg)
    report[name] = [width, h + 3, len(svg)]
print(json.dumps(report))
