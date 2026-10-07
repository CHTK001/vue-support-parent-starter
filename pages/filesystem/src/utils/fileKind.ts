/**
 * 文件类型分类与 Windows 风格类型图标
 *
 * 原本内联在 `FileStorageManage.vue`，此处抽为独立模块，供压缩包预览面板
 * （`ArchivePreviewPanel.vue`）复用——压缩包内的条目同样需要按类型分类
 * （决定图标与「类型」列文案）与按类型取图标。两处各写一份必然漂移：
 * 主列表认得 dwg、压缩包面板认不得，或反过来。
 *
 * 纯搬迁，无行为变更。
 *
 * @author Buffy
 * @since 2026/09/29
 */

/** 预览类型 */
export type PreviewKind =
  | "image"
  | "tiff"
  | "heic"
  | "text"
  | "code"
  | "markdown"
  | "csv"
  | "pdf"
  | "office"
  | "email"
  | "calendar"
  | "contact"
  | "notebook"
  | "webpage"
  | "data"
  | "design"
  | "model"
  | "video"
  | "audio"
  | "font"
  | "archive"
  | "unknown";

/** 图片扩展名（浏览器原生可解码） */
const IMAGE_EXTS = ["png", "jpg", "jpeg", "gif", "svg", "webp", "bmp", "ico", "avif", "apng", "jfif"];

/** TIFF 扩展名（浏览器原生不支持，UTIF.js 前端解码） */
const TIFF_EXTS = ["tif", "tiff"];

/** HEIC 扩展名（浏览器原生不支持，libheif-js 前端解码；avif 原生可播仍归 image） */
const HEIC_EXTS = ["heic", "heif"];

/** 纯文本扩展名（前端直接拉取原文展示） */
const PLAIN_TEXT_EXTS = ["txt", "log", "json", "xml", "yaml", "yml"];

/** 源代码 / 配置文件扩展名（走后端语法高亮预览） */
const CODE_EXTS = [
  "js", "mjs", "cjs", "ts", "jsx", "tsx", "vue", "css", "scss", "less",
  "java", "kt", "groovy", "scala", "py", "rb", "go", "rs",
  "c", "h", "cpp", "hpp", "cs", "php", "swift", "dart", "lua", "pl",
  "sql", "sh", "bash", "zsh", "bat", "cmd", "ps1",
  "properties", "cfg", "conf", "ini", "env", "toml", "gradle",
  // 文本小格式（与后端 CodePreviewProvider#CODE_EXTS 严格一致）：
  // 字幕 srt/vtt/ass/ssa、补丁 diff/patch、IDL proto/avsc/graphql、har 等
  "srt", "vtt", "ass", "ssa",
  "diff", "patch",
  "proto", "avsc", "graphql", "gql",
  "ttc", "har", "editorconfig", "gitignore", "dockerignore", "npmrc",
];

/**
 * Office 及其他服务端渲染的文档扩展名（统一走 iframe ?preview=true）
 *
 * <p>不要把 dwg / dgn 放这里：{@link kindOf} 先判本表再判 {@link MODEL_EXTS}，
 * 留在这里会让它们被判成 office 而落回 iframe 通道，CAD 面板永远收不到 DWG。
 * 那条通道上等着它们的是后端旧的 {@code CadPreviewProvider} HTML 信息卡。</p>
 */
const OFFICE_EXTS = [
  "xlsx", "xls", "docx", "doc", "pptx", "ppt",
  // wps：WPS 文字文档。归到 office 只是**语义归类**（isClientRenderable 不看本清单，
  // 它只认 EXTENSION_TO_RENDERER / LEGACY_BINARY_EXTS），实际走「服务端转 PDF」通道
  // —— 见 FileStorageManage.vue 的 needsPdfConvert。
  "wps",
  "odt", "ods", "odp", "vsd", "vsdx", "vssx", "vstx", "vdx",
  "rtf", "epub", "xmind",
  // MOBI 电子书（后端 MobiPreviewProvider：PDB/PalmDOC/HUFF-CDIC 自研解析）
  "mobi", "azw", "azw3", "prc",
  // XPS 固定版式（后端 XpsPreviewProvider：OPC + Glyphs 抽文本）
  "xps", "oxps",
  // Apple iWork（后端 IworkPreviewProvider：'09 APXL 抽文本 + IWA 解 Snappy 抽字）
  // .key 同时也是 PGP/许可证私钥的常用扩展名，非 ZIP 包时后端按纯文本兜底展示
  "pages", "numbers", "key",
  // DjVu（后端 DjvuPreviewProvider：元数据 + NAVM 书签 + TXTz 文字层；不渲染图像）
  "djvu", "djv",
];

