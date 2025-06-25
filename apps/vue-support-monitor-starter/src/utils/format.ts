/**
 * 格式化工具函数
 */

/**
 * 格式化文件大小
 * @param bytes 字节数
 * @param decimals 小数位数
 * @returns 格式化后的文件大小
 */
export function formatFileSize(bytes: number, decimals = 2): string {
  if (bytes === 0) return "0 B";
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["B", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

/**
 * 格式化网络速度
 * @param bytesPerSecond 每秒字节数
 * @param decimals 小数位数
 * @returns 格式化后的网络速度
 */
export function formatNetworkSpeed(bytesPerSecond: number, decimals = 1): string {
  return formatFileSize(bytesPerSecond, decimals) + "/s";
}

/**
 * 格式化百分比
 * @param value 数值
 * @param decimals 小数位数
 * @returns 格式化后的百分比
 */
export function formatPercentage(value: number, decimals = 1): string {
  return value.toFixed(decimals) + "%";
}

/**
 * 格式化数字
 * @param value 数值
 * @param options 格式化选项
 * @returns 格式化后的数字
 */
export function formatNumber(
  value: number,
  options: {
    decimals?: number;
    separator?: string;
    suffix?: string;
    prefix?: string;
  } = {}
): string {
  const { decimals = 0, separator = ",", suffix = "", prefix = "" } = options;
  
  const parts = value.toFixed(decimals).split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, separator);
  
  return prefix + parts.join(".") + suffix;
}

/**
 * 格式化时间戳
 * @param timestamp 时间戳（毫秒）
 * @param format 格式字符串
 * @returns 格式化后的时间
 */
export function formatTimestamp(
  timestamp: number | string,
  format = "YYYY-MM-DD HH:mm:ss"
): string {
  const date = new Date(timestamp);
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  const milliseconds = String(date.getMilliseconds()).padStart(3, "0");
  
  return format
    .replace("YYYY", year.toString())
    .replace("MM", month)
    .replace("DD", day)
    .replace("HH", hours)
    .replace("mm", minutes)
    .replace("ss", seconds)
    .replace("SSS", milliseconds);
}

/**
 * 格式化相对时间
 * @param timestamp 时间戳
 * @returns 相对时间字符串
 */
export function formatRelativeTime(timestamp: number | string): string {
  const now = Date.now();
  const time = new Date(timestamp).getTime();
  const diff = now - time;
  
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  const week = 7 * day;
  const month = 30 * day;
  const year = 365 * day;
  
  if (diff < minute) {
    return "刚刚";
  } else if (diff < hour) {
    return Math.floor(diff / minute) + "分钟前";
  } else if (diff < day) {
    return Math.floor(diff / hour) + "小时前";
  } else if (diff < week) {
    return Math.floor(diff / day) + "天前";
  } else if (diff < month) {
    return Math.floor(diff / week) + "周前";
  } else if (diff < year) {
    return Math.floor(diff / month) + "个月前";
  } else {
    return Math.floor(diff / year) + "年前";
  }
}

/**
 * 格式化持续时间
 * @param seconds 秒数
 * @param showSeconds 是否显示秒数
 * @returns 格式化后的持续时间
 */
export function formatDuration(seconds: number, showSeconds = true): string {
  if (seconds < 0) return "0秒";
  
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  const parts: string[] = [];
  
  if (days > 0) parts.push(`${days}天`);
  if (hours > 0) parts.push(`${hours}小时`);
  if (minutes > 0) parts.push(`${minutes}分钟`);
  if (showSeconds && (secs > 0 || parts.length === 0)) parts.push(`${secs}秒`);
  
  return parts.join("");
}

/**
 * 格式化IP地址
 * @param ip IP地址
 * @returns 格式化后的IP地址
 */
export function formatIPAddress(ip: string): string {
  if (!ip) return "-";
  
  // IPv4地址验证
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (ipv4Regex.test(ip)) {
    return ip;
  }
  
  // IPv6地址简化显示
  if (ip.includes(":")) {
    return ip.length > 20 ? ip.substring(0, 20) + "..." : ip;
  }
  
  return ip;
}

/**
 * 格式化端口号
 * @param port 端口号
 * @returns 格式化后的端口号
 */
export function formatPort(port: number | string): string {
  const portNum = Number(port);
  if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
    return "-";
  }
  return portNum.toString();
}

/**
 * 格式化状态文本
 * @param status 状态值
 * @param statusMap 状态映射
 * @returns 状态文本
 */
export function formatStatus(
  status: number | string,
  statusMap: Record<string | number, { text: string; color?: string }>
): string {
  const statusInfo = statusMap[status];
  return statusInfo?.text || "未知";
}

/**
 * 格式化温度
 * @param temperature 温度值
 * @param unit 温度单位
 * @returns 格式化后的温度
 */
export function formatTemperature(
  temperature: number,
  unit: "C" | "F" = "C"
): string {
  if (isNaN(temperature)) return "-";
  
  const temp = unit === "F" ? (temperature * 9) / 5 + 32 : temperature;
  return `${temp.toFixed(1)}°${unit}`;
}

/**
 * 格式化CPU负载
 * @param load 负载值
 * @returns 格式化后的负载
 */
export function formatCPULoad(load: number | string): string {
  const loadNum = Number(load);
  if (isNaN(loadNum)) return "-";
  
  return loadNum.toFixed(2);
}

/**
 * 格式化内存大小
 * @param bytes 字节数
 * @param showUnit 是否显示单位
 * @returns 格式化后的内存大小
 */
export function formatMemorySize(bytes: number, showUnit = true): string {
  if (bytes === 0) return showUnit ? "0 B" : "0";
  
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  const value = parseFloat((bytes / Math.pow(k, i)).toFixed(2));
  return showUnit ? `${value} ${sizes[i]}` : value.toString();
}

/**
 * 格式化错误信息
 * @param error 错误对象或字符串
 * @returns 格式化后的错误信息
 */
export function formatError(error: any): string {
  if (typeof error === "string") {
    return error;
  }
  
  if (error?.message) {
    return error.message;
  }
  
  if (error?.msg) {
    return error.msg;
  }
  
  return "未知错误";
}

/**
 * 截断文本
 * @param text 文本
 * @param maxLength 最大长度
 * @param suffix 后缀
 * @returns 截断后的文本
 */
export function truncateText(
  text: string,
  maxLength: number,
  suffix = "..."
): string {
  if (!text || text.length <= maxLength) {
    return text || "";
  }
  
  return text.substring(0, maxLength - suffix.length) + suffix;
}

/**
 * 高亮关键词
 * @param text 文本
 * @param keyword 关键词
 * @param className CSS类名
 * @returns 高亮后的HTML
 */
export function highlightKeyword(
  text: string,
  keyword: string,
  className = "highlight"
): string {
  if (!text || !keyword) {
    return text || "";
  }
  
  const regex = new RegExp(`(${keyword})`, "gi");
  return text.replace(regex, `<span class="${className}">$1</span>`);
}

/**
 * 生成随机颜色
 * @param opacity 透明度
 * @returns 颜色值
 */
export function generateRandomColor(opacity = 1): string {
  const r = Math.floor(Math.random() * 256);
  const g = Math.floor(Math.random() * 256);
  const b = Math.floor(Math.random() * 256);
  
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

/**
 * 获取对比色
 * @param backgroundColor 背景色
 * @returns 对比色
 */
export function getContrastColor(backgroundColor: string): string {
  // 简单的对比色计算
  const hex = backgroundColor.replace("#", "");
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 128 ? "#000000" : "#ffffff";
}
