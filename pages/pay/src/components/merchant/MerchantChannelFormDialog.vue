<template>
  <ScDialog
    :model-value="modelValue"
    :title="channel ? '编辑支付方式' : '新增支付方式'"
    width="940px"
    destroy-on-close
    @update:model-value="emit('update:modelValue', $event)"
  >
      <div class="pm-dialog-shell">
      <PmStatusStrip>
        <PmStatusCard label="支付方式" :hint="resolveChannelDisplayName(channelForm) || '待选择'">
          <template #value>{{ resolveChannelDisplayName(channelForm) || '未选择' }}</template>
        </PmStatusCard>
        <PmStatusCard label="支付方式类型" :hint="formatChannelType(channelForm.channelType)">
          <template #value>{{ formatChannelSubType(channelForm.channelType, channelForm.channelSubType) || '未选择' }}</template>
        </PmStatusCard>
        <PmStatusCard label="当前商户" :hint="'支付方式所属商户'">
          <template #value>{{ merchant?.merchantName || '-' }}</template>
        </PmStatusCard>
      </PmStatusStrip>

      <!-- 基础信息 -->
      <section class="pm-section">
        <div class="pm-section__head">
          <div>
            <h3>基础信息</h3>
            <p>选择支付方式类型、渠道归属和运行模式。</p>
          </div>
        </div>
        <el-form label-width="112px">
          <div class="pm-form-grid">
            <el-form-item label="渠道类型" required>
              <ScSelect v-model="channelForm.channelType" :options="catalogTypeOptions" layout="icon" placeholder="选择渠道类型" @change="handleChannelTypeChange" />
            </el-form-item>
            <el-form-item label="渠道子类型" required>
              <ScSelect v-model="channelForm.channelSubType" :options="channelSubTypeOptions" layout="icon" placeholder="选择渠道子类型" />
            </el-form-item>
            <el-form-item label="别名">
              <el-input v-model="channelForm.channelName" placeholder="可选，用于区分同一类型下的多条配置" />
            </el-form-item>
            <el-form-item label="状态">
              <ScSwitch
                v-model="channelForm.status"
                :active-value="1"
                :inactive-value="0"
                iot-theme="enable"
                layout="icon"
                indicator="ribbon"
              />
            </el-form-item>
            <el-form-item v-if="selectedGuide?.summary" label="业务说明" class="pm-form-span-2">
              <div class="pm-soft-panel pm-subtle">{{ selectedGuide.summary }}</div>
            </el-form-item>
          </div>
        </el-form>
      </section>

      <!-- 支付凭证 -->
      <section class="pm-section">
        <div class="pm-section__head">
          <div>
            <h3>支付凭证</h3>
            <p>根据支付平台要求填写对应的凭证信息。</p>
          </div>
        </div>
        <el-form label-width="132px">
          <div class="pm-form-grid">
            <el-form-item v-if="showAppIdField" label="AppId">
              <template #label>
                <el-tooltip :content="'支付平台分配的 AppId，微信可在微信商户平台-产品中心-开发配置查看；支付宝在开放平台-我的应用查看'" placement="top">
                  <span>AppId <el-icon style="vertical-align:middle;margin-left:2px;color:#94a3b8"><QuestionFilled /></el-icon></span>
                </el-tooltip>
              </template>
              <el-input v-model="channelForm.appId" :placeholder="channelForm.sandboxMode === 1 && channelType === 'ALIPAY' ? '沙箱 AppId（如 9021000123456789）' : '支付平台分配的 AppId'" />
            </el-form-item>
            <el-form-item v-if="showMerchantNoField" label="商户号">
              <template #label>
                <el-tooltip content="微信商户号（mch_id）或支付宝合作者身份 ID（partner_id）" placement="top">
                  <span>商户号 <el-icon style="vertical-align:middle;margin-left:2px;color:#94a3b8"><QuestionFilled /></el-icon></span>
                </el-tooltip>
              </template>
              <el-input v-model="channelForm.merchantNo" placeholder="支付平台商户号 / 合作者身份 ID" />
            </el-form-item>
            <el-form-item v-if="showApiKeyField" label="API Key">
              <template #label>
                <el-tooltip :content="'微信 APIv3 密钥（32 位数字+字母），在微信商户平台-账户中心-API安全设置'" placement="top">
                  <span>API Key <el-icon style="vertical-align:middle;margin-left:2px;color:#94a3b8"><QuestionFilled /></el-icon></span>
                </el-tooltip>
              </template>
              <el-input v-model="channelForm.apiKey" placeholder="API 密钥 / 应用密钥" />
            </el-form-item>
            <el-form-item v-if="showCertPathField" label="证书路径">
              <template #label>
                <el-tooltip content="微信 API 证书（apiclient_cert.p12）的绝对路径或 classpath 路径" placement="top">
                  <span>证书路径 <el-icon style="vertical-align:middle;margin-left:2px;color:#94a3b8"><QuestionFilled /></el-icon></span>
                </el-tooltip>
              </template>
              <el-input v-model="channelForm.certPath" placeholder="证书文件路径（绝对路径或 classpath）" />
            </el-form-item>
            <el-form-item v-if="showPrivateKeyField" label="私钥" class="pm-form-span-2">
              <template #label>
                <el-tooltip content="应用私钥（PKCS#8/PKCS#1 格式），微信在商户平台下载；支付宝在开放平台生成" placement="top">
                  <span>私钥 <el-icon style="vertical-align:middle;margin-left:2px;color:#94a3b8"><QuestionFilled /></el-icon></span>
                </el-tooltip>
              </template>
              <el-input v-model="channelForm.privateKey" type="textarea" :rows="3" placeholder="应用私钥内容（PKCS#8 / PKCS#1）" />
            </el-form-item>
            <el-form-item v-if="showPublicKeyField" label="公钥" class="pm-form-span-2">
              <template #label>
                <el-tooltip :content="'支付宝公钥，在支付宝开放平台-开发设置-接口加签方式查看'" placement="top">
                  <span>公钥 <el-icon style="vertical-align:middle;margin-left:2px;color:#94a3b8"><QuestionFilled /></el-icon></span>
                </el-tooltip>
              </template>
              <el-input v-model="channelForm.publicKey" type="textarea" :rows="3" placeholder="支付宝公钥内容" />
            </el-form-item>
          </div>
        </el-form>
      </section>

      <!-- 运行模式 -->
      <section class="pm-section">
        <div class="pm-section__head">
          <div>
            <h3>运行模式</h3>
            <p>沙箱联调时使用测试环境凭证，正式发布前切换回正式执行。</p>
          </div>
        </div>
        <el-form label-width="132px">
          <div class="pm-form-mini-row">
            <el-form-item label="模式">
              <ScSelect v-model="channelForm.sandboxMode" :options="sandboxModeOptions" layout="icon" style="width:160px" />
            </el-form-item>
            <template v-if="channelForm.sandboxMode === 1">
              <el-tag type="warning" effect="plain" style="margin-left:6px">沙箱环境使用测试凭证，不会产生真实交易</el-tag>
            </template>
          </div>
        </el-form>
        <!-- 沙箱 OpenId 配置 -->
        <div v-if="channelForm.sandboxMode === 1 && (showWechatConfig || showAlipayConfig)" class="pm-sandbox-openid">
          <div class="pm-sandbox-openid__head">
            <el-icon style="color:#409eff;margin-right:6px"><UserFilled /></el-icon>
            <span>沙箱测试账号</span>
          </div>
          <el-form label-width="132px">
            <div class="pm-form-grid">
              <el-form-item label="买家 OpenId">
                <el-input v-model="channelWechatConfig.sandboxBuyerOpenId" :placeholder="showAlipayConfig ? '支付宝沙箱买家用户 ID' : '沙箱测试买家（付款方）的 OpenId'" />
              </el-form-item>
              <el-form-item label="卖家 OpenId">
                <el-input v-model="channelWechatConfig.sandboxSellerOpenId" :placeholder="showAlipayConfig ? '支付宝沙箱卖家用户 ID' : '沙箱测试卖家（收款方）的 OpenId'" />
              </el-form-item>
            </div>
          </el-form>
        </div>
        <!-- 沙箱模式提示：如何切换到正式环境 -->
        <div v-if="channelForm.sandboxMode === 1" class="pm-sandbox-hint">
          <div class="pm-sandbox-hint__header">
            <el-icon style="color:#e6a23c;margin-right:6px"><InfoFilled /></el-icon>
            <span>切换到正式环境</span>
          </div>
          <ol class="pm-sandbox-hint__steps">
            <li>将上方模式切换为「<strong>正式执行</strong>」</li>
            <li v-if="showAppIdField">替换为<strong>正式环境</strong>的 AppId（{{ channelType === 'ALIPAY' ? '开放平台-我的应用' : '微信开放平台/公众平台' }}）</li>
            <li v-if="showPrivateKeyField">替换为<strong>正式环境</strong>的私钥</li>
            <li v-if="showPublicKeyField && channelType === 'ALIPAY'">替换为<strong>正式环境</strong>的支付宝公钥</li>
            <li v-if="showAlipayConfig">确认网关地址为正式网关：<code>https://openapi.alipay.com/gateway.do</code></li>
            <li v-if="showWechatConfig">确认商户证书序列号、APIv3 Key 均为正式环境值</li>
          </ol>
        </div>
      </section>

      <!-- 微信专属配置 -->
      <section v-if="showWechatConfig" class="pm-section">
        <div class="pm-section__head">
          <div>
            <h3>微信专属配置</h3>
            <p>微信支付 V3 接口所需额外参数。</p>
          </div>
        </div>
        <el-form label-width="152px">
          <div class="pm-form-grid">
            <el-form-item label="商户证书序列号">
              <el-input v-model="channelWechatConfig.merchantSerialNumber" placeholder="微信支付商户证书序列号" />
            </el-form-item>
            <el-form-item label="退款回调地址">
              <el-input v-model="channelWechatConfig.refundNotifyUrl" placeholder="退款结果回调地址" />
            </el-form-item>
            <el-form-item v-if="isMiniProgramType" label="小程序密钥">
              <el-input v-model="channelWechatConfig.miniProgramSecret" placeholder="小程序 AppSecret" />
            </el-form-item>
            <el-form-item v-if="isMiniProgramType" label="AppSecret">
              <el-input v-model="channelWechatConfig.appSecret" placeholder="开放平台 AppSecret" />
            </el-form-item>
            <el-form-item label="付款点回调" class="pm-form-span-2">
              <el-input v-model="channelWechatConfig.paymentPointNotifyUrl" placeholder="微信付款点回调地址" />
            </el-form-item>
            <el-form-item label="证书 / 密钥路径" class="pm-form-span-2">
              <el-input v-model="channelWechatConfig.keyPath" placeholder="API 证书文件路径（p12 / pem）" />
            </el-form-item>
          </div>
        </el-form>
      </section>

      <!-- 支付宝专属配置 -->
      <section v-if="showAlipayConfig" class="pm-section">
        <div class="pm-section__head">
          <div>
            <h3>支付宝专属配置</h3>
            <p>支付宝开放平台接口参数。</p>
          </div>
        </div>
        <el-form label-width="112px">
          <div class="pm-form-grid">
            <el-form-item label="网关地址">
              <el-input v-model="channelAlipayConfig.serverUrl" :placeholder="channelForm.sandboxMode === 1 ? 'https://openapi-sandbox.dl.alipaydev.com/gateway.do' : 'https://openapi.alipay.com/gateway.do'" />
            </el-form-item>
            <el-form-item label="字符集">
              <ScSelect v-model="channelAlipayConfig.charset" :options="charsetOptions" layout="icon" />
            </el-form-item>
            <el-form-item label="格式">
              <ScSelect v-model="channelAlipayConfig.format" :options="formatOptions" layout="icon" />
            </el-form-item>
            <el-form-item label="签名算法">
              <ScSelect v-model="channelAlipayConfig.signType" :options="signTypeOptions" layout="icon" />
            </el-form-item>
          </div>
        </el-form>
      </section>

      <!-- 钱包通道说明 -->
      <section v-if="showWalletConfig" class="pm-section">
        <div class="pm-section__head">
          <div>
            <h3>钱包通道说明</h3>
            <p>站内钱包不依赖外部支付平台。</p>
          </div>
        </div>
        <div class="pm-soft-panel pm-subtle">
          钱包通道使用站内余额账户进行支付，无需配置外部支付凭证。如需开启余额支付能力，请在商户设置的「钱包出入金限额」中配置对应限额。
        </div>
      </section>

      <!-- 接入指南 -->
      <section v-if="selectedGuide && !isWalletType" class="pm-section">
        <div class="pm-section__head">
          <div>
            <h3>接入指南</h3>
            <p>{{ selectedGuide.title }} 接入参考信息。</p>
          </div>
        </div>
        <div class="pm-readonly-grid">
          <div class="pm-readonly-item">
            <span>官方名称</span>
            <strong>{{ selectedGuide.officialName || '-' }}</strong>
          </div>
          <div class="pm-readonly-item">
            <span>官方地址</span>
            <strong>
              <a v-if="selectedGuide.officialUrl" :href="selectedGuide.officialUrl" target="_blank" class="pm-link">{{ selectedGuide.officialUrl }}</a>
              <span v-else>-</span>
            </strong>
          </div>
          <div class="pm-readonly-item">
            <span>沙箱环境</span>
            <strong>
              <a v-if="selectedGuide.sandboxUrl" :href="selectedGuide.sandboxUrl" target="_blank" class="pm-link">{{ selectedGuide.sandboxUrl }}</a>
              <span v-else>-</span>
            </strong>
          </div>
        </div>
        <template v-if="selectedGuide.requiredMaterials?.length">
          <h4 class="pm-list-title">所需资料</h4>
          <ul class="pm-list-plain">
            <li v-for="(item, idx) in selectedGuide.requiredMaterials" :key="idx">{{ item }}</li>
          </ul>
        </template>
        <template v-if="selectedGuide.tips?.length">
          <h4 class="pm-list-title">注意事项</h4>
          <ul class="pm-list-plain">
            <li v-for="(item, idx) in selectedGuide.tips" :key="idx">{{ item }}</li>
          </ul>
        </template>
      </section>

      <!-- 高级配置预览 -->
      <section class="pm-section">
        <div class="pm-section__head">
          <div>
            <h3>高级配置</h3>
            <p>支付平台专有扩展参数预览。</p>
          </div>
        </div>
        <el-collapse v-model="channelAdvancedPanels">
          <el-collapse-item title="扩展参数 JSON" name="extConfig">
            <pre class="pm-code-preview">{{ channelExtConfigPreview }}</pre>
          </el-collapse-item>
        </el-collapse>
      </section>
    </div>

    <template #footer>
      <div class="pm-dialog-footer">
        <ScButton @click="emit('update:modelValue', false)">取消</ScButton>
        <ScButton type="primary" :loading="saving" @click="submitChannel">保存</ScButton>
      </div>
    </template>
  </ScDialog>
  </template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import { ElMessage } from "element-plus";
