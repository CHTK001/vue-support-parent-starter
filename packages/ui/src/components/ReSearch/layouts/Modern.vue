<script setup lang="ts">
/**
 * ReSearch Modern 布局 —— 搜索区折叠组件
 *
 * 相比 default/koi 主题：
 *   - 更大的圆角与更柔和的阴影
 *   - 使用 --rm-* 设计令牌，保持现代化扁平风格
 *   - 触发栏采用胶囊形状，hover 态更明显
 *
 * 支持属性：
 *   - bordered: 是否显示边框（默认 true，modern 风格保留边框）
 *   - mode: 检索模式 1=紧凑, 2=表单
 *   - showLabel: 是否显示按钮文字（默认 false）
 *   - tooltipText: 按钮 tooltip 文字
 */
import { ref, onMounted, computed, useSlots } from "vue";
import { ArrowDown } from "@element-plus/icons-vue";
import "../../shared/modern-vars.css";

const slots = useSlots();

defineOptions({ name: "ReSearchModern", inheritAttrs: true });

const props = withDefaults(
  defineProps<{
    isExpanded?: boolean;
    showSearch?: boolean;
    bordered?: boolean;
    mode?: 1 | 2;
    showLabel?: boolean;
    tooltipText?: string;
  }>(),
  {
    isExpanded: false,
    showSearch: true,
    bordered: true,
    mode: 1,
    showLabel: false,
    tooltipText: "搜索",
  },
);

const showExpanded = ref(false);

const toggleExpanded = () => {
  showExpanded.value = !showExpanded.value;
};

const tooltipContent = computed(() => showExpanded.value ? "收起" : "展开");

const triggerIconClass = computed(() => ({
  "is-expanded": showExpanded.value,
}));

onMounted(() => {
  if (props.isExpanded !== undefined) {
    showExpanded.value = props.isExpanded;
  }
});

const labelWidth = "100px";
</script>

<template>
  <transition name="el-zoom-in-bottom">
    <div
      v-show="showSearch"
      :class="[
        're-search',
        're-search--modern',
        { 're-search--no-border': !bordered },
        { 're-search--form': mode === 2 },
      ]"
      :style="mode === 2 ? { '--label-width': labelWidth } : {}"
    >
      <div class="re-search__content">
        <slot />
      </div>
      <div class="re-search__footer">
        <div class="re-search__spacer" />
        <el-tooltip :content="tooltipContent" placement="left" :show-after="100" popper-class="re-search__tooltip">
          <div
            class="re-search__trigger"
            @click="toggleExpanded"
            :class="{ 're-search__trigger--label': showLabel }"
          >
            <slot name="action">
              <el-icon :size="14" :class="triggerIconClass">
                <ArrowDown />
              </el-icon>
              <span v-if="showLabel" class="re-search__label">
                {{ tooltipContent }}
              </span>
            </slot>
          </div>
        </el-tooltip>
      </div>
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
  border-radius: var(--rm-radius-lg);
  box-shadow: var(--rm-shadow-sm);
  transition: border-color var(--rm-transition);
}

.re-search--modern {
  border: 1px solid var(--rm-border-light);
}

.re-search--no-border {
  border: none;
  box-shadow: none;
}

.re-search--form {
  .re-search__content {
    :deep(> *) {
      display: grid;
      grid-template-columns: var(--label-width) 1fr;
      align-items: center;
      gap: 12px;
      padding: 4px 0;
    }
  }
}

.re-search__content {
  padding: 0 0 8px;
}

.re-search__footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 4px 0 8px;
}

.re-search__spacer {
  flex: 1;
}

.re-search__trigger {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  cursor: pointer;
  border-radius: var(--rm-radius-pill);
  color: var(--rm-primary);
  background: var(--rm-primary-light-9);
  font-size: var(--rm-font-sm);
  font-weight: 600;
  user-select: none;
  white-space: nowrap;
  transition: background var(--rm-transition), color var(--rm-transition);

  &:hover {
    background: var(--rm-primary);
    color: var(--rm-text-white);
  }

  .el-icon {
    transition: transform var(--rm-transition);

    &.is-expanded {
      transform: rotate(180deg);
    }
  }
}

.re-search__trigger--label {
  padding: 6px 18px;
}

.re-search__label {
  margin-left: 2px;
}

.re-search__tooltip {
  font-size: 12px;
}
</style>
