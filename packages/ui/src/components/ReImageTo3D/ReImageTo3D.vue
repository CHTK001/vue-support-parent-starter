<script setup lang="ts">
/**
 * ReImageTo3D —— 图片转伪 3D 浮浮雕组件
 *
 * 原理：
 *   1. 将输入图片转为亮度图作为深度图（亮部凸起、暗部凹陷）
 *   2. 用 Three.js 的 displacementMap 对 PlaneGeometry 做顶点置换
 *   3. 正弦波浮动动画 + 鼠标视差
 *
 * 用法：import ReImageTo3D from '@repo/ui/re-image-to-3d'
 */
import { ref, watch, onMounted, onBeforeUnmount, computed, type CSSProperties } from "vue";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const props = withDefaults(
  defineProps<{
    /** 图片 URL，也支持 data URL */
    src?: string;
    /** 容器宽度 */
    width?: number;
    /** 容器高度 */
    height?: number;
    /** 置换强度（顶点位移量） */
    displacementScale?: number;
    /** 网格细分密度 */
    segments?: number;
    /** 浮动振幅（px 等效） */
    floatAmplitude?: number;
    /** 浮动速度 rad/s */
    floatSpeed?: number;
    /** 是否启用鼠标视差 */
    parallax?: boolean;
    /** 是否启用 OrbitControls */
    interactive?: boolean;
    /** 背景色 */
    backgroundColor?: string;
    /** 主光源颜色 */
    lightColor?: string;
    /** 填充光颜色 */
    fillLightColor?: string;
    /** 是否自动旋转 */
    autoRotate?: boolean;
    /** 自动旋转速度 rad/s */
    autoRotateSpeed?: number;
    /** 是否显示上传按钮（允许本地上传图片） */
    allowUpload?: boolean;
    /** 占位文字 */
    placeholder?: string;
  }>(),
  {
    src: "",
    width: 400,
    height: 400,
    displacementScale: 0.35,
    segments: 80,
    floatAmplitude: 8,
    floatSpeed: 1.2,
    parallax: true,
    interactive: true,
    backgroundColor: "transparent",
    lightColor: "#ffffff",
    fillLightColor: "#9663f1",
    autoRotate: false,
    autoRotateSpeed: 0.2,
    allowUpload: false,
    placeholder: "点击或拖入图片",
  },
);

const emit = defineEmits<{
  (e: "ready"): void;
  (e: "error", msg: string): void;
}>();

const containerRef = ref<HTMLDivElement | null>(null);
const fileInputRef = ref<HTMLInputElement | null>(null);
const loading = ref(true);
const errorMsg = ref("");
const _imageLoaded = ref(false);

let scene: THREE.Scene | null = null;
let camera: THREE.PerspectiveCamera | null = null;
let renderer: THREE.WebGLRenderer | null = null;
let mesh: THREE.Mesh | null = null;
let controls: OrbitControls | null = null;
let animationId: number | null = null;
let clock: THREE.Clock | null = null;
let mouseX = 0;
let mouseY = 0;

/** 从 URL 加载图片并返回 HTMLImageElement */
function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`图片加载失败: ${url}`));
    img.src = url;
  });
}

/** 从 File 对象加载图片 */
function loadFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const url = reader.result as string;
      loadImage(url).then(resolve).catch(reject);
    };
    reader.onerror = () => reject(new Error("文件读取失败"));
    reader.readAsDataURL(file);
  });
}

/** 生成深度图 Canvas（基于亮度） */
function generateDepthCanvas(img: HTMLImageElement): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  // 限制分辨率以提升性能，但保持足够细分
  const maxDim = 512;
  const scale = Math.min(maxDim / img.width, maxDim / img.height, 1);
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  // 亮度 → 灰度置换：Y = 0.299R + 0.587G + 0.114B
  for (let i = 0; i < data.length; i += 4) {
    const y = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    // 反转：亮部凸起（高值），暗部凹陷（低值）
    data[i] = y;
    data[i + 1] = y;
    data[i + 2] = y;
    // alpha 保持不变
  }
  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

