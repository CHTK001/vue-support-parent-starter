<template>
  <div class="user-save-container">
    <sc-dialog v-model="visible" :title="title" :close-on-click-modal="false" :close-on-press-escape="false"
      :destroy-on-close="true" draggable width="800px" class="user-dialog" @close="close">
      <el-form ref="dialogFormRef" :model="form" :rules="rules" :disabled="mode == 'show'" label-width="100px"
        class="user-form">
        <el-row :gutter="20">
          <!-- 头像区域 -->
          <el-col :span="24">
            <div class="avatar-section">
              <div class="avatar-wrapper">
                <el-upload
                  class="avatar-uploader"
                  action="#"
                  :show-file-list="false"
                  :auto-upload="false"
                  :on-change="handleAvatarChange"
                  accept="image/*"
                >
                  <div class="avatar-container">
                    <el-avatar v-if="form.sysUserAvatar" :size="100" :src="form.sysUserAvatar" />
                    <div v-else class="avatar-placeholder" :class="getAvatarClass()">
                      {{ getAvatarText() }}
                    </div>
                    <div class="avatar-overlay">
                      <IconifyIconOnline icon="ri:camera-line" :size="24" />
                      <span>更换头像</span>
                    </div>
                  </div>
                </el-upload>
                <div class="avatar-info">
                  <h3>{{ form.sysUserNickname || form.sysUserUsername || '新用户' }}</h3>
                  <p>{{ form.sysUserEmail || '未设置邮箱' }}</p>
                </div>
              </div>
            </div>
          </el-col>

          <!-- 基本信息区域 -->
          <div class="form-section">
            <div class="section-title">
              <IconifyIconOnline icon="mdi:account-details" />
              <span>基本信息</span>
            </div>

            <el-col :span="12">
              <el-form-item label="账号名称" prop="sysUserUsername">
                <el-input v-model="form.sysUserUsername" placeholder="请输入账号名称" class="custom-input">
                  <template #prefix>
                    <IconifyIconOnline icon="mdi:account" />
                  </template>
                </el-input>
              </el-form-item>
            </el-col>

            <el-col :span="12">
              <el-form-item label="用户昵称" prop="sysUserNickname">
                <el-input v-model="form.sysUserNickname" placeholder="请输入用户昵称" class="custom-input">
                  <template #prefix>
                    <IconifyIconOnline icon="mdi:card-account-details" />
                  </template>
                </el-input>
              </el-form-item>
            </el-col>

            <el-col :span="12">
              <el-form-item label="登录密码" prop="sysUserPassword">
                <el-input v-model="form.sysUserPassword" placeholder="请输入登录密码" type="password" show-password
                  class="custom-input">
                  <template #prefix>
                    <IconifyIconOnline icon="mdi:lock" />
                  </template>
                </el-input>
              </el-form-item>
            </el-col>

            <el-col :span="12">
              <el-form-item label="手机号" prop="sysUserPhone">
                <el-input v-model="form.sysUserPhone" placeholder="请输入手机号" class="custom-input">
                  <template #prefix>
                    <IconifyIconOnline icon="mdi:phone" />
                  </template>
                </el-input>
              </el-form-item>
            </el-col>

            <el-col :span="12">
              <el-form-item label="邮箱地址" prop="sysUserEmail">
                <el-input v-model="form.sysUserEmail" placeholder="请输入邮箱地址" class="custom-input">
                  <template #prefix>
                    <IconifyIconOnline icon="mdi:email" />
                  </template>
                </el-input>
              </el-form-item>
            </el-col>

            <el-col :span="12">
              <el-form-item label="性别" prop="sysUserSex">
                <el-segmented v-model="form.sysUserSex" :options="sexOptions" class="custom-segmented">
                  <template #default="{ item }">
                    <div class="segmented-item">
                      <IconifyIconOnline
                        :icon="item.value === 1 ? 'mdi:gender-male' : item.value === 0 ? 'mdi:gender-female' : 'mdi:gender-non-binary'"
                        class="segmented-icon" />
                      <span>{{ item.label }}</span>
                    </div>
                  </template>
                </el-segmented>
              </el-form-item>
            </el-col>
          </div>

          <!-- 角色与状态区域 -->
          <div class="form-section">
            <div class="section-title">
              <IconifyIconOnline icon="mdi:account-cog" />
              <span>角色与状态</span>
            </div>

            <el-col :span="12">
              <el-form-item label="角色" prop="roleIds">
                <el-select v-model="form.roleIds" placeholder="请选择角色" class="custom-select" clearable multiple
                  collapse-tags collapse-tags-tooltip>
                  <template #prefix>
                    <IconifyIconOnline icon="mdi:shield-account" />
                  </template>
                  <el-option v-for="(item, index) in roleOptions" :key="index" :value="item.sysRoleId"
                    :label="item.sysRoleName">
                    <div class="option-content flex justify-start align-middle items-center">
                      <IconifyIconOnline icon="mdi:shield-account" class="option-icon mr-2" />
                      <span class="mr-2">{{ item.sysRoleName }}</span>
                      <span class="option-code el-form-item-msg">{{ item.sysRoleCode }}</span>
                    </div>
                  </el-option>
                </el-select>
              </el-form-item>
            </el-col>

            <el-col :span="12">
              <el-form-item label="用户状态" prop="sysUserStatus">
                <el-segmented v-model="form.sysUserStatus" :options="statusOptions" class="custom-segmented" />
              </el-form-item>
            </el-col>

            <el-col :span="24">
              <el-form-item label="备注" prop="sysUserRemark">
                <el-input v-model="form.sysUserRemark" placeholder="请输入备注" type="textarea" :rows="3"
                  class="custom-textarea" maxlength="200" show-word-limit />
              </el-form-item>
            </el-col>
          </div>
        </el-row>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="visible = false" class="cancel-btn">
            <IconifyIconOnline icon="mdi:close" />
            取 消
          </el-button>
          <el-button v-if="mode != 'show'" type="primary" :loading="loading" @click="submit()" class="save-btn">
            <IconifyIconOnline icon="mdi:content-save" />
            保 存
          </el-button>
        </div>
      </template>
    </sc-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from "vue";
