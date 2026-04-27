<template>
  <section class="ai-studio">
    <div class="chat-container">
      <aside
        class="conversation-panel"
        :class="{ collapsed: isConversationCollapsed }"
        :style="{ width: `${conversationPanelWidth}px` }"
      >
        <div class="conversation-header">
          <div v-if="!isConversationCollapsed" class="header-content">
            <div class="header-icon">
              <IconifyIconOnline icon="ri:chat-3-line" />
            </div>
            <span class="conversation-title">会话管理</span>
          </div>
          <el-button text class="collapse-btn" @click="toggleConversationPanel">
            {{ isConversationCollapsed ? "›" : "‹" }}
          </el-button>
        </div>

        <div class="conversation-resizer" @mousedown.prevent="startResize" />

        <div v-if="!isConversationCollapsed" class="conversation-content thin-scroller">
          <div class="quick-actions">
            <button class="action-item" type="button" @click="createSession">
              <div class="action-icon">
                <IconifyIconOnline icon="ri:add-circle-line" />
              </div>
              <span class="action-text">新建会话</span>
            </button>
          </div>

          <div class="history-section">
            <div class="section-header">
              <span>历史会话</span>
            </div>

            <Conversations
              :items="conversationItems"
              :active="activeSessionId"
              :labelKey="'sysAiSessionTitle'"
              :rowKey="'sysAiSessionId'"
              :groupable="false"
              class="conversation-list"
              @change="handleConversationChange"
              @update:active="handleActiveChange"
            />
          </div>
        </div>
      </aside>

      <main class="chat-main" :class="{ expanded: isConversationCollapsed }">
        <div class="chat-main__header">
          <div class="chat-main__headline">
            <div class="chat-main__title">
              {{ activeSessionTitle || "未选择会话" }}
            </div>
            <el-tag class="chat-main__model-tag" :type="modelCode ? 'primary' : 'info'" round>
              {{ activeModelLabel || "未设置模型" }}
            </el-tag>
            <el-tag
              v-if="currentModelSupportsThink && thinkEnabled"
              class="chat-main__model-tag"
              type="danger"
              round
            >
              深度思考
            </el-tag>
          </div>
          <el-tooltip content="删除会话" placement="bottom">
            <el-button
              :disabled="!activeSessionId"
              text
              type="danger"
              class="header-delete-btn"
              @click="removeSession"
            >
              <IconifyIconOnline icon="ri:delete-bin-line" />
            </el-button>
          </el-tooltip>
        </div>

        <div class="messages-area">
          <BubbleList
            ref="bubbleListRef"
            class="messages-area__list"
            :list="bubbleItems"
            max-height="100%"
            :auto-scroll="false"
            :show-back-button="true"
            trigger-indices="only-last"
          >
            <template #content="{ item }">
              <div class="bubble-card">
                <ThoughtChain
                  v-if="item.placement === 'start' && item.thoughtChain?.length"
                  class="thought-chain"
                  :thinking-items="item.thoughtChain"
                  max-width="100%"
                />

                <Typewriter
                  v-if="item.placement === 'start' && item.renderMode === 'typing'"
                  class="assistant-typewriter"
                  :content="item.content"
                  :typing="{ step: 2, interval: 18, isRequestEnd: item.requestEnd === true }"
                  @finish="handleTypingFinish(item.localId)"
                />

                <XMarkdown
                  v-else-if="item.placement === 'start'"
                  class="assistant-markdown vp-raw"
                  :markdown="item.content"
                  :allowHtml="true"
                />

                <div v-else class="user-content">{{ item.content }}</div>
              </div>
            </template>
          </BubbleList>
        </div>

        <div class="input-area">
          <EditorSender
            ref="editorSenderRef"
            v-model="draft"
            :loading="submitting"
            :max-length="2000"
            clearable
            auto-focus
            placeholder="请输入你的问题，Enter 换行，Shift+Enter 发送"
            variant="updown"
            submit-type="shiftEnter"
            class="editor-sender"
            @submit="handleSubmitMessage"
            @change="syncDraftFromEditor"
          >
            <template #header>
              <div v-if="uploadedImages.length > 0" class="file-preview-header">
                <div class="file-preview-title">
                  <IconifyIconOnline icon="ri:image-2-line" />
                  <span>已添加 {{ uploadedImages.length }} 张图片</span>
                </div>
              </div>
            </template>

            <template #action-list>
              <div class="action-buttons">
                <div class="composer-model">
                  <el-tooltip
                    :content="activeModelTooltip"
                    placement="top-start"
                    :disabled="!modelCode"
                  >
                    <el-select v-model="modelCode" placeholder="选择模型" size="default">
                    <template #label="{ label, value }">
                      <div class="composer-model__label">
                        <div class="composer-model__avatar">
                          <img
                            v-if="getModelOption(value)?.image"
                            :src="getModelOption(value)?.image"
                            :alt="label"
                          />
                          <span v-else>{{ getModelOption(value)?.shortName || "AI" }}</span>
                        </div>
                        <span class="composer-model__label-text">{{ label }}</span>
                      </div>
                    </template>
                    <el-option
                      v-for="item in modelOptions"
                      :key="item.value"
                      :label="item.label"
                      :value="item.value"
                    >
                      <div class="composer-model__option">
                        <div class="composer-model__avatar">
                          <img v-if="item.image" :src="item.image" :alt="item.label" />
                          <span v-else>{{ item.shortName }}</span>
                        </div>
                        <div class="composer-model__option-copy">
                          <span class="composer-model__option-name">{{ item.name }}</span>
                          <small class="composer-model__option-code">{{ item.value }}</small>
                        </div>
                      </div>
                    </el-option>
                    </el-select>
                  </el-tooltip>
                </div>

                <input
                  ref="imageInputRef"
                  class="ai-studio__file-input"
                  type="file"
                  accept="image/*"
                  @change="handleImageChange"
                />

                <el-tooltip
                  v-if="currentModelSupportsVision"
                  content="上传图片理解"
                  placement="top"
                >
                  <el-button text class="action-icon-btn" @click="openImagePicker">
                    <IconifyIconOnline icon="ri:image-line" />
                  </el-button>
                </el-tooltip>

                <el-tooltip
                  v-if="currentModelSupportsThink"
                  :content="thinkEnabled ? '关闭深度思考' : '开启深度思考'"
                  placement="top"
                >
                  <el-button
                    text
                    class="action-icon-btn"
                    :class="{ 'action-icon-btn--active': thinkEnabled }"
                    @click="toggleThink"
                  >
                    <IconifyIconOnline icon="ri:brain-line" />
                  </el-button>
                </el-tooltip>

                <el-tooltip
                  v-if="currentModelSupportsOptimize"
                  :content="optimizing ? '优化中' : '优化输入'"
                  placement="top"
                >
                  <el-button
                    text
                    class="action-icon-btn"
                    :disabled="optimizing || submitting"
                    @click="optimizeComposer"
                  >
                    <IconifyIconOnline
                      :class="{ 'send-btn__spinner': optimizing }"
                      icon="ri:magic-line"
                    />
                  </el-button>
                </el-tooltip>

                <el-tooltip content="清空输入" placement="top">
                  <el-button text class="action-icon-btn" @click="clearComposer">
                    <IconifyIconOnline icon="ri:delete-bin-line" />
                  </el-button>
                </el-tooltip>

                <el-tooltip :content="submitting ? '中断回复' : '发送消息'" placement="top">
                  <el-button
                    type="primary"
                    class="send-btn"
                    :disabled="optimizing || (!submitting && !canSend)"
                    @click="handlePrimaryAction"
                  >
                    <template v-if="submitting">
                      <IconifyIconOnline class="send-btn__spinner" icon="line-md:loading-twotone-loop" />
                      <span>中断</span>
                    </template>
                    <template v-else>
                      <IconifyIconOnline icon="ri:send-plane-2-line" />
                    </template>
                  </el-button>
                </el-tooltip>
              </div>
            </template>

            <template #footer>
              <div v-if="uploadedImages.length > 0" class="file-preview-footer">
                <div class="file-list">
                  <div
                    v-for="(item, index) in uploadedImages"
                    :key="`${item.name}-${index}`"
                    class="file-item"
                  >
                    <div class="file-info">
                      <span class="file-icon">🖼</span>
                      <span class="file-name">{{ item.name }}</span>
                    </div>
                    <el-button text class="remove-btn" @click="removeImage(index)">×</el-button>
                  </div>
                </div>
              </div>
            </template>
          </EditorSender>
        </div>
      </main>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import {
  BubbleList,
  Conversations,
  EditorSender,
  ThoughtChain,
  Typewriter,
  XMarkdown,
  type SubmitResult,
} from "vue-element-plus-x";
import { ElButton, ElOption, ElSelect, ElTag, ElTooltip } from "element-plus";
import { message, localStorageProxy } from "@repo/utils";
import { IconifyIconOnline } from "@repo/components/ReIcon";
import { userKey } from "@repo/config";
import { optimizeAiChatInput, streamAiChat } from "../../../api/ai/chat";
import { listAiGlobalSettings } from "../../../api/ai/global-setting";
import { listAiModules } from "../../../api/ai/module";
import {
  deleteAiSession,
  listAiMessages,
  listAiSessions,
  saveAiSession,
  type AiMessage,
  type AiSession,
  type AiSession as AiSessionEntity,
} from "../../../api/ai/session";

