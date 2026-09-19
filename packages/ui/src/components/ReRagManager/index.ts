/**
 * ReRagManager —— RAG 知识库管理组件
 *
 * 适配后端 RAG 服务
 *   <ReRagManager base-url="/v2/ai/rag" />
 */
import type { App, Plugin } from "vue";
import ReRagManager from "./index.vue";

const plugin: Plugin = {
  install(app: App) {
    app.component("ReRagManager", ReRagManager);
  },
};

export { plugin as install };
export default ReRagManager;
export type { RagDocument, RagStatus, RagEmbeddingEngine } from "./types";
