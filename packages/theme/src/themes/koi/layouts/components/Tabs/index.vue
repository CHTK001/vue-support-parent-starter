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
          :class="{ 'is-active': activeTab === item.path, 'has-close': getClosable(item) }"
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
      <!--
        关闭按钮：与 tablist 平级（同一个滚动轨道内），绝对定位贴回标签右侧。
        left 由 computeCloseLeft() 给出「标签右边缘相对 __items 左边缘」的横向距离，
        再由 CSS 的 translate(-100%) 把按钮**右边缘**对齐过去 —— 因此 JS 侧
        不需要知道按钮自身宽度。
      -->
      <button
        v-for="item in closableTabs"
        :key="`close-${item.path}`"
        type="button"
        class="layout-tabs-bar__close layout-tabs-bar__close--abs"
        :class="{ 'is-active': activeTab === item.path }"
        :style="{ left: `${item.closeLeft}px`, top: `${item.closeTop}px` }"
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
import { isToolbarVisible } from "../Header/toolbarPrefs";

const globalStore = useGlobalStore();
const { tabsStyle } = storeToRefs(globalStore);

// 标签页显示图标开关（yaml master + 用户偏好）
const tabIcon = computed(() => isToolbarVisible("tabIcon"));

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
 * 关闭按钮相对「标签右边缘」的内缩距离（px）。
 *
 * <p>原先这里写的是「标签右边缘 − 20」，把「按钮宽度（假定 14px）+ 内缩（6px）」
 * 一起编码进了减数。于是图标尺寸或字体一变就漂移；且三种 tabsStyle 的右内边距
 * 不同（glass-cards 10px / google 12px / plain 12px），对齐只是碰巧差不多。
 * 现在由 CSS 用 {@code translate(-100%)} 对齐按钮<b>右边缘</b>，JS 只算内缩这一个
 * 真正的设计值，与按钮自身宽度解耦。</p>
 */
const CLOSE_BUTTON_INSET = 6;

/**
 * 需要显示关闭按钮的标签，及其关闭按钮相对 __items 的横向位置。
 *
 * <p>关闭按钮不能放进 role="tab" 里（nested-interactive），也不能放在
 * role="tablist" 与 role="tab" 之间（试过 role="presentation" 的 wrapper，
 * axe 的 aria-required-children 不认）。所以这里把关闭按钮提到 tablist 的
 * 直接子元素位置，再用绝对定位贴回对应标签的右侧。</p>
 *
 * <p>位置用 <b>getBoundingClientRect 差值</b>算，不能用 offsetLeft：
 * 标签在滚动容器（ReScrollNav 的 track）里，offsetLeft 是相对该容器的，
 * 减去容器偏移后曾实测偏差 200px 以上（关闭按钮会叠到别的标签上）。</p>
 *
 * <p>查询一律 scope 到本组件的 {@code rootRef}：原来用的是全局
 * {@code document.querySelector}，页面上存在第二个页签栏实例时会取到别人的
 * 参照层，按钮整体错位。</p>
 */
function computeCloseLeft(path: string): number {
  // 参照物是自建的定位层 .layout-tabs-bar__items（position: relative）
  const root = rootRef.value;
  const baseEl = root?.querySelector<HTMLElement>(".layout-tabs-bar__items") ?? null;
  const tabEl =
    root?.querySelector<HTMLElement>(`[data-tab-path="${CSS.escape(String(path))}"]`) ?? null;
  if (!baseEl || !tabEl) return 0;
  const baseRect = baseEl.getBoundingClientRect();
  const tabRect = tabEl.getBoundingClientRect();
  // 只减内缩：按钮右边缘由 CSS 的 translate(-100%) 对齐到这个坐标
  return Math.max(0, tabRect.right - baseRect.left - CLOSE_BUTTON_INSET);
}

/**
 * 关闭按钮纵向中心对齐到标签中心所需的 top（相对 __items 左上）。
 *
 * <p>原先 CSS 写的是 {@code top: 50%}，那是 __items 的中线。但 google 风格给
 * .layout-tabs-bar__item 加了 {@code margin-top: 6px}（把圆角胶囊压低让出顶部），
 * 于是 __items 的中线比标签自身中心高 3px，× 在 google 风格下会偏上 3px。
 * 与其在这里补一个 {@code +3px} 的魔法数，不如直接量标签中心 —— 横纵都用同
 * 一套测量，任何风格（改 margin-top / 改行高）都对齐。</p>
 */
function computeCloseTop(path: string): number {
  const root = rootRef.value;
  const baseEl = root?.querySelector<HTMLElement>(".layout-tabs-bar__items") ?? null;
  const tabEl =
    root?.querySelector<HTMLElement>(`[data-tab-path="${CSS.escape(String(path))}"]`) ?? null;
  if (!baseEl || !tabEl) return 0;
  const baseRect = baseEl.getBoundingClientRect();
  const tabRect = tabEl.getBoundingClientRect();
  // CSS 的 translateY(-50%) 会再上移自身高度的一半，正好让按钮中心落在此点
  return tabRect.top + tabRect.height / 2 - baseRect.top;
}

const closableTabs = ref<{ path: string; closeLeft: number; closeTop: number }[]>([]);

/** 重算关闭按钮位置 */
function refreshClosePositions(): void {
  const list = tabList.value ?? [];
  closableTabs.value = list
    .filter((item) => getClosable(item))
    .map((item) => ({
      path: item.path,
      closeLeft: computeCloseLeft(item.path),
      closeTop: computeCloseTop(item.path),
    }));
}

