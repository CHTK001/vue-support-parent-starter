<template>
  <div class="chat-container">
    <!-- 左侧会话管理面板 -->
    <div
      class="conversation-panel"
      :class="{ collapsed: isConversationCollapsed }"
    >
      <div class="conversation-header">
        <div v-if="!isConversationCollapsed" class="header-content">
          <div class="header-icon">
            <IconifyIconOnline icon="ri:chat-3-line" />
          </div>
          <span class="conversation-title">会话管理</span>
        </div>
        <div class="conversation-header__actions">
          <ScButton
            :icon="useRenderIcon('ri:refresh-line')"
            size="small"
            circle
            @click="handleRefreshConversations"
            class="collapse-btn"
          />
          <ScButton 
            :icon="
              useRenderIcon(
                isConversationCollapsed ? 'ep:d-arrow-right' : 'ep:d-arrow-left'
              )
            "
            size="small"
            circle
            @click="toggleConversationPanel"
            class="collapse-btn"
          />
        </div>
      </div>

      <div
        v-if="!isConversationCollapsed"
        class="conversation-content thin-scroller"
      >
        <!-- 快捷功能区 -->
        <div class="quick-actions">
          <div class="action-item" @click="handleNewConversation">
            <div class="action-icon">
              <IconifyIconOnline icon="ri:add-circle-line" />
            </div>
            <span class="action-text">新建会话</span>
          </div>

          <!-- <div class="action-item">
            <div class="action-icon kimi-icon">
              <IconifyIconOnline icon="ri:robot-line" />
            </div>
            <span class="action-text">Kimi+</span>
          </div>
          
          <div class="action-item">
            <div class="action-icon study-icon">
              <IconifyIconOnline icon="ri:book-open-line" />
            </div>
            <span class="action-text">学术搜索</span>
          </div>
          
          <div class="action-item">
            <div class="action-icon medical-icon">
              <IconifyIconOnline icon="ri:heart-pulse-line" />
            </div>
            <span class="action-text">医疗搜索</span>
          </div>
          
          <div class="action-item">
            <div class="action-icon ppt-icon">
              <IconifyIconOnline icon="ri:slideshow-line" />
            </div>
            <span class="action-text">PPT 助手</span>
          </div>
          
          <div class="action-item">
            <div class="action-icon translate-icon">
              <IconifyIconOnline icon="ri:translate-2" />
            </div>
            <span class="action-text">翻译通</span>
          </div>
          
          <div class="action-item">
            <div class="action-icon explore-icon">
              <IconifyIconOnline icon="ri:compass-3-line" />
            </div>
            <span class="action-text">Kimi 探索版</span>
          </div> -->
        </div>

        <!-- 历史会话 -->
        <div class="history-section">
          <div class="section-header">
            <IconifyIconOnline icon="ri:history-line" />
            <span>历史会话</span>
          </div>

          <Conversations
            :items="conversationList"
            :active="currentConversationId"
            :loading="conversationLoading"
            :groupable="false"
            @change="handleConversationSelect"
            @menu-command="handleMenuCommand"
            @item-delete="handleConversationDelete"
            @item-rename="handleConversationRename"
            @mousemove="handleConversationItemHover"
            @mouseleave="handleConversationItemLeave"
            class="conversation-list"
            :show-tooltip="false"
            show-to-top-btn
            show-built-in-menu
          >
          </Conversations>
          <el-tooltip
            v-model:visible="conversationTimeTooltipVisible"
            :virtual-ref="conversationTimeTooltipTriggerRef"
            virtual-triggering
            raw-content
            effect="dark"
            placement="right"
            :content="conversationTimeTooltipContent"
          />

          <div class="view-all">
            <span>查看全部</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 右侧聊天区域 -->
    <div class="chat-main" :class="{ expanded: isConversationCollapsed }">
      <div class="chat-head">
        <div class="chat-head__meta">
          <span class="chat-head__label">会话</span>
          <el-tag class="chat-head__title-tag" type="info" effect="light" round>
            {{ currentConversation?.label || "新建会话" }}
          </el-tag>
          <span class="chat-head__label">当前模型</span>
          <el-tag class="chat-head__model-tag" type="primary" effect="light" round>
            {{ currentModel?.label || "未选择模型" }}
          </el-tag>
        </div>
        <div v-if="props.form?.think && canThink" class="chat-head__think">
          <IconifyIconOnline icon="ri:brain-fill" />
          <span>深度思考</span>
        </div>
      </div>
      <!-- 消息列表区域 -->
      <div class="messages-area" ref="messagesContainer" :class="{ 'is-editing': !!editingMessageId }">
        <div
          v-if="editingMessageId"
          class="messages-edit-mask"
          @click="handleEditCancel"
        />
        <BubbleList
          :list="bubbleListData"
          ref="messagesContainerBubbleList"
          maxHeight="100%"
          :btnLoading="isLoading && !messages.some((m) => m.streaming)"
          @scroll-to-bottom="scrollToBottom"
        >
          <template #content="{ item }">
            <div class="bubble-content">
              <XMarkdown
                :markdown="item.content"
                class="vp-raw"
                :allowHtml="true"
              />
              <div class="bubble-toolbar" v-if="!isLoading">
                <span class="bubble-time">{{ formatBubbleTime(item.rawCreateTime || item.timestamp) }}</span>
              </div>
              <div class="bubble-toolbar__icons bubble-toolbar__icons--corner" v-if="!isLoading">
                <ScTooltip content="复制内容" placement="top">
                  <span class="bubble-tool-icon" @click="handleCopyMessage(item)">
                    <IconifyIconOnline icon="ep:copy-document" />
                  </span>
                </ScTooltip>
                <ScTooltip
                  content="编辑消息"
                  placement="top"
                  v-if="item.type === 'sent'"
                >
                  <span class="bubble-tool-icon" @click="handleEditMessage(item)">
                    <IconifyIconOnline icon="ep:edit" />
                  </span>
                </ScTooltip>
              </div>
            </div>
          </template>
        </BubbleList>
      </div>

      <!-- 输入区域 -->
      <div class="input-area" style="position: relative">
        <EditorSender
          ref="editorSenderRef"
          v-model="currentMessage"
          placeholder="💌 请输入您的问题... 支持多模态输入"
          :max-length="2000"
          :loading="isLoading"
          :disabled="isLoading"
          :auto-focus="true"
          :clearable="true"
          @change="handleCurrentChangeValue"
          variant="updown"
          submit-type="enter"
          :select-list="promptTemplates"
          :custom-style="{ maxHeight: '200px' }"
          @submit="handleSendMessage"
          @clear="handleClearInput"
          class="editor-sender"
        >
          <!-- 自定义头部 -->
          <template #header>
            <div v-if="editingMessageId" class="editing-banner">
              <span>正在编辑消息</span>
              <ScButton text @click="handleEditCancel">取消</ScButton>
            </div>
            <div v-if="uploadedFiles.length > 0" class="file-preview-header">
              <div class="file-preview-title">
                <IconifyIconOnline icon="ri:attachment-line" />
                <span>已添加 {{ uploadedFiles.length }} 个文件</span>
              </div>
            </div>
          </template>

          <!-- 自定义前缀 -->
          <template #prefix>
            <div class="input-prefix">
              <ScTooltip v-if="canUploadFile" content="上传文件" placement="top">
                <ScUpload 
                  :show-file-list="false"
                  :before-upload="handleFileUpload"
                  accept="image/*,.pdf,.doc,.docx,.txt,.md"
                  class="file-upload-btn"
                >
                  <ScButton size="small" text>
                    <IconifyIconOnline icon="ri:attachment-line" />
                  </ScButton>
                </ScUpload>
              </ScTooltip>

              <ScTooltip v-if="canOptimizePrompt" content="优化提示词" placement="top">
                <ScButton size="small" text @click="handleOptimizePrompt">
                  <IconifyIconOnline icon="ri:magic-line" />
                </ScButton>
              </ScTooltip>
              <ScTooltip
                v-if="canThink"
                :content="props.form.think ? '关闭深度思考' : '开启深度思考'"
                placement="top"
              >
                <ScButton size="small" text @click="props.form.think = !props.form.think">
                  <IconifyIconOnline :icon="props.form.think ? 'ri:brain-fill' : 'ri:brain-line'" />
                </ScButton>
              </ScTooltip>
            </div>
          </template>

          <!-- 自定义操作列表 -->
          <template #action-list>
            <div class="action-buttons">
              <el-tooltip content="选择模型" placement="top">
                <ScSelect
                  v-model="props.form.model"
                  :options="modelSelectOptions"
                  layout="list"
                  :list-borde="true"
                  :list-select-button="true"
                  list-select-icon="ri:cpu-line"
                  :list-select-show-value="true"
                  list-height="430px"
                  :list-show-search="false"
                  :list-show-batch-actions="false"
                  class="model-select-inline"
                  @change="handleChangeModule"
                />
              </el-tooltip>
              <ScButton circle @click="handleClearInput">
                <svg
                  data-v-a84afe1a=""
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 1024 1024"
                  width="16"
                  height="16"
                >
                  <path
                    fill="currentColor"
                    d="M896 448H128v192a64 64 0 0 0 64 64h192v192h256V704h192a64 64 0 0 0 64-64zm-770.752-64c0-47.552 5.248-90.24 15.552-128 14.72-54.016 42.496-107.392 83.2-160h417.28l-15.36 70.336L736 96h211.2c-24.832 42.88-41.92 96.256-51.2 160a664 664 0 0 0-6.144 128H960v256a128 128 0 0 1-128 128H704v160a32 32 0 0 1-32 32H352a32 32 0 0 1-32-32V768H192A128 128 0 0 1 64 640V384zm64 0h636.544c-2.048-45.824.256-91.584 6.848-137.216 4.48-30.848 10.688-59.776 18.688-86.784h-96.64l-221.12 141.248L561.92 160H256.512c-25.856 37.888-43.776 75.456-53.952 112.832-8.768 32.064-13.248 69.12-13.312 111.168"
                  ></path>
                </svg>
              </ScButton>

              <ScButton 
                v-if="isLoading"
                circle
                @click="stopGeneration"
                class="stop-btn"
              >
                <IconifyIconOnline icon="ri:stop-circle-line" />
              </ScButton>
              <ScButton 
                v-else
                circle
                @click="handleSendMessage"
                :disabled="!canSend"
                class="send-btn"
              >
                <IconifyIconOnline icon="ep:top" />
              </ScButton>
            </div>
          </template>

          <!-- 自定义底部 -->
          <template #footer>
            <div v-if="uploadedFiles.length > 0" class="file-preview-footer">
              <div class="file-list">
                <div
                  v-for="(file, index) in uploadedFiles"
                  :key="index"
                  class="file-item"
                >
                  <div class="file-info">
                    <IconifyIconOnline
                      :icon="getFileIcon(file.type)"
                      class="file-icon"
                    />
                    <span class="file-name">{{ file.name }}</span>
                    <span class="file-size"
                      >({{ formatFileSize(file.size) }})</span>
                  </div>
                  <ScButton 
                    size="small"
                    text
                    @click="removeFile(index)"
                    class="remove-btn"
                  >
                    <IconifyIconOnline icon="ri:close-line" />
                  </ScButton>
                </div>
              </div>
            </div>
          </template>
        </EditorSender>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ScButton } from "@repo/components/ScButton";
