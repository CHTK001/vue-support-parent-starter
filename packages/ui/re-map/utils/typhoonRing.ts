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

/** 8 方位名（顺序同 RingRadii） */
export const RING_DIRECTIONS = [
  "北", "东北", "东", "东南",
  "南", "西南", "西", "西北",
] as const;

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
