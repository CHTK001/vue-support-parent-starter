import TabMenu from "../../../layouts/components/Tabs/components/TabMenu.vue";
import type { KoiScrollNavExpose } from "../../../components/KoiScrollNav/Index.vue";
import { koiMsgWarning, koiMsgError } from "../../../utils/koi.ts";
import { getMenuLanguage } from "../../../utils/index.ts";
import { HOME_URL } from "../../../config/index.ts";
import { useKoiConfig } from "../../../utils/useKoiConfig.ts";
import useTabsStore from "../../../stores/modules/tabs.ts";
import useAuthStore from "../../../stores/modules/auth.ts";
import settings from "../../../settings";
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
  scrollNavRef: Ref<KoiScrollNavExpose | null>;
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
  const koiConfig = useKoiConfig();

  const { tabMenuRef, scrollNavRef } = refs;

  const tabList = computed(() => tabsStore.getTabs);
  const activeTab = ref(route.fullPath);

  /** 多页签最大数量：MaxTagsLevel → settings.tabsMaxCount → 16 */
  const maxTabs = computed(() => koiConfig.cfgNumber("MaxTagsLevel", settings.tabsMaxCount ?? 16));

  /** 标签页拖拽排序：tabsDraggable → settings.tabsDraggable → true */
  const tabsDraggable = computed(() => koiConfig.cfgBool("tabsDraggable", settings.tabsDraggable !== false));

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
    if (!tabsDraggable.value) {
      sortableInstance?.destroy();
      sortableInstance = undefined;
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
        nextTick(() => scrollNavRef.value?.updateScrollState());
      }
    });
  };

  const handleTabsMenuParent = (e: MouseEvent) => {
    const menu = tabMenuRef.value;
    if (!menu) {
      koiMsgError(t("msg.fail"));
      return;
    }
    menu.handleKoiMenuParent(e);
  };

  const handleTabsMenuChildren = (path: string, e: MouseEvent) => {
    const menu = tabMenuRef.value;
    if (!menu) {
      koiMsgError(t("msg.fail"));
      return;
    }
    menu.handleKoiMenuChildren(path, e);
  };

  const refreshScrollState = () => {
    nextTick(() => scrollNavRef.value?.updateScrollState());
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
