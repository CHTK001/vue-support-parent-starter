<script setup lang="ts">
/**
 * ReClineCharacter —— Cline 首页浮动角色组件
 *
 * 使用 Three.js 程序化构建可爱的白色机器人角色，
 * 站在紫色浮石上，带有正弦波浮动动画和粒子效果。
 *
 * 用法：import ReClineCharacter from '@repo/ui/re-cline-character'
 */
import { ref, watch, onMounted, onBeforeUnmount, computed } from "vue";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const props = withDefaults(
  defineProps<{
    /** 容器宽度 */
    width?: number;
    /** 容器高度 */
    height?: number;
    /** 浮动振幅（像素） */
    floatAmplitude?: number;
    /** 浮动速度（rad/s） */
    floatSpeed?: number;
    /** 是否启用鼠标交互（拖动旋转） */
    interactive?: boolean;
    /** 是否显示粒子效果 */
    particles?: boolean;
    /** 是否自动旋转 */
    autoRotate?: boolean;
    /** 自动旋转速度（rad/s） */
    autoRotateSpeed?: number;
    /** 背景色渐变上色调 */
    gradientTopColor?: string;
    /** 背景色渐变下色调 */
    gradientBottomColor?: string;
    /** 机器人颜色 */
    robotColor?: string;
    /** 浮石颜色 */
    stoneColor?: string;
    /** 眼睛颜色 */
    eyeColor?: string;
  }>(),
  {
    width: 400,
    height: 400,
    floatAmplitude: 12,
    floatSpeed: 1.5,
    interactive: true,
    particles: true,
    autoRotate: false,
    autoRotateSpeed: 0.3,
    gradientTopColor: "#2d1b69",
    gradientBottomColor: "#e8a0d0",
    robotColor: "#f0f0f5",
    stoneColor: "#4a2c8a",
    eyeColor: "#3d1a4a",
  },
);

const emit = defineEmits<{
  (e: "ready"): void;
  (e: "error", err: string): void;
}>();

const containerRef = ref<HTMLDivElement | null>(null);
const loading = ref(true);

let scene: THREE.Scene | null = null;
let camera: THREE.PerspectiveCamera | null = null;
let renderer: THREE.WebGLRenderer | null = null;
let characterGroup: THREE.Group | null = null;
let controls: THREE.OrbitControls | null = null;
let particles: THREE.Points | null = null;
let animationId: number | null = null;
let clock: THREE.Clock | null = null;

function createGradientTexture(
  topColor: string,
  bottomColor: string,
  width = 512,
  height = 512,
): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, topColor);
  gradient.addColorStop(1, bottomColor);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  // Add subtle grain
  for (let i = 0; i < 3000; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const alpha = Math.random() * 0.04;
    ctx.fillStyle = `rgba(255,255,255,${alpha})`;
    ctx.fillRect(x, y, 1, 1);
  }
  return new THREE.CanvasTexture(canvas);
}

function createStoneGeometry(): THREE.ShapeGeometry {
  const shape = new THREE.Shape();
  const W = 3.2, H = 0.8, R = 0.5;
  shape.moveTo(-W / 2 + R, -H / 2);
  shape.lineTo(W / 2 - R, -H / 2);
  shape.quadraticCurveTo(W / 2, -H / 2, W / 2, -H / 2 + R);
  shape.lineTo(W / 2, H / 2 - R);
  shape.quadraticCurveTo(W / 2, H / 2, W / 2 - R, H / 2);
  // Top surface with bumps
  const bumps = 7;
  const bumpWidth = W / bumps;
  for (let i = 0; i < bumps; i++) {
    const x = -W / 2 + i * bumpWidth;
    const bumpH = (i % 2 === 0 ? 0.25 : 0.15) * H;
    shape.lineTo(x + bumpWidth / 2, H / 2 + bumpH);
    shape.lineTo(x + bumpWidth, H / 2);
  }
  shape.lineTo(-W / 2 + R, H / 2);
  shape.quadraticCurveTo(-W / 2, H / 2, -W / 2, H / 2 - R);
  shape.lineTo(-W / 2, -H / 2 + R);
  shape.quadraticCurveTo(-W / 2, -H / 2, -W / 2 + R, -H / 2);
  return new THREE.ShapeGeometry(shape, 32);
}

