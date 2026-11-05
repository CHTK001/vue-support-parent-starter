# 调度概览 · 设计探索共同约束（临时文件，选定方案后删除）

## 0. 你在做什么

仓库：`D:\ch\project\vue-support-parent-starter`（pnpm monorepo，Vue 3 + Element Plus + UnoCSS，应用在 `apps/vue-support-collect-scheduler-starter`，页面包在 `pages/*`）。

目标页：**调度概览** `/#/collect/job-overview`，源码 `pages/job/src/views/JobOverviewView.vue`（1468 行，本轮要彻底重构）。
它是「调度中心」分组的落地页。宿主后端是 job-starter 的治理接口 `/v2/scheduler/**`。

**页面唯一职责**：让值班的运维/后端同学在 3 秒内回答四个问题 ——
1. 这台节点在当前调度链路里健康吗（Leader？扫描节奏？处理器齐不齐？）；
2. 有没有在失败，失败集中在哪个时段；
3. 下一拍是什么，还有多久；
4. 哪些启用任务其实是「空转」的（没有同名处理器 / 本机不领取）。

**主题词（做设计时请落在这个世界里）**：节拍（scan interval / 心跳）、触发（fire）、调度表达式（cron）、执行器（executor）、处理器（handler）、派发与跳过、Leader/Follower。

## 1. 你产出的东西

一个单文件组件：`pages/job/src/views/ovx/variants/<Name>.vue`。

- `<script setup lang="ts">` + `<style scoped>`；
- 只接收一个 prop：

```ts
import type { OvData } from "../types";
const props = defineProps<{ data: OvData }>();
```

- **不取数、不写死任何业务数据、不 import `JobOverviewView.vue`**。所有数字都从 `props.data` 来。
- 可以 import 的现成件（路径照抄）：
  - `@repo/ui/re-icon`（`<ReIcon name="AlarmClock" :size="14"/>`，名字取自 `@element-plus/icons-vue`）
  - `@repo/ui/re-button`、`@repo/ui/re-tag`、`@repo/ui/re-switch`、`@repo/ui/re-time`（`format="duration"`）
  - `@repo/ui/re-echarts`（`:option` + `height`，ECharts 5 已装）
  - `@repo/ui/re-stat-card`、`@repo/ui/re-section-head`、`@repo/ui/re-empty-state`、`@repo/ui/re-status-indicator`、`@repo/ui/re-countup`
  - `@repo/ui/re-table`（`import type { ReTableColumn } from "@repo/ui/re-table"`）
  - 本地件：`../../../components/FireCountdown.vue`（倒计时，props `at: number|null`、`bare?: boolean`）、`../../../components/OvSpark.vue`（迷你折线，props `values: number[]`，颜色吃 `currentColor`）
  - 纯函数：`../../../utils/time`（`fmtMs`、`fmtFireShort`、`fmtDuration`）、`../../../constants/taskStatus`（`statusText`、`statusTagType`）
- 不要引入任何新依赖，不要改其它文件。

## 2. 视觉语言（沿用 koi 设计系统，这是硬约束）

不写死十六进制颜色，一律取令牌（`packages/theme/src/styles/tokens.css`），暗色主题自动跟随：

- 品牌：`--brand-500 #6d5dfc`、`--brand-600`、`--brand-400`、`--brand-100`、`--brand-50`、`--brand-gradient`
- 面：`--bg-page`、`--bg-container`、`--bg-elevated`、`--bg-fill`、`--bg-hover`
- 线：`--border-subtle`、`--border-default`
- 字：`--text-primary`、`--text-secondary`、`--text-tertiary`、`--text-inverse`
- 语义：`--status-success`、`--status-warning`、`--status-error`
- 数据点：`--pulse-online`、`--pulse-offline`、`--pulse-unknown`、`--pulse-alarm`、`--metric-cpu/mem/disk/net/jvm/redis/db`
- 圆角：`--radius-sm 6` / `--radius-md 8` / `--radius-lg 12` / `--radius-xl 16`
- 阴影：`--shadow-sm`、`--shadow-md`、`--shadow-lg`；缓动：`--ease-out`
- 布局令牌（来自 `pages/collect/src/styles/collect.css`，宿主已加载）：`--cc-gap 12px`、`--cc-gap-sm 8px`、`--cc-gap-lg 16px`、`--cc-duration 180ms`、`--cc-font-num`
  **必须带兜底值**：`var(--cc-gap, 12px)`（该 css 可能不在所有宿主里）。`--cc-font-num` 写成 `var(--cc-font-num, ui-monospace, SFMono-Regular, Consolas, monospace)`。
- 数字一律 `font-variant-numeric: tabular-nums`；时刻/ID/表达式用等宽字体。
- 中文正文用系统栈（不要引第三方字体，不要用 Inter/Roboto）。
- 也可用 Element Plus 变量（`--el-*`），但同一个语义不要在同一个组件里混两套写法。

**动效**：只做 `transform` / `opacity`，时长 ≤ 240ms，`--ease-out`；要有一段编排好的入场（`animation-delay` 错开），不要满地 hover 特效；必须有 `@media (prefers-reduced-motion: reduce)` 兜底（关掉入场与脉冲）。

