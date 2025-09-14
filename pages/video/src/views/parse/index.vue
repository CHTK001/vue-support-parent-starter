<template>
  <div class="video-parse">
    <!-- 页面头部 -->
    <div class="parse-header mb-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-800 mb-2">视频解析</h1>
          <p class="text-gray-600">解析各大视频网站的VIP视频，免费观看高清内容</p>
        </div>
        
        <div class="header-actions flex items-center space-x-3">
          <el-button @click="showHistoryDialog = true">
            <el-icon><Clock /></el-icon>
            解析历史
          </el-button>
          <el-button @click="showSettingsDialog = true">
            <el-icon><Setting /></el-icon>
            设置
          </el-button>
        </div>
      </div>
    </div>

    <!-- 统计信息 -->
    <div class="stats-cards grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div class="stat-card bg-white rounded-lg shadow p-4">
        <div class="flex items-center">
          <div class="stat-icon bg-blue-100 text-blue-600 p-3 rounded-full mr-3">
            <el-icon><VideoPlay /></el-icon>
          </div>
          <div>
            <p class="text-sm text-gray-500">今日解析</p>
            <p class="text-2xl font-bold text-gray-800">{{ stats.todayParsed }}</p>
          </div>
        </div>
      </div>
      
      <div class="stat-card bg-white rounded-lg shadow p-4">
        <div class="flex items-center">
          <div class="stat-icon bg-green-100 text-green-600 p-3 rounded-full mr-3">
            <el-icon><SuccessFilled /></el-icon>
          </div>
          <div>
            <p class="text-sm text-gray-500">成功率</p>
            <p class="text-2xl font-bold text-gray-800">{{ stats.successRate }}%</p>
          </div>
        </div>
      </div>
      
      <div class="stat-card bg-white rounded-lg shadow p-4">
        <div class="flex items-center">
          <div class="stat-icon bg-yellow-100 text-yellow-600 p-3 rounded-full mr-3">
            <el-icon><Star /></el-icon>
          </div>
          <div>
            <p class="text-sm text-gray-500">收藏数</p>
            <p class="text-2xl font-bold text-gray-800">{{ stats.favoriteCount }}</p>
          </div>
        </div>
      </div>
      
      <div class="stat-card bg-white rounded-lg shadow p-4">
        <div class="flex items-center">
          <div class="stat-icon bg-purple-100 text-purple-600 p-3 rounded-full mr-3">
            <el-icon><Connection /></el-icon>
          </div>
          <div>
            <p class="text-sm text-gray-500">可用接口</p>
            <p class="text-2xl font-bold text-gray-800">{{ stats.availableApis }}</p>
          </div>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- 解析区域 -->
      <div class="lg:col-span-2">
        <div class="parse-card bg-white rounded-lg shadow p-6">
          <div class="card-header mb-6">
            <div class="flex items-center">
              <el-icon class="text-2xl text-blue-500 mr-3"><VideoPlay /></el-icon>
              <h3 class="text-lg font-semibold">视频解析</h3>
            </div>
          </div>
          
          <el-form :model="parseForm" :rules="parseRules" ref="parseFormRef" label-width="100px">
            <el-form-item label="解析接口" prop="apiId">
              <el-select v-model="parseForm.apiId" placeholder="请选择解析接口" style="width: 100%" @change="handleApiChange">
                <el-option-group label="通用接口">
                  <el-option 
                    v-for="api in parseApis.filter(api => api.category === 'general')"
                    :key="api.id"
                    :label="api.name"
                    :value="api.id"
                  >
                    <div class="flex items-center justify-between w-full">
                      <span>{{ api.name }}</span>
                      <div class="flex items-center space-x-2">
                        <el-tag :type="api.status === 'active' ? 'success' : 'danger'" size="small">
                          {{ api.status === 'active' ? '正常' : '异常' }}
                        </el-tag>
                        <span class="text-xs text-gray-500">{{ api.speed }}ms</span>
                      </div>
                    </div>
                  </el-option>
                </el-option-group>
                
                <el-option-group label="专用接口">
                  <el-option-group label="主流平台">
                    <el-option 
                      v-for="api in parseApis.filter(api => api.category === 'mainstream')"
                      :key="api.id"
                      :label="api.name"
                      :value="api.id"
                    >
                      <div class="flex items-center justify-between w-full">
                        <span>{{ api.name }}</span>
                        <div class="flex items-center space-x-2">
                          <el-tag :type="api.status === 'active' ? 'success' : 'danger'" size="small">
                            {{ api.status === 'active' ? '正常' : '异常' }}
                          </el-tag>
                          <span class="text-xs text-gray-500">{{ api.speed }}ms</span>
                        </div>
                      </div>
                    </el-option>
                  </el-option-group>
                  
                  <el-option-group label="B站专用">
                    <el-option 
                      v-for="api in parseApis.filter(api => api.category === 'bilibili')"
                      :key="api.id"
                      :label="api.name"
                      :value="api.id"
                    >
                      <div class="flex items-center justify-between w-full">
                        <span>{{ api.name }}</span>
                        <div class="flex items-center space-x-2">
                          <el-tag :type="api.status === 'active' ? 'success' : 'danger'" size="small">
                            {{ api.status === 'active' ? '正常' : '异常' }}
                          </el-tag>
                          <span class="text-xs text-gray-500">{{ api.speed }}ms</span>
                        </div>
                      </div>
                    </el-option>
                  </el-option-group>
                </el-option-group>
              </el-select>
            </el-form-item>
            
            <el-form-item label="视频链接" prop="url">
              <el-input 
                v-model="parseForm.url" 
                placeholder="请输入需要解析的视频链接，如：https://v.qq.com/x/cover/xxx.html"
                clearable
                @input="handleUrlInput"
              >
                <template #prefix>
                  <el-icon><Link /></el-icon>
                </template>
                <template #append>
                  <el-button @click="pasteUrl">粘贴</el-button>
                </template>
              </el-input>
            </el-form-item>
            
            <!-- URL检测结果 -->
            <div v-if="urlDetection.platform" class="url-detection mb-4 p-3 bg-gray-50 rounded">
              <div class="flex items-center space-x-2">
                <el-icon class="text-blue-500"><InfoFilled /></el-icon>
                <span class="text-sm text-gray-600">检测到平台：</span>
                <el-tag size="small">{{ urlDetection.platform }}</el-tag>
                <span class="text-sm text-gray-600">建议使用：</span>
                <el-tag type="success" size="small">{{ urlDetection.recommendedApi }}</el-tag>
              </div>
            </div>
            
            <div class="form-actions flex items-center space-x-3">
              <el-button 
                type="primary" 
                :loading="parsing" 
                @click="parseVideo"
                :disabled="!parseForm.url || !parseForm.apiId"
              >
                <el-icon><VideoPlay /></el-icon>
                {{ parsing ? '解析中...' : '解析播放' }}
              </el-button>
              
              <el-button @click="resetForm">
                <el-icon><Refresh /></el-icon>
                重置
              </el-button>
              
              <el-button 
                v-if="parseResult.playUrl" 
                type="success" 
                @click="toggleFullscreen"
              >
                <el-icon><FullScreen /></el-icon>
                {{ fullscreen ? '退出全屏' : '全屏播放' }}
              </el-button>
            </div>
          </el-form>
          
          <!-- 历史记录快捷选择 -->
          <div v-if="recentHistory.length > 0" class="recent-history mt-6">
            <div class="flex items-center mb-3">
              <el-icon class="text-gray-500 mr-2"><Clock /></el-icon>
              <span class="text-sm text-gray-600">最近解析：</span>
            </div>
            <div class="flex flex-wrap gap-2">
              <el-tag 
                v-for="(item, index) in recentHistory.slice(0, 5)"
                :key="index"
                class="cursor-pointer"
                @click="selectFromHistory(item)"
                :effect="parseForm.url === item.originalUrl ? 'dark' : 'plain'"
              >
                {{ item.title || (item.originalUrl.length > 30 ? item.originalUrl.substring(0, 30) + '...' : item.originalUrl) }}
              </el-tag>
            </div>
          </div>
        </div>
        
        <!-- 视频播放区域 -->
        <div v-if="parseResult.playUrl" class="player-card bg-white rounded-lg shadow p-6 mt-6">
          <div class="card-header mb-4">
            <div class="flex items-center justify-between">
              <div class="flex items-center">
                <el-icon class="text-2xl text-green-500 mr-3"><VideoPlay /></el-icon>
                <h3 class="text-lg font-semibold">视频播放</h3>
              </div>
              <div class="player-controls flex items-center space-x-2">
                <el-button size="small" @click="copyPlayUrl">
                  <el-icon><CopyDocument /></el-icon>
                  复制链接
                </el-button>
                <el-button size="small" @click="openInNewTab">
                  <el-icon><TopRight /></el-icon>
                  新窗口
                </el-button>
                <el-button size="small" @click="addToFavorites">
                  <el-icon><Star /></el-icon>
                  收藏
                </el-button>
              </div>
            </div>
          </div>
          
          <div class="player-container">
            <iframe 
              id="video-player-iframe"
              :src="parseResult.playUrl"
              frameborder="0"
              allowfullscreen
              class="player-iframe"
            ></iframe>
          </div>
          
          <!-- 解析信息 -->
          <div class="parse-info mt-4 p-3 bg-gray-50 rounded">
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span class="text-gray-500">解析接口：</span>
                <span class="font-medium">{{ parseResult.apiName }}</span>
              </div>
              <div>
                <span class="text-gray-500">解析时间：</span>
                <span class="font-medium">{{ parseResult.parseTime }}</span>
              </div>
              <div>
                <span class="text-gray-500">视频平台：</span>
                <span class="font-medium">{{ parseResult.platform }}</span>
              </div>
              <div>
                <span class="text-gray-500">解析耗时：</span>
                <span class="font-medium">{{ parseResult.duration }}ms</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 侧边栏 -->
      <div class="sidebar">
        <!-- 热门平台 -->
        <div class="platform-card bg-white rounded-lg shadow p-6 mb-6">
          <div class="card-header mb-4">
            <div class="flex items-center">
              <el-icon class="text-2xl text-orange-500 mr-3"><Star /></el-icon>
              <h3 class="text-lg font-semibold">热门平台</h3>
            </div>
          </div>
          
          <div class="platform-grid grid grid-cols-2 gap-3">
            <div 
              v-for="platform in popularPlatforms"
              :key="platform.name"
              class="platform-item p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"
              @click="openPlatform(platform.url)"
            >
              <div class="flex flex-col items-center">
                <el-icon class="text-2xl mb-2" :style="{ color: platform.color }">
                  <component :is="platform.icon" />
                </el-icon>
                <span class="text-sm font-medium">{{ platform.name }}</span>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 接口状态 -->
        <div class="api-status-card bg-white rounded-lg shadow p-6 mb-6">
          <div class="card-header mb-4">
            <div class="flex items-center justify-between">
              <div class="flex items-center">
                <el-icon class="text-2xl text-green-500 mr-3"><Connection /></el-icon>
                <h3 class="text-lg font-semibold">接口状态</h3>
              </div>
              <el-button size="small" @click="checkApiStatus">
                <el-icon><Refresh /></el-icon>
                检测
              </el-button>
            </div>
          </div>
          
          <div class="api-list space-y-3">
            <div 
              v-for="api in parseApis.slice(0, 6)"
              :key="api.id"
              class="api-item flex items-center justify-between p-2 border border-gray-100 rounded"
            >
              <div class="flex items-center">
                <div 
                  class="status-dot w-2 h-2 rounded-full mr-2"
                  :class="api.status === 'active' ? 'bg-green-500' : 'bg-red-500'"
                ></div>
                <span class="text-sm">{{ api.name }}</span>
              </div>
              <div class="flex items-center space-x-2">
                <span class="text-xs text-gray-500">{{ api.speed }}ms</span>
                <el-tag 
                  :type="api.status === 'active' ? 'success' : 'danger'"
                  size="small"
                >
                  {{ api.status === 'active' ? '正常' : '异常' }}
                </el-tag>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 使用说明 -->
        <div class="guide-card bg-white rounded-lg shadow p-6">
          <div class="card-header mb-4">
            <div class="flex items-center">
              <el-icon class="text-2xl text-blue-500 mr-3"><QuestionFilled /></el-icon>
              <h3 class="text-lg font-semibold">使用说明</h3>
            </div>
          </div>
          
          <div class="guide-steps space-y-3">
            <div class="step-item flex items-start">
              <div class="step-number w-6 h-6 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center mr-3 mt-0.5">1</div>
              <div class="step-content">
                <p class="text-sm text-gray-700">选择合适的解析接口</p>
                <p class="text-xs text-gray-500 mt-1">不同接口解析能力不同，建议优先使用推荐接口</p>
              </div>
            </div>
            
            <div class="step-item flex items-start">
              <div class="step-number w-6 h-6 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center mr-3 mt-0.5">2</div>
              <div class="step-content">
                <p class="text-sm text-gray-700">输入视频链接</p>
                <p class="text-xs text-gray-500 mt-1">复制需要解析的VIP视频链接并粘贴</p>
              </div>
            </div>
            
            <div class="step-item flex items-start">
              <div class="step-number w-6 h-6 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center mr-3 mt-0.5">3</div>
              <div class="step-content">
                <p class="text-sm text-gray-700">开始解析</p>
                <p class="text-xs text-gray-500 mt-1">点击解析播放按钮，等待解析完成</p>
              </div>
            </div>
            
            <div class="step-item flex items-start">
              <div class="step-number w-6 h-6 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center mr-3 mt-0.5">4</div>
              <div class="step-content">
                <p class="text-sm text-gray-700">观看视频</p>
                <p class="text-xs text-gray-500 mt-1">解析成功后即可免费观看高清视频</p>
              </div>
            </div>
          </div>
          
          <div class="guide-notice mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
            <div class="flex items-start">
              <el-icon class="text-yellow-500 mr-2 mt-0.5"><WarningFilled /></el-icon>
              <div class="text-xs text-yellow-700">
                <p class="font-medium mb-1">温馨提示</p>
                <p>本工具仅供学习交流使用，请尊重版权，支持正版内容</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 解析历史对话框 -->
    <el-dialog v-model="showHistoryDialog" title="解析历史" width="800px">
      <div class="history-content">
        <div class="history-header mb-4">
          <div class="flex items-center justify-between">
            <span class="text-sm text-gray-600">共 {{ parseHistory.length }} 条记录</span>
            <div class="flex items-center space-x-2">
              <el-button size="small" @click="exportHistory">
                <el-icon><Download /></el-icon>
                导出
              </el-button>
              <el-button size="small" @click="clearHistory">
                <el-icon><Delete /></el-icon>
                清空
              </el-button>
            </div>
          </div>
        </div>
        
        <div class="history-list">
          <div 
            v-for="(item, index) in parseHistory"
            :key="index"
            class="history-item p-4 border border-gray-200 rounded-lg mb-3 hover:border-blue-300 transition-colors"
          >
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <h4 class="font-medium text-gray-800 mb-2">{{ item.title || '未知视频' }}</h4>
                <div class="text-sm text-gray-600 space-y-1">
                  <p><span class="font-medium">原始链接：</span>{{ item.originalUrl }}</p>
                  <p><span class="font-medium">解析接口：</span>{{ item.apiName }}</p>
                  <p><span class="font-medium">视频平台：</span>{{ item.platform }}</p>
                  <p><span class="font-medium">解析时间：</span>{{ item.parseTime }}</p>
                </div>
              </div>
              <div class="flex items-center space-x-2 ml-4">
                <el-button size="small" @click="replayFromHistory(item)">
                  <el-icon><VideoPlay /></el-icon>
                  重播
                </el-button>
                <el-button size="small" @click="copyHistoryUrl(item)">
                  <el-icon><CopyDocument /></el-icon>
                  复制
                </el-button>
                <el-button size="small" type="danger" @click="deleteHistoryItem(index)">
                  <el-icon><Delete /></el-icon>
                  删除
                </el-button>
              </div>
            </div>
          </div>
        </div>
        
        <div v-if="parseHistory.length === 0" class="empty-history text-center py-8">
          <el-icon class="text-4xl text-gray-400 mb-2"><DocumentDelete /></el-icon>
          <p class="text-gray-500">暂无解析历史</p>
        </div>
      </div>
    </el-dialog>

    <!-- 设置对话框 -->
    <el-dialog v-model="showSettingsDialog" title="解析设置" width="600px">
      <el-form :model="settings" label-width="120px">
        <el-form-item label="自动检测平台">
          <el-switch v-model="settings.autoDetectPlatform" />
          <div class="text-xs text-gray-500 mt-1">自动检测视频平台并推荐最佳解析接口</div>
        </el-form-item>
        
        <el-form-item label="自动解析">
          <el-switch v-model="settings.autoParseOnInput" />
          <div class="text-xs text-gray-500 mt-1">输入链接后自动开始解析</div>
        </el-form-item>
        
        <el-form-item label="保存历史">
          <el-switch v-model="settings.saveHistory" />
          <div class="text-xs text-gray-500 mt-1">保存解析历史记录</div>
        </el-form-item>
        
        <el-form-item label="历史记录数量">
          <el-input-number v-model="settings.maxHistoryCount" :min="10" :max="100" />
          <div class="text-xs text-gray-500 mt-1">最多保存的历史记录数量</div>
        </el-form-item>
        
        <el-form-item label="默认解析接口">
          <el-select v-model="settings.defaultApiId" placeholder="请选择默认接口">
            <el-option 
              v-for="api in parseApis.filter(api => api.status === 'active')"
              :key="api.id"
              :label="api.name"
              :value="api.id"
            />
          </el-select>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showSettingsDialog = false">取消</el-button>
          <el-button type="primary" @click="saveSettings">保存设置</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  VideoPlay, Clock, Setting, SuccessFilled, Star, Connection, Link, Refresh,
  FullScreen, CopyDocument, TopRight, InfoFilled, QuestionFilled, WarningFilled,
  Download, Delete, DocumentDelete
} from '@element-plus/icons-vue';
import {
  getParseApiList,
  parseVideoUrl,
  getParseHistory,
  addParseHistory,
  clearParseHistory,
  getParseStats,
  testParseApi
} from '../../api/parse';
import type { ParseApiInfo, ParseRequest, ParseResult, ParseHistory } from '../../api/types';

