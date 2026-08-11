<script setup lang="ts">
import { ref, computed, watch } from "vue";
import "../shared/modern-vars.css";

defineOptions({ name: "ReDateRangePicker", inheritAttrs: true });

type RangeKey = "today" | "yesterday" | "thisWeek" | "thisMonth" | "thisYear" | "last7" | "last30";

interface RangeShortcut {
  key: RangeKey;
  label: string;
}

const DEFAULT_SHORTCUTS: RangeShortcut[] = [
  { key: "today", label: "今天" },
  { key: "yesterday", label: "昨天" },
  { key: "thisWeek", label: "本周" },
  { key: "thisMonth", label: "本月" },
  { key: "thisYear", label: "本年" },
];

const model = defineModel<string[] | null>({ default: null });

const props = withDefaults(
  defineProps<{
    layout?: "compact" | "full";
    size?: "small" | "default";
    format?: string;
    valueFormat?: string;
    startPlaceholder?: string;
    endPlaceholder?: string;
    clearable?: boolean;
    disabled?: boolean;
    shortcuts?: RangeShortcut[];
  }>(),
  {
    layout: "full",
    size: "default",
    format: "YYYY-MM-DD",
    valueFormat: "YYYY-MM-DD",
    startPlaceholder: "开始日期",
    endPlaceholder: "结束日期",
    clearable: true,
    disabled: false,
    shortcuts: () => DEFAULT_SHORTCUTS,
  },
);

const pickerRef = ref<InstanceType<typeof import("element-plus").ElDatePicker> | null>(null);

