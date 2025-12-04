<template>
  <div class="project-home">
    <div class="page-header">
      <div class="header-content">
        <div class="title-section">
          <h1 class="page-title">
            <IconifyIconOnline icon="ri:folder-open-line" class="title-icon" />
            项目中心
          </h1>
          <p class="page-subtitle">管理和查看您的所有项目</p>
        </div>
      </div>
    </div>

    <div class="content-area">
      <el-card shadow="never" class="welcome-card">
        <div class="welcome-content">
          <IconifyIconOnline icon="ri:rocket-line" class="welcome-icon" />
          <h2 class="welcome-title">欢迎来到项目中心</h2>
          <p class="welcome-text">
            在这里您可以管理所有项目、查看项目详情、配置项目设置等
          </p>
          <div class="quick-actions">
            <router-link to="/project/list">
              <el-button type="primary" size="large">
                <IconifyIconOnline icon="ri:list-check" class="mr-2" />
                查看项目列表
              </el-button>
            </router-link>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.project-home {
  padding: 0;
  background: var(--el-bg-color-page);
  min-height: 100vh;
}

.page-header {
  background: linear-gradient(
    135deg,
    var(--el-color-primary-light-9) 0%,
    var(--el-color-primary-light-8) 100%
  );
  padding: 32px;
  border-radius: 12px;
  margin-bottom: 24px;
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
  gap: 16px;
  font-size: 32px;
  font-weight: 700;
  color: var(--el-text-color-primary);
  margin: 0 0 12px 0;

  .title-icon {
    font-size: 36px;
    color: var(--el-color-primary);
  }
}

.page-subtitle {
  color: var(--el-text-color-regular);
  font-size: 16px;
  margin: 0;
}

.content-area {
  padding: 0 32px;
}

.welcome-card {
  border-radius: 12px;
  border: none;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

.welcome-content {
  text-align: center;
  padding: 60px 40px;
}

.welcome-icon {
  font-size: 80px;
  color: var(--el-color-primary);
  margin-bottom: 24px;
  animation: float 3s ease-in-out infinite;
}

.welcome-title {
  font-size: 28px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin: 0 0 16px 0;
}

.welcome-text {
  font-size: 16px;
  color: var(--el-text-color-regular);
  margin: 0 0 32px 0;
  line-height: 1.6;
}

.quick-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

:deep(.el-card__body) {
  padding: 0;
}
</style>
