<template>
  <!--
    学生登录页（/edu/student-login）
    独立全屏页面，脱离管理后台外壳：position:fixed 铺满视口。
    设计稿为「左品牌右表单」的双栏卡片，本页用纯 CSS 做装饰（云/星/气泡），
    不引图片资源，避免大体积二进制进仓库。
  -->
  <div class="sl">
    <!-- 背景装饰层：纯 CSS，不参与交互 -->
    <div class="sl-deco" aria-hidden="true">
      <span class="sl-cloud sl-cloud--1"></span>
      <span class="sl-cloud sl-cloud--2"></span>
      <span class="sl-star sl-star--1">★</span>
      <span class="sl-star sl-star--2">★</span>
      <span class="sl-bubble sl-bubble--1"></span>
      <span class="sl-bubble sl-bubble--2"></span>
    </div>

    <div class="sl-card">
      <!-- 左：品牌展示 -->
      <section class="sl-brand">
        <div class="sl-brand__logo">
          <ReIcon name="Reading" :size="46" aria-hidden="true" />
        </div>
        <h1 class="sl-brand__title">趣味学习</h1>
        <p class="sl-brand__slogan">让学习像游戏一样有趣</p>
        <!-- 吉祥物占位：设计稿是插画，这里用一枚大图标 + 装饰圈代替，
             换成真图只需替换这一处节点 -->
        <div class="sl-brand__mascot">
          <div class="sl-brand__mascot-ring"></div>
          <ReIcon name="Notebook" :size="86" aria-hidden="true" />
        </div>
        <div class="sl-brand__dots" aria-hidden="true"><i></i><i></i><i></i></div>
      </section>

      <!-- 右：登录表单 -->
      <section class="sl-form">
        <h2 class="sl-form__title">欢迎回来</h2>
        <p class="sl-form__sub">登录后继续你的学习之旅</p>

        <el-form :model="form" label-position="top" @submit.prevent>
          <el-form-item>
            <el-input
              v-model="form.account"
              size="large"
              placeholder="请输入账号 / 手机号"
              :prefix-icon="User"
              clearable
            />
          </el-form-item>
          <el-form-item>
            <el-input
              v-model="form.password"
              size="large"
              type="password"
              placeholder="请输入密码"
              :prefix-icon="Lock"
              show-password
              @keyup.enter="submit"
            />
          </el-form-item>
        </el-form>

        <div class="sl-form__row">
          <el-checkbox v-model="form.remember">记住我</el-checkbox>
          <button type="button" class="sl-link" @click="onForget">忘记密码?</button>
        </div>

        <button type="button" class="sl-submit" :disabled="loading" @click="submit">
          {{ loading ? "登录中…" : "登 录" }}
        </button>
        <p v-if="error" class="sl-form__err">{{ error }}</p>

        <div class="sl-form__divider"><span>其他登录方式</span></div>
        <div class="sl-oauth">
          <button
            v-for="o in OAUTH"
            :key="o.key"
            type="button"
            class="sl-oauth__btn"
            :title="o.label"
            :aria-label="o.label"
            :style="{ '--oauth-color': o.color }"
            @click="onOauth(o.key)"
          >
            <el-icon :size="20"><component :is="o.icon" /></el-icon>
          </button>
        </div>

        <p class="sl-form__foot">
          还没有账号?
          <button type="button" class="sl-link" @click="onRegister">立即注册</button>
        </p>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * StudentLoginView —— 学生登录页
 *
 * 账号支持两种：**学号** 或 **家长手机号**（两者都存在 edu_student 上）。
 * 登录成功后由 StudentPortalView 拉档案并按学段分流到小学/初中/高中首页。
 *
 * 密码走系统用户体系（/v2/user/login），本登录页不自己建账号：
 * 学生账号由管理员在「学生管理」里建档后首次绑定，或走下方第三方登录。
 */
import { reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { ChatDotRound, Lock, Sunny, User } from "@element-plus/icons-vue";
// ReIcon 由 installKoi → installReIcon.install(app) 全局注册，
// 与 PrimaryHome / JuniorHome / SeniorHome / StudentPortalView 同一口径，此处不单独 import。

const router = useRouter();

const form = reactive({ account: "", password: "", remember: true });
const loading = ref(false);
const error = ref("");

/** 第三方登录入口（当前为占位，接入时替换 onOauth） */
const OAUTH = [
  { key: "wechat", label: "微信登录", icon: ChatDotRound, color: "var(--el-color-success)" },
  { key: "qq", label: "QQ 登录", icon: Sunny, color: "var(--el-color-primary)" },
  { key: "alipay", label: "支付宝登录", icon: Lock, color: "var(--el-color-info)" },
];

/**
 * 提交登录
 *
 * 先按「学号/手机号」当账号试，失败再提示；这里不做多账号探测 ——
 * 账号唯一由后端判定，前端不猜。
 */
async function submit() {
  error.value = "";
  const account = form.account.trim();
  if (!account) {
    error.value = "请输入账号或手机号";
    return;
  }
  if (!form.password) {
    error.value = "请输入密码";
    return;
  }
  loading.value = true;
  try {
    // 与系统登录同源：账号可为学号或手机号，由后端解析
    const { eduaiApi } = await import("../../api/eduaiApi");
    await eduaiApi.studentLogin({ username: account, password: form.password });
    ElMessage.success("登录成功");
    await router.push("/edu/student");
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e);
  } finally {
    loading.value = false;
  }
}

function onForget() {
  ElMessage.info("请联系班主任或校方管理员重置密码");
}

function onRegister() {
  ElMessage.info("学生账号由学校统一开通，无需自行注册");
}

function onOauth(key: string) {
  ElMessage.info(`「${OAUTH.find((o) => o.key === key)?.label}」尚未接入`);
}
</script>

<style scoped>
/*
 * koi 令牌口径（与 PrimaryHome / JuniorHome / SeniorHome / StudentPortalView 一致）：
 *   品牌色带 = --el-color-primary → --el-color-primary-light-3
 *   页面底 = --el-bg-color-page，卡片面 = --el-bg-color
 *   文字四级 = --el-text-color-primary / -regular / -secondary / -placeholder
 *   圆角只走 --el-radius-* 六档，动画只走 --el-transition-duration
 * 卡片类容器不加投影；投影只用于「悬浮浮起」与「键盘焦点环」。
 */
.sl {
  position: fixed;
  inset: 0;
  z-index: 3000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  overflow: auto;
  background: linear-gradient(
    160deg,
    var(--el-color-primary) 0%,
    var(--el-color-primary-light-3) 60%,
    var(--el-bg-color-page) 100%
  );
}

/* ---------- 背景装饰（纯 CSS） ---------- */
.sl-deco {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}
.sl-cloud {
  position: absolute;
  border-radius: var(--el-radius-full, 9999px);
  background: color-mix(in srgb, var(--el-color-white) 22%, transparent);
}
.sl-cloud--1 {
  width: 180px;
  height: 60px;
  left: 6%;
  top: 16%;
}
.sl-cloud--2 {
  width: 240px;
  height: 74px;
  right: 4%;
  bottom: 14%;
}
.sl-star {
  position: absolute;
  color: color-mix(in srgb, var(--el-color-warning) 70%, transparent);
  font-size: 28px;
}
.sl-star--1 {
  left: 14%;
  top: 46%;
}
.sl-star--2 {
  right: 12%;
  top: 30%;
  font-size: 20px;
}
.sl-bubble {
  position: absolute;
  border-radius: 50%;
  border: 1px solid color-mix(in srgb, var(--el-color-white) 35%, transparent);
}
.sl-bubble--1 {
  width: 40px;
  height: 40px;
  left: 22%;
  bottom: 24%;
}
.sl-bubble--2 {
  width: 22px;
  height: 22px;
  right: 20%;
  top: 56%;
}

/* ---------- 主体卡片 ---------- */
.sl-card {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.1fr);
  width: min(980px, 100%);
  overflow: hidden;
  border-radius: var(--el-radius-xl, 16px);
  /* koi 卡片不加投影：用一条边框承载边界 */
  border: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
}

