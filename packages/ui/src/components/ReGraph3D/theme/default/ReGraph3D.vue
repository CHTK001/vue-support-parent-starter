<script setup lang="ts">
/**
 * ReGraph3D default 主题 —— 3D 力导向关系图（功能完整版）
 *
 * 底层实现：three.js + d3-force-3d 模拟 3d-force-graph 算法
 * （自行实现，不引入第三方 3d-force-graph 包）。
 *
 * 功能：
 *   - 3D 渲染（WebGL/three.js）
 *   - 力导向布局（基于 d3-force-3d 算法）
 *   - 鼠标拖拽旋转 / 滚轮缩放
 *   - 自动旋转
 *   - 节点悬停高亮 / 节点点击事件
 *   - 颜色按 group 分组 / 自定义
 *   - 节点大小按 val / 度数计算
 *   - 方向箭头
 *   - 节点/连线文本标签
 */
import {
  computed,
  onBeforeUnmount,
  onMounted,
  reactive,
  ref,
  shallowRef,
  watch,
} from "vue";
import { ElMessage } from "element-plus";
import {
  FullScreen,
  VideoPause,
  Refresh,
  Search,
  VideoPlay,
  ZoomIn,
  ZoomOut,
} from "@element-plus/icons-vue";
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
import {
  buildContainerStyle,
  fuzzyMatchNodes,
  splitKeywords,
} from "../../../ReGraph/internals";
import type {
  Graph3DData,
  Graph3DLink,
  Graph3DNode,
} from "../../internals";

defineOptions({ name: "ReGraph3D" });

/** 内部模拟节点（继承 d3 SimulationNodeDatum + z 轴） */
interface SimNode extends SimulationNodeDatum {
  id: string;
  text: string;
  group: string;
  val: number;
  color: string;
  data?: Record<string, unknown>;
  mesh?: THREE.Object3D;
  label?: THREE.Sprite;
  baseColor: THREE.Color;
  /** 3D 坐标（d3-force 默认不含 z，由我们扩展） */
  z?: number;
}

interface SimLink extends SimulationLinkDatum<SimNode> {
  id: string;
  source: string | SimNode;
  target: string | SimNode;
  text?: string;
  color: string;
  width: number;
  line?: THREE.Object3D;
  arrow?: THREE.Object3D;
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
    showNodeLabel?: boolean;
    showLinkLabel?: boolean;
    linkWidth?: number;
    linkArrowLength?: number;
    forceChargeStrength?: number;
    forceLinkDistance?: number;
    forceCenterStrength?: number;
    cameraDistance?: number;
    autoRotate?: boolean;
    interactive?: boolean;
    debug?: boolean;
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
    nodeRelSize: 4,
    backgroundColor: "transparent",
    showNodeLabel: true,
    showLinkLabel: false,
    linkWidth: 1,
    linkArrowLength: 6,
    forceChargeStrength: -90,
    forceLinkDistance: 60,
    forceCenterStrength: 0.05,
    cameraDistance: 800,
    autoRotate: false,
    interactive: true,
    debug: false,
  },
);

const emit = defineEmits<{
  (e: "ready", instance: unknown): void;
  (e: "node-click", node: Graph3DNode): void;
  (e: "node-hover", node: Graph3DNode | null): void;
  (e: "link-click", link: Graph3DLink): void;
}>();

/** 容器引用 */
const containerRef = ref<HTMLDivElement | null>(null);

/** Three.js 实例引用（暴露给外部） */
const instance = shallowRef<{
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  simulation: Simulation<SimNode, SimLink>;
  pause: () => void;
  resume: () => void;
  restart: () => void;
  zoomTo: (distance: number) => void;
  focusNode: (id: string) => void;
  fitView: () => void;
} | null>(null);

/** 状态 */
const state = reactive({
  loading: false,
  paused: false,
  rotate: false,
  keyword: "",
  hoveredId: null as string | null,
});

/** 容器样式 */
const containerStyle = computed(() =>
  buildContainerStyle(props.width, props.height),
);

/** 归一化最终数据 */
const finalData = computed<Graph3DData>(() => {
  if (props.data) return props.data;
  return {
    nodes: props.nodes ?? [],
    links: props.links ?? [],
  };
});

// ============================================================
// Three.js 场景搭建
// ============================================================

