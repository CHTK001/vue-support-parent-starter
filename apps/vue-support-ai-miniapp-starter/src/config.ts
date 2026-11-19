/**
 * 小程序端全局配置。
 *
 * BASE_URL 与 PC 端 apps/vue-support-ai-starter 的 AI_API_TARGET 指向同一后端服务，
 * 所有 /v2 业务接口（登录、角色、会话、消息、流式对话）均直连该地址，不经任何代理。
 *
 * 微信开发者工具调试 http://127.0.0.1 时，需在「详情 - 本地设置」勾选
 * 「不校验合法域名、web-view（业务域名）、TLS 版本以及 HTTPS 证书」；
 * 真机预览请改为局域网/公网可达的后端地址。
 */
export const BASE_URL = "http://127.0.0.1:8787";

/** 业务接口前缀（与 PC 端 /v2 代理口径一致） */
export const API_BASE = `${BASE_URL}/v2`;

/** 本地存储 key：登录令牌 / 用户信息 / 客户端标识 */
export const STORAGE_KEY_TOKEN = "ai_miniapp_access_token";
export const STORAGE_KEY_USER = "ai_miniapp_user";
export const STORAGE_KEY_CLIENT_ID = "ai_miniapp_client_id";

/** 普通请求超时（毫秒） */
export const REQUEST_TIMEOUT = 15000;

/** 流式对话超时（毫秒）：一次 Agent 运行可能长达数分钟 */
export const STREAM_TIMEOUT = 600000;
