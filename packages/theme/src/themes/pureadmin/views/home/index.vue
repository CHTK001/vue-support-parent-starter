<template>
  <div class="pureadmin-home">
    <el-card class="welcome-card">
      <template #header>
        <div class="card-header">
          <span>{{ t("menu.home.work.name") }}</span>
        </div>
      </template>
      <div class="home-content">
        <h2>PureAdmin Theme</h2>
        <p>Welcome to PureAdmin Vue3 Admin Template</p>
        <el-button type="primary" @click="handleGoSystem">进入系统</el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts" name="PureadminHome">
import { useI18n } from "vue-i18n";

const { t } = useI18n();

const handleGoSystem = () => {
  // TODO: 跳转到业务页面
  console.log("Go to system");
};
</script>

<style scoped lang="scss">
.pureadmin-home {
  padding: 24px;
}

.welcome-card {
  max-width: 600px;
  margin: 50px auto;
  text-align: center;
  
  .card-header {
    font-size: 20px;
    font-weight: bold;
  }
}

.home-content {
  h2 {
    font-size: 28px;
    color: var(--el-text-color-primary);
    margin-bottom: 16px;
  }
  
  p {
    font-size: 16px;
    color: var(--el-text-color-secondary);
    margin-bottom: 32px;
  }
}
</style>
