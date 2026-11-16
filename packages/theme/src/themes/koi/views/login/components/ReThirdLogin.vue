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

    <!--
      微信小程序：不是整页授权跳转，而是「出小程序码 → 微信扫码 → 小程序内确认 → 换票」。
      与其它平台共用 /v2/setting/sso/providers 的开关，点开才请求出码接口。
    -->
    <el-dialog
      v-model="miniVisible"
      title="微信小程序扫码登录"
      width="360px"
      align-center
      append-to-body
      class="third-login__mini-dialog"
      @closed="closeMiniLogin"
    >
      <div class="third-login__mini">
        <div v-if="miniLoading" class="third-login__mini-placeholder">
          <el-icon class="is-loading" :size="24"><Loading /></el-icon>
          <span>正在获取小程序码…</span>
        </div>
        <template v-else-if="miniQr?.image">
          <img class="third-login__mini-img" :src="miniQr.image" alt="微信小程序登录码" />
          <p class="third-login__mini-tip">请使用微信扫一扫，扫码后在小程序中确认登录</p>
          <el-button text size="small" @click="loadMiniQr">刷新二维码</el-button>
        </template>
        <p v-else class="third-login__mini-error">{{ miniError }}</p>
      </div>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
/**
 * 第三方登录入口（登录页底部）
 *
 * <p>来源是后端 {@code /v2/setting/sso/providers}：只有已开启的平台会出现。
 * 除微信小程序外，点击后都是「取授权 URL → 整页跳转」；微信小程序是
 * 「出小程序码 → 轮询扫码状态 → 用 scene 一次性换票」，因为小程序没有可跳转的授权页。</p>
 */
import { onBeforeUnmount, onMounted, ref } from "vue";
import { Loading } from "@element-plus/icons-vue";
import {
  msgError,
  getThirdPartyProviders,
  thirdLoginCode,
  wechatMiniQrCode,
  wechatMiniQrExchange,
  wechatMiniQrState,
  setUserRoles,
  setUserPerms,
  refreshDefaultSetting,
} from "@repo/core";
import type { LoginResult, WechatMiniQrCode } from "@repo/core";
import { useRouter } from "vue-router";
import useUserStore from "@repo/pinia/modules/user";
import useAuthStore from "@repo/pinia/modules/auth";
import useKeepAliveStore from "@repo/pinia/modules/keepAlive";
import useTabsStore from "@repo/pinia/modules/tabs";
import { initAuthRouter, resetRouter } from "@repo/pinia";
import { HOME_URL } from "@repo/config";

