<script setup lang="ts">
/**
 * 通用 3D 模型预览面板 —— 纯前端 3D（CAD / 三角网格）
 *
 * <p><b>为什么需要它</b>：文件管理在线预览此前对 3D 的覆盖是「有缺口」的 ——
 * glb/gltf/obj/stl 走后端 3D 通道，dxf/dwg 走 CAD 面板，ifc 走
 * {@code PreviewIfcPanel}，但 step/stp/iges/igs/brep/3dm/3ds/ply/dae/wrl/3mf/off
 * 这一批既没有后端 provider、three 也没有原生加载器，只能落到一张信息卡或
 * 「不支持预览」。本面板一次性补齐：浏览器内用 OCCT（{@code occt-import-js}）、
 * {@code rhino3dm} 与 three 自带加载器解析并渲染，不新增后端 provider、不改 SPI。</p>
 *
 * <p><b>不进 iframe 的理由</b>：与 CAD / IFC / GeoJSON 面板相同 —— iframe 渲染的是
 * 独立文档，读不到主应用的 koi 主题变量，暗色模式与品牌色全丢。这里自己建
 * WebGLRenderer、自己管轨道控制与释放。</p>
 *
 * <p><b>解析职责划分</b>：数据形态与 wasm 接线全在 {@code utils/model3d.ts}
 * （格式识别、引擎单例、几何装配、OFF 解析器），本组件只负责「取字节 → 建场景 →
 * 交互 → 释放」，与 {@code PreviewIfcPanel} 的文件结构保持一致。</p>
 *
 * <p><b>读取字节的两条通道</b>（都带令牌请求头，令牌不进 URL，与 IFC 面板同口径）：</p>
 * <ul>
 *   <li>顶层模型：{@code objectUrl(bucket, key)} 直取对象原始字节；</li>
 *   <li>压缩包内模型：{@code ?preview=true&inner=包内路径} —— 该条目没有 SPI
 *       provider，后端按 {@code inner-raw} 回吐条目原始字节。</li>
 * </ul>
 *
 * @author CH
 * @since 2026/10/08
 */
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { Aim, Download, Refresh } from "@element-plus/icons-vue";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { authHeaders, objectUrl, resolveObjectUrl } from "../api/filestorageApi";
import {
  detectModel3dFormat,
  FORMAT_ENGINE,
  FORMAT_LABEL,
  parseModel3d,
  type Model3dFormat,
} from "../utils/model3d";

const props = defineProps<{
  /** 存储桶名 */
  bucket: string;
  /** 对象 Key（传 inner 时是压缩包自身的 Key） */
  objectKey: string;
  /** 文件名（用于标题与报错文案；包内条目时为压缩包名） */
  fileName: string;
  /**
   * 压缩包内条目路径（{@code ?preview&inner=}）。
   *
   * <p>为空表示解析对象本身；非空表示解析压缩包内的该条目。</p>
   */
  inner?: string;
  /** 文件大小（字节），列表行传入；为 0 / 包内条目时统计条显示 - */
  size?: number;
}>();

/* ==================== 常量 ==================== */

/**
 * 在线预览的体积上限。
 *
 * <p>解析与三角化都在浏览器主线程的 WASM 里做，几何会同时存在于 wasm 堆与
 * three 侧（顶点/法线/索引各一份），超大模型能把标签页拖死。与其「转圈到
 * 天荒地老」，不如明确告知上限并引导下载。</p>
 */
const MAX_BYTES = 200 * 1024 * 1024;

/* ==================== 状态 ==================== */

/** 是否加载中 */
const loading = ref(true);
/** 加载阶段文案（读取文件 / 加载引擎 / 解析模型 / 构建几何） */
const phase = ref("读取文件…");
/** 错误信息（空串表示无错） */
const errorMsg = ref("");
/** wasm 引擎下载进度（0~100；解析期归零，由 spinner 承载） */
const progress = ref(0);
/** 网格（Mesh）数 */
const meshCount = ref(0);
/** 三角面总数 */
const triangleCount = ref(0);
/** 文件字节数（取回后回填，权威于 props.size） */
const byteSize = ref(0);
/** 是否线框显示 */
const wireframe = ref(false);
/** 画布容器 */
const canvasRef = ref<HTMLDivElement>();