type UploadedImage = {
  name: string;
  type: string;
  url: string;
};

type ModelOption = {
  value: string;
  label: string;
  name: string;
  image: string;
  shortName: string;
  vlm: boolean;
  think: boolean;
  optimize: boolean;
};

type ThoughtItem = {
  id: string;
  title: string;
  thinkTitle?: string;
  thinkContent: string;
  status: "loading" | "success" | "error";
  isCanExpand: boolean;
  isDefaultExpand?: boolean;
  isMarkdown?: boolean;
};

type LocalMessage = AiMessage & {
  localId: string;
  renderMode?: "typing" | "markdown";
  requestEnd?: boolean;
  streaming?: boolean;
  thoughtChain?: ThoughtItem[];
};

type BubbleItem = LocalMessage & {
  placement: "start" | "end";
  variant: "filled" | "borderless" | "outlined" | "shadow";
  shape: "round";
  avatar: string;
  avatarSrcSet?: string;
  avatarSize: string;
  name: string;
};

const sessions = ref<AiSession[]>([]);
const messages = ref<LocalMessage[]>([]);
const modelOptions = ref<ModelOption[]>([]);
const activeSessionId = ref<number>();
const draft = ref("");
const modelCode = ref("");
const submitting = ref(false);
const optimizing = ref(false);
const thinkEnabled = ref(false);
const uploadedImages = ref<UploadedImage[]>([]);
const imageInputRef = ref<HTMLInputElement>();
const editorSenderRef = ref<any>();
const bubbleListRef = ref<any>();
const isConversationCollapsed = ref(false);
const conversationPanelWidth = ref(280);
const isResizing = ref(false);
const runtimeDefaultModel = ref("");
const streamController = ref<AbortController>();
const activeAssistantMessageId = ref<string>();
const optimizeTypingTimer = ref<ReturnType<typeof setTimeout> | null>(null);

