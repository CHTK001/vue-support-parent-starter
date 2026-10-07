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
                <span v-else class="koi-avatar-default-frame" :style="defaultFrame(104)"></span>
                <ReAvatarCrop
                  v-model="mineAvatar"
                  :action="avatarUploadUrl"
                  :headers="avatarHeaders"
                  :data="avatarData"
                  :response-url-path="'data.url'"
                  :trigger-text="'更换头像'"
                  :dialog-title="'裁剪头像'"
                  :disabled="!mineUpdateSupported"
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
              <div class="flex flex-items-center flex-wrap gap-6px">
                <span v-text="mine.email || '-'"></span>
                <el-tooltip v-if="mine.emailVerified === 1" :content="`验证于 ${mine.emailVerifyTime || '-'}`" placement="top">
                  <el-tag type="success" effect="plain">已验证</el-tag>
                </el-tooltip>
                <el-button
                  v-else-if="emailVerifyEnabled && mine.email"
                  link
                  type="primary"
                  @click="openEmailVerifyDialog"
                >
                  验证
                </el-button>
              </div>
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
                      <div class="w-full">
                        <el-input v-model="mineForm.sysUserEmail" placeholder="请输入邮箱（选填）" clearable />
                        <div v-if="emailPendingTip" class="text-12px leading-18px text-[--el-text-color-secondary]">
                          {{ emailPendingTip }}
                        </div>
                      </div>
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
                      <el-button
                        type="primary"
                        plain
                        :loading="mineSaving"
                        :disabled="!mineUpdateSupported"
                        @click="handleMineSave"
                      >
                        保存
                      </el-button>
                      <el-button type="danger" plain @click="resetMineForm">重置</el-button>
                      <span v-if="!mineUpdateSupported" class="text-12px text-#909399 ml-8px">
                        当前部署未开放资料编辑
                      </span>
                    </el-form-item>
                  </el-col>
                </el-row>
              </el-form>

              <el-dialog v-model="emailDialogVisible" title="邮箱验证" width="440px" @closed="resetEmailVerify">
                <div class="flex flex-column gap-10px">
                  <div class="text-13px text-[--el-text-color-regular]">
                    验证码将发送至
                    <b>{{ maskedEmailTarget || mine.email }}</b>
                    ，请在有效期内填回本页。
                  </div>
                  <div class="flex flex-items-center gap-8px">
                    <el-input
                      v-model="emailCode"
                      class="flex-1"
                      placeholder="请输入验证码"
                      maxlength="8"
                      clearable
                      @keyup.enter="handleEmailVerifyConfirm"
                    />
                    <el-button type="primary" plain :loading="emailSending" :disabled="emailCountdown > 0" @click="handleSendEmailCode">
                      {{ emailCountdown > 0 ? `${emailCountdown}s` : emailSent ? "重新发送" : "获取验证码" }}
                    </el-button>
                  </div>
                  <div v-if="emailSent" class="text-12px text-[--el-text-color-secondary]">
                    {{ emailExpireCountdown > 0 ? `有效期剩余 ${formatCountdown(emailExpireCountdown)}` : "验证码已过期，请重新获取" }}
                  </div>
                </div>
                <template #footer>
                  <el-button @click="emailDialogVisible = false">取消</el-button>
                  <el-button type="primary" :loading="emailVerifying" :disabled="!emailCode" @click="handleEmailVerifyConfirm">
                    确认验证
                  </el-button>
                </template>
              </el-dialog>
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
            <el-tab-pane v-if="totpSupported" name="secure">
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
                  <el-radio-group v-model="totpBindMode" class="totp-bind__mode">
                    <el-radio-button value="scan">扫码添加</el-radio-button>
                    <el-radio-button value="manual">手动输入密钥</el-radio-button>
                  </el-radio-group>

                  <template v-if="totpBindMode === 'scan'">
                    <div class="totp-bind__tip">
                      用验证器 App（Google Authenticator / Microsoft Authenticator 等）的「扫码添加」功能扫描下面的二维码，再输入 App 生成的 6
                      位动态码完成绑定。
                    </div>
                    <div class="totp-bind__qr">
                      <img v-if="totpQrcode" :src="totpQrcode" alt="两步验证二维码" />
                      <span v-else class="totp-bind__qr-placeholder">二维码生成中…</span>
                    </div>
                  </template>

                  <template v-else>
                    <div class="totp-bind__tip">
                      无法扫码时，请在验证器 App 中选择「手动输入密钥」，填入下面的密钥，再输入 App 生成的 6 位动态码完成绑定。
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
                  </template>

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
                  <el-icon :size="15"><Collection /></el-icon>
                  <span>第三方绑定</span>
                </span>
              </template>
              <ThirdBindPanel />
            </el-tab-pane>

            <el-tab-pane v-if="loginLogSupported" name="logs">
              <template #label>
                <span class="flex items-center gap-4px">
                  <el-icon :size="15"><Document /></el-icon>
                  <span>登录日志</span>
                </span>
              </template>
              <div class="login-log">
                <div class="login-log__header">
                  <div class="login-log__title">近期登录记录</div>
                  <div class="login-log__desc">仅展示当前账号的登录记录，发现异常登录请立即修改密码</div>
                  <el-button class="login-log__refresh" :loading="loginLogLoading" @click="loadLoginLogs">
                    刷新
                  </el-button>
                </div>
                <el-table
                  v-loading="loginLogLoading"
                  :data="loginLogRows"

                  :row-class-name="loginLogRowClass"
                  class="login-log__table"
                >
                  <el-table-column prop="createTime" label="登录时间" width="165" />
                  <el-table-column label="IP / 归属地" min-width="200">
                    <template #default="{ row }">
                      <ReIpText :ip="row.sysLogIp || ''" :address="row.sysLogAddress || ''" :third-party-fix="true">
                        <template #address="{ address }">
                          <span>{{ [address, row.sysLogIsp].filter(Boolean).join(" · ") }}</span>
                        </template>
                      </ReIpText>
                    </template>
                  </el-table-column>
                  <el-table-column label="浏览器 / 系统" min-width="170">
                    <template #default="{ row }">
                      <div class="login-log__stack">
                        <span>{{ row.sysLogBrowser || "--" }}</span>
                        <span>{{ row.sysLogSystem || "--" }}</span>
                      </div>
                    </template>
                  </el-table-column>
                  <el-table-column prop="sysLogLoginType" label="方式" width="90" />
                  <el-table-column label="状态" width="80">
                    <template #default="{ row }">
                      <el-tooltip v-if="row.sysLogStatus === 0 && row.sysLogMessage" :content="row.sysLogMessage" placement="top">
                        <el-tag type="danger" effect="plain">失败</el-tag>
                      </el-tooltip>
                      <el-tag v-else :type="row.sysLogStatus === 1 ? 'success' : 'danger'" effect="plain">
                        {{ row.sysLogStatus === 1 ? "成功" : "失败" }}
                      </el-tag>
                    </template>
                  </el-table-column>
                </el-table>
                <el-pagination
                  v-if="loginLogTotal > loginLogPageSize"
                  class="login-log__pager"
                  layout="prev, pager, next, total"

                  background
                  :current-page="loginLogPage"
                  :page-size="loginLogPageSize"
                  :total="loginLogTotal"
                  @current-change="handleLoginLogPage"
                />
              </div>
            </el-tab-pane>

            <el-tab-pane name="lock">
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
import { nextTick, onMounted, onUnmounted, reactive, ref, computed, watch, defineAsyncComponent } from "vue";
import { UserFilled, User, Iphone, Message, Collection, Lock, Key, Picture, Document } from "@element-plus/icons-vue";
import { msgError, msgSuccess, msgBox } from "@repo/core";
import { getUserInfo, getAccessToken, normalizeUrl, resolveUserDisplayInfo, Http } from "@repo/utils";
import { getConfig } from "@repo/config";
import { defaultAvatarUrl } from "@repo/assets";
import { useWornAvatarFrame } from "@repo/theme/koi/components/useWornAvatarFrame";
import AvatarFramePanel from "@repo/theme/koi/components/AvatarFramePanel.vue";
import ThirdBindPanel from "./components/ThirdBindPanel.vue";
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
    if (isEndpointMissing(e)) {
      mineUpdateSupported.value = false;
      msgError("当前部署未开放头像保存，图片未应用");
    } else {
      msgError("头像保存失败：" + ((e as Error)?.message || "网络异常"));
    }
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
  emailVerified: 0,
  emailVerifyTime: "",
  roles: "",
  avatarFrame: 0,
  avatarFrameShow: 0,
  birthday: "",
});