**响应式**：1600 / 1280 / 900 / 420 四档都要能用。窄屏不许横向滚动，不许文字被裁成半个字。键盘可达（可点元素用 `<button>`，`aria-label` / `aria-pressed` 按需）。

## 3. 数据契约（`./types.ts` 是唯一事实来源，实现前先完整读一遍）

页面共有 16 组数据，**任何方案都不允许丢**。允许换表达（数字→条/环/矩阵/文案），不允许不显示：

| # | 字段 | 必须出现的内容 |
|---|---|---|
| 1 | `kpis[4]` | `title`、`value`、`desc`、`icon`、`tone`；`parts[]`（每段的 `label` + `value`，比例要看得出来）或 `spark[]`。点击走 `data.go(kpi.path)` |
| 2 | `facts[4]` | 节点角色 / 扫描节奏 / 已注册处理器 / 在线执行器，`label` + `value` |
| 3 | `alert` | 非空时必须明显可见（这是「本节点不是 Leader / 有任务空转」的告警），空串时不要留空位 |
| 4 | `runtimeRows[5]` | 角色、节点、分组、扫描节奏（含预读）、分发（本地/远程） |
| 5 | `summary.ready === false` | 必须有「未取到调度治理接口」这类诚实说法，不能显示一堆 0 当正常 |
| 6 | `hourly` | 24 个桶：`labels`、`dispatch[]`、`failure[]`、`cumDispatch[]`、`cumFailure[]`、`totalDispatch`、`totalFailure`、`nowIndex` |
| 7 | `notable[]` | 最多 2 条「触发最多的任务」，`name` / `count` / `at`，要能和 24 小时曲线/矩阵对上位置 |
| 8 | `upcoming[]` | 最多 10 行：`jobName`、`isFlow`（采集流程标记）、`scheduleText`、`nextFireTime`（`fmtFireShort`）、实时倒计时（用 FireCountdown）、`handlerRegistered === false` 要能一眼看出「没有处理器」、`dispatchMode`（LOCAL/REMOTE）、`lastFireTime`（从未触发要显示得出来） |
| 9 | `stoppedHint` | 非空时显示「另有 N 个任务已停用」 |
| 10 | `dispatches[]` | 最多 10 行：`triggerTime`（`fmtMs`）、`jobName`、`executor`、`costMs`（`ReTime format="duration"`）、`statusText` + 状态色、`triggerType`（定时/手动…）、`message`（失败原因，必显，长文本要能读） |
| 11 | `nodes[]` | `nodeId`、`role`、`handlerCount`、`online` 状态点、`serverUrl`、`registeredAt`（`fmtMs`） |
| 12 | `executors[]` | `name`、`source`（ANNOTATION/INJECTED/REMOTE 要有可读标签）、`desc` 或 `handlerClass` |
| 13 | `logCount` / `jobCount` / `logTruncated` | 口径说明（「近 24 小时读了 N 条日志」），`logTruncated` 为真时提示「只是下限值」 |
| 14 | `ledger` | `running` / `stopped` / `local` / `remote` / `flowJobs` / `beanJobs` / `scriptJobs` / `unregisteredSample[]`（没有处理器的任务名清单） |
| 15 | `loading` / `updatedAt` / `autoRefresh` / `reload()` / `setAutoRefresh()` | 刷新入口 + 「上次刷新 12:03:41」+ 自动刷新开关（**当前线上页面把开关和刷新入口做丢了，本轮必须补回来**） |
| 16 | 去路 | 至少三个入口：`/collect/job`（调度工作台）、`/collect/job-log`（作业日志）、`/collect/remote-node`（远程节点），用 `data.go()` |

`data` 对象里还有 `summary` 的全部标量（`unregisteredJobs`、`unclaimedRemoteJobs`、`recentFailures`、`remoteDispatchOwnedByMe`、`onlineExecutors[]`、`preReadMs`…），凡是页面文案需要的都能直接读。

## 4. 空态与边界（必须处理，不许只在有数据时好看）

- 全空（`summary.ready=false`、`upcoming=[]`、`dispatches=[]`、`nodes=[]`、`executors=[]`）：页面仍然要成立，主结构不塌，给出「去哪里做什么」的可操作空态（例如「去工作台启用一个任务」），**并且不要出现两遍同样的空文案**（现有页面 ReTable 的 `empty-text` 与 `#empty` 插槽同时渲染，重复了一次，别再犯）。
- 长文本：任务名、节点 id、`serverUrl`、失败 `message` 都要有截断/换行策略。
- 单条失败（`dispatches[0].executeCode === "FAILURE"`）要能一眼看出来。

## 5. 交付要求

- 写**整份文件**，不要省略号，不要 TODO。
- 组件根部不要自带页面级 padding / 背景铺满（宿主 shell 已经给了内容区），但可以在自己范围内做 section 级的背景处理（渐变、细网格、分区底色），只要用令牌。
- 顶部留一行注释，说明这个方案的「一句话定位 + 记忆点（signature）+ 本方案把哪些原本没显示的数据挖出来了」，中文。
- 组件名通过 `defineOptions({ name: "OvxBeat" })` 之类声明（名字用文件名）。

写完只回报：文件路径、signature 是什么、数据覆盖里你做了取舍的地方（如果有）、以及你自测过的断点。
