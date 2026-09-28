/**
 * API 客户端服务
 * 提供完整的后端 API 接口调用
 *
 * 领域方法按模块拆分到 services/modules/*.api.ts，
 * 通过 Object.assign 挂载到原型，通过 interface 声明合并保证类型安全。
 *
 * 请求出口统一为 @/framework/context 的请求模块客户端（底层是 @repo/utils 的 Http
 * + @repo/core createApp 注入的拦截器）：Bearer 头、统一响应校验、401/403 处理
 * 全部由框架负责，本文件不再持有 axios 实例、也不再读写 localStorage 里的 token。
 */

import type { StreamEvent } from "@/types/service";
import { getClientId } from "@/utils/clientId";
import { NetworkError, AuthError, ApiError } from "@/utils/errors";
import { t } from "@/locales";
import { createClient, httpAt } from "@/framework/context";
import type { HttpClient, RequestOptions } from "@/framework/context";
import { ChatStreamService } from "./modules/ChatStreamService";
import {
  WorkspaceWatcherService,
  type FileChangeEvent,
} from "./modules/WorkspaceWatcherService";
import {
  SessionEventsService,
  type SessionEvent,
  type SessionEventType,
} from "./modules/SessionEventsService";
import { createMockMethods, shouldEnableMock } from "./mock/MockApiService";

// 领域 API 模块
import { modelApi, type ModelApi } from "./modules/model.api";
import { characterApi, type CharacterApi } from "./modules/character.api";
import { sessionApi, type SessionApi } from "./modules/session.api";
import { workspaceApi, type WorkspaceApi } from "./modules/workspace.api";
import { messageApi, type MessageApi } from "./modules/message.api";
import { fileUploadApi, type FileUploadApi } from "./modules/file-upload.api";
import { authApi, type AuthApi } from "./modules/auth.api";
import { settingsApi, type SettingsApi } from "./modules/settings.api";
import { mcpApi, type McpApi } from "./modules/mcp.api";
import { skillsApi, type SkillsApi } from "./modules/skills.api";
import { knowledgeBaseApi, type KnowledgeBaseApi } from "./modules/knowledge-base.api";
import { botApi, type BotApi } from "./modules/bot.api";
import { schedulerApi, type SchedulerApi } from "./modules/scheduler.api";
import { pluginApi, type PluginApi } from "./modules/plugin.api";
import { remoteWorkspaceApi, type RemoteWorkspaceApi } from "./modules/remote-workspace.api";
import { tavernApi, type TavernApi } from "./modules/tavern.api";
import { generateApi, type GenerateApi } from "./modules/generate.api";
import { inputApi, type InputApi } from "./modules/input.api";
import { faceApi, type FaceApi } from "./modules/face.api";

export type { FileChangeEvent };
export type { SessionEvent, SessionEventType };

/**
 * 通过 interface 声明合并，让 ApiService 类型包含所有领域方法。
 */
interface ApiService
  extends ModelApi,
    CharacterApi,
    SessionApi,
    WorkspaceApi,
    MessageApi,
    FileUploadApi,
    AuthApi,
    SettingsApi,
    McpApi,
    SkillsApi,
    KnowledgeBaseApi,
    BotApi,
    SchedulerApi,
    PluginApi,
    RemoteWorkspaceApi,
    TavernApi,
    GenerateApi,
    FaceApi,
    InputApi {}

/**
 * 框架请求管线错误 → 本项目错误类型。
 *
 * 401/403 的清理令牌与跳登录由 @repo/core 的 http 拦截器统一负责，
 * 这里只做类型归一化，不再重复触发登录重定向。
 */
function normalizeApiError(error: any): Error {
  const status: number | undefined = error?.response?.status ?? error?.status;

  if (status === undefined && !error?.response) {
    return new NetworkError(t("session.api.cannotConnect"));
  }
  if (status === 401) {
    return new AuthError("Authentication required", 401);
  }

  const data = error?.response?.data ?? error;
  const rawMessage =
    data?.msg ||
    data?.message ||
    (typeof data?.error === "string" ? data.error : data?.error?.message);
  const errorMessage =
    typeof rawMessage === "string" && rawMessage ? rawMessage : t("session.api.requestFailed");

  return new ApiError(errorMessage, status);
}

