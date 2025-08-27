<template>
  <div class="pure-container">
    <div>
      <el-dialog v-model="visible" width="20%" :close-on-click-modal="false" :close-on-press-escape="false" :destroy-on-close="true" draggable :title="title" @close="close">
        <el-form :model="form">
          <el-row>
            <el-col :span="24">
              <el-form-item label="模板类型" prop="syncType">
                <el-select v-model="form.syncType" placeholder="请选择类型" class="w-full min-w-[240px]">
                  <el-option v-for="item in sysSecretFunctions" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
              </el-form-item>
            </el-col>

            <el-col />
          </el-row>
        </el-form>
        <template #footer>
          <el-button @click="visible = false">取 消</el-button>
          <el-button v-if="mode != 'show'" type="primary" :loading="loading" @click="debounce(handleSubmit(), 1000, true)">保 存</el-button>
        </template>
      </el-dialog>
    </div>
  </div>
</template>

<script>
import { debounce } from "@pureadmin/utils";
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import { transformI18n } from "@repo/config";
import { fetchSmsSync } from "@repo/core";
import { message } from "@repo/utils";
import { defineComponent } from "vue";

export default defineComponent({
  props: {
    sysSecretFunctions: {
      type: Array,
      default: () => [],
    },
  },
  data() {
    return {
      impl: ["SMS"],
      loading: false,
      visible: false,
      form: {
        syncType: null,
      },
      category: [],
      title: "同步",
    };
  },
  mounted() {},
  methods: {
    transformI18n,
    useRenderIcon,
    debounce,

    async handleSubmit() {
      this.loading = true;
      if (this.form.syncType === "SMS") {
        fetchSmsSync(this.form)
          .then((res) => {
            if (res.code == "00000") {
              message("短信模板同步成功", { type: "success" });
              this.visible = false;
            } else {
              message(res.msg, { type: "error" });
            }
          })
          .catch((err) => {
            message(err.msg, { type: "error" });
          })
          .finally(() => {
            this.loading = false;
          });
        return;
      }
      message(`暂不支持${this.form.syncType}模板同步`, { type: "error" });
    },
    close() {
      this.loading = false;
      this.$emit("close");
    },
    setData(data) {
      Object.assign(this.form, data);
      this.form.syncType = null;
      return this;
    },
    open(mode) {
      this.visible = true;
    },
  },
});
</script>

<style scoped>
.pure-container {
  height: 100%;
}

.el-dialog {
  border-radius: 8px;
}

.el-form {
  padding: 20px 0;
}

.el-form-item {
  margin-bottom: 20px;
}

.w-full {
  width: 100%;
}

.min-w-[240px] {
  min-width: 240px;
}
</style>
