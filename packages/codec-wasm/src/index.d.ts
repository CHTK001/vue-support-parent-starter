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