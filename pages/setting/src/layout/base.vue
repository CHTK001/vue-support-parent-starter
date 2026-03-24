<script>
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import { queryEmail, transformI18n } from "@repo/config";
import { fetchListDictItem } from "@repo/core";
import { message } from "@repo/utils";
import { defineComponent, defineAsyncComponent } from "vue";

const ScInput = defineAsyncComponent(
  () => import("@repo/components/ScInput/index.vue")
);
const draggable = defineAsyncComponent(() => import("vuedraggable"));

import { fetchSetting, fetchUpdateBatchSetting } from "../api";

export default defineComponent({
  components: { draggable, ScInput },
  props: {
    data: {
      type: Object,
      default: () => {},
    },
  },
  data() {
    return {
      form: {},
      valueType: [
        { value: "string", label: "字符串" },
        { value: "number", label: "数字" },
        { value: "bool", label: "布尔" },
        { value: "array", label: "数组" },
        { value: "object", label: "对象" },
        { value: "TextArea", label: "文本" },
      ],
      visible: false,
      testSmtpVisible: false,
      testSmsVisible: false,
      testBigModelVisible: false,
      rules: {
        sysSettingName: [
          { required: true, message: "请输入配置名称", trigger: "blur" },
        ],
        sysSettingValue: [
          { required: true, message: "请输入配置值", trigger: "blur" },
        ],
        sysSettingValueType: [
          { required: true, message: "请输入配置值类型", trigger: "blur" },
        ],
        sysSettingGroup: [
          { required: true, message: "请输入配置所属分组", trigger: "blur" },
        ],
      },
      loading: false,
      layoutLoading: false,
      title: "",
      Save: null,
      mode: "save",
      groupList: [],
      select: {},
    };
  },
  methods: {
    async close() {
      this.visible = false;
      this.loading = false;
      this.layoutLoading = false;
      this.form = {};
      this.groupList.length = 0;
      this.$emit("close");
    },
    setData(data) {
      this.close();
      this.layoutLoading = true;

      // 数据验证
      if (!data || !data.group) {
        console.error("setData: 无效的数据参数", data);
        this.layoutLoading = false;
        message("配置数据无效", { type: "error" });
        return this;
      }

      Object.assign(this.form, data);

      // 添加延迟以避免阻塞UI
      setTimeout(() => {
        fetchSetting(data.group)
          .then((res) => {
            if (res && res.data) {
              const filteredData = res.data.filter(
                (it) => it.sysSettingGroup === data.group
              );
              this.groupList.push(...filteredData);

              // 如果没有获取到任何配置项，显示提示
              if (filteredData.length === 0) {
                console.warn("未获取到配置项:", data.group);
                message("该分组暂无配置项", { type: "warning" });
              }
            } else {
              console.error("fetchSetting返回数据格式异常:", res);
              message("获取配置失败，数据格式异常", { type: "error" });
            }
          })
          .catch((error) => {
            console.error("获取配置失败:", error);
            message("获取配置失败，请检查网络连接", { type: "error" });
          })
          .finally(() => {
            this.layoutLoading = false;
          });
      }, 0);

      return this;
    },
    queryEmailMethod(queryString, callback) {
      queryEmail(queryString, callback);
    },
    async open(mode = "save") {
      this.visible = true;
      this.mode = mode;
      this.title = this.form.name;
    },
    async smtpBigModel(item) {
      this.testBigModelVisible = !this.testBigModelVisible;
      this.$nextTick(() => {
        this.$refs.testBigModelRef?.setData(item)?.open();
      });
    },
    async smtpSms(item) {
      this.testSmsVisible = true;
      this.$nextTick(() => {
        this.$refs.testSmsRef.setData(item).open();
      });
    },
    async smtpTest(item) {
      this.testSmtpVisible = true;
      this.$nextTick(() => {
        this.$refs.testSmtpRef.setData(item).open();
      });
    },
    async queryDict(item) {
      // 修复element未定义的问题
      if (!item.sysSettingConfig) {
        return [];
      }
      const { data } = await fetchListDictItem({
        sysDictId: item.sysSettingConfig,
      });
      this.select[item.sysSettingName] = data;
      return data;
    },
    async submit() {
      this.loading = true;
      var res = await fetchUpdateBatchSetting(this.groupList);
      if (res.code == "00000") {
        this.$emit("success", this.groupList, this.mode);
        message(transformI18n("message.updateSuccess"), { type: "success" });
      } else {
        message(res.msg, { type: "error" });
      }
      this.loading = false;
    },
    useRenderIcon,
    async handleChange() {
      for (let index = 0; index < this.groupList.length; index++) {
        this.groupList[index].sysSettingSort = index;
      }
    },
    toggleBooleanValue(element) {
      element.sysSettingValue =
        element.sysSettingValue === "true" ? "false" : "true";
    },
  },
});
</script>
<template>
  <div class="h-full">
    <sc-drawer
      v-model="visible"
      @close="close"
      size="50%"
      :title="form.name"
      :append-to-body="true"
      :z-index="2000"
      :destroy-on-close="true"
      class="setting-drawer"
    >
      <div
        :close-on-click-modal="false"
        :close-on-press-escape="false"
        draggable
        :title="title"
        class="h-full"
        @close="close"
      >
        <div class="h-full">
          <div class="relative h-full">
            <ScForm label-width="200px" class="h-full thin-scrollbar">
              <ScRow :gutter="20" class="h-full">
                <ScCol class="w-2/3" :lg="16" ref="list">
                  <!-- 加载状态 -->
                  <div v-if="layoutLoading" class="loading-container">
                    <el-skeleton :rows="5" animated />
                  </div>

                  <!-- 空状态 -->
                  <div
                    v-else-if="!layoutLoading && groupList.length === 0"
                    class="empty-container"
                  >
                    <ScEmpty description="该分组暂无配置项">
                      <ScButton type="primary" @click="close">返回</ScButton>
                    </ScEmpty>
                  </div>

                  <!-- 配置项列表 -->
                  <draggable v-else v-model="groupList" @end="handleChange">
                    <template #item="{ element }">
                      <ScFormItem 
                        :key="$index"
                        :label="
                          element.sysSettingRemark || element.sysSettingName
                        "
                        class="item !cursor-move"
                      >
                        <div v-if="element.sysSettingName" class="w-full">
                          <sc-input
                            v-if="element.sysSettingValueType == 'Boolean'"
                            v-model="element.sysSettingValue"
                            type="boolean"
                            :disabled="element.sysSettingAppInner == 1"
                            :readonly="element.sysSettingAppInner == 1"
                          />

                          <sc-input
                            v-else-if="element.sysSettingValueType == 'Number'"
                            v-model="element.sysSettingValue"
                            type="number"
                            :disabled="element.sysSettingAppInner == 1"
                            :readonly="element.sysSettingAppInner == 1"
                          />
                          <sc-input
                            v-else-if="element.sysSettingValueType == 'Array'"
                            v-model="element.sysSettingValue"
                            type="array"
                            :disabled="element.sysSettingAppInner == 1"
                            :readonly="element.sysSettingAppInner == 1"
                          />
                          <sc-input
                            v-else-if="element.sysSettingValueType == 'List'"
                            v-model="element.sysSettingValue"
                            type="list"
                            :disabled="element.sysSettingAppInner == 1"
                            :readonly="element.sysSettingAppInner == 1"
                          />
                          <sc-input
                            v-else-if="element.sysSettingValueType == 'Dict'"
                            v-model="element.sysSettingValue"
                            type="dict"
                            :options="select[element.sysSettingName]"
                            :disabled="element.sysSettingAppInner == 1"
                            :readonly="element.sysSettingAppInner == 1"
                          />
                          <sc-input
                            v-else-if="element.sysSettingValueType == 'Color'"
                            v-model="element.sysSettingValue"
                            type="color"
                            :disabled="element.sysSettingAppInner == 1"
                            :readonly="element.sysSettingAppInner == 1"
                          />
                          <sc-input
                            v-else-if="element.sysSettingValueType == 'Mail'"
                            v-model="element.sysSettingValue"
                            type="email"
                            placeholder="请输入邮箱"
                            :disabled="element.sysSettingAppInner == 1"
                            :readonly="element.sysSettingAppInner == 1"
                          />
                          <sc-input
                            v-else-if="
                              element.sysSettingValueType == 'Password' ||
                              element.sysSettingValueType == 'AppSecret'
                            "
                            v-model="element.sysSettingValue"
                            type="password"
                            :placeholder="
                              '请输入' +
                              (element.sysSettingRemark ||
                                element.sysSettingName)
                            "
                            :disabled="element.sysSettingAppInner == 1"
                            :readonly="element.sysSettingAppInner == 1"
                          />
                          <sc-input
                            v-else-if="
                              element.sysSettingValueType == 'TextArea'
                            "
                            v-model="element.sysSettingValue"
                            type="textarea"
                            :placeholder="
                              '请输入' +
                              (element.sysSettingRemark ||
                                element.sysSettingName)
                            "
                            :disabled="element.sysSettingAppInner == 1"
                            :readonly="element.sysSettingAppInner == 1"
                          />
                          <sc-input
                            v-else
                            v-model="element.sysSettingValue"
                            type="text"
                            :placeholder="
                              '请输入' +
                              (element.sysSettingRemark ||
                                element.sysSettingName)
                            "
                            :disabled="element.sysSettingAppInner == 1"
                            :readonly="element.sysSettingAppInner == 1"
                          />
                        </div>
                      </ScFormItem>
                    </template>
                  </draggable>
                  <ScRow class="mt-24" />
                  <ScFormItem class="justify-start custom-button">
                    <ScButton 
                      class="ml-1"
                      :icon="useRenderIcon('ri:save-2-fill')"
                      type="primary"
                      @click="submit"
                    >
                      {{ $t("buttons.update") }}
                    </ScButton>
                  </ScFormItem>
                </ScCol>
              </ScRow>
            </ScForm>
          </div>
        </div>
      </div>
    </sc-drawer>
  </div>
