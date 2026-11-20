/**
 * 模型平台判定 —— 「前端模型 vs 后端模型」的统一口径。
 *
 * <p>前端本地模型（浏览器内推理）与后端模型的能力不同：MCP 工具调用、知识库检索、
 * 思考档位等走后端链路的能力，对前端本地推理不可用。判定口径与
 * {@link ./webChatClient!isWebChatModel}（web: 前缀 → 浏览器脚本推理）、
 * @repo/web-llm 的悬浮球分发、koi/AiChatSection 的持久化推导保持一致：</p>
 *
 * <ul>
 *   <li>供应商 id（providerId / provider_id / 复合模型 id 前缀）为 'webllm'
 *       （{@link WEBLLM_PROVIDER_ID}）→ 浏览器 WebGPU 本地推理；</li>
 *   <li>供应商 id / 前缀为 'web' → 浏览器脚本推理（webChatClient）；</li>
 *   <li>供应商行的 provider / protocol / platform 任一命中同样认定
 *       （模型管理落库后 /api/providers 的行可能只有 platform 有值）；</li>
 *   <li>其余取 provider.provider / protocol（openai / anthropic / gemini …），缺省 openai。</li>
 * </ul>
 */
import { WEBLLM_PROVIDER_ID } from "@repo/web-llm";

/** 前端（浏览器内）推理平台清单：web = 脚本推理，webllm = WebGPU 本地大模型 */
export const FRONTEND_MODEL_PLATFORMS: readonly string[] = ["web", "webllm"];

/**
 * 推导模型平台。
 *
 * @param providerId 供应商 id（模型行的 providerId / provider_id）
 * @param provider 供应商行（/api/providers 的元素，字段名两种命名都兼容）
 * @returns 平台小写字符串；前端本地供应商固定返回其平台名
 */
export function resolveModelPlatform(providerId: string, provider: any): string {
  const pid = String(providerId || "").toLowerCase();
  const proto = String(provider?.provider || provider?.protocol || provider?.platform || "").toLowerCase();
  if (FRONTEND_MODEL_PLATFORMS.includes(pid)) return pid;
  if (FRONTEND_MODEL_PLATFORMS.includes(proto)) return proto;
  return proto || "openai";
}

/**
 * 是否前端（浏览器内）推理平台。
 *
 * @param platform 平台名（resolveModelPlatform 的返回值）
 */
export function isFrontendModelPlatform(platform: string): boolean {
  return FRONTEND_MODEL_PLATFORMS.includes(String(platform || "").toLowerCase());
}

/**
 * 便捷判定：给模型行（可选带供应商清单），判断该模型是否前端本地模型。
 *
 * @param model 模型行（含 providerId / provider_id）
 * @param providers 供应商行清单（/api/providers 的 items；可选，仅当模型行缺
 *   providerId 时才需要，用于按供应商行 platform 兜底）
 */
export function isFrontendModel(model: any, providers?: any[]): boolean {
  if (!model) return false;
  const pid = String(model.providerId || model.provider_id || "");
  if (isFrontendModelPlatform(pid)) return true;
  if (!providers || providers.length === 0) return isFrontendModelId(model.id);
  const provider = providers.find((p: any) =>
    String(p?.provider_id || p?.providerId || p?.id || "").toLowerCase() === pid.toLowerCase());
  return isFrontendModelPlatform(resolveModelPlatform(pid, provider));
}

/**
 * 只拿得到模型复合 id 时的判定（会话发送链路常见：手里只有 `webllm:<model>`）。
 *
 * <p>口径与 services/webChatClient 的 isWebChatModel 相同：本地供应商的复合主键以
 * 供应商 id 为前缀（后端固定 provider_id='web' / 模板 id='webllm'），按前缀判定
 * 即可，无需拉模型目录。</p>
 *
 * @param modelId 模型复合 id（如 `webllm:qwen2.5-7b`、`web:echo-demo`），兼容裸模型名
 */
export function isFrontendModelId(modelId: unknown): boolean {
  const raw = String(modelId || "").trim().toLowerCase();
  return FRONTEND_MODEL_PLATFORMS.some((p) => raw.startsWith(`${p}:`));
}
