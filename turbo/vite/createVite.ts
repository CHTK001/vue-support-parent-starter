/**
 * createVite —— 链式创建 Vite 配置的共享入口
 *
 * 与 core 的 createApp 对称，为 monorepo 内所有业务应用提供统一的构建基线：
 *   - resolveAlias        → 统一 @repo/* 源码别名（避免依赖 package 的 build 产物）
 *   - sharedPublic        → 共享静态资源目录（根 public，wasm 等公共文件）
 *   - vue()               → Vue3 单文件组件支持
 *   - vueSetupExtend()    → <script setup name="..."> 支持（koi 等页面使用）
 *   - scss                → 统一 sass 预处理器基线（variable.scss 全局注入）
 *   - server              → 统一 dev server 基线（host / port / proxy）
 *
 * 用法：
 *   // apps/{app}/vite.config.ts
 *   import { createVite } from "../../turbo/vite/createVite";
 *   export default createVite({
 *     plugins: [...],                 // 追加业务级插件
 *     alias: { "@": resolve("src") }, // 追加业务级别名
 *     server: { port: 3001 },
 *   });
 *
 * 注意：此文件位于 turbo/vite（非 workspace 包），应用侧通过相对路径引用，
 * 与 app 自身构建强相关，不参与 packages 的发布。
 */
import { defineConfig, type Plugin, type PluginOption, type UserConfig } from "vite";
import vue from "@vitejs/plugin-vue";
// react 框架支持：framework: 'react' 时启用；依赖来自根 package.json / workspace catalog
import react from "@vitejs/plugin-react";
import vueSetupExtend from "vite-plugin-vue-setup-extend";
import UnoCSS from "unocss/vite";
import { presetWind3, presetAttributify, presetIcons, presetTypography, transformerDirectives, transformerVariantGroup, type UserConfig as UnoConfig } from "unocss";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

/** 当前文件所在目录（turbo/configs） */
const CONFIGS_DIR = path.dirname(fileURLToPath(import.meta.url));
/** monorepo 根目录（turbo/configs 的上两级） */
export const WORKSPACE_ROOT = path.resolve(CONFIGS_DIR, "../..");

/** 共享静态资源目录（根 public：wasm 等公共文件） */
export const SHARED_PUBLIC_DIR = path.resolve(WORKSPACE_ROOT, "public");

/**
 * @repo/* 包名 → 源码入口的映射（只覆盖存在的包）
 * 注意顺序：@repo/theme/koi 子路径必须排在 @repo/theme 之前，
 * 否则 koi 内部的 @repo/theme/koi/* 会被错误解析到 packages/theme/src/koi/*。
 */
const REPO_ALIAS: Record<string, string> = {
  "@repo/theme/koi": "packages/theme/src/themes/koi",
  // 卡片视觉基线入口（re-surface.css 副作用引入，见 packages/ui shared/surface.ts 头注）。
  // 必须排在 "@repo/ui" 前缀之前——字符串 alias 先匹配先赢，排后面会被前缀改写成
  // 不存在的 src/surface（包 exports 的精确子路径在 dev 下不参与解析）。
  "@repo/ui/surface": "packages/ui/src/components/shared/surface.ts",
  "@repo/app": "turbo/app/src",
  "@repo/template": "turbo/template",
  "@repo/assets": "packages/assets/src",
  "@repo/config": "packages/config/src",
  "@repo/core": "packages/core/src",
  "@pages/eduai": "pages/eduai/src",
  "@pages/ai": "pages/ai/src",
  "@pages/filesystem": "pages/filesystem/src",
  "@pages/task": "pages/task/src",
  "@pages/job": "pages/job/src",
  "@pages/hotsport": "pages/hotsport/src",
  "@pages/system": "pages/system/src",
  "@pages/actuator": "pages/actuator/src",
  "@pages/message": "pages/message/src",
  "@pages/tunnel": "pages/tunnel/src",
  "@pages/channel": "pages/channel/src",
  "@repo/env": "packages/env/src",
  "@repo/images": "packages/images/src",
  "@repo/languages": "packages/languages/src",
  "@repo/pages": "packages/pages/src",
  "@repo/pinia": "packages/pinia/src",
  "@repo/theme": "packages/theme/src",
  "@repo/ui": "packages/ui/src",
    "@repo/utils": "packages/utils/src",
    "@repo/work": "packages/work/src",
    "@repo/re-map": "packages/ui/re-map",
  };

/** @repo/{pkg}/subpath → packages/{pkg}/src/subpath（core/utils/pinia/assets/images/pages/env/languages 等） */
function repoSubPathAliases(): Array<{ find: RegExp; replacement: string }> {
  const map: Record<string, string> = {
    assets: "packages/assets/src",
    config: "packages/config/src",
    core: "packages/core/src",
    env: "packages/env/src",
    images: "packages/images/src",
    languages: "packages/languages/src",
    pages: "packages/pages/src",
    pinia: "packages/pinia/src",
    theme: "packages/theme/src",
    utils: "packages/utils/src",
  };
  return Object.entries(map).map(([pkg, dir]) => ({
    find: new RegExp(`^@repo/${pkg}/`),
    replacement: path.resolve(WORKSPACE_ROOT, dir) + "/",
  }));
}

/**
 * UnoCSS 内联配置（避免查找 uno.config.ts 时的 cwd 歧义）
 *
 * 应用可通过 CreateViteOptions.unoTheme 注入额外颜色别名（如 Element Plus CSS 变量映射），
 * 通过 unoRules 注入自定义工具规则（如 Arco 色阶 bg-primary-N 等）。共享基线不感知
 * 任何具体业务的主题色；业务侧按需扩展。
 */
function unoConfig(themeColors?: Record<string, string>, rules?: UnoConfig["rules"]): UnoConfig {
  return {
    presets: [
      presetWind3(),
      presetAttributify(),
      presetIcons({ scale: 1.2, warn: true }),
      presetTypography(),
    ],
    transformers: [transformerVariantGroup(), transformerDirectives()],
    content: {
      filesystem: [
        path.resolve(WORKSPACE_ROOT, "apps/**/*.{vue,ts,tsx,js,jsx,html}"),
        path.resolve(WORKSPACE_ROOT, "packages/**/*.{vue,ts,tsx,js,jsx,html}"),
        path.resolve(WORKSPACE_ROOT, "pages/**/*.{vue,ts,tsx,js,jsx,html}"),
      ],
    },
    ...(themeColors ? { theme: { colors: themeColors } } : {}),
    ...(rules ? { rules } : {}),
  };
}

