// codec-wasm TypeScript声明文件

import type { PureHttpRequestConfig, PureHttpResponse } from "@repo/utils/src/http/types";

export function uu2_wasm(request: PureHttpRequestConfig, getConfig: (key: string) => any): Promise<PureHttpRequestConfig>;
export function uu1_wasm(response: PureHttpResponse): Promise<PureHttpResponse>;
export function uu3_wasm(value: string): Promise<string>;
export function uu4_wasm(response: any): Promise<any>;
export function initWasm(): Promise<boolean>;
export function isWasmLoaded(): boolean;
export function getCurrentTimestamp(): Promise<bigint>;
export function add(a: number, b: number): Promise<number>;
export function generateNonce(): Promise<string>;
export function processRequest(requestData: string, requestUrl: string, codecConfig: boolean, codecKey: string): Promise<string>;
export function processResponse(responseData: string, originKey: string, timestamp: string): Promise<string>;
export function encryptAES(data: string, key: string): Promise<string>;
export function decryptAES(value: string, key: string): Promise<string>;
export function encryptStorageKey(key: string, systemCode: string): Promise<string>;
export function encryptStorageValue(value: string, key: string, systemCode: string, storageKey: string, storageEncode: boolean): Promise<string>;
export function decryptStorageValue(value: string, key: string, systemCode: string, storageKey: string, storageEncode: boolean): Promise<string>;