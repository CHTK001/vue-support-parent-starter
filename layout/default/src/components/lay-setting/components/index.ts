/**
 * 系统设置组件注册中心
 * @description 支持主题特定的组件覆盖
 */

// 基础组件
export { default as OverallStyleSetting } from "./base/OverallStyleSetting.vue";
export { default as ThemeColorSetting } from "./base/ThemeColorSetting.vue";
export { default as ThemeAnimationSetting } from "./base/ThemeAnimationSetting.vue";
export { default as ThemeSkinSetting } from "./base/ThemeSkinSetting.vue";
export { default as AiChatSkinSetting } from "./base/AiChatSkinSetting.vue";
export { default as AiChatFunctionSetting } from "./base/AiChatFunctionSetting.vue";
export { default as LayoutModeSetting } from "./base/LayoutModeSetting.vue";
export { default as MobileNavSetting } from "./base/MobileNavSetting.vue";
export { default as DoubleNavSetting } from "./base/DoubleNavSetting.vue";
export { default as PageStretchSetting } from "./base/PageStretchSetting.vue";
export { default as LayoutParamsSetting } from "./base/LayoutParamsSetting.vue";
export { default as TagsStyleSetting } from "./base/TagsStyleSetting.vue";
export { default as InterfaceDisplaySetting } from "./base/InterfaceDisplaySetting.vue";
export { default as MenuSetting } from "./base/MenuSetting.vue";
export { default as AdvancedSetting } from "./base/AdvancedSetting.vue";

// 主题特定组件（Pixel Art）
export { default as PixelArtOverallStyleSetting } from "./themes/pixel-art/OverallStyleSetting.vue";
export { default as PixelArtThemeColorSetting } from "./themes/pixel-art/ThemeColorSetting.vue";
export { default as PixelArtThemeAnimationSetting } from "./themes/pixel-art/ThemeAnimationSetting.vue";
export { default as PixelArtThemeSkinSetting } from "./themes/pixel-art/ThemeSkinSetting.vue";
export { default as PixelArtAiChatSkinSetting } from "./themes/pixel-art/AiChatSkinSetting.vue";
export { default as PixelArtAiChatFunctionSetting } from "./themes/pixel-art/AiChatFunctionSetting.vue";
export { default as PixelArtLayoutModeSetting } from "./themes/pixel-art/LayoutModeSetting.vue";
export { default as PixelArtMobileNavSetting } from "./themes/pixel-art/MobileNavSetting.vue";
export { default as PixelArtDoubleNavSetting } from "./themes/pixel-art/DoubleNavSetting.vue";
export { default as PixelArtPageStretchSetting } from "./themes/pixel-art/PageStretchSetting.vue";
export { default as PixelArtLayoutParamsSetting } from "./themes/pixel-art/LayoutParamsSetting.vue";
export { default as PixelArtTagsStyleSetting } from "./themes/pixel-art/TagsStyleSetting.vue";
export { default as PixelArtInterfaceDisplaySetting } from "./themes/pixel-art/InterfaceDisplaySetting.vue";
export { default as PixelArtMenuSetting } from "./themes/pixel-art/MenuSetting.vue";
export { default as PixelArtAdvancedSetting } from "./themes/pixel-art/AdvancedSetting.vue";

/**
 * 组件映射类型
 */
export interface ComponentMap {
  OverallStyleSetting: any;
  ThemeColorSetting: any;
  ThemeAnimationSetting: any;
  ThemeSkinSetting: any;
  AiChatSkinSetting: any;
  AiChatFunctionSetting: any;
  LayoutModeSetting: any;
  MobileNavSetting: any;
  DoubleNavSetting: any;
  PageStretchSetting: any;
  LayoutParamsSetting: any;
  TagsStyleSetting: any;
  InterfaceDisplaySetting: any;
  MenuSetting: any;
  AdvancedSetting: any;
}

/**
 * 获取主题特定的组件映射
 * @param theme 主题名称
 * @returns 组件映射对象
 */
export function getThemeComponents(theme: string): ComponentMap {
  // 主题组件映射表
  const themeMap: Record<string, string> = {
    "pixel-art": "pixel-art",
    "spring-festival": "spring-festival",
    "halloween": "halloween",
    "mid-autumn": "mid-autumn",
    "christmas": "christmas",
    "new-year": "new-year",
    "future-tech": "future-tech",
  };

  // 如果主题有特定的组件目录，使用主题组件
  if (themeMap[theme]) {
    const themePath = themeMap[theme];
    return {
      OverallStyleSetting: () => import(`./themes/${themePath}/OverallStyleSetting.vue`),
      ThemeColorSetting: () => import(`./themes/${themePath}/ThemeColorSetting.vue`),
      ThemeAnimationSetting: () => import(`./themes/${themePath}/ThemeAnimationSetting.vue`),
      ThemeSkinSetting: () => import(`./themes/${themePath}/ThemeSkinSetting.vue`),
      AiChatSkinSetting: () => import(`./themes/${themePath}/AiChatSkinSetting.vue`),
      AiChatFunctionSetting: () => import(`./themes/${themePath}/AiChatFunctionSetting.vue`),
      LayoutModeSetting: () => import(`./themes/${themePath}/LayoutModeSetting.vue`),
      MobileNavSetting: () => import(`./themes/${themePath}/MobileNavSetting.vue`),
      DoubleNavSetting: () => import(`./themes/${themePath}/DoubleNavSetting.vue`),
      PageStretchSetting: () => import(`./themes/${themePath}/PageStretchSetting.vue`),
      LayoutParamsSetting: () => import(`./themes/${themePath}/LayoutParamsSetting.vue`),
      TagsStyleSetting: () => import(`./themes/${themePath}/TagsStyleSetting.vue`),
      InterfaceDisplaySetting: () => import(`./themes/${themePath}/InterfaceDisplaySetting.vue`),
      MenuSetting: () => import(`./themes/${themePath}/MenuSetting.vue`),
      AdvancedSetting: () => import(`./themes/${themePath}/AdvancedSetting.vue`),
    };
  }

  // 默认返回基础组件
  return {
    OverallStyleSetting: () => import("./base/OverallStyleSetting.vue"),
    ThemeColorSetting: () => import("./base/ThemeColorSetting.vue"),
    ThemeAnimationSetting: () => import("./base/ThemeAnimationSetting.vue"),
    ThemeSkinSetting: () => import("./base/ThemeSkinSetting.vue"),
    AiChatSkinSetting: () => import("./base/AiChatSkinSetting.vue"),
    AiChatFunctionSetting: () => import("./base/AiChatFunctionSetting.vue"),
    LayoutModeSetting: () => import("./base/LayoutModeSetting.vue"),
    MobileNavSetting: () => import("./base/MobileNavSetting.vue"),
    DoubleNavSetting: () => import("./base/DoubleNavSetting.vue"),
    PageStretchSetting: () => import("./base/PageStretchSetting.vue"),
    LayoutParamsSetting: () => import("./base/LayoutParamsSetting.vue"),
    TagsStyleSetting: () => import("./base/TagsStyleSetting.vue"),
    InterfaceDisplaySetting: () => import("./base/InterfaceDisplaySetting.vue"),
    MenuSetting: () => import("./base/MenuSetting.vue"),
    AdvancedSetting: () => import("./base/AdvancedSetting.vue"),
  };
}
