<script setup lang="ts">
/**
 * ScSearch 搜索组件
 * @author CH
 * @date 2025-01-17
 * @version 2.0.0
 */
import ArrowDown from "@iconify-icons/ep/arrow-down";
import ArrowUp from "@iconify-icons/ep/arrow-up";
import Info from "@iconify-icons/ep/info-filled";
import Search from "@iconify-icons/ep/search";
import Refresh from "@iconify-icons/line-md/backup-restore";
import Edit from "@iconify-icons/line-md/plus";
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import Segmented from "@repo/components/ReSegmented";
import type { FormInstance } from "element-plus";
import { debounce } from "lodash-es";
import { computed, markRaw, nextTick, onMounted, reactive, ref, watch } from "vue";
import { useI18n } from "vue-i18n";

// 定义表单项类型
export interface SearchFormItem {
  /** 字段名 */
  prop: string;
  /** 标签 */
  label: string;
  /** 表单项类型 */
  type?: "input" | "textarea" | "select" | "datepicker" | "daterange" | "radio" | "checkbox" | "number" | "segmented" | "switch" | "cascader" | "time" | "timerange";
  /** 占位符 */
  placeholder?: string;
  /** 是否可清空 */
  clearable?: boolean;
  /** 宽度 */
  width?: string;
  /** 提示信息 */
  tooltip?: string;
  /** 是否需要管理员权限 */
  isAdmin?: boolean;
  /** 日期格式 */
  valueFormat?: string;
  /** 数字输入最小值 */
  min?: number;
  /** 数字输入最大值 */
  max?: number;
  /** 选项列表 */
  children?: Array<{ label: string; value: any }>;
  /** 是否必填 */
  required?: boolean;
  /** 验证规则 */
  rules?: any[];
  /** 是否禁用 */
  disabled?: boolean;
  /** 级联选择器配置 */
  cascaderProps?: any;
}

// 定义组件属性
interface Props {
  /** 默认显示的表单项数量 */
  showNumber?: number;
  /** 表单项配置 */
  columns?: SearchFormItem[];
  /** 是否启用防抖搜索 */
  enableDebounce?: boolean;
  /** 防抖延迟时间(ms) */
  debounceDelay?: number;
  /** 是否显示重置按钮 */
  showReset?: boolean;
  /** 是否显示编辑按钮 */
  showEdit?: boolean;
  /** 按钮显示模式：'icon' 只显示图标，'text' 显示图标+文字 */
  buttonMode?: "icon" | "text";
  /** 按钮和条件对齐方式：'space-between' 两端对齐，'flex-end' 右对齐，'flex-start' 左对齐，'center' 居中对齐 */
  alignMode?: "space-between" | "flex-end" | "flex-start" | "center";
  /** 表单验证规则 */
  rules?: Record<string, any[]>;
  /** 初始表单数据 */
  modelValue?: Record<string, any>;
  /** 值改变时是否自动触发搜索，默认为false */
  autoSearch?: boolean;
}

// 定义事件
interface Emits {
  (e: "update:modelValue", value: Record<string, any>): void;
  (e: "search", form: Record<string, any>): void;
  (e: "reset", form: Record<string, any>): void;
  (e: "edit", form: Record<string, any>, type: string): void;
}

// 组件属性默认值
const props = withDefaults(defineProps<Props>(), {
  showNumber: 4,
  columns: () => [],
  enableDebounce: true,
  debounceDelay: 300,
  showReset: true,
  showEdit: false,
  buttonMode: "icon",
  alignMode: "space-between",
  rules: () => ({}),
  modelValue: () => ({}),
  autoSearch: false
});

// 定义事件
const emit = defineEmits<Emits>();

// 响应式数据
const formRef = ref<FormInstance>();
const form = reactive<Record<string, any>>({});
const showNumberValue = ref(props.showNumber);
const { t } = useI18n();

// 图标配置
const icons = {
  ArrowUp: markRaw(ArrowUp),
  ArrowDown: markRaw(ArrowDown),
  Refresh: markRaw(Refresh),
  Info: markRaw(Info),
  Search: markRaw(Search),
  Edit: markRaw(Edit)
};

