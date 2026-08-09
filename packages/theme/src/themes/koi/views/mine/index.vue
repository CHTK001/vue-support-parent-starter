<template>
  <div class="mine-page p-6px">
    <el-row :gutter="20">
      <!-- 左侧：头像 + 用户信息 -->
      <el-col :span="6" :xs="24">
        <el-card class="rounded-md" shadow="never">
          <div class="text-13px text-#303133 dark:text-#E5EAF3">
            <div class="flex flex-justify-center">
              <ReAvatarCrop
                v-model="mine.avatar"
                :action="avatarUploadUrl"
                :headers="avatarHeaders"
                :data="avatarData"
                :response-url-path="'data.url'"
                :trigger-text="'更换头像'"
                :dialog-title="'裁剪头像'"
                @success="handleAvatarSuccess"
                @error="handleAvatarError"
              />
            </div>
            <div class="flex flex-justify-between flex-wrap mt-20px p-y-12px">
              <div class="flex flex-items-center">
                <el-icon size="15"><UserFilled /></el-icon>
                <div class="p-l-2px">登录名称</div>
              </div>
              <div v-text="mine.loginName"></div>
            </div>
            <div class="flex flex-justify-between flex-wrap p-y-12px">
              <div class="flex flex-items-center">
                <el-icon size="15"><User /></el-icon>
                <div class="p-l-2px">用户名称</div>
              </div>
              <div v-text="mine.nickname"></div>
            </div>
            <div class="flex flex-justify-between flex-wrap p-y-12px">
              <div class="flex flex-items-center">
                <el-icon size="15"><Iphone /></el-icon>
                <div class="p-l-2px">手机号码</div>
              </div>
              <div v-text="mine.phone"></div>
            </div>
            <div class="flex flex-justify-between flex-wrap p-y-12px">
              <div class="flex flex-items-center">
                <el-icon size="15"><Message /></el-icon>
                <div class="p-l-2px">用户邮箱</div>
              </div>
              <div v-text="mine.email"></div>
            </div>
            <div class="flex flex-justify-between flex-wrap p-y-12px">
              <div class="flex flex-items-center">
                <el-icon size="15"><Collection /></el-icon>
                <div class="p-l-2px">所属角色</div>
              </div>
              <div v-text="mine.roles"></div>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 右侧：基本资料 / 修改密码 -->
      <el-col :span="18" :xs="24">
        <el-card class="rounded-md" shadow="never" :body-style="{ 'padding-top': '6px' }">
          <el-tabs v-model="activeName">
            <!-- 基本资料 -->
            <el-tab-pane label="基本资料" name="first">
              <el-form ref="mineFormRef" :rules="mineRules" :model="mineForm" label-width="80px" status-icon>
                <el-row>
                  <el-col :sm="{ span: 24 }" :xs="{ span: 24 }">
                    <el-form-item label="登录名称" prop="sysUserUsername">
                      <el-input v-model="mineForm.sysUserUsername" placeholder="请输入登录名称" clearable disabled />
                    </el-form-item>
                  </el-col>
                  <el-col :sm="{ span: 24 }" :xs="{ span: 24 }">
                    <el-form-item label="用户名称" prop="sysUserNickname">
                      <el-input v-model="mineForm.sysUserNickname" placeholder="请输入用户名称" clearable />
                    </el-form-item>
                  </el-col>
                  <el-col :sm="{ span: 24 }" :xs="{ span: 24 }">
                    <el-form-item label="手机号码" prop="sysUserPhone">
                      <el-input v-model="mineForm.sysUserPhone" placeholder="请输入手机号码" clearable />
                    </el-form-item>
                  </el-col>
                  <el-col :sm="{ span: 24 }" :xs="{ span: 24 }">
                    <el-form-item label="邮箱" prop="sysUserEmail">
                      <el-input v-model="mineForm.sysUserEmail" placeholder="请输入邮箱" clearable />
                    </el-form-item>
                  </el-col>
                  <el-col :sm="{ span: 24 }" :xs="{ span: 24 }">
                    <el-form-item label="性别" prop="sysUserSex">
                      <el-radio-group v-model="mineForm.sysUserSex">
                        <el-radio :value="1" border>男</el-radio>
                        <el-radio :value="2" border>女</el-radio>
                        <el-radio :value="0" border>未知</el-radio>
                      </el-radio-group>
                    </el-form-item>
                  </el-col>
                  <el-col :sm="{ span: 24 }" :xs="{ span: 24 }" class="mt-6px">
                    <el-form-item>
                      <el-button type="primary" plain :loading="mineSaving" @click="handleMineSave">保存</el-button>
                      <el-button type="danger" plain @click="resetMineForm">重置</el-button>
                    </el-form-item>
                  </el-col>
                </el-row>
              </el-form>
            </el-tab-pane>

            <!-- 修改密码 -->
            <el-tab-pane label="修改密码" name="second">
              <el-form ref="pwdFormRef" :rules="pwdRules" :model="pwdForm" label-width="80px" status-icon>
                <el-row>
                  <el-col :sm="{ span: 24 }" :xs="{ span: 24 }">
                    <el-form-item label="密码" prop="oldPassword">
                      <el-input v-model="pwdForm.oldPassword" placeholder="请输入旧密码" show-password clearable />
                    </el-form-item>
                  </el-col>
                  <el-col :sm="{ span: 24 }" :xs="{ span: 24 }">
                    <el-form-item label="新密码" prop="newPassword">
                      <el-input v-model="pwdForm.newPassword" placeholder="请输入新密码" show-password clearable />
                    </el-form-item>
                  </el-col>
                  <el-col :sm="{ span: 24 }" :xs="{ span: 24 }">
                    <el-form-item label="确认密码" prop="confirmPassword">
                      <el-input v-model="pwdForm.confirmPassword" placeholder="请输入确认密码" show-password clearable />
                    </el-form-item>
                  </el-col>
                  <el-col :sm="{ span: 24 }" :xs="{ span: 24 }" class="mt-6px">
                    <el-form-item>
                      <el-button type="primary" plain :loading="pwdSaving" @click="handlePwdSave">保存</el-button>
                      <el-button type="danger" plain @click="resetPwdForm">重置</el-button>
                    </el-form-item>
                  </el-col>
                </el-row>
              </el-form>
            </el-tab-pane>

            <el-tab-pane label="锁屏设置" name="third">
              <div class="flex flex-col items-center justify-center p-30px">
                <el-icon size="48" class="text-#409EFF mb-4"><Lock /></el-icon>
                <template v-if="lockHasPassword">
                  <div class="text-#303133 font-medium mb-4">已设置锁屏密码</div>
                  <el-alert type="success" :closable="false" show-icon class="mb-4">
                    当前账号已启用锁屏保护，通过用户菜单"锁屏"可锁定屏幕。
                  </el-alert>
                  <div class="flex gap-4">
                    <el-button type="warning" plain :loading="lockResetting" @click="handleResetLockPwd">重置密码</el-button>
                    <el-button type="primary" plain @click="handleLockNow">立即锁屏</el-button>
                  </div>
                </template>
                <template v-else>
                  <div class="text-#909399 font-medium mb-4">未设置锁屏密码</div>
                  <el-alert type="info" :closable="false" show-icon class="mb-4">
                    设置锁屏密码后，可通过用户菜单"锁屏"入口锁定屏幕。
                  </el-alert>
                  <el-form :model="lockForm" label-width="80px" class="w-360px">
                    <el-form-item label="锁屏密码">
                      <el-input v-model="lockForm.newPassword" type="password" placeholder="请输入锁屏密码（至少4位）" show-password clearable />
                    </el-form-item>
                    <el-form-item label="确认密码">
                      <el-input v-model="lockForm.confirmPassword" type="password" placeholder="请再次输入锁屏密码" show-password clearable />
                    </el-form-item>
                    <el-form-item>
                      <el-button type="primary" plain :loading="lockSetting" @click="handleSetLockPwd">设置密码</el-button>
                    </el-form-item>
                  </el-form>
                </template>
              </div>
            </el-tab-pane>
          </el-tabs>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts" name="minePage">
