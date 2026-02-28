<script setup lang="ts">
import { ref, shallowRef, computed, watch, onMounted, onBeforeUnmount, nextTick } from "vue";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { PMREMGenerator } from "three";
// vue-3d-loader 默认导出为插件对象 { install, 0: component }，需取索引 0 获取组件
import vue3dLoaderPkg from "vue-3d-loader";
const vue3dLoader = (vue3dLoaderPkg as Record<number, unknown>)[0] as typeof vue3dLoaderPkg;

export interface Props {
  width?: string | number;
  height?: string | number;
  backgroundColor?: string | number;
  antialias?: boolean;
  alpha?: boolean;
  autoResize?: boolean;
  /**
   * 调试开关：输出模型材质/纹理概览信息，便于定位“粉色纹理”问题
   */
  debug?: boolean;
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
   * 渲染引擎选择：
   * - auto: 默认策略（有 modelUrls 用 vue-3d-loader；否则用原生 three.js）
   * - vue3d: 强制使用 vue-3d-loader
   * - threejs: 强制使用原生 three.js
   */
  renderEngine?: "auto" | "vue3d" | "threejs";
  /**
   * 模型地址列表，支持多种格式
   * 支持的格式：.glb, .gltf, .obj, .fbx, .stl
   */
  modelUrls?: string[];
  /**
   * 模型加载配置
   */
  modelConfig?: {
    /**
     * 模型位置偏移 [x, y, z]
     */
    position?: [number, number, number];
    /**
     * 模型缩放 [x, y, z] 或统一缩放值
     */
    scale?: [number, number, number] | number;
    /**
     * 模型旋转 [x, y, z] (弧度)
     */
    rotation?: [number, number, number];
  };
}

