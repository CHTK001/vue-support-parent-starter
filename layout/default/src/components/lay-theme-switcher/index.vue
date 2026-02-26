<template>
  <div class="theme-switcher">
    <div class="theme-grid">
      <div
        v-for="theme in availableThemes"
        :key="theme.name"
        class="theme-card"
        :class="{
          'is-active': currentTheme === theme.name,
          'is-switching': switching,
        }"
        @click="handleSwitchTheme(theme.name)"
      >
        <div class="theme-preview">
          <div class="theme-icon">
            <IconifyIconOnline
              :icon="getThemeIcon(theme.name)"
              :style="{ fontSize: '32px' }"
            />
          </div>
        </div>
        <div class="theme-info">
          <span class="theme-name">{{ theme.displayName }}</span>
          <span class="theme-desc">{{ getThemeDescription(theme.name) }}</span>
        </div>
        <div v-if="currentTheme === theme.name" class="theme-check">
          <IconifyIconOnline icon="ri:check-line" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { IconifyIconOnline } from "@repo/components";
import { getEnabledThemes } from "@repo/components/hooks/themeConfig";
import { switchTheme as switchThemeUtil } from "@repo/components/hooks/useThemeComponent";
import { useThemeStore } from "../../stores/themeStore";
import { useGlobal } from "@pureadmin/utils";
import { ElMessage } from "element-plus";
import { useThemeAnimation } from "../../hooks/useThemeAnimation";

const { $storage } = useGlobal<GlobalPropertiesApi>();
const themeStore = useThemeStore();

// 获取所有可用主题
const availableThemes = computed(() => getEnabledThemes());

// 当前主题
const currentTheme = computed(() => {
  return $storage.configure?.systemTheme || "default";
});

// 主题切换中状态
const switching = ref(false);

// 获取主题图标
const getThemeIcon = (themeName: string): string => {
  const icons: Record<string, string> = {
    default: "ri:palette-line",
    "8bit": "ri:gamepad-line",
  };
  return icons[themeName] || "ri:brush-line";
};

// 获取主题描述
const getThemeDescription = (themeName: string): string => {
  const descriptions: Record<string, string> = {
    default: "使用 Element Plus 原生组件",
    "8bit": "像素风格，复古游戏风",
  };
  return descriptions[themeName] || "自定义主题";
};

// 切换主题
const handleSwitchTheme = async (themeName: string) => {
  if (currentTheme.value === themeName || switching.value) {
    return;
  }

  switching.value = true;

  try {
    await useThemeAnimation(async () => {
      // 使用新的 switchTheme 函数，先预加载再切换
      await switchThemeUtil(themeName);

      // 通过主题 store 更新状态
      themeStore.setTheme(themeName as any);

      // 持久化到本地存储
      const storageConfigure = $storage.configure || {};
      storageConfigure.systemTheme = themeName;
      $storage.configure = storageConfigure;

      // 如果切换到非默认主题，强制切换到浅色模式
      if (themeName !== "default") {
        const dataTheme = document.documentElement.dataset.theme;
        if (dataTheme === "dark") {
          document.documentElement.dataset.theme = "light";
          storageConfigure.dataTheme = false;
          $storage.configure = storageConfigure;
        }
      }
    });

    const themeName显示 = themeName === "default" ? "默认" : themeName;
    ElMessage.success(`已切换到${themeName显示}主题`);
  } catch (error) {
    console.error("[ThemeSwitcher] 切换主题失败:", error);
    ElMessage.error("主题切换失败，请重试");
  } finally {
    switching.value = false;
  }
};
</script>

<style lang="scss" scoped>
.theme-switcher {
  width: 100%;
}

.theme-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 12px;
}

.theme-card {
  position: relative;
  padding: 16px;
  border: 2px solid var(--el-border-color);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: var(--el-bg-color);

  &:hover {
    border-color: var(--el-color-primary);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  &.is-active {
    border-color: var(--el-color-primary);
    background: var(--el-color-primary-light-9);

    .theme-preview {
      .theme-icon {
        color: var(--el-color-primary);
      }
    }
  }
}

.theme-preview {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 12px;

  .theme-icon {
    color: var(--el-text-color-regular);
    transition: color 0.3s ease;
  }
}

.theme-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  text-align: center;

  .theme-name {
    font-size: 14px;
    font-weight: 500;
    color: var(--el-text-color-primary);
  }

  .theme-desc {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    line-height: 1.4;
  }
}

.theme-check {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--el-color-primary);
  color: white;
  border-radius: 50%;
  font-size: 12px;
}
</style>
