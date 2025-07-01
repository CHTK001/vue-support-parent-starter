# 服务器任务管理系统

## 概述

新的服务器任务管理系统替代了原有的固定定时任务，提供了更灵活、可配置的任务调度机制。系统根据服务器ID管理各种类型的定时任务，支持动态创建、更新、删除任务。

## 架构设计

### 核心组件

1. **ServerTaskManager** - 任务管理器核心类
   - 管理所有服务器的定时任务
   - 支持动态创建、更新、删除任务
   - 提供全局任务和服务器特定任务

2. **ServerTaskManagementService** - 任务管理服务接口
   - 提供任务管理的业务逻辑
   - 封装任务管理器的操作

3. **ServerTaskManagementController** - 任务管理控制器
   - 提供REST API接口
   - 支持任务的CRUD操作

### 任务类型

#### 服务器特定任务
每个服务器可以有以下类型的任务：

1. **指标收集任务** (`metricsCollectionTask`)
   - 根据配置的收集频率执行
   - 仅在非API上报方式时创建
   - 调用 `ServerMetricsWebSocketService.pushSingleServerMetricsByConfig()`

2. **告警检测任务** (`alertDetectionTask`)
   - 固定每2分钟执行一次
   - 仅在启用告警时创建
   - 调用 `UnifiedAlertService.checkAndPushServerAlerts()`

3. **健康检查任务** (`healthCheckTask`)
   - 固定每5分钟执行一次
   - 为所有启用的服务器创建
   - 执行服务器健康状态检查

#### 全局任务
不依赖特定服务器的任务：

1. **服务器状态汇总推送** - 每分钟执行
2. **性能趋势数据推送** - 每5分钟执行
3. **连接状态统计推送** - 每30秒执行
4. **健康状态报告推送** - 每5分钟执行
5. **每日健康报告推送** - 每天执行
6. **全局告警处理** - 每2分钟执行
7. **清理任务** - 每小时执行

## 配置驱动

### 数据收集频率
- 字段：`monitorSysGenServerSettingDataCollectionFrequency`
- 单位：秒
- 范围：10-3600秒
- 默认值：30秒
- 仅在非API上报方式时生效

### 上报方式控制
- API上报：客户端控制推送频率，服务器不创建指标收集任务
- 本地上报：服务器根据配置频率主动收集
- Prometheus：服务器根据配置频率查询Prometheus

## 生命周期管理

### 服务器创建
1. 保存服务器信息到数据库
2. 自动调用 `ServerTaskManagementService.createServerTasks()`
3. 根据服务器配置创建相应的任务

### 服务器更新
1. 更新服务器信息到数据库
2. 自动调用 `ServerTaskManagementService.updateServerTasks()`
3. 重新创建任务以应用新配置

### 服务器删除
1. 调用 `ServerTaskManagementService.removeServerTasks()`
2. 取消所有相关任务
3. 从数据库删除服务器信息

### 配置更新
1. 更新服务器配置到数据库
2. 自动调用 `ServerTaskManagementService.updateServerTasks()`
3. 重新创建任务以应用新配置

## API接口

### 任务管理接口

```http
# 创建服务器任务
POST /api/monitor/server-task/create/{serverId}

# 更新服务器任务配置
PUT /api/monitor/server-task/update/{serverId}

# 移除服务器任务
DELETE /api/monitor/server-task/remove/{serverId}

# 获取任务统计信息
GET /api/monitor/server-task/statistics

# 重新初始化所有任务
POST /api/monitor/server-task/reinitialize

# 检查任务健康状态
GET /api/monitor/server-task/health
```

## 监控和统计

### 任务统计信息
- `totalServerTasks`: 服务器任务总数
- `totalGlobalTasks`: 全局任务总数
- `activeServerTasks`: 活跃的服务器任务数
- `activeGlobalTasks`: 活跃的全局任务数

### 健康检查
- `isHealthy`: 任务系统是否健康
- `healthStatus`: 健康状态 (HEALTHY/UNHEALTHY)
- `taskActiveRate`: 任务活跃率
- `checkTime`: 检查时间

## 前端集成

### 配置界面优化
- API上报方式时隐藏"数据收集频率"字段
- 动态验证规则，API上报时不验证收集频率
- 添加提示信息说明API上报由客户端控制频率

### 字段移除
- 移除了无用的"监控间隔"字段
- 简化了配置界面
- 优化了用户体验

## 性能优化

### 线程池管理
- 使用 `ScheduledExecutorService` 管理所有定时任务
- 线程池大小根据CPU核心数动态调整
- 守护线程避免阻止JVM关闭

### 内存管理
- 定期清理无效任务记录
- 使用 `ConcurrentHashMap` 保证线程安全
- 及时取消已删除服务器的任务

### 错误处理
- 任务执行异常不影响其他任务
- 详细的日志记录便于问题排查
- 优雅的关闭机制

## 迁移说明

### 从旧系统迁移
1. 删除了 `DataPushTask` 和 `AlertDetectionTask` 类
2. 功能迁移到 `ServerTaskManager` 中
3. 配置驱动的任务创建替代固定定时任务
4. 保持API兼容性，无需修改客户端代码

### 配置兼容性
- 保留所有现有配置字段
- 移除无用的监控间隔字段
- 新增的任务管理功能向后兼容

## 故障排除

### 常见问题
1. **任务未创建**: 检查服务器状态是否启用
2. **任务不执行**: 检查配置是否正确
3. **内存泄漏**: 检查是否有未清理的任务

### 日志级别
- `INFO`: 任务创建、更新、删除
- `DEBUG`: 任务执行详情
- `ERROR`: 任务执行异常

### 监控指标
- 通过 `/api/monitor/server-task/health` 监控系统健康状态
- 通过 `/api/monitor/server-task/statistics` 查看任务统计
