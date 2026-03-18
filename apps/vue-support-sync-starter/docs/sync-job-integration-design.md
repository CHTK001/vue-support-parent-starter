# 数据同步系统整合 Job 调度模块 - 设计文档

## 架构设计

### 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                    MonitorSyncTaskService                    │
│  (任务管理：创建、启动、停止、删除)                          │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              MonitorSyncTaskExecutor                         │
│  (任务执行器：管理 SyncFlow 生命周期)                       │
└────────────┬────────────────────────────────┬───────────────┘
             │                                │
             │ (配置开关)                     │
             ▼                                ▼
┌────────────────────────┐      ┌────────────────────────────┐
│  Job 系统调度          │      │  原有 ThreadPool 调度      │
│  - SysJob 记录         │      │  - ThreadPoolTaskScheduler │
│  - JobHandler 执行     │      │  - CronTrigger             │
│  - 统一日志/监控       │      │  - ScheduledFuture         │
└────────────────────────┘      └────────────────────────────┘
```

### 核心组件

#### 1. SyncTaskJobHandler

- **职责**：将同步任务包装为 JobHandler，供 Job 系统调度
- **接口**：实现 `JobHandler` 接口
- **方法**：
  - `execute(TriggerParam param)`: 执行同步任务
  - 从参数中获取 taskId，调用 `MonitorSyncTaskExecutor.executeOnce()`

#### 2. SyncJobIntegrationService

- **职责**：管理 SyncTask 和 SysJob 的映射关系
- **方法**：
  - `createOrUpdateJob(MonitorSyncTask task)`: 创建/更新 Job 记录
  - `startJob(Long taskId)`: 启动 Job
  - `stopJob(Long taskId)`: 停止 Job
  - `deleteJob(Long taskId)`: 删除 Job
  - `syncTaskStatus(Long taskId)`: 同步任务状态

#### 3. SyncTaskLogAdapter

- **职责**：适配同步任务日志到 Job 日志
- **方法**：
  - `createJobLog(MonitorSyncTaskLog syncLog)`: 创建 Job 日志记录
  - `updateJobLog(MonitorSyncTaskLog syncLog)`: 更新 Job 日志
  - `syncLogStatus(Long syncLogId, Long jobLogId)`: 同步日志状态

## 数据模型

### 映射关系

```
MonitorSyncTask (1) ←→ (1) SysJob
- sync_task_id ←→ job_execute_param (JSON: {"taskId": xxx})
- sync_task_name ←→ job_name
- sync_task_cron ←→ job_schedule_time (when job_schedule_type=cron)
- sync_task_sync_interval ←→ job_schedule_time (when job_schedule_type=fixed)
- sync_task_status ←→ job_trigger_status

MonitorSyncTaskLog (1) ←→ (1) SysJobLog
- sync_log_id ←→ 扩展字段存储
- sync_task_id ←→ job_id
- sync_log_status ←→ job_log_status
- sync_log_start_time ←→ job_log_trigger_time
- sync_log_cost ←→ job_log_handle_time
```

### 配置属性

```yaml
plugin:
  sync:
    job-integration:
      enabled: true # 是否启用 Job 集成
      sync-status: true # 是否同步状态
      dual-log: true # 是否双写日志
      job-name-prefix: "SYNC_TASK_" # Job 名称前缀
```

## 核心流程

### 1. 任务启动流程

```
用户调用 startTask(taskId)
    ↓
MonitorSyncTaskServiceImpl.startTask()
    ↓
判断 job-integration.enabled
    ↓
[启用] → SyncJobIntegrationService.createOrUpdateJob()
    ↓
创建/更新 SysJob 记录
    - job_name: SYNC_TASK_{taskId}_{taskName}
    - job_schedule_type: cron/fixed
    - job_schedule_time: cron表达式/间隔毫秒
    - job_execute_bean: syncTaskJobHandler
    - job_execute_param: {"taskId": xxx}
    - job_trigger_status: 1 (启用)
    ↓
Job 系统自动调度
    ↓
SyncTaskJobHandler.execute()
    ↓
MonitorSyncTaskExecutor.executeOnce(taskId)
    ↓
执行同步任务
    ↓
SyncTaskLogAdapter.createJobLog() (双写日志)
```

### 2. 任务停止流程

```
用户调用 stopTask(taskId)
    ↓
MonitorSyncTaskServiceImpl.stopTask()
    ↓
判断 job-integration.enabled
    ↓
