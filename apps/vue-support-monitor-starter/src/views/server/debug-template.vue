<template>
  <div class="debug-container">
    <h2>模板逻辑调试</h2>
    
    <div class="controls">
      <el-button @click="leftPanelMinimized = !leftPanelMinimized">
        {{ leftPanelMinimized ? '展开面板' : '最小化面板' }}
      </el-button>
      <el-button @click="toggleServers">
        {{ servers.length > 0 ? '清空服务�? : '添加服务�? }}
      </el-button>
    </div>

    <div class="status">
      <p>最小化状�? {{ leftPanelMinimized }}</p>
      <p>服务器数�? {{ servers.length }}</p>
      <p>过滤后数�? {{ filteredServers.length }}</p>
    </div>

    <!-- 模拟原始模板结构 -->
    <div class="server-list-container" :style="{ width: leftPanelMinimized ? '60px' : '400px' }">
      <h3>服务器列表显�?/h3>
      
      <!-- 最小化状态下的简化服务器列表 -->
      <template v-if="leftPanelMinimized">
        <div class="section-title">最小化状�?</div>
        
        <!-- 最小化状态下的空状�?-->
        <div v-if="filteredServers.length === 0" class="server-mini-empty">
          <div class="mini-empty-icon">
            <IconifyIconOnline icon="ri:server-line" />
          </div>
          <span>暂无服务�?/span>
        </div>
        
        <!-- 最小化状态下的服务器列表 -->
        <div
          v-for="server in filteredServers"
          :key="server.id + '-mini'"
          class="server-mini-card"
        >
          {{ server.name }}
        </div>
      </template>

      <!-- 正常状态下的完整服务器列表 -->
      <template v-else>
        <div class="section-title">正常状�?</div>
        
        <!-- 正常状态下的空状�?-->
        <el-empty v-if="filteredServers.length === 0" description="暂无服务�?>
          <el-button type="primary">新增服务�?/el-button>
        </el-empty>

        <!-- 正常状态下的服务器列表 -->
        <template v-if="filteredServers.length > 0">
          <div
            v-for="server in filteredServers"
            :key="server.id"
            class="server-card"
          >
            <div class="server-name">{{ server.name }}</div>
            <div class="server-address">{{ server.host }}:{{ server.port }}</div>
            <div class="server-protocol">{{ server.protocol }}</div>
          </div>
        </template>
      </template>
    </div>

    <div class="template-logic">
      <h3>模板逻辑说明</h3>
      <div class="logic-item">
        <strong>最小化状�?(leftPanelMinimized = true):</strong>
        <ul>
          <li>如果 filteredServers.length === 0: 显示最小化空状态图�?/li>
          <li>如果 filteredServers.length > 0: 显示最小化服务器卡�?/li>
        </ul>
      </div>
      <div class="logic-item">
        <strong>正常状�?(leftPanelMinimized = false):</strong>
        <ul>
          <li>如果 filteredServers.length === 0: 显示 el-empty 组件</li>
          <li>如果 filteredServers.length > 0: 显示完整服务器卡片列�?/li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { IconifyIconOnline } from "@repo/components";

// 状�?
const leftPanelMinimized = ref(false);
const servers = ref([]);

// 计算属�?
const filteredServers = computed(() => {
  return servers.value;
});

// 切换服务器数�?
const toggleServers = () => {
  if (servers.value.length > 0) {
    servers.value = [];
  } else {
    servers.value = [
      { id: '1', name: '服务�?', host: '192.168.1.1', port: 22, protocol: 'SSH' },
      { id: '2', name: '服务�?', host: '192.168.1.2', port: 22, protocol: 'SSH' },
      { id: '3', name: '服务�?', host: '192.168.1.3', port: 3389, protocol: 'RDP' },
    ];
  }
};
</script>

<style lang="scss" scoped>
.debug-container {
  padding: 20px;
  max-width: 1000px;
  margin: 0 auto;
}

.controls {
  margin-bottom: 20px;
  
  .el-button {
    margin-right: 10px;
  }
}

.status {
  background: #f5f5f5;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
  
  p {
    margin: 5px 0;
    font-weight: bold;
  }
}

.server-list-container {
  border: 2px solid #409eff;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  transition: all 0.3s ease;
  min-height: 200px;
  
  h3 {
    margin-top: 0;
    color: #409eff;
  }
}

.section-title {
  font-weight: bold;
  color: var(--el-text-color-primary);
  margin-bottom: 15px;
  padding: 8px;
  background: #e3f2fd;
  border-radius: 4px;
}

.server-mini-empty {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 15px;
  background: #f9f9f9;
  border-radius: 8px;
  justify-content: center;
  
  .mini-empty-icon {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #e0e0e0;
    border-radius: 8px;
    color: var(--el-text-color-primary);
  }
  
  span {
    font-size: 12px;
    color: var(--el-text-color-primary);
  }
}

.server-mini-card {
  padding: 8px;
  margin-bottom: 8px;
  background: #e3f2fd;
  border-radius: 4px;
  font-size: 12px;
  text-align: center;
}

.server-card {
  padding: 15px;
  margin-bottom: 15px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: #fff;
  
  .server-name {
    font-weight: bold;
    margin-bottom: 8px;
    color: var(--el-text-color-primary);
  }
  
  .server-address {
    color: var(--el-text-color-primary);
    margin-bottom: 5px;
  }
  
  .server-protocol {
    color: #999;
    font-size: 12px;
  }
}

.template-logic {
  background: #f0f8ff;
  padding: 20px;
  border-radius: 8px;
  
  h3 {
    margin-top: 0;
    color: var(--el-text-color-primary);
  }
  
  .logic-item {
    margin-bottom: 15px;
    
    strong {
      color: #409eff;
    }
    
    ul {
      margin-top: 8px;
      padding-left: 20px;
      
      li {
        margin-bottom: 5px;
        color: var(--el-text-color-primary);
      }
    }
  }
}
</style>
