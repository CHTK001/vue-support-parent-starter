<script setup>
import { message } from "@repo/utils";
import Prism from "prismjs";
import "prismjs/components/prism-css";
import "prismjs/components/prism-java";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-markdown";
import "prismjs/components/prism-markup";
import "prismjs/components/prism-python";
import "prismjs/components/prism-typescript";
import "prismjs/plugins/line-numbers/prism-line-numbers";
import "prismjs/plugins/line-numbers/prism-line-numbers.css";
import "prismjs/themes/prism-tomorrow.css";
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from "vue";
import useMarkdownIt from "./hook/useMarkdownIt";

// 创建markdown-it实例
const md = useMarkdownIt();

// 响应式数据
const env = reactive({
  // 编辑器内容
  markdownText: "",
  // 预览HTML
  previewHtml: "",
  // 编辑器设置
  settings: {
    autoSave: true,
    autoPreview: true,
    lineNumbers: true,
    wordWrap: true,
    darkMode: false,
    fontSize: 14,
  },
  // 历史记录
  history: [],
  // 加载状态
  loading: false,
  // 当前文件名
  currentFileName: "untitled.md",
  // 是否有未保存更改
  unsavedChanges: false,
  // 模板
  templates: [
    {
      name: "空白文档",
      content: "",
    },
    {
      name: "简单笔记",
      content: `# 我的笔记

## 简介
这是一个简单的Markdown笔记示例。

## 要点
- 第一点
- 第二点
- 第三点

## 总结
这是总结部分。
`,
    },
    {
      name: "会议记录",
      content: `# 会议记录

## 会议信息
- **日期**: ${new Date().toLocaleDateString()}
- **时间**: ${new Date().toLocaleTimeString()}
- **地点**: 会议室
- **参与者**: 
  - 张三
  - 李四
  - 王五

## 议程
1. 项目进度回顾
2. 问题讨论
3. 下一步计划

## 讨论内容
### 项目进度
项目当前进度正常，已完成以下任务：
- 需求分析
- 原型设计
- 前端开发50%

### 存在问题
- 数据接口尚未完全确定
- 测试环境不稳定

### 解决方案
1. 安排与后端团队沟通，确定接口规范
2. 升级测试服务器配置

## 下一步计划
- [ ] 完成前端开发
- [ ] 进行单元测试
- [ ] 准备用户验收测试

## 会议结论
项目整体进展顺利，预计可以按时交付。

---
记录人: 小明
`,
    },
    {
      name: "技术文档",
      content: `# 技术文档

## 项目概述
这是一个基于Vue3和Element Plus的Web应用项目。

## 技术栈
- 前端框架: Vue 3
- UI组件库: Element Plus
- 状态管理: Pinia
- 路由: Vue Router
- 构建工具: Vite

## 安装步骤
\`\`\`bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
\`\`\`

## 项目结构
\`\`\`
src/
├── assets/      # 静态资源
├── components/  # 组件
├── router/      # 路由配置
├── stores/      # Pinia状态
├── views/       # 页面
└── App.vue      # 根组件
\`\`\`

## API文档
| 接口 | 方法 | 描述 |
|------|------|------|
| /api/users | GET | 获取用户列表 |
| /api/users/:id | GET | 获取单个用户 |
| /api/users | POST | 创建用户 |

## 常见问题
1. **问题**: 启动失败
   **解决**: 检查Node.js版本是否>=14.0.0

2. **问题**: 构建错误
   **解决**: 清除node_modules并重新安装依赖
`,
    },
    {
      name: "博客文章",
      content: `# Vue3 组合式API的优势与实践

## 引言
Vue3的组合式API（Composition API）为开发者提供了更灵活的代码组织方式。本文将探讨其优势并分享实践经验。

## 组合式API的主要优势

### 1. 更好的代码组织
组合式API允许我们按照逻辑关注点组织代码，而不是选项式API中按照选项类型。

### 2. 更好的类型推断
TypeScript与组合式API配合使用时，提供了更好的类型推断。

### 3. 更小的包体积
通过摇树优化，未使用的API可以在生产构建中被移除。

## 实践示例

\`\`\`javascript
import { ref, computed, onMounted } from 'vue'

export default {
  setup() {
    // 状态
    const count = ref(0)
    
    // 计算属性
    const doubleCount = computed(() => count.value * 2)
    
    // 方法
    function increment() {
      count.value++
    }
    
    // 生命周期钩子
    onMounted(() => {
      console.log('组件已挂载')
    })
    
    // 暴露给模板
    return {
      count,
      doubleCount,
      increment
    }
  }
}
\`\`\`

## 最佳实践

1. **使用ref()和reactive()**：根据数据类型选择合适的响应式API
2. **提取可复用的逻辑**：将相关功能提取到组合函数中
3. **保持setup()函数简洁**：通过组合函数拆分复杂逻辑

## 结论
组合式API为Vue开发带来了更大的灵活性和可维护性，特别适合构建大型应用。

---
作者: Vue爱好者
日期: ${new Date().toLocaleDateString()}
`,
    },
  ],
  // 工具栏选项
  toolbarOptions: [
    { name: "heading", icon: "ri:heading", tooltip: "标题" },
    { name: "bold", icon: "ri:bold", tooltip: "粗体" },
    { name: "italic", icon: "ri:italic", tooltip: "斜体" },
    { name: "strikethrough", icon: "ri:strikethrough", tooltip: "删除线" },
    { name: "divider1", type: "divider" },
    { name: "quote", icon: "ri:double-quotes-l", tooltip: "引用" },
    { name: "code", icon: "ri:code-line", tooltip: "代码" },
    { name: "codeblock", icon: "ri:code-box-line", tooltip: "代码块" },
    { name: "divider2", type: "divider" },
    { name: "ul", icon: "ri:list-unordered", tooltip: "无序列表" },
    { name: "ol", icon: "ri:list-ordered", tooltip: "有序列表" },
    { name: "task", icon: "ri:checkbox-line", tooltip: "任务列表" },
    { name: "divider3", type: "divider" },
    { name: "link", icon: "ri:link", tooltip: "链接" },
    { name: "image", icon: "ri:image-line", tooltip: "图片" },
    { name: "table", icon: "ri:table-line", tooltip: "表格" },
    { name: "divider4", type: "divider" },
    { name: "hr", icon: "ri:separator", tooltip: "分隔线" },
  ],
});

