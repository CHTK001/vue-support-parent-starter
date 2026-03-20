<template>
  <div class="profile-info-container">
    <ScRow :gutter="20">
      <!-- 左侧：个人信息卡片 -->
      <ScCol :span="8">
        <ScCard class="profile-card hover-lift" shadow="never">
          <div class="profile-header">
            <div class="avatar-section">
              <div class="avatar-wrapper" @click="showAvatarDialog = true">
                <img
                  v-if="userInfo.avatar"
                  :src="userInfo.avatar"
                  alt="头像"
                  class="avatar-image"
                />
                <div v-else class="avatar-placeholder">
                  <IconifyIconOnline icon="ri:user-line" :size="48" />
                </div>
                <div class="avatar-overlay">
                  <IconifyIconOnline icon="ri:camera-line" :size="24" />
                  <span>更换头像</span>
                </div>
              </div>

              <div class="user-basic-info">
                <h3 class="user-name">
                  {{ userInfo.nickname || userInfo.username }}
                </h3>
                <p class="user-role">{{ userInfo.roleName || "普通用户" }}</p>
              </div>
            </div>

            <div class="user-stats">
              <div class="stat-item">
                <div class="stat-value">{{ userInfo.loginCount || 0 }}</div>
                <div class="stat-label">登录次数</div>
              </div>
              <div class="stat-item">
                <div class="stat-value">{{ userInfo.daysActive || 0 }}</div>
                <div class="stat-label">活跃天数</div>
              </div>
              <div class="stat-item">
                <div class="stat-value">{{ userInfo.taskCount || 0 }}</div>
                <div class="stat-label">完成任务</div>
              </div>
            </div>
          </div>

          <div class="profile-details">
            <div class="detail-item">
              <IconifyIconOnline icon="ri:user-line" class="detail-icon" />
              <span class="detail-label">用户名：</span>
              <span class="detail-value">{{ userInfo.username }}</span>
            </div>

            <div class="detail-item">
              <IconifyIconOnline icon="ri:mail-line" class="detail-icon" />
              <span class="detail-label">邮箱：</span>
              <span class="detail-value">{{ userInfo.email || "未设置" }}</span>
            </div>

            <div class="detail-item">
              <IconifyIconOnline icon="ri:phone-line" class="detail-icon" />
              <span class="detail-label">手机：</span>
              <span class="detail-value">{{ userInfo.phone || "未设置" }}</span>
            </div>

            <div class="detail-item">
              <IconifyIconOnline icon="ri:calendar-line" class="detail-icon" />
              <span class="detail-label">注册时间：</span>
              <span class="detail-value">{{ userInfo.createTime }}</span>
            </div>

            <div class="detail-item">
              <IconifyIconOnline icon="ri:time-line" class="detail-icon" />
              <span class="detail-label">最后登录：</span>
              <span class="detail-value">{{ userInfo.lastLoginTime }}</span>
            </div>
          </div>

          <div class="profile-actions">
            <ScButton type="primary" @click="showEditDialog = true">
              <IconifyIconOnline icon="ri:edit-line" />
              编辑资料
            </ScButton>
            <ScButton @click="showPasswordDialog = true">
              <IconifyIconOnline icon="ri:lock-line" />
              修改密码
            </ScButton>
          </div>
        </ScCard>
      </ScCol>

      <!-- 右侧：详细信息表单 -->
      <ScCol :span="16">
        <ScCard class="info-card" shadow="never">
          <template #header>
            <div class="card-header">
              <span class="card-title">详细信息</span>
            </div>
          </template>

          <ScForm
            ref="formRef"
            :model="formData"
            :rules="formRules"
            label-width="100px"
            class="enhanced-form"
          >
            <ScRow :gutter="20">
              <ScCol :span="12">
                <ScFormItem label="昵称" prop="nickname">
                  <ScInput
                    v-model="formData.nickname"
                    placeholder="请输入昵称"
                    clearable
                  />
                </ScFormItem>
              </ScCol>

              <ScCol :span="12">
                <ScFormItem label="性别" prop="gender">
                  <ScRadio v-model="formData.gender">
                    <ScRadioButton :label="1">男</ScRadioButton>
                    <ScRadioButton :label="2">女</ScRadioButton>
                    <ScRadioButton :label="0">保密</ScRadioButton>
                  </ScRadio>
                </ScFormItem>
              </ScCol>

              <ScCol :span="12">
                <ScFormItem label="邮箱" prop="email">
                  <ScInput
                    v-model="formData.email"
                    placeholder="请输入邮箱"
                    clearable
                  />
                </ScFormItem>
              </ScCol>

              <ScCol :span="12">
                <ScFormItem label="手机号" prop="phone">
                  <ScInput
                    v-model="formData.phone"
                    placeholder="请输入手机号"
                    clearable
                  />
                </ScFormItem>
              </ScCol>

              <ScCol :span="12">
                <ScFormItem label="生日" prop="birthday">
                  <ScDatePicker
                    v-model="formData.birthday"
                    type="date"
                    placeholder="选择日期"
                    style="width: 100%"
                  />
                </ScFormItem>
              </ScCol>

              <ScCol :span="12">
                <ScFormItem label="部门" prop="department">
                  <ScInput
                    v-model="formData.department"
                    placeholder="请输入部门"
                    clearable
                  />
                </ScFormItem>
              </ScCol>

              <ScCol :span="12">
                <ScFormItem label="职位" prop="position">
                  <ScInput
                    v-model="formData.position"
                    placeholder="请输入职位"
                    clearable
                  />
                </ScFormItem>
              </ScCol>

              <ScCol :span="12">
                <ScFormItem label="工号" prop="employeeId">
                  <ScInput
                    v-model="formData.employeeId"
                    placeholder="请输入工号"
                    clearable
                  />
                </ScFormItem>
              </ScCol>

              <ScCol :span="24">
                <ScFormItem label="个人简介" prop="bio">
                  <ScInput
                    v-model="formData.bio"
                    type="textarea"
                    :rows="4"
                    placeholder="请输入个人简介"
                    maxlength="200"
                    show-word-limit
                  />
                </ScFormItem>
              </ScCol>
            </ScRow>

            <ScFormItem>
              <ScButton
                type="primary"
                :loading="saveLoading"
                @click="handleSave"
              >
                保存修改
              </ScButton>
              <ScButton @click="handleReset">重置</ScButton>
            </ScFormItem>
          </ScForm>
        </ScCard>
      </ScCol>
    </ScRow>

    <!-- 头像裁剪对话框 -->
    <ScDialog v-model="showAvatarDialog" title="更换头像" width="800px">
      <div class="avatar-upload-section">
        <ScUpload
          :auto-upload="false"
          :show-file-list="false"
          accept="image/*"
          @change="handleAvatarChange"
        >
          <ScButton type="primary">
            <IconifyIconOnline icon="ri:upload-line" />
            选择图片
          </ScButton>
        </ScUpload>

        <div v-if="avatarFile" class="cropper-container">
          <ReCropper
            ref="cropperRef"
            :src="avatarPreview"
            :aspect-ratio="1"
            :view-mode="1"
            :auto-crop-area="0.8"
          />
        </div>
      </div>

      <template #footer>
        <ScButton @click="showAvatarDialog = false">取消</ScButton>
        <ScButton
          type="primary"
          :loading="uploadLoading"
          :disabled="!avatarFile"
          @click="handleAvatarUpload"
        >
          确定上传
        </ScButton>
      </template>
    </ScDialog>

    <!-- 修改密码对话框 -->
    <ScDialog v-model="showPasswordDialog" title="修改密码" width="500px">
      <ScForm
        ref="passwordFormRef"
        :model="passwordForm"
        :rules="passwordRules"
        label-width="100px"
      >
        <ScFormItem label="原密码" prop="oldPassword">
          <ScInput
            v-model="passwordForm.oldPassword"
            type="password"
            placeholder="请输入原密码"
            show-password
          />
        </ScFormItem>

        <ScFormItem label="新密码" prop="newPassword">
          <ScInput
            v-model="passwordForm.newPassword"
            type="password"
            placeholder="请输入新密码"
            show-password
          />
          <ScPasswordStrength :password="passwordForm.newPassword" />
        </ScFormItem>

        <ScFormItem label="确认密码" prop="confirmPassword">
          <ScInput
            v-model="passwordForm.confirmPassword"
            type="password"
            placeholder="请再次输入新密码"
            show-password
          />
        </ScFormItem>
      </ScForm>

      <template #footer>
        <ScButton @click="showPasswordDialog = false">取消</ScButton>
        <ScButton
          type="primary"
          :loading="passwordLoading"
          @click="handlePasswordChange"
        >
          确定修改
        </ScButton>
      </template>
    </ScDialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import {
  ScCard,
  ScRow,
  ScCol,
  ScForm,
  ScFormItem,
  ScInput,
  ScRadio,
  ScRadioButton,
  ScDatePicker,
  ScButton,
  ScDialog,
  ScUpload,
  ScPasswordStrength,
} from "@repo/components";
import { ReCropper } from "@repo/components";
import { IconifyIconOnline } from "@repo/components";
import { ScMessage } from "@repo/utils";
import type { FormInstance, FormRules } from "@repo/utils";

