<template>
  <div class="sv2-page">
    <div class="sv2-search-bar">
      <el-form :inline="true" :model="queryParams">
        <el-form-item label="操作人员"><el-input v-model="queryParams.operName" placeholder="请输入" clearable /></el-form-item>
        <el-form-item label="状态">
          <el-select v-model="queryParams.status" placeholder="请选择" clearable>
            <el-option label="成功" value="0" /><el-option label="失败" value="1" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleQuery">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>
    <el-table :data="logList" border stripe v-loading="loading">
      <el-table-column prop="operId" label="编号" width="80" />
      <el-table-column prop="title" label="模块" />
      <el-table-column prop="operName" label="操作人员" />
      <el-table-column prop="requestMethod" label="请求方式" width="80" />
      <el-table-column prop="operIp" label="IP地址" />
      <el-table-column prop="operLocation" label="操作地点" />
      <el-table-column prop="status" label="状态" width="80">
        <template #default="{ row }"><el-tag :type="row.status === '0' ? 'success' : 'danger'" size="small">{{ row.status === '0' ? '成功' : '失败' }}</el-tag></template>
      </el-table-column>
      <el-table-column prop="operTime" label="操作时间" width="170" />
      <el-table-column label="操作" width="100" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="handleDetail(row)">详情</el-button>
        </template>
      </el-table-column>
    </el-table>
    <el-pagination v-model:current-page="queryParams.page" v-model:page-size="queryParams.size" :total="total"
      :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next"
      @size-change="fetchData" @current-change="fetchData" class="sv2-pagination" />

    <el-dialog v-model="detailVisible" title="操作日志详情" width="700px">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="模块">{{ detail.title }}</el-descriptions-item>
        <el-descriptions-item label="操作人员">{{ detail.operName }}</el-descriptions-item>
        <el-descriptions-item label="请求地址">{{ detail.operUrl }}</el-descriptions-item>
        <el-descriptions-item label="请求方式">{{ detail.requestMethod }}</el-descriptions-item>
        <el-descriptions-item label="IP地址">{{ detail.operIp }}</el-descriptions-item>
        <el-descriptions-item label="操作地点">{{ detail.operLocation }}</el-descriptions-item>
        <el-descriptions-item label="请求参数" :span="2"><pre>{{ detail.operParam }}</pre></el-descriptions-item>
        <el-descriptions-item label="返回结果" :span="2"><pre>{{ detail.jsonResult }}</pre></el-descriptions-item>
        <el-descriptions-item v-if="detail.errorMsg" label="错误信息" :span="2"><pre style="color:#f56c6c">{{ detail.errorMsg }}</pre></el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { apiOperLog } from "../../api/index";

const loading = ref(false);
const logList = ref<any[]>([]);
const total = ref(0);
const detailVisible = ref(false);
const detail = ref<any>({});
const queryParams = reactive({ page: 1, size: 20, operName: "", status: "" });

async function fetchData() {
  loading.value = true;
  try { const res = await apiOperLog.page(queryParams); logList.value = res.data || []; total.value = (res as any).total || logList.value.length; } finally { loading.value = false; }
}
function handleQuery() { queryParams.page = 1; fetchData(); }
function handleReset() { Object.assign(queryParams, { page: 1, size: 20, operName: "", status: "" }); fetchData(); }
function handleDetail(row: any) { detail.value = row; detailVisible.value = true; }
onMounted(fetchData);
</script>

<style scoped>
.sv2-page { padding: 16px; }
.sv2-search-bar { margin-bottom: 16px; padding: 16px; background: var(--el-bg-color); border-radius: 8px; }
.sv2-pagination { margin-top: 16px; justify-content: flex-end; }
pre { margin: 0; white-space: pre-wrap; word-break: break-all; max-height: 200px; overflow-y: auto; }
</style>