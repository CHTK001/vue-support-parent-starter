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
  | "geo"
  | "bpmn"
  | "tga"
  | "ofd"
  | "drawio"
  | "dicom"
  | "swf"
  | "sketch"
  | "mindmap"
  | "jxl"
  | "unknown";

/** 图片扩展名（浏览器原生可解码） */
const IMAGE_EXTS = ["png", "jpg", "jpeg", "gif", "svg", "webp", "bmp", "ico", "avif", "apng", "jfif"];

/** TIFF 扩展名（浏览器原生不支持，UTIF.js 前端解码） */
const TIFF_EXTS = ["tif", "tiff"];

/** HEIC 扩展名（浏览器原生不支持，libheif-js 前端解码；avif 原生可播仍归 image） */
const HEIC_EXTS = ["heic", "heif"];

/**
 * JPEG XL 扩展名（经 file-viewer renderer-image 按浏览器能力解码）。
 *
 * <p>浏览器原生支持不一（Safari 17+ 支持，Chrome / Firefox 不支持
 * {@code image/jxl}），故不归 {@link IMAGE_EXTS} —— 归进去会被原生
 * {@code PreviewImagePanel} 接管，在不支持的浏览器里只会得到
 * 「图片加载失败」。与 TIFF / HEIC 同理拆为独立类型：图标归图片类，
 * 预览走 {@code FvImagePanel}（FV_PANEL_BY_EXT 已登记 jxl）。</p>
 */
const JXL_EXTS = ["jxl"];

/** 纯文本扩展名（前端直接拉取原文展示） */
const PLAIN_TEXT_EXTS = ["txt", "log", "json", "xml", "yaml", "yml"];

/** 源代码 / 配置文件扩展名（走后端语法高亮预览） */
const CODE_EXTS = [
  "js", "mjs", "cjs", "ts", "jsx", "tsx", "vue", "css", "scss", "less",
  "java", "kt", "groovy", "scala", "py", "rb", "go", "rs",
  "c", "h", "cpp", "hpp", "cc", "cs", "php", "swift", "dart", "lua", "pl",
  "sql", "sh", "bash", "zsh", "bat", "cmd", "ps1",
  "properties", "cnf", "cfg", "conf", "ini", "env", "toml", "gradle",
  // 文本小格式（与后端 CodePreviewProvider#CODE_EXTS 严格一致）：
  // 字幕 srt/vtt/ass/ssa、补丁 diff/patch、IDL proto/avsc/graphql、har 等
  "srt", "vtt", "ass", "ssa",
  "diff", "patch",
  "proto", "avsc", "graphql", "gql",
  "ttc", "har", "editorconfig", "gitignore", "dockerignore", "npmrc",
  // file-viewer renderer-text 的补充代码扩展（不占已有 text/webpage 分支）：
  "jsonc", "json5", "bundle", "bdl", "hcl", "tex", "gv", "http", "react",
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
  // WPS 家族：wps(文字) / wpt(文字模板) / et、ett(表格) / dps、dpt(演示)。
  // 归到 office 只是**语义归类**（isClientRenderable 不看本清单，它只认
  // EXTENSION_TO_RENDERER / LEGACY_BINARY_EXTS）。实际通道由内容魔数决定：
  // 已在 officeRenderer#resolveViewerFileName 中按 ZIP/OLE2 改名到
  // docx/xlsx/pptx 或 doc/xls/ppt，由 preset-office 客户端直渲；
  // 客户端解析失败时由 PreviewOfficePanel 探测 ?format=pdf 兜底。
  "wps", "wpt", "et", "ett", "dps", "dpt",
  // file-viewer 客户端直渲染的补充格式（2026/10/10 与 preset-office capability 对齐）：
  // WordPerfect wp/wp5/wp6、Excel 加载宏 xla/xlam、dBase 表 dbf。语义归 office，
  // 实际通道由 isClientRenderable 决定（这几个都命中客户端 Office 面板）。
  "wp", "wp5", "wp6", "xla", "xlam", "dbf",
  "odt", "ods", "odp", "vsd", "vsdx", "vssx", "vstx", "vdx",
  // Office 模板与宏工作簿（2026/10/12 与 preset-office capability 对齐）：
  // Excel 宏工作簿/模板、Word 模板、PPT 模板/放映，以及 ODF 表格、
  // 制表符文本表格、Hangul、WordPerfect。语义归 office，
  // 实际通道仍由 isClientRenderable 决定（本批全部命中客户端 Office 面板）。
  "xlsm", "xltx", "xltm", "xlt",
  "docm", "dotm", "dotx", "dot",
  "pot", "potm", "potx", "ppsm", "ppsx", "pptm",
  "fods", "tsv", "hwp", "hwpx", "wpd",
  // FB2 / UMD 电子书：isClientRenderable 不含它们，
  // 实际由 FvDocPanel 电子书分支前端直渲；归类只为图标 / 文案。
  "fb2", "umd",
  // XMind 脑图曾归本表（rtf/epub 邻位），现已拆为 {@link MINDMAP_EXTS}
  // 独立类型：它是脑图而非 Office 文档，图标 / 类型文案 / 缩略图策略都不同。
  "rtf", "epub",
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
const DATA_EXTS = [
  "sqlite", "sqlite3", "db", "parquet", "pq", "avro", "avsc", "avdl",
  // Apache Arrow IPC：.arrow / .feather（旧名）/ .ipc，前端 apache-arrow 解析
  "arrow", "feather", "ipc",
];

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
  // 以下 8 类归 PreviewModel3dPanel（three 加载器 / occt-import-js / rhino3dm WASM 前端渲染）
  "3dm", "3ds", "ply", "dae", "wrl", "3mf", "off",
];

