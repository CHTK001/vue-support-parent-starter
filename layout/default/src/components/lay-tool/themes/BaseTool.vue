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
import { ref, computed } from "vue";
import { useGlobal } from "@pureadmin/utils";
import { useDraggable } from "@vueuse/core";
import HeaderClock from "../HeaderClock.vue";
import { webLlmDownloadState } from "../../lay-ai-chat/services/webLlmDownloadState";
import ToolItem from "../components/ToolItem.vue";

// webLLM 进度浮层收缩状态
const webllmCollapsed = ref(false);

// webLLM 浮层拖拽
const webllmEl = ref<HTMLElement | null>(null);
const webllmHandle = ref<HTMLElement | null>(null);
const { style: webllmStyle } = useDraggable(webllmEl as any, {
  initialValue: { x: window.innerWidth - 276, y: 16 },
  handle: webllmHandle as any,
});

// 接收主题类名
const props = defineProps<{
  themeClass?: string;
}>();

// 获取当前主题和配置
const { $storage } = useGlobal<GlobalPropertiesApi>();
const { onPanel } = useNav();
const { t } = useTranslationLang();

// 当前主题 - 用于节日主题按钮显示
const storageTheme = computed(() => $storage?.configure?.systemTheme || "default");
const currentTheme = ref<string>(storageTheme.value);

const handleThemeChange = (themeKey: string) => {
  currentTheme.value = themeKey;
};

// 监听主题变化
emitter.on("systemThemeChange", handleThemeChange);

// 主题判断函数
const isSpringFestival = () => currentTheme.value === "spring-festival";
const isMidAutumn = () => currentTheme.value === "mid-autumn";
const isHalloween = () => currentTheme.value === "halloween";
const isChristmas = () => currentTheme.value === "christmas";
const isFutureTech = () => currentTheme.value === "future-tech";

const settingTextMotion = computed(() => {
  if (isSpringFestival()) return "gold-foil";
  if (isHalloween()) return "glitch";
  if (isChristmas()) return "gold-foil";
  if (isFutureTech()) return "none";
  return "none";
});

const settingThemeClass = computed(() => ({
  "fu-setting": isSpringFestival(),
  "mooncake-setting": isMidAutumn(),
  "pumpkin-setting": isHalloween(),
  "christmas-setting": isChristmas(),
  "future-setting": isFutureTech(),
}));

// 界面元素显示状态 - 从存储中读取初始值
const showSearch = ref(
  $storage.configure?.showSearch ?? getConfig().ShowBarSearch ?? true,
);
const showFullscreen = ref($storage.configure?.showFullscreen ?? true);
const showHeaderClock = ref(
  $storage.configure?.showHeaderClock ?? false,
);

