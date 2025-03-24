<script setup lang="ts">
import { isEqual } from "@pureadmin/utils";
import { transformI18n } from "@repo/config";
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import { useRoute, useRouter } from "vue-router";
import { onMounted, ref, toRaw, watch } from "vue";
import { findRouteByPath, getParentPaths, useMultiTagsStoreHook } from "@repo/core";

const route = useRoute();
const levelList = ref([]);
const router = useRouter();
const routes: any = router.options.routes;
const multiTags: any = useMultiTagsStoreHook().multiTags;

const getBreadcrumb = (): void => {
  // 当前路由信息
  let currentRoute;

  if (Object.keys(route.query).length > 0) {
    multiTags.forEach((item) => {
      if (isEqual(route.query, item?.query)) {
        currentRoute = toRaw(item);
      }
    });
  } else if (Object.keys(route.params).length > 0) {
    multiTags.forEach((item) => {
      if (isEqual(route.params, item?.params)) {
        currentRoute = toRaw(item);
      }
    });
  } else {
    currentRoute = findRouteByPath(router.currentRoute.value.path, routes);
  }

  // 当前路由的父级路径组成的数组
  const parentRoutes = getParentPaths(router.currentRoute.value.name as string, routes, "name");
  // 存放组成面包屑的数组
  const matched = [];

  // 获取每个父级路径对应的路由信息
  parentRoutes.forEach((path) => {
    if (path !== "/") matched.push(findRouteByPath(path, routes));
  });

  matched.push(currentRoute);

  matched.forEach((item, index) => {
    if (currentRoute?.query || currentRoute?.params) return;
    if (item?.children) {
      item.children.forEach((v) => {
        if (v?.meta?.title === item?.meta?.title) {
          matched.splice(index, 1);
        }
      });
    }
  });

  levelList.value = matched.filter((item) => item?.meta && item?.meta.title !== false);
};

const handleLink = (item) => {
  const { redirect, name, path } = item;
  if (redirect) {
    router.push(redirect as any);
  } else {
    if (name) {
      if (item.query) {
        router.push({
          name,
          query: item.query,
        });
      } else if (item.params) {
        router.push({
          name,
          params: item.params,
        });
      } else {
        router.push({ name });
      }
    } else {
      router.push({ path });
    }
  }
};

onMounted(() => {
  getBreadcrumb();
});

watch(
  () => route.path,
  () => {
    getBreadcrumb();
  },
  {
    deep: true,
  }
);
</script>

<template>
  <el-breadcrumb class="breadcrumb-container" separator="/">
    <transition-group name="breadcrumb">
      <el-breadcrumb-item v-for="item in levelList" :key="item.path" class="breadcrumb-item">
        <a @click.prevent="handleLink(item)" class="breadcrumb-link">
          <el-icon v-if="item.meta.icon" class="breadcrumb-icon">
            <component :is="useRenderIcon(item.meta.icon)" />
          </el-icon>
          <span class="breadcrumb-text">
            {{ transformI18n(item.meta.i18nKey || item.meta.title) }}
          </span>
        </a>
      </el-breadcrumb-item>
    </transition-group>
  </el-breadcrumb>
</template>

<style lang="scss" scoped>
.breadcrumb-container {
  height: 48px;
  display: flex;
  align-items: center;
  padding: 0 16px;
  background: transparent;
  transition: all 0.3s;

  :deep(.el-breadcrumb__item) {
    .el-breadcrumb__inner {
      color: var(--el-text-color-secondary);
      transition: all 0.3s;
    }

    &:last-child {
      .el-breadcrumb__inner {
        color: var(--el-text-color-primary);
        font-weight: 500;
      }
    }
  }
}

.breadcrumb-item {
  display: inline-flex;
  align-items: center;
}

.breadcrumb-link {
  display: inline-flex;
  align-items: center;
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 0.3s;

  &:hover {
    background: rgba(var(--el-color-primary-rgb), 0.1);

    .breadcrumb-text {
      color: var(--el-color-primary);
    }
  }
}

.breadcrumb-icon {
  margin-right: 6px;
  font-size: 16px;
}

.breadcrumb-text {
  font-size: 14px;
  transition: color 0.3s;
}

// 面包屑动画
.breadcrumb-enter-active,
.breadcrumb-leave-active {
  transition: all 0.3s;
}

.breadcrumb-enter-from,
.breadcrumb-leave-active {
  opacity: 0;
  transform: translateX(20px);
}

.breadcrumb-leave-active {
  position: absolute;
}

.dark {
  .breadcrumb-container {
    :deep(.el-breadcrumb__item) {
      .el-breadcrumb__inner {
        color: rgba(255, 255, 255, 0.7);
      }

      &:last-child {
        .el-breadcrumb__inner {
          color: rgba(255, 255, 255, 0.9);
        }
      }
    }
  }
}
</style>
