<template>
  <el-dialog
    v-model="visibleInner"
    title="请求指纹配置"
    width="900px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <div class="fingerprint-config-container thin-scrollbar">
      <!-- 基础配置 -->
      <div class="config-section">
        <h4 class="section-title">
          <IconifyIconOnline icon="ri:fingerprint-line" />
          基础配置
        </h4>
        <div class="config-grid">
          <el-form-item label="启用状�?>
            <el-switch v-model="config.enabled" />
          </el-form-item>
          <el-form-item label="响应头名�?>
            <el-input
              v-model="config.headerName"
              placeholder="X-Request-Fingerprint"
              style="width: 200px"
            />
          </el-form-item>
        </div>
      </div>

      <!-- 指纹算法配置 -->
      <div class="config-section">
        <h4 class="section-title">
          <IconifyIconOnline icon="ri:shield-keyhole-line" />
          指纹算法
        </h4>
        <div class="config-grid">
          <el-form-item label="摘要算法">
            <el-select v-model="config.algorithm" style="width: 150px">
              <el-option label="SHA-256" value="SHA-256" />
              <el-option label="SHA-1" value="SHA-1" />
              <el-option label="MD5" value="MD5" />
              <el-option label="SHA-512" value="SHA-512" />
            </el-select>
          </el-form-item>
          <el-form-item label="盐�?>
            <el-input
              v-model="config.salt"
              placeholder="可选的盐�?
              style="width: 200px"
            />
          </el-form-item>
        </div>
      </div>

      <!-- 指纹内容配置 -->
      <div class="config-section">
        <h4 class="section-title">
          <IconifyIconOnline icon="ri:file-text-line" />
          指纹内容
        </h4>
        <div class="content-options">
          <el-form-item label="包含HTTP方法">
            <el-switch v-model="config.includeMethod" />
          </el-form-item>
          <el-form-item label="包含请求路径">
            <el-switch v-model="config.includePath" />
          </el-form-item>
          <el-form-item label="包含请求参数">
            <el-switch v-model="config.includeParams" />
          </el-form-item>
          <el-form-item label="包含请求�?>
            <el-switch v-model="config.includeBody" />
            <el-text type="warning" size="small">
              注意：包含请求体会增加计算开销
            </el-text>
          </el-form-item>
        </div>

        <!-- 请求头配�?-->
        <div class="headers-config">
          <h5>参与指纹的请求头</h5>
          <div class="header-tags">
            <el-tag
              v-for="header in config.includeHeaders"
              :key="header"
              closable
              @close="removeHeader(header)"
              type="info"
            >
              {{ header }}
            </el-tag>
          </div>
          <div class="add-header">
            <el-input
              v-model="newHeader"
              placeholder="输入请求头名�?
              style="width: 200px"
              @keyup.enter="addHeader"
            />
            <el-button type="primary" @click="addHeader">
              <IconifyIconOnline icon="ri:add-line" />
              添加
            </el-button>
          </div>
          <el-text type="info" size="small">
            常用请求头：User-Agent, Content-Type, Authorization, X-Forwarded-For
          </el-text>
        </div>
      </div>

      <!-- 去重配置 -->
      <div class="config-section">
        <h4 class="section-title">
          <IconifyIconOnline icon="ri:repeat-line" />
          去重配置
        </h4>
        <div class="config-grid">
          <el-form-item label="有效�?>
            <el-input-number
              v-model="validitySeconds"
              :min="0"
              :max="86400"
              style="width: 150px"
            />
            <span class="unit-text">�?/span>
          </el-form-item>
          <el-form-item label="拦截重复请求">
            <el-switch v-model="config.rejectDuplicate" />
          </el-form-item>
        </div>
        <div class="validity-display">
          <el-tag type="info">
            当前配置: {{ formatValidityTime(validitySeconds) }}
          </el-tag>
          <el-text v-if="config.rejectDuplicate" type="warning" size="small">
            启用后，在有效期内的重复请求将被拒绝（HTTP 409�?
          </el-text>
        </div>
      </div>

      <!-- 配置预览 -->
      <div class="config-section">
        <h4 class="section-title">
          <IconifyIconOnline icon="ri:eye-line" />
          配置预览
        </h4>
        <el-card class="config-preview thin-scrollbar">
          <div class="preview-info">
            <p><strong>指纹算法�?/strong>{{ config.algorithm }}</p>
            <p><strong>响应头：</strong>{{ config.headerName }}</p>
            <p><strong>包含内容�?/strong>{{ getIncludeContentText() }}</p>
            <p><strong>去重策略�?/strong>{{ getDuplicateStrategyText() }}</p>
          </div>
          <el-divider />
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
import { ref, reactive, watch, computed } from "vue";
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
const newHeader = ref("");

