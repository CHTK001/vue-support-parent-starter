# Docker容器管理功能说明

## 概述

本模块提供了完整的Docker容器管理功能，包括容器的查看、启动、停止、重启、删除等操作，以及实时日志查看和进入容器等高级功能。

## 功能特性

### 1. 容器列表视图 (index.vue)

传统的表格视图，提供以下功能：
- ✅ 容器列表展示（表格形式）
- ✅ 按状态、服务器筛选
- ✅ 容器启动、停止、重启、删除
- ✅ 批量操作（批量启动、停止、删除）
- ✅ 查看容器详情
- ✅ 查看实时日志
- ✅ 进入容器（Terminal）
- ✅ 同步容器状态

### 2. 分组视图 (group-view.vue) 

新增的分组视图，支持两种分组方式：

#### 按服务器分组
- 将容器按所在服务器分组展示
- 每个服务器组显示容器数量
- 支持批量启动/停止该服务器上的所有容器
- 折叠式展开，节省空间

#### 按软件分组
- 将容器按软件/镜像分组展示
- 显示每个软件的运行/停止容器数量
- 便于管理同一软件的多个实例

### 3. 容器详情对话框 (ContainerDetailDialog.vue)

提供完整的容器信息展示，包含7个Tab页：

#### 基本信息 Tab
- 容器名称、ID
- 镜像名称、标签
- 运行状态、服务器
- 创建/启动时间
- 重启策略、自动删除等

#### 网络配置 Tab
- 端口映射列表
- 网络模式
- IP地址

#### 资源监控 Tab
- CPU使用率（圆形进度条）
- 内存使用率（圆形进度条）
- 内存使用量/限制
- 磁盘IO（读/写）
- 网络IO（接收/发送）

#### 环境变量 Tab
- 显示所有环境变量
- 格式化展示（KEY=VALUE）

#### 存储挂载 Tab
- 显示所有卷挂载
- 主机路径:容器路径

#### 启动配置 Tab ⭐ 新增
- 完整的启动配置信息
- 包括命令、参数、网络、资源限制等
- JSON格式的完整配置展示

#### 性能图表 Tab
- CPU使用率实时图表
- 内存使用实时图表
- 磁盘IO实时图表
- 网络IO实时图表

### 4. 容器日志对话框 (ContainerLogsDialog.vue)

强大的日志查看功能：
- ✅ 实时日志加载
- ✅ 自动刷新（可开关）
- ✅ 可调整日志行数（50-2000行）
- ✅ 日志级别筛选（ERROR/WARN/INFO/DEBUG）
- ✅ 日志统计（总行数、错误数、警告数）
- ✅ 滚动到顶部/底部
- ✅ 下载日志文件
- ✅ 新窗口打开

### 5. 容器卡片组件 (ContainerCard.vue) ⭐ 新增

卡片式容器展示组件，用于分组视图：
- 美观的卡片布局
- 状态指示（运行中/已停止）
- 关键信息展示（镜像、服务器、端口、资源）
- 快捷操作按钮（启动、停止、重启）
- 更多菜单（进入容器、查看日志、详情、删除）

## API接口

### 新增接口

#### 批量操作容器
```typescript
POST /api/monitor/system-soft-container/batch

Request:
{
  "containerIds": [1, 2, 3],
  "operation": "start" | "stop" | "restart" | "remove"
}

Response:
{
  "total": 3,
  "success": 2,
  "failed": 1
}
```

### 已有接口

- `GET /api/monitor/system-soft-container/page` - 分页查询容器
- `GET /api/monitor/system-soft-container/list` - 条件查询容器
- `GET /api/monitor/system-soft-container/{id}` - 获取容器详情
- `POST /api/monitor/system-soft-container/{id}/start` - 启动容器
- `POST /api/monitor/system-soft-container/{id}/stop` - 停止容器
- `POST /api/monitor/system-soft-container/{id}/restart` - 重启容器
- `DELETE /api/monitor/system-soft-container/{id}/container` - 删除容器
- `GET /api/monitor/system-soft-container/{id}/logs` - 获取容器日志
- `POST /api/monitor/system-soft-container/{id}/logs/start` - 启动日志推送
- `POST /api/monitor/system-soft-container/{id}/logs/stop` - 停止日志推送
- `POST /api/monitor/system-soft-container/{id}/exec` - 执行命令
- `GET /api/monitor/system-soft-container/{id}/stats` - 获取统计信息
- `GET /api/monitor/system-soft-container/sync` - 同步容器状态

## 使用方式

### 路由配置

```typescript
// 在路由配置中添加
{
  path: '/docker/containers',
  name: 'DockerContainers',
  component: () => import('@/views/docker/containers/index.vue'),
  meta: { title: '容器管理' }
},
{
  path: '/docker/containers/group',
  name: 'DockerContainersGroup',
  component: () => import('@/views/docker/containers/group-view.vue'),
  meta: { title: '容器管理（分组视图）' }
}
```

### 组件引入

```vue
<script setup>
import { 
  ContainerDetailDialog,
  ContainerLogsDialog,
  ContainerCard 
} from '@/views/docker/containers/components'
</script>
```

## 权限控制

容器管理功能建议仅对管理员开放：

```vue
<el-button v-role="'admin'" @click="handleDelete">删除</el-button>
```

## 注意事项

1. **进入容器功能**需要配置SSH服务器连接
2. **实时日志**功能依赖Socket.IO，确保已配置
3. **批量操作**建议谨慎使用，特别是批量删除
4. **性能图表**需要容器运行状态才能显示数据
5. 确保Docker服务已正确配置并可访问

## 技术栈

- Vue 3 + TypeScript
- Element Plus
- Socket.IO (实时日志)
- xterm.js (终端模拟器)
- ECharts (性能图表)

## 未来计划

- [ ] 容器资源限制调整
- [ ] 容器镜像版本升级
- [ ] 容器快照/备份
- [ ] 容器编排支持
- [ ] 多容器批量配置模板

