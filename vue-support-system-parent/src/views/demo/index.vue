<script>
import Close from "@iconify-icons/ep/close";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import { defineComponent } from "vue";
import ScDrag from "@/components/ScDrag/index.vue";
export default defineComponent({
  components: { ScDrag },
  data() {
    return {};
  },
  methods: {}
});
</script>
<template>
  <div>
    <ScDrag>
      <div>11111111111111</div>
    </ScDrag>
  </div>
</template>