/** 邮件扩展名 */
const EMAIL_EXTS = ["eml", "msg", "mbox"];

/** 日历事件扩展名 */
const CALENDAR_EXTS = ["ics", "ical", "ifb", "icalendar"];

/** 通讯录名片扩展名 */
const CONTACT_EXTS = ["vcf", "vcard"];

/** 视频扩展名（仅浏览器原生可播放容器） */
const VIDEO_EXTS = ["mp4", "webm", "ogg", "mov", "avi", "mkv", "flv", "wmv", "m4v", "3gp"];

/**
 * 音频扩展名（浏览器原生可播放；aiff/aif 由 PreviewMediaPanel 转 WAV 后播放）。
 * aac 由 file-viewer renderer-media 映射为 {@code audio/aac}，浏览器原生可播。
 */
const AUDIO_EXTS = ["mp3", "wav", "flac", "m4a", "oga", "opus", "weba", "aiff", "aif", "aac"];

/** 字体扩展名 */
const FONT_EXTS = ["ttf", "otf", "woff", "woff2", "eot"];

/**
 * 地理数据扩展名（纯前端 Leaflet 面板渲染，不经后端）。
 *
 * <p>仅收标准 GeoJSON（RFC 7946）。TopoJSON 结构与之不同（量化坐标 + 拓扑弧段），
 * Leaflet 不能直接解析，未收录 —— 让它走 `unknown` 兜底，比解析成一张错图诚实。</p>
 */
const GEO_EXTS = ["geojson"];

/** BPMN 流程图扩展名（纯前端 bpmn-js 面板渲染，不经后端） */
const BPMN_EXTS = ["bpmn"];

/** TGA 扩展名（浏览器原生不支持，内置纯 TS 解码器前端解码，见 utils/tga.ts） */
const TGA_EXTS = ["tga"];

/** OFD 版式文档扩展名（纯前端 @ofdjs/viewer 面板渲染，不经后端） */
const OFD_EXTS = ["ofd"];

/** drawio 绘图扩展名（自托管 viewer-static 前端渲染，不经后端） */
const DRAWIO_EXTS = ["drawio"];

