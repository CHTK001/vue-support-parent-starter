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
import { computed, defineAsyncComponent, ref, watch } from "vue";
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
     * <p><b>为什么需要它</b>：el-dialog 的 `useDraggable` 在 `overflow` 为假时会把位移
     * 钳制成「整个弹窗留在视口内」——竖向上限是
     * {@code maxTop = clientHeight - targetTop - (targetHeight < clientHeight ? targetHeight : 0)}
     * （element-plus 2.14 的 use-draggable/index.mjs）。弹窗**略矮于视口**时这个上限几乎为 0，
     * 表现就是<b>拖不动</b>。历史缺陷：default 主题此前**不透传 overflow**，近满高弹窗
     * （如文件预览弹层 `height: calc(100vh - 20px)`）完全拖不动；同缺陷 koi 主题已修
     * （见 theme/koi/ReDialog.vue 的 overflow 说明）。</p>
     *
     * <p>三态：显式传 true/false 即覆盖；<b>未传时回到 element-plus 的严格视口包含行为</b>，
     * 弹窗只能被拖到视口边，不会拖出视口也不会再弹回来；
     * 业务要自由空间就显式传 true（放开钳制就接受弹窗可能被拖出视口）。</p>
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
    // overflow 三态（未传=跟随 draggable）。Boolean prop「未传且无默认值」会被 Vue 强转成
    // false，三态里的「未传」会不可达，必须显式 default: undefined（同 showFooter 注释）。
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
 * 拖拽：el 布局交给 el-dialog 原生 draggable，modern 布局用自己的实现。
 *
 * 历史缺陷（2026-10-23 修复）：此前 el 布局也在这层手写 mousedown，
 * 把位移写进 <ElDialog :style="{ left, top, marginLeft: 0, marginTop: 0 }">。
 * 但 el-dialog 的 `style` 由 useDialog 计算后只产出 CSS 变量
 * （--el-dialog-margin-top / --el-dialog-width）合并到 .el-dialog 上，
 * 而 .el-dialog 本身是「非定位」的普通块级元素（居中靠 margin: ... auto），
 * 于是 left/top 完全不生效 —— 表现为拖拽完全无反应。
 *
 * 原生 draggable 用 hooks/use-draggable，把 mousedown 绑在 headerRef 上、
 * 以 transform: translate() 位移，并带视口边界 clamp，行为正确且不会跑出屏幕。
 * 因此 el 布局只负责把 draggable 透传下去，不再自绘位移。
 *
 * overflow（放开视口钳制）：默认回到 el-dialog 的原始 clamp（不允许拖出视口，
 * 拖到视口边就停住），可以用显式 `overflow` 覆盖开关。
 * ========================================================================== */

/**
 * 传给 el-dialog 的 `overflow`：显式配置优先，否则回到 el-dialog 的原始钳制——
 * 拖拽只允许把弹窗磨到视口边，不会磨出视口，也不会再弹回来。
 *
 * <p>element-plus 的 `useDraggable` 在 {@code overflow} 为假时，把位移（`translate`）
 * 钳制在 `minLeft/maxLeft` / `minTop/maxTop` 范围内，其中
 * {@code maxTop = clientHeight - targetTop - (targetHeight < clientHeight ? targetHeight : 0)}
 * ——弹窗可以拖出居中的空白，但移不进视口之外；拖到边界就停住，是 el-dialog 原本的
 * 「不允许拖出视口」语义，没有回弹。</p>
 */
const effectiveOverflow = computed<boolean>(() => props.overflow ?? false);



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
.re-dialog :deep(.el-dialog__header) {
  cursor: default;
  padding: 4px 20px 0 !important;
  margin-right: 0 !important;
}
/* 可拖拽时 header 是原生手柄，给出 move 光标（原生 draggable 自身不设样式） */
.re-dialog--draggable:not(.re-dialog--fullscreen) :deep(.el-dialog__header) {
  cursor: move;
  user-select: none;
}
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
.re-dialog--fullscreen :deep(.el-dialog__body) {
  height: calc(100vh - 120px);
  overflow: auto;
}
.re-dialog :deep(.el-dialog__body) {
  padding: 8px 20px 12px;
}
/* 非全屏弹窗：body 超过视口高度时出现滚动条，避免内容被裁切（footer 保持在滚动区外） */
.re-dialog:not(.re-dialog--fullscreen) :deep(.el-dialog__body) {
  max-height: calc(84vh - 96px);
  overflow-y: auto;
}
/* compact 模式下 footer 按钮进一步缩小（使用共享令牌） */
.re-dialog--compact :deep(.el-dialog__footer .el-button) {
  height: var(--rm-compact-btn-height);
  padding: var(--rm-compact-btn-padding);
  font-size: var(--rm-compact-btn-font-size);
}
</style>

<!--
  headless 拖拽热区必须放在「非 scoped」样式块里：

  ElDialog 的根节点是 <Teleport>，Vue 不会把本组件（ReDialog）的 scope id 加到
  teleport 出去的 .el-dialog 元素上 —— 因此 <style scoped> 里所有 :deep(.el-dialog__*)
  规则在实际产物体里【从未命中】。headless 布局又依赖这些内部选择器把 header 变成
  热区，所以这里单独用全局选择器书写（以 .re-dialog--headless 前缀限定作用域，
  不会污染其他弹窗）。koi 主题与 DragLab 的 .ddl-tall.el-dialog 都是这个做法。
-->
<style>
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
