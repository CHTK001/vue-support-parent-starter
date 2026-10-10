<template>
  <div class="connector-chat">
    <!-- 顶部栏 -->
    <header class="chat-topbar">
      <div class="topbar-left">
        <button type="button" class="back-btn" title="返回连接器列表" @click="router.back()">
          <el-icon :size="18"><ArrowLeft24Regular /></el-icon>
        </button>
        <span class="topbar-badge">
          <ConnectorIcon :type="connectorInfo.type" :size="18" />
        </span>
        <div class="topbar-id">
          <span class="topbar-name">{{ connectorInfo.name || '连接器' }}</span>
          <span class="topbar-sub">
            <span class="status-dot" :class="connectorInfo.status === 'online' ? 'is-online' : 'is-off'" />
            {{ connectorInfo.status === 'online' ? '在线' : '离线' }}
            <span class="topbar-type">{{ platformLabel }}</span>
          </span>
        </div>
      </div>

      <div class="topbar-right">
          <button
            ref="mcpButtonRef"
            class="topbar-btn"
            :class="{ 'is-active': selectedMcpServerIds.length > 0 }"
            title="MCP 工具"
            @click="mcpPopoverVisible = !mcpPopoverVisible"
          >
            <Tools />
            <span v-if="selectedMcpServerIds.length" class="topbar-btn__count">
              {{ selectedMcpServerIds.length }}
            </span>
          </button>
        <McpSelectorPopover
          v-if="admin"
          v-model:visible="mcpPopoverVisible"
          :anchor-el="mcpButtonRef"
          :selected-ids="selectedMcpServerIds"
          @change="selectedMcpServerIds = $event"
        />
      </div>
    </header>

    <!-- 主体 -->
    <div class="chat-body">
      <ConversationRail
        :conversations="conversations"
        :active-chat-id="activeChatId"
        :online="connectorInfo.status === 'online'"
        :loading="loadingConversations"
        @select="handleSelectConversation"
        @refresh="loadConversations"
        @clear="handleClearConversation"
      />

      <section class="chat-panel">
        <!-- 会话子头 -->
        <div v-if="activeConversation" class="chat-subheader">
          <span class="sub-avatar" :class="activeConversation.fromGroup ? 'is-group' : 'is-person'">
            <el-icon :size="15">
              <People24Regular v-if="activeConversation.fromGroup" />
              <Person24Regular v-else />
            </el-icon>
          </span>
          <div class="sub-id">
            <span class="sub-title">{{ conversationTitle(activeConversation) }}</span>
            <span class="sub-desc">
              {{ activeConversation.messageCount }} 条消息
              <span v-if="activeConversation.fromGroup" class="sub-tag">群聊</span>
            </span>
          </div>
        </div>

        <MessageStream
          ref="messageStreamRef"
          :messages="messages"
          :active="!!activeChatId"
          :platform="connectorInfo.type"
          :connector-name="connectorInfo.name || '连接器'"
          :loading="loadingMessages"
        />

        <MessageComposer
          v-model="inputMessage"
          v-model:context-count="contextCount"
          :sending="sending"
          :ai-sending="aiSending"
          :disabled="!activeChatId"
          @send="handleSend"
          @ai-send="handleAiSend"
        />
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Tools } from '@element-plus/icons-vue'
import {
  ArrowLeft24Regular, Person24Regular, People24Regular,
} from '@vicons/fluent'
import { isAdmin } from '@repo/core'
import { api } from '@/framework/context'
import ConnectorIcon from './ConnectorIcon.vue'
import McpSelectorPopover from '../chat/chat-input/McpSelectorPopover.vue'
import ConversationRail from './chat/ConversationRail.vue'
import MessageStream from './chat/MessageStream.vue'
import MessageComposer from './chat/MessageComposer.vue'
import { conversationTitle } from './chat/format'

defineOptions({ name: 'ConnectorChatPage' })

const route = useRoute()
const router = useRouter()

const connectorId = computed(() => Number(route.params.id))
const admin = isAdmin()

