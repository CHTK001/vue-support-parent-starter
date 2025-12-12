<!--
 * 登录页面主题切换器 - 卡片式设计
 * @author CH
 * @date 2025-12-12
 * @version 2.0.0
 -->
<template>
  <div class="theme-switcher">
    <!-- 触发器 -->
    <div class="switcher-trigger" @click="togglePanel">
      <IconifyIconOnline :icon="currentThemeIcon" class="theme-icon" />
      <span class="theme-text">{{ currentThemeName }}</span>
      <IconifyIconOnline 
        icon="ep:arrow-down" 
        class="arrow-icon" 
        :class="{ 'is-open': isPanelOpen }"
      />
    </div>

    <!-- 主题选择面板 -->
    <Teleport to="body">
      <Transition name="panel-fade">
        <div v-if="isPanelOpen" class="theme-panel-overlay" @click="closePanel">
          <div class="theme-panel" @click.stop>
            <!-- 面板头部 -->
            <div class="panel-header">
              <div class="header-title">
                <IconifyIconOnline icon="ri:palette-line" />
                <span>选择主题</span>
              </div>
              <el-button circle size="small" @click="closePanel">
                <IconifyIconOnline icon="ep:close" />
              </el-button>
            </div>

            <!-- 常规主题 -->
            <div class="theme-section">
              <div class="section-title">常规主题</div>
              <div class="theme-grid">
                <div
                  v-for="theme in regularThemes"
                  :key="theme.key"
                  class="theme-card"
                  :class="{ 'is-active': currentTheme === theme.key }"
                  @click="selectTheme(theme.key)"
                >
                  <div class="card-icon">
                    <IconifyIconOnline :icon="theme.icon" />
                  </div>
                  <div class="card-name">{{ theme.name }}</div>
                  <div class="card-desc">{{ theme.description }}</div>
                  <div v-if="currentTheme === theme.key" class="card-check">
                    <IconifyIconOnline icon="ep:check" />
                  </div>
                </div>
              </div>
            </div>

            <!-- 节日主题 -->
            <div class="theme-section">
              <div class="section-title">
                <span>节日主题</span>
                <el-tag size="small" type="warning">特别</el-tag>
              </div>
              <div class="theme-grid">
                <div
                  v-for="theme in festivalThemes"
                  :key="theme.key"
                  class="theme-card festival"
                  :class="{ 'is-active': currentTheme === theme.key }"
                  @click="selectTheme(theme.key)"
                >
                  <div class="card-icon">
                    <IconifyIconOnline :icon="theme.icon" />
                  </div>
                  <div class="card-name">{{ theme.name }}</div>
                  <div class="card-desc">{{ theme.description }}</div>
                  <div v-if="currentTheme === theme.key" class="card-check">
                    <IconifyIconOnline icon="ep:check" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from "vue";
import { localStorageProxy } from "@repo/utils";

/**
 * @author CH
 * @date 2025-12-12
 * @version 2.0.0
 */
defineOptions({
  name: "ThemeSwitcher",
});

const emit = defineEmits(["theme-change"]);

const localStorageProxyObject = localStorageProxy();
const THEME_STORAGE_KEY = "login-theme-preference";

// 面板显示状态
const isPanelOpen = ref(false);

// 常规主题列表
const regularThemes = [
  {
    key: "modern",
    name: "现代简约",
    description: "简洁大方",
    icon: "ri:layout-line",
  },
  {
    key: "tech",
    name: "科技未来",
    description: "科技感十足",
    icon: "ri:rocket-line",
  },
  {
    key: "business",
    name: "商务专业",
    description: "专业稳重",
    icon: "ri:briefcase-line",
  },
  {
    key: "random",
    name: "随机主题",
    description: "每次随机",
    icon: "ri:shuffle-line",
  },
];

// 节日主题列表
const festivalThemes = [
  {
    key: "new-year",
    name: "元旦",
    description: "新年新气象",
    icon: "noto:party-popper",
  },
  {
    key: "spring-festival",
    name: "春节",
    description: "喜庆祥和",
    icon: "noto:firecracker",
  },
  {
    key: "valentines-day",
    name: "情人节",
    description: "浪漫甜蜜",
    icon: "noto:red-heart",
  },
  {
    key: "mid-autumn",
    name: "中秋",
    description: "月圆人团圆",
    icon: "noto:full-moon",
  },
  {
    key: "national-day",
    name: "国庆",
    description: "祝福祖国",
    icon: "twemoji:flag-china",
  },
  {
    key: "christmas",
    name: "圣诞",
    description: "温馨浪漫",
    icon: "noto:christmas-tree",
  },
];

const allThemes = [...regularThemes, ...festivalThemes];

// 当前主题
const currentTheme = ref("modern");

// 当前主题名称
const currentThemeName = computed(() => {
  const theme = allThemes.find((t) => t.key === currentTheme.value);
  return theme ? theme.name : "现代简约";
});

// 当前主题图标
const currentThemeIcon = computed(() => {
  const theme = allThemes.find((t) => t.key === currentTheme.value);
  return theme ? theme.icon : "ri:palette-line";
});

// 加载保存的主题偏好
const loadThemePreference = () => {
  const savedTheme = localStorageProxyObject.getItem(THEME_STORAGE_KEY) as string;
  if (savedTheme && allThemes.find((t) => t.key === savedTheme)) {
    currentTheme.value = savedTheme;
  }
};

