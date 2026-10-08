<template>
  <div class="search-menu-trigger">
    <div
      class="hover:bg-[--el-header-icon-hover-bg-color] koi-icon w-36px h-36px rounded-md flex flex-justify-center flex-items-center koi-pulse-i"
      @click="isShowSearch = true"
    >
      <el-tooltip :content="$t('header.searchMenu')">
        <ReIcon name="koi-search" size="18" />
      </el-tooltip>
    </div>

    <ReDialog
      v-model="isShowSearch"
      class="search-menu-dialog"
      width="520"
      :show-close="false"
      top="10vh"
      append-to-body
      destroy-on-close
    >
      <div class="search-menu">
        <div class="search-menu__search">
          <el-input
            ref="menuInputRef"
            v-model="searchMenu"
            :placeholder="$t('header.menuSearch')"
            size="large"
            clearable
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </div>

        <div class="search-menu__content">
          <div v-if="!searchMenu.trim()" class="search-menu__placeholder">
            <div class="search-menu__placeholder-icon">
              <ReIcon name="koi-search" size="28" />
            </div>
            <p class="search-menu__placeholder-title">{{ $t("header.searchMenu") }}</p>
            <p class="search-menu__placeholder-desc">{{ $t("header.searchMenuHint") }}</p>
          </div>

          <el-scrollbar v-else-if="searchList.length" max-height="360">
            <div ref="menuListRef" class="search-menu__list">
              <div
                v-for="item in searchList"
                :key="item.path"
                :class="['search-menu__item', { 'is-active': item.path === activePath }]"
                @mouseenter="activePath = item.path"
                @click="handleClickMenuItem(item)"
              >
                <div class="search-menu__item-icon">
                  <ReIcon v-if="item.meta.icon" :name="item.meta.icon" size="16" />
                  <el-icon v-else :size="16"><Menu /></el-icon>
                </div>
                <div class="search-menu__item-meta">
                  <span class="search-menu__item-title">{{ item.localizedTitle }}</span>
                  <span class="search-menu__item-path">{{ item.path }}</span>
                </div>
                <span v-if="item.path === activePath" class="search-menu__item-enter">↵</span>
              </div>
            </div>
          </el-scrollbar>

          <el-empty v-else :image-size="72" :description="$t('msg.null')" />
        </div>

        <div class="search-menu__footer">
          <span class="search-menu__shortcut">
            <kbd>↑</kbd><kbd>↓</kbd>
            {{ $t("header.searchMenuSelect") }}
          </span>
          <span class="search-menu__shortcut">
            <kbd>↵</kbd>
            {{ $t("header.searchMenuEnter") }}
          </span>
          <span class="search-menu__shortcut">
            <kbd>ESC</kbd>
            {{ $t("header.searchMenuEsc") }}
          </span>
        </div>
      </div>
    </ReDialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, watch } from "vue";
import { Menu, Search } from "@element-plus/icons-vue";
import type { InputInstance } from "element-plus";
import useAuthStore from "@repo/pinia/modules/auth";
import { useRouter } from "vue-router";
import { useDebounceFn } from "@vueuse/core";
import { useI18n } from "vue-i18n";
import { getMenuLanguage } from "@repo/languages";
import ReDialog from "@repo/ui/re-dialog";

const router = useRouter();
const authStore = useAuthStore();
const { locale } = useI18n();

/**
 * 与侧边栏一致：只收录可见菜单；有可见子节点则继续递归，仅叶子（可点击项）进入搜索。
 * 数据源用 recursiveMenuList，包含 staticRouter 与后端动态路由，解决仅 menuList（仅后端扁平）搜不到静态菜单的问题。
 */
function flattenVisibleLeafMenus(routes: any[] | undefined, bucket: any[] = []): any[] {
  if (!Array.isArray(routes)) return bucket;
  for (const item of routes) {
    if (String(item?.meta?.isVisible) !== "1") continue;
    const visibleChildren = (item.children || []).filter((c: any) => String(c?.meta?.isVisible) === "1");
    if (visibleChildren.length > 0) {
      flattenVisibleLeafMenus(visibleChildren, bucket);
    } else {
      bucket.push(item);
    }
  }
  return bucket;
}

const menuList = computed(() => flattenVisibleLeafMenus(authStore.recursiveMenuList));

const localizedMenuList = computed(() => {
  locale.value;
  return menuList.value.map((item: any) => ({
    ...item,
    localizedTitle: getMenuLanguage(item.meta?.title ?? ""),
    originalTitle: item.meta?.title ?? ""
  }));
});

const activePath = ref("");
const menuInputRef = ref<InputInstance | null>(null);
const menuListRef = ref<HTMLElement | null>(null);
const isShowSearch = ref(false);
const searchMenu = ref("");
const searchList = ref<any[]>([]);

const updateSearchList = () => {
  const keyword = searchMenu.value.trim();
  searchList.value = keyword
    ? localizedMenuList.value.filter((item: any) => {
        const searchText = keyword.toLowerCase();
        const titleMatch = item.localizedTitle.toLowerCase().includes(searchText);
        const originalTitleMatch = item.originalTitle.toLowerCase().includes(searchText);
        const pathMatch = item.path.toLowerCase().includes(searchText);
        return (titleMatch || originalTitleMatch || pathMatch) && item.meta?.isVisible === "1";
      })
    : [];
  activePath.value = searchList.value[0]?.path ?? "";
};

const debouncedUpdateSearchList = useDebounceFn(updateSearchList, 200);

watch(searchMenu, debouncedUpdateSearchList);

