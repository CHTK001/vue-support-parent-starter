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
  try {
    if (!wasmLoaded) {
      // 降级到明文处理
      return request;
    }
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
  } catch (error) {
    console.error('WASM encryption failed:', error);
    // 降级到明文处理
    return request;
  }
}

// WASM版本的uu1函数
export function uu1_wasm(response) {
  try {
    if (!wasmLoaded) {
      // 降级到明文处理
      return response;
    }
    
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
  } catch (error) {
    console.warn('WASM decryption failed:', error);
    // 降级到明文处理
    return response;
  }
}

// WASM版本的uu3函数
export function uu3_wasm(value) {
  try {
    if (!wasmLoaded) {
      // 降级到明文处理
      return value;
    }
    
    if (!value || typeof value !== 'string') {
      return value;
    }
    
    return wasmModule.decryptAES(value, '1234567890Oil#@1');
  } catch (error) {
    console.debug('WASM AES decryption failed:', error);
    // 降级到明文处理
    return value;
  }
}

// WASM版本的uu4函数
export function uu4_wasm(response) {
  try {
    if (!wasmLoaded) {
      // 降级到明文处理
      return {};
    }
    
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
  } catch (error) {
    console.debug('WASM special decryption failed:', error);
    // 降级到明文处理
    return {};
  }
}

// 导出WASM模块的其他函数
export function getCurrentTimestamp() {
  try {
    if (!wasmLoaded) {
      // 降级到JavaScript实现
      return Date.now();
    }
    return wasmModule.getCurrentTimestamp();
  } catch (error) {
    console.error('WASM getCurrentTimestamp failed:', error);
    // 降级到JavaScript实现
    return Date.now();
  }
}

export function add(a, b) {
  try {
    if (!wasmLoaded) {
      // 降级到JavaScript实现
      return a + b;
    }
    return wasmModule.add(a, b);
  } catch (error) {
    console.error('WASM add failed:', error);
    // 降级到JavaScript实现
    return a + b;
  }
}

// 导出generateNonce函数
export function generateNonce() {
  try {
    if (!wasmLoaded) {
      // 降级到JavaScript实现
      return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }
    return wasmModule.generateNonce();
  } catch (error) {
    console.error('WASM generateNonce failed:', error);
    // 降级到JavaScript实现
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }
}

// 导出MD5哈希函数
export function md5Hash(input) {
  try {
    if (!wasmLoaded) {
      // 降级到JavaScript实现
      // 简化的MD5实现（实际项目中应使用完整的MD5算法）
      let hash = 0;
      for (let i = 0; i < input.length; i++) {
        const character = input.charCodeAt(i);
        hash = ((hash << 5) - hash) + character;
        hash = hash & 0x7fffffffffffffff; // 转换为64位有符号整数
      }
      // 转换为16进制字符串
      let hex = hash.toString(16);
      // 确保长度为32位，不足的前面补0
      while (hex.length < 32) {
        hex = "0" + hex;
      }
      // 如果超过32位，取前32位
      if (hex.length > 32) {
        hex = hex.substring(0, 32);
      }
      return hex;
    }
    return wasmModule.md5Hash(input);
  } catch (error) {
    console.error('WASM md5Hash failed:', error);
    // 降级到JavaScript实现
    // 简化的MD5实现（实际项目中应使用完整的MD5算法）
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const character = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + character;
      hash = hash & 0x7fffffffffffffff; // 转换为64位有符号整数
    }
    // 转换为16进制字符串
    let hex = hash.toString(16);
    // 确保长度为32位，不足的前面补0
    while (hex.length < 32) {
      hex = "0" + hex;
    }
    // 如果超过32位，取前32位
    if (hex.length > 32) {
      hex = hex.substring(0, 32);
    }
    return hex;
  }
}

