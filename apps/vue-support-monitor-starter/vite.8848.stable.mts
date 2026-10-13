/**
 * 8848 稳定 dev server 配置（用户专用实例，避开 sass-embedded 的 Dart 崩溃）。
 *
 * <p>复用 app 的 {@code vite.config.ts}（含 watch 正则修复：ignored 用正则数组，
 * 覆盖 vendor/wasm/bcmap，避免 Vite 8 原生 node:fs watcher 对 public/wasm 建
 * fs.watch 时 EBUSY 崩溃）。仅把 scss 预处理器切到纯 JS 的 {@code "modern"} API，
 * <b>不拉起任何 Dart 子进程</b>——默认配置的 sass-embedded 在多 dev server 并存时
 * 会因线程/句柄压力报 {@code Could not start thread} 崩溃并关掉 dispatcher，进而
 * 让该 vite 的全部 scss 编译失败。语义与 sass-embedded 同源（同 v1.104.1），
 * 不会引入偏差。</p>
 *
 * <p>用途：{@code vite --config vite.8848.stable.mts --port 8848 --strictPort}，
 * 起一个稳定、跑最新代码、占用 8848 的实例。与验收用的
 * {@code scripts/accept-vite.config.mts} 区分开，便于监控时只清理对方的实例。</p>
 */
import appConfig from "./vite.config.ts";

const cfg = { ...appConfig } as {
  css?: { preprocessorOptions?: { scss?: Record<string, unknown> } };
};
cfg.css = {
  ...(cfg.css ?? {}),
  preprocessorOptions: {
    ...(cfg.css?.preprocessorOptions ?? {}),
    scss: {
      ...(cfg.css?.preprocessorOptions?.scss ?? {}),
      api: "modern",
    },
  },
};

export default cfg;
