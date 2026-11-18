# tokens.css 收敛方案（设计稿 · 只出方案，未动码）

> 依据：2026-11 全仓 CSS 变量审计（扫描 1343 个样式文件、2612 条自定义属性声明、1151 个唯一变量名）。
> 扫描脚本：`_tmp_cleanup/css-var-scan*.cjs`，两两差异明细：`_tmp_cleanup/tokens-diff.txt`。

---

## 1. 现状与问题

仓库里存在 **5 份 `tokens.css`**，其中 4 份是同一变量命名家族（互相同名、互相漂移），1 份是独立命名空间：

| 文件 | :root 变量 | 品牌色 | 与 theme 份的关系 |
|---|---|---|---|
| `packages/theme/src/styles/tokens.css` | 82 | koi 紫 #6d5dfc | 基准（经 `@repo/app` 全局注入，`turbo/app/src/index.ts:17`） |
| `pages/ai/src/styles/tokens.css` | 65 | tailwind 蓝 #3b82f6 | 同名 38，同值仅 8，**漂移 30** |
| `pages/monitor/src/styles/tokens.css` | 74 | antd 蓝 #1677ff | 同名 57，同值 37，漂移 20 |
| `pages/server/src/styles/tokens.css` | 72 | antd 蓝 #1677ff | 与 monitor 份 **71 个同名全部同值**（纯拷贝，server 仅多 1 个独有变量、monitor 多 3 个） |
| `pages/hotsport/src/styles/tokens.css` | 72 | koi 基底 | **与其余 4 份零同名**（独立 `--apm-*` 命名空间，不构成冲突） |

三个具体问题：

1. **monitor 壳应用同屏加载多份**：`apps/vue-support-monitor-starter/src/main.ts:42-43` 同时 import monitor 与 server 两份 tokens.css，加上 `@repo/app` 注入的 theme 份，同一文档里三套同名变量，颜色由打包级联顺序决定。
2. **品牌色三套并行**：`--brand-500` 一个名字三个值（#6d5dfc / #3b82f6 / #1677ff）。`packages/utils/src/modules/themeColor.ts:17` 的注释自己就指出过这个矛盾。
3. **派生链断裂**：`themeColor.ts` 已具备从主题色运行时派生整套 `--brand-*` 色阶的能力（`buildBrandVars`，随 `applyPrimaryColorVars` 写入 `<html>` 行内样式），但 tokens.css 里又静态写死了一份品牌色阶，两套出处互相覆盖。

## 2. 目标与非目标

**目标**

- 同一个 CSS 变量名全局只有一个权威定义处（single source of truth）。
- 品牌色阶（`--brand-*`、`--el-color-primary*`、`--focus-ring`、`--selection-bg`）单一出处：运行时由 `themeColor.ts` 派生。
- 各 app 的视觉差异显式化为「默认主题色 + 页面私有令牌」，而不是整份 tokens.css 拷贝。

**非目标**

- 不追求迁移期间像素级零变化以外的「顺手改设计」；视觉是否变化以逐屏对比为准。
- 不动 hotsport 的 `--apm-*` 独立命名空间（无冲突，不在此案范围）。

## 3. 目标架构：三层模型

```text
L0 结构令牌层   packages/theme/src/styles/tokens.css（唯一保留的 tokens.css）
               中性色 / 状态色 / 阴影 / 圆角 / 间距 / 字体 + html.dark 段
L1 品牌运行时层 themeColor.ts → applyPrimaryColorVars(html, appDefaultColor, isDark)
               派生 --el-color-primary(-rgb/-dark-2/light-1..9) + --brand-50..600 + gradient/shadow/focus/selection
L2 页面私有层   --apm-* / --vd-* / --kb-* 等域前缀令牌，留在各自页面样式里
               规则：禁止与 L0/L1 同名复写
```

要点：**L1 已经存在**（本次 video app 已按此接入），收敛工作主要是「删静态拷贝 + 挪 import」，不是新造机制。

## 4. 迁移步骤（每步独立提交、独立验收、可单独 revert）

### Step 1 · 合并 monitor/server 两份同源拷贝（风险最低，先做）

