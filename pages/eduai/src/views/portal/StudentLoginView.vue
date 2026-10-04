<template>
  <!--
    学生登录页（/edu/student-login）
    版式对齐「趣味学习-登录页」设计稿：全屏蓝色渐变 + 白卡 + 左内嵌圆角品牌块 + 右表单。
    吉祥物用设计稿导出的 PNG（src/assets/mascot-book.png），不做二次绘制。
    按需求**不提供第三方登录**（无微信/QQ/支付宝入口）。
  -->
  <div class="sl">
    <!-- 背景装饰层：纯 CSS，不参与交互 -->
    <div class="sl-bg" aria-hidden="true">
      <span class="sl-cloud sl-cloud--c1"></span>
      <span class="sl-cloud sl-cloud--c2"></span>
      <span class="sl-cloud sl-cloud--c3"></span>
      <svg class="sl-star sl-star--s1" viewBox="0 0 24 24">
        <path fill="currentColor" d="M12 1c.8 6 4.2 9.4 11 11-6.8 1.6-10.2 5-11 11-.8-6-4.2-9.4-11-11C7.8 10.4 11.2 6.8 12 1z" />
      </svg>
      <svg class="sl-star sl-star--s2" viewBox="0 0 24 24">
        <path fill="currentColor" d="M12 1c.8 6 4.2 9.4 11 11-6.8 1.6-10.2 5-11 11-.8-6-4.2-9.4-11-11C7.8 10.4 11.2 6.8 12 1z" />
      </svg>
      <svg class="sl-star sl-star--s3" viewBox="0 0 24 24">
        <path fill="currentColor" d="M12 1c.8 6 4.2 9.4 11 11-6.8 1.6-10.2 5-11 11-.8-6-4.2-9.4-11-11C7.8 10.4 11.2 6.8 12 1z" />
      </svg>
      <span class="sl-bubble sl-bubble--b1"></span>
      <span class="sl-bubble sl-bubble--b2"></span>
      <span class="sl-bubble sl-bubble--b3"></span>
      <span class="sl-bubble sl-bubble--b4"></span>
    </div>

    <main class="sl-card">
      <!-- 左：品牌面板 -->
      <section class="sl-brand">
        <div class="sl-brand__logo">
          <svg width="42" height="42" viewBox="0 0 48 48">
            <path
              d="M24 13l-11 5v11c0 4 4.5 6.5 11 8 6.5-1.5 11-4 11-8V18l-11-5z"
              fill="none"
              stroke="#20A5EB"
              stroke-width="2.8"
              stroke-linejoin="round"
            />
            <path d="M17 30h14M24 24v12" stroke="#20A5EB" stroke-width="2.6" stroke-linecap="round" />
          </svg>
        </div>
        <h1 class="sl-brand__title">趣味学习</h1>
        <p class="sl-brand__slogan">让学习像游戏一样有趣</p>
        <img class="sl-brand__mascot" :src="mascotBook" alt="戴学士帽的书本吉祥物" />
        <div class="sl-brand__dots"><i></i><i></i><i></i></div>
      </section>

      <!-- 右：登录表单 -->
      <section class="sl-form">
        <h2 class="sl-form__title">欢迎回来</h2>
        <p class="sl-form__tip">登录后继续你的学习之旅</p>

        <form novalidate @submit.prevent="submit">
          <div class="sl-field" :class="{ 'is-error': accountError }">
            <div class="sl-field__box">
              <span class="sl-field__ic">
                <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4.5 20c1.2-3.6 4.2-5 7.5-5s6.3 1.4 7.5 5" />
                </svg>
              </span>
              <input
                v-model="form.account"
                type="text"
                placeholder="请输入学号 / 工号 / 手机号"
                autocomplete="username"
                @input="accountError = ''"
              />
            </div>
            <p class="sl-field__err">{{ accountError }}</p>
          </div>

          <div class="sl-field" :class="{ 'is-error': passwordError }">
            <div class="sl-field__box">
              <span class="sl-field__ic">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="5" y="11" width="14" height="9" rx="2.5" />
                  <path d="M8 11V8a4 4 0 0 1 8 0v3" />
                </svg>
              </span>
              <input
                v-model="form.password"
                :type="showPwd ? 'text' : 'password'"
                placeholder="请输入密码"
                autocomplete="current-password"
                @input="passwordError = ''"
              />
              <button
                type="button"
                class="sl-eye"
                :aria-label="showPwd ? '隐藏密码' : '显示密码'"
                @click="showPwd = !showPwd"
              >
                <svg v-if="!showPwd" width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                  <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
                  <circle cx="12" cy="12" r="2.8" />
                </svg>
                <svg v-else width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                  <path d="M4 4l16 16" />
                  <path d="M9.5 9.6a3 3 0 0 0 4.2 4.2M6.4 6.6C3.9 8.3 2.5 12 2.5 12S6 18.5 12 18.5c1.5 0 2.8-.4 4-1" />
                  <path d="M14.8 6.7c-.9-.3-1.8-.4-2.8-.4C6 6.3 2.5 12 2.5 12" />
                  <path d="M9.5 5.2C10.3 5 11.1 5 12 5c6 0 9.5 6.5 9.5 6.5-.5 1-1.2 2-2 2.9" />
                </svg>
              </button>
            </div>
            <p class="sl-field__err">{{ passwordError }}</p>
          </div>

          <div class="sl-row">
            <label class="sl-remember">
              <input v-model="form.remember" type="checkbox" />
              <span class="sl-remember__box">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M4.5 12.5l5 5L19.5 7" />
                </svg>
              </span>
              记住我
            </label>
            <button type="button" class="sl-forgot" @click="onForget">忘记密码？</button>
          </div>

          <button type="submit" class="sl-submit" :disabled="loading">
            <span v-if="loading" class="sl-spinner"></span>
            <span class="sl-submit__label">{{ loading ? "登录中" : "登 录" }}</span>
          </button>
        </form>

        <p class="sl-foot">
          还没有账号？
          <button type="button" class="sl-foot__link" @click="onRegister">立即注册</button>
        </p>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
