<template>
  <section class="chat-page">
    <header class="page-header">
      <div>
        <p class="eyebrow">AI Chat</p>
        <h1>聊天工作台</h1>
        <p>最小化保留模型选择、会话列表和流式回复。</p>
      </div>
      <div class="header-actions">
        <ScButton @click="router.push('/ai/home')">返回首页</ScButton>
        <ScButton type="primary" plain @click="router.push('/ai/settings')">
          模型设置
        </ScButton>
      </div>
    </header>

    <div class="layout">
      <aside class="session-panel">
        <div class="panel-title">会话</div>
        <ScButton class="full-btn" type="primary" @click="createSession">
          新建会话
        </ScButton>
        <div class="session-list">
          <button
            v-for="item in sessions"
            :key="item.sysAiSessionId"
            type="button"
            class="session-item"
            :class="{ active: currentSessionId === item.sysAiSessionId }"
            @click="selectSession(item.sysAiSessionId)"
          >
            <strong>{{ item.sysAiSessionTitle }}</strong>
            <span>{{ item.updateTime || item.createTime || '刚刚' }}</span>
          </button>
        </div>
      </aside>

      <main class="chat-panel">
        <div class="composer">
          <label class="field">
            <span>模型</span>
            <select v-model="modelCode">
              <option value="">请选择模型</option>
              <option v-for="item in modules" :key="item.sysAiModuleCode" :value="item.sysAiModuleCode">
                {{ item.sysAiModuleName }}
              </option>
            </select>
          </label>
          <label class="field">
            <span>系统提示</span>
            <input v-model="systemPrompt" type="text" placeholder="可选：系统提示词" />
          </label>
        </div>

        <div class="messages">
          <article
            v-for="item in messages"
            :key="item.sysAiMessageId"
            class="message"
            :class="item.sysAiMessageRole"
          >
            <div class="role">{{ item.sysAiMessageRole }}</div>
            <div class="content">{{ item.sysAiMessageContent }}</div>
          </article>
          <article v-if="streamingMessage" class="message assistant">
            <div class="role">assistant</div>
            <div class="content">{{ streamingMessage }}</div>
          </article>
        </div>

        <div class="prompt-box">
          <textarea v-model="prompt" rows="5" placeholder="输入你的问题" />
          <div class="actions">
            <ScButton @click="reloadCurrentSession">刷新消息</ScButton>
            <ScButton type="primary" :loading="sending" @click="sendPrompt">
              发送
            </ScButton>
          </div>
        </div>
      </main>
    </div>
  </section>
</template>

<script setup lang="ts">
import { fetchEventSource } from "@microsoft/fetch-event-source";
import { ScButton } from "@repo/components/ScButton";
import { message } from "@repo/utils";
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { streamAiChat } from "../../../api/ai/chat";
import { listAiModules, type AiModule } from "../../../api/ai/module";
import {
  listAiMessages,
  listAiSessions,
  saveAiSession,
  type AiMessage,
  type AiSession,
} from "../../../api/ai/session";

const router = useRouter();
const modules = ref<AiModule[]>([]);
const sessions = ref<AiSession[]>([]);
const messages = ref<AiMessage[]>([]);
const currentSessionId = ref<number | null>(null);
const modelCode = ref("");
const prompt = ref("");
const systemPrompt = ref("");
const sending = ref(false);
const streamingMessage = ref("");

const loadModules = async () => {
  const res = await listAiModules("LLM");
  modules.value = res.data || [];
  if (!modelCode.value && modules.value.length > 0) {
    modelCode.value = modules.value[0].sysAiModuleCode;
  }
};

const loadSessions = async () => {
  const res = await listAiSessions("CHAT");
  sessions.value = res.data || [];
  if (!currentSessionId.value && sessions.value.length > 0) {
    currentSessionId.value = sessions.value[0].sysAiSessionId;
    await reloadCurrentSession();
  }
};

const reloadCurrentSession = async () => {
  if (!currentSessionId.value) {
    messages.value = [];
    return;
  }
  const res = await listAiMessages(currentSessionId.value);
  messages.value = res.data || [];
};

