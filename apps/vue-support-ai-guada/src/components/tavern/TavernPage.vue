<template>
  <div class="tavern-root">
    <!-- ============ 左侧：群列表（微信会话列表） ============ -->
    <aside class="tv-list">
      <div class="tv-list-head">
        <div class="tv-search">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round" class="tv-search-ico">
            <circle cx="11" cy="11" r="7" /><path d="m20 20-3.2-3.2" />
          </svg>
          <input v-model="groupKw" class="tv-search-input" type="text" placeholder="搜索群聊" />
        </div>
        <button class="tv-add" type="button" title="创建群聊" @click="openCreateGroup">
          <el-icon><Plus /></el-icon>
        </button>
      </div>

      <div class="tv-list-body">
        <div
          v-for="g in shownGroups"
          :key="g.id"
          class="tv-conv"
          :class="{ active: g.id === currentGroupId }"
          @click="selectGroup(g)"
        >
          <CardAvatar :src="g.avatar" :name="g.name" size="lg" class="tv-conv-avatar" />
          <div class="tv-conv-main">
            <div class="tv-conv-row1">
              <span class="tv-conv-name">{{ g.name }}</span>
              <span v-if="g.createTime" class="tv-conv-time">{{ fmtDay(g.createTime) }}</span>
            </div>
            <div class="tv-conv-row2">
              <span class="tv-conv-preview">{{ previewCount(g) }} 名角色 · 群主是你</span>
              <span class="tv-conv-more" title="更多操作" @click.stop>
                <el-dropdown trigger="click" placement="bottom-end" @command="(c) => onGroupCmd(c, g)">
                  <el-icon><MoreFilled /></el-icon>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item command="rename">重命名</el-dropdown-item>
                      <el-dropdown-item command="delete" divided>删除并退出</el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </span>
            </div>
          </div>
        </div>

        <div v-if="!shownGroups.length" class="tv-list-empty">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"
            stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 11.5a8.38 8.38 0 0 1-8.5 8.5 8.5 8.5 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 8.5-8.5 8.38 8.38 0 0 1 8.5 8.5Z" />
          </svg>
          <p>{{ groups.length ? '没有匹配的群' : '还没有群，点右上角 + 创建' }}</p>
        </div>
      </div>
    </aside>

    <!-- ============ 右侧：聊天区 ============ -->
    <section class="tv-chat">
      <template v-if="currentGroup">
        <!-- 聊天头部 -->
        <header class="tv-chat-head">
          <div class="tv-chat-title-wrap">
            <span class="tv-chat-name">{{ currentGroup.name }}</span>
            <span class="tv-chat-count">（{{ members.length }} 名角色）</span>
          </div>
          <button class="tv-chat-set" type="button" title="群设置" @click="settingsVisible = true">
            <el-icon><MoreFilled /></el-icon>
          </button>
        </header>

        <!-- 消息区 -->
        <div ref="msgBoxRef" class="tv-msgs">
          <div
            v-for="m in messages"
            :key="m._key"
            class="tv-msg"
            :class="m.speakerType === 'user' ? 'is-self' : 'is-other'"
          >
            <CardAvatar
              v-if="m.speakerType !== 'user'"
              :src="avatarOf(m)"
              :name="m.speakerName || 'AI'"
              size="md"
              class="tv-msg-avatar"
            />
            <div class="tv-msg-col">
              <div v-if="m.speakerType !== 'user'" class="tv-msg-meta">
                <span class="tv-msg-name">{{ m.speakerName }}</span>
                <span v-if="m.modelName" class="tv-msg-model">{{ m.modelName }}</span>
              </div>
              <div class="tv-bubble" :class="m.speakerType === 'user' ? 'b-self' : 'b-other'">
                <MarkdownContent v-if="m.speakerType !== 'user'" class="markdown-text" :content="m.content" />
                <span v-else class="tv-plain">{{ m.content }}</span>
                <span v-if="m.streaming" class="typing-dots"><i></i><i></i><i></i></span>
              </div>
            </div>
            <CardAvatar
              v-if="m.speakerType === 'user'"
              name="我"
              size="md"
              class="tv-msg-avatar"
            />
          </div>

          <div v-if="!messages.length" class="tv-msgs-empty">
            <p>发条消息试试吧</p>
            <p class="sub">@ 指定角色，或直接说话由角色主动回应</p>
          </div>
        </div>

        <!-- 输入区 -->
        <div class="tv-input">
          <div v-if="pendingAt" class="tv-at-chip">
            <el-tag closable type="primary" @close="pendingAt = null">
              @{{ pendingAt.roleName }}
            </el-tag>
          </div>

          <div class="tv-input-tools">
            <div class="tv-at-wrap">
              <button class="tv-tool" type="button" title="@ 角色" @click="atMenuVisible = !atMenuVisible">
                <span class="tv-tool-at">@</span>
              </button>
              <div v-if="atMenuVisible" class="tv-at-menu">
                <div v-if="!members.length" class="tv-at-empty">群里还没有角色，去群设置添加</div>
                <div v-for="mb in members" :key="mb.id" class="tv-at-item" @click="onPickAt(mb)">
                  <CardAvatar :src="mb.roleAvatar" :name="mb.roleName || 'AI'" size="sm" />
                  <span class="tv-at-name">{{ mb.roleName }}</span>
                </div>
              </div>
            </div>
          </div>

          <textarea
            ref="taInputRef"
            v-model="draft"
            class="tv-textarea"
            rows="4"
            placeholder="说点什么…"
            @keydown.enter.exact.prevent="send"
            @keydown.enter.shift.exact="onShiftEnter"
          ></textarea>

          <div class="tv-input-foot">
            <span class="tv-foot-hint">回车发送 · Shift + 回车换行</span>
            <button
              class="tv-send"
              type="button"
              :class="{ ready: draft.trim() }"
              @click="send"
            >发送(S)</button>
          </div>
        </div>
      </template>

      <!-- 未选群 -->
      <div v-else class="tv-chat-placeholder">
        <div class="ph-inner">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"
            stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z" />
          </svg>
          <p>选择一个群，或点左上角 + 创建群聊</p>
        </div>
      </div>
    </section>

    <!-- ============ 建群对话框 ============ -->
    <LDialog
      v-model="createVisible"
      width="420"
      append-to-body
      class="tv-dialog"
    >
      <template #header>
        <span class="tv-dlg-title">创建群聊</span>
      </template>
      <el-input
        v-model="createName"
        placeholder="给群起个名字"
        maxlength="30"
        @keyup.enter="confirmCreate"
      />
      <template #footer>
        <el-button @click="createVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmCreate">立即创建</el-button>
      </template>
    </LDialog>

    <!-- ============ 群设置抽屉（微信侧滑面板） ============ -->
    <el-drawer
      v-model="settingsVisible"
      size="360px"
      :with-header="false"
      class="tv-settings"
    >
      <div v-if="currentGroup" class="tv-set-body">
        <div class="tv-set-head">
          <span class="tv-set-title">群设置</span>
          <button class="tv-set-close" type="button" @click="settingsVisible = false">
            <svg viewBox="0 0 16 16" fill="none">
              <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
            </svg>
          </button>
        </div>

        <div class="tv-set-group">
          <div class="tv-set-label">默认回复成员</div>
          <el-select
            v-model="cfg.defaultMemberId"
            placeholder="无 @ 时默认回复的角色"
            clearable
            style="width: 100%"
            @change="saveConfig"
          >
            <el-option v-for="mb in members" :key="mb.id" :label="mb.roleName" :value="mb.id" />
          </el-select>
          <p class="tv-set-tip">留空则不固定由谁回复</p>
        </div>

        <div class="tv-set-row">
          <div class="tv-set-row-text">
            <div class="tv-set-label">自动路由</div>
            <p class="tv-set-tip">无 @ 且无默认成员时，按角色描述挑一个最合适的</p>
          </div>
          <el-switch v-model="cfg.autoRouteBool" @change="saveConfig" />
        </div>

        <el-divider class="tv-divider">群成员（AI）</el-divider>

        <div v-for="mb in members" :key="mb.id" class="member-card">
          <div class="member-main">
            <CardAvatar :src="mb.roleAvatar" :name="mb.roleName || 'AI'" size="md" />
            <div class="member-info">
              <div class="member-name">{{ mb.roleName }}</div>
              <div class="member-model">
                模型：{{ modelLabel(mb) }}
              </div>
            </div>
            <el-dropdown v-if="admin" trigger="click" placement="bottom-end" @command="(c) => onMemberCmd(c, mb)">
              <el-icon class="member-more"><MoreFilled /></el-icon>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="model">设置模型</el-dropdown-item>
                  <el-dropdown-item command="remove" divided>移出群聊</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>

          <div v-if="admin" class="member-random">
            <div class="random-head">
              <el-switch v-model="mb.randomReplyEnabled" @change="onToggleRandom(mb)" />
              <span class="random-title">主动发言</span>
              <span v-if="mb.randomReplyEnabled" class="random-prob">
                概率 {{ mb.randomProbability }}%
              </span>
            </div>
            <div v-if="mb.randomReplyEnabled" class="random-config">
              <el-slider
                v-model="mb.randomProbability"
                :min="0"
                :max="100"
                :step="5"
                @change="saveMember(mb)"
              />
              <div class="random-ctx">
                <span class="ctx-label">上下文</span>
                <el-input-number
                  v-model="mb.randomContextCount"
                  :min="1"
                  :max="50"

                  controls-position="right"
                  @change="saveMember(mb)"
                />
              </div>
            </div>
          </div>
        </div>

        <el-button
          v-if="admin"
          class="tv-add-member"
          plain
          style="width: 100%; margin-top: 10px"
          @click="addMemberVisible = true"
        >+ 添加角色到群</el-button>
      </div>
    </el-drawer>

    <!-- ============ 添加角色对话框 ============ -->
    <LDialog
      v-model="addMemberVisible"
      width="480"
      append-to-body
      class="tv-dialog"
    >
      <template #header>
        <span class="tv-dlg-title">添加角色到群</span>
      </template>
      <el-input v-model="charFilter" placeholder="搜索角色" class="char-filter" />
      <div class="char-list">
        <div
          v-for="c in filteredCharacters"
          :key="c.id"
          class="char-item"
        >
          <CardAvatar :src="c.avatar" :name="c.name" size="md" />
          <div class="char-info">
            <div class="char-name">{{ c.name }}</div>
            <div class="char-desc">{{ c.description }}</div>
          </div>
          <el-button type="primary" plain @click="confirmAddMember(c)">加入</el-button>
        </div>
        <div v-if="!filteredCharacters.length" class="char-empty">没有可选角色</div>
      </div>
      <template #footer>
        <el-button @click="addMemberVisible = false">关闭</el-button>
      </template>
    </LDialog>

    <!-- ============ 成员模型选择对话框 ============ -->
    <LDialog
      v-model="modelPickerVisible"
      width="480"
      append-to-body
      class="tv-dialog"
    >
      <template #header>
        <span class="tv-dlg-title">设置「{{ modelPickerTarget?.roleName }}」的模型</span>
      </template>
      <el-select
        v-model="modelPickerValue"
        placeholder="选择模型"
        filterable
        style="width: 100%"
      >
        <el-option label="跟随默认" value="" />
        <el-option-group
          v-for="g in groupedModelOptions"
          :key="g.providerId"
          :label="g.providerName"
        >
          <el-option
            v-for="opt in g.options"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </el-option-group>
      </el-select>
      <p class="tv-set-tip" style="margin-top: 10px">选择「跟随默认」将使用系统默认对话模型</p>
      <template #footer>
        <el-button @click="modelPickerVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmModelPicker">保存</el-button>
      </template>
    </LDialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, nextTick, watch, onMounted } from 'vue'