// 编辑器DOM引用
const editorRef = ref(null);
const previewRef = ref(null);

// 自动保存定时器
let autoSaveTimer = null;

// 计算属性：字数统计
const wordCount = computed(() => {
  const text = env.markdownText || "";
  return {
    characters: text.length,
    words: text.trim() ? text.trim().split(/\s+/).length : 0,
    lines: text ? text.split("\n").length : 0,
  };
});

// 更新预览
const updatePreview = () => {
  if (env.settings.autoPreview) {
    env.previewHtml = md.render(env.markdownText || "");
    env.unsavedChanges = true;

    // 高亮代码块
    setTimeout(() => {
      if (previewRef.value) {
        const codeBlocks = previewRef.value.querySelectorAll("pre code");
        codeBlocks.forEach((block) => {
          Prism.highlightElement(block);
        });
      }
    }, 0);
  }
};

// 监听markdown文本变化，更新预览
watch(
  () => env.markdownText,
  () => {
    updatePreview();

    // 设置自动保存
    if (env.settings.autoSave) {
      if (autoSaveTimer) clearTimeout(autoSaveTimer);
      autoSaveTimer = setTimeout(() => {
        saveToLocalStorage();
      }, 2000);
    }
  }
);

// 保存到本地存储
const saveToLocalStorage = () => {
  try {
    localStorage.setItem("markdown-editor-content", env.markdownText);
    localStorage.setItem("markdown-editor-filename", env.currentFileName);
    localStorage.setItem("markdown-editor-settings", JSON.stringify(env.settings));
    env.unsavedChanges = false;
    message("已自动保存", { type: "success" });
  } catch (e) {
    console.error("保存到本地存储失败:", e);
  }
};

