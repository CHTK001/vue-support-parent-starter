<template>
  <div class="bg-white p-[30px]">
    <el-form :inline="true">
      <el-form-item label="大写字母">
        <el-switch v-model="setting.upperCase" />
      </el-form-item>

      <el-form-item label="小写字母">
        <el-switch v-model="setting.lowerCase" />
      </el-form-item>
    </el-form>
    <el-form :inline="true">
      <el-form-item>
        <el-button v-if="data.token.length > 0" v-copy:click="data.token.join('\n')" size="small" :icon="useRenderIcon('ep:copy-document')" />
        <el-button type="primary" size="small" :icon="useRenderIcon('ep:refresh')" @click="generateTokenList()" />
      </el-form-item>
    </el-form>
    <el-form :inline="true">
      <el-form-item label="数量">
        <el-slider v-model="setting.lengthCase" class="!min-w-[500px]" :min="1" :max="100" show-tooltip />
      </el-form-item>
    </el-form>
    <div>
      <ul v-if="data.token.length > 0" class="overflow-auto h-[500px] w-[600px]">
        <li v-for="(item, index) in data.token" :key="index">{{ item }}</li>
      </ul>
      <el-empty v-else />
    </div>
  </div>
</template>
<script setup>
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import { reactive, watch } from "vue";

const setting = reactive({
  upperCase: true,
  lengthCase: 1
});
const data = reactive({
  token: []
});

const generateTokenList = () => {
  const t = [];
  for (let i = 0; i < setting.lengthCase; i++) {
    t.push(generateToken());
  }
  data.token = t;
};
// 生成随机token
function generateToken() {
  var s = [];
  var hexDigits = "0123456789abcdef";
  for (var i = 0; i < 36; i++) {
    s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
  }
  s[14] = "4"; // bits 12-15 of the time_hi_and_version field to 0010
  s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1); // bits 6-7 of the clock_seq_hi_and_reserved to 01
  s[8] = s[13] = s[18] = s[23] = "-";

  var uuid = s.join("");
  return setting.upperCase ? uuid.toUpperCase() : uuid.toLocaleLowerCase();
}

watch(
  setting,
  () => {
    generateTokenList();
  },
  { deep: true, immediate: true }
);
</script>
