<template>
  <section class="view">
    <div class="hero-grid">
      <article class="hero-card">
        <p>支付分订单</p>
        <strong>{{ pagination.total }}</strong>
        <span>独立于普通支付订单的微信支付分服务订单总量。</span>
      </article>
      <article class="hero-card">
        <p>服务中</p>
        <strong>{{ doingCount }}</strong>
        <span>正在履约或尚未完结的支付分订单。</span>
      </article>
      <article class="hero-card">
        <p>已完结</p>
        <strong>{{ completedCount }}</strong>
        <span>已执行完结并回写本地状态的订单。</span>
      </article>
    </div>

    <el-card class="panel">
      <template #header>
        <div class="panel__header">
          <div>
            <p class="panel__eyebrow">Wechat Pay Score</p>
            <h3>微信支付分订单</h3>
          </div>
          <el-button type="primary" @click="openCreateDialog">创建支付分订单</el-button>
        </div>
      </template>

      <el-form :inline="true" :model="searchForm" class="toolbar">
        <el-form-item label="商户">
          <el-select
            v-model="searchForm.merchantId"
            clearable
            placeholder="全部商户"
            style="width: 220px"
            @change="handleSearchMerchantChange"
          >
            <el-option v-for="item in merchantOptions" :key="item.id" :label="item.merchantName" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="渠道">
          <el-select v-model="searchForm.channelId" clearable placeholder="全部渠道" style="width: 220px">
            <el-option v-for="item in searchChannelOptions" :key="item.id" :label="item.channelName" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="OpenId">
          <el-input v-model="searchForm.openId" clearable placeholder="请输入 openId" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.state" clearable placeholder="全部状态" style="width: 180px">
            <el-option v-for="(label, value) in WechatPayScoreStateMap" :key="value" :label="label" :value="value" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleResetSearch">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="payScoreList" v-loading="loading" border class="table">
        <el-table-column prop="outOrderNo" label="服务订单号" min-width="180" />
        <el-table-column prop="serviceOrderNo" label="微信服务订单号" min-width="180" />
        <el-table-column prop="serviceId" label="服务ID" width="160" />
        <el-table-column prop="openId" label="OpenId" min-width="160" />
        <el-table-column label="金额" width="120">
          <template #default="{ row }">
            <strong>{{ formatCurrency(row.totalAmount) }}</strong>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="140">
          <template #default="{ row }">
            <el-tag :type="statusTag(row.state)">{{ WechatPayScoreStateMap[row.state] || row.state }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="serviceIntroduction" label="服务说明" min-width="180" />
        <el-table-column prop="notifyUrl" label="回调地址" min-width="220" show-overflow-tooltip />
        <el-table-column prop="updateTime" label="更新时间" width="180" />
        <el-table-column label="操作" width="260" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleSync(row)">同步</el-button>
            <el-button v-if="canComplete(row.state)" link type="success" @click="openCompleteDialog(row)">完结</el-button>
            <el-button v-if="canCancel(row.state)" link type="danger" @click="handleCancel(row)">取消</el-button>
            <el-button link @click="showDetail(row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.size"
        :total="pagination.total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next, jumper"
        class="pager"
        @current-change="loadPayScores"
        @size-change="handlePageSizeChange"
      />
    </el-card>

    <el-dialog v-model="createDialogVisible" title="创建微信支付分订单" width="760px">
      <el-form :model="createForm" label-width="110px">
        <div class="form-grid">
          <el-form-item label="商户" required>
            <el-select v-model="createForm.merchantId" placeholder="请选择商户" @change="handleCreateMerchantChange">
              <el-option v-for="item in merchantOptions" :key="item.id" :label="item.merchantName" :value="item.id" />
            </el-select>
          </el-form-item>
          <el-form-item label="微信渠道" required>
            <el-select v-model="createForm.channelId" placeholder="请选择微信渠道">
              <el-option v-for="item in createChannelOptions" :key="item.id" :label="item.channelName" :value="item.id" />
            </el-select>
          </el-form-item>
          <el-form-item label="服务订单号">
            <el-input v-model="createForm.outOrderNo" placeholder="可选，不填则后端自动生成" />
          </el-form-item>
          <el-form-item label="用户ID">
            <el-input-number v-model="createForm.userId" :min="1" :precision="0" />
          </el-form-item>
          <el-form-item label="OpenId" required>
            <el-input v-model="createForm.openId" placeholder="请输入微信 openId" />
          </el-form-item>
          <el-form-item label="金额">
            <el-input-number v-model="createForm.totalAmount" :min="0" :precision="2" :step="0.01" />
          </el-form-item>
          <el-form-item label="服务ID">
            <el-input v-model="createForm.serviceId" placeholder="可选，默认读取渠道 extConfig" />
          </el-form-item>
          <el-form-item label="服务说明">
            <el-input v-model="createForm.serviceIntroduction" placeholder="例如：停车代扣服务" />
          </el-form-item>
          <el-form-item label="开始时间">
            <el-input v-model="createForm.startTime" placeholder="例如：2026-03-23T12:00:00+08:00" />
          </el-form-item>
          <el-form-item label="结束时间">
            <el-input v-model="createForm.endTime" placeholder="可选，预估结束时间" />
          </el-form-item>
          <el-form-item label="回调地址" class="span-2">
            <el-input v-model="createForm.notifyUrl" placeholder="可选，默认使用后端自动生成回调地址" />
          </el-form-item>
          <el-form-item label="原因">
            <el-input v-model="createForm.reason" placeholder="例如：停车离场结算" />
          </el-form-item>
          <el-form-item label="完结类型">
            <el-input v-model="createForm.finishType" placeholder="例如：FINISH" />
          </el-form-item>
          <el-form-item label="附加数据" class="span-2">
            <el-input v-model="createForm.attach" placeholder="透传给微信的 attach" />
          </el-form-item>
          <el-form-item label="用户确认">
            <el-switch v-model="createForm.needUserConfirm" />
          </el-form-item>
          <el-form-item label="备注">
            <el-input v-model="createForm.remark" placeholder="管理台备注" />
          </el-form-item>
        </div>
      </el-form>
      <template #footer>
        <el-button @click="createDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitCreate">创建</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="completeDialogVisible" title="完结微信支付分订单" width="620px">
      <el-form :model="completeForm" label-width="100px">
        <el-form-item label="服务订单号">
          <el-input :model-value="currentOrder?.outOrderNo || ''" disabled />
        </el-form-item>
        <el-form-item label="完结类型">
          <el-input v-model="completeForm.finishType" placeholder="默认 FINISH" />
        </el-form-item>
        <el-form-item label="完结金额">
          <el-input-number v-model="completeForm.totalAmount" :min="0" :precision="2" :step="0.01" />
        </el-form-item>
        <el-form-item label="结束时间">
          <el-input v-model="completeForm.endTime" placeholder="例如：2026-03-23T13:00:00+08:00" />
        </el-form-item>
        <el-form-item label="原因">
          <el-input v-model="completeForm.reason" type="textarea" :rows="3" placeholder="例如：停车服务已结束" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="completeForm.remark" placeholder="完结备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="completeDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitComplete">确认完结</el-button>
      </template>
    </el-dialog>

    <el-drawer v-model="detailVisible" size="540px" title="微信支付分详情">
      <el-descriptions v-if="currentOrder" :column="1" border>
        <el-descriptions-item label="服务订单号">{{ currentOrder.outOrderNo }}</el-descriptions-item>
        <el-descriptions-item label="微信服务订单号">{{ currentOrder.serviceOrderNo || "-" }}</el-descriptions-item>
        <el-descriptions-item label="服务ID">{{ currentOrder.serviceId }}</el-descriptions-item>
        <el-descriptions-item label="OpenId">{{ currentOrder.openId }}</el-descriptions-item>
        <el-descriptions-item label="状态">{{ WechatPayScoreStateMap[currentOrder.state] || currentOrder.state }}</el-descriptions-item>
        <el-descriptions-item label="回调地址">{{ currentOrder.notifyUrl || "-" }}</el-descriptions-item>
        <el-descriptions-item label="服务说明">{{ currentOrder.serviceIntroduction || "-" }}</el-descriptions-item>
        <el-descriptions-item label="完成原因">{{ currentOrder.finishReason || "-" }}</el-descriptions-item>
        <el-descriptions-item label="请求快照">{{ currentOrder.requestPayload || "-" }}</el-descriptions-item>
        <el-descriptions-item label="响应快照">{{ currentOrder.responsePayload || "-" }}</el-descriptions-item>
      </el-descriptions>
    </el-drawer>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  cancelWechatPayScoreOrder,
  completeWechatPayScoreOrder,
  createWechatPayScoreOrder,
  getMerchantChannels,
  getMerchantList,
  getWechatPayScoreDetail,
  getWechatPayScoreList,
  syncWechatPayScoreOrder,
} from "../api/payment";
import type {
  Merchant,
  MerchantChannel,
  WechatPayScoreCompleteForm,
  WechatPayScoreCreateForm,
  WechatPayScoreOrder,
} from "../types/payment";
import { WechatPayScoreStateMap } from "../types/payment";

