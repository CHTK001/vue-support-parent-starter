<script setup lang="ts">
/**
 * ServerFilter 专用配置面板 —— RequestRewriteServerFilter（请求改写）。
 *
 * <p>三种改写能力：路径前缀（stripPrefix / addPrefix）、请求头（setHeader.x /
 * removeHeader.x）、路径变量捕获（pathVar.x）。后两类是「前缀键」配置 ——
 * schema 里只声明 stripPrefix / addPrefix 两项，前缀键不下发，通用表单排不出关联。</p>
 *
 * <p>这里按「行文本」呈现：setHeader 与 pathVar 是「名 = 值」一行一条，
 * removeHeader 是名字列表。所有编辑立即解析回写为 {@code setHeader.} /
 * {@code removeHeader.} / {@code pathVar.} 前缀键，与后端 {@code init} 的
 * 前缀解析严格对应；面板不保存编辑态，全部由 modelValue 派生，切换节点 / 重置
 * 参数天然一致，也不会有「逐字符改名导致输入框重建、光标丢失」的问题。</p>
 *
 * <p>字段来源仍是后端 schema（新增字段自动落到「其它参数」分区，不会丢配置）。</p>
 */
import { computed, ref } from 'vue';
import ReInput from '@repo/ui/re-input';
import ReButton from '@repo/ui/re-button';
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

const HEADER_PREFIX = 'setHeader.';
const REMOVE_PREFIX = 'removeHeader.';
const PATHVAR_PREFIX = 'pathVar.';

/** 某前缀下的名字清单（去掉前缀） */
function namesOf(prefix: string): string[] {
  const m = props.modelValue ?? {};
  return Object.keys(m)
    .filter(k => k.startsWith(prefix) && k.length > prefix.length)
    .map(k => k.slice(prefix.length));
}

/** 某前缀反序列化成「每行一条」文本（带值 = 名 = 值，不带值 = 每行一个名字） */
function textOf(prefix: string, withValue: boolean): string {
  const m = props.modelValue ?? {};
  const lines: string[] = [];
  for (const k of Object.keys(m)) {
    if (k.startsWith(prefix) && k.length > prefix.length) {
      const name = k.slice(prefix.length);
      lines.push(withValue ? `${name} = ${m[k]}` : name);
    }
  }
  return lines.join('\n');
}

/** 编辑态全部派生自 modelValue，无本地副本 */
const setHeaderText = computed(() => textOf(HEADER_PREFIX, true));
const pathVarText = computed(() => textOf(PATHVAR_PREFIX, true));
const removeHeaderNames = computed(() => namesOf(REMOVE_PREFIX));
const setHeaderCount = computed(() => namesOf(HEADER_PREFIX).length);
const pathVarCount = computed(() => namesOf(PATHVAR_PREFIX).length);

/**
 * 解析行文本并按前缀回写 modelValue。
 *
 * <p>先清掉该前缀全部旧键再并入新行：编辑中被删掉的行不能残留。
 * 「名 = 值」只按第一个 {@code =} 切分（正则里可能含 =）；空行与 # 注释跳过。</p>
 */
function applyRows(prefix: string, withValue: boolean, text: string): void {
  const next: Record<string, string> = { ...(props.modelValue ?? {}) };
  for (const k of Object.keys(next)) {
    if (k.startsWith(prefix)) delete next[k];
  }
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    if (withValue) {
      const at = line.indexOf('=');
      if (at <= 0) continue;
      const name = line.slice(0, at).trim();
      const value = line.slice(at + 1).trim();
      if (name) next[`${prefix}${name}`] = value;
    } else if (line) {
      next[`${prefix}${line}`] = '';
    }
  }
  emit('update:modelValue', next);
}

/** 删除一条 removeHeader */
function dropRemove(name: string): void {
  const next = { ...(props.modelValue ?? {}) };
  delete next[`${REMOVE_PREFIX}${name}`];
  emit('update:modelValue', next);
}

/** 新增一条 removeHeader */
const newRemoveName = ref('');
function addRemove(): void {
  const name = newRemoveName.value.trim();
  if (!name || namesOf(REMOVE_PREFIX).includes(name)) return;
  emit('update:modelValue', { ...(props.modelValue ?? {}), [`${REMOVE_PREFIX}${name}`]: '' });
  newRemoveName.value = '';
}

/** 标量字段（stripPrefix / addPrefix）走 schema 行；其余新字段兜底 */
const schema = computed(() => props.meta?.params ?? []);
const scalarKeys = ['stripPrefix', 'addPrefix'];
const restFields = computed(() => schema.value.filter(f => !scalarKeys.includes(f.name)));

function setScalar(name: string, value: string): void {
  emit('update:modelValue', { ...(props.modelValue ?? {}), [name]: value });
}
</script>

