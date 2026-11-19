# 账号管理前端（`@pages/account`）

本包是**账号管理前端**（账号资产 + 模板管理 + 消息模板），归属 `vue-support-parent-starter`
（2026-11-19 自后端仓 `spring-support-account-starter/web` 迁入，前后端分离）。对应后端是
`spring-support-parent-starter/spring-support-account-starter`
（`com.chua.starter.account.*` + `com.chua.starter.account.template.support.*`）。

宿主（monitor 等）通过 `@pages/account` 直接取页面源码，不再各自维护一份模板库代码。

## 目录

| 目录 | 内容 |
| --- | --- |
| `src/account/` | 账号资产页（`ScAccountAssets.vue`）、账号表单、AppKey / Cookie 弹窗、账号 API |
| `src/template/` | 模板管理（`TemplateView.vue`）、设计器、预览、打印机、调用日志、消息模板 |
| `src/shared/` | 两个域共用的小工具（`confirmThen`、`clipboard`） |
| `app.yaml` | 独立运行时的应用配置（标题、`openAuth: false`、`/api/template` 前缀） |

## 运行

本包是 `vue-support-parent-starter` 的常规 workspace 成员（`pages/*`），依赖版本统一写
`catalog:`。`pnpm install` 与脚本都通过 workspace 根执行：

```powershell
cd D:\ch\project\vue-support-parent-starter
pnpm install

# 开发（默认 19093，代理到 127.0.0.1:8082）
pnpm --filter @pages/account dev

# 类型检查（等价于本包的 pnpm build）
pnpm --filter @pages/account exec vue-tsc --noEmit
```

后端地址用环境变量覆盖（代理三路：`/api/accounts`、`/api/template`、`/api`）：

```powershell
$env:ACCOUNT_API_TARGET = "http://192.168.1.10:8082"
pnpm --filter @pages/account dev
```

## 与宿主的接线

monitor 侧已经接好，关键点：

- `package.json`：`"@pages/account": "workspace:*"`
- `vite.config.ts`：alias `@pages/account` → `pages/account`（页面根）
- `tsconfig.json`：`@pages/account` 的 paths，`include` 里补本包的 `*.d.ts`
  （`template/types/hiprint.d.ts` 声明了 `jquery` / `vue-plugin-hiprint` / `window.hiprint`）
- 路由：`/account-assets` 挂 `ScAccountAssets.vue`，并把 `templateChildRoutes`
  （设计器 / 预览 / 打印机 / 调用日志）以隐藏路由合并进去
