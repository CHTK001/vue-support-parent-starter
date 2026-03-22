<template>
  <div class="page flex flex-col h-full">
    <!-- 页面标题 -->
    <div class="page-header">
      <div class="header-content">
        <div class="title-section">
          <h1 class="page-title">
            <IconifyIconOnline icon="ri:box-3-line" class="title-icon" />
            对象监控
          </h1>
          <p class="page-subtitle">查看和管理系统对象信息</p>
        </div>
      </div>
    </div>

    <!-- 搜索栏 -->
    <div class="toolbar">
      <ScInput v-model="filterName" placeholder="搜索类名..." clearable class="search-input" @keyup.enter="handleQuery">
        <template #prefix>
          <IconifyIconOnline icon="ep:search" />
        </template>
      </ScInput>
      <ScButton type="primary" @click="handleQuery">
        <IconifyIconOnline icon="ep:search" class="mr-1" />
        搜索
      </ScButton>
    </div>

    <!-- 表格区域 -->
    <div class="flex-1 overflow-hidden">
      <ScTable ref="tableRef" :url="fetchData" fixed :filter="filter" :page-size="10" height="100%">
        <ScTableColumn type="index" label="#" width="60" align="center" />
        <ScTableColumn label="类名" prop="name" min-width="300">
          <template #default="{ row }">
            <div class="flex items-center gap-2">
              <IconifyIconOnline icon="ri:code-box-line" class="text-primary" />
              <span class="font-mono text-sm" v-html="row.name" />
            </div>
          </template>
        </ScTableColumn>
        <ScTableColumn label="已加载数" prop="count" width="120" align="center">
          <template #default="{ row }">
            <ScTag type="info" size="small">{{ row.count }}</ScTag>
          </template>
        </ScTableColumn>
        <ScTableColumn label="操作" width="120" align="center" fixed="right">
          <template #default="{ row }">
            <ScButton link type="primary" @click="handleView(row)">
              <IconifyIconOnline icon="ri:eye-line" class="mr-1" />
              查看
            </ScButton>
          </template>
        </ScTableColumn>
      </ScTable>
    </div>

    <sc-dialog v-model="config.visibleCfrVisible" title="详情" draggable :close-on-click-modal="false" @close="handleClose">
      <ScSkeleton animated :loading="config.visibleCfrLoading" />
      <div v-if="!config.visibleCfrLoading">
        <pre ref="code" data-prismjs-copy="复制代码" data-prismjs-copy-success="复制成功" data-prismjs-copy-timeout="1000">
          <code class="language-java highlight-keywords show-language">
            {{ viewContent }}
          </code>
        </pre>
      </div>
    </sc-dialog>
  </div>
</template>
<script setup>
// 引入Prism.js
import { useRenderIcon } from "@repo/components/ReIcon";

import Prism from "prismjs";
import "prismjs/themes/prism-tomorrow.min.css";
import "prismjs/components/prism-java.min.js";
import "prismjs/components/prism-groovy.min.js";
import "prismjs/plugins/line-numbers/prism-line-numbers.min.css";
import "prismjs/plugins/line-highlight/prism-line-highlight.min.css";
import "prismjs/plugins/inline-color/prism-inline-color.min.css";

import { http } from "@repo/utils";
import { onBeforeMount, reactive, ref, computed, onUnmounted } from "vue";
import { wsService } from "@/utils/websocket";
const filterName = ref("");
const tableRef = ref();
const viewContent = ref();
const url = ref();
const code = ref();
const detailUrl = ref();
const config = reactive({
  visibleCfrVisible: false,
  visibleCfrLoading: false
});
let unsubscribe = null;

// 处理 WebSocket 消息
const handleWsMessage = message => {
  if (message.event === "OBJECT_INFO") {
    // 刷新表格数据
    tableRef.value?.refresh();
  }
};

onBeforeMount(async () => {
  url.value = (window.agentPath || "/agent") + "/object_info";
  detailUrl.value = (window.agentPath || "/agent") + "/cfr";
  window.addEventListener("keydown", handleKeydown);
  // 订阅 WebSocket 消息
  wsService.connect();
  unsubscribe = wsService.subscribe("JVM", "OBJECT_INFO", handleWsMessage);
});

onUnmounted(() => {
  window.removeEventListener("keydown", handleKeydown);
  if (unsubscribe) {
    unsubscribe();
  }
});

const handleClose = async () => {
  config.visibleCfrVisible = false;
  config.visibleCfrLoading = false;
};
const handleView = row => {
  config.visibleCfrVisible = true;
  config.visibleCfrLoading = true;
  const params = { name: row.id };
  http
    .request("get", detailUrl.value, {
      params
    })
    .then(res => {
      viewContent.value = res.data;
      setTimeout(() => {
        Prism.highlightAll();
        // 使用Prism.highlightElement来高亮代码
        try {
          Prism.highlightElement(code);
        } catch (error) {}
      }, 300);
    })
    .finally(() => {
      config.visibleCfrLoading = false;
    });
};
const handleKeydown = async e => {
  if (e.keyCode === 13) {
    e.preventDefault();
    e.stopPropagation();
    handleQuery();
    return false;
  }
};
const handleQuery = () => {
  tableRef.value.refresh();
};
const fetchData = async params => {
  params.filterName = filterName.value;
  return http.request("get", url.value, { params });
};
</script>
<style scoped lang="scss">
.page {
  padding: 0;
  background: var(--el-bg-color-page);
}

.page-header {
  padding: 24px 32px;
  margin-bottom: 16px;
  background: linear-gradient(135deg, var(--el-color-primary-light-9) 0%, var(--el-color-primary-light-8) 100%);
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgb(0 0 0 / 5%);
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.page-title {
  display: flex;
  gap: 12px;
  align-items: center;
  margin: 0 0 8px;
  font-size: 24px;
  font-weight: 600;
  color: var(--el-text-color-primary);

  .title-icon {
    font-size: 28px;
    color: var(--el-color-primary);
  }
}

.page-subtitle {
  margin: 0;
  font-size: 14px;
  color: var(--el-text-color-regular);
}

.toolbar {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;

  .search-input {
    width: 300px;
  }
}

:deep(.el-card) {
  border-radius: 8px;
}

.counter {
  counter-reset: counter;
}

:deep(.row-expand-unhas .el-table__expand-icon--expanded) {
  display: none !important;
}

.item::before {
  top: 10px;
  right: 50%;
  display: inline-block;
  width: 24px;
  height: 24px;
  font-size: 1.2em;
  color: var(--el-text-color-regular);
  text-align: center;
  vertical-align: middle;
  content: counter(counter);
  counter-increment: counter;
  background-color: var(--el-color-info-light-7);
  border-radius: 50%;
}
</style>
