<script setup lang="ts">
import BaseBreadcrumb from './BaseBreadcrumb.vue';
</script>

<template>
  <BaseBreadcrumb theme-class="halloween-breadcrumb" />
</template>

<style lang="scss">
// 万圣节主题面包屑样式
.halloween-breadcrumb {
  background: linear-gradient(135deg, rgba(44, 0, 62, 0.95), rgba(26, 0, 38, 0.9));
  border-radius: 19px;
  padding: 0 12px;
  box-shadow: 
    0 2px 8px rgba(0, 0, 0, 0.5),
    inset 0 1px 0 rgba(255, 117, 24, 0.2);
  border: 1px solid rgba(74, 20, 140, 0.5);

  .home-icon {
    background: linear-gradient(135deg, rgba(255, 117, 24, 0.1), rgba(118, 255, 3, 0.1));
    color: #ff7518;
    border: 1px solid rgba(255, 117, 24, 0.3);

    &:hover {
      background: linear-gradient(135deg, rgba(255, 117, 24, 0.2), rgba(118, 255, 3, 0.2));
      color: #76ff03;
      border-color: rgba(118, 255, 3, 0.5);
      box-shadow: 0 0 8px rgba(118, 255, 3, 0.4);
    }
  }

  .breadcrumb-divider {
    color: rgba(255, 117, 24, 0.5);
  }

  .breadcrumb-link {
    background: linear-gradient(135deg, rgba(74, 20, 140, 0.3), rgba(44, 0, 62, 0.4));
    border-color: rgba(255, 117, 24, 0.2);
    color: #b39ddb;
    font-family: 'Creepster', 'cursive', sans-serif; // 尝试使用万圣节风格字体，如果没有则回退

    &:hover {
      background: linear-gradient(135deg, rgba(255, 117, 24, 0.15), rgba(44, 0, 62, 0.95));
      border-color: rgba(255, 117, 24, 0.5);
      box-shadow: 0 0 10px rgba(255, 117, 24, 0.3);

      .breadcrumb-text {
        color: #ff7518;
      }

      .breadcrumb-icon {
        color: #ff7518;
      }
    }

    &.is-current {
      background: linear-gradient(135deg, #ff7518, #f57c00);
      border-color: rgba(255, 117, 24, 0.4);
      box-shadow: 
        0 0 12px rgba(255, 117, 24, 0.4),
        inset 0 2px 4px rgba(255, 255, 255, 0.2);

      .breadcrumb-text {
        color: #2c003e;
        font-weight: 700;
      }

      .breadcrumb-icon {
        color: #2c003e;
      }
    }
  }

  .breadcrumb-separator {
    color: rgba(255, 117, 24, 0.5);
    font-weight: 700;
  }

  .breadcrumb-text {
    color: #b39ddb;
  }

  .breadcrumb-icon {
    color: rgba(179, 157, 219, 0.8);
  }
}

// 动画效果
@keyframes halloweenGlow {
  0%, 100% {
    box-shadow: 0 0 10px rgba(255, 117, 24, 0.3);
  }
  50% {
    box-shadow: 0 0 20px rgba(255, 117, 24, 0.6), 0 0 30px rgba(118, 255, 3, 0.3);
  }
}

.halloween-breadcrumb {
  .breadcrumb-link {
    &.is-current {
      animation: halloweenGlow 2s ease-in-out infinite;
    }
  }
}

// 响应式适配
@media (max-width: 768px) {
  .halloween-breadcrumb {
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
