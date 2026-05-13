<template>
  <PmPageShell page-class="transaction-page">
    <PmSurface
      title="交易流水"
      description="统一查看支付流水、退款流水、渠道状态与金额。"
    >
      <template #actions>
        <el-tooltip content="刷新">
          <ScButton circle :icon="RefreshRight" @click="reloadAll" />
        </el-tooltip>
      </template>
    </PmSurface>

    <PmStatGrid>
      <PmStatCard label="流水总数" hint="支付、退款统一在此追踪。">
        <template #value>{{ stats.total }}</template>
      </PmStatCard>
      <PmStatCard label="成功流水" hint="用于快速核对已落账记录。">
        <template #value>{{ stats.success }}</template>
      </PmStatCard>
      <PmStatCard label="处理中" hint="适合排查待确认、待回调问题。">
        <template #value>{{ stats.processing }}</template>
      </PmStatCard>
    </PmStatGrid>

    <PmToolbar>
      <template #form>
        <ScSelect v-model="queryForm.merchantId" clearable placeholder="全部商户" style="width: 220px">
          <ScOption v-for="item in merchantOptions" :key="item.id" :label="item.merchantName" :value="item.id" />
        </ScSelect>
        <el-input v-model="queryForm.orderNo" clearable placeholder="订单号" style="width: 220px" @keyup.enter="handleSearch" />
        <ScSelect v-model="queryForm.transactionType" clearable placeholder="交易类型" style="width: 160px">
          <ScOption label="支付" value="PAY" />
          <ScOption label="退款" value="REFUND" />
        </ScSelect>
        <ScSelect v-model="queryForm.status" clearable placeholder="状态" style="width: 160px">
          <ScOption v-for="(label, value) in TransactionStatusMap" :key="value" :label="label" :value="Number(value)" />
        </ScSelect>
      </template>
      <template #actions>
        <ScButton type="primary" :icon="Search" @click="handleSearch">查询</ScButton>
        <ScButton @click="handleReset">重置</ScButton>
      </template>
    </PmToolbar>

    <PmPanel title="流水主表" description="统一查看流水号、订单号、交易类型、渠道和金额。">
      <ScTable ref="tableRef" table-name="payment-transaction-table" row-key="id" border stripe :search="false" :hide-do="true" :hide-refresh="true" :hide-setting="true" :params="queryForm" :url="fetchTransactionTable">
        <el-table-column label="流水号" min-width="220">
          <template #default="{ row }">
            <div class="cell-main"><strong>{{ row.transactionNo }}</strong><span>{{ row.thirdPartyTransactionNo || "未回填第三方流水号" }}</span></div>
          </template>
        </el-table-column>
        <el-table-column label="订单" min-width="260">
          <template #default="{ row }">
            <div class="cell-main"><strong>{{ row.orderNo }}</strong><span>商户 #{{ row.merchantId }}</span></div>
          </template>
        </el-table-column>
        <el-table-column label="交易类型 / 渠道" min-width="200">
          <template #default="{ row }">
            <div class="cell-main">
              <strong>{{ row.transactionType === "PAY" ? "支付" : row.transactionType === "REFUND" ? "退款" : row.transactionType }}</strong>
              <span>
                <span v-if="row.channelType" :class="['channel-badge', `channel-badge-${row.channelType.split('_')[0].toLowerCase()}`]">{{ channelIcon(row.channelType) }}</span>
                {{ ChannelTypeMap[row.channelType] || row.channelType }}
              </span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="交易金额" width="140" align="center">
          <template #default="{ row }"><strong>{{ formatCurrency(row.amount) }}</strong></template>
        </el-table-column>
        <el-table-column label="状态" width="120" align="center">
          <template #default="{ row }"><el-tag :type="row.status === 1 ? 'success' : row.status === 2 ? 'warning' : 'danger'" effect="plain">{{ TransactionStatusMap[row.status] }}</el-tag></template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" min-width="180" show-overflow-tooltip />
        <el-table-column prop="createdAt" label="发生时间" width="180" />
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <div class="pm-icon-actions ops-hover-actions">
              <el-tooltip content="查看详情">
                <ScButton circle :icon="Document" @click="showDetail(row)" />
              </el-tooltip>
            </div>
          </template>
        </el-table-column>
      </ScTable>
    </PmPanel>

    <ScDrawer v-model="detailVisible" size="720px" :title="currentTransaction ? `${currentTransaction.transactionNo} · 流水详情` : '流水详情'" layout="simple">
      <template v-if="currentTransaction">
        <div class="pm-dialog-shell">
          <PmStatusStrip>
            <PmStatusCard label="流水状态" :hint="currentTransaction.thirdPartyTransactionNo || '未回填第三方流水号'">
              <template #value>{{ TransactionStatusMap[currentTransaction.status] || currentTransaction.status }}</template>
            </PmStatusCard>
            <PmStatusCard label="交易金额" :hint="currentTransaction.transactionType === 'PAY' ? '支付流水' : currentTransaction.transactionType === 'REFUND' ? '退款流水' : currentTransaction.transactionType">
              <template #value>{{ formatCurrency(currentTransaction.amount) }}</template>
            </PmStatusCard>
            <PmStatusCard label="关联订单" :hint="`商户 #${currentTransaction.merchantId}`">
              <template #value>{{ currentTransaction.orderNo }}</template>
            </PmStatusCard>
          </PmStatusStrip>

          <section class="pm-section">
            <div class="pm-section__head">
              <div>
                <h3>基础信息</h3>
                <p>核对流水、订单、渠道、状态与备注。</p>
              </div>
            </div>
            <div class="pm-readonly-grid">
              <div class="pm-readonly-item">
                <span class="pm-readonly-item__label">流水号</span>
                <strong class="pm-readonly-item__value">{{ currentTransaction.transactionNo }}</strong>
              </div>
              <div class="pm-readonly-item">
                <span class="pm-readonly-item__label">订单号</span>
                <strong class="pm-readonly-item__value">{{ currentTransaction.orderNo }}</strong>
              </div>
              <div class="pm-readonly-item">
                <span class="pm-readonly-item__label">交易类型</span>
                <strong class="pm-readonly-item__value">{{ currentTransaction.transactionType === "PAY" ? "支付" : currentTransaction.transactionType === "REFUND" ? "退款" : currentTransaction.transactionType }}</strong>
              </div>
              <div class="pm-readonly-item">
                <span class="pm-readonly-item__label">渠道类型</span>
                <strong class="pm-readonly-item__value">{{ ChannelTypeMap[currentTransaction.channelType] || currentTransaction.channelType }}</strong>
              </div>
              <div class="pm-readonly-item">
                <span class="pm-readonly-item__label">第三方流水号</span>
                <strong class="pm-readonly-item__value">{{ currentTransaction.thirdPartyTransactionNo || "-" }}</strong>
              </div>
              <div class="pm-readonly-item">
                <span class="pm-readonly-item__label">备注</span>
                <strong class="pm-readonly-item__value">{{ currentTransaction.remark || "-" }}</strong>
              </div>
            </div>
          </section>

          <section class="pm-section">
            <div class="pm-section__head">
              <div>
                <h3>请求与响应快照</h3>
                <p>快速查看渠道请求体和返回内容。</p>
              </div>
            </div>
            <div class="pm-form-stack">
              <div class="pm-soft-panel">
                <strong>请求快照</strong>
                <pre class="pm-code-preview">{{ currentTransaction.requestPayload || "-" }}</pre>
              </div>
              <div class="pm-soft-panel">
                <strong>响应快照</strong>
                <pre class="pm-code-preview">{{ currentTransaction.responsePayload || "-" }}</pre>
              </div>
            </div>
          </section>
        </div>
      </template>
    </ScDrawer>
  </PmPageShell>
