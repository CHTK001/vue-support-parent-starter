<script setup lang="ts">
/**
 * ReDialog koi 主题 —— 弹窗组件（KoiDialog 移植）
 *
 * 提供窗口壳能力：最小化浮标、全屏切换、关闭二次确认。
 * 使用方式与 default 主题对齐（v-model 控制显隐），
 * 额外支持 koi 专属能力：showWindowShell / fullscreen / footerHidden。
 */
import { ref, toRefs, computed, watch, onMounted, onUnmounted, onBeforeUnmount, type Component } from "vue";
import { ElDialog, ElButton } from "element-plus";
import { Aim } from "@element-plus/icons-vue";
import { useKoiWindowShell } from "./useKoiWindowShell";
import KoiShellHeaderActions from "./KoiShellHeaderActions.vue";
import KoiShellMinimizedDock from "./KoiShellMinimizedDock.vue";
import ReDialogCloseFab from "../../CloseFab.vue";

defineOptions({ name: "ReDialog", inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    title?: string;
    /** 标题下方副标题（可选；不传则与历史渲染完全一致） */
    subtitle?: string;
    /** 标题栏图标（Element Plus 图标组件） */
    icon?: Component;
    width?: number | string;
    /** 距视口顶部的偏移，对应 el-dialog 的 top（如 6vh） */
    top?: string;
    /** 标题与页脚内容是否居中排列 */
    center?: boolean;
    /** 弹窗是否在视口中水平、垂直居中 */
    alignCenter?: boolean;
    /**
     * 是否可拖拽（默认 true：未传即可按住标题栏拖动）。
     *
     * <p>历史沿革：koi 版早期把 draggable 钉死为 true（所有弹窗头部都可拖，
     * 含不应拖的对话框），后改为受控 prop 默认 false；2026-10-28 依用户决策
     * 恢复为<b>默认 true</b>，与 default 主题一致 —— 需显式不可拖的弹窗
     * 传 {@code :draggable="false"}。element-plus 以 transform 位移，与
     * align-center 的 flex 居中兼容，两者可同时开启。</p>
     */
    draggable?: boolean;
    /**
     * 是否允许拖拽越出视口（透传 el-dialog 的 `overflow`）。
     *
     * <p><b>为什么需要它</b>：el-dialog 的 `useDraggable` 只在 `overflow` 为假时 clamp，
     * 位移上限 {@code maxTop = clientHeight - targetTop - (targetHeight < clientHeight ? targetHeight : 0)}，
     * 弹窗**略矮于视口**时这个上限约等于 0，表现就是 <b>拖不动</b>
     * （element-plus 2.14 的 `use-draggable/index.mjs`）。koi 弹窗多为近满高的配置面板，
     * 正好落在拖不动的区间。</p>
     *
     * <p>未传值时就等于 `overflow="false"`：弹窗只在拖到视口边后停止，不会拖出视口、也不会回弹；
     * 业务真要自由空间就显式传 <code>overflow="true"</code>（放开钳制，接受弹窗被拖出视口）。</p>
     */
    overflow?: boolean;
    height?: number;
    closeOnClickModal?: boolean;
    /**
     * 是否按 Esc 关闭（对齐 el-dialog，默认 true）。
     *
     * <p>本变体 inheritAttrs 为 false，props 又没声明它，调用方传的
     * close-on-press-escape 会被静默丢弃，内层 el-dialog 永远用自己的默认 true ——
     * 全屏设计器（FlowDesignDialog）就是这样被一次 Esc 整个卸载的。基类 ReDialog
     * 早就声明并透传了该 prop，这里补齐。</p>
     */
    closeOnPressEscape?: boolean;
    confirmText?: string;
    cancelText?: string;
    destroyOnClose?: boolean;
    /** 打开时是否全屏（可用右上角按钮切换） */
    fullscreen?: boolean;
    loading?: boolean;
    /**
     * 底部区域（自带「确定/取消」按钮）控制，三态：
     *   - undefined（未传，新默认）：底部只在业务提供 #footer 插槽时渲染插槽内容，
     *     自带按钮默认不渲染；业务要自带按钮需显式传 footer-hidden="false"，
     *     或自己写 footer 插槽。
     *   - false：渲染自带「确定/取消」按钮（提供 #footer 插槽时插槽内容优先）—— 显式开启。
     *   - true：整个底部区域不渲染（即使有 #footer 插槽，与历史语义一致）。
     */
    footerHidden?: boolean;
    /**
     * 是否显示右上角关闭按钮（默认 true）。
     *
     * <p>与基类 ReDialog 对齐：业务传了自定义 #header 时，窗口壳不会被渲染，
     * 原生关闭按钮必须补上，否则弹窗只能靠底部「关闭」按钮兜底。</p>
     */
    showClose?: boolean;
    /** 是否显示右上角窗口壳操作区（收起 / 全屏 / 关闭） */
    showWindowShell?: boolean;
    /** 最小化按钮是否显示（默认仅关闭可见） */
    showMinimize?: boolean;
    /** 全屏按钮是否显示（默认仅关闭可见） */
    showFullscreen?: boolean;
    /** headless：隐藏标题栏，右上角圆形悬浮关闭按钮替代 */
    headless?: boolean;
    /** 紧凑模式：减小弹窗内边距 */
    compact?: boolean;
    /**
     * 浮层层级（透传给 el-dialog 的 z-index）；不传则由 Element Plus 自动分配。
     *
     * <p>自动分配是按 <b>浮层被创建</b>的顺序递增（PopupManager.nextZIndex，2000 起），
     * 而不是按「谁在谁里面」——所以一个<b>从弹窗内部打开的子弹窗</b>完全可能拿到
     * 比它父弹窗更低的层级，被父弹窗整片盖住、点击全被吃掉。
     * 2026-10-02 在采集器产物（dist）实测：全屏设计器壳拿到 2011，而从它内部打开的
     * 「抽取字段」对话框只拿到 2005，于是字段表整片点不动（占位弹层打不开）。
     * 把<b>作为容器</b>的那层钉在基线（如 2000，恰好低于自动分配的首个值 2001），
     * 壳内的弹窗与浮层再按正常顺序往上叠，两种构建形态就一致了。</p>
     */
    zIndex?: number;
  }>(),
  {
    title: "ReDialog",
    subtitle: "",
    icon: Aim,
    height: 0,
    width: 650,
    top: "",
    center: true,
    alignCenter: true,
    closeOnClickModal: false,
    closeOnPressEscape: true,
    confirmText: "",
    cancelText: "",
    destroyOnClose: false,
    fullscreen: false,
    loading: false,
    draggable: true,
    // overflow：跟 draggable 无关——直接透传 props.overflow（el-dialog 自己按 globalConfig 决定 clamp），
    // 与 footerHidden 同理，必须给 default: undefined —— Boolean prop「未传且无默认值」
    // 会被 Vue 强转成 false，三态里的「未传」将永远不可达。
    overflow: undefined,
    // footerHidden 必须显式给 default: undefined —— Boolean prop「未传且无默认值」
    // 会被 Vue 强转成 false（runtime-core resolvePropValue: isAbsent && !hasDefault → false），
    // 三态里的「未传」将永远不可达；default: undefined 使 hasOwn(default) 成立、跳过强转。
    footerHidden: undefined,
    showClose: true,
    showWindowShell: true,
    showMinimize: false,
    showFullscreen: false,
    headless: false,
    compact: false,
    // 默认不传：交给 Element Plus 自动分配，等同于修复前的行为
    zIndex: undefined,
  },
);

