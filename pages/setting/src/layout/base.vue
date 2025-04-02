<script>
import Save from "@iconify-icons/ri/test-tube-line";
import draggable from "vuedraggable";
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import { queryEmail, transformI18n } from "@repo/config";
import { fetchSetting, fetchUpdateBatchSetting } from "../api";
import { fetchListDictItem } from "@repo/core";
import { message } from "@repo/utils";
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
  },
});
</script>
<template>
  <div class="h-full">
    <div size="30%" :close-on-click-modal="false" :close-on-press-escape="false" draggable :title="title" class="h-full" @close="close">
      <div class="h-full">
        <div class="relative h-full">
          <el-form label-width="200px" class="h-full">
            <el-row :gutter="20" class="h-full">
              <el-col class="w-1/2" :lg="12" ref="list">
                <draggable v-model="groupList" @end="handleChange">
                  <template #item="{ element }">
                    <el-form-item :key="$index" :label="element.sysSettingRemark || element.sysSettingName" class="item !cursor-move">
                      <div v-if="element.sysSettingName" class="w-full">
                        <!-- <el-switch v-if="element.sysSettingValueType == 'bool'" v-model="element.sysSettingValue" active-value="true" inactive-value="false" inline-prompt /> -->
                        <el-segmented
                          v-if="element.sysSettingValueType == 'Boolean'"
                          v-model="element.sysSettingValue"
                          :disabled="element.sysSettingAppInner == 1"
                          :readonly="element.sysSettingAppInner == 1"
                          :options="[
                            { label: '是', value: 'true' },
                            { label: '否', value: 'false' },
                          ]"
                        />
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
