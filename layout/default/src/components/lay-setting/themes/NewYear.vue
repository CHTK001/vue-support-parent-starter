<script setup lang="ts">
import BaseSetting from './BaseSetting.vue';
</script>

<template>
  <div class="new-year-setting-wrapper">
    <BaseSetting />
  </div>
</template>

<style lang="scss">
html[data-skin="new-year"] {
  $ny-gold: #ffd700;
  $ny-gold-light: #ffe066;
  $ny-champagne: #f7e7ce;
  $ny-dark: #1a1a2e;
  $ny-dark-light: #16213e;
  $ny-dark-darker: #141422;
  $ny-dark-darkest: #0f0f19;
  $ny-white: #ffffff;

  .right-panel {
    background: linear-gradient(180deg, $ny-dark 0%, $ny-dark-light 100%) !important;
    border-left: 2px solid $ny-gold !important;
    
    .project-configuration {
      border-bottom: 1px solid rgba(255, 215, 0, 0.3) !important;
      
      h4 {
        color: $ny-gold !important;
        font-family: 'Times New Roman', serif;
        text-shadow: 0 0 5px rgba(255, 215, 0, 0.5);
        
        &::before {
          content: "🎉 ";
          margin-right: 5px;
        }
      }
      
      svg {
        color: $ny-champagne !important;
        
        &:hover {
          color: $ny-gold !important;
          background: rgba(255, 215, 0, 0.1) !important;
        }
      }
    }
    
    .el-divider__text {
      background-color: transparent !important;
      color: $ny-gold !important;
    }
    
    .el-switch__label {
      color: $ny-champagne !important;
      
      &.is-active {
        color: $ny-gold !important;
      }
    }

    // --- 深度适配 Element Plus 组件 ---

    // Segmented 分段控制器
    .el-segmented {
      background: rgba(0, 0, 0, 0.2) !important;
      --el-segmented-item-selected-bg-color: $ny-gold !important;
      --el-segmented-item-selected-color: $ny-dark !important;
      --el-segmented-item-hover-bg-color: rgba(255, 215, 0, 0.2) !important;
      --el-segmented-item-hover-color: $ny-gold !important;
      --el-border-radius-base: 8px;
    }

    // Switch 开关
    .el-switch {
      &.is-checked .el-switch__core {
        background-color: $ny-gold !important;
        border-color: $ny-gold !important;
      }
      .el-switch__core {
        background-color: rgba(0, 0, 0, 0.4);
        border-color: $ny-champagne;
      }
    }

    // Radio Button 单选按钮
    .el-radio-button__inner {
      background: transparent !important;
      border-color: $ny-champagne !important;
      color: $ny-champagne !important;
    }
    .el-radio-button__original-radio:checked + .el-radio-button__inner {
      background-color: $ny-gold !important;
      border-color: $ny-gold !important;
      color: $ny-dark !important;
      box-shadow: -1px 0 0 0 $ny-gold !important;
    }

    // Slider 滑块
    .el-slider {
      --el-slider-main-bg-color: $ny-gold;
      --el-slider-runway-bg-color: rgba(255, 255, 255, 0.1);
      .el-slider__button {
        border-color: $ny-gold;
      }
    }

    // Input Number 数字输入框
    .el-input-number {
      .el-input__wrapper {
        background-color: rgba(0, 0, 0, 0.2) !important;
        box-shadow: 0 0 0 1px $ny-champagne inset !important;
      }
      .el-input__inner {
        color: #fff !important;
      }
      .el-input-number__decrease, .el-input-number__increase {
        background: transparent !important;
        color: $ny-gold !important;
        border-color: $ny-champagne !important;
        &:hover {
          color: #fff !important;
        }
      }
    }
    
    // Select 下拉选择
    .el-select {
      --el-select-border-color-hover: $ny-gold;
      --el-select-input-focus-border-color: $ny-gold;
      .el-input__wrapper {
        background-color: rgba(0, 0, 0, 0.2) !important;
        box-shadow: 0 0 0 1px $ny-champagne inset !important;
        &.is-focus {
          box-shadow: 0 0 0 1px $ny-gold inset !important;
        }
      }
      .el-input__inner {
        color: #fff !important;
      }
    }
  }
}
</style>
