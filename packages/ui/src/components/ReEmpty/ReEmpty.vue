<template>
  <el-empty
    v-bind="$attrs"
    :image="image"
    :image-size="imageSize"
    :description="description"
  >
    <template v-if="$slots.default" #default>
      <slot />
    </template>
    <template v-if="$slots.image" #image>
      <slot name="image" />
    </template>
    <template v-if="$slots.description" #description>
      <slot name="description" />
    </template>
  </el-empty>
</template>

<script setup lang="ts">
defineOptions({ name: "ReEmpty" });

defineProps<{
  image?: string;
  imageSize?: number;
  description?: string;
}>();
</script>
