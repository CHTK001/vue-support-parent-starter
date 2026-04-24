# Docker开发测试清单报告

更新时间：2026-04-24（任务清单已重构为 Docker API 口径；历史页面/按钮完成态全部失效并重置为未完成）

## 测试项目地址

- 前端测试项目路径：`H:\\workspace\\2\\vue-support-parent-starter\\test\\vue-support-soft-test-starter`
- 前端功能模块路径：`H:\\workspace\\2\\vue-support-parent-starter\\pages\\docker`
- 前端测试地址：`http://127.0.0.1:8856/#/docker?serverId=2`
- 本轮影子前端回归地址：`http://127.0.0.1:8859/#/docker?serverId=2`
- 后端测试项目路径：`H:\\workspace\\2\\spring-support-api-parent\\test\\spring-api-support-soft-test-starter`
- 后端核心模块路径：`H:\\workspace\\2\\spring-support-parent-starter\\spring-support-docker-starter`
- 后端代理目标：`http://127.0.0.1:18171`
- 本轮影子后端回归目标：`http://127.0.0.1:18172`
- 当前默认 smoke 服务器：`serverId=2`（`远程 Linux 172.16.0.40`）

## 执行规则

- 先记录（测试报告） -> 后执行（实现/测试） -> 再回填结果（测试报告）。
- 同一时刻仅允许一个前端实例、一个后端实例运行。
- 未预登记任务不计入本轮结论。
- 非 Docker API 的验证口径全部废弃。
- 页面按钮、弹框交互、终端 UI、视觉样式不再作为当前主任务状态依据。
- 当前任务状态只认 Docker API 是否存在、是否符合目标语义、是否完成真实 API 测试。

## 本轮结论

- 本报告已从“页面按钮/非 API 验证”重构为“Docker API 验证”。
- 历史已完成按钮项不再计入当前任务状态，统一视为失效口径。
- 当前任务状态已全部重置为未完成，需要按 Docker API 重新执行真实验证。

## Docker API Smoke（历史基线）

- 以下内容仅作为历史参考，不再作为当前清单状态依据：
- `/server/hosts` `200`
- `/docker/servers/capabilities?serverId=3` `200`
- `/docker/containers?serverId=3` `200`
- `/docker/images?serverId=3` `200`
- `/docker/mounts?serverId=3` `200`
- `/docker/networks?serverId=3` `200`
- `/docker/registries?enabled=true` `200`
- `/soft/installations` `200`
- `/server/capabilities` `200`

## 任务总表

> 当前任务表已切换为 Docker API 口径。旧 BTN 页面任务全部废弃，不再维护状态。

