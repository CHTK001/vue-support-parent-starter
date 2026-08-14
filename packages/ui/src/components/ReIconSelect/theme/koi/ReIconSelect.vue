<script setup lang="ts">
/**
 * ReIconSelect koi 主题 —— 图标选择器
 *
 * 结构：左侧禁用输入框(展示当前图标名) + 右侧按钮，点击按钮弹出 popover 面板。
 * 面板默认展示 element-plus 系统图标(支持搜索/分页/选中高亮)，
 * 另含「本地图标」tab(koi- 前缀 svg symbol，可外部注入)。
 */
import { computed, ref, watch } from "vue";
import {
  ElInput, ElPopover, ElTabs, ElTabPane, ElPagination, ElButton, ElScrollbar, ElEmpty,
} from "element-plus";
import { ArrowDown } from "@element-plus/icons-vue";
import * as ElementPlusIconsVue from "@element-plus/icons-vue";
import ReIcon from "../../../ReIcon/theme/koi/ReIcon.vue";

defineOptions({ name: "ReIconSelect", inheritAttrs: true });

const props = withDefaults(
  defineProps<{
    modelValue?: string;
    /** 每页图标数量 */
    pageSize?: number;
    /** 是否禁用 */
    disabled?: boolean;
    /** popover 宽度 */
    widthPopover?: string;
  }>(),
  {
    modelValue: "",
    pageSize: 48,
    disabled: false,
    widthPopover: "420",
  },
);

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
}>();

/** element-plus 图标名（本地不需要 glob 也能静态拿到） */
const ELE_ICON_NAMES = Object.keys(ElementPlusIconsVue).sort();

/** 本地 svg symbol 图标名（koi- 前缀），业务可通过 inject/provide 注册 */
const LOCAL_ICON_NAMES: string[] = [];

/** 常用 Iconify 图标（ri:/mdi:/carbon:/humbleicons: 前缀，可自行扩充） */
const ICONIFY_ICON_NAMES: string[] = [
  // ri 图标
  "ri:user-3-line", "ri:user-settings-line", "ri:shield-user-line", "ri:group-line", "ri:team-line",
  "ri:menu-line", "ri:menu-2-line", "ri:home-5-line", "ri:building-2-line", "ri:settings-3-line",
  "ri:tools-line", "ri:file-list-3-line", "ri:file-chart-line", "ri:book-mark-line", "ri:folder-2-line",
  "ri:database-2-line", "ri:cloud-line", "ri:server-line", "ri:notification-3-line", "ri:mail-send-line",
  "ri:message-3-line", "ri:chat-smile-3-line", "ri:star-line", "ri:heart-3-line", "ri:fire-line",
  "ri:lock-2-line", "ri:key-2-line", "ri:login-box-line", "ri:logout-box-r-line", "ri:search-line",
  "ri:refresh-line", "ri:add-line", "ri:edit-2-line", "ri:delete-bin-6-line", "ri:download-2-line",
  "ri:upload-2-line", "ri:printer-line", "ri:external-link-line", "ri:link-m", "ri:eye-line",
  "ri:eye-off-line", "ri:calendar-2-line", "ri:time-line", "ri:alarm-line", "ri:pie-chart-2-line",
  "ri:bar-chart-2-line", "ri:line-chart-line", "ri:donut-chart-line", "ri:flag-line", "ri:award-line",
  // mdi 图标
  "mdi:view-dashboard", "mdi:table-cog", "mdi:menu-open", "mdi:apps", "mdi:account-group",
  "mdi:account-key", "mdi:security", "mdi:shield-account", "mdi:key-variant", "mdi:cog",
  "mdi:settings-outline", "mdi:database", "mdi:server", "mdi:cloud-outline", "mdi:folder-multiple",
  "mdi:file-document-multiple", "mdi:chart-donut", "mdi:chart-line", "mdi:chart-bar", "mdi:bell-outline",
  "mdi:email-outline", "mdi:message-text-outline", "mdi:star-outline", "mdi:heart-outline", "mdi:fire",
  "mdi:lock-outline", "mdi:login", "mdi:logout", "mdi:magnify", "mdi:refresh", "mdi:plus",
  "mdi:pencil", "mdi:delete-outline", "mdi:download", "mdi:upload", "mdi:printer",
  "mdi:open-in-new", "mdi:link-variant", "mdi:eye-outline", "mdi:eye-off-outline", "mdi:calendar",
  "mdi:clock-outline", "mdi:chart-pie", "mdi:flag-outline", "mdi:trophy-outline", "mdi:web",
  // carbon 图标
  "carbon:user-multiple", "carbon:user-profile", "carbon:security", "carbon:locked", "carbon:menu",
  "carbon:home", "carbon:settings", "carbon:tools", "carbon:document", "carbon:folder",
  "carbon:database", "carbon:server", "carbon:cloud", "carbon:notification", "carbon:email",
  "carbon:chat", "carbon:star", "carbon:chart-line", "carbon:chart-bar", "carbon:chart-pie",
  "carbon:search", "carbon:refresh", "carbon:add-alt", "carbon:edit", "carbon:delete",
  "carbon:download", "carbon:upload", "carbon:printer", "carbon:link", "carbon:calendar",
  // humbleicons 图标
  "humbleicons:user", "humbleicons:users", "humbleicons:settings", "humbleicons:cog", "humbleicons:home",
  "humbleicons:menu", "humbleicons:search", "humbleicons:refresh", "humbleicons:plus", "humbleicons:pencil",
  "humbleicons:trash", "humbleicons:download", "humbleicons:upload", "humbleicons:external-link",
  "humbleicons:star", "humbleicons:heart", "humbleicons:bell", "humbleicons:mail", "humbleicons:calendar",
];

