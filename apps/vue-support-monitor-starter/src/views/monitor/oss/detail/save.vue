<template>
  <el-col :lg="12">
    <h2>{{ form.fileStorageProtocolDesc || "新增菜单" }}</h2>
    <el-form ref="dialogForm" :model="row" :rules="rules" label-width="80px" label-position="left">
      <el-form-item label="显示名称" prop="fileStorageName">
        <el-input v-model="row.fileStorageName" clearable placeholder="名称" />
      </el-form-item>
      <el-form-item label="类型" prop="fileStorageType">
        <el-radio-group v-model="row.fileStorageType">
          <el-radio-button v-for="item in options?.fileStorage || []" :key="item" :label="item.name" :value="item.name">{{ item.describe || item.name }}</el-radio-button>
        </el-radio-group>
      </el-form-item>

      <el-form-item label="bucket" prop="fileStorageBucket">
        <el-input v-model="row.fileStorageBucket" clearable placeholder="bucket" />
      </el-form-item>

      <el-form-item v-if="isShow" label="Cookie" prop="fileStorageCookie">
        <el-input v-model="row.fileStorageCookie" clearable placeholder="cookie" type="textarea" />
      </el-form-item>

      <el-form-item label="图标" prop="fileStorageIcon">
        <icon-select v-model="row.fileStorageIcon" clearable />
      </el-form-item>
      <el-form-item label="账号" prop="fileStorageUser">
        <el-input v-model="row.fileStorageUser" clearable placeholder="账号" />
        <div class="el-form-item-msg">部分类型需要填写</div>
      </el-form-item>
      <el-form-item label="密码" prop="fileStoragePassword">
        <el-input v-model="row.fileStoragePassword" clearable placeholder="密码" />
        <div class="el-form-item-msg">部分类型需要填写</div>
      </el-form-item>
      <el-form-item label="端点" prop="fileStorageEndpoint">
        <el-input v-model="row.fileStorageEndpoint" clearable placeholder="端点" />
        <div class="el-form-item-msg">部分类型需要填写, 本地存储需要填写本地地址</div>
      </el-form-item>

      <el-form-item label="启用" prop="fileStorageStatus">
        <el-switch v-model="row.fileStorageStatus" :active-value="1" :inactive-value="0" />
      </el-form-item>

      <el-form-item label="描述" prop="fileStorageDesc">
        <el-input v-model="row.fileStorageDesc" clearable placeholder="描述" type="textarea" />
      </el-form-item>

      <el-form-item>
        <el-button type="primary" :loading="loading" @click="doSubmit">保 存</el-button>
      </el-form-item>
    </el-form>
  </el-col>
</template>
<script>
import { fetchOssSave, fetchOssUpdate } from "@/api/monitor/oss";
import { fetchOptionGet, fetchOptionList } from "@/api/spi";
import { IconSelect } from "@repo/components/ReIcon";

export default {
  components: { IconSelect },
  props: {
    form: {
      type: Object,
      default: () => {
        return {};
      }
    },
    menu: {
      type: Object,
      default: () => {
        return {};
      }
    }
  },
  data() {
    return {
      row: {},
      isShow: false,
      loading: false,
      options: [],
      rules: {
        fileStorageName: [{ required: true, message: "请输入名称", trigger: "blur" }],
        fileStorageType: [{ required: true, message: "请选择类型", trigger: "blur" }],
        fileStorageBucket: [{ required: true, message: "请输入bucket", trigger: "blur" }]
      }
    };
  },
  watch: {
    menu: {
      handler(val) {
        this.row = {};
        Object.assign(this.row, val);
      },
      deep: true
    },
    "row.fileStorageType": {
      handler(val) {
        this.changeType();
      },
      deep: true
    }
  },

  mounted() {
    Object.assign(this.row, this.menu);
    this.row.fileStorageProtocolId = this.form.fileStorageProtocolId;
    this.changeType();
    this.afterPropertiesSet();
  },
  methods: {
    changeType() {
      this.isShow = this.options?.fileStorage?.filter(it => it.name == this.row.fileStorageType)?.[0]?.supportedTypes?.indexOf("cookie") > -1;
      if (this.isShow) {
        this.rules.fileStorageCookie = [{ required: true, message: "请输入cookie", trigger: "blur" }];
      } else {
        delete this.rules.fileStorageCookie;
      }
    },
    close() {
      this.visible = false;
      this.loading = false;
      this.$emit("close");
      this.row = {};
      Object.assign(this.row, this.menu);
      this.row.fileStorageProtocolId = this.form.fileStorageProtocolId;
    },
    async afterPropertiesSet() {
      const res = await fetchOptionList({ type: "fileStorage" });
      if (res.code === "00000") {
        this.options = res.data || [];
      }
    },
    doSubmit() {
      this.$refs.dialogForm.validate(valid => {
        if (valid) {
          this.loading = true;
          if (this.row.fileStorageId) {
            fetchOssUpdate(this.row)
              .then(res => {
                if (res.code === "00000") {
                  this.$message.success("保存成功");
                  this.$emit("success");
                  Object.assign(this.menu, this.row);
                  this.close();
                } else {
                  this.$message.error(res.msg);
                }
              })
              .finally(() => {
                this.loading = false;
              });
            return false;
          }
          fetchOssSave(this.row)
            .then(res => {
              if (res.code === "00000") {
                this.$message.success("保存成功");
                this.$emit("success");
                this.close();
              } else {
                this.$message.error(res.msg);
              }
            })
            .finally(() => {
              this.loading = false;
            });
        }
      });
    }
  }
};
</script>
