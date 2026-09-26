<script setup lang="ts">
/**
 * JSON 代码视图（Redis STRING 详情组件用）
 *
 * <p>语法高亮预览（键/字符串/数字/布尔/null 分色）+ 编辑模式切换；
 * v-model 直接同步原始字符串（编辑时写回父级，由父级统一保存）。</p>
 *
 * @author CH
 * @since 4.0.0.42
 */
import { computed, ref, watch } from "vue";
import { ElMessage } from "element-plus";
import "./redis-value.css";

const props = defineProps<{
  /** 原始值 */
  modelValue: string;
}>();

const emit = defineEmits<{ (e: "update:modelValue", value: string): void }>();

const editing = ref(false);

/** 是否合法 JSON */
const isJson = computed<boolean>(() => {
  try {
    JSON.parse(props.modelValue);
    return true;
  } catch {
    return false;
  }
});

/** 美化后的 JSON（非法时按原文展示） */
const pretty = computed<string>(() => {
  try {
    return JSON.stringify(JSON.parse(props.modelValue), null, 2);
  } catch {
    return props.modelValue;
  }
});

/** 行数 */
const lineCount = computed<number>(() => pretty.value.split("\n").length);

/**
 * JSON 语法高亮（先转义 HTML 再按 token 着色）
 * @param text 原始 JSON 文本
 */
function highlight(text: string): string {
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return escaped.replace(
    /("(?:\\.|[^"\\])*")(\s*:)?|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)|(true|false)|(null)/g,
    (match: string, str: string, colon: string, num: string, bool: string, nul: string) => {
      if (str !== undefined) {
        return `<span class="${colon !== undefined ? "jk" : "js"}">${str}</span>${colon ?? ""}`;
      }
      if (num !== undefined) return `<span class="jn">${num}</span>`;
      if (bool !== undefined) return `<span class="jb">${bool}</span>`;
      if (nul !== undefined) return `<span class="jb">${nul}</span>`;
      return match;
    },
  );
}

const html = computed<string>(() => highlight(pretty.value));

/**
 * 编辑输入：写回父级
 * @param e 输入事件
 */
function onEditInput(e: Event): void {
  emit("update:modelValue", (e.target as HTMLTextAreaElement).value);
}

/** 复制原文 */
async function copy(): Promise<void> {
  try {
    await navigator.clipboard.writeText(props.modelValue);
    ElMessage.success("已复制");
  } catch {
    ElMessage.warning("复制失败");
  }
}

watch(
  () => props.modelValue,
  () => {
    editing.value = false;
  },
);
</script>

<template>
  <div class="rv-code-wrap">
    <div class="rv-code-bar">
      <span>JSON · {{ lineCount }} 行{{ isJson ? "" : " · 非法 JSON，按原文展示" }}</span>
      <span class="rv-spacer" />
      <ReButton icon="CopyDocument" layout="square" size="small" title="复制原文" @click="copy" />
      <ReButton
        :icon="editing ? 'View' : 'EditPen'"
        :show-text="true"
        size="small"
        @click="editing = !editing"
      >{{ editing ? "预览" : "编辑" }}</ReButton>
    </div>
    <textarea v-if="editing" class="rv-code-edit" :value="modelValue" spellcheck="false" @input="onEditInput" />
    <pre v-else class="rv-code" v-html="html" />
  </div>
</template>
