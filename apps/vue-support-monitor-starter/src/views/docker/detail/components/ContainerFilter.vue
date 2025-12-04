<template>
  <div class="container-filter">
    <div class="filter-header">
      <div class="header-title">容器过滤</div>
    </div>
    
    <div class="filter-content">
      <el-form :model="filterParams" label-position="top" @submit.prevent>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="容器名称">
              <el-input
                v-model="filterParams.name"
                placeholder="请输入容器名�?
                clearable
                @keyup.enter="applyFilter"
              />
            </el-form-item>
          </el-col>
          
          <el-col :span="12">
            <el-form-item label="镜像名称">
              <el-input
                v-model="filterParams.image"
                placeholder="请输入镜像名�?
                clearable
                @keyup.enter="applyFilter"
              />
            </el-form-item>
          </el-col>
          
          <el-col :span="12">
            <el-form-item label="运行状�?>
              <el-select
                v-model="filterParams.status"
                placeholder="请选择运行状�?
                clearable
                style="width: 100%"
              >
                <el-option label="全部" value="" />
                <el-option label="运行�? value="running" />
                <el-option label="已停�? value="stopped" />
                <el-option label="暂停" value="paused" />
                <el-option label="重启�? value="restarting" />
                <el-option label="错误" value="error" />
              </el-select>
            </el-form-item>
          </el-col>
          
          <el-col :span="12">
            <el-form-item label="服务�?>
              <el-select
                v-model="filterParams.serverId"
                placeholder="请选择服务�?
                clearable
                style="width: 100%"
              >
                <el-option label="全部" value="" />
                <el-option
                  v-for="server in serverOptions"
                  :key="server.id"
                  :label="server.name"
                  :value="server.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        
        <div class="filter-actions">
          <el-button type="primary" @click="applyFilter">
            <IconifyIconOnline icon="ri:search-line" class="mr-1" />
            应用过滤
          </el-button>
          <el-button @click="resetFilter">
            <IconifyIconOnline icon="ri:delete-bin-line" class="mr-1" />
            重置
          </el-button>
        </div>
      </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface ServerOption {
  id: number
  name: string
}

interface FilterParams {
  name: string
  image: string
  status: string
  serverId: string
}

interface Props {
  serverOptions: ServerOption[]
}

interface Emits {
  (e: 'apply-filter', params: FilterParams): void
  (e: 'reset-filter'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const filterParams = ref<FilterParams>({
  name: '',
  image: '',
  status: '',
  serverId: ''
})

// 应用过滤
const applyFilter = () => {
  emit('apply-filter', filterParams.value)
}

// 重置过滤
const resetFilter = () => {
  filterParams.value = {
    name: '',
    image: '',
    status: '',
    serverId: ''
  }
  emit('reset-filter')
}
</script>

<style scoped>
.container-filter {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid #e4e7ed;
}

.filter-header {
  margin-bottom: 20px;
}

.header-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.filter-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 20px;
}
</style>