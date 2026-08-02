<template>
  <nav class="re-breadcrumb" :class="[`re-breadcrumb--${size}`, `re-breadcrumb--${separator}`]" :aria-label="ariaLabel">
    <ol class="re-breadcrumb__list">
      <li
        v-for="(item, index) in items"
        :key="item.key ?? index"
        class="re-breadcrumb__item"
        :class="{ 'is-active': isLast(index) }"
      >
        <a
          v-if="!isLast(index) && item.href"
          class="re-breadcrumb__link"
          :href="item.href"
          @click.prevent="handleClick(item, index, $event)"
        >
          <slot name="item" :item="item" :index="index" :isLast="isLast(index)">
            <el-icon v-if="item.icon" class="re-breadcrumb__icon">
              <component :is="item.icon" />
            </el-icon>
            <span class="re-breadcrumb__label">{{ item.label }}</span>
          </slot>
        </a>
        <span
          v-else
          class="re-breadcrumb__text"
          :aria-current="isLast(index) ? 'page' : undefined"
        >
          <slot name="item" :item="item" :index="index" :isLast="isLast(index)">
            <el-icon v-if="item.icon" class="re-breadcrumb__icon">
              <component :is="item.icon" />
            </el-icon>
            <span class="re-breadcrumb__label">{{ item.label }}</span>
          </slot>
        </span>
        <span v-if="!isLast(index)" class="re-breadcrumb__separator" aria-hidden="true">
          <slot name="separator" :separator="getSeparator(index)">
            {{ getSeparator(index) }}
          </slot>
        </span>
      </li>
    </ol>
  </nav>
</template>

<script setup lang="ts">
/**
 * ReBreadcrumb —— 面包屑导航组件
 *
 * 支持自定义分隔符、图标、跳转
 *   <ReBreadcrumb :items="[{ label: '首页', href: '/' }, { label: '详情' }]" />
 */
import { ElIcon } from "element-plus";

interface Props {
  /** 面包屑项 */
  items: BreadcrumbItem[];
  /** 自定义分隔符 */
  separator?: string | (() => string);
  /** 尺寸 */
  size?: "small" | "default" | "large";
  /** a11y 标签 */
  ariaLabel?: string;
  /** 是否使用 Element Plus 风格（更大间距） */
  block?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  separator: "/",
  size: "default",
  ariaLabel: "Breadcrumb",
  block: false,
});

const emit = defineEmits<{
  (e: "click", item: BreadcrumbItem, index: number, event: MouseEvent): void;
}>();

const isLast = (index: number): boolean => index === props.items.length - 1;

const getSeparator = (index: number): string => {
  if (typeof props.separator === "function") return props.separator();
  return props.separator;
};

const handleClick = (item: BreadcrumbItem, index: number, event: MouseEvent) => {
  if (item.disabled) {
    event.preventDefault();
    return;
  }
  emit("click", item, index, event);
  if (item.to) {
    // 简化处理：to 对象支持 Vue Router 风格（但不在此组件内强制依赖）
    if (typeof item.to === "string") {
      window.history.pushState({}, "", item.to);
    }
  }
};
</script>

<style scoped>
.re-breadcrumb {
  display: flex;
  align-items: center;
  font-size: 14px;
  color: var(--el-text-color-regular);
  line-height: 1.5;
}

.re-breadcrumb__list {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  list-style: none;
  margin: 0;
  padding: 0;
}

.re-breadcrumb__item {
  display: flex;
  align-items: center;
}

.re-breadcrumb__item + .re-breadcrumb__item {
  margin-left: 8px;
}

.re-breadcrumb--large .re-breadcrumb__item + .re-breadcrumb__item {
  margin-left: 12px;
}

.re-breadcrumb--small .re-breadcrumb__item + .re-breadcrumb__item {
  margin-left: 4px;
}

.re-breadcrumb__link,
.re-breadcrumb__text {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  text-decoration: none;
  color: var(--el-text-color-regular);
  transition: color 0.2s;
}

.re-breadcrumb__link:hover {
  color: var(--el-color-primary);
}

.re-breadcrumb__item.is-active .re-breadcrumb__text {
  color: var(--el-text-color-primary);
  font-weight: 500;
}

.re-breadcrumb__icon {
  font-size: 14px;
  flex-shrink: 0;
}

.re-breadcrumb__separator {
  margin: 0 8px;
  color: var(--el-text-color-placeholder);
  user-select: none;
}

.re-breadcrumb--large .re-breadcrumb__separator {
  margin: 0 12px;
}

.re-breadcrumb--small .re-breadcrumb__separator {
  margin: 0 4px;
}

.re-breadcrumb--arrow .re-breadcrumb__separator {
  margin: 0 4px;
}

.re-breadcrumb--dot .re-breadcrumb__separator {
  margin: 0 6px;
}
</style>