import { QuestionFilled, InfoFilled, UserFilled } from "@element-plus/icons-vue";
import type { Merchant, MerchantChannel, PaymentMethodGuide } from "../../types/payment";
import { ChannelSubTypeOptions } from "../../types/payment";
import {
  createChannelForm,
  createWechatChannelConfig,
  createAlipayChannelConfig,
  equalsIgnoreCase,
  parseChannelExtConfig,
  textOf,
  appendText,
  KNOWN_CHANNEL_EXT_KEYS,
  formatChannelType,
  resolveChannelDisplayName,
  formatChannelSubType,
} from "./merchant";
import type { ChannelExtConfigMap } from "./merchant";
import PmStatusStrip from "../layout/PmStatusStrip.vue";
import PmStatusCard from "../layout/PmStatusCard.vue";

const props = withDefaults(
  defineProps<{
    modelValue: boolean;
    merchant?: Merchant | null;
    catalog?: PaymentMethodGuide[];
    channel?: MerchantChannel | null;
    saving?: boolean;
    existingChannels?: MerchantChannel[];
  }>(),
  { merchant: null, catalog: () => [], channel: null, saving: false, existingChannels: () => [] }
);

const emit = defineEmits<{
  (e: "update:modelValue", val: boolean): void;
  (e: "saved", formData: Record<string, unknown>, extConfig: string): void;
}>();

