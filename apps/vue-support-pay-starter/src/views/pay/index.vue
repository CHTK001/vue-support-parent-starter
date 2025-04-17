<template>
  <div>
    <div class="p-4 flex justify-end el-custom-line">
      <el-form ref="formRef" :model="form" :inline="true">
        <el-form-item>
          <el-select v-model="form.payMerchantId" :loading="loading.merchant" :remote="true" :remote-method="handleFilterMethod" class="!min-w-[240px]">
            <el-option v-for="item in merchantList" :key="item.payMerchantId" :label="handleRenderName(item)" :value="item.payMerchantId" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button :icon="useRenderIcon('ep:search')" type="primary" @click="handleSearch" />
          <el-button :icon="useRenderIcon('ep:refresh-left')" @click="handleRefresh" />
        </el-form-item>
      </el-form>
    </div>
    <div class="p-4">
      <ScTable ref="resultRef" :data="configList">
        <template #default="{ row }">
          <el-icon :size="98" class="cover">
            <component :is="handleRenderIcon(row)" :class="row.type" />
          </el-icon>
          <el-text>{{ handleType(row.type, row.payMerchantConfigWechatTradeType) }}</el-text>
          <el-button v-auth="'edit'" size="small" @click.stop="handlePay(row)">测试</el-button>
        </template>
      </ScTable>
      <PayLayout ref="payLayoutRef" />
    </div>
  </div>
</template>
<script setup>
import { fetchPageMerchant } from "@/api/merchant";
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import { handleType } from "@/utils/pay";
import { defineAsyncComponent, defineExpose, nextTick, onMounted, reactive, ref } from "vue";
const PayLayout = defineAsyncComponent(() => import("./pay.vue"));
import { fetchListMerchantWechat } from "@/api/wechat";

const payLayoutRef = ref([]);
const formRef = ref([]);
const resultRef = ref([]);

const loading = reactive({
  merchant: false
});

const merchantList = ref([]);
const form = ref({});
const configList = ref([]);

const handleSearch = async () => {
  configList.value.length = 0;
  if (!form.value.payMerchantId) {
    return;
  }
  const merchant = merchantList.value.filter(it => it.payMerchantId == form.value.payMerchantId)?.[0];
  const { data } = await fetchListMerchantWechat(form.value);
  data.forEach(element => {
    element.type = "wechat";
    configList.value.push(element);
  });

  if (merchant.payMerchantOpenWallet === 1) {
    configList.value.push({
      payMerchantId: merchant.payMerchantId,
      payMerchantWalletId: merchant.payMerchantWalletId,
      type: "wallet",
      payMerchantWalletName: merchant.payMerchantWalletName
    });
  }
  resultRef.value.refresh();
};

const handlePay = item => {
  nextTick(() => {
    payLayoutRef.value.handleOpen(item, merchantList.value.filter(it => it.payMerchantId == form.value.payMerchantId)?.[0]);
  });
};
/**
 * 渲染图标
 * @param item
 * @returns
 */
const handleRenderIcon = item => {
  if (item.type == "wechat") {
    return useRenderIcon("simple-icons:wechat");
  }
  if (item.type == "wallet") {
    return useRenderIcon("ri:wallet-3-line");
  }
  return useRenderIcon("simple-icons:alipay");
};

/**
 * 渲染名称
 * @param item
 * @returns
 */
const handleRenderName = item => {
  return item.payMerchantName + " (" + item.payMerchantCode + ")";
};
const handleRefresh = async () => {
  formRef.value.resetFields();
  handleFilterMethod();
};
const handleFilterMethod = async data => {
  loading.merchant = true;
  return new Promise((resolve, reject) => {
    fetchPageMerchant({
      page: 1,
      limit: 1000,
      name: data
    })
      .then(res => {
        resolve((merchantList.value = res?.data?.data || []));
        if (merchantList.value.length > 0) {
          form.value.payMerchantId = merchantList.value[0].payMerchantId;
          handleSearch();
        }
      })
      .finally(() => {
        loading.merchant = false;
      });
  });
};

onMounted(async () => {
  handleFilterMethod();
});
</script>

<style scoped>
.wechat {
  color: green;
}

.wallet {
  color: darksalmon;
}
</style>
