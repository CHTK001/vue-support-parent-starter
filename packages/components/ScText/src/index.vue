<!--
 * ScText 文本组件
 * 支持 el-text 全部功能，并扩展副文本、提示、编辑、复制等功能
 * @author CH
 * @version 1.0.0
 * @since 2025-12-05
-->
<template>
  <el-tooltip v-if="showTooltip" :content="tooltipContent" :placement="tooltipPlacement" :effect="tooltipEffect" :disabled="!shouldShowTooltip" :raw-content="true">
    <component :is="renderComponent" />
  </el-tooltip>
  <component v-else :is="renderComponent" />
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted, h, type VNode } from "vue";
import { message } from "@repo/utils";
import TypeIt from "typeit";
import type { ScTextProps, ScTextType, ScTextSize, ScTextEffect, TypeItInstance } from "./types";

defineOptions({
  name: "ScText"
});

const props = withDefaults(defineProps<ScTextProps>(), {
  type: "default",
  size: "default",
  tag: "span",
  truncated: false,
  subtextPosition: "bottom",
  tooltipPlacement: "top",
  tooltipEffect: "dark",
  tooltipOnlyTruncated: true,
  editable: false,
  editAutoFocus: true,
  copyable: false,
  copySuccessText: "复制成功",
  bold: false,
  italic: false,
  underline: false,
  delete: false,
  mark: false,
  code: false,
  keyboard: false,
  effect: "none",
  gradientDirection: "to-right",
  typingSpeed: 50,
  typingLoop: false,
  highlightColor: "#ffc069",
  highlightCaseSensitive: false,
  target: "_blank",
  badgeType: "danger",
  badgeDot: false,
  loading: false,
  disabled: false,
  selectable: true,
  fetchImmediate: true,
  fetchErrorText: "加载失败",
  fetchInterval: 0,
  useTypeIt: false
});

const emit = defineEmits<{
  (e: "update:text", value: string): void;
  (e: "edit", value: string): void;
  (e: "edit-start"): void;
  (e: "edit-end", value: string): void;
  (e: "copy", value: string): void;
  (e: "click", event: MouseEvent): void;
  (e: "fetch-success", value: string): void;
  (e: "fetch-error", error: Error): void;
  (e: "typeit-complete"): void;
}>();

const slots = defineSlots<{
  default?: () => VNode[];
  subtext?: () => VNode[];
  prefix?: () => VNode[];
  suffix?: () => VNode[];
  tooltip?: () => VNode[];
}>();

// ==================== 状态 ====================
const textRef = ref<HTMLElement | null>(null);
const typeItRef = ref<HTMLElement | null>(null);
const isEditing = ref(false);
const editValue = ref("");
const editInputRef = ref<HTMLInputElement | null>(null);
const isTruncated = ref(false);
const typingText = ref("");
const typingIndex = ref(0);
let typingTimer: ReturnType<typeof setTimeout> | null = null;

// 远程调用状态
const fetchedText = ref<string>("");
const isFetching = ref(false);
const fetchError = ref(false);
let fetchIntervalTimer: ReturnType<typeof setInterval> | null = null;

// TypeIt 实例
let typeItInstance: TypeItInstance | null = null;

// ==================== 计算属性 ====================

/**
 * 是否显示提示
 */
const showTooltip = computed(() => {
  return props.tooltip || slots.tooltip;
});

/**
 * 提示内容
 */
const tooltipContent = computed(() => {
  return props.tooltip || "";
});

/**
 * 是否应该显示提示
 */
const shouldShowTooltip = computed(() => {
  if (!props.tooltipOnlyTruncated) return true;
  return isTruncated.value;
});

/**
 * 显示的文本
 */
const displayText = computed(() => {
  // 如果有远程调用错误，显示错误文本
  if (fetchError.value) {
    return props.fetchErrorText || "加载失败";
  }
  // 如果正在加载，返回空
  if (isFetching.value) {
    return "";
  }
  // 使用自定义打字机效果
  if (props.effect === "typing" && !props.useTypeIt) {
    return typingText.value;
  }
  // 优先使用远程获取的文本
  if (fetchedText.value) {
    return fetchedText.value;
  }
  return props.text || "";
});

/**
 * 是否显示加载状态
 */
const isLoading = computed(() => {
  return props.loading || isFetching.value;
});

/**
 * 容器样式类
 */
