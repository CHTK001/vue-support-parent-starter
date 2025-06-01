<template>
  <div class="environment-manager">
    <!-- 环境选择器 -->
    <div class="env-selector">
      <el-select 
        v-model="currentEnv" 
        placeholder="选择环境" 
        size="small"
        @change="handleEnvChange"
      >
        <el-option 
          v-for="env in environments" 
          :key="env.id" 
          :label="env.name" 
          :value="env.id"
        />
      </el-select>
      <el-button 
        type="primary" 
        size="small" 
        plain 
        icon="el-icon-setting"
        @click="openEnvDialog"
      >
        管理环境
      </el-button>
    </div>

    <!-- 环境管理对话框 -->
    <el-dialog
      v-model="envDialogVisible"
      title="环境管理"
      width="60%"
    >
      <div class="env-dialog-content">
        <div class="env-list">
          <div class="env-list-header">
            <h3>环境列表</h3>
            <el-button 
              type="primary" 
              size="small" 
              @click="addNewEnv"
            >
              新建环境
            </el-button>
          </div>
          <el-table
            :data="environments"
            border
            style="width: 100%"
            size="small"
          >
            <el-table-column prop="name" label="环境名称" />
            <el-table-column label="操作" width="200">
              <template #default="scope">
                <el-button 
                  type="primary" 
                  size="small" 
                  plain 
                  @click="editEnv(scope.row)"
                >
                  编辑
                </el-button>
                <el-button 
                  type="danger" 
                  size="small" 
                  plain 
                  @click="confirmDeleteEnv(scope.row)"
                >
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <!-- 环境编辑区域 -->
        <div v-if="editingEnv" class="env-edit-section">
          <div class="edit-section-header">
            <h3>{{ isNewEnv ? '新建环境' : '编辑环境' }}</h3>
            <div class="header-actions">
              <el-button 
                type="success" 
                size="small" 
                @click="saveEnv"
              >
                保存
              </el-button>
              <el-button 
                v-if="!isNewEnv" 
                type="danger" 
                size="small" 
                @click="confirmDeleteEnv(editingEnv)"
              >
                删除
              </el-button>
              <el-button 
                type="info" 
                size="small" 
                @click="cancelEdit"
              >
                取消
              </el-button>
            </div>
          </div>

          <div class="env-form">
            <el-form :model="editingEnv" label-width="80px">
              <el-form-item label="环境名称">
                <el-input v-model="editingEnv.name" placeholder="请输入环境名称" />
              </el-form-item>
              
              <el-form-item label="全局头信息">
                <div class="headers-list">
                  <div 
                    v-for="(header, index) in editingEnv.headers" 
                    :key="index" 
                    class="header-item"
                  >
                    <el-input
                      v-model="header.key"
                      placeholder="Header 名称"
                      class="header-key"
                    />
                    <el-input
                      v-model="header.value"
                      placeholder="Header 值"
                      class="header-value"
                    />
                    <el-button
                      type="danger"
                      circle
                      plain
                      size="small"
                      @click="removeHeader(index)"
                    >
                      <i class="el-icon-delete"></i>
                    </el-button>
                  </div>
                  <div class="add-header">
                    <el-button
                      type="primary"
                      size="small"
                      plain
                      @click="addHeader"
                    >
                      添加 Header
                    </el-button>
                  </div>
                </div>
              </el-form-item>
            </el-form>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { message } from "@repo/utils";
import { indexedDBProxy } from '@repo/utils';

// 定义环境接口
interface Header {
  key: string;
  value: string;
  enabled: boolean;
}

interface Environment {
  id: string;
  name: string;
  headers: Header[];
}

// 状态变量
const environments = ref<Environment[]>([]);
const currentEnv = ref<string | null>(null);
const envDialogVisible = ref(false);
const editingEnv = ref<Environment | null>(null);
const isNewEnv = computed(() => !editingEnv.value?.id || editingEnv.value.id === 'new');

// 使用 indexedDBProxy 替代 IndexedDB
const DB_KEY_PREFIX = 'api-environments-';
const STORE_KEY = DB_KEY_PREFIX + 'data';
const db = indexedDBProxy();

// 发出事件
const emit = defineEmits(['environment-changed', 'headers-updated']);

// 从存储加载环境
const loadAllEnvironments = async () => {
  try {
    // 使用 indexedDBProxy 获取数据
    const envs = db.getItem(STORE_KEY) || [];
    environments.value = Array.isArray(envs) ? envs : [];
    
    // 如果没有环境，创建一个默认环境
    if (environments.value.length === 0) {
      const defaultEnv = {
        id: `env-${Date.now()}`,
        name: '默认环境',
        headers: []
      };
      
      environments.value.push(defaultEnv);
      // 保存到 indexedDBProxy
      db.setItem(STORE_KEY, environments.value);
    }
    
    // 设置当前环境（使用第一个或保存的选择）
    const savedEnvId = localStorage.getItem('api-current-environment');
    const envExists = environments.value.some(e => e.id === savedEnvId);
    
    if (savedEnvId && envExists) {
      currentEnv.value = savedEnvId;
    } else {
      currentEnv.value = environments.value[0].id;
      localStorage.setItem('api-current-environment', currentEnv.value);
    }
    
    // 通知环境变化
    emitEnvironmentChanged();
  } catch (error) {
    console.error('加载环境出错:', error);
    message('加载环境配置失败', { type: 'error' });
  }
};

// 打开环境管理对话框
const openEnvDialog = () => {
  envDialogVisible.value = true;
  editingEnv.value = null;
};

