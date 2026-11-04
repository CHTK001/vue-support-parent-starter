import type { Connect, PluginOption } from "vite";
import { copyFileSync, createReadStream, existsSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * {@code @file-viewer} 预览的**跨 app 前置条件**：office 渲染器 worker/wasm 资产补齐
 * + CJS/UMD 依赖互操作。
 *
 * <p><b>为什么单独抽一个共享模块</b>：这两件事与「哪个 app」无关，只与「这个 app 会不会
 * 渲染 file-viewer 支持的格式」有关。此前它们只写在
 * {@code apps/vue-support-monitor-starter/vite.config.ts}，于是**独立预览入口**
 * （{@code apps/vue-support-filestorage-starter}，即后端部署的
 * {@code static/preview/index.html}）落下了：同一个 {@code .pages} / {@code .tif} /
 * {@code .heic} / {@code .msg} 样本，主应用 8848 能预览、独立入口报
 * {@code iWork Worker failed to load} / {@code utif.decode is not a function}。
 * 收拢到一处后谁用谁引，不再靠复制粘贴维持一致。</p>
 */

/** dev 镜像静态资源用的 Content-Type */
function contentTypeFor(file: string): string {
  if (file.endsWith(".wasm")) return "application/wasm";
  if (/\.m?js$/i.test(file)) return "text/javascript; charset=utf-8";
  if (file.endsWith(".json")) return "application/json; charset=utf-8";
  if (file.endsWith(".otf")) return "font/otf";
  if (file.endsWith(".ttf")) return "font/ttf";
  return "application/octet-stream";
}

/** 递归复制目录整棵树，返回复制的文件数 */
function copyDirRecursive(src: string, dest: string): number {
  let count = 0;
  for (const entry of readdirSync(src, { withFileTypes: true })) {
    const from = join(src, entry.name);
    const to = join(dest, entry.name);
    if (entry.isDirectory()) {
      count += copyDirRecursive(from, to);
    } else if (entry.isFile()) {
      mkdirSync(dirname(to), { recursive: true });
      copyFileSync(from, to);
      count += 1;
    }
  }
  return count;
}

/**
 * 在 {@code node_modules/.pnpm} 里定位某个 {@code @file-viewer} 渲染器
 * {@code dist/} 下的资产文件。
 *
 * <p>{@code @file-viewer/vite-plugin} 的 copyAssets 清单只覆盖
 * docx / pdf / ppt / pptx / xlsx，漏掉了 {@code iwork / hangul / wordperfect}。
 * 这三个渲染器的 worker 由渲染器本身按 {@code document.baseURI +
 * vendor/<渲染器>/<文件>} 拼 URL 请求，缺文件就抛「iWork Worker failed to load.」
 * 并把面板降级。这里按 {@code @file-viewer+renderer-<名>@} 前缀扫 {@code .pnpm}，
 * 不写死版本号。</p>
 *
 * <p><b>为什么要多起点搜索</b>：本模块被各 app 的 vite.config 导入后，Vite 会把配置
 * <b>打包到临时文件</b>再执行，此时 {@code import.meta.url} 指向 temp 目录而非
 * {@code turbo/vite}。只从 {@code import.meta.url} 向上找会漏掉 repo 根的
 * {@code node_modules/.pnpm}。因此额外把 {@code process.cwd()}（pnpm 在 app 目录下
 * 起 vite）与调用方给定的起点一并作为搜索根 —— 任何一个够到 repo 根就行。</p>
 *
 * @param renderer 渲染器短名（{@code iwork} / {@code hangul} / {@code wordperfect}）
 * @param file 渲染器 {@code dist/} 下的相对文件名
 * @param extraRoots 额外搜索起点（如 app 根）
 * @return 命中文件的绝对路径；未安装或文件缺失时返回 {@code undefined}
 */
export function findFileViewerRendererAsset(renderer: string, file: string, extraRoots: string[] = []): string | undefined {
  const roots = [dirname(fileURLToPath(import.meta.url)), process.cwd(), ...extraRoots];
  for (const start of roots) {
    let dir = start;
    for (let i = 0; i < 12; i += 1) {
      const pnpmDir = join(dir, "node_modules", ".pnpm");
      if (existsSync(pnpmDir)) {
        const prefix = `@file-viewer+renderer-${renderer}@`;
        for (const entry of readdirSync(pnpmDir)) {
          if (!entry.startsWith(prefix)) continue;
          const candidate = join(pnpmDir, entry, "node_modules", "@file-viewer", `renderer-${renderer}`, "dist", file);
          if (existsSync(candidate)) return candidate;
        }
      }
      const parent = dirname(dir);
      if (parent === dir) break;
      dir = parent;
    }
  }
  return undefined;
}

/**
 * dev 补齐 + build 落盘 office 渲染器 worker/wasm。
 *
 * <p>dev：{@code @file-viewer/vite-plugin} 对清单外路径 {@code next()} 放行，故用
 * {@code configureServer} 普通钩子接管 {@code /vendor/iwork|hangul|wordperfect/*}
 * 并从 {@code node_modules} 直接 stream。URL 与 {@code @file-viewer/core} 默认路径一致，
 * 组件代码无需改动。</p>
 *
 * <p>build：{@code closeBundle} 把同一批文件补进产物；缺了它们 iWork / Hangul /
 * WordPerfect 在生产构建里同样预览失败。另把 {@code wasm/} 与 {@code vendor/} 整棵
 * 镜像到 {@code file-viewer/} 下：{@code @file-viewer/core} 的 copied-assets 机制先试
 * {@code <base>file-viewer/<path>} 再试 {@code <base><path>}，而 CAD 的 DWG worker
 * 只取第一个候选，缺镜像时图纸画成空场景。</p>
 */
export function fileViewerOfficeWorkers(): PluginOption {
  const assets: Record<string, string> = {};
  const register = (renderer: string, file: string, urlPath: string): void => {
    const abs = findFileViewerRendererAsset(renderer, file);
    if (abs) {
      assets[urlPath] = abs;
    } else {
      // eslint-disable-next-line no-console
      console.warn(`[file-viewer-office-workers] 未找到 ${renderer}/${file}，该格式将退回内联解析`);
    }
  };
  register("iwork", "iwork.worker.js", "/vendor/iwork/iwork.worker.js");
  register("hangul", "hangul.worker.js", "/vendor/hangul/hangul.worker.js");
  register("wordperfect", "wordperfect.worker.js", "/vendor/wordperfect/wordperfect.worker.js");
  register("wordperfect", "libwpd.mjs", "/vendor/wordperfect/libwpd.mjs");
  register("wordperfect", "libwpd.wasm", "/vendor/wordperfect/libwpd.wasm");

  let outDir = "";
  let publicDir = "";
  return {
    // 不要加 apply: "serve"：构建产物同样需要这几份文件。
    name: "file-viewer-office-workers",
    configResolved(cfg) {
      outDir = cfg.build.outDir;
      publicDir = cfg.publicDir;
    },
    configureServer(server) {
      server.middlewares.use((req: Connect.IncomingMessage, res, next: Connect.NextFunction) => {
        const pathname = (req.url || "").split("?")[0];
        const hit = assets[pathname];
        if (hit) {
          res.statusCode = 200;
          res.setHeader("Content-Type", hit.endsWith(".wasm") ? "application/wasm" : "text/javascript; charset=utf-8");
          createReadStream(hit).pipe(res);
          return;
        }
        if (publicDir && pathname.startsWith("/file-viewer/")) {
          const candidate = join(publicDir, pathname.slice("/file-viewer/".length));
          if (existsSync(candidate) && statSync(candidate).isFile()) {
            res.statusCode = 200;
            res.setHeader("Content-Type", contentTypeFor(candidate));
            createReadStream(candidate).pipe(res);
            return;
          }
        }
        next();
      });
    },
    closeBundle() {
      if (!outDir) return;
      let copied = 0;
      for (const [urlPath, abs] of Object.entries(assets)) {
        const dest = join(outDir, urlPath.replace(/^\/+/, ""));
        try {
          mkdirSync(dirname(dest), { recursive: true });
          copyFileSync(abs, dest);
          copied++;
        } catch (e) {
          // eslint-disable-next-line no-console
          console.warn(`[file-viewer-office-workers] 构建期复制 ${urlPath} 失败：${String(e)}`);
        }
      }
      if (copied > 0) {
        // eslint-disable-next-line no-console
        console.log(`[file-viewer-office-workers] 已补齐 ${copied} 份 worker/wasm 到 dist/vendor`);
      }

      let mirrored = 0;
      for (const sub of ["wasm", "vendor"]) {
        const from = join(outDir, sub);
        if (!existsSync(from)) continue;
        try {
          mirrored += copyDirRecursive(from, join(outDir, "file-viewer", sub));
        } catch (e) {
          // eslint-disable-next-line no-console
          console.warn(`[file-viewer-office-workers] 镜像 ${sub}/ 失败：${String(e)}`);
        }
      }
      if (mirrored > 0) {
        // eslint-disable-next-line no-console
        console.log(`[file-viewer-office-workers] 已镜像 ${mirrored} 份资源到 dist/file-viewer`);
      }
    },
  };
}

/** ESM 预转产物目录（由 .e2e-preview/build-cjs-esm.mjs 用 esbuild 生成） */
const CJS_VENDOR_DIR = join(dirname(fileURLToPath(import.meta.url)), "file-viewer-cjs-vendor");

/**
 * CJS/UMD 依赖的 {@code resolve.alias}：把 main-only + UMD 的包指向预转 ESM 产物。
 *
 * <p>Vite 8(Rolldown) 的 dep 优化器对 {@code utif} / {@code heic2any} 这类包产出不了
 * bundle（dev 日志 {@code The file does not exist at .../deps/utif.js}，
 * incompatible with the dep optimizer），渲染器 {@code await import('utif')} 拿不到默认
 * 导出 → 抛错 → 回退后端 iframe。alias 到本地 ESM 产物即形成标准 ESM 导入，
 * 彻底绕开优化器互操作。</p>
 *
 * @return {@code 裸包名 → 绝对产物路径}；产物缺失时对应项不出现
 */
export function fileViewerCjsEsmAliases(): Array<{ find: string; replacement: string }> {
  const esm: Record<string, string> = {
    utif: join(CJS_VENDOR_DIR, "utif.esm.mjs"),
    heic2any: join(CJS_VENDOR_DIR, "heic2any.esm.mjs"),
  };
  const out: Array<{ find: string; replacement: string }> = [];
  for (const [name, abs] of Object.entries(esm)) {
    if (existsSync(abs)) out.push({ find: name, replacement: abs });
  }
  return out;
}

/**
 * 同 {@link fileViewerCjsEsmAliases}，但返回**对象映射**。
 *
 * <p>各 app 的 vite 配置写法不一：有的用数组形式
 * （{@code alias: [{ find, replacement }, ...]}），有的用对象形式
 * （{@code alias: { 裸名: 路径 }}）。两种都给，调用方按自身形态取用，
 * 免得把数组摊进对象里变成 {@code {"0": {...}}} 这种非法项。</p>
 */
export function fileViewerCjsEsmAliasMap(): Record<string, string> {
  const map: Record<string, string> = {};
  for (const { find, replacement } of fileViewerCjsEsmAliases()) map[find] = replacement;
  return map;
}

/**
 * 启动即预打包的依赖清单（{@code optimizeDeps.include}）。
 *
 * <p>{@code @file-viewer/*} 全是 {@code import()} 动态加载的懒依赖，不在 include 里时
 * Vite 要等「某个文件被打开」才发现它们，于是运行中途触发
 * 「optimized dependencies changed. reloading」。重优化会重算 chunk 哈希，已打开页面里
 * 所有 {@code deps/@file-viewer_*.js?v=<旧哈希>} 请求当场 404，动态导入集体失败并降级到
 * 兜底面板——表现成「同一个文件第一次能渲染、刷新后变回 iframe」。</p>
 *
 * <p>同时把 CJS 互操作包一起列出：懒发现的预打包产物没有 CJS default interop，
 * 解构出来是 {@code undefined}，会以 {@code heic2any is not a function} 之类挂掉。</p>
 *
 * @param extra 各 app 自有、同样需要预热起步的依赖
 */
export function fileViewerOptimizeDepsInclude(extra: string[] = []): string[] {
  const base = [
    // file-viewer 主体与各格式渲染器
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
    // 渲染器拖进来的传递依赖
    "ag-psd",
    "saxes",
    // CJS 互操作包（default interop 靠显式 include 才有）
    "heic2any",
    "utif",
    "@kenjiuno/msgreader",
    // 表格渲染器底层：file-viewer 与业务侧必须解析到同一物理实例
    "e-virt-table/dist/index.es.js",
  ];
  return [...new Set([...base, ...extra])];
}
