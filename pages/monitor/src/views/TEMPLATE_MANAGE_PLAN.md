# 模板管理页功能扩展（monitor）— 实施说明

> 把 `pages/monitor/src/views/TemplateManageView.vue` 从"台账查询页"升级为"模板运营与管理枢纽"。

## Steps
- [ ] 功能扩展全部落地
- [ ] 类型检查 no error
- [ ] dev server 验证交互

## 新增能力

### P0 操作关
- 上下线快捷切换（`templateApi.update(id, {status})`）
- 删除（`templateApi.remove(id)` + message.confirm）
- 新增/编辑弹窗（ReForm + templateApi.add/update）

### P1 查询关
- 多条件筛选：状态/类型/语言/来源/创建时间区间
- 轻量预览：`designer(id)` 拿 content，iframe 渲染（不走设计器）

### P1 同步关
- 来源同步：`syncAll` / `sync(source)`，弹窗显示结果
- **账号模块同步到模板库**：`syncAccounts`（将 accounts/tenant 数据同步至模板库，接口 `/template/sync/accounts`）

### P2 分析关
- 调用日志 tab：`logs(params)`
- 质量分析：ReChart 柱状图（模板使用趋势）
- 提供商一览：`providerList` + `syncSources`

## 约束
- 监控侧不承载 `@pages/template` 设计器（需 jquery + vue-plugin-hiprint），monitor 侧只负责台账 + 入口，轻预览用 iframe
- 类型检查：该文件 `vue-tsc` 无 error
