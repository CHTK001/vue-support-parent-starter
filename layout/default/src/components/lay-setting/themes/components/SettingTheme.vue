<script setup lang="ts">
import { getConfig } from "@repo/config";
import { useI18n } from "vue-i18n";
import Segmented, {
  type OptionsType,
} from "@repo/components/ReSegmented/index";
import ScSelect from "@repo/components/ScSelect/index.vue";
import { ScTooltip } from "@repo/components";
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
          >动画方向</span
        >
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
