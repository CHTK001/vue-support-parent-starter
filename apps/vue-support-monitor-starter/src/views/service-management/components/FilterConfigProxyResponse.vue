<template>
  <sc-dialog
    v-model="visibleInner"
    title="代理响应脚本配置"
    width="1000px"
    :close-on-click-modal="false"
    class="proxy-response-dialog"
    @close="handleClose"
  >
    <div class="proxy-config-container thin-scrollbar">
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
          <el-form-item label="脚本语言">
            <el-select v-model="config.language" style="width: 180px">
              <el-option label="Java" value="java" />
              <el-option label="Groovy" value="groovy" />
              <el-option label="Python" value="python" />
            </el-select>
          </el-form-item>
          <el-form-item label="执行阶段">
            <el-select v-model="config.phase" style="width: 180px">
              <el-option label="请求前" value="before" />
              <el-option label="请求后" value="after" />
              <el-option label="全部" value="both" />
            </el-select>
          </el-form-item>
          <el-form-item label="匹配路径">
            <el-input
              v-model="config.pathPattern"
              placeholder="留空匹配全部，如: /api/**"
              style="width: 200px"
            />
          </el-form-item>
        </div>
      </div>

      <!-- 请求前脚本 -->
      <div
        class="config-section"
        v-if="config.phase === 'before' || config.phase === 'both'"
      >
        <h4 class="section-title">
          <IconifyIconOnline icon="ri:arrow-right-circle-line" />
          请求前脚本
          <el-tag size="small" type="warning">Before Request</el-tag>
        </h4>
        <div class="editor-wrapper">
          <CodeEditor
            v-model:content="config.beforeScript"
            :showTool="true"
            :height="'280px'"
            :options="{ mode: editorMode }"
            :placeholder="beforePlaceholder"
          />
        </div>
        <div class="script-tips">
          <el-text type="info" size="small">
            可用变量：<code>request</code>（请求对象）、<code>headers</code>（请求头）、<code>params</code>（请求参数）、<code>body</code>（请求体）
          </el-text>
        </div>
      </div>

      <!-- 响应后脚本 -->
      <div
        class="config-section"
        v-if="config.phase === 'after' || config.phase === 'both'"
      >
        <h4 class="section-title">
          <IconifyIconOnline icon="ri:arrow-left-circle-line" />
          响应后脚本
          <el-tag size="small" type="success">After Response</el-tag>
        </h4>
        <div class="editor-wrapper">
          <CodeEditor
            v-model:content="config.afterScript"
            :showTool="true"
            :height="'280px'"
            :options="{ mode: editorMode }"
            :placeholder="afterPlaceholder"
          />
        </div>
        <div class="script-tips">
          <el-text type="info" size="small">
            可用变量：<code>request</code>（请求对象）、<code>response</code>（响应对象）、<code>body</code>（响应体）、<code>statusCode</code>（状态码）
          </el-text>
        </div>
      </div>

      <!-- 高级配置 -->
      <div class="config-section">
        <h4 class="section-title">
          <IconifyIconOnline icon="ri:tools-line" />
          高级配置
        </h4>
        <div class="config-grid">
          <el-form-item label="超时时间(ms)">
            <el-input-number
              v-model="config.timeout"
              :min="100"
              :max="60000"
              :step="100"
            />
          </el-form-item>
          <el-form-item label="错误处理">
            <el-select v-model="config.errorHandling" style="width: 180px">
              <el-option label="继续执行" value="continue" />
              <el-option label="终止请求" value="abort" />
              <el-option label="返回错误" value="error" />
            </el-select>
          </el-form-item>
          <el-form-item label="调试模式">
            <el-switch v-model="config.debug" />
          </el-form-item>
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
        <el-button @click="handleReset">
          <IconifyIconOnline icon="ri:refresh-line" />
          重置
        </el-button>
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" :loading="loading" @click="handleSave">
          <IconifyIconOnline icon="ri:save-line" />
          保存配置
        </el-button>
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

// 初始配置
const defaultConfig = {
  enabled: false,
  language: "java" as "java" | "groovy" | "python",
  phase: "both" as "before" | "after" | "both",
  pathPattern: "",
  beforeScript: "",
  afterScript: "",
  timeout: 5000,
  errorHandling: "continue" as "continue" | "abort" | "error",
  debug: false,
};

const config = reactive({ ...defaultConfig });

// 编辑器模式
const editorMode = computed(() => {
  const lang = config.language;
  if (lang === "java") return "text/x-java";
  if (lang === "groovy") return "text/x-groovy";
  if (lang === "python") return "python";
  return "text/x-java";
});

// 请求前脚本占位符
const beforePlaceholder = computed(() => {
  if (config.language === "java") {
    return `// Java 请求前处理脚本
// 可用变量: request, headers, params, body

import com.chua.common.support.protocol.request.ServletRequest;
import com.chua.common.support.protocol.request.ServletResponse;

public class BeforeHandler {
    public boolean handle(ServletRequest request) {
        // 示例: 添加请求头
        request.addHeader("X-Custom-Header", "value");
        
        // 返回 false 可终止请求
        return true;
    }
}`;
  }
  if (config.language === "groovy") {
    return `// Groovy 请求前处理脚本
// 可用变量: request, headers, params, body

// 示例: 添加请求头
request.addHeader('X-Custom-Header', 'value')

// 返回 false 可终止请求
return true`;
  }
  if (config.language === "python") {
    return `# Python 请求前处理脚本
# 可用变量: request, headers, params, body

# 示例: 添加请求头
request.add_header('X-Custom-Header', 'value')

# 返回 False 可终止请求
return True`;
  }
  return "// 在此编写请求前处理脚本...";
});

