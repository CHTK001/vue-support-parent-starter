<script setup lang="ts">
/**
 * ReClineCharacter —— 浮动 ASCII 字符画 / 3D 机器人组件
 *
 * 三种模式（优先级由高到低）：
 *   1. ascii  prop  →  输入原始字符画字符串，转成 3D 浮雕平面动画
 *   2. src    prop  →  输入图片 URL，自动转为字符画再渲染为 3D 浮雕
 *   3. 两者均未传  →  渲染默认的 Cline 机器人（程序化 3D 模型）
 *
 * 用法：
 *   import ReClineCharacter from '@repo/ui/re-cline-character'
 */
import { ref, watch, onMounted, onBeforeUnmount, computed, type CSSProperties } from "vue";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

// ─── 默认 Cline 机器人 ASCII ───────────────────────────────────────
const DEFAULT_ASCII = [
  "      .-.      ",
  "     (   )     ",
  "    /     \\    ",
  "   |  O O  |   ",
  "   |  ^^^  |   ",
  "    \\_____/    ",
  "    |  |  |    ",
  "    |  |  |    ",
  "   _|  |  |_   ",
  "  (_________)  ",
].join("\n");

// ─── Props ────────────────────────────────────────────────────────
const props = withDefaults(
  defineProps<{
    /** ASCII 字符画（每行以 \\n 分隔），优先级最高 */
    ascii?: string;
    /** 图片 URL（自动转字符画）*/
    src?: string;
    /** 容器宽度 */
    width?: number;
    /** 容器高度 */
    height?: number;
    /** 浮动振幅 */
    floatAmplitude?: number;
    /** 浮动速度 rad/s */
    floatSpeed?: number;
    /** 是否启用鼠标交互（拖动旋转） */
    interactive?: boolean;
    /** 是否显示粒子效果 */
    particles?: boolean;
    /** 是否自动旋转 */
    autoRotate?: boolean;
    /** 自动旋转速度 rad/s */
    autoRotateSpeed?: number;
    /** 背景色渐变上色调 */
    gradientTopColor?: string;
    /** 背景色渐变下色调 */
    gradientBottomColor?: string;
    /** ASCII 字号（px） */
    fontSize?: number;
    /** ASCII 字符密度（水平方向字符数）*/
    charWidth?: number;
    /** 置换强度（仅 ascii/src 模式） */
    displacementScale?: number;
    /** 网格细分密度 */
    segments?: number;
    /** 角色颜色（仅 default 模式） */
    robotColor?: string;
    /** 浮石颜色（仅 default 模式） */
    stoneColor?: string;
    /** 眼睛颜色（仅 default 模式） */
    eyeColor?: string;
    /** 是否允许上传本地图片 */
    allowUpload?: boolean;
    /** 占位文字 */
    placeholder?: string;
    /** 主光源颜色 */
    lightColor?: string;
    /** 填充光颜色 */
    fillLightColor?: string;
  }>(),
  {
    width: 400,
    height: 400,
    floatAmplitude: 10,
    floatSpeed: 1.2,
    interactive: true,
    particles: true,
    autoRotate: false,
    autoRotateSpeed: 0.3,
    gradientTopColor: "#2d1b69",
    gradientBottomColor: "#e8a0d0",
    fontSize: 14,
    charWidth: 60,
    displacementScale: 0.4,
    segments: 100,
    robotColor: "#f0f0f5",
    stoneColor: "#4a2c8a",
    eyeColor: "#3d1a4a",
    allowUpload: false,
    placeholder: "点击或拖入图片",
    lightColor: "#ffffff",
    fillLightColor: "#9663f1",
  },
);

const emit = defineEmits<{
  (e: "ready"): void;
  (e: "error", msg: string): void;
}>();

// ─── Refs ─────────────────────────────────────────────────────────
const containerRef = ref<HTMLDivElement | null>(null);
const fileInputRef = ref<HTMLInputElement | null>(null);
const loading = ref(true);
const errorMsg = ref("");
const _mode = ref<"default" | "ascii">("default");
const _imageLoaded = ref(false);

