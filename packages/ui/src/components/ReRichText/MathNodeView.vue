<template>
  <NodeViewWrapper
    as="span"
    class="rx-inline-math"
    :class="{ 'is-selected': selected }"
    title="点击编辑公式"
    @click="openEditor"
  >
    <span v-if="latex" class="rx-inline-math__body" v-html="rendered" />
    <span v-else class="rx-inline-math__ph">公式</span>

    <el-dialog
      v-model="visible"
      title="编辑公式"
      width="600px"
      append-to-body
      destroy-on-close
    >
      <div class="rx-math-editor">
        <div class="rx-math-editor__symbols">
          <button
            v-for="s in MATH_SYMBOLS"
            :key="s.tex"
            type="button"
            class="rx-math-editor__chip"
            :title="s.tex"
            @click="insertSymbol(s.tex)"
          >
            {{ s.label }}
          </button>
        </div>
        <el-input
          ref="areaRef"
          v-model="draft"
          type="textarea"
          :rows="3"
          resize="vertical"
          placeholder="输入 LaTeX，如 \sqrt{2}、\frac{1}{3}、x^{2}+y^{2}"
        />
        <div class="rx-math-editor__tip">点击上方符号追加到光标处</div>
        <div class="rx-math-editor__preview" v-html="draftHtml || '<span class=\'rx-math-editor__ph\'>预览区</span>'" />
      </div>
      <template #footer>
        <el-button v-if="deletable" type="danger" plain @click="removeSelf">删除公式</el-button>
        <el-button @click="visible = false">取消</el-button>
        <el-button type="primary" @click="confirm">确定</el-button>
      </template>
    </el-dialog>
  </NodeViewWrapper>
</template>

<script setup lang="ts">
/**
 * MathNodeView —— TipTap 行内公式节点的视图
 *
 * 编辑器内直接渲染 KaTeX；点击弹出编辑框（符号面板 + 实时预览）；
 * 序列化为 <span data-latex="...">$...$</span>，纯文本化后即为 $...$，便于摘要渲染。
 */
import { computed, nextTick, ref } from "vue";
import { NodeViewWrapper } from "@tiptap/vue-3";
import katex from "katex";
import "katex/dist/katex.min.css";
import { MATH_SYMBOLS, renderMixedText } from "./math-symbols";

defineOptions({ name: "MathNodeView" });

const props = defineProps<{
  node?: { attrs?: { latex?: string } };
  selected?: boolean;
  updateAttributes?: (attrs: Record<string, unknown>) => void;
  deleteNode?: () => void;
}>();

const latex = computed(() => String(props.node?.attrs?.latex ?? ""));
const deletable = computed(() => typeof props.deleteNode === "function");

const renderTex = (tex: string) => {
  try {
    return katex.renderToString(tex, { throwOnError: false, displayMode: false });
  } catch {
    return "";
  }
};

const rendered = computed(() => renderTex(latex.value));

const visible = ref(false);
const draft = ref("");
const areaRef = ref<{ textarea?: HTMLTextAreaElement } | null>(null);

const draftHtml = computed(() => {
  const tex = draft.value.trim();
  return tex ? renderTex(tex) : "";
});

function openEditor() {
  draft.value = latex.value;
  visible.value = true;
}

function confirm() {
  props.updateAttributes?.({ latex: draft.value.trim() });
  visible.value = false;
}

function removeSelf() {
  visible.value = false;
  props.deleteNode?.();
}

/** 在光标处插入 LaTeX 片段（无光标时追加到末尾） */
function insertSymbol(tex: string) {
  const el = areaRef.value?.textarea;
  if (!el) {
    draft.value = `${draft.value}${tex}`;
    return;
  }
  const start = el.selectionStart ?? draft.value.length;
  const end = el.selectionEnd ?? start;
  draft.value = `${draft.value.slice(0, start)}${tex}${draft.value.slice(end)}`;
  void nextTick(() => {
    el.focus();
    const pos = start + tex.length;
    el.setSelectionRange(pos, pos);
  });
}
</script>

<style scoped>
.rx-inline-math {
  display: inline-block;
  padding: 0 4px;
  border-radius: 6px;
  cursor: pointer;
  background: var(--el-color-primary-light-9);
  border: 1px solid transparent;
  vertical-align: baseline;
}
.rx-inline-math:hover {
  border-color: var(--el-color-primary-light-5);
}
.rx-inline-math.is-selected {
  border-color: var(--el-color-primary);
  box-shadow: 0 0 0 2px var(--el-color-primary-light-8);
}
.rx-inline-math__ph {
  color: var(--el-text-color-placeholder);
  font-size: 13px;
}
.rx-math-editor__symbols {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 10px;
}
.rx-math-editor__chip {
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
.rx-math-editor__chip:hover {
  border-color: var(--el-color-primary-light-5);
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}
.rx-math-editor__tip {
  margin: 8px 0 10px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.rx-math-editor__preview {
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
.rx-math-editor__ph {
  color: var(--el-text-color-placeholder);
  font-size: 13px;
}
</style>
