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
  }
);
</script>

<template>
  <div class="breadcrumb-wrapper">
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

// 春节主题适配
html[data-skin="spring-festival"] {
  .breadcrumb-wrapper {
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(255, 250, 240, 0.9));
    border-radius: 19px;
    padding: 0 12px;
    box-shadow: 
      0 2px 8px rgba(220, 20, 60, 0.15),
      inset 0 1px 0 rgba(255, 255, 255, 0.8);
  }

  .home-icon {
    background: linear-gradient(135deg, rgba(220, 20, 60, 0.1), rgba(255, 215, 0, 0.1));
    color: #DC143C;
    border: 1px solid rgba(255, 215, 0, 0.3);

    &:hover {
      background: linear-gradient(135deg, rgba(220, 20, 60, 0.2), rgba(255, 215, 0, 0.2));
      color: #B22222;
      border-color: rgba(255, 215, 0, 0.5);
      box-shadow: 0 4px 12px rgba(255, 215, 0, 0.3);
    }
  }

  .breadcrumb-divider {
    color: rgba(220, 20, 60, 0.5);
  }

  .breadcrumb-link {
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(255, 250, 240, 0.85));
    border-color: rgba(255, 215, 0, 0.3);
    color: #8B0000;
    font-family: 'STKaiti', 'KaiTi', 'SimKai', serif;

    &:hover {
      background: linear-gradient(135deg, rgba(255, 215, 0, 0.15), rgba(255, 250, 240, 0.95));
      border-color: rgba(255, 215, 0, 0.5);
      box-shadow: 0 4px 12px rgba(255, 215, 0, 0.3);

      .breadcrumb-text {
        color: #DC143C;
      }

      .breadcrumb-icon {
        color: #DC143C;
      }
    }

    &.is-current {
      background: linear-gradient(135deg, #FFD700, #FFA500);
      border-color: rgba(220, 20, 60, 0.4);
      box-shadow: 
        0 4px 16px rgba(255, 215, 0, 0.4),
        inset 0 2px 4px rgba(255, 255, 255, 0.5);

      .breadcrumb-text {
        color: #8B0000;
        font-weight: 700;
      }

      .breadcrumb-icon {
        color: #8B0000;
      }
    }
  }

  .breadcrumb-separator {
    color: rgba(220, 20, 60, 0.5);
    font-weight: 700;
  }

  .breadcrumb-text {
    color: #8B0000;
  }

  .breadcrumb-icon {
    color: rgba(139, 0, 0, 0.8);
  }
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



// 中秋主题适配
html[data-skin="mid-autumn"] {
  $mid-blue: #1a237e;
  $mid-blue-light: #283593;
  $mid-gold: #ffd54f;
  $mid-gold-light: #ffecb3;
  $mid-border: rgba(255, 213, 79, 0.3);

  .breadcrumb-wrapper {
    background: linear-gradient(135deg, rgba($mid-blue, 0.95), rgba($mid-blue-light, 0.9));
    border-radius: 12px;
    padding: 0 12px;
    border: 1px solid $mid-border;
    box-shadow: 0 2px 12px rgba($mid-blue, 0.3);
  }

  .home-icon {
    background: rgba($mid-blue, 0.6);
    color: $mid-gold;
    border: 1px solid $mid-border;

    &:hover {
      background: rgba($mid-gold, 0.2);
      color: #fff;
      border-color: $mid-gold;
      box-shadow: 0 0 12px rgba($mid-gold, 0.4);
    }
  }

  .breadcrumb-divider {
    color: rgba($mid-gold, 0.5);
  }

  .breadcrumb-link {
    background: rgba($mid-blue, 0.4);
    border: 1px solid rgba($mid-gold, 0.2);
    color: $mid-gold-light;

    &:hover {
      background: rgba($mid-gold, 0.15);
      border-color: $mid-gold;
      box-shadow: 0 0 12px rgba($mid-gold, 0.25);

      .breadcrumb-text {
        color: #fff;
      }

      .breadcrumb-icon {
        color: #fff;
      }
    }

    &.is-current {
      background: linear-gradient(135deg, $mid-gold, $mid-gold-light);
      border-color: rgba($mid-blue, 0.3);
      box-shadow: 0 4px 16px rgba($mid-gold, 0.5);

      .breadcrumb-text {
        color: $mid-blue;
        font-weight: 700;
      }

      .breadcrumb-icon {
        color: $mid-blue;
      }
    }
  }

  .breadcrumb-separator {
    color: rgba($mid-gold, 0.5);
  }

  .breadcrumb-text {
    color: $mid-gold-light;
  }

  .breadcrumb-icon {
    color: $mid-gold;
  }
}

