<template>
  <ScCard
    v-loading="loading"
    class="server-sidebar"
    shadow="never"
    :class="{ 'is-collapsed': collapsed }"
  >
    <div class="server-sidebar__header">
      <div
        v-if="collapsed"
        class="server-sidebar__header-actions is-collapsed-only"
      >
        <el-tooltip content="展开服务器栏" placement="right">
          <el-button circle @click="emit('update:collapsed', false)">
            <IconifyIconOnline icon="ri:sidebar-unfold-line" />
          </el-button>
        </el-tooltip>
        <el-tooltip
          :content="selectionMode ? '退出聚合选择' : '聚合多选'"
          placement="right"
        >
          <el-button
            circle
            :type="selectionMode ? 'primary' : undefined"
            @click="emit('toggle-aggregate-mode')"
          >
            <IconifyIconOnline icon="ri:stack-line" />
          </el-button>
        </el-tooltip>
      </div>
      <div v-else class="server-sidebar__header-actions">
        <el-tooltip content="刷新服务器" placement="top">
          <el-button circle @click="emit('refresh')">
            <IconifyIconOnline icon="ri:refresh-line" />
          </el-button>
        </el-tooltip>
        <el-tooltip content="全局远程代理" placement="top">
          <el-button circle @click="emit('open-global-remote')">
            <IconifyIconOnline icon="ri:route-line" />
          </el-button>
        </el-tooltip>
        <el-tooltip content="全局预警设置" placement="top">
          <el-button circle @click="emit('open-global-alert')">
            <IconifyIconOnline icon="ri:alarm-warning-line" />
          </el-button>
        </el-tooltip>
        <el-tooltip content="新增服务器" placement="top">
          <el-button circle type="primary" @click="emit('create')">
            <IconifyIconOnline icon="ri:add-line" />
          </el-button>
        </el-tooltip>
        <el-tooltip
          :content="selectionMode ? '退出聚合选择' : '聚合多选'"
          placement="top"
        >
          <el-button
            circle
            :type="selectionMode ? 'primary' : undefined"
            @click="emit('toggle-aggregate-mode')"
          >
            <IconifyIconOnline icon="ri:stack-line" />
          </el-button>
        </el-tooltip>
        <el-tooltip v-if="selectionMode" content="打开聚合大屏" placement="top">
          <el-button
            circle
            type="success"
            :disabled="!aggregateIds.length"
            @click="emit('open-aggregate-dashboard')"
          >
            <IconifyIconOnline icon="ri:dashboard-horizontal-line" />
          </el-button>
        </el-tooltip>
        <el-tooltip content="收起服务器栏" placement="top">
          <el-button circle @click="emit('update:collapsed', true)">
            <IconifyIconOnline icon="ri:sidebar-fold-line" />
          </el-button>
        </el-tooltip>
      </div>
    </div>

    <div v-if="!collapsed" class="server-sidebar__filters">
      <ScInput
        :model-value="keyword"
        clearable
        class="server-sidebar__search"
        placeholder="搜索名称、IP、账号、标签"
        @update:model-value="emit('update:keyword', String($event || ''))"
      >
        <template #prefix>
          <IconifyIconOnline icon="ri:search-line" />
        </template>
      </ScInput>
      <ScSelect
        :model-value="filter"
        :options="filterOptions"
        layout="dropdown"
        class="server-sidebar__filter"
        width="100%"
        dropdown-title="筛选服务器"
        dropdown-placeholder="筛选服务器"
        dropdown-icon="ri:filter-3-line"
        display-mode="normal"
        @update:model-value="emit('update:filter', String($event || 'ALL'))"
      />
    </div>

    <div
      v-if="!collapsed && selectionMode"
      class="server-sidebar__aggregate-bar"
    >
      <span class="server-sidebar__aggregate-chip">
        已选 {{ aggregateIds.length }} 台服务器
      </span>
      <el-button
        size="small"
        type="success"
        :disabled="!aggregateIds.length"
        @click="emit('open-aggregate-dashboard')"
      >
        聚合大屏
      </el-button>
    </div>

    <ScScrollbar class="server-sidebar__scroll">
      <div class="server-sidebar__list">
        <ServerHostCard
          v-for="entry in entries"
          :key="entry.host.serverId"
          :entry="entry"
          :active="
            selectionMode
              ? aggregateIds.includes(Number(entry.host.serverId || 0))
              : entry.host.serverId === selectedId
          "
          :collapsed="collapsed"
          :soft-enabled="softEnabled"
          @select="
            selectionMode
              ? emit('toggle-aggregate-host', $event)
              : emit('select', $event)
          "
          @edit="emit('edit', $event)"
          @toggle-enabled="emit('toggle-enabled', $event)"
          @open-soft="emit('open-soft', $event)"
          @open-install="emit('open-install', $event)"
          @open-remote="emit('open-remote', $event)"
          @open-processes="emit('open-processes', $event)"
          @contextmenu="emit('contextmenu', $event, entry)"
        />
      </div>
      <el-empty v-if="!entries.length" description="当前没有服务器数据" />
    </ScScrollbar>
  </ScCard>
