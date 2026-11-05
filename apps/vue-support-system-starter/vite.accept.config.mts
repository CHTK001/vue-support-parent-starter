/**
 * 【临时验收构建配置】仅用于「租户」验收：跳过 pages/job 的 ovx 设计沙箱路由。
 *
 * 背景：另一会话正在 pages/job/src/views/ovx/variants/ 下并行产出 5 个候选方案组件，
 * 当前 OvxVariantsView.vue 静态引用了尚未落盘的 variants/*.vue，导致整仓 vite build
 * 直接失败（Could not resolve "./variants/Flow.vue"）。该路由 meta.showLink=false，
 * 属于临时设计探索页，与租户功能完全无关。
 *
 * 本配置通过 resolveId 把这两类模块替换成空组件，不改动任何源码；
 * 验收结束后删除本文件即可。
 */
import type { PluginOption, UserConfig } from "vite";
import base from "./vite.config.ts";

function stubOvx(): PluginOption {
  const STUB = "\0accept-ovx-stub";
  return {
    name: "accept-stub-ovx",
    enforce: "pre",
    resolveId(source: string) {
      if (
        /\/views\/ovx\/OvxVariantsView\.vue$/.test(source) ||
        /\/views\/ovx\/variants\/[^/]+\.vue$/.test(source)
      ) {
        return STUB;
      }
      return null;
    },
    load(id: string) {
      if (id === STUB) {
        return `export default { name: "AcceptOvxStub", props: ["data"], render() { return null; } };`;
      }
      return null;
    },
  };
}

export default async function acceptConfig(env: Record<string, unknown>): Promise<UserConfig> {
  const raw = base as unknown as
    | UserConfig
    | ((e: Record<string, unknown>) => UserConfig | Promise<UserConfig>);
  const cfg: UserConfig = typeof raw === "function" ? await raw(env) : raw;
  return {
    ...cfg,
    plugins: [stubOvx(), ...((cfg.plugins as PluginOption[]) ?? [])],
  };
}
