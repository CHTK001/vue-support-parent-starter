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
    <el-table :data="tokens" v-loading="loading" stripe class="flat-table">
      <el-table-column label="令牌" min-width="240">
        <template #default="{ row }">
          <div class="token-cell">
            <span class="token-text">{{ row.token }}</span>
            <el-button text size="small" class="copy-btn" @click="copy(row.token)">
              <el-icon><Copy24Regular /></el-icon>
            </el-button>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="name" label="名称" width="140" />
      <el-table-column label="类型" width="90">
        <template #default="{ row }">
          <el-tag size="small" :type="row.type === 'temporary' ? 'warning' : 'info'">
            {{ row.type === 'temporary' ? '临时' : '永久' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="过期时间" width="170">
        <template #default="{ row }">
          <span v-if="row.expiresAt" :class="{ expired: isExpired(row) }">{{ row.expiresAt }}</span>
          <span v-else class="muted">不过期</span>
        </template>
      </el-table-column>
      <el-table-column label="请求次数" width="130">
        <template #default="{ row }">
          <span>{{ row.usedRequests ?? 0 }} / {{ row.maxRequests ?? '不限' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="Token 额度" width="150">
        <template #default="{ row }">
          <span>{{ formatNumber(row.usedTokens) }} / {{ row.maxTokens ? formatNumber(row.maxTokens) : '不限' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="90">
        <template #default="{ row }">
          <el-tag :type="row.enabled ? 'success' : 'danger'" size="small">
            {{ row.enabled ? '启用' : '禁用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="150">
        <template #default="{ row }">
          <el-button size="small" @click="toggle(row)">
            {{ row.enabled ? '禁用' : '启用' }}
          </el-button>
          <el-button size="small" type="danger" plain @click="remove(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    </div>

    <!-- 签发令牌对话框 -->
    <el-dialog v-model="showCreate" title="签发访问令牌" width="520px" append-to-body>
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
          <el-input-number v-model="form.maxRequests" :min="0" :step="100" />
          <span class="hint">0 表示不限</span>
        </el-form-item>
        <el-form-item label="最大 Token 数">
          <el-input-number v-model="form.maxTokens" :min="0" :step="10000" />
          <span class="hint">0 表示不限</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreate = false">取消</el-button>
        <el-button type="primary" @click="submit">签发</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { createClient, v2Http } from '@/framework/context'
import {
  ArrowLeft24Regular,
  Add24Regular,
  Copy24Regular,
} from '@vicons/fluent'

const http = createClient(v2Http, { unwrap: false })
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
    ElMessage.error('加载令牌失败: ' + e.message)
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
    ElMessage.warning('请填写令牌名称')
    return
  }
  if (form.value.type === 'temporary' && !form.value.expiresAt) {
    ElMessage.warning('请选择过期时间')
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
    ElMessage.success('令牌已签发')
    showCreate.value = false
    loadTokens()
  } catch (e: any) {
    ElMessage.error('签发失败: ' + e.message)
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
    ElMessage.success(row.enabled ? '已禁用' : '已启用')
    loadTokens()
  } catch (e: any) {
    if (e === 'cancel' || e?.message === 'cancel') return
    ElMessage.error('操作失败: ' + e.message)
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
    ElMessage.success('已删除')
    loadTokens()
  } catch (e: any) {
    if (e === 'cancel' || e?.message === 'cancel') return
    ElMessage.error('删除失败: ' + e.message)
  }
}

async function copy(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    ElMessage.success('已复制')
  } catch {
    ElMessage.warning('复制失败，请手动选择复制')
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
  background: var(--color-surface, var(--el-bg-color));
  border: 1px solid var(--color-surface-border, var(--el-border-color-lighter));
  border-radius: 18px;
  padding: 14px 16px 12px;
  box-shadow: 0 10px 30px -18px rgba(16, 24, 40, 0.22);
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
