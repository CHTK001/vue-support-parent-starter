<script setup lang="ts">
import { onUnmounted, ref } from "vue";
import businessman from "../assets/svg/businessman.svg?component";

defineOptions({
  name: "403",
});

const remainingTime = ref(5);
const timer = setInterval(() => {
  remainingTime.value--;
  if (remainingTime.value <= 0) {
    closePage();
  }
}, 1000);
const closePage = () => {
  if (
    navigator.userAgent.indexOf("Firefox") != -1 ||
    navigator.userAgent.indexOf("Chrome") != -1
  ) {
    window.location.href = "about:blank";
    window.close();
  } else {
    window.opener = null;
    window.open("", "_self");
    window.close();
  }
};

onUnmounted(() => {
  clearInterval(timer);
});
</script>

<template>
  <div class="flex justify-center items-center h-[640px]">
    <businessman />
    <div class="ml-12">
      <p
        v-motion
        class="font-medium text-4xl mb-4 dark:text-white"
        style="color: rgb(108 198 108 / 80%)"
        :initial="{
          opacity: 0,
          y: 100,
        }"
        :enter="{
          opacity: 1,
          y: 0,
          transition: {
            delay: 80,
          },
        }"
      >
        {{ $t("buttons.bindSuccess") }}
      </p>
      <p
        v-motion
        class="mb-4 text-gray-500"
        :initial="{
          opacity: 0,
          y: 100,
        }"
        :enter="{
          opacity: 1,
          y: 0,
          transition: {
            delay: 120,
          },
        }"
      >
        页面将在{{ remainingTime }}秒后关闭
      </p>
      <el-button
        v-motion
        type="primary"
        :initial="{
          opacity: 0,
          y: 100,
        }"
        :enter="{
          opacity: 1,
          y: 0,
          transition: {
            delay: 160,
          },
        }"
        @click="closePage"
      >
        手动关闭页面
      </el-button>
    </div>
  </div>
</template>
