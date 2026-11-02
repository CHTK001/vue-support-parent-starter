<template>
  <!--
    ReLoader —— 统一加载组件。
    两种用法：
      · 声明式：<ReLoader v-model:loading="busy" variant="wave" text="正在处理…">内容</ReLoader>
      · 命令式：ReLoader.open({ text, timeout, onClose }) → handle.setProgress(50)
    三种与内容的关系（mode）见 types.ts。
  -->
  <div class="re-loader" :class="[`re-loader--${mode}`, { 'is-loading': shown, 'is-fullscreen': fullscreen }]">
    <!-- 载入内容：mode=skeleton 时用骨架占位；replace 时加载中不渲染内容 -->
    <div v-if="mode === 'skeleton' && shown" class="re-loader__skeleton" :style="skeletonStyle">
      <slot name="skeleton" :blocks="skeletonBlocks" :layout="skeletonShape.layout">
        <!--
          内置骨架：按 skeletonShape 描述的结构生成（列表/表格/卡片/表单/文章），
          形状与最终内容对得上 —— 加载完成时不会"跳一下"。
          不传 skeletonShape 时退回原来的 4 条列表骨架。
        -->
        <template v-if="skeletonShape.layout">
          <div
            v-for="(b, i) in skeletonBlocks"
            :key="i"
            class="re-loader__bone-block"
            :class="`is-${b.kind}`"
            :style="{ width: b.width, height: b.height }"
          />
        </template>
        <div v-else class="re-loader__bone" :style="boneStyle">
          <span v-for="n in 4" :key="n" class="re-loader__bone-bar" :class="{ 'is-short': n === 4 }" />
        </div>
      </slot>
    </div>
    <div v-else-if="!(mode === 'replace' && shown)" class="re-loader__content">
      <slot />
    </div>

    <!-- 遮罩 + 动画。delay 生效前不加 is-on，避免快请求闪一下 -->
    <Transition name="re-loader-fade">
      <div v-if="shown" class="re-loader__mask" :class="{ 'has-mask': mask }" @click.self="onMaskClick">
        <div class="re-loader__box" :class="{ 'is-auto': autoSize }">
          <!-- 失败态：不显示动画与进度，改为「重试 / 关闭」两个出口。
               网络抖一下不该让人从头再走一遍流程，所以这里给一条重试路径。 -->
          <template v-if="failed">
            <div class="re-loader__error">
              <el-icon :size="22"><WarningFilled /></el-icon>
              <span class="re-loader__error-text">{{ errorMessage || errorText || '加载失败' }}</span>
            </div>
            <div class="re-loader__actions">
              <el-button size="small" @click="emit('close', 'manual')">关闭</el-button>
              <el-button size="small" type="primary" :loading="retrying" @click="emit('retry')">
                重试
              </el-button>
            </div>
          </template>

          <template v-else>
            <!-- 尺寸与主色统一在 wrapper 上算好（sizing.ts），三个变体只消费变量 -->
            <div class="re-loader__anim" :class="{ 'is-auto': autoSize, 'is-paused': !pageVisible }"
              :style="animVars">
              <slot name="animation" :percent="percent" :variant="variant">
                <ProgressBar v-if="variant === 'progress'" :percent="percent" />
                <WaveRise v-else-if="variant === 'wave'" :percent="percent" :size="sizeMode"
                  :show-percent="percent !== null" />
                <TechSpin v-else :size="sizeMode" />
              </slot>
            </div>

            <div v-if="text || $slots.text" class="re-loader__text">
              <slot name="text">{{ text }}</slot>
            </div>

            <div v-if="closable || $slots.actions" class="re-loader__actions">
              <slot name="actions" :close="close" :cancel="cancel">
                <el-button v-if="closable" size="small" @click="cancel">取消</el-button>
              </slot>
            </div>
          </template>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
