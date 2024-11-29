<script setup lang="ts">
import "animate.css";
import { emitter, findRouteByPath, getParentPaths, usePermissionStoreHook } from "@repo/core";

import { computed, onBeforeMount, ref, h, render, defineAsyncComponent, createApp } from "vue";
import Main from "./components/lay-main/index.vue";
import Content from "./components/lay-content/index.vue";
import { useRouter } from "vue-router";
const router = useRouter();
const path = router.currentRoute.value.path;
const isHome = computed(() => {
  return path == "/" || path == "/home" || !path;
});
const route = computed(() => {
  const menus = usePermissionStoreHook().flatteningRoutes;
  const match = menus.find((item) => item.path == path);
  return match;
});
</script>

<template>
  <div class="overflow-hidden h-full">
    <Main v-if="isHome" class="h-full"></Main>
    <Content v-else :data="route" class="h-full"></Content>
  </div>
</template>
<style scoped lang="scss">
.bg-bg_color {
  background-color: var(--el-bg-color);
}
#app,
body {
  height: 100vh;
}
.hamburger-container {
  float: left;
  height: 100%;
  line-height: 48px;
  cursor: pointer;
}

.vertical-header-right {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  min-width: 280px;
  height: 48px;
  color: #000000d9;
}
.el-dropdown-link {
  display: flex;
  align-items: center;
  justify-content: space-around;
  height: 48px;
  padding: 10px;
  color: #000000d9;
  cursor: pointer;

  p {
    font-size: 12px;
  }

  img {
    width: 22px;
    height: 22px;
    border-radius: 50%;
  }
}

.breadcrumb-container {
  float: left;
  margin-left: 16px;
}

.translation {
  ::v-deep(.el-dropdown-menu__item) {
    padding: 5px 40px;
  }

  .check-zh {
    position: absolute;
    left: 20px;
  }

  .check-en {
    position: absolute;
    left: 20px;
  }
}

.logout {
  width: 120px;

  ::v-deep(.el-dropdown-menu__item) {
    display: inline-flex;
    flex-wrap: wrap;
    min-width: 100%;
    height: 38px;
  }
}
:deep(.el-loading-mask) {
  opacity: 0.45;
}

.translation {
  ::v-deep(.el-dropdown-menu__item) {
    padding: 5px 40px;
  }

  .check-zh {
    position: absolute;
    left: 20px;
  }

  .check-en {
    position: absolute;
    left: 20px;
  }
}

.logout {
  width: 120px;

  ::v-deep(.el-dropdown-menu__item) {
    display: inline-flex;
    flex-wrap: wrap;
    min-width: 100%;
  }
}
</style>
