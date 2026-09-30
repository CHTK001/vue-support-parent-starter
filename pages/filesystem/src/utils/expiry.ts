/**
 * 链接有效期解析
 *
 * <p>解析规则必须与后端 {@code parseOneTimeExpiry} 一致：同一个字符串
 * 「30s」在前端和后端必须算出同一个秒数，否则会出现「前端显示 30 秒、
 * 后端签发 30 分钟」这类前后端各说各话的问题。</p>
 */

/** 单次链接最长有效期（秒），与后端 {@code oneTimeTtlMs} 上限一致：30 天 */
const MAX_EXPIRY_SECONDS = 30 * 86400;

/** 单位到秒的倍率表 */
const UNIT_SECONDS: Record<string, number> = {
  s: 1,
  m: 60,
  h: 3600,
  d: 86400,
};

/**
 * 把用户输入的过期时长解析成秒
 *
 * <p>支持纯数字（按秒）以及 s/m/h/d 后缀，允许小数（{@code 0.5h} = 30 分钟）。
 * 空值、非数字、≤0、超过 30 天一律返回 0——上层用 0 表示「不合法」，
 * 宁可拦在前端也不打后端。</p>
 *
 * @param text 原始输入，允许前后空白与大小写混写
 * @returns 秒数；非法或超范围返回 0
 */
export function parseExpiryToSeconds(text: string): number {
  const v = text.trim().toLowerCase();
  if (!v) {
    return 0;
  }
  // 刻意不接受负号与指数写法：-5m / 1e3 都会被这条正则直接拒掉
  const m = /^(\d+(?:\.\d+)?)\s*(s|m|h|d)?$/.exec(v);
  if (!m) {
    return 0;
  }
  const n = Number(m[1]);
  if (!Number.isFinite(n) || n <= 0) {
    return 0;
  }
  const factor = UNIT_SECONDS[m[2] ?? ""] ?? 1;
  const seconds = Math.floor(n * factor);
  // 下限 1 秒：0.4s 这类输入 Math.floor 后会变 0，必须提前拒
  return seconds > 0 && seconds <= MAX_EXPIRY_SECONDS ? seconds : 0;
}

/**
 * 把秒数格式化成人类可读文案
 *
 * @param seconds 秒数
 * @returns 中文时长文案；非法输入返回空串
 */
export function formatExpiry(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return "";
  }
  if (seconds % 86400 === 0) {
    return `${seconds / 86400} 天`;
  }
  if (seconds % 3600 === 0) {
    return `${seconds / 3600} 小时`;
  }
  if (seconds % 60 === 0) {
    return `${seconds / 60} 分钟`;
  }
  return `${seconds} 秒`;
}
