<!--
 * 登录页面主题切换器 - 下拉菜单式设计
 * @author CH
 * @date 2025-12-12
 * @version 2.1.0
 -->
<template>
  <div class="theme-switcher">
    <!-- 下拉菜单触发器 -->
    <el-dropdown
      trigger="click"
      popper-class="theme-dropdown-popper"
    >
      <div class="switcher-trigger">
        <IconifyIconOnline :icon="currentThemeIcon" class="theme-icon" />
        <span class="theme-text">{{ currentThemeName }}</span>
        <IconifyIconOnline 
          icon="ri:arrow-down-s-line" 
          class="arrow-icon"
        />
      </div>
      <template #dropdown>
        <el-dropdown-menu class="theme-menu">
          <!-- 菜单头部 -->
          <div class="menu-header">
            <IconifyIconOnline icon="ri:palette-line" />
            <span>{{ t("theme.selectTheme") }}</span>
          </div>

          <!-- 常规主题分组 -->
          <div class="theme-group">
            <div class="group-title">{{ t("theme.regularThemes") }}</div>
            <div class="theme-items">
              <el-dropdown-item
                v-for="theme in regularThemes"
                :key="theme.key"
                class="theme-item"
                :class="{ 'is-active': currentTheme === theme.key }"
                @click="selectTheme(theme.key)"
              >
                <div class="item-icon">
                  <IconifyIconOnline :icon="theme.icon" />
                </div>
                <div class="item-content">
                  <span class="item-name">{{ theme.name }}</span>
                  <span class="item-desc">{{ theme.description }}</span>
                </div>
                <IconifyIconOnline 
                  v-show="currentTheme === theme.key"
                  icon="ep:check" 
                  class="item-check"
                />
              </el-dropdown-item>
            </div>
          </div>

          <!-- 节日主题分组 -->
          <div class="theme-group">
            <div class="group-title">
              <span>{{ t("theme.festivalThemes") }}</span>
              <el-tag size="small" type="warning">{{ t("theme.festivalTag") }}</el-tag>
            </div>
            <div class="theme-items">
              <el-dropdown-item
                v-for="theme in festivalThemes"
                :key="theme.key"
                class="theme-item festival"
                :class="{ 'is-active': currentTheme === theme.key }"
                @click="selectTheme(theme.key)"
              >
                <div class="item-icon">
                  <IconifyIconOnline :icon="theme.icon" />
                </div>
                <div class="item-content">
                  <span class="item-name">{{ theme.name }}</span>
                  <span class="item-desc">{{ theme.description }}</span>
                </div>
                <IconifyIconOnline 
                  v-show="currentTheme === theme.key"
                  icon="ep:check" 
                  class="item-check"
                />
              </el-dropdown-item>
            </div>
          </div>
        </el-dropdown-menu>
      </template>
    </el-dropdown>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from "vue";
import { localStorageProxy } from "@repo/utils";
import { useI18n } from "vue-i18n";

/**
 * @author CH
 * @date 2025-12-12
 * @version 2.0.0
 */
defineOptions({
  name: "ThemeSwitcher",
});

const emit = defineEmits(["theme-change"]);
const { t } = useI18n();

const localStorageProxyObject = localStorageProxy();
const THEME_STORAGE_KEY = "login-theme-preference";

/**
 * 常规主题列表
 */
const regularThemes = computed(() => [
  {
    key: "modern",
    name: t("theme.themes.modern.name"),
    description: t("theme.themes.modern.desc"),
    icon: "ri:layout-line",
  },
  {
    key: "tech",
    name: t("theme.themes.tech.name"),
    description: t("theme.themes.tech.desc"),
    icon: "ri:rocket-line",
  },
  {
    key: "business",
    name: t("theme.themes.business.name"),
    description: t("theme.themes.business.desc"),
    icon: "ri:briefcase-line",
  },
  {
    key: "random",
    name: t("theme.themes.random.name"),
    description: t("theme.themes.random.desc"),
    icon: "ri:shuffle-line",
  },
]);

/**
 * 节日主题列表
 */
const festivalThemes = computed(() => [
  {
    key: "new-year",
    name: t("theme.themes.newYear.name"),
    description: t("theme.themes.newYear.desc"),
    icon: "noto:party-popper",
  },
  {
    key: "spring-festival",
    name: t("theme.themes.springFestival.name"),
    description: t("theme.themes.springFestival.desc"),
    icon: "noto:firecracker",
  },
  {
    key: "valentines-day",
    name: t("theme.themes.valentinesDay.name"),
    description: t("theme.themes.valentinesDay.desc"),
    icon: "noto:red-heart",
  },
  {
    key: "mid-autumn",
    name: t("theme.themes.midAutumn.name"),
    description: t("theme.themes.midAutumn.desc"),
    icon: "noto:full-moon",
  },
  {
    key: "national-day",
    name: t("theme.themes.nationalDay.name"),
    description: t("theme.themes.nationalDay.desc"),
    icon: "twemoji:flag-china",
  },
  {
    key: "christmas",
    name: t("theme.themes.christmas.name"),
    description: t("theme.themes.christmas.desc"),
    icon: "noto:christmas-tree",
  },
]);

/**
 * 所有主题列表
 */
const allThemes = computed(() => [...regularThemes.value, ...festivalThemes.value]);

/**
 * 当前选中的主题
 */
const currentTheme = ref("modern");

/**
 * 当前主题名称
 */
