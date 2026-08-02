<template>
  <div class="re-timeline" :class="[`re-timeline--${mode}`, `re-timeline--${size}`]">
    <div
      v-for="(item, index) in items"
      :key="item.id ?? index"
      class="re-timeline__item"
      :class="{ 're-timeline__item--active': activeIndex === index }"
      @click="$emit('item-click', item, index)"
    >
      <div class="re-timeline__dot-wrapper">
        <div
          class="re-timeline__dot"
          :style="item.dotColor ? { backgroundColor: item.dotColor } : {}"
          :class="item.dotType ? `re-timeline__dot--${item.dotType}` : ''"
        />
        <div v-if="showLine && index < items.length - 1" class="re-timeline__line" />
      </div>

      <div class="re-timeline__content">
        <div class="re-timeline__header">
          <slot name="title" :item="item" :index="index">
            <span class="re-timeline__title">{{ item.title }}</span>
          </slot>
          <slot name="extra" :item="item" :index="index">
            <span v-if="item.time" class="re-timeline__time">{{ item.time }}</span>
          </slot>
        </div>

        <slot name="description" :item="item" :index="index">
          <p v-if="item.description" class="re-timeline__description">{{ item.description }}</p>
        </slot>

        <slot name="content" :item="item" :index="index" />
      </div>
    </div>

    <div v-if="!items.length" class="re-timeline__empty">
      <slot name="empty">
        <span class="re-timeline__empty-text">暂无数据</span>
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
export interface ReTimelineItem {
  id?: string | number;
  title: string;
  description?: string;
  time?: string;
  dotColor?: string;
  dotType?: "primary" | "success" | "warning" | "danger" | "info" | "hollow";
}

interface Props {
  items: ReTimelineItem[];
  activeIndex?: number;
  mode?: "left" | "right" | "alternate";
  size?: "small" | "default" | "large";
  showLine?: boolean;
}

withDefaults(defineProps<Props>(), {
  items: () => [],
  activeIndex: -1,
  mode: "left",
  size: "default",
  showLine: true,
});

defineEmits<{
  (e: "item-click", item: ReTimelineItem, index: number): void;
}>();
</script>

<style scoped>
.re-timeline {
  display: flex;
  flex-direction: column;
  gap: 0;
  color: var(--el-text-color-primary);
}

.re-timeline__item {
  display: flex;
  gap: 16px;
  padding: 8px 0;
  cursor: default;
  transition: background 0.15s;
  border-radius: 6px;
  padding-left: 8px;
  padding-right: 8px;
}

.re-timeline__item:hover {
  background: var(--el-fill-color-light);
}

.re-timeline__item--active {
  background: var(--el-color-primary-light-9);
}

.re-timeline__dot-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
  width: 12px;
}

.re-timeline__dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--el-color-primary);
  flex-shrink: 0;
  margin-top: 5px;
}

.re-timeline__dot--success {
  background: var(--el-color-success);
}

.re-timeline__dot--warning {
  background: var(--el-color-warning);
}

.re-timeline__dot--danger {
  background: var(--el-color-danger);
}

.re-timeline__dot--info {
  background: var(--el-color-info);
}

.re-timeline__dot--hollow {
  background: transparent;
  border: 2px solid var(--el-color-primary);
}

.re-timeline__dot--hollow.re-timeline__dot--success {
  border-color: var(--el-color-success);
}

.re-timeline__dot--hollow.re-timeline__dot--warning {
  border-color: var(--el-color-warning);
}

.re-timeline__dot--hollow.re-timeline__dot--danger {
  border-color: var(--el-color-danger);
}

.re-timeline__dot--hollow.re-timeline__dot--info {
  border-color: var(--el-color-info);
}

.re-timeline__line {
  width: 2px;
  flex: 1;
  min-height: 24px;
  background: var(--el-border-color-light);
}

.re-timeline__content {
  flex: 1;
  min-width: 0;
  padding-bottom: 16px;
}

.re-timeline__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 4px;
}

.re-timeline__title {
  font-size: 14px;
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.re-timeline__time {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
}

.re-timeline__description {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  line-height: 1.5;
  margin: 0;
}

.re-timeline__empty {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px 16px;
}

.re-timeline__empty-text {
  color: var(--el-text-color-placeholder);
  font-size: 14px;
}

.re-timeline--small .re-timeline__item {
  padding: 4px 8px;
}

.re-timeline--small .re-timeline__title {
  font-size: 13px;
}

.re-timeline--small .re-timeline__description {
  font-size: 12px;
}

.re-timeline--large .re-timeline__item {
  padding: 12px 8px;
}

.re-timeline--large .re-timeline__title {
  font-size: 15px;
}

.re-timeline--right .re-timeline__item {
  flex-direction: row-reverse;
}

.re-timeline--right .re-timeline__header {
  flex-direction: row-reverse;
}

.re-timeline--alternate .re-timeline__item:nth-child(even) {
  flex-direction: row-reverse;
}

.re-timeline--alternate .re-timeline__item:nth-child(even) .re-timeline__header {
  flex-direction: row-reverse;
}
</style>
