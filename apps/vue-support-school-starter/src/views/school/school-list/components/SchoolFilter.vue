<template>
  <div class="school-filter">
    <!-- 筛选条件标题和清空按钮 -->
    <div class="filter-header">
      <div class="filter-header-title">院校筛选</div>
      <div class="filter-header-actions">
        <el-button type="primary" link @click="handleClearFilter">清空筛选</el-button>
      </div>
    </div>

    <!-- 院校类型筛选 -->
    <div class="filter-section">
      <div class="filter-row">
        <div class="filter-label">院校类型:</div>
        <div class="filter-options">
          <div v-for="option in schoolTypeOptions" :key="option.value" :class="['filter-option', { active: filterData.schoolType === option.value }]" @click="handleTypeChange(option.value)">
            {{ option.label }}
          </div>
        </div>
      </div>
    </div>

    <!-- 院校特征筛选 -->
    <div class="filter-section">
      <div class="filter-row">
        <div class="filter-label">院校特征:</div>
        <div class="filter-options">
          <div v-for="option in schoolFeatureOptions" :key="option.value" :class="['filter-option', { active: isFeatureActive(option.value) }]" @click="handleFeatureChange(option.value)">
            {{ option.label }}
          </div>
        </div>
      </div>
    </div>

    <!-- 办学层次筛选 -->
    <div class="filter-section">
      <div class="filter-row">
        <div class="filter-label">办学层次:</div>
        <div class="filter-options">
          <div v-for="option in schoolLevelOptions" :key="option.value" :class="['filter-option', { active: filterData.schoolLevel === option.value }]" @click="handleLevelChange(option.value)">
            {{ option.label }}
          </div>
        </div>
      </div>
    </div>

    <!-- 所在地区筛选 -->
    <div class="filter-section">
      <div class="filter-row">
        <div class="filter-label">所在地区:</div>
        <div class="filter-options region-options">
          <div v-for="province in allProvinces" :key="province.value" :class="['filter-option', { active: filterData.region[0] === province.value }]" @click="handleRegionChange(province.value)">
            {{ province.label }}
          </div>
        </div>
      </div>
    </div>

    <!-- 已选条件展示 -->
    <div class="selected-filters" v-if="hasActiveFilters">
      <div class="selected-filters-label">已选条件:</div>
      <div class="selected-filters-tags">
        <el-tag v-if="filterData.schoolType" closable @close="handleTypeChange(filterData.schoolType)">
          类型: {{ getOptionLabel(schoolTypeOptions, filterData.schoolType) }}
        </el-tag>
        <el-tag v-if="filterData.schoolLevel" closable @close="handleLevelChange(filterData.schoolLevel)">
          层次: {{ getOptionLabel(schoolLevelOptions, filterData.schoolLevel) }}
        </el-tag>
        <el-tag v-if="filterData.schoolIs985 === 1" closable @close="handleFeatureChange('985')">
          985院校
        </el-tag>
        <el-tag v-if="filterData.schoolIs211 === 1" closable @close="handleFeatureChange('211')">
          211院校
        </el-tag>
        <el-tag v-if="filterData.schoolIsDoubleFirst === 1" closable @close="handleFeatureChange('双一流')">
          双一流院校
        </el-tag>
        <el-tag v-if="filterData.region.length > 0" closable @close="handleRegionChange(filterData.region[0])">
          地区: {{ filterData.region[0] }}
        </el-tag>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, watch, computed } from "vue";
import type { SchoolInfoQuery } from "@/api";
import { schoolTypeOptions, schoolFeatureOptions, schoolLevelOptions } from "../data";

const props = defineProps<{
  modelValue: SchoolInfoQuery;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: SchoolInfoQuery): void;
  (e: "filter-change"): void;
}>();

