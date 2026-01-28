<template>
  <div class="system-home system-container modern-bg">
    <div class="page-bg" aria-hidden="true" />

    <section class="page-header" aria-labelledby="system-title">
      <div class="header-content">
        <div class="title-section">
          <p class="eyebrow">System Ops Suite</p>
          <h1 id="system-title" class="page-title">
            <IconifyIconOnline icon="ri:settings-3-line" class="title-icon" />
            系统管理
          </h1>
          <p class="page-subtitle">系统配置、日志管理、限流设置等核心能力面板</p>
          <div class="meta-row">
            <span class="pill pill-success">运行正常</span>
            <span class="pill pill-muted">实时守护</span>
            <span class="pill pill-ghost">深色模式已适配</span>
          </div>
        </div>
        <div class="header-actions" aria-label="快捷入口">
          <router-link to="/system/log" class="hero-button primary">查看日志</router-link>
          <router-link to="/system/limit" class="hero-button ghost">前往限流</router-link>
        </div>
      </div>
    </section>

    <section class="content-area">
      <header class="section-heading">
        <div>
          <p class="eyebrow">核心能力</p>
          <h2 class="section-title">全链路系统控制台</h2>
          <p class="section-subtitle">以可视化方式快速抵达日志、限流、节假日与文件管理</p>
        </div>
        <div class="section-hint">支持桌面与移动端的自适应布局</div>
      </header>

      <div class="feature-grid" role="list">
        <router-link
          v-for="item in featureItems"
          :key="item.to"
          :to="item.to"
          class="feature-card"
          role="listitem"
          :style="{
            '--card-accent': item.accent,
            '--card-accent-soft': item.accentSoft
          }"
        >
          <div class="feature-icon-wrapper">
            <IconifyIconOnline :icon="item.icon" class="feature-icon" />
          </div>
          <div class="feature-text">
            <h3 class="feature-title">{{ item.title }}</h3>
            <p class="feature-desc">{{ item.desc }}</p>
          </div>
          <div class="feature-meta">
            <span class="meta-chip">{{ item.badge }}</span>
            <span class="meta-arrow" aria-hidden="true">→</span>
          </div>
        </router-link>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { IconifyIconOnline } from "@repo/components";

type FeatureItem = {
  to: string;
  title: string;
  desc: string;
  badge: string;
  icon: string;
  accent: string;
  accentSoft: string;
};

const featureItems: FeatureItem[] = [
  {
    to: "/system/log",
    title: "日志管理",
    desc: "实时查看、检索并追踪核心模块日志",
    badge: "实时监控",
    icon: "ri:file-list-3-line",
    accent: "var(--el-color-primary)",
    accentSoft: "rgba(64, 158, 255, 0.12)",
  },
  {
    to: "/system/limit",
    title: "限流配置",
    desc: "限流规则配置与压测策略管理",
    badge: "守护运行",
    icon: "ri:speed-line",
    accent: "var(--el-color-warning)",
    accentSoft: "rgba(230, 162, 60, 0.14)",
  },
  {
    to: "/system/holiday",
    title: "节假日管理",
    desc: "统一维护节假日并与调度策略联动",
    badge: "排期联动",
    icon: "ri:calendar-line",
    accent: "var(--el-color-success)",
    accentSoft: "rgba(103, 194, 58, 0.14)",
  },
  {
    to: "/system/file",
    title: "文件管理",
    desc: "单机文件上传、版本留存与安全校验",
    badge: "安全加固",
    icon: "ri:folder-upload-line",
    accent: "var(--el-color-info)",
    accentSoft: "rgba(144, 147, 153, 0.14)",
  },
];
</script>

<style lang="scss" scoped>
.system-home {
  position: relative;
  padding: clamp(20px, 3vw, 32px);
  isolation: isolate;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: clamp(18px, 2vw, 28px);
  --surface: var(--el-bg-color-overlay);
  --border: color-mix(in srgb, var(--el-border-color-lighter) 70%, transparent);
  --text-primary: var(--el-text-color-primary);
  --text-regular: var(--el-text-color-regular);
}

.page-bg {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 20% 20%, rgba(64, 158, 255, 0.14), transparent 35%),
    radial-gradient(circle at 80% 0%, rgba(245, 108, 108, 0.18), transparent 32%),
    radial-gradient(circle at 70% 70%, rgba(103, 194, 58, 0.12), transparent 36%);
  filter: blur(48px);
  opacity: 0.9;
  z-index: -1;
}

.page-header {
  background: linear-gradient(
      135deg,
      rgba(64, 158, 255, 0.25),
      rgba(64, 158, 255, 0.12),
      rgba(255, 255, 255, 0.06)
    ),
    color-mix(in srgb, var(--surface) 80%, transparent);
  border: 1px solid var(--border);
  border-radius: 18px;
  padding: clamp(18px, 3vw, 28px);
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.08);
  backdrop-filter: blur(16px);
}

.header-content {
  display: grid;
  grid-template-columns: 1.2fr auto;
  gap: clamp(16px, 4vw, 32px);
  align-items: start;
}

.title-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.eyebrow {
  font-size: 12px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--el-color-primary);
  margin: 0;
  font-weight: 700;
}

