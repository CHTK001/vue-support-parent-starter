<script>
import { useConfigStore } from "@repo/core";
import { Base64 } from "js-base64";
import { layout } from "./layout";
export default {
  components: { layout },
  data() {
    return {
      form: {},
      state: {
        APConfig: {
          height: 930,
          backgroundFillAll: true,
          backgroundName: "A2",
          loading: false
        }
      },
      socket: null
    };
  },
  mounted() {
    useConfigStore().load();
    this.socket = useConfigStore().socket;
    const route = this.$route;
    Object.assign(this.form, JSON.parse(Base64.decode(route.query.data)));
  }
};
</script>
<template>
  <div id="root-techui">
    <adaptivePanel :show="false" :config="state.APConfig"><layout :data="form" :socket="socket" /></adaptivePanel>
  </div>
</template>
