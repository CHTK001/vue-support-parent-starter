<script setup lang="ts">
import LogoutCircleRLine from "@iconify-icons/ri/logout-circle-r-line";
</script>

<template>
  <el-tooltip
    :content="$t('module.logout')"
    placement="bottom"
    :show-after="300"
  >
    <button class="logout-btn" :title="$t('module.logout')">
      <IconifyIconOffline :icon="LogoutCircleRLine" class="logout-icon" />
    </button>
  </el-tooltip>
</template>

<style scoped lang="scss">
.logout-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  background: transparent;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;

  // 悬停前的默认状态
  &::before {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: 10px;
    background: var(--el-color-danger-light-9);
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  .logout-icon {
    font-size: 20px;
    color: var(--el-text-color-regular);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    z-index: 1;
  }

  // 悬停效果
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(var(--el-color-danger-rgb), 0.25);

    &::before {
      opacity: 1;
    }

    .logout-icon {
      color: var(--el-color-danger);
      transform: scale(1.1);
    }
  }

  // 点击效果
  &:active {
    transform: translateY(0);
    box-shadow: 0 2px 6px rgba(var(--el-color-danger-rgb), 0.2);
  }
}

// 深色模式适配
:global(html.dark) .logout-btn {
  &::before {
    background: rgba(var(--el-color-danger-rgb), 0.15);
  }

  .logout-icon {
    color: var(--el-text-color-regular);
  }

  &:hover {
    box-shadow: 0 4px 12px rgba(var(--el-color-danger-rgb), 0.3);

    .logout-icon {
      color: var(--el-color-danger-light-3);
    }
  }
}

// 赛博朋克主题
:global(html[data-skin="cyberpunk"]) .logout-btn {
  &::before {
    background: rgba(255, 0, 85, 0.15);
  }

  .logout-icon {
    color: #00ffff;
  }

  &:hover {
    box-shadow: 0 0 15px rgba(255, 0, 85, 0.4);

    &::before {
      background: rgba(255, 0, 85, 0.25);
    }

    .logout-icon {
      color: #ff0055;
      filter: drop-shadow(0 0 6px rgba(255, 0, 85, 0.6));
    }
  }
}

// 春节主题
:global(html[data-skin="spring-festival"]),
:global(html[data-skin="lunar-spring-festival"]),
:global(html[data-skin="new-year"]) {
  .logout-btn {
    &::before {
      background: rgba(229, 57, 53, 0.1);
    }

    .logout-icon {
      color: #c62828;
    }

    &:hover {
      box-shadow: 0 4px 12px rgba(229, 57, 53, 0.3);

      .logout-icon {
        color: #e53935;
      }
    }
  }
}

// 中秋主题
:global(html[data-skin="mid-autumn"]) .logout-btn {
  &::before {
    background: rgba(106, 27, 154, 0.15);
  }

  .logout-icon {
    color: #ffc107;
  }

  &:hover {
    box-shadow: 0 4px 12px rgba(255, 193, 7, 0.3);

    .logout-icon {
      color: #ff9800;
    }
  }
}

// 圣诞主题
:global(html[data-skin="christmas"]) .logout-btn {
  &::before {
    background: rgba(196, 30, 58, 0.1);
  }

  .logout-icon {
    color: #228b22;
  }

  &:hover {
    box-shadow: 0 4px 12px rgba(196, 30, 58, 0.3);

    .logout-icon {
      color: #c41e3a;
    }
  }
}
</style>
