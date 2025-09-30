// codec-wasm JavaScript包装器

import { instantiateSync } from '@assemblyscript/loader';
import smCrypto from 'sm-crypto';

const { sm2, sm4 } = smCrypto;

let wasmModule = null;
let wasmLoaded = false;

// 异步加载WASM模块
async function loadWasmAsync() {
  if (wasmLoaded) {
    return wasmModule;
  }

  try {
    // 异步方式加载WASM模块
    if (typeof window !== 'undefined' || typeof importScripts !== 'undefined') {
      // 浏览器或Web Worker环境
      // 构建正确的WASM文件URL
      const wasmUrl = new URL('../build/release.wasm', import.meta.url).href;
      
      // 使用fetch API获取wasm文件的二进制数据
      const response = await fetch(wasmUrl);
      if (!response.ok) {
        throw new Error('Failed to load WASM file, status: ' + response.status + ', URL: ' + wasmUrl);
      }
      
      // 获取二进制数据
      const wasmBytes = new Uint8Array(await response.arrayBuffer());
      
      // 检查WASM文件的魔数 (00 61 73 6d)
      if (wasmBytes.length < 4) {
        throw new Error('Invalid WASM file: response too short');
      }
      
      const magic = wasmBytes[0] + (wasmBytes[1] << 8) + (wasmBytes[2] << 16) + (wasmBytes[3] << 24);
      if (magic !== 0x6d736100) { // 0x6d736100 is the little-endian representation of "asm\0"
        console.error('Invalid WASM file magic number. First 4 bytes:', 
          Array.from(wasmBytes.slice(0, 4)).map(b => b.toString(16).padStart(2, '0')).join(' '));
        throw new Error('Invalid WASM file: wrong magic number. Got: ' + magic.toString(16));
      }
      
      // 定义WASM模块需要的导入对象
      const imports = {
        env: {
          // 提供Date.now函数给WASM模块使用
          "Date.now": () => Date.now(),
          // 可以根据需要添加其他环境函数
          abort: (message, fileName, lineNumber, columnNumber) => {
            console.error(`Abort called: ${message} at ${fileName}:${lineNumber}:${columnNumber}`);
          }
        }
      };
      
      // 异步实例化WASM模块
      const wasm = instantiateSync(wasmBytes, imports);
      wasmModule = wasm.exports; // 获取WASM导出的函数
      wasmLoaded = true;
      console.log('Codec WASM module loaded successfully from:', wasmUrl);
      return wasmModule;
    } else {
      // Node.js环境
      throw new Error('Node.js environment not supported');
    }
  } catch (error) {
    console.error('Failed to load WASM module:', error);
    throw new Error('Failed to load codec WASM module: ' + error.message);
  }
}

// 异步初始化函数（用于应用启动时加载）
export async function initializeWasmModule() {
  if (wasmLoaded) {
    return true;
  }

  await loadWasmAsync();
  return true;
}

// 检查WASM是否已加载
export function isWasmLoaded() {
  return wasmLoaded;
}

// WASM版本的uu2函数（同步方式）
// 修改函数签名: 接收PureHttpRequestConfig对象，而不是分别传入各个参数
export function uu2_wasm(request) {
  // 确保WASM已加载
  if (!wasmLoaded) {
    throw new Error('WASM module not loaded. Please call initializeWasmModule() first or wait for initialization.');
  }
  
  // 检查请求对象是否存在
  if (!request) {
    throw new Error('Request object is required');
  }
  
  // 从配置判断是否开启加密
  const configOpen = getConfig('requestCodecOpen') === true;
  
  // 如果未开启加密，直接返回原始请求对象
  if (!configOpen) {
    return request;
  }
  
  // 检查请求方法，只处理GET和JSON请求，不处理表单
  const method = (request.method || '').toUpperCase();
  const isGetRequest = method === 'GET';
  const contentType = request.headers && request.headers['Content-Type'];
  const isJsonRequest = contentType && contentType.includes('application/json');
  
  // 如果不是GET请求也不是JSON请求，则不处理
  if (!isGetRequest && !isJsonRequest) {
    return request;
  }
  
  // 提取请求数据
  const requestData = typeof request.data === 'string' ? request.data : JSON.stringify(request.data);
  const requestUrl = request.url || '';
  const configOpenStr = getConfig('requestCodecOpen') === true ? "true" : "false";
  const codecRequestKey = getConfig('codecRequestKey') || '';
  
  // 调用WASM函数处理加密数据
  try {
    const encryptedData = wasmModule.uu2_wasm(requestData, requestUrl, configOpenStr, codecRequestKey);
    
    // 将加密后的数据替换到request.data中
    request.data = encryptedData;
    
    // 添加加密密钥到header中
    if (!request.headers) {
      request.headers = {};
    }
    
    // 这里需要实现SM4对称加密逻辑，生成随机密钥并加密
    // 由于加密逻辑应该在WASM中实现，这里只是一个占位符
    // 实际实现应该调用WASM中的加密函数
    
    // 返回修改后的请求对象
    return request;
  } catch (error) {
    console.error('WASM encryption failed:', error);
    // 如果加密失败，返回原始请求
    return request;
  }
}

