<template>
  <el-popover placement="bottom-start" v-model:visible="visible" :disabled="disabled" :width="widthPopover" trigger="click">
    <template #reference>
      <el-input
        :style="{ width: width ? width + 'px' : '100%' }"
        v-model="inputValue"
        placeholder="请选择图标"
        :disabled="disabled"
        :autofocus="false"
        clearable
      >
        <template #append>
          <KoiGlobalIcon :name="modelValue" v-if="modelValue" />
          <span v-else></span>
        </template>
      </el-input>
    </template>
    <template #default>
      <div class="koi-select-icon-panel">
        <el-input
          v-model="searchText"
          placeholder="搜索图标名称"
          clearable
          class="koi-select-icon-search"
        >
          <template #prefix>
            <el-icon class="el-input__icon"><Search /></el-icon>
          </template>
        </el-input>
        <el-tabs v-model="activeTab" class="koi-select-icon-tabs">
          <el-tab-pane label="本地图标" name="local" />
          <el-tab-pane label="ele图标" name="ele" />
        </el-tabs>
        <el-scrollbar max-height="260px">
          <div v-if="paginatedIcons.length" class="flex flex-wrap koi-select-icon-grid">
            <div v-for="iconItem in paginatedIcons" :key="activeTab + iconItem" class="m-1">
              <el-button @click="handleIconSelect(iconItem)">
                <KoiGlobalIcon :name="iconItem" size="18" />
              </el-button>
            </div>
          </div>
          <el-empty v-else description="无匹配图标" :image-size="64" />
        </el-scrollbar>
        <el-pagination
          v-if="filteredTotal > 0"
          class="koi-select-icon-pagination"
          layout="total, prev, pager, next"
          :total="filteredTotal"
          :page-size="pageSize"
          :current-page="currentPage"
          size="small"
          background
          @current-change="currentPage = $event"
        />
      </div>
    </template>
  </el-popover>
</template>

<script lang="ts" setup>
import { ref, computed, watch } from "vue";
import { Search } from "@element-plus/icons-vue";
import * as ElementPlusIconsVue from "@element-plus/icons-vue";

interface ISelectIconProps {
  modelValue?: string;
  width?: string;
  widthPopover?: string;
  disabled?: boolean;
  /** 每页图标数量 */
  pageSize?: number;
}
const props = withDefaults(defineProps<ISelectIconProps>(), {
  widthPopover: "420",
  modelValue: "",
  disabled: false,
  pageSize: 48
});

const ELE_ICON_NAMES = Object.keys(ElementPlusIconsVue).sort();

const LOCAL_ICON_NAMES = (() => {
  const modules = import.meta.glob("../../assets/icons/*.svg");
  const names: string[] = [];
  for (const path in modules) {
    const seg = path.split("assets/icons/")[1];
    if (seg) names.push(seg.split(".svg")[0]);
  }
  return names.sort();
})();

const emit = defineEmits(["update:modelValue"]);
const visible = ref(false);
const searchText = ref("");
const activeTab = ref<"ele" | "local">("local");
const currentPage = ref(1);

const inputValue = computed({
  get() {
    return props.modelValue;
  },
  set(value: string) {
    !value && emit("update:modelValue", value);
  }
});

const sourceIcons = computed(() => (activeTab.value === "ele" ? ELE_ICON_NAMES : LOCAL_ICON_NAMES));

const filteredIcons = computed(() => {
  const q = searchText.value.trim().toLowerCase();
  if (!q) return sourceIcons.value;
  return sourceIcons.value.filter((name) => name.toLowerCase().includes(q));
});

const filteredTotal = computed(() => filteredIcons.value.length);

const paginatedIcons = computed(() => {
  const start = (currentPage.value - 1) * props.pageSize;
  return filteredIcons.value.slice(start, start + props.pageSize);
});

watch([activeTab, searchText], () => {
  currentPage.value = 1;
});

watch(visible, (v) => {
  if (!v) {
    searchText.value = "";
    currentPage.value = 1;
  }
});

watch(filteredTotal, (total) => {
  const maxPage = Math.max(1, Math.ceil(total / props.pageSize) || 1);
  if (currentPage.value > maxPage) currentPage.value = maxPage;
});

const handleIconSelect = (iconItem: string) => {
  visible.value = false;
  emit("update:modelValue", iconItem);
};
</script>

<style lang="scss" scoped>
.koi-select-icon-panel {
  min-width: 0;
}

.koi-select-icon-search {
  margin-bottom: 8px;
}

.koi-select-icon-tabs {
  margin-bottom: 8px;

  :deep(.el-tabs__header) {
    margin-bottom: 0;
  }

  :deep(.el-tabs__content) {
    display: none;
  }
}

.koi-select-icon-grid {
  min-height: 48px;
}

.koi-select-icon-pagination {
  margin-top: 10px;
  justify-content: flex-end;

  :deep(.el-pagination__sizes),
  :deep(.el-pagination__jump) {
    display: none;
  }
}
</style>
