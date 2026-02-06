import { computed, type CSSProperties, getCurrentInstance, onMounted, reactive, ref, unref } from "vue";
import type { tagsViewsType } from "../types";
import type { StorageConfigs } from "@repo/config";
import { $t, responsiveStorageNameSpace, transformI18n } from "@repo/config";
import { useRoute, useRouter } from "vue-router";
import { useMultiTagsStoreHook, useSettingStoreHook } from "@repo/core";
import { hasClass, isBoolean, isEqual, toggleClass } from "@pureadmin/utils";
import { localStorageProxy } from "@repo/utils";

export function useTags() {
  const route = useRoute();
  const router = useRouter();
  const instance = getCurrentInstance();
  const pureSetting = useSettingStoreHook();
  // 提取 store 引用到顶层
  const multiTagsStore = useMultiTagsStoreHook();

  const buttonTop = ref(0);
  const buttonLeft = ref(0);
  const translateX = ref(0);
  const visible = ref(false);
  const activeIndex = ref(-1);
  // 当前右键选中的路由信息
  const currentSelect = ref({});
  const isScrolling = ref(false);

  /** 显示模式，默认灵动模式 */
  const showModel = ref(localStorageProxy().getItem<StorageConfigs>(`${responsiveStorageNameSpace()}configure`)?.showModel || "smart");
  /** 是否隐藏标签页，默认显示 */
  const showTags = ref(localStorageProxy().getItem<StorageConfigs>(`${responsiveStorageNameSpace()}configure`).hideTabs) ?? ref("false");
  const multiTags: any = computed(() => {
    return multiTagsStore.multiTags || [];
  });

  const Close = "ep:close";

  const tagsViews = reactive<Array<tagsViewsType>>([
    {
      icon: "ep:refresh-right",
      text: $t("buttons.pureReload"),
      divided: false,
      disabled: false,
      show: true,
    },
    {
      icon: "ep:close",
      text: $t("buttons.pureCloseCurrentTab"),
      divided: false,
      disabled: multiTags.value.length > 1 ? false : true,
      show: true,
    },
    {
      icon: "ri:text-direction-r",
      text: $t("buttons.pureCloseLeftTabs"),
      divided: true,
      disabled: multiTags.value.length > 1 ? false : true,
      show: true,
    },
    {
      icon: "ri:text-direction-l",
      text: $t("buttons.pureCloseRightTabs"),
      divided: false,
      disabled: multiTags.value.length > 1 ? false : true,
      show: true,
    },
    {
      icon: "ri:text-spacing",
      text: $t("buttons.pureCloseOtherTabs"),
      divided: true,
      disabled: multiTags.value.length > 2 ? false : true,
      show: true,
    },
    {
      icon: "ri:subtract-line",
      text: $t("buttons.pureCloseAllTabs"),
      divided: false,
      disabled: multiTags.value.length > 1 ? false : true,
      show: true,
    },
    {
      icon: "ri:fullscreen-fill",
      text: $t("buttons.pureContentFullScreen"),
      divided: true,
      disabled: false,
      show: true,
    },
  ]);

  function conditionHandle(item, previous, next) {
    // 处理刷新时的 redirect 路径，避免闪烁
    const currentPath = route.path.startsWith('/redirect') 
      ? route.path.replace('/redirect', '') 
      : route.path;
    
    if (isBoolean(route?.meta?.showLink) && route?.meta?.showLink === false) {
      if (Object.keys(route.query).length > 0) {
        return isEqual(route.query, item.query) ? previous : next;
      } else {
        return isEqual(route.params, item.params) ? previous : next;
      }
    } else {
      return currentPath === item.path ? previous : next;
    }
  }

  const isFixedTag = computed(() => {
    return (item) => {
      return isBoolean(item?.meta?.fixedTag) && item?.meta?.fixedTag === true;
    };
  });

  const iconIsActive = computed(() => {
    return (item, index) => {
      if (index === 0) return;
      return conditionHandle(item, true, false);
    };
  });

  const linkIsActive = computed(() => {
    return (item) => {
      return conditionHandle(item, "is-active", "");
    };
  });

  const scheduleIsActive = computed(() => {
    return (item) => {
      return conditionHandle(item, "schedule-active", "");
    };
  });

  const getTabStyle = computed((): CSSProperties => {
    return {
      transform: `translateX(${translateX.value}px)`,
    };
  });

  const getContextMenuStyle = computed((): CSSProperties => {
    return { left: buttonLeft.value + "px", top: buttonTop.value + "px" };
  });

  const closeMenu = () => {
    visible.value = false;
  };

  /** 鼠标移入添加激活样式 */
  function onMouseenter(index) {
    // 仅更新激活索引，不触发任何样式动画
    if (index) activeIndex.value = index;
  }

  /** 鼠标移出恢复默认样式 */
  function onMouseleave(index) {
    // 移出时仅恢复索引，不触发任何样式动画
    activeIndex.value = -1;
  }

  function onContentFullScreen() {
    pureSetting.hiddenSideBar ? pureSetting.changeSetting({ key: "hiddenSideBar", value: false }) : pureSetting.changeSetting({ key: "hiddenSideBar", value: true });
  }

  onMounted(() => {
    if (!showModel.value) {
      const configure = localStorageProxy().getItem<StorageConfigs>(`${responsiveStorageNameSpace()}configure`);
      configure.showModel = "chrome";
      localStorageProxy().setItem(`${responsiveStorageNameSpace()}configure`, configure);
    }
  });

  return {
    Close,
    route,
    router,
    visible,
    showTags,
    instance,
    multiTags,
    showModel,
    tagsViews,
    buttonTop,
    buttonLeft,
    translateX,
    isFixedTag,
    pureSetting,
    activeIndex,
    getTabStyle,
    isScrolling,
    iconIsActive,
    linkIsActive,
    currentSelect,
    scheduleIsActive,
    getContextMenuStyle,
    $t,
    closeMenu,
    onMounted,
    onMouseenter,
    onMouseleave,
    transformI18n,
    onContentFullScreen,
  };
}