function buildCharacter(): THREE.Group {
  const group = new THREE.Group();
  const { robotColor, stoneColor, eyeColor } = props;

  // Stone platform
  const stoneGeo = createStoneGeometry();
  const stoneMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(stoneColor),
    roughness: 0.7,
    metalness: 0.1,
    flatShading: true,
  });
  const stone = new THREE.Mesh(stoneGeo, stoneMat);
  stone.position.y = -1.4;
  stone.castShadow = true;
  stone.receiveShadow = true;
  group.add(stone);

  // Stone shadow (dark plane below)
  const shadowGeo = new THREE.PlaneGeometry(4, 1.2);
  const shadowMat = new THREE.MeshBasicMaterial({
    color: 0x000000,
    transparent: true,
    opacity: 0.25,
    depthWrite: false,
  });
  const shadow = new THREE.Mesh(shadowGeo, shadowMat);
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = -1.85;
  group.add(shadow);

  // Body
  const bodyGeo = new THREE.BoxGeometry(0.9, 1.0, 0.7, 2, 2, 2);
  const bodyMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(robotColor),
    roughness: 0.4,
    metalness: 0.05,
  });
  // Round the body slightly by using a custom approach - just use box with bevel feel
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.y = -0.3;
  body.castShadow = true;
  group.add(body);

  // Neck
  const neckGeo = new THREE.CylinderGeometry(0.15, 0.18, 0.2, 8);
  const neckMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(robotColor) });
  const neck = new THREE.Mesh(neckGeo, neckMat);
  neck.position.y = 0.25;
  group.add(neck);

  // Head (rounded box)
  const headGeo = new THREE.BoxGeometry(1.3, 1.1, 0.9, 4, 4, 4);
  const headMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(robotColor),
    roughness: 0.3,
    metalness: 0.05,
  });
  const head = new THREE.Mesh(headGeo, headMat);
  head.position.y = 0.95;
  head.castShadow = true;
  group.add(head);

  // Antenna on head
  const antennaStemGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.3, 6);
  const antennaMat = new THREE.MeshStandardMaterial({ color: 0x888899 });
  const antennaStem = new THREE.Mesh(antennaStemGeo, antennaMat);
  antennaStem.position.set(0, 1.65, 0);
  group.add(antennaStem);

  const antennaBallGeo = new THREE.SphereGeometry(0.08, 8, 8);
  const antennaBallMat = new THREE.MeshStandardMaterial({
    color: 0x9663f1,
    emissive: 0x9663f1,
    emissiveIntensity: 0.5,
  });
  const antennaBall = new THREE.Mesh(antennaBallGeo, antennaBallMat);
  antennaBall.position.set(0, 1.85, 0);
  group.add(antennaBall);

  // Eyes (dark ovals)
  const eyeGeo = new THREE.SphereGeometry(0.14, 8, 8);
  const eyeMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(eyeColor),
    roughness: 0.2,
  });
  // Flatten to make oval
  eyeGeo.scale(1, 1.3, 0.6);

  const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
  leftEye.position.set(-0.3, 1.05, 0.42);
  group.add(leftEye);

  const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
  rightEye.position.set(0.3, 1.05, 0.42);
  group.add(rightEye);

  // Eye highlights
  const highlightGeo = new THREE.SphereGeometry(0.04, 6, 6);
  const highlightMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const leftHighlight = new THREE.Mesh(highlightGeo, highlightMat);
  leftHighlight.position.set(-0.26, 1.12, 0.5);
  group.add(leftHighlight);
  const rightHighlight = new THREE.Mesh(highlightGeo, highlightMat);
  rightHighlight.position.set(0.34, 1.12, 0.5);
  group.add(rightHighlight);

  // Ears (small triangles on sides)
  const earGeo = new THREE.ConeGeometry(0.12, 0.2, 3);
  const earMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(robotColor) });
  const leftEar = new THREE.Mesh(earGeo, earMat);
  leftEar.position.set(-0.72, 1.0, 0);
  leftEar.rotation.z = 0.3;
  group.add(leftEar);
  const rightEar = new THREE.Mesh(earGeo, earMat);
  rightEar.position.set(0.72, 1.0, 0);
  rightEar.rotation.z = -0.3;
  group.add(rightEar);

  // Arms
  const armGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.5, 6);
  const armMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(robotColor) });
  const leftArm = new THREE.Mesh(armGeo, armMat);
  leftArm.position.set(-0.58, -0.1, 0);
  leftArm.rotation.z = 0.15;
  group.add(leftArm);
  const rightArm = new THREE.Mesh(armGeo, armMat);
  rightArm.position.set(0.58, -0.1, 0);
  rightArm.rotation.z = -0.15;
  group.add(rightArm);

  // Hands (small spheres)
  const handGeo = new THREE.SphereGeometry(0.1, 8, 8);
  const leftHand = new THREE.Mesh(handGeo, armMat);
  leftHand.position.set(-0.62, -0.38, 0);
  group.add(leftHand);
  const rightHand = new THREE.Mesh(handGeo, armMat);
  rightHand.position.set(0.62, -0.38, 0);
  group.add(rightHand);

  // Legs (tiny)
  const legGeo = new THREE.CylinderGeometry(0.07, 0.07, 0.25, 6);
  const leftLeg = new THREE.Mesh(legGeo, armMat);
  leftLeg.position.set(-0.2, -0.9, 0);
  group.add(leftLeg);
  const rightLeg = new THREE.Mesh(legGeo, armMat);
  rightLeg.position.set(0.2, -0.9, 0);
  group.add(rightLeg);

  // Feet
  const footGeo = new THREE.BoxGeometry(0.16, 0.06, 0.22);
  const leftFoot = new THREE.Mesh(footGeo, armMat);
  leftFoot.position.set(-0.2, -1.05, 0.05);
  group.add(leftFoot);
  const rightFoot = new THREE.Mesh(footGeo, armMat);
  rightFoot.position.set(0.2, -1.05, 0.05);
  group.add(rightFoot);

  group.position.y = 0.1;
  return group;
}

