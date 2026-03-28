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
          :key="theme.key"
          class="theme-card"
          :data-theme-key="theme.key"
          :class="{
            'is-active': currentTheme === theme.key,
            'is-switching': switching,
          }"
          @click="handleSwitchTheme(theme.key)"
        >
          <!-- 内测主题绸带 -->
          <ScRibbon
            v-if="theme.type === 'beta'"
            text="内测"
            variant="corner"
            position="rt"
            color="#ff6b6b"
            size="sm"
          />

          <div class="theme-preview">
            <div class="theme-preview-scene" :class="`theme-preview-scene--${theme.key}`">
              <span class="theme-preview-orb theme-preview-orb--a"></span>
              <span class="theme-preview-orb theme-preview-orb--b"></span>
              <span class="theme-preview-line"></span>
            </div>
            <div class="theme-icon">
              <IconifyIconOnline
                :icon="getThemeIcon(theme.key)"
                :style="{ fontSize: '32px' }"
              />
            </div>
            <div class="theme-preview-caption">{{ getThemePreviewCaption(theme.key) }}</div>
          </div>
          <div class="theme-info">
            <span class="theme-name">{{ theme.name }}</span>
            <span class="theme-desc">{{ theme.description }}</span>
            <!-- 节日主题倒计时 -->
            <span
              v-if="theme.type === 'festival' && getDaysUntilFestival(theme.key)"
              class="theme-countdown"
            >
              距离节日还有 {{ getDaysUntilFestival(theme.key) }} 天
            </span>
          </div>
          <div v-if="currentTheme === theme.key" class="theme-check">
            <IconifyIconOnline icon="ri:check-line" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { IconifyIconOnline } from "@repo/components/ReIcon";
import ScRibbon from "@repo/components/ScRibbon/index.vue";
import { switchTheme as switchThemeUtil } from "@repo/components/hooks/useThemeComponent";
import { useThemeStore } from "../../stores/themeStore";
import { useGlobal } from "@pureadmin/utils";
import { message } from "@repo/utils";
import { useThemeAnimation } from "../../hooks/useThemeAnimation";
import { getAvailableThemes, type LayoutTheme } from "../../themes";

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

// 按分组获取所有可用主题（从布局主题系统）
const themesByGroup = computed(() => {
  const themes = getAvailableThemes();
  const grouped: Record<string, LayoutTheme[]> = {
    regular: [],
    beta: [],
    festival: [],
  };

  themes.forEach((theme) => {
    const type = theme.type || "regular";
    if (!grouped[type]) {
      grouped[type] = [];
    }
    grouped[type].push(theme);
  });

  return grouped;
});

// 当前主题
const currentTheme = computed(() => {
  return $storage.configure?.systemTheme || "default";
});

// 主题切换中状态
const switching = ref(false);

// 获取主题图标（从主题配置中读取，或使用默认值）
const getThemeIcon = (themeName: string): string => {
  const theme = getAvailableThemes().find((t) => t.key === themeName);
  return theme?.icon || "ri:brush-line";
};

const getThemePreviewCaption = (themeName: string): string => {
  const captions: Record<string, string> = {
    default: "Balanced",
    "8bit": "Pixel Grid",
    "future-tech": "Neon Ops",
    halloween: "Ghost Lab",
    christmas: "Aurora Gift",
    "spring-festival": "Lantern Grid",
  };
  return captions[themeName] || "Theme";
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
  gap: 14px;
}

.theme-card {
  --theme-card-accent: var(--el-color-primary);
  --theme-card-bg: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.94));
  --theme-card-border: rgba(148, 163, 184, 0.2);
  --theme-card-shadow: 0 18px 36px -28px rgba(15, 23, 42, 0.18);
  --theme-card-hover-shadow: 0 24px 42px -28px rgba(15, 23, 42, 0.22);
  --theme-card-active-shadow: 0 24px 42px -28px rgba(var(--el-color-primary-rgb), 0.22);
  --theme-card-halo: radial-gradient(circle at top right, rgba(var(--el-color-primary-rgb), 0.12), transparent 36%);
  --theme-card-preview-bg: linear-gradient(135deg, #f8fbff, #edf3ff);
  --theme-card-preview-border: rgba(59, 130, 246, 0.16);
  --theme-card-preview-overlay: linear-gradient(135deg, rgba(255, 255, 255, 0.45), transparent 60%);
  --theme-card-icon-bg: rgba(255, 255, 255, 0.8);
  --theme-card-icon-border: rgba(148, 163, 184, 0.18);
  --theme-card-ink: var(--el-text-color-primary);
  --theme-card-muted: var(--el-text-color-secondary);
  position: relative;
  padding: 14px;
  border: 1px solid var(--theme-card-border);
  border-radius: 22px;
  cursor: pointer;
  transition:
    transform 0.25s ease,
    border-color 0.25s ease,
    box-shadow 0.25s ease,
    background 0.25s ease;
  background: var(--theme-card-bg);
  box-shadow: var(--theme-card-shadow);
  overflow: hidden;
  isolation: isolate;
  min-height: 194px;

  &::before {
    content: "";
    position: absolute;
    inset: 0;
    background: var(--theme-card-halo);
    pointer-events: none;
    z-index: 0;
  }

  > * {
    position: relative;
    z-index: 1;
  }

  &:hover {
    border-color: var(--theme-card-accent);
    transform: translateY(-4px);
    box-shadow: var(--theme-card-hover-shadow);
  }

  &.is-active {
    border-color: var(--theme-card-accent);
    box-shadow: var(--theme-card-active-shadow);
    transform: translateY(-2px);

    .theme-preview {
      .theme-icon {
        color: var(--theme-card-accent);
      }
    }
  }
}

