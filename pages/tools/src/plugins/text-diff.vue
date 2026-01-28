<script setup>
import { reactive, ref, onMounted, computed, watch } from "vue";
import { message } from "@repo/utils";
import Prism from "prismjs";
import "prismjs/themes/prism-tomorrow.css";
import "prismjs/plugins/line-numbers/prism-line-numbers.css";
import "prismjs/plugins/diff-highlight/prism-diff-highlight.css";
import "prismjs/components/prism-diff";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-css";
import "prismjs/components/prism-markup";
import "prismjs/components/prism-python";
import "prismjs/components/prism-java";
import "prismjs/components/prism-csharp";
import "prismjs/components/prism-go";
import "prismjs/components/prism-rust";
import "prismjs/components/prism-sql";
import "prismjs/components/prism-json";
import "prismjs/components/prism-yaml";
import "prismjs/components/prism-bash";
import "prismjs/plugins/line-numbers/prism-line-numbers";
import * as Diff from "diff";

// 响应式数据
const env = reactive({
  // 输入内容
  originalText: "",
  modifiedText: "",
  // 语言选择
  language: "plaintext",
  // 比较方式
  diffType: "chars", // chars, words, lines, sentences
  // 显示选项
  showLineNumbers: true,
  ignoreWhitespace: false,
  ignoreCase: false,
  // 结果
  diffResult: "",
  unifiedDiff: "",
  // 历史记录
  history: [],
  // 加载状态
  loading: false,
  // 语言选项
  languages: [
    { value: "plaintext", label: "纯文本" },
    { value: "javascript", label: "JavaScript" },
    { value: "typescript", label: "TypeScript" },
    { value: "html", label: "HTML" },
    { value: "css", label: "CSS" },
    { value: "python", label: "Python" },
    { value: "java", label: "Java" },
    { value: "csharp", label: "C#" },
    { value: "go", label: "Go" },
    { value: "rust", label: "Rust" },
    { value: "sql", label: "SQL" },
    { value: "json", label: "JSON" },
    { value: "yaml", label: "YAML" },
    { value: "bash", label: "Bash" },
    { value: "xml", label: "XML" },
    { value: "markdown", label: "Markdown" },
    { value: "php", label: "PHP" },
    { value: "ruby", label: "Ruby" },
    { value: "swift", label: "Swift" },
    { value: "kotlin", label: "Kotlin" },
  ],
  // 比较方式选项
  diffTypes: [
    { value: "chars", label: "字符级别", icon: "ri:text" },
    { value: "words", label: "单词级别", icon: "ri:file-word-line" },
    { value: "lines", label: "行级别", icon: "ri:file-list-line" },
    { value: "sentences", label: "句子级别", icon: "ri:file-text-line" },
  ],
  // 示例
  examples: [
    {
      name: "JavaScript 示例",
      originalText: `function greeting(name) {
  console.log('Hello, ' + name + '!');
  return 'Hello, ' + name + '!';
}`,
      modifiedText: `function greeting(name) {
  // 添加问候语
  const message = \`Hello, \${name}!\`;
  console.log(message);
  return message;
}`,
      language: "javascript",
      diffType: "lines",
    },
    {
      name: "HTML 示例",
      originalText: `<div class="container">
  <h1>Welcome</h1>
  <p>This is a sample text.</p>
</div>`,
      modifiedText: `<div class="container">
  <h1>Welcome to our website</h1>
  <p>This is a sample text with <strong>important</strong> information.</p>
  <button>Click me</button>
</div>`,
      language: "html",
      diffType: "lines",
    },
    {
      name: "JSON 示例",
      originalText: `{
  "name": "John",
  "age": 30,
  "city": "New York"
}`,
      modifiedText: `{
  "name": "John",
  "age": 31,
  "city": "Boston",
  "email": "john@example.com"
}`,
      language: "json",
      diffType: "lines",
    },
  ],
});

// 计算属性：是否可以比较
const canCompare = computed(() => {
  return env.originalText.trim() !== "" && env.modifiedText.trim() !== "";
});

