<template>
  <div class="directory-selector">
    <el-tree-select
      v-model="selectedValue"
      :data="treeData"
      :props="treeProps"
      placeholder="请选择存储根目录"
      :render-after-expand="false"
      :load="loadNode"
      lazy
      :check-strictly="true"
      :expand-on-click-node="false"
      style="width: 100%"
      @change="handleChange"
    >
      <template #default="{ node, data }">
        <div class="tree-node">
          <IconifyIconOnline
            :icon="data.type === 'drive' ? 'ep:folder-opened' : 'ep:folder'"
          />
          <span class="node-label">{{ data.label }}</span>
          <span v-if="data.type === 'drive'" class="drive-info">
            ({{ formatBytes(data.freeSpace) }} 可用)
          </span>
        </div>
      </template>
    </el-tree-select>
  </div>
</template>

<script setup lang="ts">
import { formatBytes } from "@pureadmin/utils";
import { ElMessage } from "element-plus";
import { computed, onMounted, ref, watch } from "vue";
import {
  getDirectories,
  getSystemDrives,
  type DirectoryInfo,
  type DriveInfo,
} from "../../api/ai/filesystem";

// Props & Emits
const props = defineProps<{
  modelValue?: string;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: string];
}>();

// 响应式数据
const selectedValue = ref<string>("");
const treeData = ref<any[]>([]);

// 树形组件配置
const treeProps = {
  value: "value",
  label: "label",
  children: "children",
  isLeaf: "isLeaf",
};

// 计算属性
const displayValue = computed(() => props.modelValue || "");

// 监听 modelValue 变化
watch(
  () => props.modelValue,
  (newValue) => {
    selectedValue.value = newValue || "";
  },
  { immediate: true }
);

// 处理选择变化
const handleChange = (value: string) => {
  emit("update:modelValue", value);
};

// 加载节点数据
const loadNode = async (node: any, resolve: Function) => {
  try {
    if (node.level === 0) {
      // 加载根节点 - 磁盘驱动器
      const res = await getSystemDrives();
      if (String(res.code) === "00000") {
        const drives = res.data || [];
        const driveNodes = drives.map((drive: DriveInfo) => ({
          value: drive.path,
          label: `${drive.name} (${drive.path})`,
          type: "drive",
          freeSpace: drive.freeSpace,
          totalSpace: drive.totalSpace,
          isLeaf: false,
        }));
        resolve(driveNodes);
      } else {
        ElMessage.error(res.msg || "获取磁盘驱动器失败");
        resolve([]);
      }
    } else {
      // 加载子目录
      const parentPath = node.data.value;
      const res = await getDirectories(parentPath, false);
      if (String(res.code) === "00000") {
        const directories = res.data || [];
        const dirNodes = directories.map((dir: DirectoryInfo) => ({
          value: dir.path,
          label: dir.name,
          type: "directory",
          isLeaf: false, // 假设所有目录都可能有子目录
        }));
        resolve(dirNodes);
      } else {
        ElMessage.error(res.msg || "获取目录列表失败");
        resolve([]);
      }
    }
  } catch (error) {
    console.error("加载节点数据失败:", error);
    ElMessage.error("加载数据失败");
    resolve([]);
  }
};

// 初始化
onMounted(() => {
  // 如果有初始值，设置选中状态
  if (props.modelValue) {
    selectedValue.value = props.modelValue;
  }
});
</script>

<style scoped lang="scss">
.directory-selector {
  width: 100%;
}

.tree-node {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 6px 8px;
  border-radius: 8px;
  transition: all 0.3s ease;

  &:hover {
    background: var(--el-color-primary-light-9);
  }

  .node-icon {
    font-size: 18px;
    color: var(--el-color-primary);
  }

  .node-label {
    flex: 1;
    color: var(--el-text-color-primary);
    font-weight: 500;
  }

  .drive-info {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    background: var(--el-fill-color-light);
    padding: 2px 8px;
    border-radius: 6px;
  }
}

:deep(.el-tree-select) {
  .el-select__wrapper {
    border-radius: 10px;
    transition: all 0.3s ease;

    &:hover,
    &:focus-within {
      box-shadow: 0 4px 12px rgba(var(--el-color-primary-rgb), 0.12);
    }
  }

  .el-tree-node__content {
    height: auto;
    padding: 4px 8px;
    border-radius: 8px;
    transition: all 0.3s ease;

    &:hover {
      background: var(--el-color-primary-light-9);
    }
  }

  .el-tree-node__label {
    width: 100%;
  }
}

:deep(.el-popper) {
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  border: 1px solid var(--el-border-color-lighter);
}
</style>
