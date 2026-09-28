<script setup lang="ts">
/**
 * ReIconSelect koi 主题 —— 图标选择器（完全复刻目标站 KoiSelectIcon）
 *
 * 结构（与目标站 KoiSelectIcon 保持一致）：
 *  - 触发区：单个 ElInput（prefix = 24×24 圆角图标预览，suffix = 清除按钮），点击弹 Popover
 *  - 面板：搜索框 → tabs（本地图标 / Element 图标 / Iconify）→ 图标网格（36×36 圆角7）
 *    → footer（共 X 个 + 分页）
 */
import { computed, ref, watch } from "vue";
import {
  ElInput, ElPopover, ElTabs, ElTabPane, ElPagination, ElScrollbar, ElEmpty,
} from "element-plus";
import { Close, Search } from "@element-plus/icons-vue";
import * as ElementPlusIconsVue from "@element-plus/icons-vue";
import ReIcon from "../../../ReIcon/theme/koi/ReIcon.vue";

defineOptions({ name: "ReIconSelect", inheritAttrs: true });

const props = withDefaults(
  defineProps<{
    modelValue?: string;
    /** 触发区输入框宽度 */
    width?: string;
    /** popover 宽度（默认 520，与目标站一致） */
    widthPopover?: string;
    /** 是否禁用 */
    disabled?: boolean;
    /** 图标主题色（默认跟随主题主色） */
    iconColor?: string;
    /** 图标选中背景色 */
    iconBg?: string;
    /** 每页图标数量（默认 80，与目标站一致） */
    pageSize?: number;
  }>(),
  {
    modelValue: "",
    width: "100%",
    widthPopover: "520",
    disabled: false,
    iconColor: "var(--el-color-primary)",
    iconBg: "var(--el-color-primary-light-9)",
    pageSize: 80,
  },
);

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
}>();

/** 本地 koi-* 图标（从 assets 的 svg sprite 目录读取文件名，与 setupSvgSprite 一致） */
const localIconModules = import.meta.glob("../../../../../../assets/src/icons/*.svg", {
  eager: false,
  query: "?raw",
  import: "default",
});
const LOCAL_ICON_NAMES = Object.keys(localIconModules)
  .map((p) => p.split("/").pop()!.replace(/\.svg$/, ""))
  .sort();

/** element-plus 图标名 */
const ELE_ICON_NAMES = Object.keys(ElementPlusIconsVue).sort();

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

const visible = ref(false);
const searchText = ref("");
const activeTab = ref<"local" | "ele" | "iconify">("local");
const currentPage = ref(1);

/** 图标主题 CSS 变量（照搬目标站 --koi-select-icon-*） */
const iconVars = computed(() => ({
  "--koi-select-icon-color": props.iconColor,
  "--koi-select-icon-bg": props.iconBg,
}) as Record<string, string>);