import { ElMessageBox, ElMessage } from 'element-plus'
import { MoreFilled, Plus } from '@element-plus/icons-vue'
import MarkdownContent from '@/components/ui/MarkdownContent.vue'
import CardAvatar from '@/components/ui/CardAvatar.vue'
import LDialog from '@/components/ui/LDialog.vue'
import { isAdmin } from '@repo/core'
import { apiService } from '@/services/ApiService'
import { adminApi } from '@/framework/context'
import type { TaverGroup, TaverMember, TaverMessage } from '@/services/modules/tavern.api'

interface UIMessage {
  _key: number
  speakerType: 'user' | 'ai'
  speakerId?: string
  speakerName?: string
  content: string
  modelName?: string
  streaming?: boolean
}

const groups = ref<TaverGroup[]>([])
const currentGroupId = ref<number | null>(null)
const currentGroup = ref<TaverGroup | null>(null)
const members = ref<TaverMember[]>([])
const messages = ref<UIMessage[]>([])
const draft = ref('')
const admin = ref(isAdmin())
const sending = ref(false)
const pendingAt = ref<TaverMember | null>(null)
const atMenuVisible = ref(false)
const groupKw = ref('')

const createVisible = ref(false)
const createName = ref('')
const settingsVisible = ref(false)
const addMemberVisible = ref(false)
const charFilter = ref('')
const characters = ref<any[]>([])

