<script setup lang="ts">
/**
 * ReSelect —— 下拉选择组件
 *
 * 三种布局模式：
 *   - "default"：原生 el-select 文本选项
 *   - "card"：卡片形式（带图标 + 标题 + 描述），适合角色/部门等场景
 *   - "table"：表格形式（多列），适合用户列表等场景
 *
 * 数据源（语义清晰，遵循 data=静态、url=远程、loader=函数 三分原则）：
 *   1) data   —— 静态数组（也可用 options 别名）
 *   2) url    —— 远程接口地址，自动 fetch + GET 防抖 + 重试（HttpConfig）
 *   3) loader —— 自定义加载函数 (params) => Promise<ReOption[]>，用于复杂场景
 *
 * 用法：
 *   <ReSelect :data="[{label:'男',value:1}]" />
 *   <ReSelect url="/api/roles" v-model="id" />
 *   <ReSelect :loader="(p) => fetchRoles(p)" v-model="id" />
 */
import { computed } from "vue";
import { ElSelect, ElOption, ElCheckbox } from "element-plus";
import { useDataSource, type ReDataSource } from "../../hooks/useDataSource";
import type { ReOption, ReSelectLayout } from "./types";
import { http } from "../../http";
import ReIcon from "../ReIcon/ReIcon.vue";

defineOptions({ name: "ReSelect", inheritAttrs: true });

const model = defineModel<string | number | (string | number)[] | null>({ default: "" });

const props = withDefaults(
  defineProps<{
    /** 静态选项数组（与 url/loader 三选一） */
    data?: ReOption[];
    /** 静态选项别名（与 data 等价，语义更明确） */
    options?: ReOption[];
    /** 远程 url（与 data/loader 三选一）；自动 GET + 防抖 + 重试 */
    url?: string;
    /** 自定义加载器（与 data/url 三选一），签名 (params: {keyword?:string}) => ReOption[] | Promise<ReOption[]> */
    loader?: (params?: Record<string, unknown>) => ReOption[] | Promise<ReOption[]>;
    /** 远程/loader 查询参数 */
    params?: Record<string, unknown>;
    /** 布局模式：default / card / table */
    layout?: ReSelectLayout;
    /** placeholder */
    placeholder?: string;
    /** 是否可清空 */
    clearable?: boolean;
    /** 是否可搜索 */
    filterable?: boolean;
    /** 多选 */
    multiple?: boolean;
    /** 多选折叠 tag */
    collapseTags?: boolean;
    /** 禁用 */
    disabled?: boolean;
    /** loading（外部控制） */
    loading?: boolean;
    /** 尺寸 */
    size?: "large" | "default" | "small";
    /** 卡片 / 表格模式 popover 宽度 */
    popoverWidth?: number;
    /** 卡片模式：列数（瀑布流） */
    cardColumns?: number;
    /** 表格模式：表格列配置 { key, label, width? } */
    tableColumns?: Array<{ key: string; label: string; width?: string | number }>;
  }>(),
  {
    data: undefined,
    options: undefined,
    url: "",
    loader: undefined,
    params: () => ({}),
    layout: "default",
    placeholder: "请选择",
    clearable: false,
    filterable: false,
    multiple: false,
    collapseTags: false,
    disabled: false,
    loading: false,
    size: "",
    popoverWidth: 280,
    cardColumns: 1,
    tableColumns: () => [],
  },
);

/** 是否为远程模式（url / loader） */
const isRemote = computed<boolean>(() => Boolean(props.url) || typeof props.loader === "function");

/** 静态模式下的最终数据（data 优先，否则 options） */
const staticData = computed<ReOption[]>(() => props.data ?? props.options ?? []);

/**
 * 远程加载函数：url 模式用 http.get（自带防抖/重试），
 * loader 模式直接调用用户函数。
 */
