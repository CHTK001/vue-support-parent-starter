<script setup lang="ts">
/**
 * IFC（BIM 建筑模型）预览面板 —— 纯前端 3D
 *
 * <p><b>为什么是前端而不是后端 iframe</b>：后端现有的 3D 通道
 * （{@code ThreeModelPreviewProvider}）只认 glb/gltf/obj/stl/dxf，three.js
 * 自身也早已移除 IFC 加载器；纯前端方案不新增后端 provider、不改 SPI，
 * 由浏览器直接用 {@code web-ifc}（WASM）解析 IFC、{@code three} 渲染，
 * 与「在面板里自己渲染、不进 iframe」是同一路子（PDF 那条现已改由 pdf.js 的
 * {@code viewer.html} 承载，本面板是这一路子仅存的代表）。</p>
 *
 * <p><b>WASM 托管</b>：{@code web-ifc.wasm} 由 Vite 通过 {@code ?url} 打成
 * 同源静态资源，{@code IfcAPI.Init(locateFile)} 用自定义解析器指过去 ——
 * 既不依赖公网 CDN，也不占用 public 目录或后端 {@code /preview-vendor}。</p>
 *
 * <p><b>读取字节的两条通道</b>（都带令牌请求头，令牌不进 URL）：</p>
 * <ul>
 *   <li>顶层 .ifc：{@code objectUrl(bucket, key)} 直取对象原始字节；</li>
 *   <li>压缩包内 .ifc：{@code ?preview=true&inner=包内路径} —— 该条目没有
 *       SPI provider，后端按 {@code inner-raw} 回吐条目原始字节。</li>
 * </ul>
 *
 * @author Buffy
 * @since 2026/10/07
 */
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { Download, Refresh } from "@element-plus/icons-vue";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { IfcAPI } from "web-ifc";
// web-ifc 的 WASM 作为同源资源打包，Init 时用自定义 locateFile 指向它，避免公网 CDN
import wasmUrl from "web-ifc/web-ifc.wasm?url";
import { authHeaders, objectUrl, resolveObjectUrl } from "../api/filestorageApi";

const props = defineProps<{
  /** 存储桶名 */
  bucket: string;
  /** 对象 Key（传 inner 时是压缩包自身的 Key） */
  objectKey: string;
  /** 文件名（用于标题与报错文案） */
  fileName: string;
  /**
   * 压缩包内条目路径（{@code ?preview&inner=}）。
   *
   * <p>为空表示解析对象本身；非空表示解析压缩包内的该条目。</p>
   */
  inner?: string;
}>();

/* ==================== 常量 ==================== */

/**
 * 在线预览的体积上限。
 *
 * <p>IFC 解析与三角化都在浏览器主线程的 WASM 里做，超大模型会把标签页拖死。
 * 与其「转圈到天荒地老」，不如明确告知上限并引导下载。</p>
 */
const MAX_BYTES = 200 * 1024 * 1024;

/* ==================== 状态 ==================== */

/** 是否加载中 */
const loading = ref(true);
/** 加载阶段文案（读取文件 / 解析 IFC / 构建几何） */
const phase = ref("读取文件…");
/** 错误信息（空串表示无错） */
const errorMsg = ref("");
/** 解析进度（0~100） */
const progress = ref(0);
/** IFC schema 版本（如 IFC4 / IFC2X3） */
const schema = ref("");
/** 构件数（有几何的实体总数） */
const elementCount = ref(0);
/** 三角面总数 */
const triangleCount = ref(0);
/** 文件字节数 */
const byteSize = ref(0);
/** 画布容器 */
const canvasRef = ref<HTMLDivElement>();

/* ==================== 非响应式句柄 ==================== */
/* three / web-ifc 的对象不能放进 reactive，否则被 Proxy 包裹会破坏内部引用 */

/** web-ifc API */
let api: IfcAPI | null = null;
/** 打开模型的句柄（-1 表示未打开） */
let modelID = -1;
/** three 渲染器 */
let renderer: THREE.WebGLRenderer | null = null;
/** 场景 */
let scene: THREE.Scene | null = null;
/** 相机 */
let camera: THREE.PerspectiveCamera | null = null;
/** 轨道控制器 */
let controls: OrbitControls | null = null;
/** requestAnimationFrame 句柄 */
let raf = 0;
/** 容器尺寸监听 */
let resizeObserver: ResizeObserver | null = null;
/** 是否已卸载，避免异步回调在卸载后写状态或建场景 */
let disposed = false;

