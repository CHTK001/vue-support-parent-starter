<template>
  <div class="settings-page thin-scroller">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-icon">
        <IconifyIconOnline icon="ri:settings-3-line" />
      </div>
      <div class="header-text">
        <h1 class="page-title">系统配置</h1>
        <p class="page-subtitle">自定义外观、导航和系统偏好设置</p>
      </div>
    </div>

    <!-- 导航模式设置 -->
    <div class="settings-section">
      <div class="section-header">
        <div class="section-icon">
          <IconifyIconOnline icon="ri:layout-line" />
        </div>
        <div class="section-info">
          <h2 class="section-title">导航模式</h2>
          <p class="section-desc">选择适合您工作流程的导航布局</p>
        </div>
      </div>

      <div class="nav-options">
        <div
          class="nav-card"
          :class="{ active: form.navMode === 'side' }"
          @click="setMode('side')"
        >
          <div class="nav-preview side">
            <div class="preview-sidebar"></div>
            <div class="preview-main">
              <div class="preview-header"></div>
              <div class="preview-content"></div>
            </div>
          </div>
          <div class="nav-info">
            <div class="nav-name">
              <el-radio :model-value="form.navMode" label="side"
                >侧边导航</el-radio
              >
            </div>
            <p class="nav-desc">左侧垂直菜单，空间利用高，适合功能较多的系统</p>
          </div>
          <div class="nav-check" v-if="form.navMode === 'side'">
            <IconifyIconOnline icon="ri:check-line" />
          </div>
        </div>

        <div
          class="nav-card"
          :class="{ active: form.navMode === 'top' }"
          @click="setMode('top')"
        >
          <div class="nav-preview top">
            <div class="preview-topbar"></div>
            <div class="preview-body">
              <div class="preview-content"></div>
            </div>
          </div>
          <div class="nav-info">
            <div class="nav-name">
              <el-radio :model-value="form.navMode" label="top"
                >顶部导航</el-radio
              >
            </div>
            <p class="nav-desc">
              顶部水平菜单，简洁直观，适合一级模块较少的场景
            </p>
          </div>
          <div class="nav-check" v-if="form.navMode === 'top'">
            <IconifyIconOnline icon="ri:check-line" />
          </div>
        </div>

        <div
          class="nav-card"
          :class="{ active: form.navMode === 'mix' }"
          @click="setMode('mix')"
        >
          <div class="nav-preview mix">
            <div class="preview-topbar"></div>
            <div class="preview-body">
              <div class="preview-sidebar"></div>
              <div class="preview-content"></div>
            </div>
          </div>
          <div class="nav-info">
            <div class="nav-name">
              <el-radio :model-value="form.navMode" label="mix"
                >混合导航</el-radio
              >
            </div>
            <p class="nav-desc">
              顶部一级导航 + 左侧二级导航，层级清晰，适合中大型系统
            </p>
          </div>
          <div class="nav-check" v-if="form.navMode === 'mix'">
            <IconifyIconOnline icon="ri:check-line" />
          </div>
        </div>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="settings-actions">
      <el-button type="primary" size="large" @click="save">
        <IconifyIconOnline icon="ri:save-line" class="mr-1" />
        保存设置
      </el-button>
      <el-button size="large" @click="reset">
        <IconifyIconOnline icon="ri:refresh-line" class="mr-1" />
        重置默认
      </el-button>
    </div>

    <div class="settings-tip">
      <IconifyIconOnline icon="ri:information-line" />
      <span>保存后可能需要刷新页面以使全局导航样式完全生效</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ElMessage } from "element-plus";
import { onMounted, reactive } from "vue";

type NavMode = "side" | "top" | "mix";

const form = reactive<{ navMode: NavMode }>({ navMode: "side" });

const setMode = (m: NavMode) => {
  form.navMode = m;
};

const STORAGE_KEY = "app.navMode";

onMounted(() => {
  const saved = (localStorage.getItem(STORAGE_KEY) as NavMode) || "";
  if (saved === "side" || saved === "top" || saved === "mix") {
    form.navMode = saved;
  }
});

