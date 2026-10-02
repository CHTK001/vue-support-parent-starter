<template>
  <div
    ref="rootRef"
    class="layout-tabs-bar layout-tabs"
    :class="tabsRootClass"
    @contextmenu.prevent="handleTabsMenuParent($event)"
  >
    <ReScrollNav
      ref="scrollNavRef"
      class="layout-tabs-bar__scroll"
      height="42px"
      :gap="tabsScrollGap"
      prev-aria-label="向左滚动标签"
      next-aria-label="向右滚动标签"
      :active-selector="activeTabSelector"
    >
      <!--
        定位参照层：关闭按钮用绝对定位贴回标签右侧，而 .koi-scroll-nav__track
        没有 position: relative（那是公共组件，改它会影响所有 ReScrollNav 用法），
        所以这里自建一层 position: relative 的包裹。
      -->
      <div class="layout-tabs-bar__items">
        <!--
        三条无障碍规则的联合约束，决定了下面的层级，改动时不要随意调整：
          - aria-required-parent：role="tab" 必须在 role="tablist" 之内；
          - aria-required-children：tablist 的子元素里必须**只**出现 role="tab"；
            中间插 role="presentation" 或给按钮加 role="none" 都试过，
            axe 都不认（后者还会额外触发 aria-allowed-role 与
            presentation-role-conflict），所以关闭按钮必须完全移出 tablist；
          - nested-interactive：关闭 <button> 不能放进 role="tab" 内部。

        解法：tablist 里只放 tab；关闭按钮作为 tablist 的**兄弟节点**放在同一
        滚动轨道里，用绝对定位贴回对应标签右侧。
      -->
      <div class="layout-tabs-bar__list" role="tablist" :aria-label="t('tabs.listLabel')">
        <div
          v-for="(item, index) in tabList"
          :key="item.path"
          class="layout-tabs-bar__item"
          :class="{ 'is-active': activeTab === item.path }"
          :data-tab-index="index"
          :data-tab-path="item.path"
          role="tab"
          :tabindex="activeTab === item.path ? 0 : -1"
          :aria-selected="activeTab === item.path"
          @click="handleTabClick(item.path)"
          @contextmenu.stop.prevent="handleTabsMenuChildren(item.path, $event)"
        >
          <span v-if="tabsStyle === 'google'" class="line" aria-hidden="true"></span>
          <div class="layout-tabs-bar__label" :class="{ 'tab-label-inner': tabsStyle === 'card' }">
            <ReIcon v-show="tabIcon && item.icon" :name="item.icon" size="16" class="m-r-6px" />
            <span class="layout-tabs-bar__title">{{ getMenuLanguage(item?.title) }}</span>
            <ReIcon
              v-if="item.isAffix === '1'"
              name="koi-affixed"
              width="16"
              height="16"
              class="m-l-4px"
            />
          </div>
        </div>
      </div>
      <!-- 关闭按钮：与 tablist 平级（同一个滚动轨道内），绝对定位贴回标签右侧 -->
      <button
        v-for="item in closableTabs"
        :key="`close-${item.path}`"
        type="button"
        class="layout-tabs-bar__close layout-tabs-bar__close--abs"
        :style="{ left: `${item.closeLeft}px` }"
        :aria-label="t('tabs.closeCurrent')"
        @click="removeTab(item.path)"
      >
        <el-icon :size="14"><Close /></el-icon>
      </button>
      </div>
    </ReScrollNav>
    <ReTabMenu ref="tabMenuRef" />
  </div>
</template>

<script setup lang="ts">
import { Close } from "@element-plus/icons-vue";
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { storeToRefs } from "pinia";
import ReTabMenu from "@repo/theme/koi/layouts/components/Tabs/components/ReTabMenu.vue";
import type { ReScrollNavExpose } from "@repo/ui/re-scroll-nav";
import { useLayoutTabs } from "@repo/theme/koi/layouts/components/Tabs/useLayoutTabs.ts";
import useGlobalStore from "@repo/pinia/modules/global";
import { getConfig } from "@repo/config";

const globalStore = useGlobalStore();
const { tabsStyle } = storeToRefs(globalStore);

// 标签页显示图标开关（app.yaml other.toolbar.tabIcon）
const tabIcon = computed(() => getConfig().other.toolbar.tabIcon);

const tabsRootClass = computed(() => {
  if (tabsStyle.value === "google") return "layout-tabs--google";
  if (tabsStyle.value === "plain") return "layout-tabs--plain";
  return "layout-tabs--glass-cards";
});

