<template>
  <div class="school-list-container">
    <!-- 查询表单 -->
    <SchoolSearch @search="handleSearch" @reset="handleReset" />

    <!-- 操作按钮 -->
    <div class="school-action-bar">
      <el-button type="primary" @click="handleAdd">
        <IconifyIconOnline icon="ri:add-line" />
        新增学校
      </el-button>
    </div>

    <!-- 数据表格 -->
    <SchoolTable ref="tableRef" :params="queryParams" @view="handleView" @edit="handleEdit" @delete="handleDelete" @refresh="handleRefresh" />

    <!-- 表单弹窗 -->
    <SchoolForm ref="formRef" @success="handleSuccess" @cancel="handleCancel" />
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive } from "vue";
import { useRouter } from "vue-router";
import SchoolSearch from "./components/SchoolSearch.vue";
import SchoolTable from "./components/SchoolTable.vue";
import SchoolForm from "./components/SchoolForm.vue";
import type { SchoolInfoQuery, SchoolInfo } from "@/api/school";

// 路由实例
const router = useRouter();

// 表格实例
const tableRef = ref();

// 表单实例
const formRef = ref();

// 查询参数
const queryParams = reactive<SchoolInfoQuery>({
  schoolName: "",
  schoolType: "",
  schoolLevel: "",
  schoolProvince: "",
  schoolCity: "",
  schoolDistrict: "",
  schoolStatus: undefined,
  pageNum: 1,
  pageSize: 10,
});

// 处理查询
const handleSearch = (params: SchoolInfoQuery) => {
  Object.assign(queryParams, params);
  refreshTable();
};

// 处理重置
const handleReset = () => {
  refreshTable();
};

// 刷新表格
const refreshTable = () => {
  if (tableRef.value) {
    tableRef.value.refresh();
  }
};

// 新增学校
const handleAdd = () => {
  if (formRef.value) {
    formRef.value.openDialog("add");
  }
};

// 查看学校详情
const handleView = (row: SchoolInfo) => {
  router.push({
    name: "SchoolDetail",
    params: { id: row.schoolId },
  });
};

// 编辑学校
const handleEdit = (row: SchoolInfo) => {
  if (formRef.value) {
    formRef.value.openDialog("edit", row);
  }
};

// 删除学校
const handleDelete = () => {
  // 由表格组件处理删除操作
};

// 操作成功回调
const handleSuccess = () => {
  refreshTable();
};

// 取消操作
const handleCancel = () => {
  // 不做任何处理
};

// 刷新回调
const handleRefresh = () => {
  // 不需要额外处理
};
</script>

<style scoped>
.school-list-container {
  padding: 16px;
}

.school-action-bar {
  margin-bottom: 16px;
  display: flex;
  justify-content: flex-end;
}
</style>
