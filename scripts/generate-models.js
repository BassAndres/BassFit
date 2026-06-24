/* Generates a .glb pack for BassFit: one stylized low-poly humanoid per muscle
 * group, with the worked muscle highlighted in accent. Pure geometry (boxes),
 * exported to binary glTF via @gltf-transform/core. */
const fs = require('fs');
const path = require('path');
const { Document, NodeIO } = require('@gltf-transform/core');

const ACCENT = [0.039, 0.518, 1.0]; // #0A84FF
const BASE = [0.56, 0.56, 0.58, 1.0];

// ---- geometry: axis-aligned boxes with per-face normals ----
function addBox(g, cx, cy, cz, w, h, d) {
  const hx = w / 2, hy = h / 2, hz = d / 2;
  const x0 = cx - hx, x1 = cx + hx, y0 = cy - hy, y1 = cy + hy, z0 = cz - hz, z1 = cz + hz;
  const faces = [
    { n: [1, 0, 0], p: [[x1, y0, z1], [x1, y1, z1], [x1, y1, z0], [x1, y0, z0]] },
    { n: [-1, 0, 0], p: [[x0, y0, z0], [x0, y1, z0], [x0, y1, z1], [x0, y0, z1]] },
    { n: [0, 1, 0], p: [[x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0]] },
    { n: [0, -1, 0], p: [[x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1]] },
    { n: [0, 0, 1], p: [[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]] },
    { n: [0, 0, -1], p: [[x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0]] },
  ];
  for (const f of faces) {
    const base = g.pos.length / 3;
    for (const v of f.p) {
      g.pos.push(v[0], v[1], v[2]);
      g.nor.push(f.n[0], f.n[1], f.n[2]);
    }
    g.idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
  }
}

function emptyGeom() {
  return { pos: [], nor: [], idx: [] };
}

// ---- body parts (boxes) ----
function buildBase() {
  const g = emptyGeom();
  addBox(g, 0, 0.92, 0, 0.3, 0.3, 0.28); // head
  addBox(g, 0, 0.79, 0, 0.12, 0.12, 0.12); // neck
  addBox(g, 0, 0.5, 0, 0.5, 0.62, 0.26); // torso
  addBox(g, 0, 0.13, 0, 0.46, 0.2, 0.24); // pelvis
  addBox(g, -0.33, 0.56, 0, 0.14, 0.44, 0.14); // upper arm L
  addBox(g, 0.33, 0.56, 0, 0.14, 0.44, 0.14); // upper arm R
  addBox(g, -0.39, 0.15, 0, 0.12, 0.42, 0.12); // forearm L
  addBox(g, 0.39, 0.15, 0, 0.12, 0.42, 0.12); // forearm R
  addBox(g, -0.14, -0.16, 0, 0.2, 0.52, 0.18); // thigh L
  addBox(g, 0.14, -0.16, 0, 0.2, 0.52, 0.18); // thigh R
  addBox(g, -0.14, -0.7, 0, 0.16, 0.46, 0.16); // calf L
  addBox(g, 0.14, -0.7, 0, 0.16, 0.46, 0.16); // calf R
  addBox(g, -0.14, -0.96, 0.05, 0.16, 0.08, 0.26); // foot L
  addBox(g, 0.14, -0.96, 0.05, 0.16, 0.08, 0.26); // foot R
  return g;
}

