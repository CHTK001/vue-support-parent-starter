<script setup lang="ts">
/**
 * ReRemoteSelect —— 远程 + 自定义下拉选择组件
 *
 * 设计要点：
 *   - 视觉整体：左侧 trigger bar（输入 + 选中回显）+ 右侧同步按钮同框内
 *   - 左侧模仿 ReSelect card-dropdown 风格：选中态/输入态 + 下拉弹层
 *   - enableInput 开关：true 时 trigger 内可输入（搜索/自定义值），false 时仅显示
 *   - 同步按钮：loading 旋转 + hover 主色高亮
 *   - 数据源：url（GET 自动重试）/ loader（自定义函数）/ options 静态
 *   - 现代化扁平化：玻璃质感 + 主色聚焦光晕
 */
import { computed, ref, watch, onMounted, nextTick } from "vue";
import { ElPopover, ElInput } from "element-plus";
import { useDataSource, type ReDataSource } from "@repo/core";
import { debounce, yieldToMain } from "@repo/utils";
import "../shared/modern-vars.css";
import ReIcon from "../ReIcon/theme/default/ReIcon.vue";
import type { ReRemoteOption } from "./types";

defineOptions({ name: "ReRemoteSelect", inheritAttrs: true });

const model = defineModel<string | number | (string | number)[] | null | undefined>({ default: "" });

const props = withDefaults(
  defineProps<{
    /** 远程接口地址（GET） */
    url?: string;
    /** 自定义加载函数 */
    loader?: (params?: Record<string, unknown>) => ReRemoteOption[] | Promise<ReRemoteOption[]>;
    /** 远程请求额外参数 */
    params?: Record<string, unknown>;
    /** 静态选项（与 url/loader 互斥） */
    options?: ReRemoteOption[];
    /** 是否可在 trigger 内输入 */
    enableInput?: boolean;
    /** 是否可搜索 */
    filterable?: boolean;
    /** 是否可清空 */
    clearable?: boolean;
    /** 是否禁用 */
    disabled?: boolean;
    /** 加载 placeholder */
    placeholder?: string;
    /** 输入 placeholder（enableInput=true 时） */
    inputPlaceholder?: string;
    /** 尺寸 */
    size?: "large" | "default" | "small";
    /** 自动重新加载 */
    autoReload?: boolean;
    /**
     * 同步按钮图标。
     *
     * <p>默认用**动画**刷新图标（{@code anim:tabler:refresh}）：hover 播上游动效，
     * 加载中由外层 .is-spinning 整体旋转。传普通图标名则退回静态图标。</p>
     */
    syncIcon?: string;
    /** 同步按钮 tooltip */
    syncTooltip?: string;
    /** 搜索防抖 ms */
    debounceMs?: number;
    /** label 字段映射（loader/url 返回结构非标准时） */
    labelKey?: string;
    /** value 字段映射 */
    valueKey?: string;
    /** 弹窗宽度 */
    popoverWidth?: number;
  }>(),
  {
    url: "",
    loader: undefined,
    params: () => ({}),
    options: undefined,
    enableInput: true,
    filterable: true,
    clearable: true,
    disabled: false,
    placeholder: "请选择",
    inputPlaceholder: "请输入或选择",
    size: "default",
    autoReload: true,
    syncIcon: "anim:tabler:refresh",
    syncTooltip: "刷新远程数据",
    debounceMs: 300,
    labelKey: "label",
    valueKey: "value",
    popoverWidth: 280,
  },
);

const emit = defineEmits<{
  (e: "sync"): void;
  (e: "input-change", value: string): void;
  (e: "search", keyword: string): void;
  (e: "update:modelValue", val: string | number): void;
}>();

const keyword = ref<string>("");
const inputDraft = ref<string>("");
const popoverVisible = ref<boolean>(false);
const triggerRef = ref<HTMLElement | null>(null);

function normalize(rows: any[]): ReRemoteOption[] {
  if (!Array.isArray(rows)) return [];
  return rows
    .map((r) => {
      if (r == null) return null;
      if (typeof r === "object") {
        const v = (r as any)[props.valueKey];
        const l = (r as any)[props.labelKey];
        if (v == null || l == null) return null;
        return { ...r, label: String(l), value: v as string | number } as ReRemoteOption;
      }
      return { label: String(r), value: r as string | number };
    })
    .filter((x): x is ReRemoteOption => x !== null);
}

