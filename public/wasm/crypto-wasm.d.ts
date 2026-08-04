/* tslint:disable */
/* eslint-disable */
/**
 * SM4 加密（ECB 模式）
 */
export function sm4Encrypt(data: Uint8Array, key: Uint8Array): Uint8Array;
/**
 * SM4 解密（ECB 模式）
 */
export function sm4Decrypt(data: Uint8Array, key: Uint8Array): Uint8Array;
/**
 * AES 变种加密（自定义流程，仅用于内部 storage 防破解，非标准 AES 协议）
 *
 * 输出格式：[magic 4B][iv 16B][cipher]
 * 流程：派生 key → 生成随机 iv → 明文块内置换+异或白化 → AES-128-CBC 加密。
 * 随机 iv 使相同明文每次密文不同；与后端无约定，仅供前端本地持久化使用。
 */
export function aesVariantEncrypt(data: Uint8Array, secret: Uint8Array): Uint8Array;
/**
 * SM3 摘要（返回 hex 字符串）
 */
export function sm3(data: Uint8Array): string;
/**
 * AES 加密（CBC 模式，iv 缺省为 16 字节全零）
 */
export function aesEncrypt(data: Uint8Array, key: Uint8Array, iv?: Uint8Array | null): Uint8Array;
/**
 * 加密请求体：生成随机 AES key → AES-128-CBC/全零 IV → PKCS7 加密 → 返回密文+base64 key
 *
 * 与后端 ApiResponseEncodeResponseBodyAdvice / ApiResponseEncodeRegister 的 AES 协议对齐。
 */
export function encryptBody(json_str: string): any;
/**
 * MD5 摘要（返回 hex 字符串，与后端 NonceUtils 签名算法一致）
 */
export function md5(data: Uint8Array): string;
/**
 * SM2 密钥对（返回 { publicKey, privateKey } 的 hex 字符串）
 */
export function sm2GenerateKeyPair(): any;
/**
 * SM2 解密（私钥 hex）
 */
export function sm2Decrypt(private_key: string, data: Uint8Array): Uint8Array;
/**
 * AES 变种解密（与 aesVariantEncrypt 互逆，魔数不符或解密失败时抛错）
 */
export function aesVariantDecrypt(data: Uint8Array, secret: Uint8Array): Uint8Array;
/**
 * 解密响应体：base64 解码 key → 剔除 x-ot 噪声 → AES-128-CBC 解密 → 尝试 JSON 识别
 *
 * 与后端 AES 协议对齐（CBC/全零 IV/PKCS5Padding，x-ec/x-ck/x-ot 语义一致）。
 */
export function decodeBody(data: Uint8Array, key_b64: string, noise_level: number): any;
/**
 * AES 解密（CBC 模式，iv 缺省为 16 字节全零）
 */
export function aesDecrypt(data: Uint8Array, key: Uint8Array, iv?: Uint8Array | null): Uint8Array;
/**
 * SM2 加密（公钥 hex，C1C3C2 格式）
 */
export function sm2Encrypt(public_key: string, data: Uint8Array): Uint8Array;
/**
 * 生成 anti-replay nonce（128 字符，混合时间戳+随机熵）
 */
export function generateNonce(): string;
/**
 * x-sign 签名：拼接 nonce+fingerprint+timestamp+paramsMd5+secret 后计算 MD5
 *
 * 入参中的 sortedParams 是 TS 侧 collectParams + sortParams 后的字符串
 */
export function signRequest(sorted_params: string, nonce: string, fingerprint: string, timestamp: string, sign_secret: string): string;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly aesDecrypt: (a: number, b: number, c: number, d: number, e: number, f: number) => [number, number];
  readonly aesEncrypt: (a: number, b: number, c: number, d: number, e: number, f: number) => [number, number];
  readonly aesVariantDecrypt: (a: number, b: number, c: number, d: number) => [number, number];
  readonly aesVariantEncrypt: (a: number, b: number, c: number, d: number) => [number, number];
  readonly decodeBody: (a: number, b: number, c: number, d: number, e: number) => any;
  readonly encryptBody: (a: number, b: number) => any;
  readonly generateNonce: () => [number, number];
  readonly md5: (a: number, b: number) => [number, number];
  readonly signRequest: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number, j: number) => [number, number];
  readonly sm2Decrypt: (a: number, b: number, c: number, d: number) => [number, number];
  readonly sm2Encrypt: (a: number, b: number, c: number, d: number) => [number, number];
  readonly sm2GenerateKeyPair: () => any;
  readonly sm3: (a: number, b: number) => [number, number];
  readonly sm4Decrypt: (a: number, b: number, c: number, d: number) => [number, number];
  readonly sm4Encrypt: (a: number, b: number, c: number, d: number) => [number, number];
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
