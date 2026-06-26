<template>
  <div class="sv2-page">
    <div class="sv2-search-bar">
      <el-form :inline="true" :model="queryParams">
        <el-form-item label="登录用户"><el-input v-model="queryParams.userName" placeholder="请输入" clearable /></el-form-item>
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
      <el-table-column prop="infoId" label="编号" width="80" />
      <el-table-column prop="userName" label="用户名" />
      <el-table-column prop="ipaddr" label="IP地址" />
      <el-table-column prop="loginLocation" label="登录地点" />
      <el-table-column prop="browser" label="浏览器" />
      <el-table-column prop="os" label="操作系统" />
      <el-table-column prop="status" label="状态" width="80">
        <template #default="{ row }"><el-tag :type="row.status === '0' ? 'success' : 'danger'" size="small">{{ row.status === '0' ? '成功' : '失败' }}</el-tag></template>
      </el-table-column>
      <el-table-column prop="loginTime" label="登录时间" width="170" />
    </el-table>
    <el-pagination v-model:current-page="queryParams.page" v-model:page-size="queryParams.size" :total="total"
      :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next"
      @size-change="fetchData" @current-change="fetchData" class="sv2-pagination" />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { apiLoginLog } from "../../api/index";

const loading = ref(false);
const logList = ref<any[]>([]);
const total = ref(0);
const queryParams = reactive({ page: 1, size: 20, userName: "", status: "" });

async function fetchData() {
  loading.value = true;
  try { const res = await apiLoginLog.page(queryParams); logList.value = res.data || []; total.value = (res as any).total || logList.value.length; } finally { loading.value = false; }
}
function handleQuery() { queryParams.page = 1; fetchData(); }
function handleReset() { Object.assign(queryParams, { page: 1, size: 20, userName: "", status: "" }); fetchData(); }
onMounted(fetchData);
</script>

<style scoped>
.sv2-page { padding: 16px; }
.sv2-search-bar { margin-bottom: 16px; padding: 16px; background: var(--el-bg-color); border-radius: 8px; }
.sv2-pagination { margin-top: 16px; justify-content: flex-end; }
</style>