/** el-card 标签选择 name */
const activeName = ref("first");

/** 能力开关：进入系统时由 /v2/setting/default 下发（sys_setting_code = other.xxx.enable），默认开启 */
const frameEnabled = computed(() => getConfig()?.other?.avatarFrame?.enable ?? true);
const personalConfigEnabled = computed(() => getConfig()?.other?.personalConfig?.enable ?? true);

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
  defaultStyle: defaultFrame,
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
      loginName: data.sysUserUsername || data.username || "",
      nickname: data.sysUserNickname || data.nickname || "",
      phone: data.sysUserPhone || "",
      email: data.sysUserEmail || "",
      emailVerified: data.sysUserEmailVerified ?? 0,
      emailVerifyTime: data.sysUserEmailVerifyTime || "",
      roles: data.roles?.join("、") || authStore.roleList?.join("、") || "",
      avatarFrame: data.sysUserAvatarFrame ?? 0,
      avatarFrameShow: data.sysUserAvatarFrameShow ?? 0,
      birthday: data.sysUserBirthday || "",
    };
    mineForm.value = {
      sysUserId: data.sysUserId ?? data.userId ?? "",
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

/** 部署能力：资料编辑端点（PUT /v2/user/update）是否由当前后端提供（未部署时置灰保存/头像持久化） */
const mineUpdateSupported = ref(true);

/** 判断异常是否为「端点未部署（404）」 */
function isEndpointMissing(e: unknown): boolean {
  const err = e as { response?: { status?: number }; status?: number } | null;
  return err?.response?.status === 404 || err?.status === 404;
}

/**
 * 探测资料编辑端点是否部署：GET 命中 PUT 映射返回 405（已部署）、未映射返回 404（未部署）。
 * 探测本身不改数据；网络/鉴权类异常保持可用，等真实保存时再按 404 收敛。
 */
async function probeMineUpdate(): Promise<void> {
  try {
    const { getApiHttp } = await import("@repo/core");
    await getApiHttp().get("/v2/user/update").then((r) => r.status);
    mineUpdateSupported.value = true;
  } catch (e) {
    const status = (e as { response?: { status?: number } })?.response?.status;
    if (status === 404) mineUpdateSupported.value = false;
    else if (status === 405) mineUpdateSupported.value = true;
  }
}

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
      if (isEndpointMissing(e)) {
        mineUpdateSupported.value = false;
        msgError("当前部署未开放个人资料编辑");
      } else {
        msgError("保存失败：" + ((e as Error)?.message || "网络异常"));
      }
    } finally {
      mineSaving.value = false;
    }
  });
};
/** 基本资料 End */

