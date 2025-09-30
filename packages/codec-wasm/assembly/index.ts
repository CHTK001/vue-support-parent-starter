// Codec WASM Module - 加密解密核心功能实现

// 常量定义
const ORIGIN_KEY_HEADER: string = 'access-control-origin-key'
const TIMESTAMP_HEADER: string = 'access-control-timestamp-user'
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

// SM4 FK constants
const FK: u32[] = [0xA3B1BAC6, 0x56AA3350, 0x677D9197, 0xB27022DC]

// SM4 CK constants
const CK: u32[] = [
  0x00070E15, 0x1C232A31, 0x383F464D, 0x545B6269, 0x70777E85, 0x8C939AA1, 0xA8AFB6BD, 0xC4CBD2D9,
  0xE0E7EEF5, 0xFC030A11, 0x181F262D, 0x343B4249, 0x50575E65, 0x6C737A81, 0x888F969D, 0xA4ABB2B9,
  0xC0C7CED5, 0xDCE3EAF1, 0xF8FF060D, 0x141B2229, 0x30373E45, 0x4C535A61, 0x686F767D, 0x848B9299,
  0xA0A7AEB5, 0xBCC3CAD1, 0xD8DFE6ED, 0xF4FB0209, 0x10171E25, 0x2C333A41, 0x484F565D, 0x646B7279
]

// 简化的线性同余生成器用于AES加密
function lcg(seed: u32): u32 {
  return (seed * 1103515245 + 12345) & 0x7fffffff
}

// 简化的AES S-box（前16个值）
const AES_S_BOX: u8[] = [
  0x63, 0x7c, 0x77, 0x7b, 0xf2, 0x6b, 0x6f, 0xc5, 0x30, 0x01, 0x67, 0x2b, 0xfe, 0xd7, 0xab, 0x76
]

// SM4 S-box变换
function sm4SBox(a: u32): u32 {
  const b0: u32 = (a >> 24) & 0xFF
  const b1: u32 = (a >> 16) & 0xFF
  const b2: u32 = (a >> 8) & 0xFF
  const b3: u32 = a & 0xFF
  
  const t0: u32 = S_BOX[b0] as u32
  const t1: u32 = S_BOX[b1] as u32
  const t2: u32 = S_BOX[b2] as u32
  const t3: u32 = S_BOX[b3] as u32
  
  return (t0 << 24) | (t1 << 16) | (t2 << 8) | t3
}

// SM4线性变换L
function sm4LinearTransform(b: u32): u32 {
  return b ^ (b << 2 | b >> 30) ^ (b << 10 | b >> 22) ^ (b << 18 | b >> 14) ^ (b << 24 | b >> 8)
}

// SM4线性变换L'
function sm4LinearTransformPrime(b: u32): u32 {
  return b ^ (b << 13 | b >> 19) ^ (b << 23 | b >> 9)
}

// SM4轮函数F
function sm4RoundFunction(x0: u32, x1: u32, x2: u32, x3: u32, rk: u32): u32 {
  const temp: u32 = x1 ^ x2 ^ x3 ^ rk
  const t: u32 = sm4SBox(temp)
  return x0 ^ sm4LinearTransform(t)
}

// SM4密钥扩展
function sm4KeySchedule(key: u32[]): u32[] {
  const rk: u32[] = new Array<u32>(32)
  const k: u32[] = new Array<u32>(4)
  
  // 初始化密钥
  k[0] = key[0] ^ FK[0]
  k[1] = key[1] ^ FK[1]
  k[2] = key[2] ^ FK[2]
  k[3] = key[3] ^ FK[3]
  
  // 生成轮密钥
  for (let i: i32 = 0; i < 32; i++) {
    const temp: u32 = k[(i + 1) & 3] ^ k[(i + 2) & 3] ^ k[(i + 3) & 3] ^ CK[i]
    const t: u32 = sm4SBox(temp)
    k[i & 3] ^= sm4LinearTransformPrime(t)
    rk[i] = k[i & 3]
  }
  
  return rk
}

// SM4加密单个块
function sm4EncryptBlock(block: u32[], rk: u32[]): u32[] {
  let x0: u32 = block[0];
  let x1: u32 = block[1];
  let x2: u32 = block[2];
  let x3: u32 = block[3];
  
  // 32轮加密
  for (let i: i32 = 0; i < 32; i++) {
    const temp: u32 = x0 ^ x1 ^ x2 ^ x3 ^ rk[i];
    const t: u32 = sm4SBox(temp);
    const result: u32 = x0 ^ sm4LinearTransform(t);
    
    // 循环移位
    x0 = x1;
    x1 = x2;
    x2 = x3;
    x3 = result;
  }
  
  // 重新排列输出
  const result: u32[] = new Array<u32>(4);
  result[0] = x3;
  result[1] = x2;
  result[2] = x1;
  result[3] = x0;
  
  return result;
}

// 字符串转字节数组
function stringToBytes(str: string): u8[] {
  const bytes: u8[] = new Array<u8>(str.length)
  for (let i: i32 = 0; i < str.length; i++) {
    bytes[i] = str.charCodeAt(i) as u8
  }
  return bytes
}

// 字节数组转字符串
function bytesToString(bytes: u8[]): string {
  let str: string = ""
  for (let i: i32 = 0; i < bytes.length; i++) {
    str += String.fromCharCode(bytes[i])
  }
  return str
}

// 字节数组转u32数组
function bytesToWords(bytes: u8[]): u32[] {
  const words: u32[] = new Array<u32>((bytes.length + 3) / 4)
  for (let i: i32 = 0; i < words.length; i++) {
    const offset: i32 = i * 4
    words[i] = (
      ((offset < bytes.length ? bytes[offset] : 0) << 24) |
      ((offset + 1 < bytes.length ? bytes[offset + 1] : 0) << 16) |
      ((offset + 2 < bytes.length ? bytes[offset + 2] : 0) << 8) |
      (offset + 3 < bytes.length ? bytes[offset + 3] : 0)
    ) >>> 0
  }
  return words
}

// u32数组转字节数组
function wordsToBytes(words: u32[]): u8[] {
  const bytes: u8[] = new Array<u8>(words.length * 4)
  for (let i: i32 = 0; i < words.length; i++) {
    const word: u32 = words[i]
    bytes[i * 4] = ((word >> 24) & 0xFF) as u8
    bytes[i * 4 + 1] = ((word >> 16) & 0xFF) as u8
    bytes[i * 4 + 2] = ((word >> 8) & 0xFF) as u8
    bytes[i * 4 + 3] = (word & 0xFF) as u8
  }
  return bytes
}

