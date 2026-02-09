<template>
  <div class="debug-container system-container modern-bg">
    <h2>模板逻辑调试</h2>
    
    <div class="controls">
      <el-button @click="leftPanelMinimized = !leftPanelMinimized">
        {{ leftPanelMinimized ? '展开面板' : '最小化面板' }}
      </el-button>
      <el-button @click="toggleServers">
        {{ servers.length > 0 ? '清空服务器' : '添加服务器' }}
      </el-button>
    </div>

    <div class="status">
      <p>最小化状态: {{ leftPanelMinimized }}</p>
      <p>服务器数量: {{ servers.length }}</p>
      <p>过滤后数量: {{ filteredServers.length }}</p>
    </div>

    <!-- 模拟原始模板结构 -->
    <div class="server-list-container" :style="{ width: leftPanelMinimized ? '60px' : '400px' }">
      <h3>服务器列表显示</h3>
      
      <!-- 最小化状态下的简化服务器列表 -->
      <template v-if="leftPanelMinimized">
        <div class="section-title">最小化状态:</div>
        
        <!-- 最小化状态下的空状态 -->
        <div v-if="filteredServers.length === 0" class="server-mini-empty">
          <div class="mini-empty-icon">
            <IconifyIconOnline icon="ri:server-line" />
          </div>
          <span>暂无服务器</span>
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
        <div class="section-title">正常状态:</div>
        
        <!-- 正常状态下的空状态 -->
        <el-empty v-if="filteredServers.length === 0" description="暂无服务器">
          <el-button type="primary">新增服务器</el-button>
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
        <strong>最小化状态 (leftPanelMinimized = true):</strong>
        <ul>
          <li>如果 filteredServers.length === 0: 显示最小化空状态图标</li>
          <li>如果 filteredServers.length > 0: 显示最小化服务器卡片</li>
        </ul>
      </div>
      <div class="logic-item">
        <strong>正常状态 (leftPanelMinimized = false):</strong>
        <ul>
          <li>如果 filteredServers.length === 0: 显示 el-empty 组件</li>
          <li>如果 filteredServers.length > 0: 显示完整服务器卡片列表</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { IconifyIconOnline } from "@repo/components";

// 状态
const leftPanelMinimized = ref(false);
const servers = ref([]);

// 计算属性
const filteredServers = computed(() => {
  return servers.value;
});

// 切换服务器数据
const toggleServers = () => {
  if (servers.value.length > 0) {
    servers.value = [];
  } else {
    servers.value = [
      { id: '1', name: '服务器1', host: '192.168.1.1', port: 22, protocol: 'SSH' },
      { id: '2', name: '服务器2', host: '192.168.1.2', port: 22, protocol: 'SSH' },
      { id: '3', name: '服务器3', host: '192.168.1.3', port: 3389, protocol: 'RDP' },
    ];
  }
};
</script>

<style lang="scss" scoped>
@use "@/styles/mixins.scss" as *;
@use "@/styles/variables.scss" as *;

.modern-bg {
  position: relative;
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: $gradient-bg-1, $gradient-bg-2;
    pointer-events: none;
    z-index: 0;
  }

  > * {
    position: relative;
    z-index: 1;
  }
}

.debug-container {
  padding: $spacing-3xl;
  max-width: 1200px;
  margin: 0 auto;
  min-height: 100vh;
  position: relative;
  
  h2 {
    font-size: 28px;
    font-weight: 700;
    color: var(--el-text-color-primary);
    margin-bottom: $spacing-2xl;
    @include gradient-text;
  }
}

.controls {
  margin-bottom: $spacing-2xl;
  display: flex;
  gap: $spacing-md;
  flex-wrap: wrap;
  
  .el-button {
    border-radius: $radius-md;
    padding: $button-padding-lg;
    font-weight: 500;
    transition: all $duration-fast $ease-standard;
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: $shadow-md;
    }
  }
}

.status {
  padding: $spacing-xl $spacing-2xl;
  border-radius: $radius-lg;
  margin-bottom: $spacing-2xl;
  border: 1px solid $border-light;
  @include glass-effect(0.92, 16px);
  box-shadow: $shadow-md;
  
  p {
    margin: $spacing-sm 0;
    font-weight: $font-weight-semibold;
    color: var(--el-text-color-primary);
    font-size: $font-sm;
  }
}

