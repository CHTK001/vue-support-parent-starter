<template>
  <div class="lay-menu-body" v-if="showMenu">
    <div class="lay-menu-parent">
      <div class="lay-menu-parent-item">
        <div class="menu-title">
          <div class="item">
            <span class="span" @click="triggerService">
              <span class="icon">
                <el-icon>
                  <component :is="useRenderIcon('ep:menu')" />
                </el-icon>
              </span>
              <span class="text">{{ $t("menu.produce-service") }}</span>
              <span class="action">
                <el-icon>
                  <component :is="useRenderIcon('ep:arrow-up')" v-if="showService" />
                  <component :is="useRenderIcon('ep:arrow-down')" v-else />
                </el-icon>
              </span>
            </span>
          </div>
          <div class="item2" v-if="showService">
            <div class="span2">
              <button class="menu cursor-pointer" v-for="item in wholeMenus" @click="handleClickMenu(item)">
                <span class="icon">
                  <el-icon>
                    <component :is="useRenderIcon(item.meta.icon)" />
                  </el-icon>
                </span>
                <span class="text">{{ item.meta.i18nKey ? transformI18n(item.meta.i18nKey) : item.meta.title }}</span>
              </button>
            </div>
          </div>
          <div class="item">
            <span class="span" @click="triggerStar">
              <span class="icon">
                <el-icon>
                  <component :is="useRenderIcon('ri:star-line')" />
                </el-icon>
              </span>
              <span class="text">{{ $t("menu.produce-star") }}</span>
              <span class="action">
                <el-icon>
                  <component :is="useRenderIcon('ep:arrow-up')" v-if="showStar" />
                  <component :is="useRenderIcon('ep:arrow-down')" v-else />
                </el-icon>
              </span>
            </span>
          </div>
        </div>
      </div>
    </div>
    <div class="lay-menu-children" v-if="showMenuChildren">
      <LayMenuChildren :menu="clickMenuChildren" :title="clickMenuChildrenTitle" @close="triggerClose2"></LayMenuChildren>
    </div>
  </div>
</template>
<script setup lang="ts">
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import { transformI18n } from "@repo/config";
import { usePermissionStoreHook } from "@repo/core";
import { computed, defineAsyncComponent, defineEmits, defineExpose, shallowRef } from "vue";
import { useRouter } from "vue-router";
const emit = defineEmits();
const LayMenuChildren = defineAsyncComponent(() => import("./menu.vue"));
const router = useRouter();
const path = router.currentRoute.value.path;
const isHome = computed(() => {
  return path == "/" || path == "/home" || !path;
});
const wholeMenus = computed(() => {
  return usePermissionStoreHook().wholeMenus;
});

const clickMenuChildren = shallowRef([]);
const clickMenuChildrenTitle = shallowRef("其它");
const showMenuChildren = shallowRef(false);
const showMenu = shallowRef(false);
const showService = shallowRef(true);
const showStar = shallowRef(false);
const triggerClose = async () => {
  showMenuChildren.value = false;
  showMenu.value = false;
};

const triggerService = async () => {
  showService.value = !showService.value;
  showStar.value = false;
};
const triggerStar = async () => {
  showStar.value = !showStar.value;
  showService.value = false;
};
const triggerClose2 = async () => {
  triggerClose();
  emit("close");
};
const triggerOpen = async () => {
  showMenu.value = true;
};

const unRegisterActive = async () => {
  const _elementCollection = document.querySelectorAll(".active");
  if (_elementCollection) {
    _elementCollection.forEach((ele) => {
      ele.classList.remove("active");
    });
  }
};

const registerActive = async (element: Element) => {
  if (element) {
    element.classList.add("active");
  }
};
const handleClickMenu = async (item) => {
  unRegisterActive();
  //@ts-ignore
  registerActive(event.currentTarget);
  clickMenuChildren.value = item.children;
  clickMenuChildrenTitle.value = item.meta.i18nKey ? transformI18n(item.meta.i18nKey) : item.meta.title;
  showMenuChildren.value = true;
};

defineExpose({ triggerClose, triggerOpen });
</script>