let scene: THREE.Scene | null = null;
let camera: THREE.PerspectiveCamera | null = null;
let renderer: THREE.WebGLRenderer | null = null;
let characterGroup: THREE.Group | null = null;
let asciiMesh: THREE.Mesh | null = null;
let particles: THREE.Points | null = null;
let controls: OrbitControls | null = null;
let animationId: number | null = null;
let clock: THREE.Clock | null = null;

// ─── 工具函数 ─────────────────────────────────────────────────────

/** 图片 → ASCII 字符画 */
function imageToAscii(
  img: HTMLImageElement,
  targetWidth: number,
  charSet: string = "@%#*+=-:. ",
): string {
  const aspectRatio = img.height / img.width;
  const fontRatio = 0.5; // 字符高宽比
  const targetHeight = Math.round(targetWidth * aspectRatio * fontRatio);

  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

  const imageData = ctx.getImageData(0, 0, targetWidth, targetHeight);
  const chars: string[] = [];

  for (let y = 0; y < targetHeight; y += 2) {
    const line: string[] = [];
    for (let x = 0; x < targetWidth; x += 1) {
      const idx = (y * targetWidth + x) * 4;
      const r = imageData.data[idx];
      const g = imageData.data[idx + 1];
      const b = imageData.data[idx + 2];
      const brightness = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      const charIdx = Math.floor(brightness * (charSet.length - 1));
      line.push(charSet[charIdx]);
    }
    chars.push(line.join(""));
  }
  return chars.join("\n");
}

/** ASCII 字符串 → Canvas 深度图 */
function asciiToDepthCanvas(
  ascii: string,
  canvasWidth: number,
  fontSize: number,
  charSet: string = "@%#*+=-:. ",
): HTMLCanvasElement {
  const lines = ascii.split("\n").filter((l) => l.trim());
  if (lines.length === 0) {
    // Fallback empty canvas
    const c = document.createElement("canvas");
    c.width = canvasWidth;
    c.height = 64;
    return c;
  }

  // Measure font to find actual width
  const testCanvas = document.createElement("canvas");
  const testCtx = testCanvas.getContext("2d")!;
  testCtx.font = `${fontSize}px monospace`;
  const charW = testCtx.measureText("M").width;
  const lineH = fontSize * 1.2;

  const lineHeight = Math.max(lines[0].length * charW, canvasWidth);
  const canvasHeight = Math.max(lines.length * lineH, 64);

  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(lineHeight);
  canvas.height = Math.ceil(canvasHeight);
  const ctx = canvas.getContext("2d")!;

  // Dark background
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw bright characters
  ctx.fillStyle = "#ffffff";
  ctx.font = `${fontSize}px monospace`;
  ctx.textBaseline = "top";

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (let j = 0; j < line.length; j++) {
      const ch = line[j];
      if (ch === " " || ch === "") continue;
      const brightness = charSet.indexOf(ch);
      const intensity = Math.max(0, Math.min(255, Math.round((brightness / (charSet.length - 1)) * 255)));
      ctx.fillStyle = `rgb(${intensity},${intensity},${intensity})`;
      ctx.fillText(ch, j * charW, i * lineH);
    }
  }
  return canvas;
}

/** 加载图片为 HTMLImageElement */
function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`图片加载失败: ${url}`));
    img.src = url;
  });
}

/** 加载文件为 data URL */
function loadFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("文件读取失败"));
    reader.readAsDataURL(file);
  });
}

// ─── 场景初始化 ────────────────────────────────────────────────────

