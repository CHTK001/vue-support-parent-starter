<!--
  采集控制台登录门（挂在 body 上的全屏浮层，不占路由）。

  为什么不是路由：koi 基础路由已固定注册 /login，业务应用再声明一条会与之冲突；
  而采集模块用的是自己的 Servlet 会话（JSESSIONID），与平台令牌体系无关，
  所以这里只做「未登录时挡住界面」，不接管导航。
-->
<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { msgError, msgSuccess } from "@repo/core";
import ReButton from "@repo/ui/re-button";
import ReIcon from "@repo/ui/re-icon";
import ReInput from "@repo/ui/re-input";
import { useCollectAuth } from "../composables/useCollectAuth";
import { registerCollectKeepAlive } from "../composables/useCollectKeepAlive";

/** 本浮层每文档只挂载一次且与主应用共享上下文，顺手完成 keep-alive 白名单登记 */
registerCollectKeepAlive();

const { state, bootstrap, login } = useCollectAuth();

const form = reactive({ username: "", password: "" });
const submitting = ref(false);
const errorMsg = ref("");

const visible = computed(() => state.ready && state.needLogin);

onMounted(() => {
  void bootstrap();
});

/** 提交登录；后端账号密码错误是 HTTP 200 + 业务码，成败只能看抛出的 ConsoleError */
async function submit(): Promise<void> {
  if (submitting.value) {
    return;
  }
  if (!form.username.trim() || !form.password) {
    errorMsg.value = "请输入账号和密码";
    return;
  }
  submitting.value = true;
  errorMsg.value = "";
  try {
    await login(form.username.trim(), form.password);
    form.password = "";
    msgSuccess("采集控制台登录成功");
  } catch (error) {
    errorMsg.value = (error as Error)?.message || "登录失败";
    msgError(errorMsg.value);
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <div v-if="visible" class="collect-login-mask">
    <div class="collect-login-card">
      <div class="collect-login-card__mark">
        <ReIcon name="Connection" :size="20"/>
      </div>
      <h2>数据采集平台</h2>
      <p class="collect-login-card__sub">请使用采集控制台账号登录</p>
      <div class="collect-form">
        <ReInput
          v-model="form.username"
          size="large"
          clearable
          placeholder="账号"
          prefix-icon="User"
          autocomplete="username"
          @keyup.enter="submit"
        />
        <ReInput
          v-model="form.password"
          size="large"
          type="password"
          show-password
          placeholder="密码"
          prefix-icon="Lock"
          autocomplete="current-password"
          @keyup.enter="submit"
        />
        <p v-if="errorMsg" class="collect-callout is-bad">{{ errorMsg }}</p>
        <ReButton type="primary" size="large" class="login-submit" :loading="submitting" @click="submit">
          登录
        </ReButton>
      </div>
    </div>
  </div>
</template>

<style scoped>
.collect-login-card__mark {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  margin-bottom: 12px;
  border-radius: 12px;
  color: #fff;
  background: linear-gradient(135deg, var(--el-color-primary), var(--el-color-primary-light-3));
  box-shadow: 0 4px 12px rgb(15 23 42 / 12%);
}

.login-submit {
  width: 100%;
  justify-content: center;
}
</style>
