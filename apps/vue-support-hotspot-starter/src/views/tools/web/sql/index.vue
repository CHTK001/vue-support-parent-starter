<template>
  <div class="page flex flex-col h-full">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <div class="title-section">
          <h1 class="page-title">
            <IconifyIconOnline icon="ri:code-s-slash-line" class="title-icon" />
            SQL 格式化工具
          </h1>
          <p class="page-subtitle">格式化和解析 SQL 语句</p>
        </div>
      </div>
    </div>

    <!-- 内容区域 -->
    <div class="flex-1 overflow-hidden">
      <el-card shadow="never" class="h-full">
        <div class="toolbar-section">
          <el-segmented
            v-model="setting.type"
            :options="[
              { label: '格式化', value: '0' },
              { label: '解析SQL', value: '1' },
              { label: '清空', value: '-1' }
            ]"
            @change="handle"
          />
        </div>
        <el-row :gutter="16" class="sql-editor-row">
          <el-col :span="10">
            <div class="editor-header">
              <IconifyIconOnline icon="ri:file-edit-line" class="editor-icon" />
              <span>输入 SQL</span>
            </div>
            <el-input v-model="oldSql" type="textarea" :rows="25" class="sql-textarea" placeholder="请输入 SQL 语句..." />
          </el-col>
          <el-col :span="2" class="flex items-center justify-center">
            <el-button type="primary" circle size="large" :icon="useRenderIcon('ep:d-arrow-right')" @click="handle" />
          </el-col>
          <el-col :span="12">
            <div class="editor-header">
              <IconifyIconOnline icon="ri:code-box-line" class="editor-icon" />
              <span>格式化结果</span>
            </div>
            <pre ref="sqlPre" class="sql-result"><code class="language-sql line-numbers">{{ newSql }}</code></pre>
          </el-col>
        </el-row>
      </el-card>
    </div>
  </div>
</template>
<script setup>
import { format } from "sql-formatter";
import { inject, reactive, unref, nextTick, ref } from "vue";
// 引入Prism.js
import Prism from "prismjs";
// 引入SQL语言插件
import "prismjs/components/prism-sql.min.js";
import "prismjs/themes/prism-tomorrow.min.css";
import "prismjs/plugins/line-numbers/prism-line-numbers.min.css";
import "prismjs/plugins/line-highlight/prism-line-highlight.min.css";
import "prismjs/plugins/inline-color/prism-inline-color.min.css";
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
const setting = reactive({
  type: "0"
});
const oldSql = ref("select field1,field2,field3 from my_table where my_condition;");
const newSql = ref("select field1,field2,field3 from my_table where my_condition;");

const handle = () => {
  try {
    if (setting.type == "0") {
      return handleFormat();
    }
    if (setting.type == "1") {
      return handleAnalysis();
    }
    if (setting.type == "-1") {
      newSql.value = "";
      oldSql.value = "";
    }
  } catch (e) {}
};
const handleAnalysis = () => {
  // 提取SQL查询部分
  const sqlPart = oldSql.value.match(/Preparing: (.*)/)[1];

  // 提取参数部分
  const paramsPart = oldSql.value.match(/Parameters: (.*)/)[1].replace(/\(.*?\)/g, "");

  // 将参数插入SQL查询中
  const paramsArray = paramsPart.split(", ").map(param => param.trim());
  let completeSql = sqlPart;
  paramsArray.forEach((param, index) => {
    completeSql = completeSql.replace("?", param);
  });

  newSql.value = format(completeSql);
  handlePrism();
};
const handleFormat = () => {
  newSql.value = format(oldSql.value);
  handlePrism();
};
const handlePrism = async () => {
  setTimeout(async () => {
    Prism.highlightAll();
    // 假设你的SQL代码在模板的pre标签中
    // 使用Prism.highlightElement来高亮代码
    try {
      document.querySelectorAll("pre code").forEach(ele => {
        Prism.highlightElement(ele);
      });
    } catch (error) {}
  }, 300);
};
handlePrism();
</script>

<style scoped lang="scss">
.page {
  padding: 0;
  background: var(--el-bg-color-page);
}

.page-header {
  background: linear-gradient(135deg, var(--el-color-primary-light-9) 0%, var(--el-color-primary-light-8) 100%);
  padding: 24px 32px;
  border-radius: 8px;
  margin-bottom: 16px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.page-title {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 24px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin: 0 0 8px 0;

  .title-icon {
    font-size: 28px;
    color: var(--el-color-primary);
  }
}

.page-subtitle {
  color: var(--el-text-color-regular);
  font-size: 14px;
  margin: 0;
}

.toolbar-section {
  margin-bottom: 16px;
}

.sql-editor-row {
  height: calc(100% - 60px);
}

.editor-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: var(--el-fill-color-light);
  border-radius: 4px;
  margin-bottom: 12px;
  font-weight: 600;
  color: var(--el-text-color-primary);

  .editor-icon {
    font-size: 18px;
    color: var(--el-color-primary);
  }
}

.sql-textarea {
  :deep(.el-textarea__inner) {
    font-family: "Courier New", monospace;
    font-size: 13px;
    border-radius: 4px;
  }
}

.sql-result {
  background: var(--el-fill-color-light);
  padding: 16px;
  border-radius: 4px;
  font-family: "Courier New", monospace;
  font-size: 13px;
  line-height: 1.6;
  overflow-x: auto;
  max-height: calc(100% - 60px);
  margin: 0;
}

:deep(.el-card) {
  border-radius: 8px;

  .el-card__body {
    height: 100%;
  }
}
</style>