/** 字节数可读化 */
function formatSize(bytes: number): string {
  if (!bytes || bytes < 0) return "-";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

/** 千分位 */
function formatCount(n: number): string {
  return n.toLocaleString("zh-CN");
}

/** 读取主题背景色（跟随暗色模式） */
function themeColor(name: string, fallback: string): string {
  if (typeof window === "undefined") return fallback;
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

/**
 * 拉取 IFC 字节。
 *
 * @return 文件字节缓冲
 */
async function fetchBytes(): Promise<ArrayBuffer> {
  const base = objectUrl(props.bucket, props.objectKey);
  // 顶层：直取原始字节；包内：走 ?preview&inner= 的 inner-raw 通道
  const url = props.inner
    ? `${base}${base.includes("?") ? "&" : "?"}preview=true&inner=${encodeURIComponent(props.inner)}`
    : base;
  const res = await fetch(url, { headers: authHeaders() });
  if (!res.ok) {
    throw new Error(`读取文件失败：HTTP ${res.status}`);
  }
  return res.arrayBuffer();
}

/** 释放 three 场景中的几何与材质 */
function disposeScene(): void {
  if (!scene) return;
  scene.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (mesh.geometry) {
      mesh.geometry.dispose();
    }
    const material = mesh.material as THREE.Material | THREE.Material[] | undefined;
    if (Array.isArray(material)) {
      material.forEach((m) => m.dispose());
    } else {
      material?.dispose();
    }
  });
  scene = null;
}

/** 释放全部资源（可重复调用） */
function disposeAll(): void {
  if (raf) {
    cancelAnimationFrame(raf);
    raf = 0;
  }
  resizeObserver?.disconnect();
  resizeObserver = null;
  controls?.dispose();
  controls = null;
  disposeScene();
  if (renderer) {
    renderer.domElement.remove();
    renderer.dispose();
    renderer = null;
  }
  camera = null;
  if (api && modelID >= 0) {
    try {
      api.CloseModel(modelID);
    } catch {
      // 模型可能已随 Dispose 释放，忽略
    }
  }
  modelID = -1;
  if (api) {
    try {
      api.Dispose();
    } catch {
      // 忽略释放异常
    }
  }
  api = null;
}

/**
 * 建立 three 场景并把 IFC 几何灌进去。
 *
 * @param bytes IFC 原始字节
 */
