<template>
  <div class="home-page">
    <el-card shadow="never" class="welcome-card">
      <template #header>
        <div class="card-header">
          <span>欢迎使用 vue-support</span>
        </div>
      </template>
      <div class="content">
        <p>这是一个基于 Koi-UI 布局的后台管理系统</p>
        <p>当前布局：vertical</p>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
</script>

<style scoped>
.home-page {
  padding: 20px;
  height: 100%;
  overflow: auto;
}

.welcome-card {
  max-width: 800px;
  margin: 0 auto;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.content {
  line-height: 2;
  color: var(--el-text-color-regular);
}
</style>