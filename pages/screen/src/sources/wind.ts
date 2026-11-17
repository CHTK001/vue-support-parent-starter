/**
 * wind 屏（智慧风电监管平台）文档工厂。
 *
 * <p>源文件来自 three-screen-lab {@code src/screens/wind}，?raw 原样装载、
 * 逐字节保留；拼装规则见 {@link assembleScreen}。</p>
 *
 * @since 4.0.0.52
 */
import { assembleScreen } from "../lib/assemble";
import { POPULATION_HEADER_STYLE, RELIEF_EXTENT, geo, kernel, licenses } from "../lib/assets";

import template from "../assets/screens/wind/template.html?raw";
import stylesCss from "../assets/screens/wind/styles.css?raw";
import appJs from "../assets/screens/wind/app.js?raw";
import modelJs from "../assets/screens/wind/model.js?raw";
import dataJs from "../assets/screens/wind/data.js?raw";

/** 拼装 wind 屏完整 HTML 文档 */
export function buildWind(): string {
  return assembleScreen({
    id: "wind",
    kind: "wind",
    files: { template, stylesCss, appJs, modelJs, dataJs },
    kernel,
    geo,
    urls: {},
    reliefExtent: RELIEF_EXTENT,
    populationHeaderStyle: POPULATION_HEADER_STYLE,
    licenses,
  });
}
