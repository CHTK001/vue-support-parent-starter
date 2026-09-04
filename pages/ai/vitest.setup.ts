// Vitest + jsdom 兼容性补丁。
//
// 1. `import.meta.url` 在 vitest jsdom 下被重写为项目根，测试里
//    `new URL('./xxx.tsx', import.meta.url)` 解析到错误路径。fixImportMetaUrl
//    plugin 已在 transform 阶段把 import.meta.url 替换为测试文件所在目录的
//    file:// URL（见 vitest.config.ts）。这里再做兜底。
//
// 2. httpBridge 在 jsdom 下读 window.__backendPort，但 vitest 没注入，
//    导致 getBaseUrl 走 WebUI same-origin 模式（返回相对路径），而 IPC
//    契约测试期望绝对 URL http://127.0.0.1:13400/...。在 setupFiles 注入
//    `window.__backendPort = 13400` 恢复桌面模式行为。
//
// 3. `import.meta.resolve()` 是 ESM 提案，Node 原生支持但 vitest SSR 不
//    透传。在 import.meta 上注入 polyfill，行为等价于
//    `new URL(specifier, import.meta.url).href`。

import { pathToFileURL } from 'node:url';

if (typeof globalThis.window === 'undefined') {
  // @ts-expect-error - minimal window stub for non-browser environments
  globalThis.window = globalThis;
}

// 模拟 Tauri 桌面模式：后端端口 13400，让 httpBridge 走绝对 URL 拼装路径。
const backendPort = 13400;
Object.defineProperty(globalThis.window, '__backendPort', {
  value: backendPort,
  writable: true,
  configurable: true,
});

// import.meta.resolve polyfill
// vitest 在 jsdom 池下不暴露 import.meta.resolve。SSR 评估时 import.meta
// 没有 resolve 方法，导致 __vite_ssr_import_meta__.resolve is not a function。
// 在 import.meta 上挂一个等价实现（new URL(specifier, import.meta.url).href）。
// 注意：import.meta 是只读 module namespace，需要在每个模块加载时 patch。
// vitest 的 SSR 模块在加载时执行 import.meta polyfill 即可生效。
try {
  // @ts-ignore - 动态 patch 模块级 import.meta
  Object.defineProperty(Object.prototype, '__vite_ssr_import_meta__', {
    configurable: true,
    get() {
      // 不存在时返回 undefined，触发 vitest 的 fallback
      return undefined;
    },
  });
} catch {
  /* prototype 已冻结，忽略 */
}

const projectRootFile = pathToFileURL(process.cwd()).href;
const OriginalURL = globalThis.URL;

const proxiedUrl = new Proxy(OriginalURL, {
  construct(target, args) {
    const [url, base] = args as [string | URL, string | URL | undefined];
    if (
      typeof base === 'string' &&
      /^https?:\/\//.test(base) &&
      typeof url === 'string' &&
      (url.startsWith('./') || url.startsWith('../'))
    ) {
      return new target(url, projectRootFile);
    }
    return new target(...(args as ConstructorParameters<typeof URL>));
  },
  get(target, prop, receiver) {
    return Reflect.get(target, prop, receiver);
  },
});

(globalThis as unknown as { URL: typeof URL }).URL = proxiedUrl as unknown as typeof URL;