// 响应后脚本占位符
const afterPlaceholder = computed(() => {
  if (config.language === "java") {
    return `// Java 响应后处理脚本
// 可用变量: request, response, body, statusCode

import com.chua.common.support.protocol.request.ServletRequest;
import com.chua.common.support.protocol.request.ServletResponse;

public class AfterHandler {
    public Object handle(ServletRequest request, ServletResponse response, Object body) {
        // 示例: 添加响应头
        response.addHeader("X-Processed", "true");
        
        return body;
    }
}`;
  }
  if (config.language === "groovy") {
    return `// Groovy 响应后处理脚本
// 可用变量: request, response, body, statusCode

// 示例: 添加响应头
response.addHeader('X-Processed', 'true')

return body`;
  }
  if (config.language === "python") {
    return `# Python 响应后处理脚本
# 可用变量: request, response, body, statusCode

# 示例: 添加响应头
response.add_header('X-Processed', 'true')

return body`;
  }
  return "// 在此编写响应后处理脚本...";
});

// 配置预览
const previewConfig = computed(() => ({
  enabled: config.enabled,
  language: config.language,
  phase: config.phase,
  pathPattern: config.pathPattern || "*",
  timeout: config.timeout,
  errorHandling: config.errorHandling,
  debug: config.debug,
  hasBeforeScript: !!config.beforeScript?.trim(),
  hasAfterScript: !!config.afterScript?.trim(),
}));

watch(
  () => props.visible,
  async (v) => {
    visibleInner.value = v;
    if (v) await loadData();
  },
  { immediate: true }
);

watch(visibleInner, (v) => emit("update:visible", v));

// 加载配置
async function loadData() {
  try {
    const res = await getServletFilterConfig(props.filterSettingId);
    if (res.success && res.data) {
      Object.assign(config, {
        enabled: res.data.enabled ?? false,
        language: res.data.language || "javascript",
        phase: res.data.phase || "both",
        pathPattern: res.data.pathPattern || "",
        beforeScript: res.data.beforeScript || "",
        afterScript: res.data.afterScript || "",
        timeout: res.data.timeout || 5000,
        errorHandling: res.data.errorHandling || "continue",
        debug: res.data.debug ?? false,
      });
    }
  } catch (e) {
    // ignore
  }
}

// 保存配置
async function handleSave() {
  // 验证
  if (config.phase === "before" || config.phase === "both") {
    if (!config.beforeScript?.trim()) {
      message("请填写请求前脚本", { type: "warning" });
      return;
    }
  }
  if (config.phase === "after" || config.phase === "both") {
    if (!config.afterScript?.trim()) {
      message("请填写响应后脚本", { type: "warning" });
      return;
    }
  }

  loading.value = true;
  try {
    const res = await saveServletFilterConfig(props.filterSettingId, {
      enabled: config.enabled,
      language: config.language,
      phase: config.phase,
      pathPattern: config.pathPattern,
      beforeScript: config.beforeScript,
      afterScript: config.afterScript,
      timeout: config.timeout,
      errorHandling: config.errorHandling,
      debug: config.debug,
    });
    if (res.success) {
      message("代理响应脚本配置已保存并热应用", { type: "success" });
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

// 重置配置
function handleReset() {
  Object.assign(config, { ...defaultConfig });
  message("已重置为默认配置", { type: "success" });
}

function handleClose() {
  visibleInner.value = false;
}
</script>

<style lang="scss" scoped>
.proxy-config-container {
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

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }
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

  :deep(.iconify) {
    color: var(--el-color-primary);
    font-size: 18px;
  }
}

.config-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 8px;

  :deep(.el-form-item) {
    margin-bottom: 0;
  }

  :deep(.el-form-item__label) {
    font-weight: 500;
    color: #606266;
  }
}

.editor-wrapper {
  border: 1px solid #e4e7ed;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.05);
}

.script-tips {
  margin-top: 12px;
  padding: 10px 14px;
  background: linear-gradient(145deg, #f0f9ff 0%, #e0f2fe 100%);
  border-radius: 8px;
  border-left: 3px solid #409eff;

  code {
    background: rgba(64, 158, 255, 0.1);
    color: #409eff;
    padding: 2px 6px;
    border-radius: 4px;
    font-family: "Consolas", "Monaco", monospace;
    font-size: 12px;
  }
}

.config-preview {
  max-height: 160px;
  overflow-y: auto;
  border-radius: 8px;
  background: #1e1e1e;

  pre {
    margin: 0;
    padding: 16px;
    font-size: 12px;
    line-height: 1.6;
    color: #d4d4d4;
    font-family: "Consolas", "Monaco", monospace;
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 8px;

  :deep(.el-button) {
    border-radius: 8px;
    padding: 10px 20px;
  }
}


// 响应式设计
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 12px;
    padding: 12px 16px;
  }
}

</style>
