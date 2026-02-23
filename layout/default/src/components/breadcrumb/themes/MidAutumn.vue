<script setup lang="ts">
import BaseBreadcrumb from './BaseBreadcrumb.vue';
</script>

<template>
  <BaseBreadcrumb theme-class="mid-autumn-breadcrumb" />
</template>

<style lang="scss">
// 中秋主题面包屑样式
$mid-blue: #1a237e;
$mid-blue-light: #283593;
$mid-gold: #ffd54f;
$mid-gold-light: #ffecb3;
$mid-border: rgba(255, 213, 79, 0.3);

.mid-autumn-breadcrumb {
  background: linear-gradient(135deg, rgba($mid-blue, 0.95), rgba($mid-blue-light, 0.9));
  border-radius: 12px;
  padding: 0 12px;
  border: 1px solid $mid-border;
  box-shadow: 0 2px 12px rgba($mid-blue, 0.3);

  .home-icon {
    background: rgba($mid-blue, 0.6);
    color: $mid-gold;
    border: 1px solid $mid-border;

    &:hover {
      background: rgba($mid-gold, 0.2);
      color: #fff;
      border-color: $mid-gold;
      box-shadow: 0 0 12px rgba($mid-gold, 0.4);
    }
  }

  .breadcrumb-divider {
    color: rgba($mid-gold, 0.5);
  }

  .breadcrumb-link {
    background: rgba($mid-blue, 0.4);
    border: 1px solid rgba($mid-gold, 0.2);
    color: $mid-gold-light;

    &:hover {
      background: rgba($mid-gold, 0.15);
      border-color: $mid-gold;
      box-shadow: 0 0 12px rgba($mid-gold, 0.25);

      .breadcrumb-text {
        color: #fff;
      }

      .breadcrumb-icon {
        color: #fff;
      }
    }

    &.is-current {
      background: linear-gradient(135deg, $mid-gold, $mid-gold-light);
      border-color: rgba($mid-blue, 0.3);
      box-shadow: 0 4px 16px rgba($mid-gold, 0.5);

      .breadcrumb-text {
        color: $mid-blue;
        font-weight: 700;
      }

      .breadcrumb-icon {
        color: $mid-blue;
      }
    }
  }

  .breadcrumb-separator {
    color: rgba($mid-gold, 0.5);
  }

  .breadcrumb-text {
    color: $mid-gold-light;
  }

  .breadcrumb-icon {
    color: $mid-gold;
  }
}

// 动画效果
@keyframes midAutumnGlow {
  0%, 100% {
    box-shadow: 0 4px 16px rgba($mid-gold, 0.5);
  }
  50% {
    box-shadow: 0 4px 20px rgba($mid-gold, 0.7), 0 0 30px rgba($mid-gold, 0.4);
  }
}

.mid-autumn-breadcrumb {
  .breadcrumb-link {
    &.is-current {
      animation: midAutumnGlow 2s ease-in-out infinite;
    }
  }
  
  .home-icon {
    transition: all 0.3s ease;
    
    &:hover {
      animation: midAutumnGlow 1s ease-in-out infinite;
    }
  }
}

// 响应式适配
@media (max-width: 768px) {
  .mid-autumn-breadcrumb {
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
