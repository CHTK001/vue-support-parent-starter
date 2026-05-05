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
              <ScSelect v-model="channelForm.channelType" placeholder="选择渠道类型" @change="handleChannelTypeChange">
                <el-option v-for="item in catalogTypes" :key="item" :label="formatChannelType(item)" :value="item" />
              </ScSelect>
            </el-form-item>
            <el-form-item label="渠道子类型" required>
              <ScSelect v-model="channelForm.channelSubType" placeholder="选择渠道子类型">
                <el-option v-for="item in channelSubTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
              </ScSelect>
            </el-form-item>
            <el-form-item label="别名">
              <el-input v-model="channelForm.channelName" placeholder="可选，用于区分同一类型下的多条配置" />
            </el-form-item>
            <el-form-item label="状态">
              <ScSelect v-model="channelForm.status" placeholder="选择状态">
                <el-option label="启用" :value="1" />
                <el-option label="禁用" :value="0" />
              </ScSelect>
            </el-form-item>
            <el-form-item label="运行模式">
              <ScSelect v-model="channelForm.sandboxMode" placeholder="选择运行模式">
                <el-option label="正式执行" :value="0" />
                <el-option label="沙箱联调" :value="1" />
              </ScSelect>
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
        <el-form label-width="112px">
          <div class="pm-form-grid">
            <el-form-item v-if="showAppIdField" label="AppId">
              <el-input v-model="channelForm.appId" placeholder="支付平台分配的 AppId" />
            </el-form-item>
            <el-form-item v-if="showMerchantNoField" label="商户号">
              <el-input v-model="channelForm.merchantNo" placeholder="支付平台商户号 / 合作者身份 ID" />
            </el-form-item>
            <el-form-item v-if="showApiKeyField" label="API Key">
              <el-input v-model="channelForm.apiKey" placeholder="API 密钥 / 应用密钥" />
            </el-form-item>
            <el-form-item v-if="showCertPathField" label="证书路径">
              <el-input v-model="channelForm.certPath" placeholder="证书文件路径（绝对路径或 classpath）" />
            </el-form-item>
            <el-form-item v-if="showPrivateKeyField" label="私钥" class="pm-form-span-2">
              <el-input v-model="channelForm.privateKey" type="textarea" :rows="3" placeholder="应用私钥内容（PKCS#8 / PKCS#1）" />
            </el-form-item>
            <el-form-item v-if="showPublicKeyField" label="公钥" class="pm-form-span-2">
              <el-input v-model="channelForm.publicKey" type="textarea" :rows="3" placeholder="支付宝公钥内容" />
            </el-form-item>
          </div>
        </el-form>
      </section>

      <!-- 回调与跳转 -->
      <section class="pm-section">
        <div class="pm-section__head">
          <div>
            <h3>回调与跳转</h3>
            <p>按支付方式单独覆盖结果回调与浏览器回跳。</p>
          </div>
        </div>
        <el-form label-width="112px">
          <div class="pm-form-grid">
            <el-form-item label="支付结果回调" class="pm-form-span-2">
              <el-input v-model="channelForm.notifyUrl" placeholder="不填写则沿用商户默认结果回调" />
              <div class="pm-helper">此地址会覆盖商户级统一结果回调，支付、转账、退款默认共用。</div>
            </el-form-item>
            <el-form-item label="浏览器回跳" class="pm-form-span-2">
              <el-input v-model="channelForm.returnUrl" placeholder="不填写则沿用商户默认回跳" />
              <div class="pm-helper">仅浏览器可见的支付场景使用，接口调用类支付不涉及。</div>
            </el-form-item>
          </div>
        </el-form>
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
            <el-form-item label="支付分回调" class="pm-form-span-2">
              <el-input v-model="channelWechatConfig.payScoreNotifyUrl" placeholder="微信支付分回调地址" />
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
              <el-input v-model="channelAlipayConfig.serverUrl" placeholder="https://openapi.alipay.com/gateway.do" />
            </el-form-item>
            <el-form-item label="字符集">
              <ScSelect v-model="channelAlipayConfig.charset">
                <el-option label="UTF-8" value="UTF-8" />
                <el-option label="GBK" value="GBK" />
              </ScSelect>
            </el-form-item>
            <el-form-item label="格式">
              <ScSelect v-model="channelAlipayConfig.format">
                <el-option label="json" value="json" />
              </ScSelect>
            </el-form-item>
            <el-form-item label="签名算法">
              <ScSelect v-model="channelAlipayConfig.signType">
                <el-option label="RSA2" value="RSA2" />
                <el-option label="RSA" value="RSA" />
              </ScSelect>
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
      <section v-if="selectedGuide" class="pm-section">
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
            <span>默认回调</span>
            <strong>{{ merchant?.defaultNotifyUrl || '未配置' }}</strong>
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
  }>(),
  { merchant: null, catalog: () => [], channel: null, saving: false }
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

const showWechatConfig = computed(() => channelType.value === "WECHAT" || channelType.value === "EPAY");
const showAlipayConfig = computed(() => channelType.value === "ALIPAY");
const showWalletConfig = computed(() => isWalletType.value);

const showAppIdField = computed(() => !isWalletType.value);
const showMerchantNoField = computed(() => channelType.value === "WECHAT" || channelType.value === "EPAY");
const showApiKeyField = computed(() => channelType.value === "WECHAT" || channelType.value === "EPAY");
const showPrivateKeyField = computed(() => channelType.value !== "WALLET" && channelType.value !== "EPAY");
const showPublicKeyField = computed(() => channelType.value === "ALIPAY");
const showCertPathField = computed(() => !isWalletType.value && channelType.value !== "EPAY");

const isMiniProgramType = computed(() => {
  const subType = String(channelForm.channelSubType || "").toUpperCase();
  return subType === "MINI_PROGRAM" || subType === "MINIPROGRAM";
});

const catalogTypes = computed(() => {
  const types = new Set(props.catalog.map((g) => g.channelType).filter(Boolean));
  return Array.from(types);
});

const channelSubTypeOptions = computed(() => {
  return ChannelSubTypeOptions[channelForm.channelType] || [];
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
    channelWechatConfig.payScoreNotifyUrl = textOf(parsed.payScoreNotifyUrl);
    channelWechatConfig.paymentPointNotifyUrl = textOf(parsed.paymentPointNotifyUrl);
    channelWechatConfig.miniProgramSecret = textOf(parsed.miniProgramSecret);
    channelWechatConfig.appSecret = textOf(parsed.appSecret);
    channelWechatConfig.keyPath = textOf(parsed.keyPath);
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
    appendText(ext, "payScoreNotifyUrl", channelWechatConfig.payScoreNotifyUrl);
    appendText(ext, "paymentPointNotifyUrl", channelWechatConfig.paymentPointNotifyUrl);
    if (isMiniProgramType.value) {
      appendText(ext, "miniProgramSecret", channelWechatConfig.miniProgramSecret);
      appendText(ext, "appSecret", channelWechatConfig.appSecret);
    }
    appendText(ext, "keyPath", channelWechatConfig.keyPath);
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
