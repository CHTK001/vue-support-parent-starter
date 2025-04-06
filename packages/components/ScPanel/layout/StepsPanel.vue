<template>
  <div
    class="steps-panel"
    :class="[
      `steps-panel--${size}`,
      `steps-panel--${theme}`,
      {
        'is-collapsed': isCollapsed,
      },
      className
    ]"
    :style="panelStyle"
  >
    <!-- 头部区域 -->
    <div
      v-if="showHeader"
      class="steps-panel__header"
      @click="handleHeaderClick"
    >
      <div class="steps-panel__title">
        <slot name="header">
          <span v-if="title">{{ title }}</span>
        </slot>
      </div>
      <div class="steps-panel__extra">
        <slot name="header-extra"></slot>
        <el-icon
          v-if="collapsible"
          class="steps-panel__collapse-icon"
          :class="{ 'is-collapsed': isCollapsed }"
        >
          <IconifyIconOnline icon="ep:arrow-down" />
        </el-icon>
      </div>
    </div>

    <!-- 内容区域 -->
    <el-collapse-transition>
      <div v-show="!isCollapsed" class="steps-panel__body">
        <div v-if="loading" class="steps-panel__loading">
          <el-icon class="loading-icon" :size="30">
            <IconifyIconOnline icon="svg-spinners:180-ring" />
          </el-icon>
          <span class="loading-text">加载中...</span>
        </div>
        <template v-else>
          <!-- 步骤显示区域 -->
          <div class="steps-panel__steps-container">
            <el-steps 
              :active="activeStep" 
              :align-center="stepsAlignCenter" 
              :space="stepsSpace" 
              :direction="stepsDirection"
              :process-status="processStatus"
              :finish-status="finishStatus"
              :simple="simpleSteps"
            >
              <el-step 
                v-for="(step, index) in steps" 
                :key="index" 
                :title="step.title"
                :description="step.description"
                :icon="step.icon"
              ></el-step>
            </el-steps>
          </div>
          
          <div class="steps-panel__steps-content">
            <slot></slot>
          </div>
          
          <!-- 步骤按钮操作区域 -->
          <div v-if="showStepButtons" class="steps-panel__steps-buttons">
            <el-button 
              v-if="activeStep > 0" 
              :size="size"
              @click="prevStep"
            >
              {{ prevButtonText }}
            </el-button>
            
            <el-button 
              v-if="activeStep < (steps.length - 1)" 
              :size="size"
              type="primary" 
              @click="nextStep"
            >
              {{ nextButtonText }}
            </el-button>
            
            <el-button 
              v-if="activeStep === (steps.length - 1) && showFinishButton" 
              :size="size"
              type="success" 
              @click="finish"
            >
              {{ finishButtonText }}
            </el-button>
          </div>
        </template>
      </div>
    </el-collapse-transition>

    <!-- 底部区域 -->
    <div v-if="showFooter && !isCollapsed" class="steps-panel__footer">
      <div class="steps-panel__footer-content">
        <slot name="footer"></slot>
      </div>
      <div class="steps-panel__footer-extra">
        <slot name="footer-extra"></slot>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { ElCollapseTransition, ElIcon, ElSteps, ElStep, ElButton } from 'element-plus';
import { IconifyIconOnline } from '@repo/components/ReIcon';
import { PanelSize, PanelTheme } from '../types';

interface StepItem {
  title: string;
  description?: string;
  icon?: string;
}

