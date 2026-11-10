<script setup lang="ts">
/**
 * ReInput Modern 布局 —— 现代化扁平输入框
 *
 * 设计特点：
 *   - 扁平设计，无 box-shadow
 *   - 1px 细边框，focus 时边框变色
 *   - 大圆角（8px）
 *   - 平滑过渡动画
 */
import { ref, computed, useAttrs, nextTick } from "vue";
import "../../shared/modern-vars.css";

defineOptions({ name: "ReInputModern", inheritAttrs: true });

const emit = defineEmits<{
  (e: "clear"): void;
}>();

const model = defineModel<string | number | null | undefined>({ default: "" });

/**
 * 只把 {@code aria-*} 属性摘出来，单独透传给内层真正的 input / textarea。
 *
 * <p>为什么需要：{@code v-bind="$attrs"} 挂在包裹层 {@code .rm-input-wrap} 上，
 * 于是 {@code aria-label} 落在 div 上 —— 而可访问名只认**表单控件自身**，
 * 落在 div 上对读屏没有任何作用。实测 {@code PolicyRouteTab.vue} 明明写了
 * {@code :aria-label="t('policy.route.filterAria')"}，浏览器仍报
 * {@code missingAccessibleName: true}。</p>
 *
 * <p>为什么只摘 aria-* 而不是把 $attrs 整体再绑一次：class / style 绑两处会重复，
 * 而事件监听器绑两处会**触发两次**（input 上的 keyup 会冒泡到包裹层，
 * 同一个 handler 被调两遍）。aria-* 没有这两类副作用。</p>
 */
const attrs = useAttrs();
const ariaAttrs = computed<Record<string, unknown>>(() => {
  const out: Record<string, unknown> = {};
  for (const key of Object.keys(attrs)) {
    if (key.startsWith("aria-") && attrs[key] != null) {
      out[key] = attrs[key];
    }
  }
  return out;
});

