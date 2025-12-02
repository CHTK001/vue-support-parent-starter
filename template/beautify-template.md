# Vue 页面美化通用模板

## 标准页面结构

```vue
<template>
  <div class="page flex flex-col h-full">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <div class="title-section">
          <h1 class="page-title">
            <IconifyIconOnline icon="图标名称" class="title-icon" />
            页面标题
          </h1>
          <p class="page-subtitle">页面描述</p>
        </div>
        <div class="stats-section" v-if="需要统计">
          <div class="stat-card">
            <div class="stat-number">{{ 数值 }}</div>
            <div class="stat-label">标签</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 工具栏（可选） -->
    <div class="toolbar" v-if="需要搜索或操作">
      <el-input placeholder="搜索..." class="search-input">
        <template #prefix>
          <IconifyIconOnline icon="ep:search" />
        </template>
      </el-input>
      <el-button type="primary">操作按钮</el-button>
    </div>

    <!-- 内容区域 -->
    <div class="flex-1 overflow-hidden">
      <el-card shadow="never" class="h-full">
        <!-- 表格/内容 -->
      </el-card>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.page {
  padding: 0;
  background: var(--el-bg-color-page);
}

.page-header {
  background: linear-gradient(
    135deg,
    var(--el-color-primary-light-9) 0%,
    var(--el-color-primary-light-8) 100%
  );
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

.toolbar {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;

  .search-input {
    width: 300px;
  }
}

:deep(.el-card) {
  border-radius: 8px;
}
</style>
```

## 图标推荐

- 数据库：`ri:database-2-line`
- 表格：`ri:table-line`
- 线程：`ri:cpu-line`
- 对象：`ri:box-3-line`
- 文件：`ri:file-list-3-line`
- 代码：`ri:code-box-line`
- 工具：`ri:tools-line`
- 设置：`ri:settings-3-line`
- 用户：`ri:user-line`
- 角色：`ri:shield-user-line`
- 菜单：`ri:menu-line`
- 日志：`ri:file-text-line`
- 监控：`ri:dashboard-line`
- 应用：`ri:apps-2-line`
- 路由：`ri:route-line`
- Bean：`ri:seedling-line`
- Token：`ri:key-2-line`
- UUID：`ri:fingerprint-line`
- 二维码：`ri:qr-code-line`
- JWT：`ri:lock-password-line`
- Cron：`ri:time-line`