/** 向应用入口注入 UnoCSS 虚拟样式入口（UnoCSS global 模式需要显式 import uno.css） */
function unoEntryPlugin(appRoot: string): Plugin {
  let injected = false;
  const entryRe = /[\\/]src[\\/]main\.(ts|tsx|js|jsx)$/;
  /** 本应用入口所在目录（与 id 比较时必须用同一种解析方式） */
  const appEntryDir = path.resolve(appRoot, "src");
  return {
    name: "uno-entry-injector",
    enforce: "pre",
    transformIndexHtml(html) {
      // dev + build 都通过 HTML 注入 <style> 由 UnoCSS transformIndexHtml 生成，无需额外处理
      return html;
    },
    transform(code, id) {
      // 在业务入口（main.ts / main.tsx / main.js / main.jsx）注入 virtual:uno.css，触发 UnoCSS global 模式收集
      //
      // ⚠ 必须限定「本应用的入口」而不是「任意 src/main.ts」：整仓有 10 个 app 与
      // 3 个 pages 包都叫 `src/main.ts`（`pages/monitor|remote|server` 就是），
      // 只用「第一个命中者获胜」时，先被 Vite 转换的**别的包**会抢走这次唯一注入，
      // 本应用因此拿不到 virtual:uno.css —— 表现就是「UnoCSS 全站没生效」而构建
      // 日志里 unocss 插件仍在跑（它照样扫描、照样生成，只是没有入口把它带进产物）。
      if (injected) return null;
      if (!entryRe.test(id)) return null;
      const idPath = path.resolve(id.split("?")[0]);
      if (path.dirname(idPath) !== appEntryDir) return null;
      injected = true;
      // 若应用已显式引入，则避免重复注入
      if (code.includes("virtual:uno.css")) return null;
      return `import "virtual:uno.css";\n${code}`;
    },
  };
}

/** 从 ui 包组件目录动态生成 @repo/ui/re-xxx → 组件 index.ts 的显式别名 */
export function uiExplicitAliases(): Array<{ find: string; replacement: string }> {
  const compDir = path.resolve(WORKSPACE_ROOT, "packages/ui/src/components");
  if (!fs.existsSync(compDir)) return [];
  const alias: Array<{ find: string; replacement: string }> = [];
  const entries = fs.readdirSync(compDir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const dir = entry.name; // 如 ReIconSelect
    const indexTs = path.join(compDir, dir, "index.ts");
    if (!fs.existsSync(indexTs)) continue;
    if (!/^Re[A-Z]/.test(dir)) {
      // 非 Re 前缀的共享组件（如 CreateTableDialog）：按目录名生成裸子路径别名。
      // 不补这一步会落进 REPO_ALIAS 的 @repo/ui 前缀改写（src/<子路径> 不存在），
      // 而包 exports 的精确子路径在 dev 下不参与解析（./surface 同理解析失败）。
      const bare = dir
        .replace(/([a-z])([A-Z])/g, "$1-$2")
        .replace(/([a-z])([0-9])/g, "$1-$2")
        .toLowerCase();
      alias.push({ find: `@repo/ui/${bare}`, replacement: indexTs });
      alias.push({ find: `@repo/ui/${dir}`, replacement: indexTs });
      continue;
    }
    const stripped = dir.replace(/^Re/, "");
    // 驼峰边界：
    //   - 小写字母后紧跟大写字母：插连字符（Graph -> Gr-aph）
    //   - 小写字母后紧跟数字：插连字符（Graph3D -> Graph-3D）
    //   - 数字后紧跟字母：不插连字符（Graph3D -> Graph3D，3D 视为整体）
    // 例如：Graph3D -> graph-3d，ImageGen -> image-gen，TypeIt -> type-it
    const withDash = stripped
      .replace(/([a-z])([A-Z])/g, "$1-$2")
      .replace(/([a-z])([0-9])/g, "$1-$2")
      .toLowerCase();
    // 同时支持紧凑形式（部分业务代码习惯 ReGraph3D -> re-graph3d）
    const compact = ("re-" + stripped).toLowerCase();
    const kebab = "re-" + withDash;
    // 提供多种别名形式（kebab / compact / PascalCase），兼容所有写法
    alias.push({ find: `@repo/ui/${kebab}`, replacement: indexTs });
    alias.push({ find: `@repo/ui/${compact}`, replacement: indexTs });
    alias.push({ find: `@repo/ui/${dir}`, replacement: indexTs });
  }
  return alias;
}

export interface CreateViteOptions {
  /**
   * 前端框架：'vue' | 'react'，默认 'vue'。
   * - vue   : 加载 @vitejs/plugin-vue（vue()）+ vite-plugin-vue-setup-extend（若 vueSetupExtend 开启）
   * - react : 加载 @vitejs/plugin-react（react()）
   * 其余配置（UnoCSS、别名、app.yaml、代理、index.html 模板等）完全共享。
   */
  framework?: "vue" | "react";
  /** 业务应用根目录（用于解析业务级 src、public，默认取当前工作目录） */
  root?: string;
  /** 共享 publicDir（默认 WORKSPACE_ROOT/public） */
  publicDir?: string;
  /** 应用名：注入 import.meta.env.VITE_APP_NAME，并暴露 app 配置到 /apps/{appName}/* */
  appName?: string;
  /** 页面标题：注入 import.meta.env.VITE_WEB_TITLE，并用于 index.html 模板 %APP_TITLE% */
  title?: string;
  /**
   * 应用根入口（dev/build 中 index.html 注入的 module script src）。
   * 默认 /src/main.ts（React 应用为 /src/main.tsx）；页面入口为 .js 的应用
   * （例如 pages/ai 的 src/main.js）必须显式覆盖，否则 index.html 里/module/
   * script 指向不存在的 /src/main.ts，dev 下白屏。
   */
  entry?: string;
  /** 是否启用 vue-setup-extend（默认 true） */
  vueSetupExtend?: boolean;
  /** 追加业务级插件 */
  plugins?: PluginOption[];
  /** 追加业务级别名（会覆盖同名 @repo/* 别名） */
  alias?: Record<string, string>;
  /** scss 全局注入内容（默认注入 koi variable.scss） */
  scssAdditionalData?: string;
  /**
   * UnoCSS 应用级颜色别名（key = 工具类后缀，value = CSS 变量或颜色值）。
   * 例：{ "el-bg": "var(--el-bg-color)" } → 可使用 bg-el-bg / text-el-bg 等工具类。
   * 仅作用于本应用，不会修改 monorepo 共享基线。
   */
  unoTheme?: Record<string, string>;
  /**
   * UnoCSS 自定义规则（rules），补充 preset 之外的项目专属工具类。
   * 例：Arco 色阶规则（bg-primary-1 / text-t-primary 等）通过此参数注入。
   */
  unoRules?: UnoConfig["rules"];
  /** dev server 基线覆盖（含 proxy，如转发 /system/api 到后端） */
  server?: UserConfig["server"];
  /** 其余直接透传给 defineConfig */
  config?: Omit<UserConfig, "root" | "plugins" | "resolve" | "css" | "server" | "define">;
  /** Electron 桌面应用模式：设置 base: './'，调整输出目录 */
  electron?: boolean;
  /** Tauri 桌面应用模式：设置 base: './'，调整输出目录 */
  tauri?: boolean;
}

/** 公共 index.html 模板路径（turbo/template/index.html） */
export const SHARED_INDEX_HTML = path.resolve(WORKSPACE_ROOT, "turbo/template/index.html");

/**
 * 应用采用「无 index.html 模式」：应用目录不维护 index.html。
 *
 * 实现要点：
 * - dev   : 通过中间件拦截 / 与 /index.html 请求，按需返回公共模板内容，**完全不落盘**
 * - build : vite 强制要求 root 下存在 index.html 作为 entry；
 *           通过 config 钩子写入到 appRoot/index.html，build 完成后由 closeBundle + buildEnd 清理。
 *           正常 build 结束后 app 根**不应残留** index.html。
 *
 * 应用只关心 src/ 业务代码。
 */
