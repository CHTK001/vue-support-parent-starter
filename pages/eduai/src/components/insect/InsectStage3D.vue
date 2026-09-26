<template>
  <div ref="rootRef" class="is3d">
    <canvas ref="canvasRef" class="is3d__canvas" />

    <!-- 标注点层：位置每帧由渲染循环直接写 style，不走 Vue 响应式（60fps 不能触发重渲染） -->
    <div ref="layerRef" class="is3d__layer">
      <button
        v-for="h in hotspots"
        :key="h.id"
        :ref="(el) => bindMarker(h.id, el)"
        type="button"
        class="is3d__dot"
        :class="[`is-${h.tone}`, { 'is-open': openAnchor === h.anchor }]"
        :style="{ '--dot-color': toneVar(h.tone) }"
        :title="h.label"
        @click.stop="emit('pick', h)"
      >
        <span class="is3d__dot-core" />
      </button>
    </div>

    <!-- 标注说明卡：跟随当前打开的标注点 -->
    <div
      v-if="activeHotspot"
      class="is3d__card"
      :style="cardStyle"
    >
      <div class="is3d__card-head">
        <span class="is3d__card-swatch" :style="{ background: toneVar(activeHotspot.tone) }" />
        <span class="is3d__card-title">{{ activeHotspot.label }}</span>
        <button type="button" class="is3d__card-close" title="关闭" @click="openAnchor = null">✕</button>
      </div>
      <p class="is3d__card-note">{{ activeHotspot.note }}</p>
      <button v-if="partJumpLabel" type="button" class="is3d__card-jump" @click="emit('part-jump', activeHotspot.anchor)">
        看同样有{{ partJumpLabel }}的虫 →
      </button>
    </div>

    <!-- 学名水印：左下角 -->
    <div v-if="latin" class="is3d__latin">{{ latin }}</div>

    <!-- 加载 / 错误 -->
    <div v-if="loading" class="is3d__mask">
      <span class="is3d__spinner" />
      <span class="is3d__mask-text">模型构建中…</span>
    </div>
    <div v-else-if="errorText" class="is3d__mask is3d__mask--error">
      <span class="is3d__mask-text">{{ errorText }}</span>
      <button type="button" class="is3d__retry" @click="reload">重试</button>
    </div>

    <div v-if="stageLabel" class="is3d__stage-chip">{{ stageLabel }}</div>
  </div>
</template>

<script setup lang="ts">
/**
 * InsectStage3D —— 昆虫 3D 展台（Vue 版渲染层）
 *
 * 建模资产来自开源项目 insect-world（MIT）：`src/insect/three/builders/**` 是纯
 * three.js 的程序化建模（每物种数百行几何生成），本组件只负责「把模型摆出来并
 * 驱动它」，不碰任何几何逻辑。
 *
 * 相比上游的 react-three-fiber 版本，这里没有用 TresJS，只依赖 three 本体：
 * 自己管 scene / camera / renderer / OrbitControls / 渲染循环。原因是 Vue 侧再叠一层
 * 3D 框架反而要把 2MB 已验证的建模资产包进 reconciler，得不偿失。
 *
 * 关键行为与上游一致：
 *   - 全身取景用 fitDistance；聚焦到某标注点用 focusDistance（按画面占比反解，
 *     对细长虫与圆虫都成立，见 three/framing.ts 的长注释）
 *   - 相机以插值方式逼近目标，不会把用户转好的角度抢走
 *   - 静息微动 / 悬停振翅来自 three/motion，只给确有该行为的物种配
 *   - 标注点每帧把 anchor 投影到屏幕坐标，DOM 直接写 transform
 */
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { loadInsectModel } from "../../insect/three/registry";
import { loadStageModel } from "../../insect/three/stages";
import { fitDistance, focusDistance, HOME_DIR } from "../../insect/three/framing";
import { motionFor } from "../../insect/three/motion";
import { applyBlended, stepBlend } from "../../insect/three/motion/types";
import { webglAvailable } from "../../insect/three/webgl";
import type { InsectModel } from "../../insect/three/builders/kit";
import type { LifeStage } from "../../insect/three/stages";
import type { Hotspot } from "../../insect/data/types";

