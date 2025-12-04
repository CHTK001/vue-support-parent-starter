<template>
  <div class="script-editor">
    <!-- 编辑器工具栏 -->
    <div class="editor-toolbar">
      <div class="toolbar-left">
        <el-input
          v-model="scriptForm.name"
          placeholder="脚本名称"
          size="small"
          style="width: 200px"
        />
        <el-select
          v-model="scriptForm.type"
          placeholder="脚本类型"
          size="small"
          style="width: 120px"
          @change="handleTypeChange"
        >
          <el-option label="Shell" value="shell" />
          <el-option label="Python" value="python" />
          <el-option label="PowerShell" value="powershell" />
          <el-option label="Batch" value="batch" />
        </el-select>
        <el-input
          v-model="scriptForm.description"
          placeholder="脚本描述"
          size="small"
          style="width: 250px"
        />
      </div>
      <div class="toolbar-right">
        <el-button size="small" @click="loadTemplate">
          <IconifyIconOnline icon="ri:file-text-line" />
          模板
        </el-button>
        <el-button size="small" @click="formatCode">
          <IconifyIconOnline icon="ri:code-s-slash-line" />
          格式�?
        </el-button>
        <el-button size="small" type="success" @click="handleSave">
          <IconifyIconOnline icon="ri:save-line" />
          保存
        </el-button>
        <el-button size="small" type="primary" @click="handleExecute">
          <IconifyIconOnline icon="ri:play-line" />
          执行
        </el-button>
      </div>
    </div>

    <!-- 代码编辑�?-->
    <div class="editor-container">
      <div class="editor-header">
        <div class="file-info">
          <IconifyIconOnline :icon="getFileIcon(scriptForm.type)" />
          <span
            >{{ scriptForm.name || "未命名脚�?
            }}{{ getFileExtension(scriptForm.type) }}</span
          >
        </div>
        <div class="editor-stats">
          <span>行数: {{ lineCount }}</span>
          <span>字符: {{ charCount }}</span>
        </div>
      </div>

      <div class="code-editor-wrapper">
        <textarea
          ref="editorRef"
          v-model="scriptForm.content"
          class="code-editor"
          placeholder="请输入脚本内�?.."
          @input="handleContentChange"
        />
      </div>
    </div>

    <!-- 底部信息 -->
    <div class="editor-footer">
      <div class="footer-left">
        <el-tag :type="getScriptTypeTagType(scriptForm.type)" size="small">
          {{ scriptForm.type || "未选择类型" }}
        </el-tag>
        <span class="encoding">UTF-8</span>
      </div>
      <div class="footer-right">
        <span class="cursor-position">�?1, �?1</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import { ElMessage } from "element-plus";
import { saveServerScript, updateServerScript } from "@/api/server/script";

// Props
interface Props {
  scriptData?: any;
}

const props = defineProps<Props>();

// Emits
const emit = defineEmits<{
  save: [script: any];
  execute: [script: any];
}>();

// 响应式数�?
const editorRef = ref();
const scriptForm = ref({
  id: null,
  name: "",
  type: "shell",
  description: "",
  content: "",
  status: "active",
});

// 计算属�?
const lineCount = computed(() => {
  return scriptForm.value.content.split("\n").length;
});

const charCount = computed(() => {
  return scriptForm.value.content.length;
});

// 方法
const resetForm = () => {
  scriptForm.value = {
    id: null,
    name: "",
    type: "shell",
    description: "",
    content: "",
    status: "active",
  };
  loadTemplate();
};

const loadTemplate = () => {
  scriptForm.value.content = getTemplate(scriptForm.value.type);
};

