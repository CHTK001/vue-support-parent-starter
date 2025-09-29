// codec-wasm JavaScript包装器

let wasmModule = null;
let wasmLoaded = false;

// 加载WASM模块（同步方式）
function loadWasm() {
  if (wasmLoaded) {
    return wasmModule;
  }

  try {
    // 同步方式加载WASM模块
    // 注意：在浏览器环境中，我们需要确保WASM文件可以通过fetch加载
    // 在Node.js环境中，我们需要使用动态导入
    if (typeof window !== 'undefined' || typeof importScripts !== 'undefined') {
      // 浏览器或Web Worker环境
      // 直接返回已编译的WASM模块，避免使用顶级await
      throw new Error('Browser environment requires asynchronous loading');
    } else {
      // Node.js环境
      // 在Node.js环境中，我们需要动态导入ES模块
      throw new Error('Node.js environment not supported for synchronous loading');
    }
  } catch (error) {
    console.error('Failed to load WASM module:', error);
    throw new Error('Failed to load codec WASM module: ' + error.message);
  }
}

// 初始化函数（异步方式）
export async function initWasm() {
  if (wasmLoaded) {
    return true;
  }

  try {
    // 异步加载WASM模块
    if (typeof window !== 'undefined' || typeof importScripts !== 'undefined') {
      // 浏览器或Web Worker环境
      const wasm = await import('../build/release.js');
      wasmModule = wasm; // 这里wasm已经是包含所有导出函数的对象
      wasmLoaded = true;
      console.log('Codec WASM module loaded successfully');
      return true;
    } else {
      // Node.js环境
      throw new Error('Node.js environment not supported');
    }
  } catch (error) {
    console.error('Failed to initialize codec WASM:', error);
    throw error;
  }
}

// 检查WASM是否已加载
export function isWasmLoaded() {
  return wasmLoaded;
}

// 确保WASM已加载的辅助函数
function ensureWasmLoaded() {
  initWasm();
}

// WASM版本的uu2函数（同步方式）
export function uu2_wasm(requestFunc, getConfig) {
  ensureWasmLoaded();
  // 直接调用WASM函数，不进行任何逻辑处理
  return wasmModule.uu2_wasm(requestFunc, getConfig);
}

// WASM版本的uu1函数（同步方式）
export function uu1_wasm(responseFunc) {
  ensureWasmLoaded();
  // 直接调用WASM函数，不进行任何逻辑处理
  return wasmModule.uu1_wasm(responseFunc);
}

// WASM版本的uu3函数（同步方式）
export function uu3_wasm(value, getConfig) {
  ensureWasmLoaded();
  // 直接调用WASM函数，不进行任何逻辑处理
  return wasmModule.uu3_wasm(value, getConfig);
}

// WASM版本的uu4函数（同步方式）
export function uu4_wasm(responseFunc) {
  ensureWasmLoaded();
  // 直接调用WASM函数，不进行任何逻辑处理
  return wasmModule.uu4_wasm(responseFunc);
}

// 导出WASM模块的其他函数（同步方式）
export function getCurrentTimestamp() {
  ensureWasmLoaded();
  return wasmModule.getCurrentTimestamp();
}

export function add(a, b) {
  ensureWasmLoaded();
  return wasmModule.add(a, b);
}

// 导出generateNonce函数（同步方式）
export function generateNonce() {
  ensureWasmLoaded();
  return wasmModule.generateNonce();
}

// 导出MD5哈希函数（同步方式）
export function md5Hash(input) {
  ensureWasmLoaded();
  return wasmModule.md5Hash(input);
}

// 导出generateSign函数（同步方式）
export function generateSign(paramsJson, timestamp, nonce, secretKey) {
  ensureWasmLoaded();
  // 将timestamp从number转换为bigint以匹配AssemblyScript的i64类型
  return wasmModule.generateSign(paramsJson, BigInt(timestamp), nonce, secretKey);
}

// 导出processRequest函数（同步方式）
export function processRequest(requestData, requestUrl, codecConfig, codecKey) {
  ensureWasmLoaded();
  return wasmModule.processRequest(requestData, requestUrl, codecConfig, codecKey);
}

// 导出processResponse函数（同步方式）
export function processResponse(responseData, originKey, timestamp) {
  ensureWasmLoaded();
  return wasmModule.processResponse(responseData, originKey, timestamp);
}

// 导出AES加密函数（同步方式）
export function encryptAES(data, key) {
  ensureWasmLoaded();
  return wasmModule.encryptAES(data, key);
}

// 导出AES解密函数（同步方式）
export function decryptAES(value, key) {
  ensureWasmLoaded();
  return wasmModule.decryptAES(value, key);
}

// Storage Key加密函数（同步方式）
export function encryptStorageKey(key, systemCode) {
  ensureWasmLoaded();
  return wasmModule.encryptStorageKey(key, systemCode);
}

// Storage Value加密函数（同步方式）
export function encryptStorageValue(value, key, systemCode, storageKey, storageEncode) {
  ensureWasmLoaded();
  return wasmModule.encryptStorageValue(value, key, systemCode, storageKey, storageEncode);
}

// Storage Value解密函数（同步方式）
export function decryptStorageValue(value, key, systemCode, storageKey, storageEncode) {
  ensureWasmLoaded();
  return wasmModule.decryptStorageValue(value, key, systemCode, storageKey, storageEncode);
}