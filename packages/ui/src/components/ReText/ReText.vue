<script setup lang="ts">
/**
 * ReText —— 文本组件
 *
 * 继承 el-text 全部 props（type/size/truncated/lineClamp/tag），
 * 新增 ocr / obfuscate 两项防抓取能力。
 *
 * 用法：
 *   <ReText type="primary" :ocr="true">保密文本</ReText>
 *   <ReText :obfuscate="{ fontSize: 16 }">动态字体混淆</ReText>
 */
import { computed, onBeforeUnmount, onMounted, ref, useSlots, watch } from "vue";
import { ElText } from "element-plus";
import type { TextProps } from "element-plus";
import { getConfig } from "@repo/config";
import { renderSecureText } from "@repo/core";
import { buildObfuscatedChars, deobfuscateDynamic } from "@repo/core";
import type { FontObfuscatorOptions, ObfuscatedChar } from "@repo/core";
import type { ReTextSecurityOptions } from "./types";

/** 全局开关：ocr 未显式传入时回退 security.ocrObfuscation.enable */
const globalOcrEnabled = () => getConfig()?.security?.ocrObfuscation?.enable === true;
/** 全局开关：obfuscate 未显式传入时回退 security.dynamicFont.enable */
const globalObfuscateEnabled = () => getConfig()?.security?.dynamicFont?.enable === true;

/** 组件 props：el-text 原生 props 全量继承 + ReText 扩展项 */
const props = withDefaults(
  defineProps<
    TextProps & {
      /** 文本内容（也可用默认插槽） */
      text?: string;
      /** 防 OCR 渲染（canvas）；不传时回退全局 security.ocrObfuscation.enable */
      ocr?: boolean;
      /** 动态字体混淆；不传时回退全局 security.dynamicFont.enable */
      obfuscate?: boolean | ReTextSecurityOptions["obfuscate"];
      /** OCR/混淆的详细配置 */
      security?: ReTextSecurityOptions;
    }
  >(),
  {
    text: "",
    ocr: undefined,
    obfuscate: undefined,
    security: () => ({}),
  },
);

/**
 * el-text 原生 props 原样下发。
 *
 * <p>不逐项绑定 `:type` / `:size` / `:truncated` / `:line-clamp` / `:tag`：
 * Element Plus 给 `ElText` 新增 prop 时 `TextProps` 会随之扩展，这里的 props
 * 类型跟着变、对象里也自动多出该键，{@code ReText} 不需要再改一行。</p>
 */
const elTextProps = computed<Record<string, unknown>>(() => {
  const forwarded: Record<string, unknown> = { ...props };
  delete forwarded.text;
  delete forwarded.ocr;
  delete forwarded.obfuscate;
  delete forwarded.security;
  return forwarded;
});

const slots = useSlots();

/** 实际是否启用 OCR：显式传参优先，否则跟随全局开关 */
const ocrActive = computed<boolean>(() => props.ocr ?? globalOcrEnabled());
/** 实际是否启用混淆：显式传参优先，否则跟随全局开关 */
const obfuscateActive = computed<boolean>(() =>
  props.obfuscate !== undefined
    ? props.obfuscate !== false
    : globalObfuscateEnabled(),
);

/** 实际要展示的文本（props.text 或默认插槽文本） */
const rawText = computed<string>(() => {
  if (props.text !== "") return props.text;
  const slot = slots.default?.();
  if (!slot) return "";
  return slot
    .map((node) => {
      if (typeof node.children === "string") return node.children;
      if (Array.isArray(node.children)) {
        return node.children
          .map((c) => (typeof c === "string" ? c : (c as { children?: string })?.children ?? ""))
          .join("");
      }
      return "";
    })
    .join("");
});

// ── OCR 模式 ──
const canvasRef = ref<HTMLCanvasElement | null>(null);
let stopOcr: (() => void) | undefined;

function startOcr(): void {
  stopOcr?.();
  if (!ocrActive.value || !rawText.value) return;
  const opt = props.security?.ocr ?? {};
  stopOcr = renderSecureText(canvasRef.value, rawText.value, opt);
}

// ── 混淆模式 ──
const obfChars = ref<ObfuscatedChar[]>([]);
/** ElText 根节点（两个 ElText 分支共用），用于量真实字号与字体族 */
const textRef = ref<{ $el?: HTMLElement } | null>(null);

/** 显式传入的混淆配置：对象形式优先于 security.obfuscate */
const explicitObfuscateOptions = computed<FontObfuscatorOptions>(() =>
  typeof props.obfuscate === "object"
    ? props.obfuscate
    : (props.security?.obfuscate ?? {}),
);

/** 位图绘制字号：只决定位图清晰度，布局由 em 决定 */
const bitmapFontSize = ref(14);
/** 位图绘制字体族 */
let bitmapFontFamily = "";
/** 上一次光栅化的输入签名，避免重复重建 */
let lastRasterSig = "";

/**
 * 量 ElText 根节点真实生效的字号 / 字体族。
 *
 * <p>颜色不在这里取：位图只当遮罩用（`mask-image` + `background-color: currentColor`），
 * 颜色、暗色主题、hover 变色全部由 CSS 继承，无需重建。</p>
 */
function measureFont(): { fontSize?: number; fontFamily?: string } {
  const el = textRef.value?.$el;
  if (!el || typeof window === "undefined") return {};
  const cs = window.getComputedStyle(el);
  const fontSize = Number.parseFloat(cs.fontSize);
  return {
    fontSize: Number.isFinite(fontSize) && fontSize > 0 ? fontSize : undefined,
    fontFamily: cs.fontFamily || undefined,
  };
}

