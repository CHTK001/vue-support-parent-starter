<template>
  <div class="h-[100vh] relative bg">
    <el-button class="fixed z-[999] right-4 top-4" :icon="useRenderIcon('fa:power-off')" type="danger" circle @click="handleOff" />
    <el-tabs v-model="config.activeTab" tab-position="left" class="demo-tabs h-full bg">
      <el-tab-pane name="System" label="系统信息">
        <component :is="SystemView" v-if="config.activeTab === 'System'" ref="viewRef" class="bg" :data="config.urlData" />
      </el-tab-pane>
      <el-tab-pane name="Config">Config</el-tab-pane>
      <el-tab-pane name="Role">Role</el-tab-pane>
      <el-tab-pane name="Task">Task</el-tab-pane>
    </el-tabs>
  </div>
</template>
<script setup>
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import LoadingComponent from "@repo/components/ScLoad/index.vue";
import { getConfig } from "@repo/config";
import { fetchSetting, socket, useConfigStore } from "@repo/core";
import * as Base64 from "js-base64";
import { Md5 } from "ts-md5";
import { defineAsyncComponent, onMounted, onUnmounted, reactive, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
const router = useRouter();

const configConfig = getConfig();
const useConfig = useConfigStore();
const route = useRoute();
const urlData = route.query.data;
const SystemView = defineAsyncComponent({
  loader: () => import("./system.vue"),
  loadingComponent: LoadingComponent
});

const viewRef = ref();
const config = reactive({
  events: [],
  activeTab: "System",
  urlData: JSON.parse(Base64.decode(urlData)),
  selectedServer: [],
  environment: {},
  socket: null
});

const suffix = config.urlData.host + config.urlData.port;
["LOG", "JVM", "SYS", "CPU", "MEM", "DISK"].forEach(it => {
  config.events.push(it);
});

const handleOff = async () => {
  handleCloseSocket();
  router.go(-1);
};
const handleInitialize = async () => {
  const setting = await fetchSetting("config");
  setting.data.forEach(it => {
    const key = it["sysSettingName"];
    config.environment[key] = it["sysSettingValue"];
  });
};
const handleCloseSocket = () => {
  if (!config.socket) {
    return;
  }
  config.events.forEach(it => {
    config.socket.off(Md5.hashStr(it + suffix));
  });
  config.socket.close();
};
const handleOpenSocket = async () => {
  if (config.environment["SocketOpen"] != "true") {
    return;
  }
  config.socket = socket(config.environment["SocketUrl"]?.split(","), config.environment["SocketPath"] || "/socket.io");
  config.events.forEach(it => {
    config.socket.on(Md5.hashStr(it + suffix), data => {
      const item = data?.data;
      if (item) {
        viewRef.value?.publish(it, JSON.parse(item));
      }
    });
  });
};

onMounted(async () => {
  await handleInitialize();
  handleOpenSocket();
});

onUnmounted(async () => {
  handleCloseSocket();
});
</script>

<style lang="scss" scoped>
.bg {
  background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='49' viewBox='0 0 28 49'%3E%3Cg fill-rule='evenodd'%3E%3Cg id='hexagons' fill='%231f3347' fill-opacity='0.3' fill-rule='nonzero'%3E%3Cpath d='M13.99 9.25l13 7.5v15l-13 7.5L1 31.75v-15l12.99-7.5zM3 17.9v12.7l10.99 6.34 11-6.35V17.9l-11-6.34L3 17.9zM0 15l12.98-7.5V0h-2v6.35L0 12.69v2.3zm0 18.5L12.98 41v8h-2v-6.85L0 35.81v-2.3zM15 0v7.5L27.99 15H28v-2.31h-.01L17 6.35V0h-2zm0 49v-8l12.99-7.5H28v2.31h-.01L17 42.15V49h-2z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E"),
    radial-gradient(ellipse at bottom, #1c1c1c 10%, #000000 50%, #1c1c1c 100%);
}
</style>