/** 共享的公共 index.html 模板加载（惰性缓存 + 标题替换） */
function sharedIndexHtml(title: string, entry: string = "/src/main.ts"): () => string {
  let cachedHtml: string | null = null;
  return (): string => {
    if (cachedHtml !== null) return cachedHtml;
    if (!fs.existsSync(SHARED_INDEX_HTML)) {
      cachedHtml = "<!DOCTYPE html><html><body><div id=\"app\"></div></body></html>";
      return cachedHtml;
    }
    const template = fs.readFileSync(SHARED_INDEX_HTML, "utf-8");
    cachedHtml = template.replace(/%APP_TITLE%/g, title).replace(/\/src\/main\.ts/g, entry);
    return cachedHtml;
  };
}

/** dev 插件：中间件对根路径与 SPA 路由返回公共模板，不落盘 index.html */
function devIndexTemplate(title: string, entry: string = "/src/main.ts"): Plugin {
  const loadHtml = sharedIndexHtml(title, entry);
  return {
    name: "app-index-template-dev",

    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = (req.url ?? "/").split("?")[0];
        // Vite 内部模块（/@vite/ 等）交给 vite 默认中间件
        if (url.startsWith("/@")) return next();
        // 静态资源交给 vite 默认中间件
        if (url !== "/" && url !== "/index.html" && path.extname(url)) {
          return next();
        }
        // 命中 dev proxy 前缀的导航请求（如 iframe 嵌入的后端远控页 /ms/server/remote/connect，
        // Accept 含 text/html）必须先交给 vite proxy——本中间件注册早于 proxy，
        // 若在此按 SPA fallback 处理会把代理路径吞掉返回 index.html。
        const proxyPrefixes = Object.keys(server.config.server?.proxy ?? {});
        if (proxyPrefixes.some(p => url === p || url.startsWith(p + "/"))) {
          return next();
        }
        // 非浏览器导航请求（API / XHR / fetch 等）交给 vite 默认中间件（含 server.proxy）
        // 根路径 / SPA 入口对任意 Accept（含 curl / Playwright webServer 探测的 */*）都返回 html，
        // 否则探测请求被 next() 放行后 vite 找不到物理 index.html → 404，webServer 误判不可达。
        const accept = String(req.headers.accept ?? "");
        const isRoot = url === "/" || url === "/index.html";
        if (!isRoot && !/text\/html/.test(accept)) {
          return next();
        }
        // 根路径与 SPA fallback：返回公共模板，并经过 vite 的 transformIndexHtml
        // 管道处理（@vitejs/plugin-react 的 HMR preamble、其它插件注入等），
        // 否则 plugin-react 的 RefreshRuntime preamble 会缺失导致模块报错。
        try {
          const html = await server.transformIndexHtml(url, loadHtml());
          res.statusCode = 200;
          res.setHeader("Content-Type", "text/html; charset=utf-8");
          res.end(html);
        } catch (e) {
          next(e);
        }
      });
    },
  };
}

/** build 插件：vite 强制要求 root 下存在 index.html 作为 entry，构建后清理 */
function buildIndexTemplate(title: string, appRoot: string, entry: string = "/src/main.ts"): Plugin {
  const loadHtml = sharedIndexHtml(title, entry);
  let tmpHtmlPath: string | null = null;
  return {
    name: "app-index-template-build",
    apply: "build",
    config() {
      tmpHtmlPath = path.join(appRoot, "index.html");
      fs.writeFileSync(tmpHtmlPath, loadHtml(), "utf-8");
    },
    closeBundle() {
      if (tmpHtmlPath) {
        try {
          if (fs.existsSync(tmpHtmlPath)) fs.unlinkSync(tmpHtmlPath);
        } catch (e) {
          console.warn("[createVite] 清理临时 index.html 失败：", e);
        }
        tmpHtmlPath = null;
      }
    },
    buildEnd() {
      // 兜底：万一 closeBundle 没触发也清掉
      if (tmpHtmlPath && fs.existsSync(tmpHtmlPath)) {
        try {
          fs.unlinkSync(tmpHtmlPath);
          tmpHtmlPath = null;
        } catch {}
      }
    },
  };
}

/**
 * 公共 app.yaml 模板路径（仓库根 app.example.yaml） */
export const SHARED_APP_CONFIG_TEMPLATE = path.resolve(WORKSPACE_ROOT, "app.example.yaml");

/**
 * 把仓库根的 app.example.yaml 暴露为 dev server 静态资源（路径 /app.example.yaml）。
 *
 * 必要性：
 *   - createApp 启动时会 fetch("/app.example.yaml") 作为 defaultAppConfig 之上的全局默认模板
 *   - dev 期默认 SPA fallback 会把 .yaml 请求也回退到 index.html，导致 yaml 解析失败、
 *     用户在 app.example.yaml 里改的字段（如 storage.encode=false）无法覆盖默认值
 *   - 这里通过中间件把 app.example.yaml 直接以 text/yaml 返回，跳过 SPA fallback
 *
 * build 期由 createApp 的 loadConfig 走 HTTP 拉取（生产由 nginx 同路径反代，或
 * 部署时把 app.example.yaml 放在静态资源根目录）。
 */
function serveAppExampleConfig(): Plugin {
  return {
    name: "serve-app-example-config",
    configureServer(server) {
      server.middlewares.use((req: any, res: any, next: any) => {
        const url = String(req.url ?? "").split("?")[0];
        if (url !== "/app.example.yaml" && url !== "/app.example.yml") return next();
        if (!fs.existsSync(SHARED_APP_CONFIG_TEMPLATE)) return next();
        const ext = path.extname(url).toLowerCase();
        res.setHeader("Content-Type", ext === ".yml" ? "text/yaml" : "text/yaml; charset=utf-8");
        res.setHeader("Cache-Control", "no-cache");
        fs.createReadStream(SHARED_APP_CONFIG_TEMPLATE).pipe(res);
      });
    },
  };
}

/**
 * 列出 app 根目录下的环境级配置文件名（`app.{env}.yaml` / `.yml`，排除 `app.example.yaml`）。
 *
 * 用途：`loadConfig` 的环境级 yaml 是可选文件，靠 404 探测回退会让每一页启动时
 * 都在控制台留下一条网络错误（绝大多数应用并没有 `app.{env}.yaml`）。
 * 这里把真实存在的文件名单注入 `import.meta.env.VITE_APP_ENV_CONFIGS`，让 loader 只在
 * 文件确实存在时才发请求；build 期同样把这些文件复制进 dist，保证名单与部署产物一致。
 */
function listEnvConfigFiles(appRoot: string): string[] {
  let files: string[];
  try {
    files = fs.readdirSync(appRoot);
  } catch {
    return [];
  }
  return files
    .filter((f) => /^app\.(.+)\.(ya?ml)$/i.test(f) && !/^app\.example\.ya?ml$/i.test(f))
    .sort();
}

/** 从环境级配置文件名取环境名（`app.dev.yaml` → `dev`） */
function envNamesOf(files: string[]): string[] {
  return files.map((f) => /^app\.(.+)\.(ya?ml)$/i.exec(f)?.[1] ?? "").filter(Boolean);
}

