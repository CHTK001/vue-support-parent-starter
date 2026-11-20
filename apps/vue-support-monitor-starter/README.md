# vue-support-monitor-starter

监控运维平台前端 —— 本仓库**最大的宿主应用**，组装 20+ 个 `@pages/*` 业务模块。对应后端为 monitor 栈（Spring Boot，actuator / agent 等）。

## 功能域

| 领域 | 模块 |
|---|---|
| 监控与大屏 | `@pages/monitor`（监控大屏）、`@pages/bigscreen`、`@pages/apm`（应用性能）、`@pages/actuator`（Spring Boot Actuator） |
| 基础设施 | `@pages/datasource`（数据源）、`@pages/docker`（容器）、`@pages/server`（主机资产）、`@pages/control`（控制台） |
| 网络与接入 | `@pages/tunnel`（隧道）、`@pages/room`（服务管理页签 / P2P 房间）、`@pages/remote`（远控，guacamole-common-js） |
| 管理面 | `@pages/system`、`@pages/account`、`@pages/channel`、`@pages/cdp`、`@pages/device`、`@pages/filesystem`、`@pages/osgi`、`@pages/debug`、`@pages/hotsport` |

## 技术栈

Vue 3 + TypeScript + Vite、Element Plus、Pinia、Vue Router、vue-i18n、echarts、mermaid（拓扑图）、CodeMirror 6（SQL 编辑）、guacamole-common-js（远程桌面）、`@techui/scifi`（科幻风大屏）。

## 依赖组装

```jsonc
// package.json（节选）
"dependencies": {
  "@pages/*": "workspace:*",           // 20+ 业务模块，见 package.json 全量
  "@repo/app": "workspace:*",
  "@repo/theme": "workspace:*",        // koi 主题
  "@repo/monitor-cards": "workspace:*",// 监控卡片贡献契约
  "@repo/languages": "workspace:*",
  "@repo/core": "workspace:*",
  "@repo/config": "workspace:*",
  "@repo/pinia": "workspace:*",
  "@repo/ui": "workspace:*",
  "@repo/utils": "workspace:*"
}
```

## 开发启动

```bash
cd apps/vue-support-monitor-starter
pnpm dev        # 端口 8848；/api 等代理到 MS_API_TARGET 指向的后端
pnpm build
pnpm lint
```

后端单实例口径：monitor 后端 8082 端口的 actuator 指标、agentTcpSyncServer（19390）等只能单实例运行，多开会在端口上冲突。

## 目录结构

```
src/
├── components/   # 应用级组件
├── palette/      # 大屏配色与主题
├── router/       # 应用级路由
├── stores/       # Pinia
├── styles/       # 全局样式
├── utils/        # 工具
├── views/        # 应用级视图（布局容器）
└── main.ts       # createContextApp 装配入口
```

## 验收口径

- 页面编译闸门：pages 级 `vue-tsc`（全量 vue-tsc 会 OOM）。
- 监控大屏验收：布局持久化、8082 actuator 真数据、复跑一致性。
- 拖拽性能用 LayoutCount 量化，不按 rAF 判断。
