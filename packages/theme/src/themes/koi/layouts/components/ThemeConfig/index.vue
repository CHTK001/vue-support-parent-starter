<template>
  <!-- 主题配置 -->
  <ReDrawer
    ref="koiDrawerRef"
    title="主题配置"
    size="320"
    :footerHidden="true"
    :closeConfirm="themeConfigCloseConfirm"
    :lock-scroll="false"
    drawer-class="theme-config-drawer"
    modal-class="theme-config-overlay"
  >
    <template #content>
      <!--
        theme-config-panel：主题配置独立作用域
        - 预览块使用 koi-* 类名，不与 html.layout-horizontal / Layout 组件类名冲突
        - isolation 防止预览 mix-blend-mode 影响抽屉外的主布局
      -->
      <div class="theme-config-panel p-t-8px select-none">
        <!-- 主题颜色选择器 -->
        <div class="config-section">
          <div class="section-header">
            <el-icon :size="18" class="section-icon"><Connection /></el-icon>
            <span class="section-title">主题颜色</span>
          </div>

          <div class="theme-colors-grid">
            <div
              v-for="color in themeColors"
              :key="color"
              class="theme-color-item"
              @click="changeThemeColor(color)"
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

        <!-- 布局样式选择器 -->
        <div class="config-section">
          <div class="section-header">
            <el-icon :size="18" class="section-icon"><Notification /></el-icon>
            <span class="section-title">布局样式</span>
          </div>

          <div class="koi-layout-grid">
            <div
              v-for="layoutOption in layoutOptions"
              :key="layoutOption.value"
              :class="['koi-layout-item', layoutOption.previewClass, { 'is-active': layout === layoutOption.value }]"
              @click="setLayout(layoutOption.value)"
            >
              <div class="koi-layout-preview">
                <div class="koi-block-aside"></div>
                <div class="koi-layout-inner" v-if="layoutOption.hasContainer">
                  <div class="koi-block-header"></div>
                  <div class="koi-block-main"></div>
                </div>
                <div class="koi-block-header" v-if="!layoutOption.hasContainer && layoutOption.hasLight"></div>
                <div
                  class="koi-block-main"
                  v-if="
                    !layoutOption.hasContainer &&
                    !layoutOption.hasLight &&
                    layoutOption.value !== 'columns' &&
                    layoutOption.value !== 'gradation-columns' &&
                    layoutOption.value !== 'frosted-columns'
                  "
                ></div>
                <template
                  v-if="
                    layoutOption.value === 'columns' ||
                    layoutOption.value === 'gradation-columns' ||
                    layoutOption.value === 'frosted-columns'
                  "
                >
                  <div class="koi-block-header"></div>
                  <div class="koi-block-main"></div>
                </template>
              </div>
              <div class="koi-layout-label">{{ layoutOption.label }}</div>
              <div class="koi-layout-check" v-if="layout === layoutOption.value">
                <el-icon><Check /></el-icon>
              </div>
            </div>
          </div>
        </div>

        <!-- 登录页样式选择器 -->
        <div class="config-section">
          <div class="section-header">
            <el-icon :size="18" class="section-icon"><Monitor /></el-icon>
            <span class="section-title">登录页样式</span>
          </div>

          <div class="koi-login-grid">
            <div
              v-for="loginOption in loginStyleOptions"
              :key="loginOption.value"
              :class="['koi-login-item', loginOption.previewClass, { 'is-active': loginStyle === loginOption.value }]"
              @click="globalStore.setGlobalState('loginStyle', loginOption.value)"
            >
              <div class="koi-login-preview">
                <div class="koi-login-preview-form">
                  <span class="koi-login-preview-line koi-login-preview-line--title"></span>
                  <span class="koi-login-preview-line"></span>
                  <span class="koi-login-preview-line"></span>
                  <span class="koi-login-preview-btn"></span>
                </div>
              </div>
              <div class="koi-layout-label">{{ loginOption.label }}</div>
              <div class="koi-layout-check" v-if="loginStyle === loginOption.value">
                <el-icon><Check /></el-icon>
              </div>
            </div>
          </div>
        </div>

        <!-- 界面配置 -->
        <div class="config-section">
          <div class="section-header">
            <el-icon :size="18" class="section-icon"><ChatLineRound /></el-icon>
            <span class="section-title">界面配置</span>
          </div>

          <div class="interface-config">
            <div class="config-item">
              <div class="config-label">
                <span>路由动画</span>
              </div>
              <el-select placeholder="请选择路由动画" v-model="transition" clearable class="config-input">
                <el-option label="无动画" value="none" />
                <el-option label="默认" value="fade-default" />
                <el-option label="淡入淡出" value="fade" />
                <el-option label="滑动" value="fade-slide" />
                <el-option label="渐变" value="zoom-fade" />
                <el-option label="底部滑出" value="fade-bottom" />
                <el-option label="缩放消退" value="fade-scale" />
              </el-select>
            </div>

            <div class="config-item">
              <div class="config-label">菜单宽度</div>
              <el-input-number class="config-input" :min="200" :max="260" :step="2" v-model="menuWidth" />
            </div>

            <div class="config-item">
              <div class="config-label">标签页风格</div>
              <el-select placeholder="请选择标签页风格" v-model="tabsStyle" class="config-input">
                <el-option label="标签风格" value="card" />
                <el-option label="谷歌风格" value="google" />
                <el-option label="简约风格" value="plain" />
              </el-select>
            </div>

            <div class="config-item">
              <div class="config-label">组件尺寸</div>
              <el-select
                placeholder="请选择组件尺寸"
                v-model="dimension"
                clearable
                class="config-input"
                @change="handleDimension"
              >
                <el-option v-for="item in dimensionList" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </div>

            <div class="config-item">
              <div class="config-label">
                <span>菜单手风琴</span>
                <el-tooltip content="菜单展开[启用-单个/关闭-多个]">
                  <el-icon class="warning-icon"><Warning /></el-icon>
                </el-tooltip>
              </div>
              <el-switch
                active-text="启用"
                inactive-text="停用"
                :active-value="true"
                :inactive-value="false"
                :inline-prompt="true"
                v-model="uniqueOpened"
              />
            </div>

            <div class="config-item">
              <div class="config-label">侧边栏反转色</div>
              <el-switch
                active-text="启用"
                inactive-text="停用"
                :active-value="true"
                :inactive-value="false"
                :inline-prompt="true"
                v-model="asideInverted"
              />
            </div>

            <div class="config-item">
              <div class="config-label">头部反转色</div>
              <el-switch
                active-text="启用"
                inactive-text="停用"
                :active-value="true"
                :inactive-value="false"
                :inline-prompt="true"
                v-model="headerInverted"
              />
            </div>

            <div class="config-item">
              <div class="config-label">灰色模式</div>
              <el-switch
                active-text="启用"
                inactive-text="停用"
                :active-value="true"
                :inactive-value="false"
                :inline-prompt="true"
                v-model="isGrey"
                @change="changeGreyOrWeak('grey', !!$event)"
              />
            </div>

            <div class="config-item">
              <div class="config-label">色弱模式</div>
              <el-switch
                active-text="启用"
                inactive-text="停用"
                :active-value="true"
                :inactive-value="false"
                :inline-prompt="true"
                v-model="isWeak"
                @change="changeGreyOrWeak('weak', !!$event)"
              />
            </div>

            <div class="config-item">
              <div class="config-label">折叠菜单</div>
              <el-switch
                v-model="isCollapse"
                active-text="展开"
                inactive-text="折叠"
                :active-value="true"
                :inactive-value="false"
                :inline-prompt="true"
              />
            </div>
          </div>
        </div>
      </div>
    </template>
  </ReDrawer>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from "vue";
