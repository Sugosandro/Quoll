export interface STLResult {
  volumeMm3: number
  triangleCount: number
  overhangRatio: number  // 0–1: frazione di superficie in sbalzo
}

// Soglia: normale.z < -0.5 ≈ sbalzo > 60° dall'orizzontale
const OVERHANG_THRESHOLD = -0.5

function signedVolumeOfTriangle(
  ax: number, ay: number, az: number,
  bx: number, by: number, bz: number,
  cx: number, cy: number, cz: number,
): number {
  return (ax * (by * cz - bz * cy) + ay * (bz * cx - bx * cz) + az * (bx * cy - by * cx)) / 6
}

function triangleContrib(
  ax: number, ay: number, az: number,
  bx: number, by: number, bz: number,
  cx: number, cy: number, cz: number,
): { area: number; isOverhang: boolean } {
  const e1x = bx - ax, e1y = by - ay, e1z = bz - az
  const e2x = cx - ax, e2y = cy - ay, e2z = cz - az
  const nx = e1y * e2z - e1z * e2y
  const ny = e1z * e2x - e1x * e2z
  const nz = e1x * e2y - e1y * e2x
  const len = Math.sqrt(nx * nx + ny * ny + nz * nz)
  return {
    area: len / 2,
    isOverhang: len > 0 && (nz / len) < OVERHANG_THRESHOLD,
  }
}

function parseBinary(buffer: ArrayBuffer): STLResult {
  const view = new DataView(buffer)
  const n = view.getUint32(80, true)
  let vol = 0, totalArea = 0, overhangArea = 0

  for (let i = 0; i < n; i++) {
    const off = 84 + i * 50
    const ax = view.getFloat32(off + 12, true), ay = view.getFloat32(off + 16, true), az = view.getFloat32(off + 20, true)
    const bx = view.getFloat32(off + 24, true), by = view.getFloat32(off + 28, true), bz = view.getFloat32(off + 32, true)
    const cx = view.getFloat32(off + 36, true), cy = view.getFloat32(off + 40, true), cz = view.getFloat32(off + 44, true)
    vol += signedVolumeOfTriangle(ax, ay, az, bx, by, bz, cx, cy, cz)
    const { area, isOverhang } = triangleContrib(ax, ay, az, bx, by, bz, cx, cy, cz)
    totalArea += area
    if (isOverhang) overhangArea += area
  }

  return {
    volumeMm3: Math.abs(vol),
    triangleCount: n,
    overhangRatio: totalArea > 0 ? overhangArea / totalArea : 0,
  }
}

function parseAscii(text: string): STLResult {
  const re = /vertex\s+([\d.eE+-]+)\s+([\d.eE+-]+)\s+([\d.eE+-]+)/g
  const verts: number[] = []
  let m
  while ((m = re.exec(text)) !== null) verts.push(parseFloat(m[1]), parseFloat(m[2]), parseFloat(m[3]))

  let vol = 0, totalArea = 0, overhangArea = 0

  for (let i = 0; i < verts.length; i += 9) {
    const ax = verts[i], ay = verts[i + 1], az = verts[i + 2]
    const bx = verts[i + 3], by = verts[i + 4], bz = verts[i + 5]
    const cx = verts[i + 6], cy = verts[i + 7], cz = verts[i + 8]
    vol += signedVolumeOfTriangle(ax, ay, az, bx, by, bz, cx, cy, cz)
    const { area, isOverhang } = triangleContrib(ax, ay, az, bx, by, bz, cx, cy, cz)
    totalArea += area
    if (isOverhang) overhangArea += area
  }

  return {
    volumeMm3: Math.abs(vol),
    triangleCount: verts.length / 9,
    overhangRatio: totalArea > 0 ? overhangArea / totalArea : 0,
  }
}

export function parseSTL(buffer: ArrayBuffer): STLResult {
  const view = new DataView(buffer)
  const n = view.getUint32(80, true)
  if (buffer.byteLength === 84 + n * 50 && n > 0) return parseBinary(buffer)
  const text = new TextDecoder().decode(buffer)
  if (text.trimStart().toLowerCase().startsWith('solid')) {
    try { return parseAscii(text) } catch { /* fall through */ }
  }
  return parseBinary(buffer)
}