/** v-model 控制显隐（与 default 主题 API 对齐） */
const visible = defineModel<boolean>({ default: false });

/**
 * 本地可见性镜像：关闭时本地立即生效，不依赖父组件是否响应 update:modelValue
 * （防止 v-model 绑定只读 props 等错误用法——父不响应时弹窗也能关闭；父重新打开时再同步）
 */
const localOpen = ref(false);
watch(visible, (v) => { localOpen.value = v; }, { immediate: true });

const { loading, width } = toRefs(props);
const confirmLoading = ref(loading);

const {
  minimized,
  fullscreen: windowFullscreen,
  minimize,
  restoreFromDock,
  toggleFullscreen,
  clearMinimized,
  dockStackIndex,
} = useKoiWindowShell(visible, () => props.fullscreen);

/**
 * localOpen 与 visible 双向闭环：
 * el-dialog 内部关闭（ESC / 遮罩 / v-model）只更新 localOpen，
 * 这里把状态回传父级 v-model，并在关闭时清理最小化停靠。
 */
watch(localOpen, (v) => {
  visible.value = v;
  if (!v) {
    clearMinimized();
  }
});

const dialogFullscreen = computed(() => windowFullscreen.value);



/**
 * 拖拽结束后至少留在视口内的像素数（保证头部仍可见、可再次抓取）。
 *
 * @see onDocumentMouseUp
 */
