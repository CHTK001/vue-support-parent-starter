<script setup lang="ts">
//@ts-ignore
import { isNumber, useGlobal } from "@pureadmin/utils";
import { usePermissionStoreHook } from "@repo/core";
import {
  computed,
  defineComponent,
  h,
  nextTick,
  onMounted,
  Transition,
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

const getSectionStyle = computed(() => {
  return [
    hideTabs.value && isVerticalLayout.value ? "padding-top: 48px;" : "",
    !hideTabs.value && isVerticalLayout.value
      ? showModel.value == "chrome"
        ? "padding-top: 85px;"
        : "padding-top: 81px;"
      : "",
    hideTabs.value && !isVerticalLayout.value ? "padding-top: 48px;" : "",
    !hideTabs.value && !isVerticalLayout.value
      ? showModel.value == "chrome"
        ? "padding-top: 85px;"
        : "padding-top: 81px;"
      : "",
    props.fixedHeader
      ? ""
      : `padding-top: 0;${hideTabs.value ? "min-height: calc(100vh - 48px);" : "min-height: calc(100vh - 86px);"}`,
  ];
});

onMounted(async () => {
  // 确保在组件挂载时保持深色主题
  try {
    const storage = localStorage.getItem("layout");
    if (storage) {
      const layoutConfig = JSON.parse(storage);
      if (layoutConfig.darkMode) {
        document.documentElement.classList.add("dark");
      }
    }
  } catch (e) {
    console.warn("Failed to set dark theme from localStorage:", e);
  }

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

const transitionMain = defineComponent({
  props: {
    route: {
      type: undefined,
      required: true,
    },
  },
  render() {
    // 确保在路由切换动画期间保持深色主题
    try {
      const storage = localStorage.getItem("layout");
      if (storage) {
        const layoutConfig = JSON.parse(storage);
        if (layoutConfig.darkMode) {
          document.documentElement.classList.add("dark");
        }
      }
    } catch (e) {
      console.warn("Failed to set dark theme from localStorage:", e);
    }

    const menuTransition = $storage.configure.menuTransition;
    const transitionName = menuTransition
      ? transitions.value(this.route)?.name || "fade-transform"
      : "";
    const enterTransition = menuTransition
      ? transitions.value(this.route)?.enterTransition
      : "";
    const leaveTransition = menuTransition
      ? transitions.value(this.route)?.leaveTransition
      : "";
    return h(
      Transition,
      {
        name: !menuTransition
          ? ""
          : enterTransition
            ? "pure-classes-transition"
            : transitionName,
        enterActiveClass: !menuTransition
          ? ""
          : enterTransition
            ? `animate__animated ${enterTransition}`
            : undefined,
        leaveActiveClass: !menuTransition
          ? ""
          : leaveTransition
            ? `animate__animated ${leaveTransition}`
            : undefined,
        mode: "out-in",
        appear: true,
      },
      {
        default: () => [this.$slots.default()],
      }
    );
  },
});

const router = useRouter();
</script>

<template>
  <section
    :class="[fixedHeader ? 'app-main' : 'app-main-nofixed-header']"
    :style="getSectionStyle"
  >
    <router-view :key="$route.fullPath">
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
                    margin: contentMargin + 'px',
                  }"
                >
                  <transitionMain :route="route">
                    <keep-alive
                      v-if="isKeepAlive"
                      :include="usePermissionStoreHook().cachePageList"
                    >
                      <component
                        :is="Comp"
                        :key="fullPath"
                        :frameInfo="frameInfo"
                        class="main-content"
                      />
                    </keep-alive>
                    <component
                      :is="Comp"
                      v-else
                      :key="fullPath"
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
                        :key="fullPath"
                        :frameInfo="frameInfo"
                        class="main-content"
                        :style="{ 'border-radius': layoutRadius + 'px' }"
                      />
                    </keep-alive>
                    <component
                      :is="Comp"
                      v-else
                      :key="fullPath"
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
                  margin: contentMargin + 'px',
                }"
              >
                <transitionMain :route="route">
                  <keep-alive
                    v-if="isKeepAlive"
                    :include="usePermissionStoreHook().cachePageList"
                  >
                    <component
                      :is="Comp"
                      :key="fullPath"
                      :frameInfo="frameInfo"
                      class="main-content"
                    />
                  </keep-alive>
                  <component
                    :is="Comp"
                    v-else
                    :key="fullPath"
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
                  'border-radius': layoutRadius + 'px  !important',
                }"
              >
                <transitionMain :route="route">
                  <keep-alive
                    v-if="isKeepAlive"
                    :include="usePermissionStoreHook().cachePageList"
                  >
                    <component
                      :is="Comp"
                      :key="fullPath"
                      :frameInfo="frameInfo"
                      class="main-content"
                      :style="{ 'border-radius': layoutRadius + 'px' }"
                    />
                  </keep-alive>
                  <component
                    :is="Comp"
                    v-else
                    :key="fullPath"
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
  height: 100vh;
  overflow-x: hidden;
  background: linear-gradient(
    135deg,
    rgba(245, 247, 250, 0.8),
    rgba(240, 242, 245, 0.9)
  );

  /* 默认深色背景，防止FOUC */
  html.dark & {
    background: linear-gradient(
      135deg,
      rgba(22, 24, 29, 0.8),
      rgba(26, 28, 35, 0.9)
    );
  }

  /* 确保在深色模式下有默认背景色 */
  background: var(--el-bg-color-page);
  html.dark & {
    background: var(--el-bg-color);
  }
}

.app-main-nofixed-header {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  background: linear-gradient(
    135deg,
    rgba(245, 247, 250, 0.8),
    rgba(240, 242, 245, 0.9)
  );
  backdrop-filter: blur(20px);

  /* 默认深色背景，防止FOUC */
  html.dark & {
    background: linear-gradient(
      135deg,
      rgba(22, 24, 29, 0.8),
      rgba(26, 28, 35, 0.9)
    );
  }

  /* 确保在深色模式下有默认背景色 */
  background-color: var(--el-bg-color-page);
  html.dark & {
    background: var(--el-bg-color);
  }
}

.main-content {
  height: 100%;
  position: relative;
  // padding: 0px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  /* 确保主内容区域也有正确的背景色 */
  background: var(--el-bg-color-page);
  html.dark & {
    background: var(--el-bg-color);
  }
}

:deep(.el-card__body) {
  height: calc(100% - 0px);
}

.bg-layout {
  --un-bg-opacity: 1;
  background-color: rgb(var(--layout-bg-color) / var(--un-bg-opacity));
  transition: background-color 0.3s;
  /* 确保背景覆盖整个区域 */
  height: 100%;
  width: 100%;

  /* 深色主题下的背景色 */
  html.dark & {
    background-color: rgb(var(--layout-bg-color) / var(--un-bg-opacity));
  }

  /* 确保在深色模式下有明确的背景色 */
  background-color: var(--el-bg-color-page);
  html.dark & {
    background: var(--el-bg-color);
  }
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

:deep(.fade-transform-enter-active),
:deep(.fade-transform-leave-active) {
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

:deep(.fade-transform-enter-from) {
  opacity: 0;
  transform: translateY(20px);
}

:deep(.fade-transform-leave-to) {
  opacity: 0;
  transform: translateY(-20px);
}
</style>