// 导出generateSign函数
export function generateSign(paramsJson, timestamp, nonce, secretKey) {
  try {
    if (!wasmLoaded) {
      // 降级到JavaScript实现
      // 解析参数JSON字符串
      // 使用简单的键值对数组来存储参数
      const keys = [];
      const values = [];
      
      // 简化的参数解析（假设格式为 key1=value1&key2=value2 的形式）
      if (paramsJson.includes("=")) {
        const pairs = paramsJson.split("&");
        for (let i = 0; i < pairs.length; i++) {
          const pair = pairs[i];
          const eqIndex = pair.indexOf("=");
          if (eqIndex > 0) {
            const key = pair.substring(0, eqIndex);
            const value = pair.substring(eqIndex + 1);
            keys.push(key);
            values.push(value);
          }
        }
      }
      
      // 添加nonce和timestamp
      keys.push('_nonce');
      values.push(nonce);
      keys.push('_timestamp');
      values.push(timestamp.toString());
      
      // 简单排序（冒泡排序）
      for (let i = 0; i < keys.length - 1; i++) {
        for (let j = 0; j < keys.length - i - 1; j++) {
          if (keys[j] > keys[j + 1]) {
            // 交换键
            const tempKey = keys[j];
            keys[j] = keys[j + 1];
            keys[j + 1] = tempKey;
            
            // 交换值
            const tempValue = values[j];
            values[j] = values[j + 1];
            values[j + 1] = tempValue;
          }
        }
      }
      
      // 拼接参数字符串
      let paramString = "";
      for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        const value = values[i];
        if (value != null && value != "") {
          paramString += key + "=" + value + "&";
        }
      }
      
      // 移除末尾的&符号
      if (paramString.endsWith("&")) {
        paramString = paramString.substring(0, paramString.length - 1);
      }
      
      // 添加密钥
      const dataToSign = paramString + secretKey;
      
      // 生成MD5签名
      return md5Hash(dataToSign);
    }
    // 将timestamp从number转换为bigint以匹配AssemblyScript的i64类型
    return wasmModule.generateSign(paramsJson, BigInt(timestamp), nonce, secretKey);
  } catch (error) {
    console.error('WASM generateSign failed:', error);
    // 降级到JavaScript实现
    // 解析参数JSON字符串
    // 使用简单的键值对数组来存储参数
    const keys = [];
    const values = [];
    
    // 简化的参数解析（假设格式为 key1=value1&key2=value2 的形式）
    if (paramsJson.includes("=")) {
      const pairs = paramsJson.split("&");
      for (let i = 0; i < pairs.length; i++) {
        const pair = pairs[i];
        const eqIndex = pair.indexOf("=");
        if (eqIndex > 0) {
          const key = pair.substring(0, eqIndex);
          const value = pair.substring(eqIndex + 1);
          keys.push(key);
          values.push(value);
        }
      }
    }
    
    // 添加nonce和timestamp
    keys.push('_nonce');
    values.push(nonce);
    keys.push('_timestamp');
    values.push(timestamp.toString());
    
    // 简单排序（冒泡排序）
    for (let i = 0; i < keys.length - 1; i++) {
      for (let j = 0; j < keys.length - i - 1; j++) {
        if (keys[j] > keys[j + 1]) {
          // 交换键
          const tempKey = keys[j];
          keys[j] = keys[j + 1];
          keys[j + 1] = tempKey;
          
          // 交换值
          const tempValue = values[j];
          values[j] = values[j + 1];
          values[j + 1] = tempValue;
        }
      }
    }
    
    // 拼接参数字符串
    let paramString = "";
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      const value = values[i];
      if (value != null && value != "") {
        paramString += key + "=" + value + "&";
      }
    }
    
    // 移除末尾的&符号
    if (paramString.endsWith("&")) {
      paramString = paramString.substring(0, paramString.length - 1);
    }
    
    // 添加密钥
    const dataToSign = paramString + secretKey;
    
    // 生成MD5签名
    return md5Hash(dataToSign);
  }
}

// 导出processRequest函数
export function processRequest(requestData, requestUrl, codecConfig, codecKey) {
  try {
    if (!wasmLoaded) {
      // 降级到明文处理
      return requestData;
    }
    return wasmModule.processRequest(requestData, requestUrl, codecConfig, codecKey);
  } catch (error) {
    console.error('WASM processRequest failed:', error);
    // 降级到明文处理
    return requestData;
  }
}

