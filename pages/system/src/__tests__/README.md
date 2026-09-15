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
  - `makeReTableStub(slots)`：把重型 `ReTable` 替换为“按行渲染”的桩——传入 `loader` 时挂载即调用并暴露 `reload()`；传入静态 `data` 时直接渲染行；对每个具名作用域插槽提供 `{ row }`，因此可以点击“操作列”按钮。
  - `ReButtonStub / ReInputStub / ReSelectStub / ReSwitchStub / ReTagStub / ReDialogStub / ReDrawerStub` 等替换项目里的 ReXxx 组件。
  - `elementPlusLayoutStubs()`：替换 el-card / el-form / el-tabs / el-descriptions / el-table 等容器组件为透传插槽。
  - `settle(wrapper)`：统一等待多层 `await`（mockResolvedValue）与响应式更新完成。
- API mock：每个 spec 用 `vi.hoisted` 收集 `systemApi` 函数与 `ElMessage/ElMessageBox` 的 mock，便于断言调用次数与参数。
- 交互驱动：尽量通过点击按钮（DOM）驱动流程；需要直接设置表单/状态时，通过 `wrapper.vm` 访问 `<script setup>` 暴露的状态。

## 文件清单（本次新增 / 修改）

| 测试文件 | 被测组件 | 用例数 | 覆盖点 |
|---|---|---|---|
| `PostManage.spec.ts` | `views/PostManage.vue` | 6 | 渲染搜索区/表格/新增按钮；新增弹窗与名称/编码必填校验；合法保存；删除确认→删除接口；查询再调用 |
| `MessageManage.spec.ts` | `views/MessageManage.vue` | 5 | 消息/模板双 Tab 加载；发送弹窗；模板选择自动填充标题内容；撤回确认→撤回接口；接收者 0 显示“全体用户” |
| `ErrorLogManage.spec.ts` | `views/ErrorLogManage.vue` | 4 | 4 个统计卡片；详情弹窗 `<pre>` 堆栈；标记已处理→状态接口；状态筛选→查询带参 |
| `CacheManage.spec.ts` | `views/CacheManage.vue` | 3 | 6 项缓存渲染；单个刷新→refreshCache；刷新全部→确认→refreshAllCache |
| `UserManage.spec.ts` | `views/UserManage.vue` | 5 | 批量按钮选中后可用；批量启用确认；详情抽屉含基本/安全信息；更多下拉菜单项；锁定用户“已锁定”标签 |
| `RoleManage.spec.ts` | `views/RoleManage.vue` | 4 | 只读标签；内置角色隐藏删除按钮；编辑弹窗只读开关+提示；数据权限 5 种范围 |
| `SettingManage.spec.ts` | `views/SettingManage.vue` | 4 | 历史抽屉；单条回滚→回滚接口；敏感值掩码+点击解密；按批次号查询 |
| `PersonageTotp.spec.ts` | `views/Personage.vue`（2FA 卡片） | 5 | 未启用/已启用状态卡片；开启拉取二维码弹窗；输入 6 位验证码绑定；关闭→解绑接口 |
| `helpers.ts` | — | — | 共享桩/工具，供上述 spec 使用 |

合计 **8 个 spec、36 个用例，全部通过**。

## 范围外的既有失败（本次未修改）

`pnpm test` 全量运行时，以下 2 个文件的失败为**改动前就已存在**，与本次新增组件测试无关：

- `MonitorManage.spec.ts`（4 例）：组件/桩与当前实现不匹配。
- `systemApi.spec.ts`（1 例）：断言的消息分页 URL 为旧路径 `/v2/message/admin/page`，
  而当前 `systemApi.ts` 实际为 `/v2/message/sys-message/admin/page`（接口路径已演进，测试断言未同步）。

如需让 `pnpm test` 全量零失败，可后续单独修正这两个既有文件（不在本次任务范围）。
