<template>
  <div class="password-pane">
    <h3 v-if="showTitle" class="password-pane__title">
      {{ $t("buttons.password") }}
    </h3>
    <ScAlert
      class="password-pane__alert"
      :title="$t('message.updatePassword')"
      type="warning"
      show-icon
      :closable="false"
    />
    <ScForm
      ref="form"
      :model="form"
      :rules="rules"
      label-width="120px"
      class="password-form"
    >
      <ScFormItem :label="$t('field.currentPassword')" prop="oldPassword">
        <ScInput
          v-model="form.oldPassword"
          type="password"
          show-password
          :placeholder="
            $t('message.pleaseInput') + ' ' + $t('field.currentPassword')
          "
        />
        <div class="password-form__hint">
          必须提供当前登录用户密码才能进行更改
        </div>
      </ScFormItem>
      <ScFormItem :label="$t('field.newPassword')" prop="newPassword">
        <ScInput
          v-model="form.newPassword"
          type="password"
          show-password
          :placeholder="
            $t('message.pleaseInput') + ' ' + $t('field.newPassword')
          "
        />
        <sc-password-strength
          v-model="form.newPassword"
          class="password-form__strength"
        />
        <div class="password-form__hint">
          {{ $t("message.newPassword") }}
        </div>
      </ScFormItem>
      <ScFormItem
        :label="$t('field.confirmPassword')"
        prop="confirmNewPassword"
      >
        <ScInput
          v-model="form.confirmNewPassword"
          type="password"
          show-password
          :placeholder="
            $t('message.pleaseInput') + ' ' + $t('field.confirmPassword')
          "
        />
      </ScFormItem>
      <ScFormItem class="password-form__actions">
        <ScButton type="primary" @click="save">
          {{ $t("buttons.update") }}
        </ScButton>
      </ScFormItem>
    </ScForm>
  </div>
</template>

<script>
import { ScPasswordStrength } from "@repo/components/ScPasswordStrength";
import { Md5 } from "ts-md5";
import { fetchUpdateUserOwner, useUserStore } from "@repo/core";
import { transformI18n } from "@repo/config";
import { ScAlert } from "@repo/components/ScAlert";
import { ScForm } from "@repo/components/ScForm";
import { ScFormItem } from "@repo/components/ScFormItem";
import { ScInput } from "@repo/components/ScInput";
import { ScButton } from "@repo/components/ScButton";

export default {
  components: {
    ScPasswordStrength,
    ScAlert,
    ScForm,
    ScFormItem,
    ScInput,
    ScButton,
  },
  props: {
    showTitle: {
      type: Boolean,
      default: true,
    },
  },
  data() {
    return {
      form: {
        oldPassword: "",
        newPassword: "",
        confirmNewPassword: "",
      },
      rules: {
        oldPassword: [
          {
            required: true,
            message:
              transformI18n("message.pleaseInput") +
              " " +
              transformI18n("field.currentPassword"),
          },
        ],
        newPassword: [
          {
            required: true,
            message:
              transformI18n("message.pleaseInput") +
              " " +
              transformI18n("field.newPassword"),
          },
          {
            validator: (rule, value, callback) => {
              const reg1 =
                /^(?=.*\d)(?=.*[a-zA-Z])(?=.*[~!@#$%^&*.])[\da-zA-Z~!@#$%^&*.]{8,}$/;
              const reg2 = /(123|234|345|456|567|678|789|012)/;
              if (!reg1.test(value)) {
                callback(
                  new Error("密码必须是8位以上、必须含有字母、数字、特殊符号"),
                );
              } else if (reg2.test(value)) {
                callback(new Error("不能有3个连续数字"));
              } else {
                callback();
              }
            },
          },
        ],
        confirmNewPassword: [
          { required: true, message: "请再次输入新密码" },
          {
            validator: (rule, value, callback) => {
              if (value !== this.form.newPassword) {
                callback(new Error("两次输入密码不一致"));
              } else {
                callback();
              }
            },
          },
        ],
      },
    };
  },
  methods: {
    save() {
      this.$refs.form.validate((valid) => {
        if (!valid) {
          return false;
        }
        const form = {};
        form.newPassword = Md5.hashStr(this.form.newPassword);
        form.oldPassword = Md5.hashStr(this.form.oldPassword);
        fetchUpdateUserOwner(form).then((res) => {
          if (res.code === "00000") {
            this.$alert(
              "密码修改成功，是否跳转至登录页使用新密码登录",
              "修改成功",
              {
                type: "success",
                center: true,
              },
            )
              .then(() => {
                this.$nextTick(() => {
                  useUserStore().logOut();
                });
              })
              .catch(() => {});
          } else {
            this.$notify.error({ title: "提示", message: res.msg });
          }
        });
        return true;
      });
    },
  },
};
</script>

<style scoped lang="scss">
.password-pane__title {
  margin: 2rem 0;
}

.password-pane__alert {
  margin-bottom: 16px;
}

.password-form {
  margin-top: 20px;
}

:deep(.password-form .el-form-item) {
  align-items: flex-start;
}

:deep(.password-form .el-form-item__label) {
  justify-content: flex-end;
  padding-right: 16px;
  line-height: 40px;
}

:deep(.password-form .el-form-item__content) {
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 8px;
}

.password-form__hint {
  font-size: 12px;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
}

.password-form__strength {
  width: 100%;
}

:deep(.password-form__actions .el-form-item__content) {
  flex-direction: row;
  gap: 12px;
}
</style>
