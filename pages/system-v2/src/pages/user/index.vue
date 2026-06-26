<template>
  <div class="sv2-page">
    <div class="sv2-search-bar">
      <el-form :inline="true" :model="queryParams">
        <el-form-item label="用户名">
          <el-input v-model="queryParams.userName" placeholder="请输入用户名" clearable />
        </el-form-item>
        <el-form-item label="手机号">
          <el-input v-model="queryParams.phone" placeholder="请输入手机号" clearable />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="queryParams.status" placeholder="状态" clearable>
            <el-option label="正常" value="0" />
            <el-option label="停用" value="1" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleQuery">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
      <div class="sv2-action-bar">
        <el-button type="primary" @click="handleAdd">新增用户</el-button>
      </div>
    </div>

    <el-table :data="userList" border stripe v-loading="loading" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="50" />
      <el-table-column prop="userId" label="编号" width="80" />
      <el-table-column prop="userName" label="用户名" />
      <el-table-column prop="nickName" label="昵称" />
      <el-table-column prop="phone" label="手机号" width="130" />
      <el-table-column prop="email" label="邮箱" />
      <el-table-column prop="status" label="状态" width="80">
        <template #default="{ row }">
          <el-tag :type="row.status === '0' ? 'success' : 'danger'">
            {{ row.status === '0' ? '正常' : '停用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createTime" label="创建时间" width="170" />
      <el-table-column label="操作" width="220" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="handleEdit(row)">编辑</el-button>
          <el-button link type="primary" @click="handleResetPwd(row)">重置密码</el-button>
          <el-popconfirm title="确认删除？" @confirm="handleDelete(row)">
            <template #reference>
              <el-button link type="danger">删除</el-button>
            </template>
          </el-popconfirm>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      v-model:current-page="queryParams.page"
      v-model:page-size="queryParams.size"
      :total="total"
      :page-sizes="[10, 20, 50, 100]"
      layout="total, sizes, prev, pager, next"
      @size-change="fetchData"
      @current-change="fetchData"
      class="sv2-pagination"
    />

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="600px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="用户名" prop="userName">
              <el-input v-model="form.userName" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="昵称" prop="nickName">
              <el-input v-model="form.nickName" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="手机号" prop="phone">
              <el-input v-model="form.phone" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="邮箱" prop="email">
              <el-input v-model="form.email" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="状态">
          <el-radio-group v-model="form.status">
            <el-radio value="0">正常</el-radio>
            <el-radio value="1">停用</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" />
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
import { apiUser } from "../../api/index";

const loading = ref(false);
const userList = ref<any[]>([]);
const total = ref(0);
const selectedIds = ref<number[]>([]);
const dialogVisible = ref(false);
const dialogTitle = ref("新增用户");
const formRef = ref<any>(null);

const queryParams = reactive({ page: 1, size: 20, userName: "", phone: "", status: "" });
const form = reactive<any>({ userName: "", nickName: "", phone: "", email: "", status: "0", remark: "" });
const rules = {
  userName: [{ required: true, message: "请输入用户名", trigger: "blur" }],
  nickName: [{ required: true, message: "请输入昵称", trigger: "blur" }],
};

async function fetchData() {
  loading.value = true;
  try {
    const res = await apiUser.page(queryParams);
    userList.value = res.data || [];
    total.value = (res as any).total || userList.value.length;
  } finally { loading.value = false; }
}

function handleQuery() { queryParams.page = 1; fetchData(); }
function handleReset() { Object.assign(queryParams, { page: 1, size: 20, userName: "", phone: "", status: "" }); fetchData(); }
function handleSelectionChange(sel: any[]) { selectedIds.value = sel.map((s: any) => s.userId); }
function handleAdd() { dialogTitle.value = "新增用户"; Object.assign(form, { userName: "", nickName: "", phone: "", email: "", status: "0", remark: "" }); dialogVisible.value = true; }
function handleEdit(row: any) { dialogTitle.value = "编辑用户"; Object.assign(form, row); dialogVisible.value = true; }
async function handleResetPwd(row: any) {
  await apiUser.resetPwd({ userId: row.userId, password: "123456" });
  ElMessage.success("密码已重置为 123456");
}
async function handleDelete(row: any) {
  await apiUser.delete(row.userId);
  ElMessage.success("删除成功");
  fetchData();
}
async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;
  if (form.userId) await apiUser.update(form);
  else await apiUser.save(form);
  ElMessage.success(form.userId ? "修改成功" : "新增成功");
  dialogVisible.value = false;
  fetchData();
}

onMounted(fetchData);
</script>

<style scoped>
.sv2-page { padding: 16px; }
.sv2-search-bar { margin-bottom: 16px; padding: 16px; background: var(--el-bg-color); border-radius: 8px; }
.sv2-action-bar { margin-top: 8px; }
.sv2-pagination { margin-top: 16px; justify-content: flex-end; }
</style>