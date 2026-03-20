<!--
 * ScText 文本组件
 * 支持 el-text 全部功能，并扩展副文本、提示、编辑、复制等功能
 * @author CH
 * @version 1.0.0
 * @since 2025-12-05
-->

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted, h, type VNode, getCurrentInstance, resolveComponent as vueResolveComponent } from "vue";
import { message } from "@repo/utils";
import TypeIt from "typeit";
import { ScTooltip } from "../../ScTooltip";
import { useThemeComponent } from "../../hooks/useThemeComponent";
import type { ScTextProps, TypeItInstance, ScTextThemeMotion } from "./types";

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
  useTypeIt: false,
  themeMotion: "none"
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

function extractTextFromNodes(nodes: VNode[] = []): string {
  return nodes
    .map(node => {
      if (typeof node.children === "string") {
        return node.children;
      }

      if (Array.isArray(node.children)) {
        return extractTextFromNodes(node.children as VNode[]);
      }

      return "";
    })
    .join("");
}

// ==================== 状态 ====================
const textRef = ref<HTMLElement | null>(null);
const typeItRef = ref<HTMLElement | null>(null);
const isEditing = ref(false);
const editValue = ref("");
const editInputRef = ref<HTMLInputElement | null>(null);
const isTruncated = ref(false);
const typingText = ref("");
const typingIndex = ref(0);
const scrambleText = ref("");
let typingTimer: ReturnType<typeof setTimeout> | null = null;
let glitchFrameTimer: ReturnType<typeof setInterval> | null = null;
let glitchCycleTimer: ReturnType<typeof setInterval> | null = null;

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
 * 主题动效文本
 */
const resolvedThemeMotion = computed<ScTextThemeMotion>(() => {
  if (!props.themeMotion || props.themeMotion === "none") {
    return "none";
  }

  if (props.themeMotion === "auto") {
    switch (currentSkin.value) {
      case "future-tech":
        return "neon";
      case "spring-festival":
        return "gold-foil";
      case "christmas":
        return "frost";
      case "halloween":
        return "glitch";
      default:
        return "none";
    }
  }

  return props.themeMotion;
});

const slotText = computed(() => extractTextFromNodes(slots.default?.() ?? []));

const motionText = computed(() => displayText.value || props.text || slotText.value || "");

const allowMotion = computed(() => {
  return resolvedThemeMotion.value !== "none" && !props.useTypeIt && !!motionText.value;
});

const renderedText = computed(() => {
  if (resolvedThemeMotion.value === "glitch" && scrambleText.value) {
    return scrambleText.value;
  }
  return displayText.value;
});

/**
 * 是否显示加载状态
 */
const isLoading = computed(() => {
  return props.loading || isFetching.value;
});

/**
 * 使用主题组件系统
 */
const { currentSkin } = useThemeComponent("ElText");

/**
 * 容器样式类
 */
