<template>
  <div class="card-selector-container">
    <!-- 原生select布局 -->
    <SelectLayout
      v-if="layout === 'select'"
      v-model="selectValue"
      :options="selectListOptions"
      :multiple="multiple"
      :limit="limit"
      :max-collapse-tags="maxCollapseTags"
      :show-batch-actions="showBatchActions"
      @change="handleNativeSelectChange"
      @selectAll="selectAll"
      @invertSelection="invertSelection"
      @clearSelection="clearSelection"
    />

    <!-- 卡片选择器布局 -->
    <div v-else-if="layout === 'card'" class="card-selector-flex" :style="flexStyles">
      <!-- 使用CardLayout组件 -->
      <CardLayout
        v-for="item in selectListOptions"
        :key="item.value"
        :label="item.label || item.describe || item.name"
        :value="item.value"
        :icon="item.icon"
        :is-selected="isSelected(item.value)"
        :is-disabled="isItemDisabled(item.value)"
        :width="width"
        :icon-position="iconPosition"
        :shape="shape"
        @select="handleSelect"
      />
    </div>

    <!-- 药丸选择器布局 -->
    <div v-else-if="layout === 'pill'" class="pill-selector-flex" :style="flexStyles">
      <!-- 使用PillLayout组件 -->
      <PillLayout
        v-for="item in selectListOptions"
        :key="item.value"
        :label="item.label || item.describe || item.name"
        :value="item.value"
        :icon="item.icon"
        :is-selected="isSelected(item.value)"
        :is-disabled="isItemDisabled(item.value)"
        @select="handleSelect"
      />
    </div>

    <!-- 下拉选择器布局 -->
    <DropdownLayout
      v-else-if="layout === 'dropdown'"
      :options="selectListOptions"
      :model-value="modelValue"
      :url="url"
      :url-params="urlParams"
      :multiple="multiple"
      :limit="limit"
      :width="width"
      :height="height"
      :icon="dropdownIcon"
      :title="dropdownTitle"
      :placeholder="dropdownPlaceholder"
      :dropdown-direction="dropdownDirection"
      :dropdown-col="dropdownCol"
      :display-mode="displayMode"
      :is-selected="isSelected"
      :is-item-disabled="isItemDisabled"
      @select="handleSelect"
    />

    <!-- 过滤器布局 -->
    <FilterLayout
      v-if="layout === 'filter'"
      :model-value="selectValue"
      :options="selectListOptions"
      :label-width="labelWidth"
      :filter-fileld-type="filterFileldType"
      :filter-output-format="filterOutputFormat"
      @change="handleChange"
    />

    <!-- 表格选择器布局 -->
    <ScSelectTable
      v-else-if="layout === 'table'"
      v-model="selectValue"
      :options="selectListOptions"
      :url="url"
      :url-params="urlParams"
      :multiple="multiple"
      :limit="limit"
      :columns="tableColumns"
      :width="width"
      :is-remote="isRemote"
      :height="height"
      :keywords="tableKeywords"
      :border="tableBorder"
      :icon="dropdownIcon"
      :remote-search="tableRemoteSearch"
      :title="dropdownTitle"
      :page-size="tablePageSize"
      :placeholder="dropdownPlaceholder"
    />
  </div>
</template>
<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import CardLayout from "./components/CardLayout.vue";
import DropdownLayout, { DropdownOption } from "./components/DropdownLayout.vue";
import FilterLayout from "./components/FilterLayout.vue";
import PillLayout from "./components/PillLayout.vue";
import ScSelectTable from "./components/ScSelectTableLayout.vue";
import SelectLayout, { CardOption } from "./components/SelectLayout.vue";

export interface TableColumn {
  prop: string;
  label: string;
  minWidth: string;
}

export interface SelectProps {
  label: string;
  prop: string;
  icon: string;
}

export interface FilterFieldType {
  prop: string;
  type: string;
}

