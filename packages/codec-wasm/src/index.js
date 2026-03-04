/**
 * WASM 加密模块桥接层
 * 提供 SM2/SM3/SM4/AES/MD5 等加密算法的 WASM 和 JS 双实现
 * @author CH
 * @version 3.0.0
 */
import * as jsImpl from "./js/codec.js";
import {
  encryptStorageValue as jsEncryptStorageValue,
  decryptStorageValue as jsDecryptStorageValue,
} from "./js/codec.js";

// ============ 模块状态 ============
let wasmLoaded = false;
let wasm = null;
let wasmInitPromise = null;

// ============ 工具函数 ============
const encoder = new TextEncoder();
const decoder = new TextDecoder();

/** 获取 C 字符串长度 */
const strlen = (ptr) => {
  if (!ptr || !wasm?.memory) return 0;
  const mem = new Uint8Array(wasm.memory.buffer);
  let len = 0;
  while (mem[ptr + len] !== 0 && len < 1000000) len++;
  return len;
};

/** 字符串写入 WASM */
const toWasm = (str) => {
  if (!wasm?.alloc) throw new Error("WASM 内存分配函数不存在");
  const bytes = encoder.encode(str);
  const ptr = wasm.alloc(bytes.length + 1);
  new Uint8Array(wasm.memory.buffer, ptr, bytes.length).set(bytes);
  new Uint8Array(wasm.memory.buffer)[ptr + bytes.length] = 0;
  return { ptr, len: bytes.length };
};

/** 从 WASM 读取字符串 */
const fromWasm = (ptr) => {
  if (!ptr || !wasm?.memory) return "";
  const len = strlen(ptr);
  return decoder.decode(new Uint8Array(wasm.memory.buffer, ptr, len));
};

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

/** 调用字符串参数的 WASM 函数（WASM 执行错误时抛出错误，不降级） */
const callStr = (fn, args) => {
  if (!wasmLoaded || !wasm) {
    throw new Error(`WASM 未加载，无法调用 ${fn}`);
  }

  const func = wasm[fn];
  if (!func) {
    throw new Error(`WASM 函数 ${fn} 不存在`);
  }

  try {
    const wasmArgs = args.flatMap((s) => {
      const { ptr, len } = toWasm(String(s));
      return [ptr, len];
    });
    return fromWasm(func(...wasmArgs));
  } catch (error) {
    throw new Error(`WASM 函数 ${fn} 执行错误: ${error.message}`);
  }
};

// ============ 初始化 ============

/**
 * 检查是否启用 WASM（从配置读取）
 * @returns {boolean}
 */
const checkWasmEnabled = () => {
  try {
    // 动态导入配置模块，避免循环依赖
    if (typeof window !== "undefined" && window.__APP_CONFIG__) {
      const config = window.__APP_CONFIG__;
      return config?.wasmEnable !== false;
    }
    // 如果无法获取配置，默认启用 WASM
    return true;
  } catch {
    return true;
  }
};

