# Docker 系统报告

## 文档定位
- 文档类型：`系统报告`
- 生效日期：`2026-04-23`
- 适用范围：`spring-support-docker-starter`、`vue-support-parent-starter/pages/docker`
- 当前目标：按最新规则重构 Docker 数据模型、运行时获取方式、SQL 交付规范与前后端接口边界

## 本次重构结论
1. Docker 仓库保留数据库表，但字段统一使用 `docker_registry_*` 前缀。
2. 容器启动模板改为数据库持久化，后续“快速启动”统一基于模板，不再基于镜像/容器同步表复用。
3. 服务器来源统一回收至 `server_host`，Docker 不再维护独立服务器主档表。
4. 镜像、容器等运行时信息统一走 SPI 实时读取，不再依赖 `docker_image`、`docker_container` 之类同步落库表。
5. starter 的 SQL 交付固定为两份：
   `V2026.04.23__create_docker_schema.sql`
   `V2026.04.24__init_docker_seed_data.sql`

## 系统设计

### 1. 服务器来源
- 唯一来源表：`server_host`
- Docker 连接配置承载方式：
  - 通用连接字段复用 `server_host` 的 `server_host/server_port/server_username/server_password/server_private_key`
  - Docker 专属字段挂入 `server_metadata_json.dockerConfig`
- Docker 页面中的服务器列表、能力探活、连接详情，统一从 `server_host` 派生

### 2. 仓库模型
- 表名：`docker_registry`
- 关键字段：
  - `docker_registry_id`
  - `docker_registry_name`
  - `docker_registry_code`
  - `docker_registry_url`
  - `docker_registry_namespace`
  - `docker_registry_username`
  - `docker_registry_password`
  - `docker_registry_token`
  - `docker_registry_default_flag`
  - `docker_registry_enabled`
- 规则：
  - 镜像检索、容器检索的仓库归属，不再依赖镜像同步表中的 `registry_id`
  - 统一通过镜像名和仓库配置做运行时匹配
  - 指定仓库拉取镜像时，优先根据仓库 URL 和 namespace 组装完整镜像引用

### 3. 容器启动模板
- 表名：`docker_container_template`
- 用途：保存一份可重复启动的容器参数快照
- 核心字段：
  - `server_id`
  - `docker_registry_id`
  - `template_name`
  - `bound_container_id`
  - `container_name`
  - `image_name`
  - `image_tag`
  - `env_json`
  - `port_mappings_json`
  - `volume_bindings_json`
  - `network_name`
  - `command_line`
  - `cpu_limit`
  - `memory_limit`
- 模板要求覆盖的内容：
  - 环境变量
  - 端口映射
  - 数据卷挂载（卷名、挂载路径）
  - 容器名称
  - 启动命令
  - 网络选择
  - CPU / 内存限制
  - 绑定容器 ID

### 4. 运行时数据获取
- 镜像列表：`DockerImageServiceImpl` 直接走 `DockerClientProvider.listImages`
- 容器列表：`DockerContainerServiceImpl` 直接走 `DockerClientProvider.listContainers`
- 数据卷列表：`DockerMountServiceImpl` 直接走 `docker volume` 实时读取
- 网络列表：`DockerNetworkServiceImpl` 直接走 `docker network` 实时读取
- 全局检索：`DockerDashboardServiceImpl` 直接汇总实时镜像/容器快照
- 同步中心：保留接口，但语义改为“SPI 实时盘点”，不再执行镜像/容器落库同步

### 5. 挂载与网络边界
- 页面可以直接创建数据卷和网络
- 创建动作直接作用于 Docker 运行时
- 挂载和网络不进入模板表
- 模板只保存“容器启动参数”，即容器创建时要引用哪些挂载、网络

## 数据库范围

### 保留表
- `docker_registry`
- `docker_container_template`
- `docker_install_task`
- `docker_install_task_step`
- `docker_sync_audit`

### 退出核心模型的表
- `docker_image`
- `docker_container`
- `docker_server`
- `docker_mount`
- `docker_network`

说明：
- 以上五类表均不再参与 Docker 核心运行链路。
- 镜像、容器、挂载、网络、连接配置均已切换为“实时 SPI + server_host 派生”模型。

## 后端接口现状

### 已重构接口
- `GET /docker/server-connections`
- `GET /docker/server-connections/{serverId}`
- `PUT /docker/server-connections/{serverId}`
- `DELETE /docker/server-connections/{serverId}`
- `POST /docker/server-connections/{serverId}/probe`
- `GET /docker/images`
- `POST /docker/images/pull`
- `POST /docker/images/import`
- `POST /docker/images/export`
- `GET /docker/containers`
- `POST /docker/containers/{id}/exec`
- `PUT /docker/containers/{id}/config`
- `GET /docker/mounts`
- `POST /docker/mounts`
- `GET /docker/networks`
- `POST /docker/networks`
- `GET /docker/dashboard/summary`
- `GET /docker/dashboard/search`
- `POST /docker/sync/run/{scope}`

### 新增接口
- `GET /docker/container-templates`
- `GET /docker/container-templates/{id}`
- `POST /docker/container-templates`
- `PUT /docker/container-templates/{id}`
- `DELETE /docker/container-templates/{id}`

说明：
- 挂载/网络接口已收口为运行时对象接口，只保留查询和创建。
- 不再提供挂载/网络详情、更新、删除的数据库型接口。

## 前端页面影响
- `DockerManagePage` 继续使用原有接口路径，但镜像和容器数据源已经切换为实时 SPI。
- 服务器连接页读取到的 Docker 配置，现已由 `server_host + server_metadata_json.dockerConfig` 派生。
- 启动模板后续应作为“快速启动”的唯一复用入口，前端需要补模板管理和模板应用入口。

## SQL 交付规范
- 允许的 SQL 文件数量：`2`
- 建表 SQL：`V2026.04.23__create_docker_schema.sql`
- 数据 SQL：`V2026.04.24__init_docker_seed_data.sql`
- 不允许继续堆叠多个 bootstrap SQL、patch SQL、临时 SQL

## 验证说明
- 已完成：
  - 仓库字段前缀化
  - 启动模板表与 CRUD 接口落地
  - Docker 连接配置改为 `server_host` 派生
  - 镜像/容器改为 SPI 实时查询
  - SQL 拆分为“建表 + 数据”两份
- 当前未完成的工程外部问题：
  - `spring-support-server-starter` 与 `spring-support-docker-starter` 中存在历史损坏 Java 源文件，常规 `mvn compile` 会先被这些无关文件阻塞
  - 因此本次无法用整模块编译结果作为唯一验收依据

## 后续收口建议
1. 前端补齐容器启动模板管理页，并把“快速启动”接到模板接口。
2. 前端继续补挂载/网络运行时页的交互细节，但不再回退到映射表模型。
3. 对已经上线的数据库执行迁移前，先清理旧版 `docker_image/docker_container/docker_server/docker_mount/docker_network` 的历史数据依赖与 Flyway 版本基线。


