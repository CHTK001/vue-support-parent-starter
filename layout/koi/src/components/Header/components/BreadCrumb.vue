<template>
  <div class="breadcrumb-container">
    <div :class="['breadcrumb-box', 'mask-image']">
      <el-breadcrumb :separator-icon="ArrowRight">
        <transition-group name="breadcrumb">
          <el-breadcrumb-item v-for="(item, index) in breadcrumbList" :key="item.path">
            <el-dropdown v-if="item.children && item.children.length > 0" @command="handleDropdownCommand">
              <span class="el-breadcrumb__inner is-link flex flex-items-center outline-none gap-x-4px">
                <KoiGlobalIcon v-if="item.meta?.icon" :name="item.meta?.icon" size="16" />
                {{ item.meta?.title }}
                <el-icon><ArrowDown /></el-icon>
              </span>
              <template #dropdown>
                <el-dropdown-menu>
                  <template v-for="child in item.children">
                    <el-dropdown-item
                      v-if="child.meta && child.meta.isVisible === '1'"
                      :key="child.path"
                      :command="{ item: child, index }"
                    >
                      <KoiGlobalIcon v-if="child.meta?.icon" :name="child.meta?.icon" size="16" />
                      {{ child.meta?.title }}
                    </el-dropdown-item>
                  </template>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
            <div
              v-else
              class="el-breadcrumb__inner is-link flex flex-items-center outline-none gap-x-4px"
              :class="{ 'item-no-icon': !item.meta.icon }"
              @click="handleBreadcrumb(item, index)"
            >
              <KoiGlobalIcon v-if="item.meta?.icon" :name="item.meta?.icon" size="16" />
              <span>{{ item.meta?.title }}</span>
            </div>
          </el-breadcrumb-item>
        </transition-group>
      </el-breadcrumb>
    </div>
    <div class="breadcrumb-fade"></div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { HOME_URL } from "../../../config/index";
import { useRoute, useRouter } from "vue-router";
import { ArrowRight, ArrowDown } from "@element-plus/icons-vue";
import { useKoiAuthStore } from "../../../stores/auth";

const route = useRoute();
const router = useRouter();
const authStore = useKoiAuthStore();

const breadcrumbList = computed(() => {
  let breadcrumbData = authStore.getBreadcrumbList[route.matched[route.matched.length - 1].path] ?? [];
  if (!breadcrumbData) return;
  if (breadcrumbData.length > 1 && breadcrumbData[1].meta?.activeMenu) {
    breadcrumbData = findRouteChildrenByActiveMenu(
      authStore.getBreadcrumbList,
      breadcrumbData[breadcrumbData.length - 1]?.meta?.activeMenu
    ).concat(breadcrumbData[breadcrumbData.length - 1]);
  }
  return breadcrumbData;
});

function findRouteChildrenByActiveMenu(list: any[], activeMenu: string): any[] {
  for (const item of list) {
    if (item.path === activeMenu) return item.children || [];
    if (item.children?.length) {
      const found = findRouteChildrenByActiveMenu(item.children, activeMenu);
      if (found.length) return found;
    }
  }
  return [];
}

const handleBreadcrumb = (item: any, index: number | string) => {
  if (index !== breadcrumbList.value.length - 1) router.push(item.path);
};

const handleDropdownCommand = ({ item }: any) => {
  if (item.meta?.linkUrl) {
    if (/^https?:\/\//.test(item.meta?.linkUrl)) {
      return window.open(item.meta.linkUrl, "_blank");
    }
  }
  router.push(item.path);
};
</script>

<style scoped lang="scss">
.breadcrumb-enter-active { transition: all 0.2s; }
.breadcrumb-enter-from, .breadcrumb-leave-active { opacity: 0; transform: translateX(10px); }

.breadcrumb-box {
  display: flex;
  align-items: center;
  padding-top: 2px;
  margin-left: 10px;
  overflow: hidden;
  user-select: none;
  width: 100%;
  .el-breadcrumb__inner a, .el-breadcrumb__inner.is-link { font-weight: 500; }
  .el-breadcrumb {
    line-height: 15px;
    white-space: nowrap;
    .el-breadcrumb__item {
      position: relative;
      display: inline-block;
      .item-no-icon { transform: translateY(-3px); }
      .el-breadcrumb__inner {
        display: inline-flex;
        line-height: 10px;
        &.is-link {
          color: var(--el-header-text-color);
          &:hover { color: var(--el-color-primary); }
        }
      }
      &:last-child .el-breadcrumb__inner,
      &:last-child .el-breadcrumb__inner:hover {
        color: var(--el-header-text-regular-color);
      }
      :deep(.el-breadcrumb__separator) { transform: translateY(1px); }
    }
  }
}

.breadcrumb-container {
  position: relative;
  display: flex;
  width: 100%;
  min-width: 0;
}

.breadcrumb-fade {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 50px;
  background: linear-gradient(90deg, rgba(255, 255, 255, 0) 0%, var(--el-header-bg-color) 100%);
  pointer-events: none;
}
</style>
