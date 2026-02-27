<template>
  <div class="code-generator">
    <div v-if="!api" class="no-selection">
      <ScEmpty description="请选择一个API接口" :image-size="100" />
    </div>
    <div v-else class="examples-container">
      <ScTabs v-model="activeLanguage" class="language-tabs">
        <ScTabPane 
          v-for="lang in languages"
          :key="lang.value"
          :label="lang.label"
          :name="lang.value"
        >
          <div class="code-block">
            <div class="code-header">
              <span class="language-label">{{ lang.label }}</span>
              <ScButton size="small" text @click="copyCode">
                <i class="ri-file-copy-line"></i>
                复制代码
              </ScButton>
            </div>
            <div class="code-content">
              <codemirror-editor-vue3
                v-if="generatedCode"
                :value="generatedCode"
                :options="editorOptions"
                :height="editorHeight"
                :read-only="true"
              />
              <div v-else class="empty-code">
                <ScEmpty 
                  :description="api ? '正在生成代码...' : '请先选择一个API接口'"
                  :image-size="80"
                />
              </div>
            </div>
          </div>
        </ScTabPane>
      </ScTabs>
    </div>
  </div>
</template>

<script setup lang="ts">

import ScTabPane from "@repo/components/ScTabs";
import { computed, ref, watch } from "vue";
import CodemirrorEditorVue3 from "codemirror-editor-vue3";
import type { ApiInfo, CodeLanguage } from "../types";
import { generateCode, editorConfigs } from "../utils";

const props = withDefaults(
  defineProps<{
    /** 选中的 API */
    api: ApiInfo | null;
    /** 基础 URL */
    baseUrl: string;
    /** 路径参数 */
    pathParams?: Record<string, string>;
    /** 查询参数 */
    queryParams?: Record<string, string>;
    /** 请求体 */
    requestBody?: string;
    /** 全局请求头 */
    headers?: Record<string, string>;
    /** 编辑器高度 */
    editorHeight?: string;
    /** 支持的语言列表 */
    supportedLanguages?: CodeLanguage[];
  }>(),
  {
    pathParams: () => ({}),
    queryParams: () => ({}),
    requestBody: "",
    headers: () => ({}),
    editorHeight: "100%",
    supportedLanguages: () => ["java", "javascript", "python", "curl"],
  }
);

const emit = defineEmits<{
  (e: "copy", code: string): void;
}>();

// 当前选中的语言
const activeLanguage = ref<CodeLanguage>("java");

// 语言配置
const languageConfigs: Record<CodeLanguage, { label: string; mode: string }> = {
  java: { label: "Java", mode: "text/x-java" },
  javascript: { label: "JavaScript", mode: "text/javascript" },
  python: { label: "Python", mode: "text/x-python" },
  curl: { label: "cURL", mode: "shell" },
};

// 可用的语言列表
const languages = computed(() => {
  return props.supportedLanguages.map((lang) => ({
    value: lang,
    label: languageConfigs[lang].label,
  }));
});

// 编辑器配置
const editorOptions = computed(() => {
  const config = languageConfigs[activeLanguage.value];
  return {
    mode: config.mode,
    theme: "default",
    lineNumbers: true,
    readOnly: true,
    foldGutter: true,
    gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter"],
    lineWrapping: true,
  };
});

// 生成的代码
const generatedCode = computed(() => {
  if (!props.api) return "";

  return generateCode(
    activeLanguage.value,
    props.baseUrl,
    props.api,
    props.pathParams,
    props.queryParams,
    props.requestBody,
    props.headers
  );
});

// 复制代码
const copyCode = () => {
  if (!generatedCode.value) return;

  navigator.clipboard.writeText(generatedCode.value).then(() => {
    emit("copy", generatedCode.value);
  });
};

// 监听语言列表变化，确保当前选中的语言有效
watch(
  () => props.supportedLanguages,
  (newLanguages) => {
    if (!newLanguages.includes(activeLanguage.value)) {
      activeLanguage.value = newLanguages[0] || "java";
    }
  },
  { immediate: true }
);
</script>

<style lang="scss" scoped>
.code-generator {
  height: 100%;
  display: flex;
  flex-direction: column;

  .no-selection {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .examples-container {
    height: 100%;
    display: flex;
    flex-direction: column;

    .language-tabs {
      height: 100%;
      display: flex;
      flex-direction: column;

      :deep(.el-tabs__content) {
        flex: 1;
        overflow: hidden;

        .el-tab-pane {
          height: 100%;
        }
      }
    }

    .code-block {
      height: 100%;
      display: flex;
      flex-direction: column;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      overflow: hidden;

      .code-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 16px;
        background: #f9fafb;
        border-bottom: 1px solid #e5e7eb;

        .language-label {
          font-size: 13px;
          font-weight: 500;
          color: #374151;
        }
      }

      .code-content {
        flex: 1;
        overflow: hidden;

        .empty-code {
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
      }
    }
  }
}
</style>
