<template>
  <div class="menu-children">
    <div class="menu-children-title justify-between">
      <h2>{{ props.title }}</h2>
      <el-icon class="menu-children-close" @click="handleClose">
        <component :is="useRenderIcon('ep:close')" />
      </el-icon>
    </div>
    <div class="menu-children-content">
      <el-row>
        <el-col :span="8" v-for="(item, index) in props.menu" :key="index">
          <template v-if="item.children && item.children.length > 0 && index == 0">
            <h2 class="cursor-default">{{ item?.meta.title }}</h2>
            <el-icon class="menu-children-close" @click="handleClose">
              <component :is="useRenderIcon('ep:close')" />
            </el-icon>
          </template>

          <template v-if="item.children && item.children.length > 0">
            <div v-for="(item1, index) in item.children">
              <div class="children" @click="openMenu(item1)">
                <el-icon v-if="item1.meta.icon" class="icon">
                  <component :is="useRenderIcon(item1.meta.icon)" />
                </el-icon>
                <span class="children-title">{{ item1.meta.title }}</span>
              </div>
            </div>
          </template>
          <div v-else class="children" @click="openMenu(item)">
            <el-icon v-if="item.meta.icon" class="icon">
              <component :is="useRenderIcon(item.meta.icon)" />
            </el-icon>
            <span class="children-title">{{ item.meta.title }}</span>
          </div>
        </el-col>
      </el-row>
    </div>
  </div>
</template>
<script setup>
import { useGlobal } from "@pureadmin/utils";
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import { computed, defineEmits, defineProps } from "vue";
import { router } from "@repo/core";
//@ts-ignore
const { $storage } = useGlobal();
const emit = defineEmits();
const props = defineProps({
  menu: {
    type: Object,
    default: () => {
      return {};
    },
  },
  title: {
    type: String,
    default: () => {
      return "";
    },
  },
});

/**
 * @description: 菜单展开收起
 */
const openOrInlay = computed(() => {
  debugger;
  return $storage.configure.openOrInlay;
});
/**
 * @description: 打开菜单
 */
const openMenu = async (item) => {
  if (openOrInlay) {
    window.open(`#${item.path}`, "_blank");
    return;
  }
  router.push(item.path);
};
const handleClose = async () => {
  emit("close");
};
</script>

<style scoped lang="scss">
.menu-children {
  display: flex;
  flex-direction: column;
  .children {
    cursor: pointer;
    height: 32px;
    display: flex;
    color: var(--el-text-color-primary-2);
    gap: 4px;
    .icon {
      top: 3px;
    }
  }
}
.menu-children-title {
  display: flex;
  color: var(--el-text-color-primary);
  flex-direction: row;
  height: 48px;
  font-size: 14px;
  line-height: 48px;
  font-weight: 600;
  .menu-children-close {
    font-size: 20px;
    line-height: 18px;
    color: var(--el-text-color-primary);
    top: 12px;
    cursor: pointer;
  }
}
</style>
