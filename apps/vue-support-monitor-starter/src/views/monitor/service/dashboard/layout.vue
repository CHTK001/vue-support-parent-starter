<script setup>
import { computed, defineProps, onMounted, onUnmounted, reactive, toRefs, onBeforeMount, getCurrentInstance, toRef, ref } from "vue";
import base from "./portlet/base.vue";
import disk from "./portlet/disk.vue";
import cpu from "./portlet/cpu.vue";
import mem from "./portlet/mem.vue";
import network from "./portlet/network.vue";
import usb from "./portlet/usb.vue";
import server from "./portlet/serverG6.vue";
import url from "./portlet/url.vue";
import trace from "./portlet/trace.vue";

import { Md5 } from "ts-md5";
const comps = {
  base,
  disk,
  cpu,
  mem,
  network,
  server,
  url,
  trace,
  usb
};
const props = defineProps({
  data: Object,
  socket: Object
});
const condition = reactive({
  fromTimestamp: new Date().getTime() - 86400000 * 7,
  toTimestamp: new Date().getTime(),
  count: 10,
  interval: 60
});
const form = props.data;
const socket = props.socket;
const suffix = form.host + form.port;

const eventNames = reactive([
  "URL:" + suffix,
  "SERVER:" + suffix,
  "USB:" + suffix,
  "NETWORK:" + suffix,
  "LOG:" + suffix,
  "JVM:" + suffix,
  "SYS:" + suffix,
  "CPU:" + suffix,
  "MEM:" + suffix,
  "DISK:" + suffix,
  "NETWORK:" + suffix
]);
const dyRef = reactive({});
eventNames.forEach(it => {
  dyRef[it] = {
    ref: ref(null),
    name: it
  };
});
onUnmounted(async () => {
  eventNames.forEach(it => {
    socket?.off(Md5.hashStr(it));
  });
});

const newProxy = ref();
onMounted(() => {
  const { proxy } = getCurrentInstance();
  newProxy.value = proxy;
});
onBeforeMount(() => {
  eventNames.forEach(it => {
    socket?.on(Md5.hashStr(it), data => {
      event(it, data);
    });
  });
});
const mappingConfig = reactive({});
mappingConfig["URL:" + suffix] = ["URL1:" + suffix];
const event = async (it, data) => {
  const _newProxy = newProxy;
  const newData = JSON.parse(data?.data) || null;
  const _refs = _newProxy.value.$refs[it];
  if (_refs) {
    _refs.forEach(item => {
      item?.update(newData, it);
    });
  }
  const newData1 = {};
  Object.assign(newData1, newData);
  eventExtContent(it, newData1);
};

const eventExtContent = async (it, data) => {
  const newIt = mappingConfig[it];
  if (!newIt) {
    return;
  }
  const _newProxy = newProxy;
  newIt.forEach(it1 => {
    const _refs = _newProxy.value.$refs[it1];
    if (_refs) {
      _refs.forEach(item => {
        item?.update(data, it);
      });
    }
  });
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
  }
});

const emitConfig = reactive({});

const success = (id, type, data) => {
  const config = (emitConfig[id] = {});
  config[type] = data;
};
const left = reactive([
  { id: "DISK:" + suffix, title: "磁盘信息", component: "disk", border: "aYinTechBorderA1", hideTitle: true, history: true },
  { id: "CPU:" + suffix, title: "CPU信息", component: "cpu", border: "aYinTechBorderA1", hideTitle: true, history: true },
  { id: "NETWORK:" + suffix, title: "网络信息", component: "network", border: "aYinTechBorderA1", hideTitle: true, history: true }
]);
const center = reactive([
  { id: "JVM:" + suffix, title: "基本情况", component: "base", border: "blank", hideTitle: true, history: true },
  { id: "URL:" + suffix, title: "访问情况", component: "url", border: "blank", hideTitle: true, history: true },
  { id: "MEM:" + suffix, title: "内存信息", component: "mem", border: "aYinTechBorderA1", hideTitle: true, history: true }
]);
const right = reactive([
  { id: "SERVER:" + suffix, type: "r", title: "访问信息", component: "server", border: "aYinTechBorderA1", hideTitle: true, history: true },
  { id: "USB:" + suffix, type: "r", title: "设备信息", component: "usb", border: "aYinTechBorderA1", hideTitle: true, history: true },
  { id: "URL1:" + suffix, type: "r", title: "请求情况", component: "trace", border: "blank", hideTitle: true, history: true }
]);

