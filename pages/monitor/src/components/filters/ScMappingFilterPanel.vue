<script setup lang="ts">
/**
 * URL 映射类过滤器的配置面板（url-mapping / shell-url-mapping）。
 *
 * <p>这类插件的参数是「一张映射表」，用通用 schema 表单排出来会变成一堆孤立输入框。
 * 这里按「规则行」呈现：key → value 一行一条，空行忽略；参数名仍以后端 schema 为准，
 * 因此新增规则键不用改组件。</p>
 *
 * <p>两种类型只差文案：url-mapping 是路径→处理器，shell-url-mapping 是命令→处理器。</p>
 */
import { computed } from 'vue';
import ReInput from '@repo/ui/re-input';
import type { FilterTypeMeta } from '../../api';

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

/** 两种映射的差异只在文案与占位示例 */
const copy = computed(() =>
  props.filterType === 'shell-url-mapping'
    ? {
        title: 'Shell 命令映射',
        hint: '左侧填命令（含参数占位），右侧填处理器标识；留空的行会被忽略',
        example: 'ls -al = listingHandler',
      }
    : {
        title: 'URL 路径映射',
        hint: '左侧填路径（支持 {var} 与 {var:regex}），右侧填处理器标识；留空的行会被忽略',
        example: '/api/users/{id} = userHandler',
      },
);

/**
 * 把参数对象转成「键 = 值」多行文本，便于整体编辑。
 */
const rowsText = computed(() =>
  Object.entries(props.modelValue || {})
    .map(([k, v]) => `${k} = ${v}`)
    .join('\n'),
);

/** 规则条数 */
const ruleCount = computed(() => Object.keys(props.modelValue || {}).length);

/**
 * 解析多行文本并写回参数对象。
 *
 * <p>只按第一个 `=` 切分，右侧允许出现 `=`（命令里常见）；空行与无 `=` 的行直接跳过。
 *
 * @param text 多行文本
 */
function applyRows(text: string): void {
  const next: Record<string, string> = {};
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const at = trimmed.indexOf('=');
    if (at <= 0) continue;
    const key = trimmed.slice(0, at).trim();
    const value = trimmed.slice(at + 1).trim();
    if (key) next[key] = value;
  }
  emit('update:modelValue', next);
}
</script>

<template>
  <div class="mapping-panel">
    <header class="mapping-head">
      <span class="mapping-title">{{ copy.title }}</span>
      <span class="mapping-hint">{{ copy.hint }}</span>
    </header>

    <ReInput
      :model-value="rowsText"
      type="textarea"
      :rows="10"
      :placeholder="`每行一条：${copy.example}`"
      @update:model-value="(v: any) => applyRows(String(v))"
    />

    <footer class="mapping-foot">
      <span>已配置 {{ ruleCount }} 条规则</span>
      <span class="mapping-note">支持 <code>{var}</code>、<code>{var:regex}</code>；空行与 # 开头的行会被忽略</span>
    </footer>
  </div>
</template>

<style scoped lang="scss">
.mapping-panel {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px 14px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-lg, 12px);
}

.mapping-head {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.mapping-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.mapping-hint {
  font-size: 11px;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
}

.mapping-foot {
  display: flex;
  gap: 10px;
  align-items: baseline;
  justify-content: space-between;
  flex-wrap: wrap;
  font-size: 11px;
  color: var(--el-text-color-secondary);
}

.mapping-note {
  color: var(--el-text-color-placeholder);
}

.mapping-note code {
  padding: 0 3px;
  font-family: var(--el-font-family-mono, monospace);
  background: var(--el-fill-color-light);
  border-radius: 3px;
}
</style>
