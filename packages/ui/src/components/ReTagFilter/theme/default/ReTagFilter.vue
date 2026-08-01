<script setup lang="ts">
/**
 * ReTagFilter default 主题 —— 多组筛选标签组件
 *
 * 按分组展示可多选/单选标签，change 事件回传全部选中值。
 */
import { ref, watch } from "vue";

defineOptions({ name: "ReTagFilter", inheritAttrs: true });

interface ReFilterOption {
  value: string | number;
  label: string;
  icon?: string;
}

interface ReFilterGroup {
  title: string;
  key: string;
  multiple?: boolean;
  options: ReFilterOption[];
}

const props = withDefaults(
  defineProps<{
    data?: ReFilterGroup[];
    defaultValues?: Record<string, unknown>;
  }>(),
  { data: () => [], defaultValues: () => ({}) },
);

const selected = ref<Record<string, unknown>>({});

watch(
  () => props.defaultValues,
  () => {
    props.data.forEach((item) => {
      selected.value[item.key] = item.multiple
        ? (props.defaultValues[item.key] ?? [""])
        : (props.defaultValues[item.key] ?? "");
    });
  },
  { deep: true, immediate: true },
);

const emit = defineEmits<{
  (e: "change", value: Record<string, unknown>): void;
}>();

function select(item: ReFilterGroup, option: ReFilterOption) {
  if (!item.multiple) {
    if (selected.value[item.key] !== option.value) {
      selected.value[item.key] = option.value;
    }
  } else {
    const arr = (selected.value[item.key] as (string | number)[]) ?? [];
    if (item.options[0].value === option.value) {
      selected.value[item.key] = [option.value];
    } else if (arr.includes(option.value)) {
      const idx = arr.findIndex((s) => s === option.value);
      arr.splice(idx, 1);
      if (arr.length === 0) selected.value[item.key] = [item.options[0].value];
    } else {
      arr.push(option.value);
      const firstIdx = arr.indexOf(item.options[0].value);
      if (firstIdx > 0) arr.splice(0, 1);
    }
  }
  emit("change", selected.value);
}
</script>

<template>
  <div class="re-tag-filter">
    <div v-for="item in data" :key="item.key" class="re-tag-filter__group">
      <span class="re-tag-filter__title">{{ item.title }}：</span>
      <span v-if="!item.options.length" class="re-tag-filter__empty">暂无数据 ~</span>
      <el-scrollbar>
        <ul class="re-tag-filter__list">
          <li
            v-for="option in item.options"
            :key="option.value"
            :class="{
              'is-active':
                option.value === selected[item.key] ||
                (Array.isArray(selected[item.key]) && (selected[item.key] as unknown[]).includes(option.value)),
            }"
            @click="select(item, option)"
          >
            <slot :row="option">
              <el-icon v-if="option.icon"><component :is="option.icon" /></el-icon>
              <span>{{ option.label }}</span>
            </slot>
          </li>
        </ul>
      </el-scrollbar>
    </div>
  </div>
</template>

<style scoped lang="scss">
.re-tag-filter {
  width: 100%;

  &__group {
    display: flex;
    align-items: center;
    border-bottom: 1px dashed var(--el-border-color-light);

    &:last-child {
      border-bottom: none;
    }
  }

  &__title {
    margin-top: -2px;
    white-space: nowrap;
    font-size: 14px;
    color: var(--el-text-color-regular);
  }

  &__empty {
    margin: 18px 0;
    font-size: 14px;
    color: var(--el-text-color-regular);
  }

  &__list {
    display: flex;
    flex: 1;
    padding: 0;
    margin: 13px 0;

    li {
      display: flex;
      align-items: center;
      padding: 5px 15px;
      margin-right: 16px;
      font-size: 13px;
      color: var(--el-color-primary);
      list-style: none;
      cursor: pointer;
      background: var(--el-color-primary-light-9);
      border: 1px solid var(--el-color-primary-light-5);
      border-radius: 32px;

      &:hover {
        color: #ffffff;
        background: var(--el-color-primary);
        border-color: var(--el-color-primary);
        transition: 0.1s;
      }

      &.is-active {
        font-weight: bold;
        color: #ffffff;
        background: var(--el-color-primary);
        border-color: var(--el-color-primary);
      }

      .el-icon {
        margin-right: 4px;
        font-size: 16px;
        font-weight: bold;
      }

      span {
        white-space: nowrap;
      }
    }
  }
}
</style>