// 添加getConfig函数的实现
function getConfig(key) {
  // 在浏览器环境中，从全局配置获取
  if (typeof window !== 'undefined' && window.__APP_CONFIG__) {
    return window.__APP_CONFIG__[key];
  }
  // 如果没有全局配置，返回默认值或undefined
  return undefined;
}

// WASM版本的uu1函数（同步方式）
// 修改函数签名: 接收PureHttpResponse对象，而不是分别传入各个参数
export function uu1_wasm(response) {
  // 确保WASM已加载
  if (!wasmLoaded) {
    throw new Error('WASM module not loaded. Please call initializeWasmModule() first or wait for initialization.');
  }
  
  // 检查响应对象是否存在
  if (!response) {
    throw new Error('Response object is required');
  }
  
  // 检查响应头中是否包含originKey
  const headers = response.headers || {};
  const originKey = headers[ORIGIN_KEY_HEADER] || '';
  
  // 如果不包含originKey，直接返回原始响应
  if (!originKey) {
    return response;
  }
  
  // 包含originKey，说明是加密数据，需要处理
  const statusStr = response.status?.toString() || '0';
  
  // 获取时间戳
  const timestamp = headers[TIMESTAMP_HEADER] || '';
  
  // 调用WASM函数处理加密数据
  try {
    // 从response.data中提取需要解密的数据（response.data一定是对象，结构是{'data': xx}）
    let dataToDecrypt = '';
    if (response.data && typeof response.data === 'object' && 'data' in response.data) {
      dataToDecrypt = response.data.data;
    }
    
    // 对xx部分进行解密
    const decryptedData = wasmModule.uu1_wasm(statusStr, dataToDecrypt, originKey, timestamp);
    
    // 将解密后的数据替换到response.data中
    response.data = decryptedData;
    
    // 删除相关的header数据
    delete headers[ORIGIN_KEY_HEADER];
    delete headers[TIMESTAMP_HEADER];
    delete headers[NONCE_HEADER];
    
    // 返回修改后的响应对象
    return response;
  } catch (error) {
    console.error('WASM decryption failed:', error);
    // 如果解密失败，返回原始响应
    return response;
  }
}

// WASM版本的uu3函数（同步方式）
// 原本的函数签名: uu3_wasm(value: string, getConfig: (key: string) => string): string
// 现在直接传递所需的数据: uu3_wasm(value: string, codecResponseKey: string): string
export function uu3_wasm(value, codecResponseKey) {
  // 确保WASM已加载
  if (!wasmLoaded) {
    throw new Error('WASM module not loaded. Please call initializeWasmModule() first or wait for initialization.');
  }
  
  // 直接调用WASM函数，传递实际需要的参数
  return wasmModule.uu3_wasm(value, codecResponseKey);
}

// WASM版本的uu4函数（同步方式）
// 原本的函数签名: uu4_wasm(responseFunc: (key: string) => string): string
// 现在直接传递所需的数据: uu4_wasm(responseData: string, uuid: string, timestamp: string): string
export function uu4_wasm(responseData, uuid, timestamp) {
  // 确保WASM已加载
  if (!wasmLoaded) {
    throw new Error('WASM module not loaded. Please call initializeWasmModule() first or wait for initialization.');
  }
  
  // 直接调用WASM函数，传递实际需要的参数
  return wasmModule.uu4_wasm(responseData, uuid, timestamp);
}

