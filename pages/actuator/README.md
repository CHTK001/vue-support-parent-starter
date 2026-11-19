# pages/actuator

Spring Boot Actuator 的观测工作台：一个 `/actuator` 单页，11 个页签各对应一个端点。

- **模块边界**：本包是独立页面，**不依赖 `@pages/system`**。卡片契约与注册表在
  `packages/monitor-cards`（无 UI 依赖），`pages/system` 侧只做 re-export。
- **不改业务**：只读 Actuator 端点 + 一个写操作（改 logger 级别）。所有排序、过滤、
  分页都是前端行为，不动后端契约。

## 11 个页签与版式定版

| 页签 | 端点 | 版式 | 要点 |
|---|---|---|---|
| health | `/actuator/health` | 1A 仪表盘 | DOWN 置顶单独分区；**没有 DOWN 组件时显式声明**，不留空白 |
| loggers | `/actuator/loggers` | 2A 密度底盘 | 唯一写操作页（级别下拉即提交）；生效级别色点 + 只看已配置 + **一键还原本次会话改动** |
| mappings | `/actuator/mappings` | 2A | 整表排序再分页；HTTP 方法徽章 + 方法下拉筛选 + 仅看有流量 |
| beans | `/actuator/beans` | 2A | |
| conditions | `/actuator/conditions` | 2A | 命中/未命中计数 + 只看未命中 |
| threaddump | `/actuator/threaddump` | 2A | 行点击打开完整栈抽屉（可复制）；线程状态 chips 快捷筛选 |
| configprops | `/actuator/configprops` | 2A | |
| env | `/actuator/env` | 3B 分区折叠 | 按 propertySource 分区；搜索时全部展开并高亮命中片段 |
| info | `/actuator/info` | 3B | 单源外壳 |
| metrics | `/actuator/metrics` | 4A 主从 | VALUE / MAX / 使用率分块 + 使用率细条；**按标签细分**（每个标签一个选择器，`?tag=k:v` 重取明细） |
| scheduledtasks | `/actuator/scheduledtasks` | 5C 时间轴 | 按下次执行排序；可编辑任务为空时给显式空态 |

### 2A 密度底盘（6 个海量行页签共用）

- **首列固定**：标识列（logger 名 / bean 名 / 映射路径）钉在左侧，横向滚动时仍可见。
- **紧凑 / 舒适切换**：右上角分段按钮。
- **分页贴底**：分页条固定在表格下方，不随内容飘走。

### 密度是全页共享单例

`views/useActuatorTable.ts` 里的 `actuatorDensity` 是模块级 ref，6 个表格页读同一个值：
在任何一页切成「舒适」，切到另一页仍是舒适。

- 偏好写入 localStorage，键 `actuator:table-density`。
- 读不到存储（隐私模式 / 存储被禁用）→ **退回 `compact`**，不因为记不住偏好而卡住页面。
- 紧凑 = ReTable `size="mini"`（行高 ≈ 27px），舒适 = `size="small"`（行高 ≈ 33px）。

## 前端分页与排序口径

Actuator 端点**本身不分页**（一次返回全部 logger / bean），所以：

1. **过滤在前，分页在后**：先在全量上过滤，再对过滤结果切片 —— 不会出现「只搜到当前页」的假命中。
2. **越界回收到最后一页**：行数变少（刷新后条目减少）时把页码收回有效范围，不停在空白页。
3. **改每页条数回第 1 页**：避免跳到一个内容完全不同的页。
4. **排序必须整表排序再分页**：列用 `sortable: "custom"` + `@sort-change`，
   只重排当前页在翻页后立刻失效，看着像排序坏了。

分页条统一在 `views/ActTablePager.vue`（每页条数候选 `[50, 100, 200, 500]`），
不要各页各写一套。

## 工具条与键盘动线（TabShell）

- **`#tools` 插槽**：页签自己的开关（loggers「只看已配置」、mappings「仅看有流量」、
  conditions「只看未命中」）插在外壳工具条右侧、密度切换之前；开关切换后回第 1 页。
- **快捷键**：`/` 聚焦过滤框；`Esc` 清空过滤词（页签 watch 关键字后自动复位分页）。
  监听挂在 window 上：隐藏面板（v-show 常驻、`offsetParent === null`）让位；
  输入型控件（输入框 / 文本域 / 下拉框）里的 `/` 与 `Esc` 不被劫持。
- **计数文案**：conditions 为 `共 N 项 · 命中 X / 未命中 Y`，其余页签保持 `共 N 项`。

### threaddump 完整栈抽屉

