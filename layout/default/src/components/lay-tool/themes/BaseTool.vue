<script setup lang="ts">
import { useNav } from "../../../hooks/useNav";
import { useTranslationLang } from "../../../hooks/useTranslationLang";
import LaySearch from "../../lay-search/index.vue";
import LayMessage from "../../lay-message/index.vue";
import LaySidebarFullScreen from "../../lay-sidebar/components/SidebarFullScreen.vue";
import LangDropdown from "../dropdowns/LangDropdown.vue";
import UserDropdown from "../dropdowns/UserDropdown.vue";
import Setting from "@iconify-icons/ri/settings-3-line";
import { getConfig } from "@repo/config";
import { emitter } from "@repo/core";
import { ref, onBeforeUnmount, computed } from "vue";
import { useGlobal } from "@pureadmin/utils";

// 接收主题类名
const props = defineProps<{
  themeClass?: string;
}>();

// 获取当前主题和配置
const { $storage } = useGlobal<GlobalPropertiesApi>();
const { onPanel } = useNav();
const { t } = useTranslationLang();

// 当前主题 - 用于节日主题按钮显示
const storageTheme = computed(() => $storage?.configure?.systemTheme || 'default');
const currentTheme = ref<string>(storageTheme.value);

const handleThemeChange = (themeKey: string) => {
  currentTheme.value = themeKey;
};

// 监听主题变化
emitter.on("systemThemeChange", handleThemeChange);

// 主题判断函数
const isSpringFestival = () => currentTheme.value === 'spring-festival';
const isMidAutumn = () => currentTheme.value === 'mid-autumn';

// 界面元素显示状态 - 从存储中读取初始值
const showSearch = ref($storage.configure?.showSearch ?? getConfig().ShowBarSearch ?? true);
const showFullscreen = ref($storage.configure?.showFullscreen ?? true);

// 监听界面元素显示设置变化
emitter.on("showSearchChange", (val: boolean) => {
  showSearch.value = val;
});
emitter.on("showFullscreenChange", (val: boolean) => {
  showFullscreen.value = val;
});

// 清理事件监听
onBeforeUnmount(() => {
  emitter.off("showSearchChange");
  emitter.off("showFullscreenChange");
  emitter.off("systemThemeChange", handleThemeChange);
});
</script>

<template>
  <div :class="['tool-bar', themeClass]">
    <!-- 搜索 -->
    <LaySearch
      v-if="showSearch"
      id="header-search"
      class="tool-item"
    />

    <!-- 全屏 -->
    <LaySidebarFullScreen 
      v-if="showFullscreen" 
      id="full-screen" 
      class="tool-item" 
    />

    <!-- 消息 -->
    <LayMessage
      v-menu="['MessageCenter']"
      id="header-message"
      class="tool-item"
    />

    <!-- 语言切换 - 组件化 -->
    <LangDropdown v-if="getConfig().ShowLanguage" />

    <!-- 用户头像下拉菜单 - 组件化 -->
    <UserDropdown />

    <!-- 系统设置 -->
    <span
      v-if="getConfig().ShowBarSetting"
      :class="['tool-item', 'setting-btn', { 'fu-setting': isSpringFestival(), 'mooncake-setting': isMidAutumn() }]"
      :title="t('buttons.pureOpenSystemSet')"
      @click="onPanel"
    >
      <template v-if="isSpringFestival()">福</template>
      <template v-else-if="isMidAutumn()">🥮</template>
      <IconifyIconOffline v-else :icon="Setting" />
    </span>
  </div>
</template>

<style lang="scss" scoped>
// 基础布局样式 - 所有主题共用
.tool-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 48px;
  padding: 0 16px;
}

.tool-item {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border-radius: 12px;
  cursor: pointer;
  color: var(--el-text-color-regular);
  background: transparent;
  border: 1px solid transparent;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-size: 18px;
  z-index: 1;

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
    background: linear-gradient(
      135deg,
      rgba(var(--el-color-primary-rgb), 0.1) 0%,
      rgba(var(--el-color-primary-rgb), 0.05) 100%
    );
    border-color: rgba(var(--el-color-primary-rgb), 0.2);
    color: var(--el-color-primary);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(var(--el-color-primary-rgb), 0.15);

    &::before {
      opacity: 1;
    }
  }

  &:active {
    transform: translateY(0);
    box-shadow: 0 2px 6px rgba(var(--el-color-primary-rgb), 0.1);
  }
}

.setting-btn {
  font-size: 20px;

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

.fu-setting {
  font-family: 'STKaiti', 'KaiTi', 'SimKai', serif;
  font-size: 18px;
  font-weight: 900;
  color: #DC143C;
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.15), rgba(220, 20, 60, 0.1));
  border: 1.5px solid rgba(220, 20, 60, 0.3);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);

  &:hover {
    background: radial-gradient(circle, rgba(255, 215, 0, 0.3), rgba(220, 20, 60, 0.15));
    color: #B22222;
    border-color: rgba(220, 20, 60, 0.5);
    animation: fu-glow 2s ease-in-out infinite;
  }
}

