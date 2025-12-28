<template>
  <sc-dialog
    v-model="visibleInner"
    title="IP限流配置"
    width="800px"
    :close-on-click-modal="false"
    @close="handleClose"
    draggable
  >
    <div class="ip-limit-container">
      <!-- 规则说明 -->
      <div class="config-tips">
        <IconifyIconOnline icon="ri:information-line" />
        <span
          >配置IP限流规则：限流模式需设置QPS阈值，白名单/黑名单模式无需设置QPS</span
        >
      </div>

      <!-- 表头 -->
      <div class="rule-header">
        <span class="col-type">规则类型</span>
        <span class="col-ip">IP地址/CIDR</span>
        <span class="col-qps">QPS限制</span>
        <span class="col-status">状态</span>
        <span class="col-action">操作</span>
      </div>

      <!-- 规则列表 -->
      <div class="rule-list thin-scrollbar">
        <div class="rule-row" v-for="(r, idx) in rules" :key="idx">
          <div class="col-type">
            <el-select v-model="r.ipRateLimitType" placeholder="类型">
              <el-option label="限流" value="RATE_LIMIT">
                <span class="option-item"
                  ><IconifyIconOnline icon="ri:speed-line" /> 限流</span
                >
              </el-option>
              <el-option label="白名单" value="WHITELIST">
                <span class="option-item"
                  ><IconifyIconOnline icon="ri:shield-check-line" />
                  白名单</span
                >
              </el-option>
              <el-option label="黑名单" value="BLACKLIST">
                <span class="option-item"
                  ><IconifyIconOnline icon="ri:spam-line" /> 黑名单</span
                >
              </el-option>
            </el-select>
          </div>
          <div class="col-ip">
            <el-input
              v-model="r.ipRateLimitIp"
              placeholder="例如: 192.168.1.1 或 10.0.0.0/24"
            />
          </div>
          <div class="col-qps">
            <el-input-number
              v-model="r.ipRateLimitQps"
              :min="1"
              :max="100000"
              :disabled="r.ipRateLimitType !== 'RATE_LIMIT'"
              controls-position="right"
            />
          </div>
          <div class="col-status">
            <el-switch
              v-model="r.ipRateLimitEnabled"
              active-text="启用"
              inactive-text="禁用"
            />
          </div>
          <div class="col-action">
            <el-button
              type="danger"
              size="small"
              circle
              @click="rules.splice(idx, 1)"
            >
              <IconifyIconOnline icon="ri:delete-bin-line" />
            </el-button>
          </div>
        </div>

        <!-- 空状态 -->
        <div v-if="rules.length === 0" class="empty-state">
          <IconifyIconOnline icon="ri:file-list-line" />
          <span>暂无规则，点击下方按钮添加</span>
        </div>
      </div>

      <!-- 添加按钮 -->
      <div class="add-rule-btn">
        <el-button type="primary" @click="addRule">
          <IconifyIconOnline icon="ri:add-line" />
          新增规则
        </el-button>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" :loading="loading" @click="handleSave"
          >保存配置</el-button
        >
      </div>
    </template>
  </sc-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { message } from "@repo/utils";
import {
  getIpRateLimitRules,
  saveIpRateLimitRules,
  type IpRateLimitRule,
} from "@/api/system-server-setting";

interface Props {
  visible: boolean;
  serverId: number;
  filterSettingId: number;
}
const props = defineProps<Props>();
const emit = defineEmits<{ "update:visible": [boolean]; success: [] }>();

const visibleInner = ref(false);
const loading = ref(false);
const rules = ref<IpRateLimitRule[]>([]);

watch(
  () => props.visible,
  async (v) => {
    visibleInner.value = v;
    if (v) await loadData();
  },
  { immediate: true }
);
watch(visibleInner, (v) => emit("update:visible", v));

async function loadData() {
  rules.value = [];
  try {
    const res = await getIpRateLimitRules(
      props.serverId,
      props.filterSettingId
    );
    if (res.success && Array.isArray(res.data)) {
      rules.value = res.data.map((r: any) => ({
        ipRateLimitType: r.ipRateLimitType || "RATE_LIMIT",
        ipRateLimitIp: r.ipRateLimitIp || "",
        ipRateLimitQps:
          typeof r.ipRateLimitQps === "number" ? r.ipRateLimitQps : 100,
        ipRateLimitEnabled: r.ipRateLimitEnabled !== false,
      }));
    }
  } catch (e) {
    /* ignore */
  }
}

function addRule() {
  rules.value.push({
    ipRateLimitType: "RATE_LIMIT",
    ipRateLimitIp: "",
    ipRateLimitQps: 100,
    ipRateLimitEnabled: true,
  });
}

async function handleSave() {
  loading.value = true;
  try {
    const res = await saveIpRateLimitRules(
      props.serverId,
      props.filterSettingId,
      rules.value
    );
    if (res.success) {
      message("保存成功，已热应用", { type: "success" });
      emit("success");
      visibleInner.value = false;
    } else {
      message(res.msg || "保存失败", { type: "error" });
    }
  } finally {
    loading.value = false;
  }
}

function handleClose() {
  visibleInner.value = false;
}
</script>

<style scoped>
.ip-limit-container {
  max-height: 60vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.config-tips {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  margin-bottom: 16px;
  background: linear-gradient(145deg, #e6f7ff 0%, #f0faff 100%);
  border-radius: 8px;
  border-left: 3px solid #1890ff;
  color: #1890ff;
  font-size: 13px;
}

.rule-header {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background: #f5f7fa;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  color: #606266;
  margin-bottom: 12px;
}

.rule-list {
  flex: 1;
  overflow-y: auto;
  max-height: 320px;
  padding-right: 4px;
}

.rule-row {
  display: flex;
  align-items: center;
  padding: 14px 16px;
  margin-bottom: 10px;
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 10px;
  transition: all 0.2s ease;
}

.rule-row:hover {
  border-color: #1890ff;
  box-shadow: 0 2px 8px rgba(24, 144, 255, 0.1);
}

.col-type {
  width: 140px;
  flex-shrink: 0;
}

.col-ip {
  flex: 1;
  margin: 0 12px;
  min-width: 180px;
}

.col-qps {
  width: 130px;
  flex-shrink: 0;
}

.col-status {
  width: 100px;
  flex-shrink: 0;
  margin: 0 12px;
}

.col-action {
  width: 50px;
  flex-shrink: 0;
  text-align: center;
}

.col-type :deep(.el-select) {
  width: 100%;
}

.col-ip :deep(.el-input__wrapper) {
  border-radius: 6px;
}

.col-qps :deep(.el-input-number) {
  width: 100%;
}

.option-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: #909399;
  font-size: 14px;
  gap: 12px;
}

.empty-state :deep(.iconify) {
  font-size: 40px;
  color: #c0c4cc;
}

.add-rule-btn {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px dashed #e8e8e8;
}

.add-rule-btn :deep(.el-button) {
  width: 100%;
  border-radius: 8px;
  height: 40px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.dialog-footer :deep(.el-button) {
  border-radius: 8px;
  padding: 10px 24px;
}
</style>