const props = defineProps({
  // 步骤列表
  steps: {
    type: Array as () => StepItem[],
    default: () => []
  },
  // 当前激活的步骤
  activeStep: {
    type: Number,
    default: 0
  },
  // 步骤是否居中对齐
  stepsAlignCenter: {
    type: Boolean,
    default: false
  },
  // 步骤条的间距
  stepsSpace: {
    type: [Number, String],
    default: ''
  },
  // 步骤条方向
  stepsDirection: {
    type: String as () => 'vertical' | 'horizontal',
    default: 'horizontal'
  },
  // 是否使用简洁风格的步骤条
  simpleSteps: {
    type: Boolean,
    default: false
  },
  // 进行中状态
  processStatus: {
    type: String as () => 'wait' | 'process' | 'finish' | 'error' | 'success',
    default: 'process'
  },
  // 已完成状态
  finishStatus: {
    type: String as () => 'wait' | 'process' | 'finish' | 'error' | 'success',
    default: 'finish'
  },
  // 显示步骤按钮
  showStepButtons: {
    type: Boolean,
    default: true
  },
  // 显示完成按钮
  showFinishButton: {
    type: Boolean,
    default: true
  },
  // 上一步按钮文本
  prevButtonText: {
    type: String,
    default: '上一步'
  },
  // 下一步按钮文本
  nextButtonText: {
    type: String,
    default: '下一步'
  },
  // 完成按钮文本
  finishButtonText: {
    type: String,
    default: '完成'
  },
  // 面板标题
  title: {
    type: String,
    default: ''
  },
  // 面板大小
  size: {
    type: String as () => PanelSize,
    default: 'default'
  },
  // 面板主题
  theme: {
    type: String as () => PanelTheme,
    default: 'default'
  },
  // 是否可折叠
  collapsible: {
    type: Boolean,
    default: false
  },
  // 是否默认折叠
  collapsed: {
    type: Boolean,
    default: false
  },
  // 是否有边框
  bordered: {
    type: Boolean,
    default: true
  },
  // 是否有阴影
  shadow: {
    type: Boolean,
    default: false
  },
  // 面板高度
  height: {
    type: [String, Number],
    default: ''
  },
  // 面板宽度
  width: {
    type: [String, Number],
    default: ''
  },
  // 是否显示头部
  showHeader: {
    type: Boolean,
    default: true
  },
  // 是否显示底部
  showFooter: {
    type: Boolean,
    default: false
  },
  // 自定义类名
  className: {
    type: String,
    default: ''
  },
  // 自定义样式
  style: {
    type: Object,
    default: () => ({})
  },
  // 是否加载中
  loading: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['collapse', 'expand', 'step-change', 'finish']);

// 是否折叠
const isCollapsed = ref(props.collapsed);

// 当前活动步骤（内部状态）
const currentStep = ref(props.activeStep);

// 面板样式
const panelStyle = computed(() => {
  const style: Record<string, string> = { ...props.style };
  if (props.width) {
    style.width = typeof props.width === 'number' ? `${props.width}px` : props.width;
  }
  if (props.height) {
    style.height = typeof props.height === 'number' ? `${props.height}px` : props.height;
  }
  return style;
});

// 监听折叠状态变化
watch(() => props.collapsed, (val) => {
  isCollapsed.value = val;
});

// 监听activeStep变化
watch(() => props.activeStep, (val) => {
  currentStep.value = val;
});

// 头部点击事件
const handleHeaderClick = () => {
  if (props.collapsible) {
    isCollapsed.value = !isCollapsed.value;
    if (isCollapsed.value) {
      emit('collapse');
    } else {
      emit('expand');
    }
  }
};

// 下一步
const nextStep = () => {
  if (currentStep.value < props.steps.length - 1) {
    currentStep.value++;
    emit('step-change', currentStep.value);
  }
};

// 上一步
const prevStep = () => {
  if (currentStep.value > 0) {
    currentStep.value--;
    emit('step-change', currentStep.value);
  }
};

// 完成
const finish = () => {
  emit('finish');
};

// 暴露方法
defineExpose({
  // 折叠面板
  collapse: () => {
    if (props.collapsible) {
      isCollapsed.value = true;
      emit('collapse');
    }
  },
  // 展开面板
  expand: () => {
    if (props.collapsible) {
      isCollapsed.value = false;
      emit('expand');
    }
  },
  // 切换折叠状态
  toggle: () => {
    if (props.collapsible) {
      handleHeaderClick();
    }
  },
  // 设置当前步骤
  setStep: (step: number) => {
    if (step >= 0 && step < props.steps.length) {
      currentStep.value = step;
      emit('step-change', step);
    }
  },
  // 获取当前步骤
  getCurrentStep: () => currentStep.value,
  // 下一步
  nextStep,
  // 上一步
  prevStep,
  // 完成
  finish
});
</script>

<style lang="scss" scoped>
$sizes: (
  small: (
    padding: 8px 12px,
    font-size: 12px,
    header-height: 40px
  ),
  default: (
    padding: 12px 16px,
    font-size: 14px,
    header-height: 48px
  ),
  large: (
    padding: 16px 20px,
    font-size: 16px,
    header-height: 56px
  )
);

$themes: (
  default: var(--el-text-color-primary),
  primary: var(--el-color-primary),
  success: var(--el-color-success),
  warning: var(--el-color-warning),
  danger: var(--el-color-danger),
  info: var(--el-color-info)
);

.steps-panel {
  box-sizing: border-box;
  width: 100%;
  background-color: var(--el-bg-color);
  border-radius: 4px;
  transition: all 0.3s ease;
  margin-bottom: 16px;
  border: 1px solid var(--el-border-color-light);
  
  &.is-collapsed {
    .steps-panel__collapse-icon {
      transform: rotate(180deg);
    }
  }

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid var(--el-border-color-light);
    padding: 0 16px;
    cursor: pointer;
    user-select: none;
  }

  &__title {
    font-weight: 500;
  }

  &__extra {
    display: flex;
    align-items: center;
  }

  &__collapse-icon {
    margin-left: 8px;
    transition: transform 0.3s;
    font-size: 16px;
  }

  &__body {
    position: relative;
    overflow: hidden;
  }

  &__loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 24px;
    
    .loading-icon {
      margin-bottom: 8px;
      animation: rotate 1.5s linear infinite;
    }
    
    .loading-text {
      color: var(--el-text-color-secondary);
    }
  }

  &__footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-top: 1px solid var(--el-border-color-light);
  }

  &__steps-container {
    margin-bottom: 24px;
  }

  &__steps-content {
    margin-bottom: 24px;
  }

  &__steps-buttons {
    display: flex;
    justify-content: space-between;
    
    :deep(.el-button) {
      &:not(:last-child) {
        margin-right: 12px;
      }
    }
  }

  // 主题
  @each $name, $color in $themes {
    &--#{$name} {
      .steps-panel__title {
        color: $color;
      }
    }
  }

  // 尺寸
  @each $size, $values in $sizes {
    &--#{$size} {
      font-size: map-get($values, font-size);
      
      .steps-panel__header {
        height: map-get($values, header-height);
      }
      
      .steps-panel__body {
        padding: map-get($values, padding);
      }
      
      .steps-panel__footer {
        padding: map-get($values, padding);
      }
    }
  }
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style> 