/* ==================== 非响应式句柄 ==================== */
/* three 的对象不能放进 reactive，否则被 Proxy 包裹会破坏内部引用 */

/** three 渲染器 */
let renderer: THREE.WebGLRenderer | null = null;
/** 场景 */
let scene: THREE.Scene | null = null;
/** 相机 */
let camera: THREE.PerspectiveCamera | null = null;
/** 轨道控制器 */
let controls: OrbitControls | null = null;
/** 模型根节点（居中 / 适应视图 / 线框切换都基于它） */
let modelRoot: THREE.Object3D | null = null;
/** requestAnimationFrame 句柄 */
let raf = 0;
/** 容器尺寸监听 */
let resizeObserver: ResizeObserver | null = null;
/** 是否已卸载，避免异步回调在卸载后写状态或建场景 */
let disposed = false;

/* ==================== 派生 ==================== */

/** 生效文件名：包内条目取路径末段（fileName 此时是压缩包自己的名字） */
const effectiveName = computed(() => {
  const p = props.inner;
  if (!p) {
    return props.fileName;
  }
  const slash = p.lastIndexOf("/");
  return slash >= 0 ? p.slice(slash + 1) : p;
});

/** 识别出的格式（面板只应挂给受支持的文件；仍以 null 兜底） */
const format = computed<Model3dFormat | null>(() => detectModel3dFormat(effectiveName.value));

/** 统计条「格式」文案 */
const formatText = computed(() => (format.value ? FORMAT_LABEL[format.value] : "—"));

/** 解析引擎文案（页脚 / 统计提示） */
const engineText = computed(() => {
  const engine = format.value ? FORMAT_ENGINE[format.value].engine : "three";
  switch (engine) {
    case "occt":
      return "OCCT + three.js";
    case "rhino":
      return "rhino3dm + three.js";
    default:
      return "three.js 加载器";
  }
});

/**
 * 统计条「大小」：加载完成后取实际字节；未完成时包内条目显示 -。
 *
 * <p>包内条目拿不到条目体积（open-entry 只回传路径），props.size 是压缩包
 * 体积而非条目体积，宁可显示 - 也不标错数字（与 GeoJSON / 媒体面板同口径）。</p>
 */
const sizeText = computed(() => {
  if (byteSize.value > 0) {
    return formatSize(byteSize.value);
  }
  return props.inner ? "-" : formatSize(props.size);
});

/* ==================== 工具函数 ==================== */