import { ScContainer } from "@repo/components/ScContainer";
import { ScSelect } from "@repo/components/ScSelect";
import { ScTooltip } from "@repo/components/ScTooltip";
import {  useRenderIcon  } from "@repo/components/ReIcon";
import { message , ScMessageBox} from "@repo/utils";

import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  createConversation,
  deleteConversationMessagesAfter,
  deleteConversation,
  getConversationList,
  getConversationMessages,
  renameConversation,
  saveMessages,
} from "../../../../api/ai/conversation";
import { listAiModules } from "../../../../api/ai/module";
import { listAiGlobalSettings } from "../../../../api/ai/global-setting";
import { optimizeAiChatInput, streamAiChat } from "../../../../api/ai/chat";
const aiAvatar =
  "https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png";
const userAvatar = "https://avatars.githubusercontent.com/u/76239030?v=4";
// Props
const props = defineProps({
  form: {
    type: Object,
    default: () => ({}),
  },
  env: {
    type: Object,
    default: () => ({}),
  },
});

// 响应式数据
const messages = ref([]);
const currentMessage = ref("");
const isLoading = ref(false);
const uploadedFiles = ref([]);
const messagesContainer = ref(null);
const messagesContainerBubbleList = ref(null);
const editorSenderRef = ref(null);
const autoScrollEnabled = ref(true);
let scrollContainer = null;
const editingMessageId = ref(null);
const editingMessageText = ref("");
const route = useRoute();
const router = useRouter();
const isSwitchingConversation = ref(false);

// 会话管理相关数据
const isConversationCollapsed = ref(false);
const conversationLoading = ref(false);
const currentConversationId = ref(null);
const conversationList = ref([]);

const modelList = ref([]);
const rules = ref({});

const currentModel = computed(() =>
  modelList.value.find(item => item.value === props.form?.model) || null,
);

const modelSelectOptions = computed(() =>
  (modelList.value || []).map(item => ({
    label: item.label,
    value: item.value,
    description: item.sysAiModuleRemark || "暂无说明",
  })),
);

// 用户和机器人信息
const userInfo = computed(() => ({
  name: "用户",
  avatar: "/default-user-avatar.png",
}));

const botInfo = computed(() => ({
  name: currentModel.value?.label || "AI助手",
  avatar: props.form?.sysProjectIcon || "/default-bot-avatar.png",
}));
const currentConversation = computed(() =>
  conversationList.value.find(item => item.sysAiGroupId === currentConversationId.value) || null,
);

// 计算属性
const canSend = computed(() => {
  return currentMessage.value.trim() || uploadedFiles.value.length > 0;
});
const canUploadFile = computed(() => !!currentModel.value?.vlm);
const canOptimizePrompt = computed(() => !!currentModel.value?.supportOptimize);
const canThink = computed(() => !!currentModel.value?.supportThink);

const handleCurrentChangeValue = async () => {
  const result = editorSenderRef.value.getCurrentValue();
  currentMessage.value = result.text;
};

const readEditorText = () => {
  const result = editorSenderRef.value?.getCurrentValue?.();
  if (result && typeof result.text === "string") {
    currentMessage.value = result.text;
    return result.text;
  }
  const editor = document.querySelector(".input-area .chat-rich-text[contenteditable='true']");
  const text = (editor?.innerText || "").replace(/\uFEFF/g, "").trim();
  currentMessage.value = text;
  return text;
};

/**
 * 将文本稳定回填到输入编辑器。
 *
 * 兼容不同版本 EditorSender 暴露的方法，优先使用 setText。
 *
 * @param {string} text 需要回填的文本内容
 */
const selectEditorContent = () => {
  const editor = document.querySelector(".input-area .chat-rich-text[contenteditable='true']");
  if (!editor) {
    return;
  }
  const selection = window.getSelection?.();
  if (!selection) {
    return;
  }
  const range = document.createRange();
  range.selectNodeContents(editor);
  selection.removeAllRanges();
  selection.addRange(range);
};

