<script setup lang="ts">
import BaseBreadcrumb from './BaseBreadcrumb.vue';
</script>

<template>
  <BaseBreadcrumb theme-class="future-tech-breadcrumb" />
</template>

<style lang="scss">
$ft-cyan: #00ffff;
$ft-cyan-light: #4dfdfd;
$ft-bg-dark: #050a1f;
$ft-bg-darker: #0a1a3a;
$ft-border: rgba(0, 255, 255, 0.4);

.future-tech-breadcrumb {
  background: linear-gradient(135deg, rgba(5, 10, 31, 0.95), rgba(10, 26, 58, 0.9));
  border-radius: 12px;
  padding: 0 12px;
  border: 2px solid $ft-border;
  box-shadow: 0 2px 12px rgba(0, 255, 255, 0.2);

  .home-icon {
    background: rgba(5, 10, 31, 0.8);
    color: $ft-cyan;
    border: 1px solid $ft-border;

    &:hover {
      background: rgba(0, 255, 255, 0.2);
      color: $ft-cyan-light;
      border-color: $ft-cyan;
      box-shadow: 0 0 12px rgba(0, 255, 255, 0.4);
    }
  }

  .breadcrumb-divider {
    color: rgba(0, 255, 255, 0.5);
  }

  .breadcrumb-link {
    background: rgba(5, 10, 31, 0.6);
    border: 1px solid rgba(0, 255, 255, 0.3);
    color: rgba(0, 255, 255, 0.8);

    &:hover {
      background: rgba(0, 255, 255, 0.15);
      border-color: rgba(0, 255, 255, 0.5);
      box-shadow: 0 0 12px rgba(0, 255, 255, 0.3);

      .breadcrumb-text {
        color: $ft-cyan-light;
      }

      .breadcrumb-icon {
        color: $ft-cyan-light;
      }
    }

    &.is-current {
      background: linear-gradient(135deg, rgba(0, 255, 255, 0.3), rgba(77, 253, 253, 0.2));
      border: 2px solid $ft-cyan;
      box-shadow: 0 4px 16px rgba(0, 255, 255, 0.4);

      .breadcrumb-text {
        color: $ft-cyan-light;
        font-weight: 700;
      }

      .breadcrumb-icon {
        color: $ft-cyan-light;
      }
    }
  }

  .breadcrumb-separator {
    color: rgba(0, 255, 255, 0.5);
  }

  .breadcrumb-text {
    color: rgba(0, 255, 255, 0.8);
  }

  .breadcrumb-icon {
    color: $ft-cyan;
  }
}

@media (max-width: 768px) {
  .future-tech-breadcrumb {
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

