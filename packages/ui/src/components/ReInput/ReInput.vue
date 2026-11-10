<script setup lang="ts">
/**
 * ReInput —— 输入框组件
 *
 * 透传 el-input 全部能力（v-model + 所有 props / slots）。
 * 增强：
 *   - icon：可传 Element Plus PascalCase 名 / Iconify 三方库 / HTTP URL，自动渲染为 prefix / suffix 图标
 *   - status：success / warning / error，用于表单校验态
 *   - formatter / parser：双向格式化（如金额千分位、trim 等）
 *   - layout：布局变体，"el"（默认，el-input）/ "modern"（现代化扁平输入框，异步加载）
 */
import { computed, defineAsyncComponent, nextTick, ref, useAttrs } from "vue";
import { ElInput } from "element-plus";
import ReIcon from "../ReIcon/theme/default/ReIcon.vue";

/** Modern 布局组件（按需异步加载） */
const ModernLayout = defineAsyncComponent(() => import("./layouts/Modern.vue"));

defineOptions({ name: "ReInput", inheritAttrs: true });

const emit = defineEmits<{
  (e: "clear"): void;
  (e: "input", value: string | number | null | undefined): void;
  (e: "change", value: string | number | null | undefined): void;
}>();

const model = defineModel<string | number | null | undefined>({ default: "" });

const props = withDefaults(
  defineProps<{
    /** 布局变体："el"（默认 el-input）/ "modern"（现代化扁平输入框） */
    layout?: "el" | "modern";
    type?: "text" | "password" | "textarea" | "number" | "email" | "tel" | "url" | "search" | "date" | "datetime-local" | (string & {});
    placeholder?: string;
    clearable?: boolean;
    disabled?: boolean;
    readonly?: boolean;
    showPassword?: boolean;
    showWordLimit?: boolean;
    maxlength?: number | string;
    minlength?: number | string;
    rows?: number;
    autosize?: boolean | { minRows: number; maxRows: number };
    size?: "large" | "default" | "small";
    /** 前缀图标 */
    prefixIcon?: string;
    /** 后缀图标 */
    suffixIcon?: string;
    /** 校验态：success / warning / error */
    status?: "" | "success" | "warning" | "error";
    /** 显示格式化（如千分位） */
    formatter?: (value: string | number | undefined) => string;
    /** 输入回写格式化（与 formatter 配合使用） */
    parser?: (value: string) => string;
    /**
     * 专注编辑：输入框右侧出现一个专注图标，点击图标弹出编辑框
     * （textarea + 确定/取消），用于窄列（如表设计网格的注释列、
     * 数据网格的格内编辑）编辑长文本。
     *
     * <p>el 与 modern 两种布局均生效。输入框自身的尺寸与定位始终不变
     * —— 不再「聚焦即展开成浮层」，避免临时改定位盖住相邻单元格、
     * 让表格行列对齐抖动。</p>
     */
    focusRight?: boolean;
    /**
     * 是否修剪输入值（默认 true）。
     *
     * <p>只修剪 string 值。传 {@code trim: false} 时保留两端空格（适合密码 / IP 等不允许去空的字段）。</p>
     */
    trim?: boolean;
  }>(),
  {
    layout: "el",
    type: "text",
    placeholder: "",
    clearable: false,
    disabled: false,
    readonly: false,
    showPassword: false,
    showWordLimit: false,
    maxlength: undefined,
    minlength: undefined,
    rows: 2,
    autosize: false,
    size: undefined as undefined | "large" | "default" | "small",
    prefixIcon: "",
    suffixIcon: "",
    status: undefined as undefined | "success" | "warning" | "error",
    formatter: undefined,
    parser: undefined,
    focusRight: false,
    trim: true,
  },
);

function onInput(value: string | number | null | undefined): void {
  // trim：只改 string 值（parser 之后），默认开启
  if (props.trim && typeof value === "string") {
    value = value.trim();
  }
  if (props.parser) {
    model.value = props.parser(String(value)) as never;
  } else {
    model.value = value as never;
  }
  // 把 input 一并向外转发。根因（2026-10-10「表单模式没有编辑」）：
  // ReInput 用 defineEmits 声明了 input / change，却只在内部消费、从不 emit——
  // Vue 会把「已声明事件」的监听器从 $attrs 里摘掉（attrs 只收未声明项），
  // 于是父组件的 @input / @change 永远收不到，NginxConfigPanel 的
  // @input="markDirty"、NginxModelForm 的 @change="onHeadArg" 全部哑掉。
  emit("input", model.value);
}

