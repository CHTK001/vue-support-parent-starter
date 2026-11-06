<script setup lang="ts">
/**
 * 空状态样式设置（仅管理员可见）
 *
 * 背景：ReEmpty 有三种样式 —— "el"（el-empty）/ "modern"（扁平空状态）/
 * "plot"（hairline 动画图）。业务里各自写死 layout 会导致全站空状态风格不一，
 * 所以把「默认样式」收成部署配置 app.yaml `other.emptyState`，在这里给 admin
 * 一个即时切换入口。
 *
 * 作用范围（这里刻意写清楚，避免以后被误解成「强制覆盖」）：
 *   - 只影响**没有显式传 layout** 的 <ReEmpty>；业务里写死 layout 的不受配置影响，
 *     规则见 @repo/ui 的 ReEmpty/resolve.ts（有单测锁住）；
 *   - 关闭开关即回落 el-empty，与接入这段配置之前完全一致。
 *
 * 权限：用 @repo/core 的 isAdmin()（含 superadmin），与 v-admin 指令同一口径。
 * 角色在登录后写入，抽屉打开时取一次即可（角色变更会伴随页面初始化）。
 */
import { computed } from "vue";
import { getConfig } from "@repo/config";
import type { EmptyStateConfig } from "@repo/config";
import { isAdmin } from "@repo/core";
import ReSwitch from "@repo/ui/re-switch";
import ReEmpty from "@repo/ui/re-empty";
import { HAIRLINE_FIGURE_KEYS, normalizeHairlineFigure } from "@repo/ui/re-empty-figures";
import { Brush } from "@element-plus/icons-vue";
import { useI18n } from "vue-i18n";

const { t } = useI18n();

const appConfig = getConfig();
const emptyState = computed(() => appConfig.other.emptyState as EmptyStateConfig);

/** 仅管理员可改（含超级管理员） */
const canEdit = isAdmin();

/** 三种可选样式 */
const LAYOUTS = [
  { value: "el", labelKey: "emptyState.layout.el" },
  { value: "modern", labelKey: "emptyState.layout.modern" },
  { value: "plot", labelKey: "emptyState.layout.plot" },
] as const;

/**
 * 动画图可选的 hairline 图形：直接遍历 UI 侧注册表，
 * 以后加图形只改 figures.ts + 补一条 i18n，不用动这里。
 */
const FIGURES = HAIRLINE_FIGURE_KEYS;

/** 当前选中的样式（关闭开关时预览也回落 el，所见即所得） */
const previewLayout = computed(() =>
  emptyState.value.enable ? emptyState.value.layout : "el",
);

/** 当前选中的图形（非法值/空值一律按 plot 展示） */
const previewFigure = computed(() => normalizeHairlineFigure(emptyState.value.hairline));

function pick(layout: EmptyStateConfig["layout"]) {
  emptyState.value.layout = layout;
}

function pickFigure(key: string) {
  emptyState.value.hairline = normalizeHairlineFigure(key);
}

/** i18n 缺文案时退回键名，不显示空白按钮 */
function figureLabel(key: string) {
  const path = `emptyState.figures.${key}`;
  return t(path) === path ? key : t(path);
}
</script>

<template>
  <div v-if="canEdit" class="config-section">
    <div class="section-header">
      <el-icon :size="18" class="section-icon"><Brush /></el-icon>
      <span class="section-title">{{ t("emptyState.title") }}</span>
      <span class="section-badge">ADMIN</span>
    </div>
    <p class="section-desc">{{ t("emptyState.desc") }}</p>

    <div class="section-card">
      <ReSwitch layout="card"
        :title="t('emptyState.enable.title')"
        :sub="t('emptyState.enable.sub')"
        :tip="t('emptyState.enable.tip')"
        v-model="emptyState.enable"
      />

      <div class="layout-picker">
        <span class="layout-picker__label">{{ t("emptyState.layout.title") }}</span>
        <div class="layout-picker__options">
          <button
            v-for="item in LAYOUTS"
            :key="item.value"
            type="button"
            class="layout-option"
            :class="{ 'is-active': previewLayout === item.value }"
            :disabled="!emptyState.enable"
            :aria-pressed="previewLayout === item.value"
            @click="pick(item.value)"
          >
            {{ t(item.labelKey) }}
          </button>
        </div>
      </div>

      <!-- 动画图：再选一款 hairline 图形（12 款，来自 UI 侧注册表） -->
      <div v-if="previewLayout === 'plot'" class="layout-picker">
        <span class="layout-picker__label">{{ t("emptyState.figure.title") }}</span>
        <div class="layout-picker__options layout-picker__options--figures">
          <button
            v-for="key in FIGURES"
            :key="key"
            type="button"
            class="layout-option layout-option--figure"
            :class="{ 'is-active': previewFigure === key }"
            :disabled="!emptyState.enable"
            :aria-pressed="previewFigure === key"
            @click="pickFigure(key)"
          >
            {{ figureLabel(key) }}
          </button>
        </div>
      </div>

      <!-- 预览：直接复用真实组件，所见即所得 -->
      <div class="layout-preview">
        <ReEmpty
          :layout="previewLayout"
          :figure="previewFigure"
          :description="t('emptyState.title')"
        />
      </div>

      <p class="layout-tip">{{ t("emptyState.tip") }}</p>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.section-badge {
  margin-left: 6px;
  padding: 1px 6px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.5px;
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
  border-radius: 4px;
}

.section-desc {
  margin: 4px 0 8px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.section-card {
  :deep(.re-switch-card) {
    margin-top: 10px;
  }
}

.layout-picker {
  margin-top: 12px;
}

.layout-picker__label {
  display: block;
  margin-bottom: 6px;
  font-size: 12px;
  font-weight: 600;
  color: var(--el-text-color-regular);
}

.layout-picker__options {
  display: flex;
  gap: 8px;
}

/* 图形选择：12 款，4 列网格，长了自动换行 */
.layout-picker__options--figures {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 6px;
}

.layout-option--figure {
  flex: none;
  min-width: 0;
  padding: 6px 4px;
  font-size: 11px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.layout-option {
  flex: 1;
  padding: 7px 10px;
  font-size: 12px;
  color: var(--el-text-color-regular);
  background: var(--el-fill-color-blank);
  border: 1px solid var(--el-border-color);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover:not(:disabled) {
    color: var(--el-color-primary);
    border-color: var(--el-color-primary-light-5);
  }

  &.is-active {
    color: var(--el-color-primary);
    background: var(--el-color-primary-light-9);
    border-color: var(--el-color-primary);
    font-weight: 600;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
}

.layout-preview {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 180px;
  margin-top: 12px;
  padding: 8px;
  background: var(--el-fill-color-lighter);
  border: 1px dashed var(--el-border-color);
  border-radius: 8px;
  overflow: hidden;
}

.layout-tip {
  margin: 8px 0 0;
  font-size: 11px;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
}
</style>
