/**
 * ScInput数据校验工具类
 */

/**
 * 验证邮箱格式
 * @param value 邮箱值
 * @returns {boolean} 是否通过验证
 */
export const validateEmail = (value: string): boolean => {
  const reg = /^[a-zA-Z0-9_-]+@[a-zA-Z0-9_-]+(\.[a-zA-Z0-9_-]+)+$/;
  return reg.test(value);
};

/**
 * 验证电话号码格式
 * @param value 电话号码值
 * @returns {boolean} 是否通过验证
 */
export const validatePhone = (value: string): boolean => {
  const reg = /^1[3-9]\d{9}$/; // 简单的中国大陆手机号验证
  return reg.test(value);
};

/**
 * 验证URL格式
 * @param value URL值
 * @returns {boolean} 是否通过验证
 */
export const validateUrl = (value: string): boolean => {
  try {
    new URL(value);
    return true;
  } catch (err) {
    return false;
  }
};

/**
 * 验证IP地址格式
 * @param value IP地址值
 * @returns {boolean} 是否通过验证
 */
export const validateIp = (value: string): boolean => {
  const ipv4Regex = /^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  return ipv4Regex.test(value);
};

/**
 * 验证数字格式
 * @param value 数字值
 * @param options 验证选项
 * @returns {boolean} 是否通过验证
 */
export const validateNumber = (
  value: string | number,
  options?: {
    min?: number;
    max?: number;
    integer?: boolean;
  }
): boolean => {
  const num = Number(value);
  
  if (isNaN(num)) {
    return false;
  }
  
  if (options?.integer && !Number.isInteger(num)) {
    return false;
  }
  
  if (options?.min !== undefined && num < options.min) {
    return false;
  }
  
  if (options?.max !== undefined && num > options.max) {
    return false;
  }
  
  return true;
};

/**
 * 根据类型验证数据
 * @param value 要验证的值
 * @param type 输入类型
 * @returns {boolean} 是否通过验证
 */
export const validateByType = (value: string | number, type: string): boolean => {
  if (value === undefined || value === null || value === '') {
    return true; // 空值默认通过验证，由必填项单独控制
  }
  
  const valueStr = String(value);
  
  switch (type) {
    case 'email':
      return validateEmail(valueStr);
    case 'tel':
      return validatePhone(valueStr);
    case 'url':
      return validateUrl(valueStr);
    case 'number':
      return validateNumber(valueStr);
    case 'ip':
      return validateIp(valueStr);
    default:
      return true;
  }
};

/**
 * 通用验证函数
 * @param value 要验证的值
 * @param rules 验证规则
 * @returns {{ valid: boolean, message: string }} 验证结果和错误信息
 */
export const validate = (
  value: any,
  rules: {
    required?: boolean;
    type?: string;
    message?: string;
    validator?: (value: any) => boolean | { valid: boolean; message: string };
    min?: number;
    max?: number;
    pattern?: RegExp;
  }
): { valid: boolean; message: string } => {
  // 必填项验证
  if (rules.required && (value === undefined || value === null || value === '')) {
    return { valid: false, message: rules.message || '该字段为必填项' };
  }
  
  // 为空且非必填，则验证通过
  if (value === undefined || value === null || value === '') {
    return { valid: true, message: '' };
  }
  
  // 类型验证
  if (rules.type && !validateByType(value, rules.type)) {
    return { valid: false, message: rules.message || `请输入有效的${rules.type}格式` };
  }
  
  // 正则验证
  if (rules.pattern && !rules.pattern.test(String(value))) {
    return { valid: false, message: rules.message || '输入格式不正确' };
  }
  
  // 自定义验证函数
  if (rules.validator) {
    const result = rules.validator(value);
    if (typeof result === 'boolean') {
      return { valid: result, message: result ? '' : (rules.message || '验证失败') };
    } else {
      return result;
    }
  }
  
  return { valid: true, message: '' };
}; 