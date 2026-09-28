<script setup lang="ts">
// @ts-nocheck

// @ts-nocheck
import { ref, computed, onMounted, watch } from "vue";
import { getConfig, getStorageKey } from "@repo/config";
import { http } from "@repo/core";
import ReAvatar3D from "@repo/ui/ReAvatar3D";

const STORAGE_KEY = getStorageKey("ai-character-messages");
const CONV_ID = "ai-character-default";
const POS_KEY = getStorageKey("ai-character-pos");

function loadMessages(): { role: string; content: string }[] {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY}-${CONV_ID}`);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveMessages(msgs: { role: string; content: string }[]) {
  try {
    localStorage.setItem(`${STORAGE_KEY}-${CONV_ID}`, JSON.stringify(msgs));
  } catch { /* ignore */ }
}

const appConfig = getConfig();
const aiChat = computed(() => appConfig.other.aiChat);

const visible = computed(() => aiChat.value.aiChatEnabled);
const popoverVisible = ref(false);
const charMode = computed(() => aiChat.value.aiChatCharacter || "3d");
const modelUrl = computed(() => aiChat.value.aiChatModelUrl || "/assets/models/ai-character.glb");

const charX = ref(0);
const charY = ref(0);
const charSize = computed(() => aiChat.value.aiChatCharacterSize || 72);
const dragging = ref(false);
const startX = ref(0);
const startY = ref(0);
const startCharX = ref(0);
const startCharY = ref(0);
const charRef = ref<HTMLElement>();
const popoverRef = ref<HTMLElement>();
let clickMoved = false;

const avatarStyle = computed(() => {
  const skin = aiChat.value.aiChatSkin || "default";
  if (skin === "default") return {};
  if (skin.startsWith("http://") || skin.startsWith("https://")) {
    return { backgroundImage: `url(${skin})`, backgroundSize: "cover", backgroundPosition: "center" };
  }
  const presets: Record<string, string> = {
    cat: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
    ocean: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
    forest: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
    sunset: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
    night: "linear-gradient(135deg, #2c3e50 0%, #3498db 100%)",
  };
  return { background: presets[skin] || "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" };
});

/** 弹出窗位置：以角色右侧为锚点，自适应视口边界 */
const popoverStyle = computed(() => {
  const anchorX = charX.value + charSize.value + 8;
  const anchorY = charY.value;
  const pw = 360;
  const ph = 480;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  let left = anchorX;
  let top = anchorY;
  if (left + pw > vw - 8) left = charX.value - pw - 8;
  if (top + ph > vh - 8) top = vh - ph - 8;
  if (left < 8) left = 8;
  if (top < 8) top = 8;
  return { left: left + 'px', top: top + 'px' };
});

const messages = ref<{ role: string; content: string }[]>([]);
const inputText = ref("");
const sending = ref(false);

onMounted(() => {
  const saved = localStorage.getItem(POS_KEY);
  if (saved) {
    try {
      const pos = JSON.parse(saved);
      charX.value = pos.x;
      charY.value = pos.y;
    } catch {
      charX.value = window.innerWidth - 120;
      charY.value = window.innerHeight - 160;
    }
  } else {
    charX.value = window.innerWidth - 120;
    charY.value = window.innerHeight - 160;
  }
});

watch(popoverVisible, async (val) => {
  if (val) {
    messages.value = loadMessages();
    if (messages.value.length === 0) {
      messages.value = [{ role: "assistant", content: "你好！我是 AI 助手，有什么可以帮助你的吗？" }];
    }
  }
});

watch(visible, (val) => {
  if (!val) popoverVisible.value = false;
});

function onDragStart(e: PointerEvent) {
  dragging.value = true;
  clickMoved = false;
  startX.value = e.clientX;
  startY.value = e.clientY;
  startCharX.value = charX.value;
  startCharY.value = charY.value;
  charRef.value?.setPointerCapture(e.pointerId);
}

function onDragMove(e: PointerEvent) {
  if (!dragging.value) return;
  const dx = e.clientX - startX.value;
  const dy = e.clientY - startY.value;
  if (Math.abs(dx) > 3 || Math.abs(dy) > 3) clickMoved = true;
  charX.value = startCharX.value + dx;
  charY.value = startCharY.value + dy;
}

function onDragEnd(e: PointerEvent) {
  dragging.value = false;
  charRef.value?.releasePointerCapture(e.pointerId);
  localStorage.setItem(POS_KEY, JSON.stringify({ x: charX.value, y: charY.value }));
}

function onClick() {
  if (clickMoved) return;
  popoverVisible.value = !popoverVisible.value;
}

async function sendMessage() {
  const text = inputText.value.trim();
  if (!text || sending.value) return;
  inputText.value = "";
  messages.value.push({ role: "user", content: text });
  sending.value = true;
  try {
    const { data } = await http().post(aiChat.value.aiChatApiUrl || "/v1/chat/completions")
      .headers(aiChat.value.aiChatApiKey ? { Authorization: `Bearer ${aiChat.value.aiChatApiKey}` } : {})
      .data({
        model: aiChat.value.aiChatModel,
        messages: messages.value.map((m) => ({ role: m.role, content: m.content })),
        max_tokens: aiChat.value.aiChatMaxTokens,
        temperature: aiChat.value.aiChatTemperature,
      });
    const reply = data.choices?.[0]?.message?.content || "抱歉，我没有理解你的问题。";

    messages.value.push({ role: "assistant", content: reply });

    // 第 N 轮压缩：达到阈值后，历史（除最近 N 轮外）压缩为摘要，保留最近 N 轮原始对话
    if (aiChat.value.aiChatSummaryEnabled) {
      const limit = aiChat.value.aiChatContextLimit;
      const retainRounds = Math.max(1, aiChat.value.aiChatSummaryRetainRounds || 6);
      const minKeep = 1 + retainRounds * 2; // 欢迎语 + N 轮（user+assistant）
      if (limit > 0 && messages.value.length >= limit && messages.value.length > minKeep) {
        const retained = messages.value.slice(-retainRounds * 2);
        const head = messages.value.slice(0, messages.value.length - retainRounds * 2);
        const userParts = head.filter((m) => m.role === "user").map((m) => m.content).join("；");
        const summary = `以下是之前对话的摘要：${userParts}`;
        messages.value = [
          { role: "system", content: summary },
          ...retained,
        ];
      }
    } else if (aiChat.value.aiChatContextLimit > 0) {
      // 未启用压缩时仅截断上下文上限
      const limit = aiChat.value.aiChatContextLimit;
      if (messages.value.length > limit) {
        messages.value = messages.value.slice(-limit);
      }
    }

    await saveMessages(messages.value);
  } catch (e) {
    messages.value.push({ role: "assistant", content: `请求失败：${e instanceof Error ? e.message : String(e)}` });
  } finally {
    sending.value = false;
  }
}

function handleClear() {
  messages.value = [{ role: "assistant", content: "你好！我是 AI 助手，有什么可以帮助你的吗？" }];
  saveMessages(messages.value);
}
</script>

<template>
  <Teleport to="body">
    <div v-if="visible" style="display: none;"></div>
    <div
      ref="charRef"
      v-if="visible"
      class="ai-character"
      :class="{ 'ai-character--dragging': dragging, 'ai-character--active': popoverVisible }"
      :style="{
        left: charX + 'px',
        top: charY + 'px',
      }"
      @pointerdown.prevent="onDragStart"
      @pointermove="onDragMove"
      @pointerup="onDragEnd"
      @pointercancel="onDragEnd"
      @click="onClick"
    >
      <div v-if="charMode === '3d'" class="ai-character__avatar ai-character__avatar--3d">
        <ReAvatar3D :model-url="modelUrl" :width="charSize" :height="charSize" :auto-rotate-speed="0" interactive />
      </div>
      <div v-else class="ai-character__avatar" :style="avatarStyle">
        <svg v-if="(aiChat.aiChatSkin || 'default') === 'default'" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="8" width="18" height="12" rx="2"/>
          <circle cx="9" cy="14" r="1.5" fill="currentColor" stroke="none"/>
          <circle cx="15" cy="14" r="1.5" fill="currentColor" stroke="none"/>
          <path d="M9 3 L12 6 L15 3"/>
          <path d="M12 6 L12 8"/>
        </svg>
      </div>
      <div class="ai-character__tooltip">AI 助手</div>
    </div>

    <div
      v-if="popoverVisible"
      ref="popoverRef"
      class="ai-popover"
      :style="popoverStyle"
    >
      <div class="ai-popover__header">
        <span>AI 助手</span>
        <div class="ai-popover__actions">
          <el-button link @click="handleClear">清空</el-button>
          <el-button link @click="popoverVisible = false">✕</el-button>
        </div>
      </div>
      <div class="ai-popover__body">
        <div v-for="(msg, i) in messages" :key="i" class="ai-popover__msg" :class="msg.role">
          <div class="msg-content">{{ msg.content }}</div>
        </div>
      </div>
      <div class="ai-popover__footer">
        <el-input
          v-model="inputText"
          placeholder="输入消息..."
          :disabled="sending"
          @keyup.enter="sendMessage"
        >
          <template #append>
            <el-button :loading="sending" @click="sendMessage">发送</el-button>
          </template>
        </el-input>
      </div>
    </div>
  </Teleport>
</template>

<style lang="scss" scoped>
.ai-character {
  position: fixed;
  z-index: 99990;
  cursor: grab;
  user-select: none;
  touch-action: none;

  &--dragging {
    cursor: grabbing;
    opacity: 0.85;
  }

  &--active {
    .ai-character__avatar {
      transform: scale(1.08);
      box-shadow: 0 6px 24px rgba(102, 126, 234, 0.55);
    }
    .ai-character__avatar--3d {
      box-shadow: none;
    }
  }

  &__avatar {
    width: v-bind(charSize + 'px');
    height: v-bind(charSize + 'px');
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: #fff;
    box-shadow: 0 4px 16px rgba(102, 126, 234, 0.4);
    transition: transform 0.2s, box-shadow 0.2s;
    overflow: hidden;

    &--3d {
      background: transparent;
      box-shadow: none;
      border-radius: 50%;
    }
  }

  &:hover &__avatar--3d {
    transform: scale(1.08);
    box-shadow: none;
  }

  &__tooltip {
    position: absolute;
    top: -28px;
    left: 50%;
    transform: translateX(-50%);
    white-space: nowrap;
    padding: 3px 10px;
    font-size: 11px;
    font-weight: 600;
    color: #fff;
    background: rgba(0, 0, 0, 0.7);
    border-radius: 6px;
    opacity: 0;
    transition: opacity 0.2s;
    pointer-events: none;
  }

  &:hover &__tooltip {
    opacity: 1;
  }
}

.ai-popover {
  position: fixed;
  z-index: 99991;
  width: 360px;
  max-height: 480px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-light);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  overflow: hidden;

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 14px;
    font-weight: 600;
    font-size: 14px;
    border-bottom: 1px solid var(--el-border-color-light);
  }

  &__actions {
    display: flex;
    gap: 4px;
  }

  &__body {
    flex: 1;
    overflow-y: auto;
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  &__msg {
    max-width: 85%;

    &.user {
      align-self: flex-end;
      .msg-content {
        background: var(--el-color-primary-light-8);
        color: var(--el-color-primary-dark-2);
        border-radius: 12px 4px 12px 12px;
      }
    }

    &.assistant {
      align-self: flex-start;
      .msg-content {
        background: var(--el-fill-color-light);
        color: var(--el-text-color-primary);
        border-radius: 4px 12px 12px 12px;
      }
    }
  }

  .msg-content {
    padding: 8px 12px;
    font-size: 13px;
    line-height: 1.5;
    white-space: pre-wrap;
    word-break: break-word;
  }

  &__footer {
    padding: 10px 12px;
    border-top: 1px solid var(--el-border-color-light);
  }
}
</style>