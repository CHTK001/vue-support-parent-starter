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
const SECTIONS: Array<{ title: string; keys: string[] }> = [
  { title: '访问控制', keys: ['openPreview', 'openDownload', 'openRange', 'openRemoteFile', 'openWebjars'] },
  { title: '目录列表页', keys: ['layout', 'layoutType', 'showFormat', 'showSize', 'showTime'] },
  { title: '图片与水印', keys: ['imageFilter', 'watermark', 'openWatermark'] },
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
    <div v-for="section in SECTIONS" :key="section.title" class="fc-section panel">
      <div class="fc-section-title">{{ section.title }}</div>
      <div class="fc-grid">
        <ScFilterFieldRow
          v-for="field in fieldsOf(section.keys)"
          :key="field.name"
          :field="field"
          :value="modelValue?.[field.name]"
          @update="(v: string) => set(field.name, v)"
        />
      </div>
    </div>

    <div v-if="restFields.length" class="fc-section panel">
      <div class="fc-section-title">其它参数</div>
      <div class="fc-grid">
        <ScFilterFieldRow
          v-for="field in restFields"
          :key="field.name"
          :field="field"
          :value="modelValue?.[field.name]"
          @update="(v: string) => set(field.name, v)"
        />
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.fc-panels {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.fc-section-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin-bottom: 12px;
  padding-left: 8px;
  border-left: 3px solid var(--el-color-primary);
  line-height: 1.2;
}
.fc-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 12px 20px;
}
</style>
