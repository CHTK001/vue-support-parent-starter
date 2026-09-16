/**
 * 异步加载 Rust wasm 加密模块
 *
 * 通过 fetch 拉取 wasm-bindgen 产物，再以 Blob URL 动态 import 完成初始化。
 * 注意：产物位于共享 public 目录，Vite 禁止从源码 import() public 文件，
 * 故改为 fetch + Blob URL 方式绕过该限制。
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
// 产物由 rust/crypto-wasm 构建：
//   wasm-pack build --target web --out-name crypto-wasm --out-dir ../../../../public/wasm
// 注意：必须带 --out-name crypto-wasm，否则产物为 crypto_wasm.js（下划线），
// 与本路径及 config.ts 的 wasmUrl 失配，运行时将加载到过期/缺失新函数的模块。
/**
 * ⚠️ 必须带应用 base 前缀：共享 public 目录（根 public）由 createVite 的
 * `publicDir: SHARED_PUBLIC_DIR` 挂在 **base 之下**，所以产物实际地址是 `<base>wasm/...`。
 * 例如 vue-support-system-starter 的 base 被硬编码为 "/system/"（见 createVite.ts），
 * 正确路径是 /system/wasm/crypto-wasm.js，写死 "/wasm/..." 会 404 →
 * 抛「加载 wasm 加密模块失败」→ 整页空白。
 * base 为 "/" 时结果与原先完全一致（/wasm/crypto-wasm.js）。
 */
function resolveBaseUrl(): string {
  const env = (import.meta as unknown as { env?: { BASE_URL?: string } }).env;
  return (env?.BASE_URL ?? "/").replace(/\/+$/, "");
}

export const DEFAULT_CRYPTO_URL = `${resolveBaseUrl()}/wasm/crypto-wasm.js`;

/**
 * 通过 fetch + Blob URL 加载并初始化 wasm-bindgen 产物。
 * 产物导出结构：default（__wbg_init）为异步初始化入口，initSync 为同步初始化入口。
 * @param url 产物 JS 的 URL（部署到子路径时相对当前 origin 请求）
 */
export async function loadCryptoFromUrl(url: string): Promise<CryptoModule> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${res.statusText}`);
  }
  const code = await res.text();
  // wasm-bindgen 产物内部通过 new URL('<name>_bg.wasm', import.meta.url) 定位 wasm 文件，
  // Blob URL 场景下 import.meta.url 不可用，需把 wasm 的实际 URL 显式传给 init。
  const wasmUrl = url.replace(/\.js$/, "_bg.wasm");

  const blobUrl = URL.createObjectURL(new Blob([code], { type: "text/javascript" }));
  let mod: CryptoModule & CryptoWasmInit;
  try {
    mod = (await import(/* @vite-ignore */ blobUrl)) as CryptoModule & CryptoWasmInit;
  } finally {
    URL.revokeObjectURL(blobUrl);
  }

  // 初始化 wasm（wasm-bindgen 产物需先调用 init / initSync）
  const init = (mod as unknown as { default?: CryptoWasmInit["init"] }).default;
  if (typeof init === "function") {
    // 以对象形式传参，避免 wasm-bindgen 的 deprecated 参数警告
    await init({ module_or_path: wasmUrl });
  } else if (typeof mod.initSync === "function") {
    const wasmRes = await fetch(wasmUrl);
    mod.initSync(await wasmRes.arrayBuffer());
  } else {
    throw new Error("加载到的模块缺少 init 入口");
  }
  return mod;
}

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
    const mod = await loadCryptoFromUrl(url);
    // 接口自检：校验 TS 接口的真实方法名（camelCase），避免加载到非预期模块后静默失败
    const requiredMethods = [
      "aesEncrypt",
      "aesDecrypt",
      "aesVariantEncrypt",
      "aesVariantDecrypt",
      "sm2GenerateKeyPair",
      "sm2Encrypt",
      "sm2Decrypt",
      "sm3",
      "md5",
      "sm4Encrypt",
      "sm4Decrypt",
      // wasm 下沉新增的敏感算法入口（缺失即视为加载到过期/非预期模块）
      "generateNonce",
      "signRequest",
      "encryptBody",
      "decodeBody",
    ] as const;
    const missing = requiredMethods.filter((m) => typeof mod[m] !== "function");
    if (missing.length > 0) {
      throw new Error(`加载到的模块不是合法的加密模块（缺少方法: ${missing.join(", ")}）`);
    }
    return mod;
  } catch (e) {
    throw new SystemException(`加载 wasm 加密模块失败: ${url}`, e);
  }
}
