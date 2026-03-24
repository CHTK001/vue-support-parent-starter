<template>
  <div class="example-container">
    <h2 class="example-title">ScSocketMessageDialog Socket消息对话框示例</h2>
    <p class="example-desc">
      用于显示实时Socket消息、进度等，支持多种布局模式和 interact.js 拖拽/缩放
    </p>

    <ScDivider content-position="left">功能演示</ScDivider>

    <div class="demo-section">
      <div class="demo-controls">
        <ScButton type="primary" @click="showDialog">
          <IconifyIconOnline icon="ri:broadcast-line" class="mr-1" />
          显示对话框
        </ScButton>
        <ScButton @click="simulateProgress">
          <IconifyIconOnline icon="ri:play-line" class="mr-1" />
          模拟进度
        </ScButton>
        <ScButton @click="addLog">
          <IconifyIconOnline icon="ri:file-list-line" class="mr-1" />
          添加日志
        </ScButton>
        <ScButton type="warning" plain @click="resetDialog">
          <IconifyIconOnline icon="ri:refresh-line" class="mr-1" />
          重置
        </ScButton>
      </div>

      <ScDivider content-position="left">属性配置</ScDivider>

      <ScForm label-width="140px" class="config-form">
        <ScRow :gutter="20">
          <ScCol :span="8">
            <ScFormItem label="布局模式">
              <ScSelect v-model="config.layout" style="width: 100%">
                <ScOption label="进度条" value="process" />
                <ScOption label="日志" value="log" />
                <ScOption label="自定义" value="custom" />
              </ScSelect>
            </ScFormItem>
          </ScCol>
          <ScCol :span="8">
            <ScFormItem label="显示模式">
              <ScSelect v-model="config.mode" style="width: 100%">
                <ScOption label="内嵌" value="embed" />
                <ScOption label="弹框" value="dialog" />
              </ScSelect>
            </ScFormItem>
          </ScCol>
          <ScCol :span="8">
            <ScFormItem label="位置">
              <ScSelect v-model="config.position" style="width: 100%">
                <ScOption label="右下角" value="bottom-right" />
                <ScOption label="左下角" value="bottom-left" />
                <ScOption label="右上角" value="top-right" />
                <ScOption label="左上角" value="top-left" />
              </ScSelect>
            </ScFormItem>
          </ScCol>
        </ScRow>
        <ScRow :gutter="20">
          <ScCol :span="8">
            <ScFormItem label="高度">
              <ScInputNumber 
                v-model="config.height"
                :min="100"
                :max="400"
                style="width: 100%"
              />
            </ScFormItem>
          </ScCol>
          <ScCol :span="8">
            <ScFormItem label="宽度">
              <ScInputNumber 
                v-model="config.width"
                :min="300"
                :max="600"
                style="width: 100%"
              />
            </ScFormItem>
          </ScCol>
        </ScRow>
      </ScForm>

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

    <ScDivider content-position="left">代码示例</ScDivider>

    <CodePreview :tabs="codeTabs" />

    <ScDivider content-position="left">新增属性说明</ScDivider>

    <ScTable :data="newProps" border stripe class="props-table">
      <ScTableColumn prop="name" label="属性名" width="180" />
      <ScTableColumn prop="type" label="类型" width="200" />
      <ScTableColumn prop="default" label="默认值" width="120" />
      <ScTableColumn prop="description" label="说明" />
    </ScTable>

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
      :height="config.height"
      :width="config.width"
      @update:visible="dialogVisible = $event"
      @close="handleClose"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from "vue";
import { message } from "@repo/utils";
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
  height: 200,
  width: 400,
});

// 属性说明
const newProps = [
  {
    name: "mode",
    type: "'embed' | 'dialog'",
    default: "'embed'",
    description: "显示模式：内嵌或弹框",
  },
  {
    name: "layout",
    type: "'process' | 'log' | 'custom'",
    default: "'process'",
    description: "布局类型：进度条、日志或自定义",
  },
  {
    name: "position",
    type: "'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'",
    default: "'bottom-right'",
    description: "初始位置（四个角落）",
  },
  {
    name: "width",
    type: "number",
    default: "400",
    description: "弹框宽度",
  },
  {
    name: "dialogHeight",
    type: "number",
    default: "300",
    description: "弹框高度",
  },
  {
    name: "eventId",
    type: "string | number",
    default: "-",
    description: "事件ID，用于过滤Socket消息",
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
  :width="${config.width}"
  :height="${config.height}"
  @update:visible="dialogVisible = $event"
  @close="handleClose"
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

// 关闭
function handleClose() {
  console.log("对话框已关闭");
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
    message("请先显示对话框", { type: "warning" });
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

      message("进度模拟完成", { type: "success" });
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
    message("请先显示对话框", { type: "warning" });
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

  message("已添加日志", { type: "info" });
}

function resetDialog() {
  currentDialogRef.value?.resetProgress();
  message("已重置", { type: "info" });
}

function handleClose() {
  message("对话框已关闭", { type: "info" });
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
