# 架构重构 Plan

> 本文档记录 `vue-support-parent-starter` 的架构理解、已完成的重构工作，以及后续规划。

## 1. 背景

项目最初是 koi 主题自带整套逻辑（router / stores / utils / directives / api 等），
每个主题自有一套实现，导致：
- 主题之间逻辑重复、互不通用
- core 与 theme 存在循环依赖
- 接口 URL、状态管理、消息提示散落在各主题内

**重构目标**：koi（主题）只保留纯视觉（布局 / 登录 / 首页 / 样式），
其余全部收敛到 core / utils / pinia 等通用模块，主题之间可复用同一套逻辑。

## 2. 目标架构

### 分层

```
apps（业务应用）
  └── @repo/app（Vue 层组装 + 挂载）
        ├── @repo/theme（主题视觉）
        │     └── themes/koi（纯视觉：layouts / views/login / views/home / styles）
        ├── @repo/core（应用骨架，零主题依赖）
        ├── @repo/pinia（状态）
        ├── @repo/ui（组件，按主题加载）
        └── config / utils / languages / env / assets / pages（通用模块）
```

### 依赖方向（纯单向）

```
theme → core + ui + pinia + config + utils + languages + assets + pages
core → config + utils + element-plus（msg/指令）
pinia → config + env + core + utils + assets
utils → config + @vueuse/core（不依赖 core，避免循环）
```

### 关键约束

1. **core 零主题依赖**：core 不知道任何主题，只提供通用能力
2. **主题只提供视觉**：koi 只含布局/页面/样式/令牌
3. **通用逻辑收敛**：路由/消息/缓存/权限/接口/状态全归 core/utils/pinia
4. **无循环依赖**：core→pinia→core 等环必须打破

## 3. 已完成的重构

### 3.1 打破 core ↔ theme 循环依赖

- 移除 `core/src/createApp.ts` 对 theme 令牌（applyTheme/getTheme）的依赖
- core 的 createApp 只做纯逻辑装配（crypto/config/storage/token/http/router）
- AppContext 去掉 theme 字段（无使用者）
- theme 令牌层（tokens/applyTheme/themes）保留在 theme，core 不引用

### 3.2 主题化组件机制（@repo/ui）

- 新建 `@repo/ui/src/theme.ts`：`defineThemeComponent(name, map)` 按 themeId 动态加载
- 每个组件有 `theme/default` + `theme/koi` 双实现
- 已迁移组件：ReCard / ReDialog / ReTag / ReIcon / ReIconSelect / ReScrollNav /
  ReSearch / ReTagFilter / ReLoading / ReDrawer
- `install.ts` 支持异步注册主题化组件

### 3.3 通用模块抽取

| 模块 | 内容 | 来源 |
|------|------|------|
| `@repo/env` | 环境读取 | koi/utils/env |
| `@repo/languages` | i18n + 字典 | koi/languages |
| `@repo/pinia` | 状态层 | koi/stores + pinia 实例 |
| `@repo/assets` | 资源 + svgSprite | koi/assets |
| `@repo/pages` | 通用错误页 | koi/views/error |

### 3.4 koi 逻辑收敛到 core/utils/pinia

| 原 koi 文件 | 迁到 |
|------------|------|
| `utils/filterRoute.ts` | core `createMenuRouteResolver` |
| `utils/router.ts` | core `setRouter/getRouter` |
| `utils/koi.ts`（消息） | core `msg/notice/msgBox` |
| `utils/axiosThrottle.ts` | utils `createThrottleAdapter` |
| `utils/permission.ts` | core `hasPerm`（内存权限） |
| `utils/storage.ts` | utils `createPrefixedStore/clearSessionStorage` |
| `utils/theme.ts` | theme 公共层 `useTheme` |
| `utils/axios.ts` | core `getApiHttp` |
| `stores/modules/auth.ts` | pinia `useAuthStore` |
| `stores/modules/tabs.ts` | pinia `useTabsStore` |
| `routers/modules/dynamicRouter.ts` | pinia `initAuthRouter` |
| `config/menus.ts` | pinia `registerStaticMenu` |
| `directives/`（9 指令） | core `setupCommonDirectives` |
| `hooks/screen` | utils `useScreenStore` |
| `views/module|link|menus|analysis|console` | 删除（演示页）|
| `views/error` | @repo/pages |
| `assets/` | @repo/assets |

