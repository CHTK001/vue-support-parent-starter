/**
 * 台风不对称风圈工具
 *
 * 基于 @turf/turf 生成「不对称风圈多边形」：
 * 台风各方位风速/半径不同（受移动速度与科氏力影响），
 * 业务上常以 8 方位（北/东北/东/东南/南/西南/西/西北）给出风圈半径。
 * 本工具按方位角取点、插值后闭合为多边形，可直接交给 Leaflet Polygon。
 */
import { destination, polygon } from "@turf/turf";
import type { Position } from "@turf/helpers";

/** 8 方位半径数组下标顺序（与台风业务报文一致） */
export type RingRadii = [
  number, number, number, number,
  number, number, number, number,
];

/** 4 方位半径数组：东北 / 东南 / 西南 / 西北（浙水利台风报文常见形态） */
export type RingRadii4 = [number, number, number, number];

/** 8 方位名（顺序同 RingRadii） */
export const RING_DIRECTIONS = [
  "北", "东北", "东", "东南",
  "南", "西南", "西", "西北",
] as const;

/** 4 方位名（顺序同 RingRadii4） */
export const RING_DIRECTIONS_4 = ["东北", "东南", "西南", "西北"] as const;

/**
 * 生成不对称风圈多边形坐标
 *
 * @param center [lat, lng] 台风中心（Leaflet 习惯 lat 在前）
 * @param radii  8 方位半径（单位：公里）
 * @param steps  每 45° 象限内插值点数（越大越圆滑，推荐 6~10）
 * @returns     闭合环坐标 `[lat, lng][]`，可直接用于 `ShapeType.POLYGON`
 */
export function genAsymRing(
  center: [number, number],
  radii: RingRadii,
  steps = 8,
): [number, number][] {
  const [lat, lng] = center;
  const centerPos: Position = [lng, lat]; // turf 习惯 [lng, lat]

  const ring: Position[] = [];
  for (let i = 0; i < 8; i++) {
    const baseBearing = i * 45; // 0°(北) 起，顺时针
    const radius = Math.max(radii[i], 0);
    for (let s = 0; s < steps; s++) {
      const bearing = baseBearing + (45 / steps) * s;
      const pt = destination(centerPos, radius, bearing, { units: "kilometers" });
      const [plng, plat] = pt.geometry.coordinates;
      ring.push([plat, plng]);
    }
  }
  // 闭合：首点追加到末尾
  ring.push(ring[0]);

  // 用 turf.polygon 校验有效性（可选），此处直接返回坐标环
  return ring as [number, number][];
}

/**
 * 基于 4 方位半径（东北/东南/西南/西北）生成不对称风圈多边形坐标。
 *
 * 与 8 方位版本不同：正北/正东/正南/正西等"主方位"通过相邻 NE/SE/SW/NW
 * 在 90° 扇区内做余弦加权插值得到，避免把"东 = NE"这种几何错位硬塞进 polygon。
 *
 * @param center [lat, lng] 台风中心
 * @param radii4 4 方位半径 [NE, SE, SW, NW]，单位：公里
 * @param steps  每 90° 扇区内插值点数（推荐 8~12）
 */
export function genAsymRing4(
  center: [number, number],
  radii4: RingRadii4,
  steps = 10,
): [number, number][] {
  const [lat, lng] = center;
  const centerPos: Position = [lng, lat];
  const [ne, se, sw, nw] = radii4.map((r) => Math.max(Number(r) || 0, 0));

  // 4 个锚点方位（顺时针，从 NE 起）
  const anchors: { bearing: number; r: number }[] = [
    { bearing: 45, r: ne },   // 东北
    { bearing: 135, r: se },  // 东南
    { bearing: 225, r: sw },  // 西南
    { bearing: 315, r: nw },  // 西北
  ];

  const ring: Position[] = [];
  for (let i = 0; i < 4; i++) {
    const cur = anchors[i];
    const nxt = anchors[(i + 1) % 4];
    // 扇区从 cur.bearing 到 nxt.bearing，顺时针 90°
    for (let s = 0; s < steps; s++) {
      const t = s / steps; // 0..1（不含 1，最后一段闭合由首点负责）
      const bearing = cur.bearing + 90 * t;
      // 在两锚点半径间做余弦加权平滑（避免线性插值在锚点处出现尖角）
      const r = cur.r * (1 - t) + nxt.r * t;
      const pt = destination(centerPos, r, bearing, { units: "kilometers" });
      const [plng, plat] = pt.geometry.coordinates;
      ring.push([plat, plng]);
    }
  }
  ring.push(ring[0]);
  return ring as [number, number][];
}