class ApiService {
  baseURL: string;
  /** axios 风格请求客户端（内部挂在框架 http 实例上） */
  client: HttpClient;
  chatStreamService: ChatStreamService;
  workspaceWatcherService: WorkspaceWatcherService;
  sessionEventsService: SessionEventsService;
  /** Electron 环境下后端地址是否已初始化（幂等标记） */
  private backendUrlInitialized = false;
  /** 惰性持有的底层客户端：首次请求时框架上下文已装配完成 */
  private http: ReturnType<typeof httpAt> | null = null;

  constructor(baseURL?: string) {
    // Electron 环境使用动态获取的后端地址，Web 环境使用相对路径
    const isElectron =
      typeof window !== "undefined" && window.electronAPI !== undefined;

    if (baseURL) {
      this.baseURL = baseURL;
    } else if (isElectron) {
      this.baseURL = "http://localhost:8787/v2";
    } else {
      this.baseURL = "/v2";
    }

    this.client = createClient(() => this.httpClient());
    this.chatStreamService = new ChatStreamService(() => this.baseURL);
    this.workspaceWatcherService = new WorkspaceWatcherService(
      () => this.baseURL,
    );
    this.sessionEventsService = new SessionEventsService(() => this.baseURL);
  }

  /**
   * 首次使用时才创建客户端：apiService 在模块加载期即实例化，
   * 而框架请求管线要等 bootstrapFramework() 装配完才可用。
   */
  private httpClient() {
    if (!this.http) {
      this.http = httpAt(this.baseURL, { "X-Client-Id": getClientId() });
    }
    return this.http;
  }

  /**
   * 初始化后端地址（针对 Electron 环境）
   * @param knownPort 已同步获取到的后端端口；传入时直接同步设置 baseURL，避免异步 IPC 竞态
   */
  async initBackendUrl(knownPort?: number | null): Promise<void> {
    const isElectron =
      typeof window !== "undefined" && window.electronAPI !== undefined;
    if (isElectron && !this.baseURL.includes("localhost:3000")) {
      return;
    }

    // 刷新场景：端口已通过同步 IPC 拿到，直接设置，无需再走异步 getAppInfo()
    if (knownPort) {
      this.setBaseUrl(`http://localhost:${knownPort}/api/v1`);
      this.backendUrlInitialized = true;
      console.log(`🔗 API 服务已连接到后端端口: ${knownPort}`);
      return;
    }

    try {
      const info = await window.electronAPI!.getAppInfo();
      if (info.backendPort) {
        this.setBaseUrl(`http://localhost:${info.backendPort}/api/v1`);
        this.backendUrlInitialized = true;
        console.log(`🔗 API 服务已连接到后端端口: ${info.backendPort}`);
      }
    } catch (error) {
      console.error("❌ 获取后端端口失败:", error);
    }
  }

  /** 同步更新 baseURL 与已创建的客户端实例 */
  private setBaseUrl(url: string): void {
    this.baseURL = url;
    this.http?.setBaseURL(url);
  }

  /**
   * 确保后端地址已初始化（幂等）。
   * Electron 环境下任何请求发出前等待端口确定，避免抢在默认 localhost:3000 上
   */
  async ensureBackendUrlReady(): Promise<void> {
    if (this.backendUrlInitialized) return;
    const isElectron =
      typeof window !== "undefined" && window.electronAPI !== undefined;
    if (!isElectron) return;
    await this.initBackendUrl();
  }

  /**
   * 通用请求方法：走框架请求管线，返回已解包的业务数据。
   *
   * 框架拦截器对失败响应给出的是原始错误对象，这里按本项目既有约定归一化为
   * NetworkError / AuthError / ApiError，页面的 statusCode、isNetworkError 判断保持不变。
   */
  async _request<T = any>(
    endpoint: string,
    options?: RequestOptions,
  ): Promise<T> {
    // Electron 环境下确保后端地址已初始化，避免请求抢在端口就绪前发出
    await this.ensureBackendUrlReady();
    try {
      return (await this.client.request(endpoint, options)) as T;
    } catch (error: any) {
      console.error(`API 请求失败：${endpoint}`, error);
      throw normalizeApiError(error);
    }
  }

  // ========== 流式聊天 ==========
  async *chat(params: {
    sessionId: string;
    regenerationMode?: string | null;
    assistantMessageId?: string | null;
    resumeData?: any;
    userMessage?: {
      id?: string;
      content?: string;
      files?: string[];
      replaceMessageId?: string;
      knowledgeBaseIds?: string[];
    };
  }): AsyncGenerator<StreamEvent, void, unknown> {
    return yield* this.chatStreamService.chat(params);
  }

