/* tslint:disable */
/* eslint-disable */
export const memory: WebAssembly.Memory;
export const aesDecrypt: (a: number, b: number, c: number, d: number, e: number, f: number) => [number, number];
export const aesEncrypt: (a: number, b: number, c: number, d: number, e: number, f: number) => [number, number];
export const aesVariantDecrypt: (a: number, b: number, c: number, d: number) => [number, number];
export const aesVariantEncrypt: (a: number, b: number, c: number, d: number) => [number, number];
export const md5: (a: number, b: number) => [number, number];
export const sm2Decrypt: (a: number, b: number, c: number, d: number) => [number, number];
export const sm2Encrypt: (a: number, b: number, c: number, d: number) => [number, number];
export const sm2GenerateKeyPair: () => any;
export const sm3: (a: number, b: number) => [number, number];
export const sm4Decrypt: (a: number, b: number, c: number, d: number) => [number, number];
export const sm4Encrypt: (a: number, b: number, c: number, d: number) => [number, number];
export const __wbindgen_exn_store: (a: number) => void;
export const __externref_table_alloc: () => number;
export const __wbindgen_export_2: WebAssembly.Table;
export const __wbindgen_malloc: (a: number, b: number) => number;
export const __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
export const __wbindgen_free: (a: number, b: number, c: number) => void;
export const __wbindgen_start: () => void;
