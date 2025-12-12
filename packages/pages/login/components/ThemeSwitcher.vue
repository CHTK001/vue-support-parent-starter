<!--
 * 登录页面主题切换器
 * @author CH
 * @date 2025-12-12
 * @version 1.0.0
 -->
<template>
  <div class="theme-switcher">
    <el-dropdown trigger="click" @command="handleThemeChange">
      <div class="switcher-trigger">
        <IconifyIconOnline :icon="currentThemeIcon" class="theme-icon" />
        <span class="theme-text">{{ currentThemeName }}</span>
        <IconifyIconOnline icon="ep:arrow-down" class="arrow-icon" />
      </div>
      <template #dropdown>
        <el-dropdown-menu class="theme-dropdown-menu">
          <!-- 常规主题 -->
          <el-dropdown-item
            v-for="theme in regularThemes"
            :key="theme.key"
            :command="theme.key"
            :class="{ 'is-active': currentTheme === theme.key }"
          >
            <div class="theme-option">
              <IconifyIconOnline :icon="theme.icon" class="option-icon" />
              <div class="option-info">
                <div class="option-name">{{ theme.name }}</div>
                <div class="option-desc">{{ theme.description }}</div>
              </div>
              <IconifyIconOnline
                v-if="currentTheme === theme.key"
                icon="ep:check"
                class="check-icon"
              />
            </div>
          </el-dropdown-item>

          <el-divider style="margin: 8px 0" />

          <!-- 节日主题 -->
          <el-dropdown-item
            v-for="theme in festivalThemes"
            :key="theme.key"
            :command="theme.key"
            :class="{ 'is-active': currentTheme === theme.key }"
          >
            <div class="theme-option">
              <IconifyIconOnline :icon="theme.icon" class="option-icon" />
              <div class="option-info">
                <div class="option-name">
                  {{ theme.name }}
                  <el-tag size="small" type="warning" style="margin-left: 5px">节日</el-tag>
                </div>
                <div class="option-desc">{{ theme.description }}</div>
              </div>
              <IconifyIconOnline
                v-if="currentTheme === theme.key"
                icon="ep:check"
                class="check-icon"
              />
            </div>
          </el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from "vue";
import { localStorageProxy } from "@repo/utils";

/**
 * @author CH
 * @date 2025-12-12
 * @version 1.0.0
 */
defineOptions({
  name: "ThemeSwitcher",
});

const emit = defineEmits(["theme-change"]);

const localStorageProxyObject = localStorageProxy();
const THEME_STORAGE_KEY = "login-theme-preference";

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
    key: "spring-festival",
    name: "春节",
    description: "喜庆祥和",
    icon: "noto:firecracker",
  },
  {
    key: "mid-autumn",
    name: "中秋",
    description: "月圆人团圆",
    icon: "noto:full-moon",
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

// 主题切换处理
const handleThemeChange = (themeKey: string) => {
  currentTheme.value = themeKey;
  // 保存到本地存储
  localStorageProxyObject.setItem(THEME_STORAGE_KEY, themeKey);
  // 通知父组件
  emit("theme-change", themeKey);
  // 刷新页面以应用新主题
  window.location.reload();
};

onMounted(() => {
  loadThemePreference();
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

    .arrow-icon {
      transform: translateY(2px);
    }
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
  }
}

:deep(.theme-dropdown-menu) {
  min-width: 320px;
  padding: 12px;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  border: 1px solid var(--el-border-color-lighter);

  .el-dropdown-menu__item {
    padding: 0;
    height: auto;
    line-height: normal;
    border-radius: 8px;
    margin-bottom: 6px;
    transition: all 0.3s ease;

    &:last-child {
      margin-bottom: 0;
    }

    &.is-active {
      background: linear-gradient(
        135deg,
        var(--el-color-primary-light-9) 0%,
        var(--el-color-primary-light-8) 100%
      );
      border: 1px solid var(--el-color-primary-light-5);
    }

    &:hover {
      background: var(--el-fill-color-light);
      transform: translateX(4px);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    }
  }

  .el-divider {
    margin: 12px 0;
    border-color: var(--el-border-color-lighter);
  }
}

.theme-option {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 12px;
  width: 100%;
  position: relative;
  overflow: hidden;

  // 添加渐变背景效果
  &::before {
    content: "";
    position: absolute;
    left: 0;
    top: 0;
    width: 4px;
    height: 100%;
    background: linear-gradient(
      to bottom,
      var(--el-color-primary),
      var(--el-color-primary-light-3)
    );
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  .option-icon {
    font-size: 32px;
    flex-shrink: 0;
    transition: transform 0.3s ease;
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
  }

  .option-info {
    flex: 1;
    min-width: 0;

    .option-name {
      font-size: 15px;
      font-weight: 600;
      color: var(--el-text-color-primary);
      margin-bottom: 4px;
      display: flex;
      align-items: center;
      letter-spacing: 0.3px;
    }

    .option-desc {
      font-size: 12px;
      color: var(--el-text-color-secondary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      line-height: 1.5;
    }
  }

  .check-icon {
    font-size: 20px;
    color: var(--el-color-primary);
    flex-shrink: 0;
    animation: checkBounce 0.5s ease;
  }

  // hover 效果
  &:hover {
    .option-icon {
      transform: scale(1.1) rotate(5deg);
    }

    &::before {
      opacity: 1;
    }
  }
}

// 选中状态的特殊效果
.is-active .theme-option {
  &::before {
    opacity: 1;
  }

  .option-icon {
    transform: scale(1.05);
  }

  .option-name {
    color: var(--el-color-primary);
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
</style>