/** 网页文件扩展名（后端沙箱渲染） */
const WEBPAGE_EXTS = ["html", "htm"];

/** 数据文件扩展名（数据库 / 大数据格式，服务端解析） */
const DATA_EXTS = ["sqlite", "sqlite3", "db", "parquet", "pq", "avro", "avsc", "avdl"];

/** 设计稿扩展名（服务端转图预览） */
const DESIGN_EXTS = ["psd", "psb"];

/**
 * 3D / CAD / GIS 模型扩展名
 *
 * DXF 走 CAD 面板出真实图形；IFC 走 {@link PreviewIfcPanel} 前端 3D 面板
 * （web-ifc 解析 + three 渲染，不经后端）；其余（glb/obj/stl/step/…）
 * 后端只有信息卡或外部转换，归 CAD 面板由它按 renderable 决定展示形态。
 */
const MODEL_EXTS = [
  "glb", "gltf", "obj", "stl", "dxf", "dwg", "blend", "fbx",
  "step", "stp", "iges", "igs", "brep", "shp", "dgn",
  // IFC（Industry Foundation Classes，BIM 模型，STEP/ISO 10303-21 文本）
  "ifc",
];

/** 邮件扩展名 */
const EMAIL_EXTS = ["eml", "msg"];

/** 日历事件扩展名 */
const CALENDAR_EXTS = ["ics", "ical", "ifb", "icalendar"];

/** 通讯录名片扩展名 */
const CONTACT_EXTS = ["vcf", "vcard"];

/** 视频扩展名（仅浏览器原生可播放容器） */
const VIDEO_EXTS = ["mp4", "webm", "ogg", "mov", "avi", "mkv", "flv", "wmv", "m4v", "3gp"];

/** 音频扩展名（浏览器原生可播放） */
const AUDIO_EXTS = ["mp3", "wav", "flac", "m4a", "oga", "opus", "weba"];

/** 字体扩展名 */
const FONT_EXTS = ["ttf", "otf", "woff", "woff2", "eot"];

/** 压缩包扩展名（走后端条目列表预览） */
const ARCHIVE_EXTS = [
  "zip", "zipx", "tar", "gz", "tgz", "bz2", "tbz2", "xz", "txz",
  "7z", "rar", "zst", "tzst", "jar", "war", "apk",
];

/**
 * Windows 风格彩色类型图标（SVG 标记，viewBox 48x48）。
 *
 * <p>目录为经典黄色双层文件夹；txt/json/代码/office/pdf/压缩包等常见类型
 * 均按 Windows 资源管理器风格绘制（白纸折角 + 类型色块/字符）。</p>
 */