/**
 * 视频解析页面
 * @author CH
 * @version 1.0.0
 * @since 2024-12-19
 */

// 页面状态
const parsing = ref(false);
const fullscreen = ref(false);
const showHistoryDialog = ref(false);
const showSettingsDialog = ref(false);

// 表单数据
const parseForm = reactive({
  url: '',
  apiId: ''
});

// 表单验证规则
const parseRules = {
  url: [
    { required: true, message: '请输入视频链接', trigger: 'blur' },
    { pattern: /^https?:\/\/.+/, message: '请输入有效的URL', trigger: 'blur' }
  ],
  apiId: [
    { required: true, message: '请选择解析接口', trigger: 'change' }
  ]
};

const parseFormRef = ref();

// 数据
const parseApis = ref<ParseApiInfo[]>([]);
const parseHistory = ref<ParseHistory[]>([]);
const parseResult = reactive<ParseResult>({
  success: false,
  playUrl: '',
  apiName: '',
  platform: '',
  parseTime: '',
  duration: 0
});

// URL检测结果
const urlDetection = reactive({
  platform: '',
  recommendedApi: ''
});

// 统计信息
const stats = reactive({
  todayParsed: 0,
  successRate: 0,
  favoriteCount: 0,
  availableApis: 0
});

// 设置
const settings = reactive({
  autoDetectPlatform: true,
  autoParseOnInput: false,
  saveHistory: true,
  maxHistoryCount: 50,
  defaultApiId: ''
});

