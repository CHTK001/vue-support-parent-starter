<template>
  <img
    v-if="isUrl && !errored"
    :src="icon"
    alt="logo"
    class="software-icon-img"
    v-bind="$attrs"
    @error="onImgError"
  />
  <IconifyIconOffline v-else :icon="displayIcon" v-bind="$attrs" />
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { IconifyIconOffline } from "@repo/components/ReIcon";

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    icon?: string;
    fallback?: string;
  }>(),
  { fallback: "ep:box" },
);

const errored = ref(false);

const isUrl = computed(() => {
  if (!props.icon) return false;
  return /^(https?:)?\/\//.test(props.icon);
});

const displayIcon = computed(() => {
  if (errored.value || !props.icon) return props.fallback;
  return props.icon;
});

const onImgError = () => {
  errored.value = true;
};

watch(
  () => props.icon,
  () => {
    errored.value = false;
  },
);
</script>

<style scoped>
.software-icon-img {
  width: 1em;
  height: 1em;
  display: inline-block;
  vertical-align: middle;
  object-fit: contain;
  outline: none;
  background: var(--el-fill-color-light);
  border-radius: 4px;
  padding: 2px;
}
</style>