let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let renderer: THREE.WebGLRenderer;
let simulation: Simulation<SimNode, SimLink>;
let simNodes: SimNode[];
let simLinks: SimLink[];
let animationId: number | null = null;
let nodeGroup: THREE.Group;
let linkGroup: THREE.Group;
let raycaster: THREE.Raycaster;
let pointer: THREE.Vector2;

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

  // 灯光
  const ambient = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambient);
  const directional = new THREE.DirectionalLight(0xffffff, 1);
  directional.position.set(200, 300, 400);
  scene.add(directional);
  const back = new THREE.DirectionalLight(0xffffff, 0.4);
  back.position.set(-300, -100, -200);
  scene.add(back);

  nodeGroup = new THREE.Group();
  linkGroup = new THREE.Group();
  scene.add(nodeGroup);
  scene.add(linkGroup);

  raycaster = new THREE.Raycaster();
  pointer = new THREE.Vector2();

  setupInteraction();
  setupResize();
}

/** 创建节点球体 + 文本标签 */
function createNodeMesh(node: SimNode) {
  const radius = Math.max(2, Math.sqrt(node.val || 1) * props.nodeRelSize);
  const geometry = new THREE.SphereGeometry(radius, 16, 12);
  const material = new THREE.MeshLambertMaterial({
    color: node.baseColor,
    emissive: node.baseColor.clone().multiplyScalar(0.15),
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(node.x ?? 0, node.y ?? 0, node.z ?? 0);
  mesh.userData = { id: node.id, type: "node" };
  nodeGroup.add(mesh);

  if (props.showNodeLabel) {
    const sprite = makeTextSprite(node.text || node.id, node.baseColor);
    sprite.position.set(0, radius + 4, 0);
    mesh.add(sprite);
    node.label = sprite;
  }
  node.mesh = mesh;
}

/** 创建连线 Line + 箭头 */
function createLinkMesh(link: SimLink) {
  const color = new THREE.Color(link.color || "#888888");
  const material = new THREE.LineBasicMaterial({
    color,
    transparent: true,
    opacity: 0.55,
  });
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute([0, 0, 0, 0, 0, 0], 3),
  );
  const line = new THREE.Line(geometry, material);
  line.userData = { id: link.id, type: "link" };
  linkGroup.add(line);
  link.line = line;

  // 箭头（用 ConeGeometry 表示方向）
  if (props.linkArrowLength > 0) {
    const arrowGeom = new THREE.ConeGeometry(2, props.linkArrowLength, 8);
    const arrowMat = new THREE.MeshBasicMaterial({ color });
    const arrow = new THREE.Mesh(arrowGeom, arrowMat);
    arrow.visible = false;
    arrow.userData = { id: link.id, type: "arrow" };
    linkGroup.add(arrow);
    link.arrow = arrow;
  }
}

/** 文本精灵（用 Canvas 贴图实现） */
function makeTextSprite(text: string, color: THREE.Color): THREE.Sprite {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;
  const fontSize = 28;
  ctx.font = `${fontSize}px sans-serif`;
  const metrics = ctx.measureText(text);
  canvas.width = metrics.width + 16;
  canvas.height = fontSize + 12;
  ctx.font = `${fontSize}px sans-serif`;
  ctx.fillStyle = "rgba(255,255,255,0.92)";
  ctx.strokeStyle = "rgba(0,0,0,0.4)";
  ctx.lineWidth = 3;
  ctx.textBaseline = "middle";
  ctx.textAlign = "center";
  ctx.strokeText(text, canvas.width / 2, canvas.height / 2);
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);
  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
  });
  const sprite = new THREE.Sprite(material);
  const scale = 6;
  sprite.scale.set(
    (canvas.width / canvas.height) * scale,
    scale,
    1,
  );
  return sprite;
}

/** 构建模拟数据 */
function buildSimulation() {
  const incoming = finalData.value;
  const incomingNodes = incoming.nodes ?? [];
  const incomingLinks = incoming.links ?? [];

  // 统计度数作为 val 默认值
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
    text: l.text,
    color: l.color || "#888888",
    width: l.width ?? props.linkWidth,
  })) as SimLink[];

  // 清理旧的 mesh
  while (nodeGroup.children.length) {
    const child = nodeGroup.children[0];
    nodeGroup.remove(child);
    disposeObject(child);
  }
  while (linkGroup.children.length) {
    const child = linkGroup.children[0];
    linkGroup.remove(child);
    disposeObject(child);
  }

  simNodes.forEach((n) => createNodeMesh(n));
  simLinks.forEach((l) => createLinkMesh(l));
}

