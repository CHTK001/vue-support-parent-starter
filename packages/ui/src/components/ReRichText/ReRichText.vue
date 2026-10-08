<template>
  <div class="re-rich-text" :class="{ 'is-readonly': readonly }">
    <div v-if="!readonly" class="re-rich-text__toolbar">
      <el-button-group >
        <el-button title="撤销" :disabled="!editor || !active('undo')" @click="run('undo')">
          <el-icon><RefreshLeft /></el-icon>
        </el-button>
        <el-button title="重做" :disabled="!editor || !active('redo')" @click="run('redo')">
          <el-icon><RefreshRight /></el-icon>
        </el-button>
      </el-button-group>
      <el-button-group class="ml-2">
        <el-button title="加粗" :class="{ 'is-on': active('bold') }" :disabled="!editor" @click="run('toggleBold')"><b>B</b></el-button>
        <el-button title="斜体" :class="{ 'is-on': active('italic') }" :disabled="!editor" @click="run('toggleItalic')"><i>I</i></el-button>
        <el-button title="下划线" :class="{ 'is-on': active('underline') }" :disabled="!editor" @click="run('toggleUnderline')"><u>U</u></el-button>
        <el-button title="删除线" :class="{ 'is-on': active('strike') }" :disabled="!editor" @click="run('toggleStrike')"><s>S</s></el-button>
        <el-button title="行内代码" :class="{ 'is-on': active('code') }" :disabled="!editor" @click="run('toggleCode')">{"<>"}</el-button>
      </el-button-group>
      <el-button-group class="ml-2">
        <el-button title="正文" :class="{ 'is-on': active('paragraph') }" :disabled="!editor" @click="run('setParagraph')">正文</el-button>
        <el-button title="标题 1" :class="{ 'is-on': active('heading', { level: 1 }) }" :disabled="!editor" @click="run('toggleHeading', { level: 1 })">H1</el-button>
        <el-button title="标题 2" :class="{ 'is-on': active('heading', { level: 2 }) }" :disabled="!editor" @click="run('toggleHeading', { level: 2 })">H2</el-button>
        <el-button title="标题 3" :class="{ 'is-on': active('heading', { level: 3 }) }" :disabled="!editor" @click="run('toggleHeading', { level: 3 })">H3</el-button>
      </el-button-group>
      <el-button-group class="ml-2">
        <el-button title="无序列表" :class="{ 'is-on': active('bulletList') }" :disabled="!editor" @click="run('toggleBulletList')">•</el-button>
        <el-button title="有序列表" :class="{ 'is-on': active('orderedList') }" :disabled="!editor" @click="run('toggleOrderedList')">1.</el-button>
        <el-button title="引用" :class="{ 'is-on': active('blockquote') }" :disabled="!editor" @click="run('toggleBlockquote')">❝</el-button>
        <el-button title="代码块" :class="{ 'is-on': active('codeBlock') }" :disabled="!editor" @click="run('toggleCodeBlock')">{ }</el-button>
        <el-button title="分割线" :disabled="!editor" @click="run('setHorizontalRule')">—</el-button>
      </el-button-group>
      <el-button-group class="ml-2">
        <el-button title="左对齐" :class="{ 'is-on': active('paragraph', { textAlign: 'left' }) || active('heading', { textAlign: 'left' }) }" :disabled="!editor" @click="run('setTextAlign', 'left')">左</el-button>
        <el-button title="居中" :class="{ 'is-on': active('paragraph', { textAlign: 'center' }) || active('heading', { textAlign: 'center' }) }" :disabled="!editor" @click="run('setTextAlign', 'center')">中</el-button>
        <el-button title="右对齐" :class="{ 'is-on': active('paragraph', { textAlign: 'right' }) || active('heading', { textAlign: 'right' }) }" :disabled="!editor" @click="run('setTextAlign', 'right')">右</el-button>
      </el-button-group>
      <el-button-group class="ml-2">
        <el-button title="插入链接" :class="{ 'is-on': active('link') }" :disabled="!editor" @click="setLink">
          <el-icon><Link /></el-icon>
        </el-button>
        <el-button title="插入图片" :disabled="!editor" @click="setImage">
          <el-icon><Picture /></el-icon>
        </el-button>
        <el-button title="插入公式" :disabled="!editor" @click="openMathDialog">Σ</el-button>
      </el-button-group>
      <el-button class="ml-2" title="清除格式" :disabled="!editor" @click="clearFormat">清除</el-button>
      <slot name="toolbar-extra" />
    </div>
    <EditorContent :editor="editor" class="re-rich-text__content" />

    <!-- 插入公式：符号面板 + LaTeX 输入 + 实时预览 -->
    <ReDialog v-model="mathVisible" title="插入公式" width="600px" append-to-body destroy-on-close>
      <div class="re-rich-text__math">
        <div class="re-rich-text__math-symbols">
          <button
            v-for="s in MATH_SYMBOLS"
            :key="s.tex"
            type="button"
            class="re-rich-text__math-chip"
            :title="s.tex"
            @click="insertMathSymbol(s.tex)"
          >
            {{ s.label }}
          </button>
        </div>
        <el-input
          ref="mathAreaRef"
          v-model="mathDraft"
          type="textarea"
          :rows="3"
          resize="vertical"
          placeholder="输入 LaTeX，如 \sqrt{2}、\frac{1}{3}、x^{2}+y^{2}"
        />
        <div class="re-rich-text__math-tip">点击上方符号追加到光标处；确定后插入到正文光标位置</div>
        <div class="re-rich-text__math-preview" v-html="mathPreviewHtml || '<span class=\'re-rich-text__math-ph\'>预览区</span>'" />
      </div>
      <template #footer>
        <el-button @click="mathVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmMath">确定</el-button>
      </template>
    </ReDialog>
  </div>
