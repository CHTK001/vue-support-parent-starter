# 实施计划：插件市场视觉一致性收敛（plugins-market-polish）

> 来源：improve-ui 设计审计（2026-11-20，面 = `pages/ai` 插件市场四市场 + 共享壳）。
> 审计报告结论：F1 角色卡片圆角脱档、F2 骨架屏网格错位、F3 焦点环三套写法。用户已选定三条全部转计划。
> 本文件只是计划，**不含任何产品源码改动**。

## 硬约束（实现者必读）

1. 只复用现有 CSS 变量与既有取值，**禁止新增任何 design token**。
2. 只能用 `read` / `edit` / `write` 工具改文件；禁止 shell / PowerShell / sed 批量替换（中文编码红线）。
3. 文件保持 UTF-8 无 BOM；改完校验 `BOM=0 / U+FFFD=0`。
4. 只改 `<style>` 段的 CSS 声明与相邻注释，**不改模板、不改脚本、不改类名**。
5. 交付必须贴证据：改动 diff 摘要 + 编码校验结果 + 类型检查/构建输出。

## 涉及文件

- `pages/ai/src/components/plugins/CharacterMarket.vue`
- `pages/ai/src/components/plugins/MCPServers.vue`
- `pages/ai/src/components/plugins/Skills.vue`
- `pages/ai/src/components/plugins/LocalTools.vue`

---

## W1（F1）角色市场卡片圆角收敛到 lg 档

**依据**：`packages/ui/src/components/shared/radius-vars.css` L34-35 档位语义 `lg=12px 卡片 / xl=16px 浮层(dialog)`；同页 Skills L1501、MCPServers L655、LocalTools L382 的市场卡均已取 `var(--radius-lg, var(--el-radius-lg, 12px))`。

**改动**（`CharacterMarket.vue`）：

1. L397-398：
   - 注释 `/* 原值 var(--mp-radius-lg, 14px)：--mp-radius-lg 是空令牌，实为 14px → xl 档 */`
     改为 `/* 原值 var(--mp-radius-lg, 14px)：--mp-radius-lg 是空令牌，实为 14px；按 radius-vars 档位语义（lg=卡片）收敛到 12px 档，与 Skills/MCP/本地工具三市场一致 */`
   - `border-radius: var(--radius-xl, var(--el-radius-xl, 16px));`
     改为 `border-radius: var(--radius-lg, var(--el-radius-lg, 12px));`
2. L352-357 注释块第 3 条「卡片静止态零投影，只有 hover 浮起才给投影」与 L402 实际 `box-shadow: var(--shadow-sm, …)` 矛盾，随改动改为：
   `3. 卡片静止态浅投影（--shadow-sm），hover 浮起升一档（--shadow-md）并转品牌描边。`

**验证**：15689 视检——同屏对比角色/技能/MCP/本地工具四张卡片圆角一致（12px）；暗色模式各看一眼。

---

## W2（F2）骨架屏网格对齐实体网格，消除加载回流

**依据**：骨架屏应预示实体布局；实体网格已由等高网格统一（vue 仓 commit `19b3e786d`）定为 minmax(196/210px)、gap 12px。当前三处骨架网格列宽更宽，加载完成瞬间整版卡片移位（LocalTools 最甚：300px→210px）。

**改动**（三处，均只改 `grid-template-columns` 与 `gap`）：

1. `MCPServers.vue` L736-740 `.market-skeleton__grid`：
   - `grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));` → `repeat(auto-fill, minmax(196px, 1fr));`
   - `gap: 10px 12px;` → `gap: 12px;`（与 L640-644 `.market-grid` 一致）
2. `Skills.vue` L1596 起 `.market-skeleton__grid`：
   - `grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));` → `repeat(auto-fill, minmax(196px, 1fr));`
   - `gap` 对齐实体网格（L1484 起 `.market-grid` 的 `gap: 12px`）。
3. `LocalTools.vue` L443-447 `.lt-skeleton-grid`：
   - `grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));` → `repeat(auto-fill, minmax(210px, 1fr));`
   - `gap: 12px;` 已与 `.lt-grid` 一致，不动。

**验证**：15689 视检——硬刷新进入各市场，骨架 → 数据到达瞬间卡片列数与位置不跳变（重点 LocalTools）。可复用 `test/ai-console/plugins-market-fix/probe.cjs` 回归等高断言。

---

## W3（F3）卡片焦点环统一到既有 `--focus-ring` 令牌

**依据**：`packages/theme/src/styles/tokens.css` L112/L253 定义 `--focus-ring`（明/暗两档），`packages/utils/src/modules/themeColor.ts` L90-96 随主题色动态注入。当前同页并存三种焦点环写法（color-mix 12% / primary-light-9 / 令牌），键盘焦点强度不一。

**改动**（范围限定为「卡片类可点元素」，EP 表单控件的 `--el-color-primary-light-9` 聚焦惯例保留不动）：

1. `CharacterMarket.vue` L412-414：
   `.market-card:focus-visible { box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent); }`
   → `box-shadow: var(--focus-ring);`
2. `MCPServers.vue` L845-848 附近的管理卡片 `:focus-visible`（L847 手写 `0 0 0 3px color-mix(...12%...)`）：
   → `box-shadow: var(--focus-ring);`

**验证**：15689 视检——Tab 键遍历四市场卡片，焦点环强度一致且随主题色变化；暗色模式下焦点环可见。

---

## 交付闸门

1. `git diff --stat` 仅含上述 4 个文件；无模板/脚本改动。
2. 编码校验：4 个文件 `BOM=0`、严格 UTF-8 通过、`U+FFFD=0`。
3. 类型检查/构建：按本仓口径跑 `pages/ai` 宿主 `vue-tsc`（pages 级 tsconfig + 宿主 vue-tsc.cmd）或 `pnpm build`，EXIT=0。
4. 15689 视检三组断言：四卡片同圆角、骨架→实体无回流、焦点环统一。
5. 纯视觉收敛，无数据写入，无还原动作。

## 回滚

单文件粒度 `git checkout -- <file>` 即可整体回退；无迁移、无接口变更。
