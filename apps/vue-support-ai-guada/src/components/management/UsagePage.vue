<template>
  <div class="h-full overflow-auto bg-gray-50 dark:bg-[#1a1a1a] p-6">
    <!-- 页面头部 -->
    <div class="mb-6">
      <h1 class="text-xl font-bold text-gray-900 dark:text-[#e8e9ed]">用量管理</h1>
      <p class="text-sm text-gray-500 dark:text-[#8b8d95] mt-1">查看和管理API用量统计</p>
    </div>

    <!-- 顶部统计卡片 -->
    <div class="grid grid-cols-4 gap-4 mb-6">
      <!-- 总请求数 -->
      <div class="bg-white dark:bg-[#2a2a2a] rounded-xl p-5 shadow-sm border border-gray-100 dark:border-[#3a3a3a]">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
            <svg class="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <div class="text-sm text-gray-500 dark:text-[#8b8d95]">总请求数</div>
            <div class="text-2xl font-bold text-gray-900 dark:text-[#e8e9ed]">{{ stats.totalCalls || 0 }}</div>
            <div class="text-xs text-gray-400">所选范围内</div>
          </div>
        </div>
      </div>

      <!-- 总 Token -->
      <div class="bg-white dark:bg-[#2a2a2a] rounded-xl p-5 shadow-sm border border-gray-100 dark:border-[#3a3a3a]">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center">
            <svg class="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <div>
            <div class="text-sm text-gray-500 dark:text-[#8b8d95]">总 Token</div>
            <div class="text-2xl font-bold text-gray-900 dark:text-[#e8e9ed]">{{ formatTokens(stats.totalTokens) }}</div>
            <div class="text-xs text-gray-400">输入: {{ formatTokens(stats.totalPromptTokens) }} / 输出: {{ formatTokens(stats.totalCompletionTokens) }}</div>
          </div>
        </div>
      </div>

      <!-- 总消费 -->
      <div class="bg-white dark:bg-[#2a2a2a] rounded-xl p-5 shadow-sm border border-gray-100 dark:border-[#3a3a3a]">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-green-50 dark:bg-green-900/30 flex items-center justify-center">
            <svg class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <div class="text-sm text-gray-500 dark:text-[#8b8d95]">总消费</div>
            <div class="text-2xl font-bold text-green-600">¥{{ stats.totalCost || '0.00' }}</div>
            <div class="text-xs text-gray-400">标准定价</div>
          </div>
        </div>
      </div>

      <!-- 平均耗时 -->
      <div class="bg-white dark:bg-[#2a2a2a] rounded-xl p-5 shadow-sm border border-gray-100 dark:border-[#3a3a3a]">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center">
            <svg class="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <div class="text-sm text-gray-500 dark:text-[#8b8d95]">平均耗时</div>
            <div class="text-2xl font-bold text-gray-900 dark:text-[#e8e9ed]">{{ stats.avgLatency || '0' }}s</div>
            <div class="text-xs text-gray-400">平均响应时间</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 时间范围选择 -->
    <div class="bg-white dark:bg-[#2a2a2a] rounded-xl p-4 shadow-sm border border-gray-100 dark:border-[#3a3a3a] mb-6">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <span class="text-sm text-gray-600 dark:text-[#b0b0b0]">时间范围:</span>
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            style="width: 280px"
            @change="loadData"
          />
        </div>
        <div class="flex items-center gap-2">
          <el-button type="primary" @click="handleSync">
            <el-icon><Refresh /></el-icon>
            手动同步
          </el-button>
          <el-button @click="handleExport">
            <el-icon><Download /></el-icon>
            导出CSV
          </el-button>
        </div>
      </div>
    </div>

    <!-- 图表区域 -->
    <div class="grid grid-cols-2 gap-4 mb-6">
      <!-- 模型分布 -->
      <div class="bg-white dark:bg-[#2a2a2a] rounded-xl p-5 shadow-sm border border-gray-100 dark:border-[#3a3a3a]">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-base font-semibold text-gray-900 dark:text-[#e8e9ed]">模型分布</h3>
          <div class="flex gap-2">
            <el-radio-group v-model="modelChartType" size="small">
              <el-radio-button value="token">按 Token</el-radio-button>
              <el-radio-button value="cost">按实际消费</el-radio-button>
            </el-radio-group>
          </div>
        </div>
        <div class="flex items-center gap-6">
          <!-- 环形图占位 -->
          <div class="w-40 h-40 rounded-full border-8 border-blue-500 flex items-center justify-center">
            <div class="text-center">
              <div class="text-2xl font-bold text-gray-900 dark:text-[#e8e9ed]">{{ modelDistribution.length }}</div>
              <div class="text-xs text-gray-500">个模型</div>
            </div>
          </div>
          <!-- 表格 -->
          <div class="flex-1 overflow-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="text-gray-500 text-left">
                  <th class="pb-2">模型</th>
                  <th class="pb-2 text-right">请求</th>
                  <th class="pb-2 text-right">Token</th>
                  <th class="pb-2 text-right">实际</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in modelDistribution" :key="item.model" class="border-t border-gray-100 dark:border-[#3a3a3a]">
                  <td class="py-2 text-gray-900 dark:text-[#e8e9ed]">{{ item.model }}</td>
                  <td class="py-2 text-right text-gray-600">{{ item.calls }}</td>
                  <td class="py-2 text-right text-gray-600">{{ formatTokens(item.tokens) }}</td>
                  <td class="py-2 text-right text-green-600">¥{{ item.cost }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- 分组使用分布 -->
      <div class="bg-white dark:bg-[#2a2a2a] rounded-xl p-5 shadow-sm border border-gray-100 dark:border-[#3a3a3a]">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-base font-semibold text-gray-900 dark:text-[#e8e9ed]">分组使用分布</h3>
          <div class="flex gap-2">
            <el-radio-group v-model="groupChartType" size="small">
              <el-radio-button value="token">按 Token</el-radio-button>
              <el-radio-button value="cost">按实际消费</el-radio-button>
            </el-radio-group>
          </div>
        </div>
        <div class="flex items-center gap-6">
          <!-- 环形图占位 -->
          <div class="w-40 h-40 rounded-full border-8 border-blue-500 flex items-center justify-center">
            <div class="text-center">
              <div class="text-2xl font-bold text-gray-900 dark:text-[#e8e9ed]">{{ groupDistribution.length }}</div>
              <div class="text-xs text-gray-500">个分组</div>
            </div>
          </div>
          <!-- 表格 -->
          <div class="flex-1 overflow-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="text-gray-500 text-left">
                  <th class="pb-2">分组</th>
                  <th class="pb-2 text-right">请求</th>
                  <th class="pb-2 text-right">Token</th>
                  <th class="pb-2 text-right">实际</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in groupDistribution" :key="item.group" class="border-t border-gray-100 dark:border-[#3a3a3a]">
                  <td class="py-2 text-gray-900 dark:text-[#e8e9ed]">{{ item.group }}</td>
                  <td class="py-2 text-right text-gray-600">{{ item.calls }}</td>
                  <td class="py-2 text-right text-gray-600">{{ formatTokens(item.tokens) }}</td>
                  <td class="py-2 text-right text-green-600">¥{{ item.cost }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- Token 使用趋势 -->
    <div class="bg-white dark:bg-[#2a2a2a] rounded-xl p-5 shadow-sm border border-gray-100 dark:border-[#3a3a3a]">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-base font-semibold text-gray-900 dark:text-[#e8e9ed]">Token 使用趋势</h3>
        <div class="flex items-center gap-4 text-sm">
          <span class="flex items-center gap-1">
            <span class="w-3 h-3 rounded-full bg-blue-500"></span>
            Input
          </span>
          <span class="flex items-center gap-1">
            <span class="w-3 h-3 rounded-full bg-green-500"></span>
            Output
          </span>
        </div>
      </div>
      <!-- 折线图占位 -->
      <div class="h-64 flex items-center justify-center text-gray-400">
        趋势图（待接入 ECharts）
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { Refresh, Download } from '@element-plus/icons-vue';
import { usageApi } from '@/services/javaApi';

const loading = ref(false);
const dateRange = ref<[Date, Date] | null>(null);
const modelChartType = ref('token');
const groupChartType = ref('token');

const stats = reactive({
  totalCalls: 0,
  totalTokens: 0,
  totalPromptTokens: 0,
  totalCompletionTokens: 0,
  totalCost: '0.00',
  avgLatency: '0',
});

const modelDistribution = ref<any[]>([]);
const groupDistribution = ref<any[]>([]);

// 格式化 Token 数量
function formatTokens(tokens: number): string {
  if (!tokens) return '0';
  if (tokens >= 1e9) return (tokens / 1e9).toFixed(2) + 'B';
  if (tokens >= 1e6) return (tokens / 1e6).toFixed(2) + 'M';
  if (tokens >= 1e3) return (tokens / 1e3).toFixed(2) + 'K';
  return tokens.toString();
}

async function loadData() {
  loading.value = true;
  try {
    const params: any = {};
    if (dateRange.value) {
      params.startDate = dateRange.value[0]?.toISOString().split('T')[0];
      params.endDate = dateRange.value[1]?.toISOString().split('T')[0];
    }

    // 加载统计
    try {
      const statRes: any = await usageApi.statistics(params);
      const statData = statRes?.data || statRes || {};
      stats.totalCalls = statData.totalCalls || 0;
      stats.totalTokens = statData.totalTokens || 0;
      stats.totalPromptTokens = statData.totalPromptTokens || 0;
      stats.totalCompletionTokens = statData.totalCompletionTokens || 0;
      stats.totalCost = statData.totalCost || '0.00';
      stats.avgLatency = statData.avgLatency || '0';
    } catch (e) {
      console.warn('统计加载失败', e);
    }

    // 加载模型分布
    try {
      const res: any = await usageApi.list(params);
      const data = res?.data || res?.records || res?.list || res || [];
      const records = Array.isArray(data) ? data : (data.records || data.list || []);
      
      // 按模型聚合
      const modelMap = new Map();
      records.forEach((r: any) => {
        const model = r.model || 'unknown';
        if (!modelMap.has(model)) {
          modelMap.set(model, { model, calls: 0, tokens: 0, cost: 0 });
        }
        const item = modelMap.get(model);
        item.calls += r.callCount || 0;
        item.tokens += r.totalTokens || 0;
        item.cost += parseFloat(r.cost || 0);
      });
      modelDistribution.value = Array.from(modelMap.values());

      // 按分组聚合
      const groupMap = new Map();
      records.forEach((r: any) => {
        const group = r.group || 'default';
        if (!groupMap.has(group)) {
          groupMap.set(group, { group, calls: 0, tokens: 0, cost: 0 });
        }
        const item = groupMap.get(group);
        item.calls += r.callCount || 0;
        item.tokens += r.totalTokens || 0;
        item.cost += parseFloat(r.cost || 0);
      });
      groupDistribution.value = Array.from(groupMap.values());
    } catch (e) {
      console.warn('列表加载失败', e);
    }
  } catch (e: any) {
    ElMessage.error(`加载失败: ${e.message}`);
  } finally {
    loading.value = false;
  }
}

async function handleSync() {
  try {
    await usageApi.sync();
    ElMessage.success('同步成功');
    loadData();
  } catch (e: any) {
    ElMessage.error(`同步失败: ${e.message}`);
  }
}

async function handleExport() {
  try {
    const res: any = await usageApi.export();
    const blob = new Blob([res], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `usage_${Date.now()}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  } catch (e: any) {
    ElMessage.error(`导出失败: ${e.message}`);
  }
}

onMounted(loadData);
</script>
