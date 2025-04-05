<template>
  <div class="school-detail-container" v-loading="loading">
    <div class="school-detail-header">
      <el-button @click="goBack" link>
        <IconifyIconOnline icon="ri:arrow-left-line" />
        返回列表
      </el-button>
      <div class="school-actions">
        <el-button type="primary" @click="handleEdit" v-if="enableEdit">
          <IconifyIconOnline icon="ri:edit-line" />
          编辑学校
        </el-button>
      </div>
    </div>

    <!-- 学校基本信息 -->
    <SchoolBaseInfo :school-info="schoolInfo" />

    <!-- 学校介绍 -->
    <SchoolDescription title="学校介绍" :content="schoolInfo.schoolDescription" empty-text="暂无学校介绍" />

    <!-- 学校特色 -->
    <SchoolDescription title="学校特色" :content="schoolInfo.schoolFeatures" empty-text="暂无学校特色" />

    <!-- 学科列表 -->
    <SchoolSubjects ref="subjectsRef" :school-id="schoolId" :enable-edit="enableEdit" />

    <!-- 学校表单 -->
    <SchoolForm ref="formRef" @success="handleSuccess" @cancel="handleCancel" />
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { message } from "@repo/utils";
import { getSchoolInfo } from "@/api/school";
import SchoolBaseInfo from "./components/SchoolBaseInfo.vue";
import SchoolDescription from "./components/SchoolDescription.vue";
import SchoolSubjects from "./components/SchoolSubjects.vue";
import SchoolForm from "../school-list/components/SchoolForm.vue"; // 复用学校表单组件
import type { SchoolInfo } from "@/api/school";

// 路由实例
const route = useRoute();
const router = useRouter();
const schoolId = ref<number>(Number(route.params.id) || 0);

// 是否启用编辑功能
const enableEdit = ref(true);

// 加载状态
const loading = ref(false);

// 学校信息
const schoolInfo = reactive<SchoolInfo>({
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

// 表单实例
const formRef = ref();
const subjectsRef = ref();

// 获取学校详情
const fetchSchoolInfo = () => {
  if (!schoolId.value) {
    message("学校ID不能为空", { type: "error" });
    return;
  }

  loading.value = true;
  getSchoolInfo(schoolId.value)
    .then((res) => {
      if (res.data) {
        Object.assign(schoolInfo, res.data);
      } else {
        message("获取学校信息失败", { type: "error" });
      }
    })
    .catch((err) => {
      console.error("获取学校信息出错:", err);
      message("获取学校信息出错", { type: "error" });
    })
    .finally(() => {
      loading.value = false;
    });
};

// 返回列表页
const goBack = () => {
  router.push({ name: "SchoolList" });
};

// 编辑学校信息
const handleEdit = () => {
  if (formRef.value) {
    formRef.value.openDialog("edit", schoolInfo);
  }
};

// 操作成功回调
const handleSuccess = () => {
  fetchSchoolInfo();
};

// 取消操作
const handleCancel = () => {
  // 不做任何处理
};

// 页面加载时获取数据
onMounted(() => {
  fetchSchoolInfo();
});
</script>

<style scoped>
.school-detail-container {
  padding: 16px;
}

.school-detail-header {
  margin-bottom: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.school-actions {
  display: flex;
  gap: 10px;
}
</style>
