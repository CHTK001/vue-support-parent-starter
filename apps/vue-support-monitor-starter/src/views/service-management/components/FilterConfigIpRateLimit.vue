<template>
  <el-dialog v-model="visibleInner" title="IP限流配置" width="760px" :close-on-click-modal="false" @close="handleClose">
    <div>
      <div class="rule-row" v-for="(r, idx) in rules" :key="idx">
        <el-select v-model="r.ipRateLimitType" style="width: 140px" placeholder="类型">
          <el-option label="限流" value="RATE_LIMIT" />
          <el-option label="白名�? value="WHITELIST" />
          <el-option label="黑名�? value="BLACKLIST" />
        </el-select>
        <el-input v-model="r.ipRateLimitIp" placeholder="IP或CIDR" style="width: 220px;margin-left: 8px" />
        <el-input-number v-model="r.ipRateLimitQps" :min="1" :max="100000" style="width: 140px;margin-left: 8px" :disabled="r.ipRateLimitType !== 'RATE_LIMIT'" />
        <el-switch v-model="r.ipRateLimitEnabled" style="margin-left: 8px" />
        <el-button type="danger" size="small" style="margin-left: 8px" @click="rules.splice(idx,1)"><IconifyIconOnline icon="ri:delete-bin-line" /></el-button>
      </div>
      <el-button type="primary" link @click="addRule"><IconifyIconOnline icon="ri:add-line" />新增规则</el-button>
    </div>

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
import { getIpRateLimitRules, saveIpRateLimitRules, type IpRateLimitRule } from '@/api/system-server-setting'

interface Props { visible: boolean; serverId: number; filterSettingId: number }
const props = defineProps<Props>()
const emit = defineEmits<{ 'update:visible': [boolean]; success: [] }>()

const visibleInner = ref(false)
const loading = ref(false)
const rules = ref<IpRateLimitRule[]>([])

watch(() => props.visible, async (v) => { visibleInner.value = v; if (v) await loadData() }, { immediate: true })
watch(visibleInner, v => emit('update:visible', v))

async function loadData() {
  rules.value = []
  try {
    const res = await getIpRateLimitRules(props.serverId, props.filterSettingId)
    if (res.success && Array.isArray(res.data)) {
      rules.value = res.data.map((r: any) => ({
        ipRateLimitType: r.ipRateLimitType || 'RATE_LIMIT',
        ipRateLimitIp: r.ipRateLimitIp || '',
        ipRateLimitQps: typeof r.ipRateLimitQps === 'number' ? r.ipRateLimitQps : 100,
        ipRateLimitEnabled: r.ipRateLimitEnabled !== false
      }))
    }
  } catch (e) { /* ignore */ }
}

function addRule() { rules.value.push({ ipRateLimitType: 'RATE_LIMIT', ipRateLimitIp: '', ipRateLimitQps: 100, ipRateLimitEnabled: true }) }

async function handleSave() {
  loading.value = true
  try {
    const res = await saveIpRateLimitRules(props.serverId, props.filterSettingId, rules.value)
    if (res.success) {
      ElMessage.success('保存成功，已热应�?)
      emit('success')
      visibleInner.value = false
    } else { ElMessage.error(res.msg || '保存失败') }
  } finally { loading.value = false }
}

function handleClose() { visibleInner.value = false }
</script>

<style scoped>
.rule-row { display:flex; align-items:center; margin-bottom:8px }
</style>