const DRAG_KEEP_VISIBLE = 56;

/**
 * 传给 el-dialog 的 `overflow`：显式配置优先，不传时默认 `false`。
 *
 * <p>el-dialog 的 `useDraggable` 只会在 `overflow` 为假时对位移做视口钳制（拖到视口边就
 * 停、不越出视口）；ReDialog 也只在近满高弹窗的低效钳制区，才需要业务显式传
 * <code>overflow="true"</code> 放开钳制。此前「未传则跟随 {@link draggable}」等同于
 * 默认放开钳制，也即弹窗会随鼠标跑到视口外 — 这就是 ReDialog（el-dialog 壳）能拖出
 * 可视区域的原因。</p>
 *
 * <p>放开钳制后的兜底（{@link onDocumentMouseUp} 的
 * {@code DRAG_KEEP_VISIBLE} + {@code resetPosition}）是为显式传 `overflow` 的业务留的；
 * 默认钳制状态下弹窗到视口边就停，用不到它。</p>
 */
const effectiveOverflow = computed<boolean>(() => props.overflow ?? false);

/** el-dialog 实例句柄（取弹窗 DOM / 调 resetPosition） */
const dialogInstance = ref<DialogExposed | null>(null);

/**
 * ElDialog 通过 `defineExpose` 暴露的成员（这里只声明用到的两个）。
 *
 * <p>element-plus 的 `dialog.vue` 里 {@code __expose({ visible, dialogContentRef, resetPosition, handleClose })}，
 * 且 `expose` 经 `proxyRefs` 包装，故 {@code dialogContentRef} 取到的是已解包的 dialog-content
 * 组件实例（其 `$el` 即 `.el-dialog` 元素），不是 Ref。</p>
 */
interface DialogExposed {
  /** 内部 dialog-content 组件实例；其 $el 即 .el-dialog 元素 */
  dialogContentRef?: { $el?: HTMLElement } | null;
  /** 把拖拽位移归零（同时清掉 useDraggable 内部的 offset 记账） */
  resetPosition?: () => void;
}

/**
 * 拖拽结束兜底：被拖到视口外的弹窗拉回原价，保证永远抓得到。
 *
 * <p>放开 {@link effectiveOverflow} 之后弹窗可以被拖到任意位置，也就可能被拖出视口而
 * 无法再抓到。这里在每次 mouseup 后检查四个方向：只要有任一边界越出「保留区」，
 * 就用官方 {@code resetPosition} 归零。</p>
 *
 * <p>为什么用官方 {@code resetPosition} 而不是自己改写 {@code transform}：
 * `useDraggable` 内部维护了自己的 offset 记账，外部直接改样式会与它分叉，
 * 下一次拖拽弹窗会先跳一下。</p>
 */
function onDocumentMouseUp(): void {
  if (!props.draggable) return;
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
  if (!lost) return;
  dialogInstance.value?.resetPosition?.();
}

/** 弹窗打开期间才监听 document 上的 mouseup（关闭即摘，避免常驻全局监听） */
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

const windowWidth = ref(window.innerWidth);

