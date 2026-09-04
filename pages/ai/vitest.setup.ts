// Vitest + jsdom 兼容性补丁。
//
// 测试源码中常使用 `new URL('./xxx.tsx', import.meta.url)` 读取同目录下
// 的源文件做断言。vitest + jsdom 下 import.meta.url 实际值是 http://（jsdom
// baseURL），导致 URL 校验报 "URL must be of scheme file"。
//
// 实际值经 vitest.config.ts 的 fixImportMetaUrl plugin 在 transform 阶段
// 已重写为 file:// 测试文件所在目录。这里仅做兜底：如果 base 仍是 http://
// + 相对路径，强制换成 projectRoot 的 file://。当 transform 没命中时（例
// 如 source map 影响）保底不报错。

import { pathToFileURL } from 'node:url';

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
