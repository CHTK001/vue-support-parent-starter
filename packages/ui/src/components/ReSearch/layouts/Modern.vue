<script setup lang="ts">
/**
 * ReSearch Modern 布局 —— 搜索区折叠组件
 *
 * 相比 default/koi 主题：
 *   - 更大的圆角与更柔和的阴影
 *   - 使用 --rm-* 设计令牌，保持现代化扁平风格
 *   - 触发栏采用胶囊形状，hover 态更明显
 */
import { ref, onMounted } from "vue";
import { ArrowDown } from "@element-plus/icons-vue";
import "../../shared/modern-vars.css";

defineOptions({ name: "ReSearchModern", inheritAttrs: true });

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
    <div v-show="showSearch" class="re-search re-search--modern">
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
.re-search--modern {
  margin: 0;
  padding: 16px 20px 4px;
  overflow: hidden;
  color: var(--rm-text);
  background: var(--rm-bg);
  border: 1px solid var(--rm-border-light);
  border-radius: var(--rm-radius-lg);
  box-shadow: var(--rm-shadow-sm);
}

.re-search__trigger {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  margin-bottom: 12px;
  cursor: pointer;
  border-radius: var(--rm-radius-pill);
  color: var(--rm-primary);
  background: var(--rm-primary-light-9);
  font-size: var(--rm-font-sm);
  font-weight: 600;
  user-select: none;
  transition: background var(--rm-transition), color var(--rm-transition);

  &:hover {
    background: var(--rm-primary);
    color: #fff;
  }

  .el-icon {
    transition: transform var(--rm-transition);

    &.is-expanded {
      transform: rotate(180deg);
    }
  }
}

.re-search__label {
  margin-left: 2px;
}
</style>
