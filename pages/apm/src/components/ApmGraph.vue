<!--
  ApmGraph —— 服务调用关系图（总览与「拓扑」页签共用一套画法）。

  为什么用 ReRelationGraph 而不是自己拿 echarts graph 画：
    1. 仓库里 Zookeeper / Elasticsearch / ER 工作台的拓扑都用它（G6 内核），
       换过来以后 APM 的图与全站其它拓扑是同一套观感与交互，不再是一块「外来图」；
    2. echarts 的 force 是「自己算完再画」，用户不能稳住布局；G6 自带 drag-canvas、
       滚轮缩放、点选下钻、悬停高亮邻居、适应画布，这些正是排障时要用的；
    3. 节点可以用 html 卡片（#node-content）直接写「服务名 + 调用量 + 耗时」，
       不用再靠 label 胶囊硬塞，信息密度更高。

  不选 ReFlowGraph：它是 AntV X6 的**流程设计器**（调色板、拖拽入板、连线、
  撤销重做、结构预检要求唯一开始/末端结束），面向人工编排；
  APM 拓扑是只读观测，用它会带进一整套用不上的编辑能力。

  两条必须记住的 OAP 事实（都踩过）：
    1. 调用边的 calls / avgMs / errorRate 在「该边没有指标数据」时返回 -1；
       -1 直接参与线宽计算会得到非法值 → 整条边不画，所以数值先过 {@link num}；
    2. 节点 id 是 base64 实体串（`YXBtLWRlbW8tYQ==.1`），边的 source/target
       引用的是这个 id 而不是 name —— 数据项必须写 `id`，否则边连不上。
-->
<template>
  <ReRelationGraph
    v-if="nodes.length"
    class="apm-graph"
    :nodes="graphNodes"
    :edges="graphEdges"
    :height="height"
    layout="antv-dagre"
    :layout-options="layoutOptions"
    group-type="none"
    :toolbar="true"
    toolbar-variant="pill"
    toolbar-position="top-right"
    :toolbar-collapsible="true"
    :node-size="46"
    :edge-arrow="true"
    :edge-width="1.4"
    :edge-label="true"
    :click-select="true"
    :highlight="true"
    :minimap="nodes.length > 12"
    empty-text=""
    @node-click="onNodeClick"
  >
    <!-- 节点卡片：服务名 + 调用量 + 耗时。比圆点 + 下方胶囊标签好读得多 -->
    <template #node-content="{ node }">
      <div class="apm-node" :class="{ 'is-virtual': node.data?.virtual, 'is-self': node.data?.self }">
        <span class="apm-node__name" :title="String(node.data?.label ?? '')">{{ node.data?.label }}</span>
        <span class="apm-node__meta">
          <b>{{ node.data?.calls ? fmtNum(node.data.calls) : "—" }}</b>
          <i>次</i>
          <em>{{ node.data?.avgMs ? fmtMs(node.data.avgMs) : "—" }}</em>
        </span>
      </div>
    </template>

    <template #node-tooltip="{ node }">
      <div class="apm-tip">
        <div class="apm-tip__t">{{ node.data?.label }}</div>
        <div class="apm-tip__r">类型 {{ node.data?.type || "—" }}</div>
        <div class="apm-tip__r">调用量 {{ node.data?.calls ? fmtNum(node.data.calls) : "—" }}</div>
        <div class="apm-tip__r">平均耗时 {{ node.data?.avgMs ? fmtMs(node.data.avgMs) : "—" }}</div>
        <div class="apm-tip__r">{{ node.data?.virtual ? "来源 推断（非部署实例）" : "来源 已部署" }}</div>
      </div>
    </template>

    <template #edge-tooltip="{ edge }">
      <div class="apm-tip">
        <div class="apm-tip__t">{{ edge.data?.fromName }} → {{ edge.data?.toName }}</div>
        <div class="apm-tip__r">调用量 {{ edge.data?.calls > 0 ? fmtNum(edge.data.calls) : "—" }}</div>
        <div class="apm-tip__r">平均耗时 {{ edge.data?.avgMs > 0 ? fmtMs(edge.data.avgMs) : "—" }}</div>
        <div class="apm-tip__r">错误率 {{ edge.data?.errorRate >= 0 ? fmtPercent(edge.data.errorRate) : "—" }}</div>
      </div>
    </template>
  </ReRelationGraph>

  <div v-else class="apm-graph__empty">{{ emptyText }}</div>