const connectorInfo = ref<any>({})
const conversations = ref<any[]>([])
const activeChatId = ref('')
const messages = ref<any[]>([])
const inputMessage = ref('')
const contextCount = ref(10)
const selectedMcpServerIds = ref<string[]>([])
const mcpPopoverVisible = ref(false)
const mcpButtonRef = ref<HTMLElement | null>(null)
const loadingConversations = ref(false)
const loadingMessages = ref(false)
const sending = ref(false)
const aiSending = ref(false)

let pollTimer: ReturnType<typeof setInterval> | null = null

const activeConversation = computed(() =>
  conversations.value.find(c => c.chatId === activeChatId.value),
)

const platformLabel = computed(() => {
  const map: Record<string, string> = {
    wechat: '微信', qq: 'QQ', dingtalk: '钉钉',
    feishu: '飞书', lark: 'Lark', telegram: 'Telegram',
  }
  const t = connectorInfo.value.type
  return t ? `· ${map[t] || t}` : ''
})

async function loadConnectorInfo() {
  try {
    const data = await api.get(`/connectors/${connectorId.value}`)
    connectorInfo.value = data || {}
    if (data?.mcpServerIds) selectedMcpServerIds.value = data.mcpServerIds
    if (data?.randomContextCount != null) contextCount.value = data.randomContextCount
  } catch (e) {
    console.error('加载连接器信息失败', e)
  }
}

async function loadConversations() {
  loadingConversations.value = true
  try {
    const data = await api.get(`/connectors/${connectorId.value}/conversations`)
    conversations.value = data || []
    if (!activeChatId.value && conversations.value.length) {
      handleSelectConversation(conversations.value[0].chatId)
    }
  } catch (e) {
    console.error('加载会话列表失败', e)
  } finally {
    loadingConversations.value = false
  }
}

async function loadMessages() {
  if (!activeChatId.value) return
  loadingMessages.value = true
  try {
    const data = await api.get(
      `/connectors/${connectorId.value}/messages`,
      { params: { chatId: activeChatId.value } },
    )
    messages.value = data || []
  } catch (e) {
    console.error('加载消息失败', e)
  } finally {
    loadingMessages.value = false
  }
}

function handleSelectConversation(chatId: string) {
  activeChatId.value = chatId
  messages.value = []
  loadMessages()
}

async function handleSend() {
  if (!inputMessage.value.trim() || !activeChatId.value || sending.value) return
  sending.value = true
  try {
    const data = await api.post(`/connectors/${connectorId.value}/send`, {
      chatId: activeChatId.value,
      content: inputMessage.value,
      mcpServerIds: selectedMcpServerIds.value,
    })
    if (data?.sent === false) {
      ElMessage.warning(data.errorMessage || data.message || '消息未能送达，对方可能暂时不可达')
    } else {
      ElMessage.success('消息已发送')
    }
    inputMessage.value = ''
    await loadMessages()
    await loadConversations()
  } catch (e: any) {
    ElMessage.error(e?.message || '发送失败')
  } finally {
    sending.value = false
  }
}

async function handleAiSend() {
  if (!inputMessage.value.trim() || !activeChatId.value || aiSending.value) return
  aiSending.value = true
  try {
    const data = await api.post(`/connectors/${connectorId.value}/ai-send`, {
      chatId: activeChatId.value,
      prompt: inputMessage.value,
      contextCount: contextCount.value,
      mcpServerIds: selectedMcpServerIds.value,
    })
    if (data?.sent === false) {
      ElMessage.warning(data.errorMessage || data.message || 'AI 回复未能送达，对方可能暂时不可达')
    } else {
      ElMessage.success('AI 回复已发送')
    }
    inputMessage.value = ''
    await loadMessages()
    await loadConversations()
  } catch (e: any) {
    ElMessage.error(e?.message || 'AI 发送失败')
  } finally {
    aiSending.value = false
  }
}