/** 邮箱验证 Begin */
/** 服务器邮箱通道能力开关：由 /v2/setting/default 下发（sys_setting_code = other.emailVerify.enable），未配置则不渲染验证入口 */
const emailVerifyEnabled = computed(() => getConfig()?.other?.emailVerify?.enable === true);
const emailDialogVisible = ref(false);
const emailCode = ref("");
const emailSending = ref(false);
const emailVerifying = ref(false);
const emailSent = ref(false);
const maskedEmailTarget = ref("");
const emailCountdown = ref(0);
const emailExpireCountdown = ref(0);
let emailCountdownTimer: ReturnType<typeof setInterval> | undefined;
let emailExpireTimer: ReturnType<typeof setInterval> | undefined;

/** 表单邮箱与已保存邮箱不一致时，验证入口尚不可用，提示先保存 */
const emailPendingTip = computed(() => {
  if (!emailVerifyEnabled.value) return "";
  const typed = String(mineForm.value.sysUserEmail || "").trim();
  if (!typed) return "";
  if (typed !== String(mine.value.email || "").trim()) return "邮箱已修改，保存后可重新验证";
  if (mine.value.emailVerified !== 1) return "未验证，可在左侧「用户邮箱」处点击验证";
  return "";
});

/** 剩余秒数 → mm:ss */
function formatCountdown(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m > 0 ? `${m}分${s}秒` : `${s}秒`;
}

function clearEmailTimers(): void {
  if (emailCountdownTimer) clearInterval(emailCountdownTimer);
  if (emailExpireTimer) clearInterval(emailExpireTimer);
  emailCountdownTimer = undefined;
  emailExpireTimer = undefined;
}

/** 关闭弹窗后重置一次性状态（倒计时随 @closed 清理，避免泄漏定时器） */
function resetEmailVerify(): void {
  clearEmailTimers();
  emailCode.value = "";
  emailSent.value = false;
  maskedEmailTarget.value = "";
  emailCountdown.value = 0;
  emailExpireCountdown.value = 0;
}