const inputValue = computed({
  get() {
    return props.modelValue;
  },
  set(value: string) {
    if (!value) emit("update:modelValue", value);
  },
});

const visible = ref(false);
const searchText = ref("");
const activeTab = ref<"ele" | "local" | "iconify">("ele");
const currentPage = ref(1);

const sourceIcons = computed(() => {
  if (activeTab.value === "ele") return ELE_ICON_NAMES;
  if (activeTab.value === "iconify") return ICONIFY_ICON_NAMES;
  return LOCAL_ICON_NAMES;
});

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

/** 当前选中图标是否在本页（用于高亮） */
function isSelected(name: string): boolean {
  return props.modelValue === name;
}

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

function handleIconSelect(name: string) {
  visible.value = false;
  emit("update:modelValue", name);
}
</script>

<template>
  <ElPopover
    placement="bottom-start"
    v-model:visible="visible"
    :disabled="disabled"
    :width="widthPopover"
    trigger="click"
  >
    <template #reference>
      <div class="koi-icon-select">
        <ElInput
          v-model="inputValue"
          placeholder="请选择图标"
          disabled
          readonly
          clearable
          @clear="emit('update:modelValue', '')"
        >
          <template #prefix>
            <ReIcon v-if="modelValue" :name="modelValue" :size="18" />
          </template>
        </ElInput>
        <button
          type="button"
          class="koi-icon-select__btn"
          :disabled="disabled"
          aria-label="选择图标"
        >
          <el-icon :size="14"><ArrowDown /></el-icon>
        </button>
      </div>
    </template>

    <div class="koi-select-icon-panel">
      <ElInput
        v-model="searchText"
        placeholder="搜索图标名称"
        clearable
        class="koi-select-icon-search"
      />

      <ElTabs v-model="activeTab" class="koi-select-icon-tabs">
        <ElTabPane label="系统图标" name="ele" />
        <ElTabPane label="Iconify" name="iconify" />
        <ElTabPane label="本地图标" name="local" />
      </ElTabs>

      <ElScrollbar max-height="260px">
        <div v-if="paginatedIcons.length" class="koi-select-icon-grid">
          <button
            v-for="item in paginatedIcons"
            :key="activeTab + item"
            type="button"
            class="koi-select-icon-item"
            :class="{ 'koi-select-icon-item--active': isSelected(item) }"
            :title="item"
            @click="handleIconSelect(item)"
          >
            <ReIcon :name="item" :size="18" />
          </button>
        </div>
        <ElEmpty v-else description="无匹配图标" :image-size="64" />
      </ElScrollbar>

      <ElPagination
        v-if="filteredTotal > 0"
        class="koi-select-icon-pagination"
        layout="total, prev, pager, next"
        :total="filteredTotal"
        :page-size="pageSize"
        :current-page="currentPage"
        size="small"
        background
        @current-change="(p: number) => (currentPage = p)"
      />
    </div>
  </ElPopover>
</template>

<style scoped lang="scss">
:root {
  --ris-radius-sm: 6px;
  --ris-radius-md: 10px;
  --ris-radius-lg: 14px;
  --ris-shadow: 0 4px 20px rgba(0, 0, 0, 0.08), 0 1px 4px rgba(0, 0, 0, 0.04);
  --ris-shadow-hover: 0 8px 30px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.06);
  --ris-transition: 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.koi-icon-select {
  position: relative;
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0;

  :deep(.el-input) {
    padding-right: 36px;
  }

  :deep(.el-input__wrapper) {
    padding-right: 0;
    border-radius: var(--ris-radius-sm) 0 0 var(--ris-radius-sm);
    box-shadow: 0 0 0 1px var(--el-border-color) inset;
    transition: box-shadow var(--ris-transition);

    &:hover {
      box-shadow: 0 0 0 1px var(--el-color-primary-light-5) inset;
    }
  }

  :deep(.el-input__inner) {
    &::placeholder {
      color: var(--el-text-color-placeholder);
    }
  }
}

