<template>
  <el-dialog
    :model-value="visible"
    @update:model-value="$emit('update:visible', $event)"
    :title="isEdit ? '编辑脚本' : '新建脚本'"
    width="85%"
    top="5vh"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    class="simple-script-dialog"
    @close="handleClose"
  >
    <div class="dialog-content">
      <!-- 基本信息表单 -->
      <el-form
        ref="formRef"
        :model="scriptForm"
        :rules="formRules"
        label-width="100px"
        class="script-form"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="脚本名称" prop="monitorSysGenScriptName">
              <el-input
                v-model="scriptForm.monitorSysGenScriptName"
                placeholder="请输入脚本名称"
                clearable
                maxlength="50"
                show-word-limit
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="脚本类型" prop="monitorSysGenScriptType">
              <el-select
                v-model="scriptForm.monitorSysGenScriptType"
                placeholder="请选择脚本类型"
                style="width: 100%"
                @change="handleTypeChange"
              >
                <el-option label="Shell" value="SHELL">
                  <div class="option-item">
                    <IconifyIconOnline icon="ri:terminal-line" />
                    <span>Shell</span>
                  </div>
                </el-option>
                <el-option label="Python" value="PYTHON">
                  <div class="option-item">
                    <IconifyIconOnline icon="ri:file-code-line" />
                    <span>Python</span>
                  </div>
                </el-option>
                <el-option label="PowerShell" value="POWERSHELL">
                  <div class="option-item">
                    <IconifyIconOnline icon="ri:windows-line" />
                    <span>PowerShell</span>
                  </div>
                </el-option>
                <el-option label="Batch" value="BATCH">
                  <div class="option-item">
                    <IconifyIconOnline icon="ri:file-text-line" />
                    <span>Batch</span>
                  </div>
                </el-option>
                <el-option label="JavaScript" value="JAVASCRIPT">
                  <div class="option-item">
                    <IconifyIconOnline icon="ri:javascript-line" />
                    <span>JavaScript</span>
                  </div>
                </el-option>
                <el-option label="SQL" value="SQL">
                  <div class="option-item">
                    <IconifyIconOnline icon="ri:database-2-line" />
                    <span>SQL</span>
                  </div>
                </el-option>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row>
          <el-col :span="24">
            <el-form-item
              label="脚本描述"
              prop="monitorSysGenScriptDescription"
            >
              <el-input
                v-model="scriptForm.monitorSysGenScriptDescription"
                type="textarea"
                :rows="2"
                placeholder="请输入脚本描述"
                maxlength="200"
                show-word-limit
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="脚本分类">
              <el-input
                v-model="scriptForm.monitorSysGenScriptCategory"
                placeholder="如: 系统管理、数据处理等"
                clearable
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="脚本状态">
              <el-radio-group v-model="scriptForm.monitorSysGenScriptStatus">
                <el-radio value="ENABLED">启用</el-radio>
                <el-radio value="DISABLED">禁用</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>

      <!-- 代码编辑器 -->
      <div class="code-editor-section">
        <div class="section-header">
          <h4>脚本内容</h4>
          <div class="editor-actions">
            <el-button size="small" @click="loadTemplate">
              <IconifyIconOnline icon="ri:file-add-line" />
              加载模板
            </el-button>
            <el-button size="small" @click="formatCode">
              <IconifyIconOnline icon="ri:code-s-slash-line" />
              格式化
            </el-button>
          </div>
        </div>

        <div class="code-editor-wrapper">
          <CodeEditor
            :content="scriptForm.monitorSysGenScriptContent"
            @update:content="handleContentChange"
            :options="{
              mode: getEditorLanguage(scriptForm.monitorSysGenScriptType),
            }"
            height="500px"
            :show-tool="true"
            placeholder="请输入脚本内容..."
          />
        </div>
      </div>
    </div>

    <!-- 对话框底部按钮 -->
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose" size="large">取消</el-button>
        <el-button
          type="primary"
          @click="handleSave"
          :loading="saving"
          size="large"
        >
          <IconifyIconOnline icon="ri:save-line" />
          保存脚本
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, nextTick } from "vue";
import type { FormInstance, FormRules } from "element-plus";
import { message } from "@repo/utils";
import * as ScriptAPI from "@/api/server/script-management";
import CodeEditor from "@/components/codeEditor/index.vue";
import { getScriptTemplate, getEditorLanguage } from "../utils";
import type { Script } from "../types";
import { ScriptType, ScriptStatus } from "../types";

