/**
 * wasm 加密桥安装器（core 侧）
 *
 * <p>把 createApp 第①步拿到的 CryptoModule（wasm）注入 {@code @repo/utils} 的
 * 加密桥，使 utils 内的 codec.ts / aes.ts / queryCrypto.ts 等模块的加解密
 * 全部走 wasm，满足「前端所有加解密全部归 wasm」的口径。</p>
 *
 * <p>必须在 buildStorage（storage 首次使用 aes）之前安装，createApp 的装配
 * 顺序（①loadCrypto → ③buildStorage）已保证这一点。</p>
 */
import type { CryptoModule } from "./types";
import { setWasmCryptoBridge } from "@repo/utils";

/** 把 wasm 加密模块安装为 utils 的全局加密实现（幂等，重复安装以最后一次为准） */
export function installWasmCryptoBridge(crypto: CryptoModule): void {
  setWasmCryptoBridge({
    sha256Hex: (input) => crypto.sha256Hex(input),
    codecAesEncryptHex: (plaintext, keyStr) => crypto.codecAesEncryptHex(plaintext, keyStr),
    codecAesDecryptHex: (cipherHex, keyStr) => crypto.codecAesDecryptHex(cipherHex, keyStr),
    aesEcbEncrypt: (data, key) => crypto.aesEcbEncrypt(data, key),
    aesEcbDecrypt: (data, key) => crypto.aesEcbDecrypt(data, key),
  });
}
