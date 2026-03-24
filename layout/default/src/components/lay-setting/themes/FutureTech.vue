<script setup lang="ts">
import BaseSetting from './BaseSetting.vue';
</script>

<template>
  <div class="future-tech-setting-wrapper">
    <BaseSetting />
  </div>
</template>

<style lang="scss">
html[data-skin="future-tech"],
html.theme-future-tech {
  .right-panel {
    background: linear-gradient(180deg, #050a1f 0%, #0a1a3a 100%) !important;
    border-left: 2px solid rgba(0, 255, 255, 0.4) !important;
    
    .project-configuration {
      border-bottom: 1px solid rgba(0, 255, 255, 0.2) !important;
      
      h4 {
        color: #00ffff !important;
        text-shadow: 0 0 8px rgba(0, 255, 255, 0.5);
      }
      
      svg {
        color: rgba(0, 255, 255, 0.7) !important;
        
        &:hover {
          color: #00ffff !important;
          background: rgba(0, 255, 255, 0.1) !important;
        }
      }
    }
    
    .el-divider__text {
      background-color: transparent !important;
      color: rgba(0, 255, 255, 0.6) !important;
    }
    
    .el-switch__label {
      color: rgba(0, 255, 255, 0.7) !important;
      
      &.is-active {
        color: #00ffff !important;
      }
    }

    .el-segmented {
      background: rgba(0, 0, 0, 0.3) !important;
      --el-segmented-item-selected-bg-color: rgba(0, 255, 255, 0.2) !important;
      --el-segmented-item-selected-color: #00ffff !important;
      --el-segmented-item-hover-bg-color: rgba(0, 255, 255, 0.1) !important;
      --el-segmented-item-hover-color: #00ffff !important;
      --el-border-radius-base: 8px;
    }

    .el-switch {
      &.is-checked .el-switch__core {
        background-color: #00ffff !important;
        border-color: #00ffff !important;
      }
      .el-switch__core {
        background-color: rgba(0, 0, 0, 0.4);
        border-color: rgba(0, 255, 255, 0.4);
      }
    }

    .el-radio-button__inner {
      background: transparent !important;
      border-color: rgba(0, 255, 255, 0.4) !important;
      color: rgba(0, 255, 255, 0.7) !important;
    }
    .el-radio-button__original-radio:checked + .el-radio-button__inner {
      background-color: rgba(0, 255, 255, 0.2) !important;
      border-color: #00ffff !important;
      color: #00ffff !important;
      box-shadow: -1px 0 0 0 #00ffff !important;
    }

    .el-slider {
      --el-slider-main-bg-color: #00ffff;
      --el-slider-runway-bg-color: rgba(0, 255, 255, 0.1);
      .el-slider__button {
        border-color: #00ffff;
      }
    }

    .el-input-number {
      .el-input__wrapper {
        background-color: rgba(0, 0, 0, 0.3) !important;
        box-shadow: 0 0 0 1px rgba(0, 255, 255, 0.3) inset !important;
      }
      .el-input__inner {
        color: rgba(0, 255, 255, 0.9) !important;
      }
      .el-input-number__decrease, .el-input-number__increase {
        background: transparent !important;
        color: #00ffff !important;
        border-color: rgba(0, 255, 255, 0.4) !important;
        &:hover {
          color: #4dfdfd !important;
        }
      }
    }
    
    .el-select {
      --el-select-border-color-hover: #00ffff;
      --el-select-input-focus-border-color: #00ffff;
      .el-input__wrapper {
        background-color: rgba(0, 0, 0, 0.3) !important;
        box-shadow: 0 0 0 1px rgba(0, 255, 255, 0.3) inset !important;
        &.is-focus {
          box-shadow: 0 0 0 1px #00ffff inset !important;
        }
      }
      .el-input__inner {
        color: rgba(0, 255, 255, 0.9) !important;
      }
    }
    
    .el-input {
      .el-input__wrapper {
        background-color: rgba(0, 0, 0, 0.3) !important;
        box-shadow: 0 0 0 1px rgba(0, 255, 255, 0.3) inset !important;
        &.is-focus {
          box-shadow: 0 0 0 1px #00ffff inset !important;
        }
      }
      .el-input__inner {
        color: rgba(0, 255, 255, 0.9) !important;
      }
    }
    
    .el-button {
      border-color: rgba(0, 255, 255, 0.4) !important;
      color: rgba(0, 255, 255, 0.7) !important;
      
      &:hover {
        border-color: #00ffff !important;
        background: rgba(0, 255, 255, 0.1) !important;
        color: #00ffff !important;
      }
      
      &.el-button--primary {
        background: rgba(0, 255, 255, 0.2) !important;
        border-color: #00ffff !important;
        color: #00ffff !important;
        
        &:hover {
          background: rgba(0, 255, 255, 0.3) !important;
        }
      }
    }
    
    .setting-section {
      border-bottom: 1px solid rgba(0, 255, 255, 0.2) !important;
      padding-bottom: 20px;
      margin-bottom: 20px;
    }
    
    .theme-color-item {
      border: 2px solid rgba(0, 255, 255, 0.3) !important;
      box-shadow: 0 0 5px rgba(0, 255, 255, 0.2) !important;
      
      &:hover {
        border-color: rgba(0, 255, 255, 0.6) !important;
        box-shadow: 0 0 10px rgba(0, 255, 255, 0.4) !important;
      }
      
      &.is-selected {
        border-color: #00ffff !important;
        box-shadow: 0 0 15px rgba(0, 255, 255, 0.5) !important;
      }
    }
    
    .switch-card-item {
      background: rgba(0, 0, 0, 0.3) !important;
      border: 1px solid rgba(0, 255, 255, 0.3) !important;
      
      &:hover {
        border-color: rgba(0, 255, 255, 0.6) !important;
        background: rgba(0, 255, 255, 0.1) !important;
      }
    }
  }
}
</style>