function openEmailVerifyDialog(): void {
  if (!mine.value.email) {
    msgError("请先在基本资料中填写邮箱并保存");
    return;
  }
  emailDialogVisible.value = true;
}

/** 发送验证码：投递地址由后端取本人档案，前端不传邮箱 */
async function handleSendEmailCode(): Promise<void> {
  if (emailCountdown.value > 0 || emailSending.value) return;
  emailSending.value = true;
  try {
    const { getApiHttp } = await import("@repo/core");
    const res = await getApiHttp()
      .post("/v2/user/verify-code/send")
      .data({ channel: "EMAIL" })
      .then<{
        msg?: string;
        success?: boolean;
        data?: { maskedTarget?: string; expireSeconds?: number; intervalSeconds?: number };
      }>((r) => r.data);
    if (Http.isSuccessful(res)) {
      emailSent.value = true;
      maskedEmailTarget.value = res.data?.maskedTarget || "";
      const interval = res.data?.intervalSeconds ?? 60;
      const expire = res.data?.expireSeconds ?? 300;
      clearEmailTimers();
      emailCountdown.value = interval;
      emailExpireCountdown.value = expire;
      emailCountdownTimer = setInterval(() => {
        emailCountdown.value = emailCountdown.value > 0 ? emailCountdown.value - 1 : 0;
        if (emailCountdown.value === 0 && emailCountdownTimer) clearInterval(emailCountdownTimer);
      }, 1000);
      emailExpireTimer = setInterval(() => {
        emailExpireCountdown.value = emailExpireCountdown.value > 0 ? emailExpireCountdown.value - 1 : 0;
        if (emailExpireCountdown.value === 0 && emailExpireTimer) clearInterval(emailExpireTimer);
      }, 1000);
      msgSuccess("验证码已发送");
    } else {
      msgError(res?.msg || "验证码发送失败");
    }
  } catch (e) {
    msgError("验证码发送失败：" + ((e as Error)?.message || "网络异常"));
  } finally {
    emailSending.value = false;
  }
}

/** 校验验证码：通过后后端已把结论写入 sys_user，重新拉取 /me 以刷新标签 */
async function handleEmailVerifyConfirm(): Promise<void> {
  if (!emailCode.value) {
    msgError("请输入验证码");
    return;
  }
  emailVerifying.value = true;
  try {
    const { getApiHttp } = await import("@repo/core");
    const res = await getApiHttp()
      .post("/v2/user/verify-code/verify")
      .data({ channel: "EMAIL", code: emailCode.value })
      .then<{ msg?: string; success?: boolean; data?: boolean }>((r) => r.data);
    if (Http.isSuccessful(res) && res.data === true) {
      msgSuccess("邮箱验证成功");
      emailDialogVisible.value = false;
      await authStore.getLoginUserInfo();
      refreshMine();
    } else {
      msgError(res?.msg || "验证码错误或已过期");
    }
  } catch (e) {
    msgError("验证失败：" + ((e as Error)?.message || "网络异常"));
  } finally {
    emailVerifying.value = false;
  }
}

onUnmounted(() => clearEmailTimers());
/** 邮箱验证 End */

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
/** 部署能力：两步验证端点（/v2/user/totp/*）是否由当前后端提供；未部署时隐藏「账号安全」页签 */
const totpSupported = ref(true);
const totpEnabled = ref(false);
const totpLoading = ref(false);
const totpUnbinding = ref(false);
const totpVerifying = ref(false);
const totpDialogVisible = ref(false);
const totpUri = ref("");
const totpSecret = ref("");
const totpCode = ref("");
/** 绑定方式：scan 扫码（默认）/ manual 手动输入密钥 */
const totpBindMode = ref<"scan" | "manual">("scan");
/** 由 otpauth 绑定链接渲染出的二维码 dataURL */
const totpQrcode = ref("");
/** 本次是否由「未开启」状态新拉取了密钥：取消时需回滚，否则会留下未验证的密钥 */
const totpPendingRollback = ref(false);

/** 动态码校验使用的账号名（verify 接口按用户名查库） */
const totpUsername = computed(() => mine.value.loginName || userStore.username || "");

/** 把绑定链接渲染成二维码；失败则退回手动方式，不留空白面板 */
const renderTotpQrcode = async (uri: string) => {
  totpQrcode.value = "";
  try {
    const { default: QRCode } = await import("qrcode");
    totpQrcode.value = await QRCode.toDataURL(uri, {
      width: 240,
      margin: 1,
      errorCorrectionLevel: "M",
      color: { dark: "#1f2329ff", light: "#ffffffff" },
    });
  } catch (e) {
    console.error("[mine] 生成两步验证二维码失败", e);
    totpBindMode.value = "manual";
  }
};

