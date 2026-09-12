/**
 * 通用工具函数
 */

/**
 * 解析当前 locale key，适配 en-US / zh-CN 等
 */
export function resolveLocaleKey(lang: string): string {
  if (!lang) return 'zh-CN';
  const lower = lang.toLowerCase();
  if (lower.startsWith('zh')) return 'zh-CN';
  if (lower.startsWith('en')) return 'en-US';
  return lang;
}
