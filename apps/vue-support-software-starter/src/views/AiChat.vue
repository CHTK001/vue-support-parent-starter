<template>
  <div class="page ai-page">
    <div class="page-head">
      <h1 class="page-title">AI</h1>
      <div class="page-actions">
        <el-select v-model="currentModuleId" placeholder="选择模型" size="small" class="module-select" @change="fetchSessions">
          <el-option v-for="m in modules" :key="m.id" :label="m.name" :value="m.id" />
        </el-select>
        <el-button size="small" :icon="Setting" @click="$router.push('/ai/providers')" />
        <el-button size="small" :icon="Plus" @click="newSession">新建会话</el-button>
      </div>
    </div>
    <div class="ai-subnav">
      <router-link to="/ai" class="subnav-link" :class="{ active: $route.path === '/ai' }">对话</router-link>
      <router-link to="/ai/mcp" class="subnav-link" :class="{ active: $route.path === '/ai/mcp' }">MCP / Skills</router-link>
      <router-link to="/ai/providers" class="subnav-link" :class="{ active: $route.path === '/ai/providers' }">提供商</router-link>
      <router-link to="/ai/agents" class="subnav-link" :class="{ active: $route.path === '/ai/agents' }">客户端</router-link>
    </div>

    <div class="chat-layout">
      <div class="chat-sidebar">
        <div class="sidebar-title">会话列表</div>
        <div class="session-list">
          <div
            v-for="s in sessions"
            :key="s.id"
            class="session-item"
            :class="{ active: currentSessionId === s.id }"
            @click="switchSession(s.id!)"
          >
            <span class="session-title">{{ s.title || '新会话' }}</span>
            <el-button text size="small" class="session-del" @click.stop="delSession(s.id!)">
              <el-icon :size="12"><Close /></el-icon>
            </el-button>
          </div>
          <el-empty v-if="!sessions.length" description="暂无会话" :image-size="30" class="mt-4" />
        </div>
      </div>

      <div class="chat-main">
        <div class="messages" ref="messagesRef">
          <div v-if="!messages.length" class="welcome">
            <div class="welcome-icon">
              <el-icon :size="32"><ChatLineSquare /></el-icon>
            </div>
            <h2 class="welcome-title">有什么我可以帮助你的？</h2>
            <p class="welcome-desc">选择模型后，在下方输入问题开始对话</p>
          </div>
          <div v-for="msg in messages" :key="msg.id" class="msg" :class="msg.role">
            <div class="msg-avatar">{{ msg.role === 'user' ? 'U' : 'AI' }}</div>
            <div class="msg-content">{{ msg.content }}</div>
          </div>
          <div v-if="streaming" class="msg assistant">
            <div class="msg-avatar">AI</div>
            <div class="msg-content"><span class="cursor-blink">|</span></div>
          </div>
        </div>

        <div class="input-area">
          <el-input
            v-model="inputMessage"
            type="textarea"
            :rows="3"
            placeholder="输入问题，Enter 发送，Shift+Enter 换行"
            :disabled="streaming"
            @keydown.enter.exact="sendMessage"
          />
          <div class="input-actions">
            <span class="input-hint">Enter 发送 · Shift+Enter 换行</span>
            <el-button type="primary" :loading="streaming" :disabled="!inputMessage.trim()" @click="sendMessage">
              发送
            </el-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Close, ChatLineSquare, Setting } from '@element-plus/icons-vue'
import { listAiModules, listAiSessions, getAiSession, deleteAiSession, renameAiSession, aiChat, AiModule, AiSession, AiMessage } from '@/api/software'

const modules = ref<AiModule[]>([])
const sessions = ref<AiSession[]>([])
const messages = ref<AiMessage[]>([])
const currentModuleId = ref<number>()
const currentSessionId = ref<number>()
const inputMessage = ref('')
const streaming = ref(false)
const messagesRef = ref<HTMLElement>()

async function loadModules() {
  try {
    modules.value = await listAiModules()
    if (modules.value.length && !currentModuleId.value) {
      currentModuleId.value = modules.value[0].id
    }
  } catch { ElMessage.error('加载模型列表失败') }
}

async function fetchSessions() {
  try {
    sessions.value = await listAiSessions()
  } catch { ElMessage.error('加载会话列表失败') }
}

function newSession() {
  currentSessionId.value = undefined
  messages.value = []
  inputMessage.value = ''
}

async function switchSession(id: number) {
  currentSessionId.value = id
  try {
    const session = await getAiSession(id)
    messages.value = session.messages || []
    await nextTick()
    scrollToBottom()
  } catch { ElMessage.error('加载会话失败') }
}

async function delSession(id: number) {
  try {
    await deleteAiSession(id)
    if (currentSessionId.value === id) { currentSessionId.value = undefined; messages.value = [] }
    await fetchSessions()
  } catch { ElMessage.error('删除失败') }
}

