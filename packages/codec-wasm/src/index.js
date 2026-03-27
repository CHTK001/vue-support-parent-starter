/**
 * WASM 加密模块桥接层
 * 支持三种模式：wasm（强制WASM）、js（强制JS）、auto（自动降级）
 * @author CH
 * @version 3.1.0
 */

// ============ 加密模式枚举 ============
export const CodecMode = {
  WASM: 'wasm',    // 强制使用 WASM，失败时抛出错误
  JS: 'js',        // 强制使用 JS 实现
  AUTO: 'auto'     // 自动模式：优先 WASM，失败时降级到 JS
};

// ============ 模块状态 ============
let wasmLoaded = false;
let wasm = null; // wasm-bindgen 生成的绑定模块（包含导出的函数）
let wasmInstance = null; // WASM 实例（用于内存访问，虽然使用 wasm-bindgen 时通常不需要）
let wasmInitPromise = null;
let currentMode = CodecMode.AUTO; // 默认自动模式

/**
 * 设置加密模式
 * @param {string} mode - 'wasm' | 'js' | 'auto'
 */
export const setCodecMode = (mode) => {
  if (!Object.values(CodecMode).includes(mode)) {
    console.warn(`[codec-wasm] 无效的模式: ${mode}，使用默认模式 auto`);
    currentMode = CodecMode.AUTO;
    return;
  }
  currentMode = mode;
  console.log(`[codec-wasm] 加密模式已设置为: ${mode}`);
};

/**
 * 获取当前加密模式
 * @returns {string}
 */
export const getCodecMode = () => currentMode;

/** 调用 WASM 函数（WASM 执行错误时抛出错误，不降级） */
const call = (fn, ...args) => {
  if (!wasmLoaded || !wasm) {
    throw new Error(`WASM 未加载，无法调用 ${fn}`);
  }
  if (!wasm[fn]) {
    throw new Error(`WASM 函数 ${fn} 不存在`);
  }
  try {
    return wasm[fn](...args);
  } catch (error) {
    throw new Error(`WASM 函数 ${fn} 执行错误: ${error.message}`);
  }
};

// ============ 初始化 ============

/**
 * 判断是否应该加载 WASM
 */
const shouldLoadWasm = () => {
  if (currentMode === CodecMode.JS) {
    return false;
  }
  // wasm 和 auto 模式都尝试加载
  return true;
};

/**
 * 初始化 WASM 模块
 * 根据当前模式决定是否加载 WASM
 *
 * @returns {Promise<object|null>} WASM 模块对象，加载失败返回 null
 */
export const initializeWasmModule = async () => {
  if (wasmLoaded) {
    return wasm;
  }

  if (wasmInitPromise) {
    return await wasmInitPromise;
  }

  // 检查是否应该加载 WASM
  if (!shouldLoadWasm()) {
    console.log(`[codec-wasm][初始化] 当前模式为 ${currentMode}，跳过 WASM 加载`);
    wasmLoaded = false;
    wasm = null;
    return null;
  }

  wasmInitPromise = (async () => {
    try {
      // 直接加载 .wasm 文件路径
      const wasmPath = new URL("../build/codec_wasm_bg.wasm", import.meta.url)
        .href;

      // 尝试导入 codec_wasm.js 来获取 init 函数
      // init 函数会直接加载 .wasm 文件并绑定所有函数
      try {
        // 使用动态路径避免 Vite 在构建时检查文件是否存在
        const modulePath = "../build/" + "codec_wasm.js";
        const codecWasmModule = await import(/* @vite-ignore */ modulePath);
        const codecWasmInit = codecWasmModule.default || codecWasmModule.init;

        if (codecWasmInit) {
          // 直接传入 .wasm 文件路径，init 函数会加载它
          const initResult = await codecWasmInit({ module_or_path: wasmPath });
          // 保存绑定模块（用于调用导出的函数）
          wasm = codecWasmModule;
          // 保存 WASM 实例（用于内存访问，虽然使用 wasm-bindgen 时通常不需要）
          wasmInstance = initResult;
          wasmLoaded = true;
          console.log("[codec-wasm][初始化] WASM 模块加载成功");
          return wasm;
        }
      } catch (importError) {
        console.error(
          "[codec-wasm][初始化] 无法导入 codec_wasm.js:",
          importError,
        );
        throw importError;
      }

      throw new Error("无法初始化 WASM 模块");
    } catch (error) {
      // 根据模式决定如何处理错误
      if (currentMode === CodecMode.WASM) {
        // wasm 模式：抛出错误，不降级
        console.error(`[codec-wasm][初始化] WASM 模式下加载失败: ${error.message}`);
        throw error;
      } else {
        // auto 模式：降级到 JS
        console.warn(
          `[codec-wasm][初始化] WASM 模块加载失败，降级到 JS 版本: ${error.message}`,
        );
        wasmLoaded = false;
        wasm = null;
        return null;
      }
    } finally {
      // 允许失败后重试；成功时 wasmLoaded=true，后续会直接返回 wasm
      wasmInitPromise = null;
    }
  })();

  return await wasmInitPromise;
};