const props = withDefaults(
  defineProps<{
    type?: string;
    placeholder?: string;
    clearable?: boolean;
    disabled?: boolean;
    readonly?: boolean;
    showPassword?: boolean;
    showWordLimit?: boolean;
    maxlength?: number | string;
    minlength?: number | string;
    rows?: number | string;
    autosize?: boolean | { minRows: number; maxRows: number };
    size?: "large" | "default" | "small";
    prefixIcon?: string;
    suffixIcon?: string;
    status?: "" | "success" | "warning" | "error";
    formatter?: (value: string | number | undefined) => string;
    parser?: (value: string) => string;
    /**
     * 专注编辑（默认关闭）：输入框右侧出现一个专注图标，点击弹出编辑框。
     *
     * <p>窄列（如表设计网格的「注释」列只有 ~120px）里编辑长文本很吃力。
     * 早先的实现是「聚焦即把输入框改成 position:fixed 向右展开成浮层」，
     * 那样会临时改变元素定位、盖住相邻单元格，行列对齐在展开/收起瞬间抖动，
     * 表格整体样式也跟着乱。</p>
     *
     * <p>现在改成「图标 + 弹层」：输入框自身尺寸与定位永远不变，只有用户
     * 主动点图标时才打开一个居中的编辑框（textarea + 确定/取消），
     * 编辑大段文本不受单元格宽度限制，也不会打扰表格布局。</p>
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
    size: "default",
    prefixIcon: "",
    suffixIcon: "",
    status: "",
    formatter: undefined,
    parser: undefined,
    focusRight: false,
    trim: true,
  },
);

const focused = ref(false);
const passwordVisible = ref(false);

/** 专注编辑弹层是否打开 */
const focusOpen = ref(false);
/** 弹层里的草稿值：确定才回写，取消即丢弃 */
const focusDraft = ref("");
/** 弹层 textarea，打开后自动聚焦 */
const focusAreaRef = ref<HTMLTextAreaElement | null>(null);

function onFocus(): void {
  focused.value = true;
}

function onBlur(): void {
  focused.value = false;
}

/** 打开专注编辑框，草稿从当前值起步 */
async function openFocusEditor(): Promise<void> {
  if (props.disabled || props.readonly) return;
  focusDraft.value = String(model.value ?? "");
  focusOpen.value = true;
  await nextTick();
  focusAreaRef.value?.focus();
}

/** 取消：丢弃草稿 */
function cancelFocusEditor(): void {
  focusOpen.value = false;
}

/** 确定：把草稿回写成模型值 */
function applyFocusEditor(): void {
  // trim：确保从草稿回写的值也经过同一套修剪口径
  model.value = (props.trim ? focusDraft.value.trim() : focusDraft.value) as never;
  focusOpen.value = false;
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

const isTextarea = computed(() => props.type === "textarea");
const inputType = computed(() => {
  if (props.type === "password" && passwordVisible.value) return "text";
  return props.type;
});

const displayValue = computed(() => {
  if (props.formatter) return props.formatter(model.value as string | number | undefined);
  return model.value ?? "";
});

function onInput(e: Event): void {
  const target = e.target as HTMLInputElement | HTMLTextAreaElement;
  let val: string = target.value;
  if (props.parser) val = props.parser(val);
  // trim：只改 string 值，默认开启
  if (props.trim && typeof val === "string") val = val.trim();
  model.value = val as never;
}

function onClear(): void {
  model.value = "" as never;
  emit("clear");
}

function togglePassword(): void {
  passwordVisible.value = !passwordVisible.value;
}
</script>

<template>
  <div
    :class="[
      'rm-input-wrap',
      `rm-input-wrap--${size || 'default'}`,
      {
        'rm-input-wrap--focused': focused,
        'rm-input-wrap--disabled': disabled,
        'rm-input-wrap--readonly': readonly,
        [`rm-input-wrap--${status}`]: status,
        'rm-input-wrap--textarea': isTextarea,
      },
    ]"
    v-bind="$attrs"
  >
    <div v-if="$slots.prefix || prefixIcon" class="rm-input__prefix">
      <slot name="prefix">
        <span v-if="prefixIcon" class="rm-input__icon">{{ prefixIcon }}</span>
      </slot>
    </div>

    <textarea
      v-if="isTextarea"
      :value="displayValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :readonly="readonly"
      :rows="rows"
      :maxlength="maxlength as any"
      :minlength="minlength as any"
      class="rm-input__textarea"
      v-bind="ariaAttrs"
      @input="onInput"
      @focus="onFocus"
      @blur="onBlur"
    />
    <input
      v-else
      :type="inputType"
      :value="displayValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :readonly="readonly"
      :maxlength="maxlength as any"
      :minlength="minlength as any"
      class="rm-input__inner"
      v-bind="ariaAttrs"
      @input="onInput"
      @focus="onFocus"
      @blur="onBlur"
    />

    <div class="rm-input__suffix">
      <slot name="suffix" />

      <!-- 字数统计 -->
      <span v-if="showWordLimit && maxlength" class="rm-input__count">
        {{ String(model ?? '').length }}/{{ maxlength }}
      </span>

      <!-- 专注编辑：点图标弹编辑框，输入框自身尺寸/定位不变 -->
      <button
        v-if="focusRight && !disabled && !readonly"
        class="rm-input__focus"
        type="button"
        aria-label="专注编辑"
        title="专注编辑"
        @click.stop="openFocusEditor"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M15 3h6v6" />
          <path d="M9 21H3v-6" />
          <path d="M21 3l-7 7" />
          <path d="M3 21l7-7" />
        </svg>
      </button>

      <!-- 密码切换 -->
      <button v-if="showPassword" class="rm-input__eye" type="button" @click="togglePassword">
        <svg v-if="!passwordVisible" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
        <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
      </button>

      <!-- 清除按钮 -->
      <button v-if="clearable && model" class="rm-input__clear" type="button" @click="onClear">
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z"/></svg>
      </button>

      <slot name="append" />
    </div>
  </div>

  <!-- 专注编辑弹层：挂在 body 上，不受表格单元格裁剪与层级影响 -->
  <Teleport to="body">
    <div v-if="focusOpen" class="rm-focus-mask" @click.self="cancelFocusEditor">
      <div class="rm-focus-panel" role="dialog" aria-modal="true" aria-label="专注编辑">
        <div class="rm-focus-head">
          <span class="rm-focus-title">专注编辑</span>
          <button class="rm-focus-close" type="button" aria-label="关闭" @click="cancelFocusEditor">×</button>
        </div>
        <textarea
          ref="focusAreaRef"
          v-model="focusDraft"
          class="rm-focus-textarea"
          rows="10"
          :placeholder="placeholder || '请输入内容'"
          @keydown="onFocusKeydown"
        />
        <div class="rm-focus-foot">
          <span class="rm-focus-count">{{ focusDraft.length }} 字符</span>
          <span class="rm-focus-spacer" />
          <button class="rm-focus-btn" type="button" @click="cancelFocusEditor">取消</button>
          <button class="rm-focus-btn rm-focus-btn--primary" type="button" @click="applyFocusEditor">确定</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.rm-input-wrap {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: var(--rm-height);
  padding: 0 12px;
  border-radius: var(--rm-radius);
  background: var(--rm-bg);
  box-shadow: 0 0 0 1px var(--rm-border-light) inset;
  transition:
    box-shadow var(--rm-transition),
    background var(--rm-transition);
  width: 100%;
  box-sizing: border-box;
}

.rm-input-wrap--small { height: var(--rm-height-sm); font-size: var(--rm-font-sm); border-radius: var(--rm-radius-sm); }
.rm-input-wrap--large { height: var(--rm-height-lg); font-size: var(--rm-font-lg); border-radius: var(--rm-radius-md); }

.rm-input-wrap--textarea {
  height: auto;
  align-items: flex-start;
  padding: 8px 12px;
}

/* Focus */
.rm-input-wrap--focused {
  box-shadow: 0 0 0 1px var(--rm-border-focus, var(--rm-primary)) inset, 0 0 0 4px var(--rm-primary-light-9);
}

/* Status */
.rm-input-wrap--success { box-shadow: 0 0 0 1px var(--rm-success) inset; }
.rm-input-wrap--warning { box-shadow: 0 0 0 1px var(--rm-warning) inset; }
.rm-input-wrap--error { box-shadow: 0 0 0 1px var(--rm-danger) inset; }

/* Disabled */
.rm-input-wrap--disabled {
  background: var(--rm-bg-disabled);
  cursor: not-allowed;
  opacity: 0.6;
}
.rm-input-wrap--disabled .rm-input__inner,
.rm-input-wrap--disabled .rm-input__textarea {
  cursor: not-allowed;
}

/* Inner input */
.rm-input__inner {
  flex: 1;
  min-width: 0;
  border: none;
  outline: none;
  background: transparent;
  color: var(--rm-text);
  font-size: inherit;
  font-family: inherit;
  line-height: 1.5;
  width: 100%;
  padding: 0;
}

/* 多行文本：可拖拽缩放，视觉自成一格（textarea 留足够内边距，减少对齐） */
.rm-input__textarea {
  flex: 1;
  min-width: 0;
  border: none;
  outline: none;
  background: transparent;
  color: var(--rm-text);
  font-size: inherit;
  font-family: inherit;
  line-height: 1.6;
  width: 100%;
  resize: vertical;
}
.rm-input__textarea::placeholder {
  color: var(--rm-text-disabled);
}

/* Prefix / Suffix */
.rm-input__prefix {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  color: var(--rm-text-secondary);
}
.rm-input__suffix {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
  color: var(--rm-text-secondary);
}
.rm-input__icon {
  font-size: 16px;
}

/* Clear */
.rm-input__clear {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border: none;
  background: none;
  padding: 0;
  cursor: pointer;
  color: var(--rm-text-secondary);
  border-radius: 50%;
  transition: color var(--rm-transition);
}
.rm-input__clear:hover { color: var(--rm-text); }
.rm-input__clear svg { width: 14px; height: 14px; }

/* Focus-mode icon：常态低对比，hover / focus 才提亮，避免抢走输入内容的注意力 */
.rm-input__focus {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border: none;
  background: none;
  padding: 0;
  cursor: pointer;
  color: var(--rm-text-disabled);
  border-radius: var(--el-radius-xs, 4px);
  transition: color var(--rm-transition), background var(--rm-transition);
}
.rm-input__focus:hover {
  color: var(--rm-primary);
  background: var(--rm-primary-light-9);
}
.rm-input__focus:focus-visible {
  outline: none;
  color: var(--rm-primary);
  box-shadow: 0 0 0 2px var(--rm-primary-light-9);
}
.rm-input__focus svg { width: 13px; height: 13px; }

/* Eye */
.rm-input__eye {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border: none;
  background: none;
  padding: 0;
  cursor: pointer;
  color: var(--rm-text-secondary);
  transition: color var(--rm-transition);
}
.rm-input__eye:hover { color: var(--rm-text); }
.rm-input__eye svg { width: 16px; height: 16px; }

/* Count */
.rm-input__count {
  font-size: var(--rm-font-sm, 12px);
  color: var(--rm-text-secondary);
  white-space: nowrap;
}

/* ---------- 专注编辑弹层 ---------- */
.rm-focus-mask {
  position: fixed;
  inset: 0;
  z-index: 3000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: var(--rm-overlay);
}

.rm-focus-panel {
  width: min(720px, 100%);
  max-height: 100%;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px 16px 12px;
  border-radius: var(--el-radius-lg, 12px);
  background: var(--rm-bg-overlay);
  box-shadow: var(--rm-shadow-lg);
  box-sizing: border-box;
}

.rm-focus-head {
  display: flex;
  align-items: center;
  gap: 8px;
}

.rm-focus-title {
  flex: 1;
  min-width: 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--rm-text);
}

.rm-focus-close {
  flex: none;
  width: 22px;
  height: 22px;
  border: none;
  background: none;
  padding: 0;
  cursor: pointer;
  font-size: 18px;
  line-height: 1;
  color: var(--rm-text-secondary);
  border-radius: var(--el-radius-xs, 4px);
  transition: color var(--rm-transition), background var(--rm-transition);
}
.rm-focus-close:hover {
  color: var(--rm-text);
  background: var(--rm-bg-hover);
}

.rm-focus-textarea {
  flex: 1;
  min-height: 160px;
  width: 100%;
  box-sizing: border-box;
  padding: 8px 10px;
  border: 1px solid var(--rm-border);
  border-radius: var(--el-radius-md, 8px);
  background: var(--rm-bg);
  color: var(--rm-text);
  font-family: inherit;
  font-size: 13px;
  line-height: 1.6;
  resize: vertical;
  outline: none;
  transition: border-color var(--rm-transition);
}
.rm-focus-textarea:focus { border-color: var(--rm-border-focus); }

.rm-focus-foot {
  display: flex;
  align-items: center;
  gap: 8px;
}

.rm-focus-count {
  font-size: 11px;
  color: var(--rm-text-secondary);
}

.rm-focus-spacer { flex: 1; }

.rm-focus-btn {
  height: 28px;
  padding: 0 12px;
  border: 1px solid var(--rm-border);
  border-radius: var(--el-radius-sm, 6px);
  background: var(--rm-bg);
  color: var(--rm-text-regular);
  font-size: 12px;
  cursor: pointer;
  transition: border-color var(--rm-transition), color var(--rm-transition), background var(--rm-transition);
}
.rm-focus-btn:hover {
  border-color: var(--rm-border-hover);
  color: var(--rm-text);
}

.rm-focus-btn--primary {
  border-color: var(--rm-primary);
  background: var(--rm-primary);
  color: var(--rm-text-white);
}
.rm-focus-btn--primary:hover {
  border-color: var(--rm-primary-hover);
  background: var(--rm-primary-hover);
  color: var(--rm-text-white);
}
</style>