行点击打开 `ElDrawer`：元信息（状态 / 守护 / 阻塞 / 等待）+ 完整栈帧
（序号 + `类.方法 (文件:行号)`）+「复制全部栈帧」（Clipboard API，非安全上下文回落
隐藏 textarea）。数据就是本次快照自带的 `stackTrace`，**不发第二次请求**。

- **计数文案**：conditions 为 `共 N 项 · 命中 X / 未命中 Y`，其余页签保持 `共 N 项`。
- **自动刷新**（第二轮）：只读页签在工具条右侧提供「关 / 10s / 30s」分段（复用 `.act-seg`）+
  「x 秒前更新」相对时间。定时器触发的是**静默刷新**（`emit("refresh", true)`）：
  失败保留已渲染数据，瞬时网络抖动不会把整页打成空白；面板隐藏（v-show 常驻、
  `offsetParent === null`）时不发请求、不走表。写操作页（loggers、scheduledtasks）**不接**，
  轮询会打断正在进行的编辑。

## 第二轮增强（交互、深链与导出）

- **URL 深链**：`#/actuator?tab=mappings&q=/api`。`tab` 由 `ActuatorPage.syncUrl` 维护
  （`history.replaceState`，不触发宿主 `:key="route.fullPath"` 重建、不进历史栈）；
  `q`（过滤词）由 `useActuatorPanel` 管理：挂载时从 hash 恢复，输入时写回，
  切回页签（`ACTUATOR_TAB_ACTIVATED_EVENT`）时由前台页签把 `q` 修正为自己的值。
  只能用 `replaceState`：`router.replace` 会让宿主整页重建，丢掉 v-show 保活。
- **metrics 按标签细分**：首次无参请求的 `availableTags` 缓存为选择器选项（**不随过滤收缩**）；
  每个标签一个可清空的下拉框，选定后按 `?tag=key:value` 重取明细；换指标清空已选，
  静默刷新保留已选。
- **threaddump 状态 chips**：按快照内状态计数生成 chips（数量倒序），点一下即筛，
  再点一次取消；查死锁时点 `BLOCKED` 直达，不用输关键字。
- **mappings 方法筛选**：从 predicate 解析出的 HTTP 动词作为下拉候选，与关键字、
  「仅看有流量」叠加过滤。
- **CSV 导出**（loggers / mappings / threaddump）：导出**当前过滤 + 排序后的全量行**
  （不是当前页）。`views/csvExport.ts` 统一实现：RFC 4180 转义 + 前置 BOM
  （Excel 直接打开不乱码）+ Blob 下载，文件名带 `yyyyMMdd-HHmm` 时间戳。
- **loggers 一键还原**：会话级台账（logger → 改动前级别，只记第一次改动前的值，
  改回原值出账）。还原前 `ElMessageBox.confirm` 确认，逐个 `setActuatorLogger`
  （`INHERITED` → body 传 null）后静默重取；部分失败时失败项保留在台账里，
  按钮显示待还原条数、无改动时禁用。

## 视觉口径

- 全部走 koi 令牌（`packages/theme/src/styles/tokens.css`），不自造颜色。
- 健康页横幅底色用 `color-mix(in srgb, var(--status-success) 12%, transparent)` 派生，
  **不写死 element 的 `light-9` 常量** —— 深色主题下 `light-9` 是接近白的浅色，会在暗底上炸出亮斑。
- 圆角用 `--radius-sm/md/lg`（6/8/12px）。

## 禁忌

- **不接 sparkline**：Actuator 只返回单次快照，画趋势等于编数据。
- **不引 `@repo/core`**：会连带 pnpm-lock 变更。
- **不引 `@pages/system`**：本包要能独立挂在任何宿主上。
- 端点没暴露（404 / 405 / 501）→ 给「怎么开启」的接入指引，而不是「重试」；
  其它失败原样给可读文案（口径与监控大屏卡片一致，见 `cards/useCardResource`）。

## 真实数据量级（8082 实例）

loggers 2934 / mappings 2336 / beans 1901 / configprops 762 / conditions 709 /
threads 308 / env 328 / metrics 68 / scheduledtasks 只读 34、托管 0 / health 整体 UP 共 12 组件。

量级就是为什么需要密度底盘 + 前端分页：这些端点一次返回几千行，不分页等于没法看。

## 验收

- 类型检查：在 `pages/monitor` 下 `npx vue-tsc --noEmit`（EXIT=0）。
- 编码：源码 UTF-8 无 BOM（`BOM=0 / NOT_UTF8=0 / U+FFFD=0`）。
- 交付前的真点验收走 monitor dev 8848 + 后端 8082，登录 `admin/admin123`（滑块验证码）。