import { DEFAULT_THEME } from "@repo/config";
import { useTheme } from "@repo/theme";
import { storeToRefs } from "pinia";
import { mittBus } from "@repo/utils";
import useGlobalStore from "@repo/pinia/modules/global";
import { msgSuccess } from "@repo/core";
import { useI18n } from "vue-i18n";
import { getConfig } from "@repo/config";
const { t } = useI18n();
const globalStore = useGlobalStore();

// 主题配置抽屉关闭是否二次确认（app.yaml other.themeConfigCloseConfirm）
const themeConfigCloseConfirm = computed(() => getConfig().other.themeConfigCloseConfirm);

const { changeThemeColor, changeGreyOrWeak } = useTheme();
const {
  layout,
  isCollapse,
  transition,
  tabsStyle,
  uniqueOpened,
  menuWidth,
  isGrey,
  isWeak,
  asideInverted,
  headerInverted,
  loginStyle
} = storeToRefs(globalStore);

// 组件尺寸相关
const dimension = computed(() => globalStore.dimension);
const dimensionList = ref<any>([]);

onMounted(() => {
  handleSwitchLanguage();
  mittBus.on(THEME_CONFIG_EVENT, handleThemeConfig);
});

onUnmounted(() => {
  mittBus.off(THEME_CONFIG_EVENT, handleThemeConfig);
});