const syncEditorText = (text, selectAll = false) => {
  const nextText = typeof text === "string" ? text : "";
  currentMessage.value = nextText;
  editorSenderRef.value?.clear?.();
  if (editorSenderRef.value?.setText) {
    editorSenderRef.value.setText(nextText);
  } else if (editorSenderRef.value?.setValue) {
    editorSenderRef.value.setValue(nextText);
  } else {
    const editor = document.querySelector(".input-area .chat-rich-text[contenteditable='true']");
    if (editor) {
      editor.innerHTML = "";
      editor.textContent = nextText;
      editor.dispatchEvent(new InputEvent("input", { bubbles: true, data: nextText, inputType: "insertText" }));
    }
  }
  nextTick(() => {
    const ensureEditorText = () => {
      const editor = document.querySelector(".input-area .chat-rich-text[contenteditable='true']");
      if (!editor) {
        return null;
      }
      const current = (editor.innerText || "").replace(/\uFEFF/g, "").trim();
      if (current !== nextText) {
        editor.innerHTML = "";
        editor.textContent = nextText;
        editor.dispatchEvent(new InputEvent("input", {
          bubbles: true,
          data: nextText,
          inputType: "insertText",
        }));
      }
      return editor;
    };

    if (editorSenderRef.value?.focusToEnd) {
      editorSenderRef.value.focusToEnd();
    } else {
      editorSenderRef.value?.focus?.();
    }
    const editor = ensureEditorText();
    if (selectAll) {
      requestAnimationFrame(() => {
        if (editor) {
          editor.focus?.();
        }
        selectEditorContent();
      });
    }
  });
};

const readSessionIdFromLocation = () => {
  const routeSessionId = Number(route.query.sessionId);
  if (routeSessionId) {
    return routeSessionId;
  }
  const hash = window.location.hash || "";
  const query = hash.includes("?") ? hash.split("?")[1] : "";
  const hashSessionId = Number(new URLSearchParams(query).get("sessionId"));
  return hashSessionId || null;
};

const syncSessionQuery = async (sessionId) => {
  const hash = window.location.hash || "#/ai/chat";
  const [hashPath] = hash.split("?");
  const nextHash = sessionId
    ? `${hashPath}?sessionId=${sessionId}`
    : hashPath;
  window.history.replaceState({}, "", `${window.location.pathname}${window.location.search}${nextHash}`);
};

const applyRouteSessionSelection = async () => {
  const sessionId = readSessionIdFromLocation();
  if (!sessionId) {
    return;
  }
  const target = conversationList.value.find(
    item => item.sysAiGroupId === sessionId
  );
  if (!target) {
    return;
  }
  await handleConversationSelect(target, { force: true, syncRoute: false });
};

const handleHashChange = async () => {
  await applyRouteSessionSelection();
};

const handleEscCancelEdit = (event) => {
  if (event.key === "Escape" && editingMessageId.value) {
    handleEditCancel();
  }
};

// BubbleList数据格式转换
const bubbleListData = computed(() => {
  return messages.value.map((message, index) => ({
    id: message.id,
    loading:
      message.role === "user"
        ? false
        : message.streaming ||
          (isLoading.value &&
            index === messages.value.length - 1 &&
            message.role === "assistant"),
    isFog: message.role === "user" ? {} : { bgColor: "#f5f5f5" },
    content: "shadow + corner",
    typing: message.streaming || false,
    variant: "shadow",
    shape: "corner",
    isMarkdown: true,
    avatarSrcSet: message.role === "user" ? userAvatar : aiAvatar,
    avatarSize: "32px",
    type: message.role === "user" ? "sent" : "received",
    content: message.content,
    placement: message.role != "user" ? "start" : "end",
    timestamp: message.timestamp,
    backendMessageId: message.backendMessageId,
    rawCreateTime: message.rawCreateTime,
    avatar:
      message.role === "user" ? userInfo.value.avatar : botInfo.value.avatar,
    name: message.role === "user" ? userInfo.value.name : botInfo.value.name,
    streaming: message.streaming || false,
    messageType: message.type || "text",
    filename: message.filename,
    fileIcon: message.type === "file" ? getFileIcon(message.type) : null,
}));
});

const resolveScrollContainer = () => {
  if (scrollContainer) {
    return scrollContainer;
  }
  const root = messagesContainer.value;
  if (!root) {
    return null;
  }
  scrollContainer =
    root.querySelector(".el-scrollbar__wrap") ||
    root.querySelector("[class*='scrollbar']") ||
    root.firstElementChild;
  return scrollContainer;
};

const updateAutoScrollState = () => {
  const el = resolveScrollContainer();
  if (!el) {
    autoScrollEnabled.value = true;
    return;
  }
  const distanceToBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
  autoScrollEnabled.value = distanceToBottom <= 24;
};

const bindScrollTracking = () => {
  nextTick(() => {
    const el = resolveScrollContainer();
    if (!el || el.dataset.aiScrollBound === "1") {
      return;
    }
    el.dataset.aiScrollBound = "1";
    el.addEventListener("scroll", updateAutoScrollState, { passive: true });
    updateAutoScrollState();
  });
};

const promptTemplates = ref([]);

// SSE 相关变量
let controller = null;

// 格式化消息内容（支持 Markdown）
const formatMessage = (content) => {
  // 简单的 Markdown 转换
  return content
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/`(.*?)`/g, "<code>$1</code>")
    .replace(/\n/g, "<br>");
};

// 处理发送消息
const handleSendMessage = async () => {
  readEditorText();
  if (!props.form?.model) {
    message("请先选择模型", { type: "error" });
    return;
  }

  if (!currentMessage.value.trim()) {
    return;
  }

  if (editingMessageId.value) {
    const ok = await finalizeEditedMessageBeforeSend();
    if (!ok) {
      return;
    }
  }

  // 如果没有选择会话，自动创建新会话
  if (!currentConversationId.value) {
    try {
      conversationLoading.value = true;

      // 使用用户输入的前20个字符作为会话名称
      const conversationTitle =
        currentMessage.value.length > 20
          ? currentMessage.value.substring(0, 20) + "..."
          : currentMessage.value;

      const newConversation = await createConversation({
        sysAiGroupName: conversationTitle,
        sysProjectId: props.form?.sysProjectId || 0,
        sysAiModuleCode: props.form?.model,
      });

      if (newConversation?.sysAiGroupId) {
        currentConversationId.value = newConversation.sysAiGroupId;
        await syncSessionQuery(newConversation.sysAiGroupId);
        await loadConversationList();
        const createdConversation = conversationList.value.find(
          (c) => c.sysAiGroupId === newConversation.sysAiGroupId
        );
        if (createdConversation) {
          await handleConversationSelect(createdConversation);
        }
        console.log("自动创建新会话成功:", conversationTitle);
      } else {
        message("创建会话失败，请重试", { type: "error" });
        return;
      }
    } catch (error) {
      console.error("自动创建会话失败:", error);
      message("创建会话失败，请重试", { type: "error" });
      return;
    } finally {
      conversationLoading.value = false;
    }
  }

  const messageContent = currentMessage.value;

  // 添加用户消息
  autoScrollEnabled.value = true;
  messages.value.push({
    id: Date.now(),
    type: "text",
    content: messageContent,
    role: "user",
    timestamp: new Date(),
  });

  // 发送到 AI
  sendToAI(messageContent, uploadedFiles.value);

  // 清空输入
  handleClearInput();

  // 滚动到底部
  nextTick(() => {
    scrollToBottom();
  });
};

