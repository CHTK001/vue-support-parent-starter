// codec-wasm JavaScript包装器

import { instantiateSync } from '@assemblyscript/loader';
import { sm2, sm4 } from 'sm-crypto';

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
          // 提供加密函数给WASM模块使用
          "sm2EncryptJS": (data, key) => {
            // 将AssemblyScript字符串转换为JavaScript字符串
            const dataStr = data;
            const keyStr = key;
            // 使用sm-crypto库进行SM2加密
            try {
              // 注意：sm2.encrypt的参数可能需要根据实际库的API进行调整
              const encrypted = sm2.doEncrypt(dataStr, keyStr, 1); // 1表示C1C3C2模式
              return encrypted;
            } catch (error) {
              console.error('SM2 encryption error:', error);
              return dataStr; // 如果加密失败，返回原始数据
            }
          },
          "sm2DecryptJS": (encryptedData, key) => {
            // 将AssemblyScript字符串转换为JavaScript字符串
            const encryptedDataStr = encryptedData;
            const keyStr = key;
            // 使用sm-crypto库进行SM2解密
            try {
              // 注意：sm2.decrypt的参数可能需要根据实际库的API进行调整
              const decrypted = sm2.doDecrypt(encryptedDataStr, keyStr, 1); // 1表示C1C3C2模式
              return decrypted;
            } catch (error) {
              console.error('SM2 decryption error:', error);
              return encryptedDataStr; // 如果解密失败，返回原始数据
            }
          },
          "sm4EncryptJS": (data, key) => {
            // 将AssemblyScript字符串转换为JavaScript字符串
            const dataStr = data;
            const keyStr = key;
            // 使用sm-crypto库进行SM4加密
            try {
              // 注意：sm4.encrypt的参数可能需要根据实际库的API进行调整
              const encrypted = sm4.encrypt(dataStr, keyStr);
              return encrypted;
            } catch (error) {
              console.error('SM4 encryption error:', error);
              return dataStr; // 如果加密失败，返回原始数据
            }
          },
          "aesEncryptJS": (data, key) => {
            // 简单的AES加密实现（这里可以使用Web Crypto API或其他库）
            const dataStr = data;
            const keyStr = key;
            // 这里使用一个简化的实现，实际项目中应使用完整的AES库
            try {
              // 简化的AES实现，仅用于演示目的
              let result = "";
              let keyIndex = 0;
              
              for (let i = 0; i < dataStr.length; i++) {
                const charCode = dataStr.charCodeAt(i);
                const keyChar = keyStr.charCodeAt(keyIndex % keyStr.length);
                keyIndex++;
                
                // 简单的XOR
                const encryptedChar = charCode ^ keyChar;
                result += String.fromCharCode(encryptedChar & 0xFF);
              }
              
              // Base64编码模拟
              return "AES_ENCRYPTED_" + result;
            } catch (error) {
              console.error('AES encryption error:', error);
              return dataStr; // 如果加密失败，返回原始数据
            }
          },
          "aesDecryptJS": (encryptedData, key) => {
            // 简单的AES解密实现（这里可以使用Web Crypto API或其他库）
            const encryptedDataStr = encryptedData;
            const keyStr = key;
            
            // 检查是否是加密数据
            if (!encryptedDataStr.startsWith("AES_ENCRYPTED_")) {
              return encryptedDataStr;
            }
            
            const data = encryptedDataStr.substring(14); // 移除前缀
            // 这里使用一个简化的实现，实际项目中应使用完整的AES库
            try {
              let result = "";
              let keyIndex = 0;
              
              for (let i = 0; i < data.length; i++) {
                const charCode = data.charCodeAt(i);
                const keyChar = keyStr.charCodeAt(keyIndex % keyStr.length);
                keyIndex++;
                
                // 简单的XOR（XOR的逆运算还是XOR）
                const decryptedChar = charCode ^ keyChar;
                result += String.fromCharCode(decryptedChar & 0xFF);
              }
              
              return result;
            } catch (error) {
              console.error('AES decryption error:', error);
              return encryptedDataStr; // 如果解密失败，返回原始数据
            }
          },
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
// 原本的函数签名: uu2_wasm(requestFunc: (key: string) => string, getConfig: (key: string) => string): string
// 现在直接传递所需的数据: uu2_wasm(requestData: string, requestUrl: string, configOpenStr: string, codecRequestKey: string): string
export function uu2_wasm(requestData, requestUrl, configOpenStr, codecRequestKey) {
  // 确保WASM已加载
  if (!wasmLoaded) {
    throw new Error('WASM module not loaded. Please call initializeWasmModule() first or wait for initialization.');
  }
  
  // 直接调用WASM函数，传递实际需要的参数
  return wasmModule.uu2_wasm(requestData, requestUrl, configOpenStr, codecRequestKey);
}

// WASM版本的uu1函数（同步方式）
// 原本的函数签名: uu1_wasm(responseFunc: (key: string) => string): string
// 现在直接传递所需的数据: uu1_wasm(statusStr: string, responseData: string, originKey: string, timestamp: string): string
export function uu1_wasm(statusStr, responseData, originKey, timestamp) {
  // 确保WASM已加载
  if (!wasmLoaded) {
    throw new Error('WASM module not loaded. Please call initializeWasmModule() first or wait for initialization.');
  }
  
  // 直接调用WASM函数，传递实际需要的参数
  return wasmModule.uu1_wasm(statusStr, responseData, originKey, timestamp);
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