<script setup lang="ts">
/**
 * ProjectTopology —— 「这台主机上到底跑了什么」的拓扑图。
 *
 * <p>发布页的左栏是一个个孤立项目，端口冲突、内存被谁吃掉、某台机器是不是快撑不住，
 * 这些问题都得先把「同主机的所有项目」摆在一起才看得出来。这里用一张中心辐射图：
 * 中间是主机，四周是它承载的项目，连线按运行状态着色。</p>
 *
 * <p>两种形态共用同一个组件，避免两套画法走岔：</p>
 * <ul>
 *   <li>整页（默认）：项目多时按环形均匀铺开，节点带端口 / 运行时长 / 类型；</li>
 *   <li>紧凑（compact）：系统信息页里的卡片，只铺前 {@link COMPACT_LIMIT} 个，
 *       超出的收成一行「还有 N 个」，点「查看完整拓扑」进整页。</li>
 * </ul>
 *
 * <p>组件不发请求：数据由页面算好传进来（页面本来就有列表与端点缓存）。</p>
 */
import { computed } from 'vue';
import ReIcon from '@repo/ui/re-icon';

defineOptions({ name: 'ProjectTopology' });

/** 拓扑里的一个项目节点（字段都是可选，缺失时对应那行就不画） */
interface TopoProject {
  id: number;
  name: string;
  /** 运行态：running / stopped / disabled（沿用发布页 statusKey 的取值） */
  status: string;
  /** 进程号 */
  pid?: string;
  /** 监听端口（只有探测过端点才知道，不知道就不显示，绝不猜） */
  port?: number;
  /** 已运行时长文案 */
  uptime?: string;
  /** 类型中文名（Java / 前端 / 静态…） */
  typeLabel?: string;
  /** 是否 JVM 进程：决定要不要给「观测」入口 */
  java?: boolean;
}

const props = withDefaults(
  defineProps<{
    /** 同主机下的全部项目 */
    projects: TopoProject[];
    /** 主机展示名（发布绑定的那台） */
    hostLabel?: string;
    /** 当前高亮的项目（系统信息页里就是它自己） */
    activeId?: number | null;
    /** 紧凑模式：只铺前几个节点，并给出「查看完整拓扑」入口 */
    compact?: boolean;
  }>(),
  { hostLabel: '', activeId: null, compact: false },
);

const emit = defineEmits<{
  /** 点节点：切到该项目的系统信息 */
  (e: 'open', id: number): void;
  /** 紧凑模式下点「查看完整拓扑」 */
  (e: 'expand'): void;
  /** 点节点上的「观测」 */
  (e: 'observe', id: number): void;
}>();

/** 紧凑模式最多铺几个节点：再多卡片会被撑高，一屏放不下就成了「得滚动的图」 */
const COMPACT_LIMIT = 6;

/**
 * 节点占位（px）：与 `.topo-node` 的 min/max-width 和两行文字的行高配套。
 *
 * <p>这里写死是为了算半径——DOM 还没渲染时量不到真实尺寸，而节点一多就必须先知道
 * 「每个节点要占多宽」才能把环算得够大。改样式时这两处要一起改。</p>
 */
const NODE_W = 118;
const NODE_H = 56;

/** 当前要绘制的节点 */
const nodes = computed(() => (props.compact ? props.projects.slice(0, COMPACT_LIMIT) : props.projects));

/** 没铺下的节点数（紧凑模式才有意义） */
const hiddenCount = computed(() => Math.max(0, props.projects.length - nodes.value.length));

/** 运行中的项目数：抬头那个数字用它，与列表分组口径一致 */
const runningCount = computed(() => props.projects.filter((p) => p.status === 'running').length);

/**
 * 横向半径：按「环上相邻两节点不能压住」倒推。
 *
 * <p>节点是宽矩形，左右相邻时最吃宽度，所以横半径随数量线性增长；数量少时收拢到
 * 一个下限，否则一两个项目会被摆到很远的角落，图看着像空了一半。</p>
 */
const rx = computed(() => {
  const n = Math.max(nodes.value.length, 1);
  const need = (NODE_W * 1.18 * n) / (2 * Math.PI);
  return Math.round(Math.max(props.compact ? 104 : 150, need));
});

/** 纵向半径：上下相邻时按节点高度（含运行时长那行）留间距 */
const ry = computed(() => {
  const n = Math.max(nodes.value.length, 1);
  const need = (NODE_H * 1.35 * n) / (2 * Math.PI);
  return Math.round(Math.max(props.compact ? 76 : 92, need));
});

/** 画布：两侧各留半个节点宽，节点不会被裁掉；没有节点时只放得下主机 */
const canvasW = computed(() => rx.value * 2 + NODE_W + 40);
const canvasH = computed(() => ry.value * 2 + NODE_H + 40);