// 监听界面元素显示设置变化
emitter.on("showSearchChange", (val: boolean) => {
  showSearch.value = val;
});
emitter.on("showFullscreenChange", (val: boolean) => {
  showFullscreen.value = val;
});
emitter.on("showHeaderClockChange", (val: boolean) => {
  showHeaderClock.value = val;
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

    <!-- 顶部时间显示（主要用于全屏/大屏场景） -->
    <div
      v-if="showHeaderClock"
      class="tool-item header-clock"
      aria-label="当前时间"
    >
      <HeaderClock />
    </div>

    <!-- webLLM 下载进度（fixed 右上角浮层，下载中时显示） -->
    <Teleport to="body">
      <div
        v-if="webLlmDownloadState.downloading"
        ref="webllmEl"
        class="webllm-float"
        :class="{ 'webllm-float--collapsed': webllmCollapsed }"
        :style="webllmStyle as any"
      >
        <!-- 标题栏：拖拽区域 + 点击收缩/展开 -->
        <div ref="webllmHandle" class="webllm-float-header" @click="webllmCollapsed = !webllmCollapsed">
          <IconifyIconOnline icon="ri:download-cloud-line" class="webllm-float-icon" />
          <span class="webllm-float-title">AI 模型下载中</span>
          <span class="webllm-float-progress-text">{{ webLlmDownloadState.progress }}%</span>
          <IconifyIconOnline
            :icon="webllmCollapsed ? 'ri:arrow-down-s-line' : 'ri:arrow-up-s-line'"
            class="webllm-float-toggle"
          />
        </div>
        <!-- 展开内容 -->
        <div v-show="!webllmCollapsed" class="webllm-float-body">
          <div class="webllm-float-filename">{{ webLlmDownloadState.fileName || 'AI模型' }}</div>
          <div class="webllm-float-bar-wrap">
            <div class="webllm-float-bar" :style="{ width: webLlmDownloadState.progress + '%' }" />
          </div>
          <div class="webllm-float-meta">
            {{ webLlmDownloadState.text }}
            <template v-if="webLlmDownloadState.speed"> · {{ webLlmDownloadState.speed }}</template>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- 系统设置 -->
    <ToolItem
      v-if="getConfig().ShowBarSetting"
      :tooltip="t('buttons.pureOpenSystemSet')"
      :class="['setting-btn', settingThemeClass]"
      @click="onPanel"
    >
      <span class="setting-content">
        <IconifyIconOffline :icon="Setting" class="setting-icon" />
        <ScText v-if="isSpringFestival()" class="setting-symbol setting-symbol--festival" :theme-motion="settingTextMotion">🧧</ScText>
        <ScText v-else-if="isMidAutumn()">🥮</ScText>
        <ScText v-else-if="isHalloween()" class="setting-symbol setting-symbol--halloween" :theme-motion="settingTextMotion">🎃</ScText>
        <ScText v-else-if="isChristmas()" class="setting-symbol setting-symbol--christmas" :theme-motion="settingTextMotion">🎄</ScText>
        <ScText v-else-if="isFutureTech()" class="setting-symbol setting-symbol--future" :theme-motion="settingTextMotion">⚡</ScText>
      </span>
    </ToolItem>
  </div>
</template>

<style lang="scss" scoped>
// 基础布局样式 - 所有主题共用
.tool-bar {
  display: flex;
  align-items: center;
  gap: 4px;  // 使用 4px，ToolItem 自身有 padding，视觉间距约 8px
  height: 48px;
  padding: 0 8px;
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
  color: #595959; // 统一色值
  background: transparent;
  border: 1px solid transparent;
  transition: all 0.2s ease; // 优化过渡
  font-size: 16px; // 统一图标大小
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
    color: var(--el-color-primary); // hover 时主题色高亮
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

  &--festival,
  &--christmas,
  &--halloween {
    font-size: 18px;
  }

  &--future {
    font-size: 16px;
  }
}

.header-clock {
  min-width: 150px;
  padding: 0 16px;
  font-variant-numeric: tabular-nums;
  justify-content: flex-start;
  gap: 8px;
  background: linear-gradient(
    135deg,
    rgba(var(--el-color-primary-rgb), 0.06) 0%,
    rgba(var(--el-color-primary-rgb), 0.02) 100%
  );
  border: 1px solid rgba(var(--el-color-primary-rgb), 0.18);
  box-shadow: 0 4px 12px rgba(var(--el-color-primary-rgb), 0.12);
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

// 万圣节主题 - 南瓜设置按钮
.pumpkin-setting {
  font-size: 20px;
  background: rgba(255, 117, 24, 0.15);
  border: 1px solid rgba(255, 117, 24, 0.3);
  overflow: visible;
  
  &::before,
  &::after {
    content: "";
    position: absolute;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.25s ease, transform 0.25s ease;
  }

  &::before {
    inset: -10px;
    border-radius: 18px;
    background:
      linear-gradient(135deg, transparent 48%, rgba(255, 214, 176, 0.42) 49%, transparent 51%) top right / 18px 18px no-repeat,
      linear-gradient(90deg, transparent 50%, rgba(255, 214, 176, 0.32) 50%, transparent 52%) top right / 32px 1px no-repeat,
      linear-gradient(180deg, transparent 50%, rgba(255, 214, 176, 0.32) 50%, transparent 52%) top right / 1px 32px no-repeat;
    filter: drop-shadow(0 0 8px rgba(255, 117, 24, 0.32));
    transform: scale(0.92);
  }

  &::after {
    content: "🕷";
    top: -12px;
    right: -4px;
    font-size: 13px;
    text-shadow: 0 0 8px rgba(255, 117, 24, 0.6);
    transform: translateY(-6px);
  }
  
  &:hover {
    background: rgba(255, 117, 24, 0.25);
    border-color: rgba(255, 117, 24, 0.6);
    // 嘴巴发光效果 - 通过 drop-shadow 模拟
    filter: drop-shadow(0 0 2px #ffff00) drop-shadow(0 0 5px #ff7518);
    animation: pumpkin-bounce 0.6s ease infinite;
    
    // 尝试增加内部亮度
    :deep(svg) {
       filter: brightness(1.2);
    }

    &::before,
    &::after {
      opacity: 1;
    }

    &::before {
      transform: scale(1);
    }

    &::after {
      animation: spider-crawl 1.8s ease-in-out infinite;
    }
  }
}

.future-setting {
  letter-spacing: 0.08em;

  &:hover {
    box-shadow:
      0 0 18px rgba(0, 255, 255, 0.28),
      inset 0 0 10px rgba(0, 255, 255, 0.18);
  }
}

.christmas-setting {
  &::before {
    content: "";
    position: absolute;
    inset: 6px;
    border-radius: 999px;
    border: 1px dashed rgba(255, 225, 138, 0.32);
    opacity: 0;
    transition: opacity 0.25s ease, transform 0.25s ease;
    pointer-events: none;
    transform: scale(0.85);
  }

  &:hover::before {
    opacity: 1;
    transform: scale(1.05);
  }
}

@keyframes pumpkin-bounce {
  0%, 100% { transform: translateY(-2px) scale(1.1); }
  50% { transform: translateY(-5px) scale(1.1); }
}

@keyframes spider-crawl {
  0%,
  100% {
    transform: translateY(-6px) translateX(0);
  }
  50% {
    transform: translateY(2px) translateX(-2px);
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

// webLLM 下载进度浮层（fixed，位置由 useDraggable 控制）
.webllm-float {
  position: fixed;
  z-index: 9999;
  width: 260px;
  background: var(--el-bg-color);
  border: 1px solid rgba(var(--el-color-primary-rgb), 0.25);
  border-radius: 10px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  transition: width 0.2s ease;

  &--collapsed {
    width: 180px;
  }
}

.webllm-float-header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  cursor: move;
  user-select: none;
  touch-action: none;
  background: linear-gradient(135deg, rgba(var(--el-color-primary-rgb), 0.08), rgba(var(--el-color-primary-rgb), 0.04));
  user-select: none;

  &:hover {
    background: linear-gradient(135deg, rgba(var(--el-color-primary-rgb), 0.14), rgba(var(--el-color-primary-rgb), 0.08));
  }
}

.webllm-float-icon {
  font-size: 15px;
  color: var(--el-color-primary);
  flex-shrink: 0;
  animation: webllm-pulse 1.5s ease-in-out infinite;
}

.webllm-float-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.webllm-float-progress-text {
  font-size: 12px;
  font-weight: 700;
  color: var(--el-color-primary);
  flex-shrink: 0;
}

.webllm-float-toggle {
  font-size: 16px;
  color: var(--el-text-color-secondary);
  flex-shrink: 0;
}

.webllm-float-body {
  padding: 8px 12px 10px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.webllm-float-filename {
  font-size: 11px;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.webllm-float-bar-wrap {
  width: 100%;
  height: 4px;
  background: var(--el-fill-color);
  border-radius: 2px;
  overflow: hidden;
}

.webllm-float-bar {
  height: 100%;
  background: linear-gradient(90deg, var(--el-color-primary), var(--el-color-primary-light-3));
  border-radius: 2px;
  transition: width 0.3s ease;
}

.webllm-float-meta {
  font-size: 10px;
  color: var(--el-text-color-placeholder);
}

@keyframes webllm-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

// 语言切换触发器.lang-style {
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
