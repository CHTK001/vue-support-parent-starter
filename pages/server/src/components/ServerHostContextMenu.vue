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
  }>(),
  {
    softEnabled: false,
  },
);

const emit = defineEmits<{
  select: [host: ServerHost];
  edit: [host: ServerHost];
  remove: [host: ServerHost];
  "toggle-enabled": [host: ServerHost];
  "open-soft": [host: ServerHost];
  "open-install": [host: ServerHost];
  "open-remote": [host: ServerHost];
  "open-processes": [host: ServerHost];
  "open-files": [host: ServerHost];
  dashboard: [host: ServerHost];
}>();

const menuRef = ref<MenuTarget | null>(null);

const menus = computed(() => [
  {
    name: "查看基础信息",
    icon: "ri:information-line",
    handle: (entry: ServerHostListEntry) => emit("select", entry.host),
  },
  {
    name: "文件管理",
    icon: "ri:folder-5-line",
    handle: (entry: ServerHostListEntry) => emit("open-files", entry.host),
  },
  {
    name: "进程管理",
    icon: "ri:stack-line",
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
    handle: (entry: ServerHostListEntry) => emit("dashboard", entry.host),
  },
  { type: "LINE" },
  {
    name: "编辑服务器",
    icon: "ri:edit-line",
    handle: (entry: ServerHostListEntry) => emit("edit", entry.host),
  },
  {
    name: "切换启停",
    icon: "ri:pause-circle-line",
    handle: (entry: ServerHostListEntry) => emit("toggle-enabled", entry.host),
  },
  {
    name: "删除服务器",
    icon: "ri:delete-bin-6-line",
    handle: (entry: ServerHostListEntry) => emit("remove", entry.host),
  },
]);

const open = (event: MouseEvent, entry: ServerHostListEntry) => {
  menuRef.value?.open?.(event, entry, entry.host);
};

defineExpose({
  open,
});
</script>