- 事实：两份 71 个同名变量全部同值；server 仅 1 个独有变量，monitor 多 3 个。
- 做法：把 server 独有变量并入 monitor 份（或合并文件落到 `packages/theme/src/styles/palettes/`），`monitor壳 main.ts` 只 import 一份；删除 server 的 tokens.css。
- 验收：monitor 应用亮/暗两态截图对比无变化；`grep -rn "tokens.css" apps/vue-support-monitor-starter` 只剩一条 import。
- 【落地修订 2026-11-18】`--terminal-bg` 不再写入 monitor 份：`packages/theme/src/styles/tokens.css` 已全局定义该变量（经 `@repo/app` 注入所有宿主 app），按「通用不留在个别项目」口径不重复落盘；server tokens.css 照删。

### Step 2 · ai 接入品牌运行时层，删除漂移的品牌色阶

- 做法：`pages/ai` 入口调用 `applyPrimaryColorVars(document.documentElement, "#3b82f6", isDark)`（照抄 video app 本次的做法）；从 ai tokens.css 删除运行时会派生的变量：`--brand-50..700`、`--brand-gradient`、`--focus-ring`、`--selection-bg`。
- 中性色漂移（`--text-*`、`--bg-*`、`--border-*`、`--shadow-*`、`--status-*` 共约 20 处）逐项决策：建议采纳 theme 值；AI 控制台设计稿明确要求的差异保留到 L2 前缀下。
- 已知微差需设计确认：themeColor 派生色阶与手写色阶存在轻微差异（如 light-3 派生 #76a8f9 vs 手写 #6ba0f9 级别），逐屏对比后拍板。
- 验收：ai 控制台亮/暗截图对比通过；ai tokens.css 中不再有 `--brand-*` 静态定义。
- 【落地修订 2026-11-18】派生能力下沉共享层：`applyPrimaryColorVars` 增加 `options.gradient` 覆写参数（@repo/utils/themeColor.ts）；品牌蓝种子色提为共享常量 `BRAND_COLOR_BLUE`（ai 控制台与 video 门户共用，禁止各入口再写死字面量）；ai 侧仅保留 `pages/ai/src/styles/brandVars.ts` 承载双色调渐变设计值。

### Step 3 · 立规防回潮

- 新令牌只允许进 `@repo/theme` 的 tokens.css；禁止在任何 app/pages 新建 tokens.css 副本。
- tokens.css 内部不再新增同值别名（原 `--shadow-sm/--shadow-1`、`--shadow-md/--shadow-2`、`--shadow-lg/--shadow-3` 三对已于 2026-11-18 合并：数字别名全部改用语义名，见 Step 3 落地修订）。
- 落地方式：CI 加一条 grep 检查（`**/tokens.css` 只允许出现在 `packages/theme`）+ review checklist。
- 【落地修订 2026-11-18】本仓无 CI 配置，守卫按 `surface:check` 惯例落成 `scripts/check-tokens.mjs`（`pnpm tokens:check`）：规则 1 = tokens.css 只许进 `packages/theme/src/styles/`，现存 ai/monitor/hotsport 三份入 BASELINE 白名单、只许消亡不许新增；规则 2 = 点名封禁已合并别名（声明与 var() 使用都拦）。同日完成 shadow 合并：`--shadow-1/2/3` 全仓 40 余处使用改为 `--shadow-sm/md/lg`（`--shadow-3` 确认零使用，纯死代码），theme tokens 内 6 行数字别名定义删除。

### Step 4（可选）· monitor 域内语义色合并

