<template>
  <sc-dialog
    v-model="visibleInner"
    title="请求指纹配置"
    width="900px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <div class="fingerprint-config-container thin-scrollbar">
      <!-- 基础配置 -->
      <div class="fc-section">
        <h4 class="fc-section-title">
          <IconifyIconOnline icon="ri:fingerprint-line" />
          基础配置
        </h4>
        <div class="fc-grid">
          <ScFormItem label="启用状态">
            <ScSwitch v-model="config.enabled" />
          </ScFormItem>
          <ScFormItem label="响应头名称">
            <ScInput v-model="config.headerName" placeholder="X-Request-Fingerprint" style="width: 200px" />
          </ScFormItem>
        </div>
      </div>

      <!-- 指纹算法配置 -->
      <div class="fc-section">
        <h4 class="fc-section-title">
          <IconifyIconOnline icon="ri:shield-keyhole-line" />
          指纹算法
        </h4>
        <div class="fc-grid">
          <ScFormItem label="摘要算法">
            <ScSelect v-model="config.algorithm" style="width: 150px">
              <ScOption label="SHA-256" value="SHA-256" />
              <ScOption label="SHA-1" value="SHA-1" />
              <ScOption label="MD5" value="MD5" />
              <ScOption label="SHA-512" value="SHA-512" />
            </ScSelect>
          </ScFormItem>
          <ScFormItem label="盐值">
            <ScInput v-model="config.salt" placeholder="可选的盐值" style="width: 200px" />
          </ScFormItem>
        </div>
      </div>

      <!-- 指纹内容配置 -->
      <div class="fc-section">
        <h4 class="fc-section-title">
          <IconifyIconOnline icon="ri:file-text-line" />
          指纹内容
        </h4>
        <div class="fc-content-options">
          <ScFormItem label="包含HTTP方法">
            <ScSwitch v-model="config.includeMethod" />
          </ScFormItem>
          <ScFormItem label="包含请求路径">
            <ScSwitch v-model="config.includePath" />
          </ScFormItem>
          <ScFormItem label="包含请求参数">
            <ScSwitch v-model="config.includeParams" />
          </ScFormItem>
          <ScFormItem label="包含请求体">
            <ScSwitch v-model="config.includeBody" />
            <ScText type="warning" size="small">注意：包含请求体会增加计算开销</ScText>
          </ScFormItem>
        </div>

        <!-- 请求头配置 -->
        <div class="fc-headers-config">
          <h5>参与指纹的请求头</h5>
          <div class="fc-tags">
            <ScTag v-for="header in config.includeHeaders" :key="header" closable type="info" @close="removeHeader(header)">
              {{ header }}
            </ScTag>
          </div>
          <div class="fc-inline-add">
            <ScInput v-model="newHeader" placeholder="输入请求头名称" style="width: 200px" @keyup.enter="addHeader" />
            <ScButton type="primary" @click="addHeader">
              <IconifyIconOnline icon="ri:add-line" /> 添加
            </ScButton>
          </div>
          <ScText type="info" size="small">常用请求头：User-Agent, Content-Type, Authorization, X-Forwarded-For</ScText>
        </div>
      </div>

      <!-- 去重配置 -->
      <div class="fc-section">
        <h4 class="fc-section-title">
          <IconifyIconOnline icon="ri:repeat-line" />
          去重配置
        </h4>
        <div class="fc-grid">
          <ScFormItem label="有效期">
            <ScInputNumber v-model="validitySeconds" :min="0" :max="86400" style="width: 150px" />
            <span class="fc-unit-text">秒</span>
          </ScFormItem>
          <ScFormItem label="拦截重复请求">
            <ScSwitch v-model="config.rejectDuplicate" />
          </ScFormItem>
        </div>
        <div class="fc-validity-display">
          <ScTag type="info">当前配置: {{ formatValidityTime(validitySeconds) }}</ScTag>
          <ScText v-if="config.rejectDuplicate" type="warning" size="small">启用后，在有效期内的重复请求将被拒绝（HTTP 409）</ScText>
        </div>
      </div>

      <!-- 配置预览 -->
      <div class="fc-section">
        <h4 class="fc-section-title">
          <IconifyIconOnline icon="ri:eye-line" />
          配置预览
        </h4>
        <ScCard class="fc-preview thin-scrollbar">
          <div class="fc-preview-info">
            <p><strong>指纹算法：</strong>{{ config.algorithm }}</p>
            <p><strong>响应头：</strong>{{ config.headerName }}</p>
            <p><strong>包含内容：</strong>{{ getIncludeContentText() }}</p>
            <p><strong>去重策略：</strong>{{ getDuplicateStrategyText() }}</p>
          </div>
          <ScDivider />
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
import { ref, reactive, watch, computed } from "vue";
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
import { ScSwitch } from "@repo/components/ScSwitch/index.vue";
import { ScTag } from "@repo/components/ScTag";
import { ScText } from "@repo/components/ScText";

interface Props { visible: boolean; serverId: number; filterSettingId: number; }
const props = defineProps<Props>();
const emit = defineEmits<{ "update:visible": [boolean]; success: [] }>();

const visibleInner = ref(false);
const loading = ref(false);
const newHeader = ref("");