const containerClass = computed(() => {
  const classes = ["sc-text"];

  // 类型
  if (props.type && props.type !== "default") {
    classes.push(`sc-text--${props.type}`);
  }

  // 大小
  if (props.size && props.size !== "default") {
    classes.push(`sc-text--${props.size}`);
  }

  // 截断
  if (props.truncated) {
    classes.push("sc-text--truncated");
  }

  // 多行截断
  if (props.lineClamp) {
    classes.push("sc-text--line-clamp");
  }

  // 装饰
  if (props.bold) classes.push("sc-text--bold");
  if (props.italic) classes.push("sc-text--italic");
  if (props.underline) classes.push("sc-text--underline");
  if (props.delete) classes.push("sc-text--delete");
  if (props.mark) classes.push("sc-text--mark");
  if (props.code) classes.push("sc-text--code");
  if (props.keyboard) classes.push("sc-text--keyboard");

  // 特效
  if (props.effect && props.effect !== "none") {
    classes.push(`sc-text--effect-${props.effect}`);
  }

  // 状态
  if (props.disabled) classes.push("sc-text--disabled");
  if (!props.selectable) classes.push("sc-text--unselectable");
  if (props.loading) classes.push("sc-text--loading");

  // 链接
  if (props.href) classes.push("sc-text--link");

  // 可编辑
  if (props.editable) classes.push("sc-text--editable");

  // 副文本位置
  if (props.subtext || slots.subtext) {
    classes.push(`sc-text--has-subtext`);
    classes.push(`sc-text--subtext-${props.subtextPosition}`);
  }

  return classes;
});

/**
 * 容器样式
 */
const containerStyle = computed(() => {
  const style: Record<string, string> = {};

  // 字体
  if (props.fontFamily) {
    style.fontFamily = props.fontFamily;
  }

  // 字体大小
  if (props.fontSize) {
    style.fontSize = typeof props.fontSize === "number" ? `${props.fontSize}px` : props.fontSize;
  }

  // 字体粗细
  if (props.fontWeight) {
    style.fontWeight = String(props.fontWeight);
  }

  // 颜色
  if (props.color) {
    style.color = props.color;
  }

  // 多行截断
  if (props.lineClamp) {
    style["--line-clamp"] = String(props.lineClamp);
  }

  // 标记背景色
  if (props.mark && props.markColor) {
    style["--mark-color"] = props.markColor;
  }

  // 渐变
  if (props.effect === "gradient" && props.gradientColors?.length) {
    const direction = getGradientDirection(props.gradientDirection);
    style["--gradient"] = `linear-gradient(${direction}, ${props.gradientColors.join(", ")})`;
  }

  // 骨架屏宽度
  if (props.loading && props.loadingWidth) {
    style["--loading-width"] = typeof props.loadingWidth === "number" ? `${props.loadingWidth}px` : props.loadingWidth;
  }

  return style;
});

// ==================== 方法 ====================

/**
 * 获取渐变方向
 */
function getGradientDirection(direction?: string): string {
  const directionMap: Record<string, string> = {
    "to-right": "to right",
    "to-left": "to left",
    "to-top": "to top",
    "to-bottom": "to bottom",
    "to-top-right": "to top right",
    "to-top-left": "to top left",
    "to-bottom-right": "to bottom right",
    "to-bottom-left": "to bottom left"
  };
  return directionMap[direction || "to-right"] || "to right";
}

/**
 * 开始编辑
 */
function startEdit(): void {
  if (!props.editable || props.disabled) return;
  isEditing.value = true;
  editValue.value = props.text || "";
  emit("edit-start");
  nextTick(() => {
    if (props.editAutoFocus && editInputRef.value) {
      editInputRef.value.focus();
      editInputRef.value.select();
    }
  });
}

/**
 * 结束编辑
 */
function endEdit(): void {
  if (!isEditing.value) return;
  isEditing.value = false;
  emit("update:text", editValue.value);
  emit("edit", editValue.value);
  emit("edit-end", editValue.value);
}

/**
 * 取消编辑
 */
function cancelEdit(): void {
  isEditing.value = false;
  editValue.value = props.text || "";
}

/**
 * 编辑输入框按键事件
 */
function handleEditKeydown(event: KeyboardEvent): void {
  if (event.key === "Enter") {
    endEdit();
  } else if (event.key === "Escape") {
    cancelEdit();
  }
}

/**
 * 复制文本
 */
