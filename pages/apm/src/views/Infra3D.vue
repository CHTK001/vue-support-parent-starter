<!--
  3D 基础设施图 —— 对齐 skywalking-horizon-ui 的 infra-3d，但用我们的主题变量重画。

  为什么是 3D 而不是再画一张 2D 拓扑：
    · 2D 拓扑（/apm/topology）回答「谁调谁」，节点一多就得靠 force 布局，层次读不出来；
    · 3D 图把节点按 layer（GENERAL / DATABASE / MQ / HTTP …）分层摆在不同高度，
      一眼能看出「业务 → 中间件 → 存储」的纵深，这是 2D 平面图给不了的信息。

  渲染走 @repo/ui/re-three（不直接 import three）：
  它已经封装了 renderer / 场景 / resize / RAF 生命周期，本页只往 scene 里加对象。
  数据只取一次（/infra-3d，内含 nodes + calls + layers），旋转 / 缩放全在客户端。
-->
<template>
  <ApmGate v-slot="{ status }">
    <div class="apm-bar apm-toolbar">
      <ReSelect v-model="minutes" :options="windowOptions" style="width: 150px" @change="load" />
      <ReSwitch v-model="autoRotate" size="small" />
      <span class="apm-count">自动旋转</span>
      <ReSwitch v-model="showEdges" size="small" />
      <span class="apm-count">显示调用边</span>
      <span class="apm-bar__spacer" />
      <span class="apm-count">{{ data?.nodes?.length ?? 0 }} 个节点 · {{ data?.calls?.length ?? 0 }} 条边 · {{ data?.layers?.length ?? 0 }} 层</span>
      <ReButton icon="Refresh" :loading="loading" title="刷新" @click="load" />
    </div>

    <ReSkeleton v-if="loading && !data" :rows="6" animated />

    <template v-else>
      <ReCard :radius="12" shadow="never">
        <template #header>
          <div class="apm-card-head">
            <span class="apm-card-h">分层视图</span>
            <span class="apm-muted">鼠标左键拖拽旋转 · 滚轮缩放</span>
          </div>
        </template>

        <ReEmpty v-if="!data?.nodes?.length" :image-size="70" description="该时间窗口内没有拓扑数据" />
        <div v-else class="infra-stage">
          <!-- autoRotate 是 ReThree 自己的能力（它每帧转 scene），
               因此这里直接透传，不自己写 RAF —— 两个循环转同一个 scene 会翻倍速度。 -->
          <ReThree :height="stageHeight" :auto-rotate="autoRotate" :auto-rotate-speed="0.5" @ready="onReady" />
        </div>
      </ReCard>

      <div class="apm-grid">
        <ReCard v-for="layer in data?.layers ?? []" :key="layer.name" :radius="12" shadow="never">
          <div class="infra-layer">
            <span class="infra-layer__dot" :style="{ background: layerColor(layer.name) }" />
            <span class="infra-layer__name apm-mono">{{ layer.name }}</span>
            <span class="apm-bar__spacer" />
            <span class="apm-mono">{{ layer.count }}</span>
          </div>
        </ReCard>
      </div>
    </template>

    <div v-if="!status.capabilities.includes('topology')" class="apm-muted">
      引擎 {{ status.name }} 不支持拓扑查询，因此也无法绘制基础设施图。
    </div>
  </ApmGate>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import ReButton from "@repo/ui/re-button";
import ReCard from "@repo/ui/re-card";
import ReEmpty from "@repo/ui/re-empty";
import ReSelect from "@repo/ui/re-select";
import ReSkeleton from "@repo/ui/re-skeleton";
import ReSwitch from "@repo/ui/re-switch";
import ReThree from "@repo/ui/re-three";
import type { ReThreeContext } from "@repo/ui/re-three";
import ApmGate from "../components/ApmGate.vue";
import { getInfra3D } from "../api/apmApi";
import type { ApmInfra3D, ApmInfraNode } from "../api/apmApi";
import { useApmStatus } from "../composables/useApmStatus";
import { WINDOW_OPTIONS } from "../utils/format";

