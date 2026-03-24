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

          <div class="action-item" @click="handleRefreshConversations">
            <div class="action-icon">
              <IconifyIconOnline icon="ri:refresh-line" />
            </div>
            <span class="action-text">刷新会话</span>
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
            v-model:active="currentConversationId"
            :loading="conversationLoading"
            :groupable="true"
            @change="handleConversationSelect"
            @menu-command="handleMenuCommand"
            @item-delete="handleConversationDelete"
            @item-rename="handleConversationRename"
            class="conversation-list"
            :show-tooltip="true"
            show-to-top-btn
            show-built-in-menu
          >
          </Conversations>

          <div class="view-all">
            <span>查看全部</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 右侧聊天区域 -->
    <div class="chat-main" :class="{ expanded: isConversationCollapsed }">
      <!-- 消息列表区域 -->
      <div class="messages-area" ref="messagesContainer">
        <BubbleList
          :list="bubbleListData"
          ref="messagesContainerBubbleList"
          maxHeight="100%"
          :btnLoading="isLoading && !messages.some((m) => m.streaming)"
          @scroll-to-bottom="scrollToBottom"
        >
          <template #content="{ item }">
            <XMarkdown
              :markdown="item.content"
              class="vp-raw"
              :allowHtml="true"
            />
          </template>
          <template #footer="{ item }" v-if="!isLoading">
            <div class="footer-container">
              <ScTooltip content="复制内容" placement="top">
                <ScButton 
                  :icon="useRenderIcon('ep:copy-document')"
                  size="small"
                  circle
                  @click="handleCopyMessage(item)"
                />
              </ScTooltip>
              <ScTooltip 
                content="重新发送"
                placement="top"
                v-if="item.type === 'sent'"
              >
                <ScButton 
                  :icon="useRenderIcon('ep:refresh')"
                  size="small"
                  circle
                  @click="handleResendMessage(item)"
                />
              </ScTooltip>
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
              <ScTooltip content="上传文件" placement="top">
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

              <ScTooltip content="插入提示词模板" placement="top">
                <ScButton size="small" text @click="openPromptTemplateDialog">
                  <IconifyIconOnline icon="ri:magic-line" />
                </ScButton>
              </ScTooltip>
            </div>
          </template>

          <!-- 自定义操作列表 -->
          <template #action-list>
            <div class="action-buttons">
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

              <!-- 模型配置浮动面板 -->
              <ScContainer
                v-model:visible="showModelConfig"
                :width="390"
                position="top-right"
                @close="showModelConfig = false"
              >
                <template #reference>
                  <ScButton 
                    circle
                    @click="toggleModelConfig"
                    class="config-btn"
                    title="高级功能"
                  >
                    <IconifyIconOnline icon="mdi:tune-variant" />
                  </ScButton>
                </template>
                <ModelConfig
                  :form="form"
                  :rules="rules"
                  :model-list="modelList"
                  :env="env"
                  :show-role-setting="showRoleSetting"
                  @refresh="handleRefreshModels"
                  @change-module="handleChangeModule"
                  @open-module="handleOpenModule"
                  @click-seed="handleClickSeed"
                  @close="showModelConfig = false"
                />
              </ScContainer>

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
                      >({{ formatFileSize(file.size) }})</span
                    >
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
import { fetchEventSource } from "@microsoft/fetch-event-source";
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import { ScContainer } from "@repo/components/ScContainer";
import { fetchCallStream } from "@repo/core";
import { message , ScMessageBox} from "@repo/utils";

import { computed, nextTick, ref, watch } from "vue";
import {
  createConversation,
  deleteConversation,
  getConversationList,
  getConversationMessages,
  renameConversation,
  saveMessages,
} from "../../../../api/ai/conversation";
import ModelConfig from "./ModelConfig.vue";
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