async function copyText(): Promise<void> {
  if (props.disabled) return;
  const text = props.copyText || props.text || "";
  try {
    await navigator.clipboard.writeText(text);
    message(props.copySuccessText, { type: "success" });
    emit("copy", text);
  } catch {
    message("复制失败", { type: "error" });
  }
}

/**
 * 处理点击事件
 */
function handleClick(event: MouseEvent): void {
  if (props.disabled) return;
  emit("click", event);
  if (props.editable && !isEditing.value) {
    startEdit();
  }
}

/**
 * 检查是否被截断
 */
function checkTruncation(): void {
  if (!textRef.value) return;
  const el = textRef.value;
  isTruncated.value = el.scrollWidth > el.clientWidth || el.scrollHeight > el.clientHeight;
}

/**
 * 启动打字机效果
 */
function startTypingEffect(): void {
  if (props.effect !== "typing" || !props.text) return;

  typingText.value = "";
  typingIndex.value = 0;

  const typeNextChar = () => {
    if (typingIndex.value < props.text!.length) {
      typingText.value += props.text![typingIndex.value];
      typingIndex.value++;
      typingTimer = setTimeout(typeNextChar, props.typingSpeed);
    } else if (props.typingLoop) {
      // 循环
      setTimeout(() => {
        typingText.value = "";
        typingIndex.value = 0;
        typeNextChar();
      }, 1000);
    }
  };

  typeNextChar();
}

/**
 * 停止打字机效果
 */
function stopTypingEffect(): void {
  if (typingTimer) {
    clearTimeout(typingTimer);
    typingTimer = null;
  }
}

// ==================== 远程调用方法 ====================

/**
 * 执行远程调用获取文本
 */
async function fetchRemoteText(): Promise<void> {
  if (!props.fetchText) return;

  isFetching.value = true;
  fetchError.value = false;

  try {
    const result = await props.fetchText();
    fetchedText.value = result;
    emit("fetch-success", result);

    // 如果使用 TypeIt，在获取文本后初始化
    if (props.useTypeIt) {
      nextTick(() => {
        initTypeIt(result);
      });
    }
  } catch (error) {
    fetchError.value = true;
    emit("fetch-error", error as Error);
  } finally {
    isFetching.value = false;
  }
}

/**
 * 开始轮询
 */
function startFetchInterval(): void {
  if (props.fetchInterval && props.fetchInterval > 0) {
    fetchIntervalTimer = setInterval(() => {
      fetchRemoteText();
    }, props.fetchInterval);
  }
}

/**
 * 停止轮询
 */
function stopFetchInterval(): void {
  if (fetchIntervalTimer) {
    clearInterval(fetchIntervalTimer);
    fetchIntervalTimer = null;
  }
}

/**
 * 刷新远程文本
 */
function refresh(): Promise<void> {
  return fetchRemoteText();
}

// ==================== TypeIt 方法 ====================

/**
 * 初始化 TypeIt
 */
function initTypeIt(text?: string): void {
  if (!props.useTypeIt) return;

  destroyTypeIt();

  nextTick(() => {
    if (!typeItRef.value) return;

    const options = {
      speed: props.typeItOptions?.speed ?? props.typingSpeed ?? 50,
      deleteSpeed: props.typeItOptions?.deleteSpeed,
      cursor: props.typeItOptions?.cursor ?? true,
      cursorChar: props.typeItOptions?.cursorChar ?? "|",
      cursorSpeed: props.typeItOptions?.cursorSpeed,
      loop: props.typeItOptions?.loop ?? props.typingLoop ?? false,
      loopDelay: props.typeItOptions?.loopDelay,
      startDelay: props.typeItOptions?.startDelay,
      waitUntilVisible: props.typeItOptions?.waitUntilVisible ?? false,
      lifeCycle: props.typeItOptions?.lifeCycle ?? false,
      afterComplete: () => {
        emit("typeit-complete");
        props.typeItOptions?.afterComplete?.();
      }
    };

    // 创建 TypeIt 实例
    typeItInstance = new TypeIt(typeItRef.value, options) as unknown as TypeItInstance;

    // 如果有多段文本序列
    if (props.typeItStrings && props.typeItStrings.length > 0) {
      props.typeItStrings.forEach((str, index) => {
        if (index > 0) {
          typeItInstance?.delete().pause(500);
        }
        typeItInstance?.type(str).pause(1000);
      });
    } else {
      // 单段文本
      const displayStr = text || props.text || "";
      typeItInstance?.type(displayStr);
    }

    typeItInstance?.go();
  });
}

/**
 * 销毁 TypeIt 实例
 */
