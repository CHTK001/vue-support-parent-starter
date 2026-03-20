/* tslint:disable */
/* eslint-disable */
export function custom_encrypt_with_codec_keypair(data: string, pubkey: string, privkey: string): string;
/**
 * 字体解密文本
 */
export function font_decrypt_text(text: string): string;
/**
 * 获取动态映射表（JSON格式，每次调用都重新生成）
 */
export function font_get_maps(): string;
export function uu1_decrypt_response_object_with_arraybuffer(response: any): any;
export function md5_hash(data: string): string;
export function sm4_decrypt(data: string, key: string): string;
export function uu2_encrypt_request(data: string, key: string): string;
/**
 * 存储值解密（对外导出：直接返回 JS 字符串，避免返回内存指针）
 */
export function decrypt_storage_value(value: string, key: string, system: string, storage_key: string, encode_flag: string): string;
export function aes_encrypt(data: string, key: string): string;
export function sm4_encrypt(data: string, key: string): string;
export function uu2_process_request(request: any): any;
export function uu1_decrypt_response_object(response: any): any;
export function aes_decrypt(data: string, key: string): string;
/**
 * 获取当前时间戳
 */
export function get_current_timestamp(): number;
export function uu3_decrypt_simple(data: string): string;
/**
 * 获取映射的字符数量
 */
export function font_get_mapped_char_count(): string;
/**
 * 存储值加密（对外导出：直接返回 JS 字符串，避免返回内存指针）
 */
export function encrypt_storage_value(value: string, key: string, system: string, storage_key: string, encode_flag: string): string;
/**
 * 检查字符是否为加密字符
 */
export function font_is_encrypted_char(ch: string): boolean;
export function sm2_decrypt(data: string, privkey: string): string;
export function sm3_hash(data: string): string;
export function sm2_encrypt(data: string, pubkey: string): string;
export function uu4_decrypt_response(data: string, _uuid: string, ts: string): string;
export function generate_sm2_key_pair(): string;
export function verify_sign(data: string, sig: string, pubkey: string): boolean;
export function uu1_decrypt_response(data: string, _origin: string, ts: string): string;
export function generate_sign(data: string, privkey: string): string;
/**
 * 字体加密文本
 */
export function font_encrypt_text(text: string, encrypt_numbers: boolean, encrypt_chinese: boolean): string;
/**
 * 生成随机 nonce 字符串
 */
export function generate_nonce(): string;
export function encrypt_storage_key(key: string, system: string): string;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly aes_decrypt: (a: number, b: number, c: number, d: number) => [number, number];
  readonly aes_encrypt: (a: number, b: number, c: number, d: number) => [number, number];
  readonly custom_encrypt_with_codec_keypair: (a: number, b: number, c: number, d: number, e: number, f: number) => [number, number];
  readonly decrypt_storage_value: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number, j: number) => [number, number];
  readonly encrypt_storage_key: (a: number, b: number, c: number, d: number) => [number, number];
  readonly encrypt_storage_value: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number, j: number) => [number, number];
  readonly font_decrypt_text: (a: number, b: number) => [number, number];
  readonly font_encrypt_text: (a: number, b: number, c: number, d: number) => [number, number];
  readonly font_get_mapped_char_count: () => [number, number];
  readonly font_get_maps: () => [number, number];
  readonly font_is_encrypted_char: (a: number, b: number) => number;
  readonly generate_nonce: () => [number, number];
  readonly generate_sign: (a: number, b: number, c: number, d: number) => [number, number];
  readonly generate_sm2_key_pair: () => [number, number];
  readonly get_current_timestamp: () => number;
  readonly md5_hash: (a: number, b: number) => [number, number];
  readonly sm2_decrypt: (a: number, b: number, c: number, d: number) => [number, number];
  readonly sm2_encrypt: (a: number, b: number, c: number, d: number) => [number, number];
  readonly sm3_hash: (a: number, b: number) => [number, number];
  readonly sm4_decrypt: (a: number, b: number, c: number, d: number) => [number, number];
  readonly sm4_encrypt: (a: number, b: number, c: number, d: number) => [number, number];
  readonly uu1_decrypt_response: (a: number, b: number, c: number, d: number, e: number, f: number) => [number, number];
  readonly uu1_decrypt_response_object: (a: any) => any;
  readonly uu1_decrypt_response_object_with_arraybuffer: (a: any) => any;
  readonly uu2_encrypt_request: (a: number, b: number, c: number, d: number) => [number, number];
  readonly uu2_process_request: (a: any) => any;
  readonly uu3_decrypt_simple: (a: number, b: number) => [number, number];
  readonly uu4_decrypt_response: (a: number, b: number, c: number, d: number, e: number, f: number) => [number, number];
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