// 从本地存储加载
const loadFromLocalStorage = () => {
  try {
    const savedContent = localStorage.getItem("markdown-editor-content");
    const savedFilename = localStorage.getItem("markdown-editor-filename");
    const savedSettings = localStorage.getItem("markdown-editor-settings");

    if (savedContent) {
      env.markdownText = savedContent;
    }

    if (savedFilename) {
      env.currentFileName = savedFilename;
    }

    if (savedSettings) {
      env.settings = { ...env.settings, ...JSON.parse(savedSettings) };
    }

    updatePreview();
  } catch (e) {
    console.error("从本地存储加载失败:", e);
  }
};

// 添加到历史记录
const addToHistory = () => {
  const now = new Date();
  const historyItem = {
    id: now.getTime(),
    date: now.toLocaleString(),
    filename: env.currentFileName,
    content: env.markdownText,
    preview: env.markdownText.substring(0, 100) + (env.markdownText.length > 100 ? "..." : ""),
  };

  env.history.unshift(historyItem);

  // 限制历史记录数量
  if (env.history.length > 10) {
    env.history.pop();
  }

  // 保存到本地存储
  try {
    localStorage.setItem("markdown-editor-history", JSON.stringify(env.history));
  } catch (e) {
    console.error("保存历史记录失败:", e);
  }
};

