<template>
  <section class="payment-page merchant-page">
    <header class="payment-surface">
      <div>
        <p class="payment-surface__eyebrow">Merchant Control</p>
        <h1 class="payment-surface__title">商户管理</h1>
        <p class="payment-surface__desc">
          首页只看总览，商户页专注配置主体、回调、支付方式和限额。列表收敛成一张主表，细项放进抽屉处理。
        </p>
      </div>
      <div class="payment-surface__actions">
        <el-button :icon="RefreshRight" @click="refreshAll">刷新</el-button>
        <el-button type="primary" :icon="Plus" @click="openMerchantDialog()">新增商户</el-button>
      </div>
    </header>

    <section class="payment-stat-grid">
      <article class="payment-stat">
        <span class="payment-stat__label">商户总数</span>
        <strong class="payment-stat__value">{{ stats.total }}</strong>
        <span class="payment-stat__hint">支付台内已录入的商户主体总量。</span>
      </article>
      <article class="payment-stat">
        <span class="payment-stat__label">激活商户</span>
        <strong class="payment-stat__value">{{ stats.active }}</strong>
        <span class="payment-stat__hint">已启用、可继续配置支付渠道的商户数量。</span>
      </article>
      <article class="payment-stat">
        <span class="payment-stat__label">已配支付方式</span>
        <strong class="payment-stat__value">{{ stats.configured }}</strong>
        <span class="payment-stat__hint">至少存在一个渠道配置的商户数量。</span>
      </article>
    </section>

    <section class="payment-toolbar">
      <div class="payment-toolbar__row">
        <div class="payment-toolbar__form">
          <el-input v-model="queryForm.merchantName" clearable placeholder="商户名称" style="width: 220px" @keyup.enter="handleSearch" />
          <el-select v-model="queryForm.status" clearable placeholder="状态" style="width: 180px">
            <el-option label="待审核" :value="0" />
            <el-option label="已激活" :value="1" />
            <el-option label="已停用" :value="2" />
            <el-option label="已注销" :value="3" />
          </el-select>
          <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </div>
        <div class="payment-toolbar__actions">
          <el-tag type="info" effect="plain">列表使用 ScTable</el-tag>
          <el-tag type="success" effect="plain">支付方式卡片使用 ScTable</el-tag>
        </div>
      </div>
    </section>

    <section class="payment-panel">
      <div class="payment-panel__head">
        <div>
          <p class="payment-panel__eyebrow">Master List</p>
          <h2 class="payment-panel__title">商户主表</h2>
          <p class="payment-panel__desc">保留必要字段，详细配置放到抽屉，避免一页塞满全部业务信息。</p>
        </div>
      </div>

      <ScTable
        ref="tableRef"
        table-name="payment-merchant-table"
        row-key="id"
        border
        stripe
        :search="false"
        :hide-refresh="true"
        :hide-do="true"
        :hide-setting="true"
        :params="queryForm"
        :url="fetchMerchantTable"
      >
        <el-table-column label="商户" min-width="220">
          <template #default="{ row }">
            <div class="cell-main">
              <strong>{{ row.merchantName }}</strong>
              <span>{{ row.merchantNo || `M-${row.id}` }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="联系人" min-width="200">
          <template #default="{ row }">
            <div class="cell-main">
              <strong>{{ row.contactName || "-" }}</strong>
              <span>{{ row.contactPhone || row.contactEmail || "未填写联系方式" }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="默认回调" min-width="260" show-overflow-tooltip>
          <template #default="{ row }">
            <div class="cell-main">
              <strong>{{ row.defaultNotifyUrl || "未配置统一结果回调" }}</strong>
              <span>{{ row.defaultReturnUrl || "未配置浏览器回跳地址" }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="业务能力" min-width="220">
          <template #default="{ row }">
            <div class="capability-list">
              <el-tag :type="row.walletEnabled ? 'success' : 'info'" effect="plain">钱包 {{ row.walletEnabled ? "开启" : "关闭" }}</el-tag>
              <el-tag :type="row.compositeEnabled ? 'success' : 'info'" effect="plain">聚合 {{ row.compositeEnabled ? "开启" : "关闭" }}</el-tag>
              <el-tag :type="row.autoCloseEnabled ? 'warning' : 'info'" effect="plain">
                自动关单 {{ row.autoCloseEnabled ? `${row.autoCloseMinutes || 30} 分钟` : "关闭" }}
              </el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="支付方式" width="120" align="center">
          <template #default="{ row }">
            <strong>{{ row.channelCount || 0 }}</strong>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="merchantStatusTag(row.status)" effect="plain">
              {{ row.statusDesc || MerchantStatusMap[row.status] || "-" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="180" />
        <el-table-column label="操作" width="300" fixed="right">
          <template #default="{ row }">
            <div class="payment-icon-actions">
              <el-tooltip content="编辑商户">
                <el-button circle :icon="Edit" @click="openMerchantDialog(row)" />
              </el-tooltip>
              <el-tooltip content="支付方式">
                <el-button circle :icon="CreditCard" @click="openChannelDrawer(row)" />
              </el-tooltip>
              <el-tooltip content="商户设置">
                <el-button circle :icon="Setting" @click="openSettingDrawer(row)" />
              </el-tooltip>
              <el-tooltip :content="row.status === 1 ? '停用商户' : '激活商户'">
                <el-button circle :type="row.status === 1 ? 'warning' : 'success'" :icon="row.status === 1 ? SwitchButton : CircleCheck" @click="toggleMerchantStatus(row)" />
              </el-tooltip>
              <el-tooltip content="删除商户">
                <el-button circle type="danger" :icon="Delete" @click="removeMerchant(row)" />
              </el-tooltip>
            </div>
          </template>
        </el-table-column>
      </ScTable>
    </section>

    <el-dialog v-model="merchantDialogVisible" :title="merchantForm.id ? '编辑商户' : '新增商户'" width="860px">
      <el-form label-width="120px">
        <div class="payment-form-grid">
          <el-form-item label="商户名称" required>
            <el-input v-model="merchantForm.merchantName" placeholder="例如：演示商城" />
          </el-form-item>
          <el-form-item label="联系人">
            <el-input v-model="merchantForm.contactName" placeholder="例如：张三" />
          </el-form-item>
          <el-form-item label="联系电话">
            <el-input v-model="merchantForm.contactPhone" placeholder="例如：13800000000" />
          </el-form-item>
          <el-form-item label="联系邮箱">
            <el-input v-model="merchantForm.contactEmail" placeholder="例如：merchant@example.com" />
          </el-form-item>
          <el-form-item label="营业执照">
            <el-input v-model="merchantForm.businessLicense" placeholder="可选" />
          </el-form-item>
          <el-form-item label="法人">
            <el-input v-model="merchantForm.legalPerson" placeholder="可选" />
          </el-form-item>
          <el-form-item label="统一结果回调" class="payment-form-span-2">
            <el-input v-model="merchantForm.defaultNotifyUrl" placeholder="支付、转账、退款默认共用；渠道级 notifyUrl 可覆盖" />
            <div class="payment-helper">统一结果回调地址：支付、转账、退款默认共用；若某个支付方式单独配置了 `notifyUrl`，则以渠道级配置为准。</div>
          </el-form-item>
          <el-form-item label="支付完成回跳" class="payment-form-span-2">
            <el-input v-model="merchantForm.defaultReturnUrl" placeholder="浏览器支付完成后前端回跳地址" />
            <div class="payment-helper">支付完成返回地址：仅用于浏览器/H5/收银台等需要跳回前端页面的支付场景。</div>
          </el-form-item>
          <el-form-item label="备注" class="payment-form-span-2">
            <el-input v-model="merchantForm.remark" type="textarea" :rows="3" placeholder="记录商户接入说明、证书负责人等信息" />
          </el-form-item>
        </div>
      </el-form>
      <div class="setting-switch-grid">
        <ScSwitch v-model="merchantForm.walletEnabled" layout="card" active-text="钱包能力开启" inactive-text="钱包能力关闭" />
        <ScSwitch v-model="merchantForm.compositeEnabled" layout="card" active-text="聚合路由开启" inactive-text="聚合路由关闭" />
        <ScSwitch v-model="merchantForm.autoCloseEnabled" layout="card" active-text="自动关单开启" inactive-text="自动关单关闭" />
      </div>
      <el-form label-width="120px" class="auto-close-form">
        <el-form-item label="自动关单分钟">
          <el-input-number v-model="merchantForm.autoCloseMinutes" :min="1" :max="1440" :disabled="!merchantForm.autoCloseEnabled" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="merchantDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="merchantSaving" @click="submitMerchant">保存</el-button>
      </template>
    </el-dialog>

    <el-drawer v-model="settingDrawerVisible" size="680px" :title="activeMerchant ? `${activeMerchant.merchantName} · 商户设置` : '商户设置'">
      <template v-if="activeMerchant">
        <el-tabs v-model="settingTab">
          <el-tab-pane label="商户能力" name="base">
            <div class="setting-switch-grid">
              <ScSwitch v-model="settingState.walletEnabled" layout="card" active-text="钱包能力开启" inactive-text="钱包能力关闭" />
              <ScSwitch v-model="settingState.compositeEnabled" layout="card" active-text="聚合路由开启" inactive-text="聚合路由关闭" />
              <ScSwitch v-model="settingState.autoCloseEnabled" layout="card" active-text="自动关单开启" inactive-text="自动关单关闭" />
            </div>
            <el-form label-width="120px" class="drawer-form">
              <el-form-item label="自动关单分钟">
                <el-input-number v-model="settingState.autoCloseMinutes" :min="1" :max="1440" :disabled="!settingState.autoCloseEnabled" />
              </el-form-item>
              <el-form-item label="统一结果回调">
                <el-input v-model="settingState.defaultNotifyUrl" />
              </el-form-item>
              <el-form-item label="支付完成回跳">
                <el-input v-model="settingState.defaultReturnUrl" />
              </el-form-item>
            </el-form>
          </el-tab-pane>
          <el-tab-pane label="订单规则" name="payment">
            <div class="setting-switch-grid">
              <ScSwitch v-model="paymentConfigState.orderReusable" layout="card" active-text="订单幂等复用开启" inactive-text="订单幂等复用关闭" />
              <ScSwitch v-model="paymentConfigState.autoCancelTimeoutOrder" layout="card" active-text="超时单自动取消" inactive-text="超时单不自动取消" />
            </div>
            <el-form label-width="120px" class="drawer-form">
              <el-form-item label="订单超时分钟">
                <el-input-number v-model="paymentConfigState.orderTimeoutMinutes" :min="1" :max="1440" />
              </el-form-item>
              <el-form-item label="待支付上限">
                <el-input-number v-model="paymentConfigState.pendingOrderLimit" :min="0" :max="99999" />
              </el-form-item>
            </el-form>
          </el-tab-pane>
          <el-tab-pane label="钱包限额" name="wallet">
            <div class="payment-form-grid">
              <el-form-item label="单笔充值"><el-input-number v-model="walletLimitState.singleRechargeLimit" :min="0" :precision="2" :step="10" /></el-form-item>
              <el-form-item label="单日充值"><el-input-number v-model="walletLimitState.dailyRechargeLimit" :min="0" :precision="2" :step="10" /></el-form-item>
              <el-form-item label="单笔提现"><el-input-number v-model="walletLimitState.singleWithdrawLimit" :min="0" :precision="2" :step="10" /></el-form-item>
              <el-form-item label="单日提现"><el-input-number v-model="walletLimitState.dailyWithdrawLimit" :min="0" :precision="2" :step="10" /></el-form-item>
              <el-form-item label="单笔转账"><el-input-number v-model="walletLimitState.singleTransferLimit" :min="0" :precision="2" :step="10" /></el-form-item>
              <el-form-item label="单日转账"><el-input-number v-model="walletLimitState.dailyTransferLimit" :min="0" :precision="2" :step="10" /></el-form-item>
              <el-form-item label="余额上限"><el-input-number v-model="walletLimitState.balanceLimit" :min="0" :precision="2" :step="10" /></el-form-item>
            </div>
          </el-tab-pane>
        </el-tabs>
        <div class="drawer-footer">
          <el-button @click="settingDrawerVisible = false">取消</el-button>
          <el-button type="primary" :loading="settingSaving" @click="saveMerchantSettings">保存设置</el-button>
        </div>
      </template>
    </el-drawer>

    <el-drawer v-model="channelDrawerVisible" size="860px" :title="activeMerchant ? `${activeMerchant.merchantName} · 支付方式` : '支付方式'">
      <template v-if="activeMerchant">
        <div class="drawer-toolbar">
          <div class="payment-mini-grid">
            <div class="payment-note"><strong>统一结果回调：</strong>{{ activeMerchant.defaultNotifyUrl || "当前商户未配置" }}</div>
            <div class="payment-note"><strong>支付完成回跳：</strong>{{ activeMerchant.defaultReturnUrl || "当前商户未配置" }}</div>
          </div>
          <div class="payment-card-actions">
            <el-input v-model="channelKeyword" clearable placeholder="搜索支付方式名称 / 渠道类型" style="width: 220px" />
            <el-button type="primary" :icon="Plus" @click="openChannelDialog()">新增支付方式</el-button>
          </div>
        </div>
        <ScTable
          table-name="payment-merchant-channel-card"
          layout="card"
          card-layout="default"
          :search="false"
          :hide-do="true"
          :hide-refresh="true"
          :hide-setting="true"
          :hide-pagination="true"
          :data="channelCardData"
        >
          <template #default="{ row }">
            <el-card shadow="never" class="channel-card">
              <template #header>
                <div class="channel-card__header">
                  <div>
                    <strong>{{ row.channelName }}</strong>
                    <p>{{ ChannelTypeMap[row.channelType] || row.channelType }} / {{ row.channelSubType }}</p>
                  </div>
                  <el-tag :type="row.status === 1 ? 'success' : 'info'" effect="plain">
                    {{ row.statusDesc || ChannelStatusMap[row.status] || "-" }}
                  </el-tag>
                </div>
              </template>
              <div class="channel-card__body">
                <div class="channel-card__item">
                  <span>商户号</span>
                  <strong>{{ row.merchantNo || "-" }}</strong>
                </div>
                <div class="channel-card__item">
                  <span>Provider SPI</span>
                  <strong>{{ row.providerSpi || "default" }}</strong>
                </div>
                <div class="channel-card__item">
                  <span>回调覆盖</span>
                  <strong>{{ row.notifyUrl || "跟随商户统一回调" }}</strong>
                </div>
                <div class="channel-card__item">
                  <span>浏览器回跳</span>
                  <strong>{{ row.returnUrl || "跟随商户默认回跳" }}</strong>
                </div>
                <div class="capability-list">
                  <el-tag :type="row.apiKeyConfigured ? 'success' : 'info'" effect="plain">API Key</el-tag>
                  <el-tag :type="row.privateKeyConfigured ? 'success' : 'info'" effect="plain">私钥</el-tag>
                  <el-tag :type="row.publicKeyConfigured ? 'success' : 'info'" effect="plain">公钥</el-tag>
                  <el-tag :type="row.certConfigured ? 'success' : 'info'" effect="plain">证书</el-tag>
                  <el-tag effect="plain">{{ row.onboardingStatusDesc || OnboardingStatusMap[row.onboardingStatus] || "未开始" }}</el-tag>
                </div>
                <div class="payment-icon-actions">
                  <el-tooltip content="编辑支付方式">
                    <el-button circle :icon="Edit" @click="openChannelDialog(row)" />
                  </el-tooltip>
                  <el-tooltip :content="row.status === 1 ? '禁用支付方式' : '启用支付方式'">
                    <el-button circle :type="row.status === 1 ? 'warning' : 'success'" :icon="row.status === 1 ? SwitchButton : CircleCheck" @click="toggleChannelStatus(row)" />
                  </el-tooltip>
                  <el-tooltip content="删除支付方式">
                    <el-button circle type="danger" :icon="Delete" @click="removeChannel(row)" />
                  </el-tooltip>
                </div>
              </div>
            </el-card>
          </template>
        </ScTable>
      </template>
    </el-drawer>

    <el-dialog v-model="channelDialogVisible" :title="channelForm.id ? '编辑支付方式' : '新增支付方式'" width="860px">
      <el-form label-width="120px">
        <div class="payment-form-grid">
          <el-form-item label="渠道类型" required>
            <el-select v-model="channelForm.channelType" placeholder="请选择" @change="handleChannelTypeChange">
              <el-option v-for="item in catalogTypes" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
          <el-form-item label="子类型" required>
            <el-select v-model="channelForm.channelSubType" placeholder="请选择">
              <el-option v-for="item in channelSubTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
          <el-form-item label="显示名称" required>
            <el-input v-model="channelForm.channelName" placeholder="例如：微信 JSAPI 正式" />
          </el-form-item>
          <el-form-item label="Provider SPI">
            <el-select v-model="channelForm.providerSpi" clearable placeholder="默认 default">
              <el-option v-for="item in providerOptions" :key="item.extensionName" :label="item.extensionName" :value="item.extensionName" />
            </el-select>
          </el-form-item>
          <el-form-item label="AppId">
            <el-input v-model="channelForm.appId" placeholder="可选" />
          </el-form-item>
          <el-form-item label="商户号">
            <el-input v-model="channelForm.merchantNo" placeholder="渠道商户号" />
          </el-form-item>
          <el-form-item label="结果回调" class="payment-form-span-2">
            <el-input v-model="channelForm.notifyUrl" placeholder="仅当前支付方式覆盖商户统一结果回调；用于支付、转账、退款渠道级回调" />
          </el-form-item>
          <el-form-item label="浏览器回跳" class="payment-form-span-2">
            <el-input v-model="channelForm.returnUrl" placeholder="仅当前支付方式覆盖浏览器支付完成跳转地址" />
          </el-form-item>
          <el-form-item label="开户状态">
            <el-select v-model="channelForm.onboardingStatus" placeholder="请选择">
              <el-option label="未开始" value="NOT_STARTED" />
              <el-option label="开通中" value="IN_PROGRESS" />
              <el-option label="已开通" value="COMPLETED" />
            </el-select>
          </el-form-item>
          <el-form-item label="开户链接">
            <el-input v-model="channelForm.onboardingLink" placeholder="可选" />
          </el-form-item>
          <el-form-item label="沙箱模式">
            <el-select v-model="channelForm.sandboxMode">
              <el-option label="关闭" :value="0" />
              <el-option label="开启" :value="1" />
            </el-select>
          </el-form-item>
          <el-form-item label="启用状态">
            <el-select v-model="channelForm.status">
              <el-option label="禁用" :value="0" />
              <el-option label="启用" :value="1" />
            </el-select>
          </el-form-item>
          <el-form-item label="扩展配置" class="payment-form-span-2">
            <el-input v-model="channelForm.extConfig" type="textarea" :rows="5" placeholder="JSON 字符串，例如综合支付 targetChannelId 配置" />
          </el-form-item>
        </div>
      </el-form>
      <div v-if="selectedGuide" class="payment-note">
        <strong>{{ selectedGuide.title }}</strong>
        {{ selectedGuide.summary || "按渠道官方要求补齐 appId、商户号、密钥与证书。" }}
      </div>
      <template #footer>
        <el-button @click="channelDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="channelSaving" @click="submitChannel">保存</el-button>
      </template>
    </el-dialog>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { CircleCheck, CreditCard, Delete, Edit, Plus, RefreshRight, Search, Setting, SwitchButton } from "@element-plus/icons-vue";
import {
  activateMerchant,
  createChannel,
  createMerchant,
  deactivateMerchant,
  deleteChannel,
  deleteMerchant,
  disableChannel,
  enableChannel,
  getChannelCatalog,
  getMerchantChannels,
  getMerchantDetail,
  getMerchantList,
  getMerchantPaymentConfig,
  getMerchantWalletLimit,
  getProviderOptions,
  updateChannel,
  updateMerchant,
  updateMerchantPaymentConfig,
  updateMerchantWalletLimit,
} from "../api/payment";
import type {
  ChannelForm,
  Merchant,
  MerchantChannel,
  MerchantPaymentConfig,
  MerchantWalletLimit,
  PaymentMethodGuide,
  ProviderSpiOption,
} from "../types/payment";
import { ChannelStatusMap, ChannelSubTypeOptions, ChannelTypeMap, MerchantStatusMap, OnboardingStatusMap } from "../types/payment";
import { normalizeTableResult } from "./support/paymentView";

const tableRef = ref();

const queryForm = reactive({
  merchantName: "",
  status: undefined as number | undefined,
});

const stats = reactive({
  total: 0,
  active: 0,
  configured: 0,
});

const merchantDialogVisible = ref(false);
const merchantSaving = ref(false);
const merchantForm = reactive(createMerchantForm());

const activeMerchant = ref<Merchant | null>(null);
const settingDrawerVisible = ref(false);
const settingSaving = ref(false);
const settingTab = ref("base");
const settingState = reactive(createMerchantForm());
const paymentConfigState = reactive<MerchantPaymentConfig>({
  merchantId: 0,
  orderReusable: false,
  orderTimeoutMinutes: 30,
  pendingOrderLimit: 0,
  autoCancelTimeoutOrder: false,
});
const walletLimitState = reactive<MerchantWalletLimit>({
  merchantId: 0,
});

const channelDrawerVisible = ref(false);
const channelDialogVisible = ref(false);
const channelSaving = ref(false);
const channelKeyword = ref("");
const channelList = ref<MerchantChannel[]>([]);
const channelCatalog = ref<PaymentMethodGuide[]>([]);
const providerOptions = ref<ProviderSpiOption[]>([]);
const channelForm = reactive(createChannelForm());

const filteredChannels = computed(() =>
  channelList.value.filter((item) => {
    const keyword = channelKeyword.value.trim().toLowerCase();
    if (!keyword) {
      return true;
    }
    return [item.channelName, item.channelType, item.channelSubType].some((value) =>
      String(value ?? "").toLowerCase().includes(keyword),
    );
  }),
);
const channelCardData = computed(() => normalizeTableResult(filteredChannels.value, filteredChannels.value.length));
const channelSubTypeOptions = computed(() => ChannelSubTypeOptions[channelForm.channelType] || []);
const catalogTypes = computed(() => {
  const seen = new Set<string>();
  return channelCatalog.value
    .filter((item) => {
      if (seen.has(item.channelType)) {
        return false;
      }
      seen.add(item.channelType);
      return true;
    })
    .map((item) => ({ label: ChannelTypeMap[item.channelType] || item.channelType, value: item.channelType }));
});
const selectedGuide = computed(() =>
  channelCatalog.value.find((item) => item.channelType === channelForm.channelType && item.channelSubType === channelForm.channelSubType),
);

async function fetchMerchantTable(params: Record<string, unknown>) {
  return getMerchantList({
    page: params.page,
    size: params.pageSize,
    merchantName: params.merchantName,
    status: params.status,
  });
}

async function loadStats() {
  const res = await getMerchantList({ page: 1, size: 200 });
  const records = res.data.records || [];
  stats.total = res.data.total || 0;
  stats.active = records.filter((item) => item.status === 1).length;
  stats.configured = records.filter((item) => Number(item.channelCount || 0) > 0).length;
}

async function refreshAll(showError = true) {
  try {
    await Promise.all([loadStats(), tableRef.value?.reload({ ...queryForm }, 1)]);
  } catch (error) {
    console.error(error);
    if (showError) {
      ElMessage.error("商户数据加载失败");
    }
  }
}

function handleSearch() {
  tableRef.value?.reload({ ...queryForm }, 1);
}

function handleReset() {
  queryForm.merchantName = "";
  queryForm.status = undefined;
  handleSearch();
}

function openMerchantDialog(row?: Merchant) {
  Object.assign(merchantForm, createMerchantForm(), row ? { ...row } : {});
  merchantDialogVisible.value = true;
}

async function submitMerchant() {
  if (!merchantForm.merchantName.trim()) {
    ElMessage.error("商户名称不能为空");
    return;
  }
  merchantSaving.value = true;
  try {
    if (merchantForm.id) {
      await updateMerchant(merchantForm.id, merchantForm);
    } else {
      await createMerchant(merchantForm);
    }
    ElMessage.success("商户保存成功");
    merchantDialogVisible.value = false;
    await refreshAll();
  } finally {
    merchantSaving.value = false;
  }
}

async function toggleMerchantStatus(row: Merchant) {
  if (row.status === 1) {
    await deactivateMerchant(row.id);
    ElMessage.success("商户已停用");
  } else {
    await activateMerchant(row.id);
    ElMessage.success("商户已激活");
  }
  await refreshAll();
}

async function removeMerchant(row: Merchant) {
  await ElMessageBox.confirm(`确认删除商户 ${row.merchantName} 吗？`, "删除确认", { type: "warning" });
  await deleteMerchant(row.id);
  ElMessage.success("商户已删除");
  await refreshAll();
}

async function openSettingDrawer(row: Merchant) {
  const [detailRes, paymentConfigRes, walletLimitRes] = await Promise.all([
    getMerchantDetail(row.id),
    getMerchantPaymentConfig(row.id),
    getMerchantWalletLimit(row.id),
  ]);
  activeMerchant.value = detailRes.data;
  Object.assign(settingState, createMerchantForm(), detailRes.data);
  Object.assign(paymentConfigState, { merchantId: row.id, orderReusable: false, orderTimeoutMinutes: 30, pendingOrderLimit: 0, autoCancelTimeoutOrder: false }, paymentConfigRes.data);
  Object.assign(walletLimitState, { merchantId: row.id }, walletLimitRes.data);
  settingTab.value = "base";
  settingDrawerVisible.value = true;
}

async function saveMerchantSettings() {
  if (!activeMerchant.value) {
    return;
  }
  settingSaving.value = true;
  try {
    await Promise.all([
      updateMerchant(activeMerchant.value.id, settingState),
      updateMerchantPaymentConfig(activeMerchant.value.id, paymentConfigState),
      updateMerchantWalletLimit(activeMerchant.value.id, walletLimitState),
    ]);
    ElMessage.success("商户设置已保存");
    settingDrawerVisible.value = false;
    await refreshAll();
  } finally {
    settingSaving.value = false;
  }
}

async function openChannelDrawer(row: Merchant) {
  activeMerchant.value = row;
  channelKeyword.value = "";
  if (channelCatalog.value.length === 0) {
    const catalogRes = await getChannelCatalog();
    channelCatalog.value = catalogRes.data || [];
  }
  const res = await getMerchantChannels(row.id);
  channelList.value = res.data || [];
  channelDrawerVisible.value = true;
}

async function openChannelDialog(row?: MerchantChannel) {
  if (!activeMerchant.value) {
    return;
  }
  Object.assign(channelForm, createChannelForm(), row ? { ...row } : { merchantId: activeMerchant.value.id, status: 1, sandboxMode: 0 });
  await handleChannelTypeChange(channelForm.channelType);
  channelDialogVisible.value = true;
}

async function handleChannelTypeChange(value?: string) {
  if (!value) {
    providerOptions.value = [];
    channelForm.channelSubType = "";
    return;
  }
  const res = await getProviderOptions(value);
  providerOptions.value = res.data || [];
  if (!providerOptions.value.find((item) => item.extensionName === channelForm.providerSpi)) {
    channelForm.providerSpi = providerOptions.value.find((item) => item.defaultOption)?.extensionName || "";
  }
  if (!channelSubTypeOptions.value.find((item) => item.value === channelForm.channelSubType)) {
    channelForm.channelSubType = channelSubTypeOptions.value[0]?.value || "";
  }
}

async function submitChannel() {
  if (!activeMerchant.value || !channelForm.channelType || !channelForm.channelSubType || !channelForm.channelName.trim()) {
    ElMessage.error("渠道类型、子类型和显示名称不能为空");
    return;
  }
  channelSaving.value = true;
  try {
    const payload: ChannelForm = {
      ...channelForm,
      merchantId: activeMerchant.value.id,
    };
    if (channelForm.id) {
      await updateChannel(channelForm.id, payload);
    } else {
      await createChannel(payload);
    }
    ElMessage.success("支付方式已保存");
    channelDialogVisible.value = false;
    await openChannelDrawer(activeMerchant.value);
    await refreshAll();
  } finally {
    channelSaving.value = false;
  }
}

async function toggleChannelStatus(row: MerchantChannel) {
  if (row.status === 1) {
    await disableChannel(row.id);
    ElMessage.success("支付方式已禁用");
  } else {
    await enableChannel(row.id);
    ElMessage.success("支付方式已启用");
  }
  if (activeMerchant.value) {
    await openChannelDrawer(activeMerchant.value);
  }
  await refreshAll();
}

async function removeChannel(row: MerchantChannel) {
  await ElMessageBox.confirm(`确认删除支付方式 ${row.channelName} 吗？`, "删除确认", { type: "warning" });
  await deleteChannel(row.id);
  ElMessage.success("支付方式已删除");
  if (activeMerchant.value) {
    await openChannelDrawer(activeMerchant.value);
  }
  await refreshAll();
}

function merchantStatusTag(status?: number) {
  if (status === 1) {
    return "success";
  }
  if (status === 2) {
    return "warning";
  }
  if (status === 3) {
    return "info";
  }
  return "";
}

function createMerchantForm() {
  return {
    id: undefined as number | undefined,
    merchantName: "",
    contactName: "",
    contactPhone: "",
    contactEmail: "",
    businessLicense: "",
    legalPerson: "",
    defaultNotifyUrl: "",
    defaultReturnUrl: "",
    walletEnabled: false,
    compositeEnabled: false,
    autoCloseEnabled: false,
    autoCloseMinutes: 30,
    remark: "",
  };
}

function createChannelForm() {
  return {
    id: undefined as number | undefined,
    merchantId: 0,
    channelType: "",
    channelSubType: "",
    channelName: "",
    appId: "",
    merchantNo: "",
    apiKey: "",
    privateKey: "",
    publicKey: "",
    certPath: "",
    sandboxMode: 0,
    notifyUrl: "",
    returnUrl: "",
    onboardingStatus: "NOT_STARTED",
    onboardingLink: "",
    status: 1,
    providerSpi: "",
    extConfig: "",
  };
}

onMounted(async () => {
  await refreshAll(false);
});
</script>

<style scoped>
@import "./support/payment-page.css";

.merchant-page {
  background: linear-gradient(180deg, #eef8fa 0%, #f7fbfb 180px, #f7f8fa 100%);
}

.cell-main {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.cell-main strong {
  color: #101828;
}

.cell-main span {
  color: #667085;
  line-height: 1.6;
}

.capability-list {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.setting-switch-grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  margin-bottom: 18px;
}

.auto-close-form,
.drawer-form {
  margin-top: 12px;
}

.drawer-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 20px;
}

.drawer-toolbar {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 18px;
}

.channel-card {
  border-radius: 20px;
  border: 1px solid rgba(205, 216, 222, 0.96);
}

.channel-card__header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
}

.channel-card__header p {
  margin: 8px 0 0;
  color: #667085;
}

.channel-card__body {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.channel-card__item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.channel-card__item span {
  color: #667085;
  font-size: 12px;
}

.channel-card__item strong {
  color: #101828;
  line-height: 1.7;
}

@media (max-width: 980px) {
  .setting-switch-grid {
    grid-template-columns: 1fr;
  }
}
</style>
