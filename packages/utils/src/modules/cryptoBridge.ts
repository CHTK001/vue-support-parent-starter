/**
 * wasm 加密桥（crypto bridge）
 *
 * <p>职责：把 wasm（CryptoModule）的加密实现注入到 {@code @repo/utils} 内部，
 * 使 codec.ts / aes.ts / queryCrypto.ts 等纯工具模块不再依赖 CryptoJS，
 * 满足「前端所有加解密全部归 wasm」的口径。</p>
 *
 * <p>为何需要桥：{@code @repo/utils} 是最底层工具包，不能反向依赖 core 的
 * wasm 加载链路；core 在 createApp 第①步拿到 CryptoModule 实例后立即调用
 * {@link setWasmCryptoBridge} 安装桥，后续所有加解密经桥走 wasm。</p>
 *
 * <p>桥未安装时（单元测试、极端时序）保留 CryptoJS 兼容路径并告警一次，
 * 保证功能可用；生产链路中 createApp 先于任何 storage/请求使用加密，不会走到回退。</p>
 */

/** wasm 侧加密能力（与 core 的 CryptoModule 对应方法的子集） */
export interface WasmCryptoBridge {
  /** SHA-256 摘要（hex） */
  sha256Hex(input: string): string;
  /** codec AES-256-CBC 加密（key/iv=SHA-256(keyStr)，返回 hex，对齐后端 AesCbcCodec） */
  codecAesEncryptHex(plaintext: string, keyStr: string): string;
  /** codec AES-256-CBC 解密（hex 密文 → UTF-8 明文） */
  codecAesDecryptHex(cipherHex: string, keyStr: string): string;
  /** AES/ECB/PKCS7 加密 */
  aesEcbEncrypt(data: Uint8Array, key: Uint8Array): Uint8Array;
  /** AES/ECB/PKCS7 解密 */
  aesEcbDecrypt(data: Uint8Array, key: Uint8Array): Uint8Array;
}

let bridge: WasmCryptoBridge | null = null;
let warned = false;

/** 安装 wasm 加密桥（createApp 装配链路中调用一次；重复安装以最后一次为准） */
export function setWasmCryptoBridge(impl: WasmCryptoBridge): void {
  bridge = impl;
}

/** 读取当前桥（未安装时为 null） */
export function getWasmCryptoBridge(): WasmCryptoBridge | null {
  return bridge;
}

/** 桥未安装时的降级告警（仅告警一次，避免刷屏） */
export function warnBridgeMissing(where: string): void {
  if (warned) return;
  warned = true;
  console.warn(
    `[cryptoBridge] wasm 加密桥未安装，${where} 暂走 CryptoJS 兼容实现；`
    + "请在 createApp 装配时调用 setWasmCryptoBridge(crypto)。",
  );
}
