<script setup lang="ts">
/**
 * ServerFilter 通用配置面板 —— 未注册专用组件的过滤器走这里。
 *
 * 完全由后端 /filters 下发的 params schema 驱动：
 * boolean → 开关，enum → 下拉，string → 输入框。
 * 因此新增插件无需改前端（在 filters/index.ts 注册专用组件才会走专属页面）。
 */
import { computed } from 'vue';
import type { FilterParamSchema, FilterTypeMeta } from '../../api';
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

/** 参数 schema */
const schema = computed(() => props.meta?.params ?? []);

/**
 * 按字段语义类型的分区定义。
 *
 * 专用面板（file-storage / service-discovery）按字段名声明分区，因为它们的字段集是已知的；
 * 通用面板面对的是尚未注册的插件，字段名无从预知，但字段 type 一定可判定，
 * 故按 type 分区 —— 任意新插件进来都能得到一份排版整齐的表单。
 */
const TYPE_GROUPS: Array<{ title: string; desc: string; types: string[] }> = [
  { title: '开关类', desc: '布尔开关，留空视为开', types: ['boolean'] },
  { title: '枚举选择', desc: 'schema 限定了候选值，从下拉选择', types: ['enum'] },
  { title: '文本与数值', desc: '自由填写，按 schema 默认值生效', types: ['string', 'number', 'text'] },
];

/** 取属于指定语义类型的字段（保留 schema 原顺序） */
function fieldsOfType(types: string[]): FilterParamSchema[] {
  return schema.value.filter(f => types.includes(String(f.type)));
}

/** 未被任何分区认领的字段（schema 声明了未知 type） */
const restFields = computed(() => {
  const known = TYPE_GROUPS.flatMap(g => g.types);
  return schema.value.filter(f => !known.includes(String(f.type)));
});

/** 写入单个参数 */
function set(name: string, value: string) {
  emit('update:modelValue', { ...(props.modelValue ?? {}), [name]: value });
}
</script>

<template>
  <div class="fc-panels">
    <div v-if="!schema.length" class="fsc fsc--empty">
      <div class="fsc-empty-text">
        该插件未声明参数 schema，可直接保存；如需传参请改用「ServerFilter 全限定类名」并在参数中补充。
      </div>
    </div>

    <template v-else>
      <!-- 按字段「语义类型」自动分区：开关 / 枚举 / 文本。
           不按字段名硬编码分区是通用面板的关键——它服务于尚未注册专用组件的插件，
           前端不可能预先知道这些插件会声明哪些字段，但一定能判定出字段类型。 -->
      <ScFilterSectionCard
        v-for="(group, i) in TYPE_GROUPS"
        :key="group.title"
        :title="group.title"
        :desc="group.desc"
        :count="fieldsOfType(group.types).length"
        :no="i + 1"
      >
        <ScFilterFieldRow
          v-for="field in fieldsOfType(group.types)"
          :key="field.name"
          :field="field"
          :value="modelValue?.[field.name]"
          @update="(v: string) => set(field.name, v)"
        />
      </ScFilterSectionCard>

      <!-- schema 声明了未识别 type 的字段：归到最后一区，保证不丢配置 -->
      <ScFilterSectionCard
        v-if="restFields.length"
        title="其它参数"
        desc="schema 声明了未识别类型的字段，按文本处理"
        :count="restFields.length"
        :no="TYPE_GROUPS.length + 1"
      >
        <ScFilterFieldRow
          v-for="field in restFields"
          :key="field.name"
          :field="field"
          :value="modelValue?.[field.name]"
          @update="(v: string) => set(field.name, v)"
        />
      </ScFilterSectionCard>
    </template>
  </div>
</template>

<style scoped lang="scss">
.fc-panels {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
/* 无 schema 时的空态卡片：与有参卡片同宽同圆角，避免出现一块异形灰区 */
.fsc--empty {
  background: var(--el-bg-color);
  border: 1px dashed var(--el-border-color);
  border-radius: var(--el-radius-lg, 12px);
  padding: 16px;
}
.fsc-empty-text {
  font-size: 12px;
  line-height: 1.7;
  color: var(--el-text-color-secondary);
}
</style>
