<script setup lang="ts">
import BaseSetting from './BaseSetting.vue';
</script>

<template>
  <div class="spring-festival-setting-wrapper">
    <BaseSetting />
  </div>
</template>

<style lang="scss">
html[data-skin="spring-festival"],
html.theme-spring-festival {
  .right-panel {
    background: linear-gradient(180deg, #b71c1c 0%, #880e4f 100%) !important;
    border-left: 2px solid #ffd700 !important;
    
    .project-configuration {
      border-bottom: 1px solid rgba(255, 215, 0, 0.3) !important;
      
      h4 {
        color: #ffd700 !important;
        font-family: 'STKaiti', 'KaiTi', serif;
        text-shadow: 0 0 5px rgba(255, 215, 0, 0.5);
        
        &::before {
          content: "🧧 ";
          margin-right: 5px;
        }
      }
      
      svg {
        color: #ffcdd2 !important;
        
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
      color: #ffcdd2 !important;
      
      &.is-active {
        color: #ffd700 !important;
      }
    }

    // --- 深度适配 Element Plus 组件 ---

    // Segmented 分段控制器
    .el-segmented {
      background: rgba(0, 0, 0, 0.2) !important;
      --el-segmented-item-selected-bg-color: #ffd700 !important;
      --el-segmented-item-selected-color: #b71c1c !important;
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
        border-color: #e57373;
      }
    }

    // Radio Button 单选按钮
    .el-radio-button__inner {
      background: transparent !important;
      border-color: #e57373 !important;
      color: #ffcdd2 !important;
    }
    .el-radio-button__original-radio:checked + .el-radio-button__inner {
      background-color: #ffd700 !important;
      border-color: #ffd700 !important;
      color: #b71c1c !important;
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

    // Input Number 数字输入框
    .el-input-number {
      .el-input__wrapper {
        background-color: rgba(0, 0, 0, 0.2) !important;
        box-shadow: 0 0 0 1px #e57373 inset !important;
      }
      .el-input__inner {
        color: #fff !important;
      }
      .el-input-number__decrease, .el-input-number__increase {
        background: transparent !important;
        color: #ffd700 !important;
        border-color: #e57373 !important;
        &:hover {
          color: #fff !important;
        }
      }
    }
    
    // Select 下拉选择
    .el-select {
      --el-select-border-color-hover: #ffd700;
      --el-select-input-focus-border-color: #ffd700;
      .el-input__wrapper {
        background-color: rgba(0, 0, 0, 0.2) !important;
        box-shadow: 0 0 0 1px #e57373 inset !important;
        &.is-focus {
          box-shadow: 0 0 0 1px #ffd700 inset !important;
        }
      }
      .el-input__inner {
        color: #fff !important;
      }
    }
    
    // Input 输入框
    .el-input {
      .el-input__wrapper {
        background-color: rgba(0, 0, 0, 0.2) !important;
        box-shadow: 0 0 0 1px #e57373 inset !important;
        &.is-focus {
          box-shadow: 0 0 0 1px #ffd700 inset !important;
        }
      }
      .el-input__inner {
        color: #fff !important;
      }
    }
    
    // Button 按钮
    .el-button {
      border-color: #e57373 !important;
      color: #ffcdd2 !important;
      
      &:hover {
        border-color: #ffd700 !important;
        background: rgba(255, 215, 0, 0.1) !important;
        color: #ffd700 !important;
      }
      
      &.el-button--primary {
        background: #ffd700 !important;
        border-color: #ffd700 !important;
        color: #b71c1c !important;
        
        &:hover {
          background: #ffecb3 !important;
        }
      }
    }
    
    // 设置项容器
    .setting-section {
      border-bottom: 1px solid rgba(255, 215, 0, 0.2) !important;
      padding-bottom: 20px;
      margin-bottom: 20px;
    }
    
    // 主题颜色项
    .theme-color-item {
      border: 2px solid rgba(255, 215, 0, 0.3) !important;
      box-shadow: 0 0 5px rgba(255, 215, 0, 0.2) !important;
      
      &:hover {
        border-color: rgba(255, 215, 0, 0.6) !important;
        box-shadow: 0 0 10px rgba(255, 215, 0, 0.4) !important;
      }
      
      &.is-selected {
        border-color: #ffd700 !important;
        box-shadow: 0 0 15px rgba(255, 215, 0, 0.5) !important;
      }
    }
    
    // 开关卡片
    .switch-card-item {
      background: rgba(0, 0, 0, 0.2) !important;
      border: 1px solid rgba(255, 215, 0, 0.3) !important;
      
      &:hover {
        border-color: rgba(255, 215, 0, 0.6) !important;
        background: rgba(255, 215, 0, 0.1) !important;
      }
    }
  }
}
</style>
