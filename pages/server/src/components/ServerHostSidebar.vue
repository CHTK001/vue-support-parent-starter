<template>
  <ScCard
    v-loading="loading"
    class="server-sidebar"
    shadow="never"
    :class="{ 'is-collapsed': collapsed }"
    @contextmenu.prevent="emit('contextmenu', $event, null)"
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
      </div>
      <div v-else class="server-sidebar__header-actions">
        <el-tooltip content="收起服务器栏" placement="top">
          <el-button circle @click="emit('update:collapsed', true)">
            <IconifyIconOnline icon="ri:sidebar-fold-line" />
          </el-button>
        </el-tooltip>
      </div>
    </div>

    <div v-if="!collapsed" class="server-sidebar__filters">
      <ScSelect
        :model-value="filter"
        :options="filterOptions"
        layout="icon"
        class="server-sidebar__filter"
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
  "update:filter": [value: string];
  contextmenu: [event: MouseEvent, entry?: ServerHostListEntry | null];
}>();
</script>

<style scoped lang="scss">
.server-sidebar {
  height: 100%;
  border-radius: 28px;
  position: relative;
  overflow: hidden;
  background:
    radial-gradient(circle at top left, rgba(14, 165, 233, 0.12), transparent 26%),
    radial-gradient(circle at bottom right, rgba(245, 158, 11, 0.08), transparent 24%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(244, 247, 250, 0.96));
  border: 1px solid rgba(148, 163, 184, 0.14);
  box-shadow:
    0 22px 40px rgba(15, 23, 42, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.78);
}

.server-sidebar :deep(.el-card__body) {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 16px;
  background: transparent;
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
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.12);
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
  width: 34px;
  height: 34px;
  border-radius: 12px;
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.98),
    rgba(241, 245, 249, 0.96)
  );
  border: 1px solid rgba(148, 163, 184, 0.2);
  box-shadow: 0 10px 18px rgba(15, 23, 42, 0.07);
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease,
    border-color 0.18s ease;
}

.server-sidebar__header-actions :deep(.el-button:hover) {
  transform: translateY(-1px);
  border-color: rgba(14, 165, 233, 0.22);
  box-shadow: 0 16px 26px rgba(15, 23, 42, 0.1);
}

.server-sidebar__filters {
  gap: 10px;
  margin-top: 14px;
  padding: 10px;
  border-radius: 18px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.84), rgba(248, 250, 252, 0.86));
  border: 1px solid rgba(148, 163, 184, 0.12);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.7);
}

.server-sidebar__aggregate-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-top: 10px;
  padding: 12px 14px;
  border-radius: 18px;
  background:
    radial-gradient(
      circle at top right,
      color-mix(in srgb, var(--el-color-primary) 14%, transparent),
      transparent 42%
    ),
    linear-gradient(
      180deg,
      rgba(255, 255, 255, 0.98),
      rgba(248, 250, 252, 0.96)
    );
  border: 1px solid
    color-mix(in srgb, var(--el-color-primary) 16%, rgba(148, 163, 184, 0.28));
  box-shadow: 0 14px 28px rgba(15, 23, 42, 0.06);
  position: relative;
  overflow: hidden;
}

.server-sidebar__aggregate-bar::after {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.22), transparent 34%);
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

.server-sidebar__filter {
  width: 100%;
}

.server-sidebar__filter :deep(.icon-selector-flex) {
  gap: 8px;
}

.server-sidebar__filter :deep(.icon-selector-item) {
  width: 40px;
  height: 40px;
  border-radius: 14px;
  box-shadow: 0 12px 22px rgba(15, 23, 42, 0.05);
}

.server-sidebar__scroll {
  flex: 1;
  margin-top: 14px;
  min-height: 0;
}

.server-sidebar__scroll :deep(.el-scrollbar__bar.is-vertical),
.server-sidebar__scroll :deep(.el-scrollbar__bar.is-horizontal) {
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s ease;
}

.server-sidebar:hover
  .server-sidebar__scroll
  :deep(.el-scrollbar__bar.is-vertical),
.server-sidebar:hover
  .server-sidebar__scroll
  :deep(.el-scrollbar__bar.is-horizontal),
.server-sidebar:focus-within
  .server-sidebar__scroll
  :deep(.el-scrollbar__bar.is-vertical),
.server-sidebar:focus-within
  .server-sidebar__scroll
  :deep(.el-scrollbar__bar.is-horizontal) {
  opacity: 0.35;
  pointer-events: auto;
}

.server-sidebar.is-collapsed .server-sidebar__scroll {
  margin-top: 10px;
}

.server-sidebar__list {
  display: flex;
  flex-direction: column;
  gap: 14px;
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
