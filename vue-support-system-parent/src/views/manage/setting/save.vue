<script>
import { defineComponent } from "vue";
import { fetchSetting, fetchUpdateBatchSetting, fetchSaveSetting } from "@/api/setting";
import { transformI18n } from "@/plugins/i18n";
import Save from "@iconify-icons/ep/refresh";
import { message } from "@/utils/message";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
export default defineComponent({
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
      groupList: []
    };
  },
  mounted() {
    this.Save = useRenderIcon(Save);
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
    transformI18nValue(val) {
      return transformI18n(val);
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
    async open(mode = "save") {
      this.visible = true;
      this.mode = mode;
      this.title = this.form.name;
    },
    async submit() {
      this.loading = true;
      var res = await fetchUpdateBatchSetting(this.groupList);
      if (res.code == "00000") {
        this.$emit("success", item, this.mode);
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
                    v-if="item.sysSettingValueType == 'bool'"
                    v-model="item.sysSettingValue"
                    :options="[
                      { label: '是', value: 'true' },
                      { label: '否', value: 'false' }
                    ]"
                  />
                  <el-input-number v-else-if="item.sysSettingValueType == 'number'" v-model="item.sysSettingValue" inline-prompt />
                  <el-input v-else-if="item.sysSettingValueType == 'array'" v-model="item.sysSettingValue" type="textarea" :rows="3" inline-prompt />
                  <el-input v-else v-model="item.sysSettingValue" inline-prompt />
                </el-form-item>
                <el-row class="mt-24" />
                <el-form-item class="justify-start">
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
