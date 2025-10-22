<template>
  <div>
    <VueCompareImage
      :left-image="props.leftImage"
      :leftImageCss="props.leftImageCss"
      :leftImageLabel="props.leftImageLabel"
      :rightImageCss="props.rightImageCss"
      :rightImageLabel="props.rightImageLabel"
      :right-image="props.rightImage"
    ></VueCompareImage>
  </div>
</template>
<script setup>
import { VueCompareImage } from "vue3-compare-image";
import { defineProps } from "vue";

const props = defineProps({
  leftImage: { type: String },
  leftImageLabel: { type: String, default: "源图片" },
  leftImageCss: {
    type: String,
    default: {
      "background-color": "#f0f0f0",
      border: "2px solid #ff0000",
      "border-radius": "8px",
      "box-shadow": "0 4px 8px rgba(0, 0, 0, 0.1)"
    }
  },
  rightImage: { type: String },
  rightImageLabel: { type: String, default: "修复图片" },
  rightImageCss: { type: String, default: {} }
});
</script>
<style scoped>
:deep(.vci--left-label) {
  top: 5% !important;
  border-radius: 10px;
}
:deep(.vci--right-label) {
  top: 5% !important;
  border-radius: 10px;
}
</style>
