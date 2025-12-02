<template>
  <div class="flex !justify-end p-3 !items-center relative sc-query" :class="[visiableConfig.isShowMore ? 'show-box' : '']">
    <div class="w-full flex justify-end items-center absolute top-0 right-0" :class="[visiableConfig.isShowMore ? 'show-box-item' : '']">
      <el-form :model="form" inline ref="formRef">
        <template v-for="(item, index) in props.columns" :key="item.prop">
          <el-form-item :prop="item.prop" :label="item.label" v-if="showQuery(index)">
            <div v-if="item.type == 'select'">
              <el-select clearable v-model="form[item.prop]" :placeholder="item.placeholder" :class="handleRenderWidth(item.width)" :multiple="item.multiple">
                <template v-if="Array.isArray(item.selectOption)">
                  <el-option
                    v-for="option in item.selectOption"
                    :key="option.value"
                    :label="option.label || option[option.selectLabel]"
                    :value="option.value || option[option.selectValue]"
                  ></el-option>
                </template>
                <template v-else>
                  <el-option v-for="(key, value) in item.selectOption" :key="key" :label="key" :value="value"></el-option>
                </template>
              </el-select>
            </div>

            <div v-else-if="item.type == 'datePicker'">
              <el-date-picker
                :start-placeholder="handleRenderStartPlaceholder(item.timeOption)"
                :end-placeholder="handleRenderEndPlaceholder(item.timeOption)"
                :editable="item.editable"
                :class="handleRenderWidth(item.width)"
                @change="
                  value => {
                    handleChangeValue(item, value);
                  }
                "
                type="daterange"
                clearable
                :placeholder="item.placeholder"
                v-model="form[item.prop]"
                :format="item.format"
              ></el-date-picker>
            </div>

            <div v-else-if="item.type == 'dateMonthPicker'">
              <el-date-picker
                :start-placeholder="handleRenderStartPlaceholder(item.timeOption)"
                :end-placeholder="handleRenderEndPlaceholder(item.timeOption)"
                :editable="item.editable"
                :class="handleRenderWidth(item.width)"
                @change="
                  value => {
                    handleChangeValue(item, value);
                  }
                "
                type="daterange"
                clearable
                :placeholder="item.placeholder"
                v-model="form[item.prop]"
                format="YYYY-MM"
              ></el-date-picker>
            </div>

            <div v-else-if="item.type == 'dateDayPicker'">
              <el-date-picker
                :start-placeholder="handleRenderStartPlaceholder(item.timeOption)"
                :end-placeholder="item.endPlaceholder || '请选择结束时间'"
                :editable="item.editable"
                :class="handleRenderWidth(item.width)"
                @change="
                  value => {
                    handleChangeValue(item, value);
                  }
                "
                type="daterange"
                clearable
                :placeholder="item.placeholder"
                v-model="form[item.prop]"
                format="YYYY-MM-DD"
              ></el-date-picker>
            </div>

            <div v-else-if="item.type == 'dateTimePicker'">
              <el-datetime-picker
                :start-placeholder="handleRenderStartPlaceholder(item.timeOption)"
                :end-placeholder="item.endPlaceholder || '请选择结束时间'"
                :editable="item.editable"
                :class="handleRenderWidth(item.width)"
                @change="
                  value => {
                    handleChangeValue(item, value);
                  }
                "
                type="datetimerange"
                clearable
                :placeholder="item.placeholder"
                v-model="form[item.prop]"
                :format="item.format"
              ></el-datetime-picker>
            </div>

            <div v-else-if="item.type == 'email'">
              <el-autocomplete
                v-model="form[item.prop]"
                :fetch-suggestions="queryEmail"
                :trigger-on-focus="false"
                :placeholder="item.placeholder || '请输入邮箱'"
                clearable
                :class="handleRenderWidth(item.width)"
              />
            </div>

            <div v-else-if="item.type == 'amount'">
              <TInput
                :formatter="value => `￥${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')"
                :parser="value => value.replace(/\￥\s?|(,*)/g, '')"
                inputType="amount"
                isTip
                v-model="form[item.prop]"
                :placeholder="item.placeholder"
                :class="handleRenderWidth(item.width)"
              />
            </div>

            <div v-else-if="showQuery(index)">
              <t-input :maxlength="item.maxlength || 20" clearable v-model="form[item.prop]" :placeholder="item.placeholder" :class="handleRenderWidth(item.width)" :show-word-limit="true"></t-input>
            </div>
          </el-form-item>
        </template>
      </el-form>
      <div class="h-full sq-button" :class="[props.columns.length > props.showNumber ? 'min-sq-button' : '']">
        <div class="relative">
          <el-button class="btn-text" type="primary" :icon="useRenderIcon('ri:search-2-line')" @click="handleRefresh" />
          <el-button class="btn-text" v-if="props.showReset" type="default" :icon="useRenderIcon('ri:reset-left-fill')" @click="handleReset" />
          <slot name="button"></slot>
          <template v-if="props.columns.length > props.showNumber">
            <el-button v-if="!visiableConfig.isShowMore" text @click="handleShowMoreButton" :icon="useRenderIcon('ri:arrow-down-s-line')">更多</el-button>
            <el-button v-else text @click="handleShowMoreButton" :icon="useRenderIcon('ri:arrow-up-s-line')">收起</el-button>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import "@wocwin/t-ui-plus/lib/style.css";