</template>
<style lang="scss" scoped>
.h-full {
  display: flex;
  flex-direction: column;
}

// Drawer 美化样式
:deep(.el-drawer) {
  .el-drawer__header {
    background: linear-gradient(
      135deg,
      var(--el-color-primary-light-9) 0%,
      var(--el-bg-color-overlay) 100%
    );
    border-bottom: 1px solid var(--el-border-color-lighter);
    padding: 20px 24px;
    margin: 0;

    .el-drawer__title {
      font-size: 18px;
      font-weight: 700;
      color: var(--el-text-color-primary);
    }

    .el-drawer__close-btn {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      transition: all 0.3s ease;

      &:hover {
        background: var(--el-color-primary-light-9);
        color: var(--el-color-primary);
      }
    }
  }

  .el-drawer__body {
    padding: 0;
    background: linear-gradient(
      180deg,
      var(--el-bg-color) 0%,
      var(--el-fill-color-lighter) 100%
    );
  }
}

// 添加drawer样式，确保初始渲染时不可见
.setting-drawer {
  visibility: hidden;

  &.el-drawer__open {
    visibility: visible;
  }
}

.setting {
  flex: 1;
  overflow: hidden;

  li {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    font-size: 14px;
    transition: all 0.3s ease;
    border-radius: 10px;
    margin-bottom: 8px;

    &:hover {
      background: linear-gradient(
        135deg,
        var(--el-color-primary-light-9) 0%,
        var(--el-fill-color-light) 100%
      );
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
      transform: translateX(4px);
    }
  }
}

