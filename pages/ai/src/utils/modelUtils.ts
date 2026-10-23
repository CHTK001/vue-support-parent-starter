/**
 * 模型工具函数
 * 用于处理模型名称显示和头像获取
 */

import { computed } from "vue";
import { fixFrontendAssetUrl } from "./url";
import { t } from "@/locales";

/**
 * 提供商标识 → Logo 文件名（含扩展名）。
 *
 * <p>值直接作为文件名拼接到 `/images/models/` 路径下，
 * 因此必须带上正确的 `.svg`/`.png` 扩展名，不能再像过去那样
 * 用 `isPng` 开关在函数里补后缀——那导致 MuseSpark.png/olmama.png
 * 被误判为 .svg 而找不到文件。</p>
 *
 * <p>「muse-spark」（带连字符）作为别名加入，
 * 这样模型名 `muse-spark-1.3-contributor` 能直接命中 startsWith 匹配，
 * 不再依赖 providerName 回退。</p>
 */
const PROVIDER_LOGOS: Record<string, string> = {
  // OpenAI
  openai: "openai.svg",
  gpt: "OpenAI.svg",
  newapi: "newapi.png",

  // Anthropic
  anthropic: "Anthropic.svg",
  claude: "claude.svg",

  // Google
  google: "Google.svg",
  gemini: "Google.svg",

  // 百度文心一言
  baidu: "baidu.svg",
  ernie: "baidu.svg",
  wenxin: "baidu.svg",

  // 阿里通义千问
  tongyi: "Tongyi.svg",
  qwen: "Tongyi.svg",
  aliyun: "Tongyi.svg",

  // 腾讯混元
  hunyuan: "hunyuan.svg",
  tencent: "hunyuan.svg",

  // 智谱 AI
  zhipu: "zhipu.svg",
  glm: "zhipu.svg",

  // 月之暗面 Kimi
  kimi: "kimi.png",
  moonshot: "kimi.png",

  // DeepSeek
  deepseek: "deepseek.svg",

  // 百川智能
  baichuan: "Baichuan.svg",

  // 零一万物
  yi: "Yi.svg",
  "01ai": "Yi.svg",

  // MiniMax
  minimax: "minimax.svg",

  // StepFun
  stepfun: "Stepfun.svg",
  step: "Stepfun.svg",

  // BAAI（北京智源）
  baai: "BAAI.svg",
  zhiyuan: "BAAI.svg",

  // 字节跳动
  bytedance: "ByteDance.svg",
  doubao: "ByteDance.svg",

  // 书生·浦语
  internlm: "internlm.svg",
  shusheng: "internlm.svg",

  // Agnes
  agnes: "Agnes.svg",
  north: "north.svg",
  mimo: "mimo.svg",
  solar: "solar.svg",
  ollama: "ollama.png",

  // 灵犀
  ling: "ling.png",
  nemotron: "nemotron.svg",
  laguna:"laguna.svg",
  inkling: "inkling.png",
  dots: "dots.png",
  apodex:"apodex.png",

  // MuseSpark — 同时注册带连字符别名，匹配模型名前缀 `muse-spark-*`
  "muse-spark": "MuseSpark.svg",

  // 商汤 SenseNova — 模型名前缀 `sensenova-*` / `sensetime-*` 均命中同款图标
  sensenova: "sensenova.png",
  sensetime: "sensenova.png",

  cline: "cline.svg",
  qoder: "qoder.png",
  "qoder-cn": "qoder.png",

  // 其他已有 Logo 文件但暂未在 PROVIDER_LOGOS 注册的提供商
  meta: "meta.svg",
  microsoft: "microsoft.svg",
  nvidia: "nvidia.svg",
  salesforce: "salesforce.svg",
  modelscope: "modelscope.png",
  hermes: "hermes.png",
  opencode: "opencode.png",
  openclaw: "openclaw.svg",
  onnx: "onnx.svg",
  grok: "grok.svg",
  bedrock: "bedrock.svg",
  mistral: "mistral.svg",
  azure: "azure.svg",
};

/**
 * 从模型名称中提取简洁的显示名称
 * - 去除命名空间前缀（如 "provider/model-name" -> "model-name"）
 * - 保持原始大小写
 *
 * @param modelName 完整的模型名称
 * @returns 简化后的显示名称
 */
export function getModelDisplayName(modelName: string): string {
  if (!modelName) return "";

  // 如果包含 "/"，取最后一部分（去除命名空间）
  const parts = modelName.split("/");
  return parts[parts.length - 1] || modelName;
}

