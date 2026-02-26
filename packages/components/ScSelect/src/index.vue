<template>
  <!-- 像素主题下使用 PixelUI 选择器，其余情况回退 Element Plus 选择器 -->
  <component
    :is="currentComponent || ElSelect"
    v-model="currentValue"
    :multiple="multiple"
    :disabled="disabled"
    :value-key="valueKey"
    :size="size"
    :clearable="clearable"
    :collapse-tags="collapseTags"
    :collapse-tags-tooltip="collapseTagsTooltip"
    :multiple-limit="multipleLimit"
    :name="name"
    :effect="effect"
    :autocomplete="autocomplete"
    :placeholder="placeholder"
    :filterable="filterable"
    :allow-create="allowCreate"
    :filter-method="filterMethod"
    :remote="remote"
    :remote-method="remoteMethod"
    :remote-show-suffix="remoteShowSuffix"
    :loading="loading"
    :loading-text="loadingText"
    :no-match-text="noMatchText"
    :no-data-text="noDataText"
    :popper-class="popperClass"
    :reserve-keyword="reserveKeyword"
    :default-first-option="defaultFirstOption"
    :teleported="teleported"
    :persistent="persistent"
    :automatic-dropdown="automaticDropdown"
    :clear-icon="clearIcon"
    :fit-input-width="fitInputWidth"
    :suffix-icon="suffixIcon"
    :tag-type="tagType"
    :validate-event="validateEvent"
    :offset="offset"
    :show-arrow="showArrow"
    :placement="placement"
    :fallback-placements="fallbackPlacements"
    :max-collapse-tags="maxCollapseTags"
    :aria-label="ariaLabel"
    @change="handleChange"
    @visible-change="handleVisibleChange"
    @remove-tag="handleRemoveTag"
    @clear="handleClear"
    @blur="handleBlur"
    @focus="handleFocus"
  >
    <template v-if="$slots.default" #default>
      <slot />
    </template>
    <template v-if="$slots.prefix" #prefix>
      <slot name="prefix" />
    </template>
    <template v-if="$slots.empty" #empty>
      <slot name="empty" />
    </template>
    <template v-if="$slots.tag" #tag>
      <slot name="tag" />
    </template>
    <template v-if="$slots.loading" #loading>
      <slot name="loading" />
    </template>
    <template v-if="$slots.label" #label="{ label, value }">
      <slot name="label" :label="label" :value="value" />
    </template>
    <template v-if="$slots.header" #header>
      <slot name="header" />
    </template>
    <template v-if="$slots.footer" #footer>
      <slot name="footer" />
    </template>
  </component>
</template>

<script setup lang="ts">
/**
 * ScSelect 选择器组件
 * 封装 Element Plus Select 与 PixelUI PxSelect
 * 在 data-skin 为 8bit 时自动切换为像素风选择器
 * 
 * 作者：[CH]
 * 创建时间：2026-02-26
 * 版本：1.0.0
 */
import { computed } from "vue";
import type { PropType } from "vue";
import { ElSelect } from "element-plus";
import { useThemeComponent } from "../../hooks/useThemeComponent";

type SelectValue = string | number | boolean | Record<string, any> | any[];

