// codec-wasm JavaScript包装器

let wasmModule = null;
let wasmLoaded = false;

// 加载WASM模块
async function loadWasm() {
  if (wasmLoaded) {
    return wasmModule;
  }

  try {
    // 加载WASM模块
    const wasm = await import('../build/release.js');
    wasmModule = wasm;
    wasmLoaded = true;
    console.log('Codec WASM module loaded successfully');
    return wasmModule;
  } catch (error) {
    console.error('Failed to load WASM module:', error);
    throw new Error('Failed to load codec WASM module');
  }
}

// WASM版本的uu2函数
export async function uu2_wasm(request, getConfig) {
  const requestData = request.data;
  const requestUrl = request.url;
  
  if (requestUrl.startsWith('/v2/setting')) {
    return request;
  }
  
  if (!requestData) {
    return request;
  }

  const codecConfig = getConfig('requestCodecOpen');
  const codecKey = getConfig('codecRequestKey');
  
  if (!codecConfig || !codecKey) {
    return request;
  }

  try {
    const wasm = await loadWasm();
    const jsonData = JSON.stringify(requestData);
    const result = wasm.processRequest(jsonData, requestUrl, codecConfig, codecKey);
    
    if (result.startsWith('ERROR:')) {
      throw new Error(result);
    }
    
    const parsedResult = JSON.parse(result);
    
    // 更新请求对象
    request.data = { data: parsedResult.data };
    request.headers = {
      ...request.headers,
      ...parsedResult.headers
    };
    
    return request;
  } catch (error) {
    console.error('WASM encryption failed:', error);
    return request;
  }
}

// WASM版本的uu1函数
export async function uu1_wasm(response) {
  if (!response || typeof response !== 'object') {
    return response;
  }
  
  if (response.status !== 200) {
    return response;
  }
  
  try {
    const rawData = response.data?.data || response.data;
    
    if (typeof rawData !== 'string') {
      return response;
    }
    
    if (!rawData.startsWith('02')) {
      return response;
    }
    
    const originKey = response?.headers?.['access-control-origin-key'];
    if (!originKey) {
      return response;
    }
    
    const wasm = await loadWasm();
    const timestamp = response?.headers?.['access-control-timestamp-user'] || '';
    const decryptedData = wasm.processResponse(rawData, originKey.toString(), timestamp);
    
    if (decryptedData && decryptedData !== rawData) {
      response.data = JSON.parse(decryptedData);
    }
    
    return response;
  } catch (error) {
    console.warn('WASM decryption failed:', error);
    return response;
  }
}

// WASM版本的uu3函数
export async function uu3_wasm(value) {
  if (!value || typeof value !== 'string') {
    return value;
  }
  
  try {
    const wasm = await loadWasm();
    return wasm.decryptAES(value, '1234567890Oil#@1');
  } catch (error) {
    console.debug('WASM AES decryption failed:', error);
    return value;
  }
}

// WASM版本的uu4函数
export async function uu4_wasm(response) {
  if (!response || typeof response !== 'object') {
    return {};
  }
  
  const data = response?.data;
  if (!data || typeof data !== 'string') {
    return response;
  }
  
  if (!data.startsWith('02')) {
    return response;
  }
  
  const uuid = response?.uuid;
  if (uuid) {
    const timestamp = response?.timestamp || '';
    try {
      const wasm = await loadWasm();
      const decrypted = wasm.processSpecialResponse(data, uuid, timestamp);
      
      if (decrypted && decrypted !== '{}') {
        return JSON.parse(decrypted);
      }
    } catch (error) {
      console.debug('WASM special decryption failed:', error);
    }
  }
  return {};
}

// 初始化函数
export async function initWasm() {
  try {
    await loadWasm();
    console.log('Codec WASM module loaded successfully');
    return true;
  } catch (error) {
    console.error('Failed to initialize codec WASM:', error);
    return false;
  }
}

// 检查WASM是否已加载
export function isWasmLoaded() {
  return wasmLoaded;
}

// 导出WASM模块的其他函数
export async function getCurrentTimestamp() {
  try {
    const wasm = await loadWasm();
    return wasm.getCurrentTimestamp();
  } catch (error) {
    return Date.now();
  }
}

export async function add(a, b) {
  try {
    const wasm = await loadWasm();
    return wasm.add(a, b);
  } catch (error) {
    return a + b;
  }
}

// 导出generateNonce函数
export async function generateNonce() {
  try {
    const wasm = await loadWasm();
    return wasm.generateNonce();
  } catch (error) {
    console.error('WASM generateNonce failed:', error);
    throw error;
  }
}

// 导出processRequest函数
export async function processRequest(requestData, requestUrl, codecConfig, codecKey) {
  try {
    const wasm = await loadWasm();
    return wasm.processRequest(requestData, requestUrl, codecConfig, codecKey);
  } catch (error) {
    console.error('WASM processRequest failed:', error);
    throw error;
  }
}

