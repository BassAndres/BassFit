const fs = require('fs');
const { Resvg } = require('@resvg/resvg-js');

// ---- The BassFit mark: a dumbbell crossed with a bass guitar ----
// Drawn on a 1024 canvas, premium gradient, monochrome marks with a blue accent.
function mark(scale, cx, cy) {
  // group transform helper applied per element via translate/rotate strings
  return `
  <!-- BASS GUITAR (rotated +32deg), behind -->
  <g transform="translate(${cx} ${cy}) rotate(28) scale(${scale})" fill="#FFFFFF" opacity="0.96">
    <!-- body -->
    <path d="M -60 150
             C -150 150 -175 250 -120 300
             C -70 345 70 345 120 300
             C 175 250 150 150 60 150
             C 30 150 -30 150 -60 150 Z" fill="#F2F2F7"/>
    <circle cx="0" cy="250" r="34" fill="#0A84FF"/>
    <rect x="-46" y="150" width="92" height="34" rx="10" fill="#0A84FF"/>
    <!-- neck -->
    <rect x="-26" y="-300" width="52" height="470" rx="18" fill="#F2F2F7"/>
    <!-- headstock -->
    <rect x="-44" y="-372" width="88" height="92" rx="20" fill="#F2F2F7"/>
    <circle cx="-24" cy="-352" r="11" fill="#0A0A0C"/>
    <circle cx="-24" cy="-312" r="11" fill="#0A0A0C"/>
    <circle cx="24" cy="-352" r="11" fill="#0A0A0C"/>
    <circle cx="24" cy="-312" r="11" fill="#0A0A0C"/>
    <!-- strings -->
    <rect x="-12" y="-280" width="3" height="445" fill="#0A0A0C" opacity="0.45"/>
    <rect x="-4" y="-280" width="3" height="445" fill="#0A0A0C" opacity="0.45"/>
    <rect x="4" y="-280" width="3" height="445" fill="#0A0A0C" opacity="0.45"/>
    <rect x="12" y="-280" width="3" height="445" fill="#0A0A0C" opacity="0.45"/>
  </g>

  <!-- DUMBBELL (rotated -32deg), front -->
  <g transform="translate(${cx} ${cy}) rotate(-28) scale(${scale})" fill="#FFFFFF">
    <!-- handle -->
    <rect x="-210" y="-26" width="420" height="52" rx="26" fill="#FFFFFF"/>
    <!-- inner plates -->
    <rect x="-250" y="-70" width="48" height="140" rx="20" fill="#FFFFFF"/>
    <rect x="202" y="-70" width="48" height="140" rx="20" fill="#FFFFFF"/>
    <!-- outer plates -->
    <rect x="-312" y="-104" width="56" height="208" rx="24" fill="#0A84FF"/>
    <rect x="256" y="-104" width="56" height="208" rx="24" fill="#0A84FF"/>
  </g>`;
}

const ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#1C1C1E"/>
      <stop offset="1" stop-color="#000000"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.5" cy="0.42" r="0.6">
      <stop offset="0" stop-color="#0A84FF" stop-opacity="0.22"/>
      <stop offset="1" stop-color="#0A84FF" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1024" height="1024" fill="url(#bg)"/>
  <rect width="1024" height="1024" fill="url(#glow)"/>
  ${mark(1.0, 512, 512)}
</svg>`;

const SPLASH = `<svg xmlns="http://www.w3.org/2000/svg" width="1242" height="1242" viewBox="0 0 1242 1242">
  <rect width="1242" height="1242" fill="#000000"/>
  ${mark(0.9, 621, 560)}
  <text x="621" y="930" font-family="Helvetica, Arial, sans-serif" font-size="92" font-weight="700" fill="#FFFFFF" text-anchor="middle" letter-spacing="2">BassFit</text>
</svg>`;

function render(svg, w, out) {
  const r = new Resvg(svg, { fitTo: { mode: 'width', value: w } });
  fs.writeFileSync(out, r.render().asPng());
  console.log('wrote', out, w);
}

const dir = process.argv[2] || '.';
render(ICON, 1024, `${dir}/icon.png`);
render(ICON, 1024, `${dir}/adaptive-icon.png`);
render(ICON, 196, `${dir}/favicon.png`);
render(SPLASH, 1242, `${dir}/splash.png`);