/**
 * 启发式判断模型所属的提供商
 * 通过小写化、去前缀后与已知提供商进行开头匹配，返回 PROVIDER_LOGOS 的 key。
 *
 * <p>注意：过去这个函数返回 `value.toLowerCase()`（即 logo 文件名），
 * 但 value 并不一定是 key，这导致 `PROVIDER_LOGOS["tongyi"]` 这样的反查
 * 依赖 value 恰好等于 key 的巧合—— fragile。改为返回 key 后，反查语义
 * 正确且 value 可以自由加上扩展名。</p>
 *
 * @param modelName 模型名称
 * @param providerName 提供商名称（可选，作为后备）
 * @returns PROVIDER_LOGOS 的 key，或 "default"
 */
export function detectModelProvider(
  modelName: string,
  providerName?: string,
): string {
  if (!modelName) return providerName?.toLowerCase() || "default";

  // 获取简化后的模型名称
  const displayName = getModelDisplayName(modelName).toLowerCase();

  // 尝试匹配已知提供商
  for (const [key] of Object.entries(PROVIDER_LOGOS)) {
    if (displayName.startsWith(key)) {
      return key;
    }
  }

  // 如果没有匹配到，返回提供商名称的小写形式
  return providerName?.toLowerCase() || "default";
}

/**
 * 获取模型的头像路径
 * 优先使用提供商的 Logo，如果没有则返回 null（由 Avatar 组件显示首字母）
 *
 * @param modelName 模型名称
 * @param providerName 提供商名称
 * @returns 头像路径或 null
 */
export function getModelAvatarPath(
  modelName: string,
  providerName?: string,
): string | null {
  const providerId = detectModelProvider(modelName, providerName);

  // PROVIDER_LOGOS 的 value 已直接包含扩展名，无需额外判断
  const logoFile = PROVIDER_LOGOS[providerId];
  if (logoFile) {
    return fixFrontendAssetUrl(`/images/models/${logoFile}`);
  }

  return null;
}

/**
 * Vue Composable: 用于在组件中便捷地获取模型显示信息
 *
 * @param modelName 模型名称
 * @param providerName 提供商名称
 * @returns 包含显示名称和头像路径的对象
 */
export function useModelDisplay(modelName: string, providerName?: string) {
  const displayName = computed(() => getModelDisplayName(modelName));
  const avatarPath = computed(() =>
    getModelAvatarPath(modelName, providerName),
  );

  return {
    displayName,
    avatarPath,
  };
}

/**
 * 收集模型「已配置」的思考档位（模型管理里勾选的集合）。
 *
 * <p>同一份档位在后端有三种下发形态，必须全部兼容，否则读不到：
 * ① 模型管理页 mapModel 后的 `thinkingEfforts`（camelCase）；
 * ② `GET /api/providers` 裸行顶层 `thinking_efforts`（snake_case）；
 * ③ 裸行 `capabilities[].thinking_efforts`（后端把档位挂在能力节点上）。</p>
 *
 * <p>早期实现只读 ①，而聊天页拿到的正是 ②/③ 的裸行，导致模型明明配了档位，
 * 思考弹层却只剩「不思考 / 默认」（用户实测报障）。</p>
 */
function collectDeclaredThinkingEfforts(model: any): string[] {
  const pick = (value: unknown): string[] =>
    Array.isArray(value)
      ? value.filter((v): v is string => typeof v === 'string' && v.length > 0)
      : [];
  const dedupe = (list: string[]) => [...new Set(list)];

  const mapped = pick(model.thinkingEfforts);
  if (mapped.length) return dedupe(mapped);

  const raw = pick(model.thinking_efforts);
  if (raw.length) return dedupe(raw);

  const capabilities = Array.isArray(model.capabilities) ? model.capabilities : [];
  return dedupe(capabilities.flatMap((cap: any) => pick(cap?.thinking_efforts)));
}

/**
 * 获取模型的思考强度选项
 * @param model 模型对象（包含 providerId 和 features）
 * @param providers 供应商列表（从 API 获取，仅用于备用）
 * @returns 思考强度选项数组，如 ['none', 'low', 'medium', 'high'] 或 ['minimal', 'low', 'medium', 'high']
 */
