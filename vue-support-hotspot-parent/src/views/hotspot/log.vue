<template>
  <div class="relative" :style="{ width: width }">
    <div class="fixed" style="top: 100px; right: 16px; z-index: 1">
      <el-row>
        <el-radio-group v-model="form.message">
          <el-radio-button value="" label="">全部</el-radio-button>
          <el-radio-button value="ERROR" label="">ERROR</el-radio-button>
          <el-radio-button value="INFO" label="">INFO</el-radio-button>
          <el-radio-button value="DEBUG" label="">DEBUG</el-radio-button>
        </el-radio-group>
      </el-row>
      <el-row class="relative mt-1">
        <el-input v-model="form.message" placeholder="请输入请求ID" />
      </el-row>
      <el-row class="relative mt-1">
        <el-button v-if="config.lock == true" class="absolute right-0" type="primary" circle :icon="useRenderIcon('ep:lock')" @click="config.lock = false" />
        <el-button v-else class="absolute right-0" circle :icon="useRenderIcon('ep:unlock')" @click="config.lock = true" />
        <el-button class="absolute right-[40px]" circle type="danger" :icon="useRenderIcon('ep:delete-filled')" @click="dataList.length = 0" />
      </el-row>
    </div>
    <div class="pt-[30px] overflow-hidden">
      <ul id="containerRef" style="height: calc(80vh)" class="overflow-auto">
        <li v-for="(item, index) in getData(dataList)" :key="index" style="font-size: 14px; font-family: none">
          <span class="ml-1">
            <span v-html="ansiToHtml(item?.data?.message)" />
          </span>
        </li>
      </ul>

      <el-empty v-if="!dataList || dataList.length == 0" class="h-full" />
    </div>
  </div>
</template>
<script setup>
import { useConfigStore } from "@/store/modules/config";
import { nextTick, ref, onUnmounted, watch, computed, reactive, markRaw, onMounted } from "vue";
import { dateFormat } from "@/utils/date";
import { AnsiUp } from "ansi_up";

import { useRenderIcon } from "@/components/ReIcon/src/hooks";
const heartbeatInterval = 30 * 1000; // 心跳间隔为30秒
const heartbeatTimeout = 60 * 1000; // 心跳超时时间为60秒
let heartbeatIntervalId, heartbeatTimeoutId;

// 心跳检测启动函数
const startHeartbeat = () => {
  heartbeatIntervalId = setInterval(function () {
    socketClient.value.send("ping"); // 发送心跳包

    // 重置心跳超时定时器
    clearTimeout(heartbeatTimeoutId);
    heartbeatTimeoutId = setTimeout(function () {
      console.log("Heartbeat timeout, closing the connection.");
      socketClient.value?.close(); // 超时未收到响应，关闭连接
      openSocket("ws://127.0.0.1:" + window.websocketPort);
      // 这里可以添加重新连接的逻辑
    }, heartbeatTimeout);
  }, heartbeatInterval);
};

const handleOpen = () => {
  console.log("WebSocket connection established.");
  startHeartbeat();
};

const handleClose = () => {
  console.log("WebSocket connection closed.");
  clearInterval(heartbeatIntervalId);
  clearTimeout(heartbeatTimeoutId);
};
// 判断消息是否为pong消息
function isPongMessage(message) {
  return message === "pong";
}
const timeLayoutRef = ref(null);
const openLogTime = ref(false);
const openLog = async () => {
  openLogTime.value = true;
  await nextTick();
  timeLayoutRef.value.open();
};
// 引入Prism.js

const ansiUp = new AnsiUp();
const form = reactive({
  message: null
});
const socketClient = ref();
const eventName = ref("message");
const sqlPre = ref();
const useConfigStoreObject = useConfigStore();
const dataList = reactive([]);
const config = reactive({
  lock: false
});
const closeSocket = async () => {
  socketClient.value?.close();
  socketClient.value = null;
};
const ansiToHtml = ansiString => {
  return ansiUp.ansi_to_html(ansiString);
};
const openSocket = async urls => {
  closeSocket();
  socketClient.value = new WebSocket(urls);
  socketClient.value.onmessage = handleEvent;
  socketClient.value.onopen = handleOpen;
  socketClient.value.onclose = handleClose;
};
const getData = data => {
  return data.filter(item => {
    return filter(item);
  });
};
const filter = row => {
  if (!form.message) {
    return true;
  }

  if (!row?.data?.message) {
    return false;
  }
  return row.data.message?.indexOf(form.message) > -1;
};
const handleEvent = async row => {
  try {
    row.data.text().then(data => {
      if (isPongMessage(data)) {
        // 重置心跳超时定时器
        return;
      }
      var item;
      try {
        item = JSON.parse(data);
      } catch (error) {}

      if ("AGENT_LOG" !== item.event || !filter(item)) {
        return;
      }
      dataList.push(item);
      if (dataList.length > 10000) {
        dataList.shift();
      }
      if (config.lock == true) {
        document.querySelector("#containerRef").scrollTop = document.querySelector("#containerRef").scrollHeight;
      }
      // console.log(dataList);
    });
  } catch (error) {
    return;
  }
};

onMounted(async () => {
  openSocket("ws://127.0.0.1:" + window.websocketPort);
});
onUnmounted(() => {
  closeSocket();
});
</script>
<style scoped lang="scss">
.shadow {
  box-shadow: 2px 1px 5px 2px #999;
}
</style>
