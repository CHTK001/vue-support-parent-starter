<template>
  <el-container class="email-container">
    <el-main>
      <h2>已发送</h2>
      <el-table :data="sentEmails" style="width: 100%">
        <el-table-column prop="to" label="收件人" width="200" />
        <el-table-column prop="subject" label="主题" />
        <el-table-column prop="date" label="日期" width="180" />
      </el-table>
    </el-main>
  </el-container>
</template>

<script setup lang="ts">
import { ref } from "vue";

const sentEmails = ref([]);
</script>

<style scoped>
.email-container {
  height: 100vh;
}
</style>