/**
 * 把 app 根目录的配置文件暴露为静态资源（dev 用中间件、build 用复制插件）。
 * 用于 createApp 默认约定 fetch `/apps/{appName}/app.yaml`。
 * 应用无需各自维护 app.yaml：缺失时自动回退到公共模板 app.example.yaml。
 */
function serveAppConfig(appName: string, appRoot: string): Plugin {
  // 只暴露配置类文件，避免泄露 app 源码
  const ALLOWED_EXT = [".yaml", ".yml", ".json"];
  const urlPrefix = `/apps/${appName}`;

  /** 解析某个配置文件的真实路径：优先 app 根目录，缺失则回退公共模板 */
  const resolveConfigFile = (urlPath: string): string | null => {
    const ext = path.extname(urlPath).toLowerCase();
    if (!ALLOWED_EXT.includes(ext)) return null;
    const appFilePath = path.resolve(appRoot, `.${urlPath}`);
    if (appFilePath.startsWith(path.resolve(appRoot)) && fs.existsSync(appFilePath) && !fs.statSync(appFilePath).isDirectory()) {
      return appFilePath;
    }
    // 回退公共模板仅用于"应用完全没有配置文件"的场景。
    // 应用已自定义 app.yaml 时，app.{env}.yaml 缺失应保持 404（沿用 app.yaml），
    // 否则模板会把 baseUrl / configConfig.enable 等字段覆盖回默认值。
    const appYamlExists =
      fs.existsSync(path.resolve(appRoot, "app.yaml")) &&
      !fs.statSync(path.resolve(appRoot, "app.yaml")).isDirectory();
    if (!appYamlExists && /\/app\.(yaml|json)$/.test(urlPath) && fs.existsSync(SHARED_APP_CONFIG_TEMPLATE)) {
      return SHARED_APP_CONFIG_TEMPLATE;
    }
    return null;
  };

  const serveFile = (urlPath: string, reqUrl: string, res: any, next: any) => {
    if (urlPath === "/" || urlPath === "") {
      return next();
    }
    const filePath = resolveConfigFile(urlPath);
    if (!filePath) {
      return next();
    }
    const ext = path.extname(urlPath).toLowerCase();
    res.setHeader("Content-Type", ext === ".json" ? "application/json" : "text/yaml");
    fs.createReadStream(filePath).pipe(res);
  };

  return {
    name: `serve-app-config-${appName}`,
    configureServer(server) {
      server.middlewares.use(urlPrefix, (req: any, res: any, next: any) => {
        serveFile(req.url ?? "/", req.url ?? "/", res, next);
      });
    },
    closeBundle() {
      // 构建产物里同步输出 app.yaml，保证部署后 createApp 默认约定仍可用
      const outDir = (this.environment.config.build.outDir as string) ?? "dist";
      // Windows 下用 posix 分隔符保证 URL 路径正确（/apps/{appName}/app.yaml）
      const dest = path.join(outDir, ...urlPrefix.replace(/^\/+|\/+$/g, "").split("/"));
      const src = path.join(appRoot, "app.yaml");
      const templateSrc = fs.existsSync(src) ? src : SHARED_APP_CONFIG_TEMPLATE;
      if (fs.existsSync(templateSrc)) {
        fs.mkdirSync(dest, { recursive: true });
        fs.copyFileSync(templateSrc, path.join(dest, "app.yaml"));
      }
      // 全局默认模板也要落到**产物根目录**：packages/config 的 loadExampleYamlPartial
      // 固定请求 `${baseUrl}/app.example.yaml`，dev 侧由上面的 serveFile 提供，
      // 构建侧原先只拷了 apps/{appName}/app.yaml，于是产物里这个请求必然 404
      // （失败虽被容忍，但控制台每次打开页面都报 Failed to load resource，
      //  且「全局默认模板」这项配置在生产实际缺失）。
      if (fs.existsSync(SHARED_APP_CONFIG_TEMPLATE)) {
        fs.mkdirSync(outDir, { recursive: true });
        fs.copyFileSync(SHARED_APP_CONFIG_TEMPLATE, path.join(outDir, "app.example.yaml"));
      }
      // 环境级 yaml 一并产出：loadConfig 按 VITE_APP_ENV_CONFIGS 名单决定是否请求，
      // 名单来自源码目录，若不在部署产物里兑现就会变成 404
      const envFiles = listEnvConfigFiles(appRoot);
      if (envFiles.length) {
        fs.mkdirSync(dest, { recursive: true });
        for (const fileName of envFiles) {
          fs.copyFileSync(path.join(appRoot, fileName), path.join(dest, fileName));
        }
      }
    },
  } as Plugin;
}

/**
 * app 自身 public 目录的兜底通道。
 *
 * Vite 只认一个 publicDir，而本仓库把它固定为根 public（wasm / loader.js 等共享资源），
 * 于是 apps/{app}/public 下的文件（remote.html、logo.svg、os/*.svg）既不被 dev 服务、
 * 也不会进 dist。这里补齐两条链路，并保持"共享目录优先、app 目录兜底"以免同名文件被遮蔽。
 */
function serveAppPublic(appRoot: string): Plugin {
  const appPublic = path.resolve(appRoot, "public");
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

  /** 命中 app public、且共享 public 目录无同名文件时返回其绝对路径 */
  const resolveAppOnlyFile = (urlPath: string): string | null => {
    let decoded: string;
    try {
      decoded = decodeURIComponent(urlPath);
    } catch {
      return null;
    }
    // posix.join 会折叠 ../，跨出 appPublic 的路径在此即被规范化
    const relative = `.${path.posix.join("/", decoded)}`;
    const target = path.resolve(appPublic, relative);
    if (target !== appPublic && !target.startsWith(appPublic + path.sep)) return null;
    if (!fs.existsSync(target) || fs.statSync(target).isDirectory()) return null;
    if (fs.existsSync(path.resolve(SHARED_PUBLIC_DIR, relative))) return null;
    return target;
  };

  /** 递归复制 app public 到输出目录，不覆盖已存在的文件 */
  const copyWithoutOverwrite = (from: string, to: string) => {
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
  };

  return {
    name: "serve-app-public",
    configureServer(server) {
      if (!fs.existsSync(appPublic)) return;
      server.middlewares.use((req: any, res: any, next: any) => {
        if (req.method !== "GET" && req.method !== "HEAD") return next();
        const urlPath = (req.url ?? "/").split("?")[0];
        const filePath = resolveAppOnlyFile(urlPath);
        if (!filePath) return next();
        res.setHeader("Content-Type", MIME[path.extname(filePath).toLowerCase()] ?? "application/octet-stream");
        fs.createReadStream(filePath).pipe(res);
      });
    },
    closeBundle() {
      if (!fs.existsSync(appPublic)) return;
      const outDir = (this.environment.config.build.outDir as string) ?? "dist";
      copyWithoutOverwrite(appPublic, outDir);
    },
  } as Plugin;
}