/** 用 Canvas 像素数据创建 Three.js DataTexture */
function createDepthTexture(canvas: HTMLCanvasElement): THREE.DataTexture {
  const ctx = canvas.getContext("2d")!;
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const srcPixels = imageData.data;
  // DataTexture 期望 Float32 或 Uint8，用 Uint8
  const count = canvas.width * canvas.height;
  const array = new Uint8Array(count);
  for (let i = 0, j = 0; i < count; i++, j += 4) {
    array[i] = srcPixels[j]; // R channel (same as G and B)
  }
  const tex = new THREE.DataTexture(array, canvas.width, canvas.height, THREE.RedFormat);
  tex.needsUpdate = true;
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  return tex;
}

/** 用图片 URL 创建 ColorTexture */
function createColorTexture(url: string): Promise<THREE.Texture> {
  return new Promise<THREE.Texture>((resolve, reject) => {
    const loader = new THREE.TextureLoader();
    loader.load(
      url,
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.minFilter = THREE.LinearMipmapLinearFilter;
        tex.magFilter = THREE.LinearFilter;
        resolve(tex);
      },
      undefined,
      () => reject(new Error("纹理加载失败")),
    );
  });
}

async function initScene(imageUrl: string) {
  if (!containerRef.value) return;
  const container = containerRef.value;
  const w = props.width;
  const h = props.height;

  // 加载图片
  let img: HTMLImageElement;
  try {
    img = await loadImage(imageUrl);
  } catch (e) {
    errorMsg.value = e instanceof Error ? e.message : "图片加载失败";
    loading.value = false;
    emit("error", errorMsg.value);
    return;
  }

  // 深度图
  const depthCanvas = generateDepthCanvas(img);
  const depthTex = createDepthTexture(depthCanvas);

  // 颜色纹理
  const colorTex = await createColorTexture(imageUrl);

  // 场景
  scene = new THREE.Scene();
  if (props.backgroundColor !== "transparent") {
    scene.background = new THREE.Color(props.backgroundColor);
  }

  camera = new THREE.PerspectiveCamera(40, w / h, 0.1, 100);
  camera.position.set(0, 0, 4);

  renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setSize(w, h);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  container.appendChild(renderer.domElement);

  // 灯光
  const ambient = new THREE.AmbientLight(0xffffff, 0.4);
  scene.add(ambient);

  const dirLight = new THREE.DirectionalLight(props.lightColor, 1.2);
  dirLight.position.set(3, 5, 4);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.set(1024, 1024);
  scene.add(dirLight);

  const fillLight = new THREE.DirectionalLight(props.fillLightColor, 0.4);
  fillLight.position.set(-3, 2, -2);
  scene.add(fillLight);

  const rimLight = new THREE.DirectionalLight(0xffffff, 0.25);
  rimLight.position.set(0, -3, -4);
  scene.add(rimLight);

  // 置换平面
  const segs = props.segments;
  const geo = new THREE.PlaneGeometry(2.4, 2.4 * (img.height / img.width), segs, segs);
  const mat = new THREE.MeshStandardMaterial({
    map: colorTex,
    displacementMap: depthTex,
    displacementScale: props.displacementScale,
    roughness: 0.45,
    metalness: 0.05,
    side: THREE.DoubleSide,
  });
  mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);

  // 阴影地面
  const shadowPlaneGeo = new THREE.PlaneGeometry(6, 6);
  const shadowPlaneMat = new THREE.ShadowMaterial({ opacity: 0.18 });
  const shadowPlane = new THREE.Mesh(shadowPlaneGeo, shadowPlaneMat);
  shadowPlane.rotation.x = -Math.PI / 2;
  shadowPlane.position.y = -1.5;
  shadowPlane.receiveShadow = true;
  scene.add(shadowPlane);

  // OrbitControls
  if (props.interactive) {
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableZoom = false;
    controls.enablePan = false;
    controls.mouseButtons = { LEFT: THREE.MOUSE.ROTATE, MIDDLE: null, RIGHT: null };
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.minPolarAngle = Math.PI * 0.25;
    controls.maxPolarAngle = Math.PI * 0.75;
    controls.minAzimuthAngle = -Math.PI * 0.4;
    controls.maxAzimuthAngle = Math.PI * 0.4;
    controls.update();
  }

  // 鼠标视差
  if (props.parallax) {
    const onMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouseX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      mouseY = -((e.clientY - rect.top) / rect.height - 0.5) * 2;
    };
    container.addEventListener("mousemove", onMove);
    container.addEventListener("mouseleave", () => { mouseX = 0; mouseY = 0; });
  }

  clock = new THREE.Clock();
  loading.value = false;
  _imageLoaded.value = true;
  emit("ready");
}

