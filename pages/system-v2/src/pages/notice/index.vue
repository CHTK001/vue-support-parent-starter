<template>
  <div class="sv2-page">
    <div class="sv2-search-bar">
      <el-form :inline="true" :model="queryParams">
        <el-form-item label="标题"><el-input v-model="queryParams.noticeTitle" placeholder="请输入" clearable /></el-form-item>
        <el-form-item label="类型">
          <el-select v-model="queryParams.noticeType" placeholder="请选择" clearable>
            <el-option label="通知" value="1" /><el-option label="公告" value="2" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleQuery">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
      <el-button type="primary" @click="handleAdd">新增通知</el-button>
    </div>
    <el-table :data="noticeList" border stripe v-loading="loading">
      <el-table-column prop="noticeId" label="编号" width="80" />
      <el-table-column prop="noticeTitle" label="标题" min-width="200" />
      <el-table-column prop="noticeType" label="类型" width="80">
        <template #default="{ row }"><el-tag :type="row.noticeType === '1' ? 'info' : 'warning'" size="small">{{ row.noticeType === '1' ? '通知' : '公告' }}</el-tag></template>
      </el-table-column>
      <el-table-column prop="createBy" label="创建者" />
      <el-table-column prop="createTime" label="创建时间" width="170" />
      <el-table-column prop="status" label="状态" width="80">
        <template #default="{ row }"><el-tag :type="row.status === '0' ? 'success' : 'danger'" size="small">{{ row.status === '0' ? '正常' : '关闭' }}</el-tag></template>
      </el-table-column>
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="handleEdit(row)">编辑</el-button>
          <el-popconfirm title="确认删除？" @confirm="handleDelete(row)">
            <template #reference><el-button link type="danger">删除</el-button></template>
          </el-popconfirm>
        </template>
      </el-table-column>
    </el-table>
    <el-pagination v-model:current-page="queryParams.page" v-model:page-size="queryParams.size" :total="total"
      :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next"
      @size-change="fetchData" @current-change="fetchData" class="sv2-pagination" />

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="600px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="标题" prop="noticeTitle"><el-input v-model="form.noticeTitle" /></el-form-item>
        <el-form-item label="类型"><el-radio-group v-model="form.noticeType"><el-radio value="1">通知</el-radio><el-radio value="2">公告</el-radio></el-radio-group></el-form-item>
        <el-form-item label="内容"><el-input v-model="form.noticeContent" type="textarea" :rows="4" /></el-form-item>
        <el-form-item label="状态"><el-radio-group v-model="form.status"><el-radio value="0">正常</el-radio><el-radio value="1">关闭</el-radio></el-radio-group></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { ElMessage } from "element-plus";
import { apiNotice } from "../../api/index";

const loading = ref(false);
const noticeList = ref<any[]>([]);
const total = ref(0);
const dialogVisible = ref(false);
const dialogTitle = ref("");
const formRef = ref<any>(null);
const queryParams = reactive({ page: 1, size: 20, noticeTitle: "", noticeType: "" });
const form = reactive<any>({ noticeTitle: "", noticeType: "1", noticeContent: "", status: "0" });
const rules = { noticeTitle: [{ required: true, message: "请输入标题", trigger: "blur" }] };

async function fetchData() {
  loading.value = true;
  try { const res = await apiNotice.page(queryParams); noticeList.value = res.data || []; total.value = (res as any).total || noticeList.value.length; } finally { loading.value = false; }
}
function handleQuery() { queryParams.page = 1; fetchData(); }
function handleReset() { Object.assign(queryParams, { page: 1, size: 20, noticeTitle: "", noticeType: "" }); fetchData(); }
function handleAdd() { dialogTitle.value = "新增通知"; Object.assign(form, { noticeTitle: "", noticeType: "1", noticeContent: "", status: "0" }); dialogVisible.value = true; }
function handleEdit(row: any) { dialogTitle.value = "编辑通知"; Object.assign(form, { ...row }); dialogVisible.value = true; }
async function handleDelete(row: any) { await apiNotice.delete(row.noticeId); ElMessage.success("删除成功"); fetchData(); }
async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;
  if (form.noticeId) await apiNotice.update(form); else await apiNotice.save(form);
  ElMessage.success("保存成功"); dialogVisible.value = false; fetchData();
}
onMounted(fetchData);
</script>

<style scoped>
.sv2-page { padding: 16px; }
.sv2-search-bar { margin-bottom: 16px; padding: 16px; background: var(--el-bg-color); border-radius: 8px; }
.sv2-pagination { margin-top: 16px; justify-content: flex-end; }
</style>