// 字节数组异或
function xorBytes(a: u8[], b: u8[]): u8[] {
  const result: u8[] = new Array<u8>(a.length)
  for (let i: i32 = 0; i < a.length; i++) {
    result[i] = a[i] ^ (i < b.length ? b[i] : 0)
  }
  return result
}

// PKCS#7填充
function pkcs7Pad(data: u8[], blockSize: i32 = 16): u8[] {
  const padLen: i32 = blockSize - (data.length % blockSize)
  const padded: u8[] = new Array<u8>(data.length + padLen)
  
  // 复制原始数据
  for (let i: i32 = 0; i < data.length; i++) {
    padded[i] = data[i]
  }
  
  // 添加填充
  for (let i: i32 = data.length; i < padded.length; i++) {
    padded[i] = padLen as u8
  }
  
  return padded
}

// PKCS#7去填充
function pkcs7Unpad(data: u8[]): u8[] {
  if (data.length == 0) return data
  const padLen: i32 = data[data.length - 1] as i32
  if (padLen > data.length) return data
  return data.slice(0, data.length - padLen)
}

// SM4 ECB模式加密
function sm4EncryptECB(data: u8[], key: u8[]): u8[] {
  // 将密钥转换为u32数组
  const keyWords: u32[] = bytesToWords(key)
  // 生成轮密钥
  const rk: u32[] = sm4KeySchedule(keyWords)
  
  // 对数据进行PKCS#7填充
  const paddedData: u8[] = pkcs7Pad(data)
  
  // 分块加密
  const encrypted: u8[] = new Array<u8>(paddedData.length)
  for (let i: i32 = 0; i < paddedData.length; i += 16) {
    // 获取一个块
    const blockBytes: u8[] = paddedData.slice(i, i + 16)
    // 转换为u32数组
    const blockWords: u32[] = bytesToWords(blockBytes)
    // 加密
    const encryptedWords: u32[] = sm4EncryptBlock(blockWords, rk)
    // 转换回字节数组
    const encryptedBytes: u8[] = wordsToBytes(encryptedWords)
    // 复制到结果数组
    for (let j: i32 = 0; j < 16 && i + j < encrypted.length; j++) {
      encrypted[i + j] = encryptedBytes[j]
    }
  }
  
  return encrypted
}

// SM4加密实现
export function sm4Encrypt(data: string, key: string): string {
  // 将输入数据和密钥转换为字节数组
  const dataBytes: u8[] = stringToBytes(data)
  const keyBytes: u8[] = stringToBytes(key)
  
  // 确保密钥长度为16字节
  let fixedKeyBytes: u8[] = new Array<u8>(16)
  for (let i: i32 = 0; i < 16; i++) {
    fixedKeyBytes[i] = i < keyBytes.length ? keyBytes[i] : 0
  }
  
  // 执行SM4加密
  const encryptedBytes: u8[] = sm4EncryptECB(dataBytes, fixedKeyBytes)
  
  // 将加密结果转换为十六进制字符串
  let hexResult: string = ""
  for (let i: i32 = 0; i < encryptedBytes.length; i++) {
    const hex: string = encryptedBytes[i].toString(16)
    hexResult += hex.length == 1 ? "0" + hex : hex
  }
  
  return hexResult
}

// SM4 ECB模式解密
function sm4DecryptECB(encryptedData: u8[], key: u8[]): u8[] {
  // 将密钥转换为u32数组
  const keyWords: u32[] = bytesToWords(key);
  // 生成轮密钥
  const rk: u32[] = sm4KeySchedule(keyWords);
  
  // 反转轮密钥顺序用于解密
  const reversedRk: u32[] = new Array<u32>(32);
  for (let i: i32 = 0; i < 32; i++) {
    reversedRk[i] = rk[31 - i];
  }
  
  // 分块解密
  const decrypted: u8[] = new Array<u8>(encryptedData.length);
  for (let i: i32 = 0; i < encryptedData.length; i += 16) {
    // 获取一个块
    const blockBytes: u8[] = encryptedData.slice(i, i + 16);
    // 转换为u32数组
    const blockWords: u32[] = bytesToWords(blockBytes);
    // 解密
    const decryptedWords: u32[] = sm4EncryptBlock(blockWords, reversedRk);
    // 转换回字节数组
    const decryptedBytes: u8[] = wordsToBytes(decryptedWords);
    // 复制到结果数组
    for (let j: i32 = 0; j < 16 && i + j < decrypted.length; j++) {
      decrypted[i + j] = decryptedBytes[j];
    }
  }
  
  // PKCS#7去填充
  return pkcs7Unpad(decrypted);
}

// SM4解密实现
export function sm4Decrypt(encryptedData: string, key: string): string {
  // 检查输入数据长度是否为偶数
  if (encryptedData.length % 2 != 0) {
    return ""; // 返回空字符串表示解密失败
  }
  
  // 将十六进制字符串转换为字节数组
  const encryptedBytes: u8[] = new Array<u8>(encryptedData.length / 2);
  for (let i: i32 = 0; i < encryptedData.length; i += 2) {
    const hexByte: string = encryptedData.substring(i, i + 2);
    encryptedBytes[i / 2] = <u8>parseInt(hexByte, 16);
  }
  
  // 将密钥转换为字节数组
  const keyBytes: u8[] = stringToBytes(key);
  
  // 确保密钥长度为16字节
  let fixedKeyBytes: u8[] = new Array<u8>(16);
  for (let i: i32 = 0; i < 16; i++) {
    fixedKeyBytes[i] = i < keyBytes.length ? keyBytes[i] : 0;
  }
  
  // 执行SM4解密
  const decryptedBytes: u8[] = sm4DecryptECB(encryptedBytes, fixedKeyBytes);
  
  // 将解密结果转换为字符串
  return bytesToString(decryptedBytes);
}

