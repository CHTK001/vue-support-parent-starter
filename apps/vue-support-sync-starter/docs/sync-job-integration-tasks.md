# 数据同步系统整合 Job 调度模块 - 任务清单

## 阶段一：基础设施准备

### 1.1 配置属性类

- [ ] 创建 `SyncJobIntegrationProperties` 配置类
  - [ ] 定义 `enabled` 开关（默认 false）
  - [ ] 定义 `syncStatus` 状态同步开关
  - [ ] 定义 `dualLog` 双写日志开关
  - [ ] 定义 `jobNamePrefix` Job 名称前缀
  - [ ] 定义 `useJobRetry` 使用 Job 重试机制开关

### 1.2 配置类更新

- [ ] 修改 `SyncDataConfiguration`
  - [ ] 添加 `@EnableConfigurationProperties(SyncJobIntegrationProperties.class)`
  - [ ] 条件注入 Job 集成相关 Bean（`@ConditionalOnProperty`）

### 1.3 依赖检查

- [ ] 检查 `spring-support-sync-data-starter` 的 pom.xml
  - [ ] 确认已依赖 `spring-support-job-starter`
  - [ ] 如未依赖则添加（scope: optional）

## 阶段二：核心组件实现

### 2.1 SyncTaskJobHandler

- [ ] 创建 `SyncTaskJobHandler` 类
  - [ ] 实现 `JobHandler` 接口
  - [ ] 注入 `MonitorSyncTaskExecutor`
  - [ ] 注入 `SyncTaskLogAdapter`
  - [ ] 实现 `execute(TriggerParam param)` 方法
    - [ ] 解析 `executeParam` 获取 taskId
    - [ ] 调用 `taskExecutor.executeOnce(taskId)`
    - [ ] 处理执行异常
    - [ ] 适配日志到 Job 系统
  - [ ] 添加 `@Component("syncTaskJobHandler")` 注解

### 2.2 SyncJobIntegrationService 接口

- [ ] 创建 `SyncJobIntegrationService` 接口
  - [ ] 定义 `createOrUpdateJob(MonitorSyncTask task)` 方法
  - [ ] 定义 `startJob(Long taskId)` 方法
  - [ ] 定义 `stopJob(Long taskId)` 方法
  - [ ] 定义 `deleteJob(Long taskId)` 方法
  - [ ] 定义 `syncTaskStatus(Long taskId)` 方法
  - [ ] 定义 `getJobId(Long taskId)` 方法

### 2.3 SyncJobIntegrationServiceImpl 实现

- [ ] 创建 `SyncJobIntegrationServiceImpl` 类
  - [ ] 注入 `SysJobMapper`
  - [ ] 注入 `MonitorSyncTaskMapper`
  - [ ] 注入 `SyncJobIntegrationProperties`
  - [ ] 实现 `createOrUpdateJob` 方法
    - [ ] 根据 taskId 查询是否已存在 Job
    - [ ] 构建 Job 名称：`{prefix}{taskId}_{taskName}`
    - [ ] 设置调度类型：cron/fixed
    - [ ] 设置调度时间：cron 表达式或间隔毫秒
    - [ ] 设置执行器：`syncTaskJobHandler`
    - [ ] 设置执行参数：`{"taskId": xxx}`
    - [ ] 设置失败重试次数
    - [ ] 插入或更新 SysJob 记录
  - [ ] 实现 `startJob` 方法
    - [ ] 更新 `job_trigger_status = 1`
    - [ ] 计算下次触发时间
  - [ ] 实现 `stopJob` 方法
    - [ ] 更新 `job_trigger_status = 0`
  - [ ] 实现 `deleteJob` 方法
    - [ ] 删除 SysJob 记录
  - [ ] 实现 `syncTaskStatus` 方法
    - [ ] 查询 Job 状态
    - [ ] 更新 SyncTask 状态
  - [ ] 实现 `getJobId` 方法
    - [ ] 根据执行参数查询 Job ID
    - [ ] 使用缓存优化查询

### 2.4 SyncTaskLogAdapter 接口

- [ ] 创建 `SyncTaskLogAdapter` 接口
  - [ ] 定义 `createJobLog(MonitorSyncTaskLog syncLog)` 方法
  - [ ] 定义 `updateJobLog(MonitorSyncTaskLog syncLog)` 方法
  - [ ] 定义 `syncLogToJob(Long syncLogId, Integer jobLogId)` 方法

