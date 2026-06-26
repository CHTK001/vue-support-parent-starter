<template>
  <div class="sv2-page">
    <div class="sv2-search-bar">
      <el-form :inline="true" :model="queryParams">
        <el-form-item label="岗位名称"><el-input v-model="queryParams.postName" placeholder="请输入" clearable /></el-form-item>
        <el-form-item label="状态">
          <el-select v-model="queryParams.status" placeholder="状态" clearable>
            <el-option label="正常" value="0" /><el-option label="停用" value="1" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleQuery">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
      <el-button type="primary" @click="handleAdd">新增岗位</el-button>
    </div>
    <el-table :data="postList" border stripe v-loading="loading">
      <el-table-column prop="postId" label="编号" width="80" />
      <el-table-column prop="postCode" label="岗位编码" />
      <el-table-column prop="postName" label="岗位名称" />
      <el-table-column prop="postSort" label="排序" width="80" />
      <el-table-column prop="status" label="状态" width="80">
        <template #default="{ row }"><el-tag :type="row.status === '0' ? 'success' : 'danger'" size="small">{{ row.status === '0' ? '正常' : '停用' }}</el-tag></template>
      </el-table-column>
      <el-table-column prop="remark" label="备注" />
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

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="500px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="岗位编码" prop="postCode"><el-input v-model="form.postCode" /></el-form-item>
        <el-form-item label="岗位名称" prop="postName"><el-input v-model="form.postName" /></el-form-item>
        <el-form-item label="排序"><el-input-number v-model="form.postSort" /></el-form-item>
        <el-form-item label="状态"><el-radio-group v-model="form.status"><el-radio value="0">正常</el-radio><el-radio value="1">停用</el-radio></el-radio-group></el-form-item>
        <el-form-item label="备注"><el-input v-model="form.remark" type="textarea" /></el-form-item>
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
import { apiPost } from "../../api/index";

const loading = ref(false);
const postList = ref<any[]>([]);
const total = ref(0);
const dialogVisible = ref(false);
const dialogTitle = ref("");
const formRef = ref<any>(null);
const queryParams = reactive({ page: 1, size: 20, postName: "", status: "" });
const form = reactive<any>({ postCode: "", postName: "", postSort: 0, status: "0", remark: "" });
const rules = { postCode: [{ required: true, message: "请输入岗位编码", trigger: "blur" }], postName: [{ required: true, message: "请输入岗位名称", trigger: "blur" }] };

async function fetchData() {
  loading.value = true;
  try { const res = await apiPost.page(queryParams); postList.value = res.data || []; total.value = (res as any).total || postList.value.length; } finally { loading.value = false; }
}
function handleQuery() { queryParams.page = 1; fetchData(); }
function handleReset() { Object.assign(queryParams, { page: 1, size: 20, postName: "", status: "" }); fetchData(); }
function handleAdd() { dialogTitle.value = "新增岗位"; Object.assign(form, { postCode: "", postName: "", postSort: 0, status: "0", remark: "" }); dialogVisible.value = true; }
function handleEdit(row: any) { dialogTitle.value = "编辑岗位"; Object.assign(form, { ...row }); dialogVisible.value = true; }
async function handleDelete(row: any) { await apiPost.delete(row.postId); ElMessage.success("删除成功"); fetchData(); }
async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;
  if (form.postId) await apiPost.update(form); else await apiPost.save(form);
  ElMessage.success("保存成功"); dialogVisible.value = false; fetchData();
}
onMounted(fetchData);
</script>

<style scoped>
.sv2-page { padding: 16px; }
.sv2-search-bar { margin-bottom: 16px; padding: 16px; background: var(--el-bg-color); border-radius: 8px; }
.sv2-pagination { margin-top: 16px; justify-content: flex-end; }
</style>