// Seigaiha waves along the foot, a vermilion sun in the top corner, a few drifting petals.
export const SCENE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice">
<style>
.ground { fill: #f3ecdc; }
.wave { fill: none; stroke: #274a78; stroke-opacity: 0.10; stroke-width: 2; }
.sun { fill: #c8473a; opacity: 0.16; }
.petal { fill: #e8a0a8; opacity: 0.55; }
.p1 { animation: drift1 38s linear infinite; }
.p2 { animation: drift2 46s linear infinite; }
.p3 { animation: drift1 54s linear infinite; animation-delay: -20s; }
@keyframes drift1 { from { transform: translate(0px, 0px) rotate(0deg); } to { transform: translate(-260px, 900px) rotate(320deg); } }
@keyframes drift2 { from { transform: translate(0px, 0px) rotate(0deg); } to { transform: translate(-180px, 950px) rotate(-280deg); } }
@media (prefers-color-scheme: dark) {
  .ground { fill: #17151a; }
  .wave { stroke: #8fa6c9; stroke-opacity: 0.08; }
  .sun { fill: #d9a441; opacity: 0.10; }
  .petal { fill: #b9727c; opacity: 0.35; }
}
</style>
<defs>
<pattern id="seigaiha" width="80" height="40" patternUnits="userSpaceOnUse">
<g class="wave">
<path d="M0 40a40 40 0 0 1 80 0M10 40a30 30 0 0 1 60 0M20 40a20 20 0 0 1 40 0M30 40a10 10 0 0 1 20 0"/>
<path d="M-40 20a40 40 0 0 1 80 0M-30 20a30 30 0 0 1 60 0M-20 20a20 20 0 0 1 40 0M-10 20a10 10 0 0 1 20 0"/>
<path d="M40 20a40 40 0 0 1 80 0M50 20a30 30 0 0 1 60 0M60 20a20 20 0 0 1 40 0M70 20a10 10 0 0 1 20 0"/>
</g>
</pattern>
</defs>
<rect class="ground" width="1600" height="1000"/>
<rect y="760" width="1600" height="240" fill="url(#seigaiha)"/>
<svg x="1100" y="0" width="500" height="400" viewBox="0 0 500 400" preserveAspectRatio="xMaxYMin meet">
<circle class="sun" cx="380" cy="110" r="90"/>
</svg>
<g class="p1"><ellipse class="petal" cx="1450" cy="60" rx="9" ry="5"/></g>
<g class="p2"><ellipse class="petal" cx="1250" cy="20" rx="7" ry="4"/></g>
<g class="p3"><ellipse class="petal" cx="1520" cy="160" rx="8" ry="4"/></g>
</svg>`
