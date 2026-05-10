<template>
  <sc-dialog
    v-model="visibleInner"
    title="预览扩展名配置"
    width="700px"
    :close-on-click-modal="false"
    @closed="handleClose"
  >
    <div v-loading="loading" class="preview-extension-config">
      <!-- 模式切换 -->
      <ScCard class="fc-card" shadow="never">
        <template #header>
          <div class="fc-card-header">
            <span class="fc-card-title">预览模式</span>
            <ScTag :type="config.whitelistMode ? 'warning' : 'info'" effect="dark">
              {{ config.whitelistMode ? "白名单模式" : "黑名单模式" }}
            </ScTag>
          </div>
        </template>
        <div class="fc-mode-selector">
          <ScRadioGroup v-model="config.whitelistMode" @change="onModeChange">
            <ScRadio :value="false">
              <IconifyIconOnline icon="ri:forbid-line" />
              <span>黑名单模式</span>
            </ScRadio>
            <ScRadio :value="true">
              <IconifyIconOnline icon="ri:check-line" />
              <span>白名单模式</span>
            </ScRadio>
          </ScRadioGroup>
          <div class="fc-mode-desc">
            <template v-if="config.whitelistMode">
              <IconifyIconOnline icon="ri:information-line" />
              <span>只有在白名单中的扩展名才能预览</span>
            </template>
            <template v-else>
              <IconifyIconOnline icon="ri:information-line" />
              <span>除黑名单中的扩展名外，其他都能预览</span>
            </template>
          </div>
        </div>
      </ScCard>

      <!-- 黑名单配置 -->
      <ScCard class="fc-card" shadow="never" v-show="!config.whitelistMode">
        <template #header>
          <div class="fc-card-header">
            <span class="fc-card-title">
              <IconifyIconOnline icon="ri:forbid-line" class="fc-icon-danger" />
              禁用预览的扩展名（黑名单）
            </span>
            <span class="fc-card-count">{{ config.disabledExtensions.length }} 项</span>
          </div>
        </template>
        <div class="fc-ext-list">
          <div class="fc-add-section">
            <ScInput v-model="newDisabledExt" placeholder="输入扩展名，如: exe" clearable @keyup.enter="addDisabledExtension">
              <template #prefix>.</template>
              <template #suffix>
                <ScButton @click="addDisabledExtension" :disabled="!newDisabledExt.trim()" size="small">
                  <IconifyIconOnline icon="ri:add-line" />
                </ScButton>
              </template>
            </ScInput>
          </div>
          <div class="fc-tags">
            <ScTag v-for="ext in config.disabledExtensions" :key="ext" closable type="danger" @close="removeDisabledExtension(ext)">
              .{{ ext }}
            </ScTag>
            <ScEmpty v-if="config.disabledExtensions.length === 0" description="暂无禁用的扩展名" :image-size="60" />
          </div>
          <div class="fc-quick-add">
            <span class="fc-quick-label">快速添加：</span>
            <ScButton size="small" @click="addQuickDisabled('exe,dll,bat,cmd,sh')">可执行文件</ScButton>
            <ScButton size="small" @click="addQuickDisabled('zip,rar,7z,tar,gz')">压缩包</ScButton>
            <ScButton size="small" @click="addQuickDisabled('db,sql,bak')">数据库文件</ScButton>
          </div>
        </div>
      </ScCard>

      <!-- 白名单配置 -->
      <ScCard class="fc-card" shadow="never" v-show="config.whitelistMode">
        <template #header>
          <div class="fc-card-header">
            <span class="fc-card-title">
              <IconifyIconOnline icon="ri:check-line" class="fc-icon-success" />
              允许预览的扩展名（白名单）
            </span>
            <span class="fc-card-count">{{ config.allowedExtensions.length }} 项</span>
          </div>
        </template>
        <div class="fc-ext-list">
          <div class="fc-add-section">
            <ScInput v-model="newAllowedExt" placeholder="输入扩展名，如: pdf" clearable @keyup.enter="addAllowedExtension">
              <template #prefix>.</template>
              <template #suffix>
                <ScButton @click="addAllowedExtension" :disabled="!newAllowedExt.trim()" size="small">
                  <IconifyIconOnline icon="ri:add-line" />
                </ScButton>
              </template>
            </ScInput>
          </div>
          <div class="fc-tags">
            <ScTag v-for="ext in config.allowedExtensions" :key="ext" closable type="success" @close="removeAllowedExtension(ext)">
              .{{ ext }}
            </ScTag>
            <ScEmpty v-if="config.allowedExtensions.length === 0" description="暂无允许的扩展名" :image-size="60" />
          </div>
          <div class="fc-quick-add">
            <span class="fc-quick-label">快速添加：</span>
            <ScButton size="small" @click="addQuickAllowed('pdf,doc,docx,xls,xlsx,ppt,pptx')">Office文档</ScButton>
            <ScButton size="small" @click="addQuickAllowed('jpg,jpeg,png,gif,bmp,webp,svg')">图片</ScButton>
            <ScButton size="small" @click="addQuickAllowed('txt,md,json,xml,html,css,js')">文本代码</ScButton>
            <ScButton size="small" @click="addQuickAllowed('mp4,mp3,wav,avi')">音视频</ScButton>
          </div>
        </div>
      </ScCard>
    </div>

    <template #footer>
      <div class="fc-footer">
        <ScButton @click="handleClose">取消</ScButton>
        <ScButton type="danger" @click="handleClear">清空配置</ScButton>
        <ScButton type="primary" @click="handleSave" :loading="saving">保存</ScButton>
      </div>
    </template>
  </sc-dialog>
</template>

