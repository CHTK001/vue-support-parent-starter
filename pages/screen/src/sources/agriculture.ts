/**
 * agriculture 屏（禾境 · 智慧农业生态管理中心）文档工厂。
 *
 * <p>源文件来自 three-screen-lab {@code src/screens/agriculture}，?raw 原样装载、
 * 逐字节保留。generic 渲染器：观测台内核 + astra 头图 + model.js。</p>
 *
 * @since 4.0.0.52
 */
import { assembleScreen } from "../lib/assemble";
import { POPULATION_HEADER_STYLE, RELIEF_EXTENT, assetUrl, geo, kernel, licenses } from "../lib/assets";

import template from "../assets/screens/agriculture/template.html?raw";
import stylesCss from "../assets/screens/agriculture/styles.css?raw";
import appJs from "../assets/screens/agriculture/app.js?raw";
import modelJs from "../assets/screens/agriculture/model.js?raw";

/** 拼装 agriculture 屏完整 HTML 文档 */
export function buildAgriculture(): string {
  return assembleScreen({
    id: "agriculture",
    kind: "generic",
    files: { template, stylesCss, appJs, modelJs },
    kernel,
    geo,
    urls: {
      headerArt: assetUrl("derived/astra-agriculture-header.webp"),
    },
    reliefExtent: RELIEF_EXTENT,
    populationHeaderStyle: POPULATION_HEADER_STYLE,
    licenses,
  });
}
