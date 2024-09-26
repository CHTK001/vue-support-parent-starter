<template>
  <el-dialog v-model="visible" :title="title" width="50%" top="10px" destroy-on-close draggable @close="close">
    <el-form ref="dialogForm" :model="form" :rules="rules" :disabled="mode == 'show'" label-width="100px" label-position="left">
      <el-row>
        <el-col :span="12">
          <el-form-item label="应用说明" prop="fileStorageProtocolDesc">
            <el-input v-model="form.fileStorageProtocolDesc" clearable placeholder="请输入应用说明" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="服务器地址" prop="fileStorageProtocol" style="width: 100%">
            <el-row>
              <el-col :span="12" prop="fileStorageProtocolHost">
                <el-input v-model="form.fileStorageProtocolHost" placeholder="请输入代理地址" />
              </el-col>
              <el-col :span="12" prop="fileStorageProtocolPort">
                <el-input v-model="form.fileStorageProtocolPort" type="number" placeholder="请输入代理端口" />
              </el-col>
            </el-row>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="支持功能" prop="fileStorageProtocolPreviewOrDownload">
            <el-radio-group v-model="form.fileStorageProtocolPreviewOrDownload">
              <el-radio-button :label="0" :value="0">预览/下载</el-radio-button>
              <el-radio-button :label="1" :value="1">预览</el-radio-button>
              <el-radio-button :label="2" :value="2">下载</el-radio-button>
            </el-radio-group>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="协议" prop="fileStorageProtocolName">
            <el-select v-model="form.fileStorageProtocolName" placeholder="请选择协议" style="width: 100%">
              <el-option label="HTTP" value="HTTP" />
            </el-select>
          </el-form-item>
        </el-col>

        <el-col :span="12">
          <el-form-item label="插件" prop="fileStorageProtocolPlugins">
            <el-select v-model="form.fileStorageProtocolPlugins" placeholder="请选择协议" multiple style="width: 100%">
              <el-option v-for="item in options['fileStoragePlugin']" :key="item" :label="item.describe || item.name" :value="item.name" />
            </el-select>
          </el-form-item>
        </el-col>

        <el-col :span="12">
          <el-form-item label="配置" prop="fileStorageProtocolSetting">
            <el-select v-model="form.fileStorageProtocolSetting" placeholder="请选择协议" multiple style="width: 100%">
              <template #default>
                <el-option v-for="item in options['fileStorageSetting']" :key="item" :label="item" :value="item.name">
                  {{ item.describe || item.name }}
                </el-option>
              </template>
              <template #label="{ label }">
                <span v-if="label.describe || label.name" v-copy:click="label.supportedTypes?.join('\r\n') || label.describe || label.name">
                  <el-tooltip :content="label.supportedTypes?.join('\r\n')">
                    {{ label.describe || label.name }}
                  </el-tooltip>
                </span>
              </template>
            </el-select>
          </el-form-item>
        </el-col>

        <el-col :span="12">
          <el-form-item label="UA配置" prop="fileStorageProtocolUa">
            <el-input v-model="form.fileStorageProtocolUa" style="width: 100%" placeholder="请输入代理UA" type="textarea" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="下载UA配置" prop="fileStorageProtocolDownloadUa">
            <el-input v-model="form.fileStorageProtocolDownloadUa" style="width: 100%" placeholder="请输入下载UA" type="textarea" />
          </el-form-item>
        </el-col>

        <el-col :span="12">
          <el-form-item label="水印坐标" prop="fileStorageProtocolWatermarkX">
            <div class="flex flex-1 justify-between gap-2">
              <el-input v-model="form.fileStorageProtocolWatermarkX" style="width: 100%" placeholder="请输入x" type="number" />
              <el-input v-model="form.fileStorageProtocolWatermarkY" style="width: 100%" placeholder="请输入y" type="number" />
            </div>
          </el-form-item>
        </el-col>

        <el-col :span="12">
          <el-form-item label="水印大小" prop="fileStorageProtocolWatermarkX">
            <div class="flex flex-1 justify-between gap-2">
              <el-input v-model="form.fileStorageProtocolWatermarkWidth" style="width: 100%" placeholder="请输入宽度" type="number" />
              <el-input v-model="form.fileStorageProtocolWatermarkHeight" style="width: 100%" placeholder="请输入高度" type="number" />
            </div>
          </el-form-item>
        </el-col>

        <el-col :span="12">
          <el-form-item label="水印颜色" prop="fileStorageProtocolWatermarkColor">
            <el-color-picker v-model="form.fileStorageProtocolWatermarkColor" :show-alpha="true" />
          </el-form-item>
        </el-col>

        <el-col :span="12">
          <el-form-item label="水印透明度" prop="fileStorageProtocolWatermarkAlpha">
            <el-slider v-model="form.fileStorageProtocolWatermarkAlpha" :min="0" :max="100" />
          </el-form-item>
        </el-col>

        <el-col :span="12">
          <el-form-item label="水印放置方式" prop="fileStorageProtocolWatermarkWay">
            <el-select v-model="form.fileStorageProtocolWatermarkWay" style="width: 100%" placeholder="请选择水印放置方式">
              <el-option value="NORMAL" label="正常" />
              <el-option value="TILE" label="平铺" />
            </el-select>
          </el-form-item>
        </el-col>

        <el-col :span="12">
          <el-form-item label="水印内容" prop="fileStorageProtocolWatermarkContent">
            <el-input v-model="form.fileStorageProtocolWatermarkContent" style="width: 100%" placeholder="请输入水印内容" type="textarea" />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>

    <template #footer>
      <el-button @click="visible = false">取 消</el-button>
      <el-button v-if="mode != 'show'" type="primary" :loading="isSaveing" @click="submit()">保 存</el-button>
    </template>
  </el-dialog>