const props = defineProps({
  // v-model绑定值
  modelValue: {
    type: [String, Number, Array],
    default: ""
  },
  // 数据源URL函数
  url: {
    type: Function,
    default: () => {}
  },
  urlParams: {
    type: Object,
    default: () => {}
  },
  // 选项数组
  options: {
    type: Array as () => DropdownOption[] & CardOption[],
    required: true,
    default: () => []
  },
  props: {
    type: Object,
    default: () => {
      return {
        label: "label",
        prop: "value",
        icon: "icon"
      } as SelectProps;
    }
  },
  isRemote: {
    type: Boolean,
    default: false
  },
  // 每行显示的卡片数量
  columns: {
    type: [Number, String],
    default: "auto"
  },
  // 卡片间距
  gap: {
    type: Number,
    default: 12
  },
  // 布局类型
  layout: {
    type: String,
    default: "card",
    validator: (value: string) => {
      return ["card", "select", "pill", "dropdown", "filter", "table"].includes(value);
    }
  },
  // 是否多选
  multiple: {
    type: Boolean,
    default: false
  },
  // 多选模式下最多可选择的数量
  limit: {
    type: Number,
    default: 0 // 0表示不限制
  },
  // 多选模式下最多显示的标签数量
  maxCollapseTags: {
    type: Number,
    default: 1
  },
  // 是否显示批量操作按钮
  showBatchActions: {
    type: Boolean,
    default: true
  },
  // 卡片宽度
  width: {
    type: String,
    default: "100px"
  },
  height: {
    type: String,
    default: "100%"
  },
  // 图标位置
  iconPosition: {
    type: String,
    default: "center",
    validator: (value: string) => {
      return ["center", "top"].includes(value);
    }
  },
  tableBorder: {
    type: Boolean,
    default: true
  },
  tableKeywords: {
    type: Object,
    default: { label: "label", value: "value" } as const
  },
  // 下拉选择器图标
  dropdownIcon: {
    type: String,
    default: "ri:settings-3-line"
  },
  // 下拉选择器标题
  dropdownTitle: {
    type: String,
    default: ""
  },
  // 下拉选择器占位符
  dropdownPlaceholder: {
    type: String,
    default: "请选择"
  },
  // 形状类型
  shape: {
    type: String,
    default: "rounded",
    validator: (value: string) => {
      return ["circle", "rectangle", "rounded"].includes(value);
    }
  },
  // 下拉方向
  dropdownDirection: {
    type: String,
    default: "vertical",
    validator: (value: string) => {
      return ["vertical", "horizontal"].includes(value);
    }
  },
  // 下拉面板列数
  dropdownCol: {
    type: Number,
    default: 1,
    validator: (value: number) => {
      return value > 0 && value <= 6;
    }
  },
  // 显示模式
  displayMode: {
    type: String,
    default: "normal",
    validator: (value: string) => {
      return ["normal", "large"].includes(value);
    }
  },
  // 过滤器模式标签宽度
  labelWidth: {
    type: String,
    default: "100px"
  },
  // 过滤器模式输出格式
  filterOutputFormat: {
    type: String,
    default: "default",
    validator: (value: string) => ["default", "array", "sql", "lucene"].includes(value)
  },
  filterFileldType: {
    type: Array,
    default: () => [] as FilterFieldType[]
  },
  tableColumns: {
    type: Array as () => TableColumn[],
    default: () => [] as TableColumn[]
  },
  tablePageSize: {
    type: Number,
    default: 10
  },
  tableRemoteSearch: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(["update:modelValue", "change", "success", "failure", "selection-change", "search", "page-change", "size-change", "focus", "blur", "clear", "error"]);

const isRemoteData = ref(props.isRemote);
// 原生select绑定值
const selectValue = ref(props.modelValue);
const selectOptions = ref(props.options);
const selectListOptions = computed(() => {
  return selectOptions.value.map(item => {
    return {
      ...item,
      label: item[props.props.label],
      value: item[props.props.prop],
      icon: item[props.props.icon]
    };
  });
});
// 计算flex样式
const flexStyles = computed(() => {
  return {
    gap: `${props.gap}px`
  };
});

// 监听modelValue变化同步到selectValue
watch(
  () => props.modelValue,
  newValue => {
    selectValue.value = newValue;
  }
);
const fetchOptions = async () => {
  if (typeof props.url === "function") {
    props.url(props.urlParams).then(res => {
      try {
        if (!res?.data) {
          selectOptions.value = (res || []) as any;
        }
        if (res.data?.total) {
          selectOptions.value = res.data?.records || [];
          return;
        }
        selectOptions.value = res.data || [];
        return;
      } catch (error) {
        console.error("获取数据失败:", error);
      }
    });
  }
};

const initializer = async () => {
  if (!isRemoteData.value || props.layout === "table") {
    return;
  }
  fetchOptions();
};

onMounted(async () => {
  initializer();
});

watch(
  () => props.isRemote,
  async newValue => {
    isRemoteData.value = newValue;
    await initializer();
  }
);

// 检查是否已达到选择上限
const isReachedLimit = computed(() => {
  if (!props.multiple || props.limit <= 0) return false;
  return Array.isArray(props.modelValue) && props.modelValue.length >= props.limit;
});

// 判断选项是否应该被禁用（已达到限制且未被选中）
const isItemDisabled = (value: string | number) => {
  if (!props.multiple || props.limit <= 0) return false;

  // 如果已达到限制，且当前项未被选中，则禁用
  if (isReachedLimit.value && !isSelected(value)) {
    return true;
  }

  return false;
};

// 处理原生select变化
const handleNativeSelectChange = (value: string | number | Array<string | number>) => {
  emit("update:modelValue", value);
  emit("change", value);
};

// 格式化SQL条件
const formatSqlCondition = (field: string, operator: string, values: any[]) => {
  if (!values || values.length === 0) return "";

  const value = values[0];
  const escapedValue = typeof value === "string" ? `'${value}'` : value;

  switch (operator) {
    case "eq":
      return `${field} = ${escapedValue}`;
    case "ne":
      return `${field} != ${escapedValue}`;
    case "gt":
      return `${field} > ${escapedValue}`;
    case "gte":
      return `${field} >= ${escapedValue}`;
    case "lt":
      return `${field} < ${escapedValue}`;
    case "lte":
      return `${field} <= ${escapedValue}`;
    case "like":
      return `${field} LIKE '%${value}%'`;
    case "between":
      if (values.length >= 2) {
        const val1 = typeof values[0] === "string" ? `'${values[0]}'` : values[0];
        const val2 = typeof values[1] === "string" ? `'${values[1]}'` : values[1];
        return `${field} BETWEEN ${val1} AND ${val2}`;
      }
      return `${field} >= ${escapedValue}`;
    case "in":
    default:
      if (values.length === 1) {
        return `${field} = ${escapedValue}`;
      } else {
        const valueList = values.map(v => (typeof v === "string" ? `'${v}'` : v)).join(", ");
        return `${field} IN (${valueList})`;
      }
  }
};

// 格式化Lucene条件
const formatLuceneCondition = (field: string, operator: string, values: any[]) => {
  if (!values || values.length === 0) return "";

  const value = values[0];

  switch (operator) {
    case "eq":
      return `${field}:"${value}"`;
    case "ne":
      return `NOT ${field}:"${value}"`;
    case "gt":
      return `${field}:{${value} TO *}`;
    case "gte":
      return `${field}:[${value} TO *]`;
    case "lt":
      return `${field}:{* TO ${value}}`;
    case "lte":
      return `${field}:[* TO ${value}]`;
    case "like":
      return `${field}:*${value}*`;
    case "between":
      if (values.length >= 2) {
        return `${field}:[${values[0]} TO ${values[1]}]`;
      }
      return `${field}:[${value} TO *]`;
    case "in":
    default:
      if (values.length === 1) {
        return `${field}:"${value}"`;
      } else {
        const valueList = values.map(v => `${field}:"${v}"`).join(" OR ");
        return `(${valueList})`;
      }
  }
};

// 将default格式转换为SQL
const convertDefaultToSql = (defaultData: any) => {
  if (!defaultData || typeof defaultData !== "object") {
    return "";
  }

  const conditions: string[] = [];

  for (const [key, value] of Object.entries(defaultData)) {
    if (value === null || value === undefined || value === "") {
      continue;
    }

    if (Array.isArray(value)) {
      if (value.length === 0) continue;
      if (value.length === 1) {
        conditions.push(`${key} = '${value[0]}'`);
      } else {
        const valueList = value.map(v => `'${v}'`).join(", ");
        conditions.push(`${key} IN (${valueList})`);
      }
    } else {
      conditions.push(`${key} = '${value}'`);
    }
  }

  return conditions.join(" AND ");
};

// 将default格式转换为Lucene
const convertDefaultToLucene = (defaultData: any) => {
  if (!defaultData || typeof defaultData !== "object") {
    return "";
  }

  const conditions: string[] = [];

  for (const [key, value] of Object.entries(defaultData)) {
    if (value === null || value === undefined || value === "") {
      continue;
    }

    if (Array.isArray(value)) {
      if (value.length === 0) continue;
      if (value.length === 1) {
        conditions.push(`${key}:"${value[0]}"`);
      } else {
        const valueList = value.map(v => `${key}:"${v}"`).join(" OR ");
        conditions.push(`(${valueList})`);
      }
    } else {
      conditions.push(`${key}:"${value}"`);
    }
  }

  return conditions.join(" AND ");
};

// 处理过滤器变化
const handleChange = (value: any) => {
  if (props.layout === "filter") {
    let result = value;

    // 根据输出格式转换结果
    if (props.filterOutputFormat === "array") {
      result = Array.isArray(value) ? value : [value];
    } else if (props.filterOutputFormat === "sql") {
      // 将default格式完整转换为SQL where条件格式字符串
      result = convertDefaultToSql(value);
    } else if (props.filterOutputFormat === "lucene") {
      // 将default格式完整转换为Lucene查询格式字符串
      result = convertDefaultToLucene(value);
    } else {
      // default格式，保持原始格式
      result = value;
    }

    emit("update:modelValue", result);
    emit("change", result);
  } else {
    emit("update:modelValue", value);
    emit("change", value);
  }
};

// 全选
const selectAll = () => {
  if (!props.multiple) return;

  let allValues = props.options.map(item => item.value);

  // 如果有数量限制，截取到限制数量
  if (props.limit > 0 && allValues.length > props.limit) {
    allValues = allValues.slice(0, props.limit);
  }

  emit("update:modelValue", allValues);
  emit("change", allValues);
  selectValue.value = allValues;
};

// 反选
const invertSelection = () => {
  if (!props.multiple || !Array.isArray(props.modelValue)) return;

  const currentValues = props.modelValue as (string | number)[];
  let invertedValues = props.options.map(item => item.value).filter(value => !currentValues.includes(value));

  // 如果有数量限制，截取到限制数量
  if (props.limit > 0 && invertedValues.length > props.limit) {
    invertedValues = invertedValues.slice(0, props.limit);
  }

  emit("update:modelValue", invertedValues);
  emit("change", invertedValues);
  selectValue.value = invertedValues;
};

// 清空选择
const clearSelection = () => {
  if (!props.multiple) return;

  const emptyArray: (string | number)[] = [];
  emit("update:modelValue", emptyArray);
  emit("change", emptyArray);
  selectValue.value = emptyArray;
};

// 判断选项是否被选中
const isSelected = (value: string | number) => {
  if (props.multiple) {
    // 多选模式下，检查值是否在数组中
    return Array.isArray(props.modelValue) && props.modelValue.includes(value);
  } else {
    // 单选模式下，直接比较值
    return props.modelValue == value;
  }
};

// 选择卡片
const handleSelect = (value: string | number) => {
  if (props.multiple) {
    // 多选模式
    let newValue: (string | number)[] = [];

    if (Array.isArray(props.modelValue)) {
      // 如果已经是数组，复制一份
      //@ts-ignore
      newValue = [...props.modelValue];

      // 切换选中状态：如果已选中则移除，否则添加
      const index = newValue.indexOf(value);
      if (index > -1) {
        // 移除已选中的项
        newValue.splice(index, 1);
      } else {
        // 添加新项，但需要检查是否已达到限制
        if (props.limit <= 0 || newValue.length < props.limit) {
          newValue.push(value);
        }
      }
    } else {
      // 如果不是数组，创建一个新数组并添加当前值
      newValue = [value];
    }

    emit("update:modelValue", newValue);
    emit("change", newValue);
  } else {
    // 单选模式
    emit("update:modelValue", value);
    emit("change", value);
  }
};
</script>

<style lang="scss" scoped>
.card-selector-container {
  width: 100%;

  // 通用图标样式
  .action-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    margin-right: 4px;
    vertical-align: middle;
  }

  // 卡片flex布局
  .card-selector-flex {
    display: flex;
    flex-wrap: wrap;
    width: 100%;
  }

  // 药丸flex布局
  .pill-selector-flex {
    display: flex;
    flex-wrap: wrap;
    width: 100%;
    gap: 10px !important; // 药丸布局需要更小的间距
    justify-content: flex-start;
  }

  /* 响应式布局 */
  @media screen and (max-width: 768px) {
    .card-selector-flex,
    .pill-selector-flex {
      justify-content: space-between;
    }
  }
}

// 暗黑模式样式适配
:deep(.el-dark) {
  .card-selector-container {
    background-color: var(--el-bg-color);
  }
}
</style>
