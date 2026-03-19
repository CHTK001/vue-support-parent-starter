<script setup lang="ts">
/**
 * 未来科技主题专属标签组件
 * 霓虹光效风格
 */
import BaseTag from './BaseTag.vue';
</script>

<template>
  <BaseTag theme-class="future-tech-tag" />
</template>

<style lang="scss">
@use './default.scss';

.future-tech-tag {
  background:
    linear-gradient(180deg, rgba(8, 24, 16, 0.98), rgba(10, 28, 18, 0.94)) !important;
  border-bottom: 1px solid rgba(91, 151, 108, 0.42) !important;
  box-shadow: 0 10px 24px -20px rgba(0, 0, 0, 0.58) !important;

  .scroll-item {
    position: relative;
    background:
      linear-gradient(135deg, rgba(13, 34, 24, 0.92), rgba(8, 20, 14, 0.88));
    border: 1px solid rgba(91, 151, 108, 0.28);
    box-shadow:
      0 10px 22px -18px rgba(0, 0, 0, 0.58),
      inset 0 0 0 1px rgba(243, 210, 122, 0.05);
    transition:
      background 0.18s ease,
      border-color 0.18s ease,
      box-shadow 0.18s ease,
      transform 0.18s ease;

    &::before {
      content: '';
      position: absolute;
      inset: 1px;
      border-radius: inherit;
      background: linear-gradient(
        135deg,
        rgba(243, 210, 122, 0.08),
        transparent 52%
      );
      pointer-events: none;
      opacity: 0.85;
    }

    &:hover {
      background:
        linear-gradient(135deg, rgba(19, 50, 33, 0.96), rgba(10, 25, 17, 0.94));
      border-color: rgba(243, 210, 122, 0.24);
      box-shadow:
        0 14px 30px -24px rgba(0, 0, 0, 0.66),
        inset 0 0 0 1px rgba(243, 210, 122, 0.08);
      transform: translateY(-1px);
    }

    &.active,
    &.is-active {
      background:
        linear-gradient(135deg, rgba(26, 64, 42, 0.98), rgba(13, 34, 24, 0.94));
      border-color: rgba(243, 210, 122, 0.46);
      box-shadow:
        0 16px 34px -24px rgba(0, 0, 0, 0.72),
        inset 0 0 0 1px rgba(243, 210, 122, 0.12);

      .tag-title {
        color: #f3d27a;
        text-shadow: none;
      }
    }

    .tag-title {
      color: rgba(243, 210, 122, 0.92);
      font-family: "Rajdhani", "Orbitron", "Consolas", sans-serif;
      font-weight: 600;
      letter-spacing: 0.04em;
      text-shadow: none;
    }

    .el-icon-close {
      color: rgba(243, 210, 122, 0.74);
      
      &:hover {
        color: #ffe7a4;
        text-shadow: none;
      }
    }
  }
}
</style>