<template>
  <div class="fc-panels">
    <ScFilterSectionCard
      title="路径"
      desc="路径前缀的裁剪与追加；stripPrefix 去掉最前 N 段，addPrefix 追加前缀"
      :count="2"
      :no="1"
    >
      <ScFilterFieldRow
        v-for="field in schema.filter(f => scalarKeys.includes(f.name))"
        :key="field.name"
        :field="field"
        :value="modelValue?.[field.name]"
        @update="(v: string) => setScalar(field.name, v)"
      />
    </ScFilterSectionCard>

    <ScFilterSectionCard
      title="设置请求头"
      desc="setHeader.<名>=值；转发时写入或覆盖请求头"
      :count="setHeaderCount"
      :no="2"
    >
      <div class="rw-textarea">
        <ReInput
          :model-value="setHeaderText"
          type="textarea"
          :rows="6"
          placeholder="每行一条：名 = 值&#10;X-Trace-Id = abc-123&#10;X-Env = dev"
          @update:model-value="(v: any) => applyRows(HEADER_PREFIX, true, String(v ?? ''))"
        />
        <div class="rw-note">每行一条：<code>头名 = 值</code>；空行与 <code>#</code> 开头的行会被忽略</div>
      </div>
    </ScFilterSectionCard>

    <ScFilterSectionCard
      title="删除请求头"
      desc="removeHeader.<名>；转发时剔除这些请求头"
      :count="removeHeaderNames.length"
      :no="3"
    >
      <div class="rw-rows">
        <div v-for="name in removeHeaderNames" :key="name" class="rw-row">
          <span class="rw-row-static">{{ name }}</span>
          <ReButton
            class="rw-row-del"
            icon="Delete"
            layout="square"
            type="danger"
            tip="删除这行"
            @click="dropRemove(name)"
          />
        </div>
        <div class="rw-row rw-row--new">
          <ReInput
            v-model="newRemoveName"
            class="rw-row-name"
            placeholder="新头名，如 Authorization"
            @keyup.enter="addRemove"
          />
          <ReButton icon="Plus" show-text type="primary" @click="addRemove">添加</ReButton>
        </div>
      </div>
    </ScFilterSectionCard>

    <ScFilterSectionCard
      title="路径变量捕获"
      desc="pathVar.<名>=正则；命中片段写入请求属性，可被下游 ServerHandler 读取"
      :count="pathVarCount"
      :no="4"
    >
      <div class="rw-textarea">
        <ReInput
          :model-value="pathVarText"
          type="textarea"
          :rows="6"
          placeholder="每行一条：名 = 正则&#10;id = (\d+)&#10;slug = [^/]+"
          @update:model-value="(v: any) => applyRows(PATHVAR_PREFIX, true, String(v ?? ''))"
        />
        <div class="rw-note">每行一条：<code>变量名 = 正则</code>；只按第一个「=」切分，正则里可含 =</div>
      </div>
    </ScFilterSectionCard>

    <ScFilterSectionCard
      v-if="restFields.length"
      title="其它参数"
      desc="后端新增、尚未归入语义分区的参数（不会丢配置）"
      :count="restFields.length"
      :no="5"
    >
      <ScFilterFieldRow
        v-for="field in restFields"
        :key="field.name"
        :field="field"
        :value="modelValue?.[field.name]"
        @update="(v: string) => setScalar(field.name, v)"
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

/* 行文本编辑区（setHeader / pathVar）：textarea 跨满整行，说明文字在下方 */
.rw-textarea {
  display: flex;
  flex-direction: column;
  gap: 6px;
  grid-column: 1 / -1;
  width: 100%;
}
.rw-note {
  font-size: 11px;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
}
.rw-note code {
  padding: 0 3px;
  font-family: var(--el-font-family-mono, monospace);
  background: var(--el-fill-color-light);
  border-radius: 3px;
}

/* removeHeader 行列表：静态名 + 删除按钮一行排开 */
.rw-rows {
  display: flex;
  flex-direction: column;
  gap: 6px;
  grid-column: 1 / -1;
  width: 100%;
}
.rw-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.rw-row--new {
  margin-top: 4px;
}
.rw-row-name {
  flex: 0 0 40%;
  min-width: 160px;
}
.rw-row-static {
  flex: 0 0 40%;
  min-width: 160px;
  padding: 0 11px;
  height: 32px;
  line-height: 32px;
  font-size: 13px;
  font-family: ui-monospace, SFMono-Regular, monospace;
  color: var(--el-text-color-primary);
  background: var(--el-fill-color-lighter);
  border-radius: var(--el-radius-sm, 6px);
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.rw-row-del {
  flex-shrink: 0;
}
</style>