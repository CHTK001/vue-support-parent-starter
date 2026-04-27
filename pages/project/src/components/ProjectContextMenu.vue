<template>
  <ScContextMenu ref="menuRef" :menus="currentMenus" />
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import ScContextMenu from "@repo/components/ScContextMenu/index.vue";
import type { SysProject } from "../api/manage/project";

type MenuTarget = {
  open?: (event: MouseEvent, data: unknown, node?: unknown) => void;
};

const emit = defineEmits<{
  create: [];
  secret: [];
  "toggle-server": [project: SysProject];
  copy: [project: SysProject];
  "set-secret": [project: SysProject];
  upload: [project: SysProject];
  "view-log": [project: SysProject];
  "view-config": [project: SysProject];
  software: [project: SysProject];
}>();

const menuRef = ref<MenuTarget | null>(null);
const targetProject = ref<SysProject | undefined>();

const MENU_WIDTH = 220;
const MENU_HEIGHT = 340;

/** 空白区域右键：只显示新建项目 + 密钥管理 */
const blankMenus = computed(() => [
  {
    name: "新建项目",
    icon: "ri:add-circle-line",
    handle: () => emit("create"),
  },
  {
    name: "密钥管理",
    icon: "ri:shield-keyhole-line",
    handle: () => emit("secret"),
  },
]);

/** 卡片右键：显示全部操作 */
const cardMenus = computed(() => [
  {
    name: "新建项目",
    icon: "ri:add-circle-line",
    handle: () => emit("create"),
  },
  {
    name: "复制项目",
    icon: "ri:file-copy-line",
    handle: () => { if (targetProject.value) emit("copy", targetProject.value); },
  },
  {
    name: "设置密钥",
    icon: "ri:key-2-line",
    handle: () => { if (targetProject.value) emit("set-secret", targetProject.value); },
  },
  {
    name: "上传",
    icon: "ri:upload-cloud-line",
    handle: () => { if (targetProject.value) emit("upload", targetProject.value); },
  },
  {
    name: "查看日志",
    icon: "ep:document",
    handle: () => { if (targetProject.value) emit("view-log", targetProject.value); },
  },
  {
    name: "查看配置",
    icon: "ri:file-code-line",
    handle: () => { if (targetProject.value) emit("view-config", targetProject.value); },
  },
  {
    name: "容器软件",
    icon: "ri:apps-2-add-line",
    handle: () => { if (targetProject.value) emit("software", targetProject.value); },
  },
  {
    name: "密钥管理",
    icon: "ri:shield-keyhole-line",
    handle: () => emit("secret"),
  },
  {
    name: targetProject.value?.serverEnabled === 1 ? "✓ 服务器信息" : "服务器信息",
    icon: "ri:server-line",
    handle: () => { if (targetProject.value) emit("toggle-server", targetProject.value); },
  },
]);

const currentMenus = computed(() =>
  targetProject.value ? cardMenus.value : blankMenus.value,
);

const open = (event: MouseEvent, project?: SysProject) => {
  targetProject.value = project;

  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const menuH = project ? MENU_HEIGHT : 100;
  const x = Math.min(event.clientX, vw - MENU_WIDTH - 8);
  const y = Math.min(event.clientY, vh - menuH - 8);

  const syntheticEvent = new MouseEvent(event.type, {
    bubbles: event.bubbles,
    cancelable: event.cancelable,
    clientX: x,
    clientY: y,
    screenX: event.screenX,
    screenY: event.screenY,
    button: event.button,
    buttons: event.buttons,
  });

  menuRef.value?.open?.(syntheticEvent, null, null);
};

defineExpose({ open });
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
:deep(.rightMenu ul) { padding: 8px; }
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