// 热门平台
const popularPlatforms = ref([
  { name: '爱奇艺', url: 'https://www.iqiyi.com/', icon: 'VideoPlay', color: '#00be06' },
  { name: '腾讯视频', url: 'https://v.qq.com/', icon: 'VideoPlay', color: '#ff6600' },
  { name: '优酷', url: 'https://www.youku.com/', icon: 'VideoPlay', color: '#3faaf5' },
  { name: '芒果TV', url: 'https://www.mgtv.com/', icon: 'VideoPlay', color: '#ff6a00' },
  { name: '搜狐视频', url: 'https://tv.sohu.com/', icon: 'VideoPlay', color: '#db282d' },
  { name: '哔哩哔哩', url: 'https://www.bilibili.com/', icon: 'VideoPlay', color: '#00a1d6' }
]);

// 计算属性
const recentHistory = computed(() => {
  return parseHistory.value.slice(0, 5);
});

/**
 * 加载解析接口列表
 */
const loadParseApis = async () => {
  try {
    const response = await getParseApiList();
    if (response.code === 1000) {
      parseApis.value = response.data;
      stats.availableApis = response.data.filter(api => api.status === 'active').length;
      
      // 设置默认接口
      if (!parseForm.apiId && parseApis.value.length > 0) {
        const defaultApi = parseApis.value.find(api => api.isDefault) || parseApis.value[0];
        parseForm.apiId = defaultApi.id;
      }
    }
  } catch (error) {
    console.error('加载解析接口失败:', error);
    ElMessage.error('加载解析接口失败');
  }
};