</template>

<script>
import { fetchOssProtocolSave, fetchOssProtocolUpdate } from "@/api/monitor/oss";
import { fetchOptionList } from "@/api/spi";

export default {
  emits: ["success", "closed"],
  data() {
    return {
      visible: false,
      isSaveing: false,
      title: "",
      mode: "",
      //表单数据
      form: {},
      options: {},
      rules: {
        fileStorageProtocolDesc: [{ required: true, message: "请输入应用说明", trigger: "blur" }],
        fileStorageProtocolHost: [{ required: true, message: "请输入服务器地址", trigger: "blur" }],
        fileStorageProtocolPort: [{ required: true, message: "请输入服务器端口", trigger: "blur" }],
        fileStorageProtocolName: [{ required: true, message: "请选择协议", trigger: "blur" }],
        fileStorageProtocolPreviewOrDownload: [{ required: true, message: "请选择支持功能", trigger: "blur" }]
      }
    };
  },
  mounted() { },
  methods: {
    close() {
      this.form = {};
      this.visible = false;
      this.isSaveing = false;
    },
    //显示
    open(mode = "add") {
      this.mode = mode;
      this.visible = true;
      if (this.mode == "edit") {
        this.title = "修改" + this.form.fileStorageProtocolDesc;
        return;
      }

      if (this.mode == "add") {
        this.title = "新增服务";
        this.form = {};
        this.form.fileStorageProtocolHost = "0.0.0.0";
        this.form.fileStorageProtocolPort = 8184;
        this.form.fileStorageProtocolName = "HTTP";
      }
    },
    async afterPrepertiesSetOptions() {
      const res = await fetchOptionList({ type: "fileStorageSetting,fileStoragePlugin" });
      if (res.code === "00000") {
        this.options = res.data;
      }
    },
    //表单提交方法
    submit() {
      this.$refs.dialogForm.validate(async valid => {
        if (valid) {
          var res;
          if (this.form.fileStorageProtocolSetting) {
            this.form.fileStorageProtocolSetting = this.form.fileStorageProtocolSetting.join(",");
          }
          if (this.form.fileStorageProtocolPlugins) {
            this.form.fileStorageProtocolPlugins = this.form.fileStorageProtocolPlugins.join(",");
          }
          this.isSaveing = true;
          if (this.mode === "add") {
            res = await fetchOssProtocolSave(this.form);
          } else if (this.mode === "edit") {
            res = await fetchOssProtocolUpdate(this.form);
          }

          this.isSaveing = false;
          if (res.code == "00000") {
            this.$emit("success", res, this.mode);
            this.visible = false;
          } else {
            this.$message.error(res.msg);
          }
        }
      });
    },
    //表单注入数据
    setData(data) {
      //可以和上面一样单个注入，也可以像下面一样直接合并进去
      Object.assign(this.form, data);
      if (!this.form.fileStorageProtocolWatermarkAlpha) {
        this.form.fileStorageProtocolWatermarkAlpha = 0;
      }
      this.form.fileStorageProtocolSetting = (this.form.fileStorageProtocolSetting || "").split(",").filter(it => it);
      this.form.fileStorageProtocolPlugins = (this.form.fileStorageProtocolPlugins || "").split(",").filter(it => it);
      this.afterPrepertiesSetOptions();
      return this;
    }
  }
};
</script>

<style></style>
