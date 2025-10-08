/* tslint:disable */
/* eslint-disable */
export const memory: WebAssembly.Memory;
export const alloc: (a: number) => number;
export const dealloc: (a: number, b: number) => void;
export const aes_encrypt: (a: number, b: number, c: number, d: number) => number;
export const aes_decrypt: (a: number, b: number, c: number, d: number) => number;
export const sm3_hash: (a: number, b: number) => number;
export const sm4_encrypt: (a: number, b: number, c: number, d: number) => number;
export const sm4_decrypt: (a: number, b: number, c: number, d: number) => number;
export const generate_sm2_key_pair: () => number;
export const sm2_encrypt: (a: number, b: number, c: number, d: number) => number;
export const sm2_decrypt: (a: number, b: number, c: number, d: number) => number;
export const __wbindgen_export_0: WebAssembly.Table;
export const __wbindgen_start: () => void;