const conversationItems = computed(() => sessions.value);

const activeSessionTitle = computed(
  () =>
    sessions.value.find((item) => item.sysAiSessionId === activeSessionId.value)
      ?.sysAiSessionTitle,
);

const activeModel = computed(() =>
  modelOptions.value.find((item) => item.value === modelCode.value),
);

const getModelOption = (value?: string) =>
  modelOptions.value.find((item) => item.value === value);

const activeModelLabel = computed(() => activeModel.value?.label || modelCode.value);

const currentModelSupportsVision = computed(() => activeModel.value?.vlm === true);
const currentModelSupportsThink = computed(() => activeModel.value?.think === true);
const currentModelSupportsOptimize = computed(() => activeModel.value?.optimize === true);
const canSend = computed(
  () => draft.value.trim().length > 0 || uploadedImages.value.length > 0,
);

const cachedUserInfo = computed<Record<string, any>>(
  () => localStorageProxy().getItem<Record<string, any>>(userKey) || {},
);

const sanitizePrompt = (value?: string) =>
  String(value || "")
    .replace(/\uFEFF/g, "")
    .replace(/\u200B/g, "")
    .trim();

const buildModelShortName = (value?: string) =>
  (value || "AI")
    .trim()
    .replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, "")
    .slice(0, 2)
    .toUpperCase() || "AI";

const currentUserProfile = computed(() => {
  const nickname =
    cachedUserInfo.value?.sysUserNickname ||
    cachedUserInfo.value?.sysUserUsername ||
    "用户";
  const avatar =
    cachedUserInfo.value?.avatar || cachedUserInfo.value?.sysUserAvatar || "";
  return {
    name: nickname,
    avatar,
    fallback: String(nickname).trim().charAt(0) || "你",
  };
});

const currentAssistantProfile = computed(() => {
  const label = (activeModelLabel.value || "AI助手").replace(/\s*\(.+\)\s*$/, "");
  return {
    name: label,
    avatar: "",
    fallback: "AI",
  };
});

const bubbleItems = computed<BubbleItem[]>(() =>
  messages.value.map((item) => ({
    ...item,
    content: item.sysAiMessageContent,
    placement: item.sysAiMessageRole === "assistant" ? "start" : "end",
    variant: item.sysAiMessageRole === "assistant" ? "outlined" : "filled",
    shape: "round",
    avatar:
      item.sysAiMessageRole === "assistant"
        ? currentAssistantProfile.value.fallback
        : currentUserProfile.value.fallback,
    avatarSrcSet:
      item.sysAiMessageRole === "assistant"
        ? currentAssistantProfile.value.avatar || undefined
        : currentUserProfile.value.avatar || undefined,
    avatarSize: "36px",
    name:
      item.sysAiMessageRole === "assistant"
        ? currentAssistantProfile.value.name
        : currentUserProfile.value.name,
  })),
);

