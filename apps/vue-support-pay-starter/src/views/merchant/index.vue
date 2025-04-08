<script setup>
import { fetchPageMerchant, fetchDeleteMerchant, fetchUpdateMerchant, fetchStatisticMerchant } from "@/api/merchant";
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import { defineAsyncComponent, nextTick, onMounted, reactive, ref, shallowRef } from "vue";

const SaveDialog = defineAsyncComponent(() => import("./save.vue"));
const SettingDialog = defineAsyncComponent(() => import("./setting.vue"));
const saveDialogRef = ref();
const settingDialogRef = ref();
const tableRef = ref();
const total = ref(0);

// 统计数据
const statisticData = ref({
  totalCount: 0,
  enabledCount: 0,
  walletEnabledCount: 0,
});

const form = reactive({});

// 加载统计数据
const loadStatisticData = () => {
  fetchStatisticMerchant()
    .then(({ data }) => {
      if (data) {
        statisticData.value = data;
      }
    })
    .catch((error) => {
      console.error("获取统计数据失败", error);
    });
};

const handleDataLoaded = async (data, _total) => {
  total.value = _total;
  // 重新加载统计数据
  await loadStatisticData();
};

const handleSetting = async (row) => {
  nextTick(() => {
    settingDialogRef.value.handleOpen(row);
  });
};

const handleUpdate = async (row, type) => {
  nextTick(() => {
    saveDialogRef.value.handleOpen(type, row);
  });
};

const handleDelete = async (row) => {
  fetchDeleteMerchant({ payMerchantId: row.payMerchantId }).then((res) => {
    message("删除成功", { type: "success" });
    tableRef.value.reload();
  });
};

const handleRefresh = () => {
  tableRef.value?.reload(form);
};

// 初始加载统计数据
onMounted(() => {
  loadStatisticData();
});
</script>

<style scoped>
.merchant-header {
  background-color: #fff;
  border-left: 4px solid #4091f7;
  transition: all 0.3s;
  animation: fadeIn 0.5s ease-in-out;
}

.merchant-header:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.header-title {
  color: #333;
}

.merchant-container {
  height: calc(100% - 320px);
  animation: slideUp 0.5s ease-in-out;
}

.merchant-table {
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

.merchant-tag {
  font-weight: 600;
}

.add-button,
.refresh-button {
  transition: all 0.3s;
  border-radius: 4px;
}

.add-button:hover,
.refresh-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(64, 145, 247, 0.3);
}

.refresh-button:hover {
  animation: spin 1s ease-in-out;
}

.status-switch,
.wallet-switch {
  transition: opacity 0.3s;
}

.status-switch:hover,
.wallet-switch:hover {
  opacity: 0.8;
}

/* 统计卡片样式 */
.merchant-stats {
  animation: fadeIn 0.8s ease-in-out;
}

.stat-card {
  transition: all 0.3s ease;
  border-left: 3px solid transparent;
}

.stat-card:nth-child(1) {
  border-left-color: #4091f7;
  animation: slideRight 0.5s ease-in-out;
}

.stat-card:nth-child(2) {
  border-left-color: #13ce66;
  animation: slideRight 0.5s ease-in-out 0.1s;
}

.stat-card:nth-child(3) {
  border-left-color: #9333ea;
  animation: slideRight 0.5s ease-in-out 0.2s;
}

.stat-card:nth-child(4) {
  border-left-color: #f59e0b;
  animation: slideRight 0.5s ease-in-out 0.3s;
}

.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
}

.stat-icon {
  transition: all 0.3s;
}

.stat-card:hover .stat-icon {
  transform: scale(1.1);
}

/* 表格行悬停效果 */
:deep(.el-table__row) {
  transition: all 0.3s;
}

