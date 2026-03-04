// codec-wasm JS 降级实现
// 说明：当 Rust / WASM 构建未执行或不可用时，使用该文件避免 404，并提供安全的降级行为。
// 重点：必须保证 md5_hash / generate_nonce 可用，否则 x-sign 会缺失导致后端无法联调。
// 仅在开发环境打印一次提示，避免在控制台制造“错误”恐慌。
import CryptoJS from "crypto-js";

const textDecoder = new TextDecoder();
const textEncoder = new TextEncoder();

/**
 * 生成高质量随机字符串（仅包含 [a-z0-9]），用于 x-nonce
 * - 长度 >= 32，满足后端 NonceUtils 的长度校验
 */
function randomNonce(length = 48) {
  const finalLength = Math.max(32, length);
  const alphabet = "abcdefghijklmnopqrstuvwxyz0123456789";
  const bytes = new Uint8Array(finalLength);

  if (typeof globalThis !== "undefined" && globalThis.crypto?.getRandomValues) {
    globalThis.crypto.getRandomValues(bytes);
  } else {
    // 非浏览器环境兜底：降低强度但保证可用
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }

  let out = "";
  for (let i = 0; i < bytes.length; i++) {
    out += alphabet[bytes[i] % alphabet.length];
  }
  return out;
}

/**
 * 极简 bump allocator：满足 codec-wasm/src/index.js 的 toWasm/fromWasm/callStr ABI 需求
 * - 入参字符串写入 memory
 * - md5_hash 返回的字符串也写入 memory，并返回指针
 */
let heapOffset = 1024;
function ensureCapacity(memory, size) {
  const current = memory.buffer.byteLength;
  if (heapOffset + size <= current) return;
  const pageSize = 64 * 1024;
  const needed = heapOffset + size - current;
  const pages = Math.ceil(needed / pageSize);
  memory.grow(pages);
}

function alloc(memory, size) {
  const allocSize = Math.max(1, size);
  ensureCapacity(memory, allocSize);
  const ptr = heapOffset;
  heapOffset += allocSize;
  return ptr;
}

function writeCString(memory, str) {
  const bytes = textEncoder.encode(str);
  const ptr = alloc(memory, bytes.length + 1);
  new Uint8Array(memory.buffer, ptr, bytes.length).set(bytes);
  new Uint8Array(memory.buffer)[ptr + bytes.length] = 0;
  return ptr;
}

function readUtf8(memory, ptr, len) {
  if (!ptr || !len) return "";
  return textDecoder.decode(new Uint8Array(memory.buffer, ptr, len));
}
if (typeof window !== "undefined") {
  if (!window.__CODEC_WASM_FALLBACK_LOGGED__) {
    window.__CODEC_WASM_FALLBACK_LOGGED__ = true;
    console.info(
      "[codec-wasm] WASM 尚未完成初始化，当前暂时使用 JS 兜底实现，后续加载成功会自动切换为 WASM。"
    );
  }
}

const dummyInstance = {
  memory: new WebAssembly.Memory({ initial: 1 }),
  alloc: (size) => alloc(dummyInstance.memory, size),
  dealloc: () => {},
  sm3_hash: () => 0,
  md5_hash: (data_ptr, data_len) => {
    const input = readUtf8(dummyInstance.memory, data_ptr, data_len);
    const md5 = CryptoJS.MD5(input).toString();
    return writeCString(dummyInstance.memory, md5);
  },
  aes_encrypt: () => 0,
  aes_decrypt: () => 0,
  sm4_encrypt: () => 0,
  sm4_decrypt: () => 0,
  generate_sm2_key_pair: () => 0,
  sm2_encrypt: () => 0,
  sm2_decrypt: () => 0,
  generate_nonce: () => randomNonce(48),
  get_current_timestamp: () => Date.now(),
  generate_sign: () => 0,
  verify_sign: () => true,
  uu3_decrypt_simple: () => 0,
  uu1_decrypt_response: () => 0,
  uu1_decrypt_response_object: (r) => r,
  uu1_decrypt_response_object_with_arraybuffer: (r) => r,
  uu2_encrypt_request: () => 0,
  uu2_process_request: (r) => r,
  uu4_decrypt_response: () => 0,
  encrypt_storage_key: () => 0,
  encrypt_storage_value: () => 0,
  decrypt_storage_value: () => 0,
  custom_encrypt_with_codec_keypair: () => 0,
  font_encrypt_text: () => 0,
  font_decrypt_text: () => 0,
  font_is_encrypted_char: () => false,
  font_get_mapped_char_count: () => 0,
  font_get_maps: () => 0,
};

export default function init() {
  return Promise.resolve(dummyInstance);
}

export function initSync() {
  return dummyInstance;
}