const tabsScrollGap = computed(() => {
  if (tabsStyle.value === "google") return 4;
  if (tabsStyle.value === "plain") return 6;
  return 6;
});

const rootRef = ref<HTMLElement | null>(null);
const tabMenuRef = ref<InstanceType<typeof ReTabMenu> | null>(null);
const scrollNavRef = ref<ReScrollNavExpose | null>(null);

const getTrackEl = () =>
  rootRef.value?.querySelector(".koi-scroll-nav__track") as HTMLElement | null;

const {
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
} = useLayoutTabs(getTrackEl, { tabMenuRef, scrollNavRef });

/**
 * 需要显示关闭按钮的标签，及其关闭按钮相对 __list 的横向位置。
 *
 * <p>关闭按钮不能放进 role="tab" 里（nested-interactive），也不能放在
 * role="tablist" 与 role="tab" 之间（试过 role="presentation" 的 wrapper，
 * axe 的 aria-required-children 不认）。所以这里把关闭按钮提到 tablist 的
 * 直接子元素位置，再用绝对定位贴回对应标签的右侧。</p>
 *
 * <p>位置用 <b>getBoundingClientRect 差值</b>算，不能用 offsetLeft：
 * 标签在滚动容器（ReScrollNav 的 track）里，offsetLeft 是相对该容器的，
 * 减去容器偏移后曾实测偏差 200px 以上（关闭按钮会叠到别的标签上）。</p>
 */
function computeCloseLeft(path: string): number {
  // 参照物是自建的定位层 .layout-tabs-bar__items（position: relative）
  const baseEl = document.querySelector<HTMLElement>(".layout-tabs-bar__items");
  const tabEl = document.querySelector<HTMLElement>(`[data-tab-path="${CSS.escape(String(path))}"]`);
  if (!baseEl || !tabEl) return 0;
  const baseRect = baseEl.getBoundingClientRect();
  const tabRect = tabEl.getBoundingClientRect();
  return Math.max(0, tabRect.right - baseRect.left - 20);
}

const closableTabs = ref<{ path: string; closeLeft: number }[]>([]);

/** 标签尺寸随字体加载/窗口变化而变，重算关闭按钮位置 */
function refreshClosePositions(): void {
  const list = tabList.value ?? [];
  closableTabs.value = list
    .filter((item) => getClosable(item))
    .map((item) => ({ path: item.path, closeLeft: computeCloseLeft(item.path) }));
}

onMounted(() => {
  refreshClosePositions();
  window.addEventListener("resize", refreshClosePositions);
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", refreshClosePositions);
});

// 标签增删后位置会变
watch(
  () => tabList.value?.length,
  async () => {
    await nextTick();
    refreshClosePositions();
  }
);</script>

<style lang="scss" scoped>
.layout-tabs-bar {
  width: 100%;
  min-width: 0;
  flex-shrink: 0;
  border-top: 1px solid var(--el-border-color-lighter);
  background-color: var(--el-bg-color);
  box-sizing: border-box;
}

.layout-tabs-bar__scroll {
  width: 100%;
  min-width: 0;
  flex: 1;
  padding: 0 6px;
  box-sizing: border-box;
}

/*
 * tablist 容器与每个标签的 wrapper。
 * 2026-10-02 为修无障碍新增：
 *   - __list  提供 role="tablist"（aria-required-parent 要求）
 *   - __wrap 承载「标签 + 关闭按钮」，使 role="tab" 内不再嵌套可点击元素
 *     （nested-interactive）。原先 item 直接是滚动容器的 inline-flex 子元素，
 *     布局样式整体下移到 wrapper 上，item 退化为 wrapper 内的 flex 子项。
 */
.layout-tabs-bar__items {
  position: relative;
  display: flex;
  align-items: center;
  min-width: 0;
}

.layout-tabs-bar__list {
  display: flex;
  align-items: center;
  min-width: 0;
}

.layout-tabs-bar__item {
  position: relative;
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  min-width: 0;
  max-width: 220px;
  height: 32px;
  margin-top: 0;
  padding: 0 10px 0 12px;
  font-family: var(--el-font-family);
  font-size: var(--el-font-size-base);
  font-weight: 500;
  line-height: 32px;
  color: var(--el-text-color-primary);
  cursor: pointer;
  user-select: none;
  outline: none;
  box-sizing: border-box;
  background: transparent;
  border: none;
  transition:
    color 0.15s ease,
    border-color 0.15s ease,
    background-color 0.15s ease;
}

.layout-tabs-bar__label {
  display: inline-flex;
  align-items: center;
  min-width: 0;
  flex: 1;
}

