<script setup lang="ts">
/**
 * ReDialog —— 弹窗组件
 *
 * 透传 el-dialog 全部能力，v-model 控制显隐。
 * 增强：
 *   - layout："el"（默认 el-dialog）/ "modern"（现代化扁平弹窗，异步加载）
 *   - draggable：可拖拽头部移动弹窗（默认 true，未传即可拖）
 *   - fullscreenable：右上角显示全屏切换
 *   - confirmLoading：确认按钮 loading 态（常用于提交场景）
 *   - cancelText / okText：确认/取消按钮文案
 *   - footer 三态：未传时只渲染业务自定义 #footer 插槽、不渲染自带按钮；
 *     show-footer / footer-hidden 显式开启才出自带「取消/确认」按钮
 *   - headless：隐藏 header，右上角圆形关闭按钮替代（圆心定位）
 *   - responsive：基于 @vueuse/core 自动响应式（移动端默认全屏）
 *
 * 说明：原 `layout="windows"` 变体（layouts/WindowsLayout.vue）经跨行审计确认
 * 全仓无人使用，已移除；需要时从 backups/ui-unused-layouts-retire-20260926/ 取回。
 */
import { computed, defineAsyncComponent, onBeforeUnmount, ref, watch } from "vue";
import type { CSSProperties } from "vue";
import { ElDialog, ElButton } from "element-plus";
import { FullScreen, Crop } from "@element-plus/icons-vue";
import ReDialogCloseFab from "./CloseFab.vue";
import { useResponsiveDialog } from "./composables/useResponsiveDialog";
import "../shared/modern-vars.css";

/** Modern 布局组件（按需异步加载） */
const ModernLayout = defineAsyncComponent(() => import("./layouts/Modern.vue"));

defineOptions({ name: "ReDialog", inheritAttrs: true });

const visible = defineModel<boolean>({ default: false });

const props = withDefaults(
  defineProps<{
    /** 布局变体："el"（默认 el-dialog）/ "modern"（现代化扁平弹窗） */
    layout?: "el" | "modern";
    /** 窗口唯一标识；传入后位置/尺寸/状态自动持久化到 localStorage */
    id?: string;
    title?: string;
    width?: string | number;
    top?: string;
    appendToBody?: boolean;
    closeOnClickModal?: boolean;
    closeOnPressEscape?: boolean;
    showClose?: boolean;
    beforeClose?: (done: () => void) => void;
    destroyOnClose?: boolean;
    modal?: boolean;
    /** 是否可拖拽（默认 true：未传即可按住标题栏拖动） */
    draggable?: boolean;
    /**
     * 是否允许拖拽越出视口（透传 el-dialog 的 `overflow`）。
     *
     * <p><b>为什么需要它</b>：el-dialog 的 `useDraggable` 只在 `overflow` 为假时 clamp，
     * 位移上限 {@code maxTop = clientHeight - targetTop - (targetHeight < clientHeight ? targetHeight : 0)}，
     * 弹窗**略矮于视口**时这个上限约等于 0，表现就是 <b>拖不动</b>
     * （element-plus 2.14 的 `use-draggable/index.mjs`）。</p>
     *
     * <p>直接透传 props.overflow（不传 = `overflow="false"`）：拖拽按 el-dialog 原生语义——只到视口边，
     * 到边就停，不会越出视口，也不会回弹；业务真要自由空间就显式传 <code>overflow="true"</code>（放开钳制）。</p>
     */
    overflow?: boolean;
    /** 是否可全屏 */
    fullscreenable?: boolean;
    /** 初始全屏 */
    fullscreen?: boolean;
    /** 确认按钮 loading 态 */
    confirmLoading?: boolean;
    /** 确认按钮文案 */
    okText?: string;
    /** 取消按钮文案 */
    cancelText?: string;
    /** 是否显示确认按钮（默认 true） */
    showOk?: boolean;
    /** 是否显示取消按钮（默认 true） */
    showCancel?: boolean;
    /**
     * 底部区域（自带确认/取消按钮）三态：
     *   - undefined（未传，新默认）：只在业务提供 #footer 插槽时渲染插槽内容，
     *     自带按钮默认不渲染；要自带按钮需显式传 show-footer（或 footer-hidden=false）。
     *   - true：渲染自带按钮（提供 #footer 插槽时插槽内容优先）。
     *   - false：整个底部区域不渲染（即使有 #footer 插槽，与历史显式传 false 语义一致）。
     */
    showFooter?: boolean;
    /** showFooter 的反义别名（koi 主题惯用写法），两者同时传时以 showFooter 为准 */
    footerHidden?: boolean;
    /** 无头模式：隐藏 header，右上角圆形关闭 FAB 替代（圆心在右上角） */
    headless?: boolean;
    /** 启用响应式（移动端自动全屏）；默认 true */
    responsive?: boolean;
    /** 移动端断点（<= 视为移动端） */
    mobileBreakpoint?: number;
    /** 移动端自动全屏；默认 true */
    mobileFullscreen?: boolean;
    /** 紧凑模式：减小弹窗内边距 */
    compact?: boolean;
  }>(),
  {
    layout: "el",
    id: "",
    title: "",
    width: "65%",
    top: "15vh",
    appendToBody: true,
    closeOnClickModal: true,
    closeOnPressEscape: true,
    showClose: true,
    beforeClose: undefined,
    destroyOnClose: false,
    modal: true,
    draggable: true,
    // overflow：跟 draggable 无关——直接透传 props.overflow（el-dialog 自己按 globalConfig 决定 clamp），
    // 同 showFooter，Boolean prop「未传且无默认值」会被 Vue 强转成 false，
    // 三态里的「未传」将永远不可达，必须显式 default: undefined 透传。
    overflow: undefined,
    fullscreenable: false,
    fullscreen: false,
    confirmLoading: false,
    okText: "确定",
    cancelText: "取消",
    showOk: true,
    showCancel: true,
    // showFooter / footerHidden 必须显式 default: undefined：Boolean prop「未传且无默认值」
    // 会被 Vue 强转成 false（resolvePropValue: isAbsent && !hasDefault → false），
    // footerMode 的「未传」分支将永远不可达，业务自定义 #footer 插槽也会被误吞。
    showFooter: undefined,
    footerHidden: undefined,
    headless: false,
    responsive: true,
    mobileBreakpoint: 768,
    mobileFullscreen: true,
    compact: false,
  },
);

