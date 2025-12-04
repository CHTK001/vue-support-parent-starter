<template>
  <el-dialog
    :model-value="visible"
    @update:model-value="$emit('update:visible', $event)"
    :title="isEdit ? '编辑脚本' : '新建脚本'"
    width="900px"
    top="5vh"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    :append-to-body="true"
    :destroy-on-close="true"
    class="script-edit-dialog"
    @close="handleClose"
  >
    <!-- 对话框头部 -->
    <div class="dialog-header">
      <div class="header-icon">
        <IconifyIconOnline :icon="isEdit ? 'ri:edit-line' : 'ri:add-line'" />
      </div>
      <div class="header-info">
        <h3 class="header-title">{{ isEdit ? "编辑脚本" : "新建脚本" }}</h3>
        <p class="header-desc">
          {{ isEdit ? "修改脚本配置和内容" : "创建新的自动化脚本" }}
        </p>
      </div>
      <div class="header-type" v-if="scriptForm.monitorSysGenScriptType">
        <span
          class="type-badge"
          :class="scriptForm.monitorSysGenScriptType.toLowerCase()"
        >
          <IconifyIconOnline
            :icon="getTypeIcon(scriptForm.monitorSysGenScriptType)"
          />
          {{ getTypeName(scriptForm.monitorSysGenScriptType) }}
        </span>
      </div>
    </div>

    <div class="dialog-content">
      <el-tabs v-model="activeSubTab" class="custom-tabs">
        <!-- 子Tab：编辑 -->
        <el-tab-pane name="edit">
          <template #label>
            <span class="tab-label">
              <IconifyIconOnline icon="ri:code-s-slash-line" />
              脚本编辑
            </span>
          </template>

          <!-- 基本信息表单 -->
          <div class="script-form">
            <div class="form-section">
              <div class="section-title">
                <IconifyIconOnline icon="ri:file-info-line" />
                <span>基本信息</span>
              </div>
              <el-form
                ref="formRef"
                :model="scriptForm"
                :rules="formRules"
                label-width="90px"
                class="script-form-content"
              >
                <el-row :gutter="20">
                  <el-col :span="12">
                    <el-form-item
                      label="脚本名称"
                      prop="monitorSysGenScriptName"
                    >
                      <el-input
                        v-model="scriptForm.monitorSysGenScriptName"
                        placeholder="请输入脚本名称"
                        clearable
                      >
                        <template #prefix>
                          <IconifyIconOnline
                            icon="ri:file-text-line"
                            class="input-icon"
                          />
                        </template>
                      </el-input>
                    </el-form-item>
                  </el-col>
                  <el-col :span="12">
                    <el-form-item
                      label="脚本类型"
                      prop="monitorSysGenScriptType"
                    >
                      <el-select
                        v-model="scriptForm.monitorSysGenScriptType"
                        placeholder="请选择脚本类型"
                        style="width: 100%"
                        @change="handleTypeChange"
                      >
                        <el-option label="Shell" value="SHELL">
                          <div class="type-option">
                            <IconifyIconOnline icon="ri:terminal-box-line" />
                            <span>Shell</span>
                          </div>
                        </el-option>
                        <el-option label="Python" value="PYTHON">
                          <div class="type-option">
                            <IconifyIconOnline icon="ri:code-s-slash-line" />
                            <span>Python</span>
                          </div>
                        </el-option>
                        <el-option label="PowerShell" value="POWERSHELL">
                          <div class="type-option">
                            <IconifyIconOnline icon="ri:terminal-window-line" />
                            <span>PowerShell</span>
                          </div>
                        </el-option>
                        <el-option label="Batch" value="BATCH">
                          <div class="type-option">
                            <IconifyIconOnline icon="ri:file-code-line" />
                            <span>Batch</span>
                          </div>
                        </el-option>
                      </el-select>
                    </el-form-item>
                  </el-col>
                </el-row>

                <el-row :gutter="20">
                  <el-col :span="16">
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
                  <el-col :span="8">
                    <el-form-item
                      label="脚本状态"
                      prop="monitorSysGenScriptStatus"
                    >
                      <el-switch
                        v-model="scriptForm.monitorSysGenScriptStatus"
                        active-value="ENABLED"
                        inactive-value="DISABLED"
                        active-text="启用"
                        inactive-text="禁用"
                        inline-prompt
                        class="status-switch"
                      />
                    </el-form-item>
                  </el-col>
                </el-row>
              </el-form>
            </div>
          </div>

          <!-- 代码编辑器 -->
          <div class="code-editor-section">
            <div class="section-header">
              <div class="section-title">
                <IconifyIconOnline icon="ri:code-box-line" />
                <span>脚本内容</span>
              </div>
              <div class="editor-actions">
                <el-button
                  size="small"
                  @click="loadTemplate"
                  class="action-btn"
                >
                  <IconifyIconOnline icon="ri:file-add-line" />
                  加载模板
                </el-button>
                <el-button size="small" @click="formatCode" class="action-btn">
                  <IconifyIconOnline icon="ri:magic-line" />
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
                height="320px"
                :show-tool="true"
                placeholder="请输入脚本内容..."
              />
            </div>
          </div>
        </el-tab-pane>

        <!-- 子Tab：上传记录（仅编辑模式显示） -->
        <el-tab-pane name="upload-records" v-if="isEdit">
          <template #label>
            <span class="tab-label">
              <IconifyIconOnline icon="ri:upload-cloud-line" />
              上传记录
            </span>
          </template>
          <ScriptUploadRecords :script-id="scriptForm.monitorSysGenScriptId" />
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- 对话框底部按钮 -->
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose" class="cancel-btn">
          <IconifyIconOnline icon="ri:close-line" />
          取消
        </el-button>
        <el-button
          type="primary"
          @click="handleSave"
          :loading="saving"
          class="save-btn"
        >
          <IconifyIconOnline icon="ri:save-line" />
          {{ isEdit ? "保存更改" : "创建脚本" }}
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
const activeSubTab = ref("edit");

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

