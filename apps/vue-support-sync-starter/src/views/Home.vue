<template>
  <div class="home-container">
    <el-card class="welcome-card">
      <template #header>
        <div class="card-header">
          <span>欢迎使用 Demo 应用</span>
        </div>
      </template>
      <div class="content">
        <h1>Hello, World!</h1>
        <p>这是一个集成到 Spring Boot 后台项目的 Vue 前端应用</p>
        <el-button type="primary" @click="handleClick">点击测试</el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ElMessage } from "element-plus";

const handleClick = () => {
  ElMessage.success("按钮点击成功！");
};
</script>

<style lang="scss" scoped>
.home-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.welcome-card {
  width: 100%;
  max-width: 600px;
}

.card-header {
  font-size: 18px;
  font-weight: 600;
}

.content {
  text-align: center;
  padding: 20px 0;

  h1 {
    font-size: 32px;
    margin-bottom: 16px;
    color: var(--el-text-color-primary);
  }

  p {
    font-size: 16px;
    color: var(--el-text-color-regular);
    margin-bottom: 24px;
  }
}
</style>