// Props
interface Props {
  visible: boolean;
  scriptData?: Script | null;
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  scriptData: null,
});

// Emits
const emit = defineEmits<{
  "update:visible": [value: boolean];
  save: [];
}>();

// 响应式数据
const formRef = ref<FormInstance>();
const saving = ref(false);

const scriptForm = reactive<Partial<Script>>({
  monitorSysGenScriptId: undefined,
  monitorSysGenScriptName: "",
  monitorSysGenScriptType: ScriptType.SHELL,
  monitorSysGenScriptDescription: "",
  monitorSysGenScriptContent: "",
  monitorSysGenScriptStatus: ScriptStatus.ENABLED,
  monitorSysGenScriptCategory: "",
  monitorSysGenScriptVersion: "1.0.0",
  monitorSysGenScriptTimeout: 300,
});

// 表单验证规则
const formRules: FormRules = {
  monitorSysGenScriptName: [
    { required: true, message: "请输入脚本名称", trigger: "blur" },
    {
      min: 2,
      max: 50,
      message: "脚本名称长度在 2 到 50 个字符",
      trigger: "blur",
    },
  ],
  monitorSysGenScriptType: [
    { required: true, message: "请选择脚本类型", trigger: "change" },
  ],
  monitorSysGenScriptDescription: [
    { max: 200, message: "描述不能超过 200 个字符", trigger: "blur" },
  ],
};

// 计算属性
const isEdit = computed(() => !!props.scriptData?.monitorSysGenScriptId);

// 监听器
watch(
  () => props.visible,
  (newVal) => {
    if (newVal) {
      if (props.scriptData) {
        // 编辑模式
        Object.assign(scriptForm, {
          monitorSysGenScriptId: props.scriptData.monitorSysGenScriptId,
          monitorSysGenScriptName: props.scriptData.monitorSysGenScriptName,
          monitorSysGenScriptType: props.scriptData.monitorSysGenScriptType,
          monitorSysGenScriptDescription:
            props.scriptData.monitorSysGenScriptDescription || "",
          monitorSysGenScriptContent:
            props.scriptData.monitorSysGenScriptContent || "",
          monitorSysGenScriptStatus:
            props.scriptData.monitorSysGenScriptStatus || "ENABLED",
          monitorSysGenScriptCategory:
            props.scriptData.monitorSysGenScriptCategory || "",
          monitorSysGenScriptVersion:
            props.scriptData.monitorSysGenScriptVersion || "1.0.0",
          monitorSysGenScriptTimeout:
            props.scriptData.monitorSysGenScriptTimeout || 300,
        });
      } else {
        // 新建模式
        resetForm();
      }
    }
  },
  { immediate: true }
);

// 方法
const resetForm = () => {
  Object.assign(scriptForm, {
    monitorSysGenScriptId: undefined,
    monitorSysGenScriptName: "",
    monitorSysGenScriptType: ScriptType.SHELL,
    monitorSysGenScriptDescription: "",
    monitorSysGenScriptContent: "",
    monitorSysGenScriptStatus: ScriptStatus.ENABLED,
    monitorSysGenScriptCategory: "",
    monitorSysGenScriptVersion: "1.0.0",
    monitorSysGenScriptTimeout: 300,
  });
  loadTemplate();
  nextTick(() => {
    formRef.value?.clearValidate();
  });
};

