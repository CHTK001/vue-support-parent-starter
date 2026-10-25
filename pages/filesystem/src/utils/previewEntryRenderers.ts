/**
 * 统一预览入口的渲染器注册表（扩展名驱动，file-viewer 承接）。
 *
 * <p><b>设计口径</b>：这里没有「按格式写组件」的概念——274 个受支持的后缀
 * 对应的渲染全部交给 file-viewer（{@code @file-viewer/vue3}）按**文件名扩展名**
 * 自动选择渲染器。注册表只维护两件事：</p>
 * <ol>
 *   <li>后缀 → 渲染器插件包的分组映射（每组对应一个 {@code @file-viewer/renderer-*}
 *       包，加载后以 {@code rendererMode:'replace'} 提供给 file-viewer）；</li>
 *   <li>各组渲染器插件的懒加载函数（不预览的人不为渲染器包付出首屏成本）。</li>
 * </ol>
 *
 * <p><b>后续新增后缀</b>：file-viewer 新渲染器包（或既有包新支持的后缀）
 * 只需在本表把后缀加进对应组（或新增一组 spec），入口组件无需改动——
 * 渲染器的选择、加载、渲染全部由 file-viewer 完成。</p>
 *
 * <p>Office 家族（docx/xls/ppt/pdf/odt/iWork/hwp…）不走本表：由
 * {@link PreviewOfficePanel}（preset-office）接管，含内容魔数校正、密文检测、
 * Excel 选区统计等增强能力，见入口组件的分流逻辑。</p>
 */

/**
 * 一组渲染器插件的定义。
 */
export interface RendererSpec {
  /** preset 标识（传入 FvPanelBase 的 presetId，供 file-viewer 与调试展示） */
  presetId: string;
  /**
   * 懒加载该组的渲染器插件数组。
   *
   * <p>返回值直接作为 {@code options.preset.renderers}（rendererMode:'replace'）。
   * 一组可含多个包的插件（如 doc 组同时携带 mindmap/epub/email 渲染器），
   * file-viewer 按文件扩展名在组内自动挑选。</p>
   */
  load: () => Promise<unknown[]>;
}

/* ------------------------------------------------------------------ *
 *  渲染器组（一个 renderer 包一组；doc 组合并三个包由 file-viewer 自选）
 * ------------------------------------------------------------------ */

/**
 * renderer-text 原生识别的扩展名（file-viewer.capability.json formats）。
 *
 * <p>文本面板与预览入口用它判断「未知扩展名但要按纯文本渲染」——renderer-text
 * 只认白名单内的扩展名，白名单外的（如 {@code MANIFEST.MF}）必须改名为
 * {@code .txt} 再喂给 file-viewer，否则找不到渲染器而落空。</p>
 */
export const TEXT_EXTENSIONS: ReadonlySet<string> = new Set([
  "md", "markdown", "txt", "json", "js", "mjs", "cjs", "css", "java", "py",
  "html", "htm", "jsx", "ts", "tsx", "xml", "log", "vue", "yaml", "yml",
  "ini", "sh", "bash", "sql", "go", "rs", "php", "c", "cpp", "cc", "h",
  "hpp", "cs", "jsonc", "json5", "ipynb", "toml", "proto", "hcl", "tex",
  "gv", "http", "react", "rb", "swift", "kt",
]);

const TEXT_SPEC: RendererSpec = {
  presetId: "text",
  load: async () => [(await import("@file-viewer/renderer-text")).textRenderer as unknown],
};

const DOC_SPEC: RendererSpec = {
  presetId: "doc",
  load: async () => {
    const [mindmap, ebook, email] = await Promise.all([
      import("@file-viewer/renderer-mindmap"),
      import("@file-viewer/renderer-epub"),
      import("@file-viewer/renderer-email"),
    ]);
    return [
      (mindmap as { mindmapRenderer?: unknown }).mindmapRenderer,
      (ebook as { ebookRenderer?: unknown }).ebookRenderer,
      (email as { emailRenderer?: unknown }).emailRenderer,
    ].filter(Boolean);
  },
};

