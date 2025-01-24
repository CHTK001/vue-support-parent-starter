<script>
import { fetchListDictItem } from "@repo/core";
import { fetchSaveSfc, fetchUpdateSfc } from "@repo/core";
import { defineAsyncComponent } from "vue";

import { IconSelect } from "@repo/components/ReIcon";
import { message } from "@repo/utils";
import { clearObject } from "@repo/config";
import { debounce } from "@pureadmin/utils";
import { useI18n } from "vue-i18n";
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import ScFormTable from "@repo/components/ScFormTable/index.vue";
const ScCodeEditor = defineAsyncComponent(() => import("@repo/components/ScCodeEditor/index.vue"));
import CodeLayout from "./code.vue";
export default {
  components: { IconSelect, ScCodeEditor, CodeLayout, ScFormTable },
  props: {
    sysSecretFunctions: {
      type: Array,
      default: () => [],
    },
  },
  data() {
    return {
      form: {},
      visible: false,
      visibleCodeLayout: false,
      rules: {
        sysSfcName: [{ required: true, message: "请输入组件名称", trigger: "blur" }],
        sysSfcChineseName: [{ required: true, message: "请输入组件中文名称", trigger: "blur" }],
        sysSfcFunction: [{ required: true, message: "请输入组件功能", trigger: "blur" }],
        sysSfcCategory: [{ required: true, message: "请选择支持同步功能", trigger: "blur" }],
        sysSfcIcon: [{ required: true, message: "请选择组件图标", trigger: "blur" }],
        sysSfcVersion: [{ required: true, message: "请输入组件版本号", trigger: "blur" }],
        sysSfcType: [{ required: true, message: "请选择组件类型", trigger: "blur" }],
      },
      loading: false,
      title: "",
      mode: "save",
      dictItem: [],
      options: {
        col: 300,
        height: 1000,
        hintOptions: {
          // 自定义提示选项
          completeSingle: false,
        },
      },
      env: {
        name: "",
        value: "",
      },
      profile: [],
      menuTypeOptions: [
        {
          label: "文件式",
          value: 0,
        },
        {
          label: "代码式",
          value: 1,
        },
        {
          label: "远程地址",
          value: 2,
        },
        {
          label: "本地地址",
          value: 3,
        },
      ],
      sysSfcCategoryCollection: [
        {
          label: "主页",
          value: "HOME",
        },
      ],
      t: null,
    };
  },
  mounted() {
    const { t } = useI18n();
    this.initialize();
    this.t = t;
  },
  methods: {
    useRenderIcon,
    async initialize() {
      fetchListDictItem({
        sysDictId: 5,
      }).then((res) => {
        this.dictItem = res?.data;
      });
    },
    async close() {
      this.visible = false;
      this.loading = false;
      clearObject(this.form);
    },
    setData(data) {
      Object.assign(this.form, data);
      try {
        this.profile = JSON.parse(this.form.sysSfcModelCache);
      } catch (error) {}
      if (!this.form.sysSfcCategory) {
        this.form.sysSfcCategory = [];
      } else {
        this.form.sysSfcCategory = this.form.sysSfcCategory && this.form.sysSfcCategory.length > 0 ? this.form.sysSfcCategory?.split(",") : [];
      }
      return this;
    },
    async open(mode = "save") {
      this.visible = true;
      this.mode = mode;
      if (mode == "save") {
        this.form.sysSfcVersion = "1.0.0";
      }
      this.title = mode == "save" ? this.t("message.save") : this.t("message.edit");
    },
    debounce(fn, time, immediate) {
      return debounce(fn, time, immediate);
    },
    handlePreview() {
      this.visibleCodeLayout = true;
      this.$nextTick(() => {
        this.$refs.codeLayoutRef.setData(this.form);
        this.$refs.codeLayoutRef.open();
      });
    },
    handleUpdateValue(value) {
      this.form.sysSfcContent = value;
    },
    addRow() {
      this.profile.push(this.env);
    },
    submit() {
      this.$refs.dialogForm.validate(async (valid) => {
        if (valid) {
          this.loading = true;
          var res = {};
          const newForm = {};
          Object.assign(newForm, this.form);
          newForm.sysSfcModelCache = JSON.stringify(this.profile);
          if (this.mode === "save") {
            res = await fetchSaveSfc(newForm);
          } else if (this.mode === "edit") {
            res = await fetchUpdateSfc(newForm);
          }

          if (res && res.code == "00000") {
            this.$emit("success", newForm);
            this.$emit("close");
            this.visible = false;
          } else {
            message(res?.msg, { type: "error" });
          }
        }
        this.loading = false;
      });
    },
  },
};
</script>
<template>
  <div>
    <el-dialog v-model="visible" :close-on-click-modal="false" :close-on-press-escape="false" :destroy-on-close="true" draggable :title="title" @close="close">
      <el-form ref="dialogForm" :model="form" :rules="rules" :disabled="mode == 'show'" label-width="100px">
        <el-row>
          <el-col :span="12">
            <el-form-item label="组件名称" prop="sysSfcName">
              <el-input v-model="form.sysSfcName" placeholder="请输入组件名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="中文名称" prop="sysSfcChineseName">
              <el-input v-model="form.sysSfcChineseName" placeholder="请输入组件中文名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="组件功能" prop="sysSfcFunction">
              <el-select v-model="form.sysSfcFunction" placeholder="请选择组件功能" filterable multiple>
                <el-option v-for="item in dictItem" :key="item.sysDictItemName" :label="item.sysDictItemName" :value="item.sysDictItemName" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="组件图标" prop="sysSfcIcon">
              <IconSelect v-model="form.sysSfcIcon" class="w-full" />
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="分类" prop="sysSfcCategory">
              <el-select v-model="form.sysSfcCategory" placeholder="请选择支持同步功能" filterable multiple>
                <el-option v-for="item in sysSfcCategoryCollection" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="版本号" prop="sysSfcVersion">
              <el-input v-model="form.sysSfcVersion" placeholder="请输入版本号" />
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="代理服务" prop="sysSfcProxy">
              <el-input v-model="form.sysSfcProxy" placeholder="请输入代理服务" />
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="组件类型" prop="sysSfcType">
              <el-segmented v-model="form.sysSfcType" :options="menuTypeOptions" />
            </el-form-item>
          </el-col>

          <el-col v-if="form.sysSfcType === 1" :span="24">
            <el-form-item label="组件文本" prop="sysSfcContent">
              <template #label>
                <span class="text-sm">组件文本</span>
                <el-icon class="top-[2px] cursor-pointer" @click="handlePreview">
                  <component :is="useRenderIcon('humbleicons:eye')" />
                </el-icon>
              </template>
              <sc-code-editor v-model="form.sysSfcContent" style="width: 100%" :options="options" mode="vue" />
            </el-form-item>
          </el-col>

          <el-col v-if="form.sysSfcDelay" :span="12">
            <el-form-item label="延迟时间" prop="sysSfcPath">
              <el-input v-model="form.sysSfcDelay" placeholder="请输入组件延迟加载时间" type="number" />
            </el-form-item>
          </el-col>
          <el-col v-if="form.sysSfcTimeout" :span="12">
            <el-form-item label="超时时间" prop="sysSfcPath">
              <el-input v-model="form.sysSfcTimeout" placeholder="请输入组件超时时间" type="number" />
            </el-form-item>
          </el-col>

          <el-col v-if="form.sysSfcType === 2 || form.sysSfcType === 3" :span="24">
            <el-form-item label="远程地址" prop="sysSfcPath">
              <el-input v-model="form.sysSfcPath" placeholder="请输入远程文件地址" />
            </el-form-item>
          </el-col>

          <!-- <el-col :span="24">
            <el-form-item label="模块缓存" prop="sysSfcModelCache">
              <ScFormTable v-model="profile" :add-template="env">
                <el-table-column prop="name" label="模块" width="120px">
                  <template #default="{ row }">
                    <el-input v-model="row.name" placeholder="请输入参数名" />
                  </template>
                </el-table-column>
                <el-table-column prop="value" label="参数值">
                  <template #default="{ row }">
                    <el-input v-model="row.value" placeholder="请输入参数值" />
                  </template>
                </el-table-column>
              </ScFormTable>
            </el-form-item>
          </el-col> -->

          <el-col :span="24">
            <el-form-item label="组件描述" prop="sysSfcDesc">
              <el-input v-model="form.sysSfcDesc" placeholder="请输入组件描述" type="textarea" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>

      <template #footer>
        <el-button @click="visible = false">取 消</el-button>
        <el-button v-if="mode != 'show'" type="primary" :loading="loading" @click="debounce(submit(), 1000, true)">保 存</el-button>
      </template>
    </el-dialog>

    <CodeLayout v-if="visibleCodeLayout" ref="codeLayoutRef" @updateValue="handleUpdateValue" />
  </div>
</template>
