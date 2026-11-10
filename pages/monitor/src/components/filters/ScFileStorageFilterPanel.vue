<script setup lang="ts">
/**
 * ServerFilter 专用配置面板 —— FileStorageServerFilter（文件服务器）。
 *
 * 与通用 schema 表单的区别：把参数按「访问控制 / 目录列表页 / 图片与水印」分区编排，
 * 字段来源仍是后端 schema（新增字段会自动落到「其它参数」分区，不会丢配置）。
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
  { title: '访问控制', desc: '决定哪些文件操作放行；关掉预览即无法在浏览器里看到图片', keys: ['openPreview', 'openDownload', 'openRange', 'openRemoteFile', 'openWebjars'] },
  { title: '目录列表页', desc: '目录页的展示形态与列信息', keys: ['layout', 'layoutType', 'showFormat', 'showSize', 'showTime'] },
  { title: '图片与水印', desc: '图片渲染处理与水印叠加', keys: ['imageFilter', 'watermark', 'openWatermark'] },
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
  </div>
</template>

<style scoped lang="scss">
.fc-panels {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
</style>