function buildScene(bytes: Uint8Array): void {
  const container = canvasRef.value;
  if (!container) {
    throw new Error("预览容器尚未就绪");
  }
  if (!api) {
    throw new Error("IFC 解析器未初始化");
  }

  // 1) 打开模型
  phase.value = "解析 IFC…";
  modelID = api.OpenModel(bytes);
  if (modelID < 0) {
    throw new Error("无法解析该 IFC 文件（内容损坏或不是有效的 IFC）");
  }
  schema.value = api.GetModelSchema(modelID) || "";

  // 2) 场景与渲染器
  const bg = themeColor("--el-bg-color", "#ffffff");
  scene = new THREE.Scene();
  scene.background = new THREE.Color(bg);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(container.clientWidth || 800, container.clientHeight || 600);
  container.appendChild(renderer.domElement);

  camera = new THREE.PerspectiveCamera(45, (container.clientWidth || 800) / (container.clientHeight || 600), 0.01, 1e6);

  // 3) 灯光：半球光打底 + 主/补方向光，避免单面死黑
  scene.add(new THREE.HemisphereLight(0xffffff, 0x555566, 1.1));
  const key = new THREE.DirectionalLight(0xffffff, 1.6);
  key.position.set(3, 5, 4);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0x99bbff, 0.6);
  fill.position.set(-4, -2, -3);
  scene.add(fill);

  // 4) 遍历网格 → three 几何
  phase.value = "构建几何…";
  const group = new THREE.Group();
  let triangles = 0;
  let total = 0;
  const defaultMaterial = new THREE.MeshStandardMaterial({ color: 0x9fb3c8, roughness: 0.8, metalness: 0.05 });
  api.StreamAllMeshes(modelID, (mesh, index, count) => {
    total = count;
    const geoms = mesh.geometries;
    for (let i = 0; i < geoms.size(); i++) {
      const placed = geoms.get(i);
      const geomData = api!.GetGeometry(modelID, placed.geometryExpressID);
      try {
        const verts = api!.GetVertexArray(geomData.GetVertexData(), geomData.GetVertexDataSize());
        // 顶点数据每 6 个 float 一个顶点：xyz + 法线 xyz（必须拷贝，视图会随 WASM 堆失效）
        const vcount = Math.floor(verts.length / 6);
        if (vcount === 0) {
          continue;
        }
        const positions = new Float32Array(vcount * 3);
        const normals = new Float32Array(vcount * 3);
        for (let j = 0, k = 0; j < verts.length; j += 6, k += 3) {
          positions[k] = verts[j];
          positions[k + 1] = verts[j + 1];
          positions[k + 2] = verts[j + 2];
          normals[k] = verts[j + 3];
          normals[k + 1] = verts[j + 4];
          normals[k + 2] = verts[j + 5];
        }
        const rawIndices = api!.GetIndexArray(geomData.GetIndexData(), geomData.GetIndexDataSize());
        if (rawIndices.length < 3) {
          continue;
        }
        // 必须拷贝：GetIndexArray 返回的是 WASM 堆上的视图，堆会被后续调用覆盖
        const indices = new Uint32Array(rawIndices);

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute("normal", new THREE.BufferAttribute(normals, 3));
        geometry.setIndex(new THREE.BufferAttribute(indices, 1));
        // 应用构件自身的放置矩阵（列主序 16 元；个别几何可能缺省，缺省即不变换）
        if (placed.flatTransformation && placed.flatTransformation.length === 16) {
          geometry.applyMatrix4(new THREE.Matrix4().fromArray(placed.flatTransformation));
        }

        const c = placed.color;
        const hasColor = !!c && c.w > 0 && c.x + c.y + c.z > 0;
        const material = hasColor
          ? new THREE.MeshStandardMaterial({
              color: new THREE.Color(c.x, c.y, c.z),
              roughness: 0.8,
              metalness: 0.05,
              transparent: c.w < 1,
              opacity: c.w > 0 ? Math.min(1, c.w) : 1,
            })
          : defaultMaterial;
        group.add(new THREE.Mesh(geometry, material));
        triangles += indices.length / 3;
      } finally {
        geomData.delete();
      }
    }
    mesh.delete();
    // 进度：按已处理构件比例（顶到 99，最后一步再收口）
    progress.value = count > 0 ? Math.min(99, Math.round(((index + 1) / count) * 100)) : 0;
  });

  elementCount.value = total;
  triangleCount.value = Math.round(triangles);
  if (group.children.length === 0) {
    throw new Error("该 IFC 不含可渲染的几何（可能只有属性/空间信息，或为 IFC4x3 的不支持图元）");
  }

  // 5) 居中 + 相机取景
  const box = new THREE.Box3().setFromObject(group);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  group.position.sub(center);
  scene.add(group);

  const maxDim = Math.max(size.x, size.y, size.z) || 1;
  camera.near = maxDim / 1000;
  camera.far = maxDim * 200;
  camera.position.set(maxDim * 0.9, maxDim * 0.8, maxDim * 1.1);
  camera.updateProjectionMatrix();

  // 6) 网格地面（帮助判断比例），随模型尺寸缩放
  const grid = new THREE.GridHelper(maxDim * 2, 20, 0x888888, 0xbbbbbb);
  grid.position.y = box.min.y - center.y;
  (grid.material as THREE.Material).opacity = 0.35;
  (grid.material as THREE.Material).transparent = true;
  scene.add(grid);

  // 7) 控制器
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.1;
  controls.target.set(0, 0, 0);
  controls.update();

  // 8) 渲染循环 + 尺寸自适应
  const animate = (): void => {
    if (disposed || !renderer || !scene || !camera) return;
    raf = requestAnimationFrame(animate);
    controls?.update();
    renderer.render(scene, camera);
  };
  animate();

  resizeObserver = new ResizeObserver(() => {
    if (!renderer || !camera || !container || disposed) return;
    const w = container.clientWidth || 1;
    const h = container.clientHeight || 1;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  });
  resizeObserver.observe(container);

  progress.value = 100;
}