/**
 * StudentLoginView —— 学生登录页。
 *
 * <p>账号支持 **学号** 或 **家长手机号**：登录走系统既有的 {@code eduaiApi.studentLogin}，
 * 由后端把两种标识解析成登录名，前端不猜账号、不自行建账号。</p>
 *
 * <p>按需求本页**不提供第三方登录**（微信 / QQ / 支付宝均不实现），
 * 因此设计稿里的「其他登录方式」整块被移除。</p>
 */
import { onMounted, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import mascotBook from "../../assets/mascot-book.png";

const router = useRouter();

const form = reactive({ account: "", password: "", remember: true });
const loading = ref(false);
const showPwd = ref(false);
/** 账号字段校验提示；非空即视为该字段报错 */
const accountError = ref("");
/** 密码字段校验提示；非空即视为该字段报错 */
const passwordError = ref("");

/**
 * 账号形状判断：学号与家长手机号都是纯数字，老师/管理员工号含字母。
 *
 * <p>用它来决定走「学生凭据」还是「老师凭据」，而**不是两种都试一遍**：
 * 学生登录失败会扣减尝试次数（实测返回「还剩 N 次尝试机会」），
 * 双试会把老师账号的可用次数也吃掉。</p>
 *
 * @param account 登录账号
 * @returns 纯数字且长度 >= 6 时视为学生账号
 */
function looksLikeStudent(account: string): boolean {
  return /^\d{6,20}$/.test(account);
}

/**
 * 把任意「抛出物」转成可展示的文案。
 *
 * <p>不能直接 `String(e)`：抛出物不保证是 Error —— 实测本页登录失败时它在浏览器里
 * 被渲染成 `[object Object]`（红字），而 `String({msg: "..."})` 恰好就是那串字符，
 * 真正的后端提示（如「密码错误，还剩 N 次尝试机会」）被整段吞掉。</p>
 *
 * <p>兜底顺序：Error.message → 字符串 → {msg|message|error} → JSON → 统一文案，
 * 保证任何形状都能给出**人话**，绝不把对象本身打印给用户。</p>
 *
 * @param e 捕获到的任意异常
 * @returns 可直接渲染的中文文案
 */
function errorText(e: unknown): string {
  if (e instanceof Error && e.message) {
    return e.message;
  }
  if (typeof e === "string" && e.trim()) {
    return e;
  }
  const box = e as { msg?: unknown; message?: unknown; error?: unknown } | null | undefined;
  for (const candidate of [box?.msg, box?.message, box?.error]) {
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate;
    }
  }
  try {
    const json = JSON.stringify(e);
    if (json && json !== "{}" && json !== "null") {
      return json;
    }
  } catch {
    // 循环引用等无法序列化的情况：落到统一兜底文案
  }
  return "登录失败，请稍后重试";
}

