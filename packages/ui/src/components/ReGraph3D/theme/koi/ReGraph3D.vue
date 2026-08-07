<script setup lang="ts">
/**
 * ReGraph3D koi 主题 —— 精简版 3D 关系图
 *
 * 与 default 主题差异：
 *   - 移除顶部工具栏，仅保留 3D 画布
 *   - 节点/连线更克制（无文本标签、无箭头）
 *   - 自动旋转（关闭交互）
 *   - 适合纯展示场景（仪表盘背景）
 */
import {
  computed,
  onBeforeUnmount,
  onMounted,
  ref,
  shallowRef,
  watch,
} from "vue";
import * as THREE from "three";
import {
  forceCenter,
  forceLink,
  forceManyBody,
  forceSimulation,
  type Simulation,
  type SimulationLinkDatum,
  type SimulationNodeDatum,
} from "d3-force";
import { buildContainerStyle } from "../../../ReGraph/internals";
import type { Graph3DData, Graph3DNode, Graph3DLink } from "../../internals";

defineOptions({ name: "ReGraph3D" });

interface SimNode extends SimulationNodeDatum {
  id: string;
  text: string;
  group: string;
  val: number;
  color: string;
  data?: Record<string, unknown>;
  mesh?: THREE.Object3D;
  baseColor: THREE.Color;
  z?: number;
}

interface SimLink extends SimulationLinkDatum<SimNode> {
  id: string;
  source: string | SimNode;
  target: string | SimNode;
  color: string;
  line?: THREE.Line;
}

const props = withDefaults(
  defineProps<{
    data?: Graph3DData;
    nodes?: Graph3DNode[];
    links?: Graph3DLink[];
    height?: string | number;
    width?: string | number;
    nodeColors?: Record<string, string>;
    nodeRelSize?: number;
    backgroundColor?: string;
    cameraDistance?: number;
    autoRotate?: boolean;
    interactive?: boolean;
  }>(),
  {
    data: undefined,
    nodes: undefined,
    links: undefined,
    height: "100%",
    width: "100%",
    nodeColors: () => ({
      default: "#5b8def",
      A: "#5b8def",
      B: "#22c55e",
      C: "#f59e0b",
      D: "#ef4444",
      E: "#a855f7",
    }),
    nodeRelSize: 3,
    backgroundColor: "transparent",
    cameraDistance: 600,
    autoRotate: true,
    interactive: false,
  },
);

const emit = defineEmits<{
  (e: "ready", instance: unknown): void;
  (e: "node-click", node: Graph3DNode): void;
}>();

const containerRef = ref<HTMLDivElement | null>(null);
const instance = shallowRef<unknown>(null);

const containerStyle = computed(() =>
  buildContainerStyle(props.width, props.height),
);

const finalData = computed<Graph3DData>(() => {
  if (props.data) return props.data;
  return {
    nodes: props.nodes ?? [],
    links: props.links ?? [],
  };
});

let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let renderer: THREE.WebGLRenderer;
let simulation: Simulation<SimNode, SimLink>;
let simNodes: SimNode[];
let simLinks: SimLink[];
let animationId: number | null = null;
let nodeGroup: THREE.Group;
let linkGroup: THREE.Group;
let rotateEnabled = false;

function initScene() {
  if (!containerRef.value) return;
  const w = containerRef.value.clientWidth;
  const h = containerRef.value.clientHeight;

  scene = new THREE.Scene();
  if (props.backgroundColor !== "transparent") {
    scene.background = new THREE.Color(props.backgroundColor);
  }

  camera = new THREE.PerspectiveCamera(45, w / h, 1, 5000);
  camera.position.set(0, 0, props.cameraDistance);

  renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(w, h);
  containerRef.value.appendChild(renderer.domElement);

  scene.add(new THREE.AmbientLight(0xffffff, 0.6));
  const dir = new THREE.DirectionalLight(0xffffff, 1);
  dir.position.set(200, 300, 400);
  scene.add(dir);

  nodeGroup = new THREE.Group();
  linkGroup = new THREE.Group();
  scene.add(nodeGroup, linkGroup);

  if (props.interactive) {
    setupInteraction();
  }

  rotateEnabled = props.autoRotate;

  const ro = new ResizeObserver(() => {
    if (!containerRef.value) return;
    const cw = containerRef.value.clientWidth;
    const ch = containerRef.value.clientHeight;
    if (cw === 0 || ch === 0) return;
    camera.aspect = cw / ch;
    camera.updateProjectionMatrix();
    renderer.setSize(cw, ch);
  });
  ro.observe(containerRef.value);
}

