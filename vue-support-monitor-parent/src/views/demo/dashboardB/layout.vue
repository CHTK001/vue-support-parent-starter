<script setup>
import counterGrid from "./portlet/counter-grid.vue";
import { reactive, onMounted, computed, toRefs } from "vue";

const comps = {
  counterGrid
};
const state = reactive({
  systemTitleConfig: {
    width: 500
  },
  panelTitleConfig: {
    width: 160
  },
  dialogConfig: {
    show: false,
    width: "60%",
    height: "60%",
    title: "对话框标题",
    titleWidth: 350
  },
  // panelTitleConfig:{
  //   width:180,
  //   theme:true
  // },

  areas: [
    {
      name: "left",
      portlets: []
    },
    {
      name: "center",
      portlets: [{ id: "c1", title: "销售情况", component: "counterGrid", border: "blank", hideTitle: true }]
    },
    {
      name: "right",
      portlets: []
    }
  ]
});

const { systemTitleConfig, panelTitleConfig, dialogConfig, areas } = toRefs(state);

const chartCounter = computed(() => {
  return this.$vuex.state.adaptiveConfig.chartCounter;
});
const getConfig = item => {
  const { id } = item;
  if (id == "c2") {
    return {
      title: item.title,
      opacity: 0.5,
      decoration: false
    };
  } else if (id == "c3") {
    return {
      title: item.title,
      opacity: 0.5,
      rotate: "y",
      decoration: false
    };
  } else if (id.includes("l")) {
    return {
      title: item.title,
      titleWidth: 120,
      decoration: false,
      decorationAlt: true,
      rotate: "y",
      opacity: 0.5
    };
  } else {
    return {
      title: item.title,
      titleWidth: 120,
      decoration: false,
      opacity: 0.5
    };
  }
};

onMounted(() => {});
</script>
<template>
  <div class="screen1080B">
    <div v-for="area in areas" :key="area.id" :class="`area-box area-${area.name}`">
      <div v-for="item in area.portlets" :key="item.id" class="portlet-wrapper">
        <component :is="item.border" v-if="item.border" :config="getConfig(item)">
          <panelTitleA1 v-if="!item.hideTitle" :config="panelTitleConfig">{{ item.title }}</panelTitleA1>
          <component :is="comps[item.component]" />
        </component>
        <template v-else>
          <component :is="item.component" />
          <i>{{ item.component }}</i>
        </template>
      </div>
    </div>
    <systemTitleA1 :config="systemTitleConfig">TechUI数据可视化成型工具</systemTitleA1>
  </div>
</template>
<style lang="scss">
.screen1080B {
  z-index: 1;
  padding: 60px 30px 30px 30px;
  height: 100%; //url(../common/images/bg.png)
  .techButtonA2 {
    z-index: 10;
    bottom: 20px;
    left: 50%;
  }
  display: grid;
  grid-template-columns: repeat(24, 1fr);
  grid-template-rows: repeat(24, 1fr);
  grid-gap: 30px;
  .area-box {
    pointer-events: visible;
    position: relative;
    z-index: 10;
    &.area-left {
      grid-area: 1 / 1 / 25 / 7;
    }
    &.area-right {
      grid-area: 1 / 19 / 25 / 25;
    }
    &.area-center {
      grid-area: 1 / 7 / 25 / 19;
    }
    &.area-left,
    &.area-right,
    &.area-center {
      display: grid;
      grid-template-columns: repeat(1, 1fr);
      grid-template-rows: repeat(24, 1fr);
      grid-gap: 20px;
      .portlet-wrapper {
        &:nth-child(1) {
          grid-area: 1 / 1 / 8 / 3;
        }
        &:nth-child(2) {
          grid-area: 8 / 1 / 15 / 3;
        }
        &:nth-child(3) {
          grid-area: 15 / 1 / 25 / 3;
        }
      }
    }
    &.area-center {
      grid-template-columns: repeat(2, 1fr);
      .portlet-wrapper {
        &:nth-child(1) {
          grid-area: 1 / 1 / 8 / 3;
        }
        &:nth-child(2) {
          grid-area: 8 / 1 / 15 / 2;
        }
        &:nth-child(3) {
          grid-area: 8/ 2 / 15 / 3;
        }
        &:nth-child(4) {
          grid-area: 15 / 1 / 25 / 3;
        }
      }
    }
  }
  .content-tabs {
    top: -40px;
    left: 80px;
    right: 80px;
    text-align: center;
    height: 40px;
    &:before {
      content: " ";
      left: 0;
      right: 0;
      bottom: 10px;
      z-index: 1;
    }
    .tabs-item {
      display: inline-block;
      padding: 0 10px;
      height: 30px;
      line-height: 30px;
      cursor: pointer;
      z-index: 2;
      &:before {
        content: " ";
        opacity: 0;
      }
      &:hover {
        &:before {
          opacity: 0.3;
        }
      }
    }
  }
}
</style>
