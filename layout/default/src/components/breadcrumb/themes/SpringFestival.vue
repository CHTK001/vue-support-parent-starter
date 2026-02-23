<script setup lang="ts">
import BaseBreadcrumb from './BaseBreadcrumb.vue';
</script>

<template>
  <BaseBreadcrumb theme-class="spring-festival-breadcrumb" />
</template>

<style lang="scss">
// 春节主题面包屑样式
.spring-festival-breadcrumb {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(255, 250, 240, 0.9));
  border-radius: 19px;
  padding: 0 12px;
  box-shadow: 
    0 2px 8px rgba(220, 20, 60, 0.15),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);

  .home-icon {
    background: linear-gradient(135deg, rgba(220, 20, 60, 0.1), rgba(255, 215, 0, 0.1));
    color: #DC143C;
    border: 1px solid rgba(255, 215, 0, 0.3);

    &:hover {
      background: linear-gradient(135deg, rgba(220, 20, 60, 0.2), rgba(255, 215, 0, 0.2));
      color: #B22222;
      border-color: rgba(255, 215, 0, 0.5);
      box-shadow: 0 4px 12px rgba(255, 215, 0, 0.3);
    }
  }

  .breadcrumb-divider {
    color: rgba(220, 20, 60, 0.5);
  }

  .breadcrumb-link {
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(255, 250, 240, 0.85));
    border-color: rgba(255, 215, 0, 0.3);
    color: #8B0000;
    font-family: 'STKaiti', 'KaiTi', 'SimKai', serif;

    &:hover {
      background: linear-gradient(135deg, rgba(255, 215, 0, 0.15), rgba(255, 250, 240, 0.95));
      border-color: rgba(255, 215, 0, 0.5);
      box-shadow: 0 4px 12px rgba(255, 215, 0, 0.3);

      .breadcrumb-text {
        color: #DC143C;
      }

      .breadcrumb-icon {
        color: #DC143C;
      }
    }

    &.is-current {
      background: linear-gradient(135deg, #FFD700, #FFA500);
      border-color: rgba(220, 20, 60, 0.4);
      box-shadow: 
        0 4px 16px rgba(255, 215, 0, 0.4),
        inset 0 2px 4px rgba(255, 255, 255, 0.5);

      .breadcrumb-text {
        color: #8B0000;
        font-weight: 700;
      }

      .breadcrumb-icon {
        color: #8B0000;
      }
    }
  }

  .breadcrumb-separator {
    color: rgba(220, 20, 60, 0.5);
    font-weight: 700;
  }

  .breadcrumb-text {
    color: #8B0000;
  }

  .breadcrumb-icon {
    color: rgba(139, 0, 0, 0.8);
  }
}

// 动画效果
@keyframes springFestivalGlow {
  0%, 100% {
    box-shadow: 
      0 4px 16px rgba(255, 215, 0, 0.4),
      inset 0 2px 4px rgba(255, 255, 255, 0.5);
  }
  50% {
    box-shadow: 
      0 4px 20px rgba(255, 215, 0, 0.6),
      inset 0 2px 4px rgba(255, 255, 255, 0.7);
  }
}

.spring-festival-breadcrumb {
  .breadcrumb-link {
    &.is-current {
      animation: springFestivalGlow 2s ease-in-out infinite;
    }
  }
  
  .home-icon {
    transition: all 0.3s ease;
    
    &:hover {
      animation: springFestivalGlow 1s ease-in-out infinite;
    }
  }
}

// 响应式适配
@media (max-width: 768px) {
  .spring-festival-breadcrumb {
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
