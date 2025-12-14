<script setup lang="ts">
//@ts-ignore
import { emitter } from "@repo/core";
import { isNumber, useGlobal } from "@pureadmin/utils";
import { usePermissionStoreHook } from "@repo/core";
import {
  computed,
  defineComponent,
  h,
  nextTick,
  onMounted,
  onBeforeUnmount,
  ref,
} from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import { useTags } from "../../hooks/useTag";
import LayFooter from "../lay-footer/index.vue";
import LayFrame from "../lay-frame/index.vue";

const props = defineProps({
  fixedHeader: Boolean,
});

const { t } = useI18n();
const { showModel } = useTags();
//@ts-ignore
const { $storage, $config } = useGlobal<GlobalPropertiesApi>();

// 组件缓存，从配置中读取
const isKeepAlive = ref(
  $storage?.configure?.keepAlive ?? $config?.KeepAlive ?? true
);

// 监听 keepAlive 变更事件
emitter.on("keepAliveChange", (value: boolean) => {
  isKeepAlive.value = value;
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

const hideFooter = ref($storage?.configure.hideFooter ?? false);

// 监听页脚显示/隐藏事件
emitter.on("hideFooterChange", (value: boolean) => {
  hideFooter.value = value;
});

onBeforeUnmount(() => {
  emitter.off("hideFooterChange");
  emitter.off("keepAliveChange");
});

const stretch = computed(() => {
  return $storage?.configure.stretch;
});

const layoutMode = computed(() => $storage?.layout.layout || "vertical");
const isVerticalLayout = computed(() => layoutMode.value === "vertical");

const cardBody = computed(() => {
  return $storage?.configure.cardBody;
});

const getMainWidth = computed(() => {
  return isNumber(stretch.value)
    ? stretch.value + "px"
    : stretch.value
      ? "1440px"
      : "100%";
});

// 判断是否为移动导航模式
const isMobileLayout = computed(() => layoutMode.value === "mobile");

const getSectionStyle = computed(() => {
  // 移动导航模式下，没有标签页，padding-top 更小
  if (isMobileLayout.value) {
    return ["padding-top: 0;"];
  }

  return [
    props.fixedHeader
      ? ""
      : `padding-top: 0;${hideTabs.value ? "min-height: calc(100vh - 48px);" : "min-height: calc(100vh - 86px);"}`,
  ];
});

onMounted(() => {
  nextTick(() => {
    document.body.style.setProperty("height", "100vh");
    document.body.style.setProperty("overflow", "hidden");
    document.body.style.setProperty(
      "--contentMargin",
      contentMargin.value + "px"
    );
    document.body.style.setProperty(
      "--layoutRadius",
      layoutRadius.value + "px"
    );
    document.body.style.setProperty("--layoutBlur", layoutBlur.value + "px");
  });
});

// 禁用过渡动画，直接渲染内容
const transitionMain = defineComponent({
  props: {
    route: {
      type: undefined,
      required: true,
    },
  },
  render() {
    // 直接返回内容，不使用 Transition 组件
    return this.$slots.default?.();
  },
});

const router = useRouter();
</script>

<template>
  <section
    :class="[fixedHeader ? 'app-main' : 'app-main-nofixed-header']"
    :style="getSectionStyle"
  >
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
              <el-backtop
                :title="t('buttons.pureBackTop')"
                target=".app-main .el-scrollbar__wrap"
              />
              <div class="grow bg-layout">
                <el-card
                  v-if="cardBody"
                  class="layout sidebar-custom"
                  shadow="never"
                  :style="{
                    height: 'calc(100% - ' + contentMargin * 2 + 'px)',
                    'border-radius': layoutRadius + 'px  !important',
                    margin: contentMargin + 'px'
                  }"
                >
                  <transitionMain :route="route">
                    <keep-alive
                      v-if="isKeepAlive"
                      :include="usePermissionStoreHook().cachePageList"
                    >
                      <component
                        :is="Comp"
                        :key="route.name"
                        :frameInfo="frameInfo"
                        class="main-content"
                      />
                    </keep-alive>
                    <component
                      :is="Comp"
                      v-else
                      :key="route.name"
                      :frameInfo="frameInfo"
                      class="main-content"
                    />
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
                    <keep-alive
                      v-if="isKeepAlive"
                      :include="usePermissionStoreHook().cachePageList"
                    >
                      <component
                        :is="Comp"
                        :key="route.name"
                        :frameInfo="frameInfo"
                        class="main-content"
                        :style="{ 'border-radius': layoutRadius + 'px' }"
                      />
                    </keep-alive>
                    <component
                      :is="Comp"
                      v-else
                      :key="route.name"
                      :frameInfo="frameInfo"
                      class="main-content"
                      :style="{ 'border-radius': layoutRadius + 'px' }"
                    />
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
                  margin: contentMargin + 'px'
                }"
              >
                <transitionMain :route="route">
                  <keep-alive
                    v-if="isKeepAlive"
                    :include="usePermissionStoreHook().cachePageList"
                  >
                    <component
                      :is="Comp"
                      :key="route.name"
                      :frameInfo="frameInfo"
                      class="main-content"
                    />
                  </keep-alive>
                  <component
                    :is="Comp"
                    v-else
                    :key="route.name"
                    :frameInfo="frameInfo"
                    class="main-content"
                  />
                </transitionMain>
              </el-card>
              <div
                v-else
                class="h-full layout sidebar-custom"
                shadow="never"
                :style="{
                  height: 'calc(100% - ' + contentMargin * 2 + 'px)',
                  margin: contentMargin + 'px',
                  'border-radius': layoutRadius + 'px  !important'
                }"
              >
                <transitionMain :route="route">
                  <keep-alive
                    v-if="isKeepAlive"
                    :include="usePermissionStoreHook().cachePageList"
                  >
                    <component
                      :is="Comp"
                      :key="route.name"
                      :frameInfo="frameInfo"
                      class="main-content"
                      :style="{ 'border-radius': layoutRadius + 'px' }"
                    />
                  </keep-alive>
                  <component
                    :is="Comp"
                    v-else
                    :key="route.name"
                    :frameInfo="frameInfo"
                    class="main-content"
                    :style="{ 'border-radius': layoutRadius + 'px' }"
                  />
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

