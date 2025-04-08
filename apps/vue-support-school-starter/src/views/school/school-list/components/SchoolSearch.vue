<template>
  <el-card class="school-search-card">
    <template #header>
      <div class="school-card-header">
        <span>查询条件</span>
        <el-button type="primary" @click="handleSearch">
          <IconifyIconOnline icon="ri:search-line" />
          查询
        </el-button>
      </div>
    </template>
    <el-form :model="queryParams" label-width="80px" inline>
      <el-form-item label="学校名称">
        <el-input v-model="queryParams.schoolName" placeholder="请输入学校名称" clearable />
      </el-form-item>
      <el-form-item label="学校类型">
        <el-select v-model="queryParams.schoolType" placeholder="请选择学校类型" clearable>
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
      <el-form-item label="办学层次">
        <el-select v-model="queryParams.schoolLevel" placeholder="请选择办学层次" clearable>
          <el-option label="本科" value="本科" />
          <el-option label="专科" value="专科" />
        </el-select>
      </el-form-item>
      <el-form-item label="省份">
        <el-select v-model="queryParams.schoolProvince" placeholder="请选择省份" clearable>
          <el-option label="北京市" value="北京市" />
          <el-option label="上海市" value="上海市" />
          <el-option label="广东省" value="广东省" />
          <el-option label="江苏省" value="江苏省" />
          <el-option label="浙江省" value="浙江省" />
          <!-- 更多省份选项 -->
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button @click="resetQuery">
          <IconifyIconOnline icon="ri:refresh-line" />
          重置
        </el-button>
      </el-form-item>
    </el-form>
  </el-card>
</template>

<script lang="ts" setup>
import { reactive } from "vue";
import type { SchoolInfoQuery } from "@/api";

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

// 定义emit
const emit = defineEmits<{
  (e: "search", params: SchoolInfoQuery): void;
  (e: "reset"): void;
}>();

// 查询操作
const handleSearch = () => {
  emit("search", queryParams);
};

// 重置查询
const resetQuery = () => {
  // 重置查询表单
  queryParams.schoolName = "";
  queryParams.schoolType = "";
  queryParams.schoolLevel = "";
  queryParams.schoolProvince = "";
  queryParams.schoolCity = "";
  queryParams.schoolDistrict = "";
  queryParams.schoolStatus = undefined;
  // 保留分页信息
  queryParams.pageNum = 1;

  // 触发重置事件
  emit("reset");
};
</script>

<style scoped>
.school-search-card {
  margin-bottom: 16px;
}

.school-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
