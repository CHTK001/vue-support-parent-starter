import { createClient, rootHttp } from '@/framework/context';
import type {
  CronPreset,
  ScheduledTask,
  ScheduledTaskForm,
  ScheduledTaskRun,
  ScheduledTaskState,
  CronSchedule,
} from "@/types/scheduler";

/** /api/** 管理接口客户端：不解包，返回值与后端统一响应体 {success,data,code,error} 一致 */
const rawApi = createClient(rootHttp, { unwrap: false });

/**
 * ApiResult 信封取值。
 *
 * 失败响应后端返回非 2xx（AiApiExceptionAdvice 保留 HTTP 状态），框架拦截器已抛出；
 * 这里再兜一层 success=false 的情况，把后端的 error 文案交给页面的 catch 分支提示。
 */
function takeData<T>(body: any): T | null {
  if (body && body.success === false) {
    throw new Error(body.error || body.msg || "请求失败");
  }
  return (body?.data ?? null) as T | null;
}

/** 毫秒时间戳：后端 created_at / *_at_ms 为 epoch millis，缺省保持 null */
function ms(value: any): number | null {
  if (value === null || value === undefined || value === "") return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

/** 后端 job（snake_case）→ 视图模型（camelCase） */
function toTask(job: any): ScheduledTask {
  const metadata = (job?.metadata ?? {}) as any;
  const state = (job?.state ?? {}) as any;
  const schedule = (job?.schedule ?? {}) as any;
  const agentConfig = (metadata.agent_config ?? null) as any;
  return {
    id: job?.cron_job_id ?? "",
    name: job?.name ?? "",
    description: job?.description ?? null,
    prompt: job?.message ?? "",
    enabled: job?.enabled !== false,
    executionMode: job?.execution_mode ?? "",
    schedule: {
      kind: schedule.kind === "every" ? "every" : "cron",
      cron: schedule.cron ?? null,
      every_ms: ms(schedule.every_ms),
      description: schedule.description ?? null,
    },
    agentType: metadata.agent_type ?? "",
    conversationId: metadata.conversation_id ?? null,
    conversationTitle: metadata.conversation_title ?? null,
    agentConfig: agentConfig
      ? { providerId: agentConfig.provider_id ?? null, model: agentConfig.model ?? null }
      : null,
    state: {
      nextRunAt: ms(state.next_run_at_ms),
      lastRunAt: ms(state.last_run_at_ms),
      lastStatus: state.last_status ?? null,
      lastError: state.last_error ?? null,
      runCount: Number(state.run_count ?? 0),
      retryCount: Number(state.retry_count ?? 0),
      maxRetries: Number(state.max_retries ?? 0),
    } as ScheduledTaskState,
    createdAt: ms(metadata.created_at),
    updatedAt: ms(metadata.updated_at),
  };
}

/**
 * 视图表单 → 后端 job body（snake_case；仅提交后端实际读取的键）
 *
 * createOnly=true 时追加 execution_mode / agent_type / conversation_id：
 * 这三个键只有 POST 会写入，PUT 后端不读，更新时提交会造成「改了但没生效」的假象。
 */
function toJobBody(data: Partial<ScheduledTaskForm>, createOnly = false): Record<string, unknown> {
  const body: Record<string, unknown> = {};
  if (data.name !== undefined) body.name = data.name;
  if (data.description !== undefined) body.description = data.description;
  if (data.prompt !== undefined) body.message = data.prompt;
  if (data.enabled !== undefined) body.enabled = data.enabled;
  if (data.maxRetries !== undefined) body.max_retries = data.maxRetries;
  if (data.schedule) {
    const schedule: CronSchedule = data.schedule;
    body.schedule =
      schedule.kind === "every"
        ? { kind: "every", every_ms: schedule.every_ms ?? null, description: schedule.description ?? null }
        : { kind: "cron", cron: schedule.cron ?? null, description: schedule.description ?? null };
  }
  // undefined = 不提交该键（保留后端原值）；null = 显式清空
  if (data.agentConfig !== undefined) {
    body.agent_config = data.agentConfig
      ? { provider_id: data.agentConfig.providerId ?? null, model: data.agentConfig.model ?? null }
      : null;
  }
  // execution_mode / agent_type / conversation_id 只有 POST 才写入，PUT 后端会忽略
  if (createOnly) {
    if (data.agentType !== undefined) body.agent_type = data.agentType;
    if (data.conversationId !== undefined) {
      body.conversation_id = data.conversationId;
      body.execution_mode = data.conversationId ? "existing_conversation" : "new_conversation";
    }
  }
  return body;
}

/** 后端 run 记录 → 视图模型（后端目前恒返回空列表，字段按契约兼容读取） */
function toRun(run: any): ScheduledTaskRun {
  return {
    id: String(run?.run_id ?? run?.id ?? ""),
    status: run?.status ?? "",
    startedAt: ms(run?.started_at_ms ?? run?.created_at),
    finishedAt: ms(run?.finished_at_ms),
    error: run?.error ?? null,
    conversationId: run?.conversation_id ?? null,
  };
}

export interface SchedulerApi {
  fetchScheduledTasks(conversationId?: string): Promise<ScheduledTask[]>;
  fetchScheduledTask(taskId: string): Promise<ScheduledTask | null>;
  createScheduledTask(data: ScheduledTaskForm): Promise<ScheduledTask>;
  updateScheduledTask(taskId: string, data: Partial<ScheduledTaskForm>): Promise<ScheduledTask>;
  deleteScheduledTask(taskId: string): Promise<void>;
  runScheduledTask(taskId: string): Promise<{ conversationId: string }>;
  fetchScheduledTaskRuns(taskId: string): Promise<ScheduledTaskRun[]>;
  fetchCronPresets(): Promise<CronPreset[]>;
}

export const schedulerApi: SchedulerApi = {
  // GET /api/cron/jobs?conversation_id= —— 定时任务列表（可按 metadata.conversation_id 过滤）
  async fetchScheduledTasks(conversationId?: string) {
    const body = await rawApi.get("/api/cron/jobs", {
      params: conversationId ? { conversation_id: conversationId } : undefined,
    });
    return (takeData<any[]>(body) ?? []).map(toTask);
  },

  // GET /api/cron/jobs/{cronJobId} —— 单个定时任务（任务不存在时后端返回 NOT_FOUND）
  async fetchScheduledTask(taskId: string) {
    const body = await rawApi.get(`/api/cron/jobs/${encodeURIComponent(taskId)}`);
    const job = takeData<any>(body);
    return job ? toTask(job) : null;
  },

  // POST /api/cron/jobs —— 新建任务（name/description/enabled/schedule/message/execution_mode/agent_type/conversation_id/agent_config/max_retries）
  async createScheduledTask(data: ScheduledTaskForm) {
    const body = await rawApi.post("/api/cron/jobs", toJobBody(data, true));
    return toTask(takeData<any>(body));
  },

  // PUT /api/cron/jobs/{cronJobId} —— 更新任务（后端只接受 name/description/enabled/schedule/message/agent_config/conversation_title/max_retries）
  async updateScheduledTask(taskId: string, data: Partial<ScheduledTaskForm>) {
    const body = await rawApi.put(`/api/cron/jobs/${encodeURIComponent(taskId)}`, toJobBody(data));
    return toTask(takeData<any>(body));
  },

  // DELETE /api/cron/jobs/{cronJobId} —— 删除任务（无响应体数据）
  async deleteScheduledTask(taskId: string) {
    const body = await rawApi.delete(`/api/cron/jobs/${encodeURIComponent(taskId)}`);
    takeData(body);
  },

  // POST /api/cron/jobs/{cronJobId}/run —— 立即执行一次，返回新建的 conversation_id
  async runScheduledTask(taskId: string) {
    const body = await rawApi.post(`/api/cron/jobs/${encodeURIComponent(taskId)}/run`);
    const data = takeData<{ conversation_id?: string }>(body) ?? {};
    return { conversationId: data.conversation_id ?? "" };
  },

  // GET /api/cron/jobs/{cronJobId}/runs —— 运行记录（后端为内存桩实现，当前恒返回空列表）
  async fetchScheduledTaskRuns(taskId: string) {
    const body = await rawApi.get(`/api/cron/jobs/${encodeURIComponent(taskId)}/runs`);
    return (takeData<any[]>(body) ?? []).map(toRun);
  },

  // GET /api/cron/jobs/cron-presets —— 常用调度预设目录（{label,value}，value 为六段 cron 表达式）
  async fetchCronPresets() {
    const body = await rawApi.get("/api/cron/jobs/cron-presets");
    const list = takeData<CronPreset[]>(body) ?? [];
    return list.map((item) => ({ label: item.label, value: item.value }));
  },
};