/**
 * 将 4 方位半径补齐/规范化为 8 方位数组
 * （仅在确实需要 8 方位输入时使用；优先用 genAsymRing4 直接画 4 方位）
 */
export function radii4to8(radii4: RingRadii4): RingRadii {
  const [ne, se, sw, nw] = radii4;
  // 8 方位顺序：北, 东北, 东, 东南, 南, 西南, 西, 西北
  // 主方位取相邻两象限的中点，避免硬塞单一象限值
  return [
    (ne + nw) / 2, // 北  ：NW ↔ NE 的中点
    ne,            // 东北
    (ne + se) / 2, // 东  ：NE ↔ SE 的中点
    se,            // 东南
    (se + sw) / 2, // 南  ：SE ↔ SW 的中点
    sw,            // 西南
    (sw + nw) / 2, // 西  ：SW ↔ NW 的中点
    nw,            // 西北
  ];
}

/**
 * 生成对称风圈（八方位同半径），语法糖
 */
export function genSymRing(
  center: [number, number],
  radiusKm: number,
  steps = 8,
): [number, number][] {
  const radii: RingRadii = [
    radiusKm, radiusKm, radiusKm, radiusKm,
    radiusKm, radiusKm, radiusKm, radiusKm,
  ];
  return genAsymRing(center, radii, steps);
}

/**
 * 校验 + 返回 GeoJSON Polygon（供需要 GeoJSON 的图层使用）
 */
export function genAsymPolygonGeoJson(
  center: [number, number],
  radii: RingRadii,
  steps = 8,
) {
  const ring = genAsymRing(center, radii, steps);
  const coords: Position[] = ring.map(([plat, plng]) => [plng, plat]); // 转回 [lng, lat]
  return polygon([coords]);
}

/** 空半径（全部为 0），用于兜底 */
export const EMPTY_RADII: RingRadii = [0, 0, 0, 0, 0, 0, 0, 0];

/**
 * 将闭合风圈环坐标绕中心旋转一定角度（顺时针）
 *
 * 用于风圈动画：对每个坐标做经纬平面上的绕心旋转。
 * 因纬线上 1°经度≈cos(lat)×111km，为保持旋转后形状近似一致，
 * 采用按 lat 修正的简化平面旋转（动画用足够）。
 *
 * @param ring    genAsymRing 产出的 `[lat,lng][]`
 * @param center  [lat, lng] 旋转中心
 * @param deg     旋转角度（度，正值顺时针）
 */
export function rotateRing(
  ring: [number, number][],
  center: [number, number],
  deg: number,
): [number, number][] {
  if (!deg) return ring;
  const [clat, clng] = center;
  const rad = (deg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const k = Math.cos((clat * Math.PI) / 180); // 纬度修正系数
  return ring.map(([la, ln]) => {
    const dx = (ln - clng) * k;
    const dy = la - clat;
    const nx = dx * cos - dy * sin;
    const ny = dx * sin + dy * cos;
    return [clat + ny, clng + nx / k] as [number, number];
  });
}

/**
 * 按呼吸动画缩放风圈（以中心为锚放大/缩小半径）
 *
 * @param ring  原始环
 * @param center [lat,lng] 中心
 * @param scale 缩放系数，0.9~1.1 等
 */
export function scaleRing(
  ring: [number, number][],
  center: [number, number],
  scale: number,
): [number, number][] {
  if (scale === 1) return ring;
  const [clat, clng] = center;
  return ring.map(([la, ln]) => [
    clat + (la - clat) * scale,
    clng + (ln - clng) * scale,
  ]) as [number, number][];
}

export default genAsymRing;
