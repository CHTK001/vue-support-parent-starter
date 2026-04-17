<template>
  <ScContextMenu ref="menuRef" :menus="menus" />
</template>

<script setup lang="ts">
import { ref } from "vue";
import ScContextMenu from "@repo/components/ScContextMenu/index.vue";

type MenuTarget = {
  open?: (event: MouseEvent, data: null, node?: unknown) => void;
};

const emit = defineEmits<{
  create: [];
}>();

const menuRef = ref<MenuTarget | null>(null);

const MENU_WIDTH = 200;
const MENU_HEIGHT = 60;

const menus = [
  {
    name: "新建项目",
    icon: "ri:add-circle-line",
    handle: () => emit("create"),
  },
];

const open = (event: MouseEvent) => {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const x = Math.min(event.clientX, vw - MENU_WIDTH - 8);
  const y = Math.min(event.clientY, vh - MENU_HEIGHT - 8);

  // new MouseEvent 必须显式传 clientX/clientY，不能展开原始 event
  const syntheticEvent = new MouseEvent(event.type, {
    bubbles: event.bubbles,
    cancelable: event.cancelable,
    clientX: x,
    clientY: y,
    screenX: event.screenX,
    screenY: event.screenY,
    ctrlKey: event.ctrlKey,
    shiftKey: event.shiftKey,
    altKey: event.altKey,
    metaKey: event.metaKey,
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
