<template>
  <div class="skywalking-config">
    <!-- 搜索区域 -->
    <el-card class="search-card" shadow="never">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="配置名称">
          <el-input v-model="searchForm.name" placeholder="请输入配置名称" clearable />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="请选择状态" clearable>
            <el-option label="启用" :value="1" />
            <el-option label="禁用" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
          <el-button type="primary" @click="handleAdd">新增配置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 表格区域 -->
    <el-card class="table-card" shadow="never">
      <el-table v-loading="loading" :data="tableData" border stripe>
        <el-table-column prop="skywalkingConfigName" label="配置名称" min-width="150" />
        <el-table-column prop="skywalkingConfigHost" label="服务地址" min-width="150" />
        <el-table-column prop="skywalkingConfigPort" label="端口" width="100" />
        <el-table-column label="HTTPS" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="row.skywalkingConfigUseHttps === 1 ? 'success' : 'info'" size="small">
              {{ row.skywalkingConfigUseHttps === 1 ? '是' : '否' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-switch
              v-model="row.skywalkingConfigStatus"
              :active-value="1"
              :inactive-value="0"
              @change="handleToggleStatus(row)"
            />
          </template>
        </el-table-column>
        <el-table-column prop="skywalkingConfigDesc" label="描述" min-width="200" show-overflow-tooltip />
        <el-table-column prop="createTime" label="创建时间" width="180" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleTest(row)">测试</el-button>
            <el-button type="primary" link size="small" @click="handleEdit(row)">编辑</el-button>
            <el-popconfirm title="确定删除该配置吗？" @confirm="handleDelete(row)">
              <template #reference>
                <el-button type="danger" link size="small">删除</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 新增/编辑弹窗 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="600px" destroy-on-close>
      <el-form ref="formRef" :model="formData" :rules="rules" label-width="100px">
        <el-form-item label="配置名称" prop="skywalkingConfigName">
          <el-input v-model="formData.skywalkingConfigName" placeholder="请输入配置名称" />
        </el-form-item>
        <el-form-item label="服务地址" prop="skywalkingConfigHost">
          <el-input v-model="formData.skywalkingConfigHost" placeholder="请输入服务地址" />
        </el-form-item>
        <el-form-item label="端口" prop="skywalkingConfigPort">
          <el-input-number v-model="formData.skywalkingConfigPort" :min="1" :max="65535" />
        </el-form-item>
        <el-form-item label="HTTPS">
          <el-switch v-model="formData.skywalkingConfigUseHttps" :active-value="1" :inactive-value="0" />
        </el-form-item>
        <el-form-item label="用户名">
          <el-input v-model="formData.skywalkingConfigUsername" placeholder="请输入用户名（可选）" />
        </el-form-item>
        <el-form-item label="密码">
          <el-input v-model="formData.skywalkingConfigPassword" type="password" placeholder="请输入密码（可选）" show-password />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="formData.skywalkingConfigStatus" :active-value="1" :inactive-value="0" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="formData.skywalkingConfigDesc" type="textarea" :rows="3" placeholder="请输入描述" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { ElMessage, type FormInstance, type FormRules } from "element-plus";
import {
  getSkywalkingConfigPage,
  saveSkywalkingConfig,
  updateSkywalkingConfig,
  deleteSkywalkingConfig,
  testSkywalkingConnection,
  toggleSkywalkingConfigStatus,
  type SkywalkingConfig,
} from "@/api/skywalking/config";

defineOptions({ name: "SkywalkingConfig" });

// 搜索表单
const searchForm = reactive({
  name: "",
  status: undefined as number | undefined,
});

// 表格数据
const tableData = ref<SkywalkingConfig[]>([]);
const loading = ref(false);

// 分页
const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0,
});

// 弹窗相关
const dialogVisible = ref(false);
const dialogTitle = ref("新增配置");
const submitLoading = ref(false);
const formRef = ref<FormInstance>();
const formData = reactive<SkywalkingConfig>({
  skywalkingConfigName: "",
  skywalkingConfigHost: "",
  skywalkingConfigPort: 12800,
  skywalkingConfigUsername: "",
  skywalkingConfigPassword: "",
  skywalkingConfigStatus: 1,
  skywalkingConfigDesc: "",
  skywalkingConfigUseHttps: 0,
});