/**
 * 初始化 WASM 模块
 * 直接加载 codec_wasm_bg.wasm 文件，加载失败时降级到 JS
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

  // 检查配置，如果禁用 WASM，直接返回 null
  if (!checkWasmEnabled()) {
    console.log("[codec-wasm][初始化] WASM 已禁用，使用 JS 版本");
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
        const codecWasmModule = await import("../build/codec_wasm.js");
        const codecWasmInit = codecWasmModule.default || codecWasmModule.init;

        if (codecWasmInit) {
          // 直接传入 .wasm 文件路径，init 函数会加载它
          await codecWasmInit(wasmPath);
          // 使用 codecWasmModule 作为 wasm 对象，这样可以直接调用导出的函数
          wasm = codecWasmModule;
          wasmLoaded = true;
          console.log("[codec-wasm][初始化] WASM 模块加载成功");
          return wasm;
        }
      } catch (importError) {
        // 如果无法导入 codec_wasm.js，尝试直接使用 WebAssembly API 加载
        // 注意：这种方式可能无法正常工作，因为 wasm-bindgen 生成的 WASM 需要特定的导入
        console.warn(
          "[codec-wasm][初始化] 无法导入 codec_wasm.js，尝试直接加载 WASM 文件",
        );

        try {
          const response = await fetch(wasmPath);
          if (!response.ok) {
            throw new Error(
              `WASM 文件加载失败: ${response.status} ${response.statusText}`,
            );
          }

          // 尝试使用 instantiateStreaming
          let wasmModule;
          try {
            wasmModule = await WebAssembly.instantiateStreaming(response);
          } catch (streamError) {
            // 如果 instantiateStreaming 失败，尝试使用 instantiate
            const bytes = await fetch(wasmPath).then((r) => r.arrayBuffer());
            wasmModule = await WebAssembly.instantiate(bytes);
          }

          // 手动绑定函数（需要 WASM 导出的函数存在）
          if (wasmModule.instance?.exports) {
            wasm = {
              memory: wasmModule.instance.exports.memory,
              alloc: wasmModule.instance.exports.alloc,
              dealloc: wasmModule.instance.exports.dealloc,
              sm3_hash: wasmModule.instance.exports.sm3_hash,
              md5_hash: wasmModule.instance.exports.md5_hash,
              aes_encrypt: wasmModule.instance.exports.aes_encrypt,
              aes_decrypt: wasmModule.instance.exports.aes_decrypt,
              sm4_encrypt: wasmModule.instance.exports.sm4_encrypt,
              sm4_decrypt: wasmModule.instance.exports.sm4_decrypt,
              generate_sm2_key_pair:
                wasmModule.instance.exports.generate_sm2_key_pair,
              sm2_encrypt: wasmModule.instance.exports.sm2_encrypt,
              sm2_decrypt: wasmModule.instance.exports.sm2_decrypt,
              generate_nonce: wasmModule.instance.exports.generate_nonce,
              get_current_timestamp:
                wasmModule.instance.exports.get_current_timestamp,
              generate_sign: wasmModule.instance.exports.generate_sign,
              verify_sign: wasmModule.instance.exports.verify_sign,
              uu3_decrypt_simple:
                wasmModule.instance.exports.uu3_decrypt_simple,
              uu1_decrypt_response:
                wasmModule.instance.exports.uu1_decrypt_response,
              uu1_decrypt_response_object:
                wasmModule.instance.exports.uu1_decrypt_response_object,
              uu1_decrypt_response_object_with_arraybuffer:
                wasmModule.instance.exports
                  .uu1_decrypt_response_object_with_arraybuffer,
              uu2_encrypt_request:
                wasmModule.instance.exports.uu2_encrypt_request,
              uu2_process_request:
                wasmModule.instance.exports.uu2_process_request,
              uu4_decrypt_response:
                wasmModule.instance.exports.uu4_decrypt_response,
              encrypt_storage_key:
                wasmModule.instance.exports.encrypt_storage_key,
              encrypt_storage_value:
                wasmModule.instance.exports.encrypt_storage_value,
              decrypt_storage_value:
                wasmModule.instance.exports.decrypt_storage_value,
              custom_encrypt_with_codec_keypair:
                wasmModule.instance.exports.custom_encrypt_with_codec_keypair,
              font_encrypt_text: wasmModule.instance.exports.font_encrypt_text,
              font_decrypt_text: wasmModule.instance.exports.font_decrypt_text,
              font_is_encrypted_char:
                wasmModule.instance.exports.font_is_encrypted_char,
              font_get_mapped_char_count:
                wasmModule.instance.exports.font_get_mapped_char_count,
              font_get_maps: wasmModule.instance.exports.font_get_maps,
            };
            wasmLoaded = true;
            console.log("[codec-wasm][初始化] WASM 模块加载成功（直接加载）");
            return wasm;
          }
        } catch (directLoadError) {
          throw new Error(`直接加载 WASM 文件失败: ${directLoadError.message}`);
        }
      }

      throw new Error("无法初始化 WASM 模块");
    } catch (error) {
      // WASM 加载失败，降级到 JS，不抛出错误
      console.warn(
        `[codec-wasm][初始化] WASM 模块加载失败，降级到 JS 版本: ${error.message}`,
      );
      wasmLoaded = false;
      wasm = null;
      return null;
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
  if (wasmLoaded && wasm) {
    try {
      return callStr("sm3_hash", [data]);
    } catch (error) {
      throw error; // WASM 执行错误，抛出错误
    }
  }
  return jsImpl.sm3Hash(data); // WASM 未加载，降级到 JS
};

export const md5Hash = (data) => {
  if (wasmLoaded && wasm) {
    try {
      return callStr("md5_hash", [data]);
    } catch (error) {
      throw error; // WASM 执行错误，抛出错误
    }
  }
  return jsImpl.md5Hash(data); // WASM 未加载，降级到 JS
};

// ============ AES 加解密 ============

export const encryptAES = (data, key) => {
  if (wasmLoaded && wasm) {
    try {
      return callStr("aes_encrypt", [data, key]);
    } catch (error) {
      throw error; // WASM 执行错误，抛出错误
    }
  }
  return jsImpl.encryptAES(data, key); // WASM 未加载，降级到 JS
};

export const decryptAES = (data, key) => {
  if (wasmLoaded && wasm) {
    try {
      return callStr("aes_decrypt", [data, key]);
    } catch (error) {
      throw error; // WASM 执行错误，抛出错误
    }
  }
  return jsImpl.decryptAES(data, key); // WASM 未加载，降级到 JS
};

// ============ SM4 加解密 ============

export const encryptSM4 = (data, key) => {
  if (wasmLoaded && wasm) {
    try {
      return callStr("sm4_encrypt", [data, key]);
    } catch (error) {
      throw error; // WASM 执行错误，抛出错误
    }
  }
  return jsImpl.encryptSM4(data, key); // WASM 未加载，降级到 JS
};

export const decryptSM4 = (data, key) => {
  if (wasmLoaded && wasm) {
    try {
      return callStr("sm4_decrypt", [data, key]);
    } catch (error) {
      throw error; // WASM 执行错误，抛出错误
    }
  }
  return jsImpl.decryptSM4(data, key); // WASM 未加载，降级到 JS
};

// ============ SM2 加解密 ============

export const encryptSM2 = (data, pubKey) => {
  if (wasmLoaded && wasm) {
    try {
      return callStr("sm2_encrypt", [data, pubKey]);
    } catch (error) {
      throw error; // WASM 执行错误，抛出错误
    }
  }
  return jsImpl.encryptSM2(data, pubKey); // WASM 未加载，降级到 JS
};

export const decryptSM2 = (data, privKey) => {
  if (wasmLoaded && wasm) {
    try {
      return callStr("sm2_decrypt", [data, privKey]);
    } catch (error) {
      throw error; // WASM 执行错误，抛出错误
    }
  }
  return jsImpl.decryptSM2(data, privKey); // WASM 未加载，降级到 JS
};

export const generateSm2KeyPair = () => {
  if (wasmLoaded && wasm) {
    try {
      return fromWasm(wasm.generate_sm2_key_pair());
    } catch (error) {
      throw error; // WASM 执行错误，抛出错误
    }
  }
  return jsImpl.generateSm2KeyPair(); // WASM 未加载，降级到 JS
};

// ============ 签名函数 ============

export const generateSign = (data, privateKey) => {
  if (wasmLoaded && wasm) {
    try {
      return callStr("generate_sign", [data, privateKey]);
    } catch (error) {
      throw error; // WASM 执行错误，抛出错误
    }
  }
  return jsImpl.generateSign(data, privateKey); // WASM 未加载，降级到 JS
};

export const verifySign = (data, sig, pubKey) => {
  if (wasmLoaded && wasm) {
    try {
      const d = toWasm(data),
        s = toWasm(sig),
        p = toWasm(pubKey);
      return wasm.verify_sign(d.ptr, d.len, s.ptr, s.len, p.ptr, p.len);
    } catch (error) {
      throw error; // WASM 执行错误，抛出错误
    }
  }
  return jsImpl.verifySign(data, sig, pubKey); // WASM 未加载，降级到 JS
};

// ============ 工具函数 ============

export const generateNonce = () => {
  if (wasmLoaded && wasm?.generate_nonce) {
    try {
      // wasm.generate_nonce() 现在是 wasm-bindgen 生成的绑定函数，直接返回字符串
      return wasm.generate_nonce();
    } catch (error) {
      throw error; // WASM 执行错误，抛出错误
    }
  }
  return jsImpl.generateNonce(); // WASM 未加载，降级到 JS
};

export const getCurrentTimestamp = () => {
  if (wasmLoaded && wasm) {
    try {
      return call("get_current_timestamp");
    } catch (error) {
      throw error; // WASM 执行错误，抛出错误
    }
  }
  return jsImpl.getCurrentTimestamp(); // WASM 未加载，降级到 JS
};

export const add = (a, b) => {
  if (wasmLoaded && wasm) {
    try {
      return call("add", a, b);
    } catch (error) {
      throw error; // WASM 执行错误，抛出错误
    }
  }
  return jsImpl.add(a, b); // WASM 未加载，降级到 JS
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

  // 未启用存储加密或缺少密钥时直接透传原文
  if (!encodeFlag || encodeFlag === "false" || !safeStorageKey) {
    return safeValue;
  }

  if (wasmLoaded && wasm) {
    try {
      const result = callStr("encrypt_storage_value", [
        safeValue,
        safeKey,
        safeSystemCode,
        safeStorageKey,
        encodeFlag,
      ]);
      // WASM 返回空字符串时直接回退为明文
      return result || safeValue;
    } catch (error) {
      throw error; // WASM 执行错误，抛出错误
    }
  }

  // WASM 未加载，降级到 JS
  return jsEncryptStorageValue(
    value,
    key,
    systemCode,
    storageKey,
    storageEncode,
  );
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

  if (wasmLoaded && wasm) {
    try {
      const result = callStr("decrypt_storage_value", [
        safeValue,
        safeKey,
        safeSystemCode,
        safeStorageKey,
        encodeFlag,
      ]);
      // 解密失败或返回空串时直接返回原始值
      return result || safeValue;
    } catch (error) {
      throw error; // WASM 执行错误，抛出错误
    }
  }

  // WASM 未加载，降级到 JS
  return jsDecryptStorageValue(
    value,
    key,
    systemCode,
    storageKey,
    storageEncode,
  );
};

// ============ UU 系列函数 (WASM 版本) ============

/** UU1 - 响应解密 */
export function uu1(response) {
  if (wasmLoaded && wasm?.uu1_decrypt_response_object_with_arraybuffer) {
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

  // WASM 未加载，降级到 JS
  return jsImpl.uu1(response);
}

/** UU2 - 请求加密 */
export function uu2_wasm(request) {
  if (wasmLoaded && wasm?.uu2_process_request) {
    try {
      return wasm.uu2_process_request(request);
    } catch (error) {
      throw error; // WASM 执行错误，抛出错误
    }
  }

  // WASM 未加载，降级到 JS
  return jsImpl.uu2_wasm(request);
}

/** UU3 - 固定密钥解密 */
export function uu3(encryptedData) {
  if (wasmLoaded && wasm) {
    try {
      const { ptr, len } = toWasm(encryptedData);
      return fromWasm(wasm.uu3_decrypt_simple(ptr, len));
    } catch (error) {
      throw error; // WASM 执行错误，抛出错误
    }
  }

  // WASM 未加载，降级到 JS
  return jsImpl.uu3(encryptedData);
}

/** UU4 - 响应解密 */
export function uu4(responseData) {
  if (wasmLoaded && wasm) {
    try {
      const d = toWasm(responseData.data);
      const u = toWasm(responseData.uuid || "");
      const t = toWasm(responseData.timestamp || "");
      return fromWasm(
        wasm.uu4_decrypt_response(d.ptr, d.len, u.ptr, u.len, t.ptr, t.len),
      );
    } catch (error) {
      throw error; // WASM 执行错误，抛出错误
    }
  }

  // WASM 未加载，降级到 JS
  return jsImpl.uu4(responseData);
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
  if (wasmLoaded && wasm) {
    try {
      const { ptr, len } = toWasm(text);
      return fromWasm(
        wasm.font_encrypt_text(ptr, len, encryptNumbers, encryptChinese),
      );
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
  if (wasmLoaded && wasm) {
    try {
      const { ptr, len } = toWasm(text);
      return fromWasm(wasm.font_decrypt_text(ptr, len));
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
  if (wasmLoaded && wasm) {
    try {
      const { ptr, len } = toWasm(char);
      return wasm.font_is_encrypted_char(ptr, len);
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
  if (wasmLoaded && wasm) {
    try {
      const result = fromWasm(wasm.font_get_mapped_char_count());
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
  if (wasmLoaded && wasm) {
    try {
      const result = fromWasm(wasm.font_get_maps());
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
    initializeWasmModule,
    isWasmLoaded,
    // 统一接口（自动降级）
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