const getTypeIcon = (type: string) => {
  const iconMap = {
    SHELL: "ri:terminal-box-line",
    PYTHON: "ri:code-s-slash-line",
    POWERSHELL: "ri:terminal-window-line",
    BATCH: "ri:file-code-line",
  };
  return iconMap[type] || "ri:code-line";
};

const getTypeName = (type: string) => {
  const nameMap = {
    SHELL: "Shell",
    PYTHON: "Python",
    POWERSHELL: "PowerShell",
    BATCH: "Batch",
  };
  return nameMap[type] || type;
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
    border-radius: 20px;
    overflow: hidden;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  }

  :deep(.el-dialog__header) {
    display: none;
  }

  :deep(.el-dialog__body) {
    padding: 0;
  }

  :deep(.el-dialog__footer) {
    padding: 0;
  }
}

// 对话框头部
.dialog-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 24px 28px;
  background: linear-gradient(
    135deg,
    rgba(102, 126, 234, 0.08) 0%,
    rgba(118, 75, 162, 0.05) 100%
  );
  border-bottom: 1px solid rgba(226, 232, 240, 0.8);
}

.header-icon {
  width: 52px;
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 14px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-size: 26px;
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.35);
}

.header-info {
  flex: 1;
}

.header-title {
  margin: 0 0 4px 0;
  font-size: 20px;
  font-weight: 700;
  color: #1e293b;
}

.header-desc {
  margin: 0;
  font-size: 13px;
  color: #64748b;
}

.header-type {
  .type-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 16px;
    border-radius: 20px;
    font-size: 13px;
    font-weight: 600;

    &.shell {
      background: linear-gradient(
        135deg,
        rgba(16, 185, 129, 0.15) 0%,
        rgba(52, 211, 153, 0.1) 100%
      );
      color: #059669;
    }

    &.python {
      background: linear-gradient(
        135deg,
        rgba(59, 130, 246, 0.15) 0%,
        rgba(96, 165, 250, 0.1) 100%
      );
      color: #2563eb;
    }

    &.powershell {
      background: linear-gradient(
        135deg,
        rgba(102, 126, 234, 0.15) 0%,
        rgba(118, 75, 162, 0.1) 100%
      );
      color: #667eea;
    }

    &.batch {
      background: linear-gradient(
        135deg,
        rgba(245, 158, 11, 0.15) 0%,
        rgba(251, 191, 36, 0.1) 100%
      );
      color: #d97706;
    }
  }
}

// 对话框内容
.dialog-content {
  display: flex;
  flex-direction: column;
  max-height: 70vh;
  overflow: hidden;
}

// 自定义标签页
.custom-tabs {
  height: 100%;
  display: flex;
  flex-direction: column;

  :deep(.el-tabs__header) {
    margin: 0;
    padding: 0 24px;
    background: rgba(248, 250, 252, 0.8);
    border-bottom: 1px solid rgba(226, 232, 240, 0.8);
  }

  :deep(.el-tabs__nav-wrap::after) {
    display: none;
  }

  :deep(.el-tabs__item) {
    padding: 16px 20px;
    height: auto;
    font-weight: 500;
    color: #64748b;
    transition: all 0.3s ease;

    &:hover {
      color: #667eea;
    }

    &.is-active {
      color: #667eea;
      font-weight: 600;
    }
  }

  :deep(.el-tabs__active-bar) {
    background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
    height: 3px;
    border-radius: 2px;
  }

  :deep(.el-tabs__content) {
    flex: 1;
    overflow: auto;
  }
}

