<template>
  <div class="asset-list">
    <el-card class="shadow-sm rounded-xl p-6">
      <template #header>
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold text-el-text">资产列表</h3>
          <el-button type="primary" @click="handleAdd">新增资产</el-button>
        </div>
      </template>

      <el-table :data="assets" style="width: 100%">
        <el-table-column prop="monitorName" label="资产名称" width="150" />
        <el-table-column prop="monitorHost" label="主机地址" width="150" />
        <el-table-column prop="monitorPort" label="端口" width="80" />
        <el-table-column prop="serviceType" label="服务类型" width="100" />
        <el-table-column prop="serverType" label="系统类型" width="100" />
        <el-table-column prop="monitorEnabled" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.monitorEnabled === 1 ? 'success' : 'danger'">
              {{ row.monitorEnabled === 1 ? '运行中' : '已停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" align="right">
          <template #default="{ row }">
            <el-button text type="primary" @click="handleEdit(row)">编辑</el-button>
            <el-button text type="danger" @click="handleDelete(row.id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="showDialog" :title="editId ? '编辑资产' : '新增资产'" width="520px" destroy-on-close>
      <el-form :model="form" label-position="top">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="资产名称">
              <el-input v-model="form.monitorName" placeholder="例如：prod-web-01" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="主机地址">
              <el-input v-model="form.monitorHost" placeholder="192.168.1.100" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="端口">
              <el-input-number v-model="form.monitorPort" :min="1" :max="65535" style="width:100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="服务类型">
              <el-select v-model="form.serviceType" style="width:100%">
                <el-option label="服务器" value="SERVER" />
                <el-option label="Redis" value="REDIS" />
                <el-option label="MySQL" value="MYSQL" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20" v-if="form.serviceType === 'SERVER'">
          <el-col :span="12">
            <el-form-item label="系统类型">
              <el-select v-model="form.serverType" style="width:100%" @change="onServerTypeChange">
                <el-option label="Linux" value="LINUX" />
                <el-option label="Windows" value="WINDOWS" />
                <el-option label="macOS" value="MACOS" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="启用状态">
          <el-switch v-model="form.monitorEnabled" :active-value="1" :inactive-value="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showDialog = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getMonitors, saveMonitor, delMonitor } from '../../api'

interface Asset {
  id: number
  monitorName: string
  monitorHost: string
  monitorPort: number
  serviceType: string
  serverType: string
  monitorEnabled: number
}

const assets = ref<Asset[]>([])
const showDialog = ref(false)
const editId = ref<number | null>(null)
const form = ref<Partial<Asset>>({
  monitorPort: 22,
  serviceType: 'SERVER',
  serverType: 'LINUX',
  monitorEnabled: 1
})

const loadAssets = async () => {
  try {
    const res = await getMonitors()
    assets.value = res.filter((a: any) => a.serviceType === 'SERVER')
  } catch (e) {
    console.error('加载资产失败', e)
  }
}

const handleAdd = () => {
  editId.value = null
  form.value = { monitorPort: 22, serviceType: 'SERVER', serverType: 'LINUX', monitorEnabled: 1 }
  showDialog.value = true
}

const handleEdit = (row: Asset) => {
  editId.value = row.id
  form.value = { ...row }
  showDialog.value = true
}

const handleDelete = async (id: number) => {
  try {
    await delMonitor(id)
    await loadAssets()
  } catch (e) {
    console.error('删除失败', e)
  }
}

const handleSubmit = async () => {
  try {
    await saveMonitor(editId.value || 0, form.value)
    showDialog.value = false
    await loadAssets()
  } catch (e) {
    console.error('保存失败', e)
  }
}

const onServerTypeChange = (type: string) => {
  form.value.serverType = type
  if (type === 'LINUX' || type === 'MACOS') {
    form.value.monitorPort = 22
  } else if (type === 'WINDOWS') {
    form.value.monitorPort = 5985
  }
}

onMounted(loadAssets)
</script>

<style scoped>
.asset-list {
  padding: 20px;
}
</style>