</template>

<script setup lang="ts">
/**
 * ReRichText —— TipTap 富文本（扩展局部导入，不依赖 StarterKit）
 *
 * 双向绑定 HTML；insertHtml 供附件插入图片/链接；readonly 供在线预览。
 * 工具栏：撤销/重做、B/I/U/S/行内代码、正文/H1-H3、列表/引用/代码块/分割线、
 *        对齐、链接、图片、清除格式。
 * 用法：
 *   <ReRichText v-model="html" placeholder="编写正文…" />
 *   import ReRichText from "@repo/ui/re-rich-text";
 */
import { computed, nextTick, onBeforeUnmount, ref, watch } from "vue";
import { ElMessage } from "element-plus";
import { ElMessageBox } from "element-plus";
import { Link, Picture, RefreshLeft, RefreshRight } from "@element-plus/icons-vue";
import { Editor, EditorContent } from "@tiptap/vue-3";
import Document from "@tiptap/extension-document";
import Paragraph from "@tiptap/extension-paragraph";
import Text from "@tiptap/extension-text";
import Bold from "@tiptap/extension-bold";
import Italic from "@tiptap/extension-italic";
import Underline from "@tiptap/extension-underline";
import Strike from "@tiptap/extension-strike";
import Code from "@tiptap/extension-code";
import CodeBlock from "@tiptap/extension-code-block";
import Heading from "@tiptap/extension-heading";
import BulletList from "@tiptap/extension-bullet-list";
import OrderedList from "@tiptap/extension-ordered-list";
import ListItem from "@tiptap/extension-list-item";
import Blockquote from "@tiptap/extension-blockquote";
import HorizontalRule from "@tiptap/extension-horizontal-rule";
import Image from "@tiptap/extension-image";
import LinkExt from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import { UndoRedo } from "@tiptap/extensions";
import katex from "katex";
import { InlineMath } from "./inline-math";
import { MATH_SYMBOLS } from "./math-symbols";
import ReDialog from "../ReDialog";

defineOptions({ name: "ReRichText", inheritAttrs: true });

const props = withDefaults(
  defineProps<{
    modelValue?: string;
    placeholder?: string;
    readonly?: boolean;
  }>(),
  {
    modelValue: "",
    placeholder: "",
    readonly: false,
  },
);

const emit = defineEmits<{ (e: "update:modelValue", value: string): void }>();

/** 选区/事务计数，驱动工具栏激活态响应式刷新 */
const tick = ref(0);

const editor = new Editor({
  content: props.modelValue || "",
  editable: !props.readonly,
  extensions: [
    Document,
    Paragraph,
    Text,
    Bold,
    Italic,
    Underline,
    Strike,
    Code,
    CodeBlock,
    Heading.configure({ levels: [1, 2, 3] }),
    BulletList,
    OrderedList,
    ListItem,
    Blockquote,
    HorizontalRule,
    Image.configure({ allowBase64: false }),
    LinkExt.configure({ openOnClick: false, autolink: true, HTMLAttributes: { rel: "noopener", target: "_blank" } }),
    TextAlign.configure({ types: ["heading", "paragraph"] }),
    Placeholder.configure({ placeholder: () => props.placeholder || "" }),
    UndoRedo,
    InlineMath,
  ],
  onUpdate: ({ editor: ed }) => {
    emit("update:modelValue", ed.getHTML());
  },
  onSelectionUpdate: () => {
    tick.value++;
  },
  onTransaction: () => {
    tick.value++;
  },
});