const toLocalMessage = (item: AiMessage): LocalMessage => ({
  ...item,
  localId: String(item.sysAiMessageId),
  renderMode: item.sysAiMessageRole === "assistant" ? "markdown" : undefined,
  requestEnd: true,
  streaming: false,
  thoughtChain: [],
});

const createThoughtChain = (): ThoughtItem[] => [
  {
    id: "context",
    title: "上下文",
    thinkTitle: "读取当前会话上下文",
    thinkContent: "正在装载当前会话历史、模型配置和附加图片上下文。",
    status: "success",
    isCanExpand: true,
    isDefaultExpand: true,
  },
  {
    id: "reasoning",
    title: "深度思考",
    thinkTitle: "模型正在拆解问题",
    thinkContent: "模型正在梳理约束、规划步骤并生成推理过程。",
    status: "loading",
    isCanExpand: true,
    isDefaultExpand: true,
  },
  {
    id: "answer",
    title: "整理答案",
    thinkTitle: "准备输出最终回复",
    thinkContent: "等待模型组织最终内容。",
    status: "loading",
    isCanExpand: true,
  },
];

const updateThoughtChain = (
  messageId: string,
  patcher: (items: ThoughtItem[]) => ThoughtItem[],
) => {
  messages.value = messages.value.map((item) => {
    if (item.localId !== messageId) {
      return item;
    }
    return {
      ...item,
      thoughtChain: patcher([...(item.thoughtChain || [])]),
    };
  });
};

const setThoughtChainStreaming = (messageId: string) => {
  updateThoughtChain(messageId, (items) =>
    items.map((item) => {
      if (item.id === "reasoning") {
        return {
          ...item,
          status: "success",
          thinkContent: "模型已完成问题拆解，正在持续输出答案。",
        };
      }
      if (item.id === "answer") {
        return {
          ...item,
          status: "loading",
          thinkContent: "正在按流式片段组织最终回复。",
        };
      }
      return item;
    }),
  );
};

const setThoughtChainDone = (messageId: string) => {
  updateThoughtChain(messageId, (items) =>
    items.map((item) => ({
      ...item,
      status: "success",
      thinkContent:
        item.id === "answer"
          ? "最终回复已生成完成。"
          : item.thinkContent,
    })),
  );
};

const setThoughtChainError = (messageId: string, errorText: string) => {
  updateThoughtChain(messageId, (items) =>
    items.map((item) => {
      if (item.id === "reasoning" || item.id === "answer") {
        return {
          ...item,
          status: "error",
          thinkContent: errorText,
        };
      }
      return item;
    }),
  );
};

const scrollToBottom = async () => {
  await nextTick();
  bubbleListRef.value?.scrollToBottom?.();
};

const ensureSession = async () => {
  if (activeSessionId.value) {
    return activeSessionId.value;
  }
  const res = await saveAiSession({
    sysAiSessionTitle: "新会话",
    sysAiSessionType: "CHAT",
    sysAiModuleCode: modelCode.value,
  });
  activeSessionId.value = res.data?.sysAiSessionId;
  await loadSessions();
  return activeSessionId.value;
};

const loadModels = async () => {
  const res = await listAiModules("LLM");
  modelOptions.value = (res.data || []).map((item) => ({
    value: item.sysAiModuleCode,
    label: `${item.sysAiModuleName} (${item.sysAiModuleCode})`,
    name: item.sysAiModuleName,
    image: item.sysAiModuleImage || "",
    shortName: buildModelShortName(item.sysAiModuleName),
    vlm: item.sysAiModuleVlm === 1,
    think: item.sysAiModuleSupportThink === 1,
    optimize: item.sysAiModuleSupportOptimize === 1,
  }));
  const runtimeMatched = modelOptions.value.find(
    (item) => item.value === runtimeDefaultModel.value,
  );
  if (runtimeMatched) {
    modelCode.value = runtimeMatched.value;
    return;
  }
  if (!modelCode.value && modelOptions.value.length > 0) {
    modelCode.value = modelOptions.value[0].value;
  }
};

const loadRuntimeDefaultModel = async () => {
  const res = await listAiGlobalSettings("runtime");
  const settings = res.data || [];
  runtimeDefaultModel.value =
    settings.find((item) => item.sysAiGlobalSettingField === "default_model")
      ?.sysAiGlobalSettingValue || "";
};