import { TInput } from "@wocwin/t-ui-plus";
import { queryEmail } from "@repo/utils";
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import { reactive, ref, watch, computed } from "vue";

const emit = defineEmits([]);
const form = reactive({});
const formRef = ref();
const visiableConfig = reactive({
  isShowMore: false
});
const handleShowMoreButton = () => {
  visiableConfig.isShowMore = !visiableConfig.isShowMore;
};

/**
 * 是否显示
 * @param {number} index
 * @returns
 */
const showQuery = index => {
  return visiableConfig.isShowMore || (!visiableConfig.isShowMore && index < props.showNumber);
};

const handleRenderWidth = width => {
  if (!width) {
    width = "auto";
  }
  if (typeof width === "number") {
    return `!w-[${width}px]`;
  }

  if (width === "auto") {
    return "w-full";
  }
  return width;
};

const handleRenderEndPlaceholder = timeOption => {
  if (!timeOption) {
    return "请选择结束时间";
  }
  return timeOption.endPlaceholder || "请选择结束时间";
};

const handleRenderStartPlaceholder = timeOption => {
  if (!timeOption) {
    return "请选择开始时间";
  }
  return timeOption.startPlaceholder || "请选择开始时间";
};

const rules = computed(() => {
  return props.columns.reduce((prev, curr) => {
    if (curr.rule) {
      prev[curr.prop] = [{ required: true, message: curr.rule.message, trigger: curr.rule.trigger || "blur" }];
    }
  });
});

const handleChangeValue = (item, value) => {
  if (item.timeOption && item.timeOption.rangeValue) {
    for (let index = 0, max = value.length; index < max; index++) {
      try {
        form[item.timeOption.rangeValue[index]] = value[index];
      } catch (error) {}
    }

    return;
  }
};
const props = defineProps({
  showNumber: {
    type: Number,
    default: 4
  },
  modelValue: {
    type: Object,
    default: () => {}
  },
  /**
   * prop: 字段
   * label: 标签
   * type: 类型; select: 下拉框； input: 输入框, datePicker: 日期, dateDayPicker: 日期, dateMonthPicker: 月份, dateTimePicker: 时间, email: 邮箱, amount: 金额
   * width: 宽度
   * format: 日期格式
   * placeholder: 提示
   * timeOption:
   *    rangeValue: ['startTime', 'endTime']
   *    startPlaceholder: 开始日期提示
   *    endPlaceholder: 结束日期提示
   * rule: 校验规则
   *   message: 提示信息
   *   trigger: 触发方式
   * selectOption: 选项
   *   selectValue: 选项value字段默认value
   *   selectLabel: 选项label字段默认label
   *   value: 选项value
   *   label: 选项label
   * multiple: 是否多选
   */
  columns: {
    type: Array,
    default: () => []
  },
  showReset: {
    type: Boolean,
    default: true
  }
});

const handleReset = async () => {
  formRef.value.resetFields();
};

const handleRefresh = async () => {
  emit("onSearch", form);
};
</script>
<style scoped lang="scss">
.min-sq-button {
  min-width: 220px;
}
.sq-button {
  top: -10px;
  position: relative;
}
.show-box {
  .show-box-item {
    box-shadow: var(--el-box-shadow-light);
    border-radius: 0.5em;
  }
}
.sc-query > div {
  padding: 20px;
}
.sc-query,
.sc-query > div {
  min-height: 54px;
  background-color: var(--el-bg-color);
  z-index: 100;
}
</style>