/**
 * el 分支的 change 转发：ElInput 失焦 / 回车时 emit change(当前值)。
 *
 * <p>优先报组件自己的 model（parser 处理后的值），事件值仅作兜底——
 * 下游 {@code onHeadArg(val)} 等消费的是「组件当前值」而不是原始输入。</p>
 *
 * @param value ElInput change 携带的原始值
 */
function onChangeEl(value: string | number | null | undefined): void {
  emit("change", model.value ?? value);
}

/**
 * modern 分支的 change 转发：Modern 布局不声明 change 事件，
 * 绑到它身上的 onChangeNative 会落进其 $attrs 并被铺到内部原生 input 上，
 * 收到的是原生 Event，值要从 target 上取。
 *
 * @param e 原生 change 事件
 */
function onChangeNative(e: Event): void {
  const t = e.target as HTMLInputElement | null;
  emit("change", t ? t.value : model.value);
}

/** 点 × 清空：ElInput 会 emit update:model-value("")，这里回写 model 后再把 clear 向外透传。 */
function onClear(): void {
  emit("clear");
}

const attrs = useAttrs();
/**
 * el 布局透传属性：剥离 onBlur。
 *
 * <p>blur 由 {@link onElBlur} 统一转发，专注编辑弹窗打开期间输入框失焦
 * 是弹窗抢焦点导致的「暂时离开」，不是用户确认结束编辑，不应触发
 * 父组件的 `@blur` 保存（DBM 格内编辑靠 blur 落库，误触发会把弹窗前的
 * 旧值先保存、随后确认的新值反而丢在编辑态里）。</p>
 */
const elInputAttrs = computed(() => {
  const rest: Record<string, unknown> = {};
  for (const key of Object.keys(attrs)) {
    if (key !== "onBlur") rest[key] = attrs[key];
  }
  return rest;
});

/** el 布局的专注编辑弹层是否打开 */
const focusOpen = ref(false);
/** 弹层里的草稿值：确定才回写，取消即丢弃 */
const focusDraft = ref("");
/** 弹层 textarea，打开后自动聚焦 */
const focusAreaRef = ref<HTMLTextAreaElement | null>(null);

/** 打开专注编辑框，草稿从当前值起步 */
async function openFocusEditor(): Promise<void> {
  if (props.disabled || props.readonly) return;
  focusDraft.value = String(model.value ?? "");
  focusOpen.value = true;
  await nextTick();
  focusAreaRef.value?.focus();
}

/** el 输入框实例：专注弹层关闭后把焦点还回输入框 */
const elInputRef = ref<InstanceType<typeof ElInput> | null>(null);

/** 取消：丢弃草稿 */
function cancelFocusEditor(): void {
  focusOpen.value = false;
  void nextTick(() => elInputRef.value?.focus());
}

/** 确定：把草稿回写成模型值 */
function applyFocusEditor(): void {
  onInput(focusDraft.value);
  focusOpen.value = false;
  void nextTick(() => elInputRef.value?.focus());
}

/** 弹层里的键盘：Esc 取消、Ctrl/Cmd+Enter 确定 */
function onFocusKeydown(e: KeyboardEvent): void {
  if (e.key === "Escape") {
    e.stopPropagation();
    cancelFocusEditor();
  } else if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
    e.preventDefault();
    applyFocusEditor();
  }
}

/** el 输入框 blur：专注弹窗打开期间不透传，其余情况按原样转发给父组件。 */
function onElBlur(e: FocusEvent): void {
  if (focusOpen.value) return;
  const onBlur = attrs.onBlur;
  if (typeof onBlur === "function") {
    (onBlur as (e: FocusEvent) => void)(e);
  } else if (Array.isArray(onBlur)) {
    onBlur.forEach(handler => {
      if (typeof handler === "function") (handler as (e: FocusEvent) => void)(e);
    });
  }
}
</script>

