<!--
  采集结果字段定义：按流程 + 节点维护 collect_field。

  后端 /field/replace 是「整体替换」语义：保存某个节点时，先删该节点旧定义再写入本表内容。
  因此这里必须明确当前编辑的是哪个节点，不能让用户以为在改「全部字段」。节点下拉里的
  「流程级字段」对应后端 nodeId 为空，和节点字段是两组独立数据。

  字段名 / 列标题 / 类型 / 主键 / 长度 / 排序 / 显隐都由后端 CollectField 支持；
  保存后由调用方刷新结果表，列顺序与标题立即生效。
-->
<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { msgError, msgSuccess, msgWarning } from "@repo/core";
import ReButton from "@repo/ui/re-button";
import ReDialog from "@repo/ui/re-dialog";
import ReInput from "@repo/ui/re-input";
import ReInputNumber from "@repo/ui/re-input-number";
import ReSelect from "@repo/ui/re-select";
import type { ReOption } from "@repo/ui/re-select";
import { fetchFields, getFlow, replaceFields } from "../api/collectApi";
import { errText } from "../composables/useCollectView";
import type { CollectFieldDef, CollectNode } from "../types/collect";

const props = defineProps<{
  modelValue: boolean;
  flowId?: number | null;
}>();

const emit = defineEmits<{
  (event: "update:modelValue", value: boolean): void;
  (event: "saved"): void;
}>();

interface EditableField {
  collectFieldName: string;
  collectFieldLabel: string;
  collectFieldType: string;
  collectFieldPrimary: number;
  collectFieldLength: number;
  collectFieldSort: number;
  collectFieldEnabled: number;
}

const TYPE_OPTIONS: ReOption[] = [
  { label: "STRING", value: "STRING" },
  { label: "INT", value: "INT" },
  { label: "LONG", value: "LONG" },
  { label: "DECIMAL", value: "DECIMAL" },
  { label: "DATE", value: "DATE" },
  { label: "TEXT", value: "TEXT" },
];

const PRIMARY_OPTIONS: ReOption[] = [
  { label: "否", value: 0 },
  { label: "是", value: 1 },
];

const ENABLED_OPTIONS: ReOption[] = [
  { label: "显示", value: 1 },
  { label: "隐藏", value: 0 },
];

const loading = ref(false);
const saving = ref(false);
const nodes = ref<CollectNode[]>([]);
const selectedNode = ref("");
const fields = ref<EditableField[]>([]);

/** nodeId 为空是流程级字段，和具体节点字段分开维护 */
const nodeOptions = computed<ReOption[]>(() => [
  { label: "流程级字段（不绑定节点）", value: "" },
  ...nodes.value.map(node => ({
    label: `${node.name || node.id}（${node.id}）`,
    value: node.id,
  })),
]);

const selectedNodeLabel = computed(
  () => nodeOptions.value.find(item => item.value === selectedNode.value)?.label ?? "流程级字段",
);

function toEditable(field: CollectFieldDef, index: number): EditableField {
  return {
    collectFieldName: field.collectFieldName ?? "",
    collectFieldLabel: field.collectFieldLabel ?? "",
    collectFieldType: field.collectFieldType || "STRING",
    collectFieldPrimary: Number(field.collectFieldPrimary ?? 0),
    collectFieldLength: Number(field.collectFieldLength ?? 0),
    collectFieldSort: Number(field.collectFieldSort ?? index),
    collectFieldEnabled: Number(field.collectFieldEnabled ?? 1),
  };
}

async function loadFields(): Promise<void> {
  if (!props.flowId) {
    fields.value = [];
    return;
  }
  loading.value = true;
  try {
    const rows = await fetchFields(props.flowId, selectedNode.value || undefined);
    fields.value = (rows ?? []).map(toEditable);
  } catch (error) {
    fields.value = [];
    msgError(errText(error));
  } finally {
    loading.value = false;
  }
}

/** 打开时重新取流程节点与当前字段，避免沿用上一次弹窗的脏状态 */
watch(
  () => [props.modelValue, props.flowId] as const,
  async ([visible, flowId]) => {
    if (!visible || !flowId) {
      return;
    }
    selectedNode.value = "";
    loading.value = true;
    try {
      const flow = await getFlow(flowId);
      nodes.value = flow.dsl?.nodes ?? [];
      await loadFields();
    } catch (error) {
      nodes.value = [];
      fields.value = [];
      msgError(errText(error));
    } finally {
      loading.value = false;
    }
  },
  { immediate: true },
);

/** 切节点只换当前编辑集合，不自动保存，避免误删另一个节点的字段 */
watch(selectedNode, () => {
  if (props.modelValue) {
    void loadFields();
  }
});

function addField(): void {
  fields.value.push({
    collectFieldName: "",
    collectFieldLabel: "",
    collectFieldType: "STRING",
    collectFieldPrimary: 0,
    collectFieldLength: 0,
    collectFieldSort: fields.value.length,
    collectFieldEnabled: 1,
  });
}

function removeField(index: number): void {
  fields.value.splice(index, 1);
}

