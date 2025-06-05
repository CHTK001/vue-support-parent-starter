<template>
  <div class="h-full">
    <router-view class="h-full" :key="$route.fullPath" >
      <template #default="{ Component, route }">
        <component :is="Component" class="h-full"></component>
      </template>
    </router-view>
  </div>
</template>
<script setup>
import { computed, defineComponent } from "vue";

const props = defineProps({
  data: {
    type: Object,
    default: () => {},
  },
});
</script>
