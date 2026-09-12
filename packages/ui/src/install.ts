/**
 * ui 组件按需安装
 *
 * 主入口不自动注册组件，需要安装时显式调用 installUi。
 * 每个组件按需注册，未被传入的组件不会被打包。
 */
import type { App, Plugin } from "vue";
import type { ThemedComponent } from "./theme";
import { log } from "@repo/utils";

/** 安装选项：需要注册的组件（默认空，全部按需传入） */
export interface UiInstallOptions {
  /** 需要注册的 Re 组件列表，如 ["ReText", "ReButton"] */
  components?: string[];
  /** 额外插件 */
  plugins?: Plugin[];
}

/** 已注册组件缓存，避免重复注册 */
const registered = new Set<string>();

/** 组件注册表：懒加载映射，import 时才会加载对应子模块 */
const componentLoaders: Record<string, () => Promise<{ install: unknown }>> = {
  ReText: () => import("./components/ReText"),
  ReButton: () => import("./components/ReButton"),
  ReInput: () => import("./components/ReInput"),
  ReInputNumber: () => import("./components/ReInputNumber"),
  ReSelect: () => import("./components/ReSelect"),
  ReDatePicker: () => import("./components/ReDatePicker"),
  ReForm: () => import("./components/ReForm"),
  ReTree: () => import("./components/ReTree"),
  ReTimeline: () => import("./components/ReTimeline"),
  ReAlbum: () => import("./components/ReAlbum"),
  ReCard: () => import("./components/ReCard"),
  ReDialog: () => import("./components/ReDialog"),
  ReTable: () => import("./components/ReTable"),
  ReTag: () => import("./components/ReTag"),
  ReBadge: () => import("./components/ReBadge"),
  ReIcon: () => import("./components/ReIcon"),
  ReIp: () => import("./components/ReIp"),
  ReTime: () => import("./components/ReTime"),
  ReIconSelect: () => import("./components/ReIconSelect"),
  ReScrollNav: () => import("./components/ReScrollNav"),
  ReSearch: () => import("./components/ReSearch"),
  ReTagFilter: () => import("./components/ReTagFilter"),
  ReLoading: () => import("./components/ReLoading"),
  ReDrawer: () => import("./components/ReDrawer"),
  ReSeamlessScroll: () => import("./components/ReSeamlessScroll"),
  ReStatusIndicator: () => import("./components/ReStatusIndicator"),
  ReStatCard: () => import("./components/ReStatCard"),
  ReSectionHead: () => import("./components/ReSectionHead"),
  ReTrend: () => import("./components/ReTrend"),
  ReGraph: () => import("./components/ReGraph"),
  ReGraphForce: () => import("./components/ReGraphForce"),
  ReGraphMind: () => import("./components/ReGraphMind"),
  ReGraphTree: () => import("./components/ReGraphTree"),
  ReGraphCircle: () => import("./components/ReGraphCircle"),
  ReGraphCenter: () => import("./components/ReGraphCenter"),
  ReGraphFixed: () => import("./components/ReGraphFixed"),
  ReGraphRelation: () => import("./components/ReGraphRelation"),
  ReEcharts: () => import("./components/ReEcharts"),
  ReCropper: () => import("./components/ReCropper"),
  ReCode: () => import("./components/ReCode"),
  ReScrollbar: () => import("./components/ReScrollbar"),
  ReLazy: () => import("./components/ReLazy"),
  ReCountup: () => import("./components/ReCountup"),
  ReImageCompare: () => import("./components/ReImageCompare"),
  ReImage: () => import("./components/ReImage"),
  ReImageGroup: () => import("./components/ReImageGroup"),
  ReTypeIt: () => import("./components/ReTypeIt"),
  ReChat: () => import("./components/ReChat"),
  ReAvatarCrop: () => import("./components/ReAvatarCrop"),
  ReUpload: () => import("./components/ReUpload"),
  ReUploadChunk: () => import("./components/ReUploadChunk"),
  ReStat: () => import("./components/ReStat"),
  ReCarousel: () => import("./components/ReCarousel"),
  ReBreadcrumb: () => import("./components/ReBreadcrumb"),
  ReFilePicker: () => import("./components/ReFilePicker"),
  ReRagManager: () => import("./components/ReRagManager"),
  ReRagChat: () => import("./components/ReRagChat"),
  ReImageGen: () => import("./components/ReImageGen"),
  ReVideoGen: () => import("./components/ReVideoGen"),
  ReColorize: () => import("./components/ReColorize"),
  ReStationMessage: () => import("./components/ReStationMessage"),
  ReTab: () => import("./components/ReTab"),
  ReSwitch: () => import("./components/ReSwitch"),
  ReCron: () => import("./components/ReCron"),
  ReEmpty: () => import("./components/ReEmpty"),
  ReEmptyState: () => import("./components/ReEmptyState"),
  ReSkeleton: () => import("./components/ReSkeleton"),
  RePagination: () => import("./components/RePagination"),
  ReRibbon: () => import("./components/ReRibbon"),
  ReFilter: () => import("./components/ReFilter"),
  ReProgress: () => import("./components/ReProgress"),
  ReRemoteSelect: () => import("./components/ReRemoteSelect"),
  ReAvatar3D: () => import("./components/ReAvatar3D"),
  ReClineCharacter: () => import("./components/ReClineCharacter"),
  ReThree: () => import("./components/ReThree"),
  ReMap3D: () => import("./components/ReMap3D"),
  ReCanvasUi: () => import("./components/ReCanvasUi"),
  ReKit: () => import("./components/ReKit"),
};

/**
 * 按需安装组件
 * 未在 components 中声明的组件不会被 import，保证打包时被 tree-shaking 掉。
 */
export async function installUi(
  app: App,
  options: UiInstallOptions = {},
): Promise<void> {
  const { components = [], plugins = [] } = options;
  for (const name of components) {
    if (registered.has(name)) continue;
    const loader = componentLoaders[name];
    if (!loader) {
      log.warn(`[ui] 未找到组件 ${name}`);
      continue;
    }
    try {
      const mod = await loader();
      const plugin = mod.install;
      // 主题化组件 install 为 { install(app) => Promise }，await 其完成以保证组件已注册；
      // 普通组件 install 为 Plugin 对象，走 app.use 注册。
      if (plugin && typeof (plugin as ThemedComponent).install === "function") {
        await (plugin as ThemedComponent).install(app);
      } else {
        app.use(plugin as Plugin);
      }
      registered.add(name);
    } catch (e) {
      log.warn(`[ui] 组件 ${name} 加载失败`, e);
    }
  }
  for (const plugin of plugins) {
    app.use(plugin);
  }
}
