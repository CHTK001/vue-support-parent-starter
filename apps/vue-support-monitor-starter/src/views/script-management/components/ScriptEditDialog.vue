<template>
  <el-dialog
    :model-value="visible"
    @update:model-value="$emit('update:visible', $event)"
    :title="isEdit ? '编辑脚本' : '新建脚本'"
    width="80%"
    top="20px"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    :append-to-body="true"
    :destroy-on-close="true"
    class="script-edit-dialog"
    @close="handleClose"
  >
    <div class="dialog-content">
      <el-tabs v-model="activeSubTab">
        <!-- 子Tab：编辑 -->
        <el-tab-pane label="编辑" name="edit">
          <!-- 基本信息表单 -->
          <div class="script-form">
            <el-form
              ref="formRef"
              :model="scriptForm"
              :rules="formRules"
              label-width="100px"
              class="script-form-content"
            >
              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item label="脚本名称" prop="monitorSysGenScriptName">
                    <el-input
                      v-model="scriptForm.monitorSysGenScriptName"
                      placeholder="请输入脚本名称"
                      clearable
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
                      <el-option label="Shell" value="SHELL" />
                      <el-option label="Python" value="PYTHON" />
                      <el-option label="PowerShell" value="POWERSHELL" />
                      <el-option label="Batch" value="BATCH" />
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

              <el-row>
                <el-col :span="12">
                  <el-form-item
                    label="脚本状态"
                    prop="monitorSysGenScriptStatus"
                  >
                    <el-radio-group
                      v-model="scriptForm.monitorSysGenScriptStatus"
                    >
                      <el-radio value="ENABLED">启用</el-radio>
                      <el-radio value="DISABLED">禁用</el-radio>
                    </el-radio-group>
                  </el-form-item>
                </el-col>
              </el-row>
            </el-form>
          </div>

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
                height="400px"
                :show-tool="true"
                placeholder="请输入脚本内容..."
              />
            </div>
          </div>
        </el-tab-pane>

        <!-- 子Tab：上传记录（仅编辑模式显示） -->
        <el-tab-pane label="上传记录" name="upload-records" v-if="isEdit">
          <ScriptUploadRecords :script-id="scriptForm.monitorSysGenScriptId" />
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- 对话框底部按钮 -->
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="success" @click="handleSave" :loading="saving">
          <IconifyIconOnline icon="ri:save-line" />
          保存脚本
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, nextTick } from "vue";
import { ElMessage, type FormInstance, type FormRules } from "element-plus";
import ScriptUploadRecords from "./ScriptUploadRecords.vue";
import { saveServerScript, updateServerScript } from "@/api/server/script";
import CodeEditor from "@/components/codeEditor/index.vue";

// Props
interface Props {
  visible: boolean;
  scriptData?: any;
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  scriptData: null,
});

// Emits
const emit = defineEmits<{
  "update:visible": [value: boolean];
  save: [script: any];
  test: [script: any];
}>();

// 响应式数据
const formRef = ref<FormInstance>();
const saving = ref(false);

const scriptForm = reactive({
  monitorSysGenScriptId: null as number | null,
  monitorSysGenScriptName: "",
  monitorSysGenScriptType: "SHELL",
  monitorSysGenScriptDescription: "",
  monitorSysGenScriptContent: "",
  monitorSysGenScriptStatus: "ENABLED" as "ENABLED" | "DISABLED",
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
        });
      } else {
        // 新建模式
        resetForm();
      }
    }
  }
);

// 方法
const resetForm = () => {
  Object.assign(scriptForm, {
    monitorSysGenScriptId: null,
    monitorSysGenScriptName: "",
    monitorSysGenScriptType: "SHELL",
    monitorSysGenScriptDescription: "",
    monitorSysGenScriptContent: "",
    monitorSysGenScriptStatus: "ENABLED",
  });
  loadTemplate();
  nextTick(() => {
    formRef.value?.clearValidate();
  });
};

const getEditorLanguage = (type: string) => {
  const languageMap = {
    SHELL: "shell",
    PYTHON: "python",
    POWERSHELL: "powershell",
    BATCH: "batchfile",
  };
  return languageMap[type] || "shell";
};

const loadTemplate = () => {
  scriptForm.monitorSysGenScriptContent = getTemplate(
    scriptForm.monitorSysGenScriptType
  );
};

