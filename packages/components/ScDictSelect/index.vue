<!--
 * ScDictSelect 字典选择组件
 * 基于后台 SysDictItem 的字典下拉选择
 * @author CH
 * @date 2025-12-07
 * @version 1.0.0
-->
<template>
  <div class="sc-dict-select" :class="[`sc-dict-select--${size}`, { 'is-disabled': disabled }]">
    <el-select
      v-model="currentValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :size="size"
      :clearable="clearable"
      :multiple="multiple"
      :collapse-tags="collapseTags"
      :collapse-tags-tooltip="collapseTagsTooltip"
      :filterable="filterable"
      :remote="remote"
      :remote-method="handleRemoteSearch"
      :loading="loading"
      :loading-text="loadingText"
      :no-data-text="noDataText"
      :popper-class="popperClass"
      v-bind="$attrs"
      @change="handleChange"
      @visible-change="handleVisibleChange"
      @focus="handleFocus"
      @blur="handleBlur"
      @clear="handleClear"
    >
      <!-- 前缀图标 -->
      <template v-if="showIcon" #prefix>
        <el-icon class="dict-icon">
          <component :is="prefixIcon" v-if="prefixIcon" />
          <IconifyIconOnline v-else icon="ri:book-2-line" />
        </el-icon>
      </template>

      <!-- 选项列表 -->
      <el-option
        v-for="item in dictOptions"
        :key="item[valueField]"
        :label="item[labelField]"
        :value="item[valueField]"
        :disabled="item.disabled"
      >
        <div class="dict-option">
          <span class="dict-option__label">{{ item[labelField] }}</span>
          <span v-if="showCode && item[codeField]" class="dict-option__code">
            {{ item[codeField] }}
          </span>
        </div>
      </el-option>

      <!-- 空状态 -->
      <template #empty>
        <div class="dict-empty">
          <el-icon class="dict-empty__icon">
            <IconifyIconOnline icon="ri:inbox-line" />
          </el-icon>
          <span class="dict-empty__text">{{ noDataText }}</span>
        </div>
      </template>

      <!-- 透传插槽 -->
      <template v-for="(_, name) in $slots" #[name]="slotData">
        <slot :name="name" v-bind="slotData || {}" />
      </template>
    </el-select>

    <!-- 刷新按钮 -->
    <el-button
      v-if="showRefresh"
      class="refresh-btn"
      :size="size"
      :disabled="disabled || loading"
      text
      @click="refresh"
    >
      <el-icon :class="{ 'is-loading': loading }">
        <IconifyIconOnline icon="ri:refresh-line" />
      </el-icon>
    </el-button>
  </div>
</template>

<script setup lang="ts">
/**
 * ScDictSelect 字典选择组件
 * 支持通过字典ID或字典Code加载字典项
 */
import { computed, ref, watch, onMounted, type PropType } from "vue";
import { fetchListDictItem } from "@repo/core";
import { IconifyIconOnline } from "@repo/components/ReIcon";

// 字典项类型
interface DictItem {
  sysDictItemId: number;
  sysDictItemName: string;
  sysDictItemCode: string;
  sysDictItemValue?: string;
  sysDictItemSort?: number;
  sysDictItemRemark?: string;
  disabled?: boolean;
  [key: string]: any;
}

// Props 定义
interface Props {
  /** 绑定值 */
  modelValue?: string | number | (string | number)[];
  /** 字典ID */
  dictId?: string | number;
  /** 字典编码（优先使用dictId） */
  dictCode?: string;
  /** 占位文本 */
  placeholder?: string;
  /** 禁用状态 */
  disabled?: boolean;
  /** 尺寸 */
  size?: "large" | "default" | "small";
  /** 是否可清空 */
  clearable?: boolean;
  /** 是否多选 */
  multiple?: boolean;
  /** 多选时是否折叠标签 */
  collapseTags?: boolean;
  /** 多选时折叠标签tooltip */
  collapseTagsTooltip?: boolean;
  /** 是否可搜索 */
  filterable?: boolean;
  /** 是否远程搜索 */
  remote?: boolean;
  /** 是否显示字典编码 */
  showCode?: boolean;
  /** 是否显示前缀图标 */
  showIcon?: boolean;
  /** 是否显示刷新按钮 */
  showRefresh?: boolean;
  /** 前缀图标 */
  prefixIcon?: string;
  /** 加载中文本 */
  loadingText?: string;
  /** 无数据文本 */
  noDataText?: string;
  /** 弹出框类名 */
  popperClass?: string;
  /** 标签字段名 */
  labelField?: string;
  /** 值字段名 */
  valueField?: string;
  /** 编码字段名 */
  codeField?: string;
  /** 是否立即加载 */
  immediate?: boolean;
  /** 自定义请求函数 */
  request?: (params: any) => Promise<DictItem[]>;
  /** 静态选项数据 */
  options?: DictItem[];
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: undefined,
  dictId: undefined,
  dictCode: undefined,
  placeholder: "请选择",
  disabled: false,
  size: "default",
  clearable: true,
  multiple: false,
  collapseTags: true,
  collapseTagsTooltip: true,
  filterable: true,
  remote: false,
  showCode: false,
  showIcon: true,
  showRefresh: false,
  prefixIcon: undefined,
  loadingText: "加载中...",
  noDataText: "暂无数据",
  popperClass: "sc-dict-select-dropdown",
  labelField: "sysDictItemName",
  valueField: "sysDictItemCode",
  codeField: "sysDictItemCode",
  immediate: true,
  request: undefined,
  options: undefined
});