<template>
  <div class="re-input">
    <!-- Modern 布局（异步加载） -->
    <ModernLayout
      v-if="layout === 'modern'"
      :model-value="model"
      @update:model-value="onInput"
      @change="onChangeNative"
      v-bind="$attrs"
      :type="type"
      :placeholder="placeholder"
      :clearable="clearable"
      :disabled="disabled"
      :readonly="readonly"
      :show-password="showPassword"
      :show-word-limit="showWordLimit"
      :maxlength="maxlength"
      :minlength="minlength"
      :rows="rows"
      :autosize="autosize"
      :size="size"
      :prefix-icon="prefixIcon"
      :suffix-icon="suffixIcon"
      :status="status"
      :formatter="formatter"
      :parser="parser"
      :focus-right="focusRight"
      :trim="trim"
    >
      <template v-if="$slots.prefix" #prefix>
        <slot name="prefix" />
      </template>
      <template v-if="$slots.suffix" #suffix>
        <slot name="suffix" />
      </template>
      <template v-if="$slots.prepend" #prepend>
        <slot name="prepend" />
      </template>
      <template v-if="$slots.append" #append>
        <slot name="append" />
      </template>
    </ModernLayout>

    <!-- 默认 el-input 布局 -->
    <ElInput
      v-else
      ref="elInputRef"
      :model-value="formatter ? formatter(model as never) : (model as never)"
      v-bind="elInputAttrs"
      :type="type"
      :placeholder="placeholder"
      :clearable="clearable"
      :disabled="disabled"
      :readonly="readonly"
      :show-password="showPassword"
      :show-word-limit="showWordLimit"
      :maxlength="maxlength"
      :minlength="minlength"
      :rows="rows"
      :autosize="autosize"
      :size="size"
      :prefix-icon="prefixIcon || undefined"
      :suffix-icon="suffixIcon || undefined"
      :status="status"
      @update:model-value="onInput"
      @change="onChangeEl"
      @clear="onClear"
      @blur="onElBlur"
    >
      <template v-if="$slots.prefix" #prefix>
        <slot name="prefix" />
      </template>
      <template v-if="$slots.suffix || $slots.append || focusRight" #suffix>
        <slot name="suffix" />
        <!-- 专注编辑：点图标弹编辑框，输入框自身尺寸/定位不变 -->
        <button
          v-if="focusRight && !disabled && !readonly"
          class="re-input__focus"
          type="button"
          aria-label="专注编辑"
          title="专注编辑"
          @mousedown.prevent
          @click.stop="openFocusEditor"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M15 3h6v6" />
            <path d="M9 21H3v-6" />
            <path d="M21 3l-7 7" />
            <path d="M3 21l7-7" />
          </svg>
        </button>
      </template>
      <template v-if="$slots.prepend" #prepend>
        <slot name="prepend" />
      </template>
      <template v-if="$slots.append" #append>
        <slot name="append" />
      </template>
    </ElInput>

    <!-- 专注编辑弹层（el 布局）：挂在 body 上，不受表格单元格裁剪与层级影响 -->
    <Teleport to="body">
      <div v-if="focusOpen" class="re-focus-mask" @click.self="cancelFocusEditor">
        <div class="re-focus-panel" role="dialog" aria-modal="true" aria-label="专注编辑">
          <div class="re-focus-head">
            <span class="re-focus-title">专注编辑</span>
            <button class="re-focus-close" type="button" aria-label="关闭" @click="cancelFocusEditor">×</button>
          </div>
          <textarea
            ref="focusAreaRef"
            v-model="focusDraft"
            class="re-focus-textarea"
            rows="10"
            :placeholder="placeholder || '请输入内容'"
            @keydown="onFocusKeydown"
          />
          <div class="re-focus-foot">
            <span class="re-focus-count">{{ focusDraft.length }} 字符</span>
            <span class="re-focus-spacer" />
            <button class="re-focus-btn" type="button" @click="cancelFocusEditor">取消</button>
            <button class="re-focus-btn re-focus-btn--primary" type="button" @click="applyFocusEditor">确定</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style>
/* 高度统一 34px（与 ReSelect / 表单控件基线对齐）；size=small/large 显式变体保持 element 原有尺寸。
   盒模型与 el-select__wrapper 对齐：border-box + min-height 34px（含 1px 上下 border），
   inner 内容高度 = 34 - 8(padding) - 2(border) = 24px，由 flex 垂直居中，box 总高恒为 34。 */