const loading = ref(false);
const submitting = ref(false);
const createDialogVisible = ref(false);
const completeDialogVisible = ref(false);
const detailVisible = ref(false);

const merchantOptions = ref<Merchant[]>([]);
const searchChannelOptions = ref<MerchantChannel[]>([]);
const createChannelOptions = ref<MerchantChannel[]>([]);
const payScoreList = ref<WechatPayScoreOrder[]>([]);
const currentOrder = ref<WechatPayScoreOrder | null>(null);

const pagination = reactive({
  page: 1,
  size: 10,
  total: 0,
});

const searchForm = reactive({
  merchantId: undefined as number | undefined,
  channelId: undefined as number | undefined,
  openId: "",
  state: "",
});

const createForm = reactive<WechatPayScoreCreateForm>(createDefaultCreateForm());
const completeForm = reactive<WechatPayScoreCompleteForm>(createDefaultCompleteForm());

const doingCount = computed(() => payScoreList.value.filter((item) => item.state === "DOING").length);
const completedCount = computed(() => payScoreList.value.filter((item) => ["COMPLETED", "SUCCESS"].includes(item.state)).length);

async function loadMerchants() {
  const res = await getMerchantList({ page: 1, size: 200 });
  merchantOptions.value = res.data.records;
}

async function loadPayScores() {
  loading.value = true;
  try {
    const res = await getWechatPayScoreList({
      pageNum: pagination.page,
      pageSize: pagination.size,
      merchantId: searchForm.merchantId,
      channelId: searchForm.channelId,
      openId: searchForm.openId || undefined,
      state: searchForm.state || undefined,
    });
    payScoreList.value = res.data.records;
    pagination.total = res.data.total;
  } finally {
    loading.value = false;
  }
}