// 成员模型选择
const modelPickerVisible = ref(false)
const modelPickerTarget = ref<TaverMember | null>(null)
const modelPickerValue = ref('')
const modelOptions = ref<any[]>([])

const msgBoxRef = ref<HTMLElement | null>(null)
const taInputRef = ref<HTMLTextAreaElement | null>(null)
let keySeq = 1
let streamHandle: { close: () => void } | null = null

const cfg = reactive({
  defaultMemberId: null as number | null,
  autoRouteBool: true,
})

const shownGroups = computed(() => {
  const kw = groupKw.value.trim()
  if (!kw) return groups.value
  return groups.value.filter((g) => (g.name || '').includes(kw))
})

const filteredCharacters = computed(() => {
  const kw = charFilter.value.trim()
  const inGroup = new Set(members.value.map((m) => Number(m.roleId)))
  return characters.value
    .filter((c) => !inGroup.has(Number(c.id)))
    .filter((c) => !kw || (c.name || '').includes(kw))
})

// 按供应商分组的模型选项
const groupedModelOptions = computed(() => {
  const map = new Map<string, { providerId: string; providerName: string; options: any[] }>()
  for (const opt of modelOptions.value) {
    if (!map.has(opt.providerId)) {
      map.set(opt.providerId, { providerId: opt.providerId, providerName: opt.providerName, options: [] })
    }
    map.get(opt.providerId)!.options.push(opt)
  }
  return [...map.values()]
})

