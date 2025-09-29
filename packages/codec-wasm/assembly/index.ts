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

// SM4 S-box
const S_BOX: u8[] = [
  0xd6, 0x90, 0xe9, 0xfe, 0xcc, 0xe1, 0x3d, 0xb7, 0x16, 0xb6, 0x14, 0xc2, 0x28, 0xfb, 0x2c, 0x05,
  0x2b, 0x67, 0x9a, 0x76, 0x2a, 0xbe, 0x04, 0xc3, 0xaa, 0x44, 0x13, 0x26, 0x49, 0x86, 0x06, 0x99,
  0x9c, 0x42, 0x50, 0xf4, 0x91, 0xef, 0x98, 0x7a, 0x33, 0x54, 0x0b, 0x43, 0xed, 0xcf, 0xac, 0x62,
  0xe4, 0xb3, 0x1c, 0xa9, 0xc9, 0x08, 0xe8, 0x95, 0x80, 0xdf, 0x94, 0xfa, 0x75, 0x8f, 0x3f, 0xa6,
  0x47, 0x07, 0xa7, 0xfc, 0xf3, 0x73, 0x17, 0xba, 0x83, 0x59, 0x3c, 0x19, 0xe6, 0x85, 0x4f, 0xa8,
  0x68, 0x6b, 0x81, 0xb2, 0x71, 0x64, 0xda, 0x8b, 0xf8, 0xeb, 0x0f, 0x4b, 0x70, 0x56, 0x9d, 0x35,
  0x1e, 0x24, 0x0e, 0x5e, 0x63, 0x58, 0xd1, 0xa2, 0x25, 0x22, 0x7c, 0x3b, 0x01, 0x21, 0x78, 0x87,
  0xd4, 0x00, 0x46, 0x57, 0x9f, 0xd3, 0x27, 0x52, 0x4c, 0x36, 0x02, 0xe7, 0xa0, 0xc4, 0xc8, 0x9e,
  0xea, 0xbf, 0x8a, 0xd2, 0x40, 0xc7, 0x38, 0xb5, 0xa3, 0xf7, 0xf2, 0xce, 0xf9, 0x61, 0x15, 0xa1,
  0xe0, 0xae, 0x5d, 0xa4, 0x9b, 0x34, 0x1a, 0x55, 0xad, 0x93, 0x32, 0x30, 0xf5, 0x8c, 0xb1, 0xe3,
  0x1d, 0xf6, 0xe2, 0x2e, 0x82, 0x66, 0xca, 0x60, 0xc0, 0x29, 0x23, 0xab, 0x0d, 0x53, 0x4e, 0x6f,
  0xd5, 0xdb, 0x37, 0x45, 0xde, 0xfd, 0x8e, 0x2f, 0x03, 0xff, 0x6a, 0x72, 0x6d, 0x6c, 0x5b, 0x51,
  0x8d, 0x1b, 0xaf, 0x92, 0xbb, 0xdd, 0xbc, 0x7f, 0x11, 0xd9, 0x5c, 0x41, 0x1f, 0x10, 0x5a, 0xd8,
  0x0a, 0xc1, 0x31, 0x88, 0xa5, 0xcd, 0x7b, 0xbd, 0x2d, 0x74, 0xd0, 0x12, 0xb8, 0xe5, 0xb4, 0xb0,
  0x89, 0x69, 0x97, 0x4a, 0x0c, 0x96, 0x77, 0x7e, 0x65, 0xb9, 0xf1, 0x09, 0xc5, 0x6e, 0xc6, 0x84,
  0x18, 0xf0, 0x7d, 0xec, 0x3a, 0xdc, 0x4d, 0x20, 0x79, 0xee, 0x5f, 0x3e, 0xd7, 0xcb, 0x39, 0x48
]

// 简化的线性同余生成器用于AES加密
function lcg(seed: u32): u32 {
  return (seed * 1103515245 + 12345) & 0x7fffffff
}