async function initScene(asciiContent?: string) {
  if (!containerRef.value) return;
  const container = containerRef.value;
  const w = props.width;
  const h = props.height;

  // 清空旧场景
  destroyScene();

  scene = new THREE.Scene();
  // Background gradient is handled by bgMesh, no scene.background needed

  camera = new THREE.PerspectiveCamera(40, w / h, 0.1, 100);
  camera.position.set(0, 0.3, 5);
  camera.lookAt(0, 0, 0);

  renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setSize(w, h);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  container.appendChild(renderer.domElement);

  // 灯光
  const ambient = new THREE.AmbientLight(0xffffff, 0.5);
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
  rimLight.position.set(0, -2, -3);
  scene.add(rimLight);

  // 背景渐变
  const bgGeo = new THREE.PlaneGeometry(30, 20);
  const bgCanvas = document.createElement("canvas");
  bgCanvas.width = 512;
  bgCanvas.height = 512;
  const bgCtx = bgCanvas.getContext("2d")!;
  const bgGrad = bgCtx.createLinearGradient(0, 0, 0, 512);
  bgGrad.addColorStop(0, props.gradientTopColor);
  bgGrad.addColorStop(1, props.gradientBottomColor);
  bgCtx.fillStyle = bgGrad;
  bgCtx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 2000; i++) {
    const gx = Math.random() * 512;
    const gy = Math.random() * 512;
    bgCtx.fillStyle = `rgba(255,255,255,${Math.random() * 0.03})`;
    bgCtx.fillRect(gx, gy, 1, 1);
  }
  const bgTex = new THREE.CanvasTexture(bgCanvas);
  const bgMat = new THREE.MeshBasicMaterial({ map: bgTex, depthWrite: false });
  const bgMesh = new THREE.Mesh(bgGeo, bgMat);
  bgMesh.position.z = -6;
  scene.add(bgMesh);

  // ── 根据模式构建内容 ──
  if (asciiContent) {
    // ASCII 模式
    _mode.value = "ascii";
    const depthCanvas = asciiToDepthCanvas(asciiContent, w, props.fontSize, "@%#*+=-:. ");
    const srcPixels = depthCanvas.getContext("2d")!.getImageData(0, 0, depthCanvas.width, depthCanvas.height).data;
    const count = depthCanvas.width * depthCanvas.height;
    const arr = new Uint8Array(count);
    for (let i = 0, j = 0; i < count; i++, j += 4) arr[i] = srcPixels[j];

    const depthTex = new THREE.DataTexture(arr, depthCanvas.width, depthCanvas.height, THREE.RedFormat);
    depthTex.needsUpdate = true;
    depthTex.minFilter = THREE.LinearFilter;
    depthTex.magFilter = THREE.LinearFilter;

    // 反向颜色图（用于正面渲染）
    const invCanvas = document.createElement("canvas");
    invCanvas.width = depthCanvas.width;
    invCanvas.height = depthCanvas.height;
    const invCtx = invCanvas.getContext("2d")!;
    invCtx.fillStyle = "#1a1035";
    invCtx.fillRect(0, 0, invCanvas.width, invCanvas.height);
    invCtx.drawImage(depthCanvas, 0, 0);
    const colorTex = new THREE.CanvasTexture(invCanvas);

    const segs = props.segments;
    const aspect = depthCanvas.width / depthCanvas.height;
    const geoH = 3;
    const geoW = geoH * aspect;
    const geo = new THREE.PlaneGeometry(geoW, geoH, segs, segs);
    const mat = new THREE.MeshStandardMaterial({
      map: colorTex,
      displacementMap: depthTex,
      displacementScale: props.displacementScale,
      roughness: 0.5,
      metalness: 0.1,
      side: THREE.DoubleSide,
    });
    asciiMesh = new THREE.Mesh(geo, mat);
    asciiMesh.castShadow = true;
    asciiMesh.receiveShadow = true;

    characterGroup = new THREE.Group();
    characterGroup.add(asciiMesh);

    // 阴影面
    const shadowGeo = new THREE.PlaneGeometry(geoW + 1, 0.5);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000, transparent: true, opacity: 0.2, depthWrite: false,
    });
    const shadow = new THREE.Mesh(shadowGeo, shadowMat);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = -geoH / 2 - 0.3;
    characterGroup.add(shadow);

    scene.add(characterGroup);
  } else {
    // 默认 Cline 机器人模式
    _mode.value = "default";
    characterGroup = buildDefaultRobot();
    scene.add(characterGroup);
  }

  // 粒子
  if (props.particles) {
    particles = createParticles();
    scene.add(particles);
  }

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

  clock = new THREE.Clock();
  loading.value = false;
  _imageLoaded.value = true;
  emit("ready");
}

// ─── 默认 Cline 机器人（程序化 3D 模型） ─────────────────────────

