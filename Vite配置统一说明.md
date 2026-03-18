# Vue Email 配置统一说明

## 📋 统一配置总结

### 1. main.ts 统一化

**之前的配置** (自定义方式):

```typescript
import { createApp } from "vue";
import { createPinia } from "pinia";
import ElementPlus from "element-plus";
import App from "./App.vue";
import router from "./router";

const app = createApp(App);
app.use(createPinia());
app.use(router);
app.use(ElementPlus);
app.mount("#app");
```

**现在的配置** (统一方式):

```typescript
import { createStandardApp } from "@repo/core";
import "@repo/assets/fonts/iconfont.js";
import "@repo/assets/style/modern-page.scss";
import "./styles/index.scss";

createStandardApp().then(async (bootstrap) => bootstrap.mount("#app"));
```

**优势**:

- ✅ 使用统一的应用初始化方法
- ✅ 自动处理路由、状态管理、插件注册
- ✅ 统一的样式导入
- ✅ 更少的样板代码

### 2. vite.config.ts 统一化

**之前的配置** (混合方式):

- 部分使用 `build-config`
- 部分自定义配置
- 代码冗长（~150 行）

**第一次统一** (完全统一):

```typescript
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
// ... 约 90 行配置代码
```

**现在的配置** (链式 API，仅 9 行！):

```typescript
import { createViteConfig } from "@repo/build-config";
import pkg from "./package.json";

/**
 * Vite 配置 - 邮件系统
 * 使用链式 API 简化配置
 */
export default createViteConfig(import.meta.url, pkg)
  .proxy("/api", "http://127.0.0.1:8080")
  .build();
```

**链式 API 完整功能**:

```typescript
createViteConfig(import.meta.url, pkg)
  .port(5174) // 设置端口（可选，默认 8848）
  .proxy("/api", "http://127.0.0.1:8080") // 添加单个代理
  .proxies({
    // 批量添加代理
    "/api1": { target: "http://..." },
    "/api2": { target: "http://..." },
  })
  .include("lodash-es", "dayjs") // 添加依赖优化
  .exclude("some-package") // 排除依赖
  .mock(["mock"]) // 启用 mock
  .alias("@custom", "./src/custom") // 自定义别名
  .sourcemap(true) // 启用 sourcemap
  .target("es2020") // 设置构建目标
  .build(); // 构建配置
```

**优势**:

- ✅ 完全使用 `@repo/build-config` 统一配置
- ✅ 代码极简（从 150 行 → 90 行 → 10 行）
- ✅ 链式 API 类似 `createStandardApp()`，风格统一
- ✅ 所有标准配置（别名、插件、优化、CSS）都已内置
- ✅ 易于维护和更新

### 3. 路由配置统一化

**之前的配置** (单文件方式):

```
src/router/index.ts  (所有路由在一个文件)
```

**现在的配置** (模块化方式):

```
src/router/modules/
  ├── email.ts       (主要邮箱路由)
  └── remaining.ts   (不显示在菜单的路由)
```

**优势**:

- ✅ 模块化管理路由
- ✅ 支持自动路由发现
- ✅ 更好的代码组织
- ✅ 与其他应用保持一致

## 🔧 配置对比

### 参考的应用配置

| 应用                | main.ts             | vite.config.ts | 特点            |
| ------------------- | ------------------- | -------------- | --------------- |
| **system-parent**   | `createStandardApp` | 部分统一       | 复杂配置        |
| **monitor-starter** | 自定义              | 完全自定义     | 独立配置        |
| **swagger-starter** | `createStandardApp` | 完全统一       | ✅ 最佳实践     |
| **email-starter**   | `createStandardApp` | 链式 API       | ✅ 最新最简配置 |

### 统一后的优势

1. **代码简洁**
   - main.ts: 从 20 行减少到 7 行
   - vite.config.ts: 从 150 行 → 90 行 → 9 行（链式 API）
   - 端口默认 8848，无需配置

2. **易于维护**
   - 统一的配置来源
   - 减少重复代码
   - 更新配置只需修改 `@repo/build-config`

3. **一致性**
   - main.ts 和 vite.config.ts 都使用链式 API
   - 所有应用使用相同的配置模式
   - 减少学习成本
   - 更容易在应用间切换

4. **功能完整**
   - 自动路由发现
   - 统一的插件配置
   - 统一的构建优化
   - 统一的样式处理

## 📝 配置文件说明

### main.ts

- 使用 `createStandardApp()` 创建应用
- 自动处理路由、状态管理、国际化
- 导入应用专属样式

### vite.config.ts

- 使用 `createViteConfig()` 链式 API 创建配置
- 只需配置应用特定的端口和代理
- 自动处理别名、插件、优化、CSS 等所有标准配置
- 与 `createStandardApp()` 风格一致

### router/modules/

- `email.ts`: 主要功能路由（显示在菜单）
- `remaining.ts`: 辅助路由（不显示在菜单）

## 🎯 最佳实践

### 新建应用时

1. **复制 email-starter 的配置**（最新最简）
2. **修改应用特定配置**:

   ```typescript
   // vite.config.ts
   export default createViteConfig(import.meta.url, pkg)
     .port(5175) // 修改端口
     .proxy("/api", "http://your-backend-url") // 修改代理
     .build();
   ```

3. **创建路由模块**:
   - 在 `src/router/modules/` 创建路由文件
   - 使用 `RouteConfigsTable` 类型

4. **添加应用样式**:
   - 在 `src/styles/` 创建样式文件
   - 在 main.ts 中导入

### 维护现有应用时

1. **检查是否使用统一配置**
2. **如果没有，参考本次修改进行统一**:
   - main.ts → `createStandardApp()`
   - vite.config.ts → `createViteConfig()`
3. **保持与其他应用的一致性**

## 📚 相关文档

- `@repo/build-config`: 构建配置包
- `@repo/core`: 核心功能包
- `@layout/default`: 默认布局
- `@repo/assets`: 共享资源

## ✅ 检查清单

- [x] main.ts 使用 `createStandardApp` 链式 API
- [x] vite.config.ts 使用 `createViteConfig` 链式 API
- [x] 路由采用模块化配置
- [x] 删除不必要的 App.vue
- [x] 创建 mock 目录
- [x] 添加应用样式文件
- [x] 配置简化到极致（9 行）
- [x] 端口默认 8848，无需配置

---

**更新时间**: 2026-03-18  
**配置版本**: 链式 API v2.0  
**参考应用**: email-starter（最新最简配置）