watch(locale, () => {
  if (isShowSearch.value) updateSearchList();
});

watch(isShowSearch, val => {
  if (val) {
    document.addEventListener("keydown", keyboardOperation);
    nextTick(() => {
      setTimeout(() => menuInputRef.value?.focus(), 50);
    });
  } else {
    document.removeEventListener("keydown", keyboardOperation);
    searchMenu.value = "";
    searchList.value = [];
    activePath.value = "";
  }
});

const scrollActiveIntoView = () => {
  nextTick(() => {
    menuListRef.value?.querySelector(".search-menu__item.is-active")?.scrollIntoView({ block: "nearest" });
  });
};

const keyPressUpOrDown = (direction: number) => {
  const length = searchList.value.length;
  if (length === 0) return;
  const index = searchList.value.findIndex((item: any) => item.path === activePath.value);
  const newIndex = (index + direction + length) % length;
  activePath.value = searchList.value[newIndex].path;
  scrollActiveIntoView();
};

const keyboardOperation = (event: KeyboardEvent) => {
  if (event.key === "ArrowUp") {
    event.preventDefault();
    keyPressUpOrDown(-1);
  } else if (event.key === "ArrowDown") {
    event.preventDefault();
    keyPressUpOrDown(1);
  } else if (event.key === "Enter") {
    event.preventDefault();
    handleClickMenu();
  } else if (event.key === "Escape") {
    event.preventDefault();
    isShowSearch.value = false;
  }
};

const handleClickMenuItem = (item: any) => {
  if (!item) return;
  activePath.value = item.path;
  setTimeout(() => {
    if (item.meta?.linkUrl) window.open(item.meta.linkUrl, "_blank");
    else router.push(item.path);
    isShowSearch.value = false;
  }, 120);
};

const handleClickMenu = () => {
  const menu = searchList.value.find((item: any) => item.path === activePath.value);
  if (!menu) return;
  handleClickMenuItem(menu);
};
</script>

<style lang="scss" scoped>
.search-menu-trigger {
  position: relative;
  display: flex;
  align-items: center;
}

.search-menu {
  display: flex;
  flex-direction: column;
  min-height: 420px;
}

.search-menu__search {
  padding: 16px 16px 12px;

  :deep(.el-input__wrapper) {
    border-radius: 10px;
    box-shadow: 0 0 0 1px var(--el-border-color-lighter) inset;
  }

  :deep(.el-input__wrapper.is-focus) {
    box-shadow: 0 0 0 1px var(--el-color-primary) inset;
  }
}

.search-menu__content {
  flex: 1;
  min-height: 280px;
  padding: 0 12px;
}

.search-menu__placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 280px;
  padding: 0 24px;
  text-align: center;
}

.search-menu__placeholder-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  margin-bottom: 14px;
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
  border-radius: 14px;
}

.search-menu__placeholder-title {
  margin: 0 0 6px;
  font-size: 15px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.search-menu__placeholder-desc {
  margin: 0;
  font-size: 13px;
  line-height: 1.5;
  color: var(--el-text-color-secondary);
}

.search-menu__list {
  padding: 4px 4px 8px;
}

.search-menu__item {
  display: flex;
  gap: 12px;
  align-items: center;
  height: 52px;
  padding: 0 10px;
  margin-bottom: 4px;
  cursor: pointer;
  border-radius: 8px;
  transition:
    background-color 0.2s ease,
    color 0.2s ease,
    box-shadow 0.2s ease;

  &:last-child {
    margin-bottom: 0;
  }

  &:hover,
  &.is-active {
    background-color: var(--el-color-primary-light-9);
  }

  &.is-active {
    box-shadow: inset 0 0 0 1px var(--el-color-primary-light-7);

    .search-menu__item-title {
      color: var(--el-color-primary);
      font-weight: 500;
    }

    .search-menu__item-icon {
      color: var(--el-color-primary);
      background-color: var(--el-color-primary-light-8);
    }
  }
}

.search-menu__item-icon {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  color: var(--el-text-color-secondary);
  background-color: var(--el-fill-color-light);
  border-radius: 8px;
  transition:
    background-color 0.2s ease,
    color 0.2s ease;
}

.search-menu__item-meta {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  line-height: 1.3;
}

.search-menu__item-title {
  overflow: hidden;
  font-size: 14px;
  color: var(--el-text-color-primary);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.search-menu__item-path {
  overflow: hidden;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.search-menu__item-enter {
  flex-shrink: 0;
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}

.search-menu__footer {
  display: flex;
  gap: 18px;
  align-items: center;
  justify-content: center;
  padding: 10px 16px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color-lighter);
  border-top: 1px solid var(--el-border-color-lighter);
}

.search-menu__shortcut {
  display: inline-flex;
  gap: 4px;
  align-items: center;
  white-space: nowrap;

  kbd {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 20px;
    height: 20px;
    padding: 0 5px;
    font-family: inherit;
    font-size: 11px;
    line-height: 1;
    color: var(--el-text-color-regular);
    background: var(--el-bg-color);
    border: 1px solid var(--el-border-color);
    border-radius: 4px;
    box-shadow: 0 1px 0 var(--el-border-color-lighter);
  }
}
</style>

<style lang="scss">
.search-menu-dialog {
  .el-dialog {
    overflow: hidden;
    border-radius: 12px;
    box-shadow: 0 12px 40px rgb(0 0 0 / 12%);
  }

  .el-dialog__header {
    display: none;
  }

  .el-dialog__body {
    padding: 0;
  }
}
</style>
