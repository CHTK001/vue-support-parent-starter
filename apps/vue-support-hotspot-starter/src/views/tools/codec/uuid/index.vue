<template>
  <div class="page flex flex-col h-full">
    <div class="page-header">
      <div class="header-content">
        <div class="title-section">
          <h1 class="page-title">
            <IconifyIconOnline icon="ri:fingerprint-line" class="title-icon" />
            UUID 生成器
          </h1>
          <p class="page-subtitle">生成唯一标识符 UUID</p>
        </div>
        <div class="stats-section">
          <div class="stat-card">
            <div class="stat-number">{{ data.token.length }}</div>
            <div class="stat-label">已生成</div>
          </div>
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
        </el-form>
        <el-form :inline="true">
          <el-form-item>
            <el-button v-if="data.token.length > 0" v-copy:click="data.token.join('\n')" size="small" :icon="useRenderIcon('ep:copy-document')" />
            <el-button type="primary" size="small" :icon="useRenderIcon('ep:refresh')" @click="generateTokenList()" />
          </el-form-item>
        </el-form>
        <el-form :inline="true">
          <el-form-item label="数量">
            <el-slider v-model="setting.lengthCase" class="!min-w-[500px]" :min="1" :max="100" show-tooltip />
          </el-form-item>
        </el-form>
        <div class="uuid-list">
          <ul v-if="data.token.length > 0" class="uuid-items">
            <li v-for="(item, index) in data.token" :key="index" class="uuid-item">
              <span class="uuid-index">{{ index + 1 }}</span>
              <span class="uuid-value">{{ item }}</span>
              <el-button link type="primary" v-copy:click="item" size="small">
                <IconifyIconOnline icon="ep:copy-document" />
              </el-button>
            </li>
          </ul>
          <el-empty v-else description="点击生成按钮创建 UUID" />
        </div>
      </el-card>
    </div>
  </div>
</template>
<script setup>
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import { reactive, watch } from "vue";

const setting = reactive({
  upperCase: true,
  lengthCase: 1
});
const data = reactive({
  token: []
});

const generateTokenList = () => {
  const t = [];
  for (let i = 0; i < setting.lengthCase; i++) {
    t.push(generateToken());
  }
  data.token = t;
};
// 生成随机token
function generateToken() {
  var s = [];
  var hexDigits = "0123456789abcdef";
  for (var i = 0; i < 36; i++) {
    s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
  }
  s[14] = "4"; // bits 12-15 of the time_hi_and_version field to 0010
  s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1); // bits 6-7 of the clock_seq_hi_and_reserved to 01
  s[8] = s[13] = s[18] = s[23] = "-";

  var uuid = s.join("");
  return setting.upperCase ? uuid.toUpperCase() : uuid.toLocaleLowerCase();
}

watch(
  setting,
  () => {
    generateTokenList();
  },
  { deep: true, immediate: true }
);
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

.stats-section {
  display: flex;
  gap: 16px;
}

.stat-card {
  background: white;
  padding: 16px 24px;
  border-radius: 8px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);

  .stat-number {
    font-size: 28px;
    font-weight: 600;
    color: var(--el-color-primary);
    margin-bottom: 4px;
  }

  .stat-label {
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }
}

.uuid-list {
  max-height: 600px;
  overflow-y: auto;
}

.uuid-items {
  list-style: none;
  padding: 0;
  margin: 0;
}

.uuid-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  transition: all 0.2s;

  &:hover {
    background: var(--el-fill-color-lighter);
  }

  .uuid-index {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    background: var(--el-color-primary-light-9);
    color: var(--el-color-primary);
    border-radius: 50%;
    font-weight: 600;
    font-size: 12px;
    flex-shrink: 0;
  }

  .uuid-value {
    flex: 1;
    font-family: "Courier New", monospace;
    font-size: 14px;
    color: var(--el-text-color-primary);
  }
}

:deep(.el-card) {
  border-radius: 8px;
}
</style>
