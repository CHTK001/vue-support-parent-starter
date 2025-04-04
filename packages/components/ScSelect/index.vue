<template>
  <div class="card-selector-container">
    <div class="card-selector-grid" :style="gridStyle">
      <div
        v-for="item in options"
        :key="item.value"
        class="card-selector-item"
        :class="{ active: modelValue === item.value }"
        @click="handleSelect(item.value)"
      >
        <div class="card-icon">
          <IconifyIconOnline :icon="item.icon" />
        </div>
        <div class="card-label">{{ item.label }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, defineProps, defineEmits } from "vue";
import { IconifyIconOnline } from "../ReIcon";

interface CardOption {
  label: string;
  value: string | number;
  icon: string;
}

const props = defineProps({
  // v-model绑定值
  modelValue: {
    type: [String, Number],
    default: "",
  },
  // 选项数组
  options: {
    type: Array as () => CardOption[],
    required: true,
  },
  // 每行显示的卡片数量
  columns: {
    type: Number,
    default: 3,
  },
  // 卡片间距
  gap: {
    type: Number,
    default: 12,
  },
});

const emit = defineEmits(["update:modelValue", "change"]);

// 计算网格样式
const gridStyle = computed(() => {
  return {
    gridTemplateColumns: `repeat(${props.columns}, 1fr)`,
    gap: `${props.gap}px`,
  };
});

// 选择卡片
const handleSelect = (value: string | number) => {
  emit("update:modelValue", value);
  emit("change", value);
};
</script>

<style lang="scss" scoped>
.card-selector-container {
  width: 100%;

  .card-selector-grid {
    display: grid;
    width: 100%;

    .card-selector-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 16px 8px;
      border-radius: 8px;
      border: 1px solid var(--el-border-color);
      cursor: pointer;
      transition: all 0.3s ease;
      background-color: var(--el-fill-color-blank);
      height: 90px;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        border-color: var(--el-color-primary-light-5);
      }

      &.active {
        background-color: var(--el-color-primary-light-9);
        border-color: var(--el-color-primary);
        color: var(--el-color-primary);
        box-shadow: 0 0 0 2px var(--el-color-primary-light-8);
        font-weight: 500;

        .card-icon {
          transform: scale(1.1);
        }
      }

      .card-icon {
        font-size: 28px;
        margin-bottom: 12px;
        color: var(--el-color-primary);
        transition: transform 0.2s ease;
      }

      .card-label {
        font-size: 14px;
        text-align: center;
      }
    }
  }

  /* 响应式布局 */
  @media screen and (max-width: 768px) {
    .card-selector-grid {
      grid-template-columns: repeat(2, 1fr) !important;
    }
  }
}
</style>