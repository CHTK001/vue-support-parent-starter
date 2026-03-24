<template>
  <section class="view">
    <div class="hero-grid">
      <article class="hero-card">
        <p>商户总数</p>
        <strong>{{ pagination.total }}</strong>
        <span>统一维护商户主体、默认回调地址和自动关单策略。</span>
      </article>
      <article class="hero-card">
        <p>激活商户</p>
        <strong>{{ activeMerchantCount }}</strong>
        <span>只有激活商户才允许继续创建支付订单。</span>
      </article>
      <article class="hero-card">
        <p>已配置支付方式</p>
        <strong>{{ totalChannelCount }}</strong>
        <span>商户下支持微信、支付宝、综合支付和钱包。</span>
      </article>
    </div>

    <el-card class="panel">
      <template #header>
        <div class="panel__header">
          <div>
            <p class="panel__eyebrow">Merchant Ops</p>
            <h3>商户与支付方式</h3>
          </div>
          <el-button type="primary" @click="openMerchantDialog()">新增商户</el-button>
        </div>
      </template>

      <el-form :inline="true" :model="searchForm" class="toolbar">
        <el-form-item label="商户名称">
          <el-input v-model="searchForm.merchantName" placeholder="请输入商户名称" clearable />
        </el-form-item>
        <el-form-item label="商户状态">
          <el-select v-model="searchForm.status" placeholder="全部状态" clearable style="width: 180px">
            <el-option v-for="(label, value) in MerchantStatusMap" :key="value" :label="label" :value="Number(value)" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleResetSearch">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="merchantList" v-loading="loading" class="table" border>
        <el-table-column prop="merchantName" label="商户名称" min-width="180" />
        <el-table-column prop="merchantNo" label="商户号" width="200" />
        <el-table-column label="联系人" width="150">
          <template #default="{ row }">
            {{ row.contactName || "-" }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="120">
          <template #default="{ row }">
            <el-tag :type="merchantStatusTag(row.status)">{{ row.statusDesc || MerchantStatusMap[row.status] }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="能力开关" min-width="210">
          <template #default="{ row }">
            <div class="tag-row">
              <el-tag v-if="row.walletEnabled" effect="plain">钱包</el-tag>
              <el-tag v-if="row.compositeEnabled" effect="plain" type="warning">综合支付</el-tag>
              <el-tag v-if="row.autoCloseEnabled" effect="plain" type="info">
                自动关单 {{ row.autoCloseMinutes || 30 }} 分钟
              </el-tag>
              <span v-if="!row.walletEnabled && !row.compositeEnabled && !row.autoCloseEnabled">-</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="channelCount" label="支付方式数" width="120" />
        <el-table-column prop="createdAt" label="创建时间" width="180" />
        <el-table-column label="操作" width="520" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openMerchantDialog(row)">编辑</el-button>
            <el-button link type="primary" @click="openChannelDrawer(row)">支付方式</el-button>
            <el-button link type="primary" @click="openPaymentConfigDialog(row)">支付规则</el-button>
            <el-button link type="primary" @click="openWalletLimitDialog(row)">钱包限额</el-button>
            <el-button v-if="row.status !== 1" link type="success" @click="handleActivate(row)">激活</el-button>
            <el-button v-else link type="warning" @click="handleDeactivate(row)">停用</el-button>
            <el-button link type="danger" @click="handleDeleteMerchant(row)">删除</el-button>
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
        @current-change="loadMerchants"
        @size-change="loadMerchants"
      />
    </el-card>

    <el-dialog v-model="merchantDialogVisible" :title="editingMerchant ? '编辑商户' : '新增商户'" width="760px">
      <el-form ref="merchantFormRef" :model="merchantForm" label-width="110px">
        <div class="form-grid">
          <el-form-item label="商户名称" required>
            <el-input v-model="merchantForm.merchantName" placeholder="请输入商户名称" />
          </el-form-item>
          <el-form-item label="联系人">
            <el-input v-model="merchantForm.contactName" placeholder="请输入联系人" />
          </el-form-item>
          <el-form-item label="联系电话">
            <el-input v-model="merchantForm.contactPhone" placeholder="请输入联系电话" />
          </el-form-item>
          <el-form-item label="联系邮箱">
            <el-input v-model="merchantForm.contactEmail" placeholder="请输入联系邮箱" />
          </el-form-item>
          <el-form-item label="法人">
            <el-input v-model="merchantForm.legalPerson" placeholder="请输入法人姓名" />
          </el-form-item>
          <el-form-item label="营业执照">
            <el-input v-model="merchantForm.businessLicense" placeholder="请输入营业执照号" />
          </el-form-item>
          <el-form-item label="默认回调地址" class="span-2">
            <el-input v-model="merchantForm.defaultNotifyUrl" placeholder="例如：https://example.com/pay/notify" />
          </el-form-item>
          <el-form-item label="默认返回地址" class="span-2">
            <el-input v-model="merchantForm.defaultReturnUrl" placeholder="例如：https://example.com/pay/return" />
          </el-form-item>
          <el-form-item label="自动关单">
            <el-switch v-model="merchantForm.autoCloseEnabled" />
          </el-form-item>
          <el-form-item label="超时分钟">
            <el-input-number v-model="merchantForm.autoCloseMinutes" :min="1" :max="1440" />
          </el-form-item>
          <el-form-item label="钱包能力">
            <el-switch v-model="merchantForm.walletEnabled" />
          </el-form-item>
          <el-form-item label="综合支付">
            <el-switch v-model="merchantForm.compositeEnabled" />
          </el-form-item>
          <el-form-item label="备注" class="span-2">
            <el-input v-model="merchantForm.remark" type="textarea" :rows="3" placeholder="补充说明商户用途或特殊配置" />
          </el-form-item>
        </div>
      </el-form>
      <template #footer>
        <el-button @click="merchantDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submittingMerchant" @click="submitMerchant">保存</el-button>
      </template>
    </el-dialog>

    <el-drawer v-model="channelDrawerVisible" size="68%" :title="selectedMerchant ? `${selectedMerchant.merchantName} - 支付方式` : '支付方式配置'">
      <template #header>
        <div class="drawer-header" v-if="selectedMerchant">
          <div>
            <p class="panel__eyebrow">Channel Setup</p>
            <h3>{{ selectedMerchant.merchantName }}</h3>
          </div>
          <el-button type="primary" @click="openChannelDialog()">新增支付方式</el-button>
        </div>
      </template>

      <div class="drawer-summary" v-if="selectedMerchant">
        <el-tag :type="merchantStatusTag(selectedMerchant.status)">
          {{ selectedMerchant.statusDesc || MerchantStatusMap[selectedMerchant.status] }}
        </el-tag>
        <span>默认回调：{{ selectedMerchant.defaultNotifyUrl || "未配置" }}</span>
        <span>自动关单：{{ selectedMerchant.autoCloseEnabled ? `${selectedMerchant.autoCloseMinutes || 30} 分钟` : "关闭" }}</span>
      </div>

      <el-table :data="channelList" v-loading="channelLoading" border>
        <el-table-column label="支付方式" min-width="200">
          <template #default="{ row }">
            <div class="channel-title">
              <strong>{{ row.channelName }}</strong>
              <span>{{ ChannelTypeMap[row.channelType] }} / {{ row.channelSubType }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="配置状态" min-width="220">
          <template #default="{ row }">
            <div class="tag-row">
              <el-tag v-if="row.apiKeyConfigured" effect="plain">API Key</el-tag>
              <el-tag v-if="row.privateKeyConfigured" effect="plain" type="warning">私钥</el-tag>
              <el-tag v-if="row.publicKeyConfigured" effect="plain" type="success">公钥</el-tag>
              <el-tag v-if="row.certConfigured" effect="plain" type="info">证书</el-tag>
              <span v-if="!row.apiKeyConfigured && !row.privateKeyConfigured && !row.publicKeyConfigured && !row.certConfigured">未配置敏感参数</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="开通状态" width="140">
          <template #default="{ row }">
            <el-tag type="warning">{{ row.onboardingStatusDesc || OnboardingStatusMap[row.onboardingStatus] }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="能力状态" width="120">
          <template #default="{ row }">
            <el-tag :type="isExecutableChannel(row.channelType, row.channelSubType) ? 'success' : 'warning'">
              {{ isExecutableChannel(row.channelType, row.channelSubType) ? "可执行" : "仅指引" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="启用状态" width="120">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'">{{ row.statusDesc || ChannelStatusMap[row.status] }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="沙箱" width="90">
          <template #default="{ row }">
            {{ row.sandboxMode === 1 ? "是" : "否" }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="360" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openChannelDialog(row)">编辑</el-button>
            <el-button link type="primary" @click="openGuideDrawerByChannel(row)">开通指引</el-button>
            <el-button v-if="row.status !== 1 && isExecutableChannel(row.channelType, row.channelSubType)" link type="success" @click="handleEnableChannel(row)">启用</el-button>
            <el-button v-if="row.status === 1" link type="warning" @click="handleDisableChannel(row)">禁用</el-button>
            <el-button v-if="row.status !== 1" link type="danger" @click="handleDeleteChannel(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-drawer>

    <el-dialog v-model="channelDialogVisible" :title="editingChannel ? '编辑支付方式' : '新增支付方式'" width="820px">
      <el-form :model="channelForm" label-width="120px">
        <div class="form-grid">
          <el-form-item label="渠道类型" required>
            <el-select v-model="channelForm.channelType" @change="handleChannelTypeChange">
              <el-option label="微信支付" value="WECHAT" />
              <el-option label="支付宝" value="ALIPAY" />
              <el-option label="综合支付" value="COMPOSITE" />
              <el-option label="钱包" value="WALLET" />
            </el-select>
          </el-form-item>
          <el-form-item label="渠道子类型" required>
            <el-select v-model="channelForm.channelSubType">
              <el-option
                v-for="item in availableSubTypes"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item class="span-2">
            <el-alert
              title="FACE_TO_FACE 和 SANDBOX 仅保留在开通指引目录中，本轮不作为可创建/可启用支付子渠道。"
              type="info"
              :closable="false"
              show-icon
            />
          </el-form-item>
          <el-form-item v-if="providerOptions.length" label="Provider SPI">
            <el-select v-model="channelForm.providerSpi" clearable placeholder="默认使用后端全局配置">
              <el-option
                v-for="item in providerOptions"
                :key="item.extensionName"
                :label="item.description ? `${item.extensionName} - ${item.description}` : item.extensionName"
                :value="item.extensionName"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="展示名称">
            <el-input v-model="channelForm.channelName" placeholder="例如：微信小程序支付" />
          </el-form-item>
          <el-form-item label="渠道状态">
            <el-select v-model="channelForm.status">
              <el-option label="禁用" :value="0" />
              <el-option label="启用" :value="1" />
            </el-select>
          </el-form-item>
          <el-form-item v-if="usesThirdPartyCredentials" label="AppID / 应用ID">
            <el-input v-model="channelForm.appId" placeholder="微信 AppID 或支付宝应用 ID" />
          </el-form-item>
          <el-form-item :label="isCompositeChannel ? '路由标识' : '商户号 / PID'">
            <el-input v-model="channelForm.merchantNo" :placeholder="isCompositeChannel ? '可选：内部路由标识' : '商户号、PID 或路由标识'" />
          </el-form-item>
          <el-form-item v-if="usesThirdPartyCredentials" label="API Key">
            <el-input v-model="channelForm.apiKey" type="password" show-password placeholder="留空表示不改动现有密钥" />
          </el-form-item>
          <el-form-item v-if="usesThirdPartyCredentials" label="私钥">
            <el-input v-model="channelForm.privateKey" type="textarea" :rows="3" placeholder="留空表示不改动现有私钥" />
          </el-form-item>
          <el-form-item v-if="channelForm.channelType === 'ALIPAY'" label="公钥">
            <el-input v-model="channelForm.publicKey" type="textarea" :rows="3" placeholder="支付宝公钥或平台公钥" />
          </el-form-item>
          <el-form-item v-if="channelForm.channelType === 'WECHAT'" label="证书路径">
            <el-input v-model="channelForm.certPath" placeholder="例如：/data/cert/apiclient_key.pem" />
          </el-form-item>
          <el-form-item label="支付回调地址" class="span-2">
            <el-input v-model="channelForm.notifyUrl" placeholder="当前支付方式专属回调地址" />
          </el-form-item>
          <el-form-item label="返回地址" class="span-2">
            <el-input v-model="channelForm.returnUrl" placeholder="当前支付方式专属返回地址" />
          </el-form-item>
          <el-form-item label="沙箱模式">
            <el-switch v-model="sandboxEnabled" />
          </el-form-item>
          <el-form-item label="开通状态">
            <el-select v-model="channelForm.onboardingStatus">
              <el-option label="未开始" value="NOT_STARTED" />
              <el-option label="开通中" value="IN_PROGRESS" />
              <el-option label="已开通" value="COMPLETED" />
            </el-select>
          </el-form-item>
          <el-form-item label="开通链接" class="span-2">
            <el-input v-model="channelForm.onboardingLink" placeholder="可覆盖默认官方开通链接" />
          </el-form-item>
          <el-form-item label="扩展配置" class="span-2">
            <el-input v-model="channelForm.extConfig" type="textarea" :rows="4" :placeholder="extConfigPlaceholder" />
          </el-form-item>
        </div>
      </el-form>
      <div class="guide-actions">
        <el-button text type="primary" @click="openGuideDrawerByForm">查看当前支付方式开通指引</el-button>
      </div>
      <template #footer>
        <el-button @click="channelDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submittingChannel" @click="submitChannel">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="paymentConfigDialogVisible" width="720px" :title="selectedMerchant ? `${selectedMerchant.merchantName} - 支付规则` : '支付规则'">
      <el-form :model="paymentConfigForm" label-width="130px">
        <div class="form-grid">
          <el-form-item label="允许重复支付">
            <el-switch v-model="paymentConfigForm.orderReusable" />
          </el-form-item>
          <el-form-item label="自动取消超时订单">
            <el-switch v-model="paymentConfigForm.autoCancelTimeoutOrder" />
          </el-form-item>
          <el-form-item label="订单超时分钟">
            <el-input-number v-model="paymentConfigForm.orderTimeoutMinutes" :min="1" :max="1440" />
          </el-form-item>
          <el-form-item label="待支付订单上限">
            <el-input-number v-model="paymentConfigForm.pendingOrderLimit" :min="1" :max="9999" />
          </el-form-item>
        </div>
      </el-form>
      <template #footer>
        <el-button @click="paymentConfigDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="savingPaymentConfig" @click="submitPaymentConfig">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="walletLimitDialogVisible" width="840px" :title="selectedMerchant ? `${selectedMerchant.merchantName} - 钱包限额` : '钱包限额'">
      <el-form :model="walletLimitForm" label-width="130px">
        <div class="form-grid">
          <el-form-item label="单笔充值限额">
            <el-input-number v-model="walletLimitForm.singleRechargeLimit" :min="0" :precision="2" :step="0.01" />
          </el-form-item>
          <el-form-item label="日充值限额">
            <el-input-number v-model="walletLimitForm.dailyRechargeLimit" :min="0" :precision="2" :step="0.01" />
          </el-form-item>
          <el-form-item label="单笔提现限额">
            <el-input-number v-model="walletLimitForm.singleWithdrawLimit" :min="0" :precision="2" :step="0.01" />
          </el-form-item>
          <el-form-item label="日提现限额">
            <el-input-number v-model="walletLimitForm.dailyWithdrawLimit" :min="0" :precision="2" :step="0.01" />
          </el-form-item>
          <el-form-item label="单笔转账限额">
            <el-input-number v-model="walletLimitForm.singleTransferLimit" :min="0" :precision="2" :step="0.01" />
          </el-form-item>
          <el-form-item label="日转账限额">
            <el-input-number v-model="walletLimitForm.dailyTransferLimit" :min="0" :precision="2" :step="0.01" />
          </el-form-item>
          <el-form-item label="余额上限">
            <el-input-number v-model="walletLimitForm.balanceLimit" :min="0" :precision="2" :step="0.01" />
          </el-form-item>
        </div>
      </el-form>
      <template #footer>
        <el-button @click="walletLimitDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="savingWalletLimit" @click="submitWalletLimit">保存</el-button>
      </template>
    </el-dialog>

    <el-drawer v-model="guideDrawerVisible" size="560px" :title="currentGuide?.title || '开通指引'">
      <template v-if="currentGuide">
        <div class="guide-meta">
          <el-tag type="primary" effect="dark">{{ currentGuide.officialName || "官方平台" }}</el-tag>
          <el-tag v-if="currentGuide.defaultProviderSpi" effect="plain">默认 SPI：{{ currentGuide.defaultProviderSpi }}</el-tag>
          <el-tag v-for="item in currentGuide.availableProviderSpis || []" :key="item" effect="plain" type="warning">
            {{ item }}
          </el-tag>
        </div>
        <div class="guide-block">
          <p class="guide-block__label">概述</p>
          <p>{{ currentGuide.summary }}</p>
        </div>
        <div class="guide-block">
          <p class="guide-block__label">准备资料</p>
          <ul>
            <li v-for="item in currentGuide.requiredMaterials" :key="item">{{ item }}</li>
          </ul>
        </div>
        <div class="guide-block">
          <p class="guide-block__label">开通步骤</p>
          <ol>
            <li v-for="item in currentGuide.steps" :key="item">{{ item }}</li>
          </ol>
        </div>
        <div class="guide-block">
          <p class="guide-block__label">注意事项</p>
          <ul>
            <li v-for="item in currentGuide.tips" :key="item">{{ item }}</li>
          </ul>
        </div>
        <div class="guide-links">
          <el-button v-if="currentGuide.officialUrl" type="primary" @click="openLink(currentGuide.officialUrl)">官方入口</el-button>
          <el-button v-if="currentGuide.applyUrl" @click="openLink(currentGuide.applyUrl)">开通地址</el-button>
          <el-button v-if="currentGuide.sandboxUrl" @click="openLink(currentGuide.sandboxUrl)">沙箱/辅助资料</el-button>
        </div>
      </template>
    </el-drawer>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  activateMerchant,
  createChannel,
  createMerchant,
  deactivateMerchant,
  deleteChannel,
  deleteMerchant,
  enableChannel,
  getChannelCatalog,
  getMerchantChannels,
  getMerchantList,
  getMerchantPaymentConfig,
  getMerchantWalletLimit,
  getProviderOptions,
  updateChannel,
  updateMerchant,
  updateMerchantPaymentConfig,
  updateMerchantWalletLimit,
  disableChannel,
} from "../api/payment";
import type {
  ChannelForm,
  Merchant,
  MerchantChannel,
  MerchantForm,
  MerchantPaymentConfig,
  MerchantWalletLimit,
  PaymentMethodGuide,
} from "../types/payment";
import {
  ChannelStatusMap,
  ChannelSubTypeOptions,
  ChannelTypeMap,
  MerchantStatusMap,
  OnboardingStatusMap,
  isExecutableChannel,
} from "../types/payment";

const loading = ref(false);
const channelLoading = ref(false);
const submittingMerchant = ref(false);
const submittingChannel = ref(false);
const savingPaymentConfig = ref(false);
const savingWalletLimit = ref(false);

const merchantList = ref<Merchant[]>([]);
const channelList = ref<MerchantChannel[]>([]);
const catalog = ref<PaymentMethodGuide[]>([]);
const providerOptions = ref<Array<{ extensionName: string; description?: string }>>([]);

const pagination = reactive({
  page: 1,
  size: 10,
  total: 0,
});

const searchForm = reactive({
  merchantName: "",
  status: undefined as number | undefined,
});

const merchantDialogVisible = ref(false);
const channelDrawerVisible = ref(false);
const channelDialogVisible = ref(false);
const guideDrawerVisible = ref(false);
const paymentConfigDialogVisible = ref(false);
const walletLimitDialogVisible = ref(false);

const editingMerchant = ref<Merchant | null>(null);
const editingChannel = ref<MerchantChannel | null>(null);
const selectedMerchant = ref<Merchant | null>(null);
const currentGuide = ref<PaymentMethodGuide | null>(null);

const merchantForm = reactive<MerchantForm>(createDefaultMerchantForm());
const channelForm = reactive<ChannelForm>(createDefaultChannelForm());
const paymentConfigForm = reactive<MerchantPaymentConfig>({
  merchantId: 0,
  orderReusable: true,
  orderTimeoutMinutes: undefined,
  pendingOrderLimit: undefined,
  autoCancelTimeoutOrder: true,
});
const walletLimitForm = reactive<MerchantWalletLimit>({
  merchantId: 0,
  singleRechargeLimit: undefined,
  dailyRechargeLimit: undefined,
  singleWithdrawLimit: undefined,
  dailyWithdrawLimit: undefined,
  singleTransferLimit: undefined,
  dailyTransferLimit: undefined,
  balanceLimit: undefined,
});

const merchantFormRef = ref();

const activeMerchantCount = computed(() => merchantList.value.filter((item) => item.status === 1).length);
const totalChannelCount = computed(() => merchantList.value.reduce((sum, item) => sum + (item.channelCount || 0), 0));
const availableSubTypes = computed(() => ChannelSubTypeOptions[channelForm.channelType] || []);
const usesThirdPartyCredentials = computed(() => ["WECHAT", "ALIPAY"].includes(channelForm.channelType));
const isCompositeChannel = computed(() => channelForm.channelType === "COMPOSITE");
const extConfigPlaceholder = computed(() => {
  if (channelForm.channelType === "COMPOSITE") {
    return '{"targetChannelId":123,"defaultChannelId":123}';
  }
  if (channelForm.channelType === "WECHAT") {
    return '{"merchantSerialNumber":"微信商户证书序列号"}';
  }
  return '{"serverUrl":"https://openapi.alipay.com/gateway.do"}';
});
const sandboxEnabled = computed({
  get: () => channelForm.sandboxMode === 1,
  set: (value: boolean) => {
    channelForm.sandboxMode = value ? 1 : 0;
  },
});

async function loadMerchants() {
  loading.value = true;
  try {
    const res = await getMerchantList({
      page: pagination.page,
      size: pagination.size,
      merchantName: searchForm.merchantName || undefined,
      status: searchForm.status,
    });
    merchantList.value = res.data.records;
    pagination.total = res.data.total;
  } finally {
    loading.value = false;
  }
}

async function loadCatalog() {
  const res = await getChannelCatalog();
  catalog.value = res.data;
}

async function loadProviderSpiOptions(channelType?: string) {
  if (!channelType || !["WECHAT", "ALIPAY"].includes(channelType)) {
    providerOptions.value = [];
    channelForm.providerSpi = "";
    return;
  }
  const res = await getProviderOptions(channelType);
  providerOptions.value = res.data;
  if (channelForm.providerSpi && !providerOptions.value.find((item) => item.extensionName === channelForm.providerSpi)) {
    channelForm.providerSpi = "";
  }
}

async function loadChannels() {
  if (!selectedMerchant.value) {
    return;
  }
  channelLoading.value = true;
  try {
    const res = await getMerchantChannels(selectedMerchant.value.id);
    channelList.value = res.data;
  } finally {
    channelLoading.value = false;
  }
}

function handleSearch() {
  pagination.page = 1;
  loadMerchants();
}

function handleResetSearch() {
  searchForm.merchantName = "";
  searchForm.status = undefined;
  handleSearch();
}

function openMerchantDialog(merchant?: Merchant) {
  editingMerchant.value = merchant ?? null;
  Object.assign(merchantForm, merchant ? toMerchantForm(merchant) : createDefaultMerchantForm());
  merchantDialogVisible.value = true;
}

async function submitMerchant() {
  if (!merchantForm.merchantName.trim()) {
    ElMessage.error("商户名称不能为空");
    return;
  }
  submittingMerchant.value = true;
  try {
    if (editingMerchant.value) {
      await updateMerchant(editingMerchant.value.id, merchantForm);
      ElMessage.success("商户更新成功");
    } else {
      await createMerchant(merchantForm);
      ElMessage.success("商户创建成功");
    }
    merchantDialogVisible.value = false;
    await loadMerchants();
  } finally {
    submittingMerchant.value = false;
  }
}

async function handleActivate(row: Merchant) {
  await activateMerchant(row.id);
  ElMessage.success("商户已激活");
  await loadMerchants();
}

async function handleDeactivate(row: Merchant) {
  await deactivateMerchant(row.id);
  ElMessage.success("商户已停用");
  await loadMerchants();
}

async function handleDeleteMerchant(row: Merchant) {
  await ElMessageBox.confirm(`确认删除商户「${row.merchantName}」吗？`, "删除确认", { type: "warning" });
  await deleteMerchant(row.id);
  ElMessage.success("商户已删除");
  await loadMerchants();
}

async function openPaymentConfigDialog(merchant: Merchant) {
  selectedMerchant.value = merchant;
  const res = await getMerchantPaymentConfig(merchant.id);
  Object.assign(paymentConfigForm, {
    merchantId: merchant.id,
    orderReusable: res.data.orderReusable ?? true,
    orderTimeoutMinutes: res.data.orderTimeoutMinutes,
    pendingOrderLimit: res.data.pendingOrderLimit,
    autoCancelTimeoutOrder: res.data.autoCancelTimeoutOrder ?? true,
  });
  paymentConfigDialogVisible.value = true;
}

async function submitPaymentConfig() {
  if (!selectedMerchant.value) {
    return;
  }
  savingPaymentConfig.value = true;
  try {
    await updateMerchantPaymentConfig(selectedMerchant.value.id, paymentConfigForm);
    ElMessage.success("商户支付规则已保存");
    paymentConfigDialogVisible.value = false;
  } finally {
    savingPaymentConfig.value = false;
  }
}

async function openWalletLimitDialog(merchant: Merchant) {
  selectedMerchant.value = merchant;
  const res = await getMerchantWalletLimit(merchant.id);
  Object.assign(walletLimitForm, {
    merchantId: merchant.id,
    singleRechargeLimit: res.data.singleRechargeLimit,
    dailyRechargeLimit: res.data.dailyRechargeLimit,
    singleWithdrawLimit: res.data.singleWithdrawLimit,
    dailyWithdrawLimit: res.data.dailyWithdrawLimit,
    singleTransferLimit: res.data.singleTransferLimit,
    dailyTransferLimit: res.data.dailyTransferLimit,
    balanceLimit: res.data.balanceLimit,
  });
  walletLimitDialogVisible.value = true;
}

async function submitWalletLimit() {
  if (!selectedMerchant.value) {
    return;
  }
  savingWalletLimit.value = true;
  try {
    await updateMerchantWalletLimit(selectedMerchant.value.id, walletLimitForm);
    ElMessage.success("商户钱包限额已保存");
    walletLimitDialogVisible.value = false;
  } finally {
    savingWalletLimit.value = false;
  }
}

async function openChannelDrawer(merchant: Merchant) {
  selectedMerchant.value = merchant;
  channelDrawerVisible.value = true;
  await loadChannels();
}

async function openChannelDialog(channel?: MerchantChannel) {
  if (!selectedMerchant.value) {
    return;
  }
  editingChannel.value = channel ?? null;
  Object.assign(
    channelForm,
    channel
      ? toChannelForm(channel)
      : {
          ...createDefaultChannelForm(),
          merchantId: selectedMerchant.value.id,
        }
  );
  await loadProviderSpiOptions(channelForm.channelType);
  if (!channelForm.channelSubType && availableSubTypes.value.length > 0) {
    channelForm.channelSubType = availableSubTypes.value[0].value;
  }
  channelDialogVisible.value = true;
}

async function handleChannelTypeChange(type: string) {
  const options = ChannelSubTypeOptions[type] || [];
  channelForm.channelSubType = options[0]?.value || "";
  await loadProviderSpiOptions(type);
}

async function submitChannel() {
  if (!selectedMerchant.value) {
    return;
  }
  if (!channelForm.channelType || !channelForm.channelSubType) {
    ElMessage.error("请选择支付方式类型和子类型");
    return;
  }
  submittingChannel.value = true;
  try {
    channelForm.merchantId = selectedMerchant.value.id;
    if (editingChannel.value) {
      await updateChannel(editingChannel.value.id, channelForm);
      ElMessage.success("支付方式更新成功");
    } else {
      await createChannel(channelForm);
      ElMessage.success("支付方式创建成功");
    }
    channelDialogVisible.value = false;
    await loadChannels();
    await loadMerchants();
  } finally {
    submittingChannel.value = false;
  }
}

async function handleEnableChannel(row: MerchantChannel) {
  if (!isExecutableChannel(row.channelType, row.channelSubType)) {
    ElMessage.warning("当前渠道为仅指引能力，不能启用执行");
    return;
  }
  await enableChannel(row.id);
  ElMessage.success("支付方式已启用");
  await loadChannels();
}

async function handleDisableChannel(row: MerchantChannel) {
  await disableChannel(row.id);
  ElMessage.success("支付方式已禁用");
  await loadChannels();
}

async function handleDeleteChannel(row: MerchantChannel) {
  await ElMessageBox.confirm(`确认删除支付方式「${row.channelName}」吗？`, "删除支付方式", { type: "warning" });
  await deleteChannel(row.id);
  ElMessage.success("支付方式已删除");
  await Promise.all([loadChannels(), loadMerchants()]);
}

function openGuideDrawerByChannel(row: MerchantChannel) {
  currentGuide.value = findGuide(row.channelType, row.channelSubType);
  guideDrawerVisible.value = true;
}

function openGuideDrawerByForm() {
  currentGuide.value = findGuide(channelForm.channelType, channelForm.channelSubType);
  if (!currentGuide.value) {
    ElMessage.warning("当前支付方式暂无预置开通指引");
    return;
  }
  guideDrawerVisible.value = true;
}

function findGuide(channelType?: string, channelSubType?: string) {
  return (
    catalog.value.find((item) => item.channelType === channelType && item.channelSubType === channelSubType) ||
    catalog.value.find((item) => item.channelType === channelType) ||
    null
  );
}

function openLink(url?: string) {
  if (!url) {
    return;
  }
  window.open(url, "_blank", "noopener,noreferrer");
}

function merchantStatusTag(status: number) {
  if (status === 1) {
    return "success";
  }
  if (status === 2) {
    return "warning";
  }
  if (status === 3) {
    return "info";
  }
  return "danger";
}

function createDefaultMerchantForm(): MerchantForm {
  return {
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
    autoCloseEnabled: true,
    autoCloseMinutes: 30,
    remark: "",
  };
}

function createDefaultChannelForm(): ChannelForm {
  return {
    merchantId: 0,
    channelType: "WECHAT",
    channelSubType: "MINI_PROGRAM",
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
    status: 0,
    providerSpi: "",
    extConfig: "",
  };
}

function toMerchantForm(merchant: Merchant): MerchantForm {
  return {
    merchantName: merchant.merchantName,
    contactName: merchant.contactName || "",
    contactPhone: merchant.contactPhone || "",
    contactEmail: merchant.contactEmail || "",
    businessLicense: merchant.businessLicense || "",
    legalPerson: merchant.legalPerson || "",
    defaultNotifyUrl: merchant.defaultNotifyUrl || "",
    defaultReturnUrl: merchant.defaultReturnUrl || "",
    walletEnabled: !!merchant.walletEnabled,
    compositeEnabled: !!merchant.compositeEnabled,
    autoCloseEnabled: !!merchant.autoCloseEnabled,
    autoCloseMinutes: merchant.autoCloseMinutes || 30,
    remark: merchant.remark || "",
  };
}

function toChannelForm(channel: MerchantChannel): ChannelForm {
  return {
    merchantId: channel.merchantId,
    channelType: channel.channelType,
    channelSubType: channel.channelSubType,
    channelName: channel.channelName,
    appId: channel.appId || "",
    merchantNo: channel.merchantNo || "",
    apiKey: "",
    privateKey: "",
    publicKey: "",
    certPath: "",
    sandboxMode: channel.sandboxMode || 0,
    notifyUrl: channel.notifyUrl || "",
    returnUrl: channel.returnUrl || "",
    onboardingStatus: channel.onboardingStatus,
    onboardingLink: channel.onboardingLink || "",
    status: channel.status,
    providerSpi: channel.providerSpi || "",
    extConfig: channel.extConfig || "",
  };
}

onMounted(async () => {
  await Promise.all([loadMerchants(), loadCatalog()]);
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
  border: 1px solid rgba(128, 84, 46, 0.08);
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
  display: block;
  color: #705847;
  line-height: 1.7;
}

.panel__header,
.drawer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.panel__header h3,
.drawer-header h3 {
  margin: 0;
  font-size: 24px;
  font-family: "STZhongsong", "Noto Serif SC", Georgia, serif;
}

.panel__eyebrow {
  margin: 0 0 6px;
  font-size: 12px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: #bf8445;
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

.tag-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 6px 18px;
}

.span-2 {
  grid-column: 1 / -1;
}

.drawer-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 16px;
  margin-bottom: 16px;
  color: #6e5744;
}

.channel-title {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.channel-title strong {
  color: #23170f;
}

.channel-title span {
  color: #7d6450;
  font-size: 13px;
}

.guide-actions {
  margin-top: 8px;
}

.guide-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 14px;
}

.guide-block {
  margin-bottom: 18px;
  padding: 16px 18px;
  background: #f9f5ef;
  border-radius: 18px;
}

.guide-block p,
.guide-block ul,
.guide-block ol {
  margin: 0;
}

.guide-block__label {
  margin-bottom: 10px !important;
  color: #a56b32;
  font-size: 12px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.guide-block ul,
.guide-block ol {
  padding-left: 18px;
  line-height: 1.8;
}

.guide-links {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
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
