<template>
  <div class="timeline-card">
    <div class="timeline-card__line"></div>
    <div class="timeline-card__items">
      <div
        v-for="(item, index) in items"
        :key="index"
        class="timeline-card__item"
        :class="{ 'is-active': index === activeIndex }"
      >
        <div
          class="timeline-card__dot"
          :style="{ background: item.color || 'var(--el-color-primary)' }"
        >
          <IconifyIconOnline v-if="item.icon" :icon="item.icon" />
        </div>
        <div class="timeline-card__content">
          <div class="timeline-card__header">
            <h4 class="timeline-card__title">{{ item.title }}</h4>
            <span class="timeline-card__time">{{ item.time }}</span>
          </div>
          <p class="timeline-card__description">{{ item.description }}</p>
          <div v-if="item.tags" class="timeline-card__tags">
            <ScTag 
              v-for="(tag, tagIndex) in item.tags"
              :key="tagIndex"
              size="small"
              :type="tag.type || 'info'"
            >
              {{ tag.label || tag }}
            </ScTag>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface TimelineItem {
  title: string;
  description?: string;
  time?: string;
  icon?: string;
  color?: string;
  tags?: Array<string | { label: string; type?: string }>;
}

interface Props {
  items?: TimelineItem[];
  activeIndex?: number;
}

withDefaults(defineProps<Props>(), {
  items: () => [],
  activeIndex: -1,
});
</script>

<style lang="scss" scoped>
.timeline-card {
  position: relative;
  padding: 24px;
  background: var(--el-bg-color-overlay);
  border-radius: 16px;
  border: 1px solid var(--el-border-color-lighter);

  &__line {
    position: absolute;
    left: 56px;
    top: 60px;
    bottom: 60px;
    width: 2px;
    background: linear-gradient(
      to bottom,
      var(--el-color-primary-light-5),
      var(--el-color-primary-light-7)
    );
  }

  &__items {
    position: relative;
  }

  &__item {
    position: relative;
    display: flex;
    gap: 20px;
    padding: 16px 0;
    transition: all 0.3s ease;

    &:not(:last-child) {
      margin-bottom: 24px;
    }

    &.is-active {
      .timeline-card__dot {
        transform: scale(1.3);
        box-shadow: 0 0 0 6px rgba(var(--el-color-primary-rgb), 0.2);
      }

      .timeline-card__content {
        background: var(--el-color-primary-light-9);
        border-color: var(--el-color-primary-light-5);
      }
    }
  }

  &__dot {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    color: white;
    flex-shrink: 0;
    transition: all 0.3s ease;
    position: relative;
    z-index: 2;
  }

  &__content {
    flex: 1;
    padding: 16px 20px;
    background: var(--el-fill-color-blank);
    border-radius: 12px;
    border: 1px solid var(--el-border-color-lighter);
    transition: all 0.3s ease;
  }

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  }

  &__title {
    font-size: 16px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    margin: 0;
  }

  &__time {
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }

  &__description {
    font-size: 14px;
    color: var(--el-text-color-regular);
    line-height: 1.6;
    margin: 0 0 12px 0;
  }

  &__tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
}
</style>
