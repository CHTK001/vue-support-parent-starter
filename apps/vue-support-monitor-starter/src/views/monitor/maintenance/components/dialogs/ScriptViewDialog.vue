<template>
  <el-dialog v-model="visible" top="10px" title="脚本内容" width="80%" :close-on-click-modal="false">
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
        <el-button type="success" @click="execute">
          <IconifyIconOnline icon="ri:play-line" class="mr-1" />
          执行
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, defineEmits, defineExpose } from "vue";
import ScCodeEditor from "@repo/components/ScCodeEditor/index.vue";
import "codemirror/mode/shell/shell.js";
import "codemirror/theme/idea.css";
import "codemirror/addon/selection/active-line.js";
import "codemirror/addon/edit/matchbrackets.js";

const emit = defineEmits(["update:visible", "execute", "close"]);

const visible = ref(false);
const scriptId = ref(null);
const scriptName = ref("");
const scriptPath = ref("");
const scriptDesc = ref("");
const scriptContent = ref("");

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
  visible.value = true;
};

// 关闭对话框
const close = () => {
  visible.value = false;
  emit("close");
};

// 执行脚本
const execute = () => {
  emit("execute", {
    maintenanceScriptId: scriptId.value,
    maintenanceScriptName: scriptName.value,
    maintenanceScriptDesc: scriptDesc.value
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
