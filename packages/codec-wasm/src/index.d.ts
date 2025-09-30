// codec-wasm TypeScript声明文件

export function initializeWasmModule(): Promise<boolean>;
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
export function encryptStorageValue(value: string, key: string, systemCode: string, storageKey: string, storageEncode: string): string;
export function decryptStorageValue(value: string, key: string, systemCode: string, storageKey: string, storageEncode: string): string;

// 更新后的函数签名
// 修改uu2_wasm函数签名，接收PureHttpRequestConfig对象
export function uu2_wasm(request: any): any;
export function uu1_wasm(response: any): any;
export function uu3_wasm(value: string, codecResponseKey: string): string;
export function uu4_wasm(responseData: string, uuid: string, timestamp: string): string;