async function save(): Promise<void> {
  if (!props.flowId) {
    return;
  }
  const names = new Set<string>();
  for (const field of fields.value) {
    const name = field.collectFieldName.trim();
    if (!name) {
      msgWarning("字段名不能为空");
      return;
    }
    if (names.has(name)) {
      msgWarning(`字段名重复：${name}`);
      return;
    }
    names.add(name);
  }
  saving.value = true;
  try {
    await replaceFields({
      collectFlowId: props.flowId,
      collectNodeId: selectedNode.value || null,
      fields: fields.value.map((field) => ({
        collectFieldName: field.collectFieldName.trim(),
        collectFieldLabel: field.collectFieldLabel.trim() || null,
        collectFieldType: field.collectFieldType || "STRING",
        collectFieldPrimary: field.collectFieldPrimary ? 1 : 0,
        collectFieldLength: Number(field.collectFieldLength) || 0,
        collectFieldSort: Number(field.collectFieldSort) || 0,
        collectFieldEnabled: field.collectFieldEnabled ? 1 : 0,
      })),
    });
    msgSuccess(`已保存「${selectedNodeLabel.value}」的字段定义`);
    emit("saved");
    emit("update:modelValue", false);
  } catch (error) {
    msgError(errText(error));
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <ReDialog
    :model-value="modelValue"
    title="字段定义"
    :width="980"
    :close-on-click-modal="false"
    :loading="loading"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="field-def">
      <div class="field-def__toolbar">
        <span class="field-def__label">节点</span>
        <ReSelect
          v-model="selectedNode"
          style="width: 340px"
          :options="nodeOptions"
          filterable
          placeholder="选择要维护的节点"
        />
        <span class="field-def__hint">
          保存会整体替换该节点的字段定义；切换节点不会自动保存。
        </span>
        <span class="field-def__spacer" />
        <ReButton icon="Plus" layout="square" size="small" tip="新增字段" @click="addField" />
      </div>

      <div v-if="fields.length" class="field-def__table-wrap">
        <table class="field-def__table">
          <thead>
            <tr>
              <th class="field-def__col-name">字段名</th>
              <th class="field-def__col-label">列标题</th>
              <th class="field-def__col-type">类型</th>
              <th class="field-def__col-primary">主键</th>
              <th class="field-def__col-length">长度</th>
              <th class="field-def__col-enabled">显隐</th>
              <th class="field-def__col-sort">排序</th>
              <th class="field-def__col-action">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(field, index) in fields" :key="index">
              <td>
                <ReInput v-model="field.collectFieldName" placeholder="必填，唯一" maxlength="128" />
              </td>
              <td>
                <ReInput v-model="field.collectFieldLabel" placeholder="默认同字段名" maxlength="128" />
              </td>
              <td>
                <ReSelect v-model="field.collectFieldType" :options="TYPE_OPTIONS" style="width: 100%" />
              </td>
              <td>
                <ReSelect v-model="field.collectFieldPrimary" :options="PRIMARY_OPTIONS" style="width: 100%" />
              </td>
              <td>
                <ReInputNumber
                  v-model="field.collectFieldLength"
                  :min="0"
                  :max="65535"
                  controls-position="right"
                  style="width: 100%"
                />
              </td>
              <td>
                <ReSelect v-model="field.collectFieldEnabled" :options="ENABLED_OPTIONS" style="width: 100%" />
              </td>
              <td>
                <ReInputNumber
                  v-model="field.collectFieldSort"
                  :min="0"
                  :max="9999"
                  controls-position="right"
                  style="width: 100%"
                />
              </td>
              <td class="field-def__action">
                <ReButton
                  icon="Delete"
                  type="danger"
                  layout="square"
                  size="small"
                  tip="删除该字段"
                  @click="removeField(index)"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-else class="field-def__empty">
        当前节点还没有字段定义。可从节点执行结果自动登记，也可以点右上角「新增字段」手工补。
      </div>

      <p class="field-def__tip">
        字段名用于结果列和落库列，列标题只影响展示；主键字段用于同键覆盖写入。长度 0 表示使用默认长度。
      </p>
    </div>
    <template #footer>
      <ReButton type="primary" :loading="saving" @click="save">保存</ReButton>
    </template>
  </ReDialog>
</template>

<style scoped>
.field-def {
  display: flex;
  flex-direction: column;
  gap: var(--gap-md, 12px);
}

.field-def__toolbar {
  display: flex;
  align-items: center;
  gap: var(--gap-sm, 8px);
  flex-wrap: wrap;
}

.field-def__label {
  color: var(--text-secondary);
  white-space: nowrap;
}

.field-def__hint {
  color: var(--text-secondary);
  font-size: 12px;
}

.field-def__spacer {
  flex: 1;
}

.field-def__table-wrap {
  overflow-x: auto;
  border: 1px solid var(--border-color, #e4e7ed);
  border-radius: var(--radius-md, 8px);
}

.field-def__table {
  width: 100%;
  min-width: 960px;
  border-collapse: collapse;
}

.field-def__table th,
.field-def__table td {
  padding: 8px;
  border-bottom: 1px solid var(--border-color, #e4e7ed);
  text-align: left;
  vertical-align: middle;
}

.field-def__table th {
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 500;
  background: var(--fill-color-light, #f7f8fa);
}

.field-def__table tbody tr:last-child td {
  border-bottom: none;
}

.field-def__col-name,
.field-def__col-label {
  min-width: 150px;
}

.field-def__col-type {
  width: 120px;
}

.field-def__col-primary,
.field-def__col-enabled {
  width: 96px;
}

.field-def__col-length {
  width: 120px;
}

.field-def__col-sort {
  width: 100px;
}

.field-def__col-action {
  width: 64px;
  text-align: center !important;
}

.field-def__action {
  text-align: center !important;
}

.field-def__empty {
  padding: 28px 12px;
  color: var(--text-secondary);
  text-align: center;
  border: 1px dashed var(--border-color, #e4e7ed);
  border-radius: var(--radius-md, 8px);
}

.field-def__tip {
  margin: 0;
  color: var(--text-secondary);
  font-size: 12px;
  line-height: 1.6;
}
</style>