// 从历史记录加载
const loadFromHistory = (item) => {
  env.markdownText = item.content;
  env.currentFileName = item.filename;
  updatePreview();
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

// 导出Markdown文件
const exportMarkdown = () => {
  const blob = new Blob([env.markdownText], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = env.currentFileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  message("导出成功", { type: "success" });
};

// 导出HTML文件
const exportHtml = () => {
  const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${env.currentFileName.replace(/\.md$/, "")}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      padding: 20px;
      max-width: 800px;
      margin: 0 auto;
      color: var(--el-text-color-primary);
    }
    pre {
      background: var(--el-bg-color-overlay);
      padding: 16px;
      border-radius: 4px;
      overflow-x: auto;
    }
    code {
      font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
      font-size: 85%;
    }
    blockquote {
      margin: 0;
      padding-left: 16px;
      border-left: 4px solid #ddd;
      color: var(--el-text-color-primary);
    }
    img {
      max-width: 100%;
    }
    table {
      border-collapse: collapse;
      width: 100%;
    }
    table, th, td {
      border: 1px solid #ddd;
    }
    th, td {
      padding: 8px;
      text-align: left;
    }
    th {
      background: var(--el-bg-color-overlay);
    }
  </style>
</head>
<body>
  ${env.previewHtml}
</body>
</html>`;

  const blob = new Blob([htmlContent], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = env.currentFileName.replace(/\.md$/, ".html");
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  message("导出成功", { type: "success" });
};

// 导入Markdown文件
const importMarkdown = (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    env.markdownText = e.target.result;
    env.currentFileName = file.name;
    updatePreview();
    message("导入成功", { type: "success" });
    // 重置文件输入，以便可以重复导入相同的文件
    event.target.value = "";
  };
  reader.readAsText(file);
};

// 清空编辑器
const clearEditor = () => {
  env.markdownText = "";
  env.currentFileName = "untitled.md";
  updatePreview();
  message("已清空编辑器", { type: "success" });
};

// 应用模板
const applyTemplate = (template) => {
  if (env.markdownText && env.unsavedChanges) {
    message("您有未保存的更改，应用模板将覆盖当前内容", { type: "warning" });
  }
  env.markdownText = template.content;
  updatePreview();
  message(`已应用"${template.name}"模板`, { type: "success" });
};

// 插入工具栏项
const insertToolbarItem = (item) => {
  if (!editorRef.value) return;

  const editor = editorRef.value;
  const selectionStart = editor.selectionStart;
  const selectionEnd = editor.selectionEnd;
  const selectedText = env.markdownText.substring(selectionStart, selectionEnd);

  let insertText = "";

  switch (item.name) {
    case "heading":
      insertText = selectedText ? `# ${selectedText}` : "# 标题";
      break;
    case "bold":
      insertText = selectedText ? `**${selectedText}**` : "**粗体文本**";
      break;
    case "italic":
      insertText = selectedText ? `*${selectedText}*` : "*斜体文本*";
      break;
    case "strikethrough":
      insertText = selectedText ? `~~${selectedText}~~` : "~~删除线文本~~";
      break;
    case "quote":
      insertText = selectedText ? `> ${selectedText.split("\n").join("\n> ")}` : "> 引用文本";
      break;
    case "code":
      insertText = selectedText ? `\`${selectedText}\`` : "`代码`";
      break;
    case "codeblock":
      insertText = selectedText ? "```\n" + selectedText + "\n```" : "```\n代码块\n```";
      break;
    case "ul":
      insertText = selectedText
        ? selectedText
            .split("\n")
            .map((line) => `- ${line}`)
            .join("\n")
        : "- 列表项\n- 列表项\n- 列表项";
      break;
    case "ol":
      insertText = selectedText
        ? selectedText
            .split("\n")
            .map((line, i) => `${i + 1}. ${line}`)
            .join("\n")
        : "1. 列表项\n2. 列表项\n3. 列表项";
      break;
    case "task":
      insertText = selectedText
        ? selectedText
            .split("\n")
            .map((line) => `- [ ] ${line}`)
            .join("\n")
        : "- [ ] 任务\n- [ ] 任务\n- [x] 已完成任务";
      break;
    case "link":
      insertText = selectedText ? `[${selectedText}](链接URL)` : "[链接文本](链接URL)";
      break;
    case "image":
      insertText = "![图片描述](图片URL)";
      break;
    case "table":
      insertText = "| 标题1 | 标题2 | 标题3 |\n| --- | --- | --- |\n| 单元格1 | 单元格2 | 单元格3 |\n| 单元格4 | 单元格5 | 单元格6 |";
      break;
    case "hr":
      insertText = "\n---\n";
      break;
  }

  if (insertText) {
    const newText = env.markdownText.substring(0, selectionStart) + insertText + env.markdownText.substring(selectionEnd);
    env.markdownText = newText;

    // 设置光标位置
    setTimeout(() => {
      editor.focus();
      const newCursorPos = selectionStart + insertText.length;
      editor.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  }
};

// 切换设置
const toggleSetting = (setting) => {
  env.settings[setting] = !env.settings[setting];

  // 保存设置到本地存储
  localStorage.setItem("markdown-editor-settings", JSON.stringify(env.settings));

  // 如果切换了自动预览，需要更新预览
  if (setting === "autoPreview" && env.settings.autoPreview) {
    updatePreview();
  }
};

// 组件挂载时初始化
onMounted(() => {
  // 从本地存储加载内容和设置
  loadFromLocalStorage();

  // 从本地存储加载历史记录
  try {
    const savedHistory = localStorage.getItem("markdown-editor-history");
    if (savedHistory) {
      env.history = JSON.parse(savedHistory);
    }
  } catch (e) {
    console.error("加载历史记录失败:", e);
  }

  // 初始化语法高亮
  updatePreview();
});

// 组件卸载前清理
onBeforeUnmount(() => {
  if (autoSaveTimer) {
    clearTimeout(autoSaveTimer);
    autoSaveTimer = null;
  }

  // 如果有未保存的更改，保存一次
  if (env.unsavedChanges) {
    saveToLocalStorage();
  }
});
</script>

<template>
  <div class="markdown-tool" :class="{ 'dark-mode': env.settings.darkMode }">
    <div class="markdown-tool__content">
      <!-- 头部信息 -->
      <div class="markdown-tool__header-container">
        <div class="markdown-tool__header">
          <div class="markdown-tool__header-inner">
            <h1 class="markdown-tool__header-title">Markdown编辑器</h1>
            <p class="markdown-tool__header-subtitle">实时编辑与预览Markdown文档</p>
          </div>
          <div class="markdown-tool__header-decoration">
            <div class="markdown-tool__header-circle"></div>
            <div class="markdown-tool__header-circle"></div>
            <div class="markdown-tool__header-circle"></div>
          </div>
        </div>
      </div>

      <!-- 工具栏 -->
      <div class="markdown-tool__toolbar">
        <div class="markdown-tool__toolbar-group">
          <div v-for="item in env.toolbarOptions" :key="item.name" :class="['markdown-tool__toolbar-item', { 'markdown-tool__toolbar-divider': item.type === 'divider' }]" v-tooltip="item.tooltip" @click="item.type !== 'divider' && insertToolbarItem(item)">
            <IconifyIconOnline v-if="item.type !== 'divider'" :icon="item.icon" />
          </div>
        </div>

        <div class="markdown-tool__toolbar-actions">
          <!-- 文件名输入 -->
          <el-input v-model="env.currentFileName" placeholder="文件名" size="small" class="markdown-tool__filename-input" />

          <!-- 导入按钮 -->
          <el-tooltip content="导入Markdown文件" placement="top">
            <el-button type="primary" size="small" @click="$refs.fileInput.click()">
              <IconifyIconOnline icon="ri:file-upload-line" />
            </el-button>
          </el-tooltip>
          <input ref="fileInput" type="file" accept=".md,.markdown,.txt" style="display: none" @change="importMarkdown" />

          <!-- 导出下拉菜单 -->
          <el-dropdown trigger="click">
            <el-button type="primary" size="small">
              <IconifyIconOnline icon="ri:file-download-line" />
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="exportMarkdown">
                  <IconifyIconOnline icon="ri:markdown-line" />
                  <span>导出为Markdown</span>
                </el-dropdown-item>
                <el-dropdown-item @click="exportHtml">
                  <IconifyIconOnline icon="ri:html5-line" />
                  <span>导出为HTML</span>
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>

          <!-- 设置下拉菜单 -->
          <el-dropdown trigger="click">
            <el-button size="small">
              <IconifyIconOnline icon="ri:settings-line" />
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="toggleSetting('autoSave')">
                  <IconifyIconOnline :icon="env.settings.autoSave ? 'ri:checkbox-circle-fill' : 'ri:checkbox-blank-circle-line'" />
                  <span>自动保存</span>
                </el-dropdown-item>
                <el-dropdown-item @click="toggleSetting('autoPreview')">
                  <IconifyIconOnline :icon="env.settings.autoPreview ? 'ri:checkbox-circle-fill' : 'ri:checkbox-blank-circle-line'" />
                  <span>实时预览</span>
                </el-dropdown-item>
                <el-dropdown-item @click="toggleSetting('lineNumbers')">
                  <IconifyIconOnline :icon="env.settings.lineNumbers ? 'ri:checkbox-circle-fill' : 'ri:checkbox-blank-circle-line'" />
                  <span>显示行号</span>
                </el-dropdown-item>
                <el-dropdown-item @click="toggleSetting('wordWrap')">
                  <IconifyIconOnline :icon="env.settings.wordWrap ? 'ri:checkbox-circle-fill' : 'ri:checkbox-blank-circle-line'" />
                  <span>自动换行</span>
                </el-dropdown-item>
                <el-dropdown-item @click="toggleSetting('darkMode')">
                  <IconifyIconOnline :icon="env.settings.darkMode ? 'ri:checkbox-circle-fill' : 'ri:checkbox-blank-circle-line'" />
                  <span>暗色模式</span>
                </el-dropdown-item>
                <el-dropdown-item divided>
                  <span>字体大小</span>
                  <el-slider v-model="env.settings.fontSize" :min="12" :max="20" :step="1" style="width: 120px; margin-left: 10px" />
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>

          <!-- 模板下拉菜单 -->
          <el-dropdown trigger="click">
            <el-button size="small">
              <IconifyIconOnline icon="ri:file-list-line" />
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item v-for="template in env.templates" :key="template.name" @click="applyTemplate(template)">
                  <IconifyIconOnline icon="ri:file-text-line" />
                  <span>{{ template.name }}</span>
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>

          <!-- 清空按钮 -->
          <el-tooltip content="清空编辑器" placement="top">
            <el-button size="small" @click="clearEditor">
              <IconifyIconOnline icon="ri:delete-bin-line" />
            </el-button>
          </el-tooltip>
        </div>
      </div>

      <!-- 编辑器和预览区域 -->
      <el-row :gutter="16" class="markdown-tool__main">
        <!-- 编辑器区域 -->
        <el-col :xs="24" :sm="24" :md="12" :lg="12">
          <div class="markdown-tool__editor-container">
            <div class="markdown-tool__editor-header">
              <IconifyIconOnline icon="ri:edit-line" />
              <span>编辑</span>
            </div>
            <textarea
              ref="editorRef"
              v-model="env.markdownText"
              class="markdown-tool__editor"
              :class="{
                'line-numbers': env.settings.lineNumbers,
                'word-wrap': env.settings.wordWrap,
              }"
              :style="{ fontSize: `${env.settings.fontSize}px` }"
              placeholder="在此输入Markdown内容..."
            ></textarea>
            <div class="markdown-tool__editor-footer">
              <div class="markdown-tool__word-count">
                <span>{{ wordCount.characters }} 字符</span>
                <span>{{ wordCount.words }} 单词</span>
                <span>{{ wordCount.lines }} 行</span>
              </div>
              <div class="markdown-tool__status">
                <span v-if="env.unsavedChanges" class="markdown-tool__status-unsaved">未保存</span>
                <span v-else class="markdown-tool__status-saved">已保存</span>
              </div>
            </div>
          </div>
        </el-col>

        <!-- 预览区域 -->
        <el-col :xs="24" :sm="24" :md="12" :lg="12">
          <div class="markdown-tool__preview-container">
            <div class="markdown-tool__preview-header">
              <IconifyIconOnline icon="ri:eye-line" />
              <span>预览</span>
              <div class="markdown-tool__preview-actions">
                <el-tooltip content="复制HTML" placement="top">
                  <el-button type="primary" link size="small" @click="copyToClipboard(env.previewHtml)">
                    <IconifyIconOnline icon="ri:file-copy-line" />
                  </el-button>
                </el-tooltip>
              </div>
            </div>
            <div ref="previewRef" class="markdown-tool__preview markdown-body" :class="{ 'word-wrap': env.settings.wordWrap }" :style="{ fontSize: `${env.settings.fontSize}px` }" v-html="env.previewHtml"></div>
            <div class="markdown-tool__preview-footer">
              <span>预览模式</span>
            </div>
          </div>
        </el-col>
      </el-row>

      <!-- 历史记录 -->
      <el-card class="markdown-tool__history-card" shadow="hover">
        <template #header>
          <div class="markdown-tool__card-header">
            <IconifyIconOnline icon="ri:history-line" class="markdown-tool__card-icon" />
            <span>历史记录</span>
          </div>
        </template>

        <el-empty v-if="!env.history.length" description="暂无历史记录" class="markdown-tool__empty">
          <template #image>
            <IconifyIconOnline icon="ri:history-line" class="markdown-tool__empty-icon" />
          </template>
        </el-empty>

        <el-table v-else :data="env.history" style="width: 100%">
          <el-table-column prop="date" label="日期" width="180" />
          <el-table-column prop="filename" label="文件名" width="180" />
          <el-table-column prop="preview" label="预览" show-overflow-tooltip />
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
.markdown-tool {
  padding: 20px;
}

.markdown-tool__content {
  margin: 0 auto;
}

.markdown-tool__header-container {
  margin-bottom: 24px;
}

.markdown-tool__header {
  background: linear-gradient(135deg, var(--app-primary) 0%, var(--app-primary-dark) 100%);
  border-radius: 8px;
  padding: 24px;
  color: var(--app-text-primary);
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: var(--app-shadow-lg);
  position: relative;
  overflow: hidden;
}

.markdown-tool__header-title {
  font-size: 28px;
  margin: 0 0 8px 0;
}

.markdown-tool__header-subtitle {
  font-size: 16px;
  opacity: 0.8;
  margin: 0;
}

.markdown-tool__header-decoration {
  display: flex;
  gap: 8px;
}

.markdown-tool__header-circle {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.5);
}