// 导出processResponse函数
export function processResponse(responseData, originKey, timestamp) {
  try {
    if (!wasmLoaded) {
      // 降级到明文处理
      return responseData;
    }
    return wasmModule.processResponse(responseData, originKey, timestamp);
  } catch (error) {
    console.error('WASM processResponse failed:', error);
    // 降级到明文处理
    return responseData;
  }
}

// 导出AES加密函数
export function encryptAES(data, key) {
  try {
    if (!wasmLoaded) {
      // 降级到JavaScript实现
      // 简化的AES实现，仅用于演示目的
      let result = "";
      let keyIndex = 0;
      
      for (let i = 0; i < data.length; i++) {
        const charCode = data.charCodeAt(i);
        const keyChar = key.charCodeAt(keyIndex % key.length);
        keyIndex++;
        
        // 简单的XOR
        const encryptedChar = charCode ^ keyChar;
        result += String.fromCharCode(encryptedChar & 0xFF);
      }
      
      // Base64编码模拟
      return "AES_ENCRYPTED_" + result;
    }
    return wasmModule.encryptAES(data, key);
  } catch (error) {
    console.error('WASM encryptAES failed:', error);
    // 降级到JavaScript实现
    // 简化的AES实现，仅用于演示目的
    let result = "";
    let keyIndex = 0;
    
    for (let i = 0; i < data.length; i++) {
      const charCode = data.charCodeAt(i);
      const keyChar = key.charCodeAt(keyIndex % key.length);
      keyIndex++;
      
      // 简单的XOR
      const encryptedChar = charCode ^ keyChar;
      result += String.fromCharCode(encryptedChar & 0xFF);
    }
    
    // Base64编码模拟
    return "AES_ENCRYPTED_" + result;
  }
}

// 导出AES解密函数
export function decryptAES(value, key) {
  try {
    if (!wasmLoaded) {
      // 降级到JavaScript实现
      if (!value.startsWith("AES_ENCRYPTED_")) {
        return value;
      }
      
      const data = value.substring(14); // 移除前缀
      let result = "";
      let keyIndex = 0;
      
      for (let i = 0; i < data.length; i++) {
        const charCode = data.charCodeAt(i);
        const keyChar = key.charCodeAt(keyIndex % key.length);
        keyIndex++;
        
        // 简单的XOR（XOR的逆运算还是XOR）
        const decryptedChar = charCode ^ keyChar;
        result += String.fromCharCode(decryptedChar & 0xFF);
      }
      
      return result;
    }
    return wasmModule.decryptAES(value, key);
  } catch (error) {
    console.error('WASM decryptAES failed:', error);
    // 降级到JavaScript实现
    if (!value.startsWith("AES_ENCRYPTED_")) {
      return value;
    }
    
    const data = value.substring(14); // 移除前缀
    let result = "";
    let keyIndex = 0;
    
    for (let i = 0; i < data.length; i++) {
      const charCode = data.charCodeAt(i);
      const keyChar = key.charCodeAt(keyIndex % key.length);
      keyIndex++;
      
      // 简单的XOR（XOR的逆运算还是XOR）
      const decryptedChar = charCode ^ keyChar;
      result += String.fromCharCode(decryptedChar & 0xFF);
    }
    
    return result;
  }
}

