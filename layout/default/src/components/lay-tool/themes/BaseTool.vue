<script setup lang="ts">
import { useNav } from "../../../hooks/useNav";
import { useTranslationLang } from "../../../hooks/useTranslationLang";
import LaySearch from "../../lay-search/index.vue";
import LayMessage from "../../lay-message/index.vue";
import LayTaskCenter from "../../lay-task-center/index.vue";
import LaySidebarFullScreen from "../../lay-sidebar/components/SidebarFullScreen.vue";
import LangDropdown from "../dropdowns/LangDropdown.vue";
import UserDropdown from "../dropdowns/UserDropdown.vue";
import Setting from "@iconify-icons/ri/settings-3-line";
import { getConfig } from "@repo/config";
import { emitter } from "@repo/core";
import { ref, computed, onBeforeUnmount } from "vue";
import { useGlobal } from "@pureadmin/utils";
import HeaderClock from "../HeaderClock.vue";
import ToolItem from "../components/ToolItem.vue";
import {
  toggleTaskCenterPanel,
  useTaskCenterState,
} from "../../lay-task-center/service";

// 接收主题类名
const props = defineProps<{
  themeClass?: string;
}>();

// 获取当前主题和配置
const { $storage } = useGlobal<GlobalPropertiesApi>();
const { onPanel } = useNav();
const { t } = useTranslationLang();
const pageBehavior = computed(() => getConfig().PageBehavior ?? {});

// 当前主题 - 用于节日主题按钮显示
const storageTheme = computed(
  () => $storage?.configure?.systemTheme || "default",
);
const currentTheme = ref<string>(storageTheme.value);

const handleThemeChange = (themeKey: string) => {
  currentTheme.value = themeKey;
};

// 监听主题变化
emitter.on("systemThemeChange", handleThemeChange);

// 主题判断函数
const isTech = () => currentTheme.value === "tech";
const isHolidayActive = computed(() => isTech());

const settingThemeClass = computed(() => ({
  "future-setting": isTech(),
}));

const resolveBooleanOverride = (value: unknown): boolean | null =>
  typeof value === "boolean" ? value : null;

const showSearchOverride = ref<boolean | null>(
  resolveBooleanOverride($storage?.configure?.showSearch),
);
const showFullscreen = ref($storage?.configure?.showFullscreen ?? true);
const showTaskCenterOverride = ref<boolean | null>(
  resolveBooleanOverride($storage?.configure?.showTaskCenter),
);
const showHeaderClockOverride = ref<boolean | null>(
  resolveBooleanOverride($storage?.configure?.showHeaderClock),
);
const { activeTaskCount } = useTaskCenterState();
const showSearch = computed(
  () => showSearchOverride.value ?? getConfig().ShowBarSearch ?? true,
);
const showTaskCenter = computed(() => showTaskCenterOverride.value ?? true);
const showHeaderClock = computed(
  () =>
    showHeaderClockOverride.value ?? pageBehavior.value.showHeaderClock ?? true,
);

// 监听界面元素显示设置变化
const handleShowSearchChange = (val: boolean) => {
  showSearchOverride.value = val;
};
const handleShowFullscreenChange = (val: boolean) => {
  showFullscreen.value = val;
};
const handleShowTaskCenterChange = (val: boolean) => {
  showTaskCenterOverride.value = val;
};
const handleShowHeaderClockChange = (val: boolean) => {
  showHeaderClockOverride.value = val;
};

emitter.on("showSearchChange", handleShowSearchChange);
emitter.on("showFullscreenChange", handleShowFullscreenChange);
emitter.on("showTaskCenterChange", handleShowTaskCenterChange);
emitter.on("showHeaderClockChange", handleShowHeaderClockChange);