/** DICOM 医疗影像扩展名（cornerstone3D 前端渲染，不经后端） */
const DICOM_EXTS = ["dcm", "dicom"];

/** SWF 扩展名（Ruffle WASM 模拟器前端播放，不经后端） */
const SWF_EXTS = ["swf"];

/**
 * Sketch 绘图扩展名（纯前端 jszip 解结构：页面 / 画板 / 预览图，不经后端）。
 *
 * <p>.sketch 是 ZIP 容器：meta.json 记录页面清单，pages/&lt;UUID&gt;.json
 * 记录每页图层，previews/ 与 images/ 放位图。后端没有 Sketch 提供者，
 * 进 iframe 只会命中「不支持预览」页，故前端接住。</p>
 */
const SKETCH_EXTS = ["sketch"];

/**
 * XMind 脑图扩展名（纯前端 @file-viewer/renderer-mindmap 渲染，不经后端）。
 *
 * <p>.xmind 是 ZIP 容器（content.json + metadata.json + attachments/），
 * 由 {@code @ljheee/xmind-parser} 解析成节点树后渲染为可缩放脑图。
 * 后端无脑图提供者，且脑图是结构化文档而非 Office 文档，
 * 故从 OFFICE_EXTS 拆出独立归类，匹配其专属图标与「XMind 脑图」文案。</p>
 */
const MINDMAP_EXTS = ["xmind", "mm", "opml"];

/** 压缩包扩展名（走后端条目列表预览） */
const ARCHIVE_EXTS = [
  "zip", "zipx", "tar", "gz", "tgz", "bz2", "tbz2", "xz", "txz",
  "7z", "rar", "zst", "tzst", "jar", "war", "apk",
];

/**
 * Windows 风格彩色类型图标（真实 SVG 文件，viewBox 48x48）。
 *
 * <p>图标统一存放在 {@code assets/file-icons/*.svg}，此处经
 * {@code import.meta.glob(..., ?raw, eager)} 一次性以文本载入，
 * {@link fileSvg} 按类型取对应文件的 SVG 标记（配合 v-html 渲染）。
 * 新增类型只需加一个 svg 文件 + 在 {@link fileSvg} 里映射，无需改模板。</p>
 *
 * <p>目录为经典黄色双层文件夹；txt/json/代码/office/pdf/压缩包等常见类型
 * 均按 Windows 资源管理器风格绘制（白纸折角 + 类型色块/字符）。</p>
 */
const iconModules = import.meta.glob<string>("../assets/file-icons/*.svg", {
  query: "?raw",
  import: "default",
  eager: true,
});

/** 文件名（无扩展名） -> SVG 标记文本 */
const FS_TYPE_SVG: Record<string, string> = Object.fromEntries(
  Object.entries(iconModules).map(([path, svg]) => [
    path.slice(path.lastIndexOf("/") + 1, path.lastIndexOf(".")),
    svg,
  ]),
);

