<template>
  <div class="sv2-page">
    <div class="sv2-action-bar">
      <el-button type="primary" @click="handleAdd">新增字典</el-button>
    </div>
    <el-table :data="dictList" border stripe v-loading="loading">
      <el-table-column prop="dictId" label="编号" width="80" />
      <el-table-column prop="dictName" label="字典名称" />
      <el-table-column prop="dictType" label="字典类型" />
      <el-table-column prop="status" label="状态" width="80">
        <template #default="{ row }">
          <el-tag :type="row.status === '0' ? 'success' : 'danger'" size="small">{{ row.status === '0' ? '正常' : '停用' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="remark" label="备注" />
      <el-table-column prop="createTime" label="创建时间" width="170" />
      <el-table-column label="操作" width="250" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="handleEdit(row)">编辑</el-button>
          <el-button link type="primary" @click="handleDictData(row)">字典项</el-button>
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
        <el-form-item label="字典名称" prop="dictName"><el-input v-model="form.dictName" /></el-form-item>
        <el-form-item label="字典类型" prop="dictType"><el-input v-model="form.dictType" /></el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="form.status"><el-radio value="0">正常</el-radio><el-radio value="1">停用</el-radio></el-radio-group>
        </el-form-item>
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
import { apiDict } from "../../api/index";
import { useRouter } from "vue-router";

const router = useRouter();
const loading = ref(false);
const dictList = ref<any[]>([]);
const total = ref(0);
const dialogVisible = ref(false);
const dialogTitle = ref("");
const formRef = ref<any>(null);

const queryParams = reactive({ page: 1, size: 20 });
const form = reactive<any>({ dictName: "", dictType: "", status: "0", remark: "" });
const rules = { dictName: [{ required: true, message: "请输入字典名称", trigger: "blur" }], dictType: [{ required: true, message: "请输入字典类型", trigger: "blur" }] };

async function fetchData() {
  loading.value = true;
  try { const res = await apiDict.page(queryParams); dictList.value = res.data || []; total.value = (res as any).total || dictList.value.length; } finally { loading.value = false; }
}
function handleAdd() { dialogTitle.value = "新增字典"; Object.assign(form, { dictName: "", dictType: "", status: "0", remark: "" }); dialogVisible.value = true; }
function handleEdit(row: any) { dialogTitle.value = "编辑字典"; Object.assign(form, { ...row }); dialogVisible.value = true; }
function handleDictData(row: any) { router.push({ path: `/system/dict/data/${row.dictType}` }); }
async function handleDelete(row: any) { await apiDict.delete(row.dictId); ElMessage.success("删除成功"); fetchData(); }
async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;
  if (form.dictId) await apiDict.update(form); else await apiDict.save(form);
  ElMessage.success("保存成功"); dialogVisible.value = false; fetchData();
}
onMounted(fetchData);
</script>

<style scoped>
.sv2-page { padding: 16px; }
.sv2-action-bar { margin-bottom: 16px; }
.sv2-pagination { margin-top: 16px; justify-content: flex-end; }
</style>