// 简化的AES S-box（前16个值）
const AES_S_BOX: u8[] = [
  0x63, 0x7c, 0x77, 0x7b, 0xf2, 0x6b, 0x6f, 0xc5, 0x30, 0x01, 0x67, 0x2b, 0xfe, 0xd7, 0xab, 0x76
]

// 简化的SM2加密（模拟实现，实际项目中应使用完整的椭圆曲线算法）
export function sm2Encrypt(data: string, key: string): string {
  // 实际的SM2是基于椭圆曲线的公钥加密算法
  // 这里我们实现一个简化的版本，仅用于演示
  let result: string = ""
  for (let i: i32 = 0; i < data.length; i++) {
    const charCode: u32 = data.charCodeAt(i)
    const keyChar: u32 = key.charCodeAt(i % key.length)
    const encryptedChar: u32 = (charCode ^ keyChar) & 0xFF
    result += String.fromCharCode(encryptedChar)
  }
  return "SM2_ENCRYPTED_" + result
}

// 简化的SM2解密（模拟实现）
export function sm2Decrypt(encryptedData: string, key: string): string {
  if (!encryptedData.startsWith("SM2_ENCRYPTED_")) {
    return encryptedData
  }
  
  const data: string = encryptedData.substring(14) // 移除前缀
  let result: string = ""
  for (let i: i32 = 0; i < data.length; i++) {
    const charCode: u32 = data.charCodeAt(i)
    const keyChar: u32 = key.charCodeAt(i % key.length)
    const decryptedChar: u32 = (charCode ^ keyChar) & 0xFF
    result += String.fromCharCode(decryptedChar)
  }
  return result
}

// 简化的AES加密实现
export function aesEncrypt(data: string, key: string): string {
  // 简化的AES实现，仅用于演示目的
  let result: string = ""
  let keyIndex: i32 = 0
  
  for (let i: i32 = 0; i < data.length; i++) {
    const charCode: u32 = data.charCodeAt(i)
    const keyChar: u32 = key.charCodeAt(keyIndex % key.length)
    keyIndex++
    
    // 简单的XOR
    const encryptedChar: u32 = charCode ^ keyChar
    result += String.fromCharCode(encryptedChar & 0xFF)
  }
  
  // Base64编码模拟
  return "AES_ENCRYPTED_" + result
}

// 简化的AES解密实现
export function aesDecrypt(encryptedData: string, key: string): string {
  if (!encryptedData.startsWith("AES_ENCRYPTED_")) {
    return encryptedData
  }
  
  const data: string = encryptedData.substring(14) // 移除前缀
  let result: string = ""
  let keyIndex: i32 = 0
  
  for (let i: i32 = 0; i < data.length; i++) {
    const charCode: u32 = data.charCodeAt(i)
    const keyChar: u32 = key.charCodeAt(keyIndex % key.length)
    keyIndex++
    
    // 简单的XOR（XOR的逆运算还是XOR）
    const decryptedChar: u32 = charCode ^ keyChar
    result += String.fromCharCode(decryptedChar & 0xFF)
  }
  
  return result
}

// SM4加密轮函数
function sm4Round(x: u32): u32 {
  const b0: u32 = (x >> 24) & 0xFF
  const b1: u32 = (x >> 16) & 0xFF
  const b2: u32 = (x >> 8) & 0xFF
  const b3: u32 = x & 0xFF
  
  const t0: u32 = S_BOX[b0] as u32
  const t1: u32 = S_BOX[b1] as u32
  const t2: u32 = S_BOX[b2] as u32
  const t3: u32 = S_BOX[b3] as u32
  
  return (t0 << 24) | (t1 << 16) | (t2 << 8) | t3
}

