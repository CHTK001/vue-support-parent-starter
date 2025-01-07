<template>
  <div>
    <el-drawer v-model="visible" :title="config.title" size="80%" @close="handleClose">
      <ScArticle :data="config.configList" :rowClick="handleRowClick" :editClick="handleRowClick" />
    </el-drawer>
    <Wechat ref="wechatRef" />
  </div>
</template>
<script setup>
import { fetchListMerchantWechat } from "@/api/wechat";
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import { defineAsyncComponent, defineExpose, nextTick, ref } from "vue";
const ScArticle = defineAsyncComponent(() => import("@repo/components/ScArticle/index.vue"));
const Wechat = defineAsyncComponent(() => import("./wechat.vue"));

const wechat = ref();
const wechatRef = ref();
const configListDefault = {
  js_api: {
    id: 1,
    title: "微信小程序",
    type: "js_api",
    createTime: "2024-08-26T00:00:00.000Z",
    homeImg: useRenderIcon("simple-icons:wechat"),
    typeName: "微信"
  },
  h5: {
    id: 2,
    title: "微信H5",
    type: "h5",
    createTime: "2024-08-26T00:00:00.000Z",
    homeImg: useRenderIcon("simple-icons:wechat"),
    typeName: "微信"
  },
  native: {
    id: 3,
    title: "微信支付",
    type: "native",
    createTime: "2024-08-26T00:00:00.000Z",
    homeImg: useRenderIcon("simple-icons:wechat"),
    typeName: "微信"
  }
};
const config = {
  title: "",
  data: {},
  configList: Object.values(configListDefault)
};
const visible = ref(false);

const handleClose = async () => {
  visible.value = false;
  config.data = {};
};
const handleOpen = async data => {
  config.data = data;
  visible.value = true;
  await handleSearchWechat(data);
  await handleRenderWechat();
};

const handleRowClick = async data => {
  nextTick(() => {
    wechatRef.value.handleOpen(data?.data?.payMerchantConfigWechatId ? "edit" : "add", data);
  });
};

const handleRenderWechat = async () => {
  config.configList.forEach(ele => {
    let value = wechat.value.find(item => {
      return item.payMerchantConfigWechatTradeType === ele.type;
    });
    if (value) {
      ele.data = value;
      return;
    }
    ele.data = {
      payMerchantId: config.data.payMerchantId
    };
  });
};
const handleSearchWechat = async condition => {
  const { data } = await fetchListMerchantWechat(condition);
  const temp = [];
  data.forEach(element => {
    temp.push({
      payMerchantConfigStatus: element.payMerchantConfigStatus,
      payMerchantConfigWechatApiKeyV3: element.payMerchantConfigWechatApiKeyV3,
      payMerchantConfigWechatId: element.payMerchantConfigWechatId,
      payMerchantConfigWechatMchId: element.payMerchantConfigWechatMchId,
      payMerchantConfigWechatAppId: element.payMerchantConfigWechatAppId,
      payMerchantConfigWechatId: element.payMerchantConfigWechatId,
      payMerchantConfigWechatMchSerialNo: element.payMerchantConfigWechatMchSerialNo,
      payMerchantConfigWechatAppSecret: element.payMerchantConfigWechatAppSecret,
      payMerchantConfigWechatTradeType: element.payMerchantConfigWechatTradeType,
      payMerchantConfigWechatNotifyUrl: element.payMerchantConfigWechatNotifyUrl,
      payMerchantConfigWechatPrivateKeyPath: element.payMerchantConfigWechatPrivateKeyPath,
      payMerchantConfigStatus: element.payMerchantConfigStatus,
      payMerchantId: config.data.payMerchantId
    });
  });
  wechat.value = temp;
};

defineExpose({ handleOpen });
</script>