const emit = defineEmits<{
  (e: "update:modelValue", v: boolean): void;
  (e: "ok"): void;
  (e: "cancel"): void;
  (e: "fullscreen-change", v: boolean): void;
  /**
   * 生命周期事件：显式声明并从内部 ElDialog 转发。
   *
   * <p>为什么要声明：不声明的话这些监听器会留在 `$attrs` 里，靠
   * `<ElDialog v-bind="$attrs">` 透传才能生效 —— 一旦哪天内部实现换成非 el 的
   * 容器（例如 modern 布局的 div 根节点），监听器就会静默失效。
   * 声明后由本组件负责转发，语义与 LDialog 的 open/close/closed 一致，
   * 从 LDialog 迁过来的页面无需改一行监听器代码。</p>
   *
   * <p><b>注意</b>：声明了就必须在这里显式 emit —— 声明会把这些监听器从
   * `$attrs` 里摘走；若只声明不转发，等于把事件丢掉。</p>
   */
  (e: "open" | "close"): void;
  (e: "closed"): void;
}>();

/**
 * footer 三态归一：true=渲染自带按钮 / false=整个底部不渲染 / undefined=未传
 * （只渲染业务 #footer 插槽，不渲染自带按钮）。
 */
const footerMode = computed<boolean | undefined>(() => {
  if (props.showFooter !== undefined) return props.showFooter;
  if (props.footerHidden !== undefined) return !props.footerHidden;
  return undefined;
});

/* ===== 全屏状态 ===== */
const isFullscreen = ref<boolean>(props.fullscreen);
watch(
  () => props.fullscreen,
  (v) => (isFullscreen.value = v),
);

/* ===== 响应式（@vueuse/core） ===== */
const responsive = useResponsiveDialog(
  { width: props.width, top: props.top, fullscreen: isFullscreen.value },
  {
    mobileBreakpoint: props.mobileBreakpoint,
    mobileFullscreen: props.mobileFullscreen,
  },
);

