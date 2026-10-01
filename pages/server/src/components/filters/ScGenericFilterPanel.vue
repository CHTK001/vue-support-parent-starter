<script setup lang="ts">
/**
 * ServerFilter 通用配置面板 —— 未注册专用组件的过滤器走这里。
 *
 * 完全由后端 /filters 下发的 params schema 驱动：
 * boolean → 开关，enum → 下拉，string → 输入框。
 * 因此新增插件无需改前端（在 filters/index.ts 注册专用组件才会走专属页面）。
 */
import { computed } from 'vue';
import type { FilterTypeMeta } from '../../api';
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

/** 参数 schema */
const schema = computed(() => props.meta?.params ?? []);

/** 写入单个参数 */
function set(name: string, value: string) {
  emit('update:modelValue', { ...(props.modelValue ?? {}), [name]: value });
}
</script>

<template>
  <div class="fc-section panel">
    <div class="fc-section-title">参数配置</div>
    <div v-if="!schema.length" class="fc-empty">
      该插件未声明参数 schema，可直接保存；如需传参请改用「ServerFilter 全限定类名」并在参数中补充。
    </div>
    <div v-else class="fc-grid">
      <ScFilterFieldRow
        v-for="field in schema"
        :key="field.name"
        :field="field"
        :value="modelValue?.[field.name]"
        @update="(v: string) => set(field.name, v)"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">
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
.fc-empty {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  line-height: 1.7;
}
</style>
