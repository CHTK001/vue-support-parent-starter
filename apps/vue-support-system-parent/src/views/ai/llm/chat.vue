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
        //@ts-ignore
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

<style lang="scss">
.llm-dialog-box {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;

  /* 全局样式覆盖 */
  :deep(.llm-dialog-page) {
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

    /* 隐藏滚动条但保留功能 */
    .llm-dialog-scroll-container {
      scrollbar-width: none;
      -ms-overflow-style: none;

      &::-webkit-scrollbar {
        width: 0;
        display: none;
      }
    }

    /* 消息动画 */
    .messages-box {
      > div {
        animation: fadeInUp 0.5s ease forwards;
        opacity: 0;

        @for $i from 1 through 20 {
          &:nth-child(#{$i}) {
            animation-delay: #{$i * 0.05}s;
          }
        }
      }
    }

    /* 美化消息样式 */
    .chat-left,
    .chat-right {
      border-radius: 16px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      transition: all 0.3s ease;
      position: relative;
      overflow: hidden;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
      }
      
      &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 3px;
        background: linear-gradient(90deg, #7c3aed, #4f46e5);
        opacity: 0;
        transition: opacity 0.3s ease;
      }
      
      &:hover::before {
        opacity: 1;
      }
    }

    .chat-left {
      background: white;
      border-bottom-left-radius: 4px;
      
      &::after {
        content: '';
        position: absolute;
        bottom: -8px;
        left: 16px;
        width: 16px;
        height: 16px;
        background: white;
        transform: rotate(45deg);
        box-shadow: 4px 4px 10px rgba(0, 0, 0, 0.05);
      }
    }

    .chat-right {
      background: #7c3aed;
      color: white;
      border-bottom-right-radius: 4px;
      
      &::after {
        content: '';
        position: absolute;
        bottom: -8px;
        right: 16px;
        width: 16px;
        height: 16px;
        background: #7c3aed;
        transform: rotate(45deg);
        box-shadow: 4px 4px 10px rgba(124, 58, 237, 0.2);
      }
    }

    /* 输入框美化 */
    .dialog-input {
      backdrop-filter: blur(10px);
      background: rgba(255, 255, 255, 0.8);
      border-radius: 16px;
      box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.05);
      transition: all 0.3s ease;
      border: 1px solid rgba(0, 0, 0, 0.05);

      &:focus-within {
        background: rgba(255, 255, 255, 0.95);
        box-shadow: 0 -4px 30px rgba(0, 0, 0, 0.08);
        border-color: rgba(124, 58, 237, 0.3);
      }

      textarea {
        transition: all 0.3s ease;
        
        &:focus {
          outline: none;
        }
      }

      .action-box {
        padding: 8px;
        display: flex;
        align-items: center;
        
        .left-area, .right-area {
          display: flex;
          gap: 8px;
        }
        
        .btn-small {
          transition: all 0.2s ease;
          border-radius: 8px;
          padding: 6px;
          background: rgba(0, 0, 0, 0.03);
          
          svg {
            transition: all 0.2s ease;
          }

          &:hover {
            transform: scale(1.1);
            background: rgba(124, 58, 237, 0.1);
            
            svg {
              color: #7c3aed;
            }
          }
        }
      }
    }

    /* 代码块美化 */
    pre.pre-code-box {
      border-radius: 12px;
      overflow: hidden;
      transition: all 0.3s ease;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
      margin: 16px 0;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
      }

      .pre-code-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 16px;
        background: #4b5563;
        color: white;
        font-family: monospace;
        
        button {
          background: rgba(255, 255, 255, 0.1);
          border: none;
          border-radius: 4px;
          padding: 4px 8px;
          color: white;
          cursor: pointer;
          transition: all 0.2s ease;
          
          &:hover {
            background: rgba(255, 255, 255, 0.2);
            transform: scale(1.05);
          }
        }
      }

      .pre-code {
        position: relative;
        padding: 16px;
        font-family: 'Fira Code', monospace;
        line-height: 1.5;

        &::after {
          content: "";
          position: absolute;
          top: 0;
          right: 0;
          bottom: 0;
          left: 0;
          background: linear-gradient(to right, transparent 0%, rgba(255, 255, 255, 0.03) 100%);
          pointer-events: none;
        }
        
        code {
          font-family: inherit;
        }
      }
    }
    
    /* 打字机效果 */
    .typing-effect {
      display: inline-block;
      border-right: 2px solid #7c3aed;
      animation: blink 0.7s step-end infinite;
    }
  }
}

/* 暗黑主题优化 */
.dark {
  .llm-dialog-box {
    :deep(.llm-dialog-page) {
      background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);

      .chat-left {
        background: #1e293b;
        color: #e2e8f0;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
        
        &::after {
          background: #1e293b;
          box-shadow: 4px 4px 10px rgba(0, 0, 0, 0.3);
        }
        
        &::before {
          background: linear-gradient(90deg, #4f46e5, #7c3aed);
        }
      }

      .chat-right {
        background: #4f46e5;
        color: #e2e8f0;
        box-shadow: 0 4px 20px rgba(79, 70, 229, 0.3);
        
        &::after {
          background: #4f46e5;
        }
      }

      .dialog-input {
        background: rgba(30, 41, 59, 0.8);
        box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.2);
        border-color: rgba(51, 65, 85, 0.5);

        &:focus-within {
          background: rgba(30, 41, 59, 0.95);
          border-color: rgba(99, 102, 241, 0.5);
        }

        textarea {
          color: #e2e8f0;
          caret-color: #818cf8;
        }

        .btn-small {
          background: #334155;
          color: #94a3b8;

          &:hover {
            background: #475569;
            color: #e2e8f0;

            svg {
              color: #818cf8;
            }
          }
        }
      }

      pre.pre-code-box {
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);

        .pre-code-header {
          background: #334155;
          color: #e2e8f0;

          button {
            background: rgba(255, 255, 255, 0.1);
            
            &:hover {
              background: rgba(255, 255, 255, 0.15);
            }
          }
        }

        .pre-code {
          background: #1e1e1e;

          &::after {
            background: linear-gradient(to right, transparent 0%, rgba(0, 0, 0, 0.1) 100%);
          }
        }
      }
      
      .typing-effect {
        border-color: #818cf8;
      }
    }
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(124, 58, 237, 0.4);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(124, 58, 237, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(124, 58, 237, 0);
  }
}

@keyframes blink {
  from,
  to {
    border-color: transparent;
  }
  50% {
    border-color: #7c3aed;
  }
}
</style>