// 请求指纹配置对象
const config = reactive({
  enabled: false,
  headerName: "X-Request-Fingerprint",
  algorithm: "SHA-256",
  salt: "",
  includeMethod: true,
  includePath: true,
  includeParams: true,
  includeHeaders: [] as string[],
  includeBody: false,
  validityMs: 60000,
  rejectDuplicate: false,
});

// 有效期（秒）
const validitySeconds = computed({
  get: () => Math.floor(config.validityMs / 1000),
  set: (value: number) => {
    config.validityMs = value * 1000;
  },
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
        enabled: res.data.enabled ?? false,
        headerName: res.data.headerName ?? "X-Request-Fingerprint",
        algorithm: res.data.algorithm ?? "SHA-256",
        salt: res.data.salt ?? "",
        includeMethod: res.data.includeMethod ?? true,
        includePath: res.data.includePath ?? true,
        includeParams: res.data.includeParams ?? true,
        includeHeaders: res.data.includeHeaders ?? [],
        includeBody: res.data.includeBody ?? false,
        validityMs: res.data.validityMs ?? 60000,
        rejectDuplicate: res.data.rejectDuplicate ?? false,
      });
    } else {
      // 使用默认配置
      Object.assign(config, {
        enabled: false,
        headerName: "X-Request-Fingerprint",
        algorithm: "SHA-256",
        salt: "",
        includeMethod: true,
        includePath: true,
        includeParams: true,
        includeHeaders: [],
        includeBody: false,
        validityMs: 60000,
        rejectDuplicate: false,
      });
    }
  } catch (e) {
    console.error("加载请求指纹配置失败:", e);
    // 使用默认配置
    Object.assign(config, {
      enabled: false,
      headerName: "X-Request-Fingerprint",
      algorithm: "SHA-256",
      salt: "",
      includeMethod: true,
      includePath: true,
      includeParams: true,
      includeHeaders: [],
      includeBody: false,
      validityMs: 60000,
      rejectDuplicate: false,
    });
  }
}

// 保存配置
async function handleSave() {
  loading.value = true;
  try {
    const res = await saveServletFilterConfig(
      props.filterSettingId,
      config as any
    );
    if (res.success) {
      ElMessage.success("请求指纹配置保存成功，已热应�?);
      emit("success");
      visibleInner.value = false;
    } else {
      ElMessage.error(res.msg || "保存失败");
    }
  } catch (error) {
    console.error("保存请求指纹配置失败:", error);
    ElMessage.error("保存失败");
  } finally {
    loading.value = false;
  }
}

// 关闭对话�?
function handleClose() {
  visibleInner.value = false;
}

// 添加请求�?
function addHeader() {
  if (newHeader.value.trim()) {
    const headerName = newHeader.value.trim();
    if (!config.includeHeaders.includes(headerName)) {
      config.includeHeaders.push(headerName);
      newHeader.value = "";
    } else {
      ElMessage.warning("请求头已存在");
    }
  }
}

// 移除请求�?
function removeHeader(header: string) {
  const index = config.includeHeaders.indexOf(header);
  if (index > -1) {
    config.includeHeaders.splice(index, 1);
  }
}

// 格式化有效期时间
function formatValidityTime(seconds: number) {
  if (seconds === 0) return "不去�?;
  if (seconds < 60) return `${seconds}秒`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}分钟`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}小时`;
  return `${Math.floor(seconds / 86400)}天`;
}

// 获取包含内容文本
function getIncludeContentText() {
  const items = [] as string[];
  if (config.includeMethod) items.push("HTTP方法");
  if (config.includePath) items.push("请求路径");
  if (config.includeParams) items.push("请求参数");
  if (config.includeBody) items.push("请求�?);
  if (config.includeHeaders.length > 0) {
    items.push(`请求�?${config.includeHeaders.length}�?`);
  }
  return items.length > 0 ? items.join("�?) : "�?;
}

// 获取去重策略文本
function getDuplicateStrategyText() {
  if (validitySeconds.value === 0) return "不去�?;
  const timeText = formatValidityTime(validitySeconds.value);
  const actionText = config.rejectDuplicate ? "拦截重复请求" : "仅记录指�?;
  return `${timeText}�?{actionText}`;
}
</script>

<style scoped>
.fingerprint-config-container {
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

.content-options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
  margin-bottom: 20px;
}

.headers-config {
  margin-top: 16px;
}

.headers-config h5 {
  margin: 0 0 8px 0;
  font-size: 14px;
  font-weight: 600;
  color: #606266;
}

.header-tags {
  margin-bottom: 12px;
  min-height: 32px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.add-header {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 8px;
}

.unit-text {
  margin-left: 8px;
   color: var(--el-text-color-primary);
  font-size: 14px;
}

.validity-display {
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.config-preview {
  max-height: 300px;
  overflow-y: auto;
}

.preview-info {
  margin-bottom: 12px;
}

.preview-info p {
  margin: 4px 0;
  font-size: 14px;
  color: #606266;
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
