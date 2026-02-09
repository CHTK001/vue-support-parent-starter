<script setup lang="ts">
import BaseSetting from './BaseSetting.vue';
</script>

<template>
  <div class="mid-autumn-setting-wrapper">
    <BaseSetting />
  </div>
</template>

<style lang="scss">
html[data-skin="mid-autumn"] {
  .right-panel {
    background: linear-gradient(180deg, #0d47a1 0%, #1a237e 100%) !important;
    border-left: 2px solid #ffd700 !important;
    
    .project-configuration {
      border-bottom: 1px solid rgba(255, 215, 0, 0.3) !important;
      
      h4 {
        color: #ffd700 !important;
        font-family: 'STKaiti', 'KaiTi', serif;
        text-shadow: 0 0 5px rgba(255, 215, 0, 0.5);
        
        &::before {
          content: "🥮 ";
          margin-right: 5px;
        }
      }
      
      svg {
        color: #bbdefb !important;
        
        &:hover {
          color: #ffd700 !important;
          background: rgba(255, 215, 0, 0.1) !important;
        }
      }
    }
    
    .el-divider__text {
      background-color: transparent !important;
      color: #ffd700 !important;
    }
    
    .el-switch__label {
      color: #bbdefb !important;
      
      &.is-active {
        color: #ffd700 !important;
      }
    }

    // --- 深度适配 Element Plus 组件 ---

    // Segmented 分段控制器
    .el-segmented {
      background: rgba(0, 0, 0, 0.2) !important;
      --el-segmented-item-selected-bg-color: #ffd700 !important;
      --el-segmented-item-selected-color: #1a237e !important;
      --el-segmented-item-hover-bg-color: rgba(255, 215, 0, 0.2) !important;
      --el-segmented-item-hover-color: #ffd700 !important;
      --el-border-radius-base: 8px;
    }

    // Switch 开关
    .el-switch {
      &.is-checked .el-switch__core {
        background-color: #ffd700 !important;
        border-color: #ffd700 !important;
      }
      .el-switch__core {
        background-color: rgba(0, 0, 0, 0.4);
        border-color: #5c6bc0;
      }
    }

    // Radio Button 单选按钮
    .el-radio-button__inner {
      background: transparent !important;
      border-color: #5c6bc0 !important;
      color: #bbdefb !important;
    }
    .el-radio-button__original-radio:checked + .el-radio-button__inner {
      background-color: #ffd700 !important;
      border-color: #ffd700 !important;
      color: #1a237e !important;
      box-shadow: -1px 0 0 0 #ffd700 !important;
    }

    // Slider 滑块
    .el-slider {
      --el-slider-main-bg-color: #ffd700;
      --el-slider-runway-bg-color: rgba(255, 255, 255, 0.1);
      .el-slider__button {
        border-color: #ffd700;
      }
    }
    
    // Select 下拉选择
    .el-select {
      --el-select-border-color-hover: #ffd700;
      --el-select-input-focus-border-color: #ffd700;
      .el-input__wrapper {
        background-color: rgba(0, 0, 0, 0.2) !important;
        box-shadow: 0 0 0 1px #5c6bc0 inset !important;
        &.is-focus {
          box-shadow: 0 0 0 1px #ffd700 inset !important;
        }
      }
      .el-input__inner {
        color: #fff !important;
      }
    }
  }
}
</style>