</template>

<script setup lang="ts">
/**
 * APM 服务调用关系图。
 *
 * <p>只负责「把 OAP 的拓扑数据翻译成 ReRelationGraph 的 nodes / edges」，
 * 不参与布局算法与画布交互 —— 那些由组件内核负责，换布局不用改这里。</p>
 *
 * @since 4.0.0.51
 */
import { computed } from "vue";
import ReRelationGraph from "@repo/ui/re-relation-graph";
import type { RelationEdge, RelationNode } from "@repo/ui/re-relation-graph";
import type { ApmTopologyCall, ApmTopologyNode } from "../api/apmApi";
import { fmtMs, fmtNum, fmtPercent } from "../utils/format";

const props = withDefaults(
  defineProps<{
    nodes: ApmTopologyNode[];
    calls: ApmTopologyCall[];
    /** 图高（px 或 css 长度），透传给 ReRelationGraph */
    height?: string;
    /** 空态文案 */
    emptyText?: string;
    /** 节点标签字号：保留入参兼容旧调用，卡片节点用 CSS 控制字号 */
    labelSize?: number;
  }>(),
  {
    height: "380px",
    emptyText: "该时间窗口内没有调用关系",
    labelSize: 12,
  },
);

const emit = defineEmits<{
  /** 点节点时把服务名抛给外层（外层可跳到服务详情 / 端点页） */
  (e: "pick", name: string): void;
}>();

