<script setup lang="ts">
/**
 * ReSearch default 主题 —— 搜索区折叠组件
 *
 * 折叠/展开搜索表单，支持受控 isExpanded 与内部状态。
 */
import { ref, onMounted } from "vue";
import { ArrowDown } from "@element-plus/icons-vue";

defineOptions({ name: "ReSearch", inheritAttrs: true });

const props = withDefaults(
  defineProps<{
    /** 是否默认展开 */
    isExpanded?: boolean;
    /** 是否显示搜索区（整体显隐） */
    showSearch?: boolean;
  }>(),
  { isExpanded: false, showSearch: true },
);

const showExpanded = ref(false);

const toggleExpanded = () => {
  showExpanded.value = !showExpanded.value;
};

onMounted(() => {
  if (props.isExpanded !== undefined) {
    showExpanded.value = props.isExpanded;
  }
});
</script>

<template>
  <transition name="el-zoom-in-bottom">
    <div v-show="showSearch" class="re-search">
      <div class="re-search__trigger" @click="toggleExpanded">
        <el-icon :size="14" :class="{ 'is-expanded': showExpanded }"><ArrowDown /></el-icon>
        <span class="re-search__label">搜索</span>
      </div>
      <el-collapse-transition>
        <slot v-if="showExpanded" />
      </el-collapse-transition>
    </div>
  </transition>
</template>

<style scoped lang="scss">
.re-search {
  margin: 5px 6px 0;
  padding: 12px 20px 0;
  overflow: hidden;
  color: var(--el-text-color-primary);
  background-color: var(--el-bg-color-overlay);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
}

.re-search__trigger {
  display: flex;
  align-items: center;
  padding-bottom: 12px;
  cursor: pointer;
  transition: color 0.5s ease-in-out;
  color: var(--el-color-primary);

  .el-icon {
    transition: transform 0.5s ease-in-out;

    &.is-expanded {
      transform: rotate(180deg);
    }
  }
}

.re-search__label {
  margin-left: 6px;
  font-size: 15px;
  user-select: none;
}
</style>
