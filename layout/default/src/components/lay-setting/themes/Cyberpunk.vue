<script setup lang="ts">
import BaseSetting from './BaseSetting.vue';
</script>

<template>
  <div class="cyberpunk-setting">
    <BaseSetting />
  </div>
</template>

<style lang="scss" scoped>
// 赛博朋克主题颜色变量
$cyber-cyan: #00ffff;
$cyber-magenta: #ff00ff;
$cyber-dark: #0a0a12;
$cyber-dark-light: #12121f;
$cyber-glass: rgba(10, 10, 18, 0.95);
$cyber-border: rgba(0, 255, 255, 0.25);
$cyber-border-hover: rgba(0, 255, 255, 0.45);

.cyberpunk-setting {
  width: 100%;
  height: 100%;

  // 使用 :deep() 穿透 BaseSetting 的 scoped 样式
  // 容器背景
  :deep(.modern-setting-container) {
    background: linear-gradient(
      135deg,
      rgba(10, 14, 25, 0.98) 0%,
      rgba(15, 20, 35, 0.98) 100%
    ) !important;
    box-shadow:
      0 0 40px rgba(0, 255, 255, 0.1),
      0 0 80px rgba(255, 0, 255, 0.05),
      0 20px 60px rgba(0, 0, 0, 0.5) !important;
    
    // 顶部霓虹渐变线
    &::before {
      background: linear-gradient(
        90deg,
        transparent 0%,
        $cyber-cyan 20%,
        $cyber-magenta 50%,
        $cyber-cyan 80%,
        transparent 100%
      ) !important;
      height: 2px !important;
      box-shadow: 0 0 15px rgba(0, 255, 255, 0.6);
      animation: cyber-neon-pulse 2s ease-in-out infinite;
    }
    
    // 背景纹理 - 扫描线
    &::after {
      background: repeating-linear-gradient(
        0deg,
        transparent,
        transparent 2px,
        rgba(0, 255, 255, 0.02) 2px,
        rgba(0, 255, 255, 0.02) 4px
      ) !important;
      opacity: 1 !important;
      animation: none !important;
    }
  }

  // 设置区域卡片
  :deep(.setting-section) {
    background: $cyber-glass !important;
    border: 1px solid $cyber-border !important;
    border-radius: 12px !important;
    backdrop-filter: blur(16px);
    box-shadow:
      0 0 20px rgba(0, 255, 255, 0.1),
      inset 0 0 30px rgba(0, 255, 255, 0.03) !important;
    
    // 顶部霓虹线
    &::before {
      background: linear-gradient(
        90deg,
        transparent 0%,
        rgba($cyber-cyan, 0.5) 20%,
        $cyber-magenta 50%,
        rgba($cyber-cyan, 0.5) 80%,
        transparent 100%
      ) !important;
      height: 1px !important;
      opacity: 1 !important;
    }
    
    &:hover {
      border-color: $cyber-border-hover !important;
      box-shadow:
        0 0 30px rgba(0, 255, 255, 0.2),
        0 0 60px rgba(255, 0, 255, 0.1),
        inset 0 0 40px rgba(0, 255, 255, 0.05) !important;
      transform: translateY(-4px) scale(1.01) !important;
      
      &::before {
        opacity: 1 !important;
        background: linear-gradient(
          90deg,
          transparent 0%,
          $cyber-cyan 20%,
          $cyber-magenta 50%,
          $cyber-cyan 80%,
          transparent 100%
        ) !important;
      }
    }
  }

  // 区域标题
  :deep(.section-header) {
    border-bottom-color: $cyber-border !important;
    
    .section-icon {
      color: $cyber-cyan !important;
      background: rgba(0, 255, 255, 0.1) !important;
      border: 1px solid $cyber-border;
      box-shadow:
        0 0 15px rgba(0, 255, 255, 0.2),
        inset 0 0 10px rgba(0, 255, 255, 0.05) !important;
      
      &:hover {
        background: rgba(0, 255, 255, 0.15) !important;
        box-shadow:
          0 0 20px rgba(0, 255, 255, 0.4),
          inset 0 0 15px rgba(0, 255, 255, 0.1) !important;
        transform: translateY(-2px) scale(1.08) !important;
      }
    }
    
    .section-title {
      color: $cyber-cyan !important;
      text-shadow: 0 0 10px rgba(0, 255, 255, 0.3);
      font-family: 'Rajdhani', 'Roboto', sans-serif;
      letter-spacing: 1px;
      
      &:hover {
        color: #fff !important;
        text-shadow: 0 0 15px rgba(0, 255, 255, 0.6);
      }
    }
    
    .section-description {
      color: rgba(0, 255, 255, 0.6) !important;
    }
    
    // 装饰线
    &::after {
      background: linear-gradient(
        90deg,
        $cyber-cyan 0%,
        $cyber-magenta 50%,
        $cyber-cyan 100%
      ) !important;
      box-shadow: 0 0 10px rgba(0, 255, 255, 0.5);
    }
  }

  // Segmented 组件
  :deep(.layui-segmented) {
    background: rgba(10, 10, 18, 0.8) !important;
    border: 1px solid $cyber-border !important;
    border-radius: 10px !important;
    box-shadow: inset 0 0 20px rgba(0, 255, 255, 0.05) !important;
    
    .layui-segmented-item {
      color: $cyber-cyan !important;
      border-radius: 8px !important;
      font-family: 'Rajdhani', 'Roboto', sans-serif;
      
      &:hover {
        background: rgba(0, 255, 255, 0.1) !important;
        color: #fff !important;
        box-shadow: 0 0 15px rgba(0, 255, 255, 0.2) !important;
      }
      
      &.layui-segmented-checked {
        background: linear-gradient(
          135deg,
          rgba(0, 255, 255, 0.2) 0%,
          rgba(255, 0, 255, 0.12) 100%
        ) !important;
        color: #fff !important;
        border: 1px solid $cyber-cyan !important;
        box-shadow:
          0 0 20px rgba(0, 255, 255, 0.3),
          0 0 40px rgba(255, 0, 255, 0.15),
          inset 0 0 15px rgba(0, 255, 255, 0.1) !important;
        text-shadow: 0 0 8px rgba(0, 255, 255, 0.5);
      }
    }
  }

  // 主题颜色选择
  :deep(.theme-color-grid) {
    .theme-color-item {
      border: 2px solid transparent !important;
      box-shadow: 0 0 10px rgba(0, 0, 0, 0.3) !important;
      
      &:hover {
        box-shadow:
          0 0 20px rgba(0, 255, 255, 0.4),
          0 0 40px rgba(255, 0, 255, 0.2) !important;
        transform: translateY(-4px) scale(1.1) !important;
      }
      
      &.is-selected {
        border-color: $cyber-cyan !important;
        box-shadow:
          0 0 0 3px rgba(0, 255, 255, 0.3),
          0 0 25px rgba(0, 255, 255, 0.5),
          0 0 50px rgba(255, 0, 255, 0.3) !important;
        animation: cyber-color-pulse 2s ease-in-out infinite;
      }
    }
  }

  // 开关卡片
  :deep(.sc-switch-visual-card) {
    background: rgba(10, 10, 18, 0.7) !important;
    border: 1px solid $cyber-border !important;
    
    .switch-label {
      color: $cyber-cyan !important;
    }
    
    .switch-description {
      color: rgba(0, 255, 255, 0.5) !important;
    }
    
    &:hover {
      border-color: $cyber-border-hover !important;
      box-shadow:
        0 0 20px rgba(0, 255, 255, 0.2),
        inset 0 0 15px rgba(0, 255, 255, 0.03) !important;
    }
    
    &.is-active {
      border-color: $cyber-cyan !important;
      background: linear-gradient(
        135deg,
        rgba(0, 255, 255, 0.12) 0%,
        rgba(255, 0, 255, 0.08) 100%
      ) !important;
      box-shadow:
        0 0 25px rgba(0, 255, 255, 0.3),
        inset 0 0 20px rgba(0, 255, 255, 0.05) !important;
      
      .switch-label {
        color: #fff !important;
        text-shadow: 0 0 8px rgba(0, 255, 255, 0.5);
      }
    }
  }

  // 布局模式卡片
  :deep(.layout-mode-grid) {
    .layout-mode-item {
      background: rgba(10, 10, 18, 0.7) !important;
      border: 1px solid $cyber-border !important;
      
      .layout-mode-name {
        color: $cyber-cyan !important;
      }
      
      .layout-mode-desc {
        color: rgba(0, 255, 255, 0.5) !important;
      }
      
      &:hover {
        border-color: $cyber-border-hover !important;
        box-shadow:
          0 0 25px rgba(0, 255, 255, 0.25),
          inset 0 0 20px rgba(0, 255, 255, 0.03) !important;
        transform: translateY(-4px) !important;
        
        .layout-mode-name {
          color: #fff !important;
          text-shadow: 0 0 8px rgba(0, 255, 255, 0.5);
        }
      }
      
      &.is-active {
        border-color: $cyber-cyan !important;
        background: linear-gradient(
          135deg,
          rgba(0, 255, 255, 0.15) 0%,
          rgba(255, 0, 255, 0.1) 100%
        ) !important;
        box-shadow:
          0 0 30px rgba(0, 255, 255, 0.35),
          0 0 60px rgba(255, 0, 255, 0.2),
          inset 0 0 25px rgba(0, 255, 255, 0.05) !important;
        
        .layout-mode-badge {
          background: linear-gradient(135deg, $cyber-cyan, $cyber-magenta) !important;
          box-shadow: 0 0 15px rgba(0, 255, 255, 0.5) !important;
        }
        
        .layout-mode-name {
          color: #fff !important;
          text-shadow: 0 0 10px rgba(0, 255, 255, 0.6);
        }
      }
    }
  }

  // 分组标题
  :deep(.group-title) {
    color: $cyber-cyan !important;
    
    .group-icon {
      color: $cyber-magenta !important;
      filter: drop-shadow(0 0 5px rgba(255, 0, 255, 0.4));
    }
  }

  // 输入框
  :deep(.el-input),
  :deep(.el-input-number) {
    .el-input__wrapper {
      background: rgba(10, 10, 18, 0.8) !important;
      border: 1px solid $cyber-border !important;
      box-shadow: inset 0 0 10px rgba(0, 255, 255, 0.05) !important;
      
      &:hover {
        border-color: $cyber-border-hover !important;
      }
      
      &.is-focus {
        border-color: $cyber-cyan !important;
        box-shadow:
          0 0 15px rgba(0, 255, 255, 0.2),
          inset 0 0 15px rgba(0, 255, 255, 0.05) !important;
      }
    }
    
    .el-input__inner {
      color: $cyber-cyan !important;
    }
  }

  // 重置按钮
  :deep(.reset-actions) {
    .el-button {
      background: rgba(10, 10, 18, 0.8) !important;
      border: 1px solid $cyber-border !important;
      color: $cyber-cyan !important;
      
      &:hover {
        background: rgba(0, 255, 255, 0.1) !important;
        border-color: $cyber-cyan !important;
        color: #fff !important;
        box-shadow: 0 0 20px rgba(0, 255, 255, 0.3) !important;
      }
      
      &.el-button--warning {
        border-color: rgba($cyber-magenta, 0.5) !important;
        color: $cyber-magenta !important;
        
        &:hover {
          background: rgba($cyber-magenta, 0.1) !important;
          border-color: $cyber-magenta !important;
          color: #fff !important;
          box-shadow: 0 0 20px rgba($cyber-magenta, 0.3) !important;
        }
      }
      
      &.el-button--success {
        border-color: rgba($cyber-cyan, 0.5) !important;
        
        &:hover {
          background: rgba($cyber-cyan, 0.1) !important;
          border-color: $cyber-cyan !important;
          box-shadow: 0 0 20px rgba($cyber-cyan, 0.3) !important;
        }
      }
    }
  }

  // 数字输入框
  :deep(.custom-number-input) {
    .number-btn {
      background: rgba(10, 10, 18, 0.8) !important;
      border: 1px solid $cyber-border !important;
      color: $cyber-cyan !important;
      
      &:hover:not(:disabled) {
        background: rgba(0, 255, 255, 0.1) !important;
        border-color: $cyber-cyan !important;
        box-shadow: 0 0 15px rgba(0, 255, 255, 0.3) !important;
      }
    }
    
    .number-display {
      background: rgba(10, 10, 18, 0.8) !important;
      border: 1px solid $cyber-border !important;
      
      .number-input {
        color: $cyber-cyan !important;
      }
      
      .number-unit {
        color: rgba(0, 255, 255, 0.5) !important;
      }
    }
  }

  // 参数标签
  :deep(.param-label) {
    color: $cyber-cyan !important;
  }

  // 输入项标签
  :deep(.input-label) {
    color: $cyber-cyan !important;
  }
  
  :deep(.input-desc) {
    color: rgba(0, 255, 255, 0.5) !important;
  }

  // Radio 组件
  :deep(.el-radio-group) {
    .el-radio {
      color: $cyber-cyan !important;
      
      .el-radio__input {
        .el-radio__inner {
          border-color: $cyber-border !important;
          background: rgba(10, 10, 18, 0.8) !important;
        }
        
        &.is-checked .el-radio__inner {
          border-color: $cyber-cyan !important;
          background: $cyber-cyan !important;
          box-shadow: 0 0 10px rgba(0, 255, 255, 0.5) !important;
        }
      }
      
      .el-radio__label {
        color: $cyber-cyan !important;
      }
    }
  }

  // Tooltip
  :deep(.el-tooltip__trigger) {
    color: $cyber-cyan !important;
  }

  // 设置内容区域
  :deep(.setting-content) {
    color: $cyber-cyan;
  }

  // 开关组件网格
  :deep(.switch-card-grid) {
    .sc-switch-visual-card {
      background: rgba(10, 10, 18, 0.7) !important;
      border: 1px solid $cyber-border !important;
      
      .switch-label {
        color: $cyber-cyan !important;
      }
      
      .switch-description {
        color: rgba(0, 255, 255, 0.5) !important;
      }
      
      &:hover {
        border-color: $cyber-border-hover !important;
        box-shadow: 0 0 20px rgba(0, 255, 255, 0.2) !important;
      }
      
      &.is-active {
        border-color: $cyber-cyan !important;
        background: linear-gradient(135deg, rgba(0, 255, 255, 0.12) 0%, rgba(255, 0, 255, 0.08) 100%) !important;
        box-shadow: 0 0 25px rgba(0, 255, 255, 0.3) !important;
        
        .switch-label {
          color: #fff !important;
          text-shadow: 0 0 8px rgba(0, 255, 255, 0.5);
        }
      }
    }
  }

  // 设置分组
  :deep(.setting-group) {
    h4.group-title {
      color: $cyber-cyan !important;
      text-shadow: 0 0 8px rgba(0, 255, 255, 0.3);
      
      .group-icon {
        color: $cyber-magenta !important;
        filter: drop-shadow(0 0 5px rgba(255, 0, 255, 0.4));
      }
    }
  }

  // 布局参数网格
  :deep(.layout-params-grid) {
    .param-item {
      .param-label {
        color: $cyber-cyan !important;
      }
    }
  }

  // 拉伸按钮
  :deep(.stretch-button) {
    background: rgba(10, 10, 18, 0.8) !important;
    border: 1px solid $cyber-border !important;
    
    &:hover {
      border-color: $cyber-cyan !important;
      box-shadow: 0 0 15px rgba(0, 255, 255, 0.3) !important;
    }
    
    .stretch-indicator {
      background: linear-gradient(90deg, $cyber-cyan, $cyber-magenta) !important;
      
      svg {
        color: #fff !important;
      }
      
      .stretch-line {
        background: rgba(255, 255, 255, 0.8) !important;
      }
    }
  }

  // AI 主题网格
  :deep(.ai-theme-grid) {
    .ai-theme-item {
      background: rgba(10, 10, 18, 0.7) !important;
      border: 1px solid $cyber-border !important;
      
      .ai-theme-label {
        color: $cyber-cyan !important;
      }
      
      &:hover {
        border-color: $cyber-border-hover !important;
        box-shadow: 0 0 20px rgba(0, 255, 255, 0.2) !important;
      }
      
      &.is-active {
        border-color: $cyber-cyan !important;
        box-shadow: 0 0 25px rgba(0, 255, 255, 0.4) !important;
        
        .ai-theme-label {
          color: #fff !important;
          text-shadow: 0 0 8px rgba(0, 255, 255, 0.5);
        }
        
        .ai-theme-check {
          background: linear-gradient(135deg, $cyber-cyan, $cyber-magenta) !important;
          box-shadow: 0 0 10px rgba(0, 255, 255, 0.5) !important;
        }
      }
    }
  }

  // 节日主题区域
  :deep(.festival-themes-section) {
    .theme-switcher-item {
      background: rgba(10, 10, 18, 0.7) !important;
      border: 1px solid $cyber-border !important;
      
      &:hover {
        border-color: $cyber-border-hover !important;
        box-shadow: 0 0 20px rgba(0, 255, 255, 0.2) !important;
      }
      
      &.is-active {
        border-color: $cyber-cyan !important;
        box-shadow: 0 0 25px rgba(0, 255, 255, 0.4) !important;
      }
    }
  }

  // 自动主题状态卡片
  :deep(.auto-theme-status) {
    .status-card {
      background: rgba(10, 10, 18, 0.7) !important;
      border: 1px solid $cyber-border !important;
      
      .status-icon {
        color: $cyber-cyan !important;
        background: rgba(0, 255, 255, 0.1) !important;
      }
      
      .status-title {
        color: $cyber-cyan !important;
      }
      
      .status-desc {
        color: rgba(0, 255, 255, 0.6) !important;
      }
      
      .status-current {
        .label {
          color: rgba(0, 255, 255, 0.6) !important;
        }
        .value {
          color: $cyber-magenta !important;
        }
      }
    }
  }

  // 节日装饰提示
  :deep(.festival-decoration-tip) {
    background: rgba(10, 10, 18, 0.7) !important;
    border: 1px solid rgba(255, 0, 255, 0.3) !important;
    color: rgba(255, 0, 255, 0.8) !important;
    
    .tip-icon {
      color: $cyber-magenta !important;
    }
  }

  // 新菜单设置区域
  :deep(.new-menu-settings) {
    .input-item {
      .input-label {
        color: $cyber-cyan !important;
      }
      
      .input-desc {
        color: rgba(0, 255, 255, 0.5) !important;
      }
    }
  }

  // Element Plus 选择器
  :deep(.el-select) {
    .el-select__wrapper {
      background: rgba(10, 10, 18, 0.8) !important;
      border: 1px solid $cyber-border !important;
      box-shadow: none !important;
      
      &:hover {
        border-color: $cyber-border-hover !important;
      }
      
      &.is-focus {
        border-color: $cyber-cyan !important;
        box-shadow: 0 0 15px rgba(0, 255, 255, 0.2) !important;
      }
    }
    
    .el-select__selected-item {
      color: $cyber-cyan !important;
    }
    
    .el-select__suffix {
      color: $cyber-cyan !important;
    }
  }

  // Element Plus 开关
  :deep(.el-switch) {
    .el-switch__core {
      background: rgba(10, 10, 18, 0.8) !important;
      border: 1px solid $cyber-border !important;
    }
    
    &.is-checked .el-switch__core {
      background: linear-gradient(90deg, $cyber-cyan, $cyber-magenta) !important;
      border-color: $cyber-cyan !important;
      box-shadow: 0 0 15px rgba(0, 255, 255, 0.4) !important;
    }
  }

  // 所有文本颜色
  :deep(label),
  :deep(.label) {
    color: $cyber-cyan !important;
  }

  :deep(.description),
  :deep(.desc) {
    color: rgba(0, 255, 255, 0.5) !important;
  }
}

// 动画 - 需要放在 scoped 外面或使用 :global
@keyframes cyber-neon-pulse {
  0%, 100% {
    opacity: 1;
    box-shadow: 0 0 15px rgba(0, 255, 255, 0.6);
  }
  50% {
    opacity: 0.8;
    box-shadow: 0 0 25px rgba(0, 255, 255, 0.8), 0 0 40px rgba(255, 0, 255, 0.4);
  }
}

@keyframes cyber-color-pulse {
  0%, 100% {
    box-shadow:
      0 0 0 3px rgba(0, 255, 255, 0.3),
      0 0 25px rgba(0, 255, 255, 0.5),
      0 0 50px rgba(255, 0, 255, 0.3);
  }
  50% {
    box-shadow:
      0 0 0 4px rgba(0, 255, 255, 0.4),
      0 0 35px rgba(0, 255, 255, 0.6),
      0 0 70px rgba(255, 0, 255, 0.4);
  }
}
</style>