const getTemplate = (type: string) => {
  const templates = {
    shell: `#!/bin/bash

# 脚本描述�?{scriptForm.value.description || "请添加脚本描�?}
# 作者：系统管理�?
# 创建时间�?{new Date().toLocaleDateString()}

echo "开始执行脚�?.."

# 在这里添加你的脚本内�?

echo "脚本执行完成"`,

    python: `#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
脚本描述�?{scriptForm.value.description || "请添加脚本描�?}
作者：系统管理�?
创建时间�?{new Date().toLocaleDateString()}
"""

import os
import sys

def main():
    print("开始执行脚�?..")

    # 在这里添加你的脚本内�?

    print("脚本执行完成")

if __name__ == "__main__":
    main()`,

    powershell: `# 脚本描述�?{scriptForm.value.description || "请添加脚本描�?}
# 作者：系统管理�?
# 创建时间�?{new Date().toLocaleDateString()}

Write-Host "开始执行脚�?.."

# 在这里添加你的脚本内�?

Write-Host "脚本执行完成"`,

    batch: `@echo off
REM 脚本描述�?{scriptForm.value.description || "请添加脚本描�?}
REM 作者：系统管理�?
REM 创建时间�?{new Date().toLocaleDateString()}

echo 开始执行脚�?..

REM 在这里添加你的脚本内�?

echo 脚本执行完成
pause`,
  };

  return templates[type] || templates.shell;
};

// 监听�?
watch(
  () => props.scriptData,
  (newData) => {
    if (newData) {
      scriptForm.value = { ...newData };
    } else {
      resetForm();
    }
  },
  { immediate: true }
);

// 初始�?
onMounted(() => {
  if (!props.scriptData) {
    loadTemplate();
  }
});

const handleTypeChange = () => {
  if (
    !scriptForm.value.content ||
    scriptForm.value.content === getTemplate(scriptForm.value.type)
  ) {
    loadTemplate();
  }
};

const formatCode = () => {
  // 简单的代码格式�?
  ElMessage.info("代码格式化功能开发中");
};

const handleContentChange = () => {
  // 处理内容变化
};

