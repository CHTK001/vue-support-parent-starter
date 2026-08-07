<!--
  ConnectionForm —— 远控连接表单（3 步流程的第 1 步）
  支持两种模式：
    - key 模式：服务端预配置 key（推荐），仅需填 key
    - custom 模式：自定义 host/port/user/password（适合临时连接）
  提交后触发 @authenticate 事件，由父组件发起 POST /api/connections/authenticate
-->
<template>
  <ReCard class="connection-form">
    <div class="cf-head">
      <div class="cf-head__title">远控连接</div>
      <div class="cf-head__desc">选择协议并填入认证信息</div>
    </div>

    <el-tabs v-model="activeTab" class="cf-tabs">
      <el-tab-pane label="Key 模式" name="key">
        <el-form label-position="top" size="default">
          <el-form-item label="连接 Key">
            <el-input
              v-model="form.key"
              placeholder="服务端预配置 key，如 server01-key-aaa"
              clearable
            >
              <template #prefix><el-icon><Key /></el-icon></template>
            </el-input>
          </el-form-item>
          <el-form-item label="可选：协议覆盖" v-if="false">
            <el-select v-model="form.protocol" placeholder="默认由服务端配置" clearable>
              <el-option label="VNC" value="vnc" />
              <el-option label="SSH" value="ssh" />
              <el-option label="RDP" value="rdp" />
            </el-select>
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
              <el-option label="VNC（远程桌面）" value="vnc" />
              <el-option label="SSH（远程终端）" value="ssh" />
              <el-option label="RDP（Windows 远程桌面）" value="rdp" />
              <el-option label="RustDesk（占位）" value="rustdesk" />
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
                <el-input-number
                  v-model="form.port"
                  :min="1"
                  :max="65535"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="用户名（可选）">
                <el-input v-model="form.user" placeholder="admin / root" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-form-item label="密码（可选）">
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
  </ReCard>
</template>

<script setup lang="ts">
import { reactive, ref } from "vue";
import { Connection, Key, Monitor } from "@element-plus/icons-vue";

/**
 * 鉴权请求负载类型
 */
export interface AuthPayload {
  mode: "key" | "custom";
  key?: string;
  protocol?: string;
  host?: string;
  port?: number;
  user?: string;
  password?: string;
}

/**
 * 提交事件：父组件发起 authenticate 请求
 */
const emit = defineEmits<{
  (e: "authenticate", payload: AuthPayload): void;
}>();

defineProps<{
  /**
   * 鉴权中标志（父组件传入）
   */
  loading: boolean;
}>();

/**
 * 当前激活的 tab
 */
const activeTab = ref<"key" | "custom">("key");

/**
 * 表单状态
 */
const form = reactive({
  key: "",
  protocol: "vnc",
  host: "127.0.0.1",
  port: 5900,
  user: "",
  password: "",
});

/**
 * 触发鉴权事件
 */
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

<style scoped lang="scss">
.connection-form {
  max-width: 520px;
  margin: 60px auto;
  padding: 24px;
}

.cf-head {
  margin-bottom: 16px;

  &__title {
    font-size: 18px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  &__desc {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    margin-top: 4px;
  }
}

.cf-tabs {
  margin-top: 12px;
}

.cf-connect-btn {
  width: 100%;
  margin-top: 8px;
}
</style>