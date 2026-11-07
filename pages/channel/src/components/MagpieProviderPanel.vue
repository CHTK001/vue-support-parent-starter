<template>
  <div class="mg-up">
    <div class="mg-up__head">
      <span class="mg-up__title">
        网关上游
        <i>{{ providers.length }}</i>
      </span>
      <span class="mg-up__ops">
        <select
          v-if="connections.length > 1"
          v-model="connectionId"
          class="mg-up__select"
          title="选择要管理的 Magpie 网关"
          @change="load()"
        >
          <option v-for="c in connections" :key="c.connectionId" :value="c.connectionId">
            {{ c.label || c.connectionId }}
          </option>
        </select>
        <button type="button" class="mg-up__btn" :disabled="loading" @click="load()">
          {{ loading ? '读取中…' : '刷新' }}
        </button>
        <button type="button" class="mg-up__btn is-primary" @click="openEditor(null)">
          ＋ 新增上游
        </button>
      </span>
    </div>

    <p v-if="baseUrl" class="mg-up__hint">网关 {{ baseUrl }}</p>
    <p v-if="error" class="mg-up__error">{{ error }}</p>

    <div v-if="!connections.length" class="mg-up__empty">
      先在「账号」页绑定 Magpie 网关（地址 + 网关 key），再回到这里管理上游。
    </div>
    <div v-else class="mg-up__tablewrap">
      <table class="mg-up__table">
        <thead>
          <tr>
            <th>名称</th>
            <th>ID</th>
            <th>协议</th>
            <th>凭据</th>
            <th>模型</th>
            <th class="is-actions">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in providers" :key="String(p.id)">
            <td class="is-name" :title="String(p.name ?? '')">{{ p.name || p.id }}</td>
            <td class="is-id" :title="String(p.id ?? '')">{{ p.id }}</td>
            <td>{{ protocolText(p) }}</td>
            <td>
              <span class="mg-up__tag" :class="{ 'is-off': !p.hasKey }">
                {{ p.hasKey ? p.key : '无' }}
              </span>
            </td>
            <td>{{ (p.models ?? []).length }}</td>
            <td class="is-actions">
              <button type="button" class="mg-up__link" @click="openEditor(p)">编辑</button>
              <button
                type="button"
                class="mg-up__link"
                :disabled="busyId === p.id"
                @click="pullModels(p)"
              >拉模型</button>
              <button
                type="button"
                class="mg-up__link"
                :disabled="busyId === p.id"
                @click="testProvider(p)"
              >测试</button>
              <button type="button" class="mg-up__link is-danger" @click="remove(p)">删除</button>
            </td>
          </tr>
          <tr v-if="!providers.length && !loading">
            <td colspan="6" class="mg-up__empty-cell">网关里还没有上游 provider，点「新增上游」添加</td>
          </tr>
        </tbody>
      </table>
    </div>

    <ReDialog
      v-model="dialogVisible"
      :title="editing ? '编辑上游 provider' : '新增上游 provider'"
      width="640px"
      append-to-body
      destroy-on-close
      :close-on-click-modal="false"
    >
      <el-form label-width="110px" class="mg-up__form">
        <div class="mg-up__grid">
          <el-form-item label="ID" required>
            <el-input v-model="form.id" placeholder="如 codex / claude" maxlength="64" :disabled="editing" />
          </el-form-item>
          <el-form-item label="显示名">
            <el-input v-model="form.name" placeholder="如 Codex 订阅" maxlength="128" />
          </el-form-item>
        </div>
        <el-form-item label="预设">
          <el-input v-model="form.preset" placeholder="可选：magpie 内置 preset 标识" maxlength="64" />
        </el-form-item>
        <el-form-item label="API Key">
          <el-input
            v-model="form.key"
            type="password"
            show-password
            spellcheck="false"
            :placeholder="editing ? '留空表示保留原 key' : '上游自己的 API key'"
          />
          <span class="mg-up__formhint">只写不改：读接口只回脱敏值，留空即保留原 key。</span>
        </el-form-item>
        <div class="mg-up__grid">
          <el-form-item label="Chat 地址">
            <el-input v-model="form.chat" placeholder="https://…/v1" maxlength="512" />
          </el-form-item>
          <el-form-item label="Responses">
            <el-input v-model="form.responses" placeholder="可留空" maxlength="512" />
          </el-form-item>
          <el-form-item label="Anthropic">
            <el-input v-model="form.anthropic" placeholder="可留空" maxlength="512" />
          </el-form-item>
          <el-form-item label="Gemini">
            <el-input v-model="form.gemini" placeholder="可留空" maxlength="512" />
          </el-form-item>
        </div>
        <el-form-item label="模型">
          <el-input
            v-model="form.modelsText"
            type="textarea"
            :rows="4"
            placeholder="一行一个模型 id，也可用逗号分隔；留空表示使用上游 / 预设的目录"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <ReButton @click="dialogVisible = false">取消</ReButton>
        <ReButton type="primary" :loading="saving" @click="submit()">保存</ReButton>
      </template>
    </ReDialog>
  </div>
