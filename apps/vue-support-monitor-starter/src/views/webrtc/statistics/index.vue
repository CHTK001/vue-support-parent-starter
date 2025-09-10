<template>
  <div class="statistics-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <el-breadcrumb separator="/">
        <el-breadcrumb-item :to="{ path: '/webrtc' }">WebRTC管理</el-breadcrumb-item>
        <el-breadcrumb-item>房间统计</el-breadcrumb-item>
      </el-breadcrumb>
    </div>

    <!-- 统计概览 -->
    <div class="statistics-overview">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-card class="stat-card" shadow="hover">
            <div class="stat-content">
              <div class="stat-icon total-rooms">
                <el-icon><House /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ systemStats.totalRooms }}</div>
                <div class="stat-label">总房间数</div>
              </div>
            </div>
          </el-card>
        </el-col>
        
        <el-col :span="6">
          <el-card class="stat-card" shadow="hover">
            <div class="stat-content">
              <div class="stat-icon active-rooms">
                <el-icon><VideoCamera /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ systemStats.activeRooms }}</div>
                <div class="stat-label">活跃房间</div>
              </div>
            </div>
          </el-card>
        </el-col>
        
        <el-col :span="6">
          <el-card class="stat-card" shadow="hover">
            <div class="stat-content">
              <div class="stat-icon online-users">
                <el-icon><User /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ systemStats.onlineUsers }}</div>
                <div class="stat-label">在线用户</div>
              </div>
            </div>
          </el-card>
        </el-col>
        
        <el-col :span="6">
          <el-card class="stat-card" shadow="hover">
            <div class="stat-content">
              <div class="stat-icon total-duration">
                <el-icon><Timer /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ formatDuration(systemStats.totalDuration) }}</div>
                <div class="stat-label">总通话时长</div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 图表区域 -->
    <div class="charts-section">
      <el-row :gutter="20">
        <!-- 房间使用趋势 -->
        <el-col :span="12">
          <el-card class="chart-card" shadow="hover">
            <template #header>
              <div class="card-header">
                <span>房间使用趋势</span>
                <el-select v-model="trendPeriod" size="small" style="width: 120px">
                  <el-option label="今日" value="today" />
                  <el-option label="本周" value="week" />
                  <el-option label="本月" value="month" />
                </el-select>
              </div>
            </template>
            <div ref="roomTrendChartRef" class="chart-container"></div>
          </el-card>
        </el-col>
        
        <!-- 房间类型分布 -->
        <el-col :span="12">
          <el-card class="chart-card" shadow="hover">
            <template #header>
              <div class="card-header">
                <span>房间类型分布</span>
                <el-button type="text" @click="refreshRoomTypeChart">
                  <el-icon><Refresh /></el-icon>
                </el-button>
              </div>
            </template>
            <div ref="roomTypeChartRef" class="chart-container"></div>
          </el-card>
        </el-col>
      </el-row>
      
      <el-row :gutter="20" style="margin-top: 20px">
        <!-- 用户活跃度 -->
        <el-col :span="12">
          <el-card class="chart-card" shadow="hover">
            <template #header>
              <div class="card-header">
                <span>用户活跃度</span>
                <el-select v-model="activityPeriod" size="small" style="width: 120px">
                  <el-option label="24小时" value="24h" />
                  <el-option label="7天" value="7d" />
                  <el-option label="30天" value="30d" />
                </el-select>
              </div>
            </template>
            <div ref="userActivityChartRef" class="chart-container"></div>
          </el-card>
        </el-col>
        
        <!-- 系统性能监控 -->
        <el-col :span="12">
          <el-card class="chart-card" shadow="hover">
            <template #header>
              <div class="card-header">
                <span>系统性能监控</span>
                <el-switch
                  v-model="realTimeMonitoring"
                  active-text="实时监控"
                  size="small"
                  @change="toggleRealTimeMonitoring"
                />
              </div>
            </template>
            <div ref="performanceChartRef" class="chart-container"></div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 详细统计表格 -->
    <div class="detailed-statistics">
      <el-card class="table-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <span>房间详细统计</span>
            <div class="header-actions">
              <el-input
                v-model="searchKeyword"
                placeholder="搜索房间"
                size="small"
                style="width: 200px; margin-right: 12px"
                clearable
              >
                <template #prefix>
                  <el-icon><Search /></el-icon>
                </template>
              </el-input>
              <el-button type="primary" size="small" @click="exportStatistics">
                <el-icon><Download /></el-icon>
                导出
              </el-button>
              <el-button type="info" size="small" @click="refreshStatistics">
                <el-icon><Refresh /></el-icon>
                刷新
              </el-button>
            </div>
          </div>
        </template>
        
        <el-table
          :data="filteredRoomStats"
          style="width: 100%"
          v-loading="loading"
          row-key="roomId"
        >
          <el-table-column prop="roomName" label="房间名称" min-width="150" />
          <el-table-column prop="roomType" label="类型" width="100">
            <template #default="{ row }">
              <el-tag :type="getRoomTypeTag(row.roomType)" size="small">
                {{ getRoomTypeText(row.roomType) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="totalUsers" label="总参与人数" width="120" />
          <el-table-column prop="peakUsers" label="峰值人数" width="100" />
          <el-table-column prop="totalDuration" label="总时长" width="120">
            <template #default="{ row }">
              {{ formatDuration(row.totalDuration) }}
            </template>
          </el-table-column>
          <el-table-column prop="avgDuration" label="平均时长" width="120">
            <template #default="{ row }">
              {{ formatDuration(row.avgDuration) }}
            </template>
          </el-table-column>
          <el-table-column prop="createTime" label="创建时间" width="150">
            <template #default="{ row }">
              {{ formatTime(row.createTime) }}
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="row.status === 'active' ? 'success' : 'info'" size="small">
                {{ row.status === 'active' ? '活跃' : '已结束' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="150">
            <template #default="{ row }">
              <el-button type="primary" size="small" @click="viewRoomDetail(row)">
                详情
              </el-button>
              <el-button type="info" size="small" @click="viewRoomHistory(row)">
                历史
              </el-button>
            </template>
          </el-table-column>
        </el-table>
        
        <div class="pagination-container">
          <el-pagination
            v-model:current-page="pagination.currentPage"
            v-model:page-size="pagination.pageSize"
            :page-sizes="[10, 20, 50, 100]"
            :total="pagination.total"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </el-card>
    </div>

    <!-- 房间详情对话框 -->
    <el-dialog v-model="showRoomDetail" title="房间详情" width="800px">
      <div class="room-detail-content" v-if="selectedRoom">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="房间名称">{{ selectedRoom.roomName }}</el-descriptions-item>
          <el-descriptions-item label="房间类型">
            <el-tag :type="getRoomTypeTag(selectedRoom.roomType)" size="small">
              {{ getRoomTypeText(selectedRoom.roomType) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="创建者">{{ selectedRoom.creatorName }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ formatTime(selectedRoom.createTime) }}</el-descriptions-item>
          <el-descriptions-item label="总参与人数">{{ selectedRoom.totalUsers }}</el-descriptions-item>
          <el-descriptions-item label="峰值人数">{{ selectedRoom.peakUsers }}</el-descriptions-item>
          <el-descriptions-item label="总时长">{{ formatDuration(selectedRoom.totalDuration) }}</el-descriptions-item>
          <el-descriptions-item label="平均时长">{{ formatDuration(selectedRoom.avgDuration) }}</el-descriptions-item>
        </el-descriptions>
        
        <!-- 参与者列表 -->
        <div class="participants-section">
          <h4>参与者列表</h4>
          <el-table :data="selectedRoom.participants" style="width: 100%">
            <el-table-column prop="username" label="用户名" />
            <el-table-column prop="joinTime" label="加入时间" width="150">
              <template #default="{ row }">
                {{ formatTime(row.joinTime) }}
              </template>
            </el-table-column>
            <el-table-column prop="leaveTime" label="离开时间" width="150">
              <template #default="{ row }">
                {{ row.leaveTime ? formatTime(row.leaveTime) : '仍在房间' }}
              </template>
            </el-table-column>
            <el-table-column prop="duration" label="停留时长" width="120">
              <template #default="{ row }">
                {{ formatDuration(row.duration) }}
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
    </el-dialog>

    <!-- 房间历史对话框 -->
    <el-dialog v-model="showRoomHistory" title="房间历史" width="1000px">
      <div class="room-history-content">
        <!-- 历史图表 -->
        <div ref="roomHistoryChartRef" class="chart-container" style="height: 300px; margin-bottom: 20px"></div>
        
        <!-- 历史记录表格 -->
        <el-table :data="roomHistoryData" style="width: 100%">
          <el-table-column prop="date" label="日期" width="120" />
          <el-table-column prop="sessions" label="会话次数" width="100" />
          <el-table-column prop="totalUsers" label="参与人数" width="100" />
          <el-table-column prop="peakUsers" label="峰值人数" width="100" />
          <el-table-column prop="totalDuration" label="总时长" width="120">
            <template #default="{ row }">
              {{ formatDuration(row.totalDuration) }}
            </template>
          </el-table-column>
          <el-table-column prop="avgDuration" label="平均时长" width="120">
            <template #default="{ row }">
              {{ formatDuration(row.avgDuration) }}
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
/**
 * WebRTC房间统计页面
 * @author CH
 * @date 2025-01-10
 * @version 1.0.0
 */

import { ref, reactive, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { ElMessage } from 'element-plus';
import {
  House,
  VideoCamera,
  User,
  Timer,
  Refresh,
  Search,
  Download
} from '@element-plus/icons-vue';
import * as echarts from 'echarts';
import {
  getSystemStatistics,
  getRoomStatistics,
  getRoomHistory,
  type SystemStatistics,
  type RoomStatistics
} from '@/api/webrtc';

// 图表引用
const roomTrendChartRef = ref<HTMLElement>();
const roomTypeChartRef = ref<HTMLElement>();
const userActivityChartRef = ref<HTMLElement>();
const performanceChartRef = ref<HTMLElement>();
const roomHistoryChartRef = ref<HTMLElement>();

// 图表实例
let roomTrendChart: echarts.ECharts | null = null;
let roomTypeChart: echarts.ECharts | null = null;
let userActivityChart: echarts.ECharts | null = null;
let performanceChart: echarts.ECharts | null = null;
let roomHistoryChart: echarts.ECharts | null = null;

// 数据状态
const loading = ref(false);
const searchKeyword = ref('');
const trendPeriod = ref('today');
const activityPeriod = ref('24h');
const realTimeMonitoring = ref(false);
const showRoomDetail = ref(false);
const showRoomHistory = ref(false);
const selectedRoom = ref<any>(null);

// 系统统计数据
const systemStats = ref<SystemStatistics>({
  totalRooms: 0,
  activeRooms: 0,
  onlineUsers: 0,
  totalDuration: 0,
  peakConcurrentUsers: 0,
  avgRoomDuration: 0,
  totalSessions: 0,
  successRate: 0
});

// 房间统计数据
const roomStats = ref<RoomStatistics[]>([]);
const roomHistoryData = ref<any[]>([]);

// 分页数据
const pagination = reactive({
  currentPage: 1,
  pageSize: 20,
  total: 0
});

// 实时监控定时器
let monitoringTimer: NodeJS.Timeout | null = null;

// 计算属性
const filteredRoomStats = computed(() => {
  if (!searchKeyword.value) return roomStats.value;
  return roomStats.value.filter(room => 
    room.roomName.toLowerCase().includes(searchKeyword.value.toLowerCase())
  );
});

/**
 * 获取房间类型标签
 */
const getRoomTypeTag = (type: string) => {
  const tags = {
    video_call: 'primary',
    video_conference: 'success',
    screen_share: 'warning'
  };
  return tags[type as keyof typeof tags] || 'info';
};

/**
 * 获取房间类型文本
 */
const getRoomTypeText = (type: string) => {
  const texts = {
    video_call: '视频通话',
    video_conference: '视频会议',
    screen_share: '屏幕共享'
  };
  return texts[type as keyof typeof texts] || '未知';
};

/**
 * 初始化房间趋势图表
 */
const initRoomTrendChart = () => {
  if (!roomTrendChartRef.value) return;
  
  roomTrendChart = echarts.init(roomTrendChartRef.value, 'dark');
  
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross'
      }
    },
    legend: {
      data: ['创建房间', '活跃房间', '参与用户']
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00']
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: '创建房间',
        type: 'line',
        data: [12, 8, 15, 25, 32, 28, 18],
        smooth: true,
        itemStyle: { color: '#409EFF' }
      },
      {
        name: '活跃房间',
        type: 'line',
        data: [8, 6, 12, 20, 25, 22, 15],
        smooth: true,
        itemStyle: { color: '#67C23A' }
      },
      {
        name: '参与用户',
        type: 'line',
        data: [45, 32, 68, 120, 150, 135, 85],
        smooth: true,
        itemStyle: { color: '#E6A23C' }
      }
    ]
  };
  
  roomTrendChart.setOption(option);
};

/**
 * 初始化房间类型分布图表
 */
const initRoomTypeChart = () => {
  if (!roomTypeChartRef.value) return;
  
  roomTypeChart = echarts.init(roomTypeChartRef.value, 'dark');
  
  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      left: 'left'
    },
    series: [
      {
        name: '房间类型',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        label: {
          show: false,
          position: 'center'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: '18',
            fontWeight: 'bold'
          }
        },
        labelLine: {
          show: false
        },
        data: [
          { value: 45, name: '视频通话', itemStyle: { color: '#409EFF' } },
          { value: 30, name: '视频会议', itemStyle: { color: '#67C23A' } },
          { value: 25, name: '屏幕共享', itemStyle: { color: '#E6A23C' } }
        ]
      }
    ]
  };
  
  roomTypeChart.setOption(option);
};