/** 检查 WASM 是否已加载 */
export const isWasmLoaded = () => wasmLoaded;

// ============ 哈希函数 ============

export const sm3Hash = (data) => {
  if (!wasmLoaded || !wasm?.sm3_hash) {
    throw new Error("WASM 未就绪，无法执行 sm3Hash");
  }
  try {
    const result = wasm.sm3_hash(data);
    // wasm-bindgen 理论上返回字符串，这里做兼容处理，避免异常中断
    if (result == null) {
      throw new Error("WASM sm3_hash 返回结果为空");
    }
    const str = typeof result === "string" ? result : String(result);
    if (!str) {
      throw new Error("WASM sm3_hash 返回空串");
    }
    return str;
    } catch (error) {
      throw error; // WASM 执行错误，抛出错误
    }
};

export const md5Hash = (data) => {
  if (!wasmLoaded || !wasm?.md5_hash) {
    throw new Error("WASM 未就绪，无法执行 md5Hash");
  }
  try {
    const result = wasm.md5_hash(data);
    // wasm-bindgen 理论上返回字符串，这里做兼容处理，避免异常中断
    if (result == null) {
      throw new Error("WASM md5_hash 返回结果为空");
    }
    const str = typeof result === "string" ? result : String(result);
    if (!str) {
      throw new Error("WASM md5_hash 返回空串");
    }
    return str;
    } catch (error) {
      throw error; // WASM 执行错误，抛出错误
    }
};

// ============ AES 加解密 ============

export const encryptAES = (data, key) => {
  if (!wasmLoaded || !wasm?.aes_encrypt) {
    throw new Error("WASM 未就绪，无法执行 AES 加密");
  }
    try {
      return wasm.aes_encrypt(data, key);
    } catch (error) {
      throw error;
    }
};

export const decryptAES = (data, key) => {
  if (!wasmLoaded || !wasm?.aes_decrypt) {
    throw new Error("WASM 未就绪，无法执行 AES 解密");
  }
    try {
      return wasm.aes_decrypt(data, key);
    } catch (error) {
      throw error;
    }
};

// ============ SM4 加解密 ============

export const encryptSM4 = (data, key) => {
  if (!wasmLoaded || !wasm?.sm4_encrypt) {
    throw new Error("WASM 未就绪，无法执行 SM4 加密");
  }
    try {
      return wasm.sm4_encrypt(data, key);
    } catch (error) {
      throw error;
    }
};

export const decryptSM4 = (data, key) => {
  if (!wasmLoaded || !wasm?.sm4_decrypt) {
    throw new Error("WASM 未就绪，无法执行 SM4 解密");
  }
    try {
      return wasm.sm4_decrypt(data, key);
    } catch (error) {
      throw error;
    }
};

// ============ SM2 加解密 ============

export const encryptSM2 = (data, pubKey) => {
  if (!wasmLoaded || !wasm?.sm2_encrypt) {
    throw new Error("WASM 未就绪，无法执行 SM2 加密");
  }
    try {
      return wasm.sm2_encrypt(data, pubKey);
    } catch (error) {
      throw error;
    }
};

export const decryptSM2 = (data, privKey) => {
  if (!wasmLoaded || !wasm?.sm2_decrypt) {
    throw new Error("WASM 未就绪，无法执行 SM2 解密");
  }
    try {
      return wasm.sm2_decrypt(data, privKey);
    } catch (error) {
      throw error;
    }
};

export const generateSm2KeyPair = () => {
  if (!wasmLoaded || !wasm?.generate_sm2_key_pair) {
    throw new Error("WASM 未就绪，无法生成 SM2 密钥对");
  }
    try {
      return wasm.generate_sm2_key_pair();
    } catch (error) {
      throw error; // WASM 执行错误,抛出错误
    }
};

// ============ 签名函数 ============

export const generateSign = (data, privateKey) => {
  if (!wasmLoaded || !wasm?.generate_sign) {
    throw new Error("WASM 未就绪，无法执行签名");
  }
    try {
      return wasm.generate_sign(data, privateKey);
    } catch (error) {
      throw error;
    }
};

export const verifySign = (data, sig, pubKey) => {
  if (!wasmLoaded || !wasm?.verify_sign) {
    throw new Error("WASM 未就绪，无法执行验签");
  }
    try {
      return wasm.verify_sign(data, sig, pubKey);
    } catch (error) {
      throw error; // WASM 执行错误，抛出错误
    }
};

