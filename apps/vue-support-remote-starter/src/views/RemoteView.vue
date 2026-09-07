<template>
  <div class="remote-view">
    <!-- 左：连接信息表单 -->
    <aside class="remote-left">
      <el-form label-position="top" :model="form" class="remote-form">
        <div class="form-title">连接信息</div>
        <el-form-item label="网关地址">
          <el-input v-model="form.gatewayUrl" placeholder="tcp://host:port（控制端连网关）" clearable />
        </el-form-item>
        <el-form-item label="接入令牌">
          <el-input v-model="form.accessToken" placeholder="控制端接入令牌" clearable />
        </el-form-item>
        <el-form-item label="目标被控端">
          <el-input v-model="form.targetAgentId" placeholder="被控端 id（如 shell-agent1）" clearable />
        </el-form-item>
        <el-form-item label="验证码">
          <el-input v-model="form.verifyCode" placeholder="被控端验证码" clearable />
        </el-form-item>
        <el-form-item label="画面源地址（WS）">
          <el-input v-model="form.wsUrl" placeholder="ws://host:port/ws（远控画面流）" clearable />
        </el-form-item>
        <div class="remote-actions">
          <el-button type="primary" :disabled="connected" @click="connect">连接</el-button>
          <el-button :disabled="!connected" @click="disconnect">断开</el-button>
          <el-button @click="saveConfig">保存配置</el-button>
        </div>
        <el-alert
          v-if="configSaved"
          type="success"
          :closable="false"
          title="配置已保存"
          class="save-tip"
        />
      </el-form>
    </aside>

    <!-- 右：远控画面 -->
    <section class="remote-right">
      <div class="screen-header">
        <span class="screen-title">远控画面</span>
        <el-tag :type="statusTag.type" size="small">{{ statusTag.text }}</el-tag>
      </div>
      <div class="screen-body">
        <canvas ref="screenRef" class="screen-canvas" />
        <div v-if="h264Mode" class="h264-tip">
          H264 流（WebCodecs/MSE 播放——待接入；JPEG 帧已 canvas 直绘）
        </div>
        <el-empty
          v-if="!connected && !h264Mode"
          description="未连接——左侧填写连接信息后点击连接"
          :image-size="80"
        />
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, reactive, ref } from "vue";
import { ElMessage } from "element-plus";

/** 连接配置（保存配置到后台——#5 接入后端接口；当前先落 localStorage 兜底） */
const form = reactive({
  gatewayUrl: "",
  accessToken: "",
  targetAgentId: "",
  verifyCode: "",
  wsUrl: "",
});

const connected = ref(false);
const h264Mode = ref(false);
const configSaved = ref(false);
const screenRef = ref<HTMLCanvasElement | null>(null);

let ws: WebSocket | null = null;

const statusTag = computed(() => {
  if (connected.value) return { type: "success" as const, text: "已连接" };
  if (h264Mode.value) return { type: "warning" as const, text: "H264 流" };
  return { type: "info" as const, text: "未连接" };
});

/** 连接画面源（WS） */
const connect = () => {
  if (!form.wsUrl) {
    ElMessage.warning("请填写画面源地址（WS）");
    return;
  }
  try {
    ws = new WebSocket(form.wsUrl);
    ws.binaryType = "arraybuffer";
    ws.onopen = () => {
      connected.value = true;
      ElMessage.success("已连接画面源");
    };
    ws.onmessage = (ev) => handleFrame(ev.data as ArrayBuffer);
    ws.onclose = () => {
      connected.value = false;
    };
    ws.onerror = () => {
      connected.value = false;
      ElMessage.error("画面源连接失败");
    };
  } catch {
    ElMessage.error("连接失败");
  }
};

const disconnect = () => {
  ws?.close();
  ws = null;
  connected.value = false;
  h264Mode.value = false;
};

/** 帧嗅探渲染：JPEG(FFD8) → canvas 直绘；H264(annex-B 00000001/000001) → 标记 */
const handleFrame = (data: ArrayBuffer) => {
  const bytes = new Uint8Array(data);
  if (bytes.length < 3) return;
  if (bytes[0] === 0xff && bytes[1] === 0xd8) {
    h264Mode.value = false;
    renderJpeg(bytes);
  } else if (
    (bytes.length > 4 && bytes[0] === 0 && bytes[1] === 0 && bytes[2] === 0 && bytes[3] === 1) ||
    (bytes.length > 3 && bytes[0] === 0 && bytes[1] === 0 && bytes[2] === 1)
  ) {
    h264Mode.value = true;
  }
};

const renderJpeg = (bytes: Uint8Array) => {
  const blob = new Blob([bytes], { type: "image/jpeg" });
  createImageBitmap(blob)
    .then((bitmap) => {
      const canvas = screenRef.value;
      if (!canvas) return;
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const ctx = canvas.getContext("2d");
      if (ctx) ctx.drawImage(bitmap, 0, 0);
      bitmap.close();
    })
    .catch(() => undefined);
};

/** 保存配置到后台（当前 localStorage 兜底；后端接口由 #5 接入） */
const saveConfig = () => {
  try {
    localStorage.setItem("remote-config", JSON.stringify(form));
    configSaved.value = true;
    ElMessage.success("配置已保存");
  } catch {
    ElMessage.error("保存失败");
  }
};

/** 启动时回显本地配置 */
const loadConfig = () => {
  try {
    const raw = localStorage.getItem("remote-config");
    if (raw) Object.assign(form, JSON.parse(raw));
  } catch {
    /* ignore */
  }
};
loadConfig();

onBeforeUnmount(() => {
  ws?.close();
});
</script>

<style lang="scss" scoped>
.remote-view {
  display: flex;
  height: 100%;
  gap: 16px;
  padding: 16px;
  box-sizing: border-box;
}

/* 左：连接表单 */
.remote-left {
  width: 320px;
  flex-shrink: 0;
  padding: 16px;
  background: #fff;
  border-radius: 8px;
  border: 1px solid var(--el-border-color-lighter);
  overflow-y: auto;
}

.form-title {
  font-size: 14px;
  font-weight: 700;
  margin-bottom: 12px;
  color: var(--el-text-color-primary);
}

.remote-actions {
  display: flex;
  gap: 8px;
  margin-top: 4px;
}

.save-tip {
  margin-top: 12px;
}

/* 右：远控画面 */
.remote-right {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  background: #fff;
  border-radius: 8px;
  border: 1px solid var(--el-border-color-lighter);
  overflow: hidden;
}

.screen-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 44px;
  padding: 0 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  flex-shrink: 0;
}

.screen-title {
  font-size: 14px;
  font-weight: 600;
}

.screen-body {
  flex: 1;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  background: #0d1117;
}

.screen-canvas {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.h264-tip {
  position: absolute;
  top: 12px;
  left: 50%;
  transform: translateX(-50%);
  padding: 6px 14px;
  font-size: 12px;
  color: #e6a23c;
  background: rgba(230, 162, 60, 0.12);
  border: 1px solid rgba(230, 162, 60, 0.4);
  border-radius: 6px;
}
</style>
