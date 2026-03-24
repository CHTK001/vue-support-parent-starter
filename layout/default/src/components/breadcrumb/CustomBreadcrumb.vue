<script setup lang="ts">
/**
 * 深度定制化面包屑组件
 * @description 提供丰富的自定义选项和现代化的设计
 * @author CH
 * @version 1.0.0
 * @since 2024-12-15
 */
import { isEqual, useGlobal } from "@pureadmin/utils";
import { transformI18n } from "@repo/config";
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import { useRoute, useRouter } from "vue-router";
import { onBeforeUnmount, onMounted, ref, toRaw, watch, computed } from "vue";
import {
  emitter,
  findRouteByPath,
  getParentPaths,
  useMultiTagsStoreHook,
} from "@repo/core";

/**
 * 组件属性定义
 */
interface Props {
  /** 是否显示首页图标 */
  showHome?: boolean;
  /** 是否显示图标 */
  showIcon?: boolean;
  /** 分隔符类型: arrow | slash | dot | chevron */
  separator?: "arrow" | "slash" | "dot" | "chevron";
  /** 最大显示项数，超出部分折叠 */
  maxItems?: number;
  /** 是否启用动画 */
  enableAnimation?: boolean;
  /** 自定义首页路径 */
  homePath?: string;
  /** 是否显示工具提示 */
  showTooltip?: boolean;
  /** 显示模式: icon | text | icon-text */
  displayMode?: "icon" | "text" | "icon-text";
}

const props = withDefaults(defineProps<Props>(), {
  showHome: true,
  showIcon: true,
  separator: "arrow",
  maxItems: 5,
  enableAnimation: true,
  homePath: "/",
  showTooltip: true,
  displayMode: "icon-text",
});

const route = useRoute();
const router = useRouter();
const routes: any = router.options.routes;
const multiTags: any = useMultiTagsStoreHook().multiTags;
const levelList = ref<any[]>([]);
const { $storage } = useGlobal<any>();

// 面包屑显示模式（从配置中读取，可被 props 覆盖）
const breadcrumbMode = ref<string>(
  props.displayMode !== "icon-text"
    ? props.displayMode
    : $storage?.configure?.breadcrumbIconOnly
    ? "icon"
    : "icon-text"
);

// 监听模式变更
emitter.on("breadcrumbModeChange", (value: string) => {
  // 如果 props 没有指定 displayMode，则使用配置值
  if (props.displayMode === "icon-text") {
    breadcrumbMode.value = value;
  }
});

onBeforeUnmount(() => {
  emitter.off("breadcrumbModeChange");
});

/**
 * 获取面包屑数据
 */
