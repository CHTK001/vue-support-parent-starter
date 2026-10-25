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
import { ref, computed, useAttrs, onBeforeUnmount } from "vue";
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
     * 右侧专注模式（默认关闭）。
     *
     * <p>窄列（如表设计网格的「注释」列只有 ~120px）里编辑长文本很吃力：
     * 开启后聚焦时输入框会**锚定当前位置、向右展开**成一块浮层（约 360px 宽，
     * 悬浮在表格之上，z-index 提权），失焦即还原回单元格宽度。</p>
     *
     * <p>实现要点：聚焦时读取 input 的 {@code getBoundingClientRect}，把 wrapper
     * 切到 {@code position: fixed} 铺回同一位置并加宽；滚动时跟随（window scroll
     * 监听重新定位），失焦 / 卸载时清理，不做成「跳走」的分离弹层。</p>
     */
    focusRight?: boolean;
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
  },
);

const focused = ref(false);
const passwordVisible = ref(false);
const floatRect = ref<{ left: number; top: number; width: number } | null>(null);
const wrapRef = ref<HTMLDivElement | null>(null);
/** 专注模式下的浮动定位：null=未展开 */
const floatPos = computed(() => (props.focusRight && focused.value ? floatRect.value : null));

/** 聚焦：切到固定定位铺回原位置并向右展开（展开宽度参考设计表里能用的横向空间） */
function onWrapFocus(e: FocusEvent): void {
  focused.value = true;
  if (!props.focusRight) return;
  window.addEventListener("scroll", onScrollSync, true);
  const input = e.target as HTMLElement | null;
  const rect = input?.getBoundingClientRect?.();
  const vw = window.innerWidth;
  if (rect) {
    floatRect.value = {
      left: rect.left,
      top: rect.top,
      // 向右展开：原宽基础上尽量吃到视口右侧留白，最大 360px，最小 260px
      width: Math.min(360, Math.max(260, vw - rect.left - 16)),
    };
  }
}

function onWrapBlur(): void {
  focused.value = false;
  floatRect.value = null;
  window.removeEventListener("scroll", onScrollSync, true);
}

/** 专注态滚动跟随：fixed 定位不随页面滚，滚动时把输入框钉回 input 当前视口位置 */
function onScrollSync(): void {
  if (!props.focusRight || !focused.value) return;
  const input = wrapRef.value?.querySelector<HTMLElement>(".rm-input__inner, .rm-input__textarea");
  const rect = input?.getBoundingClientRect?.();
  if (rect) {
    const vw = window.innerWidth;
    floatRect.value = {
      left: rect.left,
      top: rect.top,
      width: Math.min(360, Math.max(260, vw - rect.left - 16)),
    };
  }
}

onBeforeUnmount(() => {
  window.removeEventListener("scroll", onScrollSync, true);
});

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
    ref="wrapRef"
    :class="[
      'rm-input-wrap',
      `rm-input-wrap--${size || 'default'}`,
      {
        'rm-input-wrap--focused': focused,
        'rm-input-wrap--disabled': disabled,
        'rm-input-wrap--readonly': readonly,
        [`rm-input-wrap--${status}`]: status,
        'rm-input-wrap--textarea': isTextarea,
        'rm-input-wrap--focus-right': props.focusRight,
      },
    ]"
    :style="floatPos ? { position: 'fixed', left: `${floatPos.left}px`, top: `${floatPos.top}px`, width: `${floatPos.width}px`, zIndex: 3001 } : undefined"
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
      @focus="onWrapFocus"
      @blur="onWrapBlur"
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
      @focus="onWrapFocus"
      @blur="onWrapBlur"
    />

    <div class="rm-input__suffix">
      <slot name="suffix" />

      <!-- 字数统计 -->
      <span v-if="showWordLimit && maxlength" class="rm-input__count">
        {{ String(model ?? '').length }}/{{ maxlength }}
      </span>

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

/* 右侧专注模式：聚焦时是浮在页面上的编辑层（position:fixed + z-index 由内联样式给），
   需要投影把它和底下的表格/单元格区分开，否则浮层和表格融为一体、看不出宽度扩展了。 */
.rm-input-wrap--focus-right.rm-input-wrap--focused {
  box-shadow:
    0 0 0 1px var(--rm-border-focus, var(--rm-primary)) inset,
    0 0 0 4px var(--rm-primary-light-9),
    0 4px 16px rgba(15, 23, 42, 0.16);
  background: var(--rm-bg, #fff);
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
.rm-input__inner,
.rm-input__textarea {
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
.rm-input__inner::placeholder,
.rm-input__textarea::placeholder {
  color: var(--rm-text-disabled);
}

.rm-input__textarea {
  resize: vertical;
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
  font-size: var(--rm-font-xs);
  color: var(--rm-text-secondary);
  white-space: nowrap;
}
</style>
