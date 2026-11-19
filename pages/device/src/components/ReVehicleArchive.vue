<script setup lang="ts">
/**
 * 车辆档案行（过车记录行展开内容）。
 *
 * <p>按车牌调用 GET /vehicle/by-plate 拉取档案，展示车主 / 电话 / 车型 /
 * 名单类型 / 有效期；有效期已过的车辆用红色标签高亮（通行会被拒绝）。
 * 只读展示，不提供编辑入口。</p>
 *
 * @author CH
 * @since 4.0.0.62
 */
import { computed, onMounted, ref } from 'vue'

import { deviceApi } from '../api/deviceApi'
import type { VehicleInfo } from '../types/device'

const props = defineProps<{ plate: string }>()

const loading = ref(false)
const failed = ref(false)
const info = ref<VehicleInfo | null>(null)

/** 有效期止早于当前时间 = 已过期 */
const expired = computed(() => {
  const end = info.value?.validTo
  if (!end) return false
  const time = new Date(String(end).replace(' ', 'T')).getTime()
  return Number.isFinite(time) && time < Date.now()
})

/** 有效期展示到日期粒度 */
function fmtDay(value?: string): string {
  if (!value) return '—'
  return String(value).replace('T', ' ').slice(0, 10)
}

onMounted(async () => {
  if (!props.plate) return
  loading.value = true
  try {
    const data = await deviceApi.getVehicleByPlate(props.plate)
    info.value = (data ?? null) as VehicleInfo | null
  } catch {
    failed.value = true
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="rva">
    <span v-if="loading" class="rva__muted">正在查询车辆档案…</span>
    <template v-else-if="info">
      <span class="rva__badge">车辆档案</span>
      <span class="rva__item">车主：<b>{{ info.ownerName || '—' }}</b></span>
      <span class="rva__item">电话：{{ info.ownerPhone || '—' }}</span>
      <span class="rva__item">车型：{{ info.vehicleType || '—' }}</span>
      <span class="rva__item">名单：{{ info.listType || '—' }}</span>
      <span class="rva__item">有效期：{{ fmtDay(info.validFrom) }} ~ {{ fmtDay(info.validTo) }}</span>
      <el-tag v-if="expired" size="small" type="danger" effect="dark">有效期已过</el-tag>
    </template>
    <span v-else-if="failed" class="rva__muted">车辆档案查询失败</span>
    <span v-else class="rva__muted">没有「{{ plate }}」的车辆档案</span>
  </div>
</template>

<style scoped>
.rva {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px 14px;
  padding: 2px 4px;
  font-size: 12.5px;
  color: var(--el-text-color-regular);
}
.rva__badge {
  padding: 0 6px;
  font-size: 11.5px;
  line-height: 18px;
  color: var(--el-color-primary);
  border: 1px solid var(--el-color-primary-light-7, currentColor);
  border-radius: 4px;
}
.rva__item b {
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.rva__muted {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
</style>