// 发送到 AI
const sendToAI = async (prompt, files) => {
  // 处理文件
  let fileInfo = [];
  if (files && files.length > 0) {
    for (const file of files) {
      const base64 = await fileToBase64(file);
      fileInfo.push({
        type: file.type?.startsWith("image")
          ? "image"
          : file.type?.startsWith("video")
            ? "video"
            : "file",
        url: base64,
        filename: file.name,
      });
    }
  }

  // 添加 AI 消息占位符
  const aiMessageId = Date.now() + 1;
  messages.value.push({
    id: aiMessageId,
    type: "text",
    content: "",
    role: "assistant",
    timestamp: new Date(),
    streaming: true,
  });

  isLoading.value = true;

  // 关闭之前的连接
  if (controller) {
    controller.abort();
  }
  const localController = streamAiChat(
    {
      sessionId: currentConversationId.value,
      modelCode: props.form.model,
      prompt,
      system: props.form.system,
      think: !!props.form.think,
      requestScene: "CHAT",
      files: fileInfo,
    },
    {
      onmessage(event) {
        const data = JSON.parse(event.data);
        if (data.done) {
          isLoading.value = false;
          const aiMessage = messages.value.find((msg) => msg.id === aiMessageId);
          if (aiMessage) {
            aiMessage.streaming = false;
            if (autoScrollEnabled.value) {
              nextTick(() => {
                scrollToBottom();
              });
            }
            nextTick(() => {
              bindScrollTracking();
            });
            return;
          }
          return;
        }
        if (data.output) {
          const aiMessage = messages.value.find((msg) => msg.id === aiMessageId);
          if (aiMessage) {
            aiMessage.content += data.output;
            if (autoScrollEnabled.value) {
              nextTick(() => {
                scrollToBottom();
              });
            }
          }
        }
      },
      onerror(error) {
        console.error("EventSource error:", error);
        if (localController?.signal?.aborted) {
          return;
        }
        isLoading.value = false;
        message.error("AI 调用失败，请稍后再试");
        const index = messages.value.findIndex((msg) => msg.id === aiMessageId);
        if (index > -1) {
          messages.value.splice(index, 1);
        }
      },
      onclose() {
        isLoading.value = false;
      },
    },
  );
  controller = localController;
};

// 文件转 Base64
const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () =>
      resolve(reader.result?.replace(/^data:.+;base64,/, ""));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// 处理文件上传
const handleFileUpload = (file) => {
  // 检查文件大小（限制为 10MB）
  if (file.size > 10 * 1024 * 1024) {
    message.error("文件大小不能超过 10MB");
    return false;
  }

  uploadedFiles.value.push(file);
  message.success(`文件 ${file.name} 已添加`);
  return false; // 阻止自动上传
};

// 移除文件
const removeFile = (index) => {
  uploadedFiles.value.splice(index, 1);
};

// 获取文件图标
const getFileIcon = (fileType) => {
  if (fileType?.startsWith("image/")) {
    return "ri:image-line";
  } else if (fileType?.includes("pdf")) {
    return "ri:file-pdf-line";
  } else if (fileType?.includes("word") || fileType?.includes("document")) {
    return "ri:file-word-line";
  } else if (fileType?.includes("text")) {
    return "ri:file-text-line";
  }
  return "ri:file-line";
};

// 格式化文件大小
const formatFileSize = (bytes) => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

// 格式化时间
const formatTime = (timestamp) => {
  const now = new Date();
  const time = new Date(timestamp);
  const diff = now - time;

  if (diff < 60000) {
    // 小于1分钟
    return "刚刚";
  } else if (diff < 3600000) {
    // 小于1小时
    return `${Math.floor(diff / 60000)}分钟前`;
  } else if (diff < 86400000) {
    // 小于1天
    return `${Math.floor(diff / 3600000)}小时前`;
  } else {
    return (
      time.toLocaleDateString() +
      " " +
      time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    );
  }
};

// 滚动到底部
const scrollToBottom = () => {
  if (messagesContainerBubbleList.value) {
    messagesContainerBubbleList.value.scrollToBottom();
  }
};

const formatBubbleTime = (timestamp) => {
  if (!timestamp) {
    return "";
  }
  const time = new Date(timestamp);
  if (Number.isNaN(time.getTime())) {
    return String(timestamp);
  }
  return time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

/**
 * 格式化会话时间文本。
 *
 * @param {string | number | Date | null | undefined} value 原始时间值
 * @return {string} 格式化后的时间文本
 */
const formatConversationDateTime = (value) => {
  if (!value) {
    return "未知";
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "未知";
  }
  return date.toLocaleString();
};

/** 会话时间提示可见状态。 */
const conversationTimeTooltipVisible = ref(false);
/** 会话时间提示触发节点。 */
const conversationTimeTooltipTriggerRef = ref(null);
/** 会话时间提示内容。 */
const conversationTimeTooltipContent = ref("");

/**
 * 构建会话时间提示内容。
 *
 * @param {any} target 会话记录
 * @return {string} Tooltip HTML
 */
const buildConversationTimeTooltip = (target) => {
  return [
    `<div>最近使用：${formatConversationDateTime(target?.updateTime || target?.time)}</div>`,
    `<div>创建时间：${formatConversationDateTime(target?.createTime)}</div>`,
  ].join("");
};

/**
 * 会话项悬停时显示时间提示。
 *
 * @param {MouseEvent} event 鼠标事件
 */
const handleConversationItemHover = (event) => {
  const itemNode = event?.target?.closest?.(".conversation-item");
  if (!itemNode) {
    conversationTimeTooltipVisible.value = false;
    return;
  }
  const conversationId = Number(itemNode.getAttribute("active-key"));
  if (!conversationId) {
    conversationTimeTooltipVisible.value = false;
    return;
  }
  const target = conversationList.value.find(
    (item) => Number(item.sysAiGroupId) === conversationId
  );
  if (!target) {
    conversationTimeTooltipVisible.value = false;
    return;
  }
  conversationTimeTooltipTriggerRef.value = itemNode;
  conversationTimeTooltipContent.value = buildConversationTimeTooltip(target);
  conversationTimeTooltipVisible.value = true;
};

/**
 * 鼠标离开会话列表后隐藏时间提示。
 */
const handleConversationItemLeave = () => {
  conversationTimeTooltipVisible.value = false;
};

const handleChangeModule = async (moduleCode) => {
  // 切换模型的逻辑
  if (props.form) {
    props.form.model = moduleCode;
    if (!canThink.value) {
      props.form.think = false;
    }
  }
  if (currentConversationId.value && currentConversation.value) {
    try {
      await renameConversation({
        sysAiGroupId: currentConversationId.value,
        sysAiGroupName: currentConversation.value.label,
        sysProjectId: props.form?.sysProjectId || 0,
        sysAiModuleCode: moduleCode,
      });
      const target = conversationList.value.find(item => item.sysAiGroupId === currentConversationId.value);
      if (target) {
        target.sysAiModuleCode = moduleCode;
      }
    } catch (error) {
      console.error("同步会话模型失败:", error);
    }
  }
  message.success("模型已切换");
};

const loadModelList = async () => {
  try {
    const [moduleResult, runtimeResult] = await Promise.all([
      listAiModules("LLM"),
      listAiGlobalSettings("runtime"),
    ]);
    const runtimeDefaultModel = (runtimeResult?.data || []).find(
      item => item.sysAiGlobalSettingField === "default_model"
    )?.sysAiGlobalSettingValue;
    const rows = moduleResult?.data?.filter(item => item.sysAiModuleStatus !== 0) || [];
    modelList.value = rows.map(item => ({
      label: item.sysAiModuleName || item.sysAiModuleCode,
      value: item.sysAiModuleCode,
      sysAiModuleRemark: item.sysAiModuleRemark || "",
      vlm: Number(item.sysAiModuleVlm) === 1,
      supportThink: Number(item.sysAiModuleSupportThink) === 1,
      supportOptimize: Number(item.sysAiModuleSupportOptimize) === 1,
    }));
    const exists = modelList.value.some(item => item.value === props.form?.model);
    if ((!props.form?.model || !exists) && modelList.value.length > 0) {
      const preferred =
        modelList.value.find(item => item.value === runtimeDefaultModel) ||
        modelList.value.find(item => item.value === "glm-4-6v-flash") ||
        modelList.value[0];
      props.form.model = preferred?.value;
    }
  } catch (error) {
    console.error("加载模型列表失败:", error);
  }
};

const handleClickSeed = () => {
  // 生成新的随机种子
  if (props.form) {
    props.form.seed = Math.floor(Math.random() * 1000000);
  }
  message.success("已生成新的随机种子");
};

// 清空消息
const handleClearMessages = () => {
  messages.value = [];
};

// 停止生成
const stopGeneration = () => {
  if (controller) {
    controller.abort();
    isLoading.value = false;
  }
};

// 清空输入处理
const handleClearInput = () => {
  currentMessage.value = "";
  uploadedFiles.value = [];
  editorSenderRef.value.clear();
};

const handleOptimizePrompt = async () => {
  if (!canOptimizePrompt.value) {
    return;
  }
  const text = (currentMessage.value || "").trim();
  if (!text) {
    message("请先输入内容", { type: "warning" });
    return;
  }
  try {
    const result = await optimizeAiChatInput({
      modelCode: props.form.model,
      prompt: text,
      think: false,
      requestScene: "OPTIMIZE",
    });
    const optimizedText = result?.data?.text?.trim();
    if (!optimizedText) {
      message("优化失败，请稍后再试", { type: "error" });
      return;
    }
    syncEditorText(optimizedText);
  } catch (error) {
    console.error("优化提示词失败:", error);
    message("优化失败，请稍后再试", { type: "error" });
  }
};

// 复制消息内容
const handleCopyMessage = async (item) => {
  try {
    // 首先尝试使用现代的 Clipboard API
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(item.content);
      message("复制成功", { type: "success" });
      return;
    }

    // 备用方案：使用传统的 execCommand 方法
    const textArea = document.createElement("textarea");
    textArea.value = item.content;
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    textArea.style.top = "-999999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    const successful = document.execCommand("copy");
    document.body.removeChild(textArea);

    if (successful) {
      message("复制成功", { type: "success" });
    } else {
      throw new Error("execCommand failed");
    }
  } catch (err) {
    console.error("复制失败:", err);
    message("复制失败，请手动选择文本复制", { type: "error" });
  }
};

