<script setup lang="ts">
/**
 * ReThree default 主题 —— 通用 Three.js 画布组件
 *
 * 提供标准 Three.js 渲染循环，暴露 scene / camera / renderer 供业务自定义渲染。
 *
 * 用法：import ReThree from '@repo/ui/re-three'
 *  在 render 回调中添加对象到 scene。
 *
 * 生命周期：
 *   onMounted -> initScene -> render 回调 -> RAF 循环
 *   onBeforeUnmount -> 停止 RAF -> 释放 renderer
 */
import {
  ref,
  shallowRef,
  onMounted,
  onBeforeUnmount,
  computed,
  nextTick,
} from "vue";
import * as THREE from "three";
import type { ReThreeContext } from "../../types";

const props = withDefaults(
  defineProps<{
    /** 容器宽度 */
    width?: string | number;
    /** 容器高度 */
    height?: string | number;
    /** 背景色（transparent = 透明） */
    backgroundColor?: string;
    /** 是否自动旋转场景（绕 Y 轴） */
    autoRotate?: boolean;
    /** 自动旋转速度（rad/s） */
    autoRotateSpeed?: number;
    /** 是否启用鼠标交互（点击/悬停穿透到 canvas） */
    interactive?: boolean;
    /** 自定义渲染函数：(ctx) => void */
    render?: (ctx: ReThreeContext) => void;
    /** 每帧更新函数（可选）：(ctx) => void */
    animate?: (ctx: ReThreeContext) => void;
  }>(),
  {
    width: "100%",
    height: "100%",
    backgroundColor: "transparent",
    autoRotate: false,
    autoRotateSpeed: 1,
    interactive: true,
    render: undefined,
    animate: undefined,
  },
);

const emit = defineEmits<{
  (e: "ready", ctx: ReThreeContext): void;
}>();

const containerRef = ref<HTMLDivElement | null>(null);
const instance = shallowRef<ReThreeContext | null>(null);

let renderer: THREE.WebGLRenderer | null = null;
let scene: THREE.Scene | null = null;
let camera: THREE.PerspectiveCamera | null = null;
let animationId: number | null = null;

const containerStyle = computed(() => {
  const w = typeof props.width === "number" ? `${props.width}px` : props.width;
  const h = typeof props.height === "number" ? `${props.height}px` : props.height;
  return { width: w, height: h, position: "relative" as const, overflow: "hidden" as const };
});

function initScene() {
  if (!containerRef.value) return;

  const w = containerRef.value.clientWidth || 400;
  const h = containerRef.value.clientHeight || 300;

  scene = new THREE.Scene();
  if (props.backgroundColor !== "transparent") {
    scene.background = new THREE.Color(props.backgroundColor);
  }

  camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 5000);
  camera.position.set(0, 0, 300);

  renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(w, h);
  containerRef.value.appendChild(renderer.domElement);

  const ambient = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambient);
  const directional = new THREE.DirectionalLight(0xffffff, 1);
  directional.position.set(100, 150, 200);
  scene.add(directional);
  const back = new THREE.DirectionalLight(0xffffff, 0.3);
  back.position.set(-150, -100, -200);
  scene.add(back);

  instance.value = { scene, camera, renderer, THREE };
  emit("ready", instance.value);

  if (props.render) {
    try { props.render(instance.value); }
    catch (e) { console.error("[ReThree] render 回调异常", e); }
  }

  startLoop();
  setupResize();
}

function startLoop() {
  const loop = () => {
    animationId = requestAnimationFrame(loop);
    if (props.autoRotate && scene) {
      scene.rotation.y += (props.autoRotateSpeed * Math.PI) / 180;
    }
    if (props.animate && instance.value) {
      try { props.animate(instance.value); }
      catch (e) { console.error("[ReThree] animate 回调异常", e); }
    }
    if (renderer && scene && camera) {
      renderer.render(scene, camera);
    }
  };
  loop();
}

function stopLoop() {
  if (animationId) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }
}

function setupResize() {
  const observer = new ResizeObserver(() => {
    if (!containerRef.value || !camera || !renderer) return;
    const w = containerRef.value.clientWidth;
    const h = containerRef.value.clientHeight;
    if (w > 0 && h > 0) {
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    }
  });
  if (containerRef.value) observer.observe(containerRef.value);
}

onMounted(async () => {
  await nextTick();
  initScene();
});

onBeforeUnmount(() => {
  stopLoop();
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
  instance.value = null;
});
</script>

<template>
  <div ref="containerRef" :style="containerStyle">
    <slot :scene="scene" :camera="camera" :renderer="renderer" :THREE="instance?.THREE" />
  </div>
</template>