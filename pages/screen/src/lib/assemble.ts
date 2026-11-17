/**
 * three-screen-lab 构建管线（`scripts/buildlib.py` → `Builder.screen` + `finish`）
 * 的浏览器侧复刻。
 *
 * <p>七屏的 template/app/styles/model 等源文件**逐字节保留**，构建期缺失的
 * 共享内核（THREE / RUNTIME / 观测台组件）与派生资产（webp 贴图、压缩 geo、
 * 许可声明）由本模块在运行时按 buildlib 的**同一插入顺序**与**同一替换算法**
 * 拼回完整 HTML 文档，再由 {@code BigScreenFrame} 以 iframe srcdoc 承载。</p>
 *
 * <p>替换算法（与 buildlib 逐条对齐，顺序敏感，勿改）：</p>
 * <ol>
 *   <li>基础内核 D3 / THREE / RUNTIME；</li>
 *   <li>观测台共享内核 OBSERVATORY_CSS / OBSERVATORY_JS / OBSERVATORY_SCENE /
 *       OBSERVATORY_HEADER / ASTRA_GEOMETRY（模板中出现才注入）；</li>
 *   <li>OBSERVATORY_HEADER_ART（astra 头图 URL，模板中出现才注入）；</li>
 *   <li>每屏文件标记：styles.css→CSS、app.js→JS、model.js→MODEL_JS+MODEL、
 *       globe.js→GLOBE_JS、map-depth.js→MAP_DEPTH、data.js→SCREEN_DATA，
 *       各含 {@code SCREEN_} / {@code KIND_} 前缀与裸标记三种；</li>
 *   <li>renderer 专用块（factory / population / inspection）——注意
 *       {@code /*__FACTORY_MODEL__*\/} 在这里被图片 URL 覆盖，必须晚于第 4 步
 *       model.js 的注入；</li>
 *   <li>逐标记替换：先 {@code null(\s*;)?\s*MARKER} 正则（formatter 会把占位
 *       注释挪到分号后，population 的 {@code const X = null; /*__X__*\/} 即此形态），
 *       再全量字面替换；</li>
 *   <li>finish：残留标记检查 + 版权声明注入 {@code </head>} 前。</li>
 * </ol>
 *
 * @since 4.0.0.52
 */

/** 一块屏的原始源文件（?raw 原样装载，不做任何改写） */
export interface ScreenFiles {
  template: string;
  stylesCss?: string;
  appJs?: string;
  modelJs?: string;
  globeJs?: string;
  mapDepthJs?: string;
  dataJs?: string;
}

/** three-screen-lab 共享内核文本（src/shared + vendor） */
export interface SharedKernel {
  d3: string;
  three: string;
  runtime: string;
  observatoryCss: string;
  observatoryJs: string;
  observatoryScene: string;
  observatoryHeader: string;
  astraGeometry: string;
}

/** 版权声明文本（finish 注入用） */
export interface LicenseTexts {
  root: string;
  three: string;
  d3: string;
  naturalEarth: string;
  astra: string;
}

