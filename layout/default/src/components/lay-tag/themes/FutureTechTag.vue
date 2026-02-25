<script setup lang="ts">
/**
 * 未来科技主题标签组件
 * 基于通用 BaseTag，主要通过主题类名和样式实现科幻视觉效果
 */
import BaseTag from "./BaseTag.vue";
</script>

<template>
  <BaseTag theme-class="future-tech-tag" />
</template>

<style lang="scss">
html[data-skin="future-tech"],
html.theme-future-tech {
  .tags-view.future-tech-tag {
    background: linear-gradient(
      135deg,
      rgba(5, 10, 31, 0.98),
      rgba(10, 26, 58, 0.95)
    ) !important;
    border-bottom: 1px solid rgba(0, 255, 255, 0.45) !important;
    box-shadow:
      0 0 20px rgba(0, 255, 255, 0.3),
      0 10px 40px rgba(0, 0, 0, 0.85) !important;
    backdrop-filter: blur(18px);
    position: relative;
    overflow: hidden;

    // 网格背景
    &::before {
      content: "";
      position: absolute;
      inset: 0;
      background-image:
        linear-gradient(rgba(0, 255, 255, 0.05) 1px, transparent 1px),
        linear-gradient(90deg, rgba(0, 255, 255, 0.05) 1px, transparent 1px);
      background-size: 14px 14px;
      opacity: 0.35;
      pointer-events: none;
    }

    // 顶部扫描线
    &::after {
      content: "";
      position: absolute;
      top: 0;
      left: -40%;
      width: 40%;
      height: 2px;
      background: linear-gradient(
        90deg,
        transparent,
        rgba(0, 255, 255, 0.9),
        transparent
      );
      animation: ft-tag-scan 3s linear infinite;
    }
  }

  .tags-view.future-tech-tag .scroll-item {
    position: relative;
    background: linear-gradient(
      135deg,
      rgba(0, 255, 255, 0.05),
      rgba(5, 10, 31, 0.9)
    ) !important;
    border-radius: 10px !important;
    border: 1px solid rgba(0, 255, 255, 0.35) !important;
    color: #e5ffff !important;
    text-shadow: 0 0 6px rgba(0, 255, 255, 0.6);
    box-shadow:
      0 0 12px rgba(0, 255, 255, 0.3),
      inset 0 0 8px rgba(0, 255, 255, 0.08) !important;
    overflow: hidden;
    backdrop-filter: blur(8px);

    &::before {
      content: "";
      position: absolute;
      inset: 0;
      background-image:
        linear-gradient(rgba(0, 255, 255, 0.06) 1px, transparent 1px),
        linear-gradient(90deg, rgba(0, 255, 255, 0.06) 1px, transparent 1px);
      background-size: 10px 10px;
      opacity: 0.25;
      pointer-events: none;
    }
  }

  .tags-view.future-tech-tag .scroll-item.is-active,
  .tags-view.future-tech-tag .scroll-item.active {
    background: linear-gradient(135deg, #00ffff, #4dfdfd) !important;
    color: #050a1f !important;
    border-color: rgba(0, 255, 255, 0.9) !important;
    text-shadow: none;
    box-shadow:
      0 0 24px rgba(0, 255, 255, 0.6),
      0 0 40px rgba(0, 255, 255, 0.35) !important;
  }

  .tags-view.future-tech-tag .tag-title {
    position: relative;
    z-index: 1;
    font-weight: 600;
    letter-spacing: 0.5px;
  }

  .tags-view.future-tech-tag .tag-icon {
    color: inherit !important;
    filter: drop-shadow(0 0 6px rgba(0, 255, 255, 0.8));
  }

  .tags-view.future-tech-tag .el-icon-close,
  .tags-view.future-tech-tag .chrome-close-btn {
    color: inherit !important;
    opacity: 0.85;
    transition: all 0.2s ease;
  }

  .tags-view.future-tech-tag .el-icon-close:hover,
  .tags-view.future-tech-tag .chrome-close-btn:hover {
    transform: scale(1.1);
    text-shadow: 0 0 8px rgba(0, 255, 255, 0.9);
  }

  .tags-view.future-tech-tag .arrow-left,
  .tags-view.future-tech-tag .arrow-right {
    background: rgba(5, 10, 31, 0.8) !important;
    border: 1px solid rgba(0, 255, 255, 0.45) !important;
    color: #00ffff !important;
    box-shadow: 0 0 10px rgba(0, 255, 255, 0.4);
  }
}

@keyframes ft-tag-scan {
  0% {
    left: -40%;
  }
  100% {
    left: 140%;
  }
}
</style>


