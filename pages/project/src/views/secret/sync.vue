<template>
  <div class="pure-container">
    <div>
      <sc-dialog
        v-model="visible"
        width="20%"
        :close-on-click-modal="false"
        :close-on-press-escape="false"
        :destroy-on-close="true"
        draggable
        :title="title"
        @close="close"
      >
        <ScForm :model="form">
          <ScRow>
            <ScCol :span="24">
              <ScFormItem label="模板类型" prop="syncType">
                <ScSelect 
                  v-model="form.syncType"
                  placeholder="请选择类型"
                  class="w-full min-w-[240px]"
                >
                  <ScOption 
                    v-for="item in sysSecretFunctions"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  />
                </ScSelect>
              </ScFormItem>
            </ScCol>

            <ScCol />
          </ScRow>
        </ScForm>
        <template #footer>
          <ScButton @click="visible = false">取 消</ScButton>
          <ScButton 
            v-if="mode != 'show'"
            type="primary"
            :loading="loading"
            @click="debounce(handleSubmit(), 1000, true)"
            >保 存</el-button
          >
        </template>
      </sc-dialog>
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

<style scoped lang="scss">
.pure-container {
  height: 100%;
}

:deep(.el-dialog) {
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);

  .el-dialog__header {
    padding: 20px 24px;
    margin: 0;
    background: linear-gradient(
      135deg,
      var(--el-color-primary-light-9) 0%,
      var(--el-bg-color-overlay) 100%
    );
    border-bottom: 1px solid var(--el-border-color-lighter);

    .el-dialog__title {
      font-size: 18px;
      font-weight: 700;
      color: var(--el-text-color-primary);
    }

    .el-dialog__headerbtn {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      transition: all 0.3s ease;

      &:hover {
        background: var(--el-color-primary-light-9);
      }
    }
  }

  .el-dialog__body {
    padding: 28px;
    background: var(--el-bg-color);
  }

  .el-dialog__footer {
    padding: 16px 24px;
    border-top: 1px solid var(--el-border-color-lighter);
    background: var(--el-bg-color-overlay);
  }
}

:deep(.el-form) {
  padding: 0;
}

:deep(.el-form-item) {
  margin-bottom: 20px;
  padding: 16px 20px;
  background: var(--el-bg-color-overlay);
  border-radius: 12px;
  border: 1px solid var(--el-border-color-lighter);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    border-color: var(--el-color-primary-light-5);
    box-shadow: 0 4px 16px rgba(var(--el-color-primary-rgb), 0.1);
  }

  .el-form-item__label {
    font-weight: 600;
    color: var(--el-text-color-primary);
  }
}

:deep(.el-select__wrapper) {
  border-radius: 10px;
  transition: all 0.3s ease;

  &:hover,
  &:focus-within {
    box-shadow: 0 4px 12px rgba(var(--el-color-primary-rgb), 0.12);
  }
}

:deep(.el-button) {
  border-radius: 10px;
  font-weight: 600;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    transform: translateY(-2px);
  }

  &.el-button--primary:hover {
    box-shadow: 0 6px 20px rgba(var(--el-color-primary-rgb), 0.35);
  }
}

.w-full {
  width: 100%;
}

.min-w-\[240px\] {
  min-width: 240px;
}
</style>