/* ── Reactive State ── */

const channelForm = reactive(createChannelForm());
const channelWechatConfig = reactive(createWechatChannelConfig());
const channelAlipayConfig = reactive(createAlipayChannelConfig());
const unknownChannelExtConfig = ref<ChannelExtConfigMap>({});
const channelAdvancedPanels = ref<string[]>([]);

/* ── Computed ── */

const channelType = computed(() => String(channelForm.channelType || "").toUpperCase());
const isWalletType = computed(() => channelType.value === "WALLET");

const showWechatConfig = computed(() => channelType.value === "WECHAT");
const showAlipayConfig = computed(() => channelType.value === "ALIPAY");
const showWalletConfig = computed(() => isWalletType.value);

const showAppIdField = computed(() => !isWalletType.value);
const showMerchantNoField = computed(() => channelType.value === "WECHAT");
const showApiKeyField = computed(() => channelType.value === "WECHAT");
const showPrivateKeyField = computed(() => channelType.value !== "WALLET");
const showPublicKeyField = computed(() => channelType.value === "ALIPAY");
const showCertPathField = computed(() => !isWalletType.value);

const isMiniProgramType = computed(() => {
  const subType = String(channelForm.channelSubType || "").toUpperCase();
  return subType === "MINI_PROGRAM" || subType === "MINIPROGRAM";
});

