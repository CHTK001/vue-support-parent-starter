<script setup lang="ts">
import BaseBreadcrumb from './BaseBreadcrumb.vue';
</script>

<template>
  <BaseBreadcrumb theme-class="christmas-breadcrumb" />
</template>

<style lang="scss">
// 圣诞主题面包屑样式
$xmas-green: #1b5e20;
$xmas-green-light: #2e7d32;
$xmas-red: #c62828;
$xmas-red-light: #d54343; // lighten($xmas-red, 10%)
$xmas-gold: #ffd700;
$xmas-white: #ffffff;
$xmas-border: rgba(255, 215, 0, 0.4);

.christmas-breadcrumb {
  background: linear-gradient(135deg, rgba($xmas-green, 0.95), rgba($xmas-green-light, 0.9));
  border-radius: 12px;
  padding: 0 12px;
  border: 2px solid $xmas-border;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.3);

  .home-icon {
    background: rgba($xmas-green, 0.8);
    color: $xmas-gold;
    border: 1px solid $xmas-border;

    &:hover {
      background: rgba($xmas-red, 0.6);
      color: $xmas-white;
      border-color: $xmas-gold;
      box-shadow: 0 0 12px rgba($xmas-red, 0.4);
    }
  }

  .breadcrumb-divider {
    color: rgba($xmas-gold, 0.6);
  }

  .breadcrumb-link {
    background: rgba($xmas-green, 0.6);
    border: 1px solid rgba($xmas-gold, 0.3);
    color: $xmas-white;

    &:hover {
      background: rgba($xmas-red, 0.5);
      border-color: rgba($xmas-gold, 0.5);
      box-shadow: 0 0 12px rgba($xmas-red, 0.3);

      .breadcrumb-text {
        color: $xmas-white;
      }

      .breadcrumb-icon {
        color: $xmas-white;
      }
    }

    &.is-current {
      background: linear-gradient(135deg, $xmas-red, $xmas-red-light);
      border: 2px solid $xmas-gold;
      box-shadow: 0 4px 16px rgba($xmas-red, 0.5);

      .breadcrumb-text {
        color: $xmas-white;
        font-weight: 700;
      }

      .breadcrumb-icon {
        color: $xmas-white;
      }
    }
  }

  .breadcrumb-separator {
    color: rgba($xmas-gold, 0.6);
  }

  .breadcrumb-text {
    color: $xmas-white;
  }

  .breadcrumb-icon {
    color: $xmas-gold;
  }
}

// 动画效果
@keyframes christmasSparkle {
  0%, 100% {
    box-shadow: 0 4px 16px rgba($xmas-red, 0.5);
  }
  50% {
    box-shadow: 0 4px 20px rgba($xmas-red, 0.7), 0 0 30px rgba($xmas-gold, 0.4);
  }
}

.christmas-breadcrumb {
  .breadcrumb-link {
    &.is-current {
      animation: christmasSparkle 2s ease-in-out infinite;
    }
  }
  
  .home-icon {
    transition: all 0.3s ease;
    
    &:hover {
      animation: christmasSparkle 1s ease-in-out infinite;
    }
  }
}

// 响应式适配
@media (max-width: 768px) {
  .christmas-breadcrumb {
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
