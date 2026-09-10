<template>
  <div class="settings-view">
    <div class="page-header">
      <div>
        <div class="page-title">设置</div>
        <div class="page-sub">网关与连接地址配置——保存到服务端，连接页自动使用</div>
      </div>
      <div class="header-actions">
        <ReButton @click="load">恢复</ReButton>
        <ReButton type="primary" @click="save">保存配置</ReButton>
      </div>
    </div>

    <div class="settings-form">
      <div class="form-field">
        <label class="form-label">HTTP 地址</label>
        <ReInput v-model="form.httpUrl" placeholder="http://host:9001（REST/验证/WS 会话同端口）" clearable data-testid="set-http" />
      </div>
      <div class="form-field">
        <label class="form-label">agent 帧地址</label>
        <ReInput v-model="form.gatewayUrl" placeholder="tcp://host:9000（被控端 agent 连接）" clearable data-testid="set-gateway" />
      </div>
      <div class="form-field">
        <label class="form-label">WS 会话地址</label>
        <ReInput v-model="form.wsUrl" placeholder="ws://host:9001（SSH/VNC/RDP 会话，与 HTTP 同端口）" clearable data-testid="set-ws" />
      </div>
      <div class="form-field">
        <label class="form-label">默认被控端</label>
        <ReInput v-model="form.defaultAgentId" placeholder="选填——进入连接页自动预填" clearable data-testid="set-agent" />
      </div>
      <div class="form-field">
        <label class="form-label">默认验证码</label>
        <ReInput v-model="form.defaultVerifyCode" placeholder="选填——进入连接页自动预填" clearable data-testid="set-code" />
      </div>
      <div v-if="saved" class="save-tip" data-testid="set-saved-tip">配置已保存到服务端</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { ElMessage } from "element-plus";
import ReInput from "@repo/ui/re-input";
import ReButton from "@repo/ui/re-button";

const form = reactive({
  httpUrl: "",
  gatewayUrl: "",
  wsUrl: "",
  defaultAgentId: "",
  defaultVerifyCode: "",
});

const saved = ref(false);
const CONFIG_API = "/api/remote/config";

/** 默认地址：与页面同 IP + 各端口（HTTP 与 WS 同端口 9001；agent 帧端口 9000） */
const defaults = () => {
  const host = location.hostname || "localhost";
  return {
    httpUrl: `http://${host}:9001`,
    gatewayUrl: `tcp://${host}:9000`,
    wsUrl: `ws://${host}:9001`,
  };
};

const load = async () => {
  const def = defaults();
  Object.assign(form, def);
  try {
    const resp = await fetch(CONFIG_API);
    if (resp.ok) {
      const data = await resp.json();
      if (data && typeof data === "object") {
        Object.assign(form, data);
      }
    }
  } catch {
    /* 后端不可达——用默认值 */
  }
};

const save = async () => {
  const payload = JSON.stringify({ ...form, saveTime: Date.now() });
  try {
    const resp = await fetch(CONFIG_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
    });
    if (resp.ok) {
      saved.value = true;
      ElMessage.success("配置已保存到服务端");
      return;
    }
    throw new Error(`HTTP ${resp.status}`);
  } catch {
    try {
      localStorage.setItem("remote-settings", payload);
      saved.value = true;
      ElMessage.success("后端不可达——已保存到本地");
    } catch {
      ElMessage.error("保存失败");
    }
  }
};

onMounted(load);
</script>

<style lang="scss" scoped>
.settings-view {
  height: 100%;
  padding: 16px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow-y: auto;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.page-title {
  font-size: 16px;
  font-weight: 700;
}

.page-sub {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-top: 2px;
}

.settings-form {
  max-width: 520px;
  background: #fff;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.form-label {
  font-size: 12px;
  font-weight: 500;
  color: var(--el-text-color-secondary);
}

.save-tip {
  padding: 8px 12px;
  font-size: 12px;
  color: #67c23a;
  background: #f0f9eb;
  border-radius: 4px;
}
</style>