/**
 * 节点坐标：椭圆环上从正上方开始顺时针均匀分布。
 *
 * <p>只有一个项目时放正下方——此时画成环会显得图是空的，不如让主机和它排成一列。</p>
 */
const placed = computed(() => {
  const total = nodes.value.length;
  const cx = canvasW.value / 2;
  const cy = canvasH.value / 2;
  return nodes.value.map((p, i) => {
    if (total === 1) return { ...p, x: cx, y: cy + ry.value * 0.78 };
    const angle = -Math.PI / 2 + (i * 2 * Math.PI) / total;
    return {
      ...p,
      x: cx + Math.cos(angle) * rx.value,
      y: cy + Math.sin(angle) * ry.value,
    };
  });
});

/**
 * 状态点的中文名：节点上只放一个小圆点，语义靠 title 与颜色，不占行宽。
 *
 * @param status 运行态
 */
function statusText(status: string): string {
  if (status === 'running') return '运行中';
  if (status === 'disabled') return '已禁用';
  if (status === 'ready') return '已发布';
  return '已停止';
}
</script>

<template>
  <section class="topo" :class="{ 'is-compact': compact }">
    <header class="topo-head">
      <ReIcon name="Share" :size="13" />
      <span class="topo-title">部署拓扑</span>
      <span class="topo-host-chip">{{ hostLabel || '本机' }}</span>
      <span class="topo-stat">
        <b>{{ runningCount }}</b>/{{ projects.length }} 运行
      </span>
      <button v-if="compact" type="button" class="topo-link" @click="emit('expand')">查看完整拓扑</button>
    </header>

    <!-- 紧凑态可能比卡片宽：给一层横向滚动，而不是把节点挤回来重叠 -->
    <div class="topo-view">
      <div class="topo-canvas" :style="{ width: `${canvasW}px`, height: `${canvasH}px` }">
        <!-- 连线画在节点下面：SVG 只是装饰，交互全在节点按钮上 -->
        <svg class="topo-links" :width="canvasW" :height="canvasH" aria-hidden="true">
          <line
            v-for="n in placed"
            :key="`l:${n.id}`"
            :x1="canvasW / 2"
            :y1="canvasH / 2"
            :x2="n.x"
            :y2="n.y"
            :class="`is-${n.status}`"
          />
        </svg>

        <!-- 主机 -->
        <div class="topo-host" :style="{ left: `${canvasW / 2}px`, top: `${canvasH / 2}px` }">
          <ReIcon name="Monitor" :size="16" />
          <span>{{ hostLabel || '本机' }}</span>
        </div>

        <!-- 项目节点 -->
        <button
          v-for="n in placed"
          :key="n.id"
          type="button"
          class="topo-node"
          :class="[`is-${n.status}`, { 'is-active': activeId === n.id }]"
          :style="{ left: `${n.x}px`, top: `${n.y}px` }"
          :title="`${n.name} · ${statusText(n.status)}${n.port ? ` · 端口 ${n.port}` : ''}`"
          @click="emit('open', n.id)"
        >
          <span class="topo-node__name">{{ n.name }}</span>
          <span class="topo-node__meta">
            <span class="topo-node__dot"></span>
            <template v-if="n.port">:{{ n.port }}</template>
            <template v-else-if="n.typeLabel">{{ n.typeLabel }}</template>
            <template v-else>{{ statusText(n.status) }}</template>
          </span>
          <span v-if="n.uptime" class="topo-node__uptime">{{ n.uptime }}</span>
          <!-- 只有 JVM 项目才有得看：其它类型点进观测台是空的。
               这里只是鼠标快捷方式，键盘用户走系统信息页的「观测入口」即可（避免按钮里再套按钮） -->
          <span
            v-if="n.java && n.status === 'running'"
            class="topo-node__obs"
            title="打开 APM 观测"
            @click.stop="emit('observe', n.id)"
          >
            <ReIcon name="DataLine" :size="11" />
          </span>
        </button>

        <p v-if="!projects.length" class="topo-empty">这台主机下还没有项目</p>
      </div>
    </div>

    <p v-if="compact && hiddenCount" class="topo-more">还有 {{ hiddenCount }} 个项目未展开</p>
  </section>
</template>

<style scoped>
.topo {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
  padding: 14px 16px 16px;
  background: var(--bg-container);
  border: 1px solid var(--border-subtle);
  border-radius: 10px;
}

/* 整页形态：铺满页签高度，画布居中 */
.topo:not(.is-compact) {
  height: 100%;
  min-height: 0;
}

/* 画布视口：紧凑态比卡片宽时横向滚动，整页态两向滚动 */
.topo-view {
  display: flex;
  justify-content: center;
  width: 100%;
  min-width: 0;
  overflow: auto;
}

