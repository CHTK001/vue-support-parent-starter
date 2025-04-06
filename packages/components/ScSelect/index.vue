<template>
  <div class="card-selector-container">
    <div 
      class="card-selector-grid" 
      :class="[`layout-${layout}`]"
      :style="gridStyle"
    >
      <div
        v-for="item in options"
        :key="item.value"
        class="card-selector-item"
        :class="{ active: isSelected(item.value) }"
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
    type: [String, Number, Array],
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
  // 布局类型
  layout: {
    type: String,
    default: "card",
    validator: (value: string) => {
      return ["card", "list", "compact", "grid"].includes(value);
    }
  },
  // 是否多选
  multiple: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(["update:modelValue", "change"]);

// 计算网格样式
const gridStyle = computed(() => {
  return {
    gridTemplateColumns: `repeat(${props.columns}, 1fr)`,
    gap: `${props.gap}px`,
  };
});

// 判断选项是否被选中
const isSelected = (value: string | number) => {
  if (props.multiple) {
    // 多选模式下，检查值是否在数组中
    return Array.isArray(props.modelValue) && props.modelValue.includes(value);
  } else {
    // 单选模式下，直接比较值
    return props.modelValue === value;
  }
};

// 选择卡片
const handleSelect = (value: string | number) => {
  if (props.multiple) {
    // 多选模式
    let newValue: (string | number)[] = [];
    
    if (Array.isArray(props.modelValue)) {
      // 如果已经是数组，复制一份
      //@ts-ignore
      newValue = [...props.modelValue];
      
      // 切换选中状态：如果已选中则移除，否则添加
      const index = newValue.indexOf(value);
      if (index > -1) {
        newValue.splice(index, 1);
      } else {
        newValue.push(value);
      }
    } else {
      // 如果不是数组，创建一个新数组并添加当前值
      newValue = [value];
    }
    
    emit("update:modelValue", newValue);
    emit("change", newValue);
  } else {
    // 单选模式
    emit("update:modelValue", value);
    emit("change", value);
  }
};
</script>

<style lang="scss" scoped>
.card-selector-container {
  width: 100%;

  .card-selector-grid {
    display: grid;
    width: 100%;

    // 默认卡片布局（与layout-card相同）
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
         border-top: 4px solid var(--el-color-primary);
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

    // 列表布局
    &.layout-list {
      .card-selector-item {
        flex-direction: row;
        justify-content: flex-start;
        height: 60px;
        padding: 8px 16px;
        border-radius: 6px;
        margin-bottom: 8px;
        
        .card-icon {
          font-size: 24px;
          margin-right: 12px;
          margin-bottom: 0;
        }
        
        .card-label {
          font-size: 15px;
          text-align: left;
        }
      }
    }
    
    // 紧凑布局
    &.layout-compact {
      .card-selector-item {
        height: 70px;
        padding: 12px 6px;
        
        .card-icon {
          font-size: 22px;
          margin-bottom: 8px;
        }
        
        .card-label {
          font-size: 13px;
        }
      }
    }
    
    // 网格布局
    &.layout-grid {
      .card-selector-item {
        border-radius: 4px;
        height: 100px;
        
        .card-icon {
          font-size: 32px;
          margin-bottom: 16px;
        }
        
        &.active {
          background-color: var(--el-color-primary);
          color: white;
          
          .card-icon {
            color: white;
          }
        }
      }
    }
  }

  /* 响应式布局 */
  @media screen and (max-width: 768px) {
    .card-selector-grid {
      grid-template-columns: repeat(2, 1fr) !important;
      
      &.layout-list {
        grid-template-columns: 1fr !important;
      }
    }
  }
}
</style>