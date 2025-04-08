<template>
  <el-card class="school-subject-card">
    <template #header>
      <div class="school-card-header">
        <span>学科列表</span>
        <el-button type="primary" @click="handleAddSubject" v-if="enableEdit">
          <IconifyIconOnline icon="ri:add-line" />
          新增学科
        </el-button>
      </div>
    </template>

    <ScTable layout="card" ref="subjectTableRef" :url="getSchoolSubjectList" :params="{ schoolId: schoolId }">
      <template #default="{ row }">
        <div class="subject-card">
          <div class="subject-header">
            <h3 class="subject-name">{{ row.schoolSubjectName }}</h3>
            <el-tag size="small" v-if="row.schoolSubjectType">{{ row.schoolSubjectType }}</el-tag>
          </div>
          <div class="subject-info">
            <p v-if="row.schoolSubjectCategory"><span class="label">类别:</span> {{ row.schoolSubjectCategory }}</p>
            <p v-if="row.schoolSubjectGrade"><span class="label">年级:</span> {{ row.schoolSubjectGrade }}</p>
            <p v-if="row.schoolSubjectSemester"><span class="label">学期:</span> {{ row.schoolSubjectSemester }}</p>
            <p v-if="row.schoolSubjectCredit"><span class="label">学分:</span> {{ row.schoolSubjectCredit }}</p>
            <p v-if="row.schoolSubjectHours"><span class="label">课时:</span> {{ row.schoolSubjectHours }}</p>
          </div>
          <div class="subject-description" v-if="row.schoolSubjectDescription">
            <p class="description-text">{{ row.schoolSubjectDescription }}</p>
          </div>
          <div class="subject-footer">
            <div class="subject-tags">
              <el-tag size="small" type="success" v-if="row.schoolSubjectIsMain === 1">主修</el-tag>
              <el-tag size="small" type="warning" v-if="row.schoolSubjectIsExam === 1">考试科目</el-tag>
            </div>
            <div class="subject-actions" v-if="enableEdit">
              <el-button type="primary" link @click="handleEditSubject(row)">
                <IconifyIconOnline icon="ri:edit-line" />
                编辑
              </el-button>
              <el-popconfirm title="确定要删除此学科吗？" @confirm="handleDeleteSubject(row)">
                <template #reference>
                  <el-button type="danger" link>
                    <IconifyIconOnline icon="ri:delete-bin-line" />
                    删除
                  </el-button>
                </template>
              </el-popconfirm>
            </div>
          </div>
        </div>
      </template>
    </ScTable>

    <!-- 学科表单弹窗 -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑学科' : '新增学科'" width="600px" destroy-on-close>
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px">
        <el-form-item label="学科名称" prop="schoolSubjectName">
          <el-input v-model="formData.schoolSubjectName" placeholder="请输入学科名称" />
        </el-form-item>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="学科类型" prop="schoolSubjectType">
              <el-select v-model="formData.schoolSubjectType" placeholder="请选择学科类型" style="width: 100%">
                <el-option label="文科" value="文科" />
                <el-option label="理科" value="理科" />
                <el-option label="艺术" value="艺术" />
                <el-option label="体育" value="体育" />
                <el-option label="综合" value="综合" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="学科类别" prop="schoolSubjectCategory">
              <el-input v-model="formData.schoolSubjectCategory" placeholder="请输入学科类别" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="年级" prop="schoolSubjectGrade">
              <el-select v-model="formData.schoolSubjectGrade" placeholder="请选择年级" style="width: 100%">
                <el-option label="一年级" value="一年级" />
                <el-option label="二年级" value="二年级" />
                <el-option label="三年级" value="三年级" />
                <el-option label="四年级" value="四年级" />
                <el-option label="五年级" value="五年级" />
                <el-option label="六年级" value="六年级" />
                <el-option label="初一" value="初一" />
                <el-option label="初二" value="初二" />
                <el-option label="初三" value="初三" />
                <el-option label="高一" value="高一" />
                <el-option label="高二" value="高二" />
                <el-option label="高三" value="高三" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="学期" prop="schoolSubjectSemester">
              <el-select v-model="formData.schoolSubjectSemester" placeholder="请选择学期" style="width: 100%">
                <el-option label="上学期" value="上学期" />
                <el-option label="下学期" value="下学期" />
                <el-option label="全年" value="全年" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="学分" prop="schoolSubjectCredit">
              <el-input-number v-model="formData.schoolSubjectCredit" :precision="1" :step="0.5" :min="0" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="课时" prop="schoolSubjectHours">
              <el-input-number v-model="formData.schoolSubjectHours" :precision="0" :min="0" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="是否主修" prop="schoolSubjectIsMain">
              <el-radio-group v-model="formData.schoolSubjectIsMain">
                <el-radio :label="1">是</el-radio>
                <el-radio :label="0">否</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="是否考试" prop="schoolSubjectIsExam">
              <el-radio-group v-model="formData.schoolSubjectIsExam">
                <el-radio :label="1">是</el-radio>
                <el-radio :label="0">否</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="学科介绍" prop="schoolSubjectDescription">
          <el-input v-model="formData.schoolSubjectDescription" type="textarea" :rows="3" placeholder="请输入学科介绍" />
        </el-form-item>

        <el-form-item label="学科要求" prop="schoolSubjectRequirement">
          <el-input v-model="formData.schoolSubjectRequirement" type="textarea" :rows="3" placeholder="请输入学科要求" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSaveSubject">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </el-card>
</template>