async function loadChannelsForMerchant(merchantId?: number) {
  if (!merchantId) {
    return [];
  }
  const res = await getMerchantChannels(merchantId, { status: 1 });
  return res.data.filter((item) => item.channelType === "WECHAT");
}

async function handleSearchMerchantChange(merchantId?: number) {
  searchChannelOptions.value = await loadChannelsForMerchant(merchantId);
  if (!searchChannelOptions.value.some((item) => item.id === searchForm.channelId)) {
    searchForm.channelId = undefined;
  }
}

async function handleCreateMerchantChange(merchantId?: number) {
  createChannelOptions.value = await loadChannelsForMerchant(merchantId);
  if (!createChannelOptions.value.some((item) => item.id === createForm.channelId)) {
    createForm.channelId = createChannelOptions.value[0]?.id ?? 0;
  }
}

function openCreateDialog() {
  Object.assign(createForm, createDefaultCreateForm());
  createChannelOptions.value = [];
  createDialogVisible.value = true;
}

async function submitCreate() {
  if (!createForm.merchantId || !createForm.channelId || !createForm.openId.trim()) {
    ElMessage.error("商户、微信渠道和 openId 不能为空");
    return;
  }
  submitting.value = true;
  try {
    await createWechatPayScoreOrder(createForm);
    ElMessage.success("微信支付分订单创建成功");
    createDialogVisible.value = false;
    await loadPayScores();
  } finally {
    submitting.value = false;
  }
}

async function handleSearch() {
  pagination.page = 1;
  await loadPayScores();
}

async function handleResetSearch() {
  searchForm.merchantId = undefined;
  searchForm.channelId = undefined;
  searchForm.openId = "";
  searchForm.state = "";
  searchChannelOptions.value = [];
  await handleSearch();
}

function handlePageSizeChange(size: number) {
  pagination.size = size;
  pagination.page = 1;
  loadPayScores();
}