import { nextTick, onMounted, reactive, ref, computed, defineAsyncComponent } from "vue";
import { UserFilled, User, Iphone, Message, Collection, Lock } from "@element-plus/icons-vue";
import { msgError, msgSuccess, msgBox } from "@repo/core";
import { getUserInfo, getAccessToken, normalizeUrl } from "@repo/utils";
import { getConfig } from "@repo/config";
import useAuthStore from "@repo/pinia/modules/auth";
import useUserStore from "@repo/pinia/modules/user";

const authStore = useAuthStore();
const userStore = useUserStore();

/** 头像裁剪组件（异步加载，按需打包） */
const ReAvatarCrop = defineAsyncComponent(
  () => import("@repo/ui/re-avatar-crop").then((m) => m.default),
);

/** 头像上传 URL：框架 baseUrl + 上传接口（url.upload 统一来源，回退 /v2/file/upload） */
const avatarUploadUrl = computed(() => {
  const baseUrl = getConfig()?.http?.baseUrl || "";
  const uploadUrl = getConfig()?.url?.upload || "/v2/file/upload";
  return normalizeUrl(baseUrl, uploadUrl);
});

/** 上传请求头：带 Bearer token */
const avatarHeaders = computed(() => {
  const token = userStore.accessToken || getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
});

