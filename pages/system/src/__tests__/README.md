# 系统管理模块前端组件测试说明

本目录为 `@pages/system` 的单元测试，使用 **Vitest + Vue Test Utils + jsdom**。
测试不发起真实后端请求，全部通过 `vi.mock` 替换 `../api/systemApi` 与 element-plus。

## 运行命令

```bash
# 在仓库根目录已 pnpm install 的前提下，进入模块目录
cd pages/system

# 跑全部用例
pnpm test            # = vitest run
# 或
pnpm exec vitest run

# 监听模式
pnpm test:watch      # = vitest

# 只跑本次新增/修改的组件测试
pnpm exec vitest run src/__tests__/PostManage.spec.ts src/__tests__/MessageManage.spec.ts
```

> 首次运行前需确保测试依赖已安装：`vitest` / `@vue/test-utils` / `jsdom` / `@vitejs/plugin-vue`
> （已在 `pages/system/package.json` 的 `devDependencies` 中声明）。
> 在仓库根目录执行一次 `pnpm install` 即可。

## 测试设计要点

- `helpers.ts`：共享桩工厂。
  - `makeReTableStub(slots)`：把重型 `ReTable` 替换为轻量桩——传入 `loader` 时挂载即调用并暴露 `reload()`；
    传入静态 `data` 时直接渲染行；对每个具名作用域插槽提供 `{ row }`，因此可以点击“操作列”按钮。
    此外它复刻了真实 ReTable 的三块外部可见结构（页面已把搜索/工具栏迁入 ReTable，桩不渲染就等于 DOM 里不存在）：
    - `:search="{ filters, title }"` 内置搜索区 `.re-table__search`：过滤项标签 + 输入框/下拉，
      以及 `重置` / `搜索` 两个按钮（`.re-search-reset-btn` / `.re-search-query-btn`）；
      点击“搜索”与真实组件一致：`emit("search")` 后重新走 loader，点击“重置”只 `emit("search-reset")`；
    - `#toolbar` 具名插槽渲染在 `.re-table__toolbar-row`（新增/发送消息/批量操作等业务按钮）；
    - `show-selection` 时每行渲染 `.re-row__checkbox`，变化时 `emit("selection-change", rows)`。
  - `ReButtonStub / ReInputStub / ReSelectStub / ReSwitchStub / ReTagStub / ReDialogStub / ReDrawerStub` 等替换项目里的 ReXxx 组件。
  - `elementPlusLayoutStubs()`：替换 el-card / el-form / el-tabs / el-descriptions / el-table 等容器组件为透传插槽；
    其中 `el-dropdown` + `el-dropdown-item` 通过 provide/inject 打通，点击菜单项会真正触发页面挂在外层的 `@command`。
  - `settle(wrapper)`：统一等待多层 `await`（mockResolvedValue）与响应式更新完成（含一个宏任务，
    仅 `$nextTick` + 微任务不足以让 mock 的 Promise 链落到 DOM）。
- API mock：每个 spec 用 `vi.hoisted` 收集 `systemApi` 函数与 `ElMessage/ElMessageBox` 的 mock，便于断言调用次数与参数。
- `@element-plus/icons-vue` mock：在 `<script setup>` 里具名 import 图标组件的页面（UserManage / MonitorManage 等），
  Proxy 必须带 `has: () => true`，否则 Vitest 报 `No "X" export is defined on the mock`。
- 交互驱动：尽量通过点击按钮（DOM）驱动流程；需要直接设置表单/状态时，通过 `wrapper.vm` 访问 `<script setup>` 暴露的状态。

## 文件清单

| 测试文件 | 被测组件 | 用例数 | 覆盖点 |
|---|---|---|---|
| `PostManage.spec.ts` | `views/PostManage.vue` | 6 | 内置搜索区/表格/工具栏新增按钮；新增弹窗与名称/编码必填校验；合法保存；删除确认→删除接口；填过滤项→搜索按钮带参再查询 |
| `UserManage.spec.ts` | `views/UserManage.vue` | 6 | 勾选行驱动批量按钮可用；批量启用确认；详情抽屉；“更多”下拉项与命令分发；“已锁定”标签 |
| `RoleManage.spec.ts` | `views/RoleManage.vue` | 4 | 只读标签；内置角色隐藏删除按钮；编辑弹窗只读开关+提示；数据权限 5 种范围 |
| `MessageManage.spec.ts` | `views/MessageManage.vue` | 5 | 消息/模板双 Tab 加载；工具栏“发送消息”弹窗；模板选择自动填充；撤回确认→撤回接口；接收者 0 显示“全体用户” |
| `ErrorLogManage.spec.ts` | `views/ErrorLogManage.vue` | — | ⚠️ 文件不存在，列此仅作历史记录 |
| `CacheManage.spec.ts` | `views/CacheManage.vue` | — | ⚠️ 文件不存在，列此仅作历史记录 |
| `SettingManage.spec.ts` | `views/SettingManage.vue` | 4 | 历史抽屉；单条回滚→回滚接口；敏感值掩码+点击解密；按批次号查询 |
| `PolicyTask.spec.ts` | `views/monitor/PolicyTask.vue` | 8 | 7 个页签逐个进入且标题互不相同；所有表格关闭布局切换器；**接口管控有效状态 = action × status**（停用/拦截/转发/未配置四种处境）；未配置行不显示启停开关；只有策略无注册路由的自定义路径也要列出；**顶部刷新按当前页签分发**（白名单断言，见下） |
| `systemApi.spec.ts` | `api/systemApi.ts` | 21 | 各接口 URL/方法/参数构造（缓存、消息、IP、登录日志等） |
| `helpers.ts` | — | — | 共享桩/工具，供上述 spec 使用 |

