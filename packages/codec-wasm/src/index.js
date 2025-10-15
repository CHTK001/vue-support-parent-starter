// codec-wasm JavaScript包装器
// 引入sm-crypto库
import smCrypto from 'sm-crypto';
// 引入crypto-js库用于AES加密
import CryptoJS from 'crypto-js';
// 引入wasm-bindgen生成的WASM包装器
import init, * as wasmCodec from '../build/codec_wasm.js';

let wasmModule = null;
let wasmLoaded = false;
let wasmModuleInstance = null;
let wasmMemory = null; // 添加内存对象的引用

// 字符串编码和解码工具
const encoder = new TextEncoder();
const decoder = new TextDecoder();

// 内存管理函数
let allocFunction = null;
let deallocFunction = null;

// 安全访问WASM内存的辅助函数
function getWasmMemory() {
  // 检查是否已设置内存对象
  if (wasmMemory) {
    return wasmMemory;
  }
  // 检查wasmCodec是否正确加载并包含memory
  if (wasmCodec && wasmCodec.default && wasmCodec.default.memory) {
    return wasmCodec.default.memory;
  }
  // 如果default.memory不存在，尝试直接访问memory
  if (wasmCodec && wasmCodec.memory) {
    return wasmCodec.memory;
  }
  // 如果都不存在，抛出错误
  throw new Error('WASM memory is not available');
}

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
    // 使用安全的方式访问内存
    const memory = new Uint8Array(getWasmMemory().buffer, ptr, bytes.length);
    memory.set(bytes);
    return { ptr, len: bytes.length };
  } 
  // 检查是否有__new函数（AssemblyScript版本）
  else if (typeof wasmModuleInstance.__new === 'function') {
    // 使用AssemblyScript的内存管理
    const bytes = encoder.encode(str);
    const ptr = wasmModuleInstance.__new(bytes.length, 1); // 1表示字符串类型
    // 使用安全的方式访问内存
    const memory = new Uint8Array(getWasmMemory().buffer, ptr, bytes.length);
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
      // 使用安全的方式访问内存
      const memory = new Uint8Array(getWasmMemory().buffer);
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
    // 使用wasm-bindgen生成的初始化函数
    // 注意：这里需要传递正确的路径和初始化参数
    const wasmExports = await init();
    
    // 保存WASM模块实例
    wasmModuleInstance = wasmExports || wasmCodec;
    wasmLoaded = true;
    
    // 尝试从导出中获取内存对象
    if (wasmExports && wasmExports.memory) {
      wasmMemory = wasmExports.memory;
    } else if (wasmModuleInstance && wasmModuleInstance.memory) {
      wasmMemory = wasmModuleInstance.memory;
    }
    
    // 检查并保存内存管理函数
    if (typeof wasmModuleInstance.alloc === 'function') {
      allocFunction = wasmModuleInstance.alloc;
    }
    if (typeof wasmModuleInstance.dealloc === 'function') {
      deallocFunction = wasmModuleInstance.dealloc;
    }
    
    console.log('Codec WASM module loaded successfully');
    console.log('WASM exports:', Object.keys(wasmModuleInstance));
    return wasmModuleInstance;
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

// MD5哈希函数
export function md5Hash(data) {
  if (!wasmLoaded) {
    throw new Error('WASM模块未加载。请先调用initializeWasmModule()或等待初始化完成。');
  }
  
  if (wasmModuleInstance.md5_hash) {
    try {
      // 将字符串转换为WASM内存中的指针
      const dataObj = stringToWasm(data);
      
      // 调用WASM函数并直接返回结果
      const resultPtr = wasmModuleInstance.md5_hash(dataObj.ptr, dataObj.len);
      
      // 从WASM内存中读取结果字符串
      const result = stringFromWasm(resultPtr);
      
      return result;
    } catch (error) {
      console.error('WASM MD5哈希失败:', error);
      throw error;
    }
  } else {
    throw new Error('WASM模块未导出md5_hash函数');
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
  if (wasmModuleInstance.aes_encrypt) {
    try {
      // 将字符串转换为WASM内存中的指针
      const dataObj = stringToWasm(data);
      const keyObj = stringToWasm(key);
      
      // 调用WASM函数
      const resultPtr = wasmModuleInstance.aes_encrypt(
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
    throw new Error('WASM module does not export aes_encrypt function');
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
  if (wasmModuleInstance.aes_decrypt) {
    try {
      // 将字符串转换为WASM内存中的指针
      const encryptedDataObj = stringToWasm(encryptedData);
      const keyObj = stringToWasm(key);
      
      // 调用WASM函数
      const resultPtr = wasmModuleInstance.aes_decrypt(
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
    throw new Error('WASM module does not export aes_decrypt function');
  }
}

// JavaScript版本的AES加密实现（使用crypto-js库）
export function jsEncryptAES(data, key) {
    // 使用crypto-js库进行AES加密
    // 使用CBC模式和PKCS7填充，与Rust版本保持一致
    const keyUtf8 = CryptoJS.enc.Utf8.parse(key);
    const iv = CryptoJS.enc.Utf8.parse('\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00'); // 使用零IV
    const encrypted = CryptoJS.AES.encrypt(data, keyUtf8, {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
    });
    return encrypted.toString();
}

// JavaScript版本的AES解密实现（使用crypto-js库）
export function jsDecryptAES(encryptedData, key) {
    // 使用crypto-js库进行AES解密
    // 使用CBC模式和PKCS7填充，与Rust版本保持一致
    const keyUtf8 = CryptoJS.enc.Utf8.parse(key);
    const iv = CryptoJS.enc.Utf8.parse('\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00'); // 使用零IV
    const decrypted = CryptoJS.AES.decrypt(encryptedData, keyUtf8, {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
    });
    return decrypted.toString(CryptoJS.enc.Utf8);
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
    // SM4加密需要将密钥转换为字节数组（如果密钥是16字节的字符串）
    try {
        let processedKey = key;
        // 如果密钥是16字节的字符串，转换为字节数组
        if (typeof key === 'string' && key.length === 16) {
            processedKey = [];
            for (let i = 0; i < key.length; i++) {
                processedKey.push(key.charCodeAt(i));
            }
        }
        const encrypted = smCrypto.sm4.encrypt(data, processedKey);
        return encrypted;
    } catch (error) {
        console.error('JavaScript SM4 encryption failed:', error);
        throw error;
    }
}

// JavaScript版本的SM4解密实现（使用sm-crypto）
export function jsSm4Decrypt(encryptedData, key) {
    // 使用sm-crypto库进行SM4解密
    // SM4解密需要将密钥转换为字节数组（如果密钥是16字节的字符串）
    try {
        let processedKey = key;
        // 如果密钥是16字节的字符串，转换为字节数组
        if (typeof key === 'string' && key.length === 16) {
            processedKey = [];
            for (let i = 0; i < key.length; i++) {
                processedKey.push(key.charCodeAt(i));
            }
        }
        const decrypted = smCrypto.sm4.decrypt(encryptedData, processedKey);
        return decrypted;
    } catch (error) {
        console.error('JavaScript SM4 decryption failed:', error);
        throw error;
    }
}

// JavaScript版本的MD5哈希实现（使用crypto-js库）
export function jsMd5Hash(data) {
    // 使用crypto-js库进行MD5哈希
    const hash = CryptoJS.MD5(data);
    return hash.toString();
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
  return systemCode + key;
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

// SM2加密函数
export function encryptSM2(data, publicKey) {
  if (!wasmLoaded) {
    // 如果WASM未加载，使用JavaScript实现
    try {
      // 使用sm-crypto库进行SM2加密
      const encrypted = smCrypto.sm2.doEncrypt(data, publicKey, 1); // 1表示C1C3C2模式
      return encrypted;
    } catch (error) {
      console.error('JavaScript SM2 encryption failed:', error);
      throw error;
    }
  }
  
  // 使用wasmModuleInstance对象调用SM2加密函数
  if (wasmModuleInstance.sm2_encrypt) {
    try {
      const dataObj = stringToWasm(data);
      const publicKeyObj = stringToWasm(publicKey);
      
      const resultPtr = wasmModuleInstance.sm2_encrypt(
        dataObj.ptr,
        dataObj.len,
        publicKeyObj.ptr,
        publicKeyObj.len
      );
      
      const result = stringFromWasm(resultPtr);
      return result;
    } catch (error) {
      console.error('WASM SM2 encryption failed:', error);
      throw error;
    }
  } else {
    // 如果WASM函数不存在，使用JavaScript实现
    try {
      // 使用sm-crypto库进行SM2加密
      const encrypted = smCrypto.sm2.doEncrypt(data, publicKey, 1); // 1表示C1C3C2模式
      return encrypted;
    } catch (error) {
      console.error('JavaScript SM2 encryption failed:', error);
      throw error;
    }
  }
}

// SM2解密函数
export function decryptSM2(encryptedData, privateKey) {
  if (!wasmLoaded) {
    // 如果WASM未加载，使用JavaScript实现
    try {
      // 使用sm-crypto库进行SM2解密
      const decrypted = smCrypto.sm2.doDecrypt(encryptedData, privateKey, 1); // 1表示C1C3C2模式
      return decrypted;
    } catch (error) {
      console.error('JavaScript SM2 decryption failed:', error);
      throw error;
    }
  }
  
  // 使用wasmModuleInstance对象调用SM2解密函数
  if (wasmModuleInstance.sm2_decrypt) {
    try {
      const encryptedDataObj = stringToWasm(encryptedData);
      const privateKeyObj = stringToWasm(privateKey);
      
      const resultPtr = wasmModuleInstance.sm2_decrypt(
        encryptedDataObj.ptr,
        encryptedDataObj.len,
        privateKeyObj.ptr,
        privateKeyObj.len
      );
      
      const result = stringFromWasm(resultPtr);
      return result;
    } catch (error) {
      console.error('WASM SM2 decryption failed:', error);
      throw error;
    }
  } else {
    // 如果WASM函数不存在，使用JavaScript实现
    try {
      // 使用sm-crypto库进行SM2解密
      const decrypted = smCrypto.sm2.doDecrypt(encryptedData, privateKey, 1); // 1表示C1C3C2模式
      return decrypted;
    } catch (error) {
      console.error('JavaScript SM2 decryption failed:', error);
      throw error;
    }
  }
}

// 生成SM2密钥对函数
export function generateSm2KeyPair() {
  if (!wasmLoaded) {
    throw new Error('WASM模块未加载。请先调用initializeWasmModule()或等待初始化完成。');
  }
  
  // 使用wasmModuleInstance对象调用生成SM2密钥对函数
  if (wasmModuleInstance.generate_sm2_key_pair) {
    try {
      const resultPtr = wasmModuleInstance.generate_sm2_key_pair();
      const result = stringFromWasm(resultPtr);
      return result;
    } catch (error) {
      console.error('WASM generateSm2KeyPair failed:', error);
      throw error;
    }
  } else {
    throw new Error('WASM模块未导出generate_sm2_key_pair函数');
  }
}

// UU1 function - Response decryption (简化版本，只负责调用WASM）
export function uu1(response) {
  // 确保WASM模块已加载
  if (!wasmLoaded) {
    throw new Error('WASM模块未加载。请先调用initializeWasmModule()或等待初始化完成。');
  }
  
  // 检查WASM模块是否导出uu1_decrypt_response_object_with_arraybuffer函数
  if (wasmModuleInstance.uu1_decrypt_response_object_with_arraybuffer) {
    // 使用新函数处理ArrayBuffer
    try {
      // 检查response.data是否为Blob类型
      if (response.data instanceof Blob) {
        // 根据Content-Type判断如何处理Blob
        const contentType = response.headers && response.headers['content-type'];
        
        // 只有application/octet-stream类型的二进制数据才使用WASM处理
        if (contentType && contentType.includes('application/octet-stream')) {
          // 对于加密的二进制数据，先转换为ArrayBuffer再传递给WASM
          return response.data.arrayBuffer().then(buffer => {
            // 创建新的响应对象，将ArrayBuffer数据放入data字段
            const newResponse = {
              ...response,
              data: buffer
            };
            // 直接调用WASM函数处理整个响应对象
            return wasmModuleInstance.uu1_decrypt_response_object_with_arraybuffer(newResponse);
          });
        } else if (contentType && contentType.includes('application/json')) {
          // 对于JSON数据，转换为对象
          return response.data.text().then(text => {
            let processedData;
            try {
              processedData = JSON.parse(text);
            } catch (e) {
              // 如果JSON解析失败，使用原始文本
              processedData = text;
            }
            
            // 创建新的响应对象
            const newResponse = {
              ...response,
              data: processedData
            };
            
            // 直接返回处理后的响应，不调用WASM
            return newResponse;
          });
        } else if (contentType && contentType.includes('text/')) {
          // 对于文本数据，直接使用文本
          return response.data.text().then(text => {
            // 创建新的响应对象
            const newResponse = {
              ...response,
              data: text
            };
            
            // 直接返回处理后的响应，不调用WASM
            return newResponse;
          });
        } else {
          // 对于其他类型的Blob，直接返回原始响应
          return response;
        }
      } else {
        // 对于非Blob数据，直接返回原始响应对象，不调用WASM
        return response;
      }
    } catch (error) {
      console.error('处理响应数据失败:', error);
      throw error;
    }
  } else if (wasmModuleInstance.uu1_decrypt_response_object) {
    // 如果新函数不存在，使用旧函数
    try {
      // 检查response.data是否为Blob类型
      if (response.data instanceof Blob) {
        // 根据Content-Type判断如何处理Blob
        const contentType = response.headers && response.headers['content-type'];
        
        // 只有application/octet-stream类型的二进制数据才使用WASM处理
        if (contentType && contentType.includes('application/octet-stream')) {
          // 对于加密的二进制数据，先转换为ArrayBuffer再传递给WASM
          return response.data.arrayBuffer().then(buffer => {
            // 创建新的响应对象，将ArrayBuffer数据放入data字段
            const newResponse = {
              ...response,
              data: buffer
            };
            // 直接调用WASM函数处理整个响应对象
            return wasmModuleInstance.uu1_decrypt_response_object_with_arraybuffer(newResponse);
          });
        } else if (contentType && contentType.includes('application/json')) {
          // 对于JSON数据，转换为对象
          return response.data.text().then(text => {
            let processedData;
            try {
              processedData = JSON.parse(text);
            } catch (e) {
              // 如果JSON解析失败，使用原始文本
              processedData = text;
            }
            
            // 创建新的响应对象
            const newResponse = {
              ...response,
              data: processedData
            };
            
            // 直接返回处理后的响应，不调用WASM
            return newResponse;
          });
        } else if (contentType && contentType.includes('text/')) {
          // 对于文本数据，直接使用文本
          return response.data.text().then(text => {
            // 创建新的响应对象
            const newResponse = {
              ...response,
              data: text
            };
            
            // 直接返回处理后的响应，不调用WASM
            return newResponse;
          });
        } else {
          // 对于其他类型的Blob，直接返回原始响应
          return response;
        }
      } else {
        // 对于非Blob数据，直接调用WASM函数处理整个响应对象
        return wasmModuleInstance.uu1_decrypt_response_object(response);
      }
    } catch (error) {
      console.error('处理响应数据失败:', error);
      throw error;
    }
  } else {
    throw new Error('WASM模块未导出uu1_decrypt_response_object或uu1_decrypt_response_object_with_arraybuffer函数');
  }
}

// UU1 WASM function - 保持向后兼容
export function uu1_wasm(response) {
  return uu1(response);
}

// UU2 function - Request encryption
export function uu2(requestData, key) {
  if (!wasmLoaded) {
    throw new Error('WASM模块未加载。请先调用initializeWasmModule()或等待初始化完成。');
  }
  
  if (wasmModuleInstance.uu2_encrypt_request) {
    try {
      const requestObj = stringToWasm(requestData);
      const keyObj = stringToWasm(key);
      
      const resultPtr = wasmModuleInstance.uu2_encrypt_request(
        requestObj.ptr,
        requestObj.len,
        keyObj.ptr,
        keyObj.len
      );
      
      const result = stringFromWasm(resultPtr);
      return result;
    } catch (error) {
      console.error('WASM uu2 failed:', error);
      throw error;
    }
  } else {
    throw new Error('WASM模块未导出uu2_encrypt_request函数');
  }
}

// UU2 WASM function - 修改为接收PureHttpRequestConfig对象
export function uu2_wasm(request) {
  // 确保WASM模块已加载
  if (!wasmLoaded) {
    throw new Error('WASM模块未加载。请先调用initializeWasmModule()或等待初始化完成。');
  }
  
  // 检查WASM模块是否导出uu2_process_request函数（新的处理函数）
  if (wasmModuleInstance.uu2_process_request) {
    try {
      // 直接调用WASM函数处理整个请求对象
      return wasmModuleInstance.uu2_process_request(request);
    } catch (error) {
      console.error('WASM uu2_wasm处理失败:', error);
      throw error;
    }
  }
  return request;
}

// UU3 function - Simple decryption with fixed key
export function uu3(encryptedData) {
  if (!wasmLoaded) {
    throw new Error('WASM模块未加载。请先调用initializeWasmModule()或等待初始化完成。');
  }
  
  if (wasmModuleInstance.uu3_decrypt_simple) {
    try {
      const encryptedDataObj = stringToWasm(encryptedData);
      
      const resultPtr = wasmModuleInstance.uu3_decrypt_simple(
        encryptedDataObj.ptr,
        encryptedDataObj.len
      );
      
      const result = stringFromWasm(resultPtr);
      return result;
    } catch (error) {
      console.error('WASM uu3 failed:', error);
      throw error;
    }
  } else {
    throw new Error('WASM模块未导出uu3_decrypt_simple函数');
  }
}

// UU3 WASM function - 保持向后兼容
export function uu3_wasm(encryptedData) {
  return uu3(encryptedData);
}

// UU4 function - Another response decryption
export function uu4(responseData, uuid, timestamp) {
  if (!wasmLoaded) {
    throw new Error('WASM模块未加载。请先调用initializeWasmModule()或等待初始化完成。');
  }
  
  if (wasmModuleInstance.uu4_decrypt_response) {
    try {
      const responseDataObj = stringToWasm(responseData);
      const uuidObj = stringToWasm(uuid);
      const timestampObj = stringToWasm(timestamp);
      
      const resultPtr = wasmModuleInstance.uu4_decrypt_response(
        responseDataObj.ptr,
        responseDataObj.len,
        uuidObj.ptr,
        uuidObj.len,
        timestampObj.ptr,
        timestampObj.len
      );
      
      const result = stringFromWasm(resultPtr);
      return result;
    } catch (error) {
      console.error('WASM uu4 failed:', error);
      throw error;
    }
  } else {
    throw new Error('WASM模块未导出uu4_decrypt_response函数');
  }
}

// UU4 WASM function - 保持向后兼容
export function uu4_wasm(responseData, uuid, timestamp) {
  return uu4(responseData, uuid, timestamp);
}

// SM2签名生成函数
export function generateSign(data, privateKey) {
  if (!wasmLoaded) {
    throw new Error('WASM模块未加载。请先调用initializeWasmModule()或等待初始化完成。');
  }
  
  // 使用wasmModuleInstance对象调用SM2签名生成函数
  if (wasmModuleInstance.generate_sign) {
    try {
      const dataObj = stringToWasm(data);
      const privateKeyObj = stringToWasm(privateKey);
      
      const resultPtr = wasmModuleInstance.generate_sign(
        dataObj.ptr,
        dataObj.len,
        privateKeyObj.ptr,
        privateKeyObj.len
      );
      
      const result = stringFromWasm(resultPtr);
      return result;
    } catch (error) {
      console.error('WASM generateSign failed:', error);
      throw error;
    }
  } else {
    throw new Error('WASM模块未导出generate_sign函数');
  }
}

// SM2签名验证函数
export function verifySign(data, signature, publicKey) {
  if (!wasmLoaded) {
    throw new Error('WASM模块未加载。请先调用initializeWasmModule()或等待初始化完成。');
  }
  
  // 使用wasmModuleInstance对象调用SM2签名验证函数
  if (wasmModuleInstance.verify_sign) {
    try {
      const dataObj = stringToWasm(data);
      const signatureObj = stringToWasm(signature);
      const publicKeyObj = stringToWasm(publicKey);
      
      const result = wasmModuleInstance.verify_sign(
        dataObj.ptr,
        dataObj.len,
        signatureObj.ptr,
        signatureObj.len,
        publicKeyObj.ptr,
        publicKeyObj.len
      );
      
      return result;
    } catch (error) {
      console.error('WASM verifySign failed:', error);
      throw error;
    }
  } else {
    throw new Error('WASM模块未导出verify_sign函数');
  }
}

// 挂载WASM模块到window对象上，方便全局调用
if (typeof window !== 'undefined') {
  window.codecWasm = {
    isWasmLoaded,
    getCurrentTimestamp,
    add,
    generateNonce,
    sm3Hash,
    md5Hash,
    encryptAES,
    decryptAES,
    encryptSM2,
    decryptSM2,
    generateSm2KeyPair,
    encryptSM4,
    decryptSM4,
    encryptStorageKey,
    encryptStorageValue,
    decryptStorageValue,
    jsEncryptAES,
    jsDecryptAES,
    jsSm3Hash,
    jsMd5Hash,
    jsSm4Encrypt,
    jsSm4Decrypt,
    uu1,
    uu1_wasm,
    uu2,
    uu2_wasm,
    uu3,
    uu3_wasm,
    uu4,
    uu4_wasm,
    generateSign,
    verifySign
  };
}

export default wasmModuleInstance;