function animate() {
  animationId = requestAnimationFrame(animate);
  const elapsed = clock!.getElapsedTime();

  // 浮动动画
  if (mesh) {
    const floatY = props.floatAmplitude * 0.01 * Math.sin(elapsed * props.floatSpeed);
    mesh.position.y = floatY;
    mesh.rotation.z = Math.sin(elapsed * props.floatSpeed * 0.5) * 0.015;
  }

  // 鼠标视差
  if (props.parallax && mesh && !controls) {
    mesh.rotation.y += (mouseX * 0.15 - mesh.rotation.y) * 0.03;
    mesh.rotation.x += (-mouseY * 0.1 - mesh.rotation.x) * 0.03;
  }

  // 自动旋转
  if (props.autoRotate && mesh) {
    mesh.rotation.y += props.autoRotateSpeed * 0.01;
  }

  if (controls) controls.update();
  if (renderer && scene && camera) {
    renderer.render(scene, camera);
  }
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
  if (controls) { controls.dispose(); controls = null; }
  if (renderer) {
    renderer.dispose();
    if (containerRef.value) {
      const dom = renderer.domElement;
      if (dom.parentNode) dom.parentNode.removeChild(dom);
    }
    renderer = null;
  }
  scene = null;
  camera = null;
  mesh = null;
  clock = null;
}

const containerStyle = computed<CSSProperties>(() => ({
  width: `${props.width}px`,
  height: `${props.height}px`,
  position: "relative",
  overflow: "hidden",
  cursor: props.interactive ? "grab" : "default",
}));

const canLoad = computed(() => Boolean(props.src));

function handleFileChange(e: Event) {
  const target = e.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;
  if (!file.type.startsWith("image/")) {
    errorMsg.value = "请上传图片文件";
    return;
  }
  errorMsg.value = "";
  loadFile(file).then(() => {
    // Use data URL
    const reader = new FileReader();
    reader.onload = () => {
      if (containerRef.value) {
        destroyScene();
        initScene(reader.result as string);
        startAnimation();
      }
    };
    reader.readAsDataURL(file);
  }).catch((err) => {
    errorMsg.value = err instanceof Error ? err.message : "文件读取失败";
    loading.value = false;
  });
}

watch(
  () => props.src,
  (newSrc) => {
    if (!newSrc) return;
    if (containerRef.value) {
      destroyScene();
      errorMsg.value = "";
      loading.value = true;
      initScene(newSrc).then(() => startAnimation()).catch((err) => {
        errorMsg.value = err instanceof Error ? err.message : "加载失败";
        loading.value = false;
      });
    }
  },
  { immediate: true },
);

watch(
  () => [props.width, props.height] as const,
  () => {
    if (!containerRef.value || !renderer) return;
    const w = containerRef.value.clientWidth;
    const h = containerRef.value.clientHeight;
    if (w > 0 && h > 0 && camera) {
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    }
  },
);

onMounted(() => {
  if (props.src) {
    initScene(props.src).then(() => startAnimation()).catch((err) => {
      errorMsg.value = err instanceof Error ? err.message : "加载失败";
      loading.value = false;
    });
  } else {
    loading.value = false;
  }
});

onBeforeUnmount(() => {
  destroyScene();
});
</script>

