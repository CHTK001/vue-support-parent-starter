<template>
  <ScContextMenu ref="menuRef" :menus="menus" />
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import ScContextMenu from "@repo/components/ScContextMenu/index.vue";
import type { ServerHost } from "../api";
import type { ServerHostListEntry } from "./server-types";

type MenuTarget = {
  open?: (event: MouseEvent, data: ServerHostListEntry, node?: unknown) => void;
};

const props = withDefaults(
  defineProps<{
    softEnabled?: boolean;
    selectionMode?: boolean;
    aggregateIds?: number[];
  }>(),
  {
    softEnabled: false,
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
  remove: [host: ServerHost];
  "toggle-enabled": [host: ServerHost];
  "open-soft": [host: ServerHost];
  "open-install": [host: ServerHost];
  "open-remote": [host: ServerHost];
  "open-processes": [host: ServerHost];
  "open-files": [host: ServerHost];
  "toggle-aggregate-mode": [];
  "open-aggregate-dashboard": [];
  dashboard: [host: ServerHost];
}>();

const menuRef = ref<MenuTarget | null>(null);

const menus = computed(() => [
    {
      name: "刷新列表",
      icon: "ri:refresh-line",
      handle: () => emit("refresh"),
    },
    {
      name: "新增服务器",
      icon: "ri:add-line",
      handle: () => emit("create"),
    },
    {
      name: props.selectionMode ? "退出聚合选择" : "聚合多选",
      icon: "ri:stack-line",
      handle: () => emit("toggle-aggregate-mode"),
    },
    {
      name: "打开聚合大屏",
      icon: "ri:dashboard-horizontal-line",
      show: props.selectionMode && props.aggregateIds.length > 0,
      handle: () => emit("open-aggregate-dashboard"),
    },
    {
      name: "全局远程代理",
      icon: "ri:route-line",
      handle: () => emit("open-global-remote"),
    },
    {
      name: "全局预警设置",
      icon: "ri:alarm-warning-line",
      handle: () => emit("open-global-alert"),
    },
    {
      name: "查看基础信息",
      icon: "ri:information-line",
      show: (entry?: ServerHostListEntry | null) => Boolean(entry),
      handle: (entry: ServerHostListEntry) => emit("select", entry.host),
    },
    {
      name: "文件管理",
      icon: "ri:folder-5-line",
      show: (entry?: ServerHostListEntry | null) => Boolean(entry),
      handle: (entry: ServerHostListEntry) => emit("open-files", entry.host),
    },
    {
      name: "进程管理",
      icon: "ri:stack-line",
      show: (entry?: ServerHostListEntry | null) => Boolean(entry),
      handle: (entry: ServerHostListEntry) => emit("open-processes", entry.host),
    },
    {
      name: "远程控制",
      icon: "ri:remote-control-line",
      show: (entry?: ServerHostListEntry | null) =>
        Boolean(entry?.remoteConfig?.enabled && entry?.remoteConfig?.launchUrl),
      handle: (entry: ServerHostListEntry) => emit("open-remote", entry.host),
    },
    {
      name: "软件视图",
      icon: "ri:apps-2-line",
      show: (entry?: ServerHostListEntry | null) =>
        props.softEnabled && Number(entry?.summary?.installations || 0) > 0,
      handle: (entry: ServerHostListEntry) => emit("open-soft", entry.host),
    },
    {
      name: "安装软件",
      icon: "ri:download-cloud-2-line",
      show: () => props.softEnabled,
      handle: (entry: ServerHostListEntry) => emit("open-install", entry.host),
    },
    {
      name: "驾驶舱",
      icon: "ri:dashboard-line",
      show: (entry?: ServerHostListEntry | null) => Boolean(entry),
      handle: (entry: ServerHostListEntry) => emit("dashboard", entry.host),
    },
    {
      name: "编辑服务器",
      icon: "ri:edit-line",
      show: (entry?: ServerHostListEntry | null) => Boolean(entry),
      handle: (entry: ServerHostListEntry) => emit("edit", entry.host),
    },
    {
      name: "切换启停",
      icon: "ri:pause-circle-line",
      show: (entry?: ServerHostListEntry | null) => Boolean(entry),
      handle: (entry: ServerHostListEntry) => emit("toggle-enabled", entry.host),
    },
    {
      name: "删除服务器",
      icon: "ri:delete-bin-6-line",
      show: (entry?: ServerHostListEntry | null) => Boolean(entry),
      handle: (entry: ServerHostListEntry) => emit("remove", entry.host),
    },
  ]);

const open = (event: MouseEvent, entry?: ServerHostListEntry | null) => {
  menuRef.value?.open?.(event, entry || null, entry?.host || null);
};

defineExpose({
  open,
});
</script>

<style scoped lang="scss">
:deep(.rightMenu) {
  border-radius: 18px;
  border: 1px solid rgba(148, 163, 184, 0.2);
  background:
    radial-gradient(circle at top right, rgba(59, 130, 246, 0.12), transparent 34%),
    rgba(255, 255, 255, 0.98);
  box-shadow: 0 18px 42px rgba(15, 23, 42, 0.16);
  backdrop-filter: blur(18px);
}

:deep(.rightMenu ul) {
  padding: 8px;
}

:deep(.rightMenu ul li) {
  min-width: 196px;
  min-height: 38px;
  justify-content: flex-start;
  gap: 10px;
  padding: 8px 12px;
  border-radius: 12px;
}

:deep(.rightMenu ul li:hover) {
  background: color-mix(in srgb, var(--el-color-primary) 10%, white);
}
</style>