async function handleClearConversation(conv: any) {
  try {
    await ElMessageBox.confirm(
      `确定要清除与「${conversationTitle(conv)}」的会话记录吗？`,
      '清除会话',
      { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' },
    )
  } catch {
    return
  }
  try {
    await api.delete(`/connectors/${connectorId.value}/conversations`, {
      params: { chatId: conv.chatId },
    })
    ElMessage.success('会话已清除')
    if (activeChatId.value === conv.chatId) {
      activeChatId.value = ''
      messages.value = []
    }
    await loadConversations()
  } catch (e: any) {
    ElMessage.error(e?.message || '清除失败')
  }
}

function handleClearMcp() {
  selectedMcpServerIds.value = []
}

onMounted(async () => {
  await loadConnectorInfo()
  await loadConversations()
  pollTimer = setInterval(() => {
    loadConversations()
    if (activeChatId.value) loadMessages()
  }, 5000)
})

onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer)
})
</script>


/* MCP 工具选择按钮 */
.topbar-btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  border: 1px solid var(--el-border-color);
  border-radius: 6px;
  background: transparent;
  color: var(--el-text-color-regular);
  cursor: pointer;
}

.topbar-btn:hover {
  color: var(--el-color-primary);
  border-color: var(--el-color-primary);
}

.topbar-btn.is-active {
  color: var(--el-color-primary);
  border-color: var(--el-color-primary);
}

.topbar-btn__count {
  position: absolute;
  top: -6px;
  right: -6px;
  min-width: 14px;
  height: 14px;
  padding: 0 3px;
  border-radius: 7px;
  background: var(--el-color-primary);
  color: #fff;
  font-size: 10px;
  line-height: 14px;
  text-align: center;
}
<style scoped>
.connector-chat {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--color-bg);
}

/* 顶部栏 */
.chat-topbar {
  height: 60px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-surface-border);
}
.topbar-left {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}
.back-btn {
  width: 38px;
  height: 38px;
  border: none;
  /* 原值 12px → lg 档 */
  border-radius: var(--el-radius-lg, 12px);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-gray);
  background: transparent;
  cursor: pointer;
  transition: background 0.18s ease, color 0.18s ease;
}
.back-btn:hover {
  background: var(--el-fill-color-light);
  color: var(--color-text);
}
.topbar-badge {
  width: 40px;
  height: 40px;
  /* 原值 13px → lg 档 */
  border-radius: var(--el-radius-lg, 12px);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}
.topbar-id {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.topbar-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text);
  line-height: 1.2;
}
.topbar-sub {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: var(--color-text-gray);
}
.topbar-type {
  color: var(--color-text-disabled);
}
.status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
}
.status-dot.is-online {
  background: var(--el-color-success);
}
.status-dot.is-off {
  background: var(--el-color-info-light-5);
}

/* 主体 */
.chat-body {
  flex: 1;
  min-height: 0;
  display: flex;
}

.chat-panel {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  background: var(--color-bg);
}

/* 会话子头 */
.chat-subheader {
  flex-shrink: 0;
  height: 58px;
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 0 24px;
  background: var(--color-bg);
  border-bottom: 1px solid var(--color-surface-border);
}
.sub-avatar {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.sub-avatar.is-group {
  color: var(--el-color-warning);
  background: var(--el-color-warning-light-9);
}
.sub-avatar.is-person {
  color: var(--color-text-gray);
  background: var(--el-fill-color-light);
}
.sub-id {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.sub-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text);
  line-height: 1.2;
}
.sub-desc {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--color-text-gray);
}
.sub-tag {
  padding: 1px 7px;
  border-radius: 999px;
  font-size: 10.5px;
  color: var(--el-color-warning-dark-2);
  background: var(--el-color-warning-light-9);
}

/* 动效降级：系统开启「减少动态效果」时，返回按钮的底色与文字色直接到位。
   只关 .back-btn 自己的 transition，不写 `*` / .back-btn * 通配，
   避免把内部 el-icon 组件的合法过渡一起掐掉。
   .is-active / :hover 都是静态声明，停掉过渡后照常成立。
   注：本文件 </script> 与 <style scoped> 之间有一段游离在 style 块之外的 .topbar-btn 规则，
   那是既有问题（那批样式实际不生效），本次不动。 */
@media (prefers-reduced-motion: reduce) {
  .back-btn {
    transition: none;
  }
}
</style>
