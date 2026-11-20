/**
 * 请求体编解码（对齐后端 ApiRequestDecodeRegister / Codec SPI 协议）
 *
 * 后端 `plugin.api.decode` 开启后，`ApiRequestDecodeBodyAdvice` 对携带
 * `access-control-origin-key` 头的请求体做解密：
 *  - codecType 含 "aes" → `AesCbcCodec`：aesKey = SHA-256(key)（32 字节，AES-256），
 *    iv = SHA-256(key) 前 16 字节，AES/CBC/PKCS5Padding 解密，线上载荷为 hex 字符串；
 *  - codecType 为 "hex"（或未配置密钥）→ 仅十六进制编码，属兼容路径；
 *  - keylog → k2 一次性会话密钥帧（"k2:" + hex），编排见 core 的 httpCrypto，
 *    本模块只负责 aes / hex 两条路径；
 *  - sm4 / des 后端已是真实加密（SPI 实现），前端尚未实现对应算法，
 *    这里显式抛错而不是悄悄发 hex 明文。
 *
 * 载荷形态（后端 `extractEncryptedPayload`）：不以 `{` / `[` 开头的原始 body 文本
 * 即视为密文，故前端直接发送 hex 字符串即可，无需 `{"data": "..."}` 包装。
 *
 * 加密实现经 cryptoBridge 走 wasm（cryptoAesEncryptHex 与 Java AES/CBC/PKCS5Padding
 * 逐字节一致，已用原生单测 + Java 交叉验证）；桥未安装时回退 CryptoJS 兼容路径。
 */
import CryptoJS from "crypto-js";
import { getWasmCryptoBridge, warnBridgeMissing } from "./cryptoBridge";

/** SHA-256 摘要（hex，与 Java MessageDigest SHA-256 一致；不依赖 crypto.subtle，非安全上下文可用） */
export function sha256Hex(input: string): string {
  const bridge = getWasmCryptoBridge();
  if (bridge) {
    return bridge.sha256Hex(input);
  }
  warnBridgeMissing("sha256Hex");
  return CryptoJS.SHA256(input).toString();
}

/** UTF-8 文本 → 小写 hex（兼容路径用，纯编码无加密） */
function utf8ToHex(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let out = "";
  for (const b of bytes) {
    out += b.toString(16).padStart(2, "0");
  }
  return out;
}

/** hex → UTF-8 文本（兼容路径用；非法 hex 抛错） */
function hexToUtf8(hex: string): string {
  if (!/^[0-9a-fA-F]*$/.test(hex) || hex.length % 2 !== 0) {
    throw new Error("非法 hex 载荷");
  }
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return new TextDecoder().decode(bytes);
}

/** 编解码配置（与后端 plugin.api.decode.codec-type / codec-request-key 对齐） */
export interface RequestCodecOptions {
  /** 编解码类型：含 aes 走 AES-256-CBC；hex 为显式编码；keylog 由 core 编排；sm4/des 前端未实现，会直接报错 */
  type: string;
  /** 编解码密钥（后端 codec-request-key） */
  key: string;
}

/**
 * 按后端协议编码请求体，返回线上传输的 hex 字符串。
 *
 * @param plaintext JSON 明文字符串
 * @param options  编解码配置
 * @returns hex 编码的载荷（后端 decodeHex 的输入）
 */
export function encodeRequestBody(plaintext: string, options: RequestCodecOptions): string {
  const type = (options.type ?? "").toLowerCase();
  if (!type || type === "hex") {
    // 未配置密钥时的显式兼容路径：只编码，不号称加密
    return utf8ToHex(plaintext);
  }
  if (!type.includes("aes")) {
    throw new Error(`未支持的请求体加密类型: ${options.type}（后端已改为真实加密，前端需先实现对应算法）`);
  }
  if (!options.key) {
    throw new Error("AES codec 缺少密钥");
  }
  const bridge = getWasmCryptoBridge();
  if (bridge) {
    // aes：与后端 AesCbcCodec 完全一致 —— key/IV 均由 SHA-256(key) 派生（wasm 实现）
    return bridge.codecAesEncryptHex(plaintext, options.key);
  }
  warnBridgeMissing("encodeRequestBody");
  // CryptoJS 兼容路径：显式 key/IV + PKCS7，输出与 Java AES/CBC/PKCS5Padding 逐字节一致
  const digest = sha256Hex(options.key);
  const encrypted = CryptoJS.AES.encrypt(CryptoJS.enc.Utf8.parse(plaintext), CryptoJS.enc.Hex.parse(digest), {
    mode: CryptoJS.mode.CBC,
    iv: CryptoJS.enc.Hex.parse(digest.slice(0, 32)),
    padding: CryptoJS.pad.Pkcs7,
  });
  return encrypted.ciphertext.toString();
}