/**
 * 加载解析历史
 */
const loadParseHistory = async () => {
  try {
    const response = await getParseHistory();
    if (response.code === 1000) {
      parseHistory.value = response.data;
    }
  } catch (error) {
    console.error('加载解析历史失败:', error);
  }
};

/**
 * 加载统计信息
 */
const loadStats = async () => {
  try {
    const response = await getParseStats();
    if (response.code === 1000) {
      Object.assign(stats, response.data);
    }
  } catch (error) {
    console.error('加载统计信息失败:', error);
  }
};

/**
 * 处理URL输入
 */
const handleUrlInput = () => {
  if (settings.autoDetectPlatform && parseForm.url) {
    detectPlatform(parseForm.url);
  }
  
  if (settings.autoParseOnInput && parseForm.url && parseForm.apiId) {
    // 防抖处理
    clearTimeout(window.parseTimeout);
    window.parseTimeout = setTimeout(() => {
      parseVideo();
    }, 1000);
  }
};

/**
 * 检测视频平台
 */
const detectPlatform = (url: string) => {
  let platform = '';
  let recommendedApi = '';
  
  if (url.includes('iqiyi.com')) {
    platform = '爱奇艺';
    recommendedApi = '爱奇艺专用接口';
  } else if (url.includes('v.qq.com')) {
    platform = '腾讯视频';
    recommendedApi = '腾讯视频专用接口';
  } else if (url.includes('youku.com')) {
    platform = '优酷';
    recommendedApi = '优酷专用接口';
  } else if (url.includes('mgtv.com')) {
    platform = '芒果TV';
    recommendedApi = '芒果TV专用接口';
  } else if (url.includes('bilibili.com')) {
    platform = '哔哩哔哩';
    recommendedApi = 'B站专用接口';
  } else if (url.includes('tv.sohu.com')) {
    platform = '搜狐视频';
    recommendedApi = '搜狐专用接口';
  } else {
    platform = '未知平台';
    recommendedApi = '通用接口';
  }
  
  urlDetection.platform = platform;
  urlDetection.recommendedApi = recommendedApi;
  
  // 自动选择推荐接口
  const recommendedApiInfo = parseApis.value.find(api => 
    api.name.includes(recommendedApi.replace('接口', '')) && api.status === 'active'
  );
  if (recommendedApiInfo) {
    parseForm.apiId = recommendedApiInfo.id;
  }
};

