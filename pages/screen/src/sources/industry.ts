/**
 * industry 屏（NEXUS · 智慧工业数字运营中心）文档工厂。
 *
 * <p>源文件来自 three-screen-lab {@code src/screens/industry}，?raw 原样装载、
 * 逐字节保留。generic 渲染器：观测台内核 + astra 头图 + model.js。</p>
 *
 * @since 4.0.0.52
 */
import { assembleScreen } from "../lib/assemble";
import { POPULATION_HEADER_STYLE, RELIEF_EXTENT, assetUrl, geo, kernel, licenses } from "../lib/assets";

import template from "../assets/screens/industry/template.html?raw";
import stylesCss from "../assets/screens/industry/styles.css?raw";
import appJs from "../assets/screens/industry/app.js?raw";
import modelJs from "../assets/screens/industry/model.js?raw";

/** 拼装 industry 屏完整 HTML 文档 */
export function buildIndustry(): string {
  return assembleScreen({
    id: "industry",
    kind: "generic",
    files: { template, stylesCss, appJs, modelJs },
    kernel,
    geo,
    urls: {
      headerArt: assetUrl("derived/astra-industry-header.webp"),
    },
    reliefExtent: RELIEF_EXTENT,
    populationHeaderStyle: POPULATION_HEADER_STYLE,
    licenses,
  });
}
