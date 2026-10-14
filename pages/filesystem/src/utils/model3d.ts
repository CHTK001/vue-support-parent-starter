/**
 * 3D 模型（CAD / 通用三角网格）浏览器内解析层
 *
 * <p>文件管理在线预览的 3D 通用面板（{@code PreviewModel3dPanel.vue}）的引擎接线层，
 * 一次性补齐「后端没有 provider、three.js 也没有原生加载器」的 CAD / 3D 格式：</p>
 * <ul>
 *   <li><b>B-Rep 精确边界建模格式</b>（step/stp/iges/igs/brep）：OCCT
 *       （{@code occt-import-js}，OpenCascade 的 Emscripten 构建）解析 + 三角化；</li>
 *   <li><b>Rhinoceros 3dm</b>：{@code rhino3dm}（OpenNURBS 的 Emscripten 构建）；</li>
 *   <li><b>three.js 自带加载器的杂项格式</b>（3ds/ply/dae/wrl/3mf）：
 *       从 {@code three/addons/loaders/...} 按扩展名动态 import，只打包用到的那个；</li>
 *   <li><b>OFF</b>：纯文本格式极简单，three 0.185 已移除 OFFLoader，
 *       这里内置一个百余行的行式解析器，不值得为它引第三方依赖。</li>
 * </ul>
 *
 * <p><b>WASM 托管</b>（照 {@code xls2xlsx} 的既有模式）：js + wasm 从 node_modules
 * 拷贝到 {@code src/wasm/occt-import/}、{@code src/wasm/rhino3dm/}，随源码进仓库 ——
 * 不依赖公网 CDN，不占 public 目录，也不占用后端 {@code /preview-vendor}。两个包都是
 * 经典 UMD 脚本（顶层 {@code var}，无 ESM 导出）：直接 {@code import} 会被 Vite
 * 当 ESM 处理拿不到导出，{@code ?url} 又有被 dev server 二次模块化的风险，所以用
 * {@code ?raw} 取原文、包成 Blob URL 注入经典 {@code <script>}（详见
 * {@code ensureEngineScript}），顶层 {@code var} 落到 {@code window} 上成为全局工厂
 * 函数。wasm 仍用 {@code ?url} 打成同源静态资源，先以带进度的 {@code fetch} 下回
 * 来再作为 {@code Module.wasmBinary} 传入（两个包都支持），既得到真实下载进度，
 * 又彻底接管了 wasm 的网络请求。</p>
 *
 * <p><b>不收录</b> glb/gltf/obj/stl/dxf/dwg：glb/gltf/obj/stl 已有后端
 * 3D 通道（ThreeModelPreviewProvider），dxf/dwg 走 CAD 面板，抢分支只会
 * 让同一文件在不同入口表现不一致。</p>
 *
 * @author CH
 * @since 2026/10/08
 */
import * as THREE from "three";
// WASM 资产（js+wasm）随源码托管：wasm 走 ?url 由 Vite 打成同源静态资源；
// 两个 UMD 脚本走 ?raw 取原文再以 Blob 注入经典 <script>（见 ensureEngineScript）
import occtScriptSource from "../wasm/occt-import/occt-import-js.js?raw";
import occtWasmUrl from "../wasm/occt-import/occt-import-js.wasm?url";
import rhinoScriptSource from "../wasm/rhino3dm/rhino3dm.js?raw";
import rhinoWasmUrl from "../wasm/rhino3dm/rhino3dm.wasm?url";

/* ==================== 格式识别 ==================== */

/** 面板支持的 3D 格式（内部归并 igs=iges、stp=step 等别名） */
export type Model3dFormat =
  | "step"
  | "iges"
  | "brep"
  | "3dm"
  | "3ds"
  | "ply"
  | "dae"
  | "wrl"
  | "3mf"
  | "off"
  | "fbx"
  | "vtk";

/** 扩展名 → 内部格式（键全小写；不含 glb/gltf/obj/stl/dxf/dwg —— 它们有既有通道） */
const EXT_TO_FORMAT: Record<string, Model3dFormat> = {
  step: "step",
  stp: "step",
  iges: "iges",
  igs: "iges",
  brep: "brep",
  "3dm": "3dm",
  "3ds": "3ds",
  ply: "ply",
  dae: "dae",
  wrl: "wrl",
  "3mf": "3mf",
  off: "off",
  fbx: "fbx",
  vtk: "vtk",
};

/**
 * 文件名（或压缩包内条目路径末段）→ 面板支持的 3D 格式。
 *
 * @param name 文件名
 * @return 格式；不在支持清单内返回 null（调用方应落到其他预览通道）
 */
export function detectModel3dFormat(name: string): Model3dFormat | null {
  const dot = name.lastIndexOf(".");
  if (dot < 0) {
    return null;
  }
  return EXT_TO_FORMAT[name.slice(dot + 1).toLowerCase()] ?? null;
}