export function getModelThinkingEfforts(
  model: any,
  providers: any[],
): string[] {
  if (!model) {
    return [];
  }

  // 模型自身声明了档位就直接用（后端白名单透传，集合由模型管理配置）
  const efforts = collectDeclaredThinkingEfforts(model);
  if (efforts.length > 0) {
    // 'default' 始终排在首位：表示「不指定档位，交由各厂商默认」
    return efforts.includes('default') ? efforts : ['default', ...efforts];
  }

  // 未显式配置：仅对「支持思考」的模型给默认集合（default + low/medium/high/max），
  // 其余模型不展示档位区——避免给不支持思考的模型挂一排无效选项。
  const features: string[] = model.config?.features || [];
  const reasoningFlag = model.metrics?.reasoning_model;
  const supportsThinking = reasoningFlag === true || reasoningFlag === 'true' || features.includes('thinking');
  return supportsThinking ? ['default', 'low', 'medium', 'high', 'max'] : [];
}

/**
 * 检查模型是否支持思考功能
 */
export function isThinkingSupported(model: any, providers: any[]): boolean {
  const efforts = getModelThinkingEfforts(model, providers);
  return efforts.length > 0;
}

/* ==================== 上下文大小过滤（模型选择卡片 / 模型管理通用） ==================== */

/**
 * 常见上下文档位标签：多选过滤，区间为 [min, max)。
 *
 * <p>取的是各家模型卡最常见的量级（32K / 128K / 256K / 1M），不是精确分档；
 * 「unknown」表示模型行与指标表都没有上下文数据——模型管理里可据此发现漏配。
 * 标签文案走 i18n：`common.contextSize.<key>`。</p>
 */
export const CONTEXT_SIZE_TAGS: Array<{ key: string; min: number; max: number }> = [
  { key: 'lt32k', min: 0, max: 32000 },
  { key: 'k32to128', min: 32000, max: 128000 },
  { key: 'k128to256', min: 128000, max: 256000 },
  { key: 'k256to1m', min: 256000, max: 1000000 },
  { key: 'gte1m', min: 1000000, max: Number.POSITIVE_INFINITY },
  { key: 'unknown', min: Number.NaN, max: Number.NaN },
];

/**
 * 模型的有效上下文窗口（token 数）。
 *
 * <p>取值口径与模型卡片一致：手填 `context_window`（sys_ai_provider_model 同名列）
 * 优先，未填回退指标表快照 `metrics.context_window_tokens`；同时兼容
 * 「后端原始行」与「mapModel 映射行（config.contextWindow）」两种形态。
 * 取不到返回 null（=「未知」档）。</p>
 *
 * @param model 模型行（原始或映射后）
 */
export function getModelContextWindow(model: any): number | null {
  if (!model) {
    return null;
  }
  const candidates = [
    model.context_window,
    model.contextWindow,
    model.config?.contextWindow,
    model.metrics?.context_window_tokens,
    model.metrics?.context_window,
  ];
  for (const candidate of candidates) {
    const n = Number(candidate);
    if (candidate !== null && candidate !== undefined && candidate !== '' && Number.isFinite(n) && n > 0) {
      return n;
    }
  }
  return null;
}

/**
 * 上下文大小的人类可读徽标：131072 → 「128K」，1000000 → 「1M」，4096 → 「4096」。
 *
 * @param size 上下文 token 数（null/0/负数返回空串，调用方用 v-if 兜）
 */
export function formatContextSize(size: number | null): string {
  if (!size || size <= 0) {
    return '';
  }
  if (size >= 1000000) {
    const m = size / 1000000;
    return `${Number.isInteger(m) ? m : m.toFixed(1)}M`;
  }
  if (size >= 1000) {
    return `${Math.round(size / 1000)}K`;
  }
  return String(size);
}

/**
 * 模型是否命中选中的上下文档位标签集合。
 *
 * <p>未选任何标签 = 不过滤（全部显示）；多选 = 任一命中即显示（并集）。
 * 「unknown」只匹配取不到上下文数据的模型；已知档位不会匹配无数据模型。</p>
 *
 * @param model 模型行
 * @param keys  选中的标签 key 列表（CONTEXT_SIZE_TAGS 的 key）
 */
export function matchesContextTags(model: any, keys: string[]): boolean {
  if (!keys || keys.length === 0) {
    return true;
  }
  const size = getModelContextWindow(model);
  return keys.some((key) => {
    if (key === 'unknown') {
      return size === null;
    }
    const tag = CONTEXT_SIZE_TAGS.find((item) => item.key === key);
    if (!tag) {
      return true;
    }
    return size !== null && size >= tag.min && size < tag.max;
  });
}

/**
 * 获取思考强度的显示标签
 */
export function getThinkingEffortLabel(effort: string): string {
  const key = `common.thinkingEffort.${effort}`;
  const label = t(key);
  return label !== key ? label : effort;
}
