<template>
  <div>
    <el-dialog v-model="visible" :title="'上传文件 [' + form.genName + ']'" draggable :close-on-click-modal="false" @close="onClose">
      <el-form :form>
        <el-form-item label="类型">
          <el-select v-model="form.type">
            <el-option value="data" label="数据文件" />
            <el-option value="driver" label="驱动文件" />
          </el-select>
        </el-form-item>

        <el-form-item v-if="form.type" label="文件" class="w-full">
          <el-upload class="upload-demo w-full" drag :auto-upload="false" :limit="1" @change="handleFileChange">
            <el-icon class="el-icon--upload w-full">
              <component :is="useRenderIcon('ep:upload')" />
            </el-icon>
            <div class="el-upload__text">
              拖动文件或者
              <em>点击上传</em>
            </div>
          </el-upload>
        </el-form-item>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="visible = false">取消</el-button>
          <el-button type="primary" :loading="isSave" @click="handleSubmit">提交</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>
<script>
import { fetchGenDatabaseInstall } from "@/api/monitor/gen/database";
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";

export default {
  data() {
    return {
      visible: false,
      isSave: false,
      form: {
        file: null
      }
    };
  },
  methods: {
    useRenderIcon,
    handleFileChange(file) {
      this.form.file = file.raw;
    },
    onClose() {
      this.$emit("close");
      this.visible = false;
      this.isSave = false;
      this.form = {};

      return true;
    },
    open(mode) {
      this.mode = mode;
      this.visible = true;
    },
    setData(data) {
      this.form.genId = data.genId;
      return this;
    },
    handleSubmit() {
      this.isSave = true;
      fetchGenDatabaseInstall(this.form)
        .then(res => {
          if (res.code == "00000") {
            this.$message.success("操作成功");
            this.onClose();
            this.$emit("success");
            return;
          }
        })
        .finally(() => {
          this.isSave = false;
        });
    }
  }
};
</script>
