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
import { computed, onBeforeUnmount, ref, useSlots, watch } from "vue";
import { ElText } from "element-plus";
import type { TextProps } from "element-plus";
import { getConfig } from "@repo/config";
import { renderSecureText } from "@repo/core";
import { buildObfuscatedChars, deobfuscateDynamic, OBF_FONT_FAMILY } from "@repo/core";
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

// ── 混淆模式（真字体加密）──
const obfChars = ref<ObfuscatedChar[]>([]);
/** ElText 根节点（两个 ElText 分支共用） */
const textRef = ref<{ $el?: HTMLElement } | null>(null);

/** 显式传入的混淆配置：对象形式优先于 security.obfuscate */
const explicitObfuscateOptions = computed<FontObfuscatorOptions>(() =>
  typeof props.obfuscate === "object"
    ? props.obfuscate
    : (props.security?.obfuscate ?? {}),
);

/**
 * 生成混淆字符（PUA 码位）。
 *
 * <p>真字体加密：DOM 里写 PUA 乱码，字形由 woff2 字体渲染。
 * 不需要光栅化、不需要量字号、不产生 base64 位图——字号/颜色/缩放/DPR
 * 全部由 CSS 与字体自然承接。</p>
 */
function rebuildObfuscate(): void {
  if (!obfuscateActive.value || !rawText.value) {
    obfChars.value = [];
    return;
  }
  const explicit = explicitObfuscateOptions.value;
  obfChars.value = buildObfuscatedChars(rawText.value, {
    baseCodepoint: explicit.baseCodepoint,
    fontFamily: explicit.fontFamily,
  });
}

/**
 * 混淆块的行内样式：字体族 + 可选字号/颜色。
 *
 * <p>字形由字体渲染，因此字号、颜色、缩放、暗色主题全部走 CSS 继承，
 * 不需要重建任何东西。</p>
 */
const obfStyle = computed<Record<string, string>>(() => {
  const explicit = explicitObfuscateOptions.value;
  const style: Record<string, string> = {
    fontFamily: `"${explicit.fontFamily || OBF_FONT_FAMILY}", inherit`,
  };
  if (explicit.fontSize && explicit.fontSize > 0) style.fontSize = `${explicit.fontSize}px`;
  if (explicit.color) style.color = explicit.color;
  return style;
});

// 监听变化（含全局开关变化：配置热重载后 ReText 自动跟随）
watch(
  [rawText, ocrActive, obfuscateActive, () => props.security, () => props.obfuscate],
  () => {
    startOcr();
    rebuildObfuscate();
  },
  { immediate: true },
);
watch(canvasRef, () => {
  startOcr();
});

onBeforeUnmount(() => {
  stopOcr?.();
  obfChars.value = [];
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

  <!-- 混淆模式：PUA 乱码文本 + 字体加密渲染 -->
  <ElText
    v-else-if="obfuscateActive && obfChars.length"
    ref="textRef"
    v-bind="elTextProps"
    class="re-text re-text--obf"
    :style="obfStyle"
  >
    <span
      v-for="(c, i) in obfChars"
      :key="i"
      class="re-text__char"
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
  display: inline;
  white-space: pre;
  user-select: text;
}
/* 字体加密：整块套用映射字体，字形由 woff2 提供 */
.re-text--obf {
  font-family: "ReObfFont", inherit;
}
</style>