/** 读取当前账号的 2FA 绑定状态（后端返回裸 Boolean） */
const loadTotpStatus = async () => {
  try {
    const { getApiHttp } = await import("@repo/core");
    const res = await getApiHttp()
      .get("/v2/user/totp/status")
      .then((r: any) => r.data);
    totpEnabled.value = res?.data === true;
  } catch (e) {
    if (isEndpointMissing(e)) {
      // 当前部署未提供两步验证能力：隐藏「账号安全」页签，不留死按钮
      totpSupported.value = false;
      totpEnabled.value = false;
      return;
    }
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
    totpBindMode.value = "scan";
    totpPendingRollback.value = !totpEnabled.value;
    totpDialogVisible.value = true;
    await renderTotpQrcode(uri);
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
  totpQrcode.value = "";
  totpBindMode.value = "scan";
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

/** 登录日志 Begin */
/** ReIpText 的 default 已是异步组件，不能当函数调用（`m.default()` 会抛 not a function） */
const ReIpText = defineAsyncComponent(() => import("@repo/ui/re-ip-text").then((m) => m.default));

const loginLogLoading = ref(false);
const loginLogLoaded = ref(false);
/** 部署能力：登录日志端点（/v2/user/log/mine-logs）是否由当前后端提供；未部署时隐藏「登录日志」页签 */
const loginLogSupported = ref(true);
const loginLogRows = ref<Record<string, any>[]>([]);
const loginLogTotal = ref(0);
const loginLogPage = ref(1);
const loginLogPageSize = 5;

/** 拉取当前账号的登录记录（后端已按 create_by / 登录名过滤并按时间倒序） */
async function loadLoginLogs(): Promise<void> {
  loginLogLoading.value = true;
  try {
    const { getApiHttp } = await import("@repo/core");
    const res = await getApiHttp()
      .get("/v2/user/log/mine-logs")
      .query({ page: loginLogPage.value, pageSize: loginLogPageSize })
      .then((r) => r.data);
    loginLogRows.value = res?.data?.data ?? [];
    loginLogTotal.value = res?.data?.total ?? 0;
    loginLogLoaded.value = true;
  } catch (e) {
    if (isEndpointMissing(e)) {
      // 当前部署未提供登录日志能力：隐藏「登录日志」页签，不留空表误导
      loginLogSupported.value = false;
      return;
    }
    console.error("登录日志加载失败", e);
    msgError("登录日志加载失败");
  } finally {
    loginLogLoading.value = false;
  }
}

function handleLoginLogPage(page: number): void {
  loginLogPage.value = page;
  loadLoginLogs();
}

/** 登录失败行标红 */
function loginLogRowClass({ row }: { row: Record<string, any> }): string {
  return row.sysLogStatus === 0 ? "login-log__row--fail" : "";
}

watch(activeName, (name) => {
  if (name === "logs" && !loginLogLoaded.value && !loginLogLoading.value) {
    loadLoginLogs();
  }
});
/** 登录日志 End */

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
  // 部署能力探测：资料编辑端点是否存在（决定保存/头像持久化是否可用）
  void probeMineUpdate();
  // 登录日志预载：端点未部署时在用户点开前就把「登录日志」页签隐藏
  void loadLoginLogs();
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

.totp-bind__mode {
  display: flex;
  justify-content: center;
  margin-bottom: 14px;
}

.totp-bind__qr {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 256px;
  margin-bottom: 14px;
}

.totp-bind__qr img {
  width: 240px;
  height: 240px;
  display: block;
  background: #fff;
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
}

.totp-bind__qr-placeholder {
  font-size: 13px;
  color: var(--el-text-color-secondary);
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

.login-log__header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.login-log__title {
  font-size: 15px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.login-log__desc {
  flex: 1;
  min-width: 200px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.login-log__table {
  width: 100%;
}

.login-log__stack {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 12px;
  line-height: 1.4;
  color: var(--el-text-color-secondary);
}

.login-log__stack span:first-child {
  color: var(--el-text-color-regular);
}

.login-log__pager {
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
}

.login-log :deep(.login-log__row--fail) td.el-table__cell {
  color: var(--el-color-danger);
  background: var(--el-color-danger-light-9);
}
</style>
