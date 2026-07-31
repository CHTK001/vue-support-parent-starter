/**
 * 异步加载 Rust wasm 加密模块
 *
 * 通过动态 import 加载 wasm-bindgen 产物，并完成初始化。
 * 加载失败时抛 SystemException（依据失败策略：wasm 失败 → 抛系统异常）。
 */
import type { CryptoModule, CryptoWasmInit } from "./types";
import { SystemException } from "./SystemException";

export interface LoadCryptoOptions {
  /** wasm 绑定 JS 的路径（默认 /wasm/crypto-wasm.js，由 Vite public 目录提供） */
  url?: string;
  /** 自定义加载器（测试或自定义集成时传入，替换默认加载逻辑） */
  loader?: () => Promise<CryptoModule>;
}

/** 默认 wasm 入口路径 */
export const DEFAULT_CRYPTO_URL = "/wasm/crypto-wasm.js";

/**
 * 加载并初始化加密模块
 * @throws SystemException 加载或初始化失败时
 */
export async function loadCrypto(options: LoadCryptoOptions = {}): Promise<CryptoModule> {
  if (options.loader) {
    try {
      return await options.loader();
    } catch (e) {
      throw new SystemException("自定义加密模块加载失败", e);
    }
  }

  const url = options.url ?? DEFAULT_CRYPTO_URL;
  try {
    const mod = (await import(/* @vite-ignore */ url)) as CryptoModule & CryptoWasmInit;
    // 初始化 wasm（wasm-bindgen 产物需先调用 init / initSync）
    if (typeof mod.init === "function") {
      await mod.init();
    } else if (typeof mod.initSync === "function") {
      mod.initSync();
    }
    // 简单的接口自检，避免加载到非预期模块后静默失败
    if (typeof mod.sm3 !== "function") {
      throw new Error("加载到的模块不是合法的加密模块（缺少 sm3 方法）");
    }
    return mod;
  } catch (e) {
    throw new SystemException(`加载 wasm 加密模块失败: ${url}`, e);
  }
}
