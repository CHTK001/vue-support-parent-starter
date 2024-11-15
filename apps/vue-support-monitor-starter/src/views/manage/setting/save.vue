<script>
import { fetchListDictItem } from "@/api/dict";
import { fetchSetting, fetchUpdateBatchSetting } from "@/api/setting";
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import { transformI18n } from "@/plugins/i18n";
import { message } from "@repo/utils/message";
import { queryEmail } from "@repo/utils/objects";
import Save from "@iconify-icons/ri/test-tube-line";
import { defineComponent, markRaw } from "vue";
import TestBigModeLayout from "./bigMode.vue";
import TestSmsLayout from "./testSms.vue";
import TestSmtpLayout from "./testSmtp.vue";

const TestSmtp = markRaw(TestSmtpLayout);
const TestSms = markRaw(TestSmsLayout);
const BigModel = markRaw(TestBigModeLayout);
export default defineComponent({
  components: {
    TestSmtp,
    TestSms,
    BigModel
  },
  props: {
    data: {
      type: Object,
      default: () => {}
    }
  },
  data() {
    return {
      form: {},
      valueType: [
        { value: "string", label: "字符串" },
        { value: "number", label: "数字" },
        { value: "bool", label: "布尔" },
        { value: "array", label: "数组" },
        { value: "object", label: "对象" }
      ],
      visible: false,
      testSmtpVisible: false,
      testSmsVisible: false,
      testBigModelVisible: false,
      rules: {
        sysSettingName: [{ required: true, message: "请输入配置名称", trigger: "blur" }],
        sysSettingValue: [{ required: true, message: "请输入配置值", trigger: "blur" }],
        sysSettingValueType: [{ required: true, message: "请输入配置值类型", trigger: "blur" }],
        sysSettingGroup: [{ required: true, message: "请输入配置所属分组", trigger: "blur" }]
      },
      loading: false,
      layoutLoading: false,
      title: "",
      Save: null,
      mode: "save",
      groupList: [],
      select: {}
    };
  },
  mounted() {
    this.Save = useRenderIcon(markRaw(Save));
    this.form = this.data;
    this.setData(this.data);
    this.open("edit");
  },
  methods: {
    async close() {
      this.visible = false;
      this.loading = false;
      this.layoutLoading = false;
      this.groupList.length = 0;
      this.$emit("close");
    },
    setData(data) {
      this.layoutLoading = true;
      Object.assign(this.form, data);
      fetchSetting(data.group)
        .then(res => {
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
      if (!item.sysSettingConfig) {
        return [];
      }
      const { data } = await fetchListDictItem({
        sysDictId: item.sysSettingConfig
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
    useRenderIcon
  }
});
</script>
<template>
  <div class="h-full">
    <test-smtp v-if="testSmtpVisible" ref="testSmtpRef" />
    <test-sms v-if="testSmsVisible" ref="testSmsRef" />
    <div v-if="visible" size="30%" :close-on-click-modal="false" :close-on-press-escape="false" draggable :title="title" class="h-full" @close="close">
      <div v-if="!layoutLoading" class="h-full">
        <el-empty v-if="!groupList || groupList.length == 0" class="h-full" />
        <div v-else class="relative h-full">
          <el-form label-width="200px" class="h-full">
            <el-row :gutter="20" class="h-full">
              <el-col class="w-1/2" :lg="12">
                <el-form-item v-for="(item, $index) in groupList" :key="$index" :label="item.sysSettingRemark || item.sysSettingName">
                  <div v-if="item.sysSettingName" class="w-full">
                    <!-- <el-switch v-if="item.sysSettingValueType == 'bool'" v-model="item.sysSettingValue" active-value="true" inactive-value="false" inline-prompt /> -->
                    <el-segmented
                      v-if="item.sysSettingValueType == 'Boolean'"
                      v-model="item.sysSettingValue"
                      :disabled="item.sysSettingAppInner == 1"
                      :readonly="item.sysSettingAppInner == 1"
                      :options="[
                        { label: '是', value: 'true' },
                        { label: '否', value: 'false' }
                      ]"
                    />
                    <el-input-number
                      v-else-if="item.sysSettingValueType == 'Number'"
                      v-model="item.sysSettingValue"
                      :disabled="item.sysSettingAppInner == 1"
                      :readonly="item.sysSettingAppInner == 1"
                      inline-prompt
                    />
                    <el-input v-else-if="item.sysSettingValueType == 'Array'" v-model="item.sysSettingValue" :disabled="item.sysSettingAppInner == 1" :readonly="item.sysSettingAppInner == 1" />
                    <el-select
                      v-else-if="item.sysSettingValueType == 'Dict'"
                      v-model="item.sysSettingValue"
                      :remote="true"
                      :remote-method="queryDict(item)"
                      :disabled="item.sysSettingAppInner == 1"
                      :readonly="item.sysSettingAppInner == 1"
                    >
                      <el-option v-for="(option, $index) in select[item.sysSettingName]" :key="$index" :label="option.sysDictItemName" :value="option.sysDictItemCode" />
                    </el-select>
                    <el-color-picker
                      v-else-if="item.sysSettingValueType == 'Color'"
                      v-model="item.sysSettingValue"
                      :disabled="item.sysSettingAppInner == 1"
                      :readonly="item.sysSettingAppInner == 1"
                      show-alpha
                    />
                    <el-autocomplete
                      v-else-if="item.sysSettingValueType == 'Mail'"
                      v-model="item.sysSettingValue"
                      :fetch-suggestions="queryEmailMethod"
                      :trigger-on-focus="false"
                      placeholder="请输入邮箱"
                      clearable
                      class="w-full"
                    />
                    <el-input
                      v-else-if="item.sysSettingValueType == 'Password' || item.sysSettingValueType == 'AppSecret'"
                      v-model="item.sysSettingValue"
                      :placeholder="'请输入' + (item.sysSettingRemark || item.sysSettingName)"
                      type="password"
                      show-password=""
                    />
                    <el-input
                      v-else
                      v-model="item.sysSettingValue"
                      :placeholder="'请输入' + (item.sysSettingRemark || item.sysSettingName)"
                      :disabled="item.sysSettingAppInner == 1"
                      :readonly="item.sysSettingAppInner == 1"
                      inline-prompt
                    />
                  </div>
                </el-form-item>
                <el-row class="mt-24" />
                <el-form-item class="justify-start custom-button">
                  <el-button class="ml-1" :icon="useRenderIcon('ri:save-2-fill')" type="primary" @click="submit">
                    {{ $t("buttons.update") }}
                  </el-button>
                </el-form-item>
                <el-button v-if="form.group === 'smtp'" :title="$t('buttons.test')" circle class="absolute left-[10px] top-0 ml-1" :icon="Save" @click="smtpTest(item)" />
                <el-button v-if="form.group === 'sms'" :title="$t('buttons.test')" circle class="absolute left-[10px] top-0 ml-1" :icon="Save" @click="smtpSms(groupList)" />
                <el-button v-if="form.group === 'llm'" :title="$t('buttons.test')" circle class="absolute left-[10px] top-0 ml-1" :icon="Save" @click="smtpBigModel(groupList)" />
              </el-col>
              <el-col class="w-1/2" :lg="12">
                <big-model v-if="testBigModelVisible" ref="testBigModelRef" />
              </el-col>
            </el-row>
          </el-form>
        </div>
      </div>
      <el-skeleton v-else animated />
    </div>
  </div>
</template>
<style lang="scss" scoped>
.setting {
  li {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 3px 0;
    font-size: 14px;
  }
}
:deep(.custom-button .el-form-item__content) {
  justify-content: end;
}
</style>
