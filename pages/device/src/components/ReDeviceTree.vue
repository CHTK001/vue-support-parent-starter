<template>
  <div class="re-device-tree space-y-3">
    <div class="space-y-2">
      <div class="flex items-center justify-between">
        <h2 class="text-sm font-semibold text-el-text">组织架构</h2>
        <el-button type="primary" plain @click="emit('syncOrg')">
          <el-icon class="mr-1"><Refresh /></el-icon>同步
        </el-button>
      </div>
      <el-input v-model="orgKeyword" placeholder="搜索组织" clearable :prefix-icon="Search" />
      <el-tree
        :data="orgTree"
        :props="{ label: 'deviceOrganizationName', children: 'children' }"
        node-key="deviceOrganizationId"
        highlight-current
        default-expand-all
        :filter-node-method="filterOrg"
        @node-click="(data: any) => emit('orgSelect', data)"
        class="re-org-tree"
      />
    </div>

    <div class="border-t border-el-border pt-3 space-y-2">
      <div class="flex items-center justify-between">
        <span class="text-sm font-medium text-el-text">设备 ({{ filteredDevices.length }})</span>
        <el-button type="primary" plain @click="emit('add')">
          <el-icon class="mr-1"><Plus /></el-icon>添加
        </el-button>
      </div>
      <el-select v-model="filterCategory" placeholder="按大类筛选" clearable class="w-full">
        <el-option label="全部" value="" />
        <el-option label="摄像头" value="camera" />
        <el-option label="门禁" value="accessControl" />
        <el-option label="报警" value="alarm" />
        <el-option label="对讲" value="intercom" />
      </el-select>
      <el-input v-model="searchKeyword" placeholder="搜索设备" clearable :prefix-icon="Search" />
      <div class="space-y-2 max-h-96 overflow-auto">
        <div
          v-for="dev in filteredDevices"
          :key="dev.deviceInfoId"
          @click="emit('select', dev)"
          class="p-3 rounded-xl border border-el-border hover:shadow-sm cursor-pointer transition-all"
          :class="{ 'border-el-primary bg-el-primary/5': selectedId === dev.deviceInfoId }"
        >
          <div class="flex items-center justify-between">
            <span class="text-sm font-medium text-el-text">{{ dev.deviceInfoName }}</span>
            <span class="flex items-center gap-1 text-xs">
              <span class="w-2 h-2 rounded-full" :class="dev.deviceInfoOnline ? 'bg-green-500' : 'bg-gray-400'" />
              {{ dev.deviceInfoOnline ? '在线' : '离线' }}
            </span>
          </div>
          <div class="flex items-center justify-between mt-1">
            <span class="text-xs text-el-text-secondary">{{ dev.deviceInfoVendor }} · {{ dev.deviceInfoIp }}</span>
            <el-tag effect="plain">{{ getCategoryLabel(dev.deviceInfoCategory) }}</el-tag>
          </div>
        </div>
        <el-empty v-if="filteredDevices.length === 0" description="暂无设备" :image-size="50" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { Refresh, Plus, Search } from '@element-plus/icons-vue'
import { getCategoryLabel } from '@pages/device/src/utils/deviceCategory'
import type { DeviceInfo, OrgNode } from '@pages/device/src/types/device'

const props = defineProps<{
  orgTree: OrgNode[]
  devices: DeviceInfo[]
  selectedId?: string
}>()

const emit = defineEmits<{
  (e: 'select', dev: DeviceInfo): void
  (e: 'orgSelect', org: OrgNode): void
  (e: 'syncOrg'): void
  (e: 'add'): void
}>()

const orgKeyword = ref('')
const searchKeyword = ref('')
const filterCategory = ref('')

const filteredDevices = computed(() => {
  let list = props.devices
  if (filterCategory.value) {
    list = list.filter((d) => d.deviceInfoCategory === filterCategory.value)
  }
  if (searchKeyword.value) {
    const kw = searchKeyword.value.toLowerCase()
    list = list.filter(
      (d) =>
        d.deviceInfoName.toLowerCase().includes(kw) ||
        d.deviceInfoIp.toLowerCase().includes(kw)
    )
  }
  return list
})

function filterOrg(value: string, data: OrgNode) {
  if (!value) return true
  return data.deviceOrganizationName.includes(value)
}
</script>

<style scoped>
.re-org-tree {
  max-height: 300px;
  overflow: auto;
}
</style>
