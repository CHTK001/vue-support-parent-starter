<script setup lang="ts">
/**
 * ReAvatar3D —— 3D 角色加载组件
 *
 * 使用 three.js + GLTFLoader 加载 GLB 模型，作为 AI 助手的 3D 形象。
 * 支持自动旋转、尺寸控制、背景色等配置。
 */
import { ref, watch, onMounted, onBeforeUnmount, computed } from "vue";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

const props = withDefaults(
  defineProps<{
    /** GLB 模型 URL */
    modelUrl?: string;
    /** 宽度 */
    width?: number;
    /** 高度 */
    height?: number;
    /** 自动旋转速度 */
    autoRotateSpeed?: number;
    /** 背景色 */
    backgroundColor?: string;
    /** 模型缩放 */
    scale?: number;
    /** 是否启用 OrbitControls 交互旋转 */
    interactive?: boolean;
  }>(),
  {
    modelUrl: "",
    width: 200,
    height: 200,
    autoRotateSpeed: 0.01,
    backgroundColor: "transparent",
    scale: 1,
    interactive: false,
  },
);

const emit = defineEmits<{
  (e: "load"): void;
  (e: "error", err: string): void;
}>();

const containerRef = ref<HTMLDivElement | null>(null);
const loading = ref(true);
const error = ref("");

let scene: THREE.Scene | null = null;
let camera: THREE.PerspectiveCamera | null = null;
let renderer: THREE.WebGLRenderer | null = null;
let model: THREE.Object3D | null = null;
let animationId: number | null = null;

function initScene() {
  if (!containerRef.value) return;

  const container = containerRef.value;
  const w = props.width;
  const h = props.height;

  scene = new THREE.Scene();
  if (props.backgroundColor !== "transparent") {
    scene.background = new THREE.Color(props.backgroundColor);
  }

  camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 1000);
  camera.position.set(0, 0, 5);

  renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setSize(w, h);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  container.appendChild(renderer.domElement);

  // 灯光
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(5, 5, 5);
  scene.add(directionalLight);
  const backLight = new THREE.DirectionalLight(0xffffff, 0.3);
  backLight.position.set(-5, 0, -5);
  scene.add(backLight);

  // 加载模型
  if (props.modelUrl) {
    loadModel(props.modelUrl);
  } else {
    loading.value = false;
  }
}

function loadModel(url: string) {
  const loader = new GLTFLoader();
  loader.load(
    url,
    (gltf) => {
      model = gltf.scene;
      model.scale.set(props.scale, props.scale, props.scale);
      scene?.add(model);
      loading.value = false;
      emit("load");
    },
    undefined,
    (err) => {
      const msg = err instanceof Error ? err.message : String(err);
      error.value = msg;
      loading.value = false;
      emit("error", msg);
    },
  );
}

function animate() {
  if (model && props.autoRotateSpeed > 0) {
    model.rotation.y += props.autoRotateSpeed;
  }
  if (renderer && scene && camera) {
    renderer.render(scene, camera);
  }
  animationId = requestAnimationFrame(animate);
}

function startAnimation() {
  if (animationId) return;
  animate();
}

function stopAnimation() {
  if (animationId) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }
}

function destroyScene() {
  stopAnimation();
  if (renderer) {
    renderer.dispose();
    renderer.domElement.remove();
    renderer = null;
  }
  scene = null;
  camera = null;
  model = null;
}

watch(() => props.modelUrl, (url) => {
  if (url) {
    destroyScene();
    initScene();
  }
});

onMounted(() => {
  initScene();
  startAnimation();
});

onBeforeUnmount(() => {
  destroyScene();
});
</script>

<template>
  <div class="re-avatar-3d" :style="{ width: width + 'px', height: height + 'px' }">
    <div v-if="loading" class="re-avatar-3d__loading">
      <span>加载中...</span>
    </div>
    <div v-if="error" class="re-avatar-3d__error">
      <span>{{ error }}</span>
    </div>
    <div ref="containerRef" class="re-avatar-3d__canvas" />
  </div>
</template>

<style lang="scss" scoped>
.re-avatar-3d {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;

  &__canvas {
    width: 100%;
    height: 100%;
  }

  &__loading,
  &__error {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    color: var(--el-text-color-secondary);
    background: var(--el-fill-color-lighter);
    border-radius: 8px;
  }

  &__error {
    color: var(--el-color-danger);
  }
}
</style>