// 状态管理
const state = reactive({
  visible: {
    query: false
  },
  loading: {
    query: false
  }
});

// 计算属性
const isExpanded = computed(() => state.visible.query);
const canExpand = computed(() => props.columns.length > props.showNumber);
const visibleColumns = computed(() => {
  return props.columns.slice(0, showNumberValue.value);
});

// 防抖搜索函数
const debouncedSearch = debounce((formData: Record<string, any>) => {
  handleSearch(formData);
}, props.debounceDelay);

// 监听表单数据变化
watch(
  () => props.modelValue,
  newVal => {
    if (newVal) {
      Object.assign(form, newVal);
    }
  },
  { immediate: true, deep: true }
);

// 监听表单变化并触发搜索
watch(
  form,
  newForm => {
    emit("update:modelValue", { ...newForm });
    // 只有在autoSearch为true时才自动触发搜索
    if (props.autoSearch) {
      if (props.enableDebounce) {
        debouncedSearch({ ...newForm });
      } else {
        handleSearch({ ...newForm });
      }
    }
  },
  { deep: true }
);

// 初始化表单数据
const initForm = () => {
  props.columns.forEach(item => {
    if (!(item.prop in form)) {
      form[item.prop] = getDefaultValue(item.type);
    }
  });
};

// 获取默认值
const getDefaultValue = (type?: string) => {
  switch (type) {
    case "number":
      return 0;
    case "switch":
      return false;
    case "checkbox":
    case "cascader":
      return [];
    default:
      return "";
  }
};

// 搜索处理
const handleSearch = (formData: Record<string, any>) => {
  state.loading.query = true;
  try {
    emit("search", formData);
  } finally {
    state.loading.query = false;
  }
};

// 立即搜索（不防抖）
const onSearchImmediate = () => {
  handleSearch({ ...form });
};

// 重置表单
const onReset = async () => {
  await nextTick();
  formRef.value?.resetFields();

  // 重置为默认值
  props.columns.forEach(item => {
    form[item.prop] = getDefaultValue(item.type);
  });

  const resetForm = { ...form };
  emit("reset", resetForm);
  handleSearch(resetForm);
};

// 编辑处理
const onEditHandle = () => {
  const formData = { ...form };
  emit("edit", formData, "save");
};

// 展开/收起
const toggleExpand = () => {
  if (state.visible.query) {
    showNumberValue.value = props.showNumber;
    state.visible.query = false;
  } else {
    showNumberValue.value = 99999;
    state.visible.query = true;
  }
};

// 表单验证
const validateForm = async (): Promise<boolean> => {
  if (!formRef.value) return true;
  try {
    await formRef.value.validate();
    return true;
  } catch {
    return false;
  }
};

// 清空表单
const clearForm = () => {
  formRef.value?.clearValidate();
  Object.keys(form).forEach(key => {
    const column = props.columns.find(col => col.prop === key);
    form[key] = getDefaultValue(column?.type);
  });
};

// 设置表单数据
const setFormData = (data: Record<string, any>) => {
  Object.assign(form, data);
};

// 获取表单数据
const getFormData = () => ({ ...form });

// 暴露方法给父组件
defineExpose({
  validateForm,
  clearForm,
  setFormData,
  getFormData,
  resetForm: onReset
});

// 组件挂载
onMounted(() => {
  initForm();
});
</script>

