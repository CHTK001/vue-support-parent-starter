<script lang="ts">
import { defineComponent, toRaw } from "vue";
import { fetchUpdateUser, fetchSaveUser } from "@/api/user";

import { message } from "@/utils/message";
import { clearObject } from "@/utils/objects";
import { Md5 } from "ts-md5";
import { REGEXP_PWD } from "@/views/login/utils/rule";
import { $t, transformI18n } from "@/plugins/i18n";
import { debounce, throttle } from "@pureadmin/utils";
import { fetchListRole } from "@/api/role";
import Segmented from "@/components/ReSegmented";

export default defineComponent({
  components: { Segmented },
  data() {
    return {
      form: {
        sysUserUsername: "",
        sysUserNickname: "",
        sysUserPassword: "",
        sysUserPhone: "",
        sysUserSex: "",
        sysUserStatus: 1,
        sysUserRemark: "",
        roleIds: []
      },
      visible: false,
      rules: {
        sysUserUsername: [
          { required: true, message: "请输入账号名称", trigger: "blur" }
        ]
      },
      loading: false,
      title: "",
      mode: "save",
      statusOptions: [
        {
          label: "开启",
          value: 1
        },
        {
          label: "禁用",
          value: 0
        }
      ],
      sexOptions: [
        {
          label: "男",
          value: 1
        },
        {
          label: "女",
          value: 0
        },
        {
          label: "其他",
          value: 2
        }
      ],
      roleOptions: []
    };
  },
  methods: {
    async close() {
      this.visible = false;
      this.loading = false;
      delete this.rules["sysUserPassword"];
      clearObject(this.form);
      this.form.sysUserStatus = 1;
    },
    setData(data) {
      Object.assign(this.form, data);
      this.form.roleIds = data?.userRoles?.map(item => item.sysRoleId);
      fetchListRole({}).then(res => {
        this.roleOptions = res.data;
      });
      return this;
    },
    async open(mode = "save") {
      this.visible = true;
      this.mode = mode;
      this.title = mode == "save" ? "新增" : "编辑";
      if (this.mode === "edit") {
        this.form.sysUserPassword = null;
      }
      if (this.mode === "save") {
        this.rules["sysUserPassword"] = [
          {
            required: true,
            message: transformI18n($t("login.purePassWordReg")),
            trigger: "blur"
          },
          { min: 6, message: "密码长度不能小于6位", trigger: "blur" },
          { max: 20, message: "密码长度不能大于20位", trigger: "blur" },
          {
            pattern: REGEXP_PWD,
            message: transformI18n($t("login.purePassWordRuleReg")),
            trigger: "blur"
          }
        ];
      }
    },
    submit() {
      if (!this.form.sysUserNickname) {
        this.form.sysUserNickname = this.form.sysUserUsername;
      }
      if (this.form.sysUserPassword) {
        if (!REGEXP_PWD.test(this.form.sysUserPassword)) {
          message(transformI18n($t("login.purePassWordRuleReg")), {
            type: "error"
          });
          return;
        }
      }

      this.$refs.dialogForm.validate(async valid => {
        if (valid) {
          this.loading = true;
          var res: any = {};
          const newFrom = {
            sysUserPassword: null,
            roleIds: null,
            updateRole: true
          };
          Object.assign(newFrom, this.form);

          if (newFrom.sysUserPassword) {
            newFrom.sysUserPassword = Md5.hashStr(newFrom.sysUserPassword);
          }
          if (this.form.roleIds.length > 0) {
            newFrom.roleIds = this.form.roleIds;
          }

          if (this.mode === "save") {
            res = await fetchSaveUser(newFrom);
          } else if (this.mode === "edit") {
            res = await fetchUpdateUser(newFrom);
          }

          if (res.code == "00000") {
            this.$emit("success");
            this.visible = false;
          } else {
            message(res.msg, { type: "error" });
          }
        }
        this.loading = false;
      });
    }
  }
});
</script>
<template>
  <div>
    <el-dialog
      v-model="visible"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      :destroy-on-close="true"
      draggable
      :title="title"
      @close="close"
    >
      <el-form
        ref="dialogForm"
        :model="form"
        :rules="rules"
        :disabled="mode == 'show'"
        label-width="100px"
      >
        <el-row>
          <el-col :span="12">
            <el-form-item label="账号名称" prop="sysUserUsername">
              <el-input
                v-model="form.sysUserUsername"
                placeholder="请输入账号名称"
              />
            </el-form-item> </el-col
          ><el-col :span="12">
            <el-form-item label="用户昵称" prop="sysUserNickname">
              <el-input
                v-model="form.sysUserNickname"
                placeholder="请输入用户昵称"
              />
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="登录密码" prop="sysUserPassword">
              <el-input
                v-model="form.sysUserPassword"
                placeholder="请输入登录密码"
                type="password"
                show-password
              />
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="角色" prop="roleIds">
              <el-select
                v-model="form.roleIds"
                placeholder="请选择"
                class="w-full"
                clearable
                multiple
              >
                <el-option
                  v-for="(item, index) in roleOptions"
                  :key="index"
                  :value="item.sysRoleId"
                  :label="item.sysRoleName"
                >
                  <span>{{ item.sysRoleName }}</span>
                  <span
                    style="
                      float: right;
                      color: var(--el-text-color-secondary);
                      font-size: 13px;
                    "
                    >{{ item.sysRoleCode }}</span
                  >
                </el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="是否开启" prop="sysUserStatus">
              <Segmented
                v-model="form.sysUserStatus"
                :options="statusOptions"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="手机号" prop="sysUserPhone">
              <el-input
                v-model="form.sysUserPhone"
                placeholder="请输入手机号"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="性别" prop="sysUserSex">
              <Segmented v-model="form.sysUserSex" :options="sexOptions"
            /></el-form-item>
          </el-col>

          <el-col :span="24">
            <el-form-item label="备注" prop="sysUserRemark">
              <el-input
                v-model="form.sysUserRemark"
                placeholder="请输入备注"
                type="textarea"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>

      <template #footer>
        <el-button @click="visible = false">取 消</el-button>
        <el-button
          v-if="mode != 'show'"
          type="primary"
          :loading="loading"
          @click="submit()"
          >保 存</el-button
        >
      </template>
    </el-dialog>
  </div>
</template>
