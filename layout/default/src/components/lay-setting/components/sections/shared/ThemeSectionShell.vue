<script setup lang="ts">
import { computed } from "vue";
import { ScText } from "@repo/components";

type ThemeSectionMotion =
  | "none"
  | "auto"
  | "neon"
  | "glitch"
  | "gold-foil"
  | "frost";

const props = withDefaults(
  defineProps<{
    theme: string;
    section: string;
    kicker: string;
    title: string;
    description: string;
    icon?: string;
    motion?: ThemeSectionMotion;
  }>(),
  {
    icon: "ri:palette-line",
    motion: "none",
  },
);

const sectionClass = computed(() => props.section.toLowerCase());
</script>

<template>
  <section
    :class="[
      'theme-setting-shell',
      `theme-setting-shell--${theme}`,
      `theme-setting-shell--${sectionClass}`,
    ]"
    :data-setting-theme="theme"
    :data-setting-section="section"
  >
    <header class="theme-setting-shell__hero">
      <span class="theme-setting-shell__icon">
        <IconifyIconOnline :icon="icon" />
      </span>
      <div class="theme-setting-shell__copy">
        <ScText class="theme-setting-shell__kicker" :theme-motion="motion">
          {{ kicker }}
        </ScText>
        <h3 class="theme-setting-shell__title">{{ title }}</h3>
        <p class="theme-setting-shell__description">{{ description }}</p>
      </div>
    </header>
    <div class="theme-setting-shell__content">
      <slot />
    </div>
  </section>
</template>

<style scoped lang="scss">
.theme-setting-shell {
  --theme-shell-accent: var(--el-color-primary);
  --theme-shell-text: var(--el-text-color-primary);
  --theme-shell-muted: var(--el-text-color-secondary);
  --theme-shell-line: rgba(var(--el-color-primary-rgb), 0.18);
  --theme-shell-surface: rgba(var(--el-color-primary-rgb), 0.08);
  --theme-shell-card: rgba(255, 255, 255, 0.72);
  --theme-shell-shadow: rgba(15, 23, 42, 0.12);
  display: grid;
  gap: 12px;

  &__hero {
    position: relative;
    display: flex;
    align-items: flex-start;
    gap: 14px;
    padding: 16px 18px;
    overflow: hidden;
    border: 1px solid var(--theme-shell-line);
    border-radius: 18px;
    background:
      radial-gradient(circle at top right, rgba(255, 255, 255, 0.24), transparent 36%),
      linear-gradient(135deg, var(--theme-shell-surface), transparent 72%);
    box-shadow:
      0 16px 32px -22px var(--theme-shell-shadow),
      inset 0 1px 0 rgba(255, 255, 255, 0.24);
  }

  &__hero::after {
    content: "";
    position: absolute;
    inset: 0;
    background:
      linear-gradient(120deg, transparent 0%, rgba(255, 255, 255, 0.12) 45%, transparent 70%);
    opacity: 0.65;
    pointer-events: none;
  }

  &__icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 42px;
    height: 42px;
    border-radius: 14px;
    color: var(--theme-shell-accent);
    background: color-mix(in srgb, var(--theme-shell-accent) 14%, transparent);
    box-shadow: 0 10px 24px -18px var(--theme-shell-shadow);
    font-size: 20px;
    flex-shrink: 0;
  }

  &__copy {
    display: grid;
    gap: 4px;
    min-width: 0;
  }

  &__kicker {
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--theme-shell-accent);
  }

  &__title {
    margin: 0;
    font-size: 18px;
    font-weight: 700;
    color: var(--theme-shell-text);
    letter-spacing: 0.02em;
  }

  &__description {
    margin: 0;
    font-size: 13px;
    line-height: 1.65;
    color: var(--theme-shell-muted);
  }

  :deep(.setting-section) {
    margin-bottom: 0;
    border-color: var(--theme-shell-line) !important;
    background: var(--theme-shell-card) !important;
    box-shadow:
      0 18px 40px -34px var(--theme-shell-shadow),
      inset 0 1px 0 rgba(255, 255, 255, 0.28) !important;
  }

  :deep(.setting-section:hover) {
    border-color: color-mix(in srgb, var(--theme-shell-accent) 70%, white) !important;
  }

  :deep(.section-title),
  :deep(.section-icon) {
    color: var(--theme-shell-accent) !important;
  }

  :deep(.section-description),
  :deep(.switch-card-desc),
  :deep(.param-label) {
    color: var(--theme-shell-muted) !important;
  }

  :deep(.layout-mode-item.is-active),
  :deep(.switch-card-item.is-active),
  :deep(.theme-color-item.is-selected) {
    box-shadow:
      0 0 0 2px color-mix(in srgb, var(--theme-shell-accent) 40%, transparent),
      0 18px 36px -24px var(--theme-shell-shadow) !important;
  }
}

