<script setup>
import { reactive, onMounted } from "vue";
import layout from "./layout.vue";

const state = reactive({
  APConfig: {
    height: 930,
    backgroundFillAll: true,
    backgroundName: "A2",
    loading: false
  }
});
</script>
<template>
  <div id="root-techui">
    <adaptivePanel :show="false" :config="state.APConfig"><layout /></adaptivePanel>
  </div>
</template>
<style lang="scss"></style>
