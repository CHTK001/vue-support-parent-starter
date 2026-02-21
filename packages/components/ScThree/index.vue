<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from "vue";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

export interface Props {
  width?: string | number;
  height?: string | number;
  backgroundColor?: string | number;
  antialias?: boolean;
  alpha?: boolean;
  autoResize?: boolean;
  cameraType?: "perspective" | "orthographic";
  cameraFov?: number;
  cameraNear?: number;
  cameraFar?: number;
  cameraPosition?: [number, number, number];
  cameraLookAt?: [number, number, number];
  /**
   * 预设场景类型：
   * - none: 不做额外处理，完全交给业务侧
   * - chinaMap: 中国 3D 地图
   * - interior: 室内装潢
   */
  preset?: "none" | "chinaMap" | "interior";
  /**
   * 模型地址列表，支持 glTF/glb 格式
   */
  modelUrls?: string[];
}

const props = withDefaults(defineProps<Props>(), {
  width: 800,
  height: 600,
  backgroundColor: 0x000000,
  antialias: true,
  alpha: false,
  autoResize: true,
  cameraType: "perspective",
  cameraFov: 75,
  cameraNear: 0.1,
  cameraFar: 1000,
  cameraPosition: () => [0, 0, 5] as [number, number, number],
  cameraLookAt: () => [0, 0, 0] as [number, number, number],
  preset: "none",
  modelUrls: () => [],
});

const emits = defineEmits<{
  /**
   * Three 核心对象准备完成
   */
  ready: [scene: THREE.Scene, camera: THREE.Camera, renderer: THREE.WebGLRenderer];
  /**
   * 画布尺寸变化
   */
  resize: [width: number, height: number];
  /**
   * 预设场景或模型加载完成
   */
  modelLoaded: [models: THREE.Object3D[]];
}>();

const containerRef = ref<HTMLElement>();
const sceneRef = ref<THREE.Scene>();
const cameraRef = ref<THREE.Camera>();
const rendererRef = ref<THREE.WebGLRenderer>();
const animationFrameId = ref<number>();

const containerWidth = computed(() => {
  if (typeof props.width === "number") {
    return `${props.width}px`;
  }
  return props.width;
});

const containerHeight = computed(() => {
  if (typeof props.height === "number") {
    return `${props.height}px`;
  }
  return props.height;
});

async function loadModels(scene: THREE.Scene): Promise<THREE.Object3D[]> {
  if (!props.modelUrls || props.modelUrls.length === 0) {
    return [];
  }

  const loader = new GLTFLoader();
  const loadedModels: THREE.Object3D[] = [];

  for (const url of props.modelUrls) {
    try {
      // eslint-disable-next-line no-await-in-loop
      const gltf = await loader.loadAsync(url);
      scene.add(gltf.scene);
      loadedModels.push(gltf.scene);
    } catch (e) {
      // 这里不抛出，避免一个模型失败导致整体挂掉
      // eslint-disable-next-line no-console
      console.warn("[ScThree][model] 模型加载失败", url, e);
    }
  }

  return loadedModels;
}

function setupPresetScene(scene: THREE.Scene, camera: THREE.Camera): void {
  if (props.preset === "chinaMap") {
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(10, 20, 10);
    scene.add(light);

    const ambient = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(ambient);

    const planeGeo = new THREE.PlaneGeometry(20, 20);
    const planeMat = new THREE.MeshPhongMaterial({
      color: 0x004a8f,
      transparent: true,
      opacity: 0.9,
    });
    const plane = new THREE.Mesh(planeGeo, planeMat);
    plane.rotation.x = -Math.PI / 2;
    scene.add(plane);

    camera.position.set(0, 15, 15);
    camera.lookAt(0, 0, 0);
  } else if (props.preset === "interior") {
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambient);

    const pointLight = new THREE.PointLight(0xffffff, 0.8);
    pointLight.position.set(5, 8, 5);
    scene.add(pointLight);

    const floorGeo = new THREE.PlaneGeometry(20, 20);
    const floorMat = new THREE.MeshPhongMaterial({ color: 0xe0e0e0 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);

    const wallGeo = new THREE.BoxGeometry(20, 10, 0.5);
    const wallMat = new THREE.MeshPhongMaterial({ color: 0xf5f5f5 });
    const backWall = new THREE.Mesh(wallGeo, wallMat);
    backWall.position.set(0, 5, -10);
    scene.add(backWall);

    camera.position.set(8, 8, 12);
    camera.lookAt(0, 3, 0);
  }
}

