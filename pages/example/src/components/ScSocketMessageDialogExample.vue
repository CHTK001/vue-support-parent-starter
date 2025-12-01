<template>
  <div class="example-container">
    <h2 class="example-title">ScSocketMessageDialog Socket消息对话框示例</h2>
    <p class="example-desc">
      用于显示实时Socket消息、进度等，支持多种布局模式和靠边吸附功能
    </p>

    <el-divider content-position="left">功能演示</el-divider>

    <div class="demo-section">
      <div class="demo-controls">
        <el-button type="primary" @click="showDialog">
          <IconifyIconOnline icon="ri:broadcast-line" class="mr-1" />
          显示对话框
        </el-button>
        <el-button @click="simulateProgress">
          <IconifyIconOnline icon="ri:play-line" class="mr-1" />
          模拟进度
        </el-button>
        <el-button @click="addLog">
          <IconifyIconOnline icon="ri:file-list-line" class="mr-1" />
          添加日志
        </el-button>
        <el-button type="warning" plain @click="resetDialog">
          <IconifyIconOnline icon="ri:refresh-line" class="mr-1" />
          重置
        </el-button>
      </div>

      <el-divider content-position="left">属性配置</el-divider>

      <el-form label-width="140px" class="config-form">
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="布局模式">
              <el-select v-model="config.layout" style="width: 100%">
                <el-option label="进度条" value="process" />
                <el-option label="日志" value="log" />
                <el-option label="自定义" value="custom" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="显示模式">
              <el-select v-model="config.mode" style="width: 100%">
                <el-option label="内嵌" value="embed" />
                <el-option label="弹框" value="dialog" />
              </el-select>
            </el-form-item>
          </el-col>
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
        </el-row>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="启用靠边吸附">
              <el-switch v-model="config.enableEdgeDock" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="启用Grid吸附">
              <el-switch v-model="config.enableGridSnap" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="高度">
              <el-input-number
                v-model="config.height"
                :min="100"
                :max="400"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>

      <!-- 内嵌模式预览 -->
      <div v-if="config.mode === 'embed'" class="embed-preview">
        <h4>内嵌模式预览</h4>
        <ScSocketMessageDialog
          ref="embedDialogRef"
          mode="embed"
          :layout="config.layout"
          title="同步进度"
          event-id="example-embed-event"
          event-name="example-embed-progress"
          data-type="default"
          :height="config.height"
        />
      </div>
    </div>

    <el-divider content-position="left">代码示例</el-divider>

    <CodePreview :tabs="codeTabs" />

    <el-divider content-position="left">新增属性说明</el-divider>

    <el-table :data="newProps" border stripe class="props-table">
      <el-table-column prop="name" label="属性名" width="180" />
      <el-table-column prop="type" label="类型" width="200" />
      <el-table-column prop="default" label="默认值" width="120" />
      <el-table-column prop="description" label="说明" />
    </el-table>

    <!-- 弹框模式实例 -->
    <ScSocketMessageDialog
      v-if="config.mode === 'dialog'"
      ref="dialogDialogRef"
      mode="dialog"
      :layout="config.layout"
      :position="config.position"
      title="Socket消息"
      event-id="example-dialog-event"
      event-name="example-dialog-progress"
      data-type="default"
      :visible="dialogVisible"
      :enable-edge-dock="config.enableEdgeDock"
      :enable-grid-snap="config.enableGridSnap"
      :height="config.height"
      @update:visible="dialogVisible = $event"
      @edge-dock="handleEdgeDock"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from "vue";
import { ElMessage } from "element-plus";
import ScSocketMessageDialog from "@repo/components/ScSocketMessageDialog/index.vue";
import CodePreview from "./CodePreview.vue";

/**
 * ScSocketMessageDialog 组件示例
 * @author CH
 * @version 1.0.0
 * @since 2025-12-01
 */

const embedDialogRef = ref();
const dialogDialogRef = ref();
const dialogVisible = ref(false);