const catalogTypes = computed(() => {
  const types = new Set(props.catalog.map((g) => g.channelType).filter(Boolean));
  return Array.from(types);
});

const CHANNEL_SUBTYPE_ICONS: Record<string, string> = {
  // 微信子类型
  "WECHAT:JSAPI": "ri:global-line",
  "WECHAT:MINI_PROGRAM": "ri:app-store-line",
  "WECHAT:MINIPROGRAM": "ri:app-store-line",
  "WECHAT:H5": "ri:smartphone-line",
  "WECHAT:APP": "ri:cellphone-line",
  "WECHAT:NATIVE": "ri:qr-code-line",
  // 支付宝子类型
  "ALIPAY:WEB": "ri:computer-line",
  "ALIPAY:PAY_WEB": "ri:computer-line",
  "ALIPAY:WAP": "ri:smartphone-line",
  "ALIPAY:PAY_WAP": "ri:smartphone-line",
  "ALIPAY:APP": "ri:cellphone-line",
  // 钱包子类型
  "WALLET:BALANCE": "ri:wallet-3-line",
};

const channelSubTypeOptions = computed(() => {
  const type = String(channelForm.channelType || "").toUpperCase();
  return (ChannelSubTypeOptions[type] || []).map((item) => {
    const key = `${type}:${String(item.value || "").toUpperCase()}`;
    return {
      ...item,
      icon: CHANNEL_SUBTYPE_ICONS[key] || "",
    };
  });
});