const isRemote = computed(() => Boolean(props.url) || typeof props.loader === "function");

const sourceRef = computed<ReDataSource<ReRemoteOption[]>>(() => {
  if (typeof props.loader === "function") {
    return async () => {
      const paramObj: Record<string, unknown> = { ...(props.params ?? {}) };
      if (keyword.value) paramObj.keyword = keyword.value;
      const rows = await props.loader!(paramObj);
      return normalize(rows);
    };
  }
  if (props.url) {
    return async () => {
      const qs = new URLSearchParams();
      const paramObj: Record<string, unknown> = { ...(props.params ?? {}) };
      if (keyword.value) paramObj.keyword = keyword.value;
      for (const [k, v] of Object.entries(paramObj)) {
        if (v === undefined || v == null || v === "") continue;
        qs.set(k, String(v));
      }
      const sep = props.url.includes("?") ? "&" : "?";
      const fullUrl = `${props.url}${qs.toString() ? sep + qs.toString() : ""}`;
      const { getApiHttp } = await import("@repo/core");
      const res = await getApiHttp().get(fullUrl);
      const body = res.data as unknown;
      if (Array.isArray(body)) return normalize(body);
      if (body && typeof body === "object") {
        const obj = body as Record<string, unknown>;
        for (const key of ["records", "rows", "list", "items", "content", "data"]) {
          if (Array.isArray(obj[key])) return normalize(obj[key] as any[]);
        }
      }
      return [];
    };
  }
  return (props.options ?? []).slice();
});

const { loading: dataLoading, data: dataList, reload: dsReload } = useDataSource<ReRemoteOption[]>(sourceRef);

const debouncedReload = debounce(() => {
  if (isRemote.value) dsReload();
}, props.debounceMs);

if (props.autoReload) {
  watch(keyword, () => debouncedReload());
}

const options = computed<ReRemoteOption[]>(() => dataList.value ?? []);

const selectedLabel = computed<string>(() => {
  const v = model.value;
  if (v == null || v === "") return "";
  const found = options.value.find((o) => o.value === v);
  return found?.label ?? String(v);
});

/** 显示在 trigger 中的文字（输入框为空时显示选中值；输入框有值时显示输入文字） */
const triggerText = computed<string>(() => {
  if (props.enableInput) return inputDraft.value || selectedLabel.value || "";
  return selectedLabel.value || "";
});

async function onSync(): Promise<void> {
  if (props.disabled || dataLoading.value) return;
  emit("sync");
  // 先让一帧：让同步按钮的旋转动画先画出来再取数。
  // 否则点击后浏览器要等接口回来才开始处理后续任务，用户看到的是
  // 「按下去没反应，过一会儿整块冻住」。
  await yieldToMain();
  await dsReload();
}

function onSelectOption(opt: ReRemoteOption): void {
  if (opt.disabled) return;
  model.value = opt.value as never;
  inputDraft.value = "";
  keyword.value = "";
  popoverVisible.value = false;
  emit("update:modelValue", opt.value);
}

function onInput(e: Event): void {
  const t = e.target as HTMLInputElement;
  inputDraft.value = t.value;
  emit("input-change", t.value);
  keyword.value = t.value;
  if (!popoverVisible.value) popoverVisible.value = true;
}

function onClear(): void {
  model.value = "";
  inputDraft.value = "";
  keyword.value = "";
}

function onKeyEnter(): void {
  // 输入模式下，回车把当前 draft 作为 model（匹配远程第一项或自定义值）
  const draft = inputDraft.value.trim();
  if (!draft) return;
  const matched = options.value.find(
    (o) => o.label === draft || String(o.value) === draft,
  );
  if (matched) {
    model.value = matched.value as never;
    emit("update:modelValue", matched.value);
  } else {
    model.value = draft as never;
    emit("update:modelValue", draft);
  }
  popoverVisible.value = false;
  inputDraft.value = "";
}

