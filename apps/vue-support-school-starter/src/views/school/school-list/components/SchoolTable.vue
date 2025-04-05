<template>
  <ScTable ref="tableRef" :url="getSchoolInfoList" :params="params" height="calc(100vh - 280px)">
    <el-table-column type="index" label="序号" width="60" align="center" />
    <el-table-column prop="schoolName" label="学校名称" min-width="160" show-overflow-tooltip>
      <template #default="{ row }">
        <router-link :to="{ name: 'SchoolDetail', params: { id: row.schoolId } }" class="school-link">
          {{ row.schoolName }}
        </router-link>
      </template>
    </el-table-column>
    <el-table-column prop="schoolType" label="学校类型" width="100" />
    <el-table-column prop="schoolLevel" label="办学层次" width="100" />
    <el-table-column prop="schoolProvince" label="所在省份" width="100" />
    <el-table-column prop="schoolCity" label="所在城市" width="100" />
    <el-table-column prop="schoolStudentCount" label="学生人数" width="100" align="right" />
    <el-table-column prop="schoolTeacherCount" label="教师人数" width="100" align="right" />
    <el-table-column prop="schoolStatus" label="状态" width="80">
      <template #default="{ row }">
        <el-tag :type="row.schoolStatus === 1 ? 'success' : 'danger'">
          {{ row.schoolStatus === 1 ? "正常" : "停用" }}
        </el-tag>
      </template>
    </el-table-column>
    <el-table-column label="操作" width="180" fixed="right">
      <template #default="{ row }">
        <el-button type="primary" link @click="handleView(row)">
          <IconifyIconOnline icon="ri:eye-line" />
          查看
        </el-button>
        <el-button type="primary" link @click="handleEdit(row)">
          <IconifyIconOnline icon="ri:edit-line" />
          编辑
        </el-button>
        <el-popconfirm title="确定要删除此学校吗？" @confirm="handleDelete(row)">
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
</template>

<script lang="ts" setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { message } from "@repo/utils";
import { getSchoolInfoList, deleteSchoolInfo } from "@/api/school";
import type { SchoolInfoQuery, SchoolInfo } from "@/api/school";

// 路由实例
const router = useRouter();

// 接收props
const props = defineProps<{
  params: SchoolInfoQuery;
}>();

// 定义emit
const emit = defineEmits<{
  (e: "view", row: SchoolInfo): void;
  (e: "edit", row: SchoolInfo): void;
  (e: "delete", row: SchoolInfo): void;
  (e: "refresh"): void;
}>();

// 表格实例
const tableRef = ref();

// 查看学校详情
const handleView = (row: SchoolInfo) => {
  emit("view", row);
};

// 编辑学校信息
const handleEdit = (row: SchoolInfo) => {
  emit("edit", row);
};

// 删除学校
const handleDelete = (row: SchoolInfo) => {
  if (!row.schoolId) {
    message("学校ID不能为空", { type: "error" });
    return;
  }

  deleteSchoolInfo(row.schoolId)
    .then((res) => {
      if (res.code === 200) {
        message("删除成功", { type: "success" });
        // 刷新表格
        refresh();
      } else {
        message(res.message || "删除失败", { type: "error" });
      }
    })
    .catch((err) => {
      console.error("删除失败:", err);
      message("删除失败", { type: "error" });
    });
};

// 刷新表格
const refresh = () => {
  if (tableRef.value) {
    tableRef.value.refresh();
  }
  emit("refresh");
};

// 暴露给父组件的方法
defineExpose({
  refresh,
});
</script>

<style scoped>
.school-link {
  color: var(--el-color-primary);
  text-decoration: none;
}

.school-link:hover {
  text-decoration: underline;
}
</style>