// Storage Key加密函数
export function encryptStorageKey(key, systemCode) {
  try {
    if (!wasmLoaded) {
      // 降级到JavaScript实现
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
    return wasmModule.encryptStorageKey(key, systemCode);
  } catch (error) {
    console.error('WASM encryptStorageKey failed:', error);
    // 降级到JavaScript实现
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
export function encryptStorageValue(value, key, systemCode, storageKey, storageEncode) {
  try {
    if (!wasmLoaded) {
      // 降级到JavaScript实现
      if (!key || !value) {
        return value;
      }
      
      // 对于以responsiveStorageNameSpace开头的key，不进行加密
      if (key.startsWith("responsive-")) {
        return value;
      }
      
      // 如果启用了存储加密，则对值进行AES加密
      if (storageEncode) {
        // 简化的AES实现，仅用于演示目的
        let result = "";
        let keyIndex = 0;
        
        for (let i = 0; i < value.length; i++) {
          const charCode = value.charCodeAt(i);
          const keyChar = storageKey.charCodeAt(keyIndex % storageKey.length);
          keyIndex++;
          
          // 简单的XOR
          const encryptedChar = charCode ^ keyChar;
          result += String.fromCharCode(encryptedChar & 0xFF);
        }
        
        // Base64编码模拟
        return "AES_ENCRYPTED_" + result;
      }
      
      return value;
    }
    return wasmModule.encryptStorageValue(value, key, systemCode, storageKey, storageEncode);
  } catch (error) {
    console.error('WASM encryptStorageValue failed:', error);
    // 降级到JavaScript实现
    if (!key || !value) {
      return value;
    }
    
    // 对于以responsiveStorageNameSpace开头的key，不进行加密
    if (key.startsWith("responsive-")) {
      return value;
    }
    
    // 如果启用了存储加密，则对值进行AES加密
    if (storageEncode) {
      // 简化的AES实现，仅用于演示目的
      let result = "";
      let keyIndex = 0;
      
      for (let i = 0; i < value.length; i++) {
        const charCode = value.charCodeAt(i);
        const keyChar = storageKey.charCodeAt(keyIndex % storageKey.length);
        keyIndex++;
        
        // 简单的XOR
        const encryptedChar = charCode ^ keyChar;
        result += String.fromCharCode(encryptedChar & 0xFF);
      }
      
      // Base64编码模拟
      return "AES_ENCRYPTED_" + result;
    }
    
    return value;
  }
}

// Storage Value解密函数
export function decryptStorageValue(value, key, systemCode, storageKey, storageEncode) {
  try {
    if (!wasmLoaded) {
      // 降级到JavaScript实现
      if (!key || !value) {
        return value;
      }
      
      // 对于以responsiveStorageNameSpace开头的key，不进行解密
      if (key.startsWith("responsive-")) {
        return value;
      }
      
      // 如果启用了存储加密，则对值进行AES解密
      if (storageEncode) {
        if (!value.startsWith("AES_ENCRYPTED_")) {
          return value;
        }
        
        const data = value.substring(14); // 移除前缀
        let result = "";
        let keyIndex = 0;
        
        for (let i = 0; i < data.length; i++) {
          const charCode = data.charCodeAt(i);
          const keyChar = storageKey.charCodeAt(keyIndex % storageKey.length);
          keyIndex++;
          
          // 简单的XOR（XOR的逆运算还是XOR）
          const decryptedChar = charCode ^ keyChar;
          result += String.fromCharCode(decryptedChar & 0xFF);
        }
        
        return result;
      }
      
      return value;
    }
    return wasmModule.decryptStorageValue(value, key, systemCode, storageKey, storageEncode);
  } catch (error) {
    console.error('WASM decryptStorageValue failed:', error);
    // 降级到JavaScript实现
    if (!key || !value) {
      return value;
    }
    
    // 对于以responsiveStorageNameSpace开头的key，不进行解密
    if (key.startsWith("responsive-")) {
      return value;
    }
    
    // 如果启用了存储加密，则对值进行AES解密
    if (storageEncode) {
      if (!value.startsWith("AES_ENCRYPTED_")) {
        return value;
      }
      
      const data = value.substring(14); // 移除前缀
      let result = "";
      let keyIndex = 0;
      
      for (let i = 0; i < data.length; i++) {
        const charCode = data.charCodeAt(i);
        const keyChar = storageKey.charCodeAt(keyIndex % storageKey.length);
        keyIndex++;
        
        // 简单的XOR（XOR的逆运算还是XOR）
        const decryptedChar = charCode ^ keyChar;
        result += String.fromCharCode(decryptedChar & 0xFF);
      }
      
      return result;
    }
    
    return value;
  }
}