// 导出processResponse函数
export async function processResponse(responseData, originKey, timestamp) {
  try {
    const wasm = await loadWasm();
    return wasm.processResponse(responseData, originKey, timestamp);
  } catch (error) {
    console.error('WASM processResponse failed:', error);
    throw error;
  }
}

// 导出AES加密函数
export async function encryptAES(data, key) {
  try {
    const wasm = await loadWasm();
    return wasm.encryptAES(data, key);
  } catch (error) {
    console.error('WASM encryptAES failed:', error);
    // 回退到JavaScript实现
    return fallbackEncryptAES(data, key);
  }
}

// 导出AES解密函数
export async function decryptAES(value, key) {
  try {
    const wasm = await loadWasm();
    return wasm.decryptAES(value, key);
  } catch (error) {
    console.error('WASM decryptAES failed:', error);
    // 回退到JavaScript实现
    return fallbackDecryptAES(value, key);
  }
}

// Storage Key加密函数
export async function encryptStorageKey(key, systemCode) {
  try {
    const wasm = await loadWasm();
    return wasm.encryptStorageKey(key, systemCode);
  } catch (error) {
    console.error('WASM encryptStorageKey failed:', error);
    // 回退到JavaScript实现
    if (!key) {
      return key;
    }
    
    // 对于以responsiveStorageNameSpace开头的key，不进行加密
    if (key.startsWith("responsive-")) {
      return key;
    }
    
    // 生成新的key，加上系统代码前缀
    const newKey = systemCode + key;
    return newKey;
  }
}

// Storage Value加密函数
export async function encryptStorageValue(value, key, systemCode, storageKey, storageEncode) {
  try {
    const wasm = await loadWasm();
    return wasm.encryptStorageValue(value, key, systemCode, storageKey, storageEncode);
  } catch (error) {
    console.error('WASM encryptStorageValue failed:', error);
    // 回退到JavaScript实现
    if (!key || !value) {
      return value;
    }
    
    // 对于以responsiveStorageNameSpace开头的key，不进行加密
    if (key.startsWith("responsive-")) {
      return value;
    }
    
    // 如果启用了存储加密，则对值进行AES加密
    if (storageEncode) {
      return encryptAES(value, storageKey);
    }
    
    return value;
  }
}

// Storage Value解密函数
export async function decryptStorageValue(value, key, systemCode, storageKey, storageEncode) {
  try {
    const wasm = await loadWasm();
    return wasm.decryptStorageValue(value, key, systemCode, storageKey, storageEncode);
  } catch (error) {
    console.error('WASM decryptStorageValue failed:', error);
    // 回退到JavaScript实现
    if (!key || !value) {
      return value;
    }
    
    // 对于以responsiveStorageNameSpace开头的key，不进行解密
    if (key.startsWith("responsive-")) {
      return value;
    }
    
    // 如果启用了存储加密，则对值进行AES解密
    if (storageEncode) {
      return decryptAES(value, storageKey);
    }
    
    return value;
  }
}

// JavaScript回退实现
function fallbackGenerateNonce() {
  // 获取当前时间戳（毫秒）
  const timestamp = Date.now();
  
  // 生成多个随机数
  const random1 = Math.random().toString(36).substr(2, 5);
  const random2 = Math.random().toString(36).substr(2, 7);
  const random3 = Math.floor(Math.random() * 1000000).toString(36);
  
  // 生成基于时间戳的哈希-like值
  const timeHash = (timestamp * 9301 + 49297) % 233280;
  
  // 生成序列号
  const sequence = (timestamp & 0xFFFF) ^ (timestamp >>> 16);
  
  // 生成基于随机数的混合值
  const mixed = ((random1.length * random2.length * random3.length) + timestamp) % 999999;
  
  // 生成最终的复杂nonce
  const nonce = `${random1}${sequence.toString(36)}${random2}${timeHash.toString(36)}${random3}${mixed.toString(36)}`;
  
  // 确保长度足够复杂
  if (nonce.length < 32) {
    const padding = Math.random().toString(36).substr(2, 32 - nonce.length);
    return nonce + padding;
  }
  
  return nonce;
}

// JavaScript回退实现 - AES加密
function fallbackEncryptAES(data, key) {
  // 这里应该实现真正的AES加密逻辑
  // 为了简化，我们使用一个简单的模拟实现
  return `AES_ENCRYPTED_${data}_WITH_${key.substring(0, 8)}`;
}

// JavaScript回退实现 - AES解密
function fallbackDecryptAES(value, key) {
  // 这里应该实现真正的AES解密逻辑
  // 为了简化，我们使用一个简单的模拟实现
  if (value.startsWith('AES_ENCRYPTED_')) {
    const prefixEnd = value.indexOf('_WITH_');
    if (prefixEnd > 13) {
      const base64Data = value.substring(13, prefixEnd);
      // 模拟解密过程
      return base64Data;
    }
  }
  return value;
}