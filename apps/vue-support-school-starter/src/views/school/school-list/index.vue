<template>
  <div class="school-list-container">
    <!-- 筛选条件区域 -->
    <SchoolFilter v-model="queryParams" @filter-change="handleSearch" />

    <!-- 学校列表区域 -->
    <div class="school-list-section">
      <div class="list-header">
        <div class="total-count">
          共找到 <span class="highlight">{{ total }}</span> 所学校
        </div>
        <div class="list-actions">
          <div class="sort-options">
            <span class="sort-label">排序方式:</span>
            <div class="sort-buttons">
              <div 
                v-for="option in sortOptions" 
                :key="option.value" 
                :class="['sort-button', { active: sortType === option.value }]" 
                @click="handleSort(option.value)"
              >
                {{ option.label }}
                <IconifyIconOnline v-if="sortType === option.value" icon="ri:check-line" class="sort-icon" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 卡片视图 -->
      <div class="school-cards">
        <el-row :gutter="20">
          <el-col v-for="school in schoolList" :key="school.schoolId" :xs="24" :sm="12" :md="8" :lg="6">
            <div class="school-card" @click="handleSchoolClick(school)">
              <div class="school-card-header">
                <div class="school-logo">
                  <el-image :src="school.schoolLogoUrl" fit="contain">
                    <template #error>
                      <div class="image-placeholder">
                        <IconifyIconOnline icon="ri:school-line" />
                      </div>
                    </template>
                  </el-image>
                </div>
                <div class="school-basic-info">
                  <h3 class="school-name">{{ school.schoolName }}</h3>
                  <div class="school-badges">
                    <span v-if="school.schoolIs985" class="badge badge-985">985</span>
                    <span v-if="school.schoolIs211" class="badge badge-211">211</span>
                    <span v-if="school.schoolIsDoubleFirst" class="badge badge-double">双一流</span>
                  </div>
                </div>
              </div>
              <div class="school-card-body">
                <div class="school-info-row">
                  <div class="info-label">院校类型:</div>
                  <div class="info-value">{{ school.schoolType || '未知' }}</div>
                </div>
                <div class="school-info-row">
                  <div class="info-label">办学层次:</div>
                  <div class="info-value">{{ school.schoolLevel || '未知' }}</div>
                </div>
                <div class="school-info-row">
                  <div class="info-label">所在地区:</div>
                  <div class="info-value">
                    <IconifyIconOnline icon="ri:map-pin-line" class="info-icon" />
                    {{ school.schoolProvince }}{{ school.schoolCity }}
                  </div>
                </div>
                <div class="school-info-row">
                  <div class="info-label">师生情况:</div>
                  <div class="info-value">
                    <span class="stat-item">
                      <IconifyIconOnline icon="ri:user-line" class="info-icon" />
                      {{ school.schoolInfoStudentCount || 0 }}名学生
                    </span>
                    <span class="stat-item">
                      <IconifyIconOnline icon="ri:team-line" class="info-icon" />
                      {{ school.schoolInfoTeacherCount || 0 }}名教师
                    </span>
                  </div>
                </div>
              </div>
              <div class="school-card-footer">
                <el-button type="primary" size="small" plain>
                  查看详情
                  <IconifyIconOnline icon="ri:arrow-right-line" />
                </el-button>
              </div>
            </div>
          </el-col>
        </el-row>
      </div>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination v-model:current-page="queryParams.pageNum" v-model:page-size="queryParams.pageSize" :total="total" :page-sizes="[10, 20, 30, 50]" layout="total, sizes, prev, pager, next, jumper" @size-change="handleSizeChange" @current-change="handleCurrentChange" />
      </div>
    </div>

    <!-- 表单弹窗 -->
    <SchoolForm ref="formRef" @success="handleSuccess" @cancel="handleCancel" />
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, watch } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import SchoolFilter from "./components/SchoolFilter.vue";
import SchoolForm from "./components/SchoolForm.vue";
import { getSchoolInfoList } from "@/api";
import type { SchoolInfo } from "@/api";
import { queryParams, sortType, total, schoolList, getSortLabel, sortOptions } from "./data";

// 路由实例
const router = useRouter();

// 表单实例
const formRef = ref();

// 加载状态
const loading = ref(false);

// 加载学校列表
const loadSchoolList = async () => {
  try {
    loading.value = true;
    const res = await getSchoolInfoList(queryParams);
    if (res.code === '00000') {
      schoolList.value = res.data.data;
      total.value = res.data.length;
      schoolList.value.forEach((index, item) => {
        console.log(item);
      });
    }
  } catch (error) {
    console.error("加载学校列表失败:", error);
    ElMessage.error("加载学校列表失败");
  } finally {
    loading.value = false;
  }
};

// 处理排序
const handleSort = (type: "score" | "rank" | "") => {
  sortType.value = type;
  queryParams.sortField = type === "score" ? "schoolScore" : "schoolRank";
  queryParams.sortOrder = type ? "asc" : "";
  loadSchoolList();
};

// 处理学校点击
const handleSchoolClick = (school: SchoolInfo & { schoolInfoStudentCount?: number; schoolInfoTeacherCount?: number }) => {
  router.push(`/school/detail/${school.schoolId}`);
};

// 搜索
const handleSearch = () => {
  queryParams.pageNum = 1;
  loadSchoolList();
};

// 页码变化
const handleCurrentChange = (val: number) => {
  queryParams.pageNum = val;
  loadSchoolList();
};