/**
 * 共享 AI 图片目录的全局挂载（`apps/vue-support-ai-starter/public/images`）。
 *
 * 本仓库只有 ai-starter 的 `public/images` 维护 `@pages/ai` 页面需要用到的全部静态
 * 图片（模型/供应商 Logo、对话机器人图标、Banner、二维码等），而 createVite 的 publicDir
 * 固定在仓库根 public（wasm/loader 等基础设施文件），两者不重合——于是 `@pages/ai` 的
 * 页面在 system-starter / eduai 里引用 `/images/**`（Vite 构建会原样保留这些 URL）时，
 * 必须有一处把它们驱动起来。本插件补齐两条链路：
 *   - dev：`configureServer` 中间件接管 `/images/` 前缀，直接读工作区文件回写
 *     正确 `Content-Type` 的响应，先于 vite 内部的 `baseMiddleware` / `serveStaticMiddleware`
 *     / `htmlFallbackMiddleware`，避免 `/images/**` 被误写成 `index.html`；
 *   - build：`closeBundle` 把整棵树落到 `<outDir>/images/`，且覆盖共享 `publicDir` 在
 *     `buildStart` 阶段（`prepareOutDir` 的 `copyDir`）已写的对应份——`images/models`、
 *     `images/providers` 里的旧版 Logo 来自根 public，app 版才是权威源。
 *
 * 顺序注意：`configureServer` 钩子（见 vite/dist/node/chunks/node.js `createServer`）在
 * 内部 `baseMiddleware` 注册之前执行，所以中间件拿到的是包含应用 `base` 的原始 URL
 * （如 system-starter 的 `/system/images/bots/wechat.png`），需要先剥掉 `server.config.base`
 * 前缀再与共享目录匹配。
 */
function serveSharedAiImages(): Plugin {
  const aiImages = path.resolve(WORKSPACE_ROOT, "apps/vue-support-ai-starter/public/images");
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

  /** 安全校验：URL 对应的绝对路径必须在 aiImages 内且是文件 */
  const resolveAiImageFile = (urlPath: string): string | null => {
    let decoded: string;
    try {
      decoded = decodeURIComponent(urlPath);
    } catch {
      return null;
    }
    // posix.join 会折叠 ../，跨出 aiImages 的路径在此即被规范化
    const relative = `.${path.posix.join("/", decoded)}`;
    const target = path.resolve(aiImages, relative);
    if (target === aiImages || !target.startsWith(aiImages + path.sep)) return null;
    if (!fs.existsSync(target) || fs.statSync(target).isDirectory()) return null;
    return target;
  };

  /**
   * 应用 base 前缀在 `configureServer` 注册时仍附在 URL 上（内部 baseMiddleware 注册在后），
   * 这里手动剥掉，base（`/` 或 `/system/`）处理完毕。
   */
  const stripBase = (urlPath: string, base?: string): string => {
    const prefix = (base ?? "/") === "/" ? "" : (base ?? "/");
    return prefix && urlPath.startsWith(prefix) ? urlPath.slice(prefix.length) : urlPath;
  };

  /** 递归复制，自动创建目录，覆盖已存在的文件（app 权威源） */
  const copyOverwrite = (from: string, to: string) => {
    fs.mkdirSync(to, { recursive: true });
    for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
      const src = path.join(from, entry.name);
      const dest = path.join(to, entry.name);
      if (entry.isDirectory()) {
        copyOverwrite(src, dest);
      } else {
        fs.copyFileSync(src, dest);
      }
    }
  };

  return {
    name: "serve-shared-ai-images",
    configureServer(server) {
      if (!fs.existsSync(aiImages)) return;
      server.middlewares.use((req: any, res: any, next: any) => {
        if (req.method !== "GET" && req.method !== "HEAD") return next();
        const urlPath = (req.url ?? "/").split("?")[0];
        const target = resolveAiImageFile(stripBase(urlPath, server.config.base));
        if (!target) return next();
        res.setHeader("Content-Type", MIME[path.extname(target).toLowerCase()] ?? "application/octet-stream");
        fs.createReadStream(target).pipe(res);
      });
    },
    closeBundle() {
      if (!fs.existsSync(aiImages)) return;
      const outDir = (this.environment.config.build.outDir as string) ?? "dist";
      copyOverwrite(aiImages, path.join(outDir, "images"));
    },
  } as Plugin;
}

/**
 * Vite 8 兼容兜底：@vitejs/plugin-vue v6 的 export-helper 虚拟模块
 * 在 rolldown 下 URL 处理可能异常，本插件显式接管该虚拟模块，返回正确 JS。
 */
function exportHelperFallback(): Plugin {
  const ID = "\0plugin-vue:export-helper";
  // @vitejs/plugin-vue v6 + Vite 8/rolldown 下，部分 .vue 编译产物会写
  // `import _export_sfc from "\0plugin-vue:export-helper"`，因此必须同时支持
  // 默认导入与具名导入 _export_sfc。
  const CODE = `const _export_sfc = (sfc, props) => {
  const target = sfc.__vccOpts || sfc;
  for (const [key, val] of props) {
    if (key !== 'default') { target[key] = val; }
  }
  return target;
};
export { _export_sfc };
export default _export_sfc;`;
  return {
    name: "re-export-helper-fallback",
    resolveId(id) {
      if (id === ID) return ID;
      return null;
    },
    load(id) {
      if (id === ID) return CODE;
      return null;
    },
  };
}

/**
 * 链式创建 Vite 配置
 */
/**
 * Vite 插件：为 Emscripten 生成的 UMD 文件（如 @cornerstonejs/codec-*）补 default 导出，
 * 以解决 Vite dev 下按 ESM 原样服务时 "does not provide an export named 'default'" 错误。
 * 仅在开发模式（serve）下生效，生产构交由 Rollup/Rolldown 的 commonjs 处理。
 */
function cornerstoneCodecEsmInterop(): Plugin {
  return {
    name: 'cornerstone-codec-esm-interop',
    apply: 'serve',
    transform(code, id) {
      // Windows 下 id 可能是反斜杠分隔，先归一化
      const posixId = id.replace(/\\/g, '/');
      // 只匹配 cornerstonejs codec 的 UMD 文件（如 .../codec-libjpeg-turbo-8bit/dist/libjpegturbowasm_decode.js）
      if (!posixId.includes('/node_modules/.pnpm/@cornerstonejs+codec-') && !posixId.includes('/node_modules/@cornerstonejs/codec-')) {
        return null;
      }
      if (!posixId.includes('/dist/') || !posixId.endsWith('.js')) {
        return null;
      }
      // 如果已经有导出语句（防止重复插入）
      if (code.includes('export default') || code.includes('export {')) {
        return null;
      }
      // Emscripten UMD 头部通常为：var <name> = (function() { ... })();
      // 捕获第一个 var 声明（变量名即为工厂函数）
      const varMatch = code.match(/var\s+(\w+)\s*=/);
      if (!varMatch) {
        return null;
      }
      const varName = varMatch[1];
      // 在文件末尾追加默认导出（保持原始 UMD 结构不变）
      return {
        code: `${code}\nexport default ${varName};\n`,
        map: null, // 简单追加不需要 source map 调整
      };
    },
  };
}

/**
 * dev server watch 忽略规则的类型（chokidar matcher：字符串 / 正则 / 谓词，或其数组）。
 * 用索引访问从 UserConfig 取，避免额外 import。
 */
type ViteServerOpts = NonNullable<UserConfig["server"]>;
type ViteWatchOpts = NonNullable<ViteServerOpts["watch"]>;
type ViteIgnored = NonNullable<ViteWatchOpts["ignored"]>;