const refreshSessionsOnly = async () => {
  const res = await listAiSessions("CHAT");
  sessions.value = res.data || [];
};

const loadSessions = async () => {
  await refreshSessionsOnly();
  if (!activeSessionId.value && sessions.value.length > 0) {
    activeSessionId.value = sessions.value[0].sysAiSessionId;
  }
  if (activeSessionId.value) {
    await loadMessages(activeSessionId.value);
  }
};

const loadMessages = async (sessionId: number) => {
  const res = await listAiMessages(sessionId);
  messages.value = (res.data || []).map(toLocalMessage);
  await scrollToBottom();
};

const createSession = async () => {
  stopStreaming();
  const title = `会话 ${sessions.value.length + 1}`;
  const res = await saveAiSession({
    sysAiSessionTitle: title,
    sysAiSessionType: "CHAT",
    sysAiModuleCode: modelCode.value,
  });
  activeSessionId.value = res.data?.sysAiSessionId;
  messages.value = [];
  await loadSessions();
};

const removeSession = async () => {
  if (!activeSessionId.value) {
    return;
  }
  stopStreaming();
  await deleteAiSession(activeSessionId.value);
  message("会话已删除", { type: "success" });
  activeSessionId.value = undefined;
  messages.value = [];
  await loadSessions();
};

const handleConversationChange = async (item: AiSessionEntity) => {
  stopStreaming();
  activeSessionId.value = item.sysAiSessionId;
  await loadMessages(item.sysAiSessionId);
};

const handleActiveChange = async (value?: string | number) => {
  if (!value) {
    return;
  }
  stopStreaming();
  activeSessionId.value = Number(value);
  await loadMessages(Number(value));
};

const syncDraftFromEditor = () => {
  const current = editorSenderRef.value?.getCurrentValue?.();
  if (current?.text !== undefined) {
    draft.value = current.text;
  }
};

const getCurrentDraft = () => {
  const current = editorSenderRef.value?.getCurrentValue?.();
  if (current?.text !== undefined) {
    draft.value = current.text;
  }
  return sanitizePrompt(current?.text ?? draft.value);
};

const openImagePicker = () => {
  imageInputRef.value?.click();
};

const handleImageChange = (event: Event) => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) {
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    uploadedImages.value = [
      ...uploadedImages.value,
      {
        name: file.name,
        type: file.type,
        url: String(reader.result || ""),
      },
    ];
  };
  reader.readAsDataURL(file);
  input.value = "";
};

const removeImage = (index: number) => {
  uploadedImages.value.splice(index, 1);
};

const clearComposer = () => {
  draft.value = "";
  uploadedImages.value = [];
  editorSenderRef.value?.clear?.();
};

const stopOptimizeTyping = () => {
  if (optimizeTypingTimer.value) {
    clearTimeout(optimizeTypingTimer.value);
    optimizeTypingTimer.value = null;
  }
};

const applyDraftToEditorByTypewriter = (value: string) => {
  stopOptimizeTyping();
  draft.value = "";
  editorSenderRef.value?.clear?.();
  const chars = Array.from(value);
  let index = 0;

  const writeNext = () => {
    draft.value = chars.slice(0, index).join("");
    editorSenderRef.value?.setText?.(draft.value);
    editorSenderRef.value?.focusToEnd?.();
    if (index >= chars.length) {
      optimizeTypingTimer.value = null;
      return;
    }
    index += 1;
    optimizeTypingTimer.value = setTimeout(writeNext, 22);
  };

  index = 1;
  writeNext();
};

const optimizeComposer = async () => {
  const content = getCurrentDraft();
  if (!content) {
    message("请输入需要优化的内容", { type: "warning" });
    return;
  }
  if (!currentModelSupportsOptimize.value) {
    message("当前模型未开启输入优化", { type: "warning" });
    return;
  }
  optimizing.value = true;
  try {
    const res = await optimizeAiChatInput({
      modelCode: modelCode.value,
      prompt: content,
    });
    const optimized = sanitizePrompt(res.data?.text || "");
    if (!optimized) {
      throw new Error("模型未返回有效优化内容");
    }
    applyDraftToEditorByTypewriter(optimized);
    message("输入内容已优化", { type: "success" });
  } catch (error: any) {
    const errorText =
      error?.message || error?.response?.data?.msg || "输入优化失败，请稍后重试";
    message(errorText, { type: "error" });
  } finally {
    optimizing.value = false;
  }
};

