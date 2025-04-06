<template>
  <el-dialog v-model="visible" :append-to-body="true" top="10px" title="脚本内容" width="80%" :close-on-click-modal="false">
    <div class="code-view">
      <ScCodeEditor v-model="scriptContent" height="500px" mode="text/x-sh" :options="editorOptions" :readOnly="true" />
    </div>
    <div class="script-info">
      <div class="info-item">
        <span class="info-label">名称：</span>
        <span class="info-value">{{ scriptName }}</span>
      </div>
      <div class="info-item">
        <span class="info-label">路径：</span>
        <span class="info-value">{{ scriptPath || "/" }}</span>
      </div>
      <div class="info-item">
        <span class="info-label">描述：</span>
        <span class="info-value">{{ scriptDesc || "暂无描述" }}</span>
      </div>
    </div>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="close">关闭</el-button>
        <el-button type="success" @click="sync">
          <IconifyIconOnline icon="ri:refresh-line" class="mr-1" />
          同步到主机
        </el-button>
      </div>
    </template>
  </el-dialog>
  <task-monitor-dialog ref="taskMonitorDialogRef" :task-id="currentTaskId" />
</template>

<script setup>
import { ref, defineEmits, defineExpose, defineAsyncComponent } from "vue";
import { ElMessageBox } from "element-plus";
import { message } from "@repo/utils";
import { syncMaintenanceScript } from "@/api/monitor/maintenance";
import ScCodeEditor from "@repo/components/ScCodeEditor/index.vue";
import "codemirror/mode/shell/shell.js";
import "codemirror/theme/idea.css";
import "codemirror/addon/selection/active-line.js";
import "codemirror/addon/edit/matchbrackets.js";

// 异步加载任务监控对话框
const TaskMonitorDialog = defineAsyncComponent(() => import("./TaskMonitorDialog.vue"));

const emit = defineEmits(["update:visible", "close"]);

const visible = ref(false);
const scriptId = ref(null);
const scriptName = ref("");
const scriptPath = ref("");
const scriptDesc = ref("");
const scriptContent = ref("");
const groupId = ref(null);
const currentTaskId = ref(null);
const taskMonitorDialogRef = ref(null);

// 编辑器配置
const editorOptions = {
  lineNumbers: true,
  theme: "darcula",
  lineWrapping: true,
  styleActiveLine: true
};

// 打开对话框
const open = script => {
  scriptId.value = script.maintenanceScriptId;
  scriptName.value = script.maintenanceScriptName;
  scriptPath.value = script.maintenanceScriptPath;
  scriptDesc.value = script.maintenanceScriptDesc;
  scriptContent.value = script.maintenanceScriptContent;
  groupId.value = script.maintenanceGroupId;
  visible.value = true;
};

// 关闭对话框
const close = () => {
  visible.value = false;
  emit("close");
};

// 同步脚本到主机
const sync = () => {
  // 确认同步
  ElMessageBox.confirm(`确认将脚本 "${scriptName.value}" 同步到维护组下所有启用的主机吗？`, "同步确认", {
    confirmButtonText: "确认同步",
    cancelButtonText: "取消",
    type: "warning"
  })
    .then(() => {
      message(`正在同步脚本...`, { type: "info" });

      syncMaintenanceScript(scriptId.value)
        .then(res => {
          console.log("同步脚本响应：", res);
          message("同步请求已发送，请查看系统消息获取进度", { type: "success" });
          // 可以打开任务监控对话框查看进度
          if (res.data) {
            currentTaskId.value = res.data;
            taskMonitorDialogRef.value?.open(res.data);
          }
          close();
        })
        .catch(error => {
          console.error("同步脚本失败:", error);
          message("同步脚本失败", { type: "error" });
        });
    })
    .catch(() => {
      // 用户取消操作
    });
};

defineExpose({
  open,
  close
});
</script>

<style lang="scss" scoped>
.code-view {
  height: 500px;
  overflow: hidden;
  border-radius: 4px;
}

.script-info {
  margin-top: 16px;
  padding: 16px;
  background-color: var(--el-fill-color-light);
  border-radius: 4px;

  .info-item {
    margin-bottom: 8px;
    display: flex;

    &:last-child {
      margin-bottom: 0;
    }

    .info-label {
      font-weight: 500;
      color: var(--el-text-color-secondary);
      min-width: 60px;
    }

    .info-value {
      flex: 1;
      word-break: break-all;
    }
  }
}

.mr-1 {
  margin-right: 4px;
}
</style>
