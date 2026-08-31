<template>
  <el-drawer v-model="visible" :title="`主机详情 - ${host?.serverHostName || ''}`" direction="rtl" size="600px" destroy-on-close :close-on-click-modal="false">
    <div v-if="host" class="host-detail">
      <el-descriptions :column="2" border size="small">
        <el-descriptions-item label="主机名称">{{ host.serverHostName }}</el-descriptions-item>
        <el-descriptions-item label="主机编码">{{ host.serverHostCode || '-' }}</el-descriptions-item>
        <el-descriptions-item label="主机地址">{{ host.serverHostAddress }}</el-descriptions-item>
        <el-descriptions-item label="SSH端口">{{ host.serverHostPort }}</el-descriptions-item>
        <el-descriptions-item label="系统类型">{{ host.serverHostOsType }}</el-descriptions-item>
        <el-descriptions-item label="系统版本">{{ host.serverHostOsVersion || '-' }}</el-descriptions-item>
        <el-descriptions-item label="在线状态">
          <el-tag :type="host.serverHostOnline === 1 ? 'success' : host.serverHostOnline === 0 ? 'danger' : 'info'" size="small">
            {{ host.serverHostOnline === 1 ? '在线' : host.serverHostOnline === 0 ? '离线' : '未知' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="公网IP">{{ host.serverHostPublicIp || '-' }}</el-descriptions-item>
        <el-descriptions-item label="内网IP">{{ host.serverHostPrivateIp || '-' }}</el-descriptions-item>
      </el-descriptions>

      <el-divider content-position="left">硬件规格</el-divider>
      <el-descriptions :column="3" border size="small">
        <el-descriptions-item label="CPU 核心">
          <el-tag size="small">{{ host.serverHostCpuCores ?? '-' }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="内存">
          <el-tag size="small">{{ formatMem(host.serverHostMemoryMb) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="磁盘">
          <el-tag size="small">{{ formatDisk(host.serverHostDiskGb) }}</el-tag>
        </el-descriptions-item>
      </el-descriptions>

      <el-divider content-position="left">硬件编辑</el-divider>
      <el-form label-width="90px">
        <el-row :gutter="12">
          <el-col :span="8">
            <el-form-item label="CPU核心">
              <el-input-number v-model="hwForm.serverHostCpuCores" :min="1" :max="256" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="内存(MB)">
              <el-input-number v-model="hwForm.serverHostMemoryMb" :min="1" :max="1048576" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="磁盘(GB)">
              <el-input-number v-model="hwForm.serverHostDiskGb" :min="1" :max="1048576" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="系统版本">
              <el-input v-model="hwForm.serverHostOsVersion" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="公网IP">
              <el-input v-model="hwForm.serverHostPublicIp" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="内网IP">
              <el-input v-model="hwForm.serverHostPrivateIp" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item>
          <el-button type="primary" @click="onSaveHardware" :loading="saving">保存硬件规格</el-button>
        </el-form-item>
      </el-form>
    </div>
  </el-drawer>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { updateHardware } from '../api'

const visible = defineModel<boolean>({ required: true })
const props = defineProps<{ host: Record<string, any> | null }>()
const emit = defineEmits<{ (e: 'updated'): void }>()

const saving = ref(false)

const hwForm = reactive({
  serverHostCpuCores: null as number | null,
  serverHostMemoryMb: null as number | null,
  serverHostDiskGb: null as number | null,
  serverHostOsVersion: '',
  serverHostPublicIp: '',
  serverHostPrivateIp: '',
})

watch(() => props.host, (h) => {
  if (h) {
    hwForm.serverHostCpuCores = h.serverHostCpuCores ?? null
    hwForm.serverHostMemoryMb = h.serverHostMemoryMb ?? null
    hwForm.serverHostDiskGb = h.serverHostDiskGb ?? null
    hwForm.serverHostOsVersion = h.serverHostOsVersion ?? ''
    hwForm.serverHostPublicIp = h.serverHostPublicIp ?? ''
    hwForm.serverHostPrivateIp = h.serverHostPrivateIp ?? ''
  }
}, { immediate: true })

function formatMem(mb?: number | null): string {
  if (!mb) return '-'
  if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`
  return `${mb} MB`
}

function formatDisk(gb?: number | null): string {
  if (!gb) return '-'
  if (gb >= 1024) return `${(gb / 1024).toFixed(1)} TB`
  return `${gb} GB`
}

async function onSaveHardware() {
  if (!props.host?.id) return
  saving.value = true
  try {
    await updateHardware(props.host.id, { ...hwForm })
    ElMessage.success('硬件规格已保存')
    emit('updated')
  } catch (e) {
    ElMessage.error((e as Error).message)
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.host-detail {
  padding: 4px;
}
</style>