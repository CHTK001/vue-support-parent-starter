import { createClient, v2Http } from "@/framework/context";
import type { ApiContext } from "./api-context";
import type { Session } from "@/types/session";
import type { PaginatedResponse } from "@/types/common";
import type {
  BotInstance,
  PlatformMetadata,
  CreateBotRequest,
  UpdateBotRequest,
} from "@/types/bot";

/** /ai/bot-binding 出口客户端：不解包，调用方自己读统一信封 {code,data,msg} 的 data */
const http = createClient(v2Http, { unwrap: false });

/** 控制器基路径：AiBotBindingController @RequestMapping("/v2/ai/bot-binding")，/v2 前缀由 v2Http 提供 */
const BASE = "/ai/bot-binding";

/** 扫码状态（GET /qrcode/status 的 status）翻译后的前端形态 */
export type QrCodeState =
  | { status: 'qr_ready'; qrCodeUrl: string }
  | { status: 'logged_in' | 'pending' | 'unavailable'; message: string };

export interface BotApi {
  fetchBotPlatforms(): Promise<PlatformMetadata[]>;
  fetchBotInstances(): Promise<BotInstance[]>;
  fetchBotInstance(id: string): Promise<BotInstance>;
  createBotInstance(data: CreateBotRequest): Promise<BotInstance>;
  updateBotInstance(id: string, data: UpdateBotRequest): Promise<BotInstance>;
  startBotInstance(id: string): Promise<{ success: boolean }>;
  stopBotInstance(id: string): Promise<{ success: boolean }>;
  restartBotInstance(id: string): Promise<{ success: boolean }>;
  fetchBotQrCode(id: string): Promise<QrCodeState>;
  logoutBot(id: string): Promise<{ success: boolean; message: string }>;
  deleteBotInstance(id: string): Promise<{ success: boolean }>;
  fetchBotSessions(skip?: number, limit?: number, botId?: string): Promise<PaginatedResponse<Session>>;
}

/** 统一信封 {code,data,msg}：业务失败已被框架拦截器抛出，这里只取 data */
function unwrapData(body: any): any {
  if (body && typeof body === "object" && "data" in body) return body.data;
  return body;
}

/** 出口 data 可能是 null（如 GET /{id} 未命中），统一按空数组处理 */
function asArray<T = any>(data: any): T[] {
  return Array.isArray(data) ? (data as T[]) : [];
}

/** 落库 status(online/offline/expired) → 前端 BotInstance.status */
function toBotStatus(status?: string | null): BotInstance["status"] {
  if (status === "online") return "running";
  if (status === "expired") return "error";
  return "stopped";
}

/** GET /runtime-status 的 running/stopped → 前端 runtimeStatus */
function toRuntimeStatus(status?: string | null): BotInstance["runtimeStatus"] {
  if (status === "running") return "CONNECTED";
  if (status === "stopped") return "DISCONNECTED";
  return null;
}

/**
 * BotBindingListResponse → 前端 BotInstance。
 * 后端无重连参数 / 默认角色 / 知识库 / lastStartedAt 等列，这些字段固定给空值。
 */
function toBotInstance(dto: any, runtime: BotInstance["runtimeStatus"] = null): BotInstance {
  const status = toBotStatus(dto?.status);
  return {
    id: String(dto?.id ?? ""),
    userId: String(dto?.userId ?? ""),
    platform: dto?.platform ?? "wechat",
    name: dto?.nickname ?? dto?.botId ?? "未命名机器人",
    enabled: status === "running",
    platformConfig: {
      botId: dto?.botId ?? "",
      gatewayPort: dto?.gatewayPort,
      avatarUrl: dto?.avatarUrl,
      bindSource: dto?.bindSource,
    },
    reconnectEnabled: true,
    maxRetries: 0,
    retryInterval: 0,
    defaultCharacterId: null,
    defaultModelId: dto?.model ?? null,
    defaultThinkingEffort: dto?.thinkingEffort ?? null,
    additionalKwargs: {},
    status,
    runtimeStatus: runtime,
    lastStartedAt: null,
    lastError: status === "error" ? "iLink 会话已过期，请重新扫码绑定" : null,
    createdAt: dto?.createTime ?? "",
    updatedAt: dto?.lastActiveTime ?? "",
  };
}

