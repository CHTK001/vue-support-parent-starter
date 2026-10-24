<script setup lang="ts">
/**
 * ReRelationGraphV2 · 三国演义知识图谱集成示例
 *
 * <p>展示 {@link @repo/ui/re-relation-graph-v2}（G6 5.1.1 原生，bubble-sets 基础）
 * 在真实业务数据上的效果：三国人物按势力分组（蜀汉/曹魏/东吴/吕布集团/董卓集团/
 * 袁绍集团/东汉朝廷），气泡集包裹同势力节点，force 布局防重叠。</p>
 *
 * <p>数据源：{@link ../../data/sanguo}（忠实于知识库三国图谱的势力结构）。</p>
 */
import { onMounted, ref } from "vue";
import ReRelationGraphV2 from "@repo/ui/re-relation-graph-v2";
import { sanguoNodes, sanguoEdges } from "../data/sanguo";

// 业务端节点：id / label / group（势力）/ type / size
const nodes = sanguoNodes.map((n) => ({
  id: n.id,
  label: n.id,
  group: n.data.cluster,
  type: n.data.type === "person" ? "circle" : n.data.type,
  size: n.style.size ?? 40,
}));

const edges = sanguoEdges.map((e) => ({ source: e.source, target: e.target }));

/** 组件实例（用于验收 / 调试暴露 graph 句柄） */
const graphComp = ref<{ graph: unknown } | null>(null);

/** 最近一次 hover 事件（验证 mouseover / mouseout 已接通） */
const hoverInfo = ref("（把鼠标移到节点或边上，这里会实时显示）");

const onNodeMouseover = (d: { id: string; data?: unknown }) => {
  const cluster =
    ((d.data as { data?: { cluster?: string } } | undefined)?.data?.cluster ?? "") ||
    ((d.data as { cluster?: string } | undefined)?.cluster ?? "");
  hoverInfo.value = `node-mouseover → ${d.id}（${cluster}）`;
};
const onNodeMouseout = (d: { id: string }) => {
  hoverInfo.value = `node-mouseout → ${d.id}`;
};
const onEdgeMouseover = (d: { id: string; source: string; target: string; data?: unknown }) => {
  const src = d.source || ((d.data as { source?: string } | undefined)?.source ?? "");
  const tgt = d.target || ((d.data as { target?: string } | undefined)?.target ?? "");
  hoverInfo.value = `edge-mouseover → ${src} — ${tgt}`;
};
const onEdgeMouseout = (d: { id: string; source: string; target: string; data?: unknown }) => {
  const src = d.source || ((d.data as { source?: string } | undefined)?.source ?? "");
  const tgt = d.target || ((d.data as { target?: string } | undefined)?.target ?? "");
  hoverInfo.value = `edge-mouseout → ${src} — ${tgt}`;
};

onMounted(() => {
  // 等 G6 实例化完成后暴露到 window，供验收脚本断言
  const t = setInterval(() => {
    if (graphComp.value?.graph) {
      (window as any).__RG2__ = graphComp.value.graph;
      clearInterval(t);
    }
  }, 300);
});
</script>

<template>
  <div class="re-graph-g6">
    <div class="re-graph-g6__head">
      <div class="re-graph-g6__title">ReRelationGraphV2 · 三国演义知识图谱（G6 5.1.1 原生）</div>
      <div class="re-graph-g6__desc">
        以 G6 官方 bubble-sets 示例为地基：三国人物按势力分组（蜀汉 / 曹魏 / 东吴 / 吕布集团 /
        董卓集团 / 袁绍集团 / 东汉朝廷），气泡集包裹同势力节点，force 布局防重叠，支持缩放 /
        拖拽画布 / 拖拽节点。后续功能逐个添加、逐个验收。
      </div>
    </div>
    <div class="re-graph-g6__hover">{{ hoverInfo }}</div>
    <ReRelationGraphV2
      ref="graphComp"
      :nodes="nodes"
      :edges="edges"
      height="100%"
      class="re-graph-g6__canvas"
      @node-mouseover="onNodeMouseover"
      @node-mouseout="onNodeMouseout"
      @edge-mouseover="onEdgeMouseover"
      @edge-mouseout="onEdgeMouseout"
    />
  </div>
</template>

<style lang="scss" scoped>
.re-graph-g6 {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
  height: 100%;
  min-height: 480px;
  padding: 14px;
  box-sizing: border-box;
}

.re-graph-g6__head {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.re-graph-g6__title {
  font-size: 15px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}

.re-graph-g6__desc {
  font-size: 12px;
  line-height: 1.5;
  color: var(--el-text-color-secondary);
}

.re-graph-g6__hover {
  font-size: 12px;
  color: var(--el-color-primary);
  font-family: monospace;
  padding: 4px 10px;
  border: 1px dashed var(--el-border-color-lighter);
  border-radius: var(--el-radius-md, 8px);
  background: var(--el-fill-color-blank);
  min-height: 22px;
}

.re-graph-g6__canvas {
  flex: 1;
  min-height: 400px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-lg, 12px);
  background: var(--el-bg-color);
  overflow: hidden;
}
</style>
