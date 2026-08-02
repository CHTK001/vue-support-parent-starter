<template>
  <div class="re-timeline" :class="`re-timeline--${placement}`">
    <div
      v-for="(item, index) in data"
      :key="item.id"
      class="re-timeline-item"
      :class="{ 're-timeline-item--active': activeKey === item.id }"
      @click="$emit('item-click', { item, index, timeline: data })"
    >
      <div class="re-timeline-item__dot-container">
        <div
          class="re-timeline-item__dot"
          :class="[
            `re-timeline-item__dot--${item.dotType || 'solid'}`,
            { 're-timeline-item__dot--custom-color': !!item.color },
          ]"
          :style="item.color ? { borderColor: item.color, backgroundColor: item.color } : undefined"
        >
          <slot name="dot" :item="item" :index="index">
            <span v-if="item.icon" class="re-timeline-item__dot-icon">
              <component :is="item.icon" />
            </span>
          </slot>
        </div>
        <div
          v-if="index < data.length - 1"
          class="re-timeline-item__line"
          :style="item.color ? { backgroundColor: item.color } : undefined"
        />
      </div>

      <div class="re-timeline-item__content">
        <div class="re-timeline-item__header">
          <div class="re-timeline-item__title">
            <slot name="title" :item="item" :index="index">
              {{ item.title }}
            </slot>
          </div>
          <div
            v-if="item.time || $slots.time"
            class="re-timeline-item__time"
          >
            <slot name="time" :item="item" :index="index">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: middle; margin-right: 4px;"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
              {{ item.time }}
            </slot>
          </div>
        </div>
        <div
          v-if="item.description || $slots.description"
          class="re-timeline-item__description"
        >
          <slot name="description" :item="item" :index="index">
            {{ item.description }}
          </slot>
        </div>
        <div v-if="$slots.default" class="re-timeline-item__extra">
          <slot :item="item" :index="index" />
        </div>
      </div>
    </div>

    <div v-if="!data.length" class="re-timeline__empty">
      <slot name="empty">
        <span class="re-timeline__empty-text">暂无时间线数据</span>
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ReTimelineItem } from "./types";

withDefaults(
  defineProps<{
    data: ReTimelineItem[];
    placement?: "left" | "right" | "alternate";
    activeKey?: string | number | null;
  }>(),
  {
    data: () => [],
    placement: "left",
    activeKey: null,
  },
);

defineEmits<{
  (e: "item-click", payload: { item: ReTimelineItem; index: number; timeline: ReTimelineItem[] }): void;
}>();
</script>

<style scoped>
.re-timeline {
  position: relative;
  padding: 8px 0;
}

.re-timeline-item {
  display: flex;
  gap: 16px;
  padding-bottom: 24px;
  position: relative;
  cursor: pointer;
  transition: opacity 0.15s;
}

.re-timeline-item:last-child {
  padding-bottom: 0;
}

.re-timeline-item:hover {
  opacity: 0.85;
}

.re-timeline-item--active .re-timeline-item__title {
  font-weight: 600;
}

/* Dot */
.re-timeline-item__dot-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
  width: 20px;
}

.re-timeline-item__dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
  z-index: 1;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: content-box;
}

.re-timeline-item__dot--solid {
  background-color: var(--el-color-primary);
  border: 2px solid var(--el-color-primary);
}

.re-timeline-item__dot--hollow {
  background-color: var(--el-bg-color);
  border: 2px solid var(--el-color-primary);
}

.re-timeline-item__dot--outline {
  background-color: transparent;
  border: 2px solid var(--el-color-primary);
  width: 10px;
  height: 10px;
}

.re-timeline-item__dot--custom-color {
  border-color: var(--dot-color, var(--el-color-primary));
  background-color: var(--dot-color, var(--el-color-primary));
}

.re-timeline-item__dot-icon {
  font-size: 12px;
  color: inherit;
}

/* Line */
.re-timeline-item__line {
  width: 2px;
  flex: 1;
  background-color: var(--el-border-color-lighter);
  min-height: 24px;
}

/* Content */
.re-timeline-item__content {
  flex: 1;
  min-width: 0;
  padding-bottom: 4px;
}

.re-timeline-item__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 4px;
}

.re-timeline-item__title {
  font-size: 14px;
  font-weight: 500;
  color: var(--el-text-color-primary);
  line-height: 1.4;
}

.re-timeline-item__time {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
  flex-shrink: 0;
  display: flex;
  align-items: center;
}

.re-timeline-item__description {
  font-size: 13px;
  color: var(--el-text-color-regular);
  line-height: 1.5;
  margin-top: 2px;
}

.re-timeline-item__extra {
  margin-top: 8px;
}

/* Empty */
.re-timeline__empty {
  padding: 32px 0;
  text-align: center;
}

.re-timeline__empty-text {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}
</style>
