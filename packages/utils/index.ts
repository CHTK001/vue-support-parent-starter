import NProgress from "nprogress";
import Cookies from "js-cookie";
import * as CryptoJS from "./src/crypto/index";

export { sm2, sm4 } from "sm-crypto";
export * from "./src/crypto/codec";
export * as crypto from "./src/crypto";
export * from "./src/debug";
export * from "./src/storage";
export * from "./src/object";
export * from "./src/tree";
export * from "./src/string";
export * from "./src/sfc";
export * from "./src/load";
export * from "./src/number";
export * from "./src/http";
export type * from "./src/http";
export type * from "./src/http/types";
import * as date from "./src/date";
export * from "./src/date";
export * from "./src/image";
export * from "./src/log";
export * from "./src/area";
export * from "./src/message";
export * from "./src/color";
export * from "./src/progress/index";
export * from "./src/repo-localforage/index";
export * from "./src/preventDefault";
export * from "./src/print";
export * from "./src/menuUtils";
export * from "./src/file";
export * from "./src/url";
export * from "./src/net";
export * from "./src/zipdownload";
export * from "./src/globalPolyfills";
export * from "./src/session";
export * from "./src/page-behavior";
export * from "./src/performance";
export * from "./src/composables/usePage";
export { withInstall } from "@pureadmin/utils";
export { NProgress, Cookies, CryptoJS, date };

/** 使用 AES-ECB-Pkcs7 加密字符串（StorageKey 作密钥） */
export function aesEncrypt(data: string, key: string): string {
  try { return CryptoJS.default.AES.encrypt(data, key); } catch { return data; }
}

/** 使用 AES-ECB-Pkcs7 解密字符串（StorageKey 作密钥），失败返回原值 */
export function aesDecrypt(cipher: string, key: string): string {
  if (!cipher) return cipher;
  try { return CryptoJS.default.AES.decrypt(cipher, key) || cipher; } catch { return cipher; }
}
