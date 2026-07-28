<template>
  <div
    class="header-right"
    :class="{ 'is-header-inverted': isHeaderInverted }"
    ref="toolbarRef"
  >
    <!-- 搜索菜单 -->
    <SearchMenu v-show="isCollapsed"></SearchMenu>
    <!-- ElementPlus 尺寸配置 -->
    <!-- <Dimension v-if="isCollapsed"></Dimension> -->
    <!-- 路由缓存刷新 -->
    <Refresh v-show="isCollapsed"></Refresh>
    <!-- 明亮/暗黑模式图标 -->
    <Dark></Dark>
    <!-- 中英文翻译 -->
    <Language v-if="isCollapsed"></Language>
    <!-- 全屏图标 -->
    <FullScreen></FullScreen>
    <!-- 主题配置 -->
    <ThemeSetting></ThemeSetting>
    <!-- 头像 AND 下拉折叠 -->
    <User></User>

    <!-- 工具栏折叠 -->
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
import useGlobalStore from "../../../../stores/modules/global.ts";
import { useI18n } from "vue-i18n";
import User from "../../../../layouts/components/Header/components/User.vue";
import FullScreen from "../../../../layouts/components/Header/components/FullScreen.vue";
import Dark from "../../../../layouts/components/Header/components/Dark.vue";
import ThemeSetting from "../../../../layouts/components/Header/components/ThemeSetting.vue";
import Refresh from "../../../../layouts/components/Header/components/Refresh.vue";
// import Dimension from "../../../../layouts/components/Header/components/Dimension.vue";
import Language from "../../../../layouts/components/Header/components/Language.vue";
import SearchMenu from "../../../../layouts/components/Header/components/SearchMenu.vue";

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

const isCollapsed = ref(true);
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
  // 小于1200px时自动折叠，大于等于1200px时自动展开
  if (isSmallScreen.value) {
    isCollapsed.value = false;
  } else {
    isCollapsed.value = true;
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
  padding: 2px 6px;
  background: rgba(255, 255, 255, 0.55);
  backdrop-filter: blur(16px) saturate(180%);
  -webkit-backdrop-filter: blur(16px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.45);
  border-radius: 20px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;

  /** 头部反转色：实心容器 + 折叠钮与图标 hover 同一套深色变量 */
  &.is-header-inverted {
    background-color: var(--el-header-bg-color);
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
    border: 1px solid var(--el-header-toolbar-border-color);
    box-shadow: 0 4px 12px rgb(0 0 0 / 15%);

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
    background: rgba(30, 30, 30, 0.65);
    border-color: rgba(255, 255, 255, 0.12);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);

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
