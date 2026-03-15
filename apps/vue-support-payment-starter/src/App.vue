<template>
  <div id="app">
    <ScContainer class="layout-container">
      <ScAside width="200px" class="sidebar">
        <div class="logo">
          <h2>支付管理系统</h2>
        </div>
        <ScMenu
          :default-active="activeMenu"
          router
          class="menu"
        >
          <ScMenuItem index="/orders">
            <ScIcon><Document /></ScIcon>
            <span>订单管理</span>
          </ScMenuItem>
          <ScMenuItem index="/merchants">
            <ScIcon><Shop /></ScIcon>
            <span>商户管理</span>
          </ScMenuItem>
        </ScMenu>
      </ScAside>
      <ScContainer>
        <ScHeader class="header">
          <div class="header-content">
            <span>欢迎使用支付管理系统</span>
          </div>
        </ScHeader>
        <ScMain class="main">
          <router-view />
        </ScMain>
      </ScContainer>
    </ScContainer>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { Document, Shop } from '@element-plus/icons-vue';

const route = useRoute();
const activeMenu = computed(() => route.path);
</script>

<style scoped>
.layout-container {
  height: 100vh;
}

.sidebar {
  background-color: #304156;
  color: #fff;
}

.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #2b3a4b;
}

.logo h2 {
  margin: 0;
  font-size: 18px;
  color: #fff;
}

.menu {
  border-right: none;
  background-color: #304156;
}

.header {
  background-color: #fff;
  border-bottom: 1px solid #e6e6e6;
  display: flex;
  align-items: center;
  padding: 0 20px;
}

.header-content {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.main {
  background-color: #f0f2f5;
  padding: 0;
}
</style>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

#app {
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', Arial, sans-serif;
}
</style>
