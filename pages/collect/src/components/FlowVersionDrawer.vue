<!--
  流程版本抽屉：版本列表 / 结构对比 / 回滚。

  后端 /flow-version/diff 只回两段原始 DSL（dsl1/dsl2），不做结构解析，所以差异在这里算：
  节点按 id、连线按 from→to 配对，给出「新增 / 删除 / 修改」与可读原因（类型、名称、参数、字段、连线条件）。
  不直接并排甩两段 JSON —— 流程图动辄上百节点，原始 JSON 对比看不出改了什么。

  只对已保存流程可用：父级（FlowView 工具栏）在画布有未保存改动时禁用入口，
  否则「回滚到 v3」会把画布上还没保存的改动静默覆盖。回滚成功后 emit("rolledback")，
  由父级重新拉流程详情刷新画布。
-->
<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { msgError, msgSuccess } from "@repo/core";
import ReButton from "@repo/ui/re-button";
import ReDrawer from "@repo/ui/re-drawer";
import ReSelect from "@repo/ui/re-select";
import ReTable from "@repo/ui/re-table";
import ReTag from "@repo/ui/re-tag";
import type { ReOption } from "@repo/ui/re-select";
import type { ReTableColumn } from "@repo/ui/re-table";
import { diffFlowVersions, listFlowVersions, rollbackFlowVersion } from "../api/collectApi";
import { confirmAction, errText } from "../composables/useCollectView";
import type { CollectDsl, CollectEdge, CollectFlowVersion, CollectNode } from "../types/collect";

const props = defineProps<{
  modelValue: boolean;
  flowId: number | null;
}>();

const emit = defineEmits<{
  (event: "update:modelValue", value: boolean): void;
  (event: "rolledback", versionNo: number): void;
}>();

/** 一条结构差异 */
interface ChangeRow {
  /** 新增 / 删除 / 修改 */
  kind: string;
  /** 节点 / 连线 */
  target: string;
  /** 节点ID 或 from → to */
  key: string;
  /** 可读原因 */
  detail: string;
}

const versions = ref<CollectFlowVersion[]>([]);
const loading = ref(false);
const failed = ref(false);
const v1 = ref<number | null>(null);
const v2 = ref<number | null>(null);
const comparing = ref(false);
const compared = ref(false);
const changes = ref<ChangeRow[]>([]);
const rolling = ref(false);

/** 请求序号：切流程/关抽屉时丢弃旧响应 */
let seq = 0;

const versionOptions = computed<ReOption[]>(() =>
  versions.value.map(item => ({
    label: `v${item.versionNo}${item.versionRemark ? ` · ${item.versionRemark}` : ""}`,
    value: Number(item.versionNo),
  })),
);

const summary = computed(() => {
  const count = (target: string, kind: string) =>
    changes.value.filter(item => item.target === target && item.kind === kind).length;
  return {
    nodeAdded: count("节点", "新增"),
    nodeRemoved: count("节点", "删除"),
    nodeChanged: count("节点", "修改"),
    edgeAdded: count("连线", "新增"),
    edgeRemoved: count("连线", "删除"),
    edgeChanged: count("连线", "修改"),
  };
});

const equal = computed(() => compared.value && changes.value.length === 0);

watch(
  () => [props.modelValue, props.flowId] as const,
  ([open]) => {
    if (open) {
      void load();
    }
  },
);

/** 打开即拉版本清单，默认对比「最新两版」 */
async function load(): Promise<void> {
  const mine = ++seq;
  loading.value = true;
  failed.value = false;
  compared.value = false;
  changes.value = [];
  try {
    const rows = props.flowId ? (await listFlowVersions(props.flowId)) ?? [] : [];
    if (mine !== seq) {
      return;
    }
    versions.value = rows;
    const latest = rows[0]?.versionNo ?? null;
    const previous = rows[1]?.versionNo ?? null;
    v2.value = latest;
    v1.value = previous;
  } catch (error) {
    if (mine === seq) {
      versions.value = [];
      failed.value = true;
      msgError(errText(error));
    }
  } finally {
    if (mine === seq) {
      loading.value = false;
    }
  }
}

const changeColumns: ReTableColumn[] = [
  { prop: "kind", label: "类型", width: 80, slot: "kind", align: "center" },
  { prop: "target", label: "对象", width: 76, align: "center" },
  { prop: "key", label: "标识", minWidth: 150, showOverflowTooltip: true },
  { prop: "detail", label: "说明", minWidth: 220, showOverflowTooltip: true },
];

const versionColumns: ReTableColumn[] = [
  { prop: "versionNo", label: "版本", width: 76, slot: "version" },
  { prop: "versionRemark", label: "说明", minWidth: 180, showOverflowTooltip: true },
  { prop: "createTime", label: "创建时间", width: 170 },
  { prop: "action", label: "操作", width: 96, slot: "action", align: "center" },
];