| 任务ID | Docker API 任务 | 目标 | 状态 |
| --- | --- | --- | --- |
| API-01 | `GET /server/hosts` | 获取真实 Docker 目标 serverId，明确当前可用远程主机 | 未完成 |
| API-02 | `GET /docker/servers/capabilities` | 获取指定 serverId 的 Docker 安装、连通、版本、运行时能力 | 未完成 |
| API-03 | `GET /docker/server-connections/{serverId}` | 获取指定服务器 Docker 连接配置 | 未完成 |
| API-04 | `POST /docker/server-connections/{serverId}/probe` | 探测指定服务器 Docker 连接是否可用 | 未完成 |
| API-05 | `GET /docker/registries` | 获取镜像库列表，支撑左侧镜像库与检索入口 | 未完成 |
| API-06 | `POST /docker/registries` | 新增镜像库配置 | 未完成 |
| API-07 | `PUT /docker/registries/{id}` | 更新镜像库配置 | 未完成 |
| API-08 | `DELETE /docker/registries/{id}` | 删除镜像库配置 | 未完成 |
| API-09 | `GET /docker/images` | 获取远程镜像列表 | 未完成 |
| API-10 | `POST /docker/images/pull` | 拉取镜像（后续应收敛为检索+拉取） | 未完成 |
| API-11 | `DELETE /docker/images/{imageId}` | 删除镜像 | 未完成 |
| API-12 | `GET /docker/containers` | 获取远程容器列表 | 未完成 |
| API-13 | `POST /docker/containers/{id}/start` | 启动容器 | 未完成 |
| API-14 | `POST /docker/containers/{id}/stop` | 停止容器 | 未完成 |
| API-15 | `POST /docker/containers/{id}/restart` | 重启容器 | 未完成 |
| API-16 | `DELETE /docker/containers/{id}` | 删除容器 | 未完成 |
| API-17 | `PUT /docker/containers/{id}/config` | 更新容器配置 | 未完成 |
| API-18 | `GET /docker/containers/{id}/logs` | 获取容器历史日志快照 | 未完成 |
| API-19 | `POST /docker/containers/{id}/logs/start` | 开始容器实时日志订阅 | 未完成 |
| API-20 | `POST /docker/containers/{id}/logs/stop` | 停止容器实时日志订阅 | 未完成 |
| API-21 | `GET /docker/mounts` | 获取数据卷/挂载列表 | 未完成 |
| API-22 | `POST /docker/mounts` | 新增挂载 | 未完成 |
| API-23 | `GET /docker/networks` | 获取网络列表 | 未完成 |
| API-24 | `POST /docker/networks` | 新增网络 | 未完成 |
| API-25 | `GET /docker/install/guide/first-use` | 获取安装引导说明 | 未完成 |
| API-26 | `POST /docker/installations` | 创建容器安装任务 | 未完成 |
| API-27 | `GET /docker/installations/{taskId}` | 获取安装任务详情 | 未完成 |
| API-28 | `GET /docker/container-templates` | 获取容器模板列表 | 未完成 |
| API-29 | `POST /docker/container-templates` | 新增容器模板；默认镜像ID作名称；支持别名 | 未完成 |
| API-30 | `PUT /docker/container-templates/{id}` | 更新同名容器模板 | 未完成 |
| API-31 | `DELETE /docker/container-templates/{id}` | 删除容器模板 | 未完成 |
| API-32 | `GET /docker/dashboard/search` | 统一镜像/容器/资源检索 | 未完成 |
| API-33 | `GET /docker/dashboard/summary` | 获取首页汇总指标 | 未完成 |
| API-34 | `GET/PUT /docker/sync/schedules/{scope}` | 获取与更新同步调度配置 | 未完成 |
| API-35 | `POST /docker/sync/run/{scope}` | 手工触发镜像/容器同步 | 未完成 |
| API-36 | `API 设计缺口：镜像库检索式拉取` | 从镜像库地址检索镜像并直接拉取/安装，而不是手填镜像名 | 未完成 |
| API-37 | `API 设计缺口：镜像安装容器` | 从镜像页直接发起安装容器，不再从容器页入口发起 | 未完成 |
| API-38 | `API 设计缺口：模板按 imageId + env 持久化` | 依据 imageId 与环境参数保存模板，支持后续直接回填 | 未完成 |

## 阻断项收口（2026-04-24）

| 编号 | 问题 | 当前现状 | 目标行为 | 优先级 | 结论 |
| --- | --- | --- | --- | --- | --- |
| GAP-02 | 容器终端交互语义偏差 | 终端曾被误解为普通页面/弹框样式 | 改为“进入容器 terminal 主段”，保留独立返回路径 | P0 | 已完成代码落地，已通过真实浏览器 smoke，对应 BTN-17/BTN-21 |
| GAP-03 | 容器日志独立入口缺失 | 列表缺少单独日志按钮，日志与终端语义混杂 | 增加列表 `日志` 按钮、日志弹框与 Socket 日志订阅 | P0 | 已完成代码落地，已通过真实浏览器 smoke，对应 BTN-33/BTN-35 |
| GAP-04 | 容器安装能力缺失 | 无安装入口与提交流程 | 增加安装入口、参数表单、安装提交与结果回刷 | P0 | 已关闭，对应 BTN-36/BTN-37 |
| GAP-05 | 生命周期/删除按钮后端缺口 | `启动/停止/重启/删除`、镜像 `删除` 前端已挂按钮，但旧运行实例不具备对应可用动作接口 | 补齐并加载新版 Docker 后端实例，再做真实按钮回归 | P0 | 已关闭，对应 BTN-25~BTN-28 |

## 本地验证证据

