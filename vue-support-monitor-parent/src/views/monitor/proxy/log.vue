<template>
  <div>
    <el-dialog v-model="visible" :title="title" :width="700" destroy-on-close draggable @closed="$emit('closed')">
      <!-- <el-button type="danger" size="small" title="清除日志" icon="el-icon-delete" class="absolute" style="border: 0; right: 10px; top:50px " circle @click="data.length = 0"></el-button> -->
      <div style="max-height: 50vh; overflow-y: auto">
        <div ref="containerRef" :style="{ height: height + 'px', overflow: 'auto' }" @keyup="keyEvent">
          <ul>
            <li v-for="item in data" :key="item">
              <span v-html="'[' + form.proxyName + '] -> ' + item" />
            </li>
          </ul>
          <el-empty v-if="!data || data.length == 0" class="h-full" />
        </div>
      </div>
    </el-dialog>
  </div>
</template>
<script>
import { useConfigStore } from "@/store/modules/config";

export default {
  data() {
    return {
      eventName: null,
      socket: null,
      data: [],
      form: {},
      visible: false
    };
  },
  beforeUnmount() {
    this.closeSocket();
  },
  created() {
    this.socket = useConfigStore().socket;
  },
  methods: {
    open() {
      this.closeSocket();
      this.visible = true;
      return this;
    },
    setData(data) {
      Object.assign(this.form, data);
      this.title = data.proxyName;
      this.openSocket();
    },

    openSocket() {
      this.eventName = "PROXY_LOG:" + this.form.proxyId;
      const _this = this;
      this.socket?.on(this.eventName, msg => {
        _this.data.push(msg);
        if (_this.data.length > 10000) {
          _this.data.shift();
        }

        _this.$nextTick(() => {
          let scrollEl = _this.$refs.containerRef;
          scrollEl.scrollTo({ top: scrollEl.scrollHeight, behavior: "smooth" });
        });
      });
    },
    closeSocket() {
      this.socket?.off(this.eventName);
    }
  }
};
</script>