合计 **7 个 spec、66 个用例，全部通过**（`cd pages/system && pnpm test`）。

> 2026-09-28 更正：本表此前还列着 `ErrorLogManage.spec.ts` / `CacheManage.spec.ts` /
> `MonitorManage.spec.ts`，但这三个文件在磁盘上并不存在，用例数与 spec 数也是按它们
> 写的（9 个 / 57 个）。上表已按实际文件重新统计；哪天要恢复这三个用例再补回来。

## 写新 spec 时容易踩的三个坑

1. **图标 mock 不能只靠 Proxy 兜底**。`vi.mock("@element-plus/icons-vue", () => new Proxy({}, { get: () => stub }))`
   挡不住 Vitest 的导出校验，会报 `No "Xxx" export is defined on the mock`。两种可行写法：
   Proxy 补 `has: () => true` 陷阱，或像 `PolicyTask.spec.ts` 那样显式列出用到的图标名。
   后者更好 —— 图标名写错会在 “Failed to resolve component” 警告里立刻暴露，不会静默。
   ⚠️ 这个坑以前还有一层更难查的放大器：`PolicyTask.vue` 当时挂着一个临时
   `onErrorCaptured` 探针，handler `return false` 会**吞掉**错误（`app.config.errorHandler`
   也不再触发），于是「组件渲染失败」在测试结果里完全看不见，表现为全绿。该探针已删除；
   但**任何页面都不该用 `onErrorCaptured` + `return false` 来做临时排查**，
   排查完必须连 ref、handler、模板里的浮层一起删干净。
2. **`vue-i18n` 只能部分 mock**。只导出 `useI18n` 会让 `@repo/languages` 在模块顶层
   调 `createI18n` 时直接加载失败（套件 0 用例、整体报错）。要用 `importOriginal`
   保留真实导出、只替换 `useI18n`，让 `t()` 回显键名 —— 断言写键名而不是中文，
   改文案时测试不必跟着改。
3. **整模块 mock 必须列全被测代码树用到的每个导出**。`vi.mock("../api/systemApi", () => api)`
   是**整体替换**，没列到的导出是 `undefined`。漏一个不一定立刻报错：
   页面常用 `void someAsync()` 这种「发射后不管」的写法（不 await、不 catch），
   漏掉的函数被调用时抛的错会变成**游离的 unhandled rejection** —— 用例照样绿，
   失败信号只出现在日志末尾。`PolicyTask.spec.ts` 曾漏 `policyHitCounts` / `policyHitDetail`
   （`usePolicyHit` 要用），已补齐。列 mock 时按「被测组件 + 它 import 的子组件」一起过一遍。

## 修复记录（2026-09-19）

SFC 标签错配（`<ReButton>` 配 `</el-button>`）修复后测试才重新可跑，暴露出的 14 个失败按“产品错”还是“测试旧”分别处理：

- 测试侧过期：搜索区已从独立 `<ReSearch>` 迁移为 `ReTable :search="{ filters }"`，按钮文案为 `搜索`（ReSearch 默认）
  而非 `查询`；`PostManage / ErrorLogManage` 的查询用例改为驱动真实过滤项并断言请求参数。
- 测试侧缺陷：`MonitorManage.spec.ts` 的 icons mock 缺 `has` 陷阱 + 等待不足（改为 `settle`）。
- 断言过期：`systemApi.spec.ts` 的消息分页 URL 按代码实际调用路径改为
  `/v2/message/sys-message/admin/page`（后端 `SysMessageController` 提供该路由；未改接口路径）。
  注意后端同时存在 `SysMessageAdminController` 的 `/v2/message/admin/page`，两套 admin 面重复。
- **产品侧缺陷（已修 `views/UserManage.vue`）**：ReTable 迁移过程中丢失了两块能力——
  工具栏的 批量启用/批量禁用/批量删除 按钮，以及操作列的「更多」下拉
  （编辑/重置密码/分配角色/详情/锁定-解锁/强制解绑2FA/删除）。
  对应 `handleBatchStatus / handleBatchDelete / handleActionCommand / openRoleDialog / handleToggleLock / handleUnbindTotp`
  全部沦为死代码，且缺少 `show-selection` 导致 `@selection-change` 永远不会触发。已按迁移前的原始设计恢复。