/** 同步外部 model → inputDraft（仅当用户没在输入时） */
watch(
  () => model.value,
  (v) => {
    if (!inputDraft.value) {
      // inputDraft 空表示用户没在输入，允许外部 model 同步进来
    }
    if (v == null || v === "") inputDraft.value = "";
  },
);

onMounted(() => {
  if (isRemote.value && props.autoReload) {
    nextTick(() => debouncedReload());
  }
});

const filterOptions = computed<ReRemoteOption[]>(() => {
  const k = keyword.value.trim().toLowerCase();
  if (!k) return options.value;
  return options.value.filter((o) => String(o.label).toLowerCase().includes(k));
});
</script>

<template>
  <div
    ref="triggerRef"
    :class="[
      're-remote-select',
      `re-remote-select--${size || 'default'}`,
      {
        're-remote-select--input': enableInput,
        're-remote-select--disabled': disabled,
        're-remote-select--open': popoverVisible,
        're-remote-select--has-value': !!triggerText,
      },
    ]"
    v-bind="$attrs"
  >
    <!-- 左侧 trigger（el-popover reference） -->
    <el-popover
      v-model:visible="popoverVisible"
      :width="popoverWidth"
      :popper-class="'re-remote-select__popper'"
      placement="bottom-start"
      :fallback-placements="['top-start', 'top-end', 'bottom-end']"
      :persistent="false"
      :disabled="disabled"
      trigger="click"
    >
      <template #reference>
        <div class="re-remote-select__trigger" @click.stop>
          <input
            v-if="enableInput"
            v-model="inputDraft"
            :placeholder="inputPlaceholder"
            :disabled="disabled"
            class="re-remote-select__input"
            @input="onInput"
            @keydown.enter.prevent="onKeyEnter"
          />
          <span
            v-else
            :class="['re-remote-select__label', { 'is-placeholder': !selectedLabel }]"
          >
            {{ selectedLabel || placeholder }}
          </span>
          <button
            v-if="clearable && (triggerText || inputDraft)"
            type="button"
            class="re-remote-select__clear"
            aria-label="清空"
            @click.stop="onClear"
          >
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z"/></svg>
          </button>
          <svg
            :class="['re-remote-select__arrow', { 're-remote-select__arrow--up': popoverVisible }]"
            viewBox="0 0 20 20"
            fill="currentColor"
            width="14"
            height="14"
          >
            <path
              fill-rule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clip-rule="evenodd"
            />
          </svg>
        </div>
      </template>

      <!-- 弹层内容 -->
      <div class="re-remote-select__dropdown">
        <input
          v-if="filterable"
          v-model="keyword"
          class="re-remote-select__filter"
          :placeholder="placeholder"
          @click.stop
        />
        <div v-if="dataLoading && options.length === 0" class="re-remote-select__empty">加载中…</div>
        <div v-else-if="filterOptions.length === 0" class="re-remote-select__empty">无匹配项</div>
        <ul v-else class="re-remote-select__list">
          <li
            v-for="opt in filterOptions"
            :key="String(opt.value)"
            :class="['re-remote-select__opt', { 'is-active': opt.value === model, 'is-disabled': opt.disabled }]"
            @click="onSelectOption(opt)"
          >
            <span class="re-remote-select__opt-label">{{ opt.label }}</span>
            <svg
              v-if="opt.value === model"
              class="re-remote-select__opt-check"
              viewBox="0 0 20 20"
              fill="currentColor"
              width="14"
              height="14"
            >
              <path d="M16.704 5.29a1 1 0 010 1.42l-8 8a1 1 0 01-1.42 0l-4-4a1 1 0 111.42-1.42L8 12.59l7.29-7.3a1 1 0 011.414 0z" />
            </svg>
          </li>
        </ul>
      </div>
    </el-popover>

    <!-- 右侧同步按钮 -->
    <button
      type="button"
      class="re-remote-select__sync"
      :disabled="disabled || dataLoading"
      :title="syncTooltip"
      :aria-label="syncTooltip"
      @click.stop="onSync"
    >
      <span :class="['re-remote-select__sync-icon', { 'is-spinning': dataLoading }]">
        <ReIcon :name="syncIcon" :size="16" />
      </span>
    </button>
  </div>