const dialogWidth = computed(() => {
  if (dialogFullscreen.value) return "100%";
  if (windowWidth.value < 600) return "90%";
  const numericWidth = typeof width.value === "number" ? width.value : Number.parseFloat(String(width.value)) || windowWidth.value;
  if (numericWidth > windowWidth.value) return "90%";
  if (numericWidth > windowWidth.value * 0.95) return "95%";
  return width.value;
});

function handleResize() {
  windowWidth.value = window.innerWidth;
}

onMounted(() => window.addEventListener("resize", handleResize));
onUnmounted(() => window.removeEventListener("resize", handleResize));

const emit = defineEmits<{
  (e: "confirm"): void;
  (e: "ok"): void;
  (e: "cancel"): void;
  /**
   * 生命周期事件：显式声明并从内部 ElDialog 转发。
   *
   * <p>不声明时这些监听器留在 `$attrs` 里、靠 `<ElDialog v-bind="$attrs">` 透传，
   * 能工作但属隐式依赖；声明后由本组件负责转发，语义与 LDialog 的
   * open/close/closed 一致，从 LDialog 迁过来的页面不必改监听器。</p>
   *
   * <p><b>注意</b>：声明会把这些监听器从 `$attrs` 摘走，所以下面必须在 ElDialog
   * 上显式 emit，否则等于把事件丢掉。</p>
   */
  (e: "open"): void;
  (e: "close"): void;
  (e: "closed"): void;
}>();

function koiClose() {
  localOpen.value = false;
  visible.value = false;
  clearMinimized();
}

function koiConfirm() {
  // 通用版 ReDialog 发 ok，koi 版历史只发 confirm：两个都发，页面两种写法才能都生效
  emit("ok");
  emit("confirm");
}

function koiCancel() {
  emit("cancel");
  localOpen.value = false;
  visible.value = false;
  clearMinimized();
}

/** 编程式打开 */
function koiOpen() {
  visible.value = true;
}

/** 编程式快速关闭（跳过二次确认） */
function koiQuickClose() {
  clearMinimized();
  localOpen.value = false;
  visible.value = false;
}

defineExpose({ koiOpen, koiClose, koiQuickClose });
</script>

<template>
  <ElDialog
    ref="dialogInstance"
    v-bind="$attrs"
    class="koi-dialog-shell"
    :class="{ 'is-headless': headless, 'koi-dialog-compact': compact }"
    v-model="localOpen"
    :title="title"
    :width="dialogWidth"
    :top="top"
    :center="center"
    :align-center="alignCenter"
    :close-on-click-modal="closeOnClickModal"
    :close-on-press-escape="closeOnPressEscape"
    append-to-body
    modal-class="koi-dialog-modal"
    :draggable="draggable"
    :overflow="effectiveOverflow"
    :destroy-on-close="destroyOnClose"
    :fullscreen="dialogFullscreen"
    :z-index="props.zIndex"
    :loading="loading"
    :show-close="!headless && showClose && (!!$slots.header || !showWindowShell)"
    @open="emit('open')"
    @close="emit('close')"
    @closed="emit('closed')"
  >
    <!-- 业务自定义 header 优先：直接放进 ElDialog 的 #header，避免 ElDialog
         再按 title 渲染一层默认标题，造成双 header。 -->
    <template v-if="$slots.header && !headless" #header>
      <slot name="header" />
    </template>
    <!-- 无业务 header 时，showWindowShell/headless 使用窗口壳（默认标题 + 壳操作） -->
    <template v-else-if="showWindowShell || headless" #header>
      <div class="koi-dialog-custom-header" :class="{ 'is-empty': headless }">
        <template v-if="!headless">
          <span class="koi-dialog-header-left">
            <span v-if="icon" class="koi-dialog-header-icon-wrap">
              <el-icon class="koi-dialog-header-icon"><component :is="icon" /></el-icon>
            </span>
            <span v-if="subtitle" class="koi-dialog-header-titles">
              <span class="el-dialog__title">{{ title }}</span>
              <small class="koi-dialog-subtitle">{{ subtitle }}</small>
            </span>
            <span v-else class="el-dialog__title">{{ title }}</span>
          </span>
          <KoiShellHeaderActions
            :is-fullscreen="dialogFullscreen"
            :enabled="visible"
            :show-minimize="showMinimize"
            :show-fullscreen="showFullscreen"
            @minimize="minimize"
            @toggle-fullscreen="toggleFullscreen"
            @close="koiClose"
          />
        </template>
        <!-- headless：隐藏标题栏内容，仅保留一条极窄拖拽条 + 右上角关闭按钮 -->
        <template v-else>
          <span class="koi-dialog-header-drag" />
        </template>
      </div>
    </template>
    <ReDialogCloseFab
      v-if="headless"
      :size="28"
      @click="koiClose"
    />
    <div
      class="dialog-content-wrapper"
      :style="dialogFullscreen || !height ? { height: 'auto' } : { maxHeight: height + 'px' }"
    >
      <slot name="content">
        <slot></slot>
      </slot>
    </div>
    <!-- 底部区域三态：未传=仅业务 #footer 插槽时渲染；false=渲染自带按钮；true=整个不渲染 -->
    <template
      v-if="footerHidden === false || (footerHidden !== true && !!$slots.footer)"
      #footer
    >
      <slot name="footer" v-bind="{ confirm: koiConfirm, cancel: koiCancel, loading: confirmLoading }">
        <span v-if="footerHidden === false" class="dialog-footer">
          <el-button class="koi-btn-borderless" type="primary" :loading="confirmLoading" @click="koiConfirm">
            {{ confirmText || "确定" }}
          </el-button>
          <el-button class="koi-btn-borderless" type="danger" @click="koiCancel">
            {{ cancelText || "取消" }}
          </el-button>
        </span>
      </slot>
    </template>
  </ElDialog>
  <KoiShellMinimizedDock
    :visible="minimized"
    :title="title"
    tooltip="恢复窗口"
    :stack-index="dockStackIndex"
    @restore="restoreFromDock"
  />