.theme-preview {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  margin-bottom: 14px;
  min-height: 88px;
  border-radius: 18px;
  background: var(--theme-card-preview-bg);
  border: 1px solid var(--theme-card-preview-border);
  position: relative;
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    inset: 0;
    background: var(--theme-card-preview-overlay);
    pointer-events: none;
  }

  .theme-icon {
    width: 56px;
    height: 56px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--theme-card-accent);
    transition:
      color 0.3s ease,
      transform 0.3s ease;
    border-radius: 18px;
    background: var(--theme-card-icon-bg);
    border: 1px solid var(--theme-card-icon-border);
    backdrop-filter: blur(10px);
  }
}

.theme-preview-scene {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.theme-preview-orb,
.theme-preview-line,
.theme-preview-caption {
  position: relative;
  z-index: 1;
}

.theme-preview-orb {
  position: absolute;
  border-radius: 999px;
  opacity: 0.9;

  &--a {
    top: 14px;
    left: 16px;
    width: 18px;
    height: 18px;
    background: rgba(255, 255, 255, 0.22);
  }

  &--b {
    right: 14px;
    bottom: 16px;
    width: 42px;
    height: 10px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.14);
  }
}

.theme-preview-line {
  position: absolute;
  left: 18px;
  right: 18px;
  bottom: 18px;
  height: 1px;
  background: rgba(255, 255, 255, 0.16);
}

.theme-preview-caption {
  margin-top: 10px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--theme-card-muted);
}

.theme-card:hover .theme-preview .theme-icon {
  transform: translateY(-2px) scale(1.04);
}

.theme-card.is-active .theme-preview .theme-icon {
  transform: scale(1.03);
}

.theme-card[data-theme-key="default"] {
  --theme-card-accent: #3b82f6;
  --theme-card-bg: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(241, 245, 249, 0.96));
  --theme-card-border: rgba(59, 130, 246, 0.16);
  --theme-card-shadow: 0 18px 36px -28px rgba(59, 130, 246, 0.16);
  --theme-card-hover-shadow: 0 24px 42px -28px rgba(59, 130, 246, 0.2);
  --theme-card-active-shadow: 0 24px 44px -28px rgba(59, 130, 246, 0.26);
  --theme-card-halo: radial-gradient(circle at top right, rgba(59, 130, 246, 0.1), transparent 38%);
  --theme-card-preview-bg: linear-gradient(135deg, #f8fbff, #ebf3ff);
  --theme-card-preview-border: rgba(59, 130, 246, 0.18);
  --theme-card-icon-bg: rgba(255, 255, 255, 0.85);
  --theme-card-icon-border: rgba(59, 130, 246, 0.14);
}