/** 每种格式的展示名（统计条「格式」列与加载提示用） */
export const FORMAT_LABEL: Record<Model3dFormat, string> = {
  step: "STEP",
  iges: "IGES",
  brep: "BREP",
  "3dm": "3DM",
  "3ds": "3DS",
  ply: "PLY",
  dae: "DAE",
  wrl: "VRML",
  "3mf": "3MF",
  off: "OFF",
  fbx: "FBX",
  vtk: "VTK",
};

/** 解析引擎分类（wasm 引擎有下载体积，给「正在加载 3D 引擎」提示用） */
export type Model3dEngine = "occt" | "rhino" | "three";

/** 各格式所用的解析引擎与引擎 wasm 的近似体积（MB，用于下载提示） */
export const FORMAT_ENGINE: Record<Model3dFormat, { engine: Model3dEngine; engineMb?: number }> = {
  step: { engine: "occt", engineMb: 7.6 },
  iges: { engine: "occt", engineMb: 7.6 },
  brep: { engine: "occt", engineMb: 7.6 },
  "3dm": { engine: "rhino", engineMb: 2.7 },
  "3ds": { engine: "three" },
  ply: { engine: "three" },
  dae: { engine: "three" },
  wrl: { engine: "three" },
  "3mf": { engine: "three" },
  off: { engine: "three" },
  fbx: { engine: "three" },
  vtk: { engine: "three" },
};

/* ==================== 解析结果契约 ==================== */

/** 解析产物：可直接 add 进场景的 Object3D + 统计口径 */
export interface ParsedModel {
  /** 装配好的模型根节点（网格、材质、B-Rep 边线都已就位） */
  object: THREE.Object3D;
  /** 网格（Mesh）数 */
  meshCount: number;
  /** 三角面总数 */
  triangleCount: number;
}

/** 解析过程的进度回调（用于面板覆盖层文案与进度条） */
export interface ParseCallbacks {
  /** 阶段文案（如「正在加载 3D 引擎（约 7.6 MB）…」） */
  onPhase?: (text: string) => void;
  /** 0~1 进度（wasm 引擎下载期间有真实字节进度，解析期为不定量） */
  onProgress?: (ratio: number) => void;
}

/* ==================== occt-import-js 接线 ==================== */

/** occt-import-js 返回的网格（结构按官方 README 与 three.js 兼容约定） */
interface OcctMesh {
  name?: string;
  color?: number[];
  brep_faces?: { first: number; last: number; color: number[] | null }[];
  attributes?: {
    position?: { array: number[] | Float32Array };
    normal?: { array?: number[] | Float32Array };
  };
  index?: { array: number[] | Uint32Array };
}

/** ReadStepFile / ReadIgesFile / ReadBrepFile 的返回结构 */
interface OcctResult {
  success?: boolean;
  meshes?: OcctMesh[];
  root?: unknown;
}

/** 初始化后的 occt-import-js API（三個 ReadXxxFile） */
interface OcctApi {
  ReadStepFile(content: Uint8Array, params: unknown): OcctResult;
  ReadIgesFile(content: Uint8Array, params: unknown): OcctResult;
  ReadBrepFile(content: Uint8Array, params: unknown): OcctResult;
}

/** Emscripten MODULARIZE 工厂（occt-import-js） */
type OcctFactory = (moduleArg?: {
  wasmBinary?: ArrayBuffer;
  locateFile?: (path: string, scriptDirectory: string) => string;
}) => Promise<OcctApi>;

/* ==================== rhino3dm 接线 ==================== */

/** rhino3dm.Mesh 的 three 免拷接口（8.35+ 提供，结构见官方 d.ts） */
interface RhinoThreeBuffers {
  position: Float32Array;
  normal?: Float32Array;
  index?: Uint32Array;
  vertexCount?: number;
  color?: Float32Array;
}

/** rhino3dm.Mesh（鸭子类型：只声明本模块用到的成员） */
interface RhinoMesh {
  toThreejsBuffers?: (rotateToYUp: boolean) => RhinoThreeBuffers;
  vertices?: () => { count: number; get(index: number): number[] };
  faces?: () => { count: number; get(index: number): number[] };
  normals?: () => { count: number; get(index: number): number[] };
}

/** rhino3dm.File3dmObject */
interface RhinoObject {
  geometry(): unknown;
  attributes?(): { visible?: boolean; name?: string };
}

/** rhino3dm.File3dmObjectTable（可迭代契约） */
interface RhinoObjectTable {
  count: number;
  get(index: number): RhinoObject;
}

/** rhino3dm.File3dm（只声明对象表访问） */
interface RhinoFile {
  objects(): RhinoObjectTable;
}

/** 初始化后的 rhino3dm API 模块 */
interface RhinoApi {
  File3dm: { fromByteArray(buffer: Uint8Array): RhinoFile | null };
}

/** Emscripten MODULARIZE 工厂（rhino3dm） */
type RhinoFactory = (moduleArg?: {
  wasmBinary?: ArrayBuffer;
  locateFile?: (path: string, scriptDirectory: string) => string;
}) => Promise<RhinoApi>;

