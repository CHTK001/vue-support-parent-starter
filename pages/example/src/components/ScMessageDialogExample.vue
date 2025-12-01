<template>
  <div class="example-container">
    <h2 class="example-title">ScMessageDialog 消息对话框示例</h2>
    <p class="example-desc">
      用于显示操作进度、消息通知等，支持拖拽、靠边吸附、Grid吸附等功能
    </p>

    <el-divider content-position="left">功能演示</el-divider>

    <div class="demo-section">
      <div class="demo-controls">
        <el-button type="primary" @click="showDialog">
          <IconifyIconOnline icon="ri:message-3-line" class="mr-1" />
          显示对话框
        </el-button>
        <el-button @click="addOperation">
          <IconifyIconOnline icon="ri:add-line" class="mr-1" />
          添加操作
        </el-button>
        <el-button @click="simulateProgress" :disabled="!hasRunningOp">
          <IconifyIconOnline icon="ri:play-line" class="mr-1" />
          模拟进度
        </el-button>
        <el-button type="danger" plain @click="clearOperations">
          <IconifyIconOnline icon="ri:delete-bin-line" class="mr-1" />
          清空
        </el-button>
      </div>

      <el-divider content-position="left">属性配置</el-divider>

      <el-form label-width="140px" class="config-form">
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="位置">
              <el-select v-model="config.position" style="width: 100%">
                <el-option label="右下角" value="bottom-right" />
                <el-option label="左下角" value="bottom-left" />
                <el-option label="右上角" value="top-right" />
                <el-option label="左上角" value="top-left" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="主题色">
              <el-color-picker v-model="config.themeColor" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="启用靠边吸附">
              <el-switch v-model="config.enableEdgeDock" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="启用Grid吸附">
              <el-switch v-model="config.enableGridSnap" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="Grid大小">
              <el-input-number
                v-model="config.gridSize"
                :min="10"
                :max="50"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="吸附阈值">
              <el-input-number
                v-model="config.edgeDockThreshold"
                :min="20"
                :max="100"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </div>

    <el-divider content-position="left">新增属性说明</el-divider>

    <el-table :data="newProps" border stripe>
      <el-table-column prop="name" label="属性名" width="180" />
      <el-table-column prop="type" label="类型" width="200" />
      <el-table-column prop="default" label="默认值" width="120" />
      <el-table-column prop="description" label="说明" />
    </el-table>

    <!-- ScMessageDialog 组件实例 -->
    <ScMessageDialog
      ref="dialogRef"
      :title="config.title"
      :icon="config.icon"
      :position="config.position"
      :theme-color="config.themeColor"
      :operations="operations"
      :enable-edge-dock="config.enableEdgeDock"
      :edge-dock-threshold="config.edgeDockThreshold"
      :enable-grid-snap="config.enableGridSnap"
      :grid-size="config.gridSize"
      @clear="handleClear"
      @expand="handleExpand"
      @edge-dock="handleEdgeDock"
      @close="handleDialogClose"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from "vue";
import { ElMessage } from "element-plus";
import ScMessageDialog from "@repo/components/ScMessageDialog/index.vue";

/**
 * ScMessageDialog 组件示例
 * @author CH
 * @version 1.0.0
 * @since 2025-12-01
 */

interface Operation {
  id: string;
  type: string;
  title: string;
  description: string;
  status: "pending" | "running" | "completed" | "failed";
  progress?: number;
  createdAt?: number;
}

const dialogRef = ref();
const operations = ref<Operation[]>([]);
let opId = 0;

const config = reactive({
  title: "操作监控",
  icon: "ri:terminal-box-line",
  position: "bottom-right" as const,
  themeColor: "#3b82f6",
  enableEdgeDock: true,
  edgeDockThreshold: 50,
  enableGridSnap: false,
  gridSize: 20,
});

// 新增属性说明
const newProps = [
  {
    name: "enableEdgeDock",
    type: "boolean",
    default: "false",
    description: "是否启用靠边吸附最小化，拖拽到边缘时自动吸附为圆形图标",
  },
  {
    name: "edgeDockThreshold",
    type: "number",
    default: "50",
    description: "吸附边缘的阈值（距离边缘多少像素时自动吸附）",
  },
  {
    name: "boundaryElement",
    type: "string | HTMLElement",
    default: "null",
    description: "父元素选择器或元素，限制在父元素内移动",
  },
  {
    name: "enableGridSnap",
    type: "boolean",
    default: "false",
    description: "是否启用 grid 方式移动，拖拽时自动对齐到网格",
  },
  {
    name: "gridSize",
    type: "number",
    default: "20",
    description: "grid 单元格大小（像素）",
  },
  {
    name: "dockIconSize",
    type: "number",
    default: "48",
    description: "吸附图标大小（像素）",
  },
];

const hasRunningOp = computed(() =>
  operations.value.some((op) => op.status === "running")
);

function showDialog() {
  dialogRef.value?.toggleExpand();
}

function addOperation() {
  const types = ["upload", "download", "build", "create", "start", "stop"];
  const type = types[Math.floor(Math.random() * types.length)];

  operations.value.push({
    id: `op-${++opId}`,
    type,
    title: `${type} 操作 #${opId}`,
    description: `这是一个 ${type} 类型的操作示例`,
    status: "running",
    progress: 0,
    createdAt: Date.now(),
  });

  ElMessage.success("已添加新操作");
}

function simulateProgress() {
  const runningOps = operations.value.filter((op) => op.status === "running");
  if (runningOps.length === 0) return;

  runningOps.forEach((op) => {
    const interval = setInterval(() => {
      const idx = operations.value.findIndex((o) => o.id === op.id);
      if (idx === -1) {
        clearInterval(interval);
        return;
      }

      const current = operations.value[idx];
      const newProgress =
        (current.progress || 0) + Math.floor(Math.random() * 20) + 5;

      if (newProgress >= 100) {
        operations.value[idx] = {
          ...current,
          progress: 100,
          status: "completed",
        };
        clearInterval(interval);
        ElMessage.success(`操作 ${current.title} 完成`);
      } else {
        operations.value[idx] = { ...current, progress: newProgress };
      }
    }, 500);
  });
}

function clearOperations() {
  operations.value = [];
  ElMessage.info("已清空所有操作");
}

function handleClear() {
  operations.value = operations.value.filter(
    (op) => op.status === "pending" || op.status === "running"
  );
}

function handleExpand(expanded: boolean) {
  console.log("展开状态:", expanded);
}

function handleEdgeDock(docked: boolean, edge: string) {
  if (docked) {
    ElMessage.info(
      `已吸附到${edge === "left" ? "左" : edge === "right" ? "右" : edge === "top" ? "上" : "下"}边缘`
    );
  }
}

function handleDialogClose() {
  ElMessage.info("对话框已关闭（销毁）");
}
</script>

<style scoped>
.example-container {
  padding: 20px;
}

.example-title {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 8px;
}

.example-desc {
  color: #666;
  margin-bottom: 20px;
}

.demo-section {
  background: #fafafa;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
}

.demo-controls {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 20px;
}

.config-form {
  margin-top: 16px;
}
</style>
