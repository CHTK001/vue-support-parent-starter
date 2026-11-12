/**
 * 页面包自带静态资源（`pages/<pkg>/public`）的 URL 挂载。
 *
 * <p><b>为什么需要它</b>：`createVite` 把 Vite 的 `publicDir` 固定成仓库根 `public`
 * （`SHARED_PUBLIC_DIR`），Vite 只认一个 publicDir，于是「页面包自己带一份要按 URL
 * 直接取的文件」（例如远控终端的 `ssh-direct.html`、xterm 的 `xterm.js`）既不被 dev
 * 服务、也不会进 dist。本插件把这类目录挂到 URL 上，源码归属保持在页面包里，
 * <b>消费方一个字节都不用复制</b>。</p>
 *
 * <p><b>两条链路</b>（与 {@code serveAppPublic} / {@code serveSharedAiImages} 同形）：</p>
 * <ul>
 *   <li>dev：{@code configureServer} 中间件直接读页面包里的文件回写，
 *       <b>零拷贝</b>，改完即生效。必须在 vite 内部 {@code htmlFallback} 之前接管，
 *       否则这类 URL 会被改写成 index.html（{@code configureServer} 早于内部中间件注册）。</li>
 *   <li>build：{@code closeBundle} 把整棵树拷到 {@code <outDir>/<urlPrefix>}，不覆盖已有文件。</li>
 * </ul>
 *
 * <p><b>优先级</b>：共享根 {@code public}（publicDir，Vite 自己服务） &gt; app 自身
 * {@code public}（serveAppPublic 兜底） &gt; 本插件挂载的页面包目录。命中前两者时本插件
 * 必须让路（{@code next()}），否则同一路径会出现两份内容互相遮蔽的错觉。</p>
 *
 * <p><b>URL 不变原则</b>：把页面包 public 挂到 URL 根时，页面里既有的
 * {@code /ssh-direct.html}、{@code /term/xterm.js} 全都不需要改——这正是选挂载而不是
 * 「搬到共享 public 再改 URL」的原因。</p>
 *
 * <p><b>代价</b>：dev 零冗余；build 仍会把文件拷进每个启用挂载的 app 的 dist
 * （Vite 没有「按文件排除 publicDir」的开关，本插件也不例外）。</p>
 *
 * 用法（app 的 vite.config.ts，opt-in）：
 * ```ts
 * import { servePagePublic } from "../../turbo/vite/servePagePublic";
 * createVite({
 *   plugins: [
 *     servePagePublic({ "/": "pages/server/public" }),   // URL 根 ← pages/server/public
 *   ],
 * });
 * ```
 *
 * @author CH
 * @since 4.0.0.57
 */
import fs from "node:fs";
import path from "node:path";
import type { Plugin } from "vite";
import { SHARED_PUBLIC_DIR, WORKSPACE_ROOT } from "./createVite.ts";

/**
 * 挂载表：URL 前缀 → 相对工作区根的目录。
 *
 * <p>`"/"` 或 `""` 表示 URL 根；`"/assets"` 之类表示只接管该前缀下的请求。</p>
 */
export type PagePublicMounts = Record<string, string>;

/**
 * 扩展名 → Content-Type。
 *
 * <p>中间件不经过 Vite 的静态服务，必须自己给；`.html` 必须带 `charset=utf-8`，
 * 否则终端页里的中文注释与文案按 GBK 解释会乱码。</p>
 */
const MIME: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".mjs": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".webp": "image/webp",
  ".txt": "text/plain; charset=utf-8",
  ".wasm": "application/wasm",
};

/**
 * 归一化 URL 前缀：`""` 与 `"/"` 都表示根，其余去掉尾部斜杠。
 *
 * @param prefix 原始前缀
 * @returns 归一化后的前缀（根为空串）
 */
function normalizePrefix(prefix: string): string {
  const raw = (prefix ?? "").trim();
  if (!raw || raw === "/") {
    return "";
  }
  const withSlash = raw.startsWith("/") ? raw : `/${raw}`;
  return withSlash.replace(/\/+$/, "");
}

/**
 * 判断 URL 是否落在某个前缀下。
 *
 * @param prefix 归一化后的前缀（空串表示根）
 * @param urlPath 请求路径
 * @returns 命中返回 true
 */
function matchesPrefix(prefix: string, urlPath: string): boolean {
  if (prefix === "") {
    return true;
  }
  return urlPath === prefix || urlPath.startsWith(`${prefix}/`);
}

/**
 * 递归复制目录，已存在的文件不覆盖（共享根与 app public 已产出的内容优先）。
 *
 * @param from 源目录
 * @param to 目标目录
 */