// 筛选数据
const filterData = reactive({
  schoolType: props.modelValue.schoolType || "",
  schoolLevel: props.modelValue.schoolLevel || "",
  region: [] as string[],
  schoolIs985: props.modelValue.schoolIs985,
  schoolIs211: props.modelValue.schoolIs211,
  schoolIsDoubleFirst: props.modelValue.schoolIsDoubleFirst,
});

// 计算是否有激活的筛选条件
const hasActiveFilters = computed(() => {
  return (
    filterData.schoolType !== "" ||
    filterData.schoolLevel !== "" ||
    filterData.schoolIs985 === 1 ||
    filterData.schoolIs211 === 1 ||
    filterData.schoolIsDoubleFirst === 1 ||
    filterData.region.length > 0
  );
});

// 获取选项标签
const getOptionLabel = (options: { label: string; value: string }[], value: string) => {
  const option = options.find(opt => opt.value === value);
  return option ? option.label : value;
};

// 所有省份列表
const allProvinces = [
  { label: "北京", value: "北京" },
  { label: "天津", value: "天津" },
  { label: "河北", value: "河北" },
  { label: "山西", value: "山西" },
  { label: "内蒙古", value: "内蒙古" },
  { label: "辽宁", value: "辽宁" },
  { label: "吉林", value: "吉林" },
  { label: "黑龙江", value: "黑龙江" },
  { label: "上海", value: "上海" },
  { label: "江苏", value: "江苏" },
  { label: "浙江", value: "浙江" },
  { label: "安徽", value: "安徽" },
  { label: "福建", value: "福建" },
  { label: "江西", value: "江西" },
  { label: "山东", value: "山东" },
  { label: "河南", value: "河南" },
  { label: "湖北", value: "湖北" },
  { label: "湖南", value: "湖南" },
  { label: "广东", value: "广东" },
  { label: "广西", value: "广西" },
  { label: "海南", value: "海南" },
  { label: "重庆", value: "重庆" },
  { label: "四川", value: "四川" },
  { label: "贵州", value: "贵州" },
  { label: "云南", value: "云南" },
  { label: "西藏", value: "西藏" },
  { label: "陕西", value: "陕西" },
  { label: "甘肃", value: "甘肃" },
  { label: "青海", value: "青海" },
  { label: "宁夏", value: "宁夏" },
  { label: "新疆", value: "新疆" },
];

// 处理筛选变化
const handleFilterChange = () => {
  const queryParams: SchoolInfoQuery = {
    ...props.modelValue,
    schoolType: filterData.schoolType,
    schoolLevel: filterData.schoolLevel,
    schoolIs985: filterData.schoolIs985,
    schoolIs211: filterData.schoolIs211,
    schoolIsDoubleFirst: filterData.schoolIsDoubleFirst,
  };

  // 处理地区
  if (filterData.region.length > 0) {
    queryParams.schoolProvince = filterData.region[0];
    queryParams.schoolCity = filterData.region[1] || "";
    queryParams.schoolDistrict = filterData.region[2] || "";
  } else {
    queryParams.schoolProvince = "";
    queryParams.schoolCity = "";
    queryParams.schoolDistrict = "";
  }

  emit("update:modelValue", queryParams);
  emit("filter-change");
};

// 清空所有筛选条件
const handleClearFilter = () => {
  filterData.schoolType = "";
  filterData.schoolLevel = "";
  filterData.region = [];
  filterData.schoolIs985 = undefined;
  filterData.schoolIs211 = undefined;
  filterData.schoolIsDoubleFirst = undefined;
  handleFilterChange();
};

// 检查特征是否激活
const isFeatureActive = (value: string) => {
  switch (value) {
    case "985":
      return filterData.schoolIs985 === 1;
    case "211":
      return filterData.schoolIs211 === 1;
    case "双一流":
      return filterData.schoolIsDoubleFirst === 1;
    default:
      return false;
  }
};

// 处理类型变化
const handleTypeChange = (value: string) => {
  filterData.schoolType = filterData.schoolType === value ? "" : value;
  handleFilterChange();
};

