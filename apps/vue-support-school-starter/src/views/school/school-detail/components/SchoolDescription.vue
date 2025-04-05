<template>
  <el-card class="school-desc-card">
    <template #header>
      <div class="school-card-header">
        <span>{{ title }}</span>
      </div>
    </template>
    <div class="school-desc-content" v-if="content">
      <p>{{ content }}</p>
    </div>
    <el-empty v-else :description="emptyText" />
  </el-card>
</template>

<script lang="ts" setup>
import { defineProps } from "vue";

// 接收属性
defineProps<{
  title: string;
  content?: string;
  emptyText?: string;
}>();
</script>

<style scoped>
.school-desc-card {
  margin-bottom: 16px;
}

.school-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.school-desc-content {
  padding: 10px 0;
  line-height: 1.8;
}
</style>