.layout-tabs-bar__label.tab-label-inner {
  gap: 2px;
}

.layout-tabs-bar__title {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.layout-tabs-bar__close {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  margin-left: 8px;
  padding: 0;
  color: var(--el-text-color-secondary);
  cursor: pointer;
  background: transparent;
  border: none;
  outline: none;
}

/*
 * 关闭按钮移出 tablist 后需要绝对定位贴回标签右侧。
 * 定位参照物是滚动轨道 .koi-scroll-nav__track（需 position: relative）。
 */
.layout-tabs-bar__close--abs {
  position: absolute;
  top: 50%;
  margin-left: 0;
  transform: translateY(-50%);
}

/* 关闭按钮已移出 role="tab"（修 nested-interactive），选中态改由 tab 自身驱动 */
.layout-tabs-bar__item.is-active ~ .layout-tabs-bar__close,
.layout-tabs-bar__close--abs:hover {
  color: inherit;
}

.layout-tabs-bar__close--abs:hover {
  background-color: color-mix(in srgb, var(--el-bg-color) 88%, var(--el-color-primary));
}

/** 卡片 */
.layout-tabs--glass-cards .layout-tabs-bar__item {
  margin: 0 1px;
  padding: 0 10px 0 12px;
  border: 1px solid var(--el-border-color);
  background: var(--el-bg-color);
  border-radius: 6px;

  &:hover:not(.is-active) {
    background-color: var(--el-fill-color-light);
    border-color: color-mix(in srgb, var(--el-color-primary) 42%, var(--el-border-color));
  }

  &.is-active {
    color: var(--el-color-primary);
    background: var(--el-color-primary-light-9);
    border-color: var(--el-color-primary);
  }

  &.is-active:hover {
    background: var(--el-color-primary-light-9);
    border-color: var(--el-color-primary);
  }
}

/** 谷歌 */
.layout-tabs--google .layout-tabs-bar__item {
  margin-left: 4px;
  margin-top: 6px;
  padding: 0 12px 0 14px;
  border-radius: 8px;

  &:first-of-type {
    margin-left: 8px;
  }

  .line {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    width: 1px;
    height: 16px;
    margin: auto;
    background: var(--el-border-color);
    transition: opacity 0.3s ease;
    opacity: 1;
  }

  &:first-child .line {
    opacity: 0;
  }

  &:hover:not(.is-active) {
    background-color: var(--el-fill-color-light);

    .line {
      opacity: 0;
    }
  }

  &.is-active {
    color: var(--el-color-primary);
    background: var(--el-color-primary-light-9);

    &::before,
    &::after {
      position: absolute;
      bottom: 0;
      width: 20px;
      height: 20px;
      content: "";
      border-radius: 50%;
      box-shadow: 0 0 0 30px var(--el-color-primary-light-9);
    }

    &::before {
      left: -20px;
      clip-path: inset(50% -10px 0 50%);
    }

    &::after {
      right: -20px;
      clip-path: inset(50% 50% 0 -10px);
    }

    .line {
      opacity: 0;
    }
  }

  /* 兄弟节点层级已变：标签现在是 __wrap 的子元素，下划线 .line 的相邻兄弟是 __item */
  &:hover + .layout-tabs-bar__item .line,
  &.is-active + .layout-tabs-bar__item .line {
    opacity: 0;
  }
}

/** 简约：圆角描边卡片，选中后图标/文字/叉号均为主题色 */
.layout-tabs--plain .layout-tabs-bar__item {
  margin: 0 2px;
  padding: 0 12px;
  color: var(--el-text-color-regular);
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-light);
  border-radius: 6px;

  &.is-active {
    color: var(--el-color-primary);
  }

  .layout-tabs-bar__close {
    color: inherit;
  }

  :deep(.el-icon) {
    color: inherit;
  }
}

.layout-tabs--google .layout-tabs-bar__item:focus,
.layout-tabs--google .layout-tabs-bar__item:focus-visible,
.layout-tabs--google .layout-tabs-bar__item:focus-within,
.layout-tabs--glass-cards .layout-tabs-bar__item:focus,
.layout-tabs--glass-cards .layout-tabs-bar__item:focus-visible,
.layout-tabs--glass-cards .layout-tabs-bar__item:focus-within,
.layout-tabs--plain .layout-tabs-bar__item:focus,
.layout-tabs--plain .layout-tabs-bar__item:focus-visible,
.layout-tabs--plain .layout-tabs-bar__item:focus-within {
  outline: none;
  box-shadow: none;
}
</style>