/** 构建力学模拟 */
function buildSimulationForce() {
  simulation = forceSimulation<SimNode>(simNodes)
    .force(
      "link",
      forceLink<SimNode, SimLink>(simLinks)
        .id((d) => d.id)
        .distance(props.forceLinkDistance)
        .strength(0.6),
    )
    .force("charge", forceManyBody<SimNode>().strength(props.forceChargeStrength))
    .force(
      "center",
      forceCenter<SimNode>(0, 0).strength(props.forceCenterStrength),
    )
    .alphaDecay(0.015)
    .on("tick", tick);
}

/** 每帧更新位置 */
function tick() {
  simNodes.forEach((node) => {
    if (node.mesh) {
      node.mesh.position.set(node.x ?? 0, node.y ?? 0, node.z ?? 0);
    }
  });
  simLinks.forEach((link) => {
    const s = link.source as SimNode;
    const t = link.target as SimNode;
    if (!s || !t || !link.line) return;
    const line = link.line as THREE.Line;
    const positions = (line.geometry.attributes.position as THREE.BufferAttribute)
      .array as Float32Array;
    positions[0] = s.x ?? 0;
    positions[1] = s.y ?? 0;
    positions[2] = s.z ?? 0;
    positions[3] = t.x ?? 0;
    positions[4] = t.y ?? 0;
    positions[5] = t.z ?? 0;
    line.geometry.attributes.position.needsUpdate = true;
    if (link.arrow) {
      const dx = (t.x ?? 0) - (s.x ?? 0);
      const dy = (t.y ?? 0) - (s.y ?? 0);
      const dz = (t.z ?? 0) - (s.z ?? 0);
      const len = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (len > 0) {
        // 把箭头放在距 target 节点半径+箭头长度处，朝向 target
        const tr = Math.max(2, Math.sqrt(t.val || 1) * props.nodeRelSize);
        const dirX = dx / len;
        const dirY = dy / len;
        const dirZ = dz / len;
        const arrowLen = props.linkArrowLength;
        link.arrow.position.set(
          (t.x ?? 0) - dirX * (tr + arrowLen / 2),
          (t.y ?? 0) - dirY * (tr + arrowLen / 2),
          (t.z ?? 0) - dirZ * (tr + arrowLen / 2),
        );
        link.arrow.visible = true;
        link.arrow.lookAt(t.x ?? 0, t.y ?? 0, t.z ?? 0);
        link.arrow.rotateX(Math.PI / 2);
      }
    }
  });
}

/** 渲染循环 */
function animate() {
  animationId = requestAnimationFrame(animate);
  if (state.rotate && !state.paused) {
    const angle = 0.002;
    const x = camera.position.x;
    const z = camera.position.z;
    camera.position.x = x * Math.cos(angle) - z * Math.sin(angle);
    camera.position.z = x * Math.sin(angle) + z * Math.cos(angle);
  }
  camera.lookAt(0, 0, 0);
  if (renderer && scene && camera) renderer.render(scene, camera);
}

function startAnimation() {
  if (animationId) return;
  animate();
}

function stopAnimation() {
  if (animationId !== null) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }
}

// ============================================================
// 交互：拖拽旋转 / 滚轮缩放 / 节点拾取
// ============================================================

let isPointerDown = false;
let pointerStart = { x: 0, y: 0 };
let cameraStart = { x: 0, y: 0, z: 0 };

function setupInteraction() {
  if (!props.interactive || !renderer) return;
  const dom = renderer.domElement;

  dom.addEventListener("pointerdown", (ev) => {
    isPointerDown = true;
    pointerStart = { x: ev.clientX, y: ev.clientY };
    cameraStart = {
      x: camera.position.x,
      y: camera.position.y,
      z: camera.position.z,
    };
    dom.setPointerCapture(ev.pointerId);
  });
  dom.addEventListener("pointermove", (ev) => {
    if (!isPointerDown) {
      pickAtPointer(ev);
      return;
    }
    const dx = ev.clientX - pointerStart.x;
    const dy = ev.clientY - pointerStart.y;
    const factor = 1;
    camera.position.x = cameraStart.x + dx * factor;
    camera.position.y = cameraStart.y - dy * factor;
  });
  dom.addEventListener("pointerup", (ev) => {
    if (isPointerDown) {
      isPointerDown = false;
      try {
        dom.releasePointerCapture(ev.pointerId);
      } catch {
        /* ignore */
      }
    }
  });
  dom.addEventListener("wheel", (ev) => {
    ev.preventDefault();
    const dir = ev.deltaY > 0 ? 1.05 : 0.95;
    camera.position.multiplyScalar(dir);
  }, { passive: false });

  dom.addEventListener("click", (ev) => {
    pickAtPointer(ev, true);
  });
}