/**
 * 前端表单 → BotBindingCreateRequest 键名（后端只有 botId/botToken/platform/nickname/model/
 * thinkingEffort/systemPrompt/gatewayPort，其余键会被忽略）。
 * current 为回读到的原绑定：PUT /update 按 botId upsert，缺 botId 会插出新行。
 */
function toBindingRequest(
  data: CreateBotRequest | UpdateBotRequest,
  current?: any,
): Record<string, unknown> {
  const form = data as Partial<CreateBotRequest> &
    UpdateBotRequest & { thinking?: boolean; systemPrompt?: string };
  const cfg = (form.platformConfig ?? {}) as Record<string, any>;
  const req: Record<string, unknown> = {
    botId: cfg.botId ?? current?.botId,
    platform: form.platform ?? current?.platform ?? "wechat",
    nickname: form.name ?? current?.nickname,
    model: form.defaultModelId ?? current?.model,
    thinking: form.thinking ?? current?.thinking,
    thinkingEffort: form.defaultThinkingEffort ?? current?.thinkingEffort,
    systemPrompt: form.systemPrompt ?? current?.systemPrompt,
    gatewayPort: cfg.gatewayPort ?? current?.gatewayPort,
  };
  // 前端把平台凭证平铺在 platformConfig 下，后端只有单一 botToken 列
  const token =
    cfg.botToken ?? cfg.clientSecret ?? cfg.appSecret ?? cfg.token ?? cfg.secret;
  if (token) req.botToken = token;
  return req;
}

/** GET /{id} 回读单条绑定（create/update 出口只回数据库 id，返回值需二次读取） */
async function readInstance(id: string | number): Promise<BotInstance> {
  const dto = unwrapData(await http.get(`${BASE}/${encodeURIComponent(String(id))}`));
  if (!dto) {
    throw new Error(`绑定记录不存在：GET /v2${BASE}/{id} 返回空（id=${id}）`);
  }
  return toBotInstance(dto, await liveRuntimeStatus(dto.botId));
}

/** GET /runtime-status?botId= 取 iLink 会话存活态；失败不阻断列表，按未知处理 */
async function liveRuntimeStatus(botId?: string | null): Promise<BotInstance["runtimeStatus"]> {
  if (!botId) return null;
  try {
    const body = await http.get(`${BASE}/runtime-status`, { params: { botId } });
    return toRuntimeStatus(unwrapData(body)?.status);
  } catch {
    return null;
  }
}

/** 扫码会话 key（POST /qrcode 只在建会话时返回，轮询必须带 key）：按前端 bot id 缓存 */
const qrSessions = new Map<string, string>();

/** 后端 status(pending/ready/scanned/confirmed/expired/error) → 前端二维码弹窗形态 */
function toQrState(st: any): QrCodeState {
  const url = st?.qrcodeUrl;
  if (st?.status === "ready" && url) return { status: "qr_ready", qrCodeUrl: url };
  if (st?.status === "confirmed") return { status: "logged_in", message: "扫码已确认，绑定已完成" };
  if (st?.status === "scanned") return { status: "pending", message: "已扫码，请在手机上确认" };
  if (st?.status === "pending" || st?.status === "ready") {
    return { status: "pending", message: "等待扫码" };
  }
  if (st?.status === "expired") return { status: "unavailable", message: "二维码已过期，请重新获取" };
  return { status: "unavailable", message: "扫码会话不可用，请重试" };
}

/** BotConversation → 前端 Session（bot 会话无独立主键，id 用 botId:fromUser 复合） */
function toBotSession(row: any, instanceIds: Map<string, string>): Session {
  return {
    id: `${row?.botId ?? ""}:${row?.fromUser ?? ""}`,
    title: row?.nickname ?? row?.fromUser ?? "",
    character: undefined as any,
    characterId: "",
    modelId: "",
    userId: "",
    settings: {},
    createdAt: row?.lastTime ?? "",
    updatedAt: row?.lastTime ?? "",
    lastActiveAt: row?.lastTime ?? "",
    sessionType: "bot",
    // 页面按 Bot 实例 id 关联筛选与取名，这里换算成实例 id，映射缺失时退回 bot 唯一标识
    botId: instanceIds.get(String(row?.botId)) ?? row?.botId,
    platform: row?.platform,
    externalId: `${row?.platform ?? "wechat"}:dm:${row?.fromUser ?? ""}`,
  };
}