/* 左：品牌 */
.sl-brand {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 36px 28px;
  color: var(--el-color-white);
  background: linear-gradient(150deg, var(--el-color-primary) 0%, var(--el-color-primary-light-3) 100%);
}
.sl-brand__logo {
  width: 76px;
  height: 76px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  color: var(--el-color-white);
  background: color-mix(in srgb, var(--el-color-white) 18%, transparent);
  border: 1px solid color-mix(in srgb, var(--el-color-white) 40%, transparent);
}
.sl-brand__title {
  margin: 6px 0 0;
  font-size: 34px;
  font-weight: 900;
  letter-spacing: 3px;
}
.sl-brand__slogan {
  margin: 0;
  font-size: 15px;
  opacity: 0.92;
}
.sl-brand__mascot {
  position: relative;
  margin-top: 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.sl-brand__mascot-ring {
  position: absolute;
  width: 150px;
  height: 150px;
  border-radius: 50%;
  background: color-mix(in srgb, var(--el-color-white) 14%, transparent);
}
.sl-brand__dots {
  display: flex;
  gap: 8px;
  margin-top: 16px;
}
.sl-brand__dots i {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: color-mix(in srgb, var(--el-color-white) 75%, transparent);
}

/* 右：表单 */
.sl-form {
  padding: 30px 34px 26px;
}
.sl-form__title {
  margin: 0;
  font-size: 27px;
  font-weight: 900;
  color: var(--el-text-color-primary);
}
.sl-form__sub {
  margin: 6px 0 18px;
  font-size: 14px;
  color: var(--el-text-color-secondary);
}
.sl-form :deep(.el-form-item) {
  margin-bottom: 14px;
}
.sl-form__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin: 2px 0 18px;
}
.sl-link {
  border: 0;
  padding: 0;
  cursor: pointer;
  font-size: 14px;
  font-weight: 700;
  color: var(--el-color-primary);
  background: transparent;
  /* 浏览器默认焦点框太粗，统一换成 koi 焦点环 */
  outline: none;
  transition: opacity var(--el-transition-duration-fast, 0.2s) ease;
}
.sl-link:hover {
  opacity: 0.82;
}
.sl-link:focus-visible {
  border-radius: var(--el-radius-sm, 6px);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}
.sl-submit {
  width: 100%;
  height: 50px;
  border: 0;
  border-radius: var(--el-radius-full, 9999px);
  cursor: pointer;
  font-size: 17px;
  font-weight: 900;
  letter-spacing: 4px;
  color: var(--el-color-white);
  background: linear-gradient(135deg, var(--el-color-primary) 0%, var(--el-color-primary-light-3) 100%);
  /* 静止态不加装饰性投影，浮起反馈挪到 hover */
  transition: box-shadow var(--el-transition-duration-fast, 0.2s) ease;
  outline: none;
}
.sl-submit:hover:not(:disabled) {
  box-shadow: 0 10px 22px color-mix(in srgb, var(--el-color-primary) 24%, transparent);
}
.sl-submit:focus-visible {
  /* 按钮本身是主色渐变，补一圈白描边保证任何主题下焦点环都看得见 */
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent),
    0 0 0 5px var(--el-color-white);
}
.sl-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.sl-form__err {
  margin: 10px 0 0;
  font-size: 13px;
  font-weight: 700;
  color: var(--el-color-danger);
}
.sl-form__divider {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 20px 0 14px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}
.sl-form__divider::before,
.sl-form__divider::after {
  content: "";
  flex: 1;
  height: 1px;
  background: var(--el-border-color-lighter);
}
.sl-oauth {
  display: flex;
  justify-content: center;
  gap: 18px;
}
.sl-oauth__btn {
  width: 46px;
  height: 46px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 50%;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  color: var(--el-color-white);
  background: var(--oauth-color, var(--el-color-primary));
  transition: transform var(--el-transition-duration-fast, 0.2s) ease;
  outline: none;
}
.sl-oauth__btn:hover {
  transform: translateY(-2px);
}
.sl-oauth__btn:focus-visible {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}
.sl-form__foot {
  margin: 18px 0 0;
  text-align: center;
  font-size: 14px;
  color: var(--el-text-color-regular);
}

@media (max-width: 860px) {
  .sl-card {
    grid-template-columns: minmax(0, 1fr);
  }
  .sl-brand {
    padding: 26px 20px;
  }
  .sl-brand__mascot {
    display: none;
  }
  .sl-form {
    padding: 24px 20px 22px;
  }
}

/* 尊重系统「减少动态效果」偏好 */
@media (prefers-reduced-motion: reduce) {
  .sl-link,
  .sl-submit,
  .sl-oauth__btn {
    transition: none;
  }
  .sl-oauth__btn:hover {
    transform: none;
  }
}
</style>