const handleEditMessage = (item) => {
  if (item.type !== "sent") {
    return;
  }
  const content = typeof item.content === "string" ? item.content : "";
  if (!content.trim()) {
    message("当前消息内容为空，无法编辑", { type: "warning" });
    return;
  }
  editingMessageId.value = item.id;
  editingMessageText.value = content;
  // 强制同步外层 v-model 与编辑器内部值，确保回填稳定生效
  syncEditorText(content, true);
};

const handleEditCancel = () => {
  editingMessageId.value = null;
  editingMessageText.value = "";
  currentMessage.value = "";
  editorSenderRef.value?.clear?.();
};

const finalizeEditedMessageBeforeSend = async () => {
  if (!editingMessageId.value || !currentConversationId.value) {
    return true;
  }
  const item = messages.value.find(message => message.id === editingMessageId.value);
  if (!item?.backendMessageId) {
    return false;
  }
  const index = messages.value.findIndex(message => message.id === editingMessageId.value);
  if (index < 0) {
    return false;
  }
  const deleted = await deleteConversationMessagesAfter(
    currentConversationId.value,
    item.backendMessageId,
  );
  if (!deleted) {
    message("编辑失败，请稍后再试", { type: "error" });
    return false;
  }
  messages.value = messages.value.slice(0, index);
  editingMessageId.value = null;
  editingMessageText.value = "";
  return true;
};

// 会话管理方法
// 切换会话面板
const toggleConversationPanel = () => {
  isConversationCollapsed.value = !isConversationCollapsed.value;
};

// 新建会话
const handleNewConversation = async () => {
  try {
    conversationLoading.value = true;

    // 立即创建默认名称的会话
    const newConversation = await createConversation({
      sysAiGroupName: "新建会话",
      sysProjectId: props.form?.sysProjectId || 0,
      sysAiModuleCode: props.form?.model,
    });

    if (newConversation) {
      currentConversationId.value = newConversation.sysAiGroupId;
      messages.value = [];
      await syncSessionQuery(newConversation.sysAiGroupId);
      await loadConversationList();
      message("新会话创建成功", { type: "success" });
    }
  } catch (error) {
    console.error("创建会话失败:", error);
    message("创建会话失败", { type: "error" });
  } finally {
    conversationLoading.value = false;
  }
};

// 刷新会话列表
const handleRefreshConversations = async () => {
  try {
    await loadConversationList();
    message("会话列表刷新成功", { type: "success" });
  } catch (error) {
    console.error("刷新会话列表失败:", error);
    message("刷新会话列表失败", { type: "error" });
  }
};

// 选择会话
const loadConversationMessages = async (conversation) => {
  if (conversation.sysAiModuleCode) {
    props.form.model = conversation.sysAiModuleCode;
  }

  try {
    const { data: pageResult } = await getConversationMessages(
      conversation.sysAiGroupId,
      1,
      100
    );

    if (pageResult && pageResult.records && pageResult.records.length > 0) {
        messages.value = pageResult.records.map((msg, index) => ({
          id: msg.sysAiGroupMessageId || Date.now() + index,
          type: msg.sysAiGroupMessageType || "text",
          content: msg.sysAiGroupMessageContent,
          role: msg.sysAiGroupMessageRole,
          timestamp: msg.createTime ? new Date(msg.createTime) : new Date(),
          rawCreateTime: msg.createTime,
          backendMessageId: msg.sysAiGroupMessageId,
          streaming: false,
        }));
    } else {
      messages.value = [];
    }
  } catch (historyError) {
    console.error("加载历史消息失败:", historyError);
    messages.value = [];
  }

  nextTick(() => {
    scrollToBottom();
  });
};

const handleConversationSelect = async (conversation, options = {}) => {
  const { force = false, syncRoute = true } = options;
  try {
    const routeSessionId = readSessionIdFromLocation();
    if (
      !force &&
      routeSessionId &&
      conversation?.sysAiGroupId !== routeSessionId &&
      currentConversationId.value !== routeSessionId
    ) {
      return;
    }
    isSwitchingConversation.value = true;
    if (!force && currentConversationId.value === conversation.sysAiGroupId) {
      return;
    }
    currentConversationId.value = conversation.sysAiGroupId;
    if (syncRoute) {
      await syncSessionQuery(conversation.sysAiGroupId);
    }
    await loadConversationMessages(conversation);
  } catch (error) {
    console.error("加载会话失败:", error);
    message("加载会话失败", { type: "error" });
  } finally {
    isSwitchingConversation.value = false;
  }
};
// 内置菜单点击方法
function handleMenuCommand(command, item) {
  console.log("内置菜单点击事件：", command, item);
  const targetId = item?.sysAiGroupId ?? item?.id;
  const index = conversationList.value.findIndex(
    (itemSlef) => itemSlef.sysAiGroupId === targetId || itemSlef.id === targetId
  );
  if (index === -1) {
    return;
  }
  const target = conversationList.value[index];
  if (command === "delete") {
    handleConversationDelete(target);
    return;
  }
  if (command === "rename") {
    // 弹出编辑框
    ScMessageBox.prompt("请输入新的会话名称", "重命名会话", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      inputValue: target.label,
      inputValidator: (value) => {
        if (!value || value.trim() === "") {
          return "会话名称不能为空";
        }
        if (value.length > 50) {
          return "会话名称不能超过50个字符";
        }
        return true;
      },
      inputErrorMessage: "请输入有效的会话名称",
    })
      .then(({ value }) => {
        if (value && value.trim() !== target.label) {
          handleConversationRename(target, value.trim());
        }
      })
      .catch(() => {
        console.log("取消重命名");
      });
  }
}
// 删除会话
const handleConversationDelete = async (conversation) => {
  try {
    const success = await deleteConversation(conversation.sysAiGroupId);

    if (success) {
      await loadConversationList();

      // 如果删除的是当前会话，清空消息
      if (currentConversationId.value === conversation.sysAiGroupId) {
        currentConversationId.value = null;
        messages.value = [];
        await syncSessionQuery(null);
      }

      message("会话删除成功", { type: "success" });
    } else {
      message("删除会话失败", { type: "error" });
    }
  } catch (error) {
    console.error("删除会话失败:", error);
    message("删除会话失败", { type: "error" });
  }
};

