<script setup lang="ts">
// @ts-nocheck

// @ts-nocheck
/**
 * ReIconSelect —— 图标选择器
 *
 * 支持多个图标库（默认 ep / ri / mdi），可通过 props 注入自定义集合。
 * v-model 绑定值为 "prefix:name"，如 "ri:home-line"。
 *
 * 用法：
 *   <ReIconSelect v-model="icon" />
 *   <ReIconSelect v-model="icon" :tabs="[{label:'业务',prefix:'biz:'}]" :icons="{ 'biz:': ['user','role'] }" />
 */
import { computed, ref, watch } from "vue";
import { ElInput, ElPopover, ElTabs, ElTabPane, ElPagination, ElButton, ElScrollbar, ElEmpty } from "element-plus";
import { defaultIconSets, defaultIconTabs, type IconSelectTab } from "../../../ReIcon/iconData";
import ReIcon from "../../../ReIcon/theme/default/ReIcon.vue";

defineOptions({ name: "ReIconSelect", inheritAttrs: true });

const props = withDefaults(
  defineProps<{
    /** 每页显示的图标数量 */
    pageSize?: number;
    /** 图标库 tabs */
    tabs?: IconSelectTab[];
    /** prefix → 图标名列表 */
    icons?: Record<string, string[]>;
    /** 占位文本 */
    placeholder?: string;
    /** popover 宽度 */
    popoverWidth?: number;
    /** popover 内容高度 */
    popoverHeight?: number;
  }>(),
  {
    pageSize: 35,
    tabs: () => defaultIconTabs,
    icons: () => defaultIconSets,
    placeholder: "请选择图标",
    popoverWidth: 350,
    popoverHeight: 220,
  },
);

const model = defineModel<string>({ default: "" });

/** 当前激活的 prefix */
const currentPrefix = ref<string>("ep:");

/** 搜索关键词 */
const filterValue = ref<string>("");

/** 当前页 */
const currentPage = ref<number>(1);

/** 解析初始值（首次打开 popover 时定位图标所在页） */
function parseValue(): void {
  const v = model.value;
  if (!v) {
    currentPrefix.value = props.tabs[0]?.prefix ?? "ep:";
    return;
  }
  const idx = v.indexOf(":");
  if (idx > 0) {
    currentPrefix.value = v.substring(0, idx + 1);
  }
}

/** 当前 prefix 下的全部图标名 */
const currentList = computed<string[]>(() => props.icons[currentPrefix.value] ?? []);

/** 过滤 + 分页后的当前页图标 */
const pageList = computed<string[]>(() => {
  const kw = filterValue.value.trim().toLowerCase();
  const filtered = kw
    ? currentList.value.filter((i) => i.toLowerCase().includes(kw))
    : currentList.value;
  const start = (currentPage.value - 1) * props.pageSize;
  return filtered.slice(start, start + props.pageSize);
});

/** 过滤后总条数 */
const filteredTotal = computed<number>(() => {
  const kw = filterValue.value.trim().toLowerCase();
  return kw
    ? currentList.value.filter((i) => i.toLowerCase().includes(kw)).length
    : currentList.value.length;
});

/** 选中样式 */
function iconItemStyle(name: string): Record<string, string> | undefined {
  if (model.value === currentPrefix.value + name) {
    return {
      borderColor: "var(--el-color-primary)",
      color: "var(--el-color-primary)",
    };
  }
  return undefined;
}

function onChangeIcon(name: string): void {
  model.value = currentPrefix.value + name;
}

function onClear(): void {
  model.value = "";
}

function onBeforeEnter(): void {
  parseValue();
  if (!model.value) {
    currentPage.value = 1;
    return;
  }
  const name = model.value.substring(model.value.indexOf(":") + 1);
  const idx = currentList.value.findIndex((i) => i === name);
  if (idx >= 0) {
    currentPage.value = Math.ceil((idx + 1) / props.pageSize);
  } else {
    currentPage.value = 1;
  }
}

function onAfterLeave(): void {
  filterValue.value = "";
}

function onTabChange(prefix: string): void {
  currentPrefix.value = prefix;
  currentPage.value = 1;
}

watch(filterValue, () => {
  currentPage.value = 1;
});
</script>

<template>
  <ElInput
    v-model="model"
    readonly
    :placeholder="placeholder"
    clearable
    @clear="onClear"
  >
    <template #append>
      <ElPopover
        :width="popoverWidth"
        trigger="click"
        @before-enter="onBeforeEnter"
        @after-leave="onAfterLeave"
      >
        <template #reference>
          <button
            type="button"
            class="re-icon-select__trigger"
            aria-label="选择图标"
          >
            <ReIcon
              v-if="model"
              :name="model"
              :size="16"
            />
            <span v-else class="re-icon-select__placeholder">图标</span>
          </button>
        </template>

        <ElInput
          v-model="filterValue"
          class="re-icon-select__search"
          placeholder="搜索图标"
          clearable
        />

        <ElTabs
          :model-value="currentPrefix"
          @tab-change="onTabChange"
        >
          <ElTabPane
            v-for="tab in tabs"
            :key="tab.prefix"
            :label="tab.label"
            :name="tab.prefix"
          >
            <ElScrollbar :height="popoverHeight">
              <ul class="re-icon-select__grid">
                <li
                  v-for="name in pageList"
                  :key="name"
                  :title="name"
                  class="re-icon-select__item"
                  :style="iconItemStyle(name)"
                  @click="onChangeIcon(name)"
                >
                  <ReIcon
                    :name="currentPrefix + name"
                    :size="20"
                  />
                </li>
              </ul>
              <ElEmpty
                v-if="pageList.length === 0"
                :description="`${filterValue} 图标不存在`"
                :image-size="60"
              />
            </ElScrollbar>
          </ElTabPane>
        </ElTabs>

        <div class="re-icon-select__footer">
          <ElPagination
            class="re-icon-select__pager"
            :total="filteredTotal"
            :current-page="currentPage"
            :page-size="pageSize"
            :pager-count="5"
            layout="pager"
            background

            @current-change="(p: number) => (currentPage = p)"
          />
          <ElButton
            type="danger"

            text
            bg
            @click="onClear"
          >清空</ElButton>
        </div>
      </ElPopover>
    </template>
  </ElInput>
</template>

<style scoped>
.re-icon-select__trigger {
  width: 40px;
  height: 32px;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0;
  background: transparent;
  border: 0;
  outline: none;
  cursor: pointer;
  color: inherit;
}
.re-icon-select__placeholder {
  color: var(--el-text-color-placeholder);
  font-size: 12px;
}
.re-icon-select__search {
  padding: 8px;
}
.re-icon-select__grid {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  padding: 8px;
  margin: 0;
  list-style: none;
}
.re-icon-select__item {
  width: 32px;
  height: 32px;
  display: flex;
  justify-content: center;
  align-items: center;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}
.re-icon-select__item:hover {
  border-color: var(--el-color-primary);
  color: var(--el-color-primary);
  transform: scale(1.05);
}
.re-icon-select__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-top: 1px solid var(--el-border-color-lighter);
  padding: 8px;
}
.re-icon-select__pager {
  flex: 1;
}
</style>