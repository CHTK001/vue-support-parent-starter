<script setup lang="ts">
/**
 * ScriptSourceField —— 脚本正文字段：只读 code 预览，点击弹出编辑器
 *
 * 预览保持紧凑（超长内部滚动），点击预览（或回车）打开编辑器弹层，
 * 保存后回写 v-model；供 ReForm 自定义字段使用（modelValue / update:modelValue / change）。
 */
import { computed, ref, watch } from "vue";
import ReDialog from "@repo/ui/re-dialog";

const props = withDefaults(
  defineProps<{
    /** 脚本正文 */
    modelValue?: string;
    /** 空态占位文案 */
    placeholder?: string;
    /** 预览下方说明 */
    description?: string;
  }>(),
  { modelValue: "", placeholder: "", description: "" },
);

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
  (e: "change", value: string): void;
}>();

/** 编辑器弹层显隐 */
const visible = ref(false);
/** 编辑草稿：确认后才回写，取消不影响原值 */
const draft = ref("");

/** 编辑器占位提示（含换行，模板属性里用绑定传入） */
const editorPlaceholder =
  "例：return 'ok ' + context.jobName\n可用变量：jobName / context；最后一条表达式即返回值";

/** 高亮片段：cls 为空表示普通文本 */
interface CodeToken {
  text: string;
  cls: string;
}

/** Groovy/Java 常用关键字（够脚本预览用，不引三方高亮库） */
const KEYWORDS =
  "def|class|interface|enum|new|return|if|else|for|while|do|switch|case|default|break|continue|throw|throws|try|catch|finally|import|package|static|final|void|int|long|double|float|boolean|char|byte|short|in|as|instanceof|assert|true|false|null|this|super|extends|implements|synchronized|volatile|transient";

/** 高亮规则顺序：注释 → 字符串 → 注解 → 关键字 → 数字 → 标识符 */
const TOKEN_RE = new RegExp(
  `(\\/\\/[^\\n]*|\\/\\*[\\s\\S]*?\\*\\/)|('(?:\\\\.|[^'\\\\])*'|"(?:\\\\.|[^"\\\\])*")|(@[A-Za-z_][\\w.]*)|\\b(${KEYWORDS})\\b|\\b\\d+(?:\\.\\d+)?\\b|[A-Za-z_$][\\w$]*`,
  "g",
);

/**
 * 把脚本源码切为高亮片段。
 *
 * @param source 源码
 * @return 片段列表
 */
function tokenize(source: string): CodeToken[] {
  const tokens: CodeToken[] = [];
  const re = new RegExp(TOKEN_RE.source, "g");
  let last = 0;
  let matched: RegExpExecArray | null;
  while ((matched = re.exec(source)) !== null) {
    if (matched.index > last) {
      tokens.push({ text: source.slice(last, matched.index), cls: "" });
    }
    const [full, comment, str, annotation, keyword] = matched;
    let cls = "";
    if (comment) {
      cls = "tok-comment";
    } else if (str) {
      cls = "tok-string";
    } else if (annotation) {
      cls = "tok-annotation";
    } else if (keyword) {
      cls = "tok-keyword";
    } else if (/^\d/.test(full)) {
      cls = "tok-number";
    }
    tokens.push({ text: full, cls });
    last = matched.index + full.length;
  }
  if (last < source.length) {
    tokens.push({ text: source.slice(last), cls: "" });
  }
  return tokens;
}

/** 预览高亮片段（空源码时给空数组） */
const tokens = computed<CodeToken[]>(() => (props.modelValue ? tokenize(props.modelValue) : []));

/** 打开编辑器：以当前值为草稿 */
function open(): void {
  draft.value = props.modelValue ?? "";
  visible.value = true;
}

/** 保存草稿并回写 */
function confirm(): void {
  const value = draft.value;
  emit("update:modelValue", value);
  emit("change", value);
  visible.value = false;
}

watch(
  () => props.modelValue,
  (value) => {
    if (!visible.value) {
      draft.value = value ?? "";
    }
  },
);
</script>

