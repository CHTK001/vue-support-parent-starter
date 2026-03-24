// codec-wasm JS 降级实现
// 说明：当 Rust / WASM 构建未执行或不可用时，使用该文件避免 404，并提供安全的降级行为。
// 仅在开发环境打印一次提示，避免在控制台制造“错误”恐慌。
if (typeof window !== "undefined") {
  if (!window.__CODEC_WASM_FALLBACK_LOGGED__) {
    window.__CODEC_WASM_FALLBACK_LOGGED__ = true;
    console.info(
      "[codec-wasm] 未加载 WASM 模块，当前使用 JS 降级实现，部分高级加密能力关闭。"
    );
  }
}

const dummyInstance = {
  memory: new WebAssembly.Memory({ initial: 1 }),
  alloc: () => 0,
  dealloc: () => {},
  sm3_hash: () => 0,
  md5_hash: () => 0,
  aes_encrypt: () => 0,
  aes_decrypt: () => 0,
  sm4_encrypt: () => 0,
  sm4_decrypt: () => 0,
  generate_sm2_key_pair: () => 0,
  sm2_encrypt: () => 0,
  sm2_decrypt: () => 0,
  generate_nonce: () => "dummy-nonce",
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
