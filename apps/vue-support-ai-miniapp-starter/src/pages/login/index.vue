<template>
  <view class="login-page">
    <view class="login-card">
      <view class="login-title">AI 助手</view>
      <view class="login-subtitle">与 PC 端同一后端 · 同一账号体系</view>

      <view class="login-field">
        <wd-input
          v-model="username"
          placeholder="用户名"
          :disabled="loading"
          clearable
          no-border
          @confirm="handleLogin"
        />
      </view>
      <view class="login-field">
        <wd-input
          v-model="password"
          placeholder="密码"
          :disabled="loading"
          show-password
          no-border
          @confirm="handleLogin"
        />
      </view>

      <wd-button
        type="primary"
        block
        :loading="loading"
        :disabled="!canSubmit"
        custom-class="login-submit"
        @click="handleLogin"
      >
        {{ loading ? "登录中…" : "登 录" }}
      </wd-button>

      <view class="agree-row">
        <wd-checkbox v-model="agreed" shape="square" checked-color="#2f6fed" custom-class="agree-checkbox">
          <text class="agree-text">我已阅读并同意</text>
        </wd-checkbox>
        <text class="agree-link" @tap="openAgreement('user')">《用户协议》</text>
        <text class="agree-text">和</text>
        <text class="agree-link" @tap="openAgreement('privacy')">《隐私政策》</text>
      </view>

      <view v-if="errorMsg" class="login-error">{{ errorMsg }}</view>
    </view>
  </view>
</template>

<script lang="ts">
import { login } from "../../api/auth";
import { clearToken, getToken, setToken, setUserInfo } from "../../api/http";

/**
 * 登录页（wot-design-uni 组件：wd-input / wd-button）。
 *
 * <p>组件走 easycom 通配符（见 pages.json）：模板写 <code>&lt;wd-input /&gt;</code>
 * 即可，全部 wd-* 都可直接用，无需 import、无需 components 注册；
 * 构建时只把模板里真正出现的组件打进产物。</p>
 *
 * <p>业务：POST /v2/auth/login → token 与用户信息都交给框架的 token 管理器
 * （页面不直接碰存储 key）→ reLaunch 会话页；失败清 token 并展示后端 msg。</p>
 */
export default {
  data() {
    return {
      username: "",
      password: "",
      loading: false,
      errorMsg: "",
      agreed: false,
    };
  },
  computed: {
    canSubmit(): boolean {
      return !this.loading && !!String(this.username || "").trim() && !!this.password;
    },
  },
  onShow() {
    // 已登录直接进会话页
    if (getToken()) {
      uni.reLaunch({ url: "/pages/chat/index" });
    }
  },
  methods: {
    openAgreement(type: "user" | "privacy") {
      uni.navigateTo({ url: `/pages/agreement/index?type=${type}` });
    },

    async handleLogin() {
      if (this.loading) return;
      const username = String(this.username || "").trim();
      const password = String(this.password || "");
      if (!username || !password) {
        this.errorMsg = "请输入用户名和密码";
        return;
      }
      if (!this.agreed) {
        this.errorMsg = "请先阅读并同意《用户协议》和《隐私政策》";
        return;
      }
      this.loading = true;
      this.errorMsg = "";
      try {
        const data = await login(username, password);
        if (!data?.accessToken) {
          throw new Error("登录响应缺少 accessToken");
        }
        setToken(data.accessToken);
        setUserInfo({ ...(data.user || {}) });
        uni.reLaunch({ url: "/pages/chat/index" });
      } catch (error: any) {
        clearToken();
        this.errorMsg = error?.message || "登录失败，请检查用户名密码或后端地址";
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(160deg, #eef2ff 0%, #f5f6f8 60%);
  padding: 48rpx;
  box-sizing: border-box;
}

.login-card {
  width: 100%;
  max-width: 640rpx;
  background: #ffffff;
  border-radius: 24rpx;
  padding: 64rpx 48rpx;
  box-shadow: 0 12rpx 40rpx rgba(31, 35, 41, 0.08);
  box-sizing: border-box;
}

.login-title {
  font-size: 44rpx;
  font-weight: 600;
  text-align: center;
  color: #1f2329;
}

.login-subtitle {
  margin-top: 12rpx;
  margin-bottom: 56rpx;
  font-size: 24rpx;
  color: #8a9099;
  text-align: center;
}

/* 输入框：外壳负责圆角/底色，内部 wd-input 去边框后透明 */
.login-field {
  display: flex;
  align-items: center;
  height: 92rpx;
  background: #f5f6f8;
  border-radius: 16rpx;
  padding: 0 24rpx;
  margin-bottom: 28rpx;
}

.login-field :deep(.wd-input) {
  flex: 1;
  padding: 0;
  background: transparent;
}

.login-field :deep(.wd-input__inner) {
  font-size: 28rpx;
}

.login-submit {
  margin-top: 16rpx;
  height: 92rpx;
  font-size: 32rpx;
}

/* 协议勾选：未勾选不拦点击，提交时给明确提示（禁用按钮无反馈体验更差） */
.agree-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  margin-top: 22rpx;
}

.agree-row :deep(.wd-checkbox) {
  margin-right: 6rpx;
  padding: 0;
}

.agree-row :deep(.wd-checkbox__shape) {
  margin-right: 8rpx;
}

.agree-text {
  font-size: 22rpx;
  color: #8a9099;
}

.agree-link {
  font-size: 22rpx;
  color: #2f6fed;
}

.login-error {
  margin-top: 28rpx;
  font-size: 26rpx;
  color: #e5484d;
  text-align: center;
}
</style>