// 加载可对话模型（过滤掉 embedding / CV / ONNX 视觉等非对话模型）
async function loadModelOptions(force = false) {
  if (modelOptions.value.length && !force) return
  const body = await adminApi.get('/api/providers')
  const providersData = Array.isArray(body) ? body : body?.data || []
  const cvHints = ['embedding', 'embed', 'whisper', 'asr', 'ocr', 'face', 'detect', 'segment',
    'depth', 'caption', 'plate', 'layout', 'yolo', 'rtdetr', 'resnet', 'tts', 'dall', 'flux',
    'cogvideo', 'rerank', 'bge', 'realesrgan', 'inspection', 'zero-shot']
  const out: any[] = []
  providersData.forEach((provider: any) => {
    const list = provider.models || []
    list.filter((m: any) => m.enabled !== false).forEach((m: any) => {
      const tasks = (m.capabilities || []).map((c: any) => c.task)
      const isChat = ['chat', 'text_generation', 'realtime_conversation'].some((t) => tasks.includes(t))
      const lname = String(m.model || '').toLowerCase()
      const looksCv = cvHints.some((h) => lname.includes(h))
      if (isChat || (!looksCv && !/onnx/i.test(provider.provider_id || ''))) {
        out.push({
          value: `${provider.provider_id}:${m.model}`,
          label: m.model,
          providerId: provider.provider_id,
          providerName: provider.name,
        })
      }
    })
  })
  modelOptions.value = out
}

function previewCount(g: TaverGroup) {
  // 当前打开的群直接取已加载成员数；其它群用后端返回的 memberCount
  if (g.id === currentGroupId.value) return members.value.length
  return g.memberCount || 0
}

function avatarOf(m: UIMessage) {
  const f = members.value.find((x) => String(x.roleId) === String(m.speakerId))
  return f?.roleAvatar || null
}

// 成员模型显示：provider_id:model 只展示模型名；空=跟随默认
function modelLabel(mb: TaverMember) {
  const v = mb.modelOverride || mb.roleModel
  if (!v) return '跟随默认'
  const i = String(v).indexOf(':')
  return i >= 0 ? String(v).slice(i + 1) : String(v)
}

function fmtDay(t?: string | null) {
  if (!t) return ''
  const d = new Date(t.replace(/-/g, '/'))
  if (Number.isNaN(d.getTime())) return ''
  const now = new Date()
  const sameYear = d.getFullYear() === now.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return sameYear ? `${mm}/${dd}` : `${d.getFullYear()}/${mm}/${dd}`
}

async function loadGroups() {
  groups.value = await apiService.fetchTavernGroups()
}

async function selectGroup(g: TaverGroup) {
  currentGroupId.value = g.id
  currentGroup.value = g
  pendingAt.value = null
  atMenuVisible.value = false
  await Promise.all([loadMembers(), loadMessages()])
  cfg.defaultMemberId = g.defaultMemberId ?? null
  cfg.autoRouteBool = (g.autoRoute ?? 1) === 1
}

async function loadMembers() {
  if (!currentGroupId.value) return
  members.value = await apiService.fetchTavernMembers(currentGroupId.value)
}

async function loadMessages() {
  if (!currentGroupId.value) return
  const list = await apiService.fetchTavernMessages(currentGroupId.value)
  messages.value = (list as TaverMessage[]).map((m) => ({
    _key: keySeq++,
    speakerType: m.speakerType,
    speakerId: m.speakerId,
    speakerName: m.speakerName,
    content: m.content || '',
    modelName: m.modelName,
    streaming: false,
  }))
  scrollBottom()
}

function scrollBottom() {
  nextTick(() => {
    if (msgBoxRef.value) msgBoxRef.value.scrollTop = msgBoxRef.value.scrollHeight
  })
}

function openCreateGroup() {
  createName.value = ''
  createVisible.value = true
}

async function confirmCreate() {
  const name = createName.value.trim()
  if (!name) return
  const g = await apiService.createTavernGroup(name)
  await loadGroups()
  await selectGroup(g)
  createVisible.value = false
}

async function onGroupCmd(cmd: string, g: TaverGroup) {
  if (cmd === 'rename') {
    try {
      const { value } = await ElMessageBox.prompt('群名称', '重命名', { inputValue: g.name })
      await apiService.updateTavernGroup(g.id, { name: value })
      await loadGroups()
    } catch { /* cancel */ }
  } else if (cmd === 'delete') {
    try {
      await ElMessageBox.confirm(`删除群「${g.name}」？消息会一并删除`, '删除群', { type: 'warning' })
      await apiService.deleteTavernGroup(g.id)
      if (currentGroupId.value === g.id) {
        currentGroupId.value = null
        currentGroup.value = null
        messages.value = []
      }
      await loadGroups()
    } catch { /* cancel */ }
  }
}

async function saveConfig() {
  if (!currentGroupId.value) return
  await apiService.updateTavernGroup(currentGroupId.value, {
    defaultMemberId: cfg.defaultMemberId,
    autoRoute: cfg.autoRouteBool ? 1 : 0,
  })
  ElMessage.success('群设置已保存')
  if (currentGroup.value) {
    currentGroup.value.defaultMemberId = cfg.defaultMemberId
    currentGroup.value.autoRoute = cfg.autoRouteBool ? 1 : 0
  }
}

function onPickAt(mb: TaverMember) {
  pendingAt.value = mb
  atMenuVisible.value = false
  nextTick(() => taInputRef.value?.focus())
}