// 初始化场景
function initScene() {
  if (!containerRef.value) {
    return;
  }

  // 创建场景
  const scene = new THREE.Scene();
  scene.background = props.alpha ? null : new THREE.Color(props.backgroundColor);
  sceneRef.value = scene;

  // 创建相机
  const aspect = containerRef.value.clientWidth / containerRef.value.clientHeight;
  let camera: THREE.Camera;

  if (props.cameraType === "orthographic") {
    const size = 5;
    camera = new THREE.OrthographicCamera(
      -size * aspect,
      size * aspect,
      size,
      -size,
      props.cameraNear,
      props.cameraFar
    );
  } else {
    camera = new THREE.PerspectiveCamera(
      props.cameraFov,
      aspect,
      props.cameraNear,
      props.cameraFar
    );
  }

  camera.position.set(...props.cameraPosition);
  camera.lookAt(...props.cameraLookAt);
  cameraRef.value = camera;

  setupPresetScene(scene, camera);

  // 创建渲染器
  const renderer = new THREE.WebGLRenderer({
    antialias: props.antialias,
    alpha: props.alpha,
  });
  renderer.setSize(containerRef.value.clientWidth, containerRef.value.clientHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  containerRef.value.appendChild(renderer.domElement);
  rendererRef.value = renderer;

  // 预设场景 + 模型加载
  loadModels(scene).then((models) => {
    if (models.length > 0) {
      emits("modelLoaded", models);
    }
  });

  // 触发 ready 事件
  emits("ready", scene, camera, renderer);
}

// 渲染循环
function animate() {
  if (!rendererRef.value || !sceneRef.value || !cameraRef.value) {
    return;
  }

  animationFrameId.value = requestAnimationFrame(animate);
  rendererRef.value.render(sceneRef.value, cameraRef.value);
}

// 处理窗口大小变化
function handleResize() {
  if (!containerRef.value || !rendererRef.value || !cameraRef.value) {
    return;
  }

  const width = containerRef.value.clientWidth;
  const height = containerRef.value.clientHeight;

  rendererRef.value.setSize(width, height);

  if (cameraRef.value instanceof THREE.PerspectiveCamera) {
    cameraRef.value.aspect = width / height;
    cameraRef.value.updateProjectionMatrix();
  } else if (cameraRef.value instanceof THREE.OrthographicCamera) {
    const size = 5;
    cameraRef.value.left = -size * (width / height);
    cameraRef.value.right = size * (width / height);
    cameraRef.value.top = size;
    cameraRef.value.bottom = -size;
    cameraRef.value.updateProjectionMatrix();
  }

  emits("resize", width, height);
}

// 监听尺寸变化
watch(
  () => [props.width, props.height],
  () => {
    if (props.autoResize) {
      handleResize();
    }
  }
);

onMounted(() => {
  initScene();
  animate();

  if (props.autoResize) {
    window.addEventListener("resize", handleResize);
  }
});

onBeforeUnmount(() => {
  if (animationFrameId.value) {
    cancelAnimationFrame(animationFrameId.value);
  }

  if (props.autoResize) {
    window.removeEventListener("resize", handleResize);
  }

  // 清理资源
  if (rendererRef.value) {
    rendererRef.value.dispose();
    if (containerRef.value && rendererRef.value.domElement.parentNode) {
      containerRef.value.removeChild(rendererRef.value.domElement);
    }
  }

  if (sceneRef.value) {
    sceneRef.value.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.geometry.dispose();
        if (Array.isArray(object.material)) {
          object.material.forEach((material) => material.dispose());
        } else {
          object.material.dispose();
        }
      }
    });
  }
});

// 暴露方法
defineExpose({
  scene: computed(() => sceneRef.value),
  camera: computed(() => cameraRef.value),
  renderer: computed(() => rendererRef.value),
  render: () => {
    if (rendererRef.value && sceneRef.value && cameraRef.value) {
      rendererRef.value.render(sceneRef.value, cameraRef.value);
    }
  },
  resize: handleResize,
});
</script>

<template>
  <div ref="containerRef" class="sc-three" :style="{ width: containerWidth, height: containerHeight }">
    <slot />
  </div>
</template>

<style lang="scss" scoped>
.sc-three {
  position: relative;
  overflow: hidden;

  :deep(canvas) {
    display: block;
    width: 100%;
    height: 100%;
  }
}
</style>

