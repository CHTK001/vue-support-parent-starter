<template>
  <div class="theme-switcher">
    <div
      v-for="(themes, group) in themesByGroup"
      :key="group"
      class="theme-group"
    >
      <div v-if="themes.length > 0" class="theme-group-header">
        <span class="theme-group-title">{{ getGroupTitle(group) }}</span>
        <span class="theme-group-badge">{{ getGroupBadge(group) }}</span>
      </div>
      <div class="theme-grid">
        <div
          v-for="theme in themes"
          :key="theme.name"
          class="theme-card"
          :class="{
            'is-active': currentTheme === theme.name,
            'is-switching': switching,
          }"
          @click="handleSwitchTheme(theme.name)"
        >
          <!-- 内测主题绸带 -->
          <ScRibbon
            v-if="theme.group === 'beta'"
            text="内测"
            variant="corner"
            position="rt"
            color="#ff6b6b"
            size="sm"
          />

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
            <span class="theme-desc">{{
              theme.description || getThemeDescription(theme.name)
            }}</span>
            <!-- 节日主题倒计时 -->
            <span
              v-if="theme.group === 'festival' && getDaysUntilFestival(theme.name)"
              class="theme-countdown"
            >
              距离节日还有 {{ getDaysUntilFestival(theme.name) }} 天
            </span>
          </div>
          <div v-if="currentTheme === theme.name" class="theme-check">
            <IconifyIconOnline icon="ri:check-line" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { IconifyIconOnline } from "@repo/components";
import ScRibbon from "@repo/components/ScRibbon/index.vue";
import {
  getThemesByGroup,
  switchTheme as switchThemeUtil,
} from "@repo/components/hooks";
import { useThemeStore } from "../../stores/themeStore";
import { useGlobal } from "@pureadmin/utils";
import { message } from "@repo/utils";
import { useThemeAnimation } from "../../hooks/useThemeAnimation";

// 节日日期配置
const festivalDates: Record<string, string> = {
  halloween: "10-31", // 万圣节 10月31日
  christmas: "12-25", // 圣诞节 12月25日
  "spring-festival": "01-29", // 春节（2026年1月29日，需每年更新）
};

// 计算距离节日还有多少天
const getDaysUntilFestival = (themeName: string): number | null => {
  const dateStr = festivalDates[themeName];
  if (!dateStr) return null;

  const now = new Date();
  const currentYear = now.getFullYear();
  const [month, day] = dateStr.split("-").map(Number);

  // 构建今年的节日日期
  let festivalDate = new Date(currentYear, month - 1, day);

  // 如果今年的节日已过，计算明年的
  if (festivalDate < now) {
    festivalDate = new Date(currentYear + 1, month - 1, day);
  }

  // 计算天数差
  const diffTime = festivalDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
};

const { $storage } = useGlobal<GlobalPropertiesApi>();
const themeStore = useThemeStore();

// 按分组获取所有可用主题
const themesByGroup = computed(() => getThemesByGroup());

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
    "future-tech": "ri:rocket-line",
    halloween: "ri:ghost-smile-line",
    christmas: "ri:gift-line",
    "spring-festival": "ri:fire-line",
  };
  return icons[themeName] || "ri:brush-line";
};

// 获取主题描述
const getThemeDescription = (themeName: string): string => {
  const descriptions: Record<string, string> = {
    default: "使用 Element Plus 原生组件",
    "8bit": "像素风格，复古游戏风",
    "future-tech": "未来科技风格",
    halloween: "万圣节主题，南瓜橙 + 幽灵紫",
    christmas: "圣诞节主题，圣诞红 + 松绿",
    "spring-festival": "春节主题，中国红 + 金黄",
  };
  return descriptions[themeName] || "自定义主题";
};

// 获取分组标题
const getGroupTitle = (group: string): string => {
  const titles: Record<string, string> = {
    regular: "常规主题",
    beta: "内测主题",
    festival: "节日主题",
    experimental: "实验性主题",
  };
  return titles[group] || group;
};

// 获取分组徽章
const getGroupBadge = (group: string): string => {
  const badges: Record<string, string> = {
    regular: "",
    beta: "Beta",
    festival: "限时",
    experimental: "实验",
  };
  return badges[group] || "";
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
    message.success(`已切换到${themeName显示}主题`);
  } catch (error) {
    console.error("[ThemeSwitcher] 切换主题失败:", error);
    message.error("主题切换失败，请重试");
  } finally {
    switching.value = false;
  }
};
</script>

<style lang="scss" scoped>
.theme-switcher {
  width: 100%;
}

.theme-group {
  margin-bottom: 24px;

  &:last-child {
    margin-bottom: 0;
  }
}

.theme-group-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--el-border-color-lighter);

  .theme-group-title {
    font-size: 14px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  .theme-group-badge {
    display: inline-block;
    padding: 2px 8px;
    font-size: 12px;
    font-weight: 500;
    color: var(--el-color-warning);
    background: var(--el-color-warning-light-9);
    border-radius: 4px;
    border: 1px solid var(--el-color-warning-light-7);
  }
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
  overflow: hidden;

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

  .theme-countdown {
    font-size: 11px;
    color: var(--el-color-warning);
    font-weight: 500;
    margin-top: 2px;
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