// 比较文本
const compareTexts = () => {
  try {
    env.loading = true;

    if (!env.originalText.trim()) {
      throw new Error("请输入原始文本");
    }

    if (!env.modifiedText.trim()) {
      throw new Error("请输入修改后文本");
    }

    let diffResult;
    let original = env.originalText;
    let modified = env.modifiedText;

    // 应用忽略选项
    if (env.ignoreWhitespace) {
      original = original.replace(/\s+/g, " ").trim();
      modified = modified.replace(/\s+/g, " ").trim();
    }

    if (env.ignoreCase) {
      original = original.toLowerCase();
      modified = modified.toLowerCase();
    }

    // 根据比较方式选择不同的比较函数
    switch (env.diffType) {
      case "chars":
        diffResult = Diff.diffChars(original, modified);
        break;
      case "words":
        diffResult = Diff.diffWords(original, modified);
        break;
      case "lines":
        diffResult = Diff.diffLines(original, modified);
        break;
      case "sentences":
        diffResult = Diff.diffSentences(original, modified);
        break;
      default:
        diffResult = Diff.diffLines(original, modified);
    }

    // 生成HTML差异
    let html = "";
    diffResult.forEach((part) => {
      // 添加颜色标记
      const color = part.added ? "green" : part.removed ? "red" : "grey";
      const spanClass = part.added ? "addition" : part.removed ? "deletion" : "unchanged";
      const prefix = part.added ? "+ " : part.removed ? "- " : "  ";

      // 对于行比较，我们需要在每行前添加前缀
      if (env.diffType === "lines" || env.diffType === "sentences") {
        const lines = part.value.split("\n");
        lines.forEach((line, i) => {
          if (line || i < lines.length - 1) {
            // 避免空行
            html += `<span class="${spanClass}">${prefix}${line}${i < lines.length - 1 ? "\n" : ""}</span>`;
          }
        });
      } else {
        html += `<span class="${spanClass}">${part.value}</span>`;
      }
    });

    // 生成统一差异格式
    const unifiedDiff = Diff.createPatch("file", env.originalText, env.modifiedText, "原始", "修改后");

    env.diffResult = html;
    env.unifiedDiff = unifiedDiff;

    // 添加到历史记录
    addToHistory();

    message("文本比较完成", { type: "success" });

    // 高亮显示
    highlightCode();
  } catch (error) {
    console.error("文本比较错误:", error);
    message(error.message || "文本比较失败", { type: "error" });
  } finally {
    env.loading = false;
  }
};

// 高亮代码
const highlightCode = () => {
  setTimeout(() => {
    Prism.highlightAll();
  }, 0);
};

// 应用示例
const applyExample = (example) => {
  env.originalText = example.originalText;
  env.modifiedText = example.modifiedText;
  env.language = example.language;
  env.diffType = example.diffType;

  // 高亮显示
  highlightCode();

  message("已应用示例", { type: "success" });
};

// 添加到历史记录
const addToHistory = () => {
  const now = new Date();
  const historyItem = {
    id: now.getTime(),
    date: now.toLocaleString(),
    originalText: env.originalText,
    modifiedText: env.modifiedText,
    language: env.language,
    diffType: env.diffType,
  };

  env.history.unshift(historyItem);

  // 限制历史记录数量
  if (env.history.length > 10) {
    env.history.pop();
  }

  // 保存到本地存储
  try {
    localStorage.setItem("text-diff-tool-history", JSON.stringify(env.history));
  } catch (e) {
    console.error("保存历史记录失败:", e);
  }
};

// 从历史记录加载
const loadFromHistory = (item) => {
  env.originalText = item.originalText;
  env.modifiedText = item.modifiedText;
  env.language = item.language;
  env.diffType = item.diffType;

  // 高亮显示
  highlightCode();

  message("已从历史记录加载", { type: "success" });
};

// 复制到剪贴板
const copyToClipboard = (text) => {
  navigator.clipboard
    .writeText(text)
    .then(() => {
      message("复制成功", { type: "success" });
    })
    .catch(() => {
      message("复制失败", { type: "error" });
    });
};