function toYMD(d: Date): string {
  return d.toISOString().slice(0, 10);
}
function getMonday(): Date {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now);
  monday.setDate(diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function getRange(key: RangeKey): [Date, Date] {
  const now = new Date();
  const today = new Date(now); today.setHours(23, 59, 59, 999);
  const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
  switch (key) {
    case "today":
      return [todayStart, today];
    case "yesterday": {
      const y = new Date(now); y.setDate(y.getDate() - 1);
      const yEnd = new Date(y); yEnd.setHours(23, 59, 59, 999);
      return [y, yEnd];
    }
    case "thisWeek": {
      const mon = getMonday();
      const sunday = new Date(mon); sunday.setDate(mon.getDate() + 6); sunday.setHours(23, 59, 59, 999);
      return [mon, sunday];
    }
    case "thisMonth": {
      const first = new Date(now.getFullYear(), now.getMonth(), 1);
      const last = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      return [first, last];
    }
    case "thisYear": {
      const jan = new Date(now.getFullYear(), 0, 1);
      const dec = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
      return [jan, dec];
    }
    case "last7": {
      const s7 = new Date(now); s7.setDate(s7.getDate() - 6); s7.setHours(0, 0, 0, 0);
      return [s7, today];
    }
    case "last30": {
      const s30 = new Date(now); s30.setDate(s30.getDate() - 29); s30.setHours(0, 0, 0, 0);
      return [s30, today];
    }
    default:
      return [todayStart, today];
  }
}

const activeKey = ref<RangeKey | null>(null);

watch(
  () => model.value,
  (val) => {
    if (!val || val.length !== 2) {
      activeKey.value = null;
      return;
    }
    const [s, e] = val;
    for (const sc of props.shortcuts) {
      const [ss, ee] = getRange(sc.key);
      if (toYMD(ss) === s && toYMD(ee) === e) {
        activeKey.value = sc.key;
        return;
      }
    }
    activeKey.value = null;
  },
);

function onSelectShortcut(key: RangeKey) {
  const [s, e] = getRange(key);
  model.value = [toYMD(s), toYMD(e)];
  activeKey.value = key;
}

const displayRange = computed(() => {
  if (!model.value || model.value.length !== 2) return "";
  return `${model.value[0]} ~ ${model.value[1]}`;
});

const emit = defineEmits<{
  (e: "change", value: string[], key?: RangeKey | null): void;
}>();

const onPickerChange = (val: string[] | null) => {
  activeKey.value = null;
  emit("change", val || [], null);
};
</script>

<template>
  <div
    :class="[
      'rdp',
      `rdp--${layout}`,
      `rdp--${size}`,
      { 'rdp--disabled': disabled },
    ]"
  >
    <div class="rdp__shortcuts">
      <button
        v-for="sc in shortcuts"
        :key="sc.key"
        :class="['rdp__chip', { 'rdp__chip--active': activeKey === sc.key }]"
        :disabled="disabled"
        @click="onSelectShortcut(sc.key)"
      >
        <slot name="chip-icon">
          <svg v-if="sc.key === 'today'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="3"/>
            <line x1="12" y1="4" x2="12" y2="6"/>
            <line x1="12" y1="18" x2="12" y2="20"/>
            <line x1="4" y1="12" x2="6" y2="12"/>
            <line x1="18" y1="12" x2="20" y2="12"/>
          </svg>
          <svg v-else-if="sc.key === 'yesterday'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="3,12 9,12 12,9 15,15 21,12"/>
            <polyline points="3,20 21,20"/>
          </svg>
          <svg v-else-if="sc.key === 'thisWeek'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="5" width="18" height="16" rx="2"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
            <line x1="8" y1="3" x2="8" y2="7"/>
            <line x1="16" y1="3" x2="16" y2="7"/>
          </svg>
          <svg v-else-if="sc.key === 'thisMonth'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="4" width="18" height="17" rx="2"/>
            <line x1="3" y1="9" x2="21" y2="9"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <circle cx="8" cy="14" r="0.8" fill="currentColor"/>
            <circle cx="12" cy="14" r="0.8" fill="currentColor"/>
            <circle cx="16" cy="14" r="0.8" fill="currentColor"/>
          </svg>
          <svg v-else-if="sc.key === 'thisYear'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="9"/>
            <path d="M3 12h18"/>
            <path d="M12 3a14 14 0 0 1 0 18"/>
            <path d="M12 3a14 14 0 0 0 0 18"/>
          </svg>
          <svg v-else-if="sc.key === 'last7'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 12a9 9 0 1 1 16.5 6"/>
            <polyline points="19,8 19,12 15,12"/>
          </svg>
          <svg v-else-if="sc.key === 'last30'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 12a9 9 0 1 1 18 0"/>
            <line x1="12" y1="3" x2="12" y2="12"/>
            <line x1="12" y1="12" x2="17" y2="14"/>
          </svg>
        </slot>
        <span class="rdp__chip-label">{{ sc.label }}</span>
      </button>
    </div>

    <div class="rdp__picker-row">
      <el-date-picker
        ref="pickerRef"
        v-model="model"
        type="daterange"
        :format="format"
        :value-format="valueFormat"
        :start-placeholder="startPlaceholder"
        :end-placeholder="endPlaceholder"
        :clearable="clearable"
        :disabled="disabled"
        :size="size"
        range-separator="~"
        class="rdp__picker"
        @change="onPickerChange"
      />
      <span v-if="displayRange" class="rdp__range-text">{{ displayRange }}</span>
    </div>

    <div class="rdp__footer">
      <slot name="footer" />
    </div>
  </div>
</template>

<style scoped>
.rdp {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.rdp--compact { gap: 6px; }

.rdp__shortcuts {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}

.rdp__chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border: 1px solid var(--el-border-color, #dcdfe6);
  border-radius: 8px;
  background: transparent;
  color: var(--el-text-color-secondary, #606266);
  font-size: 13px;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s ease;
  line-height: 1;
  user-select: none;
}
.rdp__chip svg {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}
.rdp__chip-label {
  font-weight: 500;
}
.rdp__chip:hover:not(:disabled) {
  border-color: var(--el-color-primary-light-3, #a0cfff);
  color: var(--el-color-primary, #409eff);
  background: var(--el-color-primary-light-9, #ecf5ff);
}
.rdp__chip--active {
  border-color: var(--el-color-primary, #409eff);
  color: var(--el-color-primary, #409eff);
  background: var(--el-color-primary-light-9, #ecf5ff);
}
.rdp__chip:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.rdp__picker-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.rdp__picker {
  flex: 1;
  min-width: 280px;
}
.rdp__range-text {
  font-size: 12px;
  color: var(--el-text-color-secondary, #909399);
  font-family: monospace;
}

.rdp__footer {
  display: flex;
  align-items: center;
  gap: 8px;
}

.rdp--disabled .rdp__chip { opacity: 0.4; cursor: not-allowed; }
</style>