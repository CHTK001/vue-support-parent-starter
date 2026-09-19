<template>
  <el-card shadow="never" :body-style="{ padding: '20px' }" class="m-10px">
  <div class="mine-page">
    <el-row :gutter="20">
      <!-- 左侧：头像 + 用户信息 -->
      <el-col :span="6" :xs="24">
        <el-card class="rounded-md" shadow="never">
          <div class="text-13px text-#303133 dark:text-#E5EAF3">
            <div class="flex flex-justify-center">
              <div class="mine-avatar-frame-box" :style="{ padding: frameSpill(104, 0) + 'px' }">
                <div v-if="mineFrameVisible" class="mine-avatar-frame-layer" :style="mineFrameLayer(104, 0)"></div>
                <ReAvatarCrop
                  v-model="mineAvatar"
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
                <el-icon size="15"><CreditCard /></el-icon>
                <div class="p-l-2px">身份证</div>
              </div>
              <div v-text="mine.idCard || '-'"></div>
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
            <el-tab-pane name="first">
              <template #label>
                <span class="flex items-center gap-4px">
                  <el-icon :size="15"><UserFilled /></el-icon>
                  <span>基本资料</span>
                </span>
              </template>
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
                      <el-input v-model="mineForm.sysUserPhone" placeholder="请输入手机号码（选填）" clearable />
                    </el-form-item>
                  </el-col>
                  <el-col :sm="{ span: 24 }" :xs="{ span: 24 }">
                    <el-form-item label="邮箱" prop="sysUserEmail">
                      <el-input v-model="mineForm.sysUserEmail" placeholder="请输入邮箱（选填）" clearable />
                    </el-form-item>
                  </el-col>
                  <el-col :sm="{ span: 24 }" :xs="{ span: 24 }">
                    <el-form-item label="身份证" prop="sysUserCard">
                      <el-input v-model="mineForm.sysUserCard" placeholder="请输入身份证号（选填）" clearable maxlength="18" />
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
            <el-tab-pane name="second">
              <template #label>
                <span class="flex items-center gap-4px">
                  <el-icon :size="15"><Key /></el-icon>
                  <span>修改密码</span>
                </span>
              </template>
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

            <!-- 账号安全：两步验证 -->
            <el-tab-pane name="secure">
              <template #label>
                <span class="flex items-center gap-4px">
                  <el-icon :size="15"><Iphone /></el-icon>
                  <span>账号安全</span>
                </span>
              </template>
              <div class="secure-panel">
                <div class="secure-panel__header">
                  <div class="secure-panel__icon">
                    <el-icon :size="26"><Iphone /></el-icon>
                  </div>
                  <div class="secure-panel__title">两步验证（TOTP）</div>
                  <div class="secure-panel__desc">
                    开启后登录需额外输入验证器 App 生成的 6 位动态码；需系统设置「登录校验动态验证码」同时开启才会生效
                  </div>
                </div>

                <div class="secure-status" :class="totpEnabled ? 'secure-status--enabled' : 'secure-status--disabled'">
                  <div class="secure-status__badge">
                    <span class="secure-status__dot"></span>
                    {{ totpEnabled ? "已开启" : "未开启" }}
                  </div>
                  <div class="secure-status__text">
                    {{ totpEnabled ? "当前账号已绑定验证器，登录时会校验动态验证码" : "当前账号未绑定验证器，仅凭密码即可登录" }}
                  </div>
                  <div class="secure-actions">
                    <el-button v-if="!totpEnabled" type="primary" :loading="totpLoading" @click="openTotpBind">
                      开启两步验证
                    </el-button>
                    <el-button v-else type="danger" plain :loading="totpUnbinding" @click="handleTotpUnbind">
                      关闭两步验证
                    </el-button>
                  </div>
                </div>
              </div>

              <el-dialog v-model="totpDialogVisible" title="开启两步验证" width="520px" @closed="handleTotpDialogClosed">
                <div class="totp-bind">
                  <div class="totp-bind__tip">
                    请用验证器 App（Google Authenticator / Microsoft Authenticator 等）添加下面的密钥，再输入 App 生成的 6
                    位动态码完成绑定。
                  </div>
                  <div class="totp-bind__row">
                    <span class="totp-bind__label">密钥</span>
                    <code class="totp-bind__value">{{ totpSecret || "-" }}</code>
                    <el-button link type="primary" @click="copyTotpText(totpSecret)">复制</el-button>
                  </div>
                  <div class="totp-bind__row">
                    <span class="totp-bind__label">绑定链接</span>
                    <span class="totp-bind__value totp-bind__value--uri">{{ totpUri }}</span>
                    <el-button link type="primary" @click="copyTotpText(totpUri)">复制</el-button>
                  </div>
                  <el-input
                    v-model="totpCode"
                    class="mt-12px"
                    placeholder="请输入 6 位动态码"
                    maxlength="6"
                    clearable
                    @keyup.enter="handleTotpConfirm"
                  />
                </div>
                <template #footer>
                  <el-button @click="totpDialogVisible = false">取消</el-button>
                  <el-button type="primary" :loading="totpVerifying" @click="handleTotpConfirm">确认开启</el-button>
                </template>
              </el-dialog>
            </el-tab-pane>

            <el-tab-pane v-if="frameEnabled" name="frame">
              <template #label>
                <span class="flex items-center gap-4px">
                  <el-icon :size="15"><Picture /></el-icon>
                  <span>头像框</span>
                </span>
              </template>
              <AvatarFramePanel :avatar="mineAvatar" @updated="refreshMine" />
            </el-tab-pane>

            <el-tab-pane name="third">
              <template #label>
                <span class="flex items-center gap-4px">
                  <el-icon :size="15"><Lock /></el-icon>
                  <span>锁屏设置</span>
                </span>
              </template>
              <div class="lock-panel">
                <div class="lock-panel__header">
                  <div class="lock-panel__icon">
                    <el-icon :size="26"><Lock /></el-icon>
                  </div>
                  <div class="lock-panel__title">锁屏保护</div>
                  <div class="lock-panel__desc">设置锁屏密码后，可通过用户菜单「锁屏」随时锁定屏幕</div>
                </div>

                <template v-if="lockHasPassword">
                  <div class="lock-status lock-status--enabled">
                    <div class="lock-status__badge">
                      <span class="lock-status__dot"></span>
                      已开启
                    </div>
                    <div class="lock-status__text">当前账号已启用锁屏保护，锁屏后需输入密码解锁</div>
                    <div class="lock-actions">
                      <el-button type="warning" plain :loading="lockResetting" @click="handleResetLockPwd">重置密码</el-button>
                      <el-button type="danger" plain :loading="lockClearing" @click="handleClearLockPwd">取消锁屏</el-button>
                      <el-button type="primary" @click="handleLockNow">立即锁屏</el-button>
                    </div>
                  </div>
                </template>

                <template v-else>
                  <div class="lock-status lock-status--disabled">
                    <div class="lock-status__badge">
                      <span class="lock-status__dot"></span>
                      未开启
                    </div>
                    <div class="lock-status__text">当前未设置锁屏密码，锁屏功能暂不可用</div>
                  </div>
                  <el-form :model="lockForm" class="lock-form" @submit.prevent="handleSetLockPwd">
                    <div class="lock-form__item">
                      <label class="lock-form__label">锁屏密码</label>
                      <el-input
                        v-model="lockForm.newPassword"
                        type="password"
                        placeholder="请输入锁屏密码（至少 4 位）"
                        show-password
                        clearable
                      />
                    </div>
                    <div class="lock-form__item">
                      <label class="lock-form__label">确认密码</label>
                      <el-input
                        v-model="lockForm.confirmPassword"
                        type="password"
                        placeholder="请再次输入锁屏密码"
                        show-password
                        clearable
                      />
                    </div>
                    <el-button type="primary" class="lock-form__submit" :loading="lockSetting" @click="handleSetLockPwd">
                      设置密码
                    </el-button>
                  </el-form>
                </template>
              </div>
            </el-tab-pane>
          </el-tabs>
        </el-card>
      </el-col>
    </el-row>
  </div>
  </el-card>
