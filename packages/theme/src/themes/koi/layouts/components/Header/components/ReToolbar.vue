<template>
  <div
    class="header-right"
    :class="{ 'is-header-inverted': isHeaderInverted }"
    ref="toolbarRef"
  >
    <!-- 搜索菜单 -->
    <ReSearchMenu v-show="isCollapsed && toolbarConfig.searchMenu"></ReSearchMenu>
    <!-- ElementPlus 尺寸配置 -->
    <!-- <ReDimension v-if="isCollapsed"></ReDimension> -->
    <!-- 路由缓存刷新 -->
    <Refresh v-show="isCollapsed && toolbarConfig.refresh"></Refresh>
    <!-- 站内消息（sysMessage + socket 推送，app.yaml other.toolbar.message 控制） -->
    <ReStationMessage v-if="isCollapsed && toolbarConfig.message"></ReStationMessage>
    <!-- 明亮/暗黑模式图标 -->
    <ReDark v-if="isCollapsed && toolbarConfig.dark"></ReDark>
    <!-- 中英文翻译 -->
    <ReLanguage v-if="isCollapsed && toolbarConfig.language"></ReLanguage>
    <!-- 全屏图标 -->
    <ReFullScreen v-if="isCollapsed && toolbarConfig.fullScreen"></ReFullScreen>
    <!-- 主题配置 -->
    <ReThemeSetting v-if="isCollapsed && toolbarConfig.themeSetting"></ReThemeSetting>
    <!-- 头像 AND 下拉折叠（始终显示） -->
    <ReUser v-if="toolbarConfig.user"></ReUser>
    <!-- 大屏入口（紧贴头像右侧；仅 yaml 配置显隐，UI 不暴露开关） -->
    <ReBigscreen v-if="bigscreenConfig.enable"></ReBigscreen>
    <!-- 多时区计时器（@repo/work Worker 驱动，app.yaml other.timer 控制，始终显示本地时间） -->
    <ReTimer v-if="timerConfig.enable"></ReTimer>
    <!-- 天气 -->
    <ReWeather v-if="toolbarConfig.weather && weatherConfig.enable && weatherCapability"></ReWeather>
    <!-- 台风 -->
    <ReTyphoon v-if="toolbarConfig.typhoon && typhoonCapability"></ReTyphoon>

    <!-- 工具栏折叠（始终显示；默认折叠只显示头像，点击展开/收起图标） -->
    <div class="toolbar-toggle-wrap">
      <span class="toolbar-toggle-divider" aria-hidden="true"></span>
      <el-tooltip
        :content="isCollapsed ? t('header.collapseToolbar') : t('header.expandToolbar')"
        :show-after="1500"
        placement="bottom"
      >
        <button
          type="button"
          class="toolbar-toggle"
          :class="{ 'is-expanded': isCollapsed }"
          :aria-label="isCollapsed ? t('header.collapseToolbar') : t('header.expandToolbar')"
          @click="toggleToolbar"
        >
          <el-icon :size="14">
            <DArrowRight v-if="isCollapsed" />
            <DArrowLeft v-else />
          </el-icon>
        </button>
      </el-tooltip>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from "vue";
import { storeToRefs } from "pinia";
import { DArrowLeft, DArrowRight } from "@element-plus/icons-vue";
import useGlobalStore from "@repo/pinia/modules/global";
import { getConfig, isCapabilityEnabled } from "@repo/config";
import { useI18n } from "vue-i18n";
import ReUser from "@repo/theme/koi/layouts/components/Header/components/ReUser.vue";
import ReFullScreen from "@repo/theme/koi/layouts/components/Header/components/ReFullScreen.vue";
import ReDark from "@repo/theme/koi/layouts/components/Header/components/ReDark.vue";
import ReThemeSetting from "@repo/theme/koi/layouts/components/Header/components/ReThemeSetting.vue";
import Refresh from "@repo/theme/koi/layouts/components/Header/components/Refresh.vue";
// import ReDimension from "@repo/theme/koi/layouts/components/Header/components/ReDimension.vue";
import ReLanguage from "@repo/theme/koi/layouts/components/Header/components/ReLanguage.vue";
import ReSearchMenu from "@repo/theme/koi/layouts/components/Header/components/ReSearchMenu.vue";
import ReStationMessage from "@repo/ui/re-station-message";
import ReTimer from "@repo/theme/koi/layouts/components/Header/components/ReTimer.vue";
import ReWeather from "@repo/theme/koi/layouts/components/Header/components/ReWeather.vue";
import ReTyphoon from "@repo/theme/koi/layouts/components/Header/components/ReTyphoon.vue";
import ReBigscreen from "@repo/theme/koi/layouts/components/Header/components/ReBigscreen.vue";

const emit = defineEmits(["widthChange"]);

const { t } = useI18n();
const globalStore = useGlobalStore();
const { headerInverted, asideInverted, layout, isDark } = storeToRefs(globalStore);
/** 头部反转色（仅亮色模式）；横向布局下侧栏反转等同顶栏反转 */
const isHeaderInverted = computed(() => {
  if (isDark.value) return false;
  if (headerInverted.value) return true;
  return layout.value === "horizontal" && asideInverted.value;
});