const { present, ensure } = useApmStatus();

const data = ref<ApmInfra3D | null>(null);
const loading = ref(false);
const minutes = ref(30);
const autoRotate = ref(false);
const showEdges = ref(true);
const windowOptions = WINDOW_OPTIONS;

/** 画布高度固定：3D 场景需要一个确定的视口，跟着内容撑开会一直抖 */
const stageHeight = "560px";

/** 每层的颜色档：全部取系统 koi 根令牌（cssColor 从 :root 读，读不到
 *  .apm-page 作用域的桥接值）。主强调与页面一致，用品牌紫 --brand-500。 */
const LAYER_COLORS = [
  "var(--brand-500)",
  "var(--status-success)",
  "var(--status-warning)",
  "var(--metric-net)",
  "var(--status-error)",
];

function layerColor(name: string): string {
  // 未分层的节点最常见（SkyWalking 9.x 的 GENERAL 层在部分版本里为空），
  // 统一走品牌紫，和图例里主色一致。
  if (!name || name === "UNKNOWN") {
    return "var(--brand-500)";
  }
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  return LAYER_COLORS[hash % LAYER_COLORS.length];
}

/** 场景对象引用（用于配置变化时重建，而不是叠着画） */
let ctx: ReThreeContext | null = null;
let group: any = null;

/**
 * 分层布局：同一层的节点摆在同一高度的水平圆环上。
 *
 * <p>节点数确定，因此不需要力导向 —— 力导向每次重画的坐标都不一样，
 * 用户转动视角后刷新会突然「跳一下」。固定圆环反而让「这一层有几个服务」可数。</p>
 */
