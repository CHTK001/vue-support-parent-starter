<script setup lang="ts">
import BaseBreadcrumb from './BaseBreadcrumb.vue';
</script>

<template>
  <BaseBreadcrumb theme-class="pixel-art-breadcrumb" />
</template>

<style lang="scss">
// 像素艺术主题面包屑样式
.pixel-art-breadcrumb {
  font-family: "Pixel CN", "Press Start 2P", "Courier New", Courier, monospace !important;
  background: #1a1a2e !important;
  border: 2px solid #4a4a6e !important;
  border-radius: 0 !important;
  padding: 0 8px !important;
  box-shadow: 
    0 0 0 2px #2a2a4e,
    4px 4px 0 0 #0a0a1e !important;
  
  // 像素艺术风格的边框效果
  &::before {
    content: '';
    position: absolute;
    top: -2px;
    left: -2px;
    right: -2px;
    bottom: -2px;
    background: linear-gradient(90deg, #6a6a8e 0%, #4a4a6e 50%, #6a6a8e 100%);
    z-index: -1;
    border-radius: 0;
  }

  .home-icon {
    background: #2a2a4e !important;
    border: 2px solid #4a4a6e !important;
    border-radius: 0 !important;
    color: #e0e0e0 !important;
    box-shadow: 2px 2px 0 0 #0a0a1e !important;
    transition: all 0.1s linear !important;
    font-family: "Pixel CN", "Press Start 2P", "Courier New", Courier, monospace !important;

    &:hover {
      background: #3a3a5e !important;
      border-color: #6a6a8e !important;
      transform: translate(-2px, -2px) !important;
      box-shadow: 4px 4px 0 0 #0a0a1e !important;
      color: #fff !important;
    }

    &:active {
      transform: translate(0, 0) !important;
      box-shadow: 2px 2px 0 0 #0a0a1e !important;
    }
  }

  .breadcrumb-divider {
    color: #6a6a8e !important;
    font-family: "Pixel CN", "Press Start 2P", "Courier New", Courier, monospace !important;
  }

  .breadcrumb-link {
    background: #2a2a4e !important;
    border: 2px solid #4a4a6e !important;
    border-radius: 0 !important;
    color: #e0e0e0 !important;
    box-shadow: 2px 2px 0 0 #0a0a1e !important;
    transition: all 0.1s linear !important;
    font-family: "Pixel CN", "Press Start 2P", "Courier New", Courier, monospace !important;
    padding: 4px 8px !important;

    &:hover {
      background: #3a3a5e !important;
      border-color: #6a6a8e !important;
      transform: translate(-2px, -2px) !important;
      box-shadow: 4px 4px 0 0 #0a0a1e !important;

      .breadcrumb-text {
        color: #fff !important;
        text-shadow: 1px 1px 0 #0a0a1e !important;
      }

      .breadcrumb-icon {
        color: #fff !important;
        filter: drop-shadow(1px 1px 0 #0a0a1e) !important;
      }
    }

    &.is-current {
      background: #4a4a8e !important;
      border-color: #8a8aae !important;
      box-shadow: 
        2px 2px 0 0 #0a0a1e,
        inset 0 0 10px rgba(138, 138, 174, 0.3) !important;
      cursor: default;
      pointer-events: none;

      .breadcrumb-text {
        color: #fff !important;
        font-weight: 600 !important;
        text-shadow: 1px 1px 0 #0a0a1e !important;
      }

      .breadcrumb-icon {
        color: #fff !important;
        filter: drop-shadow(1px 1px 0 #0a0a1e) !important;
      }
    }
  }

  .breadcrumb-separator {
    color: #6a6a8e !important;
    font-family: "Pixel CN", "Press Start 2P", "Courier New", Courier, monospace !important;
    margin: 0 4px !important;
  }

  .breadcrumb-text {
    color: #e0e0e0 !important;
    font-family: "Pixel CN", "Press Start 2P", "Courier New", Courier, monospace !important;
    text-shadow: 1px 1px 0 #0a0a1e !important;
    font-size: 11px !important;
  }

  .breadcrumb-icon {
    color: #b0b0d0 !important;
    font-family: "Pixel CN", "Press Start 2P", "Courier New", Courier, monospace !important;
    filter: drop-shadow(1px 1px 0 #0a0a1e) !important;
  }
}

// 响应式适配
@media (max-width: 768px) {
  .pixel-art-breadcrumb {
    padding: 0 4px !important;
    
    .home-icon {
      width: 24px !important;
      height: 24px !important;
      font-size: 12px !important;
    }

    .breadcrumb-link {
      padding: 2px 6px !important;
      
      .breadcrumb-text {
        font-size: 9px !important;
        max-width: 60px !important;
      }

      .breadcrumb-icon {
        font-size: 11px !important;
      }
    }
  }
}
</style>

