<template>
  <div class="system-stats-grid" :style="gridStyle">
    <button
      v-for="item in items"
      :key="item.key"
      type="button"
      class="system-stats-grid__item"
      :class="{
        'is-active': item.active,
        'is-clickable': item.clickable !== false,
      }"
      :disabled="item.clickable === false"
      @click="handleSelect(item)"
    >
      <ScCard
        class="system-stats-grid__card"
        layout="stats-simple"
        :icon="item.icon"
        :value="item.value"
        :label="item.label"
        :theme="item.theme || 'primary'"
        :hoverable="item.clickable !== false"
      />
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import ScCard from "@repo/components/ScCard";

export type SystemStatsCardItem = {
  key: string;
  label: string;
  value: string | number;
  icon: string;
  theme?: "default" | "primary" | "success" | "warning" | "danger" | "info";
  active?: boolean;
  clickable?: boolean;
};

const props = withDefaults(
  defineProps<{
    items: SystemStatsCardItem[];
    columns?: number;
  }>(),
  {
    columns: 4,
  },
);

const emit = defineEmits<{
  (e: "select", item: SystemStatsCardItem): void;
}>();

const gridStyle = computed(() => ({
  "--system-stats-columns": String(Math.max(props.columns, 1)),
}));

const handleSelect = (item: SystemStatsCardItem) => {
  if (item.clickable === false) {
    return;
  }
  emit("select", item);
};
</script>

<style scoped lang="scss">
.system-stats-grid {
  display: grid;
  grid-template-columns: repeat(var(--system-stats-columns), minmax(0, 1fr));
  gap: 16px;
}

.system-stats-grid__item {
  position: relative;
  display: block;
  width: 100%;
  padding: 0;
  text-align: left;
  cursor: default;
  background: transparent;
  border: 0;
  border-radius: 18px;
  outline: none;

  &.is-clickable {
    cursor: pointer;
  }

  &.is-active::after {
    position: absolute;
    right: 18px;
    bottom: 0;
    left: 18px;
    height: 3px;
    content: "";
    background: linear-gradient(90deg, var(--el-color-primary), #60a5fa);
    border-radius: 999px;
  }

  &:disabled {
    cursor: default;
  }
}

.system-stats-grid__card {
  width: 100%;
  height: 100%;
}

.system-stats-grid__item :deep(.sc-card-stats-simple) {
  height: 100%;
  min-height: 108px;
  border-color: rgba(206, 218, 233, 0.92);
  box-shadow: 0 20px 34px -34px rgb(15 23 42 / 28%);
}

.system-stats-grid__item.is-clickable:hover :deep(.sc-card-stats-simple) {
  border-color: rgba(148, 163, 184, 0.7);
}

.system-stats-grid__item.is-active :deep(.sc-card-stats-simple) {
  background: linear-gradient(180deg, #fff, #f5f9ff);
  border-color: rgba(59, 130, 246, 0.46);
  box-shadow: 0 26px 44px -34px rgb(59 130 246 / 32%);
}

@media (width <= 1280px) {
  .system-stats-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (width <= 768px) {
  .system-stats-grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .system-stats-grid__item :deep(.sc-card-stats-simple) {
    min-height: 96px;
  }
}
</style>