</template>

<script setup lang="ts" name="minePage">
// @ts-nocheck
import { nextTick, onMounted, reactive, ref, computed, defineAsyncComponent } from "vue";
import { UserFilled, User, Iphone, Message, Collection, Lock, Key, Picture } from "@element-plus/icons-vue";
import { msgError, msgSuccess, msgBox } from "@repo/core";
import { getUserInfo, getAccessToken, normalizeUrl, resolveUserDisplayInfo, Http } from "@repo/utils";
import { getConfig } from "@repo/config";
import { defaultAvatarUrl } from "@repo/assets";
import { useWornAvatarFrame } from "@repo/theme/koi/components/useWornAvatarFrame";
import AvatarFramePanel from "@repo/theme/koi/components/AvatarFramePanel.vue";
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
      .then<{ code?: string; msg?: string; success?: boolean }>((r) => r.data);
    if (Http.isSuccessful(res)) {
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
  avatarFrame: 0,
  avatarFrameShow: 0,
  birthday: "",
});

/** el-card 标签选择 name */
const activeName = ref("first");

/** 头像框开关：由 app.yaml 的 other.avatarFrame.enable 控制（默认关闭） */
const frameEnabled = computed(() => getConfig()?.other?.avatarFrame?.enable ?? false);

/** 默认头像（与顶部 ReUser 一致） */
const DEFAULT_AVATAR = defaultAvatarUrl;

