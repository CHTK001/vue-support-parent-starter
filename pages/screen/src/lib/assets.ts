/**
 * 大屏模块静态资产统一入口。
 *
 * <p>URL 一律经 {@code import.meta.glob(?url)} 在构建期解析成带 base 的地址 ——
 * 屏幕文档以 iframe srcdoc 承载，srcdoc 没有基准 URL，相对地址全部失效，
 * 因此注入文档的图片/贴图地址必须是绝对 URL。</p>
 *
 * <p>文本资产（内核脚本、屏源码、压缩 geo、许可文本）用 {@code ?raw} 原样装载，
 * 与 three-screen-lab 的源文件逐字节一致。</p>
 *
 * @since 4.0.0.52
 */
import d3Src from "../assets/vendor/d3.min.js?raw";
import threeSrc from "../assets/vendor/three.min.js?raw";
import runtimeSrc from "../assets/shared/runtime.js?raw";
import observatoryCss from "../assets/shared/observatory.css?raw";
import observatoryJs from "../assets/shared/observatory.js?raw";
import observatoryScene from "../assets/shared/observatory-scene.js?raw";
import observatoryHeader from "../assets/shared/observatory-header.js?raw";
import astraGeometry from "../assets/shared/astra-geometry.js?raw";

import licenseRoot from "../assets/licenses/LICENSE?raw";
import licenseThree from "../assets/licenses/three-MIT.txt?raw";
import licenseD3 from "../assets/licenses/d3-ISC.txt?raw";
import licenseNaturalEarth from "../assets/licenses/natural-earth-PUBLIC-DOMAIN.txt?raw";
import licenseAstra from "../assets/licenses/astra-owner-permission.txt?raw";

import chinaGeo from "../assets/geo/china.compact.json?raw";
import chinaOutlineGeo from "../assets/geo/china-outline.compact.json?raw";
import countriesGeo from "../assets/geo/countries.compact.json?raw";

import type { LicenseTexts, SharedKernel } from "./assemble";

/** 共享内核 + vendor 文本 */
export const kernel: SharedKernel = {
  d3: d3Src,
  three: threeSrc,
  runtime: runtimeSrc,
  observatoryCss,
  observatoryJs,
  observatoryScene,
  observatoryHeader,
  astraGeometry,
};

/** 版权声明文本（finish 注入用） */
export const licenses: LicenseTexts = {
  root: licenseRoot,
  three: licenseThree,
  d3: licenseD3,
  naturalEarth: licenseNaturalEarth,
  astra: licenseAstra,
};

/** 压缩 geo 文本（buildlib.compact_geo 产物） */
export const geo = {
  china: chinaGeo,
  outline: chinaOutlineGeo,
  world: countriesGeo,
};

const urlMaps: Record<string, string>[] = [
  import.meta.glob<string>("../assets/derived/*.webp", { eager: true, query: "?url", import: "default" }),
  import.meta.glob<string>("../assets/previews/*.webp", { eager: true, query: "?url", import: "default" }),
  import.meta.glob<string>("../assets/textures/*.png", { eager: true, query: "?url", import: "default" }),
];

/**
 * 取静态资产的绝对 URL。
 *
 * @param relative 相对 {@code src/assets} 的路径，如 {@code "derived/earth-day.webp"}
 */
export function assetUrl(relative: string): string {
  const key = `../assets/${relative}`;
  for (const map of urlMaps) {
    const hit = map[key];
    if (hit) return hit;
  }
  throw new Error(`[bigscreen] 缺少静态资产: ${relative}`);
}

/**
 * inspection 地形范围 —— buildlib 的 json.dumps(relief-metadata.extent) 原文。
 * 由 Python 预计算入库（含 Python 的 json spacing），勿在 JS 侧重算。
 */
export const RELIEF_EXTENT =
  '{"xmin": 2666594.4689710406, "ymin": -780454.0691041537, "xmax": 20675451.880735748, "ymax": 10306248.775013495, "spatialReference": {"wkid": 3857}}';

/**
 * population 头图定位 CSS —— 由头图 alpha bbox 预计算（buildlib 同公式），
 * 拼装时写进 `<header class="population-header" style="...">`。
 */
export const POPULATION_HEADER_STYLE = "--header-art-top:-189.89px;--header-art-height:505.65px;";