.koi-icon-select__btn {
  height: 32px;
  width: 34px;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0;
  border: 1px solid var(--el-border-color);
  border-left: none;
  border-radius: 0 var(--ris-radius-sm) var(--ris-radius-sm) 0;
  background: var(--el-fill-color-light);
  color: var(--el-text-color-secondary);
  cursor: pointer;
  outline: none;
  transition: all var(--ris-transition);

  &:hover {
    background: linear-gradient(135deg, var(--el-color-primary-light-9), #e8f0fe);
    color: var(--el-color-primary);
    border-color: var(--el-color-primary-light-5);
  }

  &:active {
    transform: scale(0.95);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
}

.koi-select-icon-panel {
  min-width: 0;
  padding: 4px 0;
}

.koi-select-icon-search {
  margin-bottom: 12px;

  :deep(.el-input__wrapper) {
    border-radius: var(--ris-radius-sm);
    transition: box-shadow var(--ris-transition);

    &:focus-within {
      box-shadow: 0 0 0 2px var(--el-color-primary-light-5);
    }
  }
}

.koi-select-icon-tabs {
  margin-bottom: 12px;

  :deep(.el-tabs__header) {
    margin-bottom: 0;
  }

  :deep(.el-tabs__nav-wrap::after) {
    display: none;
  }

  :deep(.el-tabs__item) {
    font-size: 13px;
    font-weight: 500;
    padding: 0 12px;
    height: 32px;
    line-height: 32px;
    transition: color var(--ris-transition);

    &:hover {
      color: var(--el-color-primary);
    }

    &.is-active {
      color: var(--el-color-primary);
      font-weight: 600;
    }
  }

  :deep(.el-tabs__active-bar) {
    height: 2px;
    border-radius: 1px;
    background: linear-gradient(90deg, var(--el-color-primary), var(--el-color-primary-light-3));
  }

  :deep(.el-tabs__content) {
    display: none;
  }
}

.koi-select-icon-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  min-height: 48px;
  padding: 4px 0;
}

.koi-select-icon-item {
  width: 36px;
  height: 36px;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--ris-radius-sm);
  background: transparent;
  color: var(--el-text-color-regular);
  cursor: pointer;
  outline: none;
  transition: all var(--ris-transition);
  position: relative;

  &:hover {
    border-color: var(--el-color-primary-light-5);
    color: var(--el-color-primary);
    background: var(--el-color-primary-light-9);
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(var(--el-color-primary-rgb), 0.12);
    z-index: 1;
  }

  &:active {
    transform: scale(0.92);
  }
}

.koi-select-icon-item--active {
  border-color: var(--el-color-primary);
  background: linear-gradient(135deg, var(--el-color-primary-light-9), #e8f0fe);
  color: var(--el-color-primary);
  box-shadow: 0 1px 4px rgba(var(--el-color-primary-rgb), 0.15);
  font-weight: 500;

  &:hover {
    border-color: var(--el-color-primary);
    background: linear-gradient(135deg, var(--el-color-primary-light-8), #dce8fc);
    box-shadow: 0 2px 8px rgba(var(--el-color-primary-rgb), 0.2);
  }
}

.koi-select-icon-pagination {
  margin-top: 12px;
  justify-content: flex-end;
  padding-top: 8px;
  border-top: 1px solid var(--el-border-color-lighter);

  :deep(.el-pagination__sizes),
  :deep(.el-pagination__jump) {
    display: none;
  }

  :deep(.el-pagination button) {
    border-radius: 4px;
    transition: all var(--ris-transition);

    &:hover {
      color: var(--el-color-primary);
    }
  }

  :deep(.el-pager li) {
    border-radius: 4px;
    transition: all var(--ris-transition);

    &:hover {
      color: var(--el-color-primary);
    }

    &.is-active {
      font-weight: 600;
      background: linear-gradient(135deg, var(--el-color-primary), var(--el-color-primary-light-3));
    }
  }
}

/* Popover 美化 */
:deep(.el-popper) {
  border-radius: var(--ris-radius-md) !important;
  box-shadow: var(--ris-shadow) !important;
  border: 1px solid var(--el-border-color-lighter) !important;
  padding: 12px !important;
}

:deep(.el-popper .el-popper__arrow) {
  display: none;
}
</style>
