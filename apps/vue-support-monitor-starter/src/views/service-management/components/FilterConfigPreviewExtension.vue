<template>
  <el-dialog
    v-model="visibleInner"
    title="预览扩展名配置"
    width="700px"
    :close-on-click-modal="false"
    @closed="handleClose"
  >
    <div class="preview-extension-config" v-loading="loading">
      <!-- 模式切换 -->
      <el-card class="config-card" shadow="never">
        <template #header>
          <div class="card-header">
            <span class="title">预览模式</span>
            <el-tag
              :type="config.whitelistMode ? 'warning' : 'info'"
              effect="dark"
            >
              {{ config.whitelistMode ? "白名单模式" : "黑名单模式" }}
            </el-tag>
          </div>
        </template>
        <div class="mode-selector">
          <el-radio-group v-model="config.whitelistMode" @change="onModeChange">
            <el-radio-button :value="false">
              <IconifyIconOnline icon="ri:forbid-line" />
              <span>黑名单模式</span>
            </el-radio-button>
            <el-radio-button :value="true">
              <IconifyIconOnline icon="ri:check-line" />
              <span>白名单模式</span>
            </el-radio-button>
          </el-radio-group>
          <div class="mode-description">
            <template v-if="config.whitelistMode">
              <IconifyIconOnline icon="ri:information-line" class="info-icon" />
              <span>只有在白名单中的扩展名才能预览</span>
            </template>
            <template v-else>
              <IconifyIconOnline icon="ri:information-line" class="info-icon" />
              <span>除黑名单中的扩展名外，其他都能预览</span>
            </template>
          </div>
        </div>
      </el-card>

      <!-- 黑名单配置 -->
      <el-card
        class="config-card"
        shadow="never"
        v-show="!config.whitelistMode"
      >
        <template #header>
          <div class="card-header">
            <span class="title">
              <IconifyIconOnline
                icon="ri:forbid-line"
                class="header-icon danger"
              />
              禁用预览的扩展名（黑名单）
            </span>
            <span class="count">{{ config.disabledExtensions.length }} 项</span>
          </div>
        </template>
        <div class="extension-list">
          <div class="add-section">
            <el-input
              v-model="newDisabledExt"
              placeholder="输入扩展名，如: exe"
              clearable
              @keyup.enter="addDisabledExtension"
            >
              <template #prepend>.</template>
              <template #append>
                <el-button
                  @click="addDisabledExtension"
                  :disabled="!newDisabledExt.trim()"
                >
                  <IconifyIconOnline icon="ri:add-line" />
                </el-button>
              </template>
            </el-input>
          </div>
          <div class="tags-container">
            <el-tag
              v-for="ext in config.disabledExtensions"
              :key="ext"
              closable
              type="danger"
              effect="light"
              @close="removeDisabledExtension(ext)"
            >
              .{{ ext }}
            </el-tag>
            <el-empty
              v-if="config.disabledExtensions.length === 0"
              description="暂无禁用的扩展名"
              :image-size="60"
            />
          </div>
          <div class="quick-add">
            <span class="label">快速添加：</span>
            <el-button
              size="small"
              @click="addQuickDisabled('exe,dll,bat,cmd,sh')"
              >可执行文件</el-button
            >
            <el-button
              size="small"
              @click="addQuickDisabled('zip,rar,7z,tar,gz')"
              >压缩包</el-button
            >
            <el-button size="small" @click="addQuickDisabled('db,sql,bak')"
              >数据库文件</el-button
            >
          </div>
        </div>
      </el-card>

      <!-- 白名单配置 -->
      <el-card class="config-card" shadow="never" v-show="config.whitelistMode">
        <template #header>
          <div class="card-header">
            <span class="title">
              <IconifyIconOnline
                icon="ri:check-line"
                class="header-icon success"
              />
              允许预览的扩展名（白名单）
            </span>
            <span class="count">{{ config.allowedExtensions.length }} 项</span>
          </div>
        </template>
        <div class="extension-list">
          <div class="add-section">
            <el-input
              v-model="newAllowedExt"
              placeholder="输入扩展名，如: pdf"
              clearable
              @keyup.enter="addAllowedExtension"
            >
              <template #prepend>.</template>
              <template #append>
                <el-button
                  @click="addAllowedExtension"
                  :disabled="!newAllowedExt.trim()"
                >
                  <IconifyIconOnline icon="ri:add-line" />
                </el-button>
              </template>
            </el-input>
          </div>
          <div class="tags-container">
            <el-tag
              v-for="ext in config.allowedExtensions"
              :key="ext"
              closable
              type="success"
              effect="light"
              @close="removeAllowedExtension(ext)"
            >
              .{{ ext }}
            </el-tag>
            <el-empty
              v-if="config.allowedExtensions.length === 0"
              description="暂无允许的扩展名"
              :image-size="60"
            />
          </div>
          <div class="quick-add">
            <span class="label">快速添加：</span>
            <el-button
              size="small"
              @click="addQuickAllowed('pdf,doc,docx,xls,xlsx,ppt,pptx')"
              >Office文档</el-button
            >
            <el-button
              size="small"
              @click="addQuickAllowed('jpg,jpeg,png,gif,bmp,webp,svg')"
              >图片</el-button
            >
            <el-button
              size="small"
              @click="addQuickAllowed('txt,md,json,xml,html,css,js')"
              >文本代码</el-button
            >
            <el-button size="small" @click="addQuickAllowed('mp4,mp3,wav,avi')"
              >音视频</el-button
            >
          </div>
        </div>
      </el-card>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="danger" @click="handleClear">清空配置</el-button>
        <el-button type="primary" @click="handleSave" :loading="saving"
          >保存</el-button
        >
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import {
  getPreviewExtensionConfig,
  savePreviewExtensionConfig,
  clearPreviewExtensionConfig,
  type PreviewExtensionConfig,
} from "@/api/system-server-setting";
import { message } from "@repo/utils";
import { ElMessageBox } from "element-plus";
import { computed, ref, watch } from "vue";

