/**
 * 系统设置主题组件注册中心
 * 按主题装配真实分区组件，缺失部分回退基础实现。
 */
import SettingAdvanced from "../themes/components/SettingAdvanced.vue";
import SettingAiChat from "../themes/components/SettingAiChat.vue";
import SettingDisplay from "../themes/components/SettingDisplay.vue";
import SettingLayout from "../themes/components/SettingLayout.vue";
import SettingMenu from "../themes/components/SettingMenu.vue";
import SettingMessage from "../themes/components/SettingMessage.vue";
import SettingTabs from "../themes/components/SettingTabs.vue";
import SettingTheme from "../themes/components/SettingTheme.vue";
import SettingToolbar from "../themes/components/SettingToolbar.vue";

import DefaultSettingLayout from "./sections/default/SettingLayout.vue";
import DefaultSettingMenu from "./sections/default/SettingMenu.vue";
import DefaultSettingAdvanced from "./sections/default/SettingAdvanced.vue";
import DefaultSettingAiChat from "./sections/default/SettingAiChat.vue";
import DefaultSettingDisplay from "./sections/default/SettingDisplay.vue";
import DefaultSettingMessage from "./sections/default/SettingMessage.vue";
import DefaultSettingTabs from "./sections/default/SettingTabs.vue";
import DefaultSettingTheme from "./sections/default/SettingTheme.vue";
import DefaultSettingToolbar from "./sections/default/SettingToolbar.vue";

import EightBitSettingLayout from "./sections/8bit/SettingLayout.vue";
import EightBitSettingMenu from "./sections/8bit/SettingMenu.vue";
import EightBitSettingAdvanced from "./sections/8bit/SettingAdvanced.vue";
import EightBitSettingAiChat from "./sections/8bit/SettingAiChat.vue";
import EightBitSettingDisplay from "./sections/8bit/SettingDisplay.vue";
import EightBitSettingMessage from "./sections/8bit/SettingMessage.vue";
import EightBitSettingTabs from "./sections/8bit/SettingTabs.vue";
import EightBitSettingTheme from "./sections/8bit/SettingTheme.vue";
import EightBitSettingToolbar from "./sections/8bit/SettingToolbar.vue";

import SpringFestivalSettingLayout from "./sections/spring-festival/SettingLayout.vue";
import SpringFestivalSettingMenu from "./sections/spring-festival/SettingMenu.vue";
import SpringFestivalSettingAdvanced from "./sections/spring-festival/SettingAdvanced.vue";
import SpringFestivalSettingAiChat from "./sections/spring-festival/SettingAiChat.vue";
import SpringFestivalSettingDisplay from "./sections/spring-festival/SettingDisplay.vue";
import SpringFestivalSettingMessage from "./sections/spring-festival/SettingMessage.vue";
import SpringFestivalSettingTabs from "./sections/spring-festival/SettingTabs.vue";
import SpringFestivalSettingTheme from "./sections/spring-festival/SettingTheme.vue";
import SpringFestivalSettingToolbar from "./sections/spring-festival/SettingToolbar.vue";

import HalloweenSettingLayout from "./sections/halloween/SettingLayout.vue";
import HalloweenSettingMenu from "./sections/halloween/SettingMenu.vue";
import HalloweenSettingAdvanced from "./sections/halloween/SettingAdvanced.vue";
import HalloweenSettingAiChat from "./sections/halloween/SettingAiChat.vue";
import HalloweenSettingDisplay from "./sections/halloween/SettingDisplay.vue";
import HalloweenSettingMessage from "./sections/halloween/SettingMessage.vue";
import HalloweenSettingTabs from "./sections/halloween/SettingTabs.vue";
import HalloweenSettingTheme from "./sections/halloween/SettingTheme.vue";
import HalloweenSettingToolbar from "./sections/halloween/SettingToolbar.vue";

import ChristmasSettingLayout from "./sections/christmas/SettingLayout.vue";
import ChristmasSettingMenu from "./sections/christmas/SettingMenu.vue";
import ChristmasSettingAdvanced from "./sections/christmas/SettingAdvanced.vue";
import ChristmasSettingAiChat from "./sections/christmas/SettingAiChat.vue";
import ChristmasSettingDisplay from "./sections/christmas/SettingDisplay.vue";
import ChristmasSettingMessage from "./sections/christmas/SettingMessage.vue";
import ChristmasSettingTabs from "./sections/christmas/SettingTabs.vue";
import ChristmasSettingTheme from "./sections/christmas/SettingTheme.vue";
import ChristmasSettingToolbar from "./sections/christmas/SettingToolbar.vue";

import FutureTechSettingLayout from "./sections/future-tech/SettingLayout.vue";
import FutureTechSettingMenu from "./sections/future-tech/SettingMenu.vue";
import FutureTechSettingAdvanced from "./sections/future-tech/SettingAdvanced.vue";
import FutureTechSettingAiChat from "./sections/future-tech/SettingAiChat.vue";
import FutureTechSettingDisplay from "./sections/future-tech/SettingDisplay.vue";
import FutureTechSettingMessage from "./sections/future-tech/SettingMessage.vue";
import FutureTechSettingTabs from "./sections/future-tech/SettingTabs.vue";
import FutureTechSettingTheme from "./sections/future-tech/SettingTheme.vue";
import FutureTechSettingToolbar from "./sections/future-tech/SettingToolbar.vue";

