<script setup lang="ts">
import { isEqual, useGlobal } from "@pureadmin/utils";
import { transformI18n } from "@repo/config";
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import { useRoute, useRouter } from "vue-router";
import { onBeforeUnmount, onMounted, ref, toRaw, watch } from "vue";
import {
  emitter,
  findRouteByPath,
  getParentPaths,
  useMultiTagsStoreHook,
} from "@repo/core";

// 接收主题类名
const props = defineProps<{
  themeClass?: string;
}>();

const route = useRoute();
const levelList = ref([]);
const router = useRouter();
const routes: any = router.options.routes;
const multiTags: any = useMultiTagsStoreHook().multiTags;

// 全局配置
const { $storage } = useGlobal<any>();

// 面包屑显示模式: icon | icon-text（默认显示图标+文字）
const breadcrumbMode = ref(
  $storage?.configure?.breadcrumbIconOnly ? "icon" : "icon-text"
);

// 监听模式变更
emitter.on("breadcrumbModeChange", (value: string) => {
  breadcrumbMode.value = value;
});

onBeforeUnmount(() => {
  emitter.off("breadcrumbModeChange");
});

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
  const parentRoutes = getParentPaths(
    router.currentRoute.value.name as string,
    routes,
    "name"
  );
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

  levelList.value = matched.filter(
    (item) => item?.meta && item?.meta.title !== false
  );
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

/**
 * 跳转到首页
 */
const goHome = () => {
  router.push("/");
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
  <div :class="['breadcrumb-wrapper', themeClass]">
    <!-- 首页图标 -->
    <div class="home-icon" @click="goHome">
      <IconifyIconOnline icon="ri:home-5-line" />
    </div>

    <!-- 分隔符 -->
    <div class="breadcrumb-divider">
      <IconifyIconOnline icon="ri:arrow-right-s-line" />
    </div>

    <!-- 面包屑导航 -->
    <el-breadcrumb class="breadcrumb-container" separator="">
      <transition-group name="breadcrumb">
        <el-breadcrumb-item
          v-for="(item, index) in levelList"
          :key="item.path"
          class="breadcrumb-item"
        >
          <el-tooltip
            :content="transformI18n(item.meta.i18nKey || item.meta.title)"
            placement="bottom"
            :show-after="500"
          >
            <a
              @click.prevent="handleLink(item)"
              :class="[
                'breadcrumb-link',
                { 'is-current': index === levelList.length - 1 },
              ]"
            >
              <el-icon v-if="item.meta.icon" class="breadcrumb-icon">
                <component :is="useRenderIcon(item.meta.icon)" />
              </el-icon>
              <span
                v-if="breadcrumbMode === 'icon-text'"
                class="breadcrumb-text"
              >
                {{ transformI18n(item.meta.i18nKey || item.meta.title) }}
              </span>
            </a>
          </el-tooltip>
          <!-- 自定义分隔符 -->
          <span
            v-if="index < levelList.length - 1"
            class="breadcrumb-separator"
          >
            <IconifyIconOnline icon="ri:arrow-right-s-line" />
          </span>
        </el-breadcrumb-item>
      </transition-group>
    </el-breadcrumb>
  </div>
</template>

<style lang="scss" scoped>
.breadcrumb-wrapper {
  display: flex;
  align-items: center;
  height: 48px;
  padding: 0 8px;
  gap: 8px;
  flex-wrap: nowrap;
  overflow: hidden;
}

// 首页图标
.home-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: var(--el-fill-color-light);
  color: var(--el-text-color-secondary);
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  font-size: 16px;

  &:hover {
    background: var(--el-color-primary-light-9);
    color: var(--el-color-primary);
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(var(--el-color-primary-rgb), 0.15);
  }

  &:active {
    transform: translateY(0);
  }
}

// 分隔符
.breadcrumb-divider {
  color: var(--el-text-color-placeholder);
  font-size: 14px;
  display: flex;
  align-items: center;
}

.breadcrumb-container {
  display: inline-flex;
  align-items: center;
  background: transparent;
  flex-wrap: nowrap;
  white-space: nowrap;

  :deep(.el-breadcrumb__inner) {
    display: inline-flex;
    align-items: center;
  }

  :deep(.el-breadcrumb__item) {
    display: inline-flex;
    align-items: center;
    float: none !important;

    .el-breadcrumb__inner {
      color: var(--el-text-color-secondary);
      transition: all 0.25s;
    }

    .el-breadcrumb__separator {
      display: none;
    }
  }
}

.breadcrumb-item {
  display: inline-flex !important;
  align-items: center;
  float: none !important;
}

.breadcrumb-link {
  display: inline-flex;
  align-items: center;
  padding: 6px 12px;
  border-radius: 8px;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  background: var(--el-fill-color-lighter);
  border: 1px solid transparent;
  flex-shrink: 0;
  white-space: nowrap;

  &:hover {
    background: var(--el-color-primary-light-9);
    border-color: var(--el-color-primary-light-7);
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(var(--el-color-primary-rgb), 0.12);

    .breadcrumb-text {
      color: var(--el-color-primary);
    }

    .breadcrumb-icon {
      color: var(--el-color-primary);
    }
  }

  &.is-current {
    background: linear-gradient(
      135deg,
      var(--el-color-primary-light-9),
      var(--el-color-primary-light-8)
    );
    border-color: var(--el-color-primary-light-5);
    box-shadow: 0 2px 8px rgba(var(--el-color-primary-rgb), 0.15);
    cursor: default;
    pointer-events: none;

    .breadcrumb-text {
      color: var(--el-color-primary);
      font-weight: 600;
    }

    .breadcrumb-icon {
      color: var(--el-color-primary);
    }
  }
}

.breadcrumb-icon {
  font-size: 15px;
  color: var(--el-text-color-secondary);
  transition: color 0.25s;

  &:not(:last-child) {
    margin-right: 6px;
  }
}

.breadcrumb-text {
  font-size: 13px;
  color: var(--el-text-color-regular);
  transition: color 0.25s;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 80px;
  display: inline-block;
}

// 自定义分隔符
.breadcrumb-separator {
  display: flex;
  align-items: center;
  margin: 0 6px;
  color: var(--el-text-color-placeholder);
  font-size: 14px;
}

// 面包屑动画 - 禁用以消除闪烁
.breadcrumb-enter-active,
.breadcrumb-leave-active {
  transition: none !important;
}

.breadcrumb-enter-from,
.breadcrumb-leave-active {
  opacity: 1;
  transform: none;
}

.breadcrumb-leave-active {
  position: static;
}

// 深色主题适配
html.dark {
  .home-icon {
    background: var(--el-fill-color-dark);

    &:hover {
      background: var(--el-color-primary-light-8);
    }
  }

  .breadcrumb-link {
    background: var(--el-fill-color-dark);

    &:hover {
      background: var(--el-color-primary-light-8);
      border-color: var(--el-color-primary-light-6);
    }

    &.is-current {
      background: linear-gradient(
        135deg,
        var(--el-color-primary-light-8),
        var(--el-color-primary-light-7)
      );
      border-color: var(--el-color-primary-light-5);
    }
  }
}

// 响应式
@media (max-width: 768px) {
  .breadcrumb-wrapper {
    padding: 0 4px;
    gap: 4px;
  }

  .home-icon {
    width: 28px;
    height: 28px;
    font-size: 14px;
  }

  .breadcrumb-link {
    padding: 4px 8px;

    .breadcrumb-text {
      font-size: 12px;
    }

    .breadcrumb-icon {
      font-size: 13px;
    }
  }

  .breadcrumb-separator {
    margin: 0 4px;
  }
}
</style>