/**
 * 粘贴URL
 */
const pasteUrl = async () => {
  try {
    const text = await navigator.clipboard.readText();
    parseForm.url = text;
    handleUrlInput();
    ElMessage.success('粘贴成功');
  } catch (error) {
    ElMessage.error('粘贴失败，请手动输入');
  }
};

/**
 * 解析视频
 */
const parseVideo = async () => {
  if (!parseFormRef.value) return;
  
  const valid = await parseFormRef.value.validate().catch(() => false);
  if (!valid) return;
  
  parsing.value = true;
  const startTime = Date.now();
  
  try {
    const request: ParseRequest = {
      url: parseForm.url,
      apiId: parseForm.apiId
    };
    
    const response = await parseVideoUrl(request);
    
    if (response.code === 1000) {
      const duration = Date.now() - startTime;
      const selectedApi = parseApis.value.find(api => api.id === parseForm.apiId);
      
      Object.assign(parseResult, {
        success: true,
        playUrl: response.data.playUrl,
        apiName: selectedApi?.name || '未知接口',
        platform: urlDetection.platform || '未知平台',
        parseTime: new Date().toLocaleString(),
        duration
      });
      
      // 添加到历史记录
      if (settings.saveHistory) {
        const historyItem: ParseHistory = {
          id: Date.now().toString(),
          title: response.data.title || '未知视频',
          originalUrl: parseForm.url,
          playUrl: response.data.playUrl,
          platform: urlDetection.platform || '未知平台',
          apiName: selectedApi?.name || '未知接口',
          parseTime: new Date().toLocaleString()
        };
        
        await addParseHistory(historyItem);
        parseHistory.value.unshift(historyItem);
        
        // 限制历史记录数量
        if (parseHistory.value.length > settings.maxHistoryCount) {
          parseHistory.value = parseHistory.value.slice(0, settings.maxHistoryCount);
        }
      }
      
      ElMessage.success('解析成功！');
    } else {
      ElMessage.error(response.message || '解析失败');
    }
  } catch (error) {
    console.error('解析失败:', error);
    ElMessage.error('解析失败，请尝试更换解析接口');
  } finally {
    parsing.value = false;
  }
};

