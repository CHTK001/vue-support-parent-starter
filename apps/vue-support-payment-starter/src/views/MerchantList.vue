<template>
  <section class="ops-view merchant-view">
    <div class="ops-hero">
      <article class="ops-hero__intro">
        <p class="ops-kicker">Merchant Ops</p>
        <h3 class="ops-title">商户、渠道与开通指引统一在一个控制面完成编排</h3>
        <p class="ops-copy">
          这里同时承担商户主体管理、支付方式开通、密钥掩码展示和能力状态校验。
          钱包与综合支付是平台内建能力，微信和支付宝则按已实现的子渠道矩阵开放。
        </p>
        <div class="ops-ribbon">
          <span class="ops-ribbon__item">可执行渠道 {{ executableGuideCount }}</span>
          <span class="ops-ribbon__item">仅指引能力 {{ guideOnlyGuideCount }}</span>
          <span class="ops-ribbon__item">默认 Provider SPI 已接入</span>
        </div>
      </article>

      <div class="ops-hero__stats">
        <article class="ops-stat">
          <p class="ops-stat__label">商户总数</p>
          <strong class="ops-stat__value">{{ pagination.total }}</strong>
          <p class="ops-stat__desc">统一维护商户主体、默认回调地址和自动关单策略。</p>
        </article>
        <article class="ops-stat">
          <p class="ops-stat__label">激活商户</p>
          <strong class="ops-stat__value">{{ activeMerchantCount }}</strong>
          <p class="ops-stat__desc">只有激活商户才允许继续创建支付订单和钱包账户。</p>
        </article>
        <article class="ops-stat">
          <p class="ops-stat__label">已配置支付方式</p>
          <strong class="ops-stat__value">{{ totalChannelCount }}</strong>
          <p class="ops-stat__desc">覆盖微信、支付宝、综合支付与钱包余额四类路径。</p>
        </article>
        <article class="ops-stat">
          <p class="ops-stat__label">当前巡检焦点</p>
          <strong class="ops-stat__value">{{ activeMerchantCount ? "联调中" : "待开通" }}</strong>
          <p class="ops-stat__desc">第三方渠道可走 mock，钱包能力可在本地完成真实闭环验证。</p>
        </article>
      </div>
    </div>

    <el-card class="ops-panel">
      <template #header>
        <div class="panel__header">
          <div>
            <p class="panel__eyebrow">Merchant Ops</p>
            <h3>商户与支付方式</h3>
          </div>
          <el-button type="primary" @click="openMerchantDialog()">新增商户</el-button>
        </div>
      </template>

      <div class="ops-toolbar">
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

        <div class="ops-toolbar__meta">
          <span class="ops-chip">商户待审核 {{ pendingMerchantCount }}</span>
          <span class="ops-chip">钱包已开启 {{ walletMerchantCount }}</span>
          <span class="ops-chip">综合支付已开启 {{ compositeMerchantCount }}</span>
        </div>
      </div>

      <div class="ops-table">
        <el-table :data="merchantList" v-loading="loading" border>
        <el-table-column label="商户名称" min-width="220">
          <template #default="{ row }">
            <div class="merchant-title">
              <strong>{{ row.merchantName }}</strong>
              <span>{{ row.contactName || "未填写联系人" }} / {{ row.contactPhone || "未填写手机号" }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="merchantNo" label="商户号" width="200" />
        <el-table-column label="回调配置" min-width="220">
          <template #default="{ row }">
            <div class="cell-stack">
              <span>Notify: {{ row.defaultNotifyUrl || "-" }}</span>
              <span>Return: {{ row.defaultReturnUrl || "-" }}</span>
            </div>
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
        <el-table-column label="操作" width="360" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openMerchantDialog(row)">编辑</el-button>
            <el-button link type="primary" @click="openChannelDrawer(row)">支付方式</el-button>
            <el-button v-if="row.status !== 1" link type="success" @click="handleActivate(row)">激活</el-button>
            <el-button v-else link type="warning" @click="handleDeactivate(row)">停用</el-button>
            <el-button link type="danger" @click="handleDeleteMerchant(row)">删除</el-button>
          </template>
        </el-table-column>
        </el-table>
      </div>

      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.size"
        :total="pagination.total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next, jumper"
        class="ops-pager"
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

      <div class="ops-split" v-if="selectedMerchant">
        <div class="ops-subpanel">
          <p class="ops-kicker">Merchant Snapshot</p>
          <h4 class="drawer-title">{{ selectedMerchant.merchantName }}</h4>
          <p class="ops-section-copy">
            默认回调：{{ selectedMerchant.defaultNotifyUrl || "未配置" }}<br />
            返回地址：{{ selectedMerchant.defaultReturnUrl || "未配置" }}
          </p>
          <div class="ops-ribbon drawer-ribbon">
            <span class="ops-ribbon__item">
              {{ selectedMerchant.statusDesc || MerchantStatusMap[selectedMerchant.status] }}
            </span>
            <span class="ops-ribbon__item">
              自动关单 {{ selectedMerchant.autoCloseEnabled ? `${selectedMerchant.autoCloseMinutes || 30} 分钟` : "关闭" }}
            </span>
          </div>
        </div>
        <div class="ops-note">
          <p class="ops-note__label">执行策略</p>
          <p class="ops-note__text">
            只有已经实现的子渠道才能启用。第三方渠道缺少密钥时只展示指引，钱包与综合支付会优先走平台内建校验。
          </p>
        </div>
      </div>

      <div class="ops-table">
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
        <el-table-column label="操作" width="300" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openChannelDialog(row)">编辑</el-button>
            <el-button link type="primary" @click="openGuideDrawerByChannel(row)">开通指引</el-button>
            <el-button v-if="row.status !== 1 && isExecutableChannel(row.channelType, row.channelSubType)" link type="success" @click="handleEnableChannel(row)">启用</el-button>
            <el-button v-if="row.status === 1" link type="warning" @click="handleDisableChannel(row)">禁用</el-button>
          </template>
        </el-table-column>
        </el-table>
      </div>
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

    <el-drawer v-model="guideDrawerVisible" size="560px" :title="currentGuide?.title || '开通指引'">
      <template v-if="currentGuide">
        <div class="ops-split guide-layout">
          <div class="ops-subpanel">
            <p class="ops-kicker">Guide Snapshot</p>
            <h4 class="drawer-title">{{ currentGuide.title }}</h4>
            <p class="ops-section-copy">{{ currentGuide.summary }}</p>
            <div class="ops-ribbon">
              <span class="ops-ribbon__item">{{ currentGuide.channelType }} / {{ currentGuide.channelSubType }}</span>
              <span class="ops-ribbon__item">默认 SPI {{ currentGuide.defaultProviderSpi || "default" }}</span>
            </div>
          </div>
          <div class="ops-note">
            <p class="ops-note__label">指引用途</p>
            <p class="ops-note__text">
              开通指引目录会保留 guide-only 能力，避免 FACE_TO_FACE、SANDBOX 这类能力被误当成可直接创建的支付子渠道。
            </p>
          </div>
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
  deleteMerchant,
  disableChannel,
  enableChannel,
  getChannelCatalog,
  getMerchantChannels,
  getMerchantList,
  getProviderOptions,
  updateChannel,
  updateMerchant,
} from "../api/payment";
import type {
  ChannelForm,
  Merchant,
  MerchantChannel,
  MerchantForm,
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

const editingMerchant = ref<Merchant | null>(null);
const editingChannel = ref<MerchantChannel | null>(null);
const selectedMerchant = ref<Merchant | null>(null);
const currentGuide = ref<PaymentMethodGuide | null>(null);

const merchantForm = reactive<MerchantForm>(createDefaultMerchantForm());
const channelForm = reactive<ChannelForm>(createDefaultChannelForm());

const merchantFormRef = ref();

const activeMerchantCount = computed(() => merchantList.value.filter((item) => item.status === 1).length);
const pendingMerchantCount = computed(() => merchantList.value.filter((item) => item.status === 0).length);
const walletMerchantCount = computed(() => merchantList.value.filter((item) => item.walletEnabled).length);
const compositeMerchantCount = computed(() => merchantList.value.filter((item) => item.compositeEnabled).length);
const totalChannelCount = computed(() => merchantList.value.reduce((sum, item) => sum + (item.channelCount || 0), 0));
const executableGuideCount = computed(() => catalog.value.filter((item) => isExecutableChannel(item.channelType, item.channelSubType)).length);
const guideOnlyGuideCount = computed(() => Math.max(catalog.value.length - executableGuideCount.value, 0));
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
  flex: 1 1 auto;
}

.tag-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.merchant-title,
.channel-title,
.cell-stack {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.merchant-title strong,
.channel-title strong,
.drawer-title {
  color: #23170f;
}

.merchant-title span,
.channel-title span,
.cell-stack span {
  color: #7d6450;
  font-size: 13px;
  line-height: 1.7;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 6px 18px;
}

.span-2 {
  grid-column: 1 / -1;
}

.drawer-title {
  margin: 0;
  font-size: 22px;
  font-family: "STZhongsong", "Noto Serif SC", Georgia, serif;
}

.drawer-ribbon {
  margin-top: 14px;
}

.guide-actions {
  margin-top: 8px;
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
  .drawer-header {
    align-items: flex-start;
    flex-direction: column;
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
