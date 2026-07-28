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
      <div class="fc-section">
        <h4 class="fc-section-title">
          <IconifyIconOnline icon="ri:settings-3-line" />
          基础配置
        </h4>
        <div class="fc-grid">
          <ScFormItem label="启用状态">
            <ScSwitch v-model="config.enabled" />
          </ScFormItem>
          <ScFormItem label="脚本语言">
            <ScSelect v-model="config.language" style="width: 180px">
              <ScOption label="Java" value="java" />
              <ScOption label="Groovy" value="groovy" />
              <ScOption label="Python" value="python" />
            </ScSelect>
          </ScFormItem>
          <ScFormItem label="执行阶段">
            <ScSelect v-model="config.phase" style="width: 180px">
              <ScOption label="请求前" value="before" />
              <ScOption label="请求后" value="after" />
              <ScOption label="全部" value="both" />
            </ScSelect>
          </ScFormItem>
          <ScFormItem label="匹配路径">
            <ScInput v-model="config.pathPattern" placeholder="留空匹配全部，如: /api/**" style="width: 200px" />
          </ScFormItem>
        </div>
      </div>

      <!-- 请求前脚本 -->
      <div v-if="config.phase === 'before' || config.phase === 'both'" class="fc-section">
        <h4 class="fc-section-title">
          <IconifyIconOnline icon="ri:arrow-right-circle-line" />
          请求前脚本
          <ScTag size="small" type="warning">Before Request</ScTag>
        </h4>
        <div class="fc-editor-wrapper">
          <CodeEditor v-model:content="config.beforeScript" :showTool="true" :height="'280px'" :options="{ mode: editorMode }" :placeholder="beforePlaceholder" />
        </div>
        <div class="fc-script-tips">
          <IconifyIconOnline icon="ri:information-line" />
          <span>可用变量：<code>request</code>（请求对象）、<code>headers</code>（请求头）、<code>params</code>（请求参数）、<code>body</code>（请求体）</span>
        </div>
      </div>

      <!-- 响应后脚本 -->
      <div v-if="config.phase === 'after' || config.phase === 'both'" class="fc-section">
        <h4 class="fc-section-title">
          <IconifyIconOnline icon="ri:arrow-left-circle-line" />
          响应后脚本
          <ScTag size="small" type="success">After Response</ScTag>
        </h4>
        <div class="fc-editor-wrapper">
          <CodeEditor v-model:content="config.afterScript" :showTool="true" :height="'280px'" :options="{ mode: editorMode }" :placeholder="afterPlaceholder" />
        </div>
        <div class="fc-script-tips">
          <IconifyIconOnline icon="ri:information-line" />
          <span>可用变量：<code>request</code>（请求对象）、<code>response</code>（响应对象）、<code>body</code>（响应体）、<code>statusCode</code>（状态码）</span>
        </div>
      </div>

      <!-- 高级配置 -->
      <div class="fc-section">
        <h4 class="fc-section-title">
          <IconifyIconOnline icon="ri:tools-line" />
          高级配置
        </h4>
        <div class="fc-grid">
          <ScFormItem label="超时时间(ms)">
            <ScInputNumber v-model="config.timeout" :min="100" :max="60000" :step="100" />
          </ScFormItem>
          <ScFormItem label="错误处理">
            <ScSelect v-model="config.errorHandling" style="width: 180px">
              <ScOption label="继续执行" value="continue" />
              <ScOption label="终止请求" value="abort" />
              <ScOption label="返回错误" value="error" />
            </ScSelect>
          </ScFormItem>
          <ScFormItem label="调试模式">
            <ScSwitch v-model="config.debug" />
          </ScFormItem>
        </div>
      </div>

      <!-- 配置预览 -->
      <div class="fc-section">
        <h4 class="fc-section-title">
          <IconifyIconOnline icon="ri:eye-line" />
          配置预览
        </h4>
        <ScCard class="fc-preview thin-scrollbar">
          <pre>{{ JSON.stringify(previewConfig, null, 2) }}</pre>
        </ScCard>
      </div>
    </div>

    <template #footer>
      <div class="fc-footer">
        <ScButton @click="handleReset">
          <IconifyIconOnline icon="ri:refresh-line" /> 重置
        </ScButton>
        <ScButton @click="handleClose">取消</ScButton>
        <ScButton type="primary" :loading="loading" @click="handleSave">
          <IconifyIconOnline icon="ri:save-line" /> 保存配置
        </ScButton>
      </div>
    </template>
  </sc-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, watch, computed } from "vue";
import { message } from "@repo/utils";
import CodeEditor from "@/components/codeEditor/index.vue";
import { getServletFilterConfig, saveServletFilterConfig } from "@/api/system-server-setting";
import { ScCard } from "@repo/components/ScCard";
import { ScInputNumber } from "@repo/components/ScInputNumber";
import { ScOption } from "@repo/components/ScOption";

interface Props { visible: boolean; serverId: number; filterSettingId: number; }
const props = defineProps<Props>();
const emit = defineEmits<{ "update:visible": [boolean]; success: [] }>();

const visibleInner = ref(false);
const loading = ref(false);

const defaultConfig = {
  enabled: false, language: "java" as "java" | "groovy" | "python", phase: "both" as "before" | "after" | "both",
  pathPattern: "", beforeScript: "", afterScript: "", timeout: 5000,
  errorHandling: "continue" as "continue" | "abort" | "error", debug: false,
};

const config = reactive({ ...defaultConfig });

const editorMode = computed(() => {
  const lang = config.language;
  if (lang === "java") return "text/x-java";
  if (lang === "groovy") return "text/x-groovy";
  if (lang === "python") return "python";
  return "text/x-java";
});

