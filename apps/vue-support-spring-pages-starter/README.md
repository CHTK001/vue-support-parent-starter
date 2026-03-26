# vue-support-spring-pages-starter

## 作用

这个应用专门负责构建并发布给 Spring 模块使用的轻量静态页。

目标是：

- 页面代码继续复用 monorepo 里的共享 `pages/*` 包
- 构建依赖尽量少，不额外绑进完整业务应用
- 发布动作统一管理，避免每个 Spring 模块手写静态资源复制脚本

## 当前共享页面

- `job-console` -> `@pages/job` 里的 `JobConsolePage`
- `payment-console` -> `@pages/pay` 里的 `PaymentConsolePage`
- `proxy-console` -> `@pages/proxy` 里的 `ProxyConsolePage`
- `strategy-console` -> `@pages/strategy` 里的 `StrategyConsolePage`
- `sync-data-console` -> `@pages/sync` 里的 `SyncDataConsolePage`

共享入口分别在：

- [pages/job/src/index.ts](/H:/workspace/2/vue-support-parent-starter/pages/job/src/index.ts)
- [pages/pay/src/index.ts](/H:/workspace/2/vue-support-parent-starter/pages/pay/src/index.ts)
- [pages/proxy/src/index.ts](/H:/workspace/2/vue-support-parent-starter/pages/proxy/src/index.ts)
- [pages/strategy/src/index.ts](/H:/workspace/2/vue-support-parent-starter/pages/strategy/src/index.ts)
- [pages/sync/src/index.ts](/H:/workspace/2/vue-support-parent-starter/pages/sync/src/index.ts)

轻页面构建侧统一走最小入口，避免把完整业务应用依赖一并打进静态控制台：

- `@pages/job` -> [pages/job/src/simple.ts](/H:/workspace/2/vue-support-parent-starter/pages/job/src/simple.ts)
- `@pages/pay` -> [pages/pay/src/simple.ts](/H:/workspace/2/vue-support-parent-starter/pages/pay/src/simple.ts)
- `@pages/strategy` -> [pages/strategy/src/simple.ts](/H:/workspace/2/vue-support-parent-starter/pages/strategy/src/simple.ts)

## 目标模块映射

发布目标配置在 [scripts/spring-page-targets.mjs](/H:/workspace/2/vue-support-parent-starter/apps/vue-support-spring-pages-starter/scripts/spring-page-targets.mjs)。

当前已接入：

- `job-console` -> `spring-api-support-scheduler-starter/src/main/resources/static/job-console`
- `payment-console` -> `spring-api-support-payment-starter/src/main/resources/static/payment-console`
- `proxy-console` -> `spring-support-proxy-starter/src/main/resources/static/proxy-console`
- `strategy-console` -> `spring-support-strategy-starter/src/main/resources/static/strategy-console`
- `sync-data-console` -> `spring-support-sync-data-starter/src/main/resources/static/sync-data-console`

其中：

- `job-console` 默认使用 `../job-console/api/`，配合 Spring Session 登录即可访问
- `payment-console` 默认使用 `../api/ops/`
- `proxy-console` 默认使用 `../proxy/`
- `strategy-console` 默认使用 `../v2/strategy/`，登录接口基址为 `../v2/strategy/auth/`
- `sync-data-console` 默认使用 `../v1/sync/`，登录接口基址为 `../v1/sync/auth/`

## 常用命令

低内存构建：

```powershell
pnpm --dir H:\workspace\2\vue-support-parent-starter --filter vue-support-spring-pages-starter build:lowmem
```

发布 `job-console`：

```powershell
pnpm --dir H:\workspace\2\vue-support-parent-starter --filter vue-support-spring-pages-starter publish:job-console
```

发布 `payment-console`：

```powershell
pnpm --dir H:\workspace\2\vue-support-parent-starter --filter vue-support-spring-pages-starter publish:payment-console
```

发布 `proxy-console`：

```powershell
pnpm --dir H:\workspace\2\vue-support-parent-starter --filter vue-support-spring-pages-starter publish:proxy-console
```

发布 `strategy-console`：

```powershell
pnpm --dir H:\workspace\2\vue-support-parent-starter --filter vue-support-spring-pages-starter publish:strategy-console
```

发布 `sync-data-console`：

```powershell
pnpm --dir H:\workspace\2\vue-support-parent-starter --filter vue-support-spring-pages-starter publish:sync-data-console
```

## 扩展建议

已接入共享简单页的模块：

- `spring-support-strategy-starter`
  - 原因：接口集中在策略配置、策略记录、手动刷新和指标查看，天然适合轻量控制台。
  - 当前状态：已接入 `strategy-console`，并约定默认 API 与轻登录基址。

适合继续接入共享简单页的模块：

- `spring-support-common-starter` 里的 `ApiFeatureController`
  - 原因：功能开关是典型的配置型页面，体量小，适合做一个很轻的控制面板。
  - 缺口：接口是内部接口，若要暴露页面，需要先明确内网限制和认证边界。
- `spring-support-sync-starter`
  - 原因：同步任务、表结构巡检、SPI 连通性和告警概览已经具备轻页面价值。
  - 当前状态：已接入 `sync-data-console`，后续重点应放在接口字段稳定和联调测试，而不是再起一套新壳。

暂不建议直接接入共享简单页的模块：

- `spring-support-email-starter`
  - 原因：接口数量多，但当前不少接口仍是占位或返回 `Map<String, Object>` 的草稿实现，页面一旦接入会把不稳定接口直接暴露出来。
  - 建议：先统一接口风格、补齐真实持久化与测试，再考虑页面。
- `spring-support-socket-sse-starter`
  - 原因：只有连接和状态接口，更偏调试工具，不值得单独维护一套控制台。
- 纯基础设施 starter
  - 原因：没有稳定的运营型 API，做页面收益不高，反而增加发布和维护面。

## 约束

- Spring 简单页只放“轻控制台”能力，不承载完整后台系统路由
- 页面样式、登录页、卡片布局等公共能力应优先沉淀到 `@pages/spring`
- 模块独立页面优先直接放在 `pages/<module>` 下，`job/payment/sync/strategy` 均按这个规则收口
- 目标 Spring 模块默认直接消费静态构建产物，不依赖 Node 运行时