/**
 * 「记住我」在本地保存的账号键。
 *
 * <p>**只存账号，不存口令**：这类页面常出现在机房 / 共用电脑上，
 * 把口令落进 localStorage 等于把它交给下一个使用者。</p>
 */
const REMEMBER_KEY = "eduai.login.account";

/**
 * 读取上次记住的登录账号。
 *
 * @returns 记住的账号；未记住或存储不可用时返回空串
 */
function readRememberedAccount(): string {
  try {
    return localStorage.getItem(REMEMBER_KEY) ?? "";
  } catch {
    // 隐身模式 / 存储被禁用：不影响登录，按「没记住」处理
    return "";
  }
}

/**
 * 按「记住我」的勾选状态写入或清除账号。
 *
 * @param account 本次登录使用的账号
 */
function writeRememberedAccount(account: string): void {
  try {
    if (form.remember && account) {
      localStorage.setItem(REMEMBER_KEY, account);
    } else {
      localStorage.removeItem(REMEMBER_KEY);
    }
  } catch {
    // 写不进去也不该中断登录流程
  }
}

/**
 * 统一登录：学生与老师共用本页，登录后按身份进入各自首页。
 */
async function submit() {
  accountError.value = "";
  passwordError.value = "";
  const account = form.account.trim();
  if (!account) {
    accountError.value = "请输入学号 / 工号 / 手机号";
    return;
  }
  if (!form.password) {
    passwordError.value = "请输入密码";
    return;
  }
  // 只要提交就按勾选状态记账号：失败重试时不用重敲，这也正是「记住我」的用处
  writeRememberedAccount(account);
  loading.value = true;
  try {
    const { eduaiApi } = await import("../../api/eduaiApi");
    const isStudent = looksLikeStudent(account);
    const res = isStudent
      ? await eduaiApi.studentLogin({ username: account, password: form.password })
      : await eduaiApi.userLogin({ username: account, password: form.password });
    // 身份判定：优先看令牌里的角色，其次看账号形状
    const roles = ((res as { roles?: string[] } | undefined)?.roles ?? []).map((r) => String(r).toUpperCase());
    const ext = (res as { user?: { ext?: { accountType?: string } } } | undefined)?.user?.ext;
    const toStudent = isStudent || roles.includes("STUDENT") || ext?.accountType === "student";
    ElMessage.success("登录成功");
    await router.push(toStudent ? "/edu/student" : "/edu/teacher");
  } catch (e) {
    passwordError.value = errorText(e);
  } finally {
    loading.value = false;
  }
}

/** 忘记密码：学生端不自助找回，统一由校方重置 */
function onForget() {
  ElMessage.info("请联系班主任或校方管理员重置密码");
}

/** 注册：学生账号由学校统一开通 */
function onRegister() {
  ElMessage.info("学生账号由学校统一开通，无需自行注册");
}

// 进入页面就把上次记住的账号填回来（只回填账号，绝不回填口令）
onMounted(() => {
  const saved = readRememberedAccount();
  if (saved) {
    form.account = saved;
  }
});
</script>

<style scoped>
/*
 * 版式与配色对齐设计稿（趣味学习-登录页.html）：
 *   背景 = 155deg 蓝渐变 #43b9f7 → #20a5eb → #1b8ce2
 *   主色 = #20a5eb，深色 #1583dd，浅色 #57c0f8，墨色 #17243c，灰 #7e8ca1
 *   卡片 32px 圆角 + 投影；左品牌块内嵌 22px、24px 圆角；表单域 16px 圆角
 * 第三方登录块按需求整块不实现。
 */
