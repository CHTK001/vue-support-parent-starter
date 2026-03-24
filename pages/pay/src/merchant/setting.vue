<template>
  <sc-drawer
    v-model="visible"
    :title="`支付配置 - ${merchant?.payMerchantName || ''}`"
    size="70%"
    :with-header="true"
  >
    <div class="dialog-header">
      <h3>支付配置 - {{ merchant?.payMerchantName || '' }}</h3>
    </div>
    <div class="grid grid-cols-4 gap-4">
      <ScCard v-for="item in configList" :key="item.type" shadow="hover">
        <template #header>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <iconifyIconOnline :icon="item.icon" />
              <span>{{ item.title }}</span>
            </div>
            <ScSwitch
              v-model="item.enabled"
              :active-value="1"
              :inactive-value="0"
              layout="modern"
              @change="() => onToggle(item)"
            />
          </div>
        </template>

        <div class="flex items-center justify-end gap-2">
          <template v-if="item.type === 'timeout'">
            <ScInputNumber 
              v-model="merchant.payMerchantOpenTimeoutTime"
              :min="1"
              :max="1440"
              size="small"
              @change="
                (val: any) =>
                  fetchUpdateMerchant({
                    payMerchantId: merchant.payMerchantId,
                    payMerchantOpenTimeout: item.enabled,
                    payMerchantOpenTimeoutTime: val,
                  })
              "
            />
            <ScTag effect="plain">min</ScTag>
          </template>
          <ScButton 
            v-else
            size="small"
            type="primary"
            plain
            @click="openConfig(item)"
          >
            <iconifyIconOnline icon="ep:setting" /> 配置
          </ScButton>
        </div>
      </ScCard>
    </div>

    <!-- 配置弹窗（微信） -->
    <sc-dialog
      v-model="config.visible"
      :title="`配置 - ${config.current?.title || ''}`"
      width="600px"
      append-to-body
    >
      <div class="dialog-header">
        <h3>配置 - {{ config.current?.title || '' }}</h3>
      </div>
      <ScForm :model="config.form" label-width="140px" class="modern-form">
        <template v-if="config.current?.type !== 'wallet'">
          <ScFormItem label="AppId">
            <ScInput v-model="config.form.payMerchantConfigWechatAppId" />
          </ScFormItem>
          <ScFormItem label="商户号(MchId)">
            <ScInput v-model="config.form.payMerchantConfigWechatMchId" />
          </ScFormItem>
          <ScFormItem label="证书序列号">
            <ScInput 
              v-model="config.form.payMerchantConfigWechatMchSerialNo"
            />
          </ScFormItem>
          <ScFormItem label="AppSecret">
            <ScInput v-model="config.form.payMerchantConfigWechatAppSecret" />
          </ScFormItem>
          <ScFormItem label="API Key V3">
            <ScInput v-model="config.form.payMerchantConfigWechatApiKeyV3" />
          </ScFormItem>
          <ScFormItem label="私钥路径">
            <ScInput 
              v-model="config.form.payMerchantConfigWechatPrivateKeyPath"
            />
          </ScFormItem>
          <ScFormItem label="支付回调URL">
            <ScInput 
              v-model="config.form.payMerchantConfigWechatPayNotifyUrl"
            />
          </ScFormItem>
          <ScFormItem label="退款回调URL">
            <ScInput 
              v-model="config.form.payMerchantConfigWechatRefundNotifyUrl"
            />
          </ScFormItem>
        </template>
        <template v-else>
          <ScFormItem label="钱包开关">
            <ScSwitch
              v-model="walletSwitch"
              :active-value="1"
              :inactive-value="0"
              layout="modern"
            />
          </ScFormItem>
        </template>
      </ScForm>
      <template #footer>
        <ScButton @click="config.visible = false">取消</ScButton>
        <ScButton type="primary" @click="handleSaveConfig">保存</ScButton>
      </template>
    </sc-dialog>
  </sc-drawer>
</template>

<script setup lang="ts">
import { reactive, ref, defineExpose, watch } from "vue";
import { fetchUpdateMerchant } from "../api/merchant";
import { fetchSaveOrUpdateWechatConfig } from "../api/wechat";
import ScSwitch from "@repo/components/ScSwitch/index.vue";

const visible = ref(false);
const merchant = ref<any>(null);

const configList = reactive([
  { type: "wallet", title: "钱包", icon: "ri:wallet-3-line", enabled: 0 },
  { type: "timeout", title: "订单超时", icon: "ri:time-line", enabled: 0 },
  {
    type: "js_api",
    title: "微信小程序/JSAPI",
    icon: "simple-icons:wechat",
    enabled: 0,
  },
  { type: "h5", title: "微信H5", icon: "simple-icons:wechat", enabled: 0 },
  {
    type: "native",
    title: "微信Native",
    icon: "simple-icons:wechat",
    enabled: 0,
  },
]);

const open = (row: any) => {
  merchant.value = row;
  // 同步钱包/超时状态
  const wallet = configList.find((i) => i.type === "wallet");
  if (wallet) wallet.enabled = row.payMerchantOpenWallet || 0;
  const timeout = configList.find((i) => i.type === "timeout");
  if (timeout) timeout.enabled = row.payMerchantOpenTimeout || 0;
  visible.value = true;
};

const onToggle = (item: any) => {
  if (item.type === "wallet") {
    fetchUpdateMerchant({
      payMerchantId: merchant.value.payMerchantId,
      payMerchantOpenWallet: item.enabled,
    });
  }
  if (item.type === "timeout") {
    merchant.value.payMerchantOpenTimeout = item.enabled;
    fetchUpdateMerchant({
      payMerchantId: merchant.value.payMerchantId,
      payMerchantOpenTimeout: item.enabled,
      payMerchantOpenTimeoutTime: merchant.value.payMerchantOpenTimeoutTime,
    });
  }
};

const config = reactive<any>({
  visible: false,
  current: null,
  form: {},
});

const walletSwitch = ref(0);

const openConfig = (item: any) => {
  config.current = item;
  config.form = {
    payMerchantId: merchant.value?.payMerchantId,
    payMerchantConfigWechatTradeType: item.type,
    payMerchantConfigStatus: item.enabled,
  };
  walletSwitch.value = configList[0].enabled;
  config.visible = true;
};

const handleSaveConfig = async () => {
  if (config.current?.type === "wallet") {
    await fetchUpdateMerchant({
      payMerchantId: merchant.value.payMerchantId,
      payMerchantOpenWallet: walletSwitch.value,
    });
  } else {
    await fetchSaveOrUpdateWechatConfig({
      ...config.form,
    });
  }
  config.visible = false;
};

// defineExpose 和 watch 必须放在最后（遵循项目规则）

defineExpose({ open });

watch(config, () => {}, { deep: true });
</script>
