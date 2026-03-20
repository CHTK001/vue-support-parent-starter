<template>
  <el-menu
    class="sc-menu"
    :mode="mode"
    :collapse="collapse"
    :default-active="defaultActive"
    :default-openeds="defaultOpeneds"
    :unique-opened="uniqueOpened"
    :router="router"
    :ellipsis="ellipsis"
    :background-color="backgroundColor"
    :text-color="textColor"
    :active-text-color="activeTextColor"
    v-bind="$attrs"
    @select="handleSelect"
    @open="(index, indexPath) => emit('open', index, indexPath)"
    @close="(index, indexPath) => emit('close', index, indexPath)"
  >
    <slot />
  </el-menu>
</template>

<script setup lang="ts">
import type { PropType } from "vue";

const emit = defineEmits<{
  (e: "select", index: string, indexPath: string[], item: unknown, routeResult?: unknown): void;
  (e: "open", index: string, indexPath: string[]): void;
  (e: "close", index: string, indexPath: string[]): void;
}>();

defineProps({
  mode: { type: String as PropType<"horizontal" | "vertical">, default: "vertical" },
  collapse: { type: Boolean, default: false },
  defaultActive: { type: String, default: "" },
  defaultOpeneds: { type: Array as PropType<string[]>, default: () => [] },
  uniqueOpened: { type: Boolean, default: false },
  router: { type: Boolean, default: false },
  ellipsis: { type: Boolean, default: true },
  backgroundColor: { type: String, default: "" },
  textColor: { type: String, default: "" },
  activeTextColor: { type: String, default: "" },
});

const handleSelect = (index: string, indexPath: string[], item: unknown, routeResult?: unknown) => {
  emit("select", index, indexPath, item, routeResult);
};
</script>