/** OAP 的 -1 是「没有数据」的哨兵值，参与线宽/缩放计算前必须归零 */
function num(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/** 节点 id → 名字（边上只有 id，tooltip 要显示名字） */
const nameMap = computed(() => {
  const map = new Map<string, string>();
  for (const node of props.nodes) {
    map.set(node.id, node.name);
  }
  return map;
});

/** 每个节点的出入边调用量合计：用来在卡片上直接显示「这个服务多忙」 */
const weight = computed(() => {
  const map = new Map<string, number>();
  for (const call of props.calls) {
    const n = num(call.calls);
    map.set(call.source, (map.get(call.source) ?? 0) + n);
    map.set(call.target, (map.get(call.target) ?? 0) + n);
  }
  return map;
});

/** 每个节点的平均耗时（取与该节点相连的边里最大的那条，代表它最慢的一段） */
const slowest = computed(() => {
  const map = new Map<string, number>();
  for (const call of props.calls) {
    const ms = num(call.avgMs);
    for (const id of [call.source, call.target]) {
      if (ms > (map.get(id) ?? 0)) {
        map.set(id, ms);
      }
    }
  }
  return map;
});

/**
 * 节点数据。
 *
 * <p>节点按「是否已部署」分两组，但**不画分组轮廓**（group-type=none）：
 * 轮廓是给「按势力聚块」用的，服务拓扑里一圈虚线只会把图撑大。
 * 分组字段仍然保留，悬停高亮与图例配色都靠它。</p>
 */
const graphNodes = computed<RelationNode[]>(() => {
  return props.nodes.map((node) => {
    const self = node.self || node.isSelf;
    const virtual = node.real === false || node.isReal === false;
    return {
      id: node.id,
      label: node.name,
      // group 只影响配色（不画轮廓），已部署 / 推断 / 自身三种身份各一色
      group: self ? "self" : virtual ? "virtual" : "deployed",
      size: 46,
      data: {
        label: node.name,
        type: node.type,
        calls: weight.value.get(node.id) ?? 0,
        avgMs: slowest.value.get(node.id) ?? 0,
        virtual,
        self,
      },
    };
  });
});

/**
 * 边数据。
 *
 * <p>线宽按调用量对数缩放（线性会让小流量边细到看不见），
 * 有错误的边用危险色并加粗，一眼能看出哪条调用链在出错。</p>
 */
const graphEdges = computed<RelationEdge[]>(() => {
  return props.calls.map((call, index) => {
    const traffic = num(call.calls);
    const rate = num(call.errorRate);
    const bad = rate > 0;
    return {
      // 同一对节点之间可能有多条边（不同检测点），id 必须唯一，否则会被 G6 静默丢弃
      id: `${call.source}->${call.target}#${index}`,
      source: call.source,
      target: call.target,
      label: traffic > 0 ? fmtNum(traffic) : "",
      width: Math.min(3.2, 1.2 + Math.log2(1 + traffic) * 0.35),
      color: bad ? "var(--status-error)" : undefined,
      arrow: true,
      data: {
        calls: traffic,
        avgMs: num(call.avgMs),
        errorRate: call.errorRate,
        fromName: nameMap.value.get(call.source) || call.source,
        toName: nameMap.value.get(call.target) || call.target,
      },
    };
  });
});

/**
 * 布局参数。
 *
 * <p>用 antv-dagre（宽幅分层）：服务拓扑天然是有向的调用关系，
 * 分层能直接看出「上游 → 下游」，比力导向的散点更容易顺着调用链看。</p>
 */
const layoutOptions = {
  rankdir: "LR",
  nodesep: 40,
  ranksep: 90,
};

function onNodeClick(payload: { id: string; data?: Record<string, unknown> }): void {
  const name = payload?.data?.label;
  if (typeof name === "string" && name) {
    emit("pick", name);
  }
}
</script>

<style scoped>
/* 节点卡片：白底细边，与服务卡片同一套语言；宽度固定，避免长服务名把图撑变形 */
.apm-node {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 2px;
  box-sizing: border-box;
  width: 148px;
  padding: 8px 10px;
  border: 1px solid var(--border-default, #e3e6ef);
  border-radius: var(--radius-md, 8px);
  background: var(--bg-container, #fff);
  box-shadow: var(--shadow-sm, 0 1px 2px rgba(15, 18, 33, 0.04));
  cursor: pointer;
}

/* 推断出来的节点（非部署实例）：虚线边 + 淡化，和「已部署」区分开 */
.apm-node.is-virtual {
  border-style: dashed;
  border-color: var(--border-subtle, #eef0f6);
  background: var(--bg-fill, #f5f7fa);
}

/* 自身节点：左侧一条品牌色竖条，找「我在哪」时一眼定位 */
.apm-node.is-self {
  border-left: 3px solid var(--brand-500, #6d5dfc);
}

.apm-node__name {
  font-size: 12px;
  font-weight: 600;
  line-height: 1.3;
  color: var(--text-primary, #1f2430);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.apm-node__meta {
  display: flex;
  align-items: baseline;
  gap: 3px;
  font-size: 11px;
  line-height: 1.3;
  color: var(--text-tertiary, #8a90a2);
  font-variant-numeric: tabular-nums;
}

.apm-node__meta b {
  font-family: var(--font-mono, ui-monospace, Consolas, monospace);
  font-weight: 600;
  color: var(--text-secondary, #5c6270);
}

.apm-node__meta i {
  font-style: normal;
  margin-right: 4px;
}

.apm-node__meta em {
  font-style: normal;
  font-family: var(--font-mono, ui-monospace, Consolas, monospace);
}

/* 悬浮提示：与宿主 tooltip 同一观感 */
.apm-tip {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 120px;
  padding: 8px 10px;
  border: 1px solid var(--border-subtle, #eef0f6);
  border-radius: var(--radius-sm, 6px);
  background: var(--bg-container, #fff);
  box-shadow: var(--shadow-md, 0 4px 12px rgba(15, 18, 33, 0.06));
  font-size: 11.5px;
  line-height: 1.5;
  color: var(--text-secondary, #5c6270);
}

.apm-tip__t {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-primary, #1f2430);
}

.apm-tip__r {
  font-variant-numeric: tabular-nums;
}

.apm-graph__empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 160px;
  padding: 16px;
  text-align: center;
  font-size: 12px;
  color: var(--text-tertiary, #8a90a2);
}
</style>