// 同步窗口尺寸变化到 composable，避免 ref 引起的耦合
const resolved = computed(() => {
  if (!props.responsive) {
    return {
      width: props.width,
      top: props.top,
      fullscreen: isFullscreen.value,
    };
  }
  return {
    width: responsive.width.value,
    top: responsive.top.value,
    // 显式全屏（按钮切换）与响应式自动全屏取并集
    fullscreen: isFullscreen.value || responsive.fullscreen.value,
  };
});

/* ==========================================================================
 * 拖拽：el 布局只做透传——拖拽与视口 clamp 由 el-dialog 原生的 `draggable`
 * + `useDraggable`（el-dialog 内部 `props.draggable ?? globalConfig?.draggable ?? false && !fullscreen`、
 *   `props.overflow ?? globalConfig?.overflow ?? false`）负责。
 *
 * 历史缺陷（2026-10-23 修复）：此前代码在 ReDialog 这一层手写了 mousedown，
 * 把位移写进 <ElDialog :style="{ left, top, marginLeft: 0, marginTop: 0 }">。
 * 但 el-dialog 的 `style` 由 useDialog 计算后只产出 CSS 变量
 * （--el-dialog-margin-top / --el-dialog-width）合并到 .el-dialog 上，
 * 而 .el-dialog 本身是「非定位」的普通块级元素（居中靠 margin: ... auto），
 * 于是 left/top 完全不生效 —— 表现为拖拽完全无反应。
 *
 * 现在拖拽完全交给 el-dialog 原生实现：mousedown 绑在 headerRef 上、以
 * transform: translate() 位移，到视口边就停，不越界、不回弹、不缩小。
 *
 * overflow：显式 `overflow` 优先，未传时默认 `false`（el-dialog 把位移钳制到视口边，
 * 到边就停；要自由空间才显式传 `overflow="true"` 放开钳制）—— 由 `effectiveOverflow` 计算得出。
 * ========================================================================== */

/**
 * 传给 el-dialog 的 `overflow`：显式配置优先，不传时默认 `false`。
 *
 * <p>el-dialog 的 `useDraggable` 只会在 `overflow` 为假时对位移做视口钳制（拖到视口边就
 * 停、不越出视口）；ReDialog 只在低效钳制区（近满高弹窗），才需要业务显式传
 * <code>overflow="true"</code> 放开钳制。此前「未传则跟随 {@link draggable}」等同于
 * 默认放开钳制，也即弹窗会随鼠标跑到视口外 — 这就是 ReDialog（el-dialog 壳）能拖出
 * 可视区域的原因。</p>
 *
 * <p>放开钳制后的兜底（{@link onDocumentMouseUp} 的
 * {@code DRAG_KEEP_VISIBLE} + {@code resetPosition}）是为显式传 `overflow` 的业务留的；
 * 默认钳制状态下弹窗到视口边就停，用不到它。</p>
 */
const effectiveOverflow = computed<boolean>(() => props.overflow ?? false);

/**
 * el-dialog 实例句柄（取弹窗 DOM / 调 resetPosition 归零）。
 *
 * <p>与 koi 主题一致：在业务 <b>显式放开 {@link effectiveOverflow}</b> 的前提下，弹窗才
 * 被允许被拖到任意位置、甚至拖出视口而无法再抓到；这里在拖拽结束（document mouseup）后
 * 检查是否越出「保留区」，越界就用官方 {@code resetPosition} 归零。</p>
 */
const dialogInstance = ref<ElDialogExposed | null>(null);

/** ElDialog 通过 `defineExpose` 暴露的成员（只用到的两个），同 koi 主题的 DialogExposed */
interface ElDialogExposed {
  dialogContentRef?: { $el?: HTMLElement } | null;
  resetPosition?: () => void;
}

/** 拖拽结束后至少留在视口内的像素数（同 koi 的 DRAG_KEEP_VISIBLE） */
const DRAG_KEEP_VISIBLE = 56;

