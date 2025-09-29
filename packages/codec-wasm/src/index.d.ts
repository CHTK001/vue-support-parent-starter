// codec-wasm TypeScript声明文件

export function initWasm(): boolean;
export function isWasmLoaded(): boolean;

export function generateNonce(): string;
export function generateSign(paramsJson: string, timestamp: number, nonce: string, secretKey: string): string;
export function md5Hash(input: string): string;
export function getCurrentTimestamp(): number;
export function add(a: number, b: number): number;

export function processRequest(requestData: string, requestUrl: string, codecConfig: boolean, codecKey: string): string;
export function processResponse(responseData: string, originKey: string, timestamp: string): string;

export function encryptAES(data: string, key: string): string;
export function decryptAES(value: string, key: string): string;

export function encryptStorageKey(key: string, systemCode: string): string;
export function encryptStorageValue(value: string, key: string, systemCode: string, storageKey: string, storageEncode: boolean): string;
export function decryptStorageValue(value: string, key: string, systemCode: string, storageKey: string, storageEncode: boolean): string;

export function uu2_wasm(requestFunc: (key: string) => string, getConfig: (key: string) => string): any;
export function uu1_wasm(responseFunc: (key: string) => string): any;
export function uu3_wasm(value: string, getConfig: (key: string) => string): string;
export function uu4_wasm(responseFunc: (key: string) => string): string;