const config = reactive({
  enabled: false, headerName: "X-Request-Fingerprint", algorithm: "SHA-256", salt: "",
  includeMethod: true, includePath: true, includeParams: true, includeHeaders: [] as string[],
  includeBody: false, validityMs: 60000, rejectDuplicate: false,
});

const validitySeconds = computed({
  get: () => Math.floor(config.validityMs / 1000),
  set: (value: number) => { config.validityMs = value * 1000; },
});

watch(() => props.visible, async (v) => { visibleInner.value = v; if (v) await loadData(); }, { immediate: true });
watch(visibleInner, (v) => emit("update:visible", v));

async function loadData() {
  try {
    const res = await getServletFilterConfig(props.filterSettingId);
    if (res.success && res.data) {
      Object.assign(config, {
        enabled: res.data.enabled ?? false, headerName: res.data.headerName ?? "X-Request-Fingerprint",
        algorithm: res.data.algorithm ?? "SHA-256", salt: res.data.salt ?? "",
        includeMethod: res.data.includeMethod ?? true, includePath: res.data.includePath ?? true,
        includeParams: res.data.includeParams ?? true, includeHeaders: res.data.includeHeaders ?? [],
        includeBody: res.data.includeBody ?? false, validityMs: res.data.validityMs ?? 60000,
        rejectDuplicate: res.data.rejectDuplicate ?? false,
      });
    }
  } catch (e) { console.error("加载请求指纹配置失败:", e); }
}

async function handleSave() {
  loading.value = true;
  try {
    const res = await saveServletFilterConfig(props.filterSettingId, config as any);
    if (res.success) { message("请求指纹配置保存成功，已热应用", { type: "success" }); emit("success"); visibleInner.value = false; }
    else { message(res.msg || "保存失败", { type: "error" }); }
  } catch (error) { console.error("保存请求指纹配置失败:", error); message("保存失败", { type: "error" }); }
  finally { loading.value = false; }
}

function handleClose() { visibleInner.value = false; }

function addHeader() {
  if (newHeader.value.trim()) {
    const h = newHeader.value.trim();
    if (!config.includeHeaders.includes(h)) { config.includeHeaders.push(h); newHeader.value = ""; }
    else { message("请求头已存在", { type: "warning" }); }
  }
}
function removeHeader(header: string) { const idx = config.includeHeaders.indexOf(header); if (idx > -1) config.includeHeaders.splice(idx, 1); }

function formatValidityTime(seconds: number) {
  if (seconds === 0) return "不去重";
  if (seconds < 60) return `${seconds}秒`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}分钟`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}小时`;
  return `${Math.floor(seconds / 86400)}天`;
}

function getIncludeContentText() {
  const items: string[] = [];
  if (config.includeMethod) items.push("HTTP方法");
  if (config.includePath) items.push("请求路径");
  if (config.includeParams) items.push("请求参数");
  if (config.includeBody) items.push("请求体");
  if (config.includeHeaders.length > 0) items.push(`请求头(${config.includeHeaders.length}个)`);
  return items.length > 0 ? items.join("、") : "无";
}

function getDuplicateStrategyText() {
  if (validitySeconds.value === 0) return "不去重";
  const timeText = formatValidityTime(validitySeconds.value);
  const actionText = config.rejectDuplicate ? "拦截重复请求" : "仅记录指纹";
  return `${timeText}内${actionText}`;
}
</script>

<style scoped lang="scss">
@use './filter-config-shared' as *;

.fingerprint-config-container { max-height: 70vh; overflow-y: auto; padding: 4px; }

.fc-section {
  @include config-section;
  margin-bottom: 20px;
}

.fc-section-title { @include section-title; margin-bottom: 20px; }

.fc-grid {
  @include config-grid;
  margin-bottom: 16px;
}

.fc-content-options {
  display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px; margin-bottom: 20px; padding: 16px;
  background: $fc-surface-alt; border-radius: $fc-radius-sm;
}

.fc-headers-config {
  margin-top: 16px; padding: 16px;
  background: $fc-surface-alt; border-radius: $fc-radius-sm;
  h5 { margin: 0 0 12px; font-size: 14px; font-weight: 600; color: $fc-title; }
}

.fc-tags { @include tag-container; }

.fc-inline-add { @include inline-add; margin-bottom: 8px; }

.fc-unit-text { margin-left: 8px; color: $fc-muted; font-size: 14px; }

.fc-validity-display {
  margin-top: 12px; padding: 10px 14px;
  background: $fc-primary-light; border-radius: $fc-radius-xs;
  border-left: 3px solid $fc-primary; display: flex; flex-direction: column; gap: 8px;
}

.fc-preview {
  max-height: 200px; overflow-y: auto; border-radius: $fc-radius-xs;
}

.fc-preview-info {
  margin-bottom: 12px; padding: 12px;
  background: $fc-surface-alt; border-radius: $fc-radius-xs;
  p { margin: 6px 0; font-size: 13px; color: $fc-body; }
}

.fc-preview pre {
  margin: 0; padding: 16px; font-size: 12px; line-height: 1.6; color: #abb2bf;
  font-family: "Consolas", "Monaco", monospace; background: #282c34; border-radius: $fc-radius-xs;
}

.fc-footer { @include action-row; }

@include mobile {
  .fc-grid, .fc-content-options { grid-template-columns: 1fr; }
}
</style>
