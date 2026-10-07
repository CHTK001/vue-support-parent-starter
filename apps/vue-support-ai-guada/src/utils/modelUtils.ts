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
  openai: "OpenAI.svg",
  gpt: "OpenAI.svg",
  newapi: "newapi.png",

  // Anthropic
  anthropic: "Anthropic.svg",
  claude: "Anthropic.svg",

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
  deepseek: "DeepSeek.svg",

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

  // 直接从模型自身的 thinkingEfforts 字段读取（后端完整控制选项）
  const efforts = model.thinkingEfforts || [];

  // 如果后端返回了配置，直接返回（后端已决定是否包含 'none'）
  if (efforts.length > 0) {
    return efforts;
  }

  // 备用逻辑：如果模型支持思考功能但没有配置具体强度，提供简化的开关模式
  // 注意：后端已根据协议过滤了无效选项，此处不额外添加
  return [];
}

/**
 * 检查模型是否支持思考功能
 */
export function isThinkingSupported(model: any, providers: any[]): boolean {
  const efforts = getModelThinkingEfforts(model, providers);
  return efforts.length > 0;
}

/**
 * 获取思考强度的显示标签
 */
export function getThinkingEffortLabel(effort: string): string {
  const key = `common.thinkingEffort.${effort}`;
  const label = t(key);
  return label !== key ? label : effort;
}
