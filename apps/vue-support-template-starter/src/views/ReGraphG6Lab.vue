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
import { onBeforeUnmount, onMounted, ref } from "vue";
import ReRelationGraphV2, {
  LAYOUT_OPTIONS,
  type V2GroupType,
  type V2LayoutType,
} from "@repo/ui/re-relation-graph-v2";
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

/** 当前布局：缺省分组布局（每组自动占据画布一块独立区域） */
const layout = ref<V2LayoutType>("group");

/** 分组轮廓：气泡集 / Hull 轮廓 / 不分组 */
const groupType = ref<V2GroupType>("bubble");

/** 分组轮廓显隐 */
const groupVisible = ref(true);

/** 内置工具栏（图标 + Popover 面板）开关 */
const toolbar = ref(true);

/** 工具栏外观变体（设计探索用：胶囊 / 卡片 / 侧轨） */
const toolbarVariant = ref<"pill" | "card" | "rail">("pill");

/** 当前布局参数（工具栏「布局设置」改动会回传到这里） */
const layoutOptions = ref<Record<string, unknown>>({});

/** 组件实例（用于验收 / 调试暴露 graph 句柄） */
const graphComp = ref<{
  graph: unknown;
  layout?: string;
  groupType?: string;
  groupVisible?: boolean;
  focus?: (id: string[]) => void;
} | null>(null);

/** 最近一次 hover 事件（验证 mouseover / mouseout 已接通） */
const hoverInfo = ref("（把鼠标移到节点或边上，这里会实时显示）");

/** 自定义工具示例：一键聚焦某个势力 */
const quickFocusGroups = ["蜀汉", "曹魏", "东吴"];
const focusGroup = (group: string) => {
  const ids = sanguoNodes.filter((n) => n.data.cluster === group).map((n) => n.id);
  graphComp.value?.focus?.(ids);
  hoverInfo.value = `聚焦 ${group}（${ids.length} 个节点）`;
};

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
  // 把 G6 实例（组件实例）暴露到 window，供验收脚本断言。
  // 注意：切换布局时组件会整图重建，graph 句柄会换成新实例，
  // 因此这里持续刷新（而不是取到一次就停止），脚本始终拿到活得那个。
  const timer = window.setInterval(() => {
    if (graphComp.value?.graph) {
      (window as any).__RG2__ = graphComp.value.graph;
      (window as any).__RG2CMP__ = graphComp.value;
    }
  }, 500);
  onBeforeUnmount(() => window.clearInterval(timer));
});
</script>

<template>
  <div class="re-graph-g6">
    <div class="re-graph-g6__head">
      <div class="re-graph-g6__row">
        <div class="re-graph-g6__title">ReRelationGraphV2 · 三国演义知识图谱（G6 5.1.1 原生）</div>
        <div class="re-graph-g6__controls">
          <span class="re-graph-g6__layout-label">布局</span>
          <el-select v-model="layout" size="small" style="width: 190px">
            <el-option
              v-for="opt in LAYOUT_OPTIONS"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>

          <span class="re-graph-g6__layout-label">分组轮廓</span>
          <el-select v-model="groupType" size="small" style="width: 140px">
            <el-option label="气泡集 bubble-sets" value="bubble" />
            <el-option label="Hull 轮廓" value="hull" />
            <el-option label="不分组" value="none" />
          </el-select>

          <el-switch v-model="groupVisible" size="small" active-text="显示分组" />

          <el-divider direction="vertical" />

          <span class="re-graph-g6__layout-label">内置工具栏</span>
          <el-switch v-model="toolbar" size="small" />
          <el-select v-model="toolbarVariant" size="small" style="width: 118px" :disabled="!toolbar">
            <el-option label="胶囊 pill" value="pill" />
            <el-option label="卡片 card" value="card" />
            <el-option label="侧轨 rail" value="rail" />
          </el-select>
        </div>
      </div>
      <div class="re-graph-g6__desc">
        以 G6 官方 bubble-sets 示例为地基：三国人物按势力分组（蜀汉 / 曹魏 / 东吴 / 吕布集团 /
        董卓集团 / 袁绍集团 / 东汉朝廷），<b>分组轮廓</b>可选「气泡集」或「Hull 轮廓」包裹同势力节点。
        <b>默认「分组布局」</b>给每个势力分配画布上一块独立区域（同组必聚、组间不重叠）；
        右上角内置工具栏可切布局、切分组轮廓、开关轮廓、调布局参数。
      </div>
    </div>
    <div class="re-graph-g6__hover">{{ hoverInfo }}</div>
    <ReRelationGraphV2
      ref="graphComp"
      v-model:layout="layout"
      v-model:groupType="groupType"
      v-model:groupVisible="groupVisible"
      v-model:layoutOptions="layoutOptions"
      :nodes="nodes"
      :edges="edges"
      :toolbar="toolbar"
      :toolbar-variant="toolbarVariant"
      height="100%"
      class="re-graph-g6__canvas"
      @node-mouseover="onNodeMouseover"
      @node-mouseout="onNodeMouseout"
      @edge-mouseover="onEdgeMouseover"
      @edge-mouseout="onEdgeMouseout"
    >
      <!-- 自定义工具位：业务自己的按钮可直接塞进内置工具栏 -->
      <template #toolbar-extra>
        <button
          v-for="g in quickFocusGroups"
          :key="g"
          type="button"
          class="re-graph-g6__quick"
          :title="`聚焦 ${g}`"
          @click="focusGroup(g)"
        >
          {{ g.slice(0, 2) }}
        </button>
      </template>
    </ReRelationGraphV2>
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

.re-graph-g6__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.re-graph-g6__controls {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.re-graph-g6__layout-label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

/* 自定义工具位按钮：与工具栏内部图标按钮同一观感（方角、细边） */
.re-graph-g6__quick {
  height: 30px;
  padding: 0 7px;
  font-size: 11px;
  line-height: 1;
  color: var(--el-text-color-regular);
  background: transparent;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
  cursor: pointer;
  transition: color 0.15s ease, border-color 0.15s ease, background 0.15s ease;
}
.re-graph-g6__quick:hover {
  color: var(--el-color-primary);
  border-color: var(--el-color-primary-light-5);
  background: var(--el-color-primary-light-9);
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