function buildDefaultRobot(): THREE.Group {
  const group = new THREE.Group();
  const { robotColor, stoneColor, eyeColor } = props;

  // 浮石
  const stoneGeo = new THREE.ShapeGeometry(buildStoneShape());
  const stoneMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(stoneColor), roughness: 0.7, metalness: 0.1, flatShading: true,
  });
  const stone = new THREE.Mesh(stoneGeo, stoneMat);
  stone.position.y = -1.4;
  stone.castShadow = true;
  stone.receiveShadow = true;
  group.add(stone);

  // 石头阴影
  const shadowGeo = new THREE.PlaneGeometry(4, 1.2);
  const shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.25, depthWrite: false });
  const shadow = new THREE.Mesh(shadowGeo, shadowMat);
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = -1.85;
  group.add(shadow);

  // 身体
  const bodyGeo = new THREE.BoxGeometry(0.9, 1.0, 0.7, 2, 2, 2);
  const bodyMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(robotColor), roughness: 0.4, metalness: 0.05 });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.y = -0.3;
  body.castShadow = true;
  group.add(body);

  // 脖子
  const neckGeo = new THREE.CylinderGeometry(0.15, 0.18, 0.2, 8);
  const neck = new THREE.Mesh(neckGeo, bodyMat);
  neck.position.y = 0.25;
  group.add(neck);

  // 头
  const headGeo = new THREE.BoxGeometry(1.3, 1.1, 0.9, 4, 4, 4);
  const headMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(robotColor), roughness: 0.3, metalness: 0.05 });
  const head = new THREE.Mesh(headGeo, headMat);
  head.position.y = 0.95;
  head.castShadow = true;
  group.add(head);

  // 天线
  const antStemGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.3, 6);
  const antStemMat = new THREE.MeshStandardMaterial({ color: 0x888899 });
  const antStem = new THREE.Mesh(antStemGeo, antStemMat);
  antStem.position.set(0, 1.65, 0);
  group.add(antStem);

  const antBallGeo = new THREE.SphereGeometry(0.08, 8, 8);
  const antBallMat = new THREE.MeshStandardMaterial({ color: 0x9663f1, emissive: 0x9663f1, emissiveIntensity: 0.5 });
  const antBall = new THREE.Mesh(antBallGeo, antBallMat);
  antBall.position.set(0, 1.85, 0);
  group.add(antBall);

  // 眼睛
  const eyeGeo = new THREE.SphereGeometry(0.14, 8, 8);
  eyeGeo.scale(1, 1.3, 0.6);
  const eyeMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(eyeColor), roughness: 0.2 });
  const le = new THREE.Mesh(eyeGeo, eyeMat);
  le.position.set(-0.3, 1.05, 0.42);
  group.add(le);
  const re = new THREE.Mesh(eyeGeo, eyeMat);
  re.position.set(0.3, 1.05, 0.42);
  group.add(re);

  // 眼球高光
  const hlGeo = new THREE.SphereGeometry(0.04, 6, 6);
  const hlMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const hlL = new THREE.Mesh(hlGeo, hlMat);
  hlL.position.set(-0.26, 1.12, 0.5);
  group.add(hlL);
  const hlR = new THREE.Mesh(hlGeo, hlMat);
  hlR.position.set(0.34, 1.12, 0.5);
  group.add(hlR);

  // 耳朵
  const earGeo = new THREE.ConeGeometry(0.12, 0.2, 3);
  const earMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(robotColor) });
  const le2 = new THREE.Mesh(earGeo, earMat);
  le2.position.set(-0.72, 1.0, 0);
  le2.rotation.z = 0.3;
  group.add(le2);
  const re2 = new THREE.Mesh(earGeo, earMat);
  re2.position.set(0.72, 1.0, 0);
  re2.rotation.z = -0.3;
  group.add(re2);

  // 手臂
  const armGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.5, 6);
  const la = new THREE.Mesh(armGeo, earMat);
  la.position.set(-0.58, -0.1, 0);
  la.rotation.z = 0.15;
  group.add(la);
  const ra = new THREE.Mesh(armGeo, earMat);
  ra.position.set(0.58, -0.1, 0);
  ra.rotation.z = -0.15;
  group.add(ra);

  // 手
  const handGeo = new THREE.SphereGeometry(0.1, 8, 8);
  const lh = new THREE.Mesh(handGeo, earMat);
  lh.position.set(-0.62, -0.38, 0);
  group.add(lh);
  const rh = new THREE.Mesh(handGeo, earMat);
  rh.position.set(0.62, -0.38, 0);
  group.add(rh);

  // 腿
  const legGeo = new THREE.CylinderGeometry(0.07, 0.07, 0.25, 6);
  const ll = new THREE.Mesh(legGeo, earMat);
  ll.position.set(-0.2, -0.9, 0);
  group.add(ll);
  const rl = new THREE.Mesh(legGeo, earMat);
  rl.position.set(0.2, -0.9, 0);
  group.add(rl);

  // 脚
  const footGeo = new THREE.BoxGeometry(0.16, 0.06, 0.22);
  const lf = new THREE.Mesh(footGeo, earMat);
  lf.position.set(-0.2, -1.05, 0.05);
  group.add(lf);
  const rf = new THREE.Mesh(footGeo, earMat);
  rf.position.set(0.2, -1.05, 0.05);
  group.add(rf);

  group.position.y = 0.1;
  return group;
}

