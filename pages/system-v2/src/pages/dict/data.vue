<template>
  <div class="sv2-page">
    <div class="sv2-page-header">
      <el-button text @click="goBack">← 返回</el-button>
      <span class="sv2-page-title">字典项 - {{ dictType }}</span>
    </div>
    <div class="sv2-action-bar">
      <el-button type="primary" @click="handleAdd">新增字典项</el-button>
    </div>
    <el-table :data="dataList" border stripe v-loading="loading">
      <el-table-column prop="dictCode" label="编号" width="80" />
      <el-table-column prop="dictLabel" label="标签" />
      <el-table-column prop="dictValue" label="键值" />
      <el-table-column prop="dictSort" label="排序" width="80" />
      <el-table-column prop="status" label="状态" width="80">
        <template #default="{ row }">
          <el-tag :type="row.status === '0' ? 'success' : 'danger'" size="small">{{ row.status === '0' ? '正常' : '停用' }}</el-tag>
        </template>
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
        <el-form-item label="标签" prop="dictLabel"><el-input v-model="form.dictLabel" /></el-form-item>
        <el-form-item label="键值" prop="dictValue"><el-input v-model="form.dictValue" /></el-form-item>
        <el-form-item label="排序"><el-input-number v-model="form.dictSort" /></el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="form.status"><el-radio value="0">正常</el-radio><el-radio value="1">停用</el-radio></el-radio-group>
        </el-form-item>
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
import { useRoute, useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { apiDictData } from "../../api/index";

const route = useRoute(); const router = useRouter();
const dictType = route.params.dictType as string;
const loading = ref(false);
const dataList = ref<any[]>([]);
const total = ref(0);
const dialogVisible = ref(false);
const dialogTitle = ref("");
const formRef = ref<any>(null);

const queryParams = reactive({ page: 1, size: 20, dictType });
const form = reactive<any>({ dictLabel: "", dictValue: "", dictSort: 0, status: "0", dictType });
const rules = { dictLabel: [{ required: true, message: "请输入标签", trigger: "blur" }], dictValue: [{ required: true, message: "请输入键值", trigger: "blur" }] };

function goBack() { router.back(); }
async function fetchData() {
  loading.value = true;
  try { const res = await apiDictData.page(queryParams); dataList.value = res.data || []; total.value = (res as any).total || dataList.value.length; } finally { loading.value = false; }
}
function handleAdd() { dialogTitle.value = "新增字典项"; Object.assign(form, { dictLabel: "", dictValue: "", dictSort: 0, status: "0", dictType }); dialogVisible.value = true; }
function handleEdit(row: any) { dialogTitle.value = "编辑字典项"; Object.assign(form, { ...row }); dialogVisible.value = true; }
async function handleDelete(row: any) { await apiDictData.delete(row.dictCode); ElMessage.success("删除成功"); fetchData(); }
async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;
  if (form.dictCode) await apiDictData.update(form); else await apiDictData.save(form);
  ElMessage.success("保存成功"); dialogVisible.value = false; fetchData();
}
onMounted(fetchData);
</script>

<style scoped>
.sv2-page { padding: 16px; }
.sv2-page-header { display: flex; align-items: center; gap: 8px; margin-bottom: 16px; }
.sv2-page-title { font-size: 16px; font-weight: 600; }
.sv2-action-bar { margin-bottom: 16px; }
.sv2-pagination { margin-top: 16px; justify-content: flex-end; }
</style>