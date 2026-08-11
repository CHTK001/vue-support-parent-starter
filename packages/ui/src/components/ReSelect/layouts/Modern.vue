<script setup lang="ts">
/**
 * ReSelect Modern 布局
 *
 * 基于 ReSelect default 布局的轻量包装，仅追加现代化扁平样式类，
 * 保持 el-select 的完整能力（远程 / 多选 / 可搜索 / 可清空等）。
 */
import ReSelect from "../ReSelect.vue";
import "../../shared/modern-vars.css";

defineOptions({ name: "ReSelectModern", inheritAttrs: true });

const model = defineModel<string | number | (string | number)[] | null>({ default: "" });
</script>

<template>
  <!-- 显式使用 default 布局，避免 modern -> modern 的循环分发 -->
  <ReSelect layout="default" v-model="model" v-bind="$attrs" class="re-select--modern" />
</template>

<style scoped>
.re-select--modern {
  width: 100%;
}

.re-select--modern :deep(.el-input__wrapper) {
  border-radius: var(--rm-radius-md);
  box-shadow: 0 0 0 1px var(--rm-border-light) inset;
  background: var(--rm-bg);
  transition: box-shadow var(--rm-transition), background var(--rm-transition);
}

.re-select--modern :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px var(--rm-primary) inset, 0 0 0 4px var(--rm-primary-light-9);
}

.re-select--modern :deep(.el-input__inner) {
  color: var(--rm-text);
  font-size: var(--rm-font-md);
}

.re-select--modern :deep(.el-input__inner::placeholder) {
  color: var(--rm-text-disabled);
}

.re-select--modern :deep(.el-select__caret) {
  color: var(--rm-text-secondary);
}
</style>
