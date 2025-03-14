<script setup lang="ts">
//@ts-ignore
import BackTopIcon from "@repo/assets/svg/back_top.svg?component";
import { useTags } from "../../hooks/useTag";
import { usePermissionStoreHook } from "@repo/core";
import { isNumber, useGlobal } from "@pureadmin/utils";
import { computed, defineComponent, h, nextTick, onMounted, Transition } from "vue";
import { useI18n } from "vue-i18n";
import LayFooter from "../lay-footer/index.vue";
import LayFrame from "../lay-frame/index.vue";

const props = defineProps({
  fixedHeader: Boolean,
});

const { t } = useI18n();
const { showModel } = useTags();
//@ts-ignore
const { $storage, $config } = useGlobal<GlobalPropertiesApi>();

const isKeepAlive = computed(() => {
  return $config?.KeepAlive;
});

const transitions = computed(() => {
  return (route) => {
    return route.meta.transition;
  };
});

const hideTabs = computed(() => {
  return $storage?.configure.hideTabs;
});

const contentMargin = computed(() => {
  return $storage?.configure.contentMargin || 16;
});

const layoutRadius = computed(() => {
  return $storage?.configure.layoutRadius || 10;
});

const layoutBlur = computed(() => {
  return $storage?.configure.layoutBlur || 4;
});

const hideFooter = computed(() => {
  return $storage?.configure.hideFooter;
});

const stretch = computed(() => {
  return $storage?.configure.stretch;
});

const layout = computed(() => {
  return $storage?.layout.layout === "vertical";
});

const cardBody = computed(() => {
  return $storage?.configure.cardBody;
});

const getMainWidth = computed(() => {
  return isNumber(stretch.value) ? stretch.value + "px" : stretch.value ? "1440px" : "100%";
});

const getSectionStyle = computed(() => {
  return [
    hideTabs.value && layout ? "padding-top: 48px;" : "",
    !hideTabs.value && layout ? (showModel.value == "chrome" ? "padding-top: 85px;" : "padding-top: 81px;") : "",
    hideTabs.value && !layout.value ? "padding-top: 48px;" : "",
    !hideTabs.value && !layout.value ? (showModel.value == "chrome" ? "padding-top: 85px;" : "padding-top: 81px;") : "",
    props.fixedHeader ? "" : `padding-top: 0;${hideTabs.value ? "min-height: calc(100vh - 48px);" : "min-height: calc(100vh - 86px);"}`,
  ];
});

onMounted(async () => {
  nextTick(() => {
    document.body.style.setProperty("height", "100vh");
    document.body.style.setProperty("--contentMargin", contentMargin.value + "px");
    document.body.style.setProperty("--layoutRadius", layoutRadius.value + "px");
    document.body.style.setProperty("--layoutBlur", layoutBlur.value + "px");
  });
});

const transitionMain = defineComponent({
  props: {
    route: {
      type: undefined,
      required: true,
    },
  },
  render() {
    const menuTransition = $storage.configure.menuTransition;
    const transitionName = menuTransition ? transitions.value(this.route)?.name || "fade-transform" : "";
    const enterTransition = menuTransition ? transitions.value(this.route)?.enterTransition : "";
    const leaveTransition = menuTransition ? transitions.value(this.route)?.leaveTransition : "";
    return h(
      Transition,
      {
        name: !menuTransition ? "" : enterTransition ? "pure-classes-transition" : transitionName,
        enterActiveClass: !menuTransition ? "" : enterTransition ? `animate__animated ${enterTransition}` : undefined,
        leaveActiveClass: !menuTransition ? "" : leaveTransition ? `animate__animated ${leaveTransition}` : undefined,
        mode: "out-in",
        appear: true,
      },
      {
        default: () => [this.$slots.default()],
      }
    );
  },
});
</script>