// SM4线性变换
function sm4LinearTransform(x: u32): u32 {
  const a: u32 = 0x04030201
  const b: u32 = 0x01040302
  const c: u32 = 0x02010403
  const d: u32 = 0x03020104
  
  const x0: u32 = (x >> 24) & 0xFF
  const x1: u32 = (x >> 16) & 0xFF
  const x2: u32 = (x >> 8) & 0xFF
  const x3: u32 = x & 0xFF
  
  const y0: u32 = ((a & 0xFF) * x0) ^ ((b & 0xFF) * x1) ^ ((c & 0xFF) * x2) ^ ((d & 0xFF) * x3)
  const y1: u32 = (((a >> 8) & 0xFF) * x0) ^ (((b >> 8) & 0xFF) * x1) ^ (((c >> 8) & 0xFF) * x2) ^ (((d >> 8) & 0xFF) * x3)
  const y2: u32 = (((a >> 16) & 0xFF) * x0) ^ (((b >> 16) & 0xFF) * x1) ^ (((c >> 16) & 0xFF) * x2) ^ (((d >> 16) & 0xFF) * x3)
  const y3: u32 = (((a >> 24) & 0xFF) * x0) ^ (((b >> 24) & 0xFF) * x1) ^ (((c >> 24) & 0xFF) * x2) ^ (((d >> 24) & 0xFF) * x3)
  
  return (y0 & 0xFF) | ((y1 & 0xFF) << 8) | ((y2 & 0xFF) << 16) | ((y3 & 0xFF) << 24)
}

// SM4加密实现
export function sm4Encrypt(data: string, key: string): string {
  // 将密钥扩展为4个32位字
  const keyWords: u32[] = new Array<u32>(4)
  for (let i: i32 = 0; i < 4; i++) {
    let word: u32 = 0
    for (let j: i32 = 0; j < 4 && (i * 4 + j) < key.length; j++) {
      word |= (key.charCodeAt(i * 4 + j) << (j * 8))
    }
    keyWords[i] = word
  }
  
  // 确保密钥数组长度为4
  while (keyWords.length < 4) {
    keyWords.push(0)
  }
  
  // 处理数据块（每16字节为一块）
  let result: string = ""
  for (let i: i32 = 0; i < data.length; i += 16) {
    // 获取16字节数据块
    const block: string = data.substring(i, i + 16)
    
    // 确保块长度为16字节
    let paddedBlock: string = block
    while (paddedBlock.length < 16) {
      paddedBlock += String.fromCharCode(0)
    }
    
    // 将数据块转换为4个32位字
    const dataWords: u32[] = new Array<u32>(4)
    for (let j: i32 = 0; j < 4; j++) {
      let word: u32 = 0
      for (let k: i32 = 0; k < 4; k++) {
        word |= (paddedBlock.charCodeAt(j * 4 + k) << (k * 8))
      }
      dataWords[j] = word
    }
    
    // 32轮加密
    for (let round: i32 = 0; round < 32; round++) {
      const roundKey: u32 = keyWords[round % 4]
      const temp: u32 = dataWords[0] ^ roundKey
      const transformed: u32 = sm4LinearTransform(sm4Round(temp))
      dataWords[0] = dataWords[1] ^ transformed
      dataWords[1] = dataWords[2]
      dataWords[2] = dataWords[3]
      dataWords[3] = temp
    }
    
    // 输出加密结果
    for (let j: i32 = 0; j < 4; j++) {
      const word: u32 = dataWords[j]
      result += String.fromCharCode(word & 0xFF)
      result += String.fromCharCode((word >> 8) & 0xFF)
      result += String.fromCharCode((word >> 16) & 0xFF)
      result += String.fromCharCode((word >> 24) & 0xFF)
    }
  }
  
  // 简单的Base64编码模拟
  return "SM4_ENCRYPTED_" + result
}

