# 前端样式整理与体积瘦身总清单（执行版，2026-04-13）

## 1. 目标与分层

- `layout/*`：仅保留布局壳、导航框架、布局主题皮肤与布局行为样式。
- `apps/*/src/styles/*`：仅保留项目私有视觉样式，不再复制公共 token/mixin/reset。
- `packages/assets/*`：唯一公共样式资产层（tokens、mixins、base、theme、legacy 兼容入口）。
- `standalone/components-standalone`：重组件保持独立边界，避免 workspace 全量联动。

## 2. 已执行（本次已落地）

- 已打基线 tag：`frontend-20260413-234922-before-style-cleanup`
- 已删除：`packages/components/.ignored_ScLayer`
- 已删除：`pages/doc`
- 已移除 `@pages/doc` 依赖与别名：
  - `apps/vue-support-monitor-starter/package.json`
  - `apps/vue-support-swagger-starter/package.json`
  - `apps/vue-support-monitor-starter/vite.config.ts`
  - `packages/build-config/src/utils.ts`
- 已替换文档页面实现，避免删除 `pages/doc` 后编译引用断裂：
  - `apps/vue-support-swagger-starter/src/views/doc/index.vue`（转为 `doc-v2` 页面）
  - `apps/vue-support-monitor-starter/src/views/node-management/module/node-documentation/index-refactored.vue`（转 iframe 方案）
  - `apps/vue-support-monitor-starter/src/api/server/node-documentation.ts`（本地兼容导出）
  - `apps/vue-support-monitor-starter/src/api/monitor/app-document.ts`（转本地 re-export）
- 已修正 `packages/assets/style` 与 `packages/assets/styles` 的 Stitch 样式单向入口，消除循环与错误路径：
  - `packages/assets/styles/semantic-tokens.scss`
  - `packages/assets/styles/stitch-tokens.scss`
  - `packages/assets/styles/stitch-global.scss`
  - `packages/assets/styles/stitch-layout-overrides.scss`
  - `packages/assets/styles/stitch-overrides.scss`
  - `packages/assets/styles/stitch-utilities.scss`
  - `packages/assets/styles/modern-page.scss`
  - `layout/default/src/themes/stitch-layout-tokens.scss`
- `pnpm-lock.yaml` 已同步刷新（`pnpm install --lockfile-only`）。

## 3. 当前样式归属分布（源码扫描）

> 扫描范围：`*.scss/*.css`，排除 `node_modules/dist/dist-standalone/.turbo/.tmp`  
> 当前总量：`210` 文件，约 `1041.14 KB`

| 归属 | 文件数 | 体积 |
|---|---:|---:|
| layout | 89 | 398.37 KB |
| apps | 34 | 289.61 KB |
| packages/assets | 58 | 231.03 KB |
| packages/components-standalone | 7 | 60.52 KB |
| pages | 6 | 37.25 KB |
| packages/components | 7 | 22.60 KB |
| packages/standalone | 7 | 0.48 KB |
| other | 2 | 1.28 KB |

### packages/assets 内部分布

| 路径层 | 文件数 | 体积 |
|---|---:|---:|
| `packages/assets/styles` | 42 | 201.81 KB |
| `packages/assets/style` | 15 | 28.62 KB |
| `packages/assets/fonts` | 1 | 0.59 KB |

## 4. 重复样式（优先清理清单）

### 已识别重复（按 hash）

- 5 份重复（app mixins）：
  - `apps/vue-support-{hotspot/system/sync/swagger/payment}-starter/src/styles/mixins.scss`
- 4 份重复（app variables）：
  - `apps/vue-support-{hotspot/system/sync/swagger}-starter/src/styles/variables.scss`
- 2 份重复（ScMap 样式双份）：
  - `packages/standalone/ScMap/styles/*`
  - `packages/components/ScMap/styles/*`

### 立即执行（下一批）

- 抽取上述 app 公共 mixins 到 `packages/assets/styles/mixins/app-basic.scss`，apps 仅做最小配置转发。
- 抽取上述 app 公共 variables 到 `packages/assets/styles/tokens/app-base.scss`，apps 保留品牌差异参数。
- 收敛 ScMap 样式源码目录为单份，另一目录仅保留 re-export。

## 5. Turbo / workspace 继续瘦身策略

- 默认全局注入只保留 `@repo/assets/styles/tokens` + `mixins`，禁止继续注入 `@layout/default` 公共变量。
- `@repo/core` 的 `registerCoreStyles()` 应拆分：
  - 必需基础层（base）
  - 主题层（theme）
  - 重组件层（按需动态 import）
- 对大体积第三方 CSS（图形化、编辑器、富组件）全部改路由级懒加载，不进全局入口。

## 6. 验证结果

- Sass 入口编译验证通过：
  - `packages/assets/styles/base/index.scss`
  - `packages/assets/style/stitch/layout-tokens.scss`
  - `packages/assets/style/stitch/tokens.scss`
  - `packages/assets/style/stitch/semantic-tokens.scss`
- monitor/swagger 的 `typecheck` 当前存在大量历史类型错误（与本次改动无关），本次不作为阻塞项。

## 7. 后续执行顺序（建议）

1. 先完成 app 公共 mixins/variables 的集中抽取（5+4 重复文件）。
2. 再完成 ScMap/ScLayer 的单源码目录收敛（standalone 与 components 去重）。
3. 最后拆分 `@repo/core` 样式加载入口，实现“按需体积”。