### 3.5 路由收敛

- core `createAppRouter`：骨架 + 守卫 + 三模式装配
- core `router/dynamic.ts`：动态路由（registerDynamicRoutes/forceRelogin/initDynamicRoutes）
- core `router/menu.ts`：菜单→路由转换（组件解析注入）
- core `router/themeRoutes.ts`：按 themeId 收敛 home/login
- theme `registerThemeRoutes(themeId, { layout, login, home })`：主题注册页面组件
- pinia `registerMenuResolver()`：主题注入菜单解析器

### 3.6 接口封装

- config 新增 `UrlConfig`：接口地址集中管理（app.yaml `url` 块）
- core `api/index.ts`：login/logout/getMe/refreshToken/getCaptcha/getDefaultSetting/getMenu
- core `setting.ts`：`loadDefaultSetting()` 拉后端配置合并到 getConfig
- pinia UserStore：`loginByUsername/refreshToken/logOut`（内部调 core api）
- koi 登录页改用真实接口（loginByUsername + getCaptcha + loadDefaultSetting）

## 4. koi 最终形态

```
packages/theme/src/themes/koi/
├── layouts/              # 布局（垂直/经典/分栏/横向/移动端等 6 种）
├── views/
│   ├── login/            # 登录页（koi 视觉）
│   └── home/             # 首页 dashboard
├── styles/               # 主题样式（theme-vars 等）
├── framework.ts          # 注册安装器 + 路由组件 + 菜单解析器 + 静态菜单
├── install.ts            # 安装器（ElementPlus/组件/指令/UI上下文）
├── index.ts              # token 定义
└── settings.ts           # 主题设置
```

koi 不再包含任何通用逻辑，只做视觉呈现。

## 5. 新增 pinia 模块

| 模块 | 职责 |
|------|------|
| `modules/user.ts` | 用户令牌/登录信息 + loginByUsername/refreshToken/logOut |
| `modules/auth.ts` | 权限/菜单/用户信息 + listRouters/getLoginUserInfo |
| `modules/tabs.ts` | 标签页状态 |
| `modules/global.ts` | 布局/主题/交互全局状态 |
| `modules/keepAlive.ts` | 页面缓存名称 |
| `menuResolver.ts` | 菜单解析器注册表（主题注入）|
| `staticMenu.ts` | 静态菜单注册（应用注册）|
| `authRouter.ts` | 认证路由初始化（initAuthRouter/forceRelogin/resetRouter）|
| `init.ts` | initPiniaFromConfig（从 config 初始化）|

## 6. 后续规划（TODO）

- [ ] **apps 业务应用补全**：当前 apps/vue-support-system-starter 很精简，需按新架构补业务路由与静态菜单注册
- [ ] **静态菜单来源**：静态菜单由业务应用（apps）通过 `registerStaticMenu` 注册，从业务路由表读取
- [ ] **刷新 token 定时**：UserStore.refreshToken 已实现，需接入自动定时刷新（core TokenManager）
- [ ] **koi 布局瘦身**：koi layouts 中仍有部分组件（Tabs/Menu 等）可进一步抽象到 ui
- [ ] **测试覆盖**：为 core api / pinia store / 路由收敛补单元测试
- [ ] **构建验证**：`pnpm install` 后跑通 `pnpm build`（当前环境 pnpm 版本与 lockfile 不匹配，需用 pnpm 9）
- [ ] **删除遗留**：清理 git 中已跟踪的 Rust target 文件（已 `git rm --cached`）

## 7. 验证方式

每个包独立类型检查（过滤 TS6305/6306 等 composite 噪音）：

```bash
# 以 core 为例
pnpm --filter @repo/core exec tsc --noEmit -p tsconfig.json
```

全部包应通过：config / env / pinia / utils / languages / assets / pages / core / theme / ui。

> 注：config/core 的 tsconfig 存在 references 但无 composite 的配置问题（TS6305 等），
> 属既有噪音，非代码错误。