const handleSave = async () => {
  if (!scriptForm.value.name) {
    ElMessage.warning("请输入脚本名�?);
    return;
  }

  if (!scriptForm.value.content.trim()) {
    ElMessage.warning("请输入脚本内�?);
    return;
  }

  try {
    const scriptData = {
      monitorSysGenServerScriptId: scriptForm.value.id || undefined,
      monitorSysGenServerScriptName: scriptForm.value.name,
      monitorSysGenServerScriptDescription: scriptForm.value.description,
      monitorSysGenServerScriptContent: scriptForm.value.content,
      monitorSysGenServerScriptType: scriptForm.value.type,
      monitorSysGenServerScriptLanguage: scriptForm.value.type, // 使用type作为language
      monitorSysGenServerScriptVersion: "1.0.0",
      monitorSysGenServerScriptTimeoutSeconds: 300,
      monitorSysGenServerScriptRetryCount: 0,
      monitorSysGenServerScriptIsTemplate: 0,
      monitorSysGenServerScriptIsPublic: 0,
      monitorSysGenServerScriptExecutionMode: "sync",
      monitorSysGenServerScriptStatus:
        scriptForm.value.status === "active" ? 1 : 0,
    };

    let response;
    if (scriptForm.value.id) {
      // 更新脚本
      response = await updateServerScript(scriptData);
    } else {
      // 新建脚本
      response = await saveServerScript(scriptData);
    }

    if (response.success) {
      ElMessage.success(scriptForm.value.id ? "脚本更新成功" : "脚本保存成功");
      emit("save", { ...scriptForm.value });
    } else {
      ElMessage.error("保存脚本失败");
    }
  } catch (error) {
    console.error("保存脚本失败:", error);
    ElMessage.error("保存脚本失败");
  }
};

const handleExecute = () => {
  if (!scriptForm.value.content.trim()) {
    ElMessage.warning("请输入脚本内�?);
    return;
  }

  emit("execute", { ...scriptForm.value });
};

const getFileIcon = (type: string) => {
  const iconMap = {
    shell: "ri:terminal-line",
    python: "ri:code-s-slash-line",
    powershell: "ri:windows-line",
    batch: "ri:file-text-line",
  };
  return iconMap[type] || "ri:file-text-line";
};

const getFileExtension = (type: string) => {
  const extMap = {
    shell: ".sh",
    python: ".py",
    powershell: ".ps1",
    batch: ".bat",
  };
  return extMap[type] || ".txt";
};

const getScriptTypeTagType = (type: string) => {
  const typeMap = {
    shell: "success",
    python: "warning",
    powershell: "info",
    batch: "primary",
  };
  return typeMap[type] || "default";
};
</script>

<style scoped lang="scss">
.script-editor {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.9) 0%,
    rgba(248, 250, 252, 0.9) 100%
  );
}

.editor-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 32px;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(226, 232, 240, 0.6);

  .toolbar-left {
    display: flex;
    gap: 16px;
    align-items: center;

    .el-input,
    .el-select {
      :deep(.el-input__wrapper) {
        border-radius: 12px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        transition: all 0.3s ease;

        &:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        &.is-focus {
          box-shadow: 0 4px 12px var(--el-shadow-color);
        }
      }
    }
  }

  .toolbar-right {
    display: flex;
    gap: 12px;

    .el-button {
      border-radius: 12px;
      font-weight: 600;
      transition: all 0.3s ease;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
      }

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
}

.editor-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  margin: 16px 32px;
  border-radius: 16px;
  border: 1px solid rgba(226, 232, 240, 0.6);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);

  .editor-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 24px;
    background: linear-gradient(
      135deg,
      rgba(248, 250, 252, 0.9) 0%,
      rgba(241, 245, 249, 0.9) 100%
    );
    border-bottom: 1px solid rgba(226, 232, 240, 0.6);
    border-radius: 16px 16px 0 0;

    .file-info {
      display: flex;
      align-items: center;
      gap: 10px;
      color: #1e293b;
      font-weight: 600;
      font-size: 14px;

      .iconify {
        font-size: 20px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }
    }

    .editor-stats {
      display: flex;
      gap: 20px;
      color: #64748b;
      font-size: 13px;
      font-weight: 500;

      span {
        background: rgba(100, 116, 139, 0.1);
        padding: 4px 8px;
        border-radius: 6px;
      }
    }
  }

  .code-editor-wrapper {
    flex: 1;
    position: relative;
    overflow: hidden;

    .code-editor {
      width: 100%;
      height: 100%;
      border: none;
      outline: none;
      resize: none;
      padding: 24px;
      font-family: "JetBrains Mono", "SF Mono", "Monaco", "Menlo", monospace;
      font-size: 15px;
      line-height: 1.7;
      background: rgba(255, 255, 255, 0.9);
      color: #1e293b;
      border-radius: 0 0 16px 16px;

      &::placeholder {
        color: #94a3b8;
        font-style: italic;
      }

      &:focus {
        background: rgba(255, 255, 255, 0.95);
      }
    }
  }
}

.editor-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 32px;
  background: linear-gradient(
    135deg,
    rgba(248, 250, 252, 0.9) 0%,
    rgba(241, 245, 249, 0.9) 100%
  );
  backdrop-filter: blur(20px);
  border-top: 1px solid rgba(226, 232, 240, 0.6);
  font-size: 13px;
  color: #64748b;

  .footer-left {
    display: flex;
    gap: 16px;
    align-items: center;

    .el-tag {
      border-radius: 8px;
      font-weight: 600;
      border: none;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .encoding {
      padding: 4px 10px;
      background: rgba(100, 116, 139, 0.1);
      border-radius: 8px;
      font-size: 12px;
      font-weight: 600;
      color: #475569;
    }
  }

  .cursor-position {
    font-family: "JetBrains Mono", monospace;
    background: rgba(100, 116, 139, 0.1);
    padding: 4px 10px;
    border-radius: 8px;
    font-weight: 600;
    color: #475569;
  }
}
</style>
