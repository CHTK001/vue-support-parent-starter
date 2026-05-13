<template>
  <sc-dialog
    v-model="visibleInner"
    title="SOCKS5 固定转发配置"
    width="760px"
    :close-on-click-modal="false"
    @close="handleClose"
    draggable
  >
    <div class="forward-config-container">
      <div class="config-section">
        <h4 class="section-title">
          <IconifyIconOnline icon="ri:route-line" />
          基础配置
        </h4>
        <div class="config-grid">
          <ScFormItem label="启用状态">
            <ScSwitch v-model="config.enabled" />
          </ScFormItem>
          <ScFormItem label="目标主机/IP">
            <ScInput v-model="config.targetHost" placeholder="如 192.168.1.10" />
          </ScFormItem>
          <ScFormItem label="目标端口">
            <ScInputNumber v-model="config.targetPort" :min="1" :max="65535" />
          </ScFormItem>
          <ScFormItem label="备注">
            <ScInput v-model="config.remark" placeholder="可选说明，如 转发到上游 SOCKS5 网关" />
          </ScFormItem>
        </div>
        <div class="tips">
          <span>启用后，所有访问当前 SOCKS5 服务端口的客户端请求都会被固定转发到上述目标 `IP:PORT`。</span>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <ScButton @click="handleClose">取消</ScButton>
        <ScButton type="primary" :loading="loading" @click="handleSave">
          保存配置
        </ScButton>
      </div>
    </template>
  </sc-dialog>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from "vue";
import { message } from "@repo/utils";
import { ScButton } from "@repo/components/ScButton";
import { ScDialog } from "@repo/components/ScDialog";
import { ScFormItem } from "@repo/components/ScForm";
import { ScInput } from "@repo/components/ScInput";
import { ScInputNumber } from "@repo/components/ScInputNumber";
import { ScSwitch } from "@repo/components/ScSwitch";
import {
  getServletFilterConfig,
  saveServletFilterConfig,
} from "@/api/system-server-setting";

interface Props {
  visible: boolean;
  serverId: number;
  filterSettingId: number;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  "update:visible": [boolean];
  success: [];
}>();

const visibleInner = ref(false);
const loading = ref(false);
const config = reactive({
  enabled: true,
  targetHost: "",
  targetPort: 1080,
  remark: "",
});

watch(
  () => props.visible,
  async (value) => {
    visibleInner.value = value;
    if (value) {
      await loadData();
    }
  },
  { immediate: true },
);

watch(visibleInner, (value) => {
  emit("update:visible", value);
});

async function loadData() {
  try {
    const res = await getServletFilterConfig(props.filterSettingId);
    const data = (res?.data || {}) as Record<string, unknown>;
    config.enabled = toBoolean(data.enabled, true);
    config.targetHost = toString(data.targetHost, "");
    config.targetPort = toNumber(data.targetPort, 1080);
    config.remark = toString(data.remark, "");
  } catch {
    config.enabled = true;
    config.targetHost = "";
    config.targetPort = 1080;
    config.remark = "";
  }
}

async function handleSave() {
  if (config.enabled && !config.targetHost.trim()) {
    message("启用固定转发时必须填写目标主机/IP", { type: "error" });
    return;
  }
  loading.value = true;
  try {
    const res = await saveServletFilterConfig(props.filterSettingId, {
      enabled: !!config.enabled,
      targetHost: config.targetHost.trim(),
      targetPort: Number(config.targetPort || 0),
      remark: config.remark.trim(),
    });
    if (res?.success) {
      message("保存成功，已热应用", { type: "success" });
      emit("success");
      visibleInner.value = false;
      return;
    }
    message(res?.msg || "保存失败", { type: "error" });
  } finally {
    loading.value = false;
  }
}

function handleClose() {
  visibleInner.value = false;
}

function toString(value: unknown, fallback = "") {
  if (value == null) return fallback;
  const text = String(value).trim();
  return text || fallback;
}

function toBoolean(value: unknown, fallback = false) {
  if (typeof value === "boolean") return value;
  if (value == null) return fallback;
  const text = String(value).trim().toLowerCase();
  if (["true", "1", "yes"].includes(text)) return true;
  if (["false", "0", "no"].includes(text)) return false;
  return fallback;
}

function toNumber(value: unknown, fallback: number) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
}
</script>

<style scoped lang="scss">
.forward-config-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.config-section {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  padding: 18px;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.04);
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 16px;
  font-size: 15px;
  font-weight: 600;
  color: #1f2937;
}

.config-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px 18px;
}

.tips {
  margin-top: 14px;
  padding: 12px 14px;
  border-radius: 10px;
  background: rgba(59, 130, 246, 0.08);
  color: #4b5563;
  font-size: 13px;
  line-height: 1.6;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

@media (max-width: 900px) {
  .config-grid {
    grid-template-columns: 1fr;
  }
}
</style>
