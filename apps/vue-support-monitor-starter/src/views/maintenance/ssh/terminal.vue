<template>
  <terminal2 :url="socketUrl" />
</template>
<script>
import { mapState } from "pinia";

import { getWebSocketUrl } from "@/api/config";
import terminal2 from "@/components/terminal/index.vue";

// https://blog.csdn.net/qq_41840688/article/details/108636267

export default {
  components: {
    terminal2
  },
  props: {
    sshId: {
      type: String,
      default: ""
    },
    machineSshId: {
      type: String,
      default: ""
    }
  },
  data() {
    return {};
  },
  computed: {
    socketUrl() {
      return getWebSocketUrl("/socket/ssh", `id=${this.sshId}&machineSshId=${this.machineSshId}&nodeId=system&type=ssh`);
    }
  },
  mounted() {},
  beforeUnmount() {},
  methods: {}
};
</script>