</template>

<script setup lang="ts">
import ScCard from "@repo/components/ScCard/index.vue";
import ScInput from "@repo/components/ScInput/index.vue";
import ScScrollbar from "@repo/components/ScScrollbar/src/index.vue";
import ScSelect from "@repo/components/ScSelect/index.vue";
import ServerHostCard from "./ServerHostCard.vue";
import type { ServerHost } from "../api";
import type { ServerHostListEntry, SelectOption } from "./server-types";

withDefaults(
  defineProps<{
    loading?: boolean;
    entries: ServerHostListEntry[];
    selectedId?: number | null;
    collapsed?: boolean;
    keyword?: string;
    filter?: string;
    softEnabled?: boolean;
    filterOptions: SelectOption[];
    selectionMode?: boolean;
    aggregateIds?: number[];
  }>(),
  {
    selectionMode: false,
    aggregateIds: () => [],
  },
);

const emit = defineEmits<{
  refresh: [];
  create: [];
  "open-global-remote": [];
  "open-global-alert": [];
  select: [host: ServerHost];
  edit: [host: ServerHost];
  "toggle-enabled": [host: ServerHost];
  "open-soft": [host: ServerHost];
  "open-install": [host: ServerHost];
  "open-remote": [host: ServerHost];
  "open-processes": [host: ServerHost];
  "toggle-aggregate-mode": [];
  "toggle-aggregate-host": [host: ServerHost];
  "open-aggregate-dashboard": [];
  "update:collapsed": [value: boolean];
  "update:keyword": [value: string];
  "update:filter": [value: string];
  contextmenu: [event: MouseEvent, entry: ServerHostListEntry];
}>();
</script>

<style scoped lang="scss">
.server-sidebar {
  height: 100%;
  border-radius: 28px;
}

.server-sidebar :deep(.el-card__body) {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 16px;
}

.server-sidebar.is-collapsed :deep(.el-card__body) {
  padding: 12px 8px;
}

.server-sidebar__header,
.server-sidebar__header-actions,
.server-sidebar__filters {
  display: flex;
  align-items: center;
}

.server-sidebar__header {
  justify-content: flex-end;
  gap: 10px;
}

.server-sidebar__header-actions {
  gap: 8px;
  width: 100%;
  justify-content: flex-end;
}

.server-sidebar.is-collapsed .server-sidebar__header-actions {
  justify-content: center;
}

.server-sidebar__header-actions.is-collapsed-only {
  justify-content: center;
}

.server-sidebar__header-actions :deep(.el-button) {
  width: 30px;
  height: 30px;
}

.server-sidebar__filters {
  gap: 10px;
  margin-top: 12px;
}

.server-sidebar__aggregate-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-top: 10px;
  padding: 10px 12px;
  border-radius: 16px;
  background: color-mix(in srgb, var(--el-color-primary) 8%, white);
  border: 1px solid color-mix(in srgb, var(--el-color-primary) 18%, transparent);
}

.server-sidebar__aggregate-chip {
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  padding: 0 10px;
  border-radius: 999px;
  color: var(--el-color-primary);
  background: color-mix(in srgb, var(--el-color-primary) 12%, white);
  font-size: 12px;
  font-weight: 600;
}

.server-sidebar__search {
  flex: 1;
}

.server-sidebar__filter {
  width: 176px;
}

.server-sidebar__scroll {
  flex: 1;
  margin-top: 12px;
}

.server-sidebar.is-collapsed .server-sidebar__scroll {
  margin-top: 10px;
}

.server-sidebar__list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-right: 6px;
}

.server-sidebar.is-collapsed .server-sidebar__list {
  gap: 10px;
  padding-right: 0;
}

@media (max-width: 1440px) {
  .server-sidebar__filters {
    flex-direction: column;
    align-items: stretch;
  }

  .server-sidebar__filter {
    width: 100%;
  }
}
</style>