// 导出WASM模块的其他函数（同步方式）
export function getCurrentTimestamp() {
  // 确保WASM已加载
  if (!wasmLoaded) {
    throw new Error('WASM module not loaded. Please call initializeWasmModule() first or wait for initialization.');
  }
  return wasmModule.getCurrentTimestamp();
}

export function add(a, b) {
  // 确保WASM已加载
  if (!wasmLoaded) {
    throw new Error('WASM module not loaded. Please call initializeWasmModule() first or wait for initialization.');
  }
  return wasmModule.add(a, b);
}

// 导出generateNonce函数（同步方式）
export function generateNonce() {
  // 确保WASM已加载
  if (!wasmLoaded) {
    throw new Error('WASM module not loaded. Please call initializeWasmModule() first or wait for initialization.');
  }
  return wasmModule.generateNonce();
}

// 导出MD5哈希函数（同步方式）
export function md5Hash(input) {
  // 确保WASM已加载
  if (!wasmLoaded) {
    throw new Error('WASM module not loaded. Please call initializeWasmModule() first or wait for initialization.');
  }
  return wasmModule.md5Hash(input);
}

// 导出generateSign函数（同步方式）
export function generateSign(paramsJson, timestamp, nonce, secretKey) {
  // 确保WASM已加载
  if (!wasmLoaded) {
    throw new Error('WASM module not loaded. Please call initializeWasmModule() first or wait for initialization.');
  }
  // 将timestamp从number转换为bigint以匹配AssemblyScript的i64类型
  return wasmModule.generateSign(paramsJson, BigInt(timestamp), nonce, secretKey);
}

// 导出processRequest函数（同步方式）
export function processRequest(requestData, requestUrl, codecConfig, codecKey) {
  // 确保WASM已加载
  if (!wasmLoaded) {
    throw new Error('WASM module not loaded. Please call initializeWasmModule() first or wait for initialization.');
  }
  return wasmModule.processRequest(requestData, requestUrl, codecConfig, codecKey);
}

// 导出processResponse函数（同步方式）
export function processResponse(responseData, originKey, timestamp) {
  // 确保WASM已加载
  if (!wasmLoaded) {
    throw new Error('WASM module not loaded. Please call initializeWasmModule() first or wait for initialization.');
  }
  return wasmModule.processResponse(responseData, originKey, timestamp);
}

// 导出AES加密函数（同步方式）
export function encryptAES(data, key) {
  // 确保WASM已加载
  if (!wasmLoaded) {
    throw new Error('WASM module not loaded. Please call initializeWasmModule() first or wait for initialization.');
  }
  return wasmModule.encryptAES(data, key);
}

// 导出AES解密函数（同步方式）
export function decryptAES(value, key) {
  // 确保WASM已加载
  if (!wasmLoaded) {
    throw new Error('WASM module not loaded. Please call initializeWasmModule() first or wait for initialization.');
  }
  return wasmModule.decryptAES(value, key);
}

// Storage Key加密函数（同步方式）
export function encryptStorageKey(key, systemCode) {
  // 确保WASM已加载
  if (!wasmLoaded) {
    throw new Error('WASM module not loaded. Please call initializeWasmModule() first or wait for initialization.');
  }
  return wasmModule.encryptStorageKey(key, systemCode);
}

// Storage Value加密函数（同步方式）
export function encryptStorageValue(value, key, systemCode, storageKey, storageEncode) {
  // 确保WASM已加载
  if (!wasmLoaded) {
    throw new Error('WASM module not loaded. Please call initializeWasmModule() first or wait for initialization.');
  }
  return wasmModule.encryptStorageValue(value, key, systemCode, storageKey, storageEncode);
}

// Storage Value解密函数（同步方式）
export function decryptStorageValue(value, key, systemCode, storageKey, storageEncode) {
  // 确保WASM已加载
  if (!wasmLoaded) {
    throw new Error('WASM module not loaded. Please call initializeWasmModule() first or wait for initialization.');
  }
  return wasmModule.decryptStorageValue(value, key, systemCode, storageKey, storageEncode);
}

// 在文件顶部添加常量定义
const ORIGIN_KEY_HEADER = 'access-control-origin-key';
const TIMESTAMP_HEADER = 'access-control-timestamp-user';
const NONCE_HEADER = 'access-control-nonce';
const DATA_FIELD = 'data';
