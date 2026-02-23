<script setup lang="ts">
import BaseBreadcrumb from './BaseBreadcrumb.vue';
</script>

<template>
  <BaseBreadcrumb theme-class="default-breadcrumb" />
</template>

<style lang="scss">
// 默认主题面包屑深度定制
.default-breadcrumb {
  // 确保基础样式继承
  .home-icon {
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    
    &:hover {
      transform: translateY(-1px) scale(1.05);
    }
  }

  .breadcrumb-link {
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    
    &:hover {
      transform: translateY(-1px);
    }
    
    &.is-current {
      animation: currentPulse 2s ease-in-out infinite;
    }
  }
}

// 当前项脉冲动画
@keyframes currentPulse {
  0%, 100% {
    box-shadow: 0 2px 8px rgba(var(--el-color-primary-rgb), 0.15);
  }
  50% {
    box-shadow: 0 2px 12px rgba(var(--el-color-primary-rgb), 0.25);
  }
}

// 深色模式适配
html.dark {
  .default-breadcrumb {
    .home-icon {
      background: var(--el-fill-color-dark);
      
      &:hover {
        background: var(--el-color-primary-light-8);
      }
    }

    .breadcrumb-link {
      background: var(--el-fill-color-dark);
      
      &:hover {
        background: var(--el-color-primary-light-8);
      }
      
      &.is-current {
        background: linear-gradient(
          135deg,
          var(--el-color-primary-light-8),
          var(--el-color-primary-light-7)
        );
      }
    }
  }
}

// 响应式适配
@media (max-width: 768px) {
  .default-breadcrumb {
    .home-icon {
      width: 28px;
      height: 28px;
      font-size: 14px;
    }

    .breadcrumb-link {
      padding: 4px 8px;
      
      .breadcrumb-text {
        font-size: 12px;
        max-width: 70px;
      }

      .breadcrumb-icon {
        font-size: 13px;
      }
    }
  }
}
</style>
