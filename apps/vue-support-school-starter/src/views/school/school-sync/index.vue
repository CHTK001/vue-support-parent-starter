<template>
  <div class="school-sync-container">
    <el-card class="school-sync-card">
      <template #header>
        <div class="school-card-header">
          <span>同步配置</span>
          <el-button type="primary" @click="handleAdd">
            <IconifyIconOnline icon="ri:add-line" />
            新增配置
          </el-button>
        </div>
      </template>

      <ScTable ref="tableRef" :url="getSchoolPlanList" :params="{ pageNum: 1, pageSize: 10 }">
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="schoolPlanName" label="配置名称" min-width="160" show-overflow-tooltip />
        <el-table-column prop="schoolPlanYear" label="年份" width="100" align="center" />
        <el-table-column prop="schoolPlanType" label="类型" width="120" />
        <el-table-column prop="schoolPlanLevel" label="层次" width="100" />
        <el-table-column prop="schoolPlanProvince" label="省份" width="100" />
        <el-table-column prop="schoolPlanEnrolled" label="已同步数" width="100" align="right" />
        <el-table-column prop="schoolPlanQuota" label="计划总数" width="100" align="right" />
        <el-table-column prop="schoolPlanStatus" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.schoolPlanStatus === 1 ? 'success' : 'danger'">
              {{ row.schoolPlanStatus === 1 ? "启用" : "禁用" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleEdit(row)">
              <IconifyIconOnline icon="ri:edit-line" />
              编辑
            </el-button>
            <el-button type="primary" link @click="handleExecute(row)">
              <IconifyIconOnline icon="ri:play-line" />
              执行
            </el-button>
            <el-popconfirm title="确定要删除此配置吗？" @confirm="handleDelete(row)">
              <template #reference>
                <el-button type="danger" link>
                  <IconifyIconOnline icon="ri:delete-bin-line" />
                  删除
                </el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </ScTable>
    </el-card>

    <!-- 配置弹窗 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="650px" destroy-on-close>
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px">
        <el-form-item label="配置名称" prop="schoolPlanName">
          <el-input v-model="formData.schoolPlanName" placeholder="请输入配置名称" />
        </el-form-item>
        <el-form-item label="年份" prop="schoolPlanYear">
          <el-input-number v-model="formData.schoolPlanYear" :min="2000" :max="2100" placeholder="请输入年份" />
        </el-form-item>
        <el-form-item label="类型" prop="schoolPlanType">
          <el-select v-model="formData.schoolPlanType" placeholder="请选择类型">
            <el-option label="本科批次" value="本科批次" />
            <el-option label="专科批次" value="专科批次" />
            <el-option label="艺术批次" value="艺术批次" />
            <el-option label="体育批次" value="体育批次" />
          </el-select>
        </el-form-item>
        <el-form-item label="层次" prop="schoolPlanLevel">
          <el-select v-model="formData.schoolPlanLevel" placeholder="请选择层次">
            <el-option label="本科" value="本科" />
            <el-option label="专科" value="专科" />
          </el-select>
        </el-form-item>
        <el-form-item label="省份" prop="schoolPlanProvince">
          <el-select v-model="formData.schoolPlanProvince" placeholder="请选择省份">
            <el-option label="北京市" value="北京市" />
            <el-option label="上海市" value="上海市" />
            <el-option label="广东省" value="广东省" />
            <el-option label="江苏省" value="江苏省" />
            <el-option label="浙江省" value="浙江省" />
            <!-- 更多省份选项 -->
          </el-select>
        </el-form-item>
        <el-form-item label="城市" prop="schoolPlanCity">
          <el-input v-model="formData.schoolPlanCity" placeholder="请输入城市" />
        </el-form-item>
        <el-form-item label="计划总数" prop="schoolPlanQuota">
          <el-input-number v-model="formData.schoolPlanQuota" :min="0" placeholder="请输入计划总数" />
        </el-form-item>
        <el-form-item label="开始日期" prop="schoolPlanStartDate">
          <el-date-picker v-model="formData.schoolPlanStartDate" type="date" placeholder="请选择开始日期" format="YYYY-MM-DD" value-format="YYYY-MM-DD" />
        </el-form-item>
        <el-form-item label="结束日期" prop="schoolPlanEndDate">
          <el-date-picker v-model="formData.schoolPlanEndDate" type="date" placeholder="请选择结束日期" format="YYYY-MM-DD" value-format="YYYY-MM-DD" />
        </el-form-item>
        <el-form-item label="状态" prop="schoolPlanStatus">
          <el-switch v-model="formData.schoolPlanStatus" :active-value="1" :inactive-value="0" active-text="启用" inactive-text="禁用" />
        </el-form-item>
        <el-form-item label="说明" prop="schoolPlanDescription">
          <el-input v-model="formData.schoolPlanDescription" type="textarea" :rows="3" placeholder="请输入配置说明" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSave">保存</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 手动同步弹窗 -->
    <el-dialog v-model="syncDialogVisible" title="手动同步学校" width="500px" destroy-on-close>
      <el-form ref="syncFormRef" :model="syncForm" :rules="syncFormRules" label-width="100px">
        <el-form-item label="学校ID" prop="schoolId">
          <el-input v-model="syncForm.schoolId" placeholder="请输入高考网学校ID" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="syncDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSync">
            <IconifyIconOnline icon="ri:refresh-line" />
            开始同步
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, computed } from "vue";
import { message } from "@repo/utils";
import { getSchoolPlanList, addSchoolPlan, updateSchoolPlan, deleteSchoolPlan } from "@/api/school";
import type { FormInstance, FormRules } from "element-plus";

// 表格实例
const tableRef = ref();

// 对话框显示状态
const dialogVisible = ref(false);
const syncDialogVisible = ref(false);

// 是否为编辑模式
const isEdit = ref(false);

// 对话框标题
const dialogTitle = computed(() => (isEdit.value ? "编辑同步配置" : "新增同步配置"));

// 表单实例
const formRef = ref<FormInstance>();
const syncFormRef = ref<FormInstance>();

// 表单数据
const formData = reactive({
  schoolPlanId: undefined as number | undefined,
  schoolId: 0, // 关联的学校ID
  schoolPlanName: "",
  schoolPlanYear: new Date().getFullYear(),
  schoolPlanType: "",
  schoolPlanLevel: "",
  schoolPlanMajor: "",
  schoolPlanQuota: 0,
  schoolPlanProvince: "",
  schoolPlanCity: "",
  schoolPlanDistrict: "",
  schoolPlanStartDate: "",
  schoolPlanEndDate: "",
  schoolPlanStatus: 1,
  schoolPlanDescription: "",
});

// 手动同步表单
const syncForm = reactive({
  schoolId: "",
});

// 表单验证规则
const formRules = reactive<FormRules>({
  schoolPlanName: [
    { required: true, message: "请输入配置名称", trigger: "blur" },
    { min: 2, max: 50, message: "长度在 2 到 50 个字符", trigger: "blur" },
  ],
  schoolPlanYear: [{ required: true, message: "请输入年份", trigger: "blur" }],
  schoolPlanType: [{ required: true, message: "请选择类型", trigger: "change" }],
  schoolPlanLevel: [{ required: true, message: "请选择层次", trigger: "change" }],
  schoolPlanProvince: [{ required: true, message: "请选择省份", trigger: "change" }],
  schoolPlanQuota: [{ required: true, message: "请输入计划总数", trigger: "blur" }],
});

// 手动同步表单验证规则
const syncFormRules = reactive<FormRules>({
  schoolId: [{ required: true, message: "请输入高考网学校ID", trigger: "blur" }],
});

// 新增配置
const handleAdd = () => {
  isEdit.value = false;
  resetForm();
  dialogVisible.value = true;
};

// 编辑配置
const handleEdit = (row: any) => {
  isEdit.value = true;
  resetForm();
  Object.assign(formData, row);
  dialogVisible.value = true;
};

// 重置表单
const resetForm = () => {
  formData.schoolPlanId = undefined;
  formData.schoolId = 0;
  formData.schoolPlanName = "";
  formData.schoolPlanYear = new Date().getFullYear();
  formData.schoolPlanType = "";
  formData.schoolPlanLevel = "";
  formData.schoolPlanMajor = "";
  formData.schoolPlanQuota = 0;
  formData.schoolPlanProvince = "";
  formData.schoolPlanCity = "";
  formData.schoolPlanDistrict = "";
  formData.schoolPlanStartDate = "";
  formData.schoolPlanEndDate = "";
  formData.schoolPlanStatus = 1;
  formData.schoolPlanDescription = "";
};

// 保存配置
const handleSave = () => {
  if (!formRef.value) return;

  formRef.value.validate((valid) => {
    if (valid) {
      const saveFunc = isEdit.value ? updateSchoolPlan : addSchoolPlan;
      saveFunc(formData)
        .then((res) => {
          if (res.code === 200) {
            message("保存成功", { type: "success" });
            dialogVisible.value = false;
            tableRef.value?.refresh();
          } else {
            message(res.message || "保存失败", { type: "error" });
          }
        })
        .catch((err) => {
          console.error("保存失败:", err);
          message("保存失败", { type: "error" });
        });
    }
  });
};

// 删除配置
const handleDelete = (row: any) => {
  deleteSchoolPlan(row.schoolPlanId)
    .then((res) => {
      if (res.code === 200) {
        message("删除成功", { type: "success" });
        tableRef.value?.refresh();
      } else {
        message(res.message || "删除失败", { type: "error" });
      }
    })
    .catch((err) => {
      console.error("删除失败:", err);
      message("删除失败", { type: "error" });
    });
};

// 执行同步
const handleExecute = (row: any) => {
  message("开始执行同步任务", { type: "info" });

  // 这里应该调用实际的执行同步接口
  setTimeout(() => {
    message("同步任务已启动，请稍后查看结果", { type: "success" });
    tableRef.value?.refresh();
  }, 1000);
};

// 打开手动同步对话框
const handleShowSyncDialog = () => {
  syncForm.schoolId = "";
  syncDialogVisible.value = true;
};

// 手动同步
const handleSync = () => {
  if (!syncFormRef.value) return;

  syncFormRef.value.validate((valid) => {
    if (valid) {
      message("开始同步学校数据", { type: "info" });

      // 这里应该调用实际的同步接口
      setTimeout(() => {
        message("同步任务已启动，请稍后查看结果", { type: "success" });
        syncDialogVisible.value = false;
      }, 1000);
    }
  });
};
</script>

<style scoped>
.school-sync-container {
  padding: 16px;
}

.school-sync-card {
  margin-bottom: 16px;
}

.school-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.dialog-footer {
  width: 100%;
  display: flex;
  justify-content: flex-end;
}
</style>