[启用] → SyncJobIntegrationService.stopJob()
    ↓
更新 SysJob.job_trigger_status = 0
    ↓
Job 系统停止调度
    ↓
MonitorSyncTaskExecutor.stop(taskId)
    ↓
清理 SyncFlow 资源
```

### 3. 日志记录流程

```
任务执行开始
    ↓
创建 MonitorSyncTaskLog (status=RUNNING)
    ↓
[dual-log=true] → SyncTaskLogAdapter.createJobLog()
    ↓
创建 SysJobLog (status=RUNNING)
    ↓
执行同步逻辑
    ↓
更新 MonitorSyncTaskLog (统计信息)
    ↓
[dual-log=true] → SyncTaskLogAdapter.updateJobLog()
    ↓
更新 SysJobLog (基本信息)
```

## 接口设计

### SyncTaskJobHandler

```java
@Component("syncTaskJobHandler")
public class SyncTaskJobHandler implements JobHandler {

    @Autowired
    private MonitorSyncTaskExecutor taskExecutor;

    @Autowired
    private SyncTaskLogAdapter logAdapter;

    @Override
    public void execute(TriggerParam param) throws Exception {
        // 1. 解析参数获取 taskId
        Long taskId = parseTaskId(param.getExecuteParam());

        // 2. 执行同步任务
        Long syncLogId = taskExecutor.executeOnce(taskId);

        // 3. 适配日志到 Job 系统
        if (syncLogId != null) {
            logAdapter.syncLogToJob(syncLogId, param.getLogId());
        }
    }
}
```

### SyncJobIntegrationService

```java
public interface SyncJobIntegrationService {

    /**
     * 创建或更新 Job 记录
     */
    ReturnResult<Integer> createOrUpdateJob(MonitorSyncTask task);

    /**
     * 启动 Job
     */
    ReturnResult<Boolean> startJob(Long taskId);

    /**
     * 停止 Job
     */
    ReturnResult<Boolean> stopJob(Long taskId);

    /**
     * 删除 Job
     */
    ReturnResult<Boolean> deleteJob(Long taskId);

    /**
     * 同步任务状态
     */
    ReturnResult<Boolean> syncTaskStatus(Long taskId);

    /**
     * 获取 Job ID
     */
    Integer getJobId(Long taskId);
}
```

### SyncTaskLogAdapter

```java
public interface SyncTaskLogAdapter {

    /**
     * 创建 Job 日志
     */
    Long createJobLog(MonitorSyncTaskLog syncLog);

    /**
     * 更新 Job 日志
     */
    void updateJobLog(MonitorSyncTaskLog syncLog);

    /**
     * 同步日志到 Job 系统
     */
    void syncLogToJob(Long syncLogId, Integer jobLogId);
}
```

## 配置管理

### SyncJobIntegrationProperties

```java
@Data
@ConfigurationProperties(prefix = "plugin.sync.job-integration")
public class SyncJobIntegrationProperties {

    /**
     * 是否启用 Job 集成
     */
    private boolean enabled = false;

    /**
     * 是否同步状态
     */
    private boolean syncStatus = true;

    /**
     * 是否双写日志
     */
    private boolean dualLog = true;

    /**
     * Job 名称前缀
     */
    private String jobNamePrefix = "SYNC_TASK_";

    /**
     * 失败重试次数（使用 Job 系统配置）
     */
    private boolean useJobRetry = true;
}
```

## 异常处理

### 1. Job 系统不可用

- 降级到原有 ThreadPool 调度
- 记录警告日志
- 不影响同步任务执行

### 2. 状态不一致

- 定时任务检查状态一致性
- 发现不一致时自动修复
- 记录修复日志

### 3. 日志写入失败

- Job 日志写入失败不影响 Sync 日志
- 异步重试机制
- 超过重试次数后记录错误日志

## 性能优化

1. **异步日志写入**：使用异步线程池写入 Job 日志
2. **批量状态同步**：定时批量同步状态，减少数据库访问
3. **缓存 Job ID 映射**：内存缓存 taskId → jobId 映射关系
4. **条件双写**：仅在必要时双写日志，减少写入开销

## 测试策略

### 单元测试

- SyncTaskJobHandler 执行逻辑
- SyncJobIntegrationService 各方法
- SyncTaskLogAdapter 日志适配

### 集成测试

- 任务启动/停止流程
- 日志记录完整性
- 状态同步准确性

### 性能测试

- 并发任务执行
- 日志写入性能
- 状态同步延迟