/** 读取激活态（模板中调用以订阅 tick） */
function active(name: string, attrs?: Record<string, unknown>) {
  void tick.value;
  return editor.isActive(name, attrs);
}

watch(
  () => props.modelValue,
  (next) => {
    const html = next ?? "";
    if (editor.getHTML() !== html) {
      editor.commands.setContent(html, { emitUpdate: false });
    }
  },
);

watch(
  () => props.readonly,
  (ro) => {
    editor.setEditable(!ro);
  },
);

function run(cmd: string, arg?: unknown) {
  const chain = editor.chain().focus();
  const map = chain as unknown as Record<string, (...a: unknown[]) => unknown>;
  const fn = map[cmd];
  if (typeof fn !== "function") return;
  if (arg === undefined) {
    (fn as () => unknown).call(chain);
  } else {
    (fn as (a: unknown) => unknown).call(chain, arg);
  }
  (chain as { run: () => boolean }).run();
}

/** 插入/编辑链接 */
async function setLink() {
  const prev = (editor.getAttributes("link").href as string) || "";
  try {
    const { value } = await ElMessageBox.prompt("请输入链接地址", "插入链接", {
      inputValue: prev,
      inputPlaceholder: "https://",
      confirmButtonText: "确定",
      cancelButtonText: "取消",
    });
    const href = (value || "").trim();
    if (!href) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
  } catch {
    /* 取消 */
  }
}

/** 插入图片（按 URL） */
async function setImage() {
  try {
    const { value } = await ElMessageBox.prompt("请输入图片地址", "插入图片", {
      inputPlaceholder: "https://…/image.png",
      confirmButtonText: "确定",
      cancelButtonText: "取消",
    });
    const src = (value || "").trim();
    if (!src) return;
    editor.chain().focus().setImage({ src }).run();
  } catch {
    /* 取消 */
  }
}

function clearFormat() {
  editor.chain().focus().clearNodes().unsetAllMarks().run();
}

// ========== 插入公式 ==========
const mathVisible = ref(false);
const mathDraft = ref("");
const mathAreaRef = ref<{ textarea?: HTMLTextAreaElement } | null>(null);

const mathPreviewHtml = computed(() => {
  const tex = mathDraft.value.trim();
  if (!tex) return "";
  try {
    return katex.renderToString(tex, { throwOnError: false, displayMode: false });
  } catch {
    return "";
  }
});

function openMathDialog() {
  mathDraft.value = "";
  mathVisible.value = true;
}

/** 在光标处插入 LaTeX 片段（无光标时追加到末尾） */
function insertMathSymbol(tex: string) {
  const el = mathAreaRef.value?.textarea;
  if (!el) {
    mathDraft.value = `${mathDraft.value}${tex}`;
    return;
  }
  const start = el.selectionStart ?? mathDraft.value.length;
  const end = el.selectionEnd ?? start;
  mathDraft.value = `${mathDraft.value.slice(0, start)}${tex}${mathDraft.value.slice(end)}`;
  void nextTick(() => {
    el.focus();
    const pos = start + tex.length;
    el.setSelectionRange(pos, pos);
  });
}

function confirmMath() {
  const tex = mathDraft.value.trim();
  mathVisible.value = false;
  if (!tex) return;
  try {
    const ok = editor.chain().focus().insertContent({ type: "inlineMath", attrs: { latex: tex } }).run();
    if (!ok) {
      ElMessage.error("公式插入失败：编辑器未接受内容");
    }
  } catch (e) {
    ElMessage.error(`公式插入异常：${e instanceof Error ? e.message : String(e)}`);
  }
}

/** 在光标处插入 HTML（附件引用图片/链接用） */
function insertHtml(html: string) {
  editor.chain().focus().insertContent(html).scrollIntoView().run();
}

function focus() {
  editor.commands.focus();
}

onBeforeUnmount(() => {
  editor.destroy();
});

defineExpose({ insertHtml, focus, getEditor: () => editor });
</script>

