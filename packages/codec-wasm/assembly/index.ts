// Codec WASM Module - 加密解密核心功能实现

// 常量定义
const ORIGIN_KEY_HEADER: string = 'access-control-origin-key'
const TIMESTAMP_HEADER: string = 'access-control-timestamp-user'
const OTK_ID_HEADER: string = 'access-control-otk-id'
const NONCE_HEADER: string = 'access-control-nonce'
const ENCRYPTED_PREFIX: string = '02'
const PREFIX_LENGTH: i32 = 8
const SUFFIX_LENGTH: i32 = 4
const SUCCESS_STATUS: i32 = 200
const DATA_FIELD: string = 'data'
const SETTING_PATH: string = '/v2/setting'
const DEFAULT_AES_KEY: string = '1234567890Oil#@1'

// 简化的SM4加密模拟
export function sm4Encrypt(data: string, key: string): string {
  // 这里只是一个示例实现，实际项目中应使用真正的SM4加密
  // 在WASM中实现真正的加密算法可以提供更好的性能和安全性
  return `ENCRYPTED_${data}_WITH_${key.substring(0, 8)}`
}

// 简化的SM2解密模拟
export function sm2Decrypt(encryptedData: string, key: string): string {
  // 这里只是一个示例实现，实际项目中应使用真正的SM2解密
  if (encryptedData.startsWith('ENCRYPTED_')) {
    const prefixEnd: i32 = encryptedData.indexOf('_WITH_')
    if (prefixEnd > 9) {
      const base64Data: string = encryptedData.substring(9, prefixEnd)
      // 模拟解密过程
      return base64Data
    }
  }
  return encryptedData
}

// AES解密模拟
export function aesDecrypt(value: string, key: string): string {
  // 这里只是一个示例实现，实际项目中应使用真正的AES解密
  return `${value}_DECRYPTED_WITH_${key.substring(0, 8)}`
}

// 生成随机nonce
export function generateNonce(): string {
  const chars: string = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result: string = ''
  for (let i: i32 = 0; i < 16; i++) {
    const index: f64 = Math.random() * <f64>chars.length
    result += chars.charAt(<i32>index)
  }
  return result
}

// 验证时间戳
export function validateTimestamp(timestamp: i64, tolerance: i64 = 300000): bool {
  const now: i64 = Date.now()
  const diff: i64 = now > timestamp ? now - timestamp : timestamp - now
  return diff <= tolerance
}

// 请求加密处理函数
export function processRequest(
  requestData: string,
  requestUrl: string,
  codecConfig: bool,
  codecKey: string
): string {
  // 检查是否需要跳过加密
  if (requestUrl.startsWith(SETTING_PATH)) {
    return requestData
  }

  if (!requestData || requestData.length == 0) {
    return requestData
  }

  if (!codecConfig || !codecKey || codecKey.length == 0) {
    return requestData
  }

  // 生成反重放攻击保护参数
  const timestamp: i64 = Date.now()
  const nonce: string = generateNonce()

  // 验证请求唯一性（简化实现）
  if (!validateTimestamp(timestamp, 300000)) {
    return "ERROR: Anti-replay validation failed"
  }

  const encryptedData: string = sm4Encrypt(requestData, codecKey)
  
  // 构造响应JSON
  const result = `{
    "data": "${encryptedData}",
    "headers": {
      "${ORIGIN_KEY_HEADER}": ${timestamp},
      "${TIMESTAMP_HEADER}": "${timestamp}",
      "${NONCE_HEADER}": "${nonce}"
    }
  }`
  
  return result
}

// 响应解密处理函数
export function processResponse(
  responseData: string,
  originKey: string,
  timestamp: string
): string {
  // 简单验证
  if (!responseData || responseData.length == 0) {
    return responseData
  }

  // 检查加密数据标识
  if (!responseData.startsWith(ENCRYPTED_PREFIX)) {
    return responseData
  }

  if (!originKey || originKey.length == 0) {
    return responseData
  }

  // 数据切片和解密
  const startIndex: i32 = PREFIX_LENGTH
  const endIndex: i32 = <i32>responseData.length - SUFFIX_LENGTH
  if (startIndex < endIndex) {
    const encryptedPart: string = responseData.substring(startIndex, endIndex)
    const decryptKey: string = aesDecrypt(originKey, timestamp)
    const decryptedData: string = sm2Decrypt(encryptedPart, decryptKey)
    return decryptedData
  }

  return responseData
}

// AES解密工具函数
export function decryptAES(value: string, key: string): string {
  if (!value || value.length == 0) {
    return value
  }
  return aesDecrypt(value, key)
}

// 特殊响应解密处理
export function processSpecialResponse(
  responseData: string,
  uuid: string,
  timestamp: string
): string {
  if (!responseData || responseData.length == 0) {
    return "{}"
  }

  if (!responseData.startsWith(ENCRYPTED_PREFIX)) {
    return responseData
  }

  if (!uuid || uuid.length == 0) {
    return responseData
  }

  const startIndex: i32 = PREFIX_LENGTH
  const endIndex: i32 = <i32>responseData.length - SUFFIX_LENGTH
  if (startIndex < endIndex) {
    const encryptedSegment: string = responseData.substring(startIndex, endIndex)
    const key: string = aesDecrypt(uuid, timestamp)
    const decrypted: string = sm2Decrypt(encryptedSegment, key)
    return decrypted
  }

  return "{}"
}

// 获取当前时间戳
export function getCurrentTimestamp(): i64 {
  return Date.now()
}

// 字符串比较函数
export function compareStrings(a: string, b: string): bool {
  if (a.length != b.length) {
    return false
  }
  for (let i: i32 = 0; i < <i32>a.length; i++) {
    if (a.charCodeAt(i) != b.charCodeAt(i)) {
      return false
    }
  }
  return true
}

// 导出一个示例函数
export function add(a: i32, b: i32): i32 {
  return a + b
}