// SM2椭圆曲线参数 (国密标准)
const SM2_P: u32[] = [0xFFFFFFFE, 0xFFFFFFFF, 0xFFFFFFFF, 0xFFFFFFFF, 0xFFFFFFFF, 0x00000000, 0xFFFFFFFF, 0xFFFFFFFF]
const SM2_A: u32[] = [0xFFFFFFFD, 0xFFFFFFFF, 0xFFFFFFFF, 0xFFFFFFFF, 0xFFFFFFFF, 0x00000000, 0xFFFFFFFF, 0xFFFFFFFF]
const SM2_B: u32[] = [0x28E9FA9E, 0x9D9F5E34, 0x4D5A9E4B, 0xCF6509A7, 0xF39789F5, 0x165667D1, 0x71875B5B, 0xDCB65A92]
const SM2_N: u32[] = [0xFFFFFFFE, 0xFFFFFFFF, 0xFFFFFFFF, 0xFFFFFFFF, 0x7203DF6B, 0x21C6052B, 0x53BBF409, 0x39D54123]
const SM2_G_X: u32[] = [0x32C4AE2C, 0x1F198119, 0x5F990446, 0x6A39C994, 0x8FE30BBF, 0xF2660BE1, 0x715A4589, 0x334C74C7]
const SM2_G_Y: u32[] = [0xBC3736A2, 0xF4F6779C, 0x59BDCEE3, 0x6B692153, 0xD0A9877C, 0xC62A4740, 0x7C8360BE, 0xB81E3E65]

// 大数运算辅助函数
function bigIntAdd(a: u32[], b: u32[]): u32[] {
  const result: u32[] = new Array<u32>(8)
  let carry: u64 = 0
  
  for (let i: i32 = 0; i < 8; i++) {
    const sum: u64 = (<u64>a[i]) + (<u64>b[i]) + carry
    result[i] = sum as u32
    carry = sum >> 32
  }
  
  return result
}

function bigIntSubtract(a: u32[], b: u32[]): u32[] {
  const result: u32[] = new Array<u32>(8)
  let borrow: u64 = 0
  
  for (let i: i32 = 0; i < 8; i++) {
    const diff: u64 = (<u64>a[i]) - (<u64>b[i]) - borrow
    result[i] = diff as u32
    borrow = (diff >> 32) & 1
  }
  
  return result
}

function bigIntMultiply(a: u32[], b: u32[]): u32[] {
  const result: u32[] = new Array<u32>(16)
  
  // 初始化结果数组
  for (let i: i32 = 0; i < 16; i++) {
    result[i] = 0
  }
  
  // 逐位相乘并累加
  for (let i: i32 = 0; i < 8; i++) {
    let carry: u64 = 0
    for (let j: i32 = 0; j < 8; j++) {
      const product: u64 = (<u64>a[i]) * (<u64>b[j]) + (<u64>result[i + j]) + carry
      result[i + j] = product as u32
      carry = product >> 32
    }
    result[i + 8] = carry as u32
  }
  
  // 取低8个32位字
  const res: u32[] = new Array<u32>(8)
  for (let i: i32 = 0; i < 8; i++) {
    res[i] = result[i]
  }
  
  return res
}

function bigIntMod(a: u32[], m: u32[]): u32[] {
  // 简化的模运算实现（实际应用中需要更完整的实现）
  // 这里仅作示意，实际SM2需要完整的模运算支持
  const result: u32[] = new Array<u32>(8)
  for (let i: i32 = 0; i < 8; i++) {
    result[i] = a[i] % (m[i] || 0xFFFFFFFF)
  }
  return result
}

// 椭圆曲线点结构
class ECPoint {
  x: u32[]
  y: u32[]
  isInfinity: bool
  
  constructor(x: u32[], y: u32[], isInfinity: bool = false) {
    this.x = x
    this.y = y
    this.isInfinity = isInfinity
  }
}

// 椭圆曲线点加法
function ecPointAdd(p1: ECPoint, p2: ECPoint): ECPoint {
  if (p1.isInfinity) return p2
  if (p2.isInfinity) return p1
  
  // 简化的点加法实现（实际应用中需要完整的椭圆曲线数学）
  // 这里仅作示意，实际SM2需要完整的椭圆曲线运算支持
  const x: u32[] = bigIntAdd(p1.x, p2.x)
  const y: u32[] = bigIntAdd(p1.y, p2.y)
  
  return new ECPoint(x, y)
}

// 椭圆曲线标量乘法
function ecScalarMultiply(k: u32[], point: ECPoint): ECPoint {
  // 简化的标量乘法实现（实际应用中需要完整的椭圆曲线数学）
  // 这里仅作示意，实际SM2需要完整的椭圆曲线运算支持
  const x: u32[] = bigIntMultiply(k, point.x)
  const y: u32[] = bigIntMultiply(k, point.y)
  
  return new ECPoint(x, y)
}

// SM2加密实现
export function sm2Encrypt(data: string, key: string): string {
  // 将输入数据和密钥转换为字节数组
  const dataBytes: u8[] = stringToBytes(data)
  const keyBytes: u8[] = stringToBytes(key)
  
  // 简化的SM2加密流程（实际应用中需要完整的SM2算法实现）
  // 1. 生成随机数k
  // 2. 计算C1 = k * G
  // 3. 计算S = h * PUBKEY，检查是否为无穷远点
  // 4. 计算椭圆曲线点[k]PB = (x2, y2)
  // 5. 计算t = KDF(x2 || y2, klen)
  // 6. 计算C2 = M ⊕ t
  // 7. 计算C3 = Hash(x2 || M || y2)
  // 8. 输出密文C = C1 || C3 || C2
  
  // 目前仅作为示意实现，实际SM2需要完整的椭圆曲线密码学支持
  // 在AssemblyScript中实现完整的SM2算法较为复杂，这里提供基础框架
  
  // 简化处理：将数据与密钥进行异或操作作为示例
  const encryptedBytes: u8[] = xorBytes(dataBytes, keyBytes)
  
  // 将加密结果转换为十六进制字符串
  let hexResult: string = ""
  for (let i: i32 = 0; i < encryptedBytes.length; i++) {
    const hex: string = encryptedBytes[i].toString(16)
    hexResult += hex.length == 1 ? "0" + hex : hex
  }
  
  return hexResult
}

