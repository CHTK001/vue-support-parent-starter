<template>
  <el-dialog v-model="visible" :title="title" width="60%" top="5vh" destroy-on-close draggable @close="close"
    class="oss-config-dialog">
    <!-- 表单区域 -->
    <el-form ref="dialogForm" :model="form" :rules="rules" :disabled="mode === 'show'" label-width="120px"
      label-position="left" class="oss-form">
      <!-- 基础配置区域 -->
      <div class="section-header">
        <IconifyIconOnline icon="mdi:cog-outline" />
        <span>基础配置</span>
      </div>
      <el-divider />

      <el-row :gutter="30">
        <el-col :span="12">
          <el-form-item label="应用说明" prop="fileStorageProtocolDesc">
            <el-input v-model="form.fileStorageProtocolDesc" clearable placeholder="请输入应用说明"
              prefix-icon="mdi:text-box-outline" />
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
          <el-form-item label="服务器地址" prop="fileStorageProtocol">
            <el-row :gutter="10">
              <el-col :span="12">
                <el-input v-model="form.fileStorageProtocolHost" placeholder="请输入代理地址" prefix-icon="mdi:server" />
              </el-col>
              <el-col :span="12">
                <el-input v-model="form.fileStorageProtocolPort" type="number" placeholder="请输入代理端口"
                  prefix-icon="mdi:numeric" />
              </el-col>
            </el-row>
          </el-form-item>
        </el-col>
      </el-row>

      <!-- 插件配置区域 -->
      <div class="section-header">
        <IconifyIconOnline icon="mdi:puzzle-outline" />
        <span>插件配置</span>
      </div>
      <el-divider />

      <el-row :gutter="30">
        <el-col :span="12">
          <el-form-item label="开启远程解析" prop="fileStorageProtocolRemoteOpen">
            <el-radio-group v-model="form.fileStorageProtocolRemoteOpen">
              <el-radio-button :label="0" :value="0">关闭</el-radio-button>
              <el-radio-button :label="1" :value="1">开启</el-radio-button>
            </el-radio-group>
          </el-form-item>
        </el-col>

        <el-col :span="12">
          <el-form-item label="开启转化缓存" prop="fileStorageProtocolTransferCacheOpen">
            <el-radio-group v-model="form.fileStorageProtocolTransferCacheOpen">
              <el-radio-button :label="0" :value="0">关闭</el-radio-button>
              <el-radio-button :label="1" :value="1">开启</el-radio-button>
            </el-radio-group>
          </el-form-item>
        </el-col>

        <el-col :span="12">
          <el-form-item label="插件" prop="fileStorageProtocolPlugins">
            <el-select v-model="form.fileStorageProtocolPlugins" placeholder="请选择插件" multiple style="width: 100%"
              collapse-tags collapse-tags-tooltip>
              <el-option v-for="item in options['fileStoragePlugin']" :key="item.name"
                :label="item.describe || item.name" :value="item.name" />
            </el-select>
          </el-form-item>
        </el-col>

        <el-col :span="12">
          <el-form-item label="配置" prop="fileStorageProtocolSetting">
            <el-select v-model="form.fileStorageProtocolSetting" placeholder="请选择配置" multiple style="width: 100%"
              collapse-tags collapse-tags-tooltip>
              <template #default>
                <el-option v-for="item in options['fileStorageSetting']" :key="item.name"
                  :label="item.describe || item.name" :value="item.name">
                  {{ item.describe || item.name }}
                </el-option>
              </template>
              <template #label="{ label }">
                <span v-if="label.describe || label.name"
                  v-copy:click="label.supportedTypes?.join('\r\n') || label.describe || label.name">
                  <el-tooltip :content="label.supportedTypes?.join('\r\n')">
                    {{ label.describe || label.name }}
                  </el-tooltip>
                </span>
              </template>
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <!-- UA配置区域 -->
      <div class="section-header">
        <IconifyIconOnline icon="mdi:account-details-outline" />
        <span>UA配置</span>
      </div>
      <el-divider />

      <el-row :gutter="30">
        <el-col :span="12">
          <el-form-item label="UA配置" prop="fileStorageProtocolUa">
            <el-input v-model="form.fileStorageProtocolUa" style="width: 100%" placeholder="请输入代理UA" type="textarea"
              :rows="3" />
          </el-form-item>
        </el-col>

        <el-col :span="12">
          <el-form-item label="下载UA配置" prop="fileStorageProtocolDownloadUa">
            <el-input v-model="form.fileStorageProtocolDownloadUa" style="width: 100%" placeholder="请输入下载UA"
              type="textarea" :rows="3" />
          </el-form-item>
        </el-col>
      </el-row>

      <!-- 水印配置区域 -->
      <div class="section-header">
        <IconifyIconOnline icon="mdi:watermark" />
        <span>水印配置</span>
      </div>
      <el-divider />

      <el-row :gutter="30">
        <el-col :span="24">
          <el-form-item label="开启水印" prop="fileStorageProtocolWatermarkOpen">
            <el-radio-group v-model="form.fileStorageProtocolWatermarkOpenValue">
              <el-radio-button :label="0" :value="0">关闭</el-radio-button>
              <el-radio-button :label="1" :value="1">开启</el-radio-button>
            </el-radio-group>
          </el-form-item>
        </el-col>
      </el-row>

      <!-- 水印详细配置 - 仅在开启水印时显示 -->
      <transition name="el-zoom-in-top">
        <el-row v-if="form.fileStorageProtocolWatermarkOpenValue != 0" :gutter="30" class="watermark-config">
          <el-col :span="24">
            <el-form-item label="水印方式" prop="fileStorageProtocolWatermarkOpen">
              <el-radio-group v-model="form.fileStorageProtocolWatermarkOpen" class="w-full">
                <el-radio-button :value="1" label="下载水印" />
                <el-radio-button :value="2" label="预览水印" />
                <el-radio-button :value="3" label="预览/下载水印" />
              </el-radio-group>
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="水印坐标" prop="fileStorageProtocolWatermarkX">
              <div class="flex-container">
                <el-input v-model="form.fileStorageProtocolWatermarkX" placeholder="请输入x坐标" type="number"
                  prefix-icon="mdi:axis-x-arrow" />
                <el-input v-model="form.fileStorageProtocolWatermarkY" placeholder="请输入y坐标" type="number"
                  prefix-icon="mdi:axis-y-arrow" />
              </div>
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="水印大小" prop="fileStorageProtocolWatermarkWidth">
              <div class="flex-container">
                <el-input v-model="form.fileStorageProtocolWatermarkWidth" placeholder="请输入宽度" type="number"
                  prefix-icon="mdi:arrow-expand-horizontal" />
                <el-input v-model="form.fileStorageProtocolWatermarkHeight" placeholder="请输入高度" type="number"
                  prefix-icon="mdi:arrow-expand-vertical" />
              </div>
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="水印颜色" prop="fileStorageProtocolWatermarkColor">
              <el-color-picker v-model="form.fileStorageProtocolWatermarkColor" :show-alpha="true"
                class="color-picker" />
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
              <el-input v-model="form.fileStorageProtocolWatermarkContent" style="width: 100%" placeholder="请输入水印内容"
                type="textarea" :rows="3" />
            </el-form-item>
          </el-col>
        </el-row>
      </transition>
    </el-form>

    <!-- 底部按钮区域 -->
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="visible = false">
          <IconifyIconOnline icon="mdi:close" />
          取 消
        </el-button>
        <el-button v-if="mode != 'show'" type="primary" :loading="isSaveing" @click="submit()">
          <IconifyIconOnline icon="mdi:content-save" />
          保 存
        </el-button>
      </div>
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
      // 表单数据
      form: {},
      // 选项数据
      options: {},
      // 表单验证规则
      rules: {
        fileStorageProtocolDesc: [{ required: true, message: "请输入应用说明", trigger: "blur" }],
        fileStorageProtocolHost: [{ required: true, message: "请输入服务器地址", trigger: "blur" }],
        fileStorageProtocolPort: [{ required: true, message: "请输入服务器端口", trigger: "blur" }],
        fileStorageProtocolName: [{ required: true, message: "请选择协议", trigger: "blur" }],
        fileStorageProtocolPreviewOrDownload: [{ required: true, message: "请选择支持功能", trigger: "blur" }]
      }
    };
  },
  methods: {
    /**
     * 关闭对话框并重置表单
     */
    close() {
      this.form = {};
      this.visible = false;
      this.isSaveing = false;
      this.$emit("closed");
    },

    /**
     * 打开对话框
     * @param {string} mode - 对话框模式：add(新增)、edit(编辑)、show(查看)
     */
    open(mode = "add") {
      this.mode = mode;
      this.visible = true;

      if (this.mode === "edit") {
        this.title = "修改" + this.form.fileStorageProtocolDesc;
        this.form.fileStorageProtocolWatermarkOpenValue = this.form.fileStorageProtocolWatermarkOpen > 0 ? 1 : 0;
        return;
      }

      if (this.mode === "add") {
        this.title = "新增服务";
        this.form = {
          fileStorageProtocolHost: "0.0.0.0",
          fileStorageProtocolPort: 8184,
          fileStorageProtocolWatermarkOpenValue: 0,
          fileStorageProtocolName: "HTTP"
        };
      }
    },

    /**
     * 获取选项列表数据
     */
    async afterPrepertiesSetOptions() {
      try {
        const res = await fetchOptionList({ type: "fileStorageSetting,fileStoragePlugin" });
        if (res.code === "00000") {
          this.options = res.data;
        } else {
          this.$message.warning("获取选项列表失败");
        }
      } catch (error) {
        console.error("获取选项列表出错:", error);
        this.$message.error("获取选项列表出错");
      }
    },

    /**
     * 表单提交方法
     */
    submit() {
      this.$refs.dialogForm.validate(async valid => {
        if (valid) {
          // 处理水印开关状态
          if (this.form.fileStorageProtocolWatermarkOpenValue == 0) {
            this.form.fileStorageProtocolWatermarkOpen = 0;
          }

          // 处理多选项，转换为逗号分隔的字符串
          if (this.form.fileStorageProtocolSetting) {
            this.form.fileStorageProtocolSetting = this.form.fileStorageProtocolSetting.join(",");
          }
          if (this.form.fileStorageProtocolPlugins) {
            this.form.fileStorageProtocolPlugins = this.form.fileStorageProtocolPlugins.join(",");
          }

          this.isSaveing = true;
          let res;

          try {
            // 根据模式调用不同的API
            if (this.mode === "add") {
              res = await fetchOssProtocolSave(this.form);
            } else if (this.mode === "edit") {
              res = await fetchOssProtocolUpdate(this.form);
            }

            this.isSaveing = false;

            if (res.code === "00000") {
              this.$message.success(this.mode === "add" ? "添加成功" : "更新成功");
              this.$emit("success", res, this.mode);
              this.visible = false;
            } else {
              this.$message.error(res.msg || "操作失败");
            }
          } catch (error) {
            this.isSaveing = false;
            console.error("提交表单出错:", error);
            this.$message.error("提交表单出错");
          }
        } else {
          this.$message.warning("请完善表单信息");
        }
      });
    },

    /**
     * 表单注入数据
     * @param {Object} data - 要注入的数据对象
     * @returns {Object} - 当前组件实例，用于链式调用
     */
    setData(data) {
      // 合并数据到表单
      Object.assign(this.form, data);

      // 设置默认值
      if (!this.form.fileStorageProtocolWatermarkAlpha) {
        this.form.fileStorageProtocolWatermarkAlpha = 0;
      }

      // 处理字符串转数组
      this.form.fileStorageProtocolSetting = (this.form.fileStorageProtocolSetting || "").split(",").filter(it => it);
      this.form.fileStorageProtocolPlugins = (this.form.fileStorageProtocolPlugins || "").split(",").filter(it => it);

      // 获取选项数据
      this.afterPrepertiesSetOptions();
      return this;
    }
  }
};
</script>

<style scoped>
.oss-config-dialog {
  --el-dialog-padding-primary: 20px;
}

.oss-form {
  padding: 0 10px;
}

.section-header {
  display: flex;
  align-items: center;
  font-size: 16px;
  font-weight: bold;
  margin-top: 20px;
  color: var(--el-color-primary);
}

.section-header i {
  margin-right: 8px;
  font-size: 20px;
}

.flex-container {
  display: flex;
  gap: 10px;
}

.watermark-config {
  background-color: var(--el-fill-color-light);
  padding: 15px;
  border-radius: 8px;
  margin-top: 10px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

.color-picker {
  display: flex;
  align-items: center;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

/* 动画效果 */
.el-zoom-in-top-enter-active,
.el-zoom-in-top-leave-active {
  transition: all 0.3s cubic-bezier(0.55, 0, 0.1, 1);
}

.el-zoom-in-top-enter-from,
.el-zoom-in-top-leave-to {
  opacity: 0;
  transform: scaleY(0);
  transform-origin: center top;
}
</style>
