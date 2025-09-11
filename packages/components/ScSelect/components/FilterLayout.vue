<template>
  <div class="sc-select-filter">
    <div v-if="options.length <= 0" class="sc-select-filter__no-data">暂无数据</div>
    <div v-for="item in options" :key="item.key" class="sc-select-filter__item">
      <div class="sc-select-filter__item-title" :style="{ width: labelWidth }">
        <label>{{ item.title }}：</label>
      </div>
      <div class="sc-select-filter__item-options">
        <ul>
          <li
            v-for="option in item.options"
            :key="option.value"
            :class="{
              'el-text': true,
              active: isActive(option, item)
            }"
            @click="select(option, item)"
          >
            <el-icon v-if="option.icon">
              <component :is="option.icon" />
            </el-icon>
            <span>{{ option.label }}</span>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";

interface FilterOption {
  label: string;
  value: string | number;
  icon?: string;
}

interface FilterItem {
  key: string;
  title: string;
  multiple?: boolean;
  options: FilterOption[];
}

interface Props {
  modelValue?: Record<string, any>;
  options: FilterItem[];
  labelWidth?: string;
  outputValueTypeToArray?: boolean;
  filterOutputFormat?: "default" | "array" | "sql" | "lucene";
  filterOperator?: "in" | "eq" | "ne" | "gt" | "gte" | "lt" | "lte" | "like" | "between";
  filterField?: string;
}

interface Emits {
  (e: "update:modelValue", value: Record<string, any>): void;
  (e: "change", value: Record<string, any>): void;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => ({}),
  options: () => [],
  labelWidth: "100px",
  outputValueTypeToArray: false,
  filterOutputFormat: "default",
  filterOperator: "in",
  filterField: "field"
});

const emit = defineEmits<Emits>();

const selected = ref<Record<string, any>>({});

// 计算字符串格式的输出
const selectedString = computed(() => {
  const outputData = JSON.parse(JSON.stringify(selected.value));
  for (const key in outputData) {
    outputData[key] = outputData[key].join(",");
  }
  return outputData;
});

// 监听options变化，初始化选中值
watch(
  () => props.options,
  val => {
    val.forEach(item => {
      selected.value[item.key] = props.modelValue[item.key] || (Array.isArray(item.options) && item.options.length ? [item.options[0].value] : []);
    });
  },
  { immediate: true }
);

// 监听modelValue变化
watch(
  () => props.modelValue,
  newValue => {
    if (newValue) {
      Object.keys(newValue).forEach(key => {
        if (selected.value[key] !== undefined) {
          selected.value[key] = newValue[key];
        }
      });
    }
  },
  { deep: true }
);

// 判断选项是否激活
const isActive = (option: FilterOption, item: FilterItem) => {
  return selected.value[item.key] && selected.value[item.key].includes(option.value);
};

// 选择选项
const select = (option: FilterOption, item: FilterItem) => {
  // 判断单选多选
  if (item.multiple) {
    // 如果多选选择的第一个
    if (option.value === item.options[0].value) {
      // 就赋值第一个的值
      selected.value[item.key] = [option.value];
    } else {
      // 如果选择的值已有
      if (selected.value[item.key].includes(option.value)) {
        // 删除选择的值
        selected.value[item.key].splice(
          selected.value[item.key].findIndex((s: any) => s === option.value),
          1
        );
        // 当全删光时，把第一个选中
        if (selected.value[item.key].length === 0) {
          selected.value[item.key] = [item.options[0].value];
        }
      } else {
        // 未有值的时候，追加选中值
        selected.value[item.key].push(option.value);
        // 当含有第一个的值的时候，把第一个删除
        if (selected.value[item.key].includes(item.options[0].value)) {
          selected.value[item.key].splice(
            selected.value[item.key].findIndex((s: any) => s === item.options[0].value),
            1
          );
        }
      }
    }
  } else {
    // 单选时，如果点击了已有值就赋值
    if (!selected.value[item.key].includes(option.value)) {
      selected.value[item.key] = [option.value];
    } else {
      return false;
    }
  }
  change();
};

// 触发变化事件
const change = () => {
  const outputValue = props.outputValueTypeToArray ? selected.value : selectedString.value;
  emit("update:modelValue", outputValue);
  emit("change", outputValue);
};

// 初始化选中值
props.options.forEach(item => {
  selected.value[item.key] = props.modelValue[item.key] || (Array.isArray(item.options) && item.options.length ? [item.options[0].value] : []);
});
</script>

<style scoped>
.sc-select-filter {
  width: 100%;
}

.sc-select-filter__item {
  display: flex;
}

.sc-select-filter__item-title {
  width: 80px;
}

.sc-select-filter__item-title label {
  font-size: 14px;
  padding-top: 13px;
  display: inline-block;
  color: #999;
}

.sc-select-filter__item-options {
  flex: 1;
  border-bottom: 1px dashed var(--el-border-color-light);
}

.sc-select-filter__item-options ul {
  display: flex;
  flex-wrap: wrap;
  padding-top: 10px;
  margin: 0;
  padding-left: 0;
}

.sc-select-filter__item-options li {
  list-style: none;
  cursor: pointer;
  height: 28px;
  padding: 0 15px;
  border-radius: 32px;
  margin: 0 10px 10px 0;
  display: flex;
  align-items: center;
  background: var(--el-color-primary-light-9);
  transition: all 0.3s ease;
}

.sc-select-filter__item-options li .el-icon {
  margin-right: 3px;
  font-size: 16px;
}

.sc-select-filter__item-options li:hover {
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-8);
}

.sc-select-filter__item-options li.active {
  background: var(--el-color-primary);
  color: #fff;
  font-weight: bold;
}

.sc-select-filter__item:last-of-type .sc-select-filter__item-options {
  border: 0;
}

.sc-select-filter__no-data {
  color: #999;
  text-align: center;
  padding: 20px;
}
</style>