// 每页条数变化
const handleSizeChange = (val: number) => {
  queryParams.pageSize = val;
  queryParams.pageNum = 1;
  loadSchoolList();
};

// 编辑学校
const handleEdit = (row: SchoolInfo) => {
  if (formRef.value) {
    formRef.value.openDialog("edit", row);
  }
};

// 删除学校
const handleDelete = (row: SchoolInfo) => {
  // TODO: 实现删除功能
};

// 操作成功回调
const handleSuccess = () => {
  loadSchoolList();
};

// 取消操作
const handleCancel = () => {
  // 不做任何处理
};

// 初始化加载
onMounted(() => {
  loadSchoolList();
});
</script>

<style scoped>
.school-list-container {
  padding: 16px;
  background-color: #f5f7fa;
  min-height: 100vh;
}

.search-section {
  background-color: #fff;
  padding: 24px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  margin-bottom: 16px;
  text-align: center;
  background-image: linear-gradient(to bottom, #f8f9fa, #ffffff);
  border: 1px solid #e6e6e6;
}

.search-header {
  margin-bottom: 20px;
}

.search-title {
  font-size: 24px;
  color: #333;
  margin-bottom: 8px;
  font-weight: bold;
}

.search-subtitle {
  font-size: 14px;
  color: #666;
  margin: 0;
}

.search-box {
  max-width: 800px;
  margin: 0 auto;
}

.search-input {
  width: 100%;
  --el-input-height: 46px;
}

.search-icon {
  color: #999;
  font-size: 18px;
}

.school-list-section {
  background-color: #fff;
  padding: 24px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  border: 1px solid #e6e6e6;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #ebeef5;
}

.total-count {
  font-size: 16px;
  color: #606266;
}

.highlight {
  color: #ff6600;
  font-weight: bold;
  margin: 0 4px;
}

.list-actions {
  display: flex;
  gap: 16px;
}

.sort-options {
  display: flex;
  align-items: center;
}

.sort-label {
  font-size: 14px;
  color: #666;
  margin-right: 10px;
}

.sort-buttons {
  display: flex;
  gap: 10px;
}

.sort-button {
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 13px;
  cursor: pointer;
  background-color: #f9f9f9;
  border: 1px solid #e6e6e6;
  color: #666;
  transition: all 0.2s;
  display: flex;
  align-items: center;
}

.sort-button:hover {
  color: #ff6600;
  border-color: #ffcca6;
  background-color: #fff4eb;
}

.sort-button.active {
  color: #ff6600;
  border-color: #ff6600;
  background-color: #fff4eb;
}

.sort-icon {
  margin-left: 5px;
}

.school-cards {
  margin-bottom: 24px;
}

.school-card {
  cursor: pointer;
  transition: all 0.3s;
  margin-bottom: 20px;
  height: 100%;
  border: 1px solid #e6e6e6;
  border-radius: 8px;
  background-color: #fff;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.school-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
  border-color: #ffcca6;
}

.school-card-header {
  padding: 16px;
  display: flex;
  align-items: center;
  border-bottom: 1px solid #f0f0f0;
  background-color: #fafafa;
}

.school-logo {
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #fff;
  border-radius: 4px;
  border: 1px solid #ebeef5;
  margin-right: 12px;
  flex-shrink: 0;
}

.school-logo .el-image {
  max-width: 80%;
  max-height: 80%;
}

.image-placeholder {
  font-size: 30px;
  color: #909399;
}

.school-basic-info {
  flex: 1;
  min-width: 0;
}

.school-name {
  margin: 0 0 8px;
  font-size: 16px;
  font-weight: bold;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.school-badges {
  display: flex;
  gap: 6px;
}

.badge {
  display: inline-block;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 12px;
  font-weight: bold;
}

.badge-985 {
  background-color: #e6f7ff;
  color: #1890ff;
  border: 1px solid #91d5ff;
}

.badge-211 {
  background-color: #fff7e6;
  color: #fa8c16;
  border: 1px solid #ffd591;
}

.badge-double {
  background-color: #f6ffed;
  color: #52c41a;
  border: 1px solid #b7eb8f;
}

.school-card-body {
  padding: 16px;
  flex: 1;
}

.school-info-row {
  display: flex;
  margin-bottom: 10px;
  font-size: 14px;
  line-height: 1.5;
}

.school-info-row:last-child {
  margin-bottom: 0;
}

.info-label {
  width: 80px;
  color: #666;
  flex-shrink: 0;
}

.info-value {
  flex: 1;
  color: #333;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.info-icon {
  font-size: 14px;
  color: #999;
  margin-right: 2px;
}

.stat-item {
  display: flex;
  align-items: center;
  margin-right: 10px;
}

.school-card-footer {
  padding: 12px 16px;
  border-top: 1px solid #f0f0f0;
  display: flex;
  justify-content: flex-end;
}

.pagination-container {
  margin-top: 24px;
  display: flex;
  justify-content: center;
  padding-top: 16px;
  border-top: 1px solid #ebeef5;
}

:deep(.el-pagination) {
  padding: 0;
}

:deep(.el-pagination .el-pagination__total) {
  margin-right: 16px;
}

:deep(.el-pagination .el-pagination__sizes) {
  margin-right: 16px;
}

:deep(.el-pagination .el-pagination__jump) {
  margin-left: 16px;
}
</style>