onBeforeUnmount(() => {
  emitter.off("systemThemeChange", handleThemeChange);
  emitter.off("showSearchChange", handleShowSearchChange);
  emitter.off("showFullscreenChange", handleShowFullscreenChange);
  emitter.off("showTaskCenterChange", handleShowTaskCenterChange);
  emitter.off("showHeaderClockChange", handleShowHeaderClockChange);
});
</script>

<template>
  <div :class="['tool-bar', themeClass]">
    <!-- 搜索 -->
    <LaySearch v-if="showSearch" id="header-search" class="tool-item" />

    <!-- 全屏 -->
    <LaySidebarFullScreen
      v-if="showFullscreen"
      id="full-screen"
      class="tool-item"
    />

    <!-- 消息 -->
    <LayMessage id="header-message" class="tool-item" />

    <ToolItem
      v-if="showTaskCenter"
      id="header-task-center"
      title="任务中心"
      @click="toggleTaskCenterPanel"
    >
      <span class="task-center-trigger">
        <IconifyIconOnline
          icon="mdi:lightning-bolt-outline"
          class="task-center-trigger__icon"
        />
        <span v-if="activeTaskCount > 0" class="task-center-trigger__badge">
          {{ activeTaskCount > 99 ? "99+" : activeTaskCount }}
        </span>
      </span>
    </ToolItem>

    <!-- 语言切换 - 组件化 -->
    <LangDropdown v-if="getConfig().ShowLanguage" />

    <!-- 用户头像下拉菜单 - 组件化 -->
    <UserDropdown />

    <!-- 顶部时间显示（主要用于全屏/大屏场景） -->
    <div
      v-if="showHeaderClock"
      class="tool-item header-clock"
      aria-label="当前时间"
    >
      <HeaderClock />
    </div>

    <!-- 系统设置 -->
    <ToolItem v-if="getConfig().ShowBarSetting" @click="onPanel">
      <span class="setting-content">
        <IconifyIconOffline
          v-if="!isHolidayActive"
          :icon="Setting"
          class="setting-icon"
        />
        <ScText
          v-else-if="isTech()"
          class="setting-symbol setting-symbol--future"
          >⚡</ScText
        >
      </span>
    </ToolItem>

    <LayTaskCenter />
  </div>
</template>

<style lang="scss" scoped>
// 基础布局样式 - 所有主题共用
.tool-bar {
  --lay-tool-trigger-bg: rgba(255, 255, 255, 0.42);
  --lay-tool-trigger-border: rgba(148, 163, 184, 0.16);
  --lay-tool-trigger-color: var(--el-text-color-regular);
  --lay-tool-trigger-hover-bg: linear-gradient(
    135deg,
    rgba(var(--el-color-primary-rgb), 0.12) 0%,
    rgba(var(--el-color-primary-rgb), 0.06) 100%
  );
  --lay-tool-trigger-hover-border: rgba(var(--el-color-primary-rgb), 0.18);
  --lay-tool-trigger-hover-shadow: 0 10px 24px
    rgba(var(--el-color-primary-rgb), 0.14);
  --lay-tool-clock-bg: linear-gradient(
    135deg,
    rgba(var(--el-color-primary-rgb), 0.12) 0%,
    rgba(var(--el-color-primary-rgb), 0.04) 100%
  );
  --lay-tool-clock-border: rgba(var(--el-color-primary-rgb), 0.2);
  --lay-tool-clock-shadow:
    0 10px 24px rgba(var(--el-color-primary-rgb), 0.12),
    inset 0 1px 0 rgba(255, 255, 255, 0.28);
  display: flex;
  align-items: center;
  gap: 8px;
  height: var(--navbar-height, 56px);
  padding: 0 10px;
  flex-wrap: nowrap;
  white-space: nowrap;
}