function buildRemoteSource(): ReDataSource<ReOption[]> {
  const run = async (): Promise<ReOption[]> => {
    const paramObj = { ...(props.params ?? {}) };
    try {
      if (typeof props.loader === "function") {
        return await props.loader(paramObj);
      }
      // url 模式
      const qs = new URLSearchParams();
      for (const [k, v] of Object.entries(paramObj)) {
        if (v === undefined || v === null || v === "") continue;
        qs.set(k, String(v));
      }
      const sep = props.url.includes("?") ? "&" : "?";
      const fullUrl = `${props.url}${qs.toString() ? sep + qs.toString() : ""}`;
      const res = await http.get<ReOption[] | { data: ReOption[]; records?: ReOption[]; rows?: ReOption[]; list?: ReOption[]; items?: ReOption[] }>(fullUrl, undefined, { debounce: true });
      const body = res.data;
      if (Array.isArray(body)) return body;
      if (body && typeof body === "object") {
        const obj = body as Record<string, unknown>;
        for (const key of ["records", "rows", "list", "items", "content", "data"]) {
          if (Array.isArray(obj[key])) return obj[key] as ReOption[];
        }
      }
      return [];
    } catch (e) {
      console.error("[ReSelect] 数据加载失败", e);
      return [];
    }
  };
  return run;
}

/** useDataSource 接受的 source */
const sourceRef = computed<ReDataSource<ReOption[]>>(() => {
  if (isRemote.value) return buildRemoteSource();
  return staticData.value;
});

const { loading: dataLoading, data: dataList, reload: dsReload } = useDataSource<ReOption[]>(sourceRef);

/** 当前选中项的标签拼接（用于回显） */
const selectedLabels = computed<string>(() => {
  const list = dataList.value ?? [];
  const v = model.value;
  if (v === null || v === undefined || v === "") return "";
  const values = Array.isArray(v) ? v : [v];
  return list
    .filter((o) => values.includes(o.value as string | number))
    .map((o) => o.label)
    .join(", ");
});

/** 是否为富文本布局（card / table） */
const isRichLayout = computed<boolean>(() => props.layout !== "default");

/** 多选切换 */
function onToggleSelect(option: ReOption): void {
  if (props.disabled || option.disabled) return;
  const v = option.value;
  if (!props.multiple) {
    model.value = v as string | number;
    return;
  }
  const cur = Array.isArray(model.value) ? [...(model.value as Array<string | number>)] : [];
  const idx = cur.indexOf(v as string | number);
  if (idx >= 0) {
    cur.splice(idx, 1);
  } else {
    cur.push(v as string | number);
  }
  model.value = cur;
}

/** 是否已选中 */
function isChecked(option: ReOption): boolean {
  const v = option.value;
  if (Array.isArray(model.value)) return model.value.includes(v as string | number);
  return model.value === v;
}

defineExpose({
  reload: dsReload,
  get loading(): boolean {
    return dataLoading.value;
  },
  get data(): ReOption[] | null {
    return dataList.value;
  },
});
</script>

