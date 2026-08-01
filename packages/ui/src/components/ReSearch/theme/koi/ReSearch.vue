<script setup lang="ts">
/**
 * ReSearch koi 主题 —— 搜索区折叠组件（KoiSearch 移植）
 *
 * 样式走主题令牌（--theme-* 变量），与 default 保持相同 API。
 */
import { ref, onMounted } from "vue";
import { ArrowDown } from "@element-plus/icons-vue";

defineOptions({ name: "ReSearch", inheritAttrs: true });

const props = withDefaults(
  defineProps<{
    isExpanded?: boolean;
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
    <div v-show="showSearch" class="koi-search">
      <div class="koi-search__trigger" @click="toggleExpanded">
        <el-icon :size="14" :class="{ 'is-expanded': showExpanded }"><ArrowDown /></el-icon>
        <span class="koi-search__label">搜索</span>
      </div>
      <el-collapse-transition>
        <slot v-if="showExpanded" />
      </el-collapse-transition>
    </div>
  </transition>
</template>

<style scoped lang="scss">
.koi-search {
  margin: 5px 6px 0;
  padding: 12px 20px 0;
  overflow: hidden;
  color: var(--theme-color-text, #303133);
  background-color: var(--theme-color-bg-container, #ffffff);
  border: 1px solid var(--theme-color-border, #e5e7ed);
  border-radius: 8px;
}

.koi-search__trigger {
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

.koi-search__label {
  margin-left: 6px;
  font-size: 15px;
  user-select: none;
}
</style>