.re-input .el-input {
  --el-input-height: 34px;
  /* 圆角放大：Element 默认 --el-input-border-radius 落到 --el-border-radius-base（4px），
     在 34px 高的输入框上偏方。这里统一到 10px，与卡片/按钮的圆角语言一致。
     用变量下发而不是直接改 border-radius，方便业务侧单独调（--re-input-radius）。 */
  --el-input-border-radius: var(--re-input-radius, 10px);
}
.re-input .el-input.el-input--small {
  --el-input-height: 24px;
  --el-input-border-radius: var(--re-input-radius, 8px);
}
.re-input .el-input.el-input--large {
  --el-input-height: 40px;
  --el-input-border-radius: var(--re-input-radius, 12px);
}
.re-input .el-input .el-input__wrapper {
  box-sizing: border-box;
  min-height: var(--el-input-height);
  height: auto;
}
.re-input .el-input .el-input__inner {
  height: auto;
  min-height: calc(var(--el-input-height) - 10px);
  line-height: calc(var(--el-input-height) - 10px);
}
.re-input .el-input .el-input__prefix,
.re-input .el-input .el-input__suffix {
  top: 0;
  bottom: 0;
  display: flex;
  align-items: center;
}
/* 包裹层不产生盒子，避免影响既有布局（class/style 通过 v-bind="$attrs" 仍落到内部控件） */
.re-input {
  display: contents;
}

/* ===== 专注编辑（el 布局）：图标 + 弹层 ===== */
/* 图标：常态低对比，hover / focus 才提亮，避免抢走输入内容的注意力 */
.re-input .re-input__focus {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border: none;
  background: none;
  padding: 0;
  margin-left: 2px;
  cursor: pointer;
  color: var(--el-text-color-placeholder);
  border-radius: var(--el-border-radius-small, 4px);
  transition: color 0.2s, background 0.2s;
}
.re-input .re-input__focus:hover {
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}
.re-input .re-input__focus:focus-visible {
  outline: none;
  color: var(--el-color-primary);
  box-shadow: 0 0 0 2px var(--el-color-primary-light-8);
}
.re-input .re-input__focus svg {
  width: 13px;
  height: 13px;
}

/* 弹层：挂在 body 上，不受表格单元格裁剪与层级影响 */
.re-focus-mask {
  position: fixed;
  inset: 0;
  z-index: 3000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(0, 0, 0, 0.45);
}

.re-focus-panel {
  width: min(720px, 100%);
  max-height: 100%;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px 16px 12px;
  border-radius: var(--el-border-radius-base, 4px);
  background: var(--el-bg-color);
  box-shadow: var(--el-box-shadow);
  box-sizing: border-box;
}

.re-focus-head {
  display: flex;
  align-items: center;
  gap: 8px;
}

.re-focus-title {
  flex: 1;
  min-width: 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.re-focus-close {
  flex: none;
  width: 22px;
  height: 22px;
  border: none;
  background: none;
  padding: 0;
  cursor: pointer;
  font-size: 18px;
  line-height: 1;
  color: var(--el-text-color-secondary);
  border-radius: var(--el-border-radius-small, 4px);
  transition: color 0.2s, background 0.2s;
}
.re-focus-close:hover {
  color: var(--el-text-color-primary);
  background: var(--el-fill-color-light);
}

.re-focus-textarea {
  flex: 1;
  min-height: 160px;
  width: 100%;
  box-sizing: border-box;
  padding: 8px 10px;
  border: 1px solid var(--el-border-color);
  border-radius: var(--el-border-radius-base, 4px);
  background: var(--el-fill-color-blank);
  color: var(--el-text-color-primary);
  font-family: inherit;
  font-size: 13px;
  line-height: 1.6;
  resize: vertical;
  outline: none;
  transition: border-color 0.2s;
}
.re-focus-textarea:focus {
  border-color: var(--el-color-primary);
}

.re-focus-foot {
  display: flex;
  align-items: center;
  gap: 8px;
}

.re-focus-count {
  font-size: 11px;
  color: var(--el-text-color-secondary);
}

.re-focus-spacer { flex: 1; }

.re-focus-btn {
  height: 28px;
  padding: 0 12px;
  border: 1px solid var(--el-border-color);
  border-radius: var(--el-border-radius-base, 4px);
  background: var(--el-fill-color-blank);
  color: var(--el-text-color-primary);
  font-size: 12px;
  cursor: pointer;
  transition: border-color 0.2s, color 0.2s, background 0.2s;
}
.re-focus-btn:hover {
  border-color: var(--el-border-color-hover);
  color: var(--el-text-color-primary);
}

.re-focus-btn--primary {
  border-color: var(--el-color-primary);
  background: var(--el-color-primary);
  color: var(--el-color-white);
}
.re-focus-btn--primary:hover {
  border-color: var(--el-color-primary-light-3);
  background: var(--el-color-primary-light-3);
  color: var(--el-color-white);
}
</style>