<template>
  <ElSelect
    v-model="model"
    v-bind="$attrs"
    :placeholder="placeholder"
    :clearable="clearable"
    :filterable="filterable"
    :multiple="multiple"
    :collapse-tags="collapseTags"
    :disabled="disabled"
    :loading="loading || dataLoading"
    :size="size"
    :popper-class="isRichLayout ? 're-select__popper--rich' : ''"
    :teleported="true"
    class="re-select"
    :class="`re-select--${layout}`"
  >
    <!-- 自定义选中态回显 -->
    <template #default="{ value: v }">
      <slot name="selected" :value="v" :labels="selectedLabels">
        <span v-if="Array.isArray(v)">{{ v.length ? selectedLabels : placeholder }}</span>
        <span v-else>{{ v !== '' && v != null ? selectedLabels : placeholder }}</span>
      </slot>
    </template>

    <!-- default 布局：标准 el-option -->
    <template v-if="layout === 'default'">
      <ElOption
        v-for="opt in dataList ?? []"
        :key="String(opt.value)"
        :label="opt.label"
        :value="opt.value"
        :disabled="opt.disabled"
      />
    </template>

    <!-- card 布局 -->
    <template v-else-if="layout === 'card'">
      <ElOption
        v-for="opt in dataList ?? []"
        :key="String(opt.value)"
        :label="opt.label"
        :value="opt.value"
        :disabled="opt.disabled"
        class="re-select__option-card"
      >
        <div
          class="re-select__card"
          :class="{ 're-select__card--checked': isChecked(opt) }"
          @click.stop="onToggleSelect(opt)"
        >
          <div v-if="multiple" class="re-select__card-checkbox">
            <ElCheckbox :model-value="isChecked(opt)" @click.stop="onToggleSelect(opt)" />
          </div>
          <ReIcon v-if="opt.icon" :name="opt.icon" :size="20" class="re-select__card-icon" />
          <div class="re-select__card-content">
            <div class="re-select__card-label">{{ opt.label }}</div>
            <div v-if="opt.description" class="re-select__card-desc">{{ opt.description }}</div>
          </div>
        </div>
      </ElOption>
    </template>

    <!-- table 布局 -->
    <template v-else-if="layout === 'table'">
      <div class="re-select__table-head">
        <span
          v-for="col in tableColumns"
          :key="col.key"
          :style="{ flex: col.width ? `0 0 ${typeof col.width === 'number' ? col.width + 'px' : col.width}` : '1' }"
        >{{ col.label }}</span>
        <span v-if="multiple" class="re-select__table-check">{{ '已选' }}</span>
      </div>
      <ElOption
        v-for="opt in dataList ?? []"
        :key="String(opt.value)"
        :label="opt.label"
        :value="opt.value"
        :disabled="opt.disabled"
        class="re-select__option-table"
      >
        <div
          class="re-select__table-row"
          :class="{ 're-select__table-row--checked': isChecked(opt) }"
          @click.stop="onToggleSelect(opt)"
        >
          <span
            v-for="col in tableColumns"
            :key="col.key"
            :style="{ flex: col.width ? `0 0 ${typeof col.width === 'number' ? col.width + 'px' : col.width}` : '1' }"
          >{{ opt[col.key] ?? '-' }}</span>
          <span v-if="multiple" class="re-select__table-check" @click.stop="onToggleSelect(opt)">
            <ElCheckbox :model-value="isChecked(opt)" />
          </span>
        </div>
      </ElOption>
    </template>
  </ElSelect>
</template>

<style scoped>
.re-select :deep(.el-select__wrapper) {
  min-height: 32px;
}
.re-select__card {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 4px;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.15s;
}
.re-select__card:hover {
  background: var(--el-fill-color-light);
}
.re-select__card--checked {
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
}
.re-select__card-icon {
  flex: 0 0 auto;
  color: var(--el-color-primary);
}
.re-select__card-content {
  flex: 1;
  min-width: 0;
}
.re-select__card-label {
  font-size: 14px;
  font-weight: 500;
  color: var(--el-text-color-primary);
  line-height: 1.4;
}
.re-select__card-desc {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-top: 2px;
  line-height: 1.3;
}
.re-select__card-checkbox {
  flex: 0 0 auto;
}

/* table 模式 */
.re-select__table-head {
  display: flex;
  padding: 6px 12px;
  background: var(--el-fill-color-light);
  font-size: 12px;
  color: var(--el-text-color-secondary);
  font-weight: 600;
  border-bottom: 1px solid var(--el-border-color-lighter);
}
.re-select__table-row {
  display: flex;
  padding: 6px 12px;
  cursor: pointer;
  transition: background 0.15s;
}
.re-select__table-row:hover {
  background: var(--el-fill-color-light);
}
.re-select__table-row--checked {
  background: var(--el-color-primary-light-9);
}
.re-select__table-check {
  flex: 0 0 60px;
  text-align: right;
}
</style>

<style>
/* popper 内的 option 默认样式重置 */
.re-select__popper--rich .el-select-dropdown__item {
  padding: 0 !important;
  height: auto !important;
  background: transparent !important;
}
.re-select__popper--rich .el-select-dropdown__item:hover {
  background: transparent !important;
}
.re-select__popper--rich .el-select-dropdown__item.selected {
  font-weight: normal;
  color: inherit;
}
</style>