const beforePlaceholder = computed(() => {
  if (config.language === "java") return `// Java 请求前处理脚本\n// 可用变量: request, headers, params, body\n\nimport com.chua.common.support.protocol.request.ServletRequest;\nimport com.chua.common.support.protocol.request.ServletResponse;\n\npublic class BeforeHandler {\n    public boolean handle(ServletRequest request) {\n        request.addHeader("X-Custom-Header", "value");\n        return true;\n    }\n}`;
  if (config.language === "groovy") return `// Groovy 请求前处理脚本\n// 可用变量: request, headers, params, body\n\nrequest.addHeader('X-Custom-Header', 'value')\nreturn true`;
  if (config.language === "python") return `# Python 请求前处理脚本\n# 可用变量: request, headers, params, body\n\nrequest.add_header('X-Custom-Header', 'value')\nreturn True`;
  return "// 在此编写请求前处理脚本...";
});

const afterPlaceholder = computed(() => {
  if (config.language === "java") return `// Java 响应后处理脚本\n// 可用变量: request, response, body, statusCode\n\nimport com.chua.common.support.protocol.request.ServletRequest;\nimport com.chua.common.support.protocol.request.ServletResponse;\n\npublic class AfterHandler {\n    public Object handle(ServletRequest request, ServletResponse response, Object body) {\n        response.addHeader("X-Processed", "true");\n        return body;\n    }\n}`;
  if (config.language === "groovy") return `// Groovy 响应后处理脚本\n// 可用变量: request, response, body, statusCode\n\nresponse.addHeader('X-Processed', 'true')\nreturn body`;
  if (config.language === "python") return `# Python 响应后处理脚本\n# 可用变量: request, response, body, statusCode\n\nresponse.add_header('X-Processed', 'true')\nreturn body`;
  return "// 在此编写响应后处理脚本...";
});

const previewConfig = computed(() => ({
  enabled: config.enabled, language: config.language, phase: config.phase,
  pathPattern: config.pathPattern || "*", timeout: config.timeout,
  errorHandling: config.errorHandling, debug: config.debug,
  hasBeforeScript: !!config.beforeScript?.trim(), hasAfterScript: !!config.afterScript?.trim(),
}));

watch(() => props.visible, async (v) => { visibleInner.value = v; if (v) await loadData(); }, { immediate: true });
watch(visibleInner, (v) => emit("update:visible", v));

async function loadData() {
  try {
    const res = await getServletFilterConfig(props.filterSettingId);
    if (res.success && res.data) {
      Object.assign(config, {
        enabled: res.data.enabled ?? false, language: res.data.language || "javascript",
        phase: res.data.phase || "both", pathPattern: res.data.pathPattern || "",
        beforeScript: res.data.beforeScript || "", afterScript: res.data.afterScript || "",
        timeout: res.data.timeout || 5000, errorHandling: res.data.errorHandling || "continue",
        debug: res.data.debug ?? false,
      });
    }
  } catch { /* ignore */ }
}

async function handleSave() {
  if (config.phase === "before" || config.phase === "both") { if (!config.beforeScript?.trim()) { message("请填写请求前脚本", { type: "warning" }); return; } }
  if (config.phase === "after" || config.phase === "both") { if (!config.afterScript?.trim()) { message("请填写响应后脚本", { type: "warning" }); return; } }
  loading.value = true;
  try {
    const res = await saveServletFilterConfig(props.filterSettingId, {
      enabled: config.enabled, language: config.language, phase: config.phase,
      pathPattern: config.pathPattern, beforeScript: config.beforeScript, afterScript: config.afterScript,
      timeout: config.timeout, errorHandling: config.errorHandling, debug: config.debug,
    });
    if (res.success) { message("代理响应脚本配置已保存并热应用", { type: "success" }); emit("success"); visibleInner.value = false; }
    else { message(res.msg || "保存失败", { type: "error" }); }
  } catch { message("保存失败", { type: "error" }); }
  finally { loading.value = false; }
}

function handleReset() { Object.assign(config, { ...defaultConfig }); message("已重置为默认配置", { type: "success" }); }
function handleClose() { visibleInner.value = false; }
</script>

<style lang="scss" scoped>
@use './filter-config-shared' as *;

.proxy-config-container { max-height: 70vh; overflow-y: auto; padding: 4px; }

.fc-section {
  @include config-section;
  margin-bottom: 20px;
}

.fc-section-title { @include section-title; margin-bottom: 20px; }

.fc-grid {
  @include config-grid(2);
  gap: 20px;
  margin-bottom: 8px;
}

.fc-editor-wrapper {
  border: 1px solid $fc-border; border-radius: $fc-radius-sm; overflow: hidden;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.05);
}

.fc-script-tips {
  display: flex; align-items: center; gap: 8px;
  margin-top: 12px; padding: 10px 14px;
  background: linear-gradient(145deg, #f0f9ff 0%, #e0f2fe 100%);
  border-radius: $fc-radius-xs; border-left: 3px solid $fc-primary;
  color: $fc-hint; font-size: 13px;
  code {
    background: rgba(64, 158, 255, 0.1); color: $fc-primary;
    padding: 2px 6px; border-radius: 4px;
    font-family: "Consolas", "Monaco", monospace; font-size: 12px;
  }
}

.fc-preview {
  max-height: 160px; overflow-y: auto; border-radius: $fc-radius-xs;
  background: #1e1e1e;
  pre { margin: 0; padding: 16px; font-size: 12px; line-height: 1.6; color: #d4d4d4; font-family: "Consolas", "Monaco", monospace; }
}

.fc-footer { @include action-row; }

@include mobile {
  .fc-grid { grid-template-columns: 1fr; }
}
</style>