const selectedGuide = computed<PaymentMethodGuide | null>(() => {
  return props.catalog.find(
    (g) =>
      equalsIgnoreCase(g.channelType, channelForm.channelType) &&
      equalsIgnoreCase(g.channelSubType, channelForm.channelSubType)
  ) || null;
});

const channelExtConfigPreview = computed(() => {
  return JSON.stringify(buildChannelExtConfigObject(), null, 2);
});

/* ── ScSelect Options ── */

const KEEP_CHANNEL_TYPES = new Set(["WECHAT", "ALIPAY", "WALLET"]);

const CHANNEL_TYPE_ICONS: Record<string, string> = {
  WECHAT: "ri:wechat-2-fill",
  ALIPAY: "ri:alipay-fill",
  WALLET: "ri:wallet-3-line",
};

const catalogTypeOptions = computed(() => {
  return catalogTypes.value
    .filter((item) => KEEP_CHANNEL_TYPES.has(String(item).toUpperCase()))
    .map((item) => {
      const key = String(item).toUpperCase();
      return {
        label: formatChannelType(key),
        value: item,
        icon: CHANNEL_TYPE_ICONS[key] || "",
      };
    });
});

const sandboxModeOptions = [
  { label: "正式执行", value: 0, icon: "ri:rocket-line" },
  { label: "沙箱联调", value: 1, icon: "ri:flask-line" },
];

const charsetOptions = [
  { label: "UTF-8", value: "UTF-8", icon: "ri:global-line" },
  { label: "GBK", value: "GBK", icon: "ri:global-line" },
];

const formatOptions = [
  { label: "json", value: "json", icon: "ri:code-line" },
];

const signTypeOptions = [
  { label: "RSA2", value: "RSA2", icon: "ri:shield-keyhole-line" },
  { label: "RSA", value: "RSA", icon: "ri:shield-keyhole-line" },
];

/* ── Functions ── */

function handleChannelTypeChange() {
  channelForm.channelSubType = "";
}

