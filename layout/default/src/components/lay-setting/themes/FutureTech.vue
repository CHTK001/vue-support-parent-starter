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
    background: linear-gradient(180deg, #050a1f 0%, #0a1a3a 50%, #050a1f 100%) !important;
    border-left: 2px solid rgba(0, 255, 255, 0.4) !important;
    box-shadow: 
      inset -10px 0 30px rgba(0, 255, 255, 0.1),
      0 0 40px rgba(0, 255, 255, 0.15) !important;
    
    // 网格背景效果
    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-image: 
        linear-gradient(rgba(0, 255, 255, 0.03) 1px, transparent 1px),
        linear-gradient(90deg, rgba(0, 255, 255, 0.03) 1px, transparent 1px);
      background-size: 20px 20px;
      pointer-events: none;
      z-index: 0;
    }
    
    .project-configuration {
      border-bottom: 1px solid rgba(0, 255, 255, 0.2) !important;
      position: relative;
      
      // 扫描线效果
      &::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 2px;
        background: linear-gradient(90deg, transparent, rgba(0, 255, 255, 0.6), transparent);
        animation: scanLine 3s linear infinite;
      }
      
      h4 {
        color: #00ffff !important;
        font-family: 'Courier New', 'Monaco', monospace;
        text-shadow: 
          0 0 10px rgba(0, 255, 255, 0.8),
          0 0 20px rgba(0, 255, 255, 0.4),
          0 0 30px rgba(0, 255, 255, 0.2) !important;
        letter-spacing: 2px;
        position: relative;
        z-index: 1;
        
        &::before {
          content: "⚡ ";
          margin-right: 5px;
          filter: drop-shadow(0 0 5px rgba(0, 255, 255, 0.8));
        }
      }
      
      svg {
        color: rgba(0, 255, 255, 0.7) !important;
        filter: drop-shadow(0 0 5px rgba(0, 255, 255, 0.5));
        transition: all 0.3s ease;
        
        &:hover {
          color: #00ffff !important;
          background: rgba(0, 255, 255, 0.1) !important;
          filter: drop-shadow(0 0 10px rgba(0, 255, 255, 0.8));
          transform: scale(1.1);
        }
      }
    }
    
    .el-divider__text {
      background-color: rgba(5, 10, 31, 0.9) !important;
      color: #00ffff !important;
      text-shadow: 0 0 8px rgba(0, 255, 255, 0.6);
      border: 1px solid rgba(0, 255, 255, 0.3);
      box-shadow: 0 0 10px rgba(0, 255, 255, 0.2);
    }
    
    .el-switch__label {
      color: rgba(0, 255, 255, 0.7) !important;
      
      &.is-active {
        color: #00ffff !important;
        text-shadow: 0 0 8px rgba(0, 255, 255, 0.6);
      }
    }

    // --- 深度适配 Element Plus 组件 ---

    // Segmented 分段控制器 - 科技感边框和发光
    .el-segmented {
      background: rgba(0, 0, 0, 0.3) !important;
      border: 1px solid rgba(0, 255, 255, 0.3) !important;
      box-shadow: 
        0 0 10px rgba(0, 255, 255, 0.2),
        inset 0 0 10px rgba(0, 255, 255, 0.05) !important;
      --el-segmented-item-selected-bg-color: rgba(0, 255, 255, 0.2) !important;
      --el-segmented-item-selected-color: #00ffff !important;
      --el-segmented-item-hover-bg-color: rgba(0, 255, 255, 0.1) !important;
      --el-segmented-item-hover-color: rgba(0, 255, 255, 0.9) !important;
      --el-border-radius-base: 4px;
      
      .el-segmented__item {
        border: 1px solid transparent;
        transition: all 0.3s ease;
        
        &.is-selected {
          border-color: rgba(0, 255, 255, 0.5) !important;
          box-shadow: 
            0 0 15px rgba(0, 255, 255, 0.4),
            inset 0 0 10px rgba(0, 255, 255, 0.1) !important;
          text-shadow: 0 0 8px rgba(0, 255, 255, 0.8);
        }
        
        &:hover:not(.is-selected) {
          border-color: rgba(0, 255, 255, 0.3) !important;
          box-shadow: 0 0 8px rgba(0, 255, 255, 0.2) !important;
        }
      }
    }

    // Switch 开关 - 科技感发光效果
    .el-switch {
      &.is-checked .el-switch__core {
        background-color: #00ffff !important;
        border-color: #00ffff !important;
        box-shadow: 
          0 0 10px rgba(0, 255, 255, 0.6),
          inset 0 0 10px rgba(0, 255, 255, 0.3) !important;
      }
      .el-switch__core {
        background-color: rgba(0, 0, 0, 0.5);
        border-color: rgba(0, 255, 255, 0.4);
        box-shadow: 0 0 5px rgba(0, 255, 255, 0.2);
      }
      
      .el-switch__action {
        box-shadow: 0 0 8px rgba(0, 255, 255, 0.4);
      }
    }

    // Radio Button 单选按钮 - 科技感边框
    .el-radio-button__inner {
      background: rgba(0, 0, 0, 0.3) !important;
      border-color: rgba(0, 255, 255, 0.4) !important;
      color: rgba(0, 255, 255, 0.8) !important;
      box-shadow: 0 0 5px rgba(0, 255, 255, 0.1);
      transition: all 0.3s ease;
      
      &:hover {
        border-color: rgba(0, 255, 255, 0.6) !important;
        box-shadow: 0 0 10px rgba(0, 255, 255, 0.3);
      }
    }
    .el-radio-button__original-radio:checked + .el-radio-button__inner {
      background: rgba(0, 255, 255, 0.15) !important;
      border-color: #00ffff !important;
      color: #00ffff !important;
      box-shadow: 
        0 0 15px rgba(0, 255, 255, 0.5),
        inset 0 0 10px rgba(0, 255, 255, 0.1) !important;
      text-shadow: 0 0 8px rgba(0, 255, 255, 0.8);
    }

    // Slider 滑块 - 科技感轨道和发光
    .el-slider {
      --el-slider-main-bg-color: #00ffff;
      --el-slider-runway-bg-color: rgba(0, 255, 255, 0.1);
      box-shadow: 0 0 5px rgba(0, 255, 255, 0.2);
      
      .el-slider__button {
        border-color: #00ffff;
        background: #00ffff;
        box-shadow: 
          0 0 10px rgba(0, 255, 255, 0.6),
          0 0 20px rgba(0, 255, 255, 0.3) !important;
        
        &:hover {
          box-shadow: 
            0 0 15px rgba(0, 255, 255, 0.8),
            0 0 25px rgba(0, 255, 255, 0.4) !important;
        }
      }
      
      .el-slider__runway {
        border: 1px solid rgba(0, 255, 255, 0.3);
        box-shadow: inset 0 0 10px rgba(0, 255, 255, 0.1);
      }
    }

    // Input Number 数字输入框 - 科技感边框
    .el-input-number {
      .el-input__wrapper {
        background-color: rgba(0, 0, 0, 0.3) !important;
        box-shadow: 
          0 0 0 1px rgba(0, 255, 255, 0.3) inset,
          0 0 5px rgba(0, 255, 255, 0.1) !important;
        border: 1px solid rgba(0, 255, 255, 0.2);
        
        &.is-focus {
          box-shadow: 
            0 0 0 1px #00ffff inset,
            0 0 15px rgba(0, 255, 255, 0.3) !important;
          border-color: #00ffff;
        }
      }
      .el-input__inner {
        color: #00ffff !important;
        text-shadow: 0 0 5px rgba(0, 255, 255, 0.5);
      }
      .el-input-number__decrease, .el-input-number__increase {
        background: rgba(0, 0, 0, 0.3) !important;
        color: rgba(0, 255, 255, 0.7) !important;
        border-color: rgba(0, 255, 255, 0.3) !important;
        transition: all 0.3s ease;
        
        &:hover {
          color: #00ffff !important;
          background: rgba(0, 255, 255, 0.1) !important;
          border-color: #00ffff !important;
          box-shadow: 0 0 10px rgba(0, 255, 255, 0.4);
        }
      }
    }
    
    // Select 下拉选择 - 科技感边框和发光
    .el-select {
      --el-select-border-color-hover: #00ffff;
      --el-select-input-focus-border-color: #00ffff;
      .el-input__wrapper {
        background-color: rgba(0, 0, 0, 0.3) !important;
        box-shadow: 
          0 0 0 1px rgba(0, 255, 255, 0.3) inset,
          0 0 5px rgba(0, 255, 255, 0.1) !important;
        border: 1px solid rgba(0, 255, 255, 0.2);
        transition: all 0.3s ease;
        
        &.is-focus {
          box-shadow: 
            0 0 0 1px #00ffff inset,
            0 0 15px rgba(0, 255, 255, 0.3) !important;
          border-color: #00ffff;
        }
      }
      .el-input__inner {
        color: #00ffff !important;
        text-shadow: 0 0 5px rgba(0, 255, 255, 0.5);
      }
      
      .el-select__caret {
        color: rgba(0, 255, 255, 0.7);
        filter: drop-shadow(0 0 3px rgba(0, 255, 255, 0.5));
        
        &:hover {
          color: #00ffff;
        }
      }
    }
    
    // Button 按钮 - 科技感发光效果
    .el-button {
      border: 1px solid rgba(0, 255, 255, 0.4);
      transition: all 0.3s ease;
      
      &:hover {
        border-color: rgba(0, 255, 255, 0.7);
        box-shadow: 0 0 10px rgba(0, 255, 255, 0.3);
      }
      
      &.el-button--primary {
        background: rgba(0, 255, 255, 0.1);
        border-color: #00ffff;
        color: #00ffff;
        text-shadow: 0 0 8px rgba(0, 255, 255, 0.8);
        box-shadow: 
          0 0 15px rgba(0, 255, 255, 0.4),
          inset 0 0 10px rgba(0, 255, 255, 0.05) !important;
        
        &:hover {
          background: rgba(0, 255, 255, 0.2);
          box-shadow: 
            0 0 20px rgba(0, 255, 255, 0.6),
            inset 0 0 15px rgba(0, 255, 255, 0.1) !important;
        }
      }
    }
    
    // 设置项容器
    .setting-section {
      border-bottom: 1px solid rgba(0, 255, 255, 0.1) !important;
      padding-bottom: 20px;
      margin-bottom: 20px;
      position: relative;

      &::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: 1px;
        background: linear-gradient(90deg, transparent, rgba(0, 255, 255, 0.3), transparent);
      }
    }

    // 设置项标题和描述
    .section-title {
      color: #00ffff !important;
      text-shadow: 
        0 0 10px rgba(0, 255, 255, 0.8),
        0 0 20px rgba(0, 255, 255, 0.4) !important;
    }
    
    .section-description {
      color: rgba(0, 255, 255, 0.7) !important;
    }
    
    .section-icon {
      color: #00ffff !important;
      filter: drop-shadow(0 0 8px rgba(0, 255, 255, 0.6));
    }

    .section-header {
      border-bottom: 1px solid rgba(0, 255, 255, 0.2) !important;
    }

    // 主题颜色选择器
    .theme-color-item {
      border: 2px solid rgba(0, 255, 255, 0.3) !important;
      box-shadow: 0 0 5px rgba(0, 255, 255, 0.2) !important;
      transition: all 0.3s ease;
      position: relative;
      overflow: hidden;

      &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-image: 
          linear-gradient(rgba(0, 255, 255, 0.05) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0, 255, 255, 0.05) 1px, transparent 1px);
        background-size: 8px 8px;
        opacity: 0.3;
        pointer-events: none;
      }

      &:hover {
        border-color: rgba(0, 255, 255, 0.6) !important;
        box-shadow: 0 0 15px rgba(0, 255, 255, 0.4) !important;
        transform: scale(1.05);
      }

      &.is-selected {
        border-color: #00ffff !important;
        box-shadow: 
          0 0 20px rgba(0, 255, 255, 0.6),
          inset 0 0 10px rgba(0, 255, 255, 0.1) !important;
      }

      .selection-indicator {
        .check-ring {
          border-color: #00ffff !important;
          box-shadow: 0 0 10px rgba(0, 255, 255, 0.6) !important;
        }

        .check-icon {
          color: #00ffff !important;
          filter: drop-shadow(0 0 5px rgba(0, 255, 255, 0.8));
        }
      }

      .shine-effect {
        background: linear-gradient(135deg, transparent, rgba(0, 255, 255, 0.3), transparent);
      }
    }

    // 分段控制器
    .modern-segmented {
      background: rgba(0, 0, 0, 0.3) !important;
      border: 1px solid rgba(0, 255, 255, 0.3) !important;
      box-shadow: 
        0 0 10px rgba(0, 255, 255, 0.2),
        inset 0 0 10px rgba(0, 255, 255, 0.05) !important;
    }

    // 开关卡片
    .switch-card-item {
      background: rgba(0, 0, 0, 0.3) !important;
      border: 1px solid rgba(0, 255, 255, 0.3) !important;
      box-shadow: 0 0 5px rgba(0, 255, 255, 0.1) !important;
      transition: all 0.3s ease;
      position: relative;
      overflow: hidden;

      &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-image: 
          linear-gradient(rgba(0, 255, 255, 0.02) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0, 255, 255, 0.02) 1px, transparent 1px);
        background-size: 10px 10px;
        opacity: 0.2;
        pointer-events: none;
      }

      &:hover {
        border-color: rgba(0, 255, 255, 0.6) !important;
        box-shadow: 0 0 15px rgba(0, 255, 255, 0.3) !important;
        transform: translateY(-2px);
      }

      .switch-card-icon {
        color: rgba(0, 255, 255, 0.7) !important;
        filter: drop-shadow(0 0 5px rgba(0, 255, 255, 0.5));
      }

      .switch-card-label {
        color: rgba(0, 255, 255, 0.8) !important;
      }

      .switch-card-desc {
        color: rgba(0, 255, 255, 0.6) !important;
      }
    }

    // 设置组项
    .setting-group-item {
      border-bottom: 1px solid rgba(0, 255, 255, 0.1) !important;
      padding-bottom: 12px;
      margin-bottom: 12px;

      .setting-label {
        color: rgba(0, 255, 255, 0.8) !important;
      }
    }

    // Input 输入框
    .el-input {
      .el-input__wrapper {
        background-color: rgba(0, 0, 0, 0.3) !important;
        box-shadow: 
          0 0 0 1px rgba(0, 255, 255, 0.3) inset,
          0 0 5px rgba(0, 255, 255, 0.1) !important;
        border: 1px solid rgba(0, 255, 255, 0.2);
        transition: all 0.3s ease;

        &.is-focus {
          box-shadow: 
            0 0 0 1px #00ffff inset,
            0 0 15px rgba(0, 255, 255, 0.3) !important;
          border-color: #00ffff;
        }
      }

      .el-input__inner {
        color: #00ffff !important;
        text-shadow: 0 0 5px rgba(0, 255, 255, 0.5);
      }
    }
  }
}

// 扫描线动画
@keyframes scanLine {
  0% {
    transform: translateX(-100%);
    opacity: 0;
  }
  50% {
    opacity: 1;
  }
  100% {
    transform: translateX(100%);
    opacity: 0;
  }
}
</style>