const containerClass = computed(() => {
  const classes = ["sc-text"];

  // 添加 data-skin 主题类，用于 CSS 选择器
  const skin = currentSkin.value || "default";
  if (skin && skin !== "default") {
    classes.push(`sc-text--skin-${skin}`);
  }

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

  if (allowMotion.value) {
    classes.push("sc-text--theme-motion");
    classes.push(`sc-text--motion-${resolvedThemeMotion.value}`);
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

function stopGlitchEffect(): void {
  if (glitchFrameTimer) {
    clearInterval(glitchFrameTimer);
    glitchFrameTimer = null;
  }
  scrambleText.value = "";
}

function randomGlyph(): string {
  const glyphs = "01#@%&!?/\\\\<>[]{}";
  return glyphs[Math.floor(Math.random() * glyphs.length)] || "#";
}

function startGlitchEffect(duration = 480): void {
  if (resolvedThemeMotion.value !== "glitch" || !allowMotion.value) {
    return;
  }

  const source = motionText.value;
  if (!source) {
    return;
  }

  stopGlitchEffect();

  const totalFrames = Math.max(6, Math.min(source.length + 4, 16));
  let frame = 0;

  glitchFrameTimer = setInterval(() => {
    frame += 1;
    const revealCount = Math.min(
      source.length,
      Math.floor((frame / totalFrames) * source.length),
    );
    const stableText = source.slice(0, revealCount);
    const scrambledText = source
      .slice(revealCount)
      .split("")
      .map(char => (char.trim() ? randomGlyph() : char))
      .join("");

    scrambleText.value = `${stableText}${scrambledText}`;

    if (frame >= totalFrames) {
      stopGlitchEffect();
    }
  }, Math.max(28, Math.floor(duration / totalFrames)));
}

function syncGlitchCycle(): void {
  if (glitchCycleTimer) {
    clearInterval(glitchCycleTimer);
    glitchCycleTimer = null;
  }

  stopGlitchEffect();

  if (resolvedThemeMotion.value !== "glitch" || !allowMotion.value || !motionText.value) {
    return;
  }

  glitchCycleTimer = setInterval(() => {
    startGlitchEffect(540);
  }, 3200);
}

function handleMouseenter(): void {
  if (resolvedThemeMotion.value === "glitch") {
    startGlitchEffect(620);
  }
}

function handleMouseleave(): void {
  if (resolvedThemeMotion.value === "glitch") {
    stopGlitchEffect();
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
      cursorChar: props.typeItOptions?.cursorChar ?? "",
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
 * 渲染组件（改为函数以避免 ref 上下文丢失）
 * 使用 getCurrentInstance 确保 ref 回调在正确的上下文中执行
 */
function renderComponent() {
  const instance = getCurrentInstance();
  if (!instance) {
    console.warn("[ScText] 无法获取组件实例，ref 可能无法正常工作");
  }
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
    // 使用同一个 ref 引用，确保两个 ref 都指向同一个元素
    const typeItElementRef = (el: HTMLElement | null) => {
      if (el) {
        textRef.value = el;
        typeItRef.value = el;
      }
    };
    mainContent.push(
      h("span", {
        ref: typeItElementRef,
        class: "sc-text__content sc-text__typeit"
      })
    );
  } else {
    // 普通模式
    const textContent = allowMotion.value && slotText.value
      ? highlightText(renderedText.value)
      : slots.default
        ? slots.default()
        : highlightText(renderedText.value);
    mainContent.push(
      h(
        "span",
        {
          ref: textRef,
          class: "sc-text__content",
          "data-text": motionText.value,
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
  };

  if (props.href) {
    rootProps.href = props.href;
    rootProps.target = props.target;
  }

  return h(Tag, rootProps, children);
}

/**
 * 解析组件（用于图标）
 */
function resolveComponent(name: string): unknown {
  const instance = getCurrentInstance();
  if (instance) {
    try {
      // 尝试从应用上下文中解析组件
      const component = vueResolveComponent(name);
      if (component && typeof component !== "string") {
        return component;
      }
    } catch {
      // 如果解析失败，尝试从全局组件注册表中查找
      const appContext = instance.appContext;
      const globalComponent = appContext.components[name];
      if (globalComponent) {
        return globalComponent;
      }
    }
  }
  // 如果都找不到，返回组件名字符串，让 Vue 自动解析
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

  syncGlitchCycle();

  // TypeIt 效果（如果没有远程调用）
  if (props.useTypeIt && !props.fetchText) {
    initTypeIt();
  }
});

onUnmounted(() => {
  // 清理定时器
  stopTypingEffect();
  stopGlitchEffect();
  if (glitchCycleTimer) {
    clearInterval(glitchCycleTimer);
    glitchCycleTimer = null;
  }
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
    syncGlitchCycle();
  }
);

watch([resolvedThemeMotion, motionText, () => props.useTypeIt], () => {
  syncGlitchCycle();
});

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

<template>
  <ScTooltip v-if="showTooltip" :content="tooltipContent" :placement="tooltipPlacement" :effect="tooltipEffect" :disabled="!shouldShowTooltip" :raw-content="true">
    <component :is="renderComponent" />
  </ScTooltip>
  <component v-else :is="renderComponent" />
</template>

<style lang="scss" scoped>
.sc-text {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: var(--el-font-size-base);
  color: var(--el-text-color-regular);
  line-height: 1.5;
  vertical-align: middle;
  position: relative;
  isolation: isolate;
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

  &--theme-motion &__content {
    position: relative;
    display: inline-block;
    will-change: transform, filter, text-shadow;
  }

  &--motion-neon &__content {
    color: #bffcff;
    text-shadow:
      0 0 8px rgba(0, 255, 255, 0.75),
      0 0 18px rgba(0, 255, 255, 0.45);
    animation: sc-text-neon-pulse 2.2s ease-in-out infinite;
  }

  &--motion-neon &__content::after {
    content: "";
    position: absolute;
    inset: auto 0 0 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(0, 255, 255, 0.9), transparent);
    box-shadow: 0 0 12px rgba(0, 255, 255, 0.6);
    animation: sc-text-neon-scan 2.8s linear infinite;
    pointer-events: none;
  }

  &--motion-gold-foil &__content {
    background: linear-gradient(
      120deg,
      #fff6bf 0%,
      #ffd700 18%,
      #f0b400 35%,
      #fff0a3 48%,
      #d89b00 64%,
      #fff6bf 82%,
      #ffd700 100%
    );
    background-size: 220% 100%;
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    filter: drop-shadow(0 1px 1px rgba(120, 20, 20, 0.28));
    animation: sc-text-gold-shimmer 3s ease-in-out infinite;
  }

  &--motion-gold-foil &__content::after {
    content: attr(data-text);
    position: absolute;
    inset: 0;
    z-index: -1;
    color: rgba(122, 16, 30, 0.85);
    text-shadow: 0 0 10px rgba(255, 215, 0, 0.24);
    pointer-events: none;
  }

  &--motion-frost &__content {
    color: #f6fff8;
    text-shadow:
      0 0 8px rgba(255, 255, 255, 0.55),
      0 0 16px rgba(168, 255, 233, 0.26);
    animation: sc-text-frost-twinkle 2.8s ease-in-out infinite;
  }

  &--motion-frost &__content::after {
    content: "";
    position: absolute;
    inset: -2px -6px;
    border-radius: 999px;
    background: radial-gradient(circle at 18% 30%, rgba(255, 255, 255, 0.28), transparent 34%),
      radial-gradient(circle at 82% 65%, rgba(199, 255, 237, 0.22), transparent 32%);
    opacity: 0.8;
    z-index: -1;
    pointer-events: none;
  }

  &--motion-glitch &__content {
    color: #ffd6b0;
    text-shadow:
      0.03em 0 0 rgba(255, 117, 24, 0.78),
      -0.03em 0 0 rgba(117, 255, 3, 0.58);
    animation: sc-text-glitch-jitter 2.6s steps(1, end) infinite;
  }

  &--motion-glitch &__content::before,
  &--motion-glitch &__content::after {
    content: attr(data-text);
    position: absolute;
    inset: 0;
    opacity: 0.45;
    pointer-events: none;
  }

  &--motion-glitch &__content::before {
    color: rgba(255, 117, 24, 0.9);
    transform: translate(-1px, -1px);
    clip-path: inset(0 0 55% 0);
  }

  &--motion-glitch &__content::after {
    color: rgba(117, 255, 3, 0.85);
    transform: translate(1px, 1px);
    clip-path: inset(48% 0 0 0);
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

@keyframes sc-text-neon-pulse {
  0%,
  100% {
    text-shadow:
      0 0 8px rgba(0, 255, 255, 0.75),
      0 0 18px rgba(0, 255, 255, 0.45);
  }
  50% {
    text-shadow:
      0 0 12px rgba(0, 255, 255, 0.95),
      0 0 26px rgba(0, 255, 255, 0.62);
  }
}

@keyframes sc-text-neon-scan {
  0%,
  100% {
    transform: translateY(-0.1em);
    opacity: 0.12;
  }
  45% {
    opacity: 0.48;
  }
  60% {
    transform: translateY(0.95em);
    opacity: 0;
  }
}

@keyframes sc-text-gold-shimmer {
  0%,
  100% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
}

@keyframes sc-text-frost-twinkle {
  0%,
  100% {
    transform: translateY(0);
    filter: drop-shadow(0 0 4px rgba(255, 255, 255, 0.22));
  }
  50% {
    transform: translateY(-1px);
    filter: drop-shadow(0 0 8px rgba(199, 255, 237, 0.32));
  }
}

@keyframes sc-text-glitch-jitter {
  0%,
  100% {
    transform: translate(0);
  }
  18% {
    transform: translate(-1px, 1px);
  }
  20% {
    transform: translate(1px, -1px);
  }
  55% {
    transform: translate(1px, 0);
  }
  58% {
    transform: translate(-1px, 0);
  }
}
</style>
