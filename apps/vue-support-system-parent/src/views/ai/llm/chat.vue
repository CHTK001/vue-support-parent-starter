<template>
  <div class="llm-dialog-box">
    <LLMDialog :instance="llmDialogInstance" :form="props.form" />
  </div>
</template>

<script setup lang="ts" name="App">
import { fetchEventSource } from "@microsoft/fetch-event-source";
import { fetchCallStream } from "@repo/core";
import LLMDialog from "./components/LLMDialog.vue";
import { llmDialog } from "./llmDialog/llmDialog";
import { defineProps } from "vue";
import { message } from "@repo/utils";
const llmDialogInstance = llmDialog();
const props = defineProps({
  form: { type: Object, default: () => {} },
  env: { type: Object, default: () => {} },
});
llmDialogInstance.setForm(props.form);
let sessionId = localStorage.getItem("sessionId") || "";
let eventSource: any = null;
let controller: any = null;

// 发送消息逻辑
llmDialogInstance.onSend = (prompt: string, files: File[]) => {
  // 建立SSE连接
  if (!props.form?.sysProjectId) {
    llmDialogInstance.onFinish();
    message("请先选择项目", { type: "error" });
    return false;
  }

  if (!props.form?.model) {
    llmDialogInstance.onFinish();
    message("请先选择模型", { type: "error" });
    return false;
  }
  // 如果是新会话则生成ID
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem("sessionId", sessionId);
  }

  let _fileInfo = [];

  if (null != files && files.length > 0) {
    function fileToBase64(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result?.replace(/^data:.+;base64,/, ""));
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    }
    files.forEach(async (file) => {
      const _base64 = await fileToBase64(file);
      _fileInfo.push({
        type: file.type?.startsWith("image") ? "image" : file.type?.startsWith("video") ? "video" : "",
        url: _base64,
      });
      send(prompt, _fileInfo);
    });
    return;
  }
  send(prompt, null);
  return;
};

const send = (prompt, files) => {
  // 关闭之前的连接
  llmDialogInstance.onCancel();

  controller = new AbortController();
  const signal = controller.signal;
  eventSource = fetchEventSource(fetchCallStream({}), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    signal: signal,
    body: JSON.stringify({
      requestId: props.form.sysProjectId,
      model: props.form.model,
      user: prompt,
      seed: props.form.seed,
      temperature: props.form.temperature,
      topK: props.form.topK,
      system: props.form.system,
      tokens: props.form.tokens,
      files: files,
    }),
    onmessage(event) {
      const data = JSON.parse(event.data);

      // 如果对话结束
      if (data.done) {
        llmDialogInstance.onCancel();
        // 通知组件对话结束
        return llmDialogInstance.onFinish();
      }

      // 通知组件接收到新消息
      if (data.output) {
        llmDialogInstance.onData(data.output);
      }
    },
    onerror(error) {
      llmDialogInstance.onCancel();
      // 通知组件对话时发生错误
      llmDialogInstance.onError();
      console.error("EventSource error:", error);
    },
  });
  // eventSource = new EventSource(fetchCallStream({}), {
  //   method: "POST",
  //   headers: {
  //     "Content-Type": "application/json",
  //   },
  //   body: JSON.stringify({
  //     requestId: props.form.sysProjectId,
  //     model: props.form.model,
  //     user: prompt,
  //     temperature: props.form.temperature,
  //     topK: props.form.topK,
  //     system: props.form.system,
  //     tokens: props.form.tokens,
  //     files: files,
  //   }),
  // });

  // eventSource.onmessage = (event) => {
  //   const data = JSON.parse(event.data);

  //   // 如果对话结束
  //   if (data.done) {
  //     // 关闭连接
  //     if (eventSource) {
  //       eventSource.close();
  //     }
  //     // 通知组件对话结束
  //     return llmDialogInstance.onFinish();
  //   }

  //   // 通知组件接收到新消息
  //   if (data.output) {
  //     llmDialogInstance.onData(data.output);
  //   }
  // };

  // eventSource.onerror = (err) => {
  //   if (eventSource) {
  //     eventSource.close();
  //   }
  //   // 通知组件对话时发生错误
  //   llmDialogInstance.onError();
  //   console.error("EventSource error:", err);
  // };
};

// 停止发送消息逻辑
llmDialogInstance.onCancel = () => {
  // if (eventSource) {
  //   eventSource.close();
  // }
  if (controller) {
    controller?.abort();
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
