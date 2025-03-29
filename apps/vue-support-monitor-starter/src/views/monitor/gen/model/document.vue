<template>
  <div class="document-container">
    <!-- 保持对话框部分不变 -->
    <el-dialog v-model="visible" :title="title" draggable class="document-dialog h-[90vh]" top="5vh" width="50%" destroy-on-close @close="onClose">
      <!-- 保持工具栏部分不变 -->
      <div class="document-toolbar">
        <!-- 工具栏内容不变 -->
      </div>

      <div class="document-content">
        <el-empty v-if="!showStatus" description="暂无文档数据" class="document-empty">
          <template #image>
            <IconifyIconOnline icon="ri:file-search-line" class="document-empty__icon" />
          </template>
        </el-empty>

        <div v-else class="document-iframe-wrapper">
          <div v-if="isLoading" class="document-loading">
            <el-skeleton :rows="10" animated />
          </div>
          <iframe v-show="!isLoading" id="bdIframe" ref="iframeRef" class="document-iframe !h-[70vh]" :src="src" frameborder="0" @load="handleIframeLoad" />
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { fetchGenDatabasePreviewDoc } from "@/api/monitor/gen/database";
import { ElMessage } from "element-plus";
import { defineExpose, onBeforeUnmount, reactive, ref } from "vue";

// 组件状态
const visible = ref(false);
const isLoadDatabase = ref(false);
const isLoadDatabaseDownload = ref(false);
const showStatus = ref(false);
const isLoading = ref(true);
const src = ref("");
const title = ref("");
const form = reactive({});
const iframeRef = ref(null);

// 自定义样式，将注入到iframe中
const customStyles = `
  body {
    font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
    line-height: 1.6;
    color: #333;
    padding: 20px;
    background-color: #fff;
  }
  
  h1, h2, h3, h4, h5, h6 {
    color: #409EFF;
    margin-top: 1.5em;
    margin-bottom: 0.8em;
    font-weight: 600;
  }
  
  h1 {
    font-size: 1.8em;
    border-bottom: 2px solid #eaeaea;
    padding-bottom: 10px;
  }
  
  h2 {
    font-size: 1.5em;
    border-bottom: 1px solid #eaeaea;
    padding-bottom: 8px;
  }
  
  h3 {
    font-size: 1.3em;
  }
  
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 20px 0;
    font-size: 14px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
    border-radius: 4px;
    overflow: hidden;
  }
  
  table th {
    background-color: #f5f7fa;
    color: #606266;
    font-weight: 600;
    padding: 12px 10px;
    text-align: left;
  }
  
  table td {
    padding: 12px 10px;
    border-top: 1px solid #ebeef5;
  }
  
  table tr:hover {
    background-color: #f5f7fa;
  }
  
  pre, code {
    font-family: Consolas, Monaco, 'Andale Mono', monospace;
    background-color: #f5f7fa;
    border-radius: 4px;
    padding: 2px 5px;
    font-size: 13px;
    color: #476582;
  }
  
  pre {
    padding: 15px;
    overflow-x: auto;
    line-height: 1.4;
  }
  
  a {
    color: #409EFF;
    text-decoration: none;
  }
  
  a:hover {
    text-decoration: underline;
  }
  
  p {
    margin: 12px 0;
  }
  
  ul, ol {
    padding-left: 24px;
  }
  
  li {
    margin: 8px 0;
  }
  
  .table-container {
    overflow-x: auto;
    margin: 20px 0;
  }
`;

/**
 * 关闭对话框
 * 清理资源并重置状态
 */
const onClose = () => {
  visible.value = false;
  if (src.value) {
    URL.revokeObjectURL(src.value);
    src.value = "";
  }
};

/**
 * 打开对话框
 */
const open = () => {
  visible.value = true;
  return { setData };
};

/**
 * 设置数据
 * @param {Object} data - 数据库信息
 * @returns {Object} - 当前实例，支持链式调用
 */
const setData = data => {
  Object.assign(form, data);

  if (form.genId) {
    showStatus.value = true;
    isLoading.value = true;
    title.value = `${form.genName} [数据库文档]`;

    // 加载文档预览
    loadDocumentPreview();
  }

  return { open };
};

/**
 * 加载文档预览
 */
const loadDocumentPreview = async () => {
  try {
    const newForm = { ...form, type: "html" };
    const res = await fetchGenDatabasePreviewDoc(newForm);

    if (src.value) {
      URL.revokeObjectURL(src.value);
    }

    src.value = URL.createObjectURL(res?.response.data);
  } catch (error) {
    console.error("加载文档预览失败:", error);
    ElMessage.error("加载文档预览失败");
    isLoading.value = false;
  }
};

/**
 * iframe加载完成处理
 * 注入自定义样式到iframe中
 */
const handleIframeLoad = () => {
  isLoading.value = false;

  // 向iframe注入自定义样式
  if (iframeRef.value) {
    try {
      const iframeDocument = iframeRef.value.contentDocument || iframeRef.value.contentWindow.document;

      // 创建样式元素
      const styleElement = iframeDocument.createElement("style");
      styleElement.textContent = customStyles;

      // 将样式添加到iframe的head中
      iframeDocument.head.appendChild(styleElement);

      // 添加打印样式
      const printStyle = iframeDocument.createElement("style");
      printStyle.media = "print";
      printStyle.textContent = `
        @page {
          margin: 1cm;
        }
        body {
          print-color-adjust: exact;
          -webkit-print-color-adjust: exact;
        }
      `;
      iframeDocument.head.appendChild(printStyle);

      // 添加响应式视图元标签
      const metaViewport = iframeDocument.createElement("meta");
      metaViewport.name = "viewport";
      metaViewport.content = "width=device-width, initial-scale=1.0";
      iframeDocument.head.appendChild(metaViewport);
    } catch (error) {
      console.error("注入样式失败:", error);
    }
  }
};

// 其余方法保持不变
const doRefreshDatabase = async () => {
  // 保持原有实现不变
};

const doDownload = async type => {
  // 保持原有实现不变
};

// 组件销毁前清理资源
onBeforeUnmount(() => {
  if (src.value) {
    URL.revokeObjectURL(src.value);
  }
});

// 导出组件方法
defineExpose({
  open,
  setData
});
</script>

<style lang="scss" scoped>
.document-container {
  width: 100%;
}

.document-dialog {
  :deep(.el-dialog__header) {
    margin-right: 0;
    padding: 16px 20px;
    border-bottom: 1px solid var(--el-border-color-lighter);
  }

  :deep(.el-dialog__body) {
    padding: 0;
    height: calc(90vh - 120px);
    display: flex;
    flex-direction: column;
  }

  :deep(.el-dialog__title) {
    font-weight: 600;
    font-size: 18px;
  }
}

.document-toolbar {
  // 保持原有样式不变
}

.document-content {
  flex: 1;
  position: relative;
  overflow: hidden;
}

.document-empty {
  // 保持原有样式不变
}

.document-iframe-wrapper {
  height: 100%;
  position: relative;
  border-radius: 4px;
  overflow: hidden;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

.document-loading {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 20px;
  background-color: var(--el-bg-color);
  z-index: 1;
}

.document-iframe {
  width: 100%;
  height: 100%;
  border: none;
  background-color: white;
  transition: opacity 0.3s ease;

  &:focus {
    outline: none;
  }
}
</style>