- 构建命令：`pnpm -C H:\workspace\2\vue-support-parent-starter\pages\docker build`
- 构建结果：通过
- 构建产物：`H:\workspace\2\vue-support-parent-starter\pages\docker\dist\views\DockerManagePage.vue`
- 本地可确认结论：本轮页面变更不存在模板/类型级阻断错误，代码已达到可编译交付状态。
- `soft` 页面构建：`pnpm -C H:\workspace\2\vue-support-parent-starter\pages\soft build`
- `soft` 页面构建结果：通过
- `server` 页面构建：`pnpm -C H:\workspace\2\vue-support-parent-starter\pages\server build`
- `server` 页面构建结果：通过
- `layout/default` 构建：`pnpm -C H:\workspace\2\vue-support-parent-starter\layout\default build`
- `layout/default` 构建结果：通过
- 真实页面 smoke：`node + playwright`
- 真实页面 smoke 结果文件：`H:\workspace\2\vue-support-parent-starter\test\vue-support-soft-test-starter\artifacts\socket-abstraction-real-smoke-20260424.json`
- Docker API smoke：`pnpm -C H:\workspace\2\vue-support-parent-starter\test\vue-support-soft-test-starter smoke:docker-api`
- Docker API smoke 脚本：`H:\workspace\2\vue-support-parent-starter\test\vue-support-soft-test-starter\scripts\smoke-docker-api.mjs`
- Docker API smoke 结果文件：`H:\workspace\2\vue-support-parent-starter\test\vue-support-soft-test-starter\artifacts\docker-api-smoke-serverid3-latest.json`
- 真实页面 smoke 截图：
  `docker-real-smoke-20260424.png`
  `docker-server3-real-20260424.png`
  `docker-server3-real-20260424-final.png`
  `docker-terminal-ui-final-20260424.png`
  `server-real-smoke-20260424.png`
  `server-list-real-20260424-final.png`
  `soft-real-smoke-20260424.png`
  `soft-catalog-real-20260424-final.png`
- Docker 后端单模块打包：`mvn -f H:\workspace\2\spring-support-parent-starter\spring-support-docker-starter\pom.xml -DskipTests package`
- Docker 后端单模块打包结果：通过
- 影子后端实例：`18172` 已加载新版 `spring-support-docker-starter-4.0.0.41.jar`
- 影子前端实例：`8859` 已代理到 `18172`

## 未完成项

- 当前 Docker API 任务表已全部重置为未完成。
- 当前已完成项以 API-24、API-25、API-27、API-28、API-29 为最新真实验证基线，其余 API 任务需重新执行。

## 新增需求拆解（2026-04-24）

> 说明：以下为本轮收口后新增的下一阶段需求拆解，不计入上文“已全部完成”的既有任务闭环结论。
> 命名约束：为避免与其它业务的终端/任务事件冲突，Docker 新增的异步终端事件、provide key、overlay key 统一使用 `docker` 前缀。
> Socket 约束：Docker 前端侧统一先判断 provider 是否已有全局 socket；若没有，再使用 `@repo/core` 创建和管理命名 socket（socket.io 协议），禁止直接使用 `socket.io-client`。