// SM2解密实现
export function sm2Decrypt(encryptedData: string, key: string): string {
  // 检查输入数据长度是否为偶数
  if (encryptedData.length % 2 != 0) {
    return "" // 返回空字符串表示解密失败
  }
  
  // 将十六进制字符串转换为字节数组
  const encryptedBytes: u8[] = new Array<u8>(encryptedData.length / 2)
  for (let i: i32 = 0; i < encryptedData.length; i += 2) {
    const hexByte: string = encryptedData.substring(i, i + 2)
    encryptedBytes[i / 2] = <u8>parseInt(hexByte, 16)
  }
  
  const keyBytes: u8[] = stringToBytes(key)
  
  // 简化的SM2解密流程（实际应用中需要完整的SM2算法实现）
  // 1. 从密文中取出C1
  // 2. 验证C1是否满足椭圆曲线方程
  // 3. 计算[dB]C1 = (x2, y2)
  // 4. 计算t = KDF(x2 || y2, klen)
  // 5. 从密文中取出C2，计算M' = C2 ⊕ t
  // 6. 计算u = Hash(x2 || M' || y2)，从密文中取出C3
  // 7. 若u == C3，则解密成功，输出明文M'；否则解密失败
  
  // 目前仅作为示意实现，实际SM2需要完整的椭圆曲线密码学支持
  // 在AssemblyScript中实现完整的SM2算法较为复杂，这里提供基础框架
  
  // 简化处理：将数据与密钥进行异或操作作为示例（与加密过程相同）
  const decryptedBytes: u8[] = xorBytes(encryptedBytes, keyBytes)
  
  // 将解密结果转换为字符串
  return bytesToString(decryptedBytes)
}

// AES S-box
const AES_SBOX: u8[] = [
  0x63, 0x7c, 0x77, 0x7b, 0xf2, 0x6b, 0x6f, 0xc5, 0x30, 0x01, 0x67, 0x2b, 0xfe, 0xd7, 0xab, 0x76,
  0xca, 0x82, 0xc9, 0x7d, 0xfa, 0x59, 0x47, 0xf0, 0xad, 0xd4, 0xa2, 0xaf, 0x9c, 0xa4, 0x72, 0xc0,
  0xb7, 0xfd, 0x93, 0x26, 0x36, 0x3f, 0xf7, 0xcc, 0x34, 0xa5, 0xe5, 0xf1, 0x71, 0xd8, 0x31, 0x15,
  0x04, 0xc7, 0x23, 0xc3, 0x18, 0x96, 0x05, 0x9a, 0x07, 0x12, 0x80, 0xe2, 0xeb, 0x27, 0xb2, 0x75,
  0x09, 0x83, 0x2c, 0x1a, 0x1b, 0x6e, 0x5a, 0xa0, 0x52, 0x3b, 0xd6, 0xb3, 0x29, 0xe3, 0x2f, 0x84,
  0x53, 0xd1, 0x00, 0xed, 0x20, 0xfc, 0xb1, 0x5b, 0x6a, 0xcb, 0xbe, 0x39, 0x4a, 0x4c, 0x58, 0xcf,
  0xd0, 0xef, 0xaa, 0xfb, 0x43, 0x4d, 0x33, 0x85, 0x45, 0xf9, 0x02, 0x7f, 0x50, 0x3c, 0x9f, 0xa8,
  0x51, 0xa3, 0x40, 0x8f, 0x92, 0x9d, 0x38, 0xf5, 0xbc, 0xb6, 0xda, 0x21, 0x10, 0xff, 0xf3, 0xd2,
  0xcd, 0x0c, 0x13, 0xec, 0x5f, 0x97, 0x44, 0x17, 0xc4, 0xa7, 0x7e, 0x3d, 0x64, 0x5d, 0x19, 0x73,
  0x60, 0x81, 0x4f, 0xdc, 0x22, 0x2a, 0x90, 0x88, 0x46, 0xee, 0xb8, 0x14, 0xde, 0x5e, 0x0b, 0xdb,
  0xe0, 0x32, 0x3a, 0x0a, 0x49, 0x06, 0x24, 0x5c, 0xc2, 0xd3, 0xac, 0x62, 0x91, 0x95, 0xe4, 0x79,
  0xe7, 0xc8, 0x37, 0x6d, 0x8d, 0xd5, 0x4e, 0xa9, 0x6c, 0x56, 0xf4, 0xea, 0x65, 0x7a, 0xae, 0x08,
  0xba, 0x78, 0x25, 0x2e, 0x1c, 0xa6, 0xb4, 0xc6, 0xe8, 0xdd, 0x74, 0x1f, 0x4b, 0xbd, 0x8b, 0x8a,
  0x70, 0x3e, 0xb5, 0x66, 0x48, 0x03, 0xf6, 0x0e, 0x61, 0x35, 0x57, 0xb9, 0x86, 0xc1, 0x1d, 0x9e,
  0xe1, 0xf8, 0x98, 0x11, 0x69, 0xd9, 0x8e, 0x94, 0x9b, 0x1e, 0x87, 0xe9, 0xce, 0x55, 0x28, 0xdf,
  0x8c, 0xa1, 0x89, 0x0d, 0xbf, 0xe6, 0x42, 0x68, 0x41, 0x99, 0x2d, 0x0f, 0xb0, 0x54, 0xbb, 0x16
]

