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
import { getConfig } from "@repo/config";
import { renderSecureText } from "@repo/core";
import { buildObfuscatedChars, deobfuscateDynamic } from "@repo/core";
import type { ObfuscatedChar } from "@repo/core";
import type { ReTextSecurityOptions } from "./types";

/** 全局开关：ocr 未显式传入时回退 security.ocrObfuscation.enable */
const globalOcrEnabled = () => getConfig()?.security?.ocrObfuscation?.enable === true;
/** 全局开关：obfuscate 未显式传入时回退 security.dynamicFont.enable */
const globalObfuscateEnabled = () => getConfig()?.security?.dynamicFont?.enable === true;

/** 组件 props */
const props = withDefaults(
  defineProps<{
    /** 文本类型（el-text 原生） */
    type?: "primary" | "success" | "info" | "warning" | "danger" | "";
    /** 尺寸（el-text 原生） */
    size?: "large" | "default" | "small";
    /** 单行省略（el-text 原生） */
    truncated?: boolean;
    /** 最大行数（el-text 原生） */
    lineClamp?: number | string;
    /** 自定义标签（el-text 原生） */
    tag?: string;
    /** 文本内容（也可用默认插槽） */
    text?: string;
    /** 防 OCR 渲染（canvas）；不传时回退全局 security.ocrObfuscation.enable */
    ocr?: boolean;
    /** 动态字体混淆；不传时回退全局 security.dynamicFont.enable */
    obfuscate?: boolean | ReTextSecurityOptions["obfuscate"];
    /** OCR/混淆的详细配置 */
    security?: ReTextSecurityOptions;
  }>(),
  {
    type: "",
    size: "",
    truncated: false,
    lineClamp: undefined,
    tag: undefined,
    text: "",
    ocr: undefined,
    obfuscate: undefined,
    security: () => ({}),
  },
);

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
/** 混淆字符的展示样式（位图背景 + 隐藏乱码文本） */
function charStyle(c: ObfuscatedChar): Record<string, string> {
  if (!c.image) return {};
  return {
    display: "inline-block",
    width: `${c.width}px`,
    height: `${c.height}px`,
    backgroundImage: `url(${c.image})`,
    backgroundRepeat: "no-repeat",
    backgroundSize: `${c.width}px ${c.height}px`,
    fontSize: "0",
    lineHeight: "0",
    verticalAlign: `-${(c.height - c.ascent).toFixed(2)}px`,
    userSelect: "text",
  };
}

function startObfuscate(): void {
  if (!obfuscateActive.value || !rawText.value) {
    obfChars.value = [];
    return;
  }
  const opt =
    typeof props.obfuscate === "object"
      ? props.obfuscate
      : props.security?.obfuscate;
  obfChars.value = buildObfuscatedChars(rawText.value, opt ?? {});
}

// 监听变化（含全局开关变化：配置热重载后 ReText 自动跟随）
watch(
  [rawText, ocrActive, obfuscateActive, () => props.security],
  () => {
    startOcr();
    startObfuscate();
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

  <!-- 混淆模式：位图 + PUA 乱码文本 -->
  <ElText
    v-else-if="obfuscateActive && obfChars.length"
    :type="type"
    :size="size"
    :truncated="truncated"
    :line-clamp="lineClamp"
    :tag="tag"
    class="re-text"
  >
    <span
      v-for="(c, i) in obfChars"
      :key="i"
      class="re-text__char"
      :style="charStyle(c)"
    >{{ c.pua }}</span>
  </ElText>

  <!-- 普通模式：透传 el-text 全部能力 -->
  <ElText
    v-else
    :type="type"
    :size="size"
    :truncated="truncated"
    :line-clamp="lineClamp"
    :tag="tag"
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
  white-space: pre;
}
</style>
