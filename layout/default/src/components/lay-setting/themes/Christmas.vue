<script setup lang="ts">
import BaseSetting from './BaseSetting.vue';
</script>

<template>
  <div class="christmas-setting-wrapper">
    <BaseSetting />
  </div>
</template>

<style lang="scss">
html[data-skin="christmas"] {
  .right-panel {
    background: linear-gradient(180deg, #1b5e20 0%, #164d1a 100%) !important;
    border-left: 2px solid #c62828 !important;
    
    .project-configuration {
      border-bottom: 1px solid rgba(198, 40, 40, 0.3) !important;
      
      h4 {
        color: #ffd700 !important;
        font-family: 'Mountains of Christmas', 'cursive', serif;
        text-shadow: 0 0 5px rgba(255, 215, 0, 0.5);
        
        &::before {
          content: "🎄 ";
          margin-right: 5px;
        }
      }
      
      svg {
        color: #a5d6a7 !important;
        
        &:hover {
          color: #c62828 !important;
          background: rgba(198, 40, 40, 0.1) !important;
        }
      }
    }
    
    .el-divider__text {
      background-color: transparent !important;
      color: #c62828 !important;
    }
    
    .el-switch__label {
      color: #a5d6a7 !important;
      
      &.is-active {
        color: #ffd700 !important;
      }
    }

    // --- 深度适配 Element Plus 组件 ---

    // Segmented 分段控制器
    .el-segmented {
      background: rgba(0, 0, 0, 0.2) !important;
      --el-segmented-item-selected-bg-color: #c62828 !important;
      --el-segmented-item-selected-color: #ffd700 !important;
      --el-segmented-item-hover-bg-color: rgba(198, 40, 40, 0.2) !important;
      --el-segmented-item-hover-color: #c62828 !important;
      --el-border-radius-base: 8px;
    }

    // Switch 开关
    .el-switch {
      &.is-checked .el-switch__core {
        background-color: #c62828 !important;
        border-color: #c62828 !important;
      }
      .el-switch__core {
        background-color: rgba(0, 0, 0, 0.4);
        border-color: #2e7d32;
      }
    }

    // Radio Button 单选按钮
    .el-radio-button__inner {
      background: transparent !important;
      border-color: #2e7d32 !important;
      color: #a5d6a7 !important;
    }
    .el-radio-button__original-radio:checked + .el-radio-button__inner {
      background-color: #c62828 !important;
      border-color: #c62828 !important;
      color: #ffd700 !important;
      box-shadow: -1px 0 0 0 #c62828 !important;
    }

    // Slider 滑块
    .el-slider {
      --el-slider-main-bg-color: #c62828;
      --el-slider-runway-bg-color: rgba(255, 255, 255, 0.1);
      .el-slider__button {
        border-color: #c62828;
      }
    }

    // Input Number 数字输入框
    .el-input-number {
      .el-input__wrapper {
        background-color: rgba(0, 0, 0, 0.2) !important;
        box-shadow: 0 0 0 1px #2e7d32 inset !important;
      }
      .el-input__inner {
        color: #fff !important;
      }
      .el-input-number__decrease, .el-input-number__increase {
        background: transparent !important;
        color: #ffd700 !important;
        border-color: #2e7d32 !important;
        &:hover {
          color: #c62828 !important;
        }
      }
    }
    
    // Select 下拉选择
    .el-select {
      --el-select-border-color-hover: #c62828;
      --el-select-input-focus-border-color: #c62828;
      .el-input__wrapper {
        background-color: rgba(0, 0, 0, 0.2) !important;
        box-shadow: 0 0 0 1px #2e7d32 inset !important;
        &.is-focus {
          box-shadow: 0 0 0 1px #c62828 inset !important;
        }
      }
      .el-input__inner {
        color: #fff !important;
      }
    }
  }
}
</style>
