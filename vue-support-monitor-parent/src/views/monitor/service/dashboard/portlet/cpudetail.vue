<template>
  <div class="datav">
    <scDrag ref="dragRef" v-model="visible" @close="onClose">
      <aYinTechBorderB2 v-if="datav" class="h-full min-h-[600px]">1</aYinTechBorderB2>
      <div v-else class="h-full">2</div>
    </scDrag>
  </div>
</template>
<script>
import scDrag from "@/components/ScDrag/index.vue";
export default {
  components: { scDrag },
  props: {
    form: Object,
    datav: {
      type: Boolean,
      default: true
    }
  },
  data() {
    return {
      visible: false,
      confirmLoading: false
    };
  },
  methods: {
    onClose() {
      this.visible = false;
      this.confirmLoading = false;
      this.$emit("close");
    },
    open() {
      this.visible = true;
    }
  }
};
</script>
<style lang="scss" scoped>
.datav {
  position: relative;
  top: 10px;
}
</style>
