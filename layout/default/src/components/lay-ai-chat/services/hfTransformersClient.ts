import type { ChatMessage } from "../types";
import { env, pipeline } from "@huggingface/transformers";

const DEFAULT_BROWSER_MODEL = "Xenova/Qwen2.5-0.5B-Instruct";
const MAX_NEW_TOKENS = 256;
const DEFAULT_TEMPERATURE = 0.7;

type TextGenerationPipeline = (input: string, options?: unknown) => Promise<
  Array<{
    generated_text?: string;
    text?: string;
  }>
>;

let cachedGenerator: TextGenerationPipeline | null = null;
let loadingPromise: Promise<TextGenerationPipeline> | null = null;

function buildPrompt(history: ChatMessage[], current: string): string {
  const parts: string[] = [];

  history.forEach((item) => {
    const role = item.role === "user" ? "用户" : "助手";
    parts.push(`${role}: ${item.content}`);
  });

  parts.push(`用户: ${current}`);
  parts.push("助手:");

  return parts.join("\n");
}

function resolveBrowserModel(model?: string): string {
  const trimmed = (model || "").trim();
  if (trimmed.length === 0) {
    return DEFAULT_BROWSER_MODEL;
  }
  return trimmed;
}

async function getTextGenerationPipeline(model?: string): Promise<TextGenerationPipeline> {
  if (cachedGenerator) {
    return cachedGenerator;
  }
  if (loadingPromise) {
    return loadingPromise;
  }

  env.backends.onnx.wasm.numThreads = navigator.hardwareConcurrency || 4;
  env.allowLocalModels = false;

  const modelId = resolveBrowserModel(model);

  loadingPromise = pipeline("text-generation", modelId, {
    progress_callback: (progress: { status?: string; progress?: number }) => {
      // eslint-disable-next-line no-console
      console.log("[AI][浏览器模型] 加载进度", progress?.status, progress?.progress ?? "");
    },
  }) as Promise<TextGenerationPipeline>;

  cachedGenerator = await loadingPromise;
  loadingPromise = null;

  return cachedGenerator;
}

export async function generateByTransformersJs(
  history: ChatMessage[],
  message: string,
  model?: string,
): Promise<string> {
  const generator = await getTextGenerationPipeline(model);
  const prompt = buildPrompt(history, message);

  const result = await generator(prompt, {
    max_new_tokens: MAX_NEW_TOKENS,
    temperature: DEFAULT_TEMPERATURE,
  });

  const first = Array.isArray(result) && result.length > 0 ? result[0] : null;
  const fullText = (first?.generated_text || first?.text || "").trim();

  if (!fullText) {
    return "抱歉，我无法生成回复。";
  }

  if (!fullText.startsWith(prompt)) {
    return fullText;
  }

  return fullText.slice(prompt.length).trim() || fullText;
}


