<script setup lang="ts">
/**
 * ReDrawer default 主题 —— 抽屉组件（el-drawer 封装）
 */
import { ElDrawer } from "element-plus";

defineOptions({ name: "ReDrawer", inheritAttrs: true });

const visible = defineModel<boolean>({ default: false });

defineProps<{
  title?: string;
  size?: string | number;
  direction?: "ltr" | "rtl" | "ttb" | "btt";
  appendToBody?: boolean;
  closeOnClickModal?: boolean;
  destroyOnClose?: boolean;
  beforeClose?: (done: () => void) => void;
  showClose?: boolean;
  modal?: boolean;
  lockScroll?: boolean;
}>();
</script>

<template>
  <ElDrawer
    v-model="visible"
    v-bind="$attrs"
    :title="title"
    :size="size"
    :direction="direction"
    :append-to-body="appendToBody"
    :close-on-click-modal="closeOnClickModal"
    :destroy-on-close="destroyOnClose"
    :before-close="beforeClose"
    :show-close="showClose"
    :modal="modal"
    :lock-scroll="lockScroll"
  >
    <slot />
    <template v-if="$slots.footer" #footer>
      <slot name="footer" />
    </template>
  </ElDrawer>
</template>
