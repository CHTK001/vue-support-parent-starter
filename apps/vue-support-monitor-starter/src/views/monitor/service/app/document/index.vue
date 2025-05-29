<template>
  <div class="service-detail">
    //详情
  </div>
</template>

<script setup lang="ts">
import { message } from '@repo/utils';
import { onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { fetchAppDetail } from '@/api/monitor/app';

// 路由
const route = useRoute();
const router = useRouter();

// 组件挂载
onMounted(() => {
  // 从路由参数获取 groupId
  const { id } = route.params;
  if (!id) {
    message("未找到有效的维护组ID", { type: "error" });
    router.push("/service-list");
  }
});
</script>

<style scoped lang="scss">

</style>
