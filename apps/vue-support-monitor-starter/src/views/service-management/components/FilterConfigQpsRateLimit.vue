<template>
  <el-dialog
    draggable
    v-model="visibleInner"
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
          <el-form-item label="启用状�?>
            <el-switch v-model="config.enabled" />
          </el-form-item>
          <el-form-item label="限流器类�?>
            <el-select v-model="config.limiterType" style="width: 150px">
              <el-option label="令牌�? value="token" />
              <el-option label="滑动窗口" value="sliding" />
              <el-option label="Guava限流" value="guava" />
            </el-select>
          </el-form-item>
        </div>
      </div>

      <!-- 限流阈值配�?-->
      <div class="config-section">
        <h4 class="section-title">
          <IconifyIconOnline icon="ri:speed-line" />
          限流阈�?
        </h4>
        <div class="config-grid">
          <el-form-item label="阈�?>
            <el-input-number
              v-model="config.threshold"
              :min="1"
              :max="100000"
              style="width: 150px"
            />
          </el-form-item>
          <el-form-item label="时间单位">
            <el-select v-model="config.timeUnit" style="width: 150px">
              <el-option label="每秒 (QPS)" value="SECOND" />
              <el-option label="每分�?(QPM)" value="MINUTE" />
              <el-option label="每小�?(QPH)" value="HOUR" />
              <el-option label="每天 (QPD)" value="DAY" />
            </el-select>
          </el-form-item>
        </div>
        <div class="threshold-display">
          <el-tag type="info">
            当前配置: {{ config.threshold }} 请求/{{
              getTimeUnitText(config.timeUnit)
            }}
          </el-tag>
        </div>
      </div>

      <!-- 拒绝策略配置 -->
      <div class="config-section">
        <h4 class="section-title">
          <IconifyIconOnline icon="ri:shield-line" />
          拒绝策略
        </h4>
        <div class="config-grid">
          <el-form-item label="策略类型">
            <el-radio-group v-model="config.rejectStrategy">
              <el-radio value="LIMIT">限流惩罚</el-radio>
              <el-radio value="BLACKLIST">加入黑名�?/el-radio>
            </el-radio-group>
          </el-form-item>
        </div>

        <!-- 惩罚配置 -->
        <div class="penalty-config">
          <div class="config-grid">
            <el-form-item label="惩罚时长">
              <el-input
                v-model="config.penaltyDuration"
                placeholder="例如: 30S, 5MIN, 1H"
                style="width: 150px"
              />
            </el-form-item>
            <el-form-item label="永久惩罚">
              <el-switch v-model="config.penaltyPermanent" />
            </el-form-item>
          </div>
          <el-form-item
            v-if="config.rejectStrategy === 'LIMIT'"
            label="惩罚阈�?
          >
            <el-input-number
              v-model="config.penaltyThreshold"
              :min="1"
              :max="100000"
              placeholder="留空则与阈值相�?
              style="width: 150px"
            />
          </el-form-item>
        </div>
      </div>

      <!-- IP白名�?黑名单配�?-->
      <div class="config-section">
        <h4 class="section-title">
          <IconifyIconOnline icon="ri:user-settings-line" />
          IP访问控制
        </h4>

        <!-- 白名�?-->
        <div class="ip-list-config">
          <h5>白名�?IP</h5>
          <div class="ip-tags">
            <el-tag
              v-for="ip in config.whitelistIps"
              :key="ip"
              closable
              @close="removeFromWhitelist(ip)"
              type="success"
            >
              {{ ip }}
            </el-tag>
          </div>
          <div class="add-ip">
            <el-input
              v-model="newWhitelistIp"
              placeholder="输入IP地址或CIDR"
              style="width: 200px"
              @keyup.enter="addToWhitelist"
            />
            <el-button type="success" @click="addToWhitelist">
              <IconifyIconOnline icon="ri:add-line" />
              添加
            </el-button>
          </div>
        </div>

        <!-- 黑名�?-->
        <div class="ip-list-config">
          <h5>黑名�?IP</h5>
          <div class="ip-tags">
            <el-tag
              v-for="ip in config.blacklistIps"
              :key="ip"
              closable
              @close="removeFromBlacklist(ip)"
              type="danger"
            >
              {{ ip }}
            </el-tag>
          </div>
          <div class="add-ip">
            <el-input
              v-model="newBlacklistIp"
              placeholder="输入IP地址或CIDR"
              style="width: 200px"
              @keyup.enter="addToBlacklist"
            />
            <el-button type="danger" @click="addToBlacklist">
              <IconifyIconOnline icon="ri:add-line" />
              添加
            </el-button>
          </div>
        </div>
      </div>

      <!-- 配置预览 -->
      <div class="config-section">
        <h4 class="section-title">
          <IconifyIconOnline icon="ri:eye-line" />
          配置预览
        </h4>
        <el-card class="config-preview thin-scrollbar">
          <pre>{{ JSON.stringify(config, null, 2) }}</pre>
        </el-card>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" :loading="loading" @click="handleSave">
          保存配置
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from "vue";
import { ElMessage } from "element-plus";
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
  { immediate: true }
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
      ElMessage.success("QPS限流配置保存成功，已热应�?);
      emit("success");
      visibleInner.value = false;
    } else {
      ElMessage.error(res.msg || "保存失败");
    }
  } catch (error) {
    console.error("保存QPS配置失败:", error);
    ElMessage.error("保存失败");
  } finally {
    loading.value = false;
  }
}