function createParticles(): THREE.Points {
  const count = 80;
  const positions = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 12;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 8;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 6 - 2;
    sizes[i] = Math.random() * 3 + 1;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geo.setAttribute("size", new THREE.BufferAttribute(sizes, 1));

  // Create star-like particle texture
  const canvas = document.createElement("canvas");
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext("2d")!;
  const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
  grad.addColorStop(0, "rgba(255,255,255,1)");
  grad.addColorStop(0.3, "rgba(200,180,255,0.6)");
  grad.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 32, 32);
  const tex = new THREE.CanvasTexture(canvas);

  const mat = new THREE.PointsMaterial({
    map: tex,
    size: 0.12,
    transparent: true,
    opacity: 0.6,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true,
  });
  return new THREE.Points(geo, mat);
}

function initScene() {
  if (!containerRef.value) return;
  const container = containerRef.value;
  const w = props.width;
  const h = props.height;

  scene = new THREE.Scene();

  // Background: use a large plane with gradient texture instead of scene.background
  // so it blends with the container
  const bgGeo = new THREE.PlaneGeometry(30, 20);
  const bgTex = createGradientTexture(props.gradientTopColor, props.gradientBottomColor);
  const bgMat = new THREE.MeshBasicMaterial({ map: bgTex, depthWrite: false });
  const bgMesh = new THREE.Mesh(bgGeo, bgMat);
  bgMesh.position.z = -5;
  scene.add(bgMesh);

  camera = new THREE.PerspectiveCamera(40, w / h, 0.1, 100);
  camera.position.set(0, 0.5, 6);
  camera.lookAt(0, 0.2, 0);

  renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setSize(w, h);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  container.appendChild(renderer.domElement);

  // Lights
  const ambient = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambient);

  const dirLight = new THREE.DirectionalLight(0xffeedd, 1.0);
  dirLight.position.set(3, 5, 4);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.width = 1024;
  dirLight.shadow.mapSize.height = 1024;
  dirLight.shadow.camera.near = 0.5;
  dirLight.shadow.camera.far = 20;
  dirLight.shadow.camera.left = -3;
  dirLight.shadow.camera.right = 3;
  dirLight.shadow.camera.top = 3;
  dirLight.shadow.camera.bottom = -3;
  scene.add(dirLight);

  const fillLight = new THREE.DirectionalLight(0x9663f1, 0.3);
  fillLight.position.set(-3, 2, -2);
  scene.add(fillLight);

  const rimLight = new THREE.DirectionalLight(0xffffff, 0.2);
  rimLight.position.set(0, -2, -3);
  scene.add(rimLight);

  // Character
  characterGroup = buildCharacter();
  scene.add(characterGroup);

  // Particles
  if (props.particles) {
    particles = createParticles();
    scene.add(particles);
  }

  // OrbitControls
  if (props.interactive) {
    controls = new OrbitControls(
      camera,
      renderer.domElement,
    );
    controls.enableZoom = false;
    controls.enablePan = false;
    controls.mouseButtons = { LEFT: THREE.MOUSE.ROTATE, MIDDLE: null, RIGHT: null };
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minPolarAngle = Math.PI * 0.3;
    controls.maxPolarAngle = Math.PI * 0.7;
    controls.minAzimuthAngle = -Math.PI * 0.3;
    controls.maxAzimuthAngle = Math.PI * 0.3;
    controls.update();
  }

  clock = new THREE.Clock();
  loading.value = false;
  emit("ready");
}

