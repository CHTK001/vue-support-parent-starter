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
| loggers | `/actuator/loggers` | 2A 密度底盘 | 唯一写操作页（级别下拉即提交） |
| mappings | `/actuator/mappings` | 2A | 整表排序再分页 |
| beans | `/actuator/beans` | 2A | |
| conditions | `/actuator/conditions` | 2A | |
| threaddump | `/actuator/threaddump` | 2A | |
| configprops | `/actuator/configprops` | 2A | |
| env | `/actuator/env` | 3B 分区折叠 | 按 propertySource 分区；搜索时全部展开并高亮命中片段 |
| info | `/actuator/info` | 3B | 单源外壳 |
| metrics | `/actuator/metrics` | 4A 主从 | VALUE / MAX / 使用率分块 + 使用率细条 |
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