/**
 * ReLoader —— 默认加载动画组件。
 *
 * <p>设计取舍：</p>
 * <ul>
 *   <li><b>延迟显示 + 最短展示</b>：{@code delay} 让 200ms 内返回的请求不闪一下遮罩；
 *       {@code minDuration} 让"闪一下就消失"不出现。两者合起来才是体感稳定的加载态。</li>
 *   <li><b>超时自动关闭</b>：{@code timeout} 到点自动收尾并回调 {@code onTimeout} ——
 *       请求悬挂时不能让用户无限等（后端慢查询/断网都会走到这里）。</li>
 *   <li><b>不停动画</b>：reduced-motion 下动画放慢但不停止，见各变体注释。</li>
 * </ul>
 */
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { ElButton } from "element-plus";
import { WarningFilled } from "@element-plus/icons-vue";
import ProgressBar from "./variants/ProgressBar.vue";
import WaveRise from "./variants/WaveRise.vue";
import TechSpin from "./variants/TechSpin.vue";
import { animSizeVars } from "./sizing";
import { buildSkeleton, skeletonVars, type SkeletonShape } from "./skeleton";
import { pageVisible } from "./visibility";
import type { ReLoaderCloseReason, ReLoaderMode, ReLoaderSizeValue, ReLoaderVariant } from "./types";

const props = withDefaults(
  defineProps<{
    /** 是否加载中（配合 v-model:loading 使用） */
    loading?: boolean;
    /** 动画形态 */
    variant?: ReLoaderVariant;
    /** 与内容的关系：overlay / replace / skeleton */
    mode?: ReLoaderMode;
    /** 提示文案 */
    text?: string;
    /** 0-100；null 为不确定进度 */
    percent?: number | null;
    /**
     * 尺寸：{@code sm|md|lg} 固定档位 / 数字=精确像素 / {@code auto}=自适应容器。
     * 自适应在全屏遮罩下以视口短边为基准，在局部容器里以容器宽度为基准。
     */
    size?: ReLoaderSizeValue;
    /** 动画主色；不传沿用 Element Plus 主色 */
    color?: string;
    /** 是否全屏固定遮罩 */
    fullscreen?: boolean;
    /** 是否画遮罩底色 */
    mask?: boolean;
    /** 是否提供「取消」入口 */
    closable?: boolean;
    /** 延迟显示（毫秒） */
    delay?: number;
    /** 最短展示时长（毫秒） */
    minDuration?: number;
    /** 超时自动关闭（毫秒，0=不限） */
    timeout?: number;
    /** 骨架高度（mode=skeleton 且未自定义 #skeleton 时生效） */
    skeletonHeight?: string;
    /**
     * 骨架结构描述（mode=skeleton 时生效）。
     *
     * <p>不传则退回默认的 4 条列表骨架。传了就按描述生成对应形状 ——
     * 表格给表格骨架、表单给表单骨架，避免"骨架形状和内容对不上"导致的布局跳动。</p>
     */
    skeletonShape?: SkeletonShape;
    /** 点击遮罩是否关闭 */
    closeOnClickMask?: boolean;
    /** 是否处于失败态（显示重试/关闭，而非动画） */
    failed?: boolean;
    /** 失败时的错误文案 */
    errorMessage?: string;
    /** 失败态的兜底文案 */
    errorText?: string;
    /** 是否正在重试（禁用重试按钮） */
    retrying?: boolean;
    /** 是否支持按 Esc 取消（默认 true，仅 closable 时生效） */
    cancelOnEsc?: boolean;
  }>(),
  {
    loading: false,
    // 默认动画 = 科技双环（最初的科技感加载）。
    // 首屏 loader 走的是 public/loader.js，与本组件无关；这里只保证
    // ReLoader 自身在各处（页面遮罩 / 请求层 / ReAsync）观感一致。
    variant: "spin",
    mode: "overlay",
    text: "",
    percent: null,
    size: "md",
    color: "",
    fullscreen: true,
    mask: true,
    closable: false,
    delay: 0,
    minDuration: 0,
    timeout: 0,
    skeletonHeight: "160px",
    skeletonShape: undefined,
    closeOnClickMask: false,
    failed: false,
    errorMessage: "",
    errorText: "",
    retrying: false,
    cancelOnEsc: true,
  },
);

