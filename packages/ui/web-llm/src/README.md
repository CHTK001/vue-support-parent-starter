/**
 * @repo/web-llm —— 浏览器端本地大模型推理
 *
 * 基于 @mlc-ai/web-llm + Web Worker，让 LLM 推理不阻塞主线程。
 * 通过 `useWebLLM` composable 在 Vue 组件中加载模型与生成回复。
 *
 * ## 安装
 *
 * 在使用方项目中安装：
 *
 * ```bash
 * pnpm add @repo/web-llm @mlc-ai/web-llm
 * ```
 *
 * ## 基础用法
 *
 * ```vue
 * <script setup lang="ts">
 * import { useWebLLM } from "@repo/web-llm";
 *
 * const { loading, generating, error, onProgress, loadModel, generate } = useWebLLM({
 *   model: "Qwen2.5-1.5B-Instruct-q4f16_1-MLC",
 *   temperature: 0.7,
 *   maxTokens: 512,
 * });
 *
 * // 监听模型加载进度
 * onProgress(({ text, progress }) => {
 *   console.log("loading:", text, progress);
 * });
 *
 * async function ask() {
 *   await loadModel();
 *   const reply = await generate([{ role: "user", content: "你好" }]);
 *   console.log(reply);
 * }
 * </script>
 * ```
 *
 * ## API
 *
 * `useWebLLM(options)` 返回：
 *
 * | 字段         | 类型                                       | 说明                                |
 * | ------------ | ------------------------------------------ | ----------------------------------- |
 * | `loading`    | `Ref<boolean>`                             | 是否正在加载模型                    |
 * | `generating` | `Ref<boolean>`                             | 是否正在生成回复                    |
 * | `error`      | `Ref<string \| null>`                      | 错误信息                            |
 * | `onProgress` | `(handler) => () => void`                  | 订阅加载进度（返回 unsubscribe）    |
 * | `loadModel`  | `() => Promise<void>`                      | 加载模型（幂等）                    |
 * | `unloadModel`| `() => void`                               | 终止 worker，释放内存               |
 * | `generate`   | `(messages) => Promise<string>`            | 生成回复                            |
 *
 * `options` 字段：
 *
 * | 字段         | 类型              | 默认值                                     | 说明                                   |
 * | ------------ | ----------------- | ------------------------------------------ | -------------------------------------- |
 * | `model`      | `string`          | `Qwen2.5-1.5B-Instruct-q4f16_1-MLC`        | MLC 模型 ID                            |
 * | `maxTokens`  | `number`          | `512`                                      | 最大生成 token 数                      |
 * | `temperature`| `number`          | `0.7`                                      | 温度                                   |
 * | `timeoutMs`  | `number`          | `300_000`                                  | Worker 消息超时（ms）                  |
 * | `workerUrl`  | `string \| URL`   | 自动（`new URL("./worker.ts", import.meta.url)`）| 自定义 worker 入口 URL，打包后路径异常时使用 |
 *
 * ## 注意事项
 *
 * 1. **首次运行会下载模型权重**（约 1~2GB），需要稳定网络与磁盘空间
 * 2. **必须使用现代浏览器**（Chrome/Edge/Firefox/Safari 最新版）且支持 WebGPU
 * 3. Web Worker 路径在 Vite 下默认自动处理；若使用自定义打包器可能需要配置 worker loader
 * 4. 不调用 `unloadModel` 时，模型会持续占用显存；切换路由时建议主动释放
 * 5. Worker 是模块级单例，多个 `useWebLLM` 实例共享同一个引擎
 *
 * ## Worker 协议
 *
 * 详见 `src/worker.ts`：
 *
 * - 请求：`{ type: "load" | "generate", id: number, payload: ... }`
 * - 响应：`{ type: "loaded" | "result" | "error" | "progress", id?: number, payload: ... }`
 *
 * 如需自定义推理逻辑，可基于本协议实现 worker 入口，并通过 `workerUrl` 接入。
 */