/** 字节数可读化 */
function formatSize(bytes?: number): string {
  if (!bytes || bytes < 0) {
    return "-";
  }
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  if (bytes < 1024 * 1024 * 1024) {
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

/** 千分位 */
function formatCount(n: number): string {
  return n.toLocaleString("zh-CN");
}

/** 读取主题背景色（跟随暗色模式） */
function themeColor(name: string, fallback: string): string {
  if (typeof window === "undefined") {
    return fallback;
  }
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

/**
 * 拉取模型字节。
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
  if (!scene) {
    return;
  }
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
  modelRoot = null;
}

/* ==================== 场景 ==================== */

/**
 * 适应视图：把相机拉到能完整框住模型的距离，并复位轨道目标点。
 */
function fitView(): void {
  if (!modelRoot || !camera || !controls) {
    return;
  }
  const box = new THREE.Box3().setFromObject(modelRoot);
  if (box.isEmpty()) {
    return;
  }
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z) || 1;
  const dist = (maxDim / (2 * Math.tan((camera.fov * Math.PI) / 360))) * 1.5;
  camera.position.copy(center).addScaledVector(new THREE.Vector3(1, 0.8, 1).normalize(), dist);
  camera.near = Math.max(maxDim / 1000, 0.01);
  camera.far = maxDim * 100;
  camera.updateProjectionMatrix();
  controls.target.copy(center);
  controls.update();
}

/**
 * 建立 three 场景并装载已解析的模型。
 *
 * @param object     解析产物根节点
 * @param meshCountN 网格数
 * @param triCount   三角面数
 */
function buildScene(object: THREE.Object3D, meshCountN: number, triCount: number): void {
  const container = canvasRef.value;
  if (!container) {
    throw new Error("预览容器尚未就绪");
  }

  phase.value = "构建场景…";
  const bg = themeColor("--el-bg-color", "#ffffff");
  scene = new THREE.Scene();
  scene.background = new THREE.Color(bg);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(container.clientWidth || 800, container.clientHeight || 600);
  container.appendChild(renderer.domElement);

  camera = new THREE.PerspectiveCamera(
    45,
    (container.clientWidth || 800) / (container.clientHeight || 600),
    0.01,
    1e6,
  );

  // 灯光：半球光打底 + 主/补方向光，避免单面死黑（与 IFC 面板同一套）
  scene.add(new THREE.HemisphereLight(0xffffff, 0x555566, 1.1));
  const key = new THREE.DirectionalLight(0xffffff, 1.6);
  key.position.set(3, 5, 4);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0x99bbff, 0.6);
  fill.position.set(-4, -2, -3);
  scene.add(fill);

  // 居中：让模型中心落在原点，轨道旋转围绕几何中心而非原始建模坐标
  modelRoot = object;
  const box = new THREE.Box3().setFromObject(object);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  object.position.sub(center);
  scene.add(object);

  // 网格地面（帮助判断比例），随模型尺寸缩放
  const maxDim = Math.max(size.x, size.y, size.z) || 1;
  const grid = new THREE.GridHelper(maxDim * 2, 20, 0x888888, 0xbbbbbb);
  grid.position.y = box.min.y - center.y;
  (grid.material as THREE.Material).opacity = 0.35;
  (grid.material as THREE.Material).transparent = true;
  scene.add(grid);

  // 线框状态沿用当前开关（切换对象后重建时保持一致）
  applyWireframe(wireframe.value);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.1;
  fitView();

  meshCount.value = meshCountN;
  triangleCount.value = triCount;

  const animate = (): void => {
    if (disposed || !renderer || !scene || !camera) {
      return;
    }
    raf = requestAnimationFrame(animate);
    controls?.update();
    renderer.render(scene, camera);
  };
  animate();

  resizeObserver = new ResizeObserver(() => {
    if (!renderer || !camera || !container || disposed) {
      return;
    }
    const w = container.clientWidth || 1;
    const h = container.clientHeight || 1;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  });
  resizeObserver.observe(container);
}

/** 遍历模型把所有材质切到线框 / 实体 */
function applyWireframe(on: boolean): void {
  modelRoot?.traverse((obj) => {
    const material = (obj as THREE.Mesh).material as THREE.Material | THREE.Material[] | undefined;
    const apply = (m: THREE.Material): void => {
      if ("wireframe" in m) {
        (m as THREE.MeshStandardMaterial).wireframe = on;
      }
    };
    if (Array.isArray(material)) {
      material.forEach(apply);
    } else if (material) {
      apply(material);
    }
  });
}

/* ==================== 主流程 ==================== */

/** 主流程：读取 → 解析 → 渲染 */
async function load(): Promise<void> {
  disposeAll();
  disposed = false;
  loading.value = true;
  errorMsg.value = "";
  progress.value = 0;
  phase.value = "读取文件…";
  meshCount.value = 0;
  triangleCount.value = 0;
  byteSize.value = 0;

  // 等一帧，保证容器在 DOM 里（弹层内挂载）
  await nextTick();
  try {
    const fmt = format.value;
    if (!fmt) {
      throw new Error("该扩展名不在通用 3D 面板的支持范围内");
    }
    const buf = await fetchBytes();
    if (disposed) {
      return;
    }
    byteSize.value = buf.byteLength;
    if (buf.byteLength > MAX_BYTES) {
      throw new Error(
        `文件过大（${formatSize(buf.byteLength)}），超过在线预览上限 ${formatSize(MAX_BYTES)}，请下载后用专业软件打开`,
      );
    }
    const parsed = await parseModel3d(fmt, buf, {
      onPhase: (text) => {
        if (!disposed) {
          phase.value = text;
        }
      },
      onProgress: (ratio) => {
        if (!disposed) {
          progress.value = Math.round(ratio * 100);
        }
      },
    });
    if (disposed) {
      // 解析期间被卸载：产物已构建，需就地释放，避免几何常驻
      disposeObject3d(parsed.object);
      return;
    }
    progress.value = 0;
    buildScene(parsed.object, parsed.meshCount, parsed.triangleCount);
  } catch (e) {
    if (!disposed) {
      errorMsg.value = (e as Error)?.message ?? "3D 模型预览失败";
      disposeAll();
    }
  } finally {
    if (!disposed) {
      loading.value = false;
    }
  }
}

/** 释放一个未被挂进场景的 Object3D（解析完成但组件已卸载的兜底） */
function disposeObject3d(object: THREE.Object3D): void {
  object.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    mesh.geometry?.dispose();
    const material = mesh.material as THREE.Material | THREE.Material[] | undefined;
    if (Array.isArray(material)) {
      material.forEach((m) => m.dispose());
    } else {
      material?.dispose();
    }
  });
}