/** 标注点配色：与消消乐体系一致，全部走 --el-* 令牌，不硬编码品牌色 */
const TONE_VAR: Record<string, string> = {
  coral: "var(--el-color-danger)",
  sage: "var(--el-color-success)",
  amber: "var(--el-color-warning)",
  lavender: "var(--el-color-info)",
};

const STAGE_LABEL: Record<LifeStage, string> = {
  egg: "卵",
  larva: "幼虫",
  pupa: "蛹",
  nymph: "若虫",
  adult: "成虫",
};

const props = withDefaults(
  defineProps<{
    /** 物种 slug：决定数据身份（讲解/详情按它取，模型默认也按它取） */
    insectCode: string;
    /**
     * 3D 建模 slug。为空时用 insectCode。
     *
     * 新增物种若借用了别的物种模型，这里传被借用的 slug，
     * 这样建模层与数据层可以各自推进，不强求一一对应。
     */
    modelCode?: string | null;
    /** 标注点数据（来自后端 insectHotspots） */
    hotspots?: Hotspot[];
    /** 需要镜头对位的部位；null 表示全身取景 */
    focusAnchor?: string | null;
    /** 展示生活史阶段；null 表示成虫 */
    lifeStage?: LifeStage | null;
    /** 左下角水印学名 */
    latin?: string;
    /** 某部位是否还有别的虫可跳，给出跳转入口 */
    hasPartPeer?: (anchor: string) => boolean;
    /** 跳转入口文案 */
    partLabel?: (anchor: string) => string;
  }>(),
  {
    modelCode: null,
    hotspots: () => [],
    focusAnchor: null,
    lifeStage: null,
    latin: "",
    hasPartPeer: () => false,
    partLabel: () => "",
  },
);

const emit = defineEmits<{
  (e: "pick", hotspot: Hotspot): void;
  (e: "part-jump", anchor: string): void;
  (e: "ready", code: string): void;
}>();

const rootRef = ref<HTMLElement | null>(null);
const canvasRef = ref<HTMLCanvasElement | null>(null);
const layerRef = ref<HTMLElement | null>(null);

const loading = ref(true);
const errorText = ref("");
const openAnchor = ref<string | null>(null);
/** 打开的标注卡在视口内的位置（由渲染循环写入） */
const cardPos = ref({ x: 0, y: 0, side: "left" as "left" | "right" });

// ==================== three 运行时 ====================
let renderer: THREE.WebGLRenderer | null = null;
let scene: THREE.Scene | null = null;
let camera: THREE.PerspectiveCamera | null = null;
let controls: OrbitControls | null = null;
let model: InsectModel | null = null;
let stageModel: InsectModel | null = null;
let raf = 0;
let disposed = false;
/** three 0.185 起 Clock 已弃用，改用 Timer（update() 后再取 delta/elapsed） */
const timer = new THREE.Timer();

/** 相机目标位姿：每帧向它插值逼近 */
const goal = {
  target: new THREE.Vector3(0, 0, 0),
  position: new THREE.Vector3(),
};
let goalActive = false;

const markerEls = new Map<string, HTMLElement>();

/** 标注点 → 世界坐标缓存（模型换 species 时重建） */
const anchorWorld = new Map<string, THREE.Vector3>();

function toneVar(tone: string): string {
  return TONE_VAR[tone] ?? "var(--el-color-primary)";
}

function bindMarker(id: string, el: Element | { $el?: Element } | null) {
  // 模板 ref 回调可能收到组件实例，这里统一取出真实元素
  const node =
    el && "$el" in el ? ((el as { $el?: Element }).$el ?? null) : (el as Element | null);
  if (node instanceof HTMLElement) markerEls.set(id, node);
  else markerEls.delete(id);
}

/** 实际用于加载 3D 的 slug：优先复用标识，缺省回落到物种自身 */
const modelSlug = computed(() => (props.modelCode && props.modelCode.trim() ? props.modelCode.trim() : props.insectCode));