/** 拖拽兜底：只对「未全屏 + 可拖拽」时有效（全屏时 transform 会被清空，无需归零） */
function onDocumentMouseUp(): void {
  if (!props.draggable || !effectiveOverflow.value || isFullscreen.value) return;
  const el = dialogInstance.value?.dialogContentRef?.$el ?? null;
  if (!el) return;

  const rect = el.getBoundingClientRect();
  const vw = document.documentElement.clientWidth;
  const vh = document.documentElement.clientHeight;
  const lost =
    rect.right < DRAG_KEEP_VISIBLE ||
    rect.left > vw - DRAG_KEEP_VISIBLE ||
    rect.bottom < DRAG_KEEP_VISIBLE ||
    rect.top > vh - DRAG_KEEP_VISIBLE;
  if (lost) dialogInstance.value?.resetPosition?.();
}

/* 弹窗可见期间监听 document 的 mouseup；关闭即摘，避免常驻全局监听 */
watch(visible, (open) => {
  if (typeof document === "undefined") return;
  if (open) document.addEventListener("mouseup", onDocumentMouseUp);
  else document.removeEventListener("mouseup", onDocumentMouseUp);
});

onBeforeUnmount(() => {
  if (typeof document !== "undefined") {
    document.removeEventListener("mouseup", onDocumentMouseUp);
  }
});

/* ===== 操作 ===== */
function onOk(): void {
  if (props.confirmLoading) return;
  emit("ok");
}
function onCancel(): void {
  emit("cancel");
  visible.value = false;
}

/**
 * modern 布局的显隐回调：把 modelValue 透传给父组件，并补齐 open/close。
 *
 * <p>modern 布局没有 el-dialog 可转发 `open`/`close`（其根节点是普通 div），
 * 若不在这里补，从 LDialog 迁过来、监听 `@close` 的页面在该布局下会静默失效。
 * `closed` 依赖过渡结束，只有 el 布局能准确给出，这里不伪造。</p>
 *
 * @param v 新的可见状态
 */
function onModernModelValue(v: boolean): void {
  emit("update:modelValue", v);
  emit(v ? "open" : "close");
}
function toggleFullscreen(): void {
  isFullscreen.value = !isFullscreen.value;
  emit("fullscreen-change", isFullscreen.value);
}
function closeByFab(): void {
  if (props.beforeClose) {
    props.beforeClose(() => (visible.value = false));
  } else {
    visible.value = false;
  }
}

/* ===== 组合样式（全屏 + 响应式） ===== */
const fullscreenStyle = computed<CSSProperties>(() => {
  if (isFullscreen.value || resolved.value.fullscreen) {
    return {
      left: "0",
      top: "0",
      width: "100vw",
      height: "100vh",
      maxWidth: "100vw",
      maxHeight: "100vh",
      marginTop: "0",
      marginLeft: "0",
      borderRadius: "0",
    };
  }
  // 拖拽位移由 el-dialog 原生 draggable 以 transform 实现，这里不再写 left/top，
  // 否则会与 transform 叠加、或直接覆盖掉居中用 margin。
  // 响应式宽度样式
  if (props.responsive) return responsive.elStyle.value as CSSProperties;
  return { marginTop: props.top, marginLeft: "auto", marginRight: "auto" };
});

/* ===== headless 下显示隐藏关闭 FAB ===== */
const showCloseFab = computed(() => props.headless);
</script>