.topo:not(.is-compact) .topo-view {
  flex: 1 1 auto;
  align-items: center;
  min-height: 0;
}

.topo-head {
  display: flex;
  flex: none;
  align-items: center;
  gap: 8px;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--text-secondary);
}

.topo-host-chip {
  padding: 1px 7px;
  font-family: "Cascadia Code", "JetBrains Mono", Consolas, monospace;
  font-size: 11.5px;
  font-weight: 400;
  color: var(--text-tertiary);
  background: var(--bg-fill);
  border-radius: 5px;
}

.topo-stat {
  margin-left: auto;
  font-size: 11.5px;
  font-weight: 400;
  font-variant-numeric: tabular-nums;
  color: var(--text-tertiary);
}
.topo-stat b {
  color: #178a4c;
}

.topo-link {
  padding: 0;
  font-size: 11.5px;
  font-weight: 400;
  color: var(--text-link, #1677ff);
  cursor: pointer;
  background: none;
  border: none;
}
.topo-link:hover {
  text-decoration: underline;
}

/* 画布：绝对定位+translate(-50%,-50%) 让节点中心落在坐标上；
   整页态铺一层点阵底，图是「空间」而不是一块白纸 */
.topo-canvas {
  position: relative;
  flex: none;
  margin: 0 auto;
}

.topo:not(.is-compact) .topo-canvas {
  background-image: radial-gradient(circle, var(--border-subtle) 1px, transparent 1px);
  background-size: 18px 18px;
  border-radius: 14px;
}

.topo-links {
  position: absolute;
  inset: 0;
  overflow: visible;
  pointer-events: none;
}

.topo-links line {
  stroke: var(--border-strong, #d0d5dd);
  stroke-width: 1.5;
  stroke-dasharray: 4 3;
}
.topo-links line.is-running {
  stroke: #16c916;
  stroke-dasharray: none;
  opacity: 0.55;
}

.topo-host {
  position: absolute;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
  background: var(--bg-container);
  border: 1px solid var(--border-strong, #d0d5dd);
  border-radius: 9999px;
  box-shadow: 0 2px 8px rgba(16, 24, 40, 0.06);
  transform: translate(-50%, -50%);
}

.topo-node {
  position: absolute;
  display: flex;
  flex-direction: column;
  gap: 2px;
  /* 宽度写死：环形间距按 118px 反推的，节点随内容变宽就会压到邻居 */
  width: 118px;
  padding: 7px 10px;
  font-family: inherit;
  text-align: left;
  cursor: pointer;
  background: var(--bg-container);
  border: 1px solid var(--border-subtle);
  border-radius: 9px;
  transform: translate(-50%, -50%);
  transition: border-color 0.12s ease, box-shadow 0.12s ease;
}
.topo-node:hover {
  border-color: var(--text-link, #1677ff);
  box-shadow: 0 3px 12px rgba(16, 24, 40, 0.1);
}
.topo-node.is-active {
  border-color: var(--text-link, #1677ff);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--text-link, #1677ff) 18%, transparent);
}

.topo-node__name {
  overflow: hidden;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-primary);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.topo-node__meta {
  display: flex;
  align-items: center;
  gap: 4px;
  font-family: "Cascadia Code", "JetBrains Mono", Consolas, monospace;
  font-size: 10.5px;
  color: var(--text-tertiary);
  white-space: nowrap;
}

.topo-node__dot {
  flex: none;
  width: 5px;
  height: 5px;
  background: var(--text-tertiary);
  border-radius: 50%;
}
.topo-node.is-running .topo-node__dot {
  background: #16c916;
  box-shadow: 0 0 0 2px rgba(22, 201, 22, 0.16);
}
.topo-node.is-disabled .topo-node__dot {
  background: #ff9730;
}

.topo-node__uptime {
  font-size: 10px;
  font-variant-numeric: tabular-nums;
  color: #178a4c;
}

/* 观测入口：悬停才浮出，节点常态只留名称与端口 */
.topo-node__obs {
  position: absolute;
  top: -7px;
  right: -7px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  color: var(--text-secondary);
  background: var(--bg-container);
  border: 1px solid var(--border-subtle);
  border-radius: 50%;
  opacity: 0;
  transition: opacity 0.12s ease;
}
.topo-node:hover .topo-node__obs {
  opacity: 1;
}

.topo-empty,
.topo-more {
  margin: 0;
  font-size: 11.5px;
  color: var(--text-tertiary);
}

/* 空态压在主机上居中：靠左顶部会看着像一条漏掉的提示 */
.topo-empty {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.topo-more {
  padding-left: 2px;
}
</style>
