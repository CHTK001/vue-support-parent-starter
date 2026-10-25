<template>
  <div class="stp">
    <div class="stp__head">
      <div class="stp__title">
        <span class="stp__name">访问令牌</span>
        <span class="stp__sub">{{ instanceName || '当前实例' }} · 管理 GPT / CC / Gemini 兼容接口调用凭证</span>
      </div>
      <el-button type="primary" @click="openCreate">
        <el-icon class="stp__btn-icon"><AddIcon /></el-icon>签发令牌
      </el-button>
    </div>

    <div class="stp__body">
      <ReTable
        :data="tokens"
        :columns="tokenColumns"
        :loading="loading"
        :layout-table="{ minHeight: 0 }"
        :settings="{ border: false }"
        stripe
        class="stp-table"
        :config="{ pagination: { enable: false }, toolbar: { enable: false } }"
      >
        <template #col-token="{ row }">
          <div class="stp-token">
            <span class="stp-token__text">{{ row.token }}</span>
            <el-button text class="stp-token__copy" @click="copy(row.token)">
              <el-icon><CopyIcon /></el-icon>
            </el-button>
          </div>
        </template>
        <template #col-type="{ row }">
          <el-tag :type="tokenTagType(row.type)">
            {{ row.type === 'temporary' ? '临时' : '永久' }}
          </el-tag>
        </template>
        <template #col-expiresAt="{ row }">
          <span v-if="row.expiresAt" :class="{ 'stp-expired': isExpired(row) }">{{ row.expiresAt }}</span>
          <span v-else class="stp-muted">不过期</span>
        </template>
        <template #col-usedRequests="{ row }">
          <span>{{ row.usedRequests ?? 0 }} / {{ row.maxRequests ?? '不限' }}</span>
        </template>
        <template #col-usedTokens="{ row }">
          <span>{{ formatNumber(row.usedTokens) }} / {{ row.maxTokens ? formatNumber(row.maxTokens) : '不限' }}</span>
        </template>
        <template #col-enabled="{ row }">
          <el-tag :type="row.enabled ? 'success' : 'danger'">
            {{ row.enabled ? '启用' : '禁用' }}
          </el-tag>
        </template>
        <!-- 操作列统一 ReButton square（纯图标 + tooltip） -->
        <template #col-actions="{ row }">
          <div class="row-actions">
            <ReButton v-if="row.enabled" layout="square" type="warning" :icon="Lock" tip="禁用" @click="toggle(row)" />
            <ReButton v-else layout="square" type="success" :icon="Unlock" tip="启用" @click="toggle(row)" />
            <ReButton layout="square" type="danger" :icon="Delete" tip="删除" @click="remove(row)" />
          </div>
        </template>
      </ReTable>
    </div>

    <ReDialog v-model="showCreate" title="签发访问令牌" width="520px" append-to-body>
      <el-form :model="form" label-width="110px">
        <el-form-item label="令牌名称">
          <el-input v-model="form.name" placeholder="如：前端调用令牌" />
        </el-form-item>
        <el-form-item label="令牌类型">
          <el-radio-group v-model="form.type">
            <el-radio value="permanent">永久</el-radio>
            <el-radio value="temporary">临时</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="过期时间" v-if="form.type === 'temporary'">
          <el-date-picker
            v-model="form.expiresAt"
            type="datetime"
            value-format="YYYY-MM-DDTHH:mm:ss"
            placeholder="选择过期时间"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="最大请求次数">
          <ReNumberInput v-model="form.maxRequests" :min="0" :step="100" />
          <span class="stp-hint">0 表示不限</span>
        </el-form-item>
        <el-form-item label="最大 Token 数">
          <ReNumberInput v-model="form.maxTokens" :min="0" :step="10000" />
          <span class="stp-hint">0 表示不限</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreate = false">取消</el-button>
        <el-button type="primary" @click="submit">签发</el-button>
      </template>
    </ReDialog>
  </div>