<template>
  <!-- Modern 布局（异步加载） -->
  <ModernLayout
    v-if="layout === 'modern'"
    v-model="visible"
    :title="title"
    :width="resolved.width"
    :top="resolved.top"
    :close-on-click-modal="closeOnClickModal"
    :close-on-press-escape="closeOnPressEscape"
    :show-close="showClose"
    :destroy-on-close="destroyOnClose"
    :modal="modal"
    :draggable="draggable"
    :fullscreenable="fullscreenable"
    :fullscreen="resolved.fullscreen"
    :confirm-loading="confirmLoading"
    :ok-text="okText"
    :cancel-text="cancelText"
    :show-ok="showOk"
    :show-cancel="showCancel"
    :show-footer="footerMode"
    :headless="headless"
    :mobile-breakpoint="mobileBreakpoint"
    :compact="compact"
    v-bind="$attrs"
    @update:model-value="onModernModelValue"
    @ok="onOk"
    @cancel="onCancel"
    @fullscreen-change="(v: boolean) => emit('fullscreen-change', v)"
    @close-fab="closeByFab"
  >
    <slot />
    <template v-if="$slots.footer" #footer="scope">
      <slot name="footer" v-bind="scope" />
    </template>
  </ModernLayout>

  <!-- 默认 el-dialog 布局 -->
  <ElDialog
    v-else
    ref="dialogInstance"
    v-model="visible"
    v-bind="$attrs"
    :title="headless ? '' : title"
    :width="typeof resolved.width === 'number' ? resolved.width : String(resolved.width)"
    :top="typeof resolved.top === 'number' ? String(resolved.top) : resolved.top"
    :append-to-body="appendToBody"
    :close-on-click-modal="closeOnClickModal"
    :close-on-press-escape="closeOnPressEscape"
    :show-close="headless ? false : showClose"
    :before-close="beforeClose"
    :destroy-on-close="destroyOnClose"
    :modal="modal"
    :draggable="draggable && !isFullscreen"
    :overflow="effectiveOverflow"
    :style="fullscreenStyle"
    class="re-dialog"
    :class="{
      're-dialog--draggable': draggable,
      're-dialog--fullscreen': isFullscreen,
      're-dialog--headless': headless,
      're-dialog--responsive': responsive,
      're-dialog--compact': compact,
    }"
    @update:model-value="(v: boolean) => emit('update:modelValue', v)"
    @open="emit('open')"
    @close="emit('close')"
    @closed="emit('closed')"
  >
    <!-- 业务自定义 header 优先透传（el-dialog → ReDialog 迁移时头部插槽不丢）。
         拖拽由 el-dialog 原生 draggable 接管：它把 mousedown 绑在 .el-dialog__header 上，
         整个 header 区域都是手柄，不需要再包一层 div。 -->
    <template v-if="$slots.header && !headless" #header>
      <slot name="header" />
    </template>

    <!-- 无业务 header 时，draggable / fullscreenable 使用自带 header（拖拽 + 全屏按钮） -->
    <template v-else-if="(draggable || fullscreenable) && !headless" #header>
      <div class="re-dialog__header-inner">
        <span class="re-dialog__title">{{ title }}</span>
        <div class="re-dialog__header-actions">
          <ElButton
            v-if="fullscreenable"
            link

            :title="isFullscreen ? '退出全屏' : '全屏'"
            @click="toggleFullscreen"
          >
            <el-icon><Crop v-if="isFullscreen" /><FullScreen v-else /></el-icon>
          </ElButton>
        </div>
      </div>
    </template>

    <!-- headless + draggable：只留一条 44px 透明拖拽热区（el-dialog 原生 draggable 挂在 .el-dialog__header 上），
         不占内容高度；与 koi 主题的 .koi-dialog-header-drag 同规格 -->
    <template v-else-if="headless && draggable" #header>
      <div class="re-dialog__drag-strip" />
    </template>

    <slot />

    <!-- footer 三态：显式 false=不渲染；true=渲染自带按钮；未传=只渲染业务 #footer 插槽 -->
    <template v-if="footerMode !== false && (footerMode === true || !!$slots.footer)" #footer>
      <slot name="footer" :ok="onOk" :cancel="onCancel">
        <template v-if="footerMode === true">
          <ElButton v-if="showCancel" @click="onCancel">{{ cancelText }}</ElButton>
          <ElButton v-if="showOk" type="primary" :loading="confirmLoading" @click="onOk">{{ okText }}</ElButton>
        </template>
      </slot>
    </template>

    <!-- headless 圆心右上角关闭按钮 -->
    <ReDialogCloseFab v-if="showCloseFab" @click="closeByFab" />
  </ElDialog>
</template>

<style scoped>
/* 只保留「真正的插槽内容」样式：header 插槽由本组件模板渲染，会带上 scope id。
   凡是作用在 .el-dialog__header / __body / __footer 上的规则都不能留在这里 ——
   ElDialog 的根节点是 Teleport，这些选择器在产物里从未命中（见文件末尾非 scoped 块）。 */