.tool-item {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 14px;
  cursor: pointer;
  color: var(--lay-tool-trigger-color);
  background: var(--lay-tool-trigger-bg);
  border: 1px solid var(--lay-tool-trigger-border);
  transition: all 0.24s ease;
  font-size: 16px;
  z-index: 1;
  flex-shrink: 0;
  backdrop-filter: blur(14px);

  /* 光泽层 */
  &::before {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: 12px;
    background: linear-gradient(
      135deg,
      rgba(255, 255, 255, 0.1) 0%,
      transparent 50%
    );
    opacity: 0;
    transition: opacity 0.3s ease;
    pointer-events: none;
    z-index: -1;
  }

  &:hover {
    background: var(--lay-tool-trigger-hover-bg);
    border-color: var(--lay-tool-trigger-hover-border);
    color: var(--el-color-primary);
    transform: translateY(-1px);
    box-shadow: var(--lay-tool-trigger-hover-shadow);

    &::before {
      opacity: 1;
    }
  }

  &:active {
    transform: translateY(0);
    box-shadow: 0 2px 6px rgba(var(--el-color-primary-rgb), 0.1);
  }
}

.task-center-trigger {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.task-center-trigger__icon {
  font-size: 18px;
}

.task-center-trigger__badge {
  position: absolute;
  top: -8px;
  right: -10px;
  min-width: 18px;
  height: 18px;
  padding: 0 4px;
  border-radius: 999px;
  background: linear-gradient(135deg, #0f92ff, #38bdf8);
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  line-height: 18px;
  text-align: center;
  box-shadow: 0 8px 18px rgba(15, 146, 255, 0.26);
}

.setting-btn {
  font-size: 20px;
  overflow: visible;
  min-width: 42px;

  &:hover {
    background: linear-gradient(
      135deg,
      rgba(var(--el-color-primary-rgb), 0.15) 0%,
      rgba(var(--el-color-primary-rgb), 0.08) 100%
    );

    :deep(svg) {
      animation: spin 3s linear infinite;
    }
  }
}

.setting-content {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.setting-icon {
  font-size: 15px;
  flex-shrink: 0;
}

.setting-symbol {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  font-weight: 800;
  letter-spacing: 0.08em;
  line-height: 1;

  &--future {
    font-size: 16px;
  }
}

.header-clock {
  min-width: 178px;
  width: auto;
  padding: 0 14px;
  font-variant-numeric: tabular-nums;
  justify-content: flex-start;
  gap: 10px;
  background: var(--lay-tool-clock-bg);
  border: 1px solid var(--lay-tool-clock-border);
  box-shadow: var(--lay-tool-clock-shadow);
  flex: 0 0 auto;
  white-space: nowrap;
  overflow: hidden;
}

html.dark .tool-bar {
  --lay-tool-trigger-bg: rgba(15, 23, 42, 0.68);
  --lay-tool-trigger-border: rgba(148, 163, 184, 0.18);
  --lay-tool-trigger-color: #dbe4f0;
  --lay-tool-trigger-hover-bg: linear-gradient(
    135deg,
    rgba(var(--el-color-primary-rgb), 0.22) 0%,
    rgba(15, 23, 42, 0.88) 100%
  );
  --lay-tool-trigger-hover-border: rgba(var(--el-color-primary-rgb), 0.34);
  --lay-tool-trigger-hover-shadow: 0 12px 26px rgba(2, 8, 23, 0.38);
  --lay-tool-clock-bg: linear-gradient(
    135deg,
    rgba(var(--el-color-primary-rgb), 0.2) 0%,
    rgba(15, 23, 42, 0.9) 100%
  );
  --lay-tool-clock-border: rgba(var(--el-color-primary-rgb), 0.3);
  --lay-tool-clock-shadow:
    0 18px 36px rgba(2, 8, 23, 0.36),
    inset 0 1px 0 rgba(255, 255, 255, 0.04);
}



.future-setting {
  letter-spacing: 0.08em;

  &:hover {
    box-shadow:
      0 0 18px rgba(0, 255, 255, 0.28),
      inset 0 0 10px rgba(0, 255, 255, 0.18);
  }
}



@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

</style>
