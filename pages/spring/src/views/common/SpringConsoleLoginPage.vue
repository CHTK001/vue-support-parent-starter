<template>
  <div class="spring-login-shell">
    <section class="spring-login-card spring-card">
      <div class="spring-login-copy">
        <span class="spring-eyebrow">{{ eyebrow }}</span>
        <h1>{{ title }}</h1>
        <p>{{ description }}</p>
        <ul class="spring-login-hints">
          <li>这是 Spring 模块内置的轻量控制台登录，不接统一用户中心。</li>
          <li>登录成功后会写入当前模块 Session，用于保护控制台页面和配套轻接口。</li>
          <li>部署时建议覆盖默认账号密码，并通过 HTTPS 暴露页面。</li>
        </ul>
      </div>

      <form class="spring-login-form" @submit.prevent="submitLogin">
        <div class="spring-login-badge" :class="{ 'spring-login-badge-open': !authEnabled }">
          {{ authEnabled ? "需要账号密码" : "当前未启用登录校验" }}
        </div>
        <label class="spring-form-field">
          <span>账号</span>
          <input
            v-model.trim="form.username"
            type="text"
            autocomplete="username"
            placeholder="请输入控制台账号"
            :disabled="loading"
          >
        </label>
        <label class="spring-form-field">
          <span>密码</span>
          <input
            v-model.trim="form.password"
            type="password"
            autocomplete="current-password"
            placeholder="请输入控制台密码"
            :disabled="loading"
          >
        </label>
        <p v-if="statusMessage" class="spring-login-status">{{ statusMessage }}</p>
        <p v-if="errorMessage" class="spring-login-error">{{ errorMessage }}</p>
        <div class="spring-login-actions">
          <button type="submit" class="spring-primary-button" :disabled="loading || checking">
            {{ loading ? "登录中..." : authEnabled ? "登录控制台" : "进入控制台" }}
          </button>
        </div>
      </form>
    </section>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";

const props = withDefaults(
  defineProps<{
    title?: string;
    description?: string;
    eyebrow?: string;
    authBasePath?: string;
    defaultRedirect?: string;
  }>(),
  {
    title: "Job Control Console",
    description: "输入模块配置的轻量账号密码后进入任务控制台。",
    eyebrow: "Spring Console Login",
    authBasePath: "./auth",
    defaultRedirect: "./index.html",
  },
);

const checking = ref(true);
const loading = ref(false);
const authEnabled = ref(true);
const errorMessage = ref("");
const statusMessage = ref("正在检查控制台登录状态...");
const form = reactive({
  username: "admin",
  password: "",
});

onMounted(async () => {
  await loadStatus();
});

async function loadStatus() {
  checking.value = true;
  errorMessage.value = "";
  try {
    const payload = await request("status");
    authEnabled.value = payload?.authEnabled !== false;
    if (payload?.authenticated) {
      statusMessage.value = payload?.username
        ? `已登录，正在跳转到 ${payload.username} 的控制台。`
        : "已登录，正在跳转到控制台。";
      redirectToConsole();
      return;
    }
    statusMessage.value = authEnabled.value
      ? "请输入控制台账号密码。"
      : "当前控制台未启用登录校验，可直接进入。";
  } catch (error) {
    statusMessage.value = "";
    errorMessage.value = resolveError(error, "加载登录状态失败");
  } finally {
    checking.value = false;
  }
}

async function submitLogin() {
  loading.value = true;
  errorMessage.value = "";
  statusMessage.value = "";
  try {
    if (!authEnabled.value) {
      redirectToConsole();
      return;
    }
    await request("login", {
      method: "POST",
      body: JSON.stringify({
        username: form.username,
        password: form.password,
      }),
    });
    redirectToConsole();
  } catch (error) {
    errorMessage.value = resolveError(error, "登录失败");
  } finally {
    loading.value = false;
  }
}

async function request(path: string, init?: RequestInit): Promise<any> {
  const headers = new Headers(init?.headers || {});
  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const response = await fetch(buildAuthUrl(path), {
    credentials: "include",
    ...init,
    headers,
  });
  const text = await response.text();
  const payload = text ? safeJsonParse(text) : null;
  if (!response.ok) {
    throw new Error(resolveMessage(payload) || `请求失败: ${response.status}`);
  }
  if (payload && typeof payload === "object" && "code" in payload) {
    const code = String(payload.code ?? "");
    if (!["00000", "200", "0"].includes(code)) {
      throw new Error(resolveMessage(payload) || `业务请求失败: ${code}`);
    }
    return "data" in payload ? payload.data : payload;
  }
  if (payload && typeof payload === "object" && payload.success === false) {
    throw new Error(resolveMessage(payload) || "业务请求失败");
  }
  return payload;
}

function buildAuthUrl(path: string) {
  const normalized = props.authBasePath.endsWith("/")
    ? props.authBasePath
    : `${props.authBasePath}/`;
  return new URL(path.replace(/^\/+/, ""), normalizedUrl(normalized)).toString();
}

function normalizedUrl(relativePath: string) {
  return new URL(relativePath, window.location.href).toString();
}

function redirectToConsole() {
  window.location.replace(resolveRedirect());
}

function resolveRedirect() {
  const redirect = new URLSearchParams(window.location.search).get("redirect");
  if (redirect) {
    try {
      const url = new URL(redirect, window.location.origin);
      if (url.origin === window.location.origin) {
        return url.toString();
      }
    } catch {
      return new URL(props.defaultRedirect, window.location.href).toString();
    }
  }
  return new URL(props.defaultRedirect, window.location.href).toString();
}

function resolveMessage(payload: any) {
  if (!payload) return "";
  if (typeof payload === "string") return payload;
  return payload.message || payload.msg || payload.error || "";
}

function safeJsonParse(value: string) {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function resolveError(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}
</script>
