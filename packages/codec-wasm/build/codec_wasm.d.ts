/* tslint:disable */
/* eslint-disable */
export function alloc(size: number): number;
export function dealloc(ptr: number, size: number): void;
export function sm3_hash(data_ptr: number, data_len: number): number;
export function md5_hash(data_ptr: number, data_len: number): number;
export function aes_encrypt(data_ptr: number, data_len: number, key_ptr: number, key_len: number): number;
export function aes_decrypt(data_ptr: number, data_len: number, key_ptr: number, key_len: number): number;
export function sm4_encrypt(data_ptr: number, data_len: number, key_ptr: number, key_len: number): number;
export function sm4_decrypt(data_ptr: number, data_len: number, key_ptr: number, key_len: number): number;
export function generate_sm2_key_pair(): number;
export function sm2_encrypt(data_ptr: number, data_len: number, pubkey_ptr: number, pubkey_len: number): number;
export function sm2_decrypt(data_ptr: number, data_len: number, privkey_ptr: number, privkey_len: number): number;
/**
 * 生成随机 nonce 字符串
 */
export function generate_nonce(): string;
/**
 * 获取当前时间戳
 */
export function get_current_timestamp(): number;
export function generate_sign(data_ptr: number, data_len: number, privkey_ptr: number, privkey_len: number): number;
export function verify_sign(data_ptr: number, data_len: number, sig_ptr: number, sig_len: number, pubkey_ptr: number, pubkey_len: number): boolean;
export function uu3_decrypt_simple(data_ptr: number, data_len: number): number;
export function uu1_decrypt_response(data_ptr: number, data_len: number, _origin_ptr: number, _origin_len: number, ts_ptr: number, ts_len: number): number;
export function uu1_decrypt_response_object(response: any): any;
export function uu1_decrypt_response_object_with_arraybuffer(response: any): any;
export function uu2_encrypt_request(data_ptr: number, data_len: number, key_ptr: number, key_len: number): number;
export function uu2_process_request(request: any): any;
export function uu4_decrypt_response(data_ptr: number, data_len: number, _uuid_ptr: number, _uuid_len: number, ts_ptr: number, ts_len: number): number;
export function encrypt_storage_key(key_ptr: number, key_len: number, arg2: number, arg3: number): number;
export function encrypt_storage_value(val_ptr: number, val_len: number, arg2: number, arg3: number, arg4: number, arg5: number, arg6: number, arg7: number, arg8: number, arg9: number): number;
export function decrypt_storage_value(val_ptr: number, val_len: number, arg2: number, arg3: number, arg4: number, arg5: number, arg6: number, arg7: number, arg8: number, arg9: number): number;
export function custom_encrypt_with_codec_keypair(data_ptr: number, data_len: number, pubkey_ptr: number, pubkey_len: number, privkey_ptr: number, privkey_len: number): number;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly alloc: (a: number) => number;
  readonly dealloc: (a: number, b: number) => void;
  readonly sm3_hash: (a: number, b: number) => number;
  readonly md5_hash: (a: number, b: number) => number;
  readonly aes_encrypt: (a: number, b: number, c: number, d: number) => number;
  readonly aes_decrypt: (a: number, b: number, c: number, d: number) => number;
  readonly sm4_encrypt: (a: number, b: number, c: number, d: number) => number;
  readonly sm4_decrypt: (a: number, b: number, c: number, d: number) => number;
  readonly generate_sm2_key_pair: () => number;
  readonly sm2_encrypt: (a: number, b: number, c: number, d: number) => number;
  readonly sm2_decrypt: (a: number, b: number, c: number, d: number) => number;
  readonly generate_nonce: () => [number, number];
  readonly get_current_timestamp: () => number;
  readonly generate_sign: (a: number, b: number, c: number, d: number) => number;
  readonly verify_sign: (a: number, b: number, c: number, d: number, e: number, f: number) => number;
  readonly uu3_decrypt_simple: (a: number, b: number) => number;
  readonly uu1_decrypt_response: (a: number, b: number, c: number, d: number, e: number, f: number) => number;
  readonly uu1_decrypt_response_object: (a: any) => any;
  readonly uu1_decrypt_response_object_with_arraybuffer: (a: any) => any;
  readonly uu2_encrypt_request: (a: number, b: number, c: number, d: number) => number;
  readonly uu2_process_request: (a: any) => any;
  readonly uu4_decrypt_response: (a: number, b: number, c: number, d: number, e: number, f: number) => number;
  readonly encrypt_storage_key: (a: number, b: number, c: number, d: number) => number;
  readonly decrypt_storage_value: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number, j: number) => number;
  readonly custom_encrypt_with_codec_keypair: (a: number, b: number, c: number, d: number, e: number, f: number) => number;
  readonly encrypt_storage_value: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number, j: number) => number;
  readonly __wbindgen_exn_store: (a: number) => void;
  readonly __externref_table_alloc: () => number;
  readonly __wbindgen_export_2: WebAssembly.Table;
  readonly __wbindgen_malloc: (a: number, b: number) => number;
  readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
  readonly __wbindgen_free: (a: number, b: number, c: number) => void;
  readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;
/**
* Instantiates the given `module`, which can either be bytes or
* a precompiled `WebAssembly.Module`.
*
* @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
*
* @returns {InitOutput}
*/
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
* If `module_or_path` is {RequestInfo} or {URL}, makes a request and
* for everything else, calls `WebAssembly.instantiate` directly.
*
* @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
*
* @returns {Promise<InitOutput>}
*/
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
