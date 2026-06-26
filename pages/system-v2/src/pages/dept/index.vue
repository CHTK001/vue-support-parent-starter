<template>
  <div class="sv2-page">
    <div class="sv2-action-bar">
      <el-button type="primary" @click="handleAdd">新增部门</el-button>
    </div>
    <el-table :data="deptList" border stripe v-loading="loading" row-key="deptId"
      default-expand-all :tree-props="{ children: 'children' }">
      <el-table-column prop="deptName" label="部门名称" />
      <el-table-column prop="deptCode" label="部门编码" />
      <el-table-column prop="orderNum" label="排序" width="80" />
      <el-table-column prop="leader" label="负责人" />
      <el-table-column prop="phone" label="联系电话" />
      <el-table-column prop="status" label="状态" width="80">
        <template #default="{ row }">
          <el-tag :type="row.status === '0' ? 'success' : 'danger'" size="small">{{ row.status === '0' ? '正常' : '停用' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="handleEdit(row)">编辑</el-button>
          <el-button link type="primary" @click="handleAddChild(row)">新增子部门</el-button>
          <el-popconfirm title="确认删除？" @confirm="handleDelete(row)">
            <template #reference><el-button link type="danger">删除</el-button></template>
          </el-popconfirm>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="500px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="上级部门">
          <el-tree-select v-model="form.parentId" :data="deptList" :props="{ label: 'deptName', value: 'deptId' }"
            placeholder="顶级部门" check-strictly clearable />
        </el-form-item>
        <el-form-item label="部门名称" prop="deptName"><el-input v-model="form.deptName" /></el-form-item>
        <el-form-item label="部门编码"><el-input v-model="form.deptCode" /></el-form-item>
        <el-form-item label="排序"><el-input-number v-model="form.orderNum" /></el-form-item>
        <el-form-item label="负责人"><el-input v-model="form.leader" /></el-form-item>
        <el-form-item label="联系电话"><el-input v-model="form.phone" /></el-form-item>
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
import { ElMessage } from "element-plus";
import { apiDept } from "../../api/index";

const loading = ref(false);
const deptList = ref<any[]>([]);
const dialogVisible = ref(false);
const dialogTitle = ref("");
const formRef = ref<any>(null);
const form = reactive<any>({ parentId: "", deptName: "", deptCode: "", orderNum: 0, leader: "", phone: "", status: "0" });
const rules = { deptName: [{ required: true, message: "请输入部门名称", trigger: "blur" }] };

async function fetchData() {
  loading.value = true;
  try { const res = await apiDept.tree(); deptList.value = res.data || []; } finally { loading.value = false; }
}

function handleAdd() { dialogTitle.value = "新增部门"; Object.assign(form, { parentId: "", deptName: "", deptCode: "", orderNum: 0, leader: "", phone: "", status: "0" }); dialogVisible.value = true; }
function handleAddChild(row: any) { dialogTitle.value = "新增子部门"; Object.assign(form, { parentId: row.deptId, deptName: "", deptCode: "", orderNum: 0, leader: "", phone: "", status: "0" }); dialogVisible.value = true; }
function handleEdit(row: any) { dialogTitle.value = "编辑部门"; Object.assign(form, { ...row }); dialogVisible.value = true; }
async function handleDelete(row: any) { await apiDept.delete(row.deptId); ElMessage.success("删除成功"); fetchData(); }
async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;
  if (form.deptId) await apiDept.update(form); else await apiDept.save(form);
  ElMessage.success("保存成功"); dialogVisible.value = false; fetchData();
}

onMounted(fetchData);
</script>

<style scoped>
.sv2-page { padding: 16px; }
.sv2-action-bar { margin-bottom: 16px; }
</style>