// 清空表单
const clearForm = () => {
  env.originalText = "";
  env.modifiedText = "";
  env.diffResult = "";
  env.unifiedDiff = "";

  message("已清空", { type: "success" });
};

// 交换文本
const swapTexts = () => {
  const temp = env.originalText;
  env.originalText = env.modifiedText;
  env.modifiedText = temp;

  message("文本已交换", { type: "success" });
};

// 获取语言图标
const getLanguageIcon = (language) => {
  const iconMap = {
    plaintext: "ri:file-text-line",
    javascript: "ri:javascript-line",
    typescript: "ri:typescript-line",
    html: "ri:html5-line",
    css: "ri:css3-line",
    python: "ri:python-line",
    java: "ri:java-line",
    csharp: "ri:microsoft-line",
    go: "ri:google-line",
    rust: "ri:code-box-line",
    sql: "ri:database-2-line",
    json: "ri:braces-line",
    yaml: "ri:file-list-line",
    bash: "ri:terminal-line",
    xml: "ri:code-line",
    markdown: "ri:markdown-line",
    php: "ri:php-line",
    ruby: "ri:ruby-line",
    swift: "ri:apple-line",
    kotlin: "ri:android-line",
  };

  return iconMap[language] || "ri:file-text-line";
};

// 监听语言变化，自动高亮
watch(
  () => env.language,
  () => {
    highlightCode();
  }
);

// 组件挂载时初始化
onMounted(() => {
  // 从本地存储加载历史记录
  try {
    const savedHistory = localStorage.getItem("text-diff-tool-history");
    if (savedHistory) {
      env.history = JSON.parse(savedHistory);
    }
  } catch (e) {
    console.error("加载历史记录失败:", e);
  }

  // 初始化语法高亮
  highlightCode();
});
</script>

