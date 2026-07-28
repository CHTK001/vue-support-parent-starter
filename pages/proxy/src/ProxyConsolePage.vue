<template>
  <div class="proxy-console">
    <ScCard>
      <ScEmpty description="代理控制台" />
    </ScCard>
  </div>
</template>

<script setup lang="ts">
import ScCard from "@repo/components/ScCard";
import ScEmpty from "@repo/components/ScEmpty";
withDefaults(defineProps<{
  defaultApiRoot?: string;
  storageKey?: string;
}>(), {
  defaultApiRoot: "/proxy/",
  storageKey: "proxy.console.settings",
});
</script>
