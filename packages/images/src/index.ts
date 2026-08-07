/**
 * @repo/images —— 业务图片资源包（按需打包）
 *
 * 本包只承担"图片仓库"职责：
 *   - 不导出可执行代码
 *   - 不强制注册 / 不强制安装
 *   - 不使用 import.meta.glob eager 一次性把目录吃进产物
 *
 * 使用方式（Vite/Rollup 友好的具名 import）：
 *   import productHero from "@repo/images/product/hero.png";
 *   import logoSvg from "@repo/images/brand/logo.svg";
 *
 * 效果：只有真正被 import 的图片会进入最终产物，未引用的图片完全不会被打包。
 *
 * 目录约定（按业务域划分，便于检索；不强制）：
 *   product/      产品宣传图、banner、占位插画
 *   illustration/ 通用插画、装饰
 *   brand/        品牌资产（logo、品牌色块、合规标识）
 *   icon/         业务图标（非 SVG sprite，单独 png/webp 文件）
 *
 * 文件格式建议：优先 webp / avif；位图控制在 200KB 以内；超过 1MB 的资源应放 CDN 而非仓库。
 */
export {};
