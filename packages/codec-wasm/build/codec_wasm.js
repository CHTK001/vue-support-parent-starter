// Dummy codec_wasm.js to prevent 404 errors when Rust build fails
console.warn("codec-wasm: Rust build failed. Using dummy implementation. Encryption will NOT work.");

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
