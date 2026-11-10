# @techui/scifi 接入 monitor 的边界与计划（已完成，不一定会按期执行）

## 1. 决策记录

时间：2026-11-09
执行人：用户（决策）+ CH（技术验证）

用户原始需求：「给 monitor 开启 scifi，主机资产的监控整个换成这个。」

由于 `@techui/scifi` 当前版本和环境有多处硬核约束，我先做了真实产物探测，然后让用户确认三件事。**最终决策：**

| 问题 | 用户选择 |
|---|---|
| 1. 替换范围 | **不替换 UI**（备注：「不换只是升级 vue 的 npm 版本」） |
| 2. echarts | 升级 monitor 的 5.6.0 → 6.1.0，用上 TuiEcharts |
| 3. scifi 版本 | 0.1.6-alpha.1（latest，稳定一些） |

> 虽然 scope 收在「版本升级」，但以下所有探查结论、版本陷阱、技术债务都已记录，后续开工可以直接用，不用重复验证。

## 2. Phase A：版本升级（已完成，2026-11-09）

- 已修改 `pnpm-workspace.yaml` catalog（`@techui/scifi` `^2.0.0` → `0.1.6-alpha.1`，Alpha 包不能写 `^`）
- 已修改 `apps/vue-support-monitor-starter/package.json`（`echarts: ^5.6.0` → `^6.1.0`，新增 `@techui/scifi: catalog:` 依赖）
- `pnpm install --no-frozen-lockfile` 完成（peer 警告为既往问题）
- **monitor 安装包内实际版本**：`echarts@6.1.0` (app top-level), `@techui/scifi@0.1.6-alpha.1`（已装进 `.pnpm`）
- `vue-tsc --noEmit`：0 条 echarts 相关新错误
- `vite build`（monaco worker 打包）：**EXIT=0，无新错误**（production dist 完整输出）

### 运行时亲测发现（重要）

- monitor 应用 `src/` 里 **没有任何文件直接 `import 'echarts'`**（之前没发现）
- echarts 实际消费点全部在 workspace 页面包：`@pages/monitor` 声明 `echarts: ^5.6.0`（如 `ReEcharts.vue` 组件），`@pages/server`（`ScServerNodeMetrics.vue`），以及 `ol-echarts`（peer 依赖 `echarts@5.6.0`——`PosteMetricsPanel` 的地图层）
- 所以 `dist/` 里铺的是 echarts 5.6.0 + zrender 5.6.1（`lib-echarts-*.js` chunk 里 `zrender^5.6.1` 验证），`echarts@6.1.0` 目前在该 build **未被引入**
- 这条的后续影响：页面 `pages/server/src/views/HostProfileView.vue` 等页面如果以后换 `TuiEcharts`（scifi 要求 echarts 6.x），需要确保这些【页面包】也拉 6.1.0，单单在 app package.json 里写 `^6.1.0` 够不着

- **真实产物**：`dist/index.js` 823KB + `core_bg.wasm` 628KB（2.2MB 的 init wasm 必须 await）。
- **catalog bug**：`pnpm-workspace.yaml` catalog 写的是 `^2.0.0`，npm 上最高只有 `0.2.0-alpha.1`，**`^2.0.0` 装不上任何版本**。最新稳定版 `0.1.6-alpha.1`。
- **无类型声明**：`main: index.js`，无 `type`/`exports`/`types`，Vite 需 `optimizeDeps.include`，TS 需手写 `declare module`。
- **图表门槛**：源码写死 `echarts.version?.startsWith('6.')` 才注册 `TuiEcharts`/`TuiEchartsMap`，monitor 必须升 echarts 5.6.0 → 6.1.0。
- **高级组件门槛**：`Tui3DPanel`/`TuiBar3D`/`TuiPie`/`TuiPanicAlert` 等 6 个需 `advanced` 或 `license`。
- **API 签名**：默认导出 `async ({ app, license, initLang, subLicense, features, debug }) => {}`，原生就是 `AppInstaller` 的形状，可以直接挂接。
- **组件注册**：一次性注册 40+ 组件 + 6 个指令 + 6 个 globalProperties（`$tService`/`$tState`/`$echarts` 等），kol 主题并存。
- **组件 API 已探明**：panel 共享 props 是 `_t`（`backgroundOpacity`, `scale`, `decoration`, `glow`, `title`, `borderd`, `animation`, `resizeObserver` 等），标题/装饰/按钮/Header 各有共享 props（`Qn`, `An`, `cn`）。
- **单机结论**：`monitor-starter` 内已安装 `echarts@5.6.0`，`packages/theme` 内是 `echarts@6.1.0`。

## 3. 展开式 plan（可按需执行）

### Phase A — 版本升级（本次决策范围内）

