<!--
  网关配置 —— 修改 Gateway 地址、令牌、心跳等参数
  设计风格：Vercel / Linear · 低饱和度 · 卡片化 · 居中布局
-->
<template>
  <ReCard class="config-page">
    <div class="config-head mb-5">
      <div class="config-head__title text-[18px] font-semibold text-el-text-primary">网关配置</div>
      <div class="config-head__desc mt-1 text-[12px] text-el-text-secondary">
        参数保存到 localStorage，下次自动应用
      </div>
    </div>

    <el-form label-position="top" size="default">
      <el-form-item label="Gateway 默认地址">
        <el-input v-model="form.gatewayUrl" placeholder="ws://127.0.0.1:8182" />
      </el-form-item>
      <el-form-item label="默认协议">
        <el-select v-model="form.protocol" style="width: 100%">
          <el-option label="SSH 终端" value="SSH" />
          <el-option label="桌面远程" value="DESKTOP" />
          <el-option label="视频会议" value="CONFERENCE" />
        </el-select>
      </el-form-item>
      <el-row :gutter="12">
        <el-col :span="12">
          <el-form-item label="心跳间隔 (毫秒)">
            <el-input-number
              v-model="form.heartbeatInterval"
              :min="10000"
              :max="300000"
              :step="5000"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="心跳超时 (毫秒)">
            <el-input-number
              v-model="form.heartbeatTimeout"
              :min="60000"
              :max="600000"
              :step="5000"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
      </el-row>
      <div class="config-actions mt-4 flex gap-2">
        <el-button type="primary" @click="save">保存配置</el-button>
        <el-button plain @click="reset">恢复默认</el-button>
      </div>
    </el-form>
  </ReCard>
</template>

<script setup lang="ts">
import { reactive } from "vue";
import { message } from "@repo/core";

const STORAGE_KEY = "rc-gateway-config";

interface GatewayConfig {
  gatewayUrl: string;
  protocol: "SSH" | "DESKTOP" | "CONFERENCE";
  heartbeatInterval: number;
  heartbeatTimeout: number;
}

const form = reactive<GatewayConfig>(loadConfig());

function loadConfig(): GatewayConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...defaults(), ...JSON.parse(raw) };
  } catch {
    // ignore
  }
  return defaults();
}

function defaults(): GatewayConfig {
  return {
    gatewayUrl: "ws://127.0.0.1:8182",
    protocol: "SSH",
    heartbeatInterval: 60000,
    heartbeatTimeout: 180000,
  };
}

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(form));
  message.success("网关配置已保存");
}

function reset() {
  Object.assign(form, defaults());
  localStorage.removeItem(STORAGE_KEY);
  message.info("已恢复默认配置");
}
</script>

<style scoped>
.config-page {
  padding: 24px;
  max-width: 600px;
  margin: 0 auto;
}
</style>