// AES逆S-box
const AES_INVERSE_SBOX: u8[] = [
  0x52, 0x09, 0x6a, 0xd5, 0x30, 0x36, 0xa5, 0x38, 0xbf, 0x40, 0xa3, 0x9e, 0x81, 0xf3, 0xd7, 0xfb,
  0x7c, 0xe3, 0x39, 0x82, 0x9b, 0x2f, 0xff, 0x87, 0x34, 0x8e, 0x43, 0x44, 0xc4, 0xde, 0xe9, 0xcb,
  0x54, 0x7b, 0x94, 0x32, 0xa6, 0xc2, 0x23, 0x3d, 0xee, 0x4c, 0x95, 0x0b, 0x42, 0xfa, 0xc3, 0x4e,
  0x08, 0x2e, 0xa1, 0x66, 0x28, 0xd9, 0x24, 0xb2, 0x76, 0x5b, 0xa2, 0x49, 0x6d, 0x8b, 0xd1, 0x25,
 0x72, 0xf8, 0xf6, 0x64, 0x86, 0x68, 0x98, 0x16, 0xd4, 0xa4, 0x5c, 0xcc, 0x5d, 0x65, 0xb6, 0x92,
  0x6c, 0x70, 0x48, 0x50, 0xfd, 0xed, 0xb9, 0xda, 0x5e, 0x15, 0x46, 0x57, 0xa7, 0x8d, 0x9d, 0x84,
  0x90, 0xd8, 0xab, 0x00, 0x8c, 0xbc, 0xd3, 0x0a, 0xf7, 0xe4, 0x58, 0x05, 0xb8, 0xb3, 0x45, 0x06,
  0xd0, 0x2c, 0x1e, 0x8f, 0xca, 0x3f, 0x0f, 0x02, 0xc1, 0xaf, 0xbd, 0x03, 0x01, 0x13, 0x8a, 0x6b,
  0x3a, 0x91, 0x11, 0x41, 0x4f, 0x67, 0xdc, 0xea, 0x97, 0xf2, 0xcf, 0xce, 0xf0, 0xb4, 0xe6, 0x73,
  0x96, 0xac, 0x74, 0x22, 0xe7, 0xad, 0x35, 0x85, 0xe2, 0xf9, 0x37, 0xe8, 0x1c, 0x75, 0xdf, 0x6e,
  0x47, 0xf1, 0x1a, 0x71, 0x1d, 0x29, 0xc5, 0x89, 0x6f, 0xb7, 0x62, 0x0e, 0xaa, 0x18, 0xbe, 0x1b,
  0xfc, 0x56, 0x3e, 0x4b, 0xc6, 0xd2, 0x79, 0x20, 0x9a, 0xdb, 0xc0, 0xfe, 0x78, 0xcd, 0x5a, 0xf4,
  0x1f, 0xdd, 0xa8, 0x33, 0x88, 0x07, 0xc7, 0x31, 0xb1, 0x12, 0x10, 0x59, 0x27, 0x80, 0xec, 0x5f,
  0x60, 0x51, 0x7f, 0xa9, 0x19, 0xb5, 0x4a, 0x0d, 0x2d, 0xe5, 0x7a, 0x9f, 0x93, 0xc9, 0x9c, 0xef,
  0xa0, 0xe0, 0x3b, 0x4d, 0xae, 0x2a, 0xf5, 0xb0, 0xc8, 0xeb, 0xbb, 0x3c, 0x83, 0x53, 0x99, 0x61,
  0x17, 0x2b, 0x04, 0x7e, 0xba, 0x77, 0xd6, 0x26, 0xe1, 0x69, 0x14, 0x63, 0x55, 0x21, 0x0c, 0x7d
]

// AES轮密钥常数
const AES_RCON: u8[] = [0x01, 0x02, 0x04, 0x08, 0x10, 0x20, 0x40, 0x80, 0x1b, 0x36]

// AES S-box替换
function aesSubBytes(state: u8[]): u8[] {
  const result: u8[] = new Array<u8>(16)
  for (let i: i32 = 0; i < 16; i++) {
    result[i] = AES_SBOX[state[i]]
  }
  return result
}

// AES逆S-box替换
function aesInverseSubBytes(state: u8[]): u8[] {
  const result: u8[] = new Array<u8>(16)
  for (let i: i32 = 0; i < 16; i++) {
    result[i] = AES_INVERSE_SBOX[state[i]]
  }
  return result
}

// AES行移位
function aesShiftRows(state: u8[]): u8[] {
  const result: u8[] = new Array<u8>(16)
  
  // 第0行不移动
  result[0] = state[0]
  result[4] = state[4]
  result[8] = state[8]
  result[12] = state[12]
  
  // 第1行左移1位
  result[1] = state[5]
  result[5] = state[9]
  result[9] = state[13]
  result[13] = state[1]
  
  // 第2行左移2位
  result[2] = state[10]
  result[6] = state[14]
  result[10] = state[2]
  result[14] = state[6]
  
  // 第3行左移3位
  result[3] = state[15]
  result[7] = state[3]
  result[11] = state[7]
  result[15] = state[11]
  
  return result
}

// AES逆行移位
function aesInverseShiftRows(state: u8[]): u8[] {
  const result: u8[] = new Array<u8>(16)
  
  // 第0行不移动
  result[0] = state[0]
  result[4] = state[4]
  result[8] = state[8]
  result[12] = state[12]
  
  // 第1行右移1位
  result[1] = state[13]
  result[5] = state[1]
  result[9] = state[5]
  result[13] = state[9]
  
  // 第2行右移2位
  result[2] = state[10]
  result[6] = state[14]
  result[10] = state[2]
  result[14] = state[6]
  
  // 第3行右移3位
  result[3] = state[7]
  result[7] = state[11]
  result[11] = state[15]
  result[15] = state[3]
  
  return result
}

// AES有限域乘法 (GF(2^8))
function aesGaloisMultiply(a: u8, b: u8): u8 {
  let p: u8 = 0
  let hiBitSet: u8 = 0
  
  for (let i: i32 = 0; i < 8; i++) {
    if ((b & 1) == 1) {
      p ^= a
    }
    
    hiBitSet = a & 0x80
    a <<= 1
    if (hiBitSet == 0x80) {
      a ^= 0x1b // AES模数 x^8 + x^4 + x^3 + x + 1
    }
    b >>= 1
  }
  
  return p
}

// AES列混淆
function aesMixColumns(state: u8[]): u8[] {
  const result: u8[] = new Array<u8>(16)
  
  for (let i: i32 = 0; i < 4; i++) {
    const col: i32 = i * 4
    const a: u8 = state[col]
    const b: u8 = state[col + 1]
    const c: u8 = state[col + 2]
    const d: u8 = state[col + 3]
    
    result[col] = aesGaloisMultiply(0x02, a) ^ aesGaloisMultiply(0x03, b) ^ c ^ d
    result[col + 1] = a ^ aesGaloisMultiply(0x02, b) ^ aesGaloisMultiply(0x03, c) ^ d
    result[col + 2] = a ^ b ^ aesGaloisMultiply(0x02, c) ^ aesGaloisMultiply(0x03, d)
    result[col + 3] = aesGaloisMultiply(0x03, a) ^ b ^ c ^ aesGaloisMultiply(0x02, d)
  }
  
  return result
}

