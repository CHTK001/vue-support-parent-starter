<template>
  <el-dialog v-model="visibleLocal" title="控制台权限设�? width="520px" @close="handleClose" class="data-console-setting-dialog">
    <div v-if="isJdbc" class="section">
      <div class="section-title">JDBC 控制�?/div>
      <el-form label-width="140px">
        <el-form-item label="查看表结�?>
          <el-switch v-model="form.jdbc.viewTableStructure" />
        </el-form-item>
        <el-form-item label="复制表名">
          <el-switch v-model="form.jdbc.copyTableName" />
        </el-form-item>
        <el-form-item label="复制建表语句">
          <el-switch v-model="form.jdbc.copyCreateTable" />
        </el-form-item>
        <el-form-item label="字段添加注释">
          <el-switch v-model="form.jdbc.addFieldComment" />
        </el-form-item>
      </el-form>
    </div>
    <div v-if="isRedis" class="section">
      <div class="section-title">Redis 控制�?/div>
      <el-form label-width="140px">
        <el-form-item label="复制键名">
          <el-switch v-model="form.redis.copyKeyName" />
        </el-form-item>
        <el-form-item label="查看 TTL">
          <el-switch v-model="form.redis.viewTtl" />
        </el-form-item>
      </el-form>
    </div>
    <div v-if="isZk" class="section">
      <div class="section-title">ZK 控制�?/div>
      <el-form label-width="140px">
        <el-form-item label="创建节点">
          <el-switch v-model="form.zk.createNode" />
        </el-form-item>
        <el-form-item label="删除节点">
          <el-switch v-model="form.zk.deleteNode" />
        </el-form-item>
      </el-form>
    </div>
    <template #footer>
      <el-button @click="visibleLocal=false">取消</el-button>
      <el-button type="primary" :loading="saving" @click="handleSave">保存</el-button>
    </template>
  </el-dialog>
</template>
<script setup lang="ts">
import { computed,ref, watch, reactive } from 'vue'
import { getConsoleConfig, saveConsoleConfig } from '@/api/system-data'

const props = defineProps<{ modelValue: boolean; settingId: number | null; settingType?: string }>()
const emit = defineEmits<{ (e: 'update:modelValue', v: boolean): void; (e: 'saved'): void }>()

const visibleLocal = ref(false)
const saving = ref(false)

interface ConsoleConfig {
  jdbc: {
    viewTableStructure: boolean
    copyTableName: boolean
    copyCreateTable: boolean
    addFieldComment: boolean
  }
  redis: {
    copyKeyName: boolean
    viewTtl: boolean
  }
  zk: {
    createNode: boolean
    deleteNode: boolean
  }
}

const form = reactive<ConsoleConfig>({
  jdbc: { viewTableStructure: true, copyTableName: true, copyCreateTable: false, addFieldComment: true },
  redis: { copyKeyName: true, viewTtl: true },
  zk: { createNode: false, deleteNode: false },
})

const isJdbc = computed(() => (props.settingType || '').toLowerCase().includes('jdbc') || (props.settingType || '').toLowerCase().includes('sql'))
const isRedis = computed(() => (props.settingType || '').toLowerCase().includes('redis'))
const isZk = computed(() => (props.settingType || '').toLowerCase().includes('zk') || (props.settingType || '').toLowerCase().includes('zookeeper'))

watch(
  () => props.modelValue,
  async (v) => {
    visibleLocal.value = v
    if (v && props.settingId) {
      const res = await getConsoleConfig(props.settingId)
      const text = res?.data as string | undefined
      if (text) {
        try {
          const cfg = JSON.parse(text)
          form.jdbc = Object.assign({ viewTableStructure: true, copyTableName: true, copyCreateTable: false, addFieldComment: true }, cfg?.jdbc || {})
          form.redis = Object.assign({ copyKeyName: true, viewTtl: true }, cfg?.redis || {})
          form.zk = Object.assign({ createNode: false, deleteNode: false }, cfg?.zk || {})
        } catch (_) {
          // ignore parse error, keep default
        }
      }
    }
  },
  { immediate: true }
)

function handleClose() {
  emit('update:modelValue', false)
}

async function handleSave() {
  if (!props.settingId) return
  saving.value = true
  try {
    const cfg: ConsoleConfig = { jdbc: { ...form.jdbc }, redis: { ...form.redis }, zk: { ...form.zk } }
    await saveConsoleConfig(props.settingId, cfg)
    emit('saved')
    emit('update:modelValue', false)
  } finally {
    saving.value = false
  }
}
</script>
<style scoped>
.section { padding: 8px 4px }
.section-title { font-weight: 600; color: var(--el-text-color-regular); margin-bottom: 8px }
.data-console-setting-dialog :deep(.el-dialog__body) {
  padding-left: 24px;
  padding-right: 24px;
}
</style>