/** 展示用头像：无头像时回退默认头像（与顶部一致） */
const mineAvatar = computed<string>({
  get: () => mine.value.avatar || DEFAULT_AVATAR,
  set: (v: string) => {
    mine.value.avatar = v;
  },
});

/** 头像框：数据源取 /me 最新结果（个人中心刚改完要立刻看到），层尺寸按头像裁剪区 104px */
const {
  visible: mineFrameVisible,
  layerStyle: mineFrameLayer,
  spillPx: frameSpill,
} = useWornAvatarFrame(() => mine.value);

/** 读取登录用户信息到展示区与表单 */
const refreshMine = async () => {
  // 直接调用 /me 接口获取最新用户信息
  try {
    const { getApiHttp } = await import("@repo/core");
    const res = await getApiHttp().get("/v2/user/me").then((r) => r.data);
    const data = res?.data ?? {};
    
    mine.value = {
      avatar: data.avatar || getConfig()?.login?.avatarUrl || "",
      loginName: data.sysUserUsername || "",
      nickname: data.sysUserNickname || "",
      phone: data.sysUserPhone || "",
      email: data.sysUserEmail || "",
      roles: data.roles?.join("、") || authStore.roleList?.join("、") || "",
      avatarFrame: data.sysUserAvatarFrame ?? 0,
      avatarFrameShow: data.sysUserAvatarFrameShow ?? 0,
      birthday: data.sysUserBirthday || "",
    };
    mineForm.value = {
      sysUserId: data.sysUserId ?? "",
      sysUserUsername: mine.value.loginName,
      sysUserNickname: mine.value.nickname,
      sysUserPhone: mine.value.phone,
      sysUserEmail: mine.value.email,
      sysUserCard: data.sysUserCard ?? "",
      sysUserSex: data.sysUserSex ?? 0,
    };
  } catch (e) {
    console.error("获取用户信息失败", e);
  }
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
  sysUserCard: "",
  sysUserSex: 0,
});

/** 清空表单数据并回填当前用户信息 */
const resetMineForm = () => {
  nextTick(() => {
    mineFormRef.value?.resetFields();
  });
  refreshMine();
};