// UMD 脚本经 <script> 注入后，工厂函数落在 window 上（见文件头说明）
declare global {
  interface Window {
    occtimportjs?: OcctFactory;
    rhino3dm?: RhinoFactory;
  }
}

/* ==================== 引擎加载基础设施 ==================== */

/** 已注入的 UMD 脚本（按引擎名缓存，避免弹层反复开关重复注入） */
const scriptCache = new Map<string, Promise<void>>();

/**
 * 以经典脚本形式注入 UMD 引擎代码并等待其执行完成。
 *
 * <p>occt-import-js / rhino3dm 的发布 js 是经典 UMD（顶层 {@code var xx}
 * 暴露全局工厂、无 ESM 导出），有三条路都走不通：</p>
 * <ul>
 *   <li>直接 {@code import()}：Vite 把它当 ESM 模块处理，顶层 var 困在模块
 *       作用域里，拿不到任何导出；</li>
 *   <li>{@code ?url} + {@code <script src>}：Vite dev server 会把 /src 下
 *       的 .js 请求当模块做二次转换（可能注入 {@code import.meta} 相关代码），
 *       经典脚本里 {@code import.meta} 是语法错误，存在白屏风险；</li>
 *   <li>eval / new Function：被常见 CSP 禁止。</li>
 * </ul>
 *
 * <p>所以用 {@code ?raw} 取文件原文，包成 Blob URL 再注入经典
 * {@code <script>}：内容一比一保证是发布原文，浏览器直接从 blob 执行，
 * 完全绕开 dev server 的模块化转换，dev 与 build 行为一致。</p>
 *
 * @param key     引擎名（缓存键）
 * @param source  脚本原文（?raw 导入）
 */
function ensureEngineScript(key: string, source: string): Promise<void> {
  const cached = scriptCache.get(key);
  if (cached) {
    return cached;
  }
  const task = new Promise<void>((resolve, reject) => {
    const blobUrl = URL.createObjectURL(new Blob([source], { type: "text/javascript" }));
    const el = document.createElement("script");
    el.src = blobUrl;
    el.async = true;
    // 脚本开始执行后 blob 即可回收（onload 在执行完成后触发）
    const revoke = (): void => URL.revokeObjectURL(blobUrl);
    el.onload = () => {
      revoke();
      resolve();
    };
    el.onerror = () => {
      revoke();
      el.remove();
      reject(new Error("3D 引擎脚本加载失败（网络异常或资源被拦截）"));
    };
    document.head.appendChild(el);
  });
  scriptCache.set(key, task);
  // 失败要清缓存：一次网络抖动不能让面板永久失效
  task.catch(() => scriptCache.delete(key));
  return task;
}

/**
 * 带真实字节进度的 wasm 下载（Vite {@code ?url} 的同源产物）。
 *
 * @param url         wasm 地址
 * @param onProgress  进度回调（0~0.99，实例化收口到 1）
 * @return wasm 二进制
 */
async function fetchWasm(url: string, onProgress?: (ratio: number) => void): Promise<ArrayBuffer> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`3D 引擎下载失败（HTTP ${res.status}）`);
  }
  const total = Number(res.headers.get("content-length")) || 0;
  if (!res.body) {
    return res.arrayBuffer();
  }
  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let loaded = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    if (value) {
      chunks.push(value);
      loaded += value.byteLength;
      // dev 下 content-length 可能是压缩长度，进度会超界，钳到 0.99 收口留给实例化
      if (onProgress && total > 0) {
        onProgress(Math.min(0.99, loaded / total));
      }
    }
  }
  const out = new Uint8Array(loaded);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return out.buffer;
}

/** occt 实例（模块级缓存：两个 wasm 引擎各初始化一次，跨弹层复用） */
let occtReady: Promise<OcctApi> | null = null;

/**
 * 确认 occt-import-js 就绪（脚本注入 → 带进度下载 wasm → 实例化）。
 *
 * @param callbacks 进度回调
 * @return occt API
 */
function ensureOcct(callbacks: ParseCallbacks): Promise<OcctApi> {
  if (occtReady) {
    return occtReady;
  }
  const task = (async () => {
    callbacks.onPhase?.("正在加载 3D 引擎（OCCT，约 7.6 MB）…");
    await ensureEngineScript("occt", occtScriptSource);
    const factory = window.occtimportjs;
    if (typeof factory !== "function") {
      throw new Error("3D 引擎脚本未按预期暴露全局入口");
    }
    const wasmBinary = await fetchWasm(occtWasmUrl, (r) => callbacks.onProgress?.(r));
    callbacks.onProgress?.(1);
    // wasmBinary 直接喂给 Emscripten：不再由引擎自发 wasm 网络请求，
    // locateFile 只作兜底（万一某构建不认 wasmBinary）
    return await factory({
      wasmBinary,
      locateFile: (path: string) => (path.endsWith(".wasm") ? occtWasmUrl : path),
    });
  })();
  occtReady = task;
  task.catch(() => {
    occtReady = null;
  });
  return task;
}

