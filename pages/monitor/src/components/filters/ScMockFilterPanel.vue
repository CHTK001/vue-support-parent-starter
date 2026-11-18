<script setup lang="ts">
/**
 * ServerFilter 专用配置面板 —— MockServerFilter（Mock 响应打桩）。
 *
 * <p>规则的真正解析在后端（路径匹配 + 状态码 / content-type / 响应体）；
 * 这里只把「每行一条规则」的多行文本与兜底状态码整理成表单。</p>
 *
 * <p>字段来源仍是后端 schema（新增字段自动落到「其它参数」分区，不会丢配置）。</p>
 */
import { computed } from 'vue';
import ReInput from '@repo/ui/re-input';
import ReInputNumber from '@repo/ui/re-input-number';
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

/** 规则行：路径 = 状态码|content-type|响应体 */
const rulesText = computed(() => props.modelValue?.rules ?? '');

/** 已填规则条数（非空行，忽略 # 注释） */
const ruleCount = computed(() =>
  String(rulesText.value)
    .split(/\r?\n/)
    .map(s => s.trim())
    .filter(s => s && !s.startsWith('#')).length,
);

/** 兜底状态码 */
const defaultStatus = computed(() => Number(props.modelValue?.defaultStatus ?? 404));

function patch(key: string, value: string): void {
  emit('update:modelValue', { ...(props.modelValue ?? {}), [key]: value });
}

/** 其余字段（后端新增的，走通用 schema 行） */
const schema = computed(() => props.meta?.params ?? []);
const handledKeys = ['rules', 'defaultStatus'];
const restFields = computed(() => schema.value.filter(f => !handledKeys.includes(f.name)));
</script>

<template>
  <div class="fc-panels">
    <ScFilterSectionCard
      title="Mock 规则"
      desc="每行一条：路径 = 状态码|content-type|响应体；命中后不再转发"
      :count="ruleCount"
      :no="1"
    >
      <div class="mock-rules">
        <ReInput
          :model-value="rulesText"
          type="textarea"
          :rows="10"
          placeholder="每行一条：&#10;/api/demo = 200|application/json|{&#34;ok&#34;:true}&#10;/api/users/* = 404|text/plain|not found"
          class="mock-rules-input"
          @update:model-value="(v: any) => patch('rules', String(v ?? ''))"
        />
        <div class="mock-rules-note">
          路径支持 <code>/a/b</code> 精确、<code>/a/*</code> 单段通配、<code>/a/**</code> 任意深度；
          空行与 <code>#</code> 开头的行会被忽略。
        </div>
      </div>
    </ScFilterSectionCard>

    <ScFilterSectionCard
      title="未命中兜底"
      desc="没有匹配到任何规则时的响应状态码"
      :count="1"
      :no="2"
    >
      <label class="mock-status">
        <span>默认状态码</span>
        <ReInputNumber
          :model-value="defaultStatus"
          :min="100"
          :max="599"
          :step="1"
          style="width: 100%"
          @update:model-value="(v: any) => patch('defaultStatus', String(v ?? 404))"
        />
      </label>
    </ScFilterSectionCard>

    <ScFilterSectionCard
      v-if="restFields.length"
      title="其它参数"
      desc="后端新增、尚未归入语义分区的参数（不会丢配置）"
      :count="restFields.length"
      :no="3"
    >
      <ScFilterFieldRow
        v-for="field in restFields"
        :key="field.name"
        :field="field"
        :value="modelValue?.[field.name]"
        @update="(v: string) => patch(field.name, v)"
      />
    </ScFilterSectionCard>
  </div>
</template>

<style scoped lang="scss">
.fc-panels {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* 规则编辑区：textarea 跨满整行，说明文字在下方 */
.mock-rules {
  display: flex;
  flex-direction: column;
  gap: 6px;
  grid-column: 1 / -1;
}
.mock-rules-input {
  width: 100%;
}
.mock-rules-note {
  font-size: 11px;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
}
.mock-rules-note code,
.mock-status code {
  padding: 0 3px;
  font-family: var(--el-font-family-mono, monospace);
  background: var(--el-fill-color-light);
  border-radius: 3px;
}

/* 兜底状态码：单字段，标签 + 数字输入纵向堆叠，与其它面板的字段密度一致 */
.mock-status {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 12px;
  color: var(--el-text-color-primary);
}
</style>