/**
 * 重置表单
 */
const resetForm = () => {
  parseForm.url = '';
  parseForm.apiId = settings.defaultApiId || (parseApis.value[0]?.id || '');
  Object.assign(parseResult, {
    success: false,
    playUrl: '',
    apiName: '',
    platform: '',
    parseTime: '',
    duration: 0
  });
  Object.assign(urlDetection, {
    platform: '',
    recommendedApi: ''
  });
};

/**
 * 从历史记录选择
 */
const selectFromHistory = (item: ParseHistory) => {
  parseForm.url = item.originalUrl;
  handleUrlInput();
};

/**
 * 处理接口变化
 */
const handleApiChange = () => {
  // 接口变化时可以做一些处理
};

/**
 * 切换全屏
 */
const toggleFullscreen = () => {
  const iframe = document.getElementById('video-player-iframe');
  if (!iframe) return;
  
  if (!fullscreen.value) {
    if (iframe.requestFullscreen) {
      iframe.requestFullscreen();
    }
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  }
};

/**
 * 复制播放链接
 */
const copyPlayUrl = async () => {
  try {
    await navigator.clipboard.writeText(parseResult.playUrl);
    ElMessage.success('播放链接已复制到剪贴板');
  } catch (error) {
    ElMessage.error('复制失败');
  }
};

