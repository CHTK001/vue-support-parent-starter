/** 8899 验收配置：复用原始业务配置，但
 *  - 过滤掉 @file-viewer/vite-plugin（避开启动期 copyAssets 挂死/静默崩溃；public/vendor 已落盘）
 *  - 保留 serveFileViewerOfficeWorkers（服务 worker/wasm）
 *  - 手动沿用原始全量 optimizeDeps.include（预打包 @file-viewer/*，避免运行期 504/404）
 */
import path from "path";
import { pathToFileURL } from "url";

const APP_DIR = "D:/ch/project/vue-support-parent-starter/apps/vue-support-monitor-starter";
const CFG = path.join(APP_DIR, "vite.config.ts");
const FILE_VIEWER_PLUGIN_NAME = "file-viewer-renderers";

const FULL_INCLUDE = [
  "element-plus",
  "@repo/theme",
  "@repo/ui",
  "@file-viewer/vue3",
  "@file-viewer/vue3-full",
  "@file-viewer/preset-office",
  "@file-viewer/preset-all",
  "@file-viewer/renderer-3d",
  "@file-viewer/renderer-archive",
  "@file-viewer/renderer-binary",
  "@file-viewer/renderer-cad",
  "@file-viewer/renderer-chm",
  "@file-viewer/renderer-data",
  "@file-viewer/renderer-design",
  "@file-viewer/renderer-dicom",
  "@file-viewer/renderer-drawing",
  "@file-viewer/renderer-eda",
  "@file-viewer/renderer-email",
  "@file-viewer/renderer-epub",
  "@file-viewer/renderer-geo",
  "@file-viewer/renderer-image",
  "@file-viewer/renderer-media",
  "@file-viewer/renderer-mindmap",
  "@file-viewer/renderer-signature",
  "@file-viewer/renderer-text",
  "@file-viewer/renderer-typst",
  "ag-psd",
  "saxes",
  "e-virt-table/dist/index.es.js",
];

export default async (env: { command: string; mode: string }) => {
  const mod = await import(pathToFileURL(CFG).href);
  const base = mod.default;
  const resolved = (typeof base === "function" ? await base(env) : base) as any;

  const plugins = (resolved.plugins ?? []).filter(
    (plugin: any) => !(plugin && plugin.name === FILE_VIEWER_PLUGIN_NAME),
  );

  return {
    ...resolved,
    root: APP_DIR,
    plugins,
    optimizeDeps: {
      ...(resolved.optimizeDeps ?? {}),
      include: FULL_INCLUDE,
    },
    server: {
      ...(resolved.server ?? {}),
      port: 8899,
      strictPort: true,
      watch: {
        ...(resolved.server?.watch ?? {}),
        ignored: ["**/.tmp-probe/**", "**/node_modules/**"],
      },
    },
  };
};
