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
</style>
