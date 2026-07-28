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
      <div class="fc-section">
        <h4 class="fc-section-title">
          <IconifyIconOnline icon="ri:settings-3-line" />
          基础配置
        </h4>
        <div class="fc-grid">
          <ScFormItem label="启用状态">
            <ScSwitch v-model="config.enabled" />
          </ScFormItem>
          <ScFormItem label="表达式类型">
            <ScSelect v-model="config.type" style="width: 180px">
              <ScOption label="Java" value="java" />
              <ScOption label="Groovy" value="groovy" />
              <ScOption label="JavaScript" value="js" />
            </ScSelect>
          </ScFormItem>
          <ScFormItem label="指纹(可选)">
            <ScInput v-model="config.fingerprint" placeholder="用于热重载比对的标识，可留空自动生成" />
          </ScFormItem>
        </div>
      </div>

      <!-- 源码编辑器 -->
      <div class="fc-section">
        <h4 class="fc-section-title">
          <IconifyIconOnline icon="ri:code-s-slash-line" />
          源码
        </h4>
        <div class="fc-editor-wrapper">
          <CodeEditor
            v-model:content="config.source"
            :showTool="true"
            :height="'420px'"
            :options="{ mode: editorMode }"
            :placeholder="placeholderText"
          />
        </div>
        <div class="fc-tips-warn">
          <IconifyIconOnline icon="ri:information-line" />
          <span>要求实现 ServletFilter 接口（或可适配），保存后会热重载到运行中的服务器。</span>
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
        <ScButton @click="handleClose">取消</ScButton>
        <ScButton type="primary" :loading="loading" @click="handleSave">保存配置</ScButton>
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
import { ScOption } from "@repo/components/ScOption";

interface Props { visible: boolean; serverId: number; filterSettingId: number; }
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

watch(() => props.visible, async (v) => { visibleInner.value = v; if (v) await loadData(); }, { immediate: true });
watch(visibleInner, (v) => emit("update:visible", v));

const previewConfig = computed(() => ({ enabled: config.enabled, type: config.type, fingerprint: config.fingerprint }));

async function loadData() {
  try {
    const res = await getServletFilterConfig(props.filterSettingId);
    if (res.success && res.data) {
      config.enabled = !!res.data.enabled;
      config.type = res.data.type || "java";
      config.source = res.data.source || "";
      config.fingerprint = res.data.fingerprint || "";
    }
  } catch { /* ignore */ }
}

async function handleSave() {
  if (!config.source || !config.source.trim()) { message("请填写源码", { type: "warning" }); return; }
  loading.value = true;
  try {
    const res = await saveServletFilterConfig(props.filterSettingId, {
      enabled: config.enabled, type: config.type, source: config.source, fingerprint: config.fingerprint || undefined,
    });
    if (res.success) {
      message("动态表达式配置已保存并热应用", { type: "success" });
      emit("success");
      visibleInner.value = false;
    } else { message(res.msg || "保存失败", { type: "error" }); }
  } catch { message("保存失败", { type: "error" }); }
  finally { loading.value = false; }
}

function handleClose() { visibleInner.value = false; }
</script>

<style scoped lang="scss">
@use './filter-config-shared' as *;

.dynamic-config-container { max-height: 70vh; overflow-y: auto; padding: 4px; }

.fc-section {
  @include config-section;
  margin-bottom: 20px;
}

.fc-section-title { @include section-title; margin-bottom: 20px; }

.fc-grid {
  @include config-grid;
  margin-bottom: 16px;
}

.fc-editor-wrapper {
  border: 1px solid $fc-border; border-radius: $fc-radius-sm; overflow: hidden;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.05);
}

.fc-tips-warn {
  display: flex; align-items: center; gap: 8px;
  margin-top: 12px; padding: 10px 14px;
  background: #fef0f0; border-radius: $fc-radius-xs;
  border-left: 3px solid $fc-danger;
  color: $fc-danger; font-size: 13px;
}

.fc-preview {
  max-height: 180px; overflow-y: auto; border-radius: $fc-radius-xs;
  background: #282c34;
  pre { margin: 0; padding: 16px; font-size: 12px; line-height: 1.6; color: #abb2bf; font-family: "Consolas", "Monaco", monospace; }
}

.fc-footer { @include action-row; }

@include mobile {
  .fc-grid { grid-template-columns: 1fr; }
}
</style>