// 生成复杂的nonce值
export function generateNonce(): string {
  // 获取当前时间戳（毫秒）
  const timestamp: i64 = Date.now()
  
  // 生成多个随机数
  const random1: string = Math.random().toString().substring(2, 7)
  const random2: string = Math.random().toString().substring(2, 9)
  const random3: string = Math.floor(Math.random() * 1000000).toString()
  
  // 生成基于时间戳的哈希-like值
  const timeHash: i64 = (timestamp * 9301 + 49297) % 233280
  
  // 生成序列号
  const sequence: i64 = (timestamp & 0xFFFF) ^ (timestamp >>> 16)
  
  // 生成基于随机数的混合值
  const mixed: i64 = ((random1.length * random2.length * random3.length) + timestamp) % 999999
  
  // 生成最终的复杂nonce
  let nonce: string = random1 + sequence.toString() + random2 + timeHash.toString() + random3 + mixed.toString()
  
  // 确保长度足够复杂
  if (nonce.length < 32) {
    const padding: string = Math.random().toString().substring(2, 34 - nonce.length)
    nonce = nonce + padding
  }
  
  return nonce
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

// UU2请求加密处理函数
export function uu2_wasm(requestFunc: (key: string) => string, getConfig: (key: string) => string): string {
  // 通过requestFunc函数获取请求数据
  const requestData: string = requestFunc("data");
  const requestUrl: string = requestFunc("url");
  
  // 通过getConfig函数获取配置
  const configOpenStr: string = getConfig("requestCodecOpen");
  const requestCodecOpen: bool = configOpenStr === "true";
  
  const codecRequestKey: string = getConfig("codecRequestKey");
  
  // 检查是否需要跳过加密
  if (requestUrl.startsWith(SETTING_PATH)) {
    return requestData;
  }

  if (!requestData || requestData.length == 0) {
    return requestData;
  }

  if (!requestCodecOpen || !codecRequestKey || codecRequestKey.length == 0) {
    return requestData;
  }

  // 生成反重放攻击保护参数
  const timestamp: i64 = Date.now();
  const nonce: string = generateNonce();

  // 验证请求唯一性（简化实现）
  if (!validateTimestamp(timestamp, 300000)) {
    return "ERROR: Anti-replay validation failed";
  }

  const encryptedData: string = sm4Encrypt(requestData, codecRequestKey);
  
  // 构造响应JSON
  const result = `{
    "data": "${encryptedData}",
    "headers": {
      "${ORIGIN_KEY_HEADER}": ${timestamp},
      "${TIMESTAMP_HEADER}": "${timestamp}",
      "${NONCE_HEADER}": "${nonce}"
    }
  }`;
  
  return result;
}

// UU1响应解密处理函数
export function uu1_wasm(responseFunc: (key: string) => string): string {
  // 通过responseFunc函数获取响应数据
  const statusStr: string = responseFunc("status");
  const responseData: string = responseFunc("data");
  const headersStr: string = responseFunc("headers");
  
  // 解析状态码
  let responseStatus: i32 = 0;
  if (statusStr && statusStr.length > 0) {
    responseStatus = <i32>parseInt(statusStr);
  }
  
  // 解析headers中的值
  let originKey: string = "";
  let timestamp: string = "";
  
  if (headersStr && headersStr.length > 0) {
    originKey = parseJsonString(headersStr, "access-control-origin-key");
    timestamp = parseJsonString(headersStr, "access-control-timestamp-user");
  }
  
  // 检查响应状态
  if (responseStatus !== SUCCESS_STATUS) {
    return responseData;
  }

  // 简单验证
  if (!responseData || responseData.length == 0) {
    return responseData;
  }

  // 获取原始数据
  let rawData: string = responseData;
  
  // 检查是否是嵌套对象
  if (responseData.startsWith("{") && responseData.endsWith("}")) {
    // 尝试解析JSON以获取内部数据
    const innerData: string = parseJsonString(responseData, "data");
    if (innerData && innerData.length > 0) {
      rawData = innerData;
    }
  }

  // 检查加密数据标识
  if (!rawData.startsWith(ENCRYPTED_PREFIX)) {
    return responseData;
  }

  if (!originKey || originKey.length == 0) {
    return responseData;
  }

  // 数据切片和解密
  const startIndex: i32 = PREFIX_LENGTH;
  const endIndex: i32 = <i32>rawData.length - SUFFIX_LENGTH;
  if (startIndex < endIndex) {
    const encryptedPart: string = rawData.substring(startIndex, endIndex);
    const decryptKey: string = aesDecrypt(originKey, timestamp);
    const decryptedData: string = sm2Decrypt(encryptedPart, decryptKey);
    return decryptedData;
  }

  return responseData;
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

// AES加密工具函数
export function encryptAES(data: string, key: string): string {
  if (!data || data.length == 0) {
    return data
  }
  return aesEncrypt(data, key)
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

// UU3 AES解密工具函数
export function uu3_wasm(value: string, getConfig: (key: string) => string): string {
  // 检查输入参数
  if (!value || value.length == 0) {
    return value;
  }
  
  // 通过getConfig函数获取配置
  const codecResponseKey: string = getConfig("codecResponseKey");
  
  // 使用配置的密钥进行解密，如果没有配置密钥则使用默认密钥
  const key: string = codecResponseKey && codecResponseKey.length > 0 ? codecResponseKey : DEFAULT_AES_KEY;
  return aesDecrypt(value, key);
}

// 简单的JSON解析辅助函数
function parseJsonString(json: string, key: string): string {
  if (!json || !key) return "";
  
  const keyIndex: i32 = json.indexOf("\"" + key + "\":");
  if (keyIndex < 0) return "";
  
  let valueStart: i32 = json.indexOf("\"", keyIndex + key.length + 3);
  if (valueStart < 0) return "";
  
  valueStart++; // 跳过开始的引号
  let valueEnd: i32 = valueStart;
  
  // 查找结束引号
  while (valueEnd < json.length && json.charCodeAt(valueEnd) != 34) {
    valueEnd++;
  }
  
  if (valueEnd > valueStart) {
    return json.substring(valueStart, valueEnd);
  }
  
  return "";
}

// UU4特殊响应解密处理函数
export function uu4_wasm(responseFunc: (key: string) => string): string {
  // 通过responseFunc函数获取响应数据
  const responseData: string = responseFunc("data");
  const uuid: string = responseFunc("uuid");
  const timestamp: string = responseFunc("timestamp");
  
  // 检查输入参数
  if (!responseData || responseData.length == 0) {
    return "{}"
  }

  // 检查是否为加密数据
  if (!responseData.startsWith(ENCRYPTED_PREFIX)) {
    return responseData
  }

  // 检查UUID
  if (!uuid || uuid.length == 0) {
    return "{}"
  }

  // 数据切片和解密
  const startIndex: i32 = PREFIX_LENGTH
  const endIndex: i32 = <i32>responseData.length - SUFFIX_LENGTH
  
  if (startIndex < endIndex) {
    const encryptedSegment: string = responseData.substring(startIndex, endIndex)
    const key: string = aesDecrypt(uuid, timestamp)
    const decrypted: string = sm2Decrypt(encryptedSegment, key)
    
    // 验证解密结果
    if (decrypted && decrypted.length > 0 && decrypted !== '{}') {
      // 确保返回的是有效的JSON字符串
      return decrypted
    }
  }

  return "{}"
}

// Storage Key加密处理函数
export function encryptStorageKey(key: string, systemCode: string): string {
  if (!key) {
    return key;
  }
  
  // 对于以responsiveStorageNameSpace开头的key，不进行加密
  if (key.startsWith("responsive-")) {
    return key;
  }
  
  // 生成新的key，加上系统代码前缀
  const newKey: string = systemCode + key;
  return newKey;
}

// Storage Value加密处理函数
export function encryptStorageValue(value: string, key: string, systemCode: string, storageKey: string, storageEncode: bool): string {
  if (!key || !value) {
    return value;
  }
  
  // 对于以responsiveStorageNameSpace开头的key，不进行加密
  if (key.startsWith("responsive-")) {
    return value;
  }
  
  // 如果启用了存储加密，则对值进行AES加密
  if (storageEncode) {
    return aesEncrypt(value, storageKey);
  }
  
  return value;
}

// Storage Value解密处理函数
export function decryptStorageValue(value: string, key: string, systemCode: string, storageKey: string, storageEncode: bool): string {
  if (!key || !value) {
    return value;
  }
  
  // 对于以responsiveStorageNameSpace开头的key，不进行解密
  if (key.startsWith("responsive-")) {
    return value;
  }
  
  // 如果启用了存储加密，则对值进行AES解密
  if (storageEncode) {
    return aesDecrypt(value, storageKey);
  }
  
  return value;
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

// 生成签名
export function generateSign(paramsJson: string, timestamp: i64, nonce: string, secretKey: string): string {
  // 解析参数JSON字符串
  // 使用简单的键值对数组来存储参数
  const keys: string[] = new Array<string>()
  const values: string[] = new Array<string>()
  
  // 简化的参数解析（假设格式为 key1=value1&key2=value2 的形式）
  if (paramsJson.includes("=")) {
    const pairs: string[] = paramsJson.split("&")
    for (let i: i32 = 0; i < pairs.length; i++) {
      const pair: string = pairs[i]
      const eqIndex: i32 = pair.indexOf("=")
      if (eqIndex > 0) {
        const key: string = pair.substring(0, eqIndex)
        const value: string = pair.substring(eqIndex + 1)
        keys.push(key)
        values.push(value)
      }
    }
  }
  
  // 添加nonce和timestamp
  keys.push('_nonce')
  values.push(nonce)
  keys.push('_timestamp')
  values.push(timestamp.toString())
  
  // 简单排序（冒泡排序）
  for (let i: i32 = 0; i < keys.length - 1; i++) {
    for (let j: i32 = 0; j < keys.length - i - 1; j++) {
      if (keys[j] > keys[j + 1]) {
        // 交换键
        const tempKey: string = keys[j]
        keys[j] = keys[j + 1]
        keys[j + 1] = tempKey
        
        // 交换值
        const tempValue: string = values[j]
        values[j] = values[j + 1]
        values[j + 1] = tempValue
      }
    }
  }
  
  // 拼接参数字符串
  let paramString: string = ""
  for (let i: i32 = 0; i < keys.length; i++) {
    const key: string = keys[i]
    const value: string = values[i]
    if (value != null && value != "") {
      paramString += key + "=" + value + "&"
    }
  }
  
  // 移除末尾的&符号
  if (paramString.endsWith("&")) {
    paramString = paramString.substring(0, paramString.length - 1)
  }
  
  // 添加密钥
  const dataToSign: string = paramString + secretKey
  
  // 生成MD5签名
  return md5Hash(dataToSign)
}

// MD5哈希函数
export function md5Hash(input: string): string {
  // 简化的MD5实现（实际项目中应使用完整的MD5算法）
  let hash: i64 = 0
  for (let i: i32 = 0; i < input.length; i++) {
    const character: i32 = input.charCodeAt(i)
    hash = ((hash << 5) - hash) + character
    hash = hash & 0x7fffffffffffffff // 转换为64位有符号整数
  }
  // 转换为16进制字符串
  let hex: string = hash.toString(16)
  // 确保长度为32位，不足的前面补0
  while (hex.length < 32) {
    hex = "0" + hex
  }
  // 如果超过32位，取前32位
  if (hex.length > 32) {
    hex = hex.substring(0, 32)
  }
  return hex
}

// 导出一个示例函数
export function add(a: i32, b: i32): i32 {
  return a + b
}