</template>

<script setup lang="ts">
/**
 * Magpie 网关「上游 provider」管理面板。
 *
 * <p>Magpie 是常驻网关：上游（Codex / Claude / Gemini / 自定义 OpenAI 兼容服务）
 * 在 magpie 自己那里维护。本面板通过 magpie 的管理面
 * （{@code /api/providers}、{@code /api/provider/save|delete|models|test}）
 * 做增删改查，改完立即失效路由缓存，新的模型马上可以被免费渠道路由到。</p>
 *
 * <p>凭据口径：列表只回脱敏 key；编辑留空表示保留原值（magpie 的 save 语义）。</p>
 */
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import ReButton from '@repo/ui/re-button'
import ReDialog from '@repo/ui/re-dialog'
import { channelApi, type ChannelConnectionSummary, type MagpieProvider } from '../channelApi'

const props = defineProps<{
  /** 渠道标识（固定 magpie） */
  channel: string
  /** 该渠道下已绑定的网关连接 */
  connections: ChannelConnectionSummary[]
}>()

const emit = defineEmits<{
  (e: 'changed'): void
}>()

/** 当前管理的网关连接（多网关时可切换） */
const connectionId = ref('')
const loading = ref(false)
const error = ref('')
const baseUrl = ref('')
const providers = ref<MagpieProvider[]>([])
const busyId = ref('')

const dialogVisible = ref(false)
const editing = ref(false)
const saving = ref(false)
const originalId = ref('')

const form = reactive({
  id: '',
  name: '',
  preset: '',
  key: '',
  chat: '',
  responses: '',
  anthropic: '',
  gemini: '',
  modelsText: '',
})

const selectedConnection = computed(
  () => props.connections.find((c) => c.connectionId === connectionId.value) ?? props.connections[0],
)

/** 同步默认连接：优先主账号，其次第一条 */
watch(
  () => props.connections,
  (list) => {
    if (!list.length) {
      connectionId.value = ''
      return
    }
    if (list.some((c) => c.connectionId === connectionId.value)) return
    connectionId.value = (list.find((c) => c.primary) ?? list[0])!.connectionId ?? ''
  },
  { immediate: true, deep: true },
)

onMounted(() => {
  if (props.connections.length && connectionId.value) void load()
})

// 切换网关（多连接）时重新读取；props 同步发生在挂载前也算一次
watch(connectionId, (id, prev) => {
  if (id && id !== prev) void load()
})

/** 读取上游清单 */
async function load(): Promise<void> {
  if (!connectionId.value) {
    providers.value = []
    return
  }
  loading.value = true
  error.value = ''
  try {
    const res = await channelApi.magpieProviders(props.channel, { connectionId: connectionId.value })
    const out = (res as any)?.data ?? res
    baseUrl.value = String(out?.baseUrl ?? '')
    providers.value = (out?.providers ?? []) as MagpieProvider[]
    if (out?.ok === false) {
      error.value = String(out?.message ?? 'Magpie 管理接口不可用')
    }
  } catch (e: any) {
    error.value = e?.message ?? String(e)
    providers.value = []
  } finally {
    loading.value = false
  }
}

/** 打开新增 / 编辑弹窗 */
function openEditor(provider: MagpieProvider | null): void {
  editing.value = !!provider
  originalId.value = provider ? String(provider.id ?? '') : ''
  form.id = originalId.value
  form.name = String(provider?.name ?? '')
  form.preset = String(provider?.preset ?? '')
  form.key = ''
  form.chat = String(provider?.chat ?? '')
  form.responses = String(provider?.responses ?? '')
  form.anthropic = String(provider?.anthropic ?? '')
  form.gemini = String(provider?.gemini ?? '')
  form.modelsText = (provider?.models ?? []).join('\n')
  dialogVisible.value = true
}