</template>

<style lang="scss" scoped>
.koi-dialog-custom-header {
  position: relative;
  top: -4px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  min-width: 0;
  padding-right: 0;
  padding-bottom: 0;

  .koi-dialog-header-left {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
  }

  .koi-dialog-header-icon-wrap {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
    flex-shrink: 0;
    border: 1px solid var(--el-border-color);
    border-radius: var(--el-radius-md, 6px);
    background: var(--el-bg-color);
  }

  .koi-dialog-header-icon {
    font-size: 11px;
    color: var(--el-color-primary);
    flex-shrink: 0;
  }

  /* 标题 + 副标题纵向排布（subtitle 未传时不渲染，历史弹窗零影响） */
  .koi-dialog-header-titles {
    display: inline-flex;
    flex-direction: column;
    justify-content: center;
    min-width: 0;
    gap: 2px;
  }

  .koi-dialog-subtitle {
    font-size: 12px;
    font-weight: 400;
    line-height: 1.3;
    color: var(--el-text-color-secondary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .el-dialog__title {
    flex: 1;
    min-width: 0;
    font-size: 13px;
    line-height: 1.3;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.dialog-content-wrapper {
  box-sizing: border-box;
  padding-right: 4px;
  overflow: hidden auto;
  /* 由弹窗 flex 布局约束高度：占满中间剩余空间并在内部滚动 */
  flex: 1 1 auto;
  min-height: 0;

  & > * {
    padding-right: 4px;
  }

  &--headless {
    padding-top: 16px;
  }
}

.koi-btn-borderless {
  border: none;
  box-shadow: none;
}

/* compact 模式（使用共享令牌） */
.koi-dialog-compact .koi-dialog-custom-header {
  padding-bottom: var(--rm-compact-koi-header-padding-bottom);
}
.koi-dialog-compact .koi-dialog-header-icon-wrap {
  width: var(--rm-compact-koi-icon-size);
  height: var(--rm-compact-koi-icon-size);
}
.koi-dialog-compact .koi-dialog-header-icon {
  font-size: var(--rm-compact-koi-icon-font-size);
}
.koi-dialog-compact .el-dialog__title {
  font-size: var(--rm-compact-title-font-size);
}
.koi-dialog-compact .dialog-footer .koi-btn-borderless {
  height: var(--rm-compact-btn-height);
  padding: var(--rm-compact-btn-padding);
  font-size: var(--rm-compact-btn-font-size);
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>

<style lang="scss">
.koi-dialog-shell .el-dialog__header {
  margin-right: 0;
  /* 紧凑 header：大幅降低上下内边距，header 高度由约 48px 降到约 26px */
  padding: 3px 20px !important;
  /* 去除头部底色，并与下方内容留出一点间距 */
  background: transparent !important;
  margin-bottom: 8px;
}

/* 紧凑 body 内边距 */
.koi-dialog-shell .el-dialog__body {
  padding: 8px !important;
}

/* 全屏时内容区放开最大高度，允许铺满整个屏幕 */
.koi-dialog-shell.is-fullscreen .dialog-content-wrapper {
  max-height: none;
}

/* 整个弹窗：flex 纵向布局，整体不超过视口高度（头尾固定、中间 body 滚动） */
.koi-dialog-shell {
  display: flex;
  flex-direction: column;
  max-height: 92vh;
}
.koi-dialog-shell .el-dialog__header {
  flex: 0 0 auto;
}
.koi-dialog-shell .el-dialog__body {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
}
.koi-dialog-shell .el-dialog__footer {
  flex: 0 0 auto;
}
/* 全屏时铺满，不受 92vh 限制 */
.koi-dialog-shell.is-fullscreen {
  max-height: 100vh;
}

/* 紧凑 footer：降低上下内边距，footer 高度由约 47px 降到约 34px */
.koi-dialog-shell .el-dialog__footer {
  padding: 4px 20px 6px !important;
}

/* footer 内按钮统一高度与字重（业务侧传入的 ReButton 默认偏大，弹窗内收窄）。
   min-width/圆角/字重为 Vue 体系弹窗 footer 按钮标准（源自 eduai /edu/students
   弹窗的既有观感：96px 最小宽、12px 圆角、600 字重），统一在此收敛，
   各应用不要在页面里各自覆盖。 */
.koi-dialog-shell .el-dialog__footer .el-button {
  height: 26px;
  min-height: 26px;
  min-width: 96px;
  padding: 0 14px;
  font-size: 12px;
  font-weight: 600;
  border-radius: var(--el-radius-lg, 12px);
}

/* compact 模式：进一步缩小 body 内边距 */
.koi-dialog-shell.koi-dialog-compact .el-dialog__body {
  padding: var(--rm-compact-body-padding);
}

.koi-dialog-shell--headless .el-dialog__header {
  display: none;
}

/* 弹窗遮罩：纯色扁平遮罩 */
.koi-dialog-modal {
  background-color: rgba(0, 0, 0, 0.45);
}

/* headless：隐藏标题内容，仅保留一条悬浮于顶部的拖拽热区条（不占内容高度，可拖动），CloseFab 浮于右上角 */
.koi-dialog-shell.is-headless {
  position: relative;
}

/* 拖拽热区：44px 透明条覆盖在 body 顶部，扩大可拖拽范围 */
.koi-dialog-shell.is-headless .el-dialog__header {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  margin: 0;
  padding: 0;
  height: 44px;
  overflow: hidden;
  z-index: 6;
}

.koi-dialog-shell.is-headless .koi-dialog-custom-header.is-empty {
  height: 44px;
  padding: 0;
}

.koi-dialog-shell.is-headless .koi-dialog-header-drag {
  display: block;
  width: 100%;
  height: 44px;
}

.koi-dialog-shell.is-headless .el-dialog__body {
  padding-top: 0;
}

/* 弹窗本体：加大圆角（保持不透明白色背景） */
.koi-dialog-shell {
  --el-dialog-border-radius: var(--el-radius-xl);
  border-radius: var(--el-radius-xl);
  overflow: hidden;
  box-shadow:
    0 1px 2px rgba(0, 0, 0, 0.06),
    0 0 0 1px rgba(0, 0, 0, 0.04);
}
</style>