/** 上传额外参数（fileBucket 为后端必填） */
const avatarData = { fileBucket: "default", ossType: "FILESYSTEM" };

/** 上传成功后：PUT /v2/user/update 持久化 sysUserAvatar，刷新登录用户信息 */
async function handleAvatarSuccess(_response: unknown, url: string): Promise<void> {
  if (!url) return;
  mine.value.avatar = url;
  try {
    const { getApiHttp } = await import("@repo/core");
    const res = await getApiHttp()
      .put("/v2/user/update")
      .data({ sysUserAvatar: url } as Record<string, unknown>)
      .then<{ code?: number; msg?: string }>((r) => r.data);
    if (res?.code === 200 || res?.code === 0 || res?.msg === "操作成功" || res?.msg == null) {
      msgSuccess("头像已更新");
      await authStore.getLoginUserInfo();
      refreshMine();
    } else {
      msgError(res?.msg || "头像保存失败");
    }
  } catch (e) {
    msgError("头像保存失败：" + ((e as Error)?.message || "网络异常"));
  }
}

function handleAvatarError(err: unknown): void {
  console.error("[mine] avatar upload failed", err);
  msgError("头像上传失败");
}

/** 个人信息展示（来自 authStore.loginUser + 框架 storage 的 userInfo） */
const mine = ref({
  avatar: "",
  loginName: "",
  nickname: "",
  phone: "",
  email: "",
  roles: "",
});

/** el-card 标签选择 name */
const activeName = ref("first");

/** 读取登录用户信息到展示区与表单 */
const refreshMine = () => {
  const info = (getUserInfo<Record<string, unknown>>() ?? {}) as Record<string, unknown>;
  const loginUser = authStore.loginUser ?? {};
  mine.value = {
    avatar:
      (loginUser.avatar as string) ||
      (info.avatar as string) ||
      (info.sysUserAvatar as string) ||
      getConfig()?.login?.avatarUrl ||
      "",
    loginName: (info.sysUserUsername as string) || (loginUser.loginName as string) || "",
    nickname: (info.sysUserNickname as string) || (info.nickname as string) || "",
    phone: (info.sysUserPhone as string) || (info.phone as string) || "",
    email: (info.sysUserEmail as string) || (info.email as string) || "",
    roles:
      (info.roles as string[])?.join("、") ||
      (loginUser.roles as string[])?.join("、") ||
      authStore.roleList?.join("、") ||
      "",
  };
  mineForm.value = {
    sysUserId: (info.sysUserId ?? loginUser.userId ?? "") as never,
    sysUserUsername: mine.value.loginName,
    sysUserNickname: mine.value.nickname,
    sysUserPhone: mine.value.phone,
    sysUserEmail: mine.value.email,
    sysUserSex: (info.sysUserSex ?? info.sex ?? 0) as never,
  };
};