/** 下载本体（包内条目打开压缩包本体，与 CAD / IFC 面板一致的口径） */
async function downloadSelf(): Promise<void> {
  const url = await resolveObjectUrl(props.bucket, props.objectKey, { params: { download: "true" } });
  window.open(url, "_blank");
}

onMounted(load);
// 同一面板复用：切换对象 / 切换包内条目时必须重新加载
watch(() => [props.bucket, props.objectKey, props.inner], load);
// 线框开关即时生效（重建场景后由 buildScene 重新套用当前值）
watch(wireframe, (on) => applyWireframe(on));
onBeforeUnmount(() => {
  disposed = true;
  disposeAll();
});
</script>

<template>
  <section class="m3d" aria-label="3D 模型预览">
    <!-- ===== 统计条 ===== -->
    <div class="m3d__stats">
      <div class="m3d__stat">
        <span class="m3d__stat-label">格式</span>
        <b class="m3d__stat-value m3d__stat-value--accent">{{ formatText }}</b>
      </div>
      <div class="m3d__stat">
        <span class="m3d__stat-label">网格</span>
        <b class="m3d__stat-value">{{ loading ? "—" : formatCount(meshCount) }}</b>
      </div>
      <div class="m3d__stat">
        <span class="m3d__stat-label">三角面</span>
        <b class="m3d__stat-value">{{ loading ? "—" : formatCount(triangleCount) }}</b>
      </div>
      <div class="m3d__stat">
        <span class="m3d__stat-label">大小</span>
        <b class="m3d__stat-value">{{ sizeText }}</b>
      </div>
    </div>

    <!-- ===== 操作条 ===== -->
    <div class="m3d__toolbar">
      <span class="m3d__hint">鼠标拖拽旋转 · 滚轮缩放 · 右键平移</span>
      <div class="m3d__spacer" />
      <el-switch
        v-model="wireframe"
        :disabled="loading || !!errorMsg"
        inline-prompt
        active-text="线框"
        inactive-text="实体"
        title="切换线框 / 实体显示"
      />
      <el-button
        :icon="Aim"
        :disabled="loading || !!errorMsg"
        title="适应视图"
        aria-label="适应视图"
        @click="fitView"
      />
      <el-button :icon="Refresh" :loading="loading" title="刷新" aria-label="刷新" @click="load" />
      <el-button :icon="Download" title="下载原文件" @click="downloadSelf">下载</el-button>
    </div>

    <!-- ===== 主体 ===== -->
    <div class="m3d__body">
      <!-- 画布容器始终存在，避免加载完成后容器 ref 拿不到 -->
      <div ref="canvasRef" class="m3d__canvas" :class="{ 'is-loading': loading || !!errorMsg }" />

      <div v-if="loading" class="m3d__overlay">
        <div class="m3d__spinner" />
        <div class="m3d__overlay-text">{{ phase }}</div>
        <el-progress v-if="progress > 0" class="m3d__progress" :percentage="progress" :show-text="false" />
      </div>

      <div v-else-if="errorMsg" class="m3d__overlay m3d__overlay--error">
        <div class="m3d__error-icon">3D</div>
        <h4 class="m3d__error-title">无法预览该 3D 模型</h4>
        <p class="m3d__error-text">{{ errorMsg }}</p>
        <div class="m3d__error-actions">
          <el-button type="primary" :icon="Refresh" @click="load">重试</el-button>
          <el-button :icon="Download" @click="downloadSelf">下载文件</el-button>
        </div>
      </div>
    </div>

    <!-- ===== 底部状态栏 ===== -->
    <footer class="m3d__footer">
      <span :title="inner ? `${fileName} › ${effectiveName}` : effectiveName">
        {{ inner ? `${fileName} › ${effectiveName}` : effectiveName }}
      </span>
      <span>纯前端 3D（{{ engineText }}）</span>
    </footer>
  </section>