/**
 * 初始化用户活跃度图表
 */
const initUserActivityChart = () => {
  if (!userActivityChartRef.value) return;
  
  userActivityChart = echarts.init(userActivityChartRef.value, 'dark');
  
  const option = {
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: ['在线用户', '活跃用户']
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: '在线用户',
        type: 'bar',
        data: [120, 132, 101, 134, 90, 230, 210],
        itemStyle: { color: '#409EFF' }
      },
      {
        name: '活跃用户',
        type: 'bar',
        data: [85, 95, 78, 98, 65, 165, 155],
        itemStyle: { color: '#67C23A' }
      }
    ]
  };
  
  userActivityChart.setOption(option);
};

/**
 * 初始化系统性能监控图表
 */
const initPerformanceChart = () => {
  if (!performanceChartRef.value) return;
  
  performanceChart = echarts.init(performanceChartRef.value, 'dark');
  
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross'
      }
    },
    legend: {
      data: ['CPU使用率', '内存使用率', '网络带宽']
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: []
    },
    yAxis: {
      type: 'value',
      max: 100
    },
    series: [
      {
        name: 'CPU使用率',
        type: 'line',
        data: [],
        smooth: true,
        itemStyle: { color: '#F56C6C' }
      },
      {
        name: '内存使用率',
        type: 'line',
        data: [],
        smooth: true,
        itemStyle: { color: '#E6A23C' }
      },
      {
        name: '网络带宽',
        type: 'line',
        data: [],
        smooth: true,
        itemStyle: { color: '#909399' }
      }
    ]
  };
  
  performanceChart.setOption(option);
};

