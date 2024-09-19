<script>
import { reactive, onMounted } from "vue";
import layout from "./layout.vue";
import { Base64 } from "js-base64";
import { useConfigStore } from "@/store/modules/config";
export default {
  components: {
    layout
  },
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
    const route = this.$route;
    useConfigStore().load();
    this.socket = useConfigStore().socket;
    Object.assign(this.form, JSON.parse(Base64.decode(route.query.data)));
  }
};
</script>
<template>
  <div id="root-techui">
    <adaptivePanel :show="false" :config="state.APConfig"><layout :data="form" :socket="socket" /></adaptivePanel>
  </div>
</template>
