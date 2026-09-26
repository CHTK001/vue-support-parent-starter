/**
 * 定时任务模块类型定义
 *
 * 视图模型对齐后端 ApiCronController 的 /api/cron/jobs 契约：
 * 后端字段为 snake_case（cron_job_id / execution_mode / metadata.agent_type ...），
 * snake_case ↔ camelCase 的转换集中在 services/modules/scheduler.api.ts 内完成，
 * 组件只消费本文件定义的视图模型。时间戳为后端返回的毫秒 epoch。
 */

/**
 * 调度描述（后端 schedule 对象）
 * kind=cron 使用 cron 表达式；kind=every 使用固定毫秒间隔
 */
export interface CronSchedule {
  kind: 'cron' | 'every'
  cron?: string | null
  every_ms?: number | null
  description?: string | null
}

/**
 * Cron 预设项（GET /api/cron/jobs/cron-presets，value 为六段 Spring cron 表达式）
 */
export interface CronPreset {
  label: string
  value: string
}

/**
 * 任务运行态（后端 state，只读：由 POST /{id}/run 与调度器写入）
 */
export interface ScheduledTaskState {
  nextRunAt: number | null
  lastRunAt: number | null
  lastStatus: string | null
  lastError: string | null
  runCount: number
  retryCount: number
  maxRetries: number
}

/**
 * 定时任务对象
 */
export interface ScheduledTask {
  /** 后端 cron_job_id */
  id: string
  name: string
  description: string | null
  /** 后端 message：触发时发给 AI 的提示词 */
  prompt: string
  enabled: boolean
  /** 后端 execution_mode */
  executionMode: string
  schedule: CronSchedule
  /** 后端 metadata.agent_type */
  agentType: string
  /** 后端 metadata.conversation_id（仅新建任务时可指定） */
  conversationId: string | null
  /** 后端 metadata.conversation_title */
  conversationTitle: string | null
  /** 后端 metadata.agent_config（provider_id / model） */
  agentConfig: { providerId?: string | null; model?: string | null } | null
  state: ScheduledTaskState
  /** 后端 metadata.created_at（毫秒 epoch） */
  createdAt: number | null
  /** 后端 metadata.updated_at（毫秒 epoch） */
  updatedAt: number | null
}

/**
 * 编辑表单提交给 api 模块的数据（api 模块再翻成后端 body 的 snake_case 键）
 */
export interface ScheduledTaskForm {
  name: string
  description?: string | null
  prompt: string
  schedule: CronSchedule
  enabled: boolean
  agentType?: string
  conversationId?: string | null
  agentConfig?: { providerId?: string | null; model?: string | null } | null
  maxRetries?: number
}

/**
 * 单次运行记录
 *
 * 后端 GET /api/cron/jobs/{cronJobId}/runs 目前是内存实现的空桩（恒返回空列表），
 * 这里只按契约声明字段，页面不得伪造数据填充。
 */
export interface ScheduledTaskRun {
  id: string
  status: string
  startedAt: number | null
  finishedAt: number | null
  error?: string | null
  conversationId?: string | null
}