function onShiftEnter() {
  // 允许默认换行（仅占位，避免 .exact 修饰冲突）
}

async function send() {
  const content = draft.value.trim()
  if (!content || !currentGroupId.value || sending.value) return
  sending.value = true
  messages.value.push({ _key: keySeq++, speakerType: 'user', speakerName: '我', content })
  draft.value = ''
  const atRoleId = pendingAt.value ? Number(pendingAt.value.roleId) : null
  const atName = pendingAt.value?.roleName
  pendingAt.value = null
  scrollBottom()

  let currentAI: UIMessage | null = null
  try {
    streamHandle = apiService.tavernChatStream(
      { groupId: currentGroupId.value, content, atRoleId },
      {
        onEvent: (ev) => {
          const type = ev.type
          if (type === 'create') {
            const created: UIMessage = {
              _key: keySeq++,
              speakerType: 'ai',
              speakerId: ev.speakerId,
              speakerName: ev.speakerName || atName || 'AI',
              content: '',
              modelName: ev.modelName,
              streaming: true,
            }
            messages.value.push(created)
            // 后续流式增量统一作用在数组中的响应式对象上，避免引用不一致导致不刷新
            currentAI = messages.value[messages.value.length - 1]
            scrollBottom()
          } else if (type === 'text' && currentAI) {
            currentAI.content += ev.content || ''
            scrollBottom()
          } else if (type === 'finish' && currentAI) {
            currentAI.streaming = false
            if (ev.error) {
              currentAI.content += `\n[错误] ${ev.error}`
            }
          } else if (type === 'user_message') {
            // 后端回显用户消息，忽略（本地已 push）
          } else if (type === 'turn_end') {
            if (currentAI) currentAI.streaming = false
          }
        },
        onError: (err) => {
          console.error('tavern stream error', err)
          sending.value = false
        },
        onClose: () => {
          sending.value = false
          if (currentAI) currentAI.streaming = false
        },
      },
    )
  } catch (e) {
    console.error(e)
    sending.value = false
    ElMessage.error('发送失败')
  }
}

async function saveMember(mb: TaverMember) {
  await apiService.updateTavernMember(mb.id, {
    randomReplyEnabled: !!mb.randomReplyEnabled,
    randomProbability: mb.randomProbability ?? 0,
    randomContextCount: mb.randomContextCount ?? 20,
  })
}

function onToggleRandom(mb: TaverMember) {
  // 首次开启主动发言且概率为 0 时，给一个默认可用概率
  if (mb.randomReplyEnabled && !(Number(mb.randomProbability) > 0)) {
    mb.randomProbability = 30
  }
  return saveMember(mb)
}

async function openModelPicker(mb: TaverMember) {
  modelPickerTarget.value = mb
  modelPickerValue.value = mb.modelOverride || ''
  modelPickerVisible.value = true
  await loadModelOptions()
}

async function confirmModelPicker() {
  const target = modelPickerTarget.value
  if (!target) return
  const value = modelPickerValue.value || ''
  // 清空时发送空字符串而非 null（请求封装可能剥离 null 字段，导致后端收不到置空指令）
  await apiService.updateTavernMember(target.id, { modelOverride: value })
  modelPickerVisible.value = false
  await loadMembers()
  ElMessage.success('模型已更新')
}

async function onMemberCmd(cmd: string, mb: TaverMember) {
  if (cmd === 'model') {
    await openModelPicker(mb)
  } else if (cmd === 'remove') {
    try {
      await ElMessageBox.confirm(`将「${mb.roleName}」移出群？`, '移出', { type: 'warning' })
      await apiService.removeTavernMember(mb.id)
      await loadMembers()
    } catch { /* cancel */ }
  }
}

async function openCharacters() {
  addMemberVisible.value = true
  if (!characters.value.length) {
    const res = await apiService.fetchCharacters()
    characters.value = res.items || []
  }
}

async function confirmAddMember(c: any) {
  if (!currentGroupId.value) return
  await apiService.addTavernMember(currentGroupId.value, Number(c.id), null)
  await loadMembers()
  ElMessage.success(`已添加 ${c.name}`)
}

watch(addMemberVisible, (v) => { if (v) openCharacters() })

onMounted(loadGroups)
</script>

<style scoped>
/* ============================================================================
   令牌口径（与本应用其余组件统一）：
   1. 颜色已经全部走 --el-*，本轮把 9px/10px/11px 这些魔法圆角统一到 --el-radius-*
      六档（9px 离 8 更近取 md，10/11px 离 12 更近取 lg，均在同行注释标出原值）。
   2. 过渡统一 var(--el-transition-duration-fast, 0.2s)。
   3. 可点的 div/span 补 outline:none + :focus-visible 焦点环；
      原生 <button>（.tv-add / .tv-chat-set / .tv-tool / .tv-set-close）改为补主色光环，
      32px 高的图标按钮上浏览器默认 outline 偏弱。
   ============================================================================ */