/** rhino3dm 实例（模块级缓存，语义同上） */
let rhinoReady: Promise<RhinoApi> | null = null;

/**
 * 确认 rhino3dm 就绪。
 *
 * @param callbacks 进度回调
 * @return rhino3dm API
 */
function ensureRhino(callbacks: ParseCallbacks): Promise<RhinoApi> {
  if (rhinoReady) {
    return rhinoReady;
  }
  const task = (async () => {
    callbacks.onPhase?.("正在加载 3D 引擎（rhino3dm，约 2.7 MB）…");
    await ensureEngineScript("rhino", rhinoScriptSource);
    const factory = window.rhino3dm;
    if (typeof factory !== "function") {
      throw new Error("3D 引擎脚本未按预期暴露全局入口");
    }
    const wasmBinary = await fetchWasm(rhinoWasmUrl, (r) => callbacks.onProgress?.(r));
    callbacks.onProgress?.(1);
    return await factory({
      wasmBinary,
      locateFile: (path: string) => (path.endsWith(".wasm") ? rhinoWasmUrl : path),
    });
  })();
  rhinoReady = task;
  task.catch(() => {
    rhinoReady = null;
  });
  return task;
}

/* ==================== 几何构建 ==================== */

/** 边线（B-Rep 特征边）渲染的预算上限：超过则不生成，避免大模型卡死主线程 */
const MAX_EDGE_TRIANGLES = 400_000;

/** 边线颜色（低饱和深蓝灰：明暗两套主题下都不抢主体网格的视线） */
const EDGE_COLOR = 0x3b4a63;

/** 默认网格材质色（OCCT/Rhino 结果无颜色信息时） */
const DEFAULT_MESH_COLOR = 0x9fb3c8;

/**
 * 数组（JSON 数组或 TypedArray）安全转 Float32Array。
 *
 * @param raw occt 返回的顶点/法线数组
 * @return 同内容的 Float32Array；入参不合法返回 null
 */
function toF32(raw: number[] | Float32Array | undefined | null): Float32Array | null {
  if (!raw || raw.length === 0) {
    return null;
  }
  return raw instanceof Float32Array ? raw : new Float32Array(raw);
}

/**
 * 数组安全转 Uint32Array（索引）。
 *
 * @param raw occt 返回的索引数组
 * @return 同内容的 Uint32Array；入参不合法返回 null
 */
function toU32(raw: number[] | Uint32Array | undefined | null): Uint32Array | null {
  if (!raw || raw.length === 0) {
    return null;
  }
  return raw instanceof Uint32Array ? raw : new Uint32Array(raw);
}

/**
 * occt 解析结果 → three 场景装配。
 *
 * <p>每个 occt mesh 生成一个 BufferGeometry（attributes.position/normal + index
 * 均为普通数组，须拷入 TypedArray）；层级（result.root）只影响命名不影响坐标
 * （occt 输出的顶点已经是装配后的世界坐标），压平成一个 Group。带 color 的
 * mesh 用独立材质，B-Rep 面色优先级高于整体色。另按三角预算对每个网格生成
 * {@code EdgesGeometry} 特征边（20° 阈值，只保留面与面的折角边，不是全量
 * 线框），叠成 LineSegments 让 STEP/IGES 的建模轮廓肉眼可辨。</p>
 *
 * @param result occt ReadXxxFile 的返回
 * @param formatLabel 展示名（报错文案用）
 * @return 解析产物
 */
