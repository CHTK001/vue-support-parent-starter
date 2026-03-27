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
      <div class="config-section">
        <h4 class="section-title">
          <IconifyIconOnline icon="ri:settings-3-line" />
          基础配置
        </h4>
        <div class="config-grid">
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
      <div class="config-section">
        <h4 class="section-title">
          <IconifyIconOnline icon="ri:speed-line" />
          限流阈值
        </h4>
        <div class="config-grid">
          <ScFormItem label="阈值">
            <ScInputNumber
              v-model="config.threshold"
              :min="1"
              :max="100000"
              style="width: 150px"
            />
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
        <div class="threshold-display">
          <ScTag type="info">
            当前配置: {{ config.threshold }} 请求/{{
              getTimeUnitText(config.timeUnit)
            }}
          </ScTag>
        </div>
      </div>

      <!-- 拒绝策略配置 -->
      <div class="config-section">
        <h4 class="section-title">
          <IconifyIconOnline icon="ri:shield-line" />
          拒绝策略
        </h4>
        <div class="config-grid">
          <ScFormItem label="策略类型">
            <ScRadioGroup v-model="config.rejectStrategy">
              <ScRadio value="LIMIT">限流惩罚</ScRadio>
              <ScRadio value="BLACKLIST">加入黑名单</ScRadio>
            </ScRadioGroup>
          </ScFormItem>
        </div>

        <!-- 惩罚配置 -->
        <div class="penalty-config">
          <div class="config-grid">
            <ScFormItem label="惩罚时长">
              <ScInput
                v-model="config.penaltyDuration"
                placeholder="例如: 30S, 5MIN, 1H"
                style="width: 150px"
              />
            </ScFormItem>
            <ScFormItem label="永久惩罚">
              <ScSwitch v-model="config.penaltyPermanent" />
            </ScFormItem>
          </div>
          <ScFormItem v-if="config.rejectStrategy === 'LIMIT'" label="惩罚阈值">
            <ScInputNumber
              v-model="config.penaltyThreshold"
              :min="1"
              :max="100000"
              placeholder="留空则与阈值相同"
              style="width: 150px"
            />
          </ScFormItem>
        </div>
      </div>

      <!-- IP白名单/黑名单配置 -->
      <div class="config-section">
        <h4 class="section-title">
          <IconifyIconOnline icon="ri:user-settings-line" />
          IP访问控制
        </h4>

        <!-- 白名单 -->
        <div class="ip-list-config">
          <h5>白名单 IP</h5>
          <div class="ip-tags">
            <ScTag
              v-for="ip in config.whitelistIps"
              :key="ip"
              closable
              type="success"
              @close="removeFromWhitelist(ip)"
            >
              {{ ip }}
            </ScTag>
          </div>
          <div class="add-ip">
            <ScInput
              v-model="newWhitelistIp"
              placeholder="输入IP地址或CIDR"
              style="width: 200px"
              @keyup.enter="addToWhitelist"
            />
            <ScButton type="success" @click="addToWhitelist">
              <IconifyIconOnline icon="ri:add-line" />
              添加
            </ScButton>
          </div>
        </div>

        <!-- 黑名单 -->
        <div class="ip-list-config">
          <h5>黑名单 IP</h5>
          <div class="ip-tags">
            <ScTag
              v-for="ip in config.blacklistIps"
              :key="ip"
              closable
              type="danger"
              @close="removeFromBlacklist(ip)"
            >
              {{ ip }}
            </ScTag>
          </div>
          <div class="add-ip">
            <ScInput
              v-model="newBlacklistIp"
              placeholder="输入IP地址或CIDR"
              style="width: 200px"
              @keyup.enter="addToBlacklist"
            />
            <ScButton type="danger" @click="addToBlacklist">
              <IconifyIconOnline icon="ri:add-line" />
              添加
            </ScButton>
          </div>
        </div>
      </div>

      <!-- 配置预览 -->
      <div class="config-section">
        <h4 class="section-title">
          <IconifyIconOnline icon="ri:eye-line" />
          配置预览
        </h4>
        <ScCard class="config-preview thin-scrollbar">
          <pre>{{ JSON.stringify(config, null, 2) }}</pre>
        </ScCard>
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
import { ref, reactive, watch } from "vue";
import { message } from "@repo/utils";
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
const newWhitelistIp = ref("");
const newBlacklistIp = ref("");

// QPS配置对象
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

watch(
  () => props.visible,
  async (v) => {
    visibleInner.value = v;
    if (v) await loadData();
  },
  { immediate: true },
);

watch(visibleInner, (v) => emit("update:visible", v));

// 加载配置数据
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
  } catch (e) {
    console.error("加载QPS配置失败:", e);
  }
}

