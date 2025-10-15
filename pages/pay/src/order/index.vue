<template>
  <div class="order-page">
    <div class="order-header">
      <div class="left">
        <iconifyIconOnline icon="ep:document" width="18" />
        <span class="title">订单管理</span>
      </div>
      <div class="right">
        <el-form :inline="true" :model="form" class="search-form">
          <el-form-item label="状态">
            <el-select v-model="form.payMerchantOrderStatus" placeholder="全部" clearable class="!w-[160px]">
              <el-option v-for="opt in statusOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
            </el-select>
          </el-form-item>
          <el-form-item label="商户">
            <el-select v-model="form.payMerchantId" filterable clearable placeholder="选择商户" class="!w-[200px]">
              <el-option v-for="m in merchants" :key="m.payMerchantId" :label="m.payMerchantName" :value="m.payMerchantId" />
            </el-select>
          </el-form-item>
          <el-form-item label="支付时间">
            <el-date-picker v-model="payTime" type="datetimerange" range-separator="至" start-placeholder="开始" end-placeholder="结束" @change="onPayTimeChange" />
          </el-form-item>
          <el-form-item label="完成时间">
            <el-date-picker v-model="finishTime" type="datetimerange" range-separator="至" start-placeholder="开始" end-placeholder="结束" @change="onFinishTimeChange" />
          </el-form-item>
          <el-form-item>
            <el-button @click="handleRefresh"><iconifyIconOnline icon="ep:refresh" />刷新</el-button>
          </el-form-item>
        </el-form>
      </div>
    </div>

    <ScTable ref="tableRef" :url="fetchPageOrder" :params="form" class="order-table" @data-loaded="onLoaded" :rowClick="handleRowClick">
      <el-table-column label="订单号" prop="payMerchantOrderCode" min-width="220" fixed>
        <template #default="{ row }">
          <span class="flex gap-2 items-center">
            <el-text>{{ row.payMerchantOrderCode }}</el-text>
            <iconifyIconOnline icon="ep:document-copy" class="cursor-pointer" v-copy:click="row.payMerchantOrderCode" />
          </span>
        </template>
      </el-table-column>
      <el-table-column label="商户" prop="payMerchantName" min-width="160" />
      <el-table-column label="金额" prop="payMerchantOrderAmount" width="120" />
      <el-table-column label="状态" prop="payMerchantOrderStatus" width="130">
        <template #default="{ row }">
          <el-tag :type="statusType(row.payMerchantOrderStatus)">{{ statusLabel(row.payMerchantOrderStatus) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="支付时间" prop="payMerchantOrderPayTime" min-width="170" />
      <el-table-column label="完成时间" prop="payMerchantOrderFinishedTime" min-width="170" />

      <el-table-column label="详情" width="120" align="center">
        <template #default="{ row }">
          <el-popover placement="bottom" trigger="click" width="420">
            <template #reference>
              <el-button text size="small"><iconifyIconOnline icon="ep:view" />查看</el-button>
            </template>
            <div class="grid grid-cols-2 gap-2 text-sm">
              <div><b>OpenID</b>：{{ row.payMerchantOrderOpenid || '-' }}</div>
              <div><b>交易号</b>：{{ row.payMerchantOrderTransactionId || '-' }}</div>
              <div><b>浏览器</b>：{{ row.payMerchantOrderBrowser || '-' }}</div>
              <div><b>客户端IP</b>：{{ row.payMerchantOrderAddress || '-' }}</div>
              <div class="col-span-2"><b>备注</b>：{{ row.payMerchantOrderRemark || '-' }}</div>
              <div class="col-span-2"><b>附加参数</b>：{{ row.payMerchantOrderAttach || '-' }}</div>
            </div>
          </el-popover>
        </template>
      </el-table-column>

      <el-table-column label="操作" width="240" fixed="right">
        <template #default="{ row }">
          <el-button text size="small" :disabled="!canRefund(row)" @click="onRefund(row)"><iconifyIconOnline icon="ri:refund-2-line" />退款</el-button>
          <el-button text size="small" :disabled="!canClose(row)" type="danger" @click="onClose(row)"><iconifyIconOnline icon="ep:close" />关闭</el-button>
        </template>
      </el-table-column>
    </ScTable>
  </div>
  <el-drawer v-model="detail.visible" :title="`订单详情 - ${detail.row?.payMerchantOrderCode || ''}`" size="60%">
    <div class="grid grid-cols-5 gap-4">
      <div class="col-span-3">
        <h4>订单流水</h4>
        <el-timeline>
          <el-timeline-item v-for="(it, idx) in detail.water" :key="idx" :timestamp="it.createTime" :type="'primary'">
            <span>状态：{{ statusLabel(it.payMerchantOrderStatus) }}</span>
            <span class="ml-2">流水号：{{ it.payMerchantOrderWaterCode }}</span>
          </el-timeline-item>
        </el-timeline>
      </div>
      <div class="col-span-2">
        <h4>失败记录</h4>
        <el-empty v-if="!(detail.failure?.length>0)" description="暂无失败记录" />
        <el-scrollbar v-else height="400px">
          <el-card v-for="(fr, i) in detail.failure" :key="i" class="mb-2" shadow="never">
            <div><b>类型</b>：{{ fr.payMerchantFailureType || '-' }}</div>
            <div><b>原因</b>：{{ fr.payMerchantFailureReason || '-' }}</div>
            <div><b>时间</b>：{{ fr.createTime || '-' }}</div>
          </el-card>
        </el-scrollbar>
      </div>
    </div>
  </el-drawer>
</template>

<script setup lang="ts">
import { defineExpose, defineAsyncComponent, nextTick, reactive, ref, watch } from 'vue'
import { fetchPageOrder, fetchCloseOrder, fetchRefundOrder, fetchRefundToWallet, OrderStatusOptions } from '../api/order'
import { fetchPageMerchant } from '../api/merchant'
import { ElMessageBox } from 'element-plus'
import { message } from '@repo/utils'

const tableRef = ref()
const form = reactive<any>({})
const statusOptions = OrderStatusOptions

const merchants = ref<any[]>([])
const payTime = ref<[Date, Date] | null>(null)
const finishTime = ref<[Date, Date] | null>(null)

const loadMerchants = async () => {
  const { data } = await fetchPageMerchant({ page: 1, size: 50 })
  merchants.value = data || []
}

const onPayTimeChange = (val: any) => {
  form.payMerchantOrderPayTimeStart = val?.[0] || null
  form.payMerchantOrderPayTimeEnd = val?.[1] || null
}
const onFinishTimeChange = (val: any) => {
  form.payMerchantOrderFinishedTimeStart = val?.[0] || null
  form.payMerchantOrderFinishedTimeEnd = val?.[1] || null
}

const onLoaded = () => {}
const handleRefresh = () => tableRef.value?.reload(form)

const statusType = (s: string) => {
  switch (s) {
    case 'PAY_SUCCESS': return 'success'
    case 'PAY_WAITING': return 'warning'
    case 'PAY_REFUND_WAITING': return 'warning'
    case 'PAY_REFUND_SUCCESS': return 'info'
    case 'PAY_CLOSE_SUCCESS': return 'info'
    case 'PAY_TIMEOUT': return 'danger'
    default: return ''
  }
}
const statusLabel = (s: string) => statusOptions.find(i => i.value === s)?.label || s

const canRefund = (row: any) => row.payMerchantOrderStatus === 'PAY_SUCCESS'
const canClose = (row: any) => !['PAY_WAITING','PAY_CREATE','PAY_REFUND_WAITING'].includes(row.payMerchantOrderStatus)

const onClose = async (row: any) => {
  await ElMessageBox.confirm(`确认关闭订单 ${row.payMerchantOrderCode} ?`, '提示')
  await fetchCloseOrder(row.payMerchantOrderCode)
  message('关闭成功', { type: 'success' })
  handleRefresh()
}

const onRefund = async (row: any) => {
  const { value } = await ElMessageBox.prompt('请输入退款金额', '退款', { inputPattern: /^(\\d+)(\\.\\d{1,2})?$/, inputErrorMessage: '金额格式不正确' })
  const amount = Number(value)
  await fetchRefundOrder(row.payMerchantOrderCode, { refundAmount: amount })
  message('已发起退款', { type: 'success' })
  handleRefresh()
}

loadMerchants()

// 行点击 -> 显示流水/失败详情
const detail = reactive<any>({ visible: false, water: [], failure: [], row: null })
const handleRowClick = async (row: any) => {
  detail.row = row
  const [w, f] = await Promise.all([
    fetchOrderWater(row.payMerchantOrderCode),
    fetchOrderFailure(row.payMerchantOrderCode)
  ])
  detail.water = w?.data || []
  detail.failure = f?.data || []
  detail.visible = true
}

// defineExpose 和 watch 必须放在最后（遵循项目规则）

defineExpose({ handleRefresh })

watch(form, () => {}, { deep: true })
</script>

<style scoped>
.order-page { padding: 8px; }
.order-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.title { font-weight: 600; margin-left: 6px; }
</style>