// 处理特征变化
const handleFeatureChange = (value: string) => {
  switch (value) {
    case "985":
      filterData.schoolIs985 = filterData.schoolIs985 === 1 ? undefined : 1;
      break;
    case "211":
      filterData.schoolIs211 = filterData.schoolIs211 === 1 ? undefined : 1;
      break;
    case "双一流":
      filterData.schoolIsDoubleFirst = filterData.schoolIsDoubleFirst === 1 ? undefined : 1;
      break;
  }
  handleFilterChange();
};

// 处理地区变化
const handleRegionChange = (value: string) => {
  filterData.region = filterData.region[0] === value ? [] : [value];
  handleFilterChange();
};

// 处理层次变化
const handleLevelChange = (value: string) => {
  filterData.schoolLevel = filterData.schoolLevel === value ? "" : value;
  handleFilterChange();
};

// 监听外部数据变化
watch(
  () => props.modelValue,
  (newVal) => {
    filterData.schoolType = newVal.schoolType || "";
    filterData.schoolLevel = newVal.schoolLevel || "";
    filterData.schoolIs985 = newVal.schoolIs985;
    filterData.schoolIs211 = newVal.schoolIs211;
    filterData.schoolIsDoubleFirst = newVal.schoolIsDoubleFirst;

    // 更新地区
    if (newVal.schoolProvince) {
      filterData.region = [newVal.schoolProvince];
      if (newVal.schoolCity) {
        filterData.region.push(newVal.schoolCity);
        if (newVal.schoolDistrict) {
          filterData.region.push(newVal.schoolDistrict);
        }
      }
    } else {
      filterData.region = [];
    }
  },
  { deep: true }
);
</script>

<style scoped>
.school-filter {
  background-color: #fff;
  border-radius: 4px;
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  border: 1px solid #e6e6e6;
}

.filter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 15px;
  margin-bottom: 15px;
  border-bottom: 1px solid var(--el-border-color);
}

.filter-header-title {
  font-size: 16px;
  font-weight: bold;
  color: var(--el-text-color-primary);
}

.filter-section {
  padding: 8px 0;
  border-bottom: 1px dashed #f0f0f0;
}

.filter-section:last-child {
  border-bottom: none;
}

.filter-row {
  display: flex;
  align-items: flex-start;
}

.filter-label {
  width: 80px;
  font-size: 14px;
  color: var(--el-text-color-primary);
  line-height: 30px;
  flex-shrink: 0;
}

.filter-options {
  flex: 1;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.region-options {
  max-height: 120px;
  overflow-y: auto;
  padding-right: 5px;
}

.filter-option {
  padding: 4px 12px;
  border: 1px solid #e6e6e6;
  border-radius: 4px;
  font-size: 13px;
  color: var(--el-text-color-primary);
  cursor: pointer;
  transition: all 0.2s;
  background-color: #f9f9f9;
}

.filter-option:hover {
  color: #ff6600;
  border-color: #ffcca6;
  background-color: #fff4eb;
}

.filter-option.active {
  color: #ff6600;
  border-color: #ff6600;
  background-color: #fff4eb;
}

.selected-filters {
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid #f0f0f0;
  display: flex;
  align-items: flex-start;
}

.selected-filters-label {
  width: 80px;
  font-size: 14px;
  color: var(--el-text-color-primary);
  line-height: 30px;
  flex-shrink: 0;
}

.selected-filters-tags {
  flex: 1;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

:deep(.el-tag) {
  margin-right: 8px;
  margin-bottom: 8px;
  background-color: #fff4eb;
  border-color: #ffcca6;
  color: #ff6600;
}

:deep(.el-tag .el-tag__close) {
  color: #ff6600;
  background-color: transparent;
}

:deep(.el-tag .el-tag__close:hover) {
  background-color: #ff6600;
  color: #fff;
}

:deep(.el-select) {
  width: 240px;
}
</style>