// 中秋主题 - 月饼设置按钮
.mooncake-setting {
  font-size: 20px;
  background: linear-gradient(135deg, rgba(255, 213, 79, 0.2), rgba(26, 35, 126, 0.15));
  border: 1.5px solid rgba(255, 213, 79, 0.4);
  box-shadow: 0 2px 8px rgba(26, 35, 126, 0.2);

  &:hover {
    background: radial-gradient(circle, rgba(255, 213, 79, 0.35), rgba(26, 35, 126, 0.2));
    border-color: rgba(255, 213, 79, 0.6);
    transform: translateY(-2px) rotate(15deg);
    box-shadow: 
      0 4px 16px rgba(255, 213, 79, 0.4),
      0 0 20px rgba(255, 213, 79, 0.2);
    animation: mooncake-glow 2s ease-in-out infinite;
  }
}

@keyframes mooncake-glow {
  0%, 100% {
    filter: drop-shadow(0 0 4px rgba(255, 213, 79, 0.5));
  }
  50% {
    filter: drop-shadow(0 0 12px rgba(255, 213, 79, 0.8)) drop-shadow(0 0 20px rgba(26, 35, 126, 0.4));
  }
}

@keyframes fu-glow {
  0%, 100% {
    text-shadow: 0 0 8px rgba(220, 20, 60, 0.6), 0 1px 2px rgba(0, 0, 0, 0.2);
  }
  50% {
    text-shadow: 0 0 16px rgba(220, 20, 60, 0.8), 0 0 24px rgba(255, 215, 0, 0.6), 0 1px 2px rgba(0, 0, 0, 0.2);
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

// 语言切换触发器
.lang-style {
  .lang-icon-wrapper {
    position: relative;
    width: 32px;
    height: 32px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(
      135deg,
      var(--el-color-primary) 0%,
      var(--el-color-primary-light-3) 100%
    );
    border-radius: 50%;
    box-shadow: 0 2px 8px rgba(var(--el-color-primary-rgb), 0.3);

    .lang-main-icon {
      font-size: 16px;
      color: #fff;
    }
  }
}

// 用户下拉触发器
.user-dropdown {
  margin-left: 8px;
}

.user-trigger {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 6px 14px 6px 6px;
  border-radius: 28px;
  background: linear-gradient(
    135deg,
    var(--el-fill-color-lighter) 0%,
    var(--el-fill-color-light) 100%
  );
  border: 1px solid var(--el-border-color-lighter);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;

  /* 光泽效果 */
  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.2),
      transparent
    );
    transition: left 0.5s ease;
  }

  &:hover {
    background: linear-gradient(
      135deg,
      var(--el-fill-color-light) 0%,
      var(--el-fill-color) 100%
    );
    border-color: rgba(var(--el-color-primary-rgb), 0.3);
    box-shadow:
      0 4px 16px rgba(0, 0, 0, 0.1),
      0 2px 8px rgba(var(--el-color-primary-rgb), 0.1);
    transform: translateY(-1px);

    &::before {
      left: 100%;
    }
  }
}

.avatar-container {
  position: relative;
  width: 34px;
  height: 34px;
  flex-shrink: 0;
}

.avatar-img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid rgba(255, 255, 255, 0.8);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
}

.user-trigger:hover .avatar-img {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.status-dot {
  position: absolute;
  bottom: 1px;
  right: 1px;
  width: 10px;
  height: 10px;
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
  border: 2px solid var(--el-bg-color);
  border-radius: 50%;
  box-shadow: 0 0 0 2px rgba(34, 197, 94, 0.2);
  animation: pulse-status 2s infinite;
}

@keyframes pulse-status {
  0%,
  100% {
    box-shadow: 0 0 0 2px rgba(34, 197, 94, 0.2);
  }
  50% {
    box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.1);
  }
}

.user-info {
  display: flex;
  flex-direction: column;
  line-height: 1.3;
}

.user-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  letter-spacing: 0.2px;
}

.user-role {
  font-size: 11px;
  color: var(--el-text-color-secondary);
  font-weight: 500;
}

.dropdown-arrow-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: linear-gradient(
    135deg,
    var(--el-fill-color) 0%,
    var(--el-fill-color-light) 100%
  );
  margin-left: 4px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.dropdown-arrow {
  font-size: 14px;
  color: var(--el-text-color-placeholder);
  transition: all 0.3s ease;
}

.user-trigger:hover .dropdown-arrow-wrapper {
  background: linear-gradient(
    135deg,
    var(--el-color-primary-light-8) 0%,
    var(--el-color-primary-light-9) 100%
  );
  box-shadow: 0 2px 6px rgba(var(--el-color-primary-rgb), 0.2);

  .dropdown-arrow {
    color: var(--el-color-primary);
  }
}

.user-dropdown:focus-within .dropdown-arrow {
  transform: rotate(180deg);
}

.user-dropdown:focus-within .dropdown-arrow-wrapper {
  background: linear-gradient(
    135deg,
    var(--el-color-primary) 0%,
    var(--el-color-primary-light-3) 100%
  );
  box-shadow: 0 2px 8px rgba(var(--el-color-primary-rgb), 0.3);

  .dropdown-arrow {
    color: #fff;
  }
}
</style>
