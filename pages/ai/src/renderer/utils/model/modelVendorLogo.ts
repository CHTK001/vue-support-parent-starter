/**
 * 模型厂商 Logo 解析（历史接口，保留兼容）
 *
 * 旧实现按模型名前缀返回外链 Logo URL（指向不存在的 CDN 占位地址，实际渲染会 404）。
 * 现改用本地内置图标体系：
 *   - 首选 {@link ModelLogo}（pages/ai/renderer/components/common/ModelLogo.tsx）；
 *   - 本文件保留 resolveModelVendorLogo 以维持旧调用方的 API 兼容（返回 null，调用方自行回退）。
 */

/**
 * 解析模型厂商 Logo URL。
 * @deprecated 外链 Logo 已停用（占位 CDN 404），请改用 ModelLogo / ProviderIcon 内置图标。
 * @returns 始终返回 null（保持签名兼容）
 */
export function resolveModelVendorLogo(_model?: string | null, _size?: number | undefined): string | null {
  return null;
}