.tavern-root {
  display: flex;
  height: 100%;
  width: 100%;
  overflow: hidden;
  background: var(--el-bg-color);
}

/* ================= 左侧群列表 ================= */
.tv-list {
  width: 286px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  background: var(--el-bg-color);
  border-right: 1px solid var(--el-border-color-lighter);
}
.tv-list-head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 12px 10px;
}
.tv-search {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 6px;
  height: 32px;
  padding: 0 10px;
  /* 原值 9px（离 8 更近）→ md 档 */
  border-radius: var(--el-radius-md, 8px);
  background: var(--el-fill-color-light);
}
.tv-search-ico { width: 15px; height: 15px; color: var(--el-text-color-secondary); flex-shrink: 0; }
.tv-search-input {
  flex: 1;
  border: 0;
  outline: 0;
  background: transparent;
  font-size: 13px;
  color: var(--el-text-color-primary);
  min-width: 0;
}
.tv-search-input::placeholder { color: var(--el-text-color-placeholder); }
.tv-add {
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 0;
  /* 原值 9px（离 8 更近）→ md 档 */
  border-radius: var(--el-radius-md, 8px);
  cursor: pointer;
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
  transition:
    background-color var(--el-transition-duration-fast, 0.2s) ease,
    transform var(--el-transition-duration-fast, 0.2s) ease;
}
.tv-add:hover { background: var(--el-color-primary-light-8); }
.tv-add:active { transform: scale(0.94); }

/* 键盘焦点环：32px 图标按钮上默认 outline 偏弱 */
.tv-add:focus-visible {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}

.tv-list-body { flex: 1; overflow-y: auto; padding: 2px 6px 8px; }

/* 群列表项：div + @click，可点不可 Tab 聚焦，焦点环先挂好 */
.tv-conv {
  position: relative;
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 9px 10px;
  /* 原值 12px → lg 档 */
  border-radius: var(--el-radius-lg, 12px);
  cursor: pointer;
  outline: none;
  transition: background-color var(--el-transition-duration-fast, 0.2s) ease;
}
.tv-conv:hover { background: var(--el-fill-color-light); }
.tv-conv.active { background: var(--el-color-primary-light-9); }
.tv-conv:focus-visible {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}
.tv-conv-avatar { flex-shrink: 0; }
.tv-conv-main { flex: 1; min-width: 0; }
.tv-conv-row1 { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.tv-conv-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.tv-conv-time { font-size: 11px; color: var(--el-text-color-placeholder); flex-shrink: 0; }
.tv-conv-row2 { display: flex; align-items: center; justify-content: space-between; gap: 6px; margin-top: 3px; }
.tv-conv-preview {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
}
.tv-conv-more {
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--el-text-color-placeholder);
  /* 原值 6px → sm 档 */
  border-radius: var(--el-radius-sm, 6px);
  opacity: 0;
  outline: none;
  transition:
    opacity var(--el-transition-duration-fast, 0.2s) ease,
    background-color var(--el-transition-duration-fast, 0.2s) ease,
    color var(--el-transition-duration-fast, 0.2s) ease;
}
.tv-conv:hover .tv-conv-more { opacity: 1; }
.tv-conv-more:hover { color: var(--el-text-color-primary); background: var(--el-fill-color); }
/* 焦点可见时不能被 hover 的 opacity:0 藏起来，否则键盘用户找不到「更多操作」 */
.tv-conv-more:focus-visible {
  opacity: 1;
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}
.tv-conv-more :deep(.el-icon) { font-size: 16px; }

.tv-list-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 56px 20px;
  color: var(--el-text-color-placeholder);
  text-align: center;
}
.tv-list-empty svg { width: 40px; height: 40px; }
.tv-list-empty p { font-size: 12.5px; margin: 0; }

/* ================= 右侧聊天区 ================= */
.tv-chat {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  background: var(--el-bg-color);
}
.tv-chat-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  height: 54px;
  flex-shrink: 0;
  border-bottom: 1px solid var(--el-border-color-lighter);
}
.tv-chat-title-wrap { display: flex; align-items: baseline; gap: 4px; min-width: 0; }
.tv-chat-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.tv-chat-count { font-size: 12px; color: var(--el-text-color-secondary); flex-shrink: 0; }
.tv-chat-set {
  width: 32px;
  height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 0;
  /* 原值 9px（离 8 更近）→ md 档 */
  border-radius: var(--el-radius-md, 8px);
  cursor: pointer;
  color: var(--el-text-color-secondary);
  background: transparent;
  transition:
    background-color var(--el-transition-duration-fast, 0.2s) ease,
    color var(--el-transition-duration-fast, 0.2s) ease;
}
.tv-chat-set:hover { background: var(--el-fill-color-light); color: var(--el-text-color-primary); }
.tv-chat-set:focus-visible {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}
.tv-chat-set :deep(.el-icon) { font-size: 19px; }

