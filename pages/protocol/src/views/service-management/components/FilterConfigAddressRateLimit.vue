<template>
  <sc-dialog
    v-model="visibleInner"
    title="地址限流配置"
    width="800px"
    :close-on-click-modal="false"
    @close="handleClose"
    draggable
  >
    <div class="fc-container">
      <div class="fc-tips">
        <IconifyIconOnline icon="ri:information-line" />
        <span>配置 URL 地址限流规则：可针对特定路径设置访问频率限制或黑白名单</span>
      </div>

      <div class="fc-table-header">
        <span class="th-type">规则类型</span>
        <span class="th-addr">URL 路径</span>
        <span class="th-qps">QPS 限制</span>
        <span class="th-status">状态</span>
        <span class="th-action">操作</span>
      </div>

      <div class="fc-list thin-scrollbar">
        <div v-for="(r, idx) in rules" :key="idx" class="fc-row">
          <div class="th-type">
            <ScSelect v-model="r.addressRateLimitType" placeholder="类型">
              <ScOption label="限流" value="RATE_LIMIT">
                <span class="fc-option"><IconifyIconOnline icon="ri:speed-line" /> 限流</span>
              </ScOption>
              <ScOption label="白名单" value="WHITELIST">
                <span class="fc-option"><IconifyIconOnline icon="ri:shield-check-line" /> 白名单</span>
              </ScOption>
              <ScOption label="黑名单" value="BLACKLIST">
                <span class="fc-option"><IconifyIconOnline icon="ri:spam-line" /> 黑名单</span>
              </ScOption>
            </ScSelect>
          </div>
          <div class="th-addr">
            <ScInput v-model="r.addressRateLimitAddress" placeholder="例如: /api/user 或 /admin/*" />
          </div>
          <div class="th-qps">
            <ScInputNumber v-model="r.addressRateLimitQps" :min="1" :max="100000" :disabled="r.addressRateLimitType !== 'RATE_LIMIT'" />
          </div>
          <div class="th-status">
            <ScSwitch v-model="r.addressRateLimitEnabled" size="small" />
          </div>
          <div class="th-action">
            <ScButton type="danger" size="small" circle @click="rules.splice(idx, 1)">
              <IconifyIconOnline icon="ri:delete-bin-line" />
            </ScButton>
          </div>
        </div>

        <div v-if="rules.length === 0" class="fc-empty">
          <IconifyIconOnline icon="ri:route-line" />
          <span>暂无规则，点击下方按钮添加</span>
        </div>
      </div>

      <div class="fc-add-bar">
        <ScButton type="primary" @click="addRule">
          <IconifyIconOnline icon="ri:add-line" />
          新增规则
        </ScButton>
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
import { ref, watch } from "vue";
import { message } from "@repo/utils";
import {
  getAddressRateLimitRules,
  saveAddressRateLimitRules,
  type AddressRateLimitRule,
} from "@/api/system-server-setting";

interface Props { visible: boolean; serverId: number; filterSettingId: number; }
const props = defineProps<Props>();
const emit = defineEmits<{ "update:visible": [boolean]; success: [] }>();
const visibleInner = ref(false);
const loading = ref(false);
const rules = ref<AddressRateLimitRule[]>([]);

watch(() => props.visible, async (v) => { visibleInner.value = v; if (v) await loadData(); }, { immediate: true });
watch(visibleInner, (v) => emit("update:visible", v));

async function loadData() {
  rules.value = [];
  try {
    const res = await getAddressRateLimitRules(props.serverId, props.filterSettingId);
    if (res.success && Array.isArray(res.data)) rules.value = res.data;
  } catch { /* ignore */ }
}
function addRule() {
  rules.value.push({ addressRateLimitType: "RATE_LIMIT", addressRateLimitAddress: "", addressRateLimitQps: 100, addressRateLimitEnabled: true });
}
async function handleSave() {
  loading.value = true;
  try {
    const res = await saveAddressRateLimitRules(props.serverId, props.filterSettingId, rules.value);
    if (res.success) { message("保存成功，已热应用", { type: "success" }); emit("success"); visibleInner.value = false; }
    else { message(res.msg || "保存失败", { type: "error" }); }
  } finally { loading.value = false; }
}
function handleClose() { visibleInner.value = false; }
</script>

<style scoped lang="scss">
@use './filter-config-shared' as *;

.fc-container {
  max-height: 60vh; overflow: hidden; display: flex; flex-direction: column;
}
.fc-tips {
  display: flex; align-items: center; gap: 8px; padding: 12px 16px; margin-bottom: 16px;
  border-radius: $fc-radius-sm; background: $fc-primary-light; border: 1px solid rgba(59,130,246,0.12);
  color: $fc-hint; font-size: 13px;
}
.fc-table-header {
  display: flex; align-items: center; padding: 10px 16px;
  background: $fc-surface-alt; border-radius: $fc-radius-xs; font-size: 13px; font-weight: 600; color: $fc-body; margin-bottom: 12px;
}
.fc-list { flex: 1; overflow-y: auto; max-height: 320px; padding-right: 4px; }
.fc-row {
  display: flex; align-items: center; padding: 14px 16px; margin-bottom: 10px;
  background: $fc-surface; border: 1px solid $fc-border; border-radius: $fc-radius-sm;
  transition: all 0.2s ease;
  &:hover { border-color: $fc-primary; box-shadow: $fc-shadow-blue; }
}
.th-type { width: 140px; flex-shrink: 0; }
.th-addr { flex: 1; margin: 0 12px; min-width: 180px; }
.th-qps { width: 130px; flex-shrink: 0; }
.th-status { width: 80px; flex-shrink: 0; margin: 0 12px; display: flex; justify-content: center; }
.th-action { width: 50px; flex-shrink: 0; text-align: center; }
.fc-option { display: flex; align-items: center; gap: 6px; }
.fc-empty {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: 40px 20px; color: $fc-muted; font-size: 14px; gap: 12px;
  .iconify { font-size: 40px; color: #c0c4cc; }
}
.fc-add-bar { margin-top: 16px; padding-top: 16px; border-top: 1px dashed $fc-border; }
.fc-footer { display: flex; justify-content: flex-end; gap: 12px; }

@include mobile {
  .fc-row { flex-wrap: wrap; gap: 8px; }
  .th-type, .th-addr, .th-qps { width: 100%; margin: 0; }
  .th-status { width: auto; }
}
</style>