:deep(.el-table__row:hover) {
  background-color: #f0f7ff !important;
  transform: translateY(-2px);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

/* 按钮悬停效果 */
:deep(.btn-text) {
  transition: all 0.3s;
}

:deep(.btn-text:hover) {
  transform: scale(1.2);
}

/* 动画关键帧 */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@keyframes slideRight {
  from {
    transform: translateX(-20px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>

<template>
  <div class="main background-color w-full h-full">
    <SettingDialog ref="settingDialogRef" />
    <SaveDialog ref="saveDialogRef" />
    <div class="merchant-header p-4 mb-4 rounded-lg shadow-sm flex justify-between items-center">
      <div class="header-title">
        <h2 class="text-xl font-bold flex items-center">
          <el-icon class="mr-2"><component :is="useRenderIcon('ri:store-2-fill')" /></el-icon>
          商户管理
        </h2>
        <p class="text-gray-500 text-sm mt-1">管理支付商户信息及配置</p>
      </div>
      <div class="flex items-center gap-4">
        <el-form :model="form" :inline="true" class="search-form">
          <el-form-item label="商户名称" prop="">
            <el-input v-model="form.payMerchantName" placeholder="请输入商户名称" clearable class="!w-[220px]" prefix-icon="ep:search" @keyup.enter="handleRefresh" />
          </el-form-item>

          <el-form-item>
            <div class="flex gap-2">
              <el-tooltip content="刷新数据" placement="top">
                <el-button type="info" circle class="refresh-button" :icon="useRenderIcon('ep:refresh')" @click="handleRefresh" />
              </el-tooltip>
              <el-button type="primary" class="add-button" :icon="useRenderIcon('ep:plus')" @click="handleUpdate({}, 'add')"> 添加商户 </el-button>
            </div>
          </el-form-item>
        </el-form>
      </div>
    </div>

    <!-- 统计卡片区域 -->
    <div class="merchant-stats grid grid-cols-4 gap-4 mb-4">
      <div class="stat-card bg-white rounded-lg p-4 shadow-sm flex items-center">
        <div class="stat-icon p-3 rounded-lg mr-3 bg-blue-50">
          <el-icon class="text-blue-500 text-xl"><component :is="useRenderIcon('ep:shop')" /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-title text-gray-500 text-sm">商户总数</div>
          <div class="stat-value text-xl font-bold">{{ statisticData.totalCount || 0 }}</div>
        </div>
      </div>

      <div class="stat-card bg-white rounded-lg p-4 shadow-sm flex items-center">
        <div class="stat-icon p-3 rounded-lg mr-3 bg-green-50">
          <el-icon class="text-green-500 text-xl"><component :is="useRenderIcon('ep:checked')" /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-title text-gray-500 text-sm">已启用商户</div>
          <div class="stat-value text-xl font-bold">{{ statisticData.enabledCount || 0 }}</div>
        </div>
      </div>

      <div class="stat-card bg-white rounded-lg p-4 shadow-sm flex items-center">
        <div class="stat-icon p-3 rounded-lg mr-3 bg-purple-50">
          <el-icon class="text-purple-500 text-xl"><component :is="useRenderIcon('ri:wallet-3-fill')" /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-title text-gray-500 text-sm">钱包已开启</div>
          <div class="stat-value text-xl font-bold">{{ statisticData.walletEnabledCount || 0 }}</div>
        </div>
      </div>

      <div class="stat-card bg-white rounded-lg p-4 shadow-sm flex items-center">
        <div class="stat-icon p-3 rounded-lg mr-3 bg-amber-50">
          <el-icon class="text-amber-500 text-xl"><component :is="useRenderIcon('ri:settings-2-line')" /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-title text-gray-500 text-sm">配置管理</div>
          <div class="stat-value text-xl font-bold flex items-center">
            <el-button type="text" class="p-0 text-amber-500 font-bold" @click="handleUpdate({}, 'add')">添加配置</el-button>
          </div>
        </div>
      </div>
    </div>

    <el-container class="merchant-container">
      <ScTable ref="tableRef" :url="fetchPageMerchant" :params="form" :border="false" :stripe="true" class="merchant-table w-full" @data-loaded="handleDataLoaded">
        <el-table-column label="商户名称" prop="payMerchantName" align="left" fixed min-width="120">
          <template #default="{ row }">
            <el-tag effect="plain" class="merchant-tag">{{ row.payMerchantName }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="商户号" prop="payMerchantCode" min-width="120" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="flex gap-2">
              <el-text>
                {{ row.payMerchantCode }}
              </el-text>
              <iconifyIconOnline icon="ep:document-copy" class="cursor-pointer mt-[4px] z-[10px]" v-copy:click="row.payMerchantCode" />
            </span>
          </template>
        </el-table-column>
        <el-table-column label="是否开启" prop="payMerchantStatus" min-width="120" align="center">
          <template #default="{ row }">
            <el-segmented
              @change="fetchUpdateMerchant(row)"
              v-model="row.payMerchantStatus"
              :options="[
                {
                  value: 1,
                  label: '开启',
                },
                {
                  value: 0,
                  label: '关闭',
                },
              ]"
            ></el-segmented>
          </template>
        </el-table-column>
        <el-table-column label="是否开启钱包" prop="payMerchantOpenWallet" min-width="120" align="center">
          <template #default="{ row }">
            <el-segmented
              @change="fetchUpdateMerchant(row)"
              v-model="row.payMerchantOpenWallet"
              :options="[
                {
                  value: true,
                  label: '开启',
                },
                {
                  value: false,
                  label: '关闭',
                },
              ]"
            ></el-segmented>
          </template>
        </el-table-column>

        <el-table-column label="创建时间" min-width="150" show-overflow-tooltip>
          <template #default="{ row }">
            <div class="flex items-center">
              <el-icon class="mr-1"><component :is="useRenderIcon('ep:calendar')" /></el-icon>
              {{ row.createTime }}
            </div>
          </template>
        </el-table-column>

        <el-table-column label="操作" min-width="120" fixed="right">
          <template #default="{ row }">
            <div class="flex space-x-2">
              <el-tooltip content="编辑商户" placement="right">
                <el-button class="btn-text hover:text-blue-500" :icon="useRenderIcon('ep:edit')" @click="handleUpdate(row, 'edit')" />
              </el-tooltip>
              <el-tooltip content="商户设置" placement="right">
                <el-button class="btn-text hover:text-green-500" :icon="useRenderIcon('ri:settings-2-line')" @click="handleSetting(row)" />
              </el-tooltip>
              <el-tooltip content="删除商户" placement="right">
                <el-button type="danger" class="btn-text hover:text-red-500" :icon="useRenderIcon('ep:delete')" @click="handleDelete(row)" />
              </el-tooltip>
            </div>
          </template>
        </el-table-column>
      </ScTable>
    </el-container>
  </div>
</template>
