/**
 * pages/ai → koi 布局的贡献装配（副作用模块：import 即完成注册）。
 *
 * <p>职责边界：主题包（@repo/theme）只提供「分区 / 悬浮组件」的注册机制与渲染位置，
 * AI 相关的分区与悬浮球由本模块在宿主启动时注册进来；webllm 本地推理能力由
 * {@code @repo/web-llm} 提供。三方依赖方向：</p>
 *
 * <pre>
 *   pages/ai ──▶ @repo/theme（注册表 API，只读消费）
 *   pages/ai ──▶ @repo/web-llm（webllm 供应商 / 悬浮球组件 / 注入点）
 *   @repo/web-llm ✗→ pages/ai（web-llm 不反向依赖业务包，靠注入点解耦）
 * </pre>
 *
 * <p>装配内容：</p>
 * <ul>
 *   <li>注入 WebLLM Worker 地址（vite {@code ?worker&url} 产物），本地推理可用；</li>
 *   <li>注入「当前对话模型」解析器：读 AiChatSection 持久化在 localStorage 的
 *       选中模型（providerId + modelId + platform），供悬浮球按 platform 分发
 *       本地 / 远端；未选择时返回 null，悬浮球回退默认 webllm 模型；</li>
 *   <li>注入远端发送实现：POST 后端 OpenAI 兼容入口。pages/ai 的 baseURL 已含
 *       {@code /v2} 前缀（web=相对 /v2，Electron=动态 http://localhost:8787/v2），
 *       因此这里只拼相对路径 {@code /v1/chat/completions}，最终落到
 *       {@code /v2/v1/chat/completions}（dev 代理只转发 /v2 与 /api，不转发 /v1，
 *       绝不能写绝对 /v1 路径）；</li>
 *   <li>注册主题配置分区 {@code ai-chat}（高级 tab，懒加载 AiChatSection）；</li>
 *   <li>注册悬浮球 {@code ai-character}（懒加载 @repo/web-llm 的 ReAiCharacter）。</li>
 * </ul>
 *
 * <p>显隐口径（双层）：yaml {@code other.aiChat.enable} 在这里决定「允不允许」；
 * 悬浮球内部再读 {@code aiChat.aiChatEnabled} 作为用户开关。模块不在场时没人
 * 调用本模块的注册，分区与悬浮球天然不存在。</p>
 */
import workerUrl from "@repo/web-llm/worker?worker&url";
import {
  setWebLLMWorkerUrl,
  setChatModelResolver,
  setRemoteChatHandler,
} from "@repo/web-llm";
import { registerThemeConfigSection } from "@repo/theme/koi/layouts/components/ThemeConfig/registry";
import { registerFloatingWidget } from "@repo/theme/koi/layouts/floatingWidgets";
import { getConfig, getStorageKey } from "@repo/config";
import { httpAt } from "@/framework/context";
import { apiService } from "@/services/ApiService";
import { getClientId } from "@/utils/clientId";

/** 注入 WebLLM Worker 地址（vite 打包产物 URL），缺了它本地推理无法启动 */
setWebLLMWorkerUrl(workerUrl);

/** 与 AiChatSection 约定的持久化键：当前选中的对话模型 */
const SELECTED_MODEL_KEY = getStorageKey("ai-chat-selected-model");

/**
 * 读取当前选中的对话模型。
 *
 * <p>AiChatSection 在用户选择模型时把
 * {@code { providerId, modelId, platform }} 写入 localStorage；这里只做读取与
 * 形状校验，解析失败一律返回 null（悬浮球回退默认 webllm 模型）。</p>
 */
function readSelectedModel(): {
  platform: string;
  modelId: string;
  providerId?: string;
} | null {
  try {
    const raw = localStorage.getItem(SELECTED_MODEL_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || !parsed.modelId) return null;
    return {
      platform: String(parsed.platform || "webllm"),
      modelId: String(parsed.modelId),
      providerId: parsed.providerId ? String(parsed.providerId) : undefined,
    };
  } catch {
    return null;
  }
}

/** 注入对话目标解析器（悬浮球每次发消息前调用） */
setChatModelResolver(readSelectedModel);

/**
 * 注入远端发送实现：走与页面会话同一套后端请求管线（Bearer / X-Client-Id /
 * 401 处理 / 统一提示），复用 apiService.baseURL（含 /v2 前缀）。
 *
 * <p>后端 OpenAI 兼容入口返回裸 OpenAI 结构（无 code/data/msg 信封），
 * 统一拦截器对非信封响应直接放行；这里做防御性解包：
 * {@code data.choices ?? data.data.choices}，取首个 choice 的回复文本。</p>
 */
setRemoteChatHandler(async (req) => {
  const response: any = await httpAt(apiService.baseURL, {
    "X-Client-Id": getClientId(),
  })
    .post("/v1/chat/completions")
    .data({ model: req.modelId, messages: req.messages });
  const body = response?.data ?? response;
  const choices = body?.choices ?? body?.data?.choices;
  const content = choices?.[0]?.message?.content;
  return typeof content === "string" ? content : "";
});

/** 主题配置抽屉：AI 对话分区（高级 tab；懒加载，模块不在场不注册） */
registerThemeConfigSection({
  id: "ai-chat",
  tab: "advanced",
  order: 15,
  visible: () => getConfig().other.aiChat?.enable !== false,
  component: () => import("./AiChatSection.vue"),
});

/** koi 主布局：AI 悬浮球（懒加载，内部再受 aiChat.aiChatEnabled 用户开关控制） */
registerFloatingWidget({
  id: "ai-character",
  order: 10,
  visible: () => getConfig().other.aiChat?.enable !== false,
  component: () => import("@repo/web-llm/ReAiCharacter.vue"),
});
