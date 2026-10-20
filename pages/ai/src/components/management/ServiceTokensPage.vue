<template>
  <div class="service-tokens-page">
    <div class="page-header">
      <div class="title-wrap">
        <el-button text @click="goBack" class="back-btn">
          <el-icon><ArrowLeft24Regular /></el-icon>
        </el-button>
        <h2>访问令牌 · {{ instanceName }}</h2>
      </div>
      <el-button type="primary" @click="openCreate">
        <el-icon class="mr-1"><Add24Regular /></el-icon>签发令牌
      </el-button>
    </div>

    <div class="panel-card">
    <!-- 表格统一 ReTable（替换裸 el-table）：engine="element" 沿用原 el-table 的 DOM；
         pagination=false —— 页面没有外置分页，保持全量直出；toolbar=false 不新增工具栏；
         原表没有 border → :settings="{ border: false }" 显式抑制 ReTable 的默认边框；
         v-loading → :loading。 -->
    <ReTable
      :data="tokens"
      :columns="tokenColumns"
      :loading="loading"
      engine="element"
      :pagination="false"
      :toolbar="false"
      :layout-table="{ minHeight: 0 }"
      :settings="{ border: false }"
      stripe
      class="flat-table"
    >
      <template #col-token="{ row }">
        <div class="token-cell">
          <span class="token-text">{{ row.token }}</span>
          <el-button text class="copy-btn" @click="copy(row.token)">
            <el-icon><Copy24Regular /></el-icon>
          </el-button>
        </div>
      </template>
      <template #col-type="{ row }">
        <el-tag :type="tokenTagType(row.type)">
          {{ row.type === 'temporary' ? '临时' : '永久' }}
        </el-tag>
      </template>
      <template #col-expiresAt="{ row }">
        <span v-if="row.expiresAt" :class="{ expired: isExpired(row) }">{{ row.expiresAt }}</span>
        <span v-else class="muted">不过期</span>
      </template>
      <template #col-usedRequests="{ row }">
        <span>{{ row.usedRequests ?? 0 }} / {{ row.maxRequests ?? '不限' }}</span>
      </template>
      <template #col-usedTokens="{ row }">
        <span>{{ formatNumber(row.usedTokens) }} / {{ row.maxTokens ? formatNumber(row.maxTokens) : '不限' }}</span>
      </template>
      <template #col-enabled="{ row }">
        <el-tag :type="row.enabled ? 'success' : 'danger'" >
          {{ row.enabled ? '启用' : '禁用' }}
        </el-tag>
      </template>
      <template #col-actions="{ row }">
        <el-button @click="toggle(row)">
          {{ row.enabled ? '禁用' : '启用' }}
        </el-button>
        <el-button type="danger" plain @click="remove(row)">删除</el-button>
      </template>
    </ReTable>
    </div>

    <!-- 签发令牌对话框 -->
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
          <span class="hint">0 表示不限</span>
        </el-form-item>
        <el-form-item label="最大 Token 数">
          <ReNumberInput v-model="form.maxTokens" :min="0" :step="10000" />
          <span class="hint">0 表示不限</span>
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
import { message } from "@repo/core";
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessageBox } from 'element-plus';
import { createClient, v2Http } from '@/framework/context'
import {
  ArrowLeft24Regular,
  Add24Regular,
  Copy24Regular,
} from '@vicons/fluent'
import ReTable from '@repo/ui/re-table'
import type { ReTableColumn } from '@repo/ui/re-table'


import ReDialog from '@repo/ui/re-dialog';
import ReNumberInput from '@/components/re/ReNumberInput.vue';
const http = createClient(v2Http, { unwrap: false })

/**
 * 列配置：原模板里的 9 个 el-table-column 收敛为数组。
 *
 * <p>「令牌 / 类型 / 过期时间 / 请求次数 / Token 额度 / 状态 / 操作」原本没有 prop
 * 或带 {@code <template #default>}，这里补稳定的合成 prop 并配 {@code slot}，
 * 模板里用 {@code #col-<prop>} 插槽承接原内容。</p>
 */
const tokenColumns: ReTableColumn[] = [
  { prop: 'token', label: '令牌', minWidth: 240, slot: 'token' },
  { prop: 'name', label: '名称', width: 140 },
  { prop: 'type', label: '类型', width: 90, slot: 'type' },
  { prop: 'expiresAt', label: '过期时间', width: 170, slot: 'expiresAt' },
  { prop: 'usedRequests', label: '请求次数', width: 130, slot: 'usedRequests' },
  { prop: 'usedTokens', label: 'Token 额度', width: 150, slot: 'usedTokens' },
  { prop: 'enabled', label: '状态', width: 90, slot: 'enabled' },
  { prop: 'actions', label: '操作', width: 150, slot: 'actions' },
]

/** el-tag 的 type 不接受空串，永久令牌用 info 区分 */
const tokenTagType = (t: string): 'primary' | 'success' | 'info' | 'warning' | 'danger' =>
  t === 'temporary' ? 'warning' : 'info'
const route = useRoute()
const router = useRouter()
const instanceId = String(route.query.instanceId ?? '')

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
  loading.value = true
  try {
    const res = await http.get('/service/tokens', { params: { instanceId } })
    tokens.value = asList(res.data, 'tokens').map(mapToken)
  } catch (e: any) {
    message.error('加载令牌失败: ' + e.message)
  } finally {
    loading.value = false
  }
}

async function loadInstanceName() {
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
  try {
    await http.post('/service/tokens', {
      instanceId,
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
    message.error('签发失败: ' + e.message)
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
    message.error('操作失败: ' + e.message)
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
    message.error('删除失败: ' + e.message)
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

function goBack() {
  router.push({ name: 'SystemSettings', params: { tab: 'services' } })
}

onMounted(() => {
  loadTokens()
  loadInstanceName()
})
</script>

<style scoped>
.service-tokens-page {
  padding: 0;
}
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
.title-wrap {
  display: flex;
  align-items: center;
  gap: 4px;
}
.title-wrap h2 {
  margin: 0;
  font-size: 18px;
  color: var(--el-text-color-primary);
}
.back-btn {
  padding: 4px;
}
.panel-card {
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  /* 原值 18px → xl 档 */
  border-radius: var(--el-radius-xl, 16px);
  padding: 14px 16px 12px;
  /* 表格容器是页面区块，不加投影 */
}
.flat-table { --el-table-border-color: var(--el-border-color-lighter); }
.flat-table :deep(th.el-table__cell) {
  background: var(--el-fill-color-light);
  color: var(--el-text-color-regular);
  font-weight: 600;
}
.token-cell {
  display: flex;
  align-items: center;
  gap: 4px;
}
.token-text {
  font-family: var(--el-font-family-monospace, monospace);
  font-size: 12px;
  color: var(--el-text-color-regular);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.copy-btn {
  flex-shrink: 0;
}
.muted {
  color: var(--el-text-color-secondary);
}
.hint {
  margin-left: 8px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.expired {
  color: var(--el-color-danger);
}
</style>
