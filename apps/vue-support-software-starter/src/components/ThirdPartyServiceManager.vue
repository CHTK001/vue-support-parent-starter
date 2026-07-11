<template>
  <div class="tpsm">
    <div class="tpsm-hd">
      <el-button size="small" :icon="Plus" @click="showEditor()">添加服务</el-button>
      <el-button size="small" :loading="loading" @click="load">刷新</el-button>
    </div>

    <div v-if="services.length" class="tpsm-list">
      <div v-for="svc in services" :key="svc.id" class="tpsm-item" :class="{ disabled: !svc.enabled }">
        <div class="tpsm-left">
          <span class="tpsm-badge" :class="'t-' + svc.serviceType">{{ serviceTypeLabel(svc.serviceType) }}</span>
          <div class="tpsm-info">
            <div class="tpsm-name">
              {{ svc.serviceName }}
              <span v-if="reachable[svc.id!]" class="tpsm-ok">正常</span>
              <span v-else-if="reachable[svc.id!] === false" class="tpsm-err">不可达</span>
            </div>
            <div class="tpsm-url">{{ svc.apiUrl }}</div>
          </div>
        </div>
        <div class="tpsm-right">
          <el-switch :model-value="svc.enabled" size="small" @change="(v: boolean) => toggleEnable(svc, v)" />
          <el-button text size="small" :icon="Edit" @click="showEditor(svc)" />
          <el-button text size="small" type="danger" :icon="Delete" @click="doDelete(svc)" />
        </div>
      </div>
    </div>
    <el-empty v-else description="暂未配置三方服务" :image-size="40" />

    <el-dialog v-model="editVisible" :title="editing ? '编辑服务' : '添加服务'" width="500px" :close-on-click-modal="false">
      <el-form label-position="top" class="tpsm-form">
        <el-form-item label="服务名称">
          <el-input v-model="form.serviceName" placeholder="例如：我的安装服务" />
        </el-form-item>
        <el-form-item label="服务类型">
          <el-select v-model="form.serviceType" class="tpsm-select">
            <el-option v-for="t in serviceTypes" :key="t.id" :label="t.name + ' — ' + t.desc" :value="t.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="API 地址">
          <el-input v-model="form.apiUrl" placeholder="https://example.com/api" />
        </el-form-item>
        <el-form-item label="API 密钥（可选）">
          <el-input v-model="form.apiKey" type="password" placeholder="留空则不使用密钥" show-password />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="doSave">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Edit, Delete } from '@element-plus/icons-vue'
import { listThirdPartyServices, saveThirdPartyService, deleteThirdPartyService, checkThirdPartyService, getThirdPartyServiceTypes } from '@/api/software'

const services = ref<any[]>([])
const serviceTypes = ref<{ id: string; name: string; desc: string }[]>([])
const loading = ref(false)
const saving = ref(false)
const editVisible = ref(false)
const editing = ref<any>(null)
const reachable = ref<Record<number, boolean>>({})
const form = ref({ serviceName: '', serviceType: 'install', apiUrl: '', apiKey: '' })

async function load() {
  loading.value = true
  try {
    services.value = await listThirdPartyServices()
    serviceTypes.value = await getThirdPartyServiceTypes()
    for (const svc of services.value) {
      checkReachable(svc.id)
    }
  } catch { ElMessage.error('加载失败') }
  finally { loading.value = false }
}

async function checkReachable(id: number) {
  try {
    const res = await checkThirdPartyService(id)
    reachable.value[id] = res.reachable
  } catch { reachable.value[id] = false }
}

function serviceTypeLabel(type: string): string {
  const t = serviceTypes.value.find(s => s.id === type)
  return t?.name || type
}

function showEditor(svc?: any) {
  if (svc) {
    editing.value = svc
    form.value = { serviceName: svc.serviceName, serviceType: svc.serviceType, apiUrl: svc.apiUrl, apiKey: svc.apiKey || '' }
  } else {
    editing.value = null
    form.value = { serviceName: '', serviceType: 'install', apiUrl: '', apiKey: '' }
  }
  editVisible.value = true
}

async function doSave() {
  saving.value = true
  try {
    const data = editing.value ? { ...editing.value, ...form.value } : { ...form.value }
    const saved = await saveThirdPartyService(data)
    if (!editing.value) services.value.push(saved)
    else Object.assign(editing.value, saved)
    editVisible.value = false
    ElMessage.success('已保存')
  } catch { ElMessage.error('保存失败') }
  finally { saving.value = false }
}

async function toggleEnable(svc: any, enabled: boolean) {
  try {
    await saveThirdPartyService({ ...svc, enabled })
    svc.enabled = enabled
  } catch { ElMessage.error('操作失败') }
}

async function doDelete(svc: any) {
  ElMessageBox.confirm(`确定删除服务「${svc.serviceName}」？`, '', {
    confirmButtonText: '删除', cancelButtonText: '取消', type: 'warning',
  }).then(async () => {
    try {
      await deleteThirdPartyService(svc.id)
      services.value = services.value.filter(s => s.id !== svc.id)
      ElMessage.success('已删除')
    } catch { ElMessage.error('删除失败') }
  })
}

onMounted(() => { load() })
</script>

<style scoped>
.tpsm-hd { display: flex; gap: 8px; margin-bottom: 12px; }
.tpsm-list { display: flex; flex-direction: column; gap: 6px; }
.tpsm-item { display: flex; align-items: center; justify-content: space-between; padding: 12px 14px; border: 1px solid var(--el-border-color-light); border-radius: 10px; transition: background 0.1s; gap: 12px; }
.tpsm-item:hover { background: var(--el-color-primary-light-9); }
.tpsm-item.disabled { opacity: 0.5; }
.tpsm-left { display: flex; align-items: center; gap: 10px; min-width: 0; flex: 1; }
.tpsm-badge { padding: 2px 10px; border-radius: 100px; font-size: 11px; font-weight: 600; flex-shrink: 0; }
.t-install { background: #dbeafe; color: #1e40af; }
.t-update { background: #dcfce7; color: #166534; }
.t-cleanup { background: #fef3c7; color: #92400e; }
.t-monitor { background: #f3e8ff; color: #6b21a8; }
.t-sync { background: #fce7f3; color: #9d174d; }
.tpsm-info { min-width: 0; }
.tpsm-name { font-size: 14px; font-weight: 600; display: flex; align-items: center; gap: 6px; }
.tpsm-url { font-size: 11px; color: var(--el-text-color-secondary); font-family: monospace; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.tpsm-ok { font-size: 11px; padding: 1px 6px; border-radius: 4px; background: #dcfce7; color: #166534; }
.tpsm-err { font-size: 11px; padding: 1px 6px; border-radius: 4px; background: #fee2e2; color: #b91c1c; }
.tpsm-right { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }
.tpsm-select { width: 100%; }
</style>