/**
 * 共享基线的 watch 忽略规则：vendored / 大体量静态资源不参与 HMR，且常被
 * Windows 搜索索引、杀软、浏览器内存映射或其它进程短暂锁定 —— Vite 8 监听器
 * 对其 fs.watch 遇 EBUSY 会抛出未处理的 'error' 事件并令 dev server 直接崩溃
 * （exit 1）。已实测掉过线：public/vendor/**、public/wasm/**（libredwg-web.wasm、
 * typst/fonts/*.ttf）、pdf.js cmaps/*.bcmap。
 */
const SHARED_WATCH_IGNORED: RegExp[] = [/[/\\]vendor[/\\]/, /[/\\]wasm[/\\]/, /\.bcmap$/, /[/\\]System Volume Information[/\\]/];

/** 把 ignored 的任一种写法（字符串 / 正则 / 谓词，或其数组）归一成谓词函数 */
function toIgnorePredicate(ignored: ViteIgnored): (p: string) => boolean {
  if (typeof ignored === "function") {
    return (p) => !!ignored(p);
  }
  const list = Array.isArray(ignored) ? ignored : [ignored];
  return (p) => list.some((m) => (m instanceof RegExp ? m.test(p) : String(p).includes(String(m))));
}

/**
 * 合并共享与 app 级 watch 配置：忽略规则取并集（共享规则恒生效，app 追加的规则叠加），
 * 其余 watch 选项（usePolling 等）保留 app 的值。
 *
 * 背景：过去用 `...options.server` 直接铺开会用 app 的 watch 整体顶掉共享内置的
 * vendor/wasm/bcmap EBUSY 防护 —— app 一旦自带 watch.ignored（且没覆盖 wasm），
 * 共享防护即失效，public/wasm 下的资源再次把 dev server 崩掉。改为「合并而非覆盖」，
 * 根除该覆盖缺陷（2026-10-13 collect app 实测：app 级 watch 顶掉共享 wasm 规则后，
 * public/wasm/cad/0.8.2/libredwg-web.wasm 与 public/wasm/typst/fonts/*.ttf
 * 连续 EBUSY 崩溃）。
 */
function mergeWatch(appWatch: ViteWatchOpts | undefined): ViteWatchOpts {
  const appIgnored = appWatch?.ignored;
  if (appIgnored == null) {
    return { ...appWatch, ignored: SHARED_WATCH_IGNORED };
  }
  const appPred = toIgnorePredicate(appIgnored);
  return {
    ...appWatch,
    ignored: (p: string) => SHARED_WATCH_IGNORED.some((re) => re.test(p)) || appPred(p),
  };
}

/**
 * 构建分包：把 node_modules 第三方依赖按库打成独立 chunk（lib-*）。
 *
 * <p>部署收益：第三方库不常变 → chunk 内容 hash 不变 → 增量部署时 lib 文件
 * 不重传，只传变化的业务代码。这正是「后端资源分离 / lib 一次上传」的构建侧实现。</p>
 *
 * <p><b>为什么用 {@code codeSplitting.groups} 而不是 {@code manualChunks}</b>：
 * Vite 8 组装 rolldown 输出配置时一定会写上 {@code codeSplitting} 字段
 * （{@code codeSplitting: output.codeSplitting ?? ...}），而 rolldown 在两者同时出现时
 * <b>只认 codeSplitting、静默忽略 manualChunks</b>。构建日志里那句
 * {@code manualChunks option is ignored because the codeSplitting option is specified}
 * 就是本仓曾经的真实状态 —— 分包配置写了两年，一次都没生效
 * （实测 dist 里 {@code lib-*} 只有 5 个、合计 0.45MB，1301 个 js 共 76.6MB 全在业务 chunk 里）。</p>
 *
 * <p>实现约束：</p>
 * <ul>
 *   <li>{@code test} 里的路径分隔符必须写 {@code [\\/]}，否则 Windows 上匹配不到；</li>
 *   <li>分组之间用 {@code priority} 决定归属：数值大的先匹配，已归属高优先级组的模块
 *       会从其余组里摘掉；</li>
 *   <li>若业务在 {@code options.config.build} 里给了自己的 {@code codeSplitting} /
 *       {@code manualChunks} / {@code advancedChunks}，业务的自定义优先（不覆盖）；</li>
 *   <li>lib 分组按包名前缀归类（vue 全家桶 / element-plus / echarts / antv / three），
 *       既避免 chunk 过多拖慢首载，又能保证「某库升级后只重传那个 chunk」。</li>
 * </ul>
 */
const VENDOR_GROUPS: ReadonlyArray<{ name: string; test: RegExp; priority: number }> = [
  /**
   * vue 全家桶优先级最高：element-plus / echarts 等都会依赖它，
   * 先让 vue 模块归属 lib-vue，避免被别的组抢走导致「升级 vue 要重传所有 chunk」。
   *
   * <p>pnpm 布局下模块 id 形如
   * {@code node_modules/.pnpm/@vue+runtime-core@3.x/node_modules/@vue/runtime-core/...}，
   * 也形如 {@code node_modules/.pnpm/vue@3.x/node_modules/vue/dist/...}；
   * 两者都含 {@code /node_modules/vue/} 或 {@code /node_modules/@vue/}，故用同一正则。</p>
   */
  { name: "lib-vue", test: /[\\/]node_modules[\\/](vue|@vue)[\\/]/, priority: 100 },
  { name: "lib-element-plus", test: /[\\/]node_modules[\\/]element-plus[\\/]/, priority: 90 },
  /**
   * zrender 必须与 echarts 同组。
   *
   * <p>zrender 是 echarts 的私有渲染内核，只有 echarts 依赖它；两者一旦被拆到
   * 不同 chunk，而 {@code includeDependenciesRecursively: false} 又不会把依赖递归
   * 拽进组内，就会形成「lib-echarts ↔ zrender 所在 chunk」的循环依赖：</p>
   *
   * <pre>
   *   lib-echarts      import { ... } from "./zrender-xxxx.js"
   *   zrender-xxxx.js  import { t }  from "./lib-echarts-yyyy.js"   // 由 echarts-compat 转发
   * </pre>
   *
   * <p>实测后果（2026-11-04 监控台）：echarts 顶层 {@code new Path(...)} 执行时
   * zrender 里的 Path 还是 undefined，控制台报 {@code TypeError: P is not a constructor}，
   * 数据源中心等用到图表的页面直接白屏 —— 报错在库里，业务代码看不出问题。
   * zrender 不会单独升级，把它并入 lib-echarts 不会破坏「库升级才重传」的收益。</p>
   *
   * <p><b>echarts-compat 包装层也必须同组</b>。它是 {@code echarts} 别名的解析目标
   * （{@code packages/ui/src/shared/echarts-compat}，见下方 resolve.alias），负责给
   * 只有命名导出的 echarts 5 补一个 default 命名空间。它一旦被留在组外，rolldown
   * 会把它和 {@code __extends} 这类共享 helper 合成一个小 chunk，而 echarts 自身
   * 又要从该 chunk 取 {@code __extends} 做类继承 —— 于是形成执行顺序上的死锁：
   * 包装层要等 echarts 的命名空间对象，echarts 初始化时又要等包装层里的 helper。
   * 实测报错 {@code TypeError: t is not a function}（t 即 {@code __extends}），
   * 数据源中心仍然进不去。三者同组后 chunk 内自洽，不再跨 chunk 取初始化期依赖。</p>
   */
  {
    name: "lib-echarts",
    test: /[\\/]node_modules[\\/](echarts|zrender)[\\/]|[\\/]packages[\\/]ui[\\/]src[\\/]shared[\\/]echarts-compat[\\/]/,
    priority: 80,
  },
  // 注意：@antv/x6 也会命中 [\\/]@antv[\\/]，统一进 lib-antv（不必单独分）
  { name: "lib-antv", test: /[\\/]node_modules[\\/]@antv[\\/]/, priority: 80 },
  { name: "lib-three", test: /[\\/]node_modules[\\/]three[\\/]/, priority: 80 },
];

