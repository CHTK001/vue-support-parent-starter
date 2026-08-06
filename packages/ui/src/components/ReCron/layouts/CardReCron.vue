<script setup lang="ts">
/**
 * ReCron Card 布局 —— rin-card 风格的 Cron 表达式生成器
 *
 * 6 字段 cron：秒 分 时 日 月 周
 * 5 字段 cron：分 时 日 月 周
 *
 * 每个字段支持 4 种模式：
 *   - every  ：*                       （每单位）
 *   - range  ：a-b                     （范围 a~b）
 *   - step   ：a/b / * / b             （从 a 起每 b 一次）
 *   - point  ：a                       （指定值）
 *   - list   ：a,b,c（卡片风格专属扩展，可多选）
 *
 * 底部预览：最近 5 次触发时间
 */
import { computed, ref, watch } from "vue";
import "../../shared/modern-vars.css";

defineOptions({ name: "ReCronCard", inheritAttrs: true });

const model = defineModel<string>({ default: "" });

const props = withDefaults(
  defineProps<{
    fields?: 5 | 6;
    placeholder?: string;
    disabled?: boolean;
    width?: string | number;
  }>(),
  {
    fields: 5,
    placeholder: "请选择 cron 表达式",
    disabled: false,
    width: undefined,
  },
);

/** 字段元信息 */
type FieldKind = "second" | "minute" | "hour" | "day" | "month" | "week";
type FieldMode = "every" | "range" | "step" | "point" | "list";

interface FieldState {
  kind: FieldKind;
  label: string;
  min: number;
  max: number;
  mode: FieldMode;
  rangeFrom: number;
  rangeTo: number;
  stepFrom: number;
  stepInterval: number;
  point: number;
  list: number[];
}

const FIELDS: { kind: FieldKind; label: string; min: number; max: number }[] = [
  { kind: "second", label: "秒", min: 0, max: 59 },
  { kind: "minute", label: "分", min: 0, max: 59 },
  { kind: "hour", label: "时", min: 0, max: 23 },
  { kind: "day", label: "日", min: 1, max: 31 },
  { kind: "month", label: "月", min: 1, max: 12 },
  { kind: "week", label: "周", min: 0, max: 6 },
];

const createField = (kind: FieldKind, label: string, min: number, max: number): FieldState => ({
  kind,
  label,
  min,
  max,
  mode: "every",
  rangeFrom: min,
  rangeTo: max,
  stepFrom: min,
  stepInterval: 1,
  point: min,
  list: [0],
});

const blankFields = (): FieldState[] => {
  const hasSecond = props.fields === 6;
  const list = hasSecond ? FIELDS : FIELDS.filter((f) => f.kind !== "second");
  return list.map((f) => createField(f.kind, f.label, f.min, f.max));
};

/** 内部状态：从 model 解析得到 */
const fields = ref<FieldState[]>(blankFields());

/** 解析 cron 字符串到 fields（兼容 5/6 字段、?、L 简化为 *） */
const parseCron = (expr: string): FieldState[] => {
  const tokens = expr.trim().split(/\s+/);
  const hasSecond = props.fields === 6;
  const targetCount = hasSecond ? 6 : 5;
  const normalized = tokens.length === targetCount ? tokens : tokens.slice(0, targetCount);
  const list = hasSecond ? FIELDS : FIELDS.filter((f) => f.kind !== "second");
  return list.map((f, idx) => {
    const token = normalized[idx] ?? "*";
    const t = token === "?" ? "*" : token;
    const meta = FIELDS.find((x) => x.kind === f.kind)!;
    const state = createField(meta.kind, meta.label, meta.min, meta.max);
    state.mode = parseToken(t, state, meta);
    return state;
  });
};