/** 平台展示名（与后端 sso 开关名语义对齐） */
const LABELS: Record<string, string> = {
  gitee: "Gitee",
  github: "GitHub",
  google: "Google",
  oidc: "OIDC",
  wechat: "微信",
  wechat_mp: "微信公众号",
  wechat_enterprise: "企业微信",
  wechat_mini: "微信小程序",
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

/** 走扫码面板而不是整页跳转的平台 */
const WECHAT_MINI = "wechat_mini";

/** 扫码状态轮询间隔（毫秒）：2s 足够及时，也不至于把服务端打满 */
const MINI_POLL_INTERVAL = 2000;

const providers = ref<string[]>([]);
const loadingProvider = ref("");

const miniVisible = ref(false);
const miniLoading = ref(false);
/** 出码失败/过期时的提示文案（为空时面板不显示错误） */
const miniError = ref("");
const miniQr = ref<WechatMiniQrCode | null>(null);
let miniTimer: ReturnType<typeof setInterval> | undefined;
/** 轮询互斥：上一次还在途时不叠加请求 */
let miniPolling = false;

const router = useRouter();
const userStore = useUserStore();
const authStore = useAuthStore();
const tabsStore = useTabsStore();
const keepAliveStore = useKeepAliveStore();

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

/**
 * 登录成功后的统一收尾。
 *
 * <p>与登录页账号密码登录保持同一套语义：
 * setToken → roles/perms → refreshDefaultSetting → initAuthRouter → 首页。</p>
 *
 * @param result 后端登录结果
 */
async function applyLoginResult(result: LoginResult): Promise<void> {
  authStore.$reset();
  resetRouter();
  userStore.setToken(result);
  if (result.roles?.length) setUserRoles(result.roles);
  if (result.perms?.length) setUserPerms(result.perms);
  // 令牌就绪后补拉后端配置（能力开关等），失败静默降级为本地配置
  void refreshDefaultSetting();
  const username =
    (typeof result.username === "string" && result.username) ||
    ((result.userInfo as Record<string, unknown> | undefined)?.sysUserUsername as string) ||
    "";
  if (username) {
    tabsStore.$reset();
    userStore.setLoginName(username);
  }
  keepAliveStore.$reset();
  await initAuthRouter(router);
  await router.replace(HOME_URL);
}

/** 停掉扫码轮询（关面板 / 换码 / 过期 / 组件卸载都要调） */
function stopMiniPolling(): void {
  if (miniTimer) {
    clearInterval(miniTimer);
    miniTimer = undefined;
  }
}

/** 关闭面板时复位，避免下次打开看到上一张已失效的码 */
function closeMiniLogin(): void {
  stopMiniPolling();
  miniQr.value = null;
  miniError.value = "";
  miniLoading.value = false;
}

/**
 * 用 scene 一次性换票。
 *
 * @param scene 小程序码场景值
 */
async function exchangeMini(scene: string): Promise<void> {
  try {
    miniLoading.value = true;
    const res = await wechatMiniQrExchange(scene);
    const result = res?.data;
    if (!result?.accessToken) {
      miniError.value = res?.msg || "小程序登录失败，请刷新二维码重试";
      return;
    }
    miniVisible.value = false;
    await applyLoginResult(result);
  } catch (e) {
    miniError.value = (e as Error)?.message || "小程序登录失败，请重试";
  } finally {
    miniLoading.value = false;
  }
}

/**
 * 轮询扫码状态。
 *
 * @param scene         场景值
 * @param expireSeconds 二维码有效期（秒），用于本地兜底判定过期
 */
function startMiniPolling(scene: string, expireSeconds: number): void {
  stopMiniPolling();
  const deadline = Date.now() + Math.max(30, expireSeconds || 300) * 1000;
  miniTimer = setInterval(async () => {
    if (miniPolling) return;
    miniPolling = true;
    try {
      if (Date.now() > deadline) {
        stopMiniPolling();
        miniQr.value = null;
        miniError.value = "二维码已过期，请刷新后重新扫码";
        return;
      }
      const res = await wechatMiniQrState(scene);
      const status = res?.data?.status;
      if (status === "CONFIRMED") {
        stopMiniPolling();
        await exchangeMini(scene);
      } else if (status === "EXPIRED") {
        stopMiniPolling();
        miniQr.value = null;
        miniError.value = "二维码已过期，请刷新后重新扫码";
      }
    } catch {
      // 单次轮询失败（网络抖动）不打断，交给下一次
    } finally {
      miniPolling = false;
    }
  }, MINI_POLL_INTERVAL);
}

/** 取小程序码并开始轮询 */
async function loadMiniQr(): Promise<void> {
  stopMiniPolling();
  miniQr.value = null;
  miniError.value = "";
  miniLoading.value = true;
  try {
    const res = await wechatMiniQrCode();
    const data = res?.data;
    if (!data?.image || !data?.scene) {
      // 未配置小程序 AppID/Secret 时后端在这里给可读文案
      miniError.value = res?.msg || "小程序登录暂不可用，请联系管理员";
      return;
    }
    miniQr.value = data;
    startMiniPolling(data.scene, data.expireSeconds ?? 300);
  } catch (e) {
    miniError.value = (e as Error)?.message || "获取小程序码失败，请稍后重试";
  } finally {
    miniLoading.value = false;
  }
}

/** 打开小程序扫码面板 */
async function openMiniLogin(): Promise<void> {
  miniVisible.value = true;
  await loadMiniQr();
}

/** 取授权 URL 后整页跳转（与后端 state 缓存链路对齐） */
async function handleLogin(loginType: string): Promise<void> {
  if (loginType === WECHAT_MINI) {
    await openMiniLogin();
    return;
  }
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

onBeforeUnmount(stopMiniPolling);

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

/* 小程序扫码面板 */
.third-login__mini {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: center;
  justify-content: center;
  min-height: 260px;
}

.third-login__mini-placeholder {
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: center;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.third-login__mini-img {
  display: block;
  width: 220px;
  height: 220px;
  padding: 6px;
  background: #fff;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 10px;
  object-fit: contain;
}

.third-login__mini-tip {
  margin: 0;
  font-size: 13px;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
  text-align: center;
}

.third-login__mini-error {
  max-width: 280px;
  margin: 0;
  font-size: 13px;
  line-height: 1.7;
  color: var(--el-color-danger);
  text-align: center;
}
</style>