function buildFromOcct(result: OcctResult, formatLabel: string): ParsedModel {
  if (!result || result.success === false) {
    throw new Error(`无法解析该 ${formatLabel} 文件（内容损坏或不是有效的 ${formatLabel}）`);
  }
  const meshes = Array.isArray(result.meshes) ? result.meshes : [];
  if (meshes.length === 0) {
    throw new Error(`该 ${formatLabel} 不含可渲染的几何（可能只有结构或属性数据）`);
  }
  const group = new THREE.Group();
  const edges = new THREE.Group();
  edges.name = "__brep_edges__";
  const defaultMaterial = new THREE.MeshStandardMaterial({
    color: DEFAULT_MESH_COLOR,
    roughness: 0.75,
    metalness: 0.1,
    side: THREE.DoubleSide,
  });
  const edgeMaterial = new THREE.LineBasicMaterial({ color: EDGE_COLOR });
  let meshCount = 0;
  let triangles = 0;
  let budget = MAX_EDGE_TRIANGLES;
  for (const m of meshes) {
    const positions = toF32(m?.attributes?.position?.array);
    const indices = toU32(m?.index?.array);
    if (!positions || !indices || indices.length < 3) {
      continue;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const normals = toF32(m?.attributes?.normal?.array);
    if (normals && normals.length === positions.length) {
      geometry.setAttribute("normal", new THREE.BufferAttribute(normals, 3));
    } else {
      // 个别 occt 版本对纯平面网格省略法线，渲染需要就现算
      geometry.computeVertexNormals();
    }
    geometry.setIndex(new THREE.BufferAttribute(indices, 1));
    const color = m?.color;
    const material =
      color && color.length >= 3
        ? new THREE.MeshStandardMaterial({
            color: new THREE.Color(color[0], color[1], color[2]),
            roughness: 0.75,
            metalness: 0.1,
            side: THREE.DoubleSide,
          })
        : defaultMaterial;
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = typeof m?.name === "string" && m.name ? m.name : `mesh_${meshCount}`;
    group.add(mesh);
    meshCount += 1;
    triangles += indices.length / 3;
    // B-Rep 特征边：预算内才生成（EdgesGeometry 是 CPU 密集操作）
    if (budget - indices.length / 3 >= 0) {
      budget -= indices.length / 3;
      try {
        const edgeGeometry = new THREE.EdgesGeometry(geometry, 20);
        const edgePosition = edgeGeometry.getAttribute("position");
        if (edgePosition && edgePosition.count > 0) {
          edges.add(new THREE.LineSegments(edgeGeometry, edgeMaterial));
        } else {
          edgeGeometry.dispose();
        }
      } catch {
        // 个别退化几何（重复点/零面积）会让边提取抛错，跳过即可不影响主体
      }
    }
  }
  if (meshCount === 0) {
    defaultMaterial.dispose();
    edgeMaterial.dispose();
    throw new Error(`该 ${formatLabel} 不含可渲染的几何（网格顶点/索引为空）`);
  }
  if (edges.children.length > 0) {
    group.add(edges);
  } else {
    edgeMaterial.dispose();
  }
  return { object: group, meshCount, triangleCount: Math.round(triangles) };
}

/**
 * rhino3dm.Mesh → BufferGeometry。
 *
 * <p>优先走 {@code toThreejsBuffers(true)}（8.35+ 的零拷批量通道，且顺带做了
 * Rhino Z-up → three Y-up 的旋转）；构建不带该接口（理论上不会）或返回不完整时
 * 退回逐顶点 / 逐面手工装配（面可能是四边形，按扇形三角化）。</p>
 *
 * @param mesh rhino 网格对象
 * @return three 几何；网格无顶点时返回 null
 */
function rhinoMeshToGeometry(mesh: RhinoMesh): THREE.BufferGeometry | null {
  if (typeof mesh.toThreejsBuffers === "function") {
    const buffers = mesh.toThreejsBuffers(true);
    const positions = buffers?.position;
    if (positions instanceof Float32Array && positions.length >= 9) {
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      const normals = buffers.normal;
      if (normals instanceof Float32Array && normals.length === positions.length) {
        geometry.setAttribute("normal", new THREE.BufferAttribute(normals, 3));
      } else {
        geometry.computeVertexNormals();
      }
      const indices = buffers.index;
      if (indices instanceof Uint32Array && indices.length >= 3) {
        geometry.setIndex(new THREE.BufferAttribute(indices, 1));
      }
      const colors = buffers.color;
      if (colors instanceof Float32Array && colors.length === positions.length) {
        geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
      }
      if (!geometry.index) {
        return null;
      }
      return geometry;
    }
  }
  // ---- 手工兜底：逐顶点 / 逐面（四边形扇形三角化） ----
  const vlist = mesh.vertices?.();
  const flist = mesh.faces?.();
  const vcount = vlist?.count ?? 0;
  const fcount = flist?.count ?? 0;
  if (!vlist || !flist || vcount < 3 || fcount < 1) {
    return null;
  }
  const positions = new Float32Array(vcount * 3);
  for (let i = 0; i < vcount; i++) {
    const v = vlist.get(i);
    if (!v || v.length < 3) {
      return null;
    }
    // Rhino Z-up → three Y-up
    positions[i * 3] = v[0];
    positions[i * 3 + 1] = v[2];
    positions[i * 3 + 2] = -v[1];
  }
  const indices: number[] = [];
  for (let i = 0; i < fcount; i++) {
    const face = flist.get(i);
    if (!face || face.length < 4) {
      continue;
    }
    const k = face[0];
    if (k < 3 || k > 4 || face.length < k + 1) {
      continue;
    }
    const a = face[1];
    const b = face[2];
    const c = face[3];
    indices.push(a, b, c);
    if (k === 4) {
      indices.push(a, c, face[4]);
    }
  }
  if (indices.length < 3) {
    return null;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  // 逐点取法线太慢（embind 单点往返），直接由三角形算
  geometry.computeVertexNormals();
  return geometry;
}

/**
 * 3dm 字节 → three 场景装配。
 *
 * <p>遍历 ObjectTable，只认 Mesh 几何（Brep/Extrusion/曲线等没有现成三角化
 * 输出，跳过并在文案中如实说明）。带顶点色的网格启用 vertexColors。</p>
 *
 * @param bytes 3dm 原始字节
 * @param callbacks 进度回调
 * @return 解析产物
 */
async function parseRhino(bytes: ArrayBuffer, callbacks: ParseCallbacks): Promise<ParsedModel> {
  const rhino = await ensureRhino(callbacks);
  callbacks.onPhase?.("解析 3DM…");
  const doc = rhino.File3dm.fromByteArray(new Uint8Array(bytes));
  if (!doc) {
    throw new Error("无法解析该 3DM 文件（内容损坏或不是有效的 Rhino 3dm）");
  }
  const table = doc.objects();
  const group = new THREE.Group();
  let meshCount = 0;
  let triangles = 0;
  for (let i = 0; i < table.count; i++) {
    const obj = table.get(i);
    const geometryBase = obj?.geometry?.() as RhinoMesh | null;
    // ObjectTable 也含灯光/点/线等，鸭子类型过滤出 Mesh
    if (!geometryBase || typeof (geometryBase as RhinoMesh).vertices !== "function") {
      continue;
    }
    const geometry = rhinoMeshToGeometry(geometryBase);
    if (!geometry) {
      continue;
    }
    const hasVertexColor = !!geometry.attributes.color;
    const material = new THREE.MeshStandardMaterial({
      color: DEFAULT_MESH_COLOR,
      roughness: 0.75,
      metalness: 0.1,
      side: THREE.DoubleSide,
      vertexColors: hasVertexColor,
    });
    group.add(new THREE.Mesh(geometry, material));
    meshCount += 1;
    triangles += geometry.index ? geometry.index.count / 3 : 0;
  }
  if (meshCount === 0) {
    throw new Error("该 3DM 不含可渲染的网格（曲线 / B-Rep 对象暂不三角化，请下载后用 Rhino 查看）");
  }
  return { object: group, meshCount, triangleCount: Math.round(triangles) };
}

/* ==================== three.js 加载器杂项格式 ==================== */

/**
 * 按格式动态 import 对应的 three 加载器并 parse。
 *
 * <p>各 loader.parse 的入参形态（以安装版本 @types/three 0.185.4 的 d.ts 为准）：</p>
 * <ul>
 *   <li>TDSLoader.parse(arraybuffer: ArrayBuffer, path: string) → Group</li>
 *   <li>PLYLoader.parse(data: ArrayBuffer | string) → BufferGeometry</li>
 *   <li>ColladaLoader.parse(text: string, path: string) → Collada（取 .scene）</li>
 *   <li>VRMLLoader.parse(data: string, path: string) → Scene</li>
 *   <li>ThreeMFLoader.parse(data: ArrayBuffer) → Group</li>
 * </ul>
 *
 * @param format 格式
 * @param bytes 原始字节
 * @param callbacks 进度回调
 * @return 解析产物
 */
/**
 * 把 ArrayBuffer 补齐到至少 min 字节（不足部分补 0x0A 换行）。
 *
 * <p>绕三方加载器的「硬取前 N 字节做嗅探」写法：three 的 VTKLoader 用
 * {@code new Uint8Array(data, 0, 250)} 取头部，短于 250 字节的文件会直接抛
 * {@code RangeError}。补换行对按行解析（ASCII VTK）与按计数解析（二进制 VTK）
 * 都不引入语义变化。</p>
 *
 * @param bytes 原始字节
 * @param min   最小长度
 * @return 原缓冲（已够长）或补齐后的新缓冲
 */
function padToAtLeast(bytes: ArrayBuffer, min: number): ArrayBuffer {
  if (bytes.byteLength >= min) {
    return bytes;
  }
  const out = new Uint8Array(min);
  out.set(new Uint8Array(bytes), 0);
  out.fill(0x0a, bytes.byteLength);
  return out.buffer;
}

async function parseWithThreeLoader(
  format: Model3dFormat,
  bytes: ArrayBuffer,
  callbacks: ParseCallbacks,
): Promise<ParsedModel> {
  callbacks.onPhase?.("解析模型…");
  // 文本格式的固定解码口径（dae/wrl 是 XML/VRML 文本；off 单独走内置解析器）
  const decoder = new TextDecoder("utf-8");
  switch (format) {
    case "3ds": {
      const { TDSLoader } = await import("three/addons/loaders/TDSLoader.js");
      const object = new TDSLoader().parse(bytes, "");
      return countObject(object);
    }
    case "ply": {
      const { PLYLoader } = await import("three/addons/loaders/PLYLoader.js");
      // 二进制 PLY 走 ArrayBuffer；ASCII PLY 该 loader 也接受字符串，先按二进制喂
      const geometry = new PLYLoader().parse(bytes);
      geometry.computeVertexNormals();
      const material = new THREE.MeshStandardMaterial({
        color: DEFAULT_MESH_COLOR,
        roughness: 0.75,
        metalness: 0.1,
        vertexColors: !!geometry.attributes.color,
      });
      const mesh = new THREE.Mesh(geometry, material);
      const group = new THREE.Group();
      group.add(mesh);
      return countObject(group);
    }
    case "dae": {
      const { ColladaLoader } = await import("three/addons/loaders/ColladaLoader.js");
      const collada = new ColladaLoader().parse(decoder.decode(bytes), "");
      if (!collada || !collada.scene) {
        throw new Error("无法解析该 DAE 文件（内容损坏或不是有效的 Collada）");
      }
      return countObject(collada.scene);
    }
    case "wrl": {
      const { VRMLLoader } = await import("three/addons/loaders/VRMLLoader.js");
      const scene = new VRMLLoader().parse(decoder.decode(bytes), "");
      return countObject(scene);
    }
    case "3mf": {
      const { ThreeMFLoader } = await import("three/addons/loaders/3MFLoader.js");
      const object = new ThreeMFLoader().parse(bytes);
      return countObject(object);
    }
    case "fbx": {
      const { FBXLoader } = await import("three/addons/loaders/FBXLoader.js");
      // FBX 有二进制与 ASCII 两种：二进制以 "Kaydara FBX Binary" 开头，喂
      // ArrayBuffer；ASCII 喂字符串。喂错不会报错但会得到空场景，故按魔数分流。
      const head = decoder.decode(new Uint8Array(bytes.slice(0, 20)));
      const object = head.startsWith("Kaydara FBX Binary")
        ? new FBXLoader().parse(bytes, "")
        : new FBXLoader().parse(decoder.decode(bytes), "");
      return countObject(object);
    }
    case "vtk": {
      const { VTKLoader } = await import("three/addons/loaders/VTKLoader.js");
      // three 的 VTKLoader.parse 内部用 `new Uint8Array(data, 0, 250)` 硬取
      // 前 250 字节做「ASCII 还是二进制」嗅探（源码注释：取前 5 行找 binary
      // 关键字）。**文件短于 250 字节时该行直接抛
      // RangeError: Invalid typed array length: 250** —— 实测样本 sample.vtk
      // 只有 238 字节，正好踩中，这就是此前 vtk 失败的根因。
      // 修法：不足 250 字节先补齐（补 0x0A 换行；ASCII 解析器按行读、
      // 二进制解析器按计数读，尾部补白都无副作用）。
      const padded = padToAtLeast(bytes, 250);
      const geometry = new VTKLoader().parse(padded);
      geometry.computeVertexNormals();
      const material = new THREE.MeshStandardMaterial({
        color: DEFAULT_MESH_COLOR,
        roughness: 0.75,
        metalness: 0.1,
        vertexColors: !!geometry.attributes.color,
      });
      const mesh = new THREE.Mesh(geometry, material);
      const group = new THREE.Group();
      group.add(mesh);
      return countObject(group);
    }
    default:
      throw new Error(`暂不支持该格式：${FORMAT_LABEL[format]}`);
  }
}

/**
 * 统计 Object3D 内的网格与三角面（three 加载器产物的统计口径与 occt 一致）。
 *
 * @param object 加载器产物根节点
 * @return 解析产物
 */
function countObject(object: THREE.Object3D): ParsedModel {
  let meshCount = 0;
  let triangles = 0;
  object.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (mesh.isMesh && mesh.geometry) {
      meshCount += 1;
      const index = mesh.geometry.getIndex();
      if (index) {
        triangles += index.count / 3;
      } else {
        const position = mesh.geometry.getAttribute("position");
        if (position) {
          triangles += position.count / 3;
        }
      }
    }
  });
  if (meshCount === 0) {
    throw new Error("该文件不含可渲染的网格");
  }
  return { object, meshCount, triangleCount: Math.round(triangles) };
}