function loadStructuredChannelConfig(extConfig?: string) {
  const parsed = parseChannelExtConfig(extConfig);

  Object.assign(channelWechatConfig, createWechatChannelConfig());
  Object.assign(channelAlipayConfig, createAlipayChannelConfig());

  if (showWechatConfig.value) {
    channelWechatConfig.merchantSerialNumber = textOf(parsed.merchantSerialNumber);
    channelWechatConfig.refundNotifyUrl = textOf(parsed.refundNotifyUrl);
    channelWechatConfig.paymentPointNotifyUrl = textOf(parsed.paymentPointNotifyUrl);
    channelWechatConfig.miniProgramSecret = textOf(parsed.miniProgramSecret);
    channelWechatConfig.appSecret = textOf(parsed.appSecret);
    channelWechatConfig.keyPath = textOf(parsed.keyPath);
    channelWechatConfig.sandboxBuyerOpenId = textOf(parsed.sandboxBuyerOpenId);
    channelWechatConfig.sandboxSellerOpenId = textOf(parsed.sandboxSellerOpenId);
  }

  if (showAlipayConfig.value) {
    channelAlipayConfig.serverUrl = textOf(parsed.serverUrl);
    channelAlipayConfig.charset = textOf(parsed.charset) || "UTF-8";
    channelAlipayConfig.format = textOf(parsed.format) || "json";
    channelAlipayConfig.signType = textOf(parsed.signType) || "RSA2";
  }

  const remaining: ChannelExtConfigMap = {};
  for (const key of Object.keys(parsed)) {
    if (!KNOWN_CHANNEL_EXT_KEYS.has(key)) {
      remaining[key] = parsed[key];
    }
  }
  unknownChannelExtConfig.value = remaining;
}

function buildChannelExtConfigObject(): ChannelExtConfigMap {
  const ext: ChannelExtConfigMap = {};

  if (showWechatConfig.value) {
    appendText(ext, "merchantSerialNumber", channelWechatConfig.merchantSerialNumber);
    appendText(ext, "refundNotifyUrl", channelWechatConfig.refundNotifyUrl);
    appendText(ext, "paymentPointNotifyUrl", channelWechatConfig.paymentPointNotifyUrl);
    if (isMiniProgramType.value) {
      appendText(ext, "miniProgramSecret", channelWechatConfig.miniProgramSecret);
      appendText(ext, "appSecret", channelWechatConfig.appSecret);
    }
    appendText(ext, "keyPath", channelWechatConfig.keyPath);
    if (channelForm.sandboxMode === 1) {
      appendText(ext, "sandboxBuyerOpenId", channelWechatConfig.sandboxBuyerOpenId);
      appendText(ext, "sandboxSellerOpenId", channelWechatConfig.sandboxSellerOpenId);
    }
  }

  if (showAlipayConfig.value) {
    appendText(ext, "serverUrl", channelAlipayConfig.serverUrl);
    appendText(ext, "charset", channelAlipayConfig.charset);
    appendText(ext, "format", channelAlipayConfig.format);
    appendText(ext, "signType", channelAlipayConfig.signType);
  }

  for (const [key, value] of Object.entries(unknownChannelExtConfig.value)) {
    if (value != null && value !== "") {
      ext[key] = value;
    }
  }

  return ext;
}

function submitChannel() {
  if (!channelForm.channelType) {
    ElMessage.error("请选择渠道类型");
    return;
  }
  if (!channelForm.channelSubType) {
    ElMessage.error("请选择渠道子类型");
    return;
  }

  // 检查同一类型+子类型是否已存在（编辑时排除自身）
  const isDuplicate = props.existingChannels.some(
    (ch) =>
      ch.id !== channelForm.id &&
      equalsIgnoreCase(ch.channelType, channelForm.channelType) &&
      equalsIgnoreCase(ch.channelSubType, channelForm.channelSubType)
  );
  if (isDuplicate) {
    ElMessage.error(`该支付方式（${formatChannelType(channelForm.channelType)} / ${formatChannelSubType(channelForm.channelType, channelForm.channelSubType)}）已存在，每个类型只能配置一次`);
    return;
  }

  const extConfig = JSON.stringify(buildChannelExtConfigObject());
  emit("saved", { ...channelForm }, extConfig);
}

/* ── Watch ── */

watch(
  () => props.modelValue,
  (open) => {
    if (!open) return;
    const src = props.channel;
    if (src?.id) {
      Object.assign(channelForm, createChannelForm(), src);
      loadStructuredChannelConfig(src.extConfig);
    } else {
      Object.assign(channelForm, createChannelForm(), {
        merchantId: props.merchant?.id || 0,
      });
      Object.assign(channelWechatConfig, createWechatChannelConfig());
      Object.assign(channelAlipayConfig, createAlipayChannelConfig());
      unknownChannelExtConfig.value = {};
    }
    channelAdvancedPanels.value = [];
  }
);
</script>

<style scoped lang="scss">
/* ===== 对话框整体 ===== */
.pm-dialog-shell {
  padding: 0 2px;
}

/* ===== 状态条增强 ===== */
:deep(.pm-status-strip) {
  margin-bottom: 28px;
  gap: 14px;
}