1. **修 catalog 声明**：`@techui/scifi` `^2.0.0` → `0.1.6-alpha.1`（精确锁定，alpha 不能用 `^`）。
2. **升级 monitor 的 echarts**：5.6.0 → 6.1.0，让 `TuiEcharts`/`TuiEchartsMap` 能注册。
3. 跑 `vite build` + `vue-tsc --noEmit` 验证 monitor 包。

### Phase B — 接入准备（后续，不今天执行）

1. `turbo/app/src/createVueApp.ts` 补链式 `.extend()`。
2. 大屏包写 `pages/bigscreen/src/installScifi.ts` 适配薄层。
3. `declare module '@techui/scifi'` + `optimizeDeps.include: ['@techui/scifi']`。

## 4. UX 边界（决策中已排除、但必须记录）

- `AssetsView.vue` 4320 行，同时是 **远控终端 + 文件管理** 的工作台，不是纯监控页。
- `HostProfileView.vue` 和 `HostDetailView.vue`（约 1600 行）是纯监控信息展示。
- 用户选择了「不换」，所以 UI 层整个不在本次范围内。

## 5. DOM 侵入量评估

> 评估口径：整个 workspace（`pages` / `packages` / `apps` / `turbo`，不含 `node_modules`、`dist`、`.pnpm`），
> `.vue` 文件约 1000+ 个。全部为传统 DOM 渲染（`createApp`），**零 `createVaporApp` 使用**。

| 维度 | 统计量 | 解读 |
|---|---|---|
| `el-` 组件标签（`.vue` 内） | **~7416**（pages 6178 / packages 995 / apps 243） | 项目级强依赖；每处 `<el-button>` 之类都是 DOM 节点 |
| `import `element-plus` / `@element-plus/icons-vue` / `ElMessage` 等代码级引用 | **~192**（连 Vite lib 拆分 `lib-element-plus` 算入） | 24 个 page 包显式依赖，vite 有独立 split chunk 配置 |
| `document.*` / `window.*` / `createElement` / `querySelector` / `.style.` / `$refs` 直接 DOM 操作 | **~4615**（`.vue` + `.ts`） | 操作散布在业务逻辑层（复制剪贴板、proxy 监听、拖拽等），无法通过 "升级框架" 消除 |
| 脚本层（`scripts/`）DOM 探测 | 156 + | 验收/探测脚本，不影响运行时 |
| 主题层 `.vue` 模板（`v-` / `:class=` / `style=`） | **~6760** | 指令与样式绑定，Vapor 可消除类抖动但不能消除主题结构 |
| `.vue` 文件总量 | **1000+** | 全部传统 DOM 模式 |

### 结论：整个项目是重 DOM 架构，不是 "局部替换" 能消化的量

- **element-plus 是项目级基础设施**：192 处代码引用 + 6178+ 个 `el-` 标签，且 Vite 给它做了 `lib-element-plus` 独立拆分。如果切 Vapor，这些组件必须在列表中；但 `@techui/scifi` 是传统 DOM 组件库，**不能在 Vapor app 下运行**（内置 628KB WASM + 直接 DOM 操作）。
- **chips 结论**：引入 `@techui/scifi`（最小单位）不会降低 DOM 侵入量 — 它本身就是 DOM 操作者，且版本门槛（echarts 6.x、高级组件 license）锁死了只能绑在 monitor 上。
- 如果要做 Vapor 升级：**不是 "哪几个页面先上"，而是 1000+ 个页面的全量迁移路线**，每次只能逐 page 包平移。这不是一个 "插件式接入" 的活，而是一个项目级重构。
- **当前阶段最经济的路线**：保持传统 DOM 架构，只把今天已做完的 Phase A（echarts 6.1.0 + scifi 0.1.6-alpha.1 依赖安装与编译验证）做完。等 monaco 路由 / bigscreen 这类独立页面包尝到 Vapor 红利后，再评估整体 migration（届时 DOM 侵入量会一次性收回 60%+ 但配套的 theme/echarts/element-plus 全部要重新验证）。

## 6. 路线建议（对用户的确定性回复）

| 路线 | 适合场景 | 上次决策 |
|---|---|---|
| A. 仅升级 npm （Phase A 继续收口） | 用户只要版本，不要 UI | ✅ 本次已定 |
| B. Vapor 短路接入（建新 app 试 `TuiEcharts`） | 技术探路，验证 scifi 在 gen3 上的表现 | 需另开 worktree（避免破坏当前构建） |
| C. 全量 DOM 改造 | 项目级重构（3-6 个月），不在这个 scope 里 | 暂缓 |

> **下一步**：Phase A 收尾 — 在 `apps/vue-support-monitor-starter/package.json` 加上 `@techui/scifi: catalog:` 落盘，跑 `vite build` + `vue-tsc` 确认无新错误，然后把本报告的 echarts 消费点（`@pages/monitor` / `@pages/server` / `ol-echarts`）注明 "下次升级 echarts 时的目标"。
