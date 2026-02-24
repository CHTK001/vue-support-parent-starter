<template>
  <div
    class="header-container"
    :class="{ 'fixed-header': set.fixedHeader }"
  >
    <LayNav />
    
    <!-- 标签页：在非移动模式下显示，且未隐藏标签页 -->
    <div v-if="layout !== 'mobile' && !set.hideTabs" class="header-tags">
      <LayTag v-if="defer(2)" />
    </div>
  </div>
</template>
<script setup lang="ts">
import LayTag from "../lay-tag/index.vue";
import LayNav from "../lay-nav/index.vue";
import { useAppStoreHook, useSettingStoreHook } from "@repo/core";
import { useGlobal } from "@pureadmin/utils";
import { computed, reactive } from "vue";
import { useLayout } from "../../hooks/useLayout";
import { setType } from "../../types";
import { useDefer } from "@repo/utils";

const { layout } = useLayout();
const { $storage } = useGlobal<GlobalPropertiesApi>();
const pureSetting = useSettingStoreHook();

// 提取 store 引用到顶层，避免在 computed 中重复调用
const appStore = useAppStoreHook();

const defer = useDefer(3);

const set: setType = reactive({
  sidebar: computed(() => appStore.sidebar),
  device: computed(() => appStore.device),
  fixedHeader: computed(() => pureSetting.fixedHeader),
  // 保留以下属性以保持类型完整性，即使未在模板中直接使用
  classes: computed(() => ({
    hideSidebar: !set.sidebar.opened,
    openSidebar: set.sidebar.opened,
    withoutAnimation: set.sidebar.withoutAnimation,
    mobile: set.device === "mobile",
  })),
  hideTabs: computed(() => $storage?.configure.hideTabs),
});
</script>

<script lang="ts">
// 导入集中的主题皮肤样式
import '@repo/skin';
</script>

<style lang="scss" scoped>
// 基础容器样式
.header-container {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  background: var(--el-bg-color);
}

// 头部容器样式优化
.header-only-tags {
  position: relative;
  min-height: 48px;
  background: transparent;
}
</style>

