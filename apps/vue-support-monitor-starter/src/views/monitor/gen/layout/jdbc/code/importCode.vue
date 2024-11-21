<template>
  <el-dialog v-model="dialogStatus" title="导出向导" :close-on-click-modal="false" width="70%" destroy-on-close draggable @closed="$emit('closed')">
    <el-steps :active="active" align-center style="margin-bottom: 20px">
      <el-step title="填写基本信息" />
      <el-step title="确认信息" />
      <el-step title="完成" />
    </el-steps>
    <el-row>
      <el-col>
        <el-form v-if="active == 0" ref="stepForm_0" :model="downloadForm" :rules="rules" label-width="120px">
          <el-row :gutter="10">
            <el-col :span="12">
              <el-alert title="基础信息" show-icon style="margin-bottom: 15px" :closable="false" />
              <el-form-item label="包名" prop="packageName">
                <el-input v-model="downloadForm.packageName" clearable />
              </el-form-item>

              <el-form-item label="作者" prop="author">
                <el-input v-model="downloadForm.author" clearable />
              </el-form-item>

              <el-form-item v-if="downloadForm.tableNames.length == 1" label="功能名称" prop="functionName">
                <el-input v-model="downloadForm.functionName" clearable />
              </el-form-item>

              <el-form-item label="模块名称" prop="moduleName">
                <el-input v-model="downloadForm.moduleName" clearable />
              </el-form-item>

              <el-form-item label="版本" prop="version">
                <el-input v-model="downloadForm.version" clearable />
                <span>用于连接上区分版本/version/xxxx</span>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-alert title="基础功能" show-icon style="margin-bottom: 15px" :closable="false" />
              <el-form-item label="swagger注释" prop="openSwagger">
                <el-checkbox v-model="downloadForm.openSwagger" label="" :indeterminate="false" />
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
        <el-col :lg="{ span: 8, offset: 8 }">
          <el-form v-if="active == 1" ref="stepForm_1" :model="downloadForm" :rules="rules" label-position="top">
            <el-alert title="确认信息" type="warning" show-icon style="margin-bottom: 15px" />
            <el-row>
              <el-col :xs="12">
                <el-descriptions :column="1" border style="margin-bottom: 15px">
                  <el-descriptions-item label="包名">{{ downloadForm.packageName }}</el-descriptions-item>
                  <el-descriptions-item label="作者">{{ downloadForm.author }}</el-descriptions-item>
                </el-descriptions>
              </el-col>
              <el-col :xs="12">
                <el-descriptions :column="1" border style="margin-bottom: 15px">
                  <el-descriptions-item v-for="it in downloadForm.tableNames" :key="it" label="表">{{ it }}</el-descriptions-item>
                </el-descriptions>
              </el-col>
            </el-row>
            <el-divider />
          </el-form>
        </el-col>
        <div v-if="active == 2">
          <el-result icon="success" title="操作成功" sub-title="导出成功">
            <template #extra>
              <el-button type="primary" @click="again">再次下载</el-button>
            </template>
          </el-result>
        </div>
        <el-button v-if="active == 1" style="float: right; margin-left: 10px" type="primary" :loading="submitLoading" @click="submit">导出</el-button>
        <el-button v-if="active > 0 && active < 2" style="float: right" :disabled="submitLoading" @click="pre">上一步</el-button>
        <el-button v-if="active < 1" style="float: right" type="primary" @click="next">下一步</el-button>
      </el-col>
    </el-row>
  </el-dialog>
</template>

<script>
import { fetchGenTableGenCode } from "@/api/monitor/gen/table";
import { downLoadZip } from "@repo/utils";
export default {
  name: "importCodeVue",
  data() {
    return {
      active: 0,
      submitLoading: 0,
      dialogStatus: 0,
      downloadForm: {
        packageName: "com",
        author: "admin"
      },
      rules: {
        packageName: [{ required: true, message: "包名不能为空" }],
        author: [{ required: true, message: "作者不能为空" }]
      }
    };
  },
  methods: {
    download() {
      downLoadZip(fetchGenTableGenCode, this.downloadForm, "code");
    },
    open(data) {
      this.dialogStatus = !0;
      Object.assign(this.downloadForm, data);
    },
    //下一步
    next() {
      const formName = `stepForm_${this.active}`;
      this.$refs[formName].validate(valid => {
        if (valid) {
          this.active += 1;
        } else {
          return false;
        }
      });
    },
    //上一步
    pre() {
      this.active -= 1;
    },
    //提交
    submit() {
      const formName = `stepForm_${this.active}`;
      this.$refs[formName].validate(valid => {
        if (valid) {
          this.submitLoading = true;
          try {
            this.download();
          } catch (error) {}
          this.dialogStatus = false;
          this.submitLoading = false;
        } else {
          return false;
        }
      });
    },
    //再来一次
    again() {
      this.active = 0;
    }
  }
};
</script>