<template>
  <div class="text-diff-tool">
    <div class="text-diff-tool__content">
      <!-- 头部信息 -->
      <div class="text-diff-tool__header">
        <div class="text-diff-tool__header-content">
          <IconifyIconOnline icon="ri:contrast-2-line" class="text-diff-tool__header-icon" />
          <div>
            <h2 class="text-diff-tool__header-title">文本对比工具</h2>
            <p class="text-diff-tool__header-desc">比较两段文本或代码，高亮显示差异，支持多种编程语言</p>
          </div>
        </div>
      </div>

      <!-- 主要内容区域 -->
      <el-row :gutter="24">
        <!-- 左侧输入区域 -->
        <el-col :xs="24" :sm="24" :md="24" :lg="24">
          <el-card class="text-diff-tool__input-card" shadow="hover">
            <template #header>
              <div class="text-diff-tool__card-header">
                <IconifyIconOnline icon="ri:settings-line" class="text-diff-tool__card-icon" />
                <span>比较设置</span>
              </div>
            </template>

            <el-form label-position="top">
              <!-- 语言选择 -->
              <el-form-item label="语言">
                <el-select v-model="env.language" class="text-diff-tool__select">
                  <el-option v-for="lang in env.languages" :key="lang.value" :label="lang.label" :value="lang.value">
                    <div class="text-diff-tool__language-option">
                      <IconifyIconOnline :icon="getLanguageIcon(lang.value)" />
                      <span>{{ lang.label }}</span>
                    </div>
                  </el-option>
                </el-select>
              </el-form-item>

              <!-- 比较方式 -->
              <el-form-item label="比较方式">
                <el-radio-group v-model="env.diffType" class="text-diff-tool__radio-group">
                  <el-radio v-for="type in env.diffTypes" :key="type.value" :label="type.value">
                    <div class="text-diff-tool__radio-content">
                      <IconifyIconOnline :icon="type.icon" />
                      <span>{{ type.label }}</span>
                    </div>
                  </el-radio>
                </el-radio-group>
              </el-form-item>

              <!-- 显示选项 -->
              <el-form-item label="显示选项">
                <div class="text-diff-tool__options">
                  <el-checkbox v-model="env.showLineNumbers" label="显示行号" />
                  <el-checkbox v-model="env.ignoreWhitespace" label="忽略空白" />
                  <el-checkbox v-model="env.ignoreCase" label="忽略大小写" />
                </div>
              </el-form-item>

              <!-- 示例选择 -->
              <el-form-item label="示例">
                <div class="text-diff-tool__examples">
                  <el-button v-for="example in env.examples" :key="example.name" size="small" @click="applyExample(example)">
                    {{ example.name }}
                  </el-button>
                </div>
              </el-form-item>
            </el-form>
          </el-card>
        </el-col>
      </el-row>

      <el-row :gutter="24" class="text-diff-tool__editors-row">
        <!-- 原始文本 -->
        <el-col :xs="24" :sm="24" :md="12" :lg="12">
          <el-card class="text-diff-tool__editor-card" shadow="hover">
            <template #header>
              <div class="text-diff-tool__card-header">
                <IconifyIconOnline icon="ri:file-text-line" class="text-diff-tool__card-icon" />
                <span>原始文本</span>
              </div>
            </template>

            <el-input v-model="env.originalText" type="textarea" :rows="15" placeholder="输入原始文本或代码" resize="vertical" class="text-diff-tool__input" />
          </el-card>
        </el-col>

        <!-- 修改后文本 -->
        <el-col :xs="24" :sm="24" :md="12" :lg="12">
          <el-card class="text-diff-tool__editor-card" shadow="hover">
            <template #header>
              <div class="text-diff-tool__card-header">
                <IconifyIconOnline icon="ri:file-edit-line" class="text-diff-tool__card-icon" />
                <span>修改后文本</span>
              </div>
            </template>

            <el-input v-model="env.modifiedText" type="textarea" :rows="15" placeholder="输入修改后文本或代码" resize="vertical" class="text-diff-tool__input" />
          </el-card>
        </el-col>
      </el-row>

      <!-- 操作按钮 -->
      <div class="text-diff-tool__actions">
        <el-button type="primary" :loading="env.loading" :disabled="!canCompare" class="text-diff-tool__compare-btn" @click="compareTexts">
          <IconifyIconOnline icon="ri:contrast-2-line" />
          <span>比较文本</span>
        </el-button>

        <el-button type="success" class="text-diff-tool__swap-btn" @click="swapTexts">
          <IconifyIconOnline icon="ri:swap-line" />
          <span>交换文本</span>
        </el-button>

        <el-button class="text-diff-tool__clear-btn" @click="clearForm">
          <IconifyIconOnline icon="ri:delete-bin-line" />
          <span>清空</span>
        </el-button>
      </div>

      <!-- 比较结果 -->
      <el-card v-if="env.diffResult" class="text-diff-tool__result-card" shadow="hover">
        <template #header>
          <div class="text-diff-tool__card-header">
            <IconifyIconOnline icon="ri:contrast-2-line" class="text-diff-tool__card-icon" />
            <span>比较结果</span>
            <div class="text-diff-tool__result-actions">
              <el-button type="primary" link size="small" @click="copyToClipboard(env.unifiedDiff)">
                <IconifyIconOnline icon="ri:file-copy-line" />
                <span>复制差异</span>
              </el-button>
            </div>
          </div>
        </template>

        <el-tabs type="border-card">
          <el-tab-pane label="内联视图">
            <div class="text-diff-tool__diff-result">
              <pre :class="{ 'line-numbers': env.showLineNumbers }"><code :class="`language-${env.language}`" v-html="env.diffResult"></code></pre>
            </div>
          </el-tab-pane>
          <el-tab-pane label="统一视图">
            <div class="text-diff-tool__unified-diff">
              <pre :class="{ 'line-numbers': env.showLineNumbers }"><code class="language-diff">{{ env.unifiedDiff }}</code></pre>
            </div>
          </el-tab-pane>
        </el-tabs>
      </el-card>

      <!-- 历史记录 -->
      <el-card class="text-diff-tool__history-card" shadow="hover">
        <template #header>
          <div class="text-diff-tool__card-header">
            <IconifyIconOnline icon="ri:history-line" class="text-diff-tool__card-icon" />
            <span>历史记录</span>
          </div>
        </template>

        <el-empty v-if="!env.history.length" description="暂无历史记录" class="text-diff-tool__empty">
          <template #image>
            <IconifyIconOnline icon="ri:history-line" class="text-diff-tool__empty-icon" />
          </template>
        </el-empty>

        <el-table v-else :data="env.history" style="width: 100%">
          <el-table-column prop="date" label="日期" width="180" />
          <el-table-column prop="language" label="语言" width="120">
            <template #default="{ row }">
              <div class="text-diff-tool__language-tag">
                <IconifyIconOnline :icon="getLanguageIcon(row.language)" />
                <span>{{ env.languages.find((lang) => lang.value === row.language)?.label || row.language }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="diffType" label="比较方式" width="120">
            <template #default="{ row }">
              <span>{{ env.diffTypes.find((type) => type.value === row.diffType)?.label || row.diffType }}</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="120">
            <template #default="scope">
              <el-button type="primary" link @click="loadFromHistory(scope.row)"> 加载 </el-button>
              <el-button type="danger" link @click="env.history.splice(env.history.indexOf(scope.row), 1)"> 删除 </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>
  </div>
</template>

<style scoped>
.text-diff-tool {
  padding: 20px;
}

.text-diff-tool__content {
  margin: 0 auto;
}

.text-diff-tool__header {
  background: linear-gradient(135deg, var(--el-color-primary-light-3) 0%, var(--el-color-primary) 100%);
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 20px;
  color: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.text-diff-tool__header-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.text-diff-tool__header-icon {
  font-size: 48px;
  opacity: 0.9;
}

.text-diff-tool__header-title {
  margin: 0 0 8px 0;
  font-size: 24px;
  font-weight: 600;
}

.text-diff-tool__header-desc {
  margin: 0;
  font-size: 14px;
  opacity: 0.9;
}

.text-diff-tool__card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
}

.text-diff-tool__card-icon {
  color: var(--el-color-primary);
}

.text-diff-tool__editors-row {
  margin-top: 24px;
}

.text-diff-tool__editor-card,
.text-diff-tool__input-card,
.text-diff-tool__result-card,
.text-diff-tool__history-card {
  margin-bottom: 24px;
  transition: all 0.3s ease;
}

.text-diff-tool__editor-card:hover,
.text-diff-tool__input-card:hover,
.text-diff-tool__result-card:hover,
.text-diff-tool__history-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}

