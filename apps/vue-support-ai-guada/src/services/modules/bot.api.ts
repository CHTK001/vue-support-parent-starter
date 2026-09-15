import type { ApiContext } from "./api-context";
import type { Session } from "@/types/session";
import type { PaginatedResponse } from "@/types/common";
import type {
  BotInstance,
  PlatformMetadata,
  CreateBotRequest,
  UpdateBotRequest,
} from "@/types/bot";

export interface BotApi {
  fetchBotPlatforms(): Promise<PlatformMetadata[]>;
  fetchBotInstances(): Promise<BotInstance[]>;
  fetchBotInstance(id: string): Promise<BotInstance>;
  createBotInstance(data: CreateBotRequest): Promise<BotInstance>;
  updateBotInstance(id: string, data: UpdateBotRequest): Promise<BotInstance>;
  startBotInstance(id: string): Promise<{ success: boolean }>;
  stopBotInstance(id: string): Promise<{ success: boolean }>;
  restartBotInstance(id: string): Promise<{ success: boolean }>;
  fetchBotQrCode(id: string): Promise<
    | { status: 'qr_ready'; qrCodeUrl: string }
    | { status: 'logged_in' | 'pending' | 'unavailable'; message: string }
  >;
  logoutBot(id: string): Promise<{ success: boolean; message: string }>;
  deleteBotInstance(id: string): Promise<{ success: boolean }>;
  fetchBotSessions(skip?: number, limit?: number, botId?: string): Promise<PaginatedResponse<Session>>;
}

export const botApi: BotApi = {
  async fetchBotPlatforms(this: ApiContext) {
    // 后端接口暂未提供，前端硬编码常用平台
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

  async fetchBotInstances(this: ApiContext) {
    return await this._request("/bot-admin/instances");
  },

  async fetchBotInstance(this: ApiContext, id: string) {
    return await this._request(`/bot-admin/instances/${id}`);
  },

  async createBotInstance(this: ApiContext, data: CreateBotRequest) {
    return await this._request("/bot-admin/instances", {
      method: "POST",
      data,
    });
  },

  async updateBotInstance(this: ApiContext, id: string, data: UpdateBotRequest) {
    return await this._request(`/bot-admin/instances/${id}`, {
      method: "PUT",
      data,
    });
  },

  async startBotInstance(this: ApiContext, id: string) {
    return await this._request(`/bot-admin/instances/${id}/start`, {
      method: "POST",
    });
  },

  async stopBotInstance(this: ApiContext, id: string) {
    return await this._request(`/bot-admin/instances/${id}/stop`, {
      method: "POST",
    });
  },

  async restartBotInstance(this: ApiContext, id: string) {
    return await this._request(`/bot-admin/instances/${id}/restart`, {
      method: "POST",
    });
  },

  async fetchBotQrCode(this: ApiContext, id: string) {
    return await this._request(`/bot-admin/instances/${id}/qr`);
  },

  async logoutBot(this: ApiContext, id: string) {
    return await this._request(`/bot-admin/instances/${id}/logout`, {
      method: 'POST',
    });
  },

  async deleteBotInstance(this: ApiContext, id: string) {
    return await this._request(`/bot-admin/instances/${id}`, {
      method: "DELETE",
    });
  },

  async fetchBotSessions(this: ApiContext, skip?: number, limit?: number, botId?: string) {
    const params = new URLSearchParams();
    if (skip !== undefined) params.append("skip", skip.toString());
    if (limit !== undefined) params.append("limit", limit.toString());
    if (botId) params.append("botId", botId);

    const queryString = params.toString();
    const url = queryString
      ? `/bot-admin/sessions?${queryString}`
      : "/bot-admin/sessions";

    return await this._request(url);
  },
};
