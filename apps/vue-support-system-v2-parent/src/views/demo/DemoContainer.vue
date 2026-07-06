<script setup>
import { tTimer } from "@techui/utils";
import { onBeforeMount, onMounted, provide, reactive, watch } from "vue";
import { useRoute } from "vue-router";

const route = useRoute();

const state = reactive({
  adaptiveType: "flexible",
  adaptiveConfig: {
    userSelect: true,
    shadow: true,
    monitorRatio: true,
    showPenetration: true,
  },
  loading: true,
  routerNavConfig: {
    options: [
      { label: "布局A", path: "/bigscreen/index/layoutA" },
      { label: "布局B", path: "/bigscreen/index/layoutB" },
    ],
    triggerPosition: "center",
    triggerStyle: "react",
    triggerAni: true,
    buttonWidth: 200,
    modal: true,
  },
});

provide("adaptiveParams", {
  config: state.adaptiveConfig,
  type: state.adaptiveType,
});

const hideLoading = () => {
  tTimer.s("hideLoading", () => {
    state.adaptiveConfig.loading = false;
    state.loading = false;
  }, 2000);
};

watch(
  () => route.path,
  () => {
    state.loading = true;
    hideLoading();
  }
);

onMounted(() => {
  hideLoading();
});

onBeforeMount(() => {
  tTimer.c("hideLoading");
});
</script>

<template>
  <TuiProvider>
    <TuiAdaptive
      v-model:adaptiveType="state.adaptiveType"
      v-model:loading="state.loading"
      v-bind="state.adaptiveConfig"
      class="demo-layout-wrap"
    >
      <TuiThemeToggle class="demo-theme-toggle" />
      <TuiToggleControlPanel class="demo-ctrl-toggle" appearance="iconButton" />
      <router-view />
      <TuiRouterNav v-bind="state.routerNavConfig" />
    </TuiAdaptive>
  </TuiProvider>
</template>

<style lang="scss">
.demo-layout-wrap {
  position: relative;
  width: 100%;
  height: 100%;

  .demo-theme-toggle {
    position: absolute;
    right: 58px;
    top: 9px;
    z-index: 10;
  }

  .demo-ctrl-toggle {
    position: absolute;
    right: 18px;
    top: 9px;
    z-index: 10;
  }
}
</style>
