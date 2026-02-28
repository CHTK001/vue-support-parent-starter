<script setup lang="ts">
import {
  AmbientLight,
  DirectionalLight,
  Group,
  PerspectiveCamera,
  Scene,
  Vector2,
  WebGLRenderer,
} from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { computed, onMounted, onUnmounted, ref, watch } from "vue";

const props = withDefaults(
  defineProps<{
    variant?: "fab" | "header" | "message";
    size?: number;
    enableWandering?: boolean;
  }>(),
  {
    variant: "fab",
    size: 80,
    enableWandering: false,
  },
);

const canvasRef = ref<HTMLCanvasElement | null>(null);

let renderer: WebGLRenderer | null = null;
let camera: PerspectiveCamera | null = null;
let scene: Scene | null = null;
let rootGroup: Group | null = null;
let modelGroup: Group | null = null;
let animationHandle = 0;
let lastFrameTime = 0;
let disposed = false;
const dragState = {
  isDragging: false,
  lastPos: new Vector2(),
  rotationY: 0,
  rotationX: 0,
};

const DISABLED_PIXEL_RATIO = 2;
const CAMERA_Z = 3.4;
const MODEL_URL = "/models/fox_minecraft.glb";

/**
 * 加载狐狸模型
 */
async function loadFoxModel(): Promise<{
  group: Group;
  dispose: () => void;
}> {
  const loader = new GLTFLoader();
  const gltf = await loader.loadAsync(MODEL_URL);
  
  const group = new Group();
  const model = gltf.scene;
  
  // 调整模型位置和缩放
  model.scale.set(1.5, 1.5, 1.5);
  model.position.set(0, -0.5, 0);
  group.add(model);
  
  // 初始旋转角度
  group.rotation.set(-0.08, 0.55, 0);
  
  return {
    group,
    dispose: () => {
      model.traverse((child) => {
        if (child.type === "Mesh") {
          const mesh = child as THREE.Mesh;
          if (mesh.geometry) {
            mesh.geometry.dispose();
          }
          if (mesh.material) {
            if (Array.isArray(mesh.material)) {
              mesh.material.forEach((mat) => mat.dispose());
            } else {
              mesh.material.dispose();
            }
          }
        }
      });
    },
  };
}

function stopAnimation(): void {
  if (animationHandle) {
    window.cancelAnimationFrame(animationHandle);
    animationHandle = 0;
  }
}

function disposeRenderer(): void {
  stopAnimation();
  if (renderer) {
    renderer.dispose();
    renderer.forceContextLoss();
  }
  renderer = null;
  camera = null;
  scene = null;
  rootGroup = null;
  modelGroup = null;
}

function resizeRenderer(size: number): void {
  if (!renderer || !camera) {
    return;
  }
  const pixelRatio = Math.min(window.devicePixelRatio || 1, DISABLED_PIXEL_RATIO);
  renderer.setPixelRatio(pixelRatio);
  renderer.setSize(size, size, false);
  camera.aspect = 1;
  camera.updateProjectionMatrix();
}

function renderFrame(time: number): void {
  if (disposed || !renderer || !scene || !camera || !rootGroup) {
    return;
  }
  const dt = Math.min((time - lastFrameTime) / 1000, 0.05);
  lastFrameTime = time;

  const idle = time / 1000;
  const targetY = dragState.rotationY;
  const targetX = dragState.rotationX;

  const wanderStrength = props.enableWandering ? 0.45 : 0.18;
  const wanderY = Math.sin(idle * 0.85) * wanderStrength;
  const wanderX = Math.cos(idle * 0.65) * (wanderStrength * 0.45);

  rootGroup.rotation.y += (targetY + wanderY - rootGroup.rotation.y) * Math.min(1, dt * 10);
  rootGroup.rotation.x += (targetX + wanderX - rootGroup.rotation.x) * Math.min(1, dt * 10);
  rootGroup.position.y = Math.sin(idle * 1.25) * (props.enableWandering ? 0.05 : 0.03);

  renderer.render(scene, camera);
  animationHandle = window.requestAnimationFrame(renderFrame);
}