// 会话管理相关数据
const isConversationCollapsed = ref(false);
const conversationLoading = ref(false);
const currentConversationId = ref(null);
const conversationList = ref([]);

// 模型配置相关数据
const showModelConfig = ref(false);
const modelList = ref([]);
const rules = ref({});
const showRoleSetting = ref(true);

// 用户和机器人信息
const userInfo = computed(() => ({
  name: "用户",
  avatar: "/default-user-avatar.png",
}));

const botInfo = computed(() => ({
  name: props.form?.sysAiModuleName || "AI助手",
  avatar: props.form?.sysProjectIcon || "/default-bot-avatar.png",
}));

// 计算属性
const canSend = computed(() => {
  return currentMessage.value.trim() || uploadedFiles.value.length > 0;
});

const handleCurrentChangeValue = async () => {
  const result = editorSenderRef.value.getCurrentValue();
  currentMessage.value = result.text;
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
    avatar:
      message.role === "user" ? userInfo.value.avatar : botInfo.value.avatar,
    name: message.role === "user" ? userInfo.value.name : botInfo.value.name,
    streaming: message.streaming || false,
    messageType: message.type || "text",
    filename: message.filename,
    fileIcon: message.type === "file" ? getFileIcon(message.type) : null,
  }));
});

// 提示词模板
const promptTemplates = ref([
  {
    label: "📝 写作助手",
    value: "请帮我写一篇关于",
    description: "协助创作文章、报告等",
  },
  {
    label: "💻 代码助手",
    value: "请帮我写一段代码，功能是",
    description: "编程问题解答和代码生成",
  },
  {
    label: "🔍 分析助手",
    value: "请帮我分析一下",
    description: "数据分析和问题解答",
  },
  {
    label: "🎨 创意助手",
    value: "请给我一些创意想法关于",
    description: "创意灵感和头脑风暴",
  },
  {
    label: "📚 学习助手",
    value: "请解释一下",
    description: "知识学习和概念解释",
  },
  {
    label: "🌐 翻译助手",
    value: "请将以下内容翻译成中文：",
    description: "多语言翻译服务",
  },
]);

