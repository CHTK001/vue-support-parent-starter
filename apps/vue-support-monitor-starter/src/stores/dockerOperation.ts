import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

/**
 * Docker操作类型
 */
export type DockerOperationType = 
  | 'pull'      // 拉取镜像
  | 'push'      // 推送镜像
  | 'build'     // 构建镜像
  | 'create'    // 创建容器
  | 'start'     // 启动容器
  | 'stop'      // 停止容器
  | 'restart'   // 重启容器
  | 'remove'    // 删除容器/镜像
  | 'export'    // 导出镜像
  | 'import';   // 导入镜像

/**
 * Docker操作状态
 */
export type DockerOperationStatus = 'pending' | 'running' | 'completed' | 'failed';

/**
 * Docker操作记录
 */
export interface DockerOperation {
  id: string;
  type: DockerOperationType;
  title: string;
  description: string;
  status: DockerOperationStatus;
  progress?: number;
  error?: string;
  serverId?: number;
  serverName?: string;
  imageId?: string;
  imageName?: string;
  containerId?: string;
  containerName?: string;
  createdAt: number;
  updatedAt: number;
}

/**
 * Docker操作状态管理
 * @author CH
 * @version 1.0.0
 * @since 2025-12-01
 */
export const useDockerOperationStore = defineStore('dockerOperation', () => {
  // 操作列表
  const operations = ref<DockerOperation[]>([]);

  // 计算属性：活跃的操作
  const activeOperations = computed(() => 
    operations.value.filter(op => op.status === 'pending' || op.status === 'running')
  );

  // 计算属性：已完成的操作
  const completedOperations = computed(() => 
    operations.value.filter(op => op.status === 'completed' || op.status === 'failed')
  );

  /**
   * 添加操作
   * @param operation 操作信息
   * @returns 操作ID
   */
  function addOperation(operation: Omit<DockerOperation, 'id' | 'createdAt' | 'updatedAt'>): string {
    const id = `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = Date.now();
    
    operations.value.unshift({
      ...operation,
      id,
      createdAt: now,
      updatedAt: now,
    });

    return id;
  }

  /**
   * 更新操作状态
   * @param id 操作ID
   * @param updates 更新内容
   */
  function updateOperation(id: string, updates: Partial<DockerOperation>) {
    const index = operations.value.findIndex(op => op.id === id);
    if (index !== -1) {
      operations.value[index] = {
        ...operations.value[index],
        ...updates,
        updatedAt: Date.now(),
      };
    }
  }

  /**
   * 更新操作进度
   * @param id 操作ID
   * @param progress 进度百分比
   */
  function updateProgress(id: string, progress: number) {
    updateOperation(id, { progress, status: 'running' });
  }

  /**
   * 完成操作
   * @param id 操作ID
   */
  function completeOperation(id: string) {
    updateOperation(id, { status: 'completed', progress: 100 });
  }

  /**
   * 操作失败
   * @param id 操作ID
   * @param error 错误信息
   */
  function failOperation(id: string, error: string) {
    updateOperation(id, { status: 'failed', error });
  }

  /**
   * 移除操作
   * @param id 操作ID
   */
  function removeOperation(id: string) {
    const index = operations.value.findIndex(op => op.id === id);
    if (index !== -1) {
      operations.value.splice(index, 1);
    }
  }

  /**
   * 清除已完成的操作
   */
  function clearCompleted() {
    operations.value = operations.value.filter(
      op => op.status === 'pending' || op.status === 'running'
    );
  }

  /**
   * 清除所有操作
   */
  function clearAll() {
    operations.value = [];
  }

  return {
    operations,
    activeOperations,
    completedOperations,
    addOperation,
    updateOperation,
    updateProgress,
    completeOperation,
    failOperation,
    removeOperation,
    clearCompleted,
    clearAll,
  };
});
