<template>
  <el-card class="school-base-info">
    <template #header>
      <div class="school-card-header">
        <div class="school-title">
          <span class="school-name">{{ schoolInfo.schoolName }}</span>
          <el-tag v-if="schoolInfo.schoolType" class="ml-2">{{ schoolInfo.schoolType }}</el-tag>
          <el-tag v-if="schoolInfo.schoolLevel" type="success" class="ml-2">{{ schoolInfo.schoolLevel }}</el-tag>
        </div>
        <el-tag v-if="schoolInfo.schoolStatus === 1" type="success">正常</el-tag>
        <el-tag v-else type="danger">停用</el-tag>
      </div>
    </template>

    <div class="school-info-content">
      <div class="school-logo" v-if="schoolInfo.schoolLogo">
        <img :src="schoolInfo.schoolLogo" alt="学校Logo" />
      </div>
      <div class="school-info-grid">
        <el-descriptions :column="3" border>
          <el-descriptions-item label="学校代码">{{ schoolInfo.schoolCode || "暂无" }}</el-descriptions-item>
          <el-descriptions-item label="所在省份">{{ schoolInfo.schoolProvince || "暂无" }}</el-descriptions-item>
          <el-descriptions-item label="所在城市">{{ schoolInfo.schoolCity || "暂无" }}</el-descriptions-item>
          <el-descriptions-item label="建校时间">{{ schoolInfo.schoolFoundingDate || "暂无" }}</el-descriptions-item>
          <el-descriptions-item label="学校面积">{{ schoolInfo.schoolArea ? `${schoolInfo.schoolArea}平方米` : "暂无" }}</el-descriptions-item>
          <el-descriptions-item label="建筑面积">{{ schoolInfo.schoolBuildingArea ? `${schoolInfo.schoolBuildingArea}平方米` : "暂无" }}</el-descriptions-item>
          <el-descriptions-item label="学生人数">{{ schoolInfo.schoolStudentCount || "暂无" }}</el-descriptions-item>
          <el-descriptions-item label="教师人数">{{ schoolInfo.schoolTeacherCount || "暂无" }}</el-descriptions-item>
          <el-descriptions-item label="班级数量">{{ schoolInfo.schoolClassCount || "暂无" }}</el-descriptions-item>
          <el-descriptions-item label="联系电话">{{ schoolInfo.schoolPhone || "暂无" }}</el-descriptions-item>
          <el-descriptions-item label="电子邮箱">{{ schoolInfo.schoolEmail || "暂无" }}</el-descriptions-item>
          <el-descriptions-item label="学校网站">
            <a v-if="schoolInfo.schoolWebsite" :href="schoolInfo.schoolWebsite" target="_blank">{{ schoolInfo.schoolWebsite }}</a>
            <span v-else>暂无</span>
          </el-descriptions-item>
          <el-descriptions-item label="详细地址" :span="3">{{ schoolInfo.schoolAddress || "暂无" }}</el-descriptions-item>
        </el-descriptions>
      </div>
    </div>
  </el-card>
</template>

<script lang="ts" setup>
import type { SchoolInfo } from "@/api";

// 接收学校信息
defineProps<{
  schoolInfo: SchoolInfo;
}>();
</script>

<style scoped>
.school-base-info {
  margin-bottom: 16px;
}

.school-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.school-title {
  display: flex;
  align-items: center;
}

.school-name {
  font-size: 18px;
  font-weight: bold;
  margin-right: 10px;
}

.school-info-content {
  display: flex;
  gap: 20px;
}

.school-logo {
  width: 120px;
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border: 1px solid #eee;
  border-radius: 4px;
}

.school-logo img {
  max-width: 100%;
  max-height: 100%;
}

.school-info-grid {
  flex: 1;
}

.ml-2 {
  margin-left: 8px;
}
</style>