// 添加新环境
const addNewEnv = () => {
  editingEnv.value = {
    id: `env-${Date.now()}`,
    name: '新环境',
    headers: []
  };
};

// 编辑环境
const editEnv = (env: Environment) => {
  // 创建深拷贝，以免直接修改原对象
  editingEnv.value = JSON.parse(JSON.stringify(env));
};

// 取消编辑
const cancelEdit = () => {
  editingEnv.value = null;
};

// 保存环境
const saveEnv = async () => {
  if (!editingEnv.value) return;
  
  try {
    // 验证环境名称
    if (!editingEnv.value.name.trim()) {
      message('环境名称不能为空', { type: 'warning' });
      return;
    }
    
    // 更新本地列表
    const index = environments.value.findIndex(e => e.id === editingEnv.value!.id);
    if (index >= 0) {
      environments.value[index] = JSON.parse(JSON.stringify(editingEnv.value));
    } else {
      environments.value.push(JSON.parse(JSON.stringify(editingEnv.value)));
    }
    
    // 保存到 indexedDBProxy
    db.setItem(STORE_KEY, environments.value);
    
    message('保存环境成功', { type: 'success' });
    editingEnv.value = null;
    
    // 如果当前没有选择环境，选择第一个
    if (!currentEnv.value && environments.value.length > 0) {
      currentEnv.value = environments.value[0].id;
      localStorage.setItem('api-current-environment', currentEnv.value);
      emitEnvironmentChanged();
    }
  } catch (error) {
    console.error('保存环境失败:', error);
    message('保存环境失败', { type: 'error' });
  }
};

// 确认删除环境
const confirmDeleteEnv = (env: Environment) => {
  if (environments.value.length <= 1) {
    message('至少需要保留一个环境', { type: 'warning' });
    return;
  }
  
  if (confirm(`确定要删除环境 "${env.name}" 吗？`)) {
    deleteEnv(env);
  }
};

// 删除环境
const deleteEnv = async (env: Environment) => {
  try {
    // 从本地列表中删除
    environments.value = environments.value.filter(e => e.id !== env.id);
    
    // 保存到 indexedDBProxy
    db.setItem(STORE_KEY, environments.value);
    
    message('删除环境成功', { type: 'success' });
    
    // 如果删除的是当前环境，切换到第一个可用环境
    if (currentEnv.value === env.id && environments.value.length > 0) {
      currentEnv.value = environments.value[0].id;
      localStorage.setItem('api-current-environment', currentEnv.value);
      emitEnvironmentChanged();
    }
  } catch (error) {
    console.error('删除环境失败:', error);
    message('删除环境失败', { type: 'error' });
  }
};

// 添加 Header
const addHeader = () => {
  if (!editingEnv.value) return;
  
  editingEnv.value.headers.push({
    key: '',
    value: '',
    enabled: true
  });
};

// 移除 Header
const removeHeader = (index: number) => {
  if (!editingEnv.value) return;
  
  editingEnv.value.headers.splice(index, 1);
};

// 处理环境变化
const handleEnvChange = () => {
  if (currentEnv.value) {
    localStorage.setItem('api-current-environment', currentEnv.value);
    emitEnvironmentChanged();
  }
};

// 发射环境变化事件
const emitEnvironmentChanged = () => {
  if (!currentEnv.value) return;
  
  const env = environments.value.find(e => e.id === currentEnv.value);
  if (env) {
    emit('environment-changed', env);
    
    // 发射头信息更新事件
    const headersObj: Record<string, string> = {};
    env.headers.forEach(h => {
      if (h.enabled && h.key.trim()) {
        headersObj[h.key.trim()] = h.value;
      }
    });
    emit('headers-updated', headersObj);
  }
};

// 获取当前环境的 headers
const getCurrentHeaders = (): Record<string, string> => {
  const env = environments.value.find(e => e.id === currentEnv.value);
  if (!env) return {};
  
  const headersObj: Record<string, string> = {};
  env.headers.forEach(h => {
    if (h.enabled && h.key.trim()) {
      headersObj[h.key.trim()] = h.value;
    }
  });
  
  return headersObj;
};

// 监听环境变化
watch(currentEnv, () => {
  handleEnvChange();
});

// 组件加载时初始化数据
onMounted(() => {
  loadAllEnvironments();
});

// 暴露方法给父组件
defineExpose({
  getCurrentHeaders
});
</script>

<style scoped lang="scss">
.environment-manager {
  margin-bottom: 16px;
  
  .env-selector {
    display: flex;
    align-items: center;
    gap: 8px;
    
    .el-select {
      flex: 1;
    }
  }
  
  .env-dialog-content {
    display: flex;
    flex-direction: column;
    gap: 20px;
    
    .env-list {
      border: 1px solid var(--el-border-color-light);
      border-radius: 4px;
      padding: 16px;
      
      .env-list-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
        
        h3 {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
          color: var(--el-text-color-primary);
        }
      }
    }
    
    .env-edit-section {
      border: 1px solid var(--el-border-color-light);
      border-radius: 4px;
      padding: 16px;
      
      .edit-section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
        
        h3 {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
          color: var(--el-text-color-primary);
        }
        
        .header-actions {
          display: flex;
          gap: 8px;
        }
      }
      
      .env-form {
        .headers-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
          
          .header-item {
            display: flex;
            align-items: center;
            gap: 8px;
            
            .header-key {
              width: 200px;
            }
            
            .header-value {
              flex: 1;
            }
          }
          
          .add-header {
            margin-top: 8px;
          }
        }
      }
    }
  }
}
</style> 