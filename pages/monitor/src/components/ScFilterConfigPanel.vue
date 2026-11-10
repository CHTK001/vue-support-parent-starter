<script setup lang="ts">
/**
 * ServerFilter 配置面板 —— 按过滤器类型分派到各自的专用组件。
 *
 * 本组件只负责三件事：
 *   1. 插件头部（元数据 / 前提 / 深度查看入口）；
 *   2. 顶部操作条（已调整 N / 总数 + 热更新参数）—— 调参期间始终可见，
 *      不必滚到表单底部去找「保存」；
 *   3. 按 filterType 从注册表解析配置组件（filters/index.ts），未注册则用通用 schema 表单。
 *
 * 各过滤器的专属表单在 components/filters/ 下，新增插件 = 新增一个面板 + 注册表加一行，
 * 不再往本文件里加 if/else 分支（原先 file-storage 与 service-discovery 是硬编码在此）。
 *
 * props / emits 契约保持不变，调用方（ScServerFormDrawer、ScServerDetailDrawer）无需改动。
 */
import { computed } from 'vue';
import { message } from '@repo/core';
import type { FilterTypeMeta } from '../api';
import { hasFilterDetail } from '../utils/filterDetail';
import { resolveFilterPanel } from './filters';

const props = defineProps<{
  /** 插件元数据 */
  meta: FilterTypeMeta | null;
  /** 该实例的过滤器类型 */
  filterType: string;
  /** 当前参数（v-model） */
  modelValue: Record<string, string>;
  /** 所属服务是否运行中（决定能否热更新） */
  live?: boolean;
  /** 热更新进行中 */
  applying?: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: Record<string, string>): void;
  (e: 'apply'): void;
  (e: 'open-detail-page'): void;
}>();

/** 参数 schema（头部计数与兜底文案用） */
const schema = computed(() => props.meta?.params ?? []);

/** 当前类型对应的配置组件 */
const panel = computed(() => resolveFilterPanel(props.filterType));

/** 已配置项数量（与默认值不同的参数） */
const configuredCount = computed(() =>
  schema.value.filter(f => {
    const v = props.modelValue?.[f.name];
    return v !== undefined && v !== null && String(v) !== String(f.defaultValue ?? '');
  }).length,
);

/** 已调整占比（0-100），用于顶部进度条 */
const configuredPercent = computed(() => {
  const total = schema.value.length;
  if (!total) return 0;
  return Math.round((configuredCount.value / total) * 100);
});

/** 热更新：未运行时提示随下次启动生效，不发请求 */
function onApply() {
  if (!props.live) {
    message.info('服务未运行，参数将随下次启动生效');
    return;
  }
  emit('apply');
}
</script>

<template>
  <div class="filter-config">
    <!-- 插件头部 -->
    <div class="fc-head">
      <div class="fc-title">
        <ReTag :type="meta?.spi ? 'success' : 'primary'">{{ meta?.spi ? 'SPI 插件' : '内置预设' }}</ReTag>
        <span class="fc-name">{{ filterType }}</span>
        <ReTag v-if="meta?.group" type="info">{{ meta.group }}</ReTag>
        <ReButton
          v-if="hasFilterDetail(meta)"
          class="fc-detail"
          icon="TopRight"
          layout="square"
          type="primary"
          :tip="meta?.detailLabel || '查看详情'"
          @click="emit('open-detail-page')"
        />
      </div>
      <div class="fc-desc">{{ meta?.desc || '未找到该插件的元数据，按通用参数渲染' }}</div>
      <div v-if="meta?.require" class="fc-require">前提：{{ meta.require }}</div>
    </div>

    <!-- 顶部操作条：调参时始终可见，计数 + 热更新 -->
    <div class="fc-bar">
      <div class="fc-count">
        <span class="fc-count-num">{{ configuredCount }}</span>
        <span class="fc-count-of">/ {{ schema.length }} 项已调整</span>
        <span class="fc-count-track" aria-hidden="true">
          <span class="fc-count-fill" :style="{ width: `${configuredPercent}%` }" />
        </span>
      </div>
      <div class="fc-bar-ops">
        <span class="dim">运行中就地生效，服务不中断；未运行时随下次启动生效</span>
        <ReButton
          show-text
          icon="Lightning"
          type="primary"
          :loading="applying"
          @click="onApply"
        >热更新参数</ReButton>
      </div>
    </div>

    <!-- 按类型分派到专属组件；未注册专用组件时回退通用 schema 表单 -->
    <component
      :is="panel"
      :meta="meta"
      :filter-type="filterType"
      :model-value="modelValue"
      @update:model-value="(v: Record<string, string>) => emit('update:modelValue', v)"
    />
  </div>
</template>

<style scoped lang="scss">
/* 本面板原先整套用 pages/server/src/styles/tokens.css 的私有令牌（--text-primary /
   --text-secondary --text-tertiary / --brand-500 / --warning-600），而那份 tokens.css
   只有 :root、没有暗色变体，暗色模式下这些值全部停留在亮色。上面已统一改走 EP 语义令牌。 */
.filter-config {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.fc-head {
  display: flex;
  flex-direction: column;
  gap: 5px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-lg, 12px);
  padding: 12px 14px;
}
.fc-title {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.fc-detail {
  margin-left: auto;
}
.fc-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  font-family: ui-monospace, SFMono-Regular, monospace;
}
.fc-desc {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  line-height: 1.6;
}
.fc-require {
  font-size: 12px;
  color: var(--el-color-warning-dark-2);
}

/* 顶部操作条：调参期间吸顶，避免改完还要滚到底部找按钮 */
.fc-bar {
  position: sticky;
  top: 0;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-lg, 12px);
  padding: 8px 12px;
}
.fc-count {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}
/* 已调整计数用主色，是这条操作条里唯一需要被读的数字 */
.fc-count-num {
  font-size: 15px;
  font-weight: 600;
  line-height: 1;
  color: var(--el-color-primary);
  font-family: ui-monospace, SFMono-Regular, monospace;
}
.fc-count-of {
  font-size: 11px;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
}
.fc-count-track {
  width: 72px;
  height: 4px;
  border-radius: var(--el-radius-full, 9999px);
  background: var(--el-fill-color);
  overflow: hidden;
}
.fc-count-fill {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--el-color-primary);
  transition: width 0.2s ease;
}
.fc-bar-ops {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-left: auto;
}
.dim {
  font-size: 11px;
  color: var(--el-text-color-secondary);
}
@media (prefers-reduced-motion: reduce) {
  .fc-count-fill {
    transition: none;
  }
}
</style>