</template>

<style scoped>
/* ========================================================
   通用 3D 模型预览面板（koi / Element Plus 变量体系）

   与 PreviewIfcPanel / CadPreviewPanel 保持同一套结构与观感：
   颜色走 --el-* 令牌、面板不投影靠边框承载边界、
   圆角取令牌档位（控件 6 / 面板 8）。
   ======================================================== */
.m3d {
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
.m3d__stats {
  display: flex;
  align-items: center;
  padding: 8px 16px;
  background: var(--el-fill-color-lighter);
  border-bottom: 1px solid var(--el-border-color-lighter);
  overflow-x: auto;
}

.m3d__stat {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 16px;
  white-space: nowrap;
}

.m3d__stat:first-child {
  padding-left: 0;
}

.m3d__stat + .m3d__stat {
  border-left: 1px solid var(--el-border-color-lighter);
}

.m3d__stat-label {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.m3d__stat-value {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  font-variant-numeric: tabular-nums;
}

.m3d__stat-value--accent {
  color: var(--el-color-primary);
}

/* ---- 工具条 ---- */
.m3d__toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
  flex-wrap: wrap;
}

.m3d__hint {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}

.m3d__spacer {
  flex: 1;
  min-width: 0;
}

/* ---- 主体 ---- */
.m3d__body {
  position: relative;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.m3d__canvas {
  width: 100%;
  height: 100%;
  background-color: var(--el-bg-color);
  touch-action: none;
}

.m3d__canvas.is-loading {
  visibility: hidden;
}

/* three 生成的 canvas 填满容器 */
.m3d__canvas :deep(canvas) {
  display: block;
  width: 100%;
  height: 100%;
}

/* ---- 覆盖层（加载 / 错误） ---- */
.m3d__overlay {
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

.m3d__overlay-text {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.m3d__progress {
  width: 220px;
}

.m3d__spinner {
  width: 34px;
  height: 34px;
  border: 3px solid var(--el-border-color-lighter);
  border-top-color: var(--el-color-primary);
  border-radius: 50%;
  animation: m3d-spin 0.9s linear infinite;
}

@keyframes m3d-spin {
  to {
    transform: rotate(360deg);
  }
}

.m3d__error-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  border-radius: var(--el-radius-lg, 8px);
  background: var(--el-fill-color-light);
  color: var(--el-text-color-placeholder);
  font-weight: 700;
  font-size: 14px;
}

.m3d__error-title {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.m3d__error-text {
  max-width: 460px;
  margin: 0;
  font-size: 13px;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
  word-break: break-word;
}

.m3d__error-actions {
  display: flex;
  gap: 8px;
  margin-top: 4px;
}

/* ---- 底部状态栏 ---- */
.m3d__footer {
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

.m3d__footer span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ---- 无障碍：尊重「减少动态效果」偏好 ---- */
@media (prefers-reduced-motion: reduce) {
  .m3d__spinner {
    animation: none;
  }
}
</style>
