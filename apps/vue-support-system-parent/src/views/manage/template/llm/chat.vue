<template>
  <div class="llm-dialog-box">
    <LLMDialog :instance="llmDialogInstance" />
  </div>
</template>

<script setup lang="ts" name="App">
import { fetchCallStream } from "@repo/core";
import LLMDialog from "./components/LLMDialog.vue";
import { llmDialog } from "./llmDialog/llmDialog";
import { defineProps } from "vue";
const llmDialogInstance = llmDialog();
const props = defineProps({
  form: { type: Object, default: () => {} },
  env: { type: Object, default: () => {} },
});
let sessionId = localStorage.getItem("sessionId") || "";
let eventSource: EventSource | null = null;

// 发送消息逻辑
llmDialogInstance.onSend = (prompt: string, files: File[]) => {
  // 如果是新会话则生成ID
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem("sessionId", sessionId);
  }

  // 关闭之前的连接
  if (eventSource) {
    eventSource.close();
  }

  // 建立SSE连接
  eventSource = new EventSource(
    fetchCallStream({
      requestId: props.form.sysProjectId,
      model: props.form.model,
      user: prompt,
      temperature: props.form.temperature,
      topK: props.form.topK,
      system: props.form.system,
      tokens: props.form.tokens,
    })
  );

  eventSource.onmessage = (event) => {
    const data = JSON.parse(event.data);

    // 如果对话结束
    if (data.done) {
      // 关闭连接
      if (eventSource) {
        eventSource.close();
      }
      // 通知组件对话结束
      return llmDialogInstance.onFinish();
    }

    // 通知组件接收到新消息
    if (data.output) {
      llmDialogInstance.onData(data.output);
    }
  };

  eventSource.onerror = (err) => {
    if (eventSource) {
      eventSource.close();
    }
    // 通知组件对话时发生错误
    llmDialogInstance.onError();
    console.error("EventSource error:", err);
  };
};

// 停止发送消息逻辑
llmDialogInstance.onCancel = () => {
  if (eventSource) {
    eventSource.close();
  }
};
</script>

<style scoped>
body {
  inset: 0;
}
.llm-dialog-box {
  width: 100%;
  height: 100%;
}
</style>