/**
 * 加载系统统计数据
 */
const loadSystemStatistics = async () => {
  try {
    const { data } = await getSystemStatistics();
    systemStats.value = data;
  } catch (error) {
    console.error('加载系统统计失败:', error);
    ElMessage.error('加载系统统计失败');
  }
};

/**
 * 加载房间统计数据
 */
const loadRoomStatistics = async () => {
  try {
    loading.value = true;
    const { data } = await getRoomStatistics({
      page: pagination.currentPage,
      size: pagination.pageSize,
      keyword: searchKeyword.value
    });
    roomStats.value = data.records;
    pagination.total = data.total;
  } catch (error) {
    console.error('加载房间统计失败:', error);
    ElMessage.error('加载房间统计失败');
  } finally {
    loading.value = false;
  }
};

/**
 * 刷新房间类型图表
 */
const refreshRoomTypeChart = () => {
  if (roomTypeChart) {
    // TODO: 重新加载数据并更新图表
    ElMessage.success('图表已刷新');
  }
};

/**
 * 切换实时监控
 */
const toggleRealTimeMonitoring = (enabled: boolean) => {
  if (enabled) {
    startRealTimeMonitoring();
  } else {
    stopRealTimeMonitoring();
  }
};

/**
 * 开始实时监控
 */