</template>

<script setup lang="ts">
import { message } from '@repo/core'
import { ref, watch, onMounted } from 'vue'
import { ElMessageBox } from 'element-plus'
import { createClient, v2Http } from '@/framework/context'
import { Add24Regular, Copy24Regular } from '@vicons/fluent'
import { Delete, Lock, Unlock } from '@element-plus/icons-vue'
import ReButton from '@repo/ui/re-button'
import ReTable from '@repo/ui/re-table'
import type { ReTableColumn } from '@repo/ui/re-table'
import ReDialog from '@repo/ui/re-dialog'
import ReNumberInput from '@/components/re/ReNumberInput.vue'

const props = defineProps<{
  /** 当前选中的服务实例 ID；为空时不加载（无实例/未选中） */
  instanceId: string | number | null | undefined
}>()

const http = createClient(v2Http, { unwrap: false })

const AddIcon = Add24Regular
const CopyIcon = Copy24Regular

const tokenColumns: ReTableColumn[] = [
  { prop: 'token', label: '令牌', minWidth: 220, slot: 'token' },
  { prop: 'name', label: '名称', width: 130 },
  { prop: 'type', label: '类型', width: 84, slot: 'type' },
  { prop: 'expiresAt', label: '过期时间', width: 160, slot: 'expiresAt' },
  { prop: 'usedRequests', label: '请求次数', width: 122, slot: 'usedRequests' },
  { prop: 'usedTokens', label: 'Token 额度', width: 142, slot: 'usedTokens' },
  { prop: 'enabled', label: '状态', width: 84, slot: 'enabled' },
  { prop: 'actions', label: '操作', width: 142, slot: 'actions' },
]

const tokenTagType = (t: string): 'primary' | 'success' | 'info' | 'warning' | 'danger' =>
  t === 'temporary' ? 'warning' : 'info'

const loading = ref(false)
const tokens = ref<any[]>([])
const instanceName = ref('')
const showCreate = ref(false)
const form = ref({
  name: '',
  type: 'permanent',
  expiresAt: '',
  maxRequests: 0,
  maxTokens: 0,
})

function asList(payload: any, key: string): any[] {
  if (Array.isArray(payload)) return payload
  if (payload && Array.isArray(payload[key])) return payload[key]
  if (payload && Array.isArray(payload.records)) return payload.records
  return []
}

function mapToken(r: any) {
  return {
    id: r.tokenId ?? r.id,
    token: r.token,
    name: r.tokenName ?? r.name,
    type: r.tokenType ?? 'permanent',
    expiresAt: r.expiresAt,
    maxRequests: r.maxRequests,
    usedRequests: r.usedRequests,
    maxTokens: r.maxTokens,
    usedTokens: r.usedTokens,
    enabled: r.enabled === 1 || r.enabled === true,
  }
}

function formatNumber(v: any) {
  if (v == null) return '0'
  return Number(v).toLocaleString()
}

function isExpired(row: any) {
  return row.expiresAt && new Date(row.expiresAt).getTime() < Date.now()
}

async function loadTokens() {
  if (props.instanceId == null || props.instanceId === '') {
    tokens.value = []
    instanceName.value = ''
    return
  }
  const instanceId = String(props.instanceId)
  loading.value = true
  try {
    const res = await http.get('/service/tokens', { params: { instanceId } })
    tokens.value = asList(res.data, 'tokens').map(mapToken)
  } catch (e: any) {
    message.error('加载令牌失败: ' + (e?.message || e))
  } finally {
    loading.value = false
  }
}

async function loadInstanceName() {
  if (props.instanceId == null || props.instanceId === '') {
    instanceName.value = ''
    return
  }
  const instanceId = String(props.instanceId)
  try {
    const res = await http.get('/service/instances')
    const list = asList(res.data, 'instances')
    const inst = list.find((x: any) => (x.instanceId ?? x.id) === instanceId)
    if (inst) instanceName.value = inst.instanceName ?? inst.name ?? ''
  } catch {
    // ignore
  }
}

