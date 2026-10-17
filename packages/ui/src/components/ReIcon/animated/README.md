# ReIcon 动画图标（icons-animated）

本目录的 `.vue` 文件来自 [ln-dev7/icons-animated](https://github.com/ln-dev7/icons-animated)
（MIT），取的是其 `frameworks/vue/<lib>/<icon>.vue` 产物，**逐字节原样引入，未做任何修改**。

- 上游提交：`3561aea87c239ade543a6388e69ea2f2edaa6ac6`
- 图标清单：`packages/ui/scripts/sync-animated-icons.mjs` 里的 `ICON_MANIFEST`
- 校验和：`sources.json`
- 许可证：`LICENSE`、`THIRD_PARTY_NOTICES.md`（分发时必须随附）

## 命名与用法

统一前缀 `anim:`，完整名为 `anim:<lib>:<icon>`：

```vue
<ReIcon name="anim:tabler:heart" :size="24" />
<ReIconSelect v-model="icon" />   <!-- 「动画」tab 里选中后回填同样的名字 -->
```

- 动画由 hover / focus 触发，已内置 `prefers-reduced-motion` 降级
- `size` 走 `ReIcon` 的 `size`（上游只接受数字，字符串会解析为数字）
- 颜色继承 `currentColor`，直接给 `ReIcon` 的 `color` 即可
- 每个图标是**独立 chunk**（`registry.ts` 里逐个动态 import），不会进主包

## 为什么只同步一部分图标

上游共 1318 个 Vue 组件、约 33.7 MB。每个文件都不是纯 SVG，而是「静态 SVG 模板 +
约 20 KB 生成式运行时（在 Vue 里重建 React hooks 与 DOM 协调器）+ Motion 的 SVG 动画引擎」，
单文件中位 26 KB。全量引入会显著膨胀仓库与构建产物，因此只同步业务实际用到的图标。

## 新增 / 升级图标

1. 改 `packages/ui/scripts/sync-animated-icons.mjs` 的 `ICON_MANIFEST`（必要时改 `UPSTREAM_REF`）
2. `pnpm --filter @repo/ui icons:sync`
3. 提交新增的 `.vue`、`registry.ts`、`sources.json`
4. `pnpm --filter @repo/ui icons:check` 必须通过（CI 里也应跑，防止手改生成物）

## 动画引擎版本

上游要求 `motion` / `framer-motion` / `motion-dom` / `motion-utils` 四包严格同版，
混版会改变 SVG spring 插值。版本固定在 `pnpm-workspace.yaml` 的 catalog 与 `overrides`，
升级时四包一起动，并重跑 `ReIcon` / `ReIconSelect` 的动画验收。