/**
 * 解密后端单独下发的 hex 密文（不是 codec 响应包装）。
 *
 * <p>与 {@link encodeRequestBody} 走同一套线协议：key/IV 都由 {@code SHA-256(key)}
 * 派生，AES/CBC/PKCS7，线上载荷为 hex。用于「敏感值加密下发、客户端本地解密」，
 * 避免明文出现在响应体、网关日志与浏览器网络面板里。</p>
 *
 * @param cipherHex hex 密文
 * @param key       与后端约定的口令（本项目为当前会话令牌）
 * @returns 明文；密文为空、口令为空或解不开时返回空串
 */
export function decryptAesHex(cipherHex: string, key: string): string {
  const hex = String(cipherHex ?? "").trim();
  if (!hex || !key) return "";
  const bridge = getWasmCryptoBridge();
  if (bridge) {
    try {
      return bridge.codecAesDecryptHex(hex, key);
    } catch {
      return "";
    }
  }
  warnBridgeMissing("decryptAesHex");
  try {
    const digest = sha256Hex(key);
    const cipherParams = CryptoJS.lib.CipherParams.create({
      ciphertext: CryptoJS.enc.Hex.parse(hex),
    });
    const decrypted = CryptoJS.AES.decrypt(cipherParams, CryptoJS.enc.Hex.parse(digest), {
      mode: CryptoJS.mode.CBC,
      iv: CryptoJS.enc.Hex.parse(digest.slice(0, 32)),
      padding: CryptoJS.pad.Pkcs7,
    });
    return decrypted.toString(CryptoJS.enc.Utf8);
  } catch {
    return "";
  }
}

/**
 * 解后端 {@code ApiResponseEncodeResponseBodyAdvice} 的响应包装。
 *
 * <p>后端格式：{@code 02{key}200{data}ffff}。其中 AES 分支的 data 是按
 * {@link encodeRequestBody} 同一套 key/IV 派生的 hex 密文；hex 类型则是明文十六进制。
 * AES 解不开时返回 null，不再回退 hex 把密文当明文交给业务。</p>
 *
 * <p>keylog 类型的响应解密需要请求侧留存的一次性私钥，由 core 的 httpCrypto
 * 编排（见 decodeKeylogResponse），本函数不处理 keylog。</p>
 *
 * @param payload 响应体（字符串 / ArrayBuffer / Uint8Array）
 * @param options codec 配置
 * @returns 解析后的 JSON 对象、纯文本；不是 codec 包装时返回 null
 */
export function decodeCodecResponse(
  payload: unknown,
  options: RequestCodecOptions,
): unknown | null {
  let text = "";
  if (typeof payload === "string") {
    text = payload.trim();
  } else if (payload instanceof ArrayBuffer) {
    text = new TextDecoder().decode(new Uint8Array(payload)).trim();
  } else if (payload instanceof Uint8Array) {
    text = new TextDecoder().decode(payload).trim();
  } else {
    return null;
  }

  const matched = /^02(.+?)200([0-9a-fA-F]*)ffff$/.exec(text);
  if (!matched) return null;
  const dataHex = matched[2];
  if (!dataHex) return null;

  let plain = "";
  const type = (options.type ?? "").toLowerCase();
  if (type.includes("aes")) {
    if (!options.key) return null;
    const bridge = getWasmCryptoBridge();
    if (bridge) {
      try {
        plain = bridge.codecAesDecryptHex(dataHex, options.key);
      } catch {
        return null;
      }
    } else {
      warnBridgeMissing("decodeCodecResponse");
      try {
        const digest = sha256Hex(options.key);
        const cipherParams = CryptoJS.lib.CipherParams.create({
          ciphertext: CryptoJS.enc.Hex.parse(dataHex),
        });
        const decrypted = CryptoJS.AES.decrypt(cipherParams, CryptoJS.enc.Hex.parse(digest), {
          mode: CryptoJS.mode.CBC,
          iv: CryptoJS.enc.Hex.parse(digest.slice(0, 32)),
          padding: CryptoJS.pad.Pkcs7,
        });
        plain = decrypted.toString(CryptoJS.enc.Utf8);
      } catch {
        return null;
      }
    }
    // AES 解不开就是密钥/数据不匹配，不再回退 hex 把密文当明文
    if (!plain) return null;
  } else if (!type || type === "hex") {
    // 后端在未配置密钥时显式走 hex 兼容路径，前端保持一致
    try {
      plain = hexToUtf8(dataHex);
    } catch {
      return null;
    }
  } else {
    return null;
  }
  if (!plain) return null;
  try {
    return JSON.parse(plain);
  } catch {
    return plain;
  }
}
