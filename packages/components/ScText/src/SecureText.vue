<template>
  <span
    :class="['secure-text', { 'secure-text--noisy': enableNoise }]"
    :style="textStyle"
    v-html="displayText"
  />
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import {
  obfuscateText,
  insertZeroWidthChars,
  generateCharacterMap,
} from '@repo/utils/src/security/text-obfuscation';
import { addNoiseBackground } from '@repo/utils/src/security/canvas-noise';

interface Props {
  // 原始文本
  text: string;
  // 启用字符混淆
  enableObfuscation?: boolean;
  // 启用零宽字符
  enableZeroWidth?: boolean;
  // 零宽字符密度
  zeroWidthDensity?: number;
  // 启用噪点背景
  enableNoise?: boolean;
  // 噪点密度
  noiseDensity?: number;
  // 自定义字体
  fontFamily?: string;
  // 禁用选择
  disableSelect?: boolean;
  // 禁用复制
  disableCopy?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  enableObfuscation: true,
  enableZeroWidth: true,
  zeroWidthDensity: 0.3,
  enableNoise: true,
  noiseDensity: 0.05,
  fontFamily: 'ObfuscatedFont, sans-serif',
  disableSelect: true,
  disableCopy: true,
});

const textRef = ref<HTMLElement>();
const charMap = ref(generateCharacterMap());

// 处理后的文本
const displayText = computed(() => {
  let result = props.text;

  // 字符混淆
  if (props.enableObfuscation) {
    result = obfuscateText(result, charMap.value);
  }

  // 零宽字符
  if (props.enableZeroWidth) {
    result = insertZeroWidthChars(result, props.zeroWidthDensity);
  }

  return result;
});

// 文本样式
const textStyle = computed(() => ({
  fontFamily: props.enableObfuscation ? props.fontFamily : undefined,
  userSelect: props.disableSelect ? 'none' : undefined,
  WebkitUserSelect: props.disableSelect ? 'none' : undefined,
  MozUserSelect: props.disableSelect ? 'none' : undefined,
  msUserSelect: props.disableSelect ? 'none' : undefined,
}));

// 添加噪点背景
onMounted(() => {
  if (props.enableNoise && textRef.value) {
    addNoiseBackground(textRef.value, {
      noiseDensity: props.noiseDensity,
    });
  }

  // 禁用复制
  if (props.disableCopy && textRef.value) {
    textRef.value.addEventListener('copy', (e) => {
      e.preventDefault();
      return false;
    });
  }
});
</script>

<style scoped lang="scss">
.secure-text {
  display: inline-block;
  position: relative;

  &--noisy {
    padding: 2px 4px;
  }
}
</style>