import { fetchUpdateUser, fetchSaveUser, fetchUploadAvatar } from "@repo/core";
import { message } from "@repo/utils";
import { IconifyIconOnline } from "@repo/components/ReIcon";
import { Md5 } from "ts-md5";
import { REGEXP_PWD } from "@repo/pages/login/utils/rule";
import { $t, transformI18n } from "@repo/config";
import { fetchListRole } from "@/api/manage/role";
import Segmented from "@repo/components/ReSegmented";

// Types
interface UserForm {
  sysUserUsername: string;
  sysUserNickname: string;
  sysUserPassword: string | null;
  sysUserPhone: string;
  sysUserEmail: string;
  sysUserAvatar: string;
  sysUserSex: number;
  sysUserStatus: number;
  sysUserRemark: string;
  roleIds: number[];
  userRoles?: { sysRoleId: number }[];
}

// Emits
const emit = defineEmits<{
  (e: "success"): void;
}>();

// Refs
const dialogFormRef = ref();

// Reactive state
const form = ref<UserForm>({
  sysUserUsername: "",
  sysUserNickname: "",
  sysUserPassword: "",
  sysUserPhone: "",
  sysUserEmail: "",
  sysUserAvatar: "",
  sysUserSex: 1,
  sysUserStatus: 1,
  sysUserRemark: "",
  roleIds: [],
});

const avatarLoading = ref(false);
const visible = ref(false);
const loading = ref(false);
const title = ref("");
const mode = ref("save");
const roleOptions = ref<any[]>([]);

// Reactive rules (需要动态修改)
const rules = reactive<Record<string, any>>({
  sysUserUsername: [{ required: true, message: "请输入账号名称", trigger: "blur" }],
});

// Static options
const statusOptions = [
  { label: "开启", value: 1 },
  { label: "禁用", value: 0 },
];

const sexOptions = [
  { label: "男", value: 1 },
  { label: "女", value: 0 },
  { label: "其他", value: 2 },
];

// Methods
const close = async () => {
  visible.value = false;
  loading.value = false;
  delete rules["sysUserPassword"];
};

const setData = (data: any) => {
  form.value = data;
  // 提取用户角色ID
  form.value.roleIds = data?.userRoles?.map((item: any) => item.sysRoleId) || [];
  // 获取角色列表
  fetchListRole({}).then((res) => {
    roleOptions.value = res.data;
  });
};