/** 切换语言 */
const handleSwitchLanguage = () => {
  dimensionList.value = [
    { label: t("header.dimensionList.default"), value: "default" },
    { label: t("header.dimensionList.large"), value: "large" },
    { label: t("header.dimensionList.small"), value: "small" }
  ];
};

/** 监听 globalStore.language 的变化 */
watch(
  () => globalStore.language,
  () => {
    handleSwitchLanguage();
  }
);

const handleDimension = (item: string) => {
  if (dimension.value === item) return;
  globalStore.setDimension(item);
  msgSuccess(t("msg.success"));
};

// 主题颜色配置
const themeColors = [
  DEFAULT_THEME,
  "#1E71EE",
  "#6169FF",
  "#8076C3",
  "#1BA784",
  "#316C72",
  "#FF6B35",
  "#0099FF",
  "#EF4444",
  "#8B5CF6",
  "#EC4899",
  "#06B6D4"
];

/** 布局预览类名 koi-* 前缀，避免与 html class / 真实 Layout 组件冲突 */
const layoutOptions = [
  { value: "vertical", label: "纵向", previewClass: "koi-layout-vertical", hasContainer: true, hasLight: false },
  { value: "columns", label: "分栏", previewClass: "koi-layout-columns", hasContainer: false, hasLight: false },
  { value: "classic", label: "经典", previewClass: "koi-layout-classic", hasContainer: true, hasLight: false },
  { value: "optimum", label: "混合", previewClass: "koi-layout-optimum", hasContainer: true, hasLight: false },
  { value: "horizontal", label: "横向", previewClass: "koi-layout-horizontal", hasContainer: false, hasLight: false }
];

/** 登录页样式选项（与 views/login/loginStyles.ts 保持一致） */
const loginStyleOptions = [
  { value: "default", label: "臻享双栏", previewClass: "koi-login-dual" },
  { value: "glass", label: "动感玻璃", previewClass: "koi-login-glass" },
  { value: "slide", label: "滑动登录", previewClass: "koi-login-slide" },
  { value: "bubble", label: "气泡简约", previewClass: "koi-login-bubble" },
  { value: "split", label: "分屏沉浸", previewClass: "koi-login-split" },
  { value: "simple", label: "经典点阵", previewClass: "koi-login-simple" }
];

const koiDrawerRef = ref();
const THEME_CONFIG_EVENT = "handleThemeConfig";

/** 打开主题配置 */
const handleThemeConfig = () => {
  koiDrawerRef.value?.koiOpen();
};

/** 布局切换（class 同步由 useTheme watch 自动完成，此处只改 store） */
const setLayout = (value: string) => {
  globalStore.setGlobalState("layout", value);
};

</script>

<style lang="scss">
/** 主题抽屉：遮罩与面板同速过渡，避免先亮遮罩后出面板造成的闪一下 */
.el-overlay.theme-config-overlay {
  transition: opacity 0.2s ease !important;
}

.el-drawer.theme-config-drawer {
  transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
}
</style>

<style lang="scss" scoped>
/** 主题配置面板：独立作用域，预览类名 koi-* 与真实 Layout 隔离 */
.theme-config-panel {
  isolation: isolate;
  contain: layout style;
}

.config-section {
  margin-bottom: 20px;
}

.section-header {
  display: flex;
  align-items: center;
  padding-bottom: 16px;
  margin-bottom: 20px;

  .section-icon {
    margin-right: 12px;
    font-size: 18px;
    color: var(--el-color-primary);
    opacity: 0.9;
    transition: all 0.3s ease;
  }

  .section-title {
    position: relative;
    font-size: 16px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    letter-spacing: 0.3px;

    &::after {
      position: absolute;
      bottom: -8px;
      left: 0;
      width: 40px;
      height: 3px;
      content: "";
      background: linear-gradient(135deg, var(--el-color-primary) 0%, var(--el-color-primary-light-3) 50%, transparent 100%);
      border-radius: 2px;
      box-shadow: 0 2px 8px rgba(var(--el-color-primary-rgb), 0.3);
      animation: title-underline 3s ease-in-out infinite;
    }

    &::before {
      position: absolute;
      top: -2px;
      left: -4px;
      width: 6px;
      height: 6px;
      content: "";
      background: var(--el-color-primary);
      border-radius: 50%;
      opacity: 0.6;
      animation: title-dot 2s ease-in-out infinite;
    }
  }

  &:hover {
    .section-icon {
      opacity: 1;
      transform: scale(1.1);
    }

    .section-title::after {
      width: 50px;
      animation: title-underline-hover 0.6s ease forwards;
    }
  }
}

