<template>
  <div>
    <ScCard :url="fetchPageSfc" />
  </div>
</template>
<script setup>
import ScCard from "@/components/ScCard/index.vue";
import { fetchPageSfc } from "@/api/manage/sfc";
</script>
