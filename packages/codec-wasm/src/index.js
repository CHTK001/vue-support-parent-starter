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
    throw error;
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
    throw error;
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
    throw error;
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
      throw error;
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
    throw error;
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
    console.error('WASM getCurrentTimestamp failed:', error);
    throw error;
  }
}

export async function add(a, b) {
  try {
    const wasm = await loadWasm();
    return wasm.add(a, b);
  } catch (error) {
    console.error('WASM add failed:', error);
    throw error;
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

// 导出MD5哈希函数
export async function md5Hash(input) {
  try {
    const wasm = await loadWasm();
    return wasm.md5Hash(input);
  } catch (error) {
    console.error('WASM md5Hash failed:', error);
    throw error;
  }
}

// 导出generateSign函数
export async function generateSign(paramsJson, timestamp, nonce, secretKey) {
  try {
    const wasm = await loadWasm();
    // 将timestamp从number转换为bigint以匹配AssemblyScript的i64类型
    return wasm.generateSign(paramsJson, BigInt(timestamp), nonce, secretKey);
  } catch (error) {
    console.error('WASM generateSign failed:', error);
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
    throw error;
  }
}

// 导出AES解密函数
export async function decryptAES(value, key) {
  try {
    const wasm = await loadWasm();
    return wasm.decryptAES(value, key);
  } catch (error) {
    console.error('WASM decryptAES failed:', error);
    throw error;
  }
}

// Storage Key加密函数
export async function encryptStorageKey(key, systemCode) {
  try {
    const wasm = await loadWasm();
    return wasm.encryptStorageKey(key, systemCode);
  } catch (error) {
    console.error('WASM encryptStorageKey failed:', error);
    throw error;
  }
}

// Storage Value加密函数
export async function encryptStorageValue(value, key, systemCode, storageKey, storageEncode) {
  try {
    const wasm = await loadWasm();
    return wasm.encryptStorageValue(value, key, systemCode, storageKey, storageEncode);
  } catch (error) {
    console.error('WASM encryptStorageValue failed:', error);
    throw error;
  }
}

// Storage Value解密函数
export async function decryptStorageValue(value, key, systemCode, storageKey, storageEncode) {
  try {
    const wasm = await loadWasm();
    return wasm.decryptStorageValue(value, key, systemCode, storageKey, storageEncode);
  } catch (error) {
    console.error('WASM decryptStorageValue failed:', error);
    throw error;
  }
}