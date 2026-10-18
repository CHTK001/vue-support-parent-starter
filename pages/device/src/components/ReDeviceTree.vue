<template>
  <div class="dt">
    <!-- 组织架构 -->
    <section class="dt-panel">
      <header class="dt-panel__head">
        <span class="dt-panel__bar" />
        <span>组织架构</span>
        <span class="dt-panel__count">{{ orgTree.length }}</span>
        <div class="dt-panel__ops">
          <ReButton icon="Refresh" layout="square" tip="从厂商侧同步组织" @click="emit('syncOrg')" />
        </div>
      </header>
      <ReInput
        v-model="orgKeyword"
        placeholder="搜索组织名称"
        clearable
        prefix-icon="Search"
        class="dt-search"
      />
      <div class="dt-tree">
        <!-- 有数据才渲染 el-tree：否则它会自带的「暂无数据」与下方 ReEmpty 重叠成两个空态 -->
        <el-tree
          v-if="orgTree.length"
          ref="treeRef"
          :data="orgTree"
          :props="{ label: 'deviceOrganizationName', children: 'children' }"
          node-key="deviceOrganizationId"
          highlight-current
          default-expand-all
          :filter-node-method="filterOrg"
          @node-click="(data: any) => emit('orgSelect', data)"
        />
        <ReEmpty v-if="!orgTree.length" description="暂无组织数据" :image-size="58" />
      </div>
    </section>

    <!-- 设备清单 -->
    <section class="dt-panel dt-panel--grow">
      <header class="dt-panel__head">
        <span class="dt-panel__bar" />
        <span>设备</span>
        <span class="dt-panel__count">{{ filteredDevices.length }}</span>
        <div class="dt-panel__ops">
          <ReButton icon="Plus" layout="square" tip="添加设备" type="primary" @click="emit('add')" />
        </div>
      </header>

      <div class="dt-filters">
        <ReSelect
          v-model="filterCategory"
          placeholder="全部大类"
          clearable
          :options="CATEGORY_FILTER_OPTIONS"
          class="dt-filters__select"
        />
        <ReInput v-model="searchKeyword" placeholder="搜索名称 / IP" clearable prefix-icon="Search" class="dt-filters__search" />
      </div>

      <div class="dt-list">
        <article
          v-for="dev in filteredDevices"
          :key="dev.deviceInfoId"
          class="dt-item"
          :class="{ 'is-active': selectedId === dev.deviceInfoId }"
          @click="emit('select', dev)"
        >
          <div class="dt-item__top">
            <span class="dt-item__name">{{ dev.deviceInfoName }}</span>
            <span class="dt-item__status">
              <ReStatusIndicator :type="dev.deviceInfoOnline ? 'success' : 'info'" />
              {{ dev.deviceInfoOnline ? '在线' : '离线' }}
            </span>
          </div>
          <div class="dt-item__bottom">
            <span class="dt-item__meta">{{ dev.deviceInfoVendor || '—' }} · {{ dev.deviceInfoIp || '未配置 IP' }}</span>
            <el-icon v-if="hasGeo(dev)" class="dt-item__geo" title="已配置经纬度，可在地图上查看">
              <Location />
            </el-icon>
            <ReTag size="small" effect="plain">{{ getCategoryLabel(dev.deviceInfoCategory) }}</ReTag>
          </div>
        </article>
        <ReEmpty v-if="!filteredDevices.length" description="无匹配设备" :image-size="58" />
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import ReButton from '@repo/ui/re-button'
import ReEmpty from '@repo/ui/re-empty'
import ReInput from '@repo/ui/re-input'
import ReSelect from '@repo/ui/re-select'
import ReStatusIndicator from '@repo/ui/re-status-indicator'
import ReTag from '@repo/ui/re-tag'
import { getCategoryLabel } from '../utils/deviceCategory'
import type { DeviceInfo, OrgNode } from '../types/device'

/** 大类筛选项（与后端 DeviceCategory 对齐） */
const CATEGORY_FILTER_OPTIONS = [
  { label: '摄像头', value: 'camera' },
  { label: '门禁', value: 'accessControl' },
  { label: '报警', value: 'alarm' },
  { label: '对讲', value: 'intercom' },
]

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

const treeRef = ref()
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
      (d) => (d.deviceInfoName || '').toLowerCase().includes(kw) || (d.deviceInfoIp || '').toLowerCase().includes(kw),
    )
  }
  return list
})

/** 组织树过滤：关键字命中即保留（原实现漏了 tree 实例的 filter 调用，这里补上） */
watch(orgKeyword, async (kw) => {
  await nextTick()
  treeRef.value?.filter?.(kw)
})

function filterOrg(value: string, data: OrgNode) {
  if (!value) return true
  return (data.deviceOrganizationName || '').includes(value)
}
</script>

<style scoped>
.dt {
  display: flex;
  flex-direction: column;
  gap: 14px;
  height: 100%;
  min-height: 0;
}
.dt-panel {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px 14px 12px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-xl, 16px);
  box-shadow: var(--el-box-shadow-light, var(--shadow-1));
}
.dt-panel--grow {
  flex: 1;
  min-height: 0;
}
.dt-panel__head {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13.5px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.dt-panel__bar {
  width: 5px;
  height: 15px;
  border-radius: 999px;
  background: var(--el-color-primary);
}
.dt-panel__count {
  font-size: 12px;
  font-weight: 400;
  color: var(--el-text-color-secondary);
}
.dt-panel__ops {
  margin-left: auto;
}
.dt-search {
  width: 100%;
}

.dt-tree {
  max-height: 240px;
  overflow: auto;
}
.dt-tree :deep(.el-tree) {
  background: transparent;
  --el-tree-node-hover-bg-color: color-mix(in srgb, var(--el-color-primary) 8%, transparent);
}
.dt-tree :deep(.el-tree-node__content) {
  height: 30px;
  border-radius: var(--el-radius-base, 8px);
  font-size: 13px;
}

.dt-filters {
  display: flex;
  gap: 8px;
}
.dt-filters__select {
  width: 130px;
  flex: none;
}
.dt-filters__search {
  flex: 1;
  min-width: 0;
}

.dt-list {
  flex: 1;
  min-height: 0;
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-right: 2px;
}
.dt-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px 12px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-lg, 12px);
  background: color-mix(in srgb, var(--el-text-color-primary) 2.5%, transparent);
  cursor: pointer;
  transition: all 0.16s ease;
}
.dt-item:hover {
  border-color: var(--el-color-primary-light-7);
  box-shadow: var(--el-box-shadow-light);
}
.dt-item.is-active {
  border-color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}
.dt-item__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.dt-item__name {
  font-size: 13.5px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.dt-item__status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex: none;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.dt-item__bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.dt-item__meta {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
