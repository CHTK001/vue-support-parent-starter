<template>
  <div class="directory-selector">
    <el-input
      v-model="selectedPath"
      placeholder="请选择文件存储根目录"
      readonly
      @click="showDialog = true"
    >
      <template #prepend>
        <IconifyIconOnline icon="ri:folder-line" />
      </template>
      <template #append>
        <el-button @click="showDialog = true">
          <IconifyIconOnline icon="ri:folder-open-line" />
          选择目录
        </el-button>
      </template>
    </el-input>

    <!-- 目录选择对话框 -->
    <el-dialog
      v-model="showDialog"
      title="选择文件存储根目录"
      width="600px"
      :close-on-click-modal="false"
    >
      <div class="directory-dialog">
        <!-- 当前路径显示 -->
        <div class="current-path">
          <el-breadcrumb separator="/">
            <el-breadcrumb-item
              v-for="(segment, index) in pathSegments"
              :key="index"
              @click="navigateToPath(index)"
              class="breadcrumb-item"
            >
              {{ segment || "根目录" }}
            </el-breadcrumb-item>
          </el-breadcrumb>
        </div>

        <!-- 磁盘驱动器列表 -->
        <div v-if="showDrives" class="drives-section">
          <h4>磁盘驱动器</h4>
          <div class="drives-grid">
            <div
              v-for="drive in drives"
              :key="drive.path"
              class="drive-item"
              @click="selectDrive(drive)"
            >
              <div class="drive-icon">
                <IconifyIconOnline :icon="getDriveIcon(drive.type)" size="24" />
              </div>
              <div class="drive-info">
                <div class="drive-name">{{ drive.name }}</div>
                <div class="drive-details">
                  {{ drive.path }} - {{ formatBytes(drive.freeSpace) }} 可用
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 目录列表 -->
        <div v-if="!showDrives" class="directories-section">
          <div class="toolbar">
            <el-button size="small" @click="goBack">
              <IconifyIconOnline icon="ri:arrow-left-line" />
              返回上级
            </el-button>
            <el-button size="small" @click="showDrives = true">
              <IconifyIconOnline icon="ri:hard-drive-line" />
              显示驱动器
            </el-button>
            <el-button size="small" @click="refreshDirectories">
              <IconifyIconOnline icon="ri:refresh-line" />
              刷新
            </el-button>
          </div>

          <div v-loading="loading" class="directories-list">
            <div
              v-for="dir in directories"
              :key="dir.path"
              class="directory-item"
              @click="selectDirectory(dir)"
              @dblclick="enterDirectory(dir)"
            >
              <div class="directory-icon">
                <IconifyIconOnline icon="ri:folder-line" size="20" />
              </div>
              <div class="directory-info">
                <div class="directory-name">{{ dir.name }}</div>
                <div class="directory-path">{{ dir.path }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 创建新目录 -->
        <div class="create-directory">
          <el-input
            v-model="newDirectoryName"
            placeholder="输入新目录名称"
            size="small"
            style="width: 200px; margin-right: 8px"
            @keyup.enter="createDirectory"
          />
          <el-button size="small" type="primary" @click="createDirectory">
            <IconifyIconOnline icon="ri:add-line" />
            创建目录
          </el-button>
        </div>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="showDialog = false">取消</el-button>
          <el-button type="primary" @click="confirmSelection">
            确定选择
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { ElMessage } from "element-plus";
import { formatBytes } from "@pureadmin/utils";
import {
  getSystemDrives,
  getDirectories,
  createDirectory as createSystemDirectory,
  type DriveInfo,
  type DirectoryInfo,
} from "@/api/monitor/system-info";

// Props & Emits
const props = defineProps<{
  modelValue: string;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: string];
}>();

// 响应式数据
const selectedPath = ref(props.modelValue || "");
const showDialog = ref(false);
const loading = ref(false);
const currentPath = ref("");
const showDrives = ref(true);
const newDirectoryName = ref("");

// 驱动器和目录数据
const drives = ref<DriveInfo[]>([]);
const directories = ref<DirectoryInfo[]>([]);

// 计算属性
const pathSegments = computed(() => {
  if (!currentPath.value) return [];
  return currentPath.value.split(/[/\\]/).filter(Boolean);
});

// 监听 modelValue 变化
watch(
  () => props.modelValue,
  (newValue) => {
    selectedPath.value = newValue || "";
  }
);

// 监听 selectedPath 变化
watch(selectedPath, (newValue) => {
  emit("update:modelValue", newValue);
});

/**
 * 获取驱动器图标
 */
const getDriveIcon = (type: string) => {
  const iconMap: Record<string, string> = {
    FIXED: "ri:hard-drive-line",
    REMOVABLE: "ri:usb-line",
    CDROM: "ri:disc-line",
    NETWORK: "ri:cloud-line",
    RAM: "ri:cpu-line",
  };
  return iconMap[type] || "ri:hard-drive-line";
};

/**
 * 加载磁盘驱动器
 */