const emit = defineEmits<{
  (e: "update:loading", v: boolean): void;
  (e: "open"): void;
  (e: "close", reason: ReLoaderCloseReason): void;
  (e: "progress", percent: number | null): void;
  (e: "timeout"): void;
  /** 用户请求取消（应由上层真正中止底层请求） */
  (e: "cancel"): void;
  /** 用户请求重试 */
  (e: "retry"): void;
}>();

/** 实际渲染的显隐：受 delay / minDuration 调制 */
const shown = ref(false);

/** 是否自适应尺寸（供样式做额外处理） */
const autoSize = computed(() => props.size === "auto");

/** 骨架结构描述（缺省时 layout 为空 → 走默认列表骨架） */
const skeletonShape = computed<SkeletonShape>(() => props.skeletonShape ?? {});

/** 按结构生成的骨架块 */
const skeletonBlocks = computed(() => buildSkeleton(skeletonShape.value));

/** 默认骨架容器样式（间距变量） */
const skeletonStyle = computed(() => skeletonVars(skeletonShape.value));

/**
 * 无 skeletonShape 时的骨架块样式。
 *
 * <p>骨架高度（skeletonHeight）只作为最小高度保底，骨架区不再被它锁死高度——
 * 容器有多高骨架就占多高，避免加载态只占 160px/240px 而剩余空间空着。</p>
 */
const boneStyle = computed(() =>
  props.skeletonHeight ? { '--rl-sk-height': props.skeletonHeight } : {}
);

/**
 * 传给变体的档位字符串。
 *
 * <p>variant 内部还有 sm/md/lg 的兜底样式；当 size 是数字或 auto 时
 * 统一按 md 下发，真正的值由 wrapper 上的 CSS 变量覆盖。</p>
 */
const sizeMode = computed<"sm" | "md" | "lg">(() =>
  props.size === "sm" || props.size === "lg" ? props.size : "md",
);

/** 尺寸 + 主色统一以 CSS 变量下发 */
const animVars = computed<Record<string, string>>(() => {
  const vars: Record<string, string> = {
    ...animSizeVars(props.size, props.variant, props.fullscreen),
  };
  if (props.color) {
    vars["--rl-color"] = props.color;
  }
  return vars;
});
let delayTimer: ReturnType<typeof setTimeout> | null = null;
let timeoutTimer: ReturnType<typeof setTimeout> | null = null;
let minDurationTimer: ReturnType<typeof setTimeout> | null = null;
let shownAt = 0;
/** 关闭请求在最短展示未满时先挂起，到点再真正关闭 */
let pendingClose: ReLoaderCloseReason | null = null;

function clearTimer(t: ReturnType<typeof setTimeout> | null) {
  if (t) clearTimeout(t);
  return null;
}

function doShow() {
  shown.value = true;
  shownAt = Date.now();
  emit("open");
  if (props.timeout > 0) {
    timeoutTimer = clearTimer(timeoutTimer);
    timeoutTimer = setTimeout(() => {
      emit("timeout");
      close("timeout");
    }, props.timeout);
  }
}

function doHide(reason: ReLoaderCloseReason) {
  shown.value = false;
  timeoutTimer = clearTimer(timeoutTimer);
  minDurationTimer = clearTimer(minDurationTimer);
  pendingClose = null;
  emit("close", reason);
}

/** 关闭：尊重 minDuration（未满则挂起到满后再关） */
function close(reason: ReLoaderCloseReason = "manual") {
  const elapsed = shown.value ? Date.now() - shownAt : Number.MAX_SAFE_INTEGER;
  const remain = props.minDuration - elapsed;
  if (shown.value && remain > 0) {
    pendingClose = reason;
    minDurationTimer = clearTimer(minDurationTimer);
    minDurationTimer = setTimeout(() => {
      doHide(pendingClose ?? reason);
    }, remain);
    return;
  }
  doHide(reason);
}