const getAvatarClass = () => {
  const sex = form.value.sysUserSex;
  if (sex === 1) return 'avatar-male';
  if (sex === 0) return 'avatar-female';
  return 'avatar-other';
};

const getAvatarText = () => {
  const name = form.value.sysUserNickname || form.value.sysUserUsername || '';
  return name ? name[0].toUpperCase() : '?';
};

const handleAvatarChange = async (uploadFile: any) => {
  if (!uploadFile.raw) return;
  
  // 检查文件类型
  const isImage = uploadFile.raw.type.startsWith('image/');
  if (!isImage) {
    message('请上传图片文件', { type: 'warning' });
    return;
  }
  
  // 检查文件大小 (2MB)
  if (uploadFile.raw.size > 2 * 1024 * 1024) {
    message('头像文件不能超过2MB', { type: 'warning' });
    return;
  }
  
  avatarLoading.value = true;
  try {
    const res = await fetchUploadAvatar(uploadFile.raw);
    if (res?.code === '00000' && res?.data?.url) {
      form.value.sysUserAvatar = res.data.url;
      message('头像上传成功', { type: 'success' });
    } else {
      message(res?.msg || '头像上传失败', { type: 'error' });
    }
  } catch (error) {
    message('头像上传失败', { type: 'error' });
  } finally {
    avatarLoading.value = false;
  }
};

const open = async (modeValue = "save") => {
  visible.value = true;
  mode.value = modeValue;
  title.value = modeValue == "save" ? "新增用户" : "编辑用户";

  // 编辑模式下清空密码
  if (mode.value === "edit") {
    form.value.sysUserPassword = null;
  }

  // 新增模式下添加密码验证规则
  if (mode.value === "save") {
    rules["sysUserPassword"] = [
      {
        required: true,
        message: transformI18n($t("login.purePassWordReg")),
        trigger: "blur",
      },
      { min: 6, message: "密码长度不能小于6位", trigger: "blur" },
      { max: 20, message: "密码长度不能大于20位", trigger: "blur" },
      {
        pattern: REGEXP_PWD,
        message: transformI18n($t("login.purePassWordRuleReg")),
        trigger: "blur",
      },
    ];
  }
};

const submit = () => {
  // 如果昵称为空，使用用户名作为昵称
  if (!form.value.sysUserNickname) {
    form.value.sysUserNickname = form.value.sysUserUsername;
  }

  // 验证密码格式
  if (form.value.sysUserPassword) {
    if (!REGEXP_PWD.test(form.value.sysUserPassword)) {
      message(transformI18n($t("login.purePassWordRuleReg")), {
        type: "error",
      });
      return;
    }
  }

  dialogFormRef.value.validate(async (valid: boolean) => {
    if (valid) {
      loading.value = true;
      let res: any = {};
      // 创建新表单对象，避免修改原始数据
      const newFrom: any = {
        sysUserPassword: null,
        roleIds: null,
        updateRole: true,
      };
      Object.assign(newFrom, form.value);

      // 密码加密
      if (newFrom.sysUserPassword) {
        newFrom.sysUserPassword = Md5.hashStr(newFrom.sysUserPassword);
      }

      // 设置角色ID
      if (form.value.roleIds.length > 0) {
        newFrom.roleIds = form.value.roleIds;
      }

      try {
        // 根据模式选择保存或更新操作
        if (mode.value === "save") {
          res = await fetchSaveUser(newFrom);
        } else if (mode.value === "edit") {
          res = await fetchUpdateUser(newFrom);
        }

        if (res.code == "00000") {
          message(mode.value === "save" ? "添加成功" : "更新成功", { type: "success" });
          emit("success");
          visible.value = false;
        } else {
          message(res.msg, { type: "error" });
        }
      } catch (error) {
        message("操作失败", { type: "error" });
      } finally {
        loading.value = false;
      }
    }
  });
};

// Expose methods to parent
defineExpose({
  close,
  setData,
  open,
});
</script>