function buildScene(context: ReThreeContext) {
  const THREE = context.THREE;
  if (group) {
    context.scene.remove(group);
    group.traverse((obj: any) => {
      obj.geometry?.dispose?.();
      // 标签是 canvas 贴图，只 dispose material 不会释放 texture，重画几次就涨显存
      obj.material?.map?.dispose?.();
      obj.material?.dispose?.();
    });
    group = null;
  }
  if (!data.value?.nodes?.length) {
    return;
  }

  group = new THREE.Group();

  // 层 → 节点列表（保持后端返回顺序，颜色与图例一致）
  const byLayer = new Map<string, ApmInfraNode[]>();
  for (const node of data.value.nodes) {
    const layer = node.layer || "UNKNOWN";
    if (!byLayer.has(layer)) {
      byLayer.set(layer, []);
    }
    byLayer.get(layer)!.push(node);
  }

  const layers = [...byLayer.keys()];
  const layerGap = 70;
  const baseY = -((layers.length - 1) * layerGap) / 2;
  const positions = new Map<string, any>();

  layers.forEach((layer, layerIndex) => {
    const nodes = byLayer.get(layer)!;
    const radius = Math.max(75, nodes.length * 18);
    const y = baseY + layerIndex * layerGap;
    nodes.forEach((node, index) => {
      const angle = (index / Math.max(1, nodes.length)) * Math.PI * 2;
      const position = new THREE.Vector3(Math.cos(angle) * radius, y, Math.sin(angle) * radius);
      positions.set(node.id, position);

      const geometry = new THREE.SphereGeometry(node.real ? 11 : 8, 28, 20);
      const base = new THREE.Color(cssColor(layerColor(layer)));
      const material = new THREE.MeshStandardMaterial({
        color: base,
        // 只靠环境光+平行光，球体会被压成深海军蓝（主色亮、受光面才亮）；
        // 加一点自发光，节点在浅底上才是「有颜色的小球」而不是「暗块」
        emissive: base,
        emissiveIntensity: node.real ? 0.38 : 0.22,
        roughness: 0.42,
        metalness: 0.05,
        transparent: !node.real,
        opacity: node.real ? 1 : 0.55,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.copy(position);
      mesh.userData = { kind: "node", name: node.name, layer, type: node.type };
      group.add(mesh);

      // 节点名用 sprite 绘制：3D 场景里的文字必须贴在平面上，不能直接 add HTML
      const label = makeLabel(THREE, node.name);
      label.position.copy(position).add(new THREE.Vector3(0, 15, 0));
      group.add(label);
    });
  });

  if (showEdges.value && data.value.calls?.length) {
    const lineMaterial = new THREE.LineBasicMaterial({ color: new THREE.Color(cssColor("var(--text-tertiary)")), transparent: true, opacity: 0.45 });
    for (const call of data.value.calls) {
      const from = positions.get(call.source);
      const to = positions.get(call.target);
      if (!from || !to) {
        continue;
      }
      const geometry = new THREE.BufferGeometry().setFromPoints([from, to]);
      // 所有边共用一份材质：每条边 clone 一份会让 dispose 变成一个逐条跑循环的负担
      group.add(new THREE.Line(geometry, lineMaterial));
    }
  }

  context.scene.add(group);

  // 相机只在首次建场景时定位：之后用户可能已经转过角度，
  // 切换「显示调用边」时重建对象不该把视角掰回去。
  if (!cameraPlaced) {
    const distance = 210 + layers.length * 30;
    orbit.radius = distance;
    applyOrbit(context);
    cameraPlaced = true;
  }
}

/**
 * 轨道参数（球坐标）。
 *
 * <p>ReThree 只负责建场景与渲染循环，不带 OrbitControls —— 交互在这里自己实现：
 * 拖拽改 theta / phi，滚轮改半径。这样既满足「可拖拽旋转、滚轮缩放」的承诺，
 * 又不用为了一次交互往包里加 three/examples 的依赖。</p>
 */
const orbit = { radius: 400, theta: 0.5, phi: 1.1 };

/** 相机是否已定位过（避免重建场景时重置视角） */
let cameraPlaced = false;

/** 按球坐标把相机摆到位并看向原点 */
function applyOrbit(context: ReThreeContext) {
  const { x, y, z } = sphericalToCartesian(orbit.radius, orbit.phi, orbit.theta);
  context.camera.position.set(x, y, z);
  context.camera.lookAt(0, 0, 0);
}

function sphericalToCartesian(radius: number, phi: number, theta: number) {
  return {
    x: radius * Math.sin(phi) * Math.sin(theta),
    y: radius * Math.cos(phi),
    z: radius * Math.sin(phi) * Math.cos(theta),
  };
}

/** 交互状态：按下点与当时的球坐标 */
const drag = { active: false, x: 0, y: 0, theta: 0, phi: 0 };

function onPointerDown(event: PointerEvent) {
  if (event.button !== 0) {
    return;
  }
  drag.active = true;
  drag.x = event.clientX;
  drag.y = event.clientY;
  drag.theta = orbit.theta;
  drag.phi = orbit.phi;
  (event.target as HTMLElement)?.setPointerCapture?.(event.pointerId);
}

function onPointerMove(event: PointerEvent) {
  if (!drag.active || !ctx) {
    return;
  }
  // 0.01 rad/px：转一圈约需 630px 位移，手感接近常见 3D 图表
  const scale = 0.01;
  orbit.theta = drag.theta - (event.clientX - drag.x) * scale;
  // phi 限制在 (0, π)：越过两极会让相机翻转，图会突然上下颠倒
  orbit.phi = Math.min(Math.PI - 0.08, Math.max(0.08, drag.phi - (event.clientY - drag.y) * scale));
  applyOrbit(ctx);
}

function onPointerUp(event: PointerEvent) {
  drag.active = false;
  (event.target as HTMLElement)?.releasePointerCapture?.(event.pointerId);
}

function onWheel(event: WheelEvent) {
  if (!ctx) {
    return;
  }
  // 阻止页面跟着滚：3D 画布上滚轮的语义是缩放，不是滚动文档
  event.preventDefault();
  const factor = event.deltaY > 0 ? 1.12 : 1 / 1.12;
  orbit.radius = Math.min(3000, Math.max(120, orbit.radius * factor));
  applyOrbit(ctx);
}

/** 绑定的 DOM（卸载时要摘掉监听，否则离开页面后仍持有 ctx） */
let canvasEl: HTMLCanvasElement | null = null;

function bindInteraction(context: ReThreeContext) {
  canvasEl = context.renderer.domElement;
  canvasEl.style.cursor = "grab";
  canvasEl.addEventListener("pointerdown", onPointerDown);
  canvasEl.addEventListener("pointermove", onPointerMove);
  canvasEl.addEventListener("pointerup", onPointerUp);
  canvasEl.addEventListener("pointercancel", onPointerUp);
  canvasEl.addEventListener("wheel", onWheel, { passive: false });
}

function unbindInteraction() {
  if (!canvasEl) {
    return;
  }
  canvasEl.removeEventListener("pointerdown", onPointerDown);
  canvasEl.removeEventListener("pointermove", onPointerMove);
  canvasEl.removeEventListener("pointerup", onPointerUp);
  canvasEl.removeEventListener("pointercancel", onPointerUp);
  canvasEl.removeEventListener("wheel", onWheel);
  canvasEl = null;
}

/**
 * 把 CSS 变量解析成真实色值。
 *
 * <p>three 的 Color 不认 {@code var(--x)}，必须拿到计算后的 rgb 字符串；
 * 解析不到时退回中性灰，保证场景不会因为主题变量缺失而变全黑。</p>
 */
function cssColor(value: string): string {
  if (!value.startsWith("var(")) {
    return value;
  }
  const name = value.slice(4, -1).trim();
  const resolved = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return resolved || "#909399";
}

/** 用 canvas 生成文字贴图（避免引入 three 的额外字体加载器） */
function makeLabel(THREE: ReThreeContext["THREE"], text: string) {
  const canvas = document.createElement("canvas");
  const scale = 2;
  const fontSize = 22;
  const context = canvas.getContext("2d")!;
  context.font = `${fontSize * scale}px sans-serif`;
  const width = Math.ceil(context.measureText(text).width) + 12 * scale;
  const height = (fontSize + 10) * scale;
  canvas.width = width;
  canvas.height = height;

  const paint = canvas.getContext("2d")!;
  paint.font = `${fontSize * scale}px sans-serif`;
  paint.textBaseline = "middle";
  paint.fillStyle = cssColor("var(--text-primary)");
  paint.fillText(text, 6 * scale, height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(width / scale / 3.4, height / scale / 3.4, 1);
  return sprite;
}

function onReady(context: ReThreeContext) {
  ctx = context;
  bindInteraction(context);
  buildScene(context);
}

async function load() {
  await ensure();
  if (!present.value) {
    return;
  }
  loading.value = true;
  try {
    data.value = await getInfra3D({ minutes: minutes.value });
    if (ctx) {
      buildScene(ctx);
    }
  } catch {
    data.value = null;
  } finally {
    loading.value = false;
  }
}

// 开关变化只重建场景，不重新请求 —— 边是纯客户端渲染，
// 自动旋转由 ReThree 的 autoRotate 处理（见模板），这里不用重建。
watch(showEdges, () => {
  if (ctx && data.value) {
    buildScene(ctx);
  }
});

// 首屏取一次数据：没有 onMounted 的话页面会一直停在「该时间窗口内没有拓扑数据」，
// 用户以为是没数据，其实是根本没请求。ReThree 的 ready 在挂载后才来，因此
// 数据先到、场景后建也是安全的（buildScene 里对 ctx 判空，onReady 里也会重建）。
onMounted(load);

onBeforeUnmount(() => {
  unbindInteraction();
  group = null;
  ctx = null;
  cameraPlaced = false;
});
</script>

<style scoped>
.infra-stage {
  position: relative;
  border-radius: var(--radius-md, 8px);
  overflow: hidden;
  /* 3D 舞台：与宿主卡片同色的纯底 + 细边框，不铺点阵/光晕 */
  background: linear-gradient(180deg, var(--bg-elevated, #fbfbff), var(--bg-container, #fff));
  box-shadow: inset 0 0 0 1px var(--border-subtle, #eef0f6);
}

.infra-layer {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
}

.infra-layer__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.infra-layer__name {
  color: var(--text-secondary, var(--el-text-color-regular));
}
</style>
