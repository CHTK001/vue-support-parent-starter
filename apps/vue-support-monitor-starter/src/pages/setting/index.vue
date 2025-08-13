<template>
  <div class="settings-page">
    <div class="header">
      <h2>系统配置</h2>
      <div class="sub">常用外观与导航设置</div>
    </div>

    <el-card class="section-card" shadow="never">
      <div class="section-title">导航模式</div>
      <div class="nav-options">
        <div class="nav-item" :class="{ active: form.navMode === 'side' }" @click="setMode('side')">
          <div class="nav-head">
            <el-radio :model-value="form.navMode" label="side">侧边导航</el-radio>
          </div>
          <div class="nav-desc">左侧垂直菜单，空间利用高，适合功能较多的系统。</div>
          <div class="nav-illustration side">
            <div class="menu"></div>
            <div class="content"></div>
          </div>
        </div>

        <div class="nav-item" :class="{ active: form.navMode === 'top' }" @click="setMode('top')">
          <div class="nav-head">
            <el-radio :model-value="form.navMode" label="top">顶部导航</el-radio>
          </div>
          <div class="nav-desc">顶部水平菜单，简洁直观，适合一级模块较少的场景。</div>
          <div class="nav-illustration top">
            <div class="bar"></div>
            <div class="content"></div>
          </div>
        </div>

        <div class="nav-item" :class="{ active: form.navMode === 'mix' }" @click="setMode('mix')">
          <div class="nav-head">
            <el-radio :model-value="form.navMode" label="mix">混合导航</el-radio>
          </div>
          <div class="nav-desc">顶部一级导航 + 左侧二级导航，层级清晰，适合中大型系统。</div>
          <div class="nav-illustration mix">
            <div class="bar"></div>
            <div class="menu"></div>
            <div class="content"></div>
          </div>
        </div>
      </div>

      <div class="actions">
        <el-button type="primary" @click="save">保存</el-button>
        <el-button @click="reset">重置</el-button>
      </div>
      <div class="tip">保存后可能需要刷新页面以使全局导航样式完全生效。</div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { reactive, onMounted } from "vue";
import { ElMessage } from "element-plus";

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

<style scoped>
.settings-page {
  padding: 16px;
}
.header h2 {
  margin: 0;
  font-weight: 600;
}
.header .sub {
  margin-top: 4px;
  color: var(--el-text-color-secondary);
}
.section-card {
  margin-top: 14px;
  border-radius: 12px;
  border: 1px solid var(--el-border-color-lighter);
}
.section-title {
  font-weight: 600;
  margin-bottom: 12px;
}
.nav-options {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}
.nav-item {
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 12px;
  padding: 12px;
  cursor: pointer;
  transition:
    border-color 0.2s ease,
    transform 0.15s ease;
  /* 移除任何模糊相关效果：不使用滤镜 */
}
.nav-item:hover {
  border-color: var(--el-color-primary-light-5);
  transform: translateY(-1px);
}
.nav-item.active {
  border-color: var(--el-color-primary);
}
.nav-head {
  font-weight: 600;
}
.nav-desc {
  color: var(--el-text-color-secondary);
  margin: 6px 0 10px;
  min-height: 22px;
}

/* 简易示意图，无模糊 */
.nav-illustration {
  position: relative;
  height: 80px;
  border-radius: 8px;
  overflow: hidden;
  background: var(--el-fill-color-lighter);
}
.nav-illustration .menu {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 24%;
  background: var(--el-color-primary-light-8);
}
.nav-illustration .content {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 76%;
  background: var(--el-fill-color);
}
.nav-illustration .bar {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  height: 20px;
  background: var(--el-color-primary-light-8);
}
.nav-illustration.top .content {
  top: 20px;
  width: 100%;
  left: 0;
}
.nav-illustration.mix .bar {
  height: 20px;
}
.nav-illustration.mix .menu {
  top: 20px;
  width: 22%;
}
.nav-illustration.mix .content {
  left: 22%;
  width: 78%;
  top: 20px;
}

.actions {
  margin-top: 14px;
}
.tip {
  margin-top: 6px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

@media (max-width: 1200px) {
  .nav-options {
    grid-template-columns: 1fr;
  }
}
</style>
