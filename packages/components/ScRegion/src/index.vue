<template>
  <el-cascader
    v-model="selectedValue"
    :options="filteredRegionData"
    :props="cascaderProps"
    :placeholder="placeholder"
    :disabled="disabled"
    :clearable="clearable"
    :filterable="filterable"
    :size="size"
    :show-all-levels="showAllLevels"
    :separator="separator"
    @change="handleChange"
  />
</template>

<script lang="ts" setup>
import { ref, computed, watch, onMounted } from 'vue';
import type { RegionData, RegionProps, RegionEmits } from './types';
import { regionData as defaultRegionData } from './data';

const props = withDefaults(defineProps<RegionProps>(), {
  modelValue: () => [],
  placeholder: '请选择地区',
  disabled: false,
  clearable: true,
  filterable: false,
  size: 'default',
  showAllLevels: true,
  separator: '/',
  data: () => defaultRegionData,
  provinceCode: '',
  defaultProvince: ''
});

const emit = defineEmits<RegionEmits>();

const selectedValue = ref<string[]>(props.modelValue);

// 根据省份代码过滤数据
const filteredRegionData = computed(() => {
  if (!props.provinceCode) {
    return props.data;
  }
  return props.data.filter(item => item.code === props.provinceCode);
});

const cascaderProps = {
  value: 'code',
  label: 'name',
  children: 'children',
  checkStrictly: false,
  emitPath: true
};

watch(
  () => props.modelValue,
  (newVal) => {
    selectedValue.value = newVal;
  }
);

watch(
  () => props.data,
  (newVal) => {
    // 当数据源变化时，重新设置选中值
    if (selectedValue.value.length > 0) {
      const newSelectedValue = findPathByCode(newVal, selectedValue.value[selectedValue.value.length - 1]);
      if (newSelectedValue) {
        selectedValue.value = newSelectedValue;
      }
    }
  }
);

const handleChange = (value: string[]) => {
  emit('update:modelValue', value);
  emit('change', value);
};

// 设置默认省份
const setDefaultProvince = () => {
  if (props.defaultProvince && !selectedValue.value.length) {
    const province = props.data.find(item => item.code === props.defaultProvince);
    if (province) {
      selectedValue.value = [province.code];
      emit('update:modelValue', selectedValue.value);
    }
  }
};

// 监听省份代码变化
watch(
  () => props.provinceCode,
  (newVal) => {
    // 当省份代码变化时，如果当前选中值不在该省份下，则清空选中值
    if (newVal && selectedValue.value.length > 0) {
      const firstSelected = selectedValue.value[0];
      if (firstSelected !== newVal) {
        selectedValue.value = [];
        emit('update:modelValue', []);
      }
    }
  }
);

// 组件挂载时设置默认省份
onMounted(() => {
  setDefaultProvince();
});

// 根据编码查找完整路径
const findPathByCode = (data: RegionData[], targetCode: string): string[] | null => {
  const find = (items: RegionData[], code: string, path: string[] = []): string[] | null => {
    for (const item of items) {
      if (item.code === code) {
        return [...path, item.code];
      }
      if (item.children) {
        const result = find(item.children, code, [...path, item.code]);
        if (result) {
          return result;
        }
      }
    }
    return null;
  };
  return find(data, targetCode);
};
</script>

<style scoped>
.el-cascader {
  width: 100%;
}
</style> 