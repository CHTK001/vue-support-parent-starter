/**
 * factory 屏（智慧工厂可视化大屏）文档工厂。
 *
 * <p>源文件来自 three-screen-lab {@code src/screens/factory}，?raw 原样装载、
 * 逐字节保留。注意 {@code FACTORY_MODEL}（img src）由 fallback 图片 URL 覆盖，
 * 且必须晚于 model.js 文本注入（assembleScreen 的顺序已对齐 buildlib）。</p>
 *
 * @since 4.0.0.52
 */
import { assembleScreen } from "../lib/assemble";
import { POPULATION_HEADER_STYLE, RELIEF_EXTENT, assetUrl, geo, kernel, licenses } from "../lib/assets";

import template from "../assets/screens/factory/template.html?raw";
import stylesCss from "../assets/screens/factory/styles.css?raw";
import appJs from "../assets/screens/factory/app.js?raw";
import modelJs from "../assets/screens/factory/model.js?raw";

/** 拼装 factory 屏完整 HTML 文档 */
export function buildFactory(): string {
  return assembleScreen({
    id: "factory",
    kind: "factory",
    files: { template, stylesCss, appJs, modelJs },
    kernel,
    geo,
    urls: {
      factoryModel: assetUrl("derived/factory-fallback.webp"),
      factoryGridMask: assetUrl("textures/factory-grid.png"),
    },
    reliefExtent: RELIEF_EXTENT,
    populationHeaderStyle: POPULATION_HEADER_STYLE,
    licenses,
  });
}