const buildVendorChunks = (): Exclude<UserConfig["build"], undefined> => {
  /**
   * koi 图标集合并成一个 chunk。
   *
   * <p>{@code packages/assets/src/svgSprite.ts} 用 {@code import.meta.glob("./icons/*.svg",
   * { eager: true, query: "?raw" })} 把图标当文本读进来拼 SVG sprite；rolldown 会给
   * **每个** svg 单独出一个 chunk（实测每个仅 ~186B、共 152 个），再由 framework
   * chunk 静态 import，于是 index.html 里出现 152 条 {@code modulepreload}、
   * 首屏多出 152 个请求（隧道/弱网下最慢一个请求能到分钟级）。</p>
   *
   * <p>合并后：1 个 {@code assets-icons-*.js}（约 150KB，gzip 后更小）替代 152 个小文件；
   * 且图标集不常变，增量部署几乎不必重传。注意它属于业务包而非依赖，
   * 所以匹配路径与下面 node_modules 的分组互不重叠。</p>
   */
  const assetsIcons = {
    name: "assets-icons",
    test: /[\\/]assets[\\/]src[\\/]icons[\\/][^\\/]+\.svg/,
    priority: 120,
  };
  return {
    rollupOptions: {
      output: {
        codeSplitting: {
          /**
           * 关掉「递归吞依赖」。
           *
           * <p>默认 {@code true} 会把命中模块的整棵依赖树一起拽进同组，副作用有两个：
           * 一是把「只被懒加载页面引用」的模块拖进首屏 chunk —— 2026-10-24 的
           * {@code leaflet.markercluster} 白屏事故（它的 UMD 外层裸引用全局 {@code L}，
           * 被塞进静态 chunk 后启动即 {@code ReferenceError: L is not defined}）就是这个形状；
           * 二是 lib-* 的边界会随依赖变化漂移，失去「库不升级就不重传」的意义。</p>
           *
           * <p>因此只按显式分组归类，其余交回打包器默认分包，保持原有懒加载边界。
           * 增量部署收益不变：真正不常变的就是下面这几个自包含大库。</p>
           */
          includeDependenciesRecursively: false,
          groups: [assetsIcons, ...VENDOR_GROUPS],
        },
      },
    },
  };
};

/** rollup output 的完整类型（可能是数组：多份产物配置） */
type RollupOutput = NonNullable<NonNullable<UserConfig["build"]>["rollupOptions"]>["output"];

/**
 * 合并用户 build 与共享分包：用户已给 codeSplitting / manualChunks / advancedChunks 则尊重用户。
 *
 * <p><b>为什么 output 要归一成单对象</b>：rollup 的 {@code output} 允许是数组
 * （多份产物配置）。直接 {@code ...userBuild.rollupOptions?.output} 展开进对象字面量时，
 * TS 会把「可能是数组」按数字键对象处理，与 {@code OutputOptions} 不兼容而报 TS2322。
 * 本仓各应用都只用单对象，这里取第一项归一后合并，行为不变。
 * 最后再按 {@link RollupOutput} 收口：{@code sharedOut.codeSplitting} 的类型是
 * {@code unknown}，不显式收窄同样过不了类型门禁。</p>
 */
const mergeBuild = (userBuild: UserConfig["build"]): UserConfig["build"] => {
  const shared = buildVendorChunks();
  if (!userBuild) return shared;
  const sharedOut = (shared.rollupOptions?.output ?? {}) as { codeSplitting?: unknown };
  const rawOut = userBuild.rollupOptions?.output;
  const userOut = (Array.isArray(rawOut) ? rawOut[0] : rawOut) as Record<string, unknown> | undefined;
  const userHasChunks = Boolean(
    userOut?.codeSplitting ?? userOut?.manualChunks ?? userOut?.advancedChunks,
  );
  return {
    ...userBuild,
    rollupOptions: {
      ...userBuild.rollupOptions,
      output: {
        ...(userOut ?? {}),
        ...(userHasChunks ? {} : { codeSplitting: sharedOut.codeSplitting }),
      } as RollupOutput,
    },
  };
};

/**
 * dev server fix: 304 response add Content-Type
 *
 * FF refuses 304 ESM modules with no Content-Type --- Loading failed for the module
 * warnings filled the console, login page never renders. Root cause: Vite internal 304
 * paths only set statusCode = 304 then end() without Content-Type (200 responses are fine
 * because send$1/setHeaders set this header).
 * Fix: an enforce pre dev middleware registered BEFORE Vite internal middlewares
 * (cachedTransformMiddleware, transformMiddleware, serveStaticMiddleware) intercepts
 * res.end + res.writeHead, and for 304 responses without Content-Type, reverse-engineer
 * the right Content-Type from URL suffix (js/.mjs/.ts -> text/javascript, .css -> text/css,
 * .html -> text/html) then write it back.
 * dev only, production build unaffected.
 */
