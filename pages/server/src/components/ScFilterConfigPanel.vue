<script setup lang="ts">
/**
 * ServerFilter 配置面板 —— 按过滤器类型分派到各自的专用组件。
 *
 * 本组件只负责三件事：
 *   1. 插件头部（元数据 / 前提 / 已调整项数 / 深度查看入口）；
 *   2. 按 filterType 从注册表解析配置组件（filters/index.ts），未注册则用通用 schema 表单；
 *   3. 底部「热更新参数」——运行中调用后端 /filters/{index}/params 就地生效，服务不中断。
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
      </div>
      <div class="fc-desc">{{ meta?.desc || '未找到该插件的元数据，按通用参数渲染' }}</div>
      <div v-if="meta?.require" class="fc-require">前提：{{ meta.require }}</div>
      <div class="fc-meta">
        <span class="dim">共 {{ schema.length }} 个参数，已调整 {{ configuredCount }} 项</span>
        <ReButton
          v-if="hasFilterDetail(meta)"
          icon="TopRight"
          layout="square"
          type="primary"
          :tip="meta?.detailLabel || '查看详情'"
          @click="emit('open-detail-page')"
        />
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

    <!-- 热更新 -->
    <div class="fc-actions">
      <ReButton
        show-text
        icon="Lightning"
        type="primary"
        :loading="applying"
        @click="onApply"
      >热更新参数</ReButton>
      <span class="dim">运行中调用过滤器 updateConfig 就地生效，服务不中断；未运行时随下次启动生效</span>
    </div>
  </div>
</template>

<style scoped lang="scss">
/* 本面板原先整套用 pages/server/src/styles/tokens.css 的私有令牌（--text-primary /
   --text-secondary --text-tertiary / --brand-500 / --warning-600），而那份 tokens.css
   只有 :root、没有暗色变体，暗色模式下这些值全部停留在亮色。上面已统一改走 EP 语义令牌。 */
.filter-config {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.fc-head {
  display: flex;
  flex-direction: column;
  gap: 6px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-lg, 12px);
  padding: 14px 16px;
}
.fc-title {
  display: flex;
  align-items: center;
  gap: 8px;
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
.fc-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.fc-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  /* 生效操作区独立成卡：与上方参数卡片区分，避免「保存按钮」混在参数中间找不着 */
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-lg, 12px);
  padding: 12px 16px;
}
.dim {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
</style>