const { systemTitleConfig, panelTitleConfig, dialogConfig, areas } = toRefs(state);

const chartCounter = computed(() => {
  return this.$vuex.state.adaptiveConfig.chartCounter;
});
const getConfig = item => {
  const { type } = item;
  if (type == "c2") {
    return {
      title: item.title,
      opacity: 0.5,
      decoration: false
    };
  } else if (type == "c3") {
    return {
      title: item.title,
      opacity: 0.5,
      rotate: "y",
      decoration: false
    };
  } else if (type == "r") {
    return {
      title: item.title,
      titleWidth: 120,
      decoration: false,
      decorationAlt: true,
      opacity: 0.5
    };
  } else {
    return {
      title: item.title,
      titleWidth: 120,
      decoration: false,
      opacity: 0.5,
      rotate: "y"
    };
  }
};
const getType = index => {
  if (index == 0) {
    return "!h-[200px]";
  }
  if (index == 1) {
    return "!h-[260px]";
  }
  return "!h-[270px]";
};
</script>
<template>
  <div class="screen1080B h-full">
    <el-row :gutter="40" class="h-full">
      <el-col class="area-box area-left relative top-[50px]" :md="6">
        <div v-for="(item, index) in left" :key="item.id" class="portlet-wrapper w-full h-[280px] pb-4" :md="item" :xs="24">
          <component :is="item.border" v-if="item.border" :config="getConfig(item)" :class="index == 3 ? '!h-[350px]' : ''">
            <panelTitleA1 v-if="!item.hideTitle" :config="panelTitleConfig">{{ item.title }}</panelTitleA1>
            <component :is="comps[item.component]" :ref="item.id" :condition="condition" :history="item.history" :form="form" @success="success" />
          </component>
          <template v-else>
            <component :is="item.component" :ref="item.id" :condition="condition" :history="item.history" :form="form" @success="success" />
            <i>{{ item.component }}</i>
          </template>
        </div>
      </el-col>
      <el-col class="area-box area-center relative top-[100px]" :md="12">
        <div v-for="(item, index) in center" :key="item.id" :class="'portlet-wrapper w-full  pb-6 ' + item.class" :md="item" :xs="24">
          <component :is="item.border" v-if="item.border" :config="getConfig(item)" :class="getType(index)">
            <panelTitleA1 v-if="!item.hideTitle" :config="panelTitleConfig">
              {{ item.title }}
            </panelTitleA1>
            <component :is="comps[item.component]" :ref="item.id" :condition="condition" :history="item.history" :form="form" @success="success" />
          </component>
          <template v-else>
            <component :is="item.component" :ref="item.id" :condition="condition" :history="item.history" :form="form" @success="success" />
            <i>{{ item.component }}</i>
          </template>
        </div>
      </el-col>
      <el-col class="area-box area-right relative top-[50px]" :md="6">
        <div v-for="item in right" :key="item.id" :class="'portlet-wrapper w-full  pb-4 h-[280px] '" :md="item" :xs="24">
          <component :is="item.border" v-if="item.border" :config="getConfig(item)">
            <panelTitleA1 v-if="!item.hideTitle" :config="panelTitleConfig">
              {{ item.title }}
            </panelTitleA1>
            <component :is="comps[item.component]" :ref="item.id" :condition="condition" :history="item.history" :form="form" @success="success" />
          </component>
          <template v-else>
            <component :is="item.component" :ref="item.id" :condition="condition" :history="item.history" :form="form" @success="success" />
            <i>{{ item.component }}</i>
          </template>
        </div>
      </el-col>
    </el-row>
    <systemTitleA1 :config="systemTitleConfig">{{ form?.metadata?.applicationName }}可视化</systemTitleA1>
  </div>
</template>
<style lang="scss" scoped></style>