// muscle -> accent patches (slightly proud of the surface)
const PATCHES = {
  chest: [[-0.12, 0.66, 0.15, 0.2, 0.22, 0.06], [0.12, 0.66, 0.15, 0.2, 0.22, 0.06]],
  abs: [[0, 0.4, 0.15, 0.24, 0.3, 0.06]],
  shoulders: [[-0.33, 0.74, 0, 0.2, 0.18, 0.2], [0.33, 0.74, 0, 0.2, 0.18, 0.2]],
  biceps: [[-0.33, 0.58, 0.09, 0.16, 0.28, 0.06], [0.33, 0.58, 0.09, 0.16, 0.28, 0.06]],
  triceps: [[-0.33, 0.58, -0.09, 0.16, 0.28, 0.06], [0.33, 0.58, -0.09, 0.16, 0.28, 0.06]],
  forearms: [[-0.39, 0.15, 0.08, 0.14, 0.32, 0.06], [0.39, 0.15, 0.08, 0.14, 0.32, 0.06]],
  back: [[0, 0.58, -0.15, 0.44, 0.44, 0.06]],
  quads: [[-0.14, -0.14, 0.12, 0.2, 0.44, 0.06], [0.14, -0.14, 0.12, 0.2, 0.44, 0.06]],
  hamstrings: [[-0.14, -0.14, -0.12, 0.2, 0.44, 0.06], [0.14, -0.14, -0.12, 0.2, 0.44, 0.06]],
  glutes: [[-0.12, 0.05, -0.15, 0.2, 0.22, 0.06], [0.12, 0.05, -0.15, 0.2, 0.22, 0.06]],
  calves: [[-0.14, -0.7, -0.1, 0.16, 0.36, 0.06], [0.14, -0.7, -0.1, 0.16, 0.36, 0.06]],
  fullBody: [
    [0, 0.66, 0.15, 0.44, 0.22, 0.06], [0, 0.58, -0.15, 0.44, 0.44, 0.06],
    [-0.14, -0.14, 0.12, 0.2, 0.44, 0.06], [0.14, -0.14, 0.12, 0.2, 0.44, 0.06],
    [-0.33, 0.74, 0, 0.2, 0.18, 0.2], [0.33, 0.74, 0, 0.2, 0.18, 0.2],
  ],
};

function buildAccent(muscle) {
  const g = emptyGeom();
  for (const p of PATCHES[muscle]) addBox(g, p[0], p[1], p[2], p[3], p[4], p[5]);
  return g;
}

function writeGlb(muscle, outDir) {
  const doc = new Document();
  const buffer = doc.createBuffer();

  const baseMat = doc.createMaterial('base')
    .setBaseColorFactor(BASE).setRoughnessFactor(0.85).setMetallicFactor(0).setDoubleSided(true);
  const accMat = doc.createMaterial('accent')
    .setBaseColorFactor([ACCENT[0], ACCENT[1], ACCENT[2], 1])
    .setEmissiveFactor([ACCENT[0] * 0.6, ACCENT[1] * 0.6, ACCENT[2] * 0.6])
    .setRoughnessFactor(0.4).setMetallicFactor(0).setDoubleSided(true);

  function prim(g, mat) {
    const pos = doc.createAccessor().setType('VEC3').setArray(new Float32Array(g.pos)).setBuffer(buffer);
    const nor = doc.createAccessor().setType('VEC3').setArray(new Float32Array(g.nor)).setBuffer(buffer);
    const idx = doc.createAccessor().setType('SCALAR').setArray(new Uint32Array(g.idx)).setBuffer(buffer);
    return doc.createPrimitive().setAttribute('POSITION', pos).setAttribute('NORMAL', nor).setIndices(idx).setMaterial(mat);
  }

  const mesh = doc.createMesh(muscle);
  mesh.addPrimitive(prim(buildBase(), baseMat));
  mesh.addPrimitive(prim(buildAccent(muscle), accMat));

  const node = doc.createNode('Mannequin').setMesh(mesh);
  doc.createScene().addChild(node);

  return new NodeIO().writeBinary(doc).then((glb) => {
    const out = path.join(outDir, `${muscle}.glb`);
    fs.writeFileSync(out, glb);
    return { muscle, bytes: glb.length, prims: mesh.listPrimitives().length };
  });
}

async function main() {
  const outDir = process.argv[2];
  fs.mkdirSync(outDir, { recursive: true });
  const muscles = Object.keys(PATCHES);
  const results = [];
  for (const m of muscles) results.push(await writeGlb(m, outDir));
  for (const r of results) console.log(`${r.muscle}.glb  ${r.bytes} bytes  ${r.prims} prims`);
  console.log(`\nGenerated ${results.length} models in ${outDir}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
