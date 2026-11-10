<script setup lang="ts">
/**
 * 文件存储服务页 —— 现代云盘风格
 *
 * 对接独立文件存储服务器（FileStorageServerFilter），提供：
 *  - 顶部工具栏（服务器/存储桶配置、搜索、视图切换、上传）
 *  - 左侧边栏（存储桶统计、快捷操作）
 *  - 主区域（面包屑导航、网格/列表双视图）
 *  - 弹窗预览（图片/文本/Office/PDF/音视频）
 *  - 一次性链接（自定义过期时间）
 */
/**
 * 上传弹框样式（.fs-up*）。
 *
 * <p><b>必须在这里 import，不能只靠 pages/filesystem/src/index.ts。</b>
 * index.ts 里虽然有一行 {@code import "./styles/upload.css"}，但 monitor 的路由
 * （apps/vue-support-monitor-starter/src/router/index.ts）是直接
 * {@code import("@pages/filesystem/src/views/FileStorageManage.vue")}，
 * 从不加载 index.ts —— 于是那条全局样式从未注入。</p>
 *
 * <p>症状：上传弹框的所有 .fs-up__* 规则全丢，.fs-up__pick 退回浏览器原生
 * 按钮外观（2px outset 灰底），拖拽区没有虚线框和内边距，标题不居中。
 * 2026-10-27 实测：.fs-up__* 精确规则数为 0。放到组件里 import 后，
 * 无论走路由还是走 index.ts 注册都必然加载。</p>
 *
 * <p>文件本身是全局样式（不带 scoped）：弹框 append-to-body 后 DOM 挂在
 * body 下，scoped 选择器匹配不到。</p>
 */
import "../styles/upload.css";
import { message } from "@repo/core";
import { computed, defineAsyncComponent, nextTick, onMounted, onUnmounted, reactive, ref, watch, type Component } from "vue";
import { ElMessageBox } from "element-plus";
import {
  ArrowLeft,
  Box,
  CircleCheck,
  Clock,
  Close,
  Connection,
  CopyDocument,
  Delete,
  DeleteFilled,
  Document,
  DocumentCopy,
  Download,
  EditPen,
  Files,
  Folder,
  FolderAdd,
  FolderOpened,
  Grid,
  InfoFilled,
  Key,
  Link,
  Lock,
  List,
  Menu,
  Operation,
  Picture,
  Refresh,
  RefreshLeft,
  RefreshRight,
  Scissor,
  Search,
  Setting,
  Sort,
  Stamp,
  Tickets,
  Upload,
  UploadFilled,
  View,
  VideoPause,
  VideoPlay,
} from "@element-plus/icons-vue";
import {
  DEFAULT_BUCKET,
  DEFAULT_SERVER,
  copyObjects,
  createDirectory,
  createFile,
  createOneTimeLink,
  deleteObject,
  downloadZip,
  existObject,
  getBucketConfig,
  getCapabilities,
  getDefaultBucket,
  getBucketTree,
  getServerBase,
  isUploadAborted,
  listObjects,
  listObjectsPaged,
  moveObjects,
  resolveObjectUrl,
  renameObject,
  unzipObject,
  zipArchiveName,
  putObject,
  setBucketConfig,
  setDefaultBucket,
  clearBucketOverride,
  getAppDefaultBucket,
  hasBucketOverride,
  isBucketMissingError,
  loadFileServerConfig,
  isFileServerConfigDiscovered,
  getFileServerConfigError,
  listOneTimeLinks,
  revokeOneTimeLink,
} from "../api/filestorageApi";
import type { BucketConfig, CapabilitiesResponse, OneTimeLinkItem, StorageObject, TreeItem } from "../api/filestorageApi";
import { createFileCollab } from "../api/filestorageApi";
import PreviewIframePanel from "../components/PreviewIframePanel.vue";
import PreviewImagePanel from "../components/PreviewImagePanel.vue";
import PreviewOfficePanel from "../components/PreviewOfficePanel.vue";
import PreviewMediaPanel from "../components/PreviewMediaPanel.vue";
import ArchivePreviewPanel from "../components/ArchivePreviewPanel.vue";
import InlineRenameLabel from "../components/InlineRenameLabel.vue";
import { clearImageMetaCache, peekImageMeta, probeImageMeta, type ImageMeta } from "../utils/imageMeta";
import {
  THUMB_EDGE,
  THUMB_JPEG_QUALITY,
  buildScaleParams,
  dropImageBlob,
  withQuery,
} from "../utils/imageSource";
import { runPool } from "../utils/taskPool";
/**
 * file-viewer 明确不支持、或需要自研增强的兜底面板按需加载。
 *
 * <p>TGA / SWF / Sketch 不在 file-viewer formats 清单内；OFF 同样不在
 * renderer-3d 清单内，保留 {@link PreviewModel3dPanel} 只承接 OFF。已由
 * file-viewer 覆盖的 IFC / CAD / 3D / DICOM / Geo / BPMN / drawio / Data /
 * TIFF / HEIC / PSD 等一律走下方 fv/* 面板，不再引入这里的大依赖。</p>
 */
const PreviewTgaPanel = defineAsyncComponent(() => import("../components/PreviewTgaPanel.vue"));
const PreviewSwfPanel = defineAsyncComponent(() => import("../components/PreviewSwfPanel.vue"));
const SketchPreviewPanel = defineAsyncComponent(() => import("../components/SketchPreviewPanel.vue"));
const PreviewModel3dPanel = defineAsyncComponent(() => import("../components/PreviewModel3dPanel.vue"));
const PreviewIfcPanel = defineAsyncComponent(() => import("../components/PreviewIfcPanel.vue"));

/* ================== file-viewer 主渲染面板（fv/*，按需加载） ================== */
/**
 * fv/* 是 file-viewer 主渲染链路：text / doc / design / data / signature /
 * binary / eda / chm / typst / drawing / geo / image / dicom / media / 3d /
 * cad / archive 全部由 @file-viewer/vue3-full 的渲染器承接。
 *
 * <p>全部异步组件：面板内部各自动态 import 渲染器（CHM WASM、Typst WASM、
 * archive-wasm、binary 结构解析器等），不预览的人不该为它们付首屏成本。</p>
 */
const FvTextPanel = defineAsyncComponent(() => import("../components/fv/FvTextPanel.vue"));
const FvLogAnalyzePanel = defineAsyncComponent(() => import("../components/fv/FvLogAnalyzePanel.vue"));
const FvDocPanel = defineAsyncComponent(() => import("../components/fv/FvDocPanel.vue"));
const FvOutlinePanel = defineAsyncComponent(() => import("../components/fv/FvOutlinePanel.vue"));
const FvDesignPanel = defineAsyncComponent(() => import("../components/fv/FvDesignPanel.vue"));
const FvSignaturePanel = defineAsyncComponent(() => import("../components/fv/FvSignaturePanel.vue"));
const FvBinaryPanel = defineAsyncComponent(() => import("../components/fv/FvBinaryPanel.vue"));
const FvEdaPanel = defineAsyncComponent(() => import("../components/fv/FvEdaPanel.vue"));
const FvChmPanel = defineAsyncComponent(() => import("../components/fv/FvChmPanel.vue"));
const FvTypstPanel = defineAsyncComponent(() => import("../components/fv/FvTypstPanel.vue"));
const FvDataPanel = defineAsyncComponent(() => import("../components/fv/FvDataPanel.vue"));
const FvDrawingPanel = defineAsyncComponent(() => import("../components/fv/FvDrawingPanel.vue"));
const FvGeoPanel = defineAsyncComponent(() => import("../components/fv/FvGeoPanel.vue"));
const FvImagePanel = defineAsyncComponent(() => import("../components/fv/FvImagePanel.vue"));
const FvJxlPanel = defineAsyncComponent(() => import("../components/fv/FvJxlPanel.vue"));
const FvDicomPanel = defineAsyncComponent(() => import("../components/fv/FvDicomPanel.vue"));
const FvMediaPanel = defineAsyncComponent(() => import("../components/fv/FvMediaPanel.vue"));
const VideoPreviewPanel = defineAsyncComponent(() => import("../components/VideoPreviewPanel.vue"));
const FvModelPanel = defineAsyncComponent(() => import("../components/fv/FvModelPanel.vue"));
const FvCadPanel = defineAsyncComponent(() => import("../components/fv/FvCadPanel.vue"));
const FvArchivePanel = defineAsyncComponent(() => import("../components/fv/FvArchivePanel.vue"));

/**
 * file-viewer 注册表权威扩展名（47 定义 / formats.generated.js）→ 承接面板。
 *
 * <p>映射与原生面板的关系：原生分支在模板 fv 分支之前，因此上表即使包含
 * 原生已接管的扩展名（如 docx/png/geojson）也只会被原生吃掉，不会产生分流。
 * 真正落到这里的，是下面这些没有原生面板或原生只吃前半段的格式：
 * txt/md/html/code、xmind/epub/fb2/umd/eml/msg/mbox、CHM/EDA/Typst、
 * kml/gpx/shp、mermaid/plantuml、jxl、dwf/dwfx/xps、otf/woff、签名容器、
 * binary/elf/exe、EDA/版图、以及 archive 长尾（iso/cbz/cbr…）。</p>
 */
const FV_PANEL_BY_EXT: Record<string, Component> = {
  // renderer-text
  md: FvTextPanel,
  markdown: FvTextPanel,
  txt: FvTextPanel,
  json: FvTextPanel,
  js: FvTextPanel,
  mjs: FvTextPanel,
  cjs: FvTextPanel,
  css: FvTextPanel,
  java: FvTextPanel,
  py: FvTextPanel,
  html: FvTextPanel,
  htm: FvTextPanel,
  jsx: FvTextPanel,
  ts: FvTextPanel,
  tsx: FvTextPanel,
  xml: FvTextPanel,
  // .log：hs_err_pid*.log（JVM 崩溃日志）走运维分析面板（双模式），普通日志退化为文本
  log: FvLogAnalyzePanel,
  vue: FvTextPanel,
  yaml: FvTextPanel,
  yml: FvTextPanel,
  ini: FvTextPanel,
  sh: FvTextPanel,
  bash: FvTextPanel,
  sql: FvTextPanel,
  go: FvTextPanel,
  rs: FvTextPanel,
  php: FvTextPanel,
  c: FvTextPanel,
  cpp: FvTextPanel,
  cc: FvTextPanel,
  h: FvTextPanel,
  hpp: FvTextPanel,
  cs: FvTextPanel,
  diff: FvTextPanel,
  patch: FvTextPanel,
  bundle: FvTextPanel,
  bdl: FvBinaryPanel,
  jsonc: FvTextPanel,
  json5: FvTextPanel,
  ipynb: FvTextPanel,
  toml: FvTextPanel,
  proto: FvTextPanel,
  hcl: FvTextPanel,
  tex: FvTextPanel,
  gv: FvTextPanel,
  http: FvTextPanel,
  react: FvTextPanel,
  rb: FvTextPanel,
  swift: FvTextPanel,
  kt: FvTextPanel,
  // 文本兜底：脚本 / 配置 / 字幕 / 标记文档（非 renderer-text 白名单时按纯文本渲染）
  ps1: FvTextPanel,
  bat: FvTextPanel,
  cmd: FvTextPanel,
  zsh: FvTextPanel,
  fish: FvTextPanel,
  lua: FvTextPanel,
  pl: FvTextPanel,
  pm: FvTextPanel,
  hs: FvTextPanel,
  r: FvTextPanel,
  dart: FvTextPanel,
  scala: FvTextPanel,
  vb: FvTextPanel,
  vbs: FvTextPanel,
  fs: FvTextPanel,
  ex: FvTextPanel,
  exs: FvTextPanel,
  erl: FvTextPanel,
  clj: FvTextPanel,
  properties: FvTextPanel,
  conf: FvTextPanel,
  cnf: FvTextPanel,
  env: FvTextPanel,
  cfg: FvTextPanel,
  gradle: FvTextPanel,
  kts: FvTextPanel,
  gitignore: FvTextPanel,
  // shell / 工具 dotfile（.zshrc / .bashrc 等，按纯文本渲染）
  zshrc: FvTextPanel,
  bashrc: FvTextPanel,
  bash_profile: FvTextPanel,
  profile: FvTextPanel,
  gitconfig: FvTextPanel,
  editorconfig: FvTextPanel,
  npmrc: FvTextPanel,
  dockerignore: FvTextPanel,
  srt: FvTextPanel,
  vtt: FvTextPanel,
  ass: FvTextPanel,
  ssa: FvTextPanel,
  rst: FvTextPanel,
  adoc: FvTextPanel,
  org: FvTextPanel,
  less: FvTextPanel,
  scss: FvTextPanel,
  cxx: FvTextPanel,
  pyi: FvTextPanel,
  svelte: FvTextPanel,
  astro: FvTextPanel,
  xsl: FvTextPanel,
  xsd: FvTextPanel,
  // .mf（Java MANIFEST.MF / METAFONT 源文件）为纯文本，按文本渲染
  mf: FvTextPanel,
  // renderer-doc
  xmind: FvDocPanel,
  epub: FvDocPanel,
  fb2: FvDocPanel,
  umd: FvDocPanel,
  eml: FvDocPanel,
  msg: FvDocPanel,
  mbox: FvDocPanel,
  // 大纲 / 脑图（非 XMind）：FreeMind .mm、OPML .opml（前端解析成树）
  mm: FvOutlinePanel,
  opml: FvOutlinePanel,
  // .markmap 是 Markdown 语法（标题即脑图层级），按 markdown 渲染
  markmap: FvTextPanel,
  // renderer-design / renderer-data / renderer-signature / renderer-binary
  psb: FvDesignPanel,
  pdd: FvBinaryPanel,
  psdt: FvDesignPanel,
  ait: FvDesignPanel,
  idml: FvDesignPanel,
  icml: FvBinaryPanel,
  idms: FvDesignPanel,
  inx: FvDesignPanel,
  fla: FvBinaryPanel,
  xfl: FvDesignPanel,
  xd: FvDesignPanel,
  indd: FvDesignPanel,
  indt: FvDesignPanel,
  ps: FvDesignPanel,
  ase: FvDesignPanel,
  aco: FvBinaryPanel,
  abr: FvDesignPanel,
  csh: FvBinaryPanel,
  pat: FvDesignPanel,
  grd: FvDesignPanel,
  asl: FvBinaryPanel,
  ttf: FvDataPanel,
  otf: FvDataPanel,
  woff: FvDataPanel,
  woff2: FvDataPanel,
  psd: FvDataPanel,
  ai: FvDataPanel,
  eps: FvDataPanel,
  sqlite: FvDataPanel,
  wasm: FvDataPanel,
  parquet: FvDataPanel,
  avro: FvDataPanel,
  webarchive: FvDataPanel,
  p7m: FvSignaturePanel,
  p7s: FvSignaturePanel,
  p7c: FvSignaturePanel,
  p7b: FvSignaturePanel,
  pkcs7: FvSignaturePanel,
  cms: FvSignaturePanel,
  cmsc: FvSignaturePanel,
  tsd: FvSignaturePanel,
  tst: FvSignaturePanel,
  tsq: FvSignaturePanel,
  tsr: FvSignaturePanel,
  asics: FvSignaturePanel,
  scs: FvSignaturePanel,
  asice: FvSignaturePanel,
  sce: FvSignaturePanel,
  ers: FvSignaturePanel,
  asc: FvSignaturePanel,
  sig: FvBinaryPanel,
  pgp: FvSignaturePanel,
  gpg: FvSignaturePanel,
  jws: FvSignaturePanel,
  bin: FvBinaryPanel,
  hex: FvBinaryPanel,
  elf: FvBinaryPanel,
  exe: FvBinaryPanel,
  dll: FvBinaryPanel,
  class: FvBinaryPanel,
  macho: FvBinaryPanel,
  // renderer-chm / renderer-eda / renderer-typst
  chm: FvChmPanel,
  olb: FvEdaPanel,
  dra: FvEdaPanel,
  gds: FvEdaPanel,
  oas: FvEdaPanel,
  oasis: FvEdaPanel,
  typ: FvTypstPanel,
  typst: FvTypstPanel,
  // renderer-drawing / renderer-geo / renderer-media / renderer-image
  excalidraw: FvDrawingPanel,
  drawio: FvDrawingPanel,
  dio: FvDrawingPanel,
  mermaid: FvDrawingPanel,
  mmd: FvDrawingPanel,
  plantuml: FvDrawingPanel,
  puml: FvDrawingPanel,
  bpmn: FvDrawingPanel,
  geojson: FvGeoPanel,
  kml: FvGeoPanel,
  gpx: FvGeoPanel,
  shp: FvGeoPanel,
  // renderer-media：file-viewer 支持的音视频（MP4/WebM/HLS/OGG + 常见音频）
  // 直渲；flv/m4v 不在 file-viewer formats 清单，仍由 VideoPreviewPanel 自研接管
  mp4: FvMediaPanel,
  webm: FvMediaPanel,
  m3u8: FvMediaPanel,
  ogg: FvMediaPanel,
  mp3: FvMediaPanel,
  mpeg: FvMediaPanel,
  wav: FvMediaPanel,
  oga: FvMediaPanel,
  opus: FvMediaPanel,
  m4a: FvMediaPanel,
  aac: FvMediaPanel,
  flac: FvMediaPanel,
  weba: FvMediaPanel,
  midi: FvMediaPanel,
  mid: FvMediaPanel,
  gif: FvImagePanel,
  jpg: FvImagePanel,
  jpeg: FvImagePanel,
  bmp: FvImagePanel,
  tiff: FvImagePanel,
  tif: FvImagePanel,
  png: FvImagePanel,
  svg: FvImagePanel,
  webp: FvImagePanel,
  avif: FvImagePanel,
  ico: FvImagePanel,
  heic: FvImagePanel,
  heif: FvImagePanel,
  jxl: FvJxlPanel,
  // renderer-dicom
  dcm: FvDicomPanel,
  dicom: FvDicomPanel,
  // renderer-3d / renderer-cad
  glb: FvModelPanel,
  gltf: FvModelPanel,
  obj: FvModelPanel,
  stl: FvModelPanel,
  amf: FvModelPanel,
  usd: FvModelPanel,
  usda: FvModelPanel,
  usdc: FvModelPanel,
  usdz: FvModelPanel,
  kmz: FvModelPanel,
  // step/stp/iges/igs/brep 走 occt-import-js、3dm 走 rhino3dm、
  // 3ds/ply/dae/wrl/vrml/3mf/off 由 three 原生加载器解析：
  // 这些格式在 FvModelPanel（@file-viewer/renderer-3d）侧要么只有信息卡、
  // 要么明确拒绝（3dm 报"需要独立 rhino3dm 内核"），而 PreviewModel3dPanel
  // 已内置两套 WASM 引擎 + three 渲染器，改派到这里才能真出图形。
  step: PreviewModel3dPanel,
  stp: PreviewModel3dPanel,
  // IGES 本来就在 FvModelPanel 的能力之外（它只给信息卡），但面板层
  // PreviewModel3dPanel 是支持的：EXT_TO_FORMAT 里有 iges/igs，OCCT 侧调
  // ReadIgesFile 三角化后 three 直接渲染。此前这里挂的是 FvBinaryPanel，
  // 等于「有渲染器却只给十六进制」——台账里 iges/igs 的 FAIL 就是这样被固定住的。
  iges: PreviewModel3dPanel,
  igs: PreviewModel3dPanel,
  brep: PreviewModel3dPanel,
  "3dm": PreviewModel3dPanel,
  "3ds": PreviewModel3dPanel,
  ply: PreviewModel3dPanel,
  dae: PreviewModel3dPanel,
  ifc: PreviewIfcPanel,
  pcd: FvModelPanel,
  // VRML / FBX 走 three 原生加载器（真出图形）。此前这两个（三个后缀）被派到
  // 二进制检视，是因为台账记录「三方加载器解析缺陷」；实际根因在解析调用方：
  // ① `.vrml` 不在 EXT_TO_FORMAT 里，压根到不了 3D 面板；
  // ② ASCII FBX 被喂了字符串，而 three 的 parse() 要 ArrayBuffer，
  //    getFbxVersion 因此取不到版本号直接抛错。
  // 两处都已修好并加了单测（src/utils/model3d.test.ts 用手写的最小合法样本锁住）。
  wrl: PreviewModel3dPanel,
  vrml: PreviewModel3dPanel,
  "3mf": PreviewModel3dPanel,
  off: PreviewModel3dPanel,
  fbx: PreviewModel3dPanel,
  vtk: PreviewModel3dPanel,
  xyz: FvModelPanel,
  vtp: FvModelPanel,
  dxf: FvCadPanel,
  dwg: FvCadPanel,
  dwf: FvCadPanel,
  dwfx: FvCadPanel,
  xps: FvCadPanel,
  // renderer-archive（原生 ARCHIVE_EXTS 由 ArchivePreviewPanel 先接管，长尾落 fv）
  zip: FvArchivePanel,
  zipx: FvArchivePanel,
  "7z": FvArchivePanel,
  rar: FvArchivePanel,
  tar: FvArchivePanel,
  gz: FvArchivePanel,
  gzip: FvArchivePanel,
  tgz: FvArchivePanel,
  bz2: FvArchivePanel,
  bzip2: FvArchivePanel,
  tbz: FvArchivePanel,
  tbz2: FvArchivePanel,
  xz: FvArchivePanel,
  txz: FvArchivePanel,
  lzma: FvArchivePanel,
  zst: FvArchivePanel,
  tzst: FvArchivePanel,
  cab: FvArchivePanel,
  ar: FvArchivePanel,
  cpio: FvArchivePanel,
  iso: FvArchivePanel,
  xar: FvArchivePanel,
  lha: FvArchivePanel,
  lzh: FvArchivePanel,
  jar: FvArchivePanel,
  war: FvArchivePanel,
  ear: FvArchivePanel,
  apk: FvArchivePanel,
  cbz: FvArchivePanel,
  cbr: FvArchivePanel,
};

/** 三项无法保真原生渲染的格式，在面板报错后切为二进制检视兜底，不让用户白看提示卡 */
const BINARY_FALLBACK_EXTS: ReadonlySet<string> = new Set([
  "fbx", "iges", "igs", "wrl", "vrml", "jxl", "sig", "bdl",
  "webm", "m3u8", "pdd", "icml", "fla", "aco", "csh", "asl",
  "oga", "flac", "elf", "macho", "zipx",
]);
/** 已切到二进制检视兜底（仅在 {@link BINARY_FALLBACK_EXTS} 内生效） */
const binaryFallback = ref(false);

/** 当前 fv 路由：native 分支没吃掉时，根据生效文件名选面板（包内条目用条目名） */
const fvPanel = computed(() => {
  const ext = extensionOf(fileNameForClientRender.value).toLowerCase();
  if (binaryFallback.value && BINARY_FALLBACK_EXTS.has(ext)) {
    return FvBinaryPanel;
  }
  return FV_PANEL_BY_EXT[ext] ?? null;
});

/** 判断某文件名（顶层或压缩包内）是否命中 fv 面板，供 loading 归属判断复用 */
function isFvPanelFile(name: string): boolean {
  const ext = extensionOf(name).toLowerCase();
  return !!FV_PANEL_BY_EXT[ext];
}

/**
 * 视频面板（{@link VideoPreviewPanel}）接管的扩展名。
 *
 * <p>mp4/webm/m4v/ogg 是浏览器原生容器；m3u8 走 video.js
 * 内置 VHS（Chrome / Firefox 也能播 HLS）；flv 走 flv.js。
 * 按<b>扩展名</b>判定而非 {@code kindOf}：m3u8 / flv 的
 * 类型是 unknown，进不了 kindOf === "video" 的旧媒体分发；
 * m4v 同样不在 IMAGE/VIDEO 扩展名表里。</p>
 */
const VIDEO_PANEL_EXTS: ReadonlySet<string> = new Set([
  // flv 只能走 flv.js；m4v 不在 file-viewer formats 清单，按 MP4 容器自研播放。
  // mp4/webm/ogg/m3u8 已由 file-viewer renderer-media 接管。
  "flv", "m4v",
]);

/** file-viewer 未收录、仍需 PreviewMediaPanel 兜底的媒体容器（含 AIFF 转码） */
const FALLBACK_MEDIA_EXTS: ReadonlySet<string> = new Set([
  "aiff", "aif", "mov", "avi", "mkv", "wmv", "3gp",
]);

/** 名称（顶层或包内条目）是否命中媒体自研兜底 */
function isFallbackMedia(name: string): boolean {
  const ext = extensionOf(name).toLowerCase();
  return FALLBACK_MEDIA_EXTS.has(ext) || VIDEO_PANEL_EXTS.has(ext);
}

/** 判断某文件名（顶层或压缩包内）是否由图视频面板接管 */
function isVideoPanelFile(name: string): boolean {
  return VIDEO_PANEL_EXTS.has(extensionOf(name).toLowerCase());
}

import { extensionOf, isClientRenderable, RENDER_SERVER } from "../utils/officeRenderer";
import { parseExpiryToSeconds } from "../utils/expiry";
import { CLIENT_DATA_EXTS, CLIENT_PSD_EXTS, fileSvg, fileTypeText, kindOf } from "../utils/fileKind";
import ReDialog from "@repo/ui/re-dialog";
import ReTable from "@repo/ui/re-table";

/** 排序字段：name 名称 / size 大小 / lastModified 修改时间 */
type SortKey = "name" | "size" | "lastModified";
/** 排序方向：asc 升序 / desc 降序 */
type SortOrder = "asc" | "desc";

/** 视图模式：columns=分栏（macOS Finder 风格，默认）/ details / largeIcons / mediumIcons / smallIcons */
type ViewMode = "columns" | "details" | "largeIcons" | "mediumIcons" | "smallIcons";

/* ================== 连接 & 状态 ================== */

/**
 * 从当前页面 URL 解析存储桶。
 *
 * 服务返回的 Vue 壳页面 URL 即 {@code /{bucket}}，第一段路径即 bucket；
 * query 参数 bucket 优先级最高，便于测试覆盖。
 * 仅当页面由文件服务器自身提供（origin 与文件服务器一致）时才取首段路径，
 * 系统应用内嵌页面（/{appBase}/manage/filestorage）的首段是应用前缀，不能当作桶名。
 */
function resolveBucket(): string {
  try {
    const qs = new URLSearchParams(window.location.search);
    const qb = (qs.get("bucket") || "").trim();
    if (qb) return qb;
    const serverBase = getServerBase();
    if (!serverBase) return "";
    const sbUrl = new URL(serverBase);
    // 页面与文件服务器不同源：不可能是文件服务器提供的壳页面（standalone 跨服务）
    if (sbUrl.origin !== (window.location.origin || sbUrl.origin)) return "";
    // 关键：embedded 时 serverBase 是相对路径拼当前 origin，origin 恒相同，
    // 单看 origin 会把宿主内嵌页（/{appBase}/manage/filestorage）误判为壳页面，
    // 进而把应用前缀（如 system）当成桶名 → 桶不存在 → 文件服务器兜底 404。
    // 补充判断：页面路径必须位于文件服务器路径前缀（serverBase.pathname）之下，
    // 才是由文件服务器自身提供的壳页面；否则视为宿主内嵌，走默认桶。
    const sbPath = sbUrl.pathname;
    const pagePath = (window.location.pathname || "").split("#")[0];
    if (!sbPath || sbPath === "/" || !pagePath.startsWith(sbPath)) {
      return "";
    }
    const seg = pagePath.slice(sbPath.length).split("/").filter((s) => s.length > 0);
    const first = (seg[0] || "").trim();
    if (first && !["fs", "assets", "ot", "config"].includes(first.toLowerCase())) {
      return first;
    }
  } catch { /* ignore */ }
  return "";
}

const server = ref(getServerBase() || DEFAULT_SERVER);
const bucket = ref(resolveBucket() || getDefaultBucket() || DEFAULT_BUCKET);
const currentPath = ref("");
const objects = ref<StorageObject[]>([]);
const loading = ref(false);
/** 当前列表页（1 起） */
const page = ref(1);
/** 主列表分页大小：每页对象个数（服务端切片 limit，默认 200） */
const PAGE_SIZE = 200;
/** 分栏每列最多渲染的对象数（超出截断，显示溢出提示） */
const COLUMN_LIMIT = 500;
/** 左侧快捷访问最多渲染的根目录对象数 */
const ROOT_LIMIT = 200;
/** 当前目录对象总数（后端 total，分页状态栏用）；旧服务端未返回时回退为 objects.length */
const listTotal = ref(0);
/** 翻页请求进行中（防连点） */
const pageBusy = ref(false);
/**
 * 列表加载请求序号：目录连点/历史快进时旧响应直接丢弃，避免"后发先至"把列表
 * 闪回旧目录；同时 loading 只在请求超过阈值未完成时才置 true（见 scheduleLoadingShow），
 * 300ms 内的快速请求全程不触达 v-loading，列表区零闪烁。刷新图标的旋转由
 * {@link navLoading}（面包屑旁小 spinner）承担。
 */
let loadSeq = 0;
/** 当前生效的列表请求序号（>= 它才允许写 objects） */
let activeLoadSeq = 0;
/** 延迟显示 loading 的定时器（快速请求内完成则取消） */
let loadShowTimer: number | undefined;
/** 目录导航加载中（延迟 300ms 显示，只驱动面包屑小 spinner，不罩住列表） */
const navLoading = ref(false);
/** 当前目录加载失败的原因（空串表示无错误）；列表区据此显示真实原因而不是「当前目录为空」 */
const loadError = ref("");
/** 视图模式：columns=分栏（默认，macOS Finder 风格）/ largeIcons / mediumIcons / smallIcons / details */
const viewMode = ref<ViewMode>("columns");
/** 排序字段 */
const sortKey = ref<SortKey>("name");
/** 排序方向：asc 升序 / desc 降序 */
const sortOrder = ref<SortOrder>("asc");

/* ================== 变体 B：侧栏胶囊过滤（搜索 / 类型 / 大小 / 日期 / 排序） ================== */

/**
 * 类型胶囊的分组口径
 *
 * <p>刻意<b>不复用</b> {@link kindOf}：{@code kindOf} 回答的是「用哪个预览器打开」
 * （细到 tiff / heic / ofd / swf 十几种），而筛选要的是用户视角的粗粒度分组。
 * 两套扩展名集合并不重合——xlsx 在 {@code kindOf} 里是 office（Word/Excel/PPT 共用一个
 * 预览器），到了筛选里必须落进「表格」。故这里单独一张映射，见 {@link filterTypeOf}。</p>
 */
type FilterTypeKey = "all" | "image" | "doc" | "sheet" | "media" | "archive" | "other";
/** 大小胶囊区间 */
type FilterSizeKey = "all" | "lt1m" | "m1to10" | "m10to100" | "gt100m";
/** 日期胶囊区间 */
type FilterDateKey = "all" | "today" | "d7" | "d30" | "older";

/** 侧栏搜索胶囊的关键词（对文件名做不区分大小写的包含匹配） */
const filterKeyword = ref("");
/** 侧栏类型胶囊 */
const filterType = ref<FilterTypeKey>("all");
/** 侧栏大小胶囊 */
const filterSize = ref<FilterSizeKey>("all");
/** 侧栏日期胶囊 */
const filterDate = ref<FilterDateKey>("all");

/**
 * 过滤是否开启（排序不算：排序只在本地换序，不需要整目录数据）
 *
 * <p>它是「要不要整目录扫描」的唯一开关，见 {@link loadObjects}：开启时按
 * {@link FILTER_SCAN_LIMIT} 一次拉全目录再本地筛，关闭时回落到服务端 200 条分页。
 * 客户端筛选做不到「只筛当前页」——那样用户看到的是「本页里符合条件的」，
 * 而不是「这个目录里符合条件的」，所以必须整目录。</p>
 */
const filterActive = computed(
  () => filterKeyword.value.trim() !== "" || filterType.value !== "all" || filterSize.value !== "all" || filterDate.value !== "all",
);

/**
 * 过滤态下的整目录扫描上限
 *
 * <p>上限存在的意义是「不把 10 万条瓦片目录拉进浏览器」：超出部分不参与筛选，
 * 状态栏会明确写出「仅扫描前 N 项」，避免用户以为筛完就是全部。</p>
 */
const FILTER_SCAN_LIMIT = 1000;
/** 本次列表是否为整目录扫描（过滤开启时为 true，状态栏据此隐藏分页并提示扫描口径） */
const scanMode = ref(false);

/** 类型胶囊选项（模板按此渲染，顺序即展示顺序） */
const TYPE_OPTIONS: ReadonlyArray<{ key: FilterTypeKey; label: string }> = [
  { key: "all", label: "全部" },
  { key: "image", label: "图片" },
  { key: "doc", label: "文档" },
  { key: "sheet", label: "表格" },
  { key: "media", label: "音视频" },
  { key: "archive", label: "压缩包" },
  { key: "other", label: "其他" },
];

/** 大小胶囊选项 */
const SIZE_OPTIONS: ReadonlyArray<{ key: FilterSizeKey; label: string }> = [
  { key: "all", label: "全部" },
  { key: "lt1m", label: "小于 1M" },
  { key: "m1to10", label: "1-10M" },
  { key: "m10to100", label: "10-100M" },
  { key: "gt100m", label: "大于 100M" },
];

/** 日期胶囊选项 */
const DATE_OPTIONS: ReadonlyArray<{ key: FilterDateKey; label: string }> = [
  { key: "all", label: "全部" },
  { key: "today", label: "今天" },
  { key: "d7", label: "近 7 天" },
  { key: "d30", label: "近 30 天" },
  { key: "older", label: "更早" },
];

/** 排序胶囊选项（复用 {@link sortKey}/{@link sortOrder}，点击同一项切换升降序） */
const SORT_OPTIONS: ReadonlyArray<{ key: SortKey; label: string }> = [
  { key: "name", label: "名称" },
  { key: "size", label: "大小" },
  { key: "lastModified", label: "修改时间" },
];

/** 「表格」口径的扩展名（含 csv：用户找表格时 CSV 与 xlsx 是一类） */
const SHEET_FILTER_EXTS: readonly string[] = ["xls", "xlsx", "xlsm", "xlsb", "xlt", "xltx", "ods", "csv", "et", "numbers"];

/**
 * 扩展名 → 类型胶囊分组
 *
 * <p>判定顺序上「先查表格扩展名、再问 {@link kindOf}」：office 这一类要把 Word/Excel
 * 拆开，其他类别（图片/音视频/压缩包）与 {@code kindOf} 同口径，直接借它的结果。</p>
 *
 * @param name 文件名
 * @return 类型胶囊分组 {@link FilterTypeKey}（不含 all）
 */
function filterTypeOf(name: string): Exclude<FilterTypeKey, "all"> {
  const ext = name.slice(name.lastIndexOf(".") + 1).toLowerCase();
  if (SHEET_FILTER_EXTS.includes(ext)) return "sheet";
  switch (kindOf(name)) {
    case "image":
    case "tiff":
    case "heic":
    case "jxl":
    case "tga":
    case "design":
    case "sketch":
    case "dicom":
      return "image";
    case "video":
    case "audio":
      return "media";
    case "archive":
      return "archive";
    case "pdf":
    case "office":
    case "text":
    case "code":
    case "markdown":
    case "csv":
    case "email":
    case "calendar":
    case "contact":
    case "notebook":
    case "webpage":
    case "data":
    case "mindmap":
    case "bpmn":
    case "drawio":
    case "ofd":
      return "doc";
    default:
      return "other";
  }
}

/**
 * 大小胶囊是否命中
 *
 * @param o 对象
 * @return 命中（或未启用大小过滤）为 true
 */
function matchSizeFilter(o: StorageObject): boolean {
  if (filterSize.value === "all") return true;
  const size = o.size || 0;
  const MB = 1024 * 1024;
  switch (filterSize.value) {
    case "lt1m":
      return size < MB;
    case "m1to10":
      return size >= MB && size < 10 * MB;
    case "m10to100":
      return size >= 10 * MB && size < 100 * MB;
    case "gt100m":
      return size >= 100 * MB;
    default:
      return true;
  }
}

/**
 * 日期胶囊是否命中
 *
 * <p>「今天」按本地零点算而不是「24 小时内」：用户点「今天」要的是今天改过的文件，
 * 凌晨 1 点看「24 小时内」会把昨天下午的文件也算进来。</p>
 *
 * @param o 对象
 * @return 命中（或未启用日期过滤）为 true
 */
function matchDateFilter(o: StorageObject): boolean {
  if (filterDate.value === "all") return true;
  const t = o.lastModified || 0;
  if (!t) return false;
  const DAY = 86400000;
  const now = Date.now();
  switch (filterDate.value) {
    case "today": {
      const start = new Date(now);
      start.setHours(0, 0, 0, 0);
      return t >= start.getTime();
    }
    case "d7":
      return t >= now - 7 * DAY;
    case "d30":
      return t >= now - 30 * DAY;
    case "older":
      return t < now - 30 * DAY;
    default:
      return true;
  }
}

/**
 * 类型 / 大小 / 日期三项胶囊的综合判定
 *
 * <p><b>目录一律放行</b>：目录没有扩展名、大小恒为 0、修改时间也不是「文件内容的时间」，
 * 拿它去套这三项只会把目录全部误杀。目录的过滤只由关键词负责（按名字找目录是常态）。</p>
 *
 * @param o 对象
 * @return 通过为 true
 */
function matchCapsuleFilter(o: StorageObject): boolean {
  if (o.directory) return true;
  if (filterType.value !== "all" && filterTypeOf(o.name) !== filterType.value) return false;
  if (!matchSizeFilter(o)) return false;
  return matchDateFilter(o);
}

/**
 * 关键词胶囊是否命中（目录名也参与）
 *
 * @param o 对象
 * @return 命中（或关键词为空）为 true
 */
function matchKeywordFilter(o: StorageObject): boolean {
  const kw = filterKeyword.value.trim().toLowerCase();
  if (!kw) return true;
  return o.name.toLowerCase().includes(kw);
}

/** 一次性清空四个胶囊（侧栏「清除」按钮） */
function clearFilters(): void {
  filterKeyword.value = "";
  filterType.value = "all";
  filterSize.value = "all";
  filterDate.value = "all";
}

/**
 * 列表空态文案
 *
 * <p>过滤态下「当前目录为空」是错的——目录里有东西，只是没匹配上；
 * 这句文案直接影响用户会不会去点「清除」。</p>
 *
 * @return 空态提示文案
 */
const emptyText = computed(() => {
  if (loadError.value) return loadError.value;
  if (filterActive.value) return "没有匹配的文件";
  return "当前目录为空";
});

// 过滤开关一变就必须重载：开启 → 整目录扫描，关闭 → 回服务端分页。
// 只切类型/大小/日期（filterActive 仍为 true）不重载，本地筛即可，交互零延迟。
watch(filterActive, () => {
  page.value = 1;
  void loadObjects();
});

/** 当前右键菜单 */
const ctxMenu = ref<{ visible: boolean; x: number; y: number; row: StorageObject | null; path: string | null }>({ visible: false, x: 0, y: 0, row: null, path: null });

/**
 * 右键菜单元素引用
 *
 * <p>用于把菜单位置**收拢进视口**：菜单是 {@code position:fixed} 且贴着鼠标点渲染，
 * 在**底部/右侧**右键时会溢出视口，下半截/右半截看不见（实测：列表底部的文件右键，
 * 菜单部分落在可视区之外）。故先按原始点渲染，再测量真实尺寸并夹到视口内。</p>
 */
const ctxMenuRef = ref<HTMLElement | null>(null);

/**
 * 打开右键菜单，并把位置收拢进视口
 *
 * <p>不能直接用 {@code clientX/clientY}：菜单高度随内容变化（文件菜单与空白菜单项数不同），
 * 只有在渲染后测量才知道真实尺寸，所以这里 {@code nextTick} 后再夹一次。
 * 夹取时留 8px 边距，避免菜单贴边。</p>
 *
 * @param e   鼠标事件（取 clientX/clientY）
 * @param row 目标对象；空白处右键传 null
 * @param path 右键空白时所在的目录路径（分栏目录列空白为列路径，其余为当前目录；null 表示未指定）
 */
async function openMenuAt(e: MouseEvent, row: StorageObject | null, path: string | null = null): Promise<void> {
  ctxMenu.value = { visible: true, x: e.clientX, y: e.clientY, row, path };
  await nextTick();
  const el = ctxMenuRef.value;
  if (!el) {
    return;
  }
  const rect = el.getBoundingClientRect();
  const margin = 8;
  const maxX = window.innerWidth - rect.width - margin;
  const maxY = window.innerHeight - rect.height - margin;
  ctxMenu.value.x = Math.max(margin, Math.min(ctxMenu.value.x, Math.max(margin, maxX)));
  ctxMenu.value.y = Math.max(margin, Math.min(ctxMenu.value.y, Math.max(margin, maxY)));
}
/** 存储桶公开配置（?config） */
const bucketConfig = ref<BucketConfig | null>(null);
/** SPI 真实能力列表（?format=capabilities，滤镜/URL 参数动态渲染用） */
const capabilities = ref<CapabilitiesResponse | null>(null);
/** 存储桶配置加载状态 */
const configLoading = ref(false);
/** 选中的对象 name 集合（多选） */
const selected = ref<Set<string>>(new Set());
/** 最近一次点击的选中项（用于 Shift 连续多选） */
let lastSelectedIndex = -1;
/** 历史栈（KodExplorer 地址栏前进/后退） */
const historyStack = ref<string[]>([]);
/** 当前历史索引 */
const historyIndex = ref(-1);

const breadcrumbs = computed(() => {
  const segments = currentPath.value ? currentPath.value.split("/") : [];
  return [{ name: "根目录", path: "" }, ...segments.map((name, index) => ({
    name,
    path: segments.slice(0, index + 1).join("/"),
  }))];
});

/**
 * 当前目录的展示列表（先按胶囊过滤，再排序）
 *
 * <p>过滤条件见 {@link matchCapsuleFilter}/{@link matchKeywordFilter}，两者都为真才展示。
 * 关掉过滤时 {@link filterActive} 为 false，这两个判定恒真，行为与改造前一致。</p>
 *
 * <p>目录永远排在文件前面，再按排序字段排。刻意先复制一份数组再 {@code sort}，
 * 否则就地排序会改动 {@link objects} 本身，而 {@code objects} 还要拿去做统计与
 * 分栏缓存同步。</p>
 *
 * @return 过滤 + 排好序的当前目录条目
 */
const sortedObjects = computed(() => {
  return objects.value
    .filter((o) => matchKeywordFilter(o) && matchCapsuleFilter(o))
    .sort((a, b) => {
    // Windows 惯例：目录始终排在文件前面
    if (a.directory !== b.directory) return a.directory ? -1 : 1;
    const dir = sortOrder.value === "asc" ? 1 : -1;
    let r: number;
    switch (sortKey.value) {
      case "size":
        r = (a.size || 0) - (b.size || 0);
        break;
      case "lastModified":
        r = (a.lastModified || 0) - (b.lastModified || 0);
        break;
      default:
        r = a.name.localeCompare(b.name, "zh-CN");
    }
    return r * dir;
  });
});

function formatSize(bytes?: number): string {
  if (!bytes) return "-";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

function formatTime(ts?: number): string {
  if (!ts) return "-";
  return new Date(ts).toLocaleString();
}

/** 是否压缩文件（大图标模式下不参与 ?preview 预览） */
function isArchive(name: string): boolean {
  return kindOf(name) === "archive";
}

/** 直接可见文件类型（大图标可尝试 ?preview 渲染缩略图） */
function isPreviewable(name: string): boolean {
  const k = kindOf(name);
  // geo（GeoJSON）不参与缩略图：?preview=true 对它回的是「不支持预览」提示页
  // （HTML 字节喂给 <img> 必然解码失败），地图类文件也没有有意义的像素缩略图，
  // 走类型图标即可。mindmap（XMind 脑图）同理：后端无脑图提供者，
  // 且脑图是结构化文档，没有有意义的像素缩略图。
  // jxl（JPEG XL）同理：后端 ImageIO 不支持 JXL 编码，?preview=true
  // 生成不了缩略图，大图标模式会破图。
  return !["archive", "unknown", "geo", "mindmap", "jxl"].includes(k);
}

/** 根据扩展名返回 SVG 图标类名 */
function fileIconClass(name: string, isDir: boolean): string {
  if (isDir) return "icon-folder";
  switch (kindOf(name)) {
    case "image": return "icon-image";
    case "video": return "icon-video";
    case "audio": return "icon-audio";
    case "geo": return "icon-image";
    case "pdf": return "icon-pdf";
    case "office": return "icon-office";
    case "archive": return "icon-archive";
    case "design": return "icon-image";
    // 代码 / Markdown / CSV / 邮件 / 网页 / 数据 / 脑图等文本类文档统一使用文本色系图标
    case "text":
    case "code":
    case "markdown":
    case "csv":
    case "email":
    case "calendar":
    case "contact":
    case "notebook":
    case "webpage":
    case "data":
    case "mindmap":
      return "icon-text";
    default: return "icon-file";
  }
}

/**
 * 配置指纹（缩略图 URL 的缓存击穿标记）
 *
 * <p>由影响缩略图渲染的配置字段拼成：任一变化即产生新串，缩略图 URL 随之改变，
 * 浏览器重新回源、服务端按新配置重算——这是配置项「热更新」的关键。
 * 配置未加载时返回 "0"，保证 URL 形态稳定。</p>
 */
const configStamp = computed(() => {
  const c = bucketConfig.value;
  if (!c) {
    return "0";
  }
  return [c.imageFilter ?? "NONE", c.watermark ?? "", c.openWatermark ? "1" : "0"].join("|");
});

/**
 * 大图标缩略图 URL：所有可预览文件统一 ?preview=true（图片返回字节，其余转 HTML）
 *
 * <p>末尾拼 {@code &_cfg=} 配置版本戳：图片处理（滤镜等）是服务端按配置实时算的，
 * URL 不变时浏览器直接复用缓存里的旧图，管理员改完配置看不到效果。</p>
 *
 * @param name 对象名
 * @returns 缩略图 URL；archive/unknown 返回空串走图标兜底
 */
function objectThumbUrl(name: string): string {
  if (isArchive(name) || !isPreviewable(name)) return "";
  // 票据异步签发，未就绪时返回空串走占位图 —— 绝不用「无令牌的直链」先闪一下
  return thumbUrls.value[fullKey(name)] ?? "";
}

/**
 * 大图标模式缩略图直链表：对象 Key -> 票据直链。
 *
 * <p>票据是异步换来的，没法在模板里同步取，因此先批量签发再写进这张表；
 * 模板读到空串就走占位图。签发失败也留空 —— 私有桶取不到票据时表现为占位图，
 * 与修复前「图片加载失败」一致，但不会把访问令牌写进 URL。</p>
 */
const thumbUrls = ref<Record<string, string>>({});

/**
 * 缩略图字节缓存：键 → {@code blob:} 直链
 *
 * <p>{@code /ot/{token}} 的响应带 {@code Cache-Control: no-store}（票据直链，
 * 服务端刻意不让浏览器缓存），于是每次切视图、重进目录都要把这些字节再拉一遍。
 * 这里在内存里留一份 blob 直链，同一目录来回切时缩略图是「瞬间出现」的。</p>
 *
 * <p>键里带了 {@code lastModified}：文件被覆盖后 mtime 变，缓存自然失效。
 * 超过上限后只停止新增、<b>不</b> revoke 旧的 —— 正在显示的 {@code <img>}
 * 被 revoke 会立刻破图。</p>
 */
const thumbBlobCache = new Map<string, string>();
const THUMB_BLOB_CACHE_LIMIT = 400;

/** 缩略图缓存已占用的字节数 */
let thumbBlobCacheBytes = 0;

/** 缩略图缓存总字节上限：172px JPEG 单张约 5~10KB，32MB 足够装下几千张 */
const THUMB_BLOB_CACHE_BYTE_LIMIT = 32 * 1024 * 1024;

/** 当前这一轮签票的序号：目录/配置变化后旧的一轮结果必须丢弃 */
let thumbSeq = 0;

/** 缩略图取图并发上限：单条链路 6 个已经能吃满带宽，再多只是互相排队 */
const THUMB_DOWNLOAD_CONCURRENCY = 6;

/** 元信息探测并发上限：每张只要 4KB，比取图轻得多 */
const THUMB_PROBE_CONCURRENCY = 8;

/** 缩略图 URL 写回节流（毫秒）：避免每张图回来都整表重建一次 */
const THUMB_FLUSH_MS = 60;

/**
 * 为当前目录的大图标缩略图批量签发票据并取图
 *
 * <p>四条约束（都来自实测的加载失败/长时间空白）：</p>
 * <ol>
 *   <li><b>只在需要像素缩略图的视图取图</b>：只有大图标模式渲染 {@code <img>}，
 *       分栏/详细/中图标/小图标全是矢量图标，取了也没人用。</li>
 *   <li><b>只取图片</b>：{@code ?preview} 对 pdf/office 回的是服务端渲染页，
 *       既慢又不稳定；非图片一律用类型图标兜底。</li>
 *   <li><b>先并发探测、再定并发取图、逐张写回</b>：见 {@link runPool}。</li>
 *   <li><b>缩略图按目标像素取 + 能转 JPEG 就转</b>：见 {@link thumbUrlOf}。</li>
 * </ol>
 */
async function refreshThumbUrls(): Promise<void> {
  thumbSeq += 1;
  const seq = thumbSeq;
  // 非大图标模式：清空票据表，省掉全部签票
  if (viewMode.value !== "largeIcons") {
    thumbUrls.value = {};
    return;
  }
  const stamp = configStamp.value;
  const filterParams = imageFilterParams.value;
  const images = sortedObjects.value.filter((o) => !o.directory && kindOf(o.name) === "image");
  const next: Record<string, string> = {};
  let dirty = false;
  let flushTimer: number | null = null;

  /**
   * 把本轮已拿到的 URL 写回响应式表（节流合并，避免整表重建几十次）
   *
   * <p>写回必须是<b>合并</b>而不是替换：一轮开跑时 {@code next} 是空的，
   * 若直接 {@code thumbUrls.value = {...next}}，第一个 worker 回来就会把
   * 已经显示的另外几张缩略图一起抹成空白（实测采样到 {@code empty src=1}）。
   * 收敛交给本轮结束时的那次替换 {@link refreshThumbUrls}。</p>
   */
  const flush = (): void => {
    if (flushTimer !== null) {
      window.clearTimeout(flushTimer);
      flushTimer = null;
    }
    if (!dirty || seq !== thumbSeq) {
      return;
    }
    dirty = false;
    thumbUrls.value = { ...thumbUrls.value, ...next };
  };

  // 1) 元信息预热与取图<b>并行</b>跑：探测每张只要 4KB，但「等整目录探完再取图」
  //    会把首屏推后好几秒（50 张图 = 7 批 × 0.8s）。这里让取图的 worker 自己
  //    按需探测（缓存命中就是零成本），预热只是帮它们提前把元信息备好。
  const warmTask = runPool(images, THUMB_PROBE_CONCURRENCY, async (o) => {
    if (seq !== thumbSeq) {
      return;
    }
    await warmThumbMeta(o, stamp, filterParams);
  });

  // 2) 固定并发取图：谁先回来谁先亮，不等「一批里最慢的那张」
  await runPool(images, THUMB_DOWNLOAD_CONCURRENCY, async (o) => {
    if (seq !== thumbSeq) {
      return;
    }
    const url = await thumbUrlOf(o, stamp, filterParams);
    if (seq !== thumbSeq || !url) {
      return;
    }
    next[fullKey(o.name)] = url;
    dirty = true;
    if (flushTimer === null) {
      flushTimer = window.setTimeout(flush, THUMB_FLUSH_MS);
    }
  });
  await warmTask;
  // 本轮结束才做「替换式」收敛：清掉上一目录遗留的键，同时保证期间显示过的缩略图不被抹掉。
  //
  // 收尾不能直接用 `{...next}`：新一轮（切视图、刷新列表、改滤镜都会触发）的
  // next 是空的，只要这一轮里某张图失败（网络抖动、探测超时）拿不到 url，
  // 替换就会把**上一轮已经显示出来**的那张抹成空白 —— 实测采样到 `empty src=1`，
  // 也是大图标偶发「一张图闪白」的真因。
  // 正确口径：按当前图片清单收敛（清掉不在清单里的旧键），
  // 清单内某张这轮没拿到就沿用上一轮的值。
  if (seq === thumbSeq) {
    if (flushTimer !== null) {
      window.clearTimeout(flushTimer);
      flushTimer = null;
    }
    const prev = thumbUrls.value;
    const settled: Record<string, string> = {};
    for (const o of images) {
      const key = fullKey(o.name);
      const url = next[key] ?? prev[key];
      if (url) {
        settled[key] = url;
      }
    }
    thumbUrls.value = settled;
  }
}

/**
 * 预热一张图片的元信息（宽高 / 字节数 / 是否带 alpha）
 *
 * <p>命中缓存直接返回，不发请求 —— 大图标视图反复切换时探测只做一次。</p>
 *
 * @param obj          列表项
 * @param stamp        配置版本戳
 * @param filterParams 图片滤镜参数
 * @returns 元信息；探测失败返回 null
 */
async function warmThumbMeta(
  obj: StorageObject,
  stamp: string,
  filterParams: Record<string, string>,
): Promise<ImageMeta | null> {
  const key = fullKey(obj.name);
  const hit = peekImageMeta(key);
  if (hit) {
    return hit;
  }
  const base = await resolveObjectUrl(bucket.value, key, {
    params: { preview: "true", _cfg: stamp, ...filterParams },
  });
  if (!base) {
    return null;
  }
  return probeImageMeta(base, key).catch(() => null);
}

/**
 * 算出一张图片的缩略图直链
 *
 * <p><b>为什么不能直接用原图直链</b>：dev 下文件服务器的字节要经 Vite 代理从远端
 * 拉回来，实测下行 ~40KB/s。目录里随手一张 1024×1024 的 PNG 就是 2MB ——
 * 单张 50 秒起步，5 张图的大图标视图等于一直白屏。而卡片上只显示 86px。</p>
 *
 * <p>所以这里给直链追加服务端处理参数：{@code ?preview=true&size=WxH} 现场等比缩放，
 * {@code &format=jpeg&quality=72} 再把无损 PNG 换成 JPEG —— 172px 实测
 * PNG 74~83KB、JPEG 只要 6~10KB，字节数直接决定首屏。<b>带透明通道的图不能转</b>
 * （JPEG 无 alpha，后端会把透明像素写成黑色），判定见
 * {@link import("../utils/imageSource").canServeJpeg}。</p>
 *
 * @param obj          列表项（取 Key、mtime）
 * @param stamp        配置版本戳（滤镜/水印变了 URL 必须变）
 * @param filterParams 图片滤镜的路径参数
 * @returns 缩略图直链；签票失败返回空串
 */
async function thumbUrlOf(
  obj: StorageObject,
  stamp: string,
  filterParams: Record<string, string>,
): Promise<string> {
  const key = fullKey(obj.name);
  const cacheKey = [bucket.value, key, stamp, obj.lastModified ?? 0, JSON.stringify(filterParams)].join("|");
  const cached = thumbBlobCache.get(cacheKey);
  if (cached) {
    return cached;
  }
  // 图片地址带上当前滤镜的路径参数：服务端据此在返回字节前先处理一遍，
  // 缩略图因此是「滤镜后的图」，而不是浏览器把原图再 CSS 压一遍。
  const base = await resolveObjectUrl(bucket.value, key, {
    params: { preview: "true", _cfg: stamp, ...filterParams },
  });
  if (!base) {
    return "";
  }
  const info = peekImageMeta(key) ?? await probeImageMeta(base, key).catch(() => null);
  const url = thumbRequestUrl(base, key, info);
  // 抓成 blob 直链存内存：no-store 让浏览器没法缓存，切视图回来还得重下
  try {
    const res = await fetch(url);
    if (!res.ok) {
      return url;
    }
    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);
    // 超了上限就只停止新增，不 revoke 旧的 —— 正在显示的 <img> 被 revoke 会立刻破图
    if (
      thumbBlobCache.size < THUMB_BLOB_CACHE_LIMIT &&
      thumbBlobCacheBytes + blob.size <= THUMB_BLOB_CACHE_BYTE_LIMIT
    ) {
      thumbBlobCache.set(cacheKey, blobUrl);
      thumbBlobCacheBytes += blob.size;
    }
    return blobUrl;
  } catch {
    // 取字节失败就用直链本身，交给 <img> 自己重试
    return url;
  }
}

/**
 * 给缩略图直链补上「等比缩放 + JPEG」参数
 *
 * @param base 已签名的直链（含 {@code ?preview=true}）
 * @param key  对象 Key
 * @param info 元信息（可能为 null）
 * @returns 可直接放进 {@code <img src>} 的直链
 */
function thumbRequestUrl(base: string, key: string, info: ImageMeta | null): string {
  if (!info) {
    // 探测失败（少见格式/头解析不了）：退回原链，宁可慢也不破图
    return base;
  }
  const params = buildScaleParams(key, info, THUMB_EDGE, THUMB_JPEG_QUALITY);
  if (!params.size) {
    // 小图 / 原图本来就比目标小：直接用原始字节
    return base;
  }
  return withQuery(base, params);
}

/** 排序点击切换 */
function toggleSort(key: "name" | "size" | "lastModified"): void {
  if (sortKey.value === key) {
    sortOrder.value = sortOrder.value === "asc" ? "desc" : "asc";
  } else {
    sortKey.value = key;
    sortOrder.value = "asc";
  }
  // 排序变化后页内顺序变了，回到第一页展示
  page.value = 1;
}

/** 排序指示箭头 */
function sortArrow(key: "name" | "size" | "lastModified"): string {
  if (sortKey.value !== key) return "";
  return sortOrder.value === "asc" ? "↑" : "↓";
}

function fullKey(name: string): string {
  return currentPath.value ? `${currentPath.value}/${name}` : name;
}

/* ================== 多选 & 状态栏 ================== */

/** 是否选中 */
function isSelected(name: string): boolean {
  return selected.value.has(name);
}

/** 点击行：支持 Ctrl/Shift 多选 */
function onRowClick(e: MouseEvent, item: StorageObject, index: number): void {
  if (e.ctrlKey || e.metaKey) {
    toggleSelect(item.name);
    lastSelectedIndex = index;
    return;
  }
  if (e.shiftKey && lastSelectedIndex >= 0) {
    // 连续多选（保留原选择）
    const from = Math.min(lastSelectedIndex, index);
    const to = Math.max(lastSelectedIndex, index);
    const next = new Set(selected.value);
    for (let i = from; i <= to; i++) {
      const it = sortedObjects.value[i];
      if (it) next.add(it.name);
    }
    selected.value = next;
    return;
  }
  // 单选：仅保留当前
  selected.value = new Set([item.name]);
  lastSelectedIndex = index;
}

/** 切换选中 */
function toggleSelect(name: string): void {
  const next = new Set(selected.value);
  if (next.has(name)) next.delete(name);
  else next.add(name);
  selected.value = next;
}

/** 清空选中 */
function clearSelect(): void {
  selected.value = new Set();
}

/** 选中文件数 */
const selectedCount = computed(() => selected.value.size);
/** 选中文件总大小 */
const selectedSize = computed(() => {
  let sum = 0;
  for (const obj of objects.value) {
    if (selected.value.has(obj.name) && !obj.directory) sum += obj.size || 0;
  }
  return sum;
});
/** 当前选中的对象实体（按选中名从当前目录对象列表解析） */
const selectedObjects = computed<StorageObject[]>(() =>
  objects.value.filter((obj) => selected.value.has(obj.name)),
);
/** 是否可解压：恰好选中一个非目录的压缩包（与右键菜单的解压显隐条件保持一致） */
const canUnzip = computed(() => {
  if (selected.value.size !== 1) {
    return false;
  }
  const target = selectedObjects.value[0];
  return !!target && !target.directory && isArchive(target.name);
});

/* ================== 左侧导航（目录树 + 快捷访问）/ 回收站 ================== */

/** 左侧导航视图：all=文件浏览 / recycle=回收站 */
type NavKey = "all" | "recycle";
const nav = ref<NavKey>("all");

/** 回收站目录（桶内隐藏目录，常规列表不展示） */
const RECYCLE_DIR = ".recycle";
/** localStorage：界面状态键前缀，后面拼桶名——按桶分别记忆 */
const UI_STATE_PREFIX = "filestorage.ui.";
/** 合法的视图模式白名单（用于校验持久化值，防止旧版本遗留的非法值） */
const VIEW_MODES: ViewMode[] = ["columns", "details", "largeIcons", "mediumIcons", "smallIcons"];
/** 合法的排序字段白名单 */
const SORT_KEYS: SortKey[] = ["name", "size", "lastModified"];
/** 合法的排序方向 */
const SORT_ORDERS: SortOrder[] = ["asc", "desc"];

/** 单个桶的界面状态 */
interface BucketUiState {
  /** 视图模式 */
  viewMode?: ViewMode;
  /** 所在目录 */
  currentPath?: string;
  /** 排序字段 */
  sortKey?: SortKey;
  /** 排序方向 */
  sortOrder?: SortOrder;
}

/**
 * 取某个桶的界面状态存储键
 *
 * @param bucketName 桶名
 * @return localStorage 键
 */
function uiStateKey(bucketName: string): string {
  return `${UI_STATE_PREFIX}${bucketName || "default"}`;
}

/**
 * 读取某个桶的界面状态
 *
 * @param bucketName 桶名
 * @return 界面状态；未记录过或数据损坏时返回空对象
 */
function readUiState(bucketName: string): BucketUiState {
  try {
    const raw = localStorage.getItem(uiStateKey(bucketName));
    return raw ? (JSON.parse(raw) as BucketUiState) : {};
  } catch {
    return {};
  }
}

/**
 * 把当前界面状态写入某个桶
 *
 * @param bucketName 桶名
 */
function writeUiState(bucketName: string): void {
  try {
    localStorage.setItem(uiStateKey(bucketName), JSON.stringify({
      viewMode: viewMode.value,
      currentPath: currentPath.value,
      sortKey: sortKey.value,
      sortOrder: sortOrder.value,
    } satisfies BucketUiState));
  } catch { /* ignore */ }
}

/**
 * 把某个桶记录的界面状态套用到当前页面
 *
 * <p>逐项按白名单校验后回落默认值，而不是整体信任持久化数据：
 * 字段类型/取值对不上时不能把页面带进一个非法状态（旧版本遗留、被人手改过的
 * localStorage 都会出现这种情况）。</p>
 *
 * @param bucketName 桶名
 */
function applyUiState(bucketName: string): void {
  const saved = readUiState(bucketName);
  // 视图模式：白名单校验后恢复上次选择（默认分栏），不整体信任持久化数据
  viewMode.value = VIEW_MODES.includes(saved.viewMode as ViewMode) ? (saved.viewMode as ViewMode) : "columns";
  currentPath.value = typeof saved.currentPath === "string" ? saved.currentPath : "";
  sortKey.value = SORT_KEYS.includes(saved.sortKey as SortKey) ? (saved.sortKey as SortKey) : "name";
  sortOrder.value = SORT_ORDERS.includes(saved.sortOrder as SortOrder) ? (saved.sortOrder as SortOrder) : "asc";
}

/**
 * 左侧「快捷访问」数据：存储桶根目录内容。
 *
 * <p>按需求，侧栏快捷访问改为展示根目录（path=""）的文件与目录，
 * 不再展示收藏 / 最近访问。根目录内容与当前浏览目录无关，
 * 凡影响根目录的变更（上传 / 删除 / 还原 / 新建）都会经过
 * {@link loadObjects} 汇总，因此在该函数的成功分支负责刷新。</p>
 */
const rootObjects = ref<StorageObject[]>([]);
/** 根目录对象是否因超出快捷访问展示上限被截断 */
const rootTruncated = ref(false);

/**
 * 加载存储桶根目录内容（供左侧「快捷访问」渲染）
 *
 * <p>失败时不打断主流程：左侧区块保留上次内容（首次加载失败显示空态）。</p>
 */
async function loadRootObjects(): Promise<void> {
  try {
    // 只取前 ROOT_LIMIT 项：快捷访问是辅助入口，根目录超大时无需整份渲染，
    // 也避免瓦片图等大目录的逐文件 stat 拖慢侧栏。
    const paged = await listObjectsPaged(bucket.value, "", { limit: ROOT_LIMIT, offset: 0 });
    const display = paged.items.filter((o) => o.name !== RECYCLE_DIR);
    rootTruncated.value = paged.total > ROOT_LIMIT;
    rootObjects.value = display.slice(0, ROOT_LIMIT);
  } catch {
    rootObjects.value = [];
    rootTruncated.value = false;
  }
}

/** 回收站条目 */
const recycleItems = ref<StorageObject[]>([]);
/** 回收站加载中 */
const recycleLoading = ref(false);
/** 回收站数量（导航徽标） */
const recycleCount = computed(() => recycleItems.value.length);

/** 是否为今天（用于回收站分组「今天 / 更早」） */
function isToday(ts?: number): boolean {
  if (!ts || ts <= 0) return false;
  const d = new Date(ts);
  const now = new Date();
  return d.getFullYear() === now.getFullYear()
    && d.getMonth() === now.getMonth()
    && d.getDate() === now.getDate();
}

/** 回收站按删除时间分组：今天 / 更早（组内按时间倒序） */
const groupedRecycle = computed(() => {
  const today: StorageObject[] = [];
  const earlier: StorageObject[] = [];
  for (const it of recycleItems.value) {
    (isToday(it.lastModified) ? today : earlier).push(it);
  }
  const sortDesc = (arr: StorageObject[]) => arr.sort((a, b) => (b.lastModified ?? 0) - (a.lastModified ?? 0));
  const groups: Array<{ key: string; label: string; items: StorageObject[] }> = [];
  if (today.length) groups.push({ key: "today", label: "今天", items: sortDesc(today) });
  if (earlier.length) groups.push({ key: "earlier", label: "更早", items: sortDesc(earlier) });
  return groups;
});

/** 加载回收站列表（不存在时按空处理） */
async function loadRecycle(): Promise<void> {
  recycleLoading.value = true;
  try {
    recycleItems.value = await listObjects(bucket.value, RECYCLE_DIR);
  } catch {
    recycleItems.value = [];
  } finally {
    recycleLoading.value = false;
  }
}

/** 确保回收站目录存在（已存在时忽略） */
async function ensureRecycleDir(): Promise<void> {
  try {
    await createDirectory(bucket.value, "", RECYCLE_DIR);
  } catch { /* 已存在忽略 */ }
}

/**
 * 将对象移入回收站（删除语义：先入回收站，可还原/彻底删除）
 *
 * @param targets 待删除对象
 */
async function moveToRecycle(targets: StorageObject[]): Promise<void> {
  if (!targets.length) return;
  await ensureRecycleDir();
  await moveObjects(bucket.value, targets.map((t) => fullKey(t.name)), RECYCLE_DIR);
}

/** 从回收站还原对象 */
async function restoreRecycleItem(item: StorageObject): Promise<void> {
  actionRunning.value = true;
  try {
    await moveObjects(bucket.value, [`${RECYCLE_DIR}/${item.name}`], "");
    message.success(`已还原「${item.name}」`);
    await Promise.all([loadRecycle(), loadObjects()]);
  } catch (e) {
    message.error((e as Error)?.message ?? "还原失败");
  } finally {
    actionRunning.value = false;
  }
}

/** 彻底删除回收站对象 */
async function purgeRecycleItem(item: StorageObject): Promise<void> {
  try {
    await ElMessageBox.confirm(`彻底删除「${item.name}」？该操作不可恢复`, "彻底删除", { type: "warning" });
  } catch { return; }
  actionRunning.value = true;
  try {
    await deleteObject(bucket.value, `${RECYCLE_DIR}/${item.name}`);
    message.success("已彻底删除");
    await loadRecycle();
  } catch (e) {
    message.error((e as Error)?.message ?? "删除失败");
  } finally {
    actionRunning.value = false;
  }
}

/** 清空回收站 */
async function emptyRecycle(): Promise<void> {
  if (!recycleItems.value.length) {
    message.warning("回收站为空");
    return;
  }
  try {
    await ElMessageBox.confirm("清空回收站？所有对象将被彻底删除", "清空回收站", { type: "warning" });
  } catch { return; }
  actionRunning.value = true;
  try {
    await deleteObject(bucket.value, RECYCLE_DIR);
    message.success("回收站已清空");
    await loadRecycle();
  } catch (e) {
    message.error((e as Error)?.message ?? "清空失败");
  } finally {
    actionRunning.value = false;
  }
}

/**
 * 切换左侧导航视图
 *
 * @param key 视图 key
 */
function switchNav(key: NavKey): void {
  // 已在回收站时再点「回收站」= 退出回收站（回到文件列表根目录）
  if (key === "recycle" && nav.value === "recycle") {
    key = "all";
  }
  nav.value = key;
  clearSelect();
  if (key === "all") {
    // 回到"根目录"：回桶根，页码回到第一页
    currentPath.value = "";
    recordHistory("");
    page.value = 1;
    void loadObjects();
  }
  if (key === "recycle") void loadRecycle();
}

/** 视图模式切换（状态栏「查看方式」按钮） */
function setView(mode: ViewMode): void {
  viewMode.value = mode;
}

/**
 * 卡片第二行元信息
 *
 * @param item 对象
 * @return 元信息文案
 */
function cardMeta(item: StorageObject): string {
  const time = item.lastModified ? new Date(item.lastModified).toLocaleString() : "";
  if (item.directory) return time ? `文件夹 · ${time}` : "文件夹";
  return [formatSize(item.size), time].filter(Boolean).join(" · ");
}

/* ================== 目录导航 ================== */

async function loadObjects(): Promise<void> {
  const seq = ++loadSeq;
  activeLoadSeq = seq;
  // 延迟显示：300ms 内完成不闪 v-loading；超过才显示导航 spinner
  if (loadShowTimer !== undefined) {
    window.clearTimeout(loadShowTimer);
    loadShowTimer = undefined;
  }
  loadShowTimer = window.setTimeout(() => {
    if (activeLoadSeq === seq) {
      loading.value = true;
      navLoading.value = true;
    }
    loadShowTimer = undefined;
  }, 300);
  try {
    // 过滤开启 → 整目录扫描（一次拉 FILTER_SCAN_LIMIT 条，本地筛）；
    // 过滤关闭 → 服务端分页，objects 只保留当前页 200 条，避免瓦片图目录一次性拉全量
    //（列表 stat + 缩略图票据都只发生在当前页上）
    const scan = filterActive.value;
    scanMode.value = scan;
    const paged = await listObjectsPaged(bucket.value, currentPath.value, {
      limit: scan ? FILTER_SCAN_LIMIT : PAGE_SIZE,
      offset: scan ? 0 : (page.value - 1) * PAGE_SIZE,
    });
    // 旧请求（目录已切走）：直接丢弃，不碰列表、不报错
    if (activeLoadSeq !== seq) return;
    // 如果当前页已经越界（删除后总条数变少），跳到最后一页重载一次
    if (paged.items.length === 0 && paged.total > 0 && page.value > 1) {
      page.value = Math.ceil(paged.total / PAGE_SIZE);
      return loadObjects();
    }
    // 回收站为桶内隐藏目录，常规列表不展示
    objects.value = paged.items.filter((o) => o.name !== RECYCLE_DIR);
    listTotal.value = paged.total;
    // 同步分栏缓存（当前列）
    colObjects.value = { ...colObjects.value, [currentPath.value]: objects.value };
    colTotals.value = { ...colTotals.value, [currentPath.value]: listTotal.value };
    // 左侧「快捷访问」展示的是根目录内容：当前就在根目录时直接复用本次结果，
    // 否则并行刷新根目录（上传/删除/还原/新建/切换桶等变更都经由此处汇总更新）
    if (currentPath.value) {
      void loadRootObjects();
    } else {
      rootTruncated.value = listTotal.value > ROOT_LIMIT;
      rootObjects.value = objects.value.slice(0, ROOT_LIMIT);
    }
    setDefaultBucket(bucket.value);
    loadError.value = "";
  } catch (e) {
    // ---- 桶名自愈：服务端没有这个桶，且桶名来自 localStorage 覆盖 ----
    //
    // 为什么需要这一步：文件服务器按「注册的存储名」路由，桶名写错就是 404/410。
    // 而桶名优先级是 localStorage ＞ app.yaml，且 setDefaultBucket 只在**加载成功**
    // 时写回 —— 于是「桶名错 → 列表失败 → 不写回 → 下次还是错」形成死锁，
    // 用户只能手工清 localStorage，页面则永远只显示「列表查询失败：Not Found」。
    // 实测：改过 app.yaml 的 bucket 后，浏览器里的旧值会让 /#/files 整个空白。
    //
    // 这里只对「桶名不存在」这一类可自愈故障回落：清掉失效覆盖、回落到 app.yaml
    // 的桶名重试一次。网络故障、鉴权失败等不可自愈的错误仍按原样报错。
    if (isBucketMissingError(e) && hasBucketOverride()) {
      const stale = bucket.value;
      const fallback = getAppDefaultBucket();
      if (fallback && fallback !== stale) {
        clearBucketOverride();
        bucket.value = fallback;
        loading.value = false;
        navLoading.value = false;
        message.warning(
          `浏览器里残留的存储桶「${stale}」在文件服务器上不存在，已自动切换到配置里的桶「${fallback}」。` +
            `如需固定使用其他桶，请在「服务器设置」里改。`,
        );
        return loadObjects();
      }
    }
    // 旧请求的失败同样丢弃（目录已切走时不报错、不清列表）
    if (activeLoadSeq !== seq) return;
    message.error((e as Error)?.message ?? "加载失败");
    objects.value = [];
    // 分栏渲染的是 colObjects 这份「每列一份」的缓存：成功分支会写它，失败分支不写的话
    // colObjects[currentPath] 会一直是 undefined，列头就永远停在「加载中…」——
    // 而此时 loading 已为 false、状态栏已显示 0 项，两处状态自相矛盾。
    // 这里与 ensureColumn 的失败分支保持同一口径：写空数组 + 错误文案。
    colObjects.value = { ...colObjects.value, [currentPath.value]: [] };
    colTotals.value = { ...colTotals.value, [currentPath.value]: 0 };
    colError.value = { ...colError.value, [currentPath.value]: (e as Error)?.message ?? "目录加载失败" };
    loadError.value = (e as Error)?.message ?? "目录加载失败";
    // 当前位置已失效：回落到根目录。这一步同时修掉「按桶记忆」的持久化残留——
    // 不回落的话，写进 localStorage 的 currentPath 仍是那个不存在的目录，
    // 每次刷新都会重新落进同一个 404 里，而 watch 会把回落后的值同步写回，
    // 于是坏记忆自动被覆盖成根目录。
    if (currentPath.value) {
      currentPath.value = "";
      recordHistory("");
    }
  } finally {
    if (activeLoadSeq === seq) {
      if (loadShowTimer !== undefined) {
        window.clearTimeout(loadShowTimer);
        loadShowTimer = undefined;
      }
      loading.value = false;
      navLoading.value = false;
    }
  }
}

/** 非分栏视图翻页：回源请求当前页（防连点，成功后回到列表顶部） */
async function onPageChange(next: number): Promise<void> {
  if (pageBusy.value || next === page.value || next < 1) return;
  pageBusy.value = true;
  page.value = next;
  clearSelect();
  lastSelectedIndex = -1;
  try {
    await loadObjects();
  } finally {
    pageBusy.value = false;
  }
  document.querySelector(".fs-main")?.scrollTo?.({ top: 0 });
}

/**
 * 记录一次目录跳转。
 *
 * <p>历史只在这里维护，**不再由 {@link loadObjects} 顺带入栈**：加载数据与记录导航是两件事，
 * 混在一起有两个问题——入栈发生在 {@code await} 之后，刚进子目录那一刻后退仍不可用；
 * 且同一目录被重复加载时会塞进重复记录，导致"后退"点了没反应。</p>
 *
 * @param path 目标目录路径，空串表示根目录
 */
function recordHistory(path: string): void {
  const target = path || "";
  if (historyIndex.value >= 0 && historyStack.value[historyIndex.value] === target) {
    // 同一目录重复加载不产生新记录
    return;
  }
  historyStack.value = historyStack.value.slice(0, historyIndex.value + 1);
  historyStack.value.push(target);
  historyIndex.value = historyStack.value.length - 1;
}

/** 按当前历史位置应用路径并加载（不记录历史） */
function applyHistory(): void {
  currentPath.value = historyStack.value[historyIndex.value] || "";
  clearSelect();
  lastSelectedIndex = -1;
  page.value = 1;
  void loadObjects();
}

/** 历史后退 */
function goBack(): void {
  if (historyIndex.value <= 0) return;
  historyIndex.value--;
  applyHistory();
}

/** 历史前进 */
function goForward(): void {
  if (historyIndex.value >= historyStack.value.length - 1) return;
  historyIndex.value++;
  applyHistory();
}

/** 历史是否可后退 */
const canGoBack = computed(() => historyIndex.value > 0);
/** 历史是否可前进 */
const canGoForward = computed(() => historyIndex.value < historyStack.value.length - 1);

/** 下载选中文件：单文件直链，含目录或多选时打包 ZIP */
function downloadSelected(): void {
  if (selectedCount.value === 0) return;
  void smartDownload(selectedKeys());
}

/** 删除选中对象（含目录） */
async function deleteSelected(): Promise<void> {
  if (selectedCount.value === 0) return;
  const targets = objects.value.filter((o) => selected.value.has(o.name));
  try {
    await ElMessageBox.confirm(`确认将选中的 ${targets.length} 个对象移入回收站？`, "移入回收站", { type: "warning" });
  } catch { return; }
  try {
    await moveToRecycle(targets);
    message.success(`已移入回收站 ${targets.length} 个对象`);
    clearSelect();
    await Promise.all([loadObjects(), loadRecycle()]);
  } catch (e) { message.error((e as Error)?.message ?? "删除失败"); }
}

/* ============== 分发到服务器（URL 参数开启，数据经 postMessage 交宿主） ============== */

/**
 * 读取启用标记：优先 location.search，其次 hash 查询串（如 #/files?distribute=1）
 *
 * @param name 参数名
 * @return 参数值（不存在为空串）
 */
function urlFlag(name: string): string {
  const fromSearch = new URLSearchParams(window.location.search).get(name);
  if (fromSearch != null) return fromSearch;
  const hash = window.location.hash || "";
  const qIndex = hash.indexOf("?");
  if (qIndex >= 0) {
    return new URLSearchParams(hash.slice(qIndex + 1)).get(name) ?? "";
  }
  return "";
}

/** 是否开启「分发到服务器」（默认关闭，需地址栏 distribute=1/true/on/yes） */
const DISTRIBUTE_ENABLED = ["1", "true", "on", "yes"].includes(urlFlag("distribute").toLowerCase());

/** 当前可分发对象：恰好选中一个非目录文件 */
const distributableTarget = computed<StorageObject | null>(() => {
  if (selectedCount.value !== 1) return null;
  const t = objects.value.find((o) => selected.value.has(o.name)) ?? null;
  return t && !t.directory ? t : null;
});

/**
 * 触发分发：把所选文件信息经 postMessage 交给宿主页面处理
 *
 * <p>文件资产可能作为独立存储页嵌入宿主（iframe）运行，本页不直接调用业务后端；
 * 由宿主负责选择服务器并调用分发接口。仅当 URL 带 distribute 参数时该入口才出现，
 * 数据通过 postMessage 传递（bucket/key/name/size/lastModified）。</p>
 *
 * @param target 指定文件（右键菜单传入）；缺省取当前选中的唯一文件
 */
function openDistribute(target?: StorageObject | null): void {
  const file = target ?? distributableTarget.value;
  if (!file || file.directory) {
    message.warning("请选择一个文件进行分发");
    return;
  }
  const payload = {
    source: "file-storage",
    type: "distribute",
    bucket: bucket.value,
    key: fullKey(file.name),
    name: file.name,
    size: file.size,
    lastModified: file.lastModified,
  };
  const host = window.parent && window.parent !== window ? window.parent : window.opener;
  if (host) {
    host.postMessage(payload, "*");
    message.success(`已发送分发请求：${file.name}`);
  } else {
    message.warning("当前页面未嵌入宿主，无法分发");
  }
}

/* ============== 新建/重命名/复制/剪切/粘贴/压缩/解压（KodExplorer） ============== */

/** 内部拖拽移动的 DataTransfer 自定义类型 */
const DRAG_MIME = "application/x-fs-keys";

/** 剪贴板：复制/剪切暂存的源对象键（跨目录粘贴） */
const clipboard = ref<{ mode: "copy" | "move"; keys: string[] } | null>(null);

/** 文件管理动作执行中（按钮禁用） */
const actionRunning = ref(false);

/** 拖拽悬停的目标目录键（高亮用） */
const dragOverDir = ref("");

/** 当前选中对象的完整键列表（普通视图取当前目录；分栏视图中祖先列选中项也纳入） */
function selectedKeys(): string[] {
  const out: string[] = [];
  const push = (key: string): void => {
    if (!out.includes(key)) out.push(key);
  };
  for (const o of objects.value) {
    if (selected.value.has(o.name)) push(fullKey(o.name));
  }
  if (out.length) return out;
  for (const [path, list] of Object.entries(colObjects.value)) {
    for (const o of list) {
      if (selected.value.has(o.name)) push(joinKey(path, o.name));
    }
  }
  return out;
}

/** 名称输入弹窗（取消返回 null） */
async function promptInput(title: string, initial = ""): Promise<string | null> {
  try {
    const { value } = await ElMessageBox.prompt(title, "操作", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      inputValue: initial,
    });
    const v = (value ?? "").trim();
    return v || null;
  } catch {
    return null;
  }
}

/** 动作完成后统一刷新列表、分栏与回收站 */
async function refreshAfterAction(): Promise<void> {
  clearSelect();
  await Promise.all([loadObjects(), loadRecycle()]);
  refreshColumns();
}

/** 新建文件夹（支持多级目录：输入 a/b/c 会逐级创建）。path 为空时创建在当前目录 */
async function onCreateDir(path?: string | null): Promise<void> {
  const input = await promptInput("请输入新文件夹名称（支持多级，如 a/b/c）");
  if (!input) return;
  actionRunning.value = true;
  try {
    // 逐级创建：一级不存在就建一级，保证 a/b/c 也能创建成功
    const segs = input.split("/").map((s) => s.trim()).filter(Boolean);
    if (segs.length === 0) return;
    let base = path ?? currentPath.value;
    for (const seg of segs) {
      await createDirectory(bucket.value, base, seg);
      base = base ? `${base}/${seg}` : seg;
    }
    message.success(`文件夹「${input}」已创建`);
    await refreshAfterAction();
  } catch (e) {
    message.error((e as Error)?.message ?? "新建文件夹失败");
  } finally {
    actionRunning.value = false;
  }
}

/** 新建空文件 */
async function onCreateFile(path?: string | null): Promise<void> {
  const name = await promptInput("请输入新文件名称");
  if (!name) return;
  actionRunning.value = true;
  try {
    await createFile(bucket.value, path ?? currentPath.value, name);
    message.success(`文件「${name}」已创建`);
    await refreshAfterAction();
  } catch (e) {
    message.error((e as Error)?.message ?? "新建文件失败");
  } finally {
    actionRunning.value = false;
  }
}

/** 新建模板文件（text/docx/xlsx，带默认文件名与扩展名）。path 为空时创建在当前目录 */
async function onCreateTemplateFile(kind: "text" | "docx" | "xlsx", path?: string | null): Promise<void> {
  const def = kind === "text" ? "未命名.txt" : kind === "docx" ? "未命名.docx" : "未命名.xlsx";
  const name = await promptInput("请输入新文件名称", def);
  if (!name) return;
  actionRunning.value = true;
  try {
    await createFile(bucket.value, path ?? currentPath.value, name);
    message.success(`文件「${name}」已创建`);
    await refreshAfterAction();
  } catch (e) {
    message.error((e as Error)?.message ?? "新建文件失败");
  } finally {
    actionRunning.value = false;
  }
}

/** 取当前可操作的单个对象（右键目标优先，否则取唯一选中项） */
function singleTarget(row?: StorageObject | null): StorageObject | null {
  if (row) return row;
  const keys = selectedKeys();
  if (keys.length === 1) {
    const name = keys[0].slice(keys[0].lastIndexOf("/") + 1);
    return objects.value.find((o) => o.name === name)
      ?? selectedColumnObject(name);
  }
  return null;
}

/** 分栏视图内按名称查找选中的对象（当前目录没有时，祖先列也可能有选中项） */
function selectedColumnObject(name: string): StorageObject | null {
  for (const path of segmentPaths.value) {
    const hit = colObjects.value[path]?.find((o) => o.name === name);
    if (hit) return hit;
  }
  return null;
}

/** 行内重命名：当前编辑名称 / 草稿 / 目标对象 */
const renaming = ref<string | null>(null);
const renameDraft = ref("");
let renameTarget: StorageObject | null = null;

/** 启动行内重命名（右键「重命名」和 F2 共用） */
async function startInlineRename(row?: StorageObject | null): Promise<void> {
  const target = singleTarget(row);
  if (!target) {
    message.warning("请选择一个对象进行重命名");
    return;
  }
  if (actionRunning.value) {
    message.warning("请等待当前操作完成");
    return;
  }
  selected.value = new Set([target.name]);
  lastSelectedIndex = -1;
  renameTarget = target;
  renameDraft.value = target.name;
  renaming.value = target.name;
  await nextTick();
}

/** 提交行内重命名（Enter 或失焦触发，同一编辑只执行一次） */
async function commitInlineRename(): Promise<void> {
  const target = renameTarget;
  const current = renaming.value;
  const draft = renameDraft.value.trim();
  renaming.value = null;
  renameTarget = null;
  if (!target || !current || !draft || draft === target.name) return;
  actionRunning.value = true;
  try {
    await renameObject(bucket.value, currentPath.value, target.name, draft);
    message.success("重命名成功");
    await refreshAfterAction();
  } catch (e) {
    message.error((e as Error)?.message ?? "重命名失败");
  } finally {
    actionRunning.value = false;
  }
}

/** 取消行内重命名（Esc） */
function cancelInlineRename(): void {
  renaming.value = null;
  renameTarget = null;
}

/** 属性弹窗内容 */
const propsVisible = ref(false);
const propsTarget = ref<StorageObject | null>(null);
const propsLoading = ref(false);

/** 打开对象属性：列表字段 + 服务端 ?config 活动配置 */
function openProperties(row?: StorageObject | null): void {
  const target = singleTarget(row);
  if (!target) {
    message.warning("请选择一个对象查看属性");
    return;
  }
  propsTarget.value = target;
  propsVisible.value = true;
  propsLoading.value = true;
  loadBucketConfig().finally(() => {
    propsLoading.value = false;
  });
}

/** 重命名单个对象（对话框版，右键菜单「重命名（对话框）…」） */
async function onRename(row?: StorageObject | null): Promise<void> {
  const target = singleTarget(row);
  if (!target) {
    message.warning("请选择一个对象进行重命名");
    return;
  }
  const newName = await promptInput(`将「${target.name}」重命名为`, target.name);
  if (!newName || newName === target.name) return;
  actionRunning.value = true;
  try {
    await renameObject(bucket.value, currentPath.value, target.name, newName);
    message.success("重命名成功");
    await refreshAfterAction();
  } catch (e) {
    message.error((e as Error)?.message ?? "重命名失败");
  } finally {
    actionRunning.value = false;
  }
}

/** 复制选中对象到剪贴板 */
function onCopySelected(): void {
  const keys = selectedKeys();
  if (!keys.length) {
    message.warning("请先选择对象");
    return;
  }
  clipboard.value = { mode: "copy", keys };
  message.success(`已复制 ${keys.length} 项，进入目标目录后粘贴`);
}

/** 剪切选中对象到剪贴板 */
function onCutSelected(): void {
  const keys = selectedKeys();
  if (!keys.length) {
    message.warning("请先选择对象");
    return;
  }
  clipboard.value = { mode: "move", keys };
  message.success(`已剪切 ${keys.length} 项，进入目标目录后粘贴`);
}

/** 粘贴剪贴板对象到指定目录（缺省为当前目录） */
async function onPaste(targetDir?: string): Promise<void> {
  const board = clipboard.value;
  if (!board || !board.keys.length) {
    message.warning("剪贴板为空");
    return;
  }
  const dir = targetDir ?? currentPath.value;
  actionRunning.value = true;
  try {
    if (board.mode === "copy") {
      await copyObjects(bucket.value, board.keys, dir);
      message.success("粘贴成功");
    } else {
      await moveObjects(bucket.value, board.keys, dir);
      message.success("移动成功");
      clipboard.value = null;
    }
    await refreshAfterAction();
  } catch (e) {
    message.error((e as Error)?.message ?? "粘贴失败");
  } finally {
    actionRunning.value = false;
  }
}

/** 触发浏览器保存 Blob */
function saveBlob(blob: Blob, name: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 4000);
}

/** 智能下载：单文件走直链；多个对象或含目录时服务端打包 ZIP */
async function smartDownload(keys: string[]): Promise<void> {
  // 下载的统一入口：门禁放这里，所有调用方（右键下载、批量打包、工具栏）都覆盖到
  if (!guardDownload()) {
    return;
  }
  if (!keys.length) {
    message.warning("请先选择对象");
    return;
  }
  if (keys.length === 1) {
    const only = keys[0];
    const onlyObj = objects.value.find((o) => fullKey(o.name) === only);
    if (onlyObj && !onlyObj.directory) {
      const url = await resolveObjectUrl(bucket.value, only, {
        params: { download: "true" },
      });
      triggerDirectDownload(url, onlyObj.name);
      return;
    }
  }
  actionRunning.value = true;
  try {
    const blob = await downloadZip(bucket.value, keys);
    saveBlob(blob, zipArchiveName(keys));
  } catch (e) {
    message.error((e as Error)?.message ?? "打包下载失败");
  } finally {
    actionRunning.value = false;
  }
}

/** 压缩打包选中对象并下载 */
async function onZipSelected(): Promise<void> {
  await smartDownload(selectedKeys());
}

/** 解压压缩包（右键单个压缩文件） */
async function onUnzip(row?: StorageObject | null): Promise<void> {
  const target = singleTarget(row);
  if (!target || !isArchive(target.name)) {
    message.warning("请选择一个压缩包");
    return;
  }
  actionRunning.value = true;
  try {
    const res = await unzipObject(bucket.value, currentPath.value, target.name, currentPath.value);
    message.success(`解压完成，共 ${(res.entries as number) ?? 0} 项`);
    await refreshAfterAction();
  } catch (e) {
    message.error((e as Error)?.message ?? "解压失败");
  } finally {
    actionRunning.value = false;
  }
}

/* ================== 内部拖拽（移动/复制到目录） ================== */

/** 行开始拖拽：写入内部自定义类型，携带选中键 */
function onRowDragStart(e: DragEvent, item: StorageObject): void {
  if (!e.dataTransfer) return;
  if (!selected.value.has(item.name)) {
    selected.value = new Set([item.name]);
  }
  const keys = selectedKeys();
  e.dataTransfer.setData(DRAG_MIME, "1");
  e.dataTransfer.setData("text/plain", JSON.stringify(keys));
  e.dataTransfer.effectAllowed = "copyMove";
}

/** 目录行拖拽悬停：目标为目录时允许放置（内部移动/复制，或外部文件拖入） */
function onRowDragOver(e: DragEvent, item: StorageObject): void {
  if (!e.dataTransfer || !item.directory) return;
  if (e.dataTransfer.types.includes("Files")) {
    // 外部文件拖入目录：允许放置，显示复制光标
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    dragOverDir.value = fullKey(item.name);
    return;
  }
  if (!e.dataTransfer.types.includes(DRAG_MIME)) return;
  e.preventDefault();
  e.dataTransfer.dropEffect = e.ctrlKey ? "copy" : "move";
  dragOverDir.value = fullKey(item.name);
}

/** 离开目录行取消高亮 */
function onRowDragLeave(item: StorageObject): void {
  if (dragOverDir.value === fullKey(item.name)) {
    dragOverDir.value = "";
  }
}

/** 将一组键移动/复制到目标目录（Ctrl 为复制） */
async function dropKeysTo(targetDir: string, e?: DragEvent): Promise<void> {
  if (actionRunning.value) return;
  const keys = e?.dataTransfer?.getData("text/plain");
  if (!keys) return;
  let moved: string[] = [];
  try {
    moved = JSON.parse(keys) as string[];
  } catch {
    return;
  }
  if (!Array.isArray(moved) || !moved.length) return;
  // 拖入当前目录或自身目录时忽略
  const filtered = moved.filter((k) => k !== targetDir && !k.startsWith(targetDir + "/"));
  if (!filtered.length) return;
  const copy = e?.ctrlKey === true;
  actionRunning.value = true;
  try {
    if (copy) {
      await copyObjects(bucket.value, filtered, targetDir);
      message.success(`复制 ${filtered.length} 项到「${targetDir || "/"}」`);
    } else {
      await moveObjects(bucket.value, filtered, targetDir);
      message.success(`移动 ${filtered.length} 项到「${targetDir || "/"}」`);
    }
    await refreshAfterAction();
  } catch (err) {
    message.error((err as Error)?.message ?? (copy ? "复制失败" : "移动失败"));
  } finally {
    actionRunning.value = false;
    dragOverDir.value = "";
  }
}

/** 放置到文件区的目录行 */
async function onRowDrop(e: DragEvent, item: StorageObject): Promise<void> {
  if (!item.directory) return;
  // 外部文件拖到文件夹行：上传进该文件夹（不落到当前目录）
  if (e.dataTransfer?.types.includes("Files")) {
    e.preventDefault();
    e.stopPropagation();
    await uploadFilesToDir(Array.from(e.dataTransfer.files ?? []), fullKey(item.name));
    return;
  }
  if (!e.dataTransfer?.types.includes(DRAG_MIME)) return;
  e.preventDefault();
  e.stopPropagation();
  const targetDir = fullKey(item.name);
  await dropKeysTo(targetDir, e);
}

/** 容错地从服务端拉取 bucket 公开配置（失败静默，页面不受影响） */
async function loadBucketConfig(): Promise<void> {
  configLoading.value = true;
  try {
    bucketConfig.value = await getBucketConfig(bucket.value);
  } catch {
    bucketConfig.value = null;
  } finally {
    configLoading.value = false;
  }
}

/** 能力接口是否正在加载（配置弹窗里的「加载中…」只由它驱动） */
const capabilitiesLoading = ref(false);

/** 容错地从服务端拉取 SPI 真实能力（失败置 capabilitiesFailed 由界面显式提示，不再静默回退内置滤镜） */
async function loadCapabilities(): Promise<void> {
  capabilitiesLoading.value = true;
  try {
    capabilities.value = await getCapabilities(bucket.value);
    capabilitiesFailed.value = false;
  } catch {
    capabilities.value = null;
    capabilitiesFailed.value = true;
  } finally {
    capabilitiesLoading.value = false;
  }
}

/** localStorage 中管理员令牌的键名 */
const ADMIN_TOKEN_KEY = "filestorage.adminToken";

/** 管理员配置弹窗可见性 */
const adminVisible = ref(false);

/** 管理员配置保存中 */
const adminSaving = ref(false);

/** 管理员令牌（后端每次启动随机生成，持久化本地避免重复输入） */
const adminToken = ref(localStorage.getItem(ADMIN_TOKEN_KEY) || "");

/** 管理员配置表单（FileStorageSetting 可动态修改的字段） */
const adminForm = reactive({
  /** 允许内联预览 */
  openPreview: true,
  /** 允许附件下载 */
  openDownload: true,
  /** 允许分段下载 */
  openRange: true,
  /** 附加水印响应头 */
  openWatermark: false,
  /** 允许 webjars */
  openWebjars: true,
  /** 允许远程文件 */
  openRemoteFile: false,
  /**
   * 三方 URL 预览能力（FileStorageUrlPreviewProvider SPI 实现名，NONE 表示关闭）
   *
   * <p>不是布尔开关：可选实现由后台 {@code ?format=capabilities} 枚举下发，
   * 管理员显式选择后才生效；只有 supported=true 的实现（内置为 SERVER，即后台拉取）
   * 才真正放行 {@code ?url=}，选其它值仍会被服务端 403。</p>
   */
  thirdUrlPreview: "NONE",
  /** 目录列表页开关 */
  layout: true,
  /** 布局类型 SIMPLE/SYSTEM */
  layoutType: "SIMPLE",
  /** 水印文字（空表示清除） */
  watermark: "",
  /** 详情视图是否显示"类型"列 */
  showFormat: true,
  /** 详情视图是否显示"大小"列 */
  showSize: true,
  /** 详情视图是否显示"修改时间"列 */
  showTime: true,
  /** 图片滤镜（ImageFilter SPI 扩展名，NONE 表示原图） */
  imageFilter: "NONE",
  /**
   * URL 参数能力（FileStorageFileSetting SPI 实现名，默认 jdk）
   *
   * <p>下拉选项来自后台能力接口的 fileSettingCapabilities，前端不硬编码；
   * 决定 ?size=100x100&format=webp 这类文件级参数由哪个实现解析。</p>
   */
  fileSettingKey: "jdk",
  /** 路径穿透防护（默认开启；拦截 ..、反斜杠等穿越请求并筛查文件动作参数） */
  openPathGuard: true,
  /** 全局图片滤镜链开关（默认关闭；开启后每次图片请求按滤镜链强制处理） */
  imageFilterEnabled: false,
  /** 是否私有桶（私有桶请求需携带访问令牌，由 OAuthServerFilter 鉴权；保存后实时生效） */
  privateBucket: false,
  /**
   * 全部私有桶（逗号分隔的 provider 名）
   *
   * <p>与 {@link adminForm.privateBucket} 的关系：后者只改 URL 里的当前桶（后端按
   * bucket 增删集合），前者一次性替换整个集合。两个都发时以后者为准。</p>
   */
  privateBuckets: "",
  /**
   * 链接默认有效期（分钟）
   *
   * <p>后端字段是毫秒（oneTimeTtlMs），此处用分钟便于输入。留空表示不改，
   * 保持服务端现值——避免每次保存配置都把管理员手改过的值重置回默认 10 分钟。</p>
   */
  oneTimeTtlMinutes: "",
});

/**
 * 图片滤镜可选项：首项固定"原图"，其余一律取自后端 ImageFilter SPI 真实实现。
 *
 * <p>此前能力加载失败时会回退到前端硬编码的 6 项内置滤镜（并配一份硬编码 CSS），
 * 把「滤镜不是来自后台 SPI」这一故障静默掩盖；现在列表是纯 SPI 来源，
 * 加载失败只保留「原图」并由 {@link imageFilterLoadFailed} 显式提示。</p>
 */
const imageFilterOptions = computed(() => {
  const opts: { value: string; label: string; css: string; path: string; server: boolean }[] = [
    { value: "NONE", label: "原图", css: "", path: "", server: false },
  ];
  for (const f of capabilities.value?.imageFilters ?? []) {
    if (!f.name || f.name === "NONE") continue;
    opts.push({
      value: f.name,
      label: f.label || f.name,
      css: f.css ?? "",
      path: f.path ?? "",
      server: f.server ?? false,
    });
  }
  return opts;
});

/** 能力接口是否加载失败（滤镜列表只剩「原图」时给显式提示，不做静默兜底） */
const capabilitiesFailed = ref(false);

/** 滤镜列表是否因能力接口失败而不可用 */
const imageFilterLoadFailed = computed(() => capabilitiesFailed.value);

/** 当前生效的滤镜选项（配置值为空或未知时按原图处理） */
const activeImageFilter = computed(
  () =>
    imageFilterOptions.value.find((o) => o.value === (bucketConfig.value?.imageFilter || "NONE")) ??
    imageFilterOptions.value[0],
);

/**
 * 当前滤镜的图片路径参数（拼在图片地址上，让图片渲染先走滤镜）
 *
 * <p>只有后台图片管线真正处理的滤镜（{@code server=true}）才返回参数值：
 * 反色/怀旧/鲜艳这类后台不执行的效果，路径留空、改由 {@link imageFilterCss} 兜底，
 * 否则会往地址上塞一个服务端无法执行的参数。</p>
 */
const imageFilterPath = computed(() => {
  const f = activeImageFilter.value;
  return f && f.server ? f.path : "";
});

/**
 * 把图片路径参数拆成查询键值对（{@code grayscale=1} → {@code {grayscale:"1"}}）
 *
 * <p>解析失败（缺等号、空键）时该项直接丢弃，绝不把半截参数拼进地址——
 * 那会变成服务端侧的未知参数，且很难从表现反推原因。</p>
 */
const imageFilterParams = computed<Record<string, string>>(() => {
  const out: Record<string, string> = {};
  for (const pair of imageFilterPath.value.split("&")) {
    const p = pair.trim();
    if (!p) continue;
    const eq = p.indexOf("=");
    if (eq <= 0) continue;
    out[p.slice(0, eq).trim()] = p.slice(eq + 1).trim();
  }
  return out;
});

/**
 * 当前滤镜的 CSS filter 值（仅用于后台不处理的滤镜的即时演示）
 *
 * <p>后台会处理的滤镜（灰度/模糊）实际像素已在服务端改过，此处再叠一层 CSS
 * 会让同一滤镜作用两次（灰度压灰度、模糊叠模糊），因此直接留空。</p>
 */
const imageFilterCss = computed(() => {
  const f = activeImageFilter.value;
  if (!f || f.server) return "";
  return f.css ?? "";
});

/**
 * 三方 URL 预览能力可选项（FileStorageUrlPreviewProvider SPI 实现）
 *
 * <p>下拉里的每一项都是后台真实存在的实现，不硬编码「开/关」。选项描述直接取
 * 后台下发的 description，supported 为 false 的项在选择后给出明确提示——
 * 选它不会生效，服务端仍会 403。</p>
 */
const urlPreviewerOptions = computed(() =>
  (capabilities.value?.urlPreviewers ?? []).map((p) => ({
    value: p.name,
    label: p.label || p.name,
    description: p.description ?? "",
    supported: p.supported ?? false,
  })),
);

/** 当前选中的 URL 预览能力是否真正支持 ?url=（用于在选项旁提示「需选择后台」） */
const activeUrlPreviewer = computed(
  () =>
    urlPreviewerOptions.value.find((o) => o.value === (bucketConfig.value?.thirdUrlPreview || "NONE")) ??
    null,
);

/** 选了不支持处理的实现：给显式提示，避免用户以为打开就能用 */
const urlPreviewerUnsupported = computed(
  () => activeUrlPreviewer.value !== null && !activeUrlPreviewer.value.supported,
);

/** 远程文件读取器选项（FileStorageRemoteReader SPI，展示可用协议） */
const remoteReaderOptions = computed(() =>
  (capabilities.value?.remoteReaders ?? []).filter((r) => r.supported).map((r) => ({
    label: r.label || r.name,
    protocol: r.protocol,
    description: r.description ?? "",
  })),
);

/** 服务端是否显示"类型"列 */
const showFormatCol = computed(() => bucketConfig.value?.showFormat ?? true);
/** 服务端是否显示"大小"列 */
const showSizeCol = computed(() => bucketConfig.value?.showSize ?? true);
/** 服务端是否显示"修改时间"列 */
const showTimeCol = computed(() => bucketConfig.value?.showTime ?? true);

/**
 * 将服务端配置回填到管理员表单
 *
 * @param cfg 服务端配置（可能尚未加载完成）
 */
function applyConfigToForm(cfg: BucketConfig | null): void {
  if (!cfg) return;
  adminForm.openPreview = cfg.openPreview;
  adminForm.openDownload = cfg.openDownload;
  adminForm.openRange = cfg.openRange;
  adminForm.openWatermark = cfg.openWatermark;
  adminForm.openWebjars = cfg.openWebjars;
  adminForm.openRemoteFile = cfg.openRemoteFile;
  adminForm.thirdUrlPreview = cfg.thirdUrlPreview || "NONE";
  adminForm.layout = cfg.layout;
  adminForm.layoutType = cfg.layoutType || "SIMPLE";
  adminForm.watermark = cfg.watermark ?? "";
  adminForm.showFormat = cfg.showFormat ?? true;
  adminForm.showSize = cfg.showSize ?? true;
  adminForm.showTime = cfg.showTime ?? true;
  adminForm.imageFilter = cfg.imageFilter || "NONE";
  adminForm.fileSettingKey = cfg.fileSettingKey || "jdk";
  adminForm.openPathGuard = cfg.openPathGuard ?? true;
  adminForm.imageFilterEnabled = cfg.imageFilterEnabled ?? false;
  chainRows.value = parseChainRows(cfg.filterChain);
  adminForm.privateBucket = cfg.private ?? false;
  adminForm.privateBuckets = (cfg.privateBuckets ?? []).join(",");
  // 后端是毫秒，换算成分钟回显；非正数（不该出现）时留空，避免显示成 0
  adminForm.oneTimeTtlMinutes =
    typeof cfg.oneTimeTtlMs === "number" && cfg.oneTimeTtlMs > 0
      ? String(Math.round(cfg.oneTimeTtlMs / 60000))
      : "";
}

/**
 * 打开管理员配置弹窗（立即展示，配置异步回填，避免等待网络请求导致弹窗迟滞）
 */
function openAdminConfig(): void {
  adminVisible.value = true;
  adminSearch.value = "";
  adminGroup.value = "fs-adm-file";
  applyConfigToForm(bucketConfig.value);
  if (!bucketConfig.value) {
    void loadBucketConfig().then(() => applyConfigToForm(bucketConfig.value));
  }
  // 能力列表决定「图片滤镜 / URL 参数能力 / 全局滤镜」三个下拉与开关，
  // 首次加载失败或尚未完成时在打开弹窗时补一次，避免界面永久停在「加载中」。
  if (capabilities.value == null) {
    void loadCapabilities();
  }
}

/* ===== 系统配置弹窗：分组导航 / 设置项搜索 / 私有桶标签 ===== */

/** 搜索关键字（空串 = 不过滤，全部设置项可见） */
const adminSearch = ref("");

/** 右侧内容滚动容器（分组跳转 + 滚动高亮的基准） */
const adminMainRef = ref<HTMLElement | null>(null);

/** 左侧当前高亮的分组 id */
const adminGroup = ref("fs-adm-file");

/** 左侧分组清单（id 与右侧 <section> 的 id 一一对应） */
const adminGroups = [
  { id: "fs-adm-file", label: "文件功能", icon: Files },
  { id: "fs-adm-layout", label: "布局显示", icon: Grid },
  { id: "fs-adm-filter", label: "图片滤镜", icon: Picture },
  { id: "fs-adm-image", label: "图片处理", icon: Operation },
  { id: "fs-adm-security", label: "水印与安全", icon: Lock },
  { id: "fs-adm-token", label: "管理员令牌", icon: Key },
] as const;

/**
 * 文件功能开关清单
 *
 * <p>terms 是各项的搜索词，**必须包含分组名「文件功能」**：分组显隐由
 * {@link adminSectionsShown} 按各项 terms 求或得出，只有每项都带上分组名，
 * 才能保证「命中某项 ⇒ 所在分组一定可见」，不会出现分组被过滤掉而项还留着的错位。</p>
 */
const adminFileToggles: ReadonlyArray<{
  key:
    | "openPreview"
    | "openDownload"
    | "openRange"
    | "openWatermark"
    | "openWebjars"
    | "openRemoteFile"
    | "layout";
  label: string;
  desc: string;
  icon: Component;
  terms: string[];
}> = [
  { key: "openPreview", label: "内联预览", desc: "浏览器内直接预览文件", icon: View, terms: ["文件功能", "内联预览", "预览", "preview"] },
  { key: "openDownload", label: "附件下载", desc: "允许下载文件附件", icon: Download, terms: ["文件功能", "附件下载", "下载", "download"] },
  { key: "openRange", label: "分段下载", desc: "支持 Range 断点续传", icon: Sort, terms: ["文件功能", "分段下载", "断点续传", "range"] },
  { key: "openWatermark", label: "水印响应头", desc: "响应中携带水印标识", icon: Stamp, terms: ["文件功能", "水印响应头", "水印", "watermark"] },
  { key: "openWebjars", label: "Webjars 资源", desc: "暴露 Webjars 静态资源", icon: Box, terms: ["文件功能", "webjars", "静态资源"] },
  { key: "openRemoteFile", label: "远程文件透传", desc: "代理远程文件请求", icon: Connection, terms: ["文件功能", "远程文件透传", "远程", "透传", "proxy"] },
  { key: "layout", label: "目录列表页", desc: "无索引文件时列出目录内容", icon: Menu, terms: ["文件功能", "目录列表页", "目录", "列表页", "layout"] },
];

/**
 * 「文件功能」分组里非开关项（下拉选择）的搜索词
 *
 * <p>与 {@link adminFileToggles} 同源约束：同样带上分组名「文件功能」，
 * 保证「命中该项 ⇒ 所在分组一定可见」。</p>
 */
const ADMIN_FILE_ITEM_TERMS: Record<string, string[]> = {
  thirdUrlPreview: ["文件功能", "三方 url 预览", "三方", "url", "外部地址", "后台"],
};

/** 详情视图列显隐清单（同样带上分组名，理由见 {@link adminFileToggles}） */
const adminColumnToggles: ReadonlyArray<{
  key: "showFormat" | "showSize" | "showTime";
  label: string;
  terms: string[];
}> = [
  { key: "showFormat", label: "显示「类型」列", terms: ["布局显示", "类型", "type"] },
  { key: "showSize", label: "显示「大小」列", terms: ["布局显示", "大小", "size"] },
  { key: "showTime", label: "显示「修改时间」列", terms: ["布局显示", "修改时间", "时间", "time"] },
];

/** 「布局显示」分组各项的搜索词；分组显隐 = 任一项命中（与模板里的 v-if 一一对应） */
const ADMIN_LAYOUT_ITEM_TERMS: Record<string, string[]> = {
  layoutType: ["布局显示", "布局类型", "资源管理器", "简单列表", "system", "simple"],
  access: ["布局显示", "访问权限", "公共", "私有", "权限"],
  buckets: ["布局显示", "全部私有桶", "私有桶", "桶", "bucket"],
  ttl: ["布局显示", "链接默认有效期", "有效期", "分钟", "链接", "ttl"],
};

/** 「图片滤镜」分组各项的搜索词；分组显隐 = 任一项命中（与模板里的 v-if 一一对应） */
const ADMIN_FILTER_ITEM_TERMS: Record<string, string[]> = {
  imageFilter: ["图片滤镜", "滤镜", "图片", "灰度", "模糊", "filter"],
};

/** 「图片处理」分组各项的搜索词；分组显隐 = 任一项命中（与模板里的 v-if 一一对应） */
const ADMIN_IMAGE_ITEM_TERMS: Record<string, string[]> = {
  caps: ["图片处理", "参数", "能力", "url 参数", "spi", "capability"],
  chain: ["图片处理", "滤镜链", "全局滤镜", "灰度", "gray", "size", "缩放", "模糊", "blur", "滤镜"],
};

/** 「水印与安全」分组各项的搜索词；分组显隐 = 任一项命中（与模板里的 v-if 一一对应） */
const ADMIN_SECURITY_ITEM_TERMS: Record<string, string[]> = {
  watermark: ["水印与安全", "水印", "文字", "watermark"],
  pathGuard: ["水印与安全", "路径穿透", "穿透", "穿越", "防护", "guard", "path", "traversal", "安全"],
};

/** 「管理员令牌」分组搜索词 */
const ADMIN_TOKEN_TERMS = ["管理员令牌", "令牌", "token", "api", "鉴权"];

/**
 * 判断一组搜索词是否命中（空关键字恒命中）
 *
 * @param terms 关键词组，任一命中即为 true
 * @returns 命中则 true
 */
function admHitAny(terms: readonly string[]): boolean {
  const q = adminSearch.value.trim().toLowerCase();
  if (q === "") return true;
  return terms.some((t) => t.toLowerCase().includes(q));
}

/** 五个分组是否可见（搜索过滤后） */
const adminSectionsShown = computed(() => ({
  file:
    adminFileToggles.some((t) => admHitAny(t.terms)) ||
    Object.values(ADMIN_FILE_ITEM_TERMS).some((terms) => admHitAny(terms)),
  layout: Object.values(ADMIN_LAYOUT_ITEM_TERMS).some((terms) => admHitAny(terms)),
  filter: Object.values(ADMIN_FILTER_ITEM_TERMS).some((terms) => admHitAny(terms)),
  image: Object.values(ADMIN_IMAGE_ITEM_TERMS).some((terms) => admHitAny(terms)),
  security: Object.values(ADMIN_SECURITY_ITEM_TERMS).some((terms) => admHitAny(terms)),
  token: admHitAny(ADMIN_TOKEN_TERMS),
}));

/** 命中搜索的文件功能开关（用于 v-for 渲染） */
const visibleFileToggles = computed(() => adminFileToggles.filter((t) => admHitAny(t.terms)));

/** 命中搜索的列显隐开关（用于 v-for 渲染） */
const visibleColumnToggles = computed(() => adminColumnToggles.filter((t) => admHitAny(t.terms)));

/* ===== 「图片处理」分组：能力与滤镜链全部来自后台 SPI 或后台存储 ===== */

/**
 * URL 参数能力实现选项（FileStorageFileSetting SPI）
 *
 * <p>与「图片滤镜」同一套交互：下拉选择实现，选项与展示名全部来自后台
 * {@code ?format=capabilities} 的 {@code fileSettingCapabilities}，前端不硬编码。
 * 当前值不在能力清单里（能力接口暂时不可用）时保留原值一项，避免下拉被清空后
 * 管理员一保存就把服务端配置改回默认。</p>
 */
const urlParamSettingOptions = computed(() => {
  const opts = (capabilities.value?.fileSettingCapabilities ?? []).map((g) => ({
    value: g.spi,
    label: g.label || g.spi,
    description: g.description ?? "",
    capabilities: g.capabilities ?? [],
  }));
  const current = adminForm.fileSettingKey;
  if (current && !opts.some((o) => o.value === current)) {
    opts.unshift({
      value: current,
      label: current,
      description: capabilitiesFailed.value
        ? "能力接口不可用，暂无法读取实现说明"
        : "能力接口尚未返回该实现",
      capabilities: [],
    });
  }
  return opts;
});

/** 当前选中的 URL 参数能力实现（用于下方展示它真实支持的能力） */
const activeUrlParamSetting = computed(
  () =>
    urlParamSettingOptions.value.find((o) => o.value === adminForm.fileSettingKey) ??
    urlParamSettingOptions.value[0] ??
    null,
);

/**
 * 当前实现支持的 URL 参数能力（FileStorageFileSetting SPI）
 *
 * <p>只读展示：这些参数由后台解析执行（如 {@code ?size=100x100}、{@code ?grayscale=1}），
 * 列表来源是 /capabilities 的能力组，前端不硬编码。</p>
 */
const fileCapabilityChips = computed<string[]>(() => activeUrlParamSetting.value?.capabilities ?? []);

/**
 * 全局滤镜链可选择项（FileStorageFilterSetting SPI）汇总
 *
 * <p>值即写入 filterChain 的 id（gray、size、blur 等），来自后台 SPI 能力组；
 * 后端写入时会再次校验「必须命中 SPI 能力」，前端列表与后端校验同源。</p>
 */
const filterChainOptions = computed<{ value: string; label: string }[]>(() => {
  const groups = capabilities.value?.filterSettingCapabilities ?? [];
  const set = new Set<string>();
  for (const g of groups) {
    for (const c of g.capabilities ?? []) {
      if (c) set.add(c);
    }
  }
  return [...set].map((id) => ({ value: id, label: id }));
});

/** 滤镜链编辑行 */
interface FilterChainRow {
  id: string;
  params: string;
}

/** 滤镜链编辑态（保存时序列化为 filterChain 紧凑串；与 adminForm 分开，避免数组串进请求体） */
const chainRows = ref<FilterChainRow[]>([]);

/**
 * 解析后端 filterChain 紧凑串为编辑行（{@code id:key=value,key=value;id2}）
 *
 * @param chain 后端紧凑串
 * @returns 编辑行列表
 */
function parseChainRows(chain: string | null | undefined): FilterChainRow[] {
  if (!chain) {
    return [];
  }
  const rows: FilterChainRow[] = [];
  const byId = new Map<string, FilterChainRow>();
  for (const entry of chain.split(";").map((s) => s.trim()).filter(Boolean)) {
    const colon = entry.indexOf(":");
    const id = (colon < 0 ? entry : entry.slice(0, colon)).trim();
    if (!id) continue;
    const params = colon < 0 ? "" : entry.slice(colon + 1).trim();
    // 开关式编辑按能力 id 去重：旧配置里同一滤镜出现多次时合并参数，
    // 否则模板上会出现两个同名开关，勾掉一个另一个还在。
    const existing = byId.get(id);
    if (existing) {
      existing.params = [existing.params, params].filter(Boolean).join(",");
      continue;
    }
    const row: FilterChainRow = { id, params };
    byId.set(id, row);
    rows.push(row);
  }
  return rows;
}

/**
 * 序列化编辑行为 filterChain 紧凑串（空列表返回空串 = 清空）
 *
 * @returns 紧凑串
 */
function serializeChainRows(): string {
  // 按后台下发的能力顺序输出：界面是「开关列表」，顺序由 SPI 决定而不是点击先后，
  // 否则同样的勾选组合会生成不同的链，热更新日志与执行顺序难以复现。
  const order = new Map(filterChainOptions.value.map((o, i) => [o.value, i]));
  return chainRows.value
    .filter((row) => row.id.trim() !== "")
    .slice()
    .sort((a, b) => (order.get(a.id) ?? Number.MAX_SAFE_INTEGER) - (order.get(b.id) ?? Number.MAX_SAFE_INTEGER))
    .map((row) => {
      const id = row.id.trim();
      const params = row.params.trim();
      return params ? `${id}:${params}` : id;
    })
    .join(";");
}

/**
 * 开启滤镜时写入的默认参数
 *
 * <p>与后端 {@code applyFilterChainStep} 的缺省值一致；size 没有默认值会直接跳过，
 * 因此必须给一个可见的默认尺寸，管理员再按需修改。</p>
 */
const FILTER_CHAIN_DEFAULT_PARAMS: Record<string, string> = {
  size: "width=200,height=200",
  resize: "width=200,height=200",
  blur: "radius=5",
  sharpen: "radius=1",
  bright: "brightness=1.15",
  brightness: "brightness=1.15",
  rotate: "angle=90",
  flip: "direction=horizontal",
};

/** 滤镜开关行（能力选项 + 已启用时的编辑行） */
const chainFilterRows = computed(() =>
  filterChainOptions.value.map((opt) => ({
    ...opt,
    row: chainRows.value.find((r) => r.id === opt.value) ?? null,
  })),
);

/**
 * 生成滤镜链的只读效果示例（不再让管理员手工填参数）
 *
 * <p>与后台 {@code applyFilterChainStep} 的真实执行逻辑对齐：未实现的
 * SPI 能力明确标注“不会生效”，避免把后台未执行的参数描述成正常功能。</p>
 */
function chainFilterExample(id: string, params: string): string {
  const key = id.trim().toLowerCase();
  const kv: Record<string, string> = {};
  for (const pair of params.split(",").map((s) => s.trim()).filter(Boolean)) {
    const eq = pair.indexOf("=");
    if (eq > 0) kv[pair.slice(0, eq).trim().toLowerCase()] = pair.slice(eq + 1).trim();
  }
  switch (key) {
    case "size":
    case "resize": {
      const w = kv["width"];
      const h = kv["height"];
      if (w && h) return `固定缩放到 ${w}x${h}（示例：width=200,height=200）`;
      if (kv["size"]) return `固定缩放到 ${kv["size"]}（示例：size=200x200）`;
      if (kv["scale"]) return `按比例缩放 ${kv["scale"]}%（示例：scale=50）`;
      return "该滤镜缺少 width/height 或 size 参数，当前会被跳过";
    }
    case "gray":
    case "grayscale":
      return "整图灰度，无需参数";
    case "blur":
    case "gaussianblur":
      return `高斯模糊，radius=${kv["radius"] ?? "5"}`;
    case "sharpen":
    case "usm":
      return `锐化，radius=${kv["radius"] ?? "1"}`;
    case "bright":
    case "brightness":
      return `亮度调整，brightness=${kv["brightness"] ?? "1.15"}`;
    case "rotate":
      return `旋转 ${kv["angle"] ?? "90"}°`;
    case "flip":
      return `翻转 direction=${kv["direction"] ?? "horizontal"}`;
    case "autoorient":
      return "自动按 EXIF 旋转，无需参数";
    case "watermark":
    case "textwatermark":
      return kv["text"] ? `文字水印：${kv["text"]}` : "文字水印缺少 text 参数，当前会被跳过";
    default:
      return `后台 JDK 管线未实现“${id}”，开启后不会产生效果（仅记录配置）`;
  }
}

/**
 * 开关某个全局滤镜：开启即加入链，关闭即移除
 *
 * @param id      滤镜能力 id
 * @param enabled 开关目标状态
 */
function toggleChainFilter(id: string, enabled: boolean): void {
  const index = chainRows.value.findIndex((r) => r.id === id);
  if (enabled) {
    if (index < 0) {
      chainRows.value.push({ id, params: FILTER_CHAIN_DEFAULT_PARAMS[id] ?? "" });
    }
    return;
  }
  if (index >= 0) {
    chainRows.value.splice(index, 1);
  }
}

/**
 * el-switch 的 change 回调（值为 boolean / string / number，统一按布尔处理）
 *
 * @param id    滤镜能力 id
 * @param value 开关值
 */
function onChainFilterSwitch(id: string, value: string | number | boolean): void {
  toggleChainFilter(id, Boolean(value));
}

/** 是否还有任一分组可见（全被过滤掉时给空态提示） */
const adminAnySectionShown = computed(() => Object.values(adminSectionsShown.value).some(Boolean));

/** 程序化滚动锁：平滑滚动期间暂停滚动反查，避免高亮被中途位置抢回上一分组 */
let adminNavLock = false;

/** 解锁定时器句柄 */
let adminNavTimer = 0;

/**
 * 左侧分组点击：滚动右侧内容到对应分区
 *
 * <p>修复要点：右侧滚动容器必须自身可滚（CSS 已让 .fs-admin__main 继承弹窗限高），
 * 否则 scrollTo 是无操作、点击表现为「没反应」；末段（管理员令牌）顶不到视口顶部，
 * 由 {@link syncAdminGroup} 的触底判定兜底高亮。</p>
 *
 * @param id 分区 id
 */
function scrollToAdminSection(id: string): void {
  adminGroup.value = id;
  const main = adminMainRef.value;
  const el = main?.querySelector<HTMLElement>(`#${id}`);
  // 分区的 offsetTop 以 .fs-admin__main（position:relative）为基准，直接滚动容器即可
  if (!main || !el) return;
  adminNavLock = true;
  window.clearTimeout(adminNavTimer);
  adminNavTimer = window.setTimeout(() => {
    // 只解锁、不反查：点击语义是「高亮我要看的分组」。末段顶不到顶时会触底，
    // 若在解锁时再跑一次位置反查，会把高亮抢到「管理员令牌」，与点击意图相反。
    adminNavLock = false;
  }, 480);
  main.scrollTo({ top: el.offsetTop, behavior: "smooth" });
}

/** 右侧滚动 → 反向高亮左侧分组 */
function syncAdminGroup(): void {
  if (adminNavLock) return;
  const main = adminMainRef.value;
  if (!main) return;
  // 内容不足以滚动（如搜索过滤后只剩一两段）：保留点击选中的高亮，不做位置反查
  if (main.scrollHeight <= main.clientHeight + 4) return;
  // 触底：直接高亮最后一段——末段高度不足时永远顶不到容器顶部
  if (main.scrollTop + main.clientHeight >= main.scrollHeight - 4) {
    const last = adminGroups[adminGroups.length - 1];
    if (last) adminGroup.value = last.id;
    return;
  }
  let current = "";
  for (const g of adminGroups) {
    const el = main.querySelector<HTMLElement>(`#${g.id}`);
    if (el && el.offsetTop - main.scrollTop <= 80) current = g.id;
  }
  if (current) adminGroup.value = current;
}

/** 全部私有桶标签的输入草稿 */
const bucketDraft = ref("");

/** 私有桶标签输入框（点击标签容器时聚焦） */
const bucketInputRef = ref<HTMLInputElement | null>(null);

/** 聚焦私有桶标签输入框 */
function focusBucketInput(): void {
  bucketInputRef.value?.focus();
}

/**
 * 私有桶标签输入按键：回车或逗号提交
 *
 * @param e 键盘事件
 */
function onBucketKeydown(e: KeyboardEvent): void {
  if (e.key === "Enter" || e.key === "," || e.key === "，") {
    e.preventDefault();
    addBucketTag();
  }
}

/** 全部私有桶标签（源数据仍是 adminForm.privateBuckets 逗号串，保存链路不变） */
const bucketTags = computed(() =>
  adminForm.privateBuckets.split(",").map((s) => s.trim()).filter(Boolean),
);

/** 提交私有桶标签（回车或失焦；支持一次粘贴多个逗号分隔值） */
function addBucketTag(): void {
  const parts = bucketDraft.value.split(",").map((s) => s.trim()).filter(Boolean);
  if (parts.length === 0) return;
  const set = new Set(bucketTags.value);
  for (const p of parts) set.add(p);
  adminForm.privateBuckets = [...set].join(",");
  bucketDraft.value = "";
}

/**
 * 删除指定私有桶标签
 *
 * @param tag 要删除的桶名
 */
function removeBucketTag(tag: string): void {
  adminForm.privateBuckets = bucketTags.value.filter((t) => t !== tag).join(",");
}

/**
 * 恢复默认设置（只回填表单，仍需点「保存并生效」才写服务端）
 */
function resetAdminForm(): void {
  Object.assign(adminForm, {
    openPreview: true,
    openDownload: true,
    openRange: true,
    openWatermark: false,
    openWebjars: true,
    openRemoteFile: false,
    thirdUrlPreview: "NONE",
    layout: true,
    layoutType: "SIMPLE",
    watermark: "",
    showFormat: true,
    showSize: true,
    showTime: true,
    imageFilter: "NONE",
    openPathGuard: true,
    imageFilterEnabled: false,
    privateBucket: false,
    privateBuckets: "",
    oneTimeTtlMinutes: "10",
  });
  chainRows.value = [];
  bucketDraft.value = "";
  message.success("已恢复默认设置，点「保存并生效」后写入服务端");
}

/**
 * 复制管理员令牌（非安全上下文下的 clipboard API 会抛错，回退 execCommand）
 */
function copyAdminToken(): void {
  const text = adminToken.value;
  if (!text) {
    message.warning("当前没有令牌可复制");
    return;
  }
  const done = () => message.success("令牌已复制");
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(text).then(done).catch(() => fallbackCopyToken(text, done));
  } else {
    fallbackCopyToken(text, done);
  }
}

/**
 * 剪贴板兜底：临时 textarea + execCommand
 *
 * @param text 待复制文本
 * @param done 成功回调
 */
function fallbackCopyToken(text: string, done: () => void): void {
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
    done();
  } catch {
    message.error("复制失败，请手动选择文本复制");
  }
}

/**
 * 保存管理员配置（后端实时生效，并刷新侧栏开关徽标）
 */
async function saveAdminConfig(): Promise<void> {
  const tokenValue = adminToken.value.trim();
  if (!tokenValue) {
    message.warning("请输入管理员令牌");
    return;
  }
  adminSaving.value = true;
  try {
    const { privateBucket, privateBuckets, oneTimeTtlMinutes, ...rest } = adminForm;
    // 过期时间：留空=不改（不发给后端）；填了则校验并换算成毫秒
    let oneTimeTtlMs: number | undefined;
    const ttlText = oneTimeTtlMinutes.trim();
    if (ttlText !== "") {
      const minutes = Number(ttlText);
      if (!Number.isFinite(minutes) || minutes <= 0) {
        message.warning("链接默认有效期需为正数（分钟）");
        adminSaving.value = false;
        return;
      }
      oneTimeTtlMs = Math.round(minutes * 60_000);
    }
    await setBucketConfig(bucket.value, tokenValue, {
      ...rest,
      watermark: adminForm.watermark.trim(),
      // 滤镜链由编辑行序列化（空串 = 清空服务端配置；非法 id 由服务端校验并回显错误）
      filterChain: serializeChainRows(),
      private: privateBucket,
      privateBuckets: privateBuckets.split(",").map((s) => s.trim()).filter(Boolean),
      ...(oneTimeTtlMs === undefined ? {} : { oneTimeTtlMs }),
    });
    localStorage.setItem(ADMIN_TOKEN_KEY, tokenValue);
    adminVisible.value = false;
    message.success("配置已保存并实时生效");
    await loadBucketConfig();
  } catch (e) {
    message.error((e as Error)?.message ?? "配置保存失败");
  } finally {
    adminSaving.value = false;
  }
}

/** 服务端是否允许预览 */
const allowPreview = computed(() => bucketConfig.value?.openPreview ?? true);
/** 服务端是否允许下载 */
const allowDownload = computed(() => bucketConfig.value?.openDownload ?? true);
/** 当前桶是否私有（私有桶请求需登录令牌） */
const bucketPrivate = computed(() => bucketConfig.value?.private ?? false);

/**
 * 预览前的开关门禁
 *
 * <p>服务端对「预览被关闭」返回 403，但前端不能等它报错：用户点的是「预览」，
 * 却弹出一个失败提示或**一个意料之外的下载**，都比提前拦住更糟。
 * 这里统一拦下并说明去哪里改。</p>
 *
 * <p>特别地：预览被关闭时**绝不自动改成下载**——那是把一种被禁止的访问
 * 悄悄换成另一种用户没要求的访问。</p>
 *
 * @returns 允许预览返回 true；否则给出提示并返回 false
 */
function guardPreview(): boolean {
  if (allowPreview.value) {
    return true;
  }
  message.warning("该存储桶已关闭预览，可在「系统配置 → 允许预览」中开启");
  return false;
}

/**
 * 下载前的开关门禁
 *
 * @returns 允许下载返回 true；否则给出提示并返回 false
 */
function guardDownload(): boolean {
  if (allowDownload.value) {
    return true;
  }
  message.warning("该存储桶已关闭下载，可在「系统配置 → 允许下载」中开启");
  return false;
}

function enterDir(row: StorageObject): void {
  currentPath.value = fullKey(row.name);
  recordHistory(currentPath.value);
  clearSelect();
  lastSelectedIndex = -1;
  page.value = 1;
  loadObjects();
}

/** 从左侧「快捷访问」进入根目录下的目录（键就是名称，不依赖当前路径） */
function enterDirAtRoot(item: StorageObject): void {
  nav.value = "all";
  currentPath.value = item.name;
  recordHistory(currentPath.value);
  clearSelect();
  lastSelectedIndex = -1;
  page.value = 1;
  loadObjects();
}

function goCrumb(path: string): void {
  nav.value = "all";
  currentPath.value = path;
  recordHistory(path);
  clearSelect();
  lastSelectedIndex = -1;
  page.value = 1;
  loadObjects();
}

function goUp(): void {
  if (!currentPath.value) return;
  nav.value = "all";
  const i = currentPath.value.lastIndexOf("/");
  currentPath.value = i > 0 ? currentPath.value.slice(0, i) : "";
  recordHistory(currentPath.value);
  clearSelect();
  lastSelectedIndex = -1;
  page.value = 1;
  loadObjects();
}

/* ================== 分栏视图（macOS Finder 风格） ================== */

/** 分栏每列缓存的目录内容（key 为列对应目录路径） */
const colObjects = ref<Record<string, StorageObject[]>>({});
/** 分栏每列加载状态 */
const colLoading = ref<Record<string, boolean>>({});
/** 分栏每列加载失败原因（key 为列路径，空串表示无错） */
const colError = ref<Record<string, string>>({});
/** 分栏每列服务端返回的对象总数（用于“仅显示前 N 项”溢出提示） */
const colTotals = ref<Record<string, number>>({});

/** 路径链：["", "a", "a/b", ...]（含当前目录，用于渲染各列） */
const segmentPaths = computed<string[]>(() => {
  const segs = currentPath.value ? currentPath.value.split("/") : [];
  const out: string[] = [""];
  let cur = "";
  for (const s of segs) {
    cur = cur ? `${cur}/${s}` : s;
    out.push(cur);
  }
  return out;
});

/**
 * 确保某一列的目录内容已加载
 *
 * @param path 列目录路径
 */
async function ensureColumn(path: string): Promise<void> {
  if (colObjects.value[path] !== undefined) return;
  colLoading.value = { ...colLoading.value, [path]: true };
  try {
    // 分页请求 + 只保留前 COLUMN_LIMIT 项：分栏列是横向铺开的缩略入口，
    // 逐列 stat 全量（尤其瓦片图目录动辄上千项）会让侧向展开卡死；
    // 服务端返回的 total 用来提示“还有更多”。
    const paged = await listObjectsPaged(bucket.value, path, { limit: COLUMN_LIMIT, offset: 0 });
    const display = paged.items.filter((o) => o.name !== RECYCLE_DIR);
    colObjects.value = { ...colObjects.value, [path]: display.slice(0, COLUMN_LIMIT) };
    colTotals.value = { ...colTotals.value, [path]: paged.total };
    colError.value = { ...colError.value, [path]: "" };
  } catch (e) {
    // 加载失败不能一律当成空目录：服务端对不存在的目录返回 404（Directory Not Found），
    // 一旦吞掉就会把"路径拼错"伪装成"空文件夹"，界面上完全看不出发生过请求失败。
    colObjects.value = { ...colObjects.value, [path]: [] };
    colTotals.value = { ...colTotals.value, [path]: 0 };
    colError.value = { ...colError.value, [path]: (e as Error)?.message ?? "目录加载失败" };
  } finally {
    colLoading.value = { ...colLoading.value, [path]: false };
  }
}

/** 清空并重新加载分栏各列 */
function refreshColumns(): void {
  colObjects.value = {};
  colTotals.value = {};
  colError.value = {};
  segmentPaths.value.forEach((p) => { void ensureColumn(p); });
}

/**
 * 取某一列应当渲染的条目
 *
 * <p>分栏视图的列数据来自 {@link colObjects} 这份「每列一份」的缓存，
 * 而当前目录的列表是 {@link sortedObjects}，两者来源不同，必须分开取：
 * 拿当前目录那份套到每一列上，会把祖先列一起清空。</p>
 *
 * <p>这里<b>不做</b>任何过滤（搜索框已整行移除）。列的条目由
 * {@link ensureColumn} 负责按列路径加载，失败原因见 {@link colError}。</p>
 *
 * @param colPath 列对应的目录路径（空串表示根目录）
 * @return 该列应当渲染的条目列表；列尚未加载时返回空数组
 */
function columnItems(colPath: string): StorageObject[] {
  const list = colObjects.value[colPath];
  if (!list) return [];
  // 侧栏胶囊过滤对分栏视图同样生效：分栏每列的数据来自各自的缓存，
  // 不能套用当前目录那份 sortedObjects，所以在这里就地按同一口径筛一遍。
  return filterActive.value ? list.filter((o) => matchKeywordFilter(o) && matchCapsuleFilter(o)) : list;
}

watch(segmentPaths, (paths) => {
  paths.forEach((p) => { void ensureColumn(p); });
});

/**
 * 列内对象键（列路径 + 名称）
 *
 * @param path 列目录路径
 * @param name 对象名
 * @return 桶内相对键
 */
function joinKey(path: string, name: string): string {
  return path ? `${path}/${name}` : name;
}

/**
 * 分栏点击：目录向右侧展开一列；文件执行选中
 *
 * @param e       鼠标事件
 * @param item    对象
 * @param colPath 列目录路径
 * @param index   序号（Ctrl 多选用）
 */
function onColumnClick(e: MouseEvent | KeyboardEvent, item: StorageObject, colPath: string, index: number): void {
  if (item.directory) {
    currentPath.value = joinKey(colPath, item.name);
    recordHistory(currentPath.value);
    clearSelect();
    lastSelectedIndex = -1;
    page.value = 1;
    loadObjects();
    return;
  }
  if (e.ctrlKey || e.metaKey) {
    toggleSelect(item.name);
    lastSelectedIndex = index;
    return;
  }
  selected.value = new Set([item.name]);
  lastSelectedIndex = index;
}

/**
 * 分栏拖拽开始（源键按列路径计算）
 *
 * @param e       拖拽事件
 * @param item    源对象
 * @param colPath 列目录路径
 */
function onColumnDragStart(e: DragEvent, item: StorageObject, colPath: string): void {
  if (!e.dataTransfer) return;
  e.dataTransfer.setData(DRAG_MIME, "1");
  e.dataTransfer.setData("text/plain", JSON.stringify([joinKey(colPath, item.name)]));
  e.dataTransfer.effectAllowed = "copyMove";
}

/**
 * 分栏目录行拖拽悬停
 *
 * @param e       拖拽事件
 * @param colPath 列目录路径
 * @param item    目标对象
 */
function onColumnRowDragOver(e: DragEvent, colPath: string, item: StorageObject): void {
  if (!e.dataTransfer || !item.directory || !e.dataTransfer.types.includes(DRAG_MIME)) return;
  e.preventDefault();
  e.stopPropagation();
  e.dataTransfer.dropEffect = e.ctrlKey ? "copy" : "move";
  dragOverDir.value = joinKey(colPath, item.name);
}

/**
 * 分栏目录行拖拽离开
 *
 * @param colPath 列目录路径
 * @param item    目标对象
 */
function onColumnRowDragLeave(colPath: string, item: StorageObject): void {
  if (dragOverDir.value === joinKey(colPath, item.name)) {
    dragOverDir.value = "";
  }
}

/**
 * 分栏目录行放置（移动到该目录）
 *
 * @param e       拖拽事件
 * @param colPath 列目录路径
 * @param item    目标目录
 */
async function onColumnDrop(e: DragEvent, colPath: string, item: StorageObject): Promise<void> {
  if (!item.directory) return;
  // 外部文件拖到分栏目录：上传进该目录
  if (e.dataTransfer?.types.includes("Files")) {
    e.preventDefault();
    e.stopPropagation();
    await uploadFilesToDir(Array.from(e.dataTransfer.files ?? []), joinKey(colPath, item.name));
    return;
  }
  if (!e.dataTransfer?.types.includes(DRAG_MIME)) return;
  e.preventDefault();
  e.stopPropagation();
  await dropKeysTo(joinKey(colPath, item.name), e);
}

/** 分栏空白拖拽悬停 */
function onColumnBlankDragOver(e: DragEvent): void {
  if (e.dataTransfer?.types.includes(DRAG_MIME)) {
    e.preventDefault();
    e.dataTransfer.dropEffect = e.ctrlKey ? "copy" : "move";
  }
}

/**
 * 分栏空白放置（移动到该列目录）
 *
 * @param e       拖拽事件
 * @param colPath 列目录路径
 */
async function onColumnBlankDrop(e: DragEvent, colPath: string): Promise<void> {
  if (!e.dataTransfer?.types.includes(DRAG_MIME)) return;
  e.preventDefault();
  await dropKeysTo(colPath, e);
}

/**
 * 某目录是否为路径链分支（右侧已展开其子列）
 *
 * @param colPath  列目录路径
 * @param item     对象
 * @param colIndex 列下标
 * @return 是否分支
 */
function isTrailDir(colPath: string, item: StorageObject, colIndex: number): boolean {
  const next = segmentPaths.value[colIndex + 1];
  return !!next && next === joinKey(colPath, item.name);
}

/**
 * 分栏最后一列的文件选中态
 *
 * @param colIndex 列下标
 * @param item     对象
 * @return 是否选中
 */
function isColumnSelected(colIndex: number, item: StorageObject): boolean {
  return colIndex === segmentPaths.value.length - 1 && isSelected(item.name);
}

/* ================== 右键菜单 ================== */

function openContextMenu(e: MouseEvent, row: StorageObject): void {
  e.preventDefault();
  e.stopPropagation();
  // KodExplorer 行为：右键即选中该文件（若已多选则保留选择）
  if (!selected.value.has(row.name)) {
    selected.value = new Set([row.name]);
  }
  void openMenuAt(e, row);
}

/**
 * 分栏视图右键：先把该列切成当前目录，再打开菜单
 *
 * <p>分栏视图与其它三个视图的根本差别在于：其它视图的行全部来自
 * {@code sortedObjects}（当前目录），而分栏视图把**祖先列**也一并渲染出来。
 * 菜单里的每个动作（打开/重命名/删除/复制/下载/解压/建链接）都以
 * {@code currentPath} 为基准计算对象键，若在祖先列上直接开菜单，
 * 基准目录比行的父目录更深，拼出的键就是错的——最轻的症状是「打开」拼出
 * 不存在的路径被服务端 404 吞成「空目录」，最重的症状是重命名/删除作用到
 * 另一个目录下的同名对象。</p>
 *
 * <p>因此这里不做"跨目录操作"，而是先对齐基准目录：{@code currentPath} 一变，
 * {@code segmentPaths} 随之重算，更深的列自动收起，界面与菜单的作用域一致。
 * 代价是右键祖先列会收起右侧列，但换来的是不会出现作用到错误目录的删除。</p>
 *
 * @param e       鼠标事件
 * @param row     对象
 * @param colPath 该行所属列的目录路径（空串表示根目录）
 */
function openColumnContextMenu(e: MouseEvent, row: StorageObject, colPath: string): void {
  e.stopPropagation();
  if (colPath !== currentPath.value) {
    currentPath.value = colPath;
    clearSelect();
    lastSelectedIndex = -1;
    void loadObjects();
  }
  openContextMenu(e, row);
}

/** 文件区空白处右键菜单（新建/粘贴/刷新） */
function openBlankContextMenu(e: MouseEvent, path: string | null = null): void {
  e.preventDefault();
  void openMenuAt(e, null, path);
}

/** 分栏目录列空白右键：以该列的目录为操作上下文（新建目录/新建文件落在这列下） */
function openColumnBlankContextMenu(e: MouseEvent, colPath: string): void {
  e.preventDefault();
  void openMenuAt(e, null, colPath);
}

function closeContextMenu(): void {
  ctxMenu.value.visible = false;
  ctxMenu.value.row = null;
  ctxMenu.value.path = null;
}

function ctxAction(action: string) {
  const row = ctxMenu.value.row;
  const ctxPath = ctxMenu.value.path;
  closeContextMenu();
  switch (action) {
    case "open":
      if (row) {
        row.directory ? enterDir(row) : openPreview(row);
      }
      break;
    case "preview":
      if (row) void openPreview(row);
      break;
    case "previewNew":
      if (row && !row.directory) openPreviewInNewTab(row);
      break;
    case "download":
      if (row) void smartDownload([fullKey(row.name)]);
      break;
    case "onetime":
      if (row) openOneTime(row);
      break;
    case "expiryLink":
      if (row) openQuickExpiry(row);
      break;
    case "distribute":
      if (row && !row.directory) openDistribute(row);
      break;
    case "createCollab":
      if (row && !row.directory) void onCreateCollab(row);
      break;
    case "rename":
      void startInlineRename(row);
      break;
    case "renameDialog":
      void onRename(row);
      break;
    case "properties":
      openProperties(row);
      break;
    case "copy":
      onCopySelected();
      break;
    case "cut":
      onCutSelected();
      break;
    case "paste":
      void onPaste(ctxPath || undefined);
      break;
    case "unzip":
      void onUnzip(row);
      break;
    case "mkdir":
      void onCreateDir(ctxPath);
      break;
    case "mkfile":
      void onCreateFile(ctxPath);
      break;
    case "mktext":
      void onCreateTemplateFile("text", ctxPath);
      break;
    case "mkdocx":
      void onCreateTemplateFile("docx", ctxPath);
      break;
    case "mkxlsx":
      void onCreateTemplateFile("xlsx", ctxPath);
      break;
    case "refresh":
      void loadObjects();
      break;
    case "upload":
      openUpload();
      break;
    case "delete":
      if (row) void handleDelete(row);
      break;
  }
}

document.addEventListener("click", closeContextMenu);

/* ================== 协同（创建协同文档） ================== */

/**
 * 协同表格文件扩展名（Univer 在线表格支持，右键「创建协同」的显隐条件）。
 * FortuneSheet 支持的表格类：Excel xlsx/xls/xlsm/csv/ods。
 */
const COLLAB_FILE_EXTS = new Set(["xlsx", "xls", "xlsm", "csv", "ods"]);

/**
 * 判断文件名是否可创建协同（表格类文件）。
 *
 * @param name 文件名
 * @return true = 表格文件
 */
function isCollabFile(name: string): boolean {
  const dot = name.lastIndexOf(".");
  if (dot < 0) return false;
  return COLLAB_FILE_EXTS.has(name.slice(dot + 1).toLowerCase());
}

/**
 * 右键「创建协同」：对当前选中文件创建协同文档，成功后在协同管理列表展示。
 *
 * @param row 右键目标文件
 */
async function onCreateCollab(row: StorageObject): Promise<void> {
  try {
    const created = await createFileCollab({
      // 创建者：取登录用户名（内部功能，走应用登录态）
      fileName: row.name,
      bucket: currentBucketName(),
      objectKey: fullKey(row.name),
      visibility: "PUBLIC",
    });
    // 创建成功 → 提示并跳转协同管理页
    // eslint-disable-next-line no-console
    console.info("[collab] 已创建协同", created.id);
    // 跳转协同管理（hash 路由）
    const before = window.location.hash;
    if (!before.includes("/file-collabs")) {
      window.location.hash = "#/file-collabs";
    }
  } catch (e) {
    // 创建失败：沿用页面 message 体系（ElMessage 已在页面引入）
    message.error(e instanceof Error ? e.message : "创建协同失败");
  }
}

/** 当前桶名（列表页当前浏览的桶） */
function currentBucketName(): string {
  return bucket.value || getDefaultBucket();
}

/* ================== 上传（点击 + 拖拽） ================== */

/** 单个文件的允许上限：500MB（与上传框文案一致，选文件时就拦下） */
const UPLOAD_MAX_BYTES = 500 * 1024 * 1024;

/** 同时上传的并发数 */
const UPLOAD_CONCURRENCY = 3;

/** 上传项状态 */
type UploadStatus = "pending" | "uploading" | "done" | "error" | "paused";

/** 上传队列中的一项 */
interface UploadItem {
  /** 稳定唯一 id：同名文件允许重复添加，用递增序号区分 */
  id: string;
  /** 文件名 */
  name: string;
  /** 字节数 */
  size: number;
  /** 原始 File */
  file: File;
  /** 状态 */
  status: UploadStatus;
  /** 进度 0-100 */
  percent: number;
  /** 失败原因（status=error 时有值） */
  error: string;
  /** 中断句柄：暂停时 abort */
  controller: AbortController | null;
}

const uploadVisible = ref(false);
const uploadInput = ref<HTMLInputElement>();
/** 上传目标目录（可在弹框内「更换目录」，与 currentPath 解耦） */
const uploadTargetPath = ref("");
/** 上传队列 */
const uploadItems = ref<UploadItem[]>([]);
/** 是否正在上传（弹框底部按钮态） */
const uploading = ref(false);
/** 是否正在拖拽文件到页面（用于高亮遮罩） */
const dragging = ref(false);
/** 上传弹框内是否正在被拖放悬停 */
const uploadDropActive = ref(false);
/** 拖拽计数器：防止 dragover 反复触发 enter/leave */
let dragDepth = 0;
/** 队列自增序号，用于生成 id */
let uploadSeq = 0;
/** 当前并发中的上传数 */
let uploadRunning = 0;

/** 已完成数量 */
const uploadDoneCount = computed(() => uploadItems.value.filter((i) => i.status === "done").length);

/** 待传数量（未开始 + 已暂停） */
const uploadPendingCount = computed(
  () => uploadItems.value.filter((i) => i.status === "pending" || i.status === "paused").length
);

/** 是否还有可上传的项 */
const uploadHasPending = computed(() => uploadPendingCount.value > 0);

/** 上传目标目录展示文本（桶 / 路径） */
const uploadTargetText = computed(() => {
  const seg = uploadTargetPath.value ? uploadTargetPath.value.split("/") : [];
  return [bucket.value, ...seg].filter(Boolean).join(" / ");
});

/** 上传目标是否为桶根（根目录没有上一级，禁用「上一级」） */
const uploadTargetIsRoot = computed(() => uploadTargetPath.value === "");

/** 目录选择弹框 */
const uploadDirVisible = ref(false);
/** 目录选择树的根节点 */
const uploadTree = ref<TreeItem[]>([]);
/** 目录选择树加载中 */
const uploadTreeLoading = ref(false);
/** 目录选择中当前高亮的路径 */
const uploadDirCursor = ref("");

function openUpload(): void {
  uploadTargetPath.value = currentPath.value;
  uploadVisible.value = true;
}

function pickFiles(): void {
  uploadInput.value?.click();
}

/** 关闭上传弹框：还有没传完的项时先确认，避免白等 */
async function closeUpload(): Promise<void> {
  if (uploadItems.value.some((i) => i.status === "uploading" || i.status === "pending" || i.status === "paused")) {
    try {
      await ElMessageBox.confirm("还有文件未上传完成，确定关闭吗？未上传的文件将被丢弃。", "关闭上传", {
        type: "warning",
        confirmButtonText: "关闭",
        cancelButtonText: "继续上传",
      });
    } catch {
      return;
    }
    abortAllUploads();
  }
  uploadItems.value = [];
  uploadVisible.value = false;
  uploadDropActive.value = false;
  await loadObjects();
}

/** 中断全部进行中的上传（关闭弹框前调用） */
function abortAllUploads(): void {
  uploadItems.value.forEach((it) => {
    it.controller?.abort();
    it.controller = null;
  });
  uploadRunning = 0;
  uploading.value = false;
}

/**
 * 把选中的文件加入队列
 *
 * <p>只入队不立即上传，由「开始上传 / 全部开始」触发；超限文件当场拦下并提示，
 * 不进队列。</p>
 *
 * @param files 选中的文件
 */
function addUploadFiles(files: File[]): void {
  const tooLarge: string[] = [];
  const accepted: File[] = [];
  for (const f of files) {
    if (f.size > UPLOAD_MAX_BYTES) {
      tooLarge.push(f.name);
    } else {
      accepted.push(f);
    }
  }
  if (tooLarge.length) {
    message.error(`超过 500MB 上限：${tooLarge.join("、")}`);
  }
  if (!accepted.length) {
    return;
  }
  uploadItems.value = [
    ...uploadItems.value,
    ...accepted.map((f) => ({
      id: `u${(uploadSeq += 1)}`,
      name: f.name,
      size: f.size,
      file: f,
      status: "pending" as UploadStatus,
      percent: 0,
      error: "",
      controller: null,
    })),
  ];
}

/** 从队列移除一项（上传中的先中断） */
function removeUploadItem(item: UploadItem): void {
  item.controller?.abort();
  uploadItems.value = uploadItems.value.filter((i) => i.id !== item.id);
}

/** 找出队列中指定项的当前引用（数组整体替换后旧引用会失效） */
function findUploadItem(id: string): UploadItem | undefined {
  return uploadItems.value.find((i) => i.id === id);
}

/** 上传队列调度：并发不超过 {@link UPLOAD_CONCURRENCY}，有空闲就取下一个待传项 */
function pumpUploads(): void {
  uploading.value = uploadItems.value.some((i) => i.status === "uploading");
  while (uploadRunning < UPLOAD_CONCURRENCY) {
    const next = uploadItems.value.find((i) => i.status === "pending");
    if (!next) {
      break;
    }
    uploadRunning += 1;
    void runUpload(next.id);
  }
}

/**
 * 上传单个文件
 *
 * @param id 上传项 id
 */
async function runUpload(id: string): Promise<void> {
  const item = findUploadItem(id);
  if (!item) {
    uploadRunning = Math.max(0, uploadRunning - 1);
    return;
  }
  const controller = new AbortController();
  item.controller = controller;
  item.status = "uploading";
  item.error = "";
  item.percent = 0;
  try {
    await putObject(bucket.value, joinKey(uploadTargetPath.value, item.name), item.file, {
      signal: controller.signal,
      onProgress: (percent) => {
        const cur = findUploadItem(id);
        if (cur) {
          cur.percent = percent;
        }
      },
    });
    const cur = findUploadItem(id);
    if (cur) {
      cur.status = "done";
      cur.percent = 100;
    }
  } catch (e) {
    const cur = findUploadItem(id);
    if (cur) {
      if (isUploadAborted(e)) {
        // 暂停与关闭都会走这里：暂停保留进度供继续，关闭时整条队列已被丢弃
        cur.status = "paused";
        cur.controller = null;
      } else {
        cur.status = "error";
        cur.error = (e as Error)?.message ?? "上传失败";
        cur.controller = null;
      }
    }
  } finally {
    item.controller = null;
    uploadRunning = Math.max(0, uploadRunning - 1);
    pumpUploads();
    await loadObjects();
  }
}

/** 开始 / 继续全部待传项 */
function startAllUploads(): void {
  uploadItems.value.forEach((i) => {
    if (i.status === "paused") {
      i.status = "pending";
      i.percent = 0;
    }
  });
  pumpUploads();
}

/** 开始 / 继续单项 */
function startUploadItem(item: UploadItem): void {
  const cur = findUploadItem(item.id);
  if (!cur) {
    return;
  }
  cur.status = "pending";
  cur.percent = 0;
  cur.error = "";
  pumpUploads();
}

/**
 * 暂停一项
 *
 * <p>暂停即中断当前请求。后端不支持断点续传，所以「继续」是从头重传，
 * 进度会归零——这一点在按钮 title 里写明，不假装能续传。</p>
 *
 * @param item 上传项
 */
function pauseUploadItem(item: UploadItem): void {
  const cur = findUploadItem(item.id);
  if (!cur || cur.status !== "uploading") {
    return;
  }
  cur.controller?.abort();
}

/** 重试一项（失败后） */
function retryUploadItem(item: UploadItem): void {
  startUploadItem(item);
}

/* ---------- 上传目标目录选择 ---------- */

/** 打开目录选择弹框 */
async function openUploadDirPicker(): Promise<void> {
  uploadDirVisible.value = true;
  uploadDirCursor.value = uploadTargetPath.value;
  if (uploadTree.value.length) {
    return;
  }
  uploadTreeLoading.value = true;
  try {
    uploadTree.value = await getBucketTree(bucket.value);
  } catch (e) {
    message.error((e as Error)?.message ?? "目录树获取失败");
  } finally {
    uploadTreeLoading.value = false;
  }
}

/** 确认目录选择 */
function confirmUploadDir(): void {
  uploadTargetPath.value = uploadDirCursor.value;
  uploadDirVisible.value = false;
}

/** 目录树里逐级下钻（该路径有子节点才展开按钮） */
function uploadTreeChildren(path: string): TreeItem[] {
  if (!path) {
    return uploadTree.value;
  }
  const segs = path.split("/");
  let level = uploadTree.value;
  for (const s of segs) {
    const hit = level.find((n) => n.name === s);
    if (!hit) {
      return [];
    }
    level = hit.children ?? [];
  }
  return level;
}

/** 上传弹框内拖放悬停 */
function onUploadDragOver(e: DragEvent): void {
  if (!e.dataTransfer?.types.includes("Files")) {
    return;
  }
  e.preventDefault();
  e.dataTransfer.dropEffect = "copy";
  uploadDropActive.value = true;
}

function onUploadDragLeave(): void {
  uploadDropActive.value = false;
}

/** 拖放到上传弹框：加入队列而不是立刻上传 */
function onUploadDrop(e: DragEvent): void {
  if (!e.dataTransfer?.types.includes("Files")) {
    return;
  }
  e.preventDefault();
  uploadDropActive.value = false;
  addUploadFiles(Array.from(e.dataTransfer.files ?? []));
}

/** 选中文件后只入队，不自动开传 */
function handleFileChange(event: Event): void {
  const input = event.target as HTMLInputElement;
  const files = Array.from(input.files ?? []);
  input.value = "";
  addUploadFiles(files);
}

/**
 * 上传到指定目录（页面级拖放 / 拖到文件夹目录行共用）。
 *
 * <p>拖到文件区空白处时 {@code dir} 为当前目录；拖到某个文件夹行上时
 * 为该文件夹的完整键，保证「放到目录里」与提示一致，不再落到当前目录。</p>
 *
 * @param files 文件列表
 * @param dir   目标目录（桶内相对路径，空表示桶根）
 */
async function uploadFilesToDir(files: File[], dir: string): Promise<void> {
  if (!files.length) return;
  if (uploading.value) {
    message.warning("正在上传，请稍候");
    return;
  }
  uploading.value = true;
  let success = 0;
  try {
    for (const f of files) {
      await putObject(bucket.value, joinKey(dir, f.name), f);
      success++;
    }
    message.success(`上传成功 ${success} 个文件到「${dir || "/"}」`);
    await loadObjects();
  } catch (e) {
    message.error((e as Error)?.message ?? "上传失败");
  } finally {
    uploading.value = false;
  }
}

/** 执行上传：支持 FileList 与 DataTransferItem 的文件（页面级拖放，直接开传） */
async function doUpload(files: File[]): Promise<void> {
  await uploadFilesToDir(files, currentPath.value);
}

/* ================== 拖拽上传 ================== */

function onDragEnter(e: DragEvent): void {
  if (!e.dataTransfer?.types.includes("Files")) return;
  e.preventDefault();
  dragDepth++;
  dragging.value = true;
}

function onDragOver(e: DragEvent): void {
  if (!e.dataTransfer) return;
  // 内部拖拽（文件/目录移动复制）：允许在空白处放置（落到当前目录），不显示上传遮罩
  if (e.dataTransfer.types.includes(DRAG_MIME)) {
    e.preventDefault();
    e.dataTransfer.dropEffect = e.ctrlKey ? "copy" : "move";
    return;
  }
  if (!e.dataTransfer.types.includes("Files")) return;
  e.preventDefault();
  e.dataTransfer.dropEffect = "copy";
  dragging.value = true;
}

function onDragLeave(e: DragEvent): void {
  if (!e.dataTransfer?.types.includes("Files")) return;
  e.preventDefault();
  dragDepth = Math.max(0, dragDepth - 1);
  if (dragDepth === 0) dragging.value = false;
}

async function onDrop(e: DragEvent): Promise<void> {
  e.preventDefault();
  dragDepth = 0;
  dragging.value = false;
  // 内部拖拽：目录行/树节点放置时已 stopPropagation；落到这里表示放置在文件区空白处 → 当前目录
  if (e.dataTransfer?.types.includes(DRAG_MIME)) {
    await dropKeysTo(currentPath.value, e);
    return;
  }
  const files = Array.from(e.dataTransfer?.files ?? []);
  if (!files.length) return;
  if (uploading.value) {
    message.warning("正在上传，请稍候");
    return;
  }
  await doUpload(files);
}

// 全局拖拽事件（挂载时注册，卸载时移除）
function bindDragEvents(): void {
  document.addEventListener("dragenter", onDragEnter);
  document.addEventListener("dragover", onDragOver);
  document.addEventListener("dragleave", onDragLeave);
  document.addEventListener("drop", onDrop);
}

function unbindDragEvents(): void {
  document.removeEventListener("dragenter", onDragEnter);
  document.removeEventListener("dragover", onDragOver);
  document.removeEventListener("dragleave", onDragLeave);
  document.removeEventListener("drop", onDrop);
}

/* ================== 预览 ================== */

const previewVisible = ref(false);
/**
 * 压缩包「第一层」结构弹层（两层拆分，需求：点包内**文件**弹新对话框）。
 *
 * <p>本弹层现为<b>兜底通道</b>：顶层压缩包默认开 ReDialog 弹框
 * （{@link archiveDialogVisible}，FvArchivePanel 新插件直渲）；弹框内
 * 渲染失败（损坏包 / 不支持的压缩算法）时退回本弹层
 * （{@link onArchivePanelFallback}）。面板内用面包屑下钻目录；点文件才叠开
 * 第二层内容弹层（{@link previewVisible}，openArchiveEntry）。第一层在第二层
 * 打开期间保持挂载 —— 面包屑与展开状态因此原样保留，关掉第二层即回到原层级。
 * 其余类型不开本弹层，直接开内容弹层。</p>
 */
const archiveVisible = ref(false);
/**
 * 压缩包「新插件」预览弹框（FvArchivePanel / file-viewer archive 渲染器）。
 *
 * <p>压缩包打开直接开居中弹框（与图片 / 文档等内容预览同形态，
 * 不再走右侧抽屉）。包内浏览由 file-viewer 的 archive 渲染器在内存中
 * 接管（嵌套渲染），不再叠弹层。渲染失败时 {@link onArchivePanelFallback}
 * 关掉弹框、退回旧的两层弹层（{@link ArchivePreviewPanel}）。</p>
 */
const archiveDialogVisible = ref(false);

/**
 * 压缩包新插件渲染失败：关弹框，退回旧面板（ArchivePreviewPanel）兜底。
 */
function onArchivePanelFallback(): void {
  archiveDialogVisible.value = false;
  archiveVisible.value = true;
}

/** 压缩包新插件错误明细（界面由面板内 failReason 展示，这里只记录） */
function onArchivePanelError(msg: string): void {
  console.warn("[FileStorageManage] 压缩包新插件预览失败", msg);
}
const previewLoading = ref(false);
const previewName = ref("");
const previewKey = ref("");
/** 预览对象大小（字节）：音视频/地理面板的统计条要用，随 openPreview 一起记录 */
const previewSize = ref(0);
/**
 * 预览对象的 mtime
 *
 * <p>传给图片面板当原图字节缓存的版本标记：文件被覆盖后 mtime 变，
 * 面板自然不会命中上一版字节。非图片面板不用它。</p>
 */
const previewLastModified = ref(0);
const previewError = ref(false);
const iframeKey = ref(0);
const iframeLoading = ref(false);
/** 预览弹层外壳（内容区），仅用于裁剪结构，不再充当拖拽手柄 */
const previewShellRef = ref<HTMLElement | null>(null);

/**
 * 弹层标题：面板自带 header 已被移除（与 el-dialog 标题重复），
 * 文件名改由这里统一承载。
 */
const previewTitle = computed(() => {
  if (previewInnerPath.value) {
    return `${previewName.value} / ${previewInnerPath.value}`;
  }
  return previewName.value;
});


async function openPreview(row: StorageObject, key?: string): Promise<void> {
  // 开关门禁必须在最前面：预览被关闭时既不能打开预览弹框，
  // 也不能「因为不能预览就自动下载」。
  if (!guardPreview()) {
    return;
  }
  previewName.value = row.name;
  // 分栏视图的行可能来自祖先列，显式传入该列路径下的对象键，
  // 不能拿当前目录 currentPath 去拼（否则根目录文件会变成子目录路径）。
  previewKey.value = key ?? fullKey(row.name);
  previewSize.value = row.size ?? 0;
  previewLastModified.value = row.lastModified ?? 0;
  // 票据是异步的：先把旧地址清空，避免弹框先用上一个对象的地址闪一下
  previewSrc.value = "";
  void refreshPreviewSrc();
  previewError.value = false;
  previewForceServer.value = false;
  binaryFallback.value = false;
  // 服务端有转换器但**没有** HTML 渲染器的文档（ODF / RTF）：直接 `?preview=true`
  // 只会拿到提示卡或退化成 `???`。预置 format=pdf 走 Aspose 转换。
  // 详见 {@link needsPdfConvert}。
  previewUsePdf.value = needsPdfConvert(row.name);
  previewInnerPath.value = "";
  officeLoading.value = false;
  iframeLoading.value = true;
  previewLoading.value = false;
  // 压缩包：弹框直渲（FvArchivePanel 新插件，与图片 / 文档等内容预览
  // 同形态的居中 ReDialog；包内浏览由 file-viewer 内存渲染接管）。
  // 旧的两层弹层保留为兜底（见 onArchivePanelFallback）。其余类型直接开内容弹层。
  const isArchive = previewIsArchive.value;
  archiveDialogVisible.value = isArchive;
  archiveVisible.value = false;
  previewVisible.value = !isArchive;
}

/**
 * 预览对象直链。
 *
 * <p>用短时一次性票据而不是访问令牌：预览 iframe / {@code <img>} 无法自定义请求头，
 * 令牌进 URL 会留在浏览器历史与网关访问日志里。票据与直读共用同一条渲染通道，
 * 因此这里能带上的参数（{@code preview} / {@code format} / {@code inner} /
 * {@code render}）在票据路径上同样有效。</p>
 *
 * <p>票据是异步换来的，解析完成前为空串 —— 让 iframe 暂不发起请求，
 * 而不是先用「无令牌的直链」闪一下再被 401 打断。</p>
 */
const previewSrc = ref("");

/**
 * 预览弹层用的低清占位图直链
 *
 * <p>就是大图标视图里已经拉过的那张 172px 缩略图（已经进了内存缓存，不再发请求）。
 * 原图动辄 2MB、远端带宽只有 ~40KB/s，直接干等原图要几十秒；面板先把占位图
 * 放大模糊铺底，再等原图字节流回来替换，观感上「点开就有东西」。</p>
 *
 * <p>不在大图标视图时这张表是空的，面板会自己去要一张小图。</p>
 */
const previewThumbUrl = computed(() => thumbUrls.value[previewKey.value] ?? "");

/** 按需为当前预览对象签发票据并刷新直链 */
async function refreshPreviewSrc(): Promise<void> {
  if (!previewKey.value) {
    previewSrc.value = "";
    return;
  }
  previewSrc.value = await resolveObjectUrl(bucket.value, previewKey.value);
}

/** 客户端直渲用文件名：包内条目用条目名，顶层用原文件名（扩展名决定渲染器选择） */
const fileNameForClientRender = computed(
  () => innerEntryName.value || previewName.value,
);

/**
 * 当前预览是否由 file-viewer 直渲。
 *
 * <p>扩展名命中 preset-office 清单（含原生 PDF，由 renderer-pdf 处理），
 * 或已启用服务端 {@code ?format=pdf} 转换（转换结果同样交给 renderer-pdf）
 * 时，走 {@link PreviewOfficePanel}。</p>
 */
const previewUsesClient = computed(() =>
  isClientRenderable(fileNameForClientRender.value) || previewUsePdf.value,
);

/**
 * 当前文件是否走压缩包面板（{@link ArchivePreviewPanel}）。
 *
 * 压缩包不进 iframe：那条通道渲染出的是一张独立 HTML 页面，读不到主应用的
 * Element Plus / koi 主题变量，跟不上暗色模式与品牌色。改为在主应用文档内
 * 渲染面板，结构数据走 {@code ?format=archive} 取。
 */
const previewIsArchive = computed(() => kindOf(previewName.value) === "archive");

/**
 * 当前文件是否走图片面板（{@link PreviewImagePanel}）
 *
 * <p>图片此前走 iframe + {@code transform: scale()}：位图被浏览器插值重采样，
 * 放大必然模糊；且容器层面拿不到图像像素，无法裁剪、无法保存。改为 {@code <img>}
 * + Canvas 后，缩放/旋转/裁剪都作用在真实像素上，滚轮即可缩放，不必再挂顶部工具栏。</p>
 */
const showImagePanel = computed(() => kindOf(previewName.value) === "image");

/**
 * 当前文件是否走音视频兜底面板（{@link PreviewMediaPanel}）。
 *
 * <p>file-viewer renderer-media 已接管的 mp4/webm/m3u8/ogg 与常见音频
 * （mp3/wav/flac/aac/m4a/midi 等）不再走这里；只保留 file-viewer 未收录的
 * AIFF 转码与 mov/avi/mkv/wmv/3gp 等容器——后者浏览器通常解不了，
 * 面板会给出「下载后用 VLC 打开」的明确错误态。</p>
 */
const previewIsMedia = computed(() => isFallbackMedia(previewName.value));

/** 包内条目是否走音视频兜底面板（此时 previewName 是压缩包名，判型必须用条目名） */
const innerIsMedia = computed(() => {
  return previewInnerPath.value !== "" && isFallbackMedia(innerEntryName.value);
});

/** 是否展示音视频兜底面板（顶层媒体 或 压缩包内媒体下钻） */
const showMediaPanel = computed(() => previewIsMedia.value || innerIsMedia.value);

/** 音视频兜底面板的条目路径：顶层为空串，包内为包内路径 */
const mediaInnerPath = computed(() => (innerIsMedia.value ? previewInnerPath.value : ""));

/**
 * 当前文件是否走视频面板（{@link VideoPreviewPanel}）。
 *
 * <p>video.js 播放器接管原生容器 / HLS / FLV（扩展名清单见
 * {@link VIDEO_PANEL_EXTS}）。与音视频面板不冲突：本组扩展名
 * 命中后模板里视频面板分支在先；mov/avi/mkv 等浏览器解不了
 * 的容器仍由 {@link PreviewMediaPanel} 的「无法解码」错误态兜底。</p>
 */
const previewIsVideoPanel = computed(() =>
  VIDEO_PANEL_EXTS.has(extensionOf(previewName.value).toLowerCase()),
);

/** 包内条目是否走视频面板（判型必须用条目名） */
const innerIsVideoPanel = computed(
  () => previewInnerPath.value !== "" && VIDEO_PANEL_EXTS.has(extensionOf(innerEntryName.value).toLowerCase()),
);

/** 是否展示视频面板（顶层 或 压缩包内下钻） */
const showVideoPanel = computed(() => previewIsVideoPanel.value || innerIsVideoPanel.value);

/** 视频面板的条目路径：顶层为空串，包内为包内路径 */
const videoInnerPath = computed(() => (innerIsVideoPanel.value ? previewInnerPath.value : ""));

/**
 * 当前文件是否走 SWF 面板（{@link PreviewSwfPanel}）。
 *
 * <p>Flash 时代遗留的 .swf 用 Ruffle（WASM 模拟器）前端播放，属「兜底
 * 可看」而非保真复刻（ActionScript 3 支持度以 Ruffle 版本为准）。</p>
 */
const previewIsSwf = computed(() => kindOf(previewName.value) === "swf");

/** 包内条目是否是 SWF（判型用条目名） */
const innerIsSwf = computed(
  () => previewInnerPath.value !== "" && kindOf(innerEntryName.value) === "swf",
);

/** 是否展示 SWF 面板（顶层 或 压缩包内下钻） */
const showSwfPanel = computed(() => previewIsSwf.value || innerIsSwf.value);

/** SWF 面板的条目路径：顶层为空串，包内为包内路径 */
const swfInnerPath = computed(() => (innerIsSwf.value ? previewInnerPath.value : ""));

/**
 * 当前文件是否走 Sketch 面板（{@link SketchPreviewPanel}）。
 *
 * <p>.sketch 是 ZIP 容器，file-viewer 与后端均不支持；
 * 面板用 jszip 解出页面 / 画板结构，纯前端渲染。</p>
 */
const previewIsSketch = computed(() => kindOf(previewName.value) === "sketch");

/** 包内条目是否是 Sketch（判型用条目名） */
const innerIsSketch = computed(
  () => previewInnerPath.value !== "" && kindOf(innerEntryName.value) === "sketch",
);

/** 是否展示 Sketch 面板（顶层 或 压缩包内下钻） */
const showSketchPanel = computed(() => previewIsSketch.value || innerIsSketch.value);

/** Sketch 面板的条目路径：顶层为空串，包内为包内路径 */
const sketchInnerPath = computed(() => (innerIsSketch.value ? previewInnerPath.value : ""));

/** 图片面板保存成功后刷新当前目录，让列表里的缩略图与大小同步更新 */
function onImageSaved(): void {
  // 裁剪/旋转后宽高会变，探测缓存里的旧尺寸会让缩略图比例算错
  clearImageMetaCache();
  // 原图字节缓存也要按对象失效：否则再次打开预览会命中保存前的旧字节
  if (previewKey.value) {
    dropImageBlob(bucket.value, previewKey.value);
  }
  void loadObjects();
  message.success("图片已更新");
}

/**
 * 该文件是否应走服务端「转 PDF」通道预览。
 *
 * <p>这些格式的共同点是：**服务端没有可用的 HTML 渲染器，但 Aspose 能转成 PDF**，
 * 且 preset-office 也未收录为可直渲染扩展名（odt/ods/odp/rtf 已在
 * {@code CLIENT_RENDERABLE_EXTS} 中直接走前端，不再预转 PDF）。</p>
 *
 * <ul>
 *   <li><b>ODF 模板（ott/ots/otp）</b>：SPI 提供器只回一张
 *       「需配置 LibreOffice」的提示卡；而 Aspose 三个转换器都能直接读，
 *       实测转出 23 KB / 7.6 KB / 14.8 KB 的有效 PDF。</li>
 *   <li><b>传统二进制 Word（doc）</b>：file-viewer 的 renderer-word 对部分
 *       97-2003 CFB 样本会抛 sector loop；后端 Aspose 转换可稳定出 PDF，
 *       且转换结果仍交给 file-viewer 的 renderer-pdf 渲染。</li>
 * </ul>
 *
 * <p>WPS 家族（wps/wpt/et/ett/dps）**不在此列**：它们按内容魔数改名后可由
 * preset-office 直接渲染（见 {@code officeRenderer#resolveViewerFileName}），
 * 只有在客户端解析失败时才由 PreviewOfficePanel 探测 {@code ?format=pdf} 兜底。</p>
 *
 * <p>注意：这条通道原本**只有「客户端组件失败后回报 channel:pdf」才会走**；
 * 而上述扩展名都不在 preset-office 清单内，客户端直渲分支本来轮不到它们，
 * 所以必须在预览入口预置 {@code previewUsePdf=true}（同时让
 * {@code previewUsesClient} 命中同一面板）。</p>
 *
 * @param name 文件名
 * @returns true 表示应走 PDF 转换通道
 */
function needsPdfConvert(name: string): boolean {
  const ext = name.slice(name.lastIndexOf(".") + 1).toLowerCase();
  // wps 不再在此列：它现在按**内容魔数**分流（见 officeRenderer#resolveViewerFileName）。
  // 新版 WPS 存的是 OOXML ZIP 容器，改名 .docx 后 preset-office 可纯前端直渲；
  // 老版 OLE2 改名 .doc 交给传统二进制解析器。两者都失败时，PreviewOfficePanel
  // 的 fallbackAfterClientError 会探测 ?format=pdf（后端 AsposeWord 支持 wps，
  // 实测能出真 PDF），所以「纯前端优先 + 服务端兜底」两不误。
  //
  // et / ett / dps 同理：不在本列，先按魔数改名直渲，失败再探 format=pdf。
  //
  // ppt / pot：老式二进制 PowerPoint（OLE2）。file-viewer 的 preset-office 只认
  // OOXML，直接交给它只会得到空白面板（实测 .ppt/.pot 预览面板无内容、仅工具栏），
  // 故与 doc 同走服务端 aspose-ppt 转 PDF 通道（FileStorageServerFilter 的
  // ?format=pdf 分支；aspose-ppt 覆盖 ppt/pptx，转不了时后端标记 convert=unavailable）。
  return ["ott", "ots", "otp", "doc", "ppt", "pot"].includes(ext);
}

/**
 * 压缩包内正在预览的条目路径（空串表示只看包结构）。
 *
 * 非空时从面板切到 iframe，用 {@code ?preview&inner=包内路径} 让后端
 * 提取该条目并按其类型渲染——压缩包只负责「结构」这一层，
 * 文件内容渲染仍复用既有通道，避免为每种格式再写一套。
 */
const previewInnerPath = ref("");

/** 包内条目文件名（取路径末段，供类型判定用） */
const innerEntryName = computed(() => {
  const p = previewInnerPath.value;
  if (!p) {
    return "";
  }
  const slash = p.lastIndexOf("/");
  return slash >= 0 ? p.slice(slash + 1) : p;
});

/**
 * 当前文件是否走 TGA / Sketch / SWF 等 file-viewer 不支持或自研增强面板。
 *
 * <p>这些面板都在主应用文档内渲染（iframe 是独立文档，读不到 koi 主题变量），
 * 所以点包内条目时不该再置 iframe 加载态，否则骨架屏会一直挂在面板上。</p>
 *
 * @param name 文件名
 * @returns true 表示由前端面板渲染
 */
function isClientPanelFile(name: string): boolean {
  const kind = kindOf(name);
  if (
    kind === "tiff" || kind === "heic" || kind === "design" || kind === "tga" ||
    kind === "bpmn" || kind === "ofd" || kind === "drawio" ||
    kind === "dicom" || kind === "swf" || kind === "sketch"
  ) {
    return true;
  }
  const ext = extensionOf(name);
  return CLIENT_DATA_EXTS.has(ext) || CLIENT_PSD_EXTS.has(ext);
}

/** 当前文件 / 包内条目分别命中的自研兜底面板（file-viewer 不支持才走这里） */
const previewIsTga = computed(() => kindOf(previewName.value) === "tga");

const innerIsTga = computed(() => previewInnerPath.value !== "" && kindOf(innerEntryName.value) === "tga");

/**
 * 自研兜底面板的显隐与条目路径
 *
 * <p>均带 {@code !previewForceServer}：面板解码失败会 {@code fallback} 一次，
 * 父组件把 {@code previewForceServer} 置位后这些分支必须全部让开，
 * 否则会「退回服务端」却仍卡在同一个失败面板上（死循环）。</p>
 */
const showTgaPanel = computed(() => (previewIsTga.value || innerIsTga.value) && !previewForceServer.value);

const tgaPanelInnerPath = computed(() => (innerIsTga.value ? previewInnerPath.value : ""));

/** file-viewer renderer-3d 未登记 OFF，保留自研 three 行式解析兜底 */
const previewIsOff = computed(() => extensionOf(previewName.value).toLowerCase() === "off");
const innerIsOff = computed(
  () => previewInnerPath.value !== "" && extensionOf(innerEntryName.value).toLowerCase() === "off",
);
const showOffPanel = computed(() => (previewIsOff.value || innerIsOff.value) && !previewForceServer.value);
const offInnerPath = computed(() => (innerIsOff.value ? previewInnerPath.value : ""));

/** 预览包内条目：叠开第二层内容弹层（第一层结构弹层保持打开，面包屑状态保留）；
 *  file-viewer 与自研兜底面板自己发请求，其余切到 iframe 通道 */
function openArchiveEntry(path: string): void {
  previewInnerPath.value = path;
  previewVisible.value = true;
  // 再次下钻前复位内容层状态：上次关闭时 onEntryDialogClosed → retryPreview 会把
  // previewLoading 置回 true（骨架），不清掉会让骨架盖住新条目、看不到内容链路。
  previewError.value = false;
  previewLoading.value = false;
  const slash = path.lastIndexOf("/");
  const name = slash >= 0 ? path.slice(slash + 1) : path;
  const kind = kindOf(name);
  if (
    kind === "model" || kind === "video" || kind === "audio" || kind === "geo" ||
    kind === "sketch" ||
    isClientPanelFile(name) || isFvPanelFile(name) || isVideoPanelFile(name)
  ) {
    // 面板自己签票据、自己发请求并维护加载态，iframe 加载态会让骨架屏挂在它上面
    return;
  }
  iframeLoading.value = true;
  iframeKey.value++;
}

/**
 * 从包内文件返回压缩包结构：关掉第二层内容弹层即可 —— 第一层结构弹层全程没关，
 * 面板没被卸载，面包屑与展开状态原样保留。路径清空放在关闭动画结束的
 * {@link onEntryDialogClosed} 里，避免过渡期间内容链路回退闪一下。
 */
function backToArchive(): void {
  previewVisible.value = false;
}

/** 内容弹层关闭收尾：清掉包内路径（回到「只看包结构」），并复位加载/错误态 */
function onEntryDialogClosed(): void {
  previewInnerPath.value = "";
  retryPreview();
}

/**
 * 是否已退回服务端渲染。
 *
 * 客户端组件解析失败时置位，iframe 地址追加 render=server，
 * 触发后端 ConvertSupport / SPI 提供者渲染。
 */
const previewForceServer = ref(false);

/**
 * 是否让服务端把文档转成 PDF 后再给 iframe
 *
 * <p>客户端组件吃不下、且服务端也没有 HTML 渲染器时（实测 OLE2 的 .doc/.xls），
 * 改走 {@code ?format=pdf}：服务端用 Aspose 转成 PDF，浏览器内置 PDF 阅读器渲染。
 * 这条通道由 {@code PreviewOfficePanel} 探测后通过 {@code channel: "pdf"} 告知。</p>
 */
const previewUsePdf = ref(false);

/** 客户端渲染加载中状态 */
const officeLoading = ref(false);

/** 客户端渲染面板引用 */
const officePanelRef = ref<InstanceType<typeof PreviewOfficePanel>>();

/**
 * 前端直渲面板解码失败：切到服务端渲染通道
 *
 * <p>TIFF / HEIC / PSD / SQLite / Parquet 这几个面板自己拉字节解码，
 * 碰到解不开的文件（罕见压缩、16 位通道、声明超大画布的坏文件）就发
 * {@code fallback}，由这里统一退回 iframe 的服务端通道（{@code render=server}）。
 * 面板分支都带 {@code !previewForceServer}，所以只会退一次，不会来回空转。</p>
 */
function onClientPanelFallback(): void {
  console.error("[FS_FALLBACK_EVENT]", extensionOf(fileNameForClientRender.value).toLowerCase(), fileNameForClientRender.value);
  const ext = extensionOf(fileNameForClientRender.value).toLowerCase();
  if (!binaryFallback.value && BINARY_FALLBACK_EXTS.has(ext)) {
    binaryFallback.value = true;
    previewError.value = false;
    iframeLoading.value = false;
    return;
  }
  if (previewForceServer.value || previewUsePdf.value) {
    // 已经退过一次还在失败：交给通用错误态，别再反复切通道
    previewError.value = true;
    return;
  }
  previewForceServer.value = true;
  iframeLoading.value = true;
  iframeKey.value++;
}

/**
 * 预览 iframe 地址：统一走后端预览通道 {@code ?preview=true}。
 *
 * <p>所有类型（图片/文本/PDF/Office/音视频/压缩包等）一致，由后端按类型内联渲染或直出字节；
 * 底址是短时一次性票据（不含访问令牌），故分隔符仍需按已有查询串取 &/?。
 * 客户端渲染失败退回时追加 {@code render=server}，要求后端走服务端渲染链路。</p>
 *
 * <p>预览压缩包内条目时追加 {@code inner=包内路径}，后端据此提取条目并按
 * 条目自身类型渲染（见 {@link openArchiveEntry}）。</p>
 *
 * <p>打包成 file-viewer 直渲的地址：PDF 与 {@code ?format=pdf} 转换结果都由
 * {@link PreviewOfficePanel} 取回字节后用 renderer-pdf 渲染，不再经 pdf.js
 * viewer.html 包装。</p>
 */
const previewFrameSrc = computed(() => {
  const base = previewSrc.value;
  if (!base) {
    // 票据是异步换来的：解析完成前不构造任何地址，避免 iframe 拿相对地址
    // 把当前应用页自己再加载一遍（src="" 会解析成 document.URL）。
    return "";
  }
  const sep = base.includes("?") ? "&" : "?";
  // 兜底通道互斥：能转 PDF 就**不**再要求服务端渲染，否则地址里会同时出现
  // render=server 与 format=pdf（两个参数语义冲突）。
  const pdf = previewUsePdf.value ? "&format=pdf" : "";
  const server = previewForceServer.value && !previewUsePdf.value ? `&render=${RENDER_SERVER}` : "";
  const inner = previewInnerPath.value ? `&inner=${encodeURIComponent(previewInnerPath.value)}` : "";
  return `${base}${sep}preview=true${server}${pdf}${inner}${iframeKey.value > 0 ? `&_t=${iframeKey.value}` : ""}`;
});

/**
 * 读取并剥掉「新窗口预览」标记 {@code ?preview=<完整 key>}（一次性，读完即焚）
 *
 * <p>标记同时可能出现在 {@code location.search} 与 hash 查询串
 * （{@code #/files?preview=...}）两处，两处都要剥 —— 否则刷新后又会自动打开
 * 一次。剥除走 {@code history.replaceState}，不触发路由跳转也不产生历史记录。</p>
 *
 * @returns 标记值（已解码的完整 key）；不存在返回空串
 */
function takePreviewFlag(): string {
  const value = urlFlag("preview");
  if (!value) return "";
  const url = new URL(window.location.href);
  url.searchParams.delete("preview");
  const hi = url.hash.indexOf("?");
  if (hi >= 0) {
    const qs = new URLSearchParams(url.hash.slice(hi + 1));
    if (qs.has("preview")) {
      qs.delete("preview");
      const rest = qs.toString();
      url.hash = rest ? `${url.hash.slice(0, hi)}?${rest}` : url.hash.slice(0, hi);
    }
  }
  history.replaceState(history.state, "", url.toString());
  return value;
}

/**
 * 「预览（新窗口）」：复用应用页自身的自动预览链路
 *
 * <p>新窗口打开「当前应用地址 + {@code ?preview=<完整 key>}」，由
 * {@link onMounted} 中 {@link takePreviewFlag} 一次性消费后自动弹出与弹框
 * 相同的预览面板。不再依赖文件服务器上的 standalone preview.html —— 该静态
 * 入口未随当前后端部署，公共/私有桶直链都可能在独立窗口打不开。</p>
 *
 * @param row 目标对象（非目录）
 */
function openPreviewInNewTab(row: StorageObject): void {
  if (row.directory || !guardPreview()) {
    return;
  }
  const url = new URL(window.location.href);
  url.searchParams.set("preview", fullKey(row.name));
  window.open(url.toString(), "_blank");
}


const iframePanelRef = ref<InstanceType<typeof PreviewIframePanel>>();

function onFrameLoad(): void { previewLoading.value = false; iframeLoading.value = false; previewError.value = false; }
function onFrameError(): void { previewLoading.value = false; iframeLoading.value = false; previewError.value = true; }
function retryPreview(): void { previewError.value = false; binaryFallback.value = false; previewLoading.value = true; iframeLoading.value = true; iframeKey.value++; }

/** 客户端直渲染完成 */
function onOfficeRendered(): void { officeLoading.value = false; previewLoading.value = false; }

/**
 * 客户端直渲染失败：按失败原因决定去向。
 *
 * <p>「不要再退回服务端」与「可以退回服务端」必须分开：</p>
 * <ul>
 *   <li>{@code noFallback}：内容损坏（服务端拿到的还是同一堆坏字节），或服务端
 *       也没有该格式的渲染器（实测 OLE2 的 .xls）。此时退回只会把面板自己的中文提示
 *       顶掉，换成一个空白/乱码的 iframe。保留面板、清掉骨架屏。</li>
 *   <li>否则：追加 {@code render=server} 走 SPI / 转换链路。</li>
 * </ul>
 *
 * @param payload 失败信息
 */
function onOfficeError(payload?: { noFallback?: boolean; reason?: string; channel?: "server" | "pdf" }): void {
  officeLoading.value = false;
  if (payload?.noFallback) {
    // 面板自己会展示 failReason，这里只负责把骨架屏撤掉并保持该面板挂载
    previewLoading.value = false;
    previewError.value = false;
    return;
  }
  if (!previewForceServer.value && !previewUsePdf.value) {
    // 按探测结果选兜底通道：能转 PDF 就转 PDF，且转换结果仍由 file-viewer
    // 的 renderer-pdf 接管（不能置 previewForceServer，否则会掉进 iframe
    // 服务端预览 / 浏览器原生 PDF 查看器）；否则退回服务端渲染。
    if (payload?.channel === "pdf") {
      previewUsePdf.value = true;
      return;
    }
    previewForceServer.value = true;
    return;
  }
  // 已退回兜底通道仍失败，交给通用错误态
  previewUsePdf.value = false;
  previewError.value = true;
}

/**
 * 预览弹层快捷键。
 *
 * <p>缩放 / 全屏 / 帮助的工具条已按产品要求移除，故这里不再处理
 * {@code + - 0 R F ?}：留着只会让按键「看起来有反应」却什么都不做，
 * 例如 R 在图片面板里是旋转、在父组件里曾被当成重置缩放，两边含义还不一致。</p>
 *
 * <p>只保留 Esc：退出全屏，或在图片态直接关掉弹层。</p>
 */
function onPreviewKeydown(e: KeyboardEvent): void {
  const tag = (e.target as HTMLElement)?.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
  if (e.key === "Escape") {
    if (document.fullscreenElement) {
      e.preventDefault();
      e.stopPropagation();
      document.exitFullscreen();
    } else if (showImagePanel.value) {
      e.preventDefault();
      previewVisible.value = false;
    }
  }
}
watch(previewVisible, (v) => { v ? document.addEventListener("keydown", onPreviewKeydown) : document.removeEventListener("keydown", onPreviewKeydown); });
onUnmounted(() => { document.removeEventListener("keydown", onPreviewKeydown); stopLinkManageTicker(); });

/**
 * 文件列表快捷键：F2 行内重命名，Ctrl/Cmd+C/X/V 复制/剪切/粘贴。
 *
 * <p>输入框、文本域、下拉框、内容可编辑元素以及 Element Plus 弹层打开时
 * 一律放行，避免把用户正在输入的按键当成文件操作。</p>
 */
/**
 * 是否已有“真正打开”的 Element Plus 遮罩层。
 *
 * <p>不能只看 {@code document.querySelector(".el-overlay")}：监控壳/主题组件会在
 * 页面里保留多个 {@code display:none} 的隐藏遮罩节点，若按存在性判断，
 * F2 / Ctrl+C / Ctrl+X 会永远被当成“弹层打开”直接放行。</p>
 */
function hasOpenOverlay(): boolean {
  return [...document.querySelectorAll(".el-overlay")].some((el) => {
    if (!(el instanceof HTMLElement)) return false;
    const style = getComputedStyle(el);
    return (
      style.display !== "none" &&
      style.visibility !== "hidden" &&
      style.pointerEvents !== "none" &&
      Number(style.opacity) > 0 &&
      el.getClientRects().length > 0
    );
  });
}

function onFileKeydown(e: KeyboardEvent): void {
  const target = e.target as HTMLElement | null;
  if (
    target &&
    (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT" || target.isContentEditable)
  ) {
    return;
  }
  if (hasOpenOverlay()) return;
  if (nav.value !== "all") return;
  if (e.key === "F2") {
    e.preventDefault();
    void startInlineRename();
    return;
  }
  if (!(e.ctrlKey || e.metaKey)) return;
  const key = e.key.toLowerCase();
  if (key === "c") {
    e.preventDefault();
    onCopySelected();
  } else if (key === "x") {
    e.preventDefault();
    onCutSelected();
  } else if (key === "v") {
    e.preventDefault();
    void onPaste();
  }
}

/* ================== 下载 / 检查 / 删除 ================== */

/** 通过隐藏锚点触发浏览器下载，避免 window.open 新标签页闪烁/抖动 */
function triggerDirectDownload(url: string, name: string): void {
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  anchor.rel = "noopener";
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

/** 下载单个对象：用短时一次性票据直连，令牌不落 URL */
async function handleDownload(row: StorageObject, key?: string): Promise<void> {
  if (!guardDownload()) {
    return;
  }
  const objectKey = key ?? fullKey(row.name);
  const url = await resolveObjectUrl(bucket.value, objectKey, {
    params: { download: "true" },
  });
  triggerDirectDownload(url, row.name);
}

async function handleExist(row: StorageObject): Promise<void> {
  try {
    const exists = await existObject(bucket.value, fullKey(row.name));
    message[exists ? "success" : "warning"](exists ? `「${row.name}」存在` : `「${row.name}」不存在`);
  } catch (e) { message.error((e as Error)?.message ?? "检查失败"); }
}

async function handleDelete(row: StorageObject): Promise<void> {
  // 多选模式：删除选中集中的所有文件（目录保留单独删除）
  const targets = selected.value.size > 1 && selected.value.has(row.name)
    ? [...selected.value].map((name) => ({ name } as StorageObject))
    : [row];
  const label = targets.length > 1 ? `确认将选中的 ${targets.length} 个对象移入回收站？` : `确认将「${row.name}」移入回收站？`;
  try { await ElMessageBox.confirm(label, "移入回收站", { type: "warning" }); } catch { return; }
  try {
    await moveToRecycle(targets);
    message.success(`已移入回收站 ${targets.length} 个对象`);
    clearSelect();
    await Promise.all([loadObjects(), loadRecycle()]);
  } catch (e) { message.error((e as Error)?.message ?? "删除失败"); }
}

/* ================== 创建链接（一次性 / 限时） ================== */

const oneTimeVisible = ref(false);
const oneTimeLink = ref("");
const oneTimeType = ref<"once" | "expiry">("once");
/** 过期时间（秒）：expiry 模式必填；once 模式不使用 */
const oneTimeExpiry = ref(600);
const oneTimeExpiryOptions = [
  { label: "10 秒", value: 10 }, { label: "30 秒", value: 30 },
  { label: "1 分钟", value: 60 }, { label: "5 分钟", value: 300 },
  { label: "10 分钟", value: 600 }, { label: "30 分钟", value: 1800 },
  { label: "1 小时", value: 3600 }, { label: "6 小时", value: 21600 },
  { label: "1 天", value: 86400 },
];
const oneTimeGenerating = ref(false);
const oneTimeTarget = ref<{ name: string; key: string }>();

function openOneTime(row: StorageObject): void {
  if (row.directory) { message.warning("目录不支持生成访问链接"); return; }
  oneTimeTarget.value = { name: row.name, key: fullKey(row.name) };
  oneTimeLink.value = "";
  oneTimeType.value = "once";
  // once 无需过期时间（展示默认值即可）
  oneTimeExpiry.value = 600;
  oneTimeVisible.value = true;
}

/* ================== 右键直出限时链接（自定义过期时间） ================== */

/** 自定义过期弹框可见性 */
const quickExpiryVisible = ref(false);
/** 自定义过期输入（支持 30s / 15m / 2h / 7d / 纯数字秒） */
const quickExpiryInput = ref("2h");
const quickExpiryBusy = ref(false);
const quickExpiryResult = ref("");
const quickExpiryTarget = ref<{ name: string; key: string }>();

/*
 * 过期时长解析已抽到 {@link parseExpiryToSeconds}（utils/expiry.ts）。
 * 抽出来的原因：它与后端 parseOneTimeExpiry 是一份跨端约定，
 * 内嵌在 SFC 里既没法单测，改规则时也极易只改一处。
 */

/** 打开「自定义过期时间」弹框（右键直达，不经过一次性/限时二选一那一步） */
function openQuickExpiry(row: StorageObject): void {
  if (row.directory) {
    message.warning("目录不支持生成访问链接");
    return;
  }
  quickExpiryTarget.value = { name: row.name, key: fullKey(row.name) };
  quickExpiryInput.value = "2h";
  quickExpiryResult.value = "";
  quickExpiryVisible.value = true;
}

/** 生成限时链接（有效期内可多次访问） */
async function generateQuickExpiryLink(): Promise<void> {
  if (!quickExpiryTarget.value) {
    return;
  }
  const seconds = parseExpiryToSeconds(quickExpiryInput.value);
  if (!seconds) {
    message.warning("过期时间格式不对，例：30s / 15m / 2h / 7d 或纯数字秒（最长 30 天）");
    return;
  }
  quickExpiryBusy.value = true;
  try {
    const res = await createOneTimeLink(bucket.value, quickExpiryTarget.value.key, seconds, "expiry");
    quickExpiryResult.value = `${getServerBase().replace(/\/+$/, "")}${res.url}`;
    message.success(`限时链接已生成（${quickExpiryInput.value.trim()} 内可多次访问）`);
  } catch (e) {
    message.error((e as Error)?.message ?? "生成失败");
  } finally {
    quickExpiryBusy.value = false;
  }
}

/** 复制自定义过期链接（复用一次性链接的剪贴板实现） */
function copyQuickExpiryLink(): void {
  if (!quickExpiryResult.value) {
    return;
  }
  oneTimeLink.value = quickExpiryResult.value;
  copyOneTimeLink();
}

async function generateOneTimeLink(): Promise<void> {
  if (!oneTimeTarget.value) return;
  // expiry 模式需合法过期时间（兜底分钟：一次性无此项）
  let expires: number | undefined;
  if (oneTimeType.value === "expiry") {
    expires = Number(oneTimeExpiry.value);
    if (!Number.isFinite(expires) || expires <= 0) {
      message.warning("请输入有效的过期时间（秒）");
      return;
    }
    expires = Math.floor(expires);
  }
  oneTimeGenerating.value = true;
  try {
    const res = await createOneTimeLink(bucket.value, oneTimeTarget.value.key, expires, oneTimeType.value);
    oneTimeLink.value = `${getServerBase().replace(/\/+$/, "")}${res.url}`;
    message.success(oneTimeType.value === "once" ? "一次性链接已生成（仅可访问一次）" : "限时链接已生成（有效期内可多次访问）");
  } catch (e) { message.error((e as Error)?.message ?? "生成失败"); }
  finally { oneTimeGenerating.value = false; }
}

function copyOneTimeLink(): void {
  if (!oneTimeLink.value) return;
  const el = document.createElement("textarea");
  el.value = oneTimeLink.value;
  document.body.appendChild(el);
  el.select();
  try { document.execCommand("copy"); message.success("已复制到剪贴板"); }
  catch { message.error("复制失败"); }
  el.remove();
}

/* ================== 链接管理（查看 / 关闭指定链接） ================== */

const linkManageVisible = ref(false);
const linkManageLoading = ref(false);
const linkManageError = ref("");
const linkManageRows = ref<OneTimeLinkItem[]>([]);
/**
 * ReTable 的 :data 收 Array<Record<string, unknown>>，而 OneTimeLinkItem 没有索引签名，
 * 直接传 ref 会类型不兼容。这里浅拷贝一层做结构化兼容（与 UploadTaskView.fileRows 同款）。
 */
const linkManageTableRows = computed<Array<Record<string, unknown>>>(() =>
  linkManageRows.value.map((row) => ({ ...row })),
);
/** 用于「剩余有效期」每秒重算，避免把首次拉取的 remainingMs 冻结 */
const linkManageNow = ref(Date.now());
let linkManageTicker: ReturnType<typeof setInterval> | undefined;

function stopLinkManageTicker(): void {
  if (linkManageTicker !== undefined) {
    clearInterval(linkManageTicker);
    linkManageTicker = undefined;
  }
}

async function loadLinkManage(): Promise<void> {
  linkManageLoading.value = true;
  linkManageError.value = "";
  try {
    linkManageRows.value = await listOneTimeLinks();
    linkManageNow.value = Date.now();
  } catch (e) {
    linkManageError.value = (e as Error)?.message ?? "读取链接列表失败";
  } finally {
    linkManageLoading.value = false;
  }
}

async function openLinkManage(): Promise<void> {
  linkManageVisible.value = true;
  stopLinkManageTicker();
  linkManageTicker = setInterval(() => {
    linkManageNow.value = Date.now();
  }, 1000);
  await loadLinkManage();
}

function onLinkManageClosed(): void {
  stopLinkManageTicker();
  linkManageRows.value = [];
  linkManageError.value = "";
}

/** 链接剩余时间：优先按 expiresAt 与当前时间实时计算 */
function linkRemainingText(row: OneTimeLinkItem): string {
  const remain = Math.max(0, (row.expiresAt || 0) - linkManageNow.value);
  if (remain <= 0) return "已过期";
  const totalSec = Math.floor(remain / 1000);
  const d = Math.floor(totalSec / 86400);
  const h = Math.floor((totalSec % 86400) / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (d > 0) return `${d} 天 ${h} 小时`;
  if (h > 0) return `${h} 小时 ${m} 分`;
  if (m > 0) return `${m} 分 ${s} 秒`;
  return `${s} 秒`;
}

function linkTypeText(row: OneTimeLinkItem): string {
  return row.type === "once" || row.once ? "一次性" : "限时";
}

function linkExpireText(row: OneTimeLinkItem): string {
  if (!row.expiresAt) return "-";
  const dt = new Date(row.expiresAt);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())} ${pad(dt.getHours())}:${pad(dt.getMinutes())}:${pad(dt.getSeconds())}`;
}

function copyManagedLink(row: OneTimeLinkItem): void {
  const full = `${getServerBase().replace(/\/+$/, "")}${row.url}`;
  const el = document.createElement("textarea");
  el.value = full;
  document.body.appendChild(el);
  el.select();
  try { document.execCommand("copy"); message.success("链接已复制"); }
  catch { message.error("复制失败"); }
  el.remove();
}

async function closeManagedLink(row: OneTimeLinkItem): Promise<void> {
  try {
    await ElMessageBox.confirm(
      `关闭后该链接立即失效，无法再通过它访问「${row.name}」。确定关闭？`,
      "关闭访问链接",
      { type: "warning", confirmButtonText: "关闭链接", cancelButtonText: "取消" },
    );
  } catch {
    return;
  }
  try {
    await revokeOneTimeLink(row.token);
    linkManageRows.value = linkManageRows.value.filter((it) => it.token !== row.token);
    message.success(`已关闭「${row.name}」的访问链接`);
  } catch (e) {
    message.error((e as Error)?.message ?? "关闭失败");
    await loadLinkManage();
  }
}

onMounted(async () => {
  document.addEventListener("keydown", onFileKeydown);
  // 先请求 filesystem-starter 的配置接口，拿到当前部署形态与地址（embedded/standalone）。
  // 成功则以配置接口为准；失败（旧后端 404/403）回退 app.yaml/localStorage/origin，
  // 但必须提示，避免用户误以为仍在用后端当前配置。
  await loadFileServerConfig();
  if (isFileServerConfigDiscovered() === false) {
    const err = getFileServerConfigError();
    // 调试/验收用：Playwright 可直接读取，不等 UI 浮层
    document.documentElement.dataset.fsConfigError = String(err?.status || 0);
    document.documentElement.dataset.fsConfigFallback = "true";
    message.warning(err?.status ? `文件服务器配置获取失败（${err.status}），已使用本地配置` : "文件服务器配置获取失败，已使用本地配置");
  } else if (isFileServerConfigDiscovered() === true) {
    document.documentElement.dataset.fsConfigError = "0";
    document.documentElement.dataset.fsConfigFallback = "false";
  }
  server.value = getServerBase() || DEFAULT_SERVER;
  bucket.value = resolveBucket() || getDefaultBucket() || DEFAULT_BUCKET;
  // 「预览（新窗口）」标记：先读并剥掉（一次性，两处地址都剥），否则刷新后又会自动打开
  const autoPreviewKey = takePreviewFlag();
  // 必须排在最前：视图/目录/排序都从这里恢复，后面所有播种都基于恢复后的值
  applyUiState(bucket.value);
  // ?preview 指定文件的所在目录覆盖记忆路径：openPreview 要用 fullKey(row.name)
  // 拼出完整 key，只有当前目录正好是它的父级才拼得对
  if (autoPreviewKey) {
    const slash = autoPreviewKey.lastIndexOf("/");
    currentPath.value = slash > 0 ? autoPreviewKey.slice(0, slash) : "";
  }
  loadBucketConfig();
  loadCapabilities();
  // 播种初始历史：起始目录就是历史栈的第一条，否则后退/前进的索引会整体错位一格
  recordHistory(currentPath.value);
  void (async () => {
    await loadObjects();
    if (!autoPreviewKey) return;
    const name = autoPreviewKey.slice(autoPreviewKey.lastIndexOf("/") + 1);
    const row = objects.value.find((o) => o.name === name && !o.directory)
      // 列表里找不到（刚被删除/无权限）时也照样弹：key 已知，让票据环节去报错
      ?? { name, directory: false, size: 0 };
    void openPreview(row);
  })();
  loadRecycle();
  bindDragEvents();
});

// 界面状态变化即按当前桶落盘（切桶时由下面的 watch 负责先给旧桶补一次）
watch([viewMode, currentPath, sortKey, sortOrder], () => {
  writeUiState(bucket.value);
});

/**
 * 切换存储桶：旧桶落盘 → 套用新桶的界面状态 → 重新加载
 *
 * <p>分栏缓存 {@link colObjects} 必须一起清掉：它是按目录路径做 key 的，
 * 换桶后同名路径（如 `1`）指向的完全是另一个存储，不清就会显示旧桶的内容。</p>
 *
 * <p>当前版本还没有桶切换入口（{@code bucket} 只在初始化时从 URL / 默认桶赋值），
 * 所以这个 watch 暂时不会触发；带 {@code ?bucket=} 换桶走的是整页加载，
 * 由 {@link onMounted} 里的 {@link applyUiState} 负责恢复。这里先把切桶路径铺好，
 * 以后加切换器时「各自独立记忆」才不用重写。</p>
 */
watch(bucket, (now, prev) => {
  if (prev) {
    writeUiState(prev);
  }
  applyUiState(now);
  recordHistory(currentPath.value);
  refreshColumns();
  page.value = 1;
  loadObjects();
  loadBucketConfig();
  loadCapabilities();
  void refreshThumbUrls();
});

// 缩略图直链依赖四件事：目录内容、当前桶、配置指纹（?preview 的渲染结果）、
// 以及是否处于大图标模式。少触发一项就会看到「配置改了缩略图不更新」这类陈旧画面。
watch([sortedObjects, configStamp, viewMode], () => {
  void refreshThumbUrls();
});

onUnmounted(() => {
  unbindDragEvents();
  document.removeEventListener("click", closeContextMenu);
  document.removeEventListener("keydown", onFileKeydown);
});
</script>

<template>
  <div class="fs-app" :style="imageFilterCss ? { '--fs-image-filter': imageFilterCss } : undefined" @click="closeContextMenu">
    <!-- ===== 顶部地址栏（KodExplorer 风格） ===== -->
    <!-- ===== 主体区域：左侧导航 + 内容 ===== -->
    <div class="fs-body">
      <aside class="fs-nav">
        <!-- ===== 变体 B：胶囊过滤（搜索 / 类型 / 大小 / 日期 / 排序） =====
             整块钉在侧栏顶部，不跟「快捷访问」一起滚动：它是常驻操作区。
             类型/大小/日期/排序只改本地筛与本地换序（即点即生效，不发请求），
             只有过滤开关本身变化（开启 ↔ 关闭）才重载列表（见 loadObjects 的整目录扫描）。
             回收站视图下隐藏：那页的条目来自回收站接口，与当前目录的筛选口径无关。 -->
        <div v-if="nav === 'all'" class="fs-nav__filter" role="group" aria-label="筛选与排序">
          <div class="fs-nav__filter-hd">
            <span class="fs-nav__title fs-nav__title--inline">筛选</span>
            <button v-if="filterActive" type="button" class="fs-filter-clear" @click="clearFilters">
              <el-icon :size="11"><Close /></el-icon>清除
            </button>
          </div>

          <!-- 搜索胶囊：对文件名做包含匹配（目录名也参与） -->
          <div class="fs-pill-search">
            <el-icon :size="13" class="fs-pill-search__icon"><Search /></el-icon>
            <input
              v-model="filterKeyword"
              type="text"
              class="fs-pill-search__input"
              placeholder="搜索文件名"
              aria-label="搜索文件名"
            />
            <button
              v-if="filterKeyword"
              type="button"
              class="fs-pill-search__clear"
              aria-label="清空关键词"
              @click="filterKeyword = ''"
            >
              <el-icon :size="11"><Close /></el-icon>
            </button>
          </div>

          <div class="fs-pill-group">
            <span class="fs-pill-group__cap">类型</span>
            <div class="fs-pill-row">
              <button
                v-for="opt in TYPE_OPTIONS"
                :key="opt.key"
                type="button"
                class="fs-pill"
                :class="{ 'is-active': filterType === opt.key }"
                :aria-pressed="filterType === opt.key"
                @click="filterType = opt.key"
              >{{ opt.label }}</button>
            </div>
          </div>

          <div class="fs-pill-group">
            <span class="fs-pill-group__cap">大小</span>
            <div class="fs-pill-row">
              <button
                v-for="opt in SIZE_OPTIONS"
                :key="opt.key"
                type="button"
                class="fs-pill"
                :class="{ 'is-active': filterSize === opt.key }"
                :aria-pressed="filterSize === opt.key"
                @click="filterSize = opt.key"
              >{{ opt.label }}</button>
            </div>
          </div>

          <div class="fs-pill-group">
            <span class="fs-pill-group__cap">修改时间</span>
            <div class="fs-pill-row">
              <button
                v-for="opt in DATE_OPTIONS"
                :key="opt.key"
                type="button"
                class="fs-pill"
                :class="{ 'is-active': filterDate === opt.key }"
                :aria-pressed="filterDate === opt.key"
                @click="filterDate = opt.key"
              >{{ opt.label }}</button>
            </div>
          </div>

          <div class="fs-pill-group">
            <span class="fs-pill-group__cap">排序</span>
            <div class="fs-pill-row">
              <button
                v-for="opt in SORT_OPTIONS"
                :key="opt.key"
                type="button"
                class="fs-pill"
                :class="{ 'is-active': sortKey === opt.key }"
                :aria-pressed="sortKey === opt.key"
                @click="toggleSort(opt.key)"
              >
                {{ opt.label }}<span v-if="sortKey === opt.key" class="fs-pill__dir">{{ sortOrder === 'asc' ? '↑' : '↓' }}</span>
              </button>
            </div>
          </div>
        </div>

        <div class="fs-nav__section fs-nav__section--quick">
          <div class="fs-nav__title">快捷访问</div>
          <div v-if="!rootObjects.length" class="fs-nav__empty">根目录暂无内容</div>
          <button
            v-for="item in rootObjects"
            :key="item.name"
            type="button"
            class="fs-nav__item fs-nav__item--quick"
            :class="{ 'is-active': nav === 'all' && item.directory && currentPath === item.name }"
            :title="item.name"
            @click="item.directory ? enterDirAtRoot(item) : openPreview(item, item.name)"
          >
            <span
              class="fs-typeicon fs-nav__typeicon"
              :style="{ fontSize: '18px' }"
              v-html="fileSvg(item.name, item.directory)"
              aria-hidden="true"
            />
            <span class="fs-nav__label">
              <span class="fs-nav__label-leaf">{{ item.name }}</span>
            </span>
          </button>
          <div v-if="rootTruncated" class="fs-nav__more">根目录内容较多，仅显示前 {{ ROOT_LIMIT }} 项</div>
        </div>

        <div class="fs-nav__foot">
          <button
            type="button"
            class="fs-nav__foot-btn"
            :class="{ 'is-active': nav === 'recycle' }"
            @click="switchNav('recycle')"
          >
            <el-icon :size="15"><Delete /></el-icon>
            <span>回收站</span>
            <b v-if="recycleCount > 0" class="fs-nav__badge">{{ recycleCount }}</b>
          </button>
          <button
            type="button"
            class="fs-nav__foot-btn fs-nav__foot-btn--icon"
            title="系统配置"
            aria-label="系统配置"
            @click="openAdminConfig"
          >
            <el-icon :size="16"><Setting /></el-icon>
          </button>
        </div>
      </aside>

      <main class="fs-main">
        <!-- 路径栏：后退 / 刷新 / 面包屑 -->
        <div class="fs-pathbar">
          <button
            type="button"
            class="fs-icon-btn"
            title="后退"
            aria-label="后退"
            :disabled="!canGoBack"
            @click="goBack"
          >
            <el-icon :size="16"><ArrowLeft /></el-icon>
          </button>
          <button
            type="button"
            class="fs-icon-btn"
            title="刷新"
            aria-label="刷新"
            :disabled="loading"
            @click="loadObjects"
          >
            <el-icon :size="16" :class="{ 'is-spin': loading }"><Refresh /></el-icon>
          </button>
          <div class="fs-crumbs">
            <!-- 回收站不是文件路径上的一级，breadcrumbs 只按 currentPath 推导，
                 切到回收站时若照旧渲染会让人以为还在浏览原目录。此处显式改显「回收站」，
                 点击退回文件列表（与其它面包屑可点击一致）。 -->
            <span
              v-if="nav === 'recycle'"
              class="fs-crumbs__item is-current"
              role="button"
              tabindex="0"
              @click="switchNav('all')"
              @keydown.enter="switchNav('all')"
            >回收站</span>
            <template v-else>
              <template v-for="(crumb, i) in breadcrumbs" :key="crumb.path || 'root'">
                <span v-if="i > 0" class="fs-crumbs__sep" aria-hidden="true">&gt;</span>
                <span
                  class="fs-crumbs__item"
                  :class="{ 'is-current': crumb.path === currentPath }"
                  @click="goCrumb(crumb.path)"
                >{{ crumb.name }}</span>
              </template>
            </template>
          </div>
          <span v-if="navLoading" class="fs-nav-loading" aria-label="加载中">
            <el-icon :size="14" class="is-spin"><RefreshRight /></el-icon>
          </span>
          <span v-if="bucketPrivate" class="fs-main__lock">
            <el-icon :size="12"><Lock /></el-icon>私有
          </span>
          <span v-if="selectedCount > 0" class="fs-main__sel">已选 {{ selectedCount }} 项</span>

          <!-- 上传/下载：原在搜索工具栏那一行，该行按需求整行删除后并入路径栏尾部，
               保证上传入口不丢（那一整块曾被误删过一次，openUpload 一度成为孤儿） -->
          <button type="button" class="fs-tb-btn" title="上传" :disabled="nav !== 'all'" @click="openUpload">
            <el-icon :size="15"><Upload /></el-icon>上传
          </button>
          <button
            type="button"
            class="fs-tb-btn"
            title="链接管理"
            aria-label="链接管理"
            data-testid="fs-link-manage"
            @click="openLinkManage"
          >
            <el-icon :size="15"><Link /></el-icon>链接管理
          </button>
          <button
            v-if="selectedCount > 0 && nav === 'all'"
            type="button"
            class="fs-tb-btn"
            title="下载选中"
            @click="downloadSelected"
          >
            <el-icon :size="15"><Download /></el-icon>下载
          </button>
        </div>

        <!-- 搜索工具栏整行删除：搜索框已按需求移除，上传/下载并入上方路径栏尾部，
             其余操作仍在右键菜单里。这一行原本是页面唯一的搜索入口，
             删除后腾出的垂直空间全部让给文件列表（各视图行高同步调大）。 -->

        <!-- ===== 全部文件视图 ===== -->
        <template v-if="nav === 'all'">
        <!-- 分栏（macOS Finder 风格）：点击目录向右逐级展开 -->
        <div
          v-if="viewMode === 'columns'"
          class="fs-files fs-files--columns"
          @contextmenu="openBlankContextMenu"
        >
          <div v-for="(colPath, ci) in segmentPaths" :key="colPath || 'root'" class="fs-col">
            <div
              class="fs-col__body"
              @dragover="onColumnBlankDragOver"
              @drop="onColumnBlankDrop($event, colPath)"
              @contextmenu="openColumnBlankContextMenu($event, colPath)"
            >
              <div v-if="colObjects[colPath] === undefined" class="fs-col__hint">加载中…</div>
              <div v-else-if="colError[colPath]" class="fs-col__hint fs-col__hint--error">{{ colError[colPath] }}</div>
              <div v-else-if="columnItems(colPath).length === 0" class="fs-col__hint">{{ filterActive ? '无匹配项' : '空目录' }}</div>
              <div
                v-else-if="colTotals[colPath] != null && colTotals[colPath] > COLUMN_LIMIT"
                class="fs-col__hint fs-col__hint--more"
              >仅显示前 {{ COLUMN_LIMIT }} 项（共 {{ colTotals[colPath] }} 项）</div>
              <div
                v-for="(item, index) in columnItems(colPath)"
                :key="item.name"
                class="fs-col__row"
                :class="{
                  'is-trail': isTrailDir(colPath, item, ci),
                  'is-selected': isColumnSelected(ci, item),
                  'is-dragover': item.directory && dragOverDir === joinKey(colPath, item.name),
                }"
                role="button"
                tabindex="0"
                :aria-label="item.name"
                draggable="true"
                @click="onColumnClick($event, item, colPath, index)"
                @dblclick="item.directory ? onColumnClick($event, item, colPath, index) : openPreview(item, joinKey(colPath, item.name))"
                @keydown.enter="item.directory ? onColumnClick($event, item, colPath, index) : openPreview(item, joinKey(colPath, item.name))"
                @contextmenu.stop="openColumnContextMenu($event, item, colPath)"
                @dragstart="onColumnDragStart($event, item, colPath)"
                @dragover="onColumnRowDragOver($event, colPath, item)"
                @dragleave="onColumnRowDragLeave(colPath, item)"
                @drop="onColumnDrop($event, colPath, item)"
              >
                <span class="fs-typeicon fs-col__icon" v-html="fileSvg(item.name, item.directory)" aria-hidden="true" />
                <InlineRenameLabel
                  :name="item.name"
                  :active="renaming === item.name"
                  v-model:draft="renameDraft"
                  :directory="item.directory"
                  className="fs-col__name"
                  @commit="commitInlineRename"
                  @cancel="cancelInlineRename"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- 详细信息（Details）：列显示由服务端配置动态控制（showFormat/showSize/showTime） -->
        <div
          v-else-if="viewMode === 'details'"
          class="fs-files fs-files--details"
          :class="{ 'fs-details--no-format': !showFormatCol, 'fs-details--no-size': !showSizeCol, 'fs-details--no-time': !showTimeCol }"
          @contextmenu="openBlankContextMenu"
        >
          <div class="fs-details-head">
            <span class="fs-details-head__col fs-details-head__name" @click="toggleSort('name')">
              名称 <span class="fs-sort-arrow">{{ sortArrow('name') }}</span>
            </span>
            <span v-if="showFormatCol" class="fs-details-head__col fs-details-head__type">类型</span>
            <span v-if="showSizeCol" class="fs-details-head__col fs-details-head__size" @click="toggleSort('size')">
              大小 <span class="fs-sort-arrow">{{ sortArrow('size') }}</span>
            </span>
            <span v-if="showTimeCol" class="fs-details-head__col fs-details-head__time" @click="toggleSort('lastModified')">
              修改时间 <span class="fs-sort-arrow">{{ sortArrow('lastModified') }}</span>
            </span>
          </div>
          <div v-if="sortedObjects.length === 0 && !loading" class="fs-files__empty">
            <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
            <span>{{ emptyText }}</span>
          </div>
          <div
            v-for="(item, index) in sortedObjects"
            :key="item.name"
            class="fs-details-row"
            :class="{
              'fs-details-row--selected': isSelected(item.name),
              'fs-row--drop': item.directory && dragOverDir === fullKey(item.name),
            }"
            role="button" tabindex="0"
            :aria-label="item.name"
            draggable="true"
            @click="onRowClick($event, item, index)"
            @dblclick="item.directory ? enterDir(item) : openPreview(item)"
            @keydown.enter="item.directory ? enterDir(item) : openPreview(item)"
            @contextmenu.stop="openContextMenu($event, item)"
            @dragstart="onRowDragStart($event, item)"
            @dragover="onRowDragOver($event, item)"
            @dragleave="onRowDragLeave(item)"
            @drop="onRowDrop($event, item)"
          >
            <span class="fs-details-row__name">
              <span
                class="fs-typeicon fs-details-row__icon"
                v-html="fileSvg(item.name, item.directory)"
                aria-hidden="true"
              />
              <InlineRenameLabel
                :name="item.name"
                :active="renaming === item.name"
                v-model:draft="renameDraft"
                :directory="item.directory"
                @commit="commitInlineRename"
                @cancel="cancelInlineRename"
              />
            </span>
            <span v-if="showFormatCol" class="fs-details-row__type">{{ item.directory ? '文件夹' : fileTypeText(item.name) }}</span>
            <span v-if="showSizeCol" class="fs-details-row__size">{{ item.directory ? '-' : formatSize(item.size) }}</span>
            <span v-if="showTimeCol" class="fs-details-row__time">{{ formatTime(item.lastModified) }}</span>
          </div>
        </div>

        <!-- 大图标（Large Icons）- 使用 ?preview 渲染缩略图 -->
        <div v-else-if="viewMode === 'largeIcons'" class="fs-files fs-files--large" @contextmenu="openBlankContextMenu">
          <div v-if="sortedObjects.length === 0 && !loading" class="fs-files__empty">
            <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
            <span>{{ emptyText }}</span>
          </div>
          <div
            v-for="(item, index) in sortedObjects"
            :key="item.name"
            class="fs-lg-card"
            :class="{
              'fs-lg-card--selected': isSelected(item.name),
              'fs-row--drop': item.directory && dragOverDir === fullKey(item.name),
            }"
            role="button" tabindex="0"
            :aria-label="item.name"
            draggable="true"
            @click="onRowClick($event, item, index)"
            @dblclick="item.directory ? enterDir(item) : openPreview(item)"
            @keydown.enter="item.directory ? enterDir(item) : openPreview(item)"
            @contextmenu.stop="openContextMenu($event, item)"
            @dragstart="onRowDragStart($event, item)"
            @dragover="onRowDragOver($event, item)"
            @dragleave="onRowDragLeave(item)"
            @drop="onRowDrop($event, item)"
          >
            <span v-if="isSelected(item.name)" class="fs-lg-card__x" aria-hidden="true"><el-icon :size="10"><Close /></el-icon></span>
            <div class="fs-lg-card__thumb" :class="item.directory ? 'icon-folder' : fileIconClass(item.name, false)">
              <img
                v-if="!item.directory && kindOf(item.name) === 'image'"
                :src="objectThumbUrl(item.name)"
                class="fs-lg-card__frame"
                :alt="item.name"
                loading="lazy"
                decoding="async"
              />
              <span
                v-else
                class="fs-typeicon fs-card-icon"
                v-html="fileSvg(item.name, item.directory)"
                aria-hidden="true"
              />
            </div>
            <InlineRenameLabel
              :name="item.name"
              :active="renaming === item.name"
              v-model:draft="renameDraft"
              :directory="item.directory"
              className="fs-lg-card__label"
              :title="item.name"
              @commit="commitInlineRename"
              @cancel="cancelInlineRename"
            />
          </div>
        </div>

        <!-- 中图标（Medium Icons） -->
        <div v-else-if="viewMode === 'mediumIcons'" class="fs-files fs-files--medium" @contextmenu="openBlankContextMenu">
          <div v-if="sortedObjects.length === 0 && !loading" class="fs-files__empty">
            <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
            <span>{{ emptyText }}</span>
          </div>
          <div
            v-for="(item, index) in sortedObjects"
            :key="item.name"
            class="fs-md-card"
            :class="{
              'fs-md-card--selected': isSelected(item.name),
              'fs-row--drop': item.directory && dragOverDir === fullKey(item.name),
            }"
            role="button" tabindex="0"
            :aria-label="item.name"
            draggable="true"
            @click="onRowClick($event, item, index)"
            @dblclick="item.directory ? enterDir(item) : openPreview(item)"
            @keydown.enter="item.directory ? enterDir(item) : openPreview(item)"
            @contextmenu.stop="openContextMenu($event, item)"
            @dragstart="onRowDragStart($event, item)"
            @dragover="onRowDragOver($event, item)"
            @dragleave="onRowDragLeave(item)"
            @drop="onRowDrop($event, item)"
          >
            <span v-if="isSelected(item.name)" class="fs-md-card__x" aria-hidden="true"><el-icon :size="10"><Close /></el-icon></span>
            <div class="fs-md-card__thumb" :class="item.directory ? 'icon-folder' : fileIconClass(item.name, false)">
              <span
                class="fs-typeicon fs-card-icon"
                v-html="fileSvg(item.name, item.directory)"
                aria-hidden="true"
              />
            </div>
            <InlineRenameLabel
              :name="item.name"
              :active="renaming === item.name"
              v-model:draft="renameDraft"
              :directory="item.directory"
              className="fs-md-card__label"
              :title="item.name"
              @commit="commitInlineRename"
              @cancel="cancelInlineRename"
            />
          </div>
        </div>

        <!-- 小图标（Small Icons） -->
        <div v-else class="fs-files fs-files--small" @contextmenu="openBlankContextMenu">
          <div v-if="sortedObjects.length === 0 && !loading" class="fs-files__empty">
            <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
            <span>{{ emptyText }}</span>
          </div>
          <div class="fs-files__small-list">
            <div
              v-for="(item, index) in sortedObjects"
              :key="item.name"
              class="fs-sm-row"
              :class="{
                'fs-sm-row--selected': isSelected(item.name),
                'fs-row--drop': item.directory && dragOverDir === fullKey(item.name),
              }"
              role="button" tabindex="0"
              :aria-label="item.name"
              draggable="true"
              @click="onRowClick($event, item, index)"
              @dblclick="item.directory ? enterDir(item) : openPreview(item)"
              @keydown.enter="item.directory ? enterDir(item) : openPreview(item)"
              @contextmenu.stop="openContextMenu($event, item)"
              @dragstart="onRowDragStart($event, item)"
              @dragover="onRowDragOver($event, item)"
              @dragleave="onRowDragLeave(item)"
              @drop="onRowDrop($event, item)"
            >
              <span
                class="fs-typeicon fs-sm-row__icon"
                v-html="fileSvg(item.name, item.directory)"
                aria-hidden="true"
              />
              <InlineRenameLabel
                :name="item.name"
                :active="renaming === item.name"
                v-model:draft="renameDraft"
                :directory="item.directory"
                className="fs-sm-row__name"
                @commit="commitInlineRename"
                @cancel="cancelInlineRename"
              />
            </div>
          </div>
        </div>
        </template>

        <!-- ===== 回收站 ===== -->
        <div v-else-if="nav === 'recycle'" class="fs-files fs-recycle" v-loading="recycleLoading">
          <div class="fs-recycle-head">
            <span class="fs-recycle-head-title">回收站</span>
            <span class="fs-recycle-head-sub">{{ recycleCount }} 项 · 删除的对象会先进入回收站</span>
            <button type="button" class="fs-pill-btn fs-pill-btn--danger" :disabled="actionRunning || recycleCount === 0" @click="emptyRecycle">
              <el-icon :size="14"><Delete /></el-icon>清空回收站
            </button>
          </div>

          <div v-if="recycleItems.length === 0 && !recycleLoading" class="fs-files__empty">
            <el-icon :size="42"><DeleteFilled /></el-icon>
            <span>回收站为空</span>
          </div>

          <!-- 按删除时间分组（今天 / 更早） -->
          <div v-for="g in groupedRecycle" :key="g.key" class="fs-recycle-group">
            <div class="fs-recycle-group-hd">
              <span class="fs-recycle-group-name">{{ g.label }}</span>
              <span class="fs-recycle-group-cnt">{{ g.items.length }} 项</span>
            </div>
            <div class="fs-recycle-list">
              <div v-for="item in g.items" :key="item.name" class="fs-recycle-row">
                <div class="fs-recycle-ic" :class="fileIconClass(item.name, item.directory)">
                  <span class="fs-typeicon" v-html="fileSvg(item.name, item.directory)" aria-hidden="true" />
                </div>
                <div class="fs-recycle-main">
                  <div class="fs-recycle-name" :title="item.name">{{ item.name }}</div>
                  <div class="fs-recycle-meta">{{ cardMeta(item) }}</div>
                </div>
                <div class="fs-recycle-acts">
                  <button type="button" class="fs-mini-btn" :disabled="actionRunning" @click="restoreRecycleItem(item)">
                    <el-icon :size="13"><RefreshLeft /></el-icon>还原
                  </button>
                  <button type="button" class="fs-mini-btn fs-mini-btn--danger" :disabled="actionRunning" @click="purgeRecycleItem(item)">
                    <el-icon :size="13"><Delete /></el-icon>彻底删除
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <!-- 状态栏：项数 + 查看方式切换（分栏/详细信息/大图标/中图标/小图标） -->
        <div class="fs-statusbar">
          <!-- 项数口径随筛选切换：过滤态报「命中 / 全目录」两个数，否则用户分不清
               「目录就这么点东西」和「筛完只剩这么点」 -->
          <span class="fs-statusbar__info">
            <template v-if="nav === 'recycle'">{{ recycleCount }} 个项</template>
            <template v-else-if="filterActive">筛选命中 {{ sortedObjects.length }} 项 · 全目录 {{ listTotal }} 项</template>
            <template v-else>{{ listTotal > 0 ? listTotal : sortedObjects.length }} 个项</template>
            <template v-if="selectedCount > 0">（已选 {{ selectedCount }} 项）</template>
          </span>
          <!-- 整目录扫描有上限：超出部分没参与筛选，必须写出来 -->
          <span v-if="filterActive && scanMode && listTotal > FILTER_SCAN_LIMIT" class="fs-statusbar__scan">
            仅扫描前 {{ FILTER_SCAN_LIMIT }} 项
          </span>
          <!-- 过滤态是整目录扫描，没有「当前页」可言，分页器一并隐藏 -->
          <div v-if="nav === 'all' && !scanMode && viewMode !== 'columns' && listTotal > PAGE_SIZE" class="fs-statusbar__pages">
            <el-pagination
              :current-page="page"
              :page-size="PAGE_SIZE"
              :total="listTotal"
              layout="prev, pager, next"
              background
              :disabled="pageBusy"
              @current-change="onPageChange"
            />
          </div>
          <div class="fs-statusbar__views" role="group" aria-label="查看方式">
            <button
              type="button"
              class="fs-view-btn"
              :class="{ 'is-active': viewMode === 'columns' }"
              title="分栏"
              aria-label="分栏"
              @click="setView('columns')"
            ><el-icon :size="15"><Operation /></el-icon></button>
            <button
              type="button"
              class="fs-view-btn"
              :class="{ 'is-active': viewMode === 'details' }"
              title="详细信息"
              aria-label="详细信息"
              @click="setView('details')"
            ><el-icon :size="15"><List /></el-icon></button>
            <button
              type="button"
              class="fs-view-btn"
              :class="{ 'is-active': viewMode === 'largeIcons' }"
              title="大图标"
              aria-label="大图标"
              @click="setView('largeIcons')"
            ><el-icon :size="15"><Grid /></el-icon></button>
            <button
              type="button"
              class="fs-view-btn"
              :class="{ 'is-active': viewMode === 'mediumIcons' }"
              title="中图标"
              aria-label="中图标"
              @click="setView('mediumIcons')"
            ><el-icon :size="15"><Menu /></el-icon></button>
            <button
              type="button"
              class="fs-view-btn"
              :class="{ 'is-active': viewMode === 'smallIcons' }"
              title="小图标"
              aria-label="小图标"
              @click="setView('smallIcons')"
            ><el-icon :size="15"><Tickets /></el-icon></button>
          </div>
        </div>
      </main>
    </div>

    <!-- ===== 右键菜单 ===== -->
    <Teleport to="body">
      <div
        v-if="ctxMenu.visible"
        ref="ctxMenuRef"
        class="fs-ctx"
        :style="{ left: ctxMenu.x + 'px', top: ctxMenu.y + 'px' }"
        role="menu"
        :aria-label="'文件操作'"
        @click.stop
      >
        <template v-if="ctxMenu.row">
          <button
            v-if="ctxMenu.row!.directory || allowPreview"
            type="button"
            class="fs-ctx__item"
            role="menuitem"
            @click="ctxAction(ctxMenu.row!.directory ? 'open' : 'preview')"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            {{ ctxMenu.row!.directory ? '打开' : '预览' }}
          </button>
          <!--
            需求 3：新标签全窗口预览。**必须紧跟在「预览」之后** —— e2e 用
            hasText:"预览" + .first() 取主预览项，排在前面会让它先命中本项。
          -->
          <button
            v-if="!ctxMenu.row!.directory && allowPreview"
            type="button"
            class="fs-ctx__item"
            role="menuitem"
            @click="ctxAction('previewNew')"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
            预览（新窗口）
          </button>
          <!-- 需求 4：文件直下、目录打包，合并为一条「下载」，统一走 smartDownload（单机走直链，多文件/目录走 zip） -->
          <button
            v-if="allowDownload"
            type="button"
            class="fs-ctx__item"
            role="menuitem"
            @click="ctxAction('download')"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            下载
          </button>
          <button
            v-if="DISTRIBUTE_ENABLED && !ctxMenu.row!.directory"
            type="button"
            class="fs-ctx__item"
            role="menuitem"
            @click="ctxAction('distribute')"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M22 2 11 13"/><path d="M22 2 15 22l-4-9-9-4z"/></svg>
            分发到服务器
          </button>
          <button
            v-if="!ctxMenu.row!.directory && isCollabFile(ctxMenu.row!.name)"
            type="button"
            class="fs-ctx__item"
            role="menuitem"
            @click="ctxAction('createCollab')"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M16 3h5v5"/><path d="M8 21H3v-5"/><path d="M21 3l-7 7"/><path d="M3 21l7-7"/></svg>
            创建协同
          </button>
          <button
            v-if="!ctxMenu.row!.directory"
            type="button"
            class="fs-ctx__item"
            role="menuitem"
            @click="ctxAction('onetime')"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
            创建链接
          </button>
          <button
            v-if="!ctxMenu.row!.directory"
            type="button"
            class="fs-ctx__item"
            role="menuitem"
            @click="ctxAction('expiryLink')"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
            生成限时链接（自定义过期）
          </button>
          <div class="fs-ctx__sep" aria-hidden="true" />
          <button type="button" class="fs-ctx__item" role="menuitem" @click="ctxAction('rename')">
            <el-icon class="fs-ctx__icon" aria-hidden="true"><EditPen /></el-icon>
            <span class="fs-ctx__label">重命名</span>
            <kbd class="fs-ctx__kbd">F2</kbd>
          </button>
          <button type="button" class="fs-ctx__item" role="menuitem" @click="ctxAction('renameDialog')">
            <el-icon class="fs-ctx__icon" aria-hidden="true"><EditPen /></el-icon>
            <span class="fs-ctx__label">重命名（对话框）…</span>
          </button>
          <button type="button" class="fs-ctx__item" role="menuitem" @click="ctxAction('copy')">
            <el-icon class="fs-ctx__icon" aria-hidden="true"><CopyDocument /></el-icon>
            <span class="fs-ctx__label">复制</span>
            <kbd class="fs-ctx__kbd">Ctrl+C</kbd>
          </button>
          <button type="button" class="fs-ctx__item" role="menuitem" @click="ctxAction('cut')">
            <el-icon class="fs-ctx__icon" aria-hidden="true"><Scissor /></el-icon>
            <span class="fs-ctx__label">剪切</span>
            <kbd class="fs-ctx__kbd">Ctrl+X</kbd>
          </button>
          <button type="button" class="fs-ctx__item" role="menuitem" @click="ctxAction('properties')">
            <el-icon class="fs-ctx__icon" aria-hidden="true"><InfoFilled /></el-icon>
            <span class="fs-ctx__label">属性</span>
          </button>
          <div class="fs-ctx__sep" aria-hidden="true" />
          <button
            type="button"
            class="fs-ctx__item fs-ctx__item--danger"
            role="menuitem"
            @click="ctxAction('delete')"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            删除
          </button>
        </template>
        <template v-else>
          <button
            v-if="clipboard && clipboard.keys.length"
            type="button"
            class="fs-ctx__item"
            role="menuitem"
            @click="ctxAction('paste')"
          >
            <el-icon class="fs-ctx__icon" aria-hidden="true"><CopyDocument /></el-icon>
            粘贴
            <kbd class="fs-ctx__kbd">Ctrl+V</kbd>
          </button>
          <div v-if="clipboard && clipboard.keys.length" class="fs-ctx__sep" aria-hidden="true" />
          <button type="button" class="fs-ctx__item" role="menuitem" @click="ctxAction('mktext')">
            <el-icon class="fs-ctx__icon" aria-hidden="true"><Document /></el-icon>
            新建 text
          </button>
          <button type="button" class="fs-ctx__item" role="menuitem" @click="ctxAction('mkdocx')">
            <el-icon class="fs-ctx__icon" aria-hidden="true"><DocumentCopy /></el-icon>
            新建 docx
          </button>
          <button type="button" class="fs-ctx__item" role="menuitem" @click="ctxAction('mkxlsx')">
            <el-icon class="fs-ctx__icon" aria-hidden="true"><Tickets /></el-icon>
            新建 xlsx
          </button>
          <div class="fs-ctx__sep" aria-hidden="true" />
          <button type="button" class="fs-ctx__item" role="menuitem" @click="ctxAction('refresh')">
            <el-icon class="fs-ctx__icon" aria-hidden="true"><Refresh /></el-icon>
            刷新
          </button>
          <button type="button" class="fs-ctx__item" role="menuitem" @click="ctxAction('mkdir')">
            <el-icon class="fs-ctx__icon" aria-hidden="true"><FolderAdd /></el-icon>
            新建目录（多级）
          </button>
          <div class="fs-ctx__sep" aria-hidden="true" />
          <button type="button" class="fs-ctx__item" role="menuitem" @click="ctxAction('upload')">
            <el-icon class="fs-ctx__icon" aria-hidden="true"><Upload /></el-icon>
            上传
          </button>
        </template>
      </div>
    </Teleport>

    <!-- ===== 系统配置对话框
          入口按钮在侧栏底部，**不挂 v-admin**：该指令用 display:none 隐藏元素，而它
          依赖的登录角色信息在本页独立部署时常常拿不到，结果就是「按钮整块消失、
          没人找得到配置入口」（实测如此）。
         左分组 + 右内容的双栏结构，右侧分区可搜索过滤；色值全部走 koi 的 --el-* 令牌。 ===== -->
    <ReDialog
      v-model="adminVisible"
      class="fs-admin-dialog"
      width="1040px"
      :append-to-body="true"
      :close-on-click-modal="false"
      :draggable="true"
      destroy-on-close
    >
      <template #header>
        <div class="fs-admin__head">
          <span class="fs-admin__logo" aria-hidden="true">
            <el-icon :size="20"><Setting /></el-icon>
          </span>
          <div class="fs-admin__titles">
            <h3 class="fs-admin__title">系统配置</h3>
            <p class="fs-admin__subtitle">管理员设置 · 保存后立即生效</p>
          </div>
          <el-input
            v-model="adminSearch"
            class="fs-admin__search"
            placeholder="搜索设置项..."
            :prefix-icon="Search"
            clearable
          />
        </div>
      </template>

      <div class="fs-admin">
        <aside class="fs-admin__side">
          <div class="fs-admin__side-cap">配置分组</div>
          <button
            v-for="g in adminGroups"
            :key="g.id"
            type="button"
            class="fs-admin__nav"
            :class="{ 'is-active': adminGroup === g.id }"
            @click="scrollToAdminSection(g.id)"
          >
            <el-icon :size="15"><component :is="g.icon" /></el-icon>
            <span>{{ g.label }}</span>
          </button>
          <button type="button" class="fs-admin__reset" @click="resetAdminForm">
            <el-icon :size="14"><RefreshRight /></el-icon>
            <span>恢复默认设置</span>
          </button>
        </aside>

        <div ref="adminMainRef" class="fs-admin__main" @scroll="syncAdminGroup">
          <p v-if="!adminAnySectionShown" class="fs-admin__empty">
            没有匹配「{{ adminSearch.trim() }}」的设置项
          </p>

          <!-- 文件功能 -->
          <section v-if="adminSectionsShown.file" id="fs-adm-file" class="fs-admin__section">
            <div class="fs-admin__group">文件功能</div>
            <div class="fs-admin__grid">
              <div v-for="t in visibleFileToggles" :key="t.key" class="fs-admin__tile">
                <span class="fs-admin__tileicon" aria-hidden="true">
                  <el-icon :size="17"><component :is="t.icon" /></el-icon>
                </span>
                <span class="fs-admin__tiletext">
                  <span class="fs-admin__label">{{ t.label }}</span>
                  <span class="fs-admin__desc">{{ t.desc }}</span>
                </span>
                <el-switch v-model="adminForm[t.key]" />
              </div>
            </div>

            <!-- 远程文件读取器：SPI 枚举，展示可用协议（ssh:// 等） -->
            <div v-if="remoteReaderOptions.length" class="fs-admin__field">
              <span class="fs-admin__label fs-admin__label--field">远程读取协议</span>
              <div class="fs-admin__remote-readers">
                <span v-for="r in remoteReaderOptions" :key="r.protocol" class="fs-admin__remote-reader">
                  <el-icon><Connection /></el-icon>
                  <code>{{ r.protocol }}</code>
                  <span class="fs-admin__optdesc">{{ r.description }}</span>
                </span>
              </div>
              <p class="fs-admin__hint">
                开启「远程文件透传」后，URL 路径以 <code>ssh://</code> 开头的请求将通过 SSH 读取远程文件。
              </p>
            </div>

            <!-- 三方 URL 预览：能力由后台 SPI 枚举，显式选择后才生效（不是开关） -->
            <div v-if="admHitAny(ADMIN_FILE_ITEM_TERMS.thirdUrlPreview)" class="fs-admin__field">
              <span class="fs-admin__label fs-admin__label--field">三方 URL 预览</span>
              <el-select v-model="adminForm.thirdUrlPreview" class="fs-admin__select" popper-class="fs-admin-select-popper">
                <template #prefix><el-icon><Link /></el-icon></template>
                <el-option
                  v-for="opt in urlPreviewerOptions"
                  :key="opt.value"
                  :value="opt.value"
                  :label="opt.label"
                >
                  <span class="fs-admin__optiontext">
                    <span>{{ opt.label }}</span>
                    <span class="fs-admin__optdesc">{{ opt.description }}</span>
                  </span>
                </el-option>
              </el-select>
              <p class="fs-admin__hint">
                由文件服务按选中的能力拉取外部地址内容并预览（?url= 需传 base64 编码后的地址）。
              </p>
              <p v-if="urlPreviewerUnsupported" class="fs-admin__hint fs-admin__hint--warn">
                当前选中的能力不处理外部地址，只有选择「后台」才支持 ?url=。
              </p>
            </div>
          </section>

          <!-- 布局显示 -->
          <section v-if="adminSectionsShown.layout" id="fs-adm-layout" class="fs-admin__section">
            <div class="fs-admin__group">布局显示</div>

            <div v-if="admHitAny(ADMIN_LAYOUT_ITEM_TERMS.layoutType)" class="fs-admin__field">
              <span class="fs-admin__label fs-admin__label--field">布局类型</span>
              <div class="fs-admin__layouts">
                <button
                  type="button"
                  class="fs-admin__layout"
                  :class="{ 'is-active': adminForm.layoutType === 'SYSTEM' }"
                  :aria-pressed="adminForm.layoutType === 'SYSTEM'"
                  @click="adminForm.layoutType = 'SYSTEM'"
                >
                  <span class="fs-admin__layoutart fs-admin__layoutart--system" aria-hidden="true">
                    <i /><i /><i />
                  </span>
                  <span class="fs-admin__layoutname">资源管理器</span>
                  <span class="fs-admin__check" aria-hidden="true">
                    <el-icon :size="13"><CircleCheck /></el-icon>
                  </span>
                </button>
                <button
                  type="button"
                  class="fs-admin__layout"
                  :class="{ 'is-active': adminForm.layoutType === 'SIMPLE' }"
                  :aria-pressed="adminForm.layoutType === 'SIMPLE'"
                  @click="adminForm.layoutType = 'SIMPLE'"
                >
                  <span class="fs-admin__layoutart fs-admin__layoutart--simple" aria-hidden="true">
                    <i /><i /><i />
                  </span>
                  <span class="fs-admin__layoutname">简单列表</span>
                  <span class="fs-admin__check" aria-hidden="true">
                    <el-icon :size="13"><CircleCheck /></el-icon>
                  </span>
                </button>
              </div>
            </div>

            <div class="fs-admin__pills">
              <button
                v-for="c in visibleColumnToggles"
                :key="c.key"
                type="button"
                class="fs-admin__pill"
                :class="{ 'is-on': adminForm[c.key] }"
                :aria-pressed="adminForm[c.key]"
                @click="adminForm[c.key] = !adminForm[c.key]"
              >
                <el-icon :size="14"><CircleCheck /></el-icon>
                <span class="fs-admin__label fs-admin__label--pill">{{ c.label }}</span>
              </button>
            </div>

            <div class="fs-admin__fields">
              <div v-if="admHitAny(ADMIN_LAYOUT_ITEM_TERMS.access)" class="fs-admin__field">
                <span class="fs-admin__label fs-admin__label--field">访问权限</span>
                <el-radio-group v-model="adminForm.privateBucket" class="fs-admin__seg">
                  <el-radio-button :value="false">公共</el-radio-button>
                  <el-radio-button :value="true">私有</el-radio-button>
                </el-radio-group>
              </div>

              <div v-if="admHitAny(ADMIN_LAYOUT_ITEM_TERMS.buckets)" class="fs-admin__field fs-admin__field--wide">
                <span class="fs-admin__label fs-admin__label--field">全部私有桶</span>
                <div class="fs-admin__tags" @click="focusBucketInput">
                  <span v-for="tag in bucketTags" :key="tag" class="fs-admin__tag">
                    {{ tag }}
                    <el-icon
                      class="fs-admin__tagx"
                      :size="13"
                      title="移除"
                      @click.stop="removeBucketTag(tag)"
                    ><Close /></el-icon>
                  </span>
                  <input
                    ref="bucketInputRef"
                    v-model="bucketDraft"
                    class="fs-admin__taginput"
                    placeholder="输入桶名后回车"
                    @keydown="onBucketKeydown"
                    @blur="addBucketTag"
                  />
                </div>
                <p class="fs-admin__hint">留空表示全部公共；回车或逗号分隔多个桶名。</p>
              </div>

              <div v-if="admHitAny(ADMIN_LAYOUT_ITEM_TERMS.ttl)" class="fs-admin__field">
                <span class="fs-admin__label fs-admin__label--field">链接默认有效期</span>
                <el-input
                  v-model="adminForm.oneTimeTtlMinutes"
                  placeholder="分钟，留空表示不修改"
                  clearable
                >
                  <template #prefix><el-icon><InfoFilled /></el-icon></template>
                  <template #suffix>
                    <span v-if="adminForm.oneTimeTtlMinutes.trim()" class="fs-admin__unit">分钟 · 留空表示不修改</span>
                  </template>
                </el-input>
              </div>
            </div>
          </section>

          <!-- 图片滤镜 -->
          <section v-if="adminSectionsShown.filter" id="fs-adm-filter" class="fs-admin__section">
            <div class="fs-admin__group">图片滤镜</div>

            <div v-if="admHitAny(ADMIN_FILTER_ITEM_TERMS.imageFilter)" class="fs-admin__field fs-admin__field--wide">
              <span class="fs-admin__label fs-admin__label--field">图片滤镜</span>
              <el-select v-model="adminForm.imageFilter" class="fs-admin__select" popper-class="fs-admin-select-popper">
                <template #prefix><el-icon><Picture /></el-icon></template>
                <el-option v-for="opt in imageFilterOptions" :key="opt.value" :value="opt.value" :label="opt.label">
                  <span class="fs-admin__optiontext">
                    <span>{{ opt.label }}</span>
                    <span v-if="opt.server" class="fs-admin__optdesc">后台处理</span>
                    <span v-else-if="opt.css" class="fs-admin__optdesc">前端预览：{{ opt.css }}</span>
                    <span v-else class="fs-admin__optdesc">原图，不处理</span>
                  </span>
                </el-option>
              </el-select>
              <p class="fs-admin__hint">
                选项来自后台 ImageFilter SPI；选中的滤镜对每张图片生效，不需要再打开「全局滤镜链」。
              </p>
              <p v-if="imageFilterLoadFailed" class="fs-admin__hint fs-admin__hint--warn">
                能力接口不可用：滤镜列表仅保留「原图」，未使用前端内置选项。请检查服务连接后重试。
              </p>
              <el-button
                v-if="imageFilterLoadFailed"
                class="fs-admin__retry"
                text
                type="primary"
                :loading="capabilitiesLoading"
                @click="loadCapabilities"
              >重新加载能力</el-button>
            </div>
          </section>

          <!-- 图片处理 -->
          <section v-if="adminSectionsShown.image" id="fs-adm-image" class="fs-admin__section">
            <div class="fs-admin__group">图片处理</div>

            <div v-if="admHitAny(ADMIN_IMAGE_ITEM_TERMS.caps)" class="fs-admin__field fs-admin__field--wide">
              <span class="fs-admin__label fs-admin__label--field">URL 参数能力</span>
              <el-select v-model="adminForm.fileSettingKey" class="fs-admin__select" popper-class="fs-admin-select-popper">
                <template #prefix><el-icon><Link /></el-icon></template>
                <el-option
                  v-for="opt in urlParamSettingOptions"
                  :key="opt.value"
                  :value="opt.value"
                  :label="opt.label"
                >
                  <span class="fs-admin__optiontext">
                    <span>{{ opt.label }}</span>
                    <span v-if="opt.description" class="fs-admin__optdesc">{{ opt.description }}</span>
                  </span>
                </el-option>
              </el-select>
              <div class="fs-admin__caps">
                <span v-if="capabilitiesLoading" class="fs-admin__cap fs-admin__cap--muted">加载中…</span>
                <span v-else-if="capabilitiesFailed" class="fs-admin__cap fs-admin__cap--muted">能力接口不可用</span>
                <span v-else-if="fileCapabilityChips.length === 0" class="fs-admin__cap fs-admin__cap--muted">
                  该实现未声明 URL 参数
                </span>
                <span v-for="c in fileCapabilityChips" :key="c" class="fs-admin__cap">{{ c }}</span>
              </div>
              <p class="fs-admin__hint">
                选择解析地址栏 URL 参数（如 ?size=100x100、?grayscale=1、?format=webp）的后台 SPI 实现；
                可选实现与能力清单均来自能力接口，前端不硬编码。
                缩放请使用 宽x高 或 百分比（如 ?size=100x100、?size=50%）；单独写 ?size=100 后台当前不会缩放。
              </p>
              <el-button
                v-if="capabilitiesFailed"
                class="fs-admin__retry"
                text
                type="primary"
                :loading="capabilitiesLoading"
                @click="loadCapabilities"
              >重新加载能力</el-button>
            </div>

            <div v-if="admHitAny(ADMIN_IMAGE_ITEM_TERMS.chain)" class="fs-admin__field fs-admin__field--wide">
              <span class="fs-admin__label fs-admin__label--field">全局滤镜链</span>
              <div class="fs-admin__chainhead">
                <el-switch v-model="adminForm.imageFilterEnabled" />
                <span class="fs-admin__chainstate">
                  {{ adminForm.imageFilterEnabled ? "已启用：每次图片请求按链顺序强制处理" : "未启用" }}
                </span>
              </div>

              <!-- 与「图片滤镜」一致的选择方式：每个后台能力一个开关，开启即加入全局链 -->
              <div class="fs-admin__filtergrid">
                <div
                  v-for="f in chainFilterRows"
                  :key="f.value"
                  class="fs-admin__filteritem"
                  :class="{ 'is-on': f.row !== null }"
                >
                  <div class="fs-admin__filterhead">
                    <span class="fs-admin__label">{{ f.label }}</span>
                    <el-switch
                      :model-value="f.row !== null"
                      @change="onChainFilterSwitch(f.value, $event)"
                    />
                  </div>
                  <p v-if="f.row" class="fs-admin__filterexample">
                    {{ chainFilterExample(f.value, f.row.params) }}
                  </p>
                </div>
                <span v-if="capabilitiesLoading" class="fs-admin__cap fs-admin__cap--muted">加载中…</span>
                <span v-else-if="capabilitiesFailed" class="fs-admin__cap fs-admin__cap--muted">
                  能力接口不可用，无法读取滤镜清单
                </span>
                <span v-else-if="filterChainOptions.length === 0" class="fs-admin__cap fs-admin__cap--muted">
                  后台未声明全局滤镜能力
                </span>
              </div>

              <p class="fs-admin__hint">
                开启后会对每张图片强制按链顺序处理；这里只展示每个滤镜的实际效果示例，不再手工填写参数。
                想按请求动态处理，请直接使用地址栏 URL 参数（如 ?size=100x100、?grayscale=1、?format=webp），无需开启本链。
                后台 JDK 管线未实现的滤镜即使开启也不会生效，并会在服务端日志告警。
              </p>
              <p v-if="adminForm.imageFilterEnabled && serializeChainRows() === ''" class="fs-admin__hint fs-admin__hint--warn">
                已启用但链为空：不会产生处理效果，请先开启至少一个滤镜。
              </p>
            </div>
          </section>

          <!-- 水印与安全 -->
          <section v-if="adminSectionsShown.security" id="fs-adm-security" class="fs-admin__section">
            <div class="fs-admin__group">水印与安全</div>
            <div v-if="admHitAny(ADMIN_SECURITY_ITEM_TERMS.watermark)" class="fs-admin__field">
              <span class="fs-admin__label fs-admin__label--field">水印文字</span>
              <el-input v-model="adminForm.watermark" placeholder="如：内部资料" clearable>
                <template #prefix><el-icon><Stamp /></el-icon></template>
              </el-input>
              <p class="fs-admin__hint">叠加到图片/文档预览上；留空表示不加水印。</p>
            </div>
            <div v-if="admHitAny(ADMIN_SECURITY_ITEM_TERMS.pathGuard)" class="fs-admin__field">
              <span class="fs-admin__label fs-admin__label--field">路径穿透防护</span>
              <div class="fs-admin__chainhead">
                <el-switch v-model="adminForm.openPathGuard" />
                <span class="fs-admin__chainstate">{{ adminForm.openPathGuard ? "已开启（默认）" : "已关闭" }}</span>
              </div>
              <p class="fs-admin__hint">
                拦截请求路径与文件动作参数中的 ..、反斜杠、NUL 等穿越特征（返回 400）；对象键级防护始终生效，与此开关无关。
              </p>
            </div>
          </section>

          <!-- 管理员令牌 -->
          <section v-if="adminSectionsShown.token" id="fs-adm-token" class="fs-admin__section">
            <div class="fs-admin__group">管理员令牌</div>
            <div class="fs-admin__field">
              <span class="fs-admin__label fs-admin__label--field">访问令牌</span>
              <el-input
                v-model="adminToken"
                type="password"
                show-password
                placeholder="后端启动日志 getToken() 或 /config 页获取"
              >
                <template #prefix><el-icon><Key /></el-icon></template>
                <template #suffix>
                  <el-icon
                    class="fs-admin__iconbtn"
                    title="复制令牌"
                    @click="copyAdminToken"
                  ><CopyDocument /></el-icon>
                </template>
              </el-input>
              <p class="fs-admin__hint">用于 API 鉴权，请妥善保管；服务重启后会重新生成，旧令牌立即失效。</p>
            </div>
          </section>
        </div>
      </div>

      <template #footer>
        <div class="fs-admin__foot">
          <span class="fs-admin__status">
            <i class="fs-admin__dot" aria-hidden="true" />
            保存后立即对后续请求生效，无需重启服务
          </span>
          <span class="fs-admin__acts">
            <el-button @click="adminVisible = false">取消</el-button>
            <el-button type="primary" :loading="adminSaving" @click="saveAdminConfig">保存并生效</el-button>
          </span>
        </div>
      </template>
    </ReDialog>

    <!-- ===== 上传对话框 =====
         队列式上传：选文件只入队，由「开始上传 / 全部开始」触发；
         关闭时若还有未完成项先确认，确认后中断全部请求。 -->
    <ReDialog
      v-model="uploadVisible"
      class="fs-up-dlg"
      width="720px"
      :append-to-body="true"
      destroy-on-close
      @closed="abortAllUploads"
    >
      <template #header>
        <div class="fs-up__head">
          <el-icon class="fs-up__head-icon" :size="18"><Upload /></el-icon>
          <span class="fs-up__head-title">上传文件</span>
        </div>
      </template>

      <div class="fs-up">
        <div class="fs-up__bar">
          <span class="fs-up__bar-label">上传至</span>
          <span class="fs-up__chip" :title="uploadTargetText">
            <el-icon :size="15"><Folder /></el-icon>
            <b>{{ bucket }}</b>
            <template v-if="uploadTargetPath">
              <span class="fs-up__chip-sep">/</span>
              <span class="fs-up__chip-path">{{ uploadTargetPath }}</span>
            </template>
          </span>
          <button type="button" class="fs-up__pick" @click="openUploadDirPicker">
            <el-icon :size="15"><FolderOpened /></el-icon>更换目录
          </button>
        </div>

        <div
          class="fs-up__drop"
          :class="{ 'is-active': uploadDropActive }"
          role="button"
          tabindex="0"
          @click="pickFiles"
          @keydown.enter="pickFiles"
          @dragover="onUploadDragOver"
          @dragleave="onUploadDragLeave"
          @drop="onUploadDrop"
        >
          <el-icon class="fs-up__drop-icon" :size="52"><UploadFilled /></el-icon>
          <p class="fs-up__drop-title">点击选择文件，或拖拽文件到此处</p>
          <p class="fs-up__drop-sub">支持多文件同时上传，单个文件不超过 500MB</p>
          <p class="fs-up__drop-hint">支持 JPG、PNG、PDF、DOCX、ZIP 等格式</p>
        </div>
        <input ref="uploadInput" type="file" multiple hidden @change="handleFileChange" />

        <div v-if="uploadItems.length" class="fs-up__queue">
          <div class="fs-up__queue-head">
            <span>待上传文件（{{ uploadItems.length }}）</span>
            <button type="button" class="fs-up__link" :disabled="!uploadHasPending" @click="startAllUploads">全部开始</button>
          </div>
          <ul class="fs-up__list">
            <li v-for="item in uploadItems" :key="item.id" class="fs-up__row" :class="`is-${item.status}`">
              <span class="fs-typeicon fs-up__row-icon" v-html="fileSvg(item.name, false)" aria-hidden="true" />
              <span class="fs-up__row-name" :title="item.name">{{ item.name }}</span>
              <span class="fs-up__row-size">{{ formatSize(item.size) }}</span>
              <span class="fs-up__row-tail">
                <template v-if="item.status === 'uploading'">
                  <span class="fs-up__track"><i class="fs-up__fill" :style="{ width: item.percent + '%' }" /></span>
                  <b class="fs-up__pct">{{ item.percent }}%</b>
                  <button type="button" class="fs-up__row-btn" title="暂停" @click="pauseUploadItem(item)">
                    <el-icon :size="15"><VideoPause /></el-icon>
                  </button>
                </template>
                <template v-else-if="item.status === 'done'">
                  <span class="fs-up__done"><el-icon :size="15"><CircleCheck /></el-icon>已完成</span>
                </template>
                <template v-else-if="item.status === 'error'">
                  <span class="fs-up__err" :title="item.error">上传失败</span>
                  <button type="button" class="fs-up__row-btn" title="重试" @click="retryUploadItem(item)">
                    <el-icon :size="15"><Refresh /></el-icon>
                  </button>
                </template>
                <template v-else-if="item.status === 'paused'">
                  <span class="fs-up__paused" title="后端不支持断点续传，继续会从头上传">已暂停</span>
                  <button type="button" class="fs-up__row-btn" title="继续（从头上传）" @click="startUploadItem(item)">
                    <el-icon :size="15"><VideoPlay /></el-icon>
                  </button>
                </template>
                <template v-else>
                  <span class="fs-up__wait">等待中</span>
                </template>
                <button type="button" class="fs-up__row-btn is-danger" title="移除" @click="removeUploadItem(item)">
                  <el-icon :size="15"><Delete /></el-icon>
                </button>
              </span>
            </li>
          </ul>
        </div>
      </div>

      <template #footer>
        <span class="fs-up__stat">已完成 {{ uploadDoneCount }}/{{ uploadItems.length }}</span>
        <el-button @click="closeUpload">取消</el-button>
        <el-button type="primary" :icon="Upload" :loading="uploading" :disabled="!uploadHasPending" @click="startAllUploads">
          开始上传
        </el-button>
      </template>
    </ReDialog>

    <!-- ===== 上传目标目录选择 ===== -->
    <ReDialog
      v-model="uploadDirVisible"
      class="fs-updir-dlg"
      width="420px"
      :append-to-body="true"
    >
      <template #header>
        <div class="fs-up__head">
          <el-icon class="fs-up__head-icon" :size="18"><FolderOpened /></el-icon>
          <span class="fs-up__head-title">更换上传目录</span>
        </div>
      </template>
      <div class="fs-updir">
        <div class="fs-updir__cur">
          <el-icon :size="15"><Folder /></el-icon>
          <span :title="uploadDirCursor || '根目录'">{{ uploadDirCursor || "根目录" }}</span>
        </div>
        <div class="fs-updir__list" v-loading="uploadTreeLoading">
          <button
            v-if="uploadDirCursor"
            type="button"
            class="fs-updir__item is-up"
            @click="uploadDirCursor = uploadDirCursor.split('/').slice(0, -1).join('/')"
          >
            <el-icon :size="15"><ArrowLeft /></el-icon>上一级
          </button>
          <div v-if="!uploadTreeLoading && !uploadTreeChildren(uploadDirCursor).length" class="fs-updir__empty">
            此目录下没有子目录，可直接上传到当前目录
          </div>
          <button
            v-for="d in uploadTreeChildren(uploadDirCursor)"
            :key="d.path"
            type="button"
            class="fs-updir__item"
            @click="uploadDirCursor = d.path"
          >
            <el-icon :size="15"><Folder /></el-icon>{{ d.name }}
          </button>
        </div>
      </div>
      <template #footer>
        <el-button @click="uploadDirVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmUploadDir">确定</el-button>
      </template>
    </ReDialog>

    <!-- ===== 创建链接对话框 ===== -->
    <ReDialog v-model="oneTimeVisible" :title="`创建访问链接 — ${oneTimeTarget?.name ?? ''}`" width="440px" :append-to-body="true" destroy-on-close>
      <el-form label-width="80px">
        <el-form-item label="类型">
          <el-radio-group v-model="oneTimeType">
            <el-radio value="once">一次性（访问即销毁）</el-radio>
            <el-radio value="expiry">限时（有效期内可多次访问）</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="oneTimeType === 'expiry'" label="过期时间">
          <div style="display:flex;gap:8px;align-items:center;width:100%">
            <el-input-number v-model="oneTimeExpiry" :min="10" :step="10" :controls="false" style="width:120px" />
            <span class="fs-expiry-unit">秒</span>
            <el-select v-model="oneTimeExpiry" placeholder="快捷选择" style="flex:1">
              <el-option v-for="opt in oneTimeExpiryOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
            </el-select>
          </div>
        </el-form-item>
        <el-form-item label="链接">
          <el-input v-model="oneTimeLink" placeholder="点击下方按钮生成" readonly :disabled="!oneTimeLink" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button v-if="oneTimeLink" :icon="Document" @click="copyOneTimeLink">复制链接</el-button>
        <el-button v-else type="primary" :loading="oneTimeGenerating" :icon="Document" @click="generateOneTimeLink">生成</el-button>
      </template>
      <el-alert v-if="oneTimeLink" :type="oneTimeType === 'once' ? 'warning' : 'success'" :closable="false" :title="oneTimeType === 'once' ? '该链接只能访问一次，访问后立即销毁' : '该链接在有效期内可多次访问，到期自动失效'" class="mt-3" />
    </ReDialog>

    <!-- ===== 自定义过期时间的限时链接（右键直达）=====
         与上面的「创建链接」分开：那个要先选类型再挑 9 档预设，
         这个只填一个时长就出链接，适合知道自己要多久的场景。 -->
    <ReDialog
      v-model="quickExpiryVisible"
      :title="`生成限时链接 — ${quickExpiryTarget?.name ?? ''}`"
      width="440px"
      :append-to-body="true"
      destroy-on-close
    >
      <el-form label-width="80px">
        <el-form-item label="过期时间">
          <el-input
            v-model="quickExpiryInput"
            placeholder="如 30s / 15m / 2h / 7d，或纯数字秒"
            clearable
            @keyup.enter="generateQuickExpiryLink"
          />
        </el-form-item>
        <el-form-item label="链接">
          <el-input v-model="quickExpiryResult" placeholder="填好过期时间后点生成" readonly :disabled="!quickExpiryResult" />
        </el-form-item>
      </el-form>
      <p class="fs-admin__tip">支持 s/m/h/d 单位，最长 30 天；有效期内可多次访问，到期自动失效</p>
      <template #footer>
        <el-button v-if="quickExpiryResult" :icon="Document" @click="copyQuickExpiryLink">复制链接</el-button>
        <el-button v-else type="primary" :loading="quickExpiryBusy" :icon="Document" @click="generateQuickExpiryLink">生成</el-button>
      </template>
    </ReDialog>

    <!-- ===== 链接管理：列出当前有效的一次性 / 限时链接，可复制、可关闭 ===== -->
    <ReDialog
      v-model="linkManageVisible"
      title="链接管理"
      width="820px"
      :append-to-body="true"
      destroy-on-close
      @closed="onLinkManageClosed"
    >
      <div class="fs-link-manage">
        <div class="fs-link-manage__bar">
          <span class="fs-admin__tip">这里只列出当前有效的一次性 / 限时链接；关闭后原地址立即失效。</span>
          <el-button size="small" :loading="linkManageLoading" @click="loadLinkManage">刷新</el-button>
        </div>
        <el-alert v-if="linkManageError" :title="linkManageError" type="error" :closable="false" class="mb-3" />
        <ReTable
          :data="linkManageTableRows"
          :loading="linkManageLoading"
          :pagination="false"
          :toolbar="false"
          size="small"
          row-key="token"
          border
          empty-text="暂无有效链接"
          :layout-table="{ minHeight: 0 }"
          data-testid="fs-link-manage-table"
        >
          <ReTableColumn prop="name" label="文件" min-width="160" show-overflow-tooltip />
          <ReTableColumn label="类型" width="80">
            <template #default="{ row }">{{ linkTypeText(row) }}</template>
          </ReTableColumn>
          <ReTableColumn label="过期时间" width="170">
            <template #default="{ row }">{{ linkExpireText(row) }}</template>
          </ReTableColumn>
          <ReTableColumn label="剩余" width="110">
            <template #default="{ row }">{{ linkRemainingText(row) }}</template>
          </ReTableColumn>
          <ReTableColumn label="操作" width="150" fixed="right">
            <template #default="{ row }">
              <el-button size="small" text type="primary" @click="copyManagedLink(row)">复制</el-button>
              <el-button size="small" text type="danger" @click="closeManagedLink(row)">关闭</el-button>
            </template>
          </ReTableColumn>
        </ReTable>
      </div>
      <template #footer>
        <el-button @click="linkManageVisible = false">关闭</el-button>
      </template>
    </ReDialog>

    <!-- ===== 对象属性 =====
         数据来源：列表项元数据 + 存储桶公开配置（?format=config）。
         配置字段不包含私密令牌，适合直接展示活动开关。 -->
    <ReDialog
      v-model="propsVisible"
      class="fs-props-dialog"
      width="520px"
      :title="`属性 — ${propsTarget?.name ?? ''}`"
      :show-close="true"
      :append-to-body="true"
      destroy-on-close
    >
      <template v-if="propsTarget">
        <dl class="fs-props">
          <div class="fs-props__row"><dt>名称</dt><dd>{{ propsTarget.name }}</dd></div>
          <div class="fs-props__row"><dt>类型</dt><dd>{{ propsTarget.directory ? '文件夹' : fileTypeText(propsTarget.name) }}</dd></div>
          <div class="fs-props__row"><dt>完整路径</dt><dd>{{ fullKey(propsTarget.name) }}</dd></div>
          <div v-if="!propsTarget.directory" class="fs-props__row"><dt>大小</dt><dd>{{ formatSize(propsTarget.size) }}</dd></div>
          <div class="fs-props__row"><dt>修改时间</dt><dd>{{ propsTarget.lastModified ? formatTime(propsTarget.lastModified) : '-' }}</dd></div>
          <div class="fs-props__sep" aria-hidden="true" />
          <div class="fs-props__row"><dt>存储桶</dt><dd>{{ bucketConfig?.bucket || bucket }}<el-icon :size="13" class="fs-props__loading" v-if="propsLoading"><RefreshRight /></el-icon></dd></div>
          <div class="fs-props__row"><dt>存储实现</dt><dd>{{ bucketConfig?.storage || '-' }}</dd></div>
          <div class="fs-props__row"><dt>允许预览</dt><dd>{{ bucketConfig ? (bucketConfig.openPreview ? '是' : '否') : '-' }}</dd></div>
          <div class="fs-props__row"><dt>允许下载</dt><dd>{{ bucketConfig ? (bucketConfig.openDownload ? '是' : '否') : '-' }}</dd></div>
          <div class="fs-props__row"><dt>允许分段</dt><dd>{{ bucketConfig ? (bucketConfig.openRange ? '是' : '否') : '-' }}</dd></div>
          <div class="fs-props__row"><dt>路径防护</dt><dd>{{ bucketConfig ? (bucketConfig.openPathGuard ? '是' : '否') : '-' }}</dd></div>
          <div class="fs-props__row"><dt>私有桶</dt><dd>{{ bucketConfig ? (bucketConfig.private ? '是' : '否') : '-' }}</dd></div>
          <div class="fs-props__row"><dt>三方预览</dt><dd>{{ bucketConfig?.thirdUrlPreview || '-' }}</dd></div>
          <div class="fs-props__row"><dt>水印</dt><dd>{{ bucketConfig?.watermark || '无' }}</dd></div>
        </dl>
      </template>
    </ReDialog>

    <!-- ===== 压缩包预览（新插件：居中弹框） =====
         压缩包开与图片 / 文档等内容预览同形态的居中 ReDialog
         （FvArchivePanel），包内浏览由 file-viewer
         archive 渲染器内存渲染接管，不再叠弹层；失败 @fallback
         退回下面的旧两层弹层兜底。 -->
    <ReDialog
      v-model="archiveDialogVisible"
      class="fs-preview-dlg fs-archive-dlg"
      width="min(1200px, 92vw)"
      top="5px"
      :title="previewName"
      :show-close="true"
      :draggable="true"
      :append-to-body="true"
      :close-on-click-modal="true"
      destroy-on-close
    >
      <FvArchivePanel
        v-if="archiveDialogVisible"
        :bucket="bucket"
        :object-key="previewKey"
        :file-name="previewName"
        :size="previewSize"
        @rendered="onOfficeRendered"
        @fallback="onArchivePanelFallback"
        @error="onArchivePanelError"
      />
    </ReDialog>

    <!-- ===== 压缩包结构弹层（第一层，两层拆分） =====
         需求：点包内**文件**弹新对话框（关闭回到原层级、面包屑状态保留），目录仍同层
         面包屑进入。因此结构面板独占本弹层，且在第二层内容弹层打开期间保持挂载 ——
         面板不卸载，面包屑/展开状态自然保留。内容链路（CAD/IFC/iframe…）全在第二层。 -->
    <ReDialog
      v-model="archiveVisible"
      class="fs-preview-dlg fs-archive-dlg"
      width="min(1200px, 92vw)"
      top="10px"
      :title="previewName"
      :show-close="true"
      :draggable="true"
      :append-to-body="true"
      :close-on-click-modal="true"
      destroy-on-close
    >
      <div class="fs-preview-shell">
        <div class="fs-preview">
          <ArchivePreviewPanel
            v-if="previewIsArchive"
            :bucket="bucket"
            :object-key="previewKey"
            :file-name="previewName"
            @open-entry="openArchiveEntry"
          />
        </div>
      </div>
    </ReDialog>

    <!-- ===== 预览弹层 =====
         保留 header 并启用 el-dialog 自带的 draggable：手柄就是 header，只有按住标题栏才拖得动。
         内容区（Excel / Word / iframe / Office 组件）不再挂任何 mousedown —— 此前把拖拽接管到
         内容外壳上，导致在 Excel 里点选单元格被当成拖拽起点，单元格跟着抖。
         代价是 header 高度从内容里扣掉，但换来「按哪动哪」，对表格类预览是必需的。 -->
    <ReDialog
      v-model="previewVisible"
      class="fs-preview-dlg fs-content-dlg"
      width="min(1200px, 92vw)"
      top="5px"
      :title="previewTitle"
      :show-close="true"
      :draggable="true"
      :append-to-body="true"
      :close-on-click-modal="true"
      destroy-on-close
      @closed="onEntryDialogClosed"
    >
      <div ref="previewShellRef" class="fs-preview-shell">
        <div class="fs-preview">
          <div v-if="previewLoading" class="fs-preview__skeleton">
            <div class="sk sk--w40 sk--h24" /><div class="sk sk--full sk--h200" /><div class="sk sk--w60 sk--h120" />
            <span class="fs-preview__loading-text">加载中…</span>
          </div>
          <div v-else-if="previewError" class="fs-preview__error">
            <el-empty description="预览加载失败">
              <el-button type="primary" :icon="Refresh" @click="retryPreview">重试</el-button>
              <el-button :icon="Download" @click="handleDownload({ name: previewName } as StorageObject, previewKey)">下载文件</el-button>
            </el-empty>
          </div>
          <!-- 下钻到压缩包内文件后的返回条：结构面板在第一层弹层里保持打开，
               这里的返回按钮等价于关闭本层弹层（也可直接点 X / Esc）。 -->
          <div
            v-if="!previewError && previewIsArchive && previewInnerPath"
            class="fs-preview__inner-bar"
          >
            <el-button :icon="ArrowLeft" text @click="backToArchive">返回压缩包</el-button>
            <span class="fs-preview__inner-path" :title="previewInnerPath">{{ previewInnerPath }}</span>
          </div>
          <!-- 压缩包结构面板（ArchivePreviewPanel）已拆到第一层弹层 fs-archive-dlg：
               本层只放包内条目 / 普通文件的内容链路，分支从 OFF/自研兜底起。 -->
          <!-- OFF：file-viewer renderer-3d 未登记，保留通用 3D 面板只接 OFF -->
          <PreviewModel3dPanel
            v-if="!previewError && showOffPanel"
            :bucket="bucket"
            :object-key="previewKey"
            :file-name="previewName"
            :inner="offInnerPath"
            :size="previewSize"
          />
          <!-- TGA：file-viewer 无 TGA 渲染器，纯前端 TS 解码器直渲 -->
          <PreviewTgaPanel
            v-else-if="!previewError && showTgaPanel"
            :bucket="bucket"
            :object-key="previewKey"
            :file-name="previewName"
            :inner="tgaPanelInnerPath"
            :size="previewSize"
          />
          <!-- SWF：Ruffle WASM 模拟器播放（自托管 public/ruffle 运行时） -->
          <PreviewSwfPanel
            v-else-if="!previewError && showSwfPanel"
            :bucket="bucket"
            :object-key="previewKey"
            :file-name="previewName"
            :inner="swfInnerPath"
            :size="previewSize"
          />
          <!-- Sketch：file-viewer 不支持，jszip 解结构前端渲染（页面/画板/预览图） -->
          <SketchPreviewPanel
            v-else-if="!previewError && showSketchPanel"
            :bucket="bucket"
            :object-key="previewKey"
            :file-name="previewName"
            :inner="sketchInnerPath"
            :size="previewSize"
          />
          <!-- 图片编辑/保存是 file-viewer 没有的能力，保留原生图片面板；
               TIFF/HEIC/JXL 等 file-viewer 可直接解码的格式继续落到 fvPanel -->
          <PreviewImagePanel
            v-else-if="!previewError && showImagePanel"
            :bucket="bucket"
            :object-key="previewKey"
            :file-name="previewName"
            :image-path="imageFilterPath"
            :thumb-url="previewThumbUrl"
            :version="previewLastModified"
            @saved="onImageSaved"
          />
          <!-- 视频：flv/m4v 不在 file-viewer formats 清单，仍走 video.js/flv.js -->
          <VideoPreviewPanel
            v-else-if="!previewError && showVideoPanel"
            :bucket="bucket"
            :object-key="previewKey"
            :file-name="previewName"
            :inner="videoInnerPath"
            :size="previewSize"
          />
          <!-- 音频/视频兜底：仅 aiff/mov/avi/mkv 等 file-viewer 未收录的容器；
               mp4/webm/m3u8/ogg 与常见音频由上方 file-viewer fvPanel 渲染 -->
          <PreviewMediaPanel
            v-else-if="!previewError && showMediaPanel"
            :bucket="bucket"
            :object-key="previewKey"
            :file-name="previewName"
            :inner="mediaInnerPath"
            :size="previewSize"
          />
          <!--
            OFD 版式文档：ofd 命中 CLIENT_RENDERABLE_EXTS（previewUsesClient），
            统一交给下方 PreviewOfficePanel 的 file-viewer renderer-ofd（纯 jszip
            解析，无 wasm/worker）。原 PreviewOfdPanel（@ofdjs/viewer）对本仓库
            OFD 样例会抛未捕获异常导致弹框关闭，故改走 file-viewer。
          -->
          <!--
            PDF 与「服务端转成 PDF 的文档」统一交给 file-viewer 的 renderer-pdf：
            .pdf 命中 previewUsesClient，落到下面的 PreviewOfficePanel；
            转换格式（ott/ots/otp/wps）也因 previewUsePdf=true 命中同一面板。
            不再使用 pdf.js viewer.html 分支。
          -->
          <PreviewOfficePanel
            v-else-if="!previewError && previewUsesClient && !previewForceServer"
            ref="officePanelRef"
            v-model:loading="officeLoading"
            :src="previewFrameSrc"
            :raw-src="previewInnerPath ? undefined : previewSrc"
            :file-name="fileNameForClientRender"
            @rendered="onOfficeRendered"
            @error="onOfficeError"
          />
          <!-- file-viewer 长尾面板（fv/*）：原生分支没吃掉的长尾格式统一走这里。
               取字节→File→@file-viewer 直渲；失败 @fallback 由父组件退服务端 iframe。
               与 office 面板同款条件：previewForceServer 时为 iframe 让路。 -->
          <component
            :is="fvPanel"
            v-else-if="!previewError && fvPanel && !previewForceServer"
            :key="`${previewKey}:${previewInnerPath || 'root'}`"
            :bucket="bucket"
            :object-key="previewKey"
            :file-name="previewName"
            :src="previewInnerPath ? undefined : previewSrc"
            :inner="previewInnerPath"
            :size="previewSize"
            @rendered="onOfficeRendered"
            @fallback="onClientPanelFallback"
          />
          <PreviewIframePanel
            v-else-if="!previewError"
            ref="iframePanelRef"
            :src="previewFrameSrc"
            :loading="iframeLoading"
            :frame-key="iframeKey"
            @load="onFrameLoad"
            @error="onFrameError"
          />
        </div>
      </div>
    </ReDialog>
  </div>
</template>

<style scoped>
/* ========================================================
   FileStorage · 云盘风格（koi / Element Plus 变量体系）
   页面底 --el-bg-color-page；白色圆角面板；主色渐变按钮
   ======================================================== */
.fs-app {
  display: flex;
  flex-direction: column;
  gap: 14px;
  height: 100%;
  min-height: 0;
  background: var(--el-bg-color-page, var(--el-fill-color-light));
  color: var(--el-text-color-primary);
  overflow: hidden;
}

/* 注：本块（.fs-top / .fs-searchbox / .fs-ghost-btn / .fs-upload-btn）原本服务于
   已被移出模板的旧顶栏，搜索框删除后整体不再有引用，属于改动前就存在的死样式。 */
.fs-top {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 12px;
}

.fs-top__right {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 10px;
}

.fs-ghost-btn {
  width: 40px;
  height: 40px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-full, 9999px);
  background: var(--el-bg-color, #fff);
  color: var(--el-text-color-secondary);
  cursor: pointer;
  transition: color var(--el-transition-duration, 0.2s), border-color var(--el-transition-duration, 0.2s);
}

.fs-ghost-btn:hover {
  color: var(--el-color-primary);
  border-color: var(--el-color-primary-light-5);
}

.fs-upload-btn {
  height: 44px;
  padding: 0 26px;
  border: none;
  border-radius: var(--el-radius-full, 9999px);
  /* 白字走令牌：EP 的 --el-color-white 会跟随主题/暗色，不会出现暗色下的白字白底 */
  color: var(--el-color-white);
  font-size: 15px;
  font-weight: 600;
  font-family: inherit;
  letter-spacing: 0.02em;
  cursor: pointer;
  background: linear-gradient(135deg,
    var(--el-color-primary),
    color-mix(in srgb, var(--el-color-primary) 55%, var(--el-color-info)));
  box-shadow: 0 6px 16px color-mix(in srgb, var(--el-color-primary) 30%, transparent);
  transition: transform var(--el-transition-duration, 0.2s), box-shadow var(--el-transition-duration, 0.2s);
}

.fs-upload-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 20px color-mix(in srgb, var(--el-color-primary) 38%, transparent);
}

.fs-upload-btn:active {
  transform: translateY(0);
}

/* ===== 主体：左导航 + 内容 ===== */
.fs-body {
  flex: 1;
  min-height: 0;
  display: flex;
  gap: 14px;
}

.fs-nav {
  flex-shrink: 0;
  width: 208px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-xl, 16px);
  background: var(--el-bg-color, #fff);
  overflow-y: auto;
}

.fs-nav__item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  height: 42px;
  padding: 0 12px;
  border: none;
  border-radius: var(--el-radius-lg, 12px);
  background: transparent;
  color: var(--el-text-color-regular);
  font-size: 14px;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  transition: background var(--el-transition-duration, 0.2s), color var(--el-transition-duration, 0.2s);
}

.fs-nav__item:hover {
  background: var(--el-fill-color-light);
  color: var(--el-text-color-primary);
}

.fs-nav__item.is-active {
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  font-weight: 600;
}

.fs-nav__label {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: baseline;
  text-align: left;
  white-space: nowrap;
  overflow: hidden;
}

.fs-nav__label-leaf {
  flex-shrink: 0;
  color: inherit;
}

.fs-nav__chev {
  color: var(--el-text-color-placeholder);
}

.fs-nav__item.is-active .fs-nav__chev {
  color: var(--el-color-primary);
}

.fs-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  padding: 14px 16px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-xl, 16px);
  background: var(--el-bg-color, #fff);
  overflow: hidden;
}

/* 内容头 */
.fs-main__head {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 12px;
  padding-bottom: 12px;
}

.fs-crumbs {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 4px;
  overflow: hidden;
  white-space: nowrap;
  font-size: 17px;
  font-weight: 600;
}

.fs-crumbs__sep {
  color: var(--el-text-color-placeholder);
  font-weight: 400;
}

.fs-crumbs__item {
  color: var(--el-text-color-secondary);
  font-weight: 500;
  cursor: pointer;
  padding: 2px 4px;
  border-radius: var(--el-radius-sm, 6px);
  transition: color var(--el-transition-duration, 0.2s);
}

.fs-crumbs__item:hover {
  color: var(--el-color-primary);
}

.fs-crumbs__item.is-current {
  color: var(--el-text-color-primary);
  font-weight: 700;
  cursor: default;
}

.fs-main__actions {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.fs-main__sel {
  font-size: 12px;
  font-weight: 600;
  color: var(--el-color-primary);
  white-space: nowrap;
}

/* 胶囊按钮 */
.fs-pill-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 34px;
  padding: 0 14px;
  border: 1px solid var(--el-border-color);
  border-radius: var(--el-radius-full, 9999px);
  background: var(--el-bg-color, #fff);
  color: var(--el-text-color-regular);
  font-size: 13px;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  white-space: nowrap;
  transition: color var(--el-transition-duration, 0.2s), border-color var(--el-transition-duration, 0.2s), background var(--el-transition-duration, 0.2s);
}

.fs-pill-btn:hover:not(:disabled) {
  color: var(--el-color-primary);
  border-color: var(--el-color-primary-light-5);
  background: var(--el-color-primary-light-9);
}

.fs-pill-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.fs-pill-btn--icon {
  width: 34px;
  padding: 0;
  justify-content: center;
}

.fs-pill-btn--danger {
  color: var(--el-color-danger);
  border-color: color-mix(in srgb, var(--el-color-danger) 35%, transparent);
}

.fs-pill-btn--danger:hover:not(:disabled) {
  color: var(--el-color-danger);
  border-color: var(--el-color-danger);
  background: var(--el-color-danger-light-9);
}

.fs-pill-btn__chev {
  margin-left: 2px;
  color: var(--el-text-color-placeholder);
}

.fs-mini-btn {
  height: 26px;
  padding: 0 12px;
  border: 1px solid var(--el-border-color);
  border-radius: var(--el-radius-full, 9999px);
  background: var(--el-bg-color, #fff);
  color: var(--el-text-color-regular);
  font-size: 12px;
  font-family: inherit;
  cursor: pointer;
  transition: color var(--el-transition-duration, 0.2s), border-color var(--el-transition-duration, 0.2s);
}

.fs-mini-btn:hover:not(:disabled) {
  color: var(--el-color-primary);
  border-color: var(--el-color-primary-light-5);
}

.fs-mini-btn--danger {
  color: var(--el-color-danger);
  border-color: color-mix(in srgb, var(--el-color-danger) 35%, transparent);
}

.fs-mini-btn--danger:hover:not(:disabled) {
  border-color: var(--el-color-danger);
}

/* ===== 文件列表区域 ===== */
.fs-files {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 2px 2px 16px;
}

/* 空状态 */
.fs-files__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 56px 0;
  color: var(--el-text-color-secondary);
  font-size: 13px;
}

.fs-files__empty small {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}

/* 详细信息 */
.fs-details-head,
.fs-details-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 110px 90px 160px;
  align-items: center;
  gap: 8px;
  padding: 0 10px;
  font-size: 13px;
}

.fs-details-head {
  position: sticky;
  top: 0;
  z-index: 5;
  padding-top: 8px;
  padding-bottom: 8px;
  background: var(--el-bg-color, #fff);
  border-bottom: 1px solid var(--el-border-color-lighter);
  font-size: 12px;
  font-weight: 600;
  color: var(--el-text-color-secondary);
}

.fs-details-head__col {
  cursor: pointer;
  user-select: none;
  border-radius: var(--el-radius-sm, 6px);
}

.fs-details-head__size {
  text-align: right;
}

.fs-sort-arrow {
  color: var(--el-color-primary);
  font-weight: 700;
}

.fs-details-row {
  height: 48px;
  border-radius: var(--el-radius-md, 8px);
  cursor: pointer;
  border: 1px solid transparent;
  transition: background var(--el-transition-duration, 0.2s);
}

.fs-details-row:hover {
  background: var(--el-fill-color-light);
}

.fs-details-row--selected {
  background: var(--el-color-primary-light-9);
  border-color: var(--el-color-primary-light-7);
}

.fs-details-row__name {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  overflow: hidden;
}

.fs-details-row__name span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.fs-details-row__icon {
  width: 20px;
  height: 20px;
  font-size: 20px;
  flex-shrink: 0;
}

.fs-name--dir {
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.fs-details-row__type,
.fs-details-row__size,
.fs-details-row__time {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.fs-details-row__size {
  text-align: right;
}

/* 管理员配置控制详情列显隐（showFormat/showSize/showTime），网格随可见列收缩 */
.fs-files--details.fs-details--no-format .fs-details-head, .fs-files--details.fs-details--no-format .fs-details-row { grid-template-columns: minmax(0, 1fr) 90px 160px; }
.fs-files--details.fs-details--no-size .fs-details-head, .fs-files--details.fs-details--no-size .fs-details-row { grid-template-columns: minmax(0, 1fr) 110px 160px; }
.fs-files--details.fs-details--no-time .fs-details-head, .fs-files--details.fs-details--no-time .fs-details-row { grid-template-columns: minmax(0, 1fr) 110px 160px; }
.fs-files--details.fs-details--no-size.fs-details--no-time .fs-details-head, .fs-files--details.fs-details--no-size.fs-details--no-time .fs-details-row { grid-template-columns: minmax(0, 1fr) 110px; }
.fs-files--details.fs-details--no-format.fs-details--no-size .fs-details-head, .fs-files--details.fs-details--no-format.fs-details--no-size .fs-details-row { grid-template-columns: minmax(0, 1fr) 160px; }
.fs-files--details.fs-details--no-format.fs-details--no-time .fs-details-head, .fs-files--details.fs-details--no-format.fs-details--no-time .fs-details-row { grid-template-columns: minmax(0, 1fr) 90px; }
.fs-files--details.fs-details--no-format.fs-details--no-size.fs-details--no-time .fs-details-head, .fs-files--details.fs-details--no-format.fs-details--no-size.fs-details--no-time .fs-details-row { grid-template-columns: minmax(0, 1fr); }

/* 大图标（云盘卡片） */
.fs-files--large {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(158px, 1fr));
  gap: 14px;
  align-content: start;
}

.fs-lg-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 20px 12px 14px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-lg, 12px);
  background: var(--el-bg-color, #fff);
  cursor: pointer;
  user-select: none;
  transition: border-color var(--el-transition-duration, 0.2s), box-shadow var(--el-transition-duration, 0.2s), transform var(--el-transition-duration, 0.2s);
}

.fs-lg-card:hover {
  border-color: var(--el-color-primary-light-5);
  box-shadow: 0 6px 18px rgb(0 0 0 / 6%);
  transform: translateY(-2px);
}

.fs-lg-card--selected {
  border-color: var(--el-color-primary);
  box-shadow: 0 0 0 1px var(--el-color-primary), 0 8px 20px color-mix(in srgb, var(--el-color-primary) 18%, transparent);
}

.fs-lg-card__thumb {
  width: 86px;
  height: 86px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.fs-lg-card__thumb svg {
  width: 76px;
  height: 76px;
}

.fs-lg-card__thumb .fs-card-icon {
  font-size: 76px;
}

/* 目录图标：默认灰阶，悬停/选中恢复黄色（对齐设计稿） */
.fs-lg-card__thumb.icon-folder .fs-card-icon {
  filter: grayscale(1);
  opacity: 0.55;
  transition: filter var(--el-transition-duration, 0.2s), opacity var(--el-transition-duration, 0.2s);
}

.fs-lg-card:hover .fs-lg-card__thumb.icon-folder .fs-card-icon,
.fs-lg-card--selected .fs-lg-card__thumb.icon-folder .fs-card-icon {
  filter: none;
  opacity: 1;
}

.fs-lg-card__frame {
  width: 100%;
  height: 100%;
  border: none;
  border-radius: var(--el-radius-md, 8px);
  object-fit: cover;
  pointer-events: none;
  filter: var(--fs-image-filter, none);
}

.fs-lg-card__label {
  width: 100%;
  margin-top: 10px;
  text-align: center;
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.fs-lg-card__meta {
  width: 100%;
  text-align: center;
  font-size: 11px;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.fs-lg-card__ops {
  display: flex;
  gap: 6px;
  margin-top: 8px;
}

/* 选中态右上角 X 徽标 */
.fs-lg-card__x,
.fs-md-card__x {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 20px;
  height: 20px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--el-radius-full, 9999px);
  background: var(--el-color-primary);
  color: var(--el-color-white);
  box-shadow: 0 2px 8px color-mix(in srgb, var(--el-color-primary) 40%, transparent);
}

/* 中图标 */
.fs-files--medium {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(112px, 1fr));
  gap: 8px;
  align-content: start;
}

.fs-md-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 12px 6px 10px;
  border: 1px solid transparent;
  border-radius: var(--el-radius-lg, 12px);
  cursor: pointer;
  user-select: none;
  transition: background var(--el-transition-duration, 0.2s), border-color var(--el-transition-duration, 0.2s);
}

.fs-md-card:hover {
  background: var(--el-fill-color-light);
}

.fs-md-card--selected {
  background: var(--el-color-primary-light-9);
  border-color: var(--el-color-primary-light-7);
}

.fs-md-card__thumb {
  width: 54px;
  height: 54px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.fs-md-card__thumb svg {
  width: 48px;
  height: 48px;
}

.fs-md-card__thumb .fs-card-icon {
  font-size: 38px;
}

.fs-md-card__label {
  width: 100%;
  text-align: center;
  font-size: 12px;
  color: var(--el-text-color-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 小图标 */
.fs-files__small-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 2px;
}

.fs-sm-row {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 40px;
  padding: 0 8px;
  border: 1px solid transparent;
  border-radius: var(--el-radius-sm, 6px);
  cursor: pointer;
  font-size: 12.5px;
  overflow: hidden;
  transition: background var(--el-transition-duration, 0.2s);
}

.fs-sm-row:hover {
  background: var(--el-fill-color-light);
}

.fs-sm-row--selected {
  background: var(--el-color-primary-light-9);
  border-color: var(--el-color-primary-light-7);
}

.fs-sm-row__icon {
  width: 16px;
  height: 16px;
  font-size: 16px;
  flex-shrink: 0;
}

.fs-sm-row__name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ===== 共享文件 ===== */
.fs-files--shared {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.fs-link-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-lg, 12px);
  background: var(--el-bg-color, #fff);
}

.fs-link-row__icon {
  width: 30px;
  height: 30px;
  flex-shrink: 0;
  display: inline-flex;
}

.fs-link-row__icon svg {
  width: 100%;
  height: 100%;
}

.fs-link-row__body {
  flex: 1;
  min-width: 0;
}

.fs-link-row__name {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.fs-link-row__url {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.fs-link-row__type {
  flex-shrink: 0;
  padding: 2px 10px;
  border-radius: var(--el-radius-full, 9999px);
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  font-size: 11px;
  font-weight: 600;
}

/* ===== 回收站 ===== */
.fs-recycle {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.fs-recycle-head {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.fs-recycle-head-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--text-primary, var(--el-text-color-primary, #303133));
}
.fs-recycle-head-sub {
  font-size: 12px;
  color: var(--text-secondary, var(--el-text-color-secondary, #909399));
  flex: 1;
  min-width: 0;
}

.fs-recycle-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.fs-recycle-group-hd {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-bottom: 6px;
  border-bottom: 1px dashed var(--border-subtle, var(--el-border-color-lighter, #e8ebf0));
}
.fs-recycle-group-name {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary, var(--el-text-color-secondary, #606266));
}
.fs-recycle-group-cnt {
  font-size: 11px;
  color: var(--text-tertiary, #a8abb2);
  background: var(--bg-subtle, #f4f4f5);
  border-radius: 999px;
  padding: 0 8px;
  line-height: 1.8;
}

.fs-recycle-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.fs-recycle-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border: 1px solid var(--border-subtle, var(--el-border-color-lighter, #eef0f3));
  border-radius: var(--el-radius-md, 10px);
  background: var(--bg-container, #fff);
  transition: border-color var(--el-transition-duration, 0.2s), box-shadow var(--el-transition-duration, 0.2s);
}
.fs-recycle-row:hover {
  border-color: var(--el-color-primary-light-7, #b3d8ff);
  box-shadow: 0 2px 10px rgb(0 0 0 / 5%);
}
.fs-recycle-ic {
  width: 40px;
  height: 40px;
  flex: none;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  background: var(--bg-subtle, #f4f4f5);
  filter: grayscale(0.4);
  opacity: 0.85;
}
.fs-recycle-ic .fs-typeicon {
  font-size: 26px;
}
.fs-recycle-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.fs-recycle-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary, var(--el-text-color-primary, #303133));
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.fs-recycle-meta {
  font-size: 11px;
  color: var(--text-secondary, var(--el-text-color-secondary, #909399));
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.fs-recycle-acts {
  display: flex;
  gap: 8px;
  flex: none;
}
.fs-recycle-acts .fs-mini-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

/* ===== 拖拽放置目标高亮（四种视图通用） ===== */
.fs-row--drop {
  outline: 2px dashed var(--el-color-primary);
  outline-offset: -2px;
  background: var(--el-color-primary-light-9) !important;
}

/* ===== 右键菜单 ===== */
.fs-ctx {
  position: fixed;
  z-index: 100000;
  min-width: 168px;
  padding: 6px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-lg, 12px);
  background: var(--el-bg-color-overlay, #fff);
  box-shadow: 0 12px 32px rgb(0 0 0 / 12%);
  font-size: 13px;
}

.fs-ctx__item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 7px 10px;
  border: none;
  border-radius: var(--el-radius-md, 8px);
  background: transparent;
  cursor: pointer;
  text-align: left;
  color: var(--el-text-color-regular);
  font-size: 13px;
  font-family: inherit;
  transition: background var(--el-transition-duration, 0.2s), color var(--el-transition-duration, 0.2s);
}

.fs-ctx__item:hover {
  background: var(--el-fill-color-light);
  color: var(--el-color-primary);
}

.fs-ctx__item svg,
.fs-ctx__item .el-icon {
  flex-shrink: 0;
  color: var(--el-text-color-secondary);
}

.fs-ctx__item--danger {
  color: var(--el-color-danger);
}

.fs-ctx__item--danger:hover {
  background: var(--el-color-danger-light-9);
  color: var(--el-color-danger);
}

.fs-ctx__sep {
  height: 1px;
  margin: 5px 8px;
  background: var(--el-border-color-extra-light, var(--el-border-color-lighter));
}

/* ===== 预览 ===== */
/* 内容外壳只负责裁剪结构。刻意不给 cursor: move —— 拖拽手柄是 header，
   这里的 move 光标会让人以为内容区也能拖，白按一场。 */
.fs-preview-shell {
  display: flex;
  height: 100%;
  flex-direction: column;
  min-height: 0;
  /* 吃满 body：否则内部面板的 height:100% / flex:1 没有可参照的高度，
     内容会按自身高度撑开，滚动条落在半空 */
  flex: 1;
}

.fs-preview {
  height: 100%;
  min-height: 200px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  /* 同上：把 body 的高度继续传递下去 */
  flex: 1;
  min-height: 0;
}

/* 压缩包 / CAD / 3D / 音视频 / 地理 / BPMN / TGA / OFD / drawio / DICOM / SWF 面板撑满可用宽度：
   .fs-preview 是 align-items:center 的列 flex，子元素默认按内容宽度收缩，面板必须显式拉满（stretch）。 */
.fs-preview > :deep(.arc),
.fs-preview > :deep(.cad),
.fs-preview > :deep(.m3d),
.fs-preview > :deep(.media),
.fs-preview > :deep(.geo),
.fs-preview > :deep(.bpmn),
.fs-preview > :deep(.tga),
.fs-preview > :deep(.ofd),
.fs-preview > :deep(.drawio),
.fs-preview > :deep(.dcm),
.fs-preview > :deep(.swf) {
  align-self: stretch;
}

/* 下钻包内文件后的返回条：与面板同一套 koi 变量，不引入新的色值或圆角档位 */
.fs-preview__inner-bar {
  align-self: stretch;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 6px 4px 4px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-md, 8px);
  background: var(--el-bg-color);
}

.fs-preview__inner-path {
  flex: 1;
  min-width: 0;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.fs-preview__media {
  max-width: 100%;
  border-radius: var(--el-radius-md, 8px);
}

.fs-preview__img-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6px;
}

.fs-preview__img {
  max-width: 100%;
  max-height: 64vh;
  border-radius: var(--el-radius-md, 8px);
  box-shadow: 0 1px 6px rgb(0 0 0 / 15%);
  filter: var(--fs-image-filter, none);
}

.fs-preview__code {
  width: 100%;
  max-height: 60vh;
  margin: 0;
  padding: 12px;
  overflow: auto;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-md, 8px);
  background: var(--el-fill-color-light);
  color: var(--el-text-color-primary);
  font-family: ui-monospace, Menlo, Consolas, monospace;
  font-size: 13px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-all;
}

.fs-preview__error {
  width: 100%;
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 32px;
  background:
    radial-gradient(
      ellipse at center,
      color-mix(in srgb, var(--el-color-danger, #f56c6c) 6%, transparent) 0%,
      transparent 70%
    );
}

.fs-preview__skeleton {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 16px 0;
}

.fs-preview__loading-text {
  font-size: 13px;
  color: var(--el-color-primary, #409eff);
  font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
  letter-spacing: 0.5px;
  animation: pulse-glow 2s ease-in-out infinite;
}

@keyframes pulse-glow {
  0%, 100% { opacity: 0.5; text-shadow: none; }
  50% { opacity: 1; text-shadow: 0 0 8px var(--el-color-primary, #409eff); }
}

.sk {
  border-radius: 6px;
  background: linear-gradient(
    90deg,
    color-mix(in srgb, var(--el-color-primary, #409eff) 8%, var(--el-fill-color-light)) 25%,
    color-mix(in srgb, var(--el-color-primary, #409eff) 18%, var(--el-fill-color)) 50%,
    color-mix(in srgb, var(--el-color-primary, #409eff) 8%, var(--el-fill-color-light)) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.4s ease-in-out infinite;
}

.sk--w40 { width: 40%; height: 22px; }
.sk--w60 { width: 60%; height: 110px; }
.sk--full { width: 100%; height: 180px; }

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* ===== Element Plus 弹窗对齐 koi 圆角 ===== */
.fs-app :deep(.el-dialog) {
  border-radius: var(--el-radius-xl, 16px);
  overflow: hidden;
}

.fs-app :deep(.el-dialog__header) {
  padding: 14px 18px;
  margin-right: 0;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.fs-app :deep(.el-dialog__title) {
  font-size: 15px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.fs-app :deep(.el-dialog__body) {
  padding: 16px 18px;
}

.fs-app :deep(.el-dialog__footer) {
  padding: 10px 18px 14px;
  border-top: 1px solid var(--el-border-color-extra-light, var(--el-border-color-lighter));
}

/* ===== 管理员系统配置弹窗（左分组 + 右内容；色值走 koi 的 --el-* 令牌） ===== */
.fs-admin__head {
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
  padding-right: 40px; /* 给 el-dialog 自带关闭按钮让位 */
}

.fs-admin__logo {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  flex-shrink: 0;
  border-radius: var(--el-radius-md, 8px);
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
}

.fs-admin__titles {
  min-width: 0;
  flex: 1;
}

.fs-admin__title {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  line-height: 1.3;
  color: var(--el-text-color-primary);
}

.fs-admin__subtitle {
  margin: 3px 0 0;
  font-size: 12.5px;
  color: var(--el-text-color-secondary);
}

.fs-admin__search {
  width: 230px;
  flex-shrink: 0;
}

.fs-admin {
  display: flex;
  align-items: flex-start;
  gap: 22px;
  min-height: 380px;
  max-height: min(64vh, 660px);
}

/* 左侧分组 */
.fs-admin__side {
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 176px;
  flex-shrink: 0;
  align-self: stretch;
  padding-right: 18px;
  border-right: 1px solid var(--el-border-color-lighter);
}

.fs-admin__side-cap {
  padding: 4px 10px 8px;
  font-size: 12px;
  letter-spacing: 0.04em;
  color: var(--el-text-color-secondary);
}

.fs-admin__nav {
  display: flex;
  align-items: center;
  gap: 9px;
  width: 100%;
  padding: 9px 11px;
  border: none;
  border-radius: var(--el-radius-md, 8px);
  background: transparent;
  color: var(--el-text-color-regular);
  font-size: 13.5px;
  text-align: left;
  cursor: pointer;
  transition: background var(--el-transition-duration, 0.2s), color var(--el-transition-duration, 0.2s);
}

.fs-admin__nav:hover {
  background: var(--el-fill-color-light);
  color: var(--el-text-color-primary);
}

.fs-admin__nav.is-active {
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  font-weight: 600;
}

.fs-admin__reset {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: auto;
  padding: 9px 11px;
  border: none;
  border-radius: var(--el-radius-md, 8px);
  background: transparent;
  color: var(--el-text-color-secondary);
  font-size: 13px;
  cursor: pointer;
  transition: background var(--el-transition-duration, 0.2s), color var(--el-transition-duration, 0.2s);
}

.fs-admin__reset:hover {
  background: var(--el-fill-color-light);
  color: var(--el-color-danger);
}

/* 右侧内容 */
.fs-admin__main {
  position: relative;
  flex: 1;
  min-width: 0;
  /* 关键：让右栏拉伸到 .fs-admin 的限高（min-height/max-height），自身产生滚动条。
     此前缺 align-self（父级 align-items:flex-start），右栏高度等于内容高度，
     overflow-y:auto 永不生效 —— 左侧点击 scrollTo 成了无操作，表现为「点击没反应」。 */
  align-self: stretch;
  overflow-y: auto;
  padding-right: 6px;
}

.fs-admin__empty {
  margin: 48px 0;
  text-align: center;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.fs-admin__section + .fs-admin__section {
  margin-top: 26px;
}

.fs-admin__group {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
  font-size: 13.5px;
  font-weight: 600;
  color: var(--el-text-color-secondary);
  letter-spacing: 0.02em;
}

.fs-admin__group::after {
  content: "";
  flex: 1;
  height: 1px;
  background: var(--el-border-color-lighter);
}

/* 文件功能开关卡片 */
.fs-admin__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.fs-admin__tile {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 13px 15px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-lg, 12px);
  background: var(--el-bg-color);
  transition: border-color var(--el-transition-duration, 0.2s), background var(--el-transition-duration, 0.2s);
}

.fs-admin__tile:hover {
  border-color: var(--el-color-primary-light-5);
}

.fs-admin__tileicon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  flex-shrink: 0;
  border-radius: var(--el-radius-md, 8px);
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
}

.fs-admin__tiletext {
  display: flex;
  flex-direction: column;
  gap: 3px;
  flex: 1;
  min-width: 0;
}

.fs-admin__desc {
  font-size: 12px;
  line-height: 1.5;
  color: var(--el-text-color-secondary);
}

/* 通用设置项标签 */
.fs-admin__label {
  font-size: 13.5px;
  font-weight: 600;
  line-height: 1.4;
  color: var(--el-text-color-primary);
}

.fs-admin__label--field {
  display: block;
  margin-bottom: 8px;
  font-size: 12.5px;
  font-weight: 500;
  color: var(--el-text-color-secondary);
}

.fs-admin__label--pill {
  font-weight: 500;
  font-size: 13px;
  color: inherit;
}

/* 布局类型卡片 */
.fs-admin__field {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.fs-admin__layouts {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.fs-admin__layout {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 9px;
  padding: 13px;
  border: 2px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-lg, 12px);
  background: var(--el-bg-color);
  cursor: pointer;
  text-align: left;
  transition: border-color var(--el-transition-duration, 0.2s), background var(--el-transition-duration, 0.2s);
}

.fs-admin__layout:hover {
  border-color: var(--el-color-primary-light-5);
}

.fs-admin__layout.is-active {
  border-color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}

.fs-admin__layoutart {
  position: relative;
  display: block;
  width: 100%;
  height: 58px;
  border-radius: var(--el-radius-sm, 6px);
  background: var(--el-fill-color-light);
  overflow: hidden;
}

.fs-admin__layoutart i {
  position: absolute;
  display: block;
  border-radius: 3px;
  background: var(--el-fill-color);
}

.fs-admin__layoutart--system i:nth-child(1) {
  left: 8px;
  top: 8px;
  width: 26%;
  height: calc(100% - 16px);
}

.fs-admin__layoutart--system i:nth-child(2) {
  left: calc(26% + 18px);
  right: 24px;
  top: 13px;
  height: 8px;
}

.fs-admin__layoutart--system i:nth-child(3) {
  left: calc(26% + 18px);
  right: 40px;
  top: 27px;
  height: 8px;
}

.fs-admin__layoutart--simple i:nth-child(1) {
  left: 16px;
  right: 16px;
  top: 11px;
  height: 8px;
  background: var(--el-color-primary-light-5);
}

.fs-admin__layoutart--simple i:nth-child(2) {
  left: 16px;
  right: 32px;
  top: 27px;
  height: 8px;
}

.fs-admin__layoutart--simple i:nth-child(3) {
  left: 16px;
  right: 22px;
  top: 43px;
  height: 8px;
}

.fs-admin__layoutname {
  font-size: 13.5px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.fs-admin__check {
  position: absolute;
  top: 10px;
  right: 10px;
  display: none;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--el-color-primary);
  color: var(--el-color-white);
}

.fs-admin__layout.is-active .fs-admin__check {
  display: inline-flex;
}

/* 列显示开关（胶囊按钮） */
.fs-admin__pills {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 16px;
}

.fs-admin__pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  border: 1px solid var(--el-border-color);
  border-radius: var(--el-radius-full, 9999px);
  background: var(--el-bg-color);
  color: var(--el-text-color-secondary);
  font-size: 13px;
  cursor: pointer;
  transition: border-color var(--el-transition-duration, 0.2s), background var(--el-transition-duration, 0.2s), color var(--el-transition-duration, 0.2s);
}

.fs-admin__pill.is-on {
  border-color: var(--el-color-primary-light-5);
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
}

/* 两列设置项 */
.fs-admin__fields {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px 18px;
  margin-top: 18px;
}

.fs-admin__field--wide {
  grid-column: 1 / -1;
}

.fs-admin__select {
  width: 100%;
}

/* 下拉选项：主标签 + 后台下发的实现说明（三方 URL 预览能力） */
.fs-admin__optiontext {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 3px 0;
  line-height: 1.4;
}

.fs-admin__optdesc {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  white-space: normal;
}

.fs-admin__hint {
  margin: 7px 0 0;
  font-size: 12px;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
}

.fs-admin__hint--warn {
  color: var(--el-color-warning);
}

/* 图片处理：URL 参数能力徽标 */
.fs-admin__caps {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 10px;
}

.fs-admin__cap {
  padding: 3px 9px;
  border-radius: var(--el-radius-full, 9999px);
  background: var(--el-fill-color-light);
  color: var(--el-text-color-regular);
  font-size: 12px;
  font-family: var(--el-font-family-mono, ui-monospace, SFMono-Regular, Menlo, monospace);
}

.fs-admin__cap--muted {
  color: var(--el-text-color-secondary);
}

/* 图片处理：全局滤镜链开关列表（与「图片滤镜」一致的选择方式） */
.fs-admin__filtergrid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin-top: 12px;
}

.fs-admin__filteritem {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px 12px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-md, 8px);
  background: var(--el-bg-color);
  transition: border-color var(--el-transition-duration, 0.2s), background var(--el-transition-duration, 0.2s);
}

.fs-admin__filteritem.is-on {
  border-color: var(--el-color-primary-light-5);
  background: var(--el-color-primary-light-9);
}

.fs-admin__filterhead {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.fs-admin__filterparam {
  width: 100%;
}

.fs-admin__filterexample {
  font-size: 12px;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
  word-break: break-word;
  margin: 0;
}

.fs-admin__retry {
  align-self: flex-start;
  margin-top: 4px;
  padding: 0;
}

/* 图片处理：全局滤镜链编辑 */
.fs-admin__chainhead {
  display: flex;
  align-items: center;
  gap: 10px;
}

.fs-admin__chainstate {
  font-size: 12.5px;
  color: var(--el-text-color-secondary);
}

.fs-admin__unit {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
}

/* 私有桶标签输入 */
.fs-admin__tags {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  min-height: 40px;
  padding: 6px 9px;
  border: 1px solid var(--el-border-color);
  border-radius: var(--el-radius-md, 8px);
  background: var(--el-bg-color);
  cursor: text;
}

.fs-admin__tags:hover {
  border-color: var(--el-border-color-hover, var(--el-color-primary-light-5));
}

.fs-admin__tag {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 8px;
  border-radius: var(--el-radius-full, 9999px);
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  font-size: 12.5px;
}

.fs-admin__tagx {
  cursor: pointer;
  opacity: 0.7;
}

.fs-admin__tagx:hover {
  opacity: 1;
}

.fs-admin__taginput {
  flex: 1;
  min-width: 120px;
  border: none;
  outline: none;
  background: transparent;
  color: var(--el-text-color-primary);
  font-size: 13px;
  line-height: 26px;
}

.fs-admin__taginput::placeholder {
  color: var(--el-text-color-placeholder);
}

/* 令牌复制图标 */
.fs-admin__iconbtn {
  cursor: pointer;
  color: var(--el-text-color-secondary);
}

.fs-admin__iconbtn:hover {
  color: var(--el-color-primary);
}

/* 底部状态与操作 */
.fs-admin__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
}

.fs-admin__status {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  font-size: 12.5px;
  color: var(--el-text-color-secondary);
}

.fs-admin__dot {
  width: 8px;
  height: 8px;
  flex-shrink: 0;
  border-radius: 50%;
  background: var(--el-color-success);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-success) 20%, transparent);
}

.fs-admin__acts {
  display: inline-flex;
  gap: 10px;
  flex-shrink: 0;
}

/* 其它弹窗仍在使用（限时链接的说明文案） */
.fs-admin__tip {
  margin: 10px 0 0;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

/* 链接管理：顶部说明 + 刷新，下面是链接表格 */
.fs-link-manage__bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}
.fs-link-manage__bar .fs-admin__tip {
  margin: 0;
}

@media (max-width: 900px) {
  .fs-admin {
    flex-direction: column;
    gap: 14px;
  }

  .fs-admin__side {
    width: 100%;
    flex-direction: row;
    flex-wrap: wrap;
    align-self: auto;
    padding: 0 0 10px;
    border-right: none;
    border-bottom: 1px solid var(--el-border-color-lighter);
  }

  .fs-admin__side-cap {
    width: 100%;
  }

  .fs-admin__reset {
    margin-top: 0;
    margin-left: auto;
  }

  .fs-admin__grid,
  .fs-admin__layouts,
  .fs-admin__fields {
    grid-template-columns: minmax(0, 1fr);
  }

  .fs-admin__search {
    width: 160px;
  }
}

/* 手机：标题栏不挤成一列，侧栏与设置项改为单列滚动 */
@media (max-width: 640px) {
  .fs-admin-dialog.el-dialog {
    width: calc(100vw - 16px) !important;
    max-width: calc(100vw - 16px);
    margin: 8px auto;
  }

  .fs-admin-dialog .el-dialog__header {
    padding: 14px 16px 12px;
  }

  .fs-admin-dialog .el-dialog__headerbtn {
    top: 10px;
    right: 10px;
  }

  .fs-admin-dialog .el-dialog__body {
    padding: 12px 16px 4px;
  }

  .fs-admin-dialog .el-dialog__footer {
    padding: 10px 16px 14px;
  }

  .fs-admin__head {
    flex-wrap: wrap;
    gap: 10px;
    padding-right: 28px;
  }

  .fs-admin__logo {
    width: 36px;
    height: 36px;
  }

  .fs-admin__title {
    font-size: 16px;
    white-space: nowrap;
  }

  .fs-admin__subtitle {
    margin-top: 2px;
    font-size: 11.5px;
  }

  .fs-admin__search {
    order: 3;
    width: 100%;
  }

  .fs-admin__side-cap {
    padding: 0 8px 6px;
  }

  .fs-admin__nav {
    padding: 8px 9px;
    font-size: 13px;
  }

  .fs-admin {
    max-height: min(58vh, 520px);
  }

  .fs-admin__field--wide {
    grid-column: auto;
  }

  .fs-admin__filtergrid {
    grid-template-columns: minmax(0, 1fr);
  }

  .fs-admin__foot {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }

  .fs-admin__status {
    font-size: 11.5px;
  }

  .fs-admin__acts {
    justify-content: flex-end;
  }

  .fs-admin-dialog .el-dialog__footer .el-button {
    height: 34px;
    padding: 0 16px;
  }
}

/* 响应式 */
@media (max-width: 992px) {
  .fs-nav {
    width: 168px;
  }
}

@media (max-width: 768px) {
  .fs-app {
    padding: 8px;
  }
  .fs-top {
    flex-wrap: wrap;
  }
  .fs-upload-btn {
    padding: 0 16px;
  }
  .fs-body {
    flex-direction: column;
  }
  .fs-nav {
    width: 100%;
    flex-direction: row;
    overflow-x: auto;
  }
  .fs-nav__item {
    width: auto;
    flex-shrink: 0;
  }
  .fs-nav__chev {
    display: none;
  }
  .fs-files--large {
    grid-template-columns: repeat(auto-fill, minmax(118px, 1fr));
  }
  .fs-files--medium {
    grid-template-columns: repeat(auto-fill, minmax(92px, 1fr));
  }
  .fs-details-head,
  .fs-details-row {
    grid-template-columns: minmax(0, 1fr) 70px 56px;
  }
  .fs-details-head__type,
  .fs-details-row__type {
    display: none;
  }
}

/* ========================================================
   目录树导航 / 路径栏 / 工具栏 / 状态栏（对齐资源管理器布局）
   ======================================================== */
.fs-app {
  gap: 0;
}

.fs-nav {
  width: 232px;
  gap: 0;
  padding: 8px;
  overflow: hidden;
}

.fs-nav__section {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.fs-nav__section--quick {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}

.fs-nav__title {
  padding: 6px 10px 4px;
  font-size: 12px;
  font-weight: 600;
  color: var(--el-text-color-placeholder);
}

.fs-nav__empty {
  padding: 6px 10px;
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}

/* 快捷访问截断提示 */
.fs-nav__more {
  padding: 4px 10px 6px;
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}

.fs-nav__item {
  height: 36px;
  padding: 0 10px;
  border-radius: var(--el-radius-md, 8px);
  font-size: 13px;
}

.fs-nav__typeicon {
  color: inherit;
}

.fs-nav__foot {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid var(--el-border-color-extra-light, var(--el-border-color-lighter));
}

.fs-nav__foot-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 36px;
  padding: 0 10px;
  border: none;
  border-radius: var(--el-radius-md, 8px);
  background: transparent;
  color: var(--el-text-color-regular);
  font-size: 13px;
  font-family: inherit;
  cursor: pointer;
  transition: background var(--el-transition-duration, 0.2s), color var(--el-transition-duration, 0.2s);
}

.fs-nav__foot-btn:hover {
  background: var(--el-fill-color-light);
  color: var(--el-text-color-primary);
}

.fs-nav__foot-btn.is-active {
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  font-weight: 600;
}

.fs-nav__foot-btn--icon {
  margin-left: auto;
  width: 36px;
  padding: 0;
  justify-content: center;
}

.fs-nav__badge {
  min-width: 18px;
  height: 18px;
  padding: 0 6px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--el-radius-full, 9999px);
  background: var(--el-color-warning);
  color: var(--el-color-white);
  font-size: 11px;
  font-weight: 700;
}

/* ===== 变体 B：侧栏胶囊过滤（搜索 / 类型 / 大小 / 日期 / 排序） ===== */
/* 钉在侧栏顶部，不跟「快捷访问」一起滚；自身限量滚动，避免小窗口把快捷访问挤没 */
.fs-nav__filter {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 62%;
  padding: 4px 2px 10px;
  overflow-y: auto;
  border-bottom: 1px solid var(--el-border-color-extra-light, var(--el-border-color-lighter));
}

.fs-nav__filter-hd {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  min-height: 18px;
  padding: 0 6px;
}

.fs-nav__title--inline {
  padding: 0;
}

/* 「清除」只在过滤开启时出现，故用主色浅底，和底部常驻按钮区分开 */
.fs-filter-clear {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  height: 20px;
  padding: 0 7px;
  border: none;
  border-radius: var(--el-radius-full, 9999px);
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  font-size: 11px;
  font-family: inherit;
  cursor: pointer;
  transition: background var(--el-transition-duration, 0.2s);
}

.fs-filter-clear:hover {
  background: var(--el-color-primary-light-8);
}

/* 搜索胶囊 */
.fs-pill-search {
  display: flex;
  align-items: center;
  gap: 6px;
  height: 30px;
  margin: 0 2px;
  padding: 0 10px;
  border: 1px solid var(--el-border-color);
  border-radius: var(--el-radius-full, 9999px);
  background: var(--el-fill-color-blank, #fff);
  transition: border-color var(--el-transition-duration, 0.2s);
}

.fs-pill-search:focus-within {
  border-color: var(--el-color-primary);
}

.fs-pill-search__icon {
  flex-shrink: 0;
  color: var(--el-text-color-placeholder);
}

.fs-pill-search__input {
  flex: 1;
  min-width: 0;
  border: none;
  outline: none;
  background: transparent;
  color: var(--el-text-color-primary);
  font-size: 12px;
  font-family: inherit;
}

.fs-pill-search__input::placeholder {
  color: var(--el-text-color-placeholder);
}

.fs-pill-search__clear {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border: none;
  border-radius: 50%;
  background: var(--el-fill-color);
  color: var(--el-text-color-secondary);
  cursor: pointer;
}

/* 胶囊分组 */
.fs-pill-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.fs-pill-group__cap {
  padding-left: 8px;
  font-size: 11px;
  font-weight: 600;
  color: var(--el-text-color-placeholder);
}

.fs-pill-row {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  padding: 0 2px;
}

.fs-pill {
  display: inline-flex;
  align-items: center;
  height: 22px;
  padding: 0 9px;
  border: 1px solid transparent;
  border-radius: var(--el-radius-full, 9999px);
  background: var(--el-fill-color-light);
  color: var(--el-text-color-regular);
  font-size: 11px;
  font-family: inherit;
  white-space: nowrap;
  cursor: pointer;
  transition: background var(--el-transition-duration, 0.2s), color var(--el-transition-duration, 0.2s);
}

.fs-pill:hover {
  background: var(--el-fill-color);
  color: var(--el-text-color-primary);
}

.fs-pill.is-active {
  background: var(--el-color-primary);
  border-color: var(--el-color-primary);
  color: var(--el-color-white);
  font-weight: 600;
}

.fs-pill__dir {
  margin-left: 2px;
  font-size: 10px;
}

/* 目录树（复用 FsTreeNode 渲染组件，样式走 :deep 穿透） */
.fs-tree {
  display: flex;
  flex-direction: column;
  gap: 1px;
  overflow-y: auto;
  max-height: 40%;
}

.fs-tree :deep(.fs-tree-node__row) {
  display: flex;
  align-items: center;
  gap: 6px;
  height: 32px;
  padding-right: 8px;
  border-radius: var(--el-radius-md, 8px);
  cursor: pointer;
  font-size: 13px;
  color: var(--el-text-color-regular);
  white-space: nowrap;
  overflow: hidden;
  transition: background var(--el-transition-duration, 0.2s);
}

.fs-tree :deep(.fs-tree-node__row:hover) {
  background: var(--el-fill-color-light);
}

.fs-tree :deep(.fs-tree-node__row--active) {
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  font-weight: 600;
}

.fs-tree :deep(.fs-tree-node__row--drop) {
  outline: 1px dashed var(--el-color-primary);
  outline-offset: -1px;
}

.fs-tree :deep(.fs-tree-node__arrow) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: var(--el-text-color-placeholder);
  transition: transform var(--el-transition-duration, 0.2s);
}

.fs-tree :deep(.fs-tree-node__arrow--open) {
  transform: rotate(90deg);
}

.fs-tree :deep(.fs-tree-node__label) {
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 路径栏 */
.fs-pathbar {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 6px;
  height: 40px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--el-border-color-extra-light, var(--el-border-color-lighter));
}

.fs-icon-btn {
  flex-shrink: 0;
  width: 30px;
  height: 30px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: var(--el-radius-md, 8px);
  background: transparent;
  color: var(--el-text-color-secondary);
  cursor: pointer;
  transition: background var(--el-transition-duration, 0.2s), color var(--el-transition-duration, 0.2s);
}

.fs-icon-btn:hover:not(:disabled) {
  background: var(--el-fill-color-light);
  color: var(--el-color-primary);
}

.fs-icon-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.fs-icon-btn .is-spin {
  animation: fs-spin 1s linear infinite;
}

@keyframes fs-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.fs-crumbs {
  font-size: 14px;
  font-weight: 500;
}

.fs-crumbs__sep {
  margin: 0 2px;
}

.fs-crumbs__item {
  font-weight: 500;
}

.fs-crumbs__item.is-current {
  font-weight: 700;
}

.fs-main__sel {
  margin-left: auto;
  padding: 2px 10px;
  border-radius: var(--el-radius-full, 9999px);
  background: var(--el-color-primary-light-9);
}

.fs-main__lock {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-left: auto;
  padding: 2px 10px;
  border-radius: var(--el-radius-full, 9999px);
  background: var(--el-color-warning-light-9);
  color: var(--el-color-warning);
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
}

.fs-main__lock + .fs-main__sel {
  margin-left: 0;
}

/* 上传/下载按钮：原先挂在搜索工具栏上，该行删除后并入路径栏尾部，样式沿用 */
.fs-tb-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 32px;
  padding: 0 10px;
  border: none;
  border-radius: var(--el-radius-md, 8px);
  background: transparent;
  color: var(--el-text-color-regular);
  font-size: 13px;
  font-family: inherit;
  white-space: nowrap;
  cursor: pointer;
  transition: background var(--el-transition-duration, 0.2s), color var(--el-transition-duration, 0.2s);
}

.fs-tb-btn:hover:not(:disabled) {
  background: var(--el-fill-color-light);
  color: var(--el-color-primary);
}

.fs-tb-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.fs-tb-btn--danger {
  color: var(--el-color-danger);
}

.fs-tb-btn--danger:hover:not(:disabled) {
  background: var(--el-color-danger-light-9);
  color: var(--el-color-danger);
}

/* ===== 分栏视图（macOS Finder 风格） ===== */
.fs-files--columns {
  display: flex;
  align-items: stretch;
  gap: 0;
  padding: 10px 0 0;
  overflow-x: auto;
  overflow-y: hidden;
}

.fs-col {
  flex: 0 0 252px;
  min-width: 252px;
  max-width: 252px;
  border-right: 1px solid var(--el-border-color-extra-light, var(--el-border-color-lighter));
  overflow: hidden;
}

/* 最后一列撑满剩余宽度：让后续列的展开空间始终可见 */
.fs-col:last-child {
  flex: 1 1 auto;
  max-width: none;
  border-right: none;
}

.fs-col__body {
  height: 100%;
  overflow-y: auto;
  padding: 8px;
  display: flex;
  flex-direction: column;
  flex-wrap: nowrap;
  align-content: stretch;
  gap: 2px;
}

.fs-col__hint {
  width: 100%;
  padding: 12px 10px;
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}

/* 目录加载失败（如路径不存在被服务端 404）：必须与「空目录」视觉可区分 */
.fs-col__hint--error {
  color: var(--el-color-danger);
  word-break: break-all;
}

/* 分栏列截断提示（“仅显示前 500 项”）：与错误、空态区分开 */
.fs-col__hint--more {
  color: var(--el-color-warning);
}

/* 列内条目统一为 Finder 行：图标在左、名称在后，目录展开用右侧箭头提示 */
.fs-col__row {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
  width: 100%;
  min-width: 0;
  min-height: 34px;
  padding: 4px 8px;
  border-radius: var(--el-radius-md, 6px);
  cursor: pointer;
  font-size: 13px;
  color: var(--el-text-color-regular);
  text-align: left;
  white-space: nowrap;
  overflow: hidden;
  outline: none;
  box-sizing: border-box;
  transition: background var(--el-transition-duration, 0.2s), color var(--el-transition-duration, 0.2s);
}

/* 面包屑/文件行是可点的非按钮元素：全局 reset 掉默认焦点环后必须自己补，
   否则键盘用户 Tab 过来完全看不到焦点落在哪个文件上 */
.fs-col__row:focus-visible {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}

.fs-col__row:hover {
  background: var(--el-fill-color-lighter);
}

/* Finder 选中态：当前展开的目录链与当前选中的文件都使用同一强调色整行高亮 */
.fs-col__row.is-trail,
.fs-col__row.is-selected {
  background: var(--el-color-primary);
  color: var(--el-color-white);
}

.fs-col__row.is-trail .fs-col__name,
.fs-col__row.is-selected .fs-col__name {
  color: var(--el-color-white);
}

/* 已向右展开的目录在行尾显示 Finder 风格箭头 */
.fs-col__row.is-trail::after {
  content: "›";
  flex: 0 0 auto;
  margin-left: auto;
  font-size: 18px;
  font-weight: 600;
  line-height: 1;
  color: color-mix(in srgb, var(--el-color-white) 72%, transparent);
}

.fs-col__row.is-dragover {
  outline: 1px dashed var(--el-color-primary);
  outline-offset: -1px;
}

.fs-col__icon {
  width: 20px;
  height: 20px;
  font-size: 20px;
  flex-shrink: 0;
}

.fs-col__name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.3;
  color: inherit;
}

/* 状态栏 */
.fs-statusbar {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 12px;
  padding-top: 8px;
  border-top: 1px solid var(--el-border-color-extra-light, var(--el-border-color-lighter));
}

.fs-statusbar__info {
  flex: 1;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

/* 整目录扫描上限提示（过滤态 + 目录条数超过 FILTER_SCAN_LIMIT 时出现） */
.fs-statusbar__scan {
  flex-shrink: 0;
  padding: 1px 8px;
  border-radius: var(--el-radius-full, 9999px);
  background: var(--el-color-warning-light-9);
  color: var(--el-color-warning);
  font-size: 11px;
  white-space: nowrap;
}

/* 分页器：非分栏视图多页时显示（分栏视图自行截断，不重复分页） */
.fs-statusbar__pages {
  flex-shrink: 0;
}

.fs-statusbar__pages :deep(.el-pagination) {
  --el-pagination-button-width: 24px;
  --el-pagination-button-height: 24px;
  --el-pagination-font-size: 12px;
}

.fs-statusbar__views {
  display: inline-flex;
  align-items: center;
  gap: 2px;
}

.fs-view-btn {
  width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: var(--el-radius-sm, 6px);
  background: transparent;
  color: var(--el-text-color-secondary);
  cursor: pointer;
  transition: background var(--el-transition-duration, 0.2s), color var(--el-transition-duration, 0.2s);
}

.fs-view-btn:hover {
  background: var(--el-fill-color-light);
  color: var(--el-color-primary);
}

.fs-view-btn.is-active {
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
}

/* 空状态：在内容区居中 */
.fs-files {
  position: relative;
}

.fs-files__empty {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 0;
  pointer-events: none;
}

.fs-files__empty > * {
  pointer-events: auto;
}

/* 卡片：更紧凑的网格（对齐设计稿） */
.fs-files--large {
  grid-template-columns: repeat(auto-fill, minmax(112px, 1fr));
  gap: 8px;
  padding-top: 12px;
}

.fs-lg-card {
  gap: 0;
  padding: 14px 8px 10px;
  border-color: transparent;
  border-radius: var(--el-radius-md, 8px);
  box-shadow: none;
}

.fs-lg-card:hover {
  border-color: transparent;
  background: var(--el-fill-color-light);
  box-shadow: none;
  transform: none;
}

.fs-lg-card--selected {
  border-color: var(--el-color-primary-light-7);
  background: var(--el-color-primary-light-9);
  box-shadow: none;
}

/* 缩略图：搜索工具栏整行删除后腾出垂直空间，这里把大图标整体放大一档 */
.fs-lg-card__thumb {
  width: 74px;
  height: 74px;
}

.fs-lg-card__thumb svg {
  width: 68px;
  height: 68px;
}

.fs-lg-card__thumb .fs-card-icon {
  font-size: 68px;
}

.fs-lg-card__label {
  margin-top: 8px;
  font-size: 12px;
  font-weight: 400;
  text-align: center;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.fs-lg-card__frame {
  border-radius: var(--el-radius-sm, 6px);
}
</style>

<style>
/* ── 全局：统一圆角令牌（对齐 vue 体系 koi 主题 radius.scss；standalone 未加载主题包） ── */
:root {
  --el-radius-xs: 4px;
  --el-radius-sm: 6px;
  --el-radius-md: 8px;
  --el-radius-lg: 12px;
  --el-radius-xl: 16px;
  --el-radius-full: 9999px;
  --el-border-radius-small: var(--el-radius-xs);
  --el-border-radius-base: var(--el-radius-sm);
  --el-border-radius-round: var(--el-radius-full);
  --el-border-radius-circle: 50%;
}

/* Element 在 .el-dialog 元素上本地定义 --el-dialog-border-radius（屏蔽 :root 令牌），
 * 与框架一致用双类加权写组件类上；message-box 单独给 lg 圆角（KodExplorer 弹窗观感） */
.el-dialog.el-dialog {
  --el-dialog-border-radius: var(--el-radius-xl, 16px);
}
.el-message-box {
  border-radius: var(--el-radius-lg, 12px);
}

/* ── 预览弹层（append-to-body 需非 scoped）──
 * header 保留并作为唯一的拖拽手柄：el-dialog 的 draggable 在 hooks/use-draggable 里
 * 把 mousedown 绑在 header 上，内容区不参与。此前为「无头」把 header display:none
 * 并把拖拽接管到内容外壳，导致在 Excel 预览里点选单元格被误判为拖拽、单元格抖动。
 * 关闭按钮交回 el-dialog 自带（show-close），不再自绘浮层按钮。 */
.fs-preview-dlg.el-dialog {
  border-radius: 14px;
  overflow: visible; /* 让 ::before 辉光边框不被裁掉 */
  padding: 0;
  /*
    高度钉成「视口 - 上下各 10px」，让内容真正吃满屏幕：
    此前弹框高度由内容决定，而 iframe 面板固定 65vh、PDF 面板更是能撑到
    20 万像素（旧 VueOfficePdf 按原始尺寸堆叠全部页面），表现为
    「弹框只占屏幕一部分、滚动条出现在半空」。
    改成确定高度后，滚动交给各面板内部（flex:1 + min-height:0）。
  */
  height: calc(100vh - 20px);
  display: flex;
  flex-direction: column;
  position: relative;
}

/* 科技感外框：用 ::before 做渐变描边，::after 做外发光 */
.fs-preview-dlg.el-dialog::before {
  content: "";
  position: absolute;
  inset: -1px;
  border-radius: 15px;
  padding: 1px;
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--el-color-primary, #409eff) 70%, var(--el-color-success, #67c23a)) 0%,
    var(--el-color-primary, #409eff) 35%,
    var(--el-color-info, #909399) 65%,
    color-mix(in srgb, var(--el-color-primary, #409eff) 70%, var(--el-color-success, #67c23a)) 100%
  );
  -webkit-mask:
    linear-gradient(#fff 0 0) content-box,
    linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
}

.fs-preview-dlg.el-dialog::after {
  content: "";
  position: absolute;
  inset: -8px;
  border-radius: 20px;
  background: transparent;
  box-shadow:
    0 0 30px color-mix(in srgb, var(--el-color-primary, #409eff) 18%, transparent),
    0 8px 40px color-mix(in srgb, var(--el-color-primary, #409eff) 10%, transparent);
  pointer-events: none;
  z-index: -1;
  transition: box-shadow 0.3s ease;
}

.fs-preview-dlg.el-dialog:hover::after {
  box-shadow:
    0 0 40px color-mix(in srgb, var(--el-color-primary, #409eff) 28%, transparent),
    0 12px 50px color-mix(in srgb, var(--el-color-primary, #409eff) 16%, transparent);
}

/* body 必须能伸缩，否则子面板的 flex:1 拿不到有界高度 */
.fs-preview-dlg .el-dialog__body {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  padding: 0;
  background:
    linear-gradient(
      160deg,
      color-mix(in srgb, var(--el-color-primary, #409eff) 3%, var(--el-bg-color, #fff)) 0%,
      var(--el-bg-color, #fff) 100%
    );
}

/* 拖拽手柄：科技感渐变标题栏 */
.fs-preview-dlg .el-dialog__header {
  cursor: move;
  user-select: none;
  margin-right: 0;
  padding: 12px 16px 11px;
  background:
    linear-gradient(
      90deg,
      color-mix(in srgb, var(--el-color-primary, #409eff) 10%, var(--el-bg-color, #fff)) 0%,
      color-mix(in srgb, var(--el-color-success, #67c23a) 6%, var(--el-bg-color, #fff)) 100%
    );

}

.fs-preview-dlg .el-dialog__title {
  font-size: 13px;
  font-weight: 700;
  color: var(--el-text-color-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  letter-spacing: 0.3px;
}

/* 关闭按钮：悬停主色圆晕 */
.fs-preview-dlg .el-dialog__headerbtn {
  top: 8px;
  right: 10px;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  transition: background 0.18s ease, color 0.18s ease, box-shadow 0.18s ease;
}
.fs-preview-dlg .el-dialog__headerbtn:hover {
  background: color-mix(in srgb, var(--el-color-danger, #f56c6c) 10%, transparent);
  color: var(--el-color-danger, #f56c6c);
  box-shadow: 0 0 10px color-mix(in srgb, var(--el-color-danger, #f56c6c) 30%, transparent);
}
.fs-preview-dlg .el-dialog__headerbtn .el-dialog__close {
  font-size: 14px;
  font-weight: 700;
}

.fs-preview-dlg .el-dialog__body {
  /* 见上方同名规则：这里只保留 padding，伸缩相关已在上方声明 */
  padding: 12px 14px 14px;
}

/* ── 全局：Windows 风格类型图标 ──
 * v-html 注入的 svg 不携带 scoped 属性 id，尺寸规则必须放在非 scoped 块；
 * 外层 font-size 控制图标大小（svg 按 1em 缩放），由视图自身的 __icon 类决定 */
.fs-typeicon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 0;
  flex-shrink: 0;
}
.fs-typeicon svg {
  width: 1em;
  height: 1em;
  display: block;
}

/* ── 系统配置弹窗外壳（append-to-body 需非 scoped）：标题/分栏单选/按钮对齐 koi ── */
.fs-admin-dialog.el-dialog {
  border-radius: var(--el-radius-xl, 16px);
  max-width: 94vw;
  overflow: hidden;
}

.fs-admin-dialog .el-dialog__header {
  padding: 20px 26px 16px;
  margin-right: 0;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.fs-admin-dialog .el-dialog__headerbtn {
  top: 20px;
  right: 20px;
  width: 34px;
  height: 34px;
}

.fs-admin-dialog .el-dialog__headerbtn .el-dialog__close {
  font-size: 20px;
  color: var(--el-text-color-secondary);
}

.fs-admin-dialog .el-dialog__body {
  padding: 18px 26px 4px;
}

.fs-admin-dialog .el-dialog__footer {
  padding: 14px 26px 20px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.fs-admin-dialog .el-dialog__footer .el-button {
  height: 40px;
  padding: 0 24px;
  border-radius: var(--el-radius-full, 9999px);
}

.fs-admin-dialog .el-dialog__footer .el-button--primary {
  border: none;
  background: linear-gradient(135deg,
    var(--el-color-primary),
    color-mix(in srgb, var(--el-color-primary) 55%, var(--el-color-info)));
  box-shadow: 0 6px 16px color-mix(in srgb, var(--el-color-primary) 30%, transparent);
}

.fs-admin-dialog .el-dialog__footer .el-button--primary:hover {
  background: linear-gradient(135deg, var(--el-color-primary-light-3), var(--el-color-primary));
}

/* 访问权限分段控件：两段等宽，选中段用主色描边 */
.fs-admin-dialog .fs-admin__seg {
  display: flex;
  width: 100%;
}

.fs-admin-dialog .fs-admin__seg .el-radio-button {
  flex: 1;
}

.fs-admin-dialog .el-radio-button__inner {
  width: 100%;
  text-align: center;
  border: 1px solid var(--el-border-color);
  border-radius: var(--el-radius-md, 8px) !important;
  box-shadow: none !important;
  padding: 8px 12px;
  background: var(--el-bg-color, #fff);
  color: var(--el-text-color-regular);
  font-size: 13px;
}

.fs-admin-dialog .fs-admin__seg .el-radio-button:first-child .el-radio-button__inner {
  margin-right: 8px;
}

.fs-admin-dialog .el-radio-button.is-active .el-radio-button__inner,
.fs-admin-dialog .el-radio-button__original-radio:checked + .el-radio-button__inner {
  background: var(--el-color-primary-light-9);
  border-color: var(--el-color-primary);
  color: var(--el-color-primary);
  font-weight: 600;
}

.fs-admin-dialog .el-input__wrapper,
.fs-admin-dialog .el-select__wrapper {
  border-radius: var(--el-radius-md, 8px);
}

/* 系统配置弹窗内自定义描述型下拉：选项改为可变高度，避免标题与描述叠压 */
.fs-admin-select-popper .el-select-dropdown__item {
  height: auto;
  min-height: 42px;
  line-height: 1.4;
  white-space: normal;
  padding: 6px 12px;
  display: flex;
  align-items: center;
}

.fs-admin-select-popper .fs-admin__optiontext {
  display: flex;
  flex-direction: column;
  gap: 2px;
  width: 100%;
  line-height: 1.4;
}

.fs-admin-select-popper .fs-admin__optdesc {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  white-space: normal;
}

/* 下载时效单位（原来是写死的内联色，暗色模式下不跟随主题） */
.fs-expiry-unit {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

/* 面包屑旁轻量加载指示：目录切换超过 300ms 才出现，不再罩住文件列表 */
.fs-nav-loading {
  display: inline-flex;
  align-items: center;
  margin-left: 8px;
  color: var(--el-text-color-secondary);
  line-height: 1;
}

/* 右键菜单快捷键标注 */
.fs-ctx__label {
  flex: 1;
  min-width: 0;
  white-space: nowrap;
}

.fs-ctx__kbd {
  margin-left: auto;
  padding: 2px 5px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-sm, 6px);
  background: var(--el-fill-color-lighter);
  color: var(--el-text-color-secondary);
  font-size: 11px;
  font-weight: 500;
  line-height: 1;
  white-space: nowrap;
}

/* 行内重命名：把名称 span 切成编辑框，各视图用原有 className 保持布局 */
.fs-inline-rename {
  display: inline-flex;
  align-items: center;
  min-width: 0;
  max-width: 100%;
}

.fs-inline-rename.fs-sm-row__name {
  flex: 1;
}

/* 列内图标卡里重命名时自适应卡片宽：纵向布局下不复用横向 flex 拉伸 */
.fs-inline-rename.fs-col__name {
  width: calc(100% - 4px);
  max-width: 100%;
}

.fs-inline-rename__input {
  flex: 1;
  min-width: 80px;
  max-width: 320px;
  box-sizing: border-box;
  height: 26px;
  padding: 2px 8px;
  border: 1px solid var(--el-color-primary);
  border-radius: var(--el-radius-sm, 6px);
  background: var(--el-bg-color, #fff);
  color: var(--el-text-color-primary);
  font: inherit;
  outline: none;
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 18%, transparent);
}

/* 属性弹窗 */
.fs-props-dialog .el-dialog__body {
  padding: 18px 22px;
}

.fs-props {
  display: grid;
  gap: 0;
  margin: 0;
}

.fs-props__row {
  display: flex;
  gap: 12px;
  padding: 8px 2px;
  border-bottom: 1px solid var(--el-border-color-extra-light, var(--el-border-color-lighter));
}

.fs-props__row dt {
  width: 92px;
  flex-shrink: 0;
  color: var(--el-text-color-secondary);
  font-weight: 500;
}

.fs-props__row dd {
  flex: 1;
  min-width: 0;
  margin: 0;
  color: var(--el-text-color-primary);
  overflow-wrap: anywhere;
}

.fs-props__loading {
  margin-left: 6px;
  vertical-align: -2px;
}

.fs-props__sep {
  height: 1px;
  margin: 10px 0;
  background: var(--el-border-color-extra-light, var(--el-border-color-lighter));
}

/* 尊重系统「减少动态效果」偏好 */
@media (prefers-reduced-motion: reduce) {
  .fs-upload-btn,
  .fs-col__row,
  .fs-col__row.is-selected {
    transition: none;
    animation: none;
  }
}</style>
