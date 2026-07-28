<template>
  <!-- 使用方式：<KoiToolbar v-model:showSearch="showSearch" @refreshTable="handleTableData"></KoiToolbar> -->
  <!-- 不显示全屏按钮 :showMaximize="false" -->
  <div class="koi-toolbar">
    <el-row class="koi-toolbar-row">
      <el-tooltip :content="showSearch ? $t('button.hideSearch') : $t('button.displaySearch') " placement="top">
        <button type="button" class="koi-toolbar-btn" @click="toggleSearch()">
          <el-icon size="17"><Search /></el-icon>
        </button>
      </el-tooltip>
      <el-tooltip :content="$t('button.refresh')" placement="top">
        <button type="button" class="koi-toolbar-btn" @click="handleRefresh()">
          <el-icon size="18"><RefreshRight /></el-icon>
        </button>
      </el-tooltip>
      <button v-if="showMaximize" type="button" class="koi-toolbar-btn" @click="handleMaximize()">
        <el-icon v-if="!isMaximize"><FullScreen /></el-icon>
        <KoiGlobalIcon name="koi-fullscreen-exit" size="18" v-else></KoiGlobalIcon>
      </button>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick } from "vue";
import { FullScreen, Search, RefreshRight } from "@element-plus/icons-vue";
import useGlobalStore from "../../stores/modules/global.ts";

interface IToolbarProps {
  showSearch?: boolean;
  showMaximize?: boolean;
}

const props = withDefaults(defineProps<IToolbarProps>(), {
  showSearch: true,
  showMaximize: true
});

const emits = defineEmits(["update:showSearch", "refreshTable"]);

const globalStore = useGlobalStore();

/** 点击子组件，调用父组件方法 */
const toggleSearch = () => {
  // 同步修改父子组件的值，但是父组件需要使用v-model:showSearch="showSearch"
  // @ts-ignore
  emits("update:showSearch", !props.showSearch);
};

/** 点击子组件，调用父组件方法 */
const handleRefresh = () => {
  emits("refreshTable");
};

/** 全屏切换 */
const handleMaximize = () => {
  globalStore.setGlobalState("maximize", !globalStore.maximize);
  // 触发窗口resize事件，让表格自适应
  nextTick(() => {
    const event = new Event("resize");
    window.dispatchEvent(event);
  });
};

/** 是否全屏状态 */
const isMaximize = computed(() => globalStore.maximize);
</script>

<style lang="scss" scoped>
.koi-toolbar {
  margin-left: auto;
}

.koi-toolbar-row {
  gap: 8px;
}

.koi-toolbar-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  color: var(--el-text-color-regular);
  cursor: pointer;
  user-select: none;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  background: var(--el-fill-color-light);
  transition: all 0.2s ease;

  &:hover {
    color: var(--el-color-primary);
    border-color: color-mix(in srgb, var(--el-color-primary) 38%, var(--el-border-color));
    background: color-mix(in srgb, var(--el-color-primary-light-9) 78%, var(--el-fill-color-light));
  }

  &:active {
    transform: scale(0.96);
  }

  :deep(.el-icon) {
    font-size: 16px;
  }
}
</style>