/**
 * 新窗口打开
 */
const openInNewTab = () => {
  window.open(parseResult.playUrl, '_blank');
};

/**
 * 添加到收藏
 */
const addToFavorites = () => {
  // TODO: 实现收藏功能
  ElMessage.success('已添加到收藏');
};

/**
 * 打开平台
 */
const openPlatform = (url: string) => {
  window.open(url, '_blank');
};

/**
 * 检测接口状态
 */
const checkApiStatus = async () => {
  ElMessage.info('正在检测接口状态...');
  
  try {
    const promises = parseApis.value.map(async (api) => {
      try {
        const startTime = Date.now();
        await testParseApi(api.id);
        const duration = Date.now() - startTime;
        api.status = 'active';
        api.speed = duration;
      } catch (error) {
        api.status = 'inactive';
        api.speed = 9999;
      }
    });
    
    await Promise.all(promises);
    
    stats.availableApis = parseApis.value.filter(api => api.status === 'active').length;
    ElMessage.success('接口状态检测完成');
  } catch (error) {
    ElMessage.error('接口状态检测失败');
  }
};

/**
 * 从历史记录重播
 */
const replayFromHistory = (item: ParseHistory) => {
  parseForm.url = item.originalUrl;
  const api = parseApis.value.find(api => api.name === item.apiName);
  if (api) {
    parseForm.apiId = api.id;
  }
  parseVideo();
  showHistoryDialog.value = false;
};