/** 打开 */
function open() {
  delayTimer = clearTimer(delayTimer);
  pendingClose = null;
  if (props.delay > 0) {
    delayTimer = setTimeout(doShow, props.delay);
  } else {
    doShow();
  }
}

function onMaskClick() {
  if (props.closeOnClickMask) close("manual");
}

/**
 * 取消：通知上层真正中止底层请求，然后关闭遮罩。
 *
 * <p>组件自己无法中止请求（它不知道请求在哪），所以只发事件；由上层决定
 * 是 abort 掉请求还是仅关闭遮罩。</p>
 */
function cancel() {
  emit("cancel");
  close("cancel");
}

/**
 * Esc 取消。
 *
 * <p>只在「可取消」且「未处于失败态」时生效 —— 失败态按 Esc 应该直接关闭，
 * 而不是重试。另外要避开输入框里的 Esc：用户在文本框里按 Esc 只想清内容，
 * 不该把整个遮罩关掉。</p>
 */
function onKeydown(e: KeyboardEvent) {
  if (e.key !== "Escape") return;
  if (!props.closable && !props.failed) return;
  if (!props.cancelOnEsc) return;
  if (!shown.value) return;
  const el = e.target as HTMLElement | null;
  const tag = (el?.tagName || "").toLowerCase();
  if (tag === "input" || tag === "textarea" || el?.isContentEditable) return;
  e.stopPropagation();
  // 失败态按 Esc 是「放弃这次操作」，直接关闭；加载态才是「取消」
  if (props.failed) {
    close("manual");
    return;
  }
  cancel();
}

watch(
  () => props.loading,
  (v) => {
    if (v) {
      open();
    } else if (shown.value || delayTimer) {
      delayTimer = clearTimer(delayTimer);
      // 延迟期还没显示就取消：无需走 minDuration（用户根本没看见）
      if (!shown.value) {
        pendingClose = null;
      } else {
        close("auto");
      }
    }
  },
  { immediate: true },
);

watch(
  () => props.percent,
  (v) => emit("progress", v ?? null),
);

onBeforeUnmount(() => {
  clearTimer(delayTimer);
  clearTimer(timeoutTimer);
  clearTimer(minDurationTimer);
  window.removeEventListener("keydown", onKeydown);
});

/**
 * Esc 监听：**在挂载时就注册**，而不是等 shown 变 true。
 *
 * <p>为什么不用 watch(shown)：服务层用 {@code h(ReLoader, ...)} 渲染，
 * 组件会随实例列表变化被复用/重建，watch(shown) 的注册时机与实际显示状态
 * 存在竞态 —— 实测监听从未注册，Esc 完全不响应（点「取消」按钮却正常，
 * 说明 onCancel 通路没问题，纯粹是监听没挂上）。</p>
 *
 * <p>挂载即注册没有副作用：{@link onKeydown} 内部先判 {@code props.closable}
 * 与 {@code props.failed}，不满足条件直接返回。</p>
 */
onMounted(() => {
  window.addEventListener("keydown", onKeydown);
});

defineExpose({ open, close, cancel, shown: computed(() => shown.value) });
defineOptions({ name: "ReLoader" });
</script>

<style scoped>
.re-loader {
  position: relative;
  width: 100%;
}

/* 骨架态下，ReLoader 区域完整撑满父容器高度（骨架高度是最小值，不是死值） */
.re-loader.re-loader--skeleton {
  display: flex;
  flex-direction: column;
  min-height: 100%;
}

.re-loader__content {
  width: 100%;
}

/* 遮罩：默认绝对定位盖在自身容器上；fullscreen 时改为 fixed 盖住视口 */
.re-loader__mask {
  position: absolute;
  inset: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: inherit;
}