const FS_TYPE_SVG: Record<string, string> = {
  /** 目录：黄色双层文件夹 */
  folder: `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg"><path d="M5 13a4 4 0 0 1 4-4h10.2l4.6 4.6a2 2 0 0 0 1.4.6H39a4 4 0 0 1 4 4v3H5z" fill="#f0b429"/><path d="M5 18h38v16.5a4.5 4.5 0 0 1-4.5 4.5h-29A4.5 4.5 0 0 1 5 34.5z" fill="#ffd166"/><path d="M5 18h38v2.4H5z" fill="#ffe4a1"/></svg>`,
  /** 兜底：空白文档 */
  file: `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg"><path d="M11 6a3 3 0 0 1 3-3h15l9 9v29a3 3 0 0 1-3 3H14a3 3 0 0 1-3-3z" fill="#fff" stroke="#c8d3de" stroke-width="1.6"/><path d="M29 3l9 9h-7a2 2 0 0 1-2-2z" fill="#d9e4ee"/></svg>`,
  /** 文本：白纸 + 蓝色行 */
  txt: `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg"><path d="M11 6a3 3 0 0 1 3-3h15l9 9v29a3 3 0 0 1-3 3H14a3 3 0 0 1-3-3z" fill="#fff" stroke="#c8d3de" stroke-width="1.6"/><path d="M29 3l9 9h-7a2 2 0 0 1-2-2z" fill="#d9e4ee"/><path d="M16 23h16M16 29h16M16 35h10" stroke="#4a90d9" stroke-width="2.4" stroke-linecap="round"/></svg>`,
  /** JSON：白纸 + 橙色花括号 */
  json: `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg"><path d="M11 6a3 3 0 0 1 3-3h15l9 9v29a3 3 0 0 1-3 3H14a3 3 0 0 1-3-3z" fill="#fff" stroke="#c8d3de" stroke-width="1.6"/><path d="M29 3l9 9h-7a2 2 0 0 1-2-2z" fill="#d9e4ee"/><text x="24" y="31" text-anchor="middle" font-family="Consolas,Menlo,monospace" font-size="13" font-weight="700" fill="#e8833a">{ }</text></svg>`,
  /** 代码：白纸 + 蓝色尖括号 */
  code: `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg"><path d="M11 6a3 3 0 0 1 3-3h15l9 9v29a3 3 0 0 1-3 3H14a3 3 0 0 1-3-3z" fill="#fff" stroke="#c8d3de" stroke-width="1.6"/><path d="M29 3l9 9h-7a2 2 0 0 1-2-2z" fill="#d9e4ee"/><path d="M19.5 20l-5.5 5.5 5.5 5.5M28.5 20l5.5 5.5-5.5 5.5" fill="none" stroke="#2f74c0" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  /** Markdown：白纸 + 靛蓝 M↓ */
  md: `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg"><path d="M11 6a3 3 0 0 1 3-3h15l9 9v29a3 3 0 0 1-3 3H14a3 3 0 0 1-3-3z" fill="#fff" stroke="#c8d3de" stroke-width="1.6"/><path d="M29 3l9 9h-7a2 2 0 0 1-2-2z" fill="#d9e4ee"/><text x="21" y="32" text-anchor="middle" font-family="Arial,sans-serif" font-size="14" font-weight="700" fill="#5b6bd6">M</text><path d="M32 22v8m0 0l-3-3m3 3l3-3" fill="none" stroke="#5b6bd6" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  /** 图片：相纸 + 山与太阳 */
  image: `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg"><rect x="6" y="8" width="36" height="30" rx="4" fill="#eaf4ff" stroke="#bcd7f0" stroke-width="1.6"/><circle cx="17" cy="18" r="3.6" fill="#ffd23f"/><path d="M9 38l10-12 7 8 5.5-5.5L38 34v2a2 2 0 0 1-2 2H11a2 2 0 0 1-2-2z" fill="#57b368"/></svg>`,
  /** 视频：蓝色胶片 + 播放键 */
  video: `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg"><rect x="5" y="10" width="38" height="28" rx="5" fill="#3d6fd6"/><path d="M20.5 18.5l11 5.5-11 5.5z" fill="#fff"/><rect x="5" y="10" width="38" height="28" rx="5" fill="none" stroke="#2c55a8" stroke-width="1.6"/></svg>`,
  /** 音频：紫色唱片 + 音符 */
  audio: `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg"><rect x="7" y="7" width="34" height="34" rx="7" fill="#8e5bd6"/><path d="M20 31V19.5l11-2.8V27" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/><circle cx="17.6" cy="31.2" r="3.2" fill="#fff"/><circle cx="28.6" cy="27.2" r="3.2" fill="#fff"/></svg>`,
  /** PDF：白纸 + 红色徽标 */
  pdf: `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg"><path d="M11 6a3 3 0 0 1 3-3h15l9 9v29a3 3 0 0 1-3 3H14a3 3 0 0 1-3-3z" fill="#fff" stroke="#c8d3de" stroke-width="1.6"/><path d="M29 3l9 9h-7a2 2 0 0 1-2-2z" fill="#d9e4ee"/><rect x="10" y="25" width="24" height="9.5" rx="2.2" fill="#e5493a"/><text x="22" y="32.4" text-anchor="middle" font-family="Arial,sans-serif" font-size="7" font-weight="700" fill="#fff">PDF</text></svg>`,
  /** 压缩包：纸箱 + 拉链 */
  zip: `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg"><path d="M13 16l3-7h16l3 7z" fill="#d98f2b"/><rect x="9" y="16" width="30" height="24" rx="4" fill="#f2a63c"/><path d="M23.2 16h1.6v3h-1.6zM23.2 21h1.6v3h-1.6zM23.2 26h1.6v3h-1.6z" fill="#fff" opacity="0.85"/><rect x="20.5" y="30" width="7" height="6" rx="1.5" fill="#fff"/></svg>`,
  /** Excel：白纸 + 绿色表格 */
  excel: `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg"><path d="M11 6a3 3 0 0 1 3-3h15l9 9v29a3 3 0 0 1-3 3H14a3 3 0 0 1-3-3z" fill="#fff" stroke="#c8d3de" stroke-width="1.6"/><path d="M29 3l9 9h-7a2 2 0 0 1-2-2z" fill="#d9e4ee"/><rect x="13" y="19" width="22" height="16" rx="2" fill="#2f9e5f"/><path d="M13 24.4h22M13 29.7h22M20.4 19v16M27.6 19v16" stroke="#fff" stroke-width="1.4"/></svg>`,
  /** Word：白纸 + 蓝色 W */
  word: `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg"><path d="M11 6a3 3 0 0 1 3-3h15l9 9v29a3 3 0 0 1-3 3H14a3 3 0 0 1-3-3z" fill="#fff" stroke="#c8d3de" stroke-width="1.6"/><path d="M29 3l9 9h-7a2 2 0 0 1-2-2z" fill="#d9e4ee"/><rect x="13" y="19" width="22" height="16" rx="2.4" fill="#2b6fd4"/><text x="24" y="31.5" text-anchor="middle" font-family="Arial,sans-serif" font-size="10" font-weight="700" fill="#fff">W</text></svg>`,
  /** PPT：白纸 + 橙色 P */
  ppt: `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg"><path d="M11 6a3 3 0 0 1 3-3h15l9 9v29a3 3 0 0 1-3 3H14a3 3 0 0 1-3-3z" fill="#fff" stroke="#c8d3de" stroke-width="1.6"/><path d="M29 3l9 9h-7a2 2 0 0 1-2-2z" fill="#d9e4ee"/><rect x="13" y="19" width="22" height="16" rx="2.4" fill="#e8833a"/><text x="24" y="31.5" text-anchor="middle" font-family="Arial,sans-serif" font-size="10" font-weight="700" fill="#fff">P</text></svg>`,
  /** 字体：白纸 + 紫色 Aa */
  font: `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg"><path d="M11 6a3 3 0 0 1 3-3h15l9 9v29a3 3 0 0 1-3 3H14a3 3 0 0 1-3-3z" fill="#fff" stroke="#c8d3de" stroke-width="1.6"/><path d="M29 3l9 9h-7a2 2 0 0 1-2-2z" fill="#d9e4ee"/><text x="24" y="32" text-anchor="middle" font-family="Georgia,serif" font-size="14" font-weight="700" fill="#8e5bd6">Aa</text></svg>`,
  /** 3D / BIM 模型：等轴测立方体（IFC、STEP 等归此类） */
  model: `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg"><path d="M11 6a3 3 0 0 1 3-3h15l9 9v29a3 3 0 0 1-3 3H14a3 3 0 0 1-3-3z" fill="#fff" stroke="#c8d3de" stroke-width="1.6"/><path d="M29 3l9 9h-7a2 2 0 0 1-2-2z" fill="#d9e4ee"/><path d="M24 21l9 4.5-9 4.5-9-4.5z" fill="#8fb4f5"/><path d="M24 30l9-4.5v9L24 39z" fill="#3f6fd6"/><path d="M24 30l-9-4.5v9L24 39z" fill="#5b8def"/></svg>`,
};