.page-title {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  font-size: clamp(26px, 4vw, 32px);
  font-weight: 800;
  color: var(--text-primary);
  margin: 0;

  .title-icon {
    font-size: clamp(30px, 3vw, 36px);
    color: var(--el-color-primary);
  }
}

.page-subtitle {
  color: var(--text-regular);
  font-size: 15px;
  line-height: 1.6;
  margin: 0;
}

.meta-row {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 6px;
}

.pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  border: 1px solid var(--border);
  background: color-mix(in srgb, var(--surface) 88%, transparent);
}

.pill-success {
  color: var(--el-color-success);
  border-color: rgba(103, 194, 58, 0.2);
}

.pill-muted {
  color: var(--text-regular);
}

.pill-ghost {
  color: var(--el-color-info);
  border-color: rgba(144, 147, 153, 0.3);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  justify-content: flex-end;
}

.hero-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 18px;
  border-radius: 12px;
  font-weight: 700;
  text-decoration: none;
  border: 1px solid var(--border);
  background: color-mix(in srgb, var(--surface) 86%, transparent);
  color: var(--text-primary);
  transition: transform 180ms ease, box-shadow 180ms ease, background 180ms ease;

  &:hover,
  &:focus-visible {
    transform: translateY(-2px);
    box-shadow: 0 12px 30px rgba(0, 0, 0, 0.12);
    border-color: color-mix(in srgb, var(--el-color-primary) 30%, var(--border));
    background: color-mix(in srgb, var(--el-color-primary) 8%, var(--surface));
  }
}

.hero-button.primary {
  background: linear-gradient(120deg, var(--el-color-primary), #7bb6ff);
  color: #fff;
  border: none;

  &:hover,
  &:focus-visible {
    box-shadow: 0 14px 32px rgba(64, 158, 255, 0.28);
  }
}

.hero-button.ghost {
  color: var(--text-primary);
}

.content-area {
  display: flex;
  flex-direction: column;
  gap: clamp(14px, 2vw, 24px);
}

.section-heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.section-title {
  margin: 2px 0 6px;
  font-size: clamp(20px, 3vw, 24px);
  color: var(--text-primary);
}

.section-subtitle {
  margin: 0;
  color: var(--text-regular);
  font-size: 14px;
}

.section-hint {
  color: var(--text-regular);
  font-size: 13px;
  background: color-mix(in srgb, var(--surface) 90%, transparent);
  border: 1px dashed var(--border);
  padding: 8px 12px;
  border-radius: 10px;
}

.feature-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: clamp(14px, 2vw, 22px);
}

.feature-card {
  position: relative;
  display: grid;
  grid-template-rows: auto 1fr auto;
  gap: 10px;
  padding: 22px;
  border-radius: 16px;
  background: color-mix(in srgb, var(--surface) 92%, transparent);
  border: 1px solid color-mix(in srgb, var(--border) 70%, var(--card-accent-soft));
  text-decoration: none;
  color: var(--text-primary);
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.06);
  overflow: hidden;
  transition: transform 200ms ease, box-shadow 220ms ease, border-color 200ms ease;
  container-type: inline-size;

  &::before {
    content: "";
    position: absolute;
    inset: -20% 50% 50% -20%;
    background: radial-gradient(circle, var(--card-accent-soft), transparent 60%);
    opacity: 0.4;
    transition: opacity 200ms ease, transform 220ms ease;
  }

  &:hover,
  &:focus-visible {
    transform: translateY(-4px);
    box-shadow: 0 18px 40px rgba(0, 0, 0, 0.12);
    border-color: color-mix(in srgb, var(--card-accent) 28%, var(--border));

    &::before {
      opacity: 0.75;
      transform: translate3d(4px, -2px, 0);
    }

    .feature-icon-wrapper {
      transform: translateY(-2px) scale(1.03);
      box-shadow: 0 10px 24px color-mix(in srgb, var(--card-accent) 32%, transparent);
    }

    .meta-arrow {
      transform: translateX(4px);
      opacity: 1;
    }
  }
}

.feature-icon-wrapper {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  background: color-mix(in srgb, var(--card-accent) 12%, var(--surface));
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--card-accent);
  transition: all 180ms ease;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.4);
}

.feature-icon {
  font-size: 28px;
}

.feature-text {
  display: grid;
  gap: 6px;
}

.feature-title {
  font-size: 18px;
  margin: 0;
  color: var(--text-primary);
}

.feature-desc {
  margin: 0;
  color: var(--text-regular);
  font-size: 14px;
  line-height: 1.6;
}

.feature-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.meta-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: 10px;
  background: color-mix(in srgb, var(--card-accent-soft) 80%, var(--surface));
  color: color-mix(in srgb, var(--card-accent) 78%, #222);
  font-size: 12px;
  font-weight: 700;
  border: 1px solid color-mix(in srgb, var(--card-accent) 26%, transparent);
}

.meta-arrow {
  font-size: 18px;
  opacity: 0.6;
  transition: transform 180ms ease, opacity 180ms ease;
}

@container (max-width: 360px) {
  .feature-card {
    grid-template-rows: auto auto auto;
    padding: 18px;
  }

  .feature-meta {
    margin-top: 2px;
  }
}

@media (max-width: 960px) {
  .header-content {
    grid-template-columns: 1fr;
  }

  .header-actions {
    justify-content: flex-start;
  }
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
</style>