.markdown-tool__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: var(--app-bg-secondary);
  border: 1px solid var(--app-border-primary);
  border-radius: 8px;
  padding: 8px 16px;
  margin-bottom: 16px;
}

.markdown-tool__toolbar-group {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
}

.markdown-tool__toolbar-item {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.markdown-tool__toolbar-item:hover {
  background-color: var(--app-border-primary);
}

.markdown-tool__toolbar-divider {
  width: 1px;
  height: 24px;
  background-color: var(--app-border-primary);
  margin: 0 4px;
  cursor: default;
}

.markdown-tool__toolbar-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.markdown-tool__filename-input {
  width: 200px;
}

.markdown-tool__main {
  margin-bottom: 24px;
}

.markdown-tool__editor-container,
.markdown-tool__preview-container {
  display: flex;
  flex-direction: column;
  height: 600px;
  border: 1px solid var(--app-border-primary);
  border-radius: 8px;
  overflow: hidden;
}

.markdown-tool__editor-header,
.markdown-tool__preview-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background-color: var(--app-bg-secondary);
  border-bottom: 1px solid var(--app-border-primary);
  font-weight: 500;
}

.markdown-tool__preview-actions {
  margin-left: auto;
}

.markdown-tool__editor {
  flex: 1;
  padding: 16px;
  font-family: monospace;
  resize: none;
  border: none;
  outline: none;
  background-color: var(--app-bg-primary);
  overflow: auto;
}