async function sendMessage() {
  const msg = inputMessage.value.trim()
  if (!msg || streaming.value) return

  inputMessage.value = ''
  streaming.value = true

  // Add user message to UI
  messages.value.push({ sessionId: currentSessionId.value || 0, role: 'user', content: msg })

  try {
    const result = await aiChat(currentSessionId.value, currentModuleId.value, msg)
    currentSessionId.value = result.sessionId

    // Fetch updated messages
    const session = await getAiSession(result.sessionId)
    messages.value = session.messages || []
    await fetchSessions()
  } catch (e: any) {
    messages.value.push({ sessionId: currentSessionId.value || 0, role: 'assistant', content: '请求失败: ' + (e.message || '未知错误') })
  } finally {
    streaming.value = false
    await nextTick()
    scrollToBottom()
  }
}

function scrollToBottom() {
  const el = messagesRef.value
  if (el) el.scrollTop = el.scrollHeight
}

onMounted(() => {
  loadModules()
  fetchSessions()
})
</script>

<style scoped>
.page-head { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 20px; }
.page-title { font-size: 30px; font-weight: 700; letter-spacing: -0.5px; line-height: 1.2; }
.page-actions { display: flex; align-items: center; gap: 8px; }
.module-select { width: 200px; }

.ai-subnav { display: inline-flex; gap: 2px; margin-bottom: 16px; background: var(--el-fill-color-light); padding: 3px; border-radius: 10px; }
.subnav-link { padding: 5px 16px; border-radius: 7px; font-size: 13px; font-weight: 500; color: var(--el-text-color-secondary); text-decoration: none; transition: all 0.12s; }
.subnav-link:hover { color: var(--el-text-color-primary); }
.subnav-link.active { background: var(--el-bg-color); color: var(--el-text-color-primary); font-weight: 600; box-shadow: 0 1px 3px rgba(0,0,0,.06); }

.chat-layout { display: flex; gap: 16px; height: calc(100vh - 180px); }

.chat-sidebar {
  width: 240px; flex-shrink: 0;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-light);
  border-radius: 12px;
  display: flex; flex-direction: column;
  overflow: hidden;
}

.sidebar-title { font-size: 13px; font-weight: 600; padding: 14px 14px 8px; color: var(--el-text-color-secondary); }
.session-list { flex: 1; overflow-y: auto; padding: 4px 8px; }

.session-item {
  display: flex; align-items: center; gap: 4px;
  padding: 8px 10px; border-radius: 8px;
  cursor: pointer; transition: background 0.1s;
  font-size: 13px;
}
.session-item:hover { background: var(--el-color-primary-light-9); }
.session-item.active { background: var(--el-color-primary-light-9); font-weight: 500; }
.session-title { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.session-del { opacity: 0; transition: opacity 0.12s; flex-shrink: 0; }
.session-item:hover .session-del { opacity: 1; }

.chat-main {
  flex: 1; display: flex; flex-direction: column;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-light);
  border-radius: 12px;
  overflow: hidden;
}

.messages { flex: 1; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 16px; }

.welcome { display: flex; flex-direction: column; align-items: center; justify-content: center; flex: 1; gap: 8px; color: var(--el-text-color-secondary); }
.welcome-icon { opacity: 0.3; }
.welcome-title { font-size: 18px; font-weight: 600; color: var(--el-text-color-primary); }
.welcome-desc { font-size: 13px; }

.msg { display: flex; gap: 10px; max-width: 85%; }
.msg.user { align-self: flex-end; flex-direction: row-reverse; }
.msg.assistant { align-self: flex-start; }

.msg-avatar {
  width: 30px; height: 30px; border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  font-size: 11px; font-weight: 700; flex-shrink: 0;
}
.msg.user .msg-avatar { background: rgb(var(--el-color-primary)); color: #fff; }
.msg.assistant .msg-avatar { background: var(--el-fill-color-light); color: var(--el-text-color-primary); }

.msg-content {
  padding: 10px 14px; border-radius: 10px;
  font-size: 14px; line-height: 1.6;
  white-space: pre-wrap; word-break: break-word;
}
.msg.user .msg-content { background: rgb(var(--el-color-primary)); color: #fff; border-bottom-right-radius: 4px; }
.msg.assistant .msg-content { background: var(--el-fill-color-light); border-bottom-left-radius: 4px; }

.cursor-blink { animation: blink 1s step-end infinite; }
@keyframes blink { 50% { opacity: 0; } }

.input-area {
  border-top: 1px solid var(--el-border-color-light);
  padding: 12px 16px;
}
.input-area :deep(.el-textarea__inner) { border: none; resize: none; box-shadow: none; padding: 0; font-size: 14px; }

.input-actions { display: flex; align-items: center; justify-content: space-between; margin-top: 8px; }
.input-hint { font-size: 11px; color: var(--el-text-color-secondary); }

.mt-4 { margin-top: 16px; }
</style>