<style lang="scss" scoped>
.sidebar-custom {
  background: var(--el-bg-color);
  border: 1px solid var(--el-card-border-color);
  border-radius: var(--el-card-border-radius);
  color: var(--el-text-color-primary);
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow:
    0 4px 16px rgba(0, 0, 0, 0.04),
    0 2px 8px rgba(0, 0, 0, 0.02);

  .dark & {
    box-shadow:
      0 4px 16px rgba(0, 0, 0, 0.15),
      0 2px 8px rgba(0, 0, 0, 0.1);
  }
}

.app-main {
  position: relative;
  width: 100%;
  height: 100%;
  overflow-x: hidden;
  z-index: 1; // 降低层级，让标签栏装饰可见
  background: var(--el-bg-color-page);
  transition: background-color 0.2s ease;

  html.dark & {
    background: var(--el-bg-color);
  }
}

.app-main-nofixed-header {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  background: var(--el-bg-color-page);
  transition: background-color 0.2s ease;

  html.dark & {
    background: var(--el-bg-color);
  }
}

.main-content {
  height: 100%;
  position: relative;
  z-index: 1; // 降低内容区层级
  background: transparent;
  transition: opacity 0.2s ease;
}

:deep(.el-card__body) {
  height: calc(100% - 0px);
}

.bg-layout {
  height: 100%;
  width: 100%;
  background: transparent;
}

:deep(.el-backtop) {
  background-color: var(--el-color-primary);
  box-shadow: 0 4px 12px rgba(var(--el-color-primary-rgb), 0.4);
  border-radius: 50%;
  color: var(--el-text-color-primary);
  height: 44px;
  width: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 6px 16px rgba(var(--el-color-primary-rgb), 0.5);
  }

  svg {
    height: 20px;
    width: 20px;
    transition: all 0.3s;
  }

  &:hover svg {
    transform: scale(1.1);
  }
}

:deep(.el-scrollbar) {
  .el-scrollbar__bar {
    opacity: 0.2;
    transition: opacity 0.3s;

    &:hover {
      opacity: 0.8;
    }
  }

  .el-scrollbar__wrap {
    scrollbar-width: thin;
    scrollbar-color: var(--el-color-primary) transparent;

    &::-webkit-scrollbar {
      width: 6px;
      height: 6px;
    }

    &::-webkit-scrollbar-thumb {
      background-color: var(--el-color-primary-light-5);
      border-radius: 10px;

      &:hover {
        background-color: var(--el-color-primary);
      }
    }

    &::-webkit-scrollbar-track {
      background-color: transparent;
    }
  }
}

/* 移除冗余的过渡样式定义，使用全局的 transition.scss */
</style>
