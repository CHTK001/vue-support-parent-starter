/**
 * 本地静态资源解析（@repo/assets）
 *
 * 应用配置（app.yaml）里填写的图片地址可能是：
 *  - 本地资源路径（如 /assets/images/login/science.png）：需经 vite import 才能
 *    在 dev（/@fs/...）与 build（/assets/xxx-hash.png）下正确加载；
 *  - 外部 URL（https://...）或 data: URI：原样返回。
 *
 * 用法：
 *   const url = resolveAssetUrl("/assets/images/login/science.png");
 *   // dev   → /@fs/G:/work/.../science.png
 *   // build → /assets/login/science-abc123.png
 *   找不到对应本地资源时原样返回配置值（可按外部 URL 兜底）。
 */
const loginImages = import.meta.glob("./images/login/*", {
  eager: true,
  import: "default",
}) as Record<string, string>;

/** 取路径最后一段文件名（science.png） */
function basename(url: string): string {
  const clean = url.split(/[?#]/)[0] ?? "";
  const parts = clean.split("/");
  return parts[parts.length - 1] ?? "";
}

/**
 * 解析配置中的图片地址为可加载 URL。
 * @param url 配置值（本地资源路径 / 外部 URL / data: URI）
 */
export function resolveAssetUrl(url: string): string {
  if (!url) {
    return "";
  }
  // 外部 URL / data: URI 原样返回
  if (/^(https?:)?\/\//.test(url) || url.startsWith("data:")) {
    return url;
  }
  const name = basename(url);
  // 按文件名匹配本地资源（glob 相对路径以 ./images/login/xxx 结尾）
  for (const [key, value] of Object.entries(loginImages)) {
    if (key.endsWith(name)) {
      return value;
    }
  }
  return url;
}