const toggleThink = () => {
  if (!currentModelSupportsThink.value) {
    return;
  }
  thinkEnabled.value = !thinkEnabled.value;
};

const handlePrimaryAction = () => {
  if (submitting.value) {
    stopStreaming();
    return;
  }
  void submitMessage(getCurrentDraft());
};

const handleSubmitMessage = (payload: SubmitResult) => {
  void submitMessage(sanitizePrompt(payload?.text || getCurrentDraft()));
};

const finalizeAssistantMessage = (messageId: string, mode: "done" | "error" | "abort") => {
  messages.value = messages.value.map((item) => {
    if (item.localId !== messageId) {
      return item;
    }
    return {
      ...item,
      streaming: false,
      requestEnd: true,
      renderMode: item.renderMode || "typing",
    };
  });
  if (mode === "done") {
    setThoughtChainDone(messageId);
  }
  if (mode === "abort") {
    setThoughtChainError(messageId, "本次输出已被手动中断。");
  }
};

const handleTypingFinish = (messageId: string) => {
  messages.value = messages.value.map((item) => {
    if (item.localId !== messageId) {
      return item;
    }
    return {
      ...item,
      renderMode: "markdown",
      requestEnd: true,
      streaming: false,
    };
  });
};

const getActiveAssistantMessage = () =>
  messages.value.find((item) => item.localId === activeAssistantMessageId.value);

const stopStreaming = () => {
  if (!streamController.value) {
    return;
  }
  streamController.value.abort("user-stop");
  streamController.value = undefined;
  submitting.value = false;
  const assistant = getActiveAssistantMessage();
  if (assistant) {
    if (!assistant.sysAiMessageContent?.trim()) {
      assistant.sysAiMessageContent = "本次回复已中断。";
    }
    finalizeAssistantMessage(assistant.localId, "abort");
  }
  activeAssistantMessageId.value = undefined;
};

const submitMessage = async (payload: string) => {
  const content = sanitizePrompt(payload);
  if (!content && uploadedImages.value.length === 0) {
    return;
  }
  if (submitting.value) {
    return;
  }
  const sessionId = await ensureSession();
  if (!sessionId) {
    return;
  }

  const files = uploadedImages.value.map((item) => ({
    name: item.name,
    type: item.type,
    url: item.url,
  }));
  const currentThinkEnabled = currentModelSupportsThink.value && thinkEnabled.value;
  const userMessageId = `user-${Date.now()}`;
  const assistantMessageId = `assistant-${Date.now()}`;

  messages.value = [
    ...messages.value,
    {
      sysAiMessageId: Date.now(),
      sysAiSessionId: sessionId,
      sysAiMessageRole: "user",
      sysAiMessageType: "TEXT",
      sysAiMessageContent: content || "图片输入",
      localId: userMessageId,
      requestEnd: true,
      streaming: false,
    },
    {
      sysAiMessageId: Date.now() + 1,
      sysAiSessionId: sessionId,
      sysAiMessageRole: "assistant",
      sysAiMessageType: "TEXT",
      sysAiMessageContent: "",
      localId: assistantMessageId,
      renderMode: "typing",
      requestEnd: false,
      streaming: true,
      thoughtChain: currentThinkEnabled ? createThoughtChain() : [],
    },
  ];
  activeAssistantMessageId.value = assistantMessageId;
  draft.value = "";
  uploadedImages.value = [];
  editorSenderRef.value?.clear?.();
  await scrollToBottom();

  submitting.value = true;

  streamController.value = streamAiChat(
    {
      sessionId,
      modelCode: modelCode.value,
      prompt: content,
      think: currentThinkEnabled,
      files,
    },
    {
      onmessage: async (event) => {
        let data: any;
        try {
          data = JSON.parse(event.data);
        } catch {
          return;
        }

        if (data?.output) {
          messages.value = messages.value.map((item) => {
            if (item.localId !== assistantMessageId) {
              return item;
            }
            return {
              ...item,
              sysAiMessageContent: `${item.sysAiMessageContent || ""}${data.output}`,
              renderMode: "typing",
              streaming: true,
              requestEnd: false,
            };
          });
          if (currentThinkEnabled) {
            setThoughtChainStreaming(assistantMessageId);
          }
          await scrollToBottom();
          return;
        }

        if (data?.done) {
          streamController.value = undefined;
          submitting.value = false;
          finalizeAssistantMessage(assistantMessageId, "done");
          activeAssistantMessageId.value = undefined;
          await refreshSessionsOnly();
          await scrollToBottom();
        }
      },
      onerror: (error) => {
        const assistant = getActiveAssistantMessage();
        const errorText =
          error?.message || "AI 服务调用失败，请稍后重试";
        if (assistant) {
          assistant.sysAiMessageContent =
            assistant.sysAiMessageContent || errorText;
          assistant.renderMode = "markdown";
          assistant.requestEnd = true;
          assistant.streaming = false;
          setThoughtChainError(assistant.localId, errorText);
        }
        streamController.value = undefined;
        submitting.value = false;
        activeAssistantMessageId.value = undefined;
        message(errorText, { type: "error" });
      },
      onclose: () => {
        streamController.value = undefined;
        submitting.value = false;
      },
    },
  );
};