.tab-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

// 表单区域
.script-form {
  padding: 20px 24px;
  background: rgba(248, 250, 252, 0.5);
}

.form-section {
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.95) 0%,
    rgba(248, 250, 252, 0.9) 100%
  );
  border-radius: 16px;
  border: 1px solid rgba(226, 232, 240, 0.8);
  padding: 20px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 600;
  color: #334155;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(226, 232, 240, 0.8);

  :deep(svg) {
    font-size: 18px;
    color: #667eea;
  }
}

.script-form-content {
  :deep(.el-form-item) {
    margin-bottom: 16px;
  }

  :deep(.el-form-item__label) {
    font-weight: 500;
    color: #475569;
  }

  :deep(.el-input__wrapper),
  :deep(.el-textarea__inner) {
    border-radius: 10px;
    transition: all 0.3s ease;
  }

  :deep(.el-input__wrapper:hover),
  :deep(.el-textarea__inner:hover) {
    box-shadow: 0 0 0 1px #667eea inset;
  }

  :deep(.el-input__wrapper.is-focus),
  :deep(.el-textarea__inner:focus) {
    box-shadow:
      0 0 0 1px #667eea inset,
      0 0 0 3px rgba(102, 126, 234, 0.15);
  }

  :deep(.el-select .el-input__wrapper) {
    border-radius: 10px;
  }
}

.input-icon {
  color: #94a3b8;
  font-size: 16px;
}

.type-option {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;

  :deep(svg) {
    font-size: 16px;
    color: #667eea;
  }
}

.status-switch {
  :deep(.el-switch__core) {
    min-width: 60px;
    height: 26px;
    border-radius: 13px;
  }

  :deep(.el-switch.is-checked .el-switch__core) {
    background: linear-gradient(135deg, #10b981 0%, #34d399 100%);
    border-color: #10b981;
  }
}

// 代码编辑器区域
.code-editor-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 20px 24px;
  background: rgba(248, 250, 252, 0.5);
  overflow: hidden;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.editor-actions {
  display: flex;
  gap: 10px;
}

.action-btn {
  border-radius: 8px;
  font-weight: 500;
  border: 1px solid rgba(226, 232, 240, 0.8);
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.9) 0%,
    rgba(248, 250, 252, 0.8) 100%
  );
  transition: all 0.3s ease;

  &:hover {
    border-color: rgba(102, 126, 234, 0.4);
    background: linear-gradient(
      135deg,
      rgba(102, 126, 234, 0.08) 0%,
      rgba(118, 75, 162, 0.05) 100%
    );
    color: #667eea;
  }

  :deep(svg) {
    margin-right: 4px;
  }
}

.code-editor-wrapper {
  flex: 1;
  border: 1px solid rgba(226, 232, 240, 0.8);
  border-radius: 14px;
  overflow: hidden;
  background: #1e293b;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

// 底部按钮
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px 28px;
  background: linear-gradient(
    135deg,
    rgba(248, 250, 252, 0.95) 0%,
    rgba(241, 245, 249, 0.9) 100%
  );
  border-top: 1px solid rgba(226, 232, 240, 0.8);
}

.cancel-btn {
  border-radius: 10px;
  padding: 10px 20px;
  font-weight: 500;
  border: 1px solid rgba(226, 232, 240, 0.8);
  background: white;
  transition: all 0.3s ease;

  &:hover {
    border-color: rgba(100, 116, 139, 0.4);
    background: rgba(100, 116, 139, 0.05);
  }

  :deep(svg) {
    margin-right: 4px;
  }
}

.save-btn {
  border-radius: 10px;
  padding: 10px 24px;
  font-weight: 600;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  box-shadow: 0 4px 14px rgba(102, 126, 234, 0.35);
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(102, 126, 234, 0.45);
  }

  :deep(svg) {
    margin-right: 4px;
  }
}

// 响应式
@media (max-width: 768px) {
  .dialog-header {
    flex-wrap: wrap;
    gap: 12px;
  }

  .header-type {
    width: 100%;
  }

  .script-form-content {
    :deep(.el-col) {
      width: 100%;
      max-width: 100%;
      flex: 0 0 100%;
    }
  }

  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .dialog-footer {
    flex-direction: column;

    .el-button {
      width: 100%;
    }
  }
}
</style>