.markdown-tool__preview {
  flex: 1;
  padding: 16px;
  overflow: auto;
  background-color: var(--app-bg-primary);
}

.markdown-tool__editor-footer,
.markdown-tool__preview-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  background-color: var(--app-bg-secondary);
  border-top: 1px solid var(--app-border-primary);
  font-size: 12px;
  color: var(--app-text-tertiary);
}

.markdown-tool__word-count {
  display: flex;
  gap: 16px;
}

.markdown-tool__status-unsaved {
  color: var(--app-danger);
}

.markdown-tool__status-saved {
  color: var(--app-success);
}

.markdown-tool__card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
}

.markdown-tool__card-icon {
  color: var(--el-color-primary);
}

.markdown-tool__history-card {
  margin-bottom: 24px;
}

.markdown-tool__empty {
  padding: 40px 0;
}

.markdown-tool__empty-icon {
  font-size: 48px;
  color: var(--app-text-disabled);
}

/* 行号样式 */
.markdown-tool__editor.line-numbers {
  padding-left: 3.5em;
  counter-reset: line;
  position: relative;
}

.markdown-tool__editor.line-numbers::before {
  content: "";
  position: absolute;
  top: 0;
  left: 3em;
  bottom: 0;
  width: 1px;
  background-color: var(--app-border-primary);
}

