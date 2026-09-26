import ReTabMenu from "@repo/theme/koi/layouts/components/Tabs/components/ReTabMenu.vue";
import { resolveRouteMenuMeta } from "@repo/theme/koi/layouts/useLayoutTitle";
import { msgWarning, msgError } from "@repo/core";
import { getMenuLanguage } from "@repo/languages";
import { HOME_URL } from "@repo/config";
import useTabsStore from "@repo/pinia/modules/tabs";
import useAuthStore from "@repo/pinia/modules/auth";
import Sortable from "sortablejs";
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch, type Ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { log } from "@repo/utils";

/**
 * 布局标签栏共用逻辑（手写标签 + KoiScrollNav 横向滚动）
 * 风格由主题配置 globalStore.tabsStyle 控制（card | google | plain）
 */
export type LayoutTabsRefs = {
  tabMenuRef: Ref<InstanceType<typeof ReTabMenu> | null>;
  scrollNavRef: Ref<KoiScrollNavHandle | null>;
};

/** KoiScrollNav 暴露能力（结构类型，避免依赖 .vue 内部类型） */
export type KoiScrollNavHandle = {
  updateScrollState: () => void;
  scrollByDirection: (direction: "prev" | "next") => void;
  scrollToSelector: (selector: string) => void;
};

export function useLayoutTabs(
  getTrackEl: () => HTMLElement | null,
  refs: LayoutTabsRefs
) {
  const { t } = useI18n();
  const route = useRoute();
  const router = useRouter();
  const tabsStore = useTabsStore();
  const authStore = useAuthStore();

  const { tabMenuRef, scrollNavRef } = refs;

  const tabList = computed(() => tabsStore.getTabs);
  const activeTab = ref(route.path);

  const activeTabSelector = computed(() => {
    const index = tabList.value.findIndex((item: any) => item.path === activeTab.value);
    return index >= 0 ? `[data-tab-index="${index}"]` : "";
  });

  const getClosable = (item: any) => item.isAffix !== "1";

  const setActiveTab = () => {
    activeTab.value = route.path;
  };

  const initTabs = () => {
    authStore.menuList.forEach((item: any) => {
      if (item.meta.isAffix == "1" && item.meta.isVisible == "1") {
        tabsStore.addTab({
          icon: item.meta.icon,
          title: item.meta.title,
          path: item.path,
          name: item.name,
          isKeepAlive: item.meta.isKeepAlive,
          isAffix: "1"
        });
      }
    });
  };

  const addTab = () => {
    const { meta, path, fullPath } = route;
    // 只用路由path作为tab唯一标识，忽略url里的查询参数，避免带?v=xxx这类刷新参数时重复生成tab
    const existingTab = tabsStore.tabList.find((item: any) => item.path === path);
    const isAffixed = existingTab && existingTab.isAffix === "1";
    // 从菜单树补齐标题与图标（考虑 activeMenu + 路径前缀匹配）
    const menuMeta = resolveRouteMenuMeta(route, authStore.recursiveMenuList);
    // 标题优先级：路由有效 meta.title > 菜单 meta.title > 兜底空串（避免 undefined）
    const title = (meta.title && meta.title !== "home" ? meta.title : (menuMeta?.title ?? "")) as string;
    // home 占位符 "home" 未匹配到菜单时，使用默认翻译
    const resolvedTitle = title || (path === HOME_URL ? "menu.home.work.name" : title);
    const tab = {
      icon: meta.icon || menuMeta?.icon,
      title: resolvedTitle,
      path: path,
      name: route.name as string,
      isKeepAlive: route.meta.isKeepAlive,
      isAffix: isAffixed ? "1" : (route.meta.isAffix || "0")
    };
    if (path == HOME_URL) {
      tab.isAffix = "1";
    }
    // 已存在的旧标签（如持久化的 "home" 占位）补齐标题/图标，避免 addTab 直接跳过导致不更新
    if (existingTab) {
      existingTab.title = resolvedTitle;
      existingTab.icon = tab.icon;
      return;
    }
    tabsStore.addTab(tab);
  };

  const removeTab = (fullPath: string) => {
    const tabCount = tabsStore.tabList.filter((item: any) => typeof item === "object").length;
    if (tabCount === 1) {
      msgWarning("到我的底线了，哼");
      return;
    }
    tabsStore.removeTab(fullPath, fullPath === route.fullPath, route.fullPath);
  };

  const handleTabClick = (fullPath: string) => {
    if (fullPath === route.fullPath) return;
    router.push({ path: fullPath });
  };

  let sortableInstance: any;

  const tabsDrop = () => {
    const el = getTrackEl();
    if (!el) {
      log.warn(`Sortable 元素未找到，可能未渲染完成`);
      return;
    }
    sortableInstance?.destroy();
    sortableInstance = Sortable.create(el, {
      draggable: ".layout-tabs-bar__item",
      animation: 300,
      onEnd({ newIndex, oldIndex }) {
        if (newIndex == null || oldIndex == null || newIndex === oldIndex) return;
        const tabsListCopy = [...tabsStore.tabList];
        const currentRow = tabsListCopy.splice(oldIndex, 1)[0];
        tabsListCopy.splice(newIndex, 0, currentRow);
        tabsStore.setTab(tabsListCopy);
        nextTick(() => (scrollNavRef.value as unknown as KoiScrollNavHandle | null)?.updateScrollState());
      }
    });
  };

  const handleTabsMenuParent = (e: MouseEvent) => {
    const menu = tabMenuRef.value as unknown as { handleKoiMenuParent: (e: MouseEvent) => void } | null;
    if (!menu) {
      msgError(t("msg.fail"));
      return;
    }
    menu.handleKoiMenuParent(e);
  };

  const handleTabsMenuChildren = (path: string, e: MouseEvent) => {
    const menu = tabMenuRef.value as unknown as {
      handleKoiMenuChildren: (path: string, e: MouseEvent) => void;
    } | null;
    if (!menu) {
      msgError(t("msg.fail"));
      return;
    }
    menu.handleKoiMenuChildren(path, e);
  };

  const refreshScrollState = () => {
    nextTick(() => (scrollNavRef.value as unknown as KoiScrollNavHandle | null)?.updateScrollState());
  };

  onMounted(() => {
    addTab();
    setActiveTab();
    initTabs();
    nextTick(() => {
      tabsDrop();
      refreshScrollState();
    });
  });

  watch(
    () => route.fullPath,
    () => {
      setActiveTab();
      addTab();
      refreshScrollState();
    }
  );

  watch(
    () => tabList.value.length,
    () => refreshScrollState()
  );

  onBeforeUnmount(() => {
    sortableInstance?.destroy();
  });

  return {
    t,
    tabList,
    activeTab,
    activeTabSelector,
    getClosable,
    getMenuLanguage,
    removeTab,
    handleTabClick,
    handleTabsMenuParent,
    handleTabsMenuChildren
  };
}