const emit = defineEmits<{
  "update:modelValue": [value: string | number | (string | number)[] | undefined];
  change: [value: string | number | (string | number)[] | undefined, item: DictItem | DictItem[] | undefined];
  "visible-change": [visible: boolean];
  focus: [event: FocusEvent];
  blur: [event: FocusEvent];
  clear: [];
  loaded: [options: DictItem[]];
}>();

// 状态
const loading = ref(false);
const dictList = ref<DictItem[]>([]);

// 当前值
const currentValue = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val)
});

// 字典选项（静态数据优先）
const dictOptions = computed(() => {
  if (props.options && props.options.length > 0) {
    return props.options;
  }
  return dictList.value;
});

// 加载字典数据
const loadDictData = async (keyword?: string) => {
  if (!props.dictId && !props.dictCode && !props.request) {
    return;
  }

  loading.value = true;
  try {
    let data: DictItem[] = [];

    if (props.request) {
      // 使用自定义请求函数
      data = await props.request({ keyword });
    } else {
      // 使用默认API
      const params: any = {};
      if (props.dictId) {
        params.sysDictId = props.dictId;
      }
      if (props.dictCode) {
        params.sysDictCode = props.dictCode;
      }
      if (keyword) {
        params.sysDictItemName = keyword;
      }

      const res = await fetchListDictItem(params);
      if (res?.data) {
        data = res.data;
      }
    }

    dictList.value = data;
    emit("loaded", data);
  } catch (error) {
    console.error("Load dictionary error:", error);
    dictList.value = [];
  } finally {
    loading.value = false;
  }
};

// 刷新数据
const refresh = () => {
  loadDictData();
};

// 远程搜索
const handleRemoteSearch = (keyword: string) => {
  if (props.remote) {
    loadDictData(keyword);
  }
};

// 处理值变化
const handleChange = (value: string | number | (string | number)[] | undefined) => {
  let selectedItem: DictItem | DictItem[] | undefined;

  if (props.multiple && Array.isArray(value)) {
    selectedItem = dictOptions.value.filter((item) =>
      (value as (string | number)[]).includes(item[props.valueField])
    );
  } else {
    selectedItem = dictOptions.value.find((item) => item[props.valueField] === value);
  }

  emit("change", value, selectedItem);
};

// 处理下拉框显示
const handleVisibleChange = (visible: boolean) => {
  emit("visible-change", visible);

  // 首次展开时加载数据
  if (visible && dictList.value.length === 0 && !props.options) {
    loadDictData();
  }
};

// 处理焦点
const handleFocus = (event: FocusEvent) => {
  emit("focus", event);
};

// 处理失焦
const handleBlur = (event: FocusEvent) => {
  emit("blur", event);
};

// 处理清空
const handleClear = () => {
  emit("clear");
};

// 根据值获取标签
const getLabel = (value: string | number): string => {
  const item = dictOptions.value.find((item) => item[props.valueField] === value);
  return item ? item[props.labelField] : String(value);
};

// 根据值获取完整项
const getItem = (value: string | number): DictItem | undefined => {
  return dictOptions.value.find((item) => item[props.valueField] === value);
};

// 监听字典ID变化
watch(
  () => [props.dictId, props.dictCode],
  () => {
    if (props.dictId || props.dictCode) {
      loadDictData();
    }
  }
);

// 立即加载
onMounted(() => {
  if (props.immediate && (props.dictId || props.dictCode || props.request)) {
    loadDictData();
  }
});

// 暴露方法
defineExpose({
  refresh,
  loadDictData,
  getLabel,
  getItem,
  dictOptions
});
</script>

<style lang="scss" scoped>
.sc-dict-select {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  width: 100%;

  :deep(.el-select) {
    flex: 1;
  }

  &.is-disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }

  // 尺寸变体
  &--small {
    .dict-icon {
      font-size: 14px;
    }
  }

  &--large {
    .dict-icon {
      font-size: 18px;
    }
  }
}

// 前缀图标
.dict-icon {
  color: var(--el-text-color-placeholder);
  transition: color 0.3s;

  .sc-dict-select:focus-within & {
    color: var(--el-color-primary);
  }
}

// 选项样式
.dict-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;

  &__label {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__code {
    margin-left: 8px;
    padding: 2px 6px;
    font-size: 12px;
    color: var(--el-text-color-secondary);
    background: var(--el-fill-color-light);
    border-radius: 4px;
  }
}

// 空状态
.dict-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px;
  color: var(--el-text-color-placeholder);

  &__icon {
    font-size: 32px;
    margin-bottom: 8px;
  }

  &__text {
    font-size: 13px;
  }
}

// 刷新按钮
.refresh-btn {
  flex-shrink: 0;
  padding: 8px;

  .is-loading {
    animation: rotate 1s linear infinite;
  }
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>

<style lang="scss">
// 下拉面板样式（全局）
.sc-dict-select-dropdown {
  .el-select-dropdown__item {
    padding: 8px 12px;

    &.is-selected {
      font-weight: 600;

      .dict-option__code {
        background: var(--el-color-primary-light-8);
        color: var(--el-color-primary);
      }
    }
  }
}
</style>
