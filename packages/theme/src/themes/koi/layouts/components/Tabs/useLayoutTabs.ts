import TabMenu from "@repo/theme/koi/layouts/components/Tabs/components/TabMenu.vue";
import KoiScrollNav from "@repo/theme/koi/components/KoiScrollNav/Index.vue";
import { koiMsgWarning, koiMsgError } from "@repo/theme/koi/utils/koi.ts";
import { getMenuLanguage } from "@repo/theme/koi/utils/index.ts";
import { HOME_URL } from "@repo/theme/koi/config/index.ts";
import useTabsStore from "@repo/theme/koi/stores/modules/tabs.ts";
import useAuthStore from "@repo/theme/koi/stores/modules/auth.ts";
import Sortable from "sortablejs";
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch, type Ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";

/**
 * 布局标签栏共用逻辑（手写标签 + KoiScrollNav 横向滚动）
 * 风格由主题配置 globalStore.tabsStyle 控制（card | google | plain）
 */
export type LayoutTabsRefs = {
  tabMenuRef: Ref<InstanceType<typeof TabMenu> | null>;
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
  const activeTab = ref(route.fullPath);

  const activeTabSelector = computed(() => {
    const index = tabList.value.findIndex((item: any) => item.path === activeTab.value);
    return index >= 0 ? `[data-tab-index="${index}"]` : "";
  });

  const getClosable = (item: any) => item.isAffix !== "1";

  const setActiveTab = () => {
    activeTab.value = route.fullPath;
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
    const { meta, fullPath } = route;
    const existingTab = tabsStore.tabList.find((item: any) => item.path === fullPath);
    const isAffixed = existingTab && existingTab.isAffix === "1";
    const tab = {
      icon: meta.icon,
      title: meta.title as string,
      path: fullPath,
      name: route.name as string,
      isKeepAlive: route.meta.isKeepAlive,
      isAffix: isAffixed ? "1" : (route.meta.isAffix || "0")
    };
    if (fullPath == HOME_URL) {
      tab.isAffix = "1";
    }
    tabsStore.addTab(tab);
  };

  const removeTab = (fullPath: string) => {
    const tabCount = tabsStore.tabList.filter((item: any) => typeof item === "object").length;
    if (tabCount === 1) {
      koiMsgWarning("到我的底线了，哼");
      return;
    }
    tabsStore.removeTab(fullPath, fullPath === route.fullPath, route.fullPath);
  };

  const handleTabClick = (fullPath: string) => {
    if (fullPath === route.fullPath) return;
    router.push({ path: fullPath });
  };

  let sortableInstance: Sortable | undefined;

  const tabsDrop = () => {
    const el = getTrackEl();
    if (!el) {
      console.warn("Sortable 元素未找到，可能未渲染完成");
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
      koiMsgError(t("msg.fail"));
      return;
    }
    menu.handleKoiMenuParent(e);
  };

  const handleTabsMenuChildren = (path: string, e: MouseEvent) => {
    const menu = tabMenuRef.value as unknown as {
      handleKoiMenuChildren: (path: string, e: MouseEvent) => void;
    } | null;
    if (!menu) {
      koiMsgError(t("msg.fail"));
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