const getBreadcrumb = (): void => {
  let currentRoute;

  if (Object.keys(route.query).length > 0) {
    multiTags.forEach((item: any) => {
      if (isEqual(route.query, item?.query)) {
        currentRoute = toRaw(item);
      }
    });
  } else if (Object.keys(route.params).length > 0) {
    multiTags.forEach((item: any) => {
      if (isEqual(route.params, item?.params)) {
        currentRoute = toRaw(item);
      }
    });
  } else {
    currentRoute = findRouteByPath(router.currentRoute.value.path, routes);
  }

  const parentRoutes = getParentPaths(
    router.currentRoute.value.name as string,
    routes,
    "name"
  );
  const matched: any[] = [];

  parentRoutes.forEach((path) => {
    if (path !== "/") matched.push(findRouteByPath(path, routes));
  });

  matched.push(currentRoute);

  matched.forEach((item, index) => {
    if (currentRoute?.query || currentRoute?.params) return;
    if (item?.children) {
      item.children.forEach((v: any) => {
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

/**
 * 处理链接点击
 */
const handleLink = (item: any) => {
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
  router.push(props.homePath);
};

/**
 * 获取分隔符图标
 */
const getSeparatorIcon = () => {
  const iconMap = {
    arrow: "ri:arrow-right-s-line",
    slash: "ri:slash",
    dot: "ri:more-line",
    chevron: "ri:arrow-right-wide-line",
  };
  return iconMap[props.separator];
};

/**
 * 处理的面包屑列表（支持折叠）
 */
const displayList = computed(() => {
  if (levelList.value.length <= props.maxItems) {
    return levelList.value;
  }
  // 如果超出最大项数，保留首页、前几项和最后几项
  const firstItems = levelList.value.slice(0, 1);
  const lastItems = levelList.value.slice(-2);
  return [...firstItems, { isEllipsis: true }, ...lastItems];
});

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
  <div class="custom-breadcrumb" :class="{ 'with-animation': enableAnimation }">
    <!-- 首页图标 -->
    <div
      v-if="showHome"
      class="breadcrumb-home"
      @click="goHome"
      :title="transformI18n('首页')"
    >
      <IconifyIconOnline icon="ri:home-5-line" class="home-icon" />
    </div>

    <!-- 首页分隔符 -->
    <div v-if="showHome && levelList.length > 0" class="breadcrumb-separator">
      <IconifyIconOnline :icon="getSeparatorIcon()" />
    </div>

    <!-- 面包屑导航 -->
    <div class="breadcrumb-list">
      <transition-group
        v-if="enableAnimation"
        name="breadcrumb-slide"
        tag="div"
        class="breadcrumb-items"
      >
        <div
          v-for="(item, index) in displayList"
          :key="item.isEllipsis ? 'ellipsis' : item.path"
          class="breadcrumb-item-wrapper"
        >
          <!-- 省略号 -->
          <div v-if="item.isEllipsis" class="breadcrumb-ellipsis">
            <IconifyIconOnline icon="ri:more-2-line" />
          </div>

          <!-- 面包屑项 -->
          <div v-else class="breadcrumb-item">
            <ScTooltip 
              v-if="showTooltip"
              :content="transformI18n(item.meta.i18nKey || item.meta.title)"
              placement="bottom"
              :show-after="500"
            >
              <a
                @click.prevent="handleLink(item)"
                :class="[
                  'breadcrumb-link',
                  {
                    'is-current': index === displayList.length - 1,
                    'is-clickable': index !== displayList.length - 1,
                  },
                ]"
              >
                <ScIcon 
                  v-if="showIcon && item.meta.icon && breadcrumbMode !== 'text'"
                  class="breadcrumb-icon"
                >
                  <component :is="useRenderIcon(item.meta.icon)" />
                </ScIcon>
                <span
                  v-if="breadcrumbMode !== 'icon'"
                  class="breadcrumb-text"
                >
                  {{ transformI18n(item.meta.i18nKey || item.meta.title) }}
                </span>
              </a>
            </ScTooltip>

            <a
              v-else
              @click.prevent="handleLink(item)"
              :class="[
                'breadcrumb-link',
                {
                  'is-current': index === displayList.length - 1,
                  'is-clickable': index !== displayList.length - 1,
                },
              ]"
            >
              <ScIcon 
                v-if="showIcon && item.meta.icon && breadcrumbMode !== 'text'"
                class="breadcrumb-icon"
              >
                <component :is="useRenderIcon(item.meta.icon)" />
              </ScIcon>
              <span v-if="breadcrumbMode !== 'icon'" class="breadcrumb-text">
                {{ transformI18n(item.meta.i18nKey || item.meta.title) }}
              </span>
            </a>

            <!-- 分隔符 -->
            <span
              v-if="index < displayList.length - 1 && !item.isEllipsis"
              class="breadcrumb-separator"
            >
              <IconifyIconOnline :icon="getSeparatorIcon()" />
            </span>
          </div>
        </div>
      </transition-group>

      <!-- 无动画版本 -->
      <div v-else class="breadcrumb-items">
        <div
          v-for="(item, index) in displayList"
          :key="item.isEllipsis ? 'ellipsis' : item.path"
          class="breadcrumb-item-wrapper"
        >
          <div v-if="item.isEllipsis" class="breadcrumb-ellipsis">
            <IconifyIconOnline icon="ri:more-2-line" />
          </div>

          <div v-else class="breadcrumb-item">
            <ScTooltip 
              v-if="showTooltip"
              :content="transformI18n(item.meta.i18nKey || item.meta.title)"
              placement="bottom"
              :show-after="500"
            >
              <a
                @click.prevent="handleLink(item)"
                :class="[
                  'breadcrumb-link',
                  {
                    'is-current': index === displayList.length - 1,
                    'is-clickable': index !== displayList.length - 1,
                  },
                ]"
              >
                <ScIcon 
                  v-if="showIcon && item.meta.icon && breadcrumbMode !== 'text'"
                  class="breadcrumb-icon"
                >
                  <component :is="useRenderIcon(item.meta.icon)" />
                </ScIcon>
                <span
                  v-if="breadcrumbMode !== 'icon'"
                  class="breadcrumb-text"
                >
                  {{ transformI18n(item.meta.i18nKey || item.meta.title) }}
                </span>
              </a>
            </ScTooltip>

            <a
              v-else
              @click.prevent="handleLink(item)"
              :class="[
                'breadcrumb-link',
                {
                  'is-current': index === displayList.length - 1,
                  'is-clickable': index !== displayList.length - 1,
                },
              ]"
            >
              <ScIcon 
                v-if="showIcon && item.meta.icon && breadcrumbMode !== 'text'"
                class="breadcrumb-icon"
              >
                <component :is="useRenderIcon(item.meta.icon)" />
              </ScIcon>
              <span v-if="breadcrumbMode !== 'icon'" class="breadcrumb-text">
                {{ transformI18n(item.meta.i18nKey || item.meta.title) }}
              </span>
            </a>

            <span
              v-if="index < displayList.length - 1 && !item.isEllipsis"
              class="breadcrumb-separator"
            >
              <IconifyIconOnline :icon="getSeparatorIcon()" />
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.custom-breadcrumb {
  display: flex;
  align-items: center;
  height: 100%;
  gap: 8px;
  flex-wrap: nowrap;
  overflow: hidden;
  position: relative;
}

// 首页图标
.breadcrumb-home {
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
  flex-shrink: 0;

  .home-icon {
    font-size: 16px;
  }

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
.breadcrumb-separator {
  display: flex;
  align-items: center;
  color: var(--el-text-color-placeholder);
  font-size: 14px;
  flex-shrink: 0;
  margin: 0 4px;
}

// 面包屑列表
.breadcrumb-list {
  flex: 1;
  min-width: 0;
  overflow: hidden;
}

.breadcrumb-items {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: nowrap;
  white-space: nowrap;
}

.breadcrumb-item-wrapper {
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
}

.breadcrumb-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

// 省略号
.breadcrumb-ellipsis {
  display: flex;
  align-items: center;
  padding: 0 4px;
  color: var(--el-text-color-placeholder);
  font-size: 16px;
  cursor: default;
}

// 面包屑链接
.breadcrumb-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 8px;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  background: var(--el-fill-color-lighter);
  border: 1px solid transparent;
  flex-shrink: 0;
  white-space: nowrap;
  text-decoration: none;
  position: relative;

  &.is-clickable {
    cursor: pointer;

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

    &:active {
      transform: translateY(0);
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
  flex-shrink: 0;
}

.breadcrumb-text {
  font-size: 13px;
  color: var(--el-text-color-regular);
  transition: color 0.25s;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 120px;
  display: inline-block;
}

// 动画
.breadcrumb-slide-enter-active,
.breadcrumb-slide-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.breadcrumb-slide-enter-from {
  opacity: 0;
  transform: translateX(-10px);
}

.breadcrumb-slide-leave-to {
  opacity: 0;
  transform: translateX(10px);
}

.breadcrumb-slide-move {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

// 深色模式适配
html.dark {
  .breadcrumb-home {
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

// 响应式设计
@media (max-width: 768px) {
  .custom-breadcrumb {
    gap: 4px;
  }

  .breadcrumb-home {
    width: 28px;
    height: 28px;

    .home-icon {
      font-size: 14px;
    }
  }

  .breadcrumb-link {
    padding: 4px 8px;

    .breadcrumb-text {
      font-size: 12px;
      max-width: 60px;
    }

    .breadcrumb-icon {
      font-size: 13px;
    }
  }

  .breadcrumb-separator {
    margin: 0 2px;
    font-size: 12px;
  }
}
</style>