async function handleSync(order: WechatPayScoreOrder) {
  const res = await syncWechatPayScoreOrder(order.outOrderNo);
  ElMessage.success(`已同步为 ${WechatPayScoreStateMap[res.data.state] || res.data.state}`);
  await loadPayScores();
}

function openCompleteDialog(order: WechatPayScoreOrder) {
  currentOrder.value = order;
  Object.assign(completeForm, createDefaultCompleteForm(), {
    totalAmount: order.totalAmount ?? 0,
    finishType: order.finishType || "FINISH",
    reason: order.reason || "",
  });
  completeDialogVisible.value = true;
}

async function submitComplete() {
  if (!currentOrder.value) {
    return;
  }
  submitting.value = true;
  try {
    await completeWechatPayScoreOrder(currentOrder.value.outOrderNo, completeForm);
    ElMessage.success("微信支付分订单已完结");
    completeDialogVisible.value = false;
    await loadPayScores();
  } finally {
    submitting.value = false;
  }
}

async function handleCancel(order: WechatPayScoreOrder) {
  const { value } = await ElMessageBox.prompt("请输入取消原因", "取消微信支付分订单", {
    inputPlaceholder: "例如：商户取消服务",
  });
  await cancelWechatPayScoreOrder(order.outOrderNo, { reason: value, remark: "payment-console" });
  ElMessage.success("微信支付分订单已取消");
  await loadPayScores();
}

async function showDetail(order: WechatPayScoreOrder) {
  const res = await getWechatPayScoreDetail(order.outOrderNo);
  currentOrder.value = res.data;
  detailVisible.value = true;
}

function canComplete(state: string) {
  return state === "CREATED" || state === "DOING";
}

function canCancel(state: string) {
  return state === "CREATED" || state === "DOING";
}

function statusTag(state: string) {
  if (["COMPLETED", "SUCCESS"].includes(state)) {
    return "success";
  }
  if (state === "DOING" || state === "CREATED") {
    return "warning";
  }
  if (state === "CANCELED" || state === "CANCELLED") {
    return "info";
  }
  return "";
}

function formatCurrency(value?: number) {
  return `¥${Number(value || 0).toFixed(2)}`;
}

function createDefaultCreateForm(): WechatPayScoreCreateForm {
  return {
    merchantId: 0,
    channelId: 0,
    userId: undefined,
    outOrderNo: "",
    serviceId: "",
    openId: "",
    totalAmount: 0,
    notifyUrl: "",
    serviceIntroduction: "",
    startTime: "",
    endTime: "",
    reason: "",
    finishType: "FINISH",
    needUserConfirm: false,
    attach: "",
    remark: "",
  };
}

function createDefaultCompleteForm(): WechatPayScoreCompleteForm {
  return {
    totalAmount: 0,
    finishType: "FINISH",
    reason: "",
    endTime: "",
    remark: "",
  };
}

onMounted(async () => {
  await Promise.all([loadMerchants(), loadPayScores()]);
});
</script>

<style scoped>
.view {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.hero-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

.hero-card,
.panel {
  border: none;
  border-radius: 24px;
  box-shadow: 0 18px 60px rgba(54, 37, 23, 0.08);
}

.hero-card {
  padding: 20px 22px;
  background: linear-gradient(160deg, rgba(255, 246, 234, 0.9) 0%, rgba(255, 255, 255, 0.88) 100%);
}

.hero-card p,
.hero-card span {
  margin: 0;
}

.hero-card p {
  color: #8e6945;
}

.hero-card strong {
  display: block;
  margin: 10px 0 12px;
  font-size: 34px;
  color: #291b12;
}

.hero-card span {
  line-height: 1.7;
  color: #705847;
}

.panel__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.panel__eyebrow {
  margin: 0 0 6px;
  font-size: 12px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: #bf8445;
}

.panel__header h3 {
  margin: 0;
  font-size: 24px;
  font-family: "STZhongsong", "Noto Serif SC", Georgia, serif;
}

.toolbar {
  margin-bottom: 18px;
}

.table {
  border-radius: 18px;
  overflow: hidden;
}

.pager {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 6px 18px;
}

.span-2 {
  grid-column: 1 / -1;
}

@media (max-width: 1100px) {
  .hero-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .form-grid {
    grid-template-columns: 1fr;
  }

  .span-2 {
    grid-column: auto;
  }
}
</style>