// AES逆列混淆
function aesInverseMixColumns(state: u8[]): u8[] {
  const result: u8[] = new Array<u8>(16)
  
  for (let i: i32 = 0; i < 4; i++) {
    const col: i32 = i * 4
    const a: u8 = state[col]
    const b: u8 = state[col + 1]
    const c: u8 = state[col + 2]
    const d: u8 = state[col + 3]
    
    result[col] = aesGaloisMultiply(0x0e, a) ^ aesGaloisMultiply(0x0b, b) ^ aesGaloisMultiply(0x0d, c) ^ aesGaloisMultiply(0x09, d)
    result[col + 1] = aesGaloisMultiply(0x09, a) ^ aesGaloisMultiply(0x0e, b) ^ aesGaloisMultiply(0x0b, c) ^ aesGaloisMultiply(0x0d, d)
    result[col + 2] = aesGaloisMultiply(0x0d, a) ^ aesGaloisMultiply(0x09, b) ^ aesGaloisMultiply(0x0e, c) ^ aesGaloisMultiply(0x0b, d)
    result[col + 3] = aesGaloisMultiply(0x0b, a) ^ aesGaloisMultiply(0x0d, b) ^ aesGaloisMultiply(0x09, c) ^ aesGaloisMultiply(0x0e, d)
  }
  
  return result
}

// AES密钥扩展
function aesKeyExpansion(key: u8[]): u8[][] {
  const roundKeys: u8[][] = new Array<u8[]>(11)
  const temp: u8[] = new Array<u8>(4)
  
  // 初始化轮密钥数组
  for (let i: i32 = 0; i < 11; i++) {
    roundKeys[i] = new Array<u8>(16)
  }
  
  // 复制原始密钥作为第一轮密钥
  for (let i: i32 = 0; i < 16; i++) {
    roundKeys[0][i] = key[i]
  }
  
  // 生成后续轮密钥
  for (let i: i32 = 1; i < 11; i++) {
    // 复制前一轮密钥的后4个字节
    for (let j: i32 = 0; j < 4; j++) {
      temp[j] = roundKeys[i - 1][j + 12]
    }
    
    // 每4个字节进行一次RotWord操作
    if (i % 4 == 0) {
      // RotWord
      const tempByte: u8 = temp[0]
      temp[0] = temp[1]
      temp[1] = temp[2]
      temp[2] = temp[3]
      temp[3] = tempByte
      
      // SubWord
      temp[0] = AES_SBOX[temp[0]]
      temp[1] = AES_SBOX[temp[1]]
      temp[2] = AES_SBOX[temp[2]]
      temp[3] = AES_SBOX[temp[3]]
      
      // Rcon
      temp[0] ^= AES_RCON[(i / 4) - 1]
    }
    
    // 生成当前轮密钥
    for (let j: i32 = 0; j < 4; j++) {
      for (let k: i32 = 0; k < 4; k++) {
        roundKeys[i][j * 4 + k] = roundKeys[i - 1][j * 4 + k] ^ temp[k]
      }
      // 更新temp用于下一轮计算
      if (j < 3) {
        for (let k: i32 = 0; k < 4; k++) {
          temp[k] = roundKeys[i][j * 4 + k]
        }
      }
    }
  }
  
  return roundKeys
}

// AES加密单轮操作
function aesEncryptRound(state: u8[], roundKey: u8[]): u8[] {
  // SubBytes
  let result: u8[] = aesSubBytes(state)
  
  // ShiftRows
  result = aesShiftRows(result)
  
  // MixColumns (最后一轮不执行)
  // 这里简化处理，假设不是最后一轮
  
  // AddRoundKey
  for (let i: i32 = 0; i < 16; i++) {
    result[i] ^= roundKey[i]
  }
  
  return result
}

// AES解密单轮操作
function aesDecryptRound(state: u8[], roundKey: u8[]): u8[] {
  // AddRoundKey
  let result: u8[] = new Array<u8>(16)
  for (let i: i32 = 0; i < 16; i++) {
    result[i] = state[i] ^ roundKey[i]
  }
  
  // InvMixColumns (第一轮不执行)
  // 这里简化处理，假设不是第一轮
  result = aesInverseMixColumns(result)
  
  // InvShiftRows
  result = aesInverseShiftRows(result)
  
  // InvSubBytes
  result = aesInverseSubBytes(result)
  
  return result
}

// AES加密实现
export function aesEncrypt(data: string, key: string): string {
  // 将输入数据和密钥转换为字节数组
  const dataBytes: u8[] = stringToBytes(data)
  const keyBytes: u8[] = stringToBytes(key)
  
  // 确保密钥长度为16字节
  let fixedKeyBytes: u8[] = new Array<u8>(16)
  for (let i: i32 = 0; i < 16; i++) {
    fixedKeyBytes[i] = i < keyBytes.length ? keyBytes[i] : 0
  }
  
  // 对数据进行PKCS#7填充
  const paddedData: u8[] = pkcs7Pad(dataBytes, 16)
  
  // 生成轮密钥
  const roundKeys: u8[][] = aesKeyExpansion(fixedKeyBytes)
  
  // 分块加密
  const encrypted: u8[] = new Array<u8>(paddedData.length)
  for (let i: i32 = 0; i < paddedData.length; i += 16) {
    // 初始化状态数组
    let state: u8[] = new Array<u8>(16)
    
    // 获取一个块
    for (let j: i32 = 0; j < 16; j++) {
      state[j] = i + j < paddedData.length ? paddedData[i + j] : 0
    }
    
    // 初始轮密钥加
    for (let j: i32 = 0; j < 16; j++) {
      state[j] ^= roundKeys[0][j]
    }
    
    // 9轮加密
    for (let round: i32 = 1; round < 10; round++) {
      // SubBytes
      state = aesSubBytes(state)
      
      // ShiftRows
      state = aesShiftRows(state)
      
      // MixColumns
      state = aesMixColumns(state)
      
      // AddRoundKey
      for (let j: i32 = 0; j < 16; j++) {
        state[j] ^= roundKeys[round][j]
      }
    }
    
    // 最后一轮（不进行MixColumns）
    state = aesSubBytes(state)
    state = aesShiftRows(state)
    for (let j: i32 = 0; j < 16; j++) {
      state[j] ^= roundKeys[10][j]
    }
    
    // 复制到结果数组
    for (let j: i32 = 0; j < 16 && i + j < encrypted.length; j++) {
      encrypted[i + j] = state[j]
    }
  }
  
  // 将加密结果转换为十六进制字符串
  let hexResult: string = ""
  for (let i: i32 = 0; i < encrypted.length; i++) {
    const hex: string = encrypted[i].toString(16)
    hexResult += hex.length == 1 ? "0" + hex : hex
  }
  
  return hexResult
}

