<template>
  <sc-dialog
    v-model="visibleInner"
    draggable
    title="QPS限流配置"
    width="900px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <div class="qps-config-container thin-scrollbar">
      <!-- 基础配置 -->
      <div class="fc-section">
        <h4 class="fc-section-title">
          <IconifyIconOnline icon="ri:settings-3-line" />
          基础配置
        </h4>
        <div class="fc-grid">
          <ScFormItem label="启用状态">
            <ScSwitch v-model="config.enabled" />
          </ScFormItem>
          <ScFormItem label="限流器类型">
            <ScSelect v-model="config.limiterType" style="width: 150px">
              <ScOption label="令牌桶" value="token" />
              <ScOption label="滑动窗口" value="sliding" />
              <ScOption label="Guava限流" value="guava" />
            </ScSelect>
          </ScFormItem>
        </div>
      </div>

      <!-- 限流阈值配置 -->
      <div class="fc-section">
        <h4 class="fc-section-title">
          <IconifyIconOnline icon="ri:speed-line" />
          限流阈值
        </h4>
        <div class="fc-grid">
          <ScFormItem label="阈值">
            <ScInputNumber v-model="config.threshold" :min="1" :max="100000" style="width: 150px" />
          </ScFormItem>
          <ScFormItem label="时间单位">
            <ScSelect v-model="config.timeUnit" style="width: 150px">
              <ScOption label="每秒 (QPS)" value="SECOND" />
              <ScOption label="每分钟 (QPM)" value="MINUTE" />
              <ScOption label="每小时 (QPH)" value="HOUR" />
              <ScOption label="每天 (QPD)" value="DAY" />
            </ScSelect>
          </ScFormItem>
        </div>
        <div class="fc-threshold-display">
          <ScTag type="info">
            当前配置: {{ config.threshold }} 请求/{{ getTimeUnitText(config.timeUnit) }}
          </ScTag>
        </div>
      </div>

      <!-- 拒绝策略配置 -->
      <div class="fc-section">
        <h4 class="fc-section-title">
          <IconifyIconOnline icon="ri:shield-line" />
          拒绝策略
        </h4>
        <div class="fc-grid">
          <ScFormItem label="策略类型">
            <ScRadioGroup v-model="config.rejectStrategy">
              <ScRadio value="LIMIT">限流惩罚</ScRadio>
              <ScRadio value="BLACKLIST">加入黑名单</ScRadio>
            </ScRadioGroup>
          </ScFormItem>
        </div>
        <div class="fc-penalty-config">
          <div class="fc-grid">
            <ScFormItem label="惩罚时长">
              <ScInput v-model="config.penaltyDuration" placeholder="例如: 30S, 5MIN, 1H" style="width: 150px" />
            </ScFormItem>
            <ScFormItem label="永久惩罚">
              <ScSwitch v-model="config.penaltyPermanent" />
            </ScFormItem>
          </div>
          <ScFormItem v-if="config.rejectStrategy === 'LIMIT'" label="惩罚阈值">
            <ScInputNumber v-model="config.penaltyThreshold" :min="1" :max="100000" placeholder="留空则与阈值相同" style="width: 150px" />
          </ScFormItem>
        </div>
      </div>

      <!-- IP白名单/黑名单配置 -->
      <div class="fc-section">
        <h4 class="fc-section-title">
          <IconifyIconOnline icon="ri:user-settings-line" />
          IP访问控制
        </h4>
        <div class="fc-ip-list">
          <h5>白名单 IP</h5>
          <div class="fc-tags">
            <ScTag v-for="ip in config.whitelistIps" :key="ip" closable type="success" @close="removeFromWhitelist(ip)">
              {{ ip }}
            </ScTag>
          </div>
          <div class="fc-inline-add">
            <ScInput v-model="newWhitelistIp" placeholder="输入IP地址或CIDR" style="width: 200px" @keyup.enter="addToWhitelist" />
            <ScButton type="success" @click="addToWhitelist">
              <IconifyIconOnline icon="ri:add-line" /> 添加
            </ScButton>
          </div>
        </div>
        <div class="fc-ip-list">
          <h5>黑名单 IP</h5>
          <div class="fc-tags">
            <ScTag v-for="ip in config.blacklistIps" :key="ip" closable type="danger" @close="removeFromBlacklist(ip)">
              {{ ip }}
            </ScTag>
          </div>
          <div class="fc-inline-add">
            <ScInput v-model="newBlacklistIp" placeholder="输入IP地址或CIDR" style="width: 200px" @keyup.enter="addToBlacklist" />
            <ScButton type="danger" @click="addToBlacklist">
              <IconifyIconOnline icon="ri:add-line" /> 添加
            </ScButton>
          </div>
        </div>
      </div>

      <!-- 配置预览 -->
      <div class="fc-section">
        <h4 class="fc-section-title">
          <IconifyIconOnline icon="ri:eye-line" />
          配置预览
        </h4>
        <ScCard class="fc-preview thin-scrollbar">
          <pre>{{ JSON.stringify(config, null, 2) }}</pre>
        </ScCard>
      </div>
    </div>

    <template #footer>
      <div class="fc-footer">
        <ScButton @click="handleClose">取消</ScButton>
        <ScButton type="primary" :loading="loading" @click="handleSave">保存配置</ScButton>
      </div>
    </template>
  </sc-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from "vue";
