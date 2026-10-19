<script setup lang="ts">
/**
 * ReFilePicker「属性」弹窗 —— 对齐资源管理器的属性页：名称 / 位置 / 类型 / 大小 / 修改时间。
 *
 * <p>数据全部来自列表里已有的字段（不额外请求后端），右键空白处时展示的是当前目录的属性。</p>
 */
import { computed } from "vue";
import type { FilePickerItem } from "../types";
import { fileTypeText, formatSize, formatTime, parentPathOf } from "../utils";

const props = defineProps<{
  /** 是否显示（v-model） */
  modelValue: boolean;
  /** 目标条目；null = 当前目录 */
  item?: FilePickerItem | null;
  /** 当前目录（item 为空时作为属性目标） */
  path: string;
}>();

const emit = defineEmits<{ (e: "update:modelValue", value: boolean): void }>();

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value),
});

const rows = computed<Array<{ label: string; value: string }>>(() => {
  const item = props.item;
  if (item) {
    return [
      { label: "名称", value: item.name },
      { label: "位置", value: parentPathOf(item.key || props.path) },
      { label: "类型", value: item.isDir ? "文件夹" : fileTypeText(item.name) },
      { label: "大小", value: item.isDir ? "-" : formatSize(item.size) },
      { label: "修改时间", value: formatTime(item.updatedAt) },
      { label: "完整路径", value: item.key },
    ];
  }
  return [
    { label: "名称", value: props.path || "根目录" },
    { label: "位置", value: parentPathOf(props.path) },
    { label: "类型", value: "文件夹" },
    { label: "完整路径", value: props.path },
  ];
});
</script>

<template>
  <el-dialog
    v-if="modelValue"
    v-model="visible"
    title="属性"
    width="min(520px, 92vw)"
    append-to-body
    destroy-on-close
    class="rfp-props"
  >
    <dl class="rfp-props__list">
      <template v-for="row in rows" :key="row.label">
        <dt>{{ row.label }}</dt>
        <dd :title="row.value">{{ row.value || "-" }}</dd>
      </template>
    </dl>
  </el-dialog>
</template>

<style scoped>
.rfp-props__list {
  display: grid;
  grid-template-columns: 84px minmax(0, 1fr);
  gap: 10px 12px;
  margin: 0;
  font-size: 13px;
}

.rfp-props__list dt {
  color: var(--el-text-color-secondary, #909399);
}

.rfp-props__list dd {
  margin: 0;
  color: var(--el-text-color-regular, #303133);
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  word-break: break-all;
}
</style>
