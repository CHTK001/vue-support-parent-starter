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
              <el-radio :model-value="form.navMode" value="side"
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
              <el-radio :model-value="form.navMode" value="top"
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
              <el-radio :model-value="form.navMode" value="mix"
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
  padding: 28px;
  background: linear-gradient(
    135deg,
    rgba(248, 250, 252, 0.8) 0%,
    rgba(241, 245, 249, 0.6) 100%
  );
}

// 页面头部
.page-header {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 32px;
  padding: 28px 32px;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.95) 0%,
    rgba(248, 250, 252, 0.9) 100%
  );
  border-radius: 20px;
  border: 1px solid rgba(226, 232, 240, 0.8);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
  position: relative;
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
  }
}

.header-icon {
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 18px;
  font-size: 32px;
  color: white;
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.35);
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-4px);
  }
}

.page-title {
  margin: 0;
  font-size: 26px;
  font-weight: 700;
  background: linear-gradient(135deg, #1e293b 0%, #475569 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.page-subtitle {
  margin: 6px 0 0;
  font-size: 14px;
  color: #64748b;
}

// 设置区块
.settings-section {
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.95) 0%,
    rgba(248, 250, 252, 0.9) 100%
  );
  border-radius: 20px;
  border: 1px solid rgba(226, 232, 240, 0.8);
  padding: 28px;
  margin-bottom: 24px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
}

.section-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 28px;
  padding-bottom: 20px;
  border-bottom: 1px solid rgba(226, 232, 240, 0.8);
}

.section-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(
    135deg,
    rgba(102, 126, 234, 0.15) 0%,
    rgba(118, 75, 162, 0.1) 100%
  );
  border-radius: 14px;
  font-size: 24px;
  color: #667eea;
}

.section-title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #1e293b;
}

.section-desc {
  margin: 4px 0 0;
  font-size: 13px;
  color: #64748b;
}

// 导航选项
.nav-options {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}

.nav-card {
  position: relative;
  border: 1px solid rgba(226, 232, 240, 0.8);
  border-radius: 16px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.95) 0%,
    rgba(248, 250, 252, 0.9) 100%
  );
  overflow: hidden;

  &:hover {
    border-color: rgba(102, 126, 234, 0.3);
    transform: translateY(-3px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  }

  &.active {
    border-color: rgba(102, 126, 234, 0.5);
    background: linear-gradient(
      135deg,
      rgba(255, 255, 255, 0.98) 0%,
      rgba(248, 250, 252, 0.95) 100%
    );
    box-shadow: 0 4px 16px rgba(102, 126, 234, 0.12);

    &::after {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
      background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
    }

    .nav-preview {
      .preview-sidebar,
      .preview-topbar {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      }
    }
  }
}

.nav-check {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  color: white;
  font-size: 12px;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
}

// 导航预览
.nav-preview {
  height: 110px;
  border-radius: 12px;
  overflow: hidden;
  background: linear-gradient(
    135deg,
    rgba(248, 250, 252, 0.9) 0%,
    rgba(241, 245, 249, 0.8) 100%
  );
  margin-bottom: 16px;
  border: 1px solid rgba(226, 232, 240, 0.6);
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.04);

  &.side {
    display: flex;

    .preview-sidebar {
      width: 28%;
      background: linear-gradient(
        180deg,
        rgba(102, 126, 234, 0.3) 0%,
        rgba(118, 75, 162, 0.2) 100%
      );
    }

    .preview-main {
      flex: 1;
      display: flex;
      flex-direction: column;

      .preview-header {
        height: 20%;
        background: rgba(241, 245, 249, 0.9);
        border-bottom: 1px solid rgba(226, 232, 240, 0.6);
      }

      .preview-content {
        flex: 1;
        background: rgba(248, 250, 252, 0.6);
      }
    }
  }

  &.top {
    display: flex;
    flex-direction: column;

    .preview-topbar {
      height: 22%;
      background: linear-gradient(
        90deg,
        rgba(102, 126, 234, 0.3) 0%,
        rgba(118, 75, 162, 0.2) 100%
      );
    }

    .preview-body {
      flex: 1;
      background: rgba(248, 250, 252, 0.6);
    }
  }

  &.mix {
    display: flex;
    flex-direction: column;

    .preview-topbar {
      height: 22%;
      background: linear-gradient(
        90deg,
        rgba(102, 126, 234, 0.3) 0%,
        rgba(118, 75, 162, 0.2) 100%
      );
    }

    .preview-body {
      flex: 1;
      display: flex;

      .preview-sidebar {
        width: 24%;
        background: rgba(241, 245, 249, 0.9);
        border-right: 1px solid rgba(226, 232, 240, 0.6);
      }

      .preview-content {
        flex: 1;
        background: rgba(248, 250, 252, 0.6);
      }
    }
  }
}

.nav-info {
  position: relative;
  z-index: 1;

  .nav-name {
    font-weight: 600;
    margin-bottom: 8px;

    :deep(.el-radio) {
      .el-radio__label {
        font-size: 15px;
        font-weight: 600;
        color: #1e293b;
      }

      .el-radio__inner {
        border-color: #667eea;
      }

      &.is-checked .el-radio__inner {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-color: #667eea;
      }
    }
  }

  .nav-desc {
    margin: 0;
    font-size: 13px;
    color: #64748b;
    line-height: 1.6;
  }
}

// 操作按钮
.settings-actions {
  display: flex;
  gap: 16px;
  margin-bottom: 20px;

  :deep(.el-button) {
    border-radius: 12px;
    font-weight: 600;
    padding: 12px 28px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  :deep(.el-button--primary) {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border: none;
    box-shadow: 0 4px 16px rgba(102, 126, 234, 0.35);

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 24px rgba(102, 126, 234, 0.45);
    }
  }

  :deep(.el-button--default) {
    border: 1px solid rgba(226, 232, 240, 0.8);
    background: linear-gradient(
      135deg,
      rgba(255, 255, 255, 0.9) 0%,
      rgba(248, 250, 252, 0.8) 100%
    );

    &:hover {
      border-color: rgba(102, 126, 234, 0.4);
      background: linear-gradient(
        135deg,
        rgba(102, 126, 234, 0.08) 0%,
        rgba(118, 75, 162, 0.05) 100%
      );
    }
  }
}

.settings-tip {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 20px;
  background: linear-gradient(
    135deg,
    rgba(102, 126, 234, 0.08) 0%,
    rgba(118, 75, 162, 0.05) 100%
  );
  border: 1px solid rgba(102, 126, 234, 0.2);
  border-radius: 12px;
  font-size: 13px;
  color: #667eea;

  :deep(svg) {
    font-size: 18px;
  }
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
    padding: 24px 20px;

    .header-icon {
      margin-bottom: 8px;
    }
  }

  .settings-actions {
    flex-direction: column;

    :deep(.el-button) {
      width: 100%;
    }
  }
}
</style>
