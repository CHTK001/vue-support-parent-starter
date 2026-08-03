<template>
  <el-popover
    placement="bottom"
    :width="130"
    trigger="hover"
    :offset="8"
    popper-class="koi-dark-popover"
  >
    <template #reference>
      <div class="dark-mode-trigger">
        <!-- 跟随系统模式 -->
        <el-icon v-if="themeMode === 'auto'" :size="20" class="trigger-icon">
          <Monitor />
        </el-icon>
        <!-- 明亮模式 -->
        <el-icon v-else-if="!isDark" :size="18" class="trigger-icon">
          <Moon />
        </el-icon>
        <!-- 暗黑模式 -->
        <el-icon v-else :size="20" class="trigger-icon">
          <Sunny />
        </el-icon>
      </div>
    </template>

    <div class="dark-mode-options">
      <div
        class="dark-mode-option"
        :class="{ active: themeMode === 'light', disabled: themeMode === 'light' }"
        @click="themeMode !== 'light' && selectMode('light', $event)"
      >
        <el-icon :size="16"><Sunny /></el-icon>
        <span>明亮模式</span>
      </div>
      <div
        class="dark-mode-option"
        :class="{ active: themeMode === 'dark', disabled: themeMode === 'dark' }"
        @click="themeMode !== 'dark' && selectMode('dark', $event)"
      >
        <el-icon :size="16"><Moon /></el-icon>
        <span>暗黑模式</span>
      </div>
      <div
        class="dark-mode-option"
        :class="{ active: themeMode === 'auto', disabled: themeMode === 'auto' }"
        @click="themeMode !== 'auto' && selectMode('auto', $event)"
      >
        <el-icon :size="16"><Monitor /></el-icon>
        <span>跟随系统</span>
      </div>
    </div>
  </el-popover>
</template>

<script setup lang="ts">
import { Sunny, Moon, Monitor } from "@element-plus/icons-vue";
import { useTheme } from "@repo/theme";
import useGlobalStore from "@repo/pinia/modules/global";
import { storeToRefs } from "pinia";

const globalStore = useGlobalStore();
const { themeMode, isDark } = storeToRefs(globalStore);
const { changeThemeMode } = useTheme();

const selectMode = async (mode: "light" | "dark" | "auto", event: MouseEvent) => {
  const x = event.clientX;
  const y = event.clientY;
  const endRadius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
  const effectiveDark = mode === "dark" ? true : mode === "light" ? false : window.matchMedia("(prefers-color-scheme: dark)").matches;

  // @ts-ignore
  if (document.startViewTransition == undefined) {
    changeThemeMode(mode);
  } else {
    // @ts-ignore
    const transition = document.startViewTransition(() => {
      changeThemeMode(mode);
    });
    await transition.ready;
    const clipPath = [`circle(0px at ${x}px ${y}px)`, `circle(${endRadius}px at ${x}px ${y}px)`];
    document.documentElement.animate(
      {
        clipPath: effectiveDark ? clipPath : [...clipPath].reverse()
      },
      {
        duration: 300,
        easing: "ease-in",
        fill: "both",
        pseudoElement: effectiveDark ? "::view-transition-new(root)" : "::view-transition-old(root)"
      }
    );
  }
};
</script>

<style lang="scss" scoped>
.dark-mode-trigger {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.5s ease;

  .trigger-icon {
    color: var(--el-text-color-primary);
  }

  &:hover {
    background: rgba(0, 0, 0, 0.06);

    .trigger-icon {
      transform: scale(1.05);
    }
  }

  &:active {
    background: rgba(0, 0, 0, 0.1);
    transform: scale(0.94);

    .trigger-icon {
      transform: scale(0.9);
    }
  }
}

.dark-mode-options {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.dark-mode-option {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  color: var(--el-text-color-regular);
  transition: all 0.2s;

  &:hover {
    background: var(--el-fill-color-light);
    color: var(--el-text-color-primary);
  }

  &.active {
    background: var(--el-color-primary-light-9);
    color: var(--el-color-primary);
    font-weight: 500;
  }

  &.disabled {
    cursor: not-allowed;
    opacity: 0.5;
    pointer-events: none;
  }
}

html.dark {
  .dark-mode-trigger {
    &:hover {
      background: rgba(255, 255, 255, 0.1);
    }
  }
}
</style>

<style lang="scss">
.koi-dark-popover {
  padding: 8px !important;
  border-radius: 8px !important;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15) !important;
}

::view-transition-old(root),
::view-transition-new(root) {
  mix-blend-mode: normal;
  animation: none;
}
::view-transition-old(root) {
  z-index: 9999;
}
::view-transition-new(root) {
  z-index: 1;
}
.dark::view-transition-old(root) {
  z-index: 1;
}
.dark::view-transition-new(root) {
  z-index: 9999;
}
</style>
