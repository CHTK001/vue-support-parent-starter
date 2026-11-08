/**
 * 预览资源基路径（file-viewer 运行期 chunk / worker / wasm 的同源根）。
 *
 * <p><b>为什么需要它</b>：file-viewer 的 {@code setDefaultFullAssetBaseUrl} /
 * {@code setDefaultFileViewerAssetBaseUrl} 决定运行期按需 chunk 与 design worker
 * 的 URL 前缀。页面挂在根路径时前缀是 {@code /}；但统一预览壳（后端
 * {@code /ot/{token}}）在内嵌形态下挂在文件服务前缀（默认 {@code /fs}）之下，
 * 壳里的 {@code /assets/*.js}、{@code /vendor/*} 若按根路径解析就会绕过文件存储
 * 过滤器（开发态还会被 Vite 自己接管）→ 404 / 渲染器崩掉。</p>
 *
 * <p>后端在入口壳里注入 {@code window.__FILE_PREVIEW_BOOT__.assetBase}（如
 * {@code /fs/}）；非壳场景（管理页弹窗预览）没有该值，回落到同源根 {@code /}，
 * 行为与旧实现一致。</p>
 *
 * @returns 以 {@code /} 结尾的资源前缀，如 {@code /} 或 {@code /fs/}
 */
export function previewAssetBase(): string {
  const boot = (window as { __FILE_PREVIEW_BOOT__?: { assetBase?: unknown } }).__FILE_PREVIEW_BOOT__;
  const raw = typeof boot?.assetBase === "string" ? boot.assetBase.trim() : "";
  if (!raw) {
    return "/";
  }
  const withSlash = raw.startsWith("/") ? raw : `/${raw}`;
  return withSlash.endsWith("/") ? withSlash : `${withSlash}/`;
}

/**
 * 预览资源的绝对前缀（去掉结尾斜杠），用于拼接 {@code /vendor/design/} 这类路径。
 *
 * @returns 如 {@code ""}（根路径）或 {@code "/fs"}
 */
export function previewAssetRoot(): string {
  const base = previewAssetBase();
  return base === "/" ? "" : base.replace(/\/+$/, "");
}
