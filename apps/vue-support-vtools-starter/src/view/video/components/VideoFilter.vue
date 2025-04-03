<template>
  <div class="video-filter">
    <div class="video-filter__container">
      <!-- 类型筛选 -->
      <div class="video-filter__row">
        <div class="video-filter__label">
          <el-icon><Film /></el-icon>
          类型:
        </div>
        <div class="video-filter__options-wrapper">
          <div class="video-filter__options">
            <div v-for="type in displayedTypes" :key="type.value" :class="['video-filter__option', { 'video-filter__option--active': isTypeSelected(type.value) }]" @click="handleTypeClick(type)">
              {{ type.label }}
            </div>
          </div>
          <div v-if="showMoreTypes" class="video-filter__more-btn" @click="toggleMoreTypes">
            {{ showAllTypes ? "收起" : "更多" }}
            <el-icon>
              <component :is="showAllTypes ? 'ArrowUp' : 'ArrowDown'" />
            </el-icon>
          </div>
        </div>
      </div>

      <!-- 年代筛选 -->
      <div class="video-filter__row">
        <div class="video-filter__label">
          <el-icon><Calendar /></el-icon>
          年代:
        </div>
        <div class="video-filter__options-wrapper">
          <div class="video-filter__options">
            <div v-for="year in displayedYears" :key="year.value" :class="['video-filter__option', { 'video-filter__option--active': isYearSelected(year.value) }]" @click="handleYearClick(year)">
              {{ year.label }}
            </div>
          </div>
          <div v-if="showMoreYears" class="video-filter__more-btn" @click="toggleMoreYears">
            {{ showAllYears ? "收起" : "更多" }}
            <el-icon>
              <component :is="showAllYears ? 'ArrowUp' : 'ArrowDown'" />
            </el-icon>
          </div>
        </div>
      </div>

      <!-- 地区筛选 -->
      <div class="video-filter__row">
        <div class="video-filter__label">
          <el-icon><Location /></el-icon>
          地区:
        </div>
        <div class="video-filter__options-wrapper">
          <div class="video-filter__options">
            <div v-for="district in displayedDistricts" :key="district.value" :class="['video-filter__option', { 'video-filter__option--active': isDistrictSelected(district.value) }]" @click="handleDistrictClick(district)">
              {{ district.label }}
            </div>
          </div>
          <div v-if="showMoreDistricts" class="video-filter__more-btn" @click="toggleMoreDistricts">
            {{ showAllDistricts ? "收起" : "更多" }}
            <el-icon>
              <component :is="showAllDistricts ? 'ArrowUp' : 'ArrowDown'" />
            </el-icon>
          </div>
        </div>
      </div>

      <!-- 语言筛选 -->
      <div class="video-filter__row">
        <div class="video-filter__label">
          <el-icon><ChatDotRound /></el-icon>
          语言:
        </div>
        <div class="video-filter__options-wrapper">
          <div class="video-filter__options">
            <div v-for="language in displayedLanguages" :key="language.value" :class="['video-filter__option', { 'video-filter__option--active': isLanguageSelected(language.value) }]" @click="handleLanguageClick(language)">
              {{ language.label }}
            </div>
          </div>
          <div v-if="showMoreLanguages" class="video-filter__more-btn" @click="toggleMoreLanguages">
            {{ showAllLanguages ? "收起" : "更多" }}
            <el-icon>
              <component :is="showAllLanguages ? 'ArrowUp' : 'ArrowDown'" />
            </el-icon>
          </div>
        </div>
      </div>

      <!-- 确认按钮（autoSearch为false时显示） -->
      <div v-if="!autoSearch" class="video-filter__confirm-row">
        <el-button type="primary" @click="handleConfirmSearch">搜索</el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { generateYearOptions, movieTypes } from "@/view/video/data/categories";
import { districtOptions, languageOptions } from "@/view/video/data/videoOptions";
import { computed, ref, watch } from "vue";

// 定义组件属性
const props = defineProps<{
  modelValue?: {
    types: string[];
    years: string[];
    districts: string[];
    languages: string[];
  };
  autoSearch?: boolean;
}>();

// 定义组件事件
const emit = defineEmits<{
  (e: "update:modelValue", value: any): void;
  (e: "filter-change"): void;
  (e: "search"): void;
}>();

// 筛选数据
const types = ref(movieTypes);
const years = ref(generateYearOptions());
const districts = ref([{ label: "全部", value: "全部" }, ...districtOptions]);
const languages = ref([{ label: "全部", value: "全部" }, ...languageOptions]);

// 已选择的筛选条件
const selectedTypes = ref<string[]>(props.modelValue?.types || ["全部"]);
const selectedYears = ref<string[]>(props.modelValue?.years || ["全部"]);
const selectedDistricts = ref<string[]>(props.modelValue?.districts || ["全部"]);
const selectedLanguages = ref<string[]>(props.modelValue?.languages || ["全部"]);

// 筛选条件显示控制
const showAllTypes = ref(false);
const showAllYears = ref(false);
const showAllDistricts = ref(false);
const showAllLanguages = ref(false);

// 筛选条件显示数量
const MAX_DISPLAY_COUNT = 12;

// 判断是否选中的助手函数
const isTypeSelected = (value: string) => selectedTypes.value.includes(value);
const isYearSelected = (value: string) => selectedYears.value.includes(value);
const isDistrictSelected = (value: string) => selectedDistricts.value.includes(value);
const isLanguageSelected = (value: string) => selectedLanguages.value.includes(value);

// 计算是否显示更多按钮
const showMoreTypes = computed(() => types.value.length > MAX_DISPLAY_COUNT);
const showMoreYears = computed(() => years.value.length > MAX_DISPLAY_COUNT);
const showMoreDistricts = computed(() => districts.value.length > MAX_DISPLAY_COUNT);
const showMoreLanguages = computed(() => languages.value.length > MAX_DISPLAY_COUNT);