<script setup lang="ts">
import { getPreviewExtensionConfig, savePreviewExtensionConfig, clearPreviewExtensionConfig, type PreviewExtensionConfig } from "@/api/system-server-setting";
import { message } from "@repo/utils";
import { ElMessageBox } from "element-plus";
import { ref, watch } from "vue";
import { ScButton } from "@repo/components/ScButton";
import { ScCard } from "@repo/components/ScCard";
import { ScDialog } from "@repo/components/ScDialog";
import { ScEmpty } from "@repo/components/ScEmpty";
import { ScInput } from "@repo/components/ScInput";
import { ScTag } from "@repo/components/ScTag";

interface Props { visible: boolean; serverId: number; filterSettingId?: number; }
const props = defineProps<Props>();
const emit = defineEmits<{ "update:visible": [boolean]; success: [] }>();

const visibleInner = ref(false);
const loading = ref(false);
const saving = ref(false);
const newDisabledExt = ref("");
const newAllowedExt = ref("");

const config = ref<PreviewExtensionConfig>({
  serverId: props.serverId, filterSettingId: props.filterSettingId,
  disabledExtensions: [], allowedExtensions: [], whitelistMode: false,
});

async function loadConfig() {
  if (!props.serverId) return;
  loading.value = true;
  try {
    const res = await getPreviewExtensionConfig(props.serverId);
    if (res.success && res.data) {
      config.value = { serverId: props.serverId, filterSettingId: props.filterSettingId, disabledExtensions: res.data.disabledExtensions || [], allowedExtensions: res.data.allowedExtensions || [], whitelistMode: res.data.whitelistMode || false };
    }
  } catch {
    config.value = { serverId: props.serverId, filterSettingId: props.filterSettingId, disabledExtensions: [], allowedExtensions: [], whitelistMode: false };
  } finally { loading.value = false; }
}

function onModeChange() { message(config.value.whitelistMode ? "已切换到白名单模式" : "已切换到黑名单模式", { type: "info" }); }

function addDisabledExtension() {
  const ext = newDisabledExt.value.trim().toLowerCase().replace(/^\./, "");
  if (!ext) return;
  if (config.value.disabledExtensions.includes(ext)) { message(`扩展名 .${ext} 已存在`, { type: "warning" }); return; }
  config.value.disabledExtensions.push(ext);
  newDisabledExt.value = "";
}
function removeDisabledExtension(ext: string) { const idx = config.value.disabledExtensions.indexOf(ext); if (idx > -1) config.value.disabledExtensions.splice(idx, 1); }
function addQuickDisabled(extensions: string) { extensions.split(",").map(e => e.trim().toLowerCase()).forEach(ext => { if (ext && !config.value.disabledExtensions.includes(ext)) config.value.disabledExtensions.push(ext); }); }
function addAllowedExtension() {
  const ext = newAllowedExt.value.trim().toLowerCase().replace(/^\./, "");
  if (!ext) return;
  if (config.value.allowedExtensions.includes(ext)) { message(`扩展名 .${ext} 已存在`, { type: "warning" }); return; }
  config.value.allowedExtensions.push(ext);
  newAllowedExt.value = "";
}
function removeAllowedExtension(ext: string) { const idx = config.value.allowedExtensions.indexOf(ext); if (idx > -1) config.value.allowedExtensions.splice(idx, 1); }
function addQuickAllowed(extensions: string) { extensions.split(",").map(e => e.trim().toLowerCase()).forEach(ext => { if (ext && !config.value.allowedExtensions.includes(ext)) config.value.allowedExtensions.push(ext); }); }

async function handleSave() {
  saving.value = true;
  try {
    const res = await savePreviewExtensionConfig(config.value);
    if (res.success) { message("保存成功", { type: "success" }); emit("success"); visibleInner.value = false; }
    else { message(res.msg || "保存失败", { type: "error" }); }
  } catch { message("保存失败，请稍后重试", { type: "error" }); }
  finally { saving.value = false; }
}

async function handleClear() {
  try {
    await ElMessageBox.confirm("确定要清空所有扩展名配置吗？", "确认", { type: "warning" });
    config.value.disabledExtensions = []; config.value.allowedExtensions = []; config.value.whitelistMode = false;
    await clearPreviewExtensionConfig(props.serverId);
    message("配置已清空", { type: "success" });
  } catch { /* user cancelled */ }
}

function handleClose() { visibleInner.value = false; }

watch(() => props.visible, (val) => { if (val) { visibleInner.value = true; loadConfig(); } else { visibleInner.value = false; } }, { immediate: true });
</script>

<style scoped lang="scss">
@use './filter-config-shared' as *;

.preview-extension-config { display: flex; flex-direction: column; gap: 16px; }

.fc-card {
  border-radius: $fc-radius; border: 1px solid $fc-border;
}

.fc-card-header {
  display: flex; justify-content: space-between; align-items: center;
}

.fc-card-title {
  display: flex; align-items: center; gap: 8px; font-weight: 600; color: $fc-title;
}

.fc-icon-danger { font-size: 18px; color: $fc-danger; }
.fc-icon-success { font-size: 18px; color: $fc-success; }

.fc-card-count { font-size: 12px; color: $fc-muted; }

.fc-mode-selector { display: flex; flex-direction: column; gap: 12px; }

.fc-mode-desc {
  display: flex; align-items: center; gap: 6px; font-size: 13px; color: $fc-hint;
  padding: 10px 14px; background: $fc-surface-alt; border-radius: $fc-radius-xs;
}

.fc-ext-list { display: flex; flex-direction: column; gap: 16px; }

.fc-tags { @include tag-container; }

.fc-quick-add {
  display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
  .fc-quick-label { font-size: 13px; color: $fc-hint; }
}

.fc-footer { @include action-row; }
</style>