<template>
  <section :class="[fixedHeader ? 'app-main' : 'app-main-nofixed-header']" :style="getSectionStyle">
    <router-view>
      <template #default="{ Component, route }">
        <LayFrame :currComp="Component" :currRoute="route">
          <template #default="{ Comp, fullPath, frameInfo }">
            <el-scrollbar
              v-if="fixedHeader"
              :wrap-style="{
                display: 'flex',
                'flex-wrap': 'wrap',
                'max-width': getMainWidth,
                margin: '0 auto',
                transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
              }"
              :view-style="{
                display: 'flex',
                flex: 'auto',
                overflow: 'hidden',
                'flex-direction': 'column',
              }"
            >
              <el-backtop :title="t('buttons.pureBackTop')" target=".app-main .el-scrollbar__wrap">
                <BackTopIcon />
              </el-backtop>
              <div class="grow bg-layout">
                <el-card
                  v-if="cardBody"
                  class="layout sidebar-custom"
                  shadow="never"
                  :style="{
                    height: 'calc(100% - ' + contentMargin * 2 + 'px)',
                    'border-radius': layoutRadius + 'px  !important',
                    margin: contentMargin + 'px',
                  }"
                >
                  <transitionMain :route="route">
                    <keep-alive v-if="isKeepAlive" :include="usePermissionStoreHook().cachePageList">
                      <component :is="Comp" :key="fullPath" :frameInfo="frameInfo" class="main-content" />
                    </keep-alive>
                    <component :is="Comp" v-else :key="fullPath" :frameInfo="frameInfo" class="main-content" />
                  </transitionMain>
                </el-card>
                <div
                  v-else
                  class="h-full layout sidebar-custom"
                  shadow="never"
                  :style="{
                    margin: contentMargin + 'px',
                    height: 'calc(100% - ' + contentMargin * 2 + 'px)',
                    'border-radius': layoutRadius + 'px !important',
                  }"
                >
                  <transitionMain :route="route">
                    <keep-alive v-if="isKeepAlive" :include="usePermissionStoreHook().cachePageList">
                      <component :is="Comp" :key="fullPath" :frameInfo="frameInfo" class="main-content" :style="{ 'border-radius': layoutRadius + 'px' }" />
                    </keep-alive>
                    <component :is="Comp" v-else :key="fullPath" :frameInfo="frameInfo" class="main-content" :style="{ 'border-radius': layoutRadius + 'px' }" />
                  </transitionMain>
                </div>
              </div>

              <LayFooter v-if="!hideFooter" />
            </el-scrollbar>
            <div v-else class="grow bg-layout">
              <el-card
                v-if="cardBody"
                class="h-full layout sidebar-custom"
                shadow="never"
                :style="{
                  height: 'calc(100% - ' + contentMargin * 2 + 'px)',
                  'border-radius': layoutRadius + 'px  !important',
                  margin: contentMargin + 'px',
                }"
              >
                <transitionMain :route="route">
                  <keep-alive v-if="isKeepAlive" :include="usePermissionStoreHook().cachePageList">
                    <component :is="Comp" :key="fullPath" :frameInfo="frameInfo" class="main-content" />
                  </keep-alive>
                  <component :is="Comp" v-else :key="fullPath" :frameInfo="frameInfo" class="main-content" />
                </transitionMain>
              </el-card>
              <div
                v-else
                class="h-full layout sidebar-custom"
                shadow="never"
                :style="{
                  height: 'calc(100% - ' + contentMargin * 2 + 'px)',
                  margin: contentMargin + 'px',
                  'border-radius': layoutRadius + 'px  !important',
                }"
              >
                <transitionMain :route="route">
                  <keep-alive v-if="isKeepAlive" :include="usePermissionStoreHook().cachePageList">
                    <component :is="Comp" :key="fullPath" :frameInfo="frameInfo" class="main-content" :style="{ 'border-radius': layoutRadius + 'px' }" />
                  </keep-alive>
                  <component :is="Comp" v-else :key="fullPath" :frameInfo="frameInfo" class="main-content" :style="{ 'border-radius': layoutRadius + 'px' }" />
                </transitionMain>
              </div>
            </div>
          </template>
        </LayFrame>
      </template>
    </router-view>

    <!-- 页脚 -->
    <LayFooter v-if="!hideFooter && !fixedHeader" />
  </section>
</template>

<style scoped>
.sidebar-custom {
  background-color: var(--el-bg-color);
  border: 1px solid var(--el-card-border-color);
  border-radius: var(--el-card-border-radius);
  color: var(--el-text-color-primary);
  overflow: hidden;
  transition: var(--el-transition-duration);
  --un-shadow: var(--sider-box-shadow);
  box-shadow: var(--un-ring-offset-shadow), var(--un-ring-shadow), var(--un-shadow);
}

.app-main {
  position: relative;
  width: 100%;
  height: 100vh;
  overflow-x: hidden;
}

.app-main-nofixed-header {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
}

.main-content {
  height: 100%;
  position: relative;
}

:deep(.el-card__body) {
  height: calc(100% - 0px);
}

.bg-layout {
  --un-bg-opacity: 1;
  background-color: rgb(var(--layout-bg-color) / var(--un-bg-opacity));

  .layout {
    border-radius: var(--layoutRadius, 6px) !important;
  }
}

/* .bg-layout {
 // --un-bg-opacity: 1;
  //background-color: rgb(var(--layout-bg-color) / var(--un-bg-opacity));
} */
</style>
