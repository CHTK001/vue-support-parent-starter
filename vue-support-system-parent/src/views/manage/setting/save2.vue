<script>
import { defineComponent } from "vue";
import { fetchSetting, fetchUpdateSetting, fetchSaveSetting } from "@/api/manage/setting";
import { transformI18n } from "@/plugins/i18n";
import Save from "@iconify-icons/ep/refresh";
import { message } from "@/utils/message";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
export default defineComponent({
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
    async submit(item) {
      this.loading = true;
      var res = {};
      if (this.mode === "save") {
        res = await fetchSaveSetting(item);
      } else if (this.mode === "edit") {
        res = await fetchUpdateSetting(item);
      }

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
    <el-drawer v-model="visible" size="30%" :close-on-click-modal="false" :close-on-press-escape="false" draggable :title="title" @close="close">
      <div v-if="!layoutLoading">
        <el-empty v-if="!groupList || groupList.length == 0" />
        <ul v-else class="setting">
          <li v-for="(item, $index) in groupList" :key="$index" :title="item.sysSettingRemark">
            <div style="font-size: 15px; line-height: 15px">{{ item.sysSettingRemark || item.sysSettingName }}</div>
            <el-form :inline="true">
              <el-form-item>
                <el-switch v-if="item.sysSettingValueType == 'bool'" v-model="item.sysSettingValue" active-value="true" inactive-value="false" inline-prompt @change="submit(item)" />
                <el-input-number v-else-if="item.sysSettingValueType == 'number'" v-model="item.sysSettingValue" inline-prompt />
                <el-input v-else v-model="item.sysSettingValue" inline-prompt />
              </el-form-item>
              <el-form-item v-if="item.sysSettingValueType !== 'bool'">
                <el-button class="ml-1" :icon="Save" @click="submit(item)" />
              </el-form-item>
            </el-form>
          </li>
        </ul>
      </div>
      <el-skeleton v-else animated />
    </el-drawer>
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