.sl {
  position: fixed;
  inset: 0;
  z-index: 3000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px 20px;
  overflow: auto;
  color: #17243c;
  font-family: "Noto Sans SC", "PingFang SC", "Microsoft YaHei", system-ui, sans-serif;
  background: linear-gradient(155deg, #43b9f7 0%, #20a5eb 46%, #1b8ce2 100%);
}

/* ---------- 背景装饰 ---------- */
.sl-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
  z-index: 0;
}
.sl-cloud {
  position: absolute;
  border-radius: 999px;
  background: #fff;
  opacity: 0.92;
  animation: sl-drift 26s ease-in-out infinite;
}
.sl-cloud::before,
.sl-cloud::after {
  content: "";
  position: absolute;
  background: #fff;
  border-radius: 50%;
}
.sl-cloud::before {
  width: 55%;
  height: 150%;
  left: 8%;
  top: -70%;
}
.sl-cloud::after {
  width: 45%;
  height: 130%;
  right: 10%;
  top: -55%;
}
.sl-cloud--c1 {
  width: 150px;
  height: 46px;
  top: 9%;
  left: 5%;
}
.sl-cloud--c2 {
  width: 190px;
  height: 56px;
  bottom: 8%;
  right: 4%;
  animation-duration: 32s;
}
.sl-cloud--c3 {
  width: 90px;
  height: 28px;
  top: 14%;
  right: 16%;
  opacity: 0.7;
  animation-duration: 22s;
}
.sl-star {
  position: absolute;
  color: #ffd95a;
  animation: sl-twinkle 3.2s ease-in-out infinite;
}
.sl-star--s1 {
  width: 26px;
  height: 26px;
  top: 26%;
  left: 10%;
  animation-delay: 0.6s;
}
.sl-star--s2 {
  width: 20px;
  height: 20px;
  top: 20%;
  right: 9%;
  animation-delay: 1.4s;
}
.sl-star--s3 {
  width: 16px;
  height: 16px;
  bottom: 24%;
  left: 20%;
  animation-delay: 2.1s;
}
.sl-bubble {
  position: absolute;
  border-radius: 50%;
  background: radial-gradient(circle at 32% 30%, rgba(255, 255, 255, 0.85), rgba(255, 255, 255, 0.12));
  animation: sl-rise 18s linear infinite;
}
.sl-bubble--b1 {
  width: 16px;
  height: 16px;
  left: 14%;
  bottom: -30px;
  animation-duration: 16s;
}
.sl-bubble--b2 {
  width: 9px;
  height: 9px;
  left: 78%;
  bottom: -20px;
  animation-duration: 12s;
  animation-delay: 3s;
}
.sl-bubble--b3 {
  width: 22px;
  height: 22px;
  left: 88%;
  bottom: -34px;
  animation-duration: 20s;
  animation-delay: 6s;
}
.sl-bubble--b4 {
  width: 10px;
  height: 10px;
  left: 32%;
  bottom: -20px;
  animation-duration: 14s;
  animation-delay: 8s;
}

/* ---------- 卡片 ---------- */
.sl-card {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: 45% 55%;
  width: 100%;
  max-width: 1020px;
  overflow: hidden;
  border-radius: 32px;
  background: #fff;
  box-shadow: 0 34px 70px -22px rgba(16, 74, 132, 0.45), 0 8px 24px -10px rgba(16, 74, 132, 0.25);
  animation: sl-card-in 0.7s cubic-bezier(0.22, 1, 0.36, 1) both;
}

