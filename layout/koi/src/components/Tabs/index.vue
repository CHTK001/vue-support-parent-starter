<template>
  <div ref="rootRef" class="layout-tabs-bar layout-tabs" :class="tabsRootClass">
    <div class="layout-tabs-bar__scroll">
      <div
        v-for="(item, index) in tabList"
        :key="item.path"
        class="layout-tabs-bar__item"
        :class="{ 'is-active': activeTab === item.path }"
        :data-tab-index="index"
        :data-tab-path="item.path"
        @click="handleTabClick(item.path)"
      >
        <span v-if="tabsStyle === 'google'" class="line" aria-hidden="true"></span>
        <div class="layout-tabs-bar__label" :class="{ 'tab-label-inner': tabsStyle === 'card' }">
          <KoiGlobalIcon v-show="item.meta?.icon || item.icon" :name="item.meta?.icon || item.icon" size="16" class="m-r-6px" />
          <span class="layout-tabs-bar__title">{{ item?.meta?.title || item?.title }}</span>
        </div>
        <button
          v-if="item.isAffix !== '1' && !item.meta?.affix && !item.meta?.fixedTag"
          type="button"
          class="layout-tabs-bar__close"
          @click.stop="removeTab(item.path)"
        >
          <el-icon :size="14"><Close /></el-icon>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Close } from "@element-plus/icons-vue";
import { computed, ref } from "vue";
import { storeToRefs } from "pinia";
import { useKoiGlobalStore } from "../../stores/global";
import { useKoiTabsStore } from "../../stores/tabs";
import { useRouter } from "vue-router";

const router = useRouter();
const globalStore = useKoiGlobalStore();
const tabsStore = useKoiTabsStore();
const { tabsStyle } = storeToRefs(globalStore);
const { tabList } = storeToRefs(tabsStore);

const tabsRootClass = computed(() => {
  if (tabsStyle.value === "google") return "layout-tabs--google";
  if (tabsStyle.value === "plain") return "layout-tabs--plain";
  return "layout-tabs--glass-cards";
});

const rootRef = ref<HTMLElement | null>(null);

const activeTab = computed(() => router.currentRoute.value.path);

const handleTabClick = (path: string) => {
  router.push(path);
};

const removeTab = async (path: string) => {
  await tabsStore.removeTab(path);
  const latest = tabList.value[tabList.value.length - 1];
  if (latest) router.push(latest.path);
};
</script>

<style lang="scss" scoped>
.layout-tabs-bar {
  width: 100%; min-width: 0; flex-shrink: 0;
  border-top: 1px solid var(--el-border-color-lighter);
  background-color: var(--el-bg-color); box-sizing: border-box;
}

.layout-tabs-bar__scroll {
  display: flex; align-items: center;
  width: 100%; min-width: 0; flex: 1;
  padding: 0 6px; overflow-x: auto; overflow-y: hidden;
  box-sizing: border-box;
}

.layout-tabs-bar__item {
  position: relative; display: inline-flex; flex-shrink: 0;
  align-items: center; max-width: 220px; height: 32px;
  margin-top: 0; padding: 0 10px 0 12px;
  font-family: var(--el-font-family); font-size: var(--el-font-size-base);
  font-weight: 500; line-height: 32px; color: var(--el-text-color-primary);
  cursor: pointer; user-select: none; outline: none;
  box-sizing: border-box; background: transparent; border: none;
  transition: color 0.15s ease, border-color 0.15s ease, background-color 0.15s ease;
}

.layout-tabs-bar__label { display: inline-flex; align-items: center; min-width: 0; flex: 1; }
.layout-tabs-bar__label.tab-label-inner { gap: 2px; }
.layout-tabs-bar__title { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.layout-tabs-bar__close {
  display: inline-flex; flex-shrink: 0; align-items: center; justify-content: center;
  margin-left: 8px; padding: 0; color: var(--el-text-color-secondary);
  cursor: pointer; background: transparent; border: none; outline: none;
}
.layout-tabs-bar__item.is-active .layout-tabs-bar__close { color: inherit; }
.layout-tabs-bar__item.is-active .layout-tabs-bar__close:hover { background-color: color-mix(in srgb, var(--el-bg-color) 88%, var(--el-color-primary)); }

/* Card style */
.layout-tabs--glass-cards .layout-tabs-bar__item {
  margin: 0 1px; padding: 0 10px 0 12px;
  border: 1px solid var(--el-border-color); background: var(--el-bg-color);
  border-radius: 6px;
  &:hover:not(.is-active) { background-color: var(--el-fill-color-light); border-color: color-mix(in srgb, var(--el-color-primary) 42%, var(--el-border-color)); }
  &.is-active { color: var(--el-color-primary); background: var(--el-color-primary-light-9); border-color: var(--el-color-primary); }
}

/* Google style */
.layout-tabs--google .layout-tabs-bar__item {
  margin-left: 4px; margin-top: 6px; padding: 0 12px 0 14px; border-radius: 8px;
  &:first-of-type { margin-left: 8px; }
  .line {
    position: absolute; top: 0; bottom: 0; left: 0; width: 1px; height: 16px;
    margin: auto; background: var(--el-border-color); transition: opacity 0.3s ease; opacity: 1;
  }
  &:first-child .line { opacity: 0; }
  &:hover:not(.is-active) { background-color: var(--el-fill-color-light); .line { opacity: 0; } }
  &.is-active {
    color: var(--el-color-primary); background: var(--el-color-primary-light-9);
    &::before, &::after {
      position: absolute; bottom: 0; width: 20px; height: 20px;
      content: ""; border-radius: 50%; box-shadow: 0 0 0 30px var(--el-color-primary-light-9);
    }
    &::before { left: -20px; clip-path: inset(50% -10px 0 50%); }
    &::after { right: -20px; clip-path: inset(50% 50% 0 -10px); }
    .line { opacity: 0; }
  }
  &:hover + .layout-tabs-bar__item .line, &.is-active + .layout-tabs-bar__item .line { opacity: 0; }
}

/* Plain style */
.layout-tabs--plain .layout-tabs-bar__item {
  margin: 0 2px; padding: 0 12px;
  color: var(--el-text-color-regular); background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-light); border-radius: 6px;
  &.is-active { color: var(--el-color-primary); }
  .layout-tabs-bar__close { color: inherit; }
  :deep(.el-icon) { color: inherit; }
}

.layout-tabs--google .layout-tabs-bar__item:focus,
.layout-tabs--glass-cards .layout-tabs-bar__item:focus,
.layout-tabs--plain .layout-tabs-bar__item:focus { outline: none; box-shadow: none; }
</style>
