<script setup lang="ts">
/**
 * 个人中心页面
 *
 * 查看/修改个人资料、头像、密码。
 * 数据源：/v2/user/me（只读展示），/v2/user/updateOwner（改密码）。
 */
import { computed, onMounted, reactive, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { User, Key, Edit } from "@element-plus/icons-vue";
import { updateOwner } from "../api/systemApi";
import useUserStore from "@repo/pinia/modules/user";
import { getUserInfo } from "@repo/utils";

const userStore = useUserStore();

const avatarUrl = ref("");
const username = ref("");
const nickname = ref("");
const email = ref("");
const phone = ref("");
const lastLoginTime = ref("");
const lastLoginIp = ref("");
const lastLoginAddress = ref("");

const pwdDialogVisible = ref(false);
const pwdSaving = ref(false);
const pwdForm = reactive({
  oldPassword: "",
  newPassword: "",
  confirmPassword: "",
});

const loading = ref(true);

function canSavePassword(): boolean {
  const f = pwdForm;
  if (!f.oldPassword || !f.newPassword || !f.confirmPassword) return false;
  if (f.newPassword !== f.confirmPassword) return false;
  if (f.newPassword.length < 6) return false;
  return true;
}

function hasPasswordRule(p: string): boolean {
  if (p.length < 6 || p.length > 20) return false;
  const hasLetter = /[a-zA-Z]/.test(p);
  const hasDigit = /\d/.test(p);
  return hasLetter && hasDigit;
}

function handleSavePassword() {
  if (!canSavePassword()) {
    ElMessage.warning("请填写完整密码且两次输入一致");
    return;
  }
  if (!hasPasswordRule(pwdForm.newPassword)) {
    ElMessage.warning("密码须包含字母和数字，长度 6-20");
    return;
  }
  pwdSaving.value = true;
  updateOwner(pwdForm)
    .then(() => {
      ElMessage.success("密码修改成功");
      pwdDialogVisible.value = false;
      pwdForm.oldPassword = "";
      pwdForm.newPassword = "";
      pwdForm.confirmPassword = "";
    })
    .catch((e) => {
      ElMessage.error((e as Error)?.message ?? "修改失败");
    })
    .finally(() => {
      pwdSaving.value = false;
    });
}

function handleAvatarClick() {
  ElMessage.info("头像上传暂未实现");
}

async function loadMe() {
  loading.value = true;
  try {
    const info = getUserInfo() as {
      sysUserId?: number;
      username?: string;
      sysUserUsername?: string;
      sysUserNickname?: string;
      nickname?: string;
      sysUserAvatar?: string;
      avatar?: string;
      sysUserEmail?: string;
      email?: string;
      sysUserPhone?: string;
      phone?: string;
      sysUserLastTime?: string;
      sysUserLastIp?: string;
      sysUserLastAddress?: string;
    } | null;
    if (info) {
      username.value = info.sysUserUsername ?? info.username ?? userStore.username ?? "";
      nickname.value = info.sysUserNickname ?? info.nickname ?? "";
      email.value = info.sysUserEmail ?? info.email ?? "";
      phone.value = info.sysUserPhone ?? info.phone ?? "";
      avatarUrl.value = info.sysUserAvatar ?? info.avatar ?? "";
      lastLoginTime.value = info.sysUserLastTime ?? "";
      lastLoginIp.value = info.sysUserLastIp ?? "";
      lastLoginAddress.value = info.sysUserLastAddress ?? "";
    }
  } catch {
    /* ignore */
  } finally {
    loading.value = false;
  }
}

onMounted(loadMe);
</script>

<template>
  <div class="flex h-full flex-col gap-4 p-6">
    <div class="mb-4 flex items-center justify-between">
      <div>
        <h2 class="text-xl font-semibold text-[--el-text-color-primary]">个人中心</h2>
        <p class="mt-1 text-sm text-[--el-text-color-secondary]">管理您的个人信息与密码</p>
      </div>
      <el-button type="primary" plain :icon="Key" @click="pwdDialogVisible = true">修改密码</el-button>
    </div>

    <el-card v-loading="loading" shadow="never" class="rounded-xl border border-solid border-[--el-border-color-lighter]">
      <div class="grid gap-4 md:grid-cols-2">
        <div class="flex items-center gap-4">
          <el-avatar :size="88" :src="avatarUrl" class="cursor-pointer" @click="handleAvatarClick">
            <el-icon :size="32"><User /></el-icon>
          </el-avatar>
          <div>
            <div class="text-base font-semibold">{{ username || "未登录" }}</div>
            <div class="mt-1 text-xs text-[--el-text-color-secondary]">点击头像更换</div>
          </div>
        </div>
        <div class="grid grid-cols-1 gap-2 text-sm">
          <div class="flex items-center gap-2">
            <span class="text-[--el-text-color-secondary] w-20 shrink-0">登录名称</span>
            <span>{{ username || "—" }}</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-[--el-text-color-secondary] w-20 shrink-0">昵称</span>
            <span>{{ nickname || "—" }}</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-[--el-text-color-secondary] w-20 shrink-0">邮箱</span>
            <span>{{ email || "—" }}</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-[--el-text-color-secondary] w-20 shrink-0">手机</span>
            <span>{{ phone || "—" }}</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-[--el-text-color-secondary] w-20 shrink-0">上次登录</span>
            <span>{{ lastLoginTime || "—" }}</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-[--el-text-color-secondary] w-20 shrink-0">上次 IP</span>
            <span>{{ lastLoginIp || "—" }}</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-[--el-text-color-secondary] w-20 shrink-0">上次地址</span>
            <span>{{ lastLoginAddress || "—" }}</span>
          </div>
        </div>
      </div>
    </el-card>

    <el-dialog
      v-model="pwdDialogVisible"
      title="修改密码"
      width="460"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <el-form label-width="90px" :model="pwdForm">
        <el-form-item label="当前密码" required>
          <el-input
            v-model="pwdForm.oldPassword"
            type="password"
            show-password
            placeholder="当前密码"
          />
        </el-form-item>
        <el-form-item label="新密码" required>
          <el-input
            v-model="pwdForm.newPassword"
            type="password"
            show-password
            placeholder="新密码（6-20 位，含字母和数字）"
          />
        </el-form-item>
        <el-form-item label="确认新密码" required>
          <el-input
            v-model="pwdForm.confirmPassword"
            type="password"
            show-password
            placeholder="再次输入新密码"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="pwdDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="pwdSaving" @click="handleSavePassword">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>