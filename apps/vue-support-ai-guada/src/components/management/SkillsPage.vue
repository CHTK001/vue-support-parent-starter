<template>
  <div class="h-full overflow-hidden flex flex-col bg-white dark:bg-[#1a1a1a]">
    <div class="shrink-0 px-6 py-4 border-b border-gray-200 dark:border-[#2f2f2f]">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-xl font-bold text-gray-900 dark:text-[#e8e9ed]">Skills管理</h1>
          <p class="text-sm text-gray-500 dark:text-[#8b8d95] mt-1">管理本地Skills和在线市场，支持扫描、安装、卸载</p>
        </div>
        <div class="flex items-center gap-2">
          <el-button type="primary" @click="handleScan">
            <el-icon><Search /></el-icon>
            扫描本地
          </el-button>
          <el-button @click="showMarket = true">
            <el-icon><Shop /></el-icon>
            在线市场
          </el-button>
          <el-button @click="loadData">
            <el-icon><Refresh /></el-icon>
            刷新
          </el-button>
        </div>
      </div>
    </div>

    <div class="flex-1 overflow-auto p-6">
      <el-table :data="tableData" v-loading="loading" stripe border style="width: 100%">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="名称" min-width="150" />
        <el-table-column prop="description" label="描述" min-width="200" />
        <el-table-column prop="version" label="版本" width="100" />
        <el-table-column prop="author" label="作者" width="120" />
        <el-table-column prop="source" label="来源" width="100">
          <template #default="{ row }">
            <el-tag :type="row.source === 'local' ? 'info' : 'success'" size="small">
              {{ row.source === 'local' ? '本地' : '市场' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="enabled" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.enabled ? 'success' : 'info'" size="small">
              {{ row.enabled ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleToggle(row)">
              {{ row.enabled ? '禁用' : '启用' }}
            </el-button>
            <el-button type="danger" link @click="handleUninstall(row)">卸载</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 在线市场弹窗 -->
    <el-dialog v-model="showMarket" title="Skills在线市场" width="800px" top="5vh">
      <div class="mb-4">
        <el-input
          v-model="marketKeyword"
          placeholder="搜索Skills..."
          clearable
          @keyup.enter="handleMarketSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
          <template #append>
            <el-button @click="handleMarketSearch">搜索</el-button>
          </template>
        </el-input>
      </div>
      <div v-loading="marketLoading" class="grid grid-cols-2 gap-4 max-h-[60vh] overflow-auto">
        <el-card v-for="item in marketList" :key="item.id" shadow="hover" class="market-card">
          <div class="flex items-start justify-between">
            <div>
              <h3 class="font-bold text-base">{{ item.name }}</h3>
              <p class="text-sm text-gray-500 mt-1">{{ item.description }}</p>
              <div class="flex items-center gap-2 mt-2 text-xs text-gray-400">
                <span>v{{ item.version }}</span>
                <span>·</span>
                <span>{{ item.author }}</span>
              </div>
            </div>
            <el-button type="primary" size="small" @click="handleInstall(item)">安装</el-button>
          </div>
        </el-card>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Search, Refresh, Shop } from '@element-plus/icons-vue';
import { skillsApi } from '@/services/javaApi';

const loading = ref(false);
const tableData = ref<any[]>([]);
const showMarket = ref(false);
const marketLoading = ref(false);
const marketKeyword = ref('');
const marketList = ref<any[]>([]);

async function loadData() {
  loading.value = true;
  try {
    const res: any = await skillsApi.list();
    tableData.value = res?.data || res?.records || res || [];
  } catch (e: any) {
    ElMessage.error(`加载失败: ${e.message}`);
  } finally {
    loading.value = false;
  }
}

async function handleScan() {
  try {
    await skillsApi.scan();
    ElMessage.success('扫描完成');
    loadData();
  } catch (e: any) {
    ElMessage.error(`扫描失败: ${e.message}`);
  }
}

function handleToggle(row: any) {
  row.enabled = !row.enabled;
  ElMessage.success(row.enabled ? '已启用' : '已禁用');
}

async function handleUninstall(row: any) {
  try {
    await ElMessageBox.confirm(`确定要卸载「${row.name}」吗？`, '卸载确认', { type: 'warning' });
    await skillsApi.uninstall(row.id);
    ElMessage.success('卸载成功');
    loadData();
  } catch (e: any) {
    if (e !== 'cancel') ElMessage.error(`卸载失败: ${e.message}`);
  }
}

async function handleMarketSearch() {
  if (!marketKeyword.value) {
    ElMessage.warning('请输入搜索关键词');
    return;
  }
  marketLoading.value = true;
  try {
    const res: any = await skillsApi.marketSearch(marketKeyword.value);
    marketList.value = res?.data || res || [];
  } catch (e: any) {
    ElMessage.error(`搜索失败: ${e.message}`);
  } finally {
    marketLoading.value = false;
  }
}

async function handleInstall(item: any) {
  try {
    await skillsApi.install({ id: item.id, name: item.name });
    ElMessage.success('安装成功');
    loadData();
  } catch (e: any) {
    ElMessage.error(`安装失败: ${e.message}`);
  }
}

onMounted(loadData);
</script>

<style scoped>
.market-card {
  border-radius: 12px;
  transition: all 0.2s;
}
.market-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}
</style>
