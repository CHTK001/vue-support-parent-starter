<script setup lang="ts">
import BaseSetting from './BaseSetting.vue';
</script>

<template>
  <div class="cyberpunk-setting">
    <BaseSetting />
  </div>
</template>

<style lang="scss">
html[data-skin="cyberpunk"] {
  // 赛博朋克主题颜色变量
  $cyber-cyan: #00ffff;
  $cyber-magenta: #ff00ff;
  $cyber-dark: #0a0a12;
  $cyber-dark-light: #12121f;
  $cyber-glass: rgba(10, 10, 18, 0.95);
  $cyber-border: rgba(0, 255, 255, 0.25);
  $cyber-border-hover: rgba(0, 255, 255, 0.45);

  .right-panel {
    background: linear-gradient(135deg, rgba(10, 14, 25, 0.98) 0%, rgba(15, 20, 35, 0.98) 100%) !important;
    border-left: 1px solid $cyber-cyan !important;
    box-shadow: 0 0 20px rgba(0, 255, 255, 0.2) !important;

    // 顶部霓虹渐变线
    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      background: linear-gradient(90deg, transparent 0%, $cyber-cyan 20%, $cyber-magenta 50%, $cyber-cyan 80%, transparent 100%);
      height: 2px;
      box-shadow: 0 0 15px rgba(0, 255, 255, 0.6);
      z-index: 1;
    }

    .project-configuration {
      border-bottom: 1px solid rgba(0, 255, 255, 0.2) !important;
      
      h4 {
        color: $cyber-cyan !important;
        font-family: 'Orbitron', sans-serif;
        text-shadow: 0 0 5px $cyber-cyan;
        letter-spacing: 1px;
        
        &::before {
          content: "⚡ ";
          margin-right: 5px;
        }
      }
      
      svg {
        color: rgba($cyber-cyan, 0.7) !important;
        
        &:hover {
          color: $cyber-magenta !important;
          filter: drop-shadow(0 0 5px $cyber-magenta);
        }
      }
    }
    
    .el-divider__text {
      background-color: transparent !important;
      color: $cyber-magenta !important;
    }
    
    .el-switch__label {
      color: rgba($cyber-cyan, 0.7) !important;
      
      &.is-active {
        color: $cyber-cyan !important;
        text-shadow: 0 0 5px $cyber-cyan;
      }
    }

    // --- 深度适配 Element Plus 组件 ---

    // Segmented 分段控制器
    .el-segmented {
      background: rgba(0, 0, 0, 0.5) !important;
      border: 1px solid rgba(0, 255, 255, 0.1);
      --el-segmented-item-selected-bg-color: rgba(0, 255, 255, 0.2) !important;
      --el-segmented-item-selected-color: $cyber-cyan !important;
      --el-segmented-item-hover-bg-color: rgba(255, 0, 255, 0.1) !important;
      --el-segmented-item-hover-color: $cyber-magenta !important;
      --el-border-radius-base: 2px; // 硬朗的边角
    }

    // Switch 开关
    .el-switch {
      &.is-checked .el-switch__core {
        background-color: $cyber-cyan !important;
        border-color: $cyber-cyan !important;
        box-shadow: 0 0 10px rgba(0, 255, 255, 0.5);
      }
      .el-switch__core {
        background-color: rgba(0, 0, 0, 0.6);
        border-color: $cyber-magenta;
      }
    }

    // Radio Button 单选按钮
    .el-radio-button__inner {
      background: transparent !important;
      border-color: $cyber-magenta !important;
      color: rgba($cyber-cyan, 0.7) !important;
      border-radius: 0 !important; // 赛博朋克风格去圆角
    }
    .el-radio-button__original-radio:checked + .el-radio-button__inner {
      background-color: rgba($cyber-cyan, 0.2) !important;
      border-color: $cyber-cyan !important;
      color: $cyber-cyan !important;
      box-shadow: -1px 0 0 0 $cyber-cyan !important;
      text-shadow: 0 0 5px $cyber-cyan;
    }

    // Slider 滑块
    .el-slider {
      --el-slider-main-bg-color: $cyber-magenta;
      --el-slider-runway-bg-color: rgba(255, 255, 255, 0.1);
      .el-slider__bar {
        background: linear-gradient(90deg, $cyber-magenta, $cyber-cyan);
      }
      .el-slider__button {
        border-color: $cyber-cyan;
        background: #000;
        box-shadow: 0 0 10px $cyber-cyan;
      }
    }

    // Input Number 数字输入框
    .el-input-number {
      .el-input__wrapper {
        background-color: rgba(0, 0, 0, 0.5) !important;
        box-shadow: 0 0 0 1px $cyber-magenta inset !important;
        border-radius: 0 !important;
      }
      .el-input__inner {
        color: $cyber-cyan !important;
        font-family: 'Orbitron', monospace;
      }
      .el-input-number__decrease, .el-input-number__increase {
        background: transparent !important;
        color: $cyber-cyan !important;
        border-color: $cyber-magenta !important;
        border-radius: 0 !important;
        &:hover {
          color: #fff !important;
          background: rgba($cyber-magenta, 0.2) !important;
        }
      }
    }
    
    // Select 下拉选择
    .el-select {
      --el-select-border-color-hover: $cyber-cyan;
      --el-select-input-focus-border-color: $cyber-cyan;
      .el-input__wrapper {
        background-color: rgba(0, 0, 0, 0.5) !important;
        box-shadow: 0 0 0 1px $cyber-magenta inset !important;
        border-radius: 0 !important;
        &.is-focus {
          box-shadow: 0 0 0 1px $cyber-cyan inset !important;
        }
      }
      .el-input__inner {
        color: $cyber-cyan !important;
      }
    }
  }
}
</style>
