<script setup>
import { tArr } from "@techui/utils";
import { inject } from "vue";

const $global = inject("$global", null);
const $tMessage = $global?.$tMessage;
const $tNotify = $global?.$tNotify;
const $tToast = $global?.$tToast;
const $tFlash = $global?.$tFlash;

const types = ["primary", "success", "warning", "danger", "error", "info", "emphasis"];
const tones = ["extremeInvert", "strongInvert", "strong", "base", "weak"];

function messageDemo() {
  $tMessage?.({
    debug: false,
    backgroundBlur: true,
    transparent: true,
    showClose: true,
    duration: 4000,
    content: "消息提醒",
    type: tArr.rdmpk1(types),
  });
}

function notifyDemo() {
  $tNotify?.({
    debug: false,
    backgroundBlur: true,
    transparent: true,
    showClose: true,
    duration: 4000,
    content: "通知信息",
    type: tArr.rdmpk1(types),
  });
}

function toastDemo() {
  $tToast?.({
    debug: false,
    backgroundBlur: true,
    transparent: true,
    showClose: true,
    grouping: true,
    duration: 4000,
    content: "轻微提醒",
    type: tArr.rdmpk1(types),
  });
}

function flashDemo() {
  $tFlash?.({
    debug: false,
    backgroundBlur: true,
    transparent: true,
    showClose: true,
    content: "闪光提醒",
    queuePosition: "bottom",
    type: tArr.rdmpk1(types),
  });
}
</script>

<template>
  <div class="demo-attention-wrap">
    <h1>注意力组件测试</h1>
    <div class="button-wrap">
      <ScifiButtonDash @click="messageDemo">消息</ScifiButtonDash>
      <ScifiButtonDash @click="notifyDemo" appearance="B">通知</ScifiButtonDash>
      <ScifiButtonExo @click="toastDemo">轻提示</ScifiButtonExo>
      <ScifiButtonExo @click="flashDemo" type="warning" appearance="B">闪光</ScifiButtonExo>
    </div>
    <p class="note-text">
      更新提示：从0.0.6，更新到0.0.7，读取之前的缓存配置会导致报错，因Open加解密叠代导致，读取失败后会自动删除之前的配置文件，重新刷新即可正常。
    </p>
  </div>
</template>

<style lang="scss">
.demo-attention-wrap {
  position: absolute;
  inset: 0 100px;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 30px;
  align-items: center;
  justify-content: center;
  pointer-events: all;

  .button-wrap {
    display: flex;
    gap: 20px;
  }

  .note-text {
    color: var(--font-weak);
  }
}
</style>
