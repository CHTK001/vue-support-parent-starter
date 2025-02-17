import { computed } from "vue";

/**
 * 将字符串的首字母大写
 * @param string
 */
function capitalizeFirstLetter(string: string): string {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

/**
 * 将字符串的首字母转换为小写。
 *
 * @param str 要转换的字符串
 * @returns 首字母小写的字符串
 */
function toLowerCaseFirstLetter(str: string): string {
  if (!str) return str; // 如果字符串为空，直接返回
  return str.charAt(0).toLowerCase() + str.slice(1);
}

/**
 *  生成驼峰命名法的键名
 * @param key
 * @param parentKey
 */
function toCamelCase(key: string, parentKey: string): string {
  if (!parentKey) {
    return key;
  }
  return parentKey + key.charAt(0).toUpperCase() + key.slice(1);
}

function kebabToCamelCase(str: string): string {
  return str
    .split("-")
    .filter(Boolean)
    .map((word, index) => (index === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1)))
    .join("");
}

/**
 * 创建一个计算属性，并返回默认值/原始数据。
 *
 * @param value - 属性
 * @param defaultValue -默认值
 * @returns 默认值/原始数据
 */
export const isValidOrDefault = <T>(value: T, defaultValue: T): T => {
  if (value === undefined || value === null) {
    return defaultValue;
  }
  return value;
};
/**
 * 创建一个计算属性，并缓存计算结果。
 *
 * @param params - 计算属性的参数对象。
 * @param callback - 计算属性的回调函数，接收参数对象并返回计算结果。
 * @returns 计算属性的计算结果。
 */
export const withComputed = <T extends Record<string, unknown>, R>(params: T, callback: (params: T) => R) => {
  const _cache = new Map<string, any>();

  const _getKey = (params: T) => {
    // 对键进行排序以保证参数顺序不影响缓存键
    const keys = Object.keys(params).sort();
    const entries = keys.map((key) => ({
      key,
      value: params[key],
    }));
    return JSON.stringify(entries);
  };

  const key = _getKey(params);

  if (_cache.has(key)) {
    return _cache.get(key)!;
  }

  const computedValue = computed(() => callback(params));
  _cache.set(key, computedValue);
  return computedValue;
};
/**
 * 将字符串分割为数字数组
 * @param str
 * @param separator
 */
function stringSplitToNumber(str: any, separator: string = ","): number[] {
  if (!str) {
    return [];
  }

  if (str instanceof Array) {
    return str;
  }
  return str.split(separator).map(Number);
}

/**
 * 将字符串分割为字符串数组
 * @param str
 * @param separator
 */
function stringSplitToArray(str: any, separator: string = ","): number[] {
  if (!str) {
    return [];
  }

  if (str instanceof Array) {
    return str;
  }
  return str.split(separator);
}
export { capitalizeFirstLetter, kebabToCamelCase, toCamelCase, toLowerCaseFirstLetter, stringSplitToNumber, stringSplitToArray };
