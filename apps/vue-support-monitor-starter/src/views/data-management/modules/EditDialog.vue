<template>
  <el-dialog v-model="visibleInner" :title="modelValue ? '编辑配置' : '新建配置'" width="700px" :close-on-click-modal="false" @close="handleClose">
    <el-form :model="form" label-width="140px">
      <el-form-item label="名称"><el-input v-model="form.systemDataSettingName" /></el-form-item>
      <el-form-item label="类型">
        <el-select v-model="form.systemDataSettingType">
          <el-option v-for="item in systemDataSettingTypeValues" :label="item.name" :value="item?.value || item.name">

          </el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="地址"><el-input v-model="form.systemDataSettingServer" placeholder="优先填写完整连接串" /></el-form-item>
      <el-form-item label="主机/端口">
        <div style="display:flex; gap:8px; width:100%">
          <el-input v-model="form.systemDataSettingHost" placeholder="主机" />
          <el-input-number v-model="form.systemDataSettingPort" :min="0" :max="65535" placeholder="端口" />
        </div>
      </el-form-item>
      <el-form-item label="账号/密码">
        <div style="display:flex; gap:8px; width:100%">
          <el-input v-model="form.systemDataSettingUsername" placeholder="账号" />
          <el-input v-model="form.systemDataSettingPassword" type="password" placeholder="密码" />
        </div>
      </el-form-item>
      <el-form-item label="认证类型"><el-input v-model="form.systemDataSettingAuthType" /></el-form-item>
      <el-form-item label="控制台类型">
        <el-select v-model="form.systemDataSettingConsoleType" placeholder="请选择">
          <el-option label="表格" value="TABLE" />
          <el-option label="图形" value="GRAPH" />
          <el-option label="文件" value="FILE" />
        </el-select>
      </el-form-item>
      <el-form-item label="超时时间(ms)"><el-input-number v-model="form.systemDataSettingTimeoutMs" :min="0" :max="600000" /></el-form-item>
      <el-form-item label="是否文件"><el-switch v-model="form.systemDataSettingIsFile" /></el-form-item>
      <el-form-item label="启用"><el-switch v-model="form.systemDataSettingEnabled" /></el-form-item>
      <el-form-item label="图标"><el-input v-model="form.systemDataSettingIcon" placeholder="图片URL" /></el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" :loading="loading" @click="handleSave">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { saveSystemDataSetting, type SystemDataSetting } from '@/api/system-data'
import { ElMessage } from 'element-plus'

interface Props { visible: boolean; modelValue?: SystemDataSetting | null }
const props = defineProps<Props>()
const emit = defineEmits<{ 'update:visible': [boolean]; success: [] }>()

const systemDataSettingTypeValues = [{
  name: '数据库',
  value: 'JDBC',
}, {
  name: 'REDIS',
}]
const visibleInner = ref(false)
const loading = ref(false)
const form = ref<SystemDataSetting>({ systemDataSettingName: '', systemDataSettingType: '', systemDataSettingEnabled: true, systemDataSettingTimeoutMs: 600000 })

watch(() => props.visible, (v) => { visibleInner.value = v; if (v) init() }, { immediate: true })
watch(visibleInner, v => emit('update:visible', v))

function init() {
  form.value = props.modelValue ? { ...(props.modelValue as any) } : { systemDataSettingName: '', systemDataSettingType: '', systemDataSettingEnabled: true }
}

async function handleSave() {
  loading.value = true
  try {
    const res = await saveSystemDataSetting(form.value)
    if (!res?.success) { ElMessage.error(res?.msg || '保存失败'); return }
    ElMessage.success('保存成功')
    emit('success')
    visibleInner.value = false
  } finally {
    loading.value = false
  }
}

function handleClose() { visibleInner.value = false }
</script>

<style scoped>
</style>