<script lang="ts" setup>
import { ref, reactive } from "vue";
import { message } from "@repo/utils";
import { getSchoolSubjectList, addSchoolSubject, updateSchoolSubject, deleteSchoolSubject } from "@/api";
import type { SchoolSubject } from "@/api";
import type { FormInstance, FormRules } from "element-plus";

// 接收属性
const props = defineProps<{
  schoolId: number;
  enableEdit?: boolean;
}>();

// 表格实例
const subjectTableRef = ref();

// 对话框状态
const dialogVisible = ref(false);
const isEdit = ref(false);

// 表单实例
const formRef = ref<FormInstance>();

// 表单数据
const formData = reactive<SchoolSubject>({
  schoolId: props.schoolId,
  schoolSubjectName: "",
  schoolSubjectCode: "",
  schoolSubjectType: "",
  schoolSubjectCategory: "",
  schoolSubjectCredit: undefined,
  schoolSubjectHours: undefined,
  schoolSubjectDescription: "",
  schoolSubjectRequirement: "",
  schoolSubjectGrade: "",
  schoolSubjectSemester: "",
  schoolSubjectIsMain: 0,
  schoolSubjectIsExam: 0,
  schoolSubjectStatus: 1,
});

// 表单校验规则
const formRules = reactive<FormRules>({
  schoolSubjectName: [
    { required: true, message: "请输入学科名称", trigger: "blur" },
    { min: 2, max: 50, message: "长度在 2 到 50 个字符", trigger: "blur" },
  ],
  schoolSubjectType: [{ required: true, message: "请选择学科类型", trigger: "change" }],
});

// 新增学科
const handleAddSubject = () => {
  isEdit.value = false;
  resetForm();
  dialogVisible.value = true;
};

// 编辑学科
const handleEditSubject = (row: SchoolSubject) => {
  isEdit.value = true;
  resetForm();
  Object.assign(formData, row);
  dialogVisible.value = true;
};

// 删除学科
const handleDeleteSubject = (row: SchoolSubject) => {
  if (!row.schoolSubjectId) {
    message("学科ID不能为空", { type: "error" });
    return;
  }

  deleteSchoolSubject(row.schoolSubjectId)
    .then((res) => {
      if (res.code === 200) {
        message("删除成功", { type: "success" });
        refreshTable();
      } else {
        message(res.message || "删除失败", { type: "error" });
      }
    })
    .catch((err) => {
      console.error("删除失败:", err);
      message("删除失败", { type: "error" });
    });
};

// 保存学科
const handleSaveSubject = () => {
  if (!formRef.value) return;

  formRef.value.validate((valid) => {
    if (valid) {
      // 确保学校ID正确
      formData.schoolId = props.schoolId;

      const saveFunc = isEdit.value ? updateSchoolSubject : addSchoolSubject;
      saveFunc(formData)
        .then((res) => {
          if (res.code === 200) {
            message(isEdit.value ? "修改成功" : "新增成功", { type: "success" });
            dialogVisible.value = false;
            refreshTable();
          } else {
            message(res.message || (isEdit.value ? "修改失败" : "新增失败"), { type: "error" });
          }
        })
        .catch((err) => {
          console.error(isEdit.value ? "修改失败:" : "新增失败:", err);
          message(isEdit.value ? "修改失败" : "新增失败", { type: "error" });
        });
    }
  });
};

// 重置表单
const resetForm = () => {
  if (formRef.value) {
    formRef.value.resetFields();
  }

  // 重置数据
  formData.schoolSubjectId = undefined;
  formData.schoolId = props.schoolId;
  formData.schoolSubjectName = "";
  formData.schoolSubjectCode = "";
  formData.schoolSubjectType = "";
  formData.schoolSubjectCategory = "";
  formData.schoolSubjectCredit = undefined;
  formData.schoolSubjectHours = undefined;
  formData.schoolSubjectDescription = "";
  formData.schoolSubjectRequirement = "";
  formData.schoolSubjectGrade = "";
  formData.schoolSubjectSemester = "";
  formData.schoolSubjectTeacherCount = undefined;
  formData.schoolSubjectStudentCount = undefined;
  formData.schoolSubjectIsMain = 0;
  formData.schoolSubjectIsExam = 0;
  formData.schoolSubjectStatus = 1;
};

// 刷新表格
const refreshTable = () => {
  if (subjectTableRef.value) {
    subjectTableRef.value.refresh();
  }
};

// 暴露方法
defineExpose({
  refreshTable,
});
</script>

<style scoped>
.school-subject-card {
  margin-bottom: 16px;
}

.school-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* 学科卡片样式 */
.subject-card {
  padding: 16px;
  border: 1px solid #eee;
  border-radius: 4px;
  transition: all 0.3s;
}

.subject-card:hover {
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.subject-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.subject-name {
  margin: 0;
  font-size: 16px;
  font-weight: bold;
}

.subject-info {
  margin-bottom: 10px;
}

.subject-info p {
  margin: 5px 0;
  font-size: 14px;
}

.label {
  font-weight: bold;
  color: #606266;
}

.subject-description {
  margin-bottom: 10px;
  padding: 10px;
  background-color: #f9f9f9;
  border-radius: 4px;
}

.description-text {
  margin: 0;
  font-size: 14px;
  color: #606266;
  line-height: 1.5;
}

.subject-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.subject-tags {
  display: flex;
  gap: 5px;
}

.dialog-footer {
  width: 100%;
  display: flex;
  justify-content: flex-end;
}
</style>
