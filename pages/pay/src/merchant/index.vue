<template>
  <div class="merchant-page">
    <div class="merchant-header">
      <div class="left">
        <iconifyIconOnline icon="ri:store-2-fill" width="18" />
        <span class="title">商户管理</span>
      </div>
      <div class="right">
        <el-form :inline="true" :model="form">
          <el-form-item label="商户名称">
            <el-input v-model="form.payMerchantName" placeholder="请输入商户名称" clearable @keyup.enter="handleRefresh" />
          </el-form-item>
          <el-form-item>
            <el-button @click="handleRefresh">
              <iconifyIconOnline icon="ep:refresh" />
            </el-button>
            <el-button type="primary" @click="handleOpen('add', {})">
              <iconifyIconOnline icon="ep:plus" />
              新增商户
            </el-button>
          </el-form-item>
        </el-form>
      </div>
    </div>

    <ScTable ref="tableRef" layout="card" :col-size="3" :row-size="2" :url="fetchPageMerchant" :params="form" class="merchant-table" @data-loaded="handleDataLoaded">
      <template #default="{ row }">
        <el-card shadow="hover" class="w-full">
          <template #header>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <iconifyIconOnline icon="ri:store-2-fill" />
                <el-tag effect="plain">{{ row.payMerchantName }}</el-tag>
                <el-text type="info">#{{ row.payMerchantCode }}</el-text>
              </div>
              <div class="flex items-center gap-2">
                <el-switch v-model="row.payMerchantStatus" :active-value="1" :inactive-value="0" @change="() => onToggle(row)" />
                <el-button size="small" @click.stop="handleSetting(row)"><iconifyIconOnline icon="ri:settings-2-line" />设置</el-button>
                <el-button size="small" @click.stop="handleOpen('edit', row)"><iconifyIconOnline icon="ep:edit" />编辑</el-button>
                <el-popconfirm title="确认删除该商户？" @confirm="onDelete(row)">
                  <template #reference>
                    <el-button size="small" type="danger"><iconifyIconOnline icon="ep:delete" />删除</el-button>
                  </template>
                </el-popconfirm>
              </div>
            </div>
          </template>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-4">
              <div class="flex items-center gap-2">
                <el-text>钱包</el-text>
                <el-switch v-model="row.payMerchantOpenWallet" :active-value="1" :inactive-value="0" @change="() => onToggle(row)" />
              </div>
              <div class="flex items-center gap-2">
                <el-text>订单超时</el-text>
                <el-switch v-model="row.payMerchantOpenTimeout" :active-value="1" :inactive-value="0" @change="() => onToggle(row)" />
                <template v-if="row.payMerchantOpenTimeout === 1">
                  <el-input-number v-model="row.payMerchantOpenTimeoutTime" :min="1" :max="1440" size="small" @change="() => onToggle(row)" />
                  <el-tag effect="plain">min</el-tag>
                </template>
              </div>
            </div>
            <el-text type="info">创建时间：{{ row.createTime || '-' }}</el-text>
          </div>
        </el-card>
      </template>
    </ScTable>

    <SaveDialog ref="saveDialogRef" @success="handleRefresh" />
    <SettingDialog ref="settingDialogRef" @updated="handleRefresh" />
  </div>
</template>

<script setup lang="ts">
import { defineAsyncComponent, nextTick, reactive, ref, defineExpose, watch } from 'vue'
import { fetchPageMerchant, fetchDeleteMerchant, fetchUpdateMerchant } from '../api/merchant'

const SaveDialog = defineAsyncComponent(() => import('./save.vue'))
const SettingDialog = defineAsyncComponent(() => import('./setting.vue'))

const tableRef = ref()
const saveDialogRef = ref()
const settingDialogRef = ref()
const total = ref(0)

const form = reactive<any>({})

const handleDataLoaded = (data: any, _total: number) => {
  total.value = _total
}

const handleOpen = (type: 'add' | 'edit', row: any) => {
  nextTick(() => {
    saveDialogRef.value?.handleOpen(type, row)
  })
}

const handleSetting = (row: any) => {
  nextTick(() => {
    settingDialogRef.value?.open(row)
  })
}

const handleRefresh = () => {
  tableRef.value?.reload(form)
}

const onToggle = (row: any) => {
  fetchUpdateMerchant({
    payMerchantId: row.payMerchantId,
    payMerchantStatus: row.payMerchantStatus,
    payMerchantOpenWallet: row.payMerchantOpenWallet,
    payMerchantOpenTimeout: row.payMerchantOpenTimeout,
    payMerchantOpenTimeoutTime: row.payMerchantOpenTimeoutTime,
  }).then(() => handleRefresh())
}

const onDelete = (row: any) => {
  fetchDeleteMerchant(row).then(() => handleRefresh())
}

// defineExpose 和 watch 必须放在最后（遵循项目规则）

defineExpose({ handleRefresh })

watch(form, () => {}, { deep: true })
</script>

<style scoped>
.merchant-page { padding: 8px; }
.merchant-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.title { font-weight: 600; margin-left: 6px; }
.merchant-table { --el-table-row-hover-bg-color: var(--el-fill-color-lighter); }
</style>