/** 拾取节点 */
function pickAtPointer(ev: PointerEvent, fireClick = false) {
  if (!containerRef.value) return;
  const rect = containerRef.value.getBoundingClientRect();
  pointer.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const intersects = raycaster.intersectObjects(nodeGroup.children);
  if (intersects.length > 0) {
    const hit = intersects[0].object as THREE.Mesh;
    const id = hit.userData?.id as string | undefined;
    const simNode = simNodes.find((n) => n.id === id);
    if (!simNode) return;
    if (fireClick) {
      emit("node-click", {
        id: simNode.id,
        text: simNode.text,
        group: simNode.group,
        val: simNode.val,
        color: simNode.color,
        data: simNode.data,
      });
    } else {
      state.hoveredId = simNode.id;
      emit("node-hover", {
        id: simNode.id,
        text: simNode.text,
        group: simNode.group,
        val: simNode.val,
        color: simNode.color,
        data: simNode.data,
      });
    }
  } else if (!fireClick) {
    if (state.hoveredId) {
      state.hoveredId = null;
      emit("node-hover", null);
    }
  }
}

/** 自适应容器尺寸 */
function setupResize() {
  if (!containerRef.value) return;
  const ro = new ResizeObserver(() => {
    if (!containerRef.value) return;
    const w = containerRef.value.clientWidth;
    const h = containerRef.value.clientHeight;
    if (w === 0 || h === 0) return;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  });
  ro.observe(containerRef.value);
}

/** 销毁场景 */
function disposeObject(obj: THREE.Object3D) {
  obj.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (mesh.geometry) mesh.geometry.dispose();
    const mat = mesh.material as THREE.Material | THREE.Material[];
    if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
    else if (mat) mat.dispose();
    const sprite = child as THREE.Sprite;
    if (sprite.material) {
      const spriteMat = sprite.material as THREE.SpriteMaterial;
      spriteMat.map?.dispose();
      spriteMat.dispose();
    }
  });
}

function destroyScene() {
  stopAnimation();
  if (simulation) simulation.stop();
  if (renderer) {
    renderer.dispose();
    renderer.domElement.remove();
  }
  instance.value = null;
}

// ============================================================
// 数据驱动：data 变化时重建
// ============================================================

function rebuild() {
  if (!scene) return;
  state.loading = true;
  try {
    buildSimulation();
    buildSimulationForce();
  } finally {
    state.loading = false;
  }
}

onMounted(() => {
  initScene();
  rebuild();
  startAnimation();
  instance.value = {
    scene: scene!,
    camera: camera!,
    renderer: renderer!,
    simulation: simulation!,
    pause: () => {
      simulation.stop();
      state.paused = true;
    },
    resume: () => {
      simulation.alpha(0.3).restart();
      state.paused = false;
    },
    restart: () => {
      simulation.alpha(0.8).restart();
      state.paused = false;
    },
    zoomTo: (distance: number) => {
      const dir = camera.position.clone().normalize();
      camera.position.copy(dir.multiplyScalar(distance));
    },
    focusNode: (id: string) => {
      const node = simNodes.find((n) => n.id === id);
      if (!node) return;
      camera.position.set(
        (node.x ?? 0) * 2,
        (node.y ?? 0) * 2,
        (node.z ?? 0) * 2 + props.cameraDistance,
      );
    },
    fitView: () => {
      camera.position.set(0, 0, props.cameraDistance);
    },
  };
  emit("ready", instance.value);
});

watch(
  () => finalData.value,
  () => {
    rebuild();
  },
  { deep: true },
);

watch(
  () => props.backgroundColor,
  () => {
    if (!scene) return;
    if (props.backgroundColor === "transparent") {
      scene.background = null;
    } else {
      scene.background = new THREE.Color(props.backgroundColor);
    }
  },
);

watch(
  () => props.showNodeLabel,
  (val) => {
    simNodes?.forEach((n) => {
      if (n.label) n.label.visible = val;
    });
  },
);

watch(
  () => props.autoRotate,
  (val) => {
    state.rotate = val;
  },
  { immediate: true },
);

onBeforeUnmount(() => {
  destroyScene();
});

// ============================================================
// 搜索高亮
// ============================================================