// 框架组件显隐开关（app.yaml other.toolbar 配置）
const toolbarConfig = computed(() => getConfig().other.toolbar);
// 顶部计时器（app.yaml other.timer 配置）
const timerConfig = computed(() => getConfig().other.timer);
// 天气（app.yaml other.weather 配置）
const weatherConfig = computed(() => getConfig().other.weather);
// 业务能力开关（app.yaml other.capabilities）：关闭后台能力时对应入口一并隐藏
const weatherCapability = computed(() => isCapabilityEnabled("weather"));
const typhoonCapability = computed(() => isCapabilityEnabled("typhoon"));
// 大屏（app.yaml other.bigscreen 配置；enable 控制顶栏入口显隐，yaml-only，UI 不暴露）
const bigscreenConfig = computed(() => getConfig().other.bigscreen);

/** 工具栏展开状态：true=显示全部图标，false=折叠只显示头像 */
const isCollapsed = ref(!(toolbarConfig.value.collapse ?? true));
const isSmallScreen = ref(true);
const toolbarRef = ref<HTMLElement>();

// 获取工具栏宽度并发送给父组件
const updateToolbarWidth = () => {
  if (toolbarRef.value) {
    const width = toolbarRef.value.offsetWidth;
    emit("widthChange", width);
  }
};

// 检查屏幕尺寸
const checkScreenSize = () => {
  isSmallScreen.value = window.innerWidth < 1200;
  // 小于1200px时自动折叠（只显示头像）；大于等于1200px保持当前状态（默认按配置 toolbar.collapse）
  if (isSmallScreen.value) {
    isCollapsed.value = false;
  }

  // 更新宽度
  nextTick(() => {
    updateToolbarWidth();
  });
};

// 切换工具栏折叠状态
const toggleToolbar = () => {
  isCollapsed.value = !isCollapsed.value;
  // 切换后更新宽度
  nextTick(() => {
    updateToolbarWidth();
  });
};

// 监听折叠状态变化
watch(isCollapsed, () => {
  nextTick(() => {
    updateToolbarWidth();
  });
});

// 监听窗口大小变化
onMounted(() => {
  checkScreenSize();
  window.addEventListener("resize", checkScreenSize);

  // 初始更新宽度
  nextTick(() => {
    updateToolbarWidth();
  });
});

onUnmounted(() => {
  window.removeEventListener("resize", checkScreenSize);
});
</script>

<style lang="scss" scoped>
.header-right {
  display: flex;
  align-items: center;
  height: 100%;
  gap: 2px;
  transition: all 0.3s ease;

  /** 头部反转色：仅折叠钮与图标 hover 使用同一套深色变量 */
  &.is-header-inverted {
    .toolbar-toggle {
      color: var(--el-header-text-color);
      background: var(--el-header-toolbar-collapse-bg-color);
      border-color: var(--el-header-toolbar-border-color);
      box-shadow: none;

      &:hover {
        color: var(--el-color-primary);
        background: var(--el-header-toolbar-collapse-hover-bg-color);
        border-color: var(--el-header-toolbar-border-color);
        box-shadow: none;
      }

      &:focus-visible {
        border-color: var(--el-color-primary);
        box-shadow: 0 0 0 2px var(--el-header-toolbar-collapse-hover-bg-color);
      }
    }
  }

  html.dark & {
    .toolbar-toggle {
      color: var(--el-header-text-color);
      background: var(--el-header-toolbar-collapse-bg-color);
      border-color: var(--el-header-toolbar-border-color);
      box-shadow: none;

      &:hover {
        color: var(--el-color-primary);
        background: var(--el-header-toolbar-collapse-hover-bg-color);
        border-color: var(--el-header-toolbar-border-color);
        box-shadow: none;
      }

      &:focus-visible {
        border-color: var(--el-color-primary);
        box-shadow: 0 0 0 2px var(--el-header-toolbar-collapse-hover-bg-color);
      }
    }
  }

  .toolbar-toggle-wrap {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    margin-left: 2px;
  }

  .toolbar-toggle-divider {
    width: 1px;
    height: 18px;
    margin-right: 5px;
    background: var(--el-header-toolbar-border-color);
    opacity: 0.75;
  }

  .toolbar-toggle {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 30px;
    height: 30px;
    padding: 0;
    color: var(--el-color-primary);
    cursor: pointer;
    background: var(--el-header-toolbar-collapse-bg-color);
    border: 1px solid var(--el-color-primary-light-7);
    border-radius: 8px;
    outline: none;
    transition:
      background 0.25s ease,
      border-color 0.25s ease,
      box-shadow 0.25s ease,
      transform 0.2s ease;

    .el-icon {
      transition: transform 0.28s cubic-bezier(0.4, 0, 0.2, 1);
    }

    &.is-expanded .el-icon {
      transform: translateX(-1px);
    }

    &:not(.is-expanded) .el-icon {
      transform: translateX(1px);
    }

    &:hover {
      background: var(--el-header-toolbar-collapse-hover-bg-color);
      border-color: var(--el-color-primary-light-5);
      box-shadow: 0 2px 10px rgba(var(--el-color-primary-rgb), 0.22);
    }

    &:active {
      transform: scale(0.94);
    }

    &:focus-visible {
      border-color: var(--el-color-primary);
      box-shadow: 0 0 0 2px var(--el-color-primary-light-8);
    }
  }
}
</style>