/**
 * 按扩展名判定文件预览类型
 *
 * @param name 文件名
 * @return 预览类型；无法识别时返回 unknown
 */
export function kindOf(name: string): PreviewKind {
  const ext = name.slice(name.lastIndexOf(".") + 1).toLowerCase();
  if (IMAGE_EXTS.includes(ext)) return "image";
  if (TIFF_EXTS.includes(ext)) return "tiff";
  if (HEIC_EXTS.includes(ext)) return "heic";
  if (CODE_EXTS.includes(ext)) return "code";
  if (ext === "md" || ext === "markdown") return "markdown";
  if (ext === "csv") return "csv";
  if (PLAIN_TEXT_EXTS.includes(ext)) return "text";
  if (ext === "pdf") return "pdf";
  if (OFFICE_EXTS.includes(ext)) return "office";
  if (EMAIL_EXTS.includes(ext)) return "email";
  if (CALENDAR_EXTS.includes(ext)) return "calendar";
  if (CONTACT_EXTS.includes(ext)) return "contact";
  if (ext === "ipynb") return "notebook";
  if (WEBPAGE_EXTS.includes(ext)) return "webpage";
  if (DATA_EXTS.includes(ext)) return "data";
  if (DESIGN_EXTS.includes(ext)) return "design";
  if (MODEL_EXTS.includes(ext)) return "model";
  if (VIDEO_EXTS.includes(ext)) return "video";
  if (AUDIO_EXTS.includes(ext)) return "audio";
  if (FONT_EXTS.includes(ext)) return "font";
  if (ARCHIVE_EXTS.includes(ext)) return "archive";
  return "unknown";
}

/**
 * 根据文件名/目录标记返回 Windows 风格 SVG 图标标记。
 *
 * <p>目录返回黄色文件夹；json/代码/markdown 等文本细分类型优先，
 * office 再按 Excel/PowerPoint/Word 三类区分，其余按大类兜底。</p>
 *
 * @param name  文件名称
 * @param isDir 是否为目录
 * @return SVG 标记字符串（配合 v-html 渲染）
 */