/**
 * 把重算合并到下一帧。
 *
 * <p>ResizeObserver 在一次布局里可能连着触发两次（root 与 list 各一次），
 * 而 refreshClosePositions 会对每个可关闭标签做 2 次 getBoundingClientRect，
 * 页签多时是白做的功。合并到 rAF 后每帧最多算一次。</p>
 */
let closeRafId = 0;
function scheduleRefreshClosePositions(): void {
  if (closeRafId) cancelAnimationFrame(closeRafId);
  closeRafId = requestAnimationFrame(() => {
    closeRafId = 0;
    refreshClosePositions();
  });
}

/**
 * 尺寸变化的重算入口。
 *
 * <p>原来只监听 {@code window.resize}，漏掉三类真实变化：字体加载完成
 * （标签宽度变了，但字体就绪不触发 resize）、标题变长（i18n 异步解析出更长文案）、
 * tabsStyle 切换（三种风格的内边距与边框不同）。这三种都会改变 tablist 的
 * <b>内容宽度</b>，而 {@code ResizeObserver} 盯的正是它；root（width:100%）
 * 则覆盖窗口缩放。</p>
 */
let closeRO: ResizeObserver | null = null;

onMounted(() => {
  refreshClosePositions();
  const root = rootRef.value;
  const listEl = root?.querySelector(".layout-tabs-bar__list") ?? null;
  if (typeof ResizeObserver !== "undefined" && root && listEl) {
    closeRO = new ResizeObserver(() => scheduleRefreshClosePositions());
    closeRO.observe(root);
    closeRO.observe(listEl);
  } else {
    // 兜底：ResizeObserver 不可用时，至少窗口缩放还能跟上
    window.addEventListener("resize", scheduleRefreshClosePositions);
  }
});

onBeforeUnmount(() => {
  closeRO?.disconnect();
  closeRO = null;
  if (closeRafId) {
    cancelAnimationFrame(closeRafId);
    closeRafId = 0;
  }
  window.removeEventListener("resize", scheduleRefreshClosePositions);
});

// 标签增删**与换序**都会改变关闭按钮位置。
// 原来只 watch length，漏掉 Sortable 拖拽换序（长度不变、顺序变了）——
// 拖完之后关闭按钮全部留在原位，与页签一一错位。改成 watch 路径序列。
watch(
  () => (tabList.value ?? []).map((t) => t.path).join("|"),
  async () => {
    await nextTick();
    refreshClosePositions();
  },
);</script>

<style lang="scss" scoped>
.layout-tabs-bar {
  /* 关闭按钮的尺寸与它和标题之间的间距。
     按钮是绝对定位、不在流内，标签的 flex:1 不会自动给它让位，
     必须由 .has-close 显式预留（见 .layout-tabs-bar__item.has-close）。 */
  --tab-close-size: 14px;
  --tab-close-gap: 8px;
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
 *   - 关闭按钮移出 tablist 并绝对定位，使 role="tab" 内不再嵌套可点击元素
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
  box-sizing: border-box;
}

/*
  有关闭按钮的标签：为按钮预留右侧空间。
  d2089d4a1 把按钮移出 role="tab" 改成绝对定位后，标签不再有「流内按钮」，
  flex:1 会一路撑到内容盒右沿，绝对定位的按钮就压在标题文字上
  （实测 × 盖住标题末字）。这里给 label 加右内边距把文字让开。
  只加在 .has-close 上：固钉标签没有按钮，不该多出这段空白。
*/
.layout-tabs-bar__item.has-close .layout-tabs-bar__label {
  padding-right: calc(var(--tab-close-size) + var(--tab-close-gap));
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
 * 定位参照物是自建的 .layout-tabs-bar__items（position: relative），
  * **不是** .koi-scroll-nav__track —— 那是公共组件且没有 position: relative。
  *
  * left 由 JS 给出的是「标签右边缘」的坐标，translate(-100%) 把按钮**右边缘**
  * 对齐过去，于是 JS 侧不需要知道按钮自身宽度（见 computeCloseLeft 的
  * CLOSE_BUTTON_INSET）。原先这里只写 translateY(-50%)、配 JS 里的「减 20」，
  * 等于把按钮宽度硬编码进了 JS。
 */
.layout-tabs-bar__close--abs {
  position: absolute;
  /* left / top 都由 JS 按标签实测盒给出（见 computeCloseLeft / computeCloseTop），
     这里的 0 只是首帧兜底；不要改回 50%，google 风格的 margin-top 会让 × 偏上 3px */
  top: 0;
  margin-left: 0;
  transform: translate(-100%, -50%);
}

/*
  * 选中态颜色：关闭按钮已移出 role="tab"，不能再靠 color: inherit 从标签继承 ——
  * 继承源变成了 __items，永远拿不到标签的选中色，于是 d2089d4a1 之后选中标签的
  * 叉号一直不是主题色。改为由模板上的 is-active 类显式驱动。
  *
  * 原先这里是 `.layout-tabs-bar__item.is-active ~ .layout-tabs-bar__close`：
  * 兄弟选择器在按钮移出 tablist 之后**永不匹配**，是条死规则，已删除。
  */
.layout-tabs-bar__close--abs.is-active {
  color: var(--el-color-primary);
}

.layout-tabs-bar__close--abs:hover {
  color: var(--el-color-primary);
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

  /* 兄弟节点层级已变：标签的相邻兄弟仍是标签自身，下划线 .line 的相邻兄弟是 __item */
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

  /* 选中态的叉号由 .layout-tabs-bar__close--abs.is-active 统一驱动；
     此前这里还有一条 .layout-tabs-bar__close { color: inherit }，
     嵌套在 __item 内，而按钮已不是 __item 的后代，同样是永不匹配的死规则。 */

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