/** 取图标：缺文件时退回通用文档图标，保证老版本缓存/漏文件也不白屏 */
function icon(name: string): string {
  return FS_TYPE_SVG[name] ?? FS_TYPE_SVG.file;
}

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
  if (ext === "md" || ext === "markdown" || ext === "markmap") return "markdown";
  if (ext === "csv") return "csv";
  if (PLAIN_TEXT_EXTS.includes(ext)) return "text";
  if (ext === "pdf") return "pdf";
  if (OFFICE_EXTS.includes(ext)) return "office";
  if (EMAIL_EXTS.includes(ext)) return "email";
  if (CALENDAR_EXTS.includes(ext)) return "calendar";
  if (CONTACT_EXTS.includes(ext)) return "contact";
  if (ext === "ipynb") return "notebook";
  if (WEBPAGE_EXTS.includes(ext)) return "webpage";
  if (GEO_EXTS.includes(ext)) return "geo";
  if (BPMN_EXTS.includes(ext)) return "bpmn";
  if (TGA_EXTS.includes(ext)) return "tga";
  if (OFD_EXTS.includes(ext)) return "ofd";
  if (DRAWIO_EXTS.includes(ext)) return "drawio";
  if (DICOM_EXTS.includes(ext)) return "dicom";
  if (SWF_EXTS.includes(ext)) return "swf";
  if (SKETCH_EXTS.includes(ext)) return "sketch";
  if (MINDMAP_EXTS.includes(ext)) return "mindmap";
  if (JXL_EXTS.includes(ext)) return "jxl";
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
    return icon("folder");
  }
  const ext = name.slice(name.lastIndexOf(".") + 1).toLowerCase();
  // 扩展名专属图标优先（真实应用图标质感）：命中则直接返回
  const extIcon = icon(ext);
  if (FS_TYPE_SVG[ext]) {
    return extIcon;
  }
  switch (kindOf(name)) {
    case "image":
    case "tiff":
    case "heic":
    case "tga":
      return icon("image");
    case "video":
      return icon("video");
    case "audio":
      return icon("audio");
    case "pdf":
      return icon("pdf");
    case "archive":
      return icon("zip");
    case "font":
      return icon("font");
    case "office":
      // Excel 表格类 / PPT 演示类 / 电子书 / 其余按 Word 文档
      if (["xlsx", "xls", "ods", "numbers", "et", "ett", "xla", "xlam", "dbf",
        "xlsm", "xltx", "xltm", "xlt", "fods", "tsv"].includes(ext)) {
        return icon("excel");
      }
      if (["pptx", "ppt", "odp", "pps", "key", "dps", "dpt",
        "pot", "potm", "potx", "ppsm", "ppsx", "pptm"].includes(ext)) {
        return icon("ppt");
      }
      if (["epub", "mobi", "azw", "azw3", "xps", "oxps", "djvu", "djv", "pages", "fb2", "umd"].includes(ext)) {
        return icon("epub");
      }
      if (["vsd", "vsdx", "vssx", "vstx", "vdx"].includes(ext)) {
        return icon("visio");
      }
      return icon("word");
    // 源代码统一蓝色尖括号图标；字幕文件用专属字幕图标
    case "code":
      if (["srt", "vtt", "ass", "ssa"].includes(ext)) {
        return icon("subtitle");
      }
      return icon("code");
    // Markdown 专属 M↓ 图标
    case "markdown":
      return icon("md");
    // CSV 按表格类文件显示 Excel 图标
    case "csv":
      return icon("excel");
    // 邮件 / 日历 / 名片 / Jupyter 各有专属图标
    case "email":
      return icon("email");
    case "calendar":
      return icon("calendar");
    case "contact":
      return icon("contact");
    case "notebook":
      return icon("notebook");
    // CAD / 3D 模型：dwg/dxf/dgn/shp 走 CAD 图纸图标，其余 3D 用立方体图标
    case "model":
      if (["dwg", "dxf", "dgn", "shp"].includes(ext)) {
        return icon("cad");
      }
      return icon("model");
    // 地理数据使用地图 + 定位针图标
    case "geo":
      return icon("geo");
    // BPMN 流程图专属图标
    case "bpmn":
      return icon("bpmn");
    // OFD 版式文档专属图标（红色公文风）
    case "ofd":
      return icon("ofd");
    // drawio 绘图专属图标（三色节点流程图风）
    case "drawio":
      return icon("drawio");
    // DICOM 医疗影像专属图标（胶片风）
    case "dicom":
      return icon("dcm");
    // SWF 动画专属图标（Flash 红色 F 风）
    case "swf":
      return icon("swf");
    // Sketch 绘图专属图标（蓝紫菱形画布风）
    case "sketch":
      return icon("sketch");
    // XMind 脑图专属图标（绿底白脑图节点风）
    case "mindmap":
      return icon("mindmap");
    // JPEG XL 归图片类（与 TIFF/HEIC 同走 image 图标）
    case "jxl":
      return icon("image");
    // HTML 网页 / 数据库 / 设计稿各有专属图标
    case "webpage":
      return icon("webpage");
    case "data":
      return icon("data");
    case "design":
      return icon("design");
    case "text":
      // json 专属花括号图标，标记类文本使用代码图标，播放列表用专属图标，其余普通文本
      if (ext === "json") {
        return icon("json");
      }
      if (["m3u", "m3u8", "pls", "cue"].includes(ext)) {
        return icon("playlist");
      }
      if (["xml", "yaml", "yml"].includes(ext)) {
        return icon("code");
      }
      return icon("txt");
    default:
      // file-viewer 支持、但原生面板不接管的格式：图标按大类归，
      // 预览仍走对应的 fv 面板（FvGeoPanel / FvModelPanel / FvCadPanel /
      // FvArchivePanel / FvDesignPanel），不会被原生面板误抢。
      if (["kml", "gpx"].includes(ext)) {
        return icon("geo");
      }
      if (["vtk", "vtp", "xyz", "usd", "usdz", "kmz"].includes(ext)) {
        return icon("model");
      }
      if (["dwf", "dwfx"].includes(ext)) {
        return icon("cad");
      }
      if (["tbz", "bzip2", "gzip", "ar", "cpio", "xar", "lha", "lzh",
        "lzma", "cab", "iso", "cbr", "cbz"].includes(ext)) {
        return icon("zip");
      }
      if (["pdd", "psdt", "fla", "xfl", "xd", "indd", "ps"].includes(ext)) {
        return icon("design");
      }
      // 视频面板（video.js）接管的流式格式：kindOf 是 unknown，
      // 这里按视频大类给图标，文案见 fileTypeText 的对应分支
      if (["m3u8", "flv"].includes(ext)) {
        return icon("video");
      }
      return icon("file");
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
    case "office":
      // 电子书 / 文本表格单独标注，其余按 Office 文档
      if (["fb2", "umd"].includes(ext)) return "电子书";
      if (["tsv", "fods"].includes(ext)) return "表格";
      return "Office 文档";
    case "email": return "邮件";
    case "calendar": return "日历事件";
    case "contact": return "通讯录名片";
    case "notebook": return "Jupyter 笔记本";
    case "webpage": return "网页文件";
    case "data": return "数据文件";
    case "design": return "设计稿";
    case "model": return "3D / CAD 模型";
    case "geo": return "地理数据";
    case "bpmn": return "BPMN 流程图";
    case "tga": return "TGA 图像";
    case "ofd": return "OFD 版式文档";
    case "drawio": return "drawio 绘图";
    case "dicom": return "DICOM 医疗影像";
    case "swf": return "SWF 动画";
    case "sketch": return "Sketch 绘图";
    case "mindmap": return "XMind 脑图";
    case "jxl": return "JPEG XL 图像";
    case "video": return "视频";
    case "audio": return "音频";
    case "font": return "字体";
    default:
      // 同 fileSvg 的 default 分支：fv 面板接管的格式按大类标注
      if (["kml", "gpx"].includes(ext)) return "地理数据";
      if (["vtk", "vtp", "xyz", "usd", "usdz", "kmz"].includes(ext)) {
        return "3D / CAD 模型";
      }
      if (["dwf", "dwfx"].includes(ext)) return "CAD 图纸";
      if (["tbz", "bzip2", "gzip", "ar", "cpio", "xar", "lha", "lzh",
        "lzma", "cab", "iso", "cbr", "cbz"].includes(ext)) {
        return "压缩文件";
      }
      if (["pdd", "psdt", "fla", "xfl", "xd", "indd", "ps"].includes(ext)) {
        return "设计稿";
      }
      if (ext === "m3u8") return "HLS 视频";
      if (ext === "flv") return "FLV 视频";
      return ext ? `${ext.toUpperCase()} 文件` : "文件";
  }
}
