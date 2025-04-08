<template>
  <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑学校信息' : '新增学校信息'" width="650px" destroy-on-close>
    <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px">
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="学校名称" prop="schoolName">
            <el-input v-model="formData.schoolName" placeholder="请输入学校名称" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="学校代码" prop="schoolCode">
            <el-input v-model="formData.schoolCode" placeholder="请输入学校代码" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="学校类型" prop="schoolType">
            <el-select v-model="formData.schoolType" placeholder="请选择学校类型" style="width: 100%">
              <el-option label="综合" value="综合" />
              <el-option label="理工" value="理工" />
              <el-option label="农林" value="农林" />
              <el-option label="医药" value="医药" />
              <el-option label="师范" value="师范" />
              <el-option label="语言" value="语言" />
              <el-option label="财经" value="财经" />
              <el-option label="政法" value="政法" />
              <el-option label="体育" value="体育" />
              <el-option label="艺术" value="艺术" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="办学层次" prop="schoolLevel">
            <el-select v-model="formData.schoolLevel" placeholder="请选择办学层次" style="width: 100%">
              <el-option label="本科" value="本科" />
              <el-option label="专科" value="专科" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="省份" prop="schoolProvince">
            <el-select v-model="formData.schoolProvince" placeholder="请选择省份" style="width: 100%">
              <el-option label="北京市" value="北京市" />
              <el-option label="上海市" value="上海市" />
              <el-option label="广东省" value="广东省" />
              <el-option label="江苏省" value="江苏省" />
              <el-option label="浙江省" value="浙江省" />
              <!-- 更多省份选项 -->
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="城市" prop="schoolCity">
            <el-input v-model="formData.schoolCity" placeholder="请输入城市" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="建校时间" prop="schoolFoundingDate">
            <el-date-picker v-model="formData.schoolFoundingDate" type="date" placeholder="请选择建校时间" style="width: 100%" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="联系电话" prop="schoolPhone">
            <el-input v-model="formData.schoolPhone" placeholder="请输入联系电话" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="学生人数" prop="schoolStudentCount">
            <el-input-number v-model="formData.schoolStudentCount" :min="0" :precision="0" style="width: 100%" placeholder="请输入学生人数" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="教师人数" prop="schoolTeacherCount">
            <el-input-number v-model="formData.schoolTeacherCount" :min="0" :precision="0" style="width: 100%" placeholder="请输入教师人数" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="班级数量" prop="schoolClassCount">
            <el-input-number v-model="formData.schoolClassCount" :min="0" :precision="0" style="width: 100%" placeholder="请输入班级数量" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="学校状态" prop="schoolStatus">
            <el-select v-model="formData.schoolStatus" placeholder="请选择学校状态" style="width: 100%">
              <el-option label="正常" :value="1" />
              <el-option label="停用" :value="0" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item label="学校网站" prop="schoolWebsite">
        <el-input v-model="formData.schoolWebsite" placeholder="请输入学校网站" />
      </el-form-item>

      <el-form-item label="学校地址" prop="schoolAddress">
        <el-input v-model="formData.schoolAddress" placeholder="请输入学校地址" />
      </el-form-item>

      <el-form-item label="学校介绍" prop="schoolDescription">
        <el-input v-model="formData.schoolDescription" type="textarea" :rows="3" placeholder="请输入学校介绍" />
      </el-form-item>

      <el-form-item label="学校特色" prop="schoolFeatures">
        <el-input v-model="formData.schoolFeatures" type="textarea" :rows="3" placeholder="请输入学校特色" />
      </el-form-item>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="closeDialog">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup>
import { ref, reactive, computed, watch } from "vue";
import { message } from "@repo/utils";
import { addSchoolInfo, updateSchoolInfo } from "@/api";
import type { SchoolInfo } from "@/api";
import type { FormInstance, FormRules } from "element-plus";

// 对话框可见状态
const dialogVisible = ref(false);

// 表单实例
const formRef = ref<FormInstance>();

// 编辑状态
const isEdit = ref(false);

// 表单数据
const formData = reactive<SchoolInfo>({
  schoolName: "",
  schoolCode: "",
  schoolType: "",
  schoolLevel: "",
  schoolAddress: "",
  schoolProvince: "",
  schoolCity: "",
  schoolDistrict: "",
  schoolPhone: "",
  schoolEmail: "",
  schoolWebsite: "",
  schoolFoundingDate: "",
  schoolArea: undefined,
  schoolBuildingArea: undefined,
  schoolStudentCount: undefined,
  schoolTeacherCount: undefined,
  schoolClassCount: undefined,
  schoolDescription: "",
  schoolFeatures: "",
  schoolPrincipal: "",
  schoolLogo: "",
  schoolStatus: 1,
});

// 表单校验规则
const formRules = reactive<FormRules>({
  schoolName: [
    { required: true, message: "学校名称不能为空", trigger: "blur" },
    { min: 2, max: 50, message: "长度在 2 到 50 个字符", trigger: "blur" },
  ],
  schoolType: [{ required: true, message: "请选择学校类型", trigger: "change" }],
  schoolLevel: [{ required: true, message: "请选择办学层次", trigger: "change" }],
  schoolProvince: [{ required: true, message: "请选择省份", trigger: "change" }],
  schoolStatus: [{ required: true, message: "请选择学校状态", trigger: "change" }],
});

// 定义emit
const emit = defineEmits<{
  (e: "success"): void;
  (e: "cancel"): void;
}>();

// 关闭对话框
const closeDialog = () => {
  dialogVisible.value = false;
  emit("cancel");
};

// 打开对话框
const openDialog = (type: string, data?: SchoolInfo) => {
  dialogVisible.value = true;
  isEdit.value = type === "edit";

  // 重置表单
  resetForm();

  // 编辑模式，填充表单数据
  if (isEdit.value && data) {
    Object.assign(formData, data);
  }
};

// 重置表单
const resetForm = () => {
  if (formRef.value) {
    formRef.value.resetFields();
  }

  // 重置数据
  formData.schoolId = undefined;
  formData.schoolName = "";
  formData.schoolCode = "";
  formData.schoolType = "";
  formData.schoolLevel = "";
  formData.schoolAddress = "";
  formData.schoolProvince = "";
  formData.schoolCity = "";
  formData.schoolDistrict = "";
  formData.schoolPhone = "";
  formData.schoolEmail = "";
  formData.schoolWebsite = "";
  formData.schoolFoundingDate = "";
  formData.schoolArea = undefined;
  formData.schoolBuildingArea = undefined;
  formData.schoolStudentCount = undefined;
  formData.schoolTeacherCount = undefined;
  formData.schoolClassCount = undefined;
  formData.schoolDescription = "";
  formData.schoolFeatures = "";
  formData.schoolPrincipal = "";
  formData.schoolLogo = "";
  formData.schoolStatus = 1;
};

// 提交表单
const handleSubmit = () => {
  if (!formRef.value) return;

  formRef.value.validate((valid) => {
    if (valid) {
      const saveFunc = isEdit.value ? updateSchoolInfo : addSchoolInfo;
      saveFunc(formData)
        .then((res) => {
          if (res.code === 200) {
            message(isEdit.value ? "修改成功" : "新增成功", { type: "success" });
            dialogVisible.value = false;
            emit("success");
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

// 暴露方法
defineExpose({
  openDialog,
});
</script>

<style scoped>
.dialog-footer {
  width: 100%;
  display: flex;
  justify-content: flex-end;
}
</style>
