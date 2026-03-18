# @repo/build-config

统一的 Vite 构建配置包，提供链式 API 简化应用配置。

## 快速开始

### 基础用法

```typescript
// vite.config.ts
import { createViteConfig } from "@repo/build-config";
import pkg from "./package.json";

export default createViteConfig(import.meta.url, pkg)
  .port(5174)
  .proxy("/api", "http://127.0.0.1:8080")
  .build();
```

就这么简单！所有标准配置（别名、插件、优化、CSS 预处理等）都已内置。

## API 文档

### createViteConfig(metaUrl, pkg)

创建 Vite 配置构建器。

**参数**:

- `metaUrl`: `import.meta.url`（必需）
- `pkg`: `package.json` 内容（必需）

**返回**: 配置构建器对象

### 链式方法

#### .port(port: number)

设置开发服务器端口。

```typescript
.port(5174)
```

#### .proxy(path: string, target: string, changeOrigin?: boolean)

添加单个代理配置。

```typescript
.proxy("/api", "http://127.0.0.1:8080")
.proxy("/api2", "http://127.0.0.1:8081", false)
```

#### .proxies(proxies: Record<string, ProxyConfig>)

批量添加代理配置。

```typescript
.proxies({
  "/system/api": { target: "http://127.0.0.1:18170", changeOrigin: true },
  "/tenant/api": { target: "http://127.0.0.1:18171", changeOrigin: true }
})
```

#### .include(...packages: string[])

添加需要优化的依赖包。

```typescript
.include("lodash-es", "dayjs", "axios")
```

#### .exclude(...packages: string[])

排除不需要优化的依赖包。

```typescript
.exclude("some-large-package")
```

#### .mock(mockPath?: string[])

启用 mock 功能。

```typescript
.mock()  // 默认使用 ["mock"]
.mock(["mock", "mock-data"])  // 自定义路径
```

#### .alias(name: string, path: string)

添加自定义别名。

```typescript
.alias("@custom", "./src/custom")
.alias("@utils", "./src/utils")
```

#### .sourcemap(enabled?: boolean)

启用或禁用 sourcemap。

```typescript
.sourcemap(true)  // 启用
.sourcemap(false) // 禁用（默认）
```

#### .target(target: string)

设置构建目标。

```typescript
.target("es2020")  // 默认
.target("esnext")
```

#### .build()

构建最终配置（必须调用）。

```typescript
.build()
```

## 完整示例

### 简单应用

```typescript
import { createViteConfig } from "@repo/build-config";
import pkg from "./package.json";

export default createViteConfig(import.meta.url, pkg)
  .port(5174)
  .proxy("/api", "http://127.0.0.1:8080")
  .build();
```

### 复杂应用

```typescript
import { createViteConfig } from "@repo/build-config";
import pkg from "./package.json";

export default createViteConfig(import.meta.url, pkg)
  .port(5175)
  .proxies({
    "/system/api": { target: "http://127.0.0.1:18170" },
    "/tenant/api": { target: "http://127.0.0.1:18171" },
  })
  .include("lodash-es", "dayjs")
  .exclude("some-package")
  .mock(["mock"])
  .alias("@custom", "./src/custom")
  .sourcemap(true)
  .target("es2020")
  .build();
```

## 内置功能

使用 `createViteConfig()` 自动包含：

- ✅ 标准别名配置（@repo/_, @layout/_, @/\*, 等）
- ✅ Vue 插件（Vue, JSX, DevTools）
- ✅ Element Plus 自动导入
- ✅ 图标自动导入
- ✅ 国际化支持
- ✅ SVG 组件支持
- ✅ 压缩优化
- ✅ CDN 支持
- ✅ SCSS 预处理器配置
- ✅ 依赖优化配置
- ✅ 构建优化配置

## 函数式 API

如果你更喜欢函数式 API，也可以使用 `createStandardViteConfig()`：

```typescript
import { createStandardViteConfig } from "@repo/build-config";
import pkg from "./package.json";

export default createStandardViteConfig(import.meta.url, pkg, {
  port: 5174,
  proxy: {
    "/api": { target: "http://127.0.0.1:8080", changeOrigin: true },
  },
  extraInclude: ["lodash-es"],
  sourcemap: true,
});
```

## 与 createStandardApp() 的一致性

`createViteConfig()` 的设计理念与 `createStandardApp()` 保持一致：

```typescript
// main.ts - 链式 API
createStandardApp().then(async (bootstrap) => bootstrap.mount("#app"));

// vite.config.ts - 链式 API
export default createViteConfig(import.meta.url, pkg)
  .port(5174)
  .proxy("/api", "http://127.0.0.1:8080")
  .build();
```

两者都提供简洁、统一、易用的配置方式。

## 迁移指南

### 从旧配置迁移

**之前**（~90 行）:

```typescript
import { type UserConfigExport, type ConfigEnv, loadEnv } from "vite";
import {
  wrapperEnv,
  pathResolve,
  createAlias,
  createAppInfo,
  getPluginsList,
  include,
  exclude,
  getSharedPublicConfig,
} from "@repo/build-config";
import pkg from "./package.json";

export default ({ mode }: ConfigEnv): UserConfigExport => {
  const env = loadEnv(mode, appRoot);
  const { VITE_CDN, VITE_PORT, VITE_COMPRESSION, VITE_PUBLIC_PATH } =
    wrapperEnv(env);

  return {
    base: VITE_PUBLIC_PATH,
    root: appRoot,
    ...getSharedPublicConfig(),
    resolve: {
      alias: createAlias(import.meta.url),
      // ... 更多配置
    },
    // ... 大量配置代码
  };
};
```

**现在**（10 行）:

```typescript
import { createViteConfig } from "@repo/build-config";
import pkg from "./package.json";

export default createViteConfig(import.meta.url, pkg)
  .port(5174)
  .proxy("/api", "http://127.0.0.1:8080")
  .build();
```

## 版本历史

- **v2.0.0** (2026-03-18): 添加链式 API (`createViteConfig`)
- **v1.0.0**: 初始版本，提供工具函数

## License

MIT