function destroyTypeIt(): void {
  if (typeItInstance) {
    typeItInstance.destroy();
    typeItInstance = null;
  }
}

/**
 * 重置 TypeIt
 */
function resetTypeIt(): void {
  if (typeItInstance) {
    typeItInstance.reset();
  }
}

/**
 * 暂停 TypeIt
 */
function freezeTypeIt(): void {
  if (typeItInstance) {
    typeItInstance.freeze();
  }
}

/**
 * 恢复 TypeIt
 */
function unfreezeTypeIt(): void {
  if (typeItInstance) {
    typeItInstance.unfreeze();
  }
}

/**
 * 处理高亮文本
 */
function highlightText(text: string): VNode[] {
  if (!props.highlight || !text) {
    return [h("span", text)];
  }

  const keywords = Array.isArray(props.highlight) ? props.highlight : [props.highlight];
  if (keywords.length === 0) {
    return [h("span", text)];
  }

  // 创建正则表达式
  const flags = props.highlightCaseSensitive ? "g" : "gi";
  const pattern = keywords.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
  const regex = new RegExp(`(${pattern})`, flags);

  const parts = text.split(regex);
  const result: VNode[] = [];

  parts.forEach((part, index) => {
    if (keywords.some(k => (props.highlightCaseSensitive ? part === k : part.toLowerCase() === k.toLowerCase()))) {
      result.push(
        h(
          "span",
          {
            key: index,
            class: "sc-text__highlight",
            style: { backgroundColor: props.highlightColor }
          },
          part
        )
      );
    } else if (part) {
      result.push(h("span", { key: index }, part));
    }
  });

  return result;
}

/**
 * 渲染组件
 */
const renderComponent = computed(() => {
  // 加载状态（包括远程调用加载）
  if (isLoading.value) {
    return h("span", { class: containerClass.value, style: containerStyle.value }, [h("span", { class: "sc-text__skeleton" })]);
  }

  // 编辑状态
  if (isEditing.value) {
    return h("span", { class: containerClass.value, style: containerStyle.value }, [
      h("input", {
        ref: editInputRef,
        class: "sc-text__edit-input",
        value: editValue.value,
        placeholder: props.editPlaceholder,
        maxlength: props.editMaxLength,
        onInput: (e: Event) => {
          editValue.value = (e.target as HTMLInputElement).value;
        },
        onBlur: endEdit,
        onKeydown: handleEditKeydown
      })
    ]);
  }

  // 构建子元素
  const children: VNode[] = [];

  // 前缀
  if (slots.prefix) {
    children.push(h("span", { class: "sc-text__prefix" }, slots.prefix()));
  } else if (props.prefixIcon) {
    children.push(h("span", { class: "sc-text__prefix" }, [h(resolveComponent("IconifyIconOnline"), { icon: props.prefixIcon })]));
  } else if (props.prefix) {
    children.push(h("span", { class: "sc-text__prefix" }, props.prefix));
  }

  // 主内容区域
  const mainContent: VNode[] = [];

  // 副文本（顶部或左侧）
  if ((props.subtext || slots.subtext) && (props.subtextPosition === "top" || props.subtextPosition === "left")) {
    mainContent.push(h("span", { class: "sc-text__subtext", style: props.subtextStyle }, slots.subtext ? slots.subtext() : props.subtext));
  }

  // 主文本
  if (props.useTypeIt) {
    // TypeIt 模式：创建空容器，由 TypeIt 填充内容
    mainContent.push(
      h("span", {
        ref: (el: HTMLElement | null) => {
          textRef.value = el;
          typeItRef.value = el;
        },
        class: "sc-text__content sc-text__typeit"
      })
    );
  } else {
    // 普通模式
    const textContent = slots.default ? slots.default() : highlightText(displayText.value);
    mainContent.push(
      h(
        "span",
        {
          ref: textRef,
          class: "sc-text__content"
        },
        textContent
      )
    );
  }

  // 副文本（底部或右侧）
  if ((props.subtext || slots.subtext) && (props.subtextPosition === "bottom" || props.subtextPosition === "right")) {
    mainContent.push(h("span", { class: "sc-text__subtext", style: props.subtextStyle }, slots.subtext ? slots.subtext() : props.subtext));
  }

  children.push(h("span", { class: "sc-text__main" }, mainContent));

  // 后缀
  if (slots.suffix) {
    children.push(h("span", { class: "sc-text__suffix" }, slots.suffix()));
  } else if (props.suffixIcon) {
    children.push(h("span", { class: "sc-text__suffix" }, [h(resolveComponent("IconifyIconOnline"), { icon: props.suffixIcon })]));
  } else if (props.suffix) {
    children.push(h("span", { class: "sc-text__suffix" }, props.suffix));
  }

  // 复制按钮
  if (props.copyable) {
    children.push(
      h(
        "span",
        {
          class: "sc-text__copy",
          title: "复制",
          onClick: (e: MouseEvent) => {
            e.stopPropagation();
            copyText();
          }
        },
        [h(resolveComponent("IconifyIconOnline"), { icon: "ep:document-copy" })]
      )
    );
  }

  // 编辑图标
  if (props.editable && !isEditing.value) {
    children.push(
      h(
        "span",
        {
          class: "sc-text__edit-icon",
          title: "编辑"
        },
        [h(resolveComponent("IconifyIconOnline"), { icon: "ep:edit" })]
      )
    );
  }

  // 徽章
  if (props.badge !== undefined || props.badgeDot) {
    children.push(
      h(
        "span",
        {
          class: ["sc-text__badge", `sc-text__badge--${props.badgeType}`, { "sc-text__badge--dot": props.badgeDot }]
        },
        props.badgeDot ? null : String(props.badge)
      )
    );
  }

  // 根元素
  const Tag = props.href ? "a" : props.tag;
  const rootProps: Record<string, unknown> = {
    class: containerClass.value,
    style: containerStyle.value,
    onClick: handleClick
  };

  if (props.href) {
    rootProps.href = props.href;
    rootProps.target = props.target;
  }

  return h(Tag, rootProps, children);
});