/**
 * 复制历史记录URL
 */
const copyHistoryUrl = async (item: ParseHistory) => {
  try {
    await navigator.clipboard.writeText(item.playUrl);
    ElMessage.success('播放链接已复制到剪贴板');
  } catch (error) {
    ElMessage.error('复制失败');
  }
};

/**
 * 删除历史记录项
 */
const deleteHistoryItem = (index: number) => {
  parseHistory.value.splice(index, 1);
  ElMessage.success('删除成功');
};

/**
 * 导出历史记录
 */
const exportHistory = () => {
  const data = parseHistory.value.map(item => ({
    标题: item.title,
    原始链接: item.originalUrl,
    播放链接: item.playUrl,
    视频平台: item.platform,
    解析接口: item.apiName,
    解析时间: item.parseTime
  }));
  
  const csv = convertToCSV(data);
  downloadCSV(csv, 'parse-history.csv');
  
  ElMessage.success('导出成功');
};

/**
 * 清空历史记录
 */
const clearHistory = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要清空所有解析历史吗？',
      '确认清空',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    );
    
    await clearParseHistory();
    parseHistory.value = [];
    ElMessage.success('清空成功');
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('清空失败');
    }
  }
};

/**
 * 保存设置
 */
const saveSettings = () => {
  localStorage.setItem('video-parse-settings', JSON.stringify(settings));
  showSettingsDialog.value = false;
  ElMessage.success('设置已保存');
};

/**
 * 转换为CSV
 */
const convertToCSV = (data: any[]) => {
  if (data.length === 0) return '';
  
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(header => `"${row[header]}"`).join(','))
  ].join('\n');
  
  return csvContent;
};

/**
 * 下载CSV
 */
const downloadCSV = (csv: string, filename: string) => {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// 监听全屏变化
document.addEventListener('fullscreenchange', () => {
  fullscreen.value = !!document.fullscreenElement;
});

// 组件挂载
onMounted(() => {
  // 加载设置
  const savedSettings = localStorage.getItem('video-parse-settings');
  if (savedSettings) {
    try {
      Object.assign(settings, JSON.parse(savedSettings));
    } catch (error) {
      console.error('加载设置失败:', error);
    }
  }
  
  loadParseApis();
  loadParseHistory();
  loadStats();
});
</script>

<style scoped>
.video-parse {
  padding: 24px;
  background-color: #f5f5f5;
  min-height: 100vh;
}

.stat-card {
  transition: transform 0.2s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
}

.parse-card,
.player-card,
.platform-card,
.api-status-card,
.guide-card {
  transition: all 0.3s ease;
}

.parse-card:hover,
.player-card:hover,
.platform-card:hover,
.api-status-card:hover,
.guide-card:hover {
  transform: translateY(-2px);
}

.platform-item {
  transition: all 0.3s ease;
}

.platform-item:hover {
  transform: translateY(-2px);
}

.player-container {
  position: relative;
  width: 100%;
  height: 0;
  padding-bottom: 56.25%; /* 16:9 比例 */
  overflow: hidden;
  border-radius: 8px;
}

.player-iframe {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border: none;
}

.url-detection {
  border-left: 3px solid #409eff;
}

.recent-history .el-tag {
  margin-right: 8px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.recent-history .el-tag:hover {
  transform: translateY(-1px);
}

.api-item {
  transition: all 0.3s ease;
}

.api-item:hover {
  background-color: #f8f9fa;
}

.status-dot {
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
  100% {
    opacity: 1;
  }
}

.history-item {
  transition: all 0.3s ease;
}

.history-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.step-item {
  transition: all 0.3s ease;
}

.step-number {
  flex-shrink: 0;
}

@media (max-width: 768px) {
  .video-parse {
    padding: 16px;
  }
  
  .grid {
    grid-template-columns: 1fr;
  }
  
  .lg\:col-span-2 {
    grid-column: span 1;
  }
  
  .platform-grid {
    grid-template-columns: 1fr;
  }
  
  .form-actions {
    flex-direction: column;
    align-items: stretch;
  }
  
  .form-actions .el-button {
    margin-bottom: 8px;
  }
}
</style>