</template>

<script setup lang="ts">
import { ScDrawer } from "@repo/components";
import { onMounted, reactive, ref } from "vue";
import { Document, RefreshRight, Search } from "@element-plus/icons-vue";
import { ScButton } from "@repo/components/ScButton";
import { ScSelect } from "@repo/components/ScSelect";
import { ScOption } from "@repo/components/ScOption";
import ScTable from "@repo/components/ScTable/index.vue";
import { getMerchantList, getTransactionList } from "../api/payment";
import type { Merchant, TransactionRecord } from "../types/payment";
import { ChannelTypeMap, TransactionStatusMap } from "../types/payment";
import { formatCurrency } from "../utils/format";
import PmPageShell from "../components/layout/PmPageShell.vue";
import PmSurface from "../components/layout/PmSurface.vue";
import PmStatGrid from "../components/layout/PmStatGrid.vue";
import PmStatCard from "../components/layout/PmStatCard.vue";
import PmToolbar from "../components/layout/PmToolbar.vue";
import PmPanel from "../components/layout/PmPanel.vue";
import PmStatusStrip from "../components/layout/PmStatusStrip.vue";
import PmStatusCard from "../components/layout/PmStatusCard.vue";

const tableRef = ref();
const merchantOptions = ref<Merchant[]>([]);
const currentTransaction = ref<TransactionRecord | null>(null);
const detailVisible = ref(false);
const stats = reactive({ total: 0, success: 0, processing: 0 });
const queryForm = reactive({ merchantId: undefined as number | undefined, orderNo: "", transactionType: "", status: undefined as number | undefined });