<template>
  <div class="script-source">
    <div
      class="script-source__preview"
      :class="{ 'is-empty': !modelValue }"
      role="button"
      tabindex="0"
      @click="open"
      @keydown.enter.prevent="open"
    >
      <pre v-if="modelValue" class="script-source__code"><span
        v-for="(token, index) in tokens"
        :key="index"
        :class="token.cls"
      >{{ token.text }}</span></pre>
      <span v-else class="script-source__placeholder">{{ placeholder || "点击编辑脚本正文" }}</span>
      <span class="script-source__hint">点击编辑</span>
    </div>
    <div v-if="description" class="script-source__desc">{{ description }}</div>

    <ReDialog v-model="visible" title="编辑脚本正文（Groovy）" width="880px" top="6vh" @ok="confirm">
      <textarea
        v-model="draft"
        class="script-source__editor"
        rows="20"
        spellcheck="false"
        :placeholder="editorPlaceholder"
      />
      <div class="script-source__editor-tip">
        执行器需安装脚本引擎（utils-support-groovy-starter）；正文变更自动递增版本并刷新执行器缓存。
      </div>
    </ReDialog>
  </div>
</template>

<style scoped>
.script-source {
  display: flex;
  flex-direction: column;
  gap: 6px;
  /* 占满整行（不做随内容变化的自适应宽度） */
  width: 100%;
}

/* 预览卡片：代码块整行铺满，长正文内部滚动 */
.script-source__preview {
  position: relative;
  width: 100%;
  box-sizing: border-box;
  padding: 10px 14px;
  border-radius: 10px;
  border: 1px solid var(--rm-border, var(--el-border-color-light));
  background: var(--rm-bg-subtle, var(--el-fill-color-light));
  cursor: text;
  transition:
    border-color 0.15s ease,
    background 0.15s ease;
}

.script-source__preview:hover {
  border-color: color-mix(in srgb, var(--el-color-primary) 30%, var(--el-border-color-light));
  background: var(--el-bg-color);
}

.script-source__preview:focus-visible {
  outline: none;
  border-color: var(--el-color-primary);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}

.script-source__preview.is-empty {
  cursor: pointer;
}

.script-source__code {
  margin: 0;
  width: 100%;
  box-sizing: border-box;
  max-height: 220px;
  overflow: auto;
  font-family: ui-monospace, "Cascadia Mono", "Consolas", monospace;
  font-size: 12.5px;
  line-height: 1.7;
  color: var(--el-text-color-primary);
  white-space: pre-wrap;
  word-break: break-word;
  tab-size: 4;
}

/* 轻量语法高亮（Groovy/Java 常用形态） */
.script-source__code .tok-comment {
  color: var(--el-text-color-secondary);
  font-style: italic;
}

.script-source__code .tok-string {
  color: var(--el-color-success);
}

.script-source__code .tok-keyword {
  color: var(--el-color-primary);
  font-weight: 600;
}

.script-source__code .tok-number {
  color: var(--el-color-warning);
}

.script-source__code .tok-annotation {
  color: var(--el-color-info);
}

.script-source__placeholder {
  font-size: 13px;
  color: var(--el-text-color-placeholder);
  line-height: 1.6;
}

.script-source__hint {
  position: absolute;
  right: 10px;
  bottom: 6px;
  padding: 0 6px;
  border-radius: 9999px;
  background: color-mix(in srgb, var(--el-color-primary) 10%, transparent);
  color: var(--el-color-primary);
  font-size: 11px;
  line-height: 18px;
  pointer-events: none;
}

.script-source__desc {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  line-height: 1.5;
}

/* 编辑器：大号等宽输入区 */
.script-source__editor {
  width: 100%;
  min-height: 420px;
  box-sizing: border-box;
  resize: vertical;
  padding: 12px 14px;
  border-radius: 10px;
  border: 1px solid var(--el-border-color-light);
  background: var(--el-fill-color-light);
  color: var(--el-text-color-primary);
  font-family: ui-monospace, "Cascadia Mono", "Consolas", monospace;
  font-size: 13px;
  line-height: 1.7;
  outline: none;
  transition: border-color 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
}

.script-source__editor:hover {
  border-color: color-mix(in srgb, var(--el-color-primary) 30%, var(--el-border-color-light));
}

.script-source__editor:focus {
  border-color: var(--el-color-primary);
  background: var(--el-bg-color);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}

.script-source__editor-tip {
  margin-top: 8px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  line-height: 1.5;
}
</style>
