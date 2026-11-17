/**
 * inspection 屏（AI 智能巡检运营调度）文档工厂。
 *
 * <p>源文件来自 three-screen-lab {@code src/screens/inspection}，?raw 原样装载、
 * 逐字节保留。该屏用 D3 而非 THREE；地形贴图（terrain / map-surface）与
 * RELIEF_EXTENT 均为 buildlib 同源派生资产。</p>
 *
 * @since 4.0.0.52
 */
import { assembleScreen } from "../lib/assemble";
import { POPULATION_HEADER_STYLE, RELIEF_EXTENT, assetUrl, geo, kernel, licenses } from "../lib/assets";

import template from "../assets/screens/inspection/template.html?raw";
import stylesCss from "../assets/screens/inspection/styles.css?raw";
import appJs from "../assets/screens/inspection/app.js?raw";
import mapDepthJs from "../assets/screens/inspection/map-depth.js?raw";

/** 拼装 inspection 屏完整 HTML 文档 */
export function buildInspection(): string {
  return assembleScreen({
    id: "inspection",
    kind: "inspection",
    files: { template, stylesCss, appJs, mapDepthJs },
    kernel,
    geo,
    urls: {
      relief: assetUrl("derived/terrain.webp"),
      mapTexture: assetUrl("derived/map-surface.webp"),
    },
    reliefExtent: RELIEF_EXTENT,
    populationHeaderStyle: POPULATION_HEADER_STYLE,
    licenses,
  });
}
