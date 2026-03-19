<script setup lang="ts">
import BaseThemeButton from "./BaseThemeButton.vue";
import { scButtonProps } from "../buttonProps";

defineProps(scButtonProps);
defineEmits<{
  (e: "click", event: MouseEvent): void;
}>();
</script>

<template>
  <BaseThemeButton theme-key="christmas" v-bind="$props" @click="$emit('click', $event)">
    <template v-if="$slots.default" #default>
      <slot />
    </template>
    <template v-if="$slots.loading" #loading>
      <slot name="loading" />
    </template>
    <template v-if="$slots.icon" #icon>
      <slot name="icon" />
    </template>
  </BaseThemeButton>
</template>