export function fileSvg(name: string, isDir: boolean): string {
  if (isDir) {
    return FS_TYPE_SVG.folder;
  }
  const ext = name.slice(name.lastIndexOf(".") + 1).toLowerCase();
  switch (kindOf(name)) {
    case "image":
    case "tiff":
    case "heic":
      return FS_TYPE_SVG.image;
    case "video":
      return FS_TYPE_SVG.video;
    case "audio":
      return FS_TYPE_SVG.audio;
    case "pdf":
      return FS_TYPE_SVG.pdf;
    case "archive":
      return FS_TYPE_SVG.zip;
    case "font":
      return FS_TYPE_SVG.font;
    case "office":
      // Excel 表格类 / PPT 演示类 / 其余按 Word 文档
      if (["xlsx", "xls", "ods"].includes(ext)) {
        return FS_TYPE_SVG.excel;
      }
      if (["pptx", "ppt", "odp", "pps"].includes(ext)) {
        return FS_TYPE_SVG.ppt;
      }
      return FS_TYPE_SVG.word;
    // 源代码统一蓝色尖括号图标
    case "code":
      return FS_TYPE_SVG.code;
    // Markdown 专属 M↓ 图标
    case "markdown":
      return FS_TYPE_SVG.md;
    // CSV 按表格类文件显示 Excel 图标
    case "csv":
      return FS_TYPE_SVG.excel;
    // 邮件 / 日历 / 名片 / Jupyter 暂无专属绘制，使用通用文档图标
    case "email":
    case "calendar":
    case "contact":
    case "notebook":
      return FS_TYPE_SVG.file;
    // 3D / BIM 模型使用立方体图标
    case "model":
      return FS_TYPE_SVG.model;
    // HTML 网页沿用代码图标；数据库/大数据文件使用花括号图标
    case "webpage":
      return FS_TYPE_SVG.code;
    case "data":
      return FS_TYPE_SVG.json;
    // PSD 设计稿按图片图标
    case "design":
      return FS_TYPE_SVG.image;
    case "text":
      // json 专属花括号图标，标记类文本使用代码图标，其余普通文本
      if (ext === "json") {
        return FS_TYPE_SVG.json;
      }
      if (["xml", "yaml", "yml"].includes(ext)) {
        return FS_TYPE_SVG.code;
      }
      return FS_TYPE_SVG.txt;
    default:
      return FS_TYPE_SVG.file;
  }
}

/** 压缩包扩展名集合（供调用方判断某文件是否走压缩包预览面板） */
export const ARCHIVE_EXTENSION_SET: ReadonlySet<string> = new Set(ARCHIVE_EXTS);

/** TIFF / HEIC 扩展名集合（走前端解码图片面板，不进原生 image 面板） */
export const TIFF_HEIC_EXTS: ReadonlySet<string> = new Set([...TIFF_EXTS, ...HEIC_EXTS]);

/** 前端直渲的数据文件扩展名（SQLite / Parquet，走 DataPreviewPanel） */
export const CLIENT_DATA_EXTS: ReadonlySet<string> = new Set(["sqlite", "sqlite3", "db", "parquet", "pq"]);

/** 前端直渲的设计稿扩展名（PSD / PSB，走 PsdPreviewPanel） */
export const CLIENT_PSD_EXTS: ReadonlySet<string> = new Set(["psd", "psb"]);

/**
 * 文件类型描述（列表「类型」列 / 排序提示）
 *
 * @param name 文件名
 * @return 中文类型描述
 */
export function fileTypeText(name: string): string {
  if (kindOf(name) === "archive") return "压缩文件";
  const ext = name.slice(name.lastIndexOf(".") + 1).toLowerCase();
  switch (kindOf(name)) {
    case "image": return "图片";
    case "tiff": return "TIFF 图像";
    case "heic": return "HEIC 图像";
    case "text": return "文本";
    case "code": return "代码文件";
    case "markdown": return "Markdown 文档";
    case "csv": return "CSV 表格";
    case "pdf": return "PDF 文档";
    case "office": return "Office 文档";
    case "email": return "邮件";
    case "calendar": return "日历事件";
    case "contact": return "通讯录名片";
    case "notebook": return "Jupyter 笔记本";
    case "webpage": return "网页文件";
    case "data": return "数据文件";
    case "design": return "设计稿";
    case "model": return "3D / CAD 模型";
    case "video": return "视频";
    case "audio": return "音频";
    case "font": return "字体";
    default: return ext ? `${ext.toUpperCase()} 文件` : "文件";
  }
}
