<template>
  <template v-for="menu in menuList" :key="menu.menuId || menu.path">
    <el-sub-menu v-if="menu.children && menu.children.length" :index="menu.path || menu.menuId">
      <template #title>
        <el-icon v-if="menu.icon"><component :is="menu.icon" /></el-icon>
        <span>{{ menu.menuName || menu.title }}</span>
      </template>
      <AsideSubMenu :menuList="menu.children" />
    </el-sub-menu>
    <el-menu-item v-else-if="menu.menuType !== '1'" :index="menu.path || menu.menuId" @click="handleMenuClick(menu)">
      <el-icon v-if="menu.icon"><component :is="menu.icon" /></el-icon>
      <template #title>{{ menu.menuName || menu.title }}</template>
    </el-menu-item>
  </template>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";

defineProps<{ menuList: any[] }>();

const router = useRouter();

function handleMenuClick(menu: any) {
  if (menu.linkUrl && menu.linkUrl.startsWith("http")) {
    window.open(menu.linkUrl);
  } else if (menu.path) {
    router.push(menu.path);
  }
}
</script>