// 切换面板
const togglePanel = () => {
  isPanelOpen.value = !isPanelOpen.value;
};

// 关闭面板
const closePanel = () => {
  isPanelOpen.value = false;
};

// 选择主题
const selectTheme = (themeKey: string) => {
  currentTheme.value = themeKey;
  // 保存到本地存储
  localStorageProxyObject.setItem(THEME_STORAGE_KEY, themeKey);
  // 通知父组件
  emit("theme-change", themeKey);
  // 关闭面板
  closePanel();
  // 刷新页面以应用新主题
  setTimeout(() => {
    window.location.reload();
  }, 300);
};

// ESC 键关闭
const handleEscape = (e: KeyboardEvent) => {
  if (e.key === "Escape" && isPanelOpen.value) {
    closePanel();
  }
};

onMounted(() => {
  loadThemePreference();
  document.addEventListener("keydown", handleEscape);
});

onUnmounted(() => {
  document.removeEventListener("keydown", handleEscape);
});
</script>

<style lang="scss" scoped>
.theme-switcher {
  position: relative;
}

.switcher-trigger {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 18px;
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  backdrop-filter: blur(12px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

  &:hover {
    background: rgba(255, 255, 255, 0.18);
    border-color: rgba(255, 255, 255, 0.35);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  &:active {
    transform: translateY(0);
  }

  .theme-icon {
    font-size: 22px;
    color: var(--el-color-primary);
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
    transition: transform 0.3s ease;
  }

  .theme-text {
    font-size: 14px;
    color: var(--el-text-color-primary);
    font-weight: 600;
    letter-spacing: 0.5px;
  }

  .arrow-icon {
    font-size: 14px;
    color: var(--el-text-color-secondary);
    transition: transform 0.3s ease;

    &.is-open {
      transform: rotate(180deg);
    }
  }
}

// 面板遮罩
.theme-panel-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  z-index: 3000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

// 主题面板
.theme-panel {
  background: var(--el-bg-color);
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  max-width: 900px;
  width: 100%;
  max-height: 80vh;
  overflow-y: auto;
  animation: panelSlideIn 0.3s ease;

  // 面板头部
  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 24px;
    border-bottom: 1px solid var(--el-border-color-lighter);
    position: sticky;
    top: 0;
    background: var(--el-bg-color);
    z-index: 1;

    .header-title {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 18px;
      font-weight: 600;
      color: var(--el-text-color-primary);

      :deep(.iconify) {
        font-size: 24px;
        color: var(--el-color-primary);
      }
    }
  }

  // 主题分区
  .theme-section {
    padding: 24px;

    &:not(:last-child) {
      border-bottom: 1px solid var(--el-border-color-lighter);
    }

    .section-title {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 16px;
      font-weight: 600;
      color: var(--el-text-color-primary);
      margin-bottom: 16px;
    }

    .theme-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
      gap: 16px;
    }
  }

  // 主题卡片
  .theme-card {
    position: relative;
    padding: 20px 16px;
    border: 2px solid var(--el-border-color);
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.3s ease;
    background: var(--el-bg-color);
    text-align: center;

    &:hover {
      border-color: var(--el-color-primary);
      transform: translateY(-4px);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);

      .card-icon {
        transform: scale(1.1);
      }
    }

    &.is-active {
      border-color: var(--el-color-primary);
      background: var(--el-color-primary-light-9);
      box-shadow: 0 4px 12px rgba(var(--el-color-primary-rgb), 0.3);

      .card-name {
        color: var(--el-color-primary);
        font-weight: 600;
      }
    }

    &.festival {
      border-style: dashed;
    }

    .card-icon {
      font-size: 48px;
      margin-bottom: 12px;
      transition: transform 0.3s ease;
      filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
    }

    .card-name {
      font-size: 14px;
      font-weight: 500;
      color: var(--el-text-color-primary);
      margin-bottom: 4px;
    }

    .card-desc {
      font-size: 12px;
      color: var(--el-text-color-secondary);
    }

    .card-check {
      position: absolute;
      top: 8px;
      right: 8px;
      width: 24px;
      height: 24px;
      background: var(--el-color-primary);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 14px;
      animation: checkBounce 0.5s ease;
    }
  }
}

// 动画
.panel-fade-enter-active,
.panel-fade-leave-active {
  transition: opacity 0.3s ease;

  .theme-panel {
    transition: transform 0.3s ease, opacity 0.3s ease;
  }
}

.panel-fade-enter-from,
.panel-fade-leave-to {
  opacity: 0;

  .theme-panel {
    transform: scale(0.9);
    opacity: 0;
  }
}

@keyframes panelSlideIn {
  from {
    transform: scale(0.9);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes checkBounce {
  0% {
    transform: scale(0);
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
  }
}

// 暗色模式适配
html.dark {
  .switcher-trigger {
    background: rgba(0, 0, 0, 0.2);
    border-color: rgba(255, 255, 255, 0.1);

    &:hover {
      background: rgba(0, 0, 0, 0.3);
      border-color: rgba(255, 255, 255, 0.2);
    }
  }
}

// 响应式
@media (max-width: 768px) {
  .theme-panel {
    max-width: 100%;
    max-height: 90vh;

    .theme-section .theme-grid {
      grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
      gap: 12px;
    }

    .theme-card {
      padding: 16px 12px;

      .card-icon {
        font-size: 40px;
      }
    }
  }
}
</style>