.markdown-tool__editor.line-numbers::after {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  width: 3em;
  background-color: var(--app-bg-secondary);
  border-right: 1px solid var(--app-border-primary);
}

/* 自动换行 */
.markdown-tool__editor.word-wrap,
.markdown-tool__preview.word-wrap {
  white-space: pre-wrap;
  word-wrap: break-word;
}

/* 暗色模式 */
.markdown-tool.dark-mode {
  background-color: var(--app-bg-primary);
  color: var(--app-text-primary);
}

.markdown-tool.dark-mode .markdown-tool__toolbar,
.markdown-tool.dark-mode .markdown-tool__editor-header,
.markdown-tool.dark-mode .markdown-tool__preview-header,
.markdown-tool.dark-mode .markdown-tool__editor-footer,
.markdown-tool.dark-mode .markdown-tool__preview-footer {
  background-color: var(--app-bg-secondary);
  border-color: var(--app-border-primary);
}

.markdown-tool.dark-mode .markdown-tool__toolbar-divider {
  background-color: var(--app-border-primary);
}

.markdown-tool.dark-mode .markdown-tool__toolbar-item:hover {
  background-color: var(--app-border-primary);
}

.markdown-tool.dark-mode .markdown-tool__editor,
.markdown-tool.dark-mode .markdown-tool__preview {
  background-color: var(--app-bg-primary);
  color: var(--app-text-primary);
}

.markdown-tool.dark-mode .markdown-tool__editor.line-numbers::after {
  background-color: var(--app-bg-secondary);
  border-color: var(--app-border-primary);
}

.markdown-tool.dark-mode .markdown-tool__editor.line-numbers::before {
  background-color: var(--app-border-primary);
}

/* 响应式调整 */
@media (max-width: 768px) {
  .markdown-tool__toolbar {
    flex-direction: column;
    gap: 16px;
  }

  .markdown-tool__toolbar-actions {
    width: 100%;
    justify-content: space-between;
  }

  .markdown-tool__filename-input {
    width: 100%;
  }

  .markdown-tool__editor-container,
  .markdown-tool__preview-container {
    height: 400px;
    margin-bottom: 16px;
  }
}
</style>.../hook/useMarkdownIt/useMarkdownIt