// SSE 相关变量
let controller = null;
let sessionId = localStorage.getItem("sessionId") || "";

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
  if (!props.form?.sysProjectId) {
    message("请先选择项目", { type: "error" });
    return;
  }

  if (!props.form?.model) {
    message("请先选择模型", { type: "error" });
    return;
  }

  if (!currentMessage.value.trim()) {
    return;
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
        sysProjectId: props.form?.sysProjectId,
      });

      if (newConversation) {
        // 先重新加载会话列表
        await loadConversationList();
        // 然后选中新创建的会话，确保会话状态正确
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
  // 如果是新会话则生成ID
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem("sessionId", sessionId);
  }

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

  controller = new AbortController();
  const signal = controller.signal;

  // 重试配置
  let retryCount = 0;
  const maxRetries = 1;
  const retryDelay = 1000; // 1秒

  const attemptConnection = async () => {
    try {
      await fetchEventSource(fetchCallStream({}), {
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
          files: fileInfo,
        }),
        onmessage(event) {
          // 重置重试计数器，因为连接成功
          retryCount = 0;

          const data = JSON.parse(event.data);

          // 如果对话结束
          if (data.done) {
            isLoading.value = false;
            const aiMessage = messages.value.find(
              (msg) => msg.id === aiMessageId
            );
            if (aiMessage) {
              aiMessage.streaming = false;

              // 保存聊天内容到数据库
              saveChatMessages(prompt, aiMessage.content);

              // 确保最终滚动到底部
              nextTick(() => {
                scrollToBottom();
              });
            }
            return;
          }

          // 更新 AI 消息内容
          if (data.output) {
            const aiMessage = messages.value.find(
              (msg) => msg.id === aiMessageId
            );
            if (aiMessage) {
              aiMessage.content += data.output;
              // 实时滚动到底部，让用户看到AI的回复
              nextTick(() => {
                scrollToBottom();
              });
            }
          }
        },
        onerror(error) {
          console.error("EventSource error:", error);

          // 检查是否是用户主动取消
          if (signal.aborted) {
            return;
          }

          retryCount++;

          if (retryCount <= maxRetries) {
            console.log(`连接失败，正在进行第 ${retryCount} 次重试...`);
            message.warning(`连接失败，正在重试 (${retryCount}/${maxRetries})`);

            // 延迟后重试
            setTimeout(() => {
              if (!signal.aborted) {
                attemptConnection();
              }
            }, retryDelay * retryCount); // 递增延迟
          } else {
            // 达到最大重试次数，结束连接
            isLoading.value = false;
            message.error(`连接失败，已重试 ${maxRetries} 次，请稍后再试`);

            // 移除失败的消息
            const index = messages.value.findIndex(
              (msg) => msg.id === aiMessageId
            );
            if (index > -1) {
              messages.value.splice(index, 1);
            }

            // 主动结束连接
            if (controller) {
              controller.abort();
            }
          }
        },
      });
    } catch (error) {
      console.error("Send message error:", error);

      if (!signal.aborted) {
        retryCount++;

        if (retryCount <= maxRetries) {
          console.log(`发送失败，正在进行第 ${retryCount} 次重试...`);
          message.warning(`发送失败，正在重试 (${retryCount}/${maxRetries})`);

          setTimeout(() => {
            if (!signal.aborted) {
              attemptConnection();
            }
          }, retryDelay * retryCount);
        } else {
          isLoading.value = false;
          message.error(`发送失败，已重试 ${maxRetries} 次，请稍后再试`);

          // 移除失败的消息
          const index = messages.value.findIndex(
            (msg) => msg.id === aiMessageId
          );
          if (index > -1) {
            messages.value.splice(index, 1);
          }
        }
      }
    }
  };

  // 开始连接
  await attemptConnection();
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

// 模型配置相关方法
const toggleModelConfig = () => {
  showModelConfig.value = !showModelConfig.value;
};

const handleRefreshModels = () => {
  // 刷新模型列表的逻辑
  message.success("模型列表已刷新");
};

const handleChangeModule = (moduleCode) => {
  // 切换模型的逻辑
  if (props.form) {
    props.form.model = moduleCode;
  }
  message.success("模型已切换");
};

