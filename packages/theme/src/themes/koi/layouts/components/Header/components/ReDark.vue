<template>
  <el-popover
    placement="bottom"
    :width="168"
    trigger="hover"
    :offset="8"
    popper-class="koi-dark-popover"
  >
    <template #reference>
      <div class="dark-mode-trigger">
        <!-- 跟随系统模式：动画日月图标（hover/focus 播放） -->
        <ReIcon v-if="themeMode === 'auto'" name="anim:tabler:sun-moon" :size="18" class="trigger-icon" />
        <!-- 明亮模式下提供「切到暗黑」入口，故仍是月亮 -->
        <ReIcon v-else-if="!isDark" name="anim:tabler:moon" :size="18" class="trigger-icon" />
        <!-- 暗黑模式下提供「切回明亮」入口，故是太阳 -->
        <ReIcon v-else name="anim:tabler:sun" :size="18" class="trigger-icon" />
      </div>
    </template>

    <div class="dark-mode-options">
      <div
        v-for="opt in modeOptions"
        :key="opt.value"
        class="dark-mode-option"
        :class="{ active: themeMode === opt.value, disabled: themeMode === opt.value }"
        @click="themeMode !== opt.value && selectMode(opt.value, $event)"
      >
        <el-icon :size="16"><component :is="opt.icon" /></el-icon>
        <span class="dark-mode-option__text">{{ opt.label }}</span>
        <!-- 选中勾：靠 margin-left:auto 推到最右，与文字之间留白 -->
        <el-icon v-if="themeMode === opt.value" class="dark-mode-option__check" :size="14"><Select /></el-icon>
      </div>
    </div>
  </el-popover>
</template>

<script setup lang="ts">
import { Sunny, Moon, Monitor, Select } from "@element-plus/icons-vue";
import { useTheme } from "@repo/theme";
import useGlobalStore from "@repo/pinia/modules/global";
import { storeToRefs } from "pinia";
import { useI18n } from "vue-i18n";
import { computed } from "vue";

const { t } = useI18n();
const globalStore = useGlobalStore();
const { themeMode, isDark } = storeToRefs(globalStore);
const { changeThemeMode } = useTheme();

/** 三个主题模式（图标 + 文案），选中项在右侧打勾 */
const modeOptions = computed(() => [
  { value: "light" as const, icon: Sunny, label: t("header.lightMode") },
  { value: "dark" as const, icon: Moon, label: t("header.darkMode") },
  { value: "auto" as const, icon: Monitor, label: t("header.autoMode") },
]);

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
  /* 纵向均匀排布：三项等距，留足呼吸感 */
  gap: 4px;
  padding: 2px 0;
}

.dark-mode-option {
  display: flex;
  align-items: center;
  gap: 10px;
  /* 内边距宽松舒适：左图标 + 右文字左对齐 */
  padding: 10px 14px;
  border-radius: 10px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  line-height: 1.4;
  color: var(--el-text-color-regular);
  transition:
    background-color 0.22s ease,
    color 0.22s ease;

  /* 左侧线性图标：线宽统一、线条圆润 */
  .el-icon {
    flex-shrink: 0;
    color: var(--el-text-color-secondary);
    transition: color 0.22s ease;
  }

  span {
    /* 文字左对齐，与图标基线齐平 */
    text-align: left;
  }

  /* 右侧选中勾：margin-left:auto 把它推到最右，与文字之间自动留白 */
  .dark-mode-option__check {
    margin-left: auto;
    color: var(--el-color-primary);
  }

  /* 文字占满剩余宽度，勾才能被推到最右（否则文字短时勾会紧贴文字） */
  .dark-mode-option__text {
    flex: 1;
    min-width: 0;
  }

  &:hover:not(.disabled) {
    background: var(--el-fill-color-light);
    color: var(--el-text-color-primary);

    .el-icon {
      color: var(--el-text-color-primary);
    }
  }

  /* 选中态：浅蓝色圆角色块 + 浅蓝文字 + 浅蓝图标（底色与文字色双重视觉强化） */
  &.active {
    background: var(--el-color-primary-light-9);
    color: var(--el-color-primary);
    font-weight: 600;

    .el-icon {
      color: var(--el-color-primary);
    }
  }

  &.disabled {
    cursor: not-allowed;
    pointer-events: none;
  }
}

html.dark {
  .dark-mode-trigger {
    &:hover {
      background: rgba(255, 255, 255, 0.1);
    }
  }

  /* 暗色下选中态用深一点的蓝底，浅蓝文字仍保持可读 */
  .dark-mode-option.active {
    background: color-mix(in srgb, var(--el-color-primary) 22%, transparent);
    color: var(--el-color-primary-light-3);

    .el-icon {
      color: var(--el-color-primary-light-3);
    }
  }
}
</style>

<style lang="scss">
/* 弹层：边缘利落、悬浮层级感明确
   1) 圆角：`.el-popper.is-light` 用的是 `border-radius: var(--rm-radius)`（6px，来自
      packages/ui/src/components/shared/modern-vars.css），它比 `.el-popover.el-popper`
      的 `var(--el-popover-border-radius)` 更晚、更具体，故只改 --el-popover-* 变量不生效。
      这里直接覆盖 --rm-radius 变量本身。
   2) 投影：`.el-popper` 上有 `box-shadow: var(--shadow-lg)`（telemetry.css），
      同样需要 !important 盖住。 */
.koi-dark-popover.el-popper,
.el-popper.koi-dark-popover {
  --rm-radius: 12px;
  --el-popper-border-radius: 12px;
  --el-popover-border-radius: 12px;

  padding: 10px !important;
  border-radius: 12px !important;
  border: 1px solid var(--el-border-color-lighter) !important;
  box-shadow:
    0 10px 30px rgba(0, 0, 0, 0.12),
    0 2px 8px rgba(0, 0, 0, 0.06) !important;
  backdrop-filter: blur(12px);
}

html.dark .koi-dark-popover.el-popper,
html.dark .el-popper.koi-dark-popover {
  border-color: var(--el-border-color) !important;
  box-shadow:
    0 10px 30px rgba(0, 0, 0, 0.4),
    0 2px 8px rgba(0, 0, 0, 0.3) !important;
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
