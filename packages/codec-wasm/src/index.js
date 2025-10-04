// codec-wasm JavaScript包装器

// 引入sm-crypto库
import * as smCrypto from 'sm-crypto';

let wasmModule = null;
let wasmLoaded = false;
let wasmModuleInstance = null;

// 字符串编码和解码工具
const encoder = new TextEncoder();
const decoder = new TextDecoder();

// 内存管理函数
let allocFunction = null;
let deallocFunction = null;

// 将字符串转换为WASM内存中的指针
function stringToWasm(str) {
  // 检查WASM模块是否已加载
  if (!wasmModuleInstance) {
    throw new Error('WASM module instance is not available');
  }
  
  // 检查是否有alloc函数（Rust版本）
  if (allocFunction) {
    // 使用WASM的alloc函数
    const bytes = encoder.encode(str);
    const ptr = allocFunction(bytes.length);
    const memory = new Uint8Array(wasmModuleInstance.memory.buffer, ptr, bytes.length);
    memory.set(bytes);
    return { ptr, len: bytes.length };
  } 
  // 检查是否有__new函数（AssemblyScript版本）
  else if (typeof wasmModuleInstance.__new === 'function') {
    // 使用AssemblyScript的内存管理
    const bytes = encoder.encode(str);
    const ptr = wasmModuleInstance.__new(bytes.length, 1); // 1表示字符串类型
    const memory = new Uint8Array(wasmModuleInstance.memory.buffer, ptr, bytes.length);
    memory.set(bytes);
    return { ptr, len: bytes.length };
  } else {
    // 如果没有内存管理函数，抛出错误
    throw new Error('WASM module does not export memory management functions');
  }
}

// 从WASM内存中读取字符串（改进处理）
function stringFromWasm(ptr) {
  if (ptr === 0) {
    return '';
  }
  
  // 检查是否有__getString函数（AssemblyScript生成的字符串获取函数）
  if (wasmModuleInstance.__getString) {
    try {
      return wasmModuleInstance.__getString(ptr);
    } catch (error) {
      console.error('Error calling __getString:', error);
    }
  } else if (wasmModuleInstance.__getstr) {
    try {
      return wasmModuleInstance.__getstr(ptr);
    } catch (error) {
      console.error('Error calling __getstr:', error);
    }
  } else {
    // 尝试从内存中读取以null结尾的字符串
    try {
      const memory = new Uint8Array(wasmModuleInstance.memory.buffer);
      let end = ptr;
      
      // 查找字符串结束位置（遇到null字符或超出合理范围）
      while (end < memory.length && memory[end] !== 0 && (end - ptr) < 10000) {
        end++;
      }
      
      // 确保不会读取超出分配的内存范围
      const bytes = memory.subarray(ptr, end);
      let result = decoder.decode(bytes);
      
      return result;
    } catch (error) {
      console.error('Error reading string from WASM memory:', error);
      return '';
    }
  }
  return '';
}