/** 主题颜色选择器 */
.theme-colors-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;

  .theme-color-item {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 8px 6px;
    cursor: pointer;
    border: 2px solid transparent;
    border-radius: 10px;
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
      width: 32px;
      height: 32px;
      border-radius: 6px;
      box-shadow: 0 3px 8px rgba(0, 0, 0, 0.12);
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

/** 毛玻璃布局背景缩略图：3 列 × 2 行 */
.frost-wallpaper-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.frost-wallpaper-item {
  position: relative;
  aspect-ratio: 16 / 10;
  padding: 0;
  overflow: hidden;
  cursor: pointer;
  /** 兜底色在行内 frostWallpaperThumbStyle 中与主题联动；此处仅作 CSS 降级 */
  background-color: color-mix(in srgb, var(--el-color-primary) 14%, var(--el-fill-color-light));
  background-size: cover;
  background-position: center;
  border: 2px solid transparent;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgb(0 0 0 / 6%);
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 14px rgb(0 0 0 / 10%);
  }

  &.is-active {
    border-color: var(--el-color-primary);
    box-shadow: 0 2px 12px rgba(var(--el-color-primary-rgb), 0.35);
  }
}

.frost-wallpaper-check {
  position: absolute;
  right: 4px;
  bottom: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  font-size: 12px;
  color: #fff;
  background: var(--el-color-primary);
  border-radius: 50%;
}