// 用户信息
const userInfo = reactive({
  id: "",
  username: "",
  nickname: "",
  avatar: "",
  email: "",
  phone: "",
  gender: 0,
  birthday: "",
  department: "",
  position: "",
  employeeId: "",
  bio: "",
  roleName: "",
  createTime: "",
  lastLoginTime: "",
  loginCount: 0,
  daysActive: 0,
  taskCount: 0,
});

// 表单数据
const formData = reactive({
  nickname: "",
  gender: 0,
  email: "",
  phone: "",
  birthday: "",
  department: "",
  position: "",
  employeeId: "",
  bio: "",
});

// 表单引用
const formRef = ref<FormInstance>();
const passwordFormRef = ref<FormInstance>();
const cropperRef = ref();

// 状态
const saveLoading = ref(false);
const uploadLoading = ref(false);
const passwordLoading = ref(false);
const showAvatarDialog = ref(false);
const showPasswordDialog = ref(false);
const showEditDialog = ref(false);

// 头像相关
const avatarFile = ref<File | null>(null);
const avatarPreview = ref("");

// 密码表单
const passwordForm = reactive({
  oldPassword: "",
  newPassword: "",
  confirmPassword: "",
});

// 表单验证规则
const formRules: FormRules = {
  nickname: [{ required: true, message: "请输入昵称", trigger: "blur" }],
  email: [{ type: "email", message: "请输入正确的邮箱地址", trigger: "blur" }],
  phone: [
    {
      pattern: /^1[3-9]\d{9}$/,
      message: "请输入正确的手机号",
      trigger: "blur",
    },
  ],
};