// ============ 工具函数 ============

export const generateNonce = () => {
  if (!wasmLoaded || !wasm?.generate_nonce) {
    throw new Error("WASM 未就绪，无法生成随机串");
  }
    try {
      // wasm.generate_nonce() 现在是 wasm-bindgen 生成的绑定函数，直接返回字符串
      return wasm.generate_nonce();
    } catch (error) {
      throw error; // WASM 执行错误，抛出错误
    }
};

export const getCurrentTimestamp = () => {
  if (!wasmLoaded || !wasm) {
    throw new Error("WASM 未就绪，无法获取时间戳");
  }
    try {
      return call("get_current_timestamp");
    } catch (error) {
      throw error; // WASM 执行错误，抛出错误
    }
};

export const add = (a, b) => {
  if (!wasmLoaded || !wasm) {
    throw new Error("WASM 未就绪，无法执行加法运算");
  }
    try {
      return call("add", a, b);
    } catch (error) {
      throw error; // WASM 执行错误，抛出错误
    }
};

// ============ 存储加解密 ============

export const encryptStorageKey = (key, systemCode) => systemCode + key;

export const encryptStorageValue = (
  value,
  key,
  systemCode,
  storageKey,
  storageEncode,
) => {
  const safeValue = value ?? "";
  const safeKey = key ?? "";
  const safeSystemCode = systemCode ?? "";
  const safeStorageKey = storageKey ?? "";
  const encodeFlag = String(storageEncode ?? "");

  // 未启用存储加密或缺少必要参数时直接透传原文
  if (!encodeFlag || encodeFlag === "false" || !safeStorageKey) {
    return safeValue;
  }

  if (!wasmLoaded || !wasm?.encrypt_storage_value) {
    // WASM 未就绪时降级：直接返回原文（不加密）
    console.warn("[codec-wasm] WASM 未就绪，存储加密降级为明文");
    return safeValue;
  }
    try {
      const result = wasm.encrypt_storage_value(
        safeValue,
        safeKey,
        safeSystemCode,
        safeStorageKey,
        encodeFlag,
      );
    // 与 JS 版本行为对齐：WASM 返回空时回退为原文
      return result || safeValue;
    } catch (error) {
      throw error;
    }
};

export const decryptStorageValue = (
  value,
  key,
  systemCode,
  storageKey,
  storageEncode,
) => {
  const safeValue = value ?? "";
  const safeKey = key ?? "";
  const safeSystemCode = systemCode ?? "";
  const safeStorageKey = storageKey ?? "";
  const encodeFlag = String(storageEncode ?? "");

  // 未启用存储加密或缺少密钥时直接返回原始值
  if (!encodeFlag || encodeFlag === "false" || !safeStorageKey) {
    return safeValue;
  }

  if (!wasmLoaded || !wasm?.decrypt_storage_value) {
    // WASM 未就绪时降级：直接返回原文（不解密）
    console.warn("[codec-wasm] WASM 未就绪，存储解密降级为明文");
    return safeValue;
  }
    try {
      const result = wasm.decrypt_storage_value(
        safeValue,
        safeKey,
        safeSystemCode,
        safeStorageKey,
        encodeFlag,
      );
    // 直接返回 WASM 结果，如果为空则返回原始值
      return result || safeValue;
    } catch (error) {
      throw error;
    }
};

// ============ UU 系列函数 (WASM 版本) ============

/** UU1 - 响应解密 */
export function uu1(response) {
  if (!wasmLoaded || !wasm?.uu1_decrypt_response_object_with_arraybuffer) {
    throw new Error("WASM 未就绪，无法执行 UU1 响应解密");
  }
    try {
      const { data, headers } = response;
      if (!(data instanceof Blob)) return response;

      const contentType = headers?.["content-type"] || "";

      if (contentType.includes("application/octet-stream")) {
        return data.arrayBuffer().then((buffer) =>
          wasm.uu1_decrypt_response_object_with_arraybuffer({
            ...response,
            data: buffer,
          }),
        );
      }

      if (contentType.includes("application/json")) {
        return data.text().then((text) => {
          try {
            return { ...response, data: JSON.parse(text) };
          } catch {
            return { ...response, data: text };
          }
        });
      }

      if (contentType.includes("text/")) {
        return data.text().then((text) => ({ ...response, data: text }));
      }

      return response;
    } catch (error) {
      throw error; // WASM 执行错误，抛出错误
    }
}

/** UU2 - 请求加密 */
export function uu2_wasm(request) {
  if (!wasmLoaded || !wasm?.uu2_process_request) {
    throw new Error("WASM 未就绪，无法执行 UU2 请求加密");
  }
    try {
      return wasm.uu2_process_request(request);
    } catch (error) {
      throw error; // WASM 执行错误，抛出错误
    }
}

