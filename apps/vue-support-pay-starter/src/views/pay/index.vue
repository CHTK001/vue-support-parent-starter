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

/**
 * 加载支付数据的URL函数
 * 该函数会作为ScTable的url属性使用
 */
const loadPayData = async (params) => {
  try {
    if (!params.payMerchantId) {
      return {
        data: [],
        total: 0
      };
    }
    
    const merchant = merchantList.value.filter(it => it.payMerchantId == params.payMerchantId)?.[0];
    const { data } = await fetchListMerchantWechat(params);
    
    // 处理微信支付数据
    const configList = [];
    data.forEach(element => {
      element.type = "wechat";
      configList.push(element);
    });

    // 处理钱包支付数据
    if (merchant && merchant.payMerchantOpenWallet === 1) {
      configList.push({
        payMerchantId: merchant.payMerchantId,
        payMerchantWalletId: merchant.payMerchantWalletId,
        type: "wallet",
        payMerchantWalletName: merchant.payMerchantWalletName
      });
    }
    
    return {
      data: configList,
      total: configList.length
    };
  } catch (error) {
    console.error("获取支付数据失败:", error);
    return {
      data: [],
      total: 0
    };
  }
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

const handleSearch = async () => {
  // 触发表格刷新
  resultRef.value.refresh();
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