.theme-card[data-theme-key="8bit"] {
  --theme-card-accent: #32cd32;
  --theme-card-bg:
    repeating-linear-gradient(90deg, rgba(16, 16, 16, 0.05) 0 1px, transparent 1px 18px),
    repeating-linear-gradient(180deg, rgba(16, 16, 16, 0.05) 0 1px, transparent 1px 18px),
    linear-gradient(180deg, #fdfdfd, #ededed);
  --theme-card-border: #111111;
  --theme-card-shadow: 6px 6px 0 rgba(17, 17, 17, 0.12);
  --theme-card-hover-shadow: 8px 8px 0 rgba(17, 17, 17, 0.16);
  --theme-card-active-shadow: 8px 8px 0 rgba(17, 17, 17, 0.18);
  --theme-card-halo: linear-gradient(180deg, transparent, transparent);
  --theme-card-preview-bg:
    repeating-linear-gradient(90deg, rgba(17, 17, 17, 0.08) 0 2px, transparent 2px 14px),
    repeating-linear-gradient(180deg, rgba(17, 17, 17, 0.08) 0 2px, transparent 2px 14px),
    linear-gradient(180deg, #ffffff, #f3f3f3);
  --theme-card-preview-border: #111111;
  --theme-card-icon-bg: #111111;
  --theme-card-icon-border: #111111;
  --theme-card-ink: #111111;
  --theme-card-muted: #4b5563;
  border-width: 3px;
  border-radius: 0;
  image-rendering: pixelated;

  &:hover,
  &.is-active {
    transform: translate(-2px, -2px);
  }

  .theme-preview,
  .theme-preview .theme-icon {
    border-radius: 0;
    backdrop-filter: none;
  }
}

.theme-card[data-theme-key="future-tech"] {
  --theme-card-accent: #66f8ff;
  --theme-card-bg: linear-gradient(180deg, rgba(6, 15, 37, 0.98), rgba(4, 9, 24, 0.94));
  --theme-card-border: rgba(102, 248, 255, 0.22);
  --theme-card-shadow: 0 22px 40px -28px rgba(102, 248, 255, 0.18);
  --theme-card-hover-shadow: 0 28px 46px -28px rgba(102, 248, 255, 0.24);
  --theme-card-active-shadow: 0 28px 46px -26px rgba(102, 248, 255, 0.3);
  --theme-card-halo: radial-gradient(circle at top right, rgba(102, 248, 255, 0.16), transparent 40%);
  --theme-card-preview-bg: linear-gradient(135deg, rgba(9, 25, 58, 0.98), rgba(4, 12, 28, 0.94));
  --theme-card-preview-border: rgba(102, 248, 255, 0.18);
  --theme-card-preview-overlay: linear-gradient(135deg, rgba(102, 248, 255, 0.12), transparent 55%);
  --theme-card-icon-bg: rgba(9, 25, 58, 0.82);
  --theme-card-icon-border: rgba(102, 248, 255, 0.2);
  --theme-card-ink: #dffcff;
  --theme-card-muted: rgba(168, 240, 255, 0.72);
}

.theme-card[data-theme-key="future-tech"] {
  .theme-preview-orb--a {
    background: rgba(102, 248, 255, 0.28);
    box-shadow: 0 0 20px rgba(102, 248, 255, 0.28);
  }

  .theme-preview-orb--b {
    background: linear-gradient(90deg, rgba(102, 248, 255, 0.18), transparent);
  }

  .theme-preview-line {
    background: linear-gradient(90deg, rgba(102, 248, 255, 0.12), rgba(102, 248, 255, 0.48), transparent);
  }
}

.theme-card[data-theme-key="halloween"] {
  --theme-card-accent: #ffb05c;
  --theme-card-bg: linear-gradient(180deg, rgba(43, 10, 63, 0.96), rgba(20, 4, 30, 0.92));
  --theme-card-border: rgba(255, 176, 92, 0.22);
  --theme-card-shadow: 0 22px 40px -28px rgba(255, 117, 24, 0.2);
  --theme-card-hover-shadow: 0 28px 46px -28px rgba(255, 117, 24, 0.26);
  --theme-card-active-shadow: 0 28px 46px -26px rgba(255, 117, 24, 0.3);
  --theme-card-halo: radial-gradient(circle at top right, rgba(255, 176, 92, 0.18), transparent 42%);
  --theme-card-preview-bg: linear-gradient(135deg, rgba(57, 13, 82, 0.98), rgba(24, 4, 36, 0.94));
  --theme-card-preview-border: rgba(255, 176, 92, 0.18);
  --theme-card-preview-overlay: linear-gradient(135deg, rgba(255, 176, 92, 0.12), transparent 55%);
  --theme-card-icon-bg: rgba(57, 13, 82, 0.8);
  --theme-card-icon-border: rgba(255, 176, 92, 0.18);
  --theme-card-ink: #ffe5c8;
  --theme-card-muted: rgba(255, 212, 171, 0.74);
}

.theme-card[data-theme-key="halloween"] {
  .theme-preview-orb--a {
    width: 24px;
    height: 24px;
    background: radial-gradient(circle at 35% 35%, rgba(255, 196, 124, 0.95), rgba(255, 117, 24, 0.72));
    box-shadow: 0 0 20px rgba(255, 117, 24, 0.22);
  }

  .theme-preview-orb--b {
    width: 56px;
    height: 16px;
    background: linear-gradient(90deg, rgba(255, 176, 92, 0.18), rgba(109, 40, 217, 0.12));
  }

  .theme-preview-line {
    background: linear-gradient(90deg, rgba(255, 176, 92, 0.12), rgba(255, 176, 92, 0.4), transparent);
  }
}

.theme-card[data-theme-key="christmas"] {
  --theme-card-accent: #ffe18a;
  --theme-card-bg: linear-gradient(180deg, rgba(14, 57, 25, 0.98), rgba(8, 31, 14, 0.94));
  --theme-card-border: rgba(255, 225, 138, 0.2);
  --theme-card-shadow: 0 22px 40px -28px rgba(17, 70, 28, 0.24);
  --theme-card-hover-shadow: 0 28px 46px -28px rgba(17, 70, 28, 0.3);
  --theme-card-active-shadow: 0 28px 46px -26px rgba(255, 225, 138, 0.22);
  --theme-card-halo: radial-gradient(circle at top right, rgba(255, 225, 138, 0.16), transparent 42%);
  --theme-card-preview-bg: linear-gradient(135deg, rgba(17, 70, 28, 0.98), rgba(121, 18, 44, 0.74));
  --theme-card-preview-border: rgba(255, 225, 138, 0.18);
  --theme-card-preview-overlay: linear-gradient(135deg, rgba(255, 225, 138, 0.12), transparent 55%);
  --theme-card-icon-bg: rgba(255, 255, 255, 0.12);
  --theme-card-icon-border: rgba(255, 225, 138, 0.16);
  --theme-card-ink: #fff5d1;
  --theme-card-muted: rgba(243, 237, 214, 0.74);
}

.theme-card[data-theme-key="christmas"] {
  .theme-preview-orb--a {
    width: 20px;
    height: 20px;
    background: radial-gradient(circle at 30% 30%, rgba(255, 225, 138, 0.95), rgba(184, 134, 11, 0.8));
  }

  .theme-preview-orb--b {
    width: 62px;
    height: 14px;
    background: linear-gradient(90deg, rgba(255, 225, 138, 0.18), rgba(198, 40, 40, 0.14));
  }

  .theme-preview-line {
    background: linear-gradient(90deg, rgba(255, 225, 138, 0.14), rgba(255, 225, 138, 0.42), transparent);
  }
}

.theme-card[data-theme-key="spring-festival"] {
  --theme-card-accent: #f8e3a4;
  --theme-card-bg: linear-gradient(180deg, rgba(111, 4, 20, 0.98), rgba(67, 1, 13, 0.94));
  --theme-card-border: rgba(248, 227, 164, 0.2);
  --theme-card-shadow: 0 22px 40px -28px rgba(111, 4, 20, 0.28);
  --theme-card-hover-shadow: 0 28px 46px -28px rgba(111, 4, 20, 0.34);
  --theme-card-active-shadow: 0 28px 46px -26px rgba(248, 227, 164, 0.22);
  --theme-card-halo: radial-gradient(circle at top right, rgba(248, 227, 164, 0.18), transparent 42%);
  --theme-card-preview-bg: linear-gradient(135deg, rgba(111, 4, 20, 0.98), rgba(158, 20, 38, 0.72));
  --theme-card-preview-border: rgba(248, 227, 164, 0.18);
  --theme-card-preview-overlay: linear-gradient(135deg, rgba(248, 227, 164, 0.12), transparent 55%);
  --theme-card-icon-bg: rgba(255, 255, 255, 0.12);
  --theme-card-icon-border: rgba(248, 227, 164, 0.16);
  --theme-card-ink: #fff2be;
  --theme-card-muted: rgba(255, 235, 185, 0.74);
}

.theme-card[data-theme-key="spring-festival"] {
  .theme-preview-orb--a {
    width: 22px;
    height: 22px;
    background: radial-gradient(circle at 30% 30%, rgba(248, 227, 164, 0.96), rgba(210, 85, 40, 0.78));
    box-shadow: 0 0 18px rgba(245, 213, 122, 0.2);
  }

  .theme-preview-orb--b {
    width: 64px;
    height: 14px;
    background: linear-gradient(90deg, rgba(245, 213, 122, 0.16), rgba(158, 20, 38, 0.18));
  }

  .theme-preview-line {
    background: linear-gradient(90deg, rgba(245, 213, 122, 0.14), rgba(245, 213, 122, 0.44), transparent);
  }
}

.theme-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  text-align: center;

  .theme-name {
    font-size: 14px;
    font-weight: 600;
    color: var(--theme-card-ink);
  }

  .theme-desc {
    font-size: 12px;
    color: var(--theme-card-muted);
    line-height: 1.4;
  }

  .theme-countdown {
    font-size: 11px;
    color: var(--theme-card-accent);
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
  background: var(--theme-card-accent);
  color: white;
  border-radius: 50%;
  font-size: 12px;
}
</style>
