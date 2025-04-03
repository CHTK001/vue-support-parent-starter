<script>
import Save from "@iconify-icons/ri/test-tube-line";
import draggable from "vuedraggable";
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import { queryEmail, transformI18n } from "@repo/config";
import { fetchSetting, fetchUpdateBatchSetting } from "../api";
import { fetchListDictItem } from "@repo/core";
import { deepClean, message } from "@repo/utils";
import { defineComponent, markRaw, onMounted } from "vue";

export default defineComponent({
  components: { draggable },
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
        sysSettingName: [{ required: true, message: "请输入配置名称", trigger: "blur" }],
        sysSettingValue: [{ required: true, message: "请输入配置值", trigger: "blur" }],
        sysSettingValueType: [{ required: true, message: "请输入配置值类型", trigger: "blur" }],
        sysSettingGroup: [{ required: true, message: "请输入配置所属分组", trigger: "blur" }],
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
      Object.assign(this.form, data);
      fetchSetting(data.group)
        .then((res) => {
          this.groupList.push(...res?.data);
        })
        .finally(() => {
          this.layoutLoading = false;
        });
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
      if (!element.sysSettingConfig) {
        return [];
      }
      const { data } = await fetchListDictItem({
        sysDictId: element.sysSettingConfig,
      });
      this.select[element.sysSettingName] = data;
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
      element.sysSettingValue = element.sysSettingValue === "true" ? "false" : "true";
    },
  },
});
</script>
<template>
  <div class="h-full">
    <el-drawer v-model="visible" @close="close" size="50%" :title="form.name">
      <div :close-on-click-modal="false" :close-on-press-escape="false" draggable :title="title" class="h-full" @close="close">
        <div class="h-full">
          <div class="relative h-full">
            <el-form label-width="200px" class="h-full">
              <el-row :gutter="20" class="h-full">
                <el-col class="w-1/2" :lg="12" ref="list">
                  <draggable v-model="groupList" @end="handleChange">
                    <template #item="{ element }">
                      <el-form-item :key="$index" :label="element.sysSettingRemark || element.sysSettingName" class="item !cursor-move">
                        <div v-if="element.sysSettingName" class="w-full">
                          <div v-if="element.sysSettingValueType == 'Boolean'" class="toggle-card" :class="{ 'toggle-active': element.sysSettingValue === 'true', 'toggle-disabled': element.sysSettingAppInner == 1 }" @click="element.sysSettingAppInner != 1 && toggleBooleanValue(element)">
                            <div class="toggle-icon">
                              <i class="el-icon" v-if="element.sysSettingValue === 'true'">
                                <svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" data-v-029747aa="">
                                  <path fill="currentColor" d="M406.656 706.944L195.84 496.256a32 32 0 10-45.248 45.248l256 256 512-512a32 32 0 00-45.248-45.248L406.592 706.944z"></path>
                                </svg>
                              </i>
                              <i class="el-icon" v-else>
                                <svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" data-v-029747aa="">
                                  <path
                                    fill="currentColor"
                                    d="M764.288 214.592L512 466.88 259.712 214.592a31.936 31.936 0 00-45.12 45.12L466.752 512 214.528 764.224a31.936 31.936 0 1045.12 45.184L512 557.184l252.288 252.288a31.936 31.936 0 0045.12-45.12L557.12 512.064l252.288-252.352a31.936 31.936 0 10-45.12-45.184z"
                                  ></path>
                                </svg>
                              </i>
                            </div>
                            <div class="toggle-text">{{ element.sysSettingValue === "true" ? "是" : "否" }}</div>
                          </div>

                          <el-input-number v-else-if="element.sysSettingValueType == 'Number'" v-model="element.sysSettingValue" :disabled="element.sysSettingAppInner == 1" :readonly="element.sysSettingAppInner == 1" inline-prompt />
                          <el-input v-else-if="element.sysSettingValueType == 'Array'" v-model="element.sysSettingValue" :disabled="element.sysSettingAppInner == 1" :readonly="element.sysSettingAppInner == 1" />
                          <el-select v-else-if="element.sysSettingValueType == 'Dict'" v-model="element.sysSettingValue" :remote="true" :remote-method="queryDict(item)" :disabled="element.sysSettingAppInner == 1" :readonly="element.sysSettingAppInner == 1">
                            <el-option v-for="(option, $index) in select[element.sysSettingName]" :key="$index" :label="option.sysDictItemName" :value="option.sysDictItemCode" />
                          </el-select>
                          <el-color-picker v-else-if="element.sysSettingValueType == 'Color'" v-model="element.sysSettingValue" :disabled="element.sysSettingAppInner == 1" :readonly="element.sysSettingAppInner == 1" show-alpha />
                          <el-autocomplete v-else-if="element.sysSettingValueType == 'Mail'" v-model="element.sysSettingValue" :fetch-suggestions="queryEmailMethod" :trigger-on-focus="false" placeholder="请输入邮箱" clearable class="w-full" />
                          <el-input v-else-if="element.sysSettingValueType == 'Password' || element.sysSettingValueType == 'AppSecret'" v-model="element.sysSettingValue" :placeholder="'请输入' + (element.sysSettingRemark || element.sysSettingName)" type="password" show-password="" />
                          <el-input v-else-if="element.sysSettingValueType == 'TextArea'" v-model="element.sysSettingValue" :placeholder="'请输入' + (element.sysSettingRemark || element.sysSettingName)" type="textarea" show-password="" />
                          <el-input v-else v-model="element.sysSettingValue" :placeholder="'请输入' + (element.sysSettingRemark || element.sysSettingName)" :disabled="element.sysSettingAppInner == 1" :readonly="element.sysSettingAppInner == 1" inline-prompt />
                        </div>
                      </el-form-item>
                    </template>
                  </draggable>
                  <el-row class="mt-24" />
                  <el-form-item class="justify-start custom-button">
                    <el-button class="ml-1" :icon="useRenderIcon('ri:save-2-fill')" type="primary" @click="submit">
                      {{ $t("buttons.update") }}
                    </el-button>
                  </el-form-item>
                </el-col>
              </el-row>
            </el-form>
          </div>
        </div>
      </div>
    </el-drawer>
  </div>
</template>
<style lang="scss" scoped>
.h-full {
  display: flex;
  flex-direction: column;
}

.setting {
  flex: 1;
  overflow: hidden;

  li {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 0;
    font-size: 14px;
    transition: all 0.3s ease;

    &:hover {
      background-color: var(--el-fill-color-light);
      border-radius: var(--el-border-radius-base);
      padding-left: 8px;
    }
  }
}

:deep(.custom-button .el-form-item__content) {
  justify-content: end;
}

:deep(.el-form) {
  overflow-y: auto;
  padding-bottom: 20px;
  padding: 20px;
  border-radius: var(--el-border-radius-base);
  background-color: var(--el-bg-color);
}

:deep(.el-form-item) {
  margin-bottom: 20px;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
  }

  .el-form-item__label {
    font-weight: 500;
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

  &.toggle-active {
    background: linear-gradient(135deg, var(--el-color-success-light-8) 0%, var(--el-color-success-light-9) 100%);
    border-color: var(--el-color-success-light-5);

    .toggle-icon {
      background-color: var(--el-color-success);
      color: white;
    }

    .toggle-text {
      color: var(--el-color-success-dark-2);
      font-weight: 600;
    }
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
  background: linear-gradient(to right, var(--el-text-color-primary) 20%, var(--el-color-primary) 40%, var(--el-color-primary) 60%, var(--el-text-color-primary) 80%);
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
