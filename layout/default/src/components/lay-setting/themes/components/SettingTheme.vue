<script setup lang="ts">
import { getConfig } from "@repo/config";
import { useI18n } from "vue-i18n";
import Segmented, {
  type OptionsType,
} from "@repo/components/ReSegmented/index";
import ScSelect from "@repo/components/ScSelect/index.vue";
import { ScTooltip } from "@repo/components/ScTooltip";
import LayThemeSwitcher from "../../../lay-theme-switcher/index.vue";
import LoaderStyleSetting from "../LoaderStyleSetting.vue";

const { t } = useI18n();

// ---- Props 定义 ----
const props = withDefaults(defineProps<{
  /** reactive 设置对象引用，子组件可直接修改 */
  settings: Record<string, any>;
  isDark?: boolean;
  dataTheme?: boolean;
  overallStyle?: string;
  layoutTheme: { layout: string; theme: string };
  themeColors: Array<{ themeColor: string; color: string; description?: string }>;
  isNonDefaultTheme: boolean;
  themeOptions: Array<OptionsType>;
  themeAnimationModeOptions: Array<OptionsType>;
  showThemeColors: (themeColor: string) => boolean;
  getThemeColorStyle: (color: string) => { background: string };
  handleOverallStyleChange: (theme: any) => void;
  handleSetLayoutThemeColor: (color: string, event: MouseEvent) => void;
  themeAnimationModeChange: (val: { option: OptionsType }) => void;
  themeAnimationDirectionChange: (value: string) => void;
}>(), {
  isDark: false,
  dataTheme: false,
  overallStyle: "light",
});
</script>

<template>
  <!-- 主题风格设置区域 - 非默认主题下隐藏（节日主题优先级大于整体风格） -->
  <div v-if="!isNonDefaultTheme" class="setting-section">
    <div class="section-header">
      <IconifyIconOnline icon="ri:palette-line" class="section-icon" />
      <h3 class="section-title">{{ t("panel.pureOverallStyle") }}</h3>
    </div>
    <div class="setting-content">
      <Segmented
        resize
        class="select-none modern-segmented"
        :modelValue="(overallStyle ?? 'light') === 'system' ? 2 : dataTheme ? 1 : 0"
        :options="themeOptions"
        @change="handleOverallStyleChange"
      />
    </div>
  </div>

  <!-- 主题色设置区域 -->
  <div
    v-if="!isNonDefaultTheme && themeColors && themeColors.length > 0"
    class="setting-section"
  >
    <div class="section-header">
      <IconifyIconOnline icon="ri:drop-line" class="section-icon" />
      <h3 class="section-title">{{ t("panel.pureThemeColor") }}</h3>
    </div>
    <div class="setting-content">
      <div class="theme-color-grid">
        <ScTooltip
          v-for="(item, index) in themeColors"
          v-show="showThemeColors(item.themeColor)"
          :key="index"
          :content="item.description || item.themeColor"
          placement="top"
          effect="light"
        >
          <div
            class="theme-color-item"
            :class="{
              'is-selected': item.themeColor === layoutTheme.theme,
            }"
            :style="getThemeColorStyle(item.color)"
            @click="(e) => handleSetLayoutThemeColor(item.themeColor, e)"
          >
            <!-- 选中状态指示器 -->
            <div class="selection-indicator">
              <div class="check-ring">
                <IconifyIconOnline icon="ep:check" class="check-icon" />
              </div>
            </div>

            <!-- 光泽效果层 -->
            <div class="shine-effect"></div>
          </div>
        </ScTooltip>
      </div>
    </div>
  </div>

  <!-- 主题动画设置区域 -->
  <div class="setting-section">
    <div class="section-header">
      <IconifyIconOnline icon="ri:movie-line" class="section-icon" />
      <h3 class="section-title">主题切换动画</h3>
      <div class="section-description">控制主题切换时的动画效果</div>
    </div>
    <div class="setting-content">
      <div
        class="setting-group-item"
        style="
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        "
      >
        <span class="setting-label" style="font-size: 14px">动画模式</span>
        <Segmented
          :modelValue="
            settings.themeAnimationMode === 'random'
              ? 0
              : settings.themeAnimationMode === 'fixed'
                ? 1
                : 2
          "
          :options="themeAnimationModeOptions"
          size="small"
          @change="themeAnimationModeChange"
        />
      </div>

      <div
        v-if="settings.themeAnimationMode === 'fixed'"
        class="setting-group-item"
      >
        <span
          class="setting-label"
          style="font-size: 14px; display: block; margin-bottom: 8px"
          >动画方向</span>
        <ScSelect
          :model-value="settings.themeAnimationDirection"
          layout="position"
          @change="themeAnimationDirectionChange"
        />
      </div>
    </div>
  </div>

  <!-- 主题皮肤功能区域：保留默认与内测主题，统一走 ThemeSkinProvider -->
  <div class="setting-section">
    <div class="section-header">
      <IconifyIconOnline icon="ri:shirt-line" class="section-icon" />
      <h3 class="section-title">主题皮肤</h3>
      <div class="section-description">
        选择默认和内测主题皮肤，实时预览整体风格
      </div>
    </div>
    <div class="setting-content">
      <LayThemeSwitcher />
    </div>
  </div>

  <!-- 加载动画样式设置区域 -->
  <LoaderStyleSetting
    v-if="getConfig().ShowLoadingPageStyleSwitcher"
    v-model="settings.loaderStyle"
  />
