<template>
  <div class="limit-record-container">
    <!-- 搜索和筛选 -->
    <div class="search-section">
      <el-card class="search-card" shadow="never">
        <div class="search-container">
          <div class="search-left">
            <el-input
              v-model="searchForm.sysLimitPath"
              placeholder="搜索接口路径"
              class="path-input"
              clearable
              @keyup.enter="handleSearch"
            >
              <template #prefix>
                <i class="ri-search-line"></i>
              </template>
            </el-input>
            <el-input
              v-model="searchForm.clientIp"
              placeholder="IP地址"
              class="ip-input"
              clearable
              @keyup.enter="handleSearch"
            />
            <el-input
              v-model="searchForm.sysUserId"
              placeholder="用户ID"
              class="user-input"
              clearable
              @keyup.enter="handleSearch"
            />
            <el-date-picker
              v-model="dateRange"
              type="datetimerange"
              range-separator="至"
              start-placeholder="开始时间"
              end-placeholder="结束时间"
              class="date-picker"
              value-format="YYYY-MM-DD HH:mm:ss"
              @change="handleDateChange"
            />
          </div>
          <div class="search-right">
            <el-button type="primary" @click="handleSearch">
              <i class="ri-search-line"></i>
              搜索
            </el-button>
            <el-button @click="handleReset">
              <i class="ri-refresh-line"></i>
              重置
            </el-button>
            <el-button
              type="danger"
              :disabled="selectedRows.length === 0"
              @click="handleBatchDelete"
            >
              <i class="ri-delete-bin-line"></i>
              批量删除
            </el-button>
            <el-button type="primary" @click="handleAdd">
              <i class="ri-add-line"></i>
              新增记录
            </el-button>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 记录列表 -->
    <div class="list-section">
      <el-card shadow="never">
        <el-table
          v-loading="loading"
          :data="recordList"
          row-key="sysLimitRecordId"
          stripe
          border
          @selection-change="handleSelectionChange"
        >
          <el-table-column type="selection" width="50" align="center" />
          <el-table-column prop="sysLimitRecordId" label="ID" width="80" align="center" />
          <el-table-column prop="sysLimitPath" label="接口路径" min-width="200">
            <template #default="{ row }">
              <el-tag type="warning" size="small">{{ row.sysLimitPath }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="sysLimitName" label="规则名称" min-width="120" />
          <el-table-column prop="clientIp" label="IP地址" width="130">
            <template #default="{ row }">
              <span class="ip-text">{{ row.clientIp || '-' }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="sysUserId" label="用户" width="120" align="center">
            <template #default="{ row }">
              <span>{{ row.sysUserName || row.sysUserId || '-' }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="requestMethod" label="请求方法" width="90" align="center">
            <template #default="{ row }">
              <el-tag :type="getMethodType(row.requestMethod)" size="small">
                {{ row.requestMethod || '-' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="sysLimitKey" label="限流键" min-width="150">
            <template #default="{ row }">
              <el-tooltip v-if="row.sysLimitKey" :content="row.sysLimitKey" placement="top">
                <span class="key-text">{{ truncateText(row.sysLimitKey, 20) }}</span>
              </el-tooltip>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column prop="sysLimitDimension" label="限流维度" width="100" align="center">
            <template #default="{ row }">
              <el-tag :type="getDimensionType(row.sysLimitDimension)" size="small">
                {{ getDimensionLabel(row.sysLimitDimension) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="sysLimitTime" label="限流时间" width="170" />
          <el-table-column prop="createTime" label="记录时间" width="170" />
          <el-table-column label="操作" width="100" align="center" fixed="right">
            <template #default="{ row }">
              <el-button-group size="small">
                <el-button @click="handleViewDetail(row)">
                  <i class="ri-eye-line"></i>
                  详情
                </el-button>
              </el-button-group>
            </template>
          </el-table-column>
        </el-table>

        <!-- 分页 -->
        <div class="pagination-container">
          <el-pagination
            v-model:current-page="pagination.current"
            v-model:page-size="pagination.size"
            :total="pagination.total"
            :page-sizes="[10, 20, 50, 100]"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="loadRecordList"
            @current-change="loadRecordList"
          />
        </div>
      </el-card>
    </div>

    <!-- 详情对话框 -->
    <sc-dialog
      v-model="detailDialogVisible"
      title="限流记录详情"
      width="600px"
    >
      <el-descriptions :column="2" border>
        <el-descriptions-item label="记录ID">
          {{ currentRecord?.sysLimitRecordId }}
        </el-descriptions-item>
        <el-descriptions-item label="规则名称">
          {{ currentRecord?.sysLimitName }}
        </el-descriptions-item>
        <el-descriptions-item label="接口路径" :span="2">
          <el-tag type="warning" size="small">{{ currentRecord?.sysLimitPath }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="IP地址">
          {{ currentRecord?.clientIp || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="用户">
          {{ currentRecord?.sysUserName || currentRecord?.sysUserId || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="限流维度">
          <el-tag :type="getDimensionType(currentRecord?.sysLimitDimension)" size="small">
            {{ getDimensionLabel(currentRecord?.sysLimitDimension) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="请求方法">
          <el-tag :type="getMethodType(currentRecord?.requestMethod)" size="small">
            {{ currentRecord?.requestMethod || '-' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="限流键" :span="2">
          <span class="detail-key">{{ currentRecord?.sysLimitKey || '-' }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="限流时间">
          {{ currentRecord?.sysLimitTime || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="记录时间">
          {{ currentRecord?.createTime }}
        </el-descriptions-item>
        <el-descriptions-item label="用户代理" :span="2">
          <span class="user-agent">{{ currentRecord?.userAgent || '-' }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="请求参数" :span="2">
          <div v-if="currentRecord?.requestParams" class="json-content">
            <pre>{{ formatJson(currentRecord?.requestParams) }}</pre>
          </div>
          <span v-else>-</span>
        </el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
        <el-button type="danger" @click="handleDeleteSingle(currentRecord)">
          删除此记录
        </el-button>
      </template>
    </sc-dialog>

    <!-- 新增对话框 -->
    <sc-dialog
      v-model="addDialogVisible"
      title="新增限流记录"
      width="650px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="100px"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="规则名称" prop="sysLimitName">
              <el-input v-model="formData.sysLimitName" placeholder="请输入规则名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="接口路径" prop="sysLimitPath">
              <el-input v-model="formData.sysLimitPath" placeholder="如: /api/users" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="客户端IP" prop="clientIp">
              <el-input v-model="formData.clientIp" placeholder="如: 192.168.1.100" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="请求方法" prop="requestMethod">
              <el-select v-model="formData.requestMethod" placeholder="请选择" style="width: 100%">
                <el-option label="GET" value="GET" />
                <el-option label="POST" value="POST" />
                <el-option label="PUT" value="PUT" />
                <el-option label="DELETE" value="DELETE" />
                <el-option label="PATCH" value="PATCH" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="用户ID">
              <el-input-number v-model="formData.sysUserId" :min="0" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="用户名">
              <el-input v-model="formData.sysUserName" placeholder="请输入用户名" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="限流维度">
              <el-select v-model="formData.sysLimitDimension" placeholder="请选择" style="width: 100%">
                <el-option label="全局" value="GLOBAL" />
                <el-option label="IP" value="IP" />
                <el-option label="用户" value="USER" />
                <el-option label="接口" value="API" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="限流键">
              <el-input v-model="formData.sysLimitKey" placeholder="限流键值" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="用户代理">
          <el-input v-model="formData.userAgent" placeholder="User-Agent" />
        </el-form-item>
        <el-form-item label="请求参数">
          <el-input
            v-model="formData.requestParams"
            type="textarea"
            :rows="3"
            placeholder="JSON格式的请求参数"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">
          确定
        </el-button>
      </template>
    </sc-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from "element-plus";
import {
  fetchLimitRecordPageForStrategy,
  saveLimitRecordForStrategy,
  deleteLimitRecordForStrategy,
  deleteBatchLimitRecordForStrategy,
  type SysLimitRecord,
  type LimitRecordQueryParams,
} from "../../api";

// 状态
const loading = ref(false);
const submitLoading = ref(false);
const detailDialogVisible = ref(false);
const addDialogVisible = ref(false);
const formRef = ref<FormInstance>();

// 搜索表单
const searchForm = reactive<LimitRecordQueryParams>({
  sysLimitPath: "",
  clientIp: "",
  sysUserId: undefined,
  sysLimitTime: "",
});

// 日期范围
const dateRange = ref<[string, string] | null>(null);

// 分页
const pagination = reactive({
  current: 1,
  size: 10,
  total: 0,
});

// 记录列表
const recordList = ref<SysLimitRecord[]>([]);

// 当前记录
const currentRecord = ref<SysLimitRecord | null>(null);

// 选中行
const selectedRows = ref<SysLimitRecord[]>([]);

// 表单数据
const formData = reactive<SysLimitRecord>({
  sysLimitName: "",
  sysLimitPath: "",
  clientIp: "",
  requestMethod: "GET",
  sysUserId: undefined,
  sysUserName: "",
  sysLimitDimension: "IP",
  sysLimitKey: "",
  userAgent: "",
  requestParams: "",
});

// 表单验证规则
const formRules: FormRules = {
  sysLimitName: [{ required: true, message: "请输入规则名称", trigger: "blur" }],
  sysLimitPath: [{ required: true, message: "请输入接口路径", trigger: "blur" }],
  clientIp: [{ required: true, message: "请输入客户端IP", trigger: "blur" }],
  requestMethod: [{ required: true, message: "请选择请求方法", trigger: "change" }],
};

// 获取维度标签
const getDimensionLabel = (dimension: string | undefined): string => {
  const labels: Record<string, string> = {
    GLOBAL: "全局",
    IP: "IP",
    USER: "用户",
    API: "接口",
  };
  return labels[dimension || ""] || dimension || "-";
};

// 获取维度类型
const getDimensionType = (dimension: string | undefined): string => {
  const types: Record<string, string> = {
    GLOBAL: "danger",
    IP: "warning",
    USER: "success",
    API: "info",
  };
  return types[dimension || ""] || "info";
};

// 获取请求方法类型
const getMethodType = (method: string | undefined): string => {
  const types: Record<string, string> = {
    GET: "success",
    POST: "primary",
    PUT: "warning",
    DELETE: "danger",
    PATCH: "info",
  };
  return types[method || ""] || "info";
};

// 截断文本
const truncateText = (text: string, length: number): string => {
  if (text && text.length > length) {
    return text.substring(0, length) + "...";
  }
  return text;
};

// 格式化JSON
const formatJson = (json: string | undefined): string => {
  if (!json) return "-";
  try {
    return JSON.stringify(JSON.parse(json), null, 2);
  } catch {
    return json;
  }
};

// 加载记录列表
const loadRecordList = async () => {
  loading.value = true;
  try {
    const response = await fetchLimitRecordPageForStrategy({
      ...searchForm,
      current: pagination.current,
      size: pagination.size,
    });
    if (response.success) {
      recordList.value = response.data?.records || [];
      pagination.total = response.data?.total || 0;
    } else {
      ElMessage.error(response.msg || "加载记录列表失败");
    }
  } catch (error) {
    console.error("加载记录列表失败:", error);
    ElMessage.error("加载记录列表失败");
  } finally {
    loading.value = false;
  }
};

// 搜索
const handleSearch = () => {
  pagination.current = 1;
  loadRecordList();
};

// 重置
const handleReset = () => {
  Object.assign(searchForm, {
    sysLimitPath: "",
    clientIp: "",
    sysUserId: undefined,
    sysLimitTime: "",
  });
  dateRange.value = null;
  handleSearch();
};

// 日期变化
const handleDateChange = (val: [string, string] | null) => {
  if (val && val[0]) {
    searchForm.sysLimitTime = val[0];
  } else {
    searchForm.sysLimitTime = "";
  }
};

// 查看详情
const handleViewDetail = (row: SysLimitRecord) => {
  currentRecord.value = row;
  detailDialogVisible.value = true;
};

// 选择变化
const handleSelectionChange = (rows: SysLimitRecord[]) => {
  selectedRows.value = rows;
};

// 新增
const handleAdd = () => {
  resetForm();
  addDialogVisible.value = true;
};

// 重置表单
const resetForm = () => {
  Object.assign(formData, {
    sysLimitRecordId: undefined,
    sysLimitName: "",
    sysLimitPath: "",
    clientIp: "",
    requestMethod: "GET",
    sysUserId: undefined,
    sysUserName: "",
    sysLimitDimension: "IP",
    sysLimitKey: "",
    userAgent: "",
    requestParams: "",
  });
  formRef.value?.resetFields();
};

// 提交表单
const handleSubmit = async () => {
  const valid = await formRef.value?.validate();
  if (!valid) return;

  submitLoading.value = true;
  try {
    const response = await saveLimitRecordForStrategy(formData);
    if (response.success) {
      ElMessage.success("新增成功");
      addDialogVisible.value = false;
      loadRecordList();
    } else {
      ElMessage.error(response.msg || "新增失败");
    }
  } catch (error) {
    console.error("新增失败:", error);
    ElMessage.error("新增失败");
  } finally {
    submitLoading.value = false;
  }
};

// 删除单条记录
const handleDeleteSingle = async (record: SysLimitRecord | null) => {
  if (!record) return;
  try {
    await ElMessageBox.confirm("确定要删除该记录吗？", "删除确认", {
      type: "warning",
    });
    const response = await deleteLimitRecordForStrategy(record.sysLimitRecordId!);
    if (response.success) {
      ElMessage.success("删除成功");
      detailDialogVisible.value = false;
      loadRecordList();
    } else {
      ElMessage.error(response.msg || "删除失败");
    }
  } catch (error) {
    if (error !== "cancel") {
      console.error("删除失败:", error);
      ElMessage.error("删除失败");
    }
  }
};

// 批量删除
const handleBatchDelete = async () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning("请选择要删除的记录");
    return;
  }
  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedRows.value.length} 条记录吗？`,
      "批量删除确认",
      { type: "warning" }
    );
    const ids = selectedRows.value.map((row) => row.sysLimitRecordId!);
    const response = await deleteBatchLimitRecordForStrategy(ids);
    if (response.success) {
      ElMessage.success("批量删除成功");
      loadRecordList();
    } else {
      ElMessage.error(response.msg || "批量删除失败");
    }
  } catch (error) {
    if (error !== "cancel") {
      console.error("批量删除失败:", error);
      ElMessage.error("批量删除失败");
    }
  }
};

// 生命周期
onMounted(() => {
  loadRecordList();
});

// 暴露方法
defineExpose({
  loadRecordList,
  handleSearch,
  handleReset,
});
</script>

<style lang="scss" scoped>
.limit-record-container {
  padding: 20px;

  .search-section {
    margin-bottom: 20px;

    .search-card {
      .search-container {
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 12px;

        .search-left {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;

          .path-input {
            width: 200px;
          }

          .ip-input {
            width: 130px;
          }

          .user-input {
            width: 100px;
          }

          .date-picker {
            width: 360px;
          }
        }

        .search-right {
          display: flex;
          gap: 8px;
        }
      }
    }
  }

  .list-section {
    .ip-text {
      font-family: monospace;
      font-size: 13px;
    }

    .key-text {
      font-family: monospace;
      font-size: 12px;
      color: #606266;
    }

    .config-text {
      font-size: 13px;
      color: #606266;
    }

    .pagination-container {
      display: flex;
      justify-content: flex-end;
      margin-top: 20px;
    }
  }
}

.detail-key {
  font-family: monospace;
  word-break: break-all;
}

.user-agent {
  font-size: 12px;
  color: #909399;
  word-break: break-all;
}

.json-content {
  max-height: 200px;
  overflow: auto;
  background: #f5f7fa;
  padding: 8px;
  border-radius: 4px;

  pre {
    margin: 0;
    font-family: monospace;
    font-size: 12px;
    white-space: pre-wrap;
    word-break: break-all;
  }
}
</style>