interface Props {
  visible: boolean;
  serverId: number;
  filterSettingId?: number;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  (e: "update:visible", value: boolean): void;
  (e: "success"): void;
}>();

const visibleInner = computed({
  get: () => props.visible,
  set: (val) => emit("update:visible", val),
});

const loading = ref(false);
const saving = ref(false);
const newDisabledExt = ref("");
const newAllowedExt = ref("");

const config = ref<PreviewExtensionConfig>({
  serverId: props.serverId,
  filterSettingId: props.filterSettingId,
  disabledExtensions: [],
  allowedExtensions: [],
  whitelistMode: false,
});

/**
 * 加载配置
 */
async function loadConfig() {
  if (!props.serverId) return;

  loading.value = true;
  try {
    const res = await getPreviewExtensionConfig(props.serverId);
    if (res.success && res.data) {
      config.value = {
        serverId: props.serverId,
        filterSettingId: props.filterSettingId,
        disabledExtensions: res.data.disabledExtensions || [],
        allowedExtensions: res.data.allowedExtensions || [],
        whitelistMode: res.data.whitelistMode || false,
      };
    }
  } catch (e) {
    // 接口可能未实现，使用默认值
    config.value = {
      serverId: props.serverId,
      filterSettingId: props.filterSettingId,
      disabledExtensions: [],
      allowedExtensions: [],
      whitelistMode: false,
    };
  } finally {
    loading.value = false;
  }
}

/**
 * 模式变更
 */
function onModeChange() {
  message(
    config.value.whitelistMode ? "已切换到白名单模式" : "已切换到黑名单模式"
  , { type: "info" });
}

/**
 * 添加禁用的扩展名
 */
function addDisabledExtension() {
  const ext = newDisabledExt.value.trim().toLowerCase().replace(/^\./, "");
  if (!ext) return;

  if (config.value.disabledExtensions.includes(ext)) {
    message(`扩展名 .${ext} 已存在`, { type: "warning" });
    return;
  }

  config.value.disabledExtensions.push(ext);
  newDisabledExt.value = "";
}

/**
 * 移除禁用的扩展名
 */