// 密码验证规则
const passwordRules: FormRules = {
  oldPassword: [{ required: true, message: "请输入原密码", trigger: "blur" }],
  newPassword: [
    { required: true, message: "请输入新密码", trigger: "blur" },
    { min: 6, max: 20, message: "密码长度为 6-20 位", trigger: "blur" },
  ],
  confirmPassword: [
    { required: true, message: "请再次输入新密码", trigger: "blur" },
    {
      validator: (rule, value, callback) => {
        if (value !== passwordForm.newPassword) {
          callback(new Error("两次输入的密码不一致"));
        } else {
          callback();
        }
      },
      trigger: "blur",
    },
  ],
};

// 加载用户信息
const loadUserInfo = async () => {
  try {
    // TODO: 调用后端接口获取用户信息
    // 模拟数据
    Object.assign(userInfo, {
      id: "1",
      username: "admin",
      nickname: "管理员",
      avatar: "",
      email: "admin@example.com",
      phone: "13800138000",
      gender: 1,
      birthday: "1990-01-01",
      department: "技术部",
      position: "系统管理员",
      employeeId: "E001",
      bio: "这是一段个人简介...",
      roleName: "超级管理员",
      createTime: "2024-01-01 10:00:00",
      lastLoginTime: "2026-03-18 09:30:00",
      loginCount: 156,
      daysActive: 89,
      taskCount: 234,
    });

    // 同步到表单
    Object.assign(formData, {
      nickname: userInfo.nickname,
      gender: userInfo.gender,
      email: userInfo.email,
      phone: userInfo.phone,
      birthday: userInfo.birthday,
      department: userInfo.department,
      position: userInfo.position,
      employeeId: userInfo.employeeId,
      bio: userInfo.bio,
    });
  } catch (error) {
    console.error("加载用户信息失败:", error);
    ScMessage.error("加载用户信息失败");
  }
};

// 保存修改
const handleSave = async () => {
  const valid = await formRef.value?.validate();
  if (!valid) return;

  saveLoading.value = true;
  try {
    // TODO: 调用后端接口保存用户信息
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // 更新用户信息
    Object.assign(userInfo, formData);

    ScMessage.success("保存成功");
  } catch (error) {
    console.error("保存失败:", error);
    ScMessage.error("保存失败");
  } finally {
    saveLoading.value = false;
  }
};

// 重置表单
const handleReset = () => {
  Object.assign(formData, {
    nickname: userInfo.nickname,
    gender: userInfo.gender,
    email: userInfo.email,
    phone: userInfo.phone,
    birthday: userInfo.birthday,
    department: userInfo.department,
    position: userInfo.position,
    employeeId: userInfo.employeeId,
    bio: userInfo.bio,
  });
  formRef.value?.clearValidate();
};

// 头像文件变化
const handleAvatarChange = (file: any) => {
  avatarFile.value = file.raw;
  avatarPreview.value = URL.createObjectURL(file.raw);
};