const DESIGN_SPEC: RendererSpec = {
  presetId: "design",
  load: async () => [(await import("@file-viewer/renderer-design")).designRenderer as unknown],
};

const DATA_SPEC: RendererSpec = {
  presetId: "data",
  load: async () => [(await import("@file-viewer/renderer-data")).dataRenderer as unknown],
};

const SIGNATURE_SPEC: RendererSpec = {
  presetId: "signature",
  load: async () => [(await import("@file-viewer/renderer-signature")).signatureRenderer as unknown],
};

const BINARY_SPEC: RendererSpec = {
  presetId: "binary",
  load: async () => [(await import("@file-viewer/renderer-binary")).binaryRenderer as unknown],
};

const EDA_SPEC: RendererSpec = {
  presetId: "eda",
  load: async () => [(await import("@file-viewer/renderer-eda")).edaRenderer as unknown],
};

const CHM_SPEC: RendererSpec = {
  presetId: "chm",
  load: async () => [(await import("@file-viewer/renderer-chm")).chmRenderer as unknown],
};

const TYPST_SPEC: RendererSpec = {
  presetId: "typst",
  load: async () => [(await import("@file-viewer/renderer-typst")).typstRenderer as unknown],
};

const DRAWING_SPEC: RendererSpec = {
  presetId: "drawing",
  load: async () => [(await import("@file-viewer/renderer-drawing")).drawingRenderer as unknown],
};

const GEO_SPEC: RendererSpec = {
  presetId: "geo",
  load: async () => [(await import("@file-viewer/renderer-geo")).geoRenderer as unknown],
};

const IMAGE_SPEC: RendererSpec = {
  presetId: "image",
  load: async () => [(await import("@file-viewer/renderer-image")).imageRenderer as unknown],
};

const DICOM_SPEC: RendererSpec = {
  presetId: "dicom",
  load: async () => [(await import("@file-viewer/renderer-dicom")).dicomRenderer as unknown],
};

const MEDIA_SPEC: RendererSpec = {
  presetId: "media",
  load: async () => [(await import("@file-viewer/renderer-media")).mediaRenderer as unknown],
};

const MODEL_SPEC: RendererSpec = {
  presetId: "model",
  load: async () => [(await import("@file-viewer/renderer-3d")).modelRenderer as unknown],
};

const CAD_SPEC: RendererSpec = {
  presetId: "cad",
  load: async () => [(await import("@file-viewer/renderer-cad")).cadRenderer as unknown],
};

const ARCHIVE_SPEC: RendererSpec = {
  presetId: "archive",
  load: async () => {
    // 压缩包的**包内条目预览**走 file-viewer 内存嵌套渲染（不回源请求）：
    // 嵌套渲染复用本实例的 renderer registry——只装 archiveRenderer 时，
    // 点开包内 md/txt/图片条目会报「尚未装配 renderer」。因此这里同时
    // 装载 text（md/代码/文本条目）与 image（截图/图片条目）渲染器。
    const [archive, text, image] = await Promise.all([
      import("@file-viewer/renderer-archive"),
      import("@file-viewer/renderer-text"),
      import("@file-viewer/renderer-image"),
    ]);
    return [
      (archive as { archiveRenderer?: unknown }).archiveRenderer,
      (text as { textRenderer?: unknown }).textRenderer,
      (image as { imageRenderer?: unknown }).imageRenderer,
    ].filter(Boolean);
  },
};

/**
 * 后缀 → 渲染器组注册表。
 *
 * <p>清单与各 renderer 包的 {@code file-viewer.capability.json} formats 对齐
 * （与 FileStorageManage.vue 的 FV_PANEL_BY_EXT 同源整理）。同一渲染器组的
 * 后缀在表中相邻，便于对照 capability 清单增删。</p>
 */