/** 主流程：读取 → 解析 → 渲染 */
async function load(): Promise<void> {
  disposeAll();
  disposed = false;
  loading.value = true;
  errorMsg.value = "";
  progress.value = 0;
  phase.value = "读取文件…";
  schema.value = "";
  elementCount.value = 0;
  triangleCount.value = 0;
  byteSize.value = 0;

  // 等一帧，保证容器在 DOM 里（弹层内挂载）
  await nextTick();
  try {
    const buf = await fetchBytes();
    if (disposed) return;
    byteSize.value = buf.byteLength;
    if (buf.byteLength > MAX_BYTES) {
      throw new Error(`文件过大（${formatSize(buf.byteLength)}），超过在线预览上限 ${formatSize(MAX_BYTES)}，请下载后用专业软件打开`);
    }
    phase.value = "初始化解析器…";
    // 让「解析中…」先画出来，再进同步的 WASM 解析（避免看起来像卡死）
    await new Promise((r) => setTimeout(r, 30));
    if (disposed) return;

    api = new IfcAPI();
    // 自定义 locateFile：把 web-ifc 的 wasm 请求指到 Vite 打包出来的同源资源；
    // forceSingleThread 避免多线程 wasm / worker 的额外依赖
    await api.Init((path) => (path.endsWith(".wasm") ? wasmUrl : path), true);
    if (disposed) return;

    buildScene(new Uint8Array(buf));
  } catch (e) {
    if (!disposed) {
      errorMsg.value = (e as Error)?.message ?? "IFC 预览失败";
      disposeAll();
    }
  } finally {
    if (!disposed) {
      loading.value = false;
    }
  }
}

/** 下载本体（包内条目下载压缩包本体，与 CAD 面板一致的口径） */
async function downloadSelf(): Promise<void> {
  const url = await resolveObjectUrl(props.bucket, props.objectKey, { params: { download: "true" } });
  window.open(url, "_blank");
}

onMounted(load);
// 同一面板复用：切换对象 / 切换包内条目时必须重新加载
watch(() => [props.bucket, props.objectKey, props.inner], load);
onBeforeUnmount(() => {
  disposed = true;
  disposeAll();
});
</script>

<template>
  <section class="ifc" aria-label="IFC 建筑模型预览">
    <!-- ===== 统计条 ===== -->
    <div class="ifc__stats">
      <div class="ifc__stat">
        <span class="ifc__stat-label">Schema</span>
        <b class="ifc__stat-value">{{ schema || "—" }}</b>
      </div>
      <div class="ifc__stat">
        <span class="ifc__stat-label">构件</span>
        <b class="ifc__stat-value">{{ loading ? "—" : formatCount(elementCount) }}</b>
      </div>
      <div class="ifc__stat">
        <span class="ifc__stat-label">三角面</span>
        <b class="ifc__stat-value">{{ loading ? "—" : formatCount(triangleCount) }}</b>
      </div>
      <div class="ifc__stat">
        <span class="ifc__stat-label">大小</span>
        <b class="ifc__stat-value ifc__stat-value--accent">{{ formatSize(byteSize) }}</b>
      </div>
    </div>

    <!-- ===== 操作条 ===== -->
    <div class="ifc__toolbar">
      <span class="ifc__hint">鼠标拖拽旋转 · 滚轮缩放 · 右键平移</span>
      <div class="ifc__spacer" />
      <el-button :icon="Refresh" :loading="loading" title="刷新" aria-label="刷新" @click="load" />
      <el-button :icon="Download" title="下载原文件" @click="downloadSelf">下载</el-button>
    </div>

    <!-- ===== 主体 ===== -->
    <div class="ifc__body">
      <!-- 画布容器始终存在，避免加载完成后容器 ref 拿不到 -->
      <div ref="canvasRef" class="ifc__canvas" :class="{ 'is-loading': loading || !!errorMsg }" />

      <div v-if="loading" class="ifc__overlay">
        <div class="ifc__spinner" />
        <div class="ifc__overlay-text">{{ phase }}</div>
        <el-progress v-if="progress > 0" class="ifc__progress" :percentage="progress" :show-text="false" />
      </div>

      <div v-else-if="errorMsg" class="ifc__overlay ifc__overlay--error">
        <div class="ifc__error-icon">IFC</div>
        <h4 class="ifc__error-title">无法预览该 IFC 文件</h4>
        <p class="ifc__error-text">{{ errorMsg }}</p>
        <div class="ifc__error-actions">
          <el-button type="primary" :icon="Refresh" @click="load">重试</el-button>
          <el-button :icon="Download" @click="downloadSelf">下载文件</el-button>
        </div>
      </div>
    </div>

    <!-- ===== 底部状态栏 ===== -->
    <footer class="ifc__footer">
      <span>{{ fileName }}</span>
      <span>纯前端 3D（web-ifc + three.js）</span>
    </footer>
  </section>