  /**
   * 人工确认恢复（plan_exit 批准/拒绝后继续 Agent）
   */
  async *resume(params: {
    sessionId: string;
    replyId: string;
    decisions: Array<{ toolCallId: string; confirmed: boolean }>;
    model?: string;
    characterId?: string | null;
    think?: boolean;
    feedback?: string;
  }): AsyncGenerator<StreamEvent, void, unknown> {
    return yield* this.chatStreamService.resume(params);
  }

  async cancelResponse(sessionId: string): Promise<void> {
    return this.chatStreamService.cancelResponse(sessionId);
  }

  async sendMessage(params: {
    sessionId: string;
    content: string;
    fileIds?: string[];
    knowledgeBaseIds?: string[];
    replaceMessageId?: string;
  }): Promise<{ success: boolean }> {
    return this.chatStreamService.sendMessage(params);
  }

  async getStreamStatus(sessionId: string): Promise<{
    isRunning: boolean;
    subscriberCount: number;
    bufferedEventCount: number;
  }> {
    return await this._request(`/chat/stream/${sessionId}/status`);
  }

  // ========== 工作目录实时监听 ==========
  connectWorkspaceWatcher(sessionId: string, onConnected?: () => void): void {
    this.workspaceWatcherService.connect(sessionId, onConnected);
  }

  disconnectWorkspaceWatcher(): void {
    this.workspaceWatcherService.disconnect();
  }

  onWorkspaceChange(callback: (event: FileChangeEvent) => void): () => void {
    return this.workspaceWatcherService.onChange(callback);
  }

  getWorkspaceWatcherSessionId(): string | null {
    return this.workspaceWatcherService.getSessionId();
  }

  // ========== 会话事件实时推送 ==========
  connectSessionEvents(): void {
    this.sessionEventsService.connect();
  }

  disconnectSessionEvents(): void {
    this.sessionEventsService.disconnect();
  }

  onSessionEvent(
    eventType: SessionEventType | "*",
    callback: (event: SessionEvent) => void,
  ): () => void {
    return this.sessionEventsService.on(eventType, callback);
  }

  getClientId(): string {
    return getClientId();
  }

  // ========== 工具方法 ============
  debounce<T extends (...args: any[]) => any>(func: T, delay: number): T {
    let timer: number | undefined;
    return function (this: any, ...args: Parameters<T>) {
      clearTimeout(timer);
      timer = window.setTimeout(() => {
        func.apply(this, args);
      }, delay);
    } as T;
  }
}

// 将领域方法挂载到原型
Object.assign(
  ApiService.prototype,
  modelApi,
  characterApi,
  sessionApi,
  workspaceApi,
  messageApi,
  fileUploadApi,
  authApi,
  settingsApi,
  mcpApi,
  skillsApi,
  knowledgeBaseApi,
  botApi,
  schedulerApi,
  pluginApi,
  remoteWorkspaceApi,
  tavernApi,
  generateApi,
  faceApi,
  inputApi,
);

/**
 * 创建 API Service 实例（同步）
 * - 生产环境：直接使用真实 ApiService
 * - 开发环境：根据配置决定是否启用 Mock
 */
function createApiServiceInstance() {
  const realService = new ApiService();

  if (import.meta.env.PROD) {
    console.log("生产环境：使用真实 API Service");
    return realService;
  }

  const enabled = shouldEnableMock();

  if (!enabled) {
    console.log("开发环境：使用真实 API Service（Mock 已禁用）");
    return realService;
  }

  console.log("开发环境：使用 Mock API Service（配置将在首次调用时加载）");

  const mockService = Object.create(Object.getPrototypeOf(realService));
  Object.assign(mockService, realService);

  const mockMethods = createMockMethods();
  mockService.chat = mockMethods.chat;
  mockService.createMessage = mockMethods.createMessage;

  return mockService;
}

// 创建默认实例并导出（同步创建，无竞态条件）
export let apiService: ApiService = createApiServiceInstance();

/**
 * 重新初始化 API Service（用于动态切换 Mock 模式）
 * 调用此方法后，需要刷新页面或重新获取 apiService
 */
export function reinitApiService() {
  apiService = createApiServiceInstance();
  console.log("🔄 API Service 已重新初始化");
  return apiService;
}
