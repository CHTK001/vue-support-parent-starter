<template>
  <div class="directory-selector system-container modern-bg">
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
      <template #default="{ data }">
        <div class="tree-node">
          <el-icon class="node-icon">
            <Folder v-if="data.type === 'drive'" />
            <FolderOpened v-else />
          </el-icon>
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
import { ref, watch } from "vue";
import { message } from "@repo/utils";
import { Folder, FolderOpened } from "@element-plus/icons-vue";
import { formatBytes } from "@pureadmin/utils";
import {
  getSystemDrives,
  getDirectories,
  type DriveInfo,
  type DirectoryInfo,
} from "../../api/monitor/filesystem";

const props = defineProps<{
  modelValue?: string;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: string];
}>();

const selectedValue = ref("");
const treeData = ref<any[]>([]);

const treeProps = {
  value: "value",
  label: "label",
  children: "children",
  isLeaf: "isLeaf",
};

watch(
  () => props.modelValue,
  (newValue) => {
    selectedValue.value = newValue || "";
  },
  { immediate: true },
);

const handleChange = (value: string) => {
  emit("update:modelValue", value);
};

const loadNode = async (node: any, resolve: (data: any[]) => void) => {
  try {
    if (node.level === 0) {
      const res = await getSystemDrives();
      if (String(res.code) === "00000") {
        const drives = res.data || [];
        resolve(
          drives.map((drive: DriveInfo) => ({
            value: drive.path,
            label: `${drive.name} (${drive.path})`,
            type: "drive",
            freeSpace: drive.freeSpace,
            totalSpace: drive.totalSpace,
            isLeaf: false,
          })),
        );
        return;
      }

      message(res.msg || "获取磁盘驱动器失败", { type: "error" });
      resolve([]);
      return;
    }

    const parentPath = node.data.value;
    const res = await getDirectories(parentPath, false);
    if (String(res.code) === "00000") {
      const directories = res.data || [];
      resolve(
        directories.map((dir: DirectoryInfo) => ({
          value: dir.path,
          label: dir.name,
          type: "directory",
          isLeaf: false,
        })),
      );
      return;
    }

    message(res.msg || "获取目录列表失败", { type: "error" });
    resolve([]);
  } catch (error) {
    console.error("加载节点数据失败:", error);
    message("加载数据失败", { type: "error" });
    resolve([]);
  }
};
</script>

<style scoped lang="scss">
.modern-bg {
  position: relative;
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    inset: 0;
    background:
      radial-gradient(
        circle at 20% 30%,
        rgba(99, 102, 241, 0.08) 0%,
        transparent 50%
      ),
      radial-gradient(
        circle at 80% 70%,
        rgba(168, 85, 247, 0.06) 0%,
        transparent 50%
      );
    pointer-events: none;
    z-index: 0;
  }

  > * {
    position: relative;
    z-index: 1;
  }
}

.directory-selector {
  width: 100%;
}

.tree-node {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;

  .node-icon {
    font-size: 16px;
    color: var(--el-color-primary);
  }

  .node-label {
    flex: 1;
    color: var(--el-text-color-primary);
  }

  .drive-info {
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }
}

:deep(.el-tree-select) {
  .el-tree-node__content {
    height: auto;
    padding: 4px 0;
  }

  .el-tree-node__label {
    width: 100%;
  }
}
</style>
