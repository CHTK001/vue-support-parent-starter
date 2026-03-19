<script setup lang="ts">
import BaseThemeCard from "./BaseThemeCard.vue";
import { scCardProps } from "../cardProps";

defineProps(scCardProps);
defineEmits<{
  (e: "click", event: MouseEvent): void;
}>();
</script>

<template>
  <BaseThemeCard theme-key="spring-festival" v-bind="$props" @click="$emit('click', $event)">
    <template v-for="(_, name) in $slots" #[name]="slotData">
      <slot :name="name" v-bind="slotData || {}" />
    </template>
  </BaseThemeCard>
</template>