.re-dialog__header-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-right: 20px;
}
.re-dialog__title {
  font-weight: 600;
  font-size: 13px;
}
.re-dialog__header-actions {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
</style>

<!--
  弹窗本体样式（间距 / 滚动 / 拖拽光标）必须放在「非 scoped」样式块里：

  ElDialog 的根节点是 <Teleport>，Vue 不会把本组件（ReDialog）的 scope id 加到
  teleport 出去的 .el-dialog 元素上 —— 因此 <style scoped> 里所有
  :deep(.el-dialog__*) 规则在实际产物体里【从未命中】。headless 布局与间距都依赖
  这些内部选择器，所以统一在这里用全局选择器书写（以 .re-dialog 前缀限定作用域，
  不会污染其他弹窗）。koi 主题与 DragLab 的 .ddl-tall.el-dialog 都是这个做法。
-->
<style>
/* ===== 间距：头尾压薄，把高度让给内容 ===== */

/**
 * 顶部 / 底部留白：Element Plus 原生给 .el-dialog 四周 16px 内边距；koi 主题又把
 * 顶部固定成 16px（--el-dialog-header-padding-top）。弹窗壳自己把上下各压到 4px：
 * 2 类 + !important，高于主题的 .el-dialog，能稳定生效。
 */
.el-dialog.re-dialog {
  padding-top: 4px !important;
  padding-bottom: 4px !important;
}

.re-dialog .el-dialog__header {
  cursor: default;
  /* 上下不留白，标题栏高度只由标题行本身决定；左右交给 .el-dialog 自身的 16px 内边距 */
  padding: 2px 0 6px !important;
  margin-right: 0 !important;
}
/* 可拖拽时 header 是原生手柄，给出 move 光标（原生 draggable 自身不设样式） */
.re-dialog--draggable:not(.re-dialog--fullscreen) .el-dialog__header {
  cursor: move;
  user-select: none;
}

/**
 * body 的内边距交给主题变量（koi 主题统一置 0，由各弹窗内容自行控制），
 * 这里只补上「内容超高就地滚动」的上限：头尾压薄后内容区从 84vh 提到 88vh。
 */
.re-dialog:not(.re-dialog--fullscreen) .el-dialog__body {
  max-height: calc(88vh - 88px);
  overflow-y: auto;
}
.re-dialog--fullscreen .el-dialog__body {
  height: calc(100vh - 100px);
  overflow: auto;
}

/* footer：Element 原生 padding-top 16px，这里压到 6px / 4px；左右仍交给 .el-dialog 的 16px */
.re-dialog .el-dialog__footer {
  padding: 6px 0 4px;
}

/* compact 模式下 footer 按钮进一步缩小（使用共享令牌） */
.re-dialog--compact .el-dialog__footer .el-button {
  height: var(--rm-compact-btn-height);
  padding: var(--rm-compact-btn-padding);
  font-size: var(--rm-compact-btn-font-size);
}

/* ===== headless ===== */
/* headless 不显示原生 header，但留出 body 顶部留白，避免被 CloseFab 挡住 */
.re-dialog--headless .el-dialog__header {
  display: none;
}
.re-dialog--headless .el-dialog__body {
  padding-top: 24px;
}
/* headless + draggable：把 header 恢复成一条悬浮于顶部的 44px 透明拖拽热区。
   el-dialog 原生 draggable 的 mousedown 绑在 .el-dialog__header 上 —— 若把它
   display:none，可拖拽的 headless 弹窗就没有任何可按住拖的把手。与 koi 的
   .koi-dialog-header-drag 同规格（44px、绝对定位、z-index 位于 CloseFab 之下）。 */
.re-dialog--headless.re-dialog--draggable {
  position: relative;
}
.re-dialog--headless.re-dialog--draggable .el-dialog__header {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  margin: 0;
  padding: 0;
  display: block;
  height: 44px;
  overflow: hidden;
  z-index: 6;
}
.re-dialog--headless.re-dialog--draggable .re-dialog__drag-strip {
  display: block;
  width: 100%;
  height: 44px;
}
/* 热区悬浮在内容上方、不占高度，body 顶部不再留白（避免内容被往下推） */
.re-dialog--headless.re-dialog--draggable .el-dialog__body {
  padding-top: 0;
}
</style>