function buildStoneShape(): THREE.Shape {
  const shape = new THREE.Shape();
  const W = 3.2, H = 0.8, R = 0.5;
  shape.moveTo(-W / 2 + R, -H / 2);
  shape.lineTo(W / 2 - R, -H / 2);
  shape.quadraticCurveTo(W / 2, -H / 2, W / 2, -H / 2 + R);
  shape.lineTo(W / 2, H / 2 - R);
  shape.quadraticCurveTo(W / 2, H / 2, W / 2 - R, H / 2);
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
  return shape;
}

// ─── 粒子 ─────────────────────────────────────────────────────────

function createParticles(): THREE.Points {
  const count = 80;
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 12;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 8;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 6 - 2;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));

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
    map: tex, size: 0.12, transparent: true, opacity: 0.6,
    depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true,
  });
  return new THREE.Points(geo, mat);
}

// ─── 动画循环 ─────────────────────────────────────────────────────

function animate() {
  animationId = requestAnimationFrame(animate);
  const elapsed = clock!.getElapsedTime();

  // 浮动
  if (characterGroup) {
    const floatY = props.floatAmplitude * 0.01 * Math.sin(elapsed * props.floatSpeed);
    characterGroup.position.y = floatY;
    characterGroup.rotation.z = Math.sin(elapsed * props.floatSpeed * 0.5) * 0.02;
    characterGroup.rotation.x = Math.sin(elapsed * props.floatSpeed * 0.7) * 0.01;
  }

  // 粒子
  if (particles) {
    particles.rotation.y = elapsed * 0.02;
    const pos = particles.geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      pos.setY(i, pos.getY(i) + Math.sin(elapsed + i) * 0.001);
    }
    pos.needsUpdate = true;
  }

  // 自动旋转
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
  if (animationId) { cancelAnimationFrame(animationId); animationId = null; }
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
  asciiMesh = null;
  particles = null;
  clock = null;
}

// ─── 计算属性 ──────────────────────────────────────────────────────

const containerStyle = computed<CSSProperties>(() => ({
  width: `${props.width}px`,
  height: `${props.height}px`,
  position: "relative" as const,
  overflow: "hidden" as const,
  cursor: props.interactive ? "grab" as const : "default",
}));

const hasInput = computed(() => Boolean(props.ascii || props.src));

// ─── 事件处理 ─────────────────────────────────────────────────────

async function handleFileChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file || !file.type.startsWith("image/")) return;
  try {
    const dataUrl = await loadFileAsDataURL(file);
    const img = await loadImage(dataUrl);
    const ascii = imageToAscii(img, props.charWidth);
    errorMsg.value = "";
    loading.value = true;
    await initScene(ascii);
    startAnimation();
  } catch (err) {
    errorMsg.value = err instanceof Error ? err.message : "加载失败";
    loading.value = false;
  }
}