const save = () => {
  localStorage.setItem(STORAGE_KEY, form.navMode);
  ElMessage.success("已保存导航模式");
};

const reset = () => {
  form.navMode = "side";
  localStorage.removeItem(STORAGE_KEY);
  ElMessage.success("已重置导航模式");
};
</script>

<style scoped lang="scss">
.settings-page {
  min-height: 100%;
  padding: 24px;
  background: var(--el-bg-color-page);
}

// 页面头部
.page-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 32px;
  padding: 24px;
  background: var(--el-bg-color);
  border-radius: 16px;
  border: 1px solid var(--el-border-color-lighter);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}

.header-icon {
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(
    135deg,
    var(--el-color-primary) 0%,
    var(--el-color-primary-light-3) 100%
  );
  border-radius: 14px;
  font-size: 28px;
  color: white;
}

.page-title {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.page-subtitle {
  margin: 4px 0 0;
  font-size: 14px;
  color: var(--el-text-color-secondary);
}

// 设置区块
.settings-section {
  background: var(--el-bg-color);
  border-radius: 16px;
  border: 1px solid var(--el-border-color-lighter);
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}

.section-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
}

.section-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--el-color-primary-light-9);
  border-radius: 10px;
  font-size: 20px;
  color: var(--el-color-primary);
}

.section-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.section-desc {
  margin: 2px 0 0;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

// 导航选项
.nav-options {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.nav-card {
  position: relative;
  border: 2px solid var(--el-border-color-lighter);
  border-radius: 16px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: var(--el-bg-color);

  &:hover {
    border-color: var(--el-color-primary-light-5);
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  }

  &.active {
    border-color: var(--el-color-primary);
    background: var(--el-color-primary-light-9);

    .nav-preview {
      .preview-sidebar,
      .preview-topbar {
        background: var(--el-color-primary);
      }
    }
  }
}

.nav-check {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--el-color-primary);
  border-radius: 50%;
  color: white;
  font-size: 14px;
}

// 导航预览
.nav-preview {
  height: 100px;
  border-radius: 10px;
  overflow: hidden;
  background: var(--el-fill-color-lighter);
  margin-bottom: 12px;

  &.side {
    display: flex;

    .preview-sidebar {
      width: 28%;
      background: var(--el-color-primary-light-7);
    }

    .preview-main {
      flex: 1;
      display: flex;
      flex-direction: column;

      .preview-header {
        height: 20%;
        background: var(--el-fill-color);
        border-bottom: 1px solid var(--el-border-color-lighter);
      }

      .preview-content {
        flex: 1;
        background: var(--el-fill-color-lighter);
      }
    }
  }

  &.top {
    display: flex;
    flex-direction: column;

    .preview-topbar {
      height: 22%;
      background: var(--el-color-primary-light-7);
    }

    .preview-body {
      flex: 1;
      background: var(--el-fill-color-lighter);
    }
  }

  &.mix {
    display: flex;
    flex-direction: column;

    .preview-topbar {
      height: 22%;
      background: var(--el-color-primary-light-7);
    }

    .preview-body {
      flex: 1;
      display: flex;

      .preview-sidebar {
        width: 24%;
        background: var(--el-fill-color);
        border-right: 1px solid var(--el-border-color-lighter);
      }

      .preview-content {
        flex: 1;
        background: var(--el-fill-color-lighter);
      }
    }
  }
}

.nav-info {
  .nav-name {
    font-weight: 600;
    margin-bottom: 4px;
  }

  .nav-desc {
    margin: 0;
    font-size: 12px;
    color: var(--el-text-color-secondary);
    line-height: 1.5;
  }
}

// 操作按钮
.settings-actions {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.settings-tip {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: var(--el-color-info-light-9);
  border-radius: 8px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

// 响应式
@media (max-width: 1200px) {
  .nav-options {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .settings-page {
    padding: 16px;
  }

  .nav-options {
    grid-template-columns: 1fr;
  }

  .page-header {
    flex-direction: column;
    text-align: center;
  }
}
</style>