.theme-setting-shell--default {
  --theme-shell-shadow: rgba(15, 23, 42, 0.16);
}

.theme-setting-shell--8bit {
  --theme-shell-accent: #32cd32;
  --theme-shell-text: #101010;
  --theme-shell-muted: #3a3a3a;
  --theme-shell-line: rgba(16, 16, 16, 0.82);
  --theme-shell-surface: rgba(50, 205, 50, 0.16);
  --theme-shell-card: #f7f7f7;
  --theme-shell-shadow: rgba(16, 16, 16, 0.22);
  image-rendering: pixelated;

  .theme-setting-shell__hero,
  .theme-setting-shell__icon {
    border-radius: 0;
  }

  .theme-setting-shell__title,
  .theme-setting-shell__kicker,
  .theme-setting-shell__description {
    font-family: "Fusion Pixel Zh_hans", "Courier New", monospace;
  }

  :deep(.setting-section),
  :deep(.layout-mode-item),
  :deep(.switch-card-item),
  :deep(.theme-color-grid) {
    border-radius: 0 !important;
    box-shadow: none !important;
  }
}

.theme-setting-shell--spring-festival {
  --theme-shell-accent: #ffd700;
  --theme-shell-text: #fff4d8;
  --theme-shell-muted: rgba(255, 236, 191, 0.82);
  --theme-shell-line: rgba(255, 215, 0, 0.26);
  --theme-shell-surface: rgba(200, 16, 46, 0.28);
  --theme-shell-card: linear-gradient(145deg, rgba(107, 0, 0, 0.82), rgba(72, 0, 0, 0.74));
  --theme-shell-shadow: rgba(107, 0, 0, 0.42);

  .theme-setting-shell__title,
  .theme-setting-shell__kicker {
    font-family: "STKaiti", "KaiTi", serif;
  }
}

.theme-setting-shell--halloween {
  --theme-shell-accent: #ff9a3d;
  --theme-shell-text: #fff3de;
  --theme-shell-muted: rgba(255, 214, 176, 0.82);
  --theme-shell-line: rgba(255, 117, 24, 0.28);
  --theme-shell-surface: rgba(44, 0, 62, 0.36);
  --theme-shell-card: linear-gradient(145deg, rgba(36, 14, 58, 0.88), rgba(20, 6, 34, 0.8));
  --theme-shell-shadow: rgba(20, 6, 34, 0.56);
}

.theme-setting-shell--christmas {
  --theme-shell-accent: #ffe18a;
  --theme-shell-text: #f3ffef;
  --theme-shell-muted: rgba(232, 247, 227, 0.84);
  --theme-shell-line: rgba(255, 225, 138, 0.24);
  --theme-shell-surface: rgba(17, 70, 28, 0.34);
  --theme-shell-card: linear-gradient(145deg, rgba(17, 70, 28, 0.86), rgba(121, 18, 44, 0.74));
  --theme-shell-shadow: rgba(17, 70, 28, 0.44);

  .theme-setting-shell__title {
    font-family: "Georgia", "Times New Roman", serif;
  }
}

.theme-setting-shell--future-tech {
  --theme-shell-accent: #00ffff;
  --theme-shell-text: #dffcff;
  --theme-shell-muted: rgba(147, 244, 255, 0.76);
  --theme-shell-line: rgba(0, 255, 255, 0.24);
  --theme-shell-surface: rgba(0, 255, 255, 0.12);
  --theme-shell-card: radial-gradient(circle at top, rgba(0, 255, 255, 0.12), rgba(5, 10, 31, 0.9));
  --theme-shell-shadow: rgba(0, 255, 255, 0.18);

  .theme-setting-shell__title,
  .theme-setting-shell__kicker {
    font-family: "Rajdhani", "Orbitron", "Consolas", sans-serif;
    letter-spacing: 0.08em;
  }
}
</style>
