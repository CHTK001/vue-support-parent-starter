/**
 * 数据脱敏工具
 */

/**
 * 对敏感字符串（如 API Key、Token）进行脱敏显示
 *
 * @param key - 原始字符串
 * @param prefixLen - 头部保留字符数，默认 4
 * @param suffixLen - 尾部保留字符数，默认 4
 * @returns 脱敏后的字符串
 *
 * @example
 * maskKey('sk-1234567890abcdef') // 'sk-1••••••••cdef'
 */
export function maskKey(key: string | undefined | null, prefixLen = 4, suffixLen = 4): string {
  if (!key) return '';
  if (key.length <= prefixLen + suffixLen) return '••••••••';
  return key.substring(0, prefixLen) + '••••••••' + key.substring(key.length - suffixLen);
}

/**
 * 简单手机号脱敏：138****1234
 */
export function maskPhone(phone: string): string {
  if (!phone || phone.length < 7) return phone;
  return phone.substring(0, 3) + '****' + phone.substring(phone.length - 4);
}

/**
 * 邮箱脱敏：a***@example.com
 */
export function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return email;
  const [name, domain] = email.split('@');
  if (name.length <= 1) return email;
  return name.charAt(0) + '***@' + domain;
}