// 异步加载WASM模块
async function loadWasmAsync() {
  if (wasmLoaded) {
    return wasmModuleInstance;
  }

  try {
    // 直接加载WASM文件
    const wasmUrl = new URL('../build/codec_wasm.wasm', import.meta.url);
    console.log('Loading WASM from:', wasmUrl.toString());
    
    const response = await fetch(wasmUrl);
    console.log('Fetch response status:', response.status);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch WASM file: ${response.status} ${response.statusText}`);
    }
    
    const wasmBytes = await response.arrayBuffer();
    console.log('WASM file size:', wasmBytes.byteLength, 'bytes');
    
    // 检查是否是有效的WASM文件（应该以0x00 0x61 0x73 0x6d开头）
    const header = new Uint8Array(wasmBytes, 0, 4);
    console.log('WASM header:', header);
    
    if (header[0] !== 0x00 || header[1] !== 0x61 || header[2] !== 0x73 || header[3] !== 0x6d) {
      throw new Error('Invalid WASM file: missing magic number');
    }
    
    // 创建导入对象（如果WASM模块需要导入）
    const imports = {
      env: {
        // 内存对象
        memory: new WebAssembly.Memory({ initial: 256 }),
        // 如果需要其他导入函数，可以在这里添加
        abort: () => {
          console.error('WASM abort called');
        },
        // 添加seed函数
        seed: () => {
          // 返回一个随机数作为种子
          return Math.floor(Math.random() * 2147483647);
        },
        // 添加Date.now函数
        "Date.now": () => {
          return Date.now();
        }
      }
    };
    
    // 尝试实例化WASM模块
    const wasmModule = await WebAssembly.instantiate(wasmBytes, imports);
    
    // 获取WASM实例的导出函数
    const { exports } = wasmModule.instance || wasmModule;
    
    // 保存WASM模块实例
    wasmModuleInstance = exports;
    wasmLoaded = true;
    
    // 检查并保存内存管理函数
    if (typeof exports.alloc === 'function') {
      allocFunction = exports.alloc;
    }
    if (typeof exports.dealloc === 'function') {
      deallocFunction = exports.dealloc;
    }
    
    console.log('Codec WASM module loaded successfully');
    console.log('WASM exports:', Object.keys(exports));
    return exports;
  } catch (error) {
    console.error('Failed to load WASM module:', error);
    throw new Error('Failed to load codec WASM module: ' + error.message);
  }
}

// 异步初始化函数（用于应用启动时加载）
export async function initializeWasmModule() {
  if (wasmLoaded) {
    return wasmModuleInstance;
  }

  await loadWasmAsync();
  return wasmModuleInstance;
}

// 检查WASM是否已加载
export function isWasmLoaded() {
  return wasmLoaded;
}

// getCurrentTimestamp函数
export function getCurrentTimestamp() {
  if (!wasmLoaded) {
    // 如果WASM未加载，使用JavaScript实现
    return Date.now();
  }
  
  if (wasmModuleInstance.get_current_timestamp) {
    return wasmModuleInstance.get_current_timestamp();
  } else {
    // 如果WASM函数不存在，使用JavaScript实现
    return Date.now();
  }
}

// add函数
export function add(a, b) {
  if (!wasmLoaded) {
    // 如果WASM未加载，使用JavaScript实现
    return a + b;
  }
  
  if (wasmModuleInstance.add) {
    return wasmModuleInstance.add(a, b);
  } else {
    // 如果WASM函数不存在，使用JavaScript实现
    return a + b;
  }
}

// generateNonce函数
export function generateNonce() {
  if (!wasmLoaded) {
    // 如果WASM未加载，使用JavaScript实现
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }
  
  if (wasmModuleInstance.generate_nonce) {
    return wasmModuleInstance.generate_nonce();
  } else if (wasmModuleInstance.generateNonce) {
    // AssemblyScript版本
    try {
      const resultPtr = wasmModuleInstance.generateNonce();
      return stringFromWasm(resultPtr);
    } catch (error) {
      console.error('WASM generateNonce failed:', error);
    }
  }
  
  // 如果WASM函数不存在或失败，使用JavaScript实现
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// md5Hash函数
export function md5Hash(data) {
  if (!wasmLoaded) {
    throw new Error('WASM module not loaded. Please call initializeWasmModule() first or wait for initialization.');
  }
  
  if (wasmModuleInstance.md5Hash) {
    try {
      // 将字符串转换为WASM内存中的指针
      const dataObj = stringToWasm(data);
      
      // 调用WASM函数
      const resultPtr = wasmModuleInstance.md5Hash(dataObj.ptr);
      
      // 从WASM内存中读取结果
      const result = stringFromWasm(resultPtr);
      
      return result;
    } catch (error) {
      console.error('WASM md5Hash failed:', error);
      throw error;
    }
  } else {
    throw new Error('WASM module does not export md5Hash function');
  }
}

// SM3哈希函数
export function sm3Hash(data) {
  if (!wasmLoaded) {
    throw new Error('WASM模块未加载。请先调用initializeWasmModule()或等待初始化完成。');
  }
  
  if (wasmModuleInstance.sm3_hash) {
    try {
      // 将字符串转换为WASM内存中的指针
      const dataObj = stringToWasm(data);
      
      // 调用WASM函数并直接返回结果
      const resultPtr = wasmModuleInstance.sm3_hash(dataObj.ptr, dataObj.len);
      
      // 从WASM内存中读取结果字符串
      const result = stringFromWasm(resultPtr);
      
      return result;
    } catch (error) {
      console.error('WASM SM3哈希失败:', error);
      throw error;
    }
  } else {
    throw new Error('WASM模块未导出sm3_hash函数');
  }
}

// generateSign函数
export function generateSign(paramsJson, timestamp, nonce, secretKey) {
  if (!wasmLoaded) {
    throw new Error('WASM module not loaded. Please call initializeWasmModule() first or wait for initialization.');
  }
  
  if (wasmModuleInstance.generate_sign) {
    try {
      // 将字符串转换为WASM内存中的指针
      const paramsJsonObj = stringToWasm(paramsJson);
      const nonceObj = stringToWasm(nonce);
      const secretKeyObj = stringToWasm(secretKey);
      
      const resultPtr = wasmModuleInstance.generate_sign(
        paramsJsonObj.ptr,
        paramsJsonObj.len,
        timestamp,
        nonceObj.ptr,
        nonceObj.len,
        secretKeyObj.ptr,
        secretKeyObj.len
      );
      
      // 从WASM内存中读取结果
      const result = stringFromWasm(resultPtr);
      
      return result;
    } catch (error) {
      console.error('WASM generateSign failed:', error);
      throw error;
    }
  } else if (wasmModuleInstance.generateSign) {
    // AssemblyScript版本
    try {
      const paramsJsonObj = stringToWasm(paramsJson);
      const nonceObj = stringToWasm(nonce);
      const secretKeyObj = stringToWasm(secretKey);
      
      const resultPtr = wasmModuleInstance.generateSign(
        paramsJsonObj.ptr,
        paramsJsonObj.len,
        timestamp,
        nonceObj.ptr,
        nonceObj.len,
        secretKeyObj.ptr,
        secretKeyObj.len
      );
      
      const result = stringFromWasm(resultPtr);
      return result;
    } catch (error) {
      console.error('WASM generateSign failed:', error);
      throw error;
    }
  } else {
    throw new Error('WASM module does not export generate_sign function');
  }
}

// processRequest函数
export function processRequest(requestData, requestUrl, codecConfig, codecKey) {
  if (!wasmLoaded) {
    throw new Error('WASM module not loaded. Please call initializeWasmModule() first or wait for initialization.');
  }
  
  if (wasmModuleInstance.process_request) {
    try {
      // 将字符串转换为WASM内存中的指针
      const requestDataObj = stringToWasm(requestData);
      const requestUrlObj = stringToWasm(requestUrl);
      const codecKeyObj = stringToWasm(codecKey);
      
      const resultPtr = wasmModuleInstance.process_request(
        requestDataObj.ptr,
        requestDataObj.len,
        requestUrlObj.ptr,
        requestUrlObj.len,
        codecConfig,
        codecKeyObj.ptr,
        codecKeyObj.len
      );
      
      // 从WASM内存中读取结果
      const result = stringFromWasm(resultPtr);
      
      return result;
    } catch (error) {
      console.error('WASM processRequest failed:', error);
      throw error;
    }
  } else if (wasmModuleInstance.processRequest) {
    // AssemblyScript版本
    try {
      const requestDataObj = stringToWasm(requestData);
      const requestUrlObj = stringToWasm(requestUrl);
      const codecKeyObj = stringToWasm(codecKey);
      
      const resultPtr = wasmModuleInstance.processRequest(
        requestDataObj.ptr,
        requestDataObj.len,
        requestUrlObj.ptr,
        requestUrlObj.len,
        codecConfig,
        codecKeyObj.ptr,
        codecKeyObj.len
      );
      
      const result = stringFromWasm(resultPtr);
      return result;
    } catch (error) {
      console.error('WASM processRequest failed:', error);
      throw error;
    }
  } else {
    throw new Error('WASM module does not export process_request function');
  }
}

// processResponse函数
export function processResponse(responseData, originKey, timestamp) {
  if (!wasmLoaded) {
    throw new Error('WASM module not loaded. Please call initializeWasmModule() first or wait for initialization.');
  }
  
  if (wasmModuleInstance.process_response) {
    try {
      // 将字符串转换为WASM内存中的指针
      const responseDataObj = stringToWasm(responseData);
      const originKeyObj = stringToWasm(originKey);
      const timestampObj = stringToWasm(timestamp);
      
      const resultPtr = wasmModuleInstance.process_response(
        responseDataObj.ptr,
        responseDataObj.len,
        originKeyObj.ptr,
        originKeyObj.len,
        timestampObj.ptr,
        timestampObj.len
      );
      
      // 从WASM内存中读取结果
      const result = stringFromWasm(resultPtr);
      
      return result;
    } catch (error) {
      console.error('WASM processResponse failed:', error);
      throw error;
    }
  } else if (wasmModuleInstance.processResponse) {
    // AssemblyScript版本
    try {
      const responseDataObj = stringToWasm(responseData);
      const originKeyObj = stringToWasm(originKey);
      const timestampObj = stringToWasm(timestamp);
      
      const resultPtr = wasmModuleInstance.processResponse(
        responseDataObj.ptr,
        responseDataObj.len,
        originKeyObj.ptr,
        originKeyObj.len,
        timestampObj.ptr,
        timestampObj.len
      );
      
      const result = stringFromWasm(resultPtr);
      return result;
    } catch (error) {
      console.error('WASM processResponse failed:', error);
      throw error;
    }
  } else {
    throw new Error('WASM module does not export process_response function');
  }
}

// 导出AES加密函数（同步方式）
export function encryptAES(data, key) {
  // 确保WASM已加载
  if (!wasmLoaded) {
    throw new Error('WASM module not loaded. Please call initializeWasmModule() first or wait for initialization.');
  }
  
  // 检查WASM模块实例是否存在
  if (!wasmModuleInstance) {
    throw new Error('WASM module instance is not available');
  }
  
  // 如果WASM模块有正确的加密函数，使用它
  if (wasmModuleInstance.aesEncrypt) {
    try {
      // 将字符串转换为WASM内存中的指针
      const dataObj = stringToWasm(data);
      const keyObj = stringToWasm(key);
      
      // 调用WASM函数
      const resultPtr = wasmModuleInstance.aesEncrypt(
        dataObj.ptr,
        dataObj.len,
        keyObj.ptr,
        keyObj.len
      );
      
      // 从WASM内存中读取结果
      const result = stringFromWasm(resultPtr);
      
      return result;
    } catch (error) {
      console.error('WASM AES encryption failed:', error);
      throw error;
    }
  } else {
    throw new Error('WASM module does not export aesEncrypt function');
  }
}

// 导出AES解密函数（同步方式）
export function decryptAES(encryptedData, key) {
  // 确保WASM已加载
  if (!wasmLoaded) {
    throw new Error('WASM module not loaded. Please call initializeWasmModule() first or wait for initialization.');
  }
  
  // 检查WASM模块实例是否存在
  if (!wasmModuleInstance) {
    throw new Error('WASM module instance is not available');
  }
  
  // 如果WASM模块有正确的解密函数，使用它
  if (wasmModuleInstance.aesDecrypt) {
    try {
      // 将字符串转换为WASM内存中的指针
      const encryptedDataObj = stringToWasm(encryptedData);
      const keyObj = stringToWasm(key);
      
      // 调用WASM函数
      const resultPtr = wasmModuleInstance.aesDecrypt(
        encryptedDataObj.ptr,
        encryptedDataObj.len,
        keyObj.ptr,
        keyObj.len
      );
      
      // 从WASM内存中读取结果
      const result = stringFromWasm(resultPtr);
      
      return result;
    } catch (error) {
      console.error('WASM AES decryption failed:', error);
      throw error;
    }
  } else {
    throw new Error('WASM module does not export aesDecrypt function');
  }
}

// JavaScript版本的AES加密实现（使用XOR异或加密后Base64编码）
export function jsEncryptAES(data, key) {
    // 将字符串转换为字节数组
    const dataBytes = new TextEncoder().encode(data);
    const keyBytes = new TextEncoder().encode(key);
    
    // 执行XOR异或加密
    const encryptedBytes = new Uint8Array(dataBytes.length);
    for (let i = 0; i < dataBytes.length; i++) {
        encryptedBytes[i] = dataBytes[i] ^ keyBytes[i % keyBytes.length];
    }
    
    // 将加密结果转换为Base64编码
    // 在浏览器环境中使用btoa，在Node.js环境中使用Buffer
    if (typeof btoa !== 'undefined') {
        // 浏览器环境
        const binaryString = String.fromCharCode.apply(null, encryptedBytes);
        return btoa(binaryString);
    } else {
        // Node.js环境
        return Buffer.from(encryptedBytes).toString('base64');
    }
}

// JavaScript版本的AES解密实现（对Base64解码后执行XOR异或解密）
export function jsDecryptAES(encryptedData, key) {
    // Base64解码
    let encryptedBytes;
    if (typeof atob !== 'undefined') {
        // 浏览器环境
        const binaryString = atob(encryptedData);
        encryptedBytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            encryptedBytes[i] = binaryString.charCodeAt(i);
        }
    } else {
        // Node.js环境
        encryptedBytes = new Uint8Array(Buffer.from(encryptedData, 'base64'));
    }
    
    // 获取密钥字节数组
    const keyBytes = new TextEncoder().encode(key);
    
    // 执行XOR异或解密
    const decryptedBytes = new Uint8Array(encryptedBytes.length);
    for (let i = 0; i < encryptedBytes.length; i++) {
        decryptedBytes[i] = encryptedBytes[i] ^ keyBytes[i % keyBytes.length];
    }
    
    // 将解密结果转换为字符串
    return new TextDecoder().decode(decryptedBytes);
}

// 辅助函数：将ArrayBuffer转换为Base64
function arrayBufferToBase64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

// 辅助函数：将Base64转换为ArrayBuffer
function base64ToArrayBuffer(base64) {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}

// JavaScript版本的SM3哈希实现（使用sm-crypto）
export function jsSm3Hash(data) {
    // 使用sm-crypto库进行SM3哈希
    const hash = smCrypto.sm3(data);
    return hash;
}

// JavaScript版本的SM4加密实现（使用sm-crypto）
export function jsSm4Encrypt(data, key) {
    // 使用sm-crypto库进行SM4加密
    // SM4加密需要将密钥转换为字节数组
    const encrypted = smCrypto.sm4.encrypt(data, key);
    return encrypted;
}

// JavaScript版本的SM4解密实现（使用sm-crypto）
export function jsSm4Decrypt(encryptedData, key) {
    // 使用sm-crypto库进行SM4解密
    // SM4解密需要将密钥转换为字节数组
    const decrypted = smCrypto.sm4.decrypt(encryptedData, key);
    return decrypted;
}

// SM4加密函数
export function encryptSM4(data, key) {
  if (!wasmLoaded) {
    // 如果WASM未加载，使用JavaScript实现
    try {
      // 使用sm-crypto库进行SM4加密
      const encrypted = smCrypto.sm4.encrypt(data, key);
      return encrypted;
    } catch (error) {
      console.error('JavaScript SM4 encryption failed:', error);
      throw error;
    }
  }
  
  // 注意：我们需要在Rust代码中实现SM4加密函数
  if (wasmModuleInstance.sm4_encrypt) {
    try {
      const dataObj = stringToWasm(data);
      const keyObj = stringToWasm(key);
      
      const resultPtr = wasmModuleInstance.sm4_encrypt(
        dataObj.ptr,
        dataObj.len,
        keyObj.ptr,
        keyObj.len
      );
      
      const result = stringFromWasm(resultPtr);
      return result;
    } catch (error) {
      console.error('WASM SM4 encryption failed:', error);
      throw error;
    }
  } else {
    // 如果WASM函数不存在，使用JavaScript实现
    try {
      // 使用sm-crypto库进行SM4加密
      const encrypted = smCrypto.sm4.encrypt(data, key);
      return encrypted;
    } catch (error) {
      console.error('JavaScript SM4 encryption failed:', error);
      throw error;
    }
  }
}

// SM4解密函数
export function decryptSM4(encryptedData, key) {
  if (!wasmLoaded) {
    // 如果WASM未加载，使用JavaScript实现
    try {
      // 使用sm-crypto库进行SM4解密
      const decrypted = smCrypto.sm4.decrypt(encryptedData, key);
      return decrypted;
    } catch (error) {
      console.error('JavaScript SM4 decryption failed:', error);
      throw error;
    }
  }
  
  // 注意：我们需要在Rust代码中实现SM4解密函数
  if (wasmModuleInstance.sm4_decrypt) {
    try {
      const encryptedDataObj = stringToWasm(encryptedData);
      const keyObj = stringToWasm(key);
      
      const resultPtr = wasmModuleInstance.sm4_decrypt(
        encryptedDataObj.ptr,
        encryptedDataObj.len,
        keyObj.ptr,
        keyObj.len
      );
      
      const result = stringFromWasm(resultPtr);
      return result;
    } catch (error) {
      console.error('WASM SM4 decryption failed:', error);
      throw error;
    }
  } else {
    // 如果WASM函数不存在，使用JavaScript实现
    try {
      // 使用sm-crypto库进行SM4解密
      const decrypted = smCrypto.sm4.decrypt(encryptedData, key);
      return decrypted;
    } catch (error) {
      console.error('JavaScript SM4 decryption failed:', error);
      throw error;
    }
  }
}

// Storage Key加密函数（同步方式）
export function encryptStorageKey(key, systemCode) {
  // 确保WASM已加载
  if (!wasmLoaded) {
    throw new Error('WASM module not loaded. Please call initializeWasmModule() first or wait for initialization.');
  }
  
  if (wasmModuleInstance.encrypt_storage_key) {
    try {
      const keyObj = stringToWasm(key);
      const systemCodeObj = stringToWasm(systemCode);
      
      const resultPtr = wasmModuleInstance.encrypt_storage_key(
        keyObj.ptr,
        keyObj.len,
        systemCodeObj.ptr,
        systemCodeObj.len
      );
      
      const result = stringFromWasm(resultPtr);
      return result;
    } catch (error) {
      console.error('WASM encryptStorageKey failed:', error);
      throw error;
    }
  } else if (wasmModuleInstance.encryptStorageKey) {
    // AssemblyScript版本
    try {
      const keyObj = stringToWasm(key);
      const systemCodeObj = stringToWasm(systemCode);
      
      const resultPtr = wasmModuleInstance.encryptStorageKey(
        keyObj.ptr,
        keyObj.len,
        systemCodeObj.ptr,
        systemCodeObj.len
      );
      
      const result = stringFromWasm(resultPtr);
      return result;
    } catch (error) {
      console.error('WASM encryptStorageKey failed:', error);
      throw error;
    }
  } else {
    throw new Error('WASM module does not export encrypt_storage_key function');
  }
}

// Storage Value加密函数（同步方式）
export function encryptStorageValue(value, key, systemCode, storageKey, storageEncode) {
  // 确保WASM已加载
  if (!wasmLoaded) {
    throw new Error('WASM module not loaded. Please call initializeWasmModule() first or wait for initialization.');
  }
  
  if (wasmModuleInstance.encrypt_storage_value) {
    try {
      const valueObj = stringToWasm(value);
      const keyObj = stringToWasm(key);
      const systemCodeObj = stringToWasm(systemCode);
      const storageKeyObj = stringToWasm(storageKey);
      const storageEncodeObj = stringToWasm(storageEncode);
      
      const resultPtr = wasmModuleInstance.encrypt_storage_value(
        valueObj.ptr,
        valueObj.len,
        keyObj.ptr,
        keyObj.len,
        systemCodeObj.ptr,
        systemCodeObj.len,
        storageKeyObj.ptr,
        storageKeyObj.len,
        storageEncodeObj.ptr,
        storageEncodeObj.len
      );
      
      const result = stringFromWasm(resultPtr);
      return result;
    } catch (error) {
      console.error('WASM encryptStorageValue failed:', error);
      throw error;
    }
  } else if (wasmModuleInstance.encryptStorageValue) {
    // AssemblyScript版本
    try {
      const valueObj = stringToWasm(value);
      const keyObj = stringToWasm(key);
      const systemCodeObj = stringToWasm(systemCode);
      const storageKeyObj = stringToWasm(storageKey);
      const storageEncodeObj = stringToWasm(storageEncode);
      
      const resultPtr = wasmModuleInstance.encryptStorageValue(
        valueObj.ptr,
        valueObj.len,
        keyObj.ptr,
        keyObj.len,
        systemCodeObj.ptr,
        systemCodeObj.len,
        storageKeyObj.ptr,
        storageKeyObj.len,
        storageEncodeObj.ptr,
        storageEncodeObj.len
      );
      
      const result = stringFromWasm(resultPtr);
      return result;
    } catch (error) {
      console.error('WASM encryptStorageValue failed:', error);
      throw error;
    }
  } else {
    throw new Error('WASM module does not export encrypt_storage_value function');
  }
}

// Storage Value解密函数（同步方式）
export function decryptStorageValue(value, key, systemCode, storageKey, storageEncode) {
  // 确保WASM已加载
  if (!wasmLoaded) {
    throw new Error('WASM module not loaded. Please call initializeWasmModule() first or wait for initialization.');
  }
  
  if (wasmModuleInstance.decrypt_storage_value) {
    try {
      const valueObj = stringToWasm(value);
      const keyObj = stringToWasm(key);
      const systemCodeObj = stringToWasm(systemCode);
      const storageKeyObj = stringToWasm(storageKey);
      const storageEncodeObj = stringToWasm(storageEncode);
      
      const resultPtr = wasmModuleInstance.decrypt_storage_value(
        valueObj.ptr,
        valueObj.len,
        keyObj.ptr,
        keyObj.len,
        systemCodeObj.ptr,
        systemCodeObj.len,
        storageKeyObj.ptr,
        storageKeyObj.len,
        storageEncodeObj.ptr,
        storageEncodeObj.len
      );
      
      const result = stringFromWasm(resultPtr);
      return result;
    } catch (error) {
      console.error('WASM decryptStorageValue failed:', error);
      throw error;
    }
  } else if (wasmModuleInstance.decryptStorageValue) {
    // AssemblyScript版本
    try {
      const valueObj = stringToWasm(value);
      const keyObj = stringToWasm(key);
      const systemCodeObj = stringToWasm(systemCode);
      const storageKeyObj = stringToWasm(storageKey);
      const storageEncodeObj = stringToWasm(storageEncode);
      
      const resultPtr = wasmModuleInstance.decryptStorageValue(
        valueObj.ptr,
        valueObj.len,
        keyObj.ptr,
        keyObj.len,
        systemCodeObj.ptr,
        systemCodeObj.len,
        storageKeyObj.ptr,
        storageKeyObj.len,
        storageEncodeObj.ptr,
        storageEncodeObj.len
      );
      
      const result = stringFromWasm(resultPtr);
      return result;
    } catch (error) {
      console.error('WASM decryptStorageValue failed:', error);
      throw error;
    }
  } else {
    throw new Error('WASM module does not export decrypt_storage_value function');
  }
}

// 挂载WASM模块到window对象上，方便全局调用
if (typeof window !== 'undefined') {
  window.codecWasm = {
    initializeWasmModule,
    isWasmLoaded,
    getCurrentTimestamp,
    add,
    generateNonce,
    md5Hash,
    generateSign,
    processRequest,
    processResponse,
    encryptAES,
    decryptAES,
    encryptSM4,
    decryptSM4,
    encryptStorageKey,
    encryptStorageValue,
    decryptStorageValue,
    sm3Hash,
    jsEncryptAES,
    jsDecryptAES,
    jsSm3Hash,
    jsSm4Encrypt,
    jsSm4Decrypt
  };
}

export default wasmModuleInstance;