/**
 * 混淆字符的展示样式。
 *
 * <p>尺寸全部用 `em`：位图按绘制字号 S 光栅化，宽度按 w/S 换算成 em，
 * 于是外部 CSS 改 `font-size`（size prop、行内样式、响应式、主题）时位图
 * 跟着等比缩放，既不用重新量也不用重建位图。</p>
 */
function charStyle(c: ObfuscatedChar): Record<string, string> {
  if (!c.image) return {};
  const size = bitmapFontSize.value > 0 ? bitmapFontSize.value : 14;
  const style: Record<string, string> = {
    width: `${(c.width / size).toFixed(4)}em`,
    height: `${(c.height / size).toFixed(4)}em`,
    verticalAlign: `-${((c.height - c.ascent) / size).toFixed(4)}em`,
    "--re-char-mask": `url(${c.image})`,
  };
  const explicit = explicitObfuscateOptions.value;
  // 显式配置优先：color 走 CSS 变量，fontSize 直接作用在该字符上
  if (explicit.fontSize && explicit.fontSize > 0) style.fontSize = `${explicit.fontSize}px`;
  if (explicit.color) style.color = explicit.color;
  return style;
}

/**
 * 生成 / 复用混淆位图。
 *
 * <p>只有「文本 + 绘制字号 + 字体族」变化才重新光栅化；颜色与字号变化
 * 由 CSS 直接承接，不会触发重建，也就没有首帧尺寸跳变。</p>
 */
function rasterizeObfuscate(): void {
  if (!obfuscateActive.value || !rawText.value) {
    obfChars.value = [];
    lastRasterSig = "";
    return;
  }
  const explicit = explicitObfuscateOptions.value;
  const measured = measureFont();
  const size =
    (explicit.fontSize && explicit.fontSize > 0 ? explicit.fontSize : undefined) ??
    measured.fontSize ??
    bitmapFontSize.value;
  const family = explicit.fontFamily || measured.fontFamily || bitmapFontFamily;
  const sig = `${rawText.value}\u0000${size}\u0000${family}`;
  if (sig === lastRasterSig) return;
  lastRasterSig = sig;
  bitmapFontSize.value = size;
  bitmapFontFamily = family;
  obfChars.value = buildObfuscatedChars(rawText.value, {
    baseCodepoint: explicit.baseCodepoint,
    fontSize: size,
    // 位图只做遮罩，像素颜色无意义，不传 color（省一次解析）
    fontFamily: family || undefined,
  });
}

// 监听变化（含全局开关变化：配置热重载后 ReText 自动跟随）
watch(
  [rawText, ocrActive, obfuscateActive, () => props.security, () => props.obfuscate],
  () => {
    startOcr();
    rasterizeObfuscate();
  },
  { immediate: true },
);
watch(canvasRef, () => {
  startOcr();
});

/**
 * 样式表 / 字体可能在挂载后才就绪（dev 下 Vite 是异步注入 CSS），
 * 补几次测量把字体族与绘制字号校准到真实值。布局不受影响（em 自适应），
 * 这一步只影响位图清晰度与字形。
 */
let settleTimers: ReturnType<typeof setTimeout>[] = [];

onMounted(() => {
  rasterizeObfuscate();
  requestAnimationFrame(() => rasterizeObfuscate());
  requestAnimationFrame(() => requestAnimationFrame(() => rasterizeObfuscate()));
  void document.fonts?.ready.then(() => rasterizeObfuscate());
  settleTimers = [setTimeout(rasterizeObfuscate, 120), setTimeout(rasterizeObfuscate, 400)];
});

onBeforeUnmount(() => {
  stopOcr?.();
  settleTimers.forEach((t) => clearTimeout(t));
  settleTimers = [];
  obfChars.value = [];
  lastRasterSig = "";
});
</script>

<template>
  <!-- OCR 模式：canvas 防识别 -->
  <canvas
    v-if="ocrActive && rawText"
    ref="canvasRef"
    class="re-text__canvas"
    :aria-label="text"
  />

  <!-- 混淆模式：位图 + PUA 乱码文本 -->
  <ElText
    v-else-if="obfuscateActive && obfChars.length"
    ref="textRef"
    v-bind="elTextProps"
    class="re-text"
  >
    <span
      v-for="(c, i) in obfChars"
      :key="i"
      class="re-text__char"
      :style="charStyle(c)"
    >{{ c.pua }}</span>
  </ElText>

  <!-- 普通模式：el-text 原生 props 全量透传（elTextProps 自动跟随 TextProps 扩展） -->
  <ElText
    v-else
    ref="textRef"
    v-bind="elTextProps"
    class="re-text"
  >
    <slot>{{ text }}</slot>
  </ElText>
</template>

<style scoped>
.re-text__canvas {
  display: inline-block;
  max-width: 100%;
  vertical-align: middle;
}
.re-text__char {
  display: inline-block;
  white-space: pre;
  user-select: text;
  /* 位图只作字形遮罩，颜色跟随 CSS（type / 暗色主题 / hover 全部自动生效） */
  background-color: currentColor;
  -webkit-text-fill-color: transparent;
  -webkit-mask-image: var(--re-char-mask);
  mask-image: var(--re-char-mask);
  -webkit-mask-size: 100% 100%;
  mask-size: 100% 100%;
  -webkit-mask-repeat: no-repeat;
  mask-repeat: no-repeat;
}
</style>