export {
  SettingAdvanced,
  SettingAiChat,
  SettingDisplay,
  SettingLayout,
  SettingMenu,
  SettingMessage,
  SettingTabs,
  SettingTheme,
  SettingToolbar,
};

export interface ComponentMap {
  SettingTheme: any;
  SettingLayout: any;
  SettingTabs: any;
  SettingToolbar: any;
  SettingDisplay: any;
  SettingMenu: any;
  SettingMessage: any;
  SettingAiChat: any;
  SettingAdvanced: any;
}

export const supportedSettingThemes = [
  "default",
  "8bit",
  "spring-festival",
  "halloween",
  "christmas",
  "future-tech",
] as const;

type SupportedSettingTheme = (typeof supportedSettingThemes)[number];

const defaultComponentMap: ComponentMap = {
  SettingTheme,
  SettingLayout,
  SettingTabs,
  SettingToolbar,
  SettingDisplay,
  SettingMenu,
  SettingMessage,
  SettingAiChat,
  SettingAdvanced,
};

const themeSectionOverrides: Record<
  SupportedSettingTheme,
  Partial<ComponentMap>
> = {
  default: {
    SettingTheme: DefaultSettingTheme,
    SettingLayout: DefaultSettingLayout,
    SettingTabs: DefaultSettingTabs,
    SettingToolbar: DefaultSettingToolbar,
    SettingDisplay: DefaultSettingDisplay,
    SettingMenu: DefaultSettingMenu,
    SettingMessage: DefaultSettingMessage,
    SettingAiChat: DefaultSettingAiChat,
    SettingAdvanced: DefaultSettingAdvanced,
  },
  "8bit": {
    SettingTheme: EightBitSettingTheme,
    SettingLayout: EightBitSettingLayout,
    SettingTabs: EightBitSettingTabs,
    SettingToolbar: EightBitSettingToolbar,
    SettingDisplay: EightBitSettingDisplay,
    SettingMenu: EightBitSettingMenu,
    SettingMessage: EightBitSettingMessage,
    SettingAiChat: EightBitSettingAiChat,
    SettingAdvanced: EightBitSettingAdvanced,
  },
  "spring-festival": {
    SettingTheme: SpringFestivalSettingTheme,
    SettingLayout: SpringFestivalSettingLayout,
    SettingTabs: SpringFestivalSettingTabs,
    SettingToolbar: SpringFestivalSettingToolbar,
    SettingMenu: SpringFestivalSettingMenu,
    SettingDisplay: SpringFestivalSettingDisplay,
    SettingMessage: SpringFestivalSettingMessage,
    SettingAiChat: SpringFestivalSettingAiChat,
    SettingAdvanced: SpringFestivalSettingAdvanced,
  },
  halloween: {
    SettingTheme: HalloweenSettingTheme,
    SettingLayout: HalloweenSettingLayout,
    SettingTabs: HalloweenSettingTabs,
    SettingToolbar: HalloweenSettingToolbar,
    SettingMenu: HalloweenSettingMenu,
    SettingDisplay: HalloweenSettingDisplay,
    SettingMessage: HalloweenSettingMessage,
    SettingAiChat: HalloweenSettingAiChat,
    SettingAdvanced: HalloweenSettingAdvanced,
  },
  christmas: {
    SettingTheme: ChristmasSettingTheme,
    SettingLayout: ChristmasSettingLayout,
    SettingTabs: ChristmasSettingTabs,
    SettingToolbar: ChristmasSettingToolbar,
    SettingMenu: ChristmasSettingMenu,
    SettingDisplay: ChristmasSettingDisplay,
    SettingMessage: ChristmasSettingMessage,
    SettingAiChat: ChristmasSettingAiChat,
    SettingAdvanced: ChristmasSettingAdvanced,
  },
  "future-tech": {
    SettingTheme: FutureTechSettingTheme,
    SettingLayout: FutureTechSettingLayout,
    SettingTabs: FutureTechSettingTabs,
    SettingToolbar: FutureTechSettingToolbar,
    SettingMenu: FutureTechSettingMenu,
    SettingDisplay: FutureTechSettingDisplay,
    SettingMessage: FutureTechSettingMessage,
    SettingAiChat: FutureTechSettingAiChat,
    SettingAdvanced: FutureTechSettingAdvanced,
  },
};

const themeComponentMaps: Record<SupportedSettingTheme, ComponentMap> = {
  default: { ...defaultComponentMap, ...themeSectionOverrides.default },
  "8bit": { ...defaultComponentMap, ...themeSectionOverrides["8bit"] },
  "spring-festival": {
    ...defaultComponentMap,
    ...themeSectionOverrides["spring-festival"],
  },
  halloween: { ...defaultComponentMap, ...themeSectionOverrides.halloween },
  christmas: { ...defaultComponentMap, ...themeSectionOverrides.christmas },
  "future-tech": {
    ...defaultComponentMap,
    ...themeSectionOverrides["future-tech"],
  },
};

export function getThemeComponents(theme: string): ComponentMap {
  return themeComponentMaps[theme as SupportedSettingTheme] ?? defaultComponentMap;
}