/* ---------- 左：品牌 ---------- */
.sl-brand {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 22px 0 22px 22px;
  padding: 38px 32px 26px;
  overflow: hidden;
  border-radius: 24px;
  text-align: center;
  background: linear-gradient(160deg, #44b9f7 0%, #209cec 55%, #1a86e0 100%);
}
.sl-brand::before {
  content: "";
  position: absolute;
  width: 220px;
  height: 220px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.18), transparent 70%);
  top: -70px;
  right: -70px;
}
.sl-brand__logo {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 74px;
  height: 74px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 10px 22px -8px rgba(10, 70, 130, 0.5);
}
.sl-brand__title {
  position: relative;
  z-index: 1;
  margin: 20px 0 0;
  font-size: 34px;
  font-weight: 900;
  letter-spacing: 2px;
  color: #fff;
}
.sl-brand__slogan {
  position: relative;
  z-index: 1;
  margin: 10px 0 0;
  font-size: 14.5px;
  color: rgba(255, 255, 255, 0.88);
}
.sl-brand__mascot {
  position: relative;
  z-index: 1;
  width: 82%;
  max-width: 280px;
  margin: 6px auto 0;
  filter: drop-shadow(0 14px 18px rgba(12, 70, 130, 0.28));
  animation: sl-floaty 4.5s ease-in-out infinite;
}
.sl-brand__dots {
  position: relative;
  z-index: 1;
  display: flex;
  gap: 9px;
  margin-top: 10px;
}
.sl-brand__dots i {
  display: block;
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.95);
}
.sl-brand__dots i:last-child {
  background: rgba(255, 255, 255, 0.4);
}

/* ---------- 右：表单 ---------- */
.sl-form {
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 46px 52px 40px;
}
.sl-form__title {
  margin: 0;
  font-size: 29px;
  font-weight: 900;
  letter-spacing: 1px;
  color: #17243c;
}
.sl-form__tip {
  margin: 9px 0 0;
  font-size: 14px;
  color: #7e8ca1;
}
.sl-field {
  position: relative;
  margin-top: 20px;
}
/* 图标/眼睛以「输入框」为定位基准，而不是整个字段 ——
   否则错误文案出现后字段变高，图标会跟着下移（实测偏移）。 */
.sl-field__box {
  position: relative;
}
.sl-field__ic {
  position: absolute;
  left: 17px;
  top: 50%;
  display: flex;
  transform: translateY(-50%);
  color: #9db2c9;
  pointer-events: none;
}
.sl-field input {
  width: 100%;
  height: 54px;
  padding: 0 48px 0 50px;
  border: 1.5px solid #e3ebf4;
  border-radius: 16px;
  background: #f6f9fd;
  color: #17243c;
  font-size: 15px;
  font-family: inherit;
  transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
}
.sl-field input::placeholder {
  color: #9fabbd;
}
.sl-field input:focus {
  outline: none;
  border-color: #20a5eb;
  background: #fff;
  box-shadow: 0 0 0 4px rgba(32, 165, 235, 0.13);
}
.sl-field.is-error input {
  border-color: #f0463a;
  background: #fff7f6;
}
.sl-field.is-error {
  animation: sl-shake 0.4s ease;
}
.sl-field__err {
  display: none;
  margin: 7px 2px 0;
  font-size: 12.5px;
  color: #f0463a;
}
.sl-field.is-error .sl-field__err {
  display: block;
}
.sl-eye {
  position: absolute;
  right: 12px;
  top: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border: none;
  border-radius: 10px;
  background: transparent;
  color: #9db2c9;
  cursor: pointer;
  transform: translateY(-50%);
}
.sl-eye:hover {
  color: #20a5eb;
  background: rgba(32, 165, 235, 0.08);
}

.sl-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 18px;
}
.sl-remember {
  display: flex;
  align-items: center;
  gap: 9px;
  font-size: 14px;
  color: #46536a;
  cursor: pointer;
  user-select: none;
}
.sl-remember input {
  position: absolute;
  width: 0;
  height: 0;
  opacity: 0;
}
.sl-remember__box {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border: 1.8px solid #c3d0df;
  border-radius: 7px;
  background: #fff;
  transition: 0.18s;
}
.sl-remember__box svg {
  color: #fff;
  opacity: 0;
  transform: scale(0.5);
  transition: 0.18s;
}
.sl-remember input:checked + .sl-remember__box {
  border-color: #20a5eb;
  background: #20a5eb;
}
.sl-remember input:checked + .sl-remember__box svg {
  opacity: 1;
  transform: scale(1);
}
.sl-forgot {
  padding: 0;
  border: none;
  background: transparent;
  color: #20a5eb;
  font-size: 14px;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
}
.sl-forgot:hover {
  text-decoration: underline;
}