const config = reactive({
  mode: "embed" as "embed" | "dialog",
  layout: "process" as "process" | "log" | "custom",
  position: "bottom-right" as const,
  enableEdgeDock: true,
  enableGridSnap: false,
  height: 200,
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

const currentDialogRef = computed(() => {
  return config.mode === "embed" ? embedDialogRef.value : dialogDialogRef.value;
});

// 代码示例标签页
const codeTabs = computed(() => [
  {
    key: "template",
    label: "模板",
    icon: "ri:code-s-slash-line",
    language: "vue",
    code: `<ScSocketMessageDialog
  ref="dialogRef"
  mode="${config.mode}"
  layout="${config.layout}"
  position="${config.position}"
  title="Socket消息"
  event-id="my-event-id"
  event-name="progress-event"
  data-type="default"
  :visible="dialogVisible"
  :enable-edge-dock="${config.enableEdgeDock}"
  :enable-grid-snap="${config.enableGridSnap}"
  :height="${config.height}"
  @update:visible="dialogVisible = $event"
  @edge-dock="handleEdgeDock"
/>`,
  },
  {
    key: "script",
    label: "脚本",
    icon: "ri:javascript-line",
    language: "ts",
    code: `import { ref } from "vue";
import ScSocketMessageDialog from "@repo/components/ScSocketMessageDialog/index.vue";

const dialogRef = ref();
const dialogVisible = ref(false);

// 显示对话框
function showDialog() {
  dialogVisible.value = true;
  dialogRef.value?.show();
}

// 模拟进度更新
function simulateProgress() {
  dialogRef.value?.updateProgress({
    eventId: "my-event-id",
    message: "正在处理...",
    percentage: 50,
    status: "processing"
  });
}

// 添加日志
function addLog() {
  dialogRef.value?.addLog("执行任务...", 0);
}

// 重置
function resetDialog() {
  dialogRef.value?.resetProgress();
}

// 处理靠边吸附
function handleEdgeDock(docked, edge) {
  console.log("吸附状态:", docked, edge);
}`,
  },
]);

function showDialog() {
  if (config.mode === "dialog") {
    dialogVisible.value = true;
  }
  currentDialogRef.value?.show();
}

function simulateProgress() {
  const dialogRef = currentDialogRef.value;
  if (!dialogRef) {
    ElMessage.warning("请先显示对话框");
    return;
  }

  let progress = 0;
  const eventId =
    config.mode === "embed" ? "example-embed-event" : "example-dialog-event";

  const interval = setInterval(() => {
    progress += Math.floor(Math.random() * 15) + 5;

    if (progress >= 100) {
      progress = 100;
      clearInterval(interval);

      dialogRef.updateProgress({
        eventId,
        message: "操作完成！",
        percentage: 100,
        status: "success",
      });

      ElMessage.success("进度模拟完成");
    } else {
      dialogRef.updateProgress({
        eventId,
        message: `正在处理... ${progress}%`,
        percentage: progress,
        status: "processing",
      });
    }
  }, 500);
}

function addLog() {
  const dialogRef = currentDialogRef.value;
  if (!dialogRef) {
    ElMessage.warning("请先显示对话框");
    return;
  }

  const messages = [
    "开始执行任务...",
    "正在连接服务器...",
    "正在下载文件...",
    "正在解压文件...",
    "正在安装依赖...",
    "正在编译代码...",
    "正在运行测试...",
    "任务执行完成！",
  ];

  const message = messages[Math.floor(Math.random() * messages.length)];
  dialogRef.addLog(message, Math.floor(Math.random() * 3));

  ElMessage.info("已添加日志");
}

function resetDialog() {
  currentDialogRef.value?.resetProgress();
  ElMessage.info("已重置");
}

function handleEdgeDock(docked: boolean, edge: string) {
  if (docked) {
    ElMessage.info(
      `已吸附到${edge === "left" ? "左" : edge === "right" ? "右" : edge === "top" ? "上" : "下"}边缘`
    );
  }
}
</script>

<style scoped lang="scss">
.example-container {
  padding: 20px;
}

.example-title {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 8px;
  color: var(--el-text-color-primary);
}

.example-desc {
  color: var(--el-text-color-secondary);
  margin-bottom: 20px;
}

.demo-section {
  background: var(--el-fill-color-lighter);
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

.props-table {
  margin-bottom: 20px;
}

.embed-preview {
  margin-top: 20px;
  padding: 16px;
  background: var(--el-bg-color);
  border-radius: 8px;
  border: 1px solid var(--el-border-color-light);
}

.embed-preview h4 {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 12px;
  color: var(--el-text-color-primary);
}
</style>