function animate() {
  animationId = requestAnimationFrame(animate);
  const elapsed = clock!.getElapsedTime();

  // Floating animation (sine wave)
  if (characterGroup) {
    const floatY = props.floatAmplitude * 0.01 * Math.sin(elapsed * props.floatSpeed);
    characterGroup.position.y = 0.1 + floatY;
    // Subtle tilt
    characterGroup.rotation.z = Math.sin(elapsed * props.floatSpeed * 0.5) * 0.02;
    characterGroup.rotation.x = Math.sin(elapsed * props.floatSpeed * 0.7) * 0.01;
  }

  // Particle animation
  if (particles) {
    particles.rotation.y = elapsed * 0.02;
    const pos = particles.geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i);
      pos.setY(i, y + Math.sin(elapsed + i) * 0.001);
    }
    pos.needsUpdate = true;
  }

  // Auto rotate
  if (props.autoRotate && characterGroup) {
    characterGroup.rotation.y += props.autoRotateSpeed * 0.01;
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
  characterGroup = null;
  particles = null;
  clock = null;
}

const containerStyle = computed(() => ({
  width: `${props.width}px`,
  height: `${props.height}px`,
  position: "relative",
  overflow: "hidden",
}));

watch(
  () => props.width,
  () => {
    if (!containerRef.value || !renderer) return;
    const w = containerRef.value.clientWidth;
    const h = containerRef.value.clientHeight;
    if (w > 0 && h > 0) {
      camera!.aspect = w / h;
      camera!.updateProjectionMatrix();
      renderer.setSize(w, h);
    }
  },
);

onMounted(() => {
  initScene();
  startAnimation();
});

onBeforeUnmount(() => {
  destroyScene();
});
</script>

<template>
  <div class="re-cline-character" :style="containerStyle">
    <div v-if="loading" class="re-cline-character__loading">
      <div class="re-cline-character__spinner" />
      <span>加载中...</span>
    </div>
    <div ref="containerRef" class="re-cline-character__canvas" />
  </div>
</template>

<style lang="scss" scoped>
.re-cline-character {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;

  &__canvas {
    width: 100%;
    height: 100%;
    canvas {
      width: 100%;
      height: 100%;
      display: block;
    }
  }

  &__loading {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
    font-size: 13px;
    color: var(--el-text-color-secondary);
    background: linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%);
    border-radius: 12px;
  }

  &__spinner {
    width: 32px;
    height: 32px;
    border: 3px solid rgba(150, 99, 241, 0.15);
    border-top-color: #9663f1;
    border-radius: 50%;
    animation: re-cline-spin 0.8s linear infinite;
  }

  @keyframes re-cline-spin {
    to { transform: rotate(360deg); }
  }
}

:root.dark {
  .re-cline-character__loading {
    background: linear-gradient(135deg, #1a1035 0%, #2d1b69 100%);
    color: rgba(255,255,255,0.6);
  }
  .re-cline-character__spinner {
    border-color: rgba(150, 99, 241, 0.2);
    border-top-color: #c4a9ff;
  }
}
</style>
