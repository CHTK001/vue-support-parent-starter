<template>
  <div>
    <h3 class="my-8">{{ $t("button.password") }}</h3>
    <el-alert
      title="密码更新成功后，您将被重定向到登录页面，您可以使用新密码重新登录。"
      type="info"
      show-icon
      :closable="false"
      style="margin-bottom: 15px"
    />
    <el-form
      ref="form"
      :model="form"
      :rules="rules"
      label-width="120px"
      style="margin-top: 20px"
    >
      <el-form-item label="当前密码" prop="oldPassword">
        <el-input
          v-model="form.oldPassword"
          type="password"
          show-password
          placeholder="请输入当前密码"
        />
        <div class="el-form-item-msg">必须提供当前登录用户密码才能进行更改</div>
      </el-form-item>
      <el-form-item label="新密码" prop="newPassword">
        <el-input
          v-model="form.newPassword"
          type="password"
          show-password
          placeholder="请输入新密码"
        />
        <sc-password-strength v-model="form.newPassword" />
        <div class="el-form-item-msg">
          密码必须是8位以上、必须含有字母、数字、特殊符号
        </div>
      </el-form-item>
      <el-form-item label="确认新密码" prop="confirmNewPassword">
        <el-input
          v-model="form.confirmNewPassword"
          type="password"
          show-password
          placeholder="请再次输入新密码"
        />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="save">保存密码</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script>
import scPasswordStrength from "@/components/scPasswordStrength/index.vue";
import { Md5 } from "ts-md5";
import { fetchUpdateUserOwner } from "@/api/user";
import { useUserStore } from "@/store/modules/user";
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
        oldPassword: [{ required: true, message: "请输入当前密码" }],
        newPassword: [
          { required: true, message: "请输入登录密码" },
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
