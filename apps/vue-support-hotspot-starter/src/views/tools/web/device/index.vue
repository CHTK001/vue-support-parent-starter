<template>
  <div class="page flex flex-col h-full">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <div class="title-section">
          <h1 class="page-title">
            <IconifyIconOnline icon="ri:device-line" class="title-icon" />
            设备信息
          </h1>
          <p class="page-subtitle">查看当前浏览器和设备的详细信息</p>
        </div>
        <div class="stats-section">
          <div class="stat-card">
            <div class="stat-number">{{ Object.keys(browserInfo).length }}</div>
            <div class="stat-label">信息项</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 内容区域 -->
    <div class="flex-1 overflow-auto">
      <el-card shadow="never">
        <el-descriptions border :column="2" class="device-info">
          <el-descriptions-item v-for="(value, key) in browserInfo" :key="key" :label="key">
            <span class="info-value">{{ value }}</span>
          </el-descriptions-item>
        </el-descriptions>
      </el-card>
    </div>
  </div>
</template>
<script setup>
import { ref, onMounted } from "vue";

const browserInfo = ref({});

const getBrowserInfo = () => {
  const info = {
    名称: navigator.appName,
    版本: navigator.appVersion,
    供应商: navigator.vendor,
    引擎: navigator.product,
    用户代理: navigator.userAgent,
    应用程序版本: navigator.appVersion,
    平台: navigator.platform,
    语言: navigator.language,
    屏幕分辨率: `${screen.width}x${screen.height}`,
    窗口大小: `${window.innerWidth}x${window.innerHeight}`,
    颜色深度: screen.colorDepth + " bits",
    在线状态: navigator.onLine,
    Cookies启用: navigator.cookieEnabled,
    Java启用: navigator.javaEnabled(),
    插件: Array.from(navigator.plugins)
      .map(plugin => plugin.name)
      .join(", "),
    MIME类型: Array.from(navigator.mimeTypes)
      .map(mimeType => mimeType.type)
      .join(", "),
    时区偏移: new Date().getTimezoneOffset(),
    时区: Intl.DateTimeFormat().resolvedOptions().timeZone
  };
  return info;
};

onMounted(() => {
  browserInfo.value = getBrowserInfo();
});
</script>

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

.device-info {
  .info-value {
    font-family: "Courier New", monospace;
    font-size: 13px;
    color: var(--el-text-color-primary);
  }
}

:deep(.el-card) {
  border-radius: 8px;
}

:deep(.el-descriptions) {
  border-radius: 4px;
}
</style>
