<script setup lang="ts">
/**
 * DialogDemo —— ReDialog 三种布局 + headless + 响应式 + 边缘缩放演示
 */
import { ref } from "vue";
import { ReDialog, ReButton, ReInput, ReInputNumber } from "@repo/ui";

const elVisible = ref(false);
const modernVisible = ref(false);
const windowsVisible = ref(false);
const headlessVisible = ref(false);

const token = ref("");
const temperature = ref(0.7);
</script>

<template>
  <div class="dialog-demo">
    <h2>ReDialog 演示</h2>

    <section>
      <h3>1. 默认 el-dialog 布局（响应式 + headless）</h3>
      <ReButton @click="elVisible = true">打开 el 弹窗</ReButton>
      <ReDialog
        v-model="elVisible"
        title="账号登录"
        :width="'420px'"
        responsive
        @ok="elVisible = false"
      >
        <ReInput v-model="token" placeholder="API Key" />
      </ReDialog>
    </section>

    <section>
      <h3>2. Modern 布局（headless + 响应式）</h3>
      <ReButton @click="headlessVisible = true">打开 headless 弹窗</ReButton>
      <ReDialog
        v-model="headlessVisible"
        layout="modern"
        headless
        :show-footer="false"
        :width="'480px'"
        responsive
      >
        <div class="login-card">
          <h2>欢迎回来</h2>
          <ReInput v-model="token" placeholder="邮箱 / 手机号" />
          <ReInput type="password" placeholder="密码" />
          <ReButton type="primary" @click="headlessVisible = false">登录</ReButton>
        </div>
      </ReDialog>
    </section>

    <section>
      <h3>3. Windows 布局（8 方向缩放 + Aero Snap）</h3>
      <ReButton @click="windowsVisible = true">打开 Windows 弹窗</ReButton>
      <ReDialog
        v-model="windowsVisible"
        id="demo-windows"
        layout="windows"
        title="AI 助手"
        fullscreenable
        :default-width="720"
        :default-height="540"
        :min-width="400"
      >
        <ReInputNumber v-model="temperature" :min="0" :max="2" :step="0.1" suffix="" />
        <p>试试拖标题栏到屏幕边缘，或鼠标停在窗口四边 / 四角缩放。</p>
      </ReDialog>
    </section>
  </div>
</template>

<style scoped>
.dialog-demo {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}
.dialog-demo section {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  background: var(--el-fill-color-lighter);
  border-radius: 8px;
}
.login-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 8px 0;
}
.login-card h2 {
  margin: 0 0 8px;
  font-size: 18px;
  font-weight: 600;
}
</style>