/** 解析单 token，返回 mode */
const parseToken = (token: string, state: FieldState, meta: { min: number; max: number }): FieldMode => {
  if (token === "*") return "every";
  if (token.includes("/")) {
    const [from, step] = token.split("/");
    state.stepFrom = from === "*" ? meta.min : parseInt(from, 10) || meta.min;
    state.stepInterval = parseInt(step, 10) || 1;
    return "step";
  }
  if (token.includes("-")) {
    const [a, b] = token.split("-").map((v) => parseInt(v, 10));
    state.rangeFrom = a;
    state.rangeTo = b;
    return "range";
  }
  if (token.includes(",")) {
    const list: number[] = [];
    const arr = token.split(",").map((v) => parseInt(v, 10)).filter((v) => !Number.isNaN(v));
    state.list = arr;
    return "list";
  }
  const n = parseInt(token, 10);
  state.point = Number.isNaN(n) ? meta.min : n;
  return "point";
};

/** 把 fields 拼成 cron 字符串 */
const buildCron = (state: FieldState[]): string =>
  state.map((f) => {
    switch (f.mode) {
      case "every":
        return "*";
      case "range":
        return `${f.rangeFrom}-${f.rangeTo}`;
      case "step":
        return `${f.stepFrom}/${f.stepInterval}`;
      case "point":
        return String(f.point);
      case "list":
        return f.list.length ? f.list.join(",") : `${f.min}`;
      default:
        return "*";
    }
  }).join(" ");

const cronText = computed(() => buildCron(fields.value));

/** 防止 model <-> fields 双向回环 */
let syncing = false;

/** model → fields */
watch(
  () => model.value,
  (val) => {
    if (syncing) {
      syncing = false;
      return;
    }
    if (typeof val !== "string") return;
    if (val && val !== buildCron(fields.value)) {
      fields.value = parseCron(val);
    } else if (!val) {
      fields.value = blankFields();
    }
  },
  { immediate: true },
);

/** fields → model */
watch(
  cronText,
  (val) => {
    if (val !== model.value) {
      syncing = true;
      model.value = val;
    }
  },
  { immediate: true },
);

/** 当前字段的可选值数组（用于 point / stepFrom / list 选择） */
const rangeValues = (state: FieldState): number[] => {
  const arr: number[] = [];
  for (let i = state.min; i <= state.max; i++) arr.push(i);
  return arr;
};

/** 模式切换：切换时重置相关默认值 */
const setMode = (state: FieldState, mode: FieldMode) => {
  state.mode = mode;
  if (mode === "list" && state.list.length === 0) state.list = [state.min];
};

/** list 模式：toggle 一项 */
const toggleList = (state: FieldState, value: number) => {
  const idx = state.list.indexOf(value);
  if (idx >= 0) state.list.splice(idx, 1);
  else state.list.push(value);
  state.list.sort((a, b) => a - b);
};

/** 预览：未来 5 次触发时间 */
const preview = computed<string[]>(() => {
  try {
    const now = new Date();
    const out: string[] = [];
    let cursor = new Date(now.getTime() + 1000);
    cursor.setMilliseconds(0);
    for (let i = 0; i < 200 && out.length < 5; i++) {
      cursor = new Date(cursor.getTime() + 1000);
      if (match(cursor, fields.value)) out.push(formatDate(cursor));
      if (i > 150) break;
    }
    return out;
  } catch {
    return [];
  }
});

/** 简易匹配器（单秒精度） */
const match = (d: Date, state: FieldState[]): boolean => {
  const hasSecond = props.fields === 6;
  const tokens = hasSecond
    ? [d.getSeconds(), d.getMinutes(), d.getHours(), d.getDate(), d.getMonth() + 1, d.getDay()]
    : [d.getMinutes(), d.getHours(), d.getDate(), d.getMonth() + 1, d.getDay()];
  return state.every((f, idx) => matchField(tokens[idx], f));
};

const matchField = (value: number, f: FieldState): boolean => {
  switch (f.mode) {
    case "every":
      return true;
    case "range":
      return value >= f.rangeFrom && value <= f.rangeTo;
    case "step":
      return value >= f.stepFrom && (value - f.stepFrom) % f.stepInterval === 0;
    case "point":
      return value === f.point;
    case "list":
      return f.list.includes(value);
    default:
      return false;
  }
};

