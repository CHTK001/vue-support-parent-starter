<template>
  <div class="koi-theme-color-picker">
    <!-- 颜色选择器触发按钮 -->
    <el-popover
      placement="bottom"
      :width="280"
      trigger="hover"
      :offset="8"
      popper-class="theme-color-popover"
    >
      <template #reference>
        <div class="theme-color-trigger">
          <el-icon :size="20" class="trigger-icon">
            <Brush />
          </el-icon>
        </div>
      </template>

      <!-- 颜色选择器内容 -->
      <div class="theme-color-content">
        <div class="theme-colors-grid">
          <div
            v-for="color in themeColors"
            :key="color"
            class="theme-color-item"
            @click="handleColorChange(color)"
            :class="{ active: globalStore.themeColor === color }"
          >
            <div class="color-preview" :style="{ backgroundColor: color }">
              <div class="color-check" v-if="globalStore.themeColor === color">
                <el-icon><Check /></el-icon>
              </div>
            </div>
          </div>
        </div>
      </div>
    </el-popover>
  </div>
</template>

<script setup lang="ts">
import { Check, Brush } from "@element-plus/icons-vue";
import { useTheme } from "@repo/theme";
import useGlobalStore from "@repo/pinia/modules/global";

const globalStore = useGlobalStore();
const { changeThemeColor } = useTheme();

/**
 * 主题颜色配置（与 ThemeConfig 保持一致）
 *
 * <p>每档都按 WCAG AA 校验过：作为主色按钮填充（白字压在上面）与作为文字
 * （压在白底上）两种用法都必须 >= 4.5 : 1。原色板 12 档里有 10 档不达标
 * （最差的 #06B6D4 只有 2.43 : 1，#FF6B35 只有 2.84 : 1），已按同色相加深。</p>
 *
 * <p>未改的两档是实测本就达标：#1E71EE 为 4.51 : 1、#316C72 为 5.97 : 1 ——
 * 达标就不动，避免无谓的视觉变化。</p>
 *
 * <p>色相与排序刻意保持原样（仍是蓝→靛→紫→青→橙→红→粉的既有观感），
 * 只改饱和度与明度，改完顺序不变。</p>
 */
const themeColors = [
  "#1B6FCC",
  "#1E71EE",
  "#3F46C9",
  "#5B5499",
  "#12735A",
  "#316C72",
  "#C2410C",
  "#0070CC",
  "#C81E1E",
  "#6B31D0",
  "#C81E77",
  "#02788E"
];

/** 切换主题颜色 */
const handleColorChange = (color: string) => {
  changeThemeColor(color);
};
</script>

<style lang="scss" scoped>
.koi-theme-color-picker {
  display: inline-block;
}

.theme-color-trigger {
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

.theme-color-content {
  padding: 4px;
}

/** 主题颜色选择器 - 参考 ThemeConfig 样式 */
.theme-colors-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;

  .theme-color-item {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 4px;
    cursor: pointer;
    border: 2px solid transparent;
    border-radius: 8px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    background: var(--el-bg-color);

    &:hover {
      background-color: var(--el-fill-color-light);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
      transform: translateY(-2px);

      .color-preview {
        transform: scale(1.05);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        animation: color-preview-hover 0.6s ease-in-out infinite;

        &::before {
          opacity: 1;
          animation: shimmer-sweep 1.5s ease-in-out infinite;
        }
      }
    }

    &.active {
      background-color: var(--el-color-primary-light-9);
      border-color: var(--el-color-primary);
      box-shadow: 0 2px 8px rgba(var(--el-color-primary-rgb), 0.15);

      .color-preview {
        transform: scale(1.02);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        animation: color-pulse 2s ease-in-out infinite;
      }
    }

    .color-preview {
      width: 28px;
      height: 28px;
      border-radius: 6px;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
      transition: all 0.3s ease;
      position: relative;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;

      &::before {
        content: "";
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.1) 50%, transparent 70%);
        opacity: 0;
        transform: translateX(-100%);
        transition: opacity 0.3s ease;
      }

      &:hover {
        transform: scale(1.1);
        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
      }
    }

    .color-check {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 16px;
      height: 16px;
      background: rgba(255, 255, 255, 0.95);
      border-radius: 50%;
      color: var(--el-color-primary);
      font-size: 10px;
      font-weight: bold;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
      backdrop-filter: blur(4px);
      animation: fade-in-scale 0.3s ease;

      &::before {
        content: "";
        position: absolute;
        top: -2px;
        left: -2px;
        right: -2px;
        bottom: -2px;
        background: linear-gradient(45deg, rgba(255, 255, 255, 0.8), rgba(255, 255, 255, 0.4));
        border-radius: 50%;
        z-index: -1;
      }
    }
  }
}

/** 动画 */
@keyframes fade-in-scale {
  0% {
    opacity: 0;
    transform: scale(0.6);
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes color-pulse {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.02);
  }
}

@keyframes color-preview-hover {
  0%,
  100% {
    transform: scale(1.05);
  }
  50% {
    transform: scale(1.08);
  }
}

@keyframes shimmer-sweep {
  0% {
    transform: translateX(-100%);
  }
  50% {
    transform: translateX(100%);
  }
  100% {
    transform: translateX(100%);
  }
}

html.dark {
  .theme-color-trigger {
    &:hover {
      background: rgba(255, 255, 255, 0.1);
    }
  }
}
</style>

<style lang="scss">
.theme-color-popover {
  padding: 8px !important;
  border-radius: 8px !important;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15) !important;
}
</style>