.re-loader__mask.has-mask {
  background: color-mix(in srgb, var(--el-bg-color) 72%, transparent);
  backdrop-filter: blur(1.5px);
}

.re-loader.is-fullscreen > .re-loader__mask {
  position: fixed;
  z-index: 2100;
  /*
    **不拦截交互**。
    加载遮罩只是"正在处理"的视觉提示，用户仍需要能点侧栏/按钮离开 ——
    实测踩到：遮罩会把整个页面的点击都吃了（elementFromPoint 命中的是遮罩本身），
    侧栏点不动、设置项点不动。
    唯一例外：显式声明 closable（提供"取消"入口）时才允许点击。
  */
  pointer-events: none;
}

/* 可取消时恢复交互：否则「取消」按钮点不到 */
.re-loader.is-fullscreen > .re-loader__mask:has(.re-loader__actions) {
  pointer-events: auto;
}

/*
  全屏遮罩：不透明底 + **不画卡片**。
  为什么：全屏加载态是"整页被阻塞"，此时若再叠一层半透明底 + 带阴影的卡片，
  视觉上会多出一次"弹起"（内容 → 半透明层 → 卡片），观感割裂。
  局部遮罩仍保留卡片 —— 它盖在内容之上，需要一个承载面。
*/
.re-loader.is-fullscreen > .re-loader__mask.has-mask {
  background: var(--el-bg-color);
  backdrop-filter: none;
}

.re-loader.is-fullscreen .re-loader__box {
  min-width: 0;
  padding: 0;
  background: none;
  box-shadow: none;
  border: none;
  /*
    关键：全屏时**动画必须精确落在视口中心**。
    若把「动画 + 文案」整体居中，动画会被文案顶高约半个文案高度 ——
    动画本身看起来就"不在中心"，切换/出现时位置对不上。
    所以文案/按钮改为绝对定位挂在动画下方，不参与居中计算。
  */
  position: relative;
}

.re-loader.is-fullscreen .re-loader__text {
  position: absolute;
  top: calc(100% + 12px);
  left: 50%;
  transform: translateX(-50%);
  white-space: nowrap;
}

.re-loader.is-fullscreen .re-loader__actions {
  position: absolute;
  top: calc(100% + 44px);
  left: 50%;
  transform: translateX(-50%);
  white-space: nowrap;
}

.re-loader__box {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 18px 22px;
  border-radius: 14px;
  min-width: 148px;
}

/* 只有动画时不画卡片底，避免"空盒子"；有文案时才给一层承载（局部遮罩） */
.re-loader:not(.re-loader.is-fullscreen) .re-loader__mask.has-mask .re-loader__box {
  background: var(--el-bg-color-overlay, var(--el-bg-color));
  box-shadow: 0 6px 24px rgb(0 0 0 / 10%);
  border: 1px solid var(--el-border-color-lighter);
}

.re-loader__text {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  text-align: center;
  max-width: 260px;
}

/* 动画容器：尺寸变量在这里注入（sizing.ts），变体只消费 */
.re-loader__anim {
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 自适应：给动画一条**确定宽度**的基准链。
   关键点：.re-loader__box 是 flex 项，默认宽度由内容决定；
   若这里只写 width:100% 而不给 box 定宽，百分比就没有基准可解，
   实测会塌成 0px。所以 auto 模式下把 box 定宽（占遮罩 92%，上限 420px），
   上级 anim / wave 再逐层 100% 传递，尺寸表达式才算得出来。 */
.re-loader__anim.is-auto {
  width: 100%;
}

.re-loader__box.is-auto {
  width: min(92%, 420px);
  min-width: 0;
}

.re-loader__actions {
  display: flex;
  gap: 8px;
}

/* 失败态：图标 + 文案，替代动画 */
.re-loader__error {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--el-color-danger);
  font-size: 13px;
  max-width: 280px;
}

.re-loader__error-text {
  color: var(--el-text-color-regular);
  word-break: break-word;
}

