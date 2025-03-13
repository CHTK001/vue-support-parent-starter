<template>
  <div class="bg-white p-[30px]">
    <el-form :inline="true">
      <el-form-item label="大写字母">
        <el-switch v-model="setting.upperCase" />
      </el-form-item>

      <el-form-item label="小写字母">
        <el-switch v-model="setting.lowerCase" />
      </el-form-item>

      <el-form-item label="数字">
        <el-switch v-model="setting.numberCase" />
      </el-form-item>

      <el-form-item label="特殊符号">
        <el-switch v-model="setting.symbolCase" />
      </el-form-item>
    </el-form>

    <el-form :inline="true">
      <el-form-item label="长度">
        <el-slider v-model="setting.lengthCase" class="!min-w-[500px]" :min="1" :max="1024" show-tooltip />
      </el-form-item>
    </el-form>
    <el-form :inline="true">
      <el-form-item>
        <el-button v-copy:click="data.token" size="small" :icon="useRenderIcon('ep:copy-document')" />
        <el-button type="primary" size="small" :icon="useRenderIcon('ep:refresh')" @click="generateToken()" />
      </el-form-item>
    </el-form>

    <el-input v-model="data.token" type="textarea" :rows="20" />
  </div>
</template>
<script setup>
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import { reactive, watch } from "vue";

const setting = reactive({
  upperCase: true,
  lengthCase: 16
});
const data = reactive({
  upperCase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  lowerCase: "abcdefghijklmnopqrstuvwxyz",
  numberCase: "0123456789",
  symbolCase: "~!@#$%^&*()_+-=[]{}|;:,.<>/?",
  token: null
});

watch(
  setting,
  () => {
    generateToken();
  },
  { deep: true, immediate: true }
);
// 生成随机token
function generateToken() {
  let token = "";
  let possibleChars = "";
  if (setting.upperCase) {
    possibleChars += data.upperCase;
  }

  if (setting.lowerCase) {
    possibleChars += data.lowerCase;
  }

  if (setting.numberCase) {
    possibleChars += data.numberCase;
  }

  if (setting.symbolCase) {
    possibleChars += data.symbolCase;
  }

  for (let i = 0; i < setting.lengthCase; i++) {
    token += possibleChars.charAt(Math.floor(Math.random() * possibleChars.length));
  }

  return (data.token = token);
}
</script>