- `--metric-cpu/--proto-ssh/--status-info` 同为 #3b82f6、`--metric-mem/--proto-vnc` 同为 #8b5cf6、`--metric-disk/--proto-rdp/--status-warning` 同为 #f59e0b：把 `--metric-*`、`--proto-*` 改为引用 `--status-*`（或统一收敛到 `--status-*`），删除重复字面量。
- 【事实核查 2026-11-18】本条前提已过期：monitor 现值 `--status-info: #3399ff`、`--status-warning: #ff9730`，与 `--metric-*`（#3b82f6 / #8b5cf6 / #f59e0b）不同值，**不可并入 `--status-*`**；`--proto-ssh/vnc/rdp` 已上收至 packages/theme 全局层，与 `--metric-cpu/mem/disk` 恰为同值三对。后续若执行本条：安全做法是 `--metric-*` 改引用 `--proto-*`（或随 L0 收敛整体上收全局层），`--status-*` 保持独立。
- 【落地修订 2026-11-18】已按安全路径执行（提交 `9b687e030`）：theme tokens.css 与 pages/monitor tokens.css 中 `--metric-cpu/mem/disk` 改为 `var(--proto-ssh/vnc/rdp)` 同值引用，消除 6 处重复字面量；`--status-*` 保持独立。解析值不变（#3b82f6 / #8b5cf6 / #f59e0b），全仓 87 处 `var(--metric-*)` 用法视觉零变化；dev 运行态实测转换产物引用在位、旧字面量 0 残留。

### Step 5 · 白名单副本同值收敛（2026-11-18 已完成）

- 做法：以 packages/theme tokens.css 为基准，删除 ai / monitor 两份白名单副本中**同名同值**的变量声明。判定按级联解析模型：某声明删除后，亮/暗两态、两种文件引入顺序（theme 先/后）下该变量解析值均不变，才允许删；迭代至不动点。
- monitor 份删 37 处（`--bg-container/--bg-fill/--bg-elevated/--radius-sm..xl/--ease-out/--status-error/--pulse-alarm/--scroll-thumb(-hover)/--selection-bg(-fade)/--metric-cpu..db/--sev-p0..p4` 等）；ai 份删 12 处（亮 8 + 暗 4：`--bg-container/--text-inverse/--radius-sm..xl/--status-warning/--ease-out/--border-subtle(dark)/--status-success,warning(dark)/--shadow-sm(dark)`）。
- 漂移值与私有令牌一律不动：monitor 的 `--brand-*`、`--text-*`、`--focus-ring`、`--status-success` 等 20 处漂移与 17 个私有令牌保留；ai 的 `--u-*` 命名空间、`--el-*`/`--vxe-ui-*` 桥接、深档 `--brand-700..950` 保留。
- 验收：fixpoint 复检两份副本 0 可删残留；`pnpm tokens:check` PASS（24133 个代码文件、封禁别名 0 命中）；改动文件 BOM=0 / FFFD=0 / 严格 UTF-8；dev 运行态（monitor 8848）实测被删声明已不在 monitor 份转换产物中、theme 层照常供给同名令牌。
- 剩余（通往总验收标准 1、2）：monitor 品牌运行时接入（删静态 `--brand-*`，派生微差需逐屏对比）；20 + 21 + 16 处漂移值逐项决策；两份副本最终去留（改名或消亡）。

## 5. 风险与回滚

- 每步一个独立提交，出问题单独 revert，不与其它改动混提交。
- 视觉回归重点：品牌色按钮/链接/图表曲线、暗色模式、文本选区背景、focus 环、滚动条。
- 派生色阶与手写色阶的微差是唯一「允许的可见变化」，必须逐屏确认并记录。

## 6. 总验收标准

```text
1) --brand-* 的 CSS 静态定义只存在于 packages/theme（或为 0，全由运行时注入）
2) tokens.css 全仓只有 packages/theme 一份（hotsport 独立命名空间另行命名，不叫 tokens.css 亦可）
3) monitor 壳对 tokens 的 import 收敛为一条
4) 相关 app vite build EXIT=0，亮/暗截图对比通过
```

---

## 附录 · theme 份 vs ai 份漂移清单（30 项，节选）

`--brand-500: #6d5dfc | #3b82f6`、`--brand-600: #5a4bd9 | #2563eb`、`--brand-gradient`、
`--bg-page: #f6f7fb | #f2f6fc`、`--text-primary: #1f2430 | #0f172a`、`--text-secondary: #5c6270 | #475569`、
`--status-success: #2fbf71 | #16a34a`、`--status-error: #ff4c4c | #ef4444`、
`--focus-ring: rgba(109,93,252,.18) | rgba(37,99,235,.16)`、`--selection-bg`、`--scroll-thumb(-hover)`、`--shadow-sm/md/lg` …

完整两两差异见 `_tmp_cleanup/tokens-diff.txt`（含 monitor↔server 71/71 同值证据）。
