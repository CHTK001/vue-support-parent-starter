# vue-monitor 爬虫模块接入文档

## 1. 目标

将爬虫模块接入 `vue-support-monitor-starter`，使其在 `vue-monitor` 中可通过菜单直接访问，并支持：

- 爬虫任务列表管理
- XPath / CSS 可视化提取规则配置
- SPI 流程设计画布
- 任务运行、停止、日志查看、数据查看

## 2. 接入位置

前端工程：

- `H:\workspace\2\vue-support-parent-starter\apps\vue-support-monitor-starter`

核心文件：

- 路由模块：`apps/vue-support-monitor-starter/src/router/modules/task.ts`
- 后端菜单映射：`apps/vue-support-monitor-starter/src/stores/route-menu.ts`
- 爬虫列表页：`apps/vue-support-monitor-starter/src/views/spider/index.vue`
- 爬虫设计页：`apps/vue-support-monitor-starter/src/views/spider/design/index.vue`
- 爬虫接口：`apps/vue-support-monitor-starter/src/api/spider/index.ts`

## 3. 路由接入

当前 `vue-monitor` 已按下面方式接入：

- 父级菜单路由：`/spider-management`
- 父级菜单重定向：`/spider`
- 任务列表页：`/spider`
- 兼容旧地址：`/spider-list`
- 流程设计页：`/spider/design/:taskId`

说明：

- 页面内部跳转已经统一走 `/spider`
- 历史地址 `/spider-list` 通过别名继续兼容
- `design` 页面为隐藏路由，不直接出现在菜单中

对应实现文件：

- `apps/vue-support-monitor-starter/src/router/modules/task.ts`

## 4. 菜单映射

如果系统启用了远程菜单，后端菜单 `id` 需要能映射到实际前端路由。当前已补充以下映射到 `/spider`：

- `spiderManagement`
- `spiderList`
- `spiderTaskList`
- `spider-list`

对应实现文件：

- `apps/vue-support-monitor-starter/src/stores/route-menu.ts`

如果后端菜单使用的是以上任一 `id`，点击菜单后都会进入爬虫任务页。

## 5. 页面能力

### 5.1 任务列表页

入口文件：

- `apps/vue-support-monitor-starter/src/views/spider/index.vue`

已支持：

- 创建任务
- 编辑任务
- 删除任务
- 立即运行
- 停止任务
- 查看采集数据
- 查看运行日志
- 进入流程设计

主要接口：

- `GET v1/spider/page`
- `GET v1/spider/{id}`
- `POST v1/spider/save`
- `PUT v1/spider/update`
- `DELETE v1/spider/delete`
- `POST v1/spider/run/{id}`
- `POST v1/spider/stop/{id}`
- `GET v1/spider/logs/{id}`
- `GET v1/spider/data/{id}`
- `GET v1/spider/statistics`

### 5.2 XPath / CSS 可视化提取

入口文件：

- `apps/vue-support-monitor-starter/src/views/spider/components/SpiderTaskDialog.vue`

已支持：

- 输入目标 URL 后预览页面
- 拉取 HTML 树
- 左侧页面节点点击高亮
- 选中节点后自动带出 `xpath`
- 支持新增 XPath 规则
- 支持新增 CSS 规则
- 支持复制 XPath
- 支持规则测试

主要接口：

- `GET v1/spider/preview`
- `GET v1/spider/parse-html`
- `POST v1/spider/test-selector`
- `POST v1/spider/generate-xpath`

### 5.3 流程设计页

入口文件：

- `apps/vue-support-monitor-starter/src/views/spider/design/index.vue`

已支持：

- 拖拽 SPI 节点到画布
- 节点参数配置
- 节点位置保存
- 节点连线
- 设计校验
- 设计保存
- 清空设计
- 运行任务

主要接口：

- `GET v1/spider/spi/types`
- `GET v1/spider/spi/parameters`
- `GET v1/spider/design/{taskId}`
- `POST v1/spider/design/{taskId}`
- `GET v1/spider/design/{taskId}/validate`
- `DELETE v1/spider/design/{taskId}`
- `POST v1/spider/design/{taskId}/nodes`
- `PUT v1/spider/design/nodes/{nodeId}`
- `DELETE v1/spider/design/nodes/{nodeId}`
- `PUT v1/spider/design/{taskId}/nodes/positions`
- `POST v1/spider/design/{taskId}/connections`
- `DELETE v1/spider/design/connections/{connectionId}`

## 6. 后端前置要求

前端能正常工作，后端至少需要满足以下条件：

- 已集成 spider 模块
- 已暴露 `v1/spider/**` 接口
- 已完成 spider 基础表初始化
- 当前登录态对 spider 接口可用

推荐最小检查项：

- `GET /v1/spider/page`
- `GET /v1/spider/statistics`
- `GET /v1/spider/spi/types`
- `GET /v1/spider/preview?url=...`
- `POST /v1/spider/test-selector`

如果部署在带统一前缀的系统里，例如：

- `/monitor/api/v1/spider/**`
- `/system/api/v1/spider/**`

则需要确保前端的 `VITE_API_BASE_URL` 或统一代理前缀已经正确指向该入口。

## 7. 最小接入步骤

### 7.1 前端

1. 确保页面文件存在于 `src/views/spider`
2. 在 `src/router/modules/task.ts` 中注册爬虫路由
3. 在 `src/stores/route-menu.ts` 中补充后端菜单 `id -> path` 映射
4. 确认 `src/api/spider/index.ts` 中接口前缀为 `v1/spider`

### 7.2 后端

1. 挂载 spider 模块到 Spring 系统
2. 配置数据库
3. 初始化 spider 表
4. 确认认证链路允许已登录用户访问 spider 接口

## 8. 验收步骤

建议按下面顺序做 smoke：

1. 登录 `vue-monitor`
2. 打开 `#/spider`
3. 确认任务列表页正常渲染
4. 新建一个任务，填写目标 URL
5. 在提取规则弹窗中执行页面预览
6. 点击页面节点，确认 XPath 能自动写入规则
7. 测试选择器返回预期结果
8. 保存任务后进入 `#/spider/design/{taskId}`
9. 拖拽节点并保存设计
10. 运行任务并查看日志 / 数据弹窗

## 9. 回归测试

本次前端路由接入已补充单测：

- `packages/utils/tests/monitor-spider-routes.test.ts`

执行命令：

```bash
pnpm --dir H:\workspace\2\vue-support-parent-starter --filter @repo/utils test -- monitor-spider-routes.test.ts
```

如果同时回归 docker 路由映射，可执行：

```bash
pnpm --dir H:\workspace\2\vue-support-parent-starter --filter @repo/utils test -- monitor-spider-routes.test.ts monitor-docker-routes.test.ts
```

## 10. 当前接入结果

当前 `vue-monitor` 已完成：

- 爬虫页面挂载到任务管理菜单体系
- `/spider` 新入口与 `/spider-list` 旧入口兼容
- 远程菜单 `id` 到爬虫路由的映射
- 路由级回归测试覆盖

如果后续需要继续补文档，可以追加两类内容：

- 后端 spider 表初始化和数据库配置说明
- 从 `spring-support-api-parent` 到测试服务器的完整发布流程