// 保存配置
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
  } finally {
    loading.value = false;
  }
}

// 关闭对话框
function handleClose() {
  visibleInner.value = false;
}

// 获取时间单位文本
function getTimeUnitText(unit: string) {
  const unitMap: Record<string, string> = {
    SECOND: "秒",
    MINUTE: "分钟",
    HOUR: "小时",
    DAY: "天",
  };
  return unitMap[unit] || "秒";
}

// 白名单操作
function addToWhitelist() {
  if (newWhitelistIp.value.trim()) {
    if (!config.whitelistIps.includes(newWhitelistIp.value.trim())) {
      config.whitelistIps.push(newWhitelistIp.value.trim());
      newWhitelistIp.value = "";
    } else {
      message("IP已存在于白名单中", { type: "warning" });
    }
  }
}

function removeFromWhitelist(ip: string) {
  const index = config.whitelistIps.indexOf(ip);
  if (index > -1) {
    config.whitelistIps.splice(index, 1);
  }
}

// 黑名单操作
function addToBlacklist() {
  if (newBlacklistIp.value.trim()) {
    if (!config.blacklistIps.includes(newBlacklistIp.value.trim())) {
      config.blacklistIps.push(newBlacklistIp.value.trim());
      newBlacklistIp.value = "";
    } else {
      message("IP已存在于黑名单中", { type: "warning" });
    }
  }
}

function removeFromBlacklist(ip: string) {
  const index = config.blacklistIps.indexOf(ip);
  if (index > -1) {
    config.blacklistIps.splice(index, 1);
  }
}
</script>

<style scoped lang="scss">
.qps-config-container {
  max-height: 70vh;
  overflow-y: auto;
  padding: 4px;
}

.config-section {
  margin-bottom: 20px;
  padding: 20px;
  border: none;
  border-radius: 12px;
  background: linear-gradient(145deg, #ffffff 0%, #f8fafc 100%);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  transition: box-shadow 0.3s ease;
}

.config-section:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.section-title {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0 0 20px 0;
  padding-bottom: 12px;
  font-size: 15px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  border-bottom: 2px solid var(--el-color-primary-light-8);
}

.section-title :deep(.iconify) {
  color: var(--el-color-primary);
  font-size: 18px;
}

.config-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 20px;
  margin-bottom: 16px;
}

.config-grid :deep(.el-form-item) {
  margin-bottom: 0;
}

.config-grid :deep(.el-form-item__label) {
  font-weight: 500;
  color: #606266;
}

.threshold-display {
  margin-top: 12px;
  padding: 10px 14px;
  background: var(--el-color-primary-light-9);
  border-radius: 8px;
  border-left: 3px solid var(--el-color-primary);
}

.threshold-display :deep(.el-tag) {
  font-size: 13px;
  padding: 6px 12px;
  border: none;
  background: transparent;
  color: var(--el-color-primary);
  font-weight: 500;
}

.penalty-config {
  margin-top: 16px;
  padding: 16px;
  background: linear-gradient(145deg, #fff7e6 0%, #fffbe6 100%);
  border-radius: 10px;
  border: 1px solid #ffe58f;
}

.ip-list-config {
  margin-bottom: 24px;
  padding: 16px;
  background: #fafbfc;
  border-radius: 10px;
}

.ip-list-config h5 {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  display: flex;
  align-items: center;
  gap: 6px;
}

.ip-list-config h5::before {
  content: "";
  width: 4px;
  height: 14px;
  background: var(--el-color-primary);
  border-radius: 2px;
}

.ip-tags {
  margin-bottom: 14px;
  min-height: 36px;
  padding: 10px;
  background: #fff;
  border-radius: 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  border: 1px dashed #dcdfe6;
}

.ip-tags:empty::after {
  content: "暂无数据";
  color: #c0c4cc;
  font-size: 13px;
}

.ip-tags :deep(.el-tag) {
  border-radius: 6px;
  font-size: 13px;
  padding: 4px 10px;
}

.add-ip {
  display: flex;
  gap: 10px;
  align-items: center;
}

.add-ip :deep(.el-input__wrapper) {
  border-radius: 8px;
}

.add-ip :deep(.el-button) {
  border-radius: 8px;
}

.config-preview {
  max-height: 180px;
  overflow-y: auto;
  border-radius: 8px;
  background: #282c34;
}

.config-preview pre {
  margin: 0;
  padding: 16px;
  font-size: 12px;
  line-height: 1.6;
  color: #abb2bf;
  font-family: "Consolas", "Monaco", monospace;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 8px;
}

.dialog-footer :deep(.el-button) {
  border-radius: 8px;
  padding: 10px 24px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 12px;
    padding: 12px 16px;
  }
}
</style>
