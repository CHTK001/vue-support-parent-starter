<template>
  <div v-if="providers.length" class="third-login">
    <div class="third-login__divider">
      <span class="third-login__line"></span>
      <span class="third-login__text">第三方登录</span>
      <span class="third-login__line"></span>
    </div>
    <div class="third-login__list">
      <el-button
        v-for="p in providers"
        :key="p"
        circle
        :title="providerLabel(p)"
        :loading="loadingProvider === p"
        class="third-login__btn"
        @click="handleLogin(p)"
      >
        <span class="third-login__abbr">{{ providerAbbr(p) }}</span>
      </el-button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, ref } from "vue";
import { msgError } from "@repo/core";
import { getThirdPartyProviders, thirdLoginCode } from "@repo/core";

/** 平台展示名（与后端 sso 开关名语义对齐） */
const LABELS: Record<string, string> = {
  gitee: "Gitee",
  github: "GitHub",
  google: "Google",
  oidc: "OIDC",
  wechat: "微信",
  wechat_mp: "微信公众号",
  wechat_enterprise: "企业微信",
  qq: "QQ",
  alipay: "支付宝",
  dingtalk: "钉钉",
  weibo: "微博",
  baidu: "百度",
  microsoft: "微软",
  taobao: "淘宝",
  douyin: "抖音",
  feishu: "飞书",
};

const providers = ref<string[]>([]);
const loadingProvider = ref("");

function providerLabel(p: string): string {
  return LABELS[p] ?? p;
}

function providerAbbr(p: string): string {
  const label = LABELS[p] ?? p;
  return label.slice(0, 2);
}

async function loadProviders(): Promise<void> {
  try {
    const res = await getThirdPartyProviders();
    const data = (res as unknown as { data?: unknown })?.data ?? (res as unknown as string[]);
    providers.value = Array.isArray(data) ? (data as string[]) : [];
  } catch {
    providers.value = [];
  }
}

/** 取授权 URL 后整页跳转（与后端 state 缓存链路对齐） */
async function handleLogin(loginType: string): Promise<void> {
  loadingProvider.value = loginType;
  try {
    const callback = `${window.location.origin}${window.location.pathname}`;
    const res = await thirdLoginCode({ loginType, thirdType: "1", loginCode: "", callback });
    const url = (res as unknown as { data?: unknown })?.data ?? (res as unknown as string);
    if (typeof url === "string" && url) {
      window.location.href = url;
    } else {
      msgError("第三方登录未配置或未启用，请联系管理员");
    }
  } catch (e) {
    msgError((e as Error)?.message || "第三方登录失败");
  } finally {
    loadingProvider.value = "";
  }
}

onMounted(() => {
  void loadProviders();
});
</script>

<style scoped>
.third-login {
  margin-top: 16px;
}
.third-login__divider {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}
.third-login__line {
  flex: 1;
  height: 1px;
  background: var(--el-border-color-lighter);
}
.third-login__text {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.third-login__list {
  display: flex;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
}
.third-login__abbr {
  font-size: 12px;
  font-weight: 600;
}
</style>
