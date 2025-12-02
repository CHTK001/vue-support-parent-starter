<template>
  <div class="page flex flex-col h-full">
    <div class="page-header">
      <div class="header-content">
        <div class="title-section">
          <h1 class="page-title">
            <IconifyIconOnline icon="ri:key-2-line" class="title-icon" />
            Token 生成器
          </h1>
          <p class="page-subtitle">生成安全的随机 Token 字符串</p>
        </div>
      </div>
    </div>

    <div class="flex-1 overflow-auto">
      <el-card shadow="never">
        <el-form :inline="true">
          <el-form-item label="大写字母">
            <el-switch v-model="setting.upperCase" />
          </el-form-item>

          <el-form-item label="小写字母">
            <el-switch v-model="setting.lowerCase" />
          </el-form-item>

          <el-form-item label="数字">
            <el-switch v-model="setting.numberCase" />
          </el-form-item>

          <el-form-item label="特殊符号">
            <el-switch v-model="setting.symbolCase" />
          </el-form-item>
        </el-form>

        <el-form :inline="true">
          <el-form-item label="长度">
            <el-slider v-model="setting.lengthCase" class="!min-w-[500px]" :min="1" :max="1024" show-tooltip />
          </el-form-item>
        </el-form>
        <el-form :inline="true">
          <el-form-item>
            <el-button v-copy:click="data.token" size="small" :icon="useRenderIcon('ep:copy-document')" />
            <el-button type="primary" size="small" :icon="useRenderIcon('ep:refresh')" @click="generateToken()" />
          </el-form-item>
        </el-form>

        <el-input v-model="data.token" type="textarea" :rows="20" class="code-textarea" />
      </el-card>
    </div>
  </div>
</template>
<script setup>
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import { reactive, watch } from "vue";

const setting = reactive({
  upperCase: true,
  lengthCase: 16
});
const data = reactive({
  upperCase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  lowerCase: "abcdefghijklmnopqrstuvwxyz",
  numberCase: "0123456789",
  symbolCase: "~!@#$%^&*()_+-=[]{}|;:,.<>/?",
  token: null
});

watch(
  setting,
  () => {
    generateToken();
  },
  { deep: true, immediate: true }
);
// 生成随机token
function generateToken() {
  let token = "";
  let possibleChars = "";
  if (setting.upperCase) {
    possibleChars += data.upperCase;
  }

  if (setting.lowerCase) {
    possibleChars += data.lowerCase;
  }

  if (setting.numberCase) {
    possibleChars += data.numberCase;
  }

  if (setting.symbolCase) {
    possibleChars += data.symbolCase;
  }

  for (let i = 0; i < setting.lengthCase; i++) {
    token += possibleChars.charAt(Math.floor(Math.random() * possibleChars.length));
  }

  return (data.token = token);
}
</script>

<style lang="scss" scoped>
.page {
  padding: 0;
  background: var(--el-bg-color-page);
}

.page-header {
  background: linear-gradient(135deg, var(--el-color-primary-light-9) 0%, var(--el-color-primary-light-8) 100%);
  padding: 24px 32px;
  border-radius: 8px;
  margin-bottom: 16px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.page-title {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 24px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin: 0 0 8px 0;

  .title-icon {
    font-size: 28px;
    color: var(--el-color-primary);
  }
}

.page-subtitle {
  color: var(--el-text-color-regular);
  font-size: 14px;
  margin: 0;
}

.code-textarea {
  :deep(.el-textarea__inner) {
    font-family: "Courier New", monospace;
    font-size: 13px;
  }
}

:deep(.el-card) {
  border-radius: 8px;
}
</style>
