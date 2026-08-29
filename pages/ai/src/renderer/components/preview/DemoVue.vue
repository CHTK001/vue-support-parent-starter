<template>
  <div class="demo-vue">
    <h2>Vue 组件加载成功</h2>
    <p>这是运行在 React 页面中的 Vue 组件。</p>
    <el-button type="primary" @click="count++">
      点击计数：{{ count }}
    </el-button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const count = ref(0);
</script>

<style scoped>
.demo-vue {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px;
  border: 1px dashed #c0c4cc;
  border-radius: 8px;
}
.demo-vue h2 {
  margin: 0;
  font-size: 16px;
}
.demo-vue p {
  margin: 0;
  font-size: 12px;
  color: #909399;
}
</style>