const createSession = async () => {
  const title = prompt.value.trim().slice(0, 12) || `新会话 ${sessions.value.length + 1}`;
  const res = await saveAiSession({
    sysAiSessionTitle: title,
    sysAiSessionType: "CHAT",
    sysAiModuleCode: modelCode.value,
  });
  currentSessionId.value = res.data?.sysAiSessionId || null;
  await loadSessions();
  await reloadCurrentSession();
};

const selectSession = async (id: number) => {
  currentSessionId.value = id;
  await reloadCurrentSession();
};

const sendPrompt = async () => {
  if (!prompt.value.trim()) {
    message("请输入问题", { type: "warning" });
    return;
  }
  if (!modelCode.value) {
    message("请选择模型", { type: "warning" });
    return;
  }
  if (!currentSessionId.value) {
    await createSession();
  }
  sending.value = true;
  streamingMessage.value = "";
  try {
    const request = streamAiChat({
      sessionId: currentSessionId.value || undefined,
      modelCode: modelCode.value,
      prompt: prompt.value,
      system: systemPrompt.value,
    });
    const controller = new AbortController();
    await fetchEventSource(request.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: request.body,
      signal: controller.signal,
      onmessage(event) {
        const payload = JSON.parse(event.data);
        if (payload.output) {
          streamingMessage.value += payload.output;
        }
        if (payload.done) {
          controller.abort();
        }
      },
      onerror(error) {
        throw error;
      },
    });
  } catch (error) {
    if (String((error as Error)?.name) !== "AbortError") {
      console.error(error);
      message("发送失败", { type: "error" });
    }
  } finally {
    sending.value = false;
    prompt.value = "";
    await loadSessions();
    await reloadCurrentSession();
    streamingMessage.value = "";
  }
};

onMounted(async () => {
  await loadModules();
  await loadSessions();
});
</script>

<style scoped lang="scss">
.chat-page {
  padding: 28px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 20px;
  margin-bottom: 24px;

  h1 {
    margin: 6px 0 10px;
    font-size: 34px;
    color: #0f172a;
  }

  p {
    margin: 0;
    color: #475569;
  }
}

.eyebrow {
  margin: 0;
  font-size: 12px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: #2563eb;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.layout {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 20px;
}

.session-panel,
.chat-panel {
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 18px 50px rgba(15, 23, 42, 0.08);
  padding: 22px;
}

.panel-title {
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 12px;
}

.full-btn {
  width: 100%;
  margin-bottom: 14px;
}

.session-list {
  display: grid;
  gap: 10px;
}

.session-item {
  padding: 14px;
  border: 0;
  border-radius: 16px;
  background: #f8fafc;
  text-align: left;
  cursor: pointer;

  &.active {
    background: linear-gradient(135deg, #dbeafe, #e0f2fe);
  }

  strong {
    display: block;
    color: #0f172a;
  }

  span {
    display: block;
    margin-top: 6px;
    font-size: 12px;
    color: #64748b;
  }
}

.composer {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  margin-bottom: 16px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 8px;

  span {
    font-weight: 600;
    color: #0f172a;
  }
}

.field input,
.field select,
.prompt-box textarea {
  width: 100%;
  border: 1px solid #dbe3f0;
  border-radius: 16px;
  padding: 12px 14px;
  background: #f8fafc;
}

.messages {
  display: grid;
  gap: 12px;
  min-height: 360px;
  max-height: 520px;
  overflow: auto;
  padding: 6px 0 18px;
}

.message {
  max-width: 82%;
  padding: 14px 16px;
  border-radius: 20px;
  background: #f8fafc;

  &.user {
    justify-self: end;
    background: linear-gradient(135deg, #2563eb, #1d4ed8);
    color: #fff;
  }

  &.assistant {
    justify-self: start;
  }
}

.role {
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  margin-bottom: 6px;
  opacity: 0.75;
}

.content {
  white-space: pre-wrap;
  line-height: 1.6;
}

.prompt-box {
  display: grid;
  gap: 12px;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

@media (max-width: 960px) {
  .layout {
    grid-template-columns: 1fr;
  }

  .composer {
    grid-template-columns: 1fr;
  }

  .page-header {
    flex-direction: column;
  }
}
</style>