function buildSimulation() {
  const incoming = finalData.value;
  const incomingNodes = incoming.nodes ?? [];
  const incomingLinks = incoming.links ?? [];

  const degree: Record<string, number> = {};
  incomingLinks.forEach((l) => {
    const s = typeof l.source === "string" ? l.source : l.source;
    const t = typeof l.target === "string" ? l.target : l.target;
    if (s) degree[s] = (degree[s] || 0) + 1;
    if (t) degree[t] = (degree[t] || 0) + 1;
  });

  simNodes = incomingNodes.map((n) => {
    const group = n.group || "default";
    const colorHex =
      n.color || props.nodeColors[group] || props.nodeColors.default || "#5b8def";
    return {
      id: n.id,
      text: n.text || n.id,
      group,
      val: n.val ?? (degree[n.id] || 1),
      color: colorHex,
      data: n.data,
      baseColor: new THREE.Color(colorHex),
    } as SimNode;
  });

  simLinks = incomingLinks.map((l, i) => ({
    id: `${l.source}-${l.target}-${i}`,
    source: l.source,
    target: l.target,
    color: l.color || "#888888",
  })) as SimLink[];

  // 清理旧的
  while (nodeGroup.children.length) {
    const c = nodeGroup.children[0];
    nodeGroup.remove(c);
    disposeObject(c);
  }
  while (linkGroup.children.length) {
    const c = linkGroup.children[0];
    linkGroup.remove(c);
    disposeObject(c);
  }

  simNodes.forEach((n) => {
    const radius = Math.max(1.5, Math.sqrt(n.val || 1) * props.nodeRelSize);
    const geo = new THREE.SphereGeometry(radius, 12, 10);
    const mat = new THREE.MeshLambertMaterial({
      color: n.baseColor,
      transparent: true,
      opacity: 0.85,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(n.x ?? 0, n.y ?? 0, n.z ?? 0);
    mesh.userData = { id: n.id };
    nodeGroup.add(mesh);
    n.mesh = mesh;
  });

  simLinks.forEach((l) => {
    const mat = new THREE.LineBasicMaterial({
      color: new THREE.Color(l.color || "#888888"),
      transparent: true,
      opacity: 0.35,
    });
    const geo = new THREE.BufferGeometry();
    geo.setAttribute(
      "position",
      new THREE.Float32BufferAttribute([0, 0, 0, 0, 0, 0], 3),
    );
    const line = new THREE.Line(geo, mat);
    linkGroup.add(line);
    l.line = line;
  });
}

function buildSimulationForce() {
  simulation = forceSimulation<SimNode>(simNodes)
    .force(
      "link",
      forceLink<SimNode, SimLink>(simLinks)
        .id((d) => d.id)
        .distance(80)
        .strength(0.5),
    )
    .force("charge", forceManyBody<SimNode>().strength(-60))
    .force(
      "center",
      forceCenter<SimNode>(0, 0).strength(0.05),
    )
    .alphaDecay(0.012)
    .on("tick", tick);
}

function tick() {
  simNodes.forEach((n) => {
    if (n.mesh) n.mesh.position.set(n.x ?? 0, n.y ?? 0, n.z ?? 0);
  });
  simLinks.forEach((l) => {
    const s = l.source as SimNode;
    const t = l.target as SimNode;
    if (!s || !t || !l.line) return;
    const positions = (l.line.geometry.attributes.position as THREE.BufferAttribute)
      .array as Float32Array;
    positions[0] = s.x ?? 0;
    positions[1] = s.y ?? 0;
    positions[2] = s.z ?? 0;
    positions[3] = t.x ?? 0;
    positions[4] = t.y ?? 0;
    positions[5] = t.z ?? 0;
    l.line.geometry.attributes.position.needsUpdate = true;
  });
}

function animate() {
  animationId = requestAnimationFrame(animate);
  if (rotateEnabled) {
    const angle = 0.0015;
    const x = camera.position.x;
    const z = camera.position.z;
    camera.position.x = x * Math.cos(angle) - z * Math.sin(angle);
    camera.position.z = x * Math.sin(angle) + z * Math.cos(angle);
  }
  camera.lookAt(0, 0, 0);
  renderer.render(scene, camera);
}

function start() {
  if (animationId) return;
  animate();
}

function stop() {
  if (animationId !== null) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }
}

function disposeObject(obj: THREE.Object3D) {
  obj.traverse((child) => {
    const m = child as THREE.Mesh;
    if (m.geometry) m.geometry.dispose();
    const mat = m.material as THREE.Material | THREE.Material[];
    if (Array.isArray(mat)) mat.forEach((x) => x.dispose());
    else if (mat) mat.dispose();
  });
}

function destroy() {
  stop();
  if (simulation) simulation.stop();
  if (renderer) {
    renderer.dispose();
    renderer.domElement.remove();
  }
  instance.value = null;
}

let pointerDown = false;
let pointerStart = { x: 0, y: 0 };
let camStart = { x: 0, y: 0, z: 0 };

function setupInteraction() {
  const dom = renderer.domElement;
  dom.addEventListener("pointerdown", (ev) => {
    pointerDown = true;
    pointerStart = { x: ev.clientX, y: ev.clientY };
    camStart = { x: camera.position.x, y: camera.position.y, z: camera.position.z };
    dom.setPointerCapture(ev.pointerId);
  });
  dom.addEventListener("pointermove", (ev) => {
    if (!pointerDown) return;
    const dx = ev.clientX - pointerStart.x;
    const dy = ev.clientY - pointerStart.y;
    camera.position.x = camStart.x + dx * 0.6;
    camera.position.y = camStart.y - dy * 0.6;
  });
  dom.addEventListener("pointerup", () => {
    pointerDown = false;
  });
  dom.addEventListener("wheel", (ev) => {
    ev.preventDefault();
    camera.position.multiplyScalar(ev.deltaY > 0 ? 1.05 : 0.95);
  }, { passive: false });
}

onMounted(() => {
  initScene();
  buildSimulation();
  buildSimulationForce();
  start();
  instance.value = { scene, camera, renderer, simulation };
  emit("ready", instance.value);
});

watch(
  () => finalData.value,
  () => {
    if (!scene) return;
    buildSimulation();
    buildSimulationForce();
  },
  { deep: true },
);

watch(
  () => props.autoRotate,
  (v) => {
    rotateEnabled = v;
  },
);

watch(
  () => props.backgroundColor,
  (v) => {
    if (!scene) return;
    scene.background = v === "transparent" ? null : new THREE.Color(v);
  },
);

onBeforeUnmount(() => {
  destroy();
});

defineExpose({
  instance,
  fitView: () => camera.position.set(0, 0, props.cameraDistance),
});
</script>

<template>
  <div class="re-graph-3d-koi" :style="containerStyle">
    <div ref="containerRef" class="re-graph-3d-koi__canvas" />
    <slot name="overlay" :data="finalData" :instance="instance" />
  </div>
</template>

<style scoped>
.re-graph-3d-koi {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 240px;
  overflow: hidden;
  border-radius: var(--el-border-radius-base, 8px);
  background: var(--el-fill-color-blank);
}
.re-graph-3d-koi__canvas {
  position: absolute;
  inset: 0;
}
</style>
