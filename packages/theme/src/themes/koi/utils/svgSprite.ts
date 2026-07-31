/**
 * koi SVG sprite 注入
 *
 * koi 的图标（KoiSvgIcon / KoiGlobalIcon）通过 <use xlink:href="#icon-koi-xxx">
 * 引用全局 SVG symbol，因此需要把 assets/icons 下的全部 svg 合并成一个
 * display:none 的 sprite 注入 <body>。
 *
 * 注意：依赖 import.meta.glob（eager + ?raw），由 Vite 打包为内联文本，
 * 构建产物中不额外产生文件请求。
 */

const iconModules = import.meta.glob("../assets/icons/*.svg", {
  eager: true,
  query: "?raw",
  import: "default",
}) as Record<string, string>;

let injected = false;

/** 注入 koi SVG sprite（幂等，只注入一次） */
export function setupKoiSvgSprite(): void {
  if (injected || typeof document === "undefined") {
    return;
  }
  injected = true;

  const symbols = Object.keys(iconModules)
    .map((path) => {
      const fileName = path.split("/").pop() ?? "";
      // koi-xxx.svg -> symbol id: icon-koi-xxx
      const symbolId = `icon-${fileName.replace(/\.svg$/, "")}`;
      return svgToSymbol(symbolId, iconModules[path]);
    })
    .join("");

  const sprite = document.createElement("div");
  sprite.style.display = "none";
  sprite.style.position = "absolute";
  sprite.setAttribute("aria-hidden", "true");
  sprite.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">${symbols}</svg>`;
  document.body.appendChild(sprite);
}

/** 把单个 svg 文件内容转为 <symbol> */
function svgToSymbol(symbolId: string, svgContent: string): string {
  // 提取 viewBox，缺省 0 0 24 24
  const viewBox = svgContent.match(/viewBox="([^"]*)"/)?.[1] ?? "0 0 24 24";
  // 去掉外层 <svg ...> 与 </svg>
  const inner = svgContent
    .replace(/^<svg[^>]*>/i, "")
    .replace(/<\/svg>\s*$/i, "");
  return `<symbol id="${symbolId}" viewBox="${viewBox}">${inner}</symbol>`;
}
