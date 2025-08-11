<template>
  <el-dialog v-model="visibleInner" title="服务发现配置" width="820px" :close-on-click-modal="false" @close="handleClose">
    <el-form :model="config" label-width="140px">
      <el-form-item label="模式">
        <el-select v-model="config.serviceDiscoveryMode" placeholder="请选择">
          <el-option label="SPRING" value="SPRING" />
          <el-option label="DEFAULT" value="DEFAULT" />
        </el-select>
      </el-form-item>

      <template v-if="config.serviceDiscoveryMode === 'SPRING'">
        <el-form-item label="Bean名称">
          <el-input v-model="config.serviceDiscoveryBeanName" placeholder="ServiceDiscovery Bean名称" />
        </el-form-item>
      </template>

      <template v-else>
        <el-divider>映射配置</el-divider>
        <div>
          <div class="mapping-row" v-for="(m, idx) in mappings" :key="idx">
            <el-input v-model="m.serviceDiscoveryName" placeholder="服务名" style="width: 180px" />
            <el-input v-model="m.serviceDiscoveryAddress" placeholder="服务地址" style="width: 320px;margin-left: 8px" />
            <el-input-number v-model="m.serviceDiscoveryWeight" :min="0" :max="100" style="width: 120px;margin-left: 8px" />
            <el-switch v-model="m.serviceDiscoveryEnabled" style="margin-left: 8px" />
            <el-button type="danger" circle style="margin-left: 8px" @click="mappings.splice(idx,1)"><IconifyIconOnline icon="ri:delete-bin-line" /></el-button>
          </div>
          <el-button type="primary" link @click="addMapping"><IconifyIconOnline icon="ri:add-line" />新增映射</el-button>
        </div>
      </template>

      <el-form-item label="是否启用">
        <el-switch v-model="config.serviceDiscoveryEnabled" />
      </el-form-item>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" :loading="loading" @click="handleSave">保存</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { getServiceDiscoveryConfig, saveServiceDiscoveryConfig, getServiceDiscoveryMappings, saveServiceDiscoveryMappings, type ServiceDiscoveryConfig, type ServiceDiscoveryMapping } from '@/api/system-server-setting'

interface Props { visible: boolean; serverId: number }
const props = defineProps<Props>()
const emit = defineEmits<{ 'update:visible': [boolean]; success: [] }>()

const visibleInner = ref(false)
const loading = ref(false)
const config = ref<ServiceDiscoveryConfig>({ serviceDiscoveryServerId: 0, serviceDiscoveryMode: 'SPRING', serviceDiscoveryEnabled: true })
const mappings = ref<ServiceDiscoveryMapping[]>([])

watch(() => props.visible, async (v) => { visibleInner.value = v; if (v) await loadData() }, { immediate: true })
watch(visibleInner, v => emit('update:visible', v))

async function loadData() {
  config.value = { serviceDiscoveryServerId: props.serverId, serviceDiscoveryMode: 'SPRING', serviceDiscoveryEnabled: true }
  mappings.value = []
  try {
    const cfg = await getServiceDiscoveryConfig(props.serverId)
    if (cfg.success && Array.isArray(cfg.data) && cfg.data.length > 0) {
      config.value = { ...cfg.data[0] }
    }
    if (config.value.serviceDiscoveryMode === 'DEFAULT') {
      const mp = await getServiceDiscoveryMappings(props.serverId)
      if (mp.success && Array.isArray(mp.data)) { mappings.value = mp.data }
    }
  } catch (e) { /* ignore */ }
}

function addMapping() { mappings.value.push({ serviceDiscoveryName: '', serviceDiscoveryAddress: '', serviceDiscoveryEnabled: true }) }

async function handleSave() {
  loading.value = true
  try {
    config.value.serviceDiscoveryServerId = props.serverId
    const res = await saveServiceDiscoveryConfig(config.value)
    if (!res.success) { ElMessage.error(res.msg || '保存失败'); return }
    if (config.value.serviceDiscoveryMode === 'DEFAULT') {
      const r = await saveServiceDiscoveryMappings(props.serverId, mappings.value)
      if (!r.success) { ElMessage.error(r.msg || '保存映射失败'); return }
    }
    ElMessage.success('保存成功，已热应用')
    emit('success')
    visibleInner.value = false
  } finally { loading.value = false }
}

function handleClose() { visibleInner.value = false }
</script>

<style scoped>
.mapping-row { display:flex; align-items:center; margin-bottom:8px }
</style>