const props = defineProps({
  /**
   * 绑定值
   */
  modelValue: {
    type: [String, Number, Boolean, Object, Array] as PropType<SelectValue>,
    default: ""
  },
  /**
   * 是否多选
   */
  multiple: {
    type: Boolean,
    default: false
  },
  /**
   * 是否禁用
   */
  disabled: {
    type: Boolean,
    default: false
  },
  /**
   * 作为 value 唯一标识的键名，绑定值为对象类型时必填
   */
  valueKey: {
    type: String,
    default: "value"
  },
  /**
   * 输入框尺寸
   */
  size: {
    type: String as PropType<"" | "large" | "default" | "small">,
    default: "default"
  },
  /**
   * 是否可以清空选项
   */
  clearable: {
    type: Boolean,
    default: false
  },
  /**
   * 多选时是否将选中值按文字的形式展示
   */
  collapseTags: {
    type: Boolean,
    default: false
  },
  /**
   * 当鼠标悬停于折叠标签的文本时，是否显示所有选中的标签
   */
  collapseTagsTooltip: {
    type: Boolean,
    default: false
  },
  /**
   * 多选时用户最多可以选择的项目数，为 0 则不限制
   */
  multipleLimit: {
    type: Number,
    default: 0
  },
  /**
   * select input 的 name 属性
   */
  name: {
    type: String,
    default: ""
  },
  /**
   * Tooltip 主题
   */
  effect: {
    type: String as PropType<"dark" | "light">,
    default: "light"
  },
  /**
   * select input 的 autocomplete 属性
   */
  autocomplete: {
    type: String,
    default: "off"
  },
  /**
   * 占位符
   */
  placeholder: {
    type: String,
    default: "Select"
  },
  /**
   * 是否可搜索
   */
  filterable: {
    type: Boolean,
    default: false
  },
  /**
   * 是否允许用户创建新条目
   */
  allowCreate: {
    type: Boolean,
    default: false
  },
  /**
   * 自定义搜索方法
   */
  filterMethod: Function,
  /**
   * 是否为远程搜索
   */
  remote: {
    type: Boolean,
    default: false
  },
  /**
   * 远程搜索方法
   */
  remoteMethod: Function,
  /**
   * 远程搜索时是否显示后缀图标
   */
  remoteShowSuffix: {
    type: Boolean,
    default: false
  },
  /**
   * 是否正在从远程获取数据
   */
  loading: {
    type: Boolean,
    default: false
  },
  /**
   * 远程加载时显示的文字
   */
  loadingText: {
    type: String,
    default: "Loading"
  },
  /**
   * 搜索条件无匹配时显示的文字
   */
  noMatchText: {
    type: String,
    default: "No matching data"
  },
  /**
   * 选项为空时显示的文字
   */
  noDataText: {
    type: String,
    default: "No data"
  },
  /**
   * Select 下拉框的类名
   */
  popperClass: {
    type: String,
    default: ""
  },
  /**
   * 多选且可搜索时，是否在选中一个选项后保留当前的搜索关键词
   */
  reserveKeyword: {
    type: Boolean,
    default: true
  },
  /**
   * 是否在输入框按下回车时，选择第一个匹配项
   */
  defaultFirstOption: {
    type: Boolean,
    default: false
  },
  /**
   * 是否将弹出框插入至 body 元素
   */
  teleported: {
    type: Boolean,
    default: true
  },
  /**
   * 当下拉选择器未被激活时，是否保持 tooltip 的显示状态
   */
  persistent: {
    type: Boolean,
    default: true
  },
  /**
   * 对于不可搜索的 Select，是否在输入框获得焦点后自动弹出选项菜单
   */
  automaticDropdown: {
    type: Boolean,
    default: false
  },
  /**
   * 自定义清空图标
   */
  clearIcon: {
    type: [String, Object],
    default: "CircleClose"
  },
  /**
   * 宽度是否自适应
   */
  fitInputWidth: {
    type: Boolean,
    default: false
  },
  /**
   * 自定义后缀图标
   */
  suffixIcon: {
    type: [String, Object],
    default: "ArrowDown"
  },
  /**
   * 标签类型
   */
  tagType: {
    type: String as PropType<"" | "success" | "info" | "warning" | "danger">,
    default: "info"
  },
  /**
   * 输入时是否触发表单验证
   */
  validateEvent: {
    type: Boolean,
    default: true
  },
  /**
   * Tooltip 出现位置的偏移量
   */
  offset: {
    type: Number,
    default: 12
  },
  /**
   * 是否显示下拉箭头
   */
  showArrow: {
    type: Boolean,
    default: true
  },
  /**
   * Tooltip 出现位置
   */
  placement: {
    type: String,
    default: "bottom-start"
  },
  /**
   * Tooltip 出现位置的备选数组
   */
  fallbackPlacements: {
    type: Array as PropType<string[]>,
    default: () => ["bottom-start", "bottom", "top-start", "top", "right", "left"]
  },
  /**
   * 多选时最多显示的标签数量
   */
  maxCollapseTags: {
    type: Number,
    default: 1
  },
  /**
   * select input 的 aria-label 属性
   */
  ariaLabel: {
    type: String,
    default: ""
  }
});

const emit = defineEmits([
  "update:modelValue",
  "change",
  "visible-change",
  "remove-tag",
  "clear",
  "blur",
  "focus"
]);

/**
 * 当前绑定值，支持 v-model
 */
const currentValue = computed<SelectValue>({
  get() {
    return props.modelValue;
  },
  set(value) {
    emit("update:modelValue", value);
  }
});

/**
 * 使用 PixelUI 条件导入
 * 自动管理 CSS 加载/卸载，并提供 PxSelect 组件条件导入
 */
const { currentComponent } = useThemeComponent("ElSelect");

/**
 * 当前实际渲染的组件
 * 像素主题下使用 PxSelect，否则使用 ElSelect
 */


/**
 * 选中值发生变化时触发
 */
const handleChange = (val: SelectValue) => {
  emit("change", val);
};

/**
 * 下拉框出现/隐藏时触发
 */
const handleVisibleChange = (visible: boolean) => {
  emit("visible-change", visible);
};

/**
 * 多选模式下移除tag时触发
 */
const handleRemoveTag = (tag: any) => {
  emit("remove-tag", tag);
};

/**
 * 可清空的单选模式下用户点击清空按钮时触发
 */
const handleClear = () => {
  emit("clear", undefined);
};

/**
 * 当 input 失去焦点时触发
 */
const handleBlur = (event: Event) => {
  emit("blur", event);
};

/**
 * 当 input 获得焦点时触发
 */
const handleFocus = (event: Event) => {
  emit("focus", event);
};
</script>

<style scoped>
/* 这里暂不做强样式覆盖，由外部主题控制 */
</style>