:deep(.pm-status-card) {
  background: linear-gradient(135deg, #f8faff 0%, #f0f4ff 100%);
  border: 1px solid rgba(64, 158, 255, 0.12);
  border-radius: 12px;
  padding: 16px 20px;
  transition: all 0.25s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 16px rgba(64, 158, 255, 0.08);
    border-color: rgba(64, 158, 255, 0.2);
  }
}

/* ===== 节容器 ===== */
.pm-section {
  background: #fff;
  border: 1px solid #f0f2f5;
  border-radius: 14px;
  padding: 24px 28px;
  margin-bottom: 20px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.02);
  transition: box-shadow 0.25s ease, border-color 0.25s ease;

  &:hover {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
    border-color: #e8ecf1;
  }
}

.pm-section__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 22px;
  padding-left: 16px;
  border-left: 4px solid var(--el-color-primary);
  border-radius: 2px;

  h3 {
    font-size: 16px;
    font-weight: 600;
    color: #1a2332;
    margin: 0 0 4px 0;
    line-height: 1.4;
  }

  p {
    font-size: 13px;
    color: #94a3b8;
    margin: 0;
    line-height: 1.5;
  }
}

/* 各节不同色的左边框 */
.pm-section:nth-child(2) .pm-section__head {
  border-left-color: var(--el-color-primary);
}
.pm-section:nth-child(3) .pm-section__head {
  border-left-color: var(--el-color-success);
}
.pm-section:nth-child(4) .pm-section__head {
  border-left-color: var(--el-color-warning);
}
.pm-section:nth-child(5) .pm-section__head {
  border-left-color: #8b5cf6;
}
.pm-section:nth-child(6) .pm-section__head {
  border-left-color: #ec4899;
}
.pm-section:nth-child(7) .pm-section__head {
  border-left-color: #f59e0b;
}
.pm-section:nth-child(8) .pm-section__head {
  border-left-color: #64748b;
}

/* ===== 表单网格 ===== */
:deep(.pm-form-grid) {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px 28px;
}

:deep(.pm-form-mini-row) {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

:deep(.pm-form-span-2) {
  grid-column: span 2;
}

/* ===== 表单项增强 ===== */
:deep(.el-form-item) {
  margin-bottom: 0;
}

:deep(.el-form-item__label) {
  font-weight: 500;
  color: #334155;
  padding-bottom: 6px;
}

:deep(.el-input__wrapper) {
  border-radius: 8px;
  transition: box-shadow 0.2s ease, border-color 0.2s ease;
  box-shadow: 0 0 0 1px #e2e8f0 inset;
}

:deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px #cbd5e1 inset;
}

:deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px var(--el-color-primary) inset;
}

:deep(.el-textarea__inner) {
  border-radius: 8px;
  transition: box-shadow 0.2s ease;
  box-shadow: 0 0 0 1px #e2e8f0 inset;
}

:deep(.el-textarea__inner:focus) {
  box-shadow: 0 0 0 1px var(--el-color-primary) inset;
}

/* ===== 软面板 ===== */
.pm-soft-panel {
  background: #f8fafc;
  border: 1px solid #eef2f6;
  border-radius: 10px;
  padding: 16px 20px;
  font-size: 13px;
  line-height: 1.6;
  color: #475569;
}

.pm-subtle {
  color: #64748b;
}

/* ===== 只读信息网格 ===== */
:deep(.pm-readonly-grid) {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 14px;
  margin-bottom: 18px;
}

:deep(.pm-readonly-item) {
  background: #f8fafc;
  border: 1px solid #eef2f6;
  border-radius: 10px;
  padding: 14px 18px;
  transition: background 0.2s ease;

  &:hover {
    background: #f1f5f9;
  }

  span {
    display: block;
    font-size: 12px;
    color: #94a3b8;
    margin-bottom: 4px;
  }

  strong {
    font-size: 13px;
    color: #334155;
    font-weight: 600;
  }
}

/* ===== 列表样式 ===== */
.pm-list-title {
  font-size: 14px;
  font-weight: 600;
  color: #334155;
  margin: 18px 0 10px 0;
}

:deep(.pm-list-plain) {
  padding-left: 20px;
  margin: 0 0 8px 0;

  li {
    font-size: 13px;
    color: #475569;
    line-height: 1.8;
    margin-bottom: 2px;
  }
}