/* 消息区 */
.tv-msgs {
  flex: 1;
  overflow-y: auto;
  padding: 20px 22px 16px;
  background: var(--el-fill-color);
}
.tv-msg { display: flex; align-items: flex-start; margin-bottom: 18px; }
.tv-msg.is-other { justify-content: flex-start; }
.tv-msg.is-self { justify-content: flex-end; }
.tv-msg-avatar { flex-shrink: 0; }
.tv-msg-col { max-width: 66%; min-width: 0; margin: 0 10px; }
.is-self .tv-msg-col { display: flex; flex-direction: column; align-items: flex-end; }

.tv-msg-meta {
  display: flex;
  align-items: center;
  gap: 7px;
  margin: 0 0 5px 2px;
}
.tv-msg-name { font-size: 12px; color: var(--el-text-color-secondary); }
.tv-msg-model {
  font-size: 10.5px;
  color: var(--el-text-color-placeholder);
  background: var(--el-fill-color-light);
  padding: 1px 7px;
  /* 原值 6px → sm 档 */
  border-radius: var(--el-radius-sm, 6px);
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 气泡 */
.tv-bubble {
  position: relative;
  padding: 9px 13px;
  /* 原值 12px → lg 档 */
  border-radius: var(--el-radius-lg, 12px);
  font-size: 14px;
  line-height: 1.6;
  word-break: break-word;
  overflow-wrap: anywhere;
}
.b-other {
  background: var(--el-bg-color);
  color: var(--el-text-color-primary);
  border: 1px solid var(--el-border-color-lighter);
}
.b-self {
  background: var(--el-color-primary);
  /* 原值 var(--el-color-white, #fff)：--el-color-white 恒有值，兜底是死代码 */
  color: var(--el-color-white);
}
.tv-plain { white-space: pre-wrap; }

/* 气泡小尾巴 */
.b-other::before {
  content: '';
  position: absolute;
  left: -4px;
  top: 13px;
  width: 8px;
  height: 8px;
  background: var(--el-bg-color);
  border-left: 1px solid var(--el-border-color-lighter);
  border-bottom: 1px solid var(--el-border-color-lighter);
  transform: rotate(45deg);
}
.b-self::before {
  content: '';
  position: absolute;
  right: -4px;
  top: 13px;
  width: 8px;
  height: 8px;
  background: var(--el-color-primary);
  transform: rotate(45deg);
}
.b-other :deep(.markdown-text) { margin: 0; }
.b-other :deep(.markdown-text p) { margin: 0 0 6px; }
.b-other :deep(.markdown-text p:last-child) { margin-bottom: 0; }
.b-self :deep(.markdown-text p) { margin: 0 0 6px; }
.b-self :deep(.markdown-text p:last-child) { margin-bottom: 0; }

.tv-msgs-empty { text-align: center; padding: 60px 20px; color: var(--el-text-color-placeholder); }
.tv-msgs-empty p { font-size: 13.5px; margin: 0 0 6px; }
.tv-msgs-empty .sub { font-size: 12px; }

/* 输入区 */
.tv-input {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  padding: 8px 16px 12px;
  background: var(--el-bg-color);
  border-top: 1px solid var(--el-border-color-lighter);
}
.tv-at-chip { margin-bottom: 6px; }
.tv-input-tools { display: flex; align-items: center; gap: 4px; }
.tv-at-wrap { position: relative; }
.tv-tool {
  width: 30px;
  height: 30px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 0;
  /* 原值 8px → md 档 */
  border-radius: var(--el-radius-md, 8px);
  cursor: pointer;
  background: transparent;
  color: var(--el-text-color-secondary);
  transition:
    background-color var(--el-transition-duration-fast, 0.2s) ease,
    color var(--el-transition-duration-fast, 0.2s) ease;
}
.tv-tool:hover { background: var(--el-fill-color-light); color: var(--el-color-primary); }
.tv-tool:focus-visible {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}
.tv-tool-at { font-size: 15px; font-weight: 600; }

.tv-at-menu {
  position: absolute;
  top: 34px;
  left: 0;
  z-index: 40;
  width: 224px;
  max-height: 268px;
  overflow-y: auto;
  padding: 6px;
  /* 原值 12px → lg 档 */
  border-radius: var(--el-radius-lg, 12px);
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  box-shadow: var(--el-box-shadow-light);
}
.tv-at-item {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 6px 8px;
  /* 原值 9px（离 8 更近）→ md 档 */
  border-radius: var(--el-radius-md, 8px);
  cursor: pointer;
  outline: none;
}
.tv-at-item:hover { background: var(--el-fill-color-light); }
.tv-at-item:focus-visible {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}
.tv-at-name { font-size: 13px; color: var(--el-text-color-primary); }
.tv-at-empty { font-size: 12px; color: var(--el-text-color-secondary); padding: 10px 8px; }

.tv-textarea {
  width: 100%;
  resize: none;
  border: 0;
  outline: 0;
  padding: 8px 2px;
  font-family: inherit;
  font-size: 14px;
  line-height: 1.6;
  color: var(--el-text-color-primary);
  background: transparent;
}
.tv-textarea::placeholder { color: var(--el-text-color-placeholder); }

.tv-input-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.tv-foot-hint { font-size: 11.5px; color: var(--el-text-color-placeholder); }
.tv-send {
  min-width: 78px;
  height: 32px;
  padding: 0 16px;
  border: 1px solid var(--el-border-color);
  /* 原值 9px（离 8 更近）→ md 档 */
  border-radius: var(--el-radius-md, 8px);
  cursor: pointer;
  font-size: 13px;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color-light);
  transition: all var(--el-transition-duration-fast, 0.2s) ease;
}
.tv-send.ready {
  /* 原值 var(--el-color-white, #fff)：--el-color-white 恒有值，兜底是死代码 */
  color: var(--el-color-white);
  background: var(--el-color-primary);
  border-color: var(--el-color-primary);
}
.tv-send.ready:hover { filter: brightness(1.05); }

