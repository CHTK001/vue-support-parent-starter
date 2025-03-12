<script setup lang="ts">
import "animate.css";
import { computed, onBeforeMount, ref, h, render, defineAsyncComponent, createApp } from "vue";
import Logo from "../lay-logo/index.vue";
import Tool from "../lay-toolbar/index.vue";
import { useRouter } from "vue-router";
import { transformI18n } from "@repo/config";
import { getConfig, resolvePath as configResolvePath } from "@repo/config";

import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import { emitter, findRouteByPath, getParentPaths, usePermissionStoreHook } from "@repo/core";
/**
 * //根据参数名去清除，可以多个
 */
function getNewUrl(reg) {
  let url = document.location.href;
  //let reg = /[^\w](url参数名|url参数名)=?([^&|^#]*)/g;
  url = url.replace(reg, "");
  reg = /&&/g;
  url = url.replace(reg, "");
  reg = /&#/g;
  url = url.replace(reg, "#");
  reg = /\?#/g;
  url = url.replace(reg, "#");
  // url = url.replaceAll(document.domain,"");
  // url = url.replaceAll("http://","");
  // url = url.replaceAll("https://","");
  reg = /\?#/g;
  url = url.replace(reg, "#");
  return url;
}
onBeforeMount(() => {
  let url = getNewUrl(/[^\w](redirectParam)=?([^&|^#]*)/g);
  if (url != document.location.href) {
    window.history.replaceState(null, null, url);
  }
});

const showMax = ref(5);
const offset = ref(0);
const menus = computed(() => {
  return getMenus().slice(offset.value, offset.value + showMax.value);
});
const getMenus = () => {
  const menus = usePermissionStoreHook().flatteningRoutes;
  return menus
    .filter((item) => {
      return item.meta?.showLink === true;
    })
    .filter((item) => {
      return item.meta?.engine !== false;
    })
    .filter((item) => {
      return !item.children || item.children.length == 0;
    })
    .filter((item) => {
      return item.path !== "/" && item.path !== "/home";
    });
};
const showOption = computed(() => {
  const rs = getMenus();
  return rs.length > showMax.value;
});

const hidenLeft = computed(() => {
  return offset.value <= 0;
});

const hideRight = computed(() => {
  const rs = getMenus();
  return showMax.value + offset.value >= rs.length;
});
const handleNext = (step) => {
  offset.value += step;
};
function resolvePath(routePath: string) {
  const httpReg = /^http(s?):\/\//;
  if (httpReg.test(routePath)) {
    return routePath;
  } else {
    // 使用path.posix.resolve替代path.resolve 避免windows环境下使用electron出现盘符问题
    return configResolvePath(".", routePath);
  }
}
const handleMenu = async (item) => {
  let url = location.href;
  if (url.indexOf("#") > -1) {
    url = url.substring(0, url.indexOf("#"));
  }
  window.open(url + "#" + item.path, "_blank");
};
</script>

<template>
  <div class="overflow-hidden">
    <div class="engine-header">
      <div class="engine-header-item"></div>
      <div class="engine-header-item engine-header-item-right flex"><Tool></Tool></div>
    </div>
    <div class="engine-container">
      <div class="engine-logo">
        <logo></logo>
      </div>
      <div class="engine-menu">
        <div class="engine-menu-router">
          <div v-if="showOption && !hidenLeft" @click="handleNext(-1)" class="engine-menu-router-item-option engine-menu-router-item-option-left !h-[180px] items-center flex justify-center cursor-pointer">
            <el-icon :size="24" class="flex-auto items-center">
              <component :is="useRenderIcon('ep:arrow-left')"></component>
            </el-icon>
          </div>
          <el-card v-for="i in menus" @click="handleMenu(i)" class="engine-menu-router-item cursor-pointer animate__animated animate__bounce animate__backInRight" shadow="hover">
            <div class="pt-[20px]">
              <div class="flex justify-center">
                <el-icon :size="48">
                  <component :is="useRenderIcon(i.meta.icon)"></component>
                </el-icon>
              </div>
              <div class="flex justify-center pt-[30px]">
                <span>{{ transformI18n(i.meta.i18nKey || i.meta.title) }}</span>
              </div>
            </div>
          </el-card>
          <div v-if="showOption && !hideRight" @click="handleNext(1)" class="engine-menu-router-item-option engine-menu-router-item-option-right !h-[180px] items-center flex justify-center">
            <el-icon :size="24" class="flex-auto items-center">
              <component :is="useRenderIcon('ep:arrow-right')"></component>
            </el-icon>
          </div>
        </div>
      </div>
    </div>
    <div class="engine-footer"></div>
  </div>
</template>

<style lang="scss" scoped>
.engine-container {
  height: calc(100vh - 86px);
  position: relative;
  .engine-logo {
    display: flex;
    justify-items: center;
    align-items: center;
  }
  .engine-logo > div {
    flex: 1 1 auto;
    height: 350px;
    width: 400px;
    justify-items: center;
    align-items: center;
  }
  .engine-menu {
    position: absolute;
    width: 800px;
    left: calc(50% - 400px);
    display: flex;
    justify-items: center;
    align-items: center;
  }
  .engine-menu > .engine-menu-router {
    display: flex;
    flex: 1 1 auto;
    position: relative;
    gap: 4px;
  }
  .engine-menu > .engine-menu-router > .engine-menu-router-item:not(.engine-menu-router-item-option) {
    flex: 1 1 auto;
    width: 20%;
    border-radius: 12px;
    box-shadow: inset 0px 0px 5px 2px rgb(204 204 204 / 63%);
    height: 180px;
  }
  .engine-menu-router-item-option {
    border: 1px solid #eee;
  }
  .engine-menu-router-item-option-left:hover {
    box-shadow: 3px 0px 2px 1px #eee;
  }

  .engine-menu-router-item-option-left {
    border-radius: 8px;
    position: absolute;
    left: -12px;
    z-index: 1000;
    background-color: white;
    cursor: pointer;
  }
  .engine-menu-router-item-option-right:hover {
    box-shadow: -3px 0px 2px 1px #eee;
  }

  .engine-menu-router-item-option-right {
    border-radius: 8px;
    position: absolute;
    right: -12px;
    z-index: 1000;
    background-color: white;
    cursor: pointer;
  }
}
.engine-footer {
  // border-top: 1px solid #eee;
  height: 38px;
}
.engine-header {
  height: 48px;
  // border-bottom: 1px solid #eee;
  .engine-header-item-right {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    min-width: 280px;
    height: 48px;
    color: rgba(0, 0, 0, 0.8509803922);
  }
}
.shadow-tab {
  --un-shadow: var(--tab-box-shadow-v2);
  box-shadow: var(--un-ring-offset-shadow), var(--un-ring-shadow), var(--un-shadow);
}
.app-wrapper {
  position: relative;
  width: 100%;
  height: 100%;

  &::after {
    display: table;
    clear: both;
    content: "";
  }

  &.mobile.openSidebar {
    position: fixed;
    top: 0;
  }
}
:deep(.bg-layout > div > .el-card__body) {
  padding: 0;
}
.app-mask {
  position: absolute;
  top: 0;
  z-index: 2001;
  width: 100%;
  height: 100%;
  background: #000;
  opacity: 0.3;
}

.re-screen {
  margin-top: 12px;
}

.engine-menu-router-item:hover {
  transform: scale(1.1);
  transition: all 1s ease 0s;
  -webkit-transform: scale(1.1); //-webkit-解决浏览器兼容问题
  -webkit-transform: all 1s ease 0s;
}
</style>