// ─── 生命周期 ─────────────────────────────────────────────────────

watch(
  () => [props.ascii, props.src, props.displacementScale, props.segments] as const,
  async ([newAscii, newSrc]) => {
    if (!containerRef.value) return;
    errorMsg.value = "";
    loading.value = true;
    if (newAscii) {
      try {
        await initScene(newAscii);
        startAnimation();
      } catch (e) {
        errorMsg.value = e instanceof Error ? e.message : "初始化失败";
        loading.value = false;
      }
    } else if (newSrc) {
      try {
        const img = await loadImage(newSrc);
        const ascii = imageToAscii(img, props.charWidth);
        await initScene(ascii);
        startAnimation();
      } catch (e) {
        errorMsg.value = e instanceof Error ? e.message : "加载失败";
        loading.value = false;
      }
    } else {
      // 默认机器人模式
      await initScene();
      startAnimation();
    }
  },
  { immediate: true },
);

watch(
  () => props.width,
  () => {
    if (!containerRef.value || !renderer) return;
    const cw = containerRef.value.clientWidth;
    const ch = containerRef.value.clientHeight;
    if (cw > 0 && ch > 0 && camera) {
      camera.aspect = cw / ch;
      camera.updateProjectionMatrix();
      renderer.setSize(cw, ch);
    }
  },
);

onMounted(() => {
  if (!hasInput.value) {
    initScene().then(startAnimation).catch((e) => {
      errorMsg.value = e instanceof Error ? e.message : "初始化失败";
      loading.value = false;
    });
  }
});

onBeforeUnmount(() => {
  destroyScene();
});
</script>

<template>
  <div class="re-cline-character" :style="containerStyle">
    <!-- 未加载时显示占位/上传 -->
    <div v-if="!_imageLoaded && !hasInput" class="re-cline-character__placeholder">
      <svg class="re-cline-character__placeholder-icon" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="9" cy="9" r="2" />
        <path d="M21 15l-5-5L5 21" />
      </svg>
      <p class="re-cline-character__placeholder-text">{{ placeholder }}</p>
      <input v-if="allowUpload" ref="fileInputRef" type="file" accept="image/*" class="re-cline-character__file-input" @change="handleFileChange" />
      <button v-if="allowUpload" class="re-cline-character__upload-btn" @click="fileInputRef?.click()">选择图片</button>
    </div>

    <!-- 加载中 -->
    <div v-else-if="loading" class="re-cline-character__loading">
      <div class="re-cline-character__spinner" />
      <span>{{ _mode === "ascii" ? "转换字符画中..." : "加载中..." }}</span>
    </div>

    <!-- Three.js 画布 -->
    <div v-else ref="containerRef" class="re-cline-character__canvas" />

    <!-- 错误 -->
    <div v-if="errorMsg" class="re-cline-character__error">
      <span>{{ errorMsg }}</span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.re-cline-character {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  overflow: hidden;

  &__canvas {
    width: 100%;
    height: 100%;
    canvas { width: 100%; height: 100%; display: block; }
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
    transition: background 0.2s;
    user-select: none;

    &:hover { background: linear-gradient(135deg, #ede9fe 0%, #ddd6fe 50%, #c7d2fe 100%); }

    &-icon { color: #9663f1; opacity: 0.6; transition: opacity 0.2s; }
    &:hover &-icon { opacity: 1; }
    &-text { font-size: 13px; color: #6b7280; margin: 0; }
  }

  &__file-input { display: none; }

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

    &:hover { transform: translateY(-1px); box-shadow: 0 4px 14px rgba(150, 99, 241, 0.45); }
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
    animation: re-cline-spin 0.8s linear infinite;
  }

  @keyframes re-cline-spin { to { transform: rotate(360deg); } }

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
  .re-cline-character__placeholder {
    background: linear-gradient(135deg, #1a1035 0%, #2d1b69 50%, #1e1b4b 100%);
  }
  .re-cline-character__placeholder:hover {
    background: linear-gradient(135deg, #2d1b69 0%, #3b1f8e 50%, #252166 100%);
  }
  .re-cline-character__placeholder-text { color: rgba(255,255,255,0.5); }
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