/** 保存（新增 / 覆盖 / 改名） */
async function submit(): Promise<void> {
  const id = form.id.trim()
  if (!id) {
    ElMessage.warning('请填写 provider ID')
    return
  }
  const provider: Record<string, unknown> = { id }
  const name = form.name.trim()
  if (name) provider.name = name
  if (form.preset.trim()) provider.preset = form.preset.trim()
  // 空 key 不发送：magpie 的 save 以「缺 key」表示保留原值
  if (form.key.trim()) provider.key = form.key.trim()
  for (const key of ['chat', 'responses', 'anthropic', 'gemini'] as const) {
    const value = form[key].trim()
    if (value) provider[key] = value
  }
  const models = form.modelsText
    .split(/[\n,，\s]+/)
    .map((item) => item.trim())
    .filter(Boolean)
  provider.models = models

  saving.value = true
  try {
    await channelApi.saveMagpieProvider(props.channel, {
      connectionId: connectionId.value,
      provider,
      isNew: !editing.value,
      from: editing.value && originalId.value && originalId.value !== id ? originalId.value : undefined,
    })
    ElMessage.success(editing.value ? '上游已更新' : '上游已新增')
    dialogVisible.value = false
    await load()
    emit('changed')
  } catch (e: any) {
    ElMessage.error('保存失败：' + (e?.message ?? e))
  } finally {
    saving.value = false
  }
}

/** 删除 */
async function remove(provider: MagpieProvider): Promise<void> {
  const id = String(provider.id ?? '')
  if (!id) return
  try {
    await ElMessageBox.confirm(`删除上游 provider「${provider.name || id}」？网关内该上游的模型会立即不可用。`, '确认删除', {
      type: 'warning',
    })
  } catch {
    return
  }
  try {
    await channelApi.deleteMagpieProvider(props.channel, { connectionId: connectionId.value, id })
    ElMessage.success('已删除')
    await load()
    emit('changed')
  } catch (e: any) {
    ElMessage.error('删除失败：' + (e?.message ?? e))
  }
}

/** 拉模型：把网关返回的模型 id 填回表单，避免手抄 */
async function pullModels(provider: MagpieProvider): Promise<void> {
  const id = String(provider.id ?? '')
  if (!id) return
  busyId.value = id
  try {
    const res = await channelApi.magpieProviderAction(props.channel, 'models', {
      connectionId: connectionId.value,
      provider,
    })
    const out = (res as any)?.data ?? res
    const ids = extractModelIds(out?.result ?? out)
    if (!ids.length) {
      ElMessage.info('网关未返回模型清单')
      return
    }
    openEditor(provider)
    form.modelsText = ids.join('\n')
    ElMessage.success(`已带出 ${ids.length} 个模型，确认后保存`)
  } catch (e: any) {
    ElMessage.error('拉取模型失败：' + (e?.message ?? e))
  } finally {
    busyId.value = ''
  }
}

/** 连通性测试 */
async function testProvider(provider: MagpieProvider): Promise<void> {
  busyId.value = String(provider.id ?? '')
  try {
    const res = await channelApi.magpieProviderAction(props.channel, 'test', {
      connectionId: connectionId.value,
      provider,
    })
    const out = (res as any)?.data ?? res
    ElMessage.success('测试已发起：' + brief(out?.result ?? out))
  } catch (e: any) {
    ElMessage.error('测试失败：' + (e?.message ?? e))
  } finally {
    busyId.value = ''
  }
}

/** 协议摘要 */
function protocolText(provider: MagpieProvider): string {
  const list: string[] = []
  if (provider.chat) list.push('chat')
  if (provider.responses) list.push('responses')
  if (provider.anthropic) list.push('anthropic')
  if (provider.gemini) list.push('gemini')
  return list.length ? list.join(' / ') : '—'
}

/** 从上游响应里挖出模型 id */
function extractModelIds(result: any): string[] {
  const raw = result?.models ?? result?.data ?? result?.ids
  if (!Array.isArray(raw)) return []
  const ids: string[] = []
  for (const item of raw) {
    if (typeof item === 'string' && item.trim()) ids.push(item.trim())
    else if (item && typeof item === 'object' && item.id) ids.push(String(item.id))
  }
  return Array.from(new Set(ids))
}