// 关闭对话�?
function handleClose() {
  visibleInner.value = false;
}

// 获取时间单位文本
function getTimeUnitText(unit: string) {
  const unitMap: Record<string, string> = {
    SECOND: "�?,
    MINUTE: "分钟",
    HOUR: "小时",
    DAY: "�?,
  };
  return unitMap[unit] || "�?;
}

// 白名单操�?
function addToWhitelist() {
  if (newWhitelistIp.value.trim()) {
    if (!config.whitelistIps.includes(newWhitelistIp.value.trim())) {
      config.whitelistIps.push(newWhitelistIp.value.trim());
      newWhitelistIp.value = "";
    } else {
      ElMessage.warning("IP已存在于白名单中");
    }
  }
}

function removeFromWhitelist(ip: string) {
  const index = config.whitelistIps.indexOf(ip);
  if (index > -1) {
    config.whitelistIps.splice(index, 1);
  }
}

// 黑名单操�?
function addToBlacklist() {
  if (newBlacklistIp.value.trim()) {
    if (!config.blacklistIps.includes(newBlacklistIp.value.trim())) {
      config.blacklistIps.push(newBlacklistIp.value.trim());
      newBlacklistIp.value = "";
    } else {
      ElMessage.warning("IP已存在于黑名单中");
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

<style scoped>
.qps-config-container {
  max-height: 70vh;
  overflow-y: auto;
}

.config-section {
  margin-bottom: 24px;
  padding: 16px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  background-color: #fafafa;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.config-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
  margin-bottom: 16px;
}

.threshold-display {
  margin-top: 8px;
}

.penalty-config {
  margin-top: 16px;
  padding: 12px;
  background-color: #f5f7fa;
  border-radius: 6px;
}

.ip-list-config {
  margin-bottom: 20px;
}

.ip-list-config h5 {
  margin: 0 0 8px 0;
  font-size: 14px;
  font-weight: 600;
  color: #606266;
}

.ip-tags {
  margin-bottom: 12px;
  min-height: 32px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.add-ip {
  display: flex;
  gap: 8px;
  align-items: center;
}

.config-preview {
  max-height: 200px;
  overflow-y: auto;
}

.config-preview pre {
  margin: 0;
  font-size: 12px;
  line-height: 1.4;
  color: #606266;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