function bindPointerEvents(canvas: HTMLCanvasElement): () => void {
  const getPos = (event: PointerEvent) => {
    const rect = canvas.getBoundingClientRect();
    return new Vector2(event.clientX - rect.left, event.clientY - rect.top);
  };

  const onPointerDown = (event: PointerEvent) => {
    if (event.button !== 0) {
      return;
    }
    dragState.isDragging = true;
    dragState.lastPos = getPos(event);
    canvas.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: PointerEvent) => {
    if (!dragState.isDragging) {
      return;
    }
    const pos = getPos(event);
    const dx = pos.x - dragState.lastPos.x;
    const dy = pos.y - dragState.lastPos.y;
    dragState.lastPos = pos;

    const rotateScale = 1 / 220;
    dragState.rotationY += dx * rotateScale;
    dragState.rotationX += dy * rotateScale;

    const maxX = 0.6;
    dragState.rotationX = Math.max(-maxX, Math.min(maxX, dragState.rotationX));
  };

  const onPointerUp = (event: PointerEvent) => {
    if (!dragState.isDragging) {
      return;
    }
    dragState.isDragging = false;
    if (canvas.hasPointerCapture(event.pointerId)) {
      canvas.releasePointerCapture(event.pointerId);
    }
  };

  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerup", onPointerUp);
  canvas.addEventListener("pointercancel", onPointerUp);

  return () => {
    canvas.removeEventListener("pointerdown", onPointerDown);
    canvas.removeEventListener("pointermove", onPointerMove);
    canvas.removeEventListener("pointerup", onPointerUp);
    canvas.removeEventListener("pointercancel", onPointerUp);
  };
}

async function initThreeRenderer(): Promise<void> {
  if (typeof window === "undefined") {
    return;
  }
  const canvas = canvasRef.value;
  if (!canvas) {
    return;
  }

  disposed = false;
  stopAnimation();
  disposeRenderer();

  renderer = new WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    powerPreference: "high-performance",
  });
  renderer.setClearColor(0x000000, 0);

  scene = new Scene();
  camera = new PerspectiveCamera(45, 1, 0.1, 50);
  camera.position.set(0, 0, CAMERA_Z);

  const ambient = new AmbientLight(0xffffff, 0.75);
  scene.add(ambient);
  const mainLight = new DirectionalLight(0xffffff, 1.25);
  mainLight.position.set(2.2, 2.6, 3.8);
  scene.add(mainLight);
  const rimLight = new DirectionalLight(0xbfd4ff, 0.55);
  rimLight.position.set(-2.6, 1.2, -1.6);
  scene.add(rimLight);

  try {
    const foxModel = await loadFoxModel();
    rootGroup = foxModel.group;
    modelGroup = foxModel.group;
    scene.add(rootGroup);

    resizeRenderer(props.size);

    const unbindPointer = bindPointerEvents(canvas);

    const onResize = () => {
      resizeRenderer(props.size);
    };
    window.addEventListener("resize", onResize);

    lastFrameTime = performance.now();
    animationHandle = window.requestAnimationFrame(renderFrame);

    const cleanup = () => {
      disposed = true;
      stopAnimation();
      unbindPointer();
      window.removeEventListener("resize", onResize);
      foxModel.dispose();
      disposeRenderer();
    };

    // 将清理函数挂到 canvas 上，便于多次 init 时释放
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (canvas as any).__threeCleanup__ = cleanup;
  } catch (error) {
    console.error("[AI外观][狐狸模型]加载失败:", error);
    disposeRenderer();
  }
}

function destroyThreeRenderer(): void {
  const canvas = canvasRef.value;
  if (!canvas) {
    disposeRenderer();
    return;
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cleanup = (canvas as any).__threeCleanup__ as undefined | (() => void);
  if (cleanup) {
    cleanup();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (canvas as any).__threeCleanup__;
  } else {
    disposeRenderer();
  }
}

onMounted(() => {
  initThreeRenderer();
});

onUnmounted(() => {
  destroyThreeRenderer();
});

watch(
  () => props.size,
  () => {
    resizeRenderer(props.size);
  },
);

const containerStyle = computed(() => ({
  width: `${props.size}px`,
  height: `${props.size}px`,
}));
</script>

<template>
  <div
    class="lay-ai-appearance-fox"
    :class="[`variant-${variant}`]"
    :style="containerStyle"
  >
    <div class="three-shell">
      <canvas ref="canvasRef" class="three-canvas" />
    </div>
  </div>
</template>

<style scoped lang="scss">
.lay-ai-appearance-fox {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  position: relative;

  &.variant-fab {
    cursor: pointer;
    transition: transform 0.25s ease;

    &:hover {
      transform: translateY(-2px) scale(1.03);
    }
  }
}

.three-shell {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  overflow: hidden;
  background: radial-gradient(circle at 30% 0, #fbbf24, #f59e0b);
  box-shadow:
    0 10px 30px rgba(15, 23, 42, 0.55),
    0 0 0 1px rgba(148, 163, 184, 0.55);
}

.three-canvas {
  width: 100%;
  height: 100%;
  display: block;
  touch-action: none;
}
</style>

