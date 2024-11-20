<script setup lang="ts">
import { computed } from "vue";
import { isUrl } from "@pureadmin/utils";
import type { MenuType } from "@repo/core";

const props = defineProps<{
  to: MenuType;
}>();

const isExternalLink = computed(() => isUrl(props.to.name));
const getLinkProps = (item: MenuType) => {
  if (isExternalLink.value) {
    return {
      href: item.name,
      target: "_blank",
      rel: "noopener"
    };
  }
  return {
    to: item
  };
};
</script>

<template>
  <component :is="isExternalLink ? 'a' : 'router-link'" v-bind="getLinkProps(to)">
    <slot />
  </component>
</template>
