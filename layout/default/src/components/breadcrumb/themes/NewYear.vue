<script setup lang="ts">
import BaseBreadcrumb from './BaseBreadcrumb.vue';
</script>

<template>
  <BaseBreadcrumb theme-class="new-year-breadcrumb" />
</template>

<style lang="scss">
// 元旦主题面包屑样式
$ice-lightest: #F5FBFF;
$ice-light: #B8E0F2;
$ice-medium: #7CC2E8;
$ice-primary: #4EA8DE;
$ice-deep: #2A7AB8;
$ice-darker: #1E5F8C;
$frost-purple: #E0E7F5;
$ice-border: rgba(78, 168, 222, 0.3);

.new-year-breadcrumb {
  background: linear-gradient(135deg, rgba($ice-lightest, 0.98), rgba($frost-purple, 0.95));
  border-radius: 12px;
  padding: 0 12px;
  border: 1px solid $ice-border;
  box-shadow: 0 2px 12px rgba($ice-deep, 0.15);
  backdrop-filter: blur(8px);

  .home-icon {
    background: rgba(255, 255, 255, 0.7);
    color: $ice-primary;
    border: 1px solid rgba($ice-medium, 0.3);

    &:hover {
      background: rgba($ice-medium, 0.2);
      color: $ice-deep;
      border-color: rgba($ice-primary, 0.5);
      box-shadow: 0 0 12px rgba($ice-primary, 0.3);
    }
  }

  .breadcrumb-divider {
    color: rgba($ice-primary, 0.5);
  }

  .breadcrumb-link {
    background: rgba(255, 255, 255, 0.7);
    border: 1px solid rgba($ice-medium, 0.25);
    color: $ice-darker;

    &:hover {
      background: rgba($ice-medium, 0.2);
      border-color: rgba($ice-primary, 0.4);
      box-shadow: 0 0 12px rgba($ice-primary, 0.2);

      .breadcrumb-text {
        color: $ice-deep;
      }

      .breadcrumb-icon {
        color: $ice-deep;
      }
    }

    &.is-current {
      background: linear-gradient(135deg, $ice-primary, $ice-medium);
      border: 1px solid rgba(255, 255, 255, 0.5);
      box-shadow: 0 4px 16px rgba($ice-primary, 0.4);

      .breadcrumb-text {
        color: #fff;
        font-weight: 700;
      }

      .breadcrumb-icon {
        color: #fff;
      }
    }
  }

  .breadcrumb-separator {
    color: rgba($ice-primary, 0.5);
  }

  .breadcrumb-text {
    color: $ice-darker;
  }

  .breadcrumb-icon {
    color: $ice-primary;
  }
}

// 动画效果
@keyframes newYearShimmer {
  0%, 100% {
    box-shadow: 0 4px 16px rgba($ice-primary, 0.4);
  }
  50% {
    box-shadow: 0 4px 20px rgba($ice-primary, 0.6), 0 0 30px rgba($ice-primary, 0.3);
  }
}

.new-year-breadcrumb {
  .breadcrumb-link {
    &.is-current {
      animation: newYearShimmer 2s ease-in-out infinite;
    }
  }
  
  .home-icon {
    transition: all 0.3s ease;
    
    &:hover {
      animation: newYearShimmer 1s ease-in-out infinite;
    }
  }
}

// 响应式适配
@media (max-width: 768px) {
  .new-year-breadcrumb {
    padding: 0 8px;
    
    .home-icon {
      width: 28px;
      height: 28px;
      font-size: 14px;
    }

    .breadcrumb-link {
      padding: 4px 8px;
      
      .breadcrumb-text {
        font-size: 11px;
        max-width: 70px;
      }

      .breadcrumb-icon {
        font-size: 13px;
      }
    }
  }
}
</style>
