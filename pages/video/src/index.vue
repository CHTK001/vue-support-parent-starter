<template>
  <div class="video-module">
    <div class="video-header">
      <h1 class="text-2xl font-bold text-gray-800 mb-4">视频管理</h1>
      <p class="text-gray-600 mb-6">视频资源管理、搜索、配置和解析功能</p>
    </div>
    
    <div class="video-nav-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <!-- 视频搜索 -->
      <div class="nav-card bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer" @click="navigateTo('/video/search')">
        <div class="flex items-center mb-4">
          <el-icon class="text-3xl text-blue-500 mr-3">
            <Search />
          </el-icon>
          <h3 class="text-lg font-semibold">视频搜索</h3>
        </div>
        <p class="text-gray-600 text-sm">搜索各大平台视频资源</p>
      </div>
      
      <!-- 视频管理 -->
      <div class="nav-card bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer" @click="navigateTo('/video/manage')">
        <div class="flex items-center mb-4">
          <el-icon class="text-3xl text-green-500 mr-3">
            <VideoPlay />
          </el-icon>
          <h3 class="text-lg font-semibold">视频管理</h3>
        </div>
        <p class="text-gray-600 text-sm">管理本地视频资源</p>
      </div>
      
      <!-- 配置管理 -->
      <div class="nav-card bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer" @click="navigateTo('/video/config')">
        <div class="flex items-center mb-4">
          <el-icon class="text-3xl text-orange-500 mr-3">
            <Setting />
          </el-icon>
          <h3 class="text-lg font-semibold">配置管理</h3>
        </div>
        <p class="text-gray-600 text-sm">视频同步渠道配置</p>
      </div>
      
      <!-- 视频解析 -->
      <div class="nav-card bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer" @click="navigateTo('/video/parse')">
        <div class="flex items-center mb-4">
          <el-icon class="text-3xl text-purple-500 mr-3">
            <Link />
          </el-icon>
          <h3 class="text-lg font-semibold">视频解析</h3>
        </div>
        <p class="text-gray-600 text-sm">VIP视频解析工具</p>
      </div>
    </div>
    
    <!-- 统计信息 -->
    <div class="video-stats mt-8">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div class="stat-card bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-blue-100 text-sm">总视频数</p>
              <p class="text-2xl font-bold">{{ stats.totalVideos }}</p>
            </div>
            <el-icon class="text-3xl text-blue-200">
              <VideoPlay />
            </el-icon>
          </div>
        </div>
        
        <div class="stat-card bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-green-100 text-sm">同步配置</p>
              <p class="text-2xl font-bold">{{ stats.syncConfigs }}</p>
            </div>
            <el-icon class="text-3xl text-green-200">
              <Refresh />
            </el-icon>
          </div>
        </div>
        
        <div class="stat-card bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-orange-100 text-sm">今日搜索</p>
              <p class="text-2xl font-bold">{{ stats.todaySearches }}</p>
            </div>
            <el-icon class="text-3xl text-orange-200">
              <Search />
            </el-icon>
          </div>
        </div>
        
        <div class="stat-card bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-purple-100 text-sm">解析次数</p>
              <p class="text-2xl font-bold">{{ stats.parseCount }}</p>
            </div>
            <el-icon class="text-3xl text-purple-200">
              <Link />
            </el-icon>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { Search, VideoPlay, Setting, Link, Refresh } from '@element-plus/icons-vue';


/**
 * 视频模块主页面
 * @author CH
 * @version 1.0.0
 * @since 2024-12-19
 */



const router = useRouter();

// 统计数据
const stats = ref({
  totalVideos: 0,
  syncConfigs: 0,
  todaySearches: 0,
  parseCount: 0
});

/**
 * 导航到指定页面
 * @param path 路由路径
 */
const navigateTo = (path: string) => {
  router.push(path);
};

/**
 * 加载统计数据
 */
const loadStats = async () => {
  try {
    // TODO: 调用API获取统计数据
    stats.value = {
      totalVideos: 1234,
      syncConfigs: 5,
      todaySearches: 89,
      parseCount: 456
    };
  } catch (error) {
    console.error('加载统计数据失败:', error);
  }
};

onMounted(() => {
  loadStats();
});
</script>

<style scoped>
.video-module {
  padding: 24px;
  background-color: #f5f5f5;
  min-height: 100vh;
}

.nav-card:hover {
  transform: translateY(-2px);
}

.stat-card {
  transition: transform 0.2s ease;
}

.stat-card:hover {
  transform: scale(1.02);
}
</style>