const loadDrives = async () => {
  try {
    loading.value = true;
    const result = await getSystemDrives();
    if (result.code === "00000" && result.data) {
      drives.value = result.data;
    } else {
      ElMessage.error(result.message || "获取磁盘驱动器失败");
    }
  } catch (error) {
    console.error("加载磁盘驱动器失败:", error);
    ElMessage.error("加载磁盘驱动器失败");
  } finally {
    loading.value = false;
  }
};

/**
 * 加载目录列表
 */
const loadDirectories = async (path: string) => {
  try {
    loading.value = true;
    const result = await getDirectories(path, false);
    if (result.code === "00000" && result.data) {
      directories.value = result.data;
    } else {
      ElMessage.error(result.message || "获取目录列表失败");
    }
  } catch (error) {
    console.error("加载目录列表失败:", error);
    ElMessage.error("加载目录列表失败");
  } finally {
    loading.value = false;
  }
};

/**
 * 选择驱动器
 */
const selectDrive = (drive: DriveInfo) => {
  currentPath.value = drive.path;
  showDrives.value = false;
  loadDirectories(drive.path);
};

/**
 * 选择目录
 */
const selectDirectory = (dir: DirectoryInfo) => {
  currentPath.value = dir.path;
};

/**
 * 进入目录
 */
const enterDirectory = (dir: DirectoryInfo) => {
  currentPath.value = dir.path;
  loadDirectories(dir.path);
};

/**
 * 返回上级目录
 */
const goBack = () => {
  if (!currentPath.value) {
    showDrives.value = true;
    return;
  }

  const parentPath = currentPath.value.replace(/[/\\][^/\\]*$/, "");
  if (parentPath === currentPath.value.substring(0, 2)) {
    // 回到驱动器根目录
    showDrives.value = true;
    currentPath.value = "";
  } else {
    currentPath.value = parentPath;
    loadDirectories(parentPath);
  }
};

/**
 * 导航到指定路径
 */
const navigateToPath = (index: number) => {
  const segments = pathSegments.value.slice(0, index + 1);
  const path = segments.join("\\") + "\\";
  currentPath.value = path;
  loadDirectories(path);
};

/**
 * 刷新目录列表
 */
const refreshDirectories = () => {
  if (showDrives.value) {
    loadDrives();
  } else {
    loadDirectories(currentPath.value);
  }
};

/**
 * 创建新目录
 */
const createDirectory = async () => {
  if (!newDirectoryName.value.trim()) {
    ElMessage.warning("请输入目录名称");
    return;
  }

  try {
    const result = await createSystemDirectory(
      currentPath.value,
      newDirectoryName.value
    );
    if (result.code === "00000") {
      ElMessage.success("目录创建成功");
      newDirectoryName.value = "";
      refreshDirectories();
    } else {
      ElMessage.error(result.message || "创建目录失败");
    }
  } catch (error) {
    console.error("创建目录失败:", error);
    ElMessage.error("创建目录失败");
  }
};

/**
 * 确认选择
 */
const confirmSelection = () => {
  if (!currentPath.value) {
    ElMessage.warning("请选择一个目录");
    return;
  }

  selectedPath.value = currentPath.value;
  showDialog.value = false;
  ElMessage.success("目录选择成功");
};

// 监听对话框显示状态
watch(showDialog, (visible) => {
  if (visible) {
    showDrives.value = true;
    currentPath.value = "";
    loadDrives();
  }
});
</script>

<style scoped>
.directory-selector {
  width: 100%;
}

.directory-dialog {
  min-height: 400px;
}

.current-path {
  margin-bottom: 16px;
  padding: 8px;
  background: #f5f7fa;
  border-radius: 4px;
}

.breadcrumb-item {
  cursor: pointer;
}

.breadcrumb-item:hover {
  color: #409eff;
}

.drives-section h4 {
  margin: 0 0 12px 0;
  color: #303133;
}

.drives-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.drive-item {
  display: flex;
  align-items: center;
  padding: 12px;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s;
}

.drive-item:hover {
  border-color: #409eff;
  background: #f0f9ff;
}

.drive-icon {
  margin-right: 12px;
  color: #409eff;
}

.drive-info {
  flex: 1;
}

.drive-name {
  font-weight: 500;
  color: #303133;
  margin-bottom: 4px;
}

.drive-details {
  font-size: 12px;
  color: #909399;
}

.toolbar {
  margin-bottom: 12px;
  display: flex;
  gap: 8px;
}

.directories-list {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
}

.directory-item {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background 0.3s;
}

.directory-item:hover {
  background: #f5f7fa;
}

.directory-item:last-child {
  border-bottom: none;
}

.directory-icon {
  margin-right: 8px;
  color: #409eff;
}

.directory-info {
  flex: 1;
}

.directory-name {
  font-weight: 500;
  color: #303133;
}

.directory-path {
  font-size: 12px;
  color: #909399;
  margin-top: 2px;
}

.create-directory {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #ebeef5;
  display: flex;
  align-items: center;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>
