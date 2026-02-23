<script setup lang="ts">
import BaseTool from './BaseTool.vue';
</script>

<template>
  <div class="future-tech-tool-wrapper">
    <BaseTool theme-class="future-tech-tool" />
  </div>
</template>

<style lang="scss" scoped>
.future-tech-tool-wrapper {
  :deep(.future-tech-tool) {
    // 工具按钮 - 科技感发光边框和背景
    .tool-item {
      color: #00ffff !important;
      background: linear-gradient(135deg, rgba(5, 10, 31, 0.9), rgba(10, 26, 58, 0.85)) !important;
      border: 2px solid rgba(0, 255, 255, 0.4) !important;
      box-shadow: 
        0 0 10px rgba(0, 255, 255, 0.3),
        inset 0 0 10px rgba(0, 255, 255, 0.05),
        0 2px 8px rgba(0, 0, 0, 0.3) !important;
      backdrop-filter: blur(10px);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      overflow: hidden;

      // 网格背景
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
        background-size: 10px 10px;
        opacity: 0.3;
        pointer-events: none;
      }

      // 扫描线效果
      &::after {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(0, 255, 255, 0.3), transparent);
        animation: scan 3s linear infinite;
      }

      svg {
        color: #00ffff !important;
        filter: drop-shadow(0 0 5px rgba(0, 255, 255, 0.6));
        position: relative;
        z-index: 1;
        transition: all 0.3s ease;
      }

      &:hover {
        background: linear-gradient(135deg, rgba(0, 255, 255, 0.15), rgba(5, 10, 31, 0.9)) !important;
        color: #00ffff !important;
        border-color: rgba(0, 255, 255, 0.8) !important;
        transform: translateY(-2px) scale(1.05) !important;
        box-shadow: 
          0 0 20px rgba(0, 255, 255, 0.5),
          inset 0 0 15px rgba(0, 255, 255, 0.1),
          0 4px 16px rgba(0, 0, 0, 0.4) !important;

        svg {
          color: #00ffff !important;
          filter: drop-shadow(0 0 10px rgba(0, 255, 255, 0.9));
          transform: scale(1.1);
        }
        
        &::after {
          animation-duration: 1.5s;
        }
      }

      &:active {
        transform: translateY(0) scale(1) !important;
        box-shadow: 
          0 0 15px rgba(0, 255, 255, 0.4),
          inset 0 0 10px rgba(0, 255, 255, 0.1) !important;
      }
    }

    // 设置按钮特殊样式
    .fu-setting {
      color: #00ffff !important;
      background: linear-gradient(135deg, rgba(5, 10, 31, 0.9), rgba(10, 26, 58, 0.85)) !important;
      border: 2px solid rgba(0, 255, 255, 0.4) !important;
      text-shadow: 
        0 0 10px rgba(0, 255, 255, 0.8),
        0 0 20px rgba(0, 255, 255, 0.4),
        0 2px 4px rgba(0, 0, 0, 0.5) !important;
      box-shadow: 
        0 0 10px rgba(0, 255, 255, 0.3),
        inset 0 0 10px rgba(0, 255, 255, 0.05) !important;
      backdrop-filter: blur(10px);
      font-family: 'Courier New', 'Monaco', monospace;
      letter-spacing: 1px;
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
        background-size: 10px 10px;
        opacity: 0.3;
      }

      &:hover {
        background: linear-gradient(135deg, rgba(0, 255, 255, 0.15), rgba(5, 10, 31, 0.9)) !important;
        color: #00ffff !important;
        border-color: rgba(0, 255, 255, 0.8) !important;
        box-shadow: 
          0 0 20px rgba(0, 255, 255, 0.5),
          inset 0 0 15px rgba(0, 255, 255, 0.1) !important;
        text-shadow: 
          0 0 15px rgba(0, 255, 255, 1),
          0 0 25px rgba(0, 255, 255, 0.6) !important;
      }
    }

    // 语言选择触发器
    .lang-style {
      .lang-icon-wrapper {
        background: linear-gradient(135deg, rgba(5, 10, 31, 0.9), rgba(10, 26, 58, 0.85)) !important;
        border: 2px solid rgba(0, 255, 255, 0.4) !important;
        box-shadow: 
          0 0 10px rgba(0, 255, 255, 0.3),
          0 0 0 2px rgba(0, 255, 255, 0.1) !important;
        backdrop-filter: blur(10px);
        transition: all 0.3s ease;

        .lang-main-icon {
          color: #00ffff !important;
          filter: drop-shadow(0 0 5px rgba(0, 255, 255, 0.6));
        }
        
        &:hover {
          border-color: rgba(0, 255, 255, 0.7) !important;
          box-shadow: 
            0 0 15px rgba(0, 255, 255, 0.5),
            0 0 0 2px rgba(0, 255, 255, 0.2) !important;
        }
      }
    }

    // 用户触发器
    .user-trigger {
      background: linear-gradient(135deg, rgba(5, 10, 31, 0.85), rgba(10, 26, 58, 0.8)) !important;
      border: 2px solid rgba(0, 255, 255, 0.4) !important;
      box-shadow: 
        0 0 10px rgba(0, 255, 255, 0.3),
        inset 0 0 10px rgba(0, 255, 255, 0.05) !important;
      backdrop-filter: blur(10px);
      transition: all 0.3s ease;

      &:hover {
        background: linear-gradient(135deg, rgba(0, 255, 255, 0.1), rgba(5, 10, 31, 0.85)) !important;
        border-color: rgba(0, 255, 255, 0.7) !important;
        box-shadow: 
          0 0 20px rgba(0, 255, 255, 0.5),
          inset 0 0 15px rgba(0, 255, 255, 0.1) !important;
      }

      .avatar-img {
        border-color: rgba(0, 255, 255, 0.6) !important;
        box-shadow: 
          0 0 10px rgba(0, 255, 255, 0.4),
          0 0 0 2px rgba(0, 255, 255, 0.2) !important;
      }

      .user-name {
        color: #00ffff !important;
        text-shadow: 0 0 8px rgba(0, 255, 255, 0.6);
      }

      .user-role {
        color: rgba(0, 255, 255, 0.8) !important;
        text-shadow: 0 0 5px rgba(0, 255, 255, 0.4);
      }

      .status-dot {
        background: linear-gradient(135deg, #00ffff, #00cccc) !important;
        border-color: rgba(5, 10, 31, 0.9) !important;
        box-shadow: 
          0 0 10px rgba(0, 255, 255, 0.6),
          0 0 0 2px rgba(0, 255, 255, 0.2) !important;
      }

      .dropdown-arrow-wrapper {
        background: linear-gradient(135deg, rgba(0, 255, 255, 0.1), rgba(5, 10, 31, 0.2)) !important;
        border-left: 1px solid rgba(0, 255, 255, 0.3);

        .dropdown-arrow {
          color: rgba(0, 255, 255, 0.7) !important;
          filter: drop-shadow(0 0 3px rgba(0, 255, 255, 0.5));
        }
      }

      &:hover .dropdown-arrow-wrapper {
        background: linear-gradient(135deg, rgba(0, 255, 255, 0.2), rgba(5, 10, 31, 0.3)) !important;

        .dropdown-arrow {
          color: #00ffff !important;
          filter: drop-shadow(0 0 5px rgba(0, 255, 255, 0.8));
        }
      }
    }
  }
}

// 扫描动画
@keyframes scan {
  0% {
    left: -100%;
  }
  100% {
    left: 100%;
  }
}
</style>