</template>

<style scoped lang="scss">
// 现代化主题色选择器 - 玻璃态设计
.theme-color-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(40px, 1fr));
  gap: 16px;
  margin-top: 20px;
  padding: 16px;
  background: var(--el-fill-color-light);
  border-radius: 16px;
  border: 1px solid var(--el-border-color-light);
  box-shadow:
    0 6px 16px rgba(0, 0, 0, 0.08),
    0 3px 8px rgba(0, 0, 0, 0.06),
    0 1px 0 rgba(255, 255, 255, 0.7) inset;
}

.theme-color-item {
  position: relative;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  cursor: pointer;
  overflow: hidden;
  transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  border: 2px solid var(--el-border-color-light);
  box-shadow:
    0 6px 16px rgba(0, 0, 0, 0.12),
    0 3px 8px rgba(0, 0, 0, 0.08),
    0 1px 0 rgba(255, 255, 255, 0.7) inset;

  // 基础光泽效果
  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(
      135deg,
      rgba(255, 255, 255, 0.4) 0%,
      rgba(255, 255, 255, 0.2) 50%,
      rgba(255, 255, 255, 0.1) 100%
    );
    pointer-events: none;
    z-index: 1;
  }

  // 悬停效果
  &:hover {
    transform: translateY(-8px) scale(1.15);
    box-shadow:
      0 12px 32px rgba(0, 0, 0, 0.25),
      0 6px 16px rgba(0, 0, 0, 0.18),
      0 1px 0 rgba(255, 255, 255, 0.9) inset;
    border-color: var(--el-color-primary-light-7);

    .shine-effect {
      opacity: 1;
      transform: translateX(100%);
    }

    .selection-indicator {
      transform: scale(1.2);
    }

    &::before {
      opacity: 1;
    }
  }

  // 点击效果
  &:active {
    transform: translateY(-4px) scale(1.1);
  }

  // 选中状态
  &.is-selected {
    border-color: #409eff;
    box-shadow:
      0 0 0 4px rgba(64, 158, 255, 0.4),
      0 12px 32px rgba(64, 158, 255, 0.35),
      0 6px 16px rgba(64, 158, 255, 0.25),
      0 1px 0 rgba(255, 255, 255, 0.9) inset;
    transform: translateY(-4px) scale(1.1);

    .selection-indicator {
      opacity: 1;
      transform: scale(1.15);

      .check-ring {
        background: var(--el-color-white);
        border-color: #409eff;
        transform: scale(1.15);

        .check-icon {
          opacity: 1;
          transform: scale(1.15);
          color: #409eff;
        }
      }
    }

    // 选中状态的脉冲动画
    &::after {
      content: "";
      position: absolute;
      top: -3px;
      left: -3px;
      right: -3px;
      bottom: -3px;
      border-radius: 10px;
      border: 2px solid #409eff;
      opacity: 0;
      animation: pulse-ring 1.5s infinite;
      pointer-events: none;
      z-index: 10;
    }
  }

  // 暗色主题适配
  .dark & {
    border-color: var(--el-border-color);
    box-shadow:
      0 6px 16px rgba(0, 0, 0, 0.5),
      0 3px 8px rgba(0, 0, 0, 0.4),
      0 1px 0 rgba(255, 255, 255, 0.1) inset;

    &:hover {
      border-color: var(--el-color-primary-light-4);
      box-shadow:
        0 12px 32px rgba(0, 0, 0, 0.6),
        0 6px 16px rgba(0, 0, 0, 0.5),
        0 1px 0 rgba(255, 255, 255, 0.15) inset;
    }

    &.is-selected {
      box-shadow:
        0 0 0 4px rgba(64, 158, 255, 0.4),
        0 12px 32px rgba(64, 158, 255, 0.5),
        0 6px 16px rgba(64, 158, 255, 0.4),
        0 1px 0 rgba(255, 255, 255, 0.15) inset;
    }
  }
}

// 选中状态指示器
.selection-indicator {
  position: absolute;
  top: 3px;
  right: 3px;
  opacity: 0;
  transform: scale(0.8);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 5;

  .check-ring {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.95);
    border: 1px solid rgba(255, 255, 255, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    transform: scale(0.8);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    backdrop-filter: blur(4px);
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);

    .check-icon {
      font-size: 7px;
      opacity: 0;
      transform: scale(0.5);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      color: var(--el-color-primary);
    }
  }
}

// 光泽效果
.shine-effect {
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.4),
    transparent
  );
  opacity: 0;
  transform: translateX(-100%);
  transition: all 0.6s ease;
  pointer-events: none;
  z-index: 2;
}

// 脉冲动画
@keyframes pulse-ring {
  0% {
    opacity: 1;
    transform: scale(1);
  }

  50% {
    opacity: 0.7;
    transform: scale(1.05);
  }

  100% {
    opacity: 0;
    transform: scale(1.1);
  }
}
</style>
