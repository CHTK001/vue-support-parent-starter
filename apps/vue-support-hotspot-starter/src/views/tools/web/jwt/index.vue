<script setup lang="ts">
import * as jose from "jose";
import { ref, watch } from "vue";

const jwtValue = ref("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c");
watch(jwtValue, (oldValue, newValue) => {
  handleJwt();
});

const payload = ref();
const header = ref();
const handleJwt = () => {
  try {
    header.value = Object.entries(jose.decodeProtectedHeader(jwtValue.value));
    payload.value = Object.entries(jose.decodeJwt(jwtValue.value));
  } catch (e) {
    payload.value = [];
    header.value = [];
  }
};

handleJwt();
</script>

<template>
  <div class="page flex flex-col h-full">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <div class="title-section">
          <h1 class="page-title">
            <IconifyIconOnline icon="ri:lock-password-line" class="title-icon" />
            JWT 解析工具
          </h1>
          <p class="page-subtitle">解析和查看 JWT Token 的 Header 和 Payload</p>
        </div>
      </div>
    </div>

    <!-- 内容区域 -->
    <div class="flex-1 overflow-hidden">
      <el-card shadow="never" class="h-full">
        <el-row :gutter="20" class="h-full">
          <el-col :span="12" class="h-full">
            <div class="section-header">
              <IconifyIconOnline icon="ri:key-2-line" class="section-icon" />
              <span>JWT Token</span>
            </div>
            <el-input v-model="jwtValue" type="textarea" :rows="25" placeholder="请输入 JWT Token..." class="jwt-input" />
          </el-col>
          <el-col :span="12" class="h-full">
            <div class="section-header">
              <IconifyIconOnline icon="ri:file-list-3-line" class="section-icon" />
              <span>解析结果</span>
            </div>
            <div class="result-container">
              <el-descriptions border title="Header" :column="1" class="mb-4">
                <el-descriptions-item v-for="key in header" :key="key" :label="key[0]">
                  <el-tag type="info" size="small">{{ key[1] }}</el-tag>
                </el-descriptions-item>
              </el-descriptions>
              <el-descriptions border title="Payload" :column="1">
                <el-descriptions-item v-for="key in payload" :key="key" :label="key[0]">
                  <el-tag size="small">{{ key[1] }}</el-tag>
                </el-descriptions-item>
              </el-descriptions>
            </div>
          </el-col>
        </el-row>
      </el-card>
    </div>
  </div>
</template>

<style scoped lang="scss">
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

.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: var(--el-fill-color-light);
  border-radius: 4px;
  margin-bottom: 12px;
  font-weight: 600;
  color: var(--el-text-color-primary);

  .section-icon {
    font-size: 18px;
    color: var(--el-color-primary);
  }
}

.jwt-input {
  :deep(.el-textarea__inner) {
    font-family: "Courier New", monospace;
    font-size: 13px;
    border-radius: 4px;
  }
}

.result-container {
  max-height: calc(100% - 60px);
  overflow-y: auto;
}

.mb-4 {
  margin-bottom: 16px;
}

:deep(.el-card) {
  border-radius: 8px;

  .el-card__body {
    height: 100%;
  }
}

:deep(.el-descriptions) {
  border-radius: 4px;
}
</style>
