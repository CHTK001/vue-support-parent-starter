/**
 * webllm 供应商档案与内置模型清单。
 *
 * <p>webllm 是<b>前端写死的本地推理提供商</b>：没有上游地址、没有 API Key
 * （{@code auth_scheme=none}），模型文件由 MLC 预编译分发、浏览器端经 Web Worker
 * 推理。本模块导出的模板与模型清单由模型管理（{@code @pages/ai}）合并进
 * 供应商模板库，用户像添加其它供应商一样添加 webllm 模型后，即可在会话页、
 * 悬浮球中按平台分发调用。</p>
 */

/** webllm 平台标识（模型管理 provider.platform 与模型路由判断均用此值） */
export const WEBLLM_PROVIDER_ID = "webllm";

/** 默认 MLC 模型（未配置 aiChatModel 时的回退值） */
export const WEBLLM_DEFAULT_MODEL_ID = "Qwen2.5-1.5B-Instruct-q4f16_1-MLC";

/** 内置可选模型行（label 显示名 / value 模型 ID / image 图标） */
export interface WebLLMModelOption {
  label: string;
  value: string;
  image?: string;
}

/**
 * 内置 MLC 预编译模型清单。
 *
 * <p>与 {@code @mlc-ai/web-llm} 的预编译模型列表对齐（q4f16_1 量化）；
 * yaml 的 {@code aiChat.webllmModels} 仍可覆盖此清单（兼容已发布配置）。</p>
 */
export const WEBLLM_BUILTIN_MODELS: WebLLMModelOption[] = [
  { label: "Qwen2.5-1.5B-Instruct（推荐·轻量）", value: "Qwen2.5-1.5B-Instruct-q4f16_1-MLC", image: "/assets/models/qwen-color.svg" },
  { label: "Qwen2.5-3B-Instruct（中等）", value: "Qwen2.5-3B-Instruct-q4f16_1-MLC", image: "/assets/models/qwen-color.svg" },
  { label: "Llama-3.2-1B-Instruct（轻量）", value: "Llama-3.2-1B-Instruct-q4f16_1-MLC", image: "/assets/models/meta-color.svg" },
  { label: "Llama-3.2-3B-Instruct（中等）", value: "Llama-3.2-3B-Instruct-q4f16_1-MLC", image: "/assets/models/meta-color.svg" },
  { label: "Phi-3.5-mini-instruct（中等）", value: "Phi-3.5-mini-instruct-q4f16_1-MLC", image: "/assets/models/microsoft-color.svg" },
  { label: "gemma-2-2b-it（中等）", value: "gemma-2-2b-it-q4f16_1-MLC", image: "/assets/models/gemini-color.svg" },
];

/**
 * webllm 供应商模板（结构与模型管理的 ProviderTemplate 兼容，不依赖其类型）。
 *
 * <p>与 ONNX 同一口径：本地推理供应商由用户在模型管理手动添加，模板不带
 * 上游地址、认证方式为 none；后端跳过健康外呼。</p>
 */
export const WEBLLM_PROVIDER_TEMPLATE = {
  id: WEBLLM_PROVIDER_ID,
  name: "WebLLM 浏览器推理",
  description: "浏览器端本地大模型推理（WebGPU + Web Worker），无需 API 地址与 Key；模型在浏览器内运行，适合轻量对话与离线场景",
  protocol: "openai",
  keywords: ["webllm", "webgpu", "本地推理", "浏览器", "mlc", "local", "离线"],
  defaultAuthMode: "none",
} as const;
