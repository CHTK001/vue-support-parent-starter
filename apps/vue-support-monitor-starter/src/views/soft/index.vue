<template>
  <div class="software-mall-container">
    <!-- 顶部筛选区域 -->
    <div class="filter-container">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-input v-model="searchKeyword" placeholder="搜索软件" clearable prefix-icon="el-icon-search" @input="handleSearch" />
        </el-col>
        <el-col :span="4">
          <el-select v-model="selectedCategory" placeholder="全部分类" clearable @change="handleCategoryChange">
            <el-option v-for="item in categories" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-col>
        <el-col :span="14" class="text-right">
          <el-radio-group v-model="viewMode" size="small">
            <el-radio-button label="card">卡片视图</el-radio-button>
            <el-radio-button label="list">列表视图</el-radio-button>
          </el-radio-group>
        </el-col>
      </el-row>
    </div>

    <!-- 卡片视图 -->
    <div v-if="viewMode === 'card'" class="card-view">
      <el-row :gutter="20">
        <el-col v-for="(software, index) in filteredSoftwareList" :key="index" :xs="24" :sm="12" :md="8" :lg="6" :xl="4">
          <el-card class="software-card" shadow="hover">
            <div class="software-icon">
              <el-image :src="software.icon" fit="contain" :alt="software.name">
                <template #error>
                  <div class="image-placeholder">
                    <el-icon><Picture /></el-icon>
                  </div>
                </template>
              </el-image>
            </div>
            <div class="software-info">
              <h3>{{ software.name }}</h3>
              <p class="software-desc">{{ software.description }}</p>
              <div class="software-meta">
                <span class="version">版本: {{ software.version }}</span>
                <span class="category">{{ getCategoryName(software.category) }}</span>
              </div>
              <div class="software-actions">
                <el-button type="primary" @click="handleInstall(software)">安装</el-button>
                <el-button type="info" @click="showDetail(software)">详情</el-button>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 列表视图 -->
    <div v-else class="list-view">
      <el-table :data="filteredSoftwareList" style="width: 100%" border>
        <el-table-column label="图标" width="80">
          <template #default="scope">
            <el-image :src="scope.row.icon" fit="contain" style="width: 40px; height: 40px">
              <template #error>
                <div class="image-placeholder small">
                  <el-icon><Picture /></el-icon>
                </div>
              </template>
            </el-image>
          </template>
        </el-table-column>
        <el-table-column prop="name" label="名称" />
        <el-table-column prop="description" label="描述" show-overflow-tooltip />
        <el-table-column prop="version" label="版本" width="100" />
        <el-table-column label="分类" width="120">
          <template #default="scope">
            {{ getCategoryName(scope.row.category) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180">
          <template #default="scope">
            <el-button type="primary" size="small" @click="handleInstall(scope.row)">安装</el-button>
            <el-button type="info" size="small" @click="showDetail(scope.row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 安装设备选择抽屉 -->
    <el-drawer v-model="deviceDrawerVisible" title="选择安装设备" size="40%" destroy-on-close>
      <div class="device-selection">
        <el-alert
          v-if="!sshId"
          title="请选择要安装软件的设备"
          type="info"
          :closable="false"
          show-icon
        />
        <el-alert
          v-else
          title="将在指定设备上安装软件"
          type="success"
          :closable="false"
          show-icon
        />
        
        <div class="device-list" v-if="!sshId">
          <el-checkbox-group v-model="selectedDevices">
            <el-checkbox 
              v-for="device in deviceList" 
              :key="device.id" 
              :label="device.id"
            >
              {{ device.name }} ({{ device.ip }})
            </el-checkbox>
          </el-checkbox-group>
        </div>
        
        <div class="selected-software">
          <h4>安装软件: {{ currentSoftware.name }}</h4>
          <p>版本: {{ currentSoftware.version }}</p>
        </div>
        
        <div class="drawer-footer">
          <el-button @click="deviceDrawerVisible = false">取消</el-button>
          <el-button type="primary" :disabled="!canProceedInstall" @click="proceedInstall">
            开始安装
          </el-button>
        </div>
      </div>
    </el-drawer>

    <!-- 安装进度抽屉 -->
    <install-progress-drawer 
      v-if="installDrawerVisible"
      v-model="installDrawerVisible"
      :software="currentSoftware"
      :devices="installDevices"
      @finish="handleInstallFinish"
    />

    <!-- 软件详情对话框 -->
    <el-dialog v-model="detailDialogVisible" :title="currentSoftware.name + ' 详情'" width="50%">
      <div class="software-detail">
        <div class="detail-header">
          <el-image :src="currentSoftware.icon" fit="contain" style="width: 60px; height: 60px">
            <template #error>
              <div class="image-placeholder">
                <el-icon><Picture /></el-icon>
              </div>
            </template>
          </el-image>
          <div class="detail-title">
            <h2>{{ currentSoftware.name }}</h2>
            <div class="detail-meta">
              <el-tag size="small">{{ getCategoryName(currentSoftware.category) }}</el-tag>
              <span>版本: {{ currentSoftware.version }}</span>
            </div>
          </div>
        </div>
        
        <el-divider />
        
        <div class="detail-content">
          <h3>软件描述</h3>
          <p>{{ currentSoftware.description }}</p>
          
          <h3>安装信息</h3>
          <p>安装路径: {{ currentSoftware.installPath || '默认路径' }}</p>
          <p>端口: {{ currentSoftware.port || '自动分配' }}</p>
          
          <h3>系统要求</h3>
          <p>{{ currentSoftware.requirements || '无特殊要求' }}</p>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="detailDialogVisible = false">关闭</el-button>
          <el-button type="primary" @click="handleInstall(currentSoftware)">
            安装
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { Picture } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import InstallProgressDrawer from './components/InstallProgressDrawer.vue'
import { getSshListAll } from '@/api/ssh'

// 路由参数
const route = useRoute()
const sshId = ref(route.query.sshId || null)

// 视图模式
const viewMode = ref('card')

// 搜索和筛选
const searchKeyword = ref('')
const selectedCategory = ref('')

// 软件列表
const softwareList = ref([])
const loading = ref(false)

// 设备选择
const deviceDrawerVisible = ref(false)
const deviceList = ref([])
const selectedDevices = ref([])
const currentSoftware = ref({})

// 安装进度
const installDrawerVisible = ref(false)
const installDevices = ref([])

// 软件详情
const detailDialogVisible = ref(false)

// 软件分类
const categories = [
  { label: '全部', value: '' },
  { label: '数据库', value: 'database' },
  { label: 'Web服务器', value: 'web_server' },
  { label: '开发工具', value: 'development' },
  { label: '监控工具', value: 'monitoring' },
  { label: '容器', value: 'container' },
  { label: '其他', value: 'other' }
]

// 过滤后的软件列表
const filteredSoftwareList = computed(() => {
  let result = softwareList.value

  // 关键字搜索
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    result = result.filter(item => 
      item.name.toLowerCase().includes(keyword) || 
      item.description.toLowerCase().includes(keyword)
    )
  }

  // 分类筛选
  if (selectedCategory.value) {
    result = result.filter(item => item.category === selectedCategory.value)
  }

  return result
})

// 是否可以继续安装
const canProceedInstall = computed(() => {
  return sshId.value || (selectedDevices.value && selectedDevices.value.length > 0)
})

// 获取分类名称
const getCategoryName = (categoryValue) => {
  const category = categories.find(item => item.value === categoryValue)
  return category ? category.label : '其他'
}

// 处理搜索
const handleSearch = () => {
  // 实时搜索，无需额外处理，依赖计算属性
}

// 处理分类变更
const handleCategoryChange = () => {
  // 实时筛选，无需额外处理，依赖计算属性
}

// 显示软件详情
const showDetail = (software) => {
  currentSoftware.value = software
  detailDialogVisible.value = true
}

// 处理安装操作
const handleInstall = (software) => {
  currentSoftware.value = software
  
  if (sshId.value) {
    // 如果有指定的sshId，直接进入安装流程
    installDevices.value = [{ id: sshId.value }]
    proceedInstall()
  } else {
    // 否则打开设备选择抽屉
    deviceDrawerVisible.value = true
    loadDeviceList()
  }
}

// 加载设备列表
const loadDeviceList = async () => {
  try {
    loading.value = true
    const res = await getSshListAll()
    if (res.code === 200) {
      deviceList.value = res.data || []
    } else {
      ElMessage.error(res.msg || '获取设备列表失败')
    }
  } catch (error) {
    console.error('加载设备列表失败:', error)
    ElMessage.error('加载设备列表失败')
  } finally {
    loading.value = false
  }
}

// 继续安装流程
const proceedInstall = () => {
  deviceDrawerVisible.value = false
  
  if (sshId.value) {
    // 使用指定的sshId
    installDevices.value = [{ id: sshId.value }]
  } else {
    // 使用选择的设备
    installDevices.value = selectedDevices.value.map(id => {
      const device = deviceList.value.find(item => item.id === id)
      return { id, name: device?.name || id }
    })
  }
  
  // 打开安装进度抽屉
  installDrawerVisible.value = true
}

// 处理安装完成
const handleInstallFinish = (success) => {
  if (success) {
    ElMessage.success('软件安装成功')
  }
  // 重置选择的设备
  selectedDevices.value = []
}

// 加载软件列表
const loadSoftwareList = async () => {
  try {
    loading.value = true
    // 模拟数据，实际项目中应该从API获取
    softwareList.value = [
      {
        id: '1',
        name: 'MySQL',
        description: '最流行的开源关系型数据库',
        version: '8.0.32',
        category: 'database',
        icon: 'https://www.mysql.com/common/logos/logo-mysql-170x115.png',
        installPath: '/usr/local/mysql',
        port: 3306,
        requirements: '内存: 至少1GB, 存储空间: 至少2GB'
      },
      {
        id: '2',
        name: 'Nginx',
        description: '高性能的HTTP和反向代理服务器',
        version: '1.22.1',
        category: 'web_server',
        icon: 'https://www.nginx.com/wp-content/uploads/2020/05/NGINX-product-icon.svg',
        installPath: '/etc/nginx',
        port: 80,
        requirements: '内存: 至少512MB, 存储空间: 至少200MB'
      },
      {
        id: '3',
        name: 'Redis',
        description: '开源的内存数据结构存储系统',
        version: '7.0.8',
        category: 'database',
        icon: 'https://redis.io/images/redis-white.png',
        installPath: '/usr/local/redis',
        port: 6379,
        requirements: '内存: 至少512MB, 存储空间: 至少100MB'
      },
      {
        id: '4',
        name: 'Node.js',
        description: '基于Chrome V8引擎的JavaScript运行环境',
        version: '18.14.2',
        category: 'development',
        icon: 'https://nodejs.org/static/images/logos/nodejs-new-pantone-black.svg',
        installPath: '/usr/local/node',
        requirements: '内存: 至少512MB, 存储空间: 至少200MB'
      },
      {
        id: '5',
        name: 'Docker',
        description: '应用容器引擎',
        version: '23.0.1',
        category: 'container',
        icon: 'https://www.docker.com/wp-content/uploads/2022/03/Moby-logo.png',
        installPath: '/var/lib/docker',
        requirements: '内存: 至少1GB, 存储空间: 至少5GB'
      },
      {
        id: '6',
        name: 'Prometheus',
        description: '开源的系统监控和告警工具',
        version: '2.42.0',
        category: 'monitoring',
        icon: 'https://prometheus.io/assets/prometheus_logo_orange_circle.svg',
        installPath: '/usr/local/prometheus',
        port: 9090,
        requirements: '内存: 至少1GB, 存储空间: 至少1GB'
      }
    ]
  } catch (error) {
    console.error('加载软件列表失败:', error)
    ElMessage.error('加载软件列表失败')
  } finally {
    loading.value = false
  }
}

// 组件挂载时执行
onMounted(() => {
  loadSoftwareList()
})
</script>

<style lang="scss" scoped>
.software-mall-container {
  padding: 20px;
}

.filter-container {
  margin-bottom: 20px;
}

.text-right {
  text-align: right;
}

.card-view {
  margin-top: 20px;
  
  .software-card {
    margin-bottom: 20px;
    height: 100%;
    display: flex;
    flex-direction: column;
    
    .software-icon {
      text-align: center;
      padding: 10px 0;
      
      .el-image {
        width: 80px;
        height: 80px;
      }
    }
    
    .software-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      
      h3 {
        margin: 10px 0;
        font-size: 18px;
      }
      
      .software-desc {
        flex: 1;
        color: #666;
        font-size: 14px;
        margin-bottom: 15px;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
      
      .software-meta {
        display: flex;
        justify-content: space-between;
        color: #999;
        font-size: 12px;
        margin-bottom: 15px;
      }
      
      .software-actions {
        display: flex;
        justify-content: space-between;
      }
    }
  }
}

.list-view {
  margin-top: 20px;
}

.image-placeholder {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 80px;
  height: 80px;
  background-color: #f5f7fa;
  color: #909399;
  
  &.small {
    width: 40px;
    height: 40px;
  }
  
  .el-icon {
    font-size: 24px;
  }
}

.device-selection {
  padding: 0 20px;
  
  .device-list {
    margin-top: 20px;
    max-height: 300px;
    overflow-y: auto;
    
    .el-checkbox {
      display: block;
      margin-bottom: 10px;
    }
  }
  
  .selected-software {
    margin-top: 30px;
    padding: 15px;
    background-color: #f5f7fa;
    border-radius: 4px;
    
    h4 {
      margin: 0 0 10px 0;
    }
    
    p {
      margin: 5px 0;
      color: #666;
    }
  }
  
  .drawer-footer {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 20px;
    background-color: #fff;
    border-top: 1px solid #e4e7ed;
    display: flex;
    justify-content: flex-end;
  }
}

.software-detail {
  .detail-header {
    display: flex;
    align-items: center;
    
    .detail-title {
      margin-left: 20px;
      
      h2 {
        margin: 0 0 10px 0;
      }
      
      .detail-meta {
        display: flex;
        align-items: center;
        
        span {
          margin-left: 10px;
          color: #666;
        }
      }
    }
  }
  
  .detail-content {
    h3 {
      margin: 20px 0 10px 0;
      font-size: 16px;
      color: #303133;
    }
    
    p {
      margin: 5px 0;
      color: #606266;
    }
  }
}
</style>