function copyWithoutOverwrite(from: string, to: string): void {
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const src = path.join(from, entry.name);
    const dest = path.join(to, entry.name);
    if (entry.isDirectory()) {
      fs.mkdirSync(dest, { recursive: true });
      copyWithoutOverwrite(src, dest);
    } else if (!fs.existsSync(dest)) {
      fs.copyFileSync(src, dest);
    }
  }
}

/**
 * 创建「页面包 public 挂载」插件。
 *
 * @param mounts 挂载表：URL 前缀 → 目录
 * @returns Vite 插件
 */
export function servePagePublic(mounts: PagePublicMounts): Plugin {
  const declared = Object.entries(mounts ?? {})
    .map(([prefix, dir]) => ({
      prefix: normalizePrefix(prefix),
      dir: path.resolve(WORKSPACE_ROOT, dir),
    }))
    // 长前缀优先：同时挂了 "/" 与 "/term" 时，/term/x.js 必须走更具体的那个
    .sort((a, b) => b.prefix.length - a.prefix.length);

  // 目录还没落地（迁移分步做 / 换分支）时只告警不禁用，避免一个不存在就当配置错误
  const entries = declared.filter((mount) => {
    if (!fs.existsSync(mount.dir)) {
      console.warn(`[serve-page-public] ${mount.dir} 不存在，挂载 ${mount.prefix || "/"} 已跳过`);
      return false;
    }
    return true;
  });

  // 嵌套前缀同时挂载且都指向文件时容易误判归属，显式提示一次
  const prefixes = entries.map((mount) => mount.prefix);
  for (const a of prefixes) {
    for (const b of prefixes) {
      if (a !== b && (a === "" || b.startsWith(`${a}/`))) {
        console.warn(`[serve-page-public] 前缀 "${a || "/"}" 与 "${b || "/"}" 嵌套，按最长前缀匹配`);
      }
    }
  }

  // 构建输出目录：configResolved 里解析成绝对路径，closeBundle 直接用（避免依赖 this 类型）
  let outDir = path.resolve("dist");

  return {
    name: "serve-page-public",

    configResolved(config) {
      outDir = path.resolve(config.root, config.build.outDir ?? "dist");
    },

    configureServer(server) {
      if (!entries.length) {
        return;
      }
      const appPublic = path.resolve(server.config.root, "public");
      const base = server.config.base || "/";

      server.middlewares.use((req, res, next) => {
        if (req.method !== "GET" && req.method !== "HEAD") {
          return next();
        }
        const rawUrl = (req.url ?? "/").split("?")[0] ?? "/";
        let urlPath: string;
        try {
          urlPath = decodeURIComponent(rawUrl);
        } catch {
          return next();
        }
        // 非根 base 的 app（如 /system）：中间件拿到的是带 base 的原始 URL，先剥掉
        if (base !== "/" && urlPath.startsWith(base)) {
          urlPath = `/${urlPath.slice(base.length)}`;
        }

        const mount = entries.find((item) => matchesPrefix(item.prefix, urlPath));
        if (!mount) {
          return next();
        }
        const rest = mount.prefix === "" ? urlPath : urlPath.slice(mount.prefix.length);
        const relative = `.${rest.startsWith("/") ? rest : `/${rest}`}`;
        const target = path.resolve(mount.dir, relative);
        // posix.join 已折叠 ../，这里再兜一层：绝对路径必须仍在挂载目录内
        if (target !== mount.dir && !target.startsWith(mount.dir + path.sep)) {
          return next();
        }
        if (!fs.existsSync(target) || fs.statSync(target).isDirectory()) {
          return next();
        }
        const relativePath = path.relative(mount.dir, target);
        // 共享根 public / app 自身 public 有同名文件时让路：它们由 Vite 与 serveAppPublic 服务
        if (fs.existsSync(path.join(SHARED_PUBLIC_DIR, relativePath))) {
          return next();
        }
        if (fs.existsSync(path.join(appPublic, relativePath))) {
          return next();
        }
        res.setHeader("Content-Type", MIME[path.extname(target).toLowerCase()] ?? "application/octet-stream");
        if (req.method === "HEAD") {
          res.statusCode = 200;
          res.end();
          return;
        }
        fs.createReadStream(target).pipe(res);
      });
    },

    closeBundle() {
      for (const mount of entries) {
        const dest = mount.prefix === ""
          ? outDir
          : path.join(outDir, mount.prefix.replace(/^\//, ""));
        fs.mkdirSync(dest, { recursive: true });
        copyWithoutOverwrite(mount.dir, dest);
      }
    },
  } as Plugin;
}