<template>
  <div class="re-image-to-3d" :style="containerStyle">
    <!-- 未加载图片时显示占位/上传区 -->
    <div v-if="!_imageLoaded" class="re-image-to-3d__placeholder">
      <div class="re-image-to-3d__placeholder-icon">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="9" cy="9" r="2" />
          <path d="M21 15l-5-5L5 21" />
        </svg>
      </div>
      <p class="re-image-to-3d__placeholder-text">{{ placeholder }}</p>
      <input
        v-if="allowUpload"
        ref="fileInputRef"
        type="file"
        accept="image/*"
        class="re-image-to-3d__file-input"
        @change="handleFileChange"
      />
      <button
        v-if="allowUpload"
        class="re-image-to-3d__upload-btn"
        @click="fileInputRef?.click()"
      >
        选择图片
      </button>
    </div>

    <!-- 加载中 -->
    <div v-else-if="loading" class="re-image-to-3d__loading">
      <div class="re-image-to-3d__spinner" />
      <span>转换中...</span>
    </div>

    <!-- Three.js 画布 -->
    <div v-else ref="containerRef" class="re-image-to-3d__canvas" />

    <!-- 错误提示 -->
    <div v-if="errorMsg" class="re-image-to-3d__error">
      <span>{{ errorMsg }}</span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.re-image-to-3d {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  overflow: hidden;

  &__canvas {
    width: 100%;
    height: 100%;
    canvas {
      width: 100%;
      height: 100%;
      display: block;
    }
  }

  &__placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    background: linear-gradient(135deg, #f5f3ff 0%, #ede9fe 50%, #e0e7ff 100%);
    border-radius: 12px;
    cursor: pointer;
    transition: background 0.2s ease;
    user-select: none;

    &:hover {
      background: linear-gradient(135deg, #ede9fe 0%, #ddd6fe 50%, #c7d2fe 100%);
    }

    &-icon {
      color: #9663f1;
      opacity: 0.6;
      transition: opacity 0.2s;
    }

    &:hover &-icon {
      opacity: 1;
    }

    &-text {
      font-size: 13px;
      color: #6b7280;
      margin: 0;
    }
  }

  &__file-input {
    display: none;
  }

  &__upload-btn {
    padding: 8px 20px;
    font-size: 13px;
    font-weight: 600;
    color: #fff;
    background: linear-gradient(135deg, #9663f1 0%, #6d3dd1 100%);
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: transform 0.15s, box-shadow 0.15s;
    box-shadow: 0 2px 8px rgba(150, 99, 241, 0.3);

    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 14px rgba(150, 99, 241, 0.45);
    }
  }

  &__loading {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
    background: linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%);
    font-size: 13px;
    color: var(--el-text-color-secondary);
    border-radius: 12px;
  }

  &__spinner {
    width: 32px;
    height: 32px;
    border: 3px solid rgba(150, 99, 241, 0.15);
    border-top-color: #9663f1;
    border-radius: 50%;
    animation: re-image-to-3d-spin 0.8s linear infinite;
  }

  @keyframes re-image-to-3d-spin {
    to { transform: rotate(360deg); }
  }

  &__error {
    position: absolute;
    bottom: 12px;
    left: 50%;
    transform: translateX(-50%);
    padding: 6px 14px;
    font-size: 12px;
    color: #ef4444;
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.2);
    border-radius: 6px;
    white-space: nowrap;
  }
}

:root.dark {
  .re-image-to-3d__placeholder {
    background: linear-gradient(135deg, #1a1035 0%, #2d1b69 50%, #1e1b4b 100%);
  }

  .re-image-to-3d__placeholder:hover {
    background: linear-gradient(135deg, #2d1b69 0%, #3b1f8e 50%, #252166 100%);
  }

  .re-image-to-3d__placeholder-text {
    color: rgba(255, 255, 255, 0.5);
  }

  .re-image-to-3d__loading {
    background: linear-gradient(135deg, #1a1035 0%, #2d1b69 100%);
    color: rgba(255, 255, 255, 0.6);
  }

  .re-image-to-3d__spinner {
    border-color: rgba(150, 99, 241, 0.2);
    border-top-color: #c4a9ff;
  }
}
</style>