const activeHotspot = computed(() => props.hotspots.find((h) => h.anchor === openAnchor.value) ?? null);
const partJumpLabel = computed(() =>
  activeHotspot.value && props.hasPartPeer(activeHotspot.value.anchor)
    ? props.partLabel(activeHotspot.value.anchor)
    : "",
);
const cardStyle = computed(() => ({
  left: cardPos.value.side === "left" ? `${cardPos.value.x}px` : "auto",
  right: cardPos.value.side === "right" ? `${cardPos.value.x}px` : "auto",
  top: `${cardPos.value.y}px`,
}));
const stageLabel = computed(() => (props.lifeStage ? STAGE_LABEL[props.lifeStage] : ""));

// ==================== 场景搭建 ====================
function buildScene() {
  const canvas = canvasRef.value;
  const root = rootRef.value;
  if (!canvas || !root) return false;

  const rect = root.getBoundingClientRect();
  const w = Math.max(1, Math.floor(rect.width));
  const h = Math.max(1, Math.floor(rect.height));

  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(w, h, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(34, w / h, 0.01, 100);
  camera.position.copy(HOME_DIR).multiplyScalar(3);

  controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.enablePan = false;
  controls.rotateSpeed = 0.85;
  controls.zoomSpeed = 0.9;
  // 相机目标由本组件的插值接管，OrbitControls 只负责用户输入
  controls.target.set(0, 0, 0);

  // 灯光：与上游同款三点布光 + 环境光
  const ambient = new THREE.AmbientLight(0xfff3e4, 0.72);
  scene.add(ambient);

  const key = new THREE.DirectionalLight(0xffffff, 1.35);
  key.position.set(2.4, 3.2, 2.6);
  scene.add(key);

  const fill = new THREE.DirectionalLight(0xd6e2ff, 0.85);
  fill.position.set(-2.4, 1.2, -1.5);
  scene.add(fill);

  const rim = new THREE.DirectionalLight(0xffe6c8, 1.15);
  rim.position.set(-0.5, 1.8, -3.2);
  scene.add(rim);

  return true;
}

/** 取景半径：某些物种放大了包围球来兜住头部/触角 */
function framingRadius(m: InsectModel): number {
  return m.frameRadius ?? m.radius;
}

/** 换模型后重建 anchor 的世界坐标，并摆一次全身机位 */
function reframe(m: InsectModel, keepAngle: boolean) {
  if (!camera || !controls) return;
  const r = framingRadius(m);
  const dist = fitDistance(camera, r);
  if (keepAngle) {
    // 保留用户当前观察方向，只重新适配距离（换物种时不丢视角）
    const dir = camera.position.clone().sub(controls.target).normalize();
    goal.target.set(0, 0, 0);
    goal.position.copy(dir).multiplyScalar(dist);
  } else {
    goal.target.set(0, 0, 0);
    goal.position.copy(HOME_DIR).multiplyScalar(dist);
  }
  goalActive = true;
  controls.minDistance = r * 0.5;
  controls.maxDistance = dist * 2.4;
}

function cacheAnchors(m: InsectModel) {
  anchorWorld.clear();
  m.group.updateMatrixWorld(true);
  for (const [k, v] of Object.entries(m.anchors ?? {})) {
    anchorWorld.set(k, v.clone().applyMatrix4(m.group.matrixWorld));
  }
}

/** 镜头对到某个部位 */
function focusOn(anchor: string) {
  if (!camera || !controls || !model) return;
  const local = model.anchors?.[anchor];
  if (!local) return;
  const world = anchorWorld.get(anchor) ?? local.clone().applyMatrix4(model.group.matrixWorld);
  const r = framingRadius(model);
  const dir = camera.position.clone().sub(controls.target).normalize();
  const dist = focusDistance(camera, model, world.clone(), dir, r);
  goal.target.copy(world);
  goal.position.copy(world).addScaledVector(dir, dist);
  goalActive = true;
}

function resetFocus() {
  if (!model) return;
  reframe(model, true);
}

// ==================== 加载 ====================
async function loadModel() {
  if (!scene) return;
  loading.value = true;
  errorText.value = "";
  try {
    const m = props.lifeStage && props.lifeStage !== "adult"
      ? await loadStageModel(modelSlug.value, props.lifeStage)
      : await loadInsectModel(modelSlug.value);

    if (disposed) return;
    // 卸载旧模型并释放 GPU 资源
    if (model) {
      scene.remove(model.group);
      model.group.traverse((o) => {
        const mesh = o as THREE.Mesh;
        if (!mesh.isMesh) return;
        mesh.geometry?.dispose();
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        for (const mat of mats) mat?.dispose?.();
      });
    }
    if (stageModel && stageModel !== model) {
      // 生活史阶段模型与成虫模型可能不是同一实例，一并清掉
      stageModel = null;
    }

    model = m;
    scene.add(m.group);
    cacheAnchors(m);
    reframe(m, false);
    openAnchor.value = null;
    loading.value = false;
    emit("ready", props.insectCode);
  } catch (e) {
    if (disposed) return;
    loading.value = false;
    errorText.value = e instanceof Error ? e.message : String(e);
  }
}

function reload() {
  void loadModel();
}

// ==================== 渲染循环 ====================
const tmpV = new THREE.Vector3();

function tick() {
  if (disposed) return;
  raf = requestAnimationFrame(tick);
  if (!renderer || !scene || !camera || !controls) return;

  timer.update();
  const dt = Math.min(timer.getDelta(), 0.05);
  const t = timer.getElapsed();

  // 相机插值逼近目标（用平滑步进，不用直接赋值，避免生硬）
  if (goalActive) {
    const k = 1 - Math.exp(-6 * dt);
    camera.position.lerp(goal.position, k);
    controls.target.lerp(goal.target, k);
    if (camera.position.distanceTo(goal.position) < 1e-4) goalActive = false;
  }

  // 静息微动 / 悬停振翅：只给确有该行为的物种
  if (model?.rig) {
    applyBlended(model.rig, motionFor(modelSlug.value), t, stepBlend(1, 1, dt));
  }

  controls.update();
  renderer.render(scene, camera);

  // 标注点：把 anchor 投影到屏幕，直接写 DOM transform
  const root = rootRef.value;
  if (root && model) {
    const rect = root.getBoundingClientRect();
    for (const h of props.hotspots) {
      const el = markerEls.get(h.id);
      if (!el) continue;
      const world = anchorWorld.get(h.anchor);
      if (!world) {
        el.style.opacity = "0";
        continue;
      }
      tmpV.copy(world).project(camera);
      // z>1 表示在相机背后
      if (tmpV.z > 1) {
        el.style.opacity = "0";
        continue;
      }
      const x = (tmpV.x * 0.5 + 0.5) * rect.width;
      const y = (-tmpV.y * 0.5 + 0.5) * rect.height;
      el.style.opacity = "1";
      el.style.transform = `translate(-50%, -50%) translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
    }

    // 说明卡贴在当前标注点旁边，空间不够就换边
    const active = activeHotspot.value;
    if (active) {
      const world = anchorWorld.get(active.anchor);
      if (world) {
        tmpV.copy(world).project(camera);
        const x = (tmpV.x * 0.5 + 0.5) * rect.width;
        const y = (-tmpV.y * 0.5 + 0.5) * rect.height;
        const CARD_W = 200;
        const room = rect.width - x - 20 - CARD_W;
        const side: "left" | "right" = room > 0 ? "right" : "left";
        cardPos.value = {
          x: side === "right" ? rect.width - x - 18 : x - 18,
          y: Math.min(Math.max(y - 40, 8), Math.max(8, rect.height - 150)),
          side,
        };
      }
    }
  }
}

// ==================== 生命周期 ====================
let ro: ResizeObserver | null = null;

function onResize() {
  if (!renderer || !camera || !rootRef.value) return;
  const rect = rootRef.value.getBoundingClientRect();
  const w = Math.max(1, Math.floor(rect.width));
  const h = Math.max(1, Math.floor(rect.height));
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}

onMounted(() => {
  if (!webglAvailable()) {
    errorText.value = "当前浏览器不支持 WebGL，无法显示 3D 模型";
    loading.value = false;
    return;
  }
  if (!buildScene()) return;
  void loadModel();
  tick();
  ro = new ResizeObserver(onResize);
  if (rootRef.value) ro.observe(rootRef.value);
});

onBeforeUnmount(() => {
  disposed = true;
  cancelAnimationFrame(raf);
  ro?.disconnect();
  controls?.dispose();
  if (model) {
    model.group.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.geometry?.dispose();
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      for (const mat of mats) mat?.dispose?.();
    });
  }
  renderer?.dispose();
  renderer = null;
  scene = null;
  camera = null;
  model = null;
});

// 换物种 / 换复用模型 → 重载
watch(modelSlug, () => void loadModel());
// 换生活史阶段 → 重载
watch(() => props.lifeStage, () => void loadModel());
// 镜头对位
watch(
  () => props.focusAnchor,
  (a) => {
    if (a) focusOn(a);
    else resetFocus();
  },
);
</script>

<style scoped>
.is3d {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 320px;
  border-radius: 18px;
  overflow: hidden;
  background: radial-gradient(120% 90% at 50% 0%, var(--el-color-primary-light-9) 0%, var(--el-color-primary-light-8) 100%);
}
.is3d__canvas {
  display: block;
  width: 100%;
  height: 100%;
  touch-action: none;
}
.is3d__layer {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

/* 标注点：脉冲圈 + 实心核，点击热区足够大 */
.is3d__dot {
  position: absolute;
  top: 0;
  left: 0;
  width: 26px;
  height: 26px;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
  pointer-events: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: opacity 0.15s;
}
.is3d__dot-core {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--dot-color, var(--el-color-primary));
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--dot-color, var(--el-color-primary)) 28%, transparent);
  transition: transform 0.15s;
}
.is3d__dot::after {
  content: "";
  position: absolute;
  inset: 4px;
  border-radius: 50%;
  border: 2px solid var(--dot-color, var(--el-color-primary));
  opacity: 0.55;
  animation: is3d-pulse 2.4s ease-out infinite;
}
.is3d__dot:hover .is3d__dot-core,
.is3d__dot.is-open .is3d__dot-core {
  transform: scale(1.5);
}
.is3d__dot.is-open::after {
  animation: none;
  opacity: 0.9;
}
@keyframes is3d-pulse {
  0% { transform: scale(0.6); opacity: 0.6; }
  100% { transform: scale(1.5); opacity: 0; }
}

/* 标注说明卡 */
.is3d__card {
  position: absolute;
  width: 200px;
  padding: 10px 12px;
  border-radius: 12px;
  background: var(--el-bg-color);
  box-shadow: var(--el-box-shadow);
  z-index: 3;
}
.is3d__card-head {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
}
.is3d__card-swatch {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}
.is3d__card-title {
  flex: 1;
  min-width: 0;
  font-size: 14px;
  font-weight: 900;
  color: var(--el-text-color-primary);
}
.is3d__card-close {
  border: 0;
  background: transparent;
  cursor: pointer;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  padding: 0 2px;
}
.is3d__card-note {
  margin: 0;
  font-size: 12px;
  line-height: 1.65;
  color: var(--el-text-color-regular);
}
.is3d__card-jump {
  margin-top: 8px;
  border: 0;
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  font-size: 12px;
  font-weight: 700;
  border-radius: 8px;
  padding: 4px 8px;
  cursor: pointer;
  width: 100%;
  text-align: left;
}

.is3d__latin {
  position: absolute;
  left: 14px;
  bottom: 12px;
  font-size: 12px;
  font-style: italic;
  font-weight: 600;
  color: var(--el-text-color-secondary);
  pointer-events: none;
  max-width: 60%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.is3d__stage-chip {
  position: absolute;
  right: 14px;
  top: 12px;
  font-size: 12px;
  font-weight: 800;
  color: var(--el-color-white);
  background: var(--el-color-primary);
  border-radius: 999px;
  padding: 3px 12px;
  box-shadow: 0 4px 12px rgba(var(--el-color-primary-rgb), 0.32);
}

.is3d__mask {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  background: color-mix(in srgb, var(--el-bg-color) 78%, transparent);
  z-index: 4;
}
.is3d__mask-text {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}
.is3d__spinner {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  border: 3px solid var(--el-border-color-lighter);
  border-top-color: var(--el-color-primary);
  animation: is3d-spin 0.8s linear infinite;
}
@keyframes is3d-spin {
  to { transform: rotate(360deg); }
}
.is3d__retry {
  border: 1px solid var(--el-color-primary);
  background: var(--el-bg-color);
  color: var(--el-color-primary);
  font-size: 13px;
  font-weight: 700;
  border-radius: 999px;
  padding: 4px 16px;
  cursor: pointer;
}
</style>