const toggleConversationPanel = () => {
  isConversationCollapsed.value = !isConversationCollapsed.value;
};

const handleResize = (event: MouseEvent) => {
  if (!isResizing.value) {
    return;
  }
  conversationPanelWidth.value = Math.min(420, Math.max(220, event.clientX - 12));
};

const stopResize = () => {
  isResizing.value = false;
  document.removeEventListener("mousemove", handleResize);
  document.removeEventListener("mouseup", stopResize);
};

const startResize = () => {
  isResizing.value = true;
  document.addEventListener("mousemove", handleResize);
  document.addEventListener("mouseup", stopResize);
};

watch(currentModelSupportsThink, (value) => {
  if (!value) {
    thinkEnabled.value = false;
  }
});

onMounted(async () => {
  await loadRuntimeDefaultModel();
  await loadModels();
  await loadSessions();
});

onBeforeUnmount(() => {
  stopStreaming();
  stopOptimizeTyping();
  stopResize();
});
</script>

<style scoped lang="scss">
.ai-studio {
  height: calc(100vh - 20px);
  min-height: calc(100vh - 20px);
  padding: 10px;
  box-sizing: border-box;
}

.chat-container {
  display: flex;
  gap: 18px;
  height: 100%;
  min-height: 0;
}

.conversation-panel {
  position: relative;
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  border-radius: 24px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  background: rgba(255, 255, 255, 0.88);
  box-shadow: 0 22px 48px rgba(15, 23, 42, 0.08);
  overflow: hidden;
  transition: width 0.24s ease;
}

.conversation-panel.collapsed {
  width: 64px !important;
}

.conversation-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 18px 16px;
  border-bottom: 1px solid rgba(15, 23, 42, 0.06);
}

.header-content {
  display: flex;
  align-items: center;
  gap: 10px;
}

.header-icon {
  width: 34px;
  height: 34px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #eef2ff 0%, #ede9fe 100%);
  color: #4f46e5;
}

.conversation-title {
  font-weight: 700;
  color: #111827;
  font-size: 15px;
}

.collapse-btn {
  width: 32px;
  height: 32px;
  border-radius: 10px;
}

.conversation-resizer {
  position: absolute;
  top: 0;
  right: 0;
  width: 8px;
  height: 100%;
  cursor: col-resize;
}

.conversation-content {
  flex: 1;
  min-height: 0;
  padding: 14px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.conversation-content::-webkit-scrollbar {
  display: none;
}

.quick-actions {
  display: grid;
  gap: 8px;
}

.action-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 10px;
  border: 1px solid rgba(15, 23, 42, 0.06);
  border-radius: 14px;
  background: rgba(248, 250, 252, 0.9);
  cursor: pointer;
}

.action-icon {
  width: 30px;
  height: 30px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #eef2ff 0%, #ede9fe 100%);
  color: #4f46e5;
}

.action-text {
  color: #111827;
  font-size: 14px;
  font-weight: 600;
}

.history-section {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.section-header {
  margin-bottom: 12px;
  color: #111827;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.conversation-list {
  flex: 1;

  :deep(.el-scrollbar__bar) {
    display: none !important;
  }

  :deep(.el-scrollbar__wrap) {
    scrollbar-width: none;
    -ms-overflow-style: none;
  }

  :deep(.el-scrollbar__wrap::-webkit-scrollbar) {
    display: none;
  }
}

.chat-main {
  flex: 1;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  border-radius: 28px;
  overflow: hidden;
  border: 1px solid rgba(15, 23, 42, 0.08);
  background: rgba(255, 255, 255, 0.88);
  box-shadow: 0 22px 48px rgba(15, 23, 42, 0.08);
}

.chat-main__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 18px;
  border-bottom: 1px solid rgba(15, 23, 42, 0.06);
  background: rgba(255, 255, 255, 0.92);
}

.chat-main__headline {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.chat-main__title {
  font-size: 16px;
  font-weight: 700;
  color: #111827;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.chat-main__model-tag {
  flex-shrink: 0;
}

.messages-area {
  flex: 1;
  min-height: 0;
  padding: 18px;
  overflow: hidden;
  background: linear-gradient(180deg, #fcfdff 0%, #f6f8fc 100%);
}

.messages-area__list {
  height: 100%;
  min-height: 0;
  padding-right: 4px;
}

.messages-area__list :deep(.el-scrollbar__bar) {
  display: none !important;
}

.messages-area__list :deep(.el-bubble-content) {
  box-shadow: 0 8px 18px rgba(15, 23, 42, 0.12);
}

.messages-area__list :deep(.el-bubble-content-outlined) {
  box-shadow: 0 3px 8px rgba(15, 23, 42, 0.08);
}

.messages-area__list :deep(.el-bubble-content-filled) {
  box-shadow: 0 6px 14px rgba(37, 99, 235, 0.14);
}

.messages-area__list :deep(.el-bubble-avatar) {
  width: 44px !important;
  height: 44px !important;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(148, 163, 184, 0.32);
  box-shadow: 0 10px 22px rgba(15, 23, 42, 0.08);
}

.bubble-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.thought-chain {
  width: 100%;
  padding: 10px 12px;
  border-radius: 16px;
  background: rgba(15, 23, 42, 0.03);
  border: 1px solid rgba(15, 23, 42, 0.06);
}

.assistant-typewriter,
.assistant-markdown,
.user-content {
  font-size: 14px;
  line-height: 1.75;
}

.assistant-markdown {
  color: #0f172a;
}

.user-content {
  white-space: pre-wrap;
  word-break: break-word;
  color: #0f172a;
}

.input-area {
  padding: 16px;
  background: rgba(255, 255, 255, 0.92);
  border-top: 1px solid rgba(15, 23, 42, 0.06);
}

.editor-sender {
  :deep(.editor-sender-container) {
    border-radius: 16px;
    border: 1px solid rgba(15, 23, 42, 0.08);
    background: #fff;
    box-shadow: 0 10px 24px rgba(15, 23, 42, 0.04);
  }
}

.file-preview-header {
  padding: 8px 12px;
  background: #f3f4f6;
  border-radius: 12px 12px 0 0;
  border-bottom: 1px solid rgba(15, 23, 42, 0.08);
}

.file-preview-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #374151;
  font-weight: 600;
}

.action-buttons {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
}

.composer-model {
  flex: 1;
  min-width: 220px;
}

.composer-model__label,
.composer-model__option {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.composer-model__avatar {
  width: 24px;
  height: 24px;
  border-radius: 999px;
  flex-shrink: 0;
  overflow: hidden;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #e0ecff 0%, #dbeafe 100%);
  border: 1px solid rgba(96, 165, 250, 0.24);
  color: #1d4ed8;
  font-size: 11px;
  font-weight: 700;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
}

.composer-model__label-text,
.composer-model__option-name,
.composer-model__option-code {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.composer-model__label-text {
  flex: 1;
}

.composer-model__option-copy {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.composer-model__option-name {
  color: #111827;
  font-size: 13px;
  font-weight: 600;
}

.composer-model__option-code {
  color: #6b7280;
  font-size: 11px;
}


.ai-studio__file-input {
  display: none;
}

.action-icon-btn {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  background: rgba(15, 23, 42, 0.04);
}

.action-icon-btn--active {
  background: rgba(239, 68, 68, 0.12);
  color: #dc2626;
}

.send-btn {
  min-width: 76px;
  height: 36px;
  padding: 0 12px;
  border-radius: 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.send-btn__spinner {
  animation: spin 1s linear infinite;
}

.header-delete-btn {
  width: 32px;
  height: 32px;
  border-radius: 10px;
}

.action-icon-btn :deep(.iconify),
.header-delete-btn :deep(.iconify) {
  font-size: 16px;
}

.file-preview-footer {
  padding: 12px;
  background: #f3f4f6;
  border-radius: 0 0 12px 12px;
  border-top: 1px solid rgba(15, 23, 42, 0.08);
}

.file-list {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.file-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border-radius: 12px;
  background: #fff;
  border: 1px solid rgba(15, 23, 42, 0.08);
}

.file-info {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #374151;
  font-size: 13px;
}

.file-icon {
  color: #4f46e5;
}

.file-name {
  max-width: 220px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.remove-btn {
  color: #ef4444;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 1080px) {
  .chat-container {
    flex-direction: column;
  }

  .conversation-panel,
  .conversation-panel.collapsed {
    width: 100% !important;
  }

  .conversation-resizer {
    display: none;
  }

  .action-buttons {
    flex-wrap: wrap;
  }

  .composer-model {
    min-width: 100%;
  }
}
</style>