.server-list-container {
  border: 1px solid $border-primary;
  padding: $spacing-2xl;
  border-radius: $radius-lg;
  margin-bottom: $spacing-2xl;
  transition: all $duration-normal $ease-standard;
  min-height: 200px;
  @include glass-effect(0.94, 18px);
  box-shadow: $shadow-lg;
  
  &:hover {
    border-color: $border-primary;
    box-shadow: $shadow-hover-lg;
  }
  
  h3 {
    margin-top: 0;
    margin-bottom: $spacing-xl;
    color: var(--el-color-primary);
    font-size: $font-xl;
    font-weight: $font-weight-semibold;
  }
}

.section-title {
  font-weight: $font-weight-semibold;
  color: var(--el-text-color-primary);
  margin-bottom: $spacing-lg;
  padding: $spacing-md $spacing-lg;
  background: rgba(99, 102, 241, 0.06);
  border-radius: $radius-md;
  border-left: 4px solid var(--el-color-primary);
  font-size: $font-sm;
}

.server-mini-empty {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: $spacing-xl;
  background: rgba(0, 0, 0, 0.02);
  border-radius: $radius-md;
  justify-content: center;
  border: 1px dashed $border-light;
  
  .mini-empty-icon {
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(99, 102, 241, 0.08);
    border-radius: $radius-md;
    color: var(--el-color-primary);
    font-size: 24px;
  }
  
  span {
    font-size: 14px;
    color: var(--el-text-color-regular);
    font-weight: 500;
  }
}

.server-mini-card {
  padding: $spacing-md $spacing-lg;
  margin-bottom: $spacing-sm;
  background: rgba(99, 102, 241, 0.06);
  border-radius: $radius-sm;
  font-size: 13px;
  text-align: center;
  font-weight: 500;
  color: var(--el-text-color-primary);
  border: 1px solid rgba(99, 102, 241, 0.18);
  transition: all $duration-fast $ease-standard;
  
  &:hover {
    background: rgba(99, 102, 241, 0.1);
    transform: translateX(4px);
  }
}

.server-card {
  padding: $spacing-xl;
  margin-bottom: $spacing-lg;
  border: 1px solid $border-light;
  border-radius: $radius-md;
  @include glass-effect(0.9, 14px);
  box-shadow: $shadow-md;
  transition: all $duration-normal $ease-standard;
  
  &:hover {
    box-shadow: $shadow-hover-md;
    transform: translateY(-2px);
    border-color: $border-primary;
  }
  
  .server-name {
    font-weight: 600;
    margin-bottom: 8px;
    color: var(--el-text-color-primary);
    font-size: 16px;
  }
  
  .server-address {
    color: var(--el-text-color-regular);
    margin-bottom: 6px;
    font-size: 14px;
  }
  
  .server-protocol {
    color: var(--el-text-color-placeholder);
    font-size: 12px;
    font-weight: 500;
  }
}

.template-logic {
  padding: $spacing-2xl;
  border-radius: $radius-lg;
  border: 1px solid rgba(99, 102, 241, 0.18);
  @include glass-effect(0.9, 16px);
  box-shadow: $shadow-md;
  
  h3 {
    margin-top: 0;
    margin-bottom: $spacing-xl;
    color: var(--el-text-color-primary);
    font-size: $font-xl;
    font-weight: $font-weight-semibold;
  }
  
  .logic-item {
    margin-bottom: $spacing-xl;
    padding: $spacing-lg;
    background: rgba(255, 255, 255, 0.55);
    border-radius: $radius-md;
    border-left: 4px solid var(--el-color-primary);
    
    strong {
      color: var(--el-color-primary);
      font-size: 15px;
      display: block;
      margin-bottom: $spacing-md;
    }
    
    ul {
      margin-top: $spacing-md;
      padding-left: $spacing-2xl;
      
      li {
        margin-bottom: $spacing-sm;
        color: var(--el-text-color-regular);
        line-height: 1.6;
        font-size: 14px;
        
        &::marker {
          color: var(--el-color-primary);
        }
      }
    }
  }
}

@include respond-to(sm) {
  .debug-container {
    padding: $spacing-xl;
    min-height: 100svh;
  }

  .server-list-container {
    padding: $spacing-xl;
  }
}
</style>