/** 表单规则：手机号/邮箱选填，填了才校验格式（存量账号手机号为空时不应阻断保存） */
const mineRules = reactive({
  sysUserUsername: [{ required: true, message: "请输入登录名称", trigger: "blur" }],
  sysUserNickname: [{ required: true, message: "请输入用户名称", trigger: "blur" }],
  sysUserPhone: [
    {
      validator: (_rule: unknown, value: string, callback: (e?: Error) => void) => {
        if (!value || /^1[3-9]\d{9}$/.test(value)) {
          callback();
        } else {
          callback(new Error("手机号格式不正确"));
        }
      },
      trigger: "blur",
    },
  ],
  sysUserEmail: [
    {
      validator: (_rule: unknown, value: string, callback: (e?: Error) => void) => {
        if (!value || /^[\w.+-]+@[\w-]+(\.[\w-]+)+$/.test(value)) {
          callback();
        } else {
          callback(new Error("邮箱格式不正确"));
        }
      },
      trigger: "blur",
    },
  ],
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
        .then<{ code?: string; msg?: string; success?: boolean }>((r) => r.data);
      if (Http.isSuccessful(res)) {
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
        .then<{ code?: string; msg?: string; success?: boolean }>((r) => r.data);
      if (Http.isSuccessful(res)) {
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

/** 账号安全（TOTP 两步验证）Begin */
const totpEnabled = ref(false);
const totpLoading = ref(false);
const totpUnbinding = ref(false);
const totpVerifying = ref(false);
const totpDialogVisible = ref(false);
const totpUri = ref("");
const totpSecret = ref("");
const totpCode = ref("");
/** 本次是否由「未开启」状态新拉取了密钥：取消时需回滚，否则会留下未验证的密钥 */
const totpPendingRollback = ref(false);

/** 动态码校验使用的账号名（verify 接口按用户名查库） */
const totpUsername = computed(() => mine.value.loginName || userStore.username || "");

/** 读取当前账号的 2FA 绑定状态（后端返回裸 Boolean） */
const loadTotpStatus = async () => {
  try {
    const { getApiHttp } = await import("@repo/core");
    const res = await getApiHttp()
      .get("/v2/user/totp/status")
      .then((r: any) => r.data);
    totpEnabled.value = res?.data === true;
  } catch (e) {
    console.error("[mine] 获取 2FA 状态失败", e);
    totpEnabled.value = false;
  }
};

/** 拉取绑定链接：后端会在密钥为空时生成并落库，因此取消时需要回滚 */
const openTotpBind = async () => {
  totpLoading.value = true;
  try {
    const { getApiHttp } = await import("@repo/core");
    const res = await getApiHttp()
      .get("/v2/user/totp/generateUri")
      .then((r: any) => r.data);
    const uri = String(res?.data ?? "");
    if (!uri) {
      msgError(res?.msg || "获取绑定链接失败");
      return;
    }
    totpUri.value = uri;
    totpSecret.value = uri.match(/[?&]secret=([^&]+)/)?.[1] ?? "";
    totpCode.value = "";
    totpPendingRollback.value = !totpEnabled.value;
    totpDialogVisible.value = true;
  } catch (e) {
    msgError("获取绑定链接失败：" + ((e as Error)?.message || "网络异常"));
  } finally {
    totpLoading.value = false;
  }
};

/** 用验证器生成的动态码完成绑定（校验通过即视为已开启，密钥已落库） */
const handleTotpConfirm = async () => {
  if (!/^\d{6}$/.test(totpCode.value)) {
    msgError("请输入 6 位动态码");
    return;
  }
  if (!totpUsername.value) {
    msgError("未获取到登录账号，请刷新后重试");
    return;
  }
  totpVerifying.value = true;
  try {
    const { getApiHttp } = await import("@repo/core");
    const res = await getApiHttp()
      .get("/v2/user/totp/verify")
      .query({ code: totpCode.value, username: totpUsername.value } as Record<string, unknown>)
      .then<{ code?: string; data?: boolean; msg?: string; success?: boolean }>((r) => r.data);
    if (Http.isSuccessful(res) && res?.data === true) {
      totpPendingRollback.value = false;
      totpEnabled.value = true;
      totpDialogVisible.value = false;
      msgSuccess("两步验证已开启");
    } else {
      msgError(res?.msg || "验证码错误或已过期");
    }
  } catch (e) {
    msgError("验证码校验失败：" + ((e as Error)?.message || "网络异常"));
  } finally {
    totpVerifying.value = false;
  }
};

/** 解绑 2FA；silent 用于取消绑定时的静默回滚 */
const doTotpUnbind = async (silent: boolean) => {
  try {
    const { getApiHttp } = await import("@repo/core");
    const res = await getApiHttp()
      .put("/v2/user/totp/unbind")
      .then<{ code?: string; data?: boolean; msg?: string; success?: boolean }>((r) => r.data);
    if (Http.isSuccessful(res)) {
      totpEnabled.value = false;
      if (!silent) msgSuccess("两步验证已关闭");
    } else if (!silent) {
      msgError(res?.msg || "操作失败");
    }
  } catch (e) {
    if (!silent) msgError("操作失败：" + ((e as Error)?.message || "网络异常"));
  }
};

const handleTotpUnbind = async () => {
  try {
    await msgBox("关闭后登录不再校验动态验证码，确认关闭两步验证？", "关闭两步验证", "确定", "取消", "warning");
  } catch {
    return;
  }
  totpUnbinding.value = true;
  await doTotpUnbind(false);
  totpUnbinding.value = false;
};

/** 绑定弹窗关闭：未确认成功的密钥回滚，避免留下形同开启的未验证密钥 */
const handleTotpDialogClosed = async () => {
  if (!totpPendingRollback.value) return;
  totpPendingRollback.value = false;
  totpUri.value = "";
  totpSecret.value = "";
  totpCode.value = "";
  await doTotpUnbind(true);
};

const copyTotpText = async (text: string) => {
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
    msgSuccess("已复制");
  } catch {
    msgError("复制失败，请手动选择文本复制");
  }
};
/** 账号安全（TOTP 两步验证）End */

/** 锁屏设置 Begin */
const lockHasPassword = ref(false);
const lockSetting = ref(false);
const lockResetting = ref(false);
const lockClearing = ref(false);
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

async function handleClearLockPwd(): Promise<void> {
  try {
    await msgBox("确定要取消锁屏吗？取消后锁屏保护将关闭。", "取消锁屏", "确定", "取消", "warning");
  } catch { return; }
  lockClearing.value = true;
  localStorage.removeItem(LOCK_KEY);
  lockHasPassword.value = false;
  msgSuccess("已取消锁屏");
  lockClearing.value = false;
  window.dispatchEvent(new CustomEvent("lock:password", { detail: { action: "reset" } }));
}

function handleLockNow(): void {
  window.dispatchEvent(new CustomEvent("lock:screen"));
}
/** 锁屏设置 End */

onMounted(async () => {
  // 主动拉取 /v2/user me，刷新 storage 中的头像 / 手机 / 邮箱 / 角色等信息
  await authStore.getLoginUserInfo();
  refreshMine();
  initLockState();
  loadTotpStatus();
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

.mine-avatar-frame-box {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.mine-avatar-frame-layer {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  z-index: 1;
  background-size: 100% 100%;
  background-repeat: no-repeat;
  background-position: center;
  pointer-events: none;
}

.lock-panel {
  max-width: 480px;
  margin: 0 auto;
  padding: 8px 0 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.lock-panel__header {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 24px;
}

.lock-panel__icon {
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 16px;
  color: var(--el-color-primary);
  background: linear-gradient(135deg, rgba(64, 158, 255, 0.14), rgba(64, 158, 255, 0.04));
  box-shadow: 0 6px 16px rgba(64, 158, 255, 0.15);
  margin-bottom: 14px;
}

.lock-panel__title {
  font-size: 18px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.lock-panel__desc {
  margin-top: 6px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.lock-status {
  width: 100%;
  border-radius: 12px;
  padding: 22px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  transition: all 0.2s;
}

.lock-status--enabled {
  background: linear-gradient(135deg, rgba(103, 194, 58, 0.1), rgba(103, 194, 58, 0.03));
  border: 1px solid rgba(103, 194, 58, 0.3);
}

.lock-status--disabled {
  background: var(--el-fill-color-light);
  border: 1px dashed var(--el-border-color);
}

.lock-status__badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 4px 14px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 500;
  background: var(--el-bg-color);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.lock-status--enabled .lock-status__badge {
  color: var(--el-color-success);
}

.lock-status--disabled .lock-status__badge {
  color: var(--el-text-color-secondary);
}

.lock-status__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: currentColor;
}

.lock-status--enabled .lock-status__dot {
  box-shadow: 0 0 0 3px rgba(103, 194, 58, 0.18);
}

.lock-status__text {
  margin-top: 12px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

/* 账号安全面板复用锁屏面板的视觉规范 */
.secure-panel {
  @extend .lock-panel;
  max-width: 560px;
}

.secure-panel__header {
  @extend .lock-panel__header;
}

.secure-panel__icon {
  @extend .lock-panel__icon;
}

.secure-panel__title {
  @extend .lock-panel__title;
}

.secure-panel__desc {
  @extend .lock-panel__desc;
  text-align: center;
  max-width: 420px;
}

.secure-status {
  @extend .lock-status;
}

.secure-status--enabled {
  @extend .lock-status--enabled;
}

.secure-status--disabled {
  @extend .lock-status--disabled;
}

.secure-status__badge {
  @extend .lock-status__badge;
}

.secure-status__dot {
  @extend .lock-status__dot;
}

.secure-status__text {
  @extend .lock-status__text;
}

.secure-actions {
  @extend .lock-actions;
}

.totp-bind__tip {
  font-size: 13px;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
  margin-bottom: 14px;
}

.totp-bind__row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.totp-bind__label {
  flex: none;
  width: 64px;
  font-size: 13px;
  color: var(--el-text-color-regular);
}

.totp-bind__value {
  flex: 1;
  min-width: 0;
  font-size: 13px;
  word-break: break-all;
  color: var(--el-text-color-primary);
}

.totp-bind__value--uri {
  color: var(--el-text-color-secondary);
}

.lock-actions {
  display: flex;
  gap: 12px;
  margin-top: 20px;
}

.lock-form {
  width: 100%;
  max-width: 360px;
  margin-top: 20px;
}

.lock-form__item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 14px;
}

.lock-form__label {
  font-size: 13px;
  color: var(--el-text-color-regular);
}

.lock-form__submit {
  width: 100%;
  margin-top: 4px;
}
</style>
