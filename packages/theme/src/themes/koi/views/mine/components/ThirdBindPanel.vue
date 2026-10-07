<template>
  <div class="third-bind">
    <div class="third-bind__desc">绑定第三方账号后可快捷登录；与登录页共用同一三方来源配置。</div>
    <el-skeleton v-if="loading" :rows="3" animated />
    <el-empty v-else-if="!providers.length" description="暂无可用的第三方登录来源" />
    <div v-else class="third-bind__list">
      <div v-for="p in providers" :key="p" class="third-bind__item">
        <span class="third-bind__name">{{ label(p) }}</span>
        <el-tag v-if="bound.includes(p)" type="success" effect="plain">已绑定</el-tag>
        <el-tag v-else type="info" effect="plain">未绑定</el-tag>
        <div class="third-bind__actions">
          <el-button
            v-if="!bound.includes(p)"
            type="primary"
            plain
            size="small"
            :loading="acting === p"
            @click="handleBind(p)"
          >
            绑定
          </el-button>
          <el-button
            v-else
            type="danger"
            plain
            size="small"
            :loading="acting === p"
            @click="handleUnbind(p)"
          >
            解绑
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { msgError, msgSuccess, takeThirdCallbackParams } from "@repo/core";
import {
  getThirdPartyProviders,
  thirdBindCode,
  thirdBindInfo,
  thirdUnbind,
} from "@repo/core";

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
const bound = ref<string[]>([]);
const loading = ref(true);
const acting = ref("");
const router = useRouter();

function label(p: string): string {
  return LABELS[p] ?? p;
}

function unwrap<T>(res: unknown): T | null {
  const data = (res as { data?: unknown })?.data;
  return (data ?? res ?? null) as T | null;
}

async function refresh(): Promise<void> {
  loading.value = true;
  try {
    const [pRes, bRes] = await Promise.all([
      getThirdPartyProviders().catch(() => null),
      thirdBindInfo().catch(() => null),
    ]);
    const p = unwrap<string[]>(pRes);
    const b = unwrap<string[]>(bRes);
    providers.value = Array.isArray(p) ? p : [];
    bound.value = Array.isArray(b) ? b.map((x) => String(x).toLowerCase()) : [];
  } finally {
    loading.value = false;
  }
}

async function handleBind(loginType: string): Promise<void> {
  acting.value = loginType;
  try {
    const callback = `${window.location.origin}${window.location.pathname}`;
    const res = await thirdBindCode({ loginType, thirdType: "0", loginCode: "", callback });
    const url = unwrap<string>(res);
    if (typeof url === "string" && url) {
      window.location.href = url;
    } else {
      msgError("第三方绑定未配置或未启用，请联系管理员");
    }
  } catch (e) {
    msgError((e as Error)?.message || "第三方绑定失败");
  } finally {
    acting.value = "";
  }
}

async function handleUnbind(loginType: string): Promise<void> {
  acting.value = loginType;
  try {
    await thirdUnbind({ loginType });
    msgSuccess("解绑成功");
    await refresh();
  } catch (e) {
    msgError((e as Error)?.message || "解绑失败");
  } finally {
    acting.value = "";
  }
}

onMounted(() => {
  // 三方绑定回跳错误提示：跨域回跳 flash 必丢，错误经 query（thirdMsg）携带；
  // 参数由 core 启动期快照（守卫 replace 可能清空 route.query），此处一次性取用。
  const third = takeThirdCallbackParams();
  if (third.thirdMsg) {
    msgError(third.thirdMsg);
    // 剥离 URL 残留参数，防刷新页面重复提示
    const current = router.currentRoute.value;
    const rest = { ...current.query };
    delete rest.thirdMsg;
    delete rest.redirectParam;
    void router.replace({ path: current.path, query: rest, hash: current.hash });
  }
  void refresh();
});
</script>

<style scoped>
.third-bind__desc {
  margin-bottom: 12px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}
.third-bind__list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.third-bind__item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
}
.third-bind__name {
  min-width: 120px;
  font-weight: 600;
}
.third-bind__actions {
  margin-left: auto;
}
</style>
