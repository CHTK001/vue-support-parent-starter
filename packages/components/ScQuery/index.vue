<template>
  <div class="w-full p-3 flex justify-end items-center">
    <el-form :model="form" inline ref="formRef" >
      <el-form-item v-for="item in props.columns" :prop="item.prop" :label="item.label" :key="item.prop">
        <template v-if="item.type == 'select'">
          <el-select clearable v-model="form[item.prop]" :placeholder="item.placeholder" :class="'!w-['+ (item.width || 100)+'px]'" :multiple="item.multiple">
            <template v-if="Array.isArray(item.options)">
              <el-option v-for="option in item.options" :key="option.value" 
                  :label="option.label || option[option.selectLabel]" :value="option.value || option[option.selectValue]"></el-option>
            </template>
            <template v-else>
              <el-option v-for="(key, value) in item.options" :key="key" :label="key" :value="value"></el-option>
            </template>
          </el-select>
        </template>

        <template v-else-if="item.type == 'datePicker'">
          <el-date-picker @change="handleChangeValue" type="date" clearable :placeholder="item.placeholder" v-model="form[item.prop]" :format="item.format"></el-date-picker>
        </template>

        <template v-else-if="item.type == 'dateTimePicker'">
          <el-datetime-picker @change="handleChangeValue" type="datetime" clearable :placeholder="item.placeholder" v-model="form[item.prop]" :format="item.format"></el-datetime-picker>
        </template>

        <template v-else>
          <el-input clearable v-model="form[item.prop]" :placeholder="item.placeholder">
          </el-input>
        </template>
      </el-form-item>

       <el-form-item>
          <el-button class="btn-text" type="primary" :icon="useRenderIcon('ri:search-2-line')" @click="handleRefresh" />
          <el-button class="btn-text" v-if="props.showReset" type="default" :icon="useRenderIcon('ri:reset-left-fill')" @click="handleReset" />
          <slot name="button"></slot>
        </el-form-item>
    </el-form>
  </div>
</template>

<script setup>
import '@wocwin/t-ui-plus/lib/style.css'
import {TDetail, TForm} from "@wocwin/t-ui-plus"
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import { reactive, defineProps, defineEmits, ref, watch, computed } from 'vue';

const emit = defineEmits([]);
const form = reactive({});
const formRef = ref();
const rules = computed(() => {
  return props.columns.reduce((prev, curr) => {
    if (curr.rule) {
      prev[curr.prop] = [
        { required: true, message: curr.rule.message, trigger: curr.rule.trigger || "blur" },
      ];
    }
  })
});

const handleChangeValue = (value) => {
  debugger
}
const props = defineProps({
  modelValue: {
    type: Object,
    default: () => {},
  },
  /**
   * prop: 字段
   * label: 标签
   * type: 类型; select: 下拉框； input: 输入框, datePicker: 日期
   * width: 宽度
   * format: 日期格式
   * placeholder: 提示
   * rule: 校验规则
   *   message: 提示信息
   *   trigger: 触发方式
   * options: 选项
   *   selectValue: 选项value字段默认value
   *   selectLabel: 选项label字段默认label
   *   value: 选项value
   *   label: 选项label
   * multiple: 是否多选
   */
  columns: {
    type: Array,
    default: () => [],
  },
  showReset: {
    type: Boolean,
    default: true,
  },
});

const handleReset = async () => {
  formRef.value.resetFields();
}

const handleRefresh = async () => {
  emit("onSearch", form)
}
</script>