/** 布局配置预览（koi-* 与真实 Layout / html class 隔离） */
.koi-layout-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;

  .koi-layout-item {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 12px 8px;
    cursor: pointer;
    border: 2px solid transparent;
    border-radius: 12px;
    background: var(--el-bg-color);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

    &:hover {
      background-color: var(--el-fill-color-light);
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
    }

    &.is-active {
      background-color: var(--el-color-primary-light-9);
      border-color: var(--el-color-primary);
      box-shadow: 0 4px 20px rgba(var(--el-color-primary-rgb), 0.3);
    }

    .koi-layout-preview {
      isolation: isolate;
      width: 80px;
      height: 60px;
      margin-bottom: 8px;
      padding: 6px;
      border-radius: 8px;
      background: var(--el-fill-color-lighter);
      box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);

      .koi-block-aside {
        background: linear-gradient(135deg, var(--el-color-primary), var(--el-color-primary-light-3));
        border-radius: 4px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }

      .koi-block-header {
        background: linear-gradient(135deg, var(--el-color-primary-light-5), var(--el-color-primary-light-7));
        border-radius: 4px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      }

      .koi-block-main {
        background: linear-gradient(135deg, var(--el-color-primary-light-8), var(--el-color-primary-light-9));
        border: 1px dashed var(--el-color-primary-light-5);
        border-radius: 4px;
      }
    }

    .koi-layout-label {
      font-size: 14px;
      font-weight: 500;
      color: var(--el-text-color-primary);
      text-align: center;
    }

    .koi-layout-check {
      position: absolute;
      top: 6px;
      right: 6px;
      width: 18px;
      height: 18px;
      background: var(--el-color-primary);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 11px;
      animation: fadeInScale 0.3s ease;
    }
  }

  .koi-layout-vertical .koi-layout-preview {
    display: flex;
    justify-content: space-between;

    .koi-block-aside {
      width: 20%;
    }

    .koi-layout-inner {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      width: 73%;

      .koi-block-header {
        height: 20%;
      }

      .koi-block-main {
        height: 69%;
      }
    }
  }

  .koi-layout-gradation .koi-layout-preview {
    display: flex;
    justify-content: space-between;

    .koi-block-aside {
      width: 20%;
      border-radius: 3px;
    }

    .koi-layout-inner {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      width: 73%;
      padding: 2px;
      border-radius: 6px;
      background: linear-gradient(
        135deg,
        color-mix(in srgb, var(--el-color-primary) 22%, var(--el-bg-color-page)),
        color-mix(in srgb, var(--el-bg-color-page) 88%, transparent)
      );

      .koi-block-header {
        height: 17%;
      }

      .koi-block-main {
        height: 70%;
        border-radius: 5px;
      }
    }
  }

  .koi-layout-frosted .koi-layout-preview {
    display: flex;
    justify-content: space-between;
    position: relative;
    overflow: hidden;

    &::after {
      position: absolute;
      inset: 0;
      pointer-events: none;
      content: "";
      background: linear-gradient(
        125deg,
        transparent 30%,
        color-mix(in srgb, var(--el-color-primary-light-7) 55%, transparent) 48%,
        transparent 62%
      );
      opacity: 0.45;
      mix-blend-mode: soft-light;
    }

    .koi-block-aside {
      width: 20%;
      border-radius: 3px;
      filter: blur(0.3px);
    }

    .koi-layout-inner {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      width: 73%;
      padding: 2px;
      border-radius: 6px;
      background: linear-gradient(
        135deg,
        color-mix(in srgb, var(--el-color-primary) 18%, var(--el-bg-color-page)),
        color-mix(in srgb, var(--el-bg-color-page) 82%, transparent)
      );
      backdrop-filter: blur(1px);

      .koi-block-header {
        height: 17%;
        opacity: 0.85;
      }

      .koi-block-main {
        height: 70%;
        border-radius: 5px;
        border: 1px dashed color-mix(in srgb, var(--el-color-primary) 35%, transparent);
      }
    }
  }

  .koi-layout-columns .koi-layout-preview {
    display: flex;
    justify-content: space-between;

    .koi-block-aside {
      width: 14%;
    }

    .koi-block-header {
      width: 17%;
    }

    .koi-block-main {
      width: 55%;
    }
  }

  .koi-layout-gradation-columns .koi-layout-preview {
    display: flex;
    justify-content: space-between;

    .koi-block-aside {
      width: 14%;
      border-radius: 3px;
    }

    .koi-block-header {
      width: 17%;
      border-radius: 3px;
      opacity: 0.95;
    }

    .koi-block-main {
      width: 53%;
      padding: 2px;
      border-radius: 6px;
      box-sizing: border-box;
      background: linear-gradient(
        125deg,
        color-mix(in srgb, var(--el-color-primary) 14%, var(--el-bg-color-page)),
        color-mix(in srgb, var(--el-bg-color-page) 90%, #fafbfc)
      );
    }
  }

  .koi-layout-frosted-columns .koi-layout-preview {
    display: flex;
    justify-content: space-between;
    position: relative;
    overflow: hidden;

    &::after {
      position: absolute;
      inset: 0;
      pointer-events: none;
      content: "";
      background: linear-gradient(
        125deg,
        transparent 30%,
        color-mix(in srgb, var(--el-color-primary-light-7) 48%, transparent) 50%,
        transparent 64%
      );
      opacity: 0.42;
      mix-blend-mode: soft-light;
    }

    .koi-block-aside {
      width: 14%;
      border-radius: 3px;
      filter: blur(0.2px);
    }

    .koi-block-header {
      width: 17%;
      border-radius: 3px;
      opacity: 0.93;
    }

    .koi-block-main {
      width: 53%;
      padding: 2px;
      border-radius: 6px;
      box-sizing: border-box;
      background: linear-gradient(
        125deg,
        color-mix(in srgb, var(--el-color-primary) 17%, var(--el-bg-color-page)),
        color-mix(in srgb, var(--el-bg-color-page) 86%, transparent)
      );
      border: 1px dashed color-mix(in srgb, var(--el-color-primary) 30%, transparent);
    }
  }

  .koi-layout-classic .koi-layout-preview {
    display: flex;
    flex-direction: column;
    justify-content: space-between;

    .koi-block-aside {
      height: 22%;
    }

    .koi-layout-inner {
      display: flex;
      justify-content: space-between;
      height: 70%;

      .koi-block-header {
        width: 20%;
      }

      .koi-block-main {
        width: 70%;
      }
    }
  }

  .koi-layout-optimum .koi-layout-preview {
    display: flex;
    justify-content: space-between;

    .koi-block-aside {
      width: 20%;
    }

    .koi-layout-inner {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      width: 73%;

      .koi-block-header {
        height: 16%;
      }

      .koi-block-main {
        height: 72%;
      }
    }
  }

  .koi-layout-horizontal .koi-layout-preview {
    display: flex;
    flex-direction: column;
    justify-content: space-between;

    .koi-block-aside {
      height: 20%;
    }

    .koi-block-main {
      height: 67%;
    }
  }
}

