<template>
  <sc-dialog
    v-model="visibleInner"
    title="动态表达式过滤器配置"
    width="980px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <div class="dynamic-config-container thin-scrollbar">
      <!-- 基础配置 -->
      <div class="config-section">
        <h4 class="section-title">
          <IconifyIconOnline icon="ri:settings-3-line" />
          基础配置
        </h4>
        <div class="config-grid">
          <el-form-item label="启用状态">
            <el-switch v-model="config.enabled" />
          </el-form-item>
          <el-form-item label="表达式类型">
            <el-select v-model="config.type" style="width: 180px">
              <el-option label="Java" value="java" />
              <el-option label="Groovy" value="groovy" />
              <el-option label="JavaScript" value="js" />
            </el-select>
          </el-form-item>
          <el-form-item label="指纹(可选)">
            <el-input
              v-model="config.fingerprint"
              placeholder="用于热重载比对的标识，可留空自动生成"
            />
          </el-form-item>
        </div>
      </div>

      <!-- 源码编辑器 -->
      <div class="config-section">
        <h4 class="section-title">
          <IconifyIconOnline icon="ri:code-s-slash-line" />
          源码
        </h4>
        <div class="editor-wrapper">
          <CodeEditor
            v-model:content="config.source"
            :showTool="true"
            :height="'420px'"
            :options="{ mode: editorMode }"
            :placeholder="placeholderText"
          />
        </div>
        <div class="tips">
          <el-text type="info" size="small">
            要求实现 ServletFilter
            接口（或可适配），保存后会热重载到运行中的服务器。
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
          <pre>{{ JSON.stringify(previewConfig, null, 2) }}</pre>
        </el-card>
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
import { ref, reactive, watch, computed } from "vue";
import { message } from "@repo/utils";
import CodeEditor from "@/components/codeEditor/index.vue";
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
const emit = defineEmits<{ "update:visible": [boolean]; success: [] }>();

const visibleInner = ref(false);
const loading = ref(false);

const config = reactive({
  enabled: false,
  type: "java" as "java" | "groovy" | "js" | string,
  source: "",
  fingerprint: "",
});

const editorMode = computed(() => {
  const t = (config.type || "").toLowerCase();
  if (t === "java" || t === "groovy") return "text/x-java";
  if (t === "js" || t === "javascript") return "javascript";
  return "text/plain";
});

const placeholderText = computed(() => {
  if (config.type === "java") {
    return "示例：\npublic class MyFilter implements com.chua.common.support.protocol.filter.ServletFilter {\n  @Override\n  public void doFilter(com.chua.common.support.protocol.request.ServletRequest request, com.chua.common.support.protocol.request.ServletResponse response, com.chua.common.support.protocol.server.ServletFilterChain chain) throws Exception {\n    // TODO\n    chain.doFilter(request, response);\n  }\n}";
  }
  if (config.type === "groovy") {
    return "// Groovy 示例\nclass MyFilter implements com.chua.common.support.protocol.filter.ServletFilter {\n  void doFilter(request, response, chain) {\n    chain.doFilter(request, response)\n  }\n}";
  }
  if (config.type === "js") {
    return "// JS 示例（需适配器支持）\nfunction doFilter(request, response, chain) {\n  chain.doFilter(request, response)\n}";
  }
  return "在此粘贴或编写源码...";
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

const previewConfig = computed(() => ({
  enabled: config.enabled,
  type: config.type,
  fingerprint: config.fingerprint,
}));

async function loadData() {
  try {
    const res = await getServletFilterConfig(props.filterSettingId);
    if (res.success && res.data) {
      config.enabled = !!res.data.enabled;
      config.type = res.data.type || "java";
      config.source = res.data.source || "";
      config.fingerprint = res.data.fingerprint || "";
    }
  } catch (e) {
    // ignore
  }
}

async function handleSave() {
  if (!config.source || !config.source.trim()) {
    message("请填写源码", { type: "warning" });
    return;
  }
  loading.value = true;
  try {
    const res = await saveServletFilterConfig(props.filterSettingId, {
      enabled: config.enabled,
      type: config.type,
      source: config.source,
      fingerprint: config.fingerprint || undefined,
    });
    if (res.success) {
      message("动态表达式配置已保存并热应用", { type: "success" });
      emit("success");
      visibleInner.value = false;
    } else {
      message(res.msg || "保存失败", { type: "error" });
    }
  } catch (e) {
    message("保存失败", { type: "error" });
  } finally {
    loading.value = false;
  }
}

function handleClose() {
  visibleInner.value = false;
}
</script>

<style scoped>
.dynamic-config-container {
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

.editor-wrapper {
  border: 1px solid #e4e7ed;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.05);
}

.tips {
  margin-top: 12px;
  padding: 10px 14px;
  background: linear-gradient(145deg, #fef0f0 0%, #fff5f5 100%);
  border-radius: 8px;
  border-left: 3px solid #f56c6c;
}

.tips :deep(.el-text) {
  color: #f56c6c;
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
</style>
