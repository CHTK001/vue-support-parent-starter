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
| `PolicyTask.spec.ts` | `views/monitor/PolicyTask.vue` + `policy/tabs/*` | 19 | 7 个页签逐个进入且标题互不相同；所有表格关闭布局切换器；**接口管控有效状态 = action × status**（停用/拦截/转发/未配置四种处境）；未配置行不显示启停开关；只有策略无注册路由的自定义路径也要列出；**顶部刷新按当前页签分发**（白名单断言，见下）；**消息头行渲染**（回归：`hitCountOf` 漏解构导致 Vue patch 中断，表现为「侧栏切了、内容没换」）；**全局限流闸门的「生不生效」说明**（4 条，见坑 7）；**访问名单搜索过滤**（6 条，见坑 8） |
| `systemApi.spec.ts` | `api/systemApi.ts` | 21 | 各接口 URL/方法/参数构造（缓存、消息、IP、登录日志等） |
| `helpers.ts` | — | — | 共享桩/工具，供上述 spec 使用 |

合计 **7 个 spec、77 个用例，全部通过**（`cd pages/system && pnpm test`）。

> 2026-09-28 更正：本表此前还列着 `ErrorLogManage.spec.ts` / `CacheManage.spec.ts` /
> `MonitorManage.spec.ts`，但这三个文件在磁盘上并不存在，用例数与 spec 数也是按它们
> 写的（9 个 / 57 个）。上表已按实际文件重新统计；哪天要恢复这三个用例再补回来。

## 写新 spec 时容易踩的八个坑

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
4. **等待要等「可观测的渲染结果」，不要等固定轮数**（2026-09-29 踩坑）。
   页签拆成独立组件后，loader 链变成「组件边界 + 两个并发请求 + 并集 + 过滤 + 切片」，
   需要的异步轮数不固定。原来写「循环 6 次 `settle()`」，在机器负载高时不够 ——
   同一份代码连续跑，整体耗时在 **14s~79s** 之间跳，用例**时而红时而绿**。
   改用 `waitFor(w, () => w.findAll(".re-row").length > 0)`：轮询到条件成立为止，
   与负载无关，还顺带快得多（14~79s → 10~13s）。

   等待条件必须是**渲染结果**，不能是「时间到了」。表格空的时候，
   「文本应包含 xxx」这类正向断言会红，而「不包含 xxx」这类**反向断言会假绿** ——
   两种都得防，所以 `renderRoutes` 里还要单独钉一条「表格确实出行了」的正向断言。
5. **一个断言红的时候，先怀疑自己的等待，再怀疑产品代码**。
   这次「有效状态」4 条断言集体红、而浏览器里显示完全正常，第一反应是
   「组件渲染失败」，于是去加 `vi.mock("@repo/ui/re-tag")` 之类的东西 ——
   那是**错的诊断**，撤掉 mock 连跑 4 次照样全绿。真因只是等待不足。
   判断依据：把渲染结果落盘看（`writeFileSync(tmp, w.html())`），发现行渲染出来了、
   状态标签位置是 `<!---->`；而同一插槽里的普通 `<span>` 文案正常。
   `<!---->` 在「组件 vnode 类型非法」和「异步还没到位」两种情况下都会出现，
   **单看它分不出来**。

   ⚠️ 这次还留下一个教训：**「连跑 N 次都绿」不能当确定性证明**。
   后来大改完文件、机器同时重编 10 个文件时（`transform` 33s）又偶发过一次同症状，
   有无 mock 各跑 6 次都没复现 —— 说明根因不明、只是被负载放大。
   所以那条「有效状态」断言已改成**读表格桩持有的行数据**（`row.effectiveText`），
   不再断言渲染字符串：与渲染链无关、更稳，而且验的正是要守的那个逻辑本身
   （标签长什么样交给浏览器验）。
   判据要稳，就别让它挂在一条与被测逻辑无关的依赖链上。

6. **断言统计别用 `Select-String` 数 `FAIL` 行**。vitest 的输出带 ANSI 色码，
   行首是转义序列而不是空格，`^\s*FAIL` 匹配不到 —— 明明有断言失败却报「FAIL行=0」，
   我据此差点把一次真失败当成偶发噪声。**用退出码**（`$LASTEXITCODE`）。

7. **新加的断言必须做变异验证，否则不知道它是不是"恰好通过"**。
   2026-09-29 补「全局限流闸门」的 4 条用例时，两处都做了真实文件变异：

   - `props.rateGlobalOn` → `true`（限定文案永远不生效）→ 用例红，报错正是
     「总览仍在用不带限定的『已启用』文案」
   - `v-if="!globalConfig.enabled"` → `v-if="false as boolean"`（横幅永不出现）
     → 用例红，报错正是「全局关着却没有任何『都不生效』的提示」

   还原后 `exit=0`。**只跑一次绿不算数**：一个从来没红过的断言，和一个恒真的断言
   在结果上无法区分。

   ⚠️ 其中「闸门开启时不显示横幅」是**反向断言**，光有它会假绿（整页没渲染时也绿）。
   所以同一条用例里钉了正向锚点：`policy-list-head h3` 存在 + 表格确实有 1 行。
   反向断言旁边必须站着一个正向锚点。

   ⚠️ 这批用例还踩到一个数字陷阱：`loadOverview` 会把 interface / ip / account
   **三个维度各拉一次** `listRateLimit`，`mockResolvedValue` 每次返回同一条 →
   总数变成 3。断言写成 `enabled:1` 会红，而红的原因跟被测逻辑无关。
   改成 `mockImplementation` 按维度返回值，才让数字回到真实语义。

8. **测试替身少一段行为，写出来的测试可能两个方向都写错**。
   2026-09-29 补「访问名单搜索过滤」时，「点重置后要重新查询」这条直接红了
   （`expected 0 to be greater than 0`）。看着像产品缺陷，**其实是桩不忠实**：

   - 真实 `ReTable` 挂了 `watch(internalParamsKey)`，params 一变就重新加载；
   - 而 `onBuiltinSearchReset()` 只 `emit("search-reset")`，自己不 reload；
   - 页面 handler 改 `params` → 靠上面那个 watch 兜住 → 重置是有效的；
   - 但 `makeReTableStub` 没有那个 watch，于是「点重置」在测试里成了空操作。

   处置：给桩补上同规则的 `paramsKey` computed + watcher（剔掉 page / pageSize，
   与真实一致）。补完 6 条全绿，**其余 65 条也没被带崩**。

   两条要记住的：
   - **别急着改产品代码**。先问「替身复刻了被测组件的哪些行为」，缺口在替身还是
     在产品，是两回事，方向搞反会改坏本来正确的东西。
   - 替身是**双向**不可靠的：缺行为会让测试假红，**多**行为同样会让测试假绿。

   ⚠️ 与之配套：`packages/ui` **没有任何测试基建**（无 vitest 配置、无 test 脚本、
   无自有测试文件），所以 ReTable / ReSearch / ReInput 这些共享组件的行为
   只能在浏览器里验。给它们写单测要先从零搭基建，那是独立立项。

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