.text-diff-tool__input {
  font-family: monospace;
}

.text-diff-tool__select {
  width: 100%;
}

.text-diff-tool__language-option {
  display: flex;
  align-items: center;
  gap: 8px;
}

.text-diff-tool__language-tag {
  display: flex;
  align-items: center;
  gap: 4px;
}

.text-diff-tool__radio-group {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.text-diff-tool__radio-content {
  display: flex;
  align-items: center;
  gap: 5px;
  transition: all 0.3s ease;
}

.text-diff-tool__options {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.text-diff-tool__examples {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.text-diff-tool__actions {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
}

.text-diff-tool__compare-btn,
.text-diff-tool__swap-btn,
.text-diff-tool__clear-btn {
  display: flex;
  align-items: center;
  gap: 4px;
}

.text-diff-tool__result-actions {
  margin-left: auto;
}

.text-diff-tool__diff-result,
.text-diff-tool__unified-diff {
  max-height: 500px;
  overflow: auto;
  border-radius: 4px;
  background-color: #2d2d2d;
}

.text-diff-tool__empty {
  padding: 40px 0;
}

.text-diff-tool__empty-icon {
  font-size: 48px;
  color: var(--el-color-info-light-5);
}

/* 差异高亮样式 */
:deep(.addition) {
  background-color: rgba(0, 255, 0, 0.1);
  color: #4ade80;
}

:deep(.deletion) {
  background-color: rgba(255, 0, 0, 0.1);
  color: #f87171;
}

:deep(.unchanged) {
  color: #d1d5db;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .text-diff-tool__radio-group {
    flex-direction: column;
    gap: 8px;
  }

  .text-diff-tool__actions {
    flex-direction: column;
  }
}
</style>
