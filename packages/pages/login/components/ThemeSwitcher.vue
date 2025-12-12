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
  gap: 8px;
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);

  &:hover {
    background: rgba(255, 255, 255, 0.15);
    border-color: rgba(255, 255, 255, 0.3);
    transform: translateY(-1px);
  }

  .theme-icon {
    font-size: 20px;
    color: var(--el-color-primary);
  }

  .theme-text {
    font-size: 14px;
    color: var(--el-text-color-primary);
    font-weight: 500;
  }

  .arrow-icon {
    font-size: 14px;
    color: var(--el-text-color-secondary);
    transition: transform 0.3s ease;
  }
}

:deep(.theme-dropdown-menu) {
  min-width: 280px;
  padding: 8px;

  .el-dropdown-menu__item {
    padding: 0;
    height: auto;
    line-height: normal;

    &.is-active {
      background: var(--el-color-primary-light-9);
    }

    &:hover {
      background: var(--el-fill-color-light);
    }
  }
}

.theme-option {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  width: 100%;

  .option-icon {
    font-size: 28px;
    flex-shrink: 0;
  }

  .option-info {
    flex: 1;
    min-width: 0;

    .option-name {
      font-size: 14px;
      font-weight: 500;
      color: var(--el-text-color-primary);
      margin-bottom: 2px;
      display: flex;
      align-items: center;
    }

    .option-desc {
      font-size: 12px;
      color: var(--el-text-color-secondary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }

  .check-icon {
    font-size: 18px;
    color: var(--el-color-primary);
    flex-shrink: 0;
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
