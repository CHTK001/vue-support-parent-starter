<script setup lang="ts">
import BaseBreadcrumb from './BaseBreadcrumb.vue';
</script>

<template>
  <BaseBreadcrumb theme-class="cyberpunk-breadcrumb" />
</template>

<style lang="scss">
// 赛博朋克主题面包屑样式
$cyber-cyan: #00ffff;
$cyber-magenta: #ff00ff;
$cyber-border: rgba(0, 255, 255, 0.25);
$cyber-border-hover: rgba(0, 255, 255, 0.45);

.cyberpunk-breadcrumb {
  background: rgba(10, 14, 25, 0.8);
  border-radius: 10px;
  padding: 0 12px;
  border: 1px solid $cyber-border;
  box-shadow: 
    0 2px 12px rgba(0, 0, 0, 0.3),
    0 0 15px rgba(0, 255, 255, 0.1);

  .home-icon {
    background: rgba(0, 0, 0, 0.5);
    color: $cyber-cyan;
    border: 1px solid $cyber-border;
    box-shadow: 0 0 8px rgba(0, 255, 255, 0.15);

    &:hover {
      background: rgba(0, 255, 255, 0.1);
      color: #fff;
      border-color: $cyber-border-hover;
      box-shadow: 0 0 15px rgba(0, 255, 255, 0.3);
      transform: translateY(-2px);
    }
  }

  .breadcrumb-divider {
    color: rgba(0, 255, 255, 0.4);
  }

  .breadcrumb-link {
    background: rgba(0, 0, 0, 0.4);
    border: 1px solid rgba(0, 255, 255, 0.15);
    color: $cyber-cyan;
    font-family: 'Rajdhani', 'Roboto', sans-serif;

    &:hover {
      background: rgba(0, 255, 255, 0.1);
      border-color: $cyber-cyan;
      box-shadow: 
        0 0 15px rgba(0, 255, 255, 0.25),
        inset 0 0 10px rgba(0, 255, 255, 0.05);
      transform: translateY(-2px);

      .breadcrumb-text {
        color: #fff;
        text-shadow: 0 0 8px rgba(0, 255, 255, 0.5);
      }

      .breadcrumb-icon {
        color: $cyber-cyan;
        filter: drop-shadow(0 0 4px rgba(0, 255, 255, 0.6));
      }
    }

    &.is-current {
      background: linear-gradient(135deg, rgba(0, 255, 255, 0.2) 0%, rgba(255, 0, 255, 0.12) 100%);
      border: 1px solid $cyber-cyan;
      box-shadow: 
        0 0 20px rgba(0, 255, 255, 0.3),
        0 0 40px rgba(255, 0, 255, 0.15),
        inset 0 0 15px rgba(0, 255, 255, 0.1);
      position: relative;

      .breadcrumb-text {
        color: #fff;
        font-weight: 600;
        text-shadow: 0 0 8px rgba(0, 255, 255, 0.6);
      }

      .breadcrumb-icon {
        color: $cyber-cyan;
        filter: drop-shadow(0 0 6px $cyber-cyan);
      }

      // 左侧霓虹指示条
      &::before {
        content: '';
        position: absolute;
        left: 0;
        top: 50%;
        transform: translateY(-50%);
        width: 3px;
        height: 60%;
        background: linear-gradient(to bottom, $cyber-cyan, $cyber-magenta, $cyber-cyan);
        border-radius: 2px;
        box-shadow: 0 0 8px $cyber-cyan;
      }
    }
  }

  .breadcrumb-separator {
    color: rgba(0, 255, 255, 0.4);
  }

  .breadcrumb-text {
    color: $cyber-cyan;
  }

  .breadcrumb-icon {
    color: $cyber-cyan;
    filter: drop-shadow(0 0 3px rgba(0, 255, 255, 0.4));
  }
}
</style>