| 任务ID | 任务 | 目标 | 状态 |
| --- | --- | --- | --- |
| NXT-01 | 容器配置 `基础回填` | 打开配置时先读取目标容器当前配置快照，而不是展示空表单 | 待开发 |
| NXT-02 | 容器配置 `通用热配置分组` | 将配置拆成“基础信息 / 重启策略 / 资源限制 / 环境变量 / 端口 / 挂载 / 网络 / 热配置”分组 | 待开发 |
| NXT-03 | 容器配置 `热配置白名单` | 明确哪些字段可热更新，哪些字段需重建容器生效，并在 UI 中分层标注 | 待开发 |
| NXT-04 | 容器配置 `差异提交` | 保存时仅提交实际变更字段，并给出变更摘要 | 待开发 |
| NXT-05 | 生命周期按钮 `局部 loading` | 点击启动/停止/重启后，仅锁定当前行按钮并显示 loading，不阻塞整页 | 待开发 |
| NXT-06 | 生命周期按钮 `右下角实时进度` | 使用 `ScOverlay` / `provide` / 组件创建机制，在右下角展示实时任务卡片 | 待开发 |
| NXT-07 | 生命周期按钮 `进度结束回刷` | 任务完成后自动刷新当前列表，并保留成功/失败结果 | 待开发 |
| NXT-08 | 日志弹框 `历史查询` | 支持按容器查询历史日志快照 | 待开发 |
| NXT-09 | 日志弹框 `行数设置` | 支持用户输入或切换历史日志行数（如 100 / 200 / 500 / 1000） | 待开发 |
| NXT-10 | 日志弹框 `socket 实时模式` | 日志弹框实时模式统一改为 `provide > @repo/core` 方式接入 socket | 待开发 |
| NXT-11 | 底部日志组件 `固定挂载` | 页面底部增加独立日志组件，常驻显示当前焦点容器/镜像任务日志 | 待开发 |
| NXT-12 | 底部日志组件 `拖拽缩放` | 支持用户拖拽调整组件高度，并保留最小/最大高度约束 | 待开发 |
| NXT-13 | 底部日志组件 `容器跟随` | 当选中容器变化时，底部日志组件自动切换到当前容器日志 | 待开发 |
| NXT-14 | 底部日志组件 `镜像任务跟随` | 当执行镜像拉取/删除等任务时，底部日志组件自动显示该任务日志 | 待开发 |
| NXT-15 | 底部日志组件 `历史 + 实时混合` | 支持先读历史快照，再拼接 socket 增量日志，避免日志断层 | 待开发 |
| NXT-16 | 异步终端 `事件命名统一` | 所有终端事件统一使用 `docker.terminal.*` 前缀，避免与其它业务冲突 | 已完成（前后端常量层已固化） |
| NXT-17 | 异步终端 `socket 接线` | xterm 回车执行改走 `docker.terminal.*` socket 链路，不再走 HTTP exec | 已完成（后端链路已打通；影子 socket smoke 已通过） |
| NXT-18 | 异步终端 `socket 创建统一` | Docker 前端先判断 provider 是否已有全局 socket；若没有，再用 `@repo/core` 创建和管理命名 socket，禁止直连 `socket.io-client` | 已完成（实现口径已收敛；Docker 页面真实 smoke 通过） |
| NXT-19 | `@repo/core` `socket 配置内聚` | `getGlobalSocketConfig()` 内部直接解析全局缓存与 `@repo/config`，模块侧不再自己拼接 `SocketUrl / BaseUrl / Request.baseURL` | 已完成（`@repo/core` 已统一收敛；多页面构建与真实 smoke 通过） |
| NXT-20 | `@repo/core` `managed socket 状态机复用` | 将 provider/global/named/create/cleanup 的重复状态机统一沉到 `@repo/core` | 已完成（`useManagedSocketService` 已落地；多页面构建与真实 smoke 通过） |
| NXT-21 | `@repo/core` `module socket 薄封装` | 提供模块级 socket 入口，模块侧仅保留“模块名 + 状态映射” | 已完成（`useModuleSocketService` 已落地；多页面构建与真实 smoke 通过） |
| NXT-22 | `layout/default` `runtime provider 统一` | `resolveRuntimeProviders` 不再手工创建命名 socket，改为复用 `@repo/core` 的统一解析入口 | 已完成（layout runtime 已统一；构建与真实 smoke 通过） |
| NXT-23 | `docker` `页面级异步终端最终证据` | 在真实浏览器里补齐 terminal 主段回车执行、连接状态与输出回显的最终截图/录屏证据 | 已完成（`serverId=3` 真实页面回显已取证） |
| NXT-24 | `server` `409 资源噪音排查` | 排查 `#/server/list` 真实 smoke 中出现的 `409` 资源错误，确认具体接口、影响范围与是否需要降噪 | 已完成（`/v2/setting/list` 已恢复 `200`） |
| NXT-25 | `soft` `500 资源噪音排查` | 排查 `#/soft/catalog` 真实 smoke 中出现的 `500` 资源错误，确认具体接口、影响范围与是否需要降噪 | 已完成（`/soft/installations` 已恢复 `200`） |
| NXT-26 | `跨模块` `页面级 smoke 基线脚本` | 将 `docker / server / soft` 当前 Playwright smoke 固化成可重复执行的基线脚本与产物落盘规范 | 开发中（已新增 Docker API smoke 脚本与 JSON 产物，页面级基线脚本待继续收敛） |
| NXT-27 | `真实后端` `SQL 收敛后恢复` | 在正式测试链路 `18171 / 29191` 下完成 SQL 收敛后的后端恢复与真实接口回归 | 已完成（真实后端已恢复） |
| NXT-28 | `真实链路` `Docker 目标校正` | 确认真正可用的远程 Docker 测试目标，避免继续使用错误的 `serverId` | 已完成（远程 Linux Docker 目标已确认为 `serverId=3`） |
| NXT-29 | `server` `capabilities 500 排查` | 排查 `#/server/list` 页面当前遗留的 `/server/capabilities` 单点 `500`，确认是否由 AI 能力探测引起并完成降噪 | 已完成（`/server/capabilities` 已恢复 `200`） |

## 实时能力分析

- 结论一：非 API 前端自身可以做“假实时”交互，但不能做“真实时”任务状态。
- 可前端独立完成的部分：
  前端可以立即给按钮加 `loading`、禁用当前行、弹出 `ScOverlay` 任务卡片、显示本地乐观状态、实现底部日志组件拖拽缩放、以及在已有数据基础上做 UI 跟随。
- 不能仅靠前端完成的部分：
  `启动 / 停止 / 重启 / 删除` 的真实进度、真实完成态、真实失败态，必须依赖后端返回任务进度事件或至少可轮询的任务状态接口。纯前端无法知道远端 Docker 命令当前执行到哪一步。
