/**
 * global store（@repo/pinia）—— 全局布局 / 主题 / 交互状态
 *
 * 迁移自 koi/stores/modules/global.ts，通用化供任何主题复用。
 *
 * 持久化 key 由 @repo/config.getStorageKey("global") 统一加前缀，
 * 避免不同 app 在同域名下串数据。
 */
import { defineStore } from "pinia";
import { DEFAULT_THEME } from "@repo/config";
import { getFrameworkStorage } from "@repo/utils";

/** 一次性迁移标记：历史默认布局为 group，系统默认导航应为垂直(vertical) */
const LAYOUT_DEFAULT_MIGRATION_KEY = "layout-default-vertical-v1";

/**
 * 一次性迁移标记：标签栏恢复显示。
 *
 * 标签栏显隐原先没有默认值收敛，历史版本里 `isTabsShown=false` 一旦落盘就永久生效，
 * 用户看到的是「顶部标签栏默认不显示、也不常显」，且设置面板外没有任何提示。
 * 这里只在首次遇到该标记时把值纠正为 true，之后用户手动关闭照常持久化。
 */
const TABS_SHOWN_MIGRATION_KEY = "tabs-shown-default-on-v1";

const globalStore = defineStore("global", {
  persist: {
    key: "global",
    afterHydrate: (ctx) => {
      // 首启动时把旧的默认值 group 纠正为 vertical（用户后续手动切换仍会持久化生效）
      try {
        const storage = getFrameworkStorage();
        if (!storage.get(LAYOUT_DEFAULT_MIGRATION_KEY)) {
          ctx.store.layout = "vertical";
          storage.set(LAYOUT_DEFAULT_MIGRATION_KEY, true);
        }
        // 标签栏：历史残留的 false 纠正回 true，只做一次
        if (!storage.get(TABS_SHOWN_MIGRATION_KEY)) {
          ctx.store.isTabsShown = true;
          storage.set(TABS_SHOWN_MIGRATION_KEY, true);
        }
      } catch {
        // 迁移失败忽略：保留已存布局值，不影响功能
      }
    },
  },
  state: () => {
    return {
      isFullScreen: false,
      isCollapse: false,
      isColumnFirstCollapse: false,
      menuWidth: 220,
      isDark: false,
      /** 主题模式：light=明亮 / dark=黑暗 / auto=跟随系统 */
      themeMode: "light",
      dimension: "default",
      maximize: false,
      language: "zh",
      themeColor: DEFAULT_THEME,
      layout: "vertical",
      tabsStyle: "google",
      transition: "none",
      /** 登录页样式，取值见 themes/koi/views/login/loginStyles.ts 的 loginStyleOptions */
      loginStyle: "default",
      uniqueOpened: true,
      isGrey: false,
      isWeak: false,
      asideInverted: false,
      headerInverted: false,
      isHeaderShown: true,
      isTabsShown: true,
      /** 路由骨架屏上的小动物：关闭后骨架只留静态占位 */
      isSkeletonCritterShown: true,
      /** 骨架小动物形象：bird=小鸟（跳）/ panda=小熊猫（上下爬） */
      skeletonCritterAnimal: "bird" as "bird" | "panda",
      // ===== 多标签页栏的用户偏好 =====
      // undefined = 跟随 app.yaml 的 other.tabsBar（部署侧默认值），
      // 用户在主题配置里改过才落盘 —— 换部署配置时未改过的项自动跟着变。
      /** 未激活页签置灰 */
      tabsInactiveDimmed: undefined as boolean | undefined,
      /** 页签最小宽度（px） */
      tabsMinWidth: undefined as number | undefined,
      /** 滚轮切换页签 */
      tabsWheelSwitch: undefined as boolean | undefined,
      /** 未激活页签自动休眠 */
      tabsSleepEnabled: undefined as boolean | undefined,
      /** 休眠延迟（毫秒） */
      tabsSleepDelay: undefined as number | undefined,
      /** 悬浮显示页签内存占用 */
      tabsMemoryTip: undefined as boolean | undefined,
    };
  },
  actions: {
    setGlobalState(...args: any) {
      this.$patch({ [args[0]]: args[1] });
    },
    setCollapse(value: boolean) {
      this.isCollapse = value;
      return this.isCollapse;
    },
    setColumnFirstCollapse(value: boolean) {
      this.isColumnFirstCollapse = value;
      return this.isColumnFirstCollapse;
    },
    setMenuWidth(value: number) {
      this.menuWidth = value;
      return this.menuWidth;
    },
    setDimension(value: string) {
      this.dimension = value;
    },
  },
  getters: {},
});

export default globalStore;
