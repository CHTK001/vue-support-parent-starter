/**
 * population 屏（全国人口统计总览）文档工厂。
 *
 * <p>源文件来自 three-screen-lab {@code src/screens/population}，?raw 原样装载、
 * 逐字节保留。POPULATION_CHINA/OUTLINE/WORLD 三个标记在模板里是
 * {@code const X = null; /*__X__*\/} 形态，由 assembleScreen 的 null 正则特例
 * 展开为对象字面量。</p>
 *
 * @since 4.0.0.52
 */
import { assembleScreen } from "../lib/assemble";
import { POPULATION_HEADER_STYLE, RELIEF_EXTENT, assetUrl, geo, kernel, licenses } from "../lib/assets";

import template from "../assets/screens/population/template.html?raw";
import stylesCss from "../assets/screens/population/styles.css?raw";
import appJs from "../assets/screens/population/app.js?raw";
import globeJs from "../assets/screens/population/globe.js?raw";

/** 拼装 population 屏完整 HTML 文档 */
export function buildPopulation(): string {
  return assembleScreen({
    id: "population",
    kind: "population",
    files: { template, stylesCss, appJs, globeJs },
    kernel,
    geo,
    urls: {
      populationHeaderArt: assetUrl("derived/population-header.webp"),
      earthDay: assetUrl("derived/earth-day.webp"),
      earthNight: assetUrl("derived/earth-night.webp"),
      earthNormal: assetUrl("derived/earth-normal.webp"),
    },
    reliefExtent: RELIEF_EXTENT,
    populationHeaderStyle: POPULATION_HEADER_STYLE,
    licenses,
  });
}