function fix304ContentType(): Plugin {
  const ctByPath = (url: string): string => {
    const p = String(url ?? "").split("?")[0].split("#")[0].toLowerCase();
    if (p.endsWith(".js") || p.endsWith(".mjs") || p.endsWith(".ts") || p.endsWith(".jsx") || p.endsWith(".tsx")) return "text/javascript";
    if (p.endsWith(".css")) return "text/css";
    if (p.endsWith(".html")) return "text/html";
    if (p.endsWith(".json")) return "application/json";
    return "";
  };
  return {
    name: "fix-304-content-type",
    enforce: "pre",
    apply: "serve",
    configureServer(server: any) {
      server.middlewares.use((req: any, res: any, next: any) => {
        const origEnd = res.end.bind(res);
        const origWriteHead = res.writeHead.bind(res);
        const inject = (statusCode: number): void => {
          if (statusCode === 304 && !res.getHeader("Content-Type")) {
            const ct = ctByPath(req.url ?? "");
            if (ct) {
              console.log("[fix-304-content-type] " + req.method + " " + req.url + " 304 -> " + ct);
              res.setHeader("Content-Type", ct);
            }
          }
        };
        res.end = (...args): any => {
          inject(res.statusCode);
          return origEnd(...args);
        };
        res.writeHead = (statusCode: number, ...args): any => {
          inject(statusCode);
          return origWriteHead(statusCode, ...args);
        };
        next();
      });
    },
  };
}
export function createVite(options: CreateViteOptions = {}): UserConfig {
  const root = options.root ?? process.cwd();
  const alias: Record<string, string> = {
    ...REPO_ALIAS,
    ...options.alias,
  };

  const plugins: PluginOption[] = [];
  plugins.push(fix304ContentType());
  plugins.push(UnoCSS(unoConfig(options.unoTheme, options.unoRules)));
  plugins.push(unoEntryPlugin(root));
  // 按框架加载对应的框架插件（其余配置完全共享）
  if (options.framework === "react") {
    plugins.push(react());
  } else {
    // 默认 vue（保持向后兼容）
    plugins.push(vue());
    if (options.vueSetupExtend ?? false) {
      plugins.push(vueSetupExtend());
    }
  }
  if (options.appName) {
    plugins.push(serveAppConfig(options.appName, root));
  }
  // app 自身 public 目录兜底（Vite 的 publicDir 已被共享根 public 占用）
  plugins.push(serveAppPublic(root));
  // @pages/ai 页面使用的全部 AI 图片集中在 ai-starter 的 public/images，
  // createVite 的所有业务（system-starter / eduai 等）必须也能从 /images/** 访问同一份源，
  // 开发者请使用 /images/xxx 而不是 app 自身 public 下的路径；逻辑见 serveSharedAiImages。
  plugins.push(serveSharedAiImages());
  // 仓库根 app.example.yaml 全局暴露（dev 期 /app.example.yaml 走中间件返回 yaml）
  plugins.push(serveAppExampleConfig());
  // 兼容 Vite 8：@vitejs/plugin-vue v6 的 export-helper 虚拟模块 URL 处理在 rolldown 下有兼容问题，
  // 提供兜底插件，确保虚拟模块正常返回 JS 而非 HTML。
  plugins.push(exportHelperFallback());
  // DICOM 解码器（@cornerstonejs/codec-*）在 dev 下被按 ESM 原样服务，UMD 文件缺 default 导出，
  // 导致 dicom-image-loader 的 worker 模块加载失败（面板一直停在「解析 DICOM…」），这里补上导出。
  plugins.push(cornerstoneCodecEsmInterop());
  // 公共 index.html 模板（应用无需各自维护 index.html）
  // dev 中间件 + build 临时 index.html，拆分为两个插件（避免 apply:"build" 过滤掉 dev 中间件）
  // entry 选择：react 框架默认 main.tsx，其余默认 main.ts，应用可显式覆盖为 .js 等。
  const entry = options.entry ?? (options.framework === "react" ? "/src/main.tsx" : "/src/main.ts");
  plugins.push(devIndexTemplate(options.title ?? "Vue Support", entry));
  plugins.push(buildIndexTemplate(options.title ?? "Vue Support", root, entry));
  if (options.plugins?.length) {
    plugins.push(...options.plugins);
  }

  const scssAdditionalData =
    options.scssAdditionalData ??
    `@use "${path
      .join(WORKSPACE_ROOT, "packages/theme/src/themes/koi/styles/variable.scss")
      .replace(/\\/g, "/")}" as *;`;

const isDesktop = options.electron || options.tauri;

  // 环境级 app.{env}.yaml 名单：注入给 loadConfig，缺失时不再发起必然 404 的探测请求。
  // 新增/删除该文件需要重启 dev server（名单在配置加载期求值）。
  // 未配置 appName（不走 /apps/{appName}/ 约定）时不注入，loader 保持原有探测行为。
  const envConfigNames = options.appName ? envNamesOf(listEnvConfigFiles(root)).join(",") : null;

  // 构建分包（lib 分离部署）：合并用户 build 与共享 manualChunks，
  // 并把 options.config 里的 build 拆出来，防止展开顺序覆盖分包注入。
  const { build: userConfigBuild, ...restConfig } = options.config ?? {};
  const mergedBuild = mergeBuild(userConfigBuild);

  return defineConfig({
    root,
    publicDir: options.publicDir ?? SHARED_PUBLIC_DIR,
    /**
     * 依赖预构建缓存目录：**按 app 隔离**。
     *
     * <p>默认值是「root 下的 node_modules/.vite」，在 pnpm 工作区里碰巧也是各 app 独立；
     * 但只要 node_modules 被提升/软链（或有人改了 root），多个 dev server 就会共用同一份缓存 ——
     * 表现为互相把对方的 `optimized dependencies changed` 顶掉、反复 reload 甚至被重启。
     * 这里显式写成 `<app>/node_modules/.vite/<appName>`，把「必须隔离」固化成配置，
     * 不依赖目录布局的巧合，也给后续排查留下可辨认的路径。</p>
     *
     * <p>同时启动多个 app 的 dev server 时，各写各的缓存；代价是首次要各建一次。</p>
     */
    cacheDir: options.appName
      ? path.resolve(root, "node_modules/.vite", options.appName)
      : undefined,
    base: isDesktop ? "./" : (options.appName === "vue-support-system-starter" ? "/system/" : undefined),
    define: {
      "import.meta.env.VITE_APP_NAME": JSON.stringify(options.appName ?? ""),
      ...(envConfigNames === null
        ? {}
        : { "import.meta.env.VITE_APP_ENV_CONFIGS": JSON.stringify(envConfigNames) }),
      "import.meta.env.VITE_WEB_TITLE": JSON.stringify(options.title ?? ""),
      __ELECTRON__: JSON.stringify(!!options.electron),
      __TAURI__: JSON.stringify(!!options.tauri),
    },
    optimizeDeps: {
      exclude: ["ol-echarts"],
    },
    plugins,
    resolve: {
      alias: [
        {
          find: /^echarts$/,
          replacement: path.resolve(WORKSPACE_ROOT, "packages/ui/src/shared/echarts-compat"),
        },
        {
          // Node 内建 events 的浏览器 polyfill：@kitware/vtk.js（经 @cornerstonejs/core
          // 间接引入，DICOM 面板用到）的 commander / xmlbuilder2 会 require('events')。
          // 不装包，复用同目录的 vendored ESM polyfill（见 events-polyfill.js 头注）。
          find: /^events$/,
          replacement: path.resolve(CONFIGS_DIR, "events-polyfill.js"),
        },
        ...uiExplicitAliases(),
        ...Object.entries(alias).map(([find, replacement]) => ({
          find,
          replacement: path.isAbsolute(replacement)
            ? replacement
            : path.resolve(WORKSPACE_ROOT, replacement),
        })),
        ...repoSubPathAliases(),
      ],
    },
    css: {
      preprocessorOptions: {
        scss: {
          // Vite 默认优选 sass-embedded，但其 native compiler 在本机/Node 26 下会
          // “Tried writing to closed dispatcher”。统一走纯 JS sass，避免 dev 崩溃。
          api: "modern",
          additionalData: scssAdditionalData,
        },
      },
    },
    server: {
      host: "0.0.0.0",
      port: 5173,
      strictPort: false,
      // app 级 server 选项（port / proxy / host 等）先铺开，再以 mergeWatch 合并
      // watch：共享的 vendor/wasm/bcmap EBUSY 防护恒生效，app 追加的忽略规则与
      // 其余 watch 选项叠加（合并而非覆盖，见 mergeWatch 头注）。
      ...options.server,
      watch: mergeWatch(options.server?.watch ?? undefined),
    },
    // 构建分包注入（lib 分离部署）：见 buildVendorChunks 说明。
    // 用户 config 里的 build 先合并（用户自定义 codeSplitting / manualChunks 优先），再整体展开，
    // 避免 options.config 展开顺序把分包覆盖掉。
    build: mergedBuild,
    ...restConfig,
  } as UserConfig);
}