// 上传头像
const handleAvatarUpload = async () => {
  if (!avatarFile.value) return;

  uploadLoading.value = true;
  try {
    // 获取裁剪后的图片
    const croppedCanvas = cropperRef.value?.getCroppedCanvas();
    if (!croppedCanvas) {
      ScMessage.error("请先裁剪图片");
      return;
    }

    // 转换为 Blob
    const blob = await new Promise<Blob>((resolve) => {
      croppedCanvas.toBlob((blob: Blob) => resolve(blob));
    });

    // TODO: 调用后端接口上传头像
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // 更新头像
    userInfo.avatar = URL.createObjectURL(blob);

    ScMessage.success("头像上传成功");
    showAvatarDialog.value = false;
    avatarFile.value = null;
    avatarPreview.value = "";
  } catch (error) {
    console.error("上传头像失败:", error);
    ScMessage.error("上传头像失败");
  } finally {
    uploadLoading.value = false;
  }
};

// 修改密码
const handlePasswordChange = async () => {
  const valid = await passwordFormRef.value?.validate();
  if (!valid) return;

  passwordLoading.value = true;
  try {
    // TODO: 调用后端接口修改密码
    await new Promise((resolve) => setTimeout(resolve, 1000));

    ScMessage.success("密码修改成功，请重新登录");
    showPasswordDialog.value = false;

    // 重置密码表单
    Object.assign(passwordForm, {
      oldPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    passwordFormRef.value?.resetFields();

    // TODO: 跳转到登录页
  } catch (error) {
    console.error("修改密码失败:", error);
    ScMessage.error("修改密码失败");
  } finally {
    passwordLoading.value = false;
  }
};

// 生命周期
onMounted(() => {
  loadUserInfo();
});
</script>

<style scoped lang="scss">
.profile-info-container {
  padding: 20px;

  .profile-card {
    .profile-header {
      text-align: center;
      padding-bottom: 20px;
      border-bottom: 1px solid var(--el-border-color-lighter);

      .avatar-section {
        margin-bottom: 20px;

        .avatar-wrapper {
          position: relative;
          width: 120px;
          height: 120px;
          margin: 0 auto 16px;
          cursor: pointer;
          border-radius: 50%;
          overflow: hidden;

          .avatar-image {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }

          .avatar-placeholder {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #fff;
          }

          .avatar-overlay {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 4px;
            background: rgba(0, 0, 0, 0.6);
            color: #fff;
            font-size: 12px;
            opacity: 0;
            transition: opacity 0.3s ease;
          }

          &:hover .avatar-overlay {
            opacity: 1;
          }
        }

        .user-basic-info {
          .user-name {
            margin: 0 0 8px;
            font-size: 20px;
            font-weight: 600;
            color: var(--el-text-color-primary);
          }

          .user-role {
            margin: 0;
            font-size: 14px;
            color: var(--el-text-color-secondary);
          }
        }
      }

      .user-stats {
        display: flex;
        justify-content: space-around;
        margin-top: 20px;

        .stat-item {
          text-align: center;

          .stat-value {
            font-size: 24px;
            font-weight: 700;
            color: var(--el-color-primary);
            margin-bottom: 4px;
          }

          .stat-label {
            font-size: 12px;
            color: var(--el-text-color-secondary);
          }
        }
      }
    }

    .profile-details {
      padding: 20px 0;

      .detail-item {
        display: flex;
        align-items: center;
        padding: 12px 0;
        border-bottom: 1px solid var(--el-border-color-lighter);

        &:last-child {
          border-bottom: none;
        }

        .detail-icon {
          flex-shrink: 0;
          margin-right: 12px;
          color: var(--el-color-primary);
        }

        .detail-label {
          flex-shrink: 0;
          width: 80px;
          font-size: 14px;
          color: var(--el-text-color-secondary);
        }

        .detail-value {
          flex: 1;
          font-size: 14px;
          color: var(--el-text-color-primary);
        }
      }
    }

    .profile-actions {
      display: flex;
      gap: 12px;
      padding-top: 20px;
      border-top: 1px solid var(--el-border-color-lighter);

      :deep(.el-button) {
        flex: 1;
      }
    }
  }

  .info-card {
    .card-header {
      .card-title {
        font-size: 16px;
        font-weight: 600;
        color: var(--el-text-color-primary);
      }
    }
  }

  .avatar-upload-section {
    .cropper-container {
      margin-top: 20px;
      height: 400px;
    }
  }
}

// 响应式适配
@media (max-width: 1200px) {
  .profile-info-container {
    :deep(.el-col) {
      margin-bottom: 20px;
    }
  }
}
</style>