/**
 * 对比两个版本。
 *
 * 后端只回 DSL 文本，这里解析后按节点/连线配对；解析失败明确提示，不假装「没有差异」。
 */
async function compare(): Promise<void> {
  if (!props.flowId || v1.value == null || v2.value == null) {
    return;
  }
  if (v1.value === v2.value) {
    msgError("请选择两个不同的版本");
    return;
  }
  comparing.value = true;
  compared.value = false;
  try {
    const data = await diffFlowVersions(props.flowId, v1.value, v2.value);
    const left = parseDsl(data.dsl1);
    const right = parseDsl(data.dsl2);
    if (!left || !right) {
      msgError("版本内容不是合法的流程图，无法对比");
      changes.value = [];
      compared.value = true;
      return;
    }
    changes.value = buildChanges(left, right);
    compared.value = true;
  } catch (error) {
    msgError(errText(error));
  } finally {
    comparing.value = false;
  }
}

/**
 * 解析版本里的 DSL。
 *
 * @param text 版本正文
 * @returns 可对比的流程图；空串或坏 JSON 返回 null
 */
function parseDsl(text: string | null | undefined): CollectDsl | null {
  if (!text) {
    return null;
  }
  try {
    const parsed = JSON.parse(text) as CollectDsl;
    return Array.isArray(parsed?.nodes) ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * 计算两版结构差异。
 *
 * @param before 旧版
 * @param after  新版
 * @returns 差异行（按节点、连线顺序）
 */
function buildChanges(before: CollectDsl, after: CollectDsl): ChangeRow[] {
  const rows: ChangeRow[] = [];
  const oldNodes = new Map((before.nodes ?? []).map(node => [node.id, node]));
  const newNodes = new Map((after.nodes ?? []).map(node => [node.id, node]));

  for (const [id, node] of newNodes) {
    const old = oldNodes.get(id);
    if (!old) {
      rows.push({ kind: "新增", target: "节点", key: labelOf(node), detail: `类型 ${node.shape}` });
      continue;
    }
    const detail = nodeDiff(old, node);
    if (detail) {
      rows.push({ kind: "修改", target: "节点", key: labelOf(node), detail });
    }
  }
  for (const [id, node] of oldNodes) {
    if (!newNodes.has(id)) {
      rows.push({ kind: "删除", target: "节点", key: labelOf(node), detail: `类型 ${node.shape}` });
    }
  }

  const oldEdges = new Map((before.edges ?? []).map(edge => [edgeKey(edge), edge]));
  const newEdges = new Map((after.edges ?? []).map(edge => [edgeKey(edge), edge]));
  for (const [key, edge] of newEdges) {
    const old = oldEdges.get(key);
    if (!old) {
      rows.push({ kind: "新增", target: "连线", key, detail: edgeDetail(edge) });
      continue;
    }
    if ((old.condition ?? "") !== (edge.condition ?? "")
        || (old.exceptionFlow ?? "") !== (edge.exceptionFlow ?? "")) {
      rows.push({
        kind: "修改",
        target: "连线",
        key,
        detail: `条件 ${old.condition || "无"} → ${edge.condition || "无"}；异常流 ${old.exceptionFlow || "总是"} → ${edge.exceptionFlow || "总是"}`,
      });
    }
  }
  for (const [key, edge] of oldEdges) {
    if (!newEdges.has(key)) {
      rows.push({ kind: "删除", target: "连线", key, detail: edgeDetail(edge) });
    }
  }
  return rows;
}

/** 节点展示名：名称 + ID，改过名也能对上 */
function labelOf(node: CollectNode): string {
  return node.name ? `${node.name}（${node.id}）` : node.id;
}

/** 连线标识 */
function edgeKey(edge: CollectEdge): string {
  return `${edge.from} → ${edge.to}`;
}

/** 连线说明：条件与异常流向 */
function edgeDetail(edge: CollectEdge): string {
  return `条件 ${edge.condition || "无"}；异常流 ${edge.exceptionFlow || "总是"}`;
}

/**
 * 节点差异原因；无差异返回空串。
 *
 * @param before 旧节点
 * @param after  新节点
 */
function nodeDiff(before: CollectNode, after: CollectNode): string {
  const reasons: string[] = [];
  if (before.shape !== after.shape) {
    reasons.push(`类型 ${before.shape} → ${after.shape}`);
  }
  if ((before.name ?? "") !== (after.name ?? "")) {
    reasons.push(`名称 ${before.name || "空"} → ${after.name || "空"}`);
  }
  if (paramFingerprint(before) !== paramFingerprint(after)) {
    reasons.push("参数变化");
  }
  if (fieldFingerprint(before) !== fieldFingerprint(after)) {
    reasons.push("字段定义变化");
  }
  return reasons.join("；");
}

/** 参数指纹：与顺序无关，只为判等 */
function paramFingerprint(node: CollectNode): string {
  return [...(node.params ?? [])]
    .map(param => `${param.name}=${param.value ?? ""}`)
    .sort()
    .join("&");
}

/** 抽取字段指纹 */
function fieldFingerprint(node: CollectNode): string {
  return [...(node.fields ?? [])]
    .map(field => `${field.name}:${field.parserType ?? ""}:${field.expression ?? ""}:${field.attribute ?? ""}:${field.attrName ?? ""}`)
    .sort()
    .join("&");
}

/**
 * 回滚到指定版本。
 *
 * @param row 版本行
 */
async function rollback(row: CollectFlowVersion): Promise<void> {
  if (!props.flowId) {
    return;
  }
  if (!(await confirmAction(`确认回滚到 v${row.versionNo}？服务端会以该版本为准，并再记一版回滚记录。`, "回滚版本"))) {
    return;
  }
  rolling.value = true;
  try {
    const ok = await rollbackFlowVersion(props.flowId, row.versionNo);
    if (!ok) {
      msgError("回滚失败：版本或流程不存在");
      return;
    }
    msgSuccess(`已回滚到 v${row.versionNo}`);
    emit("rolledback", row.versionNo);
    await load();
  } catch (error) {
    msgError(errText(error));
  } finally {
    rolling.value = false;
  }
}
</script>

<template>
  <ReDrawer
    :model-value="modelValue"
    title="版本历史"
    :size="720"
    footer-hidden
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="version-body">
      <div v-if="loading" class="version-tip">正在读取版本…</div>
      <div v-else-if="failed" class="version-tip">
        <span>版本读取失败</span>
        <ReButton icon="RefreshRight" @click="load">重试</ReButton>
      </div>
      <template v-else-if="!versions.length">
        <div class="version-tip">这条流程还没有版本快照（保存一次流程后自动生成）</div>
      </template>

      <template v-else>
        <div class="version-compare">
          <ReSelect v-model="v1" :options="versionOptions" placeholder="对比基准" style="width: 220px"/>
          <span class="compare-arrow">→</span>
          <ReSelect v-model="v2" :options="versionOptions" placeholder="目标版本" style="width: 220px"/>
          <ReButton type="primary" icon="Switch" :loading="comparing" @click="compare">对比</ReButton>
        </div>

        <div v-if="compared" class="version-summary">
          <template v-if="equal">
            <span class="summary-equal">两版结构一致</span>
          </template>
          <template v-else>
            <ReTag type="success" effect="plain">节点 +{{ summary.nodeAdded }} / -{{ summary.nodeRemoved }} / ~{{ summary.nodeChanged }}</ReTag>
            <ReTag type="warning" effect="plain">连线 +{{ summary.edgeAdded }} / -{{ summary.edgeRemoved }} / ~{{ summary.edgeChanged }}</ReTag>
          </template>
        </div>

        <ReTable
          v-if="compared && changes.length"
          :data="changes"
          :columns="changeColumns"
          :pagination="false"
          :layout-table="{ maxHeight: 260 }"
          row-key="key"
          stripe
        >
          <template #kind="{ row }">
            <ReTag :type="row.kind === '新增' ? 'success' : row.kind === '删除' ? 'danger' : 'warning'" effect="plain">
              {{ row.kind }}
            </ReTag>
          </template>
        </ReTable>

        <div class="version-section-title">全部版本</div>
        <ReTable
          :data="versions"
          :columns="versionColumns"
          :pagination="false"
          :layout-table="{ maxHeight: 360 }"
          row-key="collectFlowVersionId"
          stripe
        >
          <template #version="{ row }">
            <span class="version-no">v{{ row.versionNo }}</span>
          </template>
          <template #action="{ row }">
            <ReButton
              layout="square"
              icon="RefreshLeft"
              type="warning"
              tip="回滚到该版本"
              :loading="rolling"
              @click="rollback(row)"
            />
          </template>
        </ReTable>
      </template>
    </div>
  </ReDrawer>
</template>

<style scoped>
.version-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.version-tip {
  display: flex;
  align-items: center;
  gap: 12px;
  justify-content: center;
  padding: 48px 0;
  color: var(--el-text-color-secondary);
}
.version-compare {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.compare-arrow {
  color: var(--el-text-color-secondary);
}
.version-summary {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.summary-equal {
  color: var(--el-text-color-secondary);
  font-size: 13px;
}
.version-section-title {
  margin-top: 6px;
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-regular);
}
.version-no {
  font-family: var(--el-font-family-mono, monospace);
}
</style>
