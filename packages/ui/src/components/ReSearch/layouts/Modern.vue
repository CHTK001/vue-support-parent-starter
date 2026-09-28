<script setup lang="ts">
/**
 * ReSearch Modern 布局 —— 现代化搜索折叠组件
 *
 * 使用 --rs-* 设计令牌，胶囊触发按钮带浮起阴影，
 * 展开时容器加深边框色。
 */
import { ref, onMounted, computed, type CSSProperties } from "vue";
import { ArrowDown, Plus } from "@element-plus/icons-vue";
import "../shared/research-vars.css";

defineOptions({ name: "ReSearchModern", inheritAttrs: true });

const props = withDefaults(
  defineProps<{
    isExpanded?: boolean;
    showSearch?: boolean;
    bordered?: boolean;
    mode?: 1 | 2;
    showLabel?: boolean;
    tooltipText?: string;
    padding?: string;
    addButton?: boolean;
    addText?: string;
  }>(),
  {
    isExpanded: false,
    showSearch: true,
    bordered: true,
    mode: 1,
    showLabel: false,
    tooltipText: "搜索",
    padding: "16px 20px 6px",
    addButton: true,
    addText: "新增",
  },
);

const emit = defineEmits<{
  (e: "add"): void;
}>();

const showExpanded = ref(false);

const toggleExpanded = () => {
  showExpanded.value = !showExpanded.value;
};

const handleAdd = () => {
  emit("add");
};

const tooltipContent = computed(() => (showExpanded.value ? "收起" : props.tooltipText));

const triggerIconClass = computed(() => ({
  "koi-search__icon--expanded": showExpanded.value,
}));

const containerStyle = computed<CSSProperties>(() => {
  const base: CSSProperties = { padding: props.padding };
  if (props.mode === 2) base["--label-width"] = "100px";
  return base;
});

onMounted(() => {
  if (props.isExpanded !== undefined) {
    showExpanded.value = props.isExpanded;
  }
});
</script>

<template>
  <transition name="re-search-collapse">
    <div
      v-show="showSearch"
      class="re-search re-search--modern"
      :class="{
        're-search--no-border': !bordered,
        're-search--expanded': showExpanded,
        're-search--form': mode === 2,
      }"
      :style="containerStyle"
    >
      <div class="re-search__divider" />

      <el-collapse-transition>
        <div
          v-if="showExpanded"
          class="re-search__content"
          :class="{ 're-search__content--form': mode === 2 }"
        >
          <slot />
        </div>
      </el-collapse-transition>

      <div class="re-search__footer">
        <div class="re-search__footer-left">
          <slot name="footer" />
        </div>
        <el-button
          v-if="addButton"
          class="re-search__add-btn"
          type="primary"
          :icon="Plus"

          @click="handleAdd"
        >
          {{ addText }}
        </el-button>
        <div class="re-search__spacer" />
        <el-tooltip
          :content="tooltipContent"
          placement="top"
          :show-after="100"
          popper-class="re-search__tooltip"
        >
          <div
            class="re-search__trigger"
            :class="{ 're-search__trigger--label': showLabel }"
            @click="toggleExpanded"
            role="button"
            :aria-expanded="showExpanded"
            :aria-label="tooltipContent"
            tabindex="0"
            @keydown.enter.prevent="toggleExpanded"
            @keydown.space.prevent="toggleExpanded"
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
  overflow: hidden;
  color: var(--rs-text);
  background: var(--rs-bg-card);
  border-radius: var(--rs-radius-lg);
  border: 1px solid var(--rs-border);
  box-shadow: var(--rs-shadow-xs);
  transition: border-color var(--rs-transition), box-shadow var(--rs-transition);
}

.re-search--no-border {
  border: none;
  box-shadow: none;
}

.re-search--modern.re-search--expanded {
  border-color: var(--rs-border-hover);
  box-shadow: var(--rs-shadow-sm);
}

.re-search--form {
  .re-search__content--form :deep(> *) {
    display: grid;
    grid-template-columns: var(--label-width) 1fr;
    align-items: center;
    gap: 12px;
    padding: 5px 4px;
  }
}

.re-search__divider {
  position: absolute;
  left: 20px;
  right: 20px;
  bottom: 48px;
  height: 1px;
  background: var(--rs-border);
  opacity: 0;
  transform: scaleY(0);
  transform-origin: center;
  transition: opacity 0.25s ease, transform 0.3s ease;
}

.re-search--expanded .re-search__divider {
  opacity: 1;
  transform: scaleY(1);
}

.re-search__content {
  padding: 0 2px 12px;
}

.re-search__footer {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 0 2px;
}

.re-search__footer-left {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.re-search__add-btn {
  flex-shrink: 0;
  margin-left: 4px;
}

.re-search__spacer {
  flex: 1;
}

.re-search__trigger {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 12px;
  cursor: pointer;
  border-radius: var(--rs-radius-full);
  color: var(--rs-primary);
  background: var(--rs-primary-tint);
  font-size: var(--rs-font-sm);
  font-weight: 600;
  user-select: none;
  white-space: nowrap;
  border: 1px solid transparent;
  transition:
    background var(--rs-transition),
    color var(--rs-transition),
    border-color var(--rs-transition),
    box-shadow var(--rs-transition),
    transform var(--rs-transition);

  .koi-search__icon--expanded {
    transform: rotate(180deg);
  }

  &:hover {
    background: var(--rs-primary);
    color: #ffffff;
    border-color: var(--rs-primary);
  }

  &:active {
    background: var(--rs-primary-hover, var(--rs-primary));
    color: #ffffff;
  }

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--rs-primary) 20%, transparent);
  }
}

.re-search__trigger--label {
  padding: 5px 16px;
  font-size: var(--rs-font);
}

.re-search__label {
  font-size: var(--rs-font-sm);
}

.re-search__tooltip {
  font-size: 12px;
}

.re-search-collapse-enter-active,
.re-search-collapse-leave-active {
  transition: transform 0.28s cubic-bezier(0.4, 0, 0.2, 1),
             opacity 0.2s ease;
}

.re-search-collapse-enter-from {
  transform: translateY(-6px);
  opacity: 0;
}

.re-search-collapse-leave-to {
  transform: translateY(-4px);
  opacity: 0;
}
</style>