/* 未选群占位 */
.tv-chat-placeholder {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--el-fill-color);
}
.ph-inner { display: flex; flex-direction: column; align-items: center; gap: 14px; color: var(--el-text-color-placeholder); }
.ph-inner svg { width: 52px; height: 52px; }
.ph-inner p { font-size: 13.5px; margin: 0; }

/* ================= 对话框 ================= */
.tv-dlg-title { font-size: 15px; font-weight: 600; color: var(--el-text-color-primary); }
.char-filter { margin-bottom: 10px; }
.char-list { max-height: 380px; overflow-y: auto; }
.char-item { display: flex; align-items: center; gap: 10px; padding: 8px 6px;
  /* 原值 10px（距 8/12 等距，本仓统一取 lg 档） */
  border-radius: var(--el-radius-lg, 12px); }
.char-item:hover { background: var(--el-fill-color-light); }
.char-info { flex: 1; min-width: 0; }
.char-name { font-size: 13.5px; font-weight: 600; color: var(--el-text-color-primary); }
.char-desc {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.char-empty { text-align: center; font-size: 12.5px; color: var(--el-text-color-secondary); padding: 28px; }

/* ================= 设置抽屉 ================= */
.tv-set-body { padding: 4px 18px 20px; }
.tv-set-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 0 14px;
}
.tv-set-title { font-size: 16px; font-weight: 700; color: var(--el-text-color-primary); }
.tv-set-close {
  width: 28px; height: 28px; border: 0; cursor: pointer;
  /* 原值 8px → md 档 */
  border-radius: var(--el-radius-md, 8px); background: transparent; color: var(--el-text-color-secondary);
  display: inline-flex; align-items: center; justify-content: center;
}
.tv-set-close:hover { background: var(--el-fill-color-light); color: var(--el-text-color-primary); }
.tv-set-close:focus-visible {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}
.tv-set-group { margin-bottom: 16px; }
.tv-set-label { font-size: 13.5px; font-weight: 600; color: var(--el-text-color-primary); }
.tv-set-tip { font-size: 11.5px; color: var(--el-text-color-secondary); margin: 6px 0 0; }
.tv-set-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 4px 0 12px;
}
.tv-set-row-text { min-width: 0; }
.tv-divider :deep(.el-divider__text) {
  white-space: nowrap;
  font-size: 12.5px;
  color: var(--el-text-color-secondary);
  background: var(--el-bg-color);
}

.member-card {
  padding: 11px;
  margin-bottom: 10px;
  /* 原值 12px → lg 档 */
  border-radius: var(--el-radius-lg, 12px);
  background: var(--el-fill-color-light);
}
.member-main { display: flex; align-items: center; gap: 10px; }
.member-info { flex: 1; min-width: 0; }
.member-name {
  font-size: 13.5px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.member-model { font-size: 11.5px; color: var(--el-text-color-secondary); margin-top: 2px; }
.member-more { color: var(--el-text-color-placeholder); cursor: pointer; font-size: 17px; }
.member-more:hover { color: var(--el-text-color-primary); }

.member-random { margin-top: 10px; padding-top: 10px; border-top: 1px solid var(--el-border-color-lighter); }
.random-head { display: flex; align-items: center; gap: 8px; }
.random-title { font-size: 12.5px; font-weight: 600; color: var(--el-text-color-primary); }
.random-prob { font-size: 11.5px; color: var(--el-text-color-secondary); margin-left: auto; }
.random-config { display: flex; align-items: center; gap: 12px; margin-top: 4px; padding: 0 4px; }
.random-config :deep(.el-slider) { flex: 1; margin: 0; }
.random-ctx { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }
.ctx-label { font-size: 11.5px; color: var(--el-text-color-secondary); }
.random-ctx :deep(.el-input-number) { width: 96px; }
/* 原值 11px（离 12 更近）→ lg 档 */
.tv-add-member { border-radius: var(--el-radius-lg, 12px); }

/* 尊重系统「减少动态效果」偏好。
   群列表选中态靠底色、@ 菜单选中态靠 hover 底色，关掉过渡后依然可辨。 */
@media (prefers-reduced-motion: reduce) {
  .tv-add,
  .tv-conv,
  .tv-conv-more,
  .tv-chat-set,
  .tv-tool,
  .tv-at-item,
  .tv-send {
    transition: none;
  }
}
</style>