const SPEC_BY_EXT: Record<string, RendererSpec> = {
  // ---- renderer-text：Markdown / 代码 / 纯文本 / 结构化文本 ----
  md: TEXT_SPEC,
  markdown: TEXT_SPEC,
  // .markmap 是 Markdown 语法，按 markdown 渲染
  markmap: TEXT_SPEC,
  txt: TEXT_SPEC,
  json: TEXT_SPEC,
  js: TEXT_SPEC,
  mjs: TEXT_SPEC,
  cjs: TEXT_SPEC,
  css: TEXT_SPEC,
  java: TEXT_SPEC,
  py: TEXT_SPEC,
  html: TEXT_SPEC,
  htm: TEXT_SPEC,
  jsx: TEXT_SPEC,
  ts: TEXT_SPEC,
  tsx: TEXT_SPEC,
  xml: TEXT_SPEC,
  // .log：hs_err_pid*.log（JVM 崩溃日志）在 FilePreviewEntry 走 FvLogAnalyzePanel
  // （分析结论 / 原始日志双模式），普通日志由该面板内部退化为文本渲染
  vue: TEXT_SPEC,
  yaml: TEXT_SPEC,
  yml: TEXT_SPEC,
  ini: TEXT_SPEC,
  sh: TEXT_SPEC,
  bash: TEXT_SPEC,
  sql: TEXT_SPEC,
  go: TEXT_SPEC,
  rs: TEXT_SPEC,
  php: TEXT_SPEC,
  c: TEXT_SPEC,
  cpp: TEXT_SPEC,
  cc: TEXT_SPEC,
  h: TEXT_SPEC,
  hpp: TEXT_SPEC,
  cs: TEXT_SPEC,
  diff: TEXT_SPEC,
  patch: TEXT_SPEC,
  bundle: TEXT_SPEC,
  bdl: TEXT_SPEC,
  jsonc: TEXT_SPEC,
  json5: TEXT_SPEC,
  ipynb: TEXT_SPEC,
  toml: TEXT_SPEC,
  proto: TEXT_SPEC,
  hcl: TEXT_SPEC,
  tex: TEXT_SPEC,
  gv: TEXT_SPEC,
  http: TEXT_SPEC,
  react: TEXT_SPEC,
  rb: TEXT_SPEC,
  swift: TEXT_SPEC,
  kt: TEXT_SPEC,
  // .mf：Java MANIFEST.MF / METAFONT 源文件，均为纯文本，按文本渲染
  mf: TEXT_SPEC,
  // ---- renderer-mindmap / epub / email（doc 组，file-viewer 按扩展名自选）----
  xmind: DOC_SPEC,
  epub: DOC_SPEC,
  fb2: DOC_SPEC,
  umd: DOC_SPEC,
  eml: DOC_SPEC,
  msg: DOC_SPEC,
  mbox: DOC_SPEC,
  // ---- renderer-design ----
  psb: DESIGN_SPEC,
  pdd: DESIGN_SPEC,
  psdt: DESIGN_SPEC,
  ait: DESIGN_SPEC,
  idml: DESIGN_SPEC,
  icml: DESIGN_SPEC,
  idms: DESIGN_SPEC,
  inx: DESIGN_SPEC,
  fla: DESIGN_SPEC,
  xfl: DESIGN_SPEC,
  xd: DESIGN_SPEC,
  indd: DESIGN_SPEC,
  indt: DESIGN_SPEC,
  ps: DESIGN_SPEC,
  ase: DESIGN_SPEC,
  aco: DESIGN_SPEC,
  abr: DESIGN_SPEC,
  csh: DESIGN_SPEC,
  pat: DESIGN_SPEC,
  grd: DESIGN_SPEC,
  asl: DESIGN_SPEC,
  // ---- renderer-data：字体 / PSD / 数据库 / 列式存储 ----
  ttf: DATA_SPEC,
  otf: DATA_SPEC,
  woff: DATA_SPEC,
  woff2: DATA_SPEC,
  psd: DATA_SPEC,
  ai: DATA_SPEC,
  eps: DATA_SPEC,
  sqlite: DATA_SPEC,
  wasm: DATA_SPEC,
  parquet: DATA_SPEC,
  avro: DATA_SPEC,
  webarchive: DATA_SPEC,
  // ---- renderer-signature：PKCS / PGP 签名容器 ----
  p7m: SIGNATURE_SPEC,
  p7s: SIGNATURE_SPEC,
  p7c: SIGNATURE_SPEC,
  p7b: SIGNATURE_SPEC,
  pkcs7: SIGNATURE_SPEC,
  cms: SIGNATURE_SPEC,
  cmsc: SIGNATURE_SPEC,
  tsd: SIGNATURE_SPEC,
  tst: SIGNATURE_SPEC,
  tsq: SIGNATURE_SPEC,
  tsr: SIGNATURE_SPEC,
  asics: SIGNATURE_SPEC,
  scs: SIGNATURE_SPEC,
  asice: SIGNATURE_SPEC,
  sce: SIGNATURE_SPEC,
  ers: SIGNATURE_SPEC,
  asc: SIGNATURE_SPEC,
  sig: SIGNATURE_SPEC,
  pgp: SIGNATURE_SPEC,
  gpg: SIGNATURE_SPEC,
  jws: SIGNATURE_SPEC,
  // ---- renderer-binary：二进制结构 + 十六进制 ----
  bin: BINARY_SPEC,
  hex: BINARY_SPEC,
  elf: BINARY_SPEC,
  exe: BINARY_SPEC,
  dll: BINARY_SPEC,
  class: BINARY_SPEC,
  macho: BINARY_SPEC,
  // ---- renderer-eda：EDA 版图 ----
  olb: EDA_SPEC,
  dra: EDA_SPEC,
  gds: EDA_SPEC,
  oas: EDA_SPEC,
  oasis: EDA_SPEC,
  // ---- renderer-chm / renderer-typst ----
  chm: CHM_SPEC,
  typ: TYPST_SPEC,
  typst: TYPST_SPEC,
  // ---- renderer-drawing：图表 / 流程图 ----
  excalidraw: DRAWING_SPEC,
  drawio: DRAWING_SPEC,
  dio: DRAWING_SPEC,
  mermaid: DRAWING_SPEC,
  mmd: DRAWING_SPEC,
  plantuml: DRAWING_SPEC,
  puml: DRAWING_SPEC,
  bpmn: DRAWING_SPEC,
  // ---- renderer-geo：地理数据 ----
  geojson: GEO_SPEC,
  kml: GEO_SPEC,
  gpx: GEO_SPEC,
  shp: GEO_SPEC,
  // ---- renderer-image ----
  gif: IMAGE_SPEC,
  jpg: IMAGE_SPEC,
  jpeg: IMAGE_SPEC,
  bmp: IMAGE_SPEC,
  tiff: IMAGE_SPEC,
  tif: IMAGE_SPEC,
  png: IMAGE_SPEC,
  svg: IMAGE_SPEC,
  webp: IMAGE_SPEC,
  avif: IMAGE_SPEC,
  ico: IMAGE_SPEC,
  heic: IMAGE_SPEC,
  heif: IMAGE_SPEC,
  jxl: IMAGE_SPEC,
  // ---- renderer-dicom ----
  dcm: DICOM_SPEC,
  dicom: DICOM_SPEC,
  // ---- renderer-media：音视频 ----
  mp4: MEDIA_SPEC,
  webm: MEDIA_SPEC,
  m3u8: MEDIA_SPEC,
  mp3: MEDIA_SPEC,
  mpeg: MEDIA_SPEC,
  wav: MEDIA_SPEC,
  ogg: MEDIA_SPEC,
  oga: MEDIA_SPEC,
  opus: MEDIA_SPEC,
  m4a: MEDIA_SPEC,
  aac: MEDIA_SPEC,
  flac: MEDIA_SPEC,
  weba: MEDIA_SPEC,
  midi: MEDIA_SPEC,
  mid: MEDIA_SPEC,
  // ---- renderer-3d：三维模型 ----
  glb: MODEL_SPEC,
  gltf: MODEL_SPEC,
  obj: MODEL_SPEC,
  stl: MODEL_SPEC,
  ply: MODEL_SPEC,
  fbx: MODEL_SPEC,
  dae: MODEL_SPEC,
  "3ds": MODEL_SPEC,
  "3mf": MODEL_SPEC,
  amf: MODEL_SPEC,
  usd: MODEL_SPEC,
  usda: MODEL_SPEC,
  usdc: MODEL_SPEC,
  usdz: MODEL_SPEC,
  kmz: MODEL_SPEC,
  step: MODEL_SPEC,
  stp: MODEL_SPEC,
  iges: MODEL_SPEC,
  igs: MODEL_SPEC,
  ifc: MODEL_SPEC,
  "3dm": MODEL_SPEC,
  brep: MODEL_SPEC,
  pcd: MODEL_SPEC,
  wrl: MODEL_SPEC,
  vrml: MODEL_SPEC,
  xyz: MODEL_SPEC,
  vtk: MODEL_SPEC,
  vtp: MODEL_SPEC,
  // ---- renderer-cad：CAD 图纸 ----
  dxf: CAD_SPEC,
  dwg: CAD_SPEC,
  dwf: CAD_SPEC,
  dwfx: CAD_SPEC,
  xps: CAD_SPEC,
  // ---- renderer-archive：压缩包 ----
  zip: ARCHIVE_SPEC,
  zipx: ARCHIVE_SPEC,
  "7z": ARCHIVE_SPEC,
  rar: ARCHIVE_SPEC,
  tar: ARCHIVE_SPEC,
  gz: ARCHIVE_SPEC,
  gzip: ARCHIVE_SPEC,
  tgz: ARCHIVE_SPEC,
  bz2: ARCHIVE_SPEC,
  bzip2: ARCHIVE_SPEC,
  tbz: ARCHIVE_SPEC,
  tbz2: ARCHIVE_SPEC,
  xz: ARCHIVE_SPEC,
  txz: ARCHIVE_SPEC,
  lzma: ARCHIVE_SPEC,
  zst: ARCHIVE_SPEC,
  tzst: ARCHIVE_SPEC,
  cab: ARCHIVE_SPEC,
  ar: ARCHIVE_SPEC,
  cpio: ARCHIVE_SPEC,
  iso: ARCHIVE_SPEC,
  xar: ARCHIVE_SPEC,
  lha: ARCHIVE_SPEC,
  lzh: ARCHIVE_SPEC,
  jar: ARCHIVE_SPEC,
  war: ARCHIVE_SPEC,
  ear: ARCHIVE_SPEC,
  apk: ARCHIVE_SPEC,
  cbz: ARCHIVE_SPEC,
  cbr: ARCHIVE_SPEC,
};