<style lang="scss" scoped>
.lay-menu-body {
  --lay-menu-parent-width: 240px;
  --lay-menu-children-min-width: 750px;
  --lay-menu-children-max-width: 980px;
  position: fixed;
  width: 100%;
  height: 100%;
  left: 0;
  display: flex;
  top: var(--navbar-height);
  z-index: 930;
  .lay-menu-parent {
    z-index: 930;
    border-right: 1px solid var(--el-border-color);
    height: 100%;
    width: calc(var(--lay-menu-parent-width));
    background-color: var(--el-bg-color-2);
    box-shadow: 1px 0 2px 0 var(--cb-color-shadow, rgba(0, 0, 0, 0.16));
    transform: translateX(0px);
    overflow: hidden;
    transition:
      transform 200ms linear,
      left 100ms;
    left: 0px;
    .lay-menu-parent-item {
      display: flex;
      height: 100%;
      flex-direction: column;
      .menu-title {
        position: fixed;
        top: 0px;
        bottom: 0px;
        font-size: 12px;
        will-change: left;
        z-index: 931;
        width: 240px;
        box-shadow: 1px 0 2px 0 var(--cb-color-shadow, rgba(0, 0, 0, 0.16));
        left: 0px;
        transform: translateX(0px);
        overflow: hidden;
        .item.active {
          background-color: var(--cb-color-button-menu-bg-active, rgba(0, 46, 70, 0.04314));
        }
        .item2 {
          overflow: hidden;
          transition: flex 300ms ease-in;
          height: auto;
          flex: 1 1 0%;
          background-color: var(--cb-color-button-menu-bg, transparent);
          .span2 {
            padding: 12px 0 12px 32px;
            transition: flex 300ms ease-in;
            .menu {
              display: flex;
              padding: 0 12px;
              gap: 8px;
              width: 100%;
              max-width: 100%;
              cursor: pointer;
              text-align: left;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
              color: var(--el-text-color-primary-2);
              background-color: var(--cb-color-button-text-brand-secondary-bg, transparent);
              border-color: var(--cb-color-button-text-brand-secondary-border, transparent);
              height: 32px;
              line-height: 30px;
              .text {
                flex: 1 1 0%;
                overflow: hidden;
                gap: 10px;
                text-overflow: ellipsis;
                white-space: nowrap;
                font-size: 12px;
              }
            }
            .menu.active {
              color: var(--el-text-active, #ff6a00);
              border-right: 3px solid #ff6a00;
            }
          }
        }
        .item {
          border-top: 1px solid var(--el-border-color);
          border-bottom: 1px solid var(--el-border-color);
          padding: 0px 16px;
          height: 48px;
          line-height: 48px;
          display: block;
          border-radius: 0px;
          width: 100%;
          max-width: 100%;
          cursor: pointer;
          text-align: left;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          color: var(--el-text-color-primary-2);
          background-color: var(--cb-color-button-menu-bg, transparent);
          .span {
            display: flex;
            -webkit-box-align: center;
            align-items: center;
            .icon {
              display: inline-flex;
              margin: 0px 8px;
              min-width: 12px;
              text-align: left;
            }
            .text {
              flex: 1 1 0%;
              overflow: hidden;
              gap: 10px;
              text-overflow: ellipsis;
              white-space: nowrap;
              font-size: 12px;
            }
            .action {
              display: inline-flex;
              margin: 0px 8px;
              min-width: 12px;
              text-align: left;
            }
          }
        }
      }
    }
  }
  .lay-menu-children {
    z-index: 931;
    padding-left: 10px;
    padding-right: 10px;
    border-top-right-radius: 16px;
    border-bottom-right-radius: 16px;

    height: 100%;
    min-width: calc(var(--lay-menu-children-min-width));
    max-width: calc(var(--lay-menu-children-max-width));
    border-top: 1px solid var(--el-border-color);
    border-right: 1px solid var(--el-border-color);
    background-color: var(--el-bg-color);
    transform: translateX(0px);
    font-size: 12px;
    will-change: left;
  }
}
</style>
