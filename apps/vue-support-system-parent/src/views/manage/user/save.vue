<template>
  <div class="user-save-container">
    <el-dialog v-model="visible" :title="title" :close-on-click-modal="false" :close-on-press-escape="false"
      :destroy-on-close="true" draggable class="user-dialog" @close="close">
      <el-form ref="dialogForm" :model="form" :rules="rules" :disabled="mode == 'show'" label-width="100px"
        class="user-form">
        <el-row :gutter="20">
          <!-- 基本信息区域 -->
          <div class="form-section">
            <div class="section-title">
              <IconifyIconOnline icon="mdi:account-details" />
              <span>基本信息</span>
            </div>

            <el-col :span="24">
              <el-form-item label="账号名称" prop="sysUserUsername">
                <el-input v-model="form.sysUserUsername" placeholder="请输入账号名称" class="custom-input">
                  <template #prefix>
                    <IconifyIconOnline icon="mdi:account" />
                  </template>
                </el-input>
              </el-form-item>
            </el-col>

            <el-col :span="24">
              <el-form-item label="用户昵称" prop="sysUserNickname">
                <el-input v-model="form.sysUserNickname" placeholder="请输入用户昵称" class="custom-input">
                  <template #prefix>
                    <IconifyIconOnline icon="mdi:card-account-details" />
                  </template>
                </el-input>
              </el-form-item>
            </el-col>

            <el-col :span="24">
              <el-form-item label="登录密码" prop="sysUserPassword">
                <el-input v-model="form.sysUserPassword" placeholder="请输入登录密码" type="password" show-password
                  class="custom-input">
                  <template #prefix>
                    <IconifyIconOnline icon="mdi:lock" />
                  </template>
                </el-input>
                <div class="form-item-help" v-if="mode === 'save'">
                  密码需包含字母、数字，长度6-20位
                </div>
              </el-form-item>
            </el-col>

            <el-col :span="24">
              <el-form-item label="手机号" prop="sysUserPhone">
                <el-input v-model="form.sysUserPhone" placeholder="请输入手机号" class="custom-input">
                  <template #prefix>
                    <IconifyIconOnline icon="mdi:phone" />
                  </template>
                </el-input>
              </el-form-item>
            </el-col>
          </div>

          <!-- 角色与状态区域 -->
          <div class="form-section">
            <div class="section-title">
              <IconifyIconOnline icon="mdi:account-cog" />
              <span>角色与状态</span>
            </div>

            <el-col :span="24">
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

            <el-col :span="24">
              <el-form-item label="是否开启" prop="sysUserStatus">
                <el-segmented v-model="form.sysUserStatus" :options="statusOptions" class="custom-segmented" />
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

            <el-col :span="24">
              <el-form-item label="备注" prop="sysUserRemark">
                <el-input v-model="form.sysUserRemark" placeholder="请输入备注" type="textarea" :rows="3"
                  class="custom-textarea" />
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
    </el-dialog>
  </div>
</template>

<script lang="ts">
import { defineComponent, toRaw } from "vue";
import { fetchUpdateUser, fetchSaveUser } from "@repo/core";
import { message } from "@repo/utils";
import { Md5 } from "ts-md5";
import { REGEXP_PWD } from "@repo/pages/login/utils/rule";
import { $t, transformI18n } from "@repo/config";
import { debounce, throttle } from "@pureadmin/utils";
import { fetchListRole } from "@/api/manage/role";
import { clearObject } from "@repo/config";
import Segmented from "@repo/components/ReSegmented";

export default defineComponent({
  components: { Segmented },
  data() {
    return {
      // 表单数据
      form: {
        sysUserUsername: "",
        sysUserNickname: "",
        sysUserPassword: "",
        sysUserPhone: "",
        sysUserSex: "",
        sysUserStatus: 1,
        sysUserRemark: "",
        roleIds: [], // 用户角色ID列表
      },
      visible: false,
      // 表单验证规则
      rules: {
        sysUserUsername: [{ required: true, message: "请输入账号名称", trigger: "blur" }],
      },
      loading: false,
      title: "",
      mode: "save",
      // 用户状态选项
      statusOptions: [
        {
          label: "开启",
          value: 1,
        },
        {
          label: "禁用",
          value: 0,
        },
      ],
      // 性别选项
      sexOptions: [
        {
          label: "男",
          value: 1,
        },
        {
          label: "女",
          value: 0,
        },
        {
          label: "其他",
          value: 2,
        },
      ],
      roleOptions: [], // 角色选项列表
    };
  },
  methods: {
    // 关闭对话框
    async close() {
      this.visible = false;
      this.loading = false;
      delete this.rules["sysUserPassword"];
    },
    // 设置表单数据
    setData(data) {
      this.form = data;
      // 提取用户角色ID
      this.form.roleIds = data?.userRoles?.map((item) => item.sysRoleId);
      // 获取角色列表
      fetchListRole({}).then((res) => {
        this.roleOptions = res.data;
      });
      return this;
    },
    // 打开对话框
    async open(mode = "save") {
      this.visible = true;
      this.mode = mode;
      this.title = mode == "save" ? "新增用户" : "编辑用户";

      // 编辑模式下清空密码
      if (this.mode === "edit") {
        this.form.sysUserPassword = null;
      }

      // 新增模式下添加密码验证规则
      if (this.mode === "save") {
        this.rules["sysUserPassword"] = [
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
    },
    // 提交表单
    submit() {
      // 如果昵称为空，使用用户名作为昵称
      if (!this.form.sysUserNickname) {
        this.form.sysUserNickname = this.form.sysUserUsername;
      }

      // 验证密码格式
      if (this.form.sysUserPassword) {
        if (!REGEXP_PWD.test(this.form.sysUserPassword)) {
          message(transformI18n($t("login.purePassWordRuleReg")), {
            type: "error",
          });
          return;
        }
      }

      this.$refs.dialogForm.validate(async (valid) => {
        if (valid) {
          this.loading = true;
          var res: any = {};
          // 创建新表单对象，避免修改原始数据
          const newFrom = {
            sysUserPassword: null,
            roleIds: null,
            updateRole: true,
          };
          Object.assign(newFrom, this.form);

          // 密码加密
          if (newFrom.sysUserPassword) {
            newFrom.sysUserPassword = Md5.hashStr(newFrom.sysUserPassword);
          }

          // 设置角色ID
          if (this.form.roleIds.length > 0) {
            newFrom.roleIds = this.form.roleIds;
          }

          try {
            // 根据模式选择保存或更新操作
            if (this.mode === "save") {
              res = await fetchSaveUser(newFrom);
            } else if (this.mode === "edit") {
              res = await fetchUpdateUser(newFrom);
            }

            if (res.code == "00000") {
              message(this.mode === "save" ? "添加成功" : "更新成功", { type: "success" });
              this.$emit("success");
              this.visible = false;
            } else {
              message(res.msg, { type: "error" });
            }
          } catch (error) {
            message("操作失败", { type: "error" });
          } finally {
            this.loading = false;
          }
        }
      });
    },
  },
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

  .user-form {
    .form-section {
      margin-bottom: 24px;
      padding: 16px;
      width: 50%;
      background: var(--el-bg-color-overlay);
      border-radius: 8px;
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
    .form-section {
      background: var(--el-bg-color-overlay);
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.2);
    }
  }
}
</style>