.sl-submit {
  position: relative;
  width: 100%;
  height: 54px;
  margin-top: 24px;
  overflow: hidden;
  border: none;
  border-radius: 16px;
  color: #fff;
  font-size: 17px;
  font-weight: 700;
  font-family: inherit;
  letter-spacing: 6px;
  cursor: pointer;
  background: linear-gradient(90deg, #57c0f8, #20a5eb 45%, #1583dd);
  box-shadow: 0 14px 26px -10px rgba(24, 130, 220, 0.6);
  transition: transform 0.15s, box-shadow 0.2s, filter 0.2s;
}
.sl-submit:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 18px 30px -10px rgba(24, 130, 220, 0.7);
}
.sl-submit:active:not(:disabled) {
  transform: translateY(0);
}
.sl-submit:disabled {
  cursor: wait;
  filter: brightness(0.92);
}
.sl-spinner {
  display: inline-block;
  width: 20px;
  height: 20px;
  margin-right: 10px;
  vertical-align: -4px;
  border: 2.5px solid rgba(255, 255, 255, 0.4);
  border-top-color: #fff;
  border-radius: 50%;
  animation: sl-spin 0.7s linear infinite;
}

.sl-foot {
  margin: 22px 0 0;
  font-size: 14px;
  color: #7e8ca1;
  text-align: center;
}
.sl-foot__link {
  padding: 0;
  border: none;
  background: transparent;
  color: #20a5eb;
  font-weight: 700;
  font-family: inherit;
  cursor: pointer;
}
.sl-foot__link:hover {
  text-decoration: underline;
}

@keyframes sl-card-in {
  from {
    opacity: 0;
    transform: translateY(26px) scale(0.985);
  }
  to {
    opacity: 1;
    transform: none;
  }
}
@keyframes sl-drift {
  0%,
  100% {
    transform: translateX(0);
  }
  50% {
    transform: translateX(26px);
  }
}
@keyframes sl-rise {
  0% {
    transform: translateY(0);
    opacity: 0;
  }
  12% {
    opacity: 0.9;
  }
  100% {
    transform: translateY(-105vh);
    opacity: 0.2;
  }
}
@keyframes sl-twinkle {
  0%,
  100% {
    transform: scale(0.82);
    opacity: 0.65;
  }
  50% {
    transform: scale(1.12);
    opacity: 1;
  }
}
@keyframes sl-floaty {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-9px);
  }
}
@keyframes sl-shake {
  0%,
  100% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(-7px);
  }
  75% {
    transform: translateX(7px);
  }
}
@keyframes sl-spin {
  to {
    transform: rotate(360deg);
  }
}

/* ---------- 响应式 ---------- */
@media (max-width: 900px) {
  .sl-card {
    grid-template-columns: 1fr;
    max-width: 470px;
  }
  .sl-brand {
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0 18px;
    margin: 18px;
    padding: 22px 24px;
  }
  .sl-brand__logo {
    width: 58px;
    height: 58px;
  }
  .sl-brand__title {
    margin-top: 0;
    font-size: 26px;
    letter-spacing: 1px;
  }
  .sl-brand__slogan {
    margin-top: 6px;
  }
  .sl-brand__mascot {
    order: 5;
    width: 92px;
    margin: 2px 0 0;
  }
  .sl-brand__dots {
    display: none;
  }
  .sl-form {
    padding: 8px 30px 30px;
  }
}
@media (max-width: 460px) {
  .sl {
    padding: 16px 12px;
  }
  .sl-card {
    border-radius: 24px;
  }
  .sl-brand {
    margin: 14px;
    padding: 18px;
    border-radius: 18px;
  }
  .sl-form {
    padding: 6px 20px 24px;
  }
  .sl-form__title {
    font-size: 24px;
  }
  .sl-field input {
    height: 50px;
    font-size: 16px;
  }
  .sl-eye {
    right: 9px;
    width: 40px;
    height: 40px;
  }
  .sl-submit {
    height: 50px;
  }
}

/* 尊重系统「减少动态效果」偏好 */
@media (prefers-reduced-motion: reduce) {
  .sl-bg *,
  .sl-brand__mascot,
  .sl-submit {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
  .sl-card,
  .sl-field.is-error {
    animation: none !important;
  }
}
</style>