const startRealTimeMonitoring = () => {
  monitoringTimer = setInterval(() => {
    updatePerformanceChart();
  }, 5000);
};

/**
 * 停止实时监控
 */
const stopRealTimeMonitoring = () => {
  if (monitoringTimer) {
    clearInterval(monitoringTimer);
    monitoringTimer = null;
  }
};

/**
 * 更新性能图表
 */
const updatePerformanceChart = () => {
  if (!performanceChart) return;
  
  const now = new Date();
  const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  
  const option = performanceChart.getOption() as any;
  const xData = option.xAxis[0].data;
  const series = option.series;
  
  // 添加新数据点
  xData.push(timeStr);
  series[0].data.push(Math.random() * 100);
  series[1].data.push(Math.random() * 100);
  series[2].data.push(Math.random() * 100);
  
  // 保持最多20个数据点
  if (xData.length > 20) {
    xData.shift();
    series[0].data.shift();
    series[1].data.shift();
    series[2].data.shift();
  }
  
  performanceChart.setOption(option);
};

/**
 * 查看房间详情
 */
const viewRoomDetail = async (room: any) => {
  selectedRoom.value = {
    ...room,
    participants: [
      {
        username: '张三',
        joinTime: new Date().toISOString(),
        leaveTime: null,
        duration: 1800
      },
      {
        username: '李四',
        joinTime: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        leaveTime: new Date().toISOString(),
        duration: 1200
      }
    ]
  };
  showRoomDetail.value = true;
};

