<script setup lang="ts">
/**
 * ServerFilter 专用配置面板 —— CircuitBreakerServerFilter（熔断）。
 *
 * <p>参数按「触发 → 恢复」语义分区；真正的三态判定（闭合/打开/半开）在后端，
 * 前端不重复实现，只在底部的状态机卡片里把每一态的触发条件讲清楚。</p>
 *
 * <p>字段来源仍是后端 schema（新增字段自动落到「其它参数」分区，不会丢配置）。</p>
 */
import { computed } from 'vue';
import type { FilterTypeMeta, FilterParamSchema } from '../../api';
import ScFilterFieldRow from './ScFilterFieldRow.vue';
import ScFilterSectionCard from './ScFilterSectionCard.vue';

const props = defineProps<{
  /** 插件元数据 */
  meta: FilterTypeMeta | null;
  /** 该实例的过滤器类型 */
  filterType: string;
  /** 当前参数（v-model） */
  modelValue: Record<string, string>;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: Record<string, string>): void;
}>();

/** 参数分区（字段名来自后端 schema） */
const SECTIONS: Array<{ title: string; desc: string; keys: string[] }> = [
  { title: '熔断判定', desc: '触发条件与恢复窗口；连续失败达到阈值即打开熔断器，窗口过后进入半开试探', keys: ['failureThreshold', 'openMs'] },
  { title: '豁免状态码', desc: '这些响应码不计入失败，例如 404,429；留空表示全部响应码都计入失败', keys: ['ignoreStatuses'] },
];

const schema = computed(() => props.meta?.params ?? []);

/** 已归入分区的字段名 */
const groupedKeys = computed(() => new Set(SECTIONS.flatMap(s => s.keys)));

/** 专属分区中 schema 实际声明了的字段（后端没声明的字段不渲染） */
function fieldsOf(keys: string[]): FilterParamSchema[] {
  return keys
    .map(k => schema.value.find(f => f.name === k))
    .filter((f): f is FilterParamSchema => Boolean(f));
}

/** schema 里新增但未归入分区的字段 */
const restFields = computed(() => schema.value.filter(f => !groupedKeys.value.has(f.name)));

/** 写入单个参数 */
function set(name: string, value: string) {
  emit('update:modelValue', { ...(props.modelValue ?? {}), [name]: value });
}

/** 熔断三态说明（只讲语义，判定逻辑在后端） */
const STATES = [
  { name: '闭合', desc: '正常转发；连续失败达到阈值后打开' },
  { name: '打开', desc: '不再转发、直接快速失败；openMs 毫秒后进入半开' },
  { name: '半开', desc: '试探性放行一个请求：成功则闭合，失败则重新打开' },
];
</script>

<template>
  <div class="fc-panels">
    <ScFilterSectionCard
      v-for="(section, i) in SECTIONS"
      :key="section.title"
      :title="section.title"
      :desc="section.desc"
      :count="fieldsOf(section.keys).length"
      :no="i + 1"
    >
      <ScFilterFieldRow
        v-for="field in fieldsOf(section.keys)"
        :key="field.name"
        :field="field"
        :value="modelValue?.[field.name]"
        @update="(v: string) => set(field.name, v)"
      />
    </ScFilterSectionCard>

    <ScFilterSectionCard
      v-if="restFields.length"
      title="其它参数"
      desc="后端新增、尚未归入语义分区的参数（不会丢配置）"
      :count="restFields.length"
      :no="SECTIONS.length + 1"
    >
      <ScFilterFieldRow
        v-for="field in restFields"
        :key="field.name"
        :field="field"
        :value="modelValue?.[field.name]"
        @update="(v: string) => set(field.name, v)"
      />
    </ScFilterSectionCard>

    <ScFilterSectionCard
      title="熔断状态机"
      desc="三态循环：闭合 → 打开 → 半开 → 闭合；下游不可用时避免雪崩"
      :no="SECTIONS.length + (restFields.length ? 2 : 1)"
    >
      <div class="cb-states">
        <div v-for="(s, i) in STATES" :key="s.name" class="cb-state">
          <span class="cb-state-no">{{ i + 1 }}</span>
          <div class="cb-state-body">
            <div class="cb-state-name">{{ s.name }}</div>
            <div class="cb-state-desc">{{ s.desc }}</div>
          </div>
        </div>
      </div>
    </ScFilterSectionCard>
  </div>
</template>

<style scoped lang="scss">
.fc-panels {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* 状态机三态：横排三格，编号 + 名称 + 说明；grid 栅格内跨满整行 */
.cb-states {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  grid-column: 1 / -1;
}
@media (max-width: 680px) {
  .cb-states {
    grid-template-columns: minmax(0, 1fr);
  }
}

.cb-state {
  display: flex;
  gap: 8px;
  padding: 8px 10px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-sm, 6px);
  background: var(--el-fill-color-lighter);
}

.cb-state-no {
  flex-shrink: 0;
  font-size: 11px;
  line-height: 1.5;
  letter-spacing: 0.04em;
  color: var(--el-color-primary);
  font-family: ui-monospace, SFMono-Regular, monospace;
}

.cb-state-body {
  min-width: 0;
}

.cb-state-name {
  font-size: 12px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.cb-state-desc {
  margin-top: 2px;
  font-size: 11px;
  line-height: 1.5;
  color: var(--el-text-color-secondary);
}
</style>