// 重命名会话
const handleConversationRename = async (conversation, newTitle) => {
  try {
    const updatedConversation = await renameConversation({
      sysAiGroupId: conversation.sysAiGroupId,
      sysAiGroupName: newTitle,
      sysProjectId: props.form?.sysProjectId || 0,
      sysAiModuleCode: props.form?.model,
    });

    if (updatedConversation) {
      await loadConversationList();
      message("会话重命名成功", { type: "success" });
    } else {
      message("重命名会话失败", { type: "error" });
    }
  } catch (error) {
    console.error("重命名会话失败:", error);
    message("重命名会话失败", { type: "error" });
  }
};

// 保存聊天消息
const saveChatMessages = async (userMessage, aiMessage) => {
  if (!currentConversationId.value) return;

  try {
    // 批量保存用户消息和AI回复
    await saveMessages([
      {
        sysAiGroupId: currentConversationId.value,
        sysAiGroupMessageRole: "user",
        sysAiGroupMessageContent: userMessage,
        sysAiGroupMessageType: "text",
      },
      {
        sysAiGroupId: currentConversationId.value,
        sysAiGroupMessageRole: "assistant",
        sysAiGroupMessageContent: aiMessage,
        sysAiGroupMessageType: "text",
      },
    ]);

    console.log("聊天内容保存成功");
  } catch (error) {
    console.error("保存聊天内容失败:", error);
  }
};

// 加载会话列表
const loadConversationList = async () => {
  try {
    conversationLoading.value = true;
    const { data: conversations } = await getConversationList(
      props.form?.sysProjectId || 0
    );
    conversationList.value = (conversations || []).map((conv) => {
      return {
        sysAiGroupId: conv.sysAiGroupId,
        id: conv.sysAiGroupId, // 保持兼容性
        label: conv.sysAiGroupName,
        time: conv.updateTime ? new Date(conv.updateTime).toLocaleString() : "",
        avatar: "/default-conversation-avatar.png",
        description: "会话",
        ...conv, // 保留原始数据
      };
    });
    const routeSessionId = readSessionIdFromLocation();
    if (routeSessionId && conversationList.value.some(item => item.sysAiGroupId === routeSessionId)) {
      currentConversationId.value = routeSessionId;
      await applyRouteSessionSelection();
    } else if (
      currentConversationId.value &&
      !conversationList.value.some(item => item.sysAiGroupId === currentConversationId.value)
    ) {
      currentConversationId.value = null;
      messages.value = [];
    }
  } catch (error) {
    console.error("加载会话列表失败:", error);
  } finally {
    conversationLoading.value = false;
  }
};

// 监听表单变化，重置会话
watch(
  () => props.form?.model,
  () => {
    if (isSwitchingConversation.value) {
      return;
    }
    if (!canThink.value) {
      props.form.think = false;
    }
  }
);

// 监听项目变化，重新加载会话列表
watch(
  () => props.form?.sysProjectId,
  (newProjectId, oldProjectId) => {
    // 只有当项目ID真正变化时才重新加载
    if (newProjectId && newProjectId != oldProjectId) {
      loadConversationList();
    }
  }
);

onMounted(() => {
  loadModelList();
  loadConversationList();
  bindScrollTracking();
  window.addEventListener("hashchange", handleHashChange);
  window.addEventListener("keydown", handleEscCancelEdit);
  setTimeout(() => {
    void applyRouteSessionSelection();
  }, 0);
});

onBeforeUnmount(() => {
  window.removeEventListener("hashchange", handleHashChange);
  window.removeEventListener("keydown", handleEscCancelEdit);
});

watch(
  () => route.fullPath,
  async () => {
    await applyRouteSessionSelection();
  }
);

watch(
  () => messages.value.length,
  () => {
    bindScrollTracking();
  }
);

// 暴露方法给父组件
defineExpose({
  clearMessages: handleClearMessages,
  stopGeneration,
  addMessage: (message) => {
    messages.value.push({
      id: Date.now(),
      ...message,
      timestamp: new Date(),
    });
    nextTick(() => {
      scrollToBottom();
    });
  },
  focusInput: () => {
    nextTick(() => {
      editorSenderRef.value?.focus();
    });
  },
  clearInput: handleClearInput,
  insertTemplate: (template) => {
    syncEditorText(template);
  },
});
</script>