import { message } from "@repo/utils";
import { getServletFilterConfig, saveServletFilterConfig } from "@/api/system-server-setting";
import { ScButton } from "@repo/components/ScButton";
import { ScCard } from "@repo/components/ScCard";
import { ScDialog } from "@repo/components/ScDialog";
import { ScFormItem } from "@repo/components/ScForm";
import { ScInput } from "@repo/components/ScInput";
import { ScInputNumber } from "@repo/components/ScInputNumber";
import { ScOption } from "@repo/components/ScOption";
import { ScSelect } from "@repo/components/ScSelect";
import { ScSwitch } from "@repo/components/ScSwitch";
import { ScTag } from "@repo/components/ScTag";

interface Props {
  visible: boolean;
  serverId: number;
  filterSettingId: number;
}

const props = defineProps<Props>();
const emit = defineEmits<{ "update:visible": [boolean]; success: [] }>();

const visibleInner = ref(false);
const loading = ref(false);
const newWhitelistIp = ref("");
const newBlacklistIp = ref("");

const config = reactive({
  enabled: true,
  limiterType: "token",
  threshold: 100.0,
  timeUnit: "SECOND",
  rejectStrategy: "LIMIT",
  penaltyDuration: "0S",
  penaltyPermanent: false,
  penaltyThreshold: null as number | null,
  whitelistIps: [] as string[],
  blacklistIps: [] as string[],
});

watch(() => props.visible, async (v) => { visibleInner.value = v; if (v) await loadData(); }, { immediate: true });
watch(visibleInner, (v) => emit("update:visible", v));

async function loadData() {
  try {
    const res = await getServletFilterConfig(props.filterSettingId);
    if (res.success && res.data) {
      Object.assign(config, {
        enabled: res.data.enabled ?? true,
        limiterType: res.data.limiterType ?? "token",
        threshold: res.data.threshold ?? 100.0,
        timeUnit: res.data.timeUnit ?? "SECOND",
        rejectStrategy: res.data.rejectStrategy ?? "LIMIT",
        penaltyDuration: res.data.penaltyDuration ?? "0S",
        penaltyPermanent: res.data.penaltyPermanent ?? false,
        penaltyThreshold: res.data.penaltyThreshold ?? null,
        whitelistIps: res.data.whitelistIps ?? [],
        blacklistIps: res.data.blacklistIps ?? [],
      });
    }
  } catch (e) { console.error("加载QPS配置失败:", e); }
}

async function handleSave() {
  loading.value = true;
  try {
    const res = await saveServletFilterConfig(props.filterSettingId, config);
    if (res.success) {
      message("QPS限流配置保存成功，已热应用", { type: "success" });
      emit("success");
      visibleInner.value = false;
    } else {
      message(res.msg || "保存失败", { type: "error" });
    }
  } catch (error) {
    console.error("保存QPS配置失败:", error);
    message("保存失败", { type: "error" });
  } finally { loading.value = false; }
}

function handleClose() { visibleInner.value = false; }

function getTimeUnitText(unit: string) {
  const unitMap: Record<string, string> = { SECOND: "秒", MINUTE: "分钟", HOUR: "小时", DAY: "天" };
  return unitMap[unit] || "秒";
}

function addToWhitelist() {
  if (newWhitelistIp.value.trim()) {
    if (!config.whitelistIps.includes(newWhitelistIp.value.trim())) {
      config.whitelistIps.push(newWhitelistIp.value.trim());
      newWhitelistIp.value = "";
    } else { message("IP已存在于白名单中", { type: "warning" }); }
  }
}

function removeFromWhitelist(ip: string) { const idx = config.whitelistIps.indexOf(ip); if (idx > -1) config.whitelistIps.splice(idx, 1); }
function addToBlacklist() {
  if (newBlacklistIp.value.trim()) {
    if (!config.blacklistIps.includes(newBlacklistIp.value.trim())) {
      config.blacklistIps.push(newBlacklistIp.value.trim());
      newBlacklistIp.value = "";
    } else { message("IP已存在于黑名单中", { type: "warning" }); }
  }
}
function removeFromBlacklist(ip: string) { const idx = config.blacklistIps.indexOf(ip); if (idx > -1) config.blacklistIps.splice(idx, 1); }
</script>

<style scoped lang="scss">
@use './filter-config-shared' as *;

.qps-config-container { max-height: 70vh; overflow-y: auto; padding: 4px; }

.fc-section {
  @include config-section;
  margin-bottom: 20px;
}

.fc-section-title { @include section-title; margin-bottom: 20px; }

.fc-grid {
  @include config-grid;
  margin-bottom: 16px;
}

.fc-threshold-display {
  margin-top: 12px; padding: 10px 14px;
  background: $fc-primary-light; border-radius: $fc-radius-xs;
  border-left: 3px solid $fc-primary;
}

.fc-penalty-config {
  margin-top: 16px; padding: 16px;
  background: #fffbe6; border-radius: $fc-radius-sm;
  border: 1px solid #ffe58f;
}

.fc-ip-list {
  margin-bottom: 24px; padding: 16px;
  background: $fc-surface-alt; border-radius: $fc-radius-sm;
  h5 { margin: 0 0 12px; font-size: 14px; font-weight: 600; color: $fc-title; }
}

.fc-tags {
  @include tag-container;
}

.fc-inline-add { @include inline-add; margin-bottom: 8px; }

.fc-preview {
  max-height: 180px; overflow-y: auto; border-radius: $fc-radius-xs;
  background: #282c34;
  pre { margin: 0; padding: 16px; font-size: 12px; line-height: 1.6; color: #abb2bf; font-family: "Consolas", "Monaco", monospace; }
}

.fc-footer { @include action-row; }

@include mobile {
  .fc-grid { grid-template-columns: 1fr; }
}
</style>