const fetchTransactionTable = (params: Record<string, unknown>) => getTransactionList({ pageNum: params.page, pageSize: params.pageSize, merchantId: params.merchantId, orderNo: params.orderNo, transactionType: params.transactionType, status: params.status });

async function loadBase() { try { const res = await getMerchantList({ page: 1, size: 200 }); merchantOptions.value = res.data.records || []; } catch { merchantOptions.value = []; } }
async function loadStats() { try { const res = await getTransactionList({ pageNum: 1, pageSize: 200 }); const records = res?.data?.records || []; stats.total = res?.data?.total || 0; stats.success = records.filter((item) => item.status === 1).length; stats.processing = records.filter((item) => item.status === 2).length; } catch { /* 交易流水模块尚未初始化 */ } }
async function reloadAll() { await Promise.all([loadStats(), tableRef.value?.reload({ ...queryForm }, 1)]); }
function handleSearch() { tableRef.value?.reload({ ...queryForm }, 1); }
function handleReset() { queryForm.merchantId = undefined; queryForm.orderNo = ""; queryForm.transactionType = ""; queryForm.status = undefined; handleSearch(); }
function showDetail(row: TransactionRecord) { currentTransaction.value = row; detailVisible.value = true; }

const ChannelIconMap: Record<string, string> = { WECHAT: "微", ALIPAY: "支", WALLET: "钱", EPAY: "易" };
function channelIcon(channelType?: string) {
  if (!channelType) return "";
  const baseType = channelType.split("_")[0];
  return ChannelIconMap[baseType] || channelType.charAt(0);
}

onMounted(async () => { await Promise.all([loadBase(), loadStats()]); tableRef.value?.reload(); });
</script>

<style scoped>
.cell-main { display: flex; flex-direction: column; gap: 6px; }
.cell-main span { color: #667085; line-height: 1.6; }

/* 渠道图标徽章 */
.channel-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 700;
  color: #fff;
  margin-right: 4px;
  vertical-align: middle;
}
.channel-badge-wechat { background: #07c160; }
.channel-badge-alipay { background: #1677ff; }
.channel-badge-wallet { background: #8b5cf6; }
.channel-badge-epay   { background: #f59e0b; }
</style>