</template>

<style scoped>
.re-remote-select {
  display: inline-flex;
  align-items: stretch;
  width: 100%;
  max-width: 100%;
  border: 1px solid var(--rm-border);
  border-radius: var(--rm-radius-lg);
  background: color-mix(in srgb, var(--rm-bg) 92%, transparent);
  box-shadow:
    inset 0 1px 0 color-mix(in srgb, var(--rm-bg) 60%, transparent),
    0 1px 2px rgba(15, 23, 42, 0.04);
  transition:
    border-color var(--rm-transition),
    box-shadow var(--rm-transition-slow),
    transform var(--rm-transition);
  overflow: hidden;
  position: relative;
  font-family: inherit;
  box-sizing: border-box;
}

.re-remote-select:hover:not(.re-remote-select--disabled) {
  border-color: color-mix(in srgb, var(--rm-primary) 30%, var(--rm-border));
  box-shadow:
    inset 0 1px 0 color-mix(in srgb, var(--rm-bg) 60%, transparent),
    0 2px 8px color-mix(in srgb, var(--rm-primary) 10%, transparent);
  transform: translateY(-1px);
}

.re-remote-select:focus-within:not(.re-remote-select--disabled),
.re-remote-select--open:not(.re-remote-select--disabled) {
  border-color: var(--rm-primary);
  box-shadow:
    inset 0 1px 0 color-mix(in srgb, var(--rm-bg) 60%, transparent),
    0 0 0 4px color-mix(in srgb, var(--rm-primary) 12%, transparent),
    0 4px 14px color-mix(in srgb, var(--rm-primary) 18%, transparent);
}

.re-remote-select--disabled {
  background: var(--rm-bg-disabled);
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

/* Trigger 区（左侧 + popover reference） */
.re-remote-select__trigger {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 12px;
  height: var(--rm-height);
  cursor: pointer;
  user-select: none;
}
.re-remote-select--small .re-remote-select__trigger { height: var(--rm-height-sm); }
.re-remote-select--large .re-remote-select__trigger { height: var(--rm-height-lg); }

.re-remote-select__label {
  flex: 1;
  min-width: 0;
  font-size: var(--rm-font-md);
  font-weight: 500;
  color: var(--rm-text);
  letter-spacing: 0.01em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.re-remote-select__label.is-placeholder { color: var(--rm-text-disabled); font-weight: 400; }

.re-remote-select__input {
  flex: 1;
  min-width: 0;
  border: none;
  outline: none;
  background: transparent;
  color: var(--rm-text);
  font-size: inherit;
  font-family: inherit;
  font-weight: 500;
  letter-spacing: 0.01em;
  padding: 0;
}
.re-remote-select__input::placeholder { color: var(--rm-text-disabled); font-weight: 400; }
.re-remote-select--small .re-remote-select__input { font-size: var(--rm-font-sm); }
.re-remote-select--large .re-remote-select__input { font-size: var(--rm-font-lg); }

/* 隐藏原生的 placeholder / label：输入模式下 draft 已输入时，原来的 span 需要隐藏 */
.re-remote-select--input .re-remote-select__label:not(.is-placeholder) { display: none; }

.re-remote-select__clear {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 16px;
  height: 16px;
  border: none;
  background: transparent;
  color: var(--rm-text-secondary);
  cursor: pointer;
  border-radius: 50%;
  transition: color var(--rm-transition), background var(--rm-transition);
}
.re-remote-select__clear:hover { color: var(--rm-text); background: var(--rm-bg-hover); }
.re-remote-select__clear svg { width: 12px; height: 12px; }

.re-remote-select__arrow {
  flex-shrink: 0;
  color: var(--rm-text-secondary);
  transition: transform var(--rm-transition), color var(--rm-transition);
}
.re-remote-select__arrow--up { transform: rotate(180deg); color: var(--rm-primary); }

/* 同步按钮 */
.re-remote-select__sync {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  align-self: stretch;
  border: none;
  border-left: 1px solid var(--rm-border-light);
  background: transparent;
  color: var(--rm-text-secondary);
  cursor: pointer;
  transition:
    background var(--rm-transition),
    color var(--rm-transition),
    border-color var(--rm-transition);
  font-family: inherit;
}
.re-remote-select:hover:not(.re-remote-select--disabled) .re-remote-select__sync {
  color: var(--rm-primary);
  border-left-color: color-mix(in srgb, var(--rm-primary) 25%, var(--rm-border-light));
}
.re-remote-select__sync:hover:not(:disabled) {
  background: var(--rm-primary-light-9);
  color: var(--rm-primary);
}
.re-remote-select__sync:active:not(:disabled) {
  background: var(--rm-primary-light-8);
}
.re-remote-select__sync:disabled { cursor: not-allowed; opacity: 0.6; }

.re-remote-select__sync-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: transform var(--rm-transition-slow);
}
.re-remote-select__sync-icon.is-spinning {
  animation: re-remote-select-spin 0.9s linear infinite;

  /* 上游动画图标自带 hover 动效，与外层整体旋转叠在一起会互相打架 ——
     加载中只保留外层旋转，压掉图标自身的动效。 */
  :deep(.re-icon__anim) {
    animation: none;
  }
}
.re-remote-select__sync-icon :deep(svg) {
  width: 16px;
  height: 16px;
}

@keyframes re-remote-select-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 弹层 */
.re-remote-select__dropdown {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.re-remote-select__filter {
  width: 100%;
  height: 32px;
  padding: 0 10px;
  border: 1px solid var(--rm-border);
  border-radius: var(--rm-radius);
  background: var(--rm-bg);
  color: var(--rm-text);
  font-size: var(--rm-font-sm);
  font-family: inherit;
  outline: none;
  transition: border-color var(--rm-transition), box-shadow var(--rm-transition);
  box-sizing: border-box;
}
.re-remote-select__filter:focus {
  border-color: var(--rm-primary);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--rm-primary) 12%, transparent);
}