### 2.5 SyncTaskLogAdapterImpl 实现

- [ ] 创建 `SyncTaskLogAdapterImpl` 类
  - [ ] 注入 `SysJobLogMapper`
  - [ ] 注入 `MonitorSyncTaskLogMapper`
  - [ ] 注入 `SyncJobIntegrationService`
  - [ ] 注入 `SyncJobIntegrationProperties`
  - [ ] 实现 `createJobLog` 方法
    - [ ] 检查 `dualLog` 开关
    - [ ] 获取对应的 Job ID
    - [ ] 构建 SysJobLog 对象
    - [ ] 映射状态：RUNNING/SUCCESS/FAIL
    - [ ] 映射时间：开始时间、结束时间
    - [ ] 插入 SysJobLog 记录
    - [ ] 返回 jobLogId
  - [ ] 实现 `updateJobLog` 方法
    - [ ] 检查 `dualLog` 开关
    - [ ] 查询关联的 jobLogId
    - [ ] 更新执行状态
    - [ ] 更新耗时
    - [ ] 更新错误信息
  - [ ] 实现 `syncLogToJob` 方法
    - [ ] 查询 SyncTaskLog
    - [ ] 创建或更新 JobLog
    - [ ] 异步执行，不阻塞主流程

## 阶段三：集成现有服务

### 3.1 修改 MonitorSyncTaskServiceImpl

- [ ] 注入 `SyncJobIntegrationService`（可选依赖）
- [ ] 注入 `SyncJobIntegrationProperties`
- [ ] 修改 `createTask` 方法
  - [ ] 任务创建后，如果启用 Job 集成，调用 `createOrUpdateJob`
- [ ] 修改 `updateTask` 方法
  - [ ] 任务更新后，如果启用 Job 集成，调用 `createOrUpdateJob`
- [ ] 修改 `deleteTask` 方法
  - [ ] 任务删除前，如果启用 Job 集成，调用 `deleteJob`
- [ ] 修改 `startTask` 方法
  - [ ] 判断 `job-integration.enabled`
  - [ ] 如果启用，调用 `syncJobIntegrationService.startJob()`
  - [ ] 如果禁用，保持原有逻辑（调用 `taskExecutor.start()`）
- [ ] 修改 `stopTask` 方法
  - [ ] 判断 `job-integration.enabled`
  - [ ] 如果启用，调用 `syncJobIntegrationService.stopJob()`
  - [ ] 如果禁用，保持原有逻辑（调用 `taskExecutor.stop()`）

### 3.2 修改 MonitorSyncTaskExecutorImpl

- [ ] 注入 `SyncTaskLogAdapter`（可选依赖）
- [ ] 注入 `SyncJobIntegrationProperties`
- [ ] 修改 `start` 方法
  - [ ] 判断 `job-integration.enabled`
  - [ ] 如果启用，跳过 ThreadPool 调度逻辑
  - [ ] 如果禁用，保持原有逻辑
- [ ] 修改 `doExecute` 方法
  - [ ] 执行开始时，如果启用双写日志，调用 `logAdapter.createJobLog()`
  - [ ] 执行结束时，如果启用双写日志，调用 `logAdapter.updateJobLog()`
  - [ ] 保持原有的 `MonitorSyncTaskLog` 记录逻辑
- [ ] 修改 `init` 方法
  - [ ] 判断 `job-integration.enabled`
  - [ ] 如果启用，不创建 `ThreadPoolTaskScheduler`
  - [ ] 如果禁用，保持原有逻辑
- [ ] 修改 `destroy` 方法
  - [ ] 判断 `taskScheduler` 是否为 null
  - [ ] 安全关闭调度器

## 阶段四：数据库扩展

### 4.1 扩展字段映射

- [ ] 在 `MonitorSyncTaskLog` 添加字段
  - [ ] 添加 `@TableField(exist = false)` 的 `jobLogId` 字段
  - [ ] 用于关联 Job 日志 ID
- [ ] 在 `MonitorSyncTask` 添加字段
  - [ ] 添加 `@TableField(exist = false)` 的 `jobId` 字段
  - [ ] 用于关联 Job ID

### 4.2 Mapper 方法扩展

- [ ] 在 `MonitorSyncTaskMapper` 添加方法
  - [ ] `selectByJobId(Integer jobId)`: 根据 Job ID 查询任务
