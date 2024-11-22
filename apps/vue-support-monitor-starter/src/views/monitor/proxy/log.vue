<template>
  <div>
    <el-dialog v-model="visible" :title="title" width="50%" :close-on-click-modal="false" @close="close">
      <el-empty v-if="dataList.length == 0" />
      <ul v-else>
        <li v-for="row in dataList" :key="row">
          {{ row }}
        </li>
      </ul>
    </el-dialog>
  </div>
</template>
<script>
import { useConfigStore } from "@repo/core";
export default {
  data() {
    return {
      form: {},
      dataList: [],
      socket: null,
      visible: false,
      eventName: ""
    };
  },
  methods: {
    setData(form) {
      this.eventName = "PROXY_LOG_" + form.proxyId;
      this.title = form.proxyName + "日志";
      Object.assign(this.form, form);
      return this;
    },
    close() {
      this.form = {};
      this.socket?.off(this.eventName);
      this.visible = false;
    },
    open() {
      this.visible = true;
      this.socket?.off(this.eventName);
      this.socket = useConfigStore()?.socket;
      this.socket?.on(this.eventName, this.event);
      return this;
    },
    event(data) {
      if (this.dataList.length > 10000) {
        this.dataList.pop();
      }
      this.dataList.unshift(data?.data || "");
    }
  }
};
</script>