/** 登录页样式选择器（与布局选择器同风格） */
.koi-login-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;

  .koi-login-item {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 12px 8px;
    cursor: pointer;
    border: 2px solid transparent;
    border-radius: 12px;
    background: var(--el-bg-color);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

    &:hover {
      background-color: var(--el-fill-color-light);
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
    }

    &.is-active {
      background-color: var(--el-color-primary-light-9);
      border-color: var(--el-color-primary);
      box-shadow: 0 4px 20px rgba(var(--el-color-primary-rgb), 0.3);
    }

    .koi-login-preview {
      isolation: isolate;
      width: 80px;
      height: 60px;
      margin-bottom: 8px;
      padding: 8px;
      border-radius: 8px;
      background: var(--el-fill-color-lighter);
      box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
      overflow: hidden;
      position: relative;

      /* 表单骨架 */
      .koi-login-preview-form {
        display: flex;
        flex-direction: column;
        gap: 4px;
        width: 42%;
        padding: 5px 6px;
        border-radius: 4px;
        background: var(--el-bg-color);
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
      }

      .koi-login-preview-line {
        display: block;
        width: 100%;
        height: 3px;
        border-radius: 2px;
        background: var(--el-border-color);

        &--title {
          width: 70%;
          height: 5px;
          background: var(--el-color-primary);
          margin-bottom: 2px;
        }
      }

      .koi-login-preview-btn {
        display: block;
        width: 100%;
        height: 6px;
        border-radius: 3px;
        margin-top: 2px;
        background: var(--el-color-primary);
        opacity: 0.85;
      }
    }

    /* 各样式缩略图差异 */
    .koi-login-glass .koi-login-preview {
      background: var(--el-color-primary-light-8);
    }

    .koi-login-slide .koi-login-preview {
      .koi-login-preview-form {
        margin-left: auto;
      }
    }

    .koi-login-split .koi-login-preview {
      background: linear-gradient(135deg, var(--el-color-primary-light-5) 55%, var(--el-fill-color-lighter) 55%);
    }

    .koi-login-simple .koi-login-preview {
      background-image: radial-gradient(var(--el-color-primary-light-5) 1px, transparent 1px);
      background-size: 10px 10px;
    }

    .koi-layout-label {
      font-size: 14px;
      font-weight: 500;
      color: var(--el-text-color-primary);
      text-align: center;
    }

    .koi-layout-check {
      position: absolute;
      top: 6px;
      right: 6px;
      width: 18px;
      height: 18px;
      background: var(--el-color-primary);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 11px;
      animation: fadeInScale 0.3s ease;
    }
  }
}

/** 界面配置 */
.interface-config {
  .config-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 0;
    border-bottom: 1px solid var(--el-border-color-extra-light);

    &:last-child {
      border-bottom: none;
    }

    .config-label {
      display: flex;
      align-items: center;
      flex: 1;
      min-width: 0;
      margin-right: 16px;
      font-size: 14px;
      color: var(--el-text-color-primary);
      font-weight: 500;
      line-height: 1.4;

      .warning-icon {
        margin-left: 2px;
        color: var(--el-text-color-secondary);
        cursor: help;
        transition: color 0.2s ease;
        flex-shrink: 0;

        &:hover {
          color: var(--el-color-primary);
        }
      }
    }

    .config-input {
      width: 180px;
      flex-shrink: 1;
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

@keyframes title-underline {
  0%,
  100% {
    transform: scaleX(1);
    opacity: 0.8;
  }
  50% {
    transform: scaleX(1.1);
    opacity: 1;
  }
}

@keyframes title-underline-hover {
  0% {
    transform: scaleX(1);
  }
  50% {
    transform: scaleX(1.2);
  }
  100% {
    transform: scaleX(1);
  }
}

@keyframes title-dot {
  0%,
  100% {
    transform: scale(1);
    opacity: 0.6;
  }
  50% {
    transform: scale(1.3);
    opacity: 0.9;
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

/** 响应式设计 */
// @media (max-width: 768px) {
//   .theme-colors-grid {
//     grid-template-columns: repeat(3, 1fr);
//     gap: 12px;
//   }

//   .layout-grid {
//     grid-template-columns: 1fr;
//     gap: 16px;
//   }

//   .interface-utils .utils-item {
//     flex-direction: column;
//     align-items: flex-start;
//     gap: 12px;

//     .utils-input {
//       width: 100%;
//     }
//   }
// }
</style>
