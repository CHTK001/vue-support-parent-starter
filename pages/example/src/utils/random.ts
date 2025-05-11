/**
 * 随机工具函数
 */

/**
 * 生成随机颜色
 */
export function generateRandomColor(alpha = 1) {
  const r = Math.floor(Math.random() * 256);
  const g = Math.floor(Math.random() * 256);
  const b = Math.floor(Math.random() * 256);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * 生成随机ID
 */
export function generateRandomId() {
  return "id-" + Math.random().toString(36).substr(2, 9);
}