/** 响应摘要（最多 120 字） */
function brief(value: unknown): string {
  try {
    const text = typeof value === 'string' ? value : JSON.stringify(value)
    return text.length > 120 ? text.slice(0, 120) + '…' : text
  } catch {
    return '已返回'
  }
}
</script>

<style scoped>
.mg-up {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.mg-up__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}
.mg-up__title {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary, #303133);
}
.mg-up__title i {
  margin-left: 4px;
  font-style: normal;
  font-weight: 400;
  color: var(--el-text-color-secondary, #909399);
}
.mg-up__ops {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.mg-up__select {
  height: 28px;
  padding: 0 8px;
  border-radius: 6px;
  border: 1px solid var(--el-border-color, #dcdfe6);
  background: var(--el-fill-color-blank, #fff);
  color: var(--el-text-color-regular, #606266);
  font-size: 12px;
}
.mg-up__btn {
  padding: 5px 12px;
  border-radius: 6px;
  border: 1px solid var(--el-border-color, #dcdfe6);
  background: var(--el-fill-color-blank, #fff);
  color: var(--el-text-color-regular, #606266);
  font-size: 12.5px;
  cursor: pointer;
}
.mg-up__btn:hover {
  border-color: var(--el-color-primary-light-5, #a0cfff);
  color: var(--el-color-primary, #409eff);
}
.mg-up__btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
.mg-up__btn.is-primary {
  border-color: var(--el-color-primary, #409eff);
  background: var(--el-color-primary, #409eff);
  color: #fff;
}
.mg-up__hint {
  margin: 0;
  font-size: 12px;
  color: var(--el-text-color-secondary, #909399);
}
.mg-up__error {
  margin: 0;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 12.5px;
  color: var(--el-color-danger, #f56c6c);
  background: var(--el-color-danger-light-9, #fef0f0);
}
.mg-up__tablewrap {
  overflow-x: auto;
  border: 1px solid var(--el-border-color-lighter, #ebeef5);
  border-radius: 8px;
}
.mg-up__table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12.5px;
}
.mg-up__table th,
.mg-up__table td {
  padding: 8px 10px;
  text-align: left;
  border-bottom: 1px solid var(--el-border-color-lighter, #ebeef5);
  white-space: nowrap;
}
.mg-up__table th {
  font-weight: 600;
  color: var(--el-text-color-secondary, #909399);
  background: var(--el-fill-color-light, #f5f7fa);
}
.mg-up__table tbody tr:last-child td {
  border-bottom: none;
}
.mg-up__table td.is-name {
  max-width: 160px;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--el-text-color-primary, #303133);
}
.mg-up__table td.is-id {
  max-width: 140px;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--el-text-color-secondary, #909399);
}
.mg-up__table td.is-actions,
.mg-up__table th.is-actions {
  text-align: right;
}
.mg-up__tag {
  padding: 1px 6px;
  border-radius: 4px;
  font-size: 11.5px;
  color: var(--el-color-success, #67c23a);
  background: var(--el-color-success-light-9, #f0f9eb);
}
.mg-up__tag.is-off {
  color: var(--el-text-color-secondary, #909399);
  background: var(--el-fill-color-light, #f5f7fa);
}
.mg-up__link {
  padding: 0 6px;
  border: none;
  background: none;
  color: var(--el-color-primary, #409eff);
  font-size: 12.5px;
  cursor: pointer;
}
.mg-up__link:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.mg-up__link.is-danger {
  color: var(--el-color-danger, #f56c6c);
}
.mg-up__empty,
.mg-up__empty-cell {
  padding: 18px 0;
  text-align: center;
  font-size: 12.5px;
  color: var(--el-text-color-secondary, #909399);
}
.mg-up__form {
  padding-top: 4px;
}
.mg-up__grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0 12px;
}
.mg-up__formhint {
  display: block;
  margin-top: 3px;
  font-size: 11px;
  line-height: 1.5;
  color: var(--el-text-color-secondary, #909399);
}
@media (max-width: 640px) {
  .mg-up__grid {
    grid-template-columns: 1fr;
  }
}
</style>
