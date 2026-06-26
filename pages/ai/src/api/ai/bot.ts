import { http, type ReturnResult } from "@repo/utils";

export interface BotAccount {
  id?: number;
  userId: string;
  username?: string;
  nickname?: string;
  avatarUrl?: string;
  platform?: string;
  aiEnabled?: boolean;
  aiModel?: string;
  aiSystemPrompt?: string;
  qrcodeBase64?: string;
  qrcodeExpireTime?: string;
  extra?: string;
  createTime?: string;
  updateTime?: string;
}

export interface BotAccountPage {
  records: BotAccount[];
  total: number;
  size: number;
  current: number;
  pages: number;
}

export const listBotAccounts = async (
  page: number = 1,
  size: number = 10,
  platform?: string,
  aiEnabled?: boolean,
) => {
  return http.request<ReturnResult<BotAccountPage>>("get", "/v2/ai/bot/list", {
    params: { page, size, platform, aiEnabled },
  });
};

export const saveBotAccount = async (data: BotAccount) => {
  return http.request<ReturnResult<BotAccount>>("post", "/v2/ai/bot/save", {
    data,
  });
};

export const updateBotAccount = async (data: BotAccount) => {
  return http.request<ReturnResult<BotAccount>>("put", "/v2/ai/bot/update", {
    data,
  });
};

export const deleteBotAccount = async (id: number) => {
  return http.request<ReturnResult<boolean>>("delete", "/v2/ai/bot/delete", {
    params: { id },
  });
};

export const toggleBotAi = async (id: number, enabled: boolean) => {
  return http.request<ReturnResult<BotAccount>>("put", "/v2/ai/bot/toggle-ai", {
    params: { id, enabled },
  });
};

export const updateBotAiConfig = async (
  id: number,
  aiModel?: string,
  aiSystemPrompt?: string,
) => {
  return http.request<ReturnResult<BotAccount>>(
    "put",
    "/v2/ai/bot/update-ai-config",
    {
      params: { id, aiModel, aiSystemPrompt },
    },
  );
};