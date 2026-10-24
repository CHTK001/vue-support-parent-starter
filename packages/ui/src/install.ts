/**
 * ui 组件按需安装
 *
 * 主入口不自动注册组件，需要安装时显式调用 installUi。
 * 每个组件按需注册，未被传入的组件不会被打包。
 */
import type { App, Plugin } from "vue";
import type { ThemedComponent } from "./theme";
import { log } from "@repo/utils";
import { resolveUiPreset } from "./presets";

/** 安装选项：需要注册的组件（默认空，全部按需传入） */
export interface UiInstallOptions {
  /** 需要注册的 Re 组件列表，如 ["ReText", "ReButton"] */
  components?: string[];
  /** 额外插件 */
  plugins?: Plugin[];
  /**
   * 组件预设名（如 {@code "monitor"}）—— 由组件库内部维护的成组组件清单。
   *
   * <p>与 {@link components} 可同时使用：preset 先展开，components 后追加。</p>
   */
  preset?: string;
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
  ReIpText: () => import("./components/ReIpText"),
  ReTime: () => import("./components/ReTime"),
  ReIconSelect: () => import("./components/ReIconSelect"),
  ReScrollNav: () => import("./components/ReScrollNav"),
  ReSearch: () => import("./components/ReSearch"),
  ReRichText: () => import("./components/ReRichText"),
  ReTagFilter: () => import("./components/ReTagFilter"),
  ReLoading: () => import("./components/ReLoading"),
  ReLoader: () => import("./components/ReLoader"),
  ReDrawer: () => import("./components/ReDrawer"),
  ReSeamlessScroll: () => import("./components/ReSeamlessScroll"),
  ReStatusIndicator: () => import("./components/ReStatusIndicator"),
  ReStatCard: () => import("./components/ReStatCard"),
  ReStatsCard: () => import("./components/ReStatsCard"),
  ReSectionHead: () => import("./components/ReSectionHead"),
  ReTrend: () => import("./components/ReTrend"),
  ReGraph: () => import("./components/ReGraph"),
  ReGraphForce: () => import("./components/ReGraphForce"),
  ReGraphMind: () => import("./components/ReGraphMind"),
  ReGraphTree: () => import("./components/ReGraphTree"),
  ReGraphCircle: () => import("./components/ReGraphCircle"),
  ReGraphCenter: () => import("./components/ReGraphCenter"),
  ReGraphFixed: () => import("./components/ReGraphFixed"),
  /* ReGraph3D 此前只有组件本体而没有 loader：目录、index.ts、default/koi 两套主题都在，
     唯独这里漏了一行。后果是演示站按名字注册时走 `log.warn("[ui] 未找到组件 ReGraph3D")`
     并被跳过，预览渲染成同名未知元素（<regraph3d>），而 log.warn 走 console.log，
     控制台里连 warning 都不明显 —— 属静默失败。 */
  ReGraph3D: () => import("./components/ReGraph3D"),
  ReFlowGraph: () => import("./components/ReFlowGraph"),
  ReChart: () => import("./components/ReChart"),
  ReEcharts: () => import("./components/ReEcharts"),
  ReCropper: () => import("./components/ReCropper"),
  ReCode: () => import("./components/ReCode"),
  ReScrollbar: () => import("./components/ReScrollbar"),
  ReLazy: () => import("./components/ReLazy"),
  ReAsync: () => import("./components/ReAsync"),
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
  ReProcessTask: () => import("./components/ReProcessTask"),
  ReRemoteSelect: () => import("./components/ReRemoteSelect"),
  ReAvatar3D: () => import("./components/ReAvatar3D"),
  ReClineCharacter: () => import("./components/ReClineCharacter"),
  ReThree: () => import("./components/ReThree"),
  ReMap3D: () => import("./components/ReMap3D"),
  ReCanvasUi: () => import("./components/ReCanvasUi"),
  ReKit: () => import("./components/ReKit"),
  ReCommand: () => import("./components/ReCommand"),
};

/**
 * 按需安装组件
 * 未在 components / preset 中声明的组件不会被 import，保证打包时被 tree-shaking 掉。
 */
export async function installUi(
  app: App,
  options: UiInstallOptions = {},
): Promise<void> {
  const { components = [], plugins = [], preset } = options;
  // preset 先展开（组件库维护的成组清单），components 后追加（宿主临时补单个组件）。
  const presetComponents = preset ? [...resolveUiPreset(preset)] : [];
  for (const name of [...presetComponents, ...components]) {
    if (registered.has(name)) continue;
    const loader = componentLoaders[name];
    if (!loader) {
      log.warn(`[ui] 未找到组件 ${name}`);
      continue;
    }
    // 主题安装器（koi）会先注册 ReIcon / ReScrollNav / ReDrawer —— 它们不走本模块的
    // installUi，registered 集合里查不到。若 preset 恰好也列了这些组件，
    // app.component 会二次注册同名组件，Vue 在生产期打「has already been registered」告警。
    // 这里以「app 上是否已存在同名全局组件」为准再兜一层。
    if (app.component(name)) {
      registered.add(name);
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