const handleOpenModule = () => {
  // 打开模型管理的逻辑
  message.info("打开模型管理");
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
  sessionId = "";
  localStorage.removeItem("sessionId");
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

// 打开提示词模板对话框
const openPromptTemplateDialog = () => {
  // 创建模板选择HTML
  const templateOptions = promptTemplates.value
    .map(
      (template, index) =>
        `<div class="template-option" data-index="${index}" style="
      padding: 12px;
      margin: 8px 0;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;
    " onmouseover="this.style.backgroundColor='#f3f4f6'" onmouseout="this.style.backgroundColor='white'">
      <div style="font-weight: 600; color: #374151; margin-bottom: 4px;">${template.label}</div>
      <div style="color: #6b7280; font-size: 12px; margin-bottom: 6px;">${template.description}</div>
      <div style="color: #4f46e5; font-size: 14px; font-family: monospace;">${template.value}</div>
    </div>`
    )
    .join("");

  ElMessageBox({
    title: "选择提示词模板",
    message: `<div style="max-height: 400px; overflow-y: auto;">${templateOptions}</div>`,
    dangerouslyUseHTMLString: true,
    showCancelButton: true,
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    beforeClose: (action, instance, done) => {
      if (action === "confirm") {
        const selectedElement = instance.$el.querySelector(
          '.template-option[data-selected="true"]'
        );
        if (selectedElement) {
          const index = parseInt(selectedElement.getAttribute("data-index"));
          const selectedTemplate = promptTemplates.value[index];
          currentMessage.value = selectedTemplate.value;
          if (editorSenderRef.value) {
            editorSenderRef.value.setValue(selectedTemplate.value);
            nextTick(() => {
              editorSenderRef.value.focus();
            });
          }
        }
      }
      done();
    },
  })
    .then(() => {
      // 确认选择
    })
    .catch(() => {
      // 取消选择
    });

  // 添加点击事件监听
  nextTick(() => {
    const templateElements = document.querySelectorAll(".template-option");
    templateElements.forEach((element) => {
      element.addEventListener("click", () => {
        // 清除其他选中状态
        templateElements.forEach((el) => {
          el.removeAttribute("data-selected");
          el.style.backgroundColor = "white";
          el.style.borderColor = "#e5e7eb";
        });
        // 设置当前选中
        element.setAttribute("data-selected", "true");
        element.style.backgroundColor = "#eff6ff";
        element.style.borderColor = "#3b82f6";
      });
    });
  });
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

// 重新发送消息
const handleResendMessage = (item) => {
  if (item.type === "sent" && item.content) {
    // 设置输入框内容为要重新发送的消息
    currentMessage.value = item.content;
    editorSenderRef.value.setText(item.content);

    // 自动发送
    nextTick(() => {
      handleSendMessage();
    });
  }
};

// 会话管理方法
// 切换会话面板
const toggleConversationPanel = () => {
  isConversationCollapsed.value = !isConversationCollapsed.value;
};

// 新建会话
const handleNewConversation = async () => {
  if (!props.form?.sysProjectId) {
    message("请先选择项目", { type: "error" });
    return;
  }

  try {
    conversationLoading.value = true;

    // 立即创建默认名称的会话
    const newConversation = await createConversation({
      sysAiGroupName: "新建会话",
      sysProjectId: props.form?.sysProjectId,
    });

    if (newConversation) {
      currentConversationId.value = newConversation.sysAiGroupId;
      messages.value = [];
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
  if (!props.form?.sysProjectId) {
    message("请先选择项目", { type: "error" });
    return;
  }

  try {
    await loadConversationList();
    message("会话列表刷新成功", { type: "success" });
  } catch (error) {
    console.error("刷新会话列表失败:", error);
    message("刷新会话列表失败", { type: "error" });
  }
};

// 选择会话
const handleConversationSelect = async (conversation) => {
  try {
    currentConversationId.value = conversation.sysAiGroupId;

    // 清空当前消息
    messages.value = [];

    // 加载会话历史消息（支持分页）
    try {
      const { data: pageResult } = await getConversationMessages(
        conversation.sysAiGroupId,
        1,
        100
      );

      if (pageResult && pageResult.records && pageResult.records.length > 0) {
        // 将历史消息转换为前端消息格式
        messages.value = pageResult.records.map((msg, index) => ({
          id: Date.now() + index,
          type: msg.sysAiGroupMessageType || "text",
          content: msg.sysAiGroupMessageContent,
          role: msg.sysAiGroupMessageRole,
          timestamp: new Date(),
          streaming: false,
        }));

        console.log(
          `加载了 ${pageResult.records.length} 条历史消息，总共 ${pageResult.total} 条`
        );

        // 如果消息很多，可以考虑实现滚动加载更多
        if (pageResult.total > pageResult.records.length) {
          console.log(
            `还有 ${pageResult.total - pageResult.records.length} 条消息未加载`
          );
        }
      } else {
        console.log("该会话暂无历史消息");
      }
    } catch (historyError) {
      console.error("加载历史消息失败:", historyError);
      // 历史消息加载失败不影响会话切换，只是没有历史记录
    }

    // 滚动到底部
    nextTick(() => {
      scrollToBottom();
    });
  } catch (error) {
    console.error("加载会话失败:", error);
    message("加载会话失败", { type: "error" });
  }
};
// 内置菜单点击方法
function handleMenuCommand(command, item) {
  console.log("内置菜单点击事件：", command, item);
  // 直接修改 item 是否生效
  const index = conversationList.value.findIndex(
    (itemSlef) => itemSlef.key === item.key
  );
  if (command === "delete") {
    if (index !== -1) {
      handleConversationDelete(conversationList.value[index]);
      conversationList.value.splice(index, 1);
      console.log("删除成功");
      message.success("删除成功");
    }
  }
  if (command === "rename") {
    // 弹出编辑框
    ScMessageBox.prompt("请输入新的会话名称", "重命名会话", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      inputValue: conversationList.value[index].label,
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
        if (value && value.trim() !== conversationList.value[index].label) {
          handleConversationRename(conversationList.value[index], value.trim());
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
      sysProjectId: props.form?.sysProjectId,
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
  if (!props.form?.sysProjectId) return;

  try {
    conversationLoading.value = true;
    const { data: conversations } = await getConversationList(
      props.form.sysProjectId
    );
    conversationList.value = (conversations || []).map((conv) => {
      const updateTime = conv.updateTime
        ? new Date(conv.updateTime)
        : new Date();
      const now = new Date();
      const diffTime = now.getTime() - updateTime.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      let group = "很久以前的会话";
      if (diffDays === 0) {
        group = "今天的会话";
      } else if (diffDays === 1) {
        group = "昨天的会话";
      } else if (diffDays <= 7) {
        group = "一周前的会话";
      } else if (diffDays <= 30) {
        group = "一个月前的会话";
      }

      return {
        sysAiGroupId: conv.sysAiGroupId,
        id: conv.sysAiGroupId, // 保持兼容性
        label: conv.sysAiGroupName,
        time: updateTime.toLocaleString(),
        avatar: "/default-conversation-avatar.png",
        description: conv.groupDescription || "暂无描述",
        group: group, // 添加分组信息
        ...conv, // 保留原始数据
      };
    });
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
    if (messages.value.length > 0) {
      handleClearMessages();
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
    currentMessage.value = template;
    nextTick(() => {
      editorSenderRef.value?.focus();
    });
  },
});
</script>

<style scoped lang="scss">
.chat-container {
  height: 100%;
  display: flex;
  flex-direction: row;
  background: var(--el-bg-color-overlay);
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  overflow: hidden;

  // 会话管理面板样式
  .conversation-panel {
    width: 280px;
    background: var(--el-bg-color-overlay);
    border-right: 1px solid var(--el-border-color);
    display: flex;
    flex-direction: column;
    transition: all 0.3s ease;

    &.collapsed {
      width: 60px;
    }

    .conversation-header {
      height: 60px;
      padding: 16px;
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
      padding: 0;
      overflow-y: auto;
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
          background: var(--el-bg-color-overlay) !important;
          :deep(.el-scrollbar__view) {
            padding: 0;
          }

          :deep(.conversations-list) {
            background: var(--el-bg-color-overlay) !important;
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

  // 右侧聊天区域样式
  .chat-main {
    flex: 1;
    display: flex;
    flex-direction: column;
    transition: all 0.3s ease;

    &.expanded {
      // 当会话面板收缩时的样式
    }
  }

  .messages-area {
    flex: 1;
    padding: 20px;
    overflow-y: auto;
    background: #fafafa;

    .footer-container {
      display: flex;
      gap: 8px;
      justify-content: flex-end;
      margin-top: 8px;

      .el-button {
        transition: all 0.2s ease;

        &:hover {
          transform: scale(1.1);
        }
      }
    }
  }

  .input-area {
    height: 120px;
    padding: 16px;
    background: var(--el-bg-color-overlay);
    border-top: 1px solid #e5e7eb;

    .editor-sender {
      :deep(.editor-sender-container) {
        border-radius: 8px;
        border: 1px solid #e5e7eb;

        &:focus-within {
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }
      }
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