<style scoped>
.re-rich-text {
  width: 100%;
  border: 1px solid var(--el-border-color);
  border-radius: var(--el-border-radius-base);
  background: var(--el-bg-color);
}
.re-rich-text__toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 2px;
  padding: 6px 8px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  background: var(--el-fill-color-light);
}
.re-rich-text__toolbar :deep(.el-button.is-on) {
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
  border-color: var(--el-color-primary-light-5);
}
.re-rich-text__content :deep(.tiptap) {
  min-height: 132px;
  max-height: 360px;
  overflow-y: auto;
  padding: 10px 12px;
  font-size: 14px;
  line-height: 1.7;
  color: var(--el-text-color-primary);
  outline: none;
  word-break: break-word;
}
.re-rich-text__content :deep(.tiptap p.is-editor-empty:first-child::before) {
  content: attr(data-placeholder);
  color: var(--el-text-color-placeholder);
  float: left;
  height: 0;
  pointer-events: none;
}
.re-rich-text__content :deep(.tiptap p) {
  margin: 0 0 6px;
}
.re-rich-text__content :deep(.tiptap ul),
.re-rich-text__content :deep(.tiptap ol) {
  margin: 4px 0;
  padding-left: 22px;
}
.re-rich-text__content :deep(.tiptap ul) {
  list-style: disc;
}
.re-rich-text__content :deep(.tiptap ol) {
  list-style: decimal;
}
.re-rich-text__content :deep(.tiptap img) {
  max-width: 100%;
}
.re-rich-text__content :deep(.tiptap h1) {
  margin: 10px 0 8px;
  font-size: 1.5em;
  font-weight: 700;
}
.re-rich-text__content :deep(.tiptap h2) {
  margin: 9px 0 7px;
  font-size: 1.3em;
  font-weight: 700;
}
.re-rich-text__content :deep(.tiptap h3) {
  margin: 8px 0 6px;
  font-size: 1.1em;
  font-weight: 600;
}
.re-rich-text__content :deep(.tiptap a) {
  color: var(--el-color-primary);
  text-decoration: underline;
  cursor: pointer;
}
.re-rich-text__content :deep(.tiptap blockquote) {
  margin: 6px 0;
  padding: 4px 12px;
  border-left: 3px solid var(--el-color-primary-light-5);
  background: var(--el-fill-color-lighter);
  color: var(--el-text-color-regular);
}
.re-rich-text__content :deep(.tiptap code) {
  padding: 1px 5px;
  border-radius: 4px;
  background: var(--el-fill-color);
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 0.9em;
}
.re-rich-text__content :deep(.tiptap pre) {
  margin: 6px 0;
  padding: 10px 12px;
  border-radius: 8px;
  background: var(--el-fill-color-dark);
  color: var(--el-text-color-primary);
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 0.9em;
  overflow-x: auto;
}
.re-rich-text__content :deep(.tiptap pre code) {
  padding: 0;
  background: transparent;
}
.re-rich-text__content :deep(.tiptap hr) {
  margin: 10px 0;
  border: 0;
  border-top: 1px solid var(--el-border-color);
}
.is-readonly .re-rich-text__content :deep(.tiptap) {
  max-height: none;
  cursor: default;
}
/* 编辑器内行内公式（MathNodeView 会覆盖为 .rx-inline-math，这里兜底序列化样式） */
.re-rich-text__content :deep(.rx-inline-math-serialized) {
  padding: 0 4px;
  border-radius: 6px;
  background: var(--el-color-primary-light-9);
}
.re-rich-text__math-symbols {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 10px;
}
.re-rich-text__math-chip {
  min-width: 34px;
  height: 30px;
  padding: 0 8px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  background: var(--el-bg-color);
  color: var(--el-text-color-primary);
  cursor: pointer;
  font-size: 13px;
}
.re-rich-text__math-chip:hover {
  border-color: var(--el-color-primary-light-5);
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}
.re-rich-text__math-tip {
  margin: 8px 0 10px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.re-rich-text__math-preview {
  padding: 8px 12px;
  min-height: 40px;
  border-radius: 8px;
  background: var(--el-fill-color-light);
  border: 1px dashed var(--el-border-color-lighter);
  font-size: 15px;
  line-height: 1.9;
  color: var(--el-text-color-primary);
  overflow-x: auto;
}
.re-rich-text__math-ph {
  color: var(--el-text-color-placeholder);
  font-size: 13px;
}
.ml-2 {
  margin-left: 8px;
}
</style>
