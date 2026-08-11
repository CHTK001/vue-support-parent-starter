<!--
  ReConnectionForm —— 远控连接表单（Key 模式 / 自定义模式）
  设计风格：Vercel / Linear · 低饱和度 · 极简卡片
  Props:
    - compact: 紧凑布局（用于侧边栏，去除居中样式，max-width: 100%）
    - fullWidth: 撑满父容器
-->
<template>
  <div
    class="connection-form card-modern p-5"
    :class="{ 'connection-form--compact': compact, 'connection-form--full': fullWidth }"
  >
    <div class="mb-4 flex flex-col gap-1">
      <h3 class="text-[16px] font-semibold text-el-text-primary">远程连接</h3>
      <p class="text-[12px] text-el-text-secondary">选择协议并填入认证信息</p>
    </div>

    <el-tabs v-model="activeTab" class="cf-tabs">
      <el-tab-pane label="Key 模式" name="key">
        <el-form label-position="top" size="default">
          <el-form-item label="连接 Key">
            <el-input
              v-model="form.key"
              placeholder="服务端预配置 key"
              clearable
            >
              <template #prefix><el-icon><Key /></el-icon></template>
            </el-input>
          </el-form-item>
          <el-button
            type="primary"
            size="large"
            :loading="loading"
            :disabled="!form.key"
            class="cf-connect-btn"
            @click="emitAuthenticate('key')"
          >
            <el-icon><Connection /></el-icon>
            <span>连接</span>
          </el-button>
        </el-form>
      </el-tab-pane>

      <el-tab-pane label="自定义模式" name="custom">
        <el-form label-position="top" size="default">
          <el-form-item label="协议">
            <el-select v-model="form.protocol" style="width: 100%">
              <el-option label="SSH（远程终端）" value="ssh" />
              <el-option label="VNC（远程桌面）" value="vnc" />
              <el-option label="RDP（Windows 远程桌面）" value="rdp" />
            </el-select>
          </el-form-item>
          <el-form-item label="主机 / IP">
            <el-input v-model="form.host" placeholder="192.168.1.100">
              <template #prefix><el-icon><Monitor /></el-icon></template>
            </el-input>
          </el-form-item>
          <el-row :gutter="12">
            <el-col :span="12">
              <el-form-item label="端口">
                <el-input-number v-model="form.port" :min="1" :max="65535" style="width: 100%" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="用户名">
                <el-input v-model="form.user" placeholder="admin / root" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-form-item label="密码">
            <el-input
              v-model="form.password"
              type="password"
              show-password
              placeholder="被控端密码"
            />
          </el-form-item>
          <el-button
            type="primary"
            size="large"
            :loading="loading"
            :disabled="!form.host || !form.port"
            class="cf-connect-btn"
            @click="emitAuthenticate('custom')"
          >
            <el-icon><Connection /></el-icon>
            <span>连接</span>
          </el-button>
        </el-form>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from "vue";
import { Connection, Key, Monitor } from "@element-plus/icons-vue";
import type { AuthPayload } from "../api/types";

interface Props {
  loading: boolean;
  /** 紧凑布局：用于侧边栏 */
  compact?: boolean;
  /** 撑满父容器 */
  fullWidth?: boolean;
}

withDefaults(defineProps<Props>(), {
  loading: false,
  compact: false,
  fullWidth: false,
});

const emit = defineEmits<{ (e: "authenticate", payload: AuthPayload): void }>();

const activeTab = ref<"key" | "custom">("custom");
const form = reactive({
  key: "",
  protocol: "ssh",
  host: "127.0.0.1",
  port: 22,
  user: "",
  password: "",
});

function emitAuthenticate(mode: "key" | "custom"): void {
  if (mode === "key") {
    emit("authenticate", { mode: "key", key: form.key });
    return;
  }
  emit("authenticate", {
    mode: "custom",
    protocol: form.protocol,
    host: form.host,
    port: form.port,
    user: form.user,
    password: form.password,
  });
}
</script>

<style scoped>
.cf-connect-btn {
  width: 100%;
  margin-top: 8px;
}

/* compact 模式：去除默认居中样式，撑满父容器 */
.connection-form--compact {
  max-width: none;
  margin: 0;
}

.connection-form--full {
  max-width: none;
  width: 100%;
}

/* 覆盖 ElTabs 底部线，使用 ElPlus 变量 */
.cf-tabs :deep(.el-tabs__nav-wrap)::after {
  height: 1px;
  background-color: var(--el-border-color-lighter);
}
</style>
