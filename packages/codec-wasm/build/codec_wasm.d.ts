/* tslint:disable */
/* eslint-disable */
/**
 * 存储值加密（WASM 版本）：
 *  - 结构：version|salt|iv|cipher|mac 全部 base64 拼接，使用 '.' 分隔
 *  - cipher: AES-128-CBC(PKCS7) 加密 JSON 字符串
 *  - mac: SM3(data = salt + iv + cipher + key 派生串) 的 hex
 */
export function encrypt_storage_value(val_ptr: number, val_len: number, key_ptr: number, key_len: number, system_ptr: number, system_len: number, storage_key_ptr: number, storage_key_len: number, encode_flag_ptr: number, encode_flag_len: number): number;
export function custom_encrypt_with_codec_keypair(data_ptr: number, data_len: number, pubkey_ptr: number, pubkey_len: number, privkey_ptr: number, privkey_len: number): number;
/**
 * 检查字符是否为加密字符
 */
export function font_is_encrypted_char(char_ptr: number, char_len: number): boolean;
export function uu1_decrypt_response(data_ptr: number, data_len: number, _origin_ptr: number, _origin_len: number, ts_ptr: number, ts_len: number): number;
export function dealloc(ptr: number, size: number): void;
export function aes_decrypt(data_ptr: number, data_len: number, key_ptr: number, key_len: number): number;
export function uu1_decrypt_response_object(response: any): any;
export function encrypt_storage_key(key_ptr: number, key_len: number, system_ptr: number, system_len: number): number;
export function sm3_hash(data_ptr: number, data_len: number): number;
export function aes_encrypt(data_ptr: number, data_len: number, key_ptr: number, key_len: number): number;
export function uu1_decrypt_response_object_with_arraybuffer(response: any): any;
export function uu3_decrypt_simple(data_ptr: number, data_len: number): number;
export function md5_hash(data_ptr: number, data_len: number): number;
export function sm2_decrypt(data_ptr: number, data_len: number, privkey_ptr: number, privkey_len: number): number;
/**
 * 获取动态映射表（JSON格式，每次调用都重新生成）
 */
export function font_get_maps(): number;
export function generate_sign(data_ptr: number, data_len: number, privkey_ptr: number, privkey_len: number): number;
/**
 * 字体解密文本
 */
export function font_decrypt_text(text_ptr: number, text_len: number): number;
export function uu4_decrypt_response(data_ptr: number, data_len: number, _uuid_ptr: number, _uuid_len: number, ts_ptr: number, ts_len: number): number;
/**
 * 字体加密文本
 */
export function font_encrypt_text(text_ptr: number, text_len: number, encrypt_numbers: boolean, encrypt_chinese: boolean): number;
export function generate_sm2_key_pair(): number;
export function alloc(size: number): number;
export function sm4_decrypt(data_ptr: number, data_len: number, key_ptr: number, key_len: number): number;
export function uu2_encrypt_request(data_ptr: number, data_len: number, key_ptr: number, key_len: number): number;
export function sm4_encrypt(data_ptr: number, data_len: number, key_ptr: number, key_len: number): number;
/**
 * 获取当前时间戳
 */
export function get_current_timestamp(): number;
export function verify_sign(data_ptr: number, data_len: number, sig_ptr: number, sig_len: number, pubkey_ptr: number, pubkey_len: number): boolean;
/**
 * 生成随机 nonce 字符串
 */
export function generate_nonce(): string;
/**
 * 获取映射的字符数量
 */
export function font_get_mapped_char_count(): number;
/**
 * 存储值解密（WASM 版本）：
 * 解析 version|salt|iv|cipher|mac 结构并做 MAC 校验，失败则返回空串
 */
export function decrypt_storage_value(val_ptr: number, val_len: number, key_ptr: number, key_len: number, system_ptr: number, system_len: number, storage_key_ptr: number, storage_key_len: number, encode_flag_ptr: number, encode_flag_len: number): number;
export function sm2_encrypt(data_ptr: number, data_len: number, pubkey_ptr: number, pubkey_len: number): number;
export function uu2_process_request(request: any): any;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly aes_decrypt: (a: number, b: number, c: number, d: number) => number;
  readonly aes_encrypt: (a: number, b: number, c: number, d: number) => number;
  readonly alloc: (a: number) => number;
  readonly custom_encrypt_with_codec_keypair: (a: number, b: number, c: number, d: number, e: number, f: number) => number;
  readonly dealloc: (a: number, b: number) => void;
  readonly decrypt_storage_value: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number, j: number) => number;
  readonly encrypt_storage_key: (a: number, b: number, c: number, d: number) => number;
  readonly encrypt_storage_value: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number, j: number) => number;
  readonly font_decrypt_text: (a: number, b: number) => number;
  readonly font_encrypt_text: (a: number, b: number, c: number, d: number) => number;
  readonly font_get_mapped_char_count: () => number;
  readonly font_get_maps: () => number;
  readonly font_is_encrypted_char: (a: number, b: number) => number;
  readonly generate_nonce: () => [number, number];
  readonly generate_sign: (a: number, b: number, c: number, d: number) => number;
  readonly generate_sm2_key_pair: () => number;
  readonly get_current_timestamp: () => number;
  readonly md5_hash: (a: number, b: number) => number;
  readonly sm2_decrypt: (a: number, b: number, c: number, d: number) => number;
  readonly sm2_encrypt: (a: number, b: number, c: number, d: number) => number;
  readonly sm3_hash: (a: number, b: number) => number;
  readonly sm4_decrypt: (a: number, b: number, c: number, d: number) => number;
  readonly sm4_encrypt: (a: number, b: number, c: number, d: number) => number;
  readonly uu1_decrypt_response: (a: number, b: number, c: number, d: number, e: number, f: number) => number;
  readonly uu1_decrypt_response_object: (a: any) => any;
  readonly uu1_decrypt_response_object_with_arraybuffer: (a: any) => any;
  readonly uu2_encrypt_request: (a: number, b: number, c: number, d: number) => number;
  readonly uu2_process_request: (a: any) => any;
  readonly uu3_decrypt_simple: (a: number, b: number) => number;
  readonly uu4_decrypt_response: (a: number, b: number, c: number, d: number, e: number, f: number) => number;
  readonly verify_sign: (a: number, b: number, c: number, d: number, e: number, f: number) => number;
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
