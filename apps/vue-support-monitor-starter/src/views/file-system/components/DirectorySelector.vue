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
      <template #default="{ node, data }">
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
import { ref, computed, watch, onMounted } from "vue";
import { message } from "@repo/utils";
import { Folder, FolderOpened } from "@element-plus/icons-vue";
import { formatBytes } from "@pureadmin/utils";
import {
  getSystemDrives,
  getDirectories,
  type DriveInfo,
  type DirectoryInfo,
} from "@/api/monitor/filesystem";

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
        message(res.msg || "获取磁盘驱动器失败", { type: "error" });
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
        message(res.msg || "获取目录列表失败", { type: "error" });
        resolve([]);
      }
    }
  } catch (error) {
    console.error("加载节点数据失败:", error);
    message("加载数据失败", { type: "error" });
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

.modern-bg {
  position: relative;
  overflow: hidden;

  // 渐变背景
  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
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


// 响应式设计
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 12px;
    padding: 12px 16px;
  }
}

</style>