/**
 * 解析组件（用于图标）
 */
function resolveComponent(name: string): unknown {
  // 使用全局注册的组件
  return name;
}

// ==================== 生命周期 ====================

onMounted(() => {
  nextTick(() => {
    checkTruncation();
  });

  // 远程调用
  if (props.fetchText && props.fetchImmediate) {
    fetchRemoteText();
    startFetchInterval();
  }

  // 打字机效果
  if (props.effect === "typing" && !props.useTypeIt) {
    startTypingEffect();
  }

  // TypeIt 效果（如果没有远程调用）
  if (props.useTypeIt && !props.fetchText) {
    initTypeIt();
  }
});

onUnmounted(() => {
  // 清理定时器
  stopTypingEffect();
  stopFetchInterval();
  destroyTypeIt();

  // 移除窗口监听
  if (typeof window !== "undefined") {
    window.removeEventListener("resize", checkTruncation);
  }
});

// 监听文本变化
watch(
  () => props.text,
  () => {
    nextTick(() => {
      checkTruncation();
    });
    if (props.effect === "typing" && !props.useTypeIt) {
      stopTypingEffect();
      startTypingEffect();
    }
    if (props.useTypeIt) {
      initTypeIt();
    }
  }
);

// 监听远程调用函数变化
watch(
  () => props.fetchText,
  newVal => {
    if (newVal && props.fetchImmediate) {
      fetchRemoteText();
    }
  }
);

// 监听窗口大小变化
if (typeof window !== "undefined") {
  window.addEventListener("resize", checkTruncation);
}

// 暴露方法
defineExpose({
  startEdit,
  endEdit,
  cancelEdit,
  copyText,
  checkTruncation,
  refresh,
  initTypeIt,
  destroyTypeIt,
  resetTypeIt,
  freezeTypeIt,
  unfreezeTypeIt
});
</script>