const loadTemplate = () => {
  scriptForm.monitorSysGenScriptContent = getScriptTemplate(
    scriptForm.monitorSysGenScriptType!,
    scriptForm.monitorSysGenScriptDescription
  );
};

const handleTypeChange = () => {
  if (
    !scriptForm.monitorSysGenScriptContent ||
    scriptForm.monitorSysGenScriptContent ===
      getScriptTemplate(scriptForm.monitorSysGenScriptType!)
  ) {
    loadTemplate();
  }
};

const formatCode = () => {
  message("代码格式化功能开发中", { type: "info" });
};

const handleContentChange = (newContent: string) => {
  scriptForm.monitorSysGenScriptContent = newContent;
};

const handleClose = () => {
  emit("update:visible", false);
};

const handleSave = async () => {
  if (!formRef.value) return;

  try {
    await formRef.value.validate();

    if (!scriptForm.monitorSysGenScriptContent?.trim()) {
      message("请输入脚本内容", { type: "warning" });
      return;
    }

    saving.value = true;

    const response: any = scriptForm.monitorSysGenScriptId
      ? await ScriptAPI.updateScript(scriptForm)
      : await ScriptAPI.createScript(scriptForm);

    if (response.success) {
      message(
        scriptForm.monitorSysGenScriptId ? "脚本更新成功" : "脚本创建成功",
        { type: "success" }
      );
      emit("save");
      handleClose();
    } else {
      message(response.msg || "保存脚本失败", { type: "error" });
    }
  } catch (error: any) {
    console.error("保存脚本失败:", error);
    if (error !== false) {
      const errorMsg =
        error?.response?.data?.msg || error?.message || "保存脚本失败";
      message(errorMsg, { type: "error" });
    }
  } finally {
    saving.value = false;
  }
};
</script>

<style scoped lang="scss">
@import "../styles/variables.scss";
@import "../styles/mixins.scss";

.simple-script-dialog {
  :deep(.el-dialog) {
    border-radius: $radius-xl;
    overflow: hidden;
  }

  :deep(.el-dialog__header) {
    background: $primary-gradient;
    color: white;
    padding: $spacing-xl $spacing-2xl;
    margin: 0;

    .el-dialog__title {
      font-size: $font-size-xl;
      font-weight: $font-weight-semibold;
      color: white;
    }

    .el-dialog__headerbtn {
      top: $spacing-xl;
      right: $spacing-2xl;

      .el-dialog__close {
        color: white;
        font-size: 20px;

        &:hover {
          color: rgba(255, 255, 255, 0.8);
        }
      }
    }
  }

  :deep(.el-dialog__body) {
    padding: 0;
    max-height: 80vh;
    overflow-y: auto;
    @include scrollbar;
  }
}

.dialog-content {
  display: flex;
  flex-direction: column;
}

.script-form {
  padding: $spacing-2xl;
  border-bottom: 1px solid $border-light;
  background: $bg-secondary;

  .option-item {
    @include flex-align-center;
    gap: $spacing-sm;
  }
}

.code-editor-section {
  padding: $spacing-2xl;

  .section-header {
    @include flex-between;
    margin-bottom: $spacing-lg;

    h4 {
      margin: 0;
      font-size: $font-size-lg;
      font-weight: $font-weight-semibold;
      color: $text-primary;
    }

    .editor-actions {
      display: flex;
      gap: $spacing-sm;
    }
  }

  .code-editor-wrapper {
    border: 1px solid $border-light;
    border-radius: $radius-lg;
    overflow: hidden;
    background: var(--el-bg-color-overlay);
  }
}

.dialog-footer {
  @include flex-between;
  padding: $spacing-xl $spacing-2xl;
  background: $bg-secondary;
  border-top: 1px solid $border-light;

  .el-button {
    min-width: 100px;
  }
}
</style>
