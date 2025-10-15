<template>
  <el-drawer v-model="visible" :title="`支付配置 - ${merchant?.payMerchantName || ''}`" size="70%" :with-header="true">
    <div class="grid grid-cols-4 gap-4">
      <el-card v-for="item in configList" :key="item.type" shadow="hover">
        <template #header>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <iconifyIconOnline :icon="item.icon" />
              <span>{{ item.title }}</span>
            </div>
            <el-switch v-model="item.enabled" :active-value="1" :inactive-value="0" @change="() => onToggle(item)" />
          </div>
        </template>

        <div class="flex items-center justify-end gap-2">
          <template v-if="item.type === 'timeout'">
            <el-input-number v-model="merchant.payMerchantOpenTimeoutTime" :min="1" :max="1440" size="small" @change="(val:any) => fetchUpdateMerchant({ payMerchantId: merchant.payMerchantId, payMerchantOpenTimeout: item.enabled, payMerchantOpenTimeoutTime: val })" />
            <el-tag effect="plain">min</el-tag>
          </template>
          <el-button v-else size="small" type="primary" plain @click="openConfig(item)">
            <iconifyIconOnline icon="ep:setting" /> 配置
          </el-button>
        </div>
      </el-card>
    </div>

    <!-- 配置弹窗（微信） -->
    <el-dialog v-model="config.visible" :title="`配置 - ${config.current?.title || ''}`" width="600px" append-to-body>
      <el-form :model="config.form" label-width="140px">
        <template v-if="config.current?.type !== 'wallet'">
          <el-form-item label="AppId">
            <el-input v-model="config.form.payMerchantConfigWechatAppId" />
          </el-form-item>
          <el-form-item label="商户号(MchId)">
            <el-input v-model="config.form.payMerchantConfigWechatMchId" />
          </el-form-item>
          <el-form-item label="证书序列号">
            <el-input v-model="config.form.payMerchantConfigWechatMchSerialNo" />
          </el-form-item>
          <el-form-item label="AppSecret">
            <el-input v-model="config.form.payMerchantConfigWechatAppSecret" />
          </el-form-item>
          <el-form-item label="API Key V3">
            <el-input v-model="config.form.payMerchantConfigWechatApiKeyV3" />
          </el-form-item>
          <el-form-item label="私钥路径">
            <el-input v-model="config.form.payMerchantConfigWechatPrivateKeyPath" />
          </el-form-item>
          <el-form-item label="支付回调URL">
            <el-input v-model="config.form.payMerchantConfigWechatPayNotifyUrl" />
          </el-form-item>
          <el-form-item label="退款回调URL">
            <el-input v-model="config.form.payMerchantConfigWechatRefundNotifyUrl" />
          </el-form-item>
        </template>
        <template v-else>
          <el-form-item label="钱包开关">
            <el-switch v-model="walletSwitch" :active-value="1" :inactive-value="0" />
          </el-form-item>
        </template>
      </el-form>
      <template #footer>
        <el-button @click="config.visible = false">取消</el-button>
        <el-button type="primary" @click="handleSaveConfig">保存</el-button>
      </template>
    </el-dialog>
  </el-drawer>
</template>

<script setup lang="ts">
import { reactive, ref, defineExpose, watch } from 'vue'
import { fetchUpdateMerchant } from '../api/merchant'
import { fetchSaveOrUpdateWechatConfig } from '../api/wechat'

const visible = ref(false)
const merchant = ref<any>(null)

const configList = reactive([
  { type: 'wallet', title: '钱包', icon: 'ri:wallet-3-line', enabled: 0 },
  { type: 'timeout', title: '订单超时', icon: 'ri:time-line', enabled: 0 },
  { type: 'js_api', title: '微信小程序/JSAPI', icon: 'simple-icons:wechat', enabled: 0 },
  { type: 'h5', title: '微信H5', icon: 'simple-icons:wechat', enabled: 0 },
  { type: 'native', title: '微信Native', icon: 'simple-icons:wechat', enabled: 0 }
])

const open = (row: any) => {
  merchant.value = row
  // 同步钱包/超时状态
  const wallet = configList.find(i => i.type === 'wallet')
  if (wallet) wallet.enabled = row.payMerchantOpenWallet || 0
  const timeout = configList.find(i => i.type === 'timeout')
  if (timeout) timeout.enabled = row.payMerchantOpenTimeout || 0
  visible.value = true
}

const onToggle = (item: any) => {
  if (item.type === 'wallet') {
    fetchUpdateMerchant({ payMerchantId: merchant.value.payMerchantId, payMerchantOpenWallet: item.enabled })
  }
  if (item.type === 'timeout') {
    merchant.value.payMerchantOpenTimeout = item.enabled
    fetchUpdateMerchant({
      payMerchantId: merchant.value.payMerchantId,
      payMerchantOpenTimeout: item.enabled,
      payMerchantOpenTimeoutTime: merchant.value.payMerchantOpenTimeoutTime
    })
  }
}

const config = reactive<any>({
  visible: false,
  current: null,
  form: {}
})

const walletSwitch = ref(0)

const openConfig = (item: any) => {
  config.current = item
  config.form = {
    payMerchantId: merchant.value?.payMerchantId,
    payMerchantConfigWechatTradeType: item.type,
    payMerchantConfigStatus: item.enabled
  }
  walletSwitch.value = configList[0].enabled
  config.visible = true
}

const handleSaveConfig = async () => {
  if (config.current?.type === 'wallet') {
    await fetchUpdateMerchant({ payMerchantId: merchant.value.payMerchantId, payMerchantOpenWallet: walletSwitch.value })
  } else {
    await fetchSaveOrUpdateWechatConfig({
      ...config.form
    })
  }
  config.visible = false
}

// defineExpose 和 watch 必须放在最后（遵循项目规则）

defineExpose({ open })

watch(config, () => {}, { deep: true })
</script>
