<template>
  <el-config-provider :locale="elementPlusLocale">
    <router-view />
    <ReDialog />
  </el-config-provider>
</template>

<script setup lang="ts">
import { ReDialog } from "@repo/components/ReDialog";
import { ElConfigProvider, ElNotification } from "element-plus";
import { elementPlusLocale } from "@repo/config";
import { useUserStoreHook } from "@repo/core";
import { computed, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

const userStore = useUserStoreHook();
const route = useRoute();
const router = useRouter();

const agreementNoticeKey = computed(() => {
  const userId = String(userStore.sysUserId || "anonymous");
  const version = String(userStore.agreementVersion || "unknown");
  return `sc:agreement-notice:${userId}:${version}`;
});

const shouldNotifyAgreement = computed(() => {
  if (!userStore.agreementNeedConfirm || !userStore.agreementVersion) {
    return false;
  }
  if (route.path === "/login" || route.name === "Login") {
    return false;
  }
  return !(
    route.name === "AccountSettings" && route.query?.pane === "agreement"
  );
});

const hasShownAgreementNotice = () => {
  if (typeof window === "undefined") {
    return true;
  }
  return window.sessionStorage.getItem(agreementNoticeKey.value) === "1";
};

const markAgreementNoticeShown = () => {
  if (typeof window === "undefined") {
    return;
  }
  window.sessionStorage.setItem(agreementNoticeKey.value, "1");
};

const openAgreementPane = () => {
  void router.push({
    name: "AccountSettings",
    query: { pane: "agreement" },
  });
};

watch(
  [shouldNotifyAgreement, agreementNoticeKey],
  ([shouldShow]) => {
    if (!shouldShow || hasShownAgreementNotice()) {
      return;
    }

    markAgreementNoticeShown();
    ElNotification({
      title: "用户协议已更新",
      message: `检测到最新协议版本 ${userStore.agreementVersion}，请前往账户中心确认。点击此通知可直接跳转。`,
      type: "warning",
      duration: 0,
      position: "top-right",
      offset: 72,
      onClick: openAgreementPane,
    });
  },
  { immediate: true },
);
</script>