<template>
  <div class="w-full flex items-center">
    <el-form ref="formRef" :inline="true" :model="form" :rules="rules" class="search-form bg-bg_color pl-8 flex items-center w-full">
      <el-row :gutter="12">
        <el-col v-for="item in visibleColumns" :key="item.prop" :md="12" :lg="6">
          <span v-if="item.isAdmin" v-admin>
            <el-form-item
              :key="item.prop"
              :style="{ width: item.width || '100%' }"
              :label="item.label"
              :prop="item.prop"
              :required="item.required"
              :rules="item.rules"
              :class="item.width ? '' : 'w-full'"
            >
              <template #label="{ label }">
                <span class="flex items-center relative">
                  <span>{{ label }}</span>
                  <span class="ml-[4px]">
                    <el-tooltip v-if="item.tooltip" :content="item.tooltip">
                      <component :is="useRenderIcon(icons.Info)" />
                    </el-tooltip>
                    <span v-else class="ml-3.5" />
                  </span>
                </span>
              </template>

              <!-- 输入框 -->
              <el-input v-if="!item.type || item.type === 'input'" v-model="form[item.prop]" :placeholder="item.placeholder" :clearable="item.clearable" :disabled="item.disabled" />

              <!-- 文本域 -->
              <el-input v-else-if="item.type === 'textarea'" v-model="form[item.prop]" :placeholder="item.placeholder" :clearable="item.clearable" :disabled="item.disabled" type="textarea" />

              <!-- 日期选择器 -->
              <el-date-picker
                v-else-if="item.type === 'datepicker'"
                v-model="form[item.prop]"
                type="date"
                :placeholder="item.placeholder"
                :clearable="item.clearable"
                :disabled="item.disabled"
                :value-format="item.valueFormat"
              />

              <!-- 日期范围选择器 -->
              <el-date-picker
                v-else-if="item.type === 'daterange'"
                v-model="form[item.prop]"
                type="daterange"
                :placeholder="item.placeholder"
                :clearable="item.clearable"
                :disabled="item.disabled"
                :value-format="item.valueFormat"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
              />

              <!-- 时间选择器 -->
              <el-time-picker
                v-else-if="item.type === 'time'"
                v-model="form[item.prop]"
                :placeholder="item.placeholder"
                :clearable="item.clearable"
                :disabled="item.disabled"
                :value-format="item.valueFormat"
              />

              <!-- 时间范围选择器 -->
              <el-time-picker
                v-else-if="item.type === 'timerange'"
                v-model="form[item.prop]"
                is-range
                :placeholder="item.placeholder"
                :clearable="item.clearable"
                :disabled="item.disabled"
                :value-format="item.valueFormat"
                range-separator="至"
                start-placeholder="开始时间"
                end-placeholder="结束时间"
              />

              <!-- 单选按钮组 -->
              <el-radio-group v-else-if="item.type === 'radio'" v-model="form[item.prop]" :disabled="item.disabled">
                <el-radio-button v-for="option in item.children || []" :key="option.value" :value="option.value" :label="option.label" />
              </el-radio-group>

              <!-- 复选框组 -->
              <el-checkbox-group v-else-if="item.type === 'checkbox'" v-model="form[item.prop]" :disabled="item.disabled">
                <el-checkbox v-for="option in item.children || []" :key="option.value" :value="option.value" :label="option.label" />
              </el-checkbox-group>

              <!-- 分段控制器 -->
              <Segmented v-else-if="item.type === 'segmented'" v-model="form[item.prop]" :options="item.children" :disabled="item.disabled" />

              <!-- 下拉选择器 -->
              <el-select v-else-if="item.type === 'select'" v-model="form[item.prop]" :placeholder="item.placeholder" :clearable="item.clearable" :disabled="item.disabled" class="w-full">
                <el-option v-for="option in item.children || []" :key="option.value" :value="option.value" :label="option.label" />
              </el-select>

              <!-- 级联选择器 -->
              <el-cascader
                v-else-if="item.type === 'cascader'"
                v-model="form[item.prop]"
                :options="item.children"
                :placeholder="item.placeholder"
                :clearable="item.clearable"
                :disabled="item.disabled"
                :props="item.cascaderProps"
                class="w-full"
              />

              <!-- 数字输入框 -->
              <el-input-number
                v-else-if="item.type === 'number'"
                v-model="form[item.prop]"
                :placeholder="item.placeholder"
                :clearable="item.clearable"
                :disabled="item.disabled"
                :min="item.min"
                :max="item.max"
                class="w-full"
              />

              <!-- 开关 -->
              <el-switch v-else-if="item.type === 'switch'" v-model="form[item.prop]" :disabled="item.disabled" />

              <slot :name="item.prop" :item="item" :form="form" />
            </el-form-item>
          </span>

          <!-- 非管理员权限表单项 -->
          <span v-else>
            <el-form-item
              :key="item.prop"
              :style="{ width: item.width || '100%' }"
              :label="item.label"
              :prop="item.prop"
              :required="item.required"
              :rules="item.rules"
              :class="item.width ? '' : 'w-full'"
            >
              <template #label="{ label }">
                <span class="flex items-center relative">
                  <span>{{ label }}</span>
                  <span class="ml-[4px]">
                    <el-tooltip v-if="item.tooltip" :content="item.tooltip">
                      <el-icon>
                        <component :is="icons.Info" />
                      </el-icon>
                    </el-tooltip>
                    <span v-else class="ml-3.5" />
                  </span>
                </span>
              </template>

              <!-- 重复上面的表单控件，这里为了简化只展示主要的几种 -->
              <el-input v-if="!item.type || item.type === 'input'" v-model="form[item.prop]" :placeholder="item.placeholder" :clearable="item.clearable" :disabled="item.disabled" />

              <el-select v-else-if="item.type === 'select'" v-model="form[item.prop]" :placeholder="item.placeholder" :clearable="item.clearable" :disabled="item.disabled" class="w-full">
                <el-option v-for="option in item.children || []" :key="option.value" :value="option.value" :label="option.label" />
              </el-select>

              <!-- 其他控件类型可以根据需要添加 -->

              <slot :name="item.prop" :item="item" :form="form" />
            </el-form-item>
          </span>
        </el-col>

        <!-- 操作按钮区域 -->
        <div class="flex-1 flex items-center">
          <div class="w-full">
            <div class="flex flex-wrap flex-row items-center" :class="`justify-${props.alignMode}`">
              <div v-if="props.alignMode === 'space-between'" class="flex-1" />
              <div class="flex flex-row gap-2 items-center" :class="props.alignMode === 'space-between' ? 'flex-1 justify-end' : ''">
                <!-- 展开/收起按钮 -->
                <el-button v-if="!isExpanded && canExpand" :icon="useRenderIcon(icons.ArrowDown)" plain text @click="toggleExpand">
                  <template v-if="buttonMode === 'text'" #default>展开</template>
                </el-button>
                <el-button v-else-if="canExpand" :icon="useRenderIcon(icons.ArrowUp)" plain text @click="toggleExpand">
                  <template v-if="buttonMode === 'text'" #default>收起</template>
                </el-button>

                <!-- 搜索按钮 -->
                <el-button type="primary" :icon="useRenderIcon(icons.Search)" :loading="state.loading.query" @click="onSearchImmediate">
                  <template v-if="buttonMode === 'text'" #default>搜索</template>
                </el-button>

                <!-- 重置按钮 -->
                <el-button v-if="showReset && props.columns.length > 0" :icon="useRenderIcon(icons.Refresh)" @click="onReset">
                  <template v-if="buttonMode === 'text'" #default>重置</template>
                </el-button>

                <!-- 编辑按钮 -->
                <el-button v-if="showEdit" :icon="useRenderIcon(icons.Edit)" @click="onEditHandle">
                  <template v-if="buttonMode === 'text'" #default>新增</template>
                </el-button>
              </div>
            </div>
          </div>
        </div>
      </el-row>
    </el-form>
  </div>
</template>

<style scoped>
.search-form {
  transition: all 0.3s ease;
  min-height: 50px;
}

.search-form .el-form-item {
  margin-bottom: 0;
  display: flex;
  align-items: center;
}

.search-form .el-form-item__label {
  font-weight: 500;
}

.search-form .el-row {
  width: 100%;
  align-items: center;
}

/* 响应式优化 */
@media (max-width: 768px) {
  .search-form {
    padding-left: 16px;
  }

  .flex-row {
    flex-direction: column;
    gap: 8px;
  }

  .justify-end {
    justify-content: center;
  }
}

/* 无障碍访问优化 */
.search-form .el-button:focus {
  outline: 2px solid var(--el-color-primary);
  outline-offset: 2px;
}

.search-form .el-form-item__label {
  color: var(--el-text-color-regular);
}
</style>
