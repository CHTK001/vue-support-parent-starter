<template>
  <div class="w-full p-3 flex justify-end items-center">
    <el-form :model="form" inline ref="formRef" >
      <el-form-item v-for="item in props.columns" :prop="item.prop" :label="item.label" :key="item.prop">
        <template v-if="item.type == 'select'">
          <el-select clearable v-model="form[item.prop]" :placeholder="item.placeholder" :class="'!w-['+ (item.width || 100)+'px]'">
            <template v-if="Array.isArray(item.options)">
              <el-option v-for="option in item.options" :key="option.value" :label="option.label" :value="option.value"></el-option>
            </template>
            <template v-else>
              <el-option v-for="(key, value) in item.options" :key="key" :label="key" :value="value"></el-option>
            </template>
          </el-select>
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

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => {},
  },
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