:deep(.custom-button .el-form-item__content) {
  justify-content: end;
}

:deep(.el-form) {
  overflow-y: auto;
  padding: 24px;
  border-radius: 16px;
  background: var(--el-bg-color);
}

:deep(.el-form-item) {
  margin-bottom: 20px;
  padding: 16px 20px;
  background: var(--el-bg-color-overlay);
  border-radius: 12px;
  border: 1px solid var(--el-border-color-lighter);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);
    border-color: var(--el-color-primary-light-7);
  }

  .el-form-item__label {
    font-weight: 600;
    color: var(--el-text-color-primary);
    position: relative;
    padding-left: 12px;

    &::before {
      content: "";
      position: absolute;
      left: 0;
      top: 50%;
      transform: translateY(-50%);
      width: 3px;
      height: 14px;
      background: linear-gradient(
        180deg,
        var(--el-color-primary) 0%,
        var(--el-color-primary-light-3) 100%
      );
      border-radius: 2px;
    }
  }
}

:deep(.item) {
  padding: 12px;
  border-radius: var(--el-border-radius-base);
  transition: all 0.3s ease;

  &:hover {
    background-color: var(--el-fill-color-light);
    box-shadow: var(--el-box-shadow-light);
  }
}

.loading-container {
  padding: 20px;
  min-height: 200px;
}