/**
 * 查看房间历史
 */
const viewRoomHistory = async (room: any) => {
  try {
    const { data } = await getRoomHistory(room.roomId);
    roomHistoryData.value = data;
    showRoomHistory.value = true;
    
    // 等待对话框渲染完成后初始化图表
    await nextTick();
    initRoomHistoryChart();
  } catch (error) {
    console.error('加载房间历史失败:', error);
    ElMessage.error('加载房间历史失败');
  }
};

/**
 * 初始化房间历史图表
 */
const initRoomHistoryChart = () => {
  if (!roomHistoryChartRef.value) return;
  
  roomHistoryChart = echarts.init(roomHistoryChartRef.value, 'dark');
  
  const option = {
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: ['会话次数', '参与人数']
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: roomHistoryData.value.map(item => item.date)
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: '会话次数',
        type: 'line',
        data: roomHistoryData.value.map(item => item.sessions),
        smooth: true,
        itemStyle: { color: '#409EFF' }
      },
      {
        name: '参与人数',
        type: 'line',
        data: roomHistoryData.value.map(item => item.totalUsers),
        smooth: true,
        itemStyle: { color: '#67C23A' }
      }
    ]
  };
  
  roomHistoryChart.setOption(option);
};

/**
 * 导出统计数据
 */
const exportStatistics = () => {
  // TODO: 实现导出功能
  ElMessage.success('导出功能开发中');
};

/**
 * 刷新统计数据
 */
const refreshStatistics = async () => {
  await Promise.all([
    loadSystemStatistics(),
    loadRoomStatistics()
  ]);
  ElMessage.success('数据已刷新');
};

/**
 * 处理分页大小变化
 */
const handleSizeChange = (size: number) => {
  pagination.pageSize = size;
  loadRoomStatistics();
};

/**
 * 处理当前页变化
 */
const handleCurrentChange = (page: number) => {
  pagination.currentPage = page;
  loadRoomStatistics();
};