/** 拼装上下文：一块屏需要的全部输入 */
export interface AssembleContext {
  id: string;
  kind: "wind" | "factory" | "population" | "inspection" | "generic";
  files: ScreenFiles;
  kernel: SharedKernel;
  /** 压缩 geo 文本（buildlib.compact_geo 产物） */
  geo: { china: string; outline: string; world: string };
  /** 资产绝对 URL（srcdoc 无基准地址，必须全部绝对化） */
  urls: {
    /** astra 头图（OBSERVATORY_HEADER_ART） */
    headerArt?: string;
    factoryModel?: string;
    factoryGridMask?: string;
    populationHeaderArt?: string;
    earthDay?: string;
    earthNight?: string;
    earthNormal?: string;
    /** inspection 合成地形 */
    relief?: string;
    mapTexture?: string;
  };
  /** buildlib 的 json.dumps(relief-metadata.extent) 原文 */
  reliefExtent: string;
  /** population 头图定位 CSS（由 alpha bbox 预计算） */
  populationHeaderStyle: string;
  licenses: LicenseTexts;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** 全量字面替换（等价 Python str.replace；JS 的 String.replace 字符串参数只换首个） */
function replaceAll(content: string, marker: string, text: string): string {
  return content.split(marker).join(text);
}

function requireUrl(url: string | undefined, name: string, id: string): string {
  if (!url) {
    throw new Error(`[bigscreen] 屏 "${id}" 拼装需要资产 ${name}，但上下文未提供`);
  }
  return url;
}

/** 与 buildlib.finish 一致：残留标记检查 + 许可声明注入 */
function finish(id: string, content: string, licenses: LicenseTexts): string {
  const unresolved = content.match(/\/\*__[A-Z_]+__\*\/|<!--__[A-Z_]+__-->/g);
  if (unresolved) {
    throw new Error(`[bigscreen] 屏 "${id}" 存在未解析的构建标记: ${unresolved.join(", ")}`);
  }
  const notices = [licenses.root, licenses.three, licenses.d3, licenses.naturalEarth];
  if (content.includes('id="observatory"')) {
    notices.push(licenses.astra);
  }
  const notice = "\n<!-- Distribution permissions\n" + notices.join("\n\n") + "\n-->\n";
  // JS 的字符串替换只替换首个出现，等价 Python replace(..., 1)。
  return content.includes("</head>")
    ? content.replace("</head>", notice + "</head>")
    : content + notice;
}

/**
 * 拼装一块屏的完整 HTML 文档。输入全部来自 three-screen-lab 原文件与
 * buildlib 同源派生资产，输出与 three-screen-lab 构建产物语义一致。
 */
export function assembleScreen(ctx: AssembleContext): string {
  const { id, kind, files, kernel } = ctx;
  let content = files.template;

  // 1. 基础内核（buildlib 对每屏都注入，模板无该标记时为 no-op）
  const replacements = new Map<string, string>();
  replacements.set("/*__D3__*/", kernel.d3);
  replacements.set("/*__THREE__*/", kernel.three);
  replacements.set("/*__RUNTIME__*/", kernel.runtime);

  // 2. 观测台共享内核：模板中出现才注入
  const sharedMarkers: Array<[string, string]> = [
    ["OBSERVATORY_CSS", kernel.observatoryCss],
    ["OBSERVATORY_JS", kernel.observatoryJs],
    ["OBSERVATORY_SCENE", kernel.observatoryScene],
    ["OBSERVATORY_HEADER", kernel.observatoryHeader],
    ["ASTRA_GEOMETRY", kernel.astraGeometry],
  ];
  for (const [marker, text] of sharedMarkers) {
    const token = `/*__${marker}__*/`;
    if (content.includes(token)) {
      replacements.set(token, text);
    }
  }

  // 3. astra 头图
  const headerArtToken = "/*__OBSERVATORY_HEADER_ART__*/";
  if (content.includes(headerArtToken)) {
    replacements.set(headerArtToken, requireUrl(ctx.urls.headerArt, "headerArt", id));
  }

  // 4. 每屏文件标记（SCREEN_ / KIND_ / 裸 三种前缀；同标记后写覆盖先写，
  //    与 buildlib 的 dict 赋值语义一致）
  const perFile: Array<[string | undefined, string[]]> = [
    [files.stylesCss, ["CSS"]],
    [files.appJs, ["JS"]],
    [files.modelJs, ["MODEL_JS", "MODEL"]],
    [files.globeJs, ["GLOBE_JS"]],
    [files.mapDepthJs, ["MAP_DEPTH"]],
    [files.dataJs, ["SCREEN_DATA"]],
  ];
  const kindUpper = kind.toUpperCase();
  for (const [text, markers] of perFile) {
    if (text === undefined) continue;
    for (const marker of markers) {
      for (const prefix of ["SCREEN", kindUpper]) {
        replacements.set(`/*__${prefix}_${marker}__*/`, text);
      }
      replacements.set(`/*__${marker}__*/`, text);
    }
  }

  // 5. renderer 专用块（在 per-file 之后覆盖，保证 FACTORY_MODEL 等拿到资产而非源码文本）
  if (kind === "factory") {
    replacements.set("/*__FACTORY_MODEL__*/", requireUrl(ctx.urls.factoryModel, "factoryModel", id));
    replacements.set("/*__FACTORY_GRID_MASK__*/", requireUrl(ctx.urls.factoryGridMask, "factoryGridMask", id));
  } else if (kind === "population") {
    replacements.set("/*__HEADER_ART__*/", requireUrl(ctx.urls.populationHeaderArt, "populationHeaderArt", id));
    replacements.set("/*__POPULATION_CHINA__*/", ctx.geo.china);
    replacements.set("/*__POPULATION_OUTLINE__*/", ctx.geo.outline);
    replacements.set("/*__POPULATION_WORLD__*/", ctx.geo.world);
    replacements.set("/*__EARTH_DAY__*/", requireUrl(ctx.urls.earthDay, "earthDay", id));
    replacements.set("/*__EARTH_NIGHT__*/", requireUrl(ctx.urls.earthNight, "earthNight", id));
    replacements.set("/*__EARTH_NORMAL__*/", requireUrl(ctx.urls.earthNormal, "earthNormal", id));
  } else if (kind === "inspection") {
    replacements.set("/*__CHINA__*/", ctx.geo.china);
    replacements.set("/*__CHINA_OUTLINE__*/", ctx.geo.outline);
    replacements.set("/*__COUNTRIES__*/", ctx.geo.world);
    if (files.mapDepthJs !== undefined) {
      replacements.set("/*__MAP_DEPTH__*/", files.mapDepthJs);
    }
    replacements.set("/*__RELIEF__*/", requireUrl(ctx.urls.relief, "relief", id));
    replacements.set("/*__MAP_TEXTURE__*/", requireUrl(ctx.urls.mapTexture, "mapTexture", id));
    replacements.set("/*__RELIEF_EXTENT__*/", ctx.reliefExtent);
  }

  // population 头图定位：buildlib 在替换前把预计算样式写进 <header>
  if (kind === "population") {
    content = replaceAll(
      content,
      '<header class="population-header">',
      `<header class="population-header" style="${ctx.populationHeaderStyle}">`,
    );
  }

  // 6. 逐标记替换：先 null(\s*;)?\s*MARKER 正则（带分号回填），再全量字面替换
  for (const [marker, text] of replacements) {
    const nullPattern = new RegExp(`null(\\s*;)?\\s*${escapeRegExp(marker)}`, "g");
    content = content.replace(nullPattern, (_match, semi: string | undefined) => text + (semi ? ";" : ""));
    content = replaceAll(content, marker, text);
  }

  // 7. finish：残留标记检查 + 版权声明
  return finish(id, content, ctx.licenses);
}
