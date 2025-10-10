// codec-wasm TypeScript声明文件

export function initializeWasmModule(): Promise<any>;
export function isWasmLoaded(): boolean;

export function generateNonce(): string;
export function generateSign(paramsJson: string, timestamp: number, nonce: string, secretKey: string): string;
export function md5Hash(input: string): string;
export function getCurrentTimestamp(): number;
export function add(a: number, b: number): number;

export function encryptAES(data: string, key: string): string;
export function decryptAES(value: string, key: string): string;

export function encryptStorageKey(key: string, systemCode: string): string;
export function encryptStorageValue(value: string, key: string, systemCode: string, storageKey: string, storageEncode: string): string;
export function decryptStorageValue(value: string, key: string, systemCode: string, storageKey: string, storageEncode: string): string;

// UU系列函数声明
export function uu1(response: any): any;
export function uu2(requestData: string, key: string): string;
export function uu3(encryptedData: string): string;
export function uu4(responseData: string, uuid: string, timestamp: string): string;

// 更新后的函数签名
// 修改uu2_wasm函数签名，接收PureHttpRequestConfig对象
export function uu2_wasm(request: any): any;
export function uu1_wasm(response: any): any;
export function uu3_wasm(value: string): string;
export function uu4_wasm(response: any): any;