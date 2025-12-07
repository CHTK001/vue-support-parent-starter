<template>
  <div class="techui-page">
    <!-- 顶部导航栏 -->
    <div class="page-nav">
      <button class="back-btn" @click="goBack">
        <IconifyIconOnline icon="ri:arrow-left-line" />
        <span>返回</span>
      </button>
      <h1 class="page-title">TechUI 科幻风格组件</h1>
    </div>
    
    <!-- 示例内容 -->
    <div class="page-content">
      <TechUIExample />
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * TechUI 独立页面
 * @author CH
 * @version 1.0.0
 * @since 2025-12-07
 */
import { useRouter } from "vue-router";
import TechUIExample from "../components/TechUIExample.vue";

const router = useRouter();

/**
 * 返回上一页
 */
const goBack = () => {
  router.back();
};
</script>

<style scoped lang="scss">
.techui-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #0a0a1a 0%, #1a1a2e 50%, #16213e 100%);
  display: flex;
  flex-direction: column;
}

.page-nav {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 24px;
  background: rgba(0, 0, 0, 0.3);
  border-bottom: 1px solid rgba(0, 255, 255, 0.2);
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: rgba(0, 255, 255, 0.1);
  border: 1px solid rgba(0, 255, 255, 0.3);
  border-radius: 8px;
  color: #00ffff;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(0, 255, 255, 0.2);
    border-color: rgba(0, 255, 255, 0.5);
    box-shadow: 0 0 20px rgba(0, 255, 255, 0.3);
  }
}

.page-title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #00ffff;
  text-shadow: 0 0 10px rgba(0, 255, 255, 0.5);
}

.page-content {
  flex: 1;
  overflow: auto;
  padding: 24px;
}
</style>
