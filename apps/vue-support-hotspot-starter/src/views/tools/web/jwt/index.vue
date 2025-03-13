<script setup lang="ts">
import * as jose from "jose";
import { ref, watch } from "vue";

const jwtValue = ref("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c");
watch(jwtValue, (oldValue, newValue) => {
  handleJwt();
});

const payload = ref();
const header = ref();
const handleJwt = () => {
  try {
    header.value = Object.entries(jose.decodeProtectedHeader(jwtValue.value));
    payload.value = Object.entries(jose.decodeJwt(jwtValue.value));
  } catch (e) {
    payload.value = [];
    header.value = [];
  }
};

handleJwt();
</script>

<template>
  <div class="bg-white p-[30px]">
    <el-row :gutter="10">
      <el-col :span="12">
        <el-input v-model="jwtValue" type="textarea" :rows="30" />
      </el-col>
      <el-col :span="12">
        <el-descriptions border title="header" :column="1">
          <el-descriptions-item v-for="key in header" :key="key" :label="key[0]">
            {{ key[1] }}
          </el-descriptions-item>
        </el-descriptions>
        <el-descriptions border title="payload" :column="1">
          <el-descriptions-item v-for="key in payload" :key="key" :label="key[0]">
            {{ key[1] }}
          </el-descriptions-item>
        </el-descriptions>
      </el-col>
    </el-row>
  </div>
</template>

<style scoped lang="scss"></style>