/**
 * 格式化时长
 */
const formatDuration = (seconds: number) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}小时${minutes}分钟`;
  }
  return `${minutes}分钟`;
};

/**
 * 格式化时间
 */
const formatTime = (time: string) => {
  return new Date(time).toLocaleString();
};

// 监听搜索关键词变化
watch(searchKeyword, () => {
  pagination.currentPage = 1;
  loadRoomStatistics();
});

// 监听趋势周期变化
watch(trendPeriod, () => {
  // TODO: 重新加载趋势数据
});

// 监听活跃度周期变化
watch(activityPeriod, () => {
  // TODO: 重新加载活跃度数据
});

// 组件挂载时初始化
onMounted(async () => {
  await Promise.all([
    loadSystemStatistics(),
    loadRoomStatistics()
  ]);
  
  // 等待DOM渲染完成后初始化图表
  await nextTick();
  initRoomTrendChart();
  initRoomTypeChart();
  initUserActivityChart();
  initPerformanceChart();
  
  // 窗口大小变化时重新调整图表
  window.addEventListener('resize', () => {
    roomTrendChart?.resize();
    roomTypeChart?.resize();
    userActivityChart?.resize();
    performanceChart?.resize();
  });
});

// 组件卸载时清理
onUnmounted(() => {
  stopRealTimeMonitoring();
  
  roomTrendChart?.dispose();
  roomTypeChart?.dispose();
  userActivityChart?.dispose();
  performanceChart?.dispose();
  roomHistoryChart?.dispose();
  
  window.removeEventListener('resize', () => {});
});
</script>

<style scoped lang="scss">
.statistics-container {
  padding: 20px;
  background-color: #f5f5f5;
  min-height: 100vh;
}

.page-header {
  margin-bottom: 20px;
}

.statistics-overview {
  margin-bottom: 20px;
  
  .stat-card {
    height: 120px;
    
    :deep(.el-card__body) {
      padding: 20px;
      height: 100%;
      display: flex;
      align-items: center;
    }
    
    .stat-content {
      display: flex;
      align-items: center;
      width: 100%;
      
      .stat-icon {
        width: 60px;
        height: 60px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 16px;
        
        .el-icon {
          font-size: 24px;
          color: white;
        }
        
        &.total-rooms {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        
        &.active-rooms {
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
        }
        
        &.online-users {
          background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
        }
        
        &.total-duration {
          background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
        }
      }
      
      .stat-info {
        flex: 1;
        
        .stat-value {
          font-size: 28px;
          font-weight: 700;
          color: #303133;
          line-height: 1;
          margin-bottom: 8px;
        }
        
        .stat-label {
          font-size: 14px;
          color: #909399;
        }
      }
    }
  }
}

.charts-section {
  margin-bottom: 20px;
  
  .chart-card {
    height: 400px;
    
    :deep(.el-card__header) {
      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
    }
    
    :deep(.el-card__body) {
      padding: 20px;
      height: calc(100% - 60px);
    }
    
    .chart-container {
      width: 100%;
      height: 100%;
    }
  }
}

.detailed-statistics {
  .table-card {
    :deep(.el-card__header) {
      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        
        .header-actions {
          display: flex;
          align-items: center;
        }
      }
    }
    
    .pagination-container {
      margin-top: 20px;
      text-align: right;
    }
  }
}

.room-detail-content {
  .participants-section {
    margin-top: 20px;
    
    h4 {
      margin-bottom: 16px;
      color: #303133;
    }
  }
}

.room-history-content {
  .chart-container {
    margin-bottom: 20px;
  }
}

// 深色主题适配
@media (prefers-color-scheme: dark) {
  .statistics-container {
    background-color: #1a1a1a;
    color: white;
  }
  
  .stat-card {
    background-color: #2a2a2a;
    border-color: #404040;
    
    .stat-value {
      color: white !important;
    }
  }
  
  .chart-card,
  .table-card {
    background-color: #2a2a2a;
    border-color: #404040;
    
    :deep(.el-card__header) {
      background-color: #333;
      border-bottom-color: #404040;
      color: white;
    }
  }
}
</style>