- [ ] 在 `MonitorSyncTaskLogMapper` 添加方法
  - [ ] `selectByJobLogId(Integer jobLogId)`: 根据 Job 日志 ID 查询日志

## 阶段五：状态同步机制

### 5.1 状态同步定时任务

- [ ] 创建 `SyncTaskStatusSyncJob` 类
  - [ ] 添加 `@Component` 注解
  - [ ] 添加 `@Scheduled(fixedDelay = 60000)` 注解（每分钟）
  - [ ] 注入 `SyncJobIntegrationService`
  - [ ] 注入 `MonitorSyncTaskMapper`
  - [ ] 注入 `SysJobMapper`
  - [ ] 实现 `syncAllTaskStatus` 方法
    - [ ] 查询所有启用 Job 集成的任务
    - [ ] 批量查询 Job 状态
    - [ ] 比对状态差异
    - [ ] 更新不一致的状态
    - [ ] 记录同步日志

### 5.2 异常恢复机制

- [ ] 在 `MonitorSyncTaskExecutorImpl` 添加恢复逻辑
  - [ ] 修改 `recoverRunningTasks` 方法
  - [ ] 判断 `job-integration.enabled`
  - [ ] 如果启用，检查 Job 状态并恢复
  - [ ] 如果禁用，保持原有逻辑

## 阶段六：测试验证

### 6.1 单元测试

- [ ] 测试 `SyncTaskJobHandler`
  - [ ] 测试正常执行流程
  - [ ] 测试参数解析
  - [ ] 测试异常处理
- [ ] 测试 `SyncJobIntegrationServiceImpl`
  - [ ] 测试创建 Job
  - [ ] 测试更新 Job
  - [ ] 测试启动/停止 Job
  - [ ] 测试删除 Job
  - [ ] 测试状态同步
- [ ] 测试 `SyncTaskLogAdapterImpl`
  - [ ] 测试日志创建
  - [ ] 测试日志更新
  - [ ] 测试日志同步

### 6.2 集成测试

- [ ] 测试任务启动流程
  - [ ] 启用 Job 集成，创建任务
  - [ ] 启动任务，验证 Job 创建
  - [ ] 验证任务自动执行
  - [ ] 验证日志双写
- [ ] 测试任务停止流程
  - [ ] 停止任务，验证 Job 停止
  - [ ] 验证任务不再执行
- [ ] 测试任务删除流程
  - [ ] 删除任务，验证 Job 删除
- [ ] 测试配置开关
  - [ ] 禁用 Job 集成，验证回退到原有逻辑
  - [ ] 启用 Job 集成，验证使用 Job 调度
- [ ] 测试状态同步
  - [ ] 手动修改 Job 状态
  - [ ] 验证定时同步修复状态

### 6.3 性能测试

- [ ] 测试并发任务执行
  - [ ] 创建 10 个任务同时执行
  - [ ] 验证执行正确性
  - [ ] 记录执行耗时
- [ ] 测试日志写入性能
  - [ ] 测试双写日志的性能影响
  - [ ] 对比单写和双写的耗时差异

## 阶段七：文档和配置

### 7.1 配置文档

- [ ] 更新 `README.md`
  - [ ] 添加 Job 集成配置说明
  - [ ] 添加配置示例
  - [ ] 添加使用说明
- [ ] 创建 `application-example.yml`
  - [ ] 添加完整的配置示例
  - [ ] 添加配置项注释

### 7.2 代码注释

- [ ] 完善所有新增类的 JavaDoc
- [ ] 完善所有新增方法的注释
- [ ] 添加关键逻辑的行内注释

### 7.3 变更日志

- [ ] 更新 `CHANGELOG.md`
  - [ ] 记录新增功能
  - [ ] 记录配置变更
  - [ ] 记录兼容性说明

## 阶段八：部署准备

### 8.1 配置检查

- [ ] 检查默认配置是否合理
- [ ] 检查配置项是否完整
- [ ] 检查配置文档是否清晰

### 8.2 兼容性验证

- [ ] 验证不启用 Job 集成时功能正常
- [ ] 验证启用 Job 集成时功能正常
- [ ] 验证配置切换时无异常

### 8.3 回滚方案

- [ ] 准备配置回滚方案
- [ ] 准备数据回滚方案（如有必要）
- [ ] 文档化回滚步骤
