// 字体加密入口模块
// 说明：
// - main.ts 中只需导入本模块即可完成字体注册：import "@repo/font-encryption";
// - 内部会在多个加密字体中随机选择两个，映射为固定且普通的字体名称
// - 具体加密实现由 font-cloak 与 @repo/codec-wasm 提供，本模块只负责字体注册

import primaryDefaultUrl from "@repo/assets/fonts/font-cloak-default.woff2";
import primaryVariantAUrl from "@repo/assets/fonts/font-cloak-variant-a.woff2";
import primaryVariantBUrl from "@repo/assets/fonts/font-cloak-variant-b.woff2";

/** 主字体名称（对外固定且看起来普通） */
export const PRIMARY_FONT_FAMILY = "AppTextPrimary";

/** 备用字体名称（对外固定且看起来普通） */
export const SECONDARY_FONT_FAMILY = "AppTextSecondary";

interface EncryptedFontVariant {
  id: string;
  url: string;
}

const FONT_VARIANTS: EncryptedFontVariant[] = [
  { id: "default", url: primaryDefaultUrl },
  { id: "variant-a", url: primaryVariantAUrl },
  { id: "variant-b", url: primaryVariantBUrl },
];

let initialized = false;

/**
 * 从可用字体列表中随机选择两个不同的变体
 */
function pickTwoRandomVariants(): [EncryptedFontVariant, EncryptedFontVariant] {
  if (FONT_VARIANTS.length < 2) {
    // 理论上不会发生，兜底返回前两个
    return [FONT_VARIANTS[0]!, FONT_VARIANTS[1]!];
  }

  const indices = FONT_VARIANTS.map((_, index) => index);
  for (let i = indices.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = indices[i];
    indices[i] = indices[j]!;
    indices[j] = temp!;
  }

  const first = FONT_VARIANTS[indices[0]!];
  const second = FONT_VARIANTS[indices[1]!];

  return [first, second];
}

/**
 * 注册加密字体
 * - 在多个加密字体中随机挑选两个
 * - 分别注册为 AppTextPrimary 与 AppTextSecondary
 * - main.ts 只需在应用启动前调用一次
 */
export async function registerEncryptedFonts(): Promise<void> {
  if (initialized) {
    return;
  }

  if (typeof window === "undefined" || typeof document === "undefined") {
    // 非浏览器环境无需处理
    return;
  }

  if (!("fonts" in document) || typeof (window as any).FontFace !== "function") {
    // 运行环境不支持 FontFace API 时直接跳过，仅依赖默认系统字体
    initialized = true;
    return;
  }

  initialized = true;

  try {
    const [first, second] = pickTwoRandomVariants();

    const FontFaceCtor = (window as any).FontFace as typeof FontFace;

    const primaryFace = new FontFaceCtor(
      PRIMARY_FONT_FAMILY,
      `url(${first.url}) format("woff2")`,
      {
        style: "normal",
        weight: "400",
        display: "swap",
      },
    );

    const secondaryFace = new FontFaceCtor(
      SECONDARY_FONT_FAMILY,
      `url(${second.url}) format("woff2")`,
      {
        style: "normal",
        weight: "400",
        display: "swap",
      },
    );

    await Promise.all([
      primaryFace.load(),
      secondaryFace.load(),
    ]);

    document.fonts.add(primaryFace);
    document.fonts.add(secondaryFace);
  } catch (error) {
    // 字体注册失败时仅记录日志，不阻断应用
    console.warn("[font-encryption] 注册加密字体失败:", error);
  }
}

// 默认在模块导入时执行一次注册，确保使用方便
void registerEncryptedFonts();