watch(
  () => state.keyword,
  (kw) => {
    if (!simNodes) return;
    if (!kw.trim()) {
      simNodes.forEach((n) => {
        if (n.mesh) {
          (n.mesh as THREE.Mesh).scale.setScalar(1);
        }
      });
      return;
    }
    const keywords = splitKeywords(kw);
    const matched = new Set<string>();
    const plainNodes = simNodes.map((n) => ({
      id: n.id,
      text: n.text,
    }));
    keywords.forEach((k: string) => {
      fuzzyMatchNodes(plainNodes, k).forEach((n) => matched.add(n.id));
    });
    simNodes.forEach((n) => {
      if (!n.mesh) return;
      const isMatch = matched.has(n.id);
      (n.mesh as THREE.Mesh).scale.setScalar(isMatch ? 1.6 : 0.6);
    });
  },
);

// ============================================================
// 暴露 API
// ============================================================

function zoom(delta: number) {
  const cur = camera.position.length();
  camera.position.multiplyScalar(cur > 0 ? delta : 1);
}

function restart() {
  simulation?.alpha(0.8).restart();
  state.paused = false;
}

function fitView() {
  camera.position.set(0, 0, props.cameraDistance);
}

function toggleRotate() {
  state.rotate = !state.rotate;
}

defineExpose({
  instance,
  zoom,
  restart,
  fitView,
  toggleRotate,
  pause: () => {
    simulation?.stop();
    state.paused = true;
  },
  resume: () => {
    simulation?.alpha(0.3).restart();
    state.paused = false;
  },
});
</script>

<template>
  <div class="re-graph-3d" :style="containerStyle">
    <!-- 顶部工具栏 -->
    <div class="re-graph-3d__toolbar">
      <div class="re-graph-3d__toolbar-left">
        <el-input
          v-model="state.keyword"
          placeholder="搜索节点"

          clearable
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
      </div>
      <div class="re-graph-3d__toolbar-right">
        <el-button-group >
          <el-button @click="zoom(0.9)">
            <el-icon><ZoomIn /></el-icon>
          </el-button>
          <el-button @click="zoom(1.1)">
            <el-icon><ZoomOut /></el-icon>
          </el-button>
          <el-button @click="fitView">
            <el-icon><FullScreen /></el-icon>
          </el-button>
          <el-button @click="toggleRotate">
            <el-icon v-if="state.rotate"><VideoPause /></el-icon>
            <el-icon v-else><VideoPlay /></el-icon>
            {{ state.rotate ? "停止" : "旋转" }}
          </el-button>
          <el-button @click="restart">
            <el-icon><Refresh /></el-icon>
            重启
          </el-button>
        </el-button-group>
        <slot name="toolbar" :instance="instance" />
      </div>
    </div>

    <div ref="containerRef" class="re-graph-3d__canvas" />

    <div v-if="state.loading" class="re-graph-3d__loading">
      <span>构建图谱中...</span>
    </div>
    <div v-if="!state.loading && simNodes && simNodes.length === 0" class="re-graph-3d__empty">
      <span>暂无数据</span>
    </div>

    <!-- 底部信息栏 -->
    <div class="re-graph-3d__statusbar">
      <span>节点 {{ finalData.nodes?.length ?? 0 }}</span>
      <span>连线 {{ finalData.links?.length ?? 0 }}</span>
      <span v-if="state.paused" class="re-graph-3d__statusbar-item--warn">已暂停</span>
      <span v-if="state.keyword" class="re-graph-3d__statusbar-item--info">
        搜索：{{ state.keyword }}
      </span>
      <slot name="status" :data="finalData" :instance="instance" />
    </div>
  </div>
</template>

<style scoped>
.re-graph-3d {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-height: 360px;
  overflow: hidden;
  border-radius: var(--el-border-radius-base, 8px);
  background: var(--el-bg-color, #fff);
}
.re-graph-3d__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 12px;
  border-bottom: 1px solid var(--el-border-color-light);
  background: var(--el-bg-color-page);
  flex-shrink: 0;
}
.re-graph-3d__toolbar-left,
.re-graph-3d__toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.re-graph-3d__toolbar-left :deep(.el-input) {
  width: 220px;
}

.re-graph-3d__canvas {
  position: relative;
  flex: 1;
  min-height: 0;
  background: var(--el-fill-color-blank);
}

.re-graph-3d__loading,
.re-graph-3d__empty {
  position: absolute;
  inset: 36px 0 28px 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  color: var(--el-text-color-secondary);
  background: rgba(255, 255, 255, 0.6);
  pointer-events: none;
}

.re-graph-3d__statusbar {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 6px 12px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  border-top: 1px solid var(--el-border-color-light);
  background: var(--el-bg-color-page);
  flex-shrink: 0;
}
.re-graph-3d__statusbar-item--warn {
  color: var(--el-color-warning);
}
.re-graph-3d__statusbar-item--info {
  color: var(--el-color-primary);
}
</style>
