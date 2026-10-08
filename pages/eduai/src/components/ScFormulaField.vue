<template>
  <div class="sc-formula-field">
    <!-- 展示态：直接渲染文字 + 公式（用户不会看到 $...$ 源码），点击进入编辑模式 -->
    <!-- 整块可点：补 role/tabindex 让键盘能聚焦，:focus-visible 的焦点环才有意义 -->
    <div
      class="sc-formula-field__box"
      :class="{ 'is-empty': !modelValue }"
      role="button"
      tabindex="0"
      title="点击打开编辑模式（支持公式）"
      @click="openEditor"
      @keydown.enter="openEditor"
    >
      <span v-if="!modelValue" class="sc-formula-field__ph">{{ placeholder }}</span>
      <span v-else class="sc-formula-field__rendered" v-html="previewHtml" />
      <span class="sc-formula-field__fx">ƒx</span>
    </div>

    <!-- 编辑模式：大字编辑 + 符号面板 + 实时预览 -->
    <ReDialog
      v-model="editorVisible"
      title="编辑内容（支持公式）"
      width="640px"
      append-to-body
      destroy-on-close
    >
      <div class="sc-fx-editor">
        <div class="sc-fx-editor__symbols">
          <button
            v-for="s in SYMBOLS"
            :key="s.tex"
            type="button"
            class="sc-fx-editor__chip"
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
          placeholder="文字与公式混排，公式用 $...$ 包裹，如：根号2 = $\sqrt{2}$，分数 $\frac{1}{3}$，$x^{2}+y^{2}$"
        />
        <div class="sc-fx-editor__tip">点击上方符号追加到光标处；语法：\sqrt{} \frac{}{} ^{} _{} \pi \pm \times \div \neq \leq \geq</div>
        <div class="sc-fx-editor__preview-label">实时预览</div>
        <div class="sc-fx-editor__preview" v-html="draftHtml || '<span class=\'sc-fx-editor__ph\'>预览区（输入 $...$ 后显示渲染结果）</span>'" />
      </div>
      <template #footer>
        <el-button @click="editorVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmEdit">确定</el-button>
      </template>
    </ReDialog>
  </div>
</template>

<script setup lang="ts">
/**
 * ScFormulaField —— 支持公式的文本字段（选项 / 答案等短文本）
 *
 * 交互：
 *  - 展示态直接把文本与公式渲染出来（KaTeX），用户看不到 $...$ 源码；
 *  - 点击字段（或 ƒx）打开编辑模式：大输入区 + 常用符号面板 + 实时预览；
 *  - 公式用 $...$ 包裹（LaTeX 语法），可与文字混排。
 *
 * 用法：
 *   <ScFormulaField v-model="optionRows[idx]" placeholder="选项 A 内容" />
 */
import { computed, nextTick, ref } from "vue";
import "katex/dist/katex.min.css";
import { MATH_SYMBOLS as SYMBOLS } from "@repo/ui/components/ReRichText/math-symbols";
import { renderMixedText } from "../utils/mathText";
import ReDialog from "@repo/ui/re-dialog";

defineOptions({ name: "ScFormulaField", inheritAttrs: true });

const props = withDefaults(
  defineProps<{
    modelValue?: string;
    placeholder?: string;
  }>(),
  { modelValue: "", placeholder: "" },
);

const emit = defineEmits<{ (e: "update:modelValue", v: string): void }>();

const previewHtml = computed(() => renderMixedText(String(props.modelValue || "")));

// ========== 编辑模式 ==========
const editorVisible = ref(false);
const draft = ref("");
const areaRef = ref<{ textarea?: HTMLTextAreaElement } | null>(null);

const draftHtml = computed(() => renderMixedText(draft.value));

function openEditor() {
  draft.value = String(props.modelValue || "");
  editorVisible.value = true;
}

function confirmEdit() {
  emit("update:modelValue", draft.value);
  editorVisible.value = false;
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
.sc-formula-field {
  width: 100%;
}
.sc-formula-field__box {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 32px;
  padding: 0 10px;
  border: 1px solid var(--el-border-color);
  border-radius: var(--el-radius-md, 8px);
  background: var(--el-bg-color);
  cursor: pointer;
  /* 浏览器默认焦点框太粗，统一换成 koi 焦点环 */
  outline: none;
  transition:
    border-color var(--el-transition-duration-fast, 0.2s) ease,
    box-shadow var(--el-transition-duration-fast, 0.2s) ease;
}
.sc-formula-field__box:hover {
  border-color: var(--el-border-color-hover);
}
.sc-formula-field__box:focus-visible {
  border-color: var(--el-color-primary);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}
.sc-formula-field__box.is-empty .sc-formula-field__ph {
  color: var(--el-text-color-placeholder);
  font-size: 13px;
}
.sc-formula-field__rendered {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  font-size: 14px;
  color: var(--el-text-color-primary);
  line-height: 1.6;
}
.sc-formula-field__ph {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.sc-formula-field__fx {
  flex-shrink: 0;
  color: var(--el-color-primary);
  font-weight: 700;
  font-size: 12px;
  opacity: 0.7;
}
.sc-formula-field__box:hover .sc-formula-field__fx {
  opacity: 1;
}
.sc-fx-editor__symbols {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 10px;
}
.sc-fx-editor__chip {
  min-width: 34px;
  height: 30px;
  padding: 0 8px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-md, 8px);
  background: var(--el-bg-color);
  color: var(--el-text-color-primary);
  cursor: pointer;
  font-size: 13px;
  /* 浏览器默认焦点框太粗，统一换成 koi 焦点环 */
  outline: none;
  transition:
    border-color var(--el-transition-duration-fast, 0.2s) ease,
    color var(--el-transition-duration-fast, 0.2s) ease,
    background var(--el-transition-duration-fast, 0.2s) ease;
}
.sc-fx-editor__chip:hover {
  border-color: var(--el-color-primary-light-5);
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}
.sc-fx-editor__chip:focus-visible {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}
.sc-fx-editor__tip {
  margin: 8px 0 10px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.sc-fx-editor__preview-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin-bottom: 2px;
}
.sc-fx-editor__preview {
  padding: 8px 12px;
  min-height: 40px;
  border-radius: var(--el-radius-md, 8px);
  background: var(--el-fill-color-light);
  border: 1px dashed var(--el-border-color-lighter);
  font-size: 15px;
  line-height: 1.9;
  color: var(--el-text-color-primary);
  word-break: break-word;
  overflow-x: auto;
}
.sc-fx-editor__ph {
  color: var(--el-text-color-placeholder);
  font-size: 13px;
}

/* ============ 无障碍：尊重系统「减少动态效果」偏好 ============ */
@media (prefers-reduced-motion: reduce) {
  .sc-formula-field__box,
  .sc-fx-editor__chip {
    transition: none;
  }
}
</style>