.re-remote-select__empty {
  padding: 24px 12px;
  text-align: center;
  color: var(--rm-text-secondary);
  font-size: var(--rm-font-sm);
}

.re-remote-select__list {
  margin: 0;
  padding: 4px 0;
  list-style: none;
  max-height: 240px;
  overflow-y: auto;
}

.re-remote-select__opt {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 7px 12px;
  border-radius: var(--rm-radius-sm);
  margin: 1px 4px;
  font-size: var(--rm-font-md);
  font-weight: 500;
  color: var(--rm-text);
  cursor: pointer;
  transition: background var(--rm-transition), color var(--rm-transition);
}
.re-remote-select__opt:hover:not(.is-disabled) {
  background: var(--rm-bg-hover);
  color: var(--rm-primary);
}
.re-remote-select__opt.is-active {
  color: var(--rm-primary);
  background: var(--rm-primary-light-9);
  font-weight: 600;
}
.re-remote-select__opt.is-disabled {
  opacity: 0.5;
  cursor: not-allowed;
  color: var(--rm-text-disabled);
}
.re-remote-select__opt-check {
  color: var(--rm-primary);
}

@media (prefers-reduced-motion: reduce) {
  .re-remote-select,
  .re-remote-select__sync,
  .re-remote-select__sync-icon,
  .re-remote-select__arrow,
  .re-remote-select__clear,
  .re-remote-select__filter,
  .re-remote-select__opt {
    transition: none;
  }
  .re-remote-select:hover:not(.re-remote-select--disabled) { transform: none; }
  .re-remote-select__sync-icon.is-spinning { animation: none; }
}
</style>

<style>
/* 弹层（全局，应用到 popper 容器） */
.re-remote-select__popper {
  padding: 6px !important;
  border: 1px solid var(--rm-border);
  border-radius: var(--rm-radius-lg);
  background: var(--rm-bg);
  box-shadow:
    0 2px 8px rgba(15, 23, 42, 0.06);
}
.re-remote-select__popper > .el-popper__arrow::before {
  border: 1px solid var(--rm-border) !important;
  background: var(--rm-bg) !important;
}
</style>