</template>

<style scoped>
/* ========================================================
   IFC 建筑模型预览面板（koi / Element Plus 变量体系）

   与 CadPreviewPanel 保持同一套结构与观感：
   颜色走 --el-* 令牌、面板不投影靠边框承载边界、
   圆角取令牌档位（控件 6 / 面板 8）。
   ======================================================== */
.ifc {
  display: flex;
  flex-direction: column;
  min-height: 0;
  height: 72vh;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-lg, 8px);
  background: var(--el-bg-color);
  color: var(--el-text-color-primary);
  overflow: hidden;
}

/* ---- 统计条 ---- */
.ifc__stats {
  display: flex;
  align-items: center;
  padding: 8px 16px;
  background: var(--el-fill-color-lighter);
  border-bottom: 1px solid var(--el-border-color-lighter);
  overflow-x: auto;
}

.ifc__stat {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 16px;
  white-space: nowrap;
}

.ifc__stat:first-child {
  padding-left: 0;
}

.ifc__stat + .ifc__stat {
  border-left: 1px solid var(--el-border-color-lighter);
}

.ifc__stat-label {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.ifc__stat-value {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  font-variant-numeric: tabular-nums;
}

.ifc__stat-value--accent {
  color: var(--el-color-primary);
}

/* ---- 工具条 ---- */
.ifc__toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
  flex-wrap: wrap;
}

.ifc__hint {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}

.ifc__spacer {
  flex: 1;
  min-width: 0;
}

/* ---- 主体 ---- */
.ifc__body {
  position: relative;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.ifc__canvas {
  width: 100%;
  height: 100%;
  background-color: var(--el-bg-color);
  touch-action: none;
}

.ifc__canvas.is-loading {
  visibility: hidden;
}

/* three 生成的 canvas 填满容器 */
.ifc__canvas :deep(canvas) {
  display: block;
  width: 100%;
  height: 100%;
}

/* ---- 覆盖层（加载 / 错误） ---- */
.ifc__overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 24px;
  text-align: center;
  background: var(--el-bg-color);
}

.ifc__overlay-text {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.ifc__progress {
  width: 220px;
}

.ifc__spinner {
  width: 34px;
  height: 34px;
  border: 3px solid var(--el-border-color-lighter);
  border-top-color: var(--el-color-primary);
  border-radius: 50%;
  animation: ifc-spin 0.9s linear infinite;
}

@keyframes ifc-spin {
  to {
    transform: rotate(360deg);
  }
}

.ifc__error-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  border-radius: var(--el-radius-lg, 8px);
  background: var(--el-fill-color-light);
  color: var(--el-text-color-placeholder);
  font-weight: 700;
  font-size: 13px;
}

.ifc__error-title {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.ifc__error-text {
  max-width: 460px;
  margin: 0;
  font-size: 13px;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
  word-break: break-word;
}

.ifc__error-actions {
  display: flex;
  gap: 8px;
  margin-top: 4px;
}

/* ---- 底部状态栏 ---- */
.ifc__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 16px;
  border-top: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

/* ---- 无障碍：尊重「减少动态效果」偏好 ---- */
@media (prefers-reduced-motion: reduce) {
  .ifc__spinner {
    animation: none;
  }
}
</style>
