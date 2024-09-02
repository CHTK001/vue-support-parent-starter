<script>
import { defineAsyncComponent, defineComponent } from "vue";
const ScDrag = defineAsyncComponent(() => import("@/components/ScDrag/index.vue"));
const ScDrag1 = defineAsyncComponent(() => import("@/components/ScDrag/index.vue"));
export default defineComponent({
  components: {
    ScDrag,
    ScDrag1
  }
});
</script>
<template>
  <div>
    <ScDrag :key="1">
      <div>11111111111111</div>
    </ScDrag>
    <ScDrag1 :key="2">
      <div>22222222222222</div>
    </ScDrag1>
  </div>
</template>