const currentThemeName = computed(() => {
  const theme = allThemes.value.find((t) => t.key === currentTheme.value);
  return theme ? theme.name : t("theme.themes.modern.name");
});

/**
 * 当前主题图标
 */
const currentThemeIcon = computed(() => {
  const theme = allThemes.value.find((t) => t.key === currentTheme.value);
  return theme ? theme.icon : "ri:palette-line";
});

/**
 * 加载保存的主题偏好
 */
const loadThemePreference = () => {
  const savedTheme = localStorageProxyObject.getItem(THEME_STORAGE_KEY) as string;
  if (savedTheme && allThemes.value.find((t) => t.key === savedTheme)) {
    currentTheme.value = savedTheme;
  }
};

/**
 * 选择主题
 * @param themeKey 主题键值
 */
const selectTheme = (themeKey: string) => {
  currentTheme.value = themeKey;
  // 保存到本地存储
  localStorageProxyObject.setItem(THEME_STORAGE_KEY, themeKey);
  // 通知父组件
  emit("theme-change", themeKey);
  // 刷新页面以应用新主题
  setTimeout(() => {
    window.location.reload();
  }, 300);
};

onMounted(() => {
  loadThemePreference();
});

onUnmounted(() => {
  // 清理资源
});
</script>

<style lang="scss" scoped>
.theme-switcher {
  position: relative;
}

/**
 * 下拉菜单触发器样式
 */
.switcher-trigger {
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

  .theme-icon {
    font-size: 18px;
    color: var(--el-color-primary);
    transition: transform 0.3s ease;
    flex-shrink: 0;
  }

  .theme-text {
    font-size: 13px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    letter-spacing: 0.2px;
  }

  .arrow-icon {
    font-size: 14px;
    color: var(--el-text-color-placeholder);
    transition: all 0.3s ease;
    margin-left: 4px;
  }
}
</style>

<style lang="scss">
/**
 * 下拉菜单全局样式
 */
.theme-dropdown-popper {
  .el-dropdown-menu {
    padding: 0;
    border-radius: 20px;
    border: none;
    box-shadow:
      0 20px 60px rgba(0, 0, 0, 0.15),
      0 8px 20px rgba(0, 0, 0, 0.08),
      0 0 0 1px rgba(0, 0, 0, 0.03);
    overflow: hidden;
    min-width: 320px;
    backdrop-filter: blur(20px);
  }
}

.theme-menu {
  padding: 0 !important;

  /**
   * 菜单头部样式
   */
  .menu-header {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 16px 20px;
    font-size: 13px;
    font-weight: 600;
    color: var(--el-text-color-secondary);
    border-bottom: 1px solid var(--el-border-color-lighter);
    background: linear-gradient(
      135deg,
      var(--el-fill-color-lighter) 0%,
      var(--el-fill-color-light) 100%
    );
  }

  /**
   * 主题分组样式
   */
  .theme-group {
    padding: 8px 10px;

    &:not(:last-child) {
      border-bottom: 1px solid var(--el-border-color-lighter);
    }

    .group-title {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 16px 8px;
      font-size: 12px;
      font-weight: 600;
      color: var(--el-text-color-secondary);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .theme-items {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
  }

  /**
   * 主题项目样式
   */
  .theme-item {
    display: flex !important;
    align-items: center;
    gap: 12px;
    padding: 16px !important;
    margin: 0 !important;
    border-radius: 12px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: hidden;

    &::before {
      content: "";
      position: absolute;
      inset: 0;
      background: linear-gradient(
        135deg,
        rgba(var(--el-color-primary-rgb), 0.08) 0%,
        transparent 100%
      );
      opacity: 0;
      transition: opacity 0.3s ease;
    }

    &:hover {
      background: var(--el-fill-color-light);
      transform: translateX(4px);

      &::before {
        opacity: 1;
      }

      .item-icon {
        transform: scale(1.1);
      }
    }

    &.is-active {
      background: linear-gradient(
        135deg,
        rgba(var(--el-color-primary-rgb), 0.12) 0%,
        rgba(var(--el-color-primary-rgb), 0.06) 100%
      );
      border: 1px solid rgba(var(--el-color-primary-rgb), 0.2);

      .item-name {
        color: var(--el-color-primary);
        font-weight: 600;
      }

      .item-check {
        animation: check-pop 0.3s ease;
      }
    }

    .item-icon {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      background: var(--el-fill-color);
      color: var(--el-text-color-secondary);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      flex-shrink: 0;
    }

    .item-content {
      display: flex;
      flex-direction: column;
      gap: 2px;
      flex: 1;
    }

    .item-name {
      font-size: 14px;
      font-weight: 500;
      color: var(--el-text-color-primary);
      transition: color 0.3s;
    }

    .item-desc {
      font-size: 11px;
      color: var(--el-text-color-secondary);
      line-height: 1.3;
    }

    .item-check {
      font-size: 18px;
      color: var(--el-color-primary);
      filter: drop-shadow(0 2px 4px rgba(var(--el-color-primary-rgb), 0.3));
    }
  }
}

/**
 * 深色模式适配
 */
html.dark {
  .theme-dropdown-popper .el-dropdown-menu {
    background: var(--el-bg-color-overlay);
    box-shadow: 0 12px 48px rgba(0, 0, 0, 0.4);
  }

  .theme-menu .menu-header {
    background: var(--el-fill-color-dark);
  }
}

/**
 * 动画定义
 */
@keyframes check-pop {
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
</style>