/* 内置骨架：骨架高度（skeletonHeight）是最小高度保底，骨架条撑满骨架块高度 */
.re-loader__bone {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 18px 16px;
  min-height: var(--rl-sk-height, 0);
  /* 骨架块占满骨架区，骨架条可在块内垂直居中（不歪在顶部） */
  flex: 1 1 0%;
  justify-content: center;
  box-sizing: border-box;
}

/* 结构化骨架容器：间距用变量（由 skeleton.ts 统一给出） */
.re-loader__skeleton {
  display: flex;
  flex-direction: column;
  gap: var(--rl-sk-gap, 12px);
  padding: 18px 16px;

  /* 骨架区撑满 ReLoader 整条高度（父级给得了确定高度就 100% 吃满） */
  flex: 1 1 0%;
  min-height: 100%;
}

/* 表格/表单的块需要成行排布，这里用 flex-wrap 承接多列单元格 */
.re-loader__skeleton:has(.is-head),
.re-loader__skeleton:has(.is-field) {
  display: block;
}

.re-loader__skeleton:has(.is-head) .is-head,
.re-loader__skeleton:has(.is-head) .is-cell {
  display: inline-block;
  vertical-align: top;
  margin-right: 8px;
  margin-bottom: var(--rl-sk-gap, 12px);
}

.re-loader__skeleton:has(.is-field) .is-label,
.re-loader__skeleton:has(.is-field) .is-field {
  display: inline-block;
  vertical-align: middle;
  margin-right: 12px;
  margin-bottom: var(--rl-sk-gap, 12px);
}

.re-loader__bone-bar {
  height: 20px;
  border-radius: 8px;
  background: linear-gradient(90deg,
      var(--el-fill-color-light) 25%,
      var(--el-fill-color) 50%,
      var(--el-fill-color-light) 75%);
  background-size: 200% 100%;
  animation: re-loader-shimmer 1.4s ease-in-out infinite;
}

.re-loader__bone-bar.is-short {
  width: 55%;
}

/* ---- 结构化骨架块 ----
   各类形状共用一套"呼吸"底色，差异只在尺寸与圆角：
   标题块更高更圆（像标题），表格单元格偏方，标签块窄而矮。 */
.re-loader__bone-block {
  display: block;
  border-radius: 6px;
  background: linear-gradient(
    90deg,
    var(--el-fill-color-light) 25%,
    var(--el-fill-color) 50%,
    var(--el-fill-color-light) 75%
  );
  background-size: 200% 100%;
  animation: re-loader-shimmer 1.4s ease-in-out infinite;
}

/* 表格：单元格与表头区分（表头略高、略深） */
.re-loader__bone-block.is-head {
  border-radius: 4px;
  background: linear-gradient(
    90deg,
    var(--el-fill-color) 25%,
    var(--el-fill-color-dark) 50%,
    var(--el-fill-color) 75%
  );
  background-size: 200% 100%;
}

.re-loader__bone-block.is-cell {
  border-radius: 4px;
}

/* 表单标签：矮而窄 */
.re-loader__bone-block.is-label {
  border-radius: 4px;
  height: 16px !important;
}

/* 表单输入框：略高的方块 */
.re-loader__bone-block.is-field {
  border-radius: 6px;
  border: 1px solid var(--el-border-color-lighter);
  background: var(--el-fill-color-lighter);
}

/* 头像：正圆 */
.re-loader__bone-block.is-avatar {
  border-radius: 50%;
  flex: none;
}

/* 标题块：更高更圆 */
.re-loader__bone-block.is-title {
  height: 22px !important;
  border-radius: 8px;
}

@keyframes re-loader-shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.re-loader-fade-enter-active,
.re-loader-fade-leave-active {
  transition: opacity 0.2s ease;
}

.re-loader-fade-enter-from,
.re-loader-fade-leave-to {
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .re-loader__bone-bar { animation-duration: 2.6s; }
  .re-loader-fade-enter-active,
  .re-loader-fade-leave-active { transition-duration: 0.12s; }
}
</style>

