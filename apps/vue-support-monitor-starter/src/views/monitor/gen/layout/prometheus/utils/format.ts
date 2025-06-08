/**
 * 格式化工具函数
 * 用于格式化监控数据的显示
 */

/**
 * 格式化字节
 * @param bytes 字节数
 * @returns 格式化后的数值
 */
export const formatBytes = (bytes: number): number => {
  if (bytes === 0) return 0;

  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB", "PB"];
  const i = Math.floor(Math.log(Math.abs(bytes)) / Math.log(k));

  // 确保i不超出sizes数组的范围
  const index = Math.min(i, sizes.length - 1);

  return parseFloat((bytes / Math.pow(k, index)).toFixed(2));
};

/**
 * 获取字节单位
 * @param bytes 字节数
 * @returns 对应的单位
 */
export const getBytesUnit = (bytes: number): string => {
  if (bytes === 0) return "B";

  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB", "PB"];
  const i = Math.floor(Math.log(Math.abs(bytes)) / Math.log(k));

  // 确保i不超出sizes数组的范围
  return sizes[Math.min(i, sizes.length - 1)];
};

/**
 * 格式化数字
 * @param num 数字
 * @returns 格式化后的数值
 */
export const formatNumber = (num: number): string => {
  if (num >= 1000000000) {
    return (num / 1000000000).toFixed(2);
  } else if (num >= 1000000) {
    return (num / 1000000).toFixed(2);
  } else if (num >= 1000) {
    return (num / 1000).toFixed(2);
  }
  return num.toFixed(2);
};

/**
 * 获取数字单位
 * @param num 数字
 * @returns 对应的单位
 */
export const getNumberUnit = (num: number): string => {
  if (num >= 1000000000) {
    return "B";
  } else if (num >= 1000000) {
    return "M";
  } else if (num >= 1000) {
    return "K";
  }
  return "";
};

/**
 * 格式化时间（秒）
 * @param seconds 秒数
 * @returns 格式化后的数值
 */
export const formatTime = (seconds: number): string => {
  if (seconds < 60) {
    return seconds.toFixed(2);
  } else if (seconds < 3600) {
    return (seconds / 60).toFixed(2);
  } else if (seconds < 86400) {
    return (seconds / 3600).toFixed(2);
  }
  return (seconds / 86400).toFixed(2);
};

/**
 * 获取时间单位
 * @param seconds 秒数
 * @returns 对应的单位
 */
export const getTimeUnit = (seconds: number): string => {
  if (seconds < 60) {
    return "秒";
  } else if (seconds < 3600) {
    return "分";
  } else if (seconds < 86400) {
    return "时";
  }
  return "天";
};

/**
 * 格式化显示值
 * @param value 值
 * @param valueUnit 值的单位类型
 * @returns 格式化后的值
 */
export const formatValue = (value: number, valueUnit: string): string | number => {
  // 根据不同的单位进行格式化
  if (valueUnit === "percent") {
    return value.toFixed(2);
  } else if (valueUnit === "bytes") {
    return formatBytes(value);
  } else if (valueUnit === "number") {
    return formatNumber(value);
  } else if (valueUnit === "time") {
    return formatTime(value);
  }

  // 默认格式化
  // 如果值大于1000，使用K作为单位
  if (value >= 1000) {
    return (value / 1000).toFixed(2);
  }

  // 如果是整数，不显示小数点
  if (Number.isInteger(value)) {
    return value.toString();
  }

  return value.toFixed(2);
};

/**
 * 获取值的单位
 * @param value 值
 * @param valueUnit 值的单位类型
 * @param config 图表配置
 * @returns 对应的单位
 */
export const getValueUnit = (value: number, valueUnit: string, config?: any): string => {
  // 如果有配置的单位，优先使用
  if (config?.unit) {
    return config.unit;
  }

  // 根据不同的单位返回对应的显示
  if (valueUnit === "percent") {
    return "%";
  } else if (valueUnit === "bytes") {
    return getBytesUnit(value);
  } else if (valueUnit === "number") {
    return getNumberUnit(value);
  } else if (valueUnit === "time") {
    return getTimeUnit(value);
  }

  // 如果值大于1000，使用K作为单位
  if (value >= 1000) {
    return "K";
  }

  return "";
};
