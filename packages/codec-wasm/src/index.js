// codec-wasm JavaScript包装器

let wasmModule = null;
let wasmLoaded = false;

// 立即调用initWasm函数进行初始化
initWasm().catch(error => {
  console.error('Failed to initialize WASM module:', error);
});

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

// WASM版本的uu2函数
export function uu2_wasm(request, getConfig) {
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

  const jsonData = JSON.stringify(requestData);
  const result = wasmModule.processRequest(jsonData, requestUrl, codecConfig, codecKey);
  
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
}

// WASM版本的uu1函数
export function uu1_wasm(response) {
  if (!response || typeof response !== 'object') {
    return response;
  }
  
  if (response.status !== 200) {
    return response;
  }
  
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
  
  const timestamp = response?.headers?.['access-control-timestamp-user'] || '';
  const decryptedData = wasmModule.processResponse(rawData, originKey.toString(), timestamp);
  
  if (decryptedData && decryptedData !== rawData) {
    response.data = JSON.parse(decryptedData);
  }
  
  return response;
}

// WASM版本的uu3函数
export function uu3_wasm(value) {
  if (!value || typeof value !== 'string') {
    return value;
  }
  
  return wasmModule.decryptAES(value, '1234567890Oil#@1');
}

// WASM版本的uu4函数
export function uu4_wasm(response) {
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
    const decrypted = wasmModule.processSpecialResponse(data, uuid, timestamp);
    
    if (decrypted && decrypted !== '{}') {
      return JSON.parse(decrypted);
    }
  }
  return {};
}

// 导出WASM模块的其他函数
export function getCurrentTimestamp() {
  return wasmModule.getCurrentTimestamp();
}

export function add(a, b) {
  return wasmModule.add(a, b);
}

// 导出generateNonce函数
export function generateNonce() {
  return wasmModule.generateNonce();
}

// 导出MD5哈希函数
export function md5Hash(input) {
  return wasmModule.md5Hash(input);
}

// 导出generateSign函数
export function generateSign(paramsJson, timestamp, nonce, secretKey) {
  // 将timestamp从number转换为bigint以匹配AssemblyScript的i64类型
  return wasmModule.generateSign(paramsJson, BigInt(timestamp), nonce, secretKey);
}

// 导出processRequest函数
export function processRequest(requestData, requestUrl, codecConfig, codecKey) {
  return wasmModule.processRequest(requestData, requestUrl, codecConfig, codecKey);
}

// 导出processResponse函数
export function processResponse(responseData, originKey, timestamp) {
  return wasmModule.processResponse(responseData, originKey, timestamp);
}

// 导出AES加密函数
export function encryptAES(data, key) {
  return wasmModule.encryptAES(data, key);
}

// 导出AES解密函数
export function decryptAES(value, key) {
  return wasmModule.decryptAES(value, key);
}

// Storage Key加密函数
export function encryptStorageKey(key, systemCode) {
  return wasmModule.encryptStorageKey(key, systemCode);
}

// Storage Value加密函数
export function encryptStorageValue(value, key, systemCode, storageKey, storageEncode) {
  return wasmModule.encryptStorageValue(value, key, systemCode, storageKey, storageEncode);
}

// Storage Value解密函数
export function decryptStorageValue(value, key, systemCode, storageKey, storageEncode) {
  return wasmModule.decryptStorageValue(value, key, systemCode, storageKey, storageEncode);
}