// 计算显示的筛选条件
const displayedTypes = computed(() => {
  return showAllTypes.value ? types.value : types.value.slice(0, MAX_DISPLAY_COUNT);
});

const displayedYears = computed(() => {
  return showAllYears.value ? years.value : years.value.slice(0, MAX_DISPLAY_COUNT);
});

const displayedDistricts = computed(() => {
  return showAllDistricts.value ? districts.value : districts.value.slice(0, MAX_DISPLAY_COUNT);
});

const displayedLanguages = computed(() => {
  return showAllLanguages.value ? languages.value : languages.value.slice(0, MAX_DISPLAY_COUNT);
});

/**
 * 切换显示更多类型
 */
const toggleMoreTypes = () => {
  showAllTypes.value = !showAllTypes.value;
};

/**
 * 切换显示更多年代
 */
const toggleMoreYears = () => {
  showAllYears.value = !showAllYears.value;
};

/**
 * 切换显示更多地区
 */
const toggleMoreDistricts = () => {
  showAllDistricts.value = !showAllDistricts.value;
};

/**
 * 切换显示更多语言
 */
const toggleMoreLanguages = () => {
  showAllLanguages.value = !showAllLanguages.value;
};

/**
 * 处理多选通用方法
 * @param item 选项对象
 * @param selectedItems 已选项数组
 * @param allValue 全部选项的值
 */
const handleMultiSelect = (item, selectedItems, allValue = "全部") => {
  if (item.value === allValue) {
    // 点击"全部"，清除其他选择
    selectedItems.value = [allValue];
  } else {
    // 移除全部选项
    const allIndex = selectedItems.value.indexOf(allValue);
    if (allIndex !== -1) {
      selectedItems.value.splice(allIndex, 1);
    }

    // 切换选中状态
    const index = selectedItems.value.indexOf(item.value);
    if (index === -1) {
      selectedItems.value.push(item.value);
    } else {
      selectedItems.value.splice(index, 1);
      // 如果没有选中任何项，则默认选中全部
      if (selectedItems.value.length === 0) {
        selectedItems.value = [allValue];
      }
    }
  }

  updateModelValue();

  // 仅在autoSearch为true时触发筛选变更事件
  if (props.autoSearch) {
    emit("filter-change");
  }
};

/**
 * 处理类型点击（多选）
 */
const handleTypeClick = (type) => {
  handleMultiSelect(type, selectedTypes);
};

/**
 * 处理年代点击（多选）
 */
const handleYearClick = (year) => {
  handleMultiSelect(year, selectedYears);
};

/**
 * 处理地区点击（多选）
 */
const handleDistrictClick = (district) => {
  handleMultiSelect(district, selectedDistricts);
};

/**
 * 处理语言点击（多选）
 */
const handleLanguageClick = (language) => {
  handleMultiSelect(language, selectedLanguages);
};

/**
 * 更新组件值
 */
const updateModelValue = () => {
  emit("update:modelValue", {
    types: selectedTypes.value,
    years: selectedYears.value,
    districts: selectedDistricts.value,
    languages: selectedLanguages.value,
  });
};

/**
 * 确认搜索按钮点击处理（当autoSearch为false时使用）
 */
const handleConfirmSearch = () => {
  emit("filter-change");
  emit("search");
};

// 监听props变化，更新内部状态
watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue) {
      selectedTypes.value = newValue.types || ["all"];
      selectedYears.value = newValue.years || ["all"];
      selectedDistricts.value = newValue.districts || ["all"];
      selectedLanguages.value = newValue.languages || ["all"];
    }
  },
  { deep: true }
);
</script>

<style lang="scss" scoped>
.video-filter {
  .video-filter__confirm-row {
    display: flex;
    justify-content: flex-end;
  }
  &__container {
    background-color: white;
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 20px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
  }

  &__row {
    display: flex;
    margin-bottom: 16px;

    &:last-child {
      margin-bottom: 0;
    }
  }

  &__label {
    display: flex;
    align-items: center;
    width: 80px;
    font-size: 15px;
    font-weight: 600;
    color: var(--el-text-color-primary);

    .el-icon {
      margin-right: 6px;
      color: var(--el-color-primary);
    }
  }

  &__options-wrapper {
    display: flex;
    flex: 1;
    align-items: center;
    justify-content: space-between;
  }

  &__options {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    flex: 1;
  }

  &__option {
    padding: 6px 14px;
    font-size: 14px;
    border-radius: 30px;
    cursor: pointer;
    transition: all 0.3s;
    background-color: var(--el-fill-color-light);

    &:hover {
      color: var(--el-color-primary);
      background-color: var(--el-color-primary-light-9);
    }

    &--active {
      background-color: var(--el-color-primary);
      color: white;
      font-weight: 500;
      box-shadow: 0 3px 8px rgba(var(--el-color-primary-rgb), 0.25);
    }
  }

  &__more-btn {
    color: var(--el-color-primary);
    display: flex;
    align-items: center;
    padding: 0 10px;
    cursor: pointer;
    white-space: nowrap;
    margin-left: 10px;
    min-width: 60px;
    font-size: 14px;

    .el-icon {
      margin-left: 5px;
    }

    &:hover {
      text-decoration: underline;
    }
  }

  &__confirm-row {
    display: flex;
    justify-content: center;
    margin-top: 20px;
  }
}

@media (max-width: 768px) {
  .video-filter {
    &__row {
      flex-direction: column;
    }

    &__label {
      width: 100%;
      margin-bottom: 8px;
    }

    &__options-wrapper {
      width: 100%;
    }
  }
}
</style>