/** bot 唯一标识 → 绑定记录数据库 id（/conversations 不返回实例 id，需借 /list 换算） */
async function botIdToInstanceId(): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  try {
    const body = await http.get(`${BASE}/list`);
    for (const row of asArray(unwrapData(body))) {
      if (row?.botId != null) map.set(String(row.botId), String(row.id ?? ""));
    }
  } catch {
    // 映射失败只影响 bot 名称回显，不阻断会话列表
  }
  return map;
}

export const botApi: BotApi = {
  // 后端无平台目录出口（AiBotBindingController 未提供 /v2/ai/bot-binding/platforms），前端硬编码常用平台；
  // 服务端目前只认 wechat / wecom（扫码）与 feishu（POST /feishu 凭据绑定）
  async fetchBotPlatforms(this: ApiContext) {
    return [
      {
        platform: "qq",
        displayName: "QQ",
        description: "QQ机器人，支持群聊和私聊",
        fields: [
          { key: "appId", label: "App ID", type: "text", required: true, placeholder: "请输入QQ机器人AppID" },
          { key: "clientSecret", label: "Client Secret", type: "password", required: true, placeholder: "请输入ClientSecret" },
        ],
      },
      {
        platform: "wechat",
        displayName: "微信",
        description: "微信公众号/个人微信机器人",
        fields: [
          { key: "appId", label: "App ID", type: "text", required: true },
          { key: "appSecret", label: "App Secret", type: "password", required: true },
          { key: "token", label: "Token", type: "text", required: false },
        ],
      },
      {
        platform: "discord",
        displayName: "Discord",
        description: "Discord机器人",
        fields: [
          { key: "token", label: "Bot Token", type: "password", required: true, placeholder: "请输入Discord Bot Token" },
        ],
      },
      {
        platform: "telegram",
        displayName: "Telegram",
        description: "Telegram Bot",
        fields: [
          { key: "botToken", label: "Bot Token", type: "password", required: true, placeholder: "请输入Bot Father提供的Token" },
        ],
      },
      {
        platform: "webhook",
        displayName: "Webhook",
        description: "通用Webhook接入",
        fields: [
          { key: "webhookUrl", label: "Webhook URL", type: "text", required: true, placeholder: "https://example.com/webhook" },
          { key: "secret", label: "签名密钥", type: "password", required: false },
        ],
      },
    ];
  },

  // GET /v2/ai/bot-binding/list（越权过滤由后端按身份处理）+ 逐条 GET /runtime-status 补实时态
  async fetchBotInstances(this: ApiContext) {
    const body = await http.get(`${BASE}/list`);
    const rows = asArray(unwrapData(body));
    return await Promise.all(
      rows.map(async (row) => toBotInstance(row, await liveRuntimeStatus(row?.botId))),
    );
  },

  // GET /v2/ai/bot-binding/{id}（id 为数据库主键）
  async fetchBotInstance(this: ApiContext, id: string) {
    return await readInstance(id);
  },

  // POST /v2/ai/bot-binding/create（回数据库 id，再走 GET /{id} 组装返回值）
  async createBotInstance(this: ApiContext, data: CreateBotRequest) {
    const payload = { ...toBindingRequest(data), bindSource: "manual_import" };
    const created = unwrapData(await http.post(`${BASE}/create`, payload));
    if (created === null || created === undefined) {
      throw new Error("POST /v2/ai/bot-binding/create 未返回绑定 id，无法回读详情");
    }
    return await readInstance(created);
  },

  // PUT /v2/ai/bot-binding/update（按 botId upsert，请求体无 id 字段，故先 GET /{id} 取 botId）
  async updateBotInstance(this: ApiContext, id: string, data: UpdateBotRequest) {
    const current = unwrapData(await http.get(`${BASE}/${encodeURIComponent(id)}`));
    if (!current) {
      throw new Error(`待更新的绑定不存在：GET /v2${BASE}/${id}`);
    }
    await http.put(`${BASE}/update`, toBindingRequest(data, current));
    return await readInstance(current.id ?? id);
  },

  // 无对应出口：AiBotBindingController 未提供 POST /v2/ai/bot-binding/{id}/start
  async startBotInstance(this: ApiContext, id: string) {
    throw new Error(
      `启动机器人不可用：后端缺少出口 POST /v2/ai/bot-binding/{id}/start（id=${id}），` +
        `微信 bot 仅在后端把绑定 status 置为 online 时由聊天引擎自动拉起`,
    );
  },

  // 无对应出口：AiBotBindingController 未提供 POST /v2/ai/bot-binding/{id}/stop
  async stopBotInstance(this: ApiContext, id: string) {
    throw new Error(
      `停止机器人不可用：后端缺少出口 POST /v2/ai/bot-binding/{id}/stop（id=${id}），` +
        `AiBotBindingService.updateStatus 只由内部同步任务调用，未对前端开放`,
    );
  },

  // 无对应出口：AiBotBindingController 未提供 POST /v2/ai/bot-binding/{id}/restart
  async restartBotInstance(this: ApiContext, id: string) {
    throw new Error(
      `重启机器人不可用：后端缺少出口 POST /v2/ai/bot-binding/{id}/restart（id=${id}）`,
    );
  },

  // POST /v2/ai/bot-binding/qrcode?platform=&botId= 建会话 + GET /qrcode/status?key= 轮询
  // （调用方每 5s 重复调用本方法，故首次建会话、后续只轮询状态）
  async fetchBotQrCode(this: ApiContext, id: string) {
    const cachedKey = qrSessions.get(id);
    if (cachedKey) {
      const st = unwrapData(
        await http.get(`${BASE}/qrcode/status`, { params: { key: cachedKey } }),
      );
      const state = toQrState(st);
      // 过期/出错后会话已失效，丢弃 key 让下次调用重新发起扫码
      if (state.status === "unavailable") qrSessions.delete(id);
      return state;
    }

    const binding = unwrapData(await http.get(`${BASE}/${encodeURIComponent(id)}`));
    const platform = binding?.platform === "wecom" ? "wecom" : "wechat";
    const qr = unwrapData(
      await http.post(`${BASE}/qrcode`, null, {
        params: { platform, botId: binding?.botId ?? undefined },
      }),
    );
    if (!qr?.key) {
      return { status: "unavailable", message: "后端未返回扫码会话 key（wecom 不支持扫码）" };
    }
    qrSessions.set(id, qr.key);
    // 后端同步等待二维码生成（最长 8s），可能已直接带回 qrcodeUrl
    return qr.qrcodeUrl
      ? { status: "qr_ready", qrCodeUrl: qr.qrcodeUrl }
      : { status: "pending", message: "二维码生成中，请稍候" };
  },

  // 无对应出口：AiBotBindingController 未提供 logout，登出只能删除绑定 DELETE /v2/ai/bot-binding/{id}
  async logoutBot(this: ApiContext, id: string) {
    throw new Error(
      `退出登录不可用：后端缺少出口 POST /v2/ai/bot-binding/{id}/logout（id=${id}），` +
        `如需解绑请改用删除绑定`,
    );
  },

  // DELETE /v2/ai/bot-binding/{id}（后端 data 为 null，成功与否由信封 code 决定）
  async deleteBotInstance(this: ApiContext, id: string) {
    await http.delete(`${BASE}/${encodeURIComponent(id)}`);
    return { success: true };
  },

  // GET /v2/ai/bot-binding/conversations（一次性全量，无服务端分页/botId 过滤，故前端过滤切片）
  // 入参 botId 是绑定实例 id，会话行只有 bot 唯一标识，先经 /list 换算再过滤
  async fetchBotSessions(this: ApiContext, skip?: number, limit?: number, botId?: string) {
    const body = await http.get(`${BASE}/conversations`);
    const instanceIds = await botIdToInstanceId();
    const all = asArray(unwrapData(body))
      .filter((row) => {
        if (!botId) return true;
        return (instanceIds.get(String(row?.botId)) ?? String(row?.botId)) === String(botId);
      })
      .map((row) => toBotSession(row, instanceIds));

    const from = skip && skip > 0 ? skip : 0;
    const size = limit && limit > 0 ? limit : 20;
    const items = all.slice(from, from + size);
    return {
      items,
      total: all.length,
      page: Math.floor(from / size) + 1,
      pageSize: size,
      hasNext: from + size < all.length,
      hasPrev: from > 0,
    };
  },
};