/** 基本资料 Begin */
const mineFormRef = ref<any>();
const mineSaving = ref(false);
const mineForm = ref<any>({
  sysUserId: "",
  sysUserUsername: "",
  sysUserNickname: "",
  sysUserPhone: "",
  sysUserEmail: "",
  sysUserSex: 0,
});

/** 清空表单数据并回填当前用户信息 */
const resetMineForm = () => {
  nextTick(() => {
    mineFormRef.value?.resetFields();
  });
  refreshMine();
};

/** 表单规则 */
const mineRules = reactive({
  sysUserUsername: [{ required: true, message: "请输入登录名称", trigger: "blur" }],
  sysUserNickname: [{ required: true, message: "请输入用户名称", trigger: "blur" }],
  sysUserPhone: [{ required: true, message: "请输入手机号码", trigger: "blur" }],
  sysUserEmail: [{ required: true, message: "请输入邮箱", trigger: "blur" }],
});

/** 保存基本资料（PUT /v2/user/update，不传 sysUserId 时后端更新当前账号） */
const handleMineSave = () => {
  if (!mineFormRef.value) return;
  mineFormRef.value.validate(async (valid: boolean) => {
    if (!valid) {
      msgError("验证失败，请检查填写内容");
      return;
    }
    mineSaving.value = true;
    try {
      const { getApiHttp } = await import("@repo/core");
      const { sysUserUsername, ...payload } = mineForm.value;
      void sysUserUsername;
      const res = await getApiHttp()
        .put("/v2/user/update")
        .data(payload)
        .then<{ code?: number; msg?: string }>((r) => r.data);
      if (res?.code === 200 || res?.code === 0 || res?.msg === "操作成功" || res?.msg == null) {
        msgSuccess("保存成功");
        // 刷新用户信息到 storage 与 auth store
        await authStore.getLoginUserInfo();
        refreshMine();
      } else {
        msgError(res?.msg || "保存失败");
      }
    } catch (e) {
      msgError("保存失败：" + ((e as Error)?.message || "网络异常"));
    } finally {
      mineSaving.value = false;
    }
  });
};
/** 基本资料 End */

/** 修改密码 Begin */
const pwdFormRef = ref<any>();
const pwdSaving = ref(false);
const pwdForm = ref<any>({
  oldPassword: "",
  newPassword: "",
  confirmPassword: "",
});

/** 清空表单数据 */
const resetPwdForm = () => {
  nextTick(() => {
    pwdFormRef.value?.resetFields();
  });
  pwdForm.value = {
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  };
};

/** 表单规则 */
const pwdRules = reactive({
  oldPassword: [{ required: true, message: "请输入旧密码", trigger: "change" }],
  newPassword: [
    { required: true, message: "请输入新密码", trigger: "change" },
    { min: 6, message: "密码长度不能少于 6 位", trigger: "blur" },
  ],
  confirmPassword: [
    { required: true, message: "请输入确认密码", trigger: "change" },
    {
      validator: (_rule: unknown, value: string, callback: (e?: Error) => void) => {
        if (value !== pwdForm.value.newPassword) {
          callback(new Error("两次输入的密码不一致"));
        } else {
          callback();
        }
      },
      trigger: "blur",
    },
  ],
});