/* ==================== OFF 内置解析器 ==================== */

/**
 * OFF（普林斯顿物体格式，纯文本）→ BufferGeometry。
 *
 * <p>three 0.185 已移除官方 OFFLoader，OFF 本身只有「头 + 计数 + 顶点行 +
 * 面行」四段结构，行式解析即可覆盖 OFF / NOFF / COFF / CNOFF 变体
 * （N 的法线忽略——由 computeVertexNormals 生成；C 的顶点色启用
 * vertexColors）。面一律按扇形三角化（四边形拆两三角）。行内以 # 起头的是注释。</p>
 *
 * @param text OFF 文本内容
 * @return {geometry, triangles}
 */
function parseOff(text: string): { geometry: THREE.BufferGeometry; triangles: number } {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.replace(/#.*$/, "").trim())
    .filter((line) => line.length > 0);
  if (lines.length === 0) {
    throw new Error("OFF 文件内容为空");
  }
  /** 越界安全的取行 */
  const lineAt = (index: number): string => (index >= 0 && index < lines.length ? lines[index] : "");
  const headerMatch = /^([A-Za-z]*OFF)\b\s*(.*)$/.exec(lines[0]);
  if (!headerMatch) {
    throw new Error("不是有效的 OFF 文件（缺少 OFF 文件头）");
  }
  const flags = headerMatch[1].toUpperCase();
  const hasVertexColor = flags.includes("C");
  let lineIndex = 1;
  // 计数行可能接在头行尾，也可能独占一行
  const countSource = headerMatch[2].trim() ? headerMatch[2].trim() : lineAt(lineIndex++);
  const countTokens = countSource.split(/\s+/).map(Number);
  if (countTokens.length < 2 || !Number.isFinite(countTokens[0]) || !Number.isFinite(countTokens[1])) {
    throw new Error("不是有效的 OFF 文件（顶点/面计数缺失）");
  }
  const vertexCount = countTokens[0];
  const faceCount = countTokens[1];
  if (vertexCount < 3 || faceCount < 1) {
    throw new Error("该 OFF 文件不含可渲染的几何");
  }
  const positions = new Float32Array(vertexCount * 3);
  const colors = hasVertexColor ? new Float32Array(vertexCount * 3) : null;
  for (let v = 0; v < vertexCount; v++, lineIndex++) {
    const tokens = lineAt(lineIndex).split(/\s+/).map(Number);
    if (tokens.length < 3 || tokens.slice(0, 3).some((n) => !Number.isFinite(n))) {
      throw new Error(`OFF 顶点数据损坏（第 ${v + 1} 个顶点）`);
    }
    positions[v * 3] = tokens[0];
    positions[v * 3 + 1] = tokens[1];
    positions[v * 3 + 2] = tokens[2];
    if (colors && tokens.length >= 7) {
      // OFF 顶点色惯例既可能是 0~1 也可能是 0~255，按量纲归一
      const r = tokens[3];
      const g = tokens[4];
      const b = tokens[5];
      const scale = Math.max(r, g, b) > 1 ? 1 / 255 : 1;
      colors[v * 3] = r * scale;
      colors[v * 3 + 1] = g * scale;
      colors[v * 3 + 2] = b * scale;
    }
  }
  const indices: number[] = [];
  for (let f = 0; f < faceCount; f++, lineIndex++) {
    const tokens = lineAt(lineIndex).split(/\s+/).map(Number);
    const k = tokens[0];
    if (!Number.isFinite(k) || k < 3 || tokens.length < k + 1) {
      continue;
    }
    const face: number[] = [];
    for (let j = 1; j <= k; j++) {
      face.push(tokens[j]);
    }
    for (let j = 1; j < k - 1; j++) {
      indices.push(face[0], face[j], face[j + 1]);
    }
  }
  if (indices.length < 3) {
    throw new Error("该 OFF 文件不含可渲染的面");
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  if (colors) {
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  }
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return { geometry, triangles: indices.length / 3 };
}

/* ==================== 统一入口 ==================== */

/**
 * 解析一个受支持的 3D 模型文件字节 → three 可渲染对象。
 *
 * <p>唯一的对外入口：按格式分派到 occt（step/iges/brep）、rhino3dm（3dm）、
 * three 加载器（3ds/ply/dae/wrl/3mf）或内置 OFF 解析器。wasm 引擎按模块级
 * 单例缓存（首次下载约 7.6 MB / 2.7 MB，之后同一会话内零成本复用）。</p>
 *
 * @param format   detectModel3dFormat 的识别结果
 * @param bytes    文件原始字节
 * @param callbacks 加载进度回调（可选）
 * @return 装配好的模型与统计
 */
export async function parseModel3d(
  format: Model3dFormat,
  bytes: ArrayBuffer,
  callbacks: ParseCallbacks = {},
): Promise<ParsedModel> {
  switch (format) {
    case "step":
    case "iges":
    case "brep": {
      const occt = await ensureOcct(callbacks);
      callbacks.onPhase?.(`解析 ${FORMAT_LABEL[format]}…`);
      // 同步 WASM 解析前让一帧，把「解析中」先画出来（避免看起来像卡死）
      await new Promise((resolve) => setTimeout(resolve, 30));
      const result =
        format === "step"
          ? occt.ReadStepFile(new Uint8Array(bytes), null)
          : format === "iges"
            ? occt.ReadIgesFile(new Uint8Array(bytes), null)
            : occt.ReadBrepFile(new Uint8Array(bytes), null);
      return buildFromOcct(result, FORMAT_LABEL[format]);
    }
    case "3dm":
      return parseRhino(bytes, callbacks);
    case "off": {
      callbacks.onPhase?.("解析 OFF…");
      const { geometry, triangles } = parseOff(new TextDecoder("utf-8").decode(bytes));
      const material = new THREE.MeshStandardMaterial({
        color: DEFAULT_MESH_COLOR,
        roughness: 0.75,
        metalness: 0.1,
        vertexColors: !!geometry.attributes.color,
      });
      const group = new THREE.Group();
      group.add(new THREE.Mesh(geometry, material));
      return { object: group, meshCount: 1, triangleCount: Math.round(triangles) };
    }
    default:
      return parseWithThreeLoader(format, bytes, callbacks);
  }
}
