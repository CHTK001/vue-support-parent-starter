<template>
  <div class="test-container">
    <h2>服务器列表测试页面</h2>
    
    <div class="test-info">
      <p>加载状态: {{ loading ? '加载中...' : '加载完成' }}</p>
      <p>服务器数量: {{ servers.length }}</p>
      <p>过滤后数量: {{ filteredServers.length }}</p>
      <p>最小化状态: {{ leftPanelMinimized ? '是' : '否' }}</p>
    </div>

    <div class="controls">
      <el-button @click="loadServers">重新加载</el-button>
      <el-button @click="leftPanelMinimized = !leftPanelMinimized">
        {{ leftPanelMinimized ? '展开' : '最小化' }}
      </el-button>
      <el-button @click="addTestServer">添加测试服务器</el-button>
      <el-button @click="clearServers">清空服务器</el-button>
    </div>

    <div class="server-display">
      <h3>服务器列表显示测试</h3>
      
      <!-- 最小化状态 -->
      <div v-if="leftPanelMinimized" class="minimized-test">
        <h4>最小化状态:</h4>
        <div v-if="filteredServers.length === 0" class="mini-empty">
          <div class="mini-empty-icon">
            <IconifyIconOnline icon="ri:server-line" />
          </div>
          <span>暂无服务器</span>
        </div>
        <div v-else class="mini-servers">
          <div 
            v-for="server in filteredServers" 
            :key="server.id" 
            class="mini-server-item"
          >
            {{ server.name }}
          </div>
        </div>
      </div>

      <!-- 正常状态 -->
      <div v-else class="normal-test">
        <h4>正常状态:</h4>
        <el-empty v-if="filteredServers.length === 0" description="暂无服务器">
          <el-button type="primary">新增服务器</el-button>
        </el-empty>
        <div v-else class="normal-servers">
          <div 
            v-for="server in filteredServers" 
            :key="server.id" 
            class="normal-server-item"
          >
            <h5>{{ server.name }}</h5>
            <p>{{ server.host }}:{{ server.port }}</p>
            <p>协议: {{ server.protocol }}</p>
            <p>状态: {{ server.onlineStatus }}</p>
          </div>
        </div>
      </div>
    </div>

    <div class="debug-info">
      <h3>调试信息</h3>
      <pre>{{ JSON.stringify({ servers: servers.slice(0, 2), filteredServers: filteredServers.slice(0, 2) }, null, 2) }}</pre>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { IconifyIconOnline } from "@repo/components";
import { 
  getServerPageList,
  type ServerDisplayData,
  mapServerListToDisplayData,
  ONLINE_STATUS
} from "@/api/server";

// 状态
const loading = ref(false);
const servers = ref<ServerDisplayData[]>([]);
const leftPanelMinimized = ref(false);

// 计算属性
const filteredServers = computed(() => {
  return servers.value;
});

// 加载服务器列表
const loadServers = async () => {
  try {
    loading.value = true;
    console.log('开始加载服务器列表...');
    
    const res = await getServerPageList({
      page: 1,
      pageSize: 1000,
    }) as any;

    console.log('API响应:', res);

    if (res.code == "00000") {
      const serverList = res.data?.data || [];
      console.log('原始服务器数据:', serverList);
      
      servers.value = mapServerListToDisplayData(serverList);
      console.log('映射后的服务器数据:', servers.value);
    } else {
      console.error('API返回错误:', res);
    }
  } catch (error) {
    console.error("加载服务器列表失败:", error);
  } finally {
    loading.value = false;
  }
};

// 添加测试服务器
const addTestServer = () => {
  const testServer: ServerDisplayData = {
    id: `test-${Date.now()}`,
    name: `测试服务器-${servers.value.length + 1}`,
    host: '192.168.1.100',
    port: 22,
    protocol: 'SSH' as any,
    username: 'root',
    status: 1,
    onlineStatus: ONLINE_STATUS.ONLINE,
    connectionStatus: 1,
    isLocal: false,
    metricsSupport: true,
    group: '测试组',
    tags: 'test',
    desc: '这是一个测试服务器',
    createTime: new Date().toISOString(),
    updateTime: new Date().toISOString(),
  };
  servers.value.push(testServer);
};

// 清空服务器
const clearServers = () => {
  servers.value = [];
};

// 初始化
loadServers();
</script>

<style lang="scss" scoped>
.test-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.test-info {
  background: #f5f5f5;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
  
  p {
    margin: 5px 0;
  }
}

.controls {
  margin-bottom: 20px;
  
  .el-button {
    margin-right: 10px;
  }
}

.server-display {
  border: 1px solid #ddd;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.minimized-test, .normal-test {
  h4 {
    margin-bottom: 15px;
    color: #333;
  }
}

.mini-empty {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 20px;
  background: #f9f9f9;
  border-radius: 8px;
  
  .mini-empty-icon {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #e0e0e0;
    border-radius: 8px;
  }
}

.mini-servers {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.mini-server-item {
  padding: 8px 12px;
  background: #e3f2fd;
  border-radius: 4px;
  font-size: 12px;
}

.normal-servers {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 15px;
}

.normal-server-item {
  padding: 15px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: #fff;
  
  h5 {
    margin: 0 0 10px 0;
    color: #333;
  }
  
  p {
    margin: 5px 0;
    font-size: 14px;
    color: #666;
  }
}

.debug-info {
  background: #f0f0f0;
  padding: 15px;
  border-radius: 8px;
  
  pre {
    background: #fff;
    padding: 10px;
    border-radius: 4px;
    overflow: auto;
    max-height: 300px;
  }
}
</style>