const props = withDefaults(defineProps<Props>(), {
  width: 800,
  height: 600,
  backgroundColor: 0x000000,
  antialias: true,
  alpha: false,
  autoResize: true,
  debug: false,
  cameraType: "perspective",
  cameraFov: 75,
  cameraNear: 0.1,
  cameraFar: 1000,
  cameraPosition: () => [0, 0, 5] as [number, number, number],
  cameraLookAt: () => [0, 0, 0] as [number, number, number],
  preset: "none",
  renderEngine: "auto",
  modelUrls: () => [],
  modelConfig: () => ({
    position: [0, 0, 0] as [number, number, number],
    scale: 1 as [number, number, number] | number,
    rotation: [0, 0, 0] as [number, number, number]
  })
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
const sceneRef = shallowRef<THREE.Scene>();
const cameraRef = shallowRef<THREE.Camera>();
const rendererRef = shallowRef<THREE.WebGLRenderer>();
const animationFrameId = ref<number>();
// 保存已加载的模型列表，用于清理
const loadedModelsRef = ref<THREE.Object3D[]>([]);
// vue-3d-loader 组件引用
const vue3dLoaderRef = ref<InstanceType<typeof vue3dLoader>>();
// three.js 渲染画布（仅在非模型模式下使用）
const canvasRef = ref<HTMLCanvasElement>();
// ready 事件只触发一次（不同模式下触发时机不同）
const readyEmittedRef = ref(false);
// 标记当前 scene/renderer 的归属，用于卸载时选择正确的清理策略
const sceneOwnerRef = ref<"internal" | "vue3d">();

const resolvedEngine = computed<"vue3d" | "threejs">(() => {
  const hasModels = !!(props.modelUrls && props.modelUrls.length > 0);
  if (props.renderEngine === "threejs") {
    return "threejs";
  }
  if (props.renderEngine === "vue3d") {
    return hasModels ? "vue3d" : "threejs";
  }
  // auto
  return hasModels ? "vue3d" : "threejs";
});

const isVue3dMode = computed(() => resolvedEngine.value === "vue3d");
const isThreejsMode = computed(() => resolvedEngine.value === "threejs");

const warnedMissingUrlsInVue3dRef = ref(false);
watch(
  () => [props.renderEngine, props.modelUrls?.length],
  () => {
    if (props.renderEngine !== "vue3d") {
      warnedMissingUrlsInVue3dRef.value = false;
      return;
    }
    const hasModels = !!(props.modelUrls && props.modelUrls.length > 0);
    if (hasModels || warnedMissingUrlsInVue3dRef.value) {
      return;
    }
    warnedMissingUrlsInVue3dRef.value = true;
    // eslint-disable-next-line no-console
    console.warn("[ScThree][engine] renderEngine=vue3d 但 modelUrls 为空，已自动降级为 threejs 渲染预设场景");
  }
);

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

// 计算 vue-3d-loader 的 height（需要数字类型）
const vue3dHeight = computed(() => {
  if (typeof props.height === "number") {
    return props.height;
  }
  // 如果是字符串，尝试提取数字部分
  if (typeof props.height === "string") {
    const match = props.height.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : 600;
  }
  return 600;
});

// 计算 vue-3d-loader 的 filePath（支持单个或数组）
const vue3dFilePath = computed(() => {
  if (!props.modelUrls || props.modelUrls.length === 0) {
    return "";
  }
  if (props.modelUrls.length === 1) {
    return props.modelUrls[0];
  }
  return props.modelUrls;
});

// 计算 vue-3d-loader 的 scale
const vue3dScale = computed(() => {
  if (!props.modelConfig) {
    return { x: 1, y: 1, z: 1 };
  }
  const scale = props.modelConfig.scale;
  if (scale === undefined) {
    return { x: 1, y: 1, z: 1 };
  }
  if (Array.isArray(scale)) {
    return { x: scale[0], y: scale[1], z: scale[2] };
  }
  return { x: scale, y: scale, z: scale };
});

// 计算 vue-3d-loader 的 cameraPosition
const vue3dCameraPosition = computed(() => {
  return {
    x: props.cameraPosition[0],
    y: props.cameraPosition[1],
    z: props.cameraPosition[2]
  };
});

// 计算 vue-3d-loader 的 backgroundColor
const vue3dBackgroundColor = computed(() => {
  // vue-3d-loader 的 backgroundColor 接受数字类型
  if (typeof props.backgroundColor === "number") {
    return props.backgroundColor;
  }
  // 如果是字符串，尝试转换为数字
  if (typeof props.backgroundColor === "string") {
    // 移除 # 前缀并转换为数字
    const hex = props.backgroundColor.replace("#", "");
    return parseInt(hex, 16);
  }
  return 0x000000;
});

// 增强光照配置，避免 PBR 材质因光照不足显示异常（如粉色）
const vue3dLights = [
  { type: "AmbientLight", color: 0xffffff, intensity: 0.8 },
  { type: "DirectionalLight", position: { x: 5, y: 10, z: 7.5 }, color: 0xffffff, intensity: 1 }
];

/**
 * 清理材质和纹理资源
 * @param material Three.js 材质对象
 */
function disposeMaterial(material: THREE.Material): void {
  if (!material) {
    return;
  }

  // 清理纹理
  const textureProps = ["map", "normalMap", "roughnessMap", "metalnessMap", "aoMap", "emissiveMap", "bumpMap", "displacementMap", "alphaMap", "envMap"];
  textureProps.forEach(prop => {
    const texture = (material as any)[prop] as THREE.Texture;
    if (texture && texture instanceof THREE.Texture) {
      texture.dispose();
    }
  });

  // 清理材质
  material.dispose();
}

/**
 * 清理已加载的模型
 * @param scene Three.js 场景对象
 */
function clearModels(scene: THREE.Scene): void {
  loadedModelsRef.value.forEach(model => {
    // 清理模型资源
    model.traverse(object => {
      if (object instanceof THREE.Mesh) {
        // 清理几何体
        if (object.geometry) {
          object.geometry.dispose();
        }
        
        // 清理材质和纹理
        if (Array.isArray(object.material)) {
          object.material.forEach(material => disposeMaterial(material));
        } else if (object.material) {
          disposeMaterial(object.material);
        }
      }
    });
    
    // 从场景中移除
    scene.remove(model);
  });
  
  // 清空引用
  loadedModelsRef.value = [];
  
  // eslint-disable-next-line no-console
  console.log("[ScThree][cleanup] 已清理所有模型资源");
}

/**
 * 确保场景有光源（PBR 材质需要光源才能正确显示）
 * @param scene Three.js 场景对象
 */
function ensureSceneLighting(scene: THREE.Scene): void {
  // 检查场景中是否已有光源
  let hasLight = false;
  scene.traverse(object => {
    if (object instanceof THREE.Light) {
      hasLight = true;
    }
  });

  // 如果没有光源，添加默认光源
  if (!hasLight) {
    // 添加环境光（提供基础照明）
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    // 添加方向光（提供主照明和阴影）
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 5);
    scene.add(directionalLight);

    // eslint-disable-next-line no-console
    console.log("[ScThree][lighting] 自动添加默认光源");
  }
}

/**
 * 从 URL 推断模型后缀（忽略 query/hash）
 * @param url 模型地址
 * @returns 小写后缀（不含点），未知返回空字符串
 */
function getModelExt(url: string): string {
  if (!url) {
    return "";
  }
  const cleanUrl = url.split("#")[0].split("?")[0];
  const lastDot = cleanUrl.lastIndexOf(".");
  if (lastDot < 0 || lastDot === cleanUrl.length - 1) {
    return "";
  }
  return cleanUrl.slice(lastDot + 1).toLowerCase();
}

/**
 * 对模型应用 modelConfig（位置/缩放/旋转）
 * @param model 模型根对象
 */
function applyModelConfigToModel(model: THREE.Object3D): void {
  if (!props.modelConfig) {
    return;
  }
  const { position, scale, rotation } = props.modelConfig;
  if (position) {
    model.position.set(...position);
  }
  if (scale !== undefined) {
    if (Array.isArray(scale)) {
      model.scale.set(...scale);
    } else {
      model.scale.setScalar(scale);
    }
  }
  if (rotation) {
    model.rotation.set(...rotation);
  }
}

/**
 * three.js 模式：加载单个模型
 * @param url 模型地址
 * @returns 模型根对象
 */
async function loadInternalModel(url: string): Promise<THREE.Object3D> {
  const ext = getModelExt(url);
  if (ext === "glb" || ext === "gltf") {
    const mod = await import("three/examples/jsm/loaders/GLTFLoader.js");
    const loader = new mod.GLTFLoader();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (loader as any).setCrossOrigin?.("anonymous");
    const gltf = await new Promise<any>((resolve, reject) => {
      loader.load(url, resolve, undefined, reject);
    });
    return (gltf?.scene as THREE.Object3D) || new THREE.Group();
  }

  if (ext === "obj") {
    const mod = await import("three/examples/jsm/loaders/OBJLoader.js");
    const loader = new mod.OBJLoader();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (loader as any).setCrossOrigin?.("anonymous");
    return await new Promise<THREE.Object3D>((resolve, reject) => {
      loader.load(url, resolve, undefined, reject);
    });
  }

  if (ext === "fbx") {
    const mod = await import("three/examples/jsm/loaders/FBXLoader.js");
    const loader = new mod.FBXLoader();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (loader as any).setCrossOrigin?.("anonymous");
    return await new Promise<THREE.Object3D>((resolve, reject) => {
      loader.load(url, resolve, undefined, reject);
    });
  }

  if (ext === "stl") {
    const mod = await import("three/examples/jsm/loaders/STLLoader.js");
    const loader = new mod.STLLoader();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (loader as any).setCrossOrigin?.("anonymous");
    const geometry = await new Promise<THREE.BufferGeometry>((resolve, reject) => {
      loader.load(url, resolve, undefined, reject);
    });
    const material = new THREE.MeshStandardMaterial({ color: 0xcfcfcf, roughness: 0.9, metalness: 0.0 });
    const mesh = new THREE.Mesh(geometry, material);
    const group = new THREE.Group();
    group.add(mesh);
    return group;
  }

  throw new Error(`不支持的模型格式: ${ext || "(unknown)"}`);
}

const internalModelLoadSeqRef = ref(0);

/**
 * three.js 模式：重新加载 modelUrls
 */
async function reloadInternalModels(): Promise<void> {
  if (!isThreejsMode.value || sceneOwnerRef.value !== "internal" || !sceneRef.value) {
    return;
  }

  const seq = ++internalModelLoadSeqRef.value;
  const scene = sceneRef.value;

  clearModels(scene);
  loadedModelsRef.value = [];

  const urls = props.modelUrls || [];
  if (urls.length === 0) {
    return;
  }

  const models: THREE.Object3D[] = [];
  for (const url of urls) {
    try {
      const model = await loadInternalModel(url);
      if (seq !== internalModelLoadSeqRef.value) {
        return;
      }
      model.name = model.name || url;
      applyModelConfigToModel(model);
      scene.add(model);
      models.push(model);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn("[ScThree][model] threejs 模式模型加载失败", { url, error: e });
    }
  }

  loadedModelsRef.value = models;
  if (models.length > 0) {
    emits("modelLoaded", models);
  }
  logTextureOverview(models);
  // eslint-disable-next-line no-console
  console.log("[ScThree][model] threejs 模式模型加载完成", models.length);
}

/**
 * 更新 three.js 模式下的渲染尺寸与相机投影
 * @param width 容器宽度
 * @param height 容器高度
 */
function updateInternalSize(width: number, height: number): void {
  if (!rendererRef.value || !cameraRef.value) {
    return;
  }

  rendererRef.value.setSize(width, height);
  const camera = cameraRef.value;

  if (camera instanceof THREE.PerspectiveCamera) {
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    return;
  }

  if (camera instanceof THREE.OrthographicCamera) {
    const aspect = width / height;
    const size = 5;
    camera.left = -size * aspect;
    camera.right = size * aspect;
    camera.top = size;
    camera.bottom = -size;
    camera.updateProjectionMatrix();
  }
}

/**
 * 启动 three.js 模式下的渲染循环
 */
function startInternalRenderLoop(): void {
  if (!rendererRef.value || !sceneRef.value || !cameraRef.value) {
    return;
  }

  const loop = (): void => {
    animationFrameId.value = requestAnimationFrame(loop);
    if (rendererRef.value && sceneRef.value && cameraRef.value) {
      rendererRef.value.render(sceneRef.value, cameraRef.value);
    }
  };
  loop();
}

/**
 * 停止 three.js 模式下的渲染循环
 */
function stopInternalRenderLoop(): void {
  if (animationFrameId.value) {
    cancelAnimationFrame(animationFrameId.value);
    animationFrameId.value = undefined;
  }
}

/**
 * 初始化 three.js 模式（仅在无 modelUrls 时启用）
 */
function initInternalThree(): void {
  if (!containerRef.value || !canvasRef.value) {
    return;
  }

  const width = containerRef.value.clientWidth;
  const height = containerRef.value.clientHeight;

  const scene = new THREE.Scene();
  scene.background = props.alpha ? null : new THREE.Color(props.backgroundColor);
  sceneRef.value = scene;
  sceneOwnerRef.value = "internal";

  const aspect = width / height;
  let camera: THREE.Camera;
  if (props.cameraType === "orthographic") {
    const size = 5;
    camera = new THREE.OrthographicCamera(-size * aspect, size * aspect, size, -size, props.cameraNear, props.cameraFar);
  } else {
    camera = new THREE.PerspectiveCamera(props.cameraFov, aspect, props.cameraNear, props.cameraFar);
  }
  camera.position.set(...props.cameraPosition);
  camera.lookAt(...props.cameraLookAt);
  cameraRef.value = camera;

  setupPresetScene(scene, camera);
  ensureSceneLighting(scene);

  const renderer = new THREE.WebGLRenderer({
    canvas: canvasRef.value,
    antialias: props.antialias,
    alpha: props.alpha
  });
  renderer.setSize(width, height);
  renderer.setPixelRatio(window.devicePixelRatio);
  rendererRef.value = renderer;
  applyEnvironmentMap({ scene, renderer });

  if (!readyEmittedRef.value) {
    emits("ready", scene, camera, renderer);
    readyEmittedRef.value = true;
  }

  startInternalRenderLoop();
  void reloadInternalModels();
}

/**
 * 清理 three.js 模式资源
 */
function disposeInternalThree(): void {
  stopInternalRenderLoop();

  if (sceneRef.value) {
    clearModels(sceneRef.value);
    sceneRef.value.traverse(object => {
      if (object instanceof THREE.Mesh) {
        object.geometry.dispose();
        if (Array.isArray(object.material)) {
          object.material.forEach(material => material.dispose());
        } else {
          object.material.dispose();
        }
      }
    });
  }

  if (rendererRef.value) {
    rendererRef.value.dispose();
  }

  sceneRef.value = undefined;
  cameraRef.value = undefined;
  rendererRef.value = undefined;
  sceneOwnerRef.value = undefined;
  readyEmittedRef.value = false;
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
      opacity: 0.9
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

/**
 * vue-3d-loader 上下文信息
 */
type Vue3dContext = {
  scene?: THREE.Scene;
  renderer?: THREE.WebGLRenderer;
  camera?: THREE.Camera;
};

/**
 * 尝试从 vue-3d-loader 的事件/实例中解析 scene/renderer/camera
 * @param vue3dInstance vue-3d-loader 组件实例
 * @param event load 事件参数
 * @returns 上下文对象
 */
function resolveVue3dContext(vue3dInstance: unknown, event: unknown): Vue3dContext {
  const eventAny = event as any;
  const instanceAny = vue3dInstance as any;

  const sceneCandidate =
    eventAny?.scene ||
    instanceAny?.scene ||
    instanceAny?.$refs?.scene ||
    instanceAny?.three?.scene ||
    instanceAny?.$refs?.three?.scene;
  const rendererCandidate =
    eventAny?.renderer ||
    instanceAny?.renderer ||
    instanceAny?.$refs?.renderer ||
    instanceAny?.three?.renderer ||
    instanceAny?.$refs?.three?.renderer;
  const cameraCandidate =
    eventAny?.camera ||
    instanceAny?.camera ||
    instanceAny?.$refs?.camera ||
    instanceAny?.three?.camera ||
    instanceAny?.$refs?.three?.camera;

  return {
    scene: sceneCandidate instanceof THREE.Scene ? sceneCandidate : undefined,
    renderer: rendererCandidate instanceof THREE.WebGLRenderer ? rendererCandidate : undefined,
    camera: cameraCandidate instanceof THREE.Camera ? cameraCandidate : undefined
  };
}

/**
 * 为 vue-3d-loader 场景设置环境贴图，改善 PBR 材质的显示效果
 * @param context vue-3d-loader 解析出的上下文
 */
function applyEnvironmentMap(context: Vue3dContext): void {
  const scene = context.scene;
  const renderer = context.renderer;
  if (!scene || !renderer) {
    return;
  }
  try {
    const pmremGenerator = new PMREMGenerator(renderer);
    const envScene = new RoomEnvironment();
    const envMap = pmremGenerator.fromScene(envScene).texture;
    scene.environment = envMap;
    envScene.dispose();
    pmremGenerator.dispose();
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn("[ScThree][model] 设置环境贴图失败", e);
  }
}

/**
 * 输出模型材质/纹理概览，用于定位“粉色纹理”问题
 * @param models 模型列表
 */
function logTextureOverview(models: THREE.Object3D[]): void {
  if (!props.debug) {
    return;
  }

  let meshCount = 0;
  let materialCount = 0;
  let withMapCount = 0;
  let missingMapCount = 0;
  let magentaColorCount = 0;
  let mapImageMissingCount = 0;

  const suspicious: Array<{ meshName: string; materialType: string; hasMap: boolean; colorHex?: string; mapSrc?: string }> = [];

  models.forEach(model => {
    model.traverse(node => {
      if (!(node instanceof THREE.Mesh) || !node.material) {
        return;
      }
      meshCount++;
      const materials = Array.isArray(node.material) ? node.material : [node.material];
      materials.forEach(mat => {
        if (!(mat instanceof THREE.Material)) {
          return;
        }
        materialCount++;

        const anyMat = mat as any;
        const map = anyMat.map as THREE.Texture | undefined;
        const hasMap = !!map;
        if (hasMap) {
          withMapCount++;
          const image: any = (map as any).image;
          const mapSrc = typeof image?.src === "string" ? image.src : undefined;
          if (!image || (typeof image?.width === "number" && typeof image?.height === "number" && image.width === 0 && image.height === 0)) {
            mapImageMissingCount++;
            suspicious.push({ meshName: node.name || "(unnamed)", materialType: mat.type, hasMap, mapSrc });
          }
        } else {
          missingMapCount++;
        }

        if ((anyMat.color instanceof THREE.Color) && anyMat.color.getHex && anyMat.color.getHex() === 0xff00ff) {
          magentaColorCount++;
          suspicious.push({ meshName: node.name || "(unnamed)", materialType: mat.type, hasMap, colorHex: "#ff00ff" });
        }
      });
    });
  });

  // eslint-disable-next-line no-console
  console.log("[ScThree][texture] 概览", {
    meshCount,
    materialCount,
    withMapCount,
    missingMapCount,
    magentaColorCount,
    mapImageMissingCount
  });

  if (suspicious.length > 0) {
    // eslint-disable-next-line no-console
    console.log("[ScThree][texture] 可疑材质(前20条)", suspicious.slice(0, 20));
  }

  if (missingMapCount > 0 || mapImageMissingCount > 0) {
    // eslint-disable-next-line no-console
    console.warn("[ScThree][texture] 检测到贴图缺失/未加载，若模型出现粉色，通常是纹理路径或 CORS 导致的占位纹理");
  }
}

// 处理 vue-3d-loader 的 load 事件
async function handleVue3dLoad(event: any): Promise<void> {
  await nextTick();
  
  // vue-3d-loader 加载完成后，尝试从组件实例获取模型
  const vue3dInstance = vue3dLoaderRef.value;
  if (!vue3dInstance) {
    return;
  }

  const context = resolveVue3dContext(vue3dInstance, event);
  applyEnvironmentMap(context);
  // 将实际渲染的 three 对象暴露给外部（ready / expose）
  if (context.scene) {
    sceneRef.value = context.scene;
    sceneOwnerRef.value = "vue3d";
  }
  if (context.camera) {
    cameraRef.value = context.camera;
  }
  if (context.renderer) {
    rendererRef.value = context.renderer;
  }
  if (!readyEmittedRef.value && context.scene && context.camera && context.renderer) {
    emits("ready", context.scene, context.camera, context.renderer);
    readyEmittedRef.value = true;
  }

  // 尝试从 vue-3d-loader 获取场景和模型
  // vue-3d-loader 可能通过内部属性暴露场景
  // 由于 vue-3d-loader 的 API 可能不直接暴露模型，我们通过事件参数获取
  const models: THREE.Object3D[] = [];
  
  // 如果事件包含模型信息，使用它
  if (event && event.models) {
    models.push(...(Array.isArray(event.models) ? event.models : [event.models]));
  }
  
  // 尝试从 vue3dLoaderRef 获取场景和模型
  // vue-3d-loader 可能通过 $refs.scene 或类似方式暴露
  try {
    const vue3dScene = context.scene || (vue3dInstance as any).scene || (vue3dInstance as any).$refs?.scene;
    if (vue3dScene && vue3dScene instanceof THREE.Scene) {
      // 从 vue-3d-loader 的场景中提取模型
      vue3dScene.traverse(object => {
        if (object instanceof THREE.Group || object instanceof THREE.Mesh) {
          // 检查是否是根模型对象
          if (object.parent === vue3dScene || object.parent === null) {
            models.push(object);
          }
        }
      });
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn("[ScThree][model] 无法从 vue-3d-loader 获取模型", e);
  }
  
  // 模型去重，避免重复统计/处理
  const uniqueModels = Array.from(new Set(models));

  // 应用模型配置
  if (props.modelConfig && uniqueModels.length > 0) {
    uniqueModels.forEach(model => {
      if (props.modelConfig?.position) {
        model.position.set(...props.modelConfig.position);
      }
      if (props.modelConfig?.scale !== undefined) {
        if (Array.isArray(props.modelConfig.scale)) {
          model.scale.set(...props.modelConfig.scale);
        } else {
          model.scale.setScalar(props.modelConfig.scale);
        }
      }
      if (props.modelConfig?.rotation) {
        model.rotation.set(...props.modelConfig.rotation);
      }
    });
  }
  
  // 保存已加载的模型
  loadedModelsRef.value = uniqueModels;
  
  // 触发 modelLoaded 事件
  if (uniqueModels.length > 0) {
    emits("modelLoaded", uniqueModels);
  }

  // 调试：输出纹理/材质概览
  logTextureOverview(uniqueModels);
  
  // eslint-disable-next-line no-console
  console.log("[ScThree][model] vue-3d-loader 模型加载完成", uniqueModels.length);
}

// 处理 vue-3d-loader 的错误事件
function handleVue3dError(error: any): void {
  // eslint-disable-next-line no-console
  console.warn("[ScThree][model] vue-3d-loader 模型加载失败", error);
}

// 处理窗口大小变化
function handleResize(): void {
  if (!containerRef.value) {
    return;
  }

  const width = containerRef.value.clientWidth;
  const height = containerRef.value.clientHeight;

  emits("resize", width, height);

  // three.js 模式下同步更新渲染尺寸（vue-3d-loader 自己处理）
  if (isThreejsMode.value && sceneOwnerRef.value === "internal") {
    updateInternalSize(width, height);
  }
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

// 监听模型配置变化
watch(
  () => props.modelConfig,
  () => {
    // vue-3d-loader 会自动处理配置变化；threejs 模式下手动应用到已加载模型
    if (isThreejsMode.value && loadedModelsRef.value.length > 0) {
      loadedModelsRef.value.forEach(model => applyModelConfigToModel(model));
    }
  },
  { deep: true }
);

const modelUrlsKey = computed(() => (props.modelUrls || []).join("|"));
watch(
  () => [resolvedEngine.value, modelUrlsKey.value],
  () => {
    if (isThreejsMode.value && sceneOwnerRef.value === "internal") {
      void reloadInternalModels();
    }
  }
);

watch(
  () => resolvedEngine.value,
  () => {
    // 切换引擎时，确保内部资源不会残留
    if (resolvedEngine.value === "vue3d" && sceneOwnerRef.value === "internal") {
      disposeInternalThree();
    }
    if (resolvedEngine.value === "threejs") {
      nextTick(() => {
        initInternalThree();
      });
    }
  }
);

onMounted(() => {
  // 模型模式：由 vue-3d-loader 自行创建并渲染 three 对象，ready 在 @load 时触发
  if (isVue3dMode.value) {
    return;
  }

  // 非模型模式：初始化内部 three.js（预设场景）
  nextTick(() => {
    initInternalThree();
  });

  if (props.autoResize) {
    window.addEventListener("resize", handleResize);
  }
});

onBeforeUnmount(() => {
  stopInternalRenderLoop();

  if (props.autoResize) {
    window.removeEventListener("resize", handleResize);
  }

  // 清理资源：仅清理内部 three.js 创建的对象，避免和 vue-3d-loader 的卸载清理冲突
  if (sceneOwnerRef.value === "internal") {
    disposeInternalThree();
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
  resize: handleResize
});
</script>

<template>
  <div ref="containerRef" class="sc-three" :style="{ width: containerWidth, height: containerHeight }">
    <!-- 使用 vue-3d-loader 加载模型 -->
    <vue3dLoader
      v-if="isVue3dMode"
      ref="vue3dLoaderRef"
      :filePath="vue3dFilePath"
      :scale="vue3dScale"
      :lights="vue3dLights"
      :cameraPosition="vue3dCameraPosition"
      :backgroundColor="vue3dBackgroundColor"
      :height="vue3dHeight"
      :showFps="false"
      cross-origin="anonymous"
      @load="handleVue3dLoad"
      @error="handleVue3dError"
    />
    <!-- 预设场景的渲染器（当没有模型时显示） -->
    <canvas
      v-else
      ref="canvasRef"
      :style="{ width: '100%', height: '100%', display: 'block' }"
    />
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