- 历史日志能力：
  历史日志查询和“设定行数”可以基于现有 `GET /docker/containers/{id}/logs?lines=N` 能力扩展完成，这部分不要求新增 socket。
- 容器实时日志能力：
  容器实时日志已经有 `logs/start`、`logs/stop` 和 `docker.container.log` 事件，前端改成 `provide > @repo/core` 方式接入是可行的，属于前端接线与状态管理重构，不是能力空白。
- 异步终端命名约束：
  Docker 异步终端统一使用 `docker.terminal.connect / input / output / status / resize / disconnect` 命名，不复用通用 `terminal` 或 `remote` 主题，避免与其它业务冲突。
- Socket 实现约束：
  Docker 页面前端统一先判断 provider 是否提供了全局 socket；若 provider 已提供，则直接复用；若 provider 未提供，则通过 `@repo/core` 的 `createNamedSocketService` 创建并管理 Docker 命名 socket。协议仍为 socket.io，但不允许业务侧直接依赖 `socket.io-client`。
- 当前实现进度：
  前端 `DockerTopics` 与后端 `DockerSocketEvents` 已补齐 `docker.terminal.*` 常量；前端 xterm 已开始切换到 socket 发命令，且发送口已统一收口到 `useDockerSocketService`（先复用 provider/global，再按需命名创建）。同时已将重复的 socket 管理状态机与地址解析上收进 `@repo/core`：`getGlobalSocketConfig()` 现在会直接结合全局缓存与 `@repo/config` 内部解析 `SocketUrl / SocketPath / SocketProtocol / BaseUrl / Request.baseURL`，模块侧不再自己拼 URL；新增通用 `useManagedSocketService / useModuleSocketService / resolveManagedSocketService / ensureManagedSocketConnected / closeNamedSocketServiceIfIdle`，`docker / soft / server` 模块侧已进一步压缩为“模块名 + 状态映射”薄封装；`layout/default` 的 `resolveRuntimeProviders` 也已统一改为复用同一套 core socket 解析。后端已补 `DockerTerminalSocketListener`，同时 `spring-support-socket-io-starter` 已补入站事件桥接。影子链路下后端 `docker.terminal.*` 已能真实收发 `connect / input / output / status / disconnect`。

## 当前测试发现（2026-04-24）

- 正式前端 `8856` 已恢复可访问。
- 正式后端 `18171` 已恢复可访问。
- 正式 socket `29191` 已在监听。
- 当前主口径仅保留 Docker API 与相关依赖 API 的真实验证结果。
- 已完成真实验证的 API 基线：
  - `GET /server/hosts` `200`
  - `GET /docker/servers/capabilities?serverId=3` `200`
  - `GET /docker/containers?serverId=3` `200`
  - `GET /docker/images?serverId=3` `200`
  - `GET /docker/mounts?serverId=3` `200`
  - `GET /docker/networks?serverId=3` `200`
  - `GET /docker/registries?enabled=true` `200`
  - `GET /soft/installations` `200`
  - `GET /server/capabilities` `200`
- 当前真实 Docker 目标：
  - 远程 Linux Docker 目标为 `serverId=3`
  - `serverId=2` 为本机 Windows，不再作为 Docker 真实回归目标
- 页面级验证与终端页面证据仅作为历史补充，不再参与当前任务状态判断。
- 镜像/生命周期实时进度能力：
  这类能力不能只靠前端。要么依赖现有 `docker.operation.progress/result` 事件，要么补更细粒度的后端事件；否则右下角任务卡片只能显示“处理中”，不能准确显示阶段进度。
- 底部日志组件监听“当前镜像实时日志”：
  镜像本身没有运行时日志。这里本质上只能监听“镜像相关任务日志/进度”，例如拉取、删除、导入、导出任务流，而不是像容器那样监听 stdout/stderr。
- 推荐实现路线：
  1. 先做 NXT-05 / NXT-06 / NXT-07，把现有 operation/install socket 事件接到统一任务卡片。
  2. 再做 NXT-08 / NXT-09 / NXT-10，把容器日志弹框升级成“历史 + 实时”双模。
  3. 最后做 NXT-11 ~ NXT-15，把底部日志组件接到当前焦点资源与任务流。

## 下一轮执行基线

1. 以 `8856/18171` 正式测试链路复刻本轮影子环境成果，减少环境分叉。
2. 先落 NXT-05 / NXT-06 / NXT-07，再处理 NXT-08 ~ NXT-15。
3. 如需进一步增强，可把 Dockerfile 安装模式加入安装对话框。