<style lang="scss" scoped>
.sc-text {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: var(--el-font-size-base);
  color: var(--el-text-color-regular);
  line-height: 1.5;
  vertical-align: middle;
  transition: all 0.2s ease;

  // ==================== 类型 ====================
  &--primary {
    color: var(--el-color-primary);
  }

  &--success {
    color: var(--el-color-success);
  }

  &--warning {
    color: var(--el-color-warning);
  }

  &--danger {
    color: var(--el-color-danger);
  }

  &--info {
    color: var(--el-color-info);
  }

  // ==================== 大小 ====================
  &--large {
    font-size: var(--el-font-size-large);
  }

  &--small {
    font-size: var(--el-font-size-small);
  }

  // ==================== 截断 ====================
  &--truncated &__content {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 100%;
  }

  &--line-clamp &__content {
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: var(--line-clamp, 2);
    line-clamp: var(--line-clamp, 2);
    overflow: hidden;
    text-overflow: ellipsis;
  }

  // ==================== 装饰 ====================
  &--bold {
    font-weight: 600;
  }

  &--italic {
    font-style: italic;
  }

  &--underline {
    text-decoration: underline;
  }

  &--delete {
    text-decoration: line-through;
  }

  &--mark &__content {
    background-color: var(--mark-color, #ffe58f);
    padding: 0 4px;
    border-radius: 2px;
  }

  &--code &__content {
    font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
    background-color: var(--el-fill-color-light);
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 0.9em;
    border: 1px solid var(--el-border-color-lighter);
  }

  &--keyboard &__content {
    font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
    background: linear-gradient(180deg, var(--el-fill-color-lighter) 0%, var(--el-fill-color) 100%);
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 0.9em;
    border: 1px solid var(--el-border-color);
    box-shadow: 0 2px 0 var(--el-border-color);
  }

  // ==================== 特效 ====================
  &--effect-gradient &__content {
    background: var(--gradient, linear-gradient(to right, #667eea, #764ba2));
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }

  &--effect-glow &__content {
    text-shadow:
      0 0 10px currentColor,
      0 0 20px currentColor,
      0 0 30px currentColor;
  }

  &--effect-shadow &__content {
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
  }

  // ==================== 状态 ====================
  &--disabled {
    opacity: 0.5;
    cursor: not-allowed;
    pointer-events: none;
  }

  &--unselectable {
    user-select: none;
  }

  &--loading {
    .sc-text__skeleton {
      display: inline-block;
      width: var(--loading-width, 100px);
      height: 1em;
      background: linear-gradient(90deg, var(--el-fill-color-light) 25%, var(--el-fill-color) 50%, var(--el-fill-color-light) 75%);
      background-size: 200% 100%;
      animation: sc-text-skeleton 1.5s ease-in-out infinite;
      border-radius: 4px;
    }
  }

  // ==================== 链接 ====================
  &--link {
    cursor: pointer;
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }

  // ==================== 可编辑 ====================
  &--editable {
    cursor: pointer;

    &:hover {
      .sc-text__edit-icon {
        opacity: 1;
      }
    }
  }

  // ==================== 副文本 ====================
  &--has-subtext {
    .sc-text__main {
      display: flex;
      align-items: center;
    }
  }

  &--subtext-top,
  &--subtext-bottom {
    .sc-text__main {
      flex-direction: column;
      align-items: flex-start;
    }
  }

  &--subtext-left,
  &--subtext-right {
    .sc-text__main {
      flex-direction: row;
      gap: 8px;
    }
  }

  // ==================== 子元素 ====================
  &__main {
    display: inline-flex;
    align-items: center;
    position: relative;
  }

  &__content {
    display: inline;
  }

  &__subtext {
    font-size: 0.85em;
    color: var(--el-text-color-secondary);
    line-height: 1.4;
  }

  &__prefix,
  &__suffix {
    display: inline-flex;
    align-items: center;
    color: var(--el-text-color-secondary);
    font-size: 0.9em;
  }

  &__copy,
  &__edit-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    margin-left: 4px;
    cursor: pointer;
    opacity: 0;
    color: var(--el-text-color-secondary);
    font-size: 14px;
    transition: all 0.2s ease;

    &:hover {
      color: var(--el-color-primary);
    }
  }

  &:hover &__copy {
    opacity: 1;
  }

  &__highlight {
    background-color: #ffc069;
    padding: 0 2px;
    border-radius: 2px;
  }

  &__badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 16px;
    height: 16px;
    padding: 0 5px;
    margin-left: 4px;
    font-size: 11px;
    font-weight: 600;
    color: #fff;
    background-color: var(--el-color-danger);
    border-radius: 8px;
    line-height: 1;

    &--primary {
      background-color: var(--el-color-primary);
    }

    &--success {
      background-color: var(--el-color-success);
    }

    &--warning {
      background-color: var(--el-color-warning);
    }

    &--info {
      background-color: var(--el-color-info);
    }

    &--dot {
      min-width: 8px;
      width: 8px;
      height: 8px;
      padding: 0;
    }
  }

  &__edit-input {
    border: none;
    outline: none;
    background: transparent;
    font: inherit;
    color: inherit;
    width: 100%;
    min-width: 100px;
    padding: 2px 4px;
    border-bottom: 2px solid var(--el-color-primary);
  }
}

// ==================== 动画 ====================
@keyframes sc-text-skeleton {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}
</style>