/**
 * 按扩展名查渲染器组。
 *
 * @param fileName 文件名或对象键（取其扩展名）
 * @returns 命中的渲染器组；未注册的后缀返回 null（入口据此提示不支持）
 */
export function specFor(fileName: string): RendererSpec | null {
  const dot = fileName.lastIndexOf(".");
  if (dot < 0) {
    return null;
  }
  const ext = fileName.slice(dot + 1).toLowerCase();
  return SPEC_BY_EXT[ext] ?? null;
}

/**
 * 已注册的后缀总数（对齐 file-viewer 274 格式的口径，含 preset-office 家族另行统计）。
 */
export function registeredExtCount(): number {
  return Object.keys(SPEC_BY_EXT).length;
}

/**
 * 把 UTF-8 文本编码为标准 base64（入口地址栏 ?url= 参数用）。
 *
 * <p>浏览器原生 {@code btoa} 只接受 latin1，直接编码中文 URL 会抛
 * InvalidCharacterError，必须先经 UTF-8 字节序列。</p>
 *
 * @param text 原始文本（通常是文件直链）
 * @returns base64 文本
 */
export function utf8ToBase64(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let bin = "";
  for (const b of bytes) {
    bin += String.fromCharCode(b);
  }
  return btoa(bin);
}

/**
 * 解码入口地址栏 {@code ?url=} 的 base64 文件直链。
 *
 * <p>兼容标准与 URL-safe 两种字母表、缺省的 {@code =} 填充
 * （与后端 handleThirdUrlPreview 的解码口径一致），输出按 UTF-8 还原。</p>
 *
 * @param encoded base64 文本
 * @returns 解码后的字符串；非法输入抛出异常
 */
export function base64ToUtf8(encoded: string): string {
  const normalized = encoded.replace(/-/g, "+").replace(/_/g, "/").replace(/\s+/g, "");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  const bin = atob(padded);
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder("utf-8").decode(bytes);
}