<style lang="scss" scoped>
.user-save-container {
  .user-dialog {
    :deep(.el-dialog) {
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 12px 32px 4px rgba(0, 0, 0, 0.1);

      .el-dialog__header {
        padding: 20px;
        margin: 0;
        border-bottom: 1px solid var(--el-border-color-lighter);
        background: var(--el-bg-color-overlay);
      }

      .el-dialog__body {
        padding: 24px;
        background: var(--el-bg-color-page);
      }

      .el-dialog__footer {
        padding: 16px 20px;
        border-top: 1px solid var(--el-border-color-lighter);
        background: var(--el-bg-color-overlay);
      }
    }
  }

  .avatar-section {
    margin-bottom: 24px;
    padding: 24px;
    background: linear-gradient(135deg, var(--el-color-primary-light-9) 0%, var(--el-color-primary-light-7) 100%);
    border-radius: 12px;
    display: flex;
    justify-content: center;

    .avatar-wrapper {
      display: flex;
      align-items: center;
      gap: 20px;

      .avatar-uploader {
        cursor: pointer;
      }

      .avatar-container {
        position: relative;
        width: 100px;
        height: 100px;
        border-radius: 50%;
        overflow: hidden;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        transition: all 0.3s ease;

        &:hover {
          transform: scale(1.05);
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);

          .avatar-overlay {
            opacity: 1;
          }
        }

        .el-avatar {
          width: 100%;
          height: 100%;
        }

        .avatar-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 36px;
          font-weight: bold;
          color: #fff;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

          &.avatar-male {
            background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
          }

          &.avatar-female {
            background: linear-gradient(135deg, #ff758c 0%, #ff7eb3 100%);
          }

          &.avatar-other {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          }
        }

        .avatar-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: #fff;
          opacity: 0;
          transition: opacity 0.3s ease;

          span {
            font-size: 12px;
            margin-top: 4px;
          }
        }
      }

      .avatar-info {
        h3 {
          margin: 0 0 4px;
          font-size: 18px;
          font-weight: 600;
          color: var(--el-text-color-primary);
        }

        p {
          margin: 0;
          font-size: 14px;
          color: var(--el-text-color-secondary);
        }
      }
    }
  }

  .user-form {
    .form-section {
      margin-bottom: 24px;
      padding: 20px;
      width: 100%;
      background: var(--el-bg-color-overlay);
      border-radius: 12px;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
      transition: all 0.3s ease;

      &:hover {
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
      }
    }

    .section-title {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 16px;
      padding-bottom: 8px;
      font-size: 16px;
      font-weight: 600;
      color: var(--el-text-color-primary);
      border-bottom: 1px solid var(--el-border-color-lighter);

      .iconify {
        font-size: 20px;
        color: var(--el-color-primary);
      }
    }

    .form-item-help {
      margin-top: 4px;
      font-size: 12px;
      color: var(--el-text-color-secondary);
    }
  }

  .custom-input {
    :deep(.el-input__wrapper) {
      padding-left: 8px;

      .el-input__prefix {
        margin-right: 8px;
        color: var(--el-text-color-secondary);
      }
    }
  }

  .custom-select {
    width: 100%;

    :deep(.el-input__wrapper) {
      padding-left: 8px;

      .el-input__prefix {
        margin-right: 8px;
        color: var(--el-text-color-secondary);
      }
    }

    .option-content {
      display: flex;
      justify-content: start;
      align-items: center;
      gap: 8px;

      .option-icon {
        font-size: 16px;
        color: var(--el-color-primary);
      }

      .option-code {
        margin-left: auto;
        color: var(--el-text-color-secondary);
        font-size: 13px;
      }
    }
  }

  .custom-textarea {
    :deep(.el-textarea__inner) {
      border-radius: 4px;
    }
  }

  .custom-segmented {
    width: 100%;

    .segmented-item {
      display: flex;
      align-items: center;
      gap: 4px;

      .segmented-icon {
        font-size: 16px;
      }
    }
  }

  .dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;

    .el-button {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 8px 20px;
      transition: all 0.3s ease;

      &:hover {
        transform: translateY(-2px);
      }
    }
  }
}

// 暗色主题适配
:root[data-theme='dark'] {
  .user-save-container {
    .avatar-section {
      background: linear-gradient(135deg, rgba(64, 158, 255, 0.15) 0%, rgba(64, 158, 255, 0.05) 100%);
    }

    .form-section {
      background: var(--el-bg-color-overlay);
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.2);
    }
  }
}
</style>
