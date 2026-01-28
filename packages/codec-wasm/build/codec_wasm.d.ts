/* tslint:disable */
/* eslint-disable */
/**
 * TypeScript 类型定义文件 - 由 Rust 代码生成
 * 对应 src-rust/src/lib.rs 中的 wasm_bindgen 导出函数
 */

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly alloc: (size: number) => number;
  readonly dealloc: (ptr: number, size: number) => void;
  readonly sm3_hash: (data_ptr: number, data_len: number) => number;
  readonly md5_hash: (data_ptr: number, data_len: number) => number;
  readonly aes_encrypt: (data_ptr: number, data_len: number, key_ptr: number, key_len: number) => number;
  readonly aes_decrypt: (data_ptr: number, data_len: number, key_ptr: number, key_len: number) => number;
  readonly sm4_encrypt: (data_ptr: number, data_len: number, key_ptr: number, key_len: number) => number;
  readonly sm4_decrypt: (data_ptr: number, data_len: number, key_ptr: number, key_len: number) => number;
  readonly generate_sm2_key_pair: () => number;
  readonly sm2_encrypt: (data_ptr: number, data_len: number, pubkey_ptr: number, pubkey_len: number) => number;
  readonly sm2_decrypt: (data_ptr: number, data_len: number, privkey_ptr: number, privkey_len: number) => number;
  readonly generate_nonce: () => string;
  readonly get_current_timestamp: () => number;
  readonly generate_sign: (data_ptr: number, data_len: number, privkey_ptr: number, privkey_len: number) => number;
  readonly verify_sign: (data_ptr: number, data_len: number, sig_ptr: number, sig_len: number, pubkey_ptr: number, pubkey_len: number) => boolean;
  readonly uu3_decrypt_simple: (data_ptr: number, data_len: number) => number;
  readonly uu1_decrypt_response: (data_ptr: number, data_len: number, origin_ptr: number, origin_len: number, ts_ptr: number, ts_len: number) => number;
  readonly uu1_decrypt_response_object: (response: any) => any;
  readonly uu1_decrypt_response_object_with_arraybuffer: (response: any) => any;
  readonly uu2_encrypt_request: (data_ptr: number, data_len: number, key_ptr: number, key_len: number) => number;
  readonly uu2_process_request: (request: any) => any;
  readonly uu4_decrypt_response: (data_ptr: number, data_len: number, uuid_ptr: number, uuid_len: number, ts_ptr: number, ts_len: number) => number;
  readonly encrypt_storage_key: (key_ptr: number, key_len: number, _: number, _1: number) => number;
  readonly encrypt_storage_value: (val_ptr: number, val_len: number, _: number, _1: number, _2: number, _3: number, _4: number, _5: number, _6: number, _7: number) => number;
  readonly decrypt_storage_value: (val_ptr: number, val_len: number, _: number, _1: number, _2: number, _3: number, _4: number, _5: number, _6: number, _7: number) => number;
  readonly custom_encrypt_with_codec_keypair: (data_ptr: number, data_len: number, pubkey_ptr: number, pubkey_len: number, privkey_ptr: number, privkey_len: number) => number;
}

/**
 * 同步初始化函数
 */
export function initSync(module: InitInput): InitOutput;

/**
 * 异步初始化函数
 */
export default function init(input?: InitInput | Promise<InitInput>): Promise<InitOutput>;
