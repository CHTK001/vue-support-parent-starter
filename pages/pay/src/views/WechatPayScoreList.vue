<template>
  <PmPageShell page-class="wechat-pay-score-page">
    <PmSurface
      title="微信支付分订单"
      description="独立于普通支付订单的微信支付分服务订单管理。"
    >
      <template #actions>
        <ScButton type="primary" @click="openCreateDialog">创建支付分订单</ScButton>
      </template>
    </PmSurface>

    <PmStatGrid>
      <PmStatCard label="支付分订单" hint="独立于普通支付订单的微信支付分服务订单总量。">
        <template #value>{{ pagination.total }}</template>
      </PmStatCard>
      <PmStatCard label="服务中" hint="正在履约或尚未完结的支付分订单。">
        <template #value>{{ doingCount }}</template>
      </PmStatCard>
      <PmStatCard label="已完结" hint="已执行完结并回写本地状态的订单。">
        <template #value>{{ completedCount }}</template>
      </PmStatCard>
    </PmStatGrid>

    <PmPanel title="微信支付分订单" description="管理微信支付分服务订单的创建、查询、同步和完结。">
      <PmToolbar>
        <template #form>
          <ScSelect v-model="searchForm.merchantId" clearable placeholder="全部商户" style="width: 220px" @change="handleSearchMerchantChange">
            <ScOption v-for="item in merchantOptions" :key="item.id" :label="item.merchantName" :value="item.id" />
          </ScSelect>
          <ScSelect v-model="searchForm.channelId" clearable placeholder="全部渠道" style="width: 220px">
            <ScOption v-for="item in searchChannelOptions" :key="item.id" :label="item.channelName" :value="item.id" />
          </ScSelect>
          <el-input v-model="searchForm.openId" clearable placeholder="请输入 openId" />
          <ScSelect v-model="searchForm.state" clearable placeholder="全部状态" style="width: 180px">
            <ScOption v-for="(label, value) in WechatPayScoreStateMap" :key="value" :label="label" :value="value" />
          </ScSelect>
        </template>
        <template #actions>
          <ScButton type="primary" @click="handleSearch">查询</ScButton>
          <ScButton @click="handleResetSearch">重置</ScButton>
        </template>
      </PmToolbar>

      <ScTable
        table-name="payment-wechat-pay-score-table"
        row-key="outOrderNo"
        border
        stripe
        :search="false"
        :hide-do="true"
        :hide-refresh="true"
        :hide-setting="true"
        :data="{ records: payScoreList, total: pagination.total, current: pagination.page, size: pagination.size }"
      >
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
            <ScButton link type="primary" @click="handleSync(row)">同步</ScButton>
            <ScButton v-if="canComplete(row.state)" link type="success" @click="openCompleteDialog(row)">完结</ScButton>
            <ScButton v-if="canCancel(row.state)" link type="danger" @click="handleCancel(row)">取消</ScButton>
            <ScButton link @click="showDetail(row)">详情</ScButton>
          </template>
        </el-table-column>
      </ScTable>

      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.size"
        :total="pagination.total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next, jumper"
        class="pm-pagination"
        @current-change="loadPayScores"
        @size-change="handlePageSizeChange"
      />
    </PmPanel>

    <ScDialog v-model="createDialogVisible" title="创建微信支付分订单" width="760px">
      <div class="pm-dialog-shell">
        <section class="pm-section">
          <div class="pm-section__head">
            <div>
              <h3>基础参数</h3>
              <p>商户、渠道和用户信息。</p>
            </div>
          </div>
          <el-form :model="createForm" label-width="110px">
            <div class="pm-form-grid">
              <el-form-item label="商户" required>
                <ScSelect v-model="createForm.merchantId" placeholder="请选择商户" @change="handleCreateMerchantChange">
                  <ScOption v-for="item in merchantOptions" :key="item.id" :label="item.merchantName" :value="item.id" />
                </ScSelect>
              </el-form-item>
              <el-form-item label="微信渠道" required>
                <ScSelect v-model="createForm.channelId" placeholder="请选择微信渠道">
                  <ScOption v-for="item in createChannelOptions" :key="item.id" :label="item.channelName" :value="item.id" />
                </ScSelect>
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
            </div>
          </el-form>
        </section>

        <section class="pm-section">
          <div class="pm-section__head">
            <div>
              <h3>服务信息</h3>
              <p>服务说明、时间范围和回调配置。</p>
            </div>
          </div>
          <el-form :model="createForm" label-width="110px">
            <div class="pm-form-grid">
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
              <el-form-item label="回调地址" class="pm-form-span-2">
                <el-input v-model="createForm.notifyUrl" placeholder="可选，默认使用后端自动生成回调地址" />
              </el-form-item>
              <el-form-item label="原因">
                <el-input v-model="createForm.reason" placeholder="例如：停车离场结算" />
              </el-form-item>
            </div>
          </el-form>
        </section>

        <section class="pm-section">
          <div class="pm-section__head">
            <div>
              <h3>扩展信息</h3>
              <p>完结配置、附加数据和备注。</p>
            </div>
          </div>
          <el-form :model="createForm" label-width="110px">
            <div class="pm-form-grid">
              <el-form-item label="完结类型">
                <el-input v-model="createForm.finishType" placeholder="例如：FINISH" />
              </el-form-item>
              <el-form-item label="用户确认">
                <el-switch v-model="createForm.needUserConfirm" />
              </el-form-item>
              <el-form-item label="附加数据" class="pm-form-span-2">
                <el-input v-model="createForm.attach" placeholder="透传给微信的 attach" />
              </el-form-item>
              <el-form-item label="备注">
                <el-input v-model="createForm.remark" placeholder="管理台备注" />
              </el-form-item>
            </div>
          </el-form>
        </section>
      </div>
      <template #footer>
        <div class="pm-dialog-footer">
          <ScButton @click="createDialogVisible = false">取消</ScButton>
          <ScButton type="primary" :loading="submitting" @click="submitCreate">创建</ScButton>
        </div>
      </template>
    </ScDialog>

    <ScDialog v-model="completeDialogVisible" title="完结微信支付分订单" width="620px">
      <div class="pm-dialog-shell">
        <section class="pm-section">
          <div class="pm-section__head">
            <div>
              <h3>完结信息</h3>
              <p>设置完结类型、金额和原因。</p>
            </div>
          </div>
          <el-form :model="completeForm" label-width="100px">
            <div class="pm-form-grid">
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
              <el-form-item label="原因" class="pm-form-span-2">
                <el-input v-model="completeForm.reason" type="textarea" :rows="3" placeholder="例如：停车服务已结束" />
              </el-form-item>
              <el-form-item label="备注">
                <el-input v-model="completeForm.remark" placeholder="完结备注" />
              </el-form-item>
            </div>
          </el-form>
        </section>
      </div>
      <template #footer>
        <div class="pm-dialog-footer">
          <ScButton @click="completeDialogVisible = false">取消</ScButton>
          <ScButton type="primary" :loading="submitting" @click="submitComplete">确认完结</ScButton>
        </div>
      </template>
    </ScDialog>

    <ScDrawer v-model="detailVisible" size="540px" title="微信支付分详情">
      <template v-if="currentOrder">
        <div class="pm-dialog-shell">
          <PmStatusStrip>
            <PmStatusCard label="状态" :hint="currentOrder.serviceOrderNo || '未同步微信服务订单号'">
              <template #value>{{ WechatPayScoreStateMap[currentOrder.state] || currentOrder.state }}</template>
            </PmStatusCard>
            <PmStatusCard label="服务信息" :hint="currentOrder.serviceIntroduction || '-'">
              <template #value>{{ currentOrder.serviceId }}</template>
            </PmStatusCard>
            <PmStatusCard label="OpenId" :hint="currentOrder.notifyUrl || '-'">
              <template #value>{{ currentOrder.openId }}</template>
            </PmStatusCard>
          </PmStatusStrip>

          <section class="pm-section">
            <div class="pm-section__head">
              <div>
                <h3>订单信息</h3>
                <p>服务订单号和微信侧订单信息。</p>
              </div>
            </div>
            <div class="pm-readonly-grid">
              <div class="pm-readonly-item">
                <span class="pm-readonly-item__label">服务订单号</span>
                <strong class="pm-readonly-item__value">{{ currentOrder.outOrderNo }}</strong>
              </div>
              <div class="pm-readonly-item">
                <span class="pm-readonly-item__label">微信服务订单号</span>
                <strong class="pm-readonly-item__value">{{ currentOrder.serviceOrderNo || "-" }}</strong>
              </div>
              <div class="pm-readonly-item">
                <span class="pm-readonly-item__label">服务说明</span>
                <strong class="pm-readonly-item__value">{{ currentOrder.serviceIntroduction || "-" }}</strong>
              </div>
              <div class="pm-readonly-item">
                <span class="pm-readonly-item__label">完成原因</span>
                <strong class="pm-readonly-item__value">{{ currentOrder.finishReason || "-" }}</strong>
              </div>
            </div>
          </section>

          <section class="pm-section">
            <div class="pm-section__head">
              <div>
                <h3>请求与响应快照</h3>
                <p>查看渠道请求体和返回内容。</p>
              </div>
            </div>
            <div class="pm-form-stack">
              <div class="pm-soft-panel">
                <strong>请求快照</strong>
                <pre class="pm-code-preview">{{ currentOrder.requestPayload || "-" }}</pre>
              </div>
              <div class="pm-soft-panel">
                <strong>响应快照</strong>
                <pre class="pm-code-preview">{{ currentOrder.responsePayload || "-" }}</pre>
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
import { formatCurrency } from "../utils/format";
import PmPageShell from "../components/layout/PmPageShell.vue";
import PmSurface from "../components/layout/PmSurface.vue";
import PmStatGrid from "../components/layout/PmStatGrid.vue";
import PmStatCard from "../components/layout/PmStatCard.vue";
import PmToolbar from "../components/layout/PmToolbar.vue";
import PmPanel from "../components/layout/PmPanel.vue";
import PmStatusStrip from "../components/layout/PmStatusStrip.vue";
import PmStatusCard from "../components/layout/PmStatusCard.vue";

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
.wechat-pay-score-page {
  background: linear-gradient(180deg, #fdf6ee 0%, #f7f8fa 220px, #f7f8fa 100%);
}

.wechat-pay-score-page :deep(.pm-stat-card) {
  background: linear-gradient(160deg, rgba(255, 246, 234, 0.9) 0%, rgba(255, 255, 255, 0.88) 100%);
}

.wechat-pay-score-page :deep(.pm-stat-card .pm-stat-card__label),
.wechat-pay-score-page :deep(.pm-stat-card .pm-stat-card__value),
.wechat-pay-score-page :deep(.pm-stat-card .pm-stat-card__hint) {
  color: #705847;
}
</style>