// AES解密实现
export function aesDecrypt(encryptedData: string, key: string): string {
  // 检查输入数据长度是否为偶数
  if (encryptedData.length % 2 != 0) {
    return "" // 返回空字符串表示解密失败
  }
  
  // 将十六进制字符串转换为字节数组
  const encryptedBytes: u8[] = new Array<u8>(encryptedData.length / 2)
  for (let i: i32 = 0; i < encryptedData.length; i += 2) {
    const hexByte: string = encryptedData.substring(i, i + 2)
    encryptedBytes[i / 2] = <u8>parseInt(hexByte, 16)
  }
  
  const keyBytes: u8[] = stringToBytes(key)
  
  // 确保密钥长度为16字节
  let fixedKeyBytes: u8[] = new Array<u8>(16)
  for (let i: i32 = 0; i < 16; i++) {
    fixedKeyBytes[i] = i < keyBytes.length ? keyBytes[i] : 0
  }
  
  // 生成轮密钥
  const roundKeys: u8[][] = aesKeyExpansion(fixedKeyBytes)
  
  // 分块解密
  const decrypted: u8[] = new Array<u8>(encryptedBytes.length)
  for (let i: i32 = 0; i < encryptedBytes.length; i += 16) {
    // 初始化状态数组
    let state: u8[] = new Array<u8>(16)
    
    // 获取一个块
    for (let j: i32 = 0; j < 16; j++) {
      state[j] = i + j < encryptedBytes.length ? encryptedBytes[i + j] : 0
    }
    
    // 初始轮密钥加
    for (let j: i32 = 0; j < 16; j++) {
      state[j] ^= roundKeys[10][j]
    }
    
    // 9轮解密
    for (let round: i32 = 9; round >= 1; round--) {
      // InvShiftRows
      state = aesInverseShiftRows(state)
      
      // InvSubBytes
      state = aesInverseSubBytes(state)
      
      // AddRoundKey
      for (let j: i32 = 0; j < 16; j++) {
        state[j] ^= roundKeys[round][j]
      }
      
      // InvMixColumns
      state = aesInverseMixColumns(state)
    }
    
    // 最后一轮（不进行InvMixColumns）
    state = aesInverseShiftRows(state)
    state = aesInverseSubBytes(state)
    for (let j: i32 = 0; j < 16; j++) {
      state[j] ^= roundKeys[0][j]
    }
    
    // 复制到结果数组
    for (let j: i32 = 0; j < 16 && i + j < decrypted.length; j++) {
      decrypted[i + j] = state[j]
    }
  }
  
  // PKCS#7去填充
  const unpaddedData: u8[] = pkcs7Unpad(decrypted)
  
  // 将解密结果转换为字符串
  return bytesToString(unpaddedData)
}

// 生成随机密钥
function generateRandomKey(length: i32): string {
  let key = "";
  for (let i: i32 = 0; i < length; i++) {
    // 使用简单的伪随机数生成器
    const randomByte = <u8>(Math.random() * 256);
    key += String.fromCharCode(randomByte);
  }
  return key;
}

// WASM版本的uu2函数实现
export function uu2_wasm(requestData: string, requestUrl: string, configOpenStr: string, codecRequestKey: string): string {
  // 检查是否开启加密
  const configOpen = configOpenStr === "true";
  
  // 如果未开启加密，直接返回原始请求数据
  if (!configOpen) {
    return requestData;
  }
  
  // 检查请求URL是否为SETTING_PATH，如果是则不加密
  if (requestUrl === SETTING_PATH) {
    return requestData;
  }
  
  // 生成随机密钥用于加密请求数据
  const randomKey = generateRandomKey(16); // 16字节随机密钥
  
  // 使用SM4加密请求数据
  const encryptedData = sm4Encrypt(requestData, randomKey);
  
  // 使用配置的密钥加密随机密钥
  const encryptedRandomKey = sm4Encrypt(randomKey, codecRequestKey);
  
  // 返回加密后的数据和加密后的随机密钥
  // 这里返回一个包含加密数据和加密密钥的JSON对象
  return `{"data":"${encryptedData}","key":"${encryptedRandomKey}"}`;
}