/* ===== 代码预览 ===== */
.pm-code-preview {
  background: #1e293b;
  color: #e2e8f0;
  border-radius: 10px;
  padding: 16px 20px;
  font-size: 12px;
  line-height: 1.7;
  overflow-x: auto;
  font-family: "JetBrains Mono", "Fira Code", monospace;
}

/* ===== 链接 ===== */
.pm-link {
  color: var(--el-color-primary);
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s ease;

  &:hover {
    color: #1d4ed8;
    text-decoration: underline;
  }
}

/* ===== 折叠面板 ===== */
:deep(.el-collapse) {
  border: none;
}

:deep(.el-collapse-item__header) {
  font-size: 14px;
  font-weight: 500;
  color: #475569;
  padding-left: 4px;
  border-bottom: 1px solid #f0f2f5;
}

:deep(.el-collapse-item__content) {
  padding-top: 14px;
}

/* ===== 底部按钮 ===== */
.pm-dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding-top: 4px;
}

/* ===== 沙箱测试账号 ===== */
.pm-sandbox-openid {
  margin-top: 16px;
  background: linear-gradient(135deg, #f0f7ff 0%, #f5f9ff 100%);
  border: 1px solid #d6e4ff;
  border-radius: 10px;
  padding: 16px 20px;
}

.pm-sandbox-openid__head {
  display: flex;
  align-items: center;
  font-size: 14px;
  font-weight: 600;
  color: #409eff;
  margin-bottom: 14px;
}

:deep(html.dark) .pm-sandbox-openid {
  background: linear-gradient(135deg, #0f1f3d 0%, #1a2744 100%);
  border-color: #1e3a6a;
}

:deep(html.dark) .pm-sandbox-openid__head {
  color: #60a5fa;
}

/* ===== 沙箱提示 ===== */
.pm-sandbox-hint {
  margin-top: 16px;
  background: linear-gradient(135deg, #fdf6ec 0%, #fef9f0 100%);
  border: 1px solid #faecd8;
  border-radius: 10px;
  padding: 16px 20px;
}

.pm-sandbox-hint__header {
  display: flex;
  align-items: center;
  font-size: 14px;
  font-weight: 600;
  color: #e6a23c;
  margin-bottom: 10px;
}

.pm-sandbox-hint__steps {
  margin: 0;
  padding-left: 20px;
  font-size: 13px;
  color: #606266;
  line-height: 2;

  li {
    margin-bottom: 2px;
  }

  strong {
    color: #303133;
  }

  code {
    background: rgba(230, 162, 60, 0.12);
    color: #b88230;
    padding: 1px 6px;
    border-radius: 4px;
    font-size: 12px;
    font-family: "JetBrains Mono", "Fira Code", monospace;
  }
}

/* ===== 深色模式适配 ===== */
:global(html.dark) {
  .pm-section {
    background: #1e293b;
    border-color: #2d3a4e;
  }

  .pm-section__head h3 {
    color: #e2e8f0;
  }

  .pm-section__head p {
    color: #64748b;
  }

  .pm-soft-panel {
    background: #0f172a;
    border-color: #1e293b;
    color: #94a3b8;
  }

  .pm-subtle {
    color: #64748b;
  }

  :deep(.pm-readonly-item) {
    background: #0f172a;
    border-color: #1e293b;

    &:hover {
      background: #1a2332;
    }

    span {
      color: #64748b;
    }

    strong {
      color: #cbd5e1;
    }
  }

  :deep(.pm-status-card) {
    background: linear-gradient(135deg, #0f172a 0%, #1a2332 100%);
    border-color: rgba(64, 158, 255, 0.15);
  }

  .pm-list-title {
    color: #cbd5e1;
  }

  :deep(.pm-list-plain li) {
    color: #94a3b8;
  }

  :deep(.el-form-item__label) {
    color: #94a3b8;
  }

  :deep(.el-input__wrapper) {
    box-shadow: 0 0 0 1px #334155 inset;
  }

  :deep(.el-input__wrapper:hover) {
    box-shadow: 0 0 0 1px #475569 inset;
  }

  .pm-sandbox-hint {
    background: linear-gradient(135deg, #2d2a1f 0%, #1f2937 100%);
    border-color: #5c4d2a;
  }

  .pm-sandbox-hint__header {
    color: #f0c060;
  }

  .pm-sandbox-hint__steps {
    color: #94a3b8;

    strong {
      color: #e2e8f0;
    }

    code {
      background: rgba(240, 192, 96, 0.15);
      color: #f0c060;
    }
  }
}
</style>
