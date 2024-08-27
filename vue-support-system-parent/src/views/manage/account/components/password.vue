<template>
  <div>
    <h3 class="my-8">{{ $t("button.password") }}</h3>
    <el-alert
      :title="$t('message.updatePassword')"
      type="warning"
      show-icon
      :closable="false"
      style="margin-bottom: 15px"
    />
    <el-form
      ref="form"
      :model="form"
      :rules="rules"
      label-width="150px"
      style="margin-top: 20px"
    >
      <el-form-item :label="$t('field.currentPassword')" prop="oldPassword">
        <el-input
          v-model="form.oldPassword"
          type="password"
          show-password
          :placeholder="
            $t('message.pleaseInput') + ' ' + $t('field.currentPassword')
          "
        />
        <div class="el-form-item-msg">必须提供当前登录用户密码才能进行更改</div>
      </el-form-item>
      <el-form-item :label="$t('field.newPassword')" prop="newPassword">
        <el-input
          v-model="form.newPassword"
          type="password"
          show-password
          :placeholder="
            $t('message.pleaseInput') + ' ' + $t('field.newPassword')
          "
        />
        <sc-password-strength v-model="form.newPassword" />
        <div class="el-form-item-msg">
          {{ $t("message.newPassword") }}
        </div>
      </el-form-item>
      <el-form-item
        :label="$t('field.confirmPassword')"
        prop="confirmNewPassword"
      >
        <el-input
          v-model="form.confirmNewPassword"
          type="password"
          show-password
          :placeholder="
            $t('message.pleaseInput') + ' ' + $t('field.confirmPassword')
          "
        />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="save">
          {{ $t("button.update") }}
        </el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script>
import scPasswordStrength from "@/components/scPasswordStrength/index.vue";
import { Md5 } from "ts-md5";
import { fetchUpdateUserOwner } from "@/api/user";
import { useUserStore } from "@/store/modules/user";
import { transformI18n } from "@/plugins/i18n";
export default {
  components: {
    scPasswordStrength
  },
  data() {
    return {
      form: {
        oldPassword: "",
        newPassword: "",
        confirmNewPassword: ""
      },
      rules: {
        oldPassword: [
          {
            required: true,
            message:
              transformI18n("message.pleaseInput") +
              " " +
              transformI18n("field.currentPassword")
          }
        ],
        newPassword: [
          {
            required: true,
            message:
              transformI18n("message.pleaseInput") +
              " " +
              transformI18n("field.newPassword")
          },
          {
            validator: (rule, value, callback) => {
              var reg1 =
                /^(?=.*\d)(?=.*[a-zA-Z])(?=.*[~!@#$%^&*.])[\da-zA-Z~!@#$%^&*.]{8,}$/; //密码必须是8位以上、必须含有字母、数字、特殊符号
              var reg2 = /(123|234|345|456|567|678|789|012)/; //不能有3个连续数字
              if (!reg1.test(value)) {
                callback(
                  new Error("密码必须是8位以上、必须含有字母、数字、特殊符号")
                );
              } else if (reg2.test(value)) {
                callback(new Error("不能有3个连续数字"));
              } else {
                callback();
              }
            }
          }
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
            }
          }
        ]
      }
    };
  },
  methods: {
    save() {
      this.$refs.form.validate(valid => {
        if (valid) {
          const form = {};
          form.newPassword = Md5.hashStr(this.form.newPassword);
          form.oldPassword = Md5.hashStr(this.form.oldPassword);
          fetchUpdateUserOwner(form).then(res => {
            if (res.code == "00000") {
              this.$alert(
                "密码修改成功，是否跳转至登录页使用新密码登录",
                "修改成功",
                {
                  type: "success",
                  center: true
                }
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
        } else {
          return false;
        }
      });
    }
  }
};
</script>

<style></style>
