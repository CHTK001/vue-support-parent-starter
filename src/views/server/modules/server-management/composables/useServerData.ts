/**
 * 服务器数据管理组合式函数
 */

import { ref, reactive, computed, watch } from 'vue';
import { message } from '@repo/utils';
import type { 
  ServerInfo, 
  ServerDisplayData, 
  ServerMetrics, 
  ServerConnectionStatus,
  ServerStatistics 
} from '../../../shared/types/server';
import {
  getServerInfo,
  getServerPageList,
  saveServer,
  updateServer,
  deleteServer,
  testServerConnection,
  connectServer,
  disconnectServer,
  getServerStatus,
  collectServerMetrics,
  getServerStatistics
} from '@/api/monitor/gen/server';

export function useServerData() {
  // 响应式状态
  const loading = ref(false);
  const serverInfo = ref<ServerInfo | null>(null);
  const serverList = ref<ServerInfo[]>([]);
  const serverMetrics = ref<ServerMetrics | null>(null);
  const connectionStatus = ref<ServerConnectionStatus | null>(null);
  const statistics = ref<ServerStatistics | null>(null);
  
  // 分页状态
  const pagination = reactive({
    current: 1,
    size: 10,
    total: 0
  });

  // 查询参数
  const queryParams = reactive({
    monitorSysGenServerName: '',
    monitorSysGenServerHost: '',
    monitorSysGenServerProtocol: '',
    monitorSysGenServerStatus: undefined as number | undefined,
    monitorSysGenServerTags: ''
  });

  // 计算属性
  const hasData = computed(() => serverList.value.length > 0);
  const isOnline = computed(() => connectionStatus.value?.status === 1);
  const isConnected = computed(() => serverInfo.value?.monitorSysGenServerConnectionStatus === 1);

  /**
   * 加载服务器信息
   */
  const loadServerInfo = async (serverId: string | number) => {
    try {
      loading.value = true;
      const res = await getServerInfo(String(serverId));
      
      if (res.code === '00000') {
        serverInfo.value = res.data;
        return res.data;
      } else {
        message.error(res.msg || '加载服务器信息失败');
        return null;
      }
    } catch (error) {
      console.error('加载服务器信息失败:', error);
      message.error('加载服务器信息失败');
      return null;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 加载服务器列表
   */
  const loadServerList = async (params?: any) => {
    try {
      loading.value = true;
      const requestParams = {
        current: pagination.current,
        size: pagination.size,
        ...queryParams,
        ...params
      };

      const res = await getServerPageList(requestParams);
      
      if (res.code === '00000') {
        serverList.value = res.data?.records || [];
        pagination.total = res.data?.total || 0;
        return res.data;
      } else {
        message.error(res.msg || '加载服务器列表失败');
        return null;
      }
    } catch (error) {
      console.error('加载服务器列表失败:', error);
      message.error('加载服务器列表失败');
      return null;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 保存服务器配置
   */
  const saveServerConfig = async (data: any, isUpdate = false) => {
    try {
      loading.value = true;
      const res = isUpdate ? await updateServer(data) : await saveServer(data);
      
      if (res.code === '00000') {
        message.success(isUpdate ? '更新成功' : '保存成功');
        return res.data;
      } else {
        message.error(res.msg || (isUpdate ? '更新失败' : '保存失败'));
        return null;
      }
    } catch (error) {
      console.error('保存服务器配置失败:', error);
      message.error(isUpdate ? '更新失败' : '保存失败');
      return null;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 删除服务器
   */
  const deleteServerConfig = async (serverId: string | number) => {
    try {
      loading.value = true;
      const res = await deleteServer(String(serverId));
      
      if (res.code === '00000') {
        message.success('删除成功');
        return true;
      } else {
        message.error(res.msg || '删除失败');
        return false;
      }
    } catch (error) {
      console.error('删除服务器失败:', error);
      message.error('删除失败');
      return false;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 测试服务器连接
   */
  const testConnection = async (serverId: string | number) => {
    try {
      loading.value = true;
      const res = await testServerConnection(String(serverId));
      
      if (res.code === '00000') {
        message.success('连接测试成功');
        return res.data;
      } else {
        message.error(res.msg || '连接测试失败');
        return null;
      }
    } catch (error) {
      console.error('连接测试失败:', error);
      message.error('连接测试失败');
      return null;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 连接服务器
   */
  const connectToServer = async (serverId: string | number) => {
    try {
      loading.value = true;
      const res = await connectServer(String(serverId));
      
      if (res.code === '00000') {
        message.success('连接成功');
        // 更新连接状态
        await loadConnectionStatus(serverId);
        return true;
      } else {
        message.error(res.msg || '连接失败');
        return false;
      }
    } catch (error) {
      console.error('连接服务器失败:', error);
      message.error('连接失败');
      return false;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 断开服务器连接
   */
  const disconnectFromServer = async (serverId: string | number) => {
    try {
      loading.value = true;
      const res = await disconnectServer(String(serverId));
      
      if (res.code === '00000') {
        message.success('断开连接成功');
        // 更新连接状态
        await loadConnectionStatus(serverId);
        return true;
      } else {
        message.error(res.msg || '断开连接失败');
        return false;
      }
    } catch (error) {
      console.error('断开连接失败:', error);
      message.error('断开连接失败');
      return false;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 加载连接状态
   */
  const loadConnectionStatus = async (serverId: string | number) => {
    try {
      const res = await getServerStatus(String(serverId));
      
      if (res.code === '00000') {
        connectionStatus.value = {
          serverId: Number(serverId),
          status: res.data?.status || 0,
          message: res.data?.message,
          lastCheckTime: new Date().toISOString()
        };
        return connectionStatus.value;
      }
      return null;
    } catch (error) {
      console.error('加载连接状态失败:', error);
      return null;
    }
  };

  /**
   * 收集服务器指标
   */
  const collectMetrics = async (serverId: string | number) => {
    try {
      const res = await collectServerMetrics(String(serverId));
      
      if (res.code === '00000') {
        serverMetrics.value = res.data;
        message.success('指标收集成功');
        return res.data;
      } else {
        message.error(res.msg || '指标收集失败');
        return null;
      }
    } catch (error) {
      console.error('收集指标失败:', error);
      message.error('指标收集失败');
      return null;
    }
  };

  /**
   * 加载统计信息
   */
  const loadStatistics = async () => {
    try {
      const res = await getServerStatistics();
      
      if (res.code === '00000') {
        statistics.value = res.data;
        return res.data;
      }
      return null;
    } catch (error) {
      console.error('加载统计信息失败:', error);
      return null;
    }
  };

  /**
   * 重置查询参数
   */
  const resetQuery = () => {
    Object.assign(queryParams, {
      monitorSysGenServerName: '',
      monitorSysGenServerHost: '',
      monitorSysGenServerProtocol: '',
      monitorSysGenServerStatus: undefined,
      monitorSysGenServerTags: ''
    });
    pagination.current = 1;
  };

  /**
   * 刷新数据
   */
  const refresh = async () => {
    if (serverInfo.value) {
      await loadServerInfo(serverInfo.value.monitorSysGenServerId);
      await loadConnectionStatus(serverInfo.value.monitorSysGenServerId);
    }
    await loadServerList();
    await loadStatistics();
  };

  return {
    // 状态
    loading,
    serverInfo,
    serverList,
    serverMetrics,
    connectionStatus,
    statistics,
    pagination,
    queryParams,
    
    // 计算属性
    hasData,
    isOnline,
    isConnected,
    
    // 方法
    loadServerInfo,
    loadServerList,
    saveServerConfig,
    deleteServerConfig,
    testConnection,
    connectToServer,
    disconnectFromServer,
    loadConnectionStatus,
    collectMetrics,
    loadStatistics,
    resetQuery,
    refresh
  };
}