function openCreate() {
  form.value = { name: '', type: 'permanent', expiresAt: '', maxRequests: 0, maxTokens: 0 }
  showCreate.value = true
}

async function submit() {
  if (!form.value.name.trim()) {
    message.warning('请填写令牌名称')
    return
  }
  if (form.value.type === 'temporary' && !form.value.expiresAt) {
    message.warning('请选择过期时间')
    return
  }
  if (props.instanceId == null || props.instanceId === '') {
    message.warning('请先选择服务实例')
    return
  }
  try {
    await http.post('/service/tokens', {
      instanceId: String(props.instanceId),
      name: form.value.name.trim(),
      type: form.value.type,
      expiresAt: form.value.type === 'temporary' ? form.value.expiresAt : null,
      maxRequests: form.value.maxRequests || null,
      maxTokens: form.value.maxTokens || null,
    })
    message.success('令牌已签发')
    showCreate.value = false
    loadTokens()
  } catch (e: any) {
    message.error('签发失败: ' + (e?.message || e))
  }
}

async function toggle(row: any) {
  try {
    if (row.enabled) {
      await ElMessageBox.confirm('确定锁定（禁用）该访问令牌？锁定后使用该令牌的请求将被拒绝。', '锁定令牌', {
        type: 'warning',
        confirmButtonText: '锁定',
        cancelButtonText: '取消',
      })
    }
    await http.post(`/service/tokens/${row.id}/toggle`)
    message.success(row.enabled ? '已禁用' : '已启用')
    loadTokens()
  } catch (e: any) {
    if (e === 'cancel' || e?.message === 'cancel') return
    message.error('操作失败: ' + (e?.message || e))
  }
}

async function remove(row: any) {
  try {
    await ElMessageBox.confirm(`确定删除令牌「${row.name}」？`, '删除令牌', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消',
    })
    await http.delete(`/service/tokens/${row.id}`)
    message.success('已删除')
    loadTokens()
  } catch (e: any) {
    if (e === 'cancel' || e?.message === 'cancel') return
    message.error('删除失败: ' + (e?.message || e))
  }
}

async function copy(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    message.success('已复制')
  } catch {
    message.warning('复制失败，请手动选择复制')
  }
}

watch(() => props.instanceId, () => {
  loadTokens()
  loadInstanceName()
})

onMounted(() => {
  loadTokens()
  loadInstanceName()
})
</script>

<style scoped>
.stp {
  display: flex; flex-direction: column; gap: 12px;
  min-width: 0; min-height: 0; height: 100%;
}
.stp__head {
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
  flex-wrap: wrap;
}
.stp__title { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.stp__name { font-size: 14px; font-weight: 700; color: var(--el-text-color-primary); }
.stp__sub { font-size: 12px; color: var(--el-text-color-secondary); }
.stp__btn-icon { margin-right: 4px; }
.stp__body {
  min-height: 0; flex: 1 1 auto;
  border: 1px solid var(--svc-rule, var(--el-border-color-lighter));
  border-radius: 10px; overflow: hidden;
}
.stp-table { --el-table-border-color: var(--el-border-color-lighter); }
.stp-table :deep(th.el-table__cell) {
  background: var(--el-fill-color-light);
  color: var(--el-text-color-regular);
  font-weight: 600;
}
.stp-token { display: flex; align-items: center; gap: 4px; min-width: 0; }
.stp-token__text {
  font-family: var(--el-font-family-monospace, monospace);
  font-size: 12px; color: var(--el-text-color-regular);
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.stp-token__copy { flex-shrink: 0; }
.stp-muted { color: var(--el-text-color-secondary); }
.stp-expired { color: var(--el-color-danger); }
.stp-hint { margin-left: 8px; font-size: 12px; color: var(--el-text-color-secondary); }
</style>