.empty-container {
  padding: 40px 20px;
  text-align: center;
  min-height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
}

:deep(.el-button) {
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
  }
}

:deep(.el-input),
:deep(.el-select),
:deep(.el-input-number),
:deep(.el-autocomplete) {
  .el-input__wrapper {
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
    transition: all 0.3s ease;

    &:hover,
    &:focus-within {
      box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1);
    }
  }
}

:deep(.el-color-picker) {
  transition: all 0.3s ease;

  &:hover {
    transform: scale(1.05);
  }
}

.toggle-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-radius: 16px;
  background: var(--el-bg-color-overlay);
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.05),
    0 2px 4px -1px rgba(0, 0, 0, 0.02);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover:not(.toggle-disabled) {
    transform: translateY(-2px);
    box-shadow:
      0 10px 15px -3px rgba(0, 0, 0, 0.1),
      0 4px 6px -2px rgba(0, 0, 0, 0.05);
  }

  &:not(.toggle-active) {
    .toggle-icon {
      background-color: var(--el-color-danger-light-7);
      color: var(--el-color-danger);
    }

    .toggle-text {
      color: var(--el-text-color-secondary);
    }
  }

  &.toggle-disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .toggle-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    transition: all 0.3s ease;

    i {
      font-size: 18px;
    }
  }

  .toggle-text {
    font-size: 15px;
    font-weight: 500;
    transition: all 0.3s ease;
  }
}

.modern-setting-container {
  background: rgba(var(--el-bg-color-rgb), 0.8);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(var(--el-border-color-rgb), 0.1);
}

:deep(.el-form) {
  --form-gap: 1.5rem;
  display: grid;
  gap: var(--form-gap);
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));

  .el-form-item {
    margin: 0;
    padding: calc(var(--form-gap) / 2);
    background: var(--el-bg-color-overlay);
    border-radius: 12px;
    transition: all 0.2s ease;

    &:hover {
      background: var(--el-fill-color-light);
    }
  }
}

.setting-header {
  .header-title {
    font-family: "Inter Variable", system-ui;
    font-weight: 600;
    letter-spacing: -0.025em;
  }
}

.toggle-text {
  background: linear-gradient(
    to right,
    var(--el-text-color-primary) 20%,
    var(--el-color-primary) 40%,
    var(--el-color-primary) 60%,
    var(--el-text-color-primary) 80%
  );
  background-size: 200% auto;
  background-clip: text;
  -webkit-background-clip: text;
  color: transparent;
  animation: textShine 3s linear infinite;
}

@keyframes textShine {
  to {
    background-position: 200% center;
  }
}
</style>