// WASM版本的uu1函数实现
export function uu1_wasm(statusStr: string, responseData: string, originKey: string, timestamp: string): string {
  // 添加参数检查
  if (statusStr === null) statusStr = "";
  if (responseData === null) responseData = "";
  if (originKey === null) originKey = "";
  if (timestamp === null) timestamp = "";
  
  // 检查状态是否为200
  if (statusStr !== "200") {
    return responseData;
  }
  
  // 检查responseData是否为空
  if (responseData.length === 0) {
    return responseData;
  }
  
  // 限制responseData长度以避免内存问题
  const maxDataLength: i32 = 50000; // 限制最大处理长度
  if (responseData.length > maxDataLength) {
    responseData = responseData.substring(0, maxDataLength);
  }
  
  // 解析responseData，提取data字段
  let dataValue = "";
  // 检查responseData是否为对象结构{'data': xx}
  const dataIndex = responseData.indexOf('"data":');
  if (dataIndex !== -1) {
    // 查找data字段的值
    let dataValueStart = responseData.indexOf('"', dataIndex + 7); // 跳过'"data":'
    if (dataValueStart !== -1) {
      dataValueStart++; // 跳过开始的引号
      
      // 确保dataValueStart不会越界
      if (dataValueStart < responseData.length) {
        let dataValueEnd = responseData.length - 1;
        // 查找结束引号
        for (let i = dataValueStart; i < responseData.length; i++) {
          // 确保索引不会越界
          if (i >= responseData.length) break;
          
          if (responseData.charCodeAt(i) === 34) { // 34是双引号的ASCII码
            // 检查是否是转义的引号
            if (i > 0 && responseData.charCodeAt(i - 1) !== 92) { // 92是反斜杠的ASCII码
              dataValueEnd = i;
              break;
            }
          }
        }
        
        // 检查是否找到了有效的数据范围
        if (dataValueStart < dataValueEnd) {
          // 确保数据范围不会越界
          if (dataValueEnd >= responseData.length) {
            dataValueEnd = responseData.length - 1;
          }
          
          // 提取data字段的值
          dataValue = responseData.substring(dataValueStart, dataValueEnd);
        }
      }
    }
  } else {
    // 如果没有找到"data"字段，直接使用整个responseData
    dataValue = responseData;
  }
  
  // 检查dataValue是否为空
  if (dataValue.length === 0) {
    return responseData;
  }
  
  // 限制dataValue长度以避免内存问题
  const maxDataValueLength: i32 = 20000; // 限制最大处理长度
  if (dataValue.length > maxDataValueLength) {
    dataValue = dataValue.substring(0, maxDataValueLength);
  }
  
  // 检查数据是否以"02"开头
  if (dataValue.length < 2 || dataValue.substring(0, 2) !== "02") {
    return responseData;
  }
  
  // 检查originKey是否存在
  if (originKey.length === 0) {
    return responseData;
  }
  
  // 限制originKey长度以避免内存问题
  const maxKeyLength: i32 = 1000; // 限制最大处理长度
  let processedOriginKey = originKey;
  if (originKey.length > maxKeyLength) {
    processedOriginKey = originKey.substring(0, maxKeyLength);
  }
  
  // 限制timestamp长度
  let processedTimestamp = timestamp;
  if (timestamp.length > maxKeyLength) {
    processedTimestamp = timestamp.substring(0, maxKeyLength);
  }
  
  // 使用AES解密originKey
  const decryptedOriginKey = aesDecrypt(processedOriginKey, processedTimestamp);
  
  // 从dataValue中提取加密数据（跳过前8个字符和后4个字符）
  if (dataValue.length <= 12) { // 8 + 4 = 12
    return responseData;
  }
  
  const encryptedData = dataValue.substring(8, dataValue.length - 4);
  
  // 检查encryptedData是否为空
  if (encryptedData.length === 0) {
    return responseData;
  }
  
  // 限制encryptedData长度以避免内存问题
  const maxEncryptedLength: i32 = 20000; // 限制最大处理长度
  let processedEncryptedData = encryptedData;
  if (encryptedData.length > maxEncryptedLength) {
    processedEncryptedData = encryptedData.substring(0, maxEncryptedLength);
  }
  
  // 使用SM2解密数据（这里使用SM4模拟，因为AssemblyScript中没有SM2实现）
  // 在实际应用中，这里应该使用SM2解密
  const decryptedData = sm4Decrypt(processedEncryptedData, decryptedOriginKey);
  
  // 返回解密后的数据
  return decryptedData;
}

// Storage Key加密函数
export function encryptStorageKey(key: string, systemCode: string): string {
  // 不再加密key，直接返回原始key
  return key;
}

// Storage Value加密函数
export function encryptStorageValue(value: string, key: string, systemCode: string, storageKey: string, storageEncode: string): string {
  // 根据storageEncode决定加密方式
  if (storageEncode === "SM4") {
    // 使用SM4加密value，密钥为key
    return sm4Encrypt(value, key);
  } else if (storageEncode === "AES") {
    // 使用AES加密value，密钥为key
    return aesEncrypt(value, key);
  } else {
    // 默认使用SM4加密
    return sm4Encrypt(value, key);
  }
}

// Storage Value解密函数
export function decryptStorageValue(value: string, key: string, systemCode: string, storageKey: string, storageEncode: string): string {
  // 根据storageEncode决定解密方式
  if (storageEncode === "SM4") {
    // 使用SM4解密value，密钥为key
    return sm4Decrypt(value, key);
  } else if (storageEncode === "AES") {
    // 使用AES解密value，密钥为key
    return aesDecrypt(value, key);
  } else {
    // 默认使用SM4解密
    return sm4Decrypt(value, key);
  }
}

// MD5哈希函数实现
export function md5Hash(input: string): string {
  // 简化的MD5实现，实际应用中需要完整的MD5算法
  // 这里仅作示意，返回输入字符串的简单哈希
  
  let hash: i32 = 0;
  if (input.length === 0) return hash.toString(16);
  
  // 限制输入长度以避免潜在的内存问题
  const maxLength: i32 = 10000; // 限制最大处理长度
  const len: i32 = input.length < maxLength ? input.length : maxLength;
  
  // 添加额外的安全检查
  if (len <= 0) return hash.toString(16);
  
  for (let i: i32 = 0; i < len; i++) {
    // 确保索引不会越界
    if (i >= input.length) break;
    
    const char: i32 = input.charCodeAt(i);
    // 确保字符码不会导致溢出
    if (char >= 0 && char <= 0x10FFFF) {
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 转换为32位整数
    }
  }
  
  // 确保返回正数
  const result: i32 = hash & 0x7FFFFFFF; // 确保是正数
  return result.toString(16);
}

// 生成签名函数
export function generateSign(paramsJson: string, timestamp: i64, nonce: string, secretKey: string): string {
  // 添加参数检查
  if (paramsJson === null) paramsJson = "";
  if (nonce === null) nonce = "";
  if (secretKey === null) secretKey = "";
  
  // 将所有参数拼接成一个字符串
  let signString = paramsJson + timestamp.toString() + nonce + secretKey;
  
  // 限制签名字符串长度以避免内存问题
  const maxSignLength: i32 = 20000;
  if (signString.length > maxSignLength) {
    signString = signString.substring(0, maxSignLength);
  }
  
  // 使用MD5哈希生成签名
  return md5Hash(signString);
}

// 简单的加法函数
// This function is used in the HTML demo and should not be optimized away
export function add(a: i32, b: i32): i32 {
  // Ensure this function is not optimized away
  if (a == 0 && b == 0) return 0;
  return a + b;
}

// 生成nonce函数
export function generateNonce(): string {
  // 生成一个随机的nonce值
  // 使用当前时间戳作为种子
  const timestamp = Date.now();
  
  // 生成一个基于时间戳的随机字符串
  let nonce = "";
  let temp: i64 = timestamp;
  
  // 将时间戳转换为一个字符串
  for (let i: i32 = 0; i < 16; i++) {
    // 使用简单的伪随机数生成器
    temp = (temp * 1103515245 + 12345) & 0x7fffffff;
    const randomChar: i32 = i32(temp % 26) + 97; // 生成a-z的字符
    nonce += String.fromCharCode(randomChar);
  }
  
  return nonce;
}