// 圣诞主题适配
html[data-skin="christmas"] {
  $xmas-green: #1b5e20;
  $xmas-green-light: #2e7d32;
  $xmas-red: #c62828;
  $xmas-gold: #ffd700;
  $xmas-white: #ffffff;
  $xmas-border: rgba(255, 215, 0, 0.4);

  .breadcrumb-wrapper {
    background: linear-gradient(135deg, rgba($xmas-green, 0.95), rgba($xmas-green-light, 0.9));
    border-radius: 12px;
    padding: 0 12px;
    border: 2px solid $xmas-border;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.3);
  }

  .home-icon {
    background: rgba($xmas-green, 0.8);
    color: $xmas-gold;
    border: 1px solid $xmas-border;

    &:hover {
      background: rgba($xmas-red, 0.6);
      color: $xmas-white;
      border-color: $xmas-gold;
      box-shadow: 0 0 12px rgba($xmas-red, 0.4);
    }
  }

  .breadcrumb-divider {
    color: rgba($xmas-gold, 0.6);
  }

  .breadcrumb-link {
    background: rgba($xmas-green, 0.6);
    border: 1px solid rgba($xmas-gold, 0.3);
    color: $xmas-white;

    &:hover {
      background: rgba($xmas-red, 0.5);
      border-color: rgba($xmas-gold, 0.5);
      box-shadow: 0 0 12px rgba($xmas-red, 0.3);

      .breadcrumb-text {
        color: $xmas-white;
      }

      .breadcrumb-icon {
        color: $xmas-white;
      }
    }

    &.is-current {
      background: linear-gradient(135deg, $xmas-red, lighten($xmas-red, 10%));
      border: 2px solid $xmas-gold;
      box-shadow: 0 4px 16px rgba($xmas-red, 0.5);

      .breadcrumb-text {
        color: $xmas-white;
        font-weight: 700;
      }

      .breadcrumb-icon {
        color: $xmas-white;
      }
    }
  }

  .breadcrumb-separator {
    color: rgba($xmas-gold, 0.6);
  }

  .breadcrumb-text {
    color: $xmas-white;
  }

  .breadcrumb-icon {
    color: $xmas-gold;
  }
}

// 元旦主题适配
html[data-skin="new-year"] {
  $ice-lightest: #F5FBFF;
  $ice-light: #B8E0F2;
  $ice-medium: #7CC2E8;
  $ice-primary: #4EA8DE;
  $ice-deep: #2A7AB8;
  $ice-darker: #1E5F8C;
  $frost-purple: #E0E7F5;
  $ice-border: rgba(78, 168, 222, 0.3);

  .breadcrumb-wrapper {
    background: linear-gradient(135deg, rgba($ice-lightest, 0.98), rgba($frost-purple, 0.95));
    border-radius: 12px;
    padding: 0 12px;
    border: 1px solid $ice-border;
    box-shadow: 0 2px 12px rgba($ice-deep, 0.15);
    backdrop-filter: blur(8px);
  }

  .home-icon {
    background: rgba(255, 255, 255, 0.7);
    color: $ice-primary;
    border: 1px solid rgba($ice-medium, 0.3);

    &:hover {
      background: rgba($ice-medium, 0.2);
      color: $ice-deep;
      border-color: rgba($ice-primary, 0.5);
      box-shadow: 0 0 12px rgba($ice-primary, 0.3);
    }
  }

  .breadcrumb-divider {
    color: rgba($ice-primary, 0.5);
  }

  .breadcrumb-link {
    background: rgba(255, 255, 255, 0.7);
    border: 1px solid rgba($ice-medium, 0.25);
    color: $ice-darker;

    &:hover {
      background: rgba($ice-medium, 0.2);
      border-color: rgba($ice-primary, 0.4);
      box-shadow: 0 0 12px rgba($ice-primary, 0.2);

      .breadcrumb-text {
        color: $ice-deep;
      }

      .breadcrumb-icon {
        color: $ice-deep;
      }
    }

    &.is-current {
      background: linear-gradient(135deg, $ice-primary, $ice-medium);
      border: 1px solid rgba(255, 255, 255, 0.5);
      box-shadow: 0 4px 16px rgba($ice-primary, 0.4);

      .breadcrumb-text {
        color: #fff;
        font-weight: 700;
      }

      .breadcrumb-icon {
        color: #fff;
      }
    }
  }

  .breadcrumb-separator {
    color: rgba($ice-primary, 0.5);
  }

  .breadcrumb-text {
    color: $ice-darker;
  }

  .breadcrumb-icon {
    color: $ice-primary;
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