const formatDate = (d: Date): string => {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

const MODES: { key: FieldMode; label: string }[] = [
  { key: "every", label: "每" },
  { key: "range", label: "区间" },
  { key: "step", label: "周期" },
  { key: "point", label: "指定" },
  { key: "list", label: "多选" },
];

const visibleFields = computed(() => fields.value);

const wrapStyle = computed(() => {
  if (!props.width) return undefined;
  return typeof props.width === "number" ? { width: `${props.width}px` } : { width: props.width };
});
</script>

<template>
  <div
    :class="[
      'recron-card',
      { 'is-disabled': disabled },
    ]"
    :style="wrapStyle"
  >
    <header class="recron-card__head">
      <input
        v-model="model"
        class="recron-card__expr"
        type="text"
        :placeholder="placeholder"
        :disabled="disabled"
        spellcheck="false"
      />
      <span class="recron-card__hint">{{ fields }} 字段</span>
    </header>

    <div class="recron-card__body">
      <div v-for="f in visibleFields" :key="f.kind" class="recron-field">
        <div class="recron-field__head">
          <span class="recron-field__label">{{ f.label }}</span>
          <div class="recron-field__modes">
            <button
              v-for="m in MODES"
              :key="m.key"
              type="button"
              :class="['recron-field__mode', { 'is-active': f.mode === m.key }]"
              :disabled="disabled"
              @click="setMode(f, m.key)"
            >
              {{ m.label }}
            </button>
          </div>
        </div>

        <div class="recron-field__ctrl">
          <template v-if="f.mode === 'every'">
            <span class="recron-field__value">* 每{{ f.label }}</span>
          </template>

          <template v-else-if="f.mode === 'range'">
            <el-input-number
              v-model="f.rangeFrom"
              :min="f.min"
              :max="f.rangeTo"
              :disabled="disabled"
              size="small"
              controls-position="right"
            />
            <span class="recron-field__sep">至</span>
            <el-input-number
              v-model="f.rangeTo"
              :min="f.rangeFrom"
              :max="f.max"
              :disabled="disabled"
              size="small"
              controls-position="right"
            />
          </template>

          <template v-else-if="f.mode === 'step'">
            <span class="recron-field__prefix">从</span>
            <el-input-number
              v-model="f.stepFrom"
              :min="f.min"
              :max="f.max"
              :disabled="disabled"
              size="small"
              controls-position="right"
            />
            <span class="recron-field__prefix">起，每</span>
            <el-input-number
              v-model="f.stepInterval"
              :min="1"
              :max="f.max"
              :disabled="disabled"
              size="small"
              controls-position="right"
            />
            <span class="recron-field__suffix">{{ f.label }}一次</span>
          </template>

          <template v-else-if="f.mode === 'point'">
            <el-input-number
              v-model="f.point"
              :min="f.min"
              :max="f.max"
              :disabled="disabled"
              size="small"
              controls-position="right"
            />
          </template>

          <template v-else-if="f.mode === 'list'">
            <div class="recron-field__chips">
              <button
                v-for="v in rangeValues(f)"
                :key="v"
                type="button"
                :class="['recron-chip', { 'is-active': f.list.includes(v) }]"
                :disabled="disabled"
                @click="toggleList(f, v)"
              >
                {{ v }}
              </button>
            </div>
          </template>
        </div>
      </div>
    </div>

    <footer class="recron-card__foot">
      <div class="recron-card__foot-title">最近 5 次触发</div>
      <ul class="recron-card__preview">
        <li v-for="t in preview" :key="t">{{ t }}</li>
        <li v-if="!preview.length" class="recron-card__preview-empty">无匹配时间</li>
      </ul>
    </footer>
  </div>
</template>

