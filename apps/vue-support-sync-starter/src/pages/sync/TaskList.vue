<template>
  <div class="task-list-container">
    <el-card>
      <template #header>
        <div class="header-actions">
          <h3>同步任务列表</h3>
          <el-button type="primary" @click="handleCreate">创建任务</el-button>
        </div>
      </template>

      <div class="search-bar">
        <el-input
          v-model="searchQuery.syncTaskName"
          placeholder="搜索任务名称"
          clearable
          style="width: 300px; margin-right: 10px"
          @clear="handleSearch"
        />
        <el-select
          v-model="searchQuery.syncTaskStatus"
          placeholder="任务状态"
          clearable
          style="width: 150px; margin-right: 10px"
          @change="handleSearch"
        >
          <el-option label="运行中" value="RUNNING" />
          <el-option label="已停止" value="STOPPED" />
          <el-option label="失败" value="FAILED" />
        </el-select>
        <el-button type="primary" @click="handleSearch">搜索</el-button>
        <el-button @click="handleReset">重置</el-button>
        <el-radio-group v-model="viewMode" style="margin-left: 20px">
          <el-radio-button label="table">表格视图</el-radio-button>
          <el-radio-button label="card">卡片视图</el-radio-button>
        </el-radio-group>
      </div>

      <!-- 表格视图 -->
      <el-table 
        v-if="viewMode === 'table'"
        :data="taskStore.tasks" 
        :loading="taskStore.loading" 
        style="margin-top: 20px"
      >
        <el-table-column prop="syncTaskId" label="ID" width="80" />
        <el-table-column prop="syncTaskName" label="任务名称" min-width="150" />
        <el-table-column prop="syncTaskDesc" label="描述" min-width="200" show-overflow-tooltip />
        <el-table-column prop="syncTaskStatus" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.syncTaskStatus)">
              {{ getStatusText(row.syncTaskStatus) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="syncTaskLastRunTime" label="最后运行时间" width="180" />
        <el-table-column label="操作" width="300" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="handleDesign(row)">设计</el-button>
            <el-button 
              size="small" 
              type="success" 
              @click="handleStart(row)"
              :disabled="row.syncTaskStatus === 'RUNNING'"
            >
              启动
            </el-button>
            <el-button 
              size="small" 
              type="warning" 
              @click="handleStop(row)"
              :disabled="row.syncTaskStatus !== 'RUNNING'"
            >
              停止
            </el-button>
            <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 卡片视图 -->
      <div v-else class="card-view">
        <el-row :gutter="20">
          <el-col
            v-for="task in taskStore.tasks"
            :key="task.syncTaskId"
            :xs="24"
            :sm="12"
            :md="8"
            :lg="6"
          >
            <TaskCard
              :task="task"
              @design="handleDesign"
              @start="handleStart"
              @stop="handleStop"
              @delete="handleDelete"
            />
          </el-col>
        </el-row>
      </div>

      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.size"
        :total="taskStore.total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        style="margin-top: 20px; justify-content: flex-end"
        @size-change="handleSearch"
        @current-change="handleSearch"
      />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useTaskStore } from '../../stores/task';
import TaskCard from '../../components/TaskCard.vue';

const router = useRouter();
const taskStore = useTaskStore();

const viewMode = ref<'table' | 'card'>('table');

const searchQuery = reactive({
  syncTaskName: '',
  syncTaskStatus: '',
});

const pagination = reactive({
  page: 1,
  size: 20,
});

const handleSearch = () => {
  taskStore.fetchTasks({
    ...searchQuery,
    page: pagination.page,
    size: pagination.size,
  });
};

const handleReset = () => {
  searchQuery.syncTaskName = '';
  searchQuery.syncTaskStatus = '';
  pagination.page = 1;
  handleSearch();
};

const handleCreate = () => {
  router.push('/sync/design');
};

const handleDesign = (row: any) => {
  router.push(`/sync/design/${row.syncTaskId}`);
};

const handleStart = async (row: any) => {
  try {
    await taskStore.startTask(row.syncTaskId);
    ElMessage.success('任务启动成功');
    handleSearch();
  } catch (error: any) {
    ElMessage.error(error.message || '启动失败');
  }
};

const handleStop = async (row: any) => {
  try {
    await taskStore.stopTask(row.syncTaskId);
    ElMessage.success('任务停止成功');
    handleSearch();
  } catch (error: any) {
    ElMessage.error(error.message || '停止失败');
  }
};

const handleDelete = async (row: any) => {
  try {
    await ElMessageBox.confirm('确定要删除该任务吗?', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    });
    await taskStore.deleteTask(row.syncTaskId);
    ElMessage.success('删除成功');
    handleSearch();
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '删除失败');
    }
  }
};

const getStatusType = (status: string) => {
  const map: Record<string, any> = {
    RUNNING: 'success',
    STOPPED: 'info',
    FAILED: 'danger',
  };
  return map[status] || 'info';
};

const getStatusText = (status: string) => {
  const map: Record<string, string> = {
    RUNNING: '运行中',
    STOPPED: '已停止',
    FAILED: '失败',
  };
  return map[status] || status;
};

onMounted(() => {
  handleSearch();
});
</script>

<style scoped lang="scss">
.task-list-container {
  padding: 20px;
}

.header-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  h3 {
    margin: 0;
  }
}

.search-bar {
  display: flex;
  align-items: center;
}

.card-view {
  margin-top: 20px;
  
  .el-col {
    margin-bottom: 20px;
  }
}
</style>