/** UU3 - 固定密钥解密 */
export function uu3(encryptedData) {
  if (!wasmLoaded || !wasm?.uu3_decrypt_simple) {
    throw new Error("WASM 未就绪，无法执行 UU3 解密");
  }
    try {
      return wasm.uu3_decrypt_simple(encryptedData);
    } catch (error) {
      throw error; // WASM 执行错误，抛出错误
    }
}

/** UU4 - 响应解密 */
export function uu4(responseData) {
  if (!wasmLoaded || !wasm?.uu4_decrypt_response) {
    throw new Error("WASM 未就绪，无法执行 UU4 解密");
  }
    try {
      return wasm.uu4_decrypt_response(
        responseData.data,
        responseData.uuid || "",
        responseData.timestamp || "",
      );
    } catch (error) {
      throw error; // WASM 执行错误，抛出错误
    }
}

// 别名
export const uu1_wasm = uu1;
export const uu3_wasm = uu3;
export const uu4_wasm = uu4;

// ============ 字体加密函数（内部 API，供 @repo/font-encryption 使用） ============

/**
 * 字体加密文本
 * @internal 仅供 @repo/font-encryption 模块使用
 */
export const fontEncryptText = (
  text,
  encryptNumbers = true,
  encryptChinese = true,
) => {
  if (wasmLoaded && wasm?.font_encrypt_text) {
    try {
      return wasm.font_encrypt_text(text, encryptNumbers, encryptChinese);
    } catch (error) {
      throw error; // WASM 执行错误，抛出错误
    }
  }
  throw new Error("字体加密功能需要 WASM 支持");
};

/**
 * 字体解密文本
 * @internal 仅供 @repo/font-encryption 模块使用
 */
export const fontDecryptText = (text) => {
  if (wasmLoaded && wasm?.font_decrypt_text) {
    try {
      return wasm.font_decrypt_text(text);
    } catch (error) {
      throw error; // WASM 执行错误，抛出错误
    }
  }
  throw new Error("字体解密功能需要 WASM 支持");
};

/**
 * 检查字符是否为加密字符
 * @internal 仅供 @repo/font-encryption 模块使用
 */
export const fontIsEncryptedChar = (char) => {
  if (wasmLoaded && wasm?.font_is_encrypted_char) {
    try {
      return wasm.font_is_encrypted_char(char);
    } catch (error) {
      throw error; // WASM 执行错误，抛出错误
    }
  }
  throw new Error("字体加密字符检查功能需要 WASM 支持");
};

/**
 * 获取映射字符数量
 * @internal 仅供 @repo/font-encryption 模块使用
 */
export const fontGetMappedCharCount = () => {
  if (wasmLoaded && wasm?.font_get_mapped_char_count) {
    try {
      const result = wasm.font_get_mapped_char_count();
      try {
        return JSON.parse(result);
      } catch {
        return { numbers: 0, chinese: 0 };
      }
    } catch (error) {
      throw error; // WASM 执行错误，抛出错误
    }
  }
  throw new Error("字体映射字符数量获取功能需要 WASM 支持");
};

/**
 * 获取映射表
 * @internal 仅供 @repo/font-encryption 模块使用
 */
export const fontGetMaps = () => {
  if (wasmLoaded && wasm?.font_get_maps) {
    try {
      const result = wasm.font_get_maps();
      try {
        return JSON.parse(result);
      } catch {
        return {
          numberMap: {},
          chineseMap: {},
          reverseNumberMap: {},
          reverseChineseMap: {},
        };
      }
    } catch (error) {
      throw error; // WASM 执行错误，抛出错误
    }
  }
  throw new Error("字体映射表获取功能需要 WASM 支持");
};

// ============ 全局挂载 ============

if (typeof window !== "undefined") {
  window.codecWasm = {
    // 模式控制
    CodecMode,
    setCodecMode,
    getCodecMode,
    // 初始化
    initializeWasmModule,
    isWasmLoaded,
    // 统一接口（根据模式使用 WASM 或 JS 实现）
    sm3Hash,
    md5Hash,
    encryptAES,
    decryptAES,
    encryptSM4,
    decryptSM4,
    encryptSM2,
    decryptSM2,
    generateSm2KeyPair,
    generateSign,
    verifySign,
    generateNonce,
    getCurrentTimestamp,
    add,
    encryptStorageKey,
    encryptStorageValue,
    decryptStorageValue,
    uu1,
    uu1_wasm,
    uu2_wasm,
    uu3,
    uu3_wasm,
    uu4,
    uu4_wasm,
  };
}

export default wasm;
