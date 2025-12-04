<template>
  <div class="sc-region" :class="{ 'sc-region--disabled': disabled }">
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
      :popper-class="'sc-region-popper'"
      @change="handleChange"
    >
      <template #default="{ node, data }">
        <div class="sc-region-node">
          <IconifyIconOnline v-if="data.level === 1" icon="ri:map-pin-2-line" class="node-icon province" />
          <IconifyIconOnline v-else-if="data.level === 2" icon="ri:building-line" class="node-icon city" />
          <IconifyIconOnline v-else icon="ri:home-4-line" class="node-icon district" />
          <span class="node-label">{{ data.name }}</span>
          <span v-if="data.licensePlate" class="node-badge">{{ data.licensePlate }}</span>
        </div>
      </template>
    </el-cascader>
  </div>
</template>

<script lang="ts" setup>
/**
 * ScRegion 地区选择器组件
 * 省市区三级联动选择器
 * @author CH
 * @version 1.0.0
 * @since 2025-12-04
 */
import { ref, computed, watch, onMounted } from "vue";
import { IconifyIconOnline } from "@repo/components/ReIcon";
import type { RegionData, RegionProps, RegionEmits } from "./types";
import { regionData as defaultRegionData } from "./data";

const props = withDefaults(defineProps<RegionProps>(), {
  modelValue: () => [],
  placeholder: "请选择地区",
  disabled: false,
  clearable: true,
  filterable: false,
  size: "default",
  showAllLevels: true,
  separator: "/",
  data: () => defaultRegionData,
  provinceCode: "",
  defaultProvince: ""
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
  value: "code",
  label: "name",
  children: "children",
  checkStrictly: false,
  emitPath: true
};

watch(
  () => props.modelValue,
  newVal => {
    selectedValue.value = newVal;
  }
);

watch(
  () => props.data,
  newVal => {
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
  emit("update:modelValue", value);
  emit("change", value);
};

// 设置默认省份
const setDefaultProvince = () => {
  if (props.defaultProvince && !selectedValue.value.length) {
    const province = props.data.find(item => item.code === props.defaultProvince);
    if (province) {
      selectedValue.value = [province.code];
      emit("update:modelValue", selectedValue.value);
    }
  }
};

// 监听省份代码变化
watch(
  () => props.provinceCode,
  newVal => {
    // 当省份代码变化时，如果当前选中值不在该省份下，则清空选中值
    if (newVal && selectedValue.value.length > 0) {
      const firstSelected = selectedValue.value[0];
      if (firstSelected !== newVal) {
        selectedValue.value = [];
        emit("update:modelValue", []);
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

<style lang="scss" scoped>
.sc-region {
  width: 100%;

  &--disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  :deep(.el-cascader) {
    width: 100%;

    .el-input__wrapper {
      border-radius: 10px;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);

      &:hover {
        box-shadow: 0 2px 8px rgba(var(--el-color-primary-rgb), 0.12);
      }

      &.is-focus {
        box-shadow: 0 0 0 2px rgba(var(--el-color-primary-rgb), 0.15);
      }
    }

    .el-cascader__tags {
      .el-tag {
        border-radius: 6px;
        background: linear-gradient(135deg, var(--el-color-primary-light-9) 0%, var(--el-color-primary-light-8) 100%);
        border-color: var(--el-color-primary-light-7);
        color: var(--el-color-primary);
      }
    }
  }
}

.sc-region-node {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 2px 0;

  .node-icon {
    font-size: 16px;
    flex-shrink: 0;
    transition: all 0.2s ease;

    &.province {
      color: var(--el-color-danger);
    }

    &.city {
      color: var(--el-color-warning);
    }

    &.district {
      color: var(--el-color-primary);
    }
  }

  .node-label {
    flex: 1;
    font-size: 14px;
    color: var(--el-text-color-primary);
  }

  .node-badge {
    font-size: 11px;
    padding: 2px 6px;
    border-radius: 4px;
    background: linear-gradient(135deg, var(--el-color-primary-light-8) 0%, var(--el-color-primary-light-9) 100%);
    color: var(--el-color-primary);
    font-weight: 600;
  }
}
</style>

<style lang="scss">
// 全局样式 - 下拉框
.sc-region-popper {
  border-radius: 12px !important;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12) !important;
  border: 1px solid var(--el-border-color-lighter) !important;
  overflow: hidden;

  .el-cascader-panel {
    border-radius: 12px;

    .el-cascader-menu {
      border-color: var(--el-border-color-extra-light);

      &__wrap {
        padding: 6px;
      }

      .el-cascader-node {
        padding: 0 12px;
        height: 40px;
        border-radius: 8px;
        margin: 2px 0;
        transition: all 0.2s ease;

        &:hover {
          background: linear-gradient(135deg, var(--el-fill-color-light) 0%, var(--el-fill-color-lighter) 100%);
        }

        &.is-active,
        &.in-active-path {
          background: linear-gradient(135deg, rgba(var(--el-color-primary-rgb), 0.1) 0%, rgba(var(--el-color-primary-rgb), 0.05) 100%);
          color: var(--el-color-primary);
          font-weight: 500;

          .sc-region-node .node-icon {
            transform: scale(1.1);
          }
        }

        .el-icon {
          color: var(--el-text-color-secondary);
        }
      }
    }
  }

  .el-cascader__suggestion-panel {
    border-radius: 10px;
    margin-top: 4px;

    .el-cascader__suggestion-item {
      padding: 10px 14px;
      border-radius: 6px;
      margin: 2px 4px;

      &:hover {
        background: var(--el-fill-color-light);
      }
    }
  }
}

// 暗色模式适配
html.dark {
  .sc-region-popper {
    background: var(--el-bg-color-overlay);
    border-color: var(--el-border-color);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3) !important;

    .el-cascader-node {
      &:hover {
        background: var(--el-fill-color-dark);
      }
    }
  }
}
</style>
