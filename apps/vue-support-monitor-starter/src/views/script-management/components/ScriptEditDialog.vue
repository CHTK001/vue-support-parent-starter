<template>
  <sc-dialog
    :model-value="visible"
    :title="isEdit ? '编辑脚本' : '新建脚本'"
    width="85%"
    top="5vh"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    class="simple-script-dialog"
    @update:model-value="$emit('update:visible', $event)"
    @close="handleClose"
  >
    <div class="dialog-content">
      <!-- 基本信息表单 -->
      <ScForm
        ref="formRef"
        :model="scriptForm"
        :rules="formRules"
        label-width="100px"
        class="script-form"
      >
        <ScRow :gutter="20">
          <ScCol :span="12">
            <ScFormItem label="脚本名称" prop="monitorSysGenScriptName">
              <ScInput
                v-model="scriptForm.monitorSysGenScriptName"
                placeholder="请输入脚本名称"
                clearable
                maxlength="50"
                show-word-limit
              />
            </ScFormItem>
          </ScCol>
          <ScCol :span="12">
            <ScFormItem label="脚本类型" prop="monitorSysGenScriptType">
              <ScSelect
                v-model="scriptForm.monitorSysGenScriptType"
                placeholder="请选择脚本类型"
                style="width: 100%"
                @change="handleTypeChange"
              >
                <ScOption label="Shell" value="SHELL">
                  <div class="option-item">
                    <IconifyIconOnline icon="ri:terminal-line" />
                    <span>Shell</span>
                  </div>
                </ScOption>
                <ScOption label="Python" value="PYTHON">
                  <div class="option-item">
                    <IconifyIconOnline icon="ri:file-code-line" />
                    <span>Python</span>
                  </div>
                </ScOption>
                <ScOption label="PowerShell" value="POWERSHELL">
                  <div class="option-item">
                    <IconifyIconOnline icon="ri:windows-line" />
                    <span>PowerShell</span>
                  </div>
                </ScOption>
                <ScOption label="Batch" value="BATCH">
                  <div class="option-item">
                    <IconifyIconOnline icon="ri:file-text-line" />
                    <span>Batch</span>
                  </div>
                </ScOption>
                <ScOption label="JavaScript" value="JAVASCRIPT">
                  <div class="option-item">
                    <IconifyIconOnline icon="ri:javascript-line" />
                    <span>JavaScript</span>
                  </div>
                </ScOption>
                <ScOption label="SQL" value="SQL">
                  <div class="option-item">
                    <IconifyIconOnline icon="ri:database-2-line" />
                    <span>SQL</span>
                  </div>
                </ScOption>
              </ScSelect>
            </ScFormItem>
          </ScCol>
        </ScRow>

        <ScRow>
          <ScCol :span="24">
            <ScFormItem
              label="脚本描述"
              prop="monitorSysGenScriptDescription"
            >
              <ScInput
                v-model="scriptForm.monitorSysGenScriptDescription"
                type="textarea"
                :rows="2"
                placeholder="请输入脚本描述"
                maxlength="200"
                show-word-limit
              />
            </ScFormItem>
          </ScCol>
        </ScRow>

        <ScRow :gutter="20">
          <ScCol :span="12">
            <ScFormItem label="脚本分类">
              <ScInput
                v-model="scriptForm.monitorSysGenScriptCategory"
                placeholder="如: 系统管理、数据处理等"
                clearable
              />
            </ScFormItem>
          </ScCol>
          <ScCol :span="12">
            <ScFormItem label="脚本状态">
              <ScRadioGroup v-model="scriptForm.monitorSysGenScriptStatus">
                <ScRadio value="ENABLED">启用</ScRadio>
                <ScRadio value="DISABLED">禁用</ScRadio>
              </ScRadioGroup>
            </ScFormItem>
          </ScCol>
        </ScRow>
      </ScForm>

      <!-- 代码编辑器 -->
      <div class="code-editor-section">
        <div class="section-header">
          <h4>脚本内容</h4>
          <div class="editor-actions">
            <ScButton size="small" @click="loadTemplate">
              <IconifyIconOnline icon="ri:file-add-line" />
              加载模板
            </ScButton>
            <ScButton size="small" @click="formatCode">
              <IconifyIconOnline icon="ri:code-s-slash-line" />
              格式化
            </ScButton>
          </div>
        </div>

        <div class="code-editor-wrapper">
          <CodeEditor
            :content="scriptForm.monitorSysGenScriptContent"
            :options="{
              mode: getEditorLanguage(scriptForm.monitorSysGenScriptType),
            }"
            height="500px"
            :show-tool="true"
            placeholder="请输入脚本内容..."
            @update:content="handleContentChange"
          />
        </div>
      </div>
    </div>

    <!-- 对话框底部按钮 -->
    <template #footer>
      <div class="dialog-footer">
        <ScButton size="large" @click="handleClose">取消</ScButton>
        <ScButton
          type="primary"
          :loading="saving"
          size="large"
          @click="handleSave"
        >
          <IconifyIconOnline icon="ri:save-line" />
          保存脚本
        </ScButton>
      </div>
    </template>
  </sc-dialog>
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
  { immediate: true },
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
    scriptForm.monitorSysGenScriptDescription,
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
        { type: "success" },
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
.simple-script-dialog {
  :deep(.el-dialog) {
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
  }

  :deep(.el-dialog__header) {
    background: linear-gradient(
      135deg,
      var(--el-color-primary),
      var(--el-color-primary-light-3)
    );
    color: white;
    padding: 20px 24px;
    margin: 0;

    .el-dialog__title {
      font-size: 18px;
      font-weight: 600;
      color: white;
    }

    .el-dialog__headerbtn {
      top: 20px;
      right: 24px;

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

    &::-webkit-scrollbar {
      width: 6px;
    }

    &::-webkit-scrollbar-thumb {
      background: var(--el-border-color);
      border-radius: 3px;
    }
  }

  :deep(.el-dialog__footer) {
    padding: 0;
  }
}

.dialog-content {
  display: flex;
  flex-direction: column;
}

.script-form {
  padding: 24px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  background: var(--el-fill-color-lighter);

  :deep(.el-form-item__label) {
    font-weight: 500;
    color: var(--el-text-color-primary);
  }

  :deep(.el-input__wrapper),
  :deep(.el-textarea__inner),
  :deep(.el-select__wrapper) {
    border-radius: 8px;
  }

  .option-item {
    display: flex;
    align-items: center;
    gap: 8px;

    .iconify {
      font-size: 16px;
    }
  }
}

.code-editor-section {
  padding: 24px;
  background: var(--el-bg-color);

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;

    h4 {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      color: var(--el-text-color-primary);
      display: flex;
      align-items: center;
      gap: 8px;

      &::before {
        content: "";
        display: block;
        width: 4px;
        height: 18px;
        background: linear-gradient(
          180deg,
          var(--el-color-primary),
          var(--el-color-primary-light-3)
        );
        border-radius: 2px;
      }
    }

    .editor-actions {
      display: flex;
      gap: 8px;

      .el-button {
        border-radius: 8px;
      }
    }
  }

  .code-editor-wrapper {
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 12px;
    overflow: hidden;
    background: var(--el-bg-color-overlay);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  background: var(--el-fill-color-lighter);
  border-top: 1px solid var(--el-border-color-lighter);

  .el-button {
    min-width: 100px;
    border-radius: 8px;
    height: 40px;

    &.el-button--primary {
      box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
    }
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
