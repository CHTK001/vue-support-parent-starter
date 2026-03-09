import { env, pipeline } from "@xenova/transformers";

const DEFAULT_BROWSER_MODEL = "Xenova/Qwen2.5-0.5B-Instruct";

type TextGenerationPipeline = (
  input: string,
  options?: unknown,
) => Promise<
  Array<{
    generated_text?: string;
    text?: string;
  }>
>;

let cachedGenerator: TextGenerationPipeline | null = null;

// Configure environment for Web Worker
env.backends.onnx.wasm.numThreads = self.navigator?.hardwareConcurrency || 4;
env.allowLocalModels = false;

// Message handler
self.onmessage = async (event: MessageEvent) => {
  const { type, id, payload } = event.data;

  try {
    if (type === "load") {
      const { model } = payload;
      const modelId = model?.trim() || DEFAULT_BROWSER_MODEL;

      // Create text-generation pipeline with progress callback
      cachedGenerator = (await pipeline("text-generation", modelId, {
        progress_callback: (progress: {
          status?: string;
          progress?: number;
        }) => {
          // Send progress updates to main thread
          self.postMessage({
            type: "progress",
            id,
            payload: {
              status: progress?.status,
              progress: progress?.progress,
            },
          });
        },
      })) as TextGenerationPipeline;

      // Send loaded confirmation
      self.postMessage({
        type: "loaded",
        id,
        payload: { success: true },
      });
    } else if (type === "generate") {
      if (!cachedGenerator) {
        throw new Error("Model not loaded. Call 'load' first.");
      }

      const { prompt, maxNewTokens, temperature } = payload;

      // Execute text inference
      const result = await cachedGenerator(prompt, {
        max_new_tokens: maxNewTokens,
        temperature,
      });

      // Send result back to main thread
      self.postMessage({
        type: "result",
        id,
        payload: { result },
      });
    } else {
      throw new Error(`Unknown message type: ${type}`);
    }
  } catch (error) {
    // Send error back to main thread
    self.postMessage({
      type: "error",
      id,
      payload: {
        error: error instanceof Error ? error.message : String(error),
      },
    });
  }
};
