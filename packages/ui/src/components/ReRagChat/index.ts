/**
 * ReRagChat —— RAG 问答组件
 *
 * 适配后端 RAG 接口 /v2/ai/rag/query
 *   <ReRagChat base-url="/v2/ai/rag" library-id="my-lib" />
 */
import type { App, Plugin } from "vue";
import ReRagChat from "./index.vue";

const plugin: Plugin = {
  install(app: App) {
    app.component("ReRagChat", ReRagChat);
  },
};

export { plugin as install };
export default ReRagChat;
export type { RagChatMessage, RagSource, RagQueryRequest, RagQueryResponse } from "./types";