<style scoped lang="scss">
.recron-card {
  --rin-card-bg: #ffffff;
  --rin-card-border: #e5e7ed;
  --rin-card-border-hover: #c7d2fe;
  --rin-card-radius: 12px;

  display: flex;
  flex-direction: column;
  background: var(--rin-card-bg);
  border: 1px solid var(--rin-card-border);
  border-radius: var(--rin-card-radius);
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.2s ease;

  &:hover:not(.is-disabled) {
    border-color: var(--rin-card-border-hover);
    box-shadow: 0 4px 16px rgba(99, 102, 241, 0.08);
    transform: translateY(-1px);
  }

  &.is-disabled {
    opacity: 0.6;
    pointer-events: none;
  }
}

html.dark .recron-card {
  --rin-card-bg: #1f2124;
  --rin-card-border: #2f3136;
  --rin-card-border-hover: #6366f1;
}

/* ===== head ===== */
.recron-card__head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 14px;
  border-bottom: 1px solid var(--rin-card-border);
}

.recron-card__expr {
  flex: 1;
  min-width: 0;
  padding: 6px 10px;
  font-family: ui-monospace, "Cascadia Mono", "Consolas", monospace;
  font-size: 13px;
  color: var(--el-text-color-primary);
  background: transparent;
  border: 1px solid transparent;
  border-radius: 6px;
  outline: none;
  transition: border-color 0.2s ease;

  &:focus {
    border-color: #6366f1;
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.12);
  }
}

.recron-card__hint {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

/* ===== body ===== */
.recron-card__body {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 14px;
}

.recron-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px 12px;
  background: var(--el-fill-color-light);
  border-radius: 8px;
}

html.dark .recron-field {
  background: rgba(255, 255, 255, 0.04);
}

.recron-field__head {
  display: flex;
  align-items: center;
  gap: 12px;
}

.recron-field__label {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.recron-field__modes {
  display: flex;
  gap: 4px;
  padding: 2px;
  background: var(--rin-card-bg);
  border: 1px solid var(--rin-card-border);
  border-radius: 999px;
}

.recron-field__mode {
  padding: 3px 10px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  background: transparent;
  border: none;
  border-radius: 999px;
  cursor: pointer;
  transition:
    background-color 0.15s ease,
    color 0.15s ease;

  &:hover:not(.is-active):not(:disabled) {
    color: var(--el-text-color-primary);
  }

  &.is-active {
    color: #ffffff;
    background: #6366f1;
  }
}

.recron-field__ctrl {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  min-height: 28px;
  font-size: 13px;
  color: var(--el-text-color-primary);
}

.recron-field__sep,
.recron-field__prefix,
.recron-field__suffix {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.recron-field__value {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.recron-field__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.recron-chip {
  min-width: 28px;
  padding: 2px 8px;
  font-size: 12px;
  color: var(--el-text-color-primary);
  background: var(--rin-card-bg);
  border: 1px solid var(--rin-card-border);
  border-radius: 6px;
  cursor: pointer;
  transition:
    border-color 0.15s ease,
    color 0.15s ease,
    background-color 0.15s ease;

  &:hover:not(:disabled) {
    border-color: var(--rin-card-border-hover);
  }

  &.is-active {
    color: #6366f1;
    background: #f0f4ff;
    border-color: #6366f1;
  }
}

html.dark .recron-chip.is-active {
  color: #c7d2fe;
  background: rgba(99, 102, 241, 0.18);
  border-color: #6366f1;
}

/* ===== foot ===== */
.recron-card__foot {
  padding: 12px 14px;
  border-top: 1px solid var(--rin-card-border);
}

.recron-card__foot-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--el-text-color-secondary);
  margin-bottom: 6px;
}

.recron-card__preview {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 0;
  margin: 0;
  list-style: none;
  font-family: ui-monospace, "Cascadia Mono", "Consolas", monospace;
  font-size: 12px;
  color: var(--el-text-color-primary);

  li {
    padding: 2px 0;
  }
}

.recron-card__preview-empty {
  color: var(--el-text-color-placeholder);
}
</style>