const getTemplate = (type: string) => {
  const templates = {
    SHELL: `#!/bin/bash

# 脚本描述：${scriptForm.monitorSysGenScriptDescription || "请添加脚本描述"}
# 作者：系统管理员
# 创建时间：${new Date().toLocaleDateString()}

echo "开始执行脚本..."

# 在这里添加你的脚本内容

echo "脚本执行完成"`,

    PYTHON: `#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
脚本描述：${scriptForm.monitorSysGenScriptDescription || "请添加脚本描述"}
作者：系统管理员
创建时间：${new Date().toLocaleDateString()}
"""

import os
import sys

def main():
    print("开始执行脚本...")

    # 在这里添加你的脚本内容

    print("脚本执行完成")

if __name__ == "__main__":
    main()`,

    POWERSHELL: `# 脚本描述：${scriptForm.monitorSysGenScriptDescription || "请添加脚本描述"}
# 作者：系统管理员
# 创建时间：${new Date().toLocaleDateString()}

Write-Host "开始执行脚本..."

# 在这里添加你的脚本内容

Write-Host "脚本执行完成"`,

    BATCH: `@echo off
REM 脚本描述：${scriptForm.monitorSysGenScriptDescription || "请添加脚本描述"}
REM 作者：系统管理员
REM 创建时间：${new Date().toLocaleDateString()}

echo 开始执行脚本...

REM 在这里添加你的脚本内容

echo 脚本执行完成
pause`,
  };

  return templates[type] || templates.SHELL;
};

const handleTypeChange = () => {
  if (
    !scriptForm.monitorSysGenScriptContent ||
    scriptForm.monitorSysGenScriptContent ===
      getTemplate(scriptForm.monitorSysGenScriptType)
  ) {
    loadTemplate();
  }
};

const formatCode = () => {
  ElMessage.info("代码格式化功能开发中");
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

    if (!scriptForm.monitorSysGenScriptContent.trim()) {
      ElMessage.warning("请输入脚本内容");
      return;
    }

    saving.value = true;

    const scriptData = {
      monitorSysGenScriptId: scriptForm.monitorSysGenScriptId || undefined,
      monitorSysGenScriptName: scriptForm.monitorSysGenScriptName,
      monitorSysGenScriptDescription: scriptForm.monitorSysGenScriptDescription,
      monitorSysGenScriptContent: scriptForm.monitorSysGenScriptContent,
      monitorSysGenScriptType: scriptForm.monitorSysGenScriptType,
      monitorSysGenScriptLanguage: scriptForm.monitorSysGenScriptType,
      monitorSysGenScriptVersion: "1.0.0",
      monitorSysGenScriptTimeout: 300,
      monitorSysGenScriptStatus: scriptForm.monitorSysGenScriptStatus,
    };

    const response = scriptForm.monitorSysGenScriptId
      ? await updateServerScript(scriptData)
      : await saveServerScript(scriptData);

    if (response.success) {
      ElMessage.success(
        scriptForm.monitorSysGenScriptId ? "脚本更新成功" : "脚本保存成功"
      );
      emit("save", { ...scriptForm });
      handleClose();
    } else {
      ElMessage.error("保存脚本失败");
    }
  } catch (error) {
    console.error("保存脚本失败:", error);
    ElMessage.error("保存脚本失败");
  } finally {
    saving.value = false;
  }
};
</script>

<style scoped lang="scss">
.script-edit-dialog {
  :deep(.el-dialog) {
    border-radius: 16px;
    overflow: hidden;
    z-index: 3000;
  }

  :deep(.el-overlay) {
    z-index: 2999;
  }

  :deep(.el-dialog__header) {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: var(--el-text-color-primary);
    padding: 20px 24px;
    margin: 0;

    .el-dialog__title {
      font-size: 18px;
      font-weight: 600;
    }

    .el-dialog__headerbtn {
      top: 20px;
      right: 24px;

      .el-dialog__close {
        color: var(--el-text-color-primary);
        font-size: 20px;

        &:hover {
          color: rgba(255, 255, 255, 0.8);
        }
      }
    }
  }

  :deep(.el-dialog__body) {
    padding: 0;
  }
}

.dialog-content {
  display: flex;
  flex-direction: column;
  height: 70vh;
  overflow: hidden;
}

.script-form {
  padding: 24px;
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;

  .script-form-content {
    .el-form-item {
      margin-bottom: 16px;
    }
  }
}

.code-editor-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 24px;

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;

    h4 {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      color: #1f2937;
    }

    .editor-actions {
      display: flex;
      gap: 8px;

      .el-button {
        border-radius: 8px;
        font-weight: 500;
      }
    }
  }

  .code-editor-wrapper {
    flex: 1;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    overflow: hidden;
    background: var(--el-bg-color-overlay);
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  background: #f9fafb;
  border-top: 1px solid #e5e7eb;

  .el-button {
    border-radius: 8px;
    font-weight: 600;
    padding: 10px 20px;

    &.el-button--primary {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border: none;

      &:hover {
        background: linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%);
      }
    }

    &.el-button--success {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      border: none;

      &:hover {
        background: linear-gradient(135deg, #059669 0%, #047857 100%);
      }
    }
  }
}
</style>
