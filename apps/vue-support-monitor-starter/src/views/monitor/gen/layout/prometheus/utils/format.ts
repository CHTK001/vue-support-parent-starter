/**
 * 格式化工具函数
 * 用于格式化监控数据的显示
 */

/**
 * 格式化字节
 * @param bytes 字节数
 * @param targetUnit 目标单位 (可选，如 'KB', 'MB', 'GB' 等)
 * @returns 格式化后的数值
 */
export const formatBytes = (bytes: number, targetUnit?: string): number => {
  if (bytes === 0) return 0;

  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB", "PB"];

  // 如果指定了目标单位，则转换到该单位
  if (targetUnit && sizes.includes(targetUnit)) {
    const targetIndex = sizes.indexOf(targetUnit);
    return parseFloat((bytes / Math.pow(k, targetIndex)).toFixed(4));
  }

  // 否则自动选择合适的单位
  const i = Math.floor(Math.log(Math.abs(bytes)) / Math.log(k));
  const index = Math.min(i, sizes.length - 1);

  return parseFloat((bytes / Math.pow(k, index)).toFixed(4));
};

/**
 * 获取字节单位
 * @param bytes 字节数
 * @param targetUnit 目标单位 (可选，如 'KB', 'MB', 'GB' 等)
 * @returns 对应的单位
 */
export const getBytesUnit = (bytes: number, targetUnit?: string): string => {
  if (bytes === 0) return "B";

  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB", "PB"];

  // 如果指定了目标单位，则返回该单位
  if (targetUnit && sizes.includes(targetUnit)) {
    return targetUnit;
  }

  // 否则自动选择合适的单位
  const i = Math.floor(Math.log(Math.abs(bytes)) / Math.log(k));
  return sizes[Math.min(i, sizes.length - 1)];
};

/**
 * 格式化数字
 * @param num 数字
 * @param targetUnit 目标单位 (可选，如 'K', 'M', 'B' 等)
 * @returns 格式化后的数值
 */
export const formatNumber = (num: number, targetUnit?: string): string => {
  if (targetUnit) {
    switch (targetUnit) {
      case "K":
        return (num / 1000).toFixed(4);
      case "M":
        return (num / 1000000).toFixed(4);
      case "B":
        return (num / 1000000000).toFixed(4);
      default:
        return num.toFixed(4);
    }
  }

  // 自动选择合适的单位
  if (num >= 1000000000) {
    return (num / 1000000000).toFixed(4);
  } else if (num >= 1000000) {
    return (num / 1000000).toFixed(4);
  } else if (num >= 1000) {
    return (num / 1000).toFixed(4);
  }
  return num.toFixed(4);
};

/**
 * 获取数字单位
 * @param num 数字
 * @param targetUnit 目标单位 (可选，如 'K', 'M', 'B' 等)
 * @returns 对应的单位
 */
export const getNumberUnit = (num: number, targetUnit?: string): string => {
  if (targetUnit) {
    return targetUnit;
  }

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
 * @param targetUnit 目标单位 (可选，如 '秒', '分', '时', '天' 等)
 * @returns 格式化后的数值
 */
export const formatTime = (seconds: number, targetUnit?: string): string => {
  if (targetUnit) {
    switch (targetUnit) {
      case "秒":
        return seconds.toFixed(4);
      case "分":
        return (seconds / 60).toFixed(4);
      case "时":
        return (seconds / 3600).toFixed(4);
      case "天":
        return (seconds / 86400).toFixed(4);
      default:
        return seconds.toFixed(4);
    }
  }

  // 自动选择合适的单位
  if (seconds < 60) {
    return seconds.toFixed(4);
  } else if (seconds < 3600) {
    return (seconds / 60).toFixed(4);
  } else if (seconds < 86400) {
    return (seconds / 3600).toFixed(4);
  }
  return (seconds / 86400).toFixed(4);
};

/**
 * 获取时间单位
 * @param seconds 秒数
 * @param targetUnit 目标单位 (可选，如 '秒', '分', '时', '天' 等)
 * @returns 对应的单位
 */
export const getTimeUnit = (seconds: number, targetUnit?: string): string => {
  if (targetUnit) {
    return targetUnit;
  }

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
 * 格式化在线/离线状态
 * @param value 值 (通常为0或1)
 * @returns 格式化后的状态字符串
 */
export const formatStatus = (value: number): string => {
  return value === 1 ? "在线" : "离线";
};

/**
 * 获取在线/离线状态的单位
 * @returns 空字符串，因为状态本身已经是文本
 */
export const getStatusUnit = (): string => {
  return "";
};

/**
 * 格式化显示值
 * @param value 值
 * @param valueUnit 值的单位类型 ('bytes', 'percent', 'number', 'time', 'status')
 * @param configUnit 配置的目标单位 (可选)
 * @returns 格式化后的值
 */
export const formatValue = (value: number, valueUnit: string, configUnit?: string): string | number => {
  // 根据不同的单位进行格式化
  if (valueUnit === "percent") {
    return value.toFixed(4);
  } else if (valueUnit === "bytes") {
    return formatBytes(value, configUnit);
  } else if (valueUnit === "number") {
    return formatNumber(value, configUnit);
  } else if (valueUnit === "time") {
    return formatTime(value, configUnit);
  } else if (valueUnit === "status") {
    return formatStatus(value);
  }

  // 默认格式化
  // 如果值大于1000，使用K作为单位
  if (value >= 1000 && !configUnit) {
    return (value / 1000).toFixed(4);
  }

  // 如果是整数，不显示小数点
  if (Number.isInteger(value)) {
    return value.toString();
  }

  // 如果是Number类型，则格式化
  //@ts-ignore
  if (value instanceof Number) {
    return value.toFixed(4);
  }

  return value;
};

/**
 * 获取值的单位
 * @param value 值
 * @param valueUnit 值的单位类型 ('bytes', 'percent', 'number', 'time', 'status')
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
    return getBytesUnit(value, config?.targetUnit);
  } else if (valueUnit === "number") {
    return getNumberUnit(value, config?.targetUnit);
  } else if (valueUnit === "time") {
    return getTimeUnit(value, config?.targetUnit);
  } else if (valueUnit === "status") {
    return getStatusUnit();
  }

  // 如果值大于1000，使用K作为单位
  if (value >= 1000) {
    return "K";
  }

  return "";
};