// 表单验证规则
const rules: FormRules = {
  skywalkingConfigName: [{ required: true, message: "请输入配置名称", trigger: "blur" }],
  skywalkingConfigHost: [{ required: true, message: "请输入服务地址", trigger: "blur" }],
  skywalkingConfigPort: [{ required: true, message: "请输入端口", trigger: "blur" }],
};

// 获取数据
const fetchData = async () => {
  loading.value = true;
  try {
    const res = await getSkywalkingConfigPage({
      page: pagination.page,
      pageSize: pagination.pageSize,
      name: searchForm.name || undefined,
      status: searchForm.status,
    });
    if (res.code === "00000") {
      tableData.value = res.data?.records || [];
      pagination.total = res.data?.total || 0;
    }
  } finally {
    loading.value = false;
  }
};

// 搜索
const handleSearch = () => {
  pagination.page = 1;
  fetchData();
};

// 重置
const handleReset = () => {
  searchForm.name = "";
  searchForm.status = undefined;
  handleSearch();
};

// 分页
const handleSizeChange = () => fetchData();
const handleCurrentChange = () => fetchData();

// 新增
const handleAdd = () => {
  dialogTitle.value = "新增配置";
  Object.assign(formData, {
    skywalkingConfigId: undefined,
    skywalkingConfigName: "",
    skywalkingConfigHost: "",
    skywalkingConfigPort: 12800,
    skywalkingConfigUsername: "",
    skywalkingConfigPassword: "",
    skywalkingConfigStatus: 1,
    skywalkingConfigDesc: "",
    skywalkingConfigUseHttps: 0,
  });
  dialogVisible.value = true;
};

// 编辑
const handleEdit = (row: SkywalkingConfig) => {
  dialogTitle.value = "编辑配置";
  Object.assign(formData, { ...row });
  dialogVisible.value = true;
};

// 提交表单
const handleSubmit = async () => {
  const valid = await formRef.value?.validate();
  if (!valid) return;

  submitLoading.value = true;
  try {
    const api = formData.skywalkingConfigId ? updateSkywalkingConfig : saveSkywalkingConfig;
    const res = await api(formData);
    if (res.code === "00000") {
      ElMessage.success(formData.skywalkingConfigId ? "更新成功" : "新增成功");
      dialogVisible.value = false;
      fetchData();
    } else {
      ElMessage.error(res.msg || "操作失败");
    }
  } finally {
    submitLoading.value = false;
  }
};

// 删除
const handleDelete = async (row: SkywalkingConfig) => {
  const res = await deleteSkywalkingConfig(row.skywalkingConfigId!);
  if (res.code === "00000") {
    ElMessage.success("删除成功");
    fetchData();
  } else {
    ElMessage.error(res.msg || "删除失败");
  }
};

// 测试连接
const handleTest = async (row: SkywalkingConfig) => {
  ElMessage.info("正在测试连接...");
  const res = await testSkywalkingConnection(row);
  if (res.code === "00000" && res.data) {
    ElMessage.success("连接成功");
  } else {
    ElMessage.error(res.msg || "连接失败");
  }
};

// 切换状态
const handleToggleStatus = async (row: SkywalkingConfig) => {
  const res = await toggleSkywalkingConfigStatus(row.skywalkingConfigId!);
  if (res.code === "00000") {
    ElMessage.success("状态更新成功");
  } else {
    ElMessage.error(res.msg || "状态更新失败");
    // 还原状态
    row.skywalkingConfigStatus = row.skywalkingConfigStatus === 1 ? 0 : 1;
  }
};

onMounted(() => {
  fetchData();
});
</script>

<style scoped lang="scss">
.skywalking-config {
  padding: 16px;

  .search-card {
    margin-bottom: 16px;

    .search-form {
      :deep(.el-form-item) {
        margin-bottom: 0;
      }
    }
  }

  .table-card {
    .pagination-container {
      display: flex;
      justify-content: flex-end;
      margin-top: 16px;
    }
  }
}
</style>