<style scoped lang="scss">
.chat-container {
  flex: 1 1 auto;
  width: 100%;
  min-width: 0;
  height: 100%;
  max-height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: row;
  align-items: stretch;
  background: var(--el-bg-color-overlay);
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  overflow: hidden;

  // 会话管理面板样式
  .conversation-panel {
    width: 280px;
    min-height: 0;
    background: var(--el-bg-color-overlay);
    border-right: 1px solid var(--el-border-color);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    transition: all 0.3s ease;

    &.collapsed {
      width: 60px;
    }

    .conversation-header {
      height: 52px;
      padding: 10px 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid var(--el-border-color);
      background: var(--el-bg-color-overlay);

      .header-content {
        display: flex;
        align-items: center;
        gap: 8px;

        .header-icon {
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--el-text-color-primary);
          font-size: 18px;
        }

        .conversation-title {
          font-weight: 600;
          color: var(--el-text-color-primary);
          font-size: 16px;
        }
      }

      .conversation-header__actions {
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .collapse-btn {
        flex-shrink: 0;
        border: none;
        background: transparent;

        &:hover {
          background: var(--el-bg-color-overlay);
        }
      }
    }

    .conversation-content {
      flex: 1;
      min-height: 0;
      padding: 0;
      overflow-y: auto;
      overflow-x: hidden;
      display: flex;
      flex-direction: column;

      .new-conversation-section {
        padding: 16px;
        border-bottom: 1px solid var(--el-border-color);

        .new-conversation-btn {
          width: 100%;
          height: 44px;
          border-radius: 8px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border: none;
          font-weight: 500;
          font-size: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.3s ease;

          &:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 12px var(--el-shadow-color);
          }
        }
      }

      .quick-actions {
        padding: 16px;
        border-bottom: 1px solid var(--el-border-color);

        .action-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 8px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          margin-bottom: 4px;

          &:hover {
            background: var(--el-bg-color-overlay);
          }

          .action-icon {
            width: 32px;
            height: 32px;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 16px;
            background: var(--el-bg-color-overlay);
            color: var(--el-text-color-primary);

            &.kimi-icon {
              background: linear-gradient(135deg, #ff6b6b, #ee5a24);
              color: var(--el-text-color-primary);
            }

            &.study-icon {
              background: linear-gradient(135deg, #feca57, #ff9ff3);
              color: var(--el-text-color-primary);
            }

            &.medical-icon {
              background: linear-gradient(135deg, #48dbfb, #0abde3);
              color: var(--el-text-color-primary);
            }

            &.ppt-icon {
              background: linear-gradient(135deg, #ff9ff3, #f368e0);
              color: var(--el-text-color-primary);
            }

            &.translate-icon {
              background: linear-gradient(135deg, #54a0ff, #2e86de);
              color: var(--el-text-color-primary);
            }

            &.explore-icon {
              background: linear-gradient(135deg, #5f27cd, #341f97);
              color: var(--el-text-color-primary);
            }
          }

          .action-text {
            font-size: 14px;
            color: var(--el-text-color-primary);
            font-weight: 500;
          }
        }
      }

      .history-section {
        flex: 1;
        min-height: 0;
        padding: 16px;
        display: flex;
        flex-direction: column;

        .section-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
          color: var(--el-text-color-primary);
          font-size: 14px;
          font-weight: 500;
        }

        .conversation-list {
          flex: 1;
          min-height: 0;
          background: var(--el-bg-color-overlay) !important;
          :deep(.el-scrollbar__view) {
            padding: 0;
          }

          :deep(.conversations-list) {
            background: var(--el-bg-color-overlay) !important;
          }

          :deep(.conversation-item) {
            display: flex;
            align-items: center;
            gap: 8px;
          }

          :deep(.conversation-item::before) {
            content: "";
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: #94a3b8;
            flex-shrink: 0;
          }

          :deep(.conversation-item.active::before) {
            background: #6366f1;
          }

          :deep(.conversation-item .conversation-content) {
            display: flex;
            align-items: center;
            width: 100%;
            min-width: 0;
          }

          :deep(.conversation-item .conversation-dropdown-menu-container) {
            margin-left: auto;
            flex-shrink: 0;
          }
        }

        .view-all {
          margin-top: 12px;
          text-align: center;
          color: var(--el-text-color-primary);
          font-size: 14px;
          cursor: pointer;
          padding: 8px;
          border-radius: 6px;
          transition: all 0.2s ease;

          &:hover {
            background: var(--el-bg-color-overlay);
            color: var(--el-text-color-primary);
          }
        }
      }
    }
  }

  .chat-main{
    display: flex;
    flex-direction: column;
    flex: 1;
    width: 100%;
  }
  .chat-head {
    height: 52px;
    flex-shrink: 0;
    position: relative;
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 16px;
    background: var(--el-bg-color-overlay);
    border-bottom: 1px solid var(--el-border-color);

    .chat-head__meta {
      display: flex;
      align-items: center;
      gap: 10px;
      min-width: 0;
    }

    .chat-head__label {
      font-size: 12px;
      color: var(--el-text-color-secondary);
      flex-shrink: 0;
    }

    .chat-head__title-tag,
    .chat-head__model-tag {
      max-width: 220px;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      vertical-align: middle;
    }

    :deep(.chat-head__title-tag .el-tag__content),
    :deep(.chat-head__model-tag .el-tag__content) {
      display: block;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .chat-head__think {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 10px;
      border-radius: 999px;
      background: rgba(102, 126, 234, 0.1);
      color: #667eea;
      font-size: 12px;
      font-weight: 600;
      flex-shrink: 0;
    }
  }

  .messages-area {
    flex: 1;
    min-height: 0;
    height: 100%;
    position: relative;
    padding: 10px 12px 8px;
    display: flex;
    flex-direction: column;
    overflow-y: auto;
    overflow-x: hidden;
    background: #fafafa;

    .messages-edit-mask {
      position: absolute;
      inset: 0;
      z-index: 3;
      background: rgba(15, 23, 42, 0.22);
      backdrop-filter: blur(1px);
    }

    :deep(.bubble-list) {
      flex: 1;
      min-height: 0;
      height: 100% !important;
      padding: 0 !important;
    }

    :deep(.el-scrollbar__view) {
      padding-bottom: 56px !important;
    }

    :deep(.el-bubble-content) {
      padding: 2px !important;
    }

    .bubble-content {
      position: relative;
      padding-right: 56px;
      padding-bottom: 20px;
      margin: 0;
      width: 100%;
      max-width: min(100%, 720px);
      overflow: hidden;

      :deep(.vp-raw),
      :deep(p),
      :deep(pre),
      :deep(code),
      :deep(table),
      :deep(.x-markdown) {
        max-width: 100%;
        word-break: break-word;
        overflow-wrap: anywhere;
      }

      :deep(pre) {
        overflow: auto;
      }

      :deep(.vp-raw),
      :deep(.x-markdown) {
        color: #0f172a;
        font-size: 14px;
        line-height: 1.82;
        letter-spacing: 0.01em;
        font-family:
          "PingFang SC",
          "Microsoft YaHei",
          "Inter",
          -apple-system,
          BlinkMacSystemFont,
          "Segoe UI",
          sans-serif;
      }

      :deep(.vp-raw p),
      :deep(.x-markdown p) {
        margin: 0 0 12px;
      }

      :deep(.vp-raw h1),
      :deep(.vp-raw h2),
      :deep(.vp-raw h3),
      :deep(.vp-raw h4),
      :deep(.x-markdown h1),
      :deep(.x-markdown h2),
      :deep(.x-markdown h3),
      :deep(.x-markdown h4) {
        margin: 16px 0 10px;
        color: #0b1220;
        font-weight: 700;
        line-height: 1.35;
      }

      :deep(.vp-raw h1),
      :deep(.x-markdown h1) { font-size: 22px; }
      :deep(.vp-raw h2),
      :deep(.x-markdown h2) { font-size: 19px; }
      :deep(.vp-raw h3),
      :deep(.x-markdown h3) { font-size: 17px; }
      :deep(.vp-raw h4),
      :deep(.x-markdown h4) { font-size: 15px; }

      :deep(.vp-raw ul),
      :deep(.vp-raw ol),
      :deep(.x-markdown ul),
      :deep(.x-markdown ol) {
        margin: 8px 0 14px;
        padding-left: 1.25em;
      }

      :deep(.vp-raw li),
      :deep(.x-markdown li) {
        margin: 4px 0;
      }

      :deep(.vp-raw blockquote),
      :deep(.x-markdown blockquote) {
        margin: 12px 0;
        padding: 10px 12px;
        border-left: 3px solid #94a3b8;
        border-radius: 6px;
        background: rgba(148, 163, 184, 0.12);
        color: #334155;
      }

      :deep(.vp-raw code),
      :deep(.x-markdown code) {
        padding: 2px 6px;
        border-radius: 6px;
        background: rgba(15, 23, 42, 0.08);
        color: #1d4ed8;
        font-size: 13px;
        font-family:
          "JetBrains Mono",
          "Fira Code",
          "Consolas",
          "Monaco",
          monospace;
      }

      :deep(.vp-raw pre),
      :deep(.x-markdown pre) {
        margin: 12px 0;
        padding: 12px 14px;
        border-radius: 10px;
        border: 1px solid rgba(100, 116, 139, 0.25);
        background: #0f172a;
        color: #e2e8f0;
      }

      :deep(.vp-raw pre code),
      :deep(.x-markdown pre code) {
        padding: 0;
        border-radius: 0;
        background: transparent;
        color: inherit;
        font-size: 12.5px;
      }

      :deep(.vp-raw table),
      :deep(.x-markdown table) {
        border-collapse: collapse;
        margin: 12px 0;
        font-size: 13px;
      }

      :deep(.vp-raw th),
      :deep(.vp-raw td),
      :deep(.x-markdown th),
      :deep(.x-markdown td) {
        border: 1px solid rgba(100, 116, 139, 0.22);
        padding: 6px 10px;
      }

      :deep(.vp-raw th),
      :deep(.x-markdown th) {
        background: rgba(148, 163, 184, 0.14);
        font-weight: 600;
      }

      :deep(.vp-raw a),
      :deep(.x-markdown a) {
        color: #2563eb;
        text-decoration: underline;
        text-underline-offset: 2px;
      }

      :deep(.vp-raw hr),
      :deep(.x-markdown hr) {
        border: none;
        border-top: 1px solid rgba(148, 163, 184, 0.35);
        margin: 14px 0;
      }
    }

    .bubble-toolbar {
      position: absolute;
      right: 2px;
      top: 2px;
      bottom: auto;
      z-index: 2;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 4px;
    }

    .bubble-time {
      color: #9ca3af;
      font-size: 11px;
      line-height: 1.1;
      text-align: right;
    }

    .bubble-toolbar__icons {
      display: flex;
      align-items: center;
      gap: 6px;
      transform: none;
      opacity: 0;
      visibility: hidden;
      pointer-events: none;
      transition: opacity 0.2s ease;
    }

    .bubble-content:hover .bubble-toolbar__icons,
    .bubble-content:focus-within .bubble-toolbar__icons {
      opacity: 1;
      visibility: visible;
      pointer-events: auto;
    }

    .bubble-toolbar__icons--corner {
      position: absolute;
      right: 2px;
      bottom: 2px;
      z-index: 2;
    }

    .bubble-tool-icon {
      width: 18px;
      height: 18px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: #9ca3af;
      cursor: pointer;
      transition: color 0.2s ease, transform 0.2s ease;

      &:hover {
        color: #64748b;
        transform: scale(1.08);
      }
    }
  }

  .input-area {
    flex-shrink: 0;
    position: relative;
    z-index: 2;
    padding: 10px 12px 12px;
    background: var(--el-bg-color-overlay);
    border-top: 1px solid #e5e7eb;

    .editor-sender {
      :deep(.editor-sender-container) {
        border-radius: 8px;
        border: 1px solid #e5e7eb;
        overflow: hidden;

        &:focus-within {
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }
      }

      :deep(.editor-sender__textarea),
      :deep(textarea),
      :deep([contenteditable="true"]) {
        max-height: 132px !important;
      }
    }

    .editing-banner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 8px 12px;
      background: rgba(245, 158, 11, 0.08);
      border-bottom: 1px solid rgba(245, 158, 11, 0.18);
      color: #92400e;
      font-size: 13px;
      font-weight: 500;
    }

    /* 文件预览头部 */
    .file-preview-header {
      padding: 8px 12px;
      background: #f3f4f6;
      border-radius: 6px 6px 0 0;
      border-bottom: 1px solid #e5e7eb;

      .file-preview-title {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 14px;
        color: #374151;
        font-weight: 500;
      }
    }

    /* 输入前缀 */
    .input-prefix {
      display: flex;
      align-items: center;
      gap: 4px;

      .file-upload-btn {
        display: flex;
        align-items: center;

        :deep(.el-upload) {
          .el-button {
            border: none;
            background: transparent;

            &:hover {
              color: #667eea;
              background: rgba(102, 126, 234, 0.1);
            }
          }
        }
      }
    }

    /* 操作按钮 */
    .action-buttons {
      display: flex;
      align-items: center;
      gap: 4px;

      .model-select-inline {
        width: 190px;

        :deep(.el-select__wrapper) {
          min-height: 32px;
          border-radius: 999px;
          box-shadow: none;
          background: #f8fafc;
        }
      }
    }

    /* 文件预览底部 */
    .file-preview-footer {
      padding: 12px;
      background: #f3f4f6;
      border-radius: 0 0 6px 6px;
      border-top: 1px solid #e5e7eb;

      .file-list {
        display: flex;
        flex-direction: column;
        gap: 8px;

        .file-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 12px;
          background: var(--el-bg-color-overlay);
          border-radius: 4px;
          border: 1px solid #e5e7eb;
          transition: all 0.2s;

          &:hover {
            border-color: #667eea;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }

          .file-info {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 14px;
            color: #374151;
            flex: 1;

            .file-icon {
              font-size: 16px;
              color: #667eea;
            }

            .file-name {
              font-weight: 500;
              max-width: 200px;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
            }

            .file-size {
              color: #6b7280;
              font-size: 12px;
            }
          }

          .remove-btn {
            color: #ef4444;
            padding: 4px;

            &:hover {
              background-color: #fef2f2;
            }
          }
        }
      }
    }
  }
}

// 暗色主题
.dark {
  .chat-container {
    background: var(--el-bg-color-overlay);

    .conversation-panel {
      .history-section {
        .conversation-list {
          :deep(.conversation-item),
          :deep(.conversation-item.hovered),
          :deep(.conversation-item:hover) {
            color: var(--el-text-color-primary) !important;
            border: 1px solid transparent !important;
            background: transparent !important;
          }

          :deep(.conversation-item.hovered),
          :deep(.conversation-item:hover) {
            border-color: rgba(255, 255, 255, 0.2) !important;
            background: rgba(255, 255, 255, 0.06) !important;
            box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.06) !important;
          }

          :deep(.conversation-item .conversation-label),
          :deep(.conversation-item .conversation-title),
          :deep(.conversation-item .conversation-time),
          :deep(.conversation-item .conversation-desc) {
            color: inherit !important;
          }
        }
      }
    }

    .messages-area {
      background: var(--el-bg-color-overlay);

      .message-item {
        &.message-user {
          .message-content {
            background: #4f46e5;
          }
        }

        &.message-assistant {
          .message-content {
            background: var(--el-bg-color-overlay);
            border-color: var(--el-border-color);
            color: var(--el-text-color-primary);
          }
        }
      }
    }

    &.is-editing {
      :deep(.el-bubble-list-default-back-button) {
        display: none !important;
      }
    }

    .input-area {
      background: var(--el-bg-color-overlay);
      border-top-color: var(--el-border-color);

      .editor-sender {
        :deep(.editor-sender-container) {
          background: var(--el-bg-color-overlay);
          border-color: var(--el-border-color);
          color: var(--el-text-color-primary);

          &:focus-within {
            border-color: #4f46e5;
            box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.2);
          }
        }
      }

      .file-preview-header {
        background: #374151;
        border-bottom-color: #4b5563;

        .file-preview-title {
          color: #f9fafb;
        }
      }

      .file-preview-footer {
        background: #374151;
        border-top-color: #4b5563;

        .file-list {
          .file-item {
            background: #1f2937;
            border-color: #4b5563;
            color: #f9fafb;

            &:hover {
              border-color: #4f46e5;
            }

            .file-info {
              color: #f9fafb;

              .file-icon {
                color: #4f46e5;
              }

              .file-size {
                color: #9ca3af;
              }
            }

            .remove-btn {
              &:hover {
                background-color: #7f1d1d;
              }
            }
          }
        }
      }

      .action-buttons {
        .config-btn {
          background: #8b5cf6;
          border-color: #8b5cf6;
          color: var(--el-text-color-primary);

          &:hover {
            background: #7c3aed;
            border-color: #7c3aed;
          }
        }

        .stop-btn {
          &:hover {
            background: #dc2626;
          }
        }

        .send-btn {
          background: #4f46e5;
          border-color: #4f46e5;

          &:hover {
            background: #4338ca;
            border-color: #4338ca;
          }
        }
      }
    }
  }
}
</style>