function removeDisabledExtension(ext: string) {
  const idx = config.value.disabledExtensions.indexOf(ext);
  if (idx > -1) {
    config.value.disabledExtensions.splice(idx, 1);
  }
}

/**
 * 快速添加禁用扩展名
 */
function addQuickDisabled(extensions: string) {
  const list = extensions.split(",").map((e) => e.trim().toLowerCase());
  for (const ext of list) {
    if (ext && !config.value.disabledExtensions.includes(ext)) {
      config.value.disabledExtensions.push(ext);
    }
  }
}

/**
 * 添加允许的扩展名
 */
function addAllowedExtension() {
  const ext = newAllowedExt.value.trim().toLowerCase().replace(/^\./, "");
  if (!ext) return;

  if (config.value.allowedExtensions.includes(ext)) {
    message(`扩展名 .${ext} 已存在`, { type: "warning" });
    return;
  }

  config.value.allowedExtensions.push(ext);
  newAllowedExt.value = "";
}

/**
 * 移除允许的扩展名
 */
function removeAllowedExtension(ext: string) {
  const idx = config.value.allowedExtensions.indexOf(ext);
  if (idx > -1) {
    config.value.allowedExtensions.splice(idx, 1);
  }
}

/**
 * 快速添加允许扩展名
 */
function addQuickAllowed(extensions: string) {
  const list = extensions.split(",").map((e) => e.trim().toLowerCase());
  for (const ext of list) {
    if (ext && !config.value.allowedExtensions.includes(ext)) {
      config.value.allowedExtensions.push(ext);
    }
  }
}

/**
 * 保存配置
 */
async function handleSave() {
  saving.value = true;
  try {
    const res = await savePreviewExtensionConfig(config.value);
    if (res.success) {
      message("保存成功", { type: "success" });
      emit("success");
      visibleInner.value = false;
    } else {
      message(res.msg || "保存失败", { type: "error" });
    }
  } catch (e) {
    message("保存失败，请稍后重试", { type: "error" });
  } finally {
    saving.value = false;
  }
}

/**
 * 清空配置
 */
async function handleClear() {
  try {
    await ElMessageBox.confirm("确定要清空所有扩展名配置吗？", "确认", {
      type: "warning",
    });

    config.value.disabledExtensions = [];
    config.value.allowedExtensions = [];
    config.value.whitelistMode = false;

    // 同步到后端
    await clearPreviewExtensionConfig(props.serverId);
    message("配置已清空", { type: "success" });
  } catch {
    // 用户取消
  }
}

function handleClose() {
  visibleInner.value = false;
}

watch(
  () => props.visible,
  (val) => {
    if (val) {
      loadConfig();
    }
  },
  { immediate: true }
);
</script>

<style scoped>
.preview-extension-config {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.config-card {
  border-radius: 12px;
  border: 1px solid #e5e7eb;
}

.config-card :deep(.el-card__header) {
  padding: 14px 20px;
  background: #f8fafc;
  border-radius: 12px 12px 0 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header .title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #1e293b;
}

.card-header .header-icon {
  font-size: 18px;
}

.card-header .header-icon.danger {
  color: #ef4444;
}

.card-header .header-icon.success {
  color: #22c55e;
}

.card-header .count {
  font-size: 12px;
  color: #94a3b8;
}

.mode-selector {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.mode-selector :deep(.el-radio-button__inner) {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 20px;
}

.mode-description {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #64748b;
  padding: 10px 14px;
  background: #f1f5f9;
  border-radius: 8px;
}

.mode-description .info-icon {
  color: #3b82f6;
}

.extension-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.add-section :deep(.el-input-group__prepend) {
  padding: 0 12px;
  font-weight: 600;
  color: #64748b;
}

.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  min-height: 60px;
  padding: 12px;
  background: #f8fafc;
  border-radius: 8px;
}

.tags-container :deep(.el-tag) {
  font-size: 13px;
  padding: 6px 12px;
  border-radius: 6px;
}

.quick-add {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.quick-add .label {
  font-size: 13px;
  color: #64748b;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