/** 保存修改密码（PUT /v2/user/updateOwner） */
const handlePwdSave = () => {
  if (!pwdFormRef.value) return;
  pwdFormRef.value.validate(async (valid: boolean) => {
    if (!valid) {
      msgError("验证失败，请检查填写内容");
      return;
    }
    pwdSaving.value = true;
    try {
      const { getApiHttp } = await import("@repo/core");
      const res = await getApiHttp()
        .put("/v2/user/updateOwner")
        .data(pwdForm.value)
        .then<{ code?: number; msg?: string }>((r) => r.data);
      if (res?.code === 200 || res?.code === 0 || res?.msg === "操作成功" || res?.msg == null) {
        msgSuccess("密码修改成功");
        resetPwdForm();
      } else {
        msgError(res?.msg || "密码修改失败");
      }
    } catch (e) {
      msgError("密码修改失败：" + ((e as Error)?.message || "网络异常"));
    } finally {
      pwdSaving.value = false;
    }
  });
};
/** 修改密码 End */

/** 锁屏设置 Begin */
const lockHasPassword = ref(false);
const lockSetting = ref(false);
const lockResetting = ref(false);
const lockForm = ref({ newPassword: "", confirmPassword: "" });
const LOCK_KEY = "lock-screen";

async function sha256(text: string): Promise<string> {
  const enc = new TextEncoder().encode(text);
  const buf = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function readLockHash(): string | null {
  try { return localStorage.getItem(LOCK_KEY); }
  catch { return null; }
}

function initLockState(): void {
  lockHasPassword.value = !!readLockHash();
}

function handleSetLockPwd(): void {
  if (!lockForm.value.newPassword) { msgError("请输入锁屏密码"); return; }
  if (lockForm.value.newPassword.length < 4) { msgError("密码至少 4 位"); return; }
  if (lockForm.value.newPassword !== lockForm.value.confirmPassword) { msgError("两次密码不一致"); return; }
  lockSetting.value = true;
  sha256(lockForm.value.newPassword).then(async (hash) => {
    localStorage.setItem(LOCK_KEY, hash);
    lockHasPassword.value = true;
    lockForm.value = { newPassword: "", confirmPassword: "" };
    msgSuccess("锁屏密码设置成功");
    lockSetting.value = false;
    // 通知 LockScreen worker 从 localStorage 同步状态（不传递明文密码）
    window.dispatchEvent(new CustomEvent("lock:password", { detail: { action: "sync" } }));
  });
}

async function handleResetLockPwd(): Promise<void> {
  try {
    await msgBox("确定要重置锁屏密码吗？重置后需重新设置。", "确认重置", "确定", "取消", "warning");
  } catch { return; }
  lockResetting.value = true;
  localStorage.removeItem(LOCK_KEY);
  lockHasPassword.value = false;
  msgSuccess("锁屏密码已重置");
  lockResetting.value = false;
  window.dispatchEvent(new CustomEvent("lock:password", { detail: { action: "reset" } }));
}

function handleLockNow(): void {
  window.dispatchEvent(new CustomEvent("lock:screen"));
}
/** 锁屏设置 End */

onMounted(() => {
  refreshMine();
  initLockState();
  // 监听 Storage 事件（跨标签页同步）
  window.addEventListener("storage", (e) => {
    if (e.key === LOCK_KEY) {
      lockHasPassword.value = !!e.newValue;
    }
  });
});
</script>

<style scoped lang="scss">
.mine-page :deep(.re-avatar-crop__trigger) {
  width: 104px;
  height: 104px;
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid var(--el-border-color-lighter);
}

.mine-page :deep(.re-avatar-crop__preview img),
.mine-page :deep(.re-avatar-crop__placeholder) {
  width: 100%;
  height: 100%;
  border-radius: 50%;
}

.mine-page :deep(.re-avatar-crop__placeholder) {
  font-size: 40px;
  color: var(--el-text-color-placeholder);
}
</style>
