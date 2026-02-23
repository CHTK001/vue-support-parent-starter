<template>
  <div class="halloween-setting-wrapper">
    <!-- 主题组件预览区域 (Managed by BaseSetting now) -->
    <BaseSetting />
  </div>
</template>

<script setup lang="ts">
import BaseSetting from './BaseSetting.vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
</script>

<style lang="scss">
@import url('https://fonts.googleapis.com/css2?family=Creepster&display=swap');

@keyframes halloween-panel-slide-in {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

html[data-skin="halloween"],
html.theme-halloween {
  // --- ScCard & Global Theme Variables Override ---
  --stitch-lay-primary: #ff7518;
  --stitch-lay-primary-light: #ffa726;
  --stitch-lay-primary-dark: #e65100;
  --stitch-lay-primary-alpha: rgba(255, 117, 24, 0.1);
  --stitch-lay-success: #76ff03;
  --stitch-lay-success-bg: rgba(118, 255, 3, 0.1);
  --stitch-lay-success-light: #b0ff57;
  --stitch-lay-warning: #ffab40;
  --stitch-lay-warning-bg: rgba(255, 171, 64, 0.1);
  --stitch-lay-warning-light: #ffd180;
  --stitch-lay-error: #d50000;
  --stitch-lay-error-bg: rgba(213, 0, 0, 0.1);
  --stitch-lay-error-light: #ff5252;
  --stitch-lay-info: #b39ddb;
  --stitch-lay-info-light: #d1c4e9;
  --stitch-lay-text-main: #ffffff;
  --stitch-lay-text-sub: #b39ddb;
  --stitch-lay-bg-group: #2c003e;

  // Element Plus Color Overrides
  --el-color-primary: #ff7518;
  --el-color-primary-light-3: #ffa726;
  --el-color-primary-light-5: #ffcc80;
  --el-color-primary-light-7: #ffe0b2;
  --el-color-primary-light-9: #fff3e0;
  --el-color-primary-dark-2: #e65100;

  --el-color-success: #76ff03;
  --el-color-success-light-3: #b0ff57;
  --el-color-success-light-9: rgba(118, 255, 3, 0.1);

  --el-color-warning: #ffab40;
  --el-color-warning-light-3: #ffd180;
  --el-color-warning-light-9: rgba(255, 171, 64, 0.1);

  --el-color-danger: #d50000;
  --el-color-danger-light-3: #ff5252;
  --el-color-danger-light-9: rgba(213, 0, 0, 0.1);

  // 全局过渡动画
  body {
    transition: background-color 0.5s ease, color 0.5s ease;
  }

  .right-panel {
    background: linear-gradient(180deg, #2c003e 0%, #1a0026 100%) !important;
    border-left: 2px solid #ff7518 !important;
    animation: halloween-panel-slide-in 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
    
    // --- 容器与布局 ---
    .modern-setting-container {
      padding: 16px;
      color: #b39ddb;
    }

    .setting-section {
      background: rgba(44, 0, 62, 0.4);
      border: 1px solid rgba(94, 53, 177, 0.3);
      border-radius: 12px;
      margin-bottom: 16px;
      padding: 16px;
      transition: all 0.3s ease;

      &:hover {
        border-color: #ff7518;
        box-shadow: 0 4px 12px rgba(255, 117, 24, 0.15);
      }
      
      &.preview-section {
        background: rgba(0, 0, 0, 0.3);
        border: 1px dashed #ff7518;
      }
    }
    
    .preview-content {
      padding: 8px;
      
      .el-divider {
        --el-bg-color: rgba(94, 53, 177, 0.3);
        .el-divider__text {
          background-color: transparent;
          color: #ff7518;
          font-family: 'Creepster', cursive;
        }
      }
      
      .preview-row {
        display: flex;
        gap: 12px;
        margin-bottom: 16px;
        align-items: center;
        flex-wrap: wrap;
        
        &.full-width {
          width: 100%;
        }
      }
    }

    // --- 深度适配 Element Plus 组件 (Global Override within Halloween Scope) ---

    // Button 按钮
    .el-button {
      border: none;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      
      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0,0,0,0.4);
      }
      
      &--primary {
        background: linear-gradient(135deg, #ff7518 0%, #e65100 100%);
        color: #fff;
        &:hover {
          background: linear-gradient(135deg, #ffa726 0%, #f57c00 100%);
        }
      }
      
      &--success {
        background: linear-gradient(135deg, #76ff03 0%, #4caf50 100%);
        color: #1a0026;
        font-weight: bold;
      }
      
      &--danger {
        background: linear-gradient(135deg, #d50000 0%, #b71c1c 100%);
      }
      
      &--warning {
        background: linear-gradient(135deg, #ffab40 0%, #ff6d00 100%);
        color: #1a0026;
      }
      
      &--default {
        background: rgba(94, 53, 177, 0.3);
        color: #b39ddb;
        &:hover {
          background: rgba(94, 53, 177, 0.5);
          color: #fff;
        }
      }
    }
    
    // Input 输入框
    .el-input {
      --el-input-text-color: #b39ddb;
      --el-input-border-color: #5e35b1;
      --el-input-bg-color: rgba(0, 0, 0, 0.2);
      --el-input-hover-border-color: #ff7518;
      --el-input-focus-border-color: #76ff03;
      
      .el-input__wrapper {
        box-shadow: 0 0 0 1px #5e35b1 inset;
        background-color: rgba(0, 0, 0, 0.2);
        
        &.is-focus {
          box-shadow: 0 0 0 1px #76ff03 inset !important;
        }
      }
    }

    .section-header {
      display: flex;
      align-items: center;
      margin-bottom: 16px;
      border-bottom: 1px solid rgba(255, 117, 24, 0.2);
      padding-bottom: 8px;

      .section-icon {
        color: #ff7518;
        font-size: 20px;
        margin-right: 8px;
        filter: drop-shadow(0 0 2px rgba(255, 117, 24, 0.5));
      }

      .section-title {
        color: #ff7518;
        font-family: 'Creepster', 'cursive', sans-serif;
        font-size: 16px;
        font-weight: bold;
        text-shadow: 0 0 5px rgba(255, 117, 24, 0.3);
      }

      .section-description {
        color: rgba(179, 157, 219, 0.7);
        font-size: 12px;
        margin-left: auto;
      }
    }

    .group-title {
      color: #b39ddb;
      font-size: 14px;
      margin-bottom: 12px;
      display: flex;
      align-items: center;

      .group-icon {
        color: #76ff03;
        margin-right: 6px;
      }
    }

    // --- 深度适配 Element Plus 组件 ---

    // Segmented 分段控制器
    .el-segmented {
      background: rgba(0, 0, 0, 0.2) !important;
      --el-segmented-item-selected-bg-color: #ff7518 !important;
      --el-segmented-item-selected-color: #fff !important;
      --el-segmented-item-hover-bg-color: rgba(255, 117, 24, 0.2) !important;
      --el-segmented-item-hover-color: #ff7518 !important;
      --el-border-radius-base: 8px;
    }

    // Switch 开关
    .el-switch {
      &.is-checked .el-switch__core {
        background-color: #76ff03 !important;
        border-color: #76ff03 !important;
        box-shadow: 0 0 8px rgba(118, 255, 3, 0.4);
      }
      .el-switch__core {
        background-color: rgba(0, 0, 0, 0.4);
        border-color: #5e35b1;
      }
    }

    // ScSwitch 自定义组件适配
    .sc-switch-card, .visual-card {
      background: rgba(0, 0, 0, 0.2) !important;
      border: 1px solid rgba(94, 53, 177, 0.3) !important;
      
      &:hover {
        border-color: #76ff03 !important;
        background: rgba(0, 0, 0, 0.3) !important;
      }
      
      .label {
        color: #b39ddb !important;
      }
      
      .description {
        color: rgba(179, 157, 219, 0.6) !important;
      }
    }

    // Radio Button 单选按钮
    .el-radio-button__inner {
      background: transparent !important;
      border-color: #5e35b1 !important;
      color: #b39ddb !important;
      box-shadow: none !important;
    }
    .el-radio-button__original-radio:checked + .el-radio-button__inner {
      background-color: #ff7518 !important;
      border-color: #ff7518 !important;
      color: #fff !important;
      box-shadow: -1px 0 0 0 #ff7518 !important;
      text-shadow: 0 1px 2px rgba(0,0,0,0.3);
    }

    // Radio 普通单选
    .el-radio {
      color: #b39ddb !important;
      
      .el-radio__inner {
        background-color: transparent;
        border-color: #5e35b1;
      }
      
      &.is-checked {
        .el-radio__inner {
          background-color: #ff7518;
          border-color: #ff7518;
        }
        .el-radio__label {
          color: #ff7518 !important;
        }
      }
    }

    // Slider 滑块
    .el-slider {
      --el-slider-main-bg-color: #ff7518;
      --el-slider-runway-bg-color: rgba(255, 255, 255, 0.1);
      .el-slider__button {
        border-color: #ff7518;
        background-color: #2c003e;
        box-shadow: 0 0 0 2px #ff7518;
      }
      .el-slider__bar {
        background: linear-gradient(90deg, #ff7518, #ffab40);
      }
    }

    // Input Number 数字输入框
    .el-input-number {
      .el-input__wrapper {
        background-color: rgba(0, 0, 0, 0.2) !important;
        box-shadow: 0 0 0 1px #5e35b1 inset !important;
      }
      .el-input__inner {
        color: #fff !important;
      }
      .el-input-number__decrease, .el-input-number__increase {
        background: transparent !important;
        color: #ff7518 !important;
        border-color: #5e35b1 !important;
        &:hover {
          color: #76ff03 !important;
          background-color: rgba(118, 255, 3, 0.1) !important;
        }
      }
    }
    
    // 自定义数字输入控件适配
    .custom-number-input {
      background: rgba(0, 0, 0, 0.2);
      border: 1px solid #5e35b1;
      border-radius: 4px;
      
      .number-btn {
        color: #ff7518;
        &:hover {
          color: #76ff03;
          background: rgba(118, 255, 3, 0.1);
        }
        &:disabled {
          color: #666;
        }
      }
      
      .number-input {
        color: #fff;
        background: transparent;
      }
      
      .number-unit {
        color: #b39ddb;
      }
    }

    // Select 下拉选择
    .el-select {
      --el-select-border-color-hover: #ff7518;
      --el-select-input-focus-border-color: #ff7518;
      .el-input__wrapper {
        background-color: rgba(0, 0, 0, 0.2) !important;
        box-shadow: 0 0 0 1px #5e35b1 inset !important;
        &.is-focus {
          box-shadow: 0 0 0 1px #ff7518 inset !important;
        }
      }
      .el-input__inner {
        color: #fff !important;
      }
    }
    
    // Tooltips & Popups (全局覆盖，因为 tooltip 是挂载在 body 上的，但这里尽量在 scoped 内处理，如果不行可能需要全局样式)
    // 注意：el-tooltip__popper 通常在 body 下，所以这里的嵌套可能无效，除非 tooltip append-to 属性被设置。
    // 但 BaseSetting 中的 element 组件样式大部分是局部的。对于 dropdown/popper，可能需要额外的全局样式文件。
    // 这里主要处理面板内的元素。
    
    // 布局模式项
    .layout-mode-item {
      border-color: #5e35b1 !important;
      background: rgba(0, 0, 0, 0.2);
      
      &:hover {
        border-color: #ff7518 !important;
        box-shadow: 0 0 10px rgba(255, 117, 24, 0.3);
      }
      
      &.is-active {
        border-color: #76ff03 !important;
        background: rgba(118, 255, 3, 0.05);
        
        .layout-mode-badge {
          color: #76ff03;
        }
      }
      
      .layout-mode-name {
        color: #fff;
      }
      
      .layout-mode-desc {
        color: #b39ddb;
      }
    }
    
    // 主题颜色项
    .theme-color-item {
      border: 2px solid transparent;
      
      &.is-selected {
        border-color: #76ff03;
        box-shadow: 0 0 8px rgba(118, 255, 3, 0.6);
      }
    }

    // --- 新增组件适配 ---

    // ScCard 卡片
    .sc-card {
      background: rgba(44, 0, 62, 0.6) !important;
      border: 1px solid rgba(94, 53, 177, 0.3) !important;
      color: #b39ddb;
      
      .sc-card-header {
        border-bottom: 1px solid rgba(94, 53, 177, 0.3);
        color: #ff7518;
        font-family: 'Creepster', 'cursive', sans-serif;
        
        .label {
          color: #ff7518 !important;
        }
      }
      
      .sc-card-body {
        color: #b39ddb;
      }
    }

    // Avatar 头像
    .el-avatar {
      border: 2px solid #ff7518;
      box-shadow: 0 0 8px rgba(255, 117, 24, 0.4);
      transition: all 0.3s ease;
      
      &:hover {
        transform: scale(1.1) rotate(5deg);
        border-color: #76ff03;
        box-shadow: 0 0 12px rgba(118, 255, 3, 0.6);
      }
    }
  }

  // --- 全局弹出层适配 (Dropdown, Select, Tooltip) ---
  // 这些元素通常挂载在 body 上，需要全局选择器覆盖
  .el-popper, .el-dropdown__popper, .el-select__popper, .el-tooltip__popper {
    background: linear-gradient(180deg, #2c003e 0%, #1a0026 100%) !important;
    border: 1px solid #5e35b1 !important;
    /* 蜘蛛网背景纹理 */
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Cpath d='M50 50 L 0 0 M 50 50 L 100 0 M 50 50 L 100 100 M 50 50 L 0 100' stroke='%234a148c' stroke-width='1' opacity='0.2'/%3E%3Ccircle cx='50' cy='50' r='30' stroke='%234a148c' stroke-width='1' fill='none' opacity='0.2'/%3E%3C/svg%3E") !important;
    background-size: 50px 50px !important;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.6) !important;
    
    .el-dropdown-menu, .el-select-dropdown__list {
      background: transparent !important;
    }

    .el-dropdown-menu__item, .el-select-dropdown__item {
      color: #b39ddb !important;
      
      &:hover, &.is-active {
        background-color: rgba(118, 255, 3, 0.15) !important;
        color: #76ff03 !important;
      }
      
      &.is-disabled {
        color: rgba(179, 157, 219, 0.3) !important;
      }
    }
    
    .el-popper__arrow::before {
      background: #2c003e !important;
      border: 1px solid #5e35b1 !important;
    }
  }
}
</style>
