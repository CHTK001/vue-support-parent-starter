<script>
import { defineComponent, markRaw } from "vue";
import { fetchSetting, fetchUpdateBatchSetting, fetchSaveSetting } from "@/api/setting";
import { transformI18n } from "@/plugins/i18n";
import Save from "@iconify-icons/ep/refresh";
import Test from "@iconify-icons/ri/account-box-fill";
import { message } from "@/utils/message";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import { queryEmail } from "@/utils/objects";
import TestSmtpLayout from "./testSmtp.vue";
import { fetchListDictItem } from "@/api/dict";

const TestSmtp = markRaw(TestSmtpLayout);
export default defineComponent({
  components: {
    TestSmtp
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
    }
  }
});
</script>
<template>
  <div>
    <test-smtp v-if="testSmtpVisible" ref="testSmtpRef" />
    <div v-if="visible" size="30%" :close-on-click-modal="false" :close-on-press-escape="false" draggable :title="title" @close="close">
      <div v-if="!layoutLoading">
        <el-empty v-if="!groupList || groupList.length == 0" class="h-full" />
        <div v-else>
          <el-form label-width="200px">
            <el-row>
              <el-col class="w-1/2" :lg="12">
                <el-form-item v-for="(item, $index) in groupList" :key="$index" :label="item.sysSettingRemark || item.sysSettingName">
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
                    v-else-if="item.sysSettingValueType == 'Password'"
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
                </el-form-item>
                <el-row class="mt-24" />
                <el-form-item class="justify-start">
                  <el-button v-if="form.group === 'smtp'" class="ml-1" :icon="Save" @click="smtpTest(item)">
                    {{ $t("button.test") }}
                  </el-button>
                  <el-button class="ml-1" :icon="Save" type="primary" @click="submit">
                    {{ $t("button.update") }}
                  </el-button>
                </el-form-item>
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
</style>
