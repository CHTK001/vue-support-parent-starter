<script setup lang="ts">
import { computed } from "vue";
import { isUrl } from "@pureadmin/utils";
import type { MenuType } from "@repo/core";

const props = defineProps<{
  to: MenuType | { path: string };
}>();

const isExternalLink = computed(() => {
  if ('path' in props.to) {
    return isUrl(props.to.path);
  }
  return isUrl(props.to.name);
});

const getLinkProps = (item: MenuType | { path: string }) => {
  if (isExternalLink.value) {
    const url = 'path' in item ? item.path : item.name;
    return {
      href: url,
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
