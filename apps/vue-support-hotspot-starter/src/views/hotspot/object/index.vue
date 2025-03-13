<template>
  <div>
    <el-form :inline="true">
      <el-form-item label="" prop="">
        <el-input v-model="filterName" placeholder="搜索" class="!w-[300px]" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" :icon="useRenderIcon('ep:search')" @click="handleQuery" />
      </el-form-item>
    </el-form>
    <ScTable ref="tableRef" :url="fetchData" fixed :filter="filter" height="90%">
      <el-table-column type="index" label="序号" width="80" align="center" />
      <el-table-column label="类" prop="name">
        <template #default="{ row }">
          <span v-html="row.name" />
        </template>
      </el-table-column>
      <el-table-column label="已加载数" prop="count" />
      <el-table-column label="操作">
        <template #default="{ row }">
          <el-button plain circle :icon="useRenderIcon('ri:eye-2-fill')" @click="handleView(row)" />
        </template>
      </el-table-column>
    </ScTable>

    <el-dialog v-model="config.visibleCfrVisible" title="详情" draggable :close-on-click-modal="false" @close="handleClose">
      <el-skeleton animated :loading="config.visibleCfrLoading" />
      <div v-if="!config.visibleCfrLoading">
        <pre ref="code" data-prismjs-copy="复制代码" data-prismjs-copy-success="复制成功" data-prismjs-copy-timeout="1000">
          <code class="language-java highlight-keywords show-language">
            {{ viewContent }}
          </code>
        </pre>
      </div>
    </el-dialog>
  </div>
</template>
<script setup>
// 引入Prism.js
import Prism from "prismjs";
import "prismjs/themes/prism-tomorrow.min.css";
import "prismjs/components/prism-java.min.js";
import "prismjs/components/prism-groovy.min.js";
import "prismjs/plugins/line-numbers/prism-line-numbers.min.css";
import "prismjs/plugins/line-highlight/prism-line-highlight.min.css";
import "prismjs/plugins/inline-color/prism-inline-color.min.css";

import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import { http } from "@repo/utils";
import { onBeforeMount, reactive, ref, computed, onUnmounted } from "vue";
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
onBeforeMount(async () => {
  url.value = (window.agentPath || "/agent") + "/object_info";
  detailUrl.value = (window.agentPath || "/agent") + "/cfr";
  window.addEventListener("keydown", handleKeydown);
});

onUnmounted(() => {
  window.removeEventListener("keydown", handleKeydown);
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
<style lang="scss" scoped>
.counter {
  counter-reset: counter;
}

:deep(.row-expand-unhas .el-table__expand-icon--expanded) {
  display: none !important;
}
.item::before {
  counter-increment: counter;
  content: counter(counter);
  color: #3f3f3f;
  font-size: 1.2em;
  right: 50%;
  top: 10px;
  width: 24px;
  height: 24px;
  text-align: center;
  vertical-align: middle;
  border-radius: 50%;
  background-color: #ccc;
  display: inline-block;
}
</style>
