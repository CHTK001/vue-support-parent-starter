/**
 * 裁剪坐标换算
 *
 * <p>把鼠标的视口坐标换算成原图像素坐标。核心难点是旋转：显示坐标系相对
 * 原图转置，鼠标点「显示图的左上角」在旋转 90° 后对应的是原图的右上角，
 * 不做这一步换算，裁剪框就会整体错位。</p>
 *
 * <p>抽成独立纯函数是为了能单测——这段逻辑原先内嵌在组件里、依赖 ref，
 * 只能靠 E2E 间接覆盖，而 E2E 恰恰因为读缓存而误判过一次。</p>
 */

/** 二维点 */
export interface Point {
  x: number;
  y: number;
}

/** 尺寸（宽高） */
export interface Size {
  w: number;
  h: number;
}

/** 支持的旋转角 */
export type Rotation = 0 | 90 | 180 | 270;

/**
 * 显示坐标 → 原图坐标
 *
 * <p>旋转 90°：显示系的 (x, y) 对应原图的 (h - y, x)；
 * 180°：对应 (w - x, h - y)；
 * 270°：对应 (y, w - x)。</p>
 *
 * @param relX   相对 stage 左边缘的距离（视口像素）
 * @param relY   相对 stage 上边缘的距离（视口像素）
 * @param scale  当前显示缩放倍数
 * @param disp   图片的显示尺寸（**原图像素**量纲，未乘 scale；旋转 90/270 时已转置）
 * @param nat    原图像素尺寸
 * @param rot    当前旋转角
 * @returns 换算到原图坐标系、并夹取到 {@code [0, nat.w] × [0, nat.h]} 的坐标
 */
export function displayToImage(
  relX: number,
  relY: number,
  scale: number,
  disp: Size,
  nat: Size,
  rot: Rotation
): Point {
  // scale 非法（0 或 NaN）会让整条链产出 NaN，直接按 1 处理
  const s = Number.isFinite(scale) && scale > 0 ? scale : 1;
  // 先把屏幕距离折回「原图像素」量纲：ux/uy 与 nat 同单位
  const ux = relX / s;
  const uy = relY / s;
  // disp 是原图像素且已按旋转转置（90/270 时宽高互换）。
  //
  // 方向必须按 CSS 的真实矩阵推，不能靠「四个角不重复」糊弄过去
  // （90 与 270 写反恰好也是双射，但整体差 180°，裁剪框会镜像）。
  // CSS transform: rotate(θ) 用矩阵 [cosθ, -sinθ; sinθ, cosθ]，y 轴向下，
  // 故 θ=90 为顺时针。以原图 600×400、中心 (300,200) 代入：
  //   X = 400 - iy, Y = ix          （原图 → stage 的归一化映射）
  //   逆映射： ix = Y, iy = 400 - X = disp.w - X
  // θ=270 同理得：ix = disp.h - Y, iy = X
  let x: number;
  let y: number;
  if (rot === 90) {
    // 顺时针 90：stage 左上对应原图左下
    x = uy;
    y = disp.w - ux;
  } else if (rot === 180) {
    x = disp.w - ux;
    y = disp.h - uy;
  } else if (rot === 270) {
    // 顺时针 270（= 逆时针 90）：stage 左上对应原图右上
    x = disp.h - uy;
    y = ux;
  } else {
    x = ux;
    y = uy;
  }
  return {
    x: clamp(x, 0, nat.w),
    y: clamp(y, 0, nat.h),
  };
}

/**
 * 把坐标夹取到区间内
 *
 * @param v 值
 * @param lo 下界
 * @param hi 上界
 * @returns 夹取后的值；上界小于下界时返回下界
 */
export function clamp(v: number, lo: number, hi: number): number {
  if (!Number.isFinite(v)) {
    return lo;
  }
  if (hi < lo) {
    return lo;
  }
  return Math.max(lo, Math.min(hi, v));
}

/**
 * 由两个对角点算出裁剪矩形
 *
 * <p>用户可以从任意方向起拖，所以宽高要取绝对值。退化（宽或高不足 1 像素）
 * 返回 null，由调用方决定是忽略还是当整图处理。</p>
 *
 * @param a 起点
 * @param b 终点
 * @returns 归一化矩形；退化返回 null
 */
export function rectFromPoints(a: Point, b: Point): { x: number; y: number; w: number; h: number } | null {
  const x = Math.min(a.x, b.x);
  const y = Math.min(a.y, b.y);
  const w = Math.abs(b.x - a.x);
  const h = Math.abs(b.y - a.y);
  if (w < 1 || h < 1) {
    return null;
  }
  return { x, y, w, h };
}