const sourceIcons = computed(() => {
  if (activeTab.value === "local") return LOCAL_ICON_NAMES;
  if (activeTab.value === "iconify") return ICONIFY_ICON_NAMES;
  return ELE_ICON_NAMES;
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

function handleClear() {
  emit("update:modelValue", "");
}

function handleIconSelect(name: string) {
  visible.value = false;
  emit("update:modelValue", name);
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
</script>

<template>
  <ElPopover
    placement="bottom-start"
    v-model:visible="visible"
    :disabled="disabled"
    :width="widthPopover"
    trigger="click"
    popper-class="koi-select-icon-popper"
  >
    <template #reference>
      <ElInput
        class="koi-select-icon-input"
        :style="{ width }"
        :model-value="modelValue"
        placeholder="请选择图标"
        :disabled="disabled"
        readonly
      >
        <template #prefix>
          <span
            class="koi-select-icon-input__preview"
            :class="{ 'is-empty': !modelValue }"
            :style="iconVars"
          >
            <ReIcon v-if="modelValue" :name="modelValue" :size="16" />
          </span>
        </template>
        <template #suffix>
          <span
            v-if="modelValue && !disabled"
            class="koi-select-icon-input__clear"
            @click.stop="handleClear"
          >
            <el-icon><Close /></el-icon>
          </span>
        </template>
      </ElInput>
    </template>

    <div class="koi-select-icon-panel" :style="iconVars">
      <ElInput
        v-model="searchText"
        placeholder="搜索图标名称"
        clearable
        class="koi-select-icon-search"
      >
        <template #prefix>
          <el-icon class="el-input__icon"><Search /></el-icon>
        </template>
      </ElInput>

      <ElTabs v-model="activeTab" class="koi-select-icon-tabs">
        <ElTabPane label="本地图标" name="local" />
        <ElTabPane label="Element 图标" name="ele" />
        <ElTabPane label="Iconify" name="iconify" />
      </ElTabs>

      <ElScrollbar max-height="260px">
        <div v-if="paginatedIcons.length" class="koi-select-icon-grid">
          <button
            v-for="item in paginatedIcons"
            :key="activeTab + item"
            type="button"
            class="koi-select-icon-button"
            :class="{ 'is-active': isSelected(item) }"
            :title="item"
            @click="handleIconSelect(item)"
          >
            <ReIcon :name="item" :size="18" />
          </button>
        </div>
        <ElEmpty v-else description="无匹配图标" :image-size="64" />
      </ElScrollbar>

      <div v-if="filteredTotal > 0" class="koi-select-icon-footer">
        <span class="koi-select-icon-total">共 {{ filteredTotal }} 个</span>
        <ElPagination
          layout="prev, pager, next"
          :total="filteredTotal"
          :page-size="pageSize"
          :current-page="currentPage"

          background
          @current-change="(p: number) => (currentPage = p)"
        />
      </div>
    </div>
  </ElPopover>
</template>

<style scoped lang="scss">
/* ===== 照搬目标站 KoiSelectIcon 样式 ===== */

.koi-select-icon-input {
  :deep(.el-input__wrapper) {
    cursor: pointer;
  }
}

.koi-select-icon-input__preview {
  width: 24px;
  height: 24px;
  color: var(--koi-select-icon-color);
  background: var(--koi-select-icon-bg);
  border: 1px solid color-mix(in srgb, var(--koi-select-icon-color) 28%, var(--el-border-color-lighter));
  border-radius: 6px;
  flex: 0 0 24px;
  justify-content: center;
  align-items: center;
  display: inline-flex;
}

.koi-select-icon-input__preview.is-empty {
  color: var(--el-text-color-placeholder);
  background: var(--el-fill-color-lighter);
  border-color: var(--el-border-color-lighter);
}

.koi-select-icon-input__clear {
  color: var(--el-text-color-placeholder);
  cursor: pointer;
  transition: color 0.18s;
  display: inline-flex;

  &:hover {
    color: var(--el-text-color-secondary);
  }
}

.koi-select-icon-panel {
  min-width: 0;
}

.koi-select-icon-search,
.koi-select-icon-tabs {
  margin-bottom: 8px;
}

.koi-select-icon-tabs {
  :deep(.el-tabs__header) {
    margin-bottom: 0;
  }

  :deep(.el-tabs__nav-wrap:after) {
    height: 1px;
  }

  :deep(.el-tabs__content) {
    display: none;
  }
}

.koi-select-icon-grid {
  flex-wrap: wrap;
  gap: 8px;
  min-height: 48px;
  padding: 2px 4px 2px 0;
  display: flex;
}

.koi-select-icon-button {
  border-radius: 7px;
  width: 36px;
  height: 36px;
  margin: 0;
  padding: 0;
  border: 1px solid transparent;
  background: transparent;
  cursor: pointer;
  transition: color 0.18s, border-color 0.18s, background-color 0.18s, box-shadow 0.18s;

  span {
    justify-content: center;
    align-items: center;
    display: inline-flex;
  }

  &:hover,
  &.is-active {
    color: var(--koi-select-icon-color);
    background: var(--koi-select-icon-bg);
    border-color: color-mix(in srgb, var(--koi-select-icon-color) 68%, var(--el-border-color));
  }

  &.is-active {
    box-shadow: 0 0 0 1px color-mix(in srgb, var(--koi-select-icon-color) 32%, transparent) inset;
  }
}

.koi-select-icon-footer {
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  margin-top: 10px;
  margin-bottom: -4px;
  display: flex;
}

.koi-select-icon-total {
  color: var(--el-text-color-secondary);
  flex-shrink: 0;
  font-size: 12px;
}
</style>

<style lang="scss">
/* 目标站 popper 容器（非 scoped，跟随 popper-class） */
.koi-select-icon-popper {
  &.el-popper {
    border-radius: 8px;
    box-shadow: var(--el-box-shadow-light);
  }
}
</style>
