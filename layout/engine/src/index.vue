<script setup lang="ts">
import { onBeforeMount } from "vue";
import "./index.css";
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
</script>

<template>
  <div ref="appWrapperRef" :class="['app-wrapper', set.classes]">
    <div v-show="set.device === 'mobile' && set.sidebar.opened && layout.includes('vertical')" class="app-mask" @click="useAppStoreHook().toggleSideBar()" />
    <NavVertical v-show="!pureSetting.hiddenSideBar && (layout.includes('vertical') || layout.includes('mix'))" />
    <div :class="['main-container', pureSetting.hiddenSideBar ? 'main-hidden' : '']">
      <div v-if="set.fixedHeader">
        <LayHeader />
        <!-- 主体内容 -->
        <Suspense>
          <template #default>
            <div>
              <LayContent :fixed-header="set.fixedHeader" />
            </div>
          </template>
        </Suspense>
      </div>
      <el-scrollbar v-else>
        <el-backtop :title="t('buttons.pureBackTop')" target=".main-container .el-scrollbar__wrap">
          <BackTopIcon />
        </el-backtop>
        <LayHeader />
        <!-- 主体内容 -->
        <Suspense>
          <template #default>
            <div>
              <LayContent :fixed-header="set.fixedHeader" />
            </div>
          </template>
        </Suspense>
      </el-scrollbar>
    </div>
    <!-- 系统设置 -->
    <LaySetting v-if="pureSetting.showBarSetting" />
  </div>
</template>

<style lang="scss" scoped>
.shadow-tab {
  --un-shadow: var(--tab-box-shadow2);
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
</style>
