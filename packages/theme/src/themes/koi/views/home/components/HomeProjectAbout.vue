<template>
  <el-card class="home-card home-about-card" shadow="never" :body-style="cardBodyStyle">
    <div class="home-about-card__title">关于项目</div>
    <p class="home-about-card__desc">
      KOI-ADMIN 是一款“简洁且优雅”的企业级前后端分离管理平台模板，使用了 Vue3、TypeScript、Vite、Element Plus 等前沿技术。
    </p>
    <div class="home-about-card__links">
      <button
        v-for="item in linkList"
        :key="item.label"
        type="button"
        class="home-about-card__link"
        @click="item.action"
      >
        <span>{{ item.label }}</span>
        <el-icon :size="14"><ArrowRight /></el-icon>
      </button>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { ArrowRight } from "@element-plus/icons-vue";
import { msgSuccess } from "@repo/core";

const cardBodyStyle = { padding: "16px 20px" };

const linkList = [
  {
    label: "项目官网",
    action: () => window.open("https://gitee.com/KoiKite/koi-ui", "_blank")
  },
  {
    label: "文档",
    action: () => window.open("https://gitee.com/KoiKite/koi-ui", "_blank")
  },
  {
    label: "Github",
    action: () => window.open("https://github.com/KoiKite/koi-ui", "_blank")
  },
  {
    label: "前后端版本",
    action: () => msgSuccess("前后端版本 JAVA[188元]，博客版本 + 管理平台[366元]~")
  }
];
</script>

<style lang="scss" scoped>
.home-card {
  border-radius: 8px;
}

.home-about-card__title {
  font-size: 18px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}

.home-about-card__desc {
  margin: 10px 0 18px;
  font-size: 13px;
  line-height: 1.7;
  color: var(--el-text-color-secondary);
}

.home-about-card__links {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.home-about-card__link {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 14px 16px;
  font-size: 14px;
  color: var(--el-text-color-primary);
  cursor: pointer;
  background: var(--el-fill-color-blank);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 10px;
  outline: none;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.2s ease;

  &:hover {
    border-color: color-mix(in srgb, var(--el-color-primary) 35%, var(--el-border-color));
    box-shadow: 0 6px 18px rgb(15 23 42 / 6%);
    transform: translateY(-1px);
  }

  .el-icon {
    color: var(--el-text-color-placeholder);
  }
}

@media (width <= 768px) {
  .home